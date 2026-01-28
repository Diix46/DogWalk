import { eq } from 'drizzle-orm'
import { dogs } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const userDogs = await useDB()
    .select()
    .from(dogs)
    .where(eq(dogs.user_id, session.user.id))

  return userDogs
})
