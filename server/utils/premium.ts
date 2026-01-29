import { sql } from 'drizzle-orm'
import { users } from '../db/schema'

/**
 * Check if a user has active premium subscription
 */
export async function isUserPremium(userId: number): Promise<boolean> {
  const [user] = await useDB()
    .select({ is_premium: users.is_premium, premium_until: users.premium_until })
    .from(users)
    .where(sql`id = ${userId}`)
    .limit(1)

  if (!user?.is_premium) return false

  // Check expiry if set
  if (user.premium_until) {
    return new Date(user.premium_until) > new Date()
  }

  return true
}
