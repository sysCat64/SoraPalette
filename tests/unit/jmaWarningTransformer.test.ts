import { describe, expect, it } from 'vitest'
import { transformWarning } from '../../src/renderer/lib/jmaWarningTransformer'
import type { JmaWarningRaw } from '../../src/renderer/types/jma'

// JMA 警報 API レスポンスのモックデータ（実際の構造に準拠）
const mockWithAdvisory: JmaWarningRaw = {
  headlineText: '東京都では、強風に注意してください。',
  areaTypes: [
    {
      areaType: 'class20s',
      areas: [
        {
          code: '130010',
          name: '東京地方',
          kinds: [
            { code: '33', name: '強風注意報', status: '発表' },
            { code: '10', name: '大雨注意報', status: '発表' },
          ],
        },
      ],
    },
  ],
}

const mockWithWarning: JmaWarningRaw = {
  headlineText: '東京都では、大雨に警戒してください。',
  areaTypes: [
    {
      areaType: 'class20s',
      areas: [
        {
          code: '130010',
          name: '東京地方',
          kinds: [
            { code: '02', name: '大雨警報', status: '発表' },
            { code: '33', name: '強風注意報', status: '継続' },
          ],
        },
        {
          code: '130020',
          name: '多摩北部',
          kinds: [
            // 解除済みは含めない
            { code: '02', name: '大雨警報', status: '解除' },
            // 大雨警報は既出のため重複しない
            { code: '02', name: '大雨警報', status: '発表' },
          ],
        },
      ],
    },
  ],
}

const mockNoWarning: JmaWarningRaw = {
  headlineText: '',
  areaTypes: [
    {
      areaType: 'class20s',
      areas: [
        {
          code: '130010',
          name: '東京地方',
          kinds: [
            { code: '02', name: '大雨警報', status: '解除' },
          ],
        },
      ],
    },
  ],
}

const mockEmpty: JmaWarningRaw = {
  headlineText: '',
  areaTypes: [],
}

describe('transformWarning', () => {
  it('注意報のみの場合は severity: advisory になる', () => {
    const result = transformWarning(mockWithAdvisory)
    expect(result.severity).toBe('advisory')
    expect(result.kinds).toContain('強風注意報')
    expect(result.kinds).toContain('大雨注意報')
    expect(result.kinds).toHaveLength(2)
  })

  it('警報が含まれる場合は severity: warning になる', () => {
    const result = transformWarning(mockWithWarning)
    expect(result.severity).toBe('warning')
    expect(result.kinds).toContain('大雨警報')
    expect(result.kinds).toContain('強風注意報')
  })

  it('複数エリアにまたがる重複 kind は1件にまとめる', () => {
    const result = transformWarning(mockWithWarning)
    // 大雨警報は 2 エリアで発表されているが kinds には 1 件だけ
    expect(result.kinds.filter((k) => k === '大雨警報')).toHaveLength(1)
  })

  it('すべて解除済みの場合は severity: none になる', () => {
    const result = transformWarning(mockNoWarning)
    expect(result.severity).toBe('none')
    expect(result.kinds).toHaveLength(0)
  })

  it('areaTypes が空の場合は severity: none になる', () => {
    const result = transformWarning(mockEmpty)
    expect(result.severity).toBe('none')
    expect(result.kinds).toHaveLength(0)
  })
})
