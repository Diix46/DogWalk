import { eq, and } from 'drizzle-orm'
import { dogs } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID invalide',
    })
  }

  const [dog] = await useDB()
    .select()
    .from(dogs)
    .where(and(eq(dogs.id, Number(id)), eq(dogs.user_id, session.user.id)))

  if (!dog) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Chien non trouvé',
    })
  }

  return dog
})
