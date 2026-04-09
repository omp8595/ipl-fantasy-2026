import { useState } from 'react';\nimport { db } from '../lib/firebase';\nimport { doc, getDoc } from 'firebase/firestore';
import { useLeaderboard } from '../hooks/useRealtimeData';
import { useAuth } from '../hooks/useAuth';

export default function LeaderboardPage({ contestId, contestName }) {
  const { user } = useAuth();
  const { entries, loading } = useLeaderboard(contestId);
  const [sel, setSel] = useState(null);\n  const [teamPlayers, setTeamPlayers] = useState([]);\n  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const myEntry = entries.find(e => e.userId === user?.uid);
  const s = {
    card: { background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem' },
    mc: { background: '#f5f4f0', borderRadius: 8, padding: '.875rem', textAlign: 'center' },
    mcLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
    mcVal: { fontSize: 26, fontWeight: 500 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.75rem', marginBottom: '1rem' },
    row: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, cursor: 'pointer' },
    rowYou: { background: '#fff8f5' },
    rank: { fontSize: 13, fontWeight: 500, width: 24, color: '#888' },
    rankTop: { color: '#FF6B00' },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
    modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto', padding: '1.25rem' },
  };
  if (!contestId) return <div style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: 13 }}>Select a contest from the Contests tab</div>;
  return (
    <div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{contestName}</div>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#dcfce7', color: '#166534', fontWeight: 500 }}>Live</span>
      </div>
      <div style={s.grid}>
        <div style={s.mc}><div style={s.mcLabel}>Your rank</div><div style={s.mcVal}>{myEntry ? `#${myEntry.rank}` : '#-'}</div><div style={{ fontSize: 11, color: '#888' }}>of {entries.length}</div></div>
        <div style={s.mc}><div style={s.mcLabel}>Your score</div><div style={s.mcVal}>{myEntry?.totalScore || 0}</div><div style={{ fontSize: 11, color: '#888' }}>pts</div></div>
        <div style={s.mc}><div style={s.mcLabel}>Leader</div><div style={{ fontSize: 15, fontWeight: 500, paddingTop: 4 }}>{entries[0]?.displayName || '-'}</div><div style={{ fontSize: 11, color: '#888' }}>{entries[0]?.totalScore || 0} pts</div></div>
      </div>
      <div style={s.card}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.75rem' }}>Live standings - tap name to view team</div>
        {loading ? <div style={{ padding: '1.5rem', textAlign: 'center', color: '#888', fontSize: 13 }}>Loading...</div>
        : entries.length === 0 ? <div style={{ padding: '1.5rem', textAlign: 'center', color: '#888', fontSize: 13 }}>No participants yet</div>
        : entries.map((entry, idx) => {
          const isYou = entry.userId === user?.uid;
          return (
            <div key={entry.userId} style={{ ...s.row, ...(isYou ? s.rowYou : {}) }} onClick={() => setSel(entry)}>
              <div style={{ ...s.rank, ...(idx < 3 ? s.rankTop : {}) }}>#{idx + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: isYou ? '#FF6B00' : undefined }}>{isYou ? '★ ' : ''}{entry.displayName} <span style={{ fontSize: 10, color: '#aaa' }}>→</span></div>
              </div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 14, fontWeight: 500 }}>{entry.totalScore}</div><div style={{ fontSize: 10, color: '#888' }}>pts</div></div>
            </div>
          );
        })}
      </div>
      {sel && (
        <div style={s.overlay} onClick={() => setSel(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div><div style={{ fontSize: 15, fontWeight: 500 }}>{sel.displayName}'s Team</div><div style={{ fontSize: 12, color: '#888' }}>Score: {sel.totalScore} pts</div></div>
              <button onClick={() => setSel(null)} style={{ border: 'none', background: '#f0f0f0', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>Close</button>
            </div>
            {sel.breakdown && Object.keys(sel.breakdown).length > 0 ? (
              <div>
                {Object.entries(sel.breakdown).map(([pid, data]) => (
                  <div key={pid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid #f0f0f0', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 500 }}>{pid.split('_').slice(1).join(' ')}</span>
                      {data.role === 'captain' && <span style={{ fontSize: 9, padding: '1px 5px', background: '#FF6B00', color: '#fff', borderRadius: 8 }}>C</span>}
                      {data.role === 'viceCaptain' && <span style={{ fontSize: 9, padding: '1px 5px', background: '#1d4ed8', color: '#fff', borderRadius: 8 }}>VC</span>}
                      <span style={{ fontSize: 10, color: '#888' }}>{pid.split('_')[0]}</span>
                    </div>
                    <span style={{ fontWeight: 500 }}>{data.finalPts || 0} pts</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 600, fontSize: 14, borderTop: '1px solid #eee', marginTop: 4 }}>
                  <span>Total</span><span style={{ color: '#FF6B00' }}>{sel.totalScore} pts</span>
                </div>
              </div>
            ) : <div style={{ color: '#888', textAlign: 'center', padding: '1.5rem', fontSize: 13 }}>No team data yet. Points update when match starts.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
