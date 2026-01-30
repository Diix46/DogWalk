<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const { user } = useUserSession()
const isAdmin = computed(() => (user.value as { is_admin?: boolean } | null)?.is_admin === true)

interface Stats {
  users: { total: number; premium: number }
  walks: { total: number; completed: number; totalDistance: number; totalDuration: number }
  routes: { total: number; premium: number }
  reviews: { total: number; avgRating: number }
}

interface AdminUser {
  id: number; email: string; name: string | null
  is_premium: number; is_admin: number; streak_count: number
  created_at: number; walk_count: number
}

interface AdminRoute {
  id: string; name: string; difficulty: string; type: string
  is_premium: number; is_active: number; duration_minutes: number
  distance_meters: number; walk_count: number; avg_rating: number | null; review_count: number
}

interface AdminReview {
  id: number; rating: number; comment: string | null; created_at: number
  route_name: string; route_id: string; user_name: string | null; user_email: string
}

interface ContentArticle {
  _path: string
  title: string
  category?: string
  date?: string
  description?: string
}

const { data: stats, status: statsStatus, error: statsError } = await useFetch<Stats>('/api/admin/stats')
const { data: users, status: usersStatus, error: usersError } = await useFetch<AdminUser[]>('/api/admin/users')
const { data: adminRoutes, status: routesStatus, error: routesError, refresh: refreshRoutes } = await useFetch<AdminRoute[]>('/api/admin/routes')

const { data: adminReviews, status: reviewsStatus, error: reviewsError, refresh: refreshReviews } = useFetch<AdminReview[]>('/api/admin/reviews', { lazy: true })

const isLoading = computed(() => statsStatus.value === 'pending' || usersStatus.value === 'pending' || routesStatus.value === 'pending')
const hasError = computed(() => statsError.value || usersError.value || routesError.value || (activeTab.value === 'reviews' && reviewsError.value))

const activeTab = ref('stats')

// User search
const userSearch = ref('')
const filteredUsers = computed(() => {
  if (!users.value) return []
  if (!userSearch.value) return users.value
  const q = userSearch.value.toLowerCase()
  return users.value.filter((u) => {
    return u.email.toLowerCase().includes(q)
      || (u.name && u.name.toLowerCase().includes(q))
  })
})

// Reviews tab filtering
const reviewSearch = ref('')
const reviewRatingFilter = ref(0)

function stars(rating: number): string {
  return '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating)
}

function formatReviewDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const filteredReviews = computed(() => {
  if (!adminReviews.value) return []
  return adminReviews.value.filter((r) => {
    if (Number(reviewRatingFilter.value) > 0 && r.rating !== Number(reviewRatingFilter.value)) return false
    if (reviewSearch.value) {
      const q = reviewSearch.value.toLowerCase()
      const matchName = r.route_name?.toLowerCase().includes(q)
      const matchUser = r.user_name?.toLowerCase().includes(q) || r.user_email.toLowerCase().includes(q)
      if (!matchName && !matchUser) return false
    }
    return true
  })
})

const toast = useToast()

async function deleteReview(id: number) {
  if (!window.confirm('Supprimer cet avis ? Cette action est irr\u00e9versible.')) return
  try {
    await $fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Avis supprim\u00e9', color: 'success' })
    await refreshReviews()
  }
  catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  }
}

const resetUserId = ref<number | null>(null)
const resetPassword = ref('')

