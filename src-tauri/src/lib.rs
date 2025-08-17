use serde::{Deserialize, Serialize};
use tauri::Emitter;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use std::process::Stdio;

// Gemini API Structures
#[derive(Serialize)]
struct GeminiRequest {
    contents: Vec<Content>,
}

#[derive(Serialize)]
struct Content {
    parts: Vec<Part>,
}

#[derive(Serialize)]
struct Part {
    text: String,
}

#[derive(Deserialize, Debug)]
struct GeminiResponse {
    candidates: Vec<Candidate>,
}

#[derive(Deserialize, Debug)]
struct Candidate {
    content: ContentResponse,
}

#[derive(Deserialize, Debug)]
struct ContentResponse {
    parts: Vec<PartResponse>,
}

#[derive(Deserialize, Debug)]
struct PartResponse {
    text: String,
}

/// Asks the Gemini AI for a command suggestion or analysis.
#[tauri::command]
async fn ask_gemini(api_key: String, prompt: String) -> Result<String, String> {
    if api_key.is_empty() {
        return Err("API key is not set. Please add it in settings.".to_string());
    }

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={}",
        api_key
    );

    let client = reqwest::Client::new();

    let request_body = GeminiRequest {
        contents: vec![Content {
            parts: vec![Part { text: prompt }],
        }],
    };

    let res = client
        .post(&url)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let response_body = res.json::<GeminiResponse>().await.map_err(|e| e.to_string())?;
        if let Some(candidate) = response_body.candidates.get(0) {
            if let Some(part) = candidate.content.parts.get(0) {
                return Ok(part.text.clone());
            }
        }
        Err("Unexpected AI response format.".to_string())
    } else {
        let error_text = res.text().await.map_err(|e| e.to_string())?;
        Err(format!("API Error: {}", error_text))
    }
}

/// Executes a shell command and streams its output to the frontend.
#[tauri::command]
async fn execute_command(
    window: tauri::Window,
    command: String,
    args: Vec<String>,
) -> Result<(), String> {
    let full_command = format!("{} {}", command, args.join(" "));
    
    #[cfg(windows)]
    let mut child = Command::new("cmd")
        .args(&["/C", &full_command])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn command: {}", e))?;

    #[cfg(not(windows))]
    let mut child = Command::new("sh")
        .arg("-c")
        .arg(&full_command)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn command: {}", e))?;

    let stdout = child.stdout.take().expect("Failed to capture stdout");
    let stderr = child.stderr.take().expect("Failed to capture stderr");

    let window_stdout = window.clone();
    tokio::spawn(async move {
        let reader = BufReader::new(stdout);
        let mut lines = reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            window_stdout.emit("terminal-output", Some(line)).unwrap();
        }
    });

    let window_stderr = window.clone();
    tokio::spawn(async move {
        let reader = BufReader::new(stderr);
        let mut lines = reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            window_stderr.emit("terminal-output", Some(format!("[ERROR] {}", line))).unwrap();
        }
    });

    tokio::spawn(async move {
        let status = child.wait().await.expect("Child process encountered an error");
        let exit_code = status.code().unwrap_or(-1);
        window.emit("terminal-terminated", Some(format!("Process exited with code: {}", exit_code))).unwrap();
    });

    Ok(())
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![ask_gemini, execute_command])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
