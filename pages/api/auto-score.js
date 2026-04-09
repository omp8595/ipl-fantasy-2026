export default async function handler(req,res){
const{matchId,cricapiId,secret}=req.query;
if(secret!==process.env.CRON_SECRET)return res.status(401).json({error:"Unauthorized"});
if(!matchId||!cricapiId)return res.status(400).json({error:"Need matchId and cricapiId"});
try{
const apiKey=process.env.CRICKETDATA_API_KEY||"30dd02c2-f08d-4532-a9a4-09daf3a6766a";
const response=await fetch(`https://api.cricapi.com/v1/match_scorecard?apikey=${apiKey}&id=${cricapiId}`);
const data=await response.json();
if(data.status==="failure"||!data.data?.scorecard)return res.status(200).json({status:"no scorecard yet",reason:data.reason});
const scorecard=data.data.scorecard;
const playerStats={};
scorecard.forEach(inning=>{
inning.batting?.forEach(b=>{
const name=b.batsman?.name;if(!name)return;
const key=name.replace(/\\s+/g,"_");
if(!playerStats[key])playerStats[key]={name,runs:0,balls:0,fours:0,sixes:0,wickets:0,overs:0,maidens:0,economy:0,catches:0,stumpings:0,runouts:0,notout:false};
playerStats[key].runs=parseInt(b.r||0);
playerStats[key].balls=parseInt(b.b||0);
playerStats[key].fours=parseInt(b["4s"]||0);
playerStats[key].sixes=parseInt(b["6s"]||0);
playerStats[key].notout=(b.dismissal||"")==="not out";
});
inning.bowling?.forEach(bwl=>{
const name=bwl.bowler?.name;if(!name)return;
const key=name.replace(/\\s+/g,"_");
if(!playerStats[key])playerStats[key]={name,runs:0,balls:0,fours:0,sixes:0,wickets:0,overs:0,maidens:0,economy:0,catches:0,stumpings:0,runouts:0,notout:false};
playerStats[key].wickets=parseInt(bwl.w||0);
playerStats[key].overs=parseFloat(bwl.o||0);
playerStats[key].maidens=parseInt(bwl.m||0);
playerStats[key].economy=parseFloat(bwl.eco||0);
});
});
function calcPoints(s){
let pts=0;
const r=s.runs,balls=s.balls,fours=s.fours,sixes=s.sixes,w=s.wickets,overs=s.overs,maidens=s.maidens,eco=s.economy,catches=s.catches,stumpings=s.stumpings,runouts=s.runouts;
pts+=r;pts+=fours;pts+=sixes*2;
if(r>=100)pts+=16;else if(r>=50)pts+=8;else if(r>=30)pts+=4;
if(r===0&&balls>0&&!s.notout)pts-=2;
if(balls>=10){const sr=(r/balls)*100;if(sr>=170)pts+=6;else if(sr>=150)pts+=4;else if(sr>=130)pts+=2;else if(sr<50)pts-=6;else if(sr<60)pts-=4;else if(sr<70)pts-=2;}
pts+=w*25;if(w>=5)pts+=16;else if(w>=4)pts+=8;else if(w>=3)pts+=4;
pts+=maidens*4;
if(overs>=2&&eco>0){if(eco<5)pts+=6;else if(eco<6)pts+=4;else if(eco<7)pts+=2;else if(eco>=12)pts-=6;else if(eco>=11)pts-=4;else if(eco>=10)pts-=2;}
pts+=catches*8;pts+=stumpings*12;pts+=runouts*6;
return pts;}
const fantasyScorecard={};
Object.entries(playerStats).forEach(([key,stats])=>{fantasyScorecard[key]={...stats,basePts:calcPoints(stats)};});
const{initializeApp,getApps,cert}=await import("firebase-admin/app");
const{getFirestore}=await import("firebase-admin/firestore");
if(!getApps().length){initializeApp({credential:cert({projectId:process.env.FIREBASE_ADMIN_PROJECT_ID,clientEmail:process.env.FIREBASE_ADMIN_CLIENT_EMAIL,privateKey:process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\\\n/g,"\\n")})});}
const db=getFirestore();
await db.collection("scorecards").doc(matchId).set({scorecard:fantasyScorecard,matchId,cricapiId,matchName:data.data.name,status:data.data.status,updatedAt:new Date().toISOString()});
const contestsSnap=await db.collection("contests").where("matchId","==",matchId).get();
let updatedUsers=0;
for(const contestDoc of contestsSnap.docs){
const lbSnap=await db.collection("contests").doc(contestDoc.id).collection("leaderboard").get();
const updates=[];
for(const lbDoc of lbSnap.docs){
const userId=lbDoc.id;
const teamSnap=await db.collection("teams").doc(userId).get();
if(!teamSnap.exists)continue;
const{players,captainId,vcId}=teamSnap.data();
if(!players)continue;
let total=0;const breakdown={};
players.forEach(pid=>{
const parts=pid.split("_");const playerName=parts.slice(1).join("_");const lastName=parts[parts.length-1];
let stats=fantasyScorecard[playerName]||Object.values(fantasyScorecard).find(s=>s.name?.replace(/\\s+/g,"_")===playerName)||Object.values(fantasyScorecard).find(s=>s.name?.split(" ").pop()===lastName);
const base=stats?.basePts||0;const isCap=pid===captainId;const isVC=pid===vcId;
let finalPts=base;if(isCap)finalPts=Math.round(base*2);else if(isVC)finalPts=Math.round(base*1.5);
total+=finalPts;breakdown[pid]={finalPts,basePts:base,role:isCap?"captain":isVC?"viceCaptain":"player"};
});updates.push({ref:lbDoc.ref,total,breakdown});updatedUsers++;}
updates.sort((a,b)=>b.total-a.total);
for(let i=0;i<updates.length;i++)await updates[i].ref.update({totalScore:updates[i].total,breakdown:updates[i].breakdown,rank:i+1,lastUpdated:new Date()});
}
return res.status(200).json({success:true,matchId,playersFound:Object.keys(fantasyScorecard).length,contestsUpdated:contestsSnap.size,usersUpdated:updatedUsers,matchStatus:data.data.status});
}catch(error){return res.status(500).json({error:error.message});}}
