/**
 * src/renderer/lib/weatherCodeMap.ts
 *
 * 気象庁の天気コードを UI 用のラベルとアイコンキーへ変換する。
 * 主要コードは個別定義し、それ以外は 100〜199 / 200〜299 / 300〜399 / 400〜413
 * の範囲ルールで大まかにフォールバックする。
 */

import type { WeatherIconKey } from '../types/app'

/**
 * UI が参照する天気コード定義。
 */
export interface WeatherCodeDefinition {
  label: string
  icon: WeatherIconKey
}

/**
 * よく使うコードは個別に明示し、テストで仕様を固定する。
 * label は JMA 文言をそのまま厳密再現するより、UI 用の短い説明に寄せている。
 */
export const WEATHER_CODE_MAP: Record<string, WeatherCodeDefinition> = {
  '100': { label: '晴れ', icon: 'sunny' },
  '101': { label: '晴れ時々くもり', icon: 'sunny-cloudy' },
  '102': { label: '晴れ一時雨', icon: 'sunny-rainy' },
  '103': { label: '晴れ時々雨', icon: 'sunny-rainy' },
  '104': { label: '晴れ一時雪', icon: 'sunny-snowy' },
  '110': { label: '晴れのちくもり', icon: 'sunny-cloudy' },
  '111': { label: '晴れのち一時雨', icon: 'sunny-rainy' },
  '112': { label: '晴れのち時々雨', icon: 'sunny-rainy' },
  '113': { label: '晴れのち雨', icon: 'sunny-rainy' },
  '114': { label: '晴れのち雪', icon: 'sunny-snowy' },
  '200': { label: 'くもり', icon: 'cloudy' },
  '201': { label: 'くもり時々晴れ', icon: 'cloudy-sunny' },
  '202': { label: 'くもり一時雨', icon: 'cloudy-rainy' },
  '203': { label: 'くもり時々雨', icon: 'cloudy-rainy' },
  '204': { label: 'くもり一時雪', icon: 'cloudy-snowy' },
  '210': { label: 'くもりのち晴れ', icon: 'cloudy-sunny' },
  '211': { label: 'くもりのち雨', icon: 'cloudy-rainy' },
  '212': { label: 'くもりのち雪', icon: 'cloudy-snowy' },
  '300': { label: '雨', icon: 'rainy' },
  '301': { label: '雨時々晴れ', icon: 'rainy-sunny' },
  '302': { label: '雨時々止む', icon: 'rainy' },
  '303': { label: '雨時々雪', icon: 'rainy-snowy' },
  '304': { label: '雨か雪', icon: 'rainy-snowy' },
  '308': { label: '暴風雨', icon: 'rainy' },
  '311': { label: '雨のち晴れ', icon: 'rainy-sunny' },
  '313': { label: '雨のちくもり', icon: 'cloudy-rainy' },
  '400': { label: '雪', icon: 'snowy' },
  '401': { label: '雪時々晴れ', icon: 'snowy-sunny' },
  '402': { label: '雪時々止む', icon: 'snowy' },
  '403': { label: '雪時々雨', icon: 'rainy-snowy' },
  '406': { label: '風雪強い', icon: 'snowy' },
  '411': { label: '雪のち晴れ', icon: 'snowy-sunny' },
  '413': { label: '大雪', icon: 'snowy' }
}

/** 個別定義がない場合の既定値 */
const UNKNOWN_WEATHER_CODE: WeatherCodeDefinition = {
  label: '天気不明',
  icon: 'unknown'
}

/** 数値範囲から大分類を推定する */
function resolveWeatherCodeByRange(code: number): WeatherCodeDefinition {
  if (code >= 100 && code <= 199) {
    return { label: '晴れ系', icon: 'sunny' }
  }

  if (code >= 200 && code <= 299) {
    return { label: 'くもり系', icon: 'cloudy' }
  }

  if (code >= 300 && code <= 399) {
    return { label: '雨系', icon: 'rainy' }
  }

  if (code >= 400 && code <= 413) {
    return { label: '雪系', icon: 'snowy' }
  }

  return UNKNOWN_WEATHER_CODE
}

/**
 * JMA の文字列コードを UI 表示用の定義へ変換する。
 * 欠損や未知コードでも落とさず、unknown へフォールバックする。
 */
export function resolveWeatherCode(code: string | null | undefined): WeatherCodeDefinition {
  if (!code) {
    return UNKNOWN_WEATHER_CODE
  }

  const mapped = WEATHER_CODE_MAP[code]
  if (mapped) {
    return mapped
  }

  const numericCode = Number.parseInt(code, 10)
  if (Number.isNaN(numericCode)) {
    return UNKNOWN_WEATHER_CODE
  }

  return resolveWeatherCodeByRange(numericCode)
}
