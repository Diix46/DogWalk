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

  return {
    weather,
    isLoading,
    error,
    fetchWeather,
    forecast,
    forecastLoading,
    fetchForecast,
  }
}
