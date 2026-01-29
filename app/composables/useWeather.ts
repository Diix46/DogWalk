import type { WeatherData, ForecastData } from '~/types/weather'

export function useWeather() {
  const weather = ref<WeatherData | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const forecast = ref<ForecastData | null>(null)
  const forecastLoading = ref(false)

  async function fetchWeather(lat: number, lng: number) {
    isLoading.value = true
    error.value = null

    try {
      const data = await $fetch<WeatherData>('/api/weather', {
        query: { lat, lng },
      })
      weather.value = data
    }
    catch (err) {
      console.error('Weather fetch error:', err)
      error.value = 'Météo indisponible'
      weather.value = { available: false, message: 'Météo indisponible' }
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchForecast(lat: number, lng: number) {
    forecastLoading.value = true

    try {
      const data = await $fetch<ForecastData>('/api/weather/forecast', {
        query: { lat, lng },
      })
      forecast.value = data
    }
    catch (err) {
      console.error('Forecast fetch error:', err)
      forecast.value = { available: false, entries: [], message: 'Prévisions indisponibles' }
    }
    finally {
      forecastLoading.value = false
    }
  }

  // Polling for live weather during walks (Story 8.4)
  let pollingInterval: ReturnType<typeof setInterval> | null = null
  const previousCondition = ref<string | null>(null)
  const weatherDegraded = ref(false)

  const adverseConditions = ['rainy', 'stormy', 'snowy']

  function startWeatherPolling(lat: number, lng: number, intervalMs = 15 * 60 * 1000) {
    stopWeatherPolling()
    // Capture initial condition
    if (weather.value?.condition) {
      previousCondition.value = weather.value.condition
    }
    pollingInterval = setInterval(async () => {
      const prevCond = weather.value?.condition ?? null
      await fetchWeather(lat, lng)
      const newCond = weather.value?.condition ?? null
      if (prevCond && newCond && prevCond !== newCond && adverseConditions.includes(newCond)) {
        weatherDegraded.value = true
      }
    }, intervalMs)
  }

  function stopWeatherPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
    weatherDegraded.value = false
  }

  return {
    weather,
    isLoading,
    error,
    fetchWeather,
    forecast,
    forecastLoading,
    fetchForecast,
    startWeatherPolling,
    stopWeatherPolling,
    weatherDegraded,
  }
}
