import { eq, and } from 'drizzle-orm'
import { routes } from '../../db/schema'
import type { DifficultyLevel } from '~/types/route'

/**
 * GET /api/routes/[id]
 *
 * Fetch a single route by ID.
 *
 * @see Story 3.8: Page Détails Parcours
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing route ID',
    })
  }

  const db = useDB()

  const route = await db
    .select()
    .from(routes)
    .where(and(eq(routes.id, id), eq(routes.is_active, true)))
    .get()

  if (!route) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Route not found',
    })
  }

  return mapRouteToFrontend(route)
})

/**
 * Map database difficulty values to frontend types
 */
function mapDifficulty(dbDifficulty: string): DifficultyLevel {
  const map: Record<string, DifficultyLevel> = {
    easy: 'easy',
    medium: 'moderate',
    hard: 'difficult',
  }
  return map[dbDifficulty] || 'easy'
}

/**
 * Map database route to frontend Route type
 */
function mapRouteToFrontend(dbRoute: typeof routes.$inferSelect) {
  return {
    id: dbRoute.id,
    name: dbRoute.name,
    description: dbRoute.description,
    duration_minutes: dbRoute.duration_minutes,
    distance_meters: dbRoute.distance_meters,
    difficulty: mapDifficulty(dbRoute.difficulty),
    type: dbRoute.type,
    is_premium: dbRoute.is_premium,
    center_lat: dbRoute.center_lat,
    center_lng: dbRoute.center_lng,
    geojson_path: dbRoute.geojson_path,
  }
}
