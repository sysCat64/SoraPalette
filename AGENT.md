# SoraPalette - AI共通エージェント設定

> このファイルが正本です。`.agent/AGENT.md` はこのファイルへのポインタです。
> Claude Code / OpenAI Codex / Gemini Code Assist の3つのAIが共通して参照する
> プロジェクト規約・アーキテクチャ・連携ルールをまとめています。

---

## プロジェクト概要

| 項目 | 内容 |
|------|------|
| アプリ名 | SoraPalette（ソラ・パレット） |
| 種別 | Electronデスクトップ天気予報アプリ |
| 目的 | デスクトップアプリ開発の**学習用**プロジェクト |
| データソース | 気象庁オープンデータAPI（JMA） |
| 技術スタック | Electron + Svelte + TypeScript + Tailwind CSS + daisyUI |
| ビルドツール | Vite（electron-vite） |
| テスト | Vitest（ユニットテスト）/ Playwright（E2Eテスト） |
| 対象OS | クロスプラットフォーム（macOS / Windows / Linux） |

---

## 必須コーディング規約（全AI厳守）

1. **日本語コメント必須**: 全ソースファイルに詳細な日本語コメントを記述する
   - Svelte特有の構文、Tailwindクラスの役割、非同期処理の意図を説明すること
   - 「なぜそうしたか」の意図も記述する（学習目的のため）
2. **TypeScript strict mode**: `tsconfig.json` の `strict: true` を維持する
3. **セキュリティ設定を変更しない**:
   - `contextIsolation: true` を維持する（必須）
   - `nodeIntegration: false` を維持する（必須）
   - `sandbox: true` を維持する（必須）
4. **IPC通信のみ**: メインプロセス↔レンダラーの通信は必ずIPCを通す（直接アクセス禁止）
5. **fetchはメインプロセスのみ**: JMA APIへのネットワークアクセスはメインプロセスで行う（CORS回避）
6. **Svelteリアクティビティを使う**: 直接DOMを操作しない（`document.getElementById` 等は禁止）
7. **コミット前チェック**: `npm run lint` と `npm run typecheck` を通すこと

---

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────┐
│  Renderer Process (Svelte + Tailwind + daisyUI)     │
│  ・UIの描画（コンポーネント）                           │
│  ・Svelteストアで状態管理                              │
│  ・window.electronAPI 経由でメインプロセスと通信        │
└──────────────────────┬──────────────────────────────┘
                       │ IPC (contextBridge)
┌──────────────────────┴──────────────────────────────┐
│  Preload Script (contextBridge)                     │
│  ・Node.js APIをレンダラーに安全に公開                  │
│  ・window.electronAPI として型付きAPIを提供             │
└──────────────────────┬──────────────────────────────┘
                       │ ipcMain.handle / ipcRenderer.invoke
┌──────────────────────┴──────────────────────────────┐
│  Main Process (Node.js + Electron)                  │
│  ・BrowserWindow管理                                 │
│  ・JMA APIへのfetch（CORS回避のためここで実行）         │
│  ・electron-storeによる設定永続化                      │
│  ・オフラインキャッシュ管理                             │
└─────────────────────────────────────────────────────┘
```

---

## IPCチャンネル命名規約

| チャンネル名 | 方向 | 用途 |
|------------|------|------|
| `weather:fetch` | renderer → main | JMA APIから天気データを取得（キャッシュ書き込みも同時に行い返り値に含める） |
| `weather:cache-read` | renderer → main | キャッシュされた天気データを読み込む |
| `store:get` | renderer → main | electron-storeから設定値を読み込む |
| `store:set` | renderer → main | electron-storeへ設定値を書き込む |
| `notification:send` | renderer → main | デスクトップ通知を送信する |

### IPCレスポンス形式（全チャンネル共通）

`ipcMain.handle()` の返り値は必ず以下の形式に統一する。
レンダラー側（Codex担当）はこの形式を前提にストアを実装すること。

```typescript
// 成功時
{ success: true, data: T }

// 失敗時（エラーはメインプロセスで捕捉してレンダラーに返す）
{ success: false, error: string }
```

### electron-store キー名規約

`store:get` / `store:set` で使用するキー名は以下に統一する。
新しいキーを追加する場合は、このテーブルと `src/preload/types.ts` の型定義を同時に更新すること。

| キー名 | 型 | 用途 |
|--------|-----|------|
| `theme` | `'sora-light' \| 'sora-dark'` | 選択中のテーマ |
| `defaultAreaCode` | `string` | 起動時に表示するエリアコード |
| `favoriteAreas` | `string[]` | お気に入りエリアコード（最大5件） |
| `autoRefreshInterval` | `number` | 自動更新間隔（分・デフォルト: 30） |

---

## JMA APIエンドポイント

| 種別 | URL |
|------|-----|
| 週間予報（構造化JSON） | `https://www.jma.go.jp/bosai/forecast/data/forecast/{areaCode}.json` |
| 天気概況テキスト | `https://www.jma.go.jp/bosai/forecast/data/overview_forecast/{areaCode}.json` |
| 気象警報・注意報 | `https://www.jma.go.jp/bosai/warning/data/warning/{areaCode}.json` |
| エリアコード一覧 | `https://www.jma.go.jp/bosai/common/const/area.json` |

