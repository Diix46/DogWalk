<script setup lang="ts">
const route = useRoute()

const navItems = [
  { name: 'Dashboard', to: '/admin', icon: 'i-lucide-layout-dashboard' },
  { name: 'Parcours', to: '/admin/routes', icon: 'i-lucide-map' },
  { name: 'Articles', to: '/admin/articles', icon: 'i-lucide-newspaper' },
  { name: 'Utilisateurs', to: '/admin/users', icon: 'i-lucide-users' },
  { name: 'Avis', to: '/admin/reviews', icon: 'i-lucide-message-square' },
]

function isActive(to: string) {
  if (to === '/admin') return route.path === '/admin'
  return route.path.startsWith(to)
}

const mobileMenuOpen = ref(false)
</script>

<template>
  <div class="min-h-screen bg-warmGray-50">
    <!-- Mobile header -->
    <header class="lg:hidden bg-forest-700 h-14 px-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <button
          aria-label="Ouvrir le menu admin"
          class="p-2 text-white/70 hover:text-white"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <UIcon name="i-lucide-menu" class="w-5 h-5" />
        </button>
        <span class="text-lg font-bold text-white">Admin</span>
      </div>
      <NuxtLink to="/explore" class="text-white/70 hover:text-white flex items-center gap-1 text-sm">
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
        App
      </NuxtLink>
    </header>

    <!-- Mobile menu overlay -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="mobileMenuOpen"
          class="fixed inset-0 bg-black/50 z-40 lg:hidden"
          @click="mobileMenuOpen = false"
        />
      </Transition>
      <Transition name="slide">
        <nav
          v-if="mobileMenuOpen"
          class="fixed top-0 left-0 bottom-0 w-64 bg-forest-700 z-50 lg:hidden flex flex-col"
        >
          <div class="flex items-center gap-2 px-4 h-14 border-b border-forest-600">
            <UIcon name="i-lucide-paw-print" class="w-6 h-6 text-spring-400" />
            <span class="text-lg font-bold text-white">DogWalk Admin</span>
          </div>
          <div class="flex-1 px-3 py-4 space-y-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              :class="isActive(item.to) ? 'bg-forest-600 text-white' : 'text-white/70 hover:bg-forest-600/50 hover:text-white'"
              @click="mobileMenuOpen = false"
            >
              <UIcon
                :name="item.icon"
                class="w-5 h-5 shrink-0"
                :class="isActive(item.to) ? 'text-spring-400' : 'text-white/50'"
              />
              {{ item.name }}
            </NuxtLink>
          </div>
          <div class="px-3 py-4 border-t border-forest-600">
            <NuxtLink
              to="/explore"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-forest-600/50 hover:text-white transition-colors"
              @click="mobileMenuOpen = false"
            >
              <UIcon name="i-lucide-arrow-left" class="w-5 h-5 text-white/50" />
              Retour à l'app
            </NuxtLink>
          </div>
        </nav>
      </Transition>
    </Teleport>

    <div class="lg:flex">
      <!-- Desktop sidebar -->
      <aside class="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-60 bg-forest-700 z-30">
        <div class="flex items-center gap-2 px-6 h-16 border-b border-forest-600">
          <UIcon name="i-lucide-paw-print" class="w-6 h-6 text-spring-400 shrink-0" />
          <span class="text-lg font-bold text-white tracking-tight">DogWalk Admin</span>
        </div>

        <nav class="flex-1 px-3 py-6 space-y-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            :class="isActive(item.to) ? 'bg-forest-600 text-white shadow-sm' : 'text-white/70 hover:bg-forest-600/50 hover:text-white'"
          >
            <UIcon
              :name="item.icon"
              class="w-5 h-5 shrink-0 transition-colors"
              :class="isActive(item.to) ? 'text-spring-400' : 'text-white/50 group-hover:text-white/80'"
            />
            {{ item.name }}
          </NuxtLink>
        </nav>

        <div class="px-3 py-4 border-t border-forest-600">
          <NuxtLink
            to="/explore"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-forest-600/50 hover:text-white transition-colors"
          >
            <UIcon name="i-lucide-arrow-left" class="w-5 h-5 text-white/50" />
            Retour à l'app
          </NuxtLink>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 lg:ml-60">
        <div class="px-4 py-6 lg:px-8 lg:py-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 200ms ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
