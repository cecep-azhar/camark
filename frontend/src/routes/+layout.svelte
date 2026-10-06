<script lang="ts">
  import "../app.css";
  import LockScreen from '$lib/components/LockScreen.svelte';
  import NotificationCenter from '$lib/components/NotificationCenter.svelte';
  import AiChatPanel from '$lib/components/AiChatPanel.svelte';
  import { getAiChatState, toggleAiChat, closeAiChat } from '$lib/stores/aiChat.svelte';
  import { page } from '$app/state';
  import { getTheme, initTheme, setTheme, toggleTheme } from '$lib/stores/theme.svelte';
  import { getToasts, showToast, confirmModal } from '$lib/stores/uiNotifications.svelte';
  import FeedbackModal from '$lib/components/FeedbackModal.svelte';
  import CrashReportModal from '$lib/components/CrashReportModal.svelte';
  import { getPendingCrashReport, type ScrubbedCrashReport } from '$lib/api/crash';
  import ProfileMenu from '$lib/components/ProfileMenu.svelte';
  import { getFeedbackPromptState } from '$lib/stores/feedbackStore.svelte';
  import { checkForUpdates } from '$lib/stores/updater.svelte';
  import { lockVault } from '$lib/api/vault';
  import { APP_VERSION } from '$lib/appInfo';
  import { onMount } from 'svelte';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { invoke } from '@tauri-apps/api/core';
  import { openExternalUrl } from '$lib/utils/url';
  import { t } from '$lib/i18n/index.svelte';
  import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
  import { navItems as getNavItems, settingsNavItem } from '$lib/navItems';
  import CommandPalette from '$lib/components/CommandPalette.svelte';
  import Logo from '$lib/components/Logo.svelte';
  import { getPalette, openPalette, closePalette } from '$lib/stores/commandPalette.svelte';
  import { getLayoutState } from '$lib/stores/layoutState.svelte';

  let isCollapsed = $state(false);
  let mobileDrawerOpen = $state(false);
  let isVaultUnlocked = $state(true); // Open directly without vault lockscreen by default
  let pendingCrashReport = $state<ScrubbedCrashReport | null>(null);

  const theme = getTheme();
  const aiChat = getAiChatState();
  const feedbackPrompt = getFeedbackPromptState();
  const toasts = $derived(getToasts());
  const unreadCount = $derived(toasts.length);
  const palette = getPalette();
  const layoutState = getLayoutState();

  const isTauri = typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__);
  const appWindow = isTauri ? getCurrentWindow() : null;

  onMount(() => {
    initTheme();
    // CAMark opens directly to Studio Editor by default
    isVaultUnlocked = true;

    getPendingCrashReport()
      .then((report) => {
        pendingCrashReport = report;
      })
      .catch(() => {});

    checkForUpdates().catch(() => {});

    // Phone in landscape: switch to icon-only sidebar
    const shortViewport = window.matchMedia('(max-height: 500px)');
    const collapseWhenShort = () => {
      if (shortViewport.matches) isCollapsed = true;
    };
    collapseWhenShort();
    shortViewport.addEventListener('change', collapseWhenShort);

    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (target && target.href) {
        const href = target.href;
        const isInternal = href.startsWith(window.location.origin) || href.includes('tauri.localhost') || href.includes('ipc.localhost') || href.startsWith('/') || href.startsWith('#');
        if (!isInternal && (href.startsWith('http://') || href.startsWith('https://'))) {
          e.preventDefault();
          e.stopPropagation();
          openExternalUrl(href);
        }
      }
    };
    window.addEventListener('click', handleGlobalClick, true);

    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (palette.open) closePalette();
        else openPalette('all');
      }
    };
    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('click', handleGlobalClick, true);
      window.removeEventListener('keydown', handleKeydown);
      shortViewport.removeEventListener('change', collapseWhenShort);
    };
  });

  function handleLock() {
    closePalette();
    isVaultUnlocked = false;
    lockVault().catch((err) => console.warn('lock_vault failed:', err));
  }

  function handleSignOut() {
    confirmModal(
      t('shell.signOutConfirm'),
      t('shell.signOutTitle'),
      true,
      t('profileMenu.signOut'),
      t('common.cancel')
    ).then((confirmed) => {
      if (confirmed) {
        handleLock();
      }
    });
  }

  async function minimizeWindow() {
    try {
      await invoke('window_minimize');
    } catch {
      try {
        if (appWindow) await appWindow.minimize();
        else if (typeof window !== 'undefined') await getCurrentWindow().minimize();
      } catch (err) {
        console.warn('Failed to minimize window:', err);
      }
    }
  }

  async function maximizeWindow() {
    try {
      await invoke('window_maximize');
    } catch {
      try {
        if (appWindow) await appWindow.toggleMaximize();
        else if (typeof window !== 'undefined') await getCurrentWindow().toggleMaximize();
      } catch (err) {
        console.warn('Failed to toggle maximize window:', err);
      }
    }
  }

  async function closeWindow() {
    try {
      await invoke('window_close');
    } catch {
      try {
        if (appWindow) await appWindow.close();
        else if (typeof window !== 'undefined') await getCurrentWindow().close();
      } catch (err) {
        console.warn('Failed to close window:', err);
      }
    }
  }

  async function startDragging(e: MouseEvent) {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, input, textarea, a, select, [role="button"], .no-drag')) return;
    try {
      await invoke('window_start_dragging');
    } catch {
      try {
        if (appWindow) await appWindow.startDragging();
        else if (typeof window !== 'undefined') await getCurrentWindow().startDragging();
      } catch (err) {
        console.warn('Failed to start dragging window:', err);
      }
    }
  }

  function toggleSidebar() {
    isCollapsed = !isCollapsed;
  }

  function isActive(href: string): boolean {
    if (href === '/') return page.url.pathname === '/';
    return page.url.pathname.startsWith(href);
  }

  const navItems = $derived(getNavItems());
  const settingsItem = $derived(settingsNavItem());

  const currentSection = $derived(
    [...navItems, settingsItem].find((item) => isActive(item.href)) ?? navItems[0]
  );

  let { children } = $props();
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key !== 'Escape') return;
    mobileDrawerOpen = false;
    closeAiChat();
  }}
