import { useLeaderboard } from '../hooks/useRealtimeData';
import { useAuth } from '../hooks/useAuth';

export default function LeaderboardPage({ contestId, contestName }) {
  const { user } = useAuth();
  const { entries, loading } = useLeaderboard(contestId);

  const PRIZE_PCT = {
    winner: ['100%'],
    top3: ['50%', '30%', '20%'],
    top5: ['40%', '25%', '15%', '10%', '10%'],
  };

  const myEntry = entries.find(e => e.userId === user?.uid);

  const s = {
    card: { background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem' },
    mc: { background: '#f5f4f0', borderRadius: 8, padding: '.875rem', textAlign: 'center' },
    mcLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
    mcVal: { fontSize: 26, fontWeight: 500 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.75rem', marginBottom: '1rem' },
    row: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8 },
    rowYou: { background: '#fff8f5' },
    rank: { fontSize: 13, fontWeight: 500, width: 24, color: '#888' },
    rankTop: { color: '#FF6B00' },
    liveDot: { width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', marginRight: 4, animation: 'blink 1.4s infinite' },
  };

  if (!contestId) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: 13 }}>
      Select a contest from the Contests tab to see the leaderboard
    </div>
  );

  return (
    <div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{contestName}</div>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#dcfce7', color: '#166534', fontWeight: 500 }}>
          <span style={s.liveDot}></span>Live
        </span>
      </div>

      {/* Stats row */}
      <div style={s.grid}>
        <div style={s.mc}>
          <div style={s.mcLabel}>Your rank</div>
          <div style={{ ...s.mcVal, color: myEntry?.rank === 1 ? '#FF6B00' : undefined }}>
            {myEntry ? `#${myEntry.rank}` : '#—'}
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>of {entries.length}</div>
        </div>
        <div style={s.mc}>
          <div style={s.mcLabel}>Your score</div>
          <div style={s.mcVal}>{myEntry?.totalScore || 0}</div>
          <div style={{ fontSize: 11, color: '#888' }}>pts</div>
        </div>
        <div style={s.mc}>
          <div style={s.mcLabel}>Leader</div>
          <div style={{ fontSize: 15, fontWeight: 500, paddingTop: 4 }}>
            {entries[0]?.displayName || '—'}
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>{entries[0]?.totalScore || 0} pts</div>
        </div>
      </div>

      {/* Live leaderboard */}
      <div style={s.card}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.75rem' }}>
          Live standings — updates automatically
        </div>
        {loading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#888', fontSize: 13 }}>Loading...</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#888', fontSize: 13 }}>No participants yet</div>
        ) : entries.map((entry, idx) => {
          const isYou = entry.userId === user?.uid;
          return (
            <div key={entry.userId} style={{ ...s.row, ...(isYou ? s.rowYou : {}), cursor: 'default' }}>
              <div style={{ ...s.rank, ...(idx < 3 ? s.rankTop : {}) }}>#{idx + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: isYou ? '#FF6B00' : undefined }}>
                  {isYou ? '★ ' : ''}{entry.displayName}
                </div>
                {entry.lastUpdated && (
                  <div style={{ fontSize: 10, color: '#aaa' }}>
                    Updated {new Date(entry.lastUpdated?.toDate()).toLocaleTimeString()}
                  </div>
                )}
              </div>
              {idx < 3 && (
                <div style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, background: '#dcfce7', color: '#166534', marginRight: 8 }}>
                  {PRIZE_PCT.top3?.[idx]}
                </div>
              )}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{entry.totalScore}</div>
                {entry.rank === 1 && isYou && (
                  <div style={{ fontSize: 10, color: '#FF6B00' }}>Leader!</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Score breakdown for current user */}
      {myEntry?.breakdown && Object.keys(myEntry.breakdown).length > 0 && (
        <div style={s.card}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.75rem' }}>
            Your team breakdown
          </div>
          {Object.entries(myEntry.breakdown).map(([playerId, data]) => (
            <div key={playerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid #f0f0f0', fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{playerId.replace(/_/g, ' ')}</span>
                {data.role === 'captain' && <span style={{ fontSize: 9, padding: '1px 5px', background: '#FF6B00', color: '#fff', borderRadius: 8 }}>C</span>}
                {data.role === 'viceCaptain' && <span style={{ fontSize: 9, padding: '1px 5px', background: '#1d4ed8', color: '#fff', borderRadius: 8 }}>VC</span>}
                {data.isMoTM && <span style={{ fontSize: 9, padding: '1px 5px', background: '#fef9c3', color: '#854d0e', borderRadius: 8 }}>MoTM</span>}
              </div>
              <div style={{ fontWeight: 500 }}>{data.finalPts}</div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 500, fontSize: 14, borderTop: '1px solid #eee', marginTop: 4 }}>
            <span>Total</span>
            <span style={{ color: '#FF6B00' }}>{myEntry.totalScore}</span>
          </div>
        </div>
      )}
    </div>
  );
}

