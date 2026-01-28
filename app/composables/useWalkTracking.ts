/**
 * Walk Tracking Composable
 *
 * Real-time GPS tracking for active walks with path recording.
 * Uses watchPosition for continuous updates during walks.
 *
 * @see Story 4.4: Position GPS Temps Réel
 * @see Story 4.5: Temps et Distance Restants
 */

import type { Ref } from 'vue'

export interface WalkPosition {
  lat: number
  lng: number
  timestamp: number
  accuracy?: number
}

export interface WalkTrackingState {
  /** Current position */
  currentPosition: Ref<WalkPosition | null>
  /** Array of all positions (walked path) */
  walkedPath: Ref<WalkPosition[]>
  /** Whether tracking is active */
  isTracking: Ref<boolean>
  /** Error if tracking failed */
  error: Ref<string | null>
  /** Total distance walked in meters */
  distanceWalked: Ref<number>
  /** Duration in seconds since tracking started */
  durationSeconds: Ref<number>
  /** Start tracking */
  startTracking: () => void
  /** Stop tracking */
  stopTracking: () => void
  /** Get path as GeoJSON LineString */
  getGeoJsonTrack: () => string
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export interface WalkTrackingOptions {
  /** Initial start time (Unix timestamp in seconds) for resuming walks */
  initialStartedAt?: number
  /** Initial distance walked in meters for resuming walks */
  initialDistance?: number
}

/**
 * Composable for tracking walks with real-time GPS
 */
export function useWalkTracking(options: WalkTrackingOptions = {}): WalkTrackingState {
  const currentPosition = ref<WalkPosition | null>(null)
  const walkedPath = ref<WalkPosition[]>([])
  const isTracking = ref(false)
  const error = ref<string | null>(null)
  const distanceWalked = ref(options.initialDistance ?? 0)
  const durationSeconds = ref(0)

  let watchId: number | null = null
  let startTime: number | null = options.initialStartedAt ? options.initialStartedAt * 1000 : null
  let durationInterval: ReturnType<typeof setInterval> | null = null

  // If initial start time provided, calculate initial duration
  if (options.initialStartedAt) {
    durationSeconds.value = Math.floor((Date.now() - options.initialStartedAt * 1000) / 1000)
  }

  /**
   * Handle position update from GPS
   */
  function handlePositionUpdate(position: GeolocationPosition) {
    const newPosition: WalkPosition = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: position.timestamp,
      accuracy: position.coords.accuracy,
    }

    // Calculate distance from last position
    if (walkedPath.value.length > 0) {
      const lastPos = walkedPath.value[walkedPath.value.length - 1]
      if (lastPos) {
        // Only add if moved more than 5 meters (filter GPS jitter)
        const distance = haversineDistance(
          lastPos.lat,
          lastPos.lng,
          newPosition.lat,
          newPosition.lng
        )
        if (distance > 5) {
          distanceWalked.value += distance
          walkedPath.value.push(newPosition)
        }
      }
    }
    else {
      // First position
      walkedPath.value.push(newPosition)
    }

    currentPosition.value = newPosition
    error.value = null
  }

  /**
   * Handle position error
   */
  function handlePositionError(err: GeolocationPositionError) {
    console.error('GPS error:', err.message)
    if (err.code === 1) {
      error.value = 'Permission GPS refusée'
    }
    else if (err.code === 2) {
      error.value = 'Position indisponible'
    }
    else if (err.code === 3) {
      error.value = 'Délai GPS dépassé'
    }
  }

  /**
   * Start GPS tracking
   * @param resuming - If true, don't reset distance/time (resuming after refresh)
   */
  function startTracking(resuming = false) {
    if (!import.meta.client || !('geolocation' in navigator)) {
      error.value = 'GPS non supporté'
      return
    }

    if (isTracking.value) return

    isTracking.value = true
    error.value = null

    // Only reset if not resuming and no initial values were provided
    if (!resuming && !options.initialStartedAt) {
      walkedPath.value = []
      distanceWalked.value = 0
      startTime = Date.now()
    }
    else if (!startTime) {
      // Fallback: if resuming but no startTime, use now
      startTime = Date.now()
    }

    // Start duration counter
    durationInterval = setInterval(() => {
      if (startTime) {
        durationSeconds.value = Math.floor((Date.now() - startTime) / 1000)
      }
    }, 1000)

    // Start watching position
    watchId = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000, // Update at most every second
      }
    )
  }

  /**
   * Stop GPS tracking
   */
  function stopTracking() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }

    if (durationInterval) {
      clearInterval(durationInterval)
      durationInterval = null
    }

    isTracking.value = false
  }

  /**
   * Get walked path as GeoJSON LineString
   */
  function getGeoJsonTrack(): string {
    const coordinates = walkedPath.value.map((pos) => [pos.lng, pos.lat])

    const geojson = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates,
      },
      properties: {
        distance: distanceWalked.value,
        duration: durationSeconds.value,
      },
    }

    return JSON.stringify(geojson)
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopTracking()
  })

  return {
    currentPosition,
    walkedPath,
    isTracking,
    error,
    distanceWalked,
    durationSeconds,
    startTracking,
    stopTracking,
    getGeoJsonTrack,
  }
}
