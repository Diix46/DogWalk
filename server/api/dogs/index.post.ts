import { z } from 'zod'
import { sql } from 'drizzle-orm'
import { dogs } from '../../db/schema'

const createDogSchema = z.object({
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

  const body = await readBody(event)
  const result = createDogSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message || 'Données invalides',
    })
  }

  const { name, breed, birth_date } = result.data
  const now = Math.floor(Date.now() / 1000)

  try {
    // Use raw SQL to avoid Drizzle inserting null for id
    const insertResult = await useDB().run(sql`
      INSERT INTO dogs (user_id, name, breed, birth_date, created_at, updated_at)
      VALUES (${session.user.id}, ${name}, ${breed || null}, ${birth_date || null}, ${now}, ${now})
    `)

    // Fetch the created dog
    const [newDog] = await useDB()
      .select()
      .from(dogs)
      .where(sql`id = ${insertResult.lastInsertRowid}`)

    return newDog
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Dog creation error:', errorMessage, 'user_id:', session.user.id)
    throw createError({
      statusCode: 500,
      statusMessage: `Erreur création chien: ${errorMessage}`,
    })
  }
})
