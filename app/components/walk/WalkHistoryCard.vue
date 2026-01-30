<script setup lang="ts">
interface Props {
  id: number
  routeName: string
  startedAt: string | number
  durationSeconds: number
  distanceMeters: number
}

const props = defineProps<Props>()

const formattedDate = computed(() => {
  const date = new Date(props.startedAt)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
})

const formattedDuration = computed(() => {
  const minutes = Math.round(props.durationSeconds / 60)
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
  }
  return `${minutes} min`
})

const formattedDistance = computed(() => {
  const km = props.distanceMeters / 1000
  return `${km.toFixed(1)} km`
})
</script>

<template>
  <NuxtLink :to="`/profile/history/${id}`" class="block">
    <div class="flex items-center gap-4 p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
        <span class="text-lg">🐾</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-neutral-900 truncate">{{ routeName }}</p>
        <p class="text-sm text-neutral-500">{{ formattedDate }}</p>
      </div>
      <div class="text-right shrink-0">
        <p class="text-sm font-medium text-neutral-700">{{ formattedDuration }}</p>
        <p class="text-xs text-neutral-500">{{ formattedDistance }}</p>
      </div>
      <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-neutral-400 shrink-0" />
    </div>
  </NuxtLink>
</template>
