import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, statusMessage: 'id requis' })
  }

  const db = useDB()
  const result = await db.run(sql`DELETE FROM reviews WHERE id = ${Number(id)}`)

  if (!result.changes) {
    throw createError({ statusCode: 404, statusMessage: 'Avis introuvable' })
  }

  return { deleted: true }
})
