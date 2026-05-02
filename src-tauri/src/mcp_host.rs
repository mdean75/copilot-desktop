use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, BufWriter, Read, Write};
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};
use std::sync::Mutex;
use tauri::{command, State};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct McpToolDef {
    pub name: String,
    pub description: String,
    pub input_schema: Value,
}

struct McpProcess {
    child: Child,
    stdin: BufWriter<ChildStdin>,
    stdout: BufReader<ChildStdout>,
    tools: Vec<McpToolDef>,
    next_id: i64,
}

pub struct McpHostState {
    servers: Mutex<HashMap<String, McpProcess>>,
}

impl McpHostState {
    pub fn new() -> Self {
        Self {
            servers: Mutex::new(HashMap::new()),
        }
    }
}

fn send_request(proc: &mut McpProcess, method: &str, params: Value) -> Result<Value, String> {
    let id = proc.next_id;
    proc.next_id += 1;

    let request = json!({
        "jsonrpc": "2.0",
        "id": id,
        "method": method,
        "params": params,
    });

    let mut line = serde_json::to_string(&request).map_err(|e| e.to_string())?;
    line.push('\n');
    proc.stdin
        .write_all(line.as_bytes())
        .map_err(|e| format!("Write failed: {e}"))?;
    proc.stdin.flush().map_err(|e| format!("Flush failed: {e}"))?;

    // Read until we find the response with matching id, skipping notifications
    let mut buf = String::new();
    loop {
        buf.clear();
        let n = proc
            .stdout
            .read_line(&mut buf)
            .map_err(|e| format!("Read failed: {e}"))?;
        if n == 0 {
            return Err("MCP server closed connection".to_string());
        }
        let resp: Value = match serde_json::from_str(&buf) {
            Ok(v) => v,
            Err(_) => continue,
        };
        // Skip notifications (no "id" field)
        if resp.get("id").is_none() {
            continue;
        }
        if resp["id"] == id {
            if let Some(err) = resp.get("error") {
                return Err(format!("MCP error: {err}"));
            }
            return Ok(resp["result"].clone());
        }
    }
}

fn send_notification(proc: &mut McpProcess, method: &str) -> Result<(), String> {
    let notif = json!({
        "jsonrpc": "2.0",
        "method": method,
    });
    let mut line = serde_json::to_string(&notif).map_err(|e| e.to_string())?;
    line.push('\n');
    proc.stdin
        .write_all(line.as_bytes())
        .map_err(|e| e.to_string())?;
    proc.stdin.flush().map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn start_mcp_server(
    id: String,
    command: String,
    args: Vec<String>,
    env: HashMap<String, String>,
    state: State<McpHostState>,
) -> Result<Vec<McpToolDef>, String> {
    let mut servers = state.servers.lock().map_err(|e| e.to_string())?;

    // Kill any existing process for this id
    if let Some(mut existing) = servers.remove(&id) {
        let _ = existing.child.kill();
    }

    let mut cmd = Command::new(&command);

    // Augment PATH so npx/node/python are findable outside a login shell.
    // Tauri apps on macOS inherit a minimal PATH that omits /usr/local/bin etc.
    let current_path = std::env::var("PATH").unwrap_or_default();
    let extra = "/usr/local/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/bin:/bin";
    let full_path = format!("{extra}:{current_path}");

    cmd.args(&args)
        .envs(&env)
        .env("PATH", full_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start '{command}': {e}"))?;

    let stdin = BufWriter::new(child.stdin.take().ok_or("Failed to open stdin")?);
    let stdout = BufReader::new(child.stdout.take().ok_or("Failed to open stdout")?);
    let mut stderr = child.stderr.take();

    let mut proc = McpProcess {
        child,
        stdin,
        stdout,
        tools: vec![],
        next_id: 1,
    };

    // MCP handshake — capture stderr on failure for a useful error message
    let init_result = send_request(
        &mut proc,
        "initialize",
        json!({
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": { "name": "copilot-desktop", "version": "0.1.0" }
        }),
    );
    if let Err(e) = init_result {
        let stderr_text = stderr
            .as_mut()
            .and_then(|s| {
                let mut buf = String::new();
                s.read_to_string(&mut buf).ok()?;
                Some(buf)
            })
            .unwrap_or_default();
        let detail = if stderr_text.trim().is_empty() {
            e
        } else {
            format!("{e}\n{}", stderr_text.trim())
        };
        return Err(detail);
    }

    send_notification(&mut proc, "notifications/initialized")?;

    // Discover available tools
    let tools_result = send_request(&mut proc, "tools/list", json!({}))?;
    let tools: Vec<McpToolDef> = tools_result["tools"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|t| {
            Some(McpToolDef {
                name: t["name"].as_str()?.to_string(),
                description: t["description"].as_str().unwrap_or("").to_string(),
                input_schema: t["inputSchema"].clone(),
            })
        })
        .collect();

    proc.tools = tools.clone();
    servers.insert(id, proc);

    Ok(tools)
}

#[command]
pub fn stop_mcp_server(id: String, state: State<McpHostState>) -> Result<(), String> {
    let mut servers = state.servers.lock().map_err(|e| e.to_string())?;
    if let Some(mut proc) = servers.remove(&id) {
        let _ = proc.child.kill();
    }
    Ok(())
}

#[command]
pub fn get_mcp_server_tools(
    id: String,
    state: State<McpHostState>,
) -> Result<Vec<McpToolDef>, String> {
    let servers = state.servers.lock().map_err(|e| e.to_string())?;
    servers
        .get(&id)
        .map(|p| p.tools.clone())
        .ok_or_else(|| format!("MCP server '{id}' is not running"))
}

#[command]
pub fn call_mcp_tool(
    server_id: String,
    tool_name: String,
    arguments: Value,
    state: State<McpHostState>,
) -> Result<String, String> {
    let mut servers = state.servers.lock().map_err(|e| e.to_string())?;
    let proc = servers
        .get_mut(&server_id)
        .ok_or_else(|| format!("MCP server '{server_id}' is not running"))?;

    let result = send_request(
        proc,
        "tools/call",
        json!({ "name": tool_name, "arguments": arguments }),
    )?;

    // MCP returns an array of content blocks
    let text = result["content"]
        .as_array()
        .cloned()
        .unwrap_or_default()
        .iter()
        .filter_map(|block| {
            if block["type"].as_str() == Some("text") {
                block["text"].as_str().map(|s| s.to_string())
            } else {
                serde_json::to_string(block).ok()
            }
        })
        .collect::<Vec<_>>()
        .join("\n");

    Ok(text)
}

#[command]
pub fn list_running_mcp_servers(state: State<McpHostState>) -> Result<Vec<String>, String> {
    let servers = state.servers.lock().map_err(|e| e.to_string())?;
    Ok(servers.keys().cloned().collect())
}