- デフォルトエリアコード: `130000`（東京地方）
- JMA APIにはCORSの制約あり → **必ずメインプロセスでfetchすること**

---

## ファイル担当分担

| AI | 主担当ファイル |
|----|--------------|
| **Claude Code** | `src/main/`（`services/`, `ipc/`含む）, `src/preload/`, `docs/`, `.agent/MemoryBank/`, `tests/e2e/` |
| **OpenAI Codex** | `src/renderer/stores/`, `src/renderer/lib/`, `src/renderer/types/jma.ts`, `src/renderer/types/app.ts`, `tests/unit/` |
| **Gemini Code Assist** | `src/renderer/components/`, `src/renderer/app.css` |

### OpenAI Codex の担当詳細

- `src/renderer/types/jma.ts` で JMA API の生レスポンス型を定義する
- `src/renderer/types/app.ts` で UI と store が扱う内部型を定義する
- `src/renderer/lib/` に変換・整形・マッピングなどの純粋関数を集約する
- `src/renderer/stores/` では IPC 呼び出しと状態遷移を担当し、重い変換処理は `lib/` に逃がす
- `tests/unit/` では `lib/` と `stores/` のユニットテストを担当する

### OpenAI Codex の実装順序

Codex は原則として以下の順で土台を整える。

1. `src/renderer/types/jma.ts`
2. `src/renderer/types/app.ts`
3. `src/renderer/lib/`
4. `src/renderer/stores/`
5. `tests/unit/`

### OpenAI Codex の担当外

- `src/preload/types.ts` の定義変更
- 新規 IPC チャンネルの追加
- `src/main/` の fetch / cache / Electron API 実装
- `src/renderer/components/` の UI 実装
- `src/renderer/app.css` のテーマ実装
- 統合テスト / E2E テストの主導

### Gemini Code Assist の担当詳細

- `src/renderer/components/` で Svelte と daisyUI を活用した UI コンポーネントを実装する
- `src/renderer/app.css` で `@theme` と daisyUI を使ったテーマ（sora-light, sora-dark）とスタイリングを定義する
- SVG と CSS animation を利用した、リサイズ耐性のある天気アイコンを実装する
- アクセシビリティ（ARIA属性、キーボードナビゲーション、prefers-reduced-motion）を考慮したマークアップを行う

### Gemini Code Assist の実装順序

Gemini は原則として、Codex が `stores` や `lib` の土台を整えた後に、以下の順で UI を構築する。

1. `src/renderer/app.css` の `@theme` とベーススタイル定義
2. アトミックな UI コンポーネント（SVGアイコン、ボタン、バッジなど）
3. 天気情報を表示するカードなどの複合コンポーネント
4. `stores` と連携してデータを画面にマッピングするコンテナコンポーネント（レイアウト）
5. アニメーションやアクセシビリティの微調整

### Gemini Code Assist の担当外

- `src/main/` および `src/preload/` の実装（Claude担当）
- `vite.config.ts` / `electron.vite.config.ts` での Tailwind CSS v4 プラグイン導入（Claude担当）
- `src/preload/types.ts` の型定義変更（Claude担当）
- `src/renderer/stores/` および `src/renderer/lib/` の状態管理・純粋関数の実装（Codex担当）
- 複雑なデータ変換や API レスポンスの解析（Codex担当）
- ユニットテスト、E2E テストの主導

### Gemini Code Assist の連携ルール

- コンポーネント内で直接 IPC 通信（`window.electronAPI`）を呼び出さず、必ず Codex が作成した Svelte ストア経由でデータを受け取る
- 複雑なデータ変換が必要になった場合はコンポーネント内に書かず、`progress.md` に要件を記載して Codex に `lib/` への関数切り出しを依頼する
- UI 上の新しいアクション（設定変更や手動更新など）を追加する際、ストアの機能不足や IPC チャンネルの不足があれば、`progress.md` を通じて Codex や Claude に追加を依頼する
- デザイン上の決定事項（カラーパレット、コンポーネント構成など）は `.agent/MemoryBank/ui-decisions.md` に記録する

### v1 機能単位の担当

