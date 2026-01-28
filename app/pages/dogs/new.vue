<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
  middleware: 'auth',
})

const toast = useToast()

const breeds = [
  { label: 'Labrador Retriever', value: 'Labrador Retriever' },
  { label: 'Berger Allemand', value: 'Berger Allemand' },
  { label: 'Golden Retriever', value: 'Golden Retriever' },
  { label: 'Bouledogue Français', value: 'Bouledogue Français' },
  { label: 'Beagle', value: 'Beagle' },
  { label: 'Caniche', value: 'Caniche' },
  { label: 'Yorkshire Terrier', value: 'Yorkshire Terrier' },
  { label: 'Boxer', value: 'Boxer' },
  { label: 'Teckel', value: 'Teckel' },
  { label: 'Shih Tzu', value: 'Shih Tzu' },
  { label: 'Border Collie', value: 'Border Collie' },
  { label: 'Jack Russell Terrier', value: 'Jack Russell Terrier' },
  { label: 'Cavalier King Charles', value: 'Cavalier King Charles' },
  { label: 'Husky Sibérien', value: 'Husky Sibérien' },
  { label: 'Cocker Anglais', value: 'Cocker Anglais' },
  { label: 'Autre', value: 'Autre' },
]

const schema = z.object({
  name: z.string().min(1, 'Comment s\'appelle ton compagnon ?'),
  breed: z.string().optional(),
  birth_date: z.string().optional(),
})

type Schema = z.output<typeof schema>

const state = reactive({
  name: '',
  breed: '',
  birth_date: '',
})

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isLoading.value = true
  errorMessage.value = null

  try {
    const body: Record<string, string> = { name: event.data.name }
    if (event.data.breed) body.breed = event.data.breed
    if (event.data.birth_date) body.birth_date = event.data.birth_date

    await $fetch('/api/dogs', {
      method: 'POST',
      body,
    })

    toast.add({
      title: `Super ! ${event.data.name} est maintenant inscrit !`,
      icon: 'i-heroicons-check-circle',
      color: 'success',
    })

    await navigateTo('/profile')
  } catch (error) {
    const statusMessage = (error as { statusMessage?: string })?.statusMessage
    errorMessage.value = statusMessage ?? 'Une erreur est survenue. Réessaie plus tard.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto">
    <div class="mb-8">
      <NuxtLink
        to="/profile"
        class="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600"
      >
        <UIcon name="i-heroicons-arrow-left" class="w-5 h-5" />
        Retour au profil
      </NuxtLink>
    </div>

    <div class="text-center mb-8">
      <div class="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
        <span class="text-4xl">🐶</span>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Ajouter ton chien
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Parle-nous de ton compagnon à quatre pattes
      </p>
    </div>

    <UCard>
      <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
        <UFormField label="Nom de ton chien" name="name" required>
          <UInput
            v-model="state.name"
            placeholder="Comment s'appelle-t-il ?"
            icon="i-heroicons-heart"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Race" name="breed" hint="Optionnel">
          <USelect
            v-model="state.breed"
            :items="breeds"
            placeholder="Sélectionne une race"
            icon="i-heroicons-identification"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Date de naissance" name="birth_date" hint="Optionnel">
          <UInput
            v-model="state.birth_date"
            type="date"
            icon="i-heroicons-cake"
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
          Ajouter mon chien
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>
