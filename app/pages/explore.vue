<script setup lang="ts">
import type { Route, RouteType } from '~/types/route'
import { ROUTE_TYPE_CONFIG } from '~/types/route'

/**
 * Explore Page
 *
 * Route discovery page with interactive map and route list.
 * Uses API with duration filtering, relevance sorting, and location-based sorting.
 *
 * @see Story 3.3: Composant MapView
 * @see Story 3.4: Composant RouteCard
 * @see Story 3.5: Recherche par Temps Disponible
 * @see Story 3.6: Recherche par Localisation
 */

// Get duration from query params (from TimeSelector navigation)
const nuxtRoute = useRoute()
const router = useRouter()

// Geolocation for location-based sorting (Story 3.6)
const {
  coords: userCoords,
  isLoading: isGeoLoading,
  isPermissionDenied,
  isSupported: isGeoSupported,
  getCurrentPosition,
} = useGeolocation()

// Track if user has dismissed the location banner
const locationBannerDismissed = ref(false)

// Type filter for route filtering (Story 3.7)
const selectedType = ref<RouteType | null>(null)

// Type filter options using existing config
const typeFilters = Object.entries(ROUTE_TYPE_CONFIG).map(([value, config]) => ({
  value: value as RouteType,
  label: config.label,
  icon: config.icon,
}))

const selectedDuration = computed(() => {
  const duration = nuxtRoute.query.duration
  return duration ? Number(duration) : undefined
})

/**
 * Get duration range based on selected time
 * Maps to distinct, non-overlapping ranges:
 * - 15min: 0-15 minutes (quick walks)
 * - 30min: 16-30 minutes
 * - 45min: 31-45 minutes
 * - 60+: 46+ minutes (long walks)
 */
function getDurationRange(selected: number | undefined): {
  min: number | undefined
  max: number | undefined
  target: number | undefined
} {
  if (!selected) {
    return { min: undefined, max: undefined, target: undefined }
  }

  switch (selected) {
    case 15:
      return { min: 0, max: 15, target: 15 }
    case 30:
      return { min: 16, max: 30, target: 30 }
    case 45:
      return { min: 31, max: 45, target: 45 }
    case 60:
    default:
      // 1h+ has no upper limit
      return { min: 46, max: undefined, target: 60 }
  }
}

// Computed duration range for API call
const durationRange = computed(() => getDurationRange(selectedDuration.value))

// Build API URL with query params (including location for Story 3.6)
const apiUrl = computed(() => {
  const params = new URLSearchParams()

  // Duration params (Story 3.5)
  if (durationRange.value.min !== undefined) {
    params.set('duration_min', String(durationRange.value.min))
  }
  if (durationRange.value.max !== undefined) {
    params.set('duration_max', String(durationRange.value.max))
  }
  if (durationRange.value.target !== undefined) {
    params.set('target', String(durationRange.value.target))
  }

  // Location params (Story 3.6)
  if (userCoords.value) {
    params.set('lat', String(userCoords.value.lat))
    params.set('lng', String(userCoords.value.lng))
  }

  // Type filter (Story 3.7)
  if (selectedType.value) {
    params.set('type', selectedType.value)
  }

  const queryString = params.toString()
  return queryString ? `/api/routes?${queryString}` : '/api/routes'
})

/**
 * Fetch routes from API
 * Re-fetches when duration changes
 */
const { data: routes, status, error, refresh } = useFetch<Route[]>(apiUrl, {
  default: () => [],
  watch: [apiUrl],
})

// Loading state
const isLoading = computed(() => status.value === 'pending')

/**
 * Handle TimeSelector change on explore page
 * Toggles off if clicking the same duration
 */
function onDurationSelect(duration: number) {
  if (selectedDuration.value === duration) {
    // Toggle off - clear duration filter
    router.push({ query: {} })
  } else {
    router.push({ query: { duration: String(duration) } })
  }
}

/**
 * Clear duration filter
 */
function clearFilter() {
  router.push({ query: {} })
}

/**
 * Toggle type filter (Story 3.7)
 */
function toggleTypeFilter(type: RouteType) {
  selectedType.value = selectedType.value === type ? null : type
}

/**
 * Clear all filters (duration + type) (Story 3.7)
 */
function clearAllFilters() {
  selectedType.value = null
  router.push({ query: {} })
}

/**
 * Check if any filter is active
 */
const hasActiveFilters = computed(() => {
  return selectedDuration.value !== undefined || selectedType.value !== null
})

/**
 * Track mounted state for staggered animation
 */
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true

  // Request geolocation on mount (Story 3.6)
  if (isGeoSupported) {
    getCurrentPosition()
  }
})

/**
 * Show location banner when permission denied and not dismissed (Story 3.6)
 */
const showLocationBanner = computed(() => {
  return isGeoSupported && isPermissionDenied.value && !locationBannerDismissed.value
})

/**
 * Dismiss the location permission banner
 */
function dismissLocationBanner() {
  locationBannerDismissed.value = true
}

/**
 * Handle map ready event
 */
function onMapReady() {
  // Map is ready - could trigger additional logic here
}

/**
 * Handle route card click - navigate to route details
 */
function onRouteClick(route: Route) {
  navigateTo(`/routes/${route.id}`)
}

// Page meta
definePageMeta({
  layout: 'default',
})

