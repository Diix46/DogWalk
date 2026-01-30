<script setup lang="ts">
const route = useRoute()

const tabs = [
  { name: 'Explorer', to: '/explore', icon: 'i-lucide-compass' },
  { name: 'Balades', to: '/walks', icon: 'i-lucide-footprints' },
  { name: 'Articles', to: '/articles', icon: 'i-lucide-newspaper' },
  { name: 'Profil', to: '/profile', icon: 'i-lucide-user' },
]

function isActive(to: string) {
  return route.path.startsWith(to)
}
</script>

<template>
  <nav aria-label="Navigation principale" class="fixed bottom-0 left-0 right-0 bg-white border-t border-warmGray-200 pb-safe">
    <div class="flex justify-around items-center h-16">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] py-2 transition-colors"
        :class="isActive(tab.to) ? 'text-spring-500' : 'text-warmGray-400 hover:text-warmGray-600'"
      >
        <UIcon :name="tab.icon" class="w-6 h-6" />
        <span class="text-xs mt-1 font-medium">{{ tab.name }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
