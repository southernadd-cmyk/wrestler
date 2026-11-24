#!/usr/bin/env node
'use strict';
// Snapshot real match-graph behaviour for comparison before/after a graph change.
// Usage: node tools/graph-baseline.cjs --count 100 --rotation roster > baseline.json
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const lab = require('./graph-lab/core.js');
const args = process.argv.slice(2);
function value(flag, fallback) {
  const at = args.indexOf(flag);
  return at >= 0 ? args[at + 1] : fallback;
}
function integer(flag, defaultValue, max) {
  const number = Number(value(flag, defaultValue));
  if (!Number.isSafeInteger(number) || number < 1 || number > max) throw Error(flag + ' must be an integer from 1 to ' + max);
  return number;
}
try {
  const count = integer('--count', 100, 1000);
  const seed = integer('--seed', 5101, 2147483647);
  const config = {
    wid: value('--wid', 'juno'), rid: value('--rid', 'rex'),
    plan: value('--plan', 'technical'), finish: value('--finish', 'win_clean'),
    slot: value('--slot', 'mid'), rotation: value('--rotation', 'roster'),
    seed, count
  };
  if (!['fixed', 'roster'].includes(config.rotation)) throw Error('--rotation must be fixed or roster');
  const root = {};
  const names = ['data.js', 'roster-registry.js', 'technique-registry.js', 'technique-backgrounds.js', 'match-catalog.js','graph-narration.js','match-graph.js','match-commentary.js','match-engine.js'];
  for (const name of names) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', name), 'utf8'),
      { window: root, console, Date, Math, JSON }, { filename: name });
  }
  root.OfficeRosterV4.enableProfiles();
  const D = root.OfficeData, G = root.OfficeMatch.GRAPH;
  const all = lab.roster(D);
  const snapshot = lab.empty(G, config);
  const aerial={attempts:0,landed:0,counter:0,block:0,aborted:0,interrupted:0,
    unresolved:0,mismatched:0,byMove:{}};
  for (let i = 0; i < count; i++) {
    const options = { ...config, seed: seed + i * 37 };
    if (config.rotation === 'roster') {
      options.wid = all[i % all.length].id;
      options.rid = all[(i * 7 + 19) % all.length].id;
      if (options.rid === options.wid) options.rid = all[(i + 1) % all.length].id;
    }
    const match = lab.runMatch(root, lab.makeOptions(D, options));
    lab.add(snapshot, match, G);
    const allAttempts=match.graph?.aerialAttempts||[];
    if(match.graph?.pendingAerial)aerial.unresolved++;
    const indexed=new Map((match.graph?.events||[])
      .filter(e=>e.aerialAttemptSeq!==undefined).map(e=>[e.aerialAttemptSeq,e]));
    for(const attempted of allAttempts){
      aerial.attempts++;
      const outcome=attempted.outcome||'unresolved';
      if(!Object.hasOwn(aerial,outcome))aerial.mismatched++;
      else aerial[outcome]++;
      const counts=(aerial.byMove[attempted.id]??={attempts:0,landed:0,counter:0,block:0,aborted:0,interrupted:0});
      counts.attempts++;
      if(Object.hasOwn(counts,outcome))counts[outcome]++;
      const action=indexed.get(attempted.seq);
      if(['counter','landed','block'].includes(outcome)){
        const expect=outcome==='counter'?attempted.id+'_rev':
          outcome==='block'?attempted.id+'_blk':attempted.id;
        if(!action||action.id!==expect||action.attemptedMove!==attempted.id||
          action.aerialResolution!==outcome||attempted.actionId!==expect)
          aerial.mismatched++;
      }else if(action)aerial.mismatched++;
    }
  }
  if(aerial.unresolved||aerial.mismatched)
    throw Error('Aerial attempt integrity failure: '+JSON.stringify(aerial));
  const report = lab.report(snapshot, G, { full: args.includes('--full') });
  report.aerialAttemptStats={...aerial,byMove:Object.entries(aerial.byMove)
    .sort((a,b)=>b[1].attempts-a[1].attempts||a[0].localeCompare(b[0]))
    .map(([id,counts])=>({id,...counts}))};
  if (Array.isArray(G.TECHNIQUE_PILOT)) {
    // Counts only consecutive real match events matching authored graph links,
    // not generic arc jumps or theoretical legal options.
    report.pilotTransitions = G.TECHNIQUE_PILOT.map(({from,to,kind}) => ({
      from, to, kind, hits: snapshot.edgeHits[from + '>' + to] || 0
    }));
  }
  if (Array.isArray(G.TECHNIQUE_EXPANSION)) {
    report.phase5Transitions = G.TECHNIQUE_EXPANSION.map(({from,to,kind}) => ({
      from, to, kind, hits: snapshot.edgeHits[from + '>' + to] || 0
    }));
  }
  if (Array.isArray(G.TECHNIQUE_TRANCHE2)) {
    report.phase5bTransitions = G.TECHNIQUE_TRANCHE2.map(({from,to,kind}) => ({
      from, to, kind, hits: snapshot.edgeHits[from + '>' + to] || 0
    }));
  }
  if(Array.isArray(G.TECHNIQUE_DEPTH)){
    // Actual consecutive event pairs, not implied graph-pool usage.
    report.phase8Transitions=G.TECHNIQUE_DEPTH.map(({from,to,kind})=>({
      from,to,kind,hits:snapshot.edgeHits[from+'>'+to]||0
    }));
  }
  if(Array.isArray(G.TECHNIQUE_CHAINS)){
    report.phase9Transitions=G.TECHNIQUE_CHAINS.map(({from,to,group})=>({
      from,to,group,hits:snapshot.edgeHits[from+'>'+to]||0
    }));
    report.phase9GroupHits=Object.entries(report.phase9Transitions.reduce((a,x)=>{
      const g=a[x.group]??={links:0,hits:0,observed:0};
      g.links++;g.hits+=x.hits;if(x.hits)g.observed++;
      return a;
    },{})).map(([group,data])=>({group,...data}));
  }
  // Move-specific generated reversals now resolve a committed named aerial
  // attempt. Count actual reversal nodes without double-counting attempts.
  if (root.OfficeTechniqueRegistry) {
    report.aerialCounterReviews = root.OfficeTechniqueRegistry.list()
      .filter(row => /^(?:ar_|sb_)/.test(row.id) && row.counterIds.length)
      .flatMap(row => row.counterIds.map(id => ({
        move: row.id, counter: id, hits: snapshot.nodeHits[id] || 0
      })));
  }
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
} catch (error) {
  process.stderr.write('Graph baseline failed: ' + error.message + '\n');
  process.exitCode = 1;
}
