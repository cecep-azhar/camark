# CAMark — High-Performance Zero-Knowledge Markdown Studio

[![Release](https://img.shields.io/badge/release-v0.1.3-06b6d4.svg)](https://github.com/cecep-azhar/camark)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Linux%20|%20Windows%20|%20macOS%20|%20Android-green.svg)]()
[![CADS](https://img.shields.io/badge/CADS-v1.0%20Compliant-purple.svg)]()

> Sovereign, Local-First, Zero-Knowledge Markdown & Knowledge Studio yang dibangun dengan performa tinggi (<35 MB RAM, cold-start <1 detik), live-preview 60 FPS, enkripsi SQLCipher + Argon2id, serta integrasi AI Co-Pilot lokal/cloud.

---

## 🌟 Fitur Utama

- **Dual-Storage Engine**:
  - **Open Filesystem Mode**: Buka, jelajah, dan edit folder/file `.md` lokal biasa secara instan (kompatibel penuh dengan Obsidian, VS Code, Logseq, Typora).
  - **Zero-Knowledge Encrypted Vault**: Simpan catatan rahasia dan dokumen sensitif dalam database terenkripsi **SQLCipher + Argon2id** (terlindungi Master Password & PIN profil).
- **Editor Presisi & Smooth Sync-Scroll**:
  - **CodeMirror 6** editor dengan syntax highlighting Markdown/GFM lengkap.
  - Sinkronisasi kursor editor dan live preview 60 FPS tanpa jeda / stuttering.
  - 3 Mode tampilan: *Split View*, *Zen Mode (Distraction-Free Typewriter)*, dan *Reading View*.
  - Render instan untuk rumus matematika **KaTeX** (`$...$`, `$$...$$`) dan diagram alur **Mermaid.js**.
  - **Auto Table Formatter** & Smart Paste (konversi data tabel Excel/web ke Markdown).
  - **Marp Presentation Mode**: Render slide presentasi langsung dari Markdown.
- **AI Writing Co-Pilot (Privacy-First)**:
  - Local AI via Ollama atau Cloud BYO-Key (OpenAI/9Router).
  - Grammar checker, tone humanizer, generator Daftar Isi (TOC), dan perapih sintaks.
  - Privacy Scrubber otomatis menyaring data sensitif sebelum dikirim ke AI.
- **Export Engine Lengkap**:
  - Export PDF berstandar cetak/akademik.
  - Standalone HTML dan Copy as Rich Text Formatted untuk ditempel ke Word / Email.
- **CADS v1.0 & Sovereign UI**:
  - Mengikuti standar desain CADS v1.0 (*Dark Obsidian*, aksen *Cyan*, SvelteKit native routing).

---

## 🏗️ Arsitektur Teknologi

- **Backend**: Rust 2024 (Edition 2024), Tauri v2.
- **Frontend**: Svelte 5 (Runes), Tailwind CSS v4, CADS v1.0 Component Tokens.
- **Penyimpanan**: Native Filesystem I/O + SQLCipher 4 terenkripsi.
- **Editor**: CodeMirror 6, Marked, DOMPurify, KaTeX, Mermaid.js.

---

## 🚀 Panduan Menjalankan

### Kebutuhan Sistem
- Rust 1.85+ (Edition 2024)
- Node.js 20+ & npm

### Development
```bash
# Masuk ke folder proyek
cd ~/Product/camark

# Jalankan dev mode Tauri
cargo tauri dev
```

### Build Rilis
```bash
# Build binary rilis desktop
cargo tauri build
```

---

## 📄 Lisensi
Didistribusikan di bawah lisensi MIT. Hak Cipta © 2026 Fathforce / Cecep Saeful Azhar Hidayat.
