'use strict';
// Deterministic bank generation for academy rookies. Each rookie's 32 lines are composed from phrase
// sets keyed by their identity fields, so the same rookie always gets the same bank. Generated banks are
// used only when no authored bank exists for that id. Output has the same shape as an editorial pack.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const repo=path.resolve(__dirname,'..'),js=path.join(repo,'assets/js');

// Load the same pure phrase compiler as the browser. The identity module's
// data lookups are lazy, and this isolated root is never used for career state.
const factoryRoot={OfficeData:{}};
vm.runInNewContext(fs.readFileSync(path.join(js,'promo-identity.js'),'utf8'),{window:factoryRoot});
const F=factoryRoot.OfficeRookiePhraseFactory;
const plain=x=>JSON.parse(JSON.stringify(x));
const FRAMES=plain(F.FRAMES),lineFor=F.lineFor,claimFor=F.claimFor;
const phraseCoverage=p=>plain(F.phraseCoverage(p));
const packFor=(id,p,slots)=>plain(F.packFor(id,p,slots));
function slotsFromSource(){
 const src=fs.readFileSync(path.join(js,'promo-dialogue-bank-c2.js'),'utf8');
 const m=src.match(/const slots=(\[.*?\]\]);/s);
 return JSON.parse(m[1]);
}

// Profiles come from the engine itself, so generated banks always follow the identity catalogue.
function loadProfiles(){
 const {core}=require(path.join(repo,'tests/_source.cjs'));
 const root={addEventListener(){}};const store=new Map();
 vm.runInNewContext(core,{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
 const I=root.OfficePromoIdentity;
 return root.OfficeAcademyRegister.map(e=>{const live={...e,style:e.wrestling_style};return {id:e.id,style:e.wrestling_style,profile:I.wrestler(live)};});
}

function packs(){
 const slots=slotsFromSource();
 return loadProfiles().map(({id,profile})=>packFor(id,profile,slots));
}

// Generated packs, excluding any id that already has an authored pack, plus the claim for each opponent-side line.
function generate(authoredOwners=new Set()){
 const slots=slotsFromSource();const out={packs:[],claims:{}};
 for(const {id,profile} of loadProfiles()){
  if(authoredOwners.has(id))continue;
  out.packs.push(packFor(id,profile,slots));
  for(let i=0;i<slots.length;i++){const [,,side]=slots[i];if(side==='f'){const c=claimFor(profile,FRAMES[i]);if(c)out.claims[id+'.g.'+String(i+1).padStart(2,'0')]=c;}}
 }
 return out;
}
module.exports={packs,lineFor,FRAMES,claimFor,generate,loadProfiles,phraseCoverage};
if(require.main===module){
 const ps=packs();
 const sample=process.argv[2];
 if(sample){const p=ps.find(x=>x.owner===sample);console.log(p.lines.map(l=>l.text).join('\n'));}
 else console.log('packs',ps.length,'lines',ps.reduce((n,p)=>n+p.lines.length,0));
}
