/**
 * src/preload/types.ts
 *
 * window.electronAPI の型定義。
 * このファイルはすべてのAIが参照する「型の境界」です。
 * 変更する際は .agent/MemoryBank/progress.md にコメントを残してください。
 *
 * 担当: Claude Code
 * 参照: Codex (stores), Gemini (components)
 */

// ---------------------------------------------------------------------------
// IPC レスポンス共通型
// ---------------------------------------------------------------------------

/** IPC 成功レスポンス */
export type IpcSuccess<T> = {
  success: true
  data: T
}

/** IPC 失敗レスポンス */
export type IpcError = {
  success: false
  error: string
}

/** IPC レスポンス（成功 or 失敗） */
export type IpcResult<T> = IpcSuccess<T> | IpcError

// ---------------------------------------------------------------------------
// electron-store キー定義
// ---------------------------------------------------------------------------

/** テーマ識別子 */
export type ThemeId = 'sora-light' | 'sora-dark'

/** electron-store に保存するキーと値の型マッピング */
export interface StoreSchema {
  /** 表示テーマ */
  theme: ThemeId
  /** デフォルト表示エリアコード（例: '130000' = 東京都） */
  defaultAreaCode: string
  /** お気に入りエリアコード一覧（最大5件） */
  favoriteAreas: string[]
  /** 自動更新間隔（分） */
  autoRefreshInterval: number
}

/** store:get / store:set で使用できるキー名 */
export type StoreKey = keyof StoreSchema

// ---------------------------------------------------------------------------
// window.electronAPI の型定義
// ---------------------------------------------------------------------------

export interface ElectronAPI {
  /**
   * 天気予報データを取得する。
   * メインプロセスが JMA API からフェッチし、キャッシュに書き込む。
   * @param areaCode エリアコード（例: '130000'）
   */
  fetchWeather: (areaCode: string) => Promise<IpcResult<unknown>>

  /**
   * キャッシュから天気データを読み込む。
   * @param areaCode エリアコード
   */
  readWeatherCache: (areaCode: string) => Promise<IpcResult<unknown>>

  /**
   * 設定値を取得する。
   * @param key StoreSchema のキー名
   */
  storeGet: <K extends StoreKey>(key: K) => Promise<IpcResult<StoreSchema[K]>>

  /**
   * 設定値を保存する。
   * @param key StoreSchema のキー名
   * @param value 保存する値
   */
  storeSet: <K extends StoreKey>(key: K, value: StoreSchema[K]) => Promise<IpcResult<void>>

  /**
   * 天気概況テキストを取得する。
   * @param areaCode エリアコード（例: '130000'）
   */
  fetchOverview: (areaCode: string) => Promise<IpcResult<unknown>>

  /**
   * 気象警報・注意報データを取得する。
   * メインプロセスが JMA 警報 API からフェッチする（CORS 回避）。
   * @param areaCode エリアコード（例: '130000'）
   */
  fetchWarning: (areaCode: string) => Promise<IpcResult<unknown>>

  /**
   * デスクトップ通知を送信する。
   * @param title 通知タイトル
   * @param body 通知本文
   */
  sendNotification: (title: string, body: string) => Promise<IpcResult<void>>
}

// ---------------------------------------------------------------------------
// window のグローバル型拡張
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
