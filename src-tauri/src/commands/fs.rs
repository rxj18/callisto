use crate::commands::models::fs::{CallistoConfig, Workspace, Collection, Request, Environment, Variable};
use std::fs::{self, File};
use std::io::Read;
use std::path::PathBuf;
use tauri::{Emitter, Manager};
use nanoid::nanoid;

fn get_config_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    // Create directory if it doesn't exist
    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    
    Ok(app_data_dir.join(".callisto.json"))
}

pub fn read_or_create_config(app_handle: &tauri::AppHandle) -> Result<CallistoConfig, String> {
    let config_path = get_config_path(app_handle)?;

    // If file doesn't exist → create it with sample data
    if !config_path.exists() {
        let default_config = CallistoConfig {
            version: "1.0".to_string(),
            workspaces: vec![],
            environments: vec![],
        };

        let json = serde_json::to_string_pretty(&default_config)
            .map_err(|e| format!("Failed to serialize sample config: {}", e))?;

        fs::write(&config_path, json).map_err(|e| format!("Failed to write default config file: {}", e))?;

        return Ok(default_config);
    }

    // if file exists then read existing JSON
    let mut file = File::open(&config_path).map_err(|e| format!("Failed to open config file: {}", e))?;

    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(|e| format!("Failed to read config file: {}", e))?;

    // Deserialize JSON
    let config: CallistoConfig = serde_json::from_str(&contents)
        .map_err(|e| format!("Invalid JSON in config file: {}", e))?;

    Ok(config)
}

#[tauri::command]
pub fn get_config(app_handle: tauri::AppHandle) -> Result<CallistoConfig, String> {
    read_or_create_config(&app_handle)
}

#[tauri::command]
pub fn add_workspace(name: &str, app_handle: tauri::AppHandle) -> Result<CallistoConfig, String> {
    let config_path = get_config_path(&app_handle)?;
    
    let mut config: CallistoConfig = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(_) => CallistoConfig { version: "1.0".to_string(), workspaces: vec![], environments: vec![] },
    };

    config.workspaces.push(Workspace {
        id: nanoid!(),
        name: name.to_string(),
        collections: vec![],
    });

    fs::write(&config_path, serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    // emit the event to frontend
    app_handle.emit("callisto-config", &config).map_err(|e| e.to_string())?;
    Ok(config)
}

#[tauri::command]
pub fn create_collection(
    workspace_id: &str,
    collection_name: &str,
    app_handle: tauri::AppHandle,
) -> Result<CallistoConfig, String> {
    let config_path = get_config_path(&app_handle)?;
    
    let mut config: CallistoConfig = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(_) => return Err("Config file not found".to_string()),
    };

    // Find the workspace and add collection
    let workspace = config
        .workspaces
        .iter_mut()
        .find(|w| w.id == workspace_id)
        .ok_or("Workspace not found")?;

    workspace.collections.push(Collection {
        id: nanoid!(),
        name: collection_name.to_string(),
        requests: vec![],
    });

    fs::write(&config_path, serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    // emit the event to frontend
    app_handle.emit("callisto-config", &config).map_err(|e| e.to_string())?;
    Ok(config)
}

#[tauri::command]
pub fn rename_collection(
    workspace_id: &str,
    collection_id: &str,
    new_name: &str,
    app_handle: tauri::AppHandle,
) -> Result<CallistoConfig, String> {
    let config_path = get_config_path(&app_handle)?;
    
    let mut config: CallistoConfig = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(_) => return Err("Config file not found".to_string()),
    };

    // Find the workspace and collection
    let workspace = config
        .workspaces
        .iter_mut()
        .find(|w| w.id == workspace_id)
        .ok_or("Workspace not found")?;

    let collection = workspace
        .collections
        .iter_mut()
        .find(|c| c.id == collection_id)
        .ok_or("Collection not found")?;

    collection.name = new_name.to_string();

    fs::write(&config_path, serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    // emit the event to frontend
    app_handle.emit("callisto-config", &config).map_err(|e| e.to_string())?;
    Ok(config)
}

#[tauri::command]
pub fn create_request(
    workspace_id: &str,
    collection_id: &str,
    request_name: &str,
    request_type: &str,
    method: &str,
    curl: &str,
    app_handle: tauri::AppHandle,
) -> Result<CallistoConfig, String> {
    let config_path = get_config_path(&app_handle)?;
    
    let mut config: CallistoConfig = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(_) => return Err("Config file not found".to_string()),
    };

    // Find the workspace and collection
    let workspace = config
        .workspaces
        .iter_mut()
        .find(|w| w.id == workspace_id)
        .ok_or("Workspace not found")?;

    let collection = workspace
        .collections
        .iter_mut()
        .find(|c| c.id == collection_id)
        .ok_or("Collection not found")?;

    collection.requests.push(Request {
        id: nanoid!(),
        name: request_name.to_string(),
        req_type: request_type.to_string(),
        method: method.to_string(),
        curl: curl.to_string(),
    });

    fs::write(&config_path, serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    // emit the event to frontend
    app_handle.emit("callisto-config", &config).map_err(|e| e.to_string())?;
    Ok(config)
}

