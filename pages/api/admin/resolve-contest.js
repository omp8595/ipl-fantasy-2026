/**
 * POST /api/admin/resolve-contest
 * Finalises contest — computes final ranks and prize winners
 */
import { adminDb } from '../../src/lib/firebaseAdmin'

const PRIZE_MAP = {
  winner: [100],
  top3:   [50, 30, 20],
  top5:   [40, 25, 15, 10, 10],
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET)
    return res.status(401).json({ error: 'Unauthorized' })

  const { contestId, matchId } = req.body

  // Mark match as done
  if (matchId) {
    await adminDb.collection('matches').doc(matchId).update({
      status: 'done',
      completedAt: new Date(),
    })
  }

  const contestDoc = await adminDb.collection('contests').doc(contestId).get()
  if (!contestDoc.exists) return res.status(404).json({ error: 'Contest not found' })

  const contest = contestDoc.data()
  const prizes  = PRIZE_MAP[contest.prizeType] || PRIZE_MAP.winner

  // Get final leaderboard ordered by score
  const lbSnap = await adminDb.collection('contests').doc(contestId)
    .collection('leaderboard').orderBy('totalScore', 'desc').get()

  const batch = adminDb.batch()

  lbSnap.docs.forEach((doc, idx) => {
    const rank        = idx + 1
    const prizePct    = prizes[idx] || 0
    const isWinner    = prizePct > 0

    batch.update(doc.ref, { finalRank: rank, prizePercentage: prizePct, isWinner })

    // Update user's best rank
    if (isWinner) {
      batch.set(adminDb.collection('users').doc(doc.id),
        { bestRank: rank }, { merge: true }
      )
    }
  })

  // Close contest
  batch.update(adminDb.collection('contests').doc(contestId), {
    status: 'closed',
    resolvedAt: new Date(),
    winner: lbSnap.docs[0]?.data().displayName || null,
    totalParticipants: lbSnap.size,
  })

  await batch.commit()

  return res.status(200).json({
    success: true,
    participants: lbSnap.size,
    winner: lbSnap.docs[0]?.data(),
  })
}
