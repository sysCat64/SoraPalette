/**
 * src/main/index.ts
 *
 * Electron メインプロセスのエントリポイント。
 * BrowserWindow の生成・IPC ハンドラの登録・アプリライフサイクル管理を行う。
 *
 * セキュリティ設定（AGENT.md 規約 / 変更禁止）:
 *   contextIsolation: true  - レンダラーと Node.js コンテキストを分離
 *   nodeIntegration: false  - レンダラーでの Node.js API アクセスを禁止
 *   sandbox: true           - サンドボックス化でさらに権限を制限
 *
 * 担当: Claude Code
 */

import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { registerWeatherHandlers } from './ipc/weatherHandlers'
import { registerStoreHandlers } from './ipc/storeHandlers'
import { registerNotificationHandlers } from './ipc/notificationHandlers'

// ---------------------------------------------------------------------------
// BrowserWindow の生成
// ---------------------------------------------------------------------------

/**
 * メインウィンドウを生成して返す。
 */
function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    // ウィンドウサイズ（リサイズ可能・最小サイズあり）
    width: 480,
    height: 720,
    minWidth: 360,
    minHeight: 600,
    resizable: true,

    // 初期表示は非表示にして、ready-to-show で表示（ちらつき防止）
    show: false,

    // macOS: タイトルバーを非表示にするなどは Phase 2 以降で検討
    autoHideMenuBar: true,

    webPreferences: {
      // プリロードスクリプト: contextBridge 経由で API を公開する
      preload: join(__dirname, '../preload/index.js'),

      // セキュリティ設定（AGENT.md 規約 / 変更禁止）
      contextIsolation: true,  // レンダラーと Node.js コンテキストを分離
      nodeIntegration: false,  // レンダラーでの Node.js API アクセスを禁止
      sandbox: true            // サンドボックス化
    }
  })

  // ウィンドウが描画完了したら表示する
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 外部 URL はデフォルトブラウザで開く（セキュリティのためアプリ内で開かない）
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 開発時は Vite Dev Server から読み込み、本番時はビルド済み HTML を読み込む
  // app.isPackaged: パッケージ済みでなければ開発環境
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// ---------------------------------------------------------------------------
// アプリライフサイクル
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  // IPC ハンドラをすべて登録する
  registerWeatherHandlers()
  registerStoreHandlers()
  registerNotificationHandlers()

  // メインウィンドウを生成する
  createWindow()

  // macOS: Dock アイコンクリックでウィンドウを再生成する
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// macOS 以外: 全ウィンドウが閉じられたらアプリを終了する
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
