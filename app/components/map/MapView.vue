<script setup lang="ts">
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

/**
 * MapView Component
 *
 * Interactive map using MapLibre GL with OpenStreetMap tiles.
 * Supports route display, user position, and recenter functionality.
 *
 * @see Story 3.3: Composant MapView
 * @see architecture.md - MapLibre GL integration
 */

interface RouteGeoJSON {
  type: 'LineString'
  coordinates: [number, number][]
}

interface Props {
  /** Map center [longitude, latitude] */
  center?: [number, number]
  /** Initial zoom level (1-20) */
  zoom?: number
  /** GeoJSON route to display */
  route?: RouteGeoJSON | null
  /** Show user position marker */
  showUserPosition?: boolean
  /** Height of map container */
  height?: string
  /** Show start/end markers on route */
  startEndMarkers?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  center: () => [1.3370, 43.5185], // Villeneuve-Tolosane
  zoom: 13,
  route: null,
  showUserPosition: false,
  height: '400px',
  startEndMarkers: false,
})

const emit = defineEmits<{
  ready: [map: maplibregl.Map]
  moveend: [center: [number, number], zoom: number]
  click: [lngLat: [number, number]]
}>()

// Refs
const mapContainer = ref<HTMLElement>()
const map = shallowRef<maplibregl.Map>()
const isLoading = ref(true)
const mapError = ref(false)
const isLocating = ref(false)
const locationError = ref<string>()

// User position marker
let userMarker: maplibregl.Marker | null = null
// Start/end markers
let startMarker: maplibregl.Marker | null = null
let endMarker: maplibregl.Marker | null = null

/**
 * OpenStreetMap style configuration
 */
const osmStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
}

/**
 * Initialize map on mount
 */
onMounted(() => {
  if (!mapContainer.value) return

  try {
    const mapInstance = new maplibregl.Map({
      container: mapContainer.value,
      style: osmStyle,
      center: props.center,
      zoom: props.zoom,
    })

    // Handle map error
    mapInstance.on('error', () => {
      mapError.value = true
      isLoading.value = false
    })

    // Add navigation controls
    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right')

    // Handle map load
    mapInstance.on('load', () => {
      isLoading.value = false
      emit('ready', mapInstance)

      // Add route if provided
      if (props.route) {
        addRouteLayer(mapInstance, props.route)
      }
    })

    // Handle move end
    mapInstance.on('moveend', () => {
      const center = mapInstance.getCenter()
      emit('moveend', [center.lng, center.lat], mapInstance.getZoom())
    })

    // Handle click
    mapInstance.on('click', (e) => {
      emit('click', [e.lngLat.lng, e.lngLat.lat])
    })

    map.value = mapInstance
  }
  catch {
    mapError.value = true
    isLoading.value = false
  }
})

/**
 * Clean up map on unmount
 */
onUnmounted(() => {
  if (userMarker) {
    userMarker.remove()
    userMarker = null
  }
  startMarker?.remove()
  endMarker?.remove()
  startMarker = null
  endMarker = null
  if (map.value) {
    map.value.remove()
    map.value = undefined
  }
})

/**
 * Watch for route changes
 */
watch(
  () => props.route,
  (newRoute) => {
    if (!map.value || !map.value.isStyleLoaded()) return

    if (newRoute) {
      addRouteLayer(map.value, newRoute)
    } else {
      removeRouteLayer(map.value)
    }
  }
)

/**
 * Watch for center changes
 */
watch(
  () => props.center,
  (newCenter) => {
    if (!map.value) return
    map.value.flyTo({ center: newCenter, duration: 1000 })
  }
)

/**
 * Add route layer to map
 */
function addRouteLayer(mapInstance: maplibregl.Map, geojson: RouteGeoJSON) {
  // Remove existing route if any
  removeRouteLayer(mapInstance)

  mapInstance.addSource('route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: geojson,
      properties: {},
    },
  })

  mapInstance.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    paint: {
      'line-color': '#22C55E', // primary color
      'line-width': 4,
      'line-opacity': 0.8,
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
  })

  // Add start/end markers if enabled
  if (props.startEndMarkers && geojson.coordinates.length >= 2) {
    // Remove existing markers
    startMarker?.remove()
    endMarker?.remove()

    const startCoord = geojson.coordinates[0] as [number, number]
    const endCoord = geojson.coordinates[geojson.coordinates.length - 1] as [number, number]

    const createMarkerEl = (color: string, label: string) => {
      const el = document.createElement('div')
      el.className = 'route-marker'
      el.style.cssText = `width:14px;height:14px;background:${color};border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);`
      el.setAttribute('aria-label', label)
      return el
    }

    startMarker = new maplibregl.Marker({ element: createMarkerEl('#16a34a', 'Départ') })
      .setLngLat(startCoord)
      .addTo(mapInstance)
    endMarker = new maplibregl.Marker({ element: createMarkerEl('#dc2626', 'Arrivée') })
      .setLngLat(endCoord)
      .addTo(mapInstance)
  }

  // Fit bounds to route
  if (geojson.coordinates.length > 0) {
    const bounds = geojson.coordinates.reduce(
      (bounds, coord) => bounds.extend(coord as [number, number]),
      new maplibregl.LngLatBounds(
        geojson.coordinates[0] as [number, number],
        geojson.coordinates[0] as [number, number]
      )
    )
    mapInstance.fitBounds(bounds, { padding: 50, duration: 1000 })
  }
}

/**
 * Remove route layer from map
 */
