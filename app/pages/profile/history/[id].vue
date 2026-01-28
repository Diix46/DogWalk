<script setup lang="ts">
import type { Route } from '~/types/route'

definePageMeta({
  middleware: 'auth',
})

const nuxtRoute = useRoute()
const walkId = computed(() => nuxtRoute.params.id as string)

// Fetch walk data
const { data: walkData, status, error } = useFetch<{
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

// Fetch route data when walk is loaded
const { data: routeData } = useFetch<Route>(
  () => walkData.value ? `/api/routes/${walkData.value.route_id}` : '',
  { watch: [walkData], immediate: false },
)

const isLoading = computed(() => status.value === 'pending')

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hrs > 0) return mins > 0 ? `${hrs}h${mins.toString().padStart(2, '0')}` : `${hrs}h`
  return `${mins} min`
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

const formattedDate = computed(() => {
  if (!walkData.value) return ''
  return new Date(walkData.value.started_at).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const parsedTrack = computed(() => {
  if (!walkData.value?.geojson_track) return null
  try {
    return JSON.parse(walkData.value.geojson_track)
  }
  catch {
    return null
  }
})

useSeoMeta({
  title: () => routeData.value ? `${routeData.value.name} - Historique - DogWalk` : 'Détails balade - DogWalk',
})
</script>

<template>
  <div class="space-y-6 lg:max-w-2xl lg:mx-auto">
    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary animate-spin mb-3" />
      <p class="text-neutral-600">Chargement...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-16">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-warning mb-3" />
      <p class="text-neutral-600 font-medium">Balade introuvable</p>
      <UButton to="/profile/history" variant="outline" class="mt-4">
        Retour à l'historique
      </UButton>
    </div>

    <!-- Content -->
    <template v-else-if="walkData">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <UButton
          to="/profile/history"
          variant="ghost"
          icon="i-heroicons-arrow-left"
          aria-label="Retour"
        />
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-neutral-900">
            {{ routeData?.name || 'Balade' }}
          </h1>
          <p class="text-sm text-neutral-500">{{ formattedDate }}</p>
        </div>
      </div>

      <!-- Map -->
      <section class="rounded-lg overflow-hidden">
        <MapView
          height="35vh"
          :center="routeData?.center_lat && routeData?.center_lng
            ? [routeData.center_lng, routeData.center_lat]
            : undefined"
          :zoom="14"
          :route="parsedTrack"
          :show-user-position="false"
        />
      </section>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-neutral-50 rounded-xl p-4 text-center">
          <UIcon name="i-heroicons-clock" class="w-6 h-6 text-primary mx-auto mb-2" />
          <div class="text-2xl font-bold text-neutral-900">
            {{ formatDuration(walkData.duration_seconds) }}
          </div>
          <div class="text-sm text-neutral-500">Durée</div>
        </div>
        <div class="bg-neutral-50 rounded-xl p-4 text-center">
          <UIcon name="i-heroicons-map-pin" class="w-6 h-6 text-primary mx-auto mb-2" />
          <div class="text-2xl font-bold text-neutral-900">
            {{ formatDistance(walkData.distance_meters) }}
          </div>
          <div class="text-sm text-neutral-500">Distance</div>
        </div>
      </div>

      <!-- Status -->
      <div class="bg-neutral-50 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <UIcon
            :name="walkData.status === 'completed' ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
            :class="walkData.status === 'completed' ? 'text-success' : 'text-neutral-400'"
            class="w-5 h-5"
          />
          <span class="text-sm text-neutral-700">
            {{ walkData.status === 'completed' ? 'Balade terminée' : 'Balade annulée' }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
