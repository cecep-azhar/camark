<script lang="ts">
  import "../app.css";
  import LockScreen from '$lib/components/LockScreen.svelte';
  import NotificationCenter from '$lib/components/NotificationCenter.svelte';
  import AiChatPanel from '$lib/components/AiChatPanel.svelte';
  import { getAiChatState, toggleAiChat, closeAiChat } from '$lib/stores/aiChat.svelte';
  import { page } from '$app/state';
  import { getTheme, initTheme, toggleTheme } from '$lib/stores/theme.svelte';
  import { getToasts } from '$lib/stores/uiNotifications.svelte';
  import FeedbackModal from '$lib/components/FeedbackModal.svelte';
  import CrashReportModal from '$lib/components/CrashReportModal.svelte';
  import { getPendingCrashReport, type ScrubbedCrashReport } from '$lib/api/crash';
  import ProfileMenu from '$lib/components/ProfileMenu.svelte';
  import { getFeedbackPromptState } from '$lib/stores/feedbackStore.svelte';
  import { checkForUpdates } from '$lib/stores/updater.svelte';
  import { lockVault } from '$lib/api/vault';
  import { APP_VERSION } from '$lib/appInfo';
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { t } from '$lib/i18n/index.svelte';
  import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
  import { APP_CONFIG } from '$lib/generated/app';
  import { navItems as getNavItems, settingsNavItem } from '$lib/navItems';
  import CommandPalette from '$lib/components/CommandPalette.svelte';
  import { getPalette, openPalette, closePalette } from '$lib/stores/commandPalette.svelte';
  import { getLayoutState } from '$lib/stores/layoutState.svelte';
  import AmbientGlow from '$lib/components/AmbientGlow.svelte';

  let isCollapsed = $state(false);
  let isVaultUnlocked = $state(true); // Open directly without vault lockscreen by default
  let pendingCrashReport = $state<ScrubbedCrashReport | null>(null);

  const theme = getTheme();
  const aiChat = getAiChatState();
  const feedbackPrompt = getFeedbackPromptState();
  const toasts = $derived(getToasts());
  const palette = getPalette();
  const layoutState = getLayoutState();

  const navItems = $derived(getNavItems());
  const settingsItem = $derived(settingsNavItem());

  onMount(() => {
    initTheme();
    // CAMark opens directly to Studio Editor by default without blocking lockscreen
    isVaultUnlocked = true;

    getPendingCrashReport()
      .then((report) => {
        pendingCrashReport = report;
      })
      .catch(() => {});

    checkForUpdates().catch(() => {});
  });

  async function handleLock() {
    await lockVault();
    isVaultUnlocked = false;
  }

  async function handleMinimize() {
    try {
      await invoke('window_minimize');
    } catch (e) {
      console.warn('Failed to minimize window:', e);
    }
  }

  async function handleMaximize() {
    try {
      await invoke('window_maximize');
    } catch (e) {
      console.warn('Failed to toggle maximize window:', e);
    }
  }

  async function handleClose() {
    try {
      await invoke('window_close');
    } catch (e) {
      console.warn('Failed to close window:', e);
    }
  }

  let { children } = $props();
</script>

