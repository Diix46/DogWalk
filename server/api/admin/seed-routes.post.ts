import { routes } from '../../db/schema'
import { sampleRoutes } from '../../db/seed-routes'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  try {
    // Check if routes table has data
    const existingRoutes = await useDB()
      .select({ count: sql<number>`count(*)` })
      .from(routes)

    const count = existingRoutes[0]?.count ?? 0

    if (count > 0) {
      return { message: `Routes table already has ${count} entries`, seeded: false }
    }

    // Batch insert all routes at once for better performance
    const now = new Date().toISOString()
    const routesToInsert = sampleRoutes.map(route => ({
      id: crypto.randomUUID(),
      name: route.name,
      description: route.description,
      duration_minutes: route.duration_minutes,
      distance_meters: route.distance_meters,
      difficulty: route.difficulty,
      type: route.type,
      is_premium: route.is_premium,
      is_active: true,
      geojson_path: route.geojson_path,
      center_lat: route.center_lat,
      center_lng: route.center_lng,
      created_at: now,
      updated_at: now,
    }))

    await useDB().insert(routes).values(routesToInsert)

    return { message: `Inserted ${sampleRoutes.length} routes`, seeded: true }
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw createError({
      statusCode: 500,
      statusMessage: `Seed error: ${errorMessage}`,
    })
  }
})
