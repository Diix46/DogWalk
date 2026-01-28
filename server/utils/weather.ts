type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy'

interface OpenWeatherResponse {
  weather: { id: number; main: string; description: string; icon: string }[]
  main: { temp: number; humidity: number }
  wind: { speed: number }
}

const CONDITION_MAP: Record<string, WeatherCondition> = {
  Clear: 'sunny',
  Clouds: 'cloudy',
  Rain: 'rainy',
  Drizzle: 'rainy',
  Thunderstorm: 'stormy',
  Snow: 'snowy',
  Mist: 'foggy',
  Fog: 'foggy',
  Haze: 'foggy',
  Smoke: 'foggy',
  Dust: 'foggy',
  Sand: 'foggy',
}

interface OpenWeatherForecastResponse {
  list: {
    dt: number
    main: { temp: number }
    weather: { id: number; main: string; description: string; icon: string }[]
  }[]
}

export async function fetchForecastFromAPI(lat: number, lng: number) {
  const apiKey = process.env.WEATHER_API_KEY || useRuntimeConfig().weatherApiKey
  if (!apiKey) {
    throw new Error('WEATHER_API_KEY not configured')
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=fr&cnt=6`

  const data = await $fetch<OpenWeatherForecastResponse>(url)

  return {
    available: true as const,
    entries: data.list.map((entry) => {
      const date = new Date(entry.dt * 1000)
      const mainCondition = entry.weather?.[0]?.main || 'Clear'
      return {
        hour: `${date.getHours().toString().padStart(2, '0')}:00`,
        temperature: Math.round(entry.main.temp),
        condition: CONDITION_MAP[mainCondition] || ('cloudy' as WeatherCondition),
        description: entry.weather?.[0]?.description || '',
      }
    }),
  }
}

export async function fetchWeatherFromAPI(lat: number, lng: number) {
  const apiKey = process.env.WEATHER_API_KEY || useRuntimeConfig().weatherApiKey
  if (!apiKey) {
    throw new Error('WEATHER_API_KEY not configured')
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=fr`

  const data = await $fetch<OpenWeatherResponse>(url)

  const mainCondition = data.weather?.[0]?.main || 'Clear'

  return {
    available: true as const,
    temperature: Math.round(data.main.temp),
    condition: CONDITION_MAP[mainCondition] || ('cloudy' as WeatherCondition),
    description: data.weather?.[0]?.description || '',
    icon: data.weather?.[0]?.icon || '01d',
    humidity: data.main.humidity,
    wind_speed: data.wind.speed,
  }
}
