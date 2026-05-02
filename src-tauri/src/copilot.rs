use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{command, AppHandle, Emitter};
use tokio::sync::Mutex;

/// Cached Copilot token state
struct CopilotTokenCache {
    token: String,
    expires_at: u64,
    chat_url: String,
}

pub struct CopilotState {
    cache: Arc<Mutex<Option<CopilotTokenCache>>>,
    client: Client,
}

impl CopilotState {
    pub fn new() -> Self {
        Self {
            cache: Arc::new(Mutex::new(None)),
            client: Client::new(),
        }
    }
}

#[derive(Deserialize)]
struct CopilotTokenResponse {
    token: String,
    expires_at: u64,
    #[serde(default)]
    endpoints: Option<CopilotEndpoints>,
}

#[derive(Deserialize)]
struct CopilotEndpoints {
    #[serde(default)]
    api: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_call_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<serde_json::Value>,
}

#[derive(Deserialize)]
struct ModelsResponse {
    data: Vec<CopilotModel>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ModelPolicy {
    #[serde(default)]
    pub state: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct CopilotModel {
    pub id: String,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub version: Option<String>,
    #[serde(default)]
    pub capabilities: Option<ModelCapabilities>,
    #[serde(default)]
    pub policy: Option<ModelPolicy>,
    #[serde(default)]
    pub model_picker_enabled: Option<bool>,
    #[serde(default)]
    pub preview: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ModelCapabilities {
    #[serde(default)]
    pub family: Option<String>,
    #[serde(default)]
    pub limits: Option<ModelLimits>,
    #[serde(rename = "type", default)]
    pub model_type: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ModelLimits {
    #[serde(default)]
    pub max_output_tokens: Option<u32>,
    #[serde(default)]
    pub max_prompt_tokens: Option<u32>,
}

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tools: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_choice: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    stream: Option<bool>,
}

const COPILOT_TOKEN_URL: &str = "https://api.github.com/copilot_internal/v2/token";
const DEFAULT_CHAT_URL: &str = "https://api.business.githubcopilot.com";

/// Exchange a GitHub token for a Copilot API token (cached)
/// Returns (token, chat_base_url)
async fn get_copilot_token(state: &CopilotState, github_token: &str) -> Result<(String, String), String> {
    let mut cache = state.cache.lock().await;

    // Return cached token if still valid (60s buffer)
    if let Some(ref cached) = *cache {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        if now < cached.expires_at.saturating_sub(60) {
            return Ok((cached.token.clone(), cached.chat_url.clone()));
        }
    }

    let resp = state
        .client
        .get(COPILOT_TOKEN_URL)
        .header("Authorization", format!("token {}", github_token))
        .header("Accept", "application/json")
        .header("Editor-Version", "vscode/1.100.0")
        .header("Editor-Plugin-Version", "copilot/1.200.0")
        .header("User-Agent", "CopilotDesktop/1.0.0")
        .send()
        .await
        .map_err(|e| format!("Token exchange request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!(
            "Copilot token exchange failed ({}): {}",
            status, body
        ));
    }

    let data: CopilotTokenResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse token response: {}", e))?;

    let token = data.token.clone();
    let chat_url = data
        .endpoints
        .and_then(|e| e.api)
        .unwrap_or_else(|| DEFAULT_CHAT_URL.to_string());

    *cache = Some(CopilotTokenCache {
        token: data.token,
        expires_at: data.expires_at,
        chat_url: chat_url.clone(),
    });

    Ok((token, chat_url))
}

/// Non-streaming chat completion (used for tool-calling rounds)
#[command]
pub async fn copilot_complete(
    state: tauri::State<'_, CopilotState>,
    github_token: String,
    model: String,
    messages: Vec<ChatMessage>,
    tools: Option<serde_json::Value>,
) -> Result<serde_json::Value, String> {
    let (copilot_token, chat_url) = get_copilot_token(&state, &github_token).await?;

    let body = ChatRequest {
        model,
        messages,
        tools: tools.clone(),
        tool_choice: if tools.is_some() {
            Some("auto".to_string())
        } else {
            None
        },
        stream: None,
    };

    let url = format!("{}/chat/completions", chat_url.trim_end_matches('/'));
    let resp = state
        .client
        .post(&url)
        .header("Authorization", format!("Bearer {}", copilot_token))
        .header("Content-Type", "application/json")
        .header("Editor-Version", "vscode/1.100.0")
        .header("Copilot-Integration-Id", "vscode-chat")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Chat request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Copilot API error ({}): {}", status, body));
    }

    resp.json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Failed to parse chat response: {}", e))
}

/// Streaming chat completion — emits chunks via Tauri events
#[command]
pub async fn copilot_stream(
    app: AppHandle,
    state: tauri::State<'_, CopilotState>,
    github_token: String,
    model: String,
    messages: Vec<ChatMessage>,
    request_id: String,
) -> Result<(), String> {
    let (copilot_token, chat_url) = get_copilot_token(&state, &github_token).await?;

    let body = ChatRequest {
        model,
        messages,
        tools: None,
        tool_choice: None,
        stream: Some(true),
    };

    let url = format!("{}/chat/completions", chat_url.trim_end_matches('/'));
    let resp = state
        .client
        .post(&url)
        .header("Authorization", format!("Bearer {}", copilot_token))
        .header("Content-Type", "application/json")
        .header("Editor-Version", "vscode/1.100.0")
        .header("Copilot-Integration-Id", "vscode-chat")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Stream request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Copilot API error ({}): {}", status, body));
    }

