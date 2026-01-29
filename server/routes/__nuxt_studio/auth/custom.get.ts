export default defineEventHandler(async (event) => {
  // Require DogWalk admin session
  const { user } = await requireUserSession(event)

  if (!user.is_admin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Accès réservé aux administrateurs',
    })
  }

  // Create Studio session using admin's identity
  // setStudioUserSession is auto-imported by nuxt-studio module
  await setStudioUserSession(event, {
    name: user.name || user.email,
    email: user.email,
  })

  // Redirect to Studio
  return sendRedirect(event, '/_studio')
})
