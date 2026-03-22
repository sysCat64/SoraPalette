# ADR-003: JMA forecast APIの採用（overview_forecastではなく）

- **日付**: 2026-03-21
- **決定者**: プロジェクト立案時（Claude Code）
- **状態**: 採用

---

## 背景・課題

気象庁APIには予報の取得方法が2種類ある：

### エンドポイントA: `overview_forecast`（概況テキスト）
```
GET https://www.jma.go.jp/bosai/forecast/data/overview_forecast/{areaCode}.json
```

レスポンス例：
```json
{
  "publishingOffice": "東京管区気象台",
  "reportDatetime": "2026-03-21T05:00:00+09:00",
  "headlineText": "東京地方は、高気圧に覆われておおむね晴れています。",
  "text": "　東京地方は、高気圧に覆われておおむね晴れています。\n...",
  "targetArea": "東京都"
}
```

特徴:
- 非常にシンプルな構造
- テキストのみ（気温・降水確率なし）
- 「天気の解説文」として補助的に使える

### エンドポイントB: `forecast`（構造化予報JSON）
```
GET https://www.jma.go.jp/bosai/forecast/data/forecast/{areaCode}.json
```

特徴:
- 複雑なネスト構造
- 天気コード・気温・降水確率・週間予報を含む
- v1機能要件（気温・降水確率・7日間予報）が全て含まれる

---

## 決定内容

**エンドポイントBの `forecast` をメインのデータソースとして採用する。**

必要に応じて `overview_forecast` を補足テキスト（天気概況の説明文）として追加利用する。

---

## 根拠

v1の機能要件を実現するために `forecast` エンドポイントが必要：

| 機能 | overview_forecast | forecast |
|------|:-:|:-:|
| 今日の天気（テキスト） | ✅ | ✅ |
| 天気コード（SVGアイコン用） | ❌ | ✅ |
| 最高/最低気温 | ❌ | ✅ |
| 降水確率 | ❌ | ✅ |
| 7日間予報 | ❌ | ✅ |

また、学習目的として「複雑なJSONのパース処理」を経験することも有益。

---

## 影響・注意点

1. **パース処理の複雑さ**: `forecast` のJSONは深くネストしている
   - `jma-api-notes.md` に詳細なレスポンス構造を記録済み
   - OpenAI Codexが `jmaService.ts` のパース処理を担当

2. **気温データの欠如**: 一部エリアでは気温データが存在しない
   - `forecast[0].timeSeries[2]?.areas?.[0]?.temps` のように Optional Chaining 必須

3. **エリアコードの不一致**: 天気データと気温データで異なるエリアコードを使う場合がある
   - 天気: 「地方コード」（例: `130010`）
   - 気温: 「地点コード」（例: `44132`）
   - 都道府県コード（`130000`）でAPIを叩いても、レスポンス内のコードは異なる

4. **文字列型の数値**: `weatherCodes`、`pops`、`temps` は全て文字列型
   - 数値比較・計算時は `Number()` や `parseInt()` で変換する
