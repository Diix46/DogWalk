<script setup lang="ts">
const { loggedIn, user } = useUserSession()

const userName = computed(() => (user.value as { name?: string | null } | null)?.name)

// TimeSelector state
const selectedDuration = ref<number>()

// Walk stats (Story 6.3)
interface WalkStats {
  totalWalks: number
  totalDistance: number
  totalDuration: number
}
const { data: stats, error: statsError } = loggedIn.value ? useFetch<WalkStats>('/api/walks/stats') : { data: ref(null), error: ref(null) }

// Weather integration (Story 5.3, 5.5)
const { coords, getCurrentPosition } = useGeolocation()
const { weather, isLoading: weatherLoading, fetchWeather } = useWeather()
const weatherLat = ref(43.5185)
const weatherLng = ref(1.3370)

onMounted(async () => {
  await getCurrentPosition()
  weatherLat.value = coords.value?.lat ?? 43.5185
  weatherLng.value = coords.value?.lng ?? 1.3370
  fetchWeather(weatherLat.value, weatherLng.value)
})

/**
 * Handle time selection - navigate to explore with duration filter
 */
function onDurationSelect(minutes: number) {
  selectedDuration.value = minutes
  // Navigate to explore page with duration filter (Story 3.5)
  navigateTo({
    path: '/explore',
    query: { duration: minutes },
  })
}
</script>

<template>
  <div class="space-y-8 lg:space-y-12">
    <!-- Welcome / Hero Section -->
    <div class="text-center pt-4 lg:pt-8 lg:pb-4">
      <h1 class="text-3xl lg:text-5xl font-bold text-primary mb-2 lg:mb-4 tracking-tight">
        {{ loggedIn ? `Salut ${userName || 'toi'} !` : 'Bienvenue sur DogWalk' }}
      </h1>
      <p class="text-neutral-600 lg:text-lg lg:max-w-xl lg:mx-auto">
        {{ loggedIn ? 'Prêt pour une balade ?' : "L'app qui rend les balades avec ton chien plus simples et plus fun !" }}
      </p>

      <!-- Weather Badge (Story 5.3) -->
      <div class="flex justify-center mt-4">
        <div v-if="weatherLoading" class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 text-neutral-400 text-xs animate-pulse min-h-[44px]">
          <span>☁️</span>
          <span>Chargement...</span>
        </div>
        <WeatherBadge v-else :weather="weather" variant="full" :lat="weatherLat" :lng="weatherLng" />
      </div>
    </div>

    <!-- TimeSelector - "J'ai X minutes" interaction -->
    <UCard class="text-center lg:max-w-2xl lg:mx-auto">
      <div class="py-6 lg:py-10 space-y-4 lg:space-y-6">
        <UIcon name="i-heroicons-clock" class="w-12 h-12 lg:w-16 lg:h-16 text-primary-500 mx-auto" />
        <h2 class="text-xl lg:text-2xl font-semibold text-neutral-900">
          Combien de temps as-tu ?
        </h2>
        <p class="text-neutral-600 text-sm lg:text-base">
          Choisis ta durée et découvre des parcours adaptés.
        </p>

        <!-- TimeSelector Component (Story 3.2) -->
        <div class="pt-2">
          <TimeSelector
            v-model="selectedDuration"
            @update:model-value="onDurationSelect"
          />
        </div>
      </div>
    </UCard>

    <!-- Auth Actions (if not logged in) -->
    <div v-if="!loggedIn" class="space-y-3 lg:max-w-md lg:mx-auto">
      <UButton to="/register" block size="lg">
        Créer un compte gratuit
      </UButton>
      <UButton to="/login" variant="outline" block size="lg">
        J'ai déjà un compte
      </UButton>
    </div>

    <!-- Stats error -->
    <UAlert
      v-if="loggedIn && statsError"
      color="warning"
      icon="i-heroicons-exclamation-triangle"
      title="Impossible de charger les statistiques"
      class="lg:max-w-2xl lg:mx-auto"
    />

    <!-- Quick Stats (if logged in) -->
    <div v-else-if="loggedIn" class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <UCard>
        <div class="text-center py-2 lg:py-4">
          <p class="text-2xl lg:text-3xl font-bold text-primary">{{ stats?.totalWalks ?? 0 }}</p>
          <p class="text-sm text-neutral-600">Balades</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center py-2 lg:py-4">
          <p class="text-2xl lg:text-3xl font-bold text-primary">{{ stats ? ((stats.totalDistance / 1000).toFixed(1) + ' km') : '0 km' }}</p>
          <p class="text-sm text-neutral-600">Parcourus</p>
        </div>
      </UCard>
      <UCard class="hidden lg:block">
        <div class="text-center py-4">
          <p class="text-3xl font-bold text-primary">0</p>
          <p class="text-sm text-neutral-600">Parcours favoris</p>
        </div>
      </UCard>
      <UCard class="hidden lg:block">
        <div class="text-center py-4">
          <p class="text-2xl lg:text-3xl font-bold text-primary">{{ stats ? Math.floor(stats.totalDuration / 3600) + 'h' : '0h' }}</p>
          <p class="text-sm text-neutral-600">Temps total</p>
        </div>
      </UCard>
    </div>
  </div>
</template>
