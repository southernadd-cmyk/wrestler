'use strict';
// Production engine scripts only, in browser order. Editorial fixtures are explicit.
const fs=require('node:fs'),path=require('node:path');
const engineFiles=["portrait-age-map.js","portraits.js","data.js","roster-registry.js","promo-identity.js","promo-director.js","promo-dialogue.js","promo-semantics.js","promo-bank-manifest.js","promo-bank-loader.js","academy-register.js","academy.js","technique-registry.js","technique-backgrounds.js","match-catalog.js","graph-narration.js","match-graph.js","match-commentary.js","match-engine.js","career.js","territory.js","living-world.js","story.js","memory.js","sheets.js","agents-room.js","promo-duel.js","relationships.js","rivalry.js","ambitions.js","booking-office.js","rival-managers.js","promotion-business.js","programmes.js","approaches.js","after-bell.js","ringside.js","rival-corner.js","disqualify.js","stipulations.js","negotiation-v2.js","signing.js","mouthpiece.js","programme-arcs.js","outcome.js","night-report.js","negotiation-career.js","ringfax.js"];
const allFiles=[...engineFiles,'ui.js'];
const read=name=>fs.readFileSync(path.join(__dirname,'..','assets','js',name),'utf8');
const core=engineFiles.map(read).join('\n');
const script=allFiles.map(read).join('\n');
const editorialFiles=['promo-dialogue-pilot.js','promo-dialogue-bank-c1.js','promo-dialogue-bank-c2.js','promo-dialogue-bank-c3.js','promo-dialogue-bank-c4.js','promo-dialogue-bank-c5.js','promo-dialogue-bank-c6.js'];
const editorialCore=core+'\n'+editorialFiles.map(read).join('\n');
const manifest=JSON.parse(read('promo-bank-manifest.js').match(/Object\.freeze\((\{[^}]*\})\)/)[1]);
const bankCache=new Map();
function promoBanks(...ids){return [...new Set(ids)].filter(id=>Object.prototype.hasOwnProperty.call(manifest,id)).map(id=>{
 if(!bankCache.has(id))bankCache.set(id,JSON.parse(fs.readFileSync(path.join(__dirname,'..','assets','promo-banks',id+'.'+manifest[id]+'.json'),'utf8')));
 return bankCache.get(id);
});}
module.exports={core,editorialCore,script,engineFiles,allFiles,promoBanks};
