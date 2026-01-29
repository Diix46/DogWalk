import type Stripe from 'stripe'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = useStripe()

  // Read raw body as Buffer for Stripe signature verification
  // On Cloudflare Workers, readRawBody may return string - ensure it works
  const rawBody = await readRawBody(event, false)
  if (!rawBody) {
    console.error('Webhook: empty body received')
    throw createError({ statusCode: 400, statusMessage: 'Empty body' })
  }

  // Convert to string if Buffer
  const body = typeof rawBody === 'string' ? rawBody : new TextDecoder().decode(rawBody)

  const signature = getHeader(event, 'stripe-signature')
  if (!signature) {
    console.error('Webhook: missing stripe-signature header')
    throw createError({ statusCode: 400, statusMessage: 'Missing stripe-signature header' })
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      config.stripeWebhookSecret,
    )
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    throw createError({ statusCode: 400, statusMessage: 'Invalid signature' })
  }

  console.log('Webhook received event:', stripeEvent.type)

  const db = useDB()

  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const customerId = session.customer as string

      console.log('Checkout completed for user:', userId, 'customer:', customerId)

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
        console.log('User', userId, 'upgraded to premium until', premiumUntil)
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

  return { received: true }
})
