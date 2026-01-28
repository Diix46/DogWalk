<script setup lang="ts">
import type { Route } from '~/types/route'
import { DIFFICULTY_CONFIG, ROUTE_TYPE_CONFIG } from '~/types/route'

/**
 * RouteCard Component
 *
 * Displays route information in an attractive card following Direction B styling.
 * Used in the explore page to show route suggestions.
 *
 * @see Story 3.4: Composant RouteCard
 * @see Story 3.6: Recherche par Localisation (distance_from_user display)
 * @see ux-design-specification.md - RouteCard Component
 */

interface Props {
  /** Route data to display */
  route: Route
  /** Whether to show premium badge (default: true if route.is_premium) */
  showPremiumBadge?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showPremiumBadge: true,
})

const emit = defineEmits<{
  /** Emitted when the card is clicked */
  click: [route: Route]
}>()

/**
 * Format duration for display
 * "15 min" for < 60, "1h+" for >= 60
 * Returns "-- min" for invalid values
 */
function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) {
    return '-- min'
  }
  if (minutes >= 60) {
    return '1h+'
  }
  return `${Math.round(minutes)} min`
}

/**
 * Format distance in km with 1 decimal
 * "2.5 km"
 * Returns "-- km" for invalid values
 */
function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) {
    return '-- km'
  }
  const km = meters / 1000
  return `${km.toFixed(1)} km`
}

/**
 * Format distance from user for "À X km" display (Story 3.6)
 * Shows meters if < 1km, otherwise km with 1 decimal
 */
function formatDistanceFromUser(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) {
    return ''
  }
  if (meters < 1000) {
    // Round to nearest 100m for cleaner display
    return `À ${Math.round(meters / 100) * 100} m`
  }
  const km = meters / 1000
  return `À ${km.toFixed(1)} km`
}

/**
 * Handle card click - emit event with route data
 */
function handleClick() {
  emit('click', props.route)
}

/**
 * Get difficulty badge config
 */
const difficultyConfig = computed(() => DIFFICULTY_CONFIG[props.route.difficulty])

/**
 * Get route type badge config
 */
const typeConfig = computed(() => ROUTE_TYPE_CONFIG[props.route.type])

/**
 * Show premium badge if route is premium and showPremiumBadge is true
 */
const shouldShowPremiumBadge = computed(() => props.route.is_premium && props.showPremiumBadge)

/**
 * Check if distance from user is available (Story 3.6)
 */
const hasDistanceFromUser = computed(() => props.route.distance_from_user !== undefined)

/**
 * Aria label for accessibility
 */
const ariaLabel = computed(() => {
  const parts = [
    `Parcours ${props.route.name}`,
    formatDuration(props.route.duration_minutes),
    formatDistance(props.route.distance_meters),
    difficultyConfig.value.label,
    typeConfig.value.label,
  ]
  if (shouldShowPremiumBadge.value) {
    parts.push('Premium')
  }
  return parts.join(', ')
})
</script>

<template>
  <article
    role="article"
    :aria-label="ariaLabel"
    tabindex="0"
    class="
      relative
      bg-white rounded-lg shadow-card
      hover:shadow-card-hover focus-visible:shadow-card-hover
      transition-all duration-200
      motion-safe:hover:scale-[1.02]
      motion-safe:active:scale-[0.98]
      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
      cursor-pointer
      p-4
      min-h-[44px]
    "
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Premium Badge (top-right corner) -->
    <div
      v-if="shouldShowPremiumBadge"
      class="absolute top-3 right-3"
    >
      <span
        class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
        role="status"
      >
        <UIcon name="i-heroicons-star-solid" class="w-3 h-3" aria-hidden="true" />
        <span>Premium</span>
      </span>
    </div>

    <!-- Card Content -->
    <div class="flex flex-col gap-3">
      <!-- Route Name -->
      <h3 class="text-lg font-semibold text-neutral-900 line-clamp-2">
        {{ route.name }}
      </h3>

      <!-- Duration and Distance -->
      <div class="flex items-center gap-4 text-sm text-neutral-600">
        <span class="inline-flex items-center gap-1">
          <UIcon name="i-heroicons-clock" class="w-4 h-4" />
          {{ formatDuration(route.duration_minutes) }}
        </span>
        <span class="inline-flex items-center gap-1">
          <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
          {{ formatDistance(route.distance_meters) }}
        </span>
        <!-- Distance from user (Story 3.6) -->
        <span
          v-if="hasDistanceFromUser"
          class="inline-flex items-center gap-1 text-primary"
        >
          <UIcon name="i-heroicons-arrow-trending-up" class="w-4 h-4" />
          {{ formatDistanceFromUser(route.distance_from_user!) }}
        </span>
      </div>

      <!-- Badges Row -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Difficulty Badge -->
        <span
          :class="[
            'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
            difficultyConfig.colorClass
          ]"
        >
          {{ difficultyConfig.label }}
        </span>

        <!-- Type Badge -->
        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 text-neutral-700 text-xs font-medium">
          <UIcon :name="typeConfig.icon" class="w-3 h-3" />
          {{ typeConfig.label }}
        </span>
      </div>
    </div>
  </article>
</template>