useSeoMeta({
  title: 'Explorer les parcours - DogWalk',
  description: 'Découvrez les meilleurs parcours de balade pour votre chien',
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header with duration filter -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl lg:text-3xl font-bold text-neutral-900">Explorer</h1>
        <p v-if="selectedDuration" class="text-neutral-600 text-sm lg:text-base">
          Parcours de {{ selectedDuration >= 60 ? '1h+' : `${selectedDuration} min` }}
        </p>
        <p v-else class="text-neutral-600 text-sm lg:text-base">
          Tous les parcours disponibles
        </p>
      </div>

      <!-- Back to home -->
      <UButton
        to="/"
        variant="ghost"
        icon="i-heroicons-arrow-left"
        aria-label="Retour à l'accueil"
        class="lg:hidden"
      />
    </div>

    <!-- Location Permission Banner (Story 3.6 - AC#4) -->
    <div
      v-if="showLocationBanner"
      class="flex items-center justify-between gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg"
      role="alert"
    >
      <div class="flex items-center gap-2 text-sm text-neutral-700">
        <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-primary flex-shrink-0" />
        <span>Active la localisation pour voir les parcours près de toi</span>
      </div>
      <UButton
        variant="ghost"
        size="xs"
        icon="i-heroicons-x-mark"
        aria-label="Fermer"
        @click="dismissLocationBanner"
      />
    </div>

    <!-- Filters section -->
    <div class="lg:flex lg:items-start lg:gap-6">
      <!-- TimeSelector for filtering on explore page (AC#4) -->
      <section aria-label="Filtrer par durée" class="lg:flex-shrink-0">
        <TimeSelector
          :model-value="selectedDuration"
          @update:model-value="onDurationSelect"
        />
      </section>

      <!-- Type Filter Chips (Story 3.7) -->
      <section aria-label="Filtrer par type" class="space-y-2 mt-4 lg:mt-0">
        <div class="flex gap-2 flex-wrap">
          <UButton
            v-for="filter in typeFilters"
            :key="filter.value"
            :variant="selectedType === filter.value ? 'solid' : 'outline'"
            :color="selectedType === filter.value ? 'primary' : 'neutral'"
            size="sm"
            class="rounded-full"
            @click="toggleTypeFilter(filter.value)"
          >
            <UIcon :name="filter.icon" class="w-4 h-4 mr-1" />
            {{ filter.label }}
          </UButton>
        </div>

        <!-- Clear all filters button -->
        <UButton
          v-if="hasActiveFilters"
          variant="ghost"
          size="sm"
          @click="clearAllFilters"
        >
          Effacer les filtres
        </UButton>
      </section>
    </div>

    <!-- Desktop: side-by-side layout for map + routes -->
    <div class="lg:flex lg:gap-8">
      <!-- Routes List (left on desktop) -->
      <section aria-labelledby="routes-heading" class="space-y-4 lg:flex-1 lg:min-w-0 lg:order-1">
        <h2 id="routes-heading" class="text-lg lg:text-xl font-semibold text-neutral-900">
          Parcours recommandés
        </h2>

        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="text-center py-8"
        >
          <UIcon
            name="i-heroicons-arrow-path"
            class="w-8 h-8 text-primary animate-spin mx-auto mb-3"
          />
          <p class="text-neutral-600">Chargement des parcours...</p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="text-center py-8"
        >
          <UIcon
            name="i-heroicons-exclamation-triangle"
            class="w-12 h-12 text-warning mx-auto mb-3"
          />
          <p class="text-neutral-600">
            Impossible de charger les parcours.
          </p>
          <UButton
            variant="outline"
            class="mt-4"
            @click="() => refresh()"
          >
            Réessayer
          </UButton>
        </div>

        <!-- Route Cards Grid -->
        <div
          v-else-if="routes && routes.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <RouteCard
            v-for="(route, index) in routes"
            :key="route.id"
            :route="route"
            :class="[
              isMounted && 'motion-safe:animate-fade-in-up',
            ]"
            :style="{ animationDelay: `${index * 100}ms` }"
            @click="onRouteClick"
          />
        </div>

        <!-- Empty State (AC#2, Story 3.7 AC#6) -->
        <div
          v-else
          class="text-center py-8"
        >
          <UIcon
            name="i-heroicons-map"
            class="w-12 h-12 text-neutral-400 mx-auto mb-3"
          />
          <p class="text-neutral-600 font-medium">
            Aucun parcours trouvé... pour l'instant !
          </p>
          <p class="text-neutral-500 text-sm mt-1">
            Essayez d'autres filtres ou explorez tous les parcours.
          </p>
          <UButton
            v-if="hasActiveFilters"
            variant="outline"
            class="mt-4"
            @click="clearAllFilters"
          >
            Voir tous les parcours
          </UButton>
        </div>
      </section>

      <!-- Map Section (right on desktop, sticky) -->
      <section aria-labelledby="map-heading" class="lg:w-[45%] xl:w-[50%] lg:flex-shrink-0 lg:order-2 lg:sticky lg:top-8 lg:self-start">
        <h2 id="map-heading" class="sr-only">Carte des parcours</h2>
        <MapView
          :height="'65vh'"
          class="lg:rounded-xl lg:overflow-hidden lg:shadow-card"
          :show-user-position="true"
          @ready="onMapReady"
        />
      </section>
    </div>
  </div>
</template>

<style>
/* Staggered fade-in animation for route cards */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.3s ease forwards;
  opacity: 0;
}
</style>
