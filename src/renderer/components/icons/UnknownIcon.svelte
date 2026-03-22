<!--
  src/renderer/components/icons/UnknownIcon.svelte

  天気不明アイコン。円内に「?」を表示する。
  担当: Claude Code（Phase 3 代替実装）
-->
<script lang="ts">
  export let size: number = 64
  /** v2 でアニメーションを有効化するフラグ（v1 では未使用） */
  export const animated: boolean = false
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 64 64"
  xmlns="http://www.w3.org/2000/svg"
  aria-label="天気不明"
  role="img"
>
  <!-- 背景円 -->
  <circle cx="32" cy="32" r="26" fill="currentColor" opacity="0.2" />
  <!-- 枠線 -->
  <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" stroke-width="3" />
  <!-- クエスチョンマーク -->
  <text
    x="32"
    y="41"
    text-anchor="middle"
    font-size="26"
    font-weight="bold"
    font-family="sans-serif"
    fill="currentColor"
  >?</text>
</svg>

<style>
  svg {
    color: oklch(60% 0.04 250);
    display: block;
  }
</style>
