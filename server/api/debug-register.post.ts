export default defineEventHandler(async (event) => {
  const steps: string[] = []
  try {
    steps.push('1-start')
    const body = await readBody(event)
    steps.push('2-body: ' + JSON.stringify(body))

    const { createPasswordHash } = await import('../utils/password')
    steps.push('3-import-ok')

    const hash = await createPasswordHash(body.password || 'test')
    steps.push('4-hash: ' + hash.substring(0, 20) + '...')

    const { users } = await import('../db/schema')
    steps.push('5-schema-ok')

    steps.push('6-db-type: ' + typeof db)

    const allUsers = await db.select().from(users).all()
    steps.push('7-users-count: ' + allUsers.length)

    return { ok: true, steps }
  }
  catch (err: any) {
    return {
      ok: false,
      steps,
      error: err?.message || String(err),
      stack: err?.stack?.split('\n').slice(0, 5),
    }
  }
})
