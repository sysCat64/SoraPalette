/**
 * src/main/services/jmaOverviewService.ts
 *
 * 気象庁 overview_forecast API から天気概況テキストを取得するサービス。
 * CORS の制約から、メインプロセスでのみ fetch する。
 *
 * エンドポイント:
 *   https://www.jma.go.jp/bosai/forecast/data/overview_forecast/{areaCode}.json
 *
 * レスポンス例:
 *   { headlineText: "東京地方は晴れています。", text: "東京地方は..." }
 *
 * 担当: Claude Code
 */

/** JMA overview_forecast API の生レスポンス型 */
export interface JmaOverviewRaw {
  publishingOffice?: string
  reportDatetime?: string
  targetArea?: string
  headlineText?: string
  text?: string
}

/**
 * 指定エリアの天気概況テキストを取得する。
 * @param areaCode 都道府県エリアコード（例: '130000'）
 */
export async function fetchOverviewForecast(areaCode: string): Promise<JmaOverviewRaw> {
  const url = `https://www.jma.go.jp/bosai/forecast/data/overview_forecast/${areaCode}.json`

  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })

  if (!response.ok) {
    throw new Error(`JMA 概況 API エラー: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<JmaOverviewRaw>
}
