import { sql } from 'drizzle-orm'
import { users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const config = useRuntimeConfig()
  const stripe = useStripe()

  const appUrl = config.public.appUrl || getRequestURL(event).origin

  // Get or create Stripe customer
  const [user] = await useDB()
    .select({ stripe_customer_id: users.stripe_customer_id, email: users.email })
    .from(users)
    .where(sql`id = ${session.user.id}`)
    .limit(1)

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Utilisateur introuvable' })
  }

  let customerId = user.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: String(session.user.id) },
    })
    customerId = customer.id

    await useDB().run(
      sql`UPDATE users SET stripe_customer_id = ${customerId} WHERE id = ${session.user.id}`,
    )
  }

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'DogWalk Premium',
            description: 'Accès illimité aux parcours exclusifs',
          },
          unit_amount: 999, // 9.99€
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/premium?success=true`,
    cancel_url: `${appUrl}/premium?cancelled=true`,
    metadata: { user_id: String(session.user.id) },
  })

  return { url: checkoutSession.url }
})
