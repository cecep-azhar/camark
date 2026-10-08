<script lang="ts">
  export let size: number | string = 28;
  export let mode: 'light' | 'dark' | 'auto' | 'brand' | 'white' = 'brand';
  export let className: string = '';
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 512 512"
  class="shrink-0 {className}"
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <linearGradient id="cyanGradLogo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22D3EE" />
      <stop offset="100%" stop-color="#06B6D4" />
    </linearGradient>
    <linearGradient id="whiteGradLogo" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>
  </defs>

  <!-- Outer Badge Container -->
  <rect
    x="76"
    y="128"
    width="360"
    height="256"
    rx="36"
    fill={mode === 'white' ? 'none' : mode === 'light' ? '#F1F5F9' : '#0F172A'}
    fill-opacity={mode === 'white' ? '0' : mode === 'light' ? '1' : '0.85'}
    stroke={mode === 'white' ? '#FFFFFF' : mode === 'light' ? '#0891B2' : 'url(#cyanGradLogo)'}
    stroke-width="20"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Bold 'M' (Markdown Glyph) -->
  <path
    d="M128 320 V192 L188 252 L248 192 V320"
    fill="none"
    stroke={mode === 'white' ? '#FFFFFF' : mode === 'light' ? '#0891B2' : 'url(#cyanGradLogo)'}
    stroke-width="24"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Downward Arrow (Markdown Standard) -->
  <path
    d="M344 192 V316"
    fill="none"
    stroke={mode === 'white' ? '#FFFFFF' : mode === 'light' ? '#0F172A' : 'url(#whiteGradLogo)'}
    stroke-width="24"
    stroke-linecap="round"
  />
  <path
    d="M296 272 L344 320 L392 272"
    fill="none"
    stroke={mode === 'white' ? '#FFFFFF' : mode === 'light' ? '#0F172A' : 'url(#whiteGradLogo)'}
    stroke-width="24"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
