<script setup lang="ts">
import type { Route } from '~/types/route'
import { DIFFICULTY_CONFIG, ROUTE_TYPE_CONFIG } from '~/types/route'

/**
 * Route Details Page
 *
 * Displays full details of a walking route with map and action button.
 *
 * @see Story 3.8: Page Détails Parcours
 */

const route = useRoute()
const routeId = computed(() => route.params.id as string)
const toast = useToast()
const { loggedIn } = useUserSession()

/**
 * Fetch route data
 */
const { data: routeData, status, error } = useFetch<Route>(() => `/api/routes/${routeId.value}`, {
  watch: [routeId],
})

/**
 * Loading state
 */
const isLoading = computed(() => status.value === 'pending')

/**
 * Format duration for display
 */
function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return '-- min'
  if (minutes >= 60) return '1h+'
  return `${Math.round(minutes)} min`
}

/**
 * Format distance in km
 */
function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return '-- km'
  const km = meters / 1000
  return `${km.toFixed(1)} km`
}

/**
 * Get difficulty config
 */
const difficultyConfig = computed(() => {
  if (!routeData.value) return DIFFICULTY_CONFIG.easy
  return DIFFICULTY_CONFIG[routeData.value.difficulty]
})

/**
 * Get type config
 */
const typeConfig = computed(() => {
  if (!routeData.value) return ROUTE_TYPE_CONFIG.urban
  return ROUTE_TYPE_CONFIG[routeData.value.type]
})

/**
 * Check if user can start this route
 * For now, all routes are startable (premium system not implemented yet)
 */
const canStart = computed(() => {
  if (!routeData.value) return false
  // Future: check if user is premium for premium routes
  // For now, allow all routes
  return true
})

/**
 * Track if walk is being started
 */
const isStartingWalk = ref(false)

/**
 * Handle start walk button
 * Creates a new walk and redirects to WalkTracker
 * @see Story 4.2: Démarrer une Balade
 */
async function handleStartWalk() {
  if (!routeData.value || isStartingWalk.value) return

  // Check if user is logged in
  if (!loggedIn.value) {
    toast.add({
      title: 'Connexion requise',
      description: 'Connecte-toi pour démarrer une balade.',
      icon: 'i-heroicons-user',
      color: 'warning',
    })
    await navigateTo('/login')
    return
  }

  isStartingWalk.value = true

  try {
    const walk = await $fetch('/api/walks', {
      method: 'POST',
      body: {
        route_id: routeData.value.id,
      },
    })

    // Redirect to walk tracker with the new walk ID
    await navigateTo(`/walks/${walk.id}`)
  }
  catch (err: unknown) {
    console.error('Failed to start walk:', err)
    const statusCode = (err as { statusCode?: number })?.statusCode
      || (err as { response?: { status?: number } })?.response?.status

    // Handle 401 specifically (session expired or not logged in)
    if (statusCode === 401) {
      toast.add({
        title: 'Connexion requise',
        description: 'Connecte-toi pour démarrer une balade.',
        icon: 'i-heroicons-user',
        color: 'warning',
      })
      await navigateTo('/login')
      return
    }

    // Generic error
    toast.add({
      title: 'Impossible de démarrer la balade',
      description: 'Réessaie dans quelques instants.',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'error',
    })
  }
  finally {
    isStartingWalk.value = false
  }
}

// Page meta
definePageMeta({
  layout: 'default',
})

// Dynamic SEO meta
useSeoMeta({
  title: () => routeData.value ? `${routeData.value.name} - DogWalk` : 'Chargement... - DogWalk',
  description: () => routeData.value?.description || 'Découvrez ce parcours de balade',
})
</script>

