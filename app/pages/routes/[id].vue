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
const { isPremium } = usePremium()

// Weather integration (Story 5.4 + 8.2/8.3)
const { weather, isLoading: weatherLoading, fetchWeather, forecast, forecastLoading, fetchForecast } = useWeather()

/**
 * Fetch route data
 */
const { data: routeData, status, error } = useFetch<Route>(() => `/api/routes/${routeId.value}`, {
  watch: [routeId],
})

// Fetch reviews
interface ReviewData {
  reviews: Array<{ id: number; rating: number; comment: string | null; created_at: number; user_name: string | null }>
  stats: { count: number; avgRating: number }
}
const { data: reviewData } = useFetch<ReviewData>(() => `/api/reviews/${routeId.value}`, { watch: [routeId] })

// Fetch weather when route data is available
watch(routeData, (data) => {
  if (data) {
    const lat = data.center_lat ?? 43.5185
    const lng = data.center_lng ?? 1.3370
    fetchWeather(lat, lng)
    fetchForecast(lat, lng)
  }
}, { immediate: true })

/**
 * Parse GeoJSON path for map display (Story 8.1)
 */
const parsedGeoJSON = computed(() => {
  if (!routeData.value?.geojson_path) return null
  try {
    return JSON.parse(routeData.value.geojson_path)
  }
  catch {
    return null
  }
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
 * Premium routes require premium membership
 */
const canStart = computed(() => {
  if (!routeData.value) return false
  if (routeData.value.is_premium && !isPremium.value) return false
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
      icon: 'i-lucide-user',
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
        icon: 'i-lucide-user',
        color: 'warning',
      })
      await navigateTo('/login')
      return
    }

    // Generic error
    toast.add({
      title: 'Impossible de démarrer la balade',
      description: 'Réessaie dans quelques instants.',
      icon: 'i-lucide-alert-triangle',
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
        name="i-lucide-loader-2"
        class="w-8 h-8 text-spring-500 animate-spin mb-3"
      />
      <p class="text-neutral-600">Chargement du parcours...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-16">
      <UIcon
        name="i-lucide-alert-triangle"
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
          icon="i-lucide-arrow-left"
          aria-label="Retour"
        />
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-forest-700 line-clamp-2">
            {{ routeData.name }}
          </h1>
        </div>
        <!-- Premium badge -->
        <span
          v-if="routeData.is_premium"
          class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-spring-500/10 text-spring-500 text-xs font-medium"
        >
          <UIcon name="i-lucide-star" class="w-3 h-3" />
          Premium
        </span>
      </div>

      <!-- Map Section with route itinerary -->
      <section aria-labelledby="map-heading" class="rounded-lg overflow-hidden">
        <h2 id="map-heading" class="sr-only">Carte du parcours</h2>
        <MapView
          height="40vh"
          :center="routeData.center_lat && routeData.center_lng
            ? [routeData.center_lng, routeData.center_lat]
            : undefined"
          :zoom="14"
          :route="parsedGeoJSON"
          :show-user-position="false"
          :start-end-markers="true"
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
            <UIcon name="i-lucide-clock" class="w-5 h-5 text-neutral-500" />
            <span class="font-medium">{{ formatDuration(routeData.duration_minutes) }}</span>
          </div>

          <!-- Distance -->
          <div class="flex items-center gap-2 text-neutral-700">
            <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-neutral-500" />
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

      <!-- Weather Forecast Section (Story 8.2 + 8.3) -->
      <section v-if="forecast?.available || forecastLoading" class="space-y-3">
        <WeatherAlert
          v-if="forecast?.available && forecast.entries.length > 0"
          :entries="forecast.entries"
          :duration-minutes="routeData.duration_minutes"
        />
        <WeatherTimeline
          :entries="forecast?.entries ?? []"
          :duration-minutes="routeData.duration_minutes"
          :loading="forecastLoading"
        />
      </section>

      <!-- Reviews Section -->
      <section v-if="reviewData && reviewData.stats.count > 0" class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-forest-700">Avis de la communauté</h3>
          <div class="flex items-center gap-1 text-sm">
            <UIcon name="i-lucide-star" class="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span class="font-bold">{{ reviewData.stats.avgRating }}</span>
            <span class="text-neutral-500">({{ reviewData.stats.count }} avis)</span>
          </div>
        </div>
        <div class="space-y-3">
          <div
            v-for="review in reviewData.reviews.slice(0, 5)"
            :key="review.id"
            class="bg-warmGray-50 rounded-lg p-3"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-neutral-700">{{ review.user_name || 'Anonyme' }}</span>
              <div class="flex items-center gap-0.5">
                <UIcon
                  v-for="s in 5"
                  :key="s"
                  name="i-lucide-star"
                  class="w-4 h-4"
                  :class="s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'"
                />
              </div>
            </div>
            <p v-if="review.comment" class="text-sm text-neutral-600">{{ review.comment }}</p>
            <p class="text-xs text-neutral-400 mt-1">
              {{ new Date(review.created_at * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }}
            </p>
          </div>
        </div>
      </section>

      <!-- Additional Info Section -->
      <section class="bg-neutral-50 rounded-lg p-4 space-y-3">
        <h3 class="font-semibold text-neutral-900">Informations</h3>
        <ul class="text-sm text-neutral-600 space-y-2">
          <li class="flex items-center gap-2">
            <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-success" />
            Parcours vérifié et sécurisé
          </li>
          <li class="flex items-center gap-2">
            <UIcon name="i-lucide-map" class="w-4 h-4 text-spring-500" />
            Suivi GPS disponible pendant la balade
          </li>
          <li v-if="routeData.type === 'nature'" class="flex items-center gap-2">
            <UIcon name="i-lucide-sparkles" class="w-4 h-4 text-success" />
            Parcours en pleine nature
          </li>
          <li v-if="routeData.type === 'urban'" class="flex items-center gap-2">
            <UIcon name="i-lucide-building-2" class="w-4 h-4 text-spring-500" />
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
        <!-- Weather + Start button row (Story 5.4) -->
        <div v-if="canStart" class="flex items-center gap-3">
          <WeatherBadge v-if="weather || weatherLoading" :weather="weather" variant="compact" :lat="routeData?.center_lat ?? 43.5185" :lng="routeData?.center_lng ?? 1.3370" />
          <UButton
            class="flex-1 text-lg font-semibold bg-spring-500 hover:bg-spring-600 text-white"
            color="neutral"
            size="lg"
            :loading="isStartingWalk"
            :disabled="isStartingWalk"
            @click="handleStartWalk"
          >
            <UIcon v-if="!isStartingWalk" name="i-lucide-play" class="w-5 h-5 mr-2" />
            {{ isStartingWalk ? 'Démarrage...' : "C'est parti !" }}
          </UButton>
        </div>

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
            <UIcon name="i-lucide-star" class="w-5 h-5 mr-2" />
            Passer à Premium
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
