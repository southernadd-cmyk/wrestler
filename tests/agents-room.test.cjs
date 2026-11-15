'use strict';
// The Office v3.5: the agents' room — timed match planning with pitches, objections and a board.
// Run: node tests/agents-room.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage,Date,Math,JSON,console});
const D=root.OfficeData,G=root.OfficeGame,M=root.OfficeMatch,R=root.OfficeRoom,K=root.OfficeGraphKernel,A=M.GRAPH.A;
assert.ok(script.includes('data-room=')&&script.includes('OfficeRoom.begin('),'the agents’ room is wired to the interface');

// 1. Everybody has a voice, and every voice has something to say in every situation.
const tones=new Set(Object.values(R.VOICE));
for(const x of [...D.TALENT,...D.FOES])assert.ok(R.VOICE[x.id],x.id+' has a voice');
for(const [type,byTone] of Object.entries(R.LINES))for(const tone of tones){
 assert.ok(byTone[tone]?.length>=2,type+' lines for '+tone);
 for(const line of byTone[tone])assert.doesNotMatch(line,/\b(he|him|his|she|her)\b/i,'lines stay pronoun-neutral: '+line);
}
for(const tone of tones)assert.ok(R.DAFT[tone]?.pitch&&R.DAFT[tone].yes&&R.DAFT[tone].no,'a daft idea for '+tone);
for(const p of D.PROMOS)assert.ok(R.NOTES[p.id]?.length>=2,p.id+' sends notes');
assert.equal(R.SLOTS.length,5);

let r=20251;const rnd=()=>{r=(Math.imul(r,1664525)+1013904223)>>>0;return r/4294967296;};
const finishes=['win_clean','win_dirty','lose_protected','lose_clean'];
const contract=(i,w,f,p,finish)=>({id:'room-'+i,wid:w.id,rid:f.id,pid:p.id,finish,slot:['opener','mid','feature','main'][i%4],minutes:12,eventAbs:i,feudHeat:(i%4)*15});
function meet(c,w,f,p,game,choose){
 const st=R.begin(c,{...w,flags:{}},f,p,game);
 const trail=[];
 for(let n=0;st.stage!=='done';n++){
  assert.ok(n<40,'a meeting always ends');
  const v=R.view(st);
  assert.ok(v.options.length>0,'there is always something to say: '+v.stage);
  assert.ok(v.clock>=0&&v.clock<=10,'the clock stays on its face');
  const o=choose(v,st);trail.push({stage:v.stage,title:v.title,id:o.id,pending:st.pending?.kind||null});
  R.act(st,o.id);
 }
 return {st,trail};
}
const strategies={
 first:v=>v.options[0],
 last:v=>v.options[v.options.length-1],
 random:v=>v.options[Math.floor(rnd()*v.options.length)],
 planner:v=>{const cards=v.options.filter(o=>o.id.startsWith('card:'));return cards.length?cards[Math.floor(rnd()*cards.length)]:v.options[Math.floor(rnd()*v.options.length)];}
};
const strategyCount=Object.keys(strategies).length;

