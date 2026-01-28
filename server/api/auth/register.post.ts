import { z } from 'zod'
import { users } from '../../db/schema'
import { hashPassword } from '../../utils/password'

// Stricter email validation with TLD requirement (fixes M2)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const registerSchema = z.object({
  email: z.string()
    .email('Email invalide')
    .refine(val => emailRegex.test(val), 'Email invalide (domaine requis)'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  name: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate input
  const result = registerSchema.safeParse(body)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    throw createError({
      statusCode: 400,
      statusMessage: firstIssue?.message ?? 'Données invalides',
    })
  }

  const { email, password, name } = result.data

  // Normalize email to prevent case-sensitive duplicates (fixes H1)
  const normalizedEmail = email.toLowerCase().trim()

  // Hash password before insert
  const passwordHash = hashPassword(password)

  // Insert with race-condition safe duplicate handling (fixes H2)
  // Instead of check-then-insert, we try to insert and catch UNIQUE constraint error
  try {
    const [newUser] = await db.insert(users).values({
      email: normalizedEmail,
      password_hash: passwordHash,
      name: name || null,
    }).returning()

    // Create session (nuxt-auth-utils)
    await setUserSession(event, {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    })

    // Return user data (without password_hash)
    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    }
  }
  catch (error: unknown) {
    // Handle UNIQUE constraint violation (email already exists)
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('UNIQUE constraint failed') || errorMessage.includes('unique')) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Cet email est déjà utilisé',
      })
    }
    // Re-throw unexpected errors
    throw error
  }
})
