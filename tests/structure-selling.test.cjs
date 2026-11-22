'use strict';
// 9B: real focused damage persists through comebacks for both wrestlers.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');assert.ok(cut>0);
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,Math,Date,JSON,console});
const {OfficeData:D,OfficeMatch:E,OfficeSheets:S,OfficeRoom:R}=root,G=E.GRAPH;
const clone=x=>JSON.parse(JSON.stringify(x));
const w=D.TALENT.find(x=>x.style==='Spectacle'),f=D.FOES.find(x=>x.style==='Technical'),p=D.PROMOS[0];
assert.ok(w&&f,'real Spectacle and Technical fixtures required');
function make(id,game='technical',active=true){
 const c={id:'9b-'+id+'-'+game,wid:w.id,rid:f.id,pid:p.id,slot:'main',finish:'win_clean',
  minutes:12,eventAbs:65,feudHeat:20};
 const st=R.begin(c,w,f,p,{structure:{id,lead:'w'},structurePlanning:true});
 st.queue=[];R.act(st,'plan_'+game);R.act(st,'board_ok');
 assert.equal(st.stage,'review');R.act(st,'review_ok');R.act(st,'talk_none');
 assert.equal(st.stage,'done');
 return E.create({w:{...w,fatigue:0,flags:{}},f,p,slot:'main',minutes:12,finish:'win_clean',
  seed:90519,feudHeat:20,plan:{game,leash:'script',talk:'none'},
  preparation:{},flags:{},sheet:clone(st.sheet),structureExecution:active});
}
function damage(M,attacker){
 M.stage='live';M.t=Math.floor(M.len*.3);
 M.story.position='mat';M.story.down=attacker==='w'?'f':'w';M.story.control=attacker;
 M.graph.arc='control';
 const victim=attacker==='w'?'f':'w';
 for(let i=0;i<2;i++){
  assert.equal(G.isValid(M,'target_hold'),true,'focused damage needs legal performed grounded holds');
  G.apply(M,'target_hold');
 }
 assert.ok(M.graph.damage[victim]>=3);
 assert.equal(M.graph.events.filter(e=>e.id==='target_hold'&&e.victim===victim).length,2);
 return victim;
}
for(const structure of S.STRUCTURES.catalogue().map(x=>x.id)){
 const M=make(structure);
 assert.equal(G.sellingReport(M),null);
 assert.equal(damage(M,'f'),'w');
 assert.equal(M.graph.selling.w.part,'left knee');
 const original=M.graph.damage.w,extra=G.sellingStrain(M,'clothesline','w');
 assert.ok(extra>0&&extra<.5);
 assert.ok(G.sellingWeight(M,'clothesline','w')<1);
 assert.equal(G.sellingStrain(M,'wristlock','w'),0,'light unrelated offence unaffected');
 M.t=Math.floor(M.len*.68);M.story.position='standing';M.story.down=null;
 M.story.control='w';M.graph.arc='comeback';G.resetPhysical(M);
 assert.ok(G.isValid(M,'clothesline'));
 G.apply(M,'clothesline');
 assert.equal(M.graph.events.at(-1).sellingStrain.extraCost,extra);
 assert.equal(M.graph.damage.w,original,'comeback never heals focused damage');
 assert.equal(G.sellingReport(M).wrestlers.w.comebackLines,1);
 assert.ok(M.log.some(x=>x.textureId==='selling-w-0'&&x.text.includes('left knee')));
 const restored=E.restore(clone({...M,rState:M.r.getState()}));
 assert.equal(JSON.stringify(G.sellingReport(restored)),JSON.stringify(G.sellingReport(M)));
 assert.equal(G.sellingStrain(restored,'clothesline','w'),G.sellingStrain(M,'clothesline','w'));
 M.t+=10;M.story.position='standing';M.story.down=null;M.story.control='w';G.resetPhysical(M);
 assert.ok(G.isValid(M,'catch_breath'));
 G.apply(M,'catch_breath');
 assert.equal(G.sellingReport(M).wrestlers.w.realBreathers,1);
 assert.equal(M.graph.damage.w,original);
 const relief=G.sellingStrain(M,'clothesline','w');
 assert.ok(relief>0&&relief<extra,'real rest briefly halves added strain');
 M.t+=100;assert.equal(G.sellingStrain(M,'clothesline','w'),extra);
 const other=make(structure);assert.equal(damage(other,'w'),'f');
 assert.ok(G.sellingReport(other).wrestlers.f);
 assert.ok(G.sellingStrain(other,'clothesline','f')>0);
 assert.equal(G.sellingStrain(other,'clothesline','w'),0);
}
const control=make('classic_american','technical',false);
damage(control,'f');assert.equal(G.sellingReport(control),null);
assert.equal(G.sellingStrain(control,'clothesline','w'),0);
const safe=make('dominant_ace','safe');
damage(safe,'f');
assert.equal(G.sellingStrain(safe,'wristlock','w'),0);
assert.ok(G.sellingWeight(safe,'clothesline','w')>0);
console.log('PASS Phase 9B bilateral selling, real focused work, comeback, recovery, controls and save.');
