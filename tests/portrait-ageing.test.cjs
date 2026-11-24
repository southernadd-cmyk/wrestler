'use strict';
// The real season-end career transition must move portrait cells when a
// character crosses an age band, and the chosen cell must survive a save.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {script}=require('./_source.cjs');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/portrait-ages/manifest.json'),'utf8'));
const root={addEventListener(){}},store=new Map();
const localStorage={
 getItem:key=>store.get(key)||null,
 setItem:(key,value)=>store.set(key,String(value)),
 removeItem:key=>store.delete(key)
};
vm.runInNewContext(script.slice(0,script.indexOf('/* THE OFFICE — interface v3')),{window:root,localStorage,JSON,console});
const {OfficeGame:G,OfficePortraits:P,OfficeData:D,OfficeAgePortraitCells:cells}=root;
assert.equal(Object.keys(cells).length,227);
assert.equal(manifest.records.length,227*3);
for(const record of manifest.records){
 const [sheet,column,row]=cells[record.id];
 const bandOffset={young:0,middle:1,old:2}[record.age];
 assert.equal(record.x,(column+bandOffset)*144,record.file);
 assert.equal(record.y,row*180,record.file);
 assert.equal(record.atlas,`atlases/portrait-atlas-${String(sheet).padStart(2,'0')}.png`);
}
for(let sheet=1;sheet<=10;sheet++){
 const image=fs.readFileSync(path.join(__dirname,`../assets/portrait-ages/atlas-${String(sheet).padStart(2,'0')}.webp`));
 assert.equal(image.subarray(0,4).toString(),'RIFF');
 assert.equal(image.subarray(8,12).toString(),'WEBP');
}
for(const worker of D.ALL)assert.ok(cells[worker.id],`missing three ages for ${worker.name}`);
for(const key of [...D.PROMOS.map(p=>'booker:'+p.id),...['iron','coastal','northern','eastbank','meridian','redwood'].map(id=>'manager:'+id)])
 assert.ok(cells[key],`missing staff portrait ${key}`);

G.fresh();
const s=G.S;
const ownedId=s.free[0].id;
assert.equal(G.sign(ownedId),null);
const owned=G.W(ownedId);
owned.age=29;
const rivalId=s.territory.teams[0].roster[0];
s.worldV4.personnel={[rivalId]:{age:41,retireWarned:false}};
const free=s.free[0];
free.age=29;
const face=id=>P.avatar({key:'wrestler:'+id,name:id});
const beforeOwned=face(ownedId),beforeRival=face(rivalId);
assert.equal(P.ageBand({key:'wrestler:'+ownedId}),'young');
assert.equal(P.ageBand({key:'wrestler:'+rivalId}),'middle');
assert.equal(P.ageBand({key:'wrestler:'+free.id}),'young');
assert.equal(P.ageBand({key:'booker:pulse'}),'young');
assert.equal(P.ageBand({key:'manager:coastal'}),'middle');
const playerBefore=P.playerPortrait(4,'My manager');

s.cash=100000;s.week=16;
G.endWeek();
assert.equal(s.season,2);
assert.equal(owned.age,30);
assert.equal(G.F(rivalId).age,42);
assert.equal(G.F(free.id).age,30);
assert.equal(P.ageBand({key:'wrestler:'+ownedId}),'middle');
assert.equal(P.ageBand({key:'wrestler:'+rivalId}),'old');
assert.equal(P.ageBand({key:'wrestler:'+free.id}),'middle');
assert.notEqual(face(ownedId),beforeOwned,'owned wrestler switched at season end');
assert.notEqual(face(rivalId),beforeRival,'rival wrestler switched at season end');
assert.equal(P.playerPortrait(4,'My manager'),playerBefore,'staff do not skip an age band each season');
assert.equal(P.ageBand({key:'booker:pulse'},{season:4}),'middle');
assert.equal(P.ageBand({key:'booker:pulse'},{season:21}),'old');
assert.equal(P.ageBand({key:'manager:coastal'},{season:11}),'old');
assert.equal(P.ageBand({key:'player-manager-05'},{season:7}),'middle');
assert.equal(P.ageBand({key:'player-manager-05'},{season:24}),'old');
const promoterBefore=P.avatar({key:'booker:pulse',name:'Nina Sato'});
const managerBefore=P.avatar({key:'manager:coastal',name:'Coastal manager'});
s.season=4;
assert.notEqual(P.avatar({key:'booker:pulse',name:'Nina Sato'}),promoterBefore,
 'promoter changes on the correct season');
s.season=7;
assert.notEqual(P.playerPortrait(4,'My manager'),playerBefore,
 'selected player manager changes after enough seasons');
s.season=11;
assert.notEqual(P.avatar({key:'manager:coastal',name:'Coastal manager'}),managerBefore,
 'rival manager ages as the career advances');
s.season=2;

const after=face(ownedId);
G.save();assert.ok(G.load());
assert.equal(face(ownedId),after,'the reloaded career uses the saved age');
assert.equal(P.ageBand({key:'wrestler:'+rivalId}),'old');
const legacy=JSON.parse(JSON.stringify(G.S));
delete legacy.roster.find(w=>w.id===ownedId).age;
G.S=legacy;
assert.equal(G.W(ownedId).age,D.findWrestler(ownedId).age,'legacy age repair remains intact');
console.log('PASS 227 three-age identities, real season transition, staff progression and save reload');