<div class="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 select-none font-sans pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]">
  {#if !isVaultUnlocked}
    <LockScreen onUnlocked={() => (isVaultUnlocked = true)} />
  {:else}
    <!-- Sidebar / Navigation Drawer -->
    <aside
      class="flex flex-col bg-neutral-900/90 border-r border-neutral-800/80 shrink-0 select-none {layoutState.hideSidebar ? 'hidden' : (isCollapsed ? 'w-16' : 'w-60')}"
    >
      <!-- Top Brand Header -->
      <div data-tauri-drag-region class="flex items-center justify-between px-3.5 py-3 border-b border-neutral-800/60 cursor-default">
        {#if !isCollapsed}
          <div class="flex items-center gap-2.5 overflow-hidden">
            <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30 text-xs">
              {APP_CONFIG.name.slice(0, 2).toUpperCase()}
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-bold text-sm tracking-tight text-neutral-100 truncate">{APP_CONFIG.name}</span>
              <span class="text-[10px] text-neutral-500 font-mono">v{APP_VERSION}</span>
            </div>
          </div>
        {:else}
          <div class="w-8 h-8 mx-auto rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30 text-xs">
            {APP_CONFIG.name.slice(0, 2).toUpperCase()}
          </div>
        {/if}

        <button
          onclick={() => (isCollapsed = !isCollapsed)}
          class="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors no-drag"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {#if isCollapsed}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            {:else}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            {/if}
          </svg>
        </button>
      </div>

      <!-- Search / Command Palette trigger -->
      <div class="p-2 border-b border-neutral-800/40">
        <button
          onclick={() => openPalette('all')}
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-neutral-950/60 border border-neutral-800/60 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all text-xs no-drag"
        >
          <svg class="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {#if !isCollapsed}
            <span class="flex-1 text-left">{t('common.search')}</span>
            <kbd class="px-1.5 py-0.5 text-[10px] font-mono bg-neutral-800 border border-neutral-700 rounded text-neutral-400">Ctrl+K</kbd>
          {/if}
        </button>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {#each navItems as item}
          {@const active = page.url.pathname === item.href}
          <a
            href={item.href}
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors {active ? 'bg-indigo-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'}"
            title={isCollapsed ? item.label : undefined}
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.path} />
            </svg>
            {#if !isCollapsed}
              <span class="truncate">{item.label}</span>
            {/if}
          </a>
        {/each}
      </nav>

      <!-- Bottom System Controls -->
      <div class="p-2 border-t border-neutral-800/60 space-y-1">
        <a
          href={settingsItem.href}
          class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors {page.url.pathname === settingsItem.href ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'}"
          title={isCollapsed ? settingsItem.label : undefined}
        >
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={settingsItem.path} />
          </svg>
          {#if !isCollapsed}
            <span class="truncate">{settingsItem.label}</span>
          {/if}
        </a>

        <div class="flex items-center justify-between pt-2 px-1">
          {#if !isCollapsed}
            <ProfileMenu onLock={handleLock} onSignOut={handleLock} />
            <div class="flex items-center gap-1">
              <button
                onclick={handleLock}
                class="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800/80 transition-colors"
                title={t('profileMenu.lockScreen')}
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </button>
            </div>
          {:else}
            <button
              onclick={handleLock}
              class="w-full flex justify-center p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800/80 transition-colors"
              title={t('profileMenu.lockScreen')}
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </button>
          {/if}
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 bg-neutral-950 overflow-hidden">
      <!-- Top Bar with Global Controls, Language, Theme, & Window Actions -->
      <header
        data-tauri-drag-region
        class="h-11 border-b border-neutral-200 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/50 backdrop-blur px-3 flex items-center justify-between shrink-0 select-none text-neutral-800 dark:text-neutral-200"
      >
        <!-- Left: Status Badge & App Title / Info -->
        <div data-tauri-drag-region class="flex items-center gap-3 min-w-0 cursor-default">
          <div class="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{t('profileMenu.vaultEncrypted') || 'Vault Encrypted (SQLCipher)'}</span>
          </div>
        </div>

        <!-- Middle: Draggable window region -->
        <div data-tauri-drag-region class="flex-1 h-full cursor-default"></div>

        <!-- Right: Actions, Language, Theme & Window Controls -->
        <div class="flex items-center gap-2 no-drag shrink-0">
          <!-- Ask AI Button -->
          <button
            type="button"
            onclick={() => toggleAiChat()}
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors text-xs font-medium"
            title={t('ai.askAi')}
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{t('ai.askAi')}</span>
          </button>

          <!-- Language Switcher (ID / EN) -->
          <LanguageSwitcher />

          <!-- Theme Toggle (Dark / Light) -->
          <button
            type="button"
            onclick={() => toggleTheme()}
            class="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={theme.name === 'dark' ? t('shell.lightTheme') : t('shell.darkTheme')}
            aria-label={t('shell.theme')}
          >
            {#if theme.name === 'dark'}
              <!-- Sun icon for light mode toggle -->
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            {:else}
              <!-- Moon icon for dark mode toggle -->
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            {/if}
          </button>

          <!-- Vertical separator -->
          <div class="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1"></div>

          <!-- Frameless Window Controls -->
          <div class="flex items-center gap-0.5">
            <!-- Minimize Button -->
            <button
              type="button"
              onclick={handleMinimize}
              class="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
              title={t('lock.minimize')}
              aria-label={t('lock.minimize')}
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4" />
              </svg>
            </button>

            <!-- Maximize / Restore Button -->
            <button
              type="button"
              onclick={handleMaximize}
              class="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
              title={t('lock.maximize')}
              aria-label={t('lock.maximize')}
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2" />
              </svg>
            </button>

            <!-- Close Button -->
            <button
              type="button"
              onclick={handleClose}
              class="p-1.5 rounded-md text-neutral-500 hover:text-white dark:text-neutral-400 hover:bg-rose-600 dark:hover:bg-rose-600 transition-colors"
              title={t('lock.close')}
              aria-label={t('lock.close')}
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Viewport Body with Outer Ambient Halo Underglow -->
      <div class="flex-1 min-w-0 flex flex-col relative overflow-hidden">
        <AmbientGlow defaultAccent="#06b6d4" />

        <main class="flex-1 overflow-hidden relative z-10">
          {@render children?.()}
        </main>
      </div>
    </div>

    <!-- Modals and Overlays -->
    <AiChatPanel isOpen={aiChat.open} onClose={() => closeAiChat()} />
    <CommandPalette />
    <NotificationCenter />

    {#if pendingCrashReport}
      <CrashReportModal
        report={pendingCrashReport}
        onClose={() => (pendingCrashReport = null)}
      />
    {/if}

    {#if feedbackPrompt.show}
      <FeedbackModal onClose={() => feedbackPrompt.close()} />
    {/if}
  {/if}
</div>
