import { z } from 'zod'
import { users } from '../../db/schema'
import { checkPassword } from '../../utils/password'
import { eq } from 'drizzle-orm'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

// H1 FIX: Dummy hash for timing attack prevention
// Format matches real hashes: 32-char salt + ':' + 64-char hash
const DUMMY_HASH = '0'.repeat(32) + ':' + '0'.repeat(64)

// H2 FIX: Simple rate limiter (in-memory for dev)
// NOTE: For production on Cloudflare, use Cloudflare Rate Limiting rules
// or implement with KV/D1 for distributed rate limiting
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 5

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = loginAttempts.get(ip)

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false
  }

  record.count++
  return true
}

export default defineEventHandler(async (event) => {
  // H2 FIX: Rate limiting check
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  if (!checkRateLimit(ip)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Trop de tentatives. Réessaie dans une minute.',
    })
  }

  const body = await readBody(event)

  // Validate input
  const result = loginSchema.safeParse(body)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    throw createError({
      statusCode: 400,
      statusMessage: firstIssue?.message ?? 'Données invalides',
    })
  }

  const { email, password } = result.data

  // Normalize email to prevent case-sensitive issues
  const normalizedEmail = email.toLowerCase().trim()

  // Find user by email
  const db = useDB()
  const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail))

  // H1 FIX: Always perform password verification to prevent timing attacks
  // Even if user doesn't exist, we verify against a dummy hash
  // This ensures consistent response time regardless of user existence
  const hashToVerify = user?.password_hash ?? DUMMY_HASH
  const isValid = await checkPassword(password, hashToVerify)

  // SECURITY: Check both conditions - user must exist AND password must be valid
  // Same error message for both cases prevents email enumeration
  if (!user || !isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Email ou mot de passe incorrect',
    })
  }

  // Create session (nuxt-auth-utils)
  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      is_premium: Boolean(user.is_premium),
    },
  })

  // Return user data (without password_hash)
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    is_premium: Boolean(user.is_premium),
  }
})
