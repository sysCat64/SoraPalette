<!--
  src/renderer/App.svelte

  アプリのルートコンポーネント（Phase 3 本実装）。
  weatherStore を使って天気データを取得・表示する。
  テーマ切替・エリア選択・手動更新機能を含む。

  担当: Claude Code（Phase 3 代替実装）
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { weatherStore } from './stores/weatherStore'
  import WeatherCard   from './components/weather/WeatherCard.svelte'
  import ForecastStrip from './components/weather/ForecastStrip.svelte'
  import type { ThemeId } from '../preload/types'

  // weatherStore.selectedArea は derived Readable なので個別に参照する
  const { selectedArea } = weatherStore

  // ---- テーマ管理 ----
  let currentTheme = $state<ThemeId>('sora-light')

  /** テーマを切り替えて DOM 属性と electron-store に反映する */
  async function toggleTheme(): Promise<void> {
    currentTheme = currentTheme === 'sora-light' ? 'sora-dark' : 'sora-light'
    document.documentElement.setAttribute('data-theme', currentTheme)
    await window.electronAPI.storeSet('theme', currentTheme)
  }

  // ---- エリア選択 ----
  async function handleAreaChange(event: Event): Promise<void> {
    const code = (event.target as HTMLSelectElement).value
    await weatherStore.selectArea(code)
  }

  // ---- ライフサイクル ----
  onMount(async () => {
    // 保存済みテーマを復元する
    const result = await window.electronAPI.storeGet('theme')
    if (result.success) {
      currentTheme = result.data
    }
    document.documentElement.setAttribute('data-theme', currentTheme)

    // ストアを初期化（設定読込 + 初回天気取得）
    await weatherStore.initialize()
  })

  onDestroy(() => {
    weatherStore.destroy()
  })
</script>

<div class="min-h-screen bg-base-200 flex flex-col">

  <!-- ヘッダー -->
  <header class="navbar bg-base-100 shadow-sm px-4 gap-2">
    <!-- アプリ名 -->
    <div class="navbar-start">
      <span class="text-lg font-bold text-primary">SoraPalette</span>
    </div>

    <!-- エリア選択 -->
    <div class="navbar-center flex-1 max-w-xs">
      <select
        class="select select-bordered select-sm w-full"
        value={$weatherStore.selectedAreaCode}
        onchange={handleAreaChange}
        disabled={$weatherStore.loading}
      >
        {#each $weatherStore.availableAreas as area}
          <option value={area.code}>{area.name}</option>
        {/each}
      </select>
    </div>

    <!-- 右側コントロール -->
    <div class="navbar-end flex items-center gap-2">
      <!-- キャッシュ使用バッジ -->
      {#if $weatherStore.usingCache}
        <span class="badge badge-warning badge-sm">キャッシュ</span>
      {/if}

      <!-- 更新ボタン -->
      <button
        class="btn btn-ghost btn-sm btn-circle"
        onclick={() => weatherStore.refresh()}
        disabled={$weatherStore.refreshing || $weatherStore.loading}
        aria-label="天気を更新"
        title="天気を更新"
      >
        {#if $weatherStore.refreshing}
          <span class="loading loading-spinner loading-xs"></span>
        {:else}
          <!-- 更新アイコン（↺） -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        {/if}
      </button>

      <!-- テーマ切替ボタン -->
      <button
        class="btn btn-ghost btn-sm btn-circle"
        onclick={toggleTheme}
        aria-label="テーマを切り替える"
        title={currentTheme === 'sora-light' ? 'ダークモードに切替' : 'ライトモードに切替'}
      >
        {#if currentTheme === 'sora-light'}
          <!-- 月アイコン（ダークに切替） -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        {:else}
          <!-- 太陽アイコン（ライトに切替） -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1"  x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1"  y1="12" x2="3"  y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"></line>
            <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"></line>
          </svg>
        {/if}
      </button>
    </div>
  </header>

  <!-- メインコンテンツ -->
  <main class="flex-1 p-4 flex flex-col gap-4 max-w-lg mx-auto w-full">

    <!-- エラーバナー -->
    {#if $weatherStore.error}
      <div class="alert alert-error shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-sm">{$weatherStore.error}</span>
        <button class="btn btn-ghost btn-xs" onclick={() => weatherStore.clearError()}>✕</button>
      </div>
    {/if}

    <!-- ローディング -->
    {#if $weatherStore.loading}
      <div class="flex flex-col items-center justify-center gap-3 py-16">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-sm text-base-content/60">天気データを取得中...</p>
      </div>

    <!-- 天気データ表示 -->
    {:else if $weatherStore.weatherData}
      <!-- 最終更新時刻 -->
      {#if $weatherStore.lastUpdated}
        <p class="text-xs text-base-content/40 text-right">
          更新: {new Date($weatherStore.lastUpdated).toLocaleString('ja-JP')}
          {#if $weatherStore.usingCache}（キャッシュ）{/if}
        </p>
      {/if}

      <!-- 今日の天気カード -->
      <WeatherCard
        weather={$weatherStore.weatherData.current}
        area={$selectedArea}
      />

      <!-- 7日間予報 -->
      {#if $weatherStore.weatherData.dailyForecasts.length > 0}
        <section>
          <h3 class="text-sm font-semibold text-base-content/60 mb-2">週間予報</h3>
          <ForecastStrip forecasts={$weatherStore.weatherData.dailyForecasts} />
        </section>
      {/if}

    <!-- 初期化前（まれに表示） -->
    {:else if !$weatherStore.initialized}
      <div class="flex items-center justify-center py-16">
        <span class="loading loading-dots loading-md text-primary"></span>
      </div>
    {/if}

  </main>

</div>
