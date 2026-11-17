'use strict';
// THE FIVE-BOUT RIVALRY EXPERIMENT
// Two existing wrestlers, one persistent career, five separately booked encounters. Each bout has its
// own backstage meeting, promo, match, debrief and memory updates, in the order the interface uses,
// and the save is written and reloaded between shows. The report records what each meeting argued,
// what the evidence was, what changed on the sheet, what happened in the ring and what was remembered.
//
//   node tools/five-bouts.cjs --w rex --f silas --finishes lose_clean,lose_protected,win_clean,lose_clean,win_clean --out docs/reports/x.md
//
// Nothing here is part of the game. It drives the shipped engine scripts exactly as the tests do.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {script}=require('../tests/_source.cjs');

function load(){
 const cut=script.indexOf('/* THE OFFICE — interface v3');
 const db=new Map(),root={addEventListener(){}};
 const localStorage={getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)};
 vm.runInNewContext(script.slice(0,cut),{window:root,localStorage,console,Math,Date,JSON});
 return root;
}

// A thoughtful but simple player. Each bout says which answer stance to take at the microphone, so a
// run can exercise concessions, defences and challenges; everything else follows a fixed preference.
const STANCES={
 // Answer-round preference per bout, by node id. Case responses ride on these same node ids.
 measured:[['turn','challenge','calm'],['calm','turn'],['challenge','turn'],['turn','calm'],['calm','challenge']],
 hothead:[['personal','turn'],['personal','challenge'],['turn','personal'],['personal'],['challenge','personal']],
 gracious:[['calm','turn'],['calm'],['challenge','calm'],['calm'],['calm','challenge']]
};
function prefer(options,list){for(const id of list){const o=options.find(x=>x.id===id);if(o)return o;}return options[0];}

