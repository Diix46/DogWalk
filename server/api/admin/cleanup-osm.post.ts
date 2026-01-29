import { eq, and, sql } from 'drizzle-orm'
import { routes } from '../../db/schema'

/**
 * POST /api/admin/cleanup-osm
 *
 * Clean up OSM-generated routes that have no activity (no walks, no reviews)
 * and were generated more than 30 days ago.
 *
 * @see Story 9.6
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const db = useDB()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Find OSM routes older than 30 days
  const oldOsmRoutes = await db
    .select({ id: routes.id })
    .from(routes)
    .where(and(
      eq(routes.source, 'osm'),
      sql`${routes.generated_at} < ${thirtyDaysAgo}`,
    ))

  if (oldOsmRoutes.length === 0) {
    return { deleted: 0, message: 'No old OSM routes to clean up' }
  }

  const routeIds = oldOsmRoutes.map(r => r.id)

  // Filter out routes that have walks or reviews
  const routesWithActivity = await db.all(sql`
    SELECT DISTINCT route_id FROM (
      SELECT route_id FROM walks WHERE route_id IN (${sql.join(routeIds.map(id => sql`${id}`), sql`,`)})
      UNION
      SELECT route_id FROM reviews WHERE route_id IN (${sql.join(routeIds.map(id => sql`${id}`), sql`,`)})
    )
  `) as Array<{ route_id: string }>

  const activeRouteIds = new Set(routesWithActivity.map(r => r.route_id))
  const toDelete = routeIds.filter(id => !activeRouteIds.has(id))

  // Delete inactive routes
  let deleted = 0
  for (const id of toDelete) {
    await db.delete(routes).where(eq(routes.id, id))
    deleted++
  }

  return {
    deleted,
    kept: routeIds.length - deleted,
    message: `Cleaned up ${deleted} inactive OSM routes, kept ${routeIds.length - deleted} with activity`,
  }
})
