<script setup lang="ts">
import type { ForecastData, WeatherCondition } from '~/types/weather'

interface Props {
  forecast: ForecastData | null
  loading?: boolean
}

defineProps<Props>()

const CONDITION_ICONS: Record<WeatherCondition, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  stormy: '⛈️',
  snowy: '❄️',
  foggy: '🌫️',
}

/** Walking-friendliness score: higher = better for walking */
const CONDITION_SCORE: Record<WeatherCondition, number> = {
  sunny: 5,
  cloudy: 4,
  foggy: 3,
  rainy: 1,
  snowy: 1,
  stormy: 0,
}

function isBestWindow(index: number, forecast: ForecastData): boolean {
  if (!forecast.entries.length) return false
  let bestIdx = 0
  let bestScore = -1
  for (let i = 0; i < forecast.entries.length; i++) {
    const entry = forecast.entries[i]!
    const score = CONDITION_SCORE[entry.condition] ?? 2
    if (score > bestScore) {
      bestScore = score
      bestIdx = i
    }
  }
  return index === bestIdx
}
</script>

<template>
  <div class="space-y-3">
    <h3 class="text-sm font-semibold text-neutral-900">Prévisions</h3>

    <!-- Loading -->
    <div v-if="loading" class="flex gap-3 overflow-x-auto pb-2">
      <div
        v-for="i in 6"
        :key="i"
        class="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-neutral-100 animate-pulse min-w-[60px]"
      >
        <div class="w-8 h-3 bg-neutral-200 rounded" />
        <div class="w-6 h-6 bg-neutral-200 rounded-full" />
        <div class="w-6 h-3 bg-neutral-200 rounded" />
      </div>
    </div>

    <!-- Forecast entries -->
    <div v-else-if="forecast?.available && forecast.entries.length" class="flex gap-2 overflow-x-auto pb-2">
      <div
        v-for="(entry, idx) in forecast.entries"
        :key="idx"
        :class="[
          'flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[60px] transition-all',
          isBestWindow(idx, forecast)
            ? 'bg-green-100 ring-2 ring-green-400'
            : 'bg-neutral-50',
        ]"
      >
        <span class="text-xs text-neutral-500 font-medium">{{ entry.hour }}</span>
        <span class="text-lg">{{ CONDITION_ICONS[entry.condition] || '☁️' }}</span>
        <span class="text-xs font-semibold text-neutral-900">{{ entry.temperature }}°</span>
        <span
          v-if="isBestWindow(idx, forecast)"
          class="text-[10px] text-green-700 font-medium"
        >
          Idéal
        </span>
      </div>
    </div>

    <!-- Unavailable -->
    <p v-else class="text-xs text-neutral-400">Prévisions indisponibles</p>
  </div>
</template>
