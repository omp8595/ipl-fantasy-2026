/**
 * GET /api/cron/score-engine
 * Vercel Cron — runs every 2 minutes during IPL
 * Fetches live scores from CricketData.org → writes to Firestore
 * Protected by CRON_SECRET so only Vercel scheduler can call it
 */
import { adminDb } from '../../src/lib/firebaseAdmin'
import { calcPlayerPoints } from '../../../src/lib/scoringEngine'
import fetch from 'node-fetch'

export default async function handler(req, res) {
  // Security: Vercel cron passes Authorization header
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // 1. Find all live matches
    const matchSnap = await adminDb.collection('matches')
      .where('status', '==', 'live').get()

    if (matchSnap.empty) {
      return res.status(200).json({ message: 'No live matches', updated: 0 })
    }

    let totalPlayersUpdated = 0

    for (const matchDoc of matchSnap.docs) {
      const matchId   = matchDoc.id
      const matchData = matchDoc.data()

      if (!matchData.externalMatchId) continue

      // 2. Fetch scorecard from CricketData.org
      const url = `https://api.cricapi.com/v1/match_scorecard?apikey=${process.env.CRICKETDATA_API_KEY}&id=${matchData.externalMatchId}`
      const resp = await fetch(url, { timeout: 8000 })
      const json = await resp.json()

      if (json.status !== 'success' || !json.data) continue

      const scorecard = json.data
      const batch     = adminDb.batch()

      // 3. Aggregate batting + bowling stats per player
      const playerMap = {}

      for (const innings of (scorecard.score || [])) {
        for (const batter of (innings.batting || [])) {
          const name = batter.batsman
          if (!name) continue
          if (!playerMap[name]) playerMap[name] = { name }
          playerMap[name].runs     = parseInt(batter.r)  || 0
          playerMap[name].fours    = parseInt(batter['4s']) || 0
          playerMap[name].sixes    = parseInt(batter['6s']) || 0
          playerMap[name].batted   = true
          playerMap[name].notOut   = batter.dismissal === 'not out'
        }
        for (const bowler of (innings.bowling || [])) {
          const name = bowler.bowler
          if (!name) continue
          if (!playerMap[name]) playerMap[name] = { name }
          playerMap[name].wickets = parseInt(bowler.w) || 0
          playerMap[name].maidens = parseInt(bowler.m) || 0
        }
      }

      // 4. Add fielding stats from fall of wickets
      for (const innings of (scorecard.score || [])) {
        for (const wicket of (innings.fow || [])) {
          if (wicket.fielder) {
            if (!playerMap[wicket.fielder]) playerMap[wicket.fielder] = { name: wicket.fielder }
            if (wicket.dismissal === 'caught') {
              playerMap[wicket.fielder].catches = (playerMap[wicket.fielder].catches || 0) + 1
            } else if (wicket.dismissal === 'stumped') {
              playerMap[wicket.fielder].stumpings = (playerMap[wicket.fielder].stumpings || 0) + 1
            } else if (wicket.dismissal?.includes('run out')) {
              playerMap[wicket.fielder].runOuts = (playerMap[wicket.fielder].runOuts || 0) + 1
            }
          }
        }
      }

      // 5. Check Man of the Match
      const motmName = scorecard.matchWinner?.manOfMatch || null

      // 6. Write playerScores to Firestore
      for (const [name, stats] of Object.entries(playerMap)) {
        const fantasyPts = calcPlayerPoints(stats)
        const isMoTM     = motmName ? motmName.toLowerCase().includes(name.toLowerCase()) : false
        const docId      = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')

        const ref = adminDb.collection('matches').doc(matchId)
          .collection('playerScores').doc(docId)

        batch.set(ref, {
          name,
          ...stats,
          fantasyPts,
          isMoTM,
          updatedAt: new Date(),
        }, { merge: true })

        totalPlayersUpdated++
      }

      // 7. Update live score display on match doc
      const liveScore = (scorecard.score || [])
        .map(s => `${s.inning}: ${s.r}/${s.w} (${s.o} ov)`)
        .join('  ·  ')

      batch.update(adminDb.collection('matches').doc(matchId), {
        liveScore,
        lastScoreUpdate: new Date(),
      })

      await batch.commit()
      console.log(`[scoreEngine] Updated ${Object.keys(playerMap).length} players for ${matchId}`)
    }

    // 8. Trigger leaderboard recalc for all affected contests
    await triggerLeaderboardRecalc()

    return res.status(200).json({
      success: true,
      matchesProcessed: matchSnap.size,
      playersUpdated: totalPlayersUpdated,
    })
  } catch (err) {
    console.error('[scoreEngine] Error:', err)
    return res.status(500).json({ error: err.message })
  }
}

async function triggerLeaderboardRecalc() {
  // Find all open/live contests and recalc their leaderboards
  const contestsSnap = await adminDb.collection('contests')
    .where('status', 'in', ['open', 'live']).get()

  for (const contestDoc of contestsSnap.docs) {
    const contestId = contestDoc.id
    const matchId   = contestDoc.data().matchId

    // Get player scores for this match
    const scoresSnap = await adminDb.collection('matches').doc(matchId)
      .collection('playerScores').get()

    const playerScores = {}
    scoresSnap.docs.forEach(d => {
      playerScores[d.data().name] = d.data()
    })

    // Get all leaderboard entries
    const lbSnap = await adminDb.collection('contests').doc(contestId)
      .collection('leaderboard').get()

    const batch  = adminDb.batch()
    const scores = []

    for (const lbDoc of lbSnap.docs) {
      const { teamRef } = lbDoc.data()
      if (!teamRef) continue

      const teamDoc = await adminDb.doc(teamRef).get()
      if (!teamDoc.exists) continue
      const team = teamDoc.data()

      let total = 0
      const breakdown = {}

      for (const playerId of (team.players || [])) {
        const playerName = playerId.replace(/_/g, ' ')
        // Try exact match first, then partial
        const score = playerScores[playerName]
          || Object.values(playerScores).find(s =>
              s.name?.toLowerCase() === playerName.toLowerCase()
            )
        if (!score) continue

        const basePts  = score.fantasyPts || 0
        const isMoTM   = score.isMoTM    || false
        const role     = playerId === team.captainId ? 'captain'
                       : playerId === team.vcId      ? 'viceCaptain'
                       : 'player'
        const mult     = role === 'captain'     ? (isMoTM ? 4 : 2)
                       : role === 'viceCaptain' ? (isMoTM ? 3 : 1.5)
                       : (isMoTM ? 2 : 1)

        const finalPts = Math.round(basePts * mult)
        breakdown[playerId] = { basePts, finalPts, role, isMoTM }
        total += finalPts
      }

      scores.push({ userId: lbDoc.id, total })

      batch.update(
        adminDb.collection('contests').doc(contestId)
          .collection('leaderboard').doc(lbDoc.id),
        { totalScore: total, breakdown, lastUpdated: new Date() }
      )
    }

    // Write ranks
    scores.sort((a, b) => b.total - a.total)
    scores.forEach((s, i) => {
      batch.update(
        adminDb.collection('contests').doc(contestId)
          .collection('leaderboard').doc(s.userId),
        { rank: i + 1 }
      )
    })

    await batch.commit()
  }
}
