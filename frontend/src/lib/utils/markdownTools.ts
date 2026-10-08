import type { EditorView } from 'codemirror';

/**
 * Formats a Markdown table string so that all column pipes '|' are vertically aligned
 * and delimiter rows match specified alignment (:---, :---:, ---:).
 */
export function formatMarkdownTable(tableText: string): string {
  const lines = tableText
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.includes('|'));

  if (lines.length < 2) return tableText;

  // Parse rows into trimmed cells
  const rows = lines.map((line) => {
    const cleaned = line.replace(/^\|/, '').replace(/\|$/, '');
    return cleaned.split('|').map((cell) => cell.trim());
  });

  const colCount = Math.max(...rows.map((r) => r.length));
  const colWidths: number[] = Array(colCount).fill(3);

  // Determine alignments from line index 1 (the separator row)
  const delimiterRow = rows[1] || [];
  const alignments = Array.from({ length: colCount }, (_, idx) => {
    const d = delimiterRow[idx] || '';
    const hasLeft = d.startsWith(':');
    const hasRight = d.endsWith(':');
    if (hasLeft && hasRight) return 'center';
    if (hasRight) return 'right';
    return 'left';
  });

  // Calculate maximum cell widths (ignore delimiter row in width calc)
  rows.forEach((row, rowIdx) => {
    if (rowIdx === 1) return;
    row.forEach((cell, colIdx) => {
      colWidths[colIdx] = Math.max(colWidths[colIdx] || 0, cell.length);
    });
  });

  // Format all rows with padding
  return rows
    .map((row, rowIdx) => {
      if (rowIdx === 1) {
        // Render delimiter row
        const delims = colWidths.map((w, colIdx) => {
          const align = alignments[colIdx];
          const minW = Math.max(3, w);
          if (align === 'center') {
            return `:${'-'.repeat(Math.max(1, minW - 2))}:`;
          }
          if (align === 'right') {
            return `${'-'.repeat(Math.max(2, minW - 1))}:`;
          }
          return `:${'-'.repeat(Math.max(2, minW - 1))}`;
        });
        return `| ${delims.join(' | ')} |`;
      }

      const cells = colWidths.map((w, colIdx) => {
        const cell = row[colIdx] || '';
        const align = alignments[colIdx];
        if (align === 'right') return cell.padStart(w, ' ');
        if (align === 'center') {
          const padTotal = Math.max(0, w - cell.length);
          const padLeft = Math.floor(padTotal / 2);
          const padRight = padTotal - padLeft;
          return `${' '.repeat(padLeft)}${cell}${' '.repeat(padRight)}`;
        }
        return cell.padEnd(w, ' ');
      });
      return `| ${cells.join(' | ')} |`;
    })
    .join('\n');
}

/**
 * Converts an HTML <table> element into a standard GitHub Flavored Markdown (GFM) table.
 */
export function htmlTableToMarkdown(tableEl: HTMLTableElement): string {
  const rows: string[][] = [];
  const trElements = Array.from(tableEl.querySelectorAll('tr'));

  trElements.forEach((tr) => {
    const cells = Array.from(tr.querySelectorAll('th, td')).map((cell) => {
      return (cell.textContent || '').replace(/\r?\n+/g, ' ').replace(/\|/g, '\\|').trim();
    });
    if (cells.length > 0) {
      rows.push(cells);
    }
  });

  if (rows.length === 0) return '';

  const maxCols = Math.max(...rows.map((r) => r.length));
  const normalizedRows = rows.map((r) => {
    while (r.length < maxCols) r.push('');
    return r;
  });

  const headerRow = normalizedRows[0];
  const delimRow = Array(maxCols).fill('---');
  const bodyRows = normalizedRows.slice(1);

  const rawTable = [
    `| ${headerRow.join(' | ')} |`,
    `| ${delimRow.join(' | ')} |`,
    ...bodyRows.map((r) => `| ${r.join(' | ')} |`),
  ].join('\n');

  return formatMarkdownTable(rawTable);
}

/**
 * Converts Tab-Separated Values (TSV from Excel / Google Sheets) into a Markdown table.
 */
