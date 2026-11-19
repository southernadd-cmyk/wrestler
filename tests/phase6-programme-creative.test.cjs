'use strict';
// Phase 6: programme creative choices change delivery and preserve the booker's finish.
const assert=require('node:assert/strict');
const {engine}=require('./_world.cjs');
const {root}=engine(6466);
const {OfficeGame:G,OfficeMic:Mic,OfficeProgrammeArcs:A,OfficeProgrammes:P,OfficeData:D}=root;
G.fresh();const s=G.S;s.cash=99999;assert.equal(G.sign('rex'),null);
const id='phase6-chapter-test',c={id:'phase6-programme-bout',pid:'crown',wid:'rex',rid:'silas',slot:'main',minutes:16,finish:'lose_clean',purse:320,eventAbs:G.abs(),programme:{id,step:1}};
const prog={id,pid:'crown',wid:'rex',rid:'silas',div:D.divisionOf('rex'),type:'grudge',beats:[
 {rid:'silas',cid:'old',at:G.abs()-1,done:true},
 {rid:'silas',cid:c.id,at:G.abs(),done:false}],signed:G.abs()-2,arc:{v:1,momentum:52,timeline:[
 {step:0,cid:'old',choice:'steady',chapter:'A grievance',at:G.abs()-1,passed:true,stars:3.5,delta:5,recap:'The first chapter landed.'}]}};
P.state(s.territory).live.push(prog);
const w=G.W('rex'),f=G.F('silas'),p=G.P('crown'),feud=G.feud('rex','silas');
const make=dir=>Mic.begin(c,w,f,feud,null,p,{arc:A.intro(c,dir)});
const steady=make('steady'),needle=make('needle'),gamble=make('gamble');
assert.equal(steady.arc.id,'steady');assert.equal(gamble.arc.id,'gamble');
assert.equal(steady.arc.step,1);assert.match(steady.readLines.join(' '),/first chapter landed/i);
assert.ok(Mic.openFit(gamble,'swagger')>Mic.openFit(steady,'swagger'),'gamble favours a risky confident opening');
assert.ok(Mic.arcFit(needle,'answer','challenge')>Mic.arcFit(steady,'answer','challenge'));
const tags=st=>Mic.choices(st).find(o=>o.id==='swagger').tags;
assert.ok(tags(gamble).includes('Fits programme direction'));
assert.ok(tags(steady).includes('Against chapter direction'));
const testSave=JSON.parse(JSON.stringify(gamble));
assert.equal(testSave.arc.id,'gamble','mid-promo save keeps chapter direction');
assert.deepEqual(Mic.choices(testSave).map(x=>x.id),Mic.choices(gamble).map(x=>x.id));
for(const st of [steady,needle,gamble]){
 for(let i=0;st.stage!=='done'&&i<8;i++){const choices=Mic.choices(st);assert.ok(choices.length);Mic.choose(st,choices[0].id);}
 assert.equal(st.stage,'done');assert.equal(Mic.result(st).arcDirection,st.arc.id);
 assert.equal(c.finish,'lose_clean','player creative choices never rewrite the booked result');
}
assert.ok(new Set([steady,needle,gamble].map(x=>x.log[0].line)).size===3,'three creative directions ask different questions');
console.log('PASS Phase 6: chapter direction changes promo fit, remains saveable and never rewrites the booked finish');
