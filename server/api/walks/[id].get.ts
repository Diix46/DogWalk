import { and, eq } from 'drizzle-orm'
import { walks } from '../../db/schema'

/**
 * GET /api/walks/[id] - Get a single walk
 * Returns the walk if it belongs to the authenticated user
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de balade invalide',
    })
  }

  const db = useDB()
  const [walk] = await db
    .select()
    .from(walks)
    .where(and(eq(walks.id, Number(id)), eq(walks.user_id, session.user.id)))

  if (!walk) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Balade non trouvée',
    })
  }

  return walk
})
