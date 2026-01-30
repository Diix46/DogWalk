export default defineNuxtRouteMiddleware(async () => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value || !(user.value as { is_admin?: boolean } | null)?.is_admin) {
    return navigateTo('/explore')
  }
})
