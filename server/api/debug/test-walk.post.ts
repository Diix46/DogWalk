import { eq, and } from 'drizzle-orm'
import { walks, routes } from '../../db/schema'

export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV === 'production') {
    // Allow temporarily for debugging
  }

  try {
    const session = await requireUserSession(event)
    const body = await readBody(event)

    const db = useDB()

    // Step 1: Check route
    const [route] = await db
      .select()
      .from(routes)
      .where(and(eq(routes.id, body.route_id), eq(routes.is_active, true)))

    if (!route) {
      return { error: 'Route not found', route_id: body.route_id }
    }

    // Step 2: Try insert
    const now = new Date()
    const [newWalk] = await db
      .insert(walks)
      .values({
        user_id: session.user.id,
        route_id: body.route_id,
        started_at: now,
        distance_meters: 0,
        duration_seconds: 0,
        status: 'active',
        created_at: now,
      })
      .returning()

    return { success: true, walk: newWalk, session_user: session.user }
  }
  catch (error) {
    return {
      error: true,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }
  }
})
