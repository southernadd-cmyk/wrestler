'use strict';
// v0.3.10: six new promo angles that appear when they suit the night, and a daft entrance idea
// for every wrestler, plus four shared ones for each voice type.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:Room,OfficeMic:Mic}=root,Graph=root.OfficeStory.Graph;
const clean=/undefined|NaN|\{\w+\}|\[object/;

// ---- Promo angles -------------------------------------------------------------------------
const NEW={open:['hometown','numbers'],answer:['confession','fakeout'],close:['legacy','grateful']};
for(const [stage,ids] of Object.entries(NEW))for(const id of ids){
 const node=Graph.NODES[stage][id];assert.ok(node&&node.label&&node.hint&&node.lines.length>=2&&typeof node.when==='function',stage+'.'+id);
 assert.equal(Graph.VARIANTS[stage][id].length,8,stage+'.'+id+' has eight variants');
}
assert.equal(JSON.stringify(Graph.size()),JSON.stringify({angles:21,variants:183}));
const wrestlers=D.ALL,promos=D.PROMOS;
let scenes=0;const offered={},played={},venues=new Set();
for(let i=0;i<600;i++){
 const w=wrestlers[i%wrestlers.length],f=wrestlers[(i*7+3)%wrestlers.length];if(w.id===f.id)continue;
 const c={id:'pr-'+i,wid:w.id,rid:f.id,pid:promos[i%4].id,eventAbs:i,feudHeat:(i%5)*15,finish:['win_clean','lose_clean','lose_protected','win_dirty'][i%4]};
 const st=Graph.begin(c,w,f,i%3===0?{heat:c.feudHeat,matches:2,closed:false}:null);
 for(const stage of ['open','answer','close']){
  const shown=Graph.choices(stage,st).map(o=>o.id);
  assert.ok(['people','proof','imagery','accusation','swagger','turn','personal','callback','calm','challenge','vow','finisher','clean','uncertainty','question'].filter(id=>Graph.NODES[stage][id]).every(id=>shown.includes(id)),'the core five are always there');
  for(const id of shown)offered[id]=(offered[id]||0)+1;
  // Prefer a new angle when one is offered, so every one gets played.
  const pick=shown.filter(id=>NEW[stage].includes(id))[i%2]||shown[i%shown.length];
  Graph.choose(st,pick);played[pick]=(played[pick]||0)+1;
 }
 const r=Graph.result(st);assert.ok(r&&r.tactic&&r.promise);
 const text=r.dialogue.map(e=>e.line).join('\n');assert.doesNotMatch(text,clean);
 if(r.path[0].id==='hometown'||r.path[2].id==='grateful')for(const p of promos)if(text.includes(p.venue))venues.add(p.venue);
 if(['legacy','grateful'].includes(r.path[2].id))assert.equal(r.promise.type,'none','the new closes promise nothing the match must check');
 scenes++;
}
for(const ids of Object.values(NEW))for(const id of ids){
 assert.ok(offered[id]>20&&offered[id]<scenes*.9,id+' is contextual: offered '+offered[id]+' of '+scenes);
 assert.ok(played[id]>5,id+' gets played');
}
assert.ok(venues.size>=3,'the town is named in the speech');
// The duel scores the new openings against the night and has an answer for each.
for(const id of ['hometown','numbers'])assert.ok(Number.isFinite(Mic.openFit({read:{room:'hot',feud:true,opp:'fair',voice:'gruff'},practice:{}},id)));
for(const angle of ['personal','mock','facts','crowd'])for(const id of ['confession','fakeout'])assert.ok(Number.isFinite(Mic.answerFit({angle,read:{feud:false}},id)));

// ---- Daft entrance ideas ------------------------------------------------------------------
assert.equal(Object.keys(Room.DAFT_OWN).length,80,'one idea per wrestler');
for(const w of D.ALL)assert.ok(Room.DAFT_OWN[w.id],w.id+' has an idea of their own');
const voices=Object.keys(Room.DAFT);
for(const v of voices)assert.equal(Room.DAFT_MORE[v]?.length,3,v+' has three more shared ideas');
const all=[...Object.values(Room.DAFT),...Object.values(Room.DAFT_OWN),...Object.values(Room.DAFT_MORE).flat()];
const seen=new Set();
for(const r of all){
 assert.ok(r.pitch&&r.yes.startsWith('{W} ')&&r.no.startsWith('{W} '));
 for(const t of [r.pitch,r.yes,r.no]){
  assert.ok(!seen.has(t),'no line is used twice: '+t);seen.add(t);
  assert.doesNotMatch(t.replace(/\{W\}/g,''),/[{}'"]/);
  if(!Object.values(Room.DAFT).includes(r))assert.doesNotMatch(t,/\b(he|she|him|her|his|hers)\b/i,'new ideas never assume anyone’s pronouns');
 }
}
// In the meeting: the person with their hand up asks for their own thing most of the time.
let own=0,shared=0;const meetings=new Set();
for(const [i,w] of D.ALL.entries())for(let k=0;k<3;k++){
 const f=D.ALL[(i+11+k)%80],p=D.PROMOS[k];if(f.id===w.id)continue;
 const st=Room.begin({id:`daft-${w.id}-${k}`,wid:w.id,rid:f.id,pid:p.id,finish:'win_clean',slot:'mid',minutes:12,eventAbs:k,feudHeat:0},w,f,p);
 st.queue=['daft'];
 for(let g=0;st.stage!=='done'&&g<12;g++){const v=Room.view(st);Room.act(st,v.stage==='board'?'board_ok':st.stage==='scene'?'yes':v.options[0].id);}
 const X=st.daftSide==='w'?w:f;
 if(st.daft===Room.DAFT_OWN[X.id])own++;else{shared++;assert.ok([Room.DAFT[Room.VOICE[X.id]],...Room.DAFT_MORE[Room.VOICE[X.id]]].includes(st.daft),'a shared idea from their own voice type');}
 assert.ok(st.log.some(e=>e.text===st.daft.pitch),'the idea is pitched');
 assert.ok(st.entrance.some(e=>e.includes(X.short)),'and played out on the way to the ring');
 assert.doesNotMatch(st.log.map(e=>e.text).concat(st.entrance).join('\n'),clean);
 meetings.add(X.id);
}
const share=own/(own+shared);
assert.ok(share>.55&&share<.8,'their own idea about two times in three ('+Math.round(share*100)+'%)');

console.log(`PASS promos and requests v0.3.10: 6 contextual angles (${Graph.size().angles} angles, ${Graph.size().variants} variants) offered and played in ${scenes} promos, town named in ${venues.size} venues; ${Object.keys(Room.DAFT_OWN).length} personal entrance ideas and ${voices.length*4} shared, ${Math.round(share*100)}% personal in ${own+shared} meetings`);
