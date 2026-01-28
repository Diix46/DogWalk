import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { routes } from '../../db/schema'
import type { DifficultyLevel } from '~/types/route'

/**
 * GET /api/routes
 *
 * Fetch routes with optional duration filtering, relevance sorting, and location-based sorting.
 *
 * Query params:
 * - duration_min: Minimum duration in minutes
 * - duration_max: Maximum duration in minutes
 * - target: Target duration for relevance sorting (closest match first)
 * - type: Filter by route type (urban, nature, mixed)
 * - lat, lng: User coordinates for distance sorting and distance_from_user calculation
 *
 * @see Story 3.5: Recherche par Temps Disponible
 * @see Story 3.6: Recherche par Localisation
 * @see NFR-P3: Response < 1 second
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters for accuracy on Earth's surface
 */
function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Parse query parameters
  const durationMin = query.duration_min ? Number(query.duration_min) : undefined
  const durationMax = query.duration_max ? Number(query.duration_max) : undefined
  const targetDuration = query.target ? Number(query.target) : undefined
  const type = query.type as string | undefined
  const lat = query.lat ? Number(query.lat) : undefined
  const lng = query.lng ? Number(query.lng) : undefined

  // Validate numeric params
  if (durationMin !== undefined && (isNaN(durationMin) || durationMin < 0)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid duration_min parameter',
    })
  }
  if (durationMax !== undefined && (isNaN(durationMax) || durationMax < 0)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid duration_max parameter',
    })
  }
  if (targetDuration !== undefined && (isNaN(targetDuration) || targetDuration < 0)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid target parameter',
    })
  }
  // Validate lat/lng params (Story 3.6)
  if (lat !== undefined && (isNaN(lat) || lat < -90 || lat > 90)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid lat parameter (must be between -90 and 90)',
    })
  }
  if (lng !== undefined && (isNaN(lng) || lng < -180 || lng > 180)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid lng parameter (must be between -180 and 180)',
    })
  }

  const db = useDB()

  // Build where conditions - only active routes
  const conditions = [eq(routes.is_active, true)]

  if (durationMin !== undefined) {
    conditions.push(gte(routes.duration_minutes, durationMin))
  }
  if (durationMax !== undefined) {
    conditions.push(lte(routes.duration_minutes, durationMax))
  }
  if (type && ['urban', 'nature', 'mixed'].includes(type)) {
    conditions.push(eq(routes.type, type as 'urban' | 'nature' | 'mixed'))
  }

  // Build query with conditions
  let dbQuery = db.select().from(routes).where(and(...conditions)).$dynamic()

  // Sort by relevance if target duration provided
  if (targetDuration !== undefined && !isNaN(targetDuration)) {
    dbQuery = dbQuery.orderBy(
      sql`ABS(${routes.duration_minutes} - ${targetDuration})`
    )
  }

  let results = await dbQuery

  // Calculate distance and sort by proximity if coordinates provided (Story 3.6)
  const hasUserLocation = lat !== undefined && lng !== undefined

  if (hasUserLocation) {
    // Define type for route with distance
    type RouteWithDistance = typeof routes.$inferSelect & { distance_from_user: number }

    // Add distance_from_user to each result and sort by distance
    const resultsWithDistance: RouteWithDistance[] = results.map((route: typeof routes.$inferSelect) => ({
      ...route,
      distance_from_user: calculateHaversineDistance(
        lat,
        lng,
        route.center_lat,
        route.center_lng
      ),
    }))

    // Sort by distance (closest first)
    resultsWithDistance.sort((a: RouteWithDistance, b: RouteWithDistance) => a.distance_from_user - b.distance_from_user)

    // Map to frontend types with distance
    return resultsWithDistance.map((route: RouteWithDistance) => mapRouteToFrontend(route, route.distance_from_user))
  }

  // Map database values to frontend types (no distance)
  return results.map((route: typeof routes.$inferSelect) => mapRouteToFrontend(route))
})

/**
 * Map database difficulty values to frontend types
 * DB: 'easy' | 'medium' | 'hard'
 * Frontend: 'easy' | 'moderate' | 'difficult'
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
 * @param dbRoute - The database route record
 * @param distanceFromUser - Optional distance from user in meters (Story 3.6)
 */
function mapRouteToFrontend(
  dbRoute: typeof routes.$inferSelect,
  distanceFromUser?: number
) {
  const result: Record<string, unknown> = {
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
  }

  // Only include distance_from_user when location was provided (Story 3.6)
  if (distanceFromUser !== undefined) {
    result.distance_from_user = Math.round(distanceFromUser) // Round to nearest meter
  }

  return result
}
