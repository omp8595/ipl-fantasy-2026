/**
 * POST /api/admin/lock-match
 * Locks a match so no more team edits (called at toss time)
 * Requires ADMIN_SECRET header
 */
import { adminDb } from '../../../src/lib/firebaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET)
    return res.status(401).json({ error: 'Unauthorized' })

  const { matchId } = req.body
  if (!matchId) return res.status(400).json({ error: 'matchId required' })

  // Lock match
  await adminDb.collection('matches').doc(matchId).update({
    locked: true,
    status: 'live',
    lockedAt: new Date(),
  })

  // Lock all teams for this match
  const teamsQuery = await adminDb.collectionGroup('teams')
    .where('matchId', '==', matchId).get()

  const batch = adminDb.batch()
  teamsQuery.docs.forEach(doc => batch.update(doc.ref, { locked: true }))
  await batch.commit()

  return res.status(200).json({ success: true, teamsLocked: teamsQuery.size })
}

