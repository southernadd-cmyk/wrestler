'use strict';
// v3.8 training: sessions with Dennis — rehearse, learn a big-spot move, mic work — and what they change.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
const db=new Map(),root={addEventListener(){}};
const localStorage={getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)};
vm.runInNewContext(script.slice(0,script.indexOf('/* THE OFFICE — interface v3')),{window:root,localStorage,console,Math,Date,JSON});
const {OfficeData:D,OfficeGame:G,OfficeRoom:Room,OfficeMic:Mic,OfficeMatch:M}=root;
const clone=x=>JSON.parse(JSON.stringify(x));

G.fresh();G.S.cash=1e6;
const ids=G.S.free.slice(0,3).map(w=>w.id);
for(const id of ids)assert.equal(G.sign(id)||null,null,'signed '+id);
const [a,b,c]=ids.map(id=>G.W(id));
const week=()=>{G.S.card=[];G.endWeek();};

// What is on offer.
const options=G.sessionOptions(a);
assert.equal(options[0].value,'none');
assert.ok(options.some(o=>o.value==='rehearse'),'rehearsal is offered');
const learnOptions=options.filter(o=>o.value.startsWith('learn:'));
assert.ok(learnOptions.length>=1&&learnOptions.length<=3,'one to three moves to learn');
assert.equal(options.filter(o=>o.value.startsWith('mic:')).length,5,'five styles of mic work');
for(const m of Room.learnable(a))assert.ok(M.GRAPH.A[m.id]&&m.weeks>=2&&!(D.PROFILES[a.id]?.signature||[]).includes(m.id),'learnable moves are real, take time and are new');

// Dennis has time for two sessions a week.
assert.equal(G.setSession(a.id,learnOptions[0].value),null);
assert.equal(G.setSession(b.id,'mic:imagery'),null);
assert.match(G.setSession(c.id,'rehearse')||'',/only has time/,'a third session is refused');
assert.equal(G.setSession(a.id,'mic:proof'),null,'changing an existing session is fine');
assert.equal(G.setSession(a.id,learnOptions[0].value),null);

// Learning a move: progress each week, paused when exhausted, then it belongs to the wrestler.
const move=learnOptions[0].value.slice(6),need=a.learning.need;
a.fatigue=80;week();
assert.equal(a.learning.done,0,'too tired to learn');
for(let i=0;i<need;i++){a.fatigue=10;week();}
assert.ok(a.learned.includes(move),'the move is learned');
assert.equal(a.session,null,'the session ends when the move is learned');
assert.ok(G.S.inbox.some(m=>m.from==='Dennis'&&/new move/.test(m.subject)),'Dennis reports it');

// A learned move becomes the wrestler's own big-spot pitch.
const foe=D.FOES.find(f=>Room.legal(move,a,f))||D.FOES[0];
const booking={id:'learned',wid:a.id,rid:foe.id,pid:D.PROMOS[0].id,finish:'win_clean',slot:'mid',minutes:12,eventAbs:1};
const room=Room.begin(booking,a,foe,D.PROMOS[0]);Room.act(room,'plan_story');
const bigSpot=Room.boardView(room).find(r=>r.slot==='payoff');
const card=bigSpot.cards.find(k=>k.by==='w');
assert.ok(card,'the wrestler pitches a big spot');
assert.equal(Room.pitches(room,'payoff').find(k=>k.by==='w').action,move,'their pitch is the move they learned');
assert.ok(card.tags.includes('Learned in training'));

