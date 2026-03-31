/**
 * POST /api/admin/seed-matches
 * Writes all IPL 2026 fixtures to Firestore
 * Safe to run multiple times (uses set with merge)
 */
import { adminDb } from '../../../src/lib/firebaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET)
    return res.status(401).json({ error: 'Unauthorized' })

  const { matches } = req.body
  if (!matches?.length) return res.status(400).json({ error: 'No matches provided' })

  const batch = adminDb.batch()

  for (const m of matches) {
    const { id, ...data } = m
    const ref = adminDb.collection('matches').doc(id)
    batch.set(ref, {
      ...data,
      date: new Date(data.date),
      externalMatchId: data.externalMatchId || '',
      liveScore: '',
      squad1: [],
      squad2: [],
    }, { merge: true })
  }

  await batch.commit()

  return res.status(200).json({ success: true, count: matches.length })
}