export function tsvToMarkdown(tsvText: string): string {
  const lines = tsvText
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return '';

  const rows = lines.map((line) => line.split('\t').map((c) => c.replace(/\|/g, '\\|').trim()));
  const maxCols = Math.max(...rows.map((r) => r.length));

  if (maxCols < 2 && rows.length < 2) {
    return tsvText;
  }

  const headerRow = rows[0];
  while (headerRow.length < maxCols) headerRow.push('');
  const delimRow = Array(maxCols).fill('---');
  const bodyRows = rows.slice(1).map((r) => {
    while (r.length < maxCols) r.push('');
    return r;
  });

  const rawTable = [
    `| ${headerRow.join(' | ')} |`,
    `| ${delimRow.join(' | ')} |`,
    ...bodyRows.map((r) => `| ${r.join(' | ')} |`),
  ].join('\n');

  return formatMarkdownTable(rawTable);
}

/**
 * Generates a Hierarchical Table of Contents from Markdown headings.
 */
export function generateToc(markdownText: string): string {
  const lines = markdownText.split('\n');
  const tocEntries: string[] = [];

  lines.forEach((line) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const title = match[2].trim().replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      const anchor = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      const indent = '  '.repeat(Math.max(0, level - 1));
      tocEntries.push(`${indent}- [${title}](#${anchor})`);
    }
  });

  if (tocEntries.length === 0) {
    return '<!-- Tidak ada heading ditemukan untuk TOC -->';
  }

  return `## Daftar Isi\n\n${tocEntries.join('\n')}\n`;
}

/**
 * Helper to wrap or insert text around the current selection in CodeMirror 6.
 */
export function wrapSelection(
  view: EditorView,
  prefix: string,
  suffix: string,
  placeholder = 'teks'
) {
  const state = view.state;
  const selection = state.selection.main;
  const selectedText = state.sliceDoc(selection.from, selection.to);

  if (selectedText.length > 0) {
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: `${prefix}${selectedText}${suffix}`,
      },
      selection: {
        anchor: selection.from + prefix.length,
        head: selection.to + prefix.length,
      },
    });
  } else {
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: `${prefix}${placeholder}${suffix}`,
      },
      selection: {
        anchor: selection.from + prefix.length,
        head: selection.from + prefix.length + placeholder.length,
      },
    });
  }
  view.focus();
}

/**
 * Inserts heading level at line start.
 */
export function insertHeading(view: EditorView, level: number) {
  const state = view.state;
  const selection = state.selection.main;
  const line = state.doc.lineAt(selection.from);
  const cleanText = line.text.replace(/^#{1,6}\s*/, '');
  const prefix = '#'.repeat(level) + ' ';

  view.dispatch({
    changes: {
      from: line.from,
      to: line.to,
      insert: `${prefix}${cleanText}`,
    },
  });
  view.focus();
}

/**
 * Inserts list prefix at line start.
 */
export function insertList(view: EditorView, type: 'bullet' | 'number' | 'task') {
  const state = view.state;
  const selection = state.selection.main;
  const line = state.doc.lineAt(selection.from);
  const prefix = type === 'bullet' ? '- ' : type === 'number' ? '1. ' : '- [ ] ';

  view.dispatch({
    changes: {
      from: line.from,
      to: line.from,
      insert: prefix,
    },
  });
  view.focus();
}

/**
 * Inserts a blank 3x3 table template.
 */
export function insertTableTemplate(view: EditorView, rows = 3, cols = 3) {
  const header = Array.from({ length: cols }, (_, i) => `Kolom ${i + 1}`).join(' | ');
  const delim = Array.from({ length: cols }, () => '---').join(' | ');
  const dataRows = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => `Baris ${r + 1} K${c + 1}`).join(' | ')
  );

  const raw = [`| ${header} |`, `| ${delim} |`, ...dataRows.map((dr) => `| ${dr} |`)].join('\n');
  const formatted = formatMarkdownTable(raw) + '\n\n';

  const selection = view.state.selection.main;
  view.dispatch({
    changes: { from: selection.from, to: selection.to, insert: formatted },
  });
  view.focus();
}
