import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()

  const users = await db.all(sql`
    SELECT u.id, u.email, u.name, u.is_premium, u.is_admin, u.streak_count, u.created_at,
           (SELECT COUNT(*) FROM walks w WHERE w.user_id = u.id AND w.status = 'completed') as walk_count
    FROM users u
    ORDER BY u.created_at DESC
  `)

  return users
})
