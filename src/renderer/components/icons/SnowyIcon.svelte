<!--
  src/renderer/components/icons/SnowyIcon.svelte

  雪アイコン。雲＋雪の結晶（六角形のアスタリスク）で表現する。
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
  aria-label="雪"
  role="img"
  class:animated
>
  <!-- 雲 -->
  <g fill="currentColor" opacity="0.8">
    <ellipse cx="32" cy="28" rx="18" ry="9" />
    <circle  cx="21" cy="24" r="9" />
    <circle  cx="33" cy="17" r="11" />
    <circle  cx="44" cy="22" r="9" />
  </g>
  <!-- 雪の結晶（3つのアスタリスク） -->
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" class="flakes" opacity="0.9">
    <!-- 左の結晶 -->
    <line x1="20" y1="42" x2="20" y2="54" />
    <line x1="14" y1="45" x2="26" y2="51" />
    <line x1="14" y1="51" x2="26" y2="45" />
    <!-- 中央の結晶 -->
    <line x1="32" y1="42" x2="32" y2="54" />
    <line x1="26" y1="45" x2="38" y2="51" />
    <line x1="26" y1="51" x2="38" y2="45" />
    <!-- 右の結晶 -->
    <line x1="44" y1="42" x2="44" y2="54" />
    <line x1="38" y1="45" x2="50" y2="51" />
    <line x1="38" y1="51" x2="50" y2="45" />
  </g>
</svg>

<style>
  svg {
    color: oklch(72% 0.08 240); /* 淡い青白 */
    display: block;
  }

  @media (prefers-reduced-motion: no-preference) {
    .animated .flakes {
      animation: twinkle 2s ease-in-out infinite alternate;
    }
  }

  @keyframes twinkle {
    from { opacity: 0.5; }
    to   { opacity: 1; }
  }
</style>
