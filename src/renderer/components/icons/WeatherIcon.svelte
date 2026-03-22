<!--
  src/renderer/components/icons/WeatherIcon.svelte

  WeatherIconKey → 各SVGアイコンへのルーティングラッパー。
  Gemini・Codex のコンポーネントはこれを経由してアイコンを表示する。
  担当: Claude Code（Phase 3 代替実装）
-->
<script lang="ts">
  import type { WeatherIconKey } from '../../types/app'
  import SunnyIcon   from './SunnyIcon.svelte'
  import CloudyIcon  from './CloudyIcon.svelte'
  import RainyIcon   from './RainyIcon.svelte'
  import SnowyIcon   from './SnowyIcon.svelte'
  import UnknownIcon from './UnknownIcon.svelte'

  /** 表示するアイコンキー */
  export let icon: WeatherIconKey = 'unknown'
  /** アイコンのピクセルサイズ */
  export let size: number = 64
  /** アニメーション有効化フラグ（v1 では false） */
  export let animated: boolean = false

  /** アイコンキーを5種類のコンポーネントにマップする */
  type IconComponent = typeof SunnyIcon | typeof CloudyIcon | typeof RainyIcon | typeof SnowyIcon | typeof UnknownIcon
  const ICON_MAP: Record<WeatherIconKey, IconComponent> = {
    'sunny':        SunnyIcon,
    'sunny-cloudy': SunnyIcon,
    'sunny-rainy':  SunnyIcon,
    'sunny-snowy':  SunnyIcon,
    'cloudy':       CloudyIcon,
    'cloudy-sunny': CloudyIcon,
    'cloudy-rainy': RainyIcon,
    'cloudy-snowy': SnowyIcon,
    'rainy':        RainyIcon,
    'rainy-sunny':  RainyIcon,
    'rainy-snowy':  RainyIcon,
    'snowy':        SnowyIcon,
    'snowy-sunny':  SnowyIcon,
    'unknown':      UnknownIcon,
  }

  $: IconComponent = ICON_MAP[icon] ?? UnknownIcon
</script>

<svelte:component this={IconComponent} {size} {animated} />
