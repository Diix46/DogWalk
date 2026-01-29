<script setup lang="ts">
const route = useRoute()

const tabs = [
  { name: 'Accueil', to: '/', icon: 'i-heroicons-home' },
  { name: 'Explorer', to: '/explore', icon: 'i-heroicons-map' },
  { name: 'Articles', to: '/articles', icon: 'i-heroicons-document-text' },
  { name: 'Profil', to: '/profile', icon: 'i-heroicons-user' },
]

function isActive(to: string) {
  if (to === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(to)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 pb-safe">
    <div class="flex justify-around items-center h-16">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex flex-col items-center justify-center min-w-[80px] min-h-[44px] py-2 transition-colors"
        :class="isActive(tab.to) ? 'text-primary-600' : 'text-neutral-500 hover:text-neutral-700'"
      >
        <UIcon :name="tab.icon" class="w-6 h-6" />
        <span class="text-xs mt-1 font-medium">{{ tab.name }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
