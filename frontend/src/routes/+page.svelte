<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { listen } from '@tauri-apps/api/event';
  import { EditorView, basicSetup } from 'codemirror';
  import { markdown } from '@codemirror/lang-markdown';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import katex from 'katex';
  import mermaid from 'mermaid';
  import { getLayoutState } from '$lib/stores/layoutState.svelte';
  import { showToast } from '$lib/stores/uiNotifications.svelte';
  import { t } from '$lib/i18n/index.svelte';
  import { page } from '$app/state';

  interface FileNode {
    name: string;
    path: string;
    is_dir: boolean;
    children?: FileNode[];
    size_bytes?: number;
    modified_at?: number;
  }

  // State
  const layoutState = getLayoutState();
  let workspacePath = $state<string>('.');
  let fileTree = $state<FileNode[]>([]);
  let showFileTree = $state<boolean>(true);
  let currentFilePath = $state<string | null>(null);
  let isVaultMode = $state<boolean>(false);
  let vaultDocs = $state<any[]>([]);
  let currentDocTitle = $state<string>('Untitled Document.md');
  let rawMarkdown = $state<string>(
    '# Selamat Datang di CAMark Pro\n\nStudio Markdown berkinerja tinggi, berorientasi keamanan, dan tanpa distraksi.\n\n## Fitur Unggulan Pro:\n- [x] **GFM Markdown & Code Block Header** dengan Copy Button\n- [x] **KaTeX Math Engine Terintegrasi**: $$\\int_{-\\infty}^\\infty e^{-x^2} dx = \\sqrt{\\pi}$$\n- [x] **Diagram Alur Mermaid Visual**\n- [x] **Penyimpanan Ganda**: Filesystem Lokal & Brankas SQLCipher (Argon2id Zero-Knowledge)\n\n```mermaid\ngraph TD;\n    A[Buka Dokumen] --> B{Pilih Media};\n    B -->|Berkas Langsung| C[Filesystem Workspace];\n    B -->|Enkripsi| D[Vault SQLCipher];\n    C --> E[Live Preview & KaTeX];\n    D --> E;\n```\n\n| Komponen | Status Standar | Keterangan Arsitektur |\n| :--- | :--- | :--- |\n| UI Shell | Elevated Card | Identik dengan CATerm Pro |\n| Enkripsi | Zero-Knowledge | SQLCipher + Argon2id Hash |\n| Tipografi | Pro Markdown | Heading bersih, zebra table, code pill |\n| Rendering | Hybrid Engine | Marked + KaTeX + Mermaid |\n\n> "Privasi dan kecepatan bukanlah kompromi, melainkan fondasi setiap perkakas produktivitas modern."\n'
  );
  let renderedHtml = $state<string>('');

  // View mode: 'split' | 'editor' | 'preview'
  let viewMode = $state<'split' | 'editor' | 'preview'>('split');
  let isSaving = $state<boolean>(false);

  // Stats calculation
  let wordCount = $derived(rawMarkdown.trim() ? rawMarkdown.trim().split(/\s+/).length : 0);
  let charCount = $derived(rawMarkdown.length);
  let lineCount = $derived(rawMarkdown.split('\n').length);
  let readingTimeMin = $derived(Math.max(1, Math.ceil(wordCount / 200)));

  let editorElement = $state<HTMLDivElement | null>(null);
  let previewElement = $state<HTMLElement | null>(null);
  let editorView: EditorView;

  // Custom marked renderer for Pro Markdown (Zebra tables, code block headers with copy buttons)
  const proRenderer = new marked.Renderer();
  
  // Custom Table with modern wrapper
  const originalTable = proRenderer.table;
  proRenderer.table = function (token: any) {
    const tableHtml = originalTable.call(this, token);
    return `<div class="markdown-table-wrapper">${tableHtml}</div>`;
  };

  // Custom Code block with header bar + language pill + copy button
  proRenderer.code = function (token: any) {
    const code = typeof token === 'object' ? token.text : arguments[0];
    const lang = (typeof token === 'object' ? token.lang : arguments[1]) || 'text';

    if (lang === 'mermaid') {
      return `<pre class="mermaid-block"><code class="language-mermaid">${code}</code></pre>`;
    }

    const encodedCode = encodeURIComponent(code);
    return `<div class="code-block-wrapper" data-lang="${lang}">
      <div class="code-block-header">
        <span class="code-lang-pill">${lang}</span>
        <button type="button" class="code-copy-btn" data-code="${encodedCode}">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          Salin
        </button>
      </div>
      <pre><code class="language-${lang}">${code}</code></pre>
    </div>`;
  };

  marked.use({ renderer: proRenderer });

  onMount(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose'
    });

    renderMarkdown(rawMarkdown);

    // Initialize CodeMirror 6 with oneDark theme
    if (editorElement) {
      editorView = new EditorView({
        doc: rawMarkdown,
        extensions: [
          basicSetup,
          markdown(),
          oneDark,
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              rawMarkdown = update.state.doc.toString();
              renderMarkdown(rawMarkdown);
              autoSave();
            }
          })
        ],
        parent: editorElement
      });
    }

    // Check initial file passed via CLI or Open With
    invoke<string | null>('get_initial_file_path')
      .then(async (path) => {
        if (path) {
          viewMode = 'preview';
          showFileTree = false;
          layoutState.hideSidebar = true;
          const parts = path.split('/');
          const name = parts[parts.length - 1] || 'document.md';
          openFile({ name, path, is_dir: false });
        }
      })
      .catch((e) => console.warn('No initial file:', e));

    // Listen for single instance open-file events
    listen<string>('open-file', (event) => {
      if (event.payload) {
        viewMode = 'preview';
        showFileTree = false;
        layoutState.hideSidebar = true;
        const parts = event.payload.split('/');
        const name = parts[parts.length - 1] || 'document.md';
        openFile({ name, path: event.payload, is_dir: false });
      }
    }).catch((e) => console.warn('Failed to listen to open-file event:', e));

    // Default load directory workspace or vault mode
    if (page.url.searchParams.get('mode') === 'vault') {
      isVaultMode = true;
      loadVaultDocs();
    } else {
      loadDirectory('.');
    }
  });

  async function renderMarkdown(content: string) {
    try {
      // 1. Parse KaTeX Math ($...$ and $$...$$)
      let processed = content.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
        try {
          return katex.renderToString(math, { displayMode: true, throwOnError: false });
        } catch {
          return math;
        }
      });
      processed = processed.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
        try {
          return katex.renderToString(math, { displayMode: false, throwOnError: false });
        } catch {
          return math;
        }
      });

      // 2. Parse Marked with custom pro renderer
      const rawHtml = await marked.parse(processed, { gfm: true, breaks: true });
      renderedHtml = DOMPurify.sanitize(rawHtml, {
        ADD_TAGS: ['button', 'span', 'div', 'svg', 'path'],
        ADD_ATTR: ['data-lang', 'data-code', 'type', 'd', 'stroke', 'fill', 'viewBox', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']
      });

      // 3. Render Mermaid blocks on next tick
      setTimeout(() => {
        if (previewElement) {
          const mermaidBlocks = previewElement.querySelectorAll('code.language-mermaid');
          mermaidBlocks.forEach(async (block, index) => {
            const code = block.textContent || '';
            const id = `mermaid-svg-${index}-${Date.now()}`;
            try {
              const { svg } = await mermaid.render(id, code);
              const container = document.createElement('div');
              container.className = 'my-4 flex justify-center overflow-x-auto';
              container.innerHTML = svg;
              block.parentElement?.replaceWith(container);
            } catch (err) {
              console.error('Mermaid render error:', err);
            }
          });
        }
      }, 50);
    } catch (e) {
      console.error('Markdown rendering failed:', e);
    }
  }

  async function loadDirectory(path: string) {
    workspacePath = path;
    try {
      fileTree = await invoke<FileNode[]>('workspace_list_directory', { dirPath: path });
    } catch (e) {
      console.warn('Cannot list directory:', e);
    }
  }

  async function openFile(node: FileNode) {
    if (node.is_dir) return;
    try {
      const content = await invoke<string>('workspace_read_file', { filePath: node.path });
      currentFilePath = node.path;
      currentDocTitle = node.name;
      rawMarkdown = content;
      if (editorView) {
        editorView.dispatch({
          changes: { from: 0, to: editorView.state.doc.length, insert: content }
        });
      }
      renderMarkdown(content);

      // Expand folder context if needed
      const lastSlash = node.path.lastIndexOf('/');
      if (lastSlash > 0) {
        const parentDir = node.path.substring(0, lastSlash);
        if (parentDir !== workspacePath) {
          loadDirectory(parentDir);
        }
      }
    } catch (e) {
      console.error('Failed to open file:', e);
    }
  }

  let saveTimeout: any;
  function autoSave() {
    if (!currentFilePath) return;
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      isSaving = true;
      try {
        if (currentFilePath?.startsWith('vault://')) {
          await saveVaultDoc();
        } else if (currentFilePath) {
          await invoke('workspace_write_file', { filePath: currentFilePath, content: rawMarkdown });
        }
      } catch (e) {
        console.error('Save failed:', e);
      } finally {
        isSaving = false;
      }
    }, 500);
  }

  async function loadVaultDocs() {
    try {
      vaultDocs = await invoke<any[]>('vault_list_documents', { callerProfileId: 'default' });
    } catch (e) {
      console.warn('Cannot list vault docs:', e);
    }
  }

  async function openVaultDoc(doc: any) {
    currentFilePath = `vault://${doc.id}`;
    currentDocTitle = `🔒 ${doc.title}`;
    rawMarkdown = doc.content;
    if (editorView) {
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: doc.content }
      });
    }
    renderMarkdown(doc.content);
  }

  async function saveVaultDoc() {
    if (!currentFilePath || !currentFilePath.startsWith('vault://')) return;
    const docId = currentFilePath.replace('vault://', '');
    try {
      await invoke('vault_save_document', {
        input: {
          id: docId,
          title: currentDocTitle.replace('🔒 ', ''),
          content: rawMarkdown,
          tags: []
        },
        callerProfileId: 'default'
      });
      loadVaultDocs();
    } catch (e) {
      console.error('Failed to save vault doc:', e);
    }
  }

  async function createNewFile() {
    if (isVaultMode) {
      const docTitle = prompt('Judul dokumen brankas baru:', 'Catatan Baru');
      if (!docTitle) return;
      try {
        const newDoc = await invoke<any>('vault_save_document', {
          input: {
            title: docTitle,
            content: `# ${docTitle}\n\nCatatan rahasia terenkripsi SQLCipher.\n`,
            tags: []
          },
          callerProfileId: 'default'
        });
        await loadVaultDocs();
        openVaultDoc(newDoc);
        showToast('Dokumen Vault berhasil dibuat!', 'success');
      } catch (e) {
        alert(`Gagal membuat catatan vault: ${e}`);
      }
      return;
    }

    const fileName = prompt('Nama berkas markdown baru (contoh: rencana.md):', 'dokumen_baru.md');
    if (!fileName) return;
    const targetPath = workspacePath === '.' ? fileName : `${workspacePath}/${fileName}`;
    try {
      await invoke('workspace_create_file', { filePath: targetPath });
      await loadDirectory(workspacePath);
      openFile({ name: fileName, path: targetPath, is_dir: false });
      showToast(`Berkas ${fileName} berhasil dibuat!`, 'success');
    } catch (e) {
      alert(`Gagal membuat file: ${e}`);
    }
  }

  async function exportHtml() {
    const defaultName = currentDocTitle.replace(/\.md$/, '.html').replace('🔒 ', '');
    const targetPath = prompt('Simpan HTML sebagai:', `/tmp/${defaultName}`);
    if (!targetPath) return;

    try {
      const res = await invoke<any>('export_document_html', {
        htmlContent: renderedHtml,
        docTitle: currentDocTitle,
        targetPath
      });
      showToast(res.message || 'Ekspor HTML berhasil!', 'success');
    } catch (e) {
      alert(`Gagal export HTML: ${e}`);
    }
  }

  async function handlePreviewClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target) return;

    // 1. Handle Code Block Copy Button
    const copyBtn = target.closest('.code-copy-btn') as HTMLButtonElement | null;
    if (copyBtn) {
      const encoded = copyBtn.getAttribute('data-code');
      if (encoded) {
        const codeText = decodeURIComponent(encoded);
        await navigator.clipboard.writeText(codeText);
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = `
          <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          Tersalin!
        `;
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = `
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            Salin
          `;
        }, 2000);
      }
      return;
    }

    // 2. Interactive GFM Task List Checkboxes
    if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
      const checkbox = target as HTMLInputElement;
      const listItem = checkbox.closest('li');
      if (listItem && listItem.textContent) {
        const text = listItem.textContent.trim();
        if (checkbox.checked) {
          rawMarkdown = rawMarkdown.replace(`- [ ] ${text}`, `- [x] ${text}`);
        } else {
          rawMarkdown = rawMarkdown.replace(`- [x] ${text}`, `- [ ] ${text}`);
        }
        if (editorView) {
          editorView.dispatch({
            changes: { from: 0, to: editorView.state.doc.length, insert: rawMarkdown }
          });
        }
        autoSave();
      }
    }
  }
