/**
 * Route Builder (Story 9.3)
 *
 * Assembles OSM ways into walkable loop routes of various durations.
 * Uses Haversine distance and walking speed to estimate duration.
 */

import type { OsmWay } from './overpass'
import { classifyWayType } from './overpass'

const WALK_SPEED_KMH = 4.5 // Average dog walking speed
const WALK_SPEED_MPS = WALK_SPEED_KMH / 3.6

/** Target durations in minutes for route generation */
const TARGET_DURATIONS = [15, 30, 45, 60, 75]

export interface GeneratedRoute {
  name: string
  description: string
  duration_minutes: number
  distance_meters: number
  difficulty: 'easy' | 'medium' | 'hard'
  type: 'urban' | 'nature' | 'mixed'
  geojson_path: string // JSON stringified GeoJSON LineString
  center_lat: number
  center_lng: number
}

/**
 * Haversine distance between two points in meters
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Calculate total length of a way in meters
 */
function wayLength(way: OsmWay): number {
  let total = 0
  for (let i = 1; i < way.geometry.length; i++) {
    total += haversineDistance(
      way.geometry[i - 1].lat, way.geometry[i - 1].lon,
      way.geometry[i].lat, way.geometry[i].lon,
    )
  }
  return total
}

/**
 * Calculate center point of coordinates
 */
function centerOf(coords: { lat: number; lon: number }[]): { lat: number; lon: number } {
  const sum = coords.reduce((acc, c) => ({ lat: acc.lat + c.lat, lon: acc.lon + c.lon }), { lat: 0, lon: 0 })
  return { lat: sum.lat / coords.length, lon: sum.lon / coords.length }
}

/**
 * Build a GeoJSON LineString from coordinates
 */
function toGeoJSON(coords: { lat: number; lon: number }[]): string {
  return JSON.stringify({
    type: 'LineString',
    coordinates: coords.map(c => [c.lon, c.lat]),
  })
}

/**
 * Determine difficulty based on distance
 */
function getDifficulty(distanceMeters: number): 'easy' | 'medium' | 'hard' {
  if (distanceMeters < 2000) return 'easy'
  if (distanceMeters < 4000) return 'medium'
  return 'hard'
}

/**
 * Find the closest way endpoint to a given point
 */
function closestWayTo(
  ways: OsmWay[],
  point: { lat: number; lon: number },
  exclude: Set<number>,
): OsmWay | null {
  let best: OsmWay | null = null
  let bestDist = Infinity

  for (const way of ways) {
    if (exclude.has(way.id)) continue
    const start = way.geometry[0]
    const end = way.geometry[way.geometry.length - 1]
    const dStart = haversineDistance(point.lat, point.lon, start.lat, start.lon)
    const dEnd = haversineDistance(point.lat, point.lon, end.lat, end.lon)
    const d = Math.min(dStart, dEnd)
    if (d < bestDist) {
      bestDist = d
      best = way
    }
  }

  return bestDist < 200 ? best : null // Only connect ways within 200m
}

/**
 * Chain nearby ways together to form a longer path
 */
function chainWays(
  startWay: OsmWay,
  allWays: OsmWay[],
  targetDistanceMeters: number,
): { coords: { lat: number; lon: number }[]; ways: OsmWay[]; totalDistance: number } {
  const usedIds = new Set<number>([startWay.id])
  const coords = [...startWay.geometry]
  const usedWays = [startWay]
  let totalDistance = wayLength(startWay)

  // Extend from the end
  while (totalDistance < targetDistanceMeters) {
    const lastPoint = coords[coords.length - 1]
    const next = closestWayTo(allWays, lastPoint, usedIds)
    if (!next) break

    usedIds.add(next.id)
    usedWays.push(next)

    // Determine which end of next way is closer to our last point
    const startDist = haversineDistance(lastPoint.lat, lastPoint.lon, next.geometry[0].lat, next.geometry[0].lon)
    const endDist = haversineDistance(lastPoint.lat, lastPoint.lon, next.geometry[next.geometry.length - 1].lat, next.geometry[next.geometry.length - 1].lon)

    const nextCoords = startDist <= endDist ? next.geometry : [...next.geometry].reverse()
    coords.push(...nextCoords)
    totalDistance += wayLength(next)
  }

  return { coords, ways: usedWays, totalDistance }
}

