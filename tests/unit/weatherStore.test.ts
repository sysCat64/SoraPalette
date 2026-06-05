import { get } from 'svelte/store'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createWeatherStore } from '../../src/renderer/stores/weatherStore'
import type { ElectronAPI, IpcResult, StoreKey, StoreSchema } from '../../src/preload/types'
import type { JmaForecastResponse, JmaWarningRaw } from '../../src/renderer/types/jma'

const sampleForecast: JmaForecastResponse = [
  {
    publishingOffice: '東京管区気象台',
    reportDatetime: '2026-03-22T05:00:00+09:00',
    timeSeries: [
      {
        timeDefines: ['2026-03-22T06:00:00+09:00'],
        areas: [
          {
            area: { name: '東京地方', code: '130010' },
            weatherCodes: ['100'],
            weathers: ['晴れ'],
            winds: ['北の風']
          }
        ]
      },
      {
        timeDefines: ['2026-03-22T06:00:00+09:00'],
        areas: [
          {
            area: { name: '東京地方', code: '130010' },
            pops: ['10']
          }
        ]
      },
      {
        timeDefines: ['2026-03-22T00:00:00+09:00', '2026-03-22T09:00:00+09:00'],
        areas: [
          {
            area: { name: '東京', code: '44132' },
            temps: ['9', '17']
          }
        ]
      }
    ]
  }
]

const sampleWarning = {
  headlineText: '伊豆諸島南部では、強風や高波に注意してください。',
  areaTypes: [
    {
      areas: [
        {
          code: '130030',
          warnings: [
            { code: '14', status: '継続' },
            { code: '15', status: '継続' },
          ],
        },
      ],
    },
  ],
} as unknown as JmaWarningRaw

function createSuccess<T>(data: T): IpcResult<T> {
  return { success: true, data }
}

function createError(message: string): IpcResult<never> {
  return { success: false, error: message }
}

function createMockApi(overrides?: Partial<ElectronAPI>): ElectronAPI {
  const storeState: StoreSchema = {
    theme: 'sora-light',
    defaultAreaCode: '130000',
    favoriteAreas: ['130000'],
    autoRefreshInterval: 30
  }

  return {
    fetchWeather: vi.fn(async () => createSuccess(sampleForecast)),
    readWeatherCache: vi.fn(async () => createSuccess(sampleForecast)),
    fetchWarning: vi.fn(async () => createSuccess({ areaTypes: [] })),
    fetchOverview: vi.fn(async () => createSuccess({})),
    storeGet: vi.fn(async <K extends StoreKey>(key: K) => createSuccess(storeState[key])),
    storeSet: vi.fn(async <K extends StoreKey>(key: K, value: StoreSchema[K]) => {
      storeState[key] = value
      return createSuccess(undefined)
    }),
    sendNotification: vi.fn(async () => createSuccess(undefined)),
    ...overrides
  }
}

describe('weatherStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initialize で設定値を読み込み、初回の天気取得まで行う', async () => {
    const api = createMockApi()
    const store = createWeatherStore(api)

    await store.initialize()

    const state = get(store)
    expect(state.initialized).toBe(true)
    expect(state.selectedAreaCode).toBe('130000')
    expect(state.favoriteAreaCodes).toEqual(['130000'])
    expect(state.weatherData?.current.icon).toBe('sunny')
    expect(api.fetchWeather).toHaveBeenCalledWith('130000')

    store.destroy()
  })

  it('live 取得失敗時は cache-read にフォールバックする', async () => {
    const api = createMockApi({
      fetchWeather: vi.fn(async () => createError('network error')),
      readWeatherCache: vi.fn(async () => createSuccess(sampleForecast))
    })
    const store = createWeatherStore(api)

    await store.initialize()

    const state = get(store)
    expect(state.usingCache).toBe(true)
    expect(state.error).toBeNull()
    expect(api.readWeatherCache).toHaveBeenCalledWith('130000')

    store.destroy()
  })

  it('警報APIの warnings 形式を state に保持する', async () => {
    const api = createMockApi({
      fetchWarning: vi.fn(async () => createSuccess(sampleWarning))
    })
    const store = createWeatherStore(api)

    await store.initialize()

    const state = get(store)
    expect(state.warning.severity).toBe('advisory')
    expect(state.warning.kinds).toEqual(['雷注意報', '強風注意報'])
    expect(state.warning.headline).toBe('伊豆諸島南部では、強風や高波に注意してください。')
    expect(state.warning.error).toBeNull()

    store.destroy()
  })

  it('警報取得失敗時は天気取得を維持しつつ warning.error に記録する', async () => {
    const api = createMockApi({
      fetchWarning: vi.fn(async () => createError('warning api error'))
    })
    const store = createWeatherStore(api)

    await store.initialize()

    const state = get(store)
    expect(state.weatherData?.current.icon).toBe('sunny')
    expect(state.error).toBeNull()
    expect(state.warning.severity).toBe('none')
    expect(state.warning.kinds).toHaveLength(0)
    expect(state.warning.error).toBe('warning api error')

    store.destroy()
  })

  it('お気に入りは重複を防ぎ、5件を超える追加は拒否する', async () => {
    const api = createMockApi({
      storeGet: vi.fn(async <K extends StoreKey>(key: K) => {
        const preset: StoreSchema = {
          theme: 'sora-light',
          defaultAreaCode: '130000',
          favoriteAreas: ['020000', '030000', '040000', '050000', '060000'],
          autoRefreshInterval: 30
        }

        return createSuccess(preset[key])
      })
    })
    const store = createWeatherStore(api)

    await store.initialize()
    await store.addFavoriteArea('070000')

    const state = get(store)
    expect(state.favoriteAreaCodes).toEqual(['020000', '030000', '040000', '050000', '060000'])
    expect(state.error).toContain('最大 5 件')

    store.destroy()
  })

  it('自動更新間隔を変更すると state と永続化が更新される', async () => {
    const api = createMockApi()
    const store = createWeatherStore(api)

    await store.initialize()
    await store.setAutoRefreshInterval(15)

    const state = get(store)
    expect(state.autoRefreshIntervalMinutes).toBe(15)
    expect(api.storeSet).toHaveBeenCalledWith('autoRefreshInterval', 15)

    store.destroy()
  })
})
