<script setup lang="ts">
import type { WeatherData, WeatherCondition, ForecastData } from '~/types/weather'

/**
 * WeatherBadge Component
 *
 * Contextual weather display badge following Direction B styling.
 * Shows weather icon + temperature with condition-based coloring.
 * On click, shows forecast modal with hourly predictions.
 *
 * @see Story 5.2: Composant WeatherBadge
 * @see Story 5.5: Prévisions Météo
 */

interface Props {
  /** Weather data from useWeather composable */
  weather: WeatherData | null
  /** Display variant: compact (icon only) or full (icon + text) */
  variant?: 'compact' | 'full'
  /** Latitude for forecast fetching (optional) */
  lat?: number
  /** Longitude for forecast fetching (optional) */
  lng?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'full',
  lat: undefined,
  lng: undefined,
})

const showDetails = ref(false)
const forecast = ref<ForecastData | null>(null)
const forecastLoading = ref(false)

/** Weather condition to emoji icon mapping */
const CONDITION_ICONS: Record<WeatherCondition, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  stormy: '⛈️',
  snowy: '❄️',
  foggy: '🌫️',
}

/** Weather condition to color class mapping (Direction B) */
const CONDITION_COLORS: Record<WeatherCondition, string> = {
  sunny: 'bg-green-100 text-green-800',
  cloudy: 'bg-neutral-100 text-neutral-700',
  rainy: 'bg-amber-100 text-amber-800',
  stormy: 'bg-red-100 text-red-800',
  snowy: 'bg-sky-100 text-sky-800',
  foggy: 'bg-neutral-100 text-neutral-600',
}

const isAvailable = computed(() => props.weather?.available === true)

const conditionIcon = computed(() => {
  if (!isAvailable.value || !props.weather?.condition) return '☁️'
  return CONDITION_ICONS[props.weather.condition] || '☁️'
})

const colorClass = computed(() => {
  if (!isAvailable.value || !props.weather?.condition) return 'bg-neutral-100 text-neutral-500'
  return CONDITION_COLORS[props.weather.condition] || 'bg-neutral-100 text-neutral-700'
})

async function toggleDetails() {
  if (!isAvailable.value) return

  showDetails.value = !showDetails.value

  // Fetch forecast on first open if lat/lng available
  if (showDetails.value && !forecast.value && props.lat !== undefined && props.lng !== undefined) {
    forecastLoading.value = true
    try {
      const data = await $fetch<ForecastData>('/api/weather/forecast', {
        query: { lat: props.lat, lng: props.lng },
      })
      forecast.value = data
    }
    catch {
      forecast.value = { available: false, entries: [], message: 'Prévisions indisponibles' }
    }
    finally {
      forecastLoading.value = false
    }
  }
}
</script>

<template>
  <div class="relative inline-block">
    <!-- Badge -->
    <button
      type="button"
      :class="[
        'inline-flex items-center gap-1.5 rounded-lg font-medium transition-all duration-200',
        'min-h-[44px] min-w-[44px] justify-center',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        colorClass,
        variant === 'compact' ? 'px-2 py-2 text-base' : 'px-3 py-2 text-xs',
      ]"
      :aria-label="
        isAvailable && weather?.temperature !== undefined
          ? `Météo : ${weather.description || weather.condition}, ${weather.temperature}°C`
          : 'Météo indisponible'
      "
      @click="toggleDetails"
    >
      <span class="text-base" aria-hidden="true">{{ conditionIcon }}</span>

      <template v-if="variant === 'full'">
        <template v-if="isAvailable && weather?.temperature !== undefined">
          <span class="font-semibold">{{ weather.temperature }}°C</span>
        </template>
        <template v-else>
          <span class="text-neutral-400">N/A</span>
        </template>
      </template>
    </button>

    <!-- Expanded Details + Forecast Popover -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-1"
    >
      <div
        v-if="showDetails && isAvailable && weather"
        class="
          absolute top-full left-0 mt-2 z-50
          bg-white rounded-xl shadow-lg border border-neutral-200
          p-4 min-w-[240px]
        "
      >
        <!-- Current Weather -->
        <p v-if="weather.description" class="text-sm font-medium text-neutral-900 capitalize mb-3">
          {{ weather.description }}
        </p>

        <div class="flex flex-col gap-2 text-sm text-neutral-600 mb-4">
          <div class="flex items-center justify-between">
            <span>Température</span>
            <span class="font-semibold text-neutral-900">{{ weather.temperature }}°C</span>
          </div>
          <div v-if="weather.humidity !== undefined" class="flex items-center justify-between">
            <span>Humidité</span>
            <span class="font-semibold text-neutral-900">{{ weather.humidity }}%</span>
          </div>
          <div v-if="weather.wind_speed !== undefined" class="flex items-center justify-between">
            <span>Vent</span>
            <span class="font-semibold text-neutral-900">{{ weather.wind_speed }} m/s</span>
          </div>
        </div>

        <!-- Forecast Section (Story 5.5) -->
        <div v-if="lat !== undefined && lng !== undefined" class="border-t border-neutral-100 pt-3">
          <WeatherForecast :forecast="forecast" :loading="forecastLoading" />
        </div>
      </div>
    </Transition>
  </div>
</template>
