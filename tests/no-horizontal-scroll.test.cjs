'use strict';
// No horizontal scrolling. CSS multi-column layout on a box with a fixed height spills extra columns sideways,
// which put a horizontal scrollbar on the booking sheets once the board filled up. The scrolling panels
// (.wbody, .scene, .decide2) must never carry a multi-column rule; columns belong on an inner wrapper with its
// natural height. The browser sweep that found the bug is described in the PR; this keeps the rule in place.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'..','assets','css');
const css=fs.readdirSync(dir).filter(f=>f.endsWith('.css')).map(f=>[f,fs.readFileSync(path.join(dir,f),'utf8').replace(/\/\*[\s\S]*?\*\//g,'')]);
const SCROLLERS=/(^|[\s>])(\.wbody|\.scene|\.decide2)(\[[^\]]*\])?(:[\w-]+(\([^)]*\))?)*$/;
let rules=0,multi=0;
for(const [file,text] of css){
 // Flatten @media blocks: every "selector{declarations}" pair, innermost first.
 for(const m of text.matchAll(/([^{}@;]+)\{([^{}]*)\}/g)){
  rules++;
  const decl=m[2];
  if(!/(^|[;\s])(columns|column-count)\s*:/.test(decl))continue;
  multi++;
  for(const sel of m[1].split(',').map(s=>s.trim()).filter(Boolean))
   assert.doesNotMatch(sel,SCROLLERS,`${file}: multi-column on a scrolling panel spills sideways: ${sel}`);
 }
}
assert.ok(rules>500,'read the stylesheets: '+rules+' rules');
const ui=fs.readFileSync(path.join(__dirname,'..','assets','js','ui.js'),'utf8');
assert.match(ui,/<div class="sheet-columns">/,'the booking sheets keep their columns on an inner wrapper');
assert.ok(css.some(([,t])=>/\.sheet-columns\{columns:/.test(t)));
console.log('PASS no multi-column rule sits on a scrolling panel ('+multi+' multi-column rule'+(multi===1?'':'s')+' across '+rules+' rules)');
