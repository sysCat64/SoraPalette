/**
 * src/renderer/lib/jmaForecastTransformer.ts
 *
 * JMA forecast API の生レスポンスを、renderer が扱いやすい内部型へ変換する。
 * 配列構造や欠損データの吸収をこのファイルに閉じ込め、store は状態遷移に集中させる。
 */

import { resolveWeatherCode } from './weatherCodeMap'
import type {
  DailyForecast,
  PrecipitationChance,
  TemperatureRange,
  WeatherData
} from '../types/app'
import type {
  JmaDailyTempArea,
  JmaForecastResponse,
  JmaForecastReport,
  JmaPopArea,
  JmaTimeSeries,
  JmaWeatherArea,
  JmaWeeklyTempArea,
  JmaWeeklyWeatherArea
} from '../types/jma'

/** unknown を Record に狭めるための小さな型ガード */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** JMA の unknown レスポンスを最小限検証して配列とみなす */
export function isJmaForecastResponse(value: unknown): value is JmaForecastResponse {
  return Array.isArray(value) && value.every((entry) => isRecord(entry))
}

/** 文字列数値を number へ変換し、変換不能なら null を返す */
function toNullableNumber(value: string | undefined): number | null {
  if (!value) {
    return null
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

/** 配列の先頭エリアを安全に取り出す */
function firstArea<TArea>(series?: JmaTimeSeries<TArea>): TArea | undefined {
  return series?.areas?.[0]
}

/** 指定キーを持つ時系列を探す */
function findSeriesByAreaKey<TArea extends object>(
  timeSeries: JmaForecastReport['timeSeries'],
  key: keyof TArea
): JmaTimeSeries<TArea> | undefined {
  return timeSeries?.find((series) => {
    const area = series.areas?.[0] as TArea | undefined
    return area !== undefined && key in area
  }) as JmaTimeSeries<TArea> | undefined
}

/** 最低 / 最高気温の形へ揃える */
function toTemperatureRange(min?: string, max?: string): TemperatureRange {
  return {
    min: toNullableNumber(min),
    max: toNullableNumber(max)
  }
}

/** 降水確率配列を日時つきデータへ整形する */
function toPrecipitationChances(
  timeDefines: string[] | undefined,
  pops: string[] | undefined
): PrecipitationChance[] {
  if (!timeDefines?.length || !pops?.length) {
    return []
  }

  return timeDefines.map((dateTime, index) => ({
    dateTime,
    percentage: toNullableNumber(pops[index])
  }))
}

/** 詳細予報から「今日の天気」表示に使うまとまりを作る */
function buildCurrentWeather(dailyReport: JmaForecastReport) {
  const weatherSeries = findSeriesByAreaKey<JmaWeatherArea>(dailyReport.timeSeries, 'weatherCodes')
  const popSeries = findSeriesByAreaKey<JmaPopArea>(dailyReport.timeSeries, 'pops')
  const tempSeries = findSeriesByAreaKey<JmaDailyTempArea>(dailyReport.timeSeries, 'temps')

  const weatherArea = firstArea(weatherSeries)
  const popArea = firstArea(popSeries)
  const tempArea = firstArea(tempSeries)

  const weatherCode = weatherArea?.weatherCodes?.[0] ?? null
  const weatherDefinition = resolveWeatherCode(weatherCode)

  return {
    forecastArea: {
      name: weatherArea?.area.name ?? null,
      code: weatherArea?.area.code ?? null
    },
    temperatureArea: {
      name: tempArea?.area.name ?? null,
      code: tempArea?.area.code ?? null
    },
    current: {
      dateTime: weatherSeries?.timeDefines?.[0] ?? null,
      weatherCode,
      description: weatherArea?.weathers?.[0] ?? weatherDefinition.label,
      icon: weatherDefinition.icon,
      wind: weatherArea?.winds?.[0] ?? null,
      wave: weatherArea?.waves?.[0] ?? null,
      temperature: toTemperatureRange(tempArea?.temps?.[0], tempArea?.temps?.[1]),
      precipitationChances: toPrecipitationChances(popSeries?.timeDefines, popArea?.pops)
    }
  }
}

/** 週間予報を UI が描画しやすい配列へ変換する */
function buildDailyForecasts(weeklyReport?: JmaForecastReport): DailyForecast[] {
  if (!weeklyReport?.timeSeries?.length) {
    return []
  }

  const weatherSeries = findSeriesByAreaKey<JmaWeeklyWeatherArea>(
    weeklyReport.timeSeries,
    'reliabilities'
  )
  const tempSeries = findSeriesByAreaKey<JmaWeeklyTempArea>(weeklyReport.timeSeries, 'tempsMin')

  const weatherArea = firstArea(weatherSeries)
  const tempArea = firstArea(tempSeries)
  const timeDefines = weatherSeries?.timeDefines ?? tempSeries?.timeDefines ?? []

  return timeDefines.map((date, index) => {
    const weatherCode = weatherArea?.weatherCodes?.[index] ?? null
    const weatherDefinition = resolveWeatherCode(weatherCode)

    return {
      date,
      weatherCode,
      description: weatherDefinition.label,
      icon: weatherDefinition.icon,
      precipitationChance: toNullableNumber(weatherArea?.pops?.[index]),
      reliability: (weatherArea?.reliabilities?.[index] as 'A' | 'B' | 'C' | undefined) ?? null,
      temperature: toTemperatureRange(tempArea?.tempsMin?.[index], tempArea?.tempsMax?.[index])
    }
  })
}

/**
 * JMA forecast API のレスポンスを renderer 内部型へ変換する。
 * 不足データがあっても可能な範囲で WeatherData を返し、UI 側の分岐を単純化する。
 */
export function transformJmaForecast(
  rawForecast: unknown,
  requestedAreaCode: string
): WeatherData {
  if (!isJmaForecastResponse(rawForecast) || rawForecast.length === 0) {
    throw new Error('天気データの形式が不正です')
  }

  const dailyReport = rawForecast[0]
  if (!dailyReport) {
    throw new Error('詳細予報データが見つかりません')
  }

  const currentBlock = buildCurrentWeather(dailyReport)

  return {
    requestedAreaCode,
    forecastArea: currentBlock.forecastArea,
    temperatureArea: currentBlock.temperatureArea,
    overview: {
      publishingOffice: dailyReport.publishingOffice ?? null,
      reportDatetime: dailyReport.reportDatetime ?? null
    },
    current: currentBlock.current,
    dailyForecasts: buildDailyForecasts(rawForecast[1])
  }
}
