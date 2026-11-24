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
 const conditions=['formats','minAge','maxAge','minMeetings','titleMatch','hasMouthpiece','speakerStyle','opponentStyle','landed','minComposure','maxComposure','minIrritation','maxIrritation','subject'];
 const placeholders=['speaker','client','opponent','venue','finisher'];
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
   if(k==='formats'){if(!Array.isArray(v)||!v.length||v.some(x=>!formats.includes(x)))fail('invalid format condition');}
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
    if(!ctx||ctx.protected)return [];
    const pack=owners.get(ctx.speaker.role+':'+ctx.speaker.id);
    return (pack?.slots.get([ctx.stage,ctx.action,ctx.side].join('|'))||[]).filter(row=>matches(row,ctx));
   },
   coverage:()=>Array.from(owners,([owner,p])=>({owner,total:p.lines.length,byCategory:Object.fromEntries(categories.map(k=>[k,p.lines.filter(l=>l.category===k).length]))}))
  });
 }
 function actor(w){
  return {id:w.id,role:'wrestler',short:w.short||w.name||null,age:Number.isFinite(w.age)?w.age:null,style:w.style||null,finisher:w.finisher||null};
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
    stage==='close'?'closing-contract':variant?'contextual-variant':stage==='open'&&action==='imagery'?'motif':null;
  return {stage,action,side,speaker,opponent,client:s.client,venue:s.venue,titleMatch:s.titleMatch,
   hasMouthpiece:s.hasMouthpiece,meetings:s.meetings,format:st.director?.format||null,
   subject:st.director?.subject||st.core.claim?.opening||null,landed,
   composure:emotion?.composure??null,irritation:emotion?.irritation??null,
   protected:protectedReason,previous:st.log.filter(e=>e.side==='w'||e.side==='f').at(-1)?.line||null};
 }
 function matches(row,c){
  const w=row.when;
  const min=(value,limit)=>value!==null&&value!==undefined&&value>=limit;
  const max=(value,limit)=>value!==null&&value!==undefined&&value<=limit;
  if(has(w,'formats')&&!w.formats.includes(c.format))return false;
  for(const [k,v] of [['titleMatch',c.titleMatch],['hasMouthpiece',c.hasMouthpiece],['landed',c.landed],['speakerStyle',c.speaker.style],['opponentStyle',c.opponent.style],['subject',c.subject]])if(has(w,k)&&w[k]!==v)return false;
  for(const [k,v,fn] of [['minAge',c.speaker.age,min],['maxAge',c.speaker.age,max],['minMeetings',c.meetings,min],['minComposure',c.composure,min],['maxComposure',c.composure,max],['minIrritation',c.irritation,min],['maxIrritation',c.irritation,max]])if(has(w,k)&&!fn(v,w[k]))return false;
  return render(row,c)!==null;
 }
 function render(row,c){
  const values={speaker:c.speaker.short,client:c.client.short,opponent:c.opponent.short,venue:c.venue,finisher:c.client.finisher};
  let missing=false;const line=row.text.replace(/\{([a-z]+)\}/g,(_,k)=>{const v=values[k];if(!string(v)){missing=true;return '';}return v;});
  return missing?null:line;
 }
 function tag(ctx){return ctx?{owner:ctx.speaker.id,role:ctx.speaker.role,stage:ctx.stage,action:ctx.action,side:ctx.side,protected:ctx.protected||null}:null;}
 root.OfficePromoDialogue=Object.freeze({categories,targets:freeze(targets),catalogue,snapshot,context,render,tag});
})(typeof window!=='undefined'?window:globalThis);
