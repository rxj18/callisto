// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod commands;
use commands::fs::{read_or_create_config, get_config, add_workspace, create_collection, rename_collection, create_request, update_request, delete_workspace, delete_collection, delete_request, create_environment, update_environment, delete_environment};
use commands::http::send_http_request;
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let config = match read_or_create_config(&app.handle()) {
                Ok(cfg) => {
                    println!("✅ Config loaded successfully: {} workspaces", cfg.workspaces.len());
                    cfg
                },
                Err(e) => {
                    eprintln!("❌ Failed to load config: {}", e);
                    return Err(e.into());
                }
            };

            // Send config to frontend
            match app.emit("callisto-config", &config) {
                Ok(_) => println!("✅ Config emitted to frontend"),
                Err(e) => eprintln!("❌ Failed to emit config: {}", e),
            }
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_config,
            add_workspace,
            create_collection,
            rename_collection,
            create_request,
            update_request,
            delete_workspace,
            delete_collection,
            delete_request,
            create_environment,
            update_environment,
            delete_environment,
            send_http_request,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
