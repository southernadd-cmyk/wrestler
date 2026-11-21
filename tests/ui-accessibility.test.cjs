'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const ui=fs.readFileSync(path.join(root,'assets/js/ui.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/css/core.css'),'utf8');
const backstage=fs.readFileSync(path.join(root,'assets/css/backstage.css'),'utf8');
for(const action of ['data-openw','data-self','data-selo','data-go="stables"']){
 assert.ok(ui.includes('class="row-pick" '+action),action+' should have a native keyboard-operable button');
}
assert.ok(css.includes('.grid .row-pick{'),'row button style missing');
assert.match(ui,/focusAttr.*data-selo.*data-self/);
assert.match(ui,/\.focus\(\{preventScroll:true\}\)/);
for(const label of ['Reply to inbox','Start match night','Sign a wrestler','Advance week'])
 assert.ok(ui.includes(label),'primary action label missing: '+label);
for(const marker of ['class="stam" id="sY" role="progressbar"','class="stam" id="sT" role="progressbar"','class="mom" role="meter"','class="gbar" role="progressbar"'])
 assert.ok(ui.includes(marker),'accessible match meter missing: '+marker);
for(const name of ['lCrowdBar','lMom'])assert.ok(ui.includes("$('#"+name+"').parentElement.setAttribute('aria-valuenow'"));
assert.match(html,/<dialog id="modal" aria-labelledby="office-dialog-title">/);
assert.equal((ui.match(/<h2 id="office-dialog-title">/g)||[]).length,3);
assert.ok(!backstage.includes('var(--muted,#777)'));
console.log('PASS Office UI keyboard, status indicators, action labels and modal accessibility');
