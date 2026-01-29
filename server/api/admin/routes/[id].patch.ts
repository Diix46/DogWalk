import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const routeId = getRouterParam(event, 'id')
  if (!routeId) throw createError({ statusCode: 400, statusMessage: 'id requis' })

  const body = await readBody(event)
  const db = useDB()

  if (body.is_active !== undefined) {
    await db.run(sql`UPDATE routes SET is_active = ${body.is_active ? 1 : 0} WHERE id = ${routeId}`)
  }
  if (body.is_premium !== undefined) {
    await db.run(sql`UPDATE routes SET is_premium = ${body.is_premium ? 1 : 0} WHERE id = ${routeId}`)
  }

  if (body.is_active === undefined && body.is_premium === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'Aucun champ à modifier' })
  }

  return { updated: true }
})