function run(opts){
 const root=load(),D=root.OfficeData,G=root.OfficeGame,Room=root.OfficeRoom,Mic=root.OfficeMic,MX=root.OfficeMatch,
  Mem=root.OfficeMemory,Bonds=root.OfficeBonds||null,Riv=root.OfficeRivalry||null,Sheets=root.OfficeSheets;
 G.fresh();G.S.seed=opts.careerSeed||4242;G.S.cash=20000;
 const err=G.sign(opts.w);if(err)throw Error('sign: '+err);
 const w0=G.W(opts.w),f=G.F(opts.f);if(!w0||!f)throw Error('unknown wrestler');
 const pid=opts.pid||'dock',p=G.P(pid);
 const style=STANCES[opts.stance||'measured'];
 const bouts=[];
 for(let k=0;k<opts.finishes.length;k++){
  const w=G.W(opts.w);
  w.injury=0;w.fatigue=Math.min(w.fatigue,30); // the experiment books them regardless of the calendar
  const before={mem:Mem.view(w.id).entries.map(e=>e.id),feud:{...(G.feud(w.id,f.id)||{heat:0,matches:0})},
   bond:root.OfficeBonds?.score?.(w.id,f.id)??null,trust:Mem.trust(w.id),rival:Mem.rival(w.id,f.id)};
  const c={id:'rivalry-'+opts.tag+'-'+(k+1),wid:w.id,rid:f.id,pid,slot:k>=3?'feature':'mid',finish:opts.finishes[k],minutes:12,purse:300,
   blowoff:false,feudHeat:G.feud(w.id,f.id)?.heat||0,eventAbs:G.abs()};
  G.S.card.push(c);
  const profile=Riv?JSON.parse(JSON.stringify(Riv.profile(w.id,f.id))):null;
  // ---- backstage ----
  const room=Room.begin(c,w,f,p,{recent:G.S.roomRecent||[],threads:Room.liveThreads(G.S.roomThreads,c.eventAbs),heat:G.feud(w.id,f.id)?.heat||0,rehearsed:false});
  const roomChoices=[];
  for(let guard=0;guard<40&&room.stage!=='done';guard++){
   const o=Room.options(room);let pick;
   if(room.stage==='plan')pick=prefer(o,['plan_'+(opts.game||'story')]);
   else if(room.stage==='board')pick=prefer(o,['board_ok']);
   else if(room.stage==='curtain')pick=prefer(o,['talk_calm']);
   else if(room.stage==='scene'){
    const sit=room.queue[room.at];
    pick=(opts.roomPolicy&&opts.roomPolicy(sit,o,k))||o[0];
   }else pick=o[0];
   roomChoices.push({stage:room.stage,situation:room.stage==='scene'?room.queue[room.at]:null,id:pick.id,label:pick.label});
   Room.act(room,pick.id);
  }
  const sheet=room.sheet;
  G.S.roomRecent=[...(G.S.roomRecent||[]),...room.queue].slice(-6);
  // ---- microphone ----
  const feud=G.feud(w.id,f.id);
  const duel=Mic.begin(c,w,f,feud,sheet,p);
  const recalled=Mem.context(w.id,f.id);
  if(recalled.promoPrompt&&!Riv)duel.log[0].line=recalled.promoPrompt+' '+duel.log[0].line;
  if(Riv?.introFor){const intro=Riv.introFor(duel.core);if(intro)duel.log[0].line=intro;}
  const micChoices=[];
  for(let guard=0;guard<10&&duel.stage!=='done';guard++){
   const o=Mic.choices(duel),round=Mic.ROUNDS[duel.round].id;let pick;
   if(round==='open')pick=o.find(x=>x.evidence)||prefer(o,opts.openPref||['proof','people','accusation']);
   else if(round==='answer')pick=prefer(o,style[k%style.length]);
   else if(round==='push')pick=prefer(o,opts.pushPref||['firm','revise','leave']);
   else pick=o.find(x=>x.followsCase)||(duel.core.case?.noPromise&&opts.stance!=='hothead'?prefer(o,['legacy','uncertainty','grateful']):prefer(o,opts.closePref||['question','clean','legacy']));
   micChoices.push({round,id:pick.id,label:pick.label,evidence:pick.evidence||null});
   Mic.choose(duel,pick.id);
  }
  const promo=Mic.result(duel);
  // ---- the match ----
  const M=MX.create({w:{...w,fatigue:G.clamp(w.fatigue)},f,p,slot:c.slot,minutes:sheet?.minutes||c.minutes,finish:c.finish,feudHeat:Math.max(c.feudHeat||0,feud?.heat||0),
   blowoff:false,promo,plan:{game:sheet?.game||'story',leash:sheet?.leash||'script',talk:sheet?.talk||'calm'},preparation:{...(w.prep||{})},flags:{...w.flags,...(sheet?.flags||{})},
   memory:Mem.context(w.id,f.id),sheet:sheet?.signed?Room.addVow(sheet,promo,w,f):null,seed:(opts.matchSeed||900)+k*7919});
  for(let i=0;i<12000&&!M.done;i++){if(M.decision&&!M.queue.length)MX.resolve(M,M.decision.options[0].id);MX.next(M);}
  if(!M.done)throw Error('match stalled');
  const fin={...M.final,log:M.log.map(({t,text,kind,big,who})=>({t,text,kind,big,who}))};
  const cons=G.applyResult(c,fin);
  // The interface's post-match step (ui.js result()): the sheet report and the chemistry memory.
  const report=Sheets.report(M);
  const h=G.S.history.find(x=>x.cid===c.id);
  if(report){
   if(h)h.sheet=report;
   if(report.achieved>=3&&report.missed===0&&fin.stars>=3.5)Mem.remember(w.id,'chemistry',w.short+' remembers how well the agreed match with '+f.short+' came together.',f.id,3,4,c.id+':chemistry');
   if(report.missed>=3)Mem.remember(w.id,'sheet_changes',w.short+' remembers how far the match departed from the agreed match layout against '+f.short+'.',f.id,-2,0,c.id+':sheet');
  }
  // A second application of the same result must change nothing.
  const snap=JSON.stringify(G.S);G.applyResult(c,fin);const dup=JSON.stringify(G.S)!==snap;
  // Save, reload, then let a fortnight pass before the next booking.
  G.S=JSON.parse(JSON.stringify(G.S));
  G.endWeek();G.endWeek();
  G.S=JSON.parse(JSON.stringify(G.S));
  const after={mem:Mem.view(w.id).entries,feud:{...(G.feud(w.id,f.id)||{})},bond:root.OfficeBonds?.score?.(w.id,f.id)??null,trust:Mem.trust(w.id),rival:Mem.rival(w.id,f.id)};
  bouts.push({k:k+1,c,profile,roomChoices,roomLog:room.log.map(x=>({who:x.who,text:x.text,kind:x.kind})),sheet:sheet?{nodes:sheet.nodes.map(n=>({id:n.id,owner:n.owner,actions:n.actions,title:n.title})),negotiation:sheet.negotiation||null,premise:sheet.premise,decided:sheet.decided}:null,
   micChoices,promo:{dialogue:promo.dialogue,case:promo.case||null,promise:h?.promo?.promise||promo.promise,tactic:promo.tactic,meter:promo.duel?.meter,quality:promo.quality},
   match:{route:fin.finishRoute,outcome:fin.outcome,stars:fin.stars,minutes:fin.minutes,evidence:fin.evidence||null,key:M.log.filter(l=>l.big||l.kind==='story'||/counter|promised|reads/i.test(l.text)).slice(-14).map(l=>l.t+' '+l.text),
    strip:report?report.beats.map(b=>b.id+': '+b.status+(b.actual&&b.actual!==b.expected?' ('+b.actual+')':'')):[]},
   consequences:cons.map(x=>x.text),dup,
   memory:{added:after.mem.filter(e=>!before.mem.includes(e.id)).map(e=>e.kind+': '+e.text),trust:[before.trust,after.trust],rival:[before.rival,after.rival]},
   feud:[before.feud.heat||0,after.feud.heat||0],bond:[before.bond,after.bond],
   ledger:Riv?JSON.parse(JSON.stringify(Riv.ledger(w.id,f.id))):null});
 }
 return {opts,bouts,w:G.W(opts.w),f,root};
}

