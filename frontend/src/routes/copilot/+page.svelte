<script lang="ts">
  import { getAiChatState, toggleAiChat } from '$lib/stores/aiChat.svelte';
  import { onMount } from 'svelte';

  const aiChat = getAiChatState();

  onMount(() => {
    if (!aiChat.open) {
      toggleAiChat();
    }
  });
</script>

<div class="h-full flex flex-col items-center justify-center p-12 text-center text-neutral-300">
  <div class="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
    <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  </div>
  <h2 class="text-xl font-bold text-white mb-2">AI Writing Copilot Aktif</h2>
  <p class="text-sm text-neutral-400 max-w-md mb-6">
    Gunakan panel AI di sebelah kanan untuk merapikan format tabel markdown, memeriksa tata bahasa, membuat ringkasan, atau menerjemahkan dokumen.
  </p>
  <a
    href="/"
    class="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-600/25 transition-all"
  >
    Buka Studio Editor
  </a>
</div>
