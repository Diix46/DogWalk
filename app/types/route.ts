/**
 * Route Types
 *
 * Type definitions for walking routes in DogWalk.
 *
 * @see Story 3.4: Composant RouteCard
 * @see Story 3.6: Recherche par Localisation
 * @see architecture.md#Database Schema
 */

/**
 * Difficulty level for a route
 */
export type DifficultyLevel = 'easy' | 'moderate' | 'difficult'

/**
 * Type of terrain/environment for a route
 */
export type RouteType = 'urban' | 'nature' | 'mixed'

/**
 * Walking route data structure
 */
export interface Route {
  /** Unique identifier */
  id: string
  /** Display name of the route */
  name: string
  /** Optional description */
  description?: string
  /** Estimated duration in minutes */
  duration_minutes: number
  /** Distance in meters */
  distance_meters: number
  /** Difficulty level */
  difficulty: DifficultyLevel
  /** Environment type */
  type: RouteType
  /** Whether this is a premium-only route */
  is_premium: boolean
  /** Center latitude for map display */
  center_lat?: number
  /** Center longitude for map display */
  center_lng?: number
  /** GeoJSON path data */
  geojson_path?: string
  /** Creation timestamp */
  created_at?: string
  /** Distance from user's location in meters (only present when lat/lng provided) */
  distance_from_user?: number
  /** Average rating (1-5) from community reviews */
  avg_rating?: number
  /** Number of reviews */
  review_count?: number
}

/**
 * Difficulty badge configuration
 */
export const DIFFICULTY_CONFIG: Record<DifficultyLevel, { label: string; colorClass: string }> = {
  easy: {
    label: 'Facile',
    colorClass: 'bg-success/10 text-success',
  },
  moderate: {
    label: 'Modéré',
    colorClass: 'bg-warning/10 text-warning',
  },
  difficult: {
    label: 'Difficile',
    colorClass: 'bg-error/10 text-error',
  },
}

/**
 * Route type badge configuration
 */
export const ROUTE_TYPE_CONFIG: Record<RouteType, { label: string; icon: string }> = {
  urban: {
    label: 'Urbain',
    icon: 'i-heroicons-building-office-2',
  },
  nature: {
    label: 'Nature',
    icon: 'i-heroicons-sparkles',
  },
  mixed: {
    label: 'Mixte',
    icon: 'i-heroicons-arrows-right-left',
  },
}
