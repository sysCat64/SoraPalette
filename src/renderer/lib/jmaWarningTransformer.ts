/**
 * src/renderer/lib/jmaWarningTransformer.ts
 *
 * JMA 警報・注意報 API の生レスポンスをアプリ内表現（WarningState）に変換する。
 * weatherStore から切り出してユニットテストできるようにする。
 *
 * 担当: Claude Code
 */

import type { WarningState, WarningSeverity } from '../types/app'
import type { JmaWarningRaw } from '../types/jma'

/**
 * JMA 警報生レスポンスを WarningState に変換する。
 *
 * - status が "発表" または "継続" の kind のみを抽出する
 * - 重複する kind 名は除外する
 * - "警報" を含む種別があれば severity: 'warning'、"注意報" のみなら 'advisory'
 */
export function transformWarning(raw: JmaWarningRaw): WarningState {
  const kinds: string[] = []

  for (const areaType of raw.areaTypes ?? []) {
    for (const area of areaType.areas ?? []) {
      for (const kind of area.kinds ?? []) {
        const isActive = kind.status === '発表' || kind.status === '継続'
        if (isActive && kind.name && !kinds.includes(kind.name)) {
          kinds.push(kind.name)
        }
      }
    }
  }

  const severity: WarningSeverity = kinds.some((k) => k.includes('警報'))
    ? 'warning'
    : kinds.length > 0
      ? 'advisory'
      : 'none'

  return { severity, kinds }
}
