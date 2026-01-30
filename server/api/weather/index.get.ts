import { z } from 'zod'

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
})

export default defineCachedEventHandler(async (event) => {
  const query = getQuery(event)
  const result = querySchema.safeParse(query)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Paramètres lat/lng invalides ou manquants',
    })
  }

  const { lat, lng } = result.data

  try {
    const weather = await fetchWeatherFromAPI(lat, lng)
    return weather
  }
  catch (error) {
    console.error('Weather API error:', error instanceof Error ? error.message : String(error))
    return {
      available: false,
      message: 'Météo indisponible',
    }
  }
}, {
  maxAge: 60 * 60, // 1 hour (NFR22)
  getKey: (event) => {
    const query = getQuery(event)
    const lat = Number(query.lat || 0).toFixed(2)
    const lng = Number(query.lng || 0).toFixed(2)
    return `weather:${lat}:${lng}`
  },
})
