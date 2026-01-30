<script setup lang="ts">
/**
 * Article Detail Page (Story 10.2)
 *
 * Renders a single article with markdown content and prev/next navigation.
 */

const route = useRoute()
const path = computed(() => route.path)

// Fetch article
const { data: article } = await useAsyncData(`article-${path.value}`, () =>
  queryCollection('articles').path(path.value).first(),
)

// Fetch surroundings for prev/next
const { data: surround } = await useAsyncData(`surround-${path.value}`, () =>
  queryCollectionItemSurroundings('articles', path.value),
)

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
}

const categories: Record<string, { label: string; icon: string }> = {
  sante: { label: 'Santé', icon: 'i-lucide-heart' },
  nutrition: { label: 'Nutrition', icon: 'i-lucide-cake' },
  comportement: { label: 'Comportement', icon: 'i-lucide-graduation-cap' },
  equipement: { label: 'Équipement', icon: 'i-lucide-wrench' },
  races: { label: 'Races', icon: 'i-lucide-id-card' },
}

const categoryConfig = computed(() => {
  if (!article.value) return { label: '', icon: 'i-lucide-tag' }
  return categories[article.value.category] || { label: article.value.category, icon: 'i-lucide-tag' }
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: () => article.value ? `${article.value.title} - DogWalk` : 'Article - DogWalk',
  description: () => article.value?.description || '',
  ogTitle: () => article.value?.title || 'Article - DogWalk',
  ogDescription: () => article.value?.description || '',
  ogImage: () => article.value?.image || '',
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: () => article.value?.title || '',
  twitterDescription: () => article.value?.description || '',
  twitterImage: () => article.value?.image || '',
})
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Back button -->
    <UButton
      to="/articles"
      variant="ghost"
      icon="i-lucide-arrow-left"
    >
      Tous les articles
    </UButton>

    <article v-if="article" class="space-y-6">
      <!-- Header -->
      <header class="space-y-3">
        <div class="flex items-center gap-2 text-sm text-neutral-500">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-spring-500/10 text-spring-600 font-medium">
            <UIcon :name="categoryConfig.icon" class="w-3 h-3" />
            {{ categoryConfig.label }}
          </span>
          <span>{{ formatDate(article.publishedAt) }}</span>
        </div>

        <h1 class="text-3xl font-bold text-forest-700">
          {{ article.title }}
        </h1>

        <p class="text-lg text-neutral-600">
          {{ article.description }}
        </p>
      </header>

      <!-- Image -->
      <div v-if="article.image" class="rounded-xl overflow-hidden">
        <img
          :src="article.image"
          :alt="article.title"
          class="w-full object-cover"
        >
      </div>

      <!-- Markdown Content -->
      <div class="prose prose-neutral max-w-none">
        <ContentRenderer :value="article" />
      </div>
    </article>

    <!-- Prev / Next Navigation -->
    <nav v-if="surround" class="border-t border-neutral-200 pt-6">
      <div class="flex justify-between gap-4">
        <NuxtLink
          v-if="surround[0]"
          :to="surround[0].path"
          class="flex-1 group p-4 rounded-lg border border-neutral-200 hover:border-spring-500/50 transition-colors"
        >
          <div class="text-xs text-neutral-500 mb-1">Article précédent</div>
          <div class="font-medium text-forest-700 group-hover:text-spring-500 transition-colors">
            {{ surround[0].title }}
          </div>
        </NuxtLink>
        <div v-else class="flex-1" />

        <NuxtLink
          v-if="surround[1]"
          :to="surround[1].path"
          class="flex-1 group p-4 rounded-lg border border-neutral-200 hover:border-spring-500/50 transition-colors text-right"
        >
          <div class="text-xs text-neutral-500 mb-1">Article suivant</div>
          <div class="font-medium text-forest-700 group-hover:text-spring-500 transition-colors">
            {{ surround[1].title }}
          </div>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
