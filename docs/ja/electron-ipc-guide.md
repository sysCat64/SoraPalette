# Electron IPC（プロセス間通信）ガイド

> ElectronのIPC通信パターンを、SoraPaletteの実装を例に解説します。

---

## IPCとは

IPC（Inter-Process Communication）= プロセス間通信。
メインプロセスとレンダラープロセスは独立したプロセスなので、
直接変数を共有したり、関数を呼んだりできません。
代わりにIPCを使って「メッセージ」を送受信します。

---

## SoraPaletteでのIPC全体図

```
[レンダラー]               [プリロード]              [メインプロセス]
  Svelteコンポーネント
       ↓
  window.electronAPI   ←── contextBridgeで公開 ──→  ipcMain.handle()
  .weather.fetch()          ipcRenderer.invoke()       で受け取る
       ↓                                                  ↓
  Promise<結果>       ←── 戻り値が返ってくる ─────  jmaService.fetch()
```

---

## 実装の3ステップ

### Step 1: メインプロセスでハンドラを定義

```typescript
// src/main/ipc/weatherHandlers.ts

import { ipcMain } from 'electron'
import { fetchForecast } from '../services/jmaService'

export function registerWeatherHandlers(): void {
  // 'weather:fetch' というチャンネルで受け取るハンドラを登録する
  // ipcRenderer.invoke() からのリクエストを処理する
  ipcMain.handle('weather:fetch', async (_event, areaCode: string) => {
    // _event: IpcMainInvokeEvent（今回は使わないのでアンダースコア付き）
    // areaCode: レンダラーから渡ってきた引数
    try {
      const data = await fetchForecast(areaCode)
      // 成功: データをそのまま返す
      return { success: true, data }
    } catch (error) {
      // 失敗: エラーメッセージを返す
      return { success: false, error: (error as Error).message }
    }
  })
}
```

### Step 2: プリロードでAPIを公開

```typescript
// src/preload/index.ts

import { contextBridge, ipcRenderer } from 'electron'

// contextBridge.exposeInMainWorld() で
// レンダラーの window.electronAPI にAPIを追加する
contextBridge.exposeInMainWorld('electronAPI', {
  weather: {
    // ipcRenderer.invoke() でメインプロセスにメッセージを送る
    // 戻り値はPromiseになる
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

### Step 3: レンダラー（Svelteストア）から呼ぶ

```typescript
// src/renderer/stores/weatherStore.ts

import { writable } from 'svelte/store'
import type { AppWeather } from '../types/app'

// writable store: 外部から値を更新できるストア
export const weatherStore = writable<AppWeather | null>(null)
export const loadingStore = writable<boolean>(false)
export const errorStore = writable<string | null>(null)

/**
 * JMA APIから天気データを取得してストアを更新する関数
 * @param areaCode JMAエリアコード（例: "130000"）
 */
export async function fetchWeather(areaCode: string): Promise<void> {
  // ローディング状態をセット
  loadingStore.set(true)
  errorStore.set(null)

  try {
    // window.electronAPI.weather.fetch() でメインプロセスに天気データを要求
    // これはプリロードが window.electronAPI として公開した関数
    const result = await window.electronAPI.weather.fetch(areaCode)

    if (result.success) {
      // 成功: データをパースしてストアに保存
      weatherStore.set(parseWeatherData(result.data))
    } else {
      // 失敗: エラーメッセージをエラーストアに保存
      errorStore.set(result.error)
    }
  } catch (err) {
    errorStore.set('予期しないエラーが発生しました')
  } finally {
    // ローディング状態を解除（成功・失敗どちらでも）
    loadingStore.set(false)
  }
}
```

---

## Svelteコンポーネントでの使い方

```svelte
<!-- src/renderer/components/controls/RefreshButton.svelte -->
<script lang="ts">
  import { loadingStore, fetchWeather } from '../../stores/weatherStore'
  import { settingsStore } from '../../stores/settingsStore'

  // $loadingStore: Svelteの「$」プレフィックスで
  // ストアの値に自動的に購読（subscribe）する
  // ストアが更新されるとコンポーネントが自動的に再描画される
  $: isLoading = $loadingStore

  // 現在選択中のエリアコードをsettingsStoreから取得
  $: currentAreaCode = $settingsStore.areaCode

  /** 更新ボタンが押されたときの処理 */
  async function handleRefresh(): Promise<void> {
    await fetchWeather(currentAreaCode)
  }
</script>

<!-- disabled属性でローディング中はボタンを押せなくする -->
<button
  class="btn btn-primary"
  on:click={handleRefresh}
  disabled={isLoading}
  aria-label="天気情報を更新する"
>
  <!-- ローディング中はスピナーを表示、そうでなければ更新アイコン -->
  {#if isLoading}
    <span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
    更新中...
  {:else}
    ↻ 更新
  {/if}
</button>
```

---

## IPC通信の命名規約（SoraPaletteの場合）

チャンネル名は `カテゴリ:アクション` の形式で統一する。

| チャンネル名 | 説明 |
|------------|------|
| `weather:fetch` | 天気データの取得 |
| `weather:cache-read` | キャッシュの読み込み |
| `store:get` | 設定値の取得 |
| `store:set` | 設定値の保存 |
| `notification:send` | デスクトップ通知の送信 |

---

## よくある間違いと対処法

### ❌ レンダラーでNode.jsモジュールをimportしてしまう

```typescript
// ❌ 動作しない！
import { readFileSync } from 'fs'  // Node.js API

// ✅ 正しい: IPCを通じてメインプロセスに依頼する
const data = await window.electronAPI.someFileOperation(path)
```

### ❌ ipcRenderer.on() でハンドラを登録し続ける

```typescript
// ❌ メモリリーク: コンポーネントが再描画されるたびにリスナーが増える
onMount(() => {
  ipcRenderer.on('some-event', handler)
})

// ✅ 正しい: SvelteのonDestroy()でリスナーを削除する
import { onDestroy } from 'svelte'
onMount(() => {
  ipcRenderer.on('some-event', handler)
})
onDestroy(() => {
  ipcRenderer.removeListener('some-event', handler)
})
```
