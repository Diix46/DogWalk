/**
 * Walk reminder via browser Notification API.
 * Shows a reminder when user opens the app and hasn't walked today.
 */
export function useWalkReminder() {
  const { loggedIn } = useUserSession()

  async function checkAndRemind() {
    if (!loggedIn.value) return
    if (!('Notification' in window)) return
    if (Notification.permission === 'denied') return

    // Check last walk date from streak endpoint
    try {
      const streak = await $fetch<{ lastWalkDate: string | null }>('/api/walks/streak')
      const today = new Date().toISOString().split('T')[0]

      if (streak.lastWalkDate === today) return // Already walked today

      // Request permission if needed
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission()
        if (result !== 'granted') return
      }

      // Show reminder
      new Notification('DogWalk', {
        body: 'Ton chien attend sa balade du jour ! Ne casse pas ta série.',
        icon: '/pwa-192x192.svg',
        tag: 'walk-reminder', // Prevents duplicate notifications
      })
    }
    catch {
      // Silently fail
    }
  }

  onMounted(() => {
    // Delay to not interrupt page load
    setTimeout(checkAndRemind, 5000)
  })
}