    // Spawn a task to read the SSE stream and emit events
    let event_id_chunk = format!("copilot://stream-chunk/{}", request_id);
    let event_id_done = format!("copilot://stream-done/{}", request_id);

    tokio::spawn(async move {
        use futures_util::StreamExt;
        let mut stream = resp.bytes_stream();
        let mut buffer = String::new();

        while let Some(chunk_result) = stream.next().await {
            match chunk_result {
                Ok(bytes) => {
                    buffer.push_str(&String::from_utf8_lossy(&bytes));
                    let lines: Vec<String> = buffer.split('\n').map(|s| s.to_string()).collect();
                    // Keep the last incomplete line in the buffer
                    buffer = lines.last().cloned().unwrap_or_default();

                    for line in &lines[..lines.len().saturating_sub(1)] {
                        if !line.starts_with("data: ") {
                            continue;
                        }
                        let data = line[6..].trim();
                        if data == "[DONE]" {
                            app.emit(&event_id_done, ()).ok();
                            return;
                        }
                        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(data) {
                            if let Some(content) = parsed
                                .get("choices")
                                .and_then(|c| c.get(0))
                                .and_then(|c| c.get("delta"))
                                .and_then(|d| d.get("content"))
                                .and_then(|c| c.as_str())
                            {
                                app.emit(&event_id_chunk, content).ok();
                            }
                        }
                    }
                }
                Err(_) => break,
            }
        }

        app.emit(&event_id_done, ()).ok();
    });

    Ok(())
}

/// List available models from the Copilot API
#[command]
pub async fn copilot_list_models(
    state: tauri::State<'_, CopilotState>,
    github_token: String,
) -> Result<Vec<CopilotModel>, String> {
    let (copilot_token, chat_url) = get_copilot_token(&state, &github_token).await?;

    let url = format!("{}/models", chat_url.trim_end_matches('/'));
    let resp = state
        .client
        .get(&url)
        .header("Authorization", format!("Bearer {}", copilot_token))
        .header("Accept", "application/json")
        .header("Editor-Version", "vscode/1.100.0")
        .header("Copilot-Integration-Id", "vscode-chat")
        .send()
        .await
        .map_err(|e| format!("Models request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Models API error ({}): {}", status, body));
    }

    let data: ModelsResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse models response: {}", e))?;

    Ok(data.data)
}

/// Clear the cached Copilot token
#[command]
pub async fn clear_copilot_token(state: tauri::State<'_, CopilotState>) -> Result<(), String> {
    let mut cache = state.cache.lock().await;
    *cache = None;
    Ok(())
}
