/* THE OFFICE v3.0 — The matches are scripted. The people aren't.
   This small, deterministic memory layer uses the existing career save,
   manager inbox, contract promises and match engine. No new navigation. */
(function installOfficeMemory(root){'use strict';
 const G=root.OfficeGame;
 const clamp=(n)=>Math.max(0,Math.min(100,Math.round(n)));
 const week=()=>G.abs();
 function state(){
  const s=G.S;if(!s)return null;
  if(!s.officeMemory||typeof s.officeMemory!=='object')s.officeMemory={};
  const m=s.officeMemory;
  m.entries??={};m.trust??={};m.rivals??={};m.processed??={};m.lastConversation??={};
  return m;
 }
 function worker(id){return G.W(id)}
 function trust(id){
  const m=state(),w=worker(id);if(!m)return 50;
  if(!Number.isFinite(m.trust[id]))m.trust[id]=clamp((w?.loyal??55)*.5+(w?.pro??65)*.5);
  return m.trust[id];
 }
 function rivalKey(wid,rid){return wid+':'+rid}
 function rival(wid,rid){const m=state();return Number.isFinite(m?.rivals[rivalKey(wid,rid)])?m.rivals[rivalKey(wid,rid)]:50}
 function remember(wid,kind,text,rid=null,shift=0,rivalShift=0,source=''){
  const m=state();if(!m)return null;
  const entry={id:String(source||kind+':'+week()+':'+(m.entries[wid]?.length||0)),week:week(),kind,text,against:rid,trustDelta:shift,rivalDelta:rivalShift};
  m.entries[wid]??=[];
  if(m.entries[wid].some(e=>e.id===entry.id))return null;
  m.entries[wid].unshift(entry);m.entries[wid]=m.entries[wid].slice(0,12);
  m.trust[wid]=clamp(trust(wid)+shift);
  if(rid&&rivalShift)m.rivals[rivalKey(wid,rid)]=clamp(rival(wid,rid)+rivalShift);
  return entry;
 }
 function view(id){
  const m=state();
  return {trust:trust(id),entries:(m?.entries[id]||[]).slice(),rivals:{...(m?.rivals||{})}};
 }
 function context(wid,rid){
  const v=view(wid),rel=rid?rival(wid,rid):50;
  const event=v.entries.find(e=>!rid||e.against===rid)||v.entries[0];
  return {trust:v.trust,rivalry:rel,kind:event?.kind||null,
   recall:event?.text||null,
   promoPrompt:event?(rid&&event.against===rid?'Before the microphone, one question hangs over this rematch: ':'Before this match, a question from the last dressing-room conversation remains: ')+event.text:null};
 }
 // MP11: shared professional evidence, separate from manager trust,
 // personal regard, bonds and public rivalry. No fabricated starting score.
 const pairKey=(a,b)=>[a,b].sort().join('|');
 function professionalContext(career,a,b,before=Infinity,exclude=null){
  if(!a||!b||a===b)return null;
  const rows=career?.officeMemory?.professionalPairs?.[pairKey(a,b)];
  if(!Array.isArray(rows))return null;
  const entries=rows.filter(e=>e?.v===1&&typeof e.cid==='string'&&e.cid!==exclude&&
   Number.isFinite(e.abs)&&e.abs<before&&Number.isFinite(e.delta)&&e.delta>=-3&&e.delta<=3)
   .slice(0,6);
  if(!entries.length)return null;
  return {score:clamp(50+entries.reduce((sum,e,i)=>sum+e.delta*(6-i)/2,0)),
   entries:entries.map(e=>({...e}))};
 }
 // Player-facing factual digest. The hidden confidence score and
 // individual fuzzy inclinations remain in the simulation.
 function professionalSummary(context){
  const entries=Array.isArray(context?.entries)?context.entries:[];
  if(!entries.length)return null;
  const latest=entries[0];
  if(latest.kind==='broken_finish')return 'Last recorded working experience: the agreed finish was broken. That is a shared setback, not evidence of which partner was responsible.';
  if(latest.kind==='shared_delivery')return 'Last recorded working experience: '+latest.exact+' agreed and '+latest.adapted+' adapted sequences delivered. An encouraging precedent, not a guarantee tonight.';
  return null;
 }
 function recordProfessional(c,fin,delivery){
  if(!G.S||!c?.id||!c.wid||!c.rid||c.wid===c.rid||
     !Number.isFinite(c.eventAbs)||!fin?.structure||!Array.isArray(delivery))return null;
  // Only terminal graph receipts accepted by the rivalry recorder. A
  // protected exit, partial sequence or lack of opening is not evidence
  // of bad faith. A broken finish is a shared professional setback, not
  // an attribution of blame to the other wrestler.
  const complete=delivery.filter(x=>['completed','adapted'].includes(x.status)&&
   x.witnessed?.length===x.planned?.length&&x.witnessed.length>=2);
  const exact=complete.filter(x=>x.status==='completed').length;
  const adapted=complete.filter(x=>x.status==='adapted').length;
  const protectedExit=!!(fin.injury||fin.foeHurt||fin.shortened||fin.workingHurt||fin.outcome==='nc');
  const broken=fin.outcome==='double';
  const delta=broken&&!protectedExit?-3:fin.outcome==='booked'&&!protectedExit?Math.min(3,exact+adapted*2):0;
  if(!delta)return null;
  const memory=state(),key=pairKey(c.wid,c.rid);
  memory.professionalPairs??={};
  const rows=memory.professionalPairs[key]??=[];
  if(rows.some(e=>e.cid===c.id))return null;
  const entry={v:1,cid:c.id,abs:c.eventAbs,delta,exact,adapted,
   kind:delta<0?'broken_finish':'shared_delivery'};
  rows.unshift(entry);rows.sort((a,b)=>b.abs-a.abs);memory.professionalPairs[key]=rows.slice(0,12);
  return {...entry};
 }
 const originalApply=G.applyResult;
 function incident(c,fin,w,f){
  if(fin.injury)return {kind:'hurt',text:w.short+' remembers the painful landing against '+f.short+' and the fear of being asked to work hurt again.',shift:-2,rivalShift:-3,prompt:true};
  if(fin.outcome==='double')return {kind:'rebellion',text:w.short+' remembers breaking the agreed finish against '+f.short+'. The promoter has not forgotten either.',shift:8,rivalShift:-8,prompt:true};
  if(fin.refused)return {kind:'discipline',text:w.short+' refused to double-cross '+f.short+' and worked the agreed finish.',shift:3,rivalShift:2,prompt:false};
  if(c.finish==='lose_clean'&&w.ego>=65){
   const count=view(w.id).entries.filter(e=>e.kind==='humiliation'&&e.against===f.id).length;
   const detail=count>=2?'Another clean loss to '+f.short+' has turned an old grievance into a problem for the whole stable.':
    count===1?'The second decisive defeat to '+f.short+' has made '+w.short+' question where their career is going.':
    w.short+' remembers being asked to lose decisively to '+f.short+'. The dressing-room conversation is unfinished.';
   return {kind:'humiliation',text:detail,shift:-4,rivalShift:-5,prompt:true};
  }
  if(c.finish==='lose_protected'&&w.ego>=70)return {kind:'protected',text:w.short+' remembers taking a protected loss to '+f.short+' — and that their reputation was protected.',shift:1,rivalShift:-2,prompt:true};
  if(fin.resent&&(fin.ignored>0||(fin.script!==null&&fin.script<.6)))return {kind:'control',text:w.short+' remembers being denied room to improvise against '+f.short+'.',shift:-3,rivalShift:0,prompt:true};
  if(fin.stars>=4&&!view(w.id).entries.some(e=>e.kind==='breakthrough'&&week()-e.week<4))
   return {kind:'breakthrough',text:w.short+' remembers the '+fin.stars+'-star performance with '+f.short+'. The audience finally paid attention.',shift:3,rivalShift:3,prompt:true};
  if(fin.ignored>=2)return {kind:'defiance',text:w.short+' remembers ignoring the signals from ringside against '+f.short+'.',shift:-2,rivalShift:0,prompt:true};
  return null;
 }
 // Keep conversation choices tied to the *actual* post-match memory. The
 // outcome IDs are unchanged so open career saves and consequence rules survive.
 const COPY={
  humiliation:{
   lead:'A clean defeat has damaged their confidence in the booking. What do you tell them about their next opportunity?',
   back:['Defend their place on the card','Back them in front of the promoter; you gain their trust but risk the booking relationship.'],
   business:['Explain the agreed loss','A veteran may understand the longer story. An unhappy wrestler may hear an excuse.'],
   promise:['Commit to rebuilding their position','Promise a featured match within two weeks; failing to deliver has consequences.']
  },
  protected:{
   lead:'They accepted the loss because their standing was protected. What do you do with that trust now?',
   back:['Acknowledge their professionalism publicly','Show the promoter that their contribution mattered, at the risk of interfering.'],
   business:['Explain how the protection helps','A veteran may appreciate the longer-term thinking; others may still want a win.'],
   promise:['Offer them a featured opportunity','Commit to a featured match within two weeks, or let them down.']
  },
  breakthrough:{
   lead:'That performance drew a strong crowd response. They now have a case for better billing. How will you respond?',
   back:['Push for a higher place on the card','Make their case to the promoter. Your wrestler appreciates it, but the promoter may resent the pressure.'],
   business:['Keep expectations realistic','Explain that one standout match does not guarantee top billing next week.'],
   promise:['Promise a featured match','Find them a featured or main-event booking within two weeks, or break your word.']
  },
  control:{
   lead:'Your calls from ringside made them feel you did not trust their judgement. How do you address it?',
   back:['Tell the promoter you trust them','Stand up for their in-ring judgement, even if the promoter dislikes your intervention.'],
   business:['Explain why you called the match','A professional might accept your reasoning; someone frustrated may feel dismissed.'],
   promise:['Offer a fresh featured opportunity','Make a real booking commitment rather than an empty apology.']
  },
  defiance:{
   lead:'They ignored your ringside instructions. You need to deal with the disagreement before the next match.',
   back:['Stand by their in-ring judgement','Support their call in front of the promoter, taking responsibility for the friction.'],
   business:['Explain why the plan mattered','Reassert the agreed layout. A veteran may accept it; another wrestler may resist.'],
   promise:['Offer a featured chance to reset','Promise another important match within two weeks, with a real deadline.']
  },
  rebellion:{
   lead:'They changed the agreed finish. The promoter now has reason to question your stable. How will you handle it?',
   back:['Defend them to the promoter','Show loyalty to the wrestler, but further damage your relationship with the promoter.'],
   business:['Explain the damage they caused','Make clear why breaking a booked finish matters. They might not welcome the lecture.'],
   promise:['Offer a featured chance to make amends','Make a binding booking promise without pretending the broken finish never happened.']
  },
  hurt:{
   lead:'They were injured during the match and need to know what support you will provide.'
  }
 };
 const fallbackKind=subject=>subject==='After the big match'?'breakthrough':
   subject==='After the injury'?'hurt':subject==='The finish was broken'?'rebellion':null;
 function debriefCopy(kind,w,f,fin,event){
  const highEgo=(w.ego||0)>=70,copy=COPY[kind]||COPY.humiliation;
  const subject=kind==='hurt'?'After the injury':kind==='rebellion'?'The finish was broken':
   kind==='breakthrough'?'After the big match':'About that match';
  const opening=kind==='humiliation'?(highEgo?'"You sent me out there to lose like I was nobody. You had better explain why."':'"I did what was asked. But I need to know what comes next."'):
   kind==='protected'?'"I did the job. You made sure I was protected. I noticed."':
   kind==='hurt'?'"I went down badly out there. I need to know you are looking after me."':
   kind==='rebellion'?'"I broke the finish and you were there. Now what happens to us?"':
   kind==='control'?'"You kept calling from the curtain. It felt like you did not trust me."':
   kind==='defiance'?'"I heard you from ringside. I just could not do what you wanted."':
   '"They were chanting my name after that match. I do not want to go back to being just another name on the card."';
  // The report is about the actual incident, not a fabricated contract dispute.
  const evidence=kind==='breakthrough'?
   'Match report: '+w.short+' delivered '+(fin?.stars||event?.stars?('a '+(fin?.stars||event?.stars)+'-star'):'a standout')+' performance against '+f.short+'. The audience responded.':
   kind==='humiliation'?'Match report: '+w.short+' was booked to lose cleanly to '+f.short+'.':
   kind==='protected'?'Match report: '+w.short+' took a protected loss to '+f.short+'.':
   kind==='hurt'?'Match report: '+w.short+' was injured in the match with '+f.short+'.':
   kind==='rebellion'?'Match report: '+w.short+' broke the agreed finish against '+f.short+'.':
   kind==='control'?'Match report: '+w.short+' wanted more freedom to improvise against '+f.short+'.':
   kind==='defiance'?'Match report: '+w.short+' ignored instructions during the match with '+f.short+'.':
   'Match report: '+(event?.text||'A difficult post-match conversation.');
  const openPromise=w.promise?.status==='open';
  const options=kind==='hurt'?[
   {id:'rest',label:'Put their recovery first',hint:'Set training to rest. More trust; the next payday may have to wait.'},
   {id:'medical',label:'Help with treatment (£120)',hint:'Pay £120. A meaningful show of support, if you can afford it.'},
   {id:'listen',label:'Hear them out',hint:'Rebuild some trust, but make no practical commitment.'}
  ]:[
   {id:'back',label:copy.back[0],hint:copy.back[1]},
   {id:'business',label:copy.business[0],hint:copy.business[1]},
   {id:'promise',label:openPromise?'Acknowledge their existing promise':copy.promise[0],
    hint:openPromise?'Listen, but do not make a second promise before the existing one is settled.':copy.promise[1]}
  ];
  return {subject,body:[opening,evidence,copy.lead],options};
 }
 function conversation(c,fin,w,f,p,event){
  const copy=debriefCopy(event.kind,w,f,fin,event);
  return {from:w.name,subject:copy.subject,kind:'decision',dtype:'office_debrief',
   incidentKind:event.kind,copyVersion:2,args:[w.id,p.id,f.id,event.id],
   body:copy.body,options:copy.options,answer:null,outcome:null,read:false,
   week:G.S.week,season:G.S.season,id:'debrief-'+c.id};
 }
 // Update unanswered debriefs already inside existing careers. Simply fixing
 // the generator would leave the exact mobile inbox shown by players unchanged.
 function refreshDebriefs(){
  const inbox=G.S?.inbox;if(!Array.isArray(inbox))return;
  let changed=false;
  for(const msg of inbox){
   if(msg.dtype!=='office_debrief'||msg.answer||msg.copyVersion===2)continue;
   const [wid,,rid,source]=msg.args||[],w=worker(wid),f=G.F(rid);
   const event=G.S.officeMemory?.entries?.[wid]?.find(e=>e.id===source);
   const kind=msg.incidentKind||event?.kind||fallbackKind(msg.subject);
   if(!w||!f||!kind)continue; // Do not invent an event for an ambiguous old message.
   const revised=debriefCopy(kind,w,f,null,event);
   msg.subject=revised.subject;msg.body=revised.body;msg.options=revised.options;
   msg.incidentKind=kind;msg.copyVersion=2;changed=true;
  }
  if(changed)G.save();
 }
 const originalPending=G.pending;
 G.pending=function(...args){refreshDebriefs();return originalPending(...args);};
 const originalLoad=G.load;
 G.load=function(...args){const loaded=originalLoad(...args);if(loaded)refreshDebriefs();return loaded;};
 refreshDebriefs();
 G.applyResult=function(c,fin){
  const result=originalApply(c,fin);
  if(!c||!fin||!G.S)return result;
  const m=state();if(m.processed[c.id])return result;
  m.processed[c.id]=true;
  const w=worker(c.wid),f=G.F(c.rid),p=G.P(c.pid);
  if(!w||!f||!p){G.save();return result}
  const chosen=incident(c,fin,w,f);
  if(chosen){
   const entry=remember(w.id,chosen.kind,chosen.text,f.id,chosen.shift,chosen.rivalShift,c.id);
   if(entry){
    const notice='Memory: '+entry.text;
    result.push({text:notice,tone:Math.sign(chosen.shift)});
    const h=G.S.history.find(x=>x.wid===w.id&&x.rid===f.id&&x.season===G.S.season&&x.week===G.S.week);
    if(h){h.notes??=[];h.notes.push(notice)}
    const recent=G.S.inbox.some(x=>x.dtype==='office_debrief'&&x.week===G.S.week&&x.season===G.S.season)
      ||(chosen.kind!=='hurt'&&chosen.kind!=='rebellion'&&Number.isFinite(m.lastConversation[w.id])&&week()-m.lastConversation[w.id]<3);
    if(chosen.prompt&&!recent){
     const msg=conversation(c,fin,w,f,p,entry);
     G.S.inbox.unshift(msg);G.S.inbox=G.S.inbox.slice(0,60);m.lastConversation[w.id]=week();
     result.push({text:w.short+' wants to speak with you. A post-match decision is waiting in the inbox.',tone:0});
    }
   }
  }
  G.save();return result;
 };
 const originalAnswer=G.answer;
 G.answer=function(mid,opt){
  const s=G.S,m=s?.inbox.find(x=>x.id===mid);if(!m||m.dtype!=='office_debrief')return originalAnswer(mid,opt);
  if(m.answer)return null;
  if(!m.options.some(o=>o.id===opt))return 'Choose one of the available responses.';
  const [wid,pid,rid,source]=m.args,w=worker(wid),p=G.P(pid);
  if(!w){m.answer=opt;m.outcome='That wrestler has left your stable.';m.read=true;G.save();return m.outcome;}
  if(opt==='medical'&&s.cash<120)return 'You need £120 to help cover treatment. Choose another response.';
  let result='',change=0,rel=0;
  if(opt==='rest'){w.training='rest';w.intensity='light';w.morale=clamp(w.morale+5);w.loyal=clamp(w.loyal+3);change=8;result=w.short+' gets the time to recover. They know you prioritised their health.';}
  else if(opt==='medical'){s.cash-=120;w.morale=clamp(w.morale+4);change=10;result='You paid £120 towards '+w.short+'’s treatment. They did not expect you to do that.';}
  else if(opt==='listen'){w.morale=clamp(w.morale+2);change=3;result='You listened carefully without making another commitment. '+w.short+' leaves less angry.';}
  else if(opt==='back'){change=8;rel=2;w.morale=clamp(w.morale+5);w.loyal=clamp(w.loyal+4);if(p)p.trust=clamp(p.trust-4);
   result=m.incidentKind==='breakthrough'?'You made the case for '+w.short+' to receive better billing. They felt supported; '+(p?.name||'the promoter')+' trust fell by 4.':'You defended '+w.short+' in front of the promoter. '+w.short+' felt supported; '+(p?.name||'the promoter')+' trust fell by 4.';}
  else if(opt==='business'){
   if(w.pro>=75){change=3;w.morale=clamp(w.morale-1);result=m.incidentKind==='breakthrough'?w.short+' understands that one standout match is a strong argument for better billing, not a guaranteed headline spot.':m.incidentKind==='rebellion'?w.short+' understands why changing the agreed finish put the stable in difficulty.':w.short+' understands the booking, although the result still stings.';}
   else{change=-6;w.morale=clamp(w.morale-4);result=m.incidentKind==='breakthrough'?w.short+' hears a reason to hold them back just after their biggest match. The conversation ends badly.':m.incidentKind==='rebellion'?w.short+' resents being lectured about the finish they changed. The conversation ends badly.':w.short+' hears an excuse, not an explanation. The conversation ends badly.';}
   if(p)p.trust=clamp(p.trust+2);
  }
  else if(opt==='promise'){
   if(w.promise?.status==='open'){change=3;result='You listened to '+w.short+' without adding a promise you could not keep.';}
   else{w.promise={status:'open',type:'feature',start:week(),deadline:week()+2,matchesAt:w.matches};
    w.morale=clamp(w.morale+7);change=3;result='You promised '+w.short+' a featured match within two weeks. Now you have to deliver.';}
  }
  m.answer=opt;m.outcome=result;m.read=true;
  remember(wid,'conversation',result,rid,change,rel,'reply:'+source);
  G.save();return result;
 };
 const originalEnd=G.endWeek;
 G.endWeek=function(...args){
  const before=(G.S?.roster||[]).filter(w=>w.promise?.status==='open')
    .map(w=>({id:w.id,start:w.promise.start}));
  const result=originalEnd(...args);
  for(const item of before){
   const w=worker(item.id),pr=w?.promise;
   if(!w||!pr||pr.status==='open')continue;
   if(pr.status==='kept')remember(w.id,'promise_kept',w.short+' remembers that you delivered the featured opportunity you promised.',null,6,0,'promise:'+w.id+':'+item.start);
   if(pr.status==='broken')remember(w.id,'promise_broken',w.short+' remembers the featured opportunity you promised but did not deliver.',null,-9,0,'promise:'+w.id+':'+item.start);
  }
  G.save();return result;
 };
 root.OfficeMemory={view,context,trust,rival,remember,professionalContext,professionalSummary,recordProfessional};
})(typeof window!=='undefined'?window:globalThis);
