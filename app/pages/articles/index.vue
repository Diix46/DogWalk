<script setup lang="ts">
/**
 * Articles List Page (Story 10.1)
 *
 * Displays all articles with category filtering.
 * Content managed via Nuxt Content + Nuxt Studio.
 */

const categories = [
  { value: 'sante', label: 'Santé', icon: 'i-heroicons-heart' },
  { value: 'nutrition', label: 'Nutrition', icon: 'i-heroicons-cake' },
  { value: 'comportement', label: 'Comportement', icon: 'i-heroicons-academic-cap' },
  { value: 'equipement', label: 'Équipement', icon: 'i-heroicons-wrench-screwdriver' },
  { value: 'races', label: 'Races', icon: 'i-heroicons-identification' },
]

const selectedCategory = ref<string | null>(null)

function toggleCategory(cat: string) {
  selectedCategory.value = selectedCategory.value === cat ? null : cat
}

// Query all articles
const { data: articles } = await useAsyncData('articles', () => {
  const q = queryCollection('articles').order('publishedAt', 'DESC')
  if (selectedCategory.value) {
    q.where('category', '=', selectedCategory.value)
  }
  return q.all()
}, { watch: [selectedCategory] })

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getCategoryLabel(cat: string): string {
  return categories.find(c => c.value === cat)?.label || cat
}

function getCategoryIcon(cat: string): string {
  return categories.find(c => c.value === cat)?.icon || 'i-heroicons-tag'
}

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Articles - DogWalk',
  description: 'Conseils et articles sur le bien-être animal',
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl lg:text-3xl font-bold text-neutral-900">Articles</h1>
      <p class="text-neutral-600 text-sm lg:text-base">
        Conseils et astuces pour le bien-être de votre compagnon
      </p>
    </div>

    <!-- Category Filters -->
    <div class="flex gap-2 flex-wrap">
      <UButton
        v-for="cat in categories"
        :key="cat.value"
        :variant="selectedCategory === cat.value ? 'solid' : 'outline'"
        :color="selectedCategory === cat.value ? 'primary' : 'neutral'"
        size="sm"
        class="rounded-full"
        @click="toggleCategory(cat.value)"
      >
        <UIcon :name="cat.icon" class="w-4 h-4 mr-1" />
        {{ cat.label }}
      </UButton>
    </div>

    <!-- Articles Grid -->
    <div
      v-if="articles && articles.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <NuxtLink
        v-for="article in articles"
        :key="article.path"
        :to="article.path"
        class="group bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow"
      >
        <!-- Image -->
        <div v-if="article.image" class="aspect-video bg-neutral-100 overflow-hidden">
          <img
            :src="article.image"
            :alt="article.title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          >
        </div>
        <div v-else class="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <UIcon name="i-heroicons-document-text" class="w-12 h-12 text-primary/30" />
        </div>

        <!-- Content -->
        <div class="p-4 space-y-2">
          <!-- Category + Date -->
          <div class="flex items-center gap-2 text-xs text-neutral-500">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              <UIcon :name="getCategoryIcon(article.category)" class="w-3 h-3" />
              {{ getCategoryLabel(article.category) }}
            </span>
            <span>{{ formatDate(article.publishedAt) }}</span>
          </div>

          <!-- Title -->
          <h2 class="font-semibold text-neutral-900 group-hover:text-primary transition-colors line-clamp-2">
            {{ article.title }}
          </h2>

          <!-- Description -->
          <p class="text-sm text-neutral-600 line-clamp-2">
            {{ article.description }}
          </p>
        </div>
      </NuxtLink>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <UIcon name="i-heroicons-document-text" class="w-12 h-12 text-neutral-400 mx-auto mb-3" />
      <p class="text-neutral-600 font-medium">Aucun article trouvé</p>
      <p class="text-neutral-500 text-sm mt-1">
        Revenez bientôt pour découvrir nos conseils !
      </p>
      <UButton
        v-if="selectedCategory"
        variant="outline"
        class="mt-4"
        @click="selectedCategory = null"
      >
        Voir tous les articles
      </UButton>
    </div>
  </div>
</template>
