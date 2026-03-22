# SoraPalette - Claude Code 設定

> Claude Code がこのプロジェクトで作業する際の専用ガイドラインです。
> 共通規約は `AGENT.md`（または `.agent/AGENT.md`）を参照してください。

---

## Claude Code の担当領域

### 主担当ファイル
- `src/main/` — Electronメインプロセス全体（`services/`, `ipc/` を含む）
- `src/preload/` — contextBridgeによるIPC API定義
- `docs/` — アーキテクチャ文書・ADR・学習用ガイド
- `tests/e2e/` — Playwrightによるエンドツーエンドテスト
- `.agent/MemoryBank/` — 全AIが各ファイルを更新可。構造変更・新規追加はClaudeのみ

### 得意とするタスク
- **アーキテクチャ設計**: Electronのプロセスモデル・IPC設計・セキュリティ設計
- **TypeScript型定義**: プリロードの型・JMA APIレスポンスの型定義
- **セキュリティレビュー**: contextIsolation・CSP・contextBridgeの露出範囲検査
- **テスト戦略**: 統合テスト・E2Eテストの構成
- **ドキュメント生成**: ADR・アーキテクチャ解説・学習用ガイド
- **リファクタリング**: 複数ファイルにまたがる設計変更

---

## 作業開始チェックリスト

```
□ .agent/MemoryBank/progress.md を読む（現在の状況を把握）
□ .agent/MemoryBank/architecture.md で直近のADRを確認
□ AGENT.md のコーディング規約を確認
□ src/preload/types.ts の現在の型定義を確認（IPCとの整合性）
```

---

## 作業終了チェックリスト

```
□ .agent/MemoryBank/progress.md を更新する
  - 完了したタスクを「完了」セクションに移す
  - 次のセッションのタスクを「次のタスク」セクションに記載する
□ アーキテクチャ変更があれば .agent/MemoryBank/architecture.md にADRを追記
□ npm run lint && npm run typecheck が通ることを確認
```

---

## メインプロセス実装の注意事項

```typescript
// ✅ 正しい: ipcMain.handle() は必ず try/catch で包む
ipcMain.handle('weather:fetch', async (_event, areaCode: string) => {
  try {
    const data = await jmaService.fetchForecast(areaCode);
    return { success: true, data };
  } catch (error) {
    // エラーはメインプロセスで捕捉してレンダラーに返す
    return { success: false, error: (error as Error).message };
  }
});

// ❌ 禁止: レンダラーからの直接Node.js API呼び出し
// contextIsolation: true により不可能だが、設計上も行わない
```

---

## BrowserWindow セキュリティ設定テンプレート

```typescript
const win = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, '../preload/index.js'),
    contextIsolation: true,   // 必須: レンダラーとNodeの分離
    nodeIntegration: false,   // 必須: レンダラーでのNode.js禁止
    sandbox: true,            // 必須: サンドボックス化（AGENT.md規約）
  },
});
```

---

## JMA APIはメインプロセスでfetch

```typescript
// ✅ 正しい: src/main/services/jmaService.ts でfetch
// JMA APIはCORSヘッダーを返さないため、
// レンダラーからの直接fetchは失敗する。
// メインプロセスのNode.js環境からfetchすることで回避。
export async function fetchForecast(areaCode: string): Promise<JmaForecast[]> {
  const url = `https://www.jma.go.jp/bosai/forecast/data/forecast/${areaCode}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`JMA API エラー: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<JmaForecast[]>;
}
```

---

## 型定義の集約場所

| ファイル | 内容 |
|----------|------|
| `src/preload/types.ts` | `window.electronAPI` の型定義（Codex・Geminiが参照） |
| `src/renderer/types/jma.ts` | JMA APIレスポンスの型（Codexが主担当） |
| `src/renderer/types/app.ts` | アプリ内部データの型（Codexが主担当） |

> `src/preload/types.ts` はClaudeが定義するが、**変更時はCodexとGeminiに影響する**。
> 変更前に `.agent/MemoryBank/progress.md` にコメントを残すこと。
