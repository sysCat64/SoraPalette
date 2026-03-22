# Svelteパターン解説

> SoraPaletteで使うSvelteの主要パターンを、具体例を交えて解説します。

---

## Svelteとは

Svelte（スヴェルト）は「コンパイル時にフレームワークの処理を終わらせる」
次世代UIフレームワークです。

- **React**: 仮想DOMをランタイムで計算する
- **Svelte**: ビルド時にコンパイルして、最小限のJavaScriptを生成

結果として、バンドルサイズが小さく、動作が速いアプリが作れます。

---

## Svelteファイルの構造

```svelte
<!-- WeatherCard.svelte の例 -->

<script lang="ts">
  // ① ロジック部分（TypeScript）
  // コンポーネントの状態・処理・イベントハンドラを書く
  import { weatherStore } from '../../stores/weatherStore'

  export let areaName: string  // propsはexportで宣言する

  $: weather = $weatherStore?.today  // リアクティブ宣言
</script>

<!-- ② テンプレート部分（HTML + Svelte構文） -->
<div class="card bg-base-100">
  <h2>{areaName}</h2>
  {#if weather}
    <p>{weather.description}</p>
  {:else}
    <p>データなし</p>
  {/if}
</div>

<style>
  /* ③ スタイル部分（このコンポーネントのみに適用） */
  /* Tailwindを使うのでここはあまり書かない */
  .card {
    /* スタイルはTailwindクラスを優先 */
  }
</style>
```

---

## Svelteストア（状態管理）

### writable ストア：外から更新できる状態

```typescript
// src/renderer/stores/weatherStore.ts

import { writable } from 'svelte/store'
import type { AppWeather } from '../types/app'

// writable<型>(初期値) でストアを作る
// このストアはアプリ全体から読み書きできる
export const weatherStore = writable<AppWeather | null>(null)

// ストアの更新方法:
weatherStore.set({ today: {...}, forecast: [...] })    // 全体を置き換え
weatherStore.update(prev => ({ ...prev, loading: true }))  // 部分的に更新
```

### derived ストア：他のストアから計算される状態

```typescript
import { derived } from 'svelte/store'
import { weatherStore } from './weatherStore'
import { settingsStore } from './settingsStore'

// derived は複数のストアから新しい値を計算するストア
// weatherStore か settingsStore が変わると自動的に再計算される
export const displayTemperature = derived(
  [weatherStore, settingsStore],
  ([$weather, $settings]) => {
    if (!$weather?.today?.temp) return null

    // 設定に応じて摂氏/華氏を切り替える（将来の拡張用）
    return $settings.unit === 'celsius'
      ? `${$weather.today.temp}°C`
      : `${celsiusToFahrenheit($weather.today.temp)}°F`
  }
)
```

### コンポーネントでのストアの使い方

```svelte
<script lang="ts">
  import { weatherStore, fetchWeather } from '../../stores/weatherStore'

  // $weatherStore: 「$」プレフィックスで自動購読
  // → ストアの値が変わると自動的に再描画される
  // → onDestroy() で自動的に購読解除される（メモリリークなし）
  $: weather = $weatherStore
  $: isRainy = weather?.today?.weatherCode?.startsWith('3')  // 300番台は雨
</script>

<!-- テンプレートでも直接 $weatherStore を使える -->
{#if $weatherStore}
  <p>{$weatherStore.today.description}</p>
{/if}
```

---

## Svelteのリアクティビティ

### $: リアクティブ宣言

```svelte
<script lang="ts">
  export let temperatureC: number  // props

  // $: の後に書いた式は、依存する値が変わると自動的に再計算される
  // ここでは temperatureC が変わるたびに temperatureF が更新される
  $: temperatureF = (temperatureC * 9/5) + 32

  // 複数行も書ける（$: { ... }）
  $: {
    // temperatureC が変わるたびに実行される
    console.log(`気温が更新されました: ${temperatureC}°C`)
  }
</script>

<p>{temperatureC}°C = {temperatureF}°F</p>
```

