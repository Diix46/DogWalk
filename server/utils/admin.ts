import type { H3Event } from 'h3'

export async function requireAdmin(event: H3Event) {
  const session = await requireUserSession(event)
  const user = session.user as { id: number; is_admin?: boolean }
  if (!user.is_admin) {
    throw createError({ statusCode: 403, statusMessage: 'Accès administrateur requis' })
  }
  return session
}
