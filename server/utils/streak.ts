import { eq } from 'drizzle-orm'
import { users } from '../db/schema'

/**
 * Update a user's streak after completing a walk.
 * - If last_walk_date is today: no change (already counted)
 * - If last_walk_date is yesterday: increment streak
 * - If last_walk_date is older or null: reset streak to 1
 */
export async function updateUserStreak(userId: number) {
  const db = useDB()

  const [user] = await db
    .select({ streak_count: users.streak_count, last_walk_date: users.last_walk_date })
    .from(users)
    .where(eq(users.id, userId))

  if (!user) return

  const today = formatDateStr(new Date())
  const yesterday = formatDateStr(new Date(Date.now() - 86400000))

  let newStreak: number
  if (user.last_walk_date === today) {
    // Already walked today, no change
    return
  }
  else if (user.last_walk_date === yesterday) {
    newStreak = user.streak_count + 1
  }
  else {
    newStreak = 1
  }

  await db
    .update(users)
    .set({
      streak_count: newStreak,
      last_walk_date: today,
      updated_at: new Date(),
    })
    .where(eq(users.id, userId))
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
