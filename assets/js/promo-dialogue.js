/* THE OFFICE — authored promo dialogue contract (phase 5A).
   Content is data, not executable predicates. Selection is a separate layer.
   Facts are snapshotted at scene creation; no private booked result is exposed. */
(function(root){'use strict';
 const categories=Object.freeze(['opening','challenge','rebuttal','disrespect','respect','vulnerability','pressure','closing']);
 const targets=Object.freeze({open:['people','proof','imagery','accusation','swagger','hometown','numbers'],
  answer:['turn','personal','callback','calm','challenge','confession','fakeout'],
  push:['press','acknowledge','hold','leave','firm','revise'],
  close:['vow','finisher','clean','uncertainty','question','legacy','grateful']});
 const formats=['interview','callout','faceoff','address','mouthpiece'];
 const roles=['wrestler','manager','promoter'];
 const fields=['id','category','stage','action','side','text','when'];
 const conditions=['variants','formats','minAge','maxAge','minMeetings','titleMatch','hasMouthpiece','speakerStyle','opponentStyle','landed','minComposure','maxComposure','minIrritation','maxIrritation','subject'];
 const placeholders=['speaker','client','opponent','venue','finisher','strength'];
 // Only these narrowly reviewed variants may be rephrased. Exact variant ID is required.
 const approved=Object.freeze({open:{proof:['pr_tech','pr_brawl','pr_risk','pr_stall'],people:['p_working','p_short'],swagger:['sw_main','sw_pose']},answer:{calm:['ca_simple','ca_pro','ca_restraint'],turn:['tu_strength'],challenge:['ch_one_fall','ch_mat','ch_ground','ch_stay']},close:{vow:['vo_plain','vo_hard','vo_fans','vo_guarantee'],clean:['cl_middle','cl_hand'],uncertainty:['un_done','un_plan','un_see'],legacy:['le_plain']}});
 const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const string=v=>typeof v==='string'&&v.trim().length>0;
 const idPattern=/^[a-z0-9][a-z0-9_.-]*$/;
 const fail=m=>{throw Error('Dialogue contract: '+m);};
 const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object'&&!Object.isFrozen(v))freeze(v);return Object.freeze(o);};
 function validateLine(row,owner,seen){
  if(!row||typeof row!=='object'||Array.isArray(row))fail('invalid line for '+owner);
  for(const k of Object.keys(row))if(!fields.includes(k))fail('unknown field '+k);
  if(!string(row.id)||!idPattern.test(row.id)||seen.has(row.id))fail('duplicate or invalid line ID '+row.id);seen.add(row.id);
  if(!categories.includes(row.category)||!has(targets,row.stage)||!targets[row.stage].includes(row.action)||!['w','f'].includes(row.side))fail('invalid intent/slot '+row.id);
  if(!string(row.text)||row.text.length>500||/[\r\n<>]/.test(row.text))fail('invalid text '+row.id);
  const stripped=row.text.replace(/\{([a-z]+)\}/g,(_,k)=>{if(!placeholders.includes(k))fail('unknown placeholder '+k);return '';});
  if(/[{}]/.test(stripped))fail('malformed placeholder '+row.id);
  const when=row.when||{};if(typeof when!=='object'||Array.isArray(when))fail('invalid conditions '+row.id);
  for(const [k,v] of Object.entries(when)){
   if(!conditions.includes(k))fail('unknown condition '+k);
   if(k==='variants'){if(!Array.isArray(v)||!v.length||v.some(x=>!(approved[row.stage]?.[row.action]||[]).includes(x)))fail('unapproved variant condition '+row.id);}
   else if(k==='formats'){if(!Array.isArray(v)||!v.length||v.some(x=>!formats.includes(x)))fail('invalid format condition');}
   else if(k==='titleMatch'||k==='hasMouthpiece'||k==='landed'){if(typeof v!=='boolean')fail('invalid boolean '+k);}
   else if(k==='speakerStyle'||k==='opponentStyle'||k==='subject'){if(!string(v))fail('invalid string '+k);}
   else if(!Number.isFinite(v)||v<0||(k==='minMeetings'&&!Number.isInteger(v))||(/Composure|Irritation/.test(k)&&v>100))fail('invalid number '+k);
  }
  for(const [min,max] of [['minAge','maxAge'],['minComposure','maxComposure'],['minIrritation','maxIrritation']])if(has(when,min)&&has(when,max)&&when[min]>when[max])fail('inverted range '+row.id);
  return freeze({...row,when:Object.fromEntries(Object.entries(when).map(([k,v])=>[k,Array.isArray(v)?v.slice():v]))});
 }
 function catalogue(packs=[]){
  const owners=new Map(),seen=new Set();
  for(const pack of packs){
   if(!pack||!roles.includes(pack.role)||!string(pack.owner)||!idPattern.test(pack.owner)||!Array.isArray(pack.lines))fail('invalid pack');
   const key=pack.role+':'+pack.owner;
   if(owners.has(key))fail('duplicate pack '+key);
   const slots=new Map(),lines=pack.lines.map(row=>validateLine(row,key,seen));
   for(const line of lines){const slot=[line.stage,line.action,line.side].join('|');if(!slots.has(slot))slots.set(slot,[]);slots.get(slot).push(line);}
   owners.set(key,{lines:Object.freeze(lines),slots});
  }
  return Object.freeze({
   lines:(role,owner)=>owners.get(role+':'+owner)?.lines||Object.freeze([]),
   candidates:(ctx)=>{
    if(!ctx||(ctx.protected&&ctx.protected!=='contextual-variant'))return [];
    const pack=owners.get(ctx.speaker.role+':'+ctx.speaker.id);
    return (pack?.slots.get([ctx.stage,ctx.action,ctx.side].join('|'))||[]).filter(row=>matches(row,ctx));
   },
   coverage:()=>Array.from(owners,([owner,p])=>({owner,total:p.lines.length,byCategory:Object.fromEntries(categories.map(k=>[k,p.lines.filter(l=>l.category===k).length]))}))
  });
 }
 // Compose independently authored batches without changing stable line IDs.
 function combine(...batches){
  const owners=new Map();for(const pack of batches.flat()){
   const key=pack.role+':'+pack.owner;if(!owners.has(key))owners.set(key,{owner:pack.owner,role:pack.role,lines:[]});
   owners.get(key).lines.push(...pack.lines);
  }return [...owners.values()];
 }
 function actor(w){
  const voice=root.OfficePromoIdentity?.bankId?.(w)||w.id;
  return {id:voice,role:'wrestler',short:w.short||w.name||null,age:Number.isFinite(w.age)?w.age:null,style:w.style||null,finisher:w.finisher||null};
 }
 function snapshot(c,w,f,m,p,core){
  return {v:1,client:actor(w),player:actor(m||w),opponent:actor(f),venue:p?.venue||null,titleMatch:!!c.title,
   hasMouthpiece:!!m,meetings:Number.isInteger(core.record?.n)?core.record.n:null};
 }
 function context(st,stage,action,side,{landed=null,variant=null,recorded=false}={}){
  const s=st.dialogueFacts;if(!s)return null;
  const player=side==='w',speaker=player?s.player:s.opponent,opponent=player?s.opponent:s.client;
  const emotion=player?st.director?.player:st.director?.opponent;
  // Retain core text for factual cases, variants with their own promises/motifs,
  // and all closing commitments until the selector can prove semantic equivalence.
  const protectedReason=recorded||st.core.case?'recorded-argument':st.core.claim?.hasEvidence?'recorded-evidence':
    stage==='close'&&!(approved.close[action]||[]).includes(variant)?'closing-contract':stage==='open'&&action==='proof'&&st.core.claim?.planFocus==='counter'?'specific-match-plan':variant?'contextual-variant':stage==='open'&&action==='imagery'?'motif':null;
  return {stage,action,side,speaker,opponent,client:s.client,venue:s.venue,titleMatch:s.titleMatch,
   hasMouthpiece:s.hasMouthpiece,meetings:s.meetings,format:st.director?.format||null,
   subject:st.director?.subject||st.core.claim?.opening||null,landed,variant,
   strength:st.core.claim?.strength||null,opening:st.core.claim?.opening||null,
   voice:root.OfficeRoom?.VOICE?.[speaker.id]||null,stance:(player?st.director?.player:st.director?.opponent)?.stance||null,
   composure:emotion?.composure??null,irritation:emotion?.irritation??null,
   protected:protectedReason,previous:st.log.filter(e=>e.side==='w'||e.side==='f').at(-1)?.line||null};
 }
 function matches(row,c){
  const w=row.when;
  if(c.protected==='contextual-variant'&&(!w.variants||!w.variants.includes(c.variant)))return false;
  if(has(w,'variants')&&!w.variants.includes(c.variant))return false;
  const min=(value,limit)=>value!==null&&value!==undefined&&value>=limit;
  const max=(value,limit)=>value!==null&&value!==undefined&&value<=limit;
  if(has(w,'formats')&&!w.formats.includes(c.format))return false;
  for(const [k,v] of [['titleMatch',c.titleMatch],['hasMouthpiece',c.hasMouthpiece],['landed',c.landed],['speakerStyle',c.speaker.style],['opponentStyle',c.opponent.style],['subject',c.subject]])if(has(w,k)&&w[k]!==v)return false;
  for(const [k,v,fn] of [['minAge',c.speaker.age,min],['maxAge',c.speaker.age,max],['minMeetings',c.meetings,min],['minComposure',c.composure,min],['maxComposure',c.composure,max],['minIrritation',c.irritation,min],['maxIrritation',c.irritation,max]])if(has(w,k)&&!fn(v,w[k]))return false;
  return render(row,c)!==null;
 }
 // Plural noun phrase contract, including legacy saved claims.
 const strengthPhrase=value=>value==='wrestling'?'wrestling techniques':value;
 function render(row,c){
  const values={strength:strengthPhrase(c.strength),speaker:c.speaker.short,client:c.client.short,opponent:c.opponent.short,venue:c.venue,finisher:c.side==='f'?c.speaker.finisher:c.client.finisher};
  let missing=false;const line=row.text.replace(/\{([a-z]+)\}/g,(_,k)=>{const v=values[k];if(!string(v)){missing=true;return '';}return v;});
  return missing?null:line;
 }
 // Relevance precedes a stable seeded tie-break, but a fresh eligible line always beats a repeated one.
 function hash(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
 function select(cat,ctx,seed,{used=[],recent=[]}={}){
  const options=cat.candidates(ctx).filter(r=>!used.includes(r.id));
  if(!options.length)return null;
  const fresh=options.filter(r=>!recent.includes(r.id));
  // Do not repeat an authored line on consecutive appearances just to meet coverage. Fall back.
  if(!fresh.length)return null;
  const ranked=fresh.map(r=>({r,score:Object.keys(r.when).filter(k=>k!=='variants'&&k!=='hasMouthpiece').length,tie:hash(seed+'|'+r.id)})).sort((a,b)=>b.score-a.score||a.tie-b.tie||a.r.id.localeCompare(b.r.id));
  const row=ranked[0].r;return {id:row.id,text:render(row,ctx)};
 }
 // A bounded compositional fallback: preserve the actual claim, vary the delivery.
 const replyFrames={
  precise:['I am not disputing your {strength}. Solving that problem is my job.','Then the question is how I deal with your {strength}. I intend to answer it in the ring.'],
  grand:['You have made quite a case for your {strength}. The interesting part is what happens when I answer them.','Very well. I have your {strength} as the opposition, not the conclusion.'],
  gruff:['Your {strength}. I heard you. Now let me get through that.','I know what your {strength} can do. I still have a match to win.'],
  stoic:['I understand. I have to get past your {strength}.','No point denying your {strength}. I will deal with them.'],
  eager:['Right, your {strength}. That is the bit I want to get around. Watch how.','I know you have {strength}. That is what makes this a match worth having.'],
  earnest:['I respect your {strength}. I want to show these people that I have an answer to them.','I am not asking anybody to ignore your {strength}. I am asking for the chance to answer them.'],
  sermon:['A person can be proud of their {strength} and still find they are not enough. I have to show you why.','I will not deny you your {strength}. Let the contest reveal what they are worth.'],
  slippery:['So your argument is your {strength}. Fine. Now consider what happens when they are not enough.','I am happy to grant you your {strength}. I am less happy to grant you the result.']
 };
 const topics={proof:'what you can actually do in the ring',people:'what we owe the people watching',swagger:'who earns the attention',accusation:'the charge itself',hometown:'the people in this hall',numbers:'the point behind those numbers',imagery:'the point behind that image'};
 const pressFrames={precise:['Can we deal with {topic} before we move on?','That is a different question. Come back to {topic}.'],grand:['The matter at issue is {topic}. Let us not lose sight of it.','Very entertaining. I would prefer an answer about {topic}.'],gruff:['No. We were talking about {topic}. Finish that.','Stick to {topic}. Give me an answer.'],stoic:['We are still talking about {topic}.','Answer the point about {topic}.'],eager:['Hang on. I want to hear the rest about {topic}.','Wait a second. We have not finished with {topic}.'],earnest:['I want us both to be clear about {topic}.','Before we finish, can we come back to {topic}?'],sermon:['Let us not avoid the question of {topic}.','We should settle what we mean by {topic}.'],slippery:['Interesting. But I was asking about {topic}.','Let us keep this to {topic}, shall we?']};
 const agreeFrames={precise:['That is a fair point. The contest remains unresolved.','I can accept that observation without conceding the result.'],grand:['I shall grant you that much. The evening is still ours to contest.','A fair concession. Now the wrestling can decide the rest.'],gruff:['Fair. We will settle the rest in there.','All right. I heard you.'],stoic:['Fair enough. See you at the bell.','I can accept that.'],eager:['Right! We agree on that much. Now let us wrestle.','Fair. That gives us something to work with.'],earnest:['I hear you. We still have to give them a match.','That is fair. I can respect that and still want the win.'],sermon:['There is no shame in acknowledging a fair point.','Then we can settle the rest by wrestling.'],slippery:['I will grant you that particular point.','Fair enough. The result is another matter.']};
 function compose(ctx,seed,{used=[],recent=[]}={}){
  if(!ctx||ctx.hasMouthpiece||!ctx.previous)return null;
  const exactTurn=ctx.stage==='answer'&&ctx.action==='turn'&&ctx.side==='w'&&ctx.variant==='tu_strength'&&ctx.protected==='contextual-variant';
  const push=ctx.stage==='push'&&!ctx.protected&&['press','acknowledge'].includes(ctx.action);
  if(!exactTurn&&!push)return null;
  const family=replyFrames[ctx.voice]?ctx.voice:({analytical:'precise',reserved:'stoic',combative:'gruff',adaptive:'earnest'}[ctx.stance]||'earnest');
  const kind=exactTurn?'turn':ctx.action;
  const frames=exactTurn?replyFrames[family]:ctx.action==='press'&&ctx.side==='w'?pressFrames[family]:ctx.action==='acknowledge'?agreeFrames[family]:null;
  if(!frames||(exactTurn&&!ctx.strength)||(kind==='press'&&!topics[ctx.opening]))return null;
  const pool=frames.map((frame,i)=>({id:'composition.'+ctx.speaker.id+'.'+kind+'.'+(kind==='press'?ctx.opening+'.':'')+i,text:frame.replace('{strength}',strengthPhrase(ctx.strength)||'').replace('{topic}',topics[ctx.opening]||'')})).filter(x=>!used.includes(x.id)&&!recent.includes(x.id));
  if(!pool.length)return null;
  return {...pool[hash(seed+'|composition')%pool.length],composed:true};
 }
 function recentIds(rival,history=[]){
  const ids=[...(rival?.lastPromo?.dialogueIds||[])];
  for(const h of history.slice(0,12))for(const e of h.promo?.dialogue||[]){if(typeof e.authoredId==='string')ids.push(e.authoredId);if(typeof e.composedId==='string')ids.push(e.composedId);}
  return [...new Set(ids)].slice(0,128);
 }
 function tag(ctx){return ctx?{owner:ctx.speaker.id,role:ctx.speaker.role,stage:ctx.stage,action:ctx.action,side:ctx.side,protected:ctx.protected||null}:null;}
 root.OfficePromoDialogue=Object.freeze({categories,targets:freeze(targets),catalogue,combine,snapshot,context,render,tag,select,compose,recentIds});
})(typeof window!=='undefined'?window:globalThis);
