import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { walks } from '../../db/schema'

// Max size for geojson_track (500KB should be plenty for a long walk)
const MAX_GEOJSON_SIZE = 500 * 1024

const updateWalkSchema = z.object({
  finished_at: z.number().optional(),
  distance_meters: z.number().min(0).optional(),
  duration_seconds: z.number().min(0).optional(),
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
  geojson_track: z.string().max(MAX_GEOJSON_SIZE, 'Track trop volumineux').optional(),
})

/**
 * PATCH /api/walks/[id] - Update a walk
 * Used to finish or cancel a walk, update distance/duration, and save GPS track
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

  const body = await readBody(event)
  const result = updateWalkSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message || 'Données invalides',
    })
  }

  const db = useDB()

  // Verify walk exists and belongs to user
  const [existingWalk] = await db
    .select()
    .from(walks)
    .where(and(eq(walks.id, Number(id)), eq(walks.user_id, session.user.id)))

  if (!existingWalk) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Balade non trouvée',
    })
  }

  const { finished_at, distance_meters, duration_seconds, status, geojson_track } = result.data

  // Build update object with only provided fields
  const updateData: Partial<{
    finished_at: Date | null
    distance_meters: number
    duration_seconds: number
    status: 'active' | 'completed' | 'cancelled'
    geojson_track: string | null
  }> = {}

  if (finished_at !== undefined) {
    updateData.finished_at = new Date(finished_at * 1000)
  }
  if (distance_meters !== undefined) {
    updateData.distance_meters = distance_meters
  }
  if (duration_seconds !== undefined) {
    updateData.duration_seconds = duration_seconds
  }
  if (status !== undefined) {
    updateData.status = status
  }
  if (geojson_track !== undefined) {
    // Validate geojson_track is valid JSON
    try {
      const parsed = JSON.parse(geojson_track)
      if (parsed.type !== 'Feature' || !parsed.geometry) {
        throw new Error('Invalid GeoJSON')
      }
    }
    catch {
      throw createError({
        statusCode: 400,
        statusMessage: 'Format GeoJSON invalide',
      })
    }
    updateData.geojson_track = geojson_track
  }

  if (Object.keys(updateData).length === 0) {
    return existingWalk
  }

  try {
    const [updatedWalk] = await db
      .update(walks)
      .set(updateData)
      .where(and(eq(walks.id, Number(id)), eq(walks.user_id, session.user.id)))
      .returning()

    return updatedWalk
  }
  catch (error) {
    console.error('Walk update error:', error instanceof Error ? error.message : String(error))
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur serveur',
    })
  }
})
