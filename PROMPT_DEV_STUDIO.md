# 🚀 MASTER DEV PROMPT — CAMark Next-Gen Markdown & Knowledge Studio

```text
You are an elite Full-Stack Rust and Svelte 5 Desktop Systems Architect.
Your mission is to develop the complete next-generation Markdown & Knowledge Studio features for CAMark located at /home/cecepazhar/Product/camark.

# 1. CORE ARCHITECTURE & DESIGN SYSTEM CONSTRAINTS
- Product: CAMark — Zero-Knowledge Offline-First Markdown & Knowledge Studio.
- Tech Stack:
  * Backend: Rust workspace (`crates/caf-core`, `crates/caf-app`, `crates/caf-cli`).
  * Frontend: SvelteKit 5 (Runes: $state, $derived, $effect, $props) + TailwindCSS 4 + CodeMirror 6.
  * Desktop Shell: Tauri v2 (Linux, Windows, macOS).
  * Storage: Dual-Engine (Plain Filesystem Directory + SQLCipher AES-256 Zero-Knowledge Encrypted Vault).
  * Design Standard: CATerm Pro System (Cyan #06B6D4 accent, dark #0A0A0C background, hairline border #262626, frameless drag region, zero UI glitch).
- Non-Negotiables:
  * ZERO Mock Data: Every UI element, toggle, button, and menu must bind to real IPC Tauri commands.
  * ZERO Unhandled Errors: Map all Rust Result types into strict `CMRK-*` error taxonomy codes.
  * Local-First & Zero-Knowledge: Zero telemetry, zero unconsented network egress.

# 2. FEATURE SPECIFICATIONS TO IMPLEMENT

### F-1: Multi-Tab Document Workspace (Tabs Bar)
- State Store: `frontend/src/lib/stores/editorTabs.svelte.ts`
  * Model: `Tab { id, path, title, isDirty, scrollPos, isVaultDoc }`
  * Support: Open multiple files, switch active tab, close tab (with unsaved changes prompt), reorder tabs via drag/drop, keyboard shortcuts (`Ctrl+W` close tab, `Ctrl+Tab` next tab, `Ctrl+Shift+Tab` previous tab).
- UI: Horizontal scrollable tab bar below the TitleBar with close icon (x), dirty indicator dot (cyan pulse), and active tab highlight.

### F-2: Quick Switcher & Fuzzy Search (`Ctrl+P` / `Ctrl+O`)
- Command Palette Integration: Extend `frontend/src/lib/components/CommandPalette.svelte`.
- Behavior:
  * Trigger: `Ctrl+P` or `Ctrl+O`.
  * Index: In-memory cache of all workspace files + recent open tabs.
  * Fuzzy matching: Instant filtering with path highlight and keyboard arrow navigation (Up/Down/Enter).
  * Instant file switch without touching the file tree sidebar.

### F-3: Document Outline (TOC) Inspector
- Backend / Frontend Parser:
  * Extract headings (H1-H6) dynamically from active CodeMirror document with line numbers and heading depth.
- UI: Collapsible right-hand inspector panel / floating drawer.
- Interactivity: Click heading item -> smooth scroll CodeMirror viewport and place cursor at target line.

### F-4: Auto-Save, Word Count & Reading Metrics Status Bar
- Auto-Save Engine:
  * Debounced auto-save (configurable: 500ms / 1s / 2s after typing pause).
  * Dirty flag management: Mark dirty on keypress, clear on disk sync.
- Status Bar Component (`frontend/src/lib/components/EditorStatusBar.svelte`):
  * Metrics: Words count, Characters count, Lines count, Estimated reading time (`Math.ceil(words / 200)` min).
  * File format: UTF-8, Line Ending (LF/CRLF), File size in KB/MB.
  * Workspace sync pulse indicator (`● Saved`).

### F-5: Global Full-Text Workspace Search (`Ctrl+Shift+F`)
- Backend Rust Command: `crates/caf-app/src/fs_workspace.rs`
  * Command: `workspace_search_text(query: String, case_sensitive: bool, regex: bool) -> Result<Vec<SearchResult>, String>`
  * Engine: Parallel ripgrep/grep walk in Rust with ignore filter (`node_modules`, `target`, `.git`, `venv`).
- Frontend View: Dedicated search rail with match snippets, file grouping, and match count badge. Click match -> opens document at matching line and highlights selection.

### F-6: File Explorer Context Menu & Advanced File Operations
- Component: Context menu attached to `FileTreeNode.svelte` on right-click.
- Actions:
  * New File inside directory.
  * New Folder inside directory.
  * Rename (`F2` inline input).
  * Duplicate file (`filename_copy.md`).
  * Delete (confirmation modal, moves to trash or removes).
  * Reveal in OS File Manager (native shell open via Tauri plugin).

### F-7: Internal Wikilinks (`[[document]]`) Autocomplete
- CodeMirror Extension:
  * Trigger autocomplete when user types `[[`.
  * Suggest existing markdown filenames in workspace.
  * Render internal link in preview: Click link -> open corresponding file in editor tab.

### F-8: Native Export Engines (PDF, HTML, Rich Text)
- Rich Text Clipboard: 1-click copy rendered HTML to OS clipboard (`Ctrl+Shift+C`).
- Standalone HTML: Export with embedded typography, syntax highlight CSS, and theme.
- Paged PDF: Print dialog / headless print engine with print media styling, page numbers, and custom header/footer.

# 3. VERIFICATION & QUALITY GATES
1. Code Quality:
   - `cargo check --workspace` must exit 0 with 0 errors.
   - `cargo clippy --workspace` with 0 warnings.
   - `npm --prefix frontend run check` (svelte-check) must report 0 errors.
2. Automated Test Suite:
   - `cargo test --workspace` must pass 100%.
   - `npm --prefix frontend test` (Vitest) must pass 100%.
3. Physical Binary Verification:
   - `cargo build --release -p caf-app`
   - Test binary execution: check startup without crashes, verify memory footprint <= 80MB idle.
```
