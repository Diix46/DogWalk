<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

interface Dog {
  id: number
  name: string
  breed: string | null
  birth_date: string | null
}

const { user, clear } = useUserSession()
const toast = useToast()
const { isPremium } = usePremium()

const userEmail = computed(() => (user.value as { email?: string } | null)?.email)
const userName = computed(() => (user.value as { name?: string | null } | null)?.name)

const isManagingSubscription = ref(false)
async function manageSubscription() {
  isManagingSubscription.value = true
  try {
    const { url } = await $fetch<{ url: string }>('/api/subscriptions/portal', { method: 'POST' })
    if (url) navigateTo(url, { external: true })
  }
  catch { /* silently fail */ }
  finally {
    isManagingSubscription.value = false
  }
}

// Fetch walking stats
interface WalkStats {
  totalWalks: number
  totalDistance: number
  totalDuration: number
}
const { data: stats, error: statsError } = await useFetch<WalkStats>('/api/walks/stats')

const formattedWalks = computed(() => {
  const n = stats.value?.totalWalks ?? 0
  return n === 0 ? '0' : String(n)
})
const formattedDistance = computed(() => {
  const m = stats.value?.totalDistance ?? 0
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
})
const formattedDuration = computed(() => {
  const s = stats.value?.totalDuration ?? 0
  const h = Math.floor(s / 3600)
  const min = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h${min > 0 ? min.toString().padStart(2, '0') : ''}`
  return `${min} min`
})

// Fetch user's dogs
const { data: dogs, error: dogsError, refresh: refreshDogs } = await useFetch<Dog[]>('/api/dogs')

const hasDog = computed(() => dogs.value && dogs.value.length > 0)
const firstDog = computed(() => dogs.value?.[0])

function calculateAge(birthDate: string | null): string {
  if (!birthDate) return ''
  const birth = new Date(birthDate)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const months = now.getMonth() - birth.getMonth()

  if (years === 0) {
    return months <= 1 ? '1 mois' : `${months} mois`
  }
  if (years === 1) {
    return '1 an'
  }
  return `${years} ans`
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()

  toast.add({
    title: 'À bientôt !',
    icon: 'i-heroicons-hand-raised',
    color: 'info',
  })

  await navigateTo('/login')
}
</script>

<template>
  <div class="space-y-6 lg:max-w-2xl lg:mx-auto">
    <div class="text-center py-8 lg:py-12">
      <div class="w-20 h-20 lg:w-24 lg:h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-heroicons-user" class="w-10 h-10 lg:w-12 lg:h-12 text-primary-600" />
      </div>
      <h1 class="text-2xl lg:text-3xl font-bold text-neutral-900">
        {{ userName || 'Mon Profil' }}
      </h1>
      <p class="text-neutral-600 lg:text-lg">
        {{ userEmail }}
      </p>
    </div>

    <!-- Dog + Account cards in grid on desktop -->
    <div class="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
      <!-- Dog Section -->
      <UCard v-if="hasDog && firstDog">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-neutral-900">Mon chien</h2>
            <NuxtLink :to="`/dogs/${firstDog.id}/edit`">
              <UButton size="xs" variant="ghost" icon="i-heroicons-pencil">
                Modifier
              </UButton>
            </NuxtLink>
          </div>
        </template>

        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <span class="text-3xl">🐶</span>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-neutral-900">{{ firstDog.name }}</h3>
            <p class="text-neutral-600">
              {{ firstDog.breed || 'Race non renseignée' }}
              <span v-if="firstDog.birth_date"> · {{ calculateAge(firstDog.birth_date) }}</span>
            </p>
          </div>
        </div>
      </UCard>

      <!-- No Dog - Invitation -->
      <UCard v-else class="border-dashed border-2 border-primary-200 bg-primary-50/50">
        <div class="text-center py-4">
          <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-3xl">🐕</span>
          </div>
          <h3 class="text-lg font-semibold text-neutral-900 mb-2">
            Ajoute ton compagnon !
          </h3>
          <p class="text-neutral-600 mb-4">
            Enregistre ton chien pour personnaliser ton expérience DogWalk
          </p>
          <NuxtLink to="/dogs/new">
            <UButton icon="i-heroicons-plus">
              Ajouter mon chien
            </UButton>
          </NuxtLink>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-neutral-900">Mon compte</h2>
        </template>

        <div class="space-y-4">
          <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-envelope" class="w-5 h-5 text-neutral-500" />
              <span class="text-neutral-700">Email</span>
            </div>
            <span class="text-neutral-500 text-sm truncate ml-4">{{ userEmail }}</span>
          </div>

          <UDivider />

          <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-neutral-500" />
              <span class="text-neutral-700">Abonnement</span>
            </div>
            <div v-if="isPremium" class="flex items-center gap-2">
              <UBadge color="warning" variant="subtle">Premium</UBadge>
              <UButton size="xs" variant="ghost" :loading="isManagingSubscription" @click="manageSubscription">
                Gérer
              </UButton>
            </div>
            <div v-else class="flex items-center gap-2">
              <UBadge color="neutral" variant="subtle">Gratuit</UBadge>
              <UButton size="xs" variant="ghost" to="/premium">
                Passer Premium
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Error states -->
    <UAlert
      v-if="statsError"
      color="warning"
      icon="i-heroicons-exclamation-triangle"
      title="Impossible de charger les statistiques"
    />
    <UAlert
      v-if="dogsError"
      color="warning"
      icon="i-heroicons-exclamation-triangle"
      title="Impossible de charger les données du chien"
    />

    <!-- Streak -->
    <WalkStreakDisplay />

    <!-- Stats this month -->
    <UCard>
      <template #header>
        <h2 class="font-semibold text-neutral-900">Ce mois-ci</h2>
      </template>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <p class="text-2xl font-bold text-primary">{{ formattedWalks }}</p>
          <p class="text-sm text-neutral-600">{{ (stats?.totalWalks ?? 0) <= 1 ? 'Balade' : 'Balades' }}</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-primary">{{ formattedDistance }}</p>
          <p class="text-sm text-neutral-600">Parcourus</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-primary">{{ formattedDuration }}</p>
          <p class="text-sm text-neutral-600">Durée totale</p>
        </div>
      </div>
    </UCard>

    <!-- History link -->
    <UButton
      to="/profile/history"
      variant="soft"
      block
      icon="i-heroicons-clock"
    >
      Mon historique de balades
    </UButton>

    <UButton
      color="error"
      variant="soft"
      block
      icon="i-heroicons-arrow-right-on-rectangle"
      @click="logout"
    >
      Se déconnecter
    </UButton>
  </div>
</template>
