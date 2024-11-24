// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use std::{fs, io, path::Path};

#[derive(Clone, serde::Serialize, serde::Deserialize)]
struct DirEntry {
    name: String,
    isDirectory: bool,
    isFile: bool,
    isSymlink: bool,
}

#[tauri::command]
fn read_dir(dir: &str) -> Vec<DirEntry> {
    print!("dir: {}\n", dir);
    collect_entries(Path::new(dir)).unwrap()
}

fn collect_entries(dir: &Path) -> io::Result<Vec<DirEntry>> {
    let mut entries = Vec::new();

    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            let metadata = entry.metadata()?;

            let dir_entry = DirEntry {
                name: path.to_string_lossy().to_string(),
                isDirectory: metadata.is_dir(),
                isFile: metadata.is_file(),
                isSymlink: metadata.file_type().is_symlink(),
            };

            entries.push(dir_entry);

            // ディレクトリの場合は再帰的に探索
            if metadata.is_dir() {
                entries.extend(collect_entries(&path)?);
            }
        }
    }

    Ok(entries)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![read_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
