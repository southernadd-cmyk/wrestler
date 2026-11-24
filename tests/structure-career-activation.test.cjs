'use strict';
// Phase 4 career choice can activate only a matching signed editorial plan.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
assert.ok(cut>0);
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,console,Math,Date,JSON});
const {OfficeData:D,OfficeRoom:Room,OfficeSheets:S,OfficeMatch:E}=root;
const copy=x=>JSON.parse(JSON.stringify(x));
const w=D.TALENT.find(x=>x.style==='Spectacle'),f=D.FOES[0],p=D.PROMOS[0];
assert.ok(w&&f&&p);
function signed(id,lead,game,seed){
 const contract={id:'phase4-'+id+'-'+lead+'-'+seed,wid:w.id,rid:f.id,pid:p.id,
  slot:'main',finish:seed%2?'win_clean':'lose_clean',minutes:12,eventAbs:71,feudHeat:20};
 const st=Room.begin(contract,w,f,p,{structure:{id,lead},structurePlanning:true});
 st.queue=[];Room.act(st,'plan_'+game);
 assert.equal(st.stage,'board');
 Room.act(st,'board_ok');assert.equal(st.stage,'review');
 Room.act(st,'review_ok');Room.act(st,'talk_none');
 assert.equal(st.stage,'done');
 assert.equal(S.STRUCTURES.readPlan(st.sheet).mode,'editorial');
 return {contract,sheet:st.sheet};
}
function make(pair,seed,choice){
 const execute=S.STRUCTURES.executionChoice(pair.sheet,choice);
 return E.create({w:{...w,fatigue:4,flags:{}},f,p,slot:'main',minutes:pair.sheet.minutes,
  finish:pair.contract.finish,feudHeat:20,plan:{game:pair.sheet.game,leash:'script',talk:'none'},
  seed,preparation:{},flags:{},sheet:copy(pair.sheet),structureExecution:execute,identity:{manager:'Colin Wriston',stable:'The Pavilion Aces',portrait:1}});
}
function drive(M){
 for(let n=0;n<9000&&!M.done;n++){
  if(M.decision&&!M.queue.length)E.resolve(M,M.decision.options[0].id);
  E.next(M);
 }
 assert.ok(M.done&&M.final,'a full physical match must finish');
}
const catalogue=S.STRUCTURES.catalogue();
assert.equal(catalogue.length,4);
const gate=S.STRUCTURES.executionChoice;
let simulated=0,earned=0;
for(const info of catalogue)for(const lead of ['w','f'])for(const game of ['story','technical']){
 const pair=signed(info.id,lead,game,++simulated),original=JSON.stringify(pair.sheet),choice={id:info.id,lead};
 assert.equal(gate(pair.sheet,choice),true,'signed matching choice eligible');
 assert.equal(gate(pair.sheet,null),false,'traditional match never activates');
 assert.throws(()=>gate(pair.sheet,{id:info.id,lead:lead==='w'?'f':'w'}),/does not match/);
 assert.throws(()=>gate(pair.sheet,{id:'missing',lead}),/Invalid selected/);
 assert.throws(()=>gate(pair.sheet,{id:info.id,lead,unexpected:1}),/Invalid selected/);
 const unsigned=copy(pair.sheet);unsigned.signed=false;
 assert.throws(()=>gate(unsigned,choice),/does not match/);
 const missing=copy(pair.sheet);delete missing.structurePlan;
 assert.throws(()=>gate(missing,choice),/does not match/);
 const legacy=make(pair,290000+simulated,null);
 assert.equal(E.structureReport(legacy),null,'metadata alone never executes');
 const live=make(pair,290000+simulated,choice);
 assert.equal(E.structureReport(live)?.objectives.length,4);
 drive(live);
 assert.equal(live.graph.outcome.id,pair.contract.finish,'booked result retained');
 assert.equal(E.structureReport(live).id,info.id);
 assert.equal(live.structureDirector.roles.lead,lead);
 assert.equal(S.report(live).total,1,'no phantom American beats');
 assert.equal(JSON.stringify(pair.sheet),original,'editorial agreement is immutable');
 earned+=live.final.structure.objectives.filter(x=>x.status!=='missed').length;
}
const oldContract={id:'phase4-legacy',wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:'win_clean',minutes:12};
const old=Room.begin(oldContract,w,f,p);old.queue=[];
Room.act(old,'plan_story');Room.act(old,'board_ok');Room.act(old,'review_ok');Room.act(old,'talk_none');
assert.equal(S.STRUCTURES.executionChoice(old.sheet,null),false);
assert.equal(S.STRUCTURES.readPlan(old.sheet).mode,'absent');
const unchanged=E.create({w,f,p,slot:'main',minutes:12,finish:'win_clean',
 plan:{game:'story',leash:'script',talk:'none'},seed:88,sheet:copy(old.sheet)});
assert.equal(E.structureReport(unchanged),null,'old career match stays legacy');
// Real UI selections and signing are exercised in tests/browser-smoke.cjs.
// This suite checks the actual gate, engine execution and performed reports.
console.log('PASS Phase 4 career integration: '+simulated+' variants, both leads, two plans, booked finishes, opt-in, legacy default, performed reports, '+earned+' witnessed objectives.');
