<script setup lang="ts">
import type { Route } from '~/types/route'

/**
 * Walk Summary Page
 *
 * Celebration screen after completing a walk.
 * Shows stats, encouraging message, and celebration animation.
 *
 * @see Story 4.8: Composant WalkSummary - Célébration
 */

const nuxtRoute = useRoute()
const walkId = computed(() => nuxtRoute.params.id as string)

// Fetch walk data
const { data: walkData, error: walkError } = useFetch<{
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

// Fetch route data
const { data: routeData } = useFetch<Route>(
  () => walkData.value ? `/api/routes/${walkData.value.route_id}` : '',
  {
    watch: [walkData],
    immediate: false,
  }
)

// Fetch user's dog for personalized message
const { data: dogs } = useFetch<Array<{ id: number; name: string }>>('/api/dogs')
const dogName = computed(() => dogs.value?.[0]?.name || null)

/**
 * Format duration as Xh Ym or Xm Ys
 */
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hrs > 0) {
    return `${hrs}h ${mins}min`
  }
  if (mins > 0) {
    return `${mins}min ${secs}s`
  }
  return `${secs}s`
}

/**
 * Format distance in km
 */
function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`
  }
  return `${Math.round(meters)} m`
}

/**
 * Get encouraging message based on walk performance
 */
const encouragingMessage = computed(() => {
  if (!walkData.value) return 'Bien joué !'

  const distanceKm = walkData.value.distance_meters / 1000
  const durationMin = walkData.value.duration_seconds / 60

  // Personalize with dog name if available
  const dogPart = dogName.value ? ` avec ${dogName.value}` : ''

  if (distanceKm >= 5) {
    return `Incroyable${dogPart} ! Une vraie aventure !`
  }
  if (distanceKm >= 3) {
    return `Super balade${dogPart} !`
  }
  if (durationMin >= 30) {
    return `Belle promenade${dogPart} !`
  }
  return dogName.value ? `Bien joué${dogPart} !` : 'Bien joué !'
})

/**
 * Review form state
 */
const reviewRating = ref(0)
const reviewComment = ref('')
const reviewSubmitted = ref(false)
const isSubmittingReview = ref(false)
const toast = useToast()

async function submitReview() {
  if (reviewRating.value < 1 || !walkData.value) return
  isSubmittingReview.value = true
  try {
    await $fetch('/api/reviews', {
      method: 'POST',
      body: {
        route_id: walkData.value.route_id,
        walk_id: walkData.value.id,
        rating: reviewRating.value,
        comment: reviewComment.value || null,
      },
    })
    reviewSubmitted.value = true
    toast.add({ title: 'Merci pour ton avis !', icon: 'i-heroicons-star', color: 'success' })
  }
  catch {
    toast.add({ title: 'Erreur lors de l\'envoi', color: 'error' })
  }
  finally {
    isSubmittingReview.value = false
  }
}

/**
 * Animation state for confetti
 */
const showConfetti = ref(false)

onMounted(() => {
  // Trigger confetti after a short delay
  setTimeout(() => {
    showConfetti.value = true
  }, 300)
})

// Page meta
definePageMeta({
  layout: 'default',
})

useSeoMeta({
  title: 'Balade terminée - DogWalk',
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <!-- Confetti Animation Background -->
    <div
      v-if="showConfetti"
      class="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div
        v-for="i in 30"
        :key="i"
        class="confetti"
        :style="{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 2}s`,
          backgroundColor: ['#22C55E', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'][i % 5],
        }"
      />
    </div>

    <!-- Error State -->
    <div v-if="walkError" class="text-center">
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

    <!-- Summary Content -->
    <div v-else-if="walkData" class="text-center space-y-6 max-w-sm mx-auto relative z-10">
      <!-- Success Icon -->
      <div class="relative inline-block">
        <div class="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center animate-bounce-subtle">
          <UIcon
            name="i-heroicons-check-circle"
            class="w-16 h-16 text-success"
          />
        </div>
      </div>

      <!-- Encouraging Message -->
      <div>
        <h1 class="text-3xl font-bold text-neutral-900 mb-2">
          {{ encouragingMessage }}
        </h1>
        <p v-if="routeData" class="text-neutral-600">
          {{ routeData.name }}
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Duration -->
        <div class="bg-neutral-50 rounded-xl p-4">
          <UIcon name="i-heroicons-clock" class="w-6 h-6 text-primary mx-auto mb-2" />
          <div class="text-2xl font-bold text-neutral-900">
            {{ formatDuration(walkData.duration_seconds) }}
          </div>
          <div class="text-sm text-neutral-500">Durée</div>
        </div>

        <!-- Distance -->
        <div class="bg-neutral-50 rounded-xl p-4">
          <UIcon name="i-heroicons-map-pin" class="w-6 h-6 text-primary mx-auto mb-2" />
          <div class="text-2xl font-bold text-neutral-900">
            {{ formatDistance(walkData.distance_meters) }}
          </div>
          <div class="text-sm text-neutral-500">Distance</div>
        </div>
      </div>

      <!-- Date/Time -->
      <p class="text-sm text-neutral-500">
        {{ new Date(walkData.started_at).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }) }}
      </p>

      <!-- Review Section -->
      <div v-if="!reviewSubmitted" class="bg-neutral-50 rounded-xl p-4 text-left space-y-3">
        <h3 class="font-semibold text-neutral-900 text-center">Note cette balade</h3>
        <div class="flex justify-center gap-2">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            class="text-3xl transition-transform hover:scale-110"
            :class="star <= reviewRating ? 'text-yellow-400' : 'text-neutral-300'"
            @click="reviewRating = star"
          >
            ★
          </button>
        </div>
        <UTextarea
          v-if="reviewRating > 0"
          v-model="reviewComment"
          placeholder="Un commentaire ? (optionnel)"
          :rows="2"
        />
        <UButton
          v-if="reviewRating > 0"
          block
          :loading="isSubmittingReview"
          @click="submitReview"
        >
          Envoyer mon avis
        </UButton>
      </div>
      <div v-else class="bg-success/10 rounded-xl p-4 text-center">
        <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-success mx-auto mb-1" />
        <p class="text-sm text-success font-medium">Merci pour ton avis !</p>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-3 pt-4">
        <UButton
          to="/"
          block
          color="primary"
          size="lg"
        >
          <UIcon name="i-heroicons-home" class="w-5 h-5 mr-2" />
          Retour à l'accueil
        </UButton>

        <UButton
          to="/explore"
          block
          variant="outline"
          size="lg"
        >
          <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 mr-2" />
          Nouvelle balade
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="text-center">
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-8 h-8 text-primary animate-spin mb-3"
      />
      <p class="text-neutral-600">Chargement...</p>
    </div>
  </div>
</template>

<style scoped>
/* Subtle bounce animation for success icon */
@keyframes bounce-subtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.animate-bounce-subtle {
  animation: bounce-subtle 2s ease-in-out infinite;
}

/* Confetti animation */
@keyframes confetti-fall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.confetti {
  position: absolute;
  top: -10px;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  animation: confetti-fall 4s ease-out forwards;
}
</style>
