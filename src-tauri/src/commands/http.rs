use reqwest::blocking::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Instant;

#[derive(Serialize, Deserialize, Debug)]
pub struct HttpRequest {
    pub method: String,
    pub url: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HttpResponse {
    pub status: u16,
    pub status_text: String,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub time: u64, // milliseconds
    pub size: usize, // bytes
}

#[tauri::command]
pub fn send_http_request(request: HttpRequest) -> Result<HttpResponse, String> {
    let start = Instant::now();
    
    // Create HTTP client
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    // Build request based on method
    let mut req_builder = match request.method.to_uppercase().as_str() {
        "GET" => client.get(&request.url),
        "POST" => client.post(&request.url),
        "PUT" => client.put(&request.url),
        "PATCH" => client.patch(&request.url),
        "DELETE" => client.delete(&request.url),
        "HEAD" => client.head(&request.url),
        "OPTIONS" => {
            // For OPTIONS, we'll use a custom request
            client.request(reqwest::Method::OPTIONS, &request.url)
        }
        _ => return Err(format!("Unsupported HTTP method: {}", request.method)),
    };

    // Add headers
    for (key, value) in request.headers.iter() {
        req_builder = req_builder.header(key, value);
    }

    // Add body if present (for POST, PUT, PATCH)
    if let Some(body) = request.body {
        if !body.is_empty() {
            req_builder = req_builder.body(body);
        }
    }

    // Send request
    let response = req_builder
        .send()
        .map_err(|e| format!("Failed to send request: {}", e))?;

    let elapsed = start.elapsed().as_millis() as u64;

    // Extract response details
    let status = response.status();
    let status_code = status.as_u16();
    let status_text = status.canonical_reason().unwrap_or("Unknown").to_string();

    // Extract response headers
    let mut response_headers = HashMap::new();
    for (key, value) in response.headers().iter() {
        if let Ok(value_str) = value.to_str() {
            response_headers.insert(key.to_string(), value_str.to_string());
        }
    }

    // Extract response body
    let body_bytes = response
        .bytes()
        .map_err(|e| format!("Failed to read response body: {}", e))?;
    
    let body_size = body_bytes.len();
    let body_text = String::from_utf8_lossy(&body_bytes).to_string();

    Ok(HttpResponse {
        status: status_code,
        status_text,
        headers: response_headers,
        body: body_text,
        time: elapsed,
        size: body_size,
    })
}

