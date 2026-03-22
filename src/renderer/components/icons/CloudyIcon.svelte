<!--
  src/renderer/components/icons/CloudyIcon.svelte

  くもりアイコン。重なった円でクラウド形状を表現する。
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
  aria-label="くもり"
  role="img"
  class:animated
>
  <!-- 雲本体（重ねた円群でクラウド形状） -->
  <g fill="currentColor" class="cloud">
    <ellipse cx="32" cy="40" rx="20" ry="10" />
    <circle  cx="20" cy="35" r="10" />
    <circle  cx="33" cy="27" r="13" />
    <circle  cx="45" cy="33" r="10" />
  </g>
</svg>

<style>
  svg {
    color: oklch(70% 0.03 250); /* グレー寄りの色 */
    display: block;
  }

  @media (prefers-reduced-motion: no-preference) {
    .animated .cloud {
      animation: drift 6s ease-in-out infinite alternate;
    }
  }

  @keyframes drift {
    from { transform: translateX(0); }
    to   { transform: translateX(4px); }
  }
</style>
