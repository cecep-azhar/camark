//! Native Markdown Multi-Format Exporter for CAMark (P5).

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportResult {
    pub success: bool,
    pub target_path: String,
    pub message: String,
}

pub async fn export_html(
    html_content: String,
    doc_title: String,
    target_path: String,
) -> Result<ExportResult, String> {
    tokio::task::spawn_blocking(move || export_html_sync(&html_content, &doc_title, &target_path))
        .await
        .map_err(|e| e.to_string())?
}

fn export_html_sync(
    html_content: &str,
    doc_title: &str,
    target_path: &str,
) -> Result<ExportResult, String> {
    let full_html = format!(
        r#"<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1a202c;
      max-width: 860px;
      margin: 40px auto;
      padding: 0 20px;
    }}
    table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
    th, td {{ border: 1px solid #cbd5e0; padding: 8px 12px; text-align: left; }}
    th {{ background-color: #f7fafc; }}
    code {{ background: #edf2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace; }}
    pre code {{ display: block; padding: 16px; overflow-x: auto; background: #2d3748; color: #f7fafc; }}
    blockquote {{ border-left: 4px solid #319795; margin: 0; padding-left: 16px; color: #4a5568; }}
  </style>
</head>
<body>
  <h1>{}</h1>
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <main>
    {}
  </main>
</body>
</html>"#,
        doc_title, doc_title, html_content
    );

    let path = Path::new(target_path);
    if let Some(p) = path.parent() {
        let _ = fs::create_dir_all(p);
    }
    fs::write(path, full_html).map_err(|e| format!("Failed to export HTML: {e}"))?;

    Ok(ExportResult {
        success: true,
        target_path: target_path.to_string(),
        message: "Dokumen HTML berhasil diexport".to_string(),
    })
}
