/* THE OFFICE v0.3.20 — after the bell.
   The match is not over when the referee counts three. With the result known, the first call is
   what happens next: a handshake, a stare-down that says this is not finished, an attack once the
   bell has gone, or a lap of honour. It plays out there and then (the other wrestler may not shake,
   and may not have agreed to be jumped), and then your wrestler has the microphone: rub it in, give them credit, take
   the loss, blame the finish, or call somebody out. A callout that the room believes brings that
   match onto the promoter's desk the following week.
   Deterministic: every outcome is read from the save and hashed from the contract id.
   Older saves may carry a plan agreed backstage in Dennis's room; that plan still plays as agreed. */
(function installAfterBell(root){'use strict';
 const G=root.OfficeGame,D=root.OfficeData,T=root.OfficeTerritory;
 function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return ((h>>>0)%10007)/10007;}
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Math.round(n)));
 const between=(n,a,b)=>Math.max(a,Math.min(b,n));
 const voice=w=>root.OfficeRoom?.VOICE?.[w?.id]||'stoic';
 const who=id=>G.W(id)||G.F(id)||D.findWrestler?.(id)||null;
 const CALL_WEEKS=2;

 function state(s=G.S){
  if(!s)return null;
  const a=s.after&&typeof s.after==='object'?s.after:(s.after={});
  a.done??={};a.calls??=[];a.log??=[];
  return a;
 }

 // ---------------------------------------------------------------------------------------------
 // What the wrestlers do once the bell has gone. Chosen after the result, at the start of the segment.
 const PLANS={
  none:{label:'Nothing. Back through the curtain',hint:'Let the match speak for itself.',tags:['Safe']},
  handshake:{label:'Offer a handshake',hint:'Respect, in front of everyone. They might not take it.',tags:['Builds a bond','Cools the feud','Risk: refused']},
  staredown:{label:'A long stare-down',hint:'Neither of them leaves. The crowd knows this is not over.',tags:['Feud heat ▲','Rematch likelier']},
  beatdown:{label:'Attack after the bell',hint:'Big heat, if the other side agreed to it. If they did not, it is a real fight.',tags:['Feud heat ▲','Gamble: did they agree?']},
  celebrate:{label:'A lap of honour',hint:'Slap every hand on the barrier. Only works if the crowd is still with them.',tags:['Heat ▲ if the crowd is hot']}
 };
 function plans(c,w,f,actuallyWon){
  // With the result known, the lap of honour follows who actually won, not the booked finish.
  const won=typeof actuallyWon==='boolean'?actuallyWon:String(c?.finish||'').startsWith('win');
  const bond=root.OfficeBonds?.score?.(w.id,f.id)||0;
  return Object.entries(PLANS).filter(([id])=>id!=='celebrate'||won).map(([id,x])=>{
   let hint=x.hint;
   if(id==='handshake'&&bond<=-35)hint+=' '+f.short+' cannot stand '+w.short+'. Do not hold your breath.';
   if(id==='beatdown'&&f.pro<60)hint+=' '+f.short+' is not the most professional; they may take it the wrong way.';
   if(id==='handshake'&&c.finish==='win_dirty')hint+=' Hard to shake the hand of somebody who just cheated you.';
   return {id,label:x.label,hint,tags:x.tags.slice()};
  });
 }

 // ---------------------------------------------------------------------------------------------
 // The night itself.
 // AB1: capture witnessed evidence once, after result settlement. No RNG or new game effects.
 // Old saves may lack these fields; unknown facts are left unknown rather than invented.
 function capture(fin,h){
  const e=fin?.evidence||{},copy=v=>v==null?null:JSON.parse(JSON.stringify(v));
  const corner=k=>k?{second:k.second??null,secondName:k.secondName??null,job:k.job??null,
   fired:!!k.fired,ok:!!k.ok,ejected:!!k.ejected,hurtRef:!!k.hurtRef,dq:!!k.dq}:null;
  return {stars:fin?.stars,crowd:fin?.crowd,outcome:fin?.outcome,context:{
   v:1,route:fin?.finishRoute||e.route||null,dirty:copy(e.dirty),injured:copy(e.injured),
   stamina:copy(e.stamina),counters:copy(e.counters),lateCounters:copy(e.late),
   botches:fin?.botches??null,stiff:fin?.stiff??null,refused:fin?.refused??null,
   shortened:fin?.shortened??null,timeDefied:fin?.timeDefied??null,
   ringside:corner(h?.ringside),rivalCorner:corner(h?.rivalCorner),
   nearfalls:fin?.nearfalls??null,crowdStart:fin?.crowdStart??null,crowdPeak:fin?.crowdPeak??null,
   ignored:fin?.ignored??null
  }};
 }
 // Brief the player only on salient, verified events.
 function contextLines(x){
  const e=x.context;if(!e)return [];
  const out=[],r=e.rivalCorner,k=e.ringside;
  if(r?.fired&&r.ejected)out.push((r.secondName||'The rival corner')+' was ejected by the referee during the match.');
  else if(r?.fired&&r.ok&&['runin','argue','distract'].includes(r.job))
   out.push((r.secondName||'The rival corner')+(r.job==='runin'?' ran in during the match.':' interfered from ringside.'));
  if(k?.fired&&k.dq)out.push((k.secondName||'Your corner')+' was involved in the disqualification.');
  else if(k?.fired&&k.hurtRef)out.push('The referee was hurt during the match.');
  else if(k?.fired&&k.ejected)out.push((k.secondName||'Your corner')+' was ejected by the referee.');
  else if(k?.fired&&k.ok&&k.job!=='support')out.push((k.secondName||'Your corner')+' carried out the agreed ringside action.');
  if(e.injured?.w)out.push(x.w.short+' picked up an injury during the match.');
  if(e.injured?.f)out.push(x.f.short+' was hurt during the match.');
  if(e.dirty?.w||e.dirty?.f)out.push(e.dirty.w&&e.dirty.f?'Both wrestlers used cheap shots.':(e.dirty.w?x.w.short:x.f.short)+' used a cheap shot during the match.');
  if(e.refused)out.push('There was a refusal during the match.');
  return out.slice(0,3);
 }
 function ctxOf(c,fin){
  const w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid);
  const outcome=fin?.outcome||'booked',FN=D.FINISHES[c.finish]||{};
  const won=outcome==='double'||(outcome!=='nc'&&outcome!=='dq'&&!!FN.win);
  return {w,f,p,won,outcome,finish:c.finish,stars:+(fin?.stars||0),crowd:+(fin?.crowd||50),dirty:['win_dirty','lose_protected','win_dq'].includes(c.finish)&&outcome!=='dq',clean:c.finish==='win_clean'||c.finish==='lose_clean',context:fin?.context||null};
 }
 // AB2: a domain model on the existing shared psychology kernel. Scores are
 // behavioural tendencies, not probabilities, agreement, or changes to career stats.
 const K=root.OfficePsychology;
 const family=(output,axis,values,weight)=>['low','medium','high'].map((grade,i)=>({
  id:output+'_'+axis+'_'+grade,output,value:values[i],weight,when:[axis+'.'+grade]}));
 const rule=(id,output,value,weight,...when)=>({id,output,value,weight,when});
 const reactionModel=K?.createModel({curves:{...K.workerCurves,bond:[25,50,75],feudHeat:[20,50,80],
  stamina:[20,50,80]},outputs:['respect','cooperation','escalation','caution'],rules:[
  ...family('respect','professionalism',[25,55,85],2),
  ...family('respect','bond',[10,55,90],2),
  ...family('respect','ego',[75,55,30],1),
  rule('respect_cheapshot','respect',10,3,'match.partnerDirty'),
  rule('respect_interference','respect',15,2,'match.partnerInterference'),
  rule('respect_ego_loss','respect',15,2,'match.lost','ego.high'),
  ...family('cooperation','professionalism',[20,55,90],3),
  ...family('cooperation','bond',[15,55,90],2),
  ...family('cooperation','ringPsychology',[25,55,80],1),
  rule('cooperation_cheapshot','cooperation',15,2,'match.partnerDirty'),
  rule('cooperation_injured','cooperation',10,3,'match.ownInjury'),
  ...family('escalation','ego',[20,50,85],2),
  ...family('escalation','bond',[90,50,15],2),
  ...family('escalation','feudHeat',[20,50,85],1),
  ...family('escalation','professionalism',[80,50,20],1),
  rule('escalation_cheapshot','escalation',95,3,'match.partnerDirty'),
  rule('escalation_interference','escalation',90,2,'match.partnerInterference'),
  rule('escalation_ego_loss','escalation',90,2,'match.lost','ego.high'),
  ...family('caution','stamina',[95,55,15],3),
  ...family('caution','professionalism',[30,55,80],1),
  ...family('caution','ringPsychology',[30,55,80],1),
  rule('caution_injury','caution',100,5,'match.ownInjury')
 ]});
 function psychology(c,fin){
  if(!reactionModel||fin?.context?.v!==1)return null;
  const x=ctxOf(c,fin),e=x.context;if(!x.w||!x.f)return null;
  const pair=G.S?.bonds?.pairs?.[[x.w.id,x.f.id].sort().join('|')];
  const feud=G.S?.feuds?.[x.w.id+':'+x.f.id]||G.S?.feuds?.[x.f.id+':'+x.w.id];
  const assess=(side,actor)=>{
   const other=side==='w'?'f':'w',corner=side==='w'?e.rivalCorner:e.ringside;
   const values={...K.workerInputs(actor),bond:K.scale(pair?.score,-100,100),
    feudHeat:K.scale(feud?.closed?0:feud?.heat,0,100),stamina:K.scale(e.stamina?.[side],0,100)};
   const cues={};
   if(e.dirty?.[other]===true)cues['match.partnerDirty']=1;
   if(corner?.fired&&corner.ok&&!corner.ejected&&['runin','argue','distract','refbump'].includes(corner.job))cues['match.partnerInterference']=1;
   if(e.injured?.[side]===true||typeof e.injured?.[side]==='string'&&e.injured[side].length)cues['match.ownInjury']=1;
   if(!['nc','double'].includes(x.outcome)&&((side==='w'&&!x.won)||(side==='f'&&x.won)))cues['match.lost']=1;
   const inference=reactionModel.evaluate(values,cues);
   return {id:actor.id,values,cues,scores:inference.scores,fired:inference.fired};
  };
  return {v:1,w:assess('w',x.w),f:assess('f',x.f)};
 }
 // Bounded adjustment to existing deterministic odds. Preserve the legacy
 // baseline for older saves and pre-agreed angles. Cooperation is NOT consent.
 function reactionAdjustment(st,plan){
  const p=st?.psychology;if(p?.v!==1)return 0;
  const unit=(side,key)=>Number.isFinite(p[side]?.scores?.[key])?(p[side].scores[key]-50)/100:0;
  if(plan==='handshake')return between(.34*unit('f','respect')-.18*unit('f','escalation'),-.18,.18);
  if(plan==='beatdown')return between(.24*unit('f','cooperation')-.16*unit('f','caution')-.12*unit('f','escalation')-.10*unit('w','caution'),-.18,.18);
  return 0;
 }
 function feudOf(wid,rid){
  const s=G.S,k=wid+':'+rid;
  return G.feud(wid,rid)||(s.feuds[k]={wid,rid,heat:0,matches:0,closed:false,since:G.abs()});
 }
 function heatFeud(wid,rid,d){const fd=feudOf(wid,rid);if(fd.closed&&d>0){fd.closed=false;fd.matches=Math.max(1,fd.matches);}fd.heat=clamp(fd.heat+d);return fd.heat;}
 function bond(a,b,d,kind,text,src){root.OfficeBonds?.shift?.(a,b,d,kind,text,src);}
 function remember(wid,kind,text,rid,shift,src){root.OfficeMemory?.remember?.(wid,kind,text,rid,shift,0,src);}
 // Names like “the Reverend” start some sentences; those sentences still start with a capital.
 const cap=t=>String(t).replace(/(^|[.!?]\s+|“)([a-z])/g,(m,a,b)=>a+b.toUpperCase());
 const fill=(t,x)=>cap(String(t).replace(/\{W\}/g,x.w?.short||'').replace(/\{F\}/g,x.f?.short||'').replace(/\{T\}/g,x.t?.short||'').replace(/\{P\}/g,x.p?.voice||''));
 const likesTrouble=p=>['aggressive','showman'].includes(p?.personality);

 // AB3: directed action -> reaction -> microphone graph. The graph describes
 // performed scenes, not hypothetical events. Only witnessed facts unlock new actions.
 // AB5/6 can add autonomous entry points and interactive continuation edges.
 const interference=k=>!!(k?.fired&&k.ok&&!k.ejected&&['runin','argue','distract','refbump'].includes(k.job));
 const injured=v=>v===true||typeof v==='string'&&v.length>0;
 // AB5: one optional autonomous opening, before the manager's decision.
 // An opening is an observed action, not a forced manager choice. No extra
 // physical attacks, invented entrants, or changes to the settled result.
 const openingIds=['respect_offer','rival_protest','own_assistance','corner_protest','official_space'];
 function openingCandidates(st,x){
  if(x.context?.v!==1||st?.psychology?.v!==1)return [];
  const e=x.context,score=(side,key)=>Number.isFinite(st.psychology[side]?.scores?.[key])?st.psychology[side].scores[key]/100:0;
  const choices=[],add=(id,side,actorId,weight,line)=>{if(weight>0)choices.push({id,side,actorId,weight,line});};
  const hurtW=injured(e.injured?.w),hurtF=injured(e.injured?.f);
  const foulCorner=interference(e.ringside)||interference(e.rivalCorner);
  // A sporting gesture should not casually excuse witnessed interference.
  if(!hurtW&&!hurtF&&!foulCorner&&x.stars>=3.5&&x.outcome==='booked'&&e.dirty?.w===false&&e.dirty?.f===false)
   add('respect_offer','f',x.f.id,.18*score('f','respect'),'{F} gestures for {W} to join them in acknowledging the crowd.');
  const v=st.psychology.f?.values||{},known=(k,test)=>Number.isFinite(v[k])&&test(v[k]);
  // Bond is already scaled 0..100 by psychology: 30 means a signed bond of -40.
  // High escalation alone is not a grievance after a normal loss.
  const hostility=known('bond',n=>n<=30)||known('feudHeat',n=>n>=65)||
   known('ego',n=>n>=85)&&(known('bond',n=>n<=40)||known('feudHeat',n=>n>=40));
  if(!hurtW&&!hurtF){
   const grievance=e.dirty?.w===true||interference(e.ringside);
   const bitterLoss=x.won&&x.outcome==='booked'&&hostility&&score('f','escalation')>.65;
   if(grievance||bitterLoss)
    add('rival_protest','f',x.f.id,(grievance?.24:.10)*score('f','escalation'),grievance?
     '{F} points at {W} and demands an explanation before leaving.':'{F} refuses to acknowledge the result and gestures angrily towards {W}.');
  }
  if(hurtW)
   add('own_assistance','w',x.w.id,.25*score('w','caution'),'{W} signals to the referee that they need assistance.');
  const corner=e.rivalCorner;
  if(!hurtW&&!hurtF&&interference(corner)&&corner.second&&corner.secondName&&corner.second!==x.w.id&&corner.second!==x.f.id)
   add('corner_protest','corner',corner.second,.18+.08*score('f','escalation'),corner.secondName+' calls towards the ring from ringside, defending their involvement.');
  if(hurtF)
   add('official_space','official',null,.26,'The referee asks both wrestlers to give the officials room to attend to {F}.');
  return choices;
 }
 function selectOpening(st,x){
  const choices=openingCandidates(st,x),sum=choices.reduce((n,o)=>n+o.weight,0);
  // Competing openings share a single budget: at least 65% have no event,
  // even when several triggers fire. Stable CID hash; no simulation RNG.
  const total=Math.min(.35,sum);
  let roll=hash(st.cid+'|ab5|opening');
  if(!sum||roll>=total)return null;
  roll=roll/total*sum;
  const selected=choices.find(o=>(roll-=o.weight)<0)||choices[choices.length-1];
  return {v:1,id:selected.id,side:selected.side,actorId:selected.actorId,line:fill(selected.line,x)};
 }
 function openingContext(st,x){return {...x,opening:st.intervention?.id||null};}
 function startOpening(st,x){
  const event=selectOpening(st,x);if(!event)return;
  st.intervention=event;
  st.log.push({side:'stage',who:null,text:event.line});
 }
 const legacyReactions={none:['pass'],handshake:['accepted','refused'],staredown:['engaged','flat'],
  beatdown:['worked','scuffle'],celebrate:['cheered','flat']};
 const angleGraph=Object.freeze({
  version:1,entry:'bell',exit:'mic',
  actions:Object.freeze({
   join_respect:{label:'Join the opponent in acknowledging the crowd',hint:'Answer their gesture without demanding physical contact.',tags:['Respect'],guard:x=>x.opening==='respect_offer',
    line:'{W} joins {F} in acknowledging the crowd.',reactions:[
     {id:'shared_respect',drive:'respect',line:'{F} applauds as both wrestlers turn towards the audience.',bond:8,morale:2},
     {id:'brief_respect',drive:'caution',line:'{F} gives a brief nod and steps away.',bond:3}]},
   answer_protest:{label:'Answer the opponent’s protest',hint:'Respond to their grievance without physical contact.',tags:['Rivalry'],guard:x=>x.opening==='rival_protest',
    line:'{W} stops and answers {F} from a distance.',reactions:[
     {id:'hear_explanation',drive:'respect',line:'{F} hears them out and backs away.',bond:2},
     {id:'reject_explanation',drive:'escalation',line:'{F} shakes their head and continues the argument.',bond:-3,feud:6}]},
   address_corner:{label:'Respond to the rival corner',hint:'Answer the ringside protest; do not enter the aisle.',tags:['Rivalry'],guard:x=>x.opening==='corner_protest',
    line:'{W} answers the protest from inside the ring.',reactions:[
     {id:'corner_ignored',drive:'caution',line:'{F} gestures for their second to leave it there.',bond:1},
     {id:'corner_backed',drive:'escalation',line:'{F} backs their second and keeps arguing.',bond:-3,feud:6}]},
   give_space:{label:'Give the officials room',hint:'Let the officials attend to the injured wrestler.',tags:['Care'],guard:x=>['own_assistance','official_space'].includes(x.opening),
    line:'{W} signals that the officials should take over.',reactions:[
     {id:'officials_attend',drive:'caution',line:'The officials attend to the injured wrestler. {F} gives them room.',trust:1},
     {id:'quiet_exit',drive:'respect',line:'{F} steps away as the officials continue their assessment.',bond:2}]},
   acknowledge:{label:'Applaud the opponent',hint:'Recognise a good match without demanding a handshake.',tags:['Respect','Bond'],guard:x=>x.stars>=3&&x.outcome==='booked'&&x.context.dirty?.w!==true,
    line:'{W} steps back and applauds {F}.',reactions:[
     {id:'reciprocate',drive:'respect',line:'{F} nods and applauds in return.',bond:7,morale:2},
     {id:'dismiss',drive:'escalation',line:'{F} turns away without applauding.',bond:-2,feud:3}]},
   check_injury:{label:'Check on the injured opponent',hint:'Call the officials over and give the opponent space.',tags:['Care','No contact'],guard:x=>injured(x.context.injured?.f),
    line:'{W} asks the referee to check on {F} and takes a step back.',reactions:[
     {id:'appreciate',drive:'respect',line:'{F} acknowledges the gesture as the officials attend to them.',bond:8,trust:1},
     {id:'space',drive:'caution',line:'{F} signals for space. The officials take over.',bond:2}]},
   apologise:{label:'Apologise for the cheap shot',hint:'Own what happened rather than trying to justify it.',tags:['Respect','Feud may cool'],guard:x=>x.context.dirty?.w===true,
    line:'{W} gestures an apology for the cheap shot.',reactions:[
     {id:'accept_apology',drive:'respect',line:'{F} accepts the gesture and backs away.',bond:8,feud:-5},
     {id:'reject_apology',drive:'escalation',line:'{F} shakes their head. An apology is not enough tonight.',bond:-3,feud:5}]},
   protest:{label:'Ask the referee to explain the finish',hint:'Challenge the circumstances without changing the recorded result.',tags:['Public protest','Risk'],guard:x=>['dq','nc','double'].includes(x.outcome)||x.context.dirty?.f===true||interference(x.context.rivalCorner),
    line:'{W} asks the referee to explain the decision.',reactions:[
     {id:'disengage',drive:'caution',line:'{F} leaves the discussion to the referee. The decision stands.',morale:1},
     {id:'argue_back',drive:'escalation',line:'{F} argues their side of it. The referee refuses to reopen the match.',feud:7,bond:-3}]},
   confront_corner:{label:'Call out the interference',hint:'Point out the rival corner’s actions without starting another fight.',tags:['Rivalry','No contact'],guard:x=>interference(x.context.rivalCorner),
    line:'{W} points towards the aisle, protesting the rival corner’s interference.',reactions:[
     {id:'defend_corner',drive:'cooperation',line:'{F} gestures towards their corner in defence of what happened.',feud:8,bond:-4},
     {id:'distance_corner',drive:'respect',line:'{F} waves away the argument and refuses to defend the interference.',bond:3,feud:2}]}
  })
 });
 function graphOptions(x){
  if(x.context?.v!==1)return [];
  return Object.entries(angleGraph.actions).filter(([,n])=>n.guard(x)).map(([id,n])=>({id,label:n.label,hint:n.hint,tags:n.tags.slice()}));
 }
 function graphEdges(){
  const responseOpenings={join_respect:['respect_offer'],answer_protest:['rival_protest'],address_corner:['corner_protest'],give_space:['own_assistance','official_space']};
  const normal=[...Object.keys(legacyReactions),...Object.keys(angleGraph.actions).filter(k=>!responseOpenings[k])];
  return [
   ...openingIds.flatMap(id=>[[angleGraph.entry,'opening:'+id],...[...normal,...Object.keys(responseOpenings).filter(k=>responseOpenings[k].includes(id))].map(k=>['opening:'+id,k])]),
   ...Object.entries(legacyReactions).flatMap(([id,rs])=>[[angleGraph.entry,id],...rs.flatMap(r=>[[id,id+':'+r],[id+':'+r,angleGraph.exit]])]),
   ...Object.entries(angleGraph.actions).flatMap(([id,n])=>[...(responseOpenings[id]?[]:[[angleGraph.entry,id]]),...n.reactions.flatMap(r=>[[id,id+':'+r.id],[id+':'+r.id,angleGraph.exit]])]),
   ...followEdges()
  ];
 }
 // AB6: only unresolved, nonphysical confrontations merit another choice.
 // A single continuation is the hard pacing limit for this graph version.
 const unresolved=new Set(['reject_apology','argue_back','defend_corner','reject_explanation','corner_backed']);
 const followNodes={
  disengage:{label:'Leave it there',hint:'End the confrontation without conceding the point.',tags:['Safe'],line:'{W} steps away and leaves the argument behind.',reactions:[
   {id:'ended',line:'The referee ushers both wrestlers apart.'}]},
  defuse:{label:'Try to calm things down',hint:'Give the opponent an opportunity to let it go.',tags:['Bond','Feud may cool'],line:'{W} lowers their hands and offers to leave the argument there.',speech:'Let us leave it there for tonight.',reactions:[
   {id:'calmed',drive:'respect',line:'{F} accepts the gesture and backs away.',bond:4,feud:-4,speech:'All right. Leave it there.'},
   {id:'unresolved',drive:'escalation',line:'{F} refuses to let the matter drop, but the referee separates them.',feud:2,speech:'This is not settled.'}]},
  press:{label:'Stand your ground',hint:'Insist on your position; risk making the dispute personal.',tags:['Feud heat','Bond risk'],line:'{W} stands their ground and refuses to retract their point.',speech:'I stand by what I said.',reactions:[
   {id:'backs_off',drive:'caution',line:'{F} backs away rather than prolong the dispute.',feud:3},
   {id:'heated',drive:'escalation',line:'{F} answers angrily. The referee ends the exchange.',bond:-4,feud:7,trust:-1,speech:'We are not finished.'}]},
  challenge:{label:'Settle it in another match',hint:'Turn the argument towards a future match. A formal callout still needs the microphone.',tags:['Rematch story'],line:'{W} gestures back towards the ring, proposing another match.',speech:'Let us settle this in another match.',reactions:[
   {id:'interested',drive:'cooperation',line:'{F} points back at the ring in agreement.',feud:5,speech:'Another match, then.'},
   {id:'rebuffed',drive:'escalation',line:'{F} dismisses the suggestion and turns away.',bond:-2,feud:2,speech:'Not on your terms.'}]}
 };
 function followEligible(st,x){
  return st.psychology?.v===1&&st.angle?.path?.length>2&&unresolved.has(st.angle.reaction)&&
   !injured(x.context?.injured?.w)&&!injured(x.context?.injured?.f)&&!st.follow;
 }
 function followOptions(st){
  if(st?.stage!=='follow'||st.follow?.v!==1||st.follow.choice)return [];
  return Object.entries(followNodes).map(([id,n])=>({id,label:n.label,hint:n.hint,tags:n.tags.slice()}));
 }
 function followEdges(){
  const starts=Object.entries(angleGraph.actions).flatMap(([id,n])=>n.reactions.filter(r=>unresolved.has(r.id)).map(r=>id+':'+r.id));
  return [...starts.map(s=>[s,'follow']),...Object.entries(followNodes).flatMap(([id,n])=>[['follow','follow:'+id],...n.reactions.flatMap(r=>[['follow:'+id,'follow:'+id+':'+r.id],['follow:'+id+':'+r.id,angleGraph.exit]])])];
 }
 function beginFollow(st,x){
  if(!followEligible(st,x))return;
  st.follow={v:1,from:st.angle.reaction,choice:null,reaction:null};
  st.angle.path=[...st.angle.path.slice(0,-1),'follow'];
  st.stage='follow';
 }
 function continueAngle(st,id){
  if(!followOptions(st).some(o=>o.id===id))return false;
  const x=ctxOf(st.c,st.fin),n=followNodes[id];if(!x.w||!x.f||!x.p)return false;
  const scores=st.psychology?.f?.scores||{},weight=r=>Number.isFinite(scores[r.drive])?Math.max(10,scores[r.drive]):50;
  let roll=hash(st.cid+'|ab6|'+st.follow.from+'|'+id)*n.reactions.reduce((sum,r)=>sum+weight(r),0);
  const r=n.reactions.find(r=>(roll-=weight(r))<0)||n.reactions[n.reactions.length-1];
  const line=text=>st.log.push({side:'stage',who:null,text:fill(text,x)});
  const speech=(side,key,stance,body)=>{
   if(!body)return;
   const l=dialogueLine(st,side,key,stance,body);
   if(l)st.log.push({side,who:side==='w'?x.w.short:x.f.short,...l});
   else st.log.push({side,who:side==='w'?x.w.short:x.f.short,text:cap('“'+body+'”')});
  };
  const add=(text,tone)=>st.cons.push({text:cap(text),tone});
  st.follow={...st.follow,choice:id,reaction:r.id};
  st.angle.path=[...st.angle.path,'follow:'+id,'follow:'+id+':'+r.id,angleGraph.exit];
  line(n.line);speech('w','follow_'+id,id==='defuse'?'accept':'counter',n.speech);
  line(r.line);speech('f','follow_'+r.id,['calmed','interested'].includes(r.id)?'accept':'counter',r.speech);
  if(r.bond){bond(x.w.id,x.f.id,r.bond,r.bond>0?'respect':'grudge',fill(r.line,x),st.cid+':after:follow');add('Further bond '+(r.bond>0?'+':'')+r.bond+'.',Math.sign(r.bond));}
  if(r.feud){const fd=G.feud(x.w.id,x.f.id);if(r.feud>0||fd&&!fd.closed){const h=heatFeud(x.w.id,x.f.id,r.feud);add('Follow-up feud heat '+h+'.',Math.sign(r.feud));}}
  if(r.trust){x.p.trust=clamp(x.p.trust+r.trust);add(x.p.name+' trust '+r.trust+'.',Math.sign(r.trust));}
  st.stage='mic';recordEvidence(st);G.save();return true;
 }
 function graphTrace(plan,reaction,st){return [angleGraph.entry,...(st?.intervention?['opening:'+st.intervention.id]:[]),plan,plan+':'+reaction,angleGraph.exit];}
 function playGraph(st,x){
  const node=Object.prototype.hasOwnProperty.call(angleGraph.actions,st.plan)?angleGraph.actions[st.plan]:null;
  if(!node||x.context?.v!==1||!node.guard(x))return false;
  const scores=st.psychology?.f?.scores||{};
  const weight=r=>Number.isFinite(scores[r.drive])?Math.max(10,scores[r.drive]):50;
  const total=node.reactions.reduce((n,r)=>n+weight(r),0);
  let roll=hash(st.cid+'|ab3|'+st.plan)*total;
  const reaction=node.reactions.find(r=>(roll-=weight(r))<0)||node.reactions[node.reactions.length-1];
  st.angle={plan:st.plan,ok:reaction.bond>=0||(reaction.bond==null&&reaction.feud==null),reaction:reaction.id,path:graphTrace(st.plan,reaction.id,st)};
  for(const text of [node.line,reaction.line])st.log.push({side:'stage',who:null,text:fill(text,x)});
  const add=(text,tone=0)=>st.cons.push({text:cap(text),tone});
  const source=st.cid+':after';
  if(reaction.bond){
   bond(x.w.id,x.f.id,reaction.bond,reaction.bond>0?'respect':'grudge',fill(reaction.line,x),source);
   add('Bond '+(reaction.bond>0?'+':'')+reaction.bond+'.',Math.sign(reaction.bond));
  }
  if(reaction.feud){
   const fd=G.feud(x.w.id,x.f.id);
   if(reaction.feud>0||fd&&!fd.closed){const heat=heatFeud(x.w.id,x.f.id,reaction.feud);add('Feud heat '+heat+'.',0);}
  }
  if(reaction.morale){x.w.morale=clamp(x.w.morale+reaction.morale);add(x.w.short+' morale +'+reaction.morale+'.',1);}
  if(reaction.trust){x.p.trust=clamp(x.p.trust+reaction.trust);add(x.p.name+' trust +'+reaction.trust+'.',1);}
  return true;
 }
 // Older angles retain their original resolver; record their actual branch in
 // the same graph when a new scene uses them.
 function performAngle(st,x){
  if(playGraph(st,x))return;
  if(st.plan!=='none')playAngle(st,x);
  if(x.context?.v!==1)return;
  const rs=legacyReactions[st.plan];if(!rs)return;
  const reaction=st.plan==='none'?'pass':rs[st.angle?.ok?0:1];
  if(st.angle){st.angle.reaction=reaction;st.angle.path=graphTrace(st.plan,reaction,st);}
 }

 // What the angle does. Each returns the lines it plays and the consequences, and changes the save once.
 function playAngle(st,x){
  const plan=st.plan,id=st.cid,out=st.cons,log=st.log;
  const add=(text,tone=0)=>out.push({text:cap(text),tone});
  const line=(side,text)=>log.push({side,who:side==='w'?x.w.short:side==='f'?x.f.short:null,text:fill(text,x)});
  const b=root.OfficeBonds?.score?.(x.w.id,x.f.id)||0;
  if(plan==='handshake'){
   let chance=.58+b/220+(x.clean?.12:-.12)-(x.f.ego-60)/220+(x.stars>=3.5?.1:0)-(x.finish==='win_dirty'?.25:0);
   chance=between(chance+reactionAdjustment(st,plan),.08,.94);
   const ok=hash(id+'|shake')<chance;st.angle={plan,ok,chance:Math.round(chance*100)};
   line('stage','{W} walks across the ring and holds out a hand.');
   if(ok){
    line('stage',x.won?'{F} looks at it for a long second, then shakes it. The crowd stands up for both of them.':'{F} takes the hand and raises {W}’s arm. Half the hall applauds the loser.');
    bond(x.w.id,x.f.id,12,'respect','Shook hands after the bell.',id+':after');
    x.w.morale=clamp(x.w.morale+3);add(x.w.short+' and '+x.f.short+' shook hands. Bond +12, morale +3.',1);
    const fd=G.feud(x.w.id,x.f.id);if(fd&&!fd.closed){fd.heat=clamp(fd.heat-8);add('The feud with '+x.f.short+' cools a little (heat '+fd.heat+').',0);}
    if(!likesTrouble(x.p)){x.p.trust=clamp(x.p.trust+2);add(x.p.voice+' liked that. '+x.p.name+' trust +2.',1);}
    if(x.stars>=3){G.S.rep=clamp(G.S.rep+1);add('Reputation +1.',1);}
    remember(x.w.id,'respect',x.w.short+' remembers shaking '+x.f.short+'’s hand after the bell.',x.f.id,2,id+':after');
   }else{
    line('f','{F} looks at the hand, looks at the crowd, and walks out under the bottom rope.');
    bond(x.w.id,x.f.id,-6,'snub','Refused a handshake after the bell.',id+':after');
    const h=heatFeud(x.w.id,x.f.id,10);x.w.heat=clamp(x.w.heat+2);
    add(x.f.short+' refused the handshake. The crowd is behind '+x.w.short+' (heat +2); feud heat '+h+'.',0);
    remember(x.w.id,'snub',x.w.short+' remembers '+x.f.short+' leaving them standing there with a hand out.',x.f.id,-1,id+':after');
   }
  }else if(plan==='staredown'){
   st.angle={plan,ok:x.stars>=2};
   line('stage','The bell has gone, and neither of them moves. {W} and {F} stand nose to nose while the referee pleads with them.');
   if(x.stars>=2){
    const h=heatFeud(x.w.id,x.f.id,12);x.w.heat=clamp(x.w.heat+1);
    line('stage','Security comes down the aisle. Nobody in the building is sitting down.');
    add('The stare-down says it is not finished. Feud heat '+h+'; a rematch offer is likelier.',1);
   }else{
    const h=heatFeud(x.w.id,x.f.id,4);
    line('stage','Somebody in the front row checks their watch. The match did not earn this.');
    add('Nobody was invested enough to care. Feud heat '+h+'.',-1);
   }
  }else if(plan==='beatdown'){
   let chance=x.f.pro/100*.9+(b>-35?.1:-.2)+(x.f.ego>=80?-.1:0);chance=between(chance+reactionAdjustment(st,plan),.1,.95);
   const worked=hash(id+'|jump')<chance;st.angle={plan,ok:worked,chance:Math.round(chance*100)};
   line('stage','{F} turns to leave. {W} hits them from behind.');
   if(worked){
    line('stage','It looks horrible and nobody is hurt. {F} sells it all the way to the back, clutching the ribs. The booing goes on for a minute.');
    const h=heatFeud(x.w.id,x.f.id,20);x.w.heat=clamp(x.w.heat+4);
    bond(x.w.id,x.f.id,-6,'angle','An attack after the bell, worked well.',id+':after');
    add('The attack after the bell got real heat: '+x.w.short+' heat +4, feud heat '+h+'.',1);
    const dt=likesTrouble(x.p)?3:-4;x.p.trust=clamp(x.p.trust+dt);
    add(dt>0?x.p.voice+' loved it. '+x.p.name+' trust +3.':x.p.voice+' does not want that on the show. '+x.p.name+' trust −4.',Math.sign(dt));
   }else{
    line('f','{F} was not told. {F} turns round swinging, and suddenly it is not a show.');
    line('stage','Six people come out of the back to pull them apart. It takes a while.');
    const h=heatFeud(x.w.id,x.f.id,25);
    bond(x.w.id,x.f.id,-25,'grudge','Jumped after the bell without warning.',id+':after');
    x.p.trust=clamp(x.p.trust-6);G.S.cash-=100;x.w.morale=clamp(x.w.morale-3);
    add(x.f.short+' had not agreed to it. A real scuffle: £100 fine, '+x.p.name+' trust −6, morale −3. Feud heat '+h+'.',-1);
    remember(x.w.id,'grievance',x.w.short+' remembers the fight with '+x.f.short+' that was not part of the show.',x.f.id,-3,id+':after');
   }
  }else if(plan==='celebrate'){
   const hot=x.stars>=3&&x.crowd>=55;st.angle={plan,ok:hot};
   line('stage','{W} goes round the barrier, slapping every hand they can reach.');
   if(hot){x.w.heat=clamp(x.w.heat+3);x.w.morale=clamp(x.w.morale+4);line('stage','The crowd will not let them go. Somebody hands over a scarf.');add(x.w.short+' soaked it up: heat +3, morale +4.',1);}
   else{x.w.morale=clamp(x.w.morale+1);line('stage','About half the hall is already queuing at the bar.');add('A lap of honour to a half-empty hall. Morale +1.',0);}
  }
 }

 // ---------------------------------------------------------------------------------------------
 // The microphone.
 const SAY={
  gloat:{grand:'“Did you see it? Of course you saw it. You will be telling your grandchildren, and they will not believe you.”',
   gruff:'“Told you. Didn’t I tell you? I told you.”',eager:'“I WON! Did everybody see? Can we play it again? Is there a replay? There should be a replay!”',
   stoic:'“That is what happens.”',precise:'“As predicted. Down to the minute, roughly.”',earnest:'“I’m sorry, I know I shouldn’t, but that was BRILLIANT and I was BRILLIANT.”',
   sermon:'“It was written. I merely read it aloud.”',slippery:'“Nobody thought I could do it. Except me. And my accountant, who had a bet on.”'},
  credit:{grand:'“{F}. A worthy opponent. Second-best person in this ring tonight, and by some distance the second-best ever.”',
   gruff:'“{F}’s tough. Tougher than I thought. That’s all.”',eager:'“{F} was AMAZING. Give it up for {F}! Come on! LOUDER!”',
   stoic:'“{F} made me work. Respect.”',precise:'“{F} won three exchanges out of five. Nobody else has managed two.”',earnest:'“I couldn’t have done that without {F}. I mean that.”',
   sermon:'“{F} walked through the fire with me. Few do.”',slippery:'“{F}, good match. No, really. I’ll say it again when the cameras are off.”'},
  concede:{grand:'“Tonight belonged to {F}. Tonight. Make a note of the date.”',gruff:'“Better wrestler won. Tonight.”',
   eager:'“Okay. Okay! They got me. I’m going to watch the tape eleven times.”',stoic:'“I lost. I’ll be back.”',
   precise:'“I made two mistakes. I will make none next time.”',earnest:'“{F} was better tonight. I’m gutted, but they were.”',
   sermon:'“Even the righteous fall. The righteous also get up.”',slippery:'“Fair’s fair. This time.”'},
  excuse:{grand:'“A robbery. A heist. They will make a film about it, and I shall be the hero.”',gruff:'“Ref was looking the other way. Ask anyone.”',
   eager:'“That wasn’t fair! Was that fair? That wasn’t fair! Everybody saw that, right?”',stoic:'“Everybody saw what happened.”',
   precise:'“The count was 2.4 seconds. I have it on my watch.”',earnest:'“I don’t want to complain. But that wasn’t right, was it?”',
   sermon:'“The serpent always strikes when the shepherd looks away.”',slippery:'“I know cheating when I see it. Professionally.”'},
  callout:{grand:'“And now a word for {T}. I am coming. Tell your family. Tell the papers.”',gruff:'“{T}. You’re next.”',
   eager:'“{T}! Yeah, you! I want you! Next week! Or the week after, I’m flexible!”',stoic:'“{T}. Whenever you like.”',
   precise:'“{T}: you have avoided me for eleven weeks. I have counted.”',earnest:'“{T}, I’d really like a match with you. If that’s alright. I think I’ve earned it.”',
   sermon:'“{T}. Your day of reckoning has been pencilled in.”',slippery:'“{T}. Let’s you and me make some money. Mostly me.”'},
  // v0.3.24 Demands, made in front of the promoter's own crowd.
  title:{grand:'“{P}, I know you are listening. Put the belt on the line. Against me. Next week. The posters write themselves.”',
   gruff:'“{P}. Title. Me. Next week.”',eager:'“{P}! Can I have a title match? Please? I’ll be SO good. I’ll bring snacks!”',
   stoic:'“I’ve earned a shot at the belt. {P} knows it.”',precise:'“{P}: I have the record, the ranking and the crowd. All I lack is the title match.”',
   earnest:'“I don’t usually ask for things. But {P}, I think I’ve earned a title shot. I really do.”',
   sermon:'“{P}, the gold is calling. It has been calling for weeks. Answer it.”',slippery:'“{P}, give me the title match and I’ll give you a sold-out building. Probably.”'},
  slot:{grand:'“And another thing, {P}. Third on the card? Me? I am a main event that has been misfiled.”',
   gruff:'“{P}. Stop hiding me on the undercard.”',eager:'“{P}, next time can I go on later? When everyone’s here? My mum’s coming!”',
   stoic:'“Put me higher on the card, {P}. I’ll show you why.”',precise:'“{P}: the crowd was loudest for this match. The card should reflect it.”',
   earnest:'“{P}, I’d love a bigger spot. I think I’m ready. Sorry. I am ready.”',
   sermon:'“The last shall be first, {P}. Starting with me.”',slippery:'“{P}, move me up the card. Just a bit. Nobody will notice. Except everybody.”'},
  rematch:{grand:'“{F}. Again. Same town, bigger hall.”',gruff:'“{F}. Again.”',eager:'“{F}, one more go! Please! Best of three! Best of five!”',
   stoic:'“{F}. We’re not done.”',precise:'“{F}: the sample size is too small. Again.”',earnest:'“{F}, can we do it again? I know I can beat you.”',
   sermon:'“{F}. The second verse will be different.”',slippery:'“{F}, rematch. Double or nothing. I’ll bring the nothing.”'}
 };
 function targets(st){
  const s=G.S,x=ctxOf(st.c,st.fin),out=[];if(!x.w||!x.f||!x.p)return out;
  const div=D.divisionOf(x.w.id),rank=T?.promotionRank?.(x.p.id,div)||[];
  const pool=rank.filter(r=>!r.owned&&T.contracted?.(s,r.id)&&r.id!==x.f.id);
  const champ=pool.find(r=>r.champion);if(champ)out.push({id:champ.id,why:'the '+x.p.name+' champion',champion:true,row:champ});
  const me=rank.findIndex(r=>r.id===x.w.id);
  const foes=pool.filter(r=>!r.champion&&((root.OfficeBonds?.score?.(x.w.id,r.id)||0)<=-20||(G.feud(x.w.id,r.id)?.heat||0)>=25));
  if(foes[0])out.push({id:foes[0].id,why:'an old score to settle',row:foes[0]});
  const above=pool.filter((r,i)=>!r.champion&&!out.some(o=>o.id===r.id)&&rank.indexOf(r)<(me<0?rank.length:me)).pop();
  if(above)out.push({id:above.id,why:'just above '+x.w.short+' on the card',row:above});
  return out.slice(0,2).map(o=>({...o,rank:rank.findIndex(r=>r.id===o.id)}));
 }
 function micOptions(st){
  if(st.stage!=='mic')return [];
  const x=ctxOf(st.c,st.fin),opts=[];
  if(x.won){
   opts.push({id:'gloat',label:'Rub it in',hint:'Loud, cocky, and a little cruel. The crowd will love or loathe it.',tags:['Heat ▲','Feud heat ▲','Bond ▼']});
   opts.push({id:'credit',label:'Give '+x.f.short+' credit',hint:'Gracious in victory. Promoters like it.',tags:['Builds a bond','Cools the feud']});
  }else if(x.outcome!=='nc'){
   opts.push({id:'concede',label:'Take the loss like a pro',hint:'No excuses. It softens the blow.',tags:['Morale ▲','Builds a bond']});
   opts.push({id:'excuse',label:'Blame the finish',hint:x.dirty?'They have a point: it was not clean.':'It was clean. The crowd saw it was clean.',tags:x.dirty?['Feud heat ▲','Heat ▲']:['Unlikely','Heat ▼ if it fails']});
  }
  opts.push({id:'rematch',label:'Demand a rematch with '+x.f.short,hint:x.won?'Odd, after a win, unless there is real heat between them.':'The obvious ask. Promoters like a story with a second chapter.',tags:['Gamble','Rematch offer if it lands']});
  for(const t of targets(st)){
   const T0=who(t.id);if(!T0)continue;
   opts.push({id:'call:'+t.id,label:'Call out '+T0.short,hint:T0.name+', '+t.why+'.'+(t.champion?' Aim high and miss, and the promoter notices.':''),tags:['Gamble',t.champion?'Title picture':'A new match offer']});
  }
  // v0.3.24 Demands: a title shot, or a better place on the card, asked for in public.
  const dm=demandsFor(st);
  if(dm.title)opts.push({id:'demand:title',label:'Demand a title shot',hint:'Call on '+x.p.voice+' to put the '+dm.title.name+' on the line, in front of everyone. '+x.p.voice+(['traditional','cold'].includes(x.p.personality)?' does not like being put on the spot.':' loves this sort of thing.'),tags:['Gamble','Title match if it lands','Trust ▼ if it flops']});
  if(dm.slot)opts.push({id:'demand:slot',label:'Demand a bigger spot',hint:'Tell '+x.p.voice+' that '+x.w.short+' belongs higher up the card than '+D.SLOTS[dm.slot].name.toLowerCase()+'.',tags:['Gamble','Up the card if it lands']});
  opts.push({id:'walk',label:'Say nothing',hint:'Hand the microphone back and walk.',tags:['Safe']});
  return opts;
 }
 // What this wrestler could demand at this promotion tonight.
 function demandsFor(st){
  const s=G.S,x=ctxOf(st.c,st.fin);if(!x.w||!x.p||!T?.promotionRank)return {};
  const div=D.divisionOf(x.w.id),rank=T.promotionRank(x.p.id,div),i=rank.findIndex(r=>r.id===x.w.id),me=rank[i];
  const out={rank:i};
  const holder=T.title?.(x.p.id,div)?.holder;
  const busy=[...s.offers,...s.card,...s.futureBookings].some(o=>o.title?.pid===x.p.id&&o.title?.div===div);
  const claimed=root.OfficeProgrammes?.claims?.(s,s.territory)?.belts?.has(x.p.id+':'+div);
  // A main-event name is offered the title match anyway; the demand is for somebody pushing in from below.
  if(holder&&holder!==x.w.id&&!G.W(holder)&&!busy&&!claimed&&me&&me.slot!=='main'&&(i<=4||(x.won&&x.stars>=3.5)))out.title={holder,name:D.belt?.(x.p.id,div)?.name||(x.p.name+' title')};
  if(me&&me.slot!=='main')out.slot=me.slot;
  return out;
 }
 const DEMAND_MOOD={showman:-12,aggressive:-4,traditional:6,cold:14};
 function demandChance(st,kind){
  const x=ctxOf(st.c,st.fin),dm=demandsFor(st);
  const score=x.w.mic*.5+x.w.heat*.3+(x.stars-2.5)*8+(x.won?8:-6)+(kind==='title'&&dm.rank>=0?Math.max(0,4-dm.rank)*4:0);
  const need=(kind==='title'?58:48)+(DEMAND_MOOD[x.p.personality]||0);
  return between((score-need+50)/100,.06,.88);
 }
 // How likely a callout is to land: mic skill and heat against how far up the card the target sits.
 function callChance(st,targetId,rematch){
  const x=ctxOf(st.c,st.fin),t=targets(st).find(o=>o.id===targetId);
  const score=x.w.mic*.55+x.w.heat*.3+(x.stars-2.5)*9+(x.won?8:-4)+(st.angle?.ok&&['staredown','beatdown'].includes(st.plan)?8:0);
  const fh=G.feud(x.w.id,rematch?x.f.id:targetId)?.heat||0;
  let need=46+(t?.champion?16:0)+(t&&t.rank<=2?8:0)-fh/6;
  if(rematch)need=x.won?54:40;
  return between((score-need+50)/100,.08,.9);
 }
 // AB4: share the existing character-bank loader and reviewed excerpt
 // contract. A pre-match claim is not a post-match fact. Only reviewed,
 // standalone acknowledgements / neutral interjections may cross domains.
 function attachDialogue(st,banks){
  if(!st||!['angle','mic'].includes(st.stage)||st.dialogue||!root.OfficePlanningDialogue)return false;
  const x=ctxOf(st.c,st.fin);
  if(!x.w||!x.f)return false;
  const capture=w=>root.OfficePlanningDialogue.capture(w,banks||[],2);
  st.dialogue={v:1,w:capture(x.w),f:capture(x.f),used:[],
   recent:(G.S?.history||[]).filter(h=>h.cid!==st.cid).slice(-12).flatMap(h=>(h.after?.log||[]).map(l=>l.lineId).filter(Boolean))};
  return true;
 }
 // Use shared character delivery families when a reviewed bank fragment
 // is unavailable. Never substitute another worker's bank.
 const neutralLeads={precise:['Let me be clear.','For the record.','One point.'],direct:['Right.','Listen.','Here it is.'],quiet:['One thing.','Just this.','A few words.'],warm:['I mean this.','From me to you.','Let me say this.'],theatrical:['Hear me.','Take note.','Ladies and gentlemen.'],energetic:['Right, listen!','Come on!','Hear this!'],wry:['Well, then.','So there it is.','Funny, that.']};
 const micBodies={
  gloat:x=>'That result is mine. Let everybody remember it.',
  credit:x=>x.f.short+' deserves credit for that match.',
  concede:x=>'Tonight was not mine. I accept the result.',
  excuse:x=>'I have a problem with that finish.',
  title:x=>x.p.voice+', I want a shot at the title.',
  slot:x=>x.p.voice+', I want a bigger place on the card.',
  rematch:x=>'I want another match with '+x.f.short+'.',
  callout:x=>x.t.short+', I want a match with you.'
 };
 function dialogueLine(st,side,key,stance,body){
  const d=st?.dialogue,actor=d?.[side];
  if(d?.v!==1||!actor||!body||actor.id!==(side==='w'?st.c.wid:st.c.rid))return null;
  const used=d.used||[],recent=d.recent||[];
  const eligible=(actor.fragments||[]).filter(r=>r.stances?.includes(stance)&&
   (stance==='accept'||r.stances.includes('accept')&&r.stances.includes('counter'))&&
   !used.includes(r.id)&&!used.includes('prefix:'+r.text));
  const fresh=eligible.filter(r=>!recent.includes(r.id)),pool=fresh.length?fresh:eligible;
  const pick=pool.slice().sort((a,b)=>hash(st.cid+'|ab4|'+side+'|'+key+'|'+a.id)-hash(st.cid+'|ab4|'+side+'|'+key+'|'+b.id)||a.id.localeCompare(b.id))[0];
  const leads=neutralLeads[actor.family]||neutralLeads.direct;
  const variants=leads.map((text,i)=>({text,id:'after.family.'+actor.family+'.'+i})).filter(l=>!used.includes('prefix:'+l.text));
  const newLeads=variants.filter(l=>!recent.includes(l.id)),fallback=(newLeads.length?newLeads:variants).slice().sort((a,b)=>hash(st.cid+'|ab8|'+side+'|'+key+'|'+a.id)-hash(st.cid+'|ab8|'+side+'|'+key+'|'+b.id))[0];
  const prefix=pick?.text||fallback?.text||'';
  const lineId=pick?.id||fallback?.id||'after.body.'+actor.id+'.'+key;
  d.used=used.concat(lineId,...(prefix?['prefix:'+prefix]:[]));
  return {text:cap('“'+(prefix?prefix+' ':'')+body+'”'),lineId,source:pick?.source||'identity:'+actor.identitySource};
 }
 const reactionSpeech={
  reciprocate:['accept','Good match.'],dismiss:['counter','I have nothing more to say.'],
  appreciate:['accept','Thank you.'],accept_apology:['accept','We can leave it there.'],
  reject_apology:['counter','Not tonight.'],argue_back:['counter','The decision stands.'],
  defend_corner:['counter','I stand by my corner.'],distance_corner:['counter','I am not defending that.'],
  shared_respect:['accept','Good work tonight.'],brief_respect:['accept','Thank you.'],
  hear_explanation:['accept','I hear you.'],reject_explanation:['counter','That does not settle it.'],
  corner_ignored:['counter','Leave it there.'],corner_backed:['counter','I stand by my corner.'],
  accepted:['accept','Respect.'],refused:null
 };
 function speakReaction(st,x){
  const reaction=st.angle?.reaction,entry=reactionSpeech[reaction];
  if(!entry)return;
  const l=dialogueLine(st,'f',reaction,entry[0],entry[1]);
  if(l)st.log.push({side:'f',who:x.f.short,...l});
 }
 function sayLine(kind,x){return fill(SAY[kind][voice(x.w)]||SAY[kind].stoic,x);}
 function speak(st,id){
  if(st.stage!=='mic'||!micOptions(st).some(o=>o.id===id))return false;
  const x=ctxOf(st.c,st.fin),out=st.cons,log=st.log,cid=st.cid;
  const add=(text,tone=0)=>out.push({text:cap(text),tone});
  const line=(side,text)=>log.push({side,who:side==='w'?x.w.short:side==='f'?x.f.short:null,text:cap(text)});
  const say=kind=>{const l=dialogueLine(st,'w',kind,['credit','concede'].includes(kind)?'accept':'counter',micBodies[kind]?.(x));
   if(l)log.push({side:'w',who:x.w.short,...l});else line('w',sayLine(kind,x));};
  const roll=k=>hash(cid+'|mic|'+k);
  const lands=(base)=>roll(id)<between(base+(x.w.mic-60)/120,.1,.95);
  st.said=id;
  if(id==='walk'){line('stage',x.w.short+' hands the microphone back to the ring announcer and walks up the aisle.');}
  else if(id==='gloat'){say('gloat');
   if(lands(.62)){const h=heatFeud(x.w.id,x.f.id,6);x.w.heat=clamp(x.w.heat+3);bond(x.w.id,x.f.id,-6,'gloat','Rubbed it in after the match.',cid+':mic');line('stage','The booing is the loudest it has been all night. That is the point.');add(x.w.short+' rubbed it in: heat +3, feud heat '+h+'.',1);}
   else{line('stage','It falls flat. Somebody laughs, and not with them.');x.w.morale=clamp(x.w.morale-2);add('The gloating fell flat. Morale −2.',-1);}}
  else if(id==='credit'){say('credit');bond(x.w.id,x.f.id,6,'respect','Gave credit on the microphone.',cid+':mic');
   const fd=G.feud(x.w.id,x.f.id);if(fd&&!fd.closed)fd.heat=clamp(fd.heat-4);
   if(x.stars>=3){G.S.rep=clamp(G.S.rep+1);add(x.w.short+' gave '+x.f.short+' credit. Bond +6, reputation +1.',1);}else add(x.w.short+' gave '+x.f.short+' credit. Bond +6.',1);}
  else if(id==='concede'){say('concede');x.w.morale=clamp(x.w.morale+3);bond(x.w.id,x.f.id,4,'respect','Took the loss with grace.',cid+':mic');
   if(!likesTrouble(x.p)){x.p.trust=clamp(x.p.trust+1);add(x.w.short+' took the loss like a pro. Morale +3, '+x.p.name+' trust +1.',1);}else add(x.w.short+' took the loss like a pro. Morale +3.',1);}
  else if(id==='excuse'){say('excuse');
   if(x.dirty&&lands(.6)){const h=heatFeud(x.w.id,x.f.id,10);x.w.heat=clamp(x.w.heat+2);line('stage','The crowd is with them. They saw it too.');add('The crowd bought it: heat +2, feud heat '+h+'.',1);}
   else{x.w.heat=clamp(x.w.heat-2);line('stage',x.dirty?'Nobody is in the mood to hear it.':'The crowd saw a clean finish. They say so, loudly.');add('Sour grapes. Heat −2.',-1);}}
  else if(id==='demand:title'||id==='demand:slot'){
   const kind=id.slice(7),dm=demandsFor(st),chance=demandChance(st,kind),ok=roll('demand:'+kind)<chance,P=x.p;
   say(kind);st.demand={kind,ok,chance:Math.round(chance*100)};
   if(kind==='title'){
    if(ok){
     const a=state();a.calls=a.calls.filter(k=>!(k.kind==='title'&&k.wid===x.w.id));
     a.calls.push({kind:'title',wid:x.w.id,pid:P.id,div:D.divisionOf(x.w.id),from:cid,made:G.abs(),due:G.abs()+1,until:G.abs()+CALL_WEEKS});
     line('stage','The crowd takes it up: they want it too. Backstage, '+P.voice+' is already on the phone.');
     add('The title demand landed. Expect '+P.voice+' to offer the '+dm.title.name+' match next week.',1);
    }else{
     const dt=-(P.personality==='cold'?6:P.personality==='traditional'?4:3);P.trust=clamp(P.trust+dt);x.w.heat=clamp(x.w.heat-2);x.w.morale=clamp(x.w.morale-3);
     line('stage','A few cheers, and then quiet. Everybody looks towards the curtain, and nobody comes out.');
     add('The title demand fell flat. '+P.name+' trust '+dt+', heat −2, morale −3.',-1);
    }
   }else{
    const row=G.S.territory?.cards?.[P.id]?.[x.w.id];
    if(ok&&row){
     row.score=clamp(row.score+8);const dt=likesTrouble(P)?1:0;P.trust=clamp(P.trust+dt);
     line('stage','The crowd agrees, loudly. '+P.voice+' makes a note.');
     add(x.w.short+' talked their way up the card at '+P.name+(dt?' (and '+P.voice+' liked the nerve: trust +1)':'')+'.',1);
    }else{
     const dt=P.personality==='cold'?-4:-2;P.trust=clamp(P.trust+dt);x.w.morale=clamp(x.w.morale-2);
     line('stage','Nobody seems to think it is a good idea. Least of all '+P.voice+'.');
     add('The demand for a bigger spot fell flat. '+P.name+' trust '+dt+', morale −2.',-1);
    }
   }
  }
  else if(id==='rematch'||id.startsWith('call:')){
   const rematch=id==='rematch',tid=rematch?x.f.id:id.slice(5),t=who(tid),tg=rematch?null:targets(st).find(o=>o.id===tid);
   x.t=t;say(rematch?'rematch':'callout');
   const chance=callChance(st,tid,rematch),ok=roll('call:'+tid)<chance;
   st.call={target:tid,ok,chance:Math.round(chance*100),champion:!!tg?.champion};
   if(ok){
    const h=heatFeud(x.w.id,tid,rematch?8:15);
    const a=state();a.calls=a.calls.filter(k=>!(k.wid===x.w.id&&k.rid===tid));
    a.calls.push({wid:x.w.id,rid:tid,pid:x.p.id,slot:st.c.slot,champion:!!tg?.champion,from:cid,made:G.abs(),due:G.abs()+1,until:G.abs()+CALL_WEEKS});
    line('stage',rematch?'The crowd starts chanting for it. Somewhere backstage, '+x.p.voice+' picks up a pencil.':'The crowd turns to look at the curtain. '+t.short+' does not come out, but everybody wants them to.');
    add((rematch?'The rematch':'The callout of '+t.short)+' landed. Feud heat '+h+'; expect '+x.p.voice+' to call next week.',1);
    if(root.OfficeAmbitions?.state?.()?.w?.[x.w.id]?.kind==='rivalry')add(x.w.short+' wanted a real rival. This could be it.',1);
   }else{
    x.w.heat=clamp(x.w.heat-2);x.w.morale=clamp(x.w.morale-2);
    line('stage',rematch?'A few people clap. Most are looking at their phones.':'Silence. Half the crowd is not sure who '+t.short+' is, and the other half does not think '+x.w.short+' deserves them.');
    let text=(rematch?'Nobody wanted the rematch':'The callout of '+t.short+' fell flat')+'. Heat −2, morale −2.';
    if(tg?.champion){x.p.trust=clamp(x.p.trust-2);text+=' '+x.p.voice+' did not like a title challenge from nowhere: trust −2.';}
    add(text,-1);
   }
  }
  st.stage='done';
  settleStory(st);
  const a=state();a.log.unshift({cid,week:G.abs(),wid:x.w.id,rid:x.f.id,plan:st.plan,angle:st.angle?.ok??null,said:id,call:st.call||null,demand:st.demand||null});a.log=a.log.slice(0,30);
  recordEvidence(st);
  G.save();return true;
 }

 // AB7: a compact, public, terminal scene receipt. One source for booking,
 // rivalry, programme and news readers. Never promote a hypothetical path
 // or an unfinished scene to a career fact, nor pay the angle effects twice.
 function storyReceipt(st){
  if(st?.stage!=='done'||!st.said||!st.c)return null;
  const x=ctxOf(st.c,st.fin);if(!x.w||!x.f)return null;
  const W=x.w.short,F=x.f.short,follow=st.follow?.reaction,r=st.angle?.reaction;
  let kind=null,text=null;
  const set=(k,t)=>{kind=k;text=t;};
  if(follow==='interested')set('challenge',W+' and '+F+' signalled interest in another match.');
  else if(follow==='calmed')set('respect',W+' and '+F+' calmed their post-match dispute.');
  else if(follow==='ended'||follow==='backs_off')set('resolved',W+' and '+F+' ended their post-match argument without further escalation.');
  else if(['heated','unresolved','rebuffed'].includes(follow))set('dispute',W+' and '+F+' left their post-match dispute unresolved.');
  else if(st.plan==='beatdown'&&st.angle?.ok===false)set('scuffle',W+' and '+F+' had to be separated after the bell.');
  else if(st.plan==='beatdown'&&st.angle?.ok===true)set('attack',W+' attacked '+F+' after the bell.');
  else if(st.plan==='handshake'&&st.angle?.ok===false)set('dispute',F+' refused '+W+'’s handshake after the bell.');
  else if(st.plan==='handshake'&&st.angle?.ok===true)set('respect',W+' and '+F+' shook hands after the bell.');
  else if(['reciprocate','accept_apology','shared_respect','brief_respect','hear_explanation'].includes(r))set('respect',W+' and '+F+' exchanged a gesture of respect after the bell.');
  else if(['reject_apology','argue_back','defend_corner','reject_explanation','corner_backed'].includes(r))set('dispute',W+' and '+F+' argued after the bell.');
  else if(['appreciate','space','officials_attend','quiet_exit'].includes(r))set('care','Officials attended to an injured wrestler after the match.');
  else if(st.plan==='staredown'&&st.angle?.ok===true)set('dispute',W+' and '+F+' faced off after the bell.');
  else if(st.said==='credit'||st.said==='concede')set('respect',W+' acknowledged '+F+' on the microphone.');
  else if(st.intervention?.id==='rival_protest')set('dispute',F+' protested after the bell.');
  else if(st.intervention?.id==='corner_protest')set('dispute','The rival corner protested after the bell.');
  if(st.call?.ok===true&&st.call.target===x.f.id)set('challenge',W+' made a successful public call for a rematch with '+F+'.');
  if(!kind)return null;
  return {v:1,cid:st.cid,wid:st.c.wid,rid:st.c.rid,pid:st.c.pid,kind,text:cap(text)};
 }
 function latestStory(s,wid,rid,pid){
  // History is newest first; do not resurrect an older angle after a more
  // recent completed encounter with the same pair/promotion.
  const h=(s?.history||[]).find(h=>h.wid===wid&&(!rid||h.rid===rid)&&(!pid||h.pid===pid));
  const story=h?.after?.story;
  return story?.v===1&&story.cid===h.cid?story:null;
 }
 function settleStory(st){
  const h=G.S?.history?.find(h=>h.cid===st.cid);
  if(!h||h.after?.story)return;
  const receipt=storyReceipt(st);if(!receipt)return;
  st.story=receipt;
  // Inbox reports only the more significant unresolved or rematch scenes.
  // The existing callout offer pathway remains the sole source of bookings.
  if(['scuffle','attack','dispute','challenge'].includes(receipt.kind)&&!G.S.inbox?.some(m=>m.afterStory===st.cid)){
   const p=G.P(st.c.pid);
   G.msg({from:p.voice+', '+p.name,subject:'After the bell: '+(receipt.kind==='challenge'?'another chapter?':'unfinished business'),kind:'info',
    body:[receipt.text,'The recorded match result stands. Any further booking must be agreed through the usual offers.'],afterStory:st.cid});
  }
  root.OfficeProgrammeArcs?.recordAfterStory?.(st.c,receipt);
 }
 // Only performed post-bell scenes become permanent evidence.
 // A player who skips the result-screen option never reaches this mutation.
 function recordEvidence(st){
  const h=G.S?.history?.find(x=>x.cid===st.cid);if(!h)return;
  const fresh=st.cons.map(x=>x.text),prior=h.after?.effects||[];
  h.after={plan:st.plan,...(st.story||h.after?.story?{story:{...(st.story||h.after.story)}}:{}),...(st.intervention?{intervention:{...st.intervention}}:{}),...(st.follow?{follow:{...st.follow}}:{}),angle:st.angle?{...st.angle}:null,said:st.said||null,
   call:st.call?{...st.call}:null,demand:st.demand?{...st.demand}:null,effects:fresh,
   log:st.log.map(x=>({side:x.side,text:x.text,...(x.lineId?{lineId:x.lineId,source:x.source}:{})}))};
  for(const line of fresh)if(!prior.includes(line))h.notes.push('After the bell: '+line);
  root.OfficeRivalry?.recordAfter?.(st);
  // Keep only the current compulsory response, so a lost night snapshot cannot erase an observed opening.
  if(st.required){const a=state();if(st.stage==='done'){if(a.autonomous?.cid===st.cid)delete a.autonomous;}else a.autonomous=JSON.parse(JSON.stringify(st));}
 }
 // Decide the autonomous opening at result settlement, before the manager can leave.
 // This preview is read-only; routine results do not start an optional segment.
 function prepareAutonomous(c,fin,plan){
  if(!c?.id||!G.S?.history?.some(h=>h.cid===c.id))return null;
  const a=G.S.after;
  if(a?.autonomous?.cid===c.id)return JSON.parse(JSON.stringify(a.autonomous));
  if(a?.done?.[c.id])return null;
  const x=ctxOf(c,fin);if(!x.w||!x.f||!x.p)return null;
  const turned=!!G.S.bonds?.done?.[c.id+':turn'];
  if(turned)return begin(c,fin,plan,{required:true,turned:true});
  if(plan!=null)return null; // Honor a previously signed legacy angle.
  const assessment=psychology(c,fin),event=selectOpening({cid:c.id,psychology:assessment},x);
  return event?begin(c,fin,plan,{required:true,assessment,event}):null;
 }
 // A selected post-bell scene; only witnessed autonomous openings start at result settlement.
 // With no plan, the segment opens on the angle choice (stage 'angle'). A plan passed in is one
 // agreed backstage in an older save, and it plays straight away as it always did.
 function begin(c,fin,plan,prepared=null){
  const x=ctxOf(c,fin);if(!x.w||!x.f||!x.p)return null;
  const turned=!!G.S?.bonds?.done?.[c.id+':turn'],choosing=plan==null&&!turned;
  const a=state(),st={v:1,cid:c.id,c:{id:c.id,wid:c.wid,rid:c.rid,pid:c.pid,slot:c.slot,finish:c.finish,...(c.programme?{programme:{...c.programme}}:{})},fin:{stars:x.stars,crowd:x.crowd,outcome:x.outcome,...(x.context?{context:JSON.parse(JSON.stringify(x.context))}:{})},plan:PLANS[plan]?plan:'none',stage:choosing?'angle':'mic',log:[],cons:[],angle:null,said:null,call:null};
  if(prepared?.required)st.required=true;
  if(choosing){const assessment=prepared?.assessment||psychology(c,fin);if(assessment)st.psychology=assessment;}
  if(st.plan==='celebrate'&&!x.won)st.plan='none';
  st.log.push({side:'stage',who:null,text:x.outcome==='dq'?'The referee is still pointing at '+x.w.short+'. Disqualified.':x.won?'The referee raises '+x.w.short+'’s hand.':x.outcome==='nc'?'Nobody’s hand is raised. The referee waves it off.':'The referee raises '+x.f.short+'’s hand.'});
  if(a.done[c.id]){st.stage='done';return st;}
  a.done[c.id]=1;
  for(const text of contextLines(x))st.log.push({side:'stage',who:null,text});
  // A friend who turned at the bell has already decided what happens after it.
  if(turned&&plan==null)st.log.push({side:'stage',who:null,text:fill('{F} shakes {W}’s hand, then hits them from behind. Whatever came next is out of the window.',x)});
  if(st.stage==='angle'){
   if(prepared?.event){st.intervention={...prepared.event};st.log.push({side:'stage',who:null,text:st.intervention.line});}
   else startOpening(st,x);
   if(st.required)recordEvidence(st);
   G.save();return st;
  }
  if(st.plan!=='none')playAngle(st,x);
  recordEvidence(st);
  G.save();return st;
 }
 function angleOptions(st){
  if(st?.stage!=='angle')return [];
  const x=ctxOf(st.c,st.fin);if(!x.w||!x.f)return [];
  const base=plans(st.c,x.w,x.f,x.won);
  if(x.context?.v!==1)return base;
  const hurt=injured(x.context.injured?.w)||injured(x.context.injured?.f);
  const ordinary=base.filter(o=>!hurt||!['beatdown','staredown'].includes(o.id));
  const contextual=graphOptions(openingContext(st,x));
  // Witnessed situation-specific responses first; the safe exit is always
  // available. A chosen action is still validated against the same list.
  return [...contextual,...ordinary.map(o=>o.id==='none'?{...o,label:'No further action',hint:'Move on to the microphone decision.'}:o)];
 }
 // The first call of the segment: what happens now the bell has gone. Final once made.
 function choose(st,plan){
  if(st?.stage!=='angle'||!angleOptions(st).some(o=>o.id===plan))return false;
  const x=ctxOf(st.c,st.fin);
  st.plan=plan;st.stage='mic';
  performAngle(st,openingContext(st,x));
  speakReaction(st,x);
  beginFollow(st,x);
  recordEvidence(st);
  G.save();return true;
 }
 function view(st){
  const x=ctxOf(st.c,st.fin);
  const angle=st.stage==='angle';
  return {stage:st.stage,stepLabel:{angle:'Choose an action',follow:'Respond',mic:'Microphone',done:'Complete'}[st.stage]||'',plan:st.plan,planLabel:angle?'':PLANS[st.plan]?.label||angleGraph.actions[st.plan]?.label||'',log:st.log.slice(),cons:st.cons.slice(),options:angle?angleOptions(st):st.stage==='follow'?followOptions(st):micOptions(st),
   title:angle?'The bell has gone':st.stage==='follow'?'The argument is not over':st.stage==='mic'?x.w.short+' has the microphone':'After the bell',
   ask:angle?(st.intervention?'What does '+x.w.short+' do in response?':x.won?'The crowd is still on its feet. What does '+x.w.short+' do now?':x.outcome==='nc'?'Nobody won. What does '+x.w.short+' do now?':'The crowd is watching '+x.w.short+'. What happens now?'):st.stage==='follow'?'How does '+x.w.short+' respond?':st.stage==='mic'?(x.won?'The crowd is still on its feet. What does '+x.w.short+' say?':'The crowd is quietening down. What does '+x.w.short+' say?'):''};
 }

 // ---------------------------------------------------------------------------------------------
 // The week after a callout lands: the promoter puts the match on the desk.
 // The week's offers are made inside endWeek, so the callout joins them straight afterwards.
 const originalEnd=G.endWeek;
 G.endWeek=function(...args){
  const r=originalEnd.apply(this,args);
  try{if(!G.S?.over)deliverCalls();G.save();}catch(e){G.reportError('after-bell/callout-delivery',e)}
  return r;
 };
 function deliverCalls(){
  const s=G.S,a=state(s);if(!a?.calls.length)return;
  const now=G.abs(),keep=[];
  for(const k of a.calls){
   if(k.due>now){keep.push(k);continue;}
   if(k.kind==='title'){if(!deliverTitle(s,k,now)&&k.until>now)keep.push(k);continue;}
   const w=G.W(k.wid),p=G.P(k.pid),t=who(k.rid);
   const onCard=T?.promotionRank?.(k.pid,D.divisionOf(k.wid))?.some(r=>r.id===k.rid&&!r.owned);
   const ok=w&&p&&t&&onCard&&!G.W(k.rid)&&G.eligible(p)&&T.contracted?.(s,k.rid)&&G.availableAt(w,now+1);
   if(!ok){if(k.until>now)keep.push(k);continue;}
   if(s.offers.some(o=>o.callout===k.from))continue;
   const up=D.SLOT_ORDER[Math.min(D.SLOT_ORDER.length-1,D.SLOT_ORDER.indexOf(k.slot)+1)];
   const win=hash(k.from+'|callwin')<.42+p.trust/400;
   const finish=win?(hash(k.from+'|cf')<.6?'win_clean':'win_dirty'):(hash(k.from+'|cf')<.5?'lose_protected':'lose_clean');
   const o={id:'o'+Math.floor(hash(k.from+'|oid')*1e9).toString(36)+now,pid:p.id,rid:k.rid,wid:k.wid,slot:up,finish,tag:'Callout',boost:k.champion?1.35:1.2,haggled:false,eventAbs:now+1,expiresAbs:now,callout:k.from};
   s.offers.unshift(o);
   G.msg({from:p.voice+', '+p.name,subject:`You asked for ${t.short}. You’ve got them.`,kind:'info',
    body:[`“${w.short} said it in front of my crowd, so now they can back it up. ${t.name}, next week, ${D.SLOTS[up].name.toLowerCase()}.”`,
     `The agreed finish is ${D.FINISHES[finish].name.toLowerCase()}. ${k.champion?'Win it and the belt will not be far away.':'It is on the Offers screen until the end of this week.'}`]});
  }
  a.calls=keep;
 }
 // A title demand that landed: the promoter books the champion, if the belt is still free to book.
 function deliverTitle(s,k,now){
  const w=G.W(k.wid),p=G.P(k.pid),holder=T?.title?.(k.pid,k.div)?.holder,champ=who(holder);
  if(!w||!p||!champ||G.W(holder)||!G.eligible(p)||!T.contracted?.(s,holder)||!G.availableAt(w,now+1))return false;
  if(D.divisionOf(w.id)!==k.div)return false;
  if([...s.offers,...s.card,...s.futureBookings].some(o=>o.title?.pid===k.pid&&o.title?.div===k.div))return true;
  if(root.OfficeProgrammes?.claims?.(s,s.territory)?.belts?.has(k.pid+':'+k.div))return true;
  if(s.offers.some(o=>o.callout===k.from))return true;
  const win=hash(k.from+'|tw')<.3+p.trust/300;
  const finish=win?'win_clean':(hash(k.from+'|tf')<.5?'lose_protected':'lose_clean');
  const belt=D.belt?.(k.pid,k.div)?.name||'title';
  s.offers.unshift({id:'o'+Math.floor(hash(k.from+'|toid')*1e9).toString(36)+now,pid:p.id,rid:holder,wid:w.id,slot:'main',finish,tag:'Title match',title:{pid:k.pid,div:k.div},boost:1.5,haggled:false,eventAbs:now+1,expiresAbs:now,callout:k.from});
  G.msg({from:p.voice+', '+p.name,subject:`All right. ${w.short} gets the title match.`,kind:'info',
   body:[`“${w.short} asked for it in front of my crowd, and my crowd wants it. ${champ.name}, the ${belt}, next week, main event.”`,
    `The agreed finish is ${D.FINISHES[finish].name.toLowerCase()}. It is on the Offers screen until the end of this week.`]});
  return true;
 }

 root.OfficeAfter={state,PLANS,plans,capture,psychology,reactionAdjustment,angleGraph,graphEdges,openingCandidates,selectOpening,prepareAutonomous,attachDialogue,begin,angleOptions,choose,followOptions,continueAngle,view,micOptions,speak,storyReceipt,latestStory,recordEvidence,targets,callChance,deliverCalls,demandsFor,demandChance};
})(typeof window!=='undefined'?window:globalThis);
