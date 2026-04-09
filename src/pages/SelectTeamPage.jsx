import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

const BUDGET = 100;
const TEAM_COLORS = { CSK:'#f59e0b',MI:'#004BA0',RCB:'#D11',KKR:'#7c3aed',SRH:'#f97316',DC:'#1d4ed8',RR:'#e91e8c',GT:'#0369a1',LSG:'#16a34a',PBKS:'#dc2626' };

const SQUADS = {
  CSK:[{n:'Ruturaj Gaikwad',r:'BAT',c:10.0},{n:'MS Dhoni',r:'WK',c:9.0},{n:'Sanju Samson',r:'WK',c:9.0},{n:'Dewald Brevis',r:'AR',c:8.0},{n:'Ayush Mhatre',r:'BAT',c:7.5},{n:'Kartik Sharma',r:'BAT',c:7.0},{n:'Sarfaraz Khan',r:'BAT',c:7.5},{n:'Shivam Dube',r:'AR',c:8.0},{n:'Jamie Overton',r:'AR',c:7.5},{n:'Matthew Short',r:'AR',c:7.0},{n:'Khaleel Ahmed',r:'BOWL',c:7.5},{n:'Noor Ahmad',r:'BOWL',c:7.5},{n:'Anshul Kamboj',r:'BOWL',c:7.0},{n:'Rahul Chahar',r:'BOWL',c:6.5},{n:'Spencer Johnson',r:'BOWL',c:7.0}],
  MI:[{n:'Rohit Sharma',r:'BAT',c:10.0},{n:'Jasprit Bumrah',r:'BOWL',c:10.5},{n:'Suryakumar Yadav',r:'BAT',c:10.0},{n:'Hardik Pandya',r:'AR',c:10.0},{n:'Tilak Varma',r:'BAT',c:8.5},{n:'Ryan Rickelton',r:'WK',c:7.5},{n:'Quinton de Kock',r:'WK',c:9.0},{n:'Trent Boult',r:'BOWL',c:8.5},{n:'Will Jacks',r:'AR',c:8.0},{n:'Mitchell Santner',r:'AR',c:7.5},{n:'Deepak Chahar',r:'BOWL',c:7.5},{n:'Naman Dhir',r:'AR',c:6.5},{n:'Shardul Thakur',r:'AR',c:7.5},{n:'Allah Ghazanfar',r:'BOWL',c:7.0},{n:'Robin Minz',r:'WK',c:5.5}],
  RCB:[{n:'Virat Kohli',r:'BAT',c:11.0},{n:'Rajat Patidar',r:'BAT',c:8.5},{n:'Phil Salt',r:'WK',c:9.0},{n:'Liam Livingstone',r:'AR',c:8.5},{n:'Tim David',r:'BAT',c:8.0},{n:'Jacob Bethell',r:'AR',c:7.5},{n:'Krunal Pandya',r:'AR',c:8.0},{n:'Josh Hazlewood',r:'BOWL',c:9.0},{n:'Yash Dayal',r:'BOWL',c:7.5},{n:'Suyash Sharma',r:'BOWL',c:7.0},{n:'Swapnil Singh',r:'AR',c:6.5},{n:'Romario Shepherd',r:'AR',c:7.5},{n:'Nuwan Thushara',r:'BOWL',c:7.0},{n:'Manoj Bhandage',r:'AR',c:6.5},{n:'Abhinandan Singh',r:'BAT',c:5.5}],
  KKR:[{n:'Ajinkya Rahane',r:'BAT',c:7.5},{n:'Rinku Singh',r:'BAT',c:8.5},{n:'Sunil Narine',r:'AR',c:9.5},{n:'Cameron Green',r:'AR',c:10.0},{n:'Varun Chakaravarthy',r:'BOWL',c:9.0},{n:'Matheesha Pathirana',r:'BOWL',c:9.0},{n:'Rachin Ravindra',r:'AR',c:8.5},{n:'Angkrish Raghuvanshi',r:'BAT',c:7.5},{n:'Rovman Powell',r:'BAT',c:8.0},{n:'Finn Allen',r:'WK',c:8.0},{n:'Blessing Muzarabani',r:'BOWL',c:7.5},{n:'Vaibhav Arora',r:'BOWL',c:7.0},{n:'Ramandeep Singh',r:'AR',c:7.0},{n:'Anukul Roy',r:'AR',c:6.5},{n:'Navdeep Saini',r:'BOWL',c:6.5}],
  SRH:[{n:'Heinrich Klaasen',r:'WK',c:9.5},{n:'Travis Head',r:'BAT',c:10.0},{n:'Pat Cummins',r:'AR',c:10.0},{n:'Abhishek Sharma',r:'BAT',c:8.5},{n:'Nitish Kumar Reddy',r:'AR',c:8.0},{n:'Liam Livingstone',r:'AR',c:8.5},{n:'Ishan Kishan',r:'WK',c:8.0},{n:'Harshal Patel',r:'BOWL',c:7.5},{n:'Bhuvneshwar Kumar',r:'BOWL',c:7.5},{n:'Adam Zampa',r:'BOWL',c:7.5},{n:'Jaydev Unadkat',r:'BOWL',c:6.5},{n:'Simarjeet Singh',r:'BOWL',c:6.5},{n:'Zeeshan Ansari',r:'BOWL',c:6.0},{n:'Atharva Taide',r:'BAT',c:6.5},{n:'Aniket Verma',r:'BAT',c:6.0}],
  DC:[{n:'KL Rahul',r:'WK',c:10.0},{n:'Axar Patel',r:'AR',c:9.5},{n:'Mitchell Starc',r:'BOWL',c:9.5},{n:'Kuldeep Yadav',r:'BOWL',c:9.0},{n:'David Miller',r:'BAT',c:8.5},{n:'Tristan Stubbs',r:'BAT',c:8.5},{n:'Prithvi Shaw',r:'BAT',c:7.5},{n:'Abishek Porel',r:'WK',c:7.5},{n:'Pathum Nissanka',r:'BAT',c:8.0},{n:'Karun Nair',r:'BAT',c:7.5},{n:'T Natarajan',r:'BOWL',c:7.5},{n:'Mukesh Kumar',r:'BOWL',c:7.5},{n:'Ashutosh Sharma',r:'AR',c:7.5},{n:'Sameer Rizvi',r:'BAT',c:7.0},{n:'Kyle Jamieson',r:'AR',c:7.5}],
  RR:[{n:'Yashasvi Jaiswal',r:'BAT',c:10.0},{n:'Ravindra Jadeja',r:'AR',c:9.5},{n:'Riyan Parag',r:'AR',c:8.5},{n:'Dhruv Jurel',r:'WK',c:7.5},{n:'Shimron Hetmyer',r:'BAT',c:7.5},{n:'Vaibhav Suryavanshi',r:'BAT',c:8.0},{n:'Shubham Dubey',r:'BAT',c:7.0},{n:'Jofra Archer',r:'BOWL',c:9.0},{n:'Yudhvir Singh Charak',r:'AR',c:7.0},{n:'Maheesh Theekshana',r:'BOWL',c:7.5},{n:'Kumar Kartikeya',r:'BOWL',c:6.5},{n:'Wanindu Hasaranga',r:'AR',c:8.0},{n:'Donovan Ferreira',r:'BAT',c:7.0},{n:'Kwena Maphaka',r:'BOWL',c:7.0},{n:'Tushar Deshpande',r:'BOWL',c:7.0}],
  GT:[{n:'Shubman Gill',r:'BAT',c:10.0},{n:'Rashid Khan',r:'AR',c:10.0},{n:'Jos Buttler',r:'WK',c:9.5},{n:'Kagiso Rabada',r:'BOWL',c:9.5},{n:'Mohammed Siraj',r:'BOWL',c:8.5},{n:'Sai Sudharsan',r:'BAT',c:8.5},{n:'Washington Sundar',r:'AR',c:8.0},{n:'Glenn Phillips',r:'BAT',c:7.5},{n:'Jason Holder',r:'AR',c:7.5},{n:'Prasidh Krishna',r:'BOWL',c:7.5},{n:'Rahul Tewatia',r:'AR',c:7.5},{n:'Kumar Kushagra',r:'WK',c:6.0},{n:'Anuj Rawat',r:'WK',c:6.5},{n:'Nishant Sindhu',r:'AR',c:7.0},{n:'Shahrukh Khan',r:'BAT',c:7.0}],
  LSG:[{n:'Rishabh Pant',r:'WK',c:10.5},{n:'Mohammad Shami',r:'BOWL',c:9.5},{n:'Mitchell Marsh',r:'AR',c:9.0},{n:'Nicholas Pooran',r:'WK',c:8.5},{n:'Aiden Markram',r:'AR',c:8.0},{n:'Wanindu Hasaranga',r:'AR',c:8.5},{n:'Anrich Nortje',r:'BOWL',c:8.5},{n:'Mayank Yadav',r:'BOWL',c:8.0},{n:'Josh Inglis',r:'WK',c:7.5},{n:'Avesh Khan',r:'BOWL',c:7.5},{n:'Abdul Samad',r:'AR',c:7.0},{n:'Ayush Badoni',r:'AR',c:7.0},{n:'Shahbaz Ahamad',r:'AR',c:7.0},{n:'Arjun Tendulkar',r:'BOWL',c:6.5},{n:'Matthew Breetzke',r:'BAT',c:7.0}],
  PBKS:[{n:'Shreyas Iyer',r:'BAT',c:9.5},{n:'Arshdeep Singh',r:'BOWL',c:9.5},{n:'Marcus Stoinis',r:'AR',c:9.0},{n:'Prabhsimran Singh',r:'WK',c:8.0},{n:'Yuzvendra Chahal',r:'BOWL',c:8.5},{n:'Shashank Singh',r:'BAT',c:8.0},{n:'Marco Jansen',r:'AR',c:8.5},{n:'Priyansh Arya',r:'BAT',c:7.5},{n:'Nehal Wadhera',r:'BAT',c:7.0},{n:'Lockie Ferguson',r:'BOWL',c:8.0},{n:'Azmatullah Omarzai',r:'AR',c:7.5},{n:'Cooper Connolly',r:'AR',c:7.0},{n:'Xavier Bartlett',r:'BOWL',c:7.0},{n:'Musheer Khan',r:'AR',c:7.0},{n:'Harprett Brar',r:'AR',c:7.0}],
};

