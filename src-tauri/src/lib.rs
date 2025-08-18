use serde::{Deserialize, Serialize};
use tauri::{Emitter, Manager, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use window_vibrancy::{self};
use tokio::process::{Command};
use std::process::Stdio;
use std::env;
use std::fs;
use tauri_plugin_global_shortcut::{ShortcutState};
use tokio::sync::Mutex;
use std::collections::HashMap;
use serde_json::Value;
use std::sync::Arc;

struct AppState {
    child_pid: Arc<Mutex<Option<u32>>>,
}

#[tauri::command]
fn get_current_dir() -> Result<String, String> {
    env::current_dir()
        .map(|path| path.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn list_dir_contents(path: String) -> Result<Vec<String>, String> {
    fs::read_dir(path)
        .map_err(|e| e.to_string())?
        .map(|res| res.map(|e| e.file_name().into_string().unwrap_or_default()))
        .collect::<Result<Vec<String>, std::io::Error>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_path_suggestions() -> Result<Vec<String>, String> {
    let path_var = env::var("PATH").unwrap_or_default();
    let mut suggestions = Vec::new();

    for path in env::split_paths(&path_var) {
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                if let Ok(metadata) = entry.metadata() {
                    if metadata.is_file() {
                        if let Some(filename) = entry.file_name().to_str() {
                            suggestions.push(filename.to_string());
                        }
                    }
                }
            }
        }
    }
    Ok(suggestions)
}

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
    state: State<'_, AppState>,
) -> Result<(), String> {
    if command == "cd" {
        let new_dir = args.get(0).map_or("..", |s| s.as_str());
        if let Err(e) = env::set_current_dir(new_dir) {
            window.emit("terminal-output", Some(format!("[ERROR] Failed to change directory: {}", e))).unwrap();
        } else {
            let new_path = env::current_dir().unwrap().to_string_lossy().to_string();
            window.emit("directory-changed", Some(new_path)).unwrap();
        }
        window
            .emit("terminal-terminated", Some("".to_string()))
            .unwrap();
        return Ok(());
    }

    let full_command = format!("{} {}", command, args.join(" "));
    let current_dir = env::current_dir().map_err(|e| e.to_string())?;

    #[cfg(windows)]
    let child_process = Command::new("cmd")
        .args(&["/C", &full_command])
        .current_dir(&current_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn();

    #[cfg(not(windows))]
    let child_process = Command::new("sh")
        .arg("-c")
        .arg(&full_command)
        .current_dir(&current_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn();

    let mut child = child_process.map_err(|e| format!("Failed to spawn command: {}", e))?;

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

    let pid = child.id().ok_or("Failed to get process ID")?;
    *state.child_pid.lock().await = Some(pid);

    let child_pid_handle = state.child_pid.clone();
    let window_clone = window.clone();
    tokio::spawn(async move {
        let status = child.wait().await;
        match status {
            Ok(exit_status) => {
                if !exit_status.success() {
                    window_clone
                        .emit(
                            "terminal-terminated",
                            Some(format!("Process exited with status: {}", exit_status)),
                        )
                        .unwrap();
                } else {
                    window_clone
                        .emit("terminal-terminated", Some("".to_string()))
                        .unwrap();
                }
            }
            Err(e) => {
                window_clone.emit("terminal-terminated", Some(format!("[ERROR] Process failed: {}", e))).unwrap();
            }
        }
        *child_pid_handle.lock().await = None;
    });

    Ok(())
}

#[tauri::command]
async fn kill_process(state: State<'_, AppState>) -> Result<(), String> {
    let mut pid_opt = state.child_pid.lock().await;
    if let Some(pid) = pid_opt.take() {
        #[cfg(windows)]
        {
            let status = Command::new("taskkill")
                .args(&["/PID", &pid.to_string(), "/T", "/F"])
                .status()
                .await
                .map_err(|e| e.to_string())?;
            if !status.success() {
                return Err("Failed to kill process tree".to_string());
            }
        }

        #[cfg(not(windows))]
        {
            let status = Command::new("pkill")
                .arg("-P")
                .arg(pid.to_string())
                .status()
                .await
                .map_err(|e| e.to_string())?;
            if !status.success() {
                // Fallback to kill if pkill is not available or fails
                let fallback_status = Command::new("kill")
                    .arg("-9")
                    .arg(pid.to_string())
                    .status()
                    .await
                    .map_err(|e| e.to_string())?;
                if !fallback_status.success() {
                    return Err("Failed to kill process".to_string());
                }
            }
        }
        *pid_opt = None;
        Ok(())
    } else {
        Err("No process to kill".to_string())
    }
}

#[tauri::command]
fn detect_package_manager() -> Result<String, String> {
    let current_dir = env::current_dir().map_err(|e| e.to_string())?;
    if current_dir.join("bun.lockb").exists() {
        Ok("bun".to_string())
    } else if current_dir.join("pnpm-lock.yaml").exists() {
        Ok("pnpm".to_string())
    } else if current_dir.join("yarn.lock").exists() {
        Ok("yarn".to_string())
    } else if current_dir.join("package-lock.json").exists() {
        Ok("npm".to_string())
    } else {
        Ok("npm".to_string()) // Default to npm
    }
}

#[tauri::command]
fn get_package_json_scripts() -> Result<HashMap<String, String>, String> {
    let current_dir = env::current_dir().map_err(|e| e.to_string())?;
    let package_json_path = current_dir.join("package.json");

    if !package_json_path.exists() {
        return Ok(HashMap::new());
    }

    let file_content = fs::read_to_string(package_json_path).map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&file_content).map_err(|e| e.to_string())?;

    let mut scripts = HashMap::new();
    if let Some(scripts_value) = json.get("scripts") {
        if let Some(scripts_map) = scripts_value.as_object() {
            for (key, value) in scripts_map {
                if let Some(value_str) = value.as_str() {
                    scripts.insert(key.clone(), value_str.to_string());
                }
            }
        }
    }

    Ok(scripts)
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<(), Box<dyn std::error::Error>> {
    let app_state = AppState {
        child_pid: Arc::new(Mutex::new(None)),
    };

    tauri::Builder::default()
        .manage(app_state)
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            if let Some(monitor) = window.current_monitor()? {
                let monitor_size = monitor.size();
                let window_height = 400.0;
                let window_width_percentage = 0.99;
                let window_width = (monitor_size.width as f64 * window_width_percentage) as u32;
                let x_position = 0;

                window.set_size(tauri::PhysicalSize::new(window_width, window_height as u32))?;
                window.set_position(tauri::PhysicalPosition::new(
                    x_position,
                    (monitor_size.height - window_height as u32 - 40) as i32,
                ))?;
            }

            #[cfg(target_os = "macos")]
            window_vibrancy::apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
                .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

            #[cfg(target_os = "windows")]
            window_vibrancy::apply_blur(&window, Some((18, 18, 18, 125)))
                .expect("Unsupported platform! 'apply_blur' is only supported on Windows");

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcut("alt+space")?
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("main") {
                            let is_minimized = window.is_minimized().unwrap_or(false);
                            let is_visible = window.is_visible().unwrap_or(false);

                            if is_visible && !is_minimized {
                                let _ = window.minimize();
                            } else {
                                if is_minimized {
                                    let _ = window.unminimize();
                                }
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            ask_gemini,
            execute_command,
            get_current_dir,
            list_dir_contents,
            get_path_suggestions,
            kill_process,
            detect_package_manager,
            get_package_json_scripts
        ])
        .run(tauri::generate_context!())?;
    Ok(())
}
