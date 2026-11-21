#!/usr/bin/env node
'use strict';
// Read-only explanation of actual TECHNICAL chain and earned-cover chronology.
const lab=require('./core.js'),review=require('./match-review.cjs'),fs=require('node:fs');
const root=review.load(),D=root.OfficeData,M=root.OfficeMatch,A=M.GRAPH.A;
const F=new Set(['chain','suplex','submission','ground','neck','pin','rest']);
function link(x,y){
 return !!x&&!!y&&x.preControl==='w'&&y.preControl==='w'&&
 x.control==='w'&&x.t<=y.t&&y.t-x.t<=20&&
 !!A[x.id]&&!!A[y.id]&&
 (!y.grappleResolution||y.grappleResolution==='landed')&&
 (!y.strikeResolution||y.strikeResolution==='landed')&&
 (!y.contactResolution||y.contactResolution==='landed')&&
 (!y.aerialResolution||y.aerialResolution==='landed')&&
 A[x.id].next.some(([id])=>id===y.id)&&
 (F.has(A[x.id].family)||M.GRAPH.GRIP_ENTRY[x.id])&&
 F.has(A[y.id].family);
}
function capture(){
 const rows=[];
 for(const [tier,ring,safe,psych] of [['competent',73,68,70],['elite',92,91,84]]){
  const row={tier,bouts:0,triples:0,linkedPairs:0,counts:0,countAfterLinkedPair:0,
   afterCountRejoined:0,triplesNearCount:0,
   boutsWithTriple:0,boutsWithCover:0,boutsWithNoCoverButNoTriple:0,
   samples:[],all:[]};
  for(let oi=0;oi<4;oi++)for(let i=0;i<12;i++){
   const opponent=['ace','silas','red','rev'][oi];
   const settings=lab.makeOptions(D,{wid:'juno',rid:opponent,minutes:18,plan:'technical',
    slot:'main',seed:910087+oi*7919+18*9191+i*193,
    promotion:D.PROMOS[(oi+18+i)%D.PROMOS.length].id,
    finish:i%2?'lose_clean':'win_clean'});
   settings.minutes=18;
   settings.w={...settings.w,ring,safe,psych,heat:65,fatigue:4,pro:78};
   const m=lab.runMatch(root,settings),events=m.graph.events;
   const triple=events.flatMap((e,k)=>k>=2&&link(events[k-2],events[k-1])&&
     link(events[k-1],e)?[{t:e.t,ids:events.slice(k-2,k+1).map(x=>x.id)}]:[]);
   const pairs=events.filter((e,k)=>k>=1&&link(events[k-1],e));
   const covers=events.flatMap((e,k)=>e.id==='scheduled_nearfall'?[{
    t:e.t,owner:e.control,source:e.sourceMove||null,
    prev:events.slice(Math.max(0,k-3),k).map(x=>x.id),
    next:events.slice(k+1,k+4).map(x=>x.id),
    precedingPair:k>=2&&link(events[k-2],events[k-1]),
    afterLinkedPair:k>=2&&k+2<events.length&&
      link(events[k+1],events[k+2])
   }]:[]);
   row.bouts++;row.triples+=triple.length;row.linkedPairs+=pairs.length;
   row.counts+=covers.length;row.countAfterLinkedPair+=covers.filter(x=>x.precedingPair).length;
   row.afterCountRejoined+=covers.filter(x=>x.afterLinkedPair).length;
   row.triplesNearCount+=triple.filter(x=>covers.some(c=>Math.abs(x.t-c.t)<=30)).length;
   row.boutsWithTriple+=triple.length>0;row.boutsWithCover+=covers.length>0;
   row.boutsWithNoCoverButNoTriple+=covers.length===0&&triple.length===0;
   if(row.samples.length<16&&covers.some(x=>x.precedingPair))
    row.samples.push({seed:settings.seed,opponent,triples:triple,covers});
   row.all.push({seed:settings.seed,opponent,triples:triple,pairs:pairs.length,
    counts:covers.length,scheduled:covers});
  }
  rows.push(row);
 }
 return {rows};
}
if(require.main===module){
 const r=capture();if(process.argv.includes('--json-file'))fs.writeFileSync('technical-cover-chain-trace.json',JSON.stringify(r,null,2)+'\n');
 for(const q of r.rows)console.log(JSON.stringify({
  tier:q.tier,bouts:q.bouts,linkedPairs:q.linkedPairs,triples:q.triples,
  withTriple:q.boutsWithTriple,counts:q.counts,afterPair:q.countAfterLinkedPair,
  afterCountRejoined:q.afterCountRejoined,triplesNearCount:q.triplesNearCount,
  noCoverNoTriple:q.boutsWithNoCoverButNoTriple,
  samples:q.samples.slice(0,6)
 }));
}
module.exports={capture};