const MATCH_OPTIONS = [
  { id: 'SRH_RCB_2026_M01', label: 'SRH vs RCB - Mar 28', teams: ['SRH','RCB'] },
  { id: 'KKR_MI_2026_M02', label: 'KKR vs MI - Mar 29', teams: ['KKR','MI'] },
  { id: 'CSK_RR_2026_M03', label: 'CSK vs RR - Mar 30', teams: ['CSK','RR'] },
  { id: 'GT_PBKS_2026_M04', label: 'GT vs PBKS - Mar 30', teams: ['GT','PBKS'] },
  { id: 'LSG_DC_2026_M05', label: 'LSG vs DC - Apr 1', teams: ['LSG','DC'] },
  { id: 'SRH_KKR_2026_M06', label: 'SRH vs KKR - Apr 1', teams: ['SRH','KKR'] },
  { id: 'CSK_PBKS_2026_M07', label: 'CSK vs PBKS - Apr 2', teams: ['CSK','PBKS'] },
  { id: 'MI_DC_2026_M08', label: 'MI vs DC - Apr 3', teams: ['MI','DC'] },
  { id: 'RR_GT_2026_M09', label: 'RR vs GT - Apr 4', teams: ['RR','GT'] },
  { id: 'SRH_LSG_2026_M10', label: 'SRH vs LSG - Apr 5', teams: ['SRH','LSG'] },
  { id: 'RCB_CSK_2026_M11', label: 'RCB vs CSK - Apr 5', teams: ['RCB','CSK'] },
  { id: 'KKR_PBKS_2026_M12', label: 'KKR vs PBKS - Apr 6', teams: ['KKR','PBKS'] },
  { id: 'RR_MI_2026_M13', label: 'RR vs MI - Apr 7', teams: ['RR','MI'] },
  { id: 'DC_GT_2026_M14', label: 'DC vs GT - Apr 8', teams: ['DC','GT'] },
  { id: 'KKR_LSG_2026_M15', label: 'KKR vs LSG - Apr 9', teams: ['KKR','LSG'] },
  { id: 'RR_RCB_2026_M16', label: 'RR vs RCB - Apr 10', teams: ['RR','RCB'] },
  { id: 'PBKS_SRH_2026_M17', label: 'PBKS vs SRH - Apr 11', teams: ['PBKS','SRH'] },
  { id: 'CSK_DC_2026_M18', label: 'CSK vs DC - Apr 12', teams: ['CSK','DC'] },
  { id: 'LSG_GT_2026_M19', label: 'LSG vs GT - Apr 12', teams: ['LSG','GT'] },
  { id: 'MI_RCB_2026_M20', label: 'MI vs RCB - Apr 13', teams: ['MI','RCB'] },
  { id: 'SRH_RR_2026_M21', label: 'SRH vs RR - Apr 14', teams: ['SRH','RR'] },
  { id: 'CSK_KKR_2026_M22', label: 'CSK vs KKR - Apr 15', teams: ['CSK','KKR'] },
  { id: 'RCB_LSG_2026_M23', label: 'RCB vs LSG - Apr 16', teams: ['RCB','LSG'] },
  { id: 'MI_PBKS_2026_M24', label: 'MI vs PBKS - Apr 16', teams: ['MI','PBKS'] },
  { id: 'GT_KKR_2026_M25', label: 'GT vs KKR - Apr 17', teams: ['GT','KKR'] },
  { id: 'RCB_DC_2026_M26', label: 'RCB vs DC - Apr 18', teams: ['RCB','DC'] },
  { id: 'SRH_CSK_2026_M27', label: 'SRH vs CSK - Apr 19', teams: ['SRH','CSK'] },
  { id: 'KKR_RR_2026_M28', label: 'KKR vs RR - Apr 19', teams: ['KKR','RR'] },
  { id: 'PBKS_LSG_2026_M29', label: 'PBKS vs LSG - Apr 20', teams: ['PBKS','LSG'] },
  { id: 'GT_MI_2026_M30', label: 'GT vs MI - Apr 20', teams: ['GT','MI'] },
  { id: 'SRH_DC_2026_M31', label: 'SRH vs DC - Apr 21', teams: ['SRH','DC'] },
  { id: 'LSG_RR_2026_M32', label: 'LSG vs RR - Apr 22', teams: ['LSG','RR'] },
  { id: 'MI_CSK_2026_M33', label: 'MI vs CSK - Apr 23', teams: ['MI','CSK'] },
  { id: 'RCB_GT_2026_M34', label: 'RCB vs GT - Apr 23', teams: ['RCB','GT'] },
  { id: 'DC_PBKS_2026_M35', label: 'DC vs PBKS - Apr 24', teams: ['DC','PBKS'] },
  { id: 'RR_SRH_2026_M36', label: 'RR vs SRH - Apr 25', teams: ['RR','SRH'] },
  { id: 'GT_CSK_2026_M37', label: 'GT vs CSK - Apr 26', teams: ['GT','CSK'] },
  { id: 'LSG_KKR_2026_M38', label: 'LSG vs KKR - Apr 26', teams: ['LSG','KKR'] },
  { id: 'DC_RCB_2026_M39', label: 'DC vs RCB - Apr 27', teams: ['DC','RCB'] },
  { id: 'PBKS_RR_2026_M40', label: 'PBKS vs RR - Apr 27', teams: ['PBKS','RR'] },
  { id: 'MI_SRH_2026_M41', label: 'MI vs SRH - Apr 28', teams: ['MI','SRH'] },
  { id: 'GT_RCB_2026_M42', label: 'GT vs RCB - Apr 29', teams: ['GT','RCB'] },
  { id: 'RR_DC_2026_M43', label: 'RR vs DC - Apr 29', teams: ['RR','DC'] },
  { id: 'CSK_LSG_2026_M44', label: 'CSK vs LSG - Apr 30', teams: ['CSK','LSG'] },
  { id: 'KKR_SRH_2026_M45', label: 'KKR vs SRH - Apr 30', teams: ['KKR','SRH'] },
  { id: 'PBKS_GT_2026_M46', label: 'PBKS vs GT - May 1', teams: ['PBKS','GT'] },
  { id: 'DC_MI_2026_M47', label: 'DC vs MI - May 2', teams: ['DC','MI'] },
  { id: 'RR_CSK_2026_M48', label: 'RR vs CSK - May 3', teams: ['RR','CSK'] },
  { id: 'LSG_SRH_2026_M49', label: 'LSG vs SRH - May 3', teams: ['LSG','SRH'] },
  { id: 'KKR_GT_2026_M50', label: 'KKR vs GT - May 4', teams: ['KKR','GT'] },
  { id: 'RCB_PBKS_2026_M51', label: 'RCB vs PBKS - May 4', teams: ['RCB','PBKS'] },
  { id: 'MI_RR_2026_M52', label: 'MI vs RR - May 5', teams: ['MI','RR'] },
  { id: 'DC_CSK_2026_M53', label: 'DC vs CSK - May 6', teams: ['DC','CSK'] },
  { id: 'SRH_GT_2026_M54', label: 'SRH vs GT - May 6', teams: ['SRH','GT'] },
  { id: 'LSG_PBKS_2026_M55', label: 'LSG vs PBKS - May 7', teams: ['LSG','PBKS'] },
  { id: 'KKR_DC_2026_M56', label: 'KKR vs DC - May 8', teams: ['KKR','DC'] },
  { id: 'RCB_RR_2026_M57', label: 'RCB vs RR - May 8', teams: ['RCB','RR'] },
  { id: 'GT_LSG_2026_M58', label: 'GT vs LSG - May 9', teams: ['GT','LSG'] },
  { id: 'MI_KKR_2026_M59', label: 'MI vs KKR - May 10', teams: ['MI','KKR'] },
  { id: 'CSK_SRH_2026_M60', label: 'CSK vs SRH - May 10', teams: ['CSK','SRH'] },
  { id: 'PBKS_DC_2026_M61', label: 'PBKS vs DC - May 11', teams: ['PBKS','DC'] },
  { id: 'RR_LSG_2026_M62', label: 'RR vs LSG - May 11', teams: ['RR','LSG'] },
  { id: 'GT_SRH_2026_M63', label: 'GT vs SRH - May 12', teams: ['GT','SRH'] },
  { id: 'RCB_MI_2026_M64', label: 'RCB vs MI - May 13', teams: ['RCB','MI'] },
  { id: 'CSK_GT_2026_M65', label: 'CSK vs GT - May 14', teams: ['CSK','GT'] },
  { id: 'KKR_RCB_2026_M66', label: 'KKR vs RCB - May 15', teams: ['KKR','RCB'] },
  { id: 'DC_RR_2026_M67', label: 'DC vs RR - May 16', teams: ['DC','RR'] },
  { id: 'SRH_PBKS_2026_M68', label: 'SRH vs PBKS - May 17', teams: ['SRH','PBKS'] },
  { id: 'MI_LSG_2026_M69', label: 'MI vs LSG - May 17', teams: ['MI','LSG'] },
  { id: 'CSK_MI_2026_M70', label: 'CSK vs MI - May 18', teams: ['CSK','MI'] },
  { id: 'Q1_2026_M71', label: 'Qualifier 1 - May 26', teams: ['CSK','MI'] },
  { id: 'EL_2026_M72', label: 'Eliminator - May 27', teams: ['RCB','KKR'] },
  { id: 'Q2_2026_M73', label: 'Qualifier 2 - May 29', teams: ['GT','MI'] },
  { id: 'FINAL_2026_M74', label: 'FINAL - May 31', teams: ['CSK','RCB'] },
];

