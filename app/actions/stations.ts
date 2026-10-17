'use server'

import { desc } from 'drizzle-orm'
import { db, stationHistory } from '@/lib/db'

export type StationHistoryItem = typeof stationHistory.$inferSelect

export async function getStationHistory() {
  return db.select().from(stationHistory).orderBy(desc(stationHistory.updatedAt)).limit(8)
}

export async function saveStationHistory(input: {
  stationName: string
  alcoholPrice: number
  gasolinePrice: number
  recommendation: string
}) {
  const stationName = input.stationName.trim().slice(0, 120)
  if (!stationName || !Number.isFinite(input.alcoholPrice) || !Number.isFinite(input.gasolinePrice)) return

  await db.insert(stationHistory).values({
    stationName,
    alcoholPrice: input.alcoholPrice,
    gasolinePrice: input.gasolinePrice,
    recommendation: input.recommendation,
  }).onConflictDoUpdate({
    target: stationHistory.stationName,
    set: {
      alcoholPrice: input.alcoholPrice,
      gasolinePrice: input.gasolinePrice,
      recommendation: input.recommendation,
      updatedAt: new Date(),
    },
  })
}

export async function deleteStationHistory() {
  await db.delete(stationHistory)
}
