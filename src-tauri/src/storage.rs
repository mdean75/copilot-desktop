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
    for sub in &["conversations", "skills", "mcp"] {
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

// ── Skills ─────────────────────────────────────────────────────────────────

#[command]
pub fn save_skill(id: String, data: Value) -> Result<(), String> {
    let path = ensure_dirs()?.join("skills").join(format!("{id}.json"));
    fs::write(path, serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())
}

#[command]
pub fn load_skill(id: String) -> Result<Value, String> {
    let path = data_dir()?.join("skills").join(format!("{id}.json"));
    let json = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&json).map_err(|e| e.to_string())
}

#[command]
pub fn delete_skill(id: String) -> Result<(), String> {
    let path = data_dir()?.join("skills").join(format!("{id}.json"));
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[command]
pub fn list_skills() -> Result<Vec<Value>, String> {
    let dir = ensure_dirs()?.join("skills");
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
