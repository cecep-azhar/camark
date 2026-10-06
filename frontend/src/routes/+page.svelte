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
  import { t } from '$lib/i18n/index.svelte';

  interface FileNode {
    name: string;
    path: string;
    is_dir: boolean;
    children?: FileNode[];
    size_bytes?: number;
    modified_at?: number;
  }

  import { page } from '$app/state';

  // State
  const layoutState = getLayoutState();
  let workspacePath = $state<string>('');
  let fileTree = $state<FileNode[]>([]);
  let showFileTree = $state<boolean>(true);
  let currentFilePath = $state<string | null>(null);
  let isVaultMode = $state<boolean>(false);
  let vaultDocs = $state<any[]>([]);
  let currentDocTitle = $state<string>('Untitled Document.md');
  let rawMarkdown = $state<string>('# Selamat Datang di CAMark\n\nStudio Markdown berkinerja tinggi, aman, dan tanpa distraksi.\n\n## Fitur Unggulan:\n- [x] **GFM Markdown & Syntax Highlighting**\n- [x] **Live KaTeX Math Engine**: $$E = mc^2$$\n- [x] **Mermaid Diagrams**\n\n```mermaid\ngraph TD;\n    A[Buka File] --> B{Enkripsi?};\n    B -- Ya --> C[Vault SQLCipher];\n    B -- Tidak --> D[Open Filesystem];\n```\n\n| Fitur | Status | Keterangan |\n| :--- | :--- | :--- |\n| Kecepatan | <1s | Super Ringan |\n| Keamanan | Zero-Knowledge | Argon2id + SQLCipher |\n');
  let renderedHtml = $state<string>('');
  
  // View mode: 'split' | 'editor' | 'preview'
  let viewMode = $state<'split' | 'editor' | 'preview'>('split');
  let isSaving = $state<boolean>(false);
  let wordCount = $derived(rawMarkdown.trim() ? rawMarkdown.trim().split(/\s+/).length : 0);
  let lineCount = $derived(rawMarkdown.split('\n').length);

  let editorElement = $state<HTMLDivElement | null>(null);
  let previewElement = $state<HTMLElement | null>(null);
  let editorView: EditorView;

  // Initialize Mermaid & marked custom extensions
  onMount(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose'
    });

    renderMarkdown(rawMarkdown);

    // Initialize CodeMirror 6
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

    // Default load current directory workspace
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

      // 2. Parse Marked
      const rawHtml = await marked.parse(processed, { gfm: true, breaks: true });
      renderedHtml = DOMPurify.sanitize(rawHtml);

      // 3. Render Mermaid blocks on next tick
      setTimeout(() => {
        if (previewElement) {
          const mermaidBlocks = previewElement.querySelectorAll('code.language-mermaid, pre code:contains("graph")');
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

      // Also navigate workspace sidebar to the folder of this file
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
        await invoke('workspace_write_file', { filePath: currentFilePath, content: rawMarkdown });
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
    const fileName = prompt('Nama file markdown baru (contoh: catatan.md):', 'dokumen_baru.md');
    if (!fileName) return;
    const targetPath = workspacePath === '.' ? fileName : `${workspacePath}/${fileName}`;
    try {
      await invoke('workspace_create_file', { filePath: targetPath });
      await loadDirectory(workspacePath);
      openFile({ name: fileName, path: targetPath, is_dir: false });
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
      alert(res.message || 'Export berhasil!');
    } catch (e) {
      alert(`Gagal export HTML: ${e}`);
    }
  }

  function handlePreviewClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
      // Interactive GFM Task list checkbox click!
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

<div class="h-screen flex flex-col bg-[#0f141c] text-neutral-200 overflow-hidden font-sans select-none">
  <!-- Top Application Bar -->
  <header class="h-12 border-b border-neutral-800/80 bg-[#121824] px-4 flex items-center justify-between z-10 shrink-0">
    <div class="flex items-center gap-3">
      <!-- Toggle Navigation Sidebar -->
      <button
        onclick={() => layoutState.toggleSidebar()}
        class="p-1.5 rounded transition-colors {!layoutState.hideSidebar ? 'bg-neutral-800 text-cyan-300' : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white'}"
        title={layoutState.hideSidebar ? "Show App Navigation" : "Hide App Navigation"}
        aria-label="Toggle App Navigation"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Toggle Files Tree -->
      <button
        onclick={() => (showFileTree = !showFileTree)}
        class="p-1.5 rounded transition-colors {showFileTree ? 'bg-cyan-500/20 text-cyan-300' : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white'}"
        title={showFileTree ? "Hide Files Panel" : "Show Files Panel"}
        aria-label="Toggle Files Explorer"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </button>

      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"></span>
        <span class="font-bold text-sm tracking-wider text-cyan-400">CAMark</span>
      </div>
      <span class="text-xs text-neutral-500">|</span>
      <span class="text-xs font-mono text-neutral-300 max-w-xs truncate">{currentDocTitle}</span>
      {#if isSaving}
        <span class="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Menyimpan...</span>
      {/if}
    </div>

    <!-- View Mode Selector & Exporter -->
    <div class="flex items-center gap-2">
      <button
        onclick={exportHtml}
        class="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-300 text-xs font-medium border border-neutral-700/80 transition-colors flex items-center gap-1.5"
        title={t('editor.exportHtmlTitle')}
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {t('editor.exportHtml')}
      </button>

      <div class="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-lg border border-neutral-800 text-xs">
        <button
          onclick={() => (viewMode = 'editor')}
          class="px-2.5 py-1 rounded transition-colors {viewMode === 'editor' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-neutral-400 hover:text-white'}"
        >
          Editor
        </button>
        <button
          onclick={() => (viewMode = 'split')}
          class="px-2.5 py-1 rounded transition-colors {viewMode === 'split' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-neutral-400 hover:text-white'}"
        >
          Split
        </button>
        <button
          onclick={() => (viewMode = 'preview')}
          class="px-2.5 py-1 rounded transition-colors {viewMode === 'preview' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-neutral-400 hover:text-white'}"
        >
          Preview
        </button>
      </div>
    </div>
  </header>

  <!-- Main 3-Pane Body -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Left Sidebar: File Tree Workspace -->
    <aside class="{showFileTree ? 'w-64' : 'hidden'} border-r border-neutral-800/80 bg-[#0d121a] flex flex-col shrink-0">
      <!-- Mode Tabs: Filesystem vs Encrypted Vault -->
      <div class="grid grid-cols-2 p-1.5 border-b border-neutral-800/80 gap-1 bg-[#101520]">
        <button
          onclick={() => { isVaultMode = false; }}
          class="py-1 px-2 rounded text-[11px] font-semibold transition-colors {(!isVaultMode) ? 'bg-cyan-500/20 text-cyan-300' : 'text-neutral-400 hover:text-white'}"
        >
          📁 Files
        </button>
        <button
          onclick={() => { isVaultMode = true; loadVaultDocs(); }}
          class="py-1 px-2 rounded text-[11px] font-semibold transition-colors {isVaultMode ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-400 hover:text-white'}"
        >
          🔒 Vault
        </button>
      </div>

      <div class="p-3 border-b border-neutral-800/80 flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {isVaultMode ? 'Catatan Terenkripsi' : 'Berkas & Folder'}
        </span>
        <button
          onclick={createNewFile}
          class="p-1 rounded hover:bg-neutral-800 {isVaultMode ? 'text-amber-400 hover:text-amber-300' : 'text-cyan-400 hover:text-cyan-300'} transition-colors"
          title={t('editor.newFile')}
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs font-mono">
        {#if isVaultMode}
          {#each vaultDocs as doc}
            <button
              onclick={() => openVaultDoc(doc)}
              class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-colors {currentFilePath === `vault://${doc.id}` ? 'bg-amber-500/15 text-amber-300' : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-white'}"
            >
              <svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span class="truncate">{doc.title}</span>
            </button>
          {/each}
          {#if vaultDocs.length === 0}
            <div class="p-4 text-center text-neutral-500 text-[11px]">Belum ada catatan di Vault</div>
          {/if}
        {:else}
          {#each fileTree as node}
            <button
              onclick={() => openFile(node)}
              class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-colors {currentFilePath === node.path ? 'bg-cyan-500/15 text-cyan-300' : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-white'}"
            >
              {#if node.is_dir}
                <svg class="w-4 h-4 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                </svg>
              {:else}
                <svg class="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              {/if}
              <span class="truncate">{node.name}</span>
            </button>
          {/each}
        {/if}
      </div>
    </aside>

    <!-- Center: CodeMirror 6 Editor -->
    {#if viewMode === 'split' || viewMode === 'editor'}
      <main class="flex-1 flex flex-col bg-[#0f141c] overflow-hidden {viewMode === 'split' ? 'border-r border-neutral-800/80' : ''}">
        <div bind:this={editorElement} class="flex-1 overflow-auto font-mono text-sm leading-relaxed p-2"></div>
      </main>
    {/if}

    <!-- Right: Rendered HTML Live Preview -->
    {#if viewMode === 'split' || viewMode === 'preview'}
      <section
        bind:this={previewElement}
        onclick={handlePreviewClick}
        class="flex-1 overflow-y-auto bg-[#0a0d13] p-8 prose prose-invert prose-cyan max-w-none text-neutral-300 leading-relaxed select-text"
      >
        {@html renderedHtml}
      </section>
    {/if}
  </div>

  <!-- Bottom Status Bar -->
  <footer class="h-7 border-t border-neutral-800/80 bg-[#0d121a] px-4 flex items-center justify-between text-[11px] font-mono text-neutral-400 z-10 shrink-0">
    <div class="flex items-center gap-4">
      <span>Kata: <strong class="text-neutral-200">{wordCount}</strong></span>
      <span>Baris: <strong class="text-neutral-200">{lineCount}</strong></span>
      <span>Mode: <span class="text-cyan-400 capitalize">{viewMode}</span></span>
    </div>
    <div class="flex items-center gap-3">
      <span>UTF-8</span>
      <span class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span>Local-First</span>
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
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 13px !important;
    line-height: 1.6 !important;
  }
  :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
  }
  :global(th, td) {
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.5rem 0.75rem;
  }
  :global(th) {
    background-color: rgba(34, 211, 238, 0.08);
  }
  :global(input[type="checkbox"]) {
    margin-right: 0.5rem;
    cursor: pointer;
  }
</style>
