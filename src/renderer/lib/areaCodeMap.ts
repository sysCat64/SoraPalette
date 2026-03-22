/**
 * src/renderer/lib/areaCodeMap.ts
 *
 * 都道府県選択用のエリアコード一覧を定義する。
 * JMA の実データでは「地方コード」と「都道府県コード」が混在するため、
 * UI 選択ではまず都道府県レベルの代表コードに揃える。
 */

import type { AreaOption } from '../types/app'

/** 初期表示に使う東京都のエリアコード */
export const DEFAULT_AREA_CODE = '130000'

/**
 * 47 都道府県の代表エリアコード一覧。
 * UI 側で都道府県選択やお気に入り選択肢としてそのまま利用できる。
 */
export const PREFECTURE_AREAS: AreaOption[] = [
  { code: '011000', name: '北海道', region: '北海道' },
  { code: '020000', name: '青森県', region: '東北' },
  { code: '030000', name: '岩手県', region: '東北' },
  { code: '040000', name: '宮城県', region: '東北' },
  { code: '050000', name: '秋田県', region: '東北' },
  { code: '060000', name: '山形県', region: '東北' },
  { code: '070000', name: '福島県', region: '東北' },
  { code: '080000', name: '茨城県', region: '関東' },
  { code: '090000', name: '栃木県', region: '関東' },
  { code: '100000', name: '群馬県', region: '関東' },
  { code: '110000', name: '埼玉県', region: '関東' },
  { code: '120000', name: '千葉県', region: '関東' },
  { code: '130000', name: '東京都', region: '関東' },
  { code: '140000', name: '神奈川県', region: '関東' },
  { code: '150000', name: '新潟県', region: '中部' },
  { code: '160000', name: '富山県', region: '中部' },
  { code: '170000', name: '石川県', region: '中部' },
  { code: '180000', name: '福井県', region: '中部' },
  { code: '190000', name: '山梨県', region: '中部' },
  { code: '200000', name: '長野県', region: '中部' },
  { code: '210000', name: '岐阜県', region: '中部' },
  { code: '220000', name: '静岡県', region: '中部' },
  { code: '230000', name: '愛知県', region: '中部' },
  { code: '240000', name: '三重県', region: '近畿' },
  { code: '250000', name: '滋賀県', region: '近畿' },
  { code: '260000', name: '京都府', region: '近畿' },
  { code: '270000', name: '大阪府', region: '近畿' },
  { code: '280000', name: '兵庫県', region: '近畿' },
  { code: '290000', name: '奈良県', region: '近畿' },
  { code: '300000', name: '和歌山県', region: '近畿' },
  { code: '310000', name: '鳥取県', region: '中国' },
  { code: '320000', name: '島根県', region: '中国' },
  { code: '330000', name: '岡山県', region: '中国' },
  { code: '340000', name: '広島県', region: '中国' },
  { code: '350000', name: '山口県', region: '中国' },
  { code: '360000', name: '徳島県', region: '四国' },
  { code: '370000', name: '香川県', region: '四国' },
  { code: '380000', name: '愛媛県', region: '四国' },
  { code: '390000', name: '高知県', region: '四国' },
  { code: '400000', name: '福岡県', region: '九州・沖縄' },
  { code: '410000', name: '佐賀県', region: '九州・沖縄' },
  { code: '420000', name: '長崎県', region: '九州・沖縄' },
  { code: '430000', name: '熊本県', region: '九州・沖縄' },
  { code: '440000', name: '大分県', region: '九州・沖縄' },
  { code: '450000', name: '宮崎県', region: '九州・沖縄' },
  { code: '460100', name: '鹿児島県', region: '九州・沖縄' },
  { code: '471000', name: '沖縄県', region: '九州・沖縄' }
]

/** code からエリア情報を探す */
export function findAreaByCode(code: string): AreaOption | undefined {
  return PREFECTURE_AREAS.find((area) => area.code === code)
}

/** renderer 側でサポートしているエリアコードかを判定する */
export function isSupportedAreaCode(code: string): boolean {
  return findAreaByCode(code) !== undefined
}
