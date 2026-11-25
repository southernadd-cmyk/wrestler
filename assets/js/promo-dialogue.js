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
 // Reviewed generic acknowledgement lines. Exact text matching prevents a
 // future bank edit from inheriting approval. Selection remains owner/slot scoped.
 const neutralAcknowledgements={w:new Set(["I accept that particular point; nothing further.","Fair. Fair credit to you.","All right, I see what you mean. Fair.","I'll take that point.","Yes. That's a fair point.","I can accept that. I still believe in what I'm doing.","That's fair. I'll take that on board.","All right, that's a good point. That point is yours.","That will do, then. I'll give you that one.","That's a fair point. I won't argue with it.","Reasonable enough. I can work with that.","Fair, I suppose.","I can see the merit in that. My position hasn't changed.","I'll give you that one. No point pretending otherwise.","I accept that correction.","That point is valid. I accept it.","Fair point.","I'll grant you that. Don't get carried away.","That observation is correct. I'll concede it.","Credit where it is due. The rest is still to come.","Fair point. Let us turn it into something useful.","Noted, in your own words.","Yeah, fair point. Let's keep going.","Noted. Next.","Fair, my call. Move on.","Point taken. That term stands.","Noted. That is a point I will keep.","Agreed, for the moment. We will keep it straight.","Very fair, then. I respect that.","Your point is taken. I will take that on board.","Got it, point taken! I hear you. Let us get on.","Yep, fair, yep! Got it. Right.","A fair observation. I shall concede it without conceding the evening.","I will grant you that point. You may find the rest of my argument considerably less accommodating.","Fair, and short. I will give you that.","That is a fair correction. It does not change what I have to do at the bell."]),f:new Set(["Concession noted. We can proceed.","Right. That's settled.","Good. Now we can get on with the exciting bit.","Good. That's enough.","Okay. We understand each other.","Good. Let's give them a match.","Alright, let's see. I'll see you at the bell.","Good enough for me.","Good. That's a useful place to leave it.","Good. Now we have a contest.","Good. Now let's get moving.","Right. That's done.","Good. We can move on from that.","Good. We've got that sorted.","Agreed. We can proceed.","Then we have resolved that matter.","Good. On with it.","Wonderful. Let's leave it there.","Then the question is resolved.","Let us call that agreed. We can settle the rest at the bell, sensibly.","I will grant you that, with a bow. The bell is calling.","Noted. The bell, then.","Fair, done. Bell, then.","Understood. We will test it at the bell.","Understood. We sort the rest out at the bell.","Fair point, that. I will take it. We will sort the rest out at the bell.","I will let that stand. We will settle it at the bell.","Noted, got it! Bell time, see you!","Understood. Bell.","Accepted. We can dispense with the rest of the speeches.","Right. See you out there.","Then we have something we can test in the ring.","At last, a point of agreement. Let us not spoil it."])};
 function select(cat,ctx,seed,{used=[],recent=[],candidateFilter=null}={}){
  const options=cat.candidates(ctx).filter(r=>!used.includes(r.id)&&(!candidateFilter||candidateFilter(r)));
  if(!options.length)return null;
  const fresh=options.filter(r=>!recent.includes(r.id));
  // Do not repeat an authored line on consecutive appearances just to meet coverage. Fall back.
  if(!fresh.length)return null;
  const ranked=fresh.map(r=>({r,score:Object.keys(r.when).filter(k=>k!=='variants'&&k!=='hasMouthpiece').length,tie:hash(seed+'|'+r.id)})).sort((a,b)=>b.score-a.score||a.tie-b.tie||a.r.id.localeCompare(b.r.id));
  const row=ranked[0].r;return {id:row.id,text:render(row,ctx)};
 }
 function selectAcknowledgement(cat,ctx,seed,mem){
  if(!ctx||ctx.stage!=='push'||ctx.action!=='acknowledge'||ctx.protected||ctx.hasMouthpiece)return null;
  return select(cat,ctx,seed,{...mem,candidateFilter:r=>neutralAcknowledgements[ctx.side]?.has(r.text)});
 }
 // Exact-text review for substantive responses. These strength lines only
 // answer a genuinely spoken strength, never a style-derived estimate.
 const reviewedStrength=new Set(["You have identified {strength}. I will not dispute the existence of the problem; I will dispute its outcome.","Let the record show that your advantage is {strength}. It is the point on which I intend to cross-examine you.","Your {strength}. That's what I've got to get through.","I know what you've got: {strength}. Let's see if it's enough.","I heard you: {strength}. I've got to work out the moment when I can get past that.","Your {strength}. I'll have to get round that.","No use pretending those {strength} aren't there. I'll deal with them.","Right. Your {strength}. I know what I need to work against.","I don't need to dismiss your {strength}. I need an answer to them.","You've told me about your {strength}. I have to respect that and find a way through it.","I'm not going to pretend those {strength} don't matter. I'm asking for the chance to answer them.","I heard the bit about your {strength}. That's the bit I'll have to work around.","You've named your {strength}. Fine. That's what I've prepared to deal with.","You've got {strength}. I know what I've got to get past, and I'm looking forward to it.","I have to deal with your {strength} in this match. I need to find a rhythm that gets around that.","Your {strength}. Right. That's what I'll work against.","Can't ignore your {strength}. Need a way through.","You named {strength}. That gives me a specific problem to solve, which is what I wanted.","Your {strength}. I'll have to find a way to keep working around that.","I won't pretend I can just shrug off your {strength}.","I acknowledge your {strength}. I will not let them dictate my decisions.","You have identified {strength}. My task is to formulate and demonstrate the correct response.","Your {strength}. Fine. That's what I've got to get through.","I know what you can do with those {strength}. I'll have to answer them.","Your {strength}. Yes, I was listening. I'll arrange my performance around the obstacle.","I don't intend to pretend your {strength} aren't impressive. I intend to make something more memorable happen.","You have identified {strength}. That is the variable I will have to control.","I don't dispute your {strength}. I dispute the assumption that they are sufficient.","Those {strength}. That's the bit I've got to find a way through.","I heard the warning about your {strength}. I intend to be ready for it.","Your {strength} will be tested tonight, and I will be the one doing the testing.","I have noted your {strength}. Now prove it.","I cannot afford to ignore your {strength} in this match. Knowing that is a useful starting point.","You have told me to prepare for {strength}. Good. I would rather work on an actual problem than trade insults.","You have identified your own advantage: {strength}. That saves me the trouble of establishing what I need to take away.","Very good. We have established your preferred method: {strength}. Now we can test whether it is sufficient.","I have been thinking about your {strength}. I want to find a way round it, honestly.","I have been thinking about your {strength}, and I want to find a way to meet it that keeps everybody safe.","I have been trying to understand your {strength}. I'll be honest, it's a lot to learn.","I have noted your {strength}. Now do something with it."]);
 const reviewedPress=new Set(["Answer me. Once will do.","Hold on. I want to hear your answer to that.","Wait! I want to hear the rest of that answer.","Answer that first, please.","Answer. Answer.","Could you answer, please? I am trying. I will wait, and I will keep trying too.","Answer, please. I am sure you have a good reason. Give it.","I wonder if the question is still open. I would really like your answer, if you have one.","Answer, when you are ready. I will wait a little longer.","Hold on. Finish what you were saying."]);
 // Editorial semantic eligibility for EXISTING bank rows. IDs and exact
 // fingerprints are reviewed together: changing the bank text requires
 // re-review. No copied speech, no new bank or parallel character corpus.
 const reviewedBankReuse=freeze({
 "mara.c1.01": [
  781101067,
  "takedown"
 ],
 "mara.c1.02": [
  2556439235,
  "strike"
 ],
 "mara.c1.03": [
  4256410600,
  "air"
 ],
 "mara.c1.06": [
  1183737087,
  "unclassified",
  "proof"
 ],
 "mara.c1.09": [
  1571843814,
  "takedown"
 ],
 "mara.c1.10": [
  495515028,
  "strike"
 ],
 "rex.c1.01": [
  3067784965,
  "takedown"
 ],
 "rex.c1.02": [
  1582369817,
  "strike"
 ],
 "rex.c1.03": [
  2752109435,
  "air"
 ],
 "rex.c1.06": [
  3618180879,
  "unclassified",
  "proof"
 ],
 "rex.c1.09": [
  2526948939,
  "takedown"
 ],
 "rex.c1.10": [
  4246727228,
  "strike"
 ],
 "rex.c1.11": [
  3847079226,
  "air"
 ],
 "rex.c1.12": [
  3024207060,
  "pace"
 ],
 "lyra.c1.01": [
  1245238294,
  "takedown"
 ],
 "lyra.c1.02": [
  2916131965,
  "strike"
 ],
 "lyra.c1.03": [
  1891247984,
  "air"
 ],
 "lyra.c1.06": [
  1321059184,
  "unclassified",
  "proof"
 ],
 "lyra.c1.09": [
  4128462228,
  "takedown"
 ],
 "lyra.c1.10": [
  4031701264,
  "strike"
 ],
 "lyra.c1.11": [
  3792426287,
  "air"
 ],
 "lyra.c1.12": [
  3603644462,
  "pace"
 ],
 "brick.c1.01": [
  2047071922,
  "takedown"
 ],
 "brick.c1.02": [
  3477574630,
  "strike"
 ],
 "brick.c1.03": [
  3371257530,
  "air"
 ],
 "brick.c1.06": [
  3708845199,
  "unclassified",
  "proof"
 ],
 "brick.c1.09": [
  836816876,
  "takedown"
 ],
 "brick.c1.10": [
  2587665649,
  "strike"
 ],
 "brick.c1.11": [
  3572036076,
  "air"
 ],
 "brick.c1.12": [
  3940819181,
  "pace"
 ],
 "juno.c1.01": [
  289604034,
  "takedown"
 ],
 "juno.c1.02": [
  1283269952,
  "strike"
 ],
 "juno.c1.03": [
  2903600869,
  "air"
 ],
 "juno.c1.04": [
  2170445148,
  "pace"
 ],
 "juno.c1.06": [
  207794897,
  "unclassified",
  "proof"
 ],
 "juno.c1.09": [
  1402457515,
  "takedown"
 ],
 "juno.c1.10": [
  1094933285,
  "strike"
 ],
 "juno.c1.11": [
  373730793,
  "air"
 ],
 "juno.c1.12": [
  1271543055,
  "pace"
 ],
 "sol.c1.01": [
  3573059156,
  "takedown"
 ],
 "sol.c1.02": [
  3816225581,
  "strike"
 ],
 "sol.c1.03": [
  3709928053,
  "air"
 ],
 "sol.c1.06": [
  3204191442,
  "unclassified",
  "proof"
 ],
 "sol.c1.09": [
  3483098161,
  "takedown"
 ],
 "sol.c1.10": [
  2046815255,
  "strike"
 ],
 "sol.c1.11": [
  131136945,
  "air"
 ],
 "sol.c1.12": [
  1239550691,
  "pace"
 ],
 "dee.c1.01": [
  1866821093,
  "takedown"
 ],
 "dee.c1.02": [
  2333233161,
  "strike"
 ],
 "dee.c1.03": [
  2191547946,
  "air"
 ],
 "dee.c1.06": [
  1399094145,
  "unclassified",
  "proof"
 ],
 "dee.c1.09": [
  3682813492,
  "takedown"
 ],
 "dee.c1.10": [
  2472216265,
  "strike"
 ],
 "dee.c1.11": [
  3842049285,
  "air"
 ],
 "dee.c1.12": [
  1923028337,
  "pace"
 ],
 "kit.c1.01": [
  4247490488,
  "takedown"
 ],
 "kit.c1.02": [
  3866797646,
  "strike"
 ],
 "kit.c1.03": [
  1347078699,
  "air"
 ],
 "kit.c1.06": [
  1636805805,
  "unclassified",
  "proof"
 ],
 "kit.c1.09": [
  2667314880,
  "takedown"
 ],
 "kit.c1.10": [
  1528911639,
  "strike"
 ],
 "kit.c1.11": [
  459468110,
  "air"
 ],
 "kit.c1.12": [
  2424258969,
  "pace"
 ],
 "dax.c1.01": [
  3932370986,
  "takedown"
 ],
 "dax.c1.02": [
  4157859047,
  "strike"
 ],
 "dax.c1.03": [
  952573254,
  "air"
 ],
 "dax.c1.04": [
  3694372730,
  "pace"
 ],
 "dax.c1.06": [
  3893685910,
  "unclassified",
  "proof"
 ],
 "dax.c1.09": [
  3830134973,
  "takedown"
 ],
 "dax.c1.10": [
  2554070090,
  "strike"
 ],
 "dax.c1.11": [
  1391590573,
  "air"
 ],
 "dax.c1.12": [
  30028805,
  "pace"
 ],
 "val.c1.01": [
  4017852299,
  "takedown"
 ],
 "val.c1.02": [
  3196848695,
  "strike"
 ],
 "val.c1.03": [
  2064477149,
  "air"
 ],
 "val.c1.04": [
  2564090540,
  "pace"
 ],
 "val.c1.06": [
  597970885,
  "unclassified",
  "proof"
 ],
 "val.c1.09": [
  2711532990,
  "takedown"
 ],
 "val.c1.10": [
  148068954,
  "strike"
 ],
 "val.c1.11": [
  3917676114,
  "air"
 ],
 "val.c1.12": [
  2187384620,
  "pace"
 ],
 "nico.c2.02": [
  2590627584,
  "strike"
 ],
 "nico.c2.03": [
  3013405886,
  "air"
 ],
 "nico.c2.06": [
  450966178,
  "unclassified",
  "proof"
 ],
 "nico.c2.09": [
  3255969444,
  "takedown"
 ],
 "nico.c2.10": [
  1594769193,
  "strike"
 ],
 "nico.c2.11": [
  391121842,
  "air"
 ],
 "nico.c2.12": [
  4071269889,
  "pace"
 ],
 "cal.c2.01": [
  1307768872,
  "takedown"
 ],
 "cal.c2.02": [
  2840443887,
  "strike"
 ],
 "cal.c2.03": [
  355090316,
  "air"
 ],
 "cal.c2.04": [
  507510745,
  "pace"
 ],
 "cal.c2.06": [
  3431083264,
  "unclassified",
  "proof"
 ],
 "cal.c2.09": [
  1406014473,
  "takedown"
 ],
 "cal.c2.10": [
  2221951913,
  "strike"
 ],
 "cal.c2.11": [
  2517031984,
  "air"
 ],
 "cal.c2.12": [
  607775119,
  "pace"
 ],
 "imani.c2.01": [
  3335959937,
  "takedown"
 ],
 "imani.c2.02": [
  3912702430,
  "strike"
 ],
 "imani.c2.03": [
  2610844532,
  "air"
 ],
 "imani.c2.04": [
  3994358733,
  "pace"
 ],
 "imani.c2.06": [
  803463426,
  "unclassified",
  "proof"
 ],
 "imani.c2.09": [
  1176859680,
  "takedown"
 ],
 "imani.c2.10": [
  3441415024,
  "strike"
 ],
 "imani.c2.11": [
  2283801370,
  "air"
 ],
 "imani.c2.12": [
  3416833430,
  "pace"
 ],
 "otis.c2.01": [
  3166036033,
  "takedown"
 ],
 "otis.c2.02": [
  1082668547,
  "strike"
 ],
 "otis.c2.03": [
  773189455,
  "air"
 ],
 "otis.c2.06": [
  3922265053,
  "unclassified",
  "proof"
 ],
 "otis.c2.09": [
  2906819687,
  "takedown"
 ],
 "otis.c2.10": [
  1475284722,
  "strike"
 ],
 "otis.c2.11": [
  1534566665,
  "air"
 ],
 "otis.c2.12": [
  3372300536,
  "pace"
 ],
 "kira.c2.01": [
  2460206368,
  "takedown"
 ],
 "kira.c2.02": [
  1854933910,
  "strike"
 ],
 "kira.c2.03": [
  1658725488,
  "air"
 ],
 "kira.c2.06": [
  2934028654,
  "unclassified",
  "proof"
 ],
 "kira.c2.09": [
  1900404605,
  "takedown"
 ],
 "kira.c2.10": [
  145378666,
  "strike"
 ],
 "kira.c2.11": [
  44660624,
  "air"
 ],
 "kira.c2.12": [
  402268280,
  "pace"
 ],
 "ezra.c2.01": [
  51253724,
  "takedown"
 ],
 "ezra.c2.02": [
  2111136177,
  "strike"
 ],
 "ezra.c2.03": [
  995703843,
  "air"
 ],
 "ezra.c2.04": [
  3305832571,
  "pace"
 ],
 "ezra.c2.06": [
  3425149549,
  "unclassified",
  "proof"
 ],
 "ezra.c2.09": [
  2809790739,
  "takedown"
 ],
 "ezra.c2.10": [
  2984756534,
  "strike"
 ],
 "ezra.c2.11": [
  2897633008,
  "air"
 ],
 "ezra.c2.12": [
  3175849101,
  "pace"
 ],
 "red.c2.01": [
  2503235826,
  "takedown"
 ],
 "red.c2.02": [
  896918336,
  "strike"
 ],
 "red.c2.03": [
  3872959444,
  "air"
 ],
 "red.c2.04": [
  64133976,
  "pace"
 ],
 "red.c2.06": [
  2537594110,
  "unclassified",
  "proof"
 ],
 "red.c2.09": [
  2832011552,
  "takedown"
 ],
 "red.c2.10": [
  3899712226,
  "strike"
 ],
 "red.c2.11": [
  2868064101,
  "air"
 ],
 "red.c2.12": [
  1296677792,
  "pace"
 ],
 "roxy.c2.01": [
  149982654,
  "takedown"
 ],
 "roxy.c2.02": [
  2304544158,
  "strike"
 ],
 "roxy.c2.03": [
  57814866,
  "air"
 ],
 "roxy.c2.04": [
  1937137608,
  "pace"
 ],
 "roxy.c2.06": [
  3110873044,
  "unclassified",
  "proof"
 ],
 "roxy.c2.09": [
  894351280,
  "takedown"
 ],
 "roxy.c2.10": [
  911301869,
  "strike"
 ],
 "roxy.c2.11": [
  195650404,
  "air"
 ],
 "roxy.c2.12": [
  2742080597,
  "pace"
 ],
 "silas.c2.01": [
  1412450707,
  "takedown"
 ],
 "silas.c2.02": [
  1987881124,
  "strike"
 ],
 "silas.c2.03": [
  1088127336,
  "air"
 ],
 "silas.c2.04": [
  82844572,
  "pace"
 ],
 "silas.c2.06": [
  1421966466,
  "unclassified",
  "proof"
 ],
 "silas.c2.09": [
  3728898652,
  "takedown"
 ],
 "silas.c2.10": [
  92318990,
  "strike"
 ],
 "silas.c2.11": [
  1990103776,
  "air"
 ],
 "silas.c2.12": [
  2134980690,
  "pace"
 ],
 "night.c2.01": [
  1879859967,
  "takedown"
 ],
 "night.c2.02": [
  3856354336,
  "strike"
 ],
 "night.c2.03": [
  1043151961,
  "air"
 ],
 "night.c2.04": [
  3569176919,
  "pace"
 ],
 "night.c2.06": [
  4078274093,
  "unclassified",
  "proof"
 ],
 "night.c2.09": [
  713431032,
  "takedown"
 ],
 "night.c2.10": [
  1473923943,
  "strike"
 ],
 "night.c2.11": [
  3121484897,
  "air"
 ],
 "night.c2.12": [
  1125408618,
  "pace"
 ],
 "malik.c3.04": [
  1374369785,
  "pace"
 ],
 "zara.c3.06": [
  2564666776,
  "unclassified",
  "proof"
 ],
 "aisha.c3.04": [
  1015362430,
  "pace"
 ],
 "ellis.c4.02": [
  1988332508,
  "strike"
 ],
 "ivo.c4.02": [
  345002588,
  "strike"
 ],
 "ivo.c4.04": [
  1674643766,
  "pace"
 ],
 "nate.c4.04": [
  835085793,
  "pace"
 ],
 "jun.c4.02": [
  1386162908,
  "strike"
 ],
 "jun.c4.04": [
  2775633654,
  "pace"
 ],
 "kofi.c4.06": [
  2824784845,
  "unclassified",
  "proof"
 ],
 "theo.c5.06": [
  3986748623,
  "unclassified",
  "proof"
 ],
 "soraya.c5.04": [
  3595324762,
  "pace"
 ],
 "cedric.c6.04": [
  1301219191,
  "pace"
 ],
 "felix.c6.06": [
  2025219950,
  "unclassified",
  "proof"
 ],
 "vera.c6.04": [
  555974476,
  "pace"
 ],
 "kezia.c6.06": [
  3521115974,
  "unclassified",
  "proof"
 ],
 "dev.c7.04": [
  373342714,
  "pace"
 ],
 "liya.c7.04": [
  4077651197,
  "pace"
 ],
 "leandro.c7.04": [
  3034997730,
  "pace"
 ],
 "noelle.c8.06": [
  4070809946,
  "unclassified",
  "proof"
 ],
 "ash.c8.04": [
  2437734421,
  "pace"
 ],
 "zane.c8.06": [
  1218327600,
  "unclassified",
  "proof"
 ],
 "elodie.c8.06": [
  2208428046,
  "unclassified",
  "proof"
 ],
 "cleo.c8.04": [
  492825037,
  "pace"
 ],
 "cleo.c8.06": [
  229890791,
  "unclassified",
  "proof"
 ],
 "mara.pilot.01": [
  1230296177,
  "takedown"
 ],
 "mara.pilot.02": [
  24709935,
  "strike"
 ],
 "mara.pilot.03": [
  394736871,
  "air"
 ],
 "brick.pilot.01": [
  2341733886,
  "strike"
 ],
 "brick.pilot.02": [
  954520680,
  "takedown"
 ],
 "brick.pilot.03": [
  655985937,
  "air"
 ],
 "brick.pilot.04": [
  2397606256,
  "pace"
 ],
 "brick.pilot.06": [
  4027282271,
  "proof",
  "unclassified"
 ],
 "nova.pilot.01": [
  3518262105,
  "takedown"
 ],
 "nova.pilot.02": [
  4090698935,
  "strike"
 ],
 "nova.pilot.03": [
  1544720334,
  "air"
 ],
 "nova.pilot.04": [
  3184571248,
  "pace"
 ],
 "magnus.pilot.01": [
  2459425831,
  "takedown"
 ],
 "magnus.pilot.02": [
  1248500426,
  "strike"
 ]
});
 // Full-roster editorial extension. The same bank IDs remain the source;
 // v1 snapshots retain the original approved set and selection ordering.
 const bankReuseExtension=freeze({
 "mara.c1.05": [
  3593518431,
  "shared_effort"
 ],
 "mara.c1.13": [
  1561536097,
  "shared_effort"
 ],
 "rex.c1.05": [
  1734767211,
  "shared_effort"
 ],
 "rex.c1.13": [
  3857395091,
  "shared_effort"
 ],
 "rex.c1.07": [
  1650129344,
  "status"
 ],
 "rex.c1.06": [
  3618180879,
  "effort",
  "talking"
 ],
 "lyra.c1.05": [
  4092803269,
  "shared_effort"
 ],
 "lyra.c1.13": [
  956022457,
  "shared_effort"
 ],
 "lyra.c1.06": [
  1321059184,
  "effort",
  "talking"
 ],
 "brick.c1.05": [
  3746931275,
  "shared_effort"
 ],
 "brick.c1.13": [
  1299375786,
  "shared_effort"
 ],
 "brick.c1.07": [
  2232711256,
  "status"
 ],
 "brick.c1.06": [
  3708845199,
  "effort",
  "talking"
 ],
 "juno.c1.05": [
  4047335445,
  "shared_effort"
 ],
 "juno.c1.13": [
  4212448296,
  "shared_effort"
 ],
 "juno.c1.07": [
  45946575,
  "status"
 ],
 "juno.c1.06": [
  207794897,
  "effort",
  "talking"
 ],
 "sol.c1.05": [
  748423233,
  "shared_effort"
 ],
 "sol.c1.13": [
  3512099307,
  "shared_effort"
 ],
 "sol.c1.07": [
  2469911262,
  "status"
 ],
 "sol.c1.06": [
  3204191442,
  "effort",
  "talking"
 ],
 "dee.c1.05": [
  813997581,
  "shared_effort"
 ],
 "dee.c1.13": [
  703836363,
  "shared_effort"
 ],
 "dee.c1.07": [
  772282711,
  "status"
 ],
 "dee.c1.06": [
  1399094145,
  "effort",
  "talking"
 ],
 "kit.c1.05": [
  1794278516,
  "shared_effort"
 ],
 "kit.c1.13": [
  3020443233,
  "shared_effort"
 ],
 "kit.c1.06": [
  1636805805,
  "effort",
  "talking"
 ],
 "dax.c1.05": [
  1337913915,
  "shared_effort"
 ],
 "dax.c1.13": [
  1848776938,
  "shared_effort",
  "effort"
 ],
 "dax.c1.06": [
  3893685910,
  "effort",
  "talking"
 ],
 "val.c1.05": [
  2596806422,
  "shared_effort"
 ],
 "val.c1.13": [
  971487611,
  "shared_effort"
 ],
 "val.c1.07": [
  3688229333,
  "status"
 ],
 "val.c1.06": [
  597970885,
  "effort",
  "talking"
 ],
 "nico.c2.05": [
  3083709403,
  "shared_effort"
 ],
 "nico.c2.13": [
  3242439838,
  "shared_effort"
 ],
 "nico.c2.07": [
  2146125994,
  "status"
 ],
 "nico.c2.06": [
  450966178,
  "effort",
  "talking"
 ],
 "cal.c2.05": [
  4175171477,
  "shared_effort"
 ],
 "cal.c2.13": [
  1669957574,
  "shared_effort"
 ],
 "cal.c2.07": [
  4074704899,
  "status"
 ],
 "cal.c2.06": [
  3431083264,
  "effort",
  "talking"
 ],
 "imani.c2.05": [
  2804395638,
  "shared_effort"
 ],
 "imani.c2.13": [
  2724424492,
  "shared_effort"
 ],
 "imani.c2.07": [
  14541578,
  "status"
 ],
 "imani.c2.06": [
  803463426,
  "effort",
  "talking"
 ],
 "otis.c2.05": [
  887514514,
  "shared_effort"
 ],
 "otis.c2.13": [
  1895258094,
  "shared_effort"
 ],
 "otis.c2.07": [
  3043456620,
  "status"
 ],
 "otis.c2.06": [
  3922265053,
  "effort",
  "talking"
 ],
 "kira.c2.05": [
  1771147621,
  "shared_effort"
 ],
 "kira.c2.13": [
  2502026131,
  "shared_effort"
 ],
 "kira.c2.07": [
  731623143,
  "status"
 ],
 "kira.c2.06": [
  2934028654,
  "effort",
  "talking"
 ],
 "ezra.c2.05": [
  2649297140,
  "shared_effort"
 ],
 "ezra.c2.13": [
  3282909840,
  "shared_effort"
 ],
 "ezra.c2.07": [
  3882220036,
  "status"
 ],
 "ezra.c2.06": [
  3425149549,
  "effort",
  "talking"
 ],
 "red.c2.05": [
  2111244408,
  "shared_effort"
 ],
 "red.c2.13": [
  987215409,
  "shared_effort"
 ],
 "red.c2.07": [
  4283397029,
  "status"
 ],
 "red.c2.06": [
  2537594110,
  "effort",
  "talking"
 ],
 "roxy.c2.05": [
  1640393766,
  "shared_effort"
 ],
 "roxy.c2.13": [
  90932344,
  "shared_effort",
  "endurance"
 ],
 "roxy.c2.06": [
  3110873044,
  "effort",
  "talking"
 ],
 "silas.c2.05": [
  3587951495,
  "shared_effort"
 ],
 "silas.c2.13": [
  2782947676,
  "shared_effort"
 ],
 "silas.c2.07": [
  866117427,
  "status"
 ],
 "silas.c2.06": [
  1421966466,
  "effort",
  "talking"
 ],
 "night.c2.05": [
  3863032941,
  "shared_effort"
 ],
 "night.c2.13": [
  3583923942,
  "shared_effort"
 ],
 "night.c2.06": [
  4078274093,
  "effort",
  "talking"
 ],
 "malik.c3.05": [
  1901826559,
  "shared_effort"
 ],
 "malik.c3.13": [
  531813055,
  "shared_effort"
 ],
 "dean.c3.05": [
  4122941782,
  "shared_effort"
 ],
 "dean.c3.13": [
  76554127,
  "shared_effort"
 ],
 "dean.c3.10": [
  1465018454,
  "strike"
 ],
 "dean.c3.12": [
  423760082,
  "pace"
 ],
 "rocco.c3.05": [
  181473611,
  "shared_effort"
 ],
 "rocco.c3.13": [
  403816714,
  "shared_effort"
 ],
 "rocco.c3.24": [
  2619353359,
  "proof"
 ],
 "rocco.c3.10": [
  3123307920,
  "strike"
 ],
 "ace.c3.05": [
  3019272107,
  "shared_effort"
 ],
 "ace.c3.13": [
  196718571,
  "shared_effort"
 ],
 "tori.c3.05": [
  2918503578,
  "shared_effort"
 ],
 "tori.c3.13": [
  40809757,
  "shared_effort"
 ],
 "tori.c3.12": [
  2522114006,
  "pace"
 ],
 "faye.c3.01": [
  2167243783,
  "evidence"
 ],
 "faye.c3.18": [
  1957423469,
  "unclassified"
 ],
 "faye.c3.13": [
  48308002,
  "shared_effort",
  "effort"
 ],
 "zara.c3.05": [
  1483192752,
  "shared_effort"
 ],
 "zara.c3.13": [
  4246594688,
  "shared_effort"
 ],
 "zara.c3.06": [
  2564666776,
  "effort",
  "talking"
 ],
 "aisha.c3.05": [
  787323581,
  "shared_effort"
 ],
 "aisha.c3.13": [
  1331881053,
  "shared_effort"
 ],
 "aisha.c3.12": [
  3749561983,
  "pace"
 ],
 "anya.c3.05": [
  1000709358,
  "shared_effort"
 ],
 "anya.c3.13": [
  2511875508,
  "shared_effort"
 ],
 "anya.c3.10": [
  2328162489,
  "strike"
 ],
 "priya.c3.21": [
  3627301443,
  "ground"
 ],
 "priya.c3.24": [
  321994896,
  "proof",
  "effort"
 ],
 "priya.c3.10": [
  280473453,
  "strike"
 ],
 "bao.c4.05": [
  2080003237,
  "shared_effort"
 ],
 "bao.c4.13": [
  3166971236,
  "shared_effort"
 ],
 "bao.c4.10": [
  3559064916,
  "strike"
 ],
 "bao.c4.12": [
  2891075088,
  "pace"
 ],
 "miro.c4.05": [
  3516356087,
  "shared_effort"
 ],
 "miro.c4.13": [
  2373267514,
  "shared_effort"
 ],
 "miro.c4.12": [
  4163194152,
  "pace"
 ],
 "ellis.c4.05": [
  1071046177,
  "shared_effort"
 ],
 "ellis.c4.13": [
  2176737885,
  "shared_effort"
 ],
 "ivo.c4.05": [
  2361365012,
  "shared_effort"
 ],
 "ivo.c4.13": [
  87977979,
  "shared_effort"
 ],
 "rina.c4.05": [
  1900701235,
  "shared_effort"
 ],
 "rina.c4.13": [
  988366583,
  "shared_effort"
 ],
 "rina.c4.10": [
  2924351830,
  "strike"
 ],
 "nate.c4.05": [
  3413041327,
  "shared_effort"
 ],
 "nate.c4.13": [
  160713952,
  "shared_effort"
 ],
 "cass.c4.31": [
  906446084,
  "unclassified"
 ],
 "cass.c4.13": [
  2288334348,
  "audience"
 ],
 "jun.c4.05": [
  2626652905,
  "shared_effort"
 ],
 "jun.c4.13": [
  1789361034,
  "shared_effort"
 ],
 "sylvia.c4.05": [
  2718251008,
  "shared_effort"
 ],
 "sylvia.c4.13": [
  2578954013,
  "shared_effort"
 ],
 "sylvia.c4.10": [
  636940836,
  "strike"
 ],
 "kofi.c4.05": [
  509412132,
  "shared_effort"
 ],
 "kofi.c4.13": [
  2423022973,
  "shared_effort"
 ],
 "kofi.c4.06": [
  2824784845,
  "effort",
  "talking"
 ],
 "nolan.c5.05": [
  2965176547,
  "shared_effort"
 ],
 "nolan.c5.13": [
  1325624349,
  "shared_effort"
 ],
 "nolan.c5.10": [
  4253212460,
  "strike"
 ],
 "mae.c5.05": [
  613435265,
  "shared_effort"
 ],
 "mae.c5.13": [
  3259513867,
  "shared_effort"
 ],
 "theo.c5.05": [
  3164912775,
  "shared_effort"
 ],
 "theo.c5.13": [
  901033639,
  "shared_effort"
 ],
 "theo.c5.06": [
  3986748623,
  "effort",
  "talking"
 ],
 "soraya.c5.05": [
  1298292479,
  "shared_effort"
 ],
 "soraya.c5.13": [
  1675674845,
  "shared_effort"
 ],
 "milo.c5.05": [
  3141093512,
  "shared_effort"
 ],
 "milo.c5.13": [
  995534520,
  "shared_effort"
 ],
 "winnie.c5.05": [
  3630415216,
  "shared_effort"
 ],
 "winnie.c5.13": [
  2666892400,
  "shared_effort"
 ],
 "bronte.c5.05": [
  3654903916,
  "shared_effort"
 ],
 "bronte.c5.13": [
  2824371441,
  "shared_effort"
 ],
 "gus.c5.05": [
  1097510146,
  "shared_effort"
 ],
 "gus.c5.13": [
  2082609667,
  "shared_effort"
 ],
 "gus.c5.10": [
  1631869806,
  "strike"
 ],
 "nikita.c5.05": [
  1226715060,
  "shared_effort"
 ],
 "nikita.c5.13": [
  601612880,
  "shared_effort"
 ],
 "jett.c5.05": [
  3010413735,
  "shared_effort"
 ],
 "jett.c5.13": [
  3394142560,
  "shared_effort"
 ],
 "alina.c6.05": [
  3633540743,
  "shared_effort"
 ],
 "alina.c6.13": [
  1445710428,
  "shared_effort"
 ],
 "cedric.c6.05": [
  2370547977,
  "shared_effort"
 ],
 "cedric.c6.13": [
  1258262994,
  "shared_effort"
 ],
 "marisol.c6.05": [
  2663732495,
  "audience"
 ],
 "marisol.c6.13": [
  600857490,
  "shared_effort"
 ],
 "felix.c6.06": [
  2025219950,
  "effort",
  "talking"
 ],
 "felix.c6.13": [
  4211128265,
  "shared_effort"
 ],
 "eira.c6.05": [
  2623958106,
  "shared_effort"
 ],
 "eira.c6.13": [
  2921298890,
  "shared_effort"
 ],
 "gideon.c6.05": [
  1028165128,
  "shared_effort"
 ],
 "gideon.c6.13": [
  1642122047,
  "shared_effort"
 ],
 "gideon.c6.12": [
  1171129784,
  "pace"
 ],
 "vera.c6.07": [
  3806768541,
  "legitimacy"
 ],
 "vera.c6.13": [
  1572611740,
  "shared_effort"
 ],
 "tomas.c6.05": [
  354950538,
  "shared_effort"
 ],
 "tomas.c6.13": [
  2092619777,
  "shared_effort"
 ],
 "ari.c6.05": [
  623184469,
  "shared_effort"
 ],
 "ari.c6.13": [
  697798480,
  "shared_effort"
 ],
 "kezia.c6.05": [
  1714970596,
  "shared_effort"
 ],
 "kezia.c6.13": [
  1689966357,
  "shared_effort"
 ],
 "kezia.c6.06": [
  3521115974,
  "effort",
  "talking"
 ],
 "dev.c7.05": [
  1107539052,
  "shared_effort"
 ],
 "dev.c7.13": [
  3309994952,
  "shared_effort"
 ],
 "liya.c7.05": [
  1459112488,
  "shared_effort"
 ],
 "liya.c7.13": [
  2005057169,
  "shared_effort"
 ],
 "emmett.c7.05": [
  1178571778,
  "shared_effort"
 ],
 "emmett.c7.13": [
  1896020027,
  "shared_effort"
 ],
 "nadia.c7.05": [
  4028858288,
  "shared_effort"
 ],
 "nadia.c7.13": [
  4138002265,
  "shared_effort"
 ],
 "nadia.c7.10": [
  2134284523,
  "strike"
 ],
 "leandro.c7.05": [
  891909857,
  "shared_effort"
 ],
 "leandro.c7.13": [
  609111361,
  "shared_effort"
 ],
 "iris.c7.05": [
  1425866380,
  "shared_effort"
 ],
 "iris.c7.13": [
  966434096,
  "shared_effort"
 ],
 "iris.c7.10": [
  2029631356,
  "strike"
 ],
 "kellan.c7.05": [
  4025885001,
  "shared_effort"
 ],
 "kellan.c7.13": [
  620050322,
  "shared_effort"
 ],
 "ayla.c7.05": [
  1882961795,
  "shared_effort"
 ],
 "ayla.c7.13": [
  2462165255,
  "shared_effort"
 ],
 "ayla.c7.10": [
  998541561,
  "strike"
 ],
 "sasha.c7.21": [
  1295751232,
  "audience"
 ],
 "sasha.c7.13": [
  3046528449,
  "audience"
 ],
 "morgan.c7.04": [
  2225945090,
  "pace"
 ],
 "morgan.c7.12": [
  2291091839,
  "pace"
 ],
 "tomasash.c8.05": [
  3951660427,
  "shared_effort"
 ],
 "tomasash.c8.13": [
  2881094027,
  "shared_effort"
 ],
 "tomasash.c8.12": [
  3281187977,
  "pace"
 ],
 "noelle.c8.05": [
  1876842110,
  "shared_effort"
 ],
 "noelle.c8.13": [
  346185637,
  "shared_effort"
 ],
 "noelle.c8.06": [
  4070809946,
  "effort",
  "talking"
 ],
 "ash.c8.24": [
  1064993958,
  "proof",
  "effort"
 ],
 "zane.c8.05": [
  1977811756,
  "shared_effort"
 ],
 "zane.c8.13": [
  857675246,
  "shared_effort"
 ],
 "zane.c8.06": [
  1218327600,
  "effort",
  "talking"
 ],
 "elodie.c8.05": [
  4253236843,
  "shared_effort"
 ],
 "elodie.c8.13": [
  92327493,
  "legitimacy"
 ],
 "elodie.c8.06": [
  2208428046,
  "effort",
  "talking"
 ],
 "bashir.c8.05": [
  528932793,
  "shared_effort"
 ],
 "bashir.c8.13": [
  427470367,
  "shared_effort"
 ],
 "cleo.c8.05": [
  2424216027,
  "shared_effort"
 ],
 "cleo.c8.13": [
  443411949,
  "shared_effort"
 ],
 "cleo.c8.06": [
  229890791,
  "effort",
  "talking"
 ],
 "rev.c8.22": [
  3619319495,
  "ground",
  "shared_effort"
 ],
 "rev.c8.13": [
  2758601884,
  "shared_effort"
 ],
 "nova.pilot.05": [
  2811271759,
  "shared_effort"
 ],
 "nova.pilot.06": [
  4203833353,
  "status"
 ],
 "nova.pilot.07": [
  1957263445,
  "takedown"
 ],
 "nova.pilot.08": [
  2727129916,
  "air"
 ],
 "nova.pilot.09": [
  62441251,
  "status"
 ],
 "nova.pilot.14": [
  3249430601,
  "shared_effort",
  "agreement"
 ],
 "magnus.pilot.09": [
  1434762077,
  "strike"
 ],
 "magnus.pilot.08": [
  853821948,
  "audience"
 ],
 "magnus.pilot.10": [
  211744978,
  "shared_effort",
  "effort"
 ],
 "magnus.pilot.05": [
  2223803434,
  "status"
 ],
 "magnus.pilot.14": [
  549438588,
  "proof",
  "effort"
 ]
});
 const reviewedBankReuseV2=freeze(Object.fromEntries([...new Set([...Object.keys(reviewedBankReuse),...Object.keys(bankReuseExtension)])].map(id=>{
  const before=reviewedBankReuse[id],extra=bankReuseExtension[id];
  return [id,[(before||extra)[0],...new Set([...(before?.slice(1)||[]),...(extra?.slice(1)||[])])]];
 })));
 function selectReviewedBankResponse(cat,ctx,seed,mem,sem,version=1){
  if(!ctx||!sem||ctx.hasMouthpiece||ctx.stage!=='answer'||ctx.action!=='turn'||
     (ctx.protected&&ctx.protected!=='contextual-variant')||
     (ctx.side==='w'?sem.move!=='rebut':sem.move!=='counter'))return null;
  // First honour the old reviewed pool, so adding more topics does not
  // reshuffle an already supported exchange or its history IDs.
  if(version===2){const prior=selectReviewedBankResponse(cat,ctx,seed,mem,sem,1);if(prior)return prior;}
  const reviewed=version===2?reviewedBankReuseV2:reviewedBankReuse;
  const matchesClaim=row=>{
   const r=reviewed[row.id];
   return !!r&&r[0]===hash(row.text)&&r.slice(1).includes(sem.claim)&&row.side===ctx.side;
  };
  const sources=cat.lines(ctx.speaker.role,ctx.speaker.id).filter(matchesClaim);
  const eligible=[];
  for(const row of sources){
   const variants=row.when.variants||[null];
   for(const variant of variants){
    // Only the explicitly reviewed stage/action/variant is reinterpreted.
    // Owner, original conditions, rendered placeholders and recent history
    // remain subject to the ordinary character-bank selector.
    const sourceCtx={...ctx,stage:row.stage,action:row.action,variant,protected:'contextual-variant'};
    const pick=select(cat,sourceCtx,seed,{...mem,candidateFilter:r=>r.id===row.id&&matchesClaim(r)});
    if(pick){eligible.push({...pick,bankReuse:{stage:row.stage,action:row.action,variant}});break;}
   }
  }
  return eligible.sort((a,b)=>hash(seed+'|'+a.id)-hash(seed+'|'+b.id)||a.id.localeCompare(b.id))[0]||null;
 }
 function selectSemanticResponse(cat,ctx,seed,mem,sem){
  if(!ctx||!sem||ctx.side!=='w'||ctx.hasMouthpiece)return null;
  if(ctx.stage==='answer'&&ctx.action==='turn'&&ctx.variant==='tu_strength'&&
     ctx.protected==='contextual-variant'&&sem.move==='rebut'&&sem.claim==='strength'&&string(sem.detail)){
   return select(cat,{...ctx,strength:sem.detail},seed,{...mem,candidateFilter:r=>reviewedStrength.has(r.text)});
  }
  if(ctx.stage==='push'&&ctx.action==='press'&&!ctx.protected&&sem.move==='press'){
   return select(cat,ctx,seed,{...mem,candidateFilter:r=>reviewedPress.has(r.text)});
  }
  return null;
 }
 // A closing bank line must make the recorded commitment audible. Only
 // conservative affirmative wording qualifies; the exact graph speech is
 // retained when a bank line is ambiguous, rather than inventing a vow.
 function closingCommitment(row,ctx){
  const text=row.text;
  if(ctx.stage!=='close'||ctx.side!=='w')return true;
  if(ctx.action==='vow'){
   if(ctx.variant==='vo_guarantee')return /\bI guarantee (?:a win|victory|that I will win)\b/i.test(text);
   if(ctx.variant==='vo_fans')return /\b(?:this win is for|I will win for|I'll win for)\b/i.test(text);
   const explicit=/(?:^|[.!?]\s+)(?:I will win|I intend to win|I'll win|I am going to win)(?: it| this match| tonight)?[.!]$/i.test(text);
   return explicit&&(ctx.variant!=='vo_hard'||/\b(?:hard|difficult|demanding|tough|not be easy)\b/i.test(text));
  }
  if(ctx.action==='clean'){
   if(ctx.variant==='cl_hand')return /\b(?:shake my hand|handshake)\b/i.test(text)&&/\b(?:no shortcuts|clean fight|fair fight)\b/i.test(text);
   if(ctx.variant==='cl_middle')return /\bclean\b/i.test(text)&&/\b(?:fall|pin)\b/i.test(text)&&/\b(?:centre|middle)\b/i.test(text);
  }
  return true;
 }
 // G1 editorial review: exact text and exact variant, never a broad
 // permission to attach a promise to arbitrary speech. Completed variants
 // express the whole commitment in their own wording; approved leads
 // retain their voice and are completed with a short explicit commitment.
 const completeClosings={
 "vo_hard": [
  "I anticipate a difficult case. I intend to win it.",
  "It'll be hard graft. I'll be the one standing.",
  "It won't be easy. I'm going to win anyway.",
  "It'll be a proper hard match. I'm still going to win it.",
  "It'll be difficult. I still intend to win.",
  "I know it'll be hard. I promise I'll win.",
  "I know how hard this is going to be. I intend to win it.",
  "This is going to be a long shift. I'll win it, though.",
  "I'm expecting a hard night's work. I'm going to win it.",
  "I expect to have to work for every inch. I will prevail.",
  "It'll take everything I've got. I'm going to win.",
  "Hard match. I'll win it.",
  "I know the quality of the opposition. I intend to earn the win.",
  "I expect it to be a hard night's work. I'm still going to win.",
  "I expect a demanding contest. I will win it.",
  "The examination will be demanding. I intend to pass it by winning.",
  "It'll be hard. I'm still winning.",
  "I anticipate a demanding performance. I'll be the one who wins it.",
  "It will be difficult. I intend to win on the mat.",
  "It'll be a hard night. I'm going to win it."
 ],
 "vo_plain": [
  "My conclusion is simple: I will win.",
  "I'm winning tonight.",
  "I'm going to win tonight.",
  "I aim to win.",
  "I'm going to win.",
  "I mean it. I'm going to win tonight.",
  "I'm winning this one.",
  "Let me be clear. I'm winning this match.",
  "I will be the winner. That is my standard.",
  "I'm winning this match.",
  "I'm here to win. And I will.",
  "I'll win this match.",
  "I'll win this one.",
  "My prediction is a victory.",
  "I will come out on top.",
  "I will win this evening.",
  "I will win this contest.",
  "Tonight ends with my hand raised. I'm going to take it.",
  "I am coming for the win, and I will take it honestly."
 ],
 "cl_middle": [
  "One clean fall in the centre. No qualifications.",
  "Clean fall in the middle. That's the job.",
  "One clean fall, right in the middle. No quick shortcuts for us.",
  "Clean fall in the centre. Both of us do it properly.",
  "One clean fall. In the centre of the mat.",
  "One clean fall, in the middle. Give them something honest.",
  "One clean fall, right in the middle. No funny business.",
  "One clean fall, in the centre. I want both of us accountable for it.",
  "A clean fall in the centre. No shortcut for me.",
  "One clean fall, in the centre of the ring. No qualification.",
  "Clean fall in the middle. No messing about.",
  "One clean fall, centre stage. No cheap tricks.",
  "One clean fall in the centre. No confounding factors.",
  "One clean fall right in the centre. Let the lights catch it."
 ]
};
 const closingLeads={
 "vo_hard": [
  "I came here to win, and I am going to fight for it.",
  "I have made my position clear, and I intend to keep to it all the way to the finish.",
  "I will be in there giving everything I have. The rest is physics.",
  "I will wrestle this match and hold you to every word you have given.",
  "I'm going to give it everything. Honestly, that's the plan.",
  "I will be fully committed until the bell. After that the stakes speak for themselves.",
  "I will say the same thing at the finish as I have said here.",
  "I will hold this match with patience, and I will not let go early.",
  "I am going to give this everything I have until the bell goes.",
  "I intend to stay with my plan until the finish.",
  "I will carry this sequence through to the finish, and I will not change it halfway.",
  "I will give this match everything, until the last bar ends.",
  "I am going to fight my hardest until the bell. Then it is done.",
  "I'm going to give it everything, and then I'm going to make a joke about it.",
  "I will hold my counter until the moment it matters, and then I will use it.",
  "I will give this match a hard, fair finish, and I will not cut corners.",
  "I am going to give everything I have until the bell, and I will enjoy every second.",
  "I will wrestle this match with care and finish with control.",
  "I will teach this match from start to finish, and I will not rush the ending.",
  "I will test this match honestly and finish it on its terms.",
  "I will wrestle this match within the terms, and I will finish it on those terms.",
  "I will give this match everything I have left, and that is a lot.",
  "I will run this match at a steady pace and finish it properly.",
  "I will hold this match to the finish, and I will not let go early.",
  "I will do this match properly, and I will look after you while I do it.",
  "I will give this match everything I have got. Just one thing at a time.",
  "I will give this match my whole heart, and I will not hold anything back.",
  "I will wrestle this match, and I will ask my questions in the ring.",
  "I will watch every small thing in this match, and I will use what I see.",
  "I will give this match everything, and I will try to get it right this time.",
  "I will fight this match cleanly, and I will not look for an edge outside the rules.",
  "I will move early in this match, and I will not wait to be asked.",
  "I will measure every step of this match, and I will finish it exactly.",
  "I will wrestle this match politely, and I will see who really holds the advantage.",
  "I will fill this room properly, and I will make the stakes plain.",
  "I will wrestle this match and I will listen to every correction you give me.",
  "I will wrestle this match with care, and I will make sure we both leave in good order.",
  "I will give this match everything I have, and I will be careful while I do it.",
  "I will wrestle this match to the standard. One, I will be careful. Two, I will be honest. Three, I will finish.",
  "I will give this match everything I have, and I will keep the room lit to the end.",
  "I will give this match everything I have, and I will try to slow down for the important bits.",
  "I will wrestle this match with a clear plan, and I will not leave the landing to chance.",
  "I will give this match everything, and I will keep my head on while I do it.",
  "I will wrestle this match for the crowd, and I will make sure they enjoy it.",
  "I will wrestle this match with control, and I will finish it cleanly.",
  "I will wrestle this match within the stated framework, and I will reach the conclusion honestly.",
  "I will fight this match on my own terms, and I will not say much about it.",
  "I will give this match everything I have, and I will learn as I go.",
  "I will wrestle this match with careful questions, and I will let the result answer them.",
  "I will wrestle this match carefully, and I will show the young ones how it is done.",
  "I will wrestle this match on the evidence, and the result will tell its own story.",
  "I will wrestle this match with a clear conscience, and I will leave the judgement to the people."
 ],
 "vo_plain": [
  "I'll finish it. Simple as that.",
  "My objective is clear. I aim to take it.",
  "My approach is measured. I plan to finish this properly.",
  "Plain and straight: I am here to wrestle this one, and I am going all out.",
  "I am here to put on a show, and I intend to do it properly.",
  "I am ready to give the crowd something they cannot explain, and I mean that.",
  "My approach is precise. I say a thing once, and I mean it.",
  "I'm here to wrestle, and I'm going to enjoy it. Is that allowed?",
  "My plan is simple: wrestle hard, and do not give anyone a second chance.",
  "My approach is measured and cold. The result will cut clean on the night.",
  "My approach is careful. I do not repeat myself unless I mean it.",
  "I am going to wrestle carefully and finish with control.",
  "My plan is simple: be honest and do the work properly.",
  "My approach is careful and clear. I will show you on the night.",
  "My approach is methodical. I will finish what I start.",
  "My approach is precise, and I will play the detail on the night.",
  "Plain: I wrestle my own match, and I do it my way.",
  "My plan: be funny and fast. Be funny, be fast, and don't stand still.",
  "My approach is patient. I am looking for the exact moment to act.",
  "My approach is clean and direct. I will show you the work.",
  "My plan is big air, simple! Bring the energy and keep the risk calculated.",
  "My approach is patient and safe. You will see it on the night.",
  "My approach is simple: say it clearly and then show it properly.",
  "My approach is exact. I say what I will do, and I do it.",
  "My approach is direct. I state what I accept, and I stand by it.",
  "My approach is steady. I will keep turning up and keep going.",
  "My approach is patient and steady. I will show you the timetable.",
  "My approach is plain. I say the plan, then I stick to it.",
  "My approach is steady and safe. Nothing clever.",
  "My approach is straightforward. Give me the reason and I give you the match.",
  "My plan is one thing at a time. Get the first thing right, then the next.",
  "My approach is honest. You will feel it on the night.",
  "Will you let me be patient? I want a fair start, and I will make sure I get one.",
  "My approach is quiet. You will see it when the details start to matter.",
  "My approach is honest and careful. You will see it on the night.",
  "My approach is clean. You can see it in the hold.",
  "My approach is patient but early. You will see it when the timing matters.",
  "My approach is exact. You will see the numbers on the night.",
  "My approach is courteous. You will see what that means on the night.",
  "I work the room steadily. You will see the scene come together on the night.",
  "I hope my approach is careful enough. I hope you will see me try my best on the night.",
  "My approach is steady and fair. You will see it on the night, in the right way.",
  "My approach is playful and prepared. You will see both on the night.",
  "My approach is methodical. You will see it on the night, in order.",
  "My approach is bold. You will see the fire on the night.",
  "My approach is keen. You will see it on the night, and I will try to be patient in the middle.",
  "My approach is careful about the landing. You will see the plan on the night.",
  "My plan is one good idea. Be exciting, be safe, and remember to breathe.",
  "I tell this patiently. You will see the story on the night.",
  "My approach is playful and sharp. You will see the crowd respond on the night.",
  "My approach is precise. I say what I will take, and I stand by it.",
  "My approach is measured. You will see control on the night.",
  "My approach is structured. You will see the framework on the night.",
  "Simple plan. Nothing else. Nobody speaks for me in the ring.",
  "My approach is careful. I am still learning, and I will do my best.",
  "My approach is patient. You will see the pause on the night.",
  "My approach is steady, the way I teach. You will see the lesson on the night.",
  "My approach is analytic. You will see the test on the night.",
  "My approach is plain and honest. You will see the judgement on the night."
 ],
 "cl_middle": [
  "Whatever happens, you will know exactly where you stood with me.",
  "Whatever the result, both sides will know where things stand.",
  "Whatever happens, you will know where I stood.",
  "Whatever happens, the people will remember where I stood.",
  "Whatever happens, something will change in that ring.",
  "Whatever happens, the words will be on the table in the order you said them.",
  "Whatever happens, you'll see the real me in there.",
  "Whatever happens, you will know my position.",
  "Whatever happens, the cut will be honest.",
  "Whatever happens, the record will be correct.",
  "Whatever happens, you will know exactly where you were when it finished.",
  "Whatever happens, I hope you know I meant every word.",
  "Whatever the result, both of us will know exactly what happened.",
  "Whatever happens, the result will follow from what we did.",
  "Whatever happens, the song will be honest.",
  "Whatever happens, you will know where I stood.",
  "Whatever happens, the transition will tell the story.",
  "Whatever happens, both of us will know we met the standard.",
  "Whatever happens, I want you to know I gave it everything.",
  "Whatever happens, I want you to leave knowing what you did right.",
  "Whatever happens, you will remember what this taught you.",
  "Whatever happens, the result will match what was claimed.",
  "Whatever happens, the conditions will be on record.",
  "Whatever happens, you will know exactly what the timetable said.",
  "Whatever happens, you will know where I stood, and it will be the same place tomorrow.",
  "Whatever happens, you will know exactly why I did it.",
  "Whatever happens, I will have learned something. One thing.",
  "Whatever happens, I want you to know this was real for me.",
  "Whatever happens, will the people see what happened?",
  "Whatever happens, the small things will be the story.",
  "Whatever happens, I will not pretend it did not matter.",
  "Whatever happens, the result will be clean.",
  "Whatever happens, the early move will decide it.",
  "Whatever happens, the result will be measured.",
  "Whatever happens, I hope you will remember I was gracious about it.",
  "Whatever happens, the room will remember how it looked.",
  "Whatever happens, I hope you will tell me what I learned.",
  "Whatever happens, I want everybody who looked up to me to be proud of how I acted.",
  "Whatever happens, I want you to know I took it seriously.",
  "Whatever happens, there will be a clear record of what happened.",
  "Whatever happens, the room will remember how it looked.",
  "Whatever happens, I want to know what happens next.",
  "Whatever happens, I want to be sure you are all right afterwards.",
  "Whatever happens, I want you to know I had a good time.",
  "Whatever happens, the story will mean something.",
  "Whatever happens, I want the crowd to remember the moment.",
  "Whatever happens, I want you to leave knowing when to stop.",
  "Whatever happens, the record will show the argument as it was made.",
  "Whatever happens, you will know exactly where I stood.",
  "Whatever happens, I want to learn from it.",
  "Whatever happens, the observable record will speak for itself.",
  "Whatever happens, I want the young ones watching to learn something.",
  "Whatever happens, the evidence will speak for itself.",
  "Whatever happens, I want the people to leave knowing what they saw was true."
 ]
};
 const closingSuffix={
 "vo_hard": [
  "It will be hard, but I will win.",
  "It won't be easy. I'll win anyway.",
  "However hard it gets, I will win.",
  "I expect a tough match, and I will win."
 ],
 "vo_plain": [
  "I will win tonight.",
  "I'm going to win this match.",
  "I'll be the winner.",
  "I will take the win."
 ],
 "cl_middle": [
  "One clean fall in the centre of the ring.",
  "No shortcuts. One clean fall in the middle of the ring.",
  "Let's settle it with one clean fall in the centre."
 ]
};
 function selectClosing(cat,ctx,seed,mem){
  if(!ctx||ctx.stage!=='close'||ctx.side!=='w'||ctx.hasMouthpiece||ctx.protected!=='contextual-variant')return null;
  const variant=ctx.variant,complete=completeClosings[variant]||[],leads=closingLeads[variant]||[];
  const selection=select(cat,ctx,seed,{...mem,candidateFilter:r=>closingCommitment(r,ctx)||complete.includes(r.text)||leads.includes(r.text)});
  if(!selection)return null;
  const row=cat.lines(ctx.speaker.role,ctx.speaker.id).find(r=>r.id===selection.id);
  if(!row)return null;
  if(closingCommitment(row,ctx)||complete.includes(row.text))return selection;
  const pool=closingSuffix[variant];
  if(!pool||!leads.includes(row.text))return null;
  return {...selection,text:selection.text+' '+pool[hash(seed+'|'+selection.id+'|commitment')%pool.length]};
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
 root.OfficePromoDialogue=Object.freeze({categories,targets:freeze(targets),catalogue,combine,snapshot,context,render,tag,select,selectAcknowledgement,selectSemanticResponse,selectReviewedBankResponse,reviewedBankReuse,reviewedBankReuseV2,closingCommitment,selectClosing,compose,recentIds});
})(typeof window!=='undefined'?window:globalThis);
