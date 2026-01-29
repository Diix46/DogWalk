<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Mes avis - DogWalk',
  description: 'Consulte les avis que tu as laissés sur les parcours',
})

interface MyReview {
  id: number
  rating: number
  comment: string | null
  created_at: number
  route_name: string
  route_id: string
}

const { data: reviews, status } = useFetch<MyReview[]>('/api/reviews/me')

const isLoading = computed(() => status.value === 'pending')
const isEmpty = computed(() => !isLoading.value && (!reviews.value || reviews.value.length === 0))

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function stars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}
</script>

<template>
  <div class="space-y-6 lg:max-w-2xl lg:mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <UButton
        to="/profile"
        variant="ghost"
        icon="i-heroicons-arrow-left"
        aria-label="Retour"
      />
      <h1 class="text-2xl font-bold text-neutral-900">Mes avis</h1>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-3">
      <div
        v-for="i in 4"
        :key="i"
        class="p-4 rounded-lg bg-white shadow-sm animate-pulse"
      >
        <div class="w-32 h-4 bg-neutral-200 rounded mb-2" />
        <div class="w-24 h-3 bg-neutral-100 rounded mb-2" />
        <div class="w-48 h-3 bg-neutral-100 rounded" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="isEmpty" class="text-center py-16">
      <div class="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-heroicons-star" class="w-10 h-10 text-neutral-400" />
      </div>
      <h2 class="text-lg font-semibold text-neutral-900 mb-2">Tu n'as pas encore laissé d'avis</h2>
      <p class="text-neutral-500 mb-6">Termine une balade pour partager ton avis !</p>
      <UButton to="/explore" icon="i-heroicons-magnifying-glass">
        Explorer les parcours
      </UButton>
    </div>

    <!-- Reviews list -->
    <div v-else class="space-y-3">
      <NuxtLink
        v-for="review in reviews"
        :key="review.id"
        :to="`/routes/${review.route_id}`"
        class="block bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-neutral-900 truncate">{{ review.route_name }}</h3>
            <div class="text-yellow-400 text-sm mt-0.5">{{ stars(review.rating) }}</div>
            <p v-if="review.comment" class="text-sm text-neutral-600 mt-1 line-clamp-2">
              {{ review.comment }}
            </p>
          </div>
          <span class="text-xs text-neutral-400 whitespace-nowrap">{{ formatDate(review.created_at) }}</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
