/**
 * src/main/ipc/storeHandlers.ts
 *
 * 設定値の永続化に関する IPC ハンドラを登録する（electron-store 使用）。
 *
 * IPC チャンネル:
 *   store:get - 設定値を取得する
 *   store:set - 設定値を保存する
 *
 * 担当: Claude Code
 */

import { ipcMain } from 'electron'
import Store from 'electron-store'
import type { StoreSchema } from '../../preload/types'

// ---------------------------------------------------------------------------
// electron-store の初期化
// ---------------------------------------------------------------------------

/**
 * アプリ設定ストア。
 * デフォルト値は AGENT.md の仕様に基づく。
 */
const store = new Store<StoreSchema>({
  defaults: {
    theme: 'sora-light',
    defaultAreaCode: '130000', // 東京都
    favoriteAreas: [],
    autoRefreshInterval: 30 // 30 分
  }
})

// ---------------------------------------------------------------------------
// IPC ハンドラ登録
// ---------------------------------------------------------------------------

/**
 * 設定値ストアに関する IPC ハンドラを登録する。
 */
export function registerStoreHandlers(): void {
  // ------------------------------------------------------------------
  // store:get - 設定値を取得する
  // ------------------------------------------------------------------
  ipcMain.handle('store:get', (_event, key: keyof StoreSchema) => {
    try {
      const value = store.get(key)
      return { success: true, data: value }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[store:get] エラー (key=${String(key)}):`, message)
      return { success: false, error: message }
    }
  })

  // ------------------------------------------------------------------
  // store:set - 設定値を保存する
  // ------------------------------------------------------------------
  ipcMain.handle('store:set', (_event, key: keyof StoreSchema, value: unknown) => {
    try {
      store.set(key, value)
      return { success: true, data: undefined }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[store:set] エラー (key=${String(key)}):`, message)
      return { success: false, error: message }
    }
  })
}
