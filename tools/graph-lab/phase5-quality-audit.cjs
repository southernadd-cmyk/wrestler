'use strict';
// Reproduce the Phase 5 tape review against a detached Phase 4 checkout:
// node tools/graph-lab/phase5-quality-audit.cjs /path/to/phase4 > /tmp/phase5-tapes.json
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const lab=require('./core.js');
const names=['data.js','roster-registry.js','technique-registry.js','technique-backgrounds.js','match-graph.js','match-commentary.js','match-engine.js'];
function load(dir){
 const root={};
 for(const file of names)vm.runInNewContext(fs.readFileSync(path.join(dir,'assets/js',file),'utf8'),
  {window:root,Math,Date,JSON,console},{filename:file});
 root.OfficeRosterV4.enableProfiles();
 return root;
}
if(!process.argv[2])throw Error('Pass the Phase 4 checkout path as the first argument.');
const worlds={main:load(path.resolve(process.argv[2])),phase5:load(path.resolve(__dirname,'../..'))};
const roster=lab.roster(worlds.phase5.OfficeData);
const plans=['technical','story','brawl','spots','safe'];
const aggregate={};let selected=[];
for(const [version,root] of Object.entries(worlds)){
 const D=root.OfficeData,G=root.OfficeMatch.GRAPH;
 aggregate[version]={};
 for(const plan of plans){
  const stats={bouts:0,stars:0,nearfalls:0,ground:0,pins:0,groundCounter:0,pinCounter:0,
   contactAttempts:0,contactCounter:0,contactLanded:0,contactInterrupted:0,
   groundMatches:0,pinMatches:0,repeatedCountPhrases:0,outcomes:{},topGround:{},topPins:{}};
  for(let i=0;i<100;i++){
   const w=roster[i%roster.length],other=roster[(i*7+19)%roster.length];
   const rid=other.id===w.id?roster[(i+1)%roster.length].id:other.id;
   const o=lab.makeOptions(D,{wid:w.id,rid,plan,seed:61001+i*53,
    slot:i%2?'main':'mid',finish:['win_clean','lose_clean','win_dirty','lose_protected'][i%4]});
   const m=lab.runMatch(root,o);
   const events=m.graph.events;
   const landedGround=events.filter(e=>G.A[e.id]?.family==='ground'&&!G.A[e.id]?.counterOf);
   const landedPins=events.filter(e=>G.A[e.id]?.family==='pin'&&!G.A[e.id]?.counterOf);
   const groundCounters=events.filter(e=>G.A[e.id]?.family==='ground'&&G.A[e.id]?.counterOf);
   const pinCounters=events.filter(e=>G.A[e.id]?.family==='pin'&&G.A[e.id]?.counterOf);
   stats.bouts++;stats.stars+=m.final.stars;stats.nearfalls+=m.nearfalls;
   stats.ground+=landedGround.length;stats.pins+=landedPins.length;
   stats.groundCounter+=groundCounters.length;stats.pinCounter+=pinCounters.length;
   stats.groundMatches+=+!!landedGround.length;stats.pinMatches+=+!!landedPins.length;
   stats.outcomes[m.graph.outcome.id]=(stats.outcomes[m.graph.outcome.id]||0)+1;
   for(const e of landedGround)stats.topGround[e.id]=(stats.topGround[e.id]||0)+1;
   for(const e of landedPins)stats.topPins[e.id]=(stats.topPins[e.id]||0)+1;
   const phrases={};
   for(const l of m.log)if(/ONE! TWO!|TWO AND THREE|TWO! .*kicks out|TWO! .*gets free/i.test(l.text))
    phrases[l.text]=(phrases[l.text]||0)+1;
   stats.repeatedCountPhrases+=Object.values(phrases).filter(v=>v>=3).length;
   if(version==='phase5'){
    for(const a of m.graph.contactAttempts||[]){
     stats.contactAttempts++;
     if(a.outcome==='counter')stats.contactCounter++;
     if(a.outcome==='landed')stats.contactLanded++;
     if(['interrupted','aborted'].includes(a.outcome))stats.contactInterrupted++;
    }
    if((landedPins.length||pinCounters.length||landedGround.length)&&selected.filter(s=>s.plan===plan).length<2){
     const targets=[...landedGround.slice(0,1),...landedPins.slice(0,1),...pinCounters.slice(0,1)];
     const traces=targets.map(e=>{
      const times=m.log.map(l=>{const p=l.t.split(':').map(Number);return p[0]*60+p[1]});
      const idx=times.findIndex((t,j)=>t===e.t&&
       (m.log[j].text.includes(m.w.short)||m.log[j].text.includes(m.f.short)));
      const lo=Math.max(0,idx-2),hi=Math.min(m.log.length,idx+3);
      return {id:e.id,t:e.t,attemptedMove:e.attemptedMove||null,
       lines:m.log.slice(lo,hi).map(l=>l.t+' '+l.text)};
     });
     selected.push({plan,seed:o.seed,who:w.id,vs:rid,finish:m.graph.outcome.id,
      nearfalls:m.nearfalls,traces});
    }
   }
  }
  stats.meanStars=+(stats.stars/stats.bouts).toFixed(3);
  stats.meanNearfalls=+(stats.nearfalls/stats.bouts).toFixed(2);
  stats.topGround=Object.entries(stats.topGround).sort((a,b)=>b[1]-a[1]).slice(0,5);
  stats.topPins=Object.entries(stats.topPins).sort((a,b)=>b[1]-a[1]).slice(0,5);
  delete stats.stars;delete stats.nearfalls;
  aggregate[version][plan]=stats;
 }
}
console.log(JSON.stringify({aggregate,selected},null,2));
