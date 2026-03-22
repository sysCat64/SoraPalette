# Skills（スキルテンプレート）

このフォルダには、3つのAIが共通して使える**プロンプトテンプレート**が入っています。
`{{placeholder}}` の部分を作業内容に合わせて埋めて使ってください。

---

## スキル一覧

| ファイル | 用途 |
|----------|------|
| `add-feature.md` | 新機能の追加 |
| `add-svelte-component.md` | Svelteコンポーネントの新規作成 |
| `add-ipc-handler.md` | Electron IPCハンドラの追加 |
| `write-tests.md` | テストの追加 |
| `debug-electron.md` | Electronアプリのデバッグ |

---

## 使い方

1. 該当するスキルファイルを開く
2. `{{placeholder}}` の部分を具体的な内容に置き換える
3. AIへのプロンプトとして使用する

### 例: 新しいSvelteコンポーネントを追加する場合

`add-svelte-component.md` を開いて：
```
{{コンポーネント名}} → WindIndicator
{{担当AI}} → Gemini Code Assist
{{props}} → direction: string, speed: number
```
のように埋めてからAIに渡す。