---

## Svelteのテンプレート構文

### 条件分岐

```svelte
{#if weatherCode.startsWith('1')}
  <!-- 晴れ系（100番台）-->
  <SunnyIcon />
{:else if weatherCode.startsWith('2')}
  <!-- くもり系（200番台）-->
  <CloudyIcon />
{:else if weatherCode.startsWith('3')}
  <!-- 雨系（300番台）-->
  <RainyIcon />
{:else}
  <!-- 雪系（400番台）または不明 -->
  <SnowyIcon />
{/if}
```

### ループ

```svelte
<!-- forecastDays: AppForecastDay[] の配列 -->
{#each forecastDays as day, index (day.date)}
  <!-- key: (day.date) でSvelteが各要素を識別できる（パフォーマンス改善）-->
  <ForecastDayCard {day} />
{/each}

<!-- 配列が空の場合のフォールバック -->
{#each forecastDays as day (day.date)}
  <ForecastDayCard {day} />
{:else}
  <p class="text-base-content/50">予報データがありません</p>
{/each}
```

### 非同期処理

```svelte
<!-- await ブロック: Promiseの状態に応じて表示を切り替える -->
{#await fetchWeatherPromise}
  <!-- 待機中 -->
  <span class="loading loading-spinner"></span>
{:then weather}
  <!-- 成功時 -->
  <WeatherCard {weather} />
{:catch error}
  <!-- エラー時 -->
  <p class="text-error">{error.message}</p>
{/await}
```

---

## コンポーネント間のデータフロー

### 親から子へ: Props

```svelte
<!-- 親: ForecastStrip.svelte -->
<script lang="ts">
  import ForecastDayCard from './ForecastDayCard.svelte'
  import type { AppForecastDay } from '../../types/app'

  export let days: AppForecastDay[]
</script>

{#each days as day (day.date)}
  <!-- propsを渡す（{day} は day={day} の省略形） -->
  <ForecastDayCard {day} />
{/each}
```

```svelte
<!-- 子: ForecastDayCard.svelte -->
<script lang="ts">
  import type { AppForecastDay } from '../../types/app'

  // export で宣言するとpropsになる
  export let day: AppForecastDay
</script>

<div class="card">
  <p>{day.date}</p>
  <p>{day.description}</p>
</div>
```

### 子から親へ: createEventDispatcher

```svelte
<!-- 子: AreaSelector.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  // イベントの型定義（TypeScript）
  const dispatch = createEventDispatcher<{
    select: { areaCode: string; areaName: string }
  }>()

  function handleSelect(areaCode: string, areaName: string): void {
    // 親コンポーネントにイベントを送る
    dispatch('select', { areaCode, areaName })
  }
</script>
```

```svelte
<!-- 親: App.svelte -->
<script lang="ts">
  import AreaSelector from './components/controls/AreaSelector.svelte'
  import { fetchWeather } from './stores/weatherStore'

  function handleAreaSelect(event: CustomEvent<{areaCode: string; areaName: string}>): void {
    fetchWeather(event.detail.areaCode)
  }
</script>

<!-- on:select でカスタムイベントを受け取る -->
<AreaSelector on:select={handleAreaSelect} />
```

---

## ライフサイクル

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { loadingStore } from '../stores/weatherStore'

  // onMount: コンポーネントがDOMに追加された後に実行
  // （初回データ取得などに使う）
  onMount(async () => {
    await fetchWeather('130000')  // 初回ロード

    // 30分ごとに自動更新するタイマーを設定
    const intervalId = setInterval(() => {
      fetchWeather('130000')
    }, 30 * 60 * 1000)  // 30分 = 30 × 60 × 1000ミリ秒

    // onDestroy でタイマーをクリア（メモリリーク防止）
    return () => clearInterval(intervalId)
  })

  // onDestroy: コンポーネントが破棄されるときに実行
  onDestroy(() => {
    // サブスクリプションのクリーンアップなど
  })
</script>
```
