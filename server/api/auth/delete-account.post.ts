import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = (session.user as { id: number }).id

  const db = useDB()

  // Delete user — CASCADE will handle walks, reviews, dogs
  await db.delete(users).where(eq(users.id, userId))

  // Clear session
  await clearUserSession(event)

  return { success: true }
})
