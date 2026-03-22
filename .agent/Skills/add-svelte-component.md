# スキル: Svelteコンポーネントの新規作成

## 使い方
`{{placeholder}}` を埋めてAIへのプロンプトとして使ってください。

---

## プロンプトテンプレート

```
# Svelteコンポーネント作成: {{コンポーネント名}}.svelte

## 配置場所
src/renderer/components/{{サブフォルダ}}/{{コンポーネント名}}.svelte

## 担当AI
{{Gemini Code Assist / OpenAI Codex / Claude Code}}

## 目的
{{コンポーネントが何を表示・担当するか（1〜2文）}}

## Props（受け取るデータ）
```typescript
// このコンポーネントが受け取るpropsの型定義
{{
  prop1: 型;       // 説明
  prop2?: 型;      // 説明（?はオプション）
}}
```

## 発行するイベント
{{
  on:click → 何かのイベント
  なし
}}

## 依存するストア
{{
  $weatherStore → 天気データを読み取る
  なし
}}

## 見た目の仕様
{{
  - daisyUIのXXXコンポーネントを使う
  - 〇〇色の背景
  - モバイルではXX、デスクトップではYY
}}

## 要件
- [ ] Svelte <script lang="ts"> を使う
- [ ] 全てのpropsにTypeScript型を付ける
- [ ] 全ての処理に日本語コメントを付ける（学習目的）
- [ ] aria-label / role 等のアクセシビリティ属性を追加する
- [ ] daisyUIのテーマ変数（hsl(var(--p)) 等）を使う（ハードコード禁止）
- [ ] .agent/MemoryBank/progress.md を作業後に更新する

## 参照ファイル
- .agent/MemoryBank/ui-decisions.md（デザイン方針確認）
- tailwind.config.ts（テーマ定義確認）
- .agent/AGENT.md（コーディング規約）
```

---

## 記入例

```
# Svelteコンポーネント作成: PrecipBar.svelte

## 配置場所
src/renderer/components/weather/PrecipBar.svelte

## 担当AI
Gemini Code Assist

## 目的
1日の降水確率を時間帯（00-06時、06-12時、12-18時、18-24時）ごとにバーグラフで表示する

## Props
```typescript
{
  pops: string[];    // 降水確率の配列（例: ["10", "20", "30", "40"]）
  date: string;      // 表示日付（ラベル用）
}
```

## 見た目の仕様
- 横方向のバー4本を縦に並べる
- バーの色: 降水確率に応じて青の濃度が変わる（10%=薄い、80%=濃い）
- 各バーに「06-12時: 20%」のようなラベルを付ける
- daisyUIの progress コンポーネントを使う

...
```
