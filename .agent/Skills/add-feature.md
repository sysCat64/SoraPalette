# スキル: 新機能の追加

## 使い方
`{{placeholder}}` を埋めてAIへのプロンプトとして使ってください。

---

## プロンプトテンプレート

```
# 新機能追加: {{機能名}}

## 概要
{{機能の1文説明}}

## 実装対象ファイル
- メインプロセス（該当する場合）: src/main/ipc/{{handlerファイル名}}.ts
- プリロード（該当する場合）: src/preload/index.ts, src/preload/types.ts
- ストア（該当する場合）: src/renderer/stores/{{storeファイル名}}.ts
- コンポーネント（該当する場合）: src/renderer/components/{{コンポーネント名}}.svelte

## 受け取るデータ
- JMAのフィールド名: {{jma_json_field}}
- 型: {{TypeScript型}}

## 表示仕様
{{どのように表示するか（1〜3文）}}

## 要件
- [ ] TypeScript型定義を追加する
- [ ] 日本語コメントを詳細に記述する
- [ ] エラーハンドリングを実装する（IPCはtry/catchで包む）
- [ ] ユニットテストを tests/unit/ に追加する
- [ ] .agent/MemoryBank/progress.md を更新する

## 参照ファイル
- .agent/MemoryBank/jma-api-notes.md（JMA APIの仕様確認）
- src/preload/types.ts（既存のIPC API型定義）
- .agent/AGENT.md（コーディング規約）
```

---

## 記入例

```
# 新機能追加: 風速・風向表示

## 概要
JMA forecastのwindsフィールドから風速・風向を取得し、コンパスアイコンで表示する

## 実装対象ファイル
- メインプロセス: 既存のweatherHandlers.tsにwindsフィールドを追加
- ストア: weatherStore.ts の AppWeather 型に wind フィールドを追加
- コンポーネント: src/renderer/components/weather/WindIndicator.svelte を新規作成

## 受け取るデータ
- JMAのフィールド名: timeSeries[0].areas[n].winds
- 型: string[] （例: ["北の風　後　北東の風", ...]）

## 表示仕様
今日の風向きをコンパスSVGアイコンで表示。
テキスト（"北の風 後 北東の風"）も小さく下に表示する。

## 要件
- [x] TypeScript型定義を追加する
...
```
