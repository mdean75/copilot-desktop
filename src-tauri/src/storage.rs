use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use tauri::command;

fn data_dir() -> Result<PathBuf, String> {
    dirs::home_dir()
        .ok_or_else(|| "Cannot find home directory".to_string())
        .map(|h| h.join(".copilot-desktop"))
}

fn ensure_dirs() -> Result<PathBuf, String> {
    let base = data_dir()?;
    for sub in &["conversations", "agents", "mcp"] {
        fs::create_dir_all(base.join(sub)).map_err(|e| e.to_string())?;
    }
    Ok(base)
}

// ── Conversations ──────────────────────────────────────────────────────────

#[command]
pub fn save_conversation(id: String, data: Value) -> Result<(), String> {
    let path = ensure_dirs()?.join("conversations").join(format!("{id}.json"));
    fs::write(path, serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())
}

#[command]
pub fn load_conversation(id: String) -> Result<Value, String> {
    let path = data_dir()?.join("conversations").join(format!("{id}.json"));
    let json = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&json).map_err(|e| e.to_string())
}

#[command]
pub fn delete_conversation(id: String) -> Result<(), String> {
    let path = data_dir()?.join("conversations").join(format!("{id}.json"));
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Returns lightweight metadata (id, title, updatedAt, model) for every
/// conversation, used to populate the sidebar without loading full message history.
#[command]
pub fn list_conversations() -> Result<Vec<Value>, String> {
    let dir = ensure_dirs()?.join("conversations");
    let mut items = Vec::new();

    for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) != Some("json") {
            continue;
        }

        if let Ok(json) = fs::read_to_string(&path) {
            if let Ok(mut val) = serde_json::from_str::<Value>(&json) {
                // Strip messages to keep list payload small
                if let Some(obj) = val.as_object_mut() {
                    obj.remove("messages");
                }
                items.push(val);
            }
        }
    }

    // Sort newest first
    items.sort_by(|a, b| {
        let ta = a["updatedAt"].as_str().unwrap_or("");
        let tb = b["updatedAt"].as_str().unwrap_or("");
        tb.cmp(ta)
    });

    Ok(items)
}

// ── Agents ─────────────────────────────────────────────────────────────────

#[command]
pub fn save_agent(id: String, data: Value) -> Result<(), String> {
    let path = ensure_dirs()?.join("agents").join(format!("{id}.json"));
    fs::write(path, serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())
}

#[command]
pub fn load_agent(id: String) -> Result<Value, String> {
    let path = data_dir()?.join("agents").join(format!("{id}.json"));
    let json = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&json).map_err(|e| e.to_string())
}

#[command]
pub fn delete_agent(id: String) -> Result<(), String> {
    let path = data_dir()?.join("agents").join(format!("{id}.json"));
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[command]
pub fn list_agents() -> Result<Vec<Value>, String> {
    let dir = ensure_dirs()?.join("agents");
    let mut items = Vec::new();
    for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.path().extension().and_then(|s| s.to_str()) == Some("json") {
            if let Ok(json) = fs::read_to_string(entry.path()) {
                if let Ok(val) = serde_json::from_str::<Value>(&json) {
                    items.push(val);
                }
            }
        }
    }
    Ok(items)
}

// ── Skills (read from ~/.copilot/skills/) ──────────────────────────────────

#[command]
pub fn list_fs_skills() -> Result<Vec<Value>, String> {
    let skills_dir = dirs::home_dir()
        .ok_or_else(|| "Cannot find home directory".to_string())?
        .join(".copilot")
        .join("skills");

    if !skills_dir.exists() {
        return Ok(Vec::new());
    }

    let mut items = Vec::new();

    for entry in fs::read_dir(&skills_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let skill_md = entry.path().join("SKILL.md");
        if !skill_md.exists() {
            continue;
        }

        if let Ok(content) = fs::read_to_string(&skill_md) {
            if let Some(skill) = parse_skill_md(&content, entry.file_name().to_string_lossy().as_ref()) {
                items.push(skill);
            }
        }
    }

    Ok(items)
}

fn parse_skill_md(content: &str, dir_name: &str) -> Option<Value> {
    let content = content.trim();
    if !content.starts_with("---") {
        return Some(serde_json::json!({
            "name": dir_name,
            "description": "",
            "allowedTools": [],
            "body": content,
            "dirName": dir_name
        }));
    }

    let after_open = content.strip_prefix("---")?.trim_start_matches('\n');
    let close = after_open.find("\n---")?;
    let frontmatter = &after_open[..close];

    // Body is everything after the closing ---
    let body_start = close + 4; // skip "\n---"
    let body = after_open.get(body_start..).unwrap_or("").trim().to_string();

    let parsed: serde_yaml::Value = serde_yaml::from_str(frontmatter).ok()?;
    let map = parsed.as_mapping()?;

    let name = map.get("name")
        .and_then(|v| v.as_str())
        .unwrap_or(dir_name)
        .to_string();

    let description = map.get("description")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let allowed_tools: Vec<String> = map.get("allowed-tools")
        .and_then(|v| v.as_sequence())
        .map(|seq| {
            seq.iter()
                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                .collect()
        })
        .unwrap_or_default();

    Some(serde_json::json!({
        "name": name,
        "description": description,
        "allowedTools": allowed_tools,
        "body": body,
        "dirName": dir_name
    }))
}

// ── MCP server configs ─────────────────────────────────────────────────────

#[command]
pub fn save_mcp_server(id: String, data: Value) -> Result<(), String> {
    let path = ensure_dirs()?.join("mcp").join(format!("{id}.json"));
    fs::write(path, serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())
}

#[command]
pub fn load_mcp_server(id: String) -> Result<Value, String> {
    let path = data_dir()?.join("mcp").join(format!("{id}.json"));
    let json = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&json).map_err(|e| e.to_string())
}

#[command]
pub fn delete_mcp_server(id: String) -> Result<(), String> {
    let path = data_dir()?.join("mcp").join(format!("{id}.json"));
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[command]
pub fn list_mcp_servers() -> Result<Vec<Value>, String> {
    let dir = ensure_dirs()?.join("mcp");
    let mut items = Vec::new();
    for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.path().extension().and_then(|s| s.to_str()) == Some("json") {
            if let Ok(json) = fs::read_to_string(entry.path()) {
                if let Ok(val) = serde_json::from_str::<Value>(&json) {
                    items.push(val);
                }
            }
        }
    }
    Ok(items)
}

// ── Settings ───────────────────────────────────────────────────────────────

#[command]
pub fn save_settings(data: Value) -> Result<(), String> {
    let path = ensure_dirs()?.join("settings.json");
    fs::write(path, serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())
}

#[command]
pub fn load_settings() -> Result<Option<Value>, String> {
    let path = data_dir()?.join("settings.json");
    if !path.exists() {
        return Ok(None);
    }
    let json = fs::read_to_string(path).map_err(|e| e.to_string())?;
    Ok(Some(serde_json::from_str(&json).map_err(|e| e.to_string())?))
}
