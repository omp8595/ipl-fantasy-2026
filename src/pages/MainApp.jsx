import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import ContestsPage    from './ContestsPage'
import LeaderboardPage from './LeaderboardPage'
import SelectTeamPage  from './SelectTeamPage'
import ProfilePage     from './ProfilePage'

export default function MainApp() {
  const { user } = useAuth()
  const [tab, setTab]               = useState('contests')
  const [showMenu, setShowMenu] = useState(false)`n  const [activeContest, setContest] = useState({ id: null, name: null })

  function handleSelectContest(id, name) {
    setContest({ id, name })
    setTab('leaderboard')
  }

  const ini = (user?.displayName || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const TABS = [
    { id: 'contests',    label: 'Contests'    },
    { id: 'select',      label: 'My Team'     },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'profile',     label: 'Profile'     },
  ]

  const s = {
    app:    { maxWidth: 1100, margin: '0 auto', padding: '1rem', fontFamily: 'system-ui, sans-serif' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.75rem 1.25rem', background: '#f5f4f0', border: '0.5px solid #e5e5e5', borderRadius: 12, marginBottom: '1rem' },
    logo:   { fontSize: 18, fontWeight: 500 },
    tabs:   { display: 'flex', gap: 4, background: '#f5f4f0', padding: 4, borderRadius: 8, border: '0.5px solid #e5e5e5', marginBottom: '1rem' },
    tab:    { padding: '7px 16px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#666', fontFamily: 'inherit' },
    tabA:   { background: '#fff', color: '#222', border: '0.5px solid #e5e5e5' },
    avatar: { width: 32, height: 32, borderRadius: '50%', background: '#FF6B0022', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: '#FF6B00' },
  }

  return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={s.logo}><span style={{ color: '#FF6B00' }}>IPL</span> Fantasy 2026</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{position:'relative'}}><div style={{...s.avatar,cursor:'pointer'}} onClick={()=>setShowMenu(m=>!m)}>{ini}</div>{showMenu&&<div style={{position:'absolute',top:40,right:0,background:'#fff',border:'0.5px solid #e5e5e5',borderRadius:8,padding:'8px',minWidth:160,zIndex:99}}><div style={{fontSize:13,fontWeight:500,padding:'4px 8px',marginBottom:4}}>{user?.displayName||user?.email?.split('@')[0]}</div><hr style={{margin:'4px 0',border:'none',borderTop:'0.5px solid #e5e5e5'}}/><button onClick={logout} style={{width:'100%',padding:'6px 8px',border:'none',background:'transparent',cursor:'pointer',fontSize:13,color:'#dc2626',textAlign:'left',fontFamily:'inherit'}}>Sign out</button></div>}</div>
        </div>
      </div>

      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t.id}
            style={{ ...s.tab, ...(tab === t.id ? s.tabA : {}) }}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'contests'    && <ContestsPage    onSelectContest={handleSelectContest} />}
      {tab === 'select'      && <SelectTeamPage  />}
      {tab === 'leaderboard' && <LeaderboardPage contestId={activeContest.id} contestName={activeContest.name} />}
      {tab === 'profile'     && <ProfilePage     />}
    </div>
  )
}





