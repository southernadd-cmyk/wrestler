'use strict';
// The 52 newcomers speak in their own voices in Dennis's room and on the microphone.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,Date,Math,JSON,console});
const {OfficeData:D,OfficeRoom:Room,OfficeMic:Mic}=root;
const packs=D.VOICE_PACKS,cast=D.V4.newCast;

// Every newcomer has a complete pack that only uses the placeholders its moment can fill.
const ROOM={pitch:[2,['move'],['move','them']],counter:[1,['move'],['move','them']],big:[1,['move'],['move','them']],
 ego:[1,['them'],['them']],credibility:[1,[],['them']],safety:[1,['them'],['them']],proud:[1,[],[]],accept:[1,[],['them']],
 grumble:[1,[],['them']],pleased:[1,[],['them']],sweet:[1,[],[]],loose:[1,[],['them']]};
const PROMO={quiet:[['W'],['W','F','VENUE']],pop:[['VENUE'],['W','F','VENUE']],bit:[['F'],['W','F','VENUE']],fluff:[['W'],['W','F','VENUE']]};
assert.equal(Object.keys(packs).length,52,'one pack per newcomer');
const all=new Set();let lines=0;
function ok(id,where,line,need,allow){
 assert.equal(typeof line,'string',`${id} ${where}`);
 assert.ok(line.length>0&&line.length<=160,`${id} ${where} length`);
 const tags=[...line.matchAll(/\{([^}]*)\}/g)].map(m=>m[1]);
 for(const t of tags)assert.ok(allow.includes(t),`${id} ${where}: {${t}} not allowed`);
 for(const t of need)assert.ok(tags.includes(t),`${id} ${where}: needs {${t}}`);
 assert.doesNotMatch(line,/['"]/,`${id} ${where}: typographic quotes only`);
 assert.ok(!all.has(line),`${id} ${where}: line used twice`);all.add(line);lines++;
}
for(const w of cast){
 const p=packs[w.id];assert.ok(p,w.id+' has a voice pack');
 for(const [slot,[n,need,allow]] of Object.entries(ROOM)){
  assert.equal(p.room[slot]?.length,n,`${w.id} room.${slot}`);
  p.room[slot].forEach((line,i)=>ok(w.id,`room.${slot}[${i}]`,line,need,allow));
  for(const line of p.room[slot])assert.ok(!Object.values(Room.LINES[slot]).flat().includes(line),'personal, not shared');
 }
 for(const [slot,[need,allow]] of Object.entries(PROMO))ok(w.id,'promo.'+slot,p.promo[slot],need,allow);
 assert.ok(p.promo.quiet.startsWith('{W} ')&&p.promo.fluff.startsWith('{W} '));
 assert.ok(/^“.*”$/.test(p.promo.pop)&&/^“.*”$/.test(p.promo.bit));
}
assert.equal(lines,52*17);

// In play: newcomers mostly use their own lines, and the shared ones still turn up.
const pattern=line=>new RegExp('^'+line.charAt(0).toUpperCase().replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+line.slice(1).replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\{(move|MOVE|them)\\\}/g,'.+?')+'$');
const mine=Object.fromEntries(cast.map(w=>[w.id,Object.values(packs[w.id].room).flat().map(pattern)]));
const shared=Object.values(Room.LINES).flatMap(v=>Object.values(v).flat()).map(pattern);
const finishes=Object.keys(D.FINISHES);
let own=0,common=0,meetings=0;const heard=new Set();
for(const [i,w] of cast.entries())for(let k=0;k<6;k++){
 const f=D.FOES[(i+k*5)%D.FOES.length],p=D.PROMOS[(i+k)%4],slot=['opener','mid','feature','main'][k%4];
 const state=Room.begin({id:`voice-${w.id}-${k}`,wid:w.id,rid:f.id,pid:p.id,finish:finishes[(i+k)%finishes.length],slot,minutes:12,eventAbs:k,feudHeat:k*12},w,f,p);
 for(let guard=0;state.stage!=='done'&&guard<12;guard++){
  const view=Room.view(state);
  const choice=view.stage==='board'?view.options.find(o=>o.id==='board_ok'):view.options[(i+k+guard*7)%view.options.length];
  Room.act(state,choice.id);
 }
 meetings++;
 for(const entry of state.log.filter(e=>e.side==='w')){
  if(mine[w.id].some(re=>re.test(entry.text))){own++;heard.add(w.id);}
  else if(shared.some(re=>re.test(entry.text)))common++;
 }
 assert.doesNotMatch(state.log.map(e=>e.text).join('\n'),/undefined|NaN|\{\w+\}/);
}
assert.ok(heard.size>=48,`most newcomers were heard in their own words (${heard.size}/52)`);
const share=own/(own+common);
assert.ok(share>.5&&share<.9,`personal lines about two times in three (${Math.round(share*100)}%)`);

// The microphone: personal openings and fumbles appear, and nothing is left unfilled.
let promoOwn=0,promoLines=0;
const promoMine=Object.fromEntries(cast.map(w=>[w.id,Object.values(packs[w.id].promo)]));
for(const [i,w] of cast.entries())for(let k=0;k<4;k++){
 const f=D.FOES[(i*3+k)%D.FOES.length],p=D.PROMOS[k];
 const booking={id:`mic-${w.id}-${k}`,wid:w.id,rid:f.id,pid:p.id,finish:finishes[k],slot:'main',minutes:15,eventAbs:k,feudHeat:30};
 const duel=Mic.begin(booking,w,f,null,null,p);
 for(let guard=0;guard<10&&duel.stage!=='done';guard++){const options=Mic.choices(duel);const pushy=options.filter(o=>o.id!=='leave');Mic.choose(duel,(duel.round===2&&pushy.length?pushy:options)[(i+k+guard)%(duel.round===2&&pushy.length?pushy:options).length].id);}
 const text=duel.log.map(e=>e.line).join('\n');
 assert.doesNotMatch(text,/undefined|NaN|\{\w+\}/);
 for(const t of promoMine[w.id]){const re=pattern(t.replace(/\{W\}/g,w.short).replace(/\{F\}/g,f.short).replace(/\{VENUE\}/g,'{them}'));if(duel.log.some(e=>re.test(e.line||'')))promoOwn++;}
 promoLines++;
}
assert.ok(promoOwn>=10,`newcomers use their own microphone lines (${promoOwn} in ${promoLines} promos)`);

console.log(`PASS voices: 52 newcomers × 17 personal lines (${lines}); ${meetings} meetings, ${heard.size}/52 heard in their own words, ${Math.round(share*100)}% personal; ${promoOwn} personal mic lines in ${promoLines} promos`);
