import { sql } from 'drizzle-orm'

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_ATTEMPTS = 5

/**
 * D1-based distributed rate limiter.
 * Uses the rate_limits table to persist attempts across deploys.
 * Falls back to allowing requests if D1 query fails.
 */
export async function checkRateLimitD1(ip: string): Promise<boolean> {
  try {
    const db = useDB()
    const now = Date.now()
    const windowStart = now - WINDOW_MS

    // Clean expired entries
    await db.run(sql`DELETE FROM rate_limits WHERE expires_at < ${now}`)

    // Count recent attempts
    const result = await db.get<{ cnt: number }>(
      sql`SELECT COUNT(*) as cnt FROM rate_limits WHERE ip = ${ip} AND created_at > ${windowStart}`,
    )

    if ((result?.cnt ?? 0) >= MAX_ATTEMPTS) {
      return false
    }

    // Record this attempt
    await db.run(
      sql`INSERT INTO rate_limits (ip, created_at, expires_at) VALUES (${ip}, ${now}, ${now + WINDOW_MS})`,
    )

    return true
  }
  catch {
    // If D1 fails (table doesn't exist yet, etc.), allow the request
    return true
  }
}
