<!--
  src/renderer/components/weather/WeatherCard.svelte

  今日の天気カード。
  エリア名・アイコン・気温・降水確率・風・波を表示する。
  担当: Claude Code（Phase 3 代替実装）
-->
<script lang="ts">
  import type { AreaOption, CurrentWeather } from '../../types/app'
  import WeatherIcon from '../icons/WeatherIcon.svelte'

  /** 表示する今日の天気データ */
  export let weather: CurrentWeather
  /** 選択中のエリア情報（null の場合はエリア名を非表示） */
  export let area: AreaOption | null

  /** 気温を表示文字列に変換する。null は「--」 */
  function formatTemp(value: number | null): string {
    return value !== null ? `${value}°` : '--'
  }

  /** ISO 日時文字列から「H時」形式を返す */
  function formatHour(iso: string): string {
    try {
      const d = new Date(iso)
      return `${d.getHours()}時`
    } catch {
      return iso
    }
  }
</script>

<div class="card bg-base-100 shadow-lg w-full">
  <div class="card-body gap-4">

    <!-- ヘッダー: エリア名 -->
    {#if area}
      <div class="flex items-center gap-2">
        <span class="text-sm text-base-content/60">{area.region}</span>
        <h2 class="card-title text-xl">{area.name}</h2>
      </div>
    {/if}

    <!-- メイン: アイコン + 天気説明 + 気温 -->
    <div class="flex items-center gap-6">
      <WeatherIcon icon={weather.icon} size={96} />

      <div class="flex flex-col gap-1">
        <!-- 天気説明文 -->
        <p class="text-lg font-medium">
          {weather.description ?? '天気情報なし'}
        </p>

        <!-- 気温 -->
        <div class="flex items-baseline gap-3">
          <span class="text-3xl font-bold text-primary">
            {formatTemp(weather.temperature.max)}
          </span>
          <span class="text-lg text-base-content/60">
            {formatTemp(weather.temperature.min)}
          </span>
        </div>
      </div>
    </div>

    <!-- 降水確率バー -->
    {#if weather.precipitationChances.length > 0}
      <div>
        <p class="text-xs text-base-content/50 mb-1">降水確率</p>
        <div class="flex gap-2">
          {#each weather.precipitationChances as chance}
            <div class="flex flex-col items-center gap-1 flex-1">
              <!-- バー -->
              <div class="w-full bg-base-200 rounded-full h-16 flex flex-col-reverse overflow-hidden">
                <div
                  class="w-full bg-primary/70 rounded-full transition-all"
                  style="height: {chance.percentage ?? 0}%"
                ></div>
              </div>
              <!-- 降水確率値 -->
              <span class="text-xs font-medium">
                {chance.percentage !== null ? `${chance.percentage}%` : '--'}
              </span>
              <!-- 時刻 -->
              <span class="text-xs text-base-content/50">
                {formatHour(chance.dateTime)}
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- 風・波（null の場合は非表示） -->
    {#if weather.wind || weather.wave}
      <div class="flex gap-4 text-sm text-base-content/70 border-t border-base-200 pt-3">
        {#if weather.wind}
          <span>💨 {weather.wind}</span>
        {/if}
        {#if weather.wave}
          <span>🌊 {weather.wave}</span>
        {/if}
      </div>
    {/if}

  </div>
</div>
