import { sql } from 'drizzle-orm'
import { users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const config = useRuntimeConfig()
  const stripe = useStripe()

  const appUrl = config.public.appUrl || getRequestURL(event).origin

  const [user] = await useDB()
    .select({ stripe_customer_id: users.stripe_customer_id })
    .from(users)
    .where(sql`id = ${session.user.id}`)
    .limit(1)

  if (!user?.stripe_customer_id) {
    throw createError({ statusCode: 400, statusMessage: 'Aucun abonnement trouvé' })
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${appUrl}/profile`,
  })

  return { url: portalSession.url }
})
