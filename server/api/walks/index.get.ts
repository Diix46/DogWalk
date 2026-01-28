import { eq, desc } from 'drizzle-orm'
import { walks } from '../../db/schema'

/**
 * GET /api/walks - List user's walks
 * Returns all walks for the authenticated user, ordered by most recent first
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const db = useDB()
  const userWalks = await db
    .select()
    .from(walks)
    .where(eq(walks.user_id, session.user.id))
    .orderBy(desc(walks.started_at))

  return userWalks
})