function removeRouteLayer(mapInstance: maplibregl.Map) {
  if (mapInstance.getLayer('route-line')) {
    mapInstance.removeLayer('route-line')
  }
  if (mapInstance.getSource('route')) {
    mapInstance.removeSource('route')
  }
}

/**
 * Get user's current position
 */
async function getUserPosition(): Promise<[number, number] | null> {
  if (!navigator.geolocation) {
    locationError.value = 'Géolocalisation non disponible'
    return null
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        locationError.value = undefined
        resolve([position.coords.longitude, position.coords.latitude])
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            locationError.value = 'Accès à la position refusé'
            break
          case error.POSITION_UNAVAILABLE:
            locationError.value = 'Position indisponible'
            break
          case error.TIMEOUT:
            locationError.value = 'Délai dépassé'
            break
          default:
            locationError.value = 'Erreur de localisation'
        }
        resolve(null)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  })
}

/**
 * Recenter map on user position
 * Falls back to default center if GPS unavailable (AC #4)
 */
async function recenter() {
  if (!map.value) return

  isLocating.value = true
  locationError.value = undefined

  const position = await getUserPosition()

  if (position) {
    // Update or create user marker
    if (userMarker) {
      userMarker.setLngLat(position)
    } else {
      // Create marker with CSS styling (Tailwind not available in runtime DOM)
      const el = document.createElement('div')
      el.className = 'user-position-marker'
      el.setAttribute('aria-label', 'Ma position')
      userMarker = new maplibregl.Marker({ element: el })
        .setLngLat(position)
        .addTo(map.value)
    }

    // Fly to position
    map.value.flyTo({
      center: position,
      zoom: 15,
      duration: 1500,
    })
  } else {
    // AC #4: Fall back to default center if GPS unavailable
    map.value.flyTo({
      center: props.center,
      zoom: props.zoom,
      duration: 1500,
    })

    // Auto-clear error after 3 seconds
    setTimeout(() => {
      locationError.value = undefined
    }, 3000)
  }

  isLocating.value = false
}

/**
 * Skip link handler - focus on content after map
 */
function skipToContent() {
  const nextElement = mapContainer.value?.nextElementSibling as HTMLElement
  if (nextElement) {
    nextElement.focus()
    nextElement.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="relative" :style="{ height }">
    <!-- Skip link for accessibility -->
    <a
      href="#map-content-after"
      class="
        sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-20
        bg-white px-3 py-2 rounded-lg shadow-card text-spring-500 font-medium
      "
      @click.prevent="skipToContent"
    >
      Passer la carte
    </a>

    <!-- Map error fallback -->
    <div
      v-if="mapError"
      class="absolute inset-0 z-10 bg-warmGray-50 flex items-center justify-center"
    >
      <div class="text-center p-6">
        <UIcon name="i-lucide-map-off" class="w-12 h-12 text-neutral-400 mx-auto mb-3" />
        <p class="text-neutral-600 font-medium">Carte temporairement indisponible</p>
        <p class="text-neutral-500 text-sm mt-1">Veuillez recharger la page ou reessayer plus tard.</p>
      </div>
    </div>

    <!-- Loading overlay -->
    <div
      v-if="isLoading && !mapError"
      class="absolute inset-0 z-10 bg-neutral-100 flex items-center justify-center"
    >
      <div class="text-center">
        <UIcon name="i-lucide-map" class="w-12 h-12 text-neutral-400 animate-pulse" />
        <p class="mt-2 text-neutral-500 text-sm">Chargement de la carte...</p>
      </div>
    </div>

    <!-- Map container -->
    <div
      ref="mapContainer"
      role="application"
      aria-label="Carte interactive des parcours de balade"
      aria-describedby="map-description"
      class="w-full h-full rounded-lg overflow-hidden"
    />

    <!-- Recenter button -->
    <button
      type="button"
      :aria-label="isLocating ? 'Localisation en cours...' : 'Recentrer sur ma position'"
      :disabled="isLocating"
      class="
        absolute bottom-4 right-4 z-10
        w-12 h-12 rounded-lg
        bg-white shadow-card
        hover:shadow-card-hover
        flex items-center justify-center
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-spring-500 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-wait
      "
      @click="recenter"
    >
      <UIcon
        :name="isLocating ? 'i-lucide-loader-2' : 'i-lucide-locate'"
        :class="[
          'w-6 h-6 text-spring-500',
          isLocating && 'animate-spin'
        ]"
      />
    </button>

    <!-- Location error toast -->
    <div
      v-if="locationError"
      class="
        absolute bottom-20 right-4 z-10
        bg-white px-4 py-2 rounded-lg shadow-card
        text-sm text-neutral-700
      "
    >
      {{ locationError }}
    </div>

    <!-- Screen reader description -->
    <div id="map-description" class="sr-only">
      Carte interactive affichant les parcours de balade disponibles.
      Utilisez les gestes tactiles pour zoomer et vous déplacer.
      Le bouton en bas à droite permet de centrer la carte sur votre position.
    </div>

    <!-- Anchor for skip link -->
    <span id="map-content-after" tabindex="-1" class="sr-only">Contenu après la carte</span>
  </div>
</template>

<style>
/* User position marker - using CSS instead of Tailwind (not available in innerHTML) */
.user-position-marker {
  position: relative;
  width: 16px;
  height: 16px;
}

.user-position-marker::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background-color: #22C55E; /* primary color */
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.user-position-marker::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background-color: #22C55E;
  border-radius: 50%;
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .user-position-marker::after {
    animation: none;
  }
}
</style>
