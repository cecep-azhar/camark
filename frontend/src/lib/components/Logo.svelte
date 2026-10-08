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
  <!-- Folded Document Frame & Bold Code Tag -->
  <g fill="none">
    <path
      d="M128 88 L304 88 L384 168 L384 424 L128 424 Z"
      stroke={mode === 'white' ? '#FFFFFF' : mode === 'light' ? '#0A0A0C' : '#06B6D4'}
      stroke-width="28"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M304 88 L304 168 L384 168"
      stroke={mode === 'white' ? '#FFFFFF' : mode === 'light' ? '#0A0A0C' : '#06B6D4'}
      stroke-width="28"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <polyline
      points="206,260 166,298 206,336"
      stroke={mode === 'white' ? '#FFFFFF' : mode === 'light' ? '#0A0A0C' : '#22D3EE'}
      stroke-width="28"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <polyline
      points="306,260 346,298 306,336"
      stroke={mode === 'white' ? '#FFFFFF' : mode === 'light' ? '#0A0A0C' : '#22D3EE'}
      stroke-width="28"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <line
      x1="272"
      y1="262"
      x2="240"
      y2="334"
      stroke={mode === 'white' ? '#FFFFFF' : mode === 'light' ? '#0A0A0C' : '#FFFFFF'}
      stroke-width="28"
      stroke-linecap="round"
    />
  </g>
</svg>
