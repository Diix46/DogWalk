export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  return {
    hasStripeSecret: !!config.stripeSecretKey,
    hasWebhookSecret: !!config.stripeWebhookSecret,
    webhookSecretLength: config.stripeWebhookSecret?.length || 0,
    webhookSecretPrefix: config.stripeWebhookSecret?.substring(0, 8) || 'EMPTY',
  }
})
