import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const routeId = getRouterParam(event, 'routeId')
  if (!routeId) {
    throw createError({ statusCode: 400, statusMessage: 'routeId requis' })
  }

  const db = useDB()

  const result = await db.all(sql`
    SELECT r.id, r.rating, r.comment, r.created_at,
           u.name as user_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.route_id = ${routeId}
    ORDER BY r.created_at DESC
    LIMIT 50
  `)

  // Also get aggregate stats
  const [stats] = await db.all(sql`
    SELECT COUNT(*) as count, AVG(rating) as avg_rating
    FROM reviews WHERE route_id = ${routeId}
  `)

  return {
    reviews: result,
    stats: {
      count: (stats as { count: number }).count || 0,
      avgRating: Math.round(((stats as { avg_rating: number }).avg_rating || 0) * 10) / 10,
    },
  }
})
