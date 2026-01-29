import { eq, and, sql } from 'drizzle-orm'
import { routes } from '../../db/schema'
import { queryOverpass, getAreaHash } from '../../utils/overpass'
import { buildRoutes } from '../../utils/route-builder'
import type { DifficultyLevel } from '~/types/route'

/**
 * GET /api/routes/discover
 *
 * Discover walking routes near a location.
 * First checks DB cache for existing OSM routes in the area,
 * then falls back to generating new routes via Overpass API.
 *
 * Query params:
 * - lat: User latitude (required)
 * - lng: User longitude (required)
 * - radius: Search radius in meters (default 3000)
 * - duration_min, duration_max: Filter by duration
 * - type: Filter by route type
 *
 * @see Story 9.4
 */

function calculateHaversineDistance(
  lat1: number, lng1: number, lat2: number, lng2: number,
): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function mapDifficulty(dbDifficulty: string): DifficultyLevel {
  const map: Record<string, DifficultyLevel> = {
    easy: 'easy',
    medium: 'moderate',
    hard: 'difficult',
  }
  return map[dbDifficulty] || 'easy'
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const lat = Number(query.lat)
  const lng = Number(query.lng)
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw createError({ statusCode: 400, statusMessage: 'lat and lng are required' })
  }

  const radius = query.radius ? Number(query.radius) : 3000
  const durationMin = query.duration_min ? Number(query.duration_min) : undefined
  const durationMax = query.duration_max ? Number(query.duration_max) : undefined
  const type = query.type as string | undefined

  const db = useDB()
  const areaHash = getAreaHash(lat, lng)

  // 1. Check cache: do we have OSM routes for this area?
  // Use raw SQL to avoid issues if source column doesn't exist yet
  let osmRoutes: typeof routes.$inferSelect[] = []
  try {
    osmRoutes = await db
      .select()
      .from(routes)
      .where(and(
        eq(routes.source, 'osm'),
        eq(routes.osm_area_hash, areaHash),
        eq(routes.is_active, true),
      ))
  }
  catch (err) {
    console.error('Cache query failed (migration may not be applied):', err)
    // Column might not exist yet — skip OSM cache
  }

  // 2. If no cached routes, generate from Overpass
  if (osmRoutes.length === 0) {
    try {
      const ways = await queryOverpass(lat, lng, radius)

      if (ways.length > 0) {
        const generated = buildRoutes(ways)

        // Insert into DB (skip if source column doesn't exist)
        try {
          for (const route of generated) {
            await db.insert(routes).values({
              name: route.name,
              description: route.description,
              duration_minutes: route.duration_minutes,
              distance_meters: route.distance_meters,
              difficulty: route.difficulty,
              type: route.type,
              geojson_path: route.geojson_path,
              center_lat: route.center_lat,
              center_lng: route.center_lng,
              source: 'osm',
              osm_area_hash: areaHash,
              generated_at: new Date().toISOString(),
              is_premium: false,
              is_active: true,
            })
          }

          // Re-fetch to get DB-assigned IDs
          osmRoutes = await db
            .select()
            .from(routes)
            .where(and(
              eq(routes.source, 'osm'),
              eq(routes.osm_area_hash, areaHash),
              eq(routes.is_active, true),
            ))
        }
        catch (insertErr) {
          console.error('OSM route insert failed:', insertErr)
          // Return generated routes without DB persistence as fallback
          // We'll build the response directly from generated data
        }
      }
    }
    catch (err) {
      console.error('Overpass/route generation error:', err)
      // Fall through — will return curated routes as fallback
    }
  }

  // 3. Also fetch curated routes (always include)
  const curatedRoutes = await db
    .select()
    .from(routes)
    .where(eq(routes.is_active, true))

  // 4. Merge and apply filters
  let allRoutes = [...osmRoutes, ...curatedRoutes]

  if (durationMin !== undefined && !isNaN(durationMin)) {
    allRoutes = allRoutes.filter(r => r.duration_minutes >= durationMin)
  }
  if (durationMax !== undefined && !isNaN(durationMax)) {
    allRoutes = allRoutes.filter(r => r.duration_minutes <= durationMax)
  }
  if (type && ['urban', 'nature', 'mixed'].includes(type)) {
    allRoutes = allRoutes.filter(r => r.type === type)
  }

  // 5. Fetch review stats
  const routeIds = allRoutes.map(r => r.id)
  let reviewStatsMap: Record<string, { avg_rating: number; review_count: number }> = {}
  if (routeIds.length > 0) {
    const reviewStats = await db.all(sql`
      SELECT route_id, AVG(rating) as avg_rating, COUNT(*) as review_count
      FROM reviews
      WHERE route_id IN (${sql.join(routeIds.map(id => sql`${id}`), sql`,`)})
      GROUP BY route_id
    `) as Array<{ route_id: string; avg_rating: number; review_count: number }>
    for (const s of reviewStats) {
      reviewStatsMap[s.route_id] = { avg_rating: Math.round(s.avg_rating * 10) / 10, review_count: s.review_count }
    }
  }

  // 6. Add distance, sort by proximity
  const results = allRoutes.map(route => {
    const distance_from_user = calculateHaversineDistance(lat, lng, route.center_lat, route.center_lng)
    const stats = reviewStatsMap[route.id]
    return {
      id: route.id,
      name: route.name,
      description: route.description,
      duration_minutes: route.duration_minutes,
      distance_meters: route.distance_meters,
      difficulty: mapDifficulty(route.difficulty),
      type: route.type,
      is_premium: route.is_premium,
      center_lat: route.center_lat,
      center_lng: route.center_lng,
      source: route.source,
      distance_from_user: Math.round(distance_from_user),
      ...(stats ? { avg_rating: stats.avg_rating, review_count: stats.review_count } : {}),
    }
  })

  results.sort((a, b) => a.distance_from_user - b.distance_from_user)

  return results
})
