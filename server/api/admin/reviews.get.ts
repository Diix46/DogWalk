import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()

  const reviews = await db.all(sql`
    SELECT r.id, r.rating, r.comment, r.created_at,
           rt.name as route_name, rt.id as route_id,
           u.name as user_name, u.email as user_email
    FROM reviews r
    JOIN routes rt ON rt.id = r.route_id
    JOIN users u ON u.id = r.user_id
    ORDER BY r.created_at DESC
    LIMIT 200
  `)

  return reviews
})
