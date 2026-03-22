# SoraPalette アーキテクチャ解説

> 学習用ドキュメント。Electronのプロセスモデルとアーキテクチャを日本語で解説します。

---

## なぜElectronはプロセスが分かれているのか

Electronアプリは2種類のプロセスで動作します。

```
┌────────────────────────────────────┐
│  Main Process（メインプロセス）      │
│  • Node.js 環境                    │
│  • ウィンドウの作成・管理            │
│  • ファイル・ネットワーク・OS API    │
│  • 1つしか存在しない                │
└───────────────┬────────────────────┘
                │ IPC通信
┌───────────────┴────────────────────┐
│  Renderer Process（レンダラー）      │
│  • Chromium（ブラウザ）環境         │
│  • HTML/CSS/JavaScriptを描画        │
│  • Node.js APIには直接触れない      │
│  • 各ウィンドウ/タブに1つ存在する   │
└────────────────────────────────────┘
```

**なぜ分けるのか？**
- セキュリティ: Webページ（レンダラー）が悪意あるJavaScriptを実行しても、ファイルシステムやOSに直接アクセスできない
- 安定性: レンダラーがクラッシュしても、メインプロセス（アプリの心臓部）は生き続けられる

---

## プリロードスクリプトの役割

```
レンダラー ←── window.electronAPI ──→ メインプロセス
               ↑
          プリロードスクリプトが
          この「橋」を作る
```

プリロードスクリプト（`src/preload/index.ts`）は**特別な環境**で実行されます：
- Node.jsのAPIにアクセスできる（メインプロセスと同じ）
- でも、レンダラーのDOM（ページのHTML）も触れる

`contextBridge.exposeInMainWorld('electronAPI', {...})` を使って、
安全にメインプロセスのAPIをレンダラーに公開します。

```typescript
// src/preload/index.ts の例
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // この関数がレンダラーから window.electronAPI.weather.fetch() として呼べる
  weather: {
    fetch: (areaCode: string) => ipcRenderer.invoke('weather:fetch', areaCode)
  }
})
```

---

## SoraPaletteのデータの流れ

```
1. ユーザーが「更新」ボタンをクリック
        ↓
2. RefreshButton.svelte（コンポーネント）が
   window.electronAPI.weather.fetch('130000') を呼ぶ
        ↓
3. プリロードスクリプトが
   ipcRenderer.invoke('weather:fetch', '130000') をメインプロセスに送る
        ↓
4. メインプロセスの ipcMain.handle('weather:fetch', ...) が受け取る
        ↓
5. jmaService.fetchForecast('130000') でJMA APIにHTTPリクエスト
        ↓
6. JMAからJSONデータが返ってくる
        ↓
7. メインプロセスがデータをパース・整形してレンダラーに返す
        ↓
8. プリロード経由でレンダラーに返り値が届く
        ↓
9. weatherStore.ts が受け取ったデータでSvelteストアを更新
        ↓
10. WeatherCard.svelte が $weatherStore の変化を検知して再描画
        ↓
11. 画面に新しい天気情報が表示される 🌤
```

---

## フォルダ構成と各ファイルの役割

```
src/
├── main/                     ← メインプロセス（Node.js環境）
│   ├── index.ts              ← アプリのエントリポイント。ウィンドウを作る
│   ├── windowManager.ts      ← ウィンドウの状態（位置・サイズ）を保存・復元する
│   ├── trayManager.ts        ← システムトレイアイコンを管理する
│   ├── ipc/
│   │   ├── index.ts          ← IPCハンドラを全部登録するまとめファイル
│   │   ├── weatherHandlers.ts ← 天気データ取得のIPCハンドラ
│   │   └── storeHandlers.ts  ← 設定値読み書きのIPCハンドラ
│   └── services/
│       ├── jmaService.ts     ← JMA APIにHTTPリクエストしてデータを返す
│       ├── cacheService.ts   ← 取得データをディスクにキャッシュする
│       └── storeService.ts   ← electron-storeのラッパー（設定値の永続化）
│
├── preload/                  ← プリロードスクリプト（橋渡し役）
│   ├── index.ts              ← contextBridgeでAPIを公開する
│   └── types.ts              ← window.electronAPIの型定義
│
└── renderer/                 ← レンダラープロセス（Chromium環境）
    ├── App.svelte            ← Svelteアプリのルートコンポーネント
    ├── components/           ← UI部品（コンポーネント）
    ├── stores/               ← アプリの状態管理（Svelteストア）
    ├── lib/                  ← データ変換・マッピングのユーティリティ
    └── types/                ← TypeScriptの型定義
```

---

## Svelteコンポーネントとストアの関係

```
[ストア] weatherStore（状態の源泉）
    ↓ $weatherStore（自動購読）
[コンポーネント] WeatherCard.svelte
[コンポーネント] ForecastStrip.svelte  ← 複数のコンポーネントが
[コンポーネント] AlertBanner.svelte      同じストアを参照できる
```

Svelteのストアはアプリ全体で共有される「状態入れ物」です。
`$weatherStore` と書くだけで、ストアの値を自動的に読み取り、
値が変わると自動的に画面を再描画してくれます。

---

## セキュリティ設定の理由

```typescript
const win = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,   // レンダラーとNode.jsを完全分離
    nodeIntegration: false,   // レンダラーでNode.jsを使えなくする
    sandbox: true,            // さらに強固なサンドボックス
  }
})
```

`contextIsolation: true` にすると、レンダラーのJavaScriptが
直接 `require('fs')` などのNode.js APIを呼べなくなります。
これにより、XSSなどの脆弱性があっても、攻撃者がファイルシステムにアクセスできません。
