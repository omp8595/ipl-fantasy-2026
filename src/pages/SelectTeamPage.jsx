import { useState, useEffect } from 'react';
import { callFn } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

const BUDGET = 100;
const TEAM_COLORS = { CSK:'#f59e0b',MI:'#004BA0',RCB:'#D11',KKR:'#7c3aed',SRH:'#f97316',DC:'#1d4ed8',RR:'#e91e8c',GT:'#0369a1',LSG:'#16a34a',PBKS:'#dc2626' };

const SQUADS = {
  CSK:[{n:'Ruturaj Gaikwad',r:'BAT',c:9.5},{n:'MS Dhoni',r:'WK',c:9.0},{n:'Sanju Samson',r:'WK',c:8.5},{n:'Shivam Dube',r:'AR',c:8.0},{n:'Jamie Overton',r:'AR',c:7.5},{n:'Khaleel Ahmed',r:'BOWL',c:7.5},{n:'Noor Ahmad',r:'BOWL',c:7.0},{n:'Matthew Short',r:'AR',c:7.0},{n:'Sarfaraz Khan',r:'BAT',c:7.0},{n:'Dewald Brevis',r:'BAT',c:7.5},{n:'Rahul Chahar',r:'BOWL',c:6.5},{n:'Nathan Ellis',r:'BOWL',c:6.5}],
  RR:[{n:'Yashasvi Jaiswal',r:'BAT',c:10.0},{n:'Ravindra Jadeja',r:'AR',c:9.5},{n:'Jofra Archer',r:'BOWL',c:9.0},{n:'Riyan Parag',r:'AR',c:8.5},{n:'Ravi Bishnoi',r:'BOWL',c:8.0},{n:'Sam Curran',r:'AR',c:8.0},{n:'Dhruv Jurel',r:'WK',c:7.5},{n:'Shimron Hetmyer',r:'BAT',c:7.5},{n:'Nandre Burger',r:'BOWL',c:7.5},{n:'Vaibhav Suryavanshi',r:'BAT',c:7.0},{n:'Adam Milne',r:'BOWL',c:7.0},{n:'Tushar Deshpande',r:'BOWL',c:7.0}],
  GT:[{n:'Shubman Gill',r:'BAT',c:10.0},{n:'Rashid Khan',r:'AR',c:10.0},{n:'Jos Buttler',r:'WK',c:9.5},{n:'Kagiso Rabada',r:'BOWL',c:9.5},{n:'Mohammed Siraj',r:'BOWL',c:8.5},{n:'Sai Sudharsan',r:'BAT',c:8.5},{n:'Washington Sundar',r:'AR',c:8.0},{n:'Glenn Phillips',r:'BAT',c:7.5},{n:'Jason Holder',r:'AR',c:7.5},{n:'Prasidh Krishna',r:'BOWL',c:7.5},{n:'Rahul Tewatia',r:'AR',c:7.5},{n:'Kumar Kushagra',r:'WK',c:6.0}],
  MI:[{n:'Rohit Sharma',r:'BAT',c:10.0},{n:'Jasprit Bumrah',r:'BOWL',c:10.5},{n:'Suryakumar Yadav',r:'BAT',c:10.0},{n:'Hardik Pandya',r:'AR',c:10.0},{n:'Tilak Varma',r:'BAT',c:8.5},{n:'Ryan Rickelton',r:'WK',c:7.5},{n:'Trent Boult',r:'BOWL',c:8.5},{n:'Will Jacks',r:'AR',c:8.0},{n:'Mitchell Santner',r:'AR',c:7.5},{n:'Deepak Chahar',r:'BOWL',c:7.5},{n:'Naman Dhir',r:'AR',c:6.5},{n:'Robin Minz',r:'WK',c:5.5}],
  LSG:[{n:'Rishabh Pant',r:'WK',c:10.5},{n:'Mohammad Shami',r:'BOWL',c:9.5},{n:'Mitchell Marsh',r:'AR',c:9.0},{n:'Nicholas Pooran',r:'WK',c:8.5},{n:'Wanindu Hasaranga',r:'AR',c:8.5},{n:'Anrich Nortje',r:'BOWL',c:8.5},{n:'Aiden Markram',r:'AR',c:8.0},{n:'Mayank Yadav',r:'BOWL',c:8.0},{n:'Josh Inglis',r:'WK',c:7.5},{n:'Avesh Khan',r:'BOWL',c:7.5},{n:'Abdul Samad',r:'AR',c:7.0},{n:'Ayush Badoni',r:'AR',c:7.0}],
};

