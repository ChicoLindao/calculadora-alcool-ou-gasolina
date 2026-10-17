import { drizzle } from 'drizzle-orm/node-postgres'
import { pgTable, text, doublePrecision, timestamp, uuid } from 'drizzle-orm/pg-core'
import { Pool } from 'pg'

export const stationHistory = pgTable('StationHistory', {
  id: uuid('id').defaultRandom().primaryKey(),
  stationName: text('stationName').notNull().unique(),
  alcoholPrice: doublePrecision('alcoholPrice').notNull(),
  gasolinePrice: doublePrecision('gasolinePrice').notNull(),
  recommendation: text('recommendation').notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

const globalForDb = globalThis as unknown as { pool?: Pool }
export const pool = globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL })
if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool
export const db = drizzle(pool, { schema: { stationHistory } })
