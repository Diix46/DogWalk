<script setup lang="ts">
const route = useRoute()
const { user } = useUserSession()
const isAdmin = computed(() => (user.value as { is_admin?: boolean } | null)?.is_admin === true)

const sidebarCollapsed = useState('sidebar-collapsed', () => false)

const navItems = [
  { name: 'Accueil', to: '/', icon: 'i-heroicons-home' },
  { name: 'Explorer', to: '/explore', icon: 'i-heroicons-map' },
  { name: 'Articles', to: '/articles', icon: 'i-heroicons-document-text' },
  { name: 'Profil', to: '/profile', icon: 'i-heroicons-user' },
]

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50">
    <!-- Mobile header -->
    <UiAppHeader class="lg:hidden" />

    <div class="lg:flex">
      <!-- Desktop Sidebar -->
      <aside
        class="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-neutral-200/80 z-30 transition-all duration-200"
        :class="sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'"
      >
        <!-- Logo -->
        <div class="flex items-center gap-3 px-4 h-16 border-b border-neutral-100" :class="sidebarCollapsed ? 'justify-center' : 'px-6'">
          <span class="text-2xl">🐕</span>
          <span v-if="!sidebarCollapsed" class="text-xl font-bold tracking-tight text-neutral-900">DogWalk</span>
        </div>

        <!-- Nav links -->
        <nav class="flex-1 px-2 py-6 space-y-1" :class="sidebarCollapsed ? 'px-2' : 'px-3'">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :title="sidebarCollapsed ? item.name : undefined"
            class="group flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            :class="[
              isActive(item.to)
                ? 'bg-primary-50 text-primary-700 shadow-sm'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
              sidebarCollapsed ? 'justify-center px-0' : 'px-3',
            ]"
          >
            <UIcon
              :name="item.icon"
              class="w-5 h-5 shrink-0 transition-colors"
              :class="isActive(item.to) ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-600'"
            />
            <span v-if="!sidebarCollapsed">{{ item.name }}</span>
          </NuxtLink>

          <!-- Admin link -->
          <NuxtLink
            v-if="isAdmin"
            to="/admin"
            :title="sidebarCollapsed ? 'Admin' : undefined"
            class="group flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            :class="[
              isActive('/admin')
                ? 'bg-primary-50 text-primary-700 shadow-sm'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
              sidebarCollapsed ? 'justify-center px-0' : 'px-3',
            ]"
          >
            <UIcon
              name="i-heroicons-cog-6-tooth"
              class="w-5 h-5 shrink-0 transition-colors"
              :class="isActive('/admin') ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-600'"
            />
            <span v-if="!sidebarCollapsed">Admin</span>
          </NuxtLink>
        </nav>

        <!-- Bottom section -->
        <div class="px-4 py-4 border-t border-neutral-100 space-y-3">
          <button
            class="w-full flex items-center justify-center p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors"
            :title="sidebarCollapsed ? 'Ouvrir le menu' : 'Réduire le menu'"
            @click="sidebarCollapsed = !sidebarCollapsed"
          >
            <UIcon
              :name="sidebarCollapsed ? 'i-heroicons-chevron-right' : 'i-heroicons-chevron-left'"
              class="w-5 h-5"
            />
          </button>
          <p v-if="!sidebarCollapsed" class="text-xs text-neutral-400 text-center">DogWalk v1.0</p>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 transition-all duration-200" :class="sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'">
        <div class="px-4 py-6 pb-24 lg:pb-10 lg:px-8 xl:px-12 lg:py-8">
          <slot />
        </div>
      </main>
    </div>

    <!-- Mobile bottom nav -->
    <UiBottomNav class="lg:hidden" />
  </div>
</template>
