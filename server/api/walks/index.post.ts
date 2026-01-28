import { z } from 'zod'
import { sql } from 'drizzle-orm'
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
    .where(sql`id = ${route_id} AND is_active = 1`)

  if (!route) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Parcours non trouvé',
    })
  }

  try {
    const now = Math.floor(Date.now() / 1000)

    const insertResult = await db.run(sql`
      INSERT INTO walks (user_id, route_id, started_at, distance_meters, duration_seconds, status, created_at)
      VALUES (${session.user.id}, ${route_id}, ${now}, 0, 0, 'active', ${now})
    `)

    // Fetch the created walk
    const [newWalk] = await db
      .select()
      .from(walks)
      .where(sql`id = ${insertResult.lastInsertRowid}`)

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
