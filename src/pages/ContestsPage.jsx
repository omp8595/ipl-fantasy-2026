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

  const MATCH_LABELS = {
    'CSK_RR_2026_M03': 'CSK vs RR',
    'GT_PBKS_2026_M04': 'GT vs PBKS',
    'LSG_DC_2026_M05': 'LSG vs DC',
    'KKR_SRH_2026_M06': 'KKR vs SRH',
    'MI_DC_2026_M08': 'MI vs DC',
  };

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
            {Object.entries(MATCH_LABELS).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
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
