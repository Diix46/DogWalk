<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
  middleware: 'auth',
})

interface Dog {
  id: number
  name: string
  breed: string | null
  birth_date: string | null
}

const route = useRoute()
const toast = useToast()

const dogId = computed(() => route.params.id as string)

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

const { data: dog, status } = await useFetch<Dog>(`/api/dogs/${dogId.value}`)

const state = reactive({
  name: dog.value?.name || '',
  breed: dog.value?.breed || '',
  birth_date: dog.value?.birth_date || '',
})

watch(dog, (newDog) => {
  if (newDog) {
    state.name = newDog.name
    state.breed = newDog.breed || ''
    state.birth_date = newDog.birth_date || ''
  }
}, { immediate: true })

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isLoading.value = true
  errorMessage.value = null

  try {
    const body: Record<string, string> = { name: event.data.name }
    if (event.data.breed) body.breed = event.data.breed
    if (event.data.birth_date) body.birth_date = event.data.birth_date

    await $fetch(`/api/dogs/${dogId.value}`, {
      method: 'PUT',
      body,
    })

    toast.add({
      title: `Profil de ${event.data.name} mis à jour !`,
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
        Modifier {{ dog?.name || 'ton chien' }}
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Mets à jour les informations de ton compagnon
      </p>
    </div>

    <UCard v-if="status === 'pending'">
      <div class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
      </div>
    </UCard>

    <UCard v-else-if="dog">
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
          Enregistrer les modifications
        </UButton>
      </UForm>
    </UCard>

    <UCard v-else>
      <div class="text-center py-8">
        <UIcon name="i-heroicons-exclamation-circle" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-600">Chien non trouvé</p>
        <NuxtLink to="/profile" class="text-primary-600 hover:underline">
          Retour au profil
        </NuxtLink>
      </div>
    </UCard>
  </div>
</template>
