import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = (session.user as { id: number }).id

  const db = useDB()

  const reviews = await db.all(sql`
    SELECT r.id, r.rating, r.comment, r.created_at,
           rt.name as route_name, rt.id as route_id
    FROM reviews r
    JOIN routes rt ON rt.id = r.route_id
    WHERE r.user_id = ${userId}
    ORDER BY r.created_at DESC
    LIMIT 100
  `)

  return reviews
})
