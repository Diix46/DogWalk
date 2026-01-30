<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
  layout: 'auth',
})

const toast = useToast()

const schema = z.object({
  username: z.string()
    .min(3, 'Le username doit contenir au moins 3 caractères')
    .max(30, 'Le username ne doit pas dépasser 30 caractères')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Le username ne peut contenir que des lettres, chiffres, _ et -'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
})

type Schema = z.output<typeof schema>

const state = reactive({
  username: '',
  email: '',
  password: '',
})

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isLoading.value = true
  errorMessage.value = null

  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: event.data,
    })

    toast.add({
      title: 'Compte créé ! Connecte-toi maintenant.',
      icon: 'i-lucide-check-circle',
      color: 'success',
    })

    await navigateTo('/login')
  }
  catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode
    const statusMessage = (error as { statusMessage?: string })?.statusMessage

    if (statusCode === 409) {
      errorMessage.value = statusMessage ?? 'Ce compte existe déjà'
    }
    else if (statusCode === 400) {
      errorMessage.value = statusMessage ?? 'Données invalides'
    }
    else {
      errorMessage.value = 'Une erreur est survenue. Réessaie plus tard.'
    }
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-8">
    <div class="text-center">
      <h2 class="text-3xl font-bold text-forest-700">
        Créer un compte
      </h2>
      <p class="mt-2 text-gray-600">
        Rejoins la communauté DogWalk gratuitement
      </p>
    </div>

    <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
      <UFormField label="Username" name="username" size="lg">
        <UInput
          v-model="state.username"
          placeholder="ton_pseudo"
          autocomplete="username"
          icon="i-lucide-at-sign"
          size="lg"
          class="w-full"
        />
      </UFormField>

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
          placeholder="8 caractères minimum"
          autocomplete="new-password"
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
        Créer mon compte
      </UButton>
    </UForm>

    <p class="text-center text-gray-600">
      Déjà un compte ?
      <NuxtLink
        to="/login"
        class="text-spring-600 font-semibold hover:underline"
      >
        Se connecter
      </NuxtLink>
    </p>
  </div>
</template>
