type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy'

/**
 * Open-Meteo WMO weather code mapping
 * @see https://open-meteo.com/en/docs#weathervariables
 */
function wmoToCondition(code: number): WeatherCondition {
  if (code === 0 || code === 1) return 'sunny'
  if (code <= 3) return 'cloudy'
  if (code >= 45 && code <= 48) return 'foggy'
  if (code >= 51 && code <= 67) return 'rainy'
  if (code >= 71 && code <= 77) return 'snowy'
  if (code >= 80 && code <= 82) return 'rainy'
  if (code >= 85 && code <= 86) return 'snowy'
  if (code >= 95) return 'stormy'
  return 'cloudy'
}

function wmoToDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'ciel dégagé',
    1: 'principalement dégagé',
    2: 'partiellement nuageux',
    3: 'couvert',
    45: 'brouillard',
    48: 'brouillard givrant',
    51: 'bruine légère',
    53: 'bruine modérée',
    55: 'bruine dense',
    61: 'pluie légère',
    63: 'pluie modérée',
    65: 'pluie forte',
    71: 'neige légère',
    73: 'neige modérée',
    75: 'neige forte',
    77: 'grains de neige',
    80: 'averses légères',
    81: 'averses modérées',
    82: 'averses violentes',
    85: 'averses de neige légères',
    86: 'averses de neige fortes',
    95: 'orage',
    96: 'orage avec grêle légère',
    99: 'orage avec grêle forte',
  }
  return descriptions[code] || 'conditions inconnues'
}

interface OpenMeteoCurrentResponse {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
  }
}

interface OpenMeteoForecastResponse {
  hourly: {
    time: string[]
    temperature_2m: number[]
    weather_code: number[]
    wind_speed_10m: number[]
  }
}

export async function fetchForecastFromAPI(lat: number, lng: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,weather_code,wind_speed_10m&forecast_hours=6&timezone=auto`

  const data = await $fetch<OpenMeteoForecastResponse>(url)

  return {
    available: true as const,
    entries: data.hourly.time.map((time, i) => {
      const date = new Date(time)
      const code = data.hourly.weather_code[i] ?? 0
      return {
        hour: `${date.getHours().toString().padStart(2, '0')}:00`,
        temperature: Math.round(data.hourly.temperature_2m[i] ?? 0),
        condition: wmoToCondition(code),
        description: wmoToDescription(code),
        wind_speed: data.hourly.wind_speed_10m[i] ?? 0,
      }
    }),
  }
}

export async function fetchWeatherFromAPI(lat: number, lng: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`

  const data = await $fetch<OpenMeteoCurrentResponse>(url)

  const code = data.current.weather_code ?? 0

  return {
    available: true as const,
    temperature: Math.round(data.current.temperature_2m),
    condition: wmoToCondition(code),
    description: wmoToDescription(code),
    icon: String(code),
    humidity: data.current.relative_humidity_2m,
    wind_speed: data.current.wind_speed_10m,
  }
}
