/**
 * src/main/ipc/weatherHandlers.ts
 *
 * 天気予報に関する IPC ハンドラを登録する。
 *
 * IPC チャンネル:
 *   weather:fetch      - JMA API からデータを取得してキャッシュに書き込む
 *   weather:cache-read - メモリキャッシュからデータを読み込む
 *
 * レスポンス形式（AGENT.md 規約）:
 *   成功: { success: true, data: T }
 *   失敗: { success: false, error: string }
 *
 * 担当: Claude Code
 */

import { ipcMain } from 'electron'
import { fetchForecast, type JmaForecastRaw } from '../services/jmaService'
import { fetchWarning } from '../services/jmaWarningService'
import { fetchOverviewForecast } from '../services/jmaOverviewService'

// ---------------------------------------------------------------------------
// メモリキャッシュ（Phase 1 実装）
// ---------------------------------------------------------------------------

/**
 * キャッシュエントリの型
 */
interface CacheEntry {
  /** 天気予報データ */
  data: JmaForecastRaw
  /** キャッシュ書き込み時刻（UNIX タイムスタンプ ms） */
  timestamp: number
}

/**
 * エリアコードをキーとするメモリキャッシュ。
 * アプリ再起動でクリアされる（Phase 2 でファイルキャッシュに昇格予定）。
 */
const weatherCache = new Map<string, CacheEntry>()

/** キャッシュ有効期限（ミリ秒）: デフォルト 30 分 */
const CACHE_TTL_MS = 30 * 60 * 1000

// ---------------------------------------------------------------------------
// IPC ハンドラ登録
// ---------------------------------------------------------------------------

/**
 * 天気予報に関する IPC ハンドラをすべて登録する。
 * src/main/index.ts の app.whenReady() から呼び出す。
 */
export function registerWeatherHandlers(): void {
  // ------------------------------------------------------------------
  // weather:fetch - JMA API から取得してキャッシュに書き込む
  // ------------------------------------------------------------------
  ipcMain.handle('weather:fetch', async (_event, areaCode: string) => {
    try {
      const data = await fetchForecast(areaCode)

      // メモリキャッシュに書き込む
      weatherCache.set(areaCode, {
        data,
        timestamp: Date.now()
      })

      return { success: true, data }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[weather:fetch] エラー (areaCode=${areaCode}):`, message)
      return { success: false, error: message }
    }
  })

  // ------------------------------------------------------------------
  // warning:fetch - 気象警報・注意報データを取得する
  // キャッシュなし（警報情報は常に最新を取得する）
  // ------------------------------------------------------------------
  ipcMain.handle('warning:fetch', async (_event, areaCode: string) => {
    try {
      const data = await fetchWarning(areaCode)
      return { success: true, data }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[warning:fetch] エラー (areaCode=${areaCode}):`, message)
      return { success: false, error: message }
    }
  })

  // ------------------------------------------------------------------
  // overview:fetch - 天気概況テキストを取得する（キャッシュなし）
  // ------------------------------------------------------------------
  ipcMain.handle('overview:fetch', async (_event, areaCode: string) => {
    try {
      const data = await fetchOverviewForecast(areaCode)
      return { success: true, data }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[overview:fetch] エラー (areaCode=${areaCode}):`, message)
      return { success: false, error: message }
    }
  })

  // ------------------------------------------------------------------
  // weather:cache-read - メモリキャッシュからデータを返す
  // ------------------------------------------------------------------
  ipcMain.handle('weather:cache-read', (_event, areaCode: string) => {
    try {
      const entry = weatherCache.get(areaCode)

      if (!entry) {
        return { success: false, error: `キャッシュが見つかりません (areaCode=${areaCode})` }
      }

      // キャッシュの有効期限チェック
      const age = Date.now() - entry.timestamp
      if (age > CACHE_TTL_MS) {
        weatherCache.delete(areaCode)
        return { success: false, error: `キャッシュが期限切れです (${Math.floor(age / 60_000)} 分経過)` }
      }

      return { success: true, data: entry.data }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[weather:cache-read] エラー (areaCode=${areaCode}):`, message)
      return { success: false, error: message }
    }
  })
}
