<script setup lang="ts">
const { user, loggedIn, clear } = useUserSession()
const router = useRouter()

const userInitials = computed(() => {
  const u = user.value as { username?: string } | null
  if (!u?.username) return '?'
  return u.username.slice(0, 2).toUpperCase()
})

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await router.push('/login')
}

const profileItems = [
  [
    {
      label: 'Mon profil',
      icon: 'i-lucide-user',
      to: '/profile',
    },
  ],
  [
    {
      label: 'Déconnexion',
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      onSelect: logout,
    },
  ],
]
</script>

<template>
  <header class="bg-forest-700 h-14 lg:h-16 px-4 lg:px-6 flex items-center justify-between">
    <NuxtLink to="/" class="flex items-center gap-2">
      <UIcon name="i-lucide-paw-print" class="w-6 h-6 text-spring-400" />
      <span class="text-lg font-bold text-white tracking-tight">DogWalk</span>
    </NuxtLink>

    <div>
      <template v-if="loggedIn">
        <UDropdownMenu :items="profileItems">
          <UAvatar :text="userInitials" size="sm" class="cursor-pointer" />
        </UDropdownMenu>
      </template>
      <template v-else>
        <UButton
          to="/login"
          label="Connexion"
          variant="outline"
          color="neutral"
          size="sm"
          icon="i-lucide-log-in"
          class="text-white border-white/30 hover:bg-white/10"
        />
      </template>
    </div>
  </header>
</template>
