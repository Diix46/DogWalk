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

const { data: reviews, status, refresh } = useFetch<MyReview[]>('/api/reviews/me')
const toast = useToast()

const isLoading = computed(() => status.value === 'pending')
const isEmpty = computed(() => !isLoading.value && (!reviews.value || reviews.value.length === 0))

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Edit review state
 */
const editingReview = ref<MyReview | null>(null)
const editRating = ref(0)
const editComment = ref('')
const isSubmittingEdit = ref(false)

function startEdit(review: MyReview) {
  editingReview.value = review
  editRating.value = review.rating
  editComment.value = review.comment || ''
}

function cancelEdit() {
  editingReview.value = null
}

async function saveEdit() {
  if (!editingReview.value || editRating.value < 1) return
  isSubmittingEdit.value = true
  try {
    await $fetch('/api/reviews', {
      method: 'POST',
      body: {
        route_id: editingReview.value.route_id,
        rating: editRating.value,
        comment: editComment.value || null,
      },
    })
    toast.add({ title: 'Avis modifié !', icon: 'i-lucide-check-circle', color: 'success' })
    editingReview.value = null
    await refresh()
  }
  catch {
    toast.add({ title: 'Erreur lors de la modification', icon: 'i-lucide-alert-triangle', color: 'error' })
  }
  finally {
    isSubmittingEdit.value = false
  }
}
</script>

<template>
  <div class="space-y-6 lg:max-w-2xl lg:mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <UButton
        to="/profile"
        variant="ghost"
        icon="i-lucide-arrow-left"
        aria-label="Retour"
      />
      <h1 class="text-2xl font-bold text-forest-700">Mes avis</h1>
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
      <div class="w-20 h-20 bg-warmGray-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-lucide-star" class="w-10 h-10 text-neutral-400" />
      </div>
      <h2 class="text-lg font-semibold text-forest-700 mb-2">Tu n'as pas encore laissé d'avis</h2>
      <p class="text-neutral-500 mb-6">Termine une balade pour partager ton avis !</p>
      <UButton to="/explore" icon="i-lucide-search" class="bg-spring-500 hover:bg-spring-600 text-white">
        Explorer les parcours
      </UButton>
    </div>

    <!-- Edit modal -->
    <div
      v-if="editingReview"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="cancelEdit"
    >
      <div class="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
        <h3 class="font-semibold text-forest-700 text-lg">Modifier mon avis</h3>
        <p class="text-sm text-neutral-600">{{ editingReview.route_name }}</p>

        <!-- Star rating -->
        <div class="flex justify-center gap-2">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            class="transition-transform hover:scale-110"
            :aria-label="`${star} étoile${star > 1 ? 's' : ''}`"
            @click="editRating = star"
          >
            <UIcon
              name="i-lucide-star"
              class="w-8 h-8"
              :class="star <= editRating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'"
            />
          </button>
        </div>

        <UTextarea
          v-model="editComment"
          placeholder="Un commentaire ? (optionnel)"
          :rows="3"
        />

        <div class="flex gap-3">
          <UButton
            variant="outline"
            class="flex-1"
            @click="cancelEdit"
          >
            Annuler
          </UButton>
          <UButton
            class="flex-1 bg-spring-500 hover:bg-spring-600 text-white"
            :loading="isSubmittingEdit"
            :disabled="editRating < 1"
            @click="saveEdit"
          >
            Enregistrer
          </UButton>
        </div>
      </div>
    </div>

    <!-- Reviews list -->
    <div v-else class="space-y-3">
      <div
        v-for="review in reviews"
        :key="review.id"
        class="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <NuxtLink :to="`/routes/${review.route_id}`" class="font-semibold text-forest-700 truncate block hover:underline">
              {{ review.route_name }}
            </NuxtLink>
            <div class="flex items-center gap-0.5 mt-0.5">
              <UIcon
                v-for="s in 5"
                :key="s"
                name="i-lucide-star"
                class="w-4 h-4"
                :class="s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'"
              />
            </div>
            <p v-if="review.comment" class="text-sm text-neutral-600 mt-1 line-clamp-2">
              {{ review.comment }}
            </p>
          </div>
          <div class="flex flex-col items-end gap-2">
            <span class="text-xs text-neutral-400 whitespace-nowrap">{{ formatDate(review.created_at) }}</span>
            <UButton
              variant="ghost"
              size="xs"
              icon="i-lucide-pencil"
              class="text-spring-500 hover:text-spring-600"
              aria-label="Modifier cet avis"
              @click="startEdit(review)"
            >
              Modifier
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
