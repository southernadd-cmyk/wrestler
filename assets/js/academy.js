/* THE OFFICE — a finite, career-specific academy intake.
   Authored identities and illustrated portraits live in academy-register.js
   and the age atlases. Only arrived wrestlers enter the live registry. */
(function(root){'use strict';
const D=root.OfficeData,REGISTER=root.OfficeAcademyRegister;
const BASE=80,CAP=84;
function hash(value){
 let h=2166136261;
 for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
 return h>>>0;
}
function between(seed,id,key,lo,hi){return lo+hash(seed+'|'+id+'|'+key)%(hi-lo+1)}
function reset(){
 for(let i=D.ALL.length-1;i>=0;i--){
  const w=D.ALL[i];if(!w.id.startsWith('academy-'))continue;
  D.ALL.splice(i,1);D.REGISTRY.delete(w.id);D.WOMEN.delete(w.id);delete D.PROFILES[w.id];
  if(root.OfficeRoom)delete root.OfficeRoom.VOICE[w.id];
 }
}
function state(s){
 s.academy??={version:1,lastIntakeSeason:s.season,arrived:[],intakes:[]};
 s.academy.arrived??=[];s.academy.intakes??=[];
 s.academy.lastIntakeSeason??=s.season;
 return s.academy;
}
function register(w){
 if(D.REGISTRY.has(w.id))return;
 if(!REGISTER.some(person=>person.id===w.id))throw Error('Unknown academy identity '+w.id);
 D.REGISTRY.set(w.id,w);D.ALL.push(w);
 if(w.division==='women')D.WOMEN.add(w.id);
 D.PROFILES[w.id]=w.profile;
 if(root.OfficeRoom)root.OfficeRoom.VOICE[w.id]=w.roomVoice;
}
function restore(s){
 reset();if(!s)return;
 state(s);
 root.OfficeRosterV4.enableProfiles();
 for(const w of s.academy.arrived)register(w);
}
function order(s){
 const seed=s.careerSeed??s.seed;
 return REGISTER.slice().sort((a,b)=>
  hash(seed+'|academy-order|'+a.id)-hash(seed+'|academy-order|'+b.id)||a.id.localeCompare(b.id));
}
function create(s,person,season){
 const seed=s.careerSeed??s.seed,id=person.id,style=person.wrestling_style;
 const short=person.name.split(' ').at(-1);
 const tones=['Measured and methodical','Eager and quick to speak','Reserved until challenged','Blunt but sincere','Restless and ambitious'];
 const voices=['precise','eager','stoic','gruff','slippery','earnest','grand','sermon'];
 const ambition=['Earn a first regular circuit booking','Learn from a veteran without losing their own style',
  'Make a name on every promotion’s card','Earn a title opportunity through consistent work'];
 const profilePool=D.V4.newCast.filter(w=>w.style===style).map(w=>D.PROFILES[w.id]);
 const signatures=[...new Set(profilePool.flatMap(p=>p.signature))].sort((a,b)=>
  hash(seed+'|'+id+'|move|'+a)-hash(seed+'|'+id+'|move|'+b)||a.localeCompare(b)).slice(0,4);
 const preferred=[...new Set(profilePool.flatMap(p=>p.preferred))].sort((a,b)=>
  hash(seed+'|'+id+'|plan|'+a)-hash(seed+'|'+id+'|plan|'+b)||a.localeCompare(b)).slice(0,4);
 const donor=profilePool[between(seed,id,'trait',0,profilePool.length-1)];
 const base={Technical:[55,38,48,65],Brawl:[53,45,42,55],Story:[46,55,55,57],Spectacle:[54,50,39,48]}[style];
 const [ring,mic,psych,safe]=base.map((n,i)=>n+between(seed,id,['ring','mic','psych','safe'][i],-8,8));
 return {id,name:person.name,short,handle:short,tier:'Rookie',style,division:person.division,
  age:person.entry_age,ring,mic,psych,safe,ego:between(seed,id,'ego',26,80),
  pro:between(seed,id,'pro',48,92),loyal:between(seed,id,'loyal',38,85),
  heat:between(seed,id,'heat',20,36),morale:70,fatigue:0,
  fee:between(seed,id,'fee',440,720),wage:between(seed,id,'wage',105,155),
  sub:style==='Technical',finisher:short+' '+{Technical:'Lock',Brawl:'Breaker',Story:'Turn',Spectacle:'Flight'}[style],
  ambition:ambition[between(seed,id,'ambition',0,ambition.length-1)],
  voice:tones[between(seed,id,'voice',0,tones.length-1)],
  roomVoice:voices[between(seed,id,'room-voice',0,voices.length-1)],
  appearance_brief:person.face+'; '+person.gear+'.',
  bio:person.name+' enters the circuit in season '+season+'. '+person.face+'; '+person.gear+'.',
  entrySeason:season,profile:{kg:between(seed,id,'weight',person.division==='women'?58:72,person.division==='women'?94:120),
   trait:donor.trait,signature:signatures,preferred}};
}
function intake(s,season){
 const a=state(s),world=s.worldV4;
 if(!world||a.lastIntakeSeason>=season)return [];
 const active={men:0,women:0};
 for(const [id,contract] of Object.entries(world.contracts)){
  if(contract.owner==='retired')continue;
  active[D.divisionOf(id)]++;
 }
 const live=active.men+active.women;
 const available=Math.max(0,Math.min(CAP-live,
  Math.max(4,Math.min(8,4+Math.max(0,BASE-live)))));
 const used=new Set(a.arrived.map(w=>w.id)),queue=order(s).filter(w=>!used.has(w.id));
 const added={men:a.arrived.filter(w=>w.division==='men').length,
  women:a.arrived.filter(w=>w.division==='women').length};
 const arrived=[];
 for(let n=0;n<available;n++){
  const division=added.women<=added.men?'women':'men';
  const person=queue.find(w=>w.division===division)||queue[0];
  if(!person)break;
  queue.splice(queue.indexOf(person),1);
  const w=create(s,person,season);register(w);a.arrived.push(w);arrived.push(w);
  active[w.division]++;added[w.division]++;
  const week=(season-1)*16+1;
  world.contracts[w.id]={owner:'market',agencyId:null,signedWeek:week,expiresWeek:null,wage:w.wage};
  s.free.push({...w});
  world.personnel??={};world.personnel[w.id]=root.OfficeGame.personalRecord(w);
  const primary={Brawl:'dock',Spectacle:'pulse',Story:'crown',Technical:'union'}[w.style];
  for(const pid of new Set([primary,primary==='crown'?'dock':'crown'])){
   s.territory.cards[pid]??={};
   s.territory.cards[pid][w.id]={score:Math.round(18+w.ring*.24+w.psych*.12),matches:0,wins:0};
  }
 }
 a.lastIntakeSeason=season;
 a.intakes.push({season,ids:arrived.map(w=>w.id)});
 if(arrived.length){
  root.OfficeWorldV4.activate(s);
  root.OfficeGame.msg({from:'Ringfax',subject:'Season '+season+' rookie intake',kind:'info',
   body:[arrived.length+' new wrestlers have joined the circuit as free agents.',
    ...arrived.map(w=>w.name+' ('+w.age+', '+w.style+', '+(w.division==='women'?'women’s':'men’s')+' division).')]});
  world.events.unshift({week:(season-1)*16+1,text:'Academy intake: '+arrived.map(w=>w.name).join(', ')+'.'});
  world.events.length=Math.min(world.events.length,80);
 }
 return arrived;
}
// Read-only seeded profile preview for the development Lab. It does not
// register anyone, advance the calendar, or touch a career save.
function preview(seed=47){
 if(!Number.isSafeInteger(seed))throw Error('Invalid academy preview seed');
 return REGISTER.map(person=>create({careerSeed:seed},person,2));
}
root.OfficeAcademy={REGISTER,reset,restore,intake,order,preview};
})(typeof window!=='undefined'?window:globalThis);