const DEFAULT_MATCH_ID = MATCH_OPTIONS.find(m => m.teams.every(t => SQUADS[t]))?.id || MATCH_OPTIONS[0].id;

export default function SelectTeamPage() {
  const { user } = useAuth();
  const [squads, setSquads] = useState({});
  const [squadsLoaded, setSquadsLoaded] = useState(false);
  useEffect(() => {
    async function fetchSquads() {
      const teams = ['CSK','MI','RCB','KKR','SRH','DC','RR','GT','LSG','PBKS'];
      const result = {};
      await Promise.all(teams.map(async t => {
        const snap = await getDoc(doc(db, 'squads', t));
        if (snap.exists()) result[t] = snap.data().players || [];
      }));
      setSquads(result);
      setSquadsLoaded(true);
    }
    fetchSquads();
  }, []);
  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  const [selected, setSelected] = useState([]);
  const [capId, setCapId] = useState(null);
  const [vcId, setVcId] = useState(null);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const allMatches = MATCH_OPTIONS;
  const match = allMatches.find(m => m.id === matchId) || allMatches[0];
  const pool = (match?.teams ?? []).flatMap(t => ((squadsLoaded ? squads[t] : SQUADS[t]) || []).map(p => ({ ...p, team: t, id: `${t}_${p.n.replace(/\s+/g,'_')}` }))).filter(p => roleFilter === 'ALL' || p.r === roleFilter);
  const budgetUsed = selected.reduce((s, id) => { const p = pool.find(x => x.id === id); return s + (p?.c || 0); }, 0);

  function addPlayer(id) {
    if (selected.includes(id)) { removePlayer(id); return; }
    if (selected.length >= 11) { showToast('Team full!'); return; }
    const p = pool.find(x => x.id === id);
    if (!p) return;
    if (budgetUsed + p.c > BUDGET) { showToast('Over budget!'); return; }
    if (selected.filter(s => s.startsWith(p.team + '_')).length >= 7) { showToast(`Max 7 from ${p.team}`); return; }
    setSelected(prev => [...prev, id]);
  }
  function removePlayer(id) { setSelected(prev => prev.filter(s => s !== id)); if (capId === id) setCapId(null); if (vcId === id) setVcId(null); }
  async function handleSubmit() {
    if (selected.length !== 11 || !capId || !vcId) { showToast('Select 11 players with C & VC'); return; }
    setSubmitting(true);
    try { await setDoc(doc(db, 'teams', user.uid), { matchId, players: selected, captainId: capId, vcId, budgetUsed, updatedAt: serverTimestamp() }); showToast('Team submitted! Now join a contest.'); }
    catch (err) { showToast(err.message || 'Error submitting team'); }
    finally { setSubmitting(false); }
  }
  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  const pct = Math.round((budgetUsed / BUDGET) * 100);
  const s = { card: { background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem' }, btn: { padding: '8px 16px', borderRadius: 8, border: '0.5px solid #e5e5e5', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: '#fff' }, btnPrimary: { background: '#FF6B00', border: 'none', color: '#fff' }, fbtn: { padding: '3px 12px', borderRadius: 12, border: '0.5px solid #e5e5e5', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#666' }, fbtnActive: { background: '#f5f4f0', color: '#222' }, input: { padding: '7px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, marginBottom: 10, outline: 'none' } };

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
        <div style={s.card}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.5rem' }}>Your XI</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 3 }}><span>Budget</span><span>{budgetUsed.toFixed(1)} / {BUDGET} pts</span></div>
          <div style={{ height: 4, borderRadius: 2, background: '#f0f0f0', overflow: 'hidden', marginBottom: 8 }}><div style={{ height: '100%', borderRadius: 2, background: pct > 90 ? '#ef4444' : pct > 75 ? '#f59e0b' : '#FF6B00', width: pct + '%', transition: 'width .3s' }} /></div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: '.75rem' }}>{selected.length}/11 ï¿½ {capId && vcId ? <span style={{ color: '#16a34a' }}>C & VC set ?</span> : 'C & VC not set'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: '.75rem' }}>
            {Array.from({ length: 11 }, (_, i) => { const pid = selected[i]; const [team, ...nameParts] = pid?.split('_') || []; const name = nameParts.join(' '); const isCap = pid === capId, isVC = pid === vcId; return (<div key={i} style={{ border: `0.5px ${pid ? 'solid' : 'dashed'} ${isCap ? '#FF6B00' : isVC ? '#1d4ed8' : '#e5e5e5'}`, borderRadius: 8, padding: 5, textAlign: 'center', minHeight: 54, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', background: pid ? '#fafaf8' : 'transparent' }}>{isCap && <span style={{ position: 'absolute', top: -6, right: -6, fontSize: 9, fontWeight: 500, padding: '1px 5px', borderRadius: 8, background: '#FF6B00', color: '#fff' }}>C</span>}{isVC && <span style={{ position: 'absolute', top: -6, right: -6, fontSize: 9, fontWeight: 500, padding: '1px 5px', borderRadius: 8, background: '#1d4ed8', color: '#fff' }}>VC</span>}{pid ? (<><div style={{ fontSize: 9, color: TEAM_COLORS[team] || '#888' }}>{team}</div><div style={{ fontSize: 10, fontWeight: 500 }}>{name.split(' ').slice(-1)[0]}</div><button onClick={() => removePlayer(pid)} style={{ position: 'absolute', top: -5, left: -5, width: 13, height: 13, borderRadius: '50%', background: '#fef2f2', border: 'none', cursor: 'pointer', fontSize: 9, color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>ï¿½</button></>) : <span style={{ fontSize: 10, color: '#ccc' }}>Empty</span>}</div>); })}
          </div>
          <button style={{ ...s.btn, ...s.btnPrimary, width: '100%', marginBottom: 6 }} disabled={selected.length !== 11 || !capId || !vcId || submitting} onClick={handleSubmit}>{submitting ? 'Submitting...' : 'Submit team'}</button>
          <button style={{ ...s.btn, width: '100%', fontSize: 12 }} onClick={() => { setSelected([]); setCapId(null); setVcId(null); }}>Clear all</button>
        </div>
        <div style={s.card}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.5rem' }}>{match?.teams?.join(' & ') || 'Select a match'} players</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '.75rem' }}>{['ALL','BAT','BOWL','AR','WK'].map(f => (<button key={f} style={{ ...s.fbtn, ...(roleFilter === f ? s.fbtnActive : {}) }} onClick={() => setRoleFilter(f)}>{f === 'ALL' ? 'All' : f}</button>))}</div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {pool.length === 0 ? <div style={{ color: '#888', fontSize: 13, textAlign: 'center', padding: '2rem' }}>No players available.</div> : pool.map(p => { const isSel = selected.includes(p.id); const over = !isSel && budgetUsed + p.c > BUDGET; const full = !isSel && selected.length >= 11; const dis = (over || full) && !isSel; const isCap = capId === p.id, isVC = vcId === p.id; const col = TEAM_COLORS[p.team] || '#888'; const ini = p.n.split(' ').map(w => w[0]).join('').slice(0, 2); return (<div key={p.id} onClick={() => !dis && addPlayer(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 5px', borderRadius: 8, cursor: dis ? 'not-allowed' : 'pointer', border: `0.5px solid ${isSel ? '#FF6B00' : 'transparent'}`, background: isSel ? '#fff8f5' : 'transparent', opacity: dis ? .35 : 1, marginBottom: 2 }}><div style={{ width: 34, height: 34, borderRadius: '50%', background: col + '22', color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>{ini}</div><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.n}</div><div style={{ fontSize: 10, color: '#888' }}><span style={{ color: col, fontWeight: 500 }}>{p.team}</span> ï¿½ {p.r}</div></div><div style={{ textAlign: 'right', flexShrink: 0 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{p.c} pts</div>{isSel && (<div style={{ display: 'flex', gap: 3, marginTop: 2, justifyContent: 'flex-end' }}>{!isCap ? <button style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, border: '0.5px solid #e5e5e5', background: 'transparent', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); vcId !== p.id && setCapId(p.id); }}>C</button> : <span style={{ fontSize: 9, color: '#FF6B00', fontWeight: 500 }}>C</span>}{!isVC ? <button style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, border: '0.5px solid #e5e5e5', background: 'transparent', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); capId !== p.id && setVcId(p.id); }}>VC</button> : <span style={{ fontSize: 9, color: '#1d4ed8', fontWeight: 500 }}>VC</span>}</div>)}</div></div>); })}
          </div>
        </div>
      </div>
    </div>
  );
}

