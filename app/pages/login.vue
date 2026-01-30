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
      icon: 'i-lucide-check-circle',
      color: 'success',
    })

    await navigateTo('/explore')
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode
    const statusMessage = (error as { statusMessage?: string })?.statusMessage

    if (statusCode === 401) {
      errorMessage.value = 'Email ou mot de passe incorrect'
    } else if (statusCode === 429) {
      errorMessage.value = statusMessage ?? 'Trop de tentatives. Réessaie dans une minute.'
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
  <div class="w-full max-w-md mx-auto space-y-8">
    <div class="text-center">
      <h2 class="text-3xl font-bold text-forest-700">
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
          icon="i-lucide-mail"
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
          icon="i-lucide-lock"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <UAlert
        v-if="errorMessage"
        color="error"
        :title="errorMessage"
        icon="i-lucide-alert-circle"
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
        class="text-spring-600 font-semibold hover:underline"
      >
        Créer un compte
      </NuxtLink>
    </p>
  </div>
</template>