// Mic work: practice makes a style suit the speaker better, Dennis mentions it, and it fades.
const promoBooking={id:'mic',wid:b.id,rid:foe.id,pid:D.PROMOS[1].id,finish:'win_clean',slot:'mid',minutes:12,eventAbs:2};
const before=Mic.openFit(Mic.begin(promoBooking,{...b,micWork:{}},foe,null,null,D.PROMOS[1]),'imagery');
for(let i=0;i<4;i++)week();
assert.equal(G.micLevel(b,'imagery'),2,'four weeks makes it sharp');
const practised=Mic.begin(promoBooking,b,foe,null,null,D.PROMOS[1]);
assert.equal(Mic.openFit(practised,'imagery'),Math.min(2,before+2),'practice improves the fit');
assert.equal(Mic.view(practised).read.length,5,'Dennis mentions the practice in his read');
assert.match(Mic.view(practised).read[4],new RegExp(b.short));
G.setSession(b.id,null);
for(let i=0;i<12;i++)week();
assert.ok(G.micLevel(b,'imagery')<2,'practice fades when it is not kept up');

// Rehearsal: one-off, makes the next match keener and better at sticking to the sheet, and expires.
assert.equal(G.setSession(c.id,'rehearse'),null);
week();
assert.ok(G.rehearsed(c),'rehearsed');
assert.equal(c.session,null,'a rehearsal is a one-off');
const rb={id:'reh',wid:c.id,rid:foe.id,pid:D.PROMOS[2].id,finish:'win_clean',slot:'mid',minutes:12,eventAbs:3};
const plain=Room.begin(rb,c,foe,D.PROMOS[2]),ready=Room.begin(rb,c,foe,D.PROMOS[2],{rehearsed:true});
for(const st of [plain,ready]){Room.act(st,'plan_story');Room.act(st,'board_ok');while(st.stage!=='done')Room.act(st,Room.options(st)[0].id);}
assert.ok(ready.sheet.rehearsed&&!plain.sheet.rehearsed);
assert.ok(ready.sheet.workerConsent>plain.sheet.workerConsent,'a rehearsed wrestler is keener');
assert.ok(ready.log.some(l=>l.side==='agent'&&/rehearsed|went through it/.test(l.text)),'Dennis mentions the rehearsal');
// Same willingness, rehearsed or not: rehearsal alone should keep them closer to the sheet.
let hits={plain:0,ready:0},all=0;
for(let seed=0;seed<60;seed++)for(const [key,src] of [['plain',plain.sheet],['ready',ready.sheet]]){
 const sheet=clone(src);sheet.workerConsent=sheet.opponentConsent=55;
 const m=M.create({w:{...c,flags:{},fatigue:40},f:foe,p:D.PROMOS[2],slot:'mid',minutes:sheet.minutes,finish:'win_clean',plan:{game:sheet.game,leash:'script',talk:'none'},preparation:{},flags:{},sheet,seed:500+seed});
 for(let t=0;t<9000&&!m.done;t++){if(m.decision&&!m.queue.length)M.resolve(m,m.decision.options[0].id);M.next(m);}
 for(const n of m.sheet.nodes)if(n.owner==='w'&&n.id!=='finish'){if(key==='plain')all++;if(n.status==='achieved')hits[key]++;}
}
assert.ok(hits.ready>hits.plain,'rehearsed wrestlers land more of their beats ('+hits.ready+' v '+hits.plain+' of '+all+')');
for(let i=0;i<3;i++)week();
assert.ok(!G.rehearsed(c),'a rehearsal wears off');

// Dennis's suggestion follows the last report.
G.S.history.unshift({wid:c.id,rid:foe.id,season:G.S.season,week:G.S.week,stars:2,sheet:{missed:2,adapted:1,achieved:1,total:5}});
assert.equal(G.sessionTip(c).value,'rehearse','missed beats suggest a rehearsal');

// Old saves gain the new fields.
const old=clone(G.S);for(const w of old.roster){delete w.session;delete w.learned;delete w.micWork;delete w.learning;delete w.rehearsedAt;}
G.S=old;
for(const w of G.S.roster)assert.ok(Array.isArray(w.learned)&&w.micWork&&'session' in w,'migrated '+w.id);
console.log(`PASS training sessions v3.8: ${learnOptions.length} learnable moves for ${a.short}, learned in ${need} weeks; mic fit ${before} -> ${Mic.openFit(practised,'imagery')}; rehearsed beats ${hits.ready} v ${hits.plain} of ${all}; cap ${G.SESSION_CAP} a week`);
