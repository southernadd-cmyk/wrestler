'use strict';
// The headless regression suites execute the exact scripts shipped to the browser, in order.
const fs=require('node:fs'),path=require('node:path');
const engineFiles=["portraits.js","data.js","roster-registry.js","technique-registry.js","technique-backgrounds.js","match-engine.js","career.js","territory.js","living-world.js","story.js","memory.js","sheets.js","agents-room.js","promo-duel.js","relationships.js","rivalry.js","ambitions.js","booking-office.js","rival-managers.js","promotion-business.js","programmes.js","approaches.js","after-bell.js","ringside.js","disqualify.js","stipulations.js","negotiation-v2.js","signing.js","mouthpiece.js","programme-arcs.js","outcome.js","night-report.js"];
const allFiles=[...engineFiles,'ui.js'];
const read=name=>fs.readFileSync(path.join(__dirname,'..','assets','js',name),'utf8');
const core=engineFiles.map(read).join('\n');
const script=allFiles.map(read).join('\n');
module.exports={core,script,engineFiles,allFiles};