// 2. Every pairing, every finish, four ways of running the meeting.
const seenKinds=new Set(),seenOptions=new Set(),routes=new Set(),sheets=[];
let meetings=0,i=0;
for(const w of D.TALENT)for(const f of D.FOES)for(const finish of finishes)for(const [name,choose] of Object.entries(strategies)){
 const p=D.PROMOS[(i+Math.floor(i/strategyCount))%D.PROMOS.length],c=contract(i++,w,f,p,finish),game=['story','technical','brawl','spots','safe'][i%5];
 const {st,trail}=meet(c,w,f,p,game,choose);meetings++;
 for(const t of trail){if(t.pending)seenKinds.add(t.pending);seenOptions.add(t.id.split(':')[0]);}
 const text=st.log.map(l=>l.who+': '+l.text).join('\n');
 assert.doesNotMatch(text,/undefined|NaN|\{\w+\}|\[object/,'the conversation is clean');
 // Nobody says the same sentence three times in ten minutes.
 const counts={};for(const l of st.log)if(l.kind!=='you'){counts[l.text]=(counts[l.text]||0)+1;assert.ok(counts[l.text]<=2,'repeated line: '+l.text);}
 const sh=st.sheet;
 assert.ok(sh.signed&&sh.v===4&&sh.contract===c.id,'a signed sheet comes out of the room');
 assert.equal(K.validate(sh.nodes).length,0,'the sheet is a valid commitment graph');
 assert.equal(sh.nodes.at(-1).actions[0],'outcome_'+finish,'the contracted finish is untouched');
 assert.ok(M.FINISH_ROUTES[finish].some(x=>x.id===sh.finishRoute),'the agreed finish is one the contract allows');
 for(const k of ['workerConsent','opponentConsent'])assert.ok(sh[k]>=20&&sh[k]<=95,k+' in range');
 assert.ok(['detailed','landmarks','live'].includes(sh.method));
 assert.ok(sh.bonus>=0&&sh.bonus%40===0);
 routes.add(finish+'.'+sh.finishRoute);
 sheets.push({c,w,f,p,game,sh,name});
}
for(const kind of ['credibility','safety','ego','proud','impossible'])assert.ok(seenKinds.has(kind),'objection seen: '+kind);
for(const o of ['honour','judgement','argue','card','open','insist','trade','sweeten','word','backdown','anyway','fair','no','yes','later','sign'])assert.ok(seenOptions.has(o),'option used: '+o);
assert.ok(routes.size>=14,'most finish routes get pitched: '+routes.size);

// 3. Pitches are real moves the performer can physically do, unless flagged as ambition.
for(const w of D.TALENT)for(const f of D.FOES){
 const st=R.begin(contract(999,w,f,D.PROMOS[0],'win_clean'),{...w,flags:{}},f,D.PROMOS[0],'story');
 for(const S of R.SLOTS){
  const cards=R.pitches(st,S.id);
  assert.ok(cards.length>=2,'at least two pitches for '+S.id);
  assert.equal(new Set(cards.map(c=>c.action||c.route)).size,cards.length,'pitches are distinct');
  for(const c of cards){
   if(S.id==='finish'){assert.ok(R.ROUTE_NAME[c.route],'named route');continue;}
   if(c.action==='scheduled_nearfall')continue;
   assert.ok(A[c.action]?.name,'a real catalog move: '+c.action);
   const o=c.owner==='w'?w:f,rr=c.owner==='w'?f:w;
   assert.equal(R.legal(c.action,o,rr),!c.impossible,c.action+' legality is flagged honestly for '+o.id+' v '+rr.id);
   if(S.id!=='payoff')assert.ok(!A[c.action].risk,'only the big spot is high risk');
  }
 }
}

// 4. Objections cost something, whichever way they are settled.
function upTo(c,w,f,p,kind){
 // Drive a meeting until a given objection appears; returns the state at that moment.
 for(let attempt=0;attempt<40;attempt++){
  const st=R.begin({...c,id:c.id+'-'+attempt},{...w,flags:{}},f,p,'story');
  for(let n=0;n<30&&st.stage!=='done';n++){
   if(st.pending?.kind===kind)return st;
   const o=R.options(st);
   R.act(st,(st.pending?o[0]:o[Math.floor(rnd()*o.length)]).id);
  }
 }
 return null;
}
const clone=st=>JSON.parse(JSON.stringify(st));
const lyra=D.TALENT.find(x=>x.id==='lyra'),rev=D.FOES.find(x=>x.id==='rev'),silas=D.FOES.find(x=>x.id==='silas'),mara=D.TALENT.find(x=>x.id==='mara');
const ego=upTo(contract(1,mara,silas,D.PROMOS[0],'win_clean'),mara,silas,D.PROMOS[0],'ego');
assert.ok(ego,'two big egos argue over the big spot');
{
 const by=ego.pending.by,before=R.consent(ego,by);
 const insist=clone(ego);R.act(insist,'insist');
 assert.ok(R.consent(insist,by)<before,'insisting costs goodwill');
 assert.ok(insist.clock<ego.clock,'arguments cost time');
 const back=clone(ego);R.act(back,'backdown');
 assert.equal(back.board.payoff.owner,by,'backing down gives the objector the spot');
 const soothe=clone(ego),id=by==='w'?'sweeten':'word';
 assert.ok(R.options(soothe).some(o=>o.id===id),'the right kind of persuasion is on offer');
 assert.ok(!R.options(soothe).some(o=>o.id===(by==='w'?'word':'sweeten')),'you cannot bonus somebody else’s wrestler');
 R.act(soothe,id);
 if(id==='sweeten'){assert.equal(soothe.bonus,40);assert.ok(R.consent(soothe,by)>R.consent(insist,by));}
}
const safety=upTo(contract(2,D.TALENT.find(x=>x.id==='brick'),D.FOES.find(x=>x.id==='night'),D.PROMOS[1],'win_clean'),D.TALENT.find(x=>x.id==='brick'),D.FOES.find(x=>x.id==='night'),D.PROMOS[1],'safety')
 ||upTo(contract(3,lyra,rev,D.PROMOS[1],'lose_clean'),lyra,rev,D.PROMOS[1],'safety');
assert.ok(safety,'a careful worker objects to a careless one doing something dangerous');
{
 const careless=safety.pending.by==='w'?safety.f:safety.w;
 assert.ok(careless.safe<58&&A[safety.pending.card.action].risk,'the safety objection has a real cause');
}
// The objection to a heavy early move can be traded for a physically possible big spot.
{
 const malik=D.FOES.find(x=>x.id==='malik'),p=D.PROMOS[0];
 const st=R.begin(contract(4000,mara,malik,p,'win_clean'),{...mara,flags:{}},malik,p,'story');
 for(const id of ['honour','card:0','card:0'])R.act(st,id);
 assert.equal(st.pending?.kind,'credibility','Vale objects to taking the gorilla press in the heat');
 assert.equal(st.pending.by,'w');
 assert.ok(R.pitches(st,'payoff').some(c=>c.owner==='w'&&c.impossible),'Vale’s usual pitch is an impossible lift');
 assert.ok(!R.options({...st,clock:2}).some(o=>o.id==='trade'),'no promise when time could run out before the big spot');
 st.clock=3;
 assert.ok(R.options(st).some(o=>o.id==='trade'),'enough time to promise the big spot');
 R.act(st,'trade');
 assert.equal(st.promised,'w');
 R.act(st,'card:0');
 assert.equal(st.board.payoff.owner,'w','the traded big spot goes to the wrestler it was promised to');
 assert.ok(R.legal(st.board.payoff.action,mara,malik),'the promised move is physically possible');
}

// 5. Running out of time leaves the rest to be called in the ring.
{
 const w=mara,f=silas,st=R.begin(contract(5,w,f,D.PROMOS[0],'win_clean'),{...w,flags:{}},f,D.PROMOS[0],'story');
 st.clock=1;R.act(st,'judgement');R.act(st,R.options(st).find(o=>o.id.startsWith('card:')).id);
 while(st.pending)R.act(st,'insist');
 while(st.stage!=='done')R.act(st,R.options(st)[0].id);
 assert.ok(st.log.some(l=>/That’s doors/.test(l.text)),'the road agent calls time');
 assert.ok(st.sheet.nodes.filter(n=>n.open).length>=2,'unplanned beats are left open');
 assert.ok(st.sheet.method!=='detailed');
}

// 6. Deterministic, and a meeting saved half-way resumes identically.
{
 const c=contract(6,mara,rev,D.PROMOS[2],'lose_protected'),ids=[];
 const a=R.begin(c,{...mara,flags:{}},rev,D.PROMOS[2],'story');
 while(a.stage!=='done'){const o=R.options(a)[0].id;ids.push(o);R.act(a,o);}
 const b=R.begin(c,{...mara,flags:{}},rev,D.PROMOS[2],'story');
 let saved=null;ids.forEach((id,n)=>{if(n===4)saved=clone(b);R.act(b,id);});
 assert.equal(JSON.stringify(a),JSON.stringify(b),'same choices, same meeting');
 ids.slice(4).forEach(id=>R.act(saved,id));
 assert.equal(JSON.stringify(saved),JSON.stringify(a),'a saved meeting resumes identically');
}

// 7. In the ring: the board is what they try to do, and how hard they try depends on how they feel.
function play(s,seed,tweak){
 const sheet=tweak?tweak(clone(s.sh)):s.sh;
 const x=M.create({w:{...s.w,flags:{},fatigue:5},f:s.f,p:s.p,slot:s.c.slot,minutes:12,finish:s.c.finish,plan:{game:s.game,leash:'script',talk:'calm'},preparation:{},flags:{},sheet,seed});
 for(let k=0;k<9000&&!x.done;k++){if(x.decision&&!x.queue.length){const o=x.decision.options.find(o=>['job','home','cut','protect'].includes(o.id))||x.decision.options[0];M.resolve(x,o.id);}M.next(x);}
 assert.ok(x.done);return x;
}
const tally=x=>{const out={done:0,all:0};for(const b of x.sheet.nodes)if(b.planned&&b.id!=='finish'&&!b.impossible&&b.actions[0]!=='scheduled_nearfall'){out.all++;if(b.status!=='missed')out.done++;}return out;};
const planned=sheets.filter(s=>s.name==='planner').slice(0,150);
let happy={done:0,all:0},sulking={done:0,all:0},routeHits=0,routeAll=0,honour={kept:0,all:0},loose={kept:0,all:0},stunts=0,blocked=0,impossible=0;
planned.forEach((s,n)=>{
 const x=play(s,7000+n,sh=>{sh.workerConsent=85;sh.opponentConsent=85;return sh;});
 const t=tally(x);happy.done+=t.done;happy.all+=t.all;
 const y=play(s,7000+n,sh=>{sh.workerConsent=24;sh.opponentConsent=24;return sh;});
 const u=tally(y);sulking.done+=u.done;sulking.all+=u.all;
 if(!['double','nc'].includes(x.outcome)){routeAll++;if(x.final.finishRoute===s.sh.finishRoute)routeHits++;}
 const note=x.final.roomNote;
 if(note){const bucket=note.honour?honour:loose;bucket.all++;if(note.kept)bucket.kept++;}
 if(s.sh.stunt){stunts++;assert.ok(x.log.some(l=>l.text===s.sh.stunt.line),'an approved daft idea happens on the way to the ring');}
 for(const b of x.sheet.nodes)if(b.impossible){impossible++;assert.equal(b.status,'missed','an impossible lift never comes off');if(x.graph.events.some(e=>e.id===b.actions[0]+'_blk'))blocked++;}
 assert.doesNotMatch(x.log.map(l=>l.text).join(' '),/undefined|NaN|\{\w+\}/);
});
assert.ok(happy.all>300,'plenty of planned beats tested');
assert.ok(happy.done/happy.all>=.85,'willing wrestlers deliver the board: '+(happy.done/happy.all*100).toFixed(0)+'%');
assert.ok(sulking.done/sulking.all<=happy.done/happy.all-.2,'sulking wrestlers do not: '+(sulking.done/sulking.all*100).toFixed(0)+'%');
assert.equal(routeHits,routeAll,'the finish agreed in the room is the finish performed');
assert.ok(honour.all>=20&&honour.kept/honour.all>=.8,'a promise to the promoter is usually kept: '+honour.kept+'/'+honour.all);
assert.ok(loose.kept/Math.max(1,loose.all)<honour.kept/honour.all,'and kept more often than when nothing was promised');
assert.ok(stunts>0,'daft ideas get approved sometimes');

// 8. After the bell: the promoter's note moves trust once, and a promised bonus is paid once.
{
 G.fresh();G.sign('rex');
 const w=G.W('rex'),f=G.F('red'),p=G.P('dock');
 const c={id:'room-result',wid:w.id,rid:f.id,pid:p.id,slot:'mid',minutes:12,finish:'win_clean',purse:300,blowoff:false,feudHeat:0,eventAbs:1};
 G.S.card.push(c);
 const st=R.begin(c,w,f,p,'brawl');R.act(st,'honour');
 while(st.stage!=='done'){const o=R.options(st);R.act(st,(o.find(x=>x.id==='sweeten')||o[0]).id);}
 st.sheet.bonus=Math.max(40,st.sheet.bonus);
 const x=M.create({w:{...w,flags:{},fatigue:0},f,p,slot:'mid',minutes:12,finish:'win_clean',plan:{game:'brawl',leash:'script',talk:'calm'},preparation:{},flags:{},sheet:st.sheet,seed:42});
 for(let k=0;k<9000&&!x.done;k++){if(x.decision&&!x.queue.length)M.resolve(x,x.decision.options[0].id);M.next(x);}
 const fin={...x.final,log:x.log};
 assert.ok(fin.roomNote&&fin.roomNote.honour===true,'the result carries the note');
 const trust=p.trust,cash=G.S.cash;
 const out=G.applyResult(c,fin);
 assert.ok(out.some(l=>/note/.test(l.text)),'the promoter’s verdict is reported');
 assert.ok(out.some(l=>/Bonus promised in the agents’ room/.test(l.text)),'the bonus is reported');
 const afterTrust=G.P('dock').trust,afterCash=G.S.cash;
 G.applyResult(c,fin);
 assert.equal(G.P('dock').trust,afterTrust,'a replayed result does not move trust twice');
 assert.equal(G.S.cash,afterCash,'a replayed result does not pay the bonus twice');
 G.fresh();
}
console.log('PASS agents’ room v3.5: '+meetings+' meetings across every pairing and finish; objections '+[...seenKinds].sort().join(', ')+'; '+routes.size+' finish routes pitched; '+
 'board delivered '+(happy.done/happy.all*100).toFixed(0)+'% when willing, '+(sulking.done/sulking.all*100).toFixed(0)+'% when sulking; agreed finish '+routeHits+'/'+routeAll+'; '+
 'promoter’s note kept '+honour.kept+'/'+honour.all+' when promised, '+loose.kept+'/'+loose.all+' when not; '+blocked+'/'+impossible+' impossible lifts visibly blocked; deterministic and resumable');
