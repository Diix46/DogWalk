<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Premium - DogWalk',
  description: 'Débloquez des parcours exclusifs et des fonctionnalités avancées',
})

const { user } = useUserSession()
const { isPremium } = usePremium()
const toast = useToast()
const isSubscribing = ref(false)

const benefits = [
  {
    icon: 'i-heroicons-map',
    title: 'Parcours exclusifs',
    description: 'Accédez à des parcours nature et longue distance réservés aux membres Premium.',
  },
  {
    icon: 'i-heroicons-sparkles',
    title: 'Statistiques avancées',
    description: 'Suivez vos performances avec des données détaillées sur vos balades.',
  },
  {
    icon: 'i-heroicons-sun',
    title: 'Prévisions météo',
    description: 'Planifiez vos balades avec des prévisions heure par heure.',
  },
  {
    icon: 'i-heroicons-heart',
    title: 'Soutenir DogWalk',
    description: 'Aidez-nous à créer de nouveaux parcours et améliorer l\'app.',
  },
]

async function subscribe() {
  isSubscribing.value = true
  try {
    const { url } = await $fetch<{ url: string }>('/api/subscriptions/checkout', {
      method: 'POST',
    })
    if (url) {
      navigateTo(url, { external: true })
    }
  }
  catch (error) {
    console.error('Checkout error:', error)
    toast.add({
      title: 'Erreur',
      description: 'Impossible de lancer le paiement. Réessaie plus tard.',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'error',
    })
  }
  finally {
    isSubscribing.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-8 py-4">
    <!-- Already Premium Banner -->
    <UAlert
      v-if="isPremium"
      color="success"
      icon="i-heroicons-check-circle"
      title="Tu es déjà membre Premium !"
      description="Tu as accès à tous les parcours et fonctionnalités exclusives."
      class="mb-4"
    />

    <!-- Header -->
    <div class="text-center space-y-3">
      <div class="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-sm font-medium">
        <UIcon name="i-heroicons-star" class="w-4 h-4" />
        Premium
      </div>
      <h1 class="text-3xl font-bold text-neutral-900">
        Explorez sans limites
      </h1>
      <p class="text-neutral-600 text-lg">
        Débloquez l'accès à tous les parcours et profitez d'une expérience complète.
      </p>
    </div>

    <!-- Benefits -->
    <div class="grid gap-4">
      <div
        v-for="benefit in benefits"
        :key="benefit.title"
        class="flex items-start gap-4 p-4 bg-white rounded-xl border border-neutral-100 shadow-sm"
      >
        <div class="flex-shrink-0 w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
          <UIcon :name="benefit.icon" class="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h3 class="font-semibold text-neutral-900">{{ benefit.title }}</h3>
          <p class="text-sm text-neutral-500 mt-0.5">{{ benefit.description }}</p>
        </div>
      </div>
    </div>

    <!-- Pricing Card -->
    <div class="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl p-6 text-center space-y-4 border border-primary-200/50">
      <div>
        <span class="text-4xl font-bold text-neutral-900">9,99€</span>
        <span class="text-neutral-500">/mois</span>
      </div>
      <p class="text-sm text-neutral-600">
        Sans engagement · Annulable à tout moment
      </p>
      <UButton
        v-if="!isPremium"
        size="lg"
        class="w-full justify-center"
        :loading="isSubscribing"
        @click="subscribe"
      >
        Découvrir Premium
      </UButton>
      <UButton
        v-else
        size="lg"
        class="w-full justify-center"
        variant="outline"
        to="/profile"
      >
        Gérer mon abonnement
      </UButton>
    </div>

    <!-- Back link -->
    <div class="text-center">
      <UButton to="/explore" variant="ghost" size="sm">
        Retour à l'exploration
      </UButton>
    </div>
  </div>
</template>
