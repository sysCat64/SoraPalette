<!--
  src/renderer/components/weather/ForecastStrip.svelte

  7日間予報の横並び表示。
  各日のアイコン・日付・降水確率・最高/最低気温を表示する。
  担当: Claude Code（Phase 3 代替実装）
-->
<script lang="ts">
  import type { DailyForecast } from '../../types/app'
  import WeatherIcon from '../icons/WeatherIcon.svelte'

  /** 表示する週間予報データ */
  export let forecasts: DailyForecast[]

  /** ISO 日付文字列を「M/D (曜)」形式に変換する */
  function formatDate(iso: string): string {
    try {
      const d = new Date(iso)
      const month = d.getMonth() + 1
      const day   = d.getDate()
      const week  = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
      return `${month}/${day} (${week})`
    } catch {
      return iso
    }
  }

  /** 気温を表示文字列に変換する。null は「--」 */
  function formatTemp(value: number | null): string {
    return value !== null ? `${value}°` : '--'
  }
</script>

<div class="w-full overflow-x-auto">
  <div class="flex gap-2 min-w-max pb-1">
    {#each forecasts as day}
      <div class="flex flex-col items-center gap-1 p-3 rounded-xl bg-base-100 shadow-sm min-w-[72px]">

        <!-- 日付 -->
        <span class="text-xs text-base-content/60 whitespace-nowrap">
          {formatDate(day.date)}
        </span>

        <!-- 天気アイコン -->
        <WeatherIcon icon={day.icon} size={32} />

        <!-- 降水確率 -->
        <span class="text-xs font-medium text-primary">
          {day.precipitationChance !== null ? `${day.precipitationChance}%` : '--'}
        </span>

        <!-- 最高/最低気温 -->
        <div class="flex gap-1 text-xs">
          <span class="font-bold">{formatTemp(day.temperature.max)}</span>
          <span class="text-base-content/50">{formatTemp(day.temperature.min)}</span>
        </div>

      </div>
    {/each}
  </div>
</div>
