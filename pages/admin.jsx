import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../src/lib/firebase'
import { useAuth } from '../src/hooks/useAuth'

const ADMIN_EMAILS = ['omp8595@gmail.com'] // replace with your email

const s = {
  page:   { maxWidth: 1200, margin: '0 auto', padding: '1.5rem', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' },
  title:  { fontSize: 22, fontWeight: 500 },
  grid:   { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' },
  mc:     { background: '#f5f4f0', borderRadius: 10, padding: '1rem' },
  mcL:    { fontSize: 11, color: '#888', marginBottom: 4 },
  mcV:    { fontSize: 26, fontWeight: 500 },
  tabs:   { display: 'flex', gap: 4, background: '#f5f4f0', padding: 4, borderRadius: 8, marginBottom: '1.5rem', border: '0.5px solid #e5e5e5' },
  tab:    { padding: '7px 18px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#666' },
  tabA:   { background: '#fff', color: '#222', border: '0.5px solid #e5e5e5' },
  card:   { background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem' },
  cardT:  { fontSize: 12, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.75rem' },
  btn:    { padding: '7px 14px', borderRadius: 8, border: '0.5px solid #e5e5e5', cursor: 'pointer', fontSize: 12, fontWeight: 500, background: '#fff' },
  btnP:   { background: '#FF6B00', border: 'none', color: '#fff' },
  btnR:   { background: '#dc2626', border: 'none', color: '#fff' },
  btnG:   { background: '#16a34a', border: 'none', color: '#fff' },
  inp:    { padding: '7px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, outline: 'none', width: '100%', marginBottom: 8 },
  row:    { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #f0f0f0', fontSize: 13 },
  badge:  { fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 500 },
  toast:  { position: 'fixed', bottom: 20, right: 20, background: '#fff', border: '0.5px solid #ccc', borderRadius: 8, padding: '10px 16px', fontSize: 13, zIndex: 999, boxShadow: '0 2px 8px rgba(0,0,0,.08)' },
}

const STATUS_COLORS = {
  upcoming: { background: '#f0f9ff', color: '#0369a1' },
  live:     { background: '#dcfce7', color: '#166534' },
  done:     { background: '#f5f4f0', color: '#666' },
}

export default function AdminPage() {
  const { user } = useAuth()
  const [tab, setTab]           = useState('matches')
  const [matches, setMatches]   = useState([])
  const [contests, setContests] = useState([])
  const [users, setUsers]       = useState([])
  const [stats, setStats]       = useState({ matches: 0, contests: 0, users: 0, teams: 0 })
  const [toast, setToast]       = useState('')
  const [loading, setLoading]   = useState(false)

  // Guard — only admin emails
  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui', color: '#888', fontSize: 14 }}>
        Access denied — admin only
      </div>
    )
  }

  useEffect(() => {
    // Real-time matches
    const unsubM = onSnapshot(
      query(collection(db, 'matches'), orderBy('date', 'asc')),
      snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setMatches(data)
        setStats(prev => ({ ...prev, matches: data.length }))
      }
    )
    // Real-time contests
    const unsubC = onSnapshot(
      query(collection(db, 'contests'), orderBy('createdAt', 'desc')),
      snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setContests(data)
        setStats(prev => ({ ...prev, contests: data.length }))
      }
    )
    // Users (paginated to 50)
    getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'))).then(snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setUsers(data)
      setStats(prev => ({ ...prev, users: data.length }))
    })
    return () => { unsubM(); unsubC() }
  }, [])

  async function adminCall(endpoint, body) {
    setLoading(true)
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': prompt('Enter admin secret:') || '' },
        body: JSON.stringify(body),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error)
      showToast('Done: ' + JSON.stringify(data))
    } catch (e) {
      showToast('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 4000) }

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.header}>
        <div style={s.title}><span style={{ color: '#FF6B00' }}>IPL</span> Fantasy 2026 — Admin</div>
        <div style={{ fontSize: 12, color: '#888' }}>Signed in as {user.email}</div>
      </div>

      {/* Stats */}
      <div style={s.grid}>
        {[
          { label: 'Total matches',  val: stats.matches  },
          { label: 'Total contests', val: stats.contests },
          { label: 'Registered users', val: stats.users  },
          { label: 'Live contests',  val: contests.filter(c => c.status === 'live').length },
        ].map(({ label, val }) => (
          <div key={label} style={s.mc}>
            <div style={s.mcL}>{label}</div>
            <div style={s.mcV}>{val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {['matches', 'contests', 'users', 'seed'].map(t => (
          <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabA : {}) }} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* MATCHES */}
      {tab === 'matches' && (
        <div style={s.card}>
          <div style={s.cardT}>All IPL 2026 matches</div>
          {matches.map(m => (
            <div key={m.id} style={s.row}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 500 }}>{m.team1} vs {m.team2}</span>
                <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>
                  {m.date?.toDate?.().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) || m.date}
                  {' · '}{m.venue}
                </span>
              </div>
              <span style={{ ...s.badge, ...STATUS_COLORS[m.status] || {} }}>{m.status}</span>
              {m.liveScore && <span style={{ fontSize: 11, color: '#16a34a', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.liveScore}</span>}
              <div style={{ display: 'flex', gap: 5 }}>
                {m.status === 'upcoming' && (
                  <button style={{ ...s.btn, ...s.btnG, fontSize: 11 }}
                    onClick={() => adminCall('/api/admin/lock-match', { matchId: m.id })}>
                    Lock (toss)
                  </button>
                )}
                {m.status === 'live' && (
                  <button style={{ ...s.btn, ...s.btnR, fontSize: 11 }}
                    onClick={() => {
                      const contestId = prompt('Enter contest ID to resolve:')
                      if (contestId) adminCall('/api/admin/resolve-contest', { matchId: m.id, contestId })
                    }}>
                    Resolve
                  </button>
                )}
                <span style={{ fontSize: 11, color: '#aaa', fontFamily: 'monospace' }}>{m.id}</span>
              </div>
            </div>
          ))}
          {matches.length === 0 && (
            <div style={{ padding: '1rem 0', color: '#888', fontSize: 13 }}>
              No matches yet — go to Seed tab to add IPL 2026 fixtures
            </div>
          )}
        </div>
      )}

      {/* CONTESTS */}
      {tab === 'contests' && (
        <div style={s.card}>
          <div style={s.cardT}>All contests ({contests.length})</div>
          {contests.map(c => (
            <div key={c.id} style={s.row}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 500 }}>{c.name}</span>
                <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>
                  {c.matchId} · {c.memberCount}/{c.maxParticipants} members · by {c.creatorName}
                </span>
              </div>
              <span style={{ ...s.badge, ...STATUS_COLORS[c.status] || {} }}>{c.status}</span>
              <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>Code: {c.inviteCode}</span>
              {c.status === 'open' && (
                <button style={{ ...s.btn, ...s.btnR, fontSize: 11 }}
                  onClick={() => adminCall('/api/admin/resolve-contest', { contestId: c.id })}>
                  Force close
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div style={s.card}>
          <div style={s.cardT}>Registered users ({users.length})</div>
          {users.map(u => (
            <div key={u.id} style={s.row}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FF6B0022', color: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
                {(u.name || u.email || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{u.email}</div>
              </div>
              <div style={{ fontSize: 12, color: '#888', textAlign: 'right' }}>
                <div>{u.contestsJoined || 0} contests</div>
                <div>{u.teamsSubmitted || 0} teams</div>
              </div>
              <div style={{ fontSize: 11, color: '#aaa' }}>
                {u.createdAt?.toDate?.().toLocaleDateString() || '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SEED */}
      {tab === 'seed' && <SeedTab showToast={showToast} />}
    </div>
  )
}

function SeedTab({ showToast }) {
  const [seeding, setSeeding] = useState(false)
  const [externalId, setExternalId] = useState('')
  const [matchId, setMatchId]       = useState('')

  const IPL_MATCHES = [
    { id: 'RCB_SRH_2026_M01', team1: 'RCB', team2: 'SRH', date: '2026-03-28T19:30:00+05:30', venue: 'M. Chinnaswamy Stadium, Bengaluru', status: 'done',     locked: true  },
    { id: 'MI_KKR_2026_M02',  team1: 'MI',  team2: 'KKR', date: '2026-03-29T19:30:00+05:30', venue: 'Wankhede Stadium, Mumbai',          status: 'done',     locked: true  },
    { id: 'CSK_RR_2026_M03',  team1: 'CSK', team2: 'RR',  date: '2026-03-30T15:30:00+05:30', venue: 'Barsapara Stadium, Guwahati',       status: 'live',     locked: true  },
    { id: 'GT_PBKS_2026_M04', team1: 'GT',  team2: 'PBKS',date: '2026-03-30T19:30:00+05:30', venue: 'Narendra Modi Stadium, Ahmedabad',  status: 'upcoming', locked: false },
    { id: 'LSG_DC_2026_M05',  team1: 'LSG', team2: 'DC',  date: '2026-04-01T19:30:00+05:30', venue: 'Ekana Cricket Stadium, Lucknow',    status: 'upcoming', locked: false },
    { id: 'KKR_SRH_2026_M06', team1: 'KKR', team2: 'SRH', date: '2026-04-02T19:30:00+05:30', venue: 'Eden Gardens, Kolkata',             status: 'upcoming', locked: false },
    { id: 'CSK_PBKS_2026_M07',team1: 'CSK', team2: 'PBKS',date: '2026-04-03T19:30:00+05:30', venue: 'MA Chidambaram Stadium, Chennai',   status: 'upcoming', locked: false },
    { id: 'MI_DC_2026_M08',   team1: 'MI',  team2: 'DC',  date: '2026-04-04T19:30:00+05:30', venue: 'Wankhede Stadium, Mumbai',          status: 'upcoming', locked: false },
    { id: 'GT_RR_2026_M09',   team1: 'GT',  team2: 'RR',  date: '2026-04-05T15:30:00+05:30', venue: 'Narendra Modi Stadium, Ahmedabad',  status: 'upcoming', locked: false },
    { id: 'SRH_LSG_2026_M10', team1: 'SRH', team2: 'LSG', date: '2026-04-05T19:30:00+05:30', venue: 'Rajiv Gandhi Stadium, Hyderabad',   status: 'upcoming', locked: false },
    { id: 'RCB_CSK_2026_M11', team1: 'RCB', team2: 'CSK', date: '2026-04-06T19:30:00+05:30', venue: 'M. Chinnaswamy Stadium, Bengaluru', status: 'upcoming', locked: false },
    { id: 'KKR_PBKS_2026_M12',team1: 'KKR', team2: 'PBKS',date: '2026-04-07T19:30:00+05:30', venue: 'Eden Gardens, Kolkata',             status: 'upcoming', locked: false },
    { id: 'RR_MI_2026_M13',   team1: 'RR',  team2: 'MI',  date: '2026-04-08T19:30:00+05:30', venue: 'Sawai Mansingh Stadium, Jaipur',    status: 'upcoming', locked: false },
    { id: 'DC_GT_2026_M14',   team1: 'DC',  team2: 'GT',  date: '2026-04-09T19:30:00+05:30', venue: 'Arun Jaitley Stadium, Delhi',       status: 'upcoming', locked: false },
    { id: 'KKR_LSG_2026_M15', team1: 'KKR', team2: 'LSG', date: '2026-04-10T19:30:00+05:30', venue: 'Eden Gardens, Kolkata',             status: 'upcoming', locked: false },
  ]

  async function seedMatches() {
    setSeeding(true)
    try {
      const resp = await fetch('/api/admin/seed-matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': prompt('Enter admin secret:') || '',
        },
        body: JSON.stringify({ matches: IPL_MATCHES }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error)
      showToast(`Seeded ${data.count} matches successfully!`)
    } catch (e) {
      showToast('Error: ' + e.message)
    } finally {
      setSeeding(false)
    }
  }

  async function updateExternalId() {
    if (!matchId || !externalId) { showToast('Fill both fields'); return }
    const resp = await fetch('/api/admin/update-match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': prompt('Enter admin secret:') || '',
      },
      body: JSON.stringify({ matchId, externalMatchId: externalId }),
    })
    const data = await resp.json()
    resp.ok ? showToast('Updated!') : showToast('Error: ' + data.error)
  }

  const s2 = {
    card: { background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem' },
    cardT: { fontSize: 12, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.75rem' },
    btn: { padding: '8px 16px', borderRadius: 8, border: '0.5px solid #e5e5e5', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: '#fff' },
    btnP: { background: '#FF6B00', border: 'none', color: '#fff' },
    inp: { padding: '7px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, outline: 'none', width: '100%', marginBottom: 8 },
    label: { fontSize: 12, color: '#666', display: 'block', marginBottom: 4 },
    row: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid #f5f5f5', fontSize: 12 },
  }

  return (
    <div>
      {/* Seed matches */}
      <div style={s2.card}>
        <div style={s2.cardT}>Seed IPL 2026 fixtures</div>
        <p style={{ fontSize: 13, color: '#666', marginBottom: '1rem', lineHeight: 1.6 }}>
          This writes all {IPL_MATCHES.length} IPL 2026 league matches to Firestore. Safe to run multiple times — uses set() so it won't create duplicates.
        </p>
        <div style={{ maxHeight: 240, overflowY: 'auto', marginBottom: '1rem', border: '0.5px solid #f0f0f0', borderRadius: 8 }}>
          {IPL_MATCHES.map(m => (
            <div key={m.id} style={s2.row}>
              <span style={{ fontWeight: 500, minWidth: 80, color: '#FF6B00' }}>{m.team1} vs {m.team2}</span>
              <span style={{ color: '#888' }}>{new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              <span style={{ color: '#aaa', flex: 1 }}>{m.venue}</span>
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: m.status === 'live' ? '#dcfce7' : m.status === 'done' ? '#f5f4f0' : '#eff6ff', color: m.status === 'live' ? '#166534' : m.status === 'done' ? '#666' : '#1e40af' }}>{m.status}</span>
            </div>
          ))}
        </div>
        <button style={{ ...s2.btn, ...s2.btnP }} onClick={seedMatches} disabled={seeding}>
          {seeding ? 'Seeding...' : `Seed ${IPL_MATCHES.length} matches to Firestore`}
        </button>
      </div>

      {/* Link CricketData.org match ID */}
      <div style={s2.card}>
        <div style={s2.cardT}>Link CricketData.org match ID</div>
        <p style={{ fontSize: 13, color: '#666', marginBottom: '1rem', lineHeight: 1.6 }}>
          For live scores to work, each match needs its external ID from CricketData.org.
          Find it by calling <code style={{ background: '#f5f4f0', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>https://api.cricapi.com/v1/matches?apikey=YOUR_KEY</code> and searching for the IPL match.
        </p>
        <label style={s2.label}>Match ID (Firestore)</label>
        <select style={{ ...s2.inp }} value={matchId} onChange={e => setMatchId(e.target.value)}>
          <option value="">Select a match…</option>
          {IPL_MATCHES.map(m => <option key={m.id} value={m.id}>{m.team1} vs {m.team2}</option>)}
        </select>
        <label style={s2.label}>External Match ID (from CricketData.org)</label>
        <input style={s2.inp} placeholder="e.g. a1b2c3d4-e5f6-..." value={externalId} onChange={e => setExternalId(e.target.value)} />
        <button style={{ ...s2.btn, ...s2.btnP }} onClick={updateExternalId}>Update match ID</button>
      </div>
    </div>
  )
}
