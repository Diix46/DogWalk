<script setup lang="ts">
import type { ForecastEntry, WeatherCondition } from '~/types/weather'

/**
 * WeatherAlert Component (Story 8.3)
 *
 * Displays a severity-colored alert based on forecast during walk duration.
 * Green = favorable, Orange = moderate, Red = adverse conditions.
 */

interface Props {
  /** Forecast entries within walk duration */
  entries: ForecastEntry[]
  /** Walk duration in minutes */
  durationMinutes: number
}

const props = defineProps<Props>()

type Severity = 'green' | 'orange' | 'red'

const adverseConditions: WeatherCondition[] = ['rainy', 'stormy', 'snowy']
const moderateConditions: WeatherCondition[] = ['foggy']

const severity = computed<Severity>(() => {
  const hoursNeeded = Math.ceil(props.durationMinutes / 60)
  const relevant = props.entries.slice(0, Math.max(hoursNeeded, 1))

  if (relevant.some(e => adverseConditions.includes(e.condition))) return 'red'
  if (relevant.some(e => moderateConditions.includes(e.condition))) return 'orange'
  if (relevant.some(e => e.wind_speed && e.wind_speed > 30)) return 'orange'
  return 'green'
})

const alertConfig = computed(() => {
  switch (severity.value) {
    case 'red':
      return {
        icon: 'i-heroicons-exclamation-triangle',
        color: 'error' as const,
        message: 'Conditions défavorables prévues pendant votre balade',
      }
    case 'orange':
      return {
        icon: 'i-heroicons-exclamation-circle',
        color: 'warning' as const,
        message: 'Conditions moyennes — restez vigilant',
      }
    default:
      return {
        icon: 'i-heroicons-check-circle',
        color: 'success' as const,
        message: 'Conditions favorables pour la balade',
      }
  }
})
</script>

<template>
  <UAlert
    :icon="alertConfig.icon"
    :color="alertConfig.color"
    :title="alertConfig.message"
    variant="subtle"
  />
</template>
