<script lang="ts">
  import { getAmbientStore } from '$lib/stores/ambient.svelte';
  import { getPro } from '$lib/stores/pro.svelte';

  let { defaultAccent = '#06b6d4', appName = 'CAMark' }: { defaultAccent?: string; appName?: string } = $props();

  const ambient = getAmbientStore();
  const pro = getPro();

  const PRESET_COLORS = [
    { name: 'Cyan (Default)', hex: defaultAccent },
    { name: 'Sky Blue', hex: '#0284c7' },
    { name: 'Violet', hex: '#8b5cf6' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Amber Gold', hex: '#f59e0b' },
    { name: 'Rose', hex: '#f43f5e' },
    { name: 'Neon Purple', hex: '#d946ef' },
    { name: 'Pure White', hex: '#ffffff' }
  ];
</script>

<div class="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
  <!-- Header: Toggle & Pro Status Indicator -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-2 mb-1">
        <h3 class="text-base font-semibold text-neutral-900 dark:text-white">
          Ambient Underglow & Chroma
        </h3>
        <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm">
          PRO EXCLUSIVE
        </span>
        {#if !pro.isPro}
          <span class="text-xs text-neutral-400 italic">(Memerlukan lisensi Founder Lifetime / Pro)</span>
        {/if}
      </div>
      <p class="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl">
        Pencahayaan halo luar di sekeliling area editor Markdown dengan akselerasi GPU. Mendukung mode warna solid, aksen brand, dan spektrum RGB dinamis ala keyboard mekanik.
      </p>
    </div>

    <div class="flex items-center gap-3 shrink-0 self-start sm:self-center">
      <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {ambient.config.enabled && pro.isPro ? 'Aktif' : 'Nonaktif'}
      </span>
      <button
        type="button"
        role="switch"
        aria-label="Toggle Ambient Underglow"
        aria-checked={ambient.config.enabled}
        disabled={!pro.isPro}
        onclick={() => ambient.setEnabled(!ambient.config.enabled)}
        class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed {ambient.config.enabled && pro.isPro ? 'bg-cyan-600' : 'bg-neutral-300 dark:bg-neutral-700'}"
      >
        <span
          class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {ambient.config.enabled && pro.isPro ? 'translate-x-5' : 'translate-x-0'}"
        ></span>
      </button>
    </div>
  </div>

  {#if !pro.isPro}
    <!-- Locked state callout -->
    <div class="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <p class="text-xs font-semibold text-amber-600 dark:text-amber-400">Fitur Eksklusif PRO Founder</p>
          <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Aktifkan lisensi {appName} Pro Anda untuk membuka pencahayaan ambient underglow.</p>
        </div>
      </div>
    </div>
  {/if}

  {#if ambient.config.enabled && pro.isPro}
    <div class="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-5">
      
      <!-- 1. Color Mode Selection -->
      <div class="space-y-2.5">
        <span class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Mode Warna (Color Mode)
        </span>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onclick={() => ambient.setMode('app-accent')}
            class="p-3 rounded-xl border text-left transition-all {ambient.config.mode === 'app-accent' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'}"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="w-3 h-3 rounded-full" style:background-color={defaultAccent}></span>
              <span class="text-xs font-semibold">App Brand</span>
            </div>
            <p class="text-[10px] text-neutral-500 dark:text-neutral-400">Aksen default {appName}</p>
          </button>

          <button
            type="button"
            onclick={() => ambient.setMode('solid')}
            class="p-3 rounded-xl border text-left transition-all {ambient.config.mode === 'solid' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'}"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="w-3 h-3 rounded-full border border-black/20" style:background-color={ambient.config.customColor}></span>
              <span class="text-xs font-semibold">Solid Hex</span>
            </div>
            <p class="text-[10px] text-neutral-500 dark:text-neutral-400">Warna kustom statis</p>
          </button>

          <button
            type="button"
            onclick={() => ambient.setMode('rgb-cycle')}
            class="p-3 rounded-xl border text-left transition-all {ambient.config.mode === 'rgb-cycle' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'}"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="w-3 h-3 rounded-full bg-[linear-gradient(45deg,#06b6d4,#8b5cf6,#ec4899)]"></span>
              <span class="text-xs font-semibold">RGB Chroma</span>
            </div>
            <p class="text-[10px] text-neutral-500 dark:text-neutral-400">Spektrum rotasi rainbow</p>
          </button>

          <button
            type="button"
            onclick={() => ambient.setMode('aurora')}
            class="p-3 rounded-xl border text-left transition-all {ambient.config.mode === 'aurora' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'}"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="w-3 h-3 rounded-full bg-[radial-gradient(circle,#06b6d4,#8b5cf6)]"></span>
              <span class="text-xs font-semibold">Aurora Drift</span>
            </div>
            <p class="text-[10px] text-neutral-500 dark:text-neutral-400">Gelombang cahaya halus</p>
          </button>
        </div>
      </div>

      <!-- Solid Color Picker & Presets (Shown when mode == 'solid') -->
      {#if ambient.config.mode === 'solid'}
        <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-3">
          <span class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Palet Warna Kustom
          </span>
          <div class="flex flex-wrap items-center gap-2">
            {#each PRESET_COLORS as preset}
              <button
                type="button"
                onclick={() => ambient.setCustomColor(preset.hex)}
                class="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center {ambient.config.customColor === preset.hex ? 'border-white ring-2 ring-cyan-500 scale-110' : 'border-black/20'}"
                style:background-color={preset.hex}
                title={preset.name}
              >
                {#if ambient.config.customColor === preset.hex}
                  <svg class="w-3.5 h-3.5 {preset.hex === '#ffffff' ? 'text-black' : 'text-white'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                {/if}
              </button>
            {/each}

            <!-- Native Color Input -->
            <div class="flex items-center gap-2 ml-2 pl-2 border-l border-neutral-300 dark:border-neutral-700">
              <input
                type="color"
                aria-label="Custom color picker"
                value={ambient.config.customColor}
                oninput={(e) => ambient.setCustomColor((e.target as HTMLInputElement).value)}
                class="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span class="text-xs font-mono font-semibold uppercase text-neutral-600 dark:text-neutral-300">
                {ambient.config.customColor}
              </span>
            </div>
          </div>
        </div>
      {/if}

      <!-- 2. Animation Effect Selection -->
      <div class="space-y-2.5">
        <span class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Efek Animasi (Animation Effect)
        </span>
        <div class="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onclick={() => ambient.setEffect('static')}
            class="p-3 rounded-xl border text-center transition-all {ambient.config.effect === 'static' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-semibold' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'}"
          >
            <span class="text-xs">Statis (Solid)</span>
          </button>

          <button
            type="button"
            onclick={() => ambient.setEffect('breathing')}
            class="p-3 rounded-xl border text-center transition-all {ambient.config.effect === 'breathing' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-semibold' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'}"
          >
            <span class="text-xs">Breathing (Nafas)</span>
          </button>

          <button
            type="button"
            onclick={() => ambient.setEffect('wave')}
            class="p-3 rounded-xl border text-center transition-all {ambient.config.effect === 'wave' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-semibold' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'}"
          >
            <span class="text-xs">Wave / Flowing</span>
          </button>
        </div>
      </div>

      <!-- 3. Sliders: Brightness & Spread Blur Radius -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div class="space-y-1.5">
          <div class="flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
            <span>Intensitas (Brightness)</span>
            <span class="font-mono font-semibold">{Math.round(ambient.config.intensity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            aria-label="Intensitas"
            value={ambient.config.intensity}
            oninput={(e) => ambient.setIntensity(parseFloat((e.target as HTMLInputElement).value))}
            class="w-full accent-cyan-600"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
            <span>Spread Blur Radius</span>
            <span class="font-mono font-semibold">{ambient.config.blurRadius}px</span>
          </div>
          <input
            type="range"
            min="8"
            max="50"
            step="2"
            aria-label="Spread Blur Radius"
            value={ambient.config.blurRadius}
            oninput={(e) => ambient.setBlurRadius(parseInt((e.target as HTMLInputElement).value))}
            class="w-full accent-cyan-600"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
            <span>Kecepatan Animasi</span>
            <span class="font-mono font-semibold">{ambient.config.speedSec}s</span>
          </div>
          <input
            type="range"
            min="2"
            max="15"
            step="1"
            aria-label="Kecepatan Animasi"
            value={ambient.config.speedSec}
            oninput={(e) => ambient.setSpeedSec(parseFloat((e.target as HTMLInputElement).value))}
            class="w-full accent-cyan-600"
          />
        </div>
      </div>

    </div>
  {/if}
</div>