async function resetUserPassword() {
  if (!resetUserId.value || resetPassword.value.length < 8) return
  try {
    await $fetch(`/api/admin/users/${resetUserId.value}`, {
      method: 'PATCH',
      body: { newPassword: resetPassword.value },
    })
    toast.add({ title: 'Mot de passe r\u00e9initialis\u00e9', color: 'success' })
    resetUserId.value = null
    resetPassword.value = ''
  }
  catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

async function toggleRoute(routeId: string, field: 'is_active' | 'is_premium', current: number) {
  try {
    await $fetch(`/api/admin/routes/${routeId}`, {
      method: 'PATCH',
      body: { [field]: !current },
    })
    toast.add({ title: 'Parcours mis \u00e0 jour', color: 'success' })
    await refreshRoutes()
  }
  catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600)
  const min = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h${min > 0 ? min.toString().padStart(2, '0') : ''}` : `${min} min`
}

function formatUserDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div v-if="!isAdmin" class="text-center py-16">
    <UIcon name="i-lucide-shield-alert" class="w-12 h-12 text-error mx-auto mb-3" />
    <h1 class="text-xl font-bold text-forest-700">Acces refuse</h1>
    <p class="text-neutral-600 mt-2">Cette page est reservee aux administrateurs.</p>
    <UButton to="/" class="mt-4">Retour a l'accueil</UButton>
  </div>

  <div v-else class="space-y-6 lg:max-w-4xl lg:mx-auto">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-forest-700">Dashboard Admin</h1>
      <UButton
        to="/__nuxt_studio/auth/custom"
        external
        target="_blank"
        icon="i-lucide-pencil"
        variant="soft"
        size="sm"
      >
        Gerer les articles
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <UIcon name="i-lucide-refresh-cw" class="w-6 h-6 text-primary animate-spin" />
    </div>

    <!-- Error -->
    <UAlert
      v-if="hasError"
      color="error"
      icon="i-lucide-alert-triangle"
      title="Erreur de chargement des donnees admin"
    />

    <!-- Tabs -->
    <div class="flex gap-2">
      <UButton
        v-for="tab in [
          { key: 'stats', label: 'Statistiques', icon: 'i-lucide-bar-chart-3' },
          { key: 'users', label: 'Utilisateurs', icon: 'i-lucide-users' },
          { key: 'routes', label: 'Parcours', icon: 'i-lucide-map' },
          { key: 'articles', label: 'Articles', icon: 'i-lucide-file-text' },
          { key: 'reviews', label: 'Avis', icon: 'i-lucide-star' },
        ]"
        :key="tab.key"
        :icon="tab.icon"
        :variant="activeTab === tab.key ? 'solid' : 'ghost'"
        :color="activeTab === tab.key ? 'primary' : 'neutral'"
        :class="activeTab === tab.key ? 'bg-spring-500 hover:bg-spring-600' : ''"
        size="sm"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </UButton>
    </div>

    <!-- Stats Tab -->
    <div v-if="activeTab === 'stats' && stats" class="space-y-4">
      <h2 class="text-lg font-semibold text-forest-700">Statistiques globales</h2>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold text-spring-500">{{ stats.users.total }}</p>
            <p class="text-sm text-neutral-600">Utilisateurs</p>
            <p class="text-xs text-neutral-500">{{ stats.users.premium }} premium</p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold text-spring-500">{{ stats.walks.completed }}</p>
            <p class="text-sm text-neutral-600">Balades terminees</p>
            <p class="text-xs text-neutral-500">{{ stats.walks.total }} au total</p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold text-spring-500">{{ formatDistance(stats.walks.totalDistance) }}</p>
            <p class="text-sm text-neutral-600">Distance totale</p>
            <p class="text-xs text-neutral-500">{{ formatDuration(stats.walks.totalDuration) }} de marche</p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold text-spring-500">{{ stats.routes.total }}</p>
            <p class="text-sm text-neutral-600">Parcours</p>
            <p class="text-xs text-neutral-500">{{ stats.reviews.total }} avis ({{ stats.reviews.avgRating }}★)</p>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Users Tab -->
    <div v-if="activeTab === 'users' && users" class="space-y-3">
      <h2 class="text-lg font-semibold text-forest-700">Gestion des utilisateurs</h2>
      <div class="flex items-center justify-between gap-4">
        <input
          v-model="userSearch"
          type="text"
          placeholder="Rechercher par nom ou email..."
          class="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 w-64"
        >
        <p class="text-sm text-neutral-500">{{ filteredUsers.length }} utilisateur(s)</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-neutral-500">
              <th class="py-2 pr-4">Email</th>
              <th class="py-2 pr-4">Nom</th>
              <th class="py-2 pr-4">Inscription</th>
              <th class="py-2 pr-4">Balades</th>
              <th class="py-2 pr-4">Streak</th>
              <th class="py-2 pr-4">Statut</th>
              <th class="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filteredUsers" :key="u.id" class="border-b border-neutral-100">
              <td class="py-2 pr-4 truncate max-w-[200px]">{{ u.email }}</td>
              <td class="py-2 pr-4">{{ u.name || '-' }}</td>
              <td class="py-2 pr-4 whitespace-nowrap text-neutral-500">{{ formatUserDate(u.created_at) }}</td>
              <td class="py-2 pr-4">{{ u.walk_count }}</td>
              <td class="py-2 pr-4">{{ u.streak_count }}</td>
              <td class="py-2 pr-4 flex gap-1">
                <UBadge v-if="u.is_admin" color="error" variant="subtle" size="xs">Admin</UBadge>
                <UBadge v-if="u.is_premium" color="warning" variant="subtle" size="xs">Premium</UBadge>
                <UBadge v-if="!u.is_premium && !u.is_admin" color="neutral" variant="subtle" size="xs">Gratuit</UBadge>
              </td>
              <td class="py-2">
                <UButton
                  v-if="resetUserId !== u.id"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  icon="i-lucide-key"
                  @click="resetUserId = u.id; resetPassword = ''"
                />
                <div v-else class="flex items-center gap-1">
                  <input
                    v-model="resetPassword"
                    type="text"
                    placeholder="Nouveau mdp"
                    class="w-28 text-xs border rounded px-1.5 py-1"
                  >
                  <UButton size="xs" color="primary" :disabled="resetPassword.length < 8" @click="resetUserPassword()">OK</UButton>
                  <UButton size="xs" variant="ghost" color="neutral" @click="resetUserId = null">X</UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Articles Tab -->
    <div v-if="activeTab === 'articles'" class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-forest-700">Gestion des articles</h2>
        <UButton
          to="/__nuxt_studio/auth/custom"
          external
          target="_blank"
          icon="i-lucide-external-link"
          variant="soft"
          size="sm"
        >
          Ouvrir Nuxt Studio
        </UButton>
      </div>
      <p class="text-sm text-neutral-500">
        Les articles sont geres via Nuxt Content et Nuxt Studio. Utilisez le bouton ci-dessus pour acceder a l'editeur.
      </p>
      <ContentList path="/articles" v-slot="{ list }">
        <div v-if="list && list.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left text-neutral-500">
                <th class="py-2 pr-4">Titre</th>
                <th class="py-2 pr-4">Categorie</th>
                <th class="py-2 pr-4">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="article in list" :key="article._path" class="border-b border-neutral-100">
                <td class="py-2 pr-4">
                  <NuxtLink :to="article._path" class="text-spring-500 hover:underline">
                    {{ article.title }}
                  </NuxtLink>
                </td>
                <td class="py-2 pr-4">
                  <UBadge v-if="article.category" variant="subtle" size="xs">{{ article.category }}</UBadge>
                  <span v-else class="text-neutral-400">-</span>
                </td>
                <td class="py-2 pr-4 text-neutral-500 whitespace-nowrap">{{ article.date || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center py-12">
          <UIcon name="i-lucide-file-text" class="w-10 h-10 text-neutral-400 mx-auto mb-2" />
          <p class="text-neutral-500">Aucun article pour le moment</p>
        </div>
      </ContentList>
    </div>

    <!-- Reviews Tab -->
    <div v-if="activeTab === 'reviews'" class="space-y-4">
      <h2 class="text-lg font-semibold text-forest-700">Moderation des avis</h2>
      <!-- Header stats -->
      <div v-if="stats" class="flex items-center gap-4">
        <p class="text-sm text-neutral-500">
          {{ stats.reviews.total }} avis au total -- note moyenne {{ stats.reviews.avgRating }}★
        </p>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3">
        <input
          v-model="reviewSearch"
          type="text"
          placeholder="Rechercher parcours ou utilisateur..."
          class="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 w-64"
        >
        <select
          v-model="reviewRatingFilter"
          class="text-sm border border-neutral-300 rounded-lg px-3 py-1.5"
        >
          <option :value="0">Toutes les notes</option>
          <option v-for="n in 5" :key="n" :value="n">{{ n }} ★</option>
        </select>
      </div>

      <!-- Loading -->
      <div v-if="reviewsStatus === 'pending'" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-refresh-cw" class="w-6 h-6 text-primary animate-spin" />
      </div>

      <!-- Empty -->
      <div v-else-if="!adminReviews || adminReviews.length === 0" class="text-center py-12">
        <UIcon name="i-lucide-star" class="w-10 h-10 text-neutral-400 mx-auto mb-2" />
        <p class="text-neutral-500">Aucun avis pour le moment</p>
      </div>

      <!-- No filter results -->
      <div v-else-if="filteredReviews.length === 0" class="text-center py-8">
        <p class="text-neutral-500">Aucun avis ne correspond aux filtres</p>
      </div>

      <!-- Reviews table -->
      <div v-else class="overflow-x-auto">
        <p class="text-xs text-neutral-400 mb-2">{{ filteredReviews.length }} resultat(s)</p>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-neutral-500">
              <th class="py-2 pr-4">Parcours</th>
              <th class="py-2 pr-4">Utilisateur</th>
              <th class="py-2 pr-4">Note</th>
              <th class="py-2 pr-4">Commentaire</th>
              <th class="py-2 pr-4">Date</th>
              <th class="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filteredReviews" :key="r.id" class="border-b border-neutral-100">
              <td class="py-2 pr-4 truncate max-w-[180px]">{{ r.route_name }}</td>
              <td class="py-2 pr-4 truncate max-w-[160px]">{{ r.user_name || r.user_email }}</td>
              <td class="py-2 pr-4 text-yellow-400 whitespace-nowrap">{{ stars(r.rating) }}</td>
              <td class="py-2 pr-4 truncate max-w-[250px] text-neutral-600">{{ r.comment || '--' }}</td>
              <td class="py-2 pr-4 whitespace-nowrap text-neutral-500">{{ formatReviewDate(r.created_at) }}</td>
              <td class="py-2">
                <UButton
                  size="xs"
                  variant="ghost"
                  color="error"
                  icon="i-lucide-trash-2"
                  aria-label="Supprimer cet avis"
                  @click="deleteReview(r.id)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Routes Tab -->
    <div v-if="activeTab === 'routes' && adminRoutes" class="space-y-3">
      <h2 class="text-lg font-semibold text-forest-700">Gestion des parcours</h2>
      <p class="text-sm text-neutral-500">{{ adminRoutes.length }} parcours</p>
      <div class="space-y-3">
        <UCard v-for="r in adminRoutes" :key="r.id" class="!p-3">
          <div class="flex items-center justify-between gap-4">
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-neutral-900 truncate">{{ r.name }}</h3>
              <div class="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                <span>{{ r.duration_minutes }} min</span>
                <span>{{ formatDistance(r.distance_meters) }}</span>
                <span>{{ r.walk_count }} balades</span>
                <span v-if="r.avg_rating">{{ Math.round(r.avg_rating * 10) / 10 }}★ ({{ r.review_count }})</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <UButton
                :variant="r.is_premium ? 'solid' : 'ghost'"
                :color="r.is_premium ? 'warning' : 'neutral'"
                size="xs"
                @click="toggleRoute(r.id, 'is_premium', r.is_premium)"
              >
                Premium
              </UButton>
              <UButton
                :variant="r.is_active ? 'solid' : 'ghost'"
                :color="r.is_active ? 'success' : 'error'"
                size="xs"
                @click="toggleRoute(r.id, 'is_active', r.is_active)"
              >
                {{ r.is_active ? 'Actif' : 'Inactif' }}
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
