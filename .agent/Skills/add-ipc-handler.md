# スキル: Electron IPCハンドラの追加

## 使い方
`{{placeholder}}` を埋めてAIへのプロンプトとして使ってください。
Claude Code が主担当ですが、テンプレートとして全AIが参照できます。

---

## プロンプトテンプレート

```
# IPCハンドラ追加: {{チャンネル名}}

## チャンネル名
{{チャンネル名（例: weather:fetch, store:get）}}

## 方向
レンダラー → メインプロセス（ipcRenderer.invoke → ipcMain.handle）

## 目的
{{何をするIPCか（1文）}}

## 引数
```typescript
// ipcRenderer.invoke('{{チャンネル名}}', {{引数型}})
{{引数名}}: {{型}}   // 説明
```

## 戻り値
```typescript
// 成功時
{ success: true; data: {{データ型}} }

// 失敗時
{ success: false; error: string }
```

## 実装対象ファイル

### 1. メインプロセス（src/main/ipc/{{ハンドラファイル}}.ts）
```typescript
// ipcMain.handle('{{チャンネル名}}', async (_event, {{引数}}) => { ... })
// を追加する
```

### 2. プリロード（src/preload/index.ts）
```typescript
// contextBridge.exposeInMainWorld の electronAPI オブジェクトに
// {{メソッド名}}: ({{引数}}) => ipcRenderer.invoke('{{チャンネル名}}', {{引数}})
// を追加する
```

### 3. 型定義（src/preload/types.ts）
```typescript
// ElectronAPI インターフェースに
// {{メソッド名}}: ({{引数型}}) => Promise<{{戻り値型}}>
// を追加する
```

## 要件
- [ ] メインプロセス側は try/catch で包む
- [ ] エラーメッセージは日本語で分かりやすく
- [ ] 日本語コメントで処理の意図を説明する
- [ ] src/preload/types.ts の変更をCodex・Geminiに伝える（progress.mdに記録）

## 参照ファイル
- .agent/AGENT.md（IPCチャンネル命名規約）
- src/preload/types.ts（既存の型定義）
- src/main/ipc/index.ts（ハンドラ登録ファイル）
```

---

## 記入例

```
# IPCハンドラ追加: weather:fetch

## チャンネル名
weather:fetch

## 目的
指定したエリアコードのJMA天気予報データをAPIから取得して返す

## 引数
areaCode: string   // JMAエリアコード（例: "130000"）

## 戻り値
// 成功時
{ success: true; data: JmaForecast[] }

// 失敗時
{ success: false; error: string }

...
```