const MATCH_OPTIONS = [
  { id: 'CSK_RR_2026_M03', label: 'CSK vs RR â€” Mar 30 (Live)', teams: ['CSK', 'RR'] },
  { id: 'GT_PBKS_2026_M04', label: 'GT vs PBKS â€” Mar 30', teams: ['GT', 'PBKS'] },
  { id: 'LSG_DC_2026_M05', label: 'LSG vs DC â€” Apr 1', teams: ['LSG', 'DC'] },
  { id: 'MI_DC_2026_M08',  label: 'MI vs DC â€” Apr 4',  teams: ['MI', 'DC'] },
];

export default function SelectTeamPage() {
  const [apiMatches,setApiMatches]=useState([]);
  useEffect(()=>{fetch('https://api.cricapi.com/v1/matches?apikey=30dd02c2-f08d-4532-a9a4-09daf3a6766a&offset=0').then(r=>r.json()).then(d=>{if(d.data&&d.data.length>0){const t=['CSK','MI','RCB','KKR','SRH','DC','RR','GT','LSG','PBKS'];const ipl=d.data.filter(m=>m.name&&t.some(x=>m.name.toUpperCase().includes(x)));if(ipl.length>0)setApiMatches(ipl.map(m=>({id:m.id,label:m.name,teams:m.teams||[]})))}}).catch(()=>{});},[]);
  const { user } = useAuth();
  const [matchId, setMatchId] = useState('SRH_RCB_2026_M01');
  const [selected, setSelected] = useState([]);
  const [capId, setCapId] = useState(null);
  const [vcId, setVcId] = useState(null);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const allMatches=apiMatches.length>0?apiMatches:MATCH_OPTIONS; // fallback
  const match=allMatches.find(m => m.id === matchId);
  const pool = match.teams.flatMap(t =>
    (SQUADS[t] || []).map(p => ({ ...p, team: t, id: `${t}_${p.n.replace(/\s+/g,'_')}` }))
  ).filter(p => roleFilter === 'ALL' || p.r === roleFilter);

  const budgetUsed = selected.reduce((s, id) => {
    const p = pool.find(x => x.id === id) || Object.values(SQUADS).flat().find(x => `${x.team}_${x.n.replace(/\s+/g,'_')}` === id);
    return s + (p?.c || 0);
  }, 0);

  function addPlayer(id) {
    if (selected.includes(id)) { removePlayer(id); return; }
    if (selected.length >= 11) { showToast('Team full!'); return; }
    const p = pool.find(x => x.id === id);
    if (!p) return;
    if (budgetUsed + p.c > BUDGET) { showToast('Over budget!'); return; }
    if (selected.filter(s => s.startsWith(p.team + '_')).length >= 7) { showToast(`Max 7 from ${p.team}`); return; }
    setSelected(prev => [...prev, id]);
  }

  function removePlayer(id) {
    setSelected(prev => prev.filter(s => s !== id));
    if (capId === id) setCapId(null);
    if (vcId === id) setVcId(null);
  }

  async function handleSubmit() {
    if (selected.length !== 11 || !capId || !vcId) { showToast('Select 11 players with C & VC'); return; }
    setSubmitting(true);
    try {
      await callFn.submitTeam({ matchId, players: selected, captainId: capId, vcId, budgetUsed });
      showToast('Team submitted! Now join a contest.');
    } catch (err) {
      showToast(err.message || 'Error submitting team');
    } finally {
      setSubmitting(false);
    }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  const pct = Math.round((budgetUsed / BUDGET) * 100);
  const s = {
    card: { background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem' },
    btn: { padding: '8px 16px', borderRadius: 8, border: '0.5px solid #e5e5e5', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: '#fff' },
    btnPrimary: { background: '#FF6B00', border: 'none', color: '#fff' },
    fbtn: { padding: '3px 12px', borderRadius: 12, border: '0.5px solid #e5e5e5', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#666' },
    fbtnActive: { background: '#f5f4f0', color: '#222' },
    input: { padding: '7px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, marginBottom: 10, outline: 'none' },
  };

  return (
    <div>
      {toast && <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#fff', border: '0.5px solid #ccc', borderRadius: 8, padding: '9px 14px', fontSize: 13, zIndex: 99 }}>{toast}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Match:</span>
        <select style={{ ...s.input, marginBottom: 0 }} value={matchId} onChange={e => { setMatchId(e.target.value); setSelected([]); setCapId(null); setVcId(null); }}>
          {allMatches.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1rem' }}>
        {/* Left: team slots */}
        <div style={s.card}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.5rem' }}>Your XI</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 3 }}>
            <span>Budget</span><span>{budgetUsed.toFixed(1)} / {BUDGET} pts</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: '#f0f0f0', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', borderRadius: 2, background: pct > 90 ? '#ef4444' : pct > 75 ? '#f59e0b' : '#FF6B00', width: pct + '%', transition: 'width .3s' }} />
          </div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: '.75rem' }}>
            {selected.length}/11 Â· {capId && vcId ? <span style={{ color: '#16a34a' }}>C & VC set âœ“</span> : 'C & VC not set'}
          </div>

          {/* Slot grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: '.75rem' }}>
            {Array.from({ length: 11 }, (_, i) => {
              const pid = selected[i];
              const [team, ...nameParts] = pid?.split('_') || [];
              const name = nameParts.join(' ');
              const isCap = pid === capId, isVC = pid === vcId;
              return (
                <div key={i} style={{ border: `0.5px ${pid ? 'solid' : 'dashed'} ${isCap ? '#FF6B00' : isVC ? '#1d4ed8' : '#e5e5e5'}`, borderRadius: 8, padding: 5, textAlign: 'center', minHeight: 54, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', background: pid ? '#fafaf8' : 'transparent' }}>
                  {isCap && <span style={{ position: 'absolute', top: -6, right: -6, fontSize: 9, fontWeight: 500, padding: '1px 5px', borderRadius: 8, background: '#FF6B00', color: '#fff' }}>C</span>}
                  {isVC && <span style={{ position: 'absolute', top: -6, right: -6, fontSize: 9, fontWeight: 500, padding: '1px 5px', borderRadius: 8, background: '#1d4ed8', color: '#fff' }}>VC</span>}
                  {pid ? (
                    <>
                      <div style={{ fontSize: 9, color: TEAM_COLORS[team] || '#888' }}>{team}</div>
                      <div style={{ fontSize: 10, fontWeight: 500 }}>{name.split(' ').slice(-1)[0]}</div>
                      <button onClick={() => removePlayer(pid)} style={{ position: 'absolute', top: -5, left: -5, width: 13, height: 13, borderRadius: '50%', background: '#fef2f2', border: 'none', cursor: 'pointer', fontSize: 9, color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>Ã—</button>
                    </>
                  ) : <span style={{ fontSize: 10, color: '#ccc' }}>Empty</span>}
                </div>
              );
            })}
          </div>

          <button style={{ ...s.btn, ...s.btnPrimary, width: '100%', marginBottom: 6 }}
            disabled={selected.length !== 11 || !capId || !vcId || submitting}
            onClick={handleSubmit}>
            {submitting ? 'Submitting...' : 'Submit team'}
          </button>
          <button style={{ ...s.btn, width: '100%', fontSize: 12 }} onClick={() => { setSelected([]); setCapId(null); setVcId(null); }}>Clear all</button>
        </div>

        {/* Right: player list */}
        <div style={s.card}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.5rem' }}>
            {match.teams.join(' & ')} players
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '.75rem' }}>
            {['ALL', 'BAT', 'BOWL', 'AR', 'WK'].map(f => (
              <button key={f} style={{ ...s.fbtn, ...(roleFilter === f ? s.fbtnActive : {}) }} onClick={() => setRoleFilter(f)}>{f === 'ALL' ? 'All' : f}</button>
            ))}
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {pool.map(p => {
              const isSel = selected.includes(p.id);
              const over = !isSel && budgetUsed + p.c > BUDGET;
              const full = !isSel && selected.length >= 11;
              const dis = (over || full) && !isSel;
              const isCap = capId === p.id, isVC = vcId === p.id;
              const col = TEAM_COLORS[p.team] || '#888';
              const ini = p.n.split(' ').map(w => w[0]).join('').slice(0, 2);
              return (
                <div key={p.id} onClick={() => !dis && addPlayer(p.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 5px', borderRadius: 8, cursor: dis ? 'not-allowed' : 'pointer', border: `0.5px solid ${isSel ? '#FF6B00' : 'transparent'}`, background: isSel ? '#fff8f5' : 'transparent', opacity: dis ? .35 : 1, marginBottom: 2 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: col + '22', color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>{ini}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.n}</div>
                    <div style={{ fontSize: 10, color: '#888' }}><span style={{ color: col, fontWeight: 500 }}>{p.team}</span> Â· {p.r}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.c} pts</div>
                    {isSel && (
                      <div style={{ display: 'flex', gap: 3, marginTop: 2, justifyContent: 'flex-end' }}>
                        {!isCap ? <button style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, border: '0.5px solid #e5e5e5', background: 'transparent', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); vcId !== p.id && setCapId(p.id); }}>C</button>
                          : <span style={{ fontSize: 9, color: '#FF6B00', fontWeight: 500 }}>C</span>}
                        {!isVC ? <button style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, border: '0.5px solid #e5e5e5', background: 'transparent', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); capId !== p.id && setVcId(p.id); }}>VC</button>
                          : <span style={{ fontSize: 9, color: '#1d4ed8', fontWeight: 500 }}>VC</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

