# 気象庁API（JMA）利用ガイド

> 気象庁のオープンデータAPIについて、SoraPaletteでの利用方法を解説します。

---

## APIの概要

気象庁（Japan Meteorological Agency / JMA）は、
無償でオープンデータAPIを提供しています。
認証・APIキー不要で利用でき、日本全国の天気予報を取得できます。

**利用条件**: 気象庁ホームページの利用規約に準拠。商用・非商用問わず利用可能。

---

## SoraPaletteで使うエンドポイント

### 1. 週間予報（メインAPI）
```
GET https://www.jma.go.jp/bosai/forecast/data/forecast/{エリアコード}.json
```

**東京の例:**
```
https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json
```

返り値: 今週の詳細予報 + 週間予報の構造化JSON（気温・降水確率・天気コード含む）

### 2. 天気概況テキスト
```
GET https://www.jma.go.jp/bosai/forecast/data/overview_forecast/{エリアコード}.json
```

返り値: 「東京地方は晴れ後くもり...」のような予報文テキスト

### 3. 気象警報・注意報
```
GET https://www.jma.go.jp/bosai/warning/data/warning/{エリアコード}.json
```

返り値: 現在発表中の警報・注意報の一覧

---

## 重要な制約: CORSの問題

**CORSとは**: ブラウザのセキュリティ機能。
別のドメインへのHTTPリクエストを制限する仕組みです。

JMA APIは `Access-Control-Allow-Origin` ヘッダーを返さないため、
**ブラウザ（レンダラープロセス）から直接fetchすると失敗します。**

```
✅ 正しい: メインプロセス（Node.js）からfetch
   → CORSの制約を受けない

❌ 失敗する: レンダラー（Chromium）からfetch
   → CORSエラー: "No 'Access-Control-Allow-Origin' header"
```

だからこそ、SoraPaletteでは：
1. レンダラーが `window.electronAPI.weather.fetch()` を呼ぶ（IPC通信）
2. メインプロセスが実際のJMA APIにfetchする
3. 結果をIPCでレンダラーに返す

という設計になっています。

---

## レスポンスJSON の読み方

`/forecast/{areaCode}.json` は配列を返します。

```json
[
  { ... },   // インデックス0: 今週の予報（3日間詳細）
  { ... }    // インデックス1: 週間予報（7日間）
]
```

### 今週の予報（インデックス0）

```json
{
  "publishingOffice": "東京管区気象台",
  "reportDatetime": "2026-03-21T05:00:00+09:00",
  "timeSeries": [
    {
      // 天気・風・波の時系列
      "timeDefines": [
        "2026-03-21T06:00:00+09:00",
        "2026-03-22T00:00:00+09:00",
        "2026-03-23T00:00:00+09:00"
      ],
      "areas": [
        {
          "area": {
            "name": "東京地方",
            "code": "130010"   // ← 都道府県コードとは異なる「地方」コード
          },
          "weatherCodes": ["101", "201", "300"],   // 天気コード（文字列！）
          "weathers": ["晴れ　時々　くもり", "くもり", "雨"],
          "winds": ["北の風", "南の風", "南西の風"],
          "waves": ["０．５メートル", "１メートル", "２メートル"]
        }
      ]
    },
    {
      // 降水確率（6時間毎）
      "timeDefines": [...],
      "areas": [
        {
          "area": { "name": "東京地方", "code": "130010" },
          "pops": ["10", "20", "30", "40"]   // 降水確率（文字列！ %を付けない）
        }
      ]
    },
    {
      // 気温（地域によっては存在しない場合がある）
      "timeDefines": [...],
      "areas": [
        {
          "area": { "name": "東京", "code": "44132" },   // 異なるコード
          "temps": ["12", "21"]   // [最低気温, 最高気温]（摂氏）
        }
      ]
    }
  ]
}
```

### パース時の注意点

1. **値は全て文字列**: `weatherCodes`、`pops`、`temps` の値は全て `string` 型
   - 気温を数値として使う場合: `Number(temps[0])` または `parseInt(temps[0], 10)`
2. **エリアコードの不一致**: 天気・降水は「地方コード」（`130010`）、
   気温は「地点コード」（`44132`）を使うことがある
3. **気温データが存在しない場合**: `timeSeries[2]` が存在しない地域もある →
   `forecast[0].timeSeries[2]?.areas?.[0]?.temps` のように Optional Chaining を使う

---

## TypeScript型定義の例

```typescript
// src/renderer/types/jma.ts

/** JMA forecast APIのtimeSeries内のareasエントリ */
export interface JmaForecastArea {
  area: {
    name: string;    // 地方名（例: "東京地方"）
    code: string;    // エリアコード
  };
  weatherCodes?: string[];  // 天気コード（"100"〜"413"）
  weathers?: string[];      // 天気テキスト
  winds?: string[];         // 風の説明
  waves?: string[];         // 波の高さ
  pops?: string[];          // 降水確率（%）
  temps?: string[];         // 気温（摂氏）
  tempsMin?: string[];      // 最低気温
  tempsMax?: string[];      // 最高気温
}

/** JMA forecast APIのtimeSeriesエントリ */
export interface JmaTimeSeries {
  timeDefines: string[];      // ISO 8601形式の日時文字列
  areas: JmaForecastArea[];
}

/** JMA forecast APIのレスポンス1要素（[0]か[1]のどちらか） */
export interface JmaForecastItem {
  publishingOffice: string;   // 発表気象台名
  reportDatetime: string;     // 発表日時
  timeSeries: JmaTimeSeries[];
}

/** JMA forecast APIのレスポンス全体（配列） */
export type JmaForecast = JmaForecastItem[];
```
