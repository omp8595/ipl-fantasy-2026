export const SCORING = {
  run: 1, four: 1, six: 2,
  fifty: 8, century: 16, notOut: 4, duck: -2,
  wicket: 25, maidenOver: 8,
  threeWicketBonus: 4, fiveWicketBonus: 8,
  catch: 8, stumping: 12, runOut: 6,
}

export const MULTIPLIERS = {
  captain:     { normal: 2,   motm: 4 },
  viceCaptain: { normal: 1.5, motm: 3 },
  player:      { normal: 1,   motm: 2 },
}

export function calcPlayerPoints(stats) {
  let pts = 0
  if (stats.runs !== undefined) {
    pts += stats.runs * SCORING.run
    pts += (stats.fours    || 0) * SCORING.four
    pts += (stats.sixes    || 0) * SCORING.six
    if (stats.runs >= 100)                     pts += SCORING.century
    else if (stats.runs >= 50)                 pts += SCORING.fifty
    if (stats.notOut)                          pts += SCORING.notOut
    if (stats.runs === 0 && !stats.notOut && stats.batted) pts += SCORING.duck
  }
  if (stats.wickets !== undefined) {
    pts += stats.wickets * SCORING.wicket
    pts += (stats.maidens || 0) * SCORING.maidenOver
    if (stats.wickets >= 5)      pts += SCORING.fiveWicketBonus
    else if (stats.wickets >= 3) pts += SCORING.threeWicketBonus
  }
  pts += (stats.catches   || 0) * SCORING.catch
  pts += (stats.stumpings || 0) * SCORING.stumping
  pts += (stats.runOuts   || 0) * SCORING.runOut
  return Math.max(0, pts)
}

export function applyMultiplier(basePts, role, isMoTM) {
  const m = MULTIPLIERS[role] || MULTIPLIERS.player
  return Math.round(basePts * (isMoTM ? m.motm : m.normal))
}

export function calcTeamScore(team, playerScores) {
  let total = 0
  const breakdown = {}
  for (const playerId of (team.players || [])) {
    const score = playerScores[playerId]
    if (!score) continue
    const basePts  = score.fantasyPts || 0
    const isMoTM   = score.isMoTM    || false
    const role     = playerId === team.captainId ? 'captain'
                   : playerId === team.vcId      ? 'viceCaptain'
                   : 'player'
    const finalPts = applyMultiplier(basePts, role, isMoTM)
    breakdown[playerId] = { basePts, finalPts, role, isMoTM }
    total += finalPts
  }
  return { total, breakdown }
}

