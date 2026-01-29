import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = (session.user as { id: number }).id

  const db = useDB()

  const result = await db.get<{ count: number }>(sql`
    SELECT COUNT(*) as count FROM reviews WHERE user_id = ${userId}
  `)

  return result?.count ?? 0
})
