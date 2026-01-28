export default defineEventHandler(async (event) => {
  const steps: string[] = []
  try {
    steps.push('1-start')
    const body = await readBody(event)
    const email = (body.email || 'debug@test.com').toLowerCase().trim()
    const password = body.password || 'testpass123'

    const { createPasswordHash } = await import('../utils/password')
    const passwordHash = await createPasswordHash(password)
    steps.push('2-hash-ok')

    const { users } = await import('../db/schema')

    // Test insert with .returning()
    const result = await db.insert(users).values({
      email: email + '-' + Date.now(),
      password_hash: passwordHash,
      name: null,
    }).returning()
    steps.push('3-insert-result: ' + JSON.stringify(result))

    const newUser = result[0]
    steps.push('4-user: ' + JSON.stringify(newUser))

    // Test setUserSession
    await setUserSession(event, {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    })
    steps.push('5-session-ok')

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
