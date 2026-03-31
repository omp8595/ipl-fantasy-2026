/**
 * IPL Fantasy 2026 — Firestore Seeder
 * Run: node scripts/seed.js
 *
 * Prerequisites:
 *   1. Download service account key from Firebase Console → Project Settings → Service Accounts
 *   2. Save as scripts/serviceAccountKey.json
 *   3. npm install firebase-admin (in root)
 */

const admin = require('firebase-admin')
const path  = require('path')

const serviceAccount = require('./serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// ─── IPL 2026 Full Match Schedule ────────────────────────────────────────────
const MATCHES = [
  { id:'RCB_SRH_2026_M01',  team1:'RCB',  team2:'SRH',  date:new Date('2026-03-28T14:00:00Z'), venue:'M. Chinnaswamy Stadium, Bengaluru',   status:'done',     locked:true  },
  { id:'MI_KKR_2026_M02',   team1:'MI',   team2:'KKR',  date:new Date('2026-03-29T14:00:00Z'), venue:'Wankhede Stadium, Mumbai',            status:'done',     locked:true  },
  { id:'CSK_RR_2026_M03',   team1:'CSK',  team2:'RR',   date:new Date('2026-03-30T10:00:00Z'), venue:'Barsapara Stadium, Guwahati',         status:'live',     locked:true  },
  { id:'GT_PBKS_2026_M04',  team1:'GT',   team2:'PBKS', date:new Date('2026-03-30T14:00:00Z'), venue:'Narendra Modi Stadium, Ahmedabad',    status:'upcoming', locked:false },
  { id:'LSG_DC_2026_M05',   team1:'LSG',  team2:'DC',   date:new Date('2026-04-01T14:00:00Z'), venue:'Ekana Cricket Stadium, Lucknow',      status:'upcoming', locked:false },
  { id:'KKR_SRH_2026_M06',  team1:'KKR',  team2:'SRH',  date:new Date('2026-04-02T14:00:00Z'), venue:'Eden Gardens, Kolkata',               status:'upcoming', locked:false },
  { id:'CSK_PBKS_2026_M07', team1:'CSK',  team2:'PBKS', date:new Date('2026-04-03T14:00:00Z'), venue:'MA Chidambaram Stadium, Chennai',     status:'upcoming', locked:false },
  { id:'MI_DC_2026_M08',    team1:'MI',   team2:'DC',   date:new Date('2026-04-04T14:00:00Z'), venue:'Wankhede Stadium, Mumbai',            status:'upcoming', locked:false },
  { id:'GT_RR_2026_M09',    team1:'GT',   team2:'RR',   date:new Date('2026-04-05T10:00:00Z'), venue:'Narendra Modi Stadium, Ahmedabad',    status:'upcoming', locked:false },
  { id:'SRH_LSG_2026_M10',  team1:'SRH',  team2:'LSG',  date:new Date('2026-04-05T14:00:00Z'), venue:'Rajiv Gandhi Intl. Stadium, Hyd',     status:'upcoming', locked:false },
  { id:'RCB_CSK_2026_M11',  team1:'RCB',  team2:'CSK',  date:new Date('2026-04-06T14:00:00Z'), venue:'M. Chinnaswamy Stadium, Bengaluru',   status:'upcoming', locked:false },
  { id:'KKR_PBKS_2026_M12', team1:'KKR',  team2:'PBKS', date:new Date('2026-04-07T14:00:00Z'), venue:'Eden Gardens, Kolkata',               status:'upcoming', locked:false },
  { id:'RR_MI_2026_M13',    team1:'RR',   team2:'MI',   date:new Date('2026-04-08T14:00:00Z'), venue:'Sawai Mansingh Stadium, Jaipur',      status:'upcoming', locked:false },
  { id:'DC_GT_2026_M14',    team1:'DC',   team2:'GT',   date:new Date('2026-04-09T14:00:00Z'), venue:'Arun Jaitley Stadium, Delhi',         status:'upcoming', locked:false },
  { id:'KKR_LSG_2026_M15',  team1:'KKR',  team2:'LSG',  date:new Date('2026-04-10T14:00:00Z'), venue:'Eden Gardens, Kolkata',               status:'upcoming', locked:false },
  { id:'RR_RCB_2026_M16',   team1:'RR',   team2:'RCB',  date:new Date('2026-04-11T14:00:00Z'), venue:'Sawai Mansingh Stadium, Jaipur',      status:'upcoming', locked:false },
  { id:'PBKS_SRH_2026_M17', team1:'PBKS', team2:'SRH',  date:new Date('2026-04-12T14:00:00Z'), venue:'PCA Stadium, Mullanpur',              status:'upcoming', locked:false },
  { id:'CSK_DC_2026_M18',   team1:'CSK',  team2:'DC',   date:new Date('2026-04-13T14:00:00Z'), venue:'MA Chidambaram Stadium, Chennai',     status:'upcoming', locked:false },
  { id:'LSG_GT_2026_M19',   team1:'LSG',  team2:'GT',   date:new Date('2026-04-14T14:00:00Z'), venue:'Ekana Cricket Stadium, Lucknow',      status:'upcoming', locked:false },
  { id:'MI_RCB_2026_M20',   team1:'MI',   team2:'RCB',  date:new Date('2026-04-15T14:00:00Z'), venue:'Wankhede Stadium, Mumbai',            status:'upcoming', locked:false },
]

// ─── IPL 2026 Squads (key players per team) ───────────────────────────────────
const SQUADS = {
  CSK:  ['Ruturaj Gaikwad','MS Dhoni','Sanju Samson','Shivam Dube','Jamie Overton','Khaleel Ahmed','Noor Ahmad','Matthew Short','Sarfaraz Khan','Dewald Brevis','Rahul Chahar','Nathan Ellis','Anshul Kamboj','Prashant Veer','Kartik Sharma'],
  RR:   ['Yashasvi Jaiswal','Ravindra Jadeja','Jofra Archer','Riyan Parag','Ravi Bishnoi','Sam Curran','Dhruv Jurel','Shimron Hetmyer','Nandre Burger','Vaibhav Suryavanshi','Adam Milne','Tushar Deshpande','Yudhvir Singh','Kwena Maphaka','Shubham Dubey'],
  MI:   ['Rohit Sharma','Jasprit Bumrah','Suryakumar Yadav','Hardik Pandya','Tilak Varma','Ryan Rickelton','Trent Boult','Will Jacks','Mitchell Santner','Deepak Chahar','Naman Dhir','Robin Minz','Corbin Bosch','Raj Angad Bawa','Mayank Markande'],
  KKR:  ['Ajinkya Rahane','Cameron Green','Sunil Narine','Varun Chakravarthy','Matheesha Pathirana','Rinku Singh','Rachin Ravindra','Finn Allen','Rovman Powell','Harshit Rana','Akash Deep','Ramandeep Singh','Angkrish Raghuvanshi','Anukul Roy','Blessing Muzarabani'],
  RCB:  ['Virat Kohli','Rajat Patidar','Phil Salt','Josh Hazlewood','Tim David','Krunal Pandya','Devdutt Padikkal','Venkatesh Iyer','Jacob Bethell','Bhuvneshwar Kumar','Yash Dayal','Romario Shepherd','Nuwan Thushara','Jitesh Sharma','Vicky Ostwal'],
  SRH:  ['Pat Cummins','Travis Head','Abhishek Sharma','Heinrich Klaasen','Nitish Kumar Reddy','Ishan Kishan','Liam Livingstone','Harshal Patel','Kamindu Mendis','Shivam Mavi','Zeeshan Ansari','Brydon Carse','Jaydev Unadkat','Aniket Verma','Harsh Dubey'],
  DC:   ['KL Rahul','Mitchell Starc','Axar Patel','Kuldeep Yadav','David Miller','Tristan Stubbs','Karun Nair','Pathum Nissanka','T. Natarajan','Prithvi Shaw','Kyle Jamieson','Ashutosh Sharma','Sameer Rizvi','Mukesh Kumar','Lungi Ngidi'],
  GT:   ['Shubman Gill','Rashid Khan','Jos Buttler','Kagiso Rabada','Mohammed Siraj','Sai Sudharsan','Washington Sundar','Glenn Phillips','Jason Holder','Prasidh Krishna','Rahul Tewatia','Kumar Kushagra','Nishant Sindhu','Jayant Yadav','Gurnoor Brar'],
  LSG:  ['Rishabh Pant','Mohammad Shami','Mitchell Marsh','Nicholas Pooran','Wanindu Hasaranga','Anrich Nortje','Aiden Markram','Mayank Yadav','Josh Inglis','Avesh Khan','Abdul Samad','Ayush Badoni','Shahbaz Ahmed','Arshin Kulkarni','Akash Singh'],
  PBKS: ['Shreyas Iyer','Arshdeep Singh','Yuzvendra Chahal','Marcus Stoinis','Prabhsimran Singh','Marco Jansen','Lockie Ferguson','Shashank Singh','Nehal Wadhera','Priyansh Arya','Musheer Khan','Azmatullah Omarzai','Cooper Connolly','Harpreet Brar','Ben Dwarshuis'],
}

async function seedMatches() {
  console.log('Seeding matches...')
  const batch = db.batch()
  for (const m of MATCHES) {
    const { id, ...data } = m
    batch.set(db.collection('matches').doc(id), {
      ...data,
      squad1: SQUADS[data.team1] || [],
      squad2: SQUADS[data.team2] || [],
      externalMatchId: '',
      liveScore: '',
    }, { merge: true })
  }
  await batch.commit()
  console.log(`✓ Seeded ${MATCHES.length} matches`)
}

async function seedDemoContest() {
  console.log('Seeding demo contest...')
  const ref = db.collection('contests').doc('DEMO_CONTEST_001')
  await ref.set({
    name: 'IPL 2026 Opening Week League',
    matchId: 'CSK_RR_2026_M03',
    createdBy: 'admin',
    creatorName: 'Admin',
    inviteCode: 'IPL001',
    maxParticipants: 100,
    entryFee: 0,
    prizeType: 'top3',
    prize: 'Bragging rights',
    status: 'open',
    memberCount: 0,
    createdAt: new Date(),
  }, { merge: true })
  console.log('✓ Demo contest created — invite code: IPL001')
}

async function main() {
  try {
    await seedMatches()
    await seedDemoContest()
    console.log('\n✅ All done! Your Firestore is ready.')
    console.log('\nNext steps:')
    console.log('  1. Get match IDs from CricketData.org for live matches')
    console.log('  2. Update externalMatchId via the Admin panel → Seed tab')
    console.log('  3. Set ADMIN_EMAILS in pages/admin.jsx to your email')
    console.log('  4. Share invite code IPL001 with your friends!')
    process.exit(0)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

main()
