'use strict';
const {EXPECTED,PHASE9_BASE,NEW_MOVES}=require('./_phase10-inventory.cjs');
// Phase 1 audit guard. The candidate crosswalk must describe the *existing* engine,
// never invent catalogue IDs or silently omit a technique after future graph changes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const window={};
for(const name of ['data.js','roster-registry.js','match-graph.js','match-commentary.js','match-engine.js']){
  const src=fs.readFileSync(path.join(root,'assets','js',name),'utf8');
  vm.runInNewContext(src,{window,console,Date,Math,JSON},{filename:name});
}
const G=window.OfficeMatch.GRAPH;
const file=path.join(root,'docs','phase1-technique-candidates.csv');
const content=fs.readFileSync(file,'utf8').trimEnd().split(/\r?\n/);
function columns(line){
  const cells=[];
  let value='',quoted=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'){
      if(quoted&&line[i+1]==='"'){value+='"';i++;}
      else quoted=!quoted;
    }else if(ch===','&&!quoted){cells.push(value);value='';}
    else value+=ch;
  }
  assert.equal(quoted,false,'unclosed quote in CSV');
  cells.push(value);
  return cells;
}
const header=columns(content.shift());
assert.equal(header.join(','),'move_id,move_name,office_family,proposed_mechanical_class,review_status,source_line,editorial_note');
const rows=content.filter(Boolean).map(line=>Object.fromEntries(header.map((key,i)=>[key,columns(line)[i]])));
const families=G.CATALOG.F;
const totalMoves=Object.values(families).reduce((n,f)=>n+f.moves.length,0);
assert.equal(totalMoves,EXPECTED.moves,'Phase 10 live catalogue adds exactly four named moves to Phase 1');
assert.equal(Object.keys(families).length,20,'all original families still present');
assert.equal(rows.length,PHASE9_BASE.moves,'original 336-row inventory remains frozen');
const valid=new Set(['Submission','Strike','Throw','Takedown','Clinch','Position','Escape & Reversal','Defence','Weapon','Wrestling-only','Unresolved']);
const visited=new Set(),counts={};
for(const row of rows){
  assert.ok(row.move_id,'empty move ID');
  assert.ok(!visited.has(row.move_id),'duplicate move ID in audit: '+row.move_id);
  visited.add(row.move_id);
  assert.ok(valid.has(row.proposed_mechanical_class),'nonexistent class: '+row.proposed_mechanical_class);
  assert.ok(row.review_status&&row.editorial_note,'explicit caveats required: '+row.move_id);
  const real=G.A[row.move_id];
  assert.ok(real,'candidate move absent from engine: '+row.move_id);
  assert.equal(real.family,row.office_family,'family drift: '+row.move_id);
  assert.equal(real.name,row.move_name,'name drift: '+row.move_id);
  assert.equal(Boolean(real.counterOf||real.blockOf),false,'candidate must be an authored move: '+row.move_id);
  assert.ok(families[row.office_family].moves.some(x=>x[0]===row.move_id),'candidate is not among the source-family moves');
  counts[row.proposed_mechanical_class]=(counts[row.proposed_mechanical_class]||0)+1;
}
const added=[];
for(const f of Object.values(families))for(const move of f.moves)
 if(!visited.has(move[0]))added.push(move[0]);
assert.deepEqual(added.sort(),[...NEW_MOVES].sort(),'only four reviewed Phase 10 additions fall outside the frozen crosswalk');
assert.equal(G.CATALOG.counts.reversals,EXPECTED.reversals);
assert.equal(G.CATALOG.counts.blocks,EXPECTED.blocks);
const displayNames=rows.map(r=>r.move_name.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim());
const duplicates=displayNames.filter((x,i)=>displayNames.indexOf(x)!==i);
console.log('PASS frozen Phase 1 taxonomy inventory: '+rows.length+' audited moves, '+added.length+' Phase 10 additions, '+Object.keys(families).length+
 ' families, '+G.CATALOG.counts.reversals+' generated reversals, '+G.CATALOG.counts.blocks+' blocks; all IDs/names/families match live engine.');
console.log('Phase 1 provisional class counts: '+JSON.stringify(counts)+'; exact display-name duplicates: '+duplicates.length);
