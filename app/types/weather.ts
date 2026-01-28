export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy'

export interface WeatherData {
  available: boolean
  temperature?: number
  condition?: WeatherCondition
  description?: string
  icon?: string
  humidity?: number
  wind_speed?: number
  message?: string
}

export interface ForecastEntry {
  hour: string
  temperature: number
  condition: WeatherCondition
  description: string
}

export interface ForecastData {
  available: boolean
  entries: ForecastEntry[]
  message?: string
}