| # | 機能 | 主担当 |
|---|------|--------|
| 1 | 今日の天気（天気概況・SVGアイコン） | Claude + Gemini |
| 2 | 7日間予報の横並びカード | Gemini |
| 3 | 最高/最低気温表示 | Gemini + Codex |
| 4 | 降水確率（時間帯別バー表示） | Gemini + Codex |
| 5 | 地域選択（全47都道府県） | Codex + Gemini |
| 6 | お気に入りエリア（最大5件） | Codex |
| 7 | テーマ切替（sora-light / sora-dark） | Gemini |
| 8 | 更新ボタン + 自動更新（30分間隔） | Claude + Codex |
| 9 | オフラインキャッシュ + 最終更新表示 | Claude |
| 10 | 気象警報バナー（JMA警報APIから取得） | Claude + Gemini |

### 連携境界（型定義ファイル）
```
Claude が定義  → src/preload/types.ts（IPC API の型定義）
                          ↓
Codex が消費   → src/renderer/stores/（storeからIPCを呼ぶ）
                          ↓
Gemini が消費  → src/renderer/components/（$storeからデータを受け取りレンダリング）
```

### OpenAI Codex の連携ルール

- Codex は `src/preload/types.ts` を参照して利用可能な IPC API を判断する
- `src/preload/types.ts` の変更が必要になった場合、Codex は先に `progress.md` へ不足内容と影響範囲を記録し、Claude に委ねる
- Codex は JMA の生レスポンスをそのまま store に保持せず、`types/jma.ts` から `types/app.ts` への変換を `lib/` で行う
- Gemini に渡す段階では、store の公開 shape と主要な派生値を安定させる
- Claude に渡す段階では、必要な IPC 差分、前提型、エラーケースを `progress.md` に明記する

### `src/preload/types.ts` 変更ルール

`src/preload/types.ts` は Claude が定義するが、Codex と Gemini の実装に直接影響する。
変更する際は以下を必ず守ること。

1. 変更前に `.agent/MemoryBank/progress.md` に変更内容と影響範囲を記録する
2. `.agent/MemoryBank/architecture.md` にADRを追記する
3. 変更後、Codex担当の `src/renderer/stores/` と Gemini担当の `src/renderer/components/` に追従が必要かを確認し `progress.md` の「次のタスク」に明記する

### 担当外ファイルの扱い

- 担当外のファイルは原則として変更しない
- 担当外ファイルへの変更が必要になった場合は、`progress.md` に理由と変更内容を記録し、担当AIに委ねること
- やむを得ず変更する場合は、変更前に `progress.md` にコメントを残すこと

---

## MemoryBank 使用ルール

### 更新権限

| 操作 | 権限 |
|------|------|
| `progress.md` の更新 | **全AI**が作業終了時に更新する |
| `architecture.md` へのADR追記 | **Claude Code 主導**。他AIは必要事項を `progress.md` に記録する |
| `jma-api-notes.md` への追記 | **全AI**がAPI調査時に追記してよい |
| `ui-decisions.md` への追記 | **Gemini Code Assist 主導**。他AIは必要事項を `progress.md` に記録する |
| MemoryBankの構造変更・新規ファイル追加 | **Claude Code のみ** |

### 更新タイミング

| タイミング | アクション |
|-----------|-----------|
| 作業開始時 | `.agent/MemoryBank/progress.md` を必ず読む |
| 作業終了時 | `progress.md` の「完了タスク」と「次のタスク」を更新する |
| 設計変更時 | `.agent/MemoryBank/architecture.md` にADRを追記する |
| API調査時 | `.agent/MemoryBank/jma-api-notes.md` に発見事項を追記する |
| UIデザイン決定時 | `.agent/MemoryBank/ui-decisions.md` に決定内容を追記する |

---

## スコープ外（実装禁止）

- バックエンドサーバーの構築
- ユーザー認証・ログイン機能
- 課金・サブスクリプション機能
- JMA API以外の外部APIの追加（事前合意なしに追加しない）
- `nodeIntegration: true` への変更
- `contextIsolation: false` への変更
- `sandbox: false` への変更

---

## AI向け公式ドキュメント参照リンク

各AIが最新の仕様やAPIを確認する際は、以下の公式ドキュメントを優先して参照してください。

### コアフレームワーク & 言語
- **Electron**: https://www.electronjs.org/docs/latest/
- **Svelte**: https://svelte.dev/docs/svelte/overview
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Node.js**: https://nodejs.org/docs/latest/api/

### スタイリング & UI
- **Tailwind CSS**: https://tailwindcss.com/docs/
- **daisyUI**: https://daisyui.com/docs/

### 設定永続化
- **electron-store**: https://github.com/sindresorhus/electron-store

### ビルドツール & テスト
- **electron-vite**: https://electron-vite.org/guide/
- **Vite**: https://vite.dev/guide/
- **Vitest**: https://vitest.dev/guide/
- **Playwright**: https://playwright.dev/docs/intro
- **Playwright (Electron)**: https://playwright.dev/docs/api/class-electronapplication
