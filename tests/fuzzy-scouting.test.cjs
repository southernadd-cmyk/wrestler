'use strict';
// Fuzzy scouting: free-agent ratings show as ranges that narrow as you watch the wrestler.
// Run: node tests/fuzzy-scouting.test.cjs
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');

const root={addEventListener(){}};
const store=new Map();
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},JSON,console});
const G=root.OfficeGame;

// Band width follows knowledge: 20 at none, 10 at one or two looks, 5 at three or four, exact from five.
const f={ring:73,mic:40,psych:55,safe:61,heat:50,knowledge:0};
assert.deepEqual({...G.scoutBand(f,'ring')},{lo:60,hi:79,exact:false});
f.knowledge=1;assert.deepEqual({...G.scoutBand(f,'ring')},{lo:70,hi:79,exact:false});
f.knowledge=3;assert.deepEqual({...G.scoutBand(f,'ring')},{lo:70,hi:74,exact:false});
f.knowledge=5;assert.deepEqual({...G.scoutBand(f,'ring')},{lo:73,hi:73,exact:true});

// Every band contains the true value, at every knowledge level and edge of the scale.
for(const v of [0,1,19,20,39,40,79,80,98,99])for(const k of [0,1,2,3,4,5]){
 const b=G.scoutBand({ring:v,knowledge:k},'ring');
 assert.ok(b.lo<=v&&v<=b.hi,`band ${b.lo}-${b.hi} must contain ${v} at knowledge ${k}`);
}

// Draw is never fuzzed.
assert.deepEqual({...G.scoutBand(f,'heat')},{lo:50,hi:50,exact:true});

// Watching counts once per week, however often the screen redraws.
G.fresh();G.S.cash=1000000;
const fa=G.S.free[0];
fa.knowledge=0;delete fa.scoutedAt;
G.scoutWatch(fa);G.scoutWatch(fa);
assert.equal(fa.knowledge,1);
G.S.week=G.S.week+1;G.scoutWatch(fa);
assert.equal(fa.knowledge,2);

// Signing gives the wrestler a hidden ceiling; releasing gives full knowledge back.
G.S.roster.length=0;
const id=G.S.free[0].id;const ring=G.S.free[0].ring;
G.sign(id);
const signed=G.S.roster.find(w=>w.id===id);
assert.ok(signed,'signed');
assert.ok(signed.ceiling>=Math.max(signed.ring,signed.mic,signed.psych),'ceiling sits at or above current stats');
assert.ok(signed.ceiling<=95);
G.release(id);
assert.equal(G.S.free.find(w=>w.id===id).knowledge,5);
assert.equal(ring,G.S.free.find(w=>w.id===id).ring);

// Old saves: free agents without knowledge load as unknown.
{
 G.fresh();
 const raw=JSON.parse(JSON.stringify(G.S));
 for(const w of raw.free)delete w.knowledge;
 G.S=raw;
 assert.ok(G.S.free.every(w=>(w.knowledge||0)===0));
}
console.log('fuzzy scouting tests passed');
