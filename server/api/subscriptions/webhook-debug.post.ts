export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const rawBody = await readRawBody(event, false)
  const rawBodyStr = await readRawBody(event, 'utf8')
  const signature = getHeader(event, 'stripe-signature')

  return {
    hasWebhookSecret: !!config.stripeWebhookSecret,
    webhookSecretPrefix: config.stripeWebhookSecret?.substring(0, 10) || 'EMPTY',
    hasSignature: !!signature,
    signaturePrefix: signature?.substring(0, 30) || 'NONE',
    rawBodyType: typeof rawBody,
    rawBodyIsNull: rawBody === null,
    rawBodyStrType: typeof rawBodyStr,
    rawBodyStrLen: rawBodyStr?.length || 0,
    rawBodyStrPrefix: rawBodyStr?.substring(0, 50) || 'EMPTY',
  }
})
