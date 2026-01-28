import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { dogs } from '../../db/schema'

const updateDogSchema = z.object({
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  breed: z.string()
    .max(100, 'La race ne peut pas dépasser 100 caractères')
    .optional(),
  birth_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (AAAA-MM-JJ)')
    .optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID invalide',
    })
  }

  const body = await readBody(event)
  const result = updateDogSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message || 'Données invalides',
    })
  }

  const { name, breed, birth_date } = result.data

  const [existingDog] = await useDB()
    .select()
    .from(dogs)
    .where(and(eq(dogs.id, Number(id)), eq(dogs.user_id, session.user.id)))

  if (!existingDog) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Chien non trouvé',
    })
  }

  const [updatedDog] = await useDB()
    .update(dogs)
    .set({
      name,
      breed: breed || null,
      birth_date: birth_date || null,
      updated_at: new Date(),
    })
    .where(eq(dogs.id, Number(id)))
    .returning()

  return updatedDog
})
