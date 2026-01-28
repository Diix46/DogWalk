/**
 * Geolocation Composable
 *
 * Wrapper around the browser's Geolocation API with reactive state.
 * Provides user coordinates for location-based route filtering.
 *
 * @see Story 3.6: Recherche par Localisation
 * @see architecture.md#composables/useGeolocation.ts
 */

import type { Ref } from 'vue'

export interface GeolocationCoords {
  lat: number
  lng: number
}

export interface GeolocationState {
  /** Current coordinates (null if not available) */
  coords: Ref<GeolocationCoords | null>
  /** Error if geolocation failed */
  error: Ref<GeolocationPositionError | null>
  /** Whether currently fetching position */
  isLoading: Ref<boolean>
  /** Whether geolocation is supported by the browser */
  isSupported: boolean
  /** Whether user has denied permission */
  isPermissionDenied: Ref<boolean>
  /** Request current position */
  getCurrentPosition: () => Promise<void>
  /** Clear cached position */
  clearPosition: () => void
}

/**
 * Composable for accessing user's geolocation
 *
 * @example
 * ```vue
 * <script setup>
 * const { coords, error, isLoading, getCurrentPosition } = useGeolocation()
 *
 * onMounted(() => {
 *   getCurrentPosition()
 * })
 * </script>
 * ```
 */
export function useGeolocation(): GeolocationState {
  const coords = ref<GeolocationCoords | null>(null)
  const error = ref<GeolocationPositionError | null>(null)
  const isLoading = ref(false)
  const isPermissionDenied = ref(false)

  // Check if geolocation is supported (only on client)
  const isSupported = import.meta.client ? 'geolocation' in navigator : false

  /**
   * Request current position from the browser
   * Caches result for 1 minute (maximumAge)
   */
  async function getCurrentPosition(): Promise<void> {
    if (!isSupported) {
      error.value = {
        code: 0,
        message: 'Geolocation not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000, // 10 seconds timeout
          maximumAge: 60000, // Cache for 1 minute
        })
      })

      coords.value = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }
      isPermissionDenied.value = false
    } catch (e) {
      const geoError = e as GeolocationPositionError
      error.value = geoError

      // Track permission denied specifically
      if (geoError.code === 1) {
        // PERMISSION_DENIED
        isPermissionDenied.value = true
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear the cached position
   */
  function clearPosition(): void {
    coords.value = null
    error.value = null
    isPermissionDenied.value = false
  }

  return {
    coords,
    error,
    isLoading,
    isSupported,
    isPermissionDenied,
    getCurrentPosition,
    clearPosition,
  }
}
