//! Native Filesystem Workspace operations for CAMark (P1).

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::sync::Mutex;

static INITIAL_FILE: Mutex<Option<String>> = Mutex::new(None);

pub fn set_initial_file(path: String) {
    if let Ok(mut lock) = INITIAL_FILE.lock() {
        *lock = Some(path);
    }
}

pub fn get_initial_file_path() -> Option<String> {
    INITIAL_FILE.lock().ok().and_then(|mut lock| lock.take())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileNode>>,
    pub size_bytes: Option<u64>,
    pub modified_at: Option<u64>,
}

pub async fn list_dir(dir_path: String) -> Result<Vec<FileNode>, String> {
    tokio::task::spawn_blocking(move || {
        let path = Path::new(&dir_path);
        if !path.exists() || !path.is_dir() {
            return Err("Directory does not exist".to_string());
        }
        read_dir_recursive(path, 3)
    })
    .await
    .map_err(|e| e.to_string())?
}

pub async fn read_file(file_path: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        fs::read_to_string(&file_path).map_err(|e| format!("Failed to read file: {e}"))
    })
    .await
    .map_err(|e| e.to_string())?
}

pub async fn write_file(file_path: String, content: String) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let path = Path::new(&file_path);
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        fs::write(path, content).map_err(|e| format!("Failed to write file: {e}"))
    })
    .await
    .map_err(|e| e.to_string())?
}

pub async fn create_file(file_path: String) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let path = Path::new(&file_path);
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        if path.exists() {
            return Err("File already exists".to_string());
        }
        fs::write(path, "").map_err(|e| format!("Failed to create file: {e}"))
    })
    .await
    .map_err(|e| e.to_string())?
}

pub async fn rename_file(old_path: String, new_path: String) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        fs::rename(&old_path, &new_path).map_err(|e| format!("Failed to rename file: {e}"))
    })
    .await
    .map_err(|e| e.to_string())?
}

pub async fn delete_file(file_path: String) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let path = Path::new(&file_path);
        if path.is_dir() {
            fs::remove_dir_all(path).map_err(|e| format!("Failed to delete directory: {e}"))
        } else {
            fs::remove_file(path).map_err(|e| format!("Failed to delete file: {e}"))
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

fn read_dir_recursive(path: &Path, depth: u8) -> Result<Vec<FileNode>, String> {
    if depth == 0 {
        return Ok(vec![]);
    }
    let mut entries = Vec::new();
    let read = fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in read.flatten() {
        let p = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        if name.starts_with('.') {
            continue;
        }

        let is_dir = p.is_dir();
        let (size_bytes, modified_at) = if let Ok(meta) = p.metadata() {
            let size = if is_dir { None } else { Some(meta.len()) };
            let mod_time = meta
                .modified()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs());
            (size, mod_time)
        } else {
            (None, None)
        };

        if is_dir || name.ends_with(".md") || name.ends_with(".txt") || name.ends_with(".markdown") {
            entries.push(FileNode {
                name,
                path: p.to_string_lossy().to_string(),
                is_dir,
                children: if is_dir {
                    read_dir_recursive(&p, depth - 1).ok()
                } else {
                    None
                },
                size_bytes,
                modified_at,
            });
        }
    }

    entries.sort_by(|a, b| {
        if a.is_dir == b.is_dir {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        } else if a.is_dir {
            std::cmp::Ordering::Less
        } else {
            std::cmp::Ordering::Greater
        }
    });

    Ok(entries)
}
