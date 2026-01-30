import { z } from 'zod'
import { users } from '../../db/schema'
import { createPasswordHash } from '../../utils/password'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const registerSchema = z.object({
  username: z.string()
    .min(3, 'Le username doit contenir au moins 3 caractères')
    .max(30, 'Le username ne doit pas dépasser 30 caractères')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Le username ne peut contenir que des lettres, chiffres, _ et -'),
  email: z.string()
    .email('Email invalide')
    .refine(val => emailRegex.test(val), 'Email invalide (domaine requis)'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = registerSchema.safeParse(body)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    throw createError({
      statusCode: 400,
      statusMessage: firstIssue?.message ?? 'Données invalides',
    })
  }

  const { username, email, password } = result.data
  const normalizedEmail = email.toLowerCase().trim()
  const normalizedUsername = username.trim()

  const passwordHash = await createPasswordHash(password)

  try {
    const db = useDB()
    const [newUser] = await db.insert(users).values({
      email: normalizedEmail,
      username: normalizedUsername,
      password_hash: passwordHash,
    }).returning()

    // No auto-login — return success, client redirects to /login
    return {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
    }
  }
  catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (
      errorMessage.includes('UNIQUE constraint failed')
      || errorMessage.includes('unique')
      || errorMessage.includes('UNIQUE')
      || errorMessage.includes('already exists')
      || errorMessage.includes('duplicate')
    ) {
      // Determine which field caused the conflict
      if (errorMessage.includes('username') || errorMessage.includes('idx_users_username')) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Ce username est déjà pris',
        })
      }
      throw createError({
        statusCode: 409,
        statusMessage: 'Cet email est déjà utilisé',
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la création du compte',
    })
  }
})
