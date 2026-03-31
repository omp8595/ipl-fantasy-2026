/**
 * POST /api/admin/update-match
 * Update any field on a match document (externalMatchId, status, etc.)
 */
import { adminDb } from '../../../src/lib/firebaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET)
    return res.status(401).json({ error: 'Unauthorized' })

  const { matchId, ...updates } = req.body
  if (!matchId) return res.status(400).json({ error: 'matchId required' })

  // Whitelist updatable fields
  const allowed = ['externalMatchId', 'status', 'locked', 'venue', 'liveScore']
  const safe = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  )

  if (!Object.keys(safe).length)
    return res.status(400).json({ error: 'No valid fields to update' })

  await adminDb.collection('matches').doc(matchId).update(safe)

  return res.status(200).json({ success: true, matchId, updated: safe })
}

