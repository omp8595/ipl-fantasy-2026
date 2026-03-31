/**
 * POST /api/contest/create
 * Creates a new contest in Firestore
 */
import { adminDb, adminAuth } from '../../../src/lib/firebaseAdmin'

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = req.headers.authorization?.split('Bearer ')[1]
  if (!token) return res.status(401).json({ error: 'Not authenticated' })

  let uid, displayName
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    uid = decoded.uid
    displayName = decoded.name || decoded.email?.split('@')[0] || 'Player'
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }

  const { name, matchId, maxParticipants, prizeType } = req.body

  if (!name?.trim()) return res.status(400).json({ error: 'Contest name required' })
  if (!matchId)      return res.status(400).json({ error: 'Match required' })

  // Ensure unique invite code
  let inviteCode = generateCode()
  let attempts = 0
  while (attempts < 5) {
    const existing = await adminDb.collection('contests')
      .where('inviteCode', '==', inviteCode).get()
    if (existing.empty) break
    inviteCode = generateCode()
    attempts++
  }

  const contestRef = await adminDb.collection('contests').add({
    name:            name.trim(),
    matchId,
    createdBy:       uid,
    creatorName:     displayName,
    inviteCode,
    maxParticipants: parseInt(maxParticipants) || 10,
    entryFee:        0,
    prizeType:       prizeType || 'winner',
    prize:           'Bragging rights',
    status:          'open',
    memberCount:     0,
    createdAt:       new Date(),
  })

  return res.status(200).json({ success: true, contestId: contestRef.id, inviteCode })
}
