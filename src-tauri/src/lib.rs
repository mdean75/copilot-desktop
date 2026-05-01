mod auth;
mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|_app| {
            #[cfg(any(target_os = "linux", windows))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                app.deep_link().register_all()?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            auth::start_device_auth,
            auth::store_token,
            auth::get_token,
            auth::delete_token,
            storage::save_conversation,
            storage::load_conversation,
            storage::delete_conversation,
            storage::list_conversations,
            storage::save_skill,
            storage::load_skill,
            storage::delete_skill,
            storage::list_skills,
            storage::save_settings,
            storage::load_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
