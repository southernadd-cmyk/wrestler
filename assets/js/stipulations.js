/* THE OFFICE v0.3.23 — stipulations.
   No disqualification, submission only, falls count anywhere, two out of three falls. Ask a promoter
   for one when you negotiate (each booker has their own taste, and a feud makes the case for you), and
   promoters put their favourite on a blow-off themselves. The stipulation changes the night: the crowd
   comes in expecting it, the match has its own moments, and the booked result arrives the way the rules
   say it has to. Who wins is still the promoter's decision. Deterministic: nothing here draws a random
   number of its own. */
(function installStipulations(root){'use strict';
 const G=root.OfficeGame,D=root.OfficeData,Mx=root.OfficeMatch;
 function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return ((h>>>0)%10007)/10007;}
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Math.round(n)));

 // taste: how each booker feels about it (aggressive Dockside, showman Pulse, traditional North Crown, cold Grand Union).
 // fit: who it suits. risk: how much more often things go wrong. tired: extra fatigue afterwards.
 const STIPS={
  nodq:{name:'No disqualification',short:'No DQ',hint:'Anything goes: chairs, tables, the lot, and nobody can be thrown out for it. Hard on the body.',
   taste:{aggressive:14,showman:6,traditional:-16,cold:-8},fit:{Brawl:5,Story:2,Spectacle:0,Technical:-3},risk:1.3,tired:6,crowd:6,
   announce:'This is a no disqualification match. The referee will not stop anything short of a pinfall or a submission.'},
  submission:{name:'Submission only',short:'Submission',hint:'No pinfalls. Somebody has to quit. Suits a technician.',
   taste:{aggressive:-4,showman:-6,traditional:8,cold:14},fit:{Technical:6,Story:2,Brawl:-2,Spectacle:-4},risk:.9,tired:2,crowd:3,
   announce:'Submission only. No pinfalls tonight: one of them has to give up.'},
  anywhere:{name:'Falls count anywhere',short:'Anywhere',hint:'The fight goes into the crowd, the bar, the car park. A pin counts wherever it lands.',
   taste:{aggressive:10,showman:14,traditional:-10,cold:-12},fit:{Brawl:4,Spectacle:4,Story:1,Technical:-3},risk:1.2,tired:5,crowd:6,
   announce:'Falls count anywhere. No count-outs or disqualifications: the ring is only where it starts.'},
  falls:{name:'Two out of three falls',short:'2 of 3 falls',hint:'Three chances to tell the story. Longer, and the crowd rides every fall.',
   taste:{aggressive:-6,showman:4,traditional:14,cold:8},fit:{Story:4,Technical:4,Brawl:0,Spectacle:1},risk:1,tired:4,crowd:4,
   announce:'Two out of three falls. Win two and it is yours.'}
 };
 const tasteOf=(p,k)=>STIPS[k]?.taste[p?.personality]??0;
 const favourite=p=>Object.keys(STIPS).sort((a,b)=>tasteOf(p,b)-tasteOf(p,a))[0];
 const name=k=>STIPS[k]?.name||'';
 const isDQ=f=>f==='win_dq'||f==='lose_dq';
 const the=n=>/’s |'s /.test(n)?n:'the '+n;
 const holdOf=(x,fallback)=>x.sub?the(x.finisher):fallback;

 // ---------------------------------------------------------------------------------------------
 // Negotiation: a fourth thing to ask a promoter for.
 const originalTalk=G.talkMove;
 G.talkMove=function(oid,wid,move){
  const s=G.S,o=s?.offers.find(x=>x.id===oid);
  if(typeof move==='string'&&move.startsWith('ask:stip:')){
   const kind=move.slice(9),found=G.meeting(oid,wid);if(found.error)return found;
   const t=found.talk,w=G.W(wid),p=G.P(o.pid);
   if(t.step!=='start')return {error:'Choose what you want to negotiate.'};
   if(!STIPS[kind])return {error:'Unknown stipulation.'};
   if(o.stip)return {error:'This match already has a stipulation.'};
   if(o.programme)return {error:'A programme is signed as it stands.'};
   if(['nodq','anywhere'].includes(kind)&&isDQ(o.finish))return {error:'This match is booked to end in a disqualification. It cannot be played without disqualifications.'};
   if(s.focus<1)return {error:'No management meetings remain this week. You can accept the original offer.'};
   s.focus--;t.topic='stip';t.stip=kind;t.step='reason';t.turns++;t.original.stip=o.stip||null;
   t.log.push({who:'You',text:`I want it made a ${name(kind).toLowerCase()} match.`},
    {who:p.voice,text:tasteOf(p,kind)>=8?'Now you’re talking. Convince me they can carry it.':tasteOf(p,kind)<=-8?'On my show? You will have to do better than that.':'Maybe. Why this match?'});
   G.save();return {talk:t,offer:o};
  }
  if(o?.talk?.topic==='stip'&&typeof move==='string'&&move.startsWith('arg:')&&o.talk.step==='reason')return argue(o,wid,move.slice(4));
  const res=originalTalk.apply(this,arguments);
  if(move==='revert'&&o?.talk?.topic==='stip'&&!res.error){o.stip=o.talk.original.stip||null;G.save();}
  return res;
 };
 function heatOf(wid,rid){return G.feud(wid,rid)?.closed?0:G.feud(wid,rid)?.heat||0;}
 // How the case stands, before an argument is made. Exposed for the screen and the tests.
 function chance(o,w,kind,arg){
  const p=G.P(o.pid),s=G.S,heat=heatOf(w.id,o.rid);
  const base=p.trust*.36+w.heat*.25+w.pro*.12+s.rep*.12;
  const boost=arg==='crowd'?w.heat*.2+(p.personality==='showman'?9:0):arg==='reliability'?w.pro*.16+(p.personality==='traditional'?9:0):13+(p.personality==='cold'?8:0);
  const need=68-tasteOf(p,kind)-Math.min(16,heat/4)+({opener:14,mid:6,feature:0,main:-4}[o.slot]||0)+(o.tag==='Blow-off'?-8:0)+(STIPS[kind].fit[w.style]<0?4:0);
  return {strength:Math.round(base+boost),need:Math.round(need)};
 }
 function argue(o,wid,arg){
  const s=G.S,w=G.W(wid),p=G.P(o.pid),t=o.talk,kind=t.stip;
  if(!['crowd','reliability','trade'].includes(arg))return {error:'Unknown argument.'};
  const {strength,need}=chance(o,w,kind,arg),fee=G.purse(o,w);
  t.log.push({who:'You',text:arg==='crowd'?`People will pay to see ${w.short} in a ${name(kind).toLowerCase()} match. Put it on the poster.`:
   arg==='reliability'?`${w.short} will keep it safe and keep it on the layout. You will not regret it.`:`Keep the fee where it is. Just give us the stipulation.`});
  let verdict='refused',detail='The match stays as it is.';
  let fav=favourite(p);
  if(['nodq','anywhere'].includes(fav)&&isDQ(o.finish))fav=Object.keys(STIPS).filter(k=>!['nodq','anywhere'].includes(k)).sort((a,b)=>tasteOf(p,b)-tasteOf(p,a))[0];
  if(strength>=need){verdict='agreed';o.stip=kind;if(arg!=='trade')o.bump=+((o.bump||1)*1.1).toFixed(4);detail=`${name(kind)}${arg!=='trade'?`, and ${G.money(G.purse(o,w))} instead of ${G.money(fee)}: it will draw`:''}.`;}
  else if(strength>=need-14&&fav!==kind&&tasteOf(p,fav)>0){verdict='counter';o.stip=fav;detail=`Not that. A ${name(fav).toLowerCase()} match instead.`;}
  t.step='done';t.verdict=verdict;t.detail=detail;t.before=fee;
  t.log.push({who:p.voice,text:verdict==='agreed'?`Fine. ${detail} Sign it before I change my mind.`:verdict==='counter'?`I won't do that on my show. ${detail} Take it or keep the original.`:`No. ${detail}`});
  if(verdict==='refused'&&p.trust<35)p.trust=clamp(p.trust-1);
  G.save();return {talk:t,offer:o};
 }

 // Blow-offs come with the promoter's favourite stipulation, more often than not.
 const originalEnd=G.endWeek;
 G.endWeek=function(...args){
  const r=originalEnd.apply(this,args);
  try{for(const o of G.S?.offers||[])if(o.tag==='Blow-off'&&o.stip===undefined){const p=G.P(o.pid),fav=favourite(p);o.stip=hash(o.id+'|stip')<.7&&!(['nodq','anywhere'].includes(fav)&&isDQ(o.finish))?fav:null;}}catch(e){G.reportError('stipulations/weekly',e)}
  return r;
 };
 // Signing carries the stipulation onto the contract. Two out of three falls runs five minutes longer.
 const originalBook=G.book;
 G.book=function(oid,wid){
  const o=G.S?.offers.find(x=>x.id===oid),stip=o?.stip,keys=o&&[o.pid,o.rid,o.eventAbs];
  const err=originalBook.apply(this,arguments);
  if(!err&&stip&&STIPS[stip]){
   const c=[...G.S.card,...G.S.futureBookings].find(x=>x.pid===keys[0]&&x.rid===keys[1]&&x.eventAbs===keys[2]&&x.wid===wid&&!x.stip&&!x.programme);
   if(c){c.stip=stip;if(stip==='falls')c.minutes+=5;G.save();}
  }
  return err;
 };

 // ---------------------------------------------------------------------------------------------
 // The night.
 const line=(M,at,text,kind='play',o={})=>{const l={t:Mx.fmt(at),text,kind,big:!!o.big,pause:o.pause||0,who:o.who!==undefined?o.who:['count','bell'].includes(kind)?null:'pbp'};M.queue.push(l);M.log.push(l);return l;};
 const originalCreate=Mx.create;
 Mx.create=function(o){
  const M=originalCreate.apply(this,arguments),k=o?.stip,S0=STIPS[k];
  if(!S0)return M;
  M.stip=k;M.riskMul*=S0.risk;M.fit+=S0.fit[M.w.style]||0;
  M.crowd=Math.min(95,M.crowd+S0.crowd+((o.feudHeat||0)>=40?3:0));M.crowdStart=M.crowd;M.crowdPeak=Math.max(M.crowdPeak,M.crowd);
  line(M,0,S0.announce,'story',{who:'pbp'});
  // The moments a stipulation brings, at points along the match clock.
  const won=String(o.finish||'').startsWith('win');
  M.stipSpots=k==='falls'?[{at:.42,kind:'fall',to:won?'f':'w'},{at:.7,kind:'fall',to:won?'w':'f'}]:
   [{at:.36+.08*hash(o.seed+'|a'),kind:k},{at:.6+.08*hash(o.seed+'|b'),kind:k}];
  M.stipScore={w:0,f:0};
  return M;
 };
 const SPOT={
  nodq:[(A,B)=>`${A} drags a chair out from under the ring. The referee shrugs: it is legal tonight. It comes down across ${B}’s back.`,
   (A,B)=>`${A} sets up a table at ringside. The crowd know exactly what it is for. ${B} goes through it.`],
  anywhere:[(A,B)=>`They spill over the barrier and fight up the steps into the crowd. ${A} slams ${B} on the concrete. The referee counts two up there!`,
   (A,B)=>`${A} drags ${B} to the bar. Two pints go over. A cover by the till: ONE, TWO, no!`],
  submission:[(A,B)=>`${A} has ${B} stretched in the middle of the ring. The referee asks if they want to quit. ${B} screams no.`,
   (A,B)=>`${B} catches the rope and the referee calls for a break. ${A} must release, then drags ${B} back towards the centre.`]
 };
 function fireSpot(M,s){
  s.done=true;const w=M.w,f=M.f,at=M.t;
  if(s.kind==='fall'){
   const A=s.to==='w'?w:f,B=s.to==='w'?f:w;M.stipScore[s.to]++;
   line(M,at,`${A.short} catches ${B.short} with a sudden cradle!`,'play',{big:true,pause:1});
   line(M,at,'ONE! TWO! THREE!','count',{big:true,pause:1});
   line(M,at+2,`That’s a fall to ${A.short}. ${M.stipScore.w}–${M.stipScore.f}${M.stipScore.w===M.stipScore.f?'. All square, and one fall left.':'.'}`,'crowd',{big:true,pause:2});
   Mx.lift(M,5);M.bonus=(M.bonus||0)+3; // Successful falls are not near falls.
  }else{
   // The wrestler in control does the damage; whoever is ahead on momentum.
   const own=(M.mom||0)>=0,A=own?w:f,B=own?f:w,fn=SPOT[s.kind][M.stipSpots.indexOf(s)%2];
   line(M,at,fn(A.short,B.short),'crowd',{big:true,pause:1});
   Mx.lift(M,4);M.bonus=(M.bonus||0)+3;
   if(s.kind==='nodq'||s.kind==='anywhere'){if(own)M.fSt=Math.max(0,M.fSt-6);else M.wSt=Math.max(0,M.wSt-6);}
  }
  M.crowdPeak=Math.max(M.crowdPeak||0,M.crowd);
 }
 const originalNext=Mx.next;
 Mx.next=function(M){
  try{
   if(M?.stipSpots&&!M.queue.length&&!M.decision&&M.stage==='live'){
    const frac=M.t/Math.max(1,M.len),s=M.stipSpots.find(x=>!x.done&&frac>=x.at);if(s)fireSpot(M,s);
   }
  }catch(e){G.reportError('stipulations/in-match',e)}
  return originalNext.call(this,M);
 };

 // The finish, the way the rules say it has to come. Who wins is still the booked finish.
 // Each one reports an existing route id with the same meaning, so the rivalry ledger stays truthful.
 const FINISH={
  submission:{
   win_clean:['submission_defeat',(M,w,f,st)=>{const hold=holdOf(w,'a crossface');
    line(M,st().at,`${w.short} drags ${f.short} to the centre and locks in ${hold}. There is nowhere to go.`,'play',{big:true,pause:2});
    line(M,st().at,`${f.short} holds on, and holds on, and TAPS!`,'count',{big:true});
    line(M,st().at,`${w.name} makes ${f.short} quit.`,'bell',{big:true});}],
   win_dirty:['feet_on_ropes',(M,w,f,st)=>{
    line(M,st().at,`${w.short} locks in a hold near the ropes and hooks both feet on the middle rope for leverage. The referee is on the wrong side.`,'play',{big:true,pause:2});
    line(M,st().at,`${f.short} can't take any more. They tap!`,'count',{big:true});
    line(M,st().at,`${w.short} gets the submission, with a little help from the ropes.`,'bell',{big:true});}],
   lose_protected:['injury_gives',(M,w,f,st)=>{const hold=holdOf(f,'a sleeper');
    line(M,st().at,`${f.short} locks in ${hold}. ${w.short} will not tap. Will not.`,'play',{big:true,pause:2});
    line(M,st().at,`${w.short}’s arm drops once. Twice. A third time. The referee stops it.`,'count',{big:true,pause:1});
    line(M,st().at,`${f.name} wins. ${w.short} never quit.`,'bell',{big:true});}],
   lose_clean:['submission_defeat',(M,w,f,st)=>{const hold=holdOf(f,'a crossface');
    line(M,st().at,`${f.short} catches ${w.short} in ${hold} in the middle of the ring.`,'play',{big:true,pause:2});
    line(M,st().at,`${w.short} taps.`,'count',{big:true});
    line(M,st().at,`${f.name} wins by submission.`,'bell',{big:true});}]
  },
  nodq:{
   win_clean:['finisher',(M,w,f,st)=>{
    line(M,st().at,`${w.short} sets the chair in the middle of the ring and hits ${the(w.finisher)} onto it!`,'play',{big:true,pause:1});
    line(M,st().at,'The cover.','count',{pause:1});line(M,st().at,'ONE! TWO! THREE!','count',{big:true});
    line(M,st().at,`${w.name} wins it. No rules, no doubt.`,'bell',{big:true});}],
   win_dirty:['eye_poke',(M,w,f,st)=>{
    line(M,st().at,`${f.short} picks up the chair, and ${w.short} rakes the eyes before it can come down. Then the chair comes down the other way.`,'play',{big:true,pause:1});
    line(M,st().at,'ONE! TWO! THREE!','count',{big:true});
    line(M,st().at,`${w.short} wins, by any means necessary.`,'bell',{big:true});}],
   lose_protected:['rope_rollup',(M,w,f,st)=>{
    line(M,st().at,`${w.short} has the chair, and ${f.short} has nothing. ${w.short} swings, misses, and ${f.short} rolls them up with a fistful of tights.`,'play',{big:true,pause:1});
    line(M,st().at,'ONE! TWO! THREE!','count',{big:true});
    line(M,st().at,`${f.name} steals it. ${w.short} was a swing away.`,'bell',{big:true});}],
   lose_clean:['finisher',(M,w,f,st)=>{
    line(M,st().at,`${f.short} drives ${w.short} through the table with ${the(f.finisher)}!`,'play',{big:true,pause:1});
    line(M,st().at,'ONE! TWO! THREE!','count',{big:true});
    line(M,st().at,`${f.name} wins. There is wood all over the ringside area.`,'bell',{big:true});}]
  },
  anywhere:{
   win_clean:['finisher',(M,w,f,st)=>{
    line(M,st().at,`They fight all the way to the entrance stage. ${w.short} hits ${the(w.finisher)} on the steel!`,'play',{big:true,pause:1});
    line(M,st().at,'The referee runs up the aisle to count it.','count',{pause:1});line(M,st().at,'ONE! TWO! THREE!','count',{big:true});
    line(M,st().at,`${w.name} wins it on the stage.`,'bell',{big:true});}],
   win_dirty:['tights',(M,w,f,st)=>{
    line(M,st().at,`By the merchandise stall, ${w.short} shoves ${f.short} into the T-shirts and rolls them up with a handful of tights.`,'play',{big:true,pause:1});
    line(M,st().at,'ONE! TWO! THREE!','count',{big:true});
    line(M,st().at,`${w.short} steals it between the mugs and the posters.`,'bell',{big:true});}],
   lose_protected:['rope_rollup',(M,w,f,st)=>{
    line(M,st().at,`${w.short} has ${f.short} beaten in the aisle, then stops to argue with a fan. ${f.short} rolls them up with a handful of tights.`,'play',{big:true,pause:1});
    line(M,st().at,'ONE! TWO! THREE!','count',{big:true});
    line(M,st().at,`${f.name} wins it in the aisle. ${w.short} cannot believe it.`,'bell',{big:true});}],
   lose_clean:['finisher',(M,w,f,st)=>{
    line(M,st().at,`On the concrete floor by the bar, ${f.short} hits ${the(f.finisher)}.`,'play',{big:true,pause:1});
    line(M,st().at,'ONE! TWO! THREE!','count',{big:true});
    line(M,st().at,`${f.name} wins it by the bar. ${w.short} is going nowhere.`,'bell',{big:true});}]
  }
 };
 for(const [key,list] of Object.entries(Mx.FINISH_ROUTES||{}))for(const route of list){
  const run=route.run;
  route.run=function(M,w,f,step){
   const k=M.stip;
   if(k==='falls'){
    // Any fall the clock did not reach is taken first; then the deciding fall, as booked.
    for(const s of M.stipSpots||[])if(!s.done)fireSpot(M,s);
    line(M,step().at,`One fall each. This one decides it.`,'story',{who:'colour'});
    const completed=run.call(this,M,w,f,step);
    M.stipScore[key.startsWith('win')?'w':'f']++;
    line(M,M.t,`Final falls: ${M.stipScore.w}–${M.stipScore.f}.`,'story',{who:'colour'});
    return completed;
   }
   const F=FINISH[k]?.[key];
   if(!F)return run.call(this,M,w,f,step);
   M.finishRoute=F[0];if(M.graph?.outcome)M.graph.outcome.route=F[0];
   return F[1](M,w,f,step);
  };
 }

 // ---------------------------------------------------------------------------------------------
 // Afterwards: the body pays, and the feud remembers.
 G.registerResultStage('stipulations',originalApply=>function(c,fin){
  const seen=!!(c&&G.S?.history?.some(h=>h.cid===c.id));
  const out=originalApply.apply(this,arguments);
  try{
   const S0=STIPS[c?.stip];
   if(S0&&!seen&&!c.stipDone){
    c.stipDone=true;const w=G.W(c.wid),h=G.S.history[0];
    if(h&&h.wid===c.wid&&h.rid===c.rid)h.stip=c.stip;
    if(w){w.fatigue=clamp(w.fatigue+S0.tired);out.push({text:`${S0.name}: ${w.short} fatigue +${S0.tired}.`,tone:-1});}
    const fd=G.feud(c.wid,c.rid);if(fd&&!fd.closed&&fin?.outcome!=='nc'){fd.heat=clamp(fd.heat+5);out.push({text:`The ${S0.name.toLowerCase()} match turned the feud up: heat ${fd.heat}.`,tone:1});}
    G.save();
   }
  }catch(e){G.reportError('stipulations/match-result',e)}
  return out;
 });

 root.OfficeStips={STIPS,tasteOf,favourite,name,chance,FINISH};
})(typeof window!=='undefined'?window:globalThis);
