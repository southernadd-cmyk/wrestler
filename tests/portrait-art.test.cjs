'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {core}=require('./_source.cjs');
const seen=[];
const doc={createElement(tag){assert.equal(tag,'canvas');return {width:0,height:0,getContext(){return {setTransform(){},fillRect(...r){seen.push(r);},set fillStyle(v){this.color=v;},set imageSmoothingEnabled(v){} };}}}};
const root={addEventListener(){}};
vm.runInNewContext(core,{window:root,document:doc,localStorage:{getItem(){return null},setItem(){},removeItem(){}},Date,Math,JSON,console});
const P=root.OfficePortraits,D=root.OfficeData;
const ids=D.V4.newCast.map(w=>w.id);
assert.equal(ids.length,52);
assert.equal(Object.keys(P.curatedLooks).length,52);
for(const id of ids){
 assert.ok(P.curatedLooks[id], 'missing art '+id);
 for(const [key,value] of Object.entries(P.curatedLooks[id]))assert.ok(P.items[key]?.includes(value),id+': invalid '+key+'='+value);
 const look=P.generated('wrestler:'+id);
 for(const [key,value] of Object.entries(P.curatedLooks[id]))assert.equal(look[key],value,id+': '+key);
 seen.length=0;
 const canvas=P.renderCanvas({key:'wrestler:'+id,name:id});
 assert.equal(canvas.width,48);assert.equal(canvas.height,60);
 assert.ok(seen.length>20,'pixel detail missing '+id);
 assert.equal(seen.some(r=>r[0]===0&&r[1]===0&&r[2]===48&&r[3]===60),false,'opaque background '+id);
}
for(const id of ['mara','rex','lyra','brick']){
 seen.length=0;
 P.renderCanvas({key:'wrestler:'+id,name:id});
 assert.equal(seen.some(r=>r[0]===0&&r[1]===0&&r[2]===48&&r[3]===60),false,'opaque original '+id);
}
assert.equal(P.curatedLooks.winnie.accessory,'glasses');
assert.equal(P.curatedLooks.nikita.hair,'mohawk');
assert.equal(P.curatedLooks.leandro.headwear,'mask');
assert.equal(P.curatedLooks.faye.scars,'brow');
const poster=fs.readFileSync(path.join(__dirname,'..','docs','readme','living-roster-v4.svg'),'utf8');
assert.match(poster,/80 WRESTLERS/);
for(const w of D.ALL)assert.ok(poster.includes(w.name.replace(/&/g,'&amp;')),'missing poster '+w.name);
console.log('PASS portraits: 52 cast-specific identities, 4 transparent redraws, README roster art');
