<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Mon historique - DogWalk',
  description: 'Consulte l\'historique de tes balades',
})

interface WalkHistory {
  id: number
  started_at: string | number
  finished_at: string | number | null
  distance_meters: number
  duration_seconds: number
  route_name: string
}

const { data: walks, status } = useFetch<WalkHistory[]>('/api/walks/history')

const isLoading = computed(() => status.value === 'pending')
const isEmpty = computed(() => !isLoading.value && (!walks.value || walks.value.length === 0))
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
      <h1 class="text-2xl font-bold text-neutral-900">Mon historique</h1>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-3">
      <div
        v-for="i in 4"
        :key="i"
        class="flex items-center gap-4 p-4 rounded-lg bg-white shadow-sm animate-pulse"
      >
        <div class="w-10 h-10 rounded-full bg-neutral-200" />
        <div class="flex-1 space-y-2">
          <div class="w-32 h-4 bg-neutral-200 rounded" />
          <div class="w-20 h-3 bg-neutral-100 rounded" />
        </div>
        <div class="space-y-2 text-right">
          <div class="w-12 h-3 bg-neutral-200 rounded" />
          <div class="w-10 h-3 bg-neutral-100 rounded" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="isEmpty" class="text-center py-16">
      <div class="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span class="text-4xl">🐕</span>
      </div>
      <h2 class="text-lg font-semibold text-neutral-900 mb-2">Ton historique apparaîtra ici</h2>
      <p class="text-neutral-500 mb-6">Lance ta première balade pour commencer !</p>
      <UButton to="/explore" icon="i-heroicons-magnifying-glass">
        Trouver un parcours
      </UButton>
    </div>

    <!-- Walk list -->
    <div v-else class="space-y-3">
      <WalkHistoryCard
        v-for="walk in walks"
        :key="walk.id"
        :id="walk.id"
        :route-name="walk.route_name"
        :started-at="walk.started_at"
        :duration-seconds="walk.duration_seconds"
        :distance-meters="walk.distance_meters"
      />
    </div>
  </div>
</template>
