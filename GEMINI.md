# SoraPalette - Gemini Code Assist 設定

> Gemini Code Assist がこのプロジェクトで作業する際の専用ガイドラインです。
> 共通規約は `AGENT.md`（または `.agent/AGENT.md`）を参照してください。


## Gemini の担当領域

### 主担当ファイル
- `src/renderer/components/` — Svelteコンポーネント全体
- `src/renderer/app.css` — Tailwind CSS v4 の `@theme` / daisyUI テーマ定義 + カスタムCSS・アニメーション

### 得意とするタスク
- **UIコンポーネント設計**: daisyUIを活用した視覚的に豊かなコンポーネント
- **SVGアニメーション**: SMIL・CSS animationを使った天気アイコンのアニメーション
- **Tailwind CSS設計**: レスポンシブレイアウト・ダークモード・カスタムテーマ
- **daisyUIテーマ**: カスタムカラーパレット定義（sora-light, sora-dark）
- **アクセシビリティ**: ARIA属性・キーボードナビゲーション・prefers-reduced-motion対応

---

## 作業開始チェックリスト

```
□ .agent/MemoryBank/progress.md を読む（現在の状況を把握）
□ .agent/MemoryBank/ui-decisions.md でデザイン決定を確認
□ `src/renderer/app.css` の既存 `@theme` / daisyUI テーマ定義を参照
□ src/renderer/stores/ の型定義を確認（コンポーネントで使うデータ構造）
```

---

## 作業終了チェックリスト

```
□ .agent/MemoryBank/progress.md を更新する
□ デザイン上の決定事項を .agent/MemoryBank/ui-decisions.md に追記
□ npm run lint が通ることを確認
□ 主要ブラウザ（Chromium）で見た目を確認
```

---

## 実装上の注意事項

### SVGアイコンはSvelteコンポーネントとして実装

```svelte
<!-- src/renderer/components/icons/SunnyIcon.svelte -->
<script lang="ts">
  // アイコンのサイズをpropsで受け取れるようにする
  export let size: number = 64;
  export let animated: boolean = true;
</script>

<!-- インラインSVGで実装することでウィンドウリサイズ時もぼやけない -->
<svg
  width={size}
  height={size}
  viewBox="0 0 64 64"
  xmlns="http://www.w3.org/2000/svg"
  aria-label="晴れ"
  role="img"
>
  <!-- CSS animationクラスはanimated propで制御 -->
  <circle class={animated ? 'sun-rotate' : ''} cx="32" cy="32" r="16" fill="currentColor" />
</svg>

<style>
  /* prefers-reduced-motion に対応:
     ユーザーがOSで「動きを減らす」設定をしている場合はアニメーション停止 */
  @media (prefers-reduced-motion: no-preference) {
    .sun-rotate {
      animation: spin 20s linear infinite;
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); transform-origin: 32px 32px; }
    to   { transform: rotate(360deg); transform-origin: 32px 32px; }
  }
</style>
```

### daisyUIテーマ変数を活用する

```css
/* ✅ 正しい: daisyUIのテーマ変数を使う（テーマ切替に追随する） */
.weather-card {
  background-color: hsl(var(--b1));  /* base-100 */
  color: hsl(var(--bc));              /* base-content */
  border-color: hsl(var(--b3));       /* base-300 */
}

/* ❌ 避ける: ハードコードした色（テーマ切替で変わらない） */
.weather-card {
  background-color: #ffffff;
  color: #333333;
}
```

### Tailwind arbitrary valueは最小限に

```svelte
<!-- ✅ 推奨: Tailwindの標準クラスを使う -->
<div class="p-4 rounded-xl shadow-md bg-base-100">

<!-- ⚠️ 最小限に: arbitrary valueは標準クラスで対応できない場合のみ -->
<div class="h-[72px]">  <!-- この場合はOK: 標準にない高さ -->
```

---

## テーマ定義ガイドライン

v1では2テーマを実装する。`src/renderer/app.css` の `@theme` と daisyUI 設定に以下の構造で定義する。

### sora-light（昼空テーマ）
- Primary: 空色（#4a9eff 相当）
- Secondary: 雲白（#e8f4f8 相当）
- Background: 薄い青白（#f0f8ff 相当）

### sora-dark（夜空テーマ）
- Primary: 月光色（#93c5fd 相当）
- Secondary: 深海色（#1e3a5f 相当）
- Background: 夜空色（#0f172a 相当）

> Catppuccin テーマは v2 以降で追加予定。
> デザインの最終決定は `.agent/MemoryBank/ui-decisions.md` に記録すること。


## コンポーネントへのデータ連携（Codex との境界）

Gemini はコンポーネントのレンダリングを担当します。データは必ず Codex が実装した Svelte ストアから受け取り、
IPC や Node.js API を直接呼び出さないこと。

```svelte
<script lang="ts">
  // ✅ 正しい: ストア経由でデータを受け取る（Codex が管理）
  import { weatherStore } from '../stores/weatherStore';
  $: forecast = $weatherStore.forecast;

  // ❌ 禁止: コンポーネントからIPCを直接呼ばない
  // const data = await window.electronAPI.weather.fetch('130000');
</script>
```
