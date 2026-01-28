<script setup lang="ts">
const { loggedIn, user } = useUserSession()

const userName = computed(() => (user.value as { name?: string | null } | null)?.name)

// TimeSelector state
const selectedDuration = ref<number>()

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
  <div class="space-y-8">
    <!-- Welcome Section -->
    <div class="text-center pt-4">
      <h1 class="text-3xl font-bold text-primary mb-2">
        {{ loggedIn ? `Salut ${userName || 'toi'} !` : 'Bienvenue sur DogWalk' }}
      </h1>
      <p class="text-neutral-600">
        {{ loggedIn ? 'Prêt pour une balade ?' : "L'app qui rend les balades avec ton chien plus simples et plus fun !" }}
      </p>
    </div>

    <!-- TimeSelector - "J'ai X minutes" interaction -->
    <UCard class="text-center">
      <div class="py-6 space-y-4">
        <UIcon name="i-heroicons-clock" class="w-12 h-12 text-primary-500 mx-auto" />
        <h2 class="text-xl font-semibold text-neutral-900">
          Combien de temps as-tu ?
        </h2>
        <p class="text-neutral-600 text-sm">
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
    <div v-if="!loggedIn" class="space-y-3">
      <UButton to="/register" block size="lg">
        Créer un compte gratuit
      </UButton>
      <UButton to="/login" variant="outline" block size="lg">
        J'ai déjà un compte
      </UButton>
    </div>

    <!-- Quick Stats (if logged in) -->
    <div v-else class="grid grid-cols-2 gap-4">
      <UCard>
        <div class="text-center py-2">
          <p class="text-2xl font-bold text-primary">0</p>
          <p class="text-sm text-neutral-600">Balades</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center py-2">
          <p class="text-2xl font-bold text-primary">0 km</p>
          <p class="text-sm text-neutral-600">Parcourus</p>
        </div>
      </UCard>
    </div>
  </div>
</template>