/**
 * Create a loop by appending a return path (reverse or direct return)
 */
function makeLoop(coords: { lat: number; lon: number }[]): { lat: number; lon: number }[] {
  // If start and end are already close (< 100m), it's already a loop
  const start = coords[0]
  const end = coords[coords.length - 1]
  const closingDist = haversineDistance(start.lat, start.lon, end.lat, end.lon)

  if (closingDist < 100) return coords

  // Otherwise create an out-and-back route
  const reversed = [...coords].reverse().slice(1) // Skip first point (duplicate)
  return [...coords, ...reversed]
}

/**
 * Generate a descriptive name for a route based on OSM tags
 */
function generateName(ways: OsmWay[], center: { lat: number; lon: number }): string {
  // Try to find a named feature
  for (const way of ways) {
    if (way.tags?.name) return `Balade ${way.tags.name}`
  }

  // Fallback based on type
  const types = ways.map(w => classifyWayType(w.tags || {}))
  const dominant = types.reduce((acc, t) => {
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const mainType = Object.entries(dominant).sort((a, b) => b[1] - a[1])[0]?.[0] || 'mixed'

  const typeNames: Record<string, string> = {
    nature: 'Balade nature',
    urban: 'Balade urbaine',
    mixed: 'Balade mixte',
  }

  return `${typeNames[mainType]} (${center.lat.toFixed(3)}, ${center.lon.toFixed(3)})`
}

/**
 * Generate description based on route characteristics
 */
function generateDescription(type: string, durationMin: number, distanceM: number): string {
  const typeDesc: Record<string, string> = {
    nature: 'Parcours en pleine nature',
    urban: 'Parcours urbain',
    mixed: 'Parcours mixte ville/nature',
  }
  const base = typeDesc[type] || 'Parcours'
  return `${base} de ${durationMin} min (${(distanceM / 1000).toFixed(1)} km). Itinéraire généré automatiquement à partir des chemins OpenStreetMap.`
}

/**
 * Main entry point: generate routes from OSM ways
 *
 * Takes a list of OSM ways and produces multiple routes targeting different durations.
 */
export function buildRoutes(ways: OsmWay[]): GeneratedRoute[] {
  if (ways.length === 0) return []

  const routes: GeneratedRoute[] = []
  const usedStartWays = new Set<number>()

  for (const targetMin of TARGET_DURATIONS) {
    const targetDistance = (targetMin / 60) * WALK_SPEED_KMH * 1000 // meters for one direction
    const halfTarget = targetDistance / 2 // For out-and-back

    // Find a good starting way (longest unused, or any unused)
    const sortedWays = [...ways]
      .filter(w => !usedStartWays.has(w.id))
      .sort((a, b) => wayLength(b) - wayLength(a))

    const startWay = sortedWays[0]
    if (!startWay) break

    usedStartWays.add(startWay.id)

    // Chain ways to reach target distance
    const chain = chainWays(startWay, ways, halfTarget)

    // Make a loop
    const loopCoords = makeLoop(chain.coords)
    const loopDistance = chain.totalDistance * 2 // Approximate for out-and-back
    const actualDistance = Math.min(loopDistance, targetDistance * 1.3) // Cap at 130% of target

    // Calculate actual duration
    const durationMin = Math.round(actualDistance / WALK_SPEED_MPS / 60)

    // Only keep if duration is reasonable (at least 50% of target)
    if (durationMin < targetMin * 0.5) continue

    const center = centerOf(loopCoords)
    const wayTypes = chain.ways.map(w => classifyWayType(w.tags || {}))
    const typeCounts = wayTypes.reduce((acc, t) => {
      acc[t] = (acc[t] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const routeType = (Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'mixed') as 'urban' | 'nature' | 'mixed'

    routes.push({
      name: generateName(chain.ways, center),
      description: generateDescription(routeType, durationMin, Math.round(actualDistance)),
      duration_minutes: durationMin,
      distance_meters: Math.round(actualDistance),
      difficulty: getDifficulty(actualDistance),
      type: routeType,
      geojson_path: toGeoJSON(loopCoords),
      center_lat: center.lat,
      center_lng: center.lon,
    })
  }

  return routes
}
