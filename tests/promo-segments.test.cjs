'use strict';
// Promo segments that are not a back-and-forth: solo promo, pre-taped vignette, backstage ambush, interview grilling.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script,promoBanks}=require('./_source.cjs');
const fs=require('node:fs'),path=require('node:path');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeGame:G,OfficeMatch:MX,OfficeSegments:SG}=root;
assert.ok(SG&&SG.begin&&SG.menu,'segments are installed');
const clean=/undefined|NaN|null|\{\w+\}|\[object/;
const sentence=t=>!/^[“"]?[a-z]/.test(t)&&!/[.!?]\s+[a-z]/.test(t);
let n=0;
function career(){G.fresh();const s=G.S;s.cash=99999;s.rep=60;G.sign('rex');s.inbox=[];s.offers=[];return s;}
const contract=(o={})=>({id:'seg-'+(n++),pid:'crown',rid:'silas',wid:'rex',slot:'main',minutes:15,finish:'win_clean',purse:300,feudHeat:20,eventAbs:G.abs(),...o});
// One wrestler for each voice, so every voiced line is read at least once.
const VOICES=['mara','rex','lyra','brick','juno','sol','rev','malik'];
const as=(id,o={})=>({...G.W('rex'),id,short:id[0].toUpperCase()+id.slice(1),...o});
function paths(type){
 const R=SG.ENGINES[type].rounds,out=[[]];
 const grow=(prefix,i)=>{if(i>=R.length)return [prefix];return R[i].options.flatMap(o=>o.id==='storm'?[[...prefix,o.id]]:grow([...prefix,o.id],i+1));};
 return grow([],0);
}
function play(type,picks,w,o={}){
 career();const k=contract(o.contract);
 const st=SG.begin(type,k,w,G.F(o.rid||'silas'),G.P(o.pid||'crown'),o.banks?{banks:o.banks}:{});
 for(const id of picks)assert.ok(SG.choose(st,id),type+' '+id);
 return {st,k,r:SG.result(st)};
}

// 1. The menu: the usual duel plus four segments that are not a conversation.
{
 career();const k=contract(),w=G.W('rex'),f=G.F('silas'),p=G.P('crown');
 const m=SG.menu(k,w,f,p);
 assert.deepEqual([...m.map(x=>x.id)],['duel','solo','vignette','ambush','grilling']);
 for(const x of m)assert.doesNotMatch(x.label+x.hint+x.tags.join(),clean);
 for(const mic of [20,55,85])assert.doesNotMatch(SG.advice(k,{...w,mic},f),clean);
 assert.equal(SG.begin('duel',k,w,f,p),null,'the duel is not a segment engine');
 console.log('PASS the menu offers the duel and four other segments');
}

// 2. Every path, in every voice, reads cleanly and ends in a result the match can use.
{
 const counts={};
 for(const type of ['solo','vignette','ambush','grilling']){
  const all=paths(type);counts[type]=all.length;
  for(const v of VOICES)for(const picks of all){
   const {st,r}=play(type,picks,as(v),{banks:picks.length%2?promoBanks(v):undefined});
   assert.equal(st.stage,'done',type+' finishes');assert.equal(SG.choose(st,picks[0]),false,'nothing after the end');
   assert.ok(r&&r.live&&r.format===type&&r.styleName&&r.hook&&r.reaction,type+' result');
   for(const key of ['quality','crowdShift','heatDelta'])assert.ok(Number.isFinite(r[key]),key);
   assert.ok(r.quality>=12&&r.quality<=95&&r.heatDelta>=0&&r.heatDelta<=16&&r.crowdShift>=-6&&r.crowdShift<=13);
   const text=[...st.log.map(e=>e.text),r.hook,r.reaction];
   assert.doesNotMatch(text.join('\n'),clean,type+' '+v+' '+picks);
   for(const t of text)assert.ok(sentence(t),'starts like a sentence: '+t);
  }
 }
 const len=(type,i)=>SG.ENGINES[type].rounds[i].options.length,g=len('grilling',0)-1;// the walk-out ends a grilling early
 assert.deepEqual(counts,{solo:len('solo',0)*len('solo',1)*len('solo',2),vignette:SG.VIGNETTE_SETTINGS.length*16,ambush:len('ambush',0)*len('ambush',1)*len('ambush',2),grilling:1+g*(1+g*(g+1))});
 console.log('PASS every path reads cleanly in all eight voices: '+JSON.stringify(counts));
}

// 3. Deterministic, and survives a save in the middle.
{
 for(const type of ['solo','ambush','grilling']){
  const picks=paths(type)[7];
  const a=play(type,picks,as('rex'),{contract:{id:'fixed-'+type}}).r,b=play(type,picks,as('rex'),{contract:{id:'fixed-'+type}}).r;
  assert.deepEqual(a,b,type+' is reproducible');
  career();let st=SG.begin(type,contract({id:'fixed-'+type}),as('rex'),G.F('silas'),G.P('crown'));
  SG.choose(st,picks[0]);st=JSON.parse(JSON.stringify(st));for(const id of picks.slice(1))SG.choose(st,id);
  assert.equal(JSON.stringify(SG.result(st)),JSON.stringify(a),type+' resumes from a save');
 }
 console.log('PASS segments are reproducible and resume from a save');
}

// 4. The grilling asks about what is actually going on.
{
 career();const hurt=as('rex',{injury:{part:'knee',weeks:2},fatigue:50,morale:70,ego:50,heat:60});
 const st=SG.begin('grilling',contract(),hurt,G.F('silas'),G.P('crown'));
 assert.ok(st.questions.includes('hurt'),'an injured wrestler is asked about it');
 assert.equal(new Set(st.questions).size,3);
 const fine=SG.begin('grilling',contract(),as('rex',{injury:null,fatigue:0,morale:70,ego:50,heat:60}),G.F('silas'),G.P('crown'));
 assert.ok(!fine.questions.includes('hurt'),'a fit one is not');
 // Walking out ends it early, and the promoter notices.
 const t0=G.P('crown').trust,walk=SG.begin('grilling',contract(),as('rex'),G.F('silas'),G.P('crown'));
 SG.choose(walk,'storm');assert.equal(walk.stage,'done');assert.equal(G.P('crown').trust,t0-1);
 const m0=G.W('rex').morale,honest=SG.begin('grilling',contract(),G.W('rex'),G.F('silas'),G.P('crown'));
 for(let i=0;i<3;i++)SG.choose(honest,'straight');
 assert.equal(G.W('rex').morale,m0+3,'straight answers lift morale, once');
 console.log('PASS the grilling asks about injuries, can end in a walk-out, and honesty helps morale');
}

// 5. The vignette is taped: there is no live mic roll (a weak talker only gets a fixed lift from the edit), and it has a ceiling.
{
 let best=0;
 for(const picks of paths('vignette')){
  const lo=play('vignette',picks,as('rex',{mic:55}),{contract:{id:'tape'}}).r,hi=play('vignette',picks,as('rex',{mic:95}),{contract:{id:'tape'}}).r;
  assert.equal(lo.quality,hi.quality,'no live mic roll');best=Math.max(best,hi.quality);
 }
 assert.ok(best<=82&&best>=65,'a good package is good, never great: '+best);
 console.log('PASS the vignette has no live mic roll; best package '+best+'/100');
}

// 6. The ambush: the opponent starts the match hurt, the promoter has an opinion, and it reaches the match.
{
 const {r}=play('ambush',['interview','chair','stand'],as('rex'),{contract:{id:'amb-a'}});
 assert.ok(r.opponentHurt>=14,'a chair hurts');
 const stare=play('ambush',['car','stare','leave'],as('rex')).r;
 assert.ok(!stare.opponentHurt,'a stare does not');
 career();const t0=G.P('crown').trust;
 const st=SG.begin('ambush',contract({id:'amb-b'}),G.W('rex'),G.F('silas'),G.P('crown'));
 for(const id of ['interview','chair','leave'])SG.choose(st,id);
 assert.ok(G.P('crown').trust<t0,'a traditional promoter does not like chairs on live television');
 const tr=G.P('crown').trust;st.settled=true;SG.choose(st,'stand');assert.equal(G.P('crown').trust,tr,'settled once');
 // In the ring: the opponent's stamina starts lower, and the hook is read before the bell.
 const promo=SG.result(st),w=G.W('rex'),mk=pr=>MX.create({w:{...w},f:G.F('silas'),p:G.P('crown'),slot:'main',minutes:15,finish:'win_clean',feudHeat:40,promo:pr,plan:{game:'story',leash:'script',talk:'none'},seed:5});
 assert.ok(mk(promo).fSt<mk(null).fSt,'the opponent starts hurt');
 const k=contract();G.S.card.push(k);const M=mk(promo);
 for(let i=0;i<12000&&!M.done;i++){if(M.decision&&!M.queue.length)MX.resolve(M,M.decision.options[0].id);MX.next(M);}
 assert.ok(M.log.some(l=>l.text===promo.hook),'the hook is read before the bell');
 const heat0=(G.S.feuds['rex:silas']={wid:'rex',rid:'silas',heat:30,matches:1,closed:false,since:1}).heat;
 G.applyResult(k,{...M.final,log:[]});
 assert.equal(G.S.history[0].promo.style,'Backstage ambush');
 assert.equal(G.S.feuds['rex:silas'].heat>=heat0+promo.heatDelta,true,'the feud heats up');
 console.log('PASS an ambush hurts the opponent, costs trust with a traditional promoter, and reaches the match');
}

// 7. The solo promo is a microphone test: a strong talker does better on the same gambles.
{
 let lo=0,hi=0;
 for(let i=0;i<40;i++){
  const id='solo-'+i;
  lo+=play('solo',['self','catch','more'],as('rex',{mic:25}),{contract:{id}}).r.quality;
  hi+=play('solo',['self','catch','more'],as('rex',{mic:90}),{contract:{id}}).r.quality;
 }
 assert.ok(hi>lo+200,'mic skill matters: '+Math.round(lo/40)+' v '+Math.round(hi/40));
 const town=play('solo',['rival','town','walk'],as('malik')).r;
 assert.ok(town.heatDelta>=7&&town.crowdShift>0,'cheap heat still gets the building going');
 console.log('PASS solo promos reward mic skill ('+Math.round(lo/40)+' v '+Math.round(hi/40)+'); cheap heat works');
}

// 8. The solo promo and the grilling speak in the wrestler's own words, from every bank in the game.
{
 const D=root.OfficePromoDialogue,YOU=/\byou(?:r|rs|rself|'re|'ll|'ve|'d|’re|’ll|’ve|’d)?\b/i;
 const owners=[...new Set(fs.readdirSync(path.join(__dirname,'..','assets','promo-banks')).map(f=>f.split('.')[0]))];
 const plans={solo:[['crowd','story','vow'],['self','catch','walk'],['rival','threat','clean']],grilling:[['straight','straight','straight'],['turn','joke','storm']]};
 let beats=0,authored=0,vows=0,authoredVows=0,cleans=0;const unused=new Set(owners);
 const explicit=/\b(?:I will win|I intend to win|I'll win|I am going to win|I guarantee)\b/i;
 for(const owner of owners)for(const [type,list] of Object.entries(plans))for(const picks of list){
  const w=as(owner,{style:owner.startsWith('rookie-')?'Brawl':G.W('rex').style});
  const {st,r}=play(type,picks,w,{banks:promoBanks(owner),contract:{id:'own-'+owner+'-'+type+picks[0]}});
  const own=st.log.filter(e=>e.authoredId);
  beats+=st.log.filter(e=>e.side==='w').length;authored+=own.length;if(own.length)unused.delete(owner);
  for(const e of own){
   assert.ok(e.authoredId.startsWith(owner+'.')||e.authoredId.startsWith('rookie-vow-'),'only the wrestler’s own lines: '+e.authoredId);
   assert.doesNotMatch(e.text,/\{\w+\}|undefined|null/);
  }
  assert.equal(new Set(own.map(e=>e.authoredId)).size,own.length,'no line twice in one scene');
  assert.equal(JSON.stringify(r.dialogueIds),JSON.stringify(own.map(e=>e.authoredId)),'the result remembers what was said');
  // Lines spoken to the room or to an interviewer never talk to an absent "you".
  const toRoom=st.log.filter((e,i)=>e.authoredId&&!/camera/.test(st.log[i-1]?.text||''));
  const vowLine=type==='solo'&&picks[2]==='vow'?st.log.filter(e=>e.side==='w').at(-1):null;
  const cleanLine=type==='solo'&&picks[2]==='clean'?st.log.filter(e=>e.side==='w').at(-1):null;
  for(const e of toRoom)if(e!==vowLine&&e!==cleanLine)assert.doesNotMatch(e.text,YOU,'not addressed to an absent opponent: '+e.text);
  if(vowLine){vows++;assert.equal(r.promise.type,'win');// An authored vow was approved by the duel's own closing selector; a fallback vow says "win".
  if(!vowLine.authoredId)assert.match(vowLine.text,/\bwin\b/i,'a fallback vow is an explicit promise: '+vowLine.text);if(vowLine.authoredId)authoredVows++;}
  if(cleanLine){cleans++;assert.equal(r.promise.type,'clean');assert.match(cleanLine.text,/clean/i);}
  if(type==='grilling'){assert.equal(r.promise,null);for(const e of own)assert.doesNotMatch(e.text,explicit,'no unrecorded promises in an interview: '+e.text);}
 }
 const share=authored/beats;
 assert.ok(share>.4,'most wrestler lines come from their own bank: '+Math.round(share*100)+'%');
 assert.ok(unused.size<=owners.length*.05,'nearly every bank is heard: '+unused.size+' silent');
 assert.ok(authoredVows>=20,'reviewed vows reach the solo promo: '+authoredVows+'/'+vows);
 console.log('PASS '+owners.length+' banks: '+Math.round(share*100)+'% of wrestler lines are their own words; '+authoredVows+'/'+vows+' vows authored; '+cleans+' clean promises');
}

// 9. Their words are remembered: the next promo does not repeat them, and a save keeps the bank.
{
 const banks=promoBanks('rex'),picks=['self','catch','walk'];
 const first=play('solo',picks,G.W('rex'),{banks,contract:{id:'mem-1'}});
 const said=first.st.log.filter(e=>e.authoredId).map(e=>e.authoredId);assert.ok(said.length>=2,'rex speaks in his own words');
 G.S.history=[{promo:{dialogue:first.r.dialogue}}];
 const k=contract({id:'mem-1'}),st=SG.begin('solo',k,G.W('rex'),G.F('silas'),G.P('crown'),{banks});
 for(const id of picks)SG.choose(st,id);
 for(const e of st.log.filter(e=>e.authoredId))assert.ok(!said.includes(e.authoredId),'not repeated next time: '+e.authoredId);
 career();let mid=SG.begin('grilling',contract({id:'mem-2'}),G.W('rex'),G.F('silas'),G.P('crown'),{banks});SG.choose(mid,'straight');
 const whole=SG.begin('grilling',contract({id:'mem-2'}),G.W('rex'),G.F('silas'),G.P('crown'),{banks});for(const id of ['straight','turn','storm'])SG.choose(whole,id);
 mid=JSON.parse(JSON.stringify(mid));for(const id of ['turn','storm'])SG.choose(mid,id);
 assert.equal(JSON.stringify(SG.result(mid)),JSON.stringify(SG.result(whole)),'resumes with the saved bank');
 const none=play('solo',picks,G.W('rex'),{contract:{id:'mem-3'}});
 assert.ok(!none.st.log.some(e=>e.authoredId),'without a bank, the voice lines stand in');
 console.log('PASS bank lines are not repeated in the next promo, and a save keeps the bank');
}

// 10. A promise made in a solo promo is checked after the match, like a duel promise.
{
 const s=career();const k=contract({id:'vow-1',finish:'win_clean'});s.card.push(k);
 s.feuds['rex:silas']={wid:'rex',rid:'silas',heat:30,matches:1,closed:false,since:1};
 const st=SG.begin('solo',k,G.W('rex'),G.F('silas'),G.P('crown'),{banks:promoBanks('rex')});
 for(const id of ['crowd','story','vow'])SG.choose(st,id);
 const promo=SG.result(st),w=G.W('rex');
 const M=MX.create({w:{...w},f:G.F('silas'),p:G.P('crown'),slot:'main',minutes:15,finish:'win_clean',feudHeat:30,promo,plan:{game:'story',leash:'script',talk:'none'},seed:9});
 for(let i=0;i<12000&&!M.done;i++){if(M.decision&&!M.queue.length)MX.resolve(M,M.decision.options[0].id);MX.next(M);}
 G.applyResult(k,{...M.final,log:[]});
 const h=s.history[0].promo;
 assert.equal(h.promise.type,'win');assert.equal(h.promise.checked,true,'the vow is checked');
 assert.equal(typeof h.promise.kept,'boolean');
 assert.ok(s.history[0].notes.some(n=>/microphone promise/.test(n)),'and it is reported');
 console.log('PASS a solo vow is checked after the match: '+(h.promise.kept?'kept':'broken'));
}