/>

<NotificationCenter />
{#if isVaultUnlocked}
  <CommandPalette />
{/if}

{#if !isVaultUnlocked}
  <LockScreen onUnlocked={() => (isVaultUnlocked = true)} />
{:else}
  <!-- Shell: Unified Titlebar + Modern CATerm design system layout -->
  <div class="flex flex-col h-screen w-screen overflow-hidden bg-neutral-100 dark:bg-[#0e0e0e] text-neutral-800 dark:text-neutral-300 font-sans transition-colors duration-150 pb-[env(safe-area-inset-bottom,0px)] select-none">
    
    <!-- Top Titlebar Header -->
    <header
      class="min-h-[3rem] h-[calc(3rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] flex items-center gap-1 md:gap-2 pl-2 pr-1 md:pl-3 shrink-0 select-none cursor-default"
      data-tauri-drag-region
      onmousedown={startDragging}
      ondblclick={(e) => {
        const target = e.target as HTMLElement | null;
        if (!target?.closest('button, input, textarea, a, select, [role="button"], .no-drag')) {
          maximizeWindow();
        }
      }}
    >
      <!-- Left: Section Chip & Mobile Navigation Trigger -->
      <div class="flex items-center gap-1.5 min-w-0 flex-1" data-tauri-drag-region>
        <button
          type="button"
          onclick={() => mobileDrawerOpen = true}
          class="md:hidden p-1 rounded text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/70 dark:hover:bg-neutral-800 transition-colors shrink-0"
          title={t('shell.openNav')}
          aria-label={t('shell.openNav')}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <!-- Current Section Chip -->
        <span class="px-2 py-1 text-xs font-semibold shrink-0 hidden sm:flex items-center gap-1.5 text-neutral-900 dark:text-white" data-tauri-drag-region>
          <svg class="w-3.5 h-3.5 shrink-0 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={currentSection.path} />
          </svg>
          {currentSection.label}
        </span>

        <!-- Security / Vault Encryption Status Badge -->
        <div class="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium" data-tauri-drag-region>
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{t('profileMenu.vaultEncrypted')}</span>
        </div>

        <!-- Draggable blank space spanning remaining left area -->
        <div class="flex-1 h-full min-w-[20px]" data-tauri-drag-region></div>
      </div>

      <!-- Right: Quick Controls, Language Switcher, Theme Toggle & Window Actions -->
      <div class="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 shrink-0 no-drag" data-tauri-drag-region>
        <!-- Search / Palette trigger -->
        <button
          onclick={() => openPalette('all')}
          class="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-200/60 dark:bg-neutral-800/60 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors text-xs"
          title={t('common.search')}
        >
          <svg class="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <kbd class="px-1 py-0.2 text-[10px] font-mono bg-neutral-300/80 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-500 dark:text-neutral-400">Ctrl+K</kbd>
        </button>

        <!-- Ask AI Button -->
        <button
          type="button"
          onclick={() => toggleAiChat()}
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors text-xs font-medium"
          title={t('ai.askAi')}
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span class="hidden sm:inline">{t('ai.askAi')}</span>
        </button>

        <!-- Language Switcher -->
        <LanguageSwitcher />

        <!-- Theme Toggle -->
        <button
          type="button"
          onclick={() => toggleTheme()}
          class="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/70 dark:hover:bg-neutral-800 transition-colors"
          title={theme.name === 'dark' ? t('shell.lightTheme') : t('shell.darkTheme')}
          aria-label={t('shell.theme')}
        >
          {#if theme.name === 'dark'}
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          {:else}
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          {/if}
        </button>

        <!-- Vertical Separator -->
        <div class="hidden sm:block h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-0.5"></div>

        <!-- Custom Frameless Window Controls -->
        <div class="hidden sm:flex items-center">
          <button onclick={minimizeWindow} class="p-2 rounded-md hover:bg-neutral-200/70 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors" title={t('shell.minimize')} aria-label={t('shell.minimize')}>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
          </button>
          <button onclick={maximizeWindow} class="p-2 rounded-md hover:bg-neutral-200/70 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors" title={t('shell.maximize')} aria-label={t('shell.maximize')}>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" stroke-width="2"></rect></svg>
          </button>
          <button onclick={closeWindow} class="p-2 rounded-md hover:bg-rose-500 hover:text-white text-neutral-500 dark:text-neutral-400 transition-colors" title={t('shell.close')} aria-label={t('shell.close')}>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>
    </header>

    <div class="flex flex-1 min-h-0">
      <!-- Mobile Slide-out Drawer Backdrop -->
      {#if mobileDrawerOpen}
        <button
          type="button"
          onclick={() => (mobileDrawerOpen = false)}
          class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity border-0 p-0 cursor-default"
          aria-label={t('shell.closeMenuBackdrop')}
        ></button>
      {/if}

      <!-- Mobile Slide-out Drawer Navigation -->
      <aside
        class="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-neutral-100 dark:bg-[#0e0e0e] border-r border-neutral-200 dark:border-neutral-800 flex flex-col justify-between shadow-2xl md:hidden transform transition-transform duration-200 ease-in-out {mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}"
        aria-label={t('shell.mobileNav')}
      >
        <div class="min-h-0 flex flex-col">
          <div class="min-h-[3rem] h-[calc(3rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] flex items-center justify-between px-4">
            <div class="flex items-center gap-2">
              <Logo size={22} mode="brand" />
              <span class="font-bold text-neutral-900 dark:text-white text-base tracking-tight">CAMark</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 text-cyan-500 font-mono">v{APP_VERSION}</span>
            </div>
            <button
              onclick={() => (mobileDrawerOpen = false)}
              class="p-1.5 rounded-lg hover:bg-neutral-200/70 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
              aria-label={t('shell.closeNav')}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p class="px-5 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{t('shell.workspace')}</p>
          <nav class="px-2 space-y-0.5 overflow-y-auto scrollbar-none text-sm">
            {#each navItems as item}
              <a
                href={item.href}
                onclick={() => (mobileDrawerOpen = false)}
                title={item.label}
                aria-current={isActive(item.href) ? 'page' : undefined}
                class="px-2.5 py-2 rounded-lg flex items-center gap-3 transition-colors {isActive(item.href) ? 'bg-neutral-200/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-white font-medium' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/40 hover:text-neutral-900 dark:hover:text-white'}"
              >
                <svg class="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d={item.path} />
                </svg>
                <span class="truncate">{item.label}</span>
              </a>
            {/each}
          </nav>
        </div>

        <div class="p-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          <ProfileMenu onLock={handleLock} onSignOut={handleSignOut} onNavigate={() => (mobileDrawerOpen = false)} />
        </div>
      </aside>

      <!-- Desktop Sidebar -->
      <aside
        class="hidden {layoutState.hideSidebar ? '' : 'md:flex'} flex-col shrink-0 will-change-[width] {isCollapsed ? 'w-16' : 'w-60'}"
        aria-label={t('shell.sidebar')}
      >
        <!-- Top Brand Header + collapse toggle -->
        <div class="flex items-center pt-3 pb-4 {isCollapsed ? 'justify-center px-2' : 'justify-between pl-4 pr-2'}">
          {#if isCollapsed}
            <button
              type="button"
              onclick={toggleSidebar}
              title={t('shell.expandSidebar')}
              aria-label={t('shell.expandSidebar')}
              class="p-1.5 rounded-lg hover:bg-neutral-200/70 dark:hover:bg-neutral-800 transition-colors"
            >
              <Logo size={22} mode="brand" />
            </button>
          {:else}
            <div class="flex items-center gap-2 min-w-0">
              <Logo size={22} mode="brand" />
              <span class="font-bold text-neutral-900 dark:text-white text-lg tracking-tight truncate">CAMark</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 text-cyan-500 font-mono shrink-0">v{APP_VERSION}</span>
            </div>
            <button
              type="button"
              onclick={toggleSidebar}
              title={t('shell.collapseSidebar')}
              aria-label={t('shell.collapseSidebar')}
              class="p-1 rounded-md hover:bg-neutral-200/70 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors shrink-0"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          {/if}
        </div>

        {#if !isCollapsed}
          <p class="px-5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{t('shell.workspace')}</p>
        {/if}
        <nav class="flex-1 min-h-0 overflow-y-auto scrollbar-none px-2 space-y-0.5 text-sm">
          {#each navItems as item}
            <a
              href={item.href}
              title={item.label}
              aria-current={isActive(item.href) ? 'page' : undefined}
              class="relative px-2.5 py-2 rounded-lg flex items-center {isCollapsed ? 'justify-center' : 'gap-3'} transition-colors {isActive(item.href) ? 'bg-neutral-200/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-white font-medium' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/40 hover:text-neutral-900 dark:hover:text-white'}"
            >
              {#if isActive(item.href)}
                <!-- Active marker pinned to the window's left edge (Cyan brand) -->
                <span class="absolute -left-2 top-1.5 bottom-1.5 w-[3px] rounded-r bg-cyan-400" aria-hidden="true"></span>
              {/if}
              <svg class="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d={item.path} />
              </svg>
              {#if !isCollapsed}
                <span class="truncate">{item.label}</span>
              {/if}
            </a>
          {/each}
        </nav>

        <div class="p-2">
          <ProfileMenu collapsed={isCollapsed} onLock={handleLock} onSignOut={handleSignOut} />
        </div>
      </aside>

      <!-- Content panel: Raised panel with dark #0f141c background, left/top hairline and rounded top-left corner -->
      <main class="flex-1 min-w-0 flex overflow-hidden relative bg-[#0f141c] border-t border-neutral-200 dark:border-neutral-800/80 md:border-l md:rounded-tl-xl transition-colors duration-150">
        <div class="flex-1 min-w-0 overflow-hidden relative">
          {@render children?.()}
        </div>

        <AiChatPanel isOpen={aiChat.open} onClose={() => closeAiChat()} />

        {#if feedbackPrompt.show}
          <FeedbackModal
            onClose={() => feedbackPrompt.close()}
            onSubmitted={() => feedbackPrompt.markSubmitted()}
          />
        {/if}

        {#if pendingCrashReport}
          <CrashReportModal
            report={pendingCrashReport}
            onClose={() => (pendingCrashReport = null)}
          />
        {/if}
      </main>
    </div>
  </div>
{/if}
