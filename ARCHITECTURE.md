# CAMark Architecture

## 1. Overview
CAMark adalah sovereign, local-first markdown and knowledge studio. Arsitektur dibangun di atas dual-storage model: native filesystem I/O dan zero-knowledge SQLCipher encrypted database.

## 2. Layering

```
+-------------------------------------------------------------+
|                  CADS v1.0 UI (Svelte 5 Runes)               |
|  - SvelteKit Routing (/, /workspace, /vault, /copilot, ...) |
|  - CodeMirror 6 Editor Engine & Live Preview (KaTeX/Mermaid)|
|  - CADS Tokens (Cyan Accent, Dark Obsidian #0A0A0C)         |
+-------------------------------------------------------------+
                             |  IPC (Tauri Commands)
+-------------------------------------------------------------+
|                    Tauri v2 Application                     |
|  - Window management & Native Menus                         |
|  - Security & IPC Command Dispatch                          |
+-------------------------------------------------------------+
                             |
+-------------------------------------------------------------+
|                      Rust 2024 Core                         |
|  - Native Filesystem Engine (Watcher, Recursive Tree)       |
|  - SQLCipher Encrypted Vault Engine (Argon2id KEK/DEK)      |
|  - AI Assistant Proxy & Scrubber Layer                      |
|  - PDF / HTML Export Pipeline                               |
+-------------------------------------------------------------+
```

## 3. Storage Model
1. **Open Workspace**: Akses langsung file Markdown `.md` pada filesystem lokal pengguna. Tidak ada format lock-in.
2. **Encrypted Vault**: Database terenkripsi SQLCipher (`camark.db`). Kunci derivasi menggunakan Argon2id dari Master Password / PIN profil.

## 4. UI Design System (CADS v1.0)
- Palet: Dark Obsidian `#0A0A0C` dengan aksen `#06b6d4` (Cyan).
- Layout 3-pane: Sidebar Navigasi / File Tree, Editor CodeMirror 6, Live Preview rendered sync-scroll 60 FPS.
