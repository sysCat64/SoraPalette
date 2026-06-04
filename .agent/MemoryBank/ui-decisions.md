# UIデザイン決定記録

> デザイン上の決定事項を記録します。
> Gemini Code Assist は作業前に必ずこのファイルを確認してください。

---

## テーマ設計

### v1テーマ一覧

| テーマ名 | 種別 | コンセプト |
|---------|------|-----------|
| `sora-light` | ライト | 昼の空・爽やかな青空 |
| `sora-dark` | ダーク | 夜の空・静かな夜空 |

### sora-light カラーパレット（案）

| daisyUI変数 | 色名 | Hex（参考値） |
|-------------|------|-------------|
| primary | 空色 | `#4a9eff` |
| primary-content | 白 | `#ffffff` |
| secondary | 雲白 | `#e8f4f8` |
| secondary-content | 濃い空色 | `#1a5fa8` |
| accent | 太陽色 | `#fbbf24` |
| accent-content | 白 | `#ffffff` |
| base-100 | 薄い青白 | `#f0f8ff` |
| base-200 | 薄い水色 | `#e1f0f8` |
| base-300 | 水色 | `#c8e6f5` |
| base-content | 濃紺 | `#1a3a5c` |

### sora-dark カラーパレット（案）

| daisyUI変数 | 色名 | Hex（参考値） |
|-------------|------|-------------|
| primary | 月光色 | `#93c5fd` |
| primary-content | 夜空色 | `#0f172a` |
| secondary | 深海色 | `#1e3a5f` |
| secondary-content | 月光色 | `#93c5fd` |
| accent | 星色 | `#fde68a` |
| accent-content | 夜空色 | `#0f172a` |
| base-100 | 夜空色 | `#0f172a` |
| base-200 | 深夜色 | `#1a2744` |
| base-300 | 夜色 | `#243356` |
| base-content | 月白色 | `#e2e8f0` |

> **注意**: 上記の色は案であり、Gemini Code Assistが実装時に調整してよい。
> 最終決定した色は「確定カラーパレット」セクションに記録すること。

---

## 確定カラーパレット

### sora-light
- primary: `#4a9eff` (oklch 68% 0.15 250)
- secondary: `#e8f4f8` (oklch 96% 0.02 230)
- accent: `#fbbf24` (oklch 82% 0.16 85)
- base-100: `#f0f8ff` (oklch 97% 0.02 245)
- base-200: `#e1f0f8` (oklch 94% 0.03 245)
- base-300: `#c8e6f5` (oklch 90% 0.04 245)
- base-content: `#1a3a5c` (oklch 30% 0.06 250)

### sora-dark
- primary: `#93c5fd` (oklch 82% 0.08 245)
- primary-content: `#0f172a` (oklch 18% 0.04 250)
- secondary: `#1e3a5f` (oklch 30% 0.08 250)
- secondary-content: `#93c5fd` (oklch 82% 0.08 245)
- accent: `#fde68a` (oklch 90% 0.14 90)
- accent-content: `#0f172a` (oklch 18% 0.04 250)
- base-100: `#0f172a` (oklch 18% 0.04 250)
- base-200: `#1a2744` (oklch 22% 0.06 250)
- base-300: `#243356` (oklch 28% 0.06 250)
- base-content: `#e2e8f0` (oklch 92% 0.01 250)

---

## コンポーネント設計方針

### SVGアイコン
- 全てSvelteコンポーネントとして実装（`src/renderer/components/icons/`）
- `size` プロパティでサイズ指定（デフォルト: 64px）
- `animated` プロパティでアニメーション on/off（デフォルト: true）
- `aria-label` と `role="img"` を必ず付ける（アクセシビリティ）
- `prefers-reduced-motion` に対応する
- **実装状況**: v1用として `SunnyIcon`, `CloudyIcon`, `RainyIcon`, `SnowyIcon`, `UnknownIcon` を実装済み。共通ラッパーとして `WeatherIcon.svelte` を使用。

### 天気カード（WeatherCard）
- daisyUIの `card` コンポーネントをベースにする
- 天気背景グラデーション: 天気コードに応じて動的に変化
  - 実装は一旦ベースカラーに依存したシンプルな表示を優先し、必要に応じてグラデーション追加を検討
- **レイアウト**: 左側にエリア名とアイコン、右側に天気説明、最高/最低気温、降水確率、風・波情報を配置。

### 週間予報（ForecastStrip）
- 横スクロール可能なカードリストとして実装。各カードに日付、アイコン、降水確率、最高/最低気温を表示。

### レイアウト
- ウィンドウサイズ: リサイズ可能。最小サイズは 360×600px。
- レスポンシブ: Tailwindのブレークポイントを使用（コンパクト/標準切替）

---

## アニメーション仕様

- `animated` prop と `prefers-reduced-motion` 対応を実装済み。
- 現在の仕様:
  - 晴れ: 太陽の光芒が緩やかに回転（20秒/周）
  - くもり: 雲が左右にゆっくり流れる（6秒/往復）
  - 雨: 雨粒が上下に流れる（1秒/周）
  - 雪: 雪片が明滅する（2秒/往復）

---

## 未決定事項

- [ ] ウィンドウサイズ（固定 or リサイズ可能）→ `projectbrief.md` 参照
- [ ] フォント選択（システムフォント使用か、Webフォント読み込みか）
- [ ] カードの角丸・シャドウの強さ（可愛らしい → 大きめの角丸推奨）

---

## 更新履歴

| 日付 | 更新者 | 内容 |
|------|--------|------|
| 2026-03-21 | Claude Code | 初版作成。テーマカラーパレット案・コンポーネント方針を記録 |
| 2026-03-22 | Gemini Code Assist | SVGアイコン、WeatherCard、ForecastStripのコンポーネント実装の確定事項を追記 |
