/**
 * src/main/services/jmaWarningService.ts
 *
 * 気象庁警報・注意報 API からデータを取得するサービス。
 * CORS の制約から、メインプロセスでのみ fetch する（jmaService.ts と同じ理由）。
 *
 * エンドポイント:
 *   https://www.jma.go.jp/bosai/warning/data/warning/{areaCode}.json
 *
 * 担当: Claude Code
 */

/** JMA 警報 API の生レスポンス型（renderer/types/jma.ts の JmaWarningRaw と対応） */
export interface JmaWarningRaw {
  headlineText?: string
  areaTypes?: Array<{
    areaType?: string
    areas?: Array<{
      code?: string
      name?: string
      kinds?: Array<{
        code?: string
        name?: string
        /** "発表" | "継続" | "解除" */
        status?: string
      }>
    }>
  }>
}

/**
 * 指定エリアの気象警報・注意報データを取得する。
 * @param areaCode 都道府県エリアコード（例: '130000'）
 */
export async function fetchWarning(areaCode: string): Promise<JmaWarningRaw> {
  const url = `https://www.jma.go.jp/bosai/warning/data/warning/${areaCode}.json`

  // タイムアウト: 警報 API は予報 API より軽量なため 10 秒に設定
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })

  if (!response.ok) {
    throw new Error(`JMA 警報 API エラー: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<JmaWarningRaw>
}
