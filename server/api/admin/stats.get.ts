import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()

  const [userStats] = await db.all(sql`
    SELECT COUNT(*) as total_users,
           SUM(CASE WHEN is_premium = 1 THEN 1 ELSE 0 END) as premium_users
    FROM users
  `) as Array<{ total_users: number; premium_users: number }>

  const [walkStats] = await db.all(sql`
    SELECT COUNT(*) as total_walks,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_walks,
           SUM(distance_meters) as total_distance,
           SUM(duration_seconds) as total_duration
    FROM walks
  `) as Array<{ total_walks: number; completed_walks: number; total_distance: number; total_duration: number }>

  const [routeStats] = await db.all(sql`
    SELECT COUNT(*) as total_routes,
           SUM(CASE WHEN is_premium = 1 THEN 1 ELSE 0 END) as premium_routes
    FROM routes WHERE is_active = 1
  `) as Array<{ total_routes: number; premium_routes: number }>

  const [reviewStats] = await db.all(sql`
    SELECT COUNT(*) as total_reviews, AVG(rating) as avg_rating
    FROM reviews
  `) as Array<{ total_reviews: number; avg_rating: number }>

  return {
    users: { total: userStats.total_users, premium: userStats.premium_users },
    walks: {
      total: walkStats.total_walks,
      completed: walkStats.completed_walks,
      totalDistance: walkStats.total_distance || 0,
      totalDuration: walkStats.total_duration || 0,
    },
    routes: { total: routeStats.total_routes, premium: routeStats.premium_routes },
    reviews: { total: reviewStats.total_reviews, avgRating: Math.round((reviewStats.avg_rating || 0) * 10) / 10 },
  }
})
