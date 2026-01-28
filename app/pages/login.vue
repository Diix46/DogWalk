<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
  layout: 'auth',
})

const toast = useToast()
const { fetch: fetchSession } = useUserSession()

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type Schema = z.output<typeof schema>

const state = reactive({
  email: '',
  password: '',
})

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isLoading.value = true
  errorMessage.value = null

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: event.data,
    })

    // Refresh client-side session state after server sets the cookie
    await fetchSession()

    toast.add({
      title: 'Bon retour !',
      icon: 'i-heroicons-check-circle',
      color: 'success',
    })

    await navigateTo('/')
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode
    const statusMessage = (error as { statusMessage?: string })?.statusMessage

    if (statusCode === 401) {
      errorMessage.value = 'Email ou mot de passe incorrect'
    } else if (statusCode === 400) {
      errorMessage.value = statusMessage ?? 'Données invalides'
    } else {
      errorMessage.value = 'Une erreur est survenue. Réessaie plus tard.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Left side - Branding -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 p-12 flex-col justify-between">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <span class="text-3xl">🐕</span>
          </div>
          <span class="text-white text-2xl font-bold">DogWalk</span>
        </div>
      </div>

      <div class="space-y-6">
        <h1 class="text-4xl font-bold text-white leading-tight">
          Ravi de te revoir !
        </h1>
        <p class="text-primary-100 text-lg">
          Ton compagnon t'attend pour une nouvelle aventure. Connecte-toi pour découvrir les parcours du jour.
        </p>
        <div class="flex items-center gap-4 text-primary-100">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-map-pin" class="w-5 h-5" />
            <span>Parcours géolocalisés</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-clock" class="w-5 h-5" />
            <span>Adapté à ton temps</span>
          </div>
        </div>
      </div>

      <p class="text-primary-200 text-sm">
        © 2026 DogWalk. Fait avec ❤️ pour les chiens.
      </p>
    </div>

    <!-- Right side - Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-50 dark:bg-gray-900">
      <div class="w-full max-w-md space-y-8">
        <!-- Mobile logo -->
        <div class="lg:hidden text-center">
          <div class="inline-flex items-center gap-3 mb-2">
            <div class="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center">
              <span class="text-2xl">🐕</span>
            </div>
            <span class="text-2xl font-bold text-gray-900 dark:text-white">DogWalk</span>
          </div>
        </div>

        <div class="text-center lg:text-left">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
            Se connecter
          </h2>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Ravi de te revoir !
          </p>
        </div>

        <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
          <UFormField label="Email" name="email" size="lg">
            <UInput
              v-model="state.email"
              type="email"
              placeholder="ton@email.fr"
              autocomplete="email"
              icon="i-heroicons-envelope"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Mot de passe" name="password" size="lg">
            <UInput
              v-model="state.password"
              type="password"
              placeholder="Ton mot de passe"
              autocomplete="current-password"
              icon="i-heroicons-lock-closed"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="errorMessage"
            color="error"
            :title="errorMessage"
            icon="i-heroicons-exclamation-triangle"
          />

          <UButton
            type="submit"
            block
            size="lg"
            :loading="isLoading"
            class="font-semibold"
          >
            Se connecter
          </UButton>
        </UForm>

        <p class="text-center text-gray-600 dark:text-gray-400">
          Pas encore de compte ?
          <NuxtLink
            to="/register"
            class="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
          >
            Créer un compte
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
