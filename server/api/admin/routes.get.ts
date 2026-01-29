import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()

  const result = await db.all(sql`
    SELECT r.*,
           (SELECT COUNT(*) FROM walks w WHERE w.route_id = r.id) as walk_count,
           (SELECT AVG(rv.rating) FROM reviews rv WHERE rv.route_id = r.id) as avg_rating,
           (SELECT COUNT(*) FROM reviews rv WHERE rv.route_id = r.id) as review_count
    FROM routes r
    ORDER BY r.name
  `)

  return result
})
