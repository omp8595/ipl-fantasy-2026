import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, getDoc, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useLeaderboard } from '../hooks/useRealtimeData'

export default function ProfilePage() {
  const { user, userProfile, logout } = useAuth()
  const [myContests, setMyContests]   = useState([])
  const [myTeams, setMyTeams]         = useState([])
  const [activeContest, setActive]    = useState(null)
  const { entries } = useLeaderboard(activeContest)

  useEffect(() => {
    if (!user) return

    // Get all contests user has joined (via leaderboard subcollection)
    const unsubC = onSnapshot(
      collection(db, 'contests'),
      async snap => {
        const joined = []
        for (const contestDoc of snap.docs) {
          const lbRef = doc(db, 'contests', contestDoc.id, 'leaderboard', user.uid)
          const lbDoc = await getDoc(lbRef)
          if (lbDoc.exists()) {
            joined.push({
              id: contestDoc.id,
              ...contestDoc.data(),
              myScore: lbDoc.data().totalScore,
              myRank:  lbDoc.data().rank,
              myFinalRank: lbDoc.data().finalRank,
              isWinner: lbDoc.data().isWinner,
            })
          }
        }
        setMyContests(joined)
      }
    )

    // Get all teams submitted
    const unsubT = onSnapshot(
      collection(db, 'users', user.uid, 'teams'),
      snap => setMyTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )

    return () => { unsubC(); unsubT() }
  }, [user])

  const ini = (user?.displayName || user?.email || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const bestRank = myContests.length ? Math.min(...myContests.map(c => c.myRank || 99)) : null
  const wins     = myContests.filter(c => c.isWinner).length

  const s = {
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
    card:  { background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem' },
    cardT: { fontSize: 12, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.75rem' },
    mc:    { background: '#f5f4f0', borderRadius: 8, padding: '.875rem', textAlign: 'center' },
    mcL:   { fontSize: 11, color: '#888', marginBottom: 4 },
    mcV:   { fontSize: 22, fontWeight: 500 },
    row:   { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #f0f0f0', fontSize: 13, cursor: 'pointer' },
    badge: { fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 500 },
    btn:   { padding: '7px 14px', borderRadius: 8, border: '0.5px solid #e5e5e5', cursor: 'pointer', fontSize: 12, fontWeight: 500, background: '#fff' },
  }

  return (
    <div>
      {/* Profile header */}
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.25rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FF6B0022', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 500, color: '#FF6B00' }}>{ini}</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 500 }}>{user?.displayName || 'Player'}</div>
            <div style={{ fontSize: 13, color: '#888' }}>{user?.email}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
              Member since {userProfile?.createdAt?.toDate?.().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) || 'Today'}
            </div>
          </div>
          <button style={{ ...s.btn, marginLeft: 'auto', color: '#dc2626', borderColor: '#fca5a5' }} onClick={logout}>Sign out</button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.75rem' }}>
          {[
            { label: 'Contests joined', val: myContests.length },
            { label: 'Teams submitted', val: myTeams.length },
            { label: 'Best rank',       val: bestRank ? `#${bestRank}` : '—' },
            { label: 'Contests won',    val: wins, color: wins > 0 ? '#FF6B00' : undefined },
          ].map(({ label, val, color }) => (
            <div key={label} style={s.mc}>
              <div style={s.mcL}>{label}</div>
              <div style={{ ...s.mcV, color: color || undefined }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={s.grid2}>
        {/* Contest history */}
        <div style={s.card}>
          <div style={s.cardT}>Contest history</div>
          {myContests.length === 0 ? (
            <div style={{ padding: '1rem 0', color: '#888', fontSize: 13 }}>No contests joined yet</div>
          ) : myContests.map(c => (
            <div key={c.id} style={s.row} onClick={() => setActive(activeContest === c.id ? null : c.id)}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{c.matchId?.replace(/_/g, ' ')}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 500, color: c.myRank === 1 ? '#FF6B00' : undefined }}>#{c.myFinalRank || c.myRank}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{c.myScore} pts</div>
              </div>
              <span style={{ ...s.badge, background: c.status === 'live' ? '#dcfce7' : c.status === 'closed' ? '#f5f4f0' : '#eff6ff', color: c.status === 'live' ? '#166534' : c.status === 'closed' ? '#666' : '#1e40af' }}>
                {c.isWinner ? '🏆 Won' : c.status}
              </span>
            </div>
          ))}

          {/* Mini leaderboard for selected contest */}
          {activeContest && entries.length > 0 && (
            <div style={{ marginTop: '1rem', background: '#fafaf8', borderRadius: 8, padding: '.75rem' }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#888', marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>Leaderboard</div>
              {entries.slice(0, 5).map((e, i) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
                  <span style={{ color: i < 3 ? '#FF6B00' : '#aaa', width: 20, fontWeight: 500 }}>#{i + 1}</span>
                  <span style={{ flex: 1, color: e.userId === user?.uid ? '#FF6B00' : undefined, fontWeight: e.userId === user?.uid ? 500 : 400 }}>
                    {e.userId === user?.uid ? '★ You' : e.displayName}
                  </span>
                  <span style={{ fontWeight: 500 }}>{e.totalScore}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Teams submitted */}
        <div style={s.card}>
          <div style={s.cardT}>Teams submitted</div>
          {myTeams.length === 0 ? (
            <div style={{ padding: '1rem 0', color: '#888', fontSize: 13 }}>No teams submitted yet</div>
          ) : myTeams.map(t => (
            <div key={t.id} style={{ padding: '10px 0', borderBottom: '0.5px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{t.matchId?.replace(/_2026_M\d+$/, '').replace(/_/g, ' vs ')}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {t.locked && <span style={{ ...s.badge, background: '#fef9c3', color: '#854d0e' }}>Locked</span>}
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{t.totalScore || 0} pts</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(t.players || []).map(pid => {
                  const name = pid.split('_').slice(1).join(' ')
                  const isCap = pid === t.captainId
                  const isVC  = pid === t.vcId
                  return (
                    <span key={pid} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: isCap ? '#FF6B00' : isVC ? '#1d4ed8' : '#f5f4f0', color: isCap || isVC ? '#fff' : '#444' }}>
                      {name}{isCap ? ' (C)' : isVC ? ' (VC)' : ''}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

