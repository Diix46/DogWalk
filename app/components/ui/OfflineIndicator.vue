<script setup lang="ts">
/**
 * Offline Indicator Component
 *
 * Displays a banner when the user loses internet connectivity.
 * Automatically hides when connection is restored.
 *
 * @see Epic 10 - Story 10-3: Mode Degrade Offline
 */
const isOnline = ref(true)

function update() {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  isOnline.value = navigator.onLine
  window.addEventListener('online', update)
  window.addEventListener('offline', update)
})

onUnmounted(() => {
  window.removeEventListener('online', update)
  window.removeEventListener('offline', update)
})
</script>

<template>
  <Transition name="offline-slide">
    <div
      v-if="!isOnline"
      role="status"
      aria-live="polite"
      class="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 px-4 py-2 bg-warmGray-800 text-white text-sm font-medium shadow-md"
    >
      <UIcon name="i-lucide-wifi-off" class="w-4 h-4 shrink-0" />
      <span>Hors connexion</span>
    </div>
  </Transition>
</template>

<style scoped>
.offline-slide-enter-active,
.offline-slide-leave-active {
  transition: transform 0.3s ease;
}
.offline-slide-enter-from,
.offline-slide-leave-to {
  transform: translateY(-100%);
}
</style>
