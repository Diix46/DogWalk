<script setup lang="ts">
import type { Route } from '~/types/route'

/**
 * Walk Tracker Page
 *
 * Fullscreen interface during an active walk with:
 * - Real-time GPS position on map
 * - Time and distance tracking
 * - Deviation alerts
 * - Finish walk button
 *
 * @see Story 4.3: Composant WalkTracker - Interface Balade
 * @see Story 4.4: Position GPS Temps Réel
 * @see Story 4.5: Temps et Distance Restants
 * @see Story 4.6: Alerte Déviation Parcours
 * @see Story 4.7: Terminer une Balade
 */

const nuxtRoute = useRoute()
const walkId = computed(() => nuxtRoute.params.id as string)
const toast = useToast()

// Fetch walk data
const { data: walkData, error: walkError, refresh: refreshWalk } = useFetch<{
  id: number
  user_id: number
  route_id: string
  started_at: string
  finished_at: string | null
  distance_meters: number
  duration_seconds: number
  status: 'active' | 'completed' | 'cancelled'
  geojson_track: string | null
}>(() => `/api/walks/${walkId.value}`)

// Fetch route data for the walk
const routeData = ref<Route | null>(null)

// Fetch route when walk data is available
watch(() => walkData.value?.route_id, async (routeId) => {
  if (routeId) {
    try {
      routeData.value = await $fetch<Route>(`/api/routes/${routeId}`)
    }
    catch (err) {
      console.error('Failed to fetch route:', err)
    }
  }
}, { immediate: true })

// GPS Tracking
const {
  currentPosition,
  walkedPath,
  isTracking,
  error: trackingError,
  distanceWalked,
  durationSeconds: trackingDuration,
  startTracking,
  stopTracking,
  getGeoJsonTrack,
} = useWalkTracking()

// Real duration calculated from walk's started_at (persists across refresh)
const realDurationSeconds = ref(0)
let durationInterval: ReturnType<typeof setInterval> | null = null

// Calculate duration from walk's started_at
function updateDurationFromWalk() {
  if (walkData.value?.started_at) {
    const startedAtMs = new Date(walkData.value.started_at).getTime()
    realDurationSeconds.value = Math.floor((Date.now() - startedAtMs) / 1000)
  }
}

// Start duration timer and GPS tracking when walk data loads
watch(walkData, (walk) => {
  if (walk?.started_at && walk.status === 'active') {
    // Initial calculation
    updateDurationFromWalk()

    // Start interval to update every second
    if (!durationInterval) {
      durationInterval = setInterval(updateDurationFromWalk, 1000)
    }

    // Start GPS tracking if not already tracking
    if (!isTracking.value) {
      startTracking(true) // true = resuming, don't reset
    }
  }
}, { immediate: true })

// Use realDurationSeconds for display (falls back to trackingDuration if no walk data)
const durationSeconds = computed(() => {
  if (walkData.value?.started_at) {
    return realDurationSeconds.value
  }
  return trackingDuration.value
})

// Cleanup duration interval
onUnmounted(() => {
  if (durationInterval) {
    clearInterval(durationInterval)
    durationInterval = null
  }
})

// UI State
const isFinishing = ref(false)
const showCancelConfirm = ref(false)
const showDeviationAlert = ref(false)
const deviationAlertDismissed = ref(false)
const isOnline = ref(true)

// Track online status for offline indicator
const handleOnline = () => { isOnline.value = true }
const handleOffline = () => { isOnline.value = false }

