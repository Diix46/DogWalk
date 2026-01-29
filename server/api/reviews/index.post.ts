import { z } from 'zod'
import { sql } from 'drizzle-orm'
import { reviews } from '../../db/schema'

const reviewSchema = z.object({
  route_id: z.string().min(1, 'route_id requis'),
  walk_id: z.number().optional(),
  rating: z.number().int().min(1).max(5, 'Rating entre 1 et 5'),
  comment: z.string().max(1000).optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = (session.user as { id: number }).id

  const body = await readBody(event)
  const result = reviewSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? 'Données invalides' })
  }

  const { route_id, walk_id, rating, comment } = result.data

  const db = useDB()

  // Check user hasn't already reviewed this route
  const existing = await db.select().from(reviews)
    .where(sql`user_id = ${userId} AND route_id = ${route_id}`)
    .limit(1)

  if (existing.length > 0) {
    // Update existing review
    await db.run(sql`
      UPDATE reviews SET rating = ${rating}, comment = ${comment || null}, walk_id = ${walk_id || null}
      WHERE user_id = ${userId} AND route_id = ${route_id}
    `)
    return { updated: true }
  }

  await db.insert(reviews).values({
    user_id: userId,
    route_id,
    walk_id: walk_id || null,
    rating,
    comment: comment || null,
  })

  return { created: true }
})