#[tauri::command]
pub fn update_request(
    workspace_id: &str,
    collection_id: &str,
    request_id: &str,
    request_name: &str,
    request_type: &str,
    method: &str,
    curl: &str,
    app_handle: tauri::AppHandle,
) -> Result<CallistoConfig, String> {
    let config_path = get_config_path(&app_handle)?;
    
    let mut config: CallistoConfig = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(_) => return Err("Config file not found".to_string()),
    };

    // Find the workspace, collection, and request
    let workspace = config
        .workspaces
        .iter_mut()
        .find(|w| w.id == workspace_id)
        .ok_or("Workspace not found")?;

    let collection = workspace
        .collections
        .iter_mut()
        .find(|c| c.id == collection_id)
        .ok_or("Collection not found")?;

    let request = collection
        .requests
        .iter_mut()
        .find(|r| r.id == request_id)
        .ok_or("Request not found")?;

    // Update request fields
    request.name = request_name.to_string();
    request.req_type = request_type.to_string();
    request.method = method.to_string();
    request.curl = curl.to_string();

    fs::write(&config_path, serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    // emit the event to frontend
    app_handle.emit("callisto-config", &config).map_err(|e| e.to_string())?;
    Ok(config)
}

#[tauri::command]
pub fn delete_workspace(
    workspace_id: &str,
    app_handle: tauri::AppHandle,
) -> Result<CallistoConfig, String> {
    let config_path = get_config_path(&app_handle)?;
    
    let mut config: CallistoConfig = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(_) => return Err("Config file not found".to_string()),
    };

    // Remove the workspace
    config.workspaces.retain(|w| w.id != workspace_id);

    fs::write(&config_path, serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    // emit the event to frontend
    app_handle.emit("callisto-config", &config).map_err(|e| e.to_string())?;
    Ok(config)
}

#[tauri::command]
pub fn delete_collection(
    workspace_id: &str,
    collection_id: &str,
    app_handle: tauri::AppHandle,
) -> Result<CallistoConfig, String> {
    let config_path = get_config_path(&app_handle)?;
    
    let mut config: CallistoConfig = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(_) => return Err("Config file not found".to_string()),
    };

    // Find the workspace and remove collection
    let workspace = config
        .workspaces
        .iter_mut()
        .find(|w| w.id == workspace_id)
        .ok_or("Workspace not found")?;

    workspace.collections.retain(|c| c.id != collection_id);

    fs::write(&config_path, serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    // emit the event to frontend
    app_handle.emit("callisto-config", &config).map_err(|e| e.to_string())?;
    Ok(config)
}

#[tauri::command]
pub fn delete_request(
    workspace_id: &str,
    collection_id: &str,
    request_id: &str,
    app_handle: tauri::AppHandle,
) -> Result<CallistoConfig, String> {
    let config_path = get_config_path(&app_handle)?;
    
    let mut config: CallistoConfig = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(_) => return Err("Config file not found".to_string()),
    };

    // Find the workspace, collection, and remove request
    let workspace = config
        .workspaces
        .iter_mut()
        .find(|w| w.id == workspace_id)
        .ok_or("Workspace not found")?;

    let collection = workspace
        .collections
        .iter_mut()
        .find(|c| c.id == collection_id)
        .ok_or("Collection not found")?;

    collection.requests.retain(|r| r.id != request_id);

    fs::write(&config_path, serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    // emit the event to frontend
    app_handle.emit("callisto-config", &config).map_err(|e| e.to_string())?;
    Ok(config)
}

#[tauri::command]
pub fn create_environment(
    name: String,
    variables: Vec<Variable>,
    app_handle: tauri::AppHandle,
) -> Result<CallistoConfig, String> {
    let config_path = get_config_path(&app_handle)?;
    
    let mut config: CallistoConfig = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(_) => return Err("Config file not found".to_string()),
    };

    let new_environment = Environment {
        id: nanoid::nanoid!(),
        name,
        variables,
    };

    config.environments.push(new_environment);

    fs::write(&config_path, serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    // emit the event to frontend
    app_handle.emit("callisto-config", &config).map_err(|e| e.to_string())?;
    Ok(config)
}

#[tauri::command]
pub fn update_environment(
    environment_id: String,
    name: String,
    variables: Vec<Variable>,
    app_handle: tauri::AppHandle,
) -> Result<CallistoConfig, String> {
    let config_path = get_config_path(&app_handle)?;
    
    let mut config: CallistoConfig = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(_) => return Err("Config file not found".to_string()),
    };

    let environment = config
        .environments
        .iter_mut()
        .find(|e| e.id == environment_id)
        .ok_or("Environment not found")?;

    environment.name = name;
    environment.variables = variables;

    fs::write(&config_path, serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    // emit the event to frontend
    app_handle.emit("callisto-config", &config).map_err(|e| e.to_string())?;
    Ok(config)
}

#[tauri::command]
pub fn delete_environment(
    environment_id: String,
    app_handle: tauri::AppHandle,
) -> Result<CallistoConfig, String> {
    let config_path = get_config_path(&app_handle)?;
    
    let mut config: CallistoConfig = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(_) => return Err("Config file not found".to_string()),
    };

    config.environments.retain(|e| e.id != environment_id);

    fs::write(&config_path, serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    // emit the event to frontend
    app_handle.emit("callisto-config", &config).map_err(|e| e.to_string())?;
    Ok(config)
}