/**
 * src/renderer/stores/weatherStore.ts
 *
 * renderer 側の天気データ状態管理。
 * IPC 呼び出し、設定値の永続化、loading / error / cache 使用状態の管理を担当し、
 * JMA の複雑な変換は lib に委譲する。
 */

import { derived, get, writable, type Readable } from 'svelte/store'
import type { ElectronAPI, StoreKey, StoreSchema } from '../../preload/types'
import { DEFAULT_AREA_CODE, PREFECTURE_AREAS, findAreaByCode, isSupportedAreaCode } from '../lib/areaCodeMap'
import { transformJmaForecast } from '../lib/jmaForecastTransformer'
import type { AreaOption, ForecastText, WarningState, WeatherStoreState } from '../types/app'
import type { JmaOverviewRaw, JmaWarningRaw } from '../types/jma'
import { transformWarning } from '../lib/jmaWarningTransformer'

/** 自動更新の既定値（分） */
const DEFAULT_AUTO_REFRESH_INTERVAL_MINUTES = 30

/** お気に入り最大件数 */
const MAX_FAVORITE_AREAS = 5

/** 警報なし状態を作る。error を渡すと「発表なし」ではなく「取得失敗」として扱える */
function createEmptyWarning(error: string | null = null): WarningState {
  return { severity: 'none', kinds: [], headline: null, error }
}

/** 警報なし状態の初期値 */
const EMPTY_WARNING: WarningState = createEmptyWarning()

/** store の初期状態 */
const INITIAL_STATE: WeatherStoreState = {
  initialized: false,
  loading: false,
  refreshing: false,
  usingCache: false,
  error: null,
  selectedAreaCode: DEFAULT_AREA_CODE,
  availableAreas: PREFECTURE_AREAS,
  favoriteAreaCodes: [],
  autoRefreshIntervalMinutes: DEFAULT_AUTO_REFRESH_INTERVAL_MINUTES,
  weatherData: null,
  lastUpdated: null,
  warning: EMPTY_WARNING,
  forecastText: null
}

/** refresh の結果 */
interface RefreshResult {
  usingCache: boolean
  lastUpdated: string | null
  transformedData: WeatherStoreState['weatherData']
}

/** weatherStore の公開 API */
export interface WeatherStore extends Readable<WeatherStoreState> {
  initialize: () => Promise<void>
  refresh: (areaCode?: string) => Promise<void>
  selectArea: (areaCode: string) => Promise<void>
  addFavoriteArea: (areaCode: string) => Promise<void>
  removeFavoriteArea: (areaCode: string) => Promise<void>
  setAutoRefreshInterval: (minutes: number) => Promise<void>
  clearError: () => void
  destroy: () => void
  selectedArea: Readable<AreaOption | null>
  favoriteAreas: Readable<AreaOption[]>
}

/** renderer 実行時だけ electronAPI を参照する */
function resolveElectronApi(): ElectronAPI | undefined {
  return typeof window === 'undefined' ? undefined : window.electronAPI
}

/** store:get の失敗時は fallback に戻す */
async function readSetting<K extends StoreKey>(
  api: ElectronAPI | undefined,
  key: K,
  fallback: StoreSchema[K]
): Promise<StoreSchema[K]> {
  if (!api) {
    return fallback
  }

  const result = await api.storeGet(key)
  return result.success ? result.data : fallback
}

/** store:set の失敗は致命的ではないため boolean だけ返す */
async function persistSetting<K extends StoreKey>(
  api: ElectronAPI | undefined,
  key: K,
  value: StoreSchema[K]
): Promise<boolean> {
  if (!api) {
    return false
  }

  const result = await api.storeSet(key, value)
  return result.success
}

/** areaCode の簡易チェック */
function ensureAreaCode(areaCode: string): void {
  if (!isSupportedAreaCode(areaCode)) {
    throw new Error(`未対応のエリアコードです: ${areaCode}`)
  }
}

/** お気に入り配列を制約に合わせて整形する */
function normalizeFavoriteAreas(areaCodes: string[]): string[] {
  return Array.from(new Set(areaCodes.filter((code) => isSupportedAreaCode(code)))).slice(
    0,
    MAX_FAVORITE_AREAS
  )
}

/** 概況テキストを取得して変換する。失敗時は null を返す（ベストエフォート） */
async function fetchAndTransformOverview(
  api: ElectronAPI | undefined,
  areaCode: string
): Promise<ForecastText | null> {
  if (!api) return null

  try {
    const result = await api.fetchOverview(areaCode)
    if (!result.success) return null

    const raw = result.data as JmaOverviewRaw
    return {
      headline: raw.headlineText?.trim() ?? null,
      body: raw.text?.trim() ?? null
    }
  } catch {
    return null
  }
}

/** 警報データを取得して変換する。失敗時は EMPTY_WARNING を返す（警報はベストエフォート） */
async function fetchAndTransformWarning(
  api: ElectronAPI | undefined,
  areaCode: string
): Promise<WarningState> {
  if (!api) return EMPTY_WARNING

  try {
    const result = await api.fetchWarning(areaCode)
    if (!result.success) return createEmptyWarning(result.error)
    return transformWarning(result.data as JmaWarningRaw)
  } catch (error) {
    return createEmptyWarning(error instanceof Error ? error.message : String(error))
  }
}

/** API 取得失敗時は cache-read へフォールバックする */
async function fetchAndTransformWeather(
  api: ElectronAPI | undefined,
  areaCode: string
): Promise<RefreshResult> {
  if (!api) {
    throw new Error('electronAPI が利用できません')
  }

  const liveResult = await api.fetchWeather(areaCode)
  if (liveResult.success) {
    const transformedData = transformJmaForecast(liveResult.data, areaCode)
    return {
      usingCache: false,
      lastUpdated: transformedData.overview.reportDatetime,
      transformedData
    }
  }

  const cacheResult = await api.readWeatherCache(areaCode)
  if (cacheResult.success) {
    const transformedData = transformJmaForecast(cacheResult.data, areaCode)
    return {
      usingCache: true,
      lastUpdated: transformedData.overview.reportDatetime,
      transformedData
    }
  }

  throw new Error(`${liveResult.error} / キャッシュ取得失敗: ${cacheResult.error}`)
}

/**
 * weatherStore を生成する。
 * テストでは mock ElectronAPI を渡し、実アプリでは window.electronAPI を使う。
 */
