/**
 * src/renderer/types/jma.ts
 *
 * 気象庁 forecast API の生レスポンス型をまとめる。
 * renderer 側ではまずこの型で「外部 API の形」を受け止め、
 * その後 src/renderer/lib/ の変換関数でアプリ内部型へ正規化する。
 *
 * JMA の配列やフィールドは欠損しうるため、optional を多めに使って
 * 「存在するとは限らない」ことを型で表現している。
 */

/**
 * JMA が返すエリア参照。
 * 都道府県コード（例: 130000）とは別に、地方コードや観測地点コードが来ることがある。
 */
export interface JmaAreaReference {
  /** 画面表示に使えるエリア名 */
  name: string
  /** JMA 内部のエリアコード */
  code: string
}

/**
 * weatherCodes / weathers / winds / waves を含むエリアデータ。
 * 主に「当日〜翌日」の詳細予報で使われる。
 */
export interface JmaWeatherArea {
  area: JmaAreaReference
  weatherCodes?: string[]
  weathers?: string[]
  winds?: string[]
  waves?: string[]
}

/**
 * 降水確率を持つエリアデータ。
 * 値は文字列で返るため、renderer 側で数値に変換する。
 */
export interface JmaPopArea {
  area: JmaAreaReference
  pops?: string[]
}

/**
 * 当日詳細予報側の気温データ。
 * temps は最低気温・最高気温が順に入るケースを想定する。
 */
export interface JmaDailyTempArea {
  area: JmaAreaReference
  temps?: string[]
}

/**
 * 週間予報側の気温データ。
 * 最低・最高気温に加えて上下限が返ることがある。
 */
export interface JmaWeeklyTempArea {
  area: JmaAreaReference
  tempsMin?: string[]
  tempsMinLower?: string[]
  tempsMinUpper?: string[]
  tempsMax?: string[]
  tempsMaxLower?: string[]
  tempsMaxUpper?: string[]
}

/**
 * 週間予報側の weatherCodes / pops / reliabilities を持つエリアデータ。
 */
export interface JmaWeeklyWeatherArea {
  area: JmaAreaReference
  weatherCodes?: string[]
  pops?: string[]
  reliabilities?: Array<'A' | 'B' | 'C' | string>
}

/**
 * JMA 共通の時系列構造。
 * timeDefines と areas の対応関係は API の意味に依存するため、
 * 個々の変換関数で丁寧に参照する。
 */
export interface JmaTimeSeries<TArea> {
  timeDefines?: string[]
  areas?: TArea[]
}

/**
 * forecast API の 1 レポート分。
 * index 0 が詳細予報、index 1 が週間予報になる想定。
 */
export interface JmaForecastReport {
  publishingOffice?: string
  reportDatetime?: string
  timeSeries?: Array<
    | JmaTimeSeries<JmaWeatherArea>
    | JmaTimeSeries<JmaPopArea>
    | JmaTimeSeries<JmaDailyTempArea>
    | JmaTimeSeries<JmaWeeklyWeatherArea>
    | JmaTimeSeries<JmaWeeklyTempArea>
  >
}

/**
 * JMA forecast API のレスポンス全体。
 * 配列長は通常 2 だが、今後の変更や異常系に備えて固定長タプルではなく配列で表す。
 */
export type JmaForecastResponse = JmaForecastReport[]

// ---------------------------------------------------------------------------
// 警報・注意報 API 型（bosai/warning/data/warning/{areaCode}.json）
// ---------------------------------------------------------------------------

/** 警報・注意報の種別 1 件 */
export interface JmaWarningItem {
  code?: string
  /** 旧モックや将来の拡張で名前が来た場合は優先して使う */
  name?: string
  /** "発表" | "継続" | "解除" | "発表警報・注意報はなし" など */
  status?: string
}

/** 警報・注意報対象エリア 1 件 */
export interface JmaWarningArea {
  code?: string
  name?: string
  /** 現在の JMA warning API が返す警報・注意報配列 */
  warnings?: JmaWarningItem[]
  /** 旧モック互換。実レスポンスでは warnings を使う */
  kinds?: JmaWarningItem[]
}

/** エリア種別ごとのグループ */
export interface JmaWarningAreaType {
  areaType?: string
  areas?: JmaWarningArea[]
}

/** JMA 警報 API の生レスポンス */
export interface JmaWarningRaw {
  headlineText?: string
  areaTypes?: JmaWarningAreaType[]
}

// ---------------------------------------------------------------------------
// 概況テキスト API 型（bosai/forecast/data/overview_forecast/{areaCode}.json）
// ---------------------------------------------------------------------------

/** JMA overview_forecast API の生レスポンス */
export interface JmaOverviewRaw {
  publishingOffice?: string
  reportDatetime?: string
  targetArea?: string
  /** 短い見出し文（1〜2文） */
  headlineText?: string
  /** 詳細な概況テキスト（複数段落・改行あり） */
  text?: string
}
