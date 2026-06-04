# ⛅ SoraPalette（ソラ・パレット）

[![CI](https://github.com/sysCat64/SoraPalette/actions/workflows/ci.yml/badge.svg)](https://github.com/sysCat64/SoraPalette/actions/workflows/ci.yml)

気象庁オープンデータを使った、Electronデスクトップ天気予報アプリです。
**デスクトップアプリ開発の学習**を目的としており、実装とあわせて設計意図や日本語コメントも残しています。

---

## 実装済み機能

| # | 機能 | 状態 |
|---|------|------|
| 1 | 今日の天気（天気概況・SVGアイコン） | ✅ 実装済み |
| 2 | 7日間予報の横並びカード | ✅ 実装済み |
| 3 | 最高 / 最低気温表示 | ✅ 実装済み |
| 4 | 降水確率（時間帯別バー表示） | ✅ 実装済み |
| 5 | 地域選択（全47都道府県） | ✅ 実装済み |
| 6 | お気に入りエリア（最大5件） | ✅ 実装済み |
| 7 | テーマ切替（sora-light / sora-dark） | ✅ 実装済み |
| 8 | 更新ボタン＋自動更新（30分間隔） | ✅ 実装済み |
| 9 | オフラインキャッシュ＋最終更新日時表示 | ✅ 実装済み |
| 10 | 気象警報バナー（JMA警報API連携） | ✅ 実装済み |
| + | 天気概況テキスト（overview_forecast API連携） | ✅ 実装済み（v1追加） |

---

## 技術スタック

| 役割 | 技術 |
|------|------|
| デスクトップフレームワーク | [Electron](https://www.electronjs.org/) v33 |
| UIフレームワーク | [Svelte](https://svelte.dev/) v5 |
| 言語 | TypeScript（strict mode） |
| スタイリング | [Tailwind CSS](https://tailwindcss.com/) v4 + [daisyUI](https://daisyui.com/) v5 |
| ビルドツール | [electron-vite](https://electron-vite.org/) v3 |
| ユニットテスト | [Vitest](https://vitest.dev/) |
| E2Eテスト | [Playwright](https://playwright.dev/) |
| データソース | [気象庁オープンデータAPI](https://www.jma.go.jp/bosai/) |

---

## アーキテクチャ

```
Renderer Process (Svelte + Tailwind)
    │  window.electronAPI（contextBridge）
Preload Script
    │  ipcRenderer.invoke / ipcMain.handle
Main Process (Node.js + Electron)
    │  fetch（CORS回避のためメインプロセスで実行）
気象庁 API
```

- `contextIsolation: true` / `nodeIntegration: false` / `sandbox: true` を厳守
- JMA APIはCORSヘッダー非対応のため、メインプロセスのみがfetchを行う
- メイン ↔ レンダラー間の通信はすべてIPC経由

---

## セットアップ

### 必要環境

- Node.js 20 以上
- npm 10 以上

### インストール

```bash
git clone https://github.com/<your-username>/SoraPalette.git
cd SoraPalette
npm install
```

### 開発サーバー起動

```bash
npm run dev
```

> **注意（macOS）**: `npm run dev` は **通常のターミナル**（Terminal.app または VSCode の統合ターミナル）から実行してください。
> `ELECTRON_RUN_AS_NODE=1` が設定された環境（Claude Code のツール経由など）から実行すると、
> Electron が GUI モードで起動しません。

### ビルド

```bash
# 型チェック・Lint
npm run typecheck
npm run lint

# アプリケーションビルド
npm run build
```

### テスト

```bash
# ユニットテスト（Vitest）
npm run test

# E2Eテスト（Playwright）
npm run test:e2e
```

### CI

GitHub Actions では、`main` への push と pull request で以下を実行します。

```bash
npm ci
npm run lint
npm run typecheck
npm run test
```

E2Eテストは JMA API への実ネットワークアクセスと Electron 起動を伴うため、ローカル確認用として扱います。

---

## ディレクトリ構成

```
SoraPalette/
├── src/
│   ├── main/               # Electronメインプロセス
│   │   ├── index.ts        # エントリポイント・BrowserWindow生成
│   │   ├── services/       # JMA API fetch・キャッシュ（警報・概況含む）
│   │   └── ipc/            # IPCハンドラ（天気・設定・通知・警報）
│   ├── preload/            # contextBridgeによるIPC API定義
│   │   ├── index.ts        # contextBridge実装
│   │   └── types.ts        # window.electronAPI の型定義（全AIの型境界）
│   └── renderer/           # Svelteアプリ
│       ├── components/
│       │   ├── icons/      # SVG天気アイコン（Svelte コンポーネント）
│       │   └── weather/    # WeatherCard・ForecastStrip
│       ├── stores/         # weatherStore（状態管理・警報・概況）
│       ├── lib/            # 変換ロジック・エリアコード・天気コードマップ・警報変換
│       └── types/          # JMA APIレスポンス型・アプリ内部型
├── tests/
│   ├── unit/               # Vitestユニットテスト
│   └── e2e/                # PlaywrightのE2Eテスト
├── docs/
│   ├── ja/                 # 学習用ガイド（IPC・Svelte・JMA API解説）
│   └── decisions/          # アーキテクチャ判断記録（ADR-001〜003）
└── .agent/MemoryBank/      # AI間の共有メモリ（進捗・設計記録）
```

---

## 学習目的について

このプロジェクトはデスクトップアプリ開発の**学習**を主目的としています。

- ソースコード全体に**詳細な日本語コメント**を記述
- `docs/ja/` に学習用ガイド（IPC・Svelte・JMA APIの解説）を収録
- `docs/decisions/` にアーキテクチャ上の判断記録（ADR）を収録

---

## データソース

[気象庁オープンデータ](https://www.jma.go.jp/bosai/)を使用しています。
商用利用の際は気象庁の利用規約を確認してください。

---

## ライセンス

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) - 詳細は [LICENSE](LICENSE) ファイルを参照してください。
