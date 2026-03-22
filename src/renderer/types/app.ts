/**
 * src/renderer/types/app.ts
 *
 * UI と store が扱いやすい「内部表現」の型を定義する。
 * JMA の配列中心な生データは lib 層でここに変換してから store に保持する。
 */

/**
 * UI が扱う天気アイコン識別子。
 * Gemini 側はこの文字列を SVG アイコン選択のキーとして利用できる。
 */
export type WeatherIconKey =
  | 'sunny'
  | 'sunny-cloudy'
  | 'sunny-rainy'
  | 'sunny-snowy'
  | 'cloudy'
  | 'cloudy-sunny'
  | 'cloudy-rainy'
  | 'cloudy-snowy'
  | 'rainy'
  | 'rainy-sunny'
  | 'rainy-snowy'
  | 'snowy'
  | 'snowy-sunny'
  | 'unknown'

/**
 * 47 都道府県の選択肢。
 * region は UI のグルーピング表示で使えるように残している。
 */
export interface AreaOption {
  code: string
  name: string
  region: string
}

/**
 * 最低 / 最高気温の組み。
 * 値がないケースを空文字ではなく null で表す。
 */
export interface TemperatureRange {
  min: number | null
  max: number | null
}

/**
 * 時間帯ごとの降水確率。
 * dateTime は表示直前まで ISO 文字列で保持し、整形は UI か lib に委ねる。
 */
export interface PrecipitationChance {
  dateTime: string
  percentage: number | null
}

/**
 * 今日の天気表示に必要なまとまり。
 */
export interface CurrentWeather {
  dateTime: string | null
  weatherCode: string | null
  description: string | null
  icon: WeatherIconKey
  wind: string | null
  wave: string | null
  temperature: TemperatureRange
  precipitationChances: PrecipitationChance[]
}

/**
 * 週間予報 1 日分。
 */
export interface DailyForecast {
  date: string
  weatherCode: string | null
  description: string | null
  icon: WeatherIconKey
  precipitationChance: number | null
  reliability: 'A' | 'B' | 'C' | null
  temperature: TemperatureRange
}

/**
 * 画面上部のメタ情報。
 * publishingOffice と reportDatetime は「どの予報か」を説明するのに使う。
 */
export interface WeatherOverview {
  publishingOffice: string | null
  reportDatetime: string | null
}

/**
 * renderer で保持する天気データ本体。
 * JMA 生レスポンス依存を隠し、UI が必要な値へ整理した形。
 */
export interface WeatherData {
  requestedAreaCode: string
  forecastArea: {
    name: string | null
    code: string | null
  }
  temperatureArea: {
    name: string | null
    code: string | null
  }
  overview: WeatherOverview
  current: CurrentWeather
  dailyForecasts: DailyForecast[]
}

/**
 * weatherStore の公開 state。
 * loading / refreshing / usingCache を分け、UI が状態遷移を描き分けやすくしている。
 */
export interface WeatherStoreState {
  initialized: boolean
  loading: boolean
  refreshing: boolean
  usingCache: boolean
  error: string | null
  selectedAreaCode: string
  availableAreas: AreaOption[]
  favoriteAreaCodes: string[]
  autoRefreshIntervalMinutes: number
  weatherData: WeatherData | null
  lastUpdated: string | null
}
