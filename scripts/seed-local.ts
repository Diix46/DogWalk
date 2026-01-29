/**
 * Seed local SQLite database with test data.
 * Usage: npx tsx scripts/seed-local.ts
 *
 * Creates:
 * - 1 admin user (admin@dogwalk.test / Admin123!)
 * - 1 premium user (premium@dogwalk.test / Premium123!)
 * - 1 regular user (user@dogwalk.test / User1234!)
 * - 15 routes (including 3 premium)
 * - 2 dogs
 * - Sample walks + reviews
 */

import Database from 'better-sqlite3'
import { resolve } from 'node:path'
import { sampleRoutes } from '../server/db/seed-routes'

const DB_PATH = resolve(import.meta.dirname!, '..', '.data', 'db', 'sqlite.db')

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// --- Password hashing (Node.js compatible PBKDF2, same as server) ---
async function createPasswordHash(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    32 * 8,
  )
  const toHex = (buf: ArrayBuffer) =>
    [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
  return `${toHex(salt.buffer)}:${toHex(hash)}`
}

async function seed() {
  const now = Math.floor(Date.now() / 1000)

  console.log('Seeding database at', DB_PATH)

  // --- Users ---
  const adminHash = await createPasswordHash('Admin123!')
  const premiumHash = await createPasswordHash('Premium123!')
  const userHash = await createPasswordHash('User1234!')

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (email, password_hash, name, streak_count, is_premium, premium_until, is_admin, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertUser.run('admin@dogwalk.test', adminHash, 'Admin DogWalk', 5, 1, '2027-01-01', 1, now, now)
  insertUser.run('premium@dogwalk.test', premiumHash, 'Marie Premium', 12, 1, '2027-01-01', 0, now, now)
  insertUser.run('user@dogwalk.test', userHash, 'Lucas Testeur', 3, 0, null, 0, now, now)

  const adminId = (db.prepare(`SELECT id FROM users WHERE email = 'admin@dogwalk.test'`).get() as { id: number }).id
  const premiumId = (db.prepare(`SELECT id FROM users WHERE email = 'premium@dogwalk.test'`).get() as { id: number }).id
  const userId = (db.prepare(`SELECT id FROM users WHERE email = 'user@dogwalk.test'`).get() as { id: number }).id

  console.log(`✓ Users: admin(${adminId}), premium(${premiumId}), user(${userId})`)

  // --- Dogs ---
  const insertDog = db.prepare(`
    INSERT OR IGNORE INTO dogs (user_id, name, breed, birth_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  insertDog.run(userId, 'Rex', 'Berger Allemand', '2022-03-15', now, now)
  insertDog.run(premiumId, 'Luna', 'Golden Retriever', '2021-07-22', now, now)
  console.log('✓ Dogs: Rex, Luna')

  // --- Routes ---
  const insertRoute = db.prepare(`
    INSERT OR IGNORE INTO routes (id, name, description, duration_minutes, distance_meters, difficulty, type, is_premium, is_active, geojson_path, center_lat, center_lng, source, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 'curated', ?, ?)
  `)

  const routeIds: string[] = []
  for (const r of sampleRoutes) {
    const id = crypto.randomUUID()
    const isoNow = new Date().toISOString()
    insertRoute.run(id, r.name, r.description, r.duration_minutes, r.distance_meters, r.difficulty, r.type, r.is_premium ? 1 : 0, r.geojson_path, r.center_lat, r.center_lng, isoNow, isoNow)
    routeIds.push(id)
  }
  console.log(`✓ Routes: ${routeIds.length} parcours insérés`)

  // --- Walks (quelques balades complétées) ---
  const insertWalk = db.prepare(`
    INSERT INTO walks (user_id, route_id, started_at, finished_at, distance_meters, duration_seconds, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const day = 86400
  // User a fait 3 balades
  insertWalk.run(userId, routeIds[0], now - day * 3, now - day * 3 + 1200, 1400, 1200, 'completed', now - day * 3)
  insertWalk.run(userId, routeIds[1], now - day * 2, now - day * 2 + 2100, 2600, 2100, 'completed', now - day * 2)
  insertWalk.run(userId, routeIds[2], now - day * 1, now - day * 1 + 900, 900, 900, 'completed', now - day * 1)

  // Premium a fait 5 balades
  insertWalk.run(premiumId, routeIds[0], now - day * 5, now - day * 5 + 1200, 1400, 1200, 'completed', now - day * 5)
  insertWalk.run(premiumId, routeIds[3], now - day * 4, now - day * 4 + 2700, 3800, 2700, 'completed', now - day * 4)
  insertWalk.run(premiumId, routeIds[6], now - day * 3, now - day * 3 + 3600, 4800, 3600, 'completed', now - day * 3)
  insertWalk.run(premiumId, routeIds[4], now - day * 2, now - day * 2 + 2400, 3200, 2400, 'completed', now - day * 2)
  insertWalk.run(premiumId, routeIds[5], now - day * 1, now - day * 1 + 3000, 4000, 3000, 'completed', now - day * 1)

  console.log('✓ Walks: 8 balades complétées')

  // --- Reviews ---
  const insertReview = db.prepare(`
    INSERT INTO reviews (user_id, route_id, rating, comment, created_at)
    VALUES (?, ?, ?, ?, ?)
  `)

  insertReview.run(userId, routeIds[0], 5, 'Super balade autour du lac, mon chien a adoré !', now - day * 3)
  insertReview.run(userId, routeIds[1], 4, 'Très joli mais un peu long pour un chiot.', now - day * 2)
  insertReview.run(premiumId, routeIds[0], 5, 'Parfait pour Luna, on y retourne chaque semaine.', now - day * 5)
  insertReview.run(premiumId, routeIds[3], 4, 'Beau parcours, attention aux VTT le week-end.', now - day * 4)
  insertReview.run(premiumId, routeIds[6], 5, 'Vue magnifique ! Parcours exigeant mais ça vaut le coup.', now - day * 3)

  console.log('✓ Reviews: 5 avis')

  db.close()
  console.log('\nSeed terminé !')
  console.log('Comptes disponibles :')
  console.log('  admin@dogwalk.test    / Admin123!    (admin + premium)')
  console.log('  premium@dogwalk.test  / Premium123!  (premium)')
  console.log('  user@dogwalk.test     / User1234!    (gratuit)')
}

seed().catch(console.error)
