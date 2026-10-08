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
    <linearGradient id="symbolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22D3EE" />
      <stop offset="100%" stop-color="#06B6D4" />
    </linearGradient>
  </defs>

  <g fill="none">
    <!-- Document Badge / Markdown Frame Container -->
    <rect
      x="88"
      y="132"
      width="336"
      height="248"
      rx="28"
      stroke={mode === 'white' ? '#FFFFFF' : mode === 'light' ? '#0891B2' : 'url(#symbolGrad)'}
      stroke-width="26"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Bold 'M' Glyph -->
    <path
      d="M136 324 L136 200 L192 256 L248 200 L248 324"
      stroke={mode === 'white' ? '#FFFFFF' : mode === 'light' ? '#0891B2' : '#22D3EE'}
      stroke-width="26"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Downward Arrow -->
    <line
      x1="336"
      y1="200"
      x2="336"
      y2="294"
      stroke={mode === 'white' ? '#FFFFFF' : mode === 'light' ? '#0F172A' : (mode === 'dark' ? '#FFFFFF' : '#06B6D4')}
      stroke-width="26"
      stroke-linecap="round"
    />
    <path
      d="M296 264 L336 304 L376 264"
      stroke={mode === 'white' ? '#FFFFFF' : mode === 'light' ? '#0F172A' : (mode === 'dark' ? '#FFFFFF' : '#06B6D4')}
      stroke-width="26"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>
</svg>
