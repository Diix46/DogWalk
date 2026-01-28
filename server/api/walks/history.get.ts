import { eq, desc, and } from 'drizzle-orm'
import { walks, routes } from '../../db/schema'

/**
 * GET /api/walks/history - List user's completed walks with route name
 * Returns completed walks for the authenticated user, ordered by most recent first
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const db = useDB()
  const results = await db
    .select({
      id: walks.id,
      started_at: walks.started_at,
      finished_at: walks.finished_at,
      distance_meters: walks.distance_meters,
      duration_seconds: walks.duration_seconds,
      route_name: routes.name,
    })
    .from(walks)
    .innerJoin(routes, eq(walks.route_id, routes.id))
    .where(
      and(
        eq(walks.user_id, session.user.id),
        eq(walks.status, 'completed'),
      ),
    )
    .orderBy(desc(walks.started_at))

  return results
})
