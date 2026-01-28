import { and, eq, gte, desc } from 'drizzle-orm'
import { users, walks } from '../../db/schema'

/**
 * GET /api/walks/streak - Get user's walking streak
 * Returns stored streak count and last 7 days activity
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const db = useDB()

  // Read stored streak from user
  const [user] = await db
    .select({ streak_count: users.streak_count, last_walk_date: users.last_walk_date })
    .from(users)
    .where(eq(users.id, session.user.id))

  // Validate stored streak is still current
  const today = formatDate(new Date())
  const yesterday = formatDate(new Date(Date.now() - 86400000))
  let streak = user?.streak_count ?? 0

  // If last walk date is older than yesterday, streak has expired
  if (user?.last_walk_date && user.last_walk_date !== today && user.last_walk_date !== yesterday) {
    streak = 0
  }

  // Last 7 days activity (lightweight query)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentWalks = await db
    .select({ started_at: walks.started_at })
    .from(walks)
    .where(
      and(
        eq(walks.user_id, session.user.id),
        eq(walks.status, 'completed'),
        gte(walks.started_at, sevenDaysAgo),
      ),
    )
    .orderBy(desc(walks.started_at))

  const walkDates = new Set<string>()
  for (const w of recentWalks) {
    walkDates.add(formatDate(new Date(w.started_at)))
  }

  const now = new Date()
  const last7Days: boolean[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    last7Days.push(walkDates.has(formatDate(d)))
  }

  return { streak, last7Days }
})

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
