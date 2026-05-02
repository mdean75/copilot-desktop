mod auth;
mod copilot;
mod mcp_host;
mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .manage(mcp_host::McpHostState::new())
        .manage(copilot::CopilotState::new())
        .setup(|_app| {
            #[cfg(any(target_os = "linux", windows))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                _app.deep_link().register_all()?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            auth::start_device_auth,
            auth::store_token,
            auth::get_token,
            auth::delete_token,
            copilot::copilot_complete,
            copilot::copilot_stream,
            copilot::copilot_list_models,
            copilot::clear_copilot_token,
            storage::save_conversation,
            storage::load_conversation,
            storage::delete_conversation,
            storage::list_conversations,
            storage::save_agent,
            storage::load_agent,
            storage::delete_agent,
            storage::list_agents,
            storage::list_fs_skills,
            storage::save_mcp_server,
            storage::load_mcp_server,
            storage::delete_mcp_server,
            storage::list_mcp_servers,
            storage::save_settings,
            storage::load_settings,
            mcp_host::start_mcp_server,
            mcp_host::stop_mcp_server,
            mcp_host::get_mcp_server_tools,
            mcp_host::call_mcp_tool,
            mcp_host::list_running_mcp_servers,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