</script>

<svelte:head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
</svelte:head>

<div class="h-full flex flex-col bg-white dark:bg-[#161616] text-neutral-800 dark:text-neutral-200 overflow-hidden font-sans select-none">
  <!-- Sleek Studio Toolbar Bar (h-12 / 48px) -->
  <header class="h-12 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-[#121212]/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-10 shrink-0">
    <div class="flex items-center gap-2 sm:gap-3 min-w-0">
      <!-- Toggle Sidebar Workspace -->
      <button
        onclick={() => layoutState.toggleSidebar()}
        class="p-1.5 rounded-lg transition-colors {!layoutState.hideSidebar ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/70 dark:hover:bg-neutral-800'}"
        title={layoutState.hideSidebar ? "Tampilkan Menu Sidebar" : "Sembunyikan Menu Sidebar"}
        aria-label="Toggle Navigation Sidebar"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Toggle Files / Vault Explorer Rail -->
      <button
        onclick={() => (showFileTree = !showFileTree)}
        class="p-1.5 rounded-lg transition-colors {showFileTree ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20' : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/70 dark:hover:bg-neutral-800'}"
        title={showFileTree ? "Sembunyikan Panel Berkas" : "Tampilkan Panel Berkas"}
        aria-label="Toggle Files Explorer Rail"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </button>

      <div class="h-4 w-px bg-neutral-300 dark:bg-neutral-800 mx-0.5"></div>

      <!-- Current Document Title Breadcrumb -->
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-xs font-semibold font-mono text-neutral-800 dark:text-neutral-200 truncate max-w-[160px] sm:max-w-xs md:max-w-md">
          {currentDocTitle}
        </span>
        {#if isSaving}
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0 font-mono">
            Menyimpan...
          </span>
        {/if}
      </div>
    </div>

    <!-- View Mode Switcher & HTML Exporter -->
    <div class="flex items-center gap-2 shrink-0">
      <button
        onclick={exportHtml}
        class="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-medium border border-neutral-300 dark:border-neutral-700/80 transition-colors flex items-center gap-1.5"
        title="Ekspor Dokumen ke Standalone HTML"
      >
        <svg class="w-3.5 h-3.5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span class="hidden sm:inline">Ekspor HTML</span>
      </button>

      <!-- Editor / Split / Preview View Switcher -->
      <div class="flex items-center p-0.5 bg-neutral-200/70 dark:bg-neutral-900 rounded-lg border border-neutral-300 dark:border-neutral-800 text-xs">
        <button
          onclick={() => (viewMode = 'editor')}
          class="px-2.5 py-1 rounded-md transition-all {viewMode === 'editor' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium shadow-2xs' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}"
        >
          Editor
        </button>
        <button
          onclick={() => (viewMode = 'split')}
          class="px-2.5 py-1 rounded-md transition-all {viewMode === 'split' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium shadow-2xs' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}"
        >
          Split
        </button>
        <button
          onclick={() => (viewMode = 'preview')}
          class="px-2.5 py-1 rounded-md transition-all {viewMode === 'preview' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium shadow-2xs' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}"
        >
          Preview
        </button>
      </div>
    </div>
  </header>

  <!-- Main Multi-Pane Body -->
  <div class="flex-1 flex overflow-hidden min-h-0">
    <!-- Workspace Files / Vault Explorer Sidebar -->
    <aside class="{showFileTree ? 'w-60 sm:w-64' : 'hidden'} border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#111111] flex flex-col shrink-0 select-none">
      <!-- Mode Switcher Tabs: Files vs Encrypted Vault -->
      <div class="grid grid-cols-2 p-1.5 border-b border-neutral-200 dark:border-neutral-800/80 gap-1 bg-neutral-100/80 dark:bg-neutral-950/60">
        <button
          onclick={() => { isVaultMode = false; }}
          class="py-1 px-2 rounded-md text-[11px] font-semibold transition-all {(!isVaultMode) ? 'bg-white dark:bg-neutral-800 text-cyan-600 dark:text-cyan-400 shadow-2xs' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}"
        >
          📁 Files
        </button>
        <button
          onclick={() => { isVaultMode = true; loadVaultDocs(); }}
          class="py-1 px-2 rounded-md text-[11px] font-semibold transition-all {isVaultMode ? 'bg-white dark:bg-neutral-800 text-amber-600 dark:text-amber-400 shadow-2xs' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}"
        >
          🔒 Vault
        </button>
      </div>

      <!-- Action Sub-header: Title & New File/Doc Button -->
      <div class="p-2.5 px-3 border-b border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {isVaultMode ? 'Catatan Vault' : 'Berkas & Folder'}
        </span>
        <button
          onclick={createNewFile}
          class="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 {isVaultMode ? 'text-amber-600 dark:text-amber-400' : 'text-cyan-600 dark:text-cyan-400'} transition-colors"
          title={isVaultMode ? 'Buat Catatan Vault Baru' : 'Buat Berkas Markdown Baru'}
          aria-label="Create New File"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <!-- Scrollable File / Vault Tree -->
      <div class="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs font-mono scrollbar-none">
        {#if isVaultMode}
          {#each vaultDocs as doc (doc.id)}
            <button
              onclick={() => openVaultDoc(doc)}
              class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors {currentFilePath === `vault://${doc.id}` ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 font-medium' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white'}"
            >
              <svg class="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span class="truncate">{doc.title}</span>
            </button>
          {/each}
          {#if vaultDocs.length === 0}
            <div class="p-4 text-center text-neutral-400 dark:text-neutral-500 text-[11px]">
              Belum ada catatan di Vault.
            </div>
          {/if}
        {:else}
          {#each fileTree as node (node.path)}
            <button
              onclick={() => openFile(node)}
              class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors {currentFilePath === node.path ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 font-medium' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white'}"
            >
              {#if node.is_dir}
                <svg class="w-3.5 h-3.5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                </svg>
              {:else}
                <svg class="w-3.5 h-3.5 text-cyan-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              {/if}
              <span class="truncate">{node.name}</span>
            </button>
          {/each}
        {/if}
      </div>
    </aside>

    <!-- Editor Pane (CodeMirror 6) -->
    {#if viewMode === 'split' || viewMode === 'editor'}
      <main class="flex-1 flex flex-col bg-neutral-50 dark:bg-[#0f141c] overflow-hidden {viewMode === 'split' ? 'border-r border-neutral-200 dark:border-neutral-800' : ''}">
        <div bind:this={editorElement} class="flex-1 overflow-auto font-mono text-sm leading-relaxed p-2"></div>
      </main>
    {/if}

    <!-- Live Preview Pane with Pro Markdown Styling & Grid Flow Pattern Background -->
    {#if viewMode === 'split' || viewMode === 'preview'}
      <section
        bind:this={previewElement}
        onclick={handlePreviewClick}
        class="flex-1 overflow-y-auto bg-white dark:bg-[#0c1017] p-8 sm:p-10 markdown-preview max-w-none select-text bg-[linear-gradient(to_right,#00000006_1px,transparent_1px),linear-gradient(to_bottom,#00000006_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:56px_56px]"
      >
        {@html renderedHtml}
      </section>
    {/if}
  </div>

  <!-- Sleek Status Bar in Card Footer -->
  <footer class="h-7 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#111111] px-3 sm:px-4 flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400 z-10 shrink-0 select-none">
    <div class="flex items-center gap-3 sm:gap-4 truncate">
      <span>Kata: <strong class="text-neutral-800 dark:text-neutral-200">{wordCount}</strong></span>
      <span class="hidden sm:inline">Karakter: <strong class="text-neutral-800 dark:text-neutral-200">{charCount}</strong></span>
      <span>Baris: <strong class="text-neutral-800 dark:text-neutral-200">{lineCount}</strong></span>
      <span class="hidden md:inline">Baca: ~{readingTimeMin} mnt</span>
    </div>

    <div class="flex items-center gap-3 shrink-0">
      <span class="px-2 py-0.5 rounded text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
        {isVaultMode ? '🔒 SQLCipher Vault' : '📁 Plaintext File'}
      </span>
      <span class="hidden sm:inline">UTF-8</span>
      <span class="flex items-center gap-1.5" title="Local-First Storage Engine">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
        <span class="text-emerald-600 dark:text-emerald-400 font-medium">Local-First</span>
      </span>
    </div>
  </footer>
</div>

<style>
  :global(.cm-editor) {
    height: 100% !important;
    background-color: transparent !important;
  }
  :global(.cm-scroller) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
    font-size: 13px !important;
    line-height: 1.65 !important;
  }
</style>
