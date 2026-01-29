/**
 * Overpass API Service (Story 9.2)
 *
 * Queries OpenStreetMap via Overpass API to find walkable paths,
 * parks, and green spaces near a given location.
 */

const OVERPASS_API = 'https://overpass-api.de/api/interpreter'

export interface OsmWay {
  id: number
  type: 'way'
  tags: Record<string, string>
  geometry: { lat: number; lon: number }[]
}

export interface OsmNode {
  id: number
  type: 'node'
  lat: number
  lon: number
  tags?: Record<string, string>
}

export type OsmElement = OsmWay | OsmNode | { type: string; [key: string]: unknown }

interface OverpassResponse {
  elements: OsmElement[]
}

/**
 * Build Overpass QL query to find walkable paths near a location
 */
function buildQuery(lat: number, lng: number, radiusMeters: number): string {
  return `
[out:json][timeout:25];
(
  way["highway"="footway"](around:${radiusMeters},${lat},${lng});
  way["highway"="path"](around:${radiusMeters},${lat},${lng});
  way["highway"="pedestrian"](around:${radiusMeters},${lat},${lng});
  way["leisure"="park"](around:${radiusMeters},${lat},${lng});
  way["leisure"="garden"](around:${radiusMeters},${lat},${lng});
  way["waterway"="riverbank"](around:${radiusMeters},${lat},${lng});
  way["highway"="track"]["tracktype"="grade1"](around:${radiusMeters},${lat},${lng});
  way["highway"="living_street"](around:${radiusMeters},${lat},${lng});
);
out body geom;
`
}

/**
 * Query Overpass API for walkable ways near a location
 */
export async function queryOverpass(lat: number, lng: number, radiusMeters = 3000): Promise<OsmWay[]> {
  const query = buildQuery(lat, lng, radiusMeters)

  const response = await fetch(OVERPASS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  })

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as OverpassResponse

  // Filter to ways with geometry
  return data.elements.filter(
    (el): el is OsmWay => el.type === 'way' && 'geometry' in el && Array.isArray((el as OsmWay).geometry),
  )
}

/**
 * Determine route type from OSM tags
 */
export function classifyWayType(tags: Record<string, string>): 'urban' | 'nature' | 'mixed' {
  if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.natural) return 'nature'
  if (tags.highway === 'path' || tags.highway === 'track') return 'nature'
  if (tags.highway === 'footway' && (tags.surface === 'grass' || tags.surface === 'ground' || tags.surface === 'earth')) return 'nature'
  if (tags.highway === 'pedestrian' || tags.highway === 'living_street') return 'urban'
  return 'mixed'
}

/**
 * Generate an area hash for cache lookup (rounds to ~1km grid)
 */
export function getAreaHash(lat: number, lng: number): string {
  const roundedLat = Math.round(lat * 100) / 100 // ~1.1km precision
  const roundedLng = Math.round(lng * 100) / 100
  return `${roundedLat},${roundedLng}`
}
