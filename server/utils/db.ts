// NuxtHub v0.10+ exposes db and schema globally in server context
// This file provides type-safe re-exports and a convenience wrapper

export { users } from '../db/schema'
export type { User, NewUser } from '../db/schema'

/**
 * Get the Drizzle database instance
 * NuxtHub v0.10+ auto-imports `db` globally, but this wrapper
 * provides a consistent API and better IDE support
 */
export function useDB() {
  return db
}
