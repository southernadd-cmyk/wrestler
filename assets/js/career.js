/* THE OFFICE v2.2 — regional circuit management layer */
(function(root){'use strict';
const D=root.OfficeData;
const STORE='the-office-v22';
const PRIOR_STORE='the-office-v21';
const LEGACY_STORE='the-office-v2';
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const r10=n=>Math.round(n/10)*10;
const money=n=>(n<0?'−':'')+'£'+Math.abs(Math.round(n)).toLocaleString('en-GB');
let S=null;
let storageState={ok:null,lastSaved:null};
function saveStatus(){return {...storageState};}
function resultRecorded(c){
 const id=c?.id;
 return !!(id&&S&&(S.resultIds?.includes(id)||S.history?.some(h=>h.cid===id)||S.seasonResults?.some(h=>h.cid===id)));
}
// Diagnostic notices are part of the career: previously optional simulation
// failures vanished completely. Keep the last twelve, including their origin.
function reportError(source,error){
 const message=String(error?.message||error||'Unknown error').slice(0,240);
 const at=Date.now(),period=S?(S.season-1)*16+S.week:0;
 if(S){
  S.systemErrors??=[];
  const last=S.systemErrors.at(-1);
  if(last?.source===source&&last.message===message&&last.period===period){
   last.count=(last.count||1)+1;last.at=at;
  }else{
   S.systemErrors.push({source:String(source),message,period,season:S.season,week:S.week,at,count:1});
   S.systemErrors=S.systemErrors.slice(-12);
  }
  save();
 }
 if(typeof console!=='undefined')console.error('[The Office] '+source+': '+message,error);
 if(root.OFFICE_STRICT)throw error instanceof Error?error:new Error(message);
}
function systemErrors(){return (S?.systemErrors||[]).slice();}

function rand(){S.seed=(Math.imul(S.seed||1932,1664525)+1013904223)>>>0;return S.seed/4294967296}
const ri=(a,b)=>Math.floor(rand()*(b-a+1))+a;
const one=a=>a[Math.floor(rand()*a.length)];
const uid=p=>p+'-'+S.week+'-'+Math.floor(rand()*1e9).toString(36);

/* ---------- player manager identity (cosmetic; never uses simulation RNG) ---------- */
// Fictional names inspired by British wrestling history. No real ring names
// or team names are offered as player defaults.
const BRITISH_PEOPLE=Object.freeze([
 'Mickey McVale','Jackie Palfrey','Les Kellaway','Johnny Sainthill','Billy Robden',
 'Adrian Lanehart','Mark Rocford','Jimmy Brakesley','Bert Regent','Vic Falconhurst',
 'Geordie Kittow','Bert Biggs','Gordon Hayrick','Ken Nakasen',
 'Davy Boy Steele','Colin Wriston','Marty Jowett','Tony St. Carr','Pat Rookwood',
 'Johnny Quayle','Max Crabbett','Brian Dixley','Owen Wyllan',
 'Georgie Gilt','Lloyd Ryeland','Paul Lincombe','Ricky Squire',
 'Mitzi Millward','Klondyke Kay','Rusty Braithwaite','Nicky Montrose','Sue Britton',
 'Sweet Saskia','Jackie Brindle','Maggie Mounthaven','Rani Catchpole'
]);
// Fictional nods to classic tag teams and modern British factions.
const BRITISH_HISTORIC_GROUPS=Object.freeze([
 'The Crown Cousins','The Pavilion Aces','The Bootlace Belles',
 'The Albion Stronghold','The First Bell','The Pennine Powerhouse',
 'The Handlebar Heights','The Black Country Bruisers'
]);
// Original names evoking the British halls, camps and catch circuit.
const BRITISH_HOMAGE_STABLES=Object.freeze([
 'The Saturday Matmen','The Lancashire Hookers','The Wigan Catch Club',
 'The Seaside Grapplers','The Town Hall Heels','The Northern Circuit',
 'The Matinee Men','The Blackpool Grapplers','The Working Men’s Club',
 'The Iron Mat','The All-Star Matmen','The Royal Albert Crew',
 'The Six-Round Society','The Holiday Camp Heroes','The Half-Nelson Club',
 'The Four O’Clock Club','The Pier Pavilion Crew','The Public Warning Club',
 'The Civic Hall Collective','The Catchweight Company'
]);
const BRITISH_STABLES=Object.freeze([...BRITISH_HISTORIC_GROUPS,...BRITISH_HOMAGE_STABLES]);
const LEGACY_PLACEHOLDER=Object.freeze({manager:'Alex Morgan',stable:'The New Guard'});
function identityHash(value){
 let h=2166136261;for(const char of String(value))h=Math.imul(h^char.charCodeAt(0),16777619);
 return h>>>0;
}
function identityPick(list,seed,salt){
 const i=seed===null||seed===undefined?Math.floor(Math.random()*list.length):
  identityHash(String(seed)+'|'+salt)%list.length;
 return list[i];
}
function suggestIdentity(seed=null){
 // Uses presentation-only randomness, never the career simulator's PRNG.
 // Imported legacy saves derive the same identity from their original seed.
 return {
  manager:identityPick(BRITISH_PEOPLE,seed,'manager'),
  stable:identityPick(BRITISH_STABLES,seed,'stable'),
  portrait:seed===null||seed===undefined?Math.floor(Math.random()*16):
   identityHash(String(seed)+'|portrait')%16
 };
}
function normaliseIdentity(raw){
 const fallback=raw?.manager&&raw?.stable?null:suggestIdentity();
 const clean=(value,otherwise,max)=>typeof value==='string'?
  (value.replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,max)||otherwise):otherwise;
 return {
  manager:clean(raw?.manager,fallback?.manager||BRITISH_PEOPLE[0],42),
  stable:clean(raw?.stable,fallback?.stable||BRITISH_STABLES[0],42),
  portrait:Number.isInteger(raw?.portrait)&&raw.portrait>=0&&raw.portrait<16?
   raw.portrait:(fallback?.portrait??0)
 };
}
const IDENTITY_ARCHIVE=Object.freeze({people:BRITISH_PEOPLE,groups:BRITISH_HISTORIC_GROUPS,
 homages:BRITISH_HOMAGE_STABLES,stables:BRITISH_STABLES});
function setIdentity(value){
 if(!S)return false;
 S.identity=normaliseIdentity(value);save();return true;
}

/* ---------- lifecycle ---------- */
function fresh(identity){
 root.OfficeAcademy?.reset();
 S={v:22,identity:normaliseIdentity(identity),seed:(Date.now()%100000)+7,careerSeed:null,season:1,week:1,cash:2250,rep:22,focus:2,monthReview:null,coach:null,futureBookings:[],circuitReviews:[],business:{training:0,negotiated:0,meetings:0,kept:0,broken:0},roster:[],free:D.TALENT.map(t=>({...t})),
  promoters:D.PROMOS.map(p=>({...p,blacklist:0,matches:0,best:0})),offers:[],card:[],feuds:{},inbox:[],history:[],resultIds:[],systemErrors:[],
  goals:{},recentTypes:{},books:[],trainingReviews:[],seasonResults:[],over:null};
 // Never change this as the weekly PRNG advances. It identifies this career's
 // underlying circuit outcomes without touching legacy career random sequences.
 S.careerSeed=S.seed;
 root.OfficeAcademy?.restore(S);
 msg({from:'The office',subject:'The keys are yours',kind:'info',body:[
  `${S.identity.manager}, you are now managing ${S.identity.stable}.`,
  'You have £2,250, an empty locker room and four promoters who might return your calls.',
  'Sign talent from Roster. Book them on Bookings. Press Continue and you go to the ring with them.',
  'Promoters decide who wins. You decide how it gets there, and what happens when it goes wrong.',
  'You have TWO management meetings each week. Spend them wisely; training has a real cost and tired wrestlers make costly mistakes.'
 ]});
 msg({from:'Your backer',subject:'Four weeks to prove yourselves',kind:'info',body:[`I will review ${S.identity.stable} at the end of week four.`,
  'Put on at least one three-star match AND meet two of these three conditions: keep £750 in the bank, reach reputation 30, and develop one wrestler by at least two skill points.',
  'Make it, and I will invest £450. Miss it, and the money goes elsewhere. We will still be here to discuss season objectives.']});
 msg({from:'The office',subject:'Season 1 objectives',kind:'info',body:[`This season, ${S.identity.stable} is expected to:`,...goalList().map(g=>'• '+g.text)]});
 root.OfficeTerritory?.prepare(S,true);
 root.OfficeWorldV4?.activate(S);
 makeOffers();save();return S;
}
function goalList(){const n=S.season;return [
 n<=5?{id:'rep',text:`Reach reputation ${Math.min(100,40+(n-1)*15)}`,done:S.rep>=Math.min(100,40+(n-1)*15)}:
 {id:'rep',text:'Work two programme chapters this season',done:(S.goals?.programmeChapters||0)>=2},
 {id:'union',text:'Get a booking with Grand Union',done:!!S.goals.union},
 {id:'four',text:'Produce a four-star match',done:!!S.goals.four},
 {id:'solvent',text:'Finish the season in the black',done:S.cash>=0}
]}
function hydrate(x){
 if(!x || ![20,21,22].includes(x.v) || !Array.isArray(x.roster)||!Array.isArray(x.offers))return null;
 if(!Array.isArray(x.free))x.free=[];
 // The old release silently set this exact placeholder pair on legacy saves.
 // Migrate it once, while preserving a portrait the player selected.
 const legacy=!x.identity||(x.identity.manager===LEGACY_PLACEHOLDER.manager&&
  x.identity.stable===LEGACY_PLACEHOLDER.stable);
 const selectedPortrait=x.identity?.portrait;
 const identity=legacy?suggestIdentity(x.careerSeed??x.seed):x.identity;
 if(legacy&&Number.isInteger(selectedPortrait)&&selectedPortrait>=0&&selectedPortrait<16)
  identity.portrait=selectedPortrait;
 x.v=22;x.identity=normaliseIdentity(identity);x.careerSeed??=x.seed;x.systemErrors??=[];x.coach??=null;x.futureBookings??=[];x.circuitReviews??=[];for(const o of x.offers){o.eventAbs??=(x.season-1)*16+x.week;o.expiresAbs??=(x.season-1)*16+x.week;}x.focus=Number.isInteger(x.focus)?x.focus:2;x.monthReview??=null;x.business??={training:0,negotiated:0,meetings:0,kept:0,broken:0};x.books??=[];x.trainingReviews=Array.isArray(x.trainingReviews)?x.trainingReviews.slice(-12):[];x.goals??={};x.seasonResults??=(x.history||[]).slice().reverse().map(h=>({cid:h.cid||null,season:h.season,week:h.week,wid:h.wid,name:h.name,foe:h.foe,stars:h.stars}));x.resultIds??=[...x.seasonResults,...(x.history||[])].map(h=>h.cid).filter(Boolean).slice(-2048);
 root.OfficeAcademy?.restore(x);
 for(const w of x.roster){w.age??=D.findWrestler?.(w.id)?.age??30;w.training??='ring';w.intensity??='light';w.progress??={};w.flags??={};w.promise??=null;w.startSkills??={ring:w.ring,mic:w.mic,psych:w.psych,safe:w.safe};w.program??=null;w.prep??={};w.prepHistory??=[];w.trend??=[];w.session??=null;w.learned??=[];w.learning??=null;w.micWork??={};w.rehearsedAt??=null;w.wear??={};w.niggle??=0;w.nigglePart??=null;w.relapse??=null;if(w.injury && !Number.isInteger(w.injurySince))w.injurySince=(x.season-1)*16+x.week-1;}
 root.OfficeTerritory?.prepare(x);
 root.OfficeWorldV4?.activate(x);
 return x;
}
function load(){
 for(const key of [STORE,PRIOR_STORE,LEGACY_STORE]){
  try{const x=hydrate(JSON.parse(localStorage.getItem(key)));if(x){S=x;save();return S}}catch(e){}
 }
 return null;
}
function save(){
 try{
  localStorage.setItem(STORE,JSON.stringify(S));
  storageState={ok:true,lastSaved:Date.now()};
 }catch(e){
  // Never report that a change is safe if storage is blocked or full.
  storageState={ok:false,lastSaved:storageState.lastSaved};
 }
 if(typeof root.dispatchEvent==='function'&&typeof root.Event==='function')
  root.dispatchEvent(new root.Event('office-save-status'));
 return storageState.ok;
}
function hasSave(){try{return !!JSON.parse(localStorage.getItem(STORE)||localStorage.getItem(PRIOR_STORE)||localStorage.getItem(LEGACY_STORE))?.v}catch(e){return false}}
function wipe(){try{localStorage.removeItem(STORE)}catch(e){}}

/* ---------- lookups ---------- */
const W=id=>S.roster.find(w=>w.id===id);
// Personal state survives a contract; market price and contract obligations do not.
const PERSONAL_FIELDS=['age','ceiling','ring','mic','psych','safe','heat','morale','loyal','fatigue',
 'injury','injurySince','wear','niggle','nigglePart','relapse','retireWarned',
 'learned','learning','micWork','progress','trend','prepHistory','matches','wins','starSum','best','startSkills'];
function personalRecord(w){
 const record={};
 for(const k of PERSONAL_FIELDS)if(w[k]!==undefined)record[k]=w[k];
 return JSON.parse(JSON.stringify(record));
}
function personnel(s,id){
 const base=D.findWrestler?.(id)||D.FOES.find(f=>f.id===id)||D.TALENT.find(f=>f.id===id);
 if(!base)return undefined;
 return {...base,...(s?.worldV4?.personnel?.[id]||{}),...(s?.free?.find(w=>w.id===id)||{})};
}
// Update the authoritative personnel record, not a detached lookup object.
 // Only personal fields survive a contract change; never overwrite contract terms.
 function updatePersonnel(s,id,patch){
  if(!s||!id||!patch)return null;
  const owned=s.roster.find(w=>w.id===id),worker=owned||personnel(s,id);
  if(!worker||s.worldV4?.contracts[id]?.owner==='retired')return null;
  const record=personalRecord(patch);
  if(owned){Object.assign(owned,record);return owned;}
  const world=s.worldV4;if(!world)return null;
  const merged=personalRecord({...worker,...record});
  world.personnel??={};world.personnel[id]=merged;
  const free=s.free.find(w=>w.id===id);if(free)Object.assign(free,personalRecord(merged));
  return personnel(s,id);
 }
 const F=id=>personnel(S,id);
const P=id=>S.promoters.find(p=>p.id===id);
const feudKey=(wid,rid)=>wid+':'+rid;
const feud=(wid,rid)=>S.feuds[feudKey(wid,rid)];
function booked(wid){return S.card.some(c=>c.wid===wid)}
function bookedAt(wid,when){return when===abs()?booked(wid):S.futureBookings.some(c=>c.wid===wid&&c.eventAbs===when)}
function inCamp(w,when=abs()){return !!(w?.program?.type==='camp' && when>=abs() && when<abs()+w.program.left)}
function availableAt(w,when=abs()){return !!(w && when>=abs() && (!w.injury||w.injury<=(when-abs())) && !bookedAt(w.id,when) && !inCamp(w,when))}
// One opponent cannot be contracted twice on the same night, including as another player's opponent.
function bookingConflict(wid,rid,when){
 const clash=[...S.card,...S.futureBookings].find(c=>c.eventAbs===when&&[wid,rid].some(id=>id===c.wid||id===c.rid));
 if(!clash)return null;
 const label='S'+(Math.floor((when-1)/16)+1)+' W'+((when-1)%16+1);
 if(clash.wid===wid||clash.rid===wid)return (W(wid)?.short||wid)+' isn’t free on '+label+'; already committed to another match.';
 return (F(rid)?.name||rid)+' is already booked on '+label+' against '+(W(clash.wid)?.name||F(clash.wid)?.name||clash.wid)+'.';
}
function available(w){return availableAt(w)}
function opponentReady(s,id,when=(s.season-1)*16+s.week){
 if(!id||s.worldV4?.contracts[id]?.owner==='retired')return false;
 const w=personnel(s,id);
 return !!w&&(!w.injury||w.injury<=Math.max(0,when-((s.season-1)*16+s.week)));
}
function wages(){return S.roster.reduce((t,w)=>t+w.wage,0)}
const OVERHEAD=100;function overhead(count=S.roster.length){return 60+count*25}

/* ---------- inbox ---------- */
function msg(m){S.inbox.unshift({id:'m'+Math.floor(Math.random()*1e9).toString(36),week:S.week,season:S.season,read:false,answer:null,...m});S.inbox=S.inbox.slice(0,60)}
function pending(){return S.inbox.filter(m=>m.kind==='decision'&&!m.answer)}

/* ---------- contract ownership and booked opponents ----------
   An ownership change must never leave a wrestler contracted to fight their own stablemate,
   or leave a programme holding dates for somebody who is no longer on that side of the deal.
   Signed contracts use the usual cancellation machinery, including one programme withdrawal;
   unsigned offers are removed without a promoter penalty. */
function reconcileOwnership(id,{outgoing=false,reason='Roster change'}={}){
 if(!S||!id)return {cancelled:0,offers:0};
 const before=[...S.card,...S.futureBookings];
 // Programmes are indivisible: close each once, even when three contracted beats refer to this ID.
 root.OfficeProgrammes?.withdrawForTransfer?.(id,reason);
 for(const c of before){
  if(c.rid!==id&&c.wid!==id)continue;
  if(![...S.card,...S.futureBookings].some(x=>x.id===c.id))continue;
  root.OfficeGame?.unbook?.(c.id);
 }
 const removed=S.offers.filter(o=>(outgoing&&o.wid===id)||o.rid===id||
  (o.programme?.beats||[]).some(b=>b.rid===id)||(outgoing&&o.programme?.wid===id));
 if(removed.length){
  const ids=new Set(removed.map(o=>o.programme?.id).filter(Boolean));
  S.offers=S.offers.filter(o=>!removed.includes(o));
  const staged=S.territory?.programmes;
  if(staged?.offered)staged.offered=staged.offered.filter(p=>!ids.has(p.id)&&!p.beats?.some(b=>b.rid===id));
 }
 return {cancelled:before.length-[...S.card,...S.futureBookings].length,offers:removed.length};
}
/* Read-only, no-income estimate for a proposed free-agent contract.
   New signings start on free light drills; current training and coach costs
   are included. Do not assume unsigned offers or match purses will pay out. */
function signingForecast(id){
 const w=S?.free.find(x=>x.id===id);if(!w)return null;
 const afterFee=S.cash-w.fee,weeklyWages=wages()+w.wage,weeklyOverhead=overhead(S.roster.length+1);
 const weeklyTraining=trainingBill()+INTENSITY.light.cost,weeklyCost=weeklyWages+weeklyOverhead+weeklyTraining;
 const runway=Math.max(0,Math.floor(afterFee/weeklyCost));
 return {fee:w.fee,afterFee,weeklyWages,weeklyOverhead,weeklyTraining,weeklyCost,
  afterWeek:afterFee-weeklyCost,runway,affordable:afterFee>=0&&S.roster.length<5,
  risk:runway<1?'critical':runway<2?'tight':runway<4?'limited':'buffer'};
}

/* ---------- signing ---------- */
function sign(id){
 const firstSigning=S.roster.length===0;
 const w=S.free.find(x=>x.id===id);
 if(!w)return 'Not available.';
 if(S.roster.length>=5)return 'Your locker room is full (five contracts).';
 if(S.cash<w.fee)return `You need ${money(w.fee)} to sign ${w.name}.`;
 reconcileOwnership(id,{reason:'The booked opponent joined your stable'});
 S.cash-=w.fee;S.free=S.free.filter(x=>x.id!==id);
 S.roster.push({...w,trend:[],prepHistory:[],learned:[],learning:null,micWork:{},progress:{},startSkills:{ring:w.ring,mic:w.mic,psych:w.psych,safe:w.safe},injury:0,matches:0,wins:0,starSum:0,best:0,wear:{},niggle:0,nigglePart:null,relapse:null,ceiling:w.ceiling??clamp(Math.max(w.ring,w.mic,w.psych)+12,0,95),
  ...personalRecord(w),
  program:null,prep:{},session:null,rehearsedAt:null,training:'ring',intensity:'light',promise:null,lastRaise:0,flags:{},joined:abs()});
 snapshot(S.roster.at(-1));
 if(S.worldV4)root.OfficeWorldV4?.markPlayer(S,id);
 // Keep the original invitations but guarantee a suitable current-week offer after the first signing.
 if(firstSigning&&S.week===1&&!S.offers.some(o=>o.eventAbs===abs()&&D.divisionOf(o.rid)===D.divisionOf(w))){
  const promoter=S.promoters.find(eligible);
  if(promoter){const offer=genOffer(promoter,0);if(offer.rid)S.offers.push(offer);}
 }
 save();return null;
}
// Free agents are scouted, not measured. Ring, Mic, Psych and Safe show as a range that narrows as you
// watch the wrestler. Draw stays exact. Knowledge is counted once per week, when you look at them.
const SCOUT_STATS=['ring','mic','psych','safe'];
function scoutWidth(k){return k>=5?1:k>=3?5:k>=1?10:20}
function scoutBand(w,key){
 const v=Math.round(clamp(w[key]??0,0,99));
 if(!SCOUT_STATS.includes(key))return {lo:v,hi:v,exact:true};
 const width=scoutWidth(w.knowledge||0);
 if(width===1)return {lo:v,hi:v,exact:true};
 const lo=Math.floor(v/width)*width;
 return {lo,hi:Math.min(99,lo+width-1),exact:false};
}
function scoutWatch(w){if(!w||w.scoutedAt===abs())return;w.scoutedAt=abs();w.knowledge=(w.knowledge||0)+1;save()}
// The hidden ceiling (set at signing or at the first season end) slows training as a wrestler nears it.
function ceilingRoom(w,cur){if(w.ceiling==null)return 1;return cur>=w.ceiling?.1:cur>=w.ceiling-8?.5:1}
function returnToMarket(w,discount=false){
 const base=D.findWrestler?.(w.id)||D.TALENT.find(t=>t.id===w.id)||w;
 const record=personalRecord(w);
 if(S.worldV4){
  S.worldV4.personnel??={};S.worldV4.personnel[w.id]=record;
 }
 S.free=S.free.filter(x=>x.id!==w.id);
 S.free.push({...base,...personalRecord(w),fee:discount?Math.round(base.fee*.9):base.fee,knowledge:5});
 if(S.worldV4)root.OfficeWorldV4?.markMarket(S,w.id);
}
function release(id){
 const w=W(id);if(!w)return;
 reconcileOwnership(id,{outgoing:true,reason:'The wrestler was released from your stable'});
 S.roster=S.roster.filter(x=>x.id!==id);
 returnToMarket(w,true);
 msg({from:'The office',subject:`${w.name} released`,kind:'info',body:[`${w.name} cleared out the locker today. No hard feelings, on paper.`]});
 save();
}
function setTraining(id,kind){const w=W(id);if(!w||!D.TRAINING[kind]||w.injury)return 'Unavailable for training.';if(w.program)return 'Finish or cancel the development programme first.';w.training=kind;save();return null;}
const INTENSITY={
 light:{name:'Light drills',cost:0,gain:.3,fat:1,risk:0,hint:'Free, slow progress; a little fatigue.'},
 standard:{name:'Coached session',cost:55,gain:.85,fat:8,risk:.009,hint:'£55 per week; steady improvement and moderate fatigue.'},
 hard:{name:'Intensive camp',cost:140,gain:1.6,fat:23,risk:.045,hint:'£140 per week; faster improvement, exhaustion and injury risk.'}
};
/* v3.8 SESSIONS WITH DENNIS. On top of the weekly focus, a wrestler can spend a session with the
   road agent: rehearse for the next match, learn a big-spot move, or work on one style at the mic.
   Dennis has time for two sessions a week across the whole stable. */
const SESSION_CAP=2;
const MIC_STYLES={people:'Speaking for the crowd',proof:'Making it about the contest',imagery:'Painting a picture',accusation:'Questioning their character',swagger:'Owning the spotlight'};
const REHEARSAL_WEEKS=2;
function micLevel(w,style){return Math.floor(w.micWork?.[style]||0)}
function rehearsed(w){return w.rehearsedAt!=null&&abs()-w.rehearsedAt<=REHEARSAL_WEEKS}
function sessionKind(v){return !v||v==='none'?null:v.split(':')[0]}
function sessionsTaken(except){return S.roster.filter(w=>w.id!==except&&w.session).length}
function sessionOptions(w){
 const room=root.OfficeRoom,out=[{value:'none',label:'No session',hint:'Dennis has other things to do.'}];
 const busy=!!w.injury||w.program?.type==='camp';
 out.push({value:'rehearse',label:'Rehearse for the next match',hint:'Goes into the next match keener and better at sticking to the match layout. Counts for '+REHEARSAL_WEEKS+' weeks.',disabled:busy});
 for(const m of room?room.learnable(w):[]){
  const prog=w.learning?.move===m.id?w.learning.done:0;
  out.push({value:'learn:'+m.id,label:'Learn the '+m.label,hint:(prog?prog+' of '+m.weeks:m.weeks)+' weeks. Becomes '+w.short+'’s own big spot.'+(m.risk?' A risky move.':''),disabled:busy});
 }
 for(const [k,name] of Object.entries(MIC_STYLES)){
  const lv=micLevel(w,k);
  out.push({value:'mic:'+k,label:'Mic work: '+name.toLowerCase(),hint:lv>=2?'Fully practised. Keeps it sharp.':lv?'Practised once over. More work makes it suit '+w.short+' even better.':'Makes this kind of opening suit '+w.short+' better.',disabled:!!w.injury});
 }
 const tip=sessionTip(w);if(tip){const o=out.find(x=>x.value===tip.value);if(o){o.suggested=true;o.why=tip.why;}}
 return out;
}
// What the last match suggests, in Dennis's words.
function sessionTip(w){
 const last=S.history.find(h=>h.wid===w.id),room=root.OfficeRoom;
 const soon=booked(w.id)||S.futureBookings.some(c=>c.wid===w.id&&c.eventAbs<=abs()+1);
 if(last?.sheet&&last.sheet.missed+last.sheet.adapted>=2&&!rehearsed(w))return {value:'rehearse',why:'The last match drifted from the match layout.'};
 if(last?.promo&&(last.promo.quality??60)<50){
  const v=room?.VOICE[w.id]||'stoic',style={grand:'imagery',sermon:'imagery',precise:'proof',stoic:'proof',eager:'people',earnest:'people',gruff:'accusation',slippery:'swagger'}[v];
  if(micLevel(w,style)<2)return {value:'mic:'+style,why:'Lost the room at the microphone last time.'};
 }
 if(soon&&!rehearsed(w))return {value:'rehearse',why:'Booked soon.'};
 const learn=room?.learnable(w)[0];
 if(learn&&!(w.learned||[]).length&&w.ring>=55)return {value:'learn:'+learn.id,why:'No big spot of '+w.short+'’s own yet.'};
 return null;
}

/* Pure weekly training plan shared by the forecast and settlement.
   No mutations or RNG draws here; only endWeek rolls injury risk. */
function trainingWeekPlan(w,context=null){
 if(!w)return null;
 const worked=context?.worked??S.history.some(h=>h.wid===w.id&&h.season===S.season&&h.week===S.week);
 const cost=trainingCost(w);
 if(w.injury||w.training==='rest'){
  return {kind:'rest',cost,worked,fatigue:clamp(w.fatigue-(worked?6:24)),detail:w.injury?'Injured: no skill training until recovered.':'Resting reduces fatigue.'};
 }
 if(w.training==='promo'){
  return {kind:'promo',cost,worked,fatigue:clamp(w.fatigue+2),heat:Math.round(1+w.mic/35),detail:'A recorded promo raises heat, not a training skill.'};
 }
 const stat=D.TRAINING[w.training]?.stat,intensity=INTENSITY[w.intensity||'light']||INTENSITY.light;
 if(!stat)return {kind:'other',cost,worked};
 const cur=w[stat],camp=w.program?.type==='camp',specialist=!context?.independent&&S.coach&&COACHES[S.coach].stat===stat?COACHES[S.coach].boost:0;
 const rookie=w.tier==='Rookie'&&cur<68?1.4:1;
 const growth=(camp?1.9:intensity.gain)*(1+specialist)*rookie*(cur>=88?.24:cur>=80?.5:1)*ceilingRoom(w,cur)*(w.fatigue>=70?.6:1);
 const bank=(w.progress?.[stat]||0)+growth;
 const fatigue=clamp(w.fatigue+(camp?13:intensity.fat)+(worked?5:0));
 const next=Math.min(99,cur+Math.floor(bank)),risk=(camp?.015:intensity.risk)*(fatigue>=65?2.5:1)*(worked?1.5:1);
 return {kind:'skill',stat,cost,worked,growth,skillAfter:next,gain:next-cur,progress:next>=99?0:Math.round((bank%1)*100),
   progressBank:bank-Math.floor(bank),fatigue,risk,riskPct:risk*100,coached:!!specialist,camp,
   detail:'Projection of weekly training before any Dennis session or other end-of-week events.'};
}
function trainingForecast(w){
 const plan=trainingWeekPlan(w);
 if(!plan||plan.kind!=='skill')return plan;
 const {progressBank,risk,camp,...forecast}=plan;
 return forecast;
}
function trainingAdvice(w){
 if(!w)return [];
 const out=[],locked=!!w.program,injured=!!w.injury;
 const add=(priority,kind,value,title,why)=>out.push({priority,kind,value,title,why});
 if(injured)add('urgent','info',null,'Recovery first',w.short+' is injured for '+w.injury+' more week(s). Skill work is unavailable.');
 else if(w.fatigue>=70&&!locked&&w.training!=='rest')add('urgent','focus','rest','Give them a rest',w.short+' has '+w.fatigue+' fatigue. Another training week is likely to be less productive.');
 else if(w.fatigue>=55&&!locked&&w.intensity==='hard'&&w.training!=='rest'&&w.training!=='promo')add('urgent','intensity','light','Reduce the workload',w.short+' has '+w.fatigue+' fatigue. Intensive training raises exhaustion and injury risk.');
 else if(w.fatigue>=55&&locked)add('urgent','info',null,'Watch their fatigue',w.short+' has '+w.fatigue+' fatigue, but the current development programme locks the weekly settings.');
 const tip=sessionTip(w),slotOpen=!!w.session||sessionsTaken(w.id)<SESSION_CAP;
 if(w.session){
  const option=sessionOptions(w).find(o=>o.value===w.session);
  add('note','info',null,'Dennis is booked',option?.label||'A session is already assigned');
 }else if(tip){
  const option=sessionOptions(w).find(o=>o.value===tip.value);
  if(option&&!option.disabled&&slotOpen)add('normal','session',tip.value,option.label,tip.why+' '+option.hint);
  else if(!slotOpen&&!option?.disabled)add('normal','info',null,'Dennis is fully booked',tip.why+' Free one of the two sessions to make room.');
 }
 if(!injured&&!locked){
  const target=w.style==='Spectacle'&&w.safe<55?'safe':w.style==='Story'&&w.psych<55?'psych':w.mic<40?'mic':w.ring<55?'ring':null;
  if(target&&w.training!==target)add('normal','focus',target,'Develop '+D.TRAINING[target].name.toLowerCase(),
   'At '+w[target]+', this is a weak attribute for '+w.short+'. It will improve through the normal weekly training schedule.');
 }
 if(!out.length)add('note','info',null,'Stay with the plan','No pressing change indicated by condition, booking preparation or the last match.');
 const order={urgent:0,normal:1,note:2};
 return out.sort((a,b)=>order[a.priority]-order[b.priority]).slice(0,3);
}
function trainingReview(){return S.trainingReviews?.at(-1)||null;}

function setSession(id,value){
 const w=W(id);if(!w)return 'Unknown wrestler.';
 if(!value||value==='none'){w.session=null;save();return null;}
 const o=sessionOptions(w).find(x=>x.value===value);if(!o)return 'That session isn’t available.';
 if(o.disabled)return w.injury?'Injured wrestlers can only do mic work.':'Away at camp.';
 if(!w.session&&sessionsTaken(w.id)>=SESSION_CAP)return 'Dennis only has time for '+SESSION_CAP+' sessions a week. Free one up first.';
 w.session=value;
 if(sessionKind(value)==='learn'){const move=value.slice(6);if(w.learning?.move!==move){const m=root.OfficeRoom.learnable(w).find(x=>x.id===move);w.learning={move,label:m.label,done:0,need:m.weeks};}}
 save();return null;
}
function runSession(w,worked,lines){
 // Mic practice fades if it is not kept up.
 for(const k of Object.keys(w.micWork||{}))if(w.session!=='mic:'+k)w.micWork[k]=Math.max(0,w.micWork[k]-.1);
 const kind=sessionKind(w.session);if(!kind)return;
 if(w.program?.type==='camp')return;
 if(kind==='rehearse'){
  if(w.injury)return;
  w.rehearsedAt=abs();w.fatigue=clamp(w.fatigue+3);w.session=null;
  lines.push(`${w.short} rehearsed with Dennis. Ready for the next match.`);return;
 }
 if(kind==='learn'){
  if(w.injury)return;
  const L=w.learning;if(!L){w.session=null;return;}
  if(w.fatigue>=70){lines.push(`${w.short} was too tired to work on the ${L.label}.`);return;}
  L.done++;w.fatigue=clamp(w.fatigue+5);
  if(L.done>=L.need){
   w.learned=[...new Set([...(w.learned||[]),L.move])];w.learning=null;w.session=null;
   lines.push(`${w.short} has learned the ${L.label}. It’s theirs for the big spot now.`);
   msg({from:'Dennis',subject:`${w.short} has a new move`,kind:'info',body:[`${w.short} has the ${L.label} down. I’ve only been landed on twice.`,`It’ll come up as ${w.short}’s own big spot in the agents’ room.`]});
  }else lines.push(`${w.short}: working on the ${L.label}, ${L.done} of ${L.need} weeks.`);
  return;
 }
 if(kind==='mic'){
  const k=w.session.slice(4),before=micLevel(w,k);
  w.micWork[k]=Math.min(2,(w.micWork[k]||0)+.5);w.fatigue=clamp(w.fatigue+1);
  const after=micLevel(w,k);
  lines.push(`${w.short}: mic work on ${MIC_STYLES[k].toLowerCase()}${after>before?` — ${after>=2?'fully practised':'getting the hang of it'}`:''}.`);
 }
}
function useRehearsal(w){w.rehearsedAt=null;}
function setIntensity(id,mode){const w=W(id);if(!w||!INTENSITY[mode]||w.injury)return 'Unavailable for training.';if(w.program)return 'Finish or cancel the development programme first.';w.intensity=mode;save();return null;}
const COACHES={technical:{name:'Technical coach',stat:'ring',fee:230,wage:65,boost:.35},psychology:{name:'Match psychology coach',stat:'psych',fee:230,wage:65,boost:.35},safety:{name:'Safety & conditioning coach',stat:'safe',fee:250,wage:70,boost:.4},microphone:{name:'Promo coach',stat:'mic',fee:200,wage:60,boost:.35}};
function hireCoach(id){if(!COACHES[id])return 'Unknown specialist.';if(S.coach)return 'You already employ a specialist. Release them first.';if(S.cash<COACHES[id].fee)return 'Not enough cash for the hiring fee.';S.cash-=COACHES[id].fee;S.coach=id;msg({from:'The office',subject:'Specialist joins the stable',kind:'info',body:[`${COACHES[id].name} hired for ${money(COACHES[id].fee)} upfront and ${money(COACHES[id].wage)} each week. Training in ${COACHES[id].stat} is more effective.`]});save();return null}
function fireCoach(){if(!S.coach)return 'No specialist employed.';const name=COACHES[S.coach].name;S.coach=null;msg({from:'The office',subject:'Coaching contract ended',kind:'info',body:[`${name} has left. Future weekly coaching wages stop.`]});save();return null}
function coachWage(){return S.coach?COACHES[S.coach].wage:0}
function startProgram(id,type){const w=W(id);if(!w||w.injury)return 'Unavailable for development.';if(w.program)return 'This wrestler already has an active programme.';if(!['block3','block6','camp'].includes(type))return 'Unknown programme.';if(w.training==='rest'||w.training==='promo')return 'Choose a skill to develop first.';
 if(type==='camp'&&[0,1,2].some(delta=>bookedAt(w.id,abs()+delta)))return 'Cancel or complete the conflicting bookings first; a camp means three full weeks away.';
 w.program={type,left:type==='block6'?6:3,total:type==='block6'?6:3,focus:w.training,intensity:w.intensity,start:abs(),gains:0};if(type==='camp')w.intensity='hard';save();return null;
}
function cancelProgram(id){const w=W(id);if(!w?.program)return 'No active development programme.';const camp=w.program.type==='camp';w.program=null;w.intensity='light';if(camp){w.morale=clamp(w.morale-3);w.fatigue=clamp(w.fatigue+5)}save();return null;}

function trainingCost(w){return w.injury||w.training==='rest'?0:w.training==='promo'?40:w.program?.type==='camp'?185:INTENSITY[w.intensity||'light'].cost;}
function trainingBill(){return S.roster.reduce((t,w)=>t+trainingCost(w),coachWage());}
function monthStatus(){
 const h=S.history.filter(h=>h.season===1&&h.week<=4),okMatch=h.some(x=>x.stars>=3),cash=S.cash>=750,rep=S.rep>=30;
 const developed=S.roster.some(w=>['ring','mic','psych','safe'].some(k=>w[k]-(w.startSkills?.[k]??w[k])>=2));
 return {okMatch,cash,rep,developed,passed:okMatch&&[cash,rep,developed].filter(Boolean).length>=2};
}

/* Two management meetings a week: spend them on a promoter OR a wrestler. */
function checkIn(id,choice){
 const w=W(id);if(!w)return {error:'That wrestler is no longer with your stable.'};
 if(S.focus<=0)return {error:'No management meetings left this week.'};
 if(!['listen','promise','bonus'].includes(choice))return {error:'Choose a conversation approach.'};
 if(choice==='promise'&&w.promise?.status==='open')return {error:`You already promised ${w.short} a featured match. Honour or break that first.`};
 if(choice==='bonus'&&S.cash<120)return {error:'A £120 bonus is beyond your available cash.'};
 S.focus--;S.business.meetings++;
 let result='';
 if(choice==='listen'){
  w.morale=clamp(w.morale+5);w.loyal=clamp(w.loyal+4);
  result=`You listened to ${w.short} without making a promise. Morale +5, loyalty +4.`;
 }else if(choice==='bonus'){
  S.cash-=120;w.morale=clamp(w.morale+6);w.loyal=clamp(w.loyal+9);
  result=`A £120 loyalty bonus reassures ${w.short}. Morale +6, loyalty +9. The money is gone.`;
 }else{
  w.promise={status:'open',type:'feature',start:abs(),deadline:abs()+2,matchesAt:w.matches};
  w.morale=clamp(w.morale+8);
  result=`You promised ${w.short} a future featured bout or main event within two weeks. Morale +8 now. Missing the deadline will damage trust.`;
 }
 msg({from:w.name,subject:'Private conversation',kind:'info',body:[result]});save();return {text:result};
}
function resolvePromises(){
 for(const w of S.roster){
  const pr=w.promise;if(!pr||pr.status!=='open')continue;
  const fulfilled=w.matches>(pr.matchesAt||0)&&S.history.some(h=>h.wid===w.id&&((h.season-1)*16+h.week)>=pr.start&&((h.season-1)*16+h.week)<=pr.deadline&&D.SLOTS[h.slot]?.rank>=D.SLOTS.feature.rank);
  if(fulfilled){pr.status='kept';w.morale=clamp(w.morale+6);w.loyal=clamp(w.loyal+7);S.business.kept++;
   msg({from:w.name,subject:'You kept your word',kind:'info',body:[`“You told me you'd get me a featured match. You did. That matters.”`,`${w.short}: morale +6, loyalty +7.`]});}
  else if(abs()>=pr.deadline){pr.status='broken';w.morale=clamp(w.morale-14);w.loyal=clamp(w.loyal-12);S.business.broken++;
   msg({from:w.name,subject:'You broke your promise',kind:'info',body:[`“Two weeks. You said you'd get me a featured match. Nothing.”`,`${w.short}: morale −14, loyalty −12.`]});}
 }
}
function abs(){return (S.season-1)*16+S.week}

/* ---------- offers ---------- */
function eligible(p){return p.blacklist<=0&&p.trust>=15&&S.rep>=p.minRep}
function makeOffers(){
 const now=abs();
 S.offers=S.offers.filter(o=>o.eventAbs>=now&&o.expiresAbs>=now&&eligible(P(o.pid)));
 const ps=S.promoters.filter(eligible);
 // The calendar contains immediate work and limited-window future commitments.
 if(S.season===1&&[6,10,14].includes(S.week)&&ps.length){
  const target=S.week+2,p=ps.slice().sort((a,b)=>b.reach-a.reach)[0];
  const labels={6:'Regional Showcase',10:'Television Audition',14:'Season Finale'};
  const extra={...genOffer(p,2,S.week===14?'main':'feature'),tag:labels[S.week],boost:S.week===14?1.65:1.35,expiresAbs:abs()+1};
  S.offers.unshift(extra);
  msg({from:p.voice+', '+p.name,subject:`Invitation: ${labels[S.week]} in week ${target}`,kind:'info',body:[`A ${D.SLOTS[extra.slot].name.toLowerCase()} booking is available for week ${target}. Reply no later than week ${S.week+1}; the event slot will not be kept open for you.`,`The agreed finish is ${D.FINISHES[extra.finish].name.toLowerCase()}. A training camp covering that date would prevent your wrestler from accepting.`,`See Bookings for the offer and negotiate the exact terms if you wish.`]});
 }
 for(const p of ps){
  S.offers.push(genOffer(p,0));
  if(rand()<.52){const delay=2+Math.floor(rand()*2);S.offers.push(genOffer(p,delay));}
 }
 for(const fd of Object.values(S.feuds)){
  if(fd.closed||W(fd.rid)||S.worldV4?.contracts[fd.rid]?.owner==='retired')continue;const w=W(fd.wid);if(!w||w.injury||D.divisionOf(w)!==D.divisionOf(fd.rid))continue;
  if(fd.heat>=70&&fd.matches>=2&&ps.length){const p=ps.slice().sort((a,b)=>b.reach-a.reach)[0];S.offers.unshift({...genOffer(p,2),rid:fd.rid,wid:fd.wid,slot:'main',tag:'Blow-off',finish:rand()<.55?'win_clean':'lose_clean',boost:1.4});}
  else if(fd.heat>=40&&rand()<.6&&ps.length){const p=one(ps),base=genOffer(p,1);S.offers.unshift({...base,rid:fd.rid,wid:fd.wid,slot:D.SLOT_ORDER[Math.min(3,D.SLOT_ORDER.indexOf(base.slot)+1)],tag:'Rematch',boost:1.15});}
 }
 const T=root.OfficeTerritory;
 if(T?.titleMatch)for(const p of ps)for(const div of D.DIVISION_ORDER){
  const open=[...S.offers,...S.card,...S.futureBookings].some(x=>x.title?.pid===p.id&&x.title?.div===div);
  const m=!open&&T.titleMatch(p.id,div);if(!m||!availableAt(W(m.wid),abs()+1))continue;
  const champion=m.kind==='defence',keep=rand()<(champion?.55:.3)+p.trust/300;
  S.offers.unshift({...genOffer(p,1,'main'),rid:m.rid,wid:m.wid,tag:champion?'Title defence':'Title match',title:{pid:p.id,div},boost:1.5,
   finish:champion?(keep?(rand()<.6?'win_clean':'win_dirty'):'lose_clean'):(keep?'win_clean':(rand()<.5?'lose_protected':'lose_clean'))});
 }
 // Keep a reliable route to weekly income, but offer future trade-offs too.
 const today=S.offers.filter(o=>o.eventAbs===now).length;
 for(let i=today;i<Math.min(3,ps.length);i++)S.offers.push(genOffer(one(ps),0));
 S.offers=S.offers.filter(o=>o.rid&&opponentReady(S,o.rid,o.eventAbs)).sort((a,b)=>a.expiresAbs-b.expiresAbs||a.eventAbs-b.eventAbs).slice(0,11);
}

function genOffer(p,delay=0,requestedSlot){
 const ranks=S.rep<30?['opener','opener','mid','mid','feature']:S.rep<50?['opener','mid','mid','feature','feature','main']:['mid','feature','feature','main','main'];
 const established=root.OfficeTerritory?.promotionRank(p.id).find(w=>w.owned&&w.matches>0&&D.SLOTS[w.slot].rank>=2);
 if(established)ranks.push(established.slot,established.slot);
 const slot=requestedSlot||one(ranks);
 const pw=.28+p.trust/300+S.rep/400;
 const finish=rand()<pw?(rand()<.55?'win_clean':'win_dirty'):(rand()<.5?'lose_protected':'lose_clean');
 const div=S.roster.length?D.divisionOf(one(S.roster)):one(D.DIVISION_ORDER);
 const opponents=root.OfficeTerritory?.opponents(p.id,slot,div)||D.FOES;
 return {id:uid('o'),pid:p.id,rid:one(opponents)?.id??null,slot,finish,wid:null,tag:null,boost:1,haggled:false,eventAbs:abs()+delay,expiresAbs:abs()+(delay?1:0)};
}
function purse(o,w){
 const p=P(o.pid),s=D.SLOTS[o.slot],fin=D.FINISHES[o.finish];
 const tier={Star:1.5,Veteran:1.1,Prospect:1,Rookie:.8}[w?.tier]||1;
 // Reputation improves terms quickly in the early career, but national
 // exposure is already priced into promoter reach and the card position.
 // Diminishing returns prevent those three premiums from compounding unchecked.
 const reputationPremium=Math.min(40,S.rep)*1.5+Math.max(0,S.rep-40)*.5;
 const base=100+p.reach*3.5+reputationPremium;
 const appearances=S.territory?.cards[p.id]?.[w?.id]?.matches||0;
 const localDraw=1+Math.min(.25,appearances*.05);
 return r10(base*s.mult*fin.purse*tier*(1+((w?.heat||40)-40)/200)*localDraw*(o.boost||1)*(o.bump||1));
}
/* Explicit promoter conversation; no one-shot dice roll and no reaction-time mechanic. */
function meeting(oid,wid){
 const o=S.offers.find(x=>x.id===oid),w=W(wid);if(!o||!w||!availableAt(w,o.eventAbs))return {error:'Choose a wrestler available on the event date.'};
 if(o.wid&&o.wid!==wid)return {error:'This offer is reserved for another wrestler.'};
 if(D.divisionOf(w)!==D.divisionOf(o.rid))return {error:`This is a ${D.DIVISIONS[D.divisionOf(o.rid)].name.toLowerCase()} match.`};
 if(o.talk&&o.talk.wid!==wid)return {error:`These negotiated terms belong to ${W(o.talk.wid)?.name||'another wrestler'}.`};
 const p=P(o.pid);
 if(!o.talk){o.talk={wid,step:'start',topic:null,turns:0,original:{slot:o.slot,finish:o.finish,bump:o.bump||1,fee:purse(o,w)},log:[{who:p.voice,text:`${w.name} versus ${F(o.rid).name}. ${D.SLOTS[o.slot].name}, ${D.FINISHES[o.finish].name.toLowerCase()}, ${money(purse(o,w))}. That's the offer.`}]};save()}
 return {talk:o.talk,offer:o};
}
const TALK_TOPICS={fee:'Increase the appearance fee',protect:'Protect a clean loss',slot:'Move higher on the card'};
const ARGUMENTS={crowd:'Show the drawing power',reliability:'Promise a professional match',trade:'Offer a financial compromise'};
function talkMove(oid,wid,move){
 const found=meeting(oid,wid);if(found.error)return found;
 const {talk:t,offer:o}=found,w=W(wid),p=P(o.pid);if(t.step==='done'){
  if(move==='revert'&&t.verdict!=='original'){
   o.slot=t.original.slot;o.finish=t.original.finish;o.bump=t.original.bump;t.verdict='original';t.detail=`Restored original terms, ${money(t.original.fee)}.`;
   t.log.push({who:'You',text:"I'll take the original terms instead."},{who:p.voice,text:'Very well. The first offer still stands.'});save();return {talk:t,offer:o};
  }
  return {error:'That discussion is complete. Sign the terms or close the meeting.'};
 }
 if(t.step==='start'){
  const topic=move.replace('ask:','');if(!move.startsWith('ask:')||!TALK_TOPICS[topic])return {error:'Choose what you want to negotiate.'};
  if(topic==='protect'&&o.finish!=='lose_clean')return {error:'This loss is already protected, or the wrestler is booked to win.'};
  if(topic==='slot'&&o.slot==='main')return {error:'This is already the main event.'};
  if(S.focus<1)return {error:'No management meetings remain this week. You can accept the original offer.'};
  S.focus--;t.topic=topic;t.step='reason';t.turns++;
  const ask=topic==='fee'?`I'd like ${money(Math.round(purse(o,w)*1.2/10)*10)} for ${w.short}.`:
    topic==='protect'?`${w.short} will take the loss, but needs to look competitive.`:`I want ${w.short} one place higher on the card.`;
  t.log.push({who:'You',text:ask},{who:p.voice,text:p.personality==='cold'?`What do I get in return? Give me a business reason.`:p.personality==='aggressive'?`You want something, you have to sell me on it.`:p.personality==='traditional'?`Why would I change a card I've already written?`:`Go on. Make the case.`});
  save();return {talk:t,offer:o};
 }
 if(t.step!=='reason'||!move.startsWith('arg:'))return {error:'Choose an argument.'};
 const arg=move.slice(4);if(!ARGUMENTS[arg])return {error:'Unknown argument.'};
 const topic=t.topic,base=p.trust*.38+w.heat*.27+w.pro*.13+S.rep*.12+(D.STYLE_PLAN[w.style]===p.likes?10:0);
 const boost=arg==='crowd'?Math.round(w.heat*.20+(p.personality==='showman'?9:0)):
   arg==='reliability'?Math.round(w.pro*.16+(p.personality==='traditional'?9:0)):
   Math.round(13+(p.personality==='cold'?8:0));
 const strength=base+boost-(p.personality==='cold'?7:0);
 const threshold={fee:58,protect:62,slot:69}[topic];
 t.log.push({who:'You',text:arg==='crowd'?`${w.name} gets a reaction, and a stronger position on this card will sell tickets.`:
  arg==='reliability'?`You know ${w.short} will turn up, protect the finish and deliver what you paid for.`:
  `I'll make the financial side easier if you give us the career opportunity.`});
 const oldFee=purse(o,w);let verdict='refused',detail='';let c=0;
 if(strength>=threshold){verdict='agreed';c=1}else if(strength>=threshold-17){verdict='counter';c=.5}
 if(topic==='fee'){
  if(c){o.bump=+( (o.bump||1)*(c===1?1.20:1.10)).toFixed(4);detail=`${money(purse(o,w))} instead of ${money(oldFee)}. ${c===1?'Twenty':'Ten'} per cent more for the appearance.`}
  else detail=`The original fee of ${money(oldFee)} stands.`;
 }else if(topic==='protect'){
  if(c){o.finish='lose_protected';o.bump=+((o.bump||1)*(c===1?.92:.84)).toFixed(4);detail=`Protected loss, with a guaranteed fee of ${money(purse(o,w))} instead of ${money(oldFee)}.`}
  else detail='The booked clean loss is unchanged.';
 }else if(topic==='slot'){
  if(c){o.slot=D.SLOT_ORDER[D.SLOT_ORDER.indexOf(o.slot)+1];if(c===.5)o.bump=+((o.bump||1)*.9).toFixed(4);detail=`Moved to ${D.SLOTS[o.slot].name}; appearance fee ${money(purse(o,w))} instead of ${money(oldFee)}.`}
  else detail='The original card position stands.';
 }
 t.step='done';t.verdict=verdict;t.detail=detail;t.before=oldFee;
 t.log.push({who:p.voice,text:verdict==='agreed'?`All right. ${detail} We have a deal if you want it.`:
  verdict==='counter'?`I can't give you everything. Here's my counteroffer: ${detail} Take it or keep the original offer.`:
  `No. ${detail} I have to look after my own show.`});
 if(verdict==='refused'&&p.trust<35){p.trust=clamp(p.trust-1)}
 save();return {talk:t,offer:o};
}
function book(oid,wid){
 const o=S.offers.find(x=>x.id===oid),w=W(wid);
 if(!o||!w)return 'Choose a wrestler.';if(!opponentReady(S,o.rid,o.eventAbs))return 'The opponent is unavailable.';if(!availableAt(w,o.eventAbs))return `${w.name} isn’t available on the offered date.`;if(o.expiresAbs<abs())return 'That offer has expired.';
 if(o.wid&&o.wid!==wid)return 'This offer is for a specific wrestler.';const conflict=bookingConflict(wid,o.rid,o.eventAbs);if(conflict)return conflict;if(D.divisionOf(w)!==D.divisionOf(o.rid))return `This is a ${D.DIVISIONS[D.divisionOf(o.rid)].name.toLowerCase()} match.`;if(o.talk&&o.talk.wid!==wid)return 'These terms were negotiated for a different wrestler.';
 if(o.title&&!root.OfficeTerritory.titleValid(S,S.territory,o,wid))return 'The championship booking is no longer valid. The booker must issue a new offer.';
 const fd=feud(wid,o.rid);
 if(o.talk?.step==='done')S.business.negotiated+=purse(o,w)-(o.talk.original?.fee||purse(o,w));
 const contract={id:uid('c'),pid:o.pid,rid:o.rid,wid,slot:o.slot,minutes:D.SLOTS[o.slot].mins+(o.tag==='Blow-off'?5:0),finish:o.finish,purse:purse(o,w),tag:o.tag,feudHeat:fd&&!fd.closed?fd.heat:0,blowoff:o.tag==='Blow-off',eventAbs:o.eventAbs,...(o.title?{title:{...o.title}}:{})};if(o.eventAbs===abs())S.card.push(contract);else S.futureBookings.push(contract);
 S.offers=S.offers.filter(x=>x.id!==oid);
 if(o.pid==='union')S.goals.union=true;
 save();return null;
}
function unbook(cid){const c=[...S.card,...S.futureBookings].find(x=>x.id===cid);if(!c)return;const p=P(c.pid);p.trust=clamp(p.trust-6);S.card=S.card.filter(x=>x.id!==cid);S.futureBookings=S.futureBookings.filter(x=>x.id!==cid);
 msg({from:p.voice+', '+p.name,subject:'Pulled from the card',kind:'info',body:[`“You’ve left me with a hole on the card. I’ll remember it.”`,`${p.name} trust −6.`]});save()}

/* ---------- results ---------- */
// Shared physical cost of working a bout, with side-specific finishing stamina.
 function matchFatigue(worker,fin,side='w'){
  const stamina=fin.evidence?.stamina?.[side]??(side==='w'?fin.stamina:null);
  const minutes=Number.isFinite(fin.minutes)?fin.minutes:0;
  return Math.max(0,Math.round(minutes*1.15+(fin.plan==='spots'?6:fin.plan==='brawl'?4:fin.plan==='safe'?-3:0)+(Number.isFinite(stamina)&&stamina<25?5:0)+(worker.niggle>0?10:0)));
 }
 function settleOpponentCondition(f,fin,c){
  if(!f||!S.worldV4||W(f.id))return null;
  const fatigue=clamp((f.fatigue||0)+matchFatigue(f,fin,'f')),patch={fatigue,matches:(f.matches||0)+1,wins:(f.wins||0)+(root.OfficeOutcome.interpret(c,fin).winner==='f'?1:0),starSum:(f.starSum||0)+(fin.stars||0),best:Math.max(f.best||0,fin.stars||0)};
  // The current engine records opponent hurt as a boolean, not a duration.
  // A witnessed injury merits one week of rest; repeated injuries use the
  // existing wear mechanism. Never invent an anatomical location.
  const evidence=fin.evidence?.injured?.f;
  if(fin.foeHurt===true||evidence===true||typeof evidence==='string'&&evidence.length){
   const part=fin.foeInjuryPart||(typeof evidence==='string'?evidence:'body'),wear={...(f.wear||{})};
   const full=1+Math.min(2,wear[part]||0);wear[part]=(wear[part]||0)+1;
   Object.assign(patch,{injury:Math.max(f.injury||0,full),injurySince:abs(),wear,niggle:0,nigglePart:null,relapse:null});
  }
  return updatePersonnel(S,f.id,patch);
 }
 function applyResult(c,fin){
 if(resultRecorded(c))return [];
 {const rw=S.roster.find(x=>x.id===c.wid);if(rw&&fin?.rehearsed)useRehearsal(rw);}
 const w=W(c.wid),p=P(c.pid),f=F(c.rid),FN=D.FINISHES[c.finish],out=[];const add=(text,tone=0)=>out.push({text,tone});
 const double=fin.outcome==='double',nc=fin.outcome==='nc',won=double||(!nc&&FN.win);
 // money
 let pay=double?0:Math.round(c.purse*fin.adj.purseMul);
 if(!double&&!nc&&fin.stars>=4){const b=r10(c.purse*.15);pay+=b;add(`${p.name} paid a ${money(b)} bonus for a four-star match.`,1)}
 S.cash+=pay;add(double?`${p.name} refused to pay the purse.`:`Purse: ${money(pay)}${nc?' (half, no contest)':''}.`,double?-1:1);
 // reputation
 const rep=Math.round((fin.stars-1.75)*1.1*(.6+p.reach/100))+(double?4:0)+fin.adj.rep;
 S.rep=clamp(S.rep+rep);if(rep)add(`Reputation ${rep>0?'+':''}${rep}.`,Math.sign(rep));
 // heat
 let dh=(double?16:FN.heat)+(fin.crowd-55)/8+(fin.stars-2.5)*2+fin.adj.heat;dh=nc?0:Math.round(dh<0?dh*(.4+w.heat/100):dh*(1.25-w.heat/100));
 w.heat=clamp(w.heat+dh);if(dh)add(`${w.short}’s heat ${dh>0?'+':''}${dh}${!FN.win&&!double&&c.finish==='lose_clean'?' (a clean loss costs)':''}.`,Math.sign(dh));
 // booker trust
 let dt=0;
 if(double){dt=-45;p.blacklist=6;for(const o of S.promoters)if(o!==p&&o.personality!=='showman'){o.trust=clamp(o.trust-8)}
  add(`${p.name} trust −45. They won’t book you for six weeks. Word spreads: other promoters −8.`,-1)}
 else{
  dt=Math.round((fin.stars-2.5)*3)+FN.trust-fin.botches*2+fin.adj.trust+(fin.script!==null&&fin.script>=.75?2:0)+(c.tag==='Favour'?6:0);
  if(fin.timeDefied){if(fin.stars>=4)add(`${p.voice} forgave the overrun. Four stars buys a lot.`,0);else{dt-=8;add(`${p.voice} hasn’t forgiven the overrun.`,-1)}}
 }
 p.trust=clamp(p.trust+(double?0:dt)+(double?-45:0));if(!double&&dt)add(`${p.name} trust ${dt>0?'+':''}${dt}.`,Math.sign(dt));
 p.matches++;p.best=Math.max(p.best,fin.stars);
 // morale and loyalty
 let dm=(won?4:c.finish==='lose_protected'?(w.ego>=70?-2:-1):(w.ego>=70?-6:-3))+(fin.stars>=3.5?3:0)+(fin.resent?-5:0)+fin.adj.morale+(double?8:0);
 w.morale=clamp(w.morale+dm);if(fin.resent)add(`${w.short} resented being kept to the match layout.`,-1);
 if(double){w.loyal=clamp(w.loyal+10);add(`${w.short} will never forget you backed them.`,1)}
 if(fin.refused)add(`${w.short} refused to break the finish. Pros don’t.`,0);
 // body
 const tired=matchFatigue(w,fin);
 w.fatigue=clamp(w.fatigue+tired);
 const opponent=settleOpponentCondition(f,fin,c);
 if(opponent&&(fin.foeHurt===true||fin.evidence?.injured?.f)){
  const part=fin.foeInjuryPart||(typeof fin.evidence?.injured?.f==='string'?fin.evidence.injured.f:null);
  add(`${f.short} was injured${part?' ('+part+')':''}: unavailable for ${opponent.injury} week${opponent.injury===1?'':'s'}.`,0);
 }
 if(fin.injury){
  const part=fin.injuryPart||'body',base=fin.injury+(fin.workingHurt?1:0);
  w.wear??={};const prior=w.wear[part]||0;w.wear[part]=prior+1;
  // A repeat injury to the same body part lasts longer, up to two extra weeks.
  const full=base+Math.min(2,prior),quick=Math.max(1,full-1);
  w.injury=Math.max(w.injury||0,full);w.injurySince=abs();w.niggle=0;w.nigglePart=null;w.relapse=null;
  add(`${w.short} is injured (${part}): out ${full} week${full>1?'s':''}, pending your decision.`,-1);
  msg({from:w.name,subject:`${w.short}’s ${part}`,kind:'decision',dtype:'injury',args:[w.id],part,full,quick,
   body:[`${w.name} has a ${part} injury. Full rest takes ${full} week${full>1?'s':''}. Get them back early and the injury may flare again.`],
   options:[
    {id:'rest',label:'Full rest',hint:`Out ${full} week${full>1?'s':''}. No setback risk.`},
    {id:'quick',label:'Quick return',hint:`Back in ${quick} week${quick>1?'s':''}, but a ${Math.round(INJURY_SETBACK*100)}% chance of a setback on return.`},
    {id:'work',label:'Work through it',hint:`Available now. Matches tire them more for about ${full} week${full>1?'s':''}, and the knock may flare (${Math.round(INJURY_FLARE*100)}% a match).`}]});
 }else if(w.niggle>0&&rand()<INJURY_FLARE){
  const part=w.nigglePart||'body';w.wear??={};w.wear[part]=(w.wear[part]||0)+1;
  w.injury=2;w.injurySince=abs();w.niggle=0;w.nigglePart=null;
  add(`${w.short}’s ${part} flares up from working hurt. Out 2 weeks.`,-1);
 }
 if(fin.preparation?.note){add(fin.preparation.note,1);}
 if(w.prep){for(const key in w.prep)w.prep[key]=Math.max(0,w.prep[key]-2);}
 w.flags={};
 w.matches++;if(won)w.wins++;w.starSum+=fin.stars;w.best=Math.max(w.best,fin.stars);
 // rivalry
 const k=feudKey(w.id,f.id);const fd=S.feuds[k]||(S.feuds[k]={wid:w.id,rid:f.id,heat:0,matches:0,closed:false,since:abs()});
 if(c.blowoff){fd.closed=true;fd.matches++;const bonus=won?5:3;S.rep=clamp(S.rep+bonus);add(`The ${w.short}–${f.short} feud is over. A proper ending: reputation +${bonus}.`,1)}
 else{const fh=Math.round(5+fin.stars*4+(fin.crowd-50)/6);fd.heat=clamp(fd.heat+fh);fd.matches++;fd.last=abs();
  if(fd.heat>=70&&fd.matches>=2)add(`The ${w.short}–${f.short} rivalry is red hot. Expect a blow-off offer.`,1);
  else if(fd.heat>=40)add(`A rivalry is building with ${f.short} (heat ${fd.heat}). Rematch offers likely.`,1);
  else add(`Rivalry with ${f.short}: heat ${fd.heat}. Another good match and the promoters will want a rematch.`,0);}
 if(fin.stars>=4)S.goals.four=true;
 if(c.id){S.resultIds??=[];S.resultIds.push(c.id);if(S.resultIds.length>2048)S.resultIds=S.resultIds.slice(-2048);}
 // Keep a compact season ratings ledger when detailed commentary rolls off after 40 matches.
 S.seasonResults??=[];
 if(!S.seasonResults.some(x=>x.cid&&x.cid===c.id)){
  S.seasonResults.push({cid:c.id,season:S.season,week:S.week,wid:w.id,name:w.name,foe:f.name,stars:fin.stars});
  S.seasonResults=S.seasonResults.slice(-120);
  if(c.programme)S.goals.programmeChapters=(S.goals.programmeChapters||0)+1;
 }
 const result=root.OfficeOutcome.interpret(c,fin);
 S.history.unshift({cid:c.id,week:S.week,season:S.season,wid:w.id,name:w.name,rid:f.id,foe:f.name,pid:p.id,promoter:p.name,slot:c.slot,finish:c.finish,bookedFinish:result.bookedFinish,contractHonoured:result.contractHonoured,outcome:result.actualOutcome,title:c.title?{...c.title}:null,stip:c.stip||null,programme:c.programme?{...c.programme}:null,stars:fin.stars,crowd:fin.crowd,purse:pay,tag:c.tag,notes:out.map(o=>o.text),log:(fin.log||[]).slice(-90)});
 S.history=S.history.slice(0,40);
 S.card=S.card.filter(x=>x.id!==c.id);
 save();return out;
}

/* ---------- dilemmas ---------- */
const INJURY_SETBACK=.3,INJURY_FLARE=.15;
const DILEMMAS={
 raise:{when:w=>w.heat>=60&&w.ego>=65&&abs()-w.lastRaise>=6,
  make:w=>({from:w.name,subject:'About my money',body:[`“I’m the reason people buy tickets to these shows. I want that reflected in my pay. Another £50 a week.”`],
   options:[{id:'yes',label:'Give the raise',hint:'Wage +£50 a week. Morale and loyalty up.'},{id:'no',label:'Not now',hint:'Morale and loyalty drop. Rivals may smell an opportunity.'}]}),
  resolve:(m,w,o)=>{w.lastRaise=abs();if(o==='yes'){w.wage+=50;w.morale=clamp(w.morale+10);w.loyal=clamp(w.loyal+8);return `${w.short} shakes your hand.`}w.morale=clamp(w.morale-10);w.loyal=clamp(w.loyal-8);return `${w.short} walks out without a word.`}},
 poach:{when:w=>w.loyal<45&&w.heat>=55&&root.OfficeTerritory.canPoach(w),
  make:w=>({from:'A friend at Grand Union',subject:`They’re talking to ${w.short}`,body:[`“Thought you should hear it from me. Our people have been on the phone to ${w.name}. Serious money.”`],
   options:[{id:'bonus',label:'Pay a loyalty bonus (£400)',hint:'Loyalty +20. Costs £400 now.'},{id:'talk',label:'Talk them round',hint:'A coin flip. If it fails, they leave.'},{id:'sell',label:`Let them go, take the fee`,hint:`They leave today. You receive ${money(Math.round(w.fee*.6))}.`}]}),
  resolve:(m,w,o)=>{if(o==='bonus'){S.cash-=400;w.loyal=clamp(w.loyal+20);w.morale=clamp(w.morale+5);return `${w.short} stays. For now.`}
   if(o==='talk'){if(rand()<.35+w.morale/250){w.loyal=clamp(w.loyal+8);return `It works. ${w.short} turns them down.`}
    leave(w,0);const team=root.OfficeTerritory.poach(w);
    return team?`${w.short} has signed with ${team}.`:`${w.short} walks out and is now a free agent.`;}
   // Only sell if the buyer can still complete the deal; the fee is paid once the signing goes through.
   if(!root.OfficeTerritory.canPoach(w))return `North Circuit can no longer afford ${w.short}. The offer is withdrawn and ${w.short} stays.`;
   const fee=Math.round(w.fee*.6);leave(w,0);const team=root.OfficeTerritory.poach(w);
   if(!team)return `${w.short} has left, but the deal collapsed. No fee was paid and ${w.short} is now a free agent.`;
   S.cash+=fee;return `${w.short} joined ${team}. ${money(fee)} is in the account.`;}},
 dive:{when:w=>(w.style==='Spectacle'||w.ego>=70)&&!w.injury&&!w.flags.dive,
  make:w=>({from:w.name,subject:'The balcony',body:[`“Next match, I want to dive off the balcony. Nobody on this circuit has done it. People will be talking about it for years.”`],
   options:[{id:'yes',label:'Do it',hint:'A guaranteed huge moment in the next match. If it goes wrong, it goes very wrong.'},{id:'no',label:'Absolutely not',hint:'Morale −6.'}]}),
  resolve:(m,w,o)=>{if(o==='yes'){w.flags.dive=true;return `${w.short} grins. The balcony it is.`}w.morale=clamp(w.morale-6);return `${w.short} sulks off.`}},
 hurt:{when:w=>w.fatigue>=55&&!w.injury,
  make:w=>({from:w.name,subject:'My back’s gone',body:[`“I can barely get out of the car. I’ll work if you need me, but I’m not right.”`],
   options:[{id:'rest',label:'Rest this week',hint:'Training set to rest, fatigue −15 now. Any booking this week is pulled (booker trust −6).'},{id:'work',label:'You’re working',hint:'Morale +2. Their next match carries a much higher injury risk.'}]}),
  resolve:(m,w,o)=>{if(o==='rest'){w.training='rest';w.fatigue=clamp(w.fatigue-15);const c=S.card.find(x=>x.wid===w.id);if(c){P(c.pid).trust=clamp(P(c.pid).trust-6);S.card=S.card.filter(x=>x!==c)}return `${w.short} is resting this week.`}
   w.flags.pushThrough=true;w.morale=clamp(w.morale+2);return `${w.short} nods. “Your call.”`}},
 injury:{resolve:(m,w,o)=>{
   if(!w.injury)return `${w.short} has already recovered. Nothing to decide.`;
   if(o==='rest')return `${w.short} takes the full layoff.`;
   if(o==='quick'){w.injury=Math.min(w.injury,m.quick);w.relapse={part:m.part,chance:INJURY_SETBACK};return `${w.short} is back in ${w.injury} week${w.injury>1?'s':''}. The doctor says it could go again.`}
   w.injury=0;w.niggle=Math.max(w.niggle||0,m.full);w.nigglePart=m.part;
   return `${w.short} wrestles through the ${m.part} knock. Expect a harder time for about ${m.full} week${m.full>1?'s':''}.`;}},
 unhappy:{when:w=>w.morale<25,
  make:w=>({from:w.name,subject:'I’m done',body:[`“I don’t enjoy this any more. I don’t enjoy the matches, I don’t enjoy the drives, and I don’t enjoy you telling me what to do.”`],
   options:[{id:'off',label:'Give them the week off',hint:'Training set to rest. Morale +12.'},{id:'pay',label:'Pay a £250 bonus',hint:'Morale +18. Costs £250.'},{id:'grow',label:'Tell them to grow up',hint:'Morale −5. They may walk out for good.'}]}),
  resolve:(m,w,o)=>{if(o==='off'){w.training='rest';w.morale=clamp(w.morale+12);return `${w.short} says thanks, quietly.`}if(o==='pay'){S.cash-=250;w.morale=clamp(w.morale+18);return `${w.short} takes the money. Something thaws.`}
   w.morale=clamp(w.morale-5);if(rand()<.4+(w.ego-50)/150){leave(w,0);return `${w.short} has walked out. The contract is torn up.`}return `${w.short} stays, barely speaking to you.`}},
 clash:{pair:true,when:(a,b)=>a.ego>=60&&b.ego>=60,
  make:(a,b)=>({from:'Your road agent',subject:`${a.short} and ${b.short} had words`,body:[`“They had to be pulled apart in the car park. Somebody needs to settle this, and both of them think it should be you.”`],
   options:[{id:'a',label:`Back ${a.short}`,hint:`${a.short} morale +6, ${b.short} morale −8.`},{id:'b',label:`Back ${b.short}`,hint:`${b.short} morale +6, ${a.short} morale −8.`},{id:'fine',label:'Fine them both £50',hint:'Both lose morale. £100 into the account.'}]}),
  resolve:(m,a,o,b)=>{if(o==='a'){a.morale=clamp(a.morale+6);b.morale=clamp(b.morale-8)}else if(o==='b'){b.morale=clamp(b.morale+6);a.morale=clamp(a.morale-8)}else{a.morale=clamp(a.morale-4);b.morale=clamp(b.morale-4);S.cash+=100}return 'The locker room goes quiet.'}},
 favour:{promoter:true,when:p=>eligible(p)&&p.trust>=40,
  make:(p,f)=>({from:`${p.voice}, ${p.name}`,subject:'I need a favour',body:[`“One of my wrestlers needs a win over someone credible this week. Lend me one of yours to lose clean in the opener. I’ll pay well and I won’t forget it.”`],
   options:[{id:'yes',label:'Send someone',hint:'Your lowest-heat fit wrestler loses clean in the opener. Good money, trust +6 after.'},{id:'no',label:'Not this week',hint:`${p.name} trust −4.`}]}),
  resolve:(m,p,o)=>{if(o==='no'){p.trust=clamp(p.trust-4);return `${p.voice} hangs up.`}
   const w=S.roster.filter(available).sort((a,b)=>a.heat-b.heat)[0];if(!w){p.trust=clamp(p.trust-2);return 'Nobody was free. They understood, mostly.'}
   const div=D.divisionOf(w),target=root.OfficeTerritory?.opponents(p.id,'opener',div)
    .find(f=>!W(f.id)&&f.id!==w.id&&!bookingConflict(w.id,f.id,abs()));
   if(!target){p.trust=clamp(p.trust-2);return 'The promoter could not secure an eligible opponent for the favour. No match was booked.';}
   const rid=target.id,o2={id:'fav',pid:p.id,rid,slot:'opener',finish:'lose_clean',boost:1.15};
   S.card.push({id:uid('c'),pid:p.id,rid,wid:w.id,slot:'opener',minutes:8,finish:'lose_clean',purse:purse(o2,w),tag:'Favour',feudHeat:0,blowoff:false,eventAbs:abs()});
   return `${w.short} is on the card: opener, losing clean to ${F(rid).name}.`}}
};
function leave(w,fee){if(!w||!W(w.id))return;w=W(w.id);reconcileOwnership(w.id,{outgoing:true,reason:'The wrestler left your stable'});S.cash+=fee;S.roster=S.roster.filter(x=>x.id!==w.id);returnToMarket(w);}
function makeDilemmas(){
 let made=0;const recent=S.recentTypes;
 const ok=t=>!recent[t]||abs()-recent[t]>=4;
 const roster=S.roster.slice().sort(()=>rand()-.5);
 const tryMake=(type,args,m)=>{msg({...m,kind:'decision',dtype:type,args});recent[type]=abs();made++};
 for(const w of roster){if(made>=2)break;
  // Approaches for your wrestlers now come from the rival managers themselves (rival-managers.js).
  // The old North Circuit scene is no longer raised; its resolver stays so a pending one in a save can be answered.
  for(const type of ['unhappy','hurt','raise','dive']){const d=DILEMMAS[type];if(ok(type)&&d.when(w)&&rand()<({unhappy:.8,hurt:.65,raise:.45,dive:.3}[type])){tryMake(type,[w.id],d.make(w));break}}
 }
 if(made<2&&ok('clash')&&roster.length>=2&&rand()<.25){const [a,b]=roster;if(DILEMMAS.clash.when(a,b))tryMake('clash',[a.id,b.id],DILEMMAS.clash.make(a,b))}
 if(made<2&&ok('favour')&&S.roster.length&&rand()<.3){const p=one(S.promoters.filter(x=>DILEMMAS.favour.when(x)));if(p)tryMake('favour',[p.id],DILEMMAS.favour.make(p))}
}
function answer(mid,opt){
 const m=S.inbox.find(x=>x.id===mid);if(!m||m.answer)return null;
 if(m.dtype==='poach'&&opt==='bonus'&&S.cash<400)return 'Not enough cash for the £400 bonus. Choose another response.';
 if(m.dtype==='unhappy'&&opt==='pay'&&S.cash<250)return 'Not enough cash for a £250 bonus. Choose another response.';
 const d=DILEMMAS[m.dtype];let text='';
 if(m.dtype==='favour'){const p=P(m.args[0]);text=d.resolve(m,p,opt)}
 else if(m.dtype==='clash'){const a=W(m.args[0]),b=W(m.args[1]);text=a&&b?d.resolve(m,a,opt,b):'They’ve both moved on.'}
 else{const w=W(m.args[0]);text=w?d.resolve(m,w,opt):'That situation has resolved itself.'}
 m.answer=opt;m.outcome=text;m.read=true;save();return text;
}

/* Twelve-week regional circuit follows the initial four-week sponsor trial.
   Three checkpoints are evaluated against actual show results, not button presses. */
const CIRCUIT_TARGETS={
 8:{title:'Regional Showcase',reward:250,required:2,quality:3,feature:false},
 12:{title:'Television Audition',reward:400,required:4,quality:3.5,feature:true},
 16:{title:'Season Finale',reward:650,required:6,quality:4,feature:true}
};
function circuitStatus(week=8){const t=CIRCUIT_TARGETS[week];if(!t)return null;
 const hist=S.history.filter(h=>h.season===1&&h.week>=5&&h.week<=week),qualityMet=hist.some(h=>h.stars>=t.quality),feature=hist.some(h=>D.SLOTS[h.slot]?.rank>=D.SLOTS.feature.rank);
 return {...t,week,played:hist.length,qualityMet,hasFeature:feature,met:hist.length>=t.required&&qualityMet&&(!t.feature||feature)};
}
function reviewCircuit(){if(S.season!==1||!CIRCUIT_TARGETS[S.week]||S.circuitReviews.some(r=>r.week===S.week))return;
 const r=circuitStatus(S.week);S.circuitReviews.push({...r});if(r.met)S.cash+=r.reward;
 msg({from:'Your regional backer',subject:`${r.title} review — ${r.met?'bonus earned':'target missed'}`,kind:'info',body:[
  `Required: ${r.required} matches from week 5 onward, at least one ${r.quality}-star performance${r.feature?', plus a featured/main-event booking':''}.`,
  `Delivered: ${r.played} matches. Match quality: ${r.qualityMet?'YES':'NO'}. Featured appearance: ${r.hasFeature?'YES':'NO'}.`,
  r.met?`${money(r.reward)} earned. The territory has noticed ${S.identity.stable}.`:'No milestone bonus. The next show is still an opportunity to recover.'
 ]});
}
/* ---------- the week turns ---------- */
function snapshot(w){
 w.trend=[...(w.trend||[]).filter(x=>x.a!==abs()),{a:abs(),ring:w.ring,mic:w.mic,psych:w.psych,safe:w.safe,heat:w.heat,morale:w.morale}].slice(-40);
}
function endWeek(){
 const trainingBefore=S.business.training;
 const lines=[];const pay=wages(),oh=overhead(),cw=coachWage();
 const review={a:abs(),coachCost:cw,entries:[]};S.cash-=pay+oh+cw;lines.push(`Wages ${money(pay)}, overheads ${money(oh)}${cw?`, coach ${money(cw)}`:''}.`);if(S.rep>30){S.rep--;}
 for(const w of S.roster){
  const before={ring:w.ring,mic:w.mic,psych:w.psych,safe:w.safe,fatigue:w.fatigue,heat:w.heat,injury:w.injury||0};
  const plan=trainingWeekPlan(w);
  const focus=w.training,intensityName=w.intensity,session=w.session||null,weeklyCost=plan.cost,lineStart=lines.length;
  const worked=plan.worked,isInjured=!!w.injury;
  if(plan.kind==='rest'){
   w.fatigue=plan.fatigue;if(!worked)w.morale=clamp(w.morale+2);
  }else if(plan.kind==='promo'){
   S.cash-=plan.cost;S.business.training+=plan.cost;const g=plan.heat;w.heat=clamp(w.heat+g);w.fatigue=plan.fatigue;
   const hot=Object.values(S.feuds).filter(f=>f.wid===w.id&&!f.closed).sort((a,b)=>b.heat-a.heat)[0];if(hot)hot.heat=clamp(hot.heat+6);
   lines.push(`${w.short} recorded a promo: −£40, heat +${g}${hot?', rivalry +6':''}.`);
  }else if(plan.kind==='skill'){
   const {stat,camp,risk,gain:gained,cost:spent}=plan;
   const intensity=INTENSITY[w.intensity||'light']||INTENSITY.light;
   S.cash-=spent;S.business.training+=spent;w.progress??={};w.progress[stat]=plan.progressBank;
   w[stat]=plan.skillAfter;w.fatigue=plan.fatigue;
   w.prep??={};w.prep[stat]=Math.min(4,(w.prep[stat]||0)+1+(camp?1:0));
   if(risk>0&&rand()<risk){w.injury=Math.max(w.injury||0,ri(1,3));w.injurySince=abs();lines.push(`${w.short} strained something in training. Out ${w.injury} week(s).`)}
   if(spent||gained)lines.push(`${w.short}: ${camp?'residential camp':intensity.name.toLowerCase()} in ${D.TRAINING[focus].name.toLowerCase()}, ${money(spent)}; ${gained?`${stat} +${gained}`:'progress banked'}, fatigue ${w.fatigue}.`);if(w.program)w.program.gains+=gained;
  }
  runSession(w,worked,lines);
  if(w.program&&!isInjured){w.program.left--;if(w.program.left<=0){const old=w.program;w.prepHistory??=[];w.prepHistory.unshift({week:abs(),focus:old.focus,type:old.type,gains:old.gains});w.prepHistory=w.prepHistory.slice(0,8);w.program=null;w.intensity='light';w.training='rest';lines.push(`${w.short} completes ${old.total}-week development (${old.gains} skill points gained). Rest scheduled next week.`);}}
  if(isInjured&&w.injury && (w.injurySince??abs()-1)<abs()){w.injury--;if(!w.injury)lines.push(`${w.short} is fit again.`)}
  if(w.niggle>0){w.niggle--;if(!w.niggle){w.nigglePart=null;lines.push(`${w.short}’s knock has settled.`)}}
  if(w.relapse&&!w.injury){const r=w.relapse;w.relapse=null;w.wear??={};
   if(rand()<INJURY_SETBACK){w.injury=2;w.injurySince=abs();w.wear[r.part]=(w.wear[r.part]||0)+1;lines.push(`${w.short} has set back the ${r.part} injury on the return. Out 2 more weeks.`)}
   else lines.push(`${w.short} is cleared to wrestle again.`)}
  w.morale=clamp(w.morale+(w.morale<60?2:w.morale>75?-1:0)+(w.fatigue>70?-2:0));
  const delta={};for(const k of ['ring','mic','psych','safe','fatigue','heat'])if(w[k]!==before[k])delta[k]=w[k]-before[k];
  review.entries.push({id:w.id,name:w.name,focus,intensity:intensityName,session,cost:weeklyCost,worked,delta,
   injuryBefore:before.injury,injuryAfter:w.injury||0,notes:lines.slice(lineStart)});
 }
 resolvePromises();
 for(const fd of Object.values(S.feuds)){if(!fd.closed&&fd.last!==abs())fd.heat=clamp(fd.heat-7)}
 for(const p of S.promoters){if(p.blacklist>0)p.blacklist--;p.trust=clamp(p.trust+(p.trust<45?1:p.trust>65?-1:0))}
 if(S.season===1&&S.week===4&&!S.monthReview){
  const st=monthStatus();S.monthReview={...st,season:1,week:4};
  const grant=st.passed?450:0;S.cash+=grant;S.monthReview.best=Math.max(0,...S.history.filter(h=>h.season===1&&h.week<=4).map(h=>h.stars));S.monthReview.business={...S.business};
  msg({from:'Your backer',subject:st.passed?'The first month — investment approved':'The first month — no investment',kind:'info',body:[
   `Three-star match: ${st.okMatch?'YES':'NO'}. Cash of at least £750: ${st.cash?'YES':'NO'}. Reputation 30: ${st.rep?'YES':'NO'}. One wrestler develops by two skill points: ${st.developed?'YES':'NO'}.`,
   st.passed?'You made the grade. £450 has been transferred to the stable.':`You didn't deliver the combination I asked for. No bonus this month. The campaign continues.`,
   `Best match: ${S.monthReview.best} stars. Coaching/promo spent: ${money(S.business.training)}. Net negotiated contract improvements: ${money(S.business.negotiated)}. Wrestler promises kept: ${S.business.kept}, broken: ${S.business.broken}.`,
   `Bank after review: ${money(S.cash)}.`]});
 }
 reviewCircuit();
 // v3.8 records for the graphs: kept short so saves stay small.
 const trained=S.business.training-trainingBefore;
 review.trainingCost=trained;
 S.trainingReviews=[...(S.trainingReviews||[]),review].slice(-12);
 S.books=[...(S.books||[]),{a:abs(),cash:S.cash,wages:pay,other:oh+cw+trained}].slice(-48);
 for(const w of S.roster)snapshot(w);
 S.focus=2;
 root.OfficeWorldV4?.developPersonnel(S,abs());
 root.OfficeWorldV4?.recoverPersonnel(S,abs());
 S.week++;
 if(S.week>16){seasonEnd();}
 // Pre-signed bookings move onto the live card when their date arrives.
 const due=S.futureBookings.filter(c=>c.eventAbs===abs());S.futureBookings=S.futureBookings.filter(c=>c.eventAbs>abs());
 for(const c of due){const w=W(c.wid);if(!opponentReady(S,c.rid)){msg({from:'Your road agent',subject:'Opponent unavailable',kind:'info',body:[`${F(c.rid)?.name||'The opponent'} cannot work the scheduled match. The booking has been cancelled without a trust penalty.`]});continue;}if(!w||w.injury||inCamp(w)){const p=P(c.pid);if(p)p.trust=clamp(p.trust-4);msg({from:'Your road agent',subject:'Booking lost to unavailability',kind:'info',body:[`${w?.name||'A wrestler'} cannot fulfil the ${P(c.pid)?.name||'promoter'} booking this week. Trust −4. Plan around injuries and training commitments.`]});}else S.card.push(c)}
 if(S.cash<-500){S.over={reason:'bankrupt'};save();return}
 msg({from:'The accountant',subject:`Week ${S.week===1?16:S.week-1} accounts`,kind:'info',body:[...lines,`Balance: ${money(S.cash)}.`]});
 makeDilemmas();makeOffers();save();
}
function seasonEnd(){
 const g=goalList(),done=g.filter(x=>x.done).length,grant=S.rep*8+done*200;
 S.cash+=grant;
 msg({from:'The office',subject:`Season ${S.season} review`,kind:'info',body:[`${done} of 4 objectives met.`,...g.map(x=>(x.done?'✓ ':'✗ ')+x.text),`Sponsorship and bonuses: ${money(grant)}.`]});
 const aged=ageRoster();
 root.OfficeWorldV4?.agePersonnel(S,S.season);
 root.OfficeTerritory?.settleRetiredTitles(S);
 S.season++;S.week=1;S.goals={};
 root.OfficeAcademy?.intake(S,S.season);
 msg({from:'The office',subject:`Season ${S.season} objectives`,kind:'info',body:[`This season, ${S.identity.stable} is expected to:`,...goalList().map(x=>'• '+x.text)]});
 return aged;
}
// Season-end ageing. Rumours come one season before a retirement, so the player gets warning.
// Player retirement uses the career RNG; the wider circuit uses independent seeded decisions.
function retireChance(age){return age>=38?Math.min(.6,(age-37)*.12):0}
function ageWorker(w){
 w.age=(w.age??30)+1;
 w.ceiling??=clamp(Math.max(w.ring,w.mic,w.psych)+12,0,95);
 if(w.age<=25){
  const gain=Math.max(0,Math.ceil((w.ceiling-w.ring)*.3));
  w.ring=clamp(w.ring+gain);
  w.mic=clamp(Math.min(w.mic+1,Math.max(w.mic,w.ceiling)));
  w.psych=clamp(Math.min(w.psych+1,Math.max(w.psych,w.ceiling)));
 }
 if(w.age>=34)w.psych=clamp(w.psych+1);
 if(w.age>=35)w.ring=clamp(w.ring-(w.age>=37?2:1));
 return w;
}
function ageRoster(){
 const retired=[];
 // 1. Wrestlers rumoured last season retire now, 70% of the time. Otherwise they stay another year.
 for(const w of [...S.roster]){
  if(!w.retireWarned)continue;
  w.retireWarned=false;
  if(rand()<.7){retired.push(w);continue}
  msg({from:'Ringfax',subject:`${w.short} is staying on`,kind:'info',body:[`${w.name} has said the retirement talk was premature. They will keep wrestling for now.`]});
 }
 for(const w of retired){
  reconcileOwnership(w.id,{outgoing:true,reason:`${w.name} retired`});
  S.roster=S.roster.filter(x=>x.id!==w.id);
  root.OfficeWorldV4?.markRetired(S,w,abs());
  msg({from:'The office',subject:`${w.name} has retired`,kind:'info',body:[`${w.name} (${w.age}) has left the roster. Any bookings for them were cancelled.`]});
 }
 // 2. Everyone left gets a year older: rookies grow towards a hidden ceiling, mid-30s trade ring for psychology, veterans decline.
 for(const w of S.roster)ageWorker(w);
 // 3. Veterans over 38 may be rumoured to retire next season. The rumour is the advance signal.
 for(const w of S.roster){
  const p=retireChance(w.age);
  if(!p||w.retireWarned||rand()>=p)continue;
  w.retireWarned=true;
  msg({from:'Ringfax',subject:`Retirement whispers: ${w.short}`,kind:'info',body:[`Sources say ${w.name} is considering hanging up the boots. Expect an announcement at the end of next season.`]});
 }
 return {retired:retired.map(w=>w.id)};
}
// Read-only office briefing: offers are alternatives, not guaranteed additive income.
function offerCandidates(o){
 if(!o||!P(o.pid)||o.expiresAbs<abs()||o.eventAbs<abs())return [];
 const dates=o.programme?.beats?.length?o.programme.beats:[{at:o.eventAbs,rid:o.rid,title:o.title}];
 return S.roster.filter(w=>(!o.wid||o.wid===w.id)&&(!o.talk?.wid||o.talk.wid===w.id)&&(!o.programme?.wid||o.programme.wid===w.id)&&
  dates.every(b=>D.divisionOf(w)===D.divisionOf(b.rid)&&availableAt(w,b.at)&&opponentReady(S,b.rid,b.at)&&!bookingConflict(w.id,b.rid,b.at)&&
   (!b.title||root.OfficeTerritory.titleValid(S,S.territory,{...b,pid:o.pid,rid:b.rid,title:b.title},w.id))));
}
function officeBrief(){
 const now=abs(),today=[],deadline=[];
 for(const o of S.offers){
  const candidates=offerCandidates(o);if(!candidates.length)continue;
  const row={id:o.id,wids:candidates.map(w=>w.id)};
  if(o.eventAbs===now||o.programme?.beats?.some(b=>b.at===now))today.push(row);
  else if(o.expiresAbs===now)deadline.push(row);
 }
 const income=S.card.filter(c=>c.eventAbs===now).reduce((n,c)=>n+c.purse,0),cost=wages()+overhead()+trainingBill();
 return {today,deadline,unbooked:[...new Set(today.flatMap(o=>o.wids))],income,cost,after:S.cash+income-cost};
}
function projected(){return S.card.reduce((t,c)=>t+c.purse,0)-wages()-overhead()-trainingBill()}

root.OfficeGame={get S(){return S},set S(x){S=hydrate(x)},msg,fresh,normaliseIdentity,suggestIdentity,IDENTITY_ARCHIVE,setIdentity,load,save,saveStatus,reportError,systemErrors,resultRecorded,hasSave,wipe,sign,signingForecast,release,setTraining,setIntensity,setSession,sessionOptions,sessionTip,trainingForecast,trainingAdvice,trainingReview,rehearsed,micLevel,MIC_STYLES,SESSION_CAP,startProgram,cancelProgram,COACHES,hireCoach,fireCoach,coachWage,checkIn,INTENSITY,trainingCost,trainingBill,monthStatus,circuitStatus,CIRCUIT_TARGETS,meeting,talkMove,makeOffers,purse,book,unbook,applyResult,answer,pending,endWeek,goalList,W,F,P,feud,leave,available,availableAt,bookingConflict,reconcileOwnership,inCamp,booked,bookedAt,wages,OVERHEAD,money,projected,overhead,abs,eligible,clamp,ageRoster,retireChance,scoutBand,scoutWatch,personalRecord,personnel,updatePersonnel,matchFatigue,trainingWeekPlan,ageWorker,opponentReady,offerCandidates,officeBrief};
})(typeof window!=='undefined'?window:globalThis);
