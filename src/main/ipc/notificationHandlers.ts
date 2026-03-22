/**
 * src/main/ipc/notificationHandlers.ts
 *
 * デスクトップ通知に関する IPC ハンドラを登録する。
 *
 * IPC チャンネル:
 *   notification:send - デスクトップ通知を表示する
 *
 * 担当: Claude Code
 */

import { ipcMain, Notification } from 'electron'

// ---------------------------------------------------------------------------
// IPC ハンドラ登録
// ---------------------------------------------------------------------------

/**
 * 通知に関する IPC ハンドラを登録する。
 */
export function registerNotificationHandlers(): void {
  // ------------------------------------------------------------------
  // notification:send - デスクトップ通知を表示する
  // ------------------------------------------------------------------
  ipcMain.handle('notification:send', (_event, title: string, body: string) => {
    try {
      // Electron の Notification API はメインプロセスのみ使用可能
      if (Notification.isSupported()) {
        new Notification({ title, body }).show()
      }
      return { success: true, data: undefined }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[notification:send] エラー:', message)
      return { success: false, error: message }
    }
  })
}
