const fs = require('fs');
let f = fs.readFileSync('src/pages/SelectTeamPage.jsx', 'utf8');
const extra = `
  { id: 'TBD1_2026_M71', label: 'TBD vs TBD - May 19', teams: ['RCB','MI'] },
  { id: 'TBD2_2026_M72', label: 'TBD vs TBD - May 20', teams: ['CSK','KKR'] },
  { id: 'TBD3_2026_M73', label: 'TBD vs TBD - May 21', teams: ['GT','SRH'] },
  { id: 'TBD4_2026_M74', label: 'TBD vs TBD - May 22', teams: ['RR','PBKS'] },
  { id: 'TBD5_2026_M75', label: 'TBD vs TBD - May 23', teams: ['DC','LSG'] },
  { id: 'TBD6_2026_M76', label: 'TBD vs TBD - May 24', teams: ['MI','RCB'] },
  { id: 'Q1_2026_M77', label: 'Qualifier 1 - May 26', teams: ['CSK','MI'] },
  { id: 'EL_2026_M78', label: 'Eliminator - May 27', teams: ['RCB','KKR'] },
  { id: 'Q2_2026_M79', label: 'Qualifier 2 - May 29', teams: ['GT','MI'] },
  { id: 'FINAL_2026_M80', label: 'FINAL - May 31', teams: ['CSK','RCB'] },`;
f = f.replace("{ id: 'CSK_MI_2026_M70'", extra + "\n  { id: 'CSK_MI_2026_M80_PLACEHOLDER'").replace("CSK_MI_2026_M80_PLACEHOLDER", "CSK_MI_2026_M70");
fs.writeFileSync('src/pages/SelectTeamPage.jsx', f, 'utf8');
console.log('done');
