<!--
  src/renderer/App.svelte

  アプリのルートコンポーネント（Phase 3 本実装）。
  weatherStore を使って天気データを取得・表示する。
  テーマ切替・エリア選択・手動更新機能を含む。

  担当: Claude Code（Phase 3 代替実装）
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { get } from 'svelte/store'
  import { weatherStore } from './stores/weatherStore'
  import WeatherCard   from './components/weather/WeatherCard.svelte'
  import ForecastStrip from './components/weather/ForecastStrip.svelte'
  import type { ThemeId } from '../preload/types'

  // weatherStore の derived Readable を個別に参照する
  const { selectedArea, favoriteAreas } = weatherStore

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

  // ---- お気に入り ----
  async function toggleFavorite(): Promise<void> {
    const { selectedAreaCode, favoriteAreaCodes } = get(weatherStore)
    if (favoriteAreaCodes.includes(selectedAreaCode)) {
      await weatherStore.removeFavoriteArea(selectedAreaCode)
    } else {
      await weatherStore.addFavoriteArea(selectedAreaCode)
    }
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

    <!-- エリア選択 + お気に入りボタン -->
    <div class="navbar-center flex-1 max-w-xs flex gap-1">
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

      <!-- お気に入り登録/解除ボタン -->
      <button
        class="btn btn-ghost btn-sm btn-circle"
        onclick={toggleFavorite}
        disabled={$weatherStore.loading}
        aria-label={$weatherStore.favoriteAreaCodes.includes($weatherStore.selectedAreaCode)
          ? 'お気に入りから削除'
          : 'お気に入りに追加'}
        title={$weatherStore.favoriteAreaCodes.includes($weatherStore.selectedAreaCode)
          ? 'お気に入りから削除'
          : 'お気に入りに追加'}
      >
        {#if $weatherStore.favoriteAreaCodes.includes($weatherStore.selectedAreaCode)}
          <!-- 登録済み: 塗りつぶし星 -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="currentColor" class="text-warning">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        {:else}
          <!-- 未登録: 輪郭星 -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        {/if}
      </button>
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

  <!-- お気に入りストリップ（登録済みエリアのクイックアクセス） -->
  {#if $favoriteAreas.length > 0}
    <div class="bg-base-100 border-b border-base-300 px-4 py-2 flex gap-2 flex-wrap">
      {#each $favoriteAreas as area}
        <button
          class="btn btn-xs {$weatherStore.selectedAreaCode === area.code ? 'btn-primary' : 'btn-ghost'}"
          onclick={() => weatherStore.selectArea(area.code)}
        >
          ★ {area.name}
        </button>
      {/each}
    </div>
  {/if}

  <!-- メインコンテンツ -->
  <main class="flex-1 p-4 flex flex-col gap-4 max-w-lg mx-auto w-full">

    <!-- 気象警報バナー（発表中の警報・注意報があるときのみ表示） -->
    {#if $weatherStore.warning.severity !== 'none'}
      <div class="alert {$weatherStore.warning.severity === 'warning' ? 'alert-error' : 'alert-warning'} shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p class="font-semibold text-sm">
            {$weatherStore.warning.severity === 'warning' ? '気象警報' : '気象注意報'}
          </p>
          <p class="text-xs">{$weatherStore.warning.kinds.join('・')}</p>
        </div>
      </div>
    {/if}

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

      <!-- 天気概況テキスト -->
      {#if $weatherStore.forecastText?.body}
        <section class="card bg-base-100 shadow-sm w-full">
          <div class="card-body gap-2 py-3">
            <h3 class="text-sm font-semibold text-base-content/60">天気概況</h3>
            {#if $weatherStore.forecastText.headline}
              <p class="text-sm font-medium">{$weatherStore.forecastText.headline}</p>
            {/if}
            <p class="text-xs text-base-content/70 whitespace-pre-line leading-relaxed">
              {$weatherStore.forecastText.body}
            </p>
          </div>
        </section>
      {/if}

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
