<!--
  src/renderer/components/icons/RainyIcon.svelte

  雨アイコン。雲＋雨粒の線で表現する。
  担当: Claude Code（Phase 3 代替実装）
-->
<script lang="ts">
  export let size: number = 64
  export let animated: boolean = false
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 64 64"
  xmlns="http://www.w3.org/2000/svg"
  aria-label="雨"
  role="img"
  class:animated
>
  <!-- 雲 -->
  <g fill="currentColor" opacity="0.85">
    <ellipse cx="32" cy="28" rx="18" ry="9" />
    <circle  cx="21" cy="24" r="9" />
    <circle  cx="33" cy="17" r="11" />
    <circle  cx="44" cy="22" r="9" />
  </g>
  <!-- 雨粒（3本の斜め線） -->
  <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="drops" opacity="0.9">
    <line x1="22" y1="42" x2="19" y2="54" />
    <line x1="32" y1="42" x2="29" y2="54" />
    <line x1="42" y1="42" x2="39" y2="54" />
  </g>
</svg>

<style>
  svg {
    color: oklch(55% 0.12 250); /* 青系 */
    display: block;
  }

  @media (prefers-reduced-motion: no-preference) {
    .animated .drops {
      animation: fall 1s linear infinite;
    }
  }

  @keyframes fall {
    from { transform: translateY(-4px); opacity: 0.4; }
    to   { transform: translateY(4px);  opacity: 1; }
  }
</style>
