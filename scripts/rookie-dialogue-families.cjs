'use strict';
// R1/R2: offline family catalogue and exact reuse inventory. Not a runtime selector.
const gen=require('./build-rookie-banks.cjs');
const {build}=require('./build-promo-banks.cjs');
const normalize=s=>s.normalize('NFKC').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().toLowerCase();
const FAMILIES=Object.freeze({
 Technical:Object.freeze({'Ask one tactical question':'technical-question','Test the rival with one precise question':'technical-test','Ask for the sequence before the first move':'technical-sequence'}),
 Brawl:Object.freeze({'Ask for a direct sporting test':'brawl-test','Challenge the rival to meet force with control':'brawl-control','Ask for a clean finish with no shortcuts':'brawl-clean'}),
 Story:Object.freeze({'Find a reason the crowd should care':'story-stakes','Ask the rival what they want from the match':'story-question','Give the crowd one moment to remember':'story-moment'}),
 Spectacle:Object.freeze({'Build anticipation of a credible athletic moment':'spectacle-anticipation','Promise a memorable moment built with care':'spectacle-control','Ask for the crowd to lean in before the big move':'spectacle-crowd'})
});
function familyFor(style,profile){
 const family=FAMILIES[style]?.[profile.tactic];
 if(!family)throw Error('Unclassified rookie tactic: '+style+' / '+profile.tactic);
 return family;
}
function report(built=build()){
 const groups=new Map(Object.values(FAMILIES).flatMap(Object.values).map(id=>[id,{id,members:[],generatedLines:0,uniqueSlotLines:0,duplicates:0}]));
 const packById=new Map(built.packs.map(p=>[p.owner,p]));
 const generated=new Set(gen.generate(new Set(built.packs.filter(p=>!p.lines.every(l=>l.id.startsWith(p.owner+'.g.'))).map(p=>p.owner))).packs.map(p=>p.owner));
 const inventory=new Map([...groups.keys()].map(k=>[k,new Map()]));
 const missing=new Map();
 const profiles=gen.loadProfiles();
 for(const {id,style,profile} of profiles){
  const family=familyFor(style,profile),group=groups.get(family),pack=packById.get(id);
  if(!pack)throw Error('Missing named academy bank: '+id);
  const own=!generated.has(id);
  group.members.push({id,delivery:profile.delivery,motivation:profile.motivation,vulnerability:profile.vulnerability,trigger:profile.trigger,underPressure:profile.underPressure,authored:own});
  if(own)continue; // do not cross-pool individually authored dialogue
  for(const [field,count] of Object.entries(gen.phraseCoverage(profile)))if(!count){
   const key=field+'|'+profile[field];if(!missing.has(key))missing.set(key,[]);missing.get(key).push(id);
  }
  for(const l of pack.lines){
   group.generatedLines++;
   const slot=Number(l.id.split('.').pop())-1;
   const claim=l.side==='f'?gen.claimFor(profile,gen.FRAMES[slot]):null;
   // Exact reuse inventory only: conditions and claim are part of identity.
   // Matching text is not permission to transplant personal history or motives.
   const key=JSON.stringify([l.stage,l.action,l.side,l.category,l.when,claim,normalize(l.text)]);
   const rows=inventory.get(family);
   if(!rows.has(key))rows.set(key,{stage:l.stage,action:l.action,side:l.side,category:l.category,when:l.when,claim,text:l.text,sourceIds:[]});
   rows.get(key).sourceIds.push(l.id);
  }
 }
 for(const group of groups.values()){
  group.uniqueSlotLines=inventory.get(group.id).size;
  group.duplicates=group.generatedLines-group.uniqueSlotLines;
 }
 return {namedRookies:profiles.length,authoredRookies:profiles.length-generated.size,generatedRookies:generated.size,
  families:[...groups.values()],missingPhraseKeys:[...missing].map(([key,ids])=>({key,ids})),
  inventory:[...inventory].map(([family,rows])=>({family,rows:[...rows.values()]}))};
}
if(require.main===module){
 const r=report();
 if(process.argv.includes('--json'))console.log(JSON.stringify(r,null,2));
 else {const {inventory,families,missingPhraseKeys,...totals}=r;
 console.log(JSON.stringify({...totals,families:families.map(({members,...f})=>({...f,members:members.length})),missingPhraseKeys:missingPhraseKeys.map(({key,ids})=>({key,count:ids.length}))},null,2));}
}
module.exports={FAMILIES,familyFor,report};
