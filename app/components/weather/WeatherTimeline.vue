<script setup lang="ts">
import type { ForecastEntry, WeatherCondition } from '~/types/weather'

/**
 * WeatherTimeline Component (Story 8.2)
 *
 * Displays hourly forecast over the walk duration as a horizontal timeline.
 */

interface Props {
  /** Forecast entries */
  entries: ForecastEntry[]
  /** Walk duration in minutes — only show entries within this window */
  durationMinutes: number
  /** Loading state */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const conditionIcons: Record<WeatherCondition, string> = {
  sunny: 'i-heroicons-sun',
  cloudy: 'i-heroicons-cloud',
  rainy: 'i-heroicons-cloud-arrow-down',
  stormy: 'i-heroicons-bolt',
  snowy: 'i-heroicons-sparkles',
  foggy: 'i-heroicons-eye-slash',
}

const conditionColors: Record<WeatherCondition, string> = {
  sunny: 'text-yellow-500',
  cloudy: 'text-neutral-400',
  rainy: 'text-blue-500',
  stormy: 'text-red-500',
  snowy: 'text-blue-300',
  foggy: 'text-neutral-300',
}

/** Filter entries to only show those within walk duration */
const visibleEntries = computed(() => {
  // Show entries covering the walk duration (each entry = ~1h)
  const hoursNeeded = Math.ceil(props.durationMinutes / 60)
  return props.entries.slice(0, Math.max(hoursNeeded, 1))
})
</script>

<template>
  <div class="space-y-2">
    <h4 class="text-sm font-medium text-neutral-700">
      Météo pendant votre balade
    </h4>

    <!-- Loading -->
    <div v-if="loading" class="flex gap-3">
      <div v-for="i in 3" :key="i" class="flex flex-col items-center gap-1">
        <div class="w-8 h-8 rounded-full bg-neutral-100 animate-pulse" />
        <div class="w-10 h-3 rounded bg-neutral-100 animate-pulse" />
      </div>
    </div>

    <!-- Timeline -->
    <div v-else-if="visibleEntries.length > 0" class="flex gap-4 overflow-x-auto pb-1">
      <div
        v-for="(entry, idx) in visibleEntries"
        :key="idx"
        class="flex flex-col items-center gap-1 min-w-[3.5rem]"
      >
        <UIcon
          :name="conditionIcons[entry.condition] || 'i-heroicons-cloud'"
          :class="['w-7 h-7', conditionColors[entry.condition] || 'text-neutral-400']"
        />
        <span class="text-xs font-semibold text-neutral-800">{{ Math.round(entry.temperature) }}°</span>
        <span class="text-[10px] text-neutral-500">{{ entry.hour }}</span>
      </div>
    </div>

    <!-- No data -->
    <p v-else class="text-xs text-neutral-400">
      Prévisions indisponibles
    </p>
  </div>
</template>
