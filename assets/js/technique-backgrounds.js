'use strict';
/*
 * The Office, Phase 4 — fictional wrestler training-background pilot.
 *
 * A ring PERFORMANCE style (Technical / Brawl / Story / Spectacle) describes
 * presentation, while a technical BACKGROUND describes an independently
 * assigned wrestling school. It is not the career's existing weekly training
 * session, does not change stored wrestler objects, and conveys no ownership
 * or historical attribution of any third-party technique.
 *
 * Only curated LIVE Phase 3 and 5 links are eligible for small bonuses.
 * All other authored moves retain their original selection weights.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.OfficeTechniqueBackgrounds=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 const VERSION=2, MAX_BONUS=.28;
 const SCHOOLS=Object.freeze({
  general:Object.freeze({id:'general',label:'General ringcraft',affinity:Object.freeze({catch:0,judo:0,lucha:0})}),
  catch:Object.freeze({id:'catch',label:'Catch wrestling',affinity:Object.freeze({catch:1,judo:0,lucha:0})}),
  judo:Object.freeze({id:'judo',label:'Judo',affinity:Object.freeze({catch:0,judo:1,lucha:0})}),
  lucha:Object.freeze({id:'lucha',label:'Lucha libre',affinity:Object.freeze({catch:0,judo:0,lucha:1})}),
  boxing:Object.freeze({id:'boxing',label:'Boxing',affinity:Object.freeze({boxing:1})}),
  strength:Object.freeze({id:'strength',label:'Strength athletics',affinity:Object.freeze({strength:1})}),
  acrobatics:Object.freeze({id:'acrobatics',label:'Acrobatic training (provisional)',affinity:Object.freeze({acrobatics:1})}),
  'lucha-acrobatics':Object.freeze({id:'lucha-acrobatics',label:'Lucha and acrobatics (provisional)',affinity:Object.freeze({lucha:.8,acrobatics:.65})}),
  'catch-judo':Object.freeze({id:'catch-judo',label:'Catch and judo',affinity:Object.freeze({catch:.8,judo:.65,lucha:0})}),
  'catch-lucha':Object.freeze({id:'catch-lucha',label:'Catch and lucha',affinity:Object.freeze({catch:.8,judo:0,lucha:.65})})
 });
 // Editorial assignments to original characters, not extrapolated from ring
 // style, nationality, gender, weight, or the career's weekly training state.
 // Unlisted wrestlers remain general and receive NO new bias. Kit retains his existing lucha identity, with a PROVISIONAL acrobatics affinity suggested by the gymnast-like description, not a claim of a documented gymnastics career.
 const ASSIGNMENTS=Object.freeze({
  juno:'catch',dee:'catch',cal:'catch',imani:'catch',ezra:'catch',
  silas:'catch',nova:'catch',
  bao:'judo',ivo:'catch-judo',eira:'judo',vera:'judo',kezia:'judo',
  theo:'catch',winnie:'catch',gideon:'catch',ellis:'catch',
  emmett:'catch',iris:'catch',cleo:'catch',noelle:'catch',jun:'catch',
  marisol:'catch-lucha',cass:'catch-lucha',
  nico:'lucha',lyra:'lucha',kit:'lucha-acrobatics',night:'lucha',ace:'lucha',
  tori:'lucha',rina:'lucha',kofi:'lucha',leandro:'lucha',
  nadia:'lucha',liya:'lucha',zara:'lucha',jett:'lucha',
  anya:'lucha',sasha:'lucha',
  tomasash:'boxing',val:'strength'
 });
 const idOf=w=>typeof w==='string'?w:w?.id;
 function get(w){return SCHOOLS[ASSIGNMENTS[idOf(w)]||'general'];}
 function multiplier(w,moveId,graph,registry){
  if(!graph||!registry||!moveId||!Array.isArray(graph.TECHNIQUE_PILOT))return 1;
  // Only curated, executable Phase 3 + 5 transition destinations qualify.
  // A descriptive Phase 2/5 catalogue entry alone never receives a bonus.
  if(![...graph.TECHNIQUE_PILOT,...(graph.TECHNIQUE_EXPANSION||[])].some(link=>link.to===moveId))return 1;
  const node=graph.A?.[moveId];
  const meta=registry.get(node?.counterOf||moveId);
  if(!meta||!Array.isArray(meta.traditionTags))return 1;
  const profile=get(w),aptitude=Math.max(0,...meta.traditionTags.map(tag=>profile.affinity[tag]||0));
  return Math.round((1+MAX_BONUS*aptitude)*1000)/1000;
 }
 function validate(data,graph,registry){
  const errors=[],ids=new Set((data?.ALL||[]).map(w=>w.id));
  for(const [id,key] of Object.entries(ASSIGNMENTS)){
   if(!ids.has(id))errors.push('Unknown wrestler '+id);
   if(!Object.prototype.hasOwnProperty.call(SCHOOLS,key))errors.push('Unknown school '+id+': '+key);
  }
  if(!registry?.validate?.(graph)?.valid)errors.push('Technique registry is not valid for this graph');
  for(const link of [...(graph?.TECHNIQUE_PILOT||[]),...(graph?.TECHNIQUE_EXPANSION||[])]){
   if(!graph?.A?.[link.to])errors.push('Unknown live move '+link.to);
   const meta=registry?.get?.(graph?.A?.[link.to]?.counterOf||link.to);
   if(meta&&meta.traditionTags.some(tag=>!registry.TRADITIONS.includes(tag)))
    errors.push('Unsupported training affinity '+link.to);
  }
  return {valid:errors.length===0,errors,assigned:Object.keys(ASSIGNMENTS).length,unassigned:Math.max(0,ids.size-Object.keys(ASSIGNMENTS).length)};
 }
 return Object.freeze({VERSION,MAX_BONUS,SCHOOLS,ASSIGNMENTS,get,multiplier,validate});
});
