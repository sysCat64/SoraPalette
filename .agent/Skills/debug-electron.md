# スキル: Electronアプリのデバッグ

Electronアプリ開発でよくある問題と解決策のチェックリストです。

---

## 症状別デバッグガイド

### 🔴 アプリが真っ白で何も表示されない

```
□ DevToolsを開く（メインウィンドウ右クリック → 要素の検証、またはCtrl+Shift+I）
□ Consoleタブでエラーメッセージを確認
□ Networkタブでリソースの読み込み失敗がないか確認

よくある原因:
- Viteのビルドが完了していない → npm run dev を再実行
- preload スクリプトのパスが間違っている → index.ts の __dirname を確認
- CSP（Content Security Policy）によるスクリプトブロック → main.tsのCSP設定を確認
```

### 🔴 IPCが応答しない

```
□ チャンネル名のスペルが一致しているか確認
  - ipcMain.handle('weather:fetch', ...) ← メインプロセス
  - ipcRenderer.invoke('weather:fetch', ...) ← プリロード
  両方が完全に一致していること

□ ipcMain.handle の登録タイミングを確認
  - app.whenReady() のコールバック内で登録されているか

□ contextBridge の公開を確認
  - window.electronAPI がレンダラーで定義されているか
  - DevToolsのConsoleで: console.log(window.electronAPI)

□ preload スクリプトが正しく読み込まれているか確認
  - BrowserWindowのwebPreferences.preloadパスを確認
  - ファイルが実際に存在するか確認: ls out/preload/index.js
```

### 🔴 JMA APIのfetchが失敗する

```
□ CORSエラーか確認（DevTools Consoleに "CORS" の文字があるか）
  → レンダラーからfetchしている → メインプロセスに移動させる

□ メインプロセスからのfetchが失敗している場合:
  - インターネット接続を確認
  - URLのareaCodeが正しいか確認（例: 130000）
  - JMAのAPIが稼働しているか確認（ブラウザで直接URLにアクセス）

□ レスポンスのパースエラー:
  - DevToolsのNetworkタブ（またはメインプロセスのconsole.log）でレスポンスJSONを確認
  - 型定義（jma.ts）と実際のレスポンス構造が一致しているか確認
```

### 🔴 electron-storeの読み書きが動作しない

```
□ メインプロセスで electron-store を初期化しているか確認
□ IPCハンドラ（store:get / store:set）が登録されているか確認
□ レンダラーから window.electronAPI.store.get() を呼んでいるか確認
  （レンダラーで electron-store を直接 import しない）
```

### 🔴 Svelteのストアが更新されない

```
□ writable store の更新方法を確認:
  weatherStore.set(newValue)      // 全体を置き換え
  weatherStore.update(v => ...)   // 部分更新

□ テンプレートでの参照:
  $weatherStore                   // Svelte の $ プレフィックスで自動購読

□ 手動 subscribe の場合:
  - onDestroy() で unsubscribe しているか確認（メモリリーク）
```

### 🔴 パッケージング後にアプリが動作しない

```
□ asar内のパスを確認:
  - __dirname はビルド後は /Applications/SoraPalette.app/.../app.asar/...
  - app.getPath('userData') を使ってユーザーデータパスを取得

□ ネイティブモジュールの問題:
  - electron-rebuild を実行: npx electron-rebuild
  - package.json の dependencies と devDependencies の分類を確認

□ 署名の問題（macOS）:
  - 開発用ビルドはGatekeeperに警告される → 設定 > セキュリティで許可
```

---

## デバッグ用コマンド

```bash
# 開発モードで起動（DevTools自動起動）
npm run dev

# メインプロセスのログを確認（開発モード）
# → ターミナルに直接出力される

# ビルドして実行
npm run build && npm run preview

# TypeScriptの型チェック
npm run typecheck

# Lintチェック
npm run lint

# テスト実行
npm run test

# E2Eテスト実行
npm run test:e2e
```

---

## よく使うElectron DevToolsのテクニック

```javascript
// レンダラーのDevToolsConsoleで実行:

// window.electronAPI の内容を確認
console.log(window.electronAPI);

// 手動でIPCを呼んでテスト
window.electronAPI.weather.fetch('130000').then(console.log);

// 現在のテーマを確認
document.documentElement.dataset.theme;
```
