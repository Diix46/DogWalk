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
const userName = computed(() => (user.value as { username?: string | null } | null)?.username)

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

// Fetch user's review count
const { data: reviewCount } = useFetch<number>('/api/reviews/me/count', { lazy: true })

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
    title: 'A bientot !',
    icon: 'i-lucide-check-circle',
    color: 'info',
  })

  await navigateTo('/explore')
}

// Delete account (RGPD)
const showDeleteModal = ref(false)
const isDeletingAccount = ref(false)

async function deleteAccount() {
  isDeletingAccount.value = true
  try {
    await $fetch('/api/auth/delete-account', { method: 'POST' })
    await clear()

    toast.add({
      title: 'Compte supprime avec succes.',
      icon: 'i-lucide-check-circle',
      color: 'success',
    })

    await navigateTo('/explore')
  } catch {
    toast.add({
      title: 'Erreur lors de la suppression du compte.',
      icon: 'i-lucide-alert-circle',
      color: 'error',
    })
  } finally {
    isDeletingAccount.value = false
    showDeleteModal.value = false
  }
}
</script>

<template>
  <div class="space-y-6 lg:max-w-2xl lg:mx-auto">
    <div class="text-center py-8 lg:py-12">
      <div class="w-20 h-20 lg:w-24 lg:h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-lucide-user" class="w-10 h-10 lg:w-12 lg:h-12 text-primary-600" />
      </div>
      <h1 class="text-2xl lg:text-3xl font-bold text-forest-700">
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
            <h2 class="font-semibold text-forest-700">Mon chien</h2>
            <NuxtLink :to="`/dogs/${firstDog.id}/edit`">
              <UButton size="xs" variant="ghost" icon="i-lucide-pencil">
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
              {{ firstDog.breed || 'Race non renseignee' }}
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
            Enregistre ton chien pour personnaliser ton experience DogWalk
          </p>
          <NuxtLink to="/dogs/new">
            <UButton icon="i-lucide-plus">
              Ajouter mon chien
            </UButton>
          </NuxtLink>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-forest-700">Mon compte</h2>
        </template>

        <div class="space-y-4">
          <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-mail" class="w-5 h-5 text-neutral-500" />
              <span class="text-neutral-700">Email</span>
            </div>
            <span class="text-neutral-500 text-sm truncate ml-4">{{ userEmail }}</span>
          </div>

          <UDivider />

          <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-neutral-500" />
              <span class="text-neutral-700">Abonnement</span>
            </div>
            <div v-if="isPremium" class="flex items-center gap-2">
              <UBadge color="warning" variant="subtle">Premium</UBadge>
              <UButton size="xs" variant="ghost" :loading="isManagingSubscription" @click="manageSubscription">
                Gerer
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
      icon="i-lucide-alert-triangle"
      title="Impossible de charger les statistiques"
    />
    <UAlert
      v-if="dogsError"
      color="warning"
      icon="i-lucide-alert-triangle"
      title="Impossible de charger les donnees du chien"
    />

    <!-- Streak -->
    <WalkStreakDisplay />

    <!-- Stats this month -->
    <UCard>
      <template #header>
        <h2 class="font-semibold text-forest-700">Ce mois-ci</h2>
      </template>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <p class="text-2xl font-bold text-spring-500">{{ formattedWalks }}</p>
          <p class="text-sm text-neutral-600">{{ (stats?.totalWalks ?? 0) <= 1 ? 'Balade' : 'Balades' }}</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-spring-500">{{ formattedDistance }}</p>
          <p class="text-sm text-neutral-600">Parcourus</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-spring-500">{{ formattedDuration }}</p>
          <p class="text-sm text-neutral-600">Duree totale</p>
        </div>
      </div>
    </UCard>

    <!-- History link -->
    <UButton
      to="/profile/history"
      variant="soft"
      block
      icon="i-lucide-clock"
    >
      Mon historique de balades
    </UButton>

    <!-- Reviews link -->
    <UButton
      to="/profile/reviews"
      variant="soft"
      block
      icon="i-lucide-star"
    >
      Mes avis
      <UBadge v-if="reviewCount != null && reviewCount > 0" variant="subtle" size="sm" class="ml-2">{{ reviewCount }}</UBadge>
    </UButton>

    <UButton
      color="error"
      variant="soft"
      block
      icon="i-lucide-log-out"
      @click="logout"
    >
      Se deconnecter
    </UButton>

    <!-- RGPD: Delete account -->
    <div class="pt-6 border-t border-neutral-200">
      <h3 class="text-sm font-semibold text-neutral-500 mb-3">Zone de danger</h3>
      <UButton
        color="error"
        variant="soft"
        block
        icon="i-lucide-trash-2"
        @click="showDeleteModal = true"
      >
        Supprimer mon compte
      </UButton>
    </div>

    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4">
          <h2 class="text-lg font-bold text-neutral-900">Supprimer definitivement ton compte ?</h2>
          <p class="text-neutral-600">
            Toutes tes donnees seront supprimees (balades, avis, chiens). Cette action est irreversible.
          </p>
          <div class="flex gap-3 justify-end">
            <UButton variant="ghost" @click="showDeleteModal = false">
              Annuler
            </UButton>
            <UButton
              color="error"
              :loading="isDeletingAccount"
              @click="deleteAccount"
            >
              Supprimer
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
