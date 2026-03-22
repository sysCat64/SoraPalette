# アーキテクチャ決定記録（ADR）

> このファイルは**追記専用**です。過去の決定を書き換えないでください。
> 新しい決定は末尾に追記してください。

---

## ADRテンプレート

```markdown
## ADR-NNN: タイトル

- **日付**: YYYY-MM-DD
- **決定者**: AI名 or 人間
- **状態**: 提案 / 採用 / 廃止

### 背景・課題
なぜこの決定が必要だったか

### 決定内容
何を決めたか

### 根拠
なぜこの選択をしたか

### 影響・注意点
この決定によって生じる制約や影響
```

---

## ADR-001: Electron + Vite（electron-vite）の採用

- **日付**: 2026-03-21
- **決定者**: プロジェクト立案時
- **状態**: 採用

### 背景・課題
Electronアプリのビルドツールとして、webpack（従来）かVite（新世代）かを選択する必要があった。

### 決定内容
`electron-vite` テンプレートを使用し、メインプロセス・プリロード・レンダラーをViteでビルドする。

### 根拠
- HMR（ホットモジュールリプレースメント）によって開発速度が大幅に向上
- SvelteとTailwindのViteプラグインが充実しており、設定が簡潔
- `electron-vite` はElectronのマルチプロセス構造に対応した設定を提供
- TypeScript対応が標準で整っている

### 影響・注意点
- Viteの `type: "module"` と Electron の CJS 環境の混在に注意
- `electron-vite` が生成するビルド設定を基本的には変更しない

---

## ADR-002: contextBridge + IPC パターンの採用

- **日付**: 2026-03-21
- **決定者**: プロジェクト立案時
- **状態**: 採用

### 背景・課題
レンダラープロセス（Svelte）からNode.js APIやElectron APIにアクセスする方法を決める必要があった。

### 決定内容
- `contextIsolation: true` + `nodeIntegration: false` のセキュア設定を維持する
- プリロードスクリプトで `contextBridge.exposeInMainWorld('electronAPI', {...})` を定義する
- レンダラーは `window.electronAPI` 経由でのみメインプロセスと通信する

### 根拠
- セキュリティのベストプラクティス（Electronドキュメント推奨）
- contextBridgeがAPIの境界を明確にし、型定義がしやすい
- 学習目的として「レンダラーとメインの分離」を明示的に実感できる

### 影響・注意点
- `src/preload/types.ts` が全AI連携の型境界となる（変更時は全AI通知）
- JMA APIのfetchは必ずメインプロセスで行う（CORS制約回避）

---

## ADR-003: JMA forecast APIの採用（overview_forecastではなく）

- **日付**: 2026-03-21
- **決定者**: プロジェクト立案時
- **状態**: 採用

### 背景・課題
JMAには2種類の予報エンドポイントがある：
1. `overview_forecast` — テキストベースの天気概況（簡単だが情報量が少ない）
2. `forecast` — 構造化JSON（気温・降水確率・天気コードを含む）

### 決定内容
`forecast` エンドポイントをメインのデータソースとして使用する。
必要に応じて `overview_forecast` を補足テキストとして追加利用する。

### 根拠
- v1機能要件（気温・降水確率・7日間予報）は `forecast` エンドポイントにしか含まれない
- 学習目的として複雑なJSONパースの経験が得られる

### 影響・注意点
- `forecast` のJSONは複雑にネストしており、パース処理に工夫が必要
- 地域によって気温データが含まれない場合がある（`undefined` チェック必須）
- `.agent/MemoryBank/jma-api-notes.md` に詳細なレスポンス構造を記録すること
