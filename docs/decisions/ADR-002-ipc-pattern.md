# ADR-002: contextBridge + IPC パターンの採用

- **日付**: 2026-03-21
- **決定者**: プロジェクト立案時（Claude Code）
- **状態**: 採用

---

## 背景・課題

Electronではレンダラープロセス（Svelte）からNode.js APIにアクセスする方法として、
主に2つのアプローチがある：

### アプローチA: `nodeIntegration: true`（非推奨）
```typescript
// BrowserWindow設定
webPreferences: {
  nodeIntegration: true,  // レンダラーでNode.jsが使えるようになる
  contextIsolation: false,
}
```
- メリット: 設定が簡単、レンダラーで直接 `require('fs')` 等が使える
- デメリット: **セキュリティリスク**が高い。XSSがあれば任意コード実行が可能

### アプローチB: `contextBridge + contextIsolation`（推奨）
```typescript
// BrowserWindow設定
webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,   // セキュア
  nodeIntegration: false,   // セキュア
}
```
- メリット: セキュリティが高い、APIの境界が明確
- デメリット: プリロードスクリプトの記述が必要

---

## 決定内容

**アプローチB（contextBridge + contextIsolation）を採用する。**

```typescript
// src/preload/index.ts
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  weather: {
    fetch: (areaCode: string) =>
      ipcRenderer.invoke('weather:fetch', areaCode),
  },
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: unknown) =>
      ipcRenderer.invoke('store:set', key, value),
  },
})
```

---

## 根拠

1. **セキュリティ**: Electronの公式推奨設定。学習プロジェクトでも正しいプラクティスを習得する
2. **明確なAPI境界**: `window.electronAPI` が唯一の通信手段となり、何ができるか一目瞭然
3. **型安全**: `src/preload/types.ts` に型定義を集約することで、
   TypeScriptの恩恵を最大限に受けられる
4. **学習効果**: contextBridgeとIPCを理解することで、
   Electronのセキュリティモデルへの理解が深まる

---

## 影響・注意点

- `src/preload/types.ts` がレンダラー（Codex担当）との契約ファイルになる
  - 変更時は必ず `progress.md` に記録する
- IPCチャンネル名の命名規約を守ること（`カテゴリ:アクション` 形式）
- JMA APIのfetchはCORSの都合から**必ずメインプロセスで行う**（ADR-003参照）
