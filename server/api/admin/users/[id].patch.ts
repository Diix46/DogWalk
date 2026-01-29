import { z } from 'zod'
import { users } from '../../../db/schema'
import { createPasswordHash } from '../../../utils/password'
import { eq } from 'drizzle-orm'

const resetSchema = z.object({
  newPassword: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const userId = Number(getRouterParam(event, 'id'))
  if (!userId || isNaN(userId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID utilisateur invalide' })
  }

  const body = await readBody(event)
  const result = resetSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? 'Données invalides' })
  }

  const db = useDB()
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId))
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Utilisateur introuvable' })
  }

  const passwordHash = await createPasswordHash(result.data.newPassword)
  await db.update(users).set({ password_hash: passwordHash, updated_at: new Date() }).where(eq(users.id, userId))

  return { success: true }
})