export function createWeatherStore(api: ElectronAPI | undefined = resolveElectronApi()): WeatherStore {
  const { subscribe, set, update } = writable<WeatherStoreState>(INITIAL_STATE)

  /** 自動更新タイマー。間隔変更時に毎回貼り直す */
  let refreshTimer: ReturnType<typeof setInterval> | null = null

  /** 現在 state に入っている分数でタイマーを設定する */
  function scheduleAutoRefresh(): void {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }

    const { autoRefreshIntervalMinutes } = get({ subscribe })
    if (autoRefreshIntervalMinutes <= 0 || !api) {
      return
    }

    refreshTimer = setInterval(() => {
      // 定期更新は UI 操作を止めたくないため、内部でエラー状態へ落とし込む。
      void refresh()
    }, autoRefreshIntervalMinutes * 60_000)
  }

  /** refresh 前に loading / refreshing を整える */
  function setFetchingState(areaCode: string): void {
    update((state) => ({
      ...state,
      selectedAreaCode: areaCode,
      error: null,
      loading: !state.initialized && state.weatherData === null,
      refreshing: state.initialized || state.weatherData !== null
    }))
  }

  /** 実際の天気再取得（予報と警報を並列フェッチ） */
  async function refresh(areaCode = get({ subscribe }).selectedAreaCode): Promise<void> {
    try {
      ensureAreaCode(areaCode)
      setFetchingState(areaCode)

      // 予報・警報・概況テキストを並列取得する。警報と概況はベストエフォート
      const [forecastResult, warningResult, overviewResult] = await Promise.allSettled([
        fetchAndTransformWeather(api, areaCode),
        fetchAndTransformWarning(api, areaCode),
        fetchAndTransformOverview(api, areaCode)
      ])

      // 予報が失敗した場合はエラー状態へ
      if (forecastResult.status === 'rejected') {
        throw forecastResult.reason
      }

      const forecast = forecastResult.value
      const warning = warningResult.status === 'fulfilled'
        ? warningResult.value
        : createEmptyWarning('警報情報の取得に失敗しました')
      const forecastText = overviewResult.status === 'fulfilled' ? overviewResult.value : null

      update((state) => ({
        ...state,
        initialized: true,
        loading: false,
        refreshing: false,
        usingCache: forecast.usingCache,
        error: null,
        selectedAreaCode: areaCode,
        weatherData: forecast.transformedData,
        lastUpdated: forecast.lastUpdated,
        warning,
        forecastText
      }))
    } catch (error) {
      update((state) => ({
        ...state,
        initialized: true,
        loading: false,
        refreshing: false,
        selectedAreaCode: areaCode,
        error: error instanceof Error ? error.message : String(error)
      }))
    }
  }

  /** アプリ起動時に設定を読み込み、初回取得まで行う */
  async function initialize(): Promise<void> {
    const [defaultAreaCode, favoriteAreas, autoRefreshIntervalMinutes] = await Promise.all([
      readSetting(api, 'defaultAreaCode', DEFAULT_AREA_CODE),
      readSetting(api, 'favoriteAreas', []),
      readSetting(api, 'autoRefreshInterval', DEFAULT_AUTO_REFRESH_INTERVAL_MINUTES)
    ])

    const normalizedAreaCode = isSupportedAreaCode(defaultAreaCode)
      ? defaultAreaCode
      : DEFAULT_AREA_CODE

    set({
      ...INITIAL_STATE,
      selectedAreaCode: normalizedAreaCode,
      favoriteAreaCodes: normalizeFavoriteAreas(favoriteAreas),
      autoRefreshIntervalMinutes:
        autoRefreshIntervalMinutes > 0
          ? autoRefreshIntervalMinutes
          : DEFAULT_AUTO_REFRESH_INTERVAL_MINUTES
    })

    scheduleAutoRefresh()
    await refresh(normalizedAreaCode)
  }

  /** 地域変更時は defaultAreaCode も更新して、次回起動時の初期地域に反映する */
  async function selectArea(areaCode: string): Promise<void> {
    ensureAreaCode(areaCode)

    update((state) => ({
      ...state,
      selectedAreaCode: areaCode
    }))

    await persistSetting(api, 'defaultAreaCode', areaCode)
    await refresh(areaCode)
  }

  /** お気に入り追加。上限 5 件を超える場合はエラー状態へ落とす */
  async function addFavoriteArea(areaCode: string): Promise<void> {
    ensureAreaCode(areaCode)

    const state = get({ subscribe })
    if (state.favoriteAreaCodes.includes(areaCode)) {
      return
    }

    if (state.favoriteAreaCodes.length >= MAX_FAVORITE_AREAS) {
      update((currentState) => ({
        ...currentState,
        error: `お気に入りは最大 ${MAX_FAVORITE_AREAS} 件までです`
      }))
      return
    }

    const nextFavoriteAreaCodes = [...state.favoriteAreaCodes, areaCode]
    update((currentState) => ({
      ...currentState,
      favoriteAreaCodes: nextFavoriteAreaCodes,
      error: null
    }))

    await persistSetting(api, 'favoriteAreas', nextFavoriteAreaCodes)
  }

  /** お気に入り削除 */
  async function removeFavoriteArea(areaCode: string): Promise<void> {
    const nextFavoriteAreaCodes = get({ subscribe }).favoriteAreaCodes.filter(
      (favoriteAreaCode) => favoriteAreaCode !== areaCode
    )

    update((state) => ({
      ...state,
      favoriteAreaCodes: nextFavoriteAreaCodes
    }))

    await persistSetting(api, 'favoriteAreas', nextFavoriteAreaCodes)
  }

  /** 自動更新間隔の変更。0 以下は許容しない */
  async function setAutoRefreshInterval(minutes: number): Promise<void> {
    if (!Number.isFinite(minutes) || minutes <= 0) {
      update((state) => ({
        ...state,
        error: '自動更新間隔は 1 分以上で指定してください'
      }))
      return
    }

    update((state) => ({
      ...state,
      autoRefreshIntervalMinutes: minutes,
      error: null
    }))

    await persistSetting(api, 'autoRefreshInterval', minutes)
    scheduleAutoRefresh()
  }

  /** UI 側でエラー表示を閉じた後に使う */
  function clearError(): void {
    update((state) => ({
      ...state,
      error: null
    }))
  }

  /** 画面破棄やテスト終了時にタイマーを明示解除する */
  function destroy(): void {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  // derived store は「表示のための軽量な派生値」だけに留める。
  const selectedArea = derived({ subscribe }, ($state) => findAreaByCode($state.selectedAreaCode) ?? null)
  const favoriteAreas = derived({ subscribe }, ($state) =>
    $state.favoriteAreaCodes
      .map((areaCode) => findAreaByCode(areaCode))
      .filter((area): area is AreaOption => area !== undefined)
  )

  return {
    subscribe,
    initialize,
    refresh,
    selectArea,
    addFavoriteArea,
    removeFavoriteArea,
    setAutoRefreshInterval,
    clearError,
    destroy,
    selectedArea,
    favoriteAreas
  }
}

/** 実アプリで使うシングルトン */
export const weatherStore = createWeatherStore()
