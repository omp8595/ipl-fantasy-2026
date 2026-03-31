import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Real-time leaderboard for a contest.
 * onSnapshot fires instantly whenever any score changes in Firestore —
 * all participants see the update within ~200ms.
 */
export function useLeaderboard(contestId) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!contestId) return;

    const q = query(
      collection(db, 'contests', contestId, 'leaderboard'),
      orderBy('totalScore', 'desc')
    );

    const unsub = onSnapshot(q,
      (snap) => {
        const data = snap.docs.map((doc, idx) => ({
          id: doc.id,
          ...doc.data(),
          rank: idx + 1, // client-side rank from ordered query
        }));
        setEntries(data);
        setLoading(false);
      },
      (err) => {
        console.error('Leaderboard listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub; // cleanup on unmount
  }, [contestId]);

  return { entries, loading, error };
}

/**
 * Real-time player scores for a match.
 * Updates every time the Cloud Function writes new stats.
 */
export function useMatchPlayerScores(matchId) {
  const [playerScores, setPlayerScores] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;

    const unsub = onSnapshot(
      collection(db, 'matches', matchId, 'playerScores'),
      (snap) => {
        const scores = {};
        snap.docs.forEach(doc => {
          scores[doc.id] = doc.data();
        });
        setPlayerScores(scores);
        setLoading(false);
      }
    );

    return unsub;
  }, [matchId]);

  return { playerScores, loading };
}

/**
 * Real-time match status (live score, lock status).
 */
export function useMatch(matchId) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;
    const { doc, onSnapshot: snap } = require('firebase/firestore');
    const unsub = snap(doc(db, 'matches', matchId), (d) => {
      setMatch(d.exists() ? { id: d.id, ...d.data() } : null);
      setLoading(false);
    });
    return unsub;
  }, [matchId]);

  return { match, loading };
}

