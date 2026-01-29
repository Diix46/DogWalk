export function usePremium() {
  const { user } = useUserSession()

  const isPremium = computed(() => {
    const u = user.value as { is_premium?: boolean } | null
    return u?.is_premium === true
  })

  return { isPremium }
}
