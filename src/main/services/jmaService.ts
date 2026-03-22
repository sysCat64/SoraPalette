/**
 * src/main/services/jmaService.ts
 *
 * 気象庁（JMA）オープンデータ API からデータを取得するサービス。
 *
 * ⚠️  重要: JMA API は CORS ヘッダーを返さないため、
 *          レンダラープロセスからの直接 fetch は失敗する。
 *          このファイルはメインプロセス（Node.js 環境）専用。
 *
 * 担当: Claude Code
 */

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

/**
 * jmaService が返す天気予報データ。
 * 詳細な型定義は Codex が src/renderer/types/jma.ts で行う。
 * ここでは unknown[] を使い、型の詳細は Codex に委ねる。
 */
export type JmaForecastRaw = unknown[]

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------

/** JMA 天気予報 API のベース URL */
const JMA_FORECAST_BASE_URL = 'https://www.jma.go.jp/bosai/forecast/data/forecast'

/** リクエストタイムアウト（ミリ秒） */
const FETCH_TIMEOUT_MS = 10_000

// ---------------------------------------------------------------------------
// 天気予報フェッチ
// ---------------------------------------------------------------------------

/**
 * 指定エリアコードの天気予報データを JMA API から取得する。
 *
 * @param areaCode 都道府県コード（例: '130000' = 東京都）
 * @returns JMA API のレスポンス JSON（配列形式）
 * @throws ネットワークエラーまたは HTTP エラーの場合
 */
export async function fetchForecast(areaCode: string): Promise<JmaForecastRaw> {
  // エリアコードの簡易バリデーション（数字6桁）
  if (!/^\d{6}$/.test(areaCode)) {
    throw new Error(`無効なエリアコードです: ${areaCode}`)
  }

  const url = `${JMA_FORECAST_BASE_URL}/${areaCode}.json`

  // AbortController でタイムアウトを実装
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        // JMA API はブラウザ外からのアクセスも許容するが、User-Agent を明示する
        'User-Agent': 'SoraPalette/0.1.0 (Electron; Desktop Weather App)'
      }
    })

    if (!response.ok) {
      throw new Error(`JMA API エラー: ${response.status} ${response.statusText} (URL: ${url})`)
    }

    return (await response.json()) as JmaForecastRaw
  } catch (error) {
    // AbortError は タイムアウト
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`JMA API タイムアウト（${FETCH_TIMEOUT_MS}ms 超過）: ${url}`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