<template>
  <div class="min-h-screen pb-24">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-16">
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-8 h-8 text-primary animate-spin mb-3"
      />
      <p class="text-neutral-600">Chargement du parcours...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-16">
      <UIcon
        name="i-heroicons-exclamation-triangle"
        class="w-12 h-12 text-warning mb-3"
      />
      <p class="text-neutral-600 font-medium">Parcours introuvable</p>
      <p class="text-neutral-500 text-sm mt-1">Ce parcours n'existe pas ou n'est plus disponible.</p>
      <UButton
        to="/explore"
        variant="outline"
        class="mt-4"
      >
        Retour à l'exploration
      </UButton>
    </div>

    <!-- Route Content -->
    <div v-else-if="routeData" class="space-y-6">
      <!-- Header with back button -->
      <div class="flex items-center gap-4">
        <UButton
          to="/explore"
          variant="ghost"
          icon="i-heroicons-arrow-left"
          aria-label="Retour"
        />
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-neutral-900 line-clamp-2">
            {{ routeData.name }}
          </h1>
        </div>
        <!-- Premium badge -->
        <span
          v-if="routeData.is_premium"
          class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
        >
          <UIcon name="i-heroicons-star-solid" class="w-3 h-3" />
          Premium
        </span>
      </div>

      <!-- Map Section -->
      <section aria-labelledby="map-heading" class="rounded-lg overflow-hidden">
        <h2 id="map-heading" class="sr-only">Carte du parcours</h2>
        <MapView
          height="40vh"
          :center="routeData.center_lat && routeData.center_lng
            ? [routeData.center_lng, routeData.center_lat]
            : undefined"
          :zoom="14"
          :show-user-position="false"
        />
      </section>

      <!-- Route Info -->
      <section class="space-y-4">
        <!-- Description -->
        <p v-if="routeData.description" class="text-neutral-600">
          {{ routeData.description }}
        </p>

        <!-- Stats Row -->
        <div class="flex items-center gap-4 flex-wrap">
          <!-- Duration -->
          <div class="flex items-center gap-2 text-neutral-700">
            <UIcon name="i-heroicons-clock" class="w-5 h-5 text-neutral-500" />
            <span class="font-medium">{{ formatDuration(routeData.duration_minutes) }}</span>
          </div>

          <!-- Distance -->
          <div class="flex items-center gap-2 text-neutral-700">
            <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-neutral-500" />
            <span class="font-medium">{{ formatDistance(routeData.distance_meters) }}</span>
          </div>

          <!-- Difficulty Badge -->
          <span
            :class="[
              'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
              difficultyConfig.colorClass
            ]"
          >
            {{ difficultyConfig.label }}
          </span>

          <!-- Type Badge -->
          <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-sm font-medium">
            <UIcon :name="typeConfig.icon" class="w-4 h-4" />
            {{ typeConfig.label }}
          </span>
        </div>
      </section>

      <!-- Additional Info Section -->
      <section class="bg-neutral-50 rounded-lg p-4 space-y-3">
        <h3 class="font-semibold text-neutral-900">Informations</h3>
        <ul class="text-sm text-neutral-600 space-y-2">
          <li class="flex items-center gap-2">
            <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-success" />
            Parcours vérifié et sécurisé
          </li>
          <li class="flex items-center gap-2">
            <UIcon name="i-heroicons-map" class="w-4 h-4 text-primary" />
            Suivi GPS disponible pendant la balade
          </li>
          <li v-if="routeData.type === 'nature'" class="flex items-center gap-2">
            <UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-success" />
            Parcours en pleine nature
          </li>
          <li v-if="routeData.type === 'urban'" class="flex items-center gap-2">
            <UIcon name="i-heroicons-building-office-2" class="w-4 h-4 text-primary" />
            Parcours urbain bien aménagé
          </li>
        </ul>
      </section>
    </div>

    <!-- Fixed Bottom Action Button -->
    <div
      v-if="routeData && !isLoading && !error"
      class="fixed bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-neutral-200"
    >
      <div class="max-w-lg mx-auto">
        <!-- Can Start: Show start button -->
        <UButton
          v-if="canStart"
          block
          color="primary"
          size="lg"
          class="text-lg font-semibold"
          :loading="isStartingWalk"
          :disabled="isStartingWalk"
          @click="handleStartWalk"
        >
          <UIcon v-if="!isStartingWalk" name="i-heroicons-play" class="w-5 h-5 mr-2" />
          {{ isStartingWalk ? 'Démarrage...' : "C'est parti !" }}
        </UButton>

        <!-- Premium Route for non-premium user: Show upgrade prompt -->
        <div v-else class="text-center space-y-2">
          <p class="text-sm text-neutral-600">
            Ce parcours est réservé aux membres Premium
          </p>
          <UButton
            to="/premium"
            block
            color="primary"
            variant="outline"
            size="lg"
          >
            <UIcon name="i-heroicons-star" class="w-5 h-5 mr-2" />
            Passer à Premium
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
