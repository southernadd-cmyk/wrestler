'use strict';
/* Graph Lab instrumentation. Read-only: it observes the shipped match engine. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.OfficeGraphLab = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const increment = (map, key, amount = 1) => {
    map[key] = (map[key] || 0) + amount;
  };
  const sum = map => Object.values(map).reduce((a, b) => a + b, 0);
  const top = (map, count = 20) => Object.entries(map).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, count).map(([id, hits]) => ({ id, hits }));
  const pct = (a, b) => b ? Math.round(1000 * a / b) / 10 : 0;

  function inspect(graph, data) {
    const A = graph.A;
    const stats = graph.validate();
    const incoming = Object.fromEntries(Object.keys(A).map(id => [id, []]));
    for (const [source, node] of Object.entries(A)) {
      for (const [target, weight] of node.next) if (incoming[target]) incoming[target].push({ id: source, weight });
    }
    const seeds = [
      ...Object.values(graph.ARCS).flatMap(a => a.entry || []),
      ...Object.values(graph.STYLE_BEATS).flatMap(a => a.open || []),
      ...Object.values(data.PROFILES).flatMap(a => a.preferred || []),
      'catch_breath', 'corner_whip', 'corner_push', 'headlock', 'top_follow'
    ];
    const visited = new Set(seeds.filter(id => A[id]));
    const queue = [...visited];
    for (let i = 0; i < queue.length; i++) {
      for (const [id] of A[queue[i]].next) {
        if (A[id] && !visited.has(id)) { visited.add(id); queue.push(id); }
      }
    }
    return {
      stats, incoming,
      unreachable: Object.keys(A).filter(id => !visited.has(id)),
      nodes: Object.keys(A).sort(),
      families: Object.keys(graph.CATALOG.F).sort()
    };
  }

  function roster(data) {
    const merged = [...(data.ALL || []), ...(data.TALENT || []), ...(data.FOES || [])];
    const byId = new Map(merged.filter(w => w && w.id).map(w => [w.id, w]));
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  function makeOptions(data, input = {}) {
    const people = roster(data);
    const w = people.find(x => x.id === input.wid) || people[0];
    const f = people.find(x => x.id === input.rid && x.id !== w.id) || people.find(x => x.id !== w.id);
    if (!w || !f) throw Error('At least two wrestlers are required.');
    const slot = has(data.SLOTS, input.slot) ? input.slot : 'mid';
    const game = has(data.PLANS, input.plan) ? input.plan : 'story';
    const finish = has(data.FINISHES, input.finish) ? input.finish : 'win_clean';
    const requestedSeed = Number(input.seed);
    const seed = Number.isSafeInteger(requestedSeed) && requestedSeed > 0 ? requestedSeed : 12345;
    const promotion = data.PROMOS.find(p => p.id === input.promotion) || data.PROMOS[0];
    return {
      w: { ...w, fatigue: w.fatigue || 0, flags: { ...(w.flags || {}) } },
      f: { ...f, fatigue: f.fatigue || 0, flags: { ...(f.flags || {}) } },
      p: promotion, slot, minutes: data.SLOTS[slot].mins,
      finish, plan: { game, leash: 'script', talk: 'calm' },
      preparation: {}, flags: {}, feudHeat: 0, seed
    };
  }

  function runMatch(root, options) {
    const engine = root.OfficeMatch;
    const match = engine.create(options);
    for (let steps = 0; steps < 9000 && !match.done; steps++) {
      if (match.decision && !match.queue.length) {
        const available = match.decision.options || [];
        const preferred = available.find(o => ['job', 'home', 'cut', 'protect'].includes(o.id)) || available[0];
        if (!preferred) throw Error('Match presented a decision without options.');
        engine.resolve(match, preferred.id);
      }
      engine.next(match);
    }
    if (!match.done || !match.final) throw Error('Match did not complete after 9,000 steps.');
    return match;
  }

  function empty(graph, config = {}) {
    return {
      schema: 'office-graph-lab-v1', graph: graph.validate(), config: { ...config },
      bouts: 0, totalStars: 0, totalEvents: 0, actionEvents: 0,
      nodeHits: {}, edgeHits: {}, adjacentHits: {}, arcHits: {},
      familyHits: {}, wrestlerHits: {}, counterHits: 0, blockHits: 0,
      finishHits: {}, outcomeHits: {}, unknownEvents: {}, timingErrors: [],
      sampledSequences: {}, longestChain: 0
    };
  }

  function add(snapshot, match, graph) {
    const events = match.graph?.events || [];
    const A = graph.A;
    snapshot.bouts++;
    snapshot.totalStars += Number(match.final?.stars || 0);
    increment(snapshot.finishHits, match.final?.finishRoute || '(none)');
    increment(snapshot.outcomeHits, match.graph?.outcome?.id || match.outcome || '(none)');
    snapshot.totalEvents += events.length;
    let previous = null, chain = 0;
    let ids = [];
    for (const event of events) {
      const node = A[event.id];
      if (!node) {
        if (!event.id.startsWith('outcome_') && !['special_spot', 'special_deferred', 'scheduled_nearfall'].includes(event.id)) {
          increment(snapshot.unknownEvents, event.id);
        }
        previous = null;
        chain = 0;
        continue;
      }
      snapshot.actionEvents++;
      increment(snapshot.nodeHits, event.id);
      increment(snapshot.arcHits, event.arc || '(none)');
      if (node.family) increment(snapshot.familyHits, node.family);
      if (node.counterOf) snapshot.counterHits++;
      if (node.blockOf) snapshot.blockHits++;
      const side = event.preControl === 'f' ? 'f' : 'w';
      increment(snapshot.wrestlerHits, side);
      if (event.t / Math.max(1, match.len) + 1e-8 < node.after) {
        if (snapshot.timingErrors.length < 30) snapshot.timingErrors.push({ id: event.id, time: event.t, minFraction: node.after, seed: match.o.seed });
      }
      if (previous) {
        const key = previous + '>' + event.id;
        increment(snapshot.adjacentHits, key);
        if (A[previous].next.some(edge => edge[0] === event.id)) {
          increment(snapshot.edgeHits, key);
          chain++;
        } else chain = 0;
      } else chain = 0;
      if (chain > snapshot.longestChain) snapshot.longestChain = chain;
      previous = event.id;
      ids.push(event.id);
    }
    // Sampled short sequences expose repetitive combinations without retaining all match logs.
    for (let i = 0; i + 2 < ids.length; i++) {
      increment(snapshot.sampledSequences, ids.slice(i, i + 3).join(' > '));
    }
    return snapshot;
  }

  function report(snapshot, graph, { full = false } = {}) {
    const nodeTotal = Object.keys(graph.A).length;
    const edgeTotal = Object.values(graph.A).reduce((n, a) => n + a.next.length, 0);
    const visited = new Set(Object.keys(snapshot.nodeHits));
    const observedEdges = new Set(Object.keys(snapshot.edgeHits));
    const result = {
      schema: snapshot.schema, graph: snapshot.graph, config: snapshot.config,
      bouts: snapshot.bouts,
      avgStars: snapshot.bouts ? Math.round(snapshot.totalStars / snapshot.bouts * 100) / 100 : 0,
      actionEvents: snapshot.actionEvents, totalEvents: snapshot.totalEvents,
      nodeCoverage: pct(visited.size, nodeTotal),
      edgeCoverage: pct(observedEdges.size, edgeTotal),
      visitedNodes: visited.size, visitedEdges: observedEdges.size,
      unseenNodes: Object.keys(graph.A).filter(id => !visited.has(id)),
      // The engine may enter a node via a story-arc pool. Only consecutive events matching
      // an authored A.next link count as observed authored edges, not all observed pairs.
      edgeMethod: 'consecutive-event pairs that match authored A.next links; arc jumps excluded',
      topNodes: top(snapshot.nodeHits),
      topEdges: top(snapshot.edgeHits),
      topSequences: top(snapshot.sampledSequences, 15),
      families: top(snapshot.familyHits, 30),
      arcs: top(snapshot.arcHits, 30),
      counters: snapshot.counterHits, blocks: snapshot.blockHits,
      finishRoutes: top(snapshot.finishHits, 30), outcomes: top(snapshot.outcomeHits),
      longestLinkedSequence: snapshot.longestChain + 1,
      unknownEvents: top(snapshot.unknownEvents, 30),
      timingErrors: snapshot.timingErrors
    };
    if (Array.isArray(graph.TECHNIQUE_CHAINS)) {
      const byGroup={};
      for (const link of graph.TECHNIQUE_CHAINS) {
        const g=byGroup[link.group]??={group:link.group,authored:0,observed:0,hits:0};
        const hits=snapshot.edgeHits[link.from+'>'+link.to]||0;
        g.authored++;g.hits+=hits;if(hits)g.observed++;
      }
      result.phase9Groups=Object.values(byGroup).sort((a,b)=>b.hits-a.hits||a.group.localeCompare(b.group));
    }
    if (full) {
      result.nodeHits = { ...snapshot.nodeHits };
      result.edgeHits = { ...snapshot.edgeHits };
      result.adjacentHits = { ...snapshot.adjacentHits };
    }
    return result;
  }

  function trace(match, graph) {
    return (match.graph?.events || []).map(event => {
      const n = graph.A[event.id];
      return {
        id: event.id, label: n?.name || event.id.replace(/_/g, ' '),
        family: n?.family || '', arc: event.arc || '',
        kind: n?.counterOf ? 'Counter' : n?.blockOf ? 'Block' : n ? 'Action' : 'Event',
        side: event.preControl || event.control || '',
        seconds: Math.round(event.t || 0)
      };
    });
  }

  function compare(a, b) {
    const keys = ['bouts', 'avgStars', 'actionEvents', 'nodeCoverage', 'edgeCoverage', 'visitedNodes', 'visitedEdges', 'counters', 'blocks'];
    return keys.map(key => ({ key, before: a[key], after: b[key], delta: Number((Number(b[key] || 0) - Number(a[key] || 0)).toFixed(2)) }));
  }

  return { inspect, roster, makeOptions, runMatch, empty, add, report, trace, compare };
});
