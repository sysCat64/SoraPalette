import { describe, expect, it } from 'vitest'
import { transformJmaForecast } from '../../src/renderer/lib/jmaForecastTransformer'
import type { JmaForecastResponse } from '../../src/renderer/types/jma'

const sampleForecast: JmaForecastResponse = [
  {
    publishingOffice: '東京管区気象台',
    reportDatetime: '2026-03-22T05:00:00+09:00',
    timeSeries: [
      {
        timeDefines: ['2026-03-22T06:00:00+09:00', '2026-03-23T00:00:00+09:00'],
        areas: [
          {
            area: { name: '東京地方', code: '130010' },
            weatherCodes: ['101', '201'],
            weathers: ['晴れ　時々　くもり', 'くもり　時々　晴れ'],
            winds: ['北の風', '南の風'],
            waves: ['0.5メートル', '0.5メートル']
          }
        ]
      },
      {
        timeDefines: [
          '2026-03-22T06:00:00+09:00',
          '2026-03-22T12:00:00+09:00',
          '2026-03-22T18:00:00+09:00',
          '2026-03-23T00:00:00+09:00'
        ],
        areas: [
          {
            area: { name: '東京地方', code: '130010' },
            pops: ['10', '20', '30', '40']
          }
        ]
      },
      {
        timeDefines: ['2026-03-22T00:00:00+09:00', '2026-03-22T09:00:00+09:00'],
        areas: [
          {
            area: { name: '東京', code: '44132' },
            temps: ['11', '19']
          }
        ]
      }
    ]
  },
  {
    timeSeries: [
      {
        timeDefines: ['2026-03-23T00:00:00+09:00', '2026-03-24T00:00:00+09:00'],
        areas: [
          {
            area: { name: '東京地方', code: '130010' },
            weatherCodes: ['200', '300'],
            pops: ['20', '60'],
            reliabilities: ['B', 'C']
          }
        ]
      },
      {
        timeDefines: ['2026-03-23T00:00:00+09:00', '2026-03-24T00:00:00+09:00'],
        areas: [
          {
            area: { name: '東京', code: '44132' },
            tempsMin: ['10', '8'],
            tempsMax: ['17', '14']
          }
        ]
      }
    ]
  }
]

describe('transformJmaForecast', () => {
  it('JMA の生レスポンスを UI 向け内部型へ変換する', () => {
    const transformed = transformJmaForecast(sampleForecast, '130000')

    expect(transformed.requestedAreaCode).toBe('130000')
    expect(transformed.overview.publishingOffice).toBe('東京管区気象台')
    expect(transformed.current.description).toBe('晴れ　時々　くもり')
    expect(transformed.current.icon).toBe('sunny-cloudy')
    expect(transformed.current.temperature).toEqual({ min: 11, max: 19 })
    expect(transformed.current.precipitationChances).toHaveLength(4)
    expect(transformed.dailyForecasts).toHaveLength(2)
    expect(transformed.dailyForecasts[1]).toMatchObject({
      icon: 'rainy',
      precipitationChance: 60,
      reliability: 'C',
      temperature: { min: 8, max: 14 }
    })
  })

  it('週間予報がなくても現在天気だけは返す', () => {
    const transformed = transformJmaForecast([sampleForecast[0]], '130000')

    expect(transformed.dailyForecasts).toEqual([])
    expect(transformed.current.weatherCode).toBe('101')
  })

  it('不正なデータは例外にする', () => {
    expect(() => transformJmaForecast({}, '130000')).toThrow('天気データの形式が不正です')
  })
})
