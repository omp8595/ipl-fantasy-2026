export default async function handler(req, res) { 
  try { 
    const apiKey = process.env.CRICKETDATA_API_KEY 
    const r = await fetch(`https://api.cricketdata.org/api/v1/matches?apikey=${apiKey}&offset=0`) 
    const data = await r.json() 
    if (!data.data) return res.status(200).json({ matches: [] }) 
    const teams = ['CSK','MI','RCB','KKR','SRH','DC','RR','GT','LSG','PBKS'] 
    const ipl = data.data.filter(m => m.name && teams.some(t => m.name.toUpperCase().includes(t))).map(m => ({ id: m.id, name: m.name, status: m.status, date: m.dateTimeGMT, teams: m.teams || [] })) 
    res.status(200).json({ matches: ipl }) 
  } catch(err) { res.status(500).json({ error: err.message }) } 
} 
