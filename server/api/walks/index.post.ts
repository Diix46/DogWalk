import { z } from 'zod'
import { sql, eq, and } from 'drizzle-orm'
import { walks, routes } from '../../db/schema'

const createWalkSchema = z.object({
  route_id: z.string().min(1, 'ID de parcours requis'),
})

/**
 * POST /api/walks - Start a new walk
 * Creates a new walk session in 'active' status
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const body = await readBody(event)
  const result = createWalkSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message || 'Données invalides',
    })
  }

  const { route_id } = result.data
  const db = useDB()

  // Verify route exists and is active
  const [route] = await db
    .select()
    .from(routes)
    .where(and(eq(routes.id, route_id), eq(routes.is_active, true)))

  if (!route) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Parcours non trouvé',
    })
  }

  try {
    const now = new Date()

    const [newWalk] = await db
      .insert(walks)
      .values({
        user_id: session.user.id,
        route_id,
        started_at: now,
        distance_meters: 0,
        duration_seconds: 0,
        status: 'active',
        created_at: now,
      })
      .returning()

    return newWalk
  }
  catch (error) {
    console.error('Walk creation error:', error instanceof Error ? error.message : String(error))
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur serveur',
    })
  }
})
