import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function useStripe(): Stripe {
  if (!_stripe) {
    const config = useRuntimeConfig()
    if (!config.stripeSecretKey) {
      throw new Error('NUXT_STRIPE_SECRET_KEY not configured')
    }
    _stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: '2025-04-30.basil',
    })
  }
  return _stripe
}
