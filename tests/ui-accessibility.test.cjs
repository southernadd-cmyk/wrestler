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
// CM-style contextual records: one route for outside wrestlers and promotions.
assert.match(ui,/function recordLink\(kind,id,name\)/);
assert.match(ui,/function renderRecord\(\)/);
assert.match(ui,/record:renderRecord/);
assert.match(ui,/if\(d\.record\)return openRecord\(d\.record\)/);
assert.match(ui,/function recordBack\(\)/);
for(const screen of ["desk dates","inbox","offers","fixtures","pyramid","promoters","rivalries","results"]){
 const token={ "desk dates":"G.W(c.wid)?.short||'Departed'",
  inbox:"senderRecord",offers:"vs-line\">v ${recordLink",
  fixtures:"recordLink('p',p.id,p.name)",pyramid:"recordLink('w',w.id,w.name)",
  promoters:"recordLink('p',p.id,p.name)",rivalries:"recordLink('w',f.rid",
  results:"recordLink('w',x.rid,x.foe)"}[screen];
 assert.ok(ui.includes(token),screen+" must retain a contextual profile link");
}
assert.match(css,/\.record-link\{/);
assert.match(css,/\.record-head\{/);
new Function(ui); // Source parses before any browser navigation runs.
// Phase 2: management controls remain presentation-only and keyboard operable.
for(const field of ['data-scout-query','data-scout-style','data-scout-budget',
 'data-stable-query','data-stable-filter','data-inbox-filter','data-shortlist']){
 assert.ok(ui.includes(field),'missing management filter control: '+field);
}
assert.match(ui,/function scoutingComparison\(free\)/);
assert.match(ui,/function renderScouting\(\)/);
assert.match(ui,/function renderSquad\(\)/);
assert.match(ui,/No messages match this filter/);
assert.match(ui,/function renderDesk\(\)/);
assert.match(ui,/data-clear-shortlist/);
assert.ok(css.includes('.management-filters{'));
assert.ok(css.includes('.desk-brief{'));
assert.ok(css.includes('.office-filter-tabs{'));
// Phase 3 keeps planning, live broadcast and outcome review accessible and read-only.
const matchCss=fs.readFileSync(path.join(root,'assets/css/match-night.css'),'utf8');
for(const token of [
 'function backstageBrief(c,P,v)','class="match-brief"',
 'class="ringside-plan"','function renderPastCommentary()',
 'data-commentary-view="all"','data-commentary-view="key"',
 'if(d.commentaryView)','class="result-brief"',
 'class="result-log"','<h3 class="section-h">Consequences</h3>'
])assert.ok(ui.includes(token),'missing match-night context/overview: '+token);
for(const cls of ['.match-brief{','.ringside-plan{','.commentary-views{','.result-brief{','.result-log>summary{'])
 assert.ok(matchCss.includes(cls),'missing match-night style: '+cls);
assert.match(ui,/commentaryView==='key'\?night\.past\.filter/);
assert.match(ui,/renderPastCommentary\(\);persistNight\(\)/);
assert.match(ui,/const actualFinish=\{booked:/);
assert.match(ui,/win\('What changed'/);
// Booking negotiation V2 Phase 1 preserves native buttons and a labelled transcript.
for(const marker of ['class="neg-transcript well" role="log"','class="neg-aside" aria-label="Booking terms"',
  'class="neg-response"','class="deal neg-contract','data-talkbook="','data-talkaction="'])
 assert.ok(ui.includes(marker),'Missing accessible negotiation UI: '+marker);
assert.match(ui,/o\.talk&&o\.talk\.step!=='start'\?'Resume the discussion'/);
assert.match(ui,/\(!o\.talk\|\|o\.talk\.step==='start'\)&&s\.focus<1/);
assert.ok(css.includes('dialog.negotiation-dialog[open]'));
assert.ok(css.includes('.neg-transcript{'));
// Persistent header identity uses the existing editor, without sidebar/desk duplicates.
assert.match(html,/<header class="top">[\s\S]*?id="headerIdentity"[\s\S]*?<\/header>/);
assert.ok(ui.includes('headerIdentity.innerHTML=identityCard(true)'));
assert.ok(!ui.includes('player-nav-head'));
assert.ok(!ui.includes('const briefing=identityCard()'));
assert.ok(css.includes('#headerIdentity .player-identity-text>b'));
assert.ok(css.includes('overflow-wrap:anywhere'));
const mobile=fs.readFileSync(path.join(root,'assets/css/mobile.css'),'utf8');
assert.ok(mobile.includes('#headerIdentity{grid-row:2;grid-column:1/-1'));
console.log('PASS Office UI keyboard, status indicators, action labels and modal accessibility');

assert.ok(ui.includes("G.officeBrief()"));
assert.ok(ui.includes("confirm-start-night"));
assert.ok(ui.includes("G.offerCandidates(o)"));
