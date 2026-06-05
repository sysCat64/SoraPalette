/**
 * src/renderer/lib/jmaWarningTransformer.ts
 *
 * JMA 警報・注意報 API の生レスポンスをアプリ内表現（WarningState）に変換する。
 * weatherStore から切り出してユニットテストできるようにする。
 *
 * 担当: Claude Code
 */

import type { WarningState, WarningSeverity } from '../types/app'
import type { JmaWarningItem, JmaWarningRaw } from '../types/jma'

/** JMA 警報・注意報コードを表示名へ変換するための対応表 */
const WARNING_CODE_LABELS: Record<string, string> = {
  '02': '暴風雪警報',
  '03': '大雨警報',
  '04': '洪水警報',
  '05': '暴風警報',
  '06': '大雪警報',
  '07': '波浪警報',
  '08': '高潮警報',
  '09': 'レベル3土砂災害警報',
  '10': '大雨注意報',
  '12': '大雪注意報',
  '13': '風雪注意報',
  '14': '雷注意報',
  '15': '強風注意報',
  '16': '波浪注意報',
  '17': '融雪注意報',
  '18': '洪水注意報',
  '19': '高潮注意報',
  '20': '濃霧注意報',
  '21': '乾燥注意報',
  '22': 'なだれ注意報',
  '23': '低温注意報',
  '24': '霜注意報',
  '25': '着氷注意報',
  '26': '着雪注意報',
  '27': 'その他の注意報',
  '29': 'レベル2土砂災害注意報',
  '32': '暴風雪特別警報',
  '33': '大雨特別警報',
  '35': '暴風特別警報',
  '36': '大雪特別警報',
  '37': '波浪特別警報',
  '38': '高潮特別警報',
  '39': 'レベル5土砂災害特別警報',
  '43': 'レベル4大雨危険警報',
  '48': 'レベル4高潮危険警報',
  '49': 'レベル4土砂災害危険警報'
}

/** 発表中として扱う status。解除や「発表警報・注意報はなし」は除外する */
const ACTIVE_WARNING_STATUSES = new Set([
  '発表',
  '継続',
  '特別警報から警報',
  '特別警報から注意報',
  '警報から注意報'
])

/** JMA の kind / warning 1 件から表示名を解決する */
function resolveWarningName(item: JmaWarningItem): string | null {
  if (item.name) {
    return item.name
  }

  if (item.code) {
    return WARNING_CODE_LABELS[item.code] ?? `不明な警報・注意報(${item.code})`
  }

  return null
}

/**
 * JMA 警報生レスポンスを WarningState に変換する。
 *
 * - status が発表中を示す warning / kind のみを抽出する
 * - 現在の JMA 公式レスポンスは warnings 配列と code を返すため、コードから表示名を解決する
 * - 重複する種別名は除外する
 * - "警報" を含む種別があれば severity: 'warning'、"注意報" のみなら 'advisory'
 */
export function transformWarning(raw: JmaWarningRaw): WarningState {
  const kinds: string[] = []

  for (const areaType of raw.areaTypes ?? []) {
    for (const area of areaType.areas ?? []) {
      const warningItems = [...(area.warnings ?? []), ...(area.kinds ?? [])]

      for (const warningItem of warningItems) {
        const isActive = ACTIVE_WARNING_STATUSES.has(warningItem.status ?? '')
        const name = resolveWarningName(warningItem)

        if (isActive && name && !kinds.includes(name)) {
          kinds.push(name)
        }
      }
    }
  }

  const severity: WarningSeverity = kinds.some((k) => k.includes('警報'))
    ? 'warning'
    : kinds.length > 0
      ? 'advisory'
      : 'none'

  return {
    severity,
    kinds,
    headline: raw.headlineText?.trim() || null,
    error: null
  }
}
