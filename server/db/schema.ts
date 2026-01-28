import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  name: text('name'),
  streak_count: integer('streak_count').notNull().default(0),
  last_walk_date: text('last_walk_date'), // YYYY-MM-DD
  created_at: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Export type inference
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// Dogs table
export const dogs = sqliteTable('dogs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  breed: text('breed'),
  birth_date: text('birth_date'), // ISO date string YYYY-MM-DD
  photo_url: text('photo_url'),
  created_at: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type Dog = typeof dogs.$inferSelect
export type NewDog = typeof dogs.$inferInsert

// Routes table
export const routes = sqliteTable('routes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  duration_minutes: integer('duration_minutes').notNull(),
  distance_meters: integer('distance_meters').notNull(),
  difficulty: text('difficulty', { enum: ['easy', 'medium', 'hard'] }).notNull(),
  type: text('type', { enum: ['urban', 'nature', 'mixed'] }).notNull(),
  is_premium: integer('is_premium', { mode: 'boolean' }).notNull().default(false),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  geojson_path: text('geojson_path'), // GeoJSON LineString as JSON string
  center_lat: real('center_lat').notNull(),
  center_lng: real('center_lng').notNull(),
  created_at: text('created_at').$defaultFn(() => new Date().toISOString()),
  updated_at: text('updated_at').$defaultFn(() => new Date().toISOString()),
})

export type Route = typeof routes.$inferSelect
export type NewRoute = typeof routes.$inferInsert

// Walks table - tracks user walk sessions
export const walks = sqliteTable('walks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  route_id: text('route_id')
    .notNull()
    .references(() => routes.id),
  started_at: integer('started_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  finished_at: integer('finished_at', { mode: 'timestamp' }),
  distance_meters: integer('distance_meters').notNull().default(0),
  duration_seconds: integer('duration_seconds').notNull().default(0),
  status: text('status', { enum: ['active', 'completed', 'cancelled'] })
    .notNull()
    .default('active'),
  geojson_track: text('geojson_track'), // JSON string of GeoJSON LineString
  created_at: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type Walk = typeof walks.$inferSelect
export type NewWalk = typeof walks.$inferInsert
