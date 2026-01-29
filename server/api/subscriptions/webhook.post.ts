import type Stripe from 'stripe'
import StripeLib from 'stripe'
import { sql } from 'drizzle-orm'

const cryptoProvider = StripeLib.createSubtleCryptoProvider()

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = useStripe()

  // On Cloudflare Workers, read body from the native web Request
  // to ensure we get the exact raw bytes Stripe signed
  let body: string
  const webRequest = event.web?.request || (event.node?.req as unknown as { body?: ReadableStream })
  if (event.web?.request) {
    body = await event.web.request.text()
  } else {
    const raw = await readRawBody(event)
    if (!raw) {
      throw createError({ statusCode: 400, statusMessage: 'Empty body' })
    }
    body = raw
  }

  if (!body) {
    throw createError({ statusCode: 400, statusMessage: 'Empty body' })
  }

  const signature = getHeader(event, 'stripe-signature')
  if (!signature) {
    throw createError({ statusCode: 400, statusMessage: 'Missing stripe-signature header' })
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      config.stripeWebhookSecret,
      undefined,
      cryptoProvider,
    )
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook verify failed:', message, 'body length:', body.length, 'sig:', signature.substring(0, 30))
    throw createError({ statusCode: 400, statusMessage: 'Invalid signature' })
  }

  const db = useDB()

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

  return { received: true }
})
