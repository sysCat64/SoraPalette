import { describe, expect, it } from 'vitest'
import { resolveWeatherCode } from '../../src/renderer/lib/weatherCodeMap'

describe('resolveWeatherCode', () => {
  it('主要コードを個別マッピングできる', () => {
    expect(resolveWeatherCode('100')).toEqual({
      label: '晴れ',
      icon: 'sunny'
    })

    expect(resolveWeatherCode('203')).toEqual({
      label: 'くもり時々雨',
      icon: 'cloudy-rainy'
    })
  })

  it('未知コードは範囲ルールでフォールバックする', () => {
    expect(resolveWeatherCode('305')).toEqual({
      label: '雨系',
      icon: 'rainy'
    })
  })

  it('欠損値は unknown 扱いにする', () => {
    expect(resolveWeatherCode(undefined)).toEqual({
      label: '天気不明',
      icon: 'unknown'
    })
  })
})
