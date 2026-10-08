<script lang="ts">
  interface HeadingItem {
    level: number;
    text: string;
    line: number;
    anchor: string;
  }

  interface Props {
    isOpen: boolean;
    rawMarkdown: string;
    onJumpToHeading: (heading: HeadingItem) => void;
    onClose: () => void;
  }

  let { isOpen, rawMarkdown, onJumpToHeading, onClose }: Props = $props();

  let headings = $derived.by(() => {
    const list: HeadingItem[] = [];
    const lines = rawMarkdown.split('\n');

    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim().replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        const anchor = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        list.push({ level, text, line: index + 1, anchor });
      }
    });

    return list;
  });
</script>

{#if isOpen}
  <aside
    class="w-64 border-l border-[#262626] bg-[#121217] flex flex-col justify-between shrink-0 select-none text-xs z-20 animate-in slide-in-from-right-4 duration-150 no-print"
  >
    <!-- Drawer Header -->
    <div class="h-10 border-b border-[#262626] px-3 flex items-center justify-between bg-[#16161D] shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-cyan-400 font-bold">📑 Struktur Dokumen</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-mono">
          {headings.length}
        </span>
      </div>
      <button
        type="button"
        onclick={onClose}
        class="text-neutral-400 hover:text-white p-1 rounded"
        title="Tutup Panel Struktur"
      >
        ✕
      </button>
    </div>

    <!-- Headings List -->
    <div class="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none font-sans">
      {#each headings as h}
        <button
          type="button"
          onclick={() => onJumpToHeading(h)}
          class="w-full text-left py-1.5 px-2 rounded-lg hover:bg-[#18181F] transition-colors flex items-center gap-2 group"
          style="padding-left: {Math.max(0.5, (h.level - 1) * 0.75)}rem"
        >
          <span
            class="text-[9px] px-1 py-0.2 rounded font-mono font-bold shrink-0 {h.level === 1 ? 'bg-cyan-500/20 text-cyan-400' : h.level === 2 ? 'bg-blue-500/20 text-blue-400' : 'bg-neutral-800 text-neutral-400'}"
          >
            H{h.level}
          </span>
          <span class="text-neutral-300 group-hover:text-white truncate text-xs">
            {h.text}
          </span>
        </button>
      {/each}

      {#if headings.length === 0}
        <div class="p-6 text-center text-neutral-500 text-xs">
          Belum ada heading (# Judul) dalam dokumen ini.
        </div>
      {/if}
    </div>

    <!-- Drawer Footer -->
    <div class="p-2.5 border-t border-[#262626] text-[10px] text-neutral-500 flex items-center justify-between bg-[#16161D]">
      <span>Outline Navigator</span>
      <span class="text-cyan-400 font-medium">1-Click Jump</span>
    </div>
  </aside>
{/if}
