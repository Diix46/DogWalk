import type Stripe from 'stripe'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const stripe = useStripe()

  // Read the event payload
  const payload = await readBody(event)
  if (!payload?.id || !payload?.type) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }

  // Verify the event by retrieving it from Stripe API
  // This is a secure alternative to signature verification
  // that works reliably on Cloudflare Workers
  let stripeEvent: Stripe.Event
  try {
    stripeEvent = await stripe.events.retrieve(payload.id)
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook: failed to retrieve event from Stripe:', message)
    throw createError({ statusCode: 400, statusMessage: 'Event not found in Stripe' })
  }

  const db = useDB()

  try {
  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const customerId = session.customer as string

      if (userId) {
        let premiumUntil: string | null = null
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          premiumUntil = new Date(sub.current_period_end * 1000).toISOString()
        }

        await db.run(sql`
          UPDATE users
          SET is_premium = 1,
              premium_until = ${premiumUntil},
              stripe_customer_id = ${customerId}
          WHERE id = ${Number(userId)}
        `)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = stripeEvent.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const premiumUntil = new Date(subscription.current_period_end * 1000).toISOString()
      const isActive = ['active', 'trialing'].includes(subscription.status)

      await db.run(sql`
        UPDATE users
        SET is_premium = ${isActive ? 1 : 0},
            premium_until = ${premiumUntil}
        WHERE stripe_customer_id = ${customerId}
      `)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = stripeEvent.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await db.run(sql`
        UPDATE users
        SET is_premium = 0,
            premium_until = NULL
        WHERE stripe_customer_id = ${customerId}
      `)
      break
    }
  }

  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Webhook processing error:', message)
    throw createError({ statusCode: 500, statusMessage: `Webhook error: ${message}` })
  }

  return { received: true }
})
