<!--
  src/renderer/components/icons/SunnyIcon.svelte

  晴れアイコン。太陽と放射状の光線で表現する。
  担当: Claude Code（Phase 3 代替実装）
-->
<script lang="ts">
  /** アイコンのピクセルサイズ */
  export let size: number = 64
  /** v2 でアニメーションを有効化するフラグ（v1 では未使用） */
  export let animated: boolean = false
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 64 64"
  xmlns="http://www.w3.org/2000/svg"
  aria-label="晴れ"
  role="img"
  class:animated
>
  <!-- 光線（8本） -->
  <g stroke="currentColor" stroke-width="3" stroke-linecap="round" class="rays">
    <line x1="32" y1="4"  x2="32" y2="12" />
    <line x1="32" y1="52" x2="32" y2="60" />
    <line x1="4"  y1="32" x2="12" y2="32" />
    <line x1="52" y1="32" x2="60" y2="32" />
    <line x1="10" y1="10" x2="16" y2="16" />
    <line x1="48" y1="48" x2="54" y2="54" />
    <line x1="54" y1="10" x2="48" y2="16" />
    <line x1="16" y1="48" x2="10" y2="54" />
  </g>
  <!-- 太陽本体 -->
  <circle cx="32" cy="32" r="12" fill="currentColor" />
</svg>

<style>
  svg {
    color: oklch(75% 0.18 80); /* 太陽色（琥珀寄りの黄色） */
    display: block;
  }

  /* prefers-reduced-motion 対応: ユーザー設定で動きを制限している場合は停止 */
  @media (prefers-reduced-motion: no-preference) {
    .animated .rays {
      animation: spin 20s linear infinite;
      transform-origin: 32px 32px;
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
</style>
