/**
 * src/preload/index.ts
 *
 * contextBridge を使って window.electronAPI を安全に公開する。
 * contextIsolation: true のため、レンダラーから直接 Node.js API は呼び出せない。
 * このファイルが「メインプロセス ↔ レンダラー」の唯一の橋渡しとなる。
 *
 * 担当: Claude Code
 */

import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI, StoreKey, StoreSchema } from './types'

// ---------------------------------------------------------------------------
// window.electronAPI として公開する API の実装
// ---------------------------------------------------------------------------

const electronAPI: ElectronAPI = {
  /**
   * 天気予報データを取得する（JMA API フェッチ + キャッシュ書き込み）
   */
  fetchWeather: (areaCode: string) => ipcRenderer.invoke('weather:fetch', areaCode),

  /**
   * キャッシュから天気データを読み込む
   */
  readWeatherCache: (areaCode: string) => ipcRenderer.invoke('weather:cache-read', areaCode),

  /**
   * 設定値を取得する
   */
  storeGet: <K extends StoreKey>(key: K): Promise<{ success: true; data: StoreSchema[K] } | { success: false; error: string }> =>
    ipcRenderer.invoke('store:get', key),

  /**
   * 設定値を保存する
   */
  storeSet: <K extends StoreKey>(key: K, value: StoreSchema[K]): Promise<{ success: true; data: void } | { success: false; error: string }> =>
    ipcRenderer.invoke('store:set', key, value),

  /**
   * 天気概況テキストを取得する
   */
  fetchOverview: (areaCode: string) => ipcRenderer.invoke('overview:fetch', areaCode),

  /**
   * 気象警報・注意報データを取得する
   */
  fetchWarning: (areaCode: string) => ipcRenderer.invoke('warning:fetch', areaCode),

  /**
   * デスクトップ通知を送信する
   */
  sendNotification: (title: string, body: string) =>
    ipcRenderer.invoke('notification:send', title, body)
}

// ---------------------------------------------------------------------------
// contextBridge 経由で window.electronAPI に公開
// ---------------------------------------------------------------------------

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  } catch (error) {
    console.error('[preload] contextBridge の設定に失敗しました:', error)
  }
} else {
  // 開発環境で contextIsolation が無効な場合のフォールバック（本番では発生しない）
  throw new Error('[preload] contextIsolation が無効です。セキュリティ設定を確認してください。')
}
