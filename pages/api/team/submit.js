/**
 * POST /api/team/submit
 * Validates team selection and saves to Firestore
 * Requires Firebase ID token in Authorization header
 */
import { adminDb, adminAuth } from '../../../src/lib/firebaseAdmin'

const BUDGET_CAP = 100

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // 1. Verify Firebase auth token
  const token = req.headers.authorization?.split('Bearer ')[1]
  if (!token) return res.status(401).json({ error: 'Not authenticated' })

  let uid
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    uid = decoded.uid
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }

  const { matchId, players, captainId, vcId, budgetUsed } = req.body

  // 2. Server-side validation
  if (!players || players.length !== 11)
    return res.status(400).json({ error: 'Must select exactly 11 players' })

  if (!captainId || !vcId)
    return res.status(400).json({ error: 'Captain and Vice-Captain required' })

  if (!players.includes(captainId) || !players.includes(vcId))
    return res.status(400).json({ error: 'C/VC must be in your team' })

  if (budgetUsed > BUDGET_CAP)
    return res.status(400).json({ error: `Budget exceeds ${BUDGET_CAP} point cap` })

  if (captainId === vcId)
    return res.status(400).json({ error: 'Captain and VC cannot be the same player' })

  // 3. Check match exists and is not locked
  const matchDoc = await adminDb.collection('matches').doc(matchId).get()
  if (!matchDoc.exists)
    return res.status(404).json({ error: 'Match not found' })

  if (matchDoc.data().locked)
    return res.status(400).json({ error: 'Match has started — team locked' })

  // 4. Save team
  const teamRef = adminDb.collection('users').doc(uid)
    .collection('teams').doc(matchId)

  await teamRef.set({
    matchId,
    players,
    captainId,
    vcId,
    budgetUsed,
    totalScore: 0,
    breakdown: {},
    submittedAt: new Date(),
    locked: false,
  })

  // 5. Update user stats
  await adminDb.collection('users').doc(uid).set(
    { teamsSubmitted: adminDb.FieldValue?.increment(1) || 1 },
    { merge: true }
  )

  return res.status(200).json({ success: true, matchId })
}

