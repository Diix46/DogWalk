<script setup lang="ts">
/**
 * TimeSelector Component
 *
 * Quick time selection for "How much time do you have?" interaction.
 * Follows Direction B "Friendly & Playful" design with pills, soft shadows,
 * and micro-animations.
 *
 * @see Story 3.2: Composant TimeSelector
 * @see UX Design Specification - TimeSelector Component
 */

interface Props {
  /** Currently selected duration in minutes */
  modelValue?: number
  /** Available time options in minutes */
  options?: number[]
  /** Disable the entire selector */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  options: () => [15, 30, 45, 60],
  disabled: false,
})

const emit = defineEmits<{
  /** Emitted when a time option is selected */
  'update:modelValue': [value: number]
}>()

// Track focused index for keyboard navigation
const focusedIndex = ref(0)
const containerRef = ref<HTMLElement>()

/**
 * Format duration for display
 * Shows "1h+" for 60+ minutes, otherwise "Xmin"
 */
function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    return '1h+'
  }
  return `${minutes}min`
}

/**
 * Handle option selection
 */
function selectOption(minutes: number) {
  if (props.disabled) return
  emit('update:modelValue', minutes)
}

/**
 * Compute button classes based on state
 */
function getButtonClasses(option: number): string {
  const isSelected = props.modelValue === option

  const baseClasses = [
    // Base styles - Direction B "Friendly & Playful"
    'px-5 py-3 min-h-[44px] min-w-[80px]',
    'rounded-lg font-medium text-base',
    'transition-all duration-200',
    // Respect reduced motion
    'motion-safe:ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]',
    // Focus ring for keyboard users
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  ]

  const selectedClasses = isSelected
    ? [
        // Selected state
        'bg-primary text-white shadow-card-hover',
        'motion-safe:scale-105',
      ]
    : [
        // Default state
        'bg-white text-neutral-700 shadow-card',
        'hover:shadow-card-hover hover:bg-neutral-50',
      ]

  const stateClasses = [
    // Disabled state
    props.disabled ? 'opacity-50 cursor-not-allowed' : '',
    // Active press state (respects reduced motion)
    !props.disabled ? 'motion-safe:active:scale-95' : '',
  ]

  return [...baseClasses, ...selectedClasses, ...stateClasses].filter(Boolean).join(' ')
}

/**
 * Handle keyboard navigation
 * - ArrowLeft/ArrowRight: Move focus
 * - Space/Enter: Select focused option
 */
function handleKeydown(event: KeyboardEvent) {
  if (props.disabled) return

  const optionsCount = props.options.length

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault()
      focusedIndex.value = (focusedIndex.value + 1) % optionsCount
      focusButton(focusedIndex.value)
      break

    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault()
      focusedIndex.value = (focusedIndex.value - 1 + optionsCount) % optionsCount
      focusButton(focusedIndex.value)
      break

    case ' ':
    case 'Enter':
      event.preventDefault()
      const selectedOption = props.options[focusedIndex.value]
      if (selectedOption !== undefined) {
        selectOption(selectedOption)
      }
      break
  }
}

/**
 * Focus a button by index
 */
function focusButton(index: number) {
  const buttons = containerRef.value?.querySelectorAll('button')
  buttons?.[index]?.focus()
}

/**
 * Update focused index when a button receives focus
 */
function handleFocus(index: number) {
  focusedIndex.value = index
}
</script>

<template>
  <div
    ref="containerRef"
    role="radiogroup"
    aria-label="Sélectionner la durée de balade"
    class="flex flex-wrap justify-center gap-3"
    @keydown="handleKeydown"
  >
    <button
      v-for="(option, index) in options"
      :key="option"
      type="button"
      role="radio"
      :aria-checked="modelValue === option"
      :tabindex="index === focusedIndex ? 0 : -1"
      :disabled="disabled"
      :class="getButtonClasses(option)"
      @click="selectOption(option)"
      @focus="handleFocus(index)"
    >
      {{ formatDuration(option) }}
    </button>
  </div>
</template>
