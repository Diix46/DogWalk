<script setup lang="ts">
interface StreakData {
  streak: number
  last7Days: boolean[]
}

const { data } = useFetch<StreakData>('/api/walks/streak')

const expanded = ref(false)

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

// Build labels for last 7 days starting from 6 days ago
const dayLabels = computed(() => {
  const labels: string[] = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000)
    labels.push(DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]!)
  }
  return labels
})

const streakMessage = computed(() => {
  if (!data.value || data.value.streak === 0) return "C'est reparti !"
  if (data.value.streak === 1) return '1 jour'
  return `${data.value.streak} jours`
})
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-sm p-4 cursor-pointer transition-all"
    role="button"
    tabindex="0"
    aria-label="Streak de balades"
    @click="expanded = !expanded"
    @keydown.enter="expanded = !expanded"
  >
    <!-- Main row -->
    <div class="flex items-center gap-3">
      <span class="text-2xl animate-bounce-subtle">🔥</span>
      <div class="flex-1">
        <p class="text-lg font-bold text-forest-700">{{ streakMessage }}</p>
        <p v-if="data && data.streak === 0" class="text-sm text-neutral-500">Lance une balade pour commencer !</p>
        <p v-else-if="data && data.streak > 0" class="text-sm text-neutral-500">Streak consécutif</p>
      </div>
      <UIcon
        :name="expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        class="w-5 h-5 text-neutral-400"
      />
    </div>

    <!-- Week dots -->
    <div
      v-if="expanded && data"
      class="mt-4 pt-3 border-t border-neutral-100"
    >
      <p class="text-xs text-neutral-500 mb-2">7 derniers jours</p>
      <div class="flex justify-between">
        <div
          v-for="(active, idx) in data.last7Days"
          :key="idx"
          class="flex flex-col items-center gap-1"
        >
          <div
            :class="[
              'w-8 h-8 rounded-full flex items-center justify-center',
              active ? 'bg-spring-500 text-white' : 'bg-neutral-100 text-neutral-400',
            ]"
          >
            <span v-if="active" class="text-sm">✓</span>
            <span v-else class="text-sm">·</span>
          </div>
          <span class="text-[10px] text-neutral-500">{{ dayLabels[idx] }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
.animate-bounce-subtle {
  animation: bounce-subtle 2s ease-in-out infinite;
}
</style>