onMounted(() => {
  if (import.meta.client) {
    isOnline.value = window.navigator.onLine
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
})

/**
 * Format duration as mm:ss or hh:mm:ss
 */
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format distance in km or m
 */
function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`
  }
  return `${Math.round(meters)} m`
}

/**
 * Calculate remaining time based on route duration and elapsed time
 */
const remainingMinutes = computed(() => {
  if (!routeData.value) return null
  const totalSeconds = routeData.value.duration_minutes * 60
  const remaining = totalSeconds - durationSeconds.value
  return Math.max(0, Math.ceil(remaining / 60))
})


/**
 * Handle finishing the walk
 */
async function handleFinishWalk() {
  if (isFinishing.value) return

  isFinishing.value = true
  stopTracking()

  // Stop duration timer
  if (durationInterval) {
    clearInterval(durationInterval)
    durationInterval = null
  }

  try {
    const now = Math.floor(Date.now() / 1000)
    await $fetch(`/api/walks/${walkId.value}`, {
      method: 'PATCH',
      body: {
        status: 'completed',
        finished_at: now,
        distance_meters: Math.round(distanceWalked.value),
        duration_seconds: durationSeconds.value,
        geojson_track: getGeoJsonTrack(),
      },
    })

    // Navigate to walk summary
    await navigateTo(`/walks/summary-${walkId.value}`)
  }
  catch (err) {
    console.error('Failed to finish walk:', err)
    toast.add({
      title: 'Impossible de terminer la balade',
      description: 'Réessaie dans quelques instants.',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'error',
    })
    isFinishing.value = false
    // Restart tracking if finish failed
    startTracking(true) // Resume tracking
  }
}

/**
 * Handle cancelling the walk
 */
function promptCancelWalk() {
  showCancelConfirm.value = true
}

async function handleCancelWalk() {
  showCancelConfirm.value = false
  stopTracking()

  try {
    await $fetch(`/api/walks/${walkId.value}`, {
      method: 'PATCH',
      body: {
        status: 'cancelled',
      },
    })

    await navigateTo('/explore')
  }
  catch (err) {
    console.error('Failed to cancel walk:', err)
  }
}

/**
 * Dismiss deviation alert
 */
function dismissDeviationAlert() {
  showDeviationAlert.value = false
  deviationAlertDismissed.value = true
}

// Page meta - no layout for fullscreen experience
definePageMeta({
  layout: false,
})

useSeoMeta({
  title: 'Balade en cours - DogWalk',
})
</script>

<template>
  <div class="fixed inset-0 flex flex-col bg-white">
    <!-- Error State -->
    <div v-if="walkError" class="flex-1 flex flex-col items-center justify-center p-6">
      <UIcon
        name="i-heroicons-exclamation-triangle"
        class="w-12 h-12 text-warning mb-3"
      />
      <p class="text-neutral-600 font-medium">Balade introuvable</p>
      <UButton
        to="/explore"
        variant="outline"
        class="mt-4"
      >
        Retour à l'exploration
      </UButton>
    </div>

    <!-- Walk Already Completed -->
    <div
      v-else-if="walkData && walkData.status !== 'active'"
      class="flex-1 flex flex-col items-center justify-center p-6"
    >
      <UIcon
        name="i-heroicons-check-circle"
        class="w-12 h-12 text-success mb-3"
      />
      <p class="text-neutral-600 font-medium">Cette balade est terminée</p>
      <UButton
        :to="`/walks/summary-${walkId}`"
        variant="outline"
        class="mt-4"
      >
        Voir le résumé
      </UButton>
    </div>

    <!-- Active Walk Interface -->
    <template v-else>
      <!-- Top Bar -->
      <div class="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between">
        <!-- Cancel Button -->
        <UButton
          variant="soft"
          color="neutral"
          size="sm"
          icon="i-heroicons-x-mark"
          @click="promptCancelWalk"
        >
          Annuler
        </UButton>

        <!-- Route Name -->
        <div
          v-if="routeData"
          class="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm"
        >
          <span class="text-sm font-medium text-neutral-700">
            {{ routeData.name }}
          </span>
        </div>

        <!-- Placeholder for balance -->
        <div class="w-20" />
      </div>

      <!-- Map (Fullscreen) -->
      <div class="flex-1 relative">
        <MapView
          height="100%"
          :center="currentPosition ? [currentPosition.lng, currentPosition.lat] : undefined"
          :zoom="16"
          :show-user-position="true"
          class="absolute inset-0"
        />

        <!-- GPS Error Overlay -->
        <div
          v-if="trackingError"
          class="absolute top-20 left-4 right-4 bg-warning/90 text-white px-4 py-2 rounded-lg text-sm"
        >
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
            {{ trackingError }}
          </div>
        </div>

        <!-- Deviation Alert (Story 4.6) -->
        <div
          v-if="showDeviationAlert && !deviationAlertDismissed"
          class="absolute top-20 left-4 right-4 bg-primary/90 text-white px-4 py-3 rounded-lg"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-arrow-uturn-left" class="w-5 h-5" />
              <span class="text-sm">Tu sembles t'éloigner du parcours</span>
            </div>
            <UButton
              variant="ghost"
              size="xs"
              icon="i-heroicons-x-mark"
              class="text-white"
              @click="dismissDeviationAlert"
            />
          </div>
        </div>

        <!-- Offline Indicator (Story 4.9) -->
        <div
          v-if="!isOnline"
          class="absolute top-20 right-4 bg-neutral-800/80 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-1"
        >
          <UIcon name="i-heroicons-signal-slash" class="w-3 h-3" />
          Mode hors-ligne
        </div>
      </div>

      <!-- Bottom Panel -->
      <div class="bg-white border-t border-neutral-200 p-4 pb-safe">
        <!-- Stats Row -->
        <div class="flex items-center justify-around mb-4">
          <!-- Time Elapsed -->
          <div class="text-center">
            <div class="text-3xl font-bold text-neutral-900 tabular-nums">
              {{ formatDuration(durationSeconds) }}
            </div>
            <div class="text-xs text-neutral-500 uppercase tracking-wide">Temps</div>
          </div>

          <!-- Divider -->
          <div class="h-12 w-px bg-neutral-200" />

          <!-- Distance -->
          <div class="text-center">
            <div class="text-3xl font-bold text-neutral-900 tabular-nums">
              {{ formatDistance(distanceWalked) }}
            </div>
            <div class="text-xs text-neutral-500 uppercase tracking-wide">Distance</div>
          </div>

          <!-- Divider -->
          <div class="h-12 w-px bg-neutral-200" />

          <!-- Remaining Time -->
          <div class="text-center">
            <div class="text-3xl font-bold text-primary tabular-nums">
              {{ remainingMinutes !== null ? `${remainingMinutes}` : '--' }}
            </div>
            <div class="text-xs text-neutral-500 uppercase tracking-wide">Min restantes</div>
          </div>
        </div>

        <!-- Finish Button -->
        <UButton
          block
          color="primary"
          size="lg"
          class="text-lg font-semibold"
          :loading="isFinishing"
          :disabled="isFinishing"
          @click="handleFinishWalk"
        >
          <UIcon v-if="!isFinishing" name="i-heroicons-flag" class="w-5 h-5 mr-2" />
          {{ isFinishing ? 'Enregistrement...' : 'Terminer la balade' }}
        </UButton>
      </div>
    </template>

    <!-- Cancel Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showCancelConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        @click.self="showCancelConfirm = false"
      >
        <div class="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
          <div class="text-center">
            <div class="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-error" />
            </div>
            <h3 class="text-lg font-semibold text-neutral-900">Annuler la balade ?</h3>
            <p class="text-sm text-neutral-500 mt-1">Ta progression ne sera pas enregistrée.</p>
          </div>
          <div class="flex gap-3">
            <UButton
              block
              variant="outline"
              color="neutral"
              @click="showCancelConfirm = false"
            >
              Continuer
            </UButton>
            <UButton
              block
              color="error"
              @click="handleCancelWalk"
            >
              Annuler
            </UButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Safe area for bottom panel on iOS */
.pb-safe {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
</style>