const q=s=>String(s).replace(/\|/g,'\\|');
const root_say=c=>String(c.say||'').replace(/\{opps\}/g,'the opponent’s').replace(/\{opp\}/g,'the opponent');
function render(r,title){
 const {bouts,opts,w,f}=r;const out=[];
 out.push('# '+title,'',`**Pairing:** ${w.name} (${w.style}, voice ${r.root.OfficeRoom.voice(w)}) against ${f.name} (${f.style}, voice ${r.root.OfficeRoom.voice(f)}).  `,
  `**Booked results (from ${w.short}'s side):** ${opts.finishes.join(', ')}.  **Microphone stance:** ${opts.stance||'measured'}.  **Seeds:** career ${opts.careerSeed||4242}, matches ${opts.matchSeed||900}+.`,'');
 let prev=null;
 for(const b of bouts){
  out.push('## Bout '+b.k+' — '+b.c.finish.replace(/_/g,' ')+' ('+b.c.slot+')','');
  if(b.profile){
   const pr=b.profile;
   out.push('**Going in.** '+(pr.meetings?`${pr.meetings} previous meeting${pr.meetings>1?'s':''}; record ${w.short} ${pr.record.w}–${pr.record.f} ${f.short}. Stance: ${w.short} ${pr.stance.w}, ${f.short} ${pr.stance.f}.`:'First recorded meeting. No shared history.'));
   if(pr.facts?.length)out.push('','Evidence available (most consequential first):','',...pr.facts.slice(0,5).map(x=>`- \`${x.kind}\` (weight ${x.weight}) — ${x.text}`));
   if(pr.open?.length)out.push('','Unresolved from before:','',...pr.open.map(x=>`- ${x.text}`));
   out.push('');
  }
  const cs=b.promo.case;
  if(cs){
   out.push('**The argument.**','',`- Family: ${cs.family}. Claim \`${cs.id}\`${cs.continuation?' (continuing an unresolved argument)':''}.`,
    `- Proposition (${w.short}): ${cs.prop}`,`- Evidence: ${cs.evidence||'none (no factual assertion)'}`,`- Target: ${cs.target}. Intent: ${cs.intent}.`,
    `- Counterclaim (${f.short}, ${cs.mode}): ${cs.counter}`,`- Response chosen: ${cs.response||'—'} → resolution **${cs.resolution||'unresolved'}**${cs.commit?'; commitment: '+root_say(cs.commit)+(cs.commit.official?' (made official at the close)':''):''}.`,
    ...(cs.followup?[`- Follow-up: ${cs.followup}`]:[]),'');
  }
  out.push('**Backstage.** '+(b.sheet?b.sheet.premise:'No sheet.'),'');
  if(b.sheet?.negotiation){const n=b.sheet.negotiation;out.push('Negotiation: '+n.summary,'',...(n.turns||[]).map(t=>`- ${t.who}: ${t.text}`),'');}
  out.push('<details><summary>Meeting transcript</summary>','',...b.roomLog.map(x=>`- **${q(x.who)}:** ${q(x.text)}`),'','</details>','');
  out.push('Signed running order: '+(b.sheet?b.sheet.nodes.map(n=>n.id+'='+n.actions[0]).join(', '):'—'),'');
  out.push('**At the microphone.** Choices: '+b.micChoices.map(x=>x.round+': '+x.label+(x.evidence?' [evidence]':'')).join(' · ')+`. Crowd meter ${b.promo.meter}, promo ${b.promo.quality}/100.`,'');
  out.push('```text',...b.promo.dialogue.map(d=>(d.speaker||'Stage')+': '+d.line),'```','');
  out.push('**In the ring.** '+`${b.match.minutes} minutes, ${b.match.stars}★, finish route \`${b.match.route}\`, outcome ${b.match.outcome}.`,'');
  if(b.match.evidence){const e=b.match.evidence;out.push(`Recorded: counters ${w.short} ${e.counters.w} / ${f.short} ${e.counters.f}; cheating ${w.short} ${e.dirty.w?'yes':'no'} / ${f.short} ${e.dirty.f?'yes':'no'}; stamina at the bell ${w.short} ${e.stamina.w} / ${f.short} ${e.stamina.f}.`,'');}
  if(b.match.strip.length)out.push('Sheet: '+b.match.strip.join('; '),'');
  out.push('Key moments:','','```text',...b.match.key,'```','');
  out.push('**Promise.** '+(b.promo.promise?.checked?`${b.promo.promise.type} — ${b.promo.promise.kept?'kept':'broken'}.`:(b.promo.promise?.type||'none')+' (not tested).'),'');
  out.push('**Consequences.**','',...b.consequences.map(x=>'- '+x),'');
  out.push(`**Memory and relationships.** Feud heat ${b.feud[0]}→${b.feud[1]}; bond ${b.bond[0]}→${b.bond[1]}; manager trust ${b.memory.trust[0]}→${b.memory.trust[1]}; rival regard ${b.memory.rival[0]}→${b.memory.rival[1]}.`,'',...b.memory.added.map(x=>'- '+x),'');
  out.push('Replaying the same result twice changed the save: **'+(b.dup?'YES (bug)':'no')+'**.','');
  if(prev){
   const diff=[];
   if(cs&&prev.promo.case){if(cs.id!==prev.promo.case.id)diff.push('a different argument ('+prev.promo.case.id+' → '+cs.id+')');else diff.push('the same argument continued'+(cs.continuation?' as an unresolved issue':''));
    if(cs.resolution!==prev.promo.case.resolution)diff.push('resolution '+prev.promo.case.resolution+' → '+cs.resolution);}
   const said=d=>d.speaker===w.name||d.speaker===f.name;
   const pl=prev.promo.dialogue.filter(said).map(d=>d.line),same=b.promo.dialogue.filter(d=>said(d)&&pl.includes(d.line)).length,all=b.promo.dialogue.filter(said).length;
   diff.push(same+' of '+all+' wrestler lines repeated verbatim from the previous bout');
   if(b.sheet&&prev.sheet&&JSON.stringify(b.sheet.nodes.map(n=>n.actions[0]))!==JSON.stringify(prev.sheet.nodes.map(n=>n.actions[0])))diff.push('a different running order');
   out.push('**Different from the previous bout:** '+diff.join('; ')+'.','');
  }
  prev=b;
 }
 return out.join('\n');
}

if(require.main===module){
 const arg=k=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:null;};
 const opts={w:arg('w')||'rex',f:arg('f')||'silas',pid:arg('pid')||'dock',tag:arg('tag')||'a',stance:arg('stance')||'measured',
  finishes:(arg('finishes')||'lose_clean,lose_protected,win_clean,lose_clean,win_clean').split(','),careerSeed:+(arg('career')||4242),matchSeed:+(arg('seed')||900)};
 const r=run(opts);
 const md=render(r,arg('title')||'Five bouts: '+r.w.short+' and '+r.f.short);
 const out=arg('out');
 if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,md);console.log('wrote '+out);}
 else console.log(md);
}
module.exports={run,render,load};
