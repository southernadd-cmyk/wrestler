/* MP6A: private match-planning dialogue, composed from shared character
   identity and narrow context-safe excerpts of existing promo banks.
   No on-air claims, public outcomes or new per-character banks. */
(function(root){'use strict';
 const hash=s=>{let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
 const other=s=>s==='w'?'f':'w';
 const side=s=>['w','f'].includes(s);
 const clean=s=>typeof s==='string'&&s.trim()&&s.length<=120&&!/[{}<>\r\n]/.test(s)?s.trim():null;
 // Explicitly reviewed complete first sentences: never splice a clause
 // or infer backstage truth from a classified on-air claim. Only used
 // for receptive responses, not a forced concession or a reservation.
 const acknowledgements=new Set(['Agreed.','Fair.','Fair enough.','Fair point.','Accepted.','All right.','Very well.','A fair observation.','A remarkably sensible proposition.','At last, a point of agreement.','Noted, in your own words.','I accept that for the moment.','I will grant you that point.','Concession noted.','On that much we agree.','That is a fair correction.']);
 const families={
  precise:{request:['Let me be precise.','Look at the order.'],accept:['That is workable.','The change makes sense.'],reserved:['I have a question about that.','I am not entirely satisfied.'],counter:['There is a better arrangement.','We need to reconsider that.']},
  direct:{request:['Right.','Here is the issue.'],accept:['Fine by me.','That works.'],reserved:['Not quite happy with that.','Hold on a minute.'],counter:['No, not that one.','Try another way.']},
  quiet:{request:['One thing.','Before we go on.'],accept:['All right.','I can work with that.'],reserved:['I am not sure yet.','Give me a moment.'],counter:['Not convinced.','Another option, please.']},
  warm:{request:['Can we talk this through?','I want us to get this right.'],accept:['Good, we can work with that.','I think that works for us.'],reserved:['I hear you, but I have a concern.','Can we think that through?'],counter:['I would rather find another way.','Can we look for a different option?']},
  theatrical:{request:['Now, consider this.','There is a point to settle.'],accept:['Very well.','A sensible arrangement.'],reserved:['I am not entirely persuaded.','There is still a question to settle.'],counter:['That is not the proposition I want.','Let us consider a different arrangement.']},
  energetic:{request:['Right, hang on!','Wait, one thing!'],accept:['Yes, that works!','Right, we can do that.'],reserved:['Wait, I have a question.','Hang on, I am not sure about that.'],counter:['Can we try something else?','No, let us look at another idea.']},
  wry:{request:['One small matter.','Right, a bit of housekeeping.'],accept:['That will do nicely.','Good enough for me.'],reserved:['Not quite as simple as that.','I have a reservation there.'],counter:['Back to the drawing board, then.','I would try a different arrangement.']}
 };
 function family(delivery){
  const d=String(delivery||'').toLowerCase();
  if(/wry|humour|sarcas|irony|joke|wit|playful|banter/.test(d))return 'wry';
  if(/formal|theatr|sermon|courtroom|menace|rhetoric|eloquence|grand/.test(d))return 'theatrical';
  if(/fast|quick|eager|excite|energet|breathless|restless|fidget/.test(d))return 'energetic';
  if(/warm|patient|earnest|reassur|reflect|sincere|humble|mentor/.test(d))return 'warm';
  if(/precis|methodical|analytic|clinical|exact|literal|legal|measured|technical|tactical/.test(d))return 'precise';
  if(/quiet|reserved|sparse|low.key|minimal|understated|hesitant|silence/.test(d))return 'quiet';
  return 'direct';
 }
 function capture(worker,banks=[]){
  const I=root.OfficePromoIdentity,L=root.OfficePromoBanks,D=root.OfficePromoDialogue;
  const identity=I?.wrestler(worker);
  if(!identity||identity.id!==worker?.id)return null;
  // Future academy workers share the same runtime compiler as promos.
  const runtime=root.OfficeRookiePhraseFactory?.runtime(worker);
  const owner=runtime?worker.id:I.bankId(worker);
  const bank=runtime?.bank||banks.find(b=>b?.owner===owner);
  let fragments=[];
  if(bank&&L&&D){
   try{
    const lines=D.catalogue([L.decode(bank)]).lines('wrestler',owner);
    fragments=lines.filter(r=>r.stage==='push'&&r.action==='acknowledge'&&r.category==='respect'&&Object.keys(r.when).every(k=>k==='hasMouthpiece')&&r.when.hasMouthpiece===false)
     .map(r=>({row:r,prefix:r.text.match(/^[^.!?]+[.!?]/)?.[0]}))
     .filter(({prefix})=>acknowledgements.has(prefix))
     .map(({row,prefix})=>({id:row.id,text:prefix,source:'bank:'+row.id+':'+L.hash(row.text),
      reviewedClaim:root.OfficePromoSemantics?.fromBank(row.id,row.text,runtime?.claims)?.claim||null}));
   }catch(_){fragments=[];}
  }
  return {v:1,id:worker.id,identitySource:identity.source,delivery:identity.delivery,family:family(identity.delivery),bankOwner:owner||null,fragments};
 }
 // Private subject contract, derived from authoritative room facts.
 // No borrowed promo claim is accepted as evidence of a planning event.
 function subject(room){
  const t=room?.structureTalk,F=root.OfficePlanningFuzzy,R=root.OfficeRoom;
  if(!t||!side(t.by)||!clean(t.title)||!clean(t.original?.label)||!t.alternative||!clean(t.alternative.label))return null;
  const evidence=R?.proposalEvidence(room,t.objective,t.alternative.action);
  const response=F?.readHuddleProposal(t);
  if(!evidence?.eligible||!response||evidence.original.action!==t.original.action||evidence.owner!==t.by||evidence.proposed.action===evidence.original.action)return null;
  // Re-derive the topic: a request's stated motivation is not proof.
  const from=evidence.original,to=evidence.proposed;
  const topic=from.risk===true&&to.risk===false?'risk':
   from.supportsFinish===false&&to.supportsFinish===true?'finish':
   Number.isFinite(from.cost)&&Number.isFinite(to.cost)&&to.cost<from.cost?'effort':
   Number.isFinite(from.crowd)&&Number.isFinite(to.crowd)&&to.crowd>from.crowd?'impact':
   from.familiar===false&&to.familiar===true?'familiarity':'layout';
  return {v:1,cid:room.cid,objective:t.objective,title:t.title,requester:t.by,actorId:evidence.actorId,partnerId:evidence.partnerId,
   original:t.original.label,alternative:t.alternative.label,topic,stances:{w:response.by.w.stance,f:response.by.f.stance}};
 }
 const reason={risk:'It avoids the marked high-risk move.',finish:'It may help set up the agreed finish.',effort:'It should take a little less out of me.',impact:'I think it could get a bigger reaction.',familiarity:'It is a move I know.',layout:'I would like to work that objective differently.'};
 function compose(identity,point,turn,who,seed,{used=[]}={}){
  if(identity?.v!==1||point?.v!==1||!side(who)||!side(point.requester)||!['request','response','resolution'].includes(turn)||!families[identity.family]||
     identity.id!==(who===point.requester?point.actorId:point.partnerId)||!clean(point.original)||!clean(point.alternative)||!clean(point.title)||!Object.hasOwn(reason,point.topic))return null;
  if(turn==='request'&&who!==point.requester||turn==='response'&&who===point.requester)return null;
  const stance=turn==='request'?'request':point.stances?.[who];
  if(!Object.hasOwn(families[identity.family],stance))return null;
  const body=turn==='request'?'For '+point.title.toLowerCase()+', could we use '+point.alternative+' instead of '+point.original+'? '+reason[point.topic]:
   turn==='response'?(stance==='accept'?'I can work with '+point.alternative+' in that spot.':stance==='reserved'?'I have reservations about using '+point.alternative+' there.':'I would like another option for '+point.title.toLowerCase()+'.'):
   stance==='accept'?'I will work with the agreed '+point.alternative+'.':stance==='reserved'?'I will work with '+point.alternative+', but note my reservation.':'I still prefer another option, but '+point.alternative+' is the call.';
  const bank=stance==='accept'&&Array.isArray(identity.fragments)?identity.fragments.filter(f=>acknowledgements.has(f.text)&&typeof f.id==='string'&&typeof f.source==='string'&&!used.includes(f.id)):[],
   frames=families[identity.family][stance].map((text,i)=>({id:'planning.'+identity.id+'.'+turn+'.'+stance+'.'+i,text,source:null}));
  const fresh=frames.filter(f=>!used.includes(f.id)),pool=bank.length?bank:fresh.length?fresh:frames;
  const line=pool[hash(seed+'|'+identity.id+'|'+point.objective+'|'+turn+'|'+stance)%pool.length];
  return {v:1,id:line.id,text:line.text+' '+body,actorId:identity.id,turn,stance,topic:point.topic,source:line.source||null,bankReuse:bank.length>0};
 }
 // Use the same lazy bank loader/cache as promos; runtime academy workers
 // are generated locally. No full bank payload is retained in the room.
 async function loadPair(w,f){
  const I=root.OfficePromoIdentity;
  const ids=[w,f].filter(worker=>!root.OfficeRookiePhraseFactory?.runtime(worker)).map(worker=>I?.bankId(worker)).filter(Boolean);
  try{return await root.OfficePromoBanks?.load(ids)||[];}catch(_){return [];}
 }
 function beginLoad(n,plan,cid){
  if(n.planningLoading?.plan===plan&&n.planningLoading.cid===cid&&n.stage==='meeting')return null;
  const token={plan,cid,choice:JSON.stringify(plan.structureChoice)};
  n.planningLoading=token;n.stage='meeting';return token;
 }
 function completeLoad(n,token,isCurrent){
  if(n.planningLoading!==token)return false;
  delete n.planningLoading;
  return n.stage==='meeting'&&n.plan===token.plan&&JSON.stringify(n.plan.structureChoice)===token.choice&&!n.plan.room&&isCurrent();
 }
 function freezeHuddle(room){
  const point=subject(room),identities=room.planningDialogue?.identities;
  if(!point||room.planningDialogue?.v!==1||!identities)return null;
  const used=[],lines={};
  for(const [key,turn,who] of [['request','request',point.requester],['response','response',other(point.requester)],['requesterResolution','resolution',point.requester],['partnerResolution','resolution',other(point.requester)]]){
   const line=compose(identities[who],point,turn,who,room.seed,{used});
   if(!line)return null;
   used.push(line.id);lines[key]=line;
  }
  return {v:1,point,lines};
 }
 // Only read a frozen line while the original proposal is still current.
 // Compare the entire subject and selected lines against the frozen
 // identity snapshot, not the network cache or live career personality.
 function readHuddle(room){
  const frozen=room?.structureTalk?.dialogue;
  if(frozen?.v!==1)return null;
  const current=freezeHuddle(room);
  return current&&JSON.stringify(current)===JSON.stringify(frozen)?frozen:null;
 }
 root.OfficePlanningDialogue=Object.freeze({capture,subject,compose,family,loadPair,beginLoad,completeLoad,freezeHuddle,readHuddle});
})(typeof window!=='undefined'?window:globalThis);
