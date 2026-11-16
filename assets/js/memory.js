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
 function conversation(c,fin,w,f,p,event){
  const highEgo=(w.ego||0)>=70;
  const veteran=(w.pro||0)>=75;
  const subject=event.kind==='hurt'?'After the injury':event.kind==='rebellion'?'The finish was broken':event.kind==='breakthrough'?'After the big match':'About that match';
  const opening=event.kind==='humiliation'?(highEgo?'"You sent me out there to lose like I was nobody. You had better explain why."':'"I did what was asked. But I need to know what comes next."'):
   event.kind==='protected'?'"I did the job. You made sure I was protected. I noticed."':
   event.kind==='hurt'?'"I went down badly out there. I need to know you are looking after me."':
   event.kind==='rebellion'?'"I broke the finish and you were there. Now what happens to us?"':
   event.kind==='control'?'"You kept calling from the curtain. It felt like you did not trust me."':
   event.kind==='defiance'?'"I heard you from ringside. I just could not do what you wanted."':
   '"They were chanting my name after that match. I do not want to go back to being just another name on the card."';
  const options=event.kind==='hurt'?[
   {id:'rest',label:'Put their recovery first',hint:'Set training to rest. More trust; the next payday may have to wait.'},
   {id:'medical',label:'Help with treatment (£120)',hint:'Pay £120. A meaningful show of support, if you can afford it.'},
   {id:'listen',label:'Hear them out',hint:'Rebuild some trust, but make no practical commitment.'}
  ]:[
   {id:'back',label:'Back your wrestler publicly',hint:'Their trust rises. The promoter may see it as interference.'},
   {id:'business',label:'Explain the business',hint:'A professional may understand; a proud wrestler might not.'},
   {id:'promise',label:w.promise?.status==='open'?'Listen without another promise':'Promise a featured opportunity',hint:w.promise?.status==='open'?'Hear the concern without making a second promise.':'A featured/main-event booking within two weeks, or your word is broken.'}
  ];
  return {from:w.name,subject,kind:'decision',dtype:'office_debrief',args:[w.id,p.id,f.id,event.id],
   body:[opening,'Road agent: '+event.text,'The contract has been settled. Your response decides what happens when they return to the dressing room.'],
   options,answer:null,outcome:null,read:false,week:G.S.week,season:G.S.season,
   id:'debrief-'+c.id};
 }
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
   result='You defended '+w.short+' in front of the promoter. '+w.short+' felt supported; '+(p?.name||'the promoter')+' trust fell by 4.';}
  else if(opt==='business'){
   if(w.pro>=75){change=3;w.morale=clamp(w.morale-1);result=w.short+' understands the booking, although the defeat still stings.';}
   else{change=-6;w.morale=clamp(w.morale-4);result=w.short+' hears an excuse, not an explanation. The conversation ends badly.';}
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
 root.OfficeMemory={view,context,trust,rival,remember};
})(typeof window!=='undefined'?window:globalThis);
