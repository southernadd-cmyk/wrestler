'use strict';
// v3.9 agents' room: new situations, follow-ups later in the same meeting, and threads that come
// back at a later show with the same wrestler, opponent or promoter.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:Room,OfficeGame:G}=root;
const clean=/undefined|NaN|\{\w+\}|\[object/;
const byId=id=>Room.SITUATIONS.find(s=>s.id===id);

// The deck: 36 drawable situations and 11 follow-ups that are never drawn on their own (v0.3.12 adds the
// rivalry counter-proposal and its reply, which only open when there is a real reason for them).
const followups=Room.SITUATIONS.filter(s=>s.followup&&s.id!=='structure_objection').map(s=>s.id);
// Phase 2 adds an experimental opt-in structure objection. The original
// meeting chain scenarios must still count only their eleven legacy follow-ups.
assert.equal(Room.SITUATIONS.length,48);assert.equal(followups.length,11);
assert.ok(Room.SITUATIONS.some(s=>s.id==='structure_objection'&&s.followup));
const W=D.ALL.find(w=>w.id==='rex'),F=D.ALL.find(w=>w.id==='silas'),F2=D.ALL.find(w=>w.id==='night'),P=D.PROMOS[0],P2=D.PROMOS[2];
let n=0;
const booking=(w,f,p,o={})=>({id:'chain-'+(n++),wid:w.id,rid:f.id,pid:p.id,finish:'lose_protected',slot:'main',minutes:15,eventAbs:o.at??10,feudHeat:40,...o});
for(let i=0;i<300;i++){const st=Room.begin(booking(W,F,P,{finish:Object.keys(D.FINISHES)[i%4],slot:['opener','mid','feature','main'][i%4]}),W,F,P);
 assert.ok(st.queue.every(id=>!followups.includes(id)),'follow-ups are only reached through a chain');}

// Play a meeting to the end. `picks` says which option to take in which situation.
function play(st,picks={}){
 for(let g=0;st.stage!=='done'&&g<16;g++){
  const v=Room.view(st);
  const sit=st.stage==='scene'?st.queue[st.at]:null;
  const id=v.stage==='board'?'board_ok':sit&&picks[sit]?picks[sit]:v.options[0].id;
  Room.act(st,id);
 }
 assert.equal(st.stage,'done');
 assert.doesNotMatch(st.log.map(e=>e.text).join('\n'),clean);
 return st;
}
const meeting=(queue,opts={},w=W,f=F,p=P,extra={})=>{const st=Room.begin(booking(w,f,p,extra),w,f,p,opts);if(queue)st.queue=queue.slice();return st;};

// In-meeting chains: the follow-up takes the place of the next situation, so the length holds.
for(const [trigger,option,follow] of [['ref_cover','trust','ref_question'],['scout_rival','show','scout_approach'],['local_lad','finish','lad_move'],['heckler','use','heckler_back']]){
 const st=play(meeting([trigger,'family','paper']),{[trigger]:option});
 assert.deepEqual(st.queue,[trigger,follow,'paper'],trigger+' leads straight to '+follow);
 const lone=play(meeting([trigger]),{[trigger]:option});
 assert.deepEqual(lone.queue,[trigger,follow],'with nothing left to replace, it is added once');
 const other=play(meeting([trigger,'family']),{[trigger]:Room.SITUATIONS.find(s=>s.id===trigger).options(meeting([trigger])).find(o=>o.id!==option).id});
 assert.ok(!other.queue.includes(follow),'other answers do not start it');
}
// Refusing a time cut, if it works, brings the promoter back for something.
let raffle=0;
for(let i=0;i<40;i++){const st=play(meeting(['time_cut','family']),{time_cut:'refuse'});if(st.queue[1]==='raffle_payback')raffle++;else assert.equal(st.queue[1],'family');}
assert.ok(raffle>5&&raffle<35,'the payback only follows a refusal that worked ('+raffle+'/40)');
// A meeting grows by one at most, however many chains start.
{const st=play(meeting(['heckler']),{heckler:'use',heckler_back:'stare'});assert.ok(st.queue.length<=2);}

// Threads that come back at a later show.
function after(st,old=[]){return Room.keepThreads(old,st.sheet.threads,st.sheet.threadUsed,st.contract.eventAbs);}
// 1. "After the show, I promise." The same wrestler raises it next time, first thing.
let saved=after(play(meeting(['money_talk','family']),{money_talk:'later'}));
assert.equal(saved.length,1);assert.equal(saved[0].sit,'money_due');assert.equal(saved[0].sid,W.id);
{const st=meeting(null,{threads:Room.liveThreads(saved,14)},W,F2,P2,{at:14});
 assert.equal(st.queue[0],'money_due','the thread opens the next meeting with that wrestler');
 const length=st.queue.length;play(st,{money_due:'pay'});assert.equal(st.queue.length,length,'and replaces a draw');
 assert.ok(st.log.some(e=>/hasn’t forgotten/.test(e.text)));
 saved=after(st,saved);assert.equal(saved.length,0,'a thread is used once');}
// 2. Threads expire after eight weeks.
saved=after(play(meeting(['money_talk']),{money_talk:'later'}));
assert.equal(Room.liveThreads(saved,10+Room.THREAD_WEEKS).length,1);
assert.equal(Room.liveThreads(saved,11+Room.THREAD_WEEKS).length,0);
assert.notEqual(meeting(null,{threads:Room.liveThreads(saved,30)},W,F,P,{at:30}).queue[0],'money_due');
// 3. A promised big spot comes back for whoever was promised, including the opponent.
{const st=meeting(['big_spot','family']);
 for(let g=0;st.stage!=='scene';g++){const v=Room.view(st);Room.act(st,v.stage==='board'?'board_ok':v.options[0].id);}
 const promised=Room.SITUATIONS.find(s=>s.id==='big_spot');const opts=promised.options(st);assert.ok(opts.some(o=>o.id==='later'));
 Room.act(st,'later');play(st);
 const t=after(st);assert.equal(t[0].sit,'promise_due');
 const who=t[0].sid===W.id?'w':'f',X=who==='w'?W:F;
 // Same pairing next time: the promised wrestler is named in the title.
 const next=meeting(null,{threads:t},W,F,P,{at:12});assert.equal(next.queue[0],'promise_due');
 for(let g=0;next.stage!=='scene';g++){const v=Room.view(next);Room.act(next,v.stage==='board'?'board_ok':v.options[0].id);}
 assert.match(Room.view(next).title,new RegExp(X.short));
 const keep=byId('promise_due').options(next).find(o=>o.id==='keep');assert.ok(keep.hint.includes(X.short));
 Room.act(next,'keep');play(next);
 assert.equal(next.board.payoff.owner,who,'keeping the promise hands over the big spot');
 // A different opponent and a different wrestler: the promise to the opponent does not come up.
 if(who==='f')assert.notEqual(meeting(null,{threads:t},W,F2,P,{at:12}).queue[0],'promise_due');}
// 4. "Walk it off" comes back as a worse knock for the same wrestler.
{const st=meeting(['hurt']);play(st,{hurt:'fine'});const t=after(st);assert.equal(t[0].sit,'still_hurting');
 assert.equal(meeting(null,{threads:t},W,F2,P2,{at:12}).queue[0],'still_hurting');
 assert.notEqual(meeting(null,{threads:t},F2,W,P2,{at:12}).queue[0],'still_hurting','not when the hurt wrestler is the opponent');}
// 5. Taking a time cut leaves the promoter owing you, at that promoter only; it can be saved again.
{const st=meeting(['time_cut']);play(st,{time_cut:'cut'});const t=after(st);assert.equal(t[0].sit,'favour_owed');assert.equal(t[0].pid,P.id);
 assert.notEqual(meeting(null,{threads:t},W,F,P2,{at:12}).queue[0],'favour_owed','another promoter owes you nothing');
 const back=meeting(null,{threads:t},F2,W,P,{at:12});assert.equal(back.queue[0],'favour_owed','any wrestler can call it in at that promoter');
 play(back,{favour_owed:'save'});const again=after(back,t);assert.equal(again.length,1,'saving it keeps one favour, not two');assert.equal(again[0].at,12);}

// Every follow-up and every answer plays cleanly.
let answers=0;
for(const id of followups)for(const o of byId(id).options(meeting([id]))){
 const thread={id:'t-'+id,sit:id,sid:W.id,at:10};
 const st=meeting([id],id==='promise_due'||id==='still_hurting'||id==='money_due'?{threads:[thread]}:{});st.queue=[id];
 play(st,{[id]:o.id});answers++;
}
// Every new drawable situation and every answer plays cleanly too.
const added=['ref_cover','family','filming','scout_rival','local_lad','heckler','same_gear','car_park','money_talk','power','paper','music'];
for(const id of added){assert.ok(byId(id)&&!byId(id).followup);for(const o of byId(id).options(meeting([id]))){play(meeting([id]),{[id]:o.id});answers++;}}

// The career keeps threads between shows.
G.fresh();assert.equal(G.sign('rex'),null);
const fin={stars:2.75,crowd:61,crowdPeak:68,outcome:'booked',botches:0,script:.9,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:12,plan:'brawl',stamina:45,injury:0,ignored:0,callsUsed:[],log:[],
 roomThreads:[{id:'x|money_due',sit:'money_due',sid:'rex',at:G.abs()}],roomThreadUsed:null};
G.applyResult({id:'career-1',wid:'rex',rid:'silas',pid:'dock',slot:'mid',minutes:12,finish:'lose_clean',purse:300,feudHeat:0,blowoff:false,eventAbs:G.abs()},fin);
assert.equal(G.S.roomThreads.length,1,'the thread is saved with the career');
G.applyResult({id:'career-2',wid:'rex',rid:'silas',pid:'dock',slot:'mid',minutes:12,finish:'lose_clean',purse:300,feudHeat:0,blowoff:false,eventAbs:G.abs()},{...fin,roomThreads:null,roomThreadUsed:'x|money_due'});
assert.equal(G.S.roomThreads.length,0,'and cleared once it has come up');

console.log(`PASS room chains v3.9: ${Room.SITUATIONS.length} situations (${followups.length} follow-ups); 5 in-meeting chains hold the meeting length; 4 threads return with the right wrestler, opponent or promoter and expire after ${Room.THREAD_WEEKS} weeks; ${answers} answers played cleanly; saved with the career`);
