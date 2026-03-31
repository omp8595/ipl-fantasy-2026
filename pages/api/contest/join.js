/**
 * POST /api/contest/join
 * Validates invite code, checks team submitted, adds user to leaderboard
 */
import { adminDb, adminAuth } from '../../../src/lib/firebaseAdmin'

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

  const { contestId, inviteCode } = req.body

  // 1. Validate contest
  const contestRef = adminDb.collection('contests').doc(contestId)
  const contestDoc = await contestRef.get()
  if (!contestDoc.exists) return res.status(404).json({ error: 'Contest not found' })

  const contest = contestDoc.data()
  if (contest.inviteCode !== inviteCode)
    return res.status(400).json({ error: 'Invalid invite code' })

  if (contest.memberCount >= contest.maxParticipants)
    return res.status(400).json({ error: 'Contest is full' })

  // 2. Check already joined
  const lbRef = adminDb.collection('contests').doc(contestId)
    .collection('leaderboard').doc(uid)
  const existing = await lbRef.get()
  if (existing.exists) return res.status(400).json({ error: 'Already joined this contest' })

  // 3. Check user has submitted a team for this match
  const teamRef = adminDb.collection('users').doc(uid)
    .collection('teams').doc(contest.matchId)
  const teamDoc = await teamRef.get()
  if (!teamDoc.exists)
    return res.status(400).json({ error: 'Submit your team for this match first' })

  // 4. Add to leaderboard + increment memberCount (atomic)
  const batch = adminDb.batch()

  batch.set(lbRef, {
    userId: uid,
    displayName,
    totalScore: 0,
    rank: contest.memberCount + 1,
    teamRef: teamRef.path,
    breakdown: {},
    joinedAt: new Date(),
    lastUpdated: new Date(),
  })

  batch.update(contestRef, {
    memberCount: contest.memberCount + 1,
  })

  batch.set(adminDb.collection('users').doc(uid), {
    contestsJoined: (await adminDb.collection('users').doc(uid).get()).data()?.contestsJoined + 1 || 1,
  }, { merge: true })

  await batch.commit()

  return res.status(200).json({ success: true, contestName: contest.name })
}
