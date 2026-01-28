import { and, eq, gte, sql } from 'drizzle-orm'
import { walks } from '../../db/schema'

/**
 * GET /api/walks/stats - Get user's walking statistics for current month
 * Returns total walks, distance, and duration for the current month
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const db = useDB()

  // Start of current month as timestamp
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [stats] = await db
    .select({
      totalWalks: sql<number>`count(*)`,
      totalDistance: sql<number>`coalesce(sum(${walks.distance_meters}), 0)`,
      totalDuration: sql<number>`coalesce(sum(${walks.duration_seconds}), 0)`,
    })
    .from(walks)
    .where(
      and(
        eq(walks.user_id, session.user.id),
        eq(walks.status, 'completed'),
        gte(walks.started_at, monthStart),
      ),
    )

  return {
    totalWalks: Number(stats?.totalWalks ?? 0),
    totalDistance: Number(stats?.totalDistance ?? 0),
    totalDuration: Number(stats?.totalDuration ?? 0),
  }
})
