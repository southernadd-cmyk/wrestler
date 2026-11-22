'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');assert.ok(cut>0);
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,console,Math,Date,JSON});
const {OfficeData:D,OfficeMatch:E,OfficeRoom:R,OfficeSheets:S}=root,G=E.GRAPH;
const copy=x=>JSON.parse(JSON.stringify(x));
const w=D.TALENT.find(x=>x.style==='Technical'),f=D.FOES.find(x=>x.style==='Spectacle')||D.FOES[0],p=D.PROMOS[0];
function make(structure,game,active){
 const c={id:'p9a-'+structure+'-'+game,wid:w.id,rid:f.id,pid:p.id,slot:'main',
 finish:'win_clean',minutes:12,eventAbs:60,feudHeat:22};
 const st=R.begin(c,w,f,p,{structure:{id:structure,lead:'w'},structurePlanning:true});
 st.queue=[];R.act(st,'plan_'+game);R.act(st,'board_ok');
 assert.equal(st.stage,'review');R.act(st,'review_ok');R.act(st,'talk_none');
 assert.equal(st.stage,'done');
 return E.create({w:{...w,fatigue:4,flags:{}},f,p,slot:'main',
  minutes:12,finish:'win_clean',feudHeat:22,seed:92491,
  plan:{game,leash:'script',talk:'none'},preparation:{},flags:{},
  sheet:copy(st.sheet),structureExecution:active});
}
function attempt(M,id,roll,frac){
 M.stage='live';M.t=Math.floor(M.len*frac);M.wSt=M.fSt=100;
 M.story.control='w';M.story.position=G.A[id].requires;
 M.story.down=M.story.position==='mat'?'f':null;
 M.graph.arc='exchange';M.graph.node=null;
 M.graph.physical={v:1,locations:{w:'ring',f:'ring'},area:'ring',topSide:null,
  grip:{type:G.PHYSICAL_GRIP_MOVES[id],side:'w',at:M.t,source:'front_facelock'}};
 assert.equal(G.isValid(M,id),true,'original physical validity');
 assert.equal(G.startGrapple(M,id),true);
 const seq=M.graph.pendingGrapple.seq;M.r=()=>roll;M.t+=10;
 assert.equal(G.resolveGrapple(M),true);
 return M.graph.grappleAttempts.find(x=>x.seq===seq);
}
const id='sx_vertical';
for(const structure of S.STRUCTURES.catalogue().map(x=>x.id)){
 const M=make(structure,'technical',true);
 assert.equal(G.motifSummary(M),null);
 assert.equal(G.isValid(M,id+'_rev'),false,'no detached counter');
 const first=attempt(M,id,0,.26);assert.equal(first.outcome,'counter');
 const motif=G.motifSummary(M);assert.equal(motif.action,id);
 assert.equal(motif.owner,'w');assert.equal(motif.status,'open');
 assert.equal(motif.defendedAttempts,1);
 assert.ok(M.graph.events.some(x=>x.grappleAttemptSeq===first.seq&&
   x.attemptedMove===id&&x.grappleResolution==='counter'));
 assert.equal(G.motifOffers(M,'f').length,0);
 assert.equal(G.motifOffers(M,'w').length,0,'no immediate repeat');
 M.t=Math.floor(M.len*.55);M.story.control='w';M.story.position='standing';
 M.graph.physical.grip=null;
 assert.ok(G.motifOffers(M,'w').some(([name])=>name==='front_facelock'));
 M.graph.physical.grip={type:'front-facelock',side:'w',at:M.t,source:'front_facelock'};
 assert.ok(G.motifOffers(M,'w').some(([name])=>name===id));
 const restored=E.restore(copy({...M,rState:92491}));
 assert.equal(JSON.stringify(G.motifSummary(restored)),JSON.stringify(G.motifSummary(M)));
 const payoff=attempt(M,id,.999,.64);
 assert.equal(payoff.outcome,'landed');
 assert.equal(G.motifSummary(M).status,'paid');
 assert.equal(G.motifSummary(M).paidAt,payoff.resolvedT);
 assert.equal(G.motifOffers(M,'w').length,0);
 assert.ok(M.log.some(x=>x.textureId==='match-motif-payoff'));
 assert.equal(G.motifSummary(restored).status,'open');
 const c=make(structure,'technical',false);attempt(c,id,0,.26);
 assert.equal(G.motifSummary(c),null);
 assert.equal(G.motifOffers(c,'w').length,0);
}
const safe=make('classic_american','safe',true);
attempt(safe,id,0,.26);
assert.equal(G.motifSummary(safe),null,'costly move never becomes Safe motif');
const legacy=E.create({w,f,p,slot:'main',minutes:12,finish:'win_clean',
 plan:{game:'technical',leash:'script',talk:'none'},seed:19,preparation:{},flags:{}});
attempt(legacy,id,0,.26);assert.equal(G.motifSummary(legacy),null);
console.log('PASS Phase 9A: genuine defended attempts and payoffs, four structures, Safe, control, restore.');
