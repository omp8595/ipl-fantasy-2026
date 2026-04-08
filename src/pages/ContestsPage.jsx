import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, getDoc, setDoc, updateDoc, addDoc, getDocs, where, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

export default function ContestsPage({ onSelectContest }) {
  const { user } = useAuth();
  const [contests, setContests] = useState([]);
  const [joinedIds, setJoinedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', matchId: 'CSK_RR_2026_M03', max: 10, prizeType: 'winner' });
  const [toast, setToast] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'contests'));
    const unsub = onSnapshot(q, snap => {
      setContests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user || !contests.length) return;
    const checkJoined = async () => {
      const ids = new Set();
      for (const c of contests) {
        try {
          const ref = doc(db, 'contests', c.id, 'leaderboard', user.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) ids.add(c.id);
        } catch (e) {}
      }
      setJoinedIds(ids);
    };
    checkJoined();
  }, [contests, user]);

  function showToast(msg) {
    setToast(msg || 'Something went wrong');
    setTimeout(() => setToast(''), 3000);
  }

  async function createContest() {
    if (!form.name.trim()) return showToast('Enter a contest name');
    setCreating(true);
    try {
      const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      await addDoc(collection(db, 'contests'), {
        name: form.name.trim(),
        matchId: form.matchId,
        createdBy: user.uid,
        creatorName: user.displayName || user.email,
        inviteCode,
        maxParticipants: parseInt(form.max) || 10,
        entryFee: 0,
        prizeType: form.prizeType,
        prize: 'Bragging rights',
        status: 'open',
        memberCount: 0,
        createdAt: serverTimestamp(),
      });
      setShowCreate(false);
      showToast('Contest created! Code: ' + inviteCode);
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(contestId) {
    if (!user) { showToast('Please sign in first'); return; }
    const contest = contests.find(c => c.id === contestId);
    if (!contest) { showToast('Contest not found'); return; }
    try {
      const lbRef = doc(db, 'contests', contestId, 'leaderboard', user.uid);
      const existing = await getDoc(lbRef);
      if (existing.exists()) { showToast('Already joined this contest'); return; }
      await setDoc(lbRef, {
        userId: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Player',
        totalScore: 0,
        rank: 1,
        joinedAt: serverTimestamp(),
        breakdown: {},
        lastUpdated: serverTimestamp(),
      });
      await updateDoc(doc(db, 'contests', contestId), {
        memberCount: increment(1),
      });
      setJoinedIds(prev => new Set([...prev, contestId]));
      showToast('Joined "' + contest.name + '"!');
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  }

  async function handleJoinByCode() {
    if (!joinCode.trim()) { showToast('Enter an invite code'); return; }
    const code = joinCode.trim().toUpperCase();
    try {
      const q = query(collection(db, 'contests'), where('inviteCode', '==', code));
      const snap = await getDocs(q);
      if (snap.empty) { showToast('No contest found with that code'); return; }
      const contestId = snap.docs[0].id;
      await handleJoin(contestId);
      setJoinCode('');
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  }

  const MATCH_OPTIONS = [
    {id:'SRH_RCB_2026_M01',label:'SRH vs RCB - Mar 28'},{id:'KKR_MI_2026_M02',label:'KKR vs MI - Mar 29'},{id:'CSK_RR_2026_M03',label:'CSK vs RR - Mar 30'},{id:'GT_PBKS_2026_M04',label:'GT vs PBKS - Mar 30'},{id:'LSG_DC_2026_M05',label:'LSG vs DC - Apr 1'},{id:'SRH_KKR_2026_M06',label:'SRH vs KKR - Apr 1'},{id:'CSK_PBKS_2026_M07',label:'CSK vs PBKS - Apr 2'},{id:'MI_DC_2026_M08',label:'MI vs DC - Apr 3'},{id:'RR_GT_2026_M09',label:'RR vs GT - Apr 4'},{id:'SRH_LSG_2026_M10',label:'SRH vs LSG - Apr 5'},{id:'RCB_CSK_2026_M11',label:'RCB vs CSK - Apr 5'},{id:'KKR_PBKS_2026_M12',label:'KKR vs PBKS - Apr 6'},{id:'RR_MI_2026_M13',label:'RR vs MI - Apr 7'},{id:'DC_GT_2026_M14',label:'DC vs GT - Apr 8'},{id:'KKR_LSG_2026_M15',label:'KKR vs LSG - Apr 9'},{id:'RR_RCB_2026_M16',label:'RR vs RCB - Apr 10'},{id:'PBKS_SRH_2026_M17',label:'PBKS vs SRH - Apr 11'},{id:'CSK_DC_2026_M18',label:'CSK vs DC - Apr 12'},{id:'LSG_GT_2026_M19',label:'LSG vs GT - Apr 12'},{id:'MI_RCB_2026_M20',label:'MI vs RCB - Apr 13'},{id:'SRH_RR_2026_M21',label:'SRH vs RR - Apr 14'},{id:'CSK_KKR_2026_M22',label:'CSK vs KKR - Apr 15'},{id:'RCB_LSG_2026_M23',label:'RCB vs LSG - Apr 16'},{id:'MI_PBKS_2026_M24',label:'MI vs PBKS - Apr 16'},{id:'GT_KKR_2026_M25',label:'GT vs KKR - Apr 17'},{id:'RCB_DC_2026_M26',label:'RCB vs DC - Apr 18'},{id:'SRH_CSK_2026_M27',label:'SRH vs CSK - Apr 19'},{id:'KKR_RR_2026_M28',label:'KKR vs RR - Apr 19'},{id:'PBKS_LSG_2026_M29',label:'PBKS vs LSG - Apr 20'},{id:'GT_MI_2026_M30',label:'GT vs MI - Apr 20'},{id:'SRH_DC_2026_M31',label:'SRH vs DC - Apr 21'},{id:'LSG_RR_2026_M32',label:'LSG vs RR - Apr 22'},{id:'MI_CSK_2026_M33',label:'MI vs CSK - Apr 23'},{id:'RCB_GT_2026_M34',label:'RCB vs GT - Apr 23'},{id:'DC_PBKS_2026_M35',label:'DC vs PBKS - Apr 24'},{id:'RR_SRH_2026_M36',label:'RR vs SRH - Apr 25'},{id:'GT_CSK_2026_M37',label:'GT vs CSK - Apr 26'},{id:'LSG_KKR_2026_M38',label:'LSG vs KKR - Apr 26'},{id:'DC_RCB_2026_M39',label:'DC vs RCB - Apr 27'},{id:'PBKS_RR_2026_M40',label:'PBKS vs RR - Apr 27'},{id:'MI_SRH_2026_M41',label:'MI vs SRH - Apr 28'},{id:'GT_RCB_2026_M42',label:'GT vs RCB - Apr 29'},{id:'RR_DC_2026_M43',label:'RR vs DC - Apr 29'},{id:'CSK_LSG_2026_M44',label:'CSK vs LSG - Apr 30'},{id:'KKR_SRH_2026_M45',label:'KKR vs SRH - Apr 30'},{id:'PBKS_GT_2026_M46',label:'PBKS vs GT - May 1'},{id:'DC_MI_2026_M47',label:'DC vs MI - May 2'},{id:'RR_CSK_2026_M48',label:'RR vs CSK - May 3'},{id:'LSG_SRH_2026_M49',label:'LSG vs SRH - May 3'},{id:'KKR_GT_2026_M50',label:'KKR vs GT - May 4'},{id:'RCB_PBKS_2026_M51',label:'RCB vs PBKS - May 4'},{id:'MI_RR_2026_M52',label:'MI vs RR - May 5'},{id:'DC_CSK_2026_M53',label:'DC vs CSK - May 6'},{id:'SRH_GT_2026_M54',label:'SRH vs GT - May 6'},{id:'LSG_PBKS_2026_M55',label:'LSG vs PBKS - May 7'},{id:'KKR_DC_2026_M56',label:'KKR vs DC - May 8'},{id:'RCB_RR_2026_M57',label:'RCB vs RR - May 8'},{id:'GT_LSG_2026_M58',label:'GT vs LSG - May 9'},{id:'MI_KKR_2026_M59',label:'MI vs KKR - May 10'},{id:'CSK_SRH_2026_M60',label:'CSK vs SRH - May 10'},{id:'PBKS_DC_2026_M61',label:'PBKS vs DC - May 11'},{id:'RR_LSG_2026_M62',label:'RR vs LSG - May 11'},{id:'GT_SRH_2026_M63',label:'GT vs SRH - May 12'},{id:'RCB_MI_2026_M64',label:'RCB vs MI - May 13'},{id:'CSK_GT_2026_M65',label:'CSK vs GT - May 14'},{id:'KKR_RCB_2026_M66',label:'KKR vs RCB - May 15'},{id:'DC_RR_2026_M67',label:'DC vs RR - May 16'},{id:'SRH_PBKS_2026_M68',label:'SRH vs PBKS - May 17'},{id:'MI_LSG_2026_M69',label:'MI vs LSG - May 17'},{id:'CSK_MI_2026_M70',label:'CSK vs MI - May 18'},{id:'Q1_2026_M71',label:'Qualifier 1 - May 26'},{id:'EL_2026_M72',label:'Eliminator - May 27'},{id:'Q2_2026_M73',label:'Qualifier 2 - May 29'},{id:'FINAL_2026_M74',label:'FINAL - May 31'}
  ];
  const MATCH_LABELS = Object.fromEntries(MATCH_OPTIONS.map(m=>([m.id,m.label])));

  const filtered = contests.filter(c => {
    if (filter === 'joined') return joinedIds.has(c.id);
    if (filter === 'free') return c.entryFee === 0;
    return true;
  });

  const s = {
    card: { background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '.75rem' },
    cardJoined: { border: '1.5px solid #FF6B00' },
    btn: { padding: '7px 14px', borderRadius: 8, border: '0.5px solid #e5e5e5', cursor: 'pointer', fontSize: 12, fontWeight: 500, background: '#fff', fontFamily: 'inherit' },
    btnPrimary: { background: '#FF6B00', border: 'none', color: '#fff' },
    fbtn: { padding: '4px 12px', borderRadius: 12, border: '0.5px solid #e5e5e5', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#666', fontFamily: 'inherit' },
    fbtnActive: { background: '#f5f4f0', color: '#222', borderColor: '#ccc' },
    input: { padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box', marginBottom: 10, outline: 'none', fontFamily: 'inherit' },
    label: { display: 'block', fontSize: 12, color: '#666', marginBottom: 4 },
    progTrack: { height: 4, borderRadius: 2, background: '#f0f0f0', overflow: 'hidden', margin: '5px 0' },
    progFill: { height: '100%', borderRadius: 2, background: '#FF6B00' },
  };

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#fff', border: '0.5px solid #ccc', borderRadius: 8, padding: '9px 14px', fontSize: 13, zIndex: 99 }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'joined', 'free'].map(f => (
          <button key={f} style={{ ...s.fbtn, ...(filter === f ? s.fbtnActive : {}) }} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button style={{ ...s.btn, ...s.btnPrimary, marginLeft: 'auto' }} onClick={() => setShowCreate(!showCreate)}>
          + Create contest
        </button>
      </div>

      {showCreate && (
        <div style={{ ...s.card, border: '1.5px solid #FF6B00', marginBottom: '1rem' }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '.75rem' }}>Create a private contest</div>
          <label style={s.label}>Contest name</label>
          <input style={s.input} placeholder="e.g. Office Fantasy League" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <label style={s.label}>Match</label>
          <select style={{ ...s.input }} value={form.matchId} onChange={e => setForm(f => ({ ...f, matchId: e.target.value }))}>
            {MATCH_OPTIONS.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <label style={s.label}>Max participants</label>
          <input style={s.input} type="number" min="2" max="1000" value={form.max} onChange={e => setForm(f => ({ ...f, max: e.target.value }))} />
          <label style={s.label}>Prize structure</label>
          <select style={{ ...s.input }} value={form.prizeType} onChange={e => setForm(f => ({ ...f, prizeType: e.target.value }))}>
            <option value="winner">Winner takes all</option>
            <option value="top3">Top 3 (50/30/20)</option>
            <option value="top5">Top 5 payout</option>
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...s.btn, ...s.btnPrimary }} onClick={createContest} disabled={creating}>
              {creating ? 'Creating...' : 'Create & get invite code'}
            </button>
            <button style={s.btn} onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: 13 }}>Loading contests...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: 13 }}>No contests found</div>
      ) : filtered.map(c => {
        const isJoined = joinedIds.has(c.id);
        const pct = Math.min(100, Math.round(((c.memberCount || 0) / (c.maxParticipants || 10)) * 100));
        return (
          <div key={c.id} style={{ ...s.card, ...(isJoined ? s.cardJoined : {}) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  {MATCH_LABELS[c.matchId] || c.matchId} · {c.entryFee === 0 ? 'Free entry' : `₹${c.entryFee}`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#FF6B00' }}>🏆 {c.prize}</div>
                <div style={{ fontSize: 10, color: '#888' }}>
                  {c.prizeType === 'winner' ? 'Winner takes all' : c.prizeType === 'top3' ? 'Top 3 paid' : 'Top 5 paid'}
                </div>
              </div>
            </div>
            <div style={s.progTrack}><div style={{ ...s.progFill, width: pct + '%' }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <div style={{ fontSize: 11, color: '#888' }}>
                {c.memberCount || 0} / {c.maxParticipants?.toLocaleString()} spots
                &nbsp;·&nbsp; Code: <strong style={{ fontFamily: 'monospace' }}>{c.inviteCode}</strong>
              </div>
              {isJoined ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>Joined</span>
                  <button style={{ ...s.btn, fontSize: 11 }} onClick={() => onSelectContest(c.id, c.name)}>View leaderboard</button>
                </div>
              ) : (
                <button style={{ ...s.btn, ...s.btnPrimary, fontSize: 12 }} onClick={() => handleJoin(c.id)}>
                  Join free
                </button>
              )}
            </div>
          </div>
        );
      })}

      <div style={{ ...s.card, marginTop: '.5rem' }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: '.5rem' }}>Have an invite code?</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={{ ...s.input, marginBottom: 0, flex: 1 }} placeholder="Enter 6-digit code" value={joinCode} onChange={e => setJoinCode(e.target.value)} />
          <button style={{ ...s.btn, ...s.btnPrimary }} onClick={handleJoinByCode}>Join</button>
        </div>
      </div>
    </div>
  );
}
