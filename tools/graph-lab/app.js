/* Graph Lab UI. The only source of bouts and graph facts is OfficeMatch. */
(function () {
  'use strict';
  const D = window.OfficeData;
  const M = window.OfficeMatch;
  const lab = window.OfficeGraphLab;
  const validator = window.OfficeGraphValidation;
  const $ = id => document.getElementById(id);
  const G = M?.GRAPH;
  let info, people, selectedId, lastReport = null, savedReport = null, frozenSuite = null;
  let running = false, stopped = false;
  const fmt = n => Number(n).toLocaleString('en-GB');
  const make = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  const set = (id, text) => { $(id).textContent = text; };
  const workspaces = ['run', 'tape', 'atlas', 'compare'];

  function activateWorkspace(name, focus = false) {
    const selected = workspaces.includes(name) ? name : 'run';
    for (const id of workspaces) {
      const tab = $('tab-' + id);
      tab.setAttribute('aria-selected', String(id === selected));
      tab.tabIndex = id === selected ? 0 : -1;
      $('workspace-' + id).hidden = id !== selected;
      if (id === selected && focus) tab.focus();
    }
    return selected;
  }

  function setupWorkspaces() {
    for (const [index, id] of workspaces.entries()) {
      const tab = $('tab-' + id);
      tab.addEventListener('click', () => {
        activateWorkspace(id);
        if (window.location.hash !== '#' + id) window.location.hash = id;
      });
      tab.addEventListener('keydown', event => {
        const next = event.key === 'ArrowRight' ? (index + 1) % workspaces.length
          : event.key === 'ArrowLeft' ? (index + workspaces.length - 1) % workspaces.length
          : event.key === 'Home' ? 0 : event.key === 'End' ? workspaces.length - 1 : null;
        if (next === null) return;
        event.preventDefault();
        const destination = workspaces[next];
        activateWorkspace(destination, true);
        window.location.hash = destination;
      });
    }
    window.addEventListener('hashchange', () => activateWorkspace(window.location.hash.slice(1)));
    activateWorkspace(window.location.hash.slice(1));
  }

  function updateSchoolReadout() {
    const schools = window.OfficeTechniqueBackgrounds;
    if (!schools) { set('schoolReadout', 'No technique-school data loaded.'); return; }
    const worker = people.find(x => x.id === $('worker').value);
    const opponent = people.find(x => x.id === $('opponent').value);
    const label = person => person ? person.short + ': ' + schools.get(person).label : '—';
    set('schoolReadout', label(worker) + '  /  ' + label(opponent) + ' · Style and training school are independent.');
  }

  function fillRoster() {
    people = lab.roster(D);
    for (const id of ['worker', 'opponent']) {
      const sel = $(id);
      for (const person of people) {
        const option = document.createElement('option');
        option.value = person.id;
        option.textContent = person.name + ' · ' + person.style;
        sel.append(option);
      }
    }
    $('worker').value = people.some(p => p.id === 'juno') ? 'juno' : people[0].id;
    $('opponent').value = people.some(p => p.id === 'rex') ? 'rex' : people[1].id;
    updateSchoolReadout();
    $('worker').addEventListener('change', updateSchoolReadout);
    $('opponent').addEventListener('change', updateSchoolReadout);
  }

  function listHits(id, items, labeler) {
    const parent = $(id);
    parent.replaceChildren();
    if (!items?.length) { parent.append(make('li', 'No occurrences in this sample.', 'quiet')); return; }
    const maximum = Math.max(1, ...items.map(x => x.hits));
    for (const x of items.slice(0, 9)) {
      const row = make('li');
      row.style.setProperty('--share', Math.max(0, x.hits / maximum * 100).toFixed(1) + '%');
      const label = make('span', labeler(x.id));
      label.title = x.id;
      row.append(label, make('em', fmt(x.hits)));
      parent.append(row);
    }
  }

  function renderValidation(result) {
    if (!result) return;
    set('validationState', result.pass ? 'PASS' : 'ISSUES');
    $('validationState').dataset.result = result.pass ? 'pass' : 'issues';
    set('validationErrors', fmt(result.hardErrors));
    set('validationUnique', fmt(result.distinctMatchSequences) + ' / ' + fmt(result.bouts));
    set('validationPairs', fmt(result.observedLinkedPairs));
    const findings = $('validationFindings');
    findings.replaceChildren();
    if (!result.hardErrors) findings.append(make('p', 'No mechanical invariant violations detected in this sample.'));
    for (const item of result.examples.slice(0, 8)) findings.append(make('p',
      item.code + ' / seed ' + item.seed + (item.time === null ? '' : ' / ' + item.time + 's') +
      ' / ' + (item.id || item.detail)));
    for (const note of result.review) findings.append(make('p', 'REVIEW: ' + note));
    const styles = $('validationStyles');
    styles.replaceChildren();
    for (const [title, table] of [['PERFORMANCE STYLES',result.byStyle],['TECHNICAL BACKGROUNDS',result.byTraining]]) {
      styles.append(make('h5', title));
      const entries = Object.entries(table);
      if (!entries.length) styles.append(make('p', 'No data for this sample.'));
      for (const [name, entry] of entries) styles.append(make('p',
        name + ' · ' + entry.actions + ' actions · ' +
        entry.topFamilies.map(x => x.family + ' ' + x.count).join(' / ')));
    }
  }

  function updateResults(report) {
    lastReport = report;
    set('completed', fmt(report.bouts));
    set('nodeCoverage', report.nodeCoverage.toFixed(1) + '%');
    set('edgeCoverage', report.edgeCoverage.toFixed(1) + '%');
    set('avgStars', report.avgStars.toFixed(2));
    set('counterSummary', 'Counters ' + fmt(report.counters) + ' · Blocks ' + fmt(report.blocks));
    set('unseenSummary', 'Unseen actions ' + fmt(report.unseenNodes.length));
    listHits('families', report.families, name => name.replace(/_/g, ' '));
    listHits('topActions', report.topNodes, name => G.A[name]?.name || name.replace(/_/g, ' '));
    listHits('sequences', report.topSequences, name => name.split(' > ').map(id => G.A[id]?.name || id).join(' → '));
    listHits('finishRoutes', report.finishRoutes, name => name.replace(/_/g, ' '));
    if(report.grappling){
      const x=report.grappling;
      set('grappleOverview',x.coveredMoves+'/'+x.eligibleMoves+' moves observed · '+
        fmt(x.attempts)+' attempts · '+fmt(x.landed)+' landed · '+
        fmt(x.counter)+' counters · '+fmt(x.block)+' blocks · '+
        fmt(x.aborted+x.interrupted)+' aborted/interrupted · '+fmt(x.invalid)+' integrity errors');
      const list=$('grappleMoves');list.replaceChildren();
      const rows=x.byMove.filter(row=>G.GRAPPLE_PILOT.includes(row.id));
      if(!rows.length)list.append(make('li','No named grapples observed yet. Run more matches or vary the pairing.'));
      for(const row of rows){const li=make('li');
        li.append(make('span',(G.A[row.id]?.name||row.id)+' · '+row.attempts+' attempts'),
          make('em',row.landed+' landed / '+row.counter+' counter / '+row.block+' blocked'));
        list.append(li);
      }
      set('grappleUnseen',x.unobservedMoves.length?
        'NOT SEEN: '+x.unobservedMoves.map(id=>G.A[id]?.name||id).join(', '):
        'All named grapples observed at least once.');
    }
    $('export').disabled = false;
    renderComparison();
    if (report.validation) renderValidation(report.validation);
    if(report.phase9){
      set('phase9Coverage',
        'NEW EDGES: '+report.phase9.newLinksObserved+'/'+report.phase9.newlyIntroducedLinks+
        ' observed · '+report.phase9.matchesWithNew+'/'+report.bouts+
        ' matches ('+report.phase9.matchesWithNewPct.toFixed(1)+'%) · '+
        report.phase9.sameControllerOccurrences+' same-wrestler transitions · '+
        report.phase9.threeMoveNewChains+' three-action chains · '+
        (report.scriptedSpotEvents||0)+' narrated special spots outside the named graph');
    }
    if (report.phase9Groups?.length) {
      const styles = $('validationStyles');
      styles.append(make('h5', 'PHASE 9 / OBSERVED CURATED CHAINS'));
      for (const item of report.phase9Groups) styles.append(make('p',
        item.group + ' · '+item.newObserved+'/'+item.newLinks+' genuinely new links seen ('+item.newHits+' occurrences) · '+item.hits+' all authored pair occurrences'));
    }
  }

  function filterTrace() {
    const filter = $('traceFilter').value;
    for (const row of $('trace').querySelectorAll('.traceRow')) row.hidden = filter !== 'all' && row.dataset.kind !== filter;
  }

  function showTrace(match) {
    const trace = lab.trace(match, G);
    const container = $('trace');
    container.replaceChildren();
    set('traceMeta', match.w.name + ' vs ' + match.f.name + ' / seed ' + match.o.seed);
    $('traceFilter').value = 'all';
    if (!trace.length) { container.append(make('p', 'No graph events recorded.', 'quiet')); return; }
    for (const item of trace) {
      const row = make('div', null, 'traceRow');
      row.dataset.kind = item.kind;
      row.dataset.seconds = String(item.seconds);
      const minute = Math.floor(item.seconds / 60);
      const sec = String(item.seconds % 60).padStart(2, '0');
      const type = make('span', item.kind, 'kind ' + item.kind.toLowerCase());
      row.append(make('span', minute + ':' + sec, 'time'), make('span', item.label), make('span', item.id, 'technical'), type);
      row.title = 'Story arc: ' + item.arc + ' · Control: ' + item.side + ' · Event ID: ' + item.id;
      container.append(row);
    }

    // Tape activity is the observed event density, not an illustrated or predicted graph.
    const bins = Array.from({ length: 24 }, () => ({ events: 0, counters: 0, blocks: 0, first: null }));
    const duration = Math.max(1, match.len || trace.at(-1).seconds);
    trace.forEach((item, i) => {
      const index = Math.min(bins.length - 1, Math.floor(item.seconds / duration * bins.length));
      const bin = bins[index];
      bin.events++;
      if (item.kind === 'Counter') bin.counters++;
      if (item.kind === 'Block') bin.blocks++;
      if (bin.first === null) bin.first = i;
    });
    const max = Math.max(1, ...bins.map(b => b.events));
    const chart = $('tapeViz');
    chart.replaceChildren();
    bins.forEach((bin, index) => {
      const start = Math.floor(index / bins.length * duration);
      const end = Math.floor((index + 1) / bins.length * duration);
      const bar = make('button', null, 'timebar');
      bar.type = 'button';
      bar.disabled = bin.events === 0;
      bar.style.setProperty('--height', (bin.events / max * 100).toFixed(1) + '%');
      bar.style.setProperty('--counter-height', (bin.counters / max * 100).toFixed(1) + '%');
      bar.style.setProperty('--block-height', (bin.blocks / max * 100).toFixed(1) + '%');
      bar.setAttribute('aria-label', start + '–' + end + ' seconds: ' + bin.events + ' events, ' + bin.counters + ' counters, ' + bin.blocks + ' blocks');
      bar.title = bar.getAttribute('aria-label') + ' (select to locate first event)';
      bar.append(make('span', null, 'activity'), make('span', null, 'counter-activity'), make('span', null, 'block-activity'));
      bar.addEventListener('click', () => {
        if (bin.first === null) return;
        $('traceFilter').value = 'all';
        filterTrace();
        activateWorkspace('tape');
        const row = container.querySelectorAll('.traceRow')[bin.first];
        if (!row) return;
        container.querySelectorAll('.traceRow.located').forEach(n => n.classList.remove('located'));
        row.classList.add('located');
        row.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      });
      chart.append(bar);
    });
  }

  function drawLocal(id) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const container = $('diagram');
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 750 240');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Actual incoming and outgoing authored links for ' + id);
    const incoming = info.incoming[id].slice(0, 5);
    const outgoing = G.A[id].next.slice().sort((a, b) => b[1] - a[1]).slice(0, 5);
    const add = (tag, attrs = {}, text) => {
      const n = document.createElementNS(svgNS, tag);
      Object.entries(attrs).forEach(([key, value]) => n.setAttribute(key, value));
      if (text !== undefined) n.textContent = text;
      svg.append(n);
      return n;
    };
    const display = (nodeId, limit = 20) => {
      const text = G.A[nodeId]?.name || nodeId;
      return text.length > limit ? text.slice(0, limit - 1) + '…' : text;
    };
    const centreY = 120;
    incoming.forEach((x, i) => {
      const y = 24 + i * 46;
      add('line', { x1: 195, y1: y, x2: 303, y2: centreY, stroke: '#879cb7', 'stroke-width': 1.5, opacity: .7 });
      add('rect', { x: 4, y: y - 16, width: 192, height: 32, rx: 3, fill: '#304960', stroke: '#627a97' });
      add('text', { x: 100, y: y + 4, fill: '#eff5ff', 'font-size': 12, 'text-anchor': 'middle' }, display(x.id));
    });
    outgoing.forEach(([nodeId], i) => {
      const y = 24 + i * 46;
      add('line', { x1: 446, y1: centreY, x2: 553, y2: y, stroke: '#d5af62', 'stroke-width': 1.5, opacity: .8 });
      add('rect', { x: 553, y: y - 16, width: 192, height: 32, rx: 3, fill: '#3c3d39', stroke: '#9d884d' });
      add('text', { x: 649, y: y + 4, fill: '#fff4df', 'font-size': 12, 'text-anchor': 'middle' }, display(nodeId));
    });
    add('rect', { x: 301, y: 97, width: 146, height: 46, rx: 4, fill: '#d6b564' });
    add('text', { x: 374, y: 116, fill: '#172131', 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle' }, display(id, 17));
    add('text', { x: 374, y: 133, fill: '#172131', 'font-size': 10, 'text-anchor': 'middle' }, 'SELECTED');
    if (info.incoming[id].length > incoming.length) add('text', { x: 95, y: 234, fill: '#afbdd0', 'font-size': 11, 'text-anchor': 'middle' }, '+' + (info.incoming[id].length - incoming.length) + ' more incoming');
    if (G.A[id].next.length > outgoing.length) add('text', { x: 647, y: 234, fill: '#afbdd0', 'font-size': 11, 'text-anchor': 'middle' }, '+' + (G.A[id].next.length - outgoing.length) + ' more outgoing');
    container.replaceChildren(svg);
  }

  function edgeButtons(target, links, outbound) {
    const parent = $(target);
    parent.replaceChildren();
    if (!links.length) { parent.append(make('p', 'None in this graph.', 'quiet')); return; }
    for (const link of links) {
      const id = outbound ? link[0] : link.id;
      const weight = outbound ? link[1] : link.weight;
      const button = make('button', (G.A[id]?.name || id) + ' · weight ' + weight);
      button.type = 'button';
      button.title = id;
      button.addEventListener('click', () => selectNode(id));
      parent.append(button);
    }
  }

  function showTechniqueProposal(id) {
    const container = $('techniqueDetails');
    if (!container) return;
    container.replaceChildren(make('span', 'MECHANICS LAYER / PROPOSED', 'block-ref'));
    const liveLinks = [...(G.TECHNIQUE_PILOT || []),...(G.TECHNIQUE_EXPANSION || []),...(G.TECHNIQUE_TRANCHE2 || []),...(G.TECHNIQUE_DEPTH || []),...(G.TECHNIQUE_CHAINS || [])].filter(link => link.from === id || link.to === id);
    if (liveLinks.length) {
      const active = make('div', null, 'mechanics-live');
      active.append(make('h4', 'LIVE TECHNIQUES / PHASES 3 + 5 + 5b + 8 + 9'));
      for (const link of liveLinks) {
        const row = make('button', link.from + ' → ' + link.to + ' · weight ' + link.weight);
        row.type = 'button';
        row.title = link.reason + ' — inspect the other node';
        row.addEventListener('click', () => selectNode(link.from === id ? link.to : link.from));
        active.append(row, make('p', link.reason));
      }
      container.append(active);
    }
    const registry = window.OfficeTechniqueRegistry;
    const record = registry?.get(id);
    if (!record) {
      container.append(make('p', 'No manually curated mechanic for this node. The engine graph above remains authoritative.', 'technique-unmapped'));
      return;
    }
    const badges = make('div', null, 'mechanics-tags');
    for (const label of [record.mechanicalClass, ...record.traditionTags.map(tag => tag.toUpperCase())]) badges.append(make('span', label));
    const headline = make('strong', record.mechanic.replace(/-/g, ' '), 'mechanics-headline');
    const states = make('p', record.entry.position + ' / ' + record.entry.control +
      ' → ' + record.exit.position + ' / ' + record.exit.control +
      ' · target ' + (record.target || 'not specified'), 'mechanics-states');
    container.append(badges, headline, states, make('p', record.editorialNote, 'mechanics-review'));
    if (record.variantOf) container.append(make('p', 'Possible variant of: ' + (G.A[record.variantOf]?.name || record.variantOf), 'mechanics-variant'));

    const relations = make('div', null, 'mechanics-relations');
    for (const [title, entries] of [['Possible setups', record.setupIds], ['Move-specific counters', record.counterIds]]) {
      const area = make('div');
      area.append(make('h4', title));
      if (!entries.length) {
        area.append(make('p', 'None proposed', 'technique-unmapped'));
      } else {
        for (const reference of entries) {
          const action = make('button', G.A[reference]?.name || reference);
          action.type = 'button';
          action.title = 'Inspect ' + reference + ' in the live graph';
          action.addEventListener('click', () => selectNode(reference));
          area.append(action);
        }
      }
      relations.append(area);
    }
    container.append(relations, make('p', 'The candidate setup/counter lists remain editorial. Only links explicitly marked LIVE above are executable. Training affinities are not active wrestler abilities.', 'mechanics-disclaimer'));
  }

  function selectNode(id) {
    if (!G.A[id]) return;
    selectedId = id;
    const n = G.A[id];
    set('selection', id);
    const meta = $('nodeDetails');
    meta.replaceChildren(make('strong', n.name || id), make('div', 'ID ' + id + ' · Family ' + (n.family || 'core') + ' · Entry ' + n.requires + ' → ' + n.zone + ' · Min. match fraction ' + n.after));
    meta.append(make('div', 'Risk ' + (n.risk ? 'high' : 'ordinary') + ' · Cost ' + (n.cost ?? 'default') + ' · ' + (n.counterOf ? 'Counters ' + n.counterOf : n.blockOf ? 'Blocks ' + n.blockOf : 'Standard action')));
    edgeButtons('incoming', info.incoming[id], false);
    edgeButtons('outgoing', n.next, true);
    drawLocal(id);
    showTechniqueProposal(id);
    for (const b of $('nodeList').querySelectorAll('button')) {
      b.classList.toggle('active', b.dataset.id === id);
      b.setAttribute('aria-pressed', String(b.dataset.id === id));
    }
  }

  function renderSearch() {
    const q = $('search').value.trim().toLowerCase();
    const list = $('nodeList');
    list.replaceChildren();
    const matches = info.nodes.filter(id => {
      const n = G.A[id];
      return !q || id.toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q) || (n.family || '').toLowerCase().includes(q);
    });
    set('found', fmt(matches.length) + ' matching nodes · showing first ' + Math.min(100, matches.length));
    for (const id of matches.slice(0, 100)) {
      const n = G.A[id];
      const b = make('button', n.name || id);
      b.type = 'button';
      b.dataset.id = id;
      b.setAttribute('aria-pressed', String(id === selectedId));
      b.classList.toggle('active', id === selectedId);
      b.append(make('span', id + ' / ' + (n.family || 'core')));
      b.addEventListener('click', () => selectNode(id));
      list.append(b);
    }
  }

  function exportJSON() {
    if (!lastReport) return;
    const blob = new Blob([JSON.stringify(lastReport, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'office-graph-baseline-' + lastReport.config.seed + '-' + lastReport.bouts + '.json';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function renderComparison() {
    const parent = $('comparison');
    parent.replaceChildren();
    if (!savedReport || !lastReport) {
      parent.append(make('p', 'Run a sample and load a previously exported baseline to compare.'));
      return;
    }
    const table = make('table');
    const header = make('tr');
    for (const label of ['Metric', 'Baseline', 'Current', 'Δ']) header.append(make('th', label));
    const thead = make('thead'); thead.append(header); table.append(thead);
    const tbody = make('tbody');
    for (const diff of lab.compare(savedReport, lastReport)) {
      const row = make('tr');
      row.append(make('td', diff.key), make('td', String(diff.before)), make('td', String(diff.after)));
      row.append(make('td', (diff.delta > 0 ? '+' : '') + diff.delta, diff.delta > 0 ? 'plus' : diff.delta < 0 ? 'minus' : ''));
      tbody.append(row);
    }
    table.append(tbody);
    parent.append(table);
    if (savedReport.config?.plan !== lastReport.config?.plan ||
        savedReport.config?.wid !== lastReport.config?.wid ||
        savedReport.config?.rid !== lastReport.config?.rid ||
        savedReport.config?.seed !== lastReport.config?.seed ||
        savedReport.bouts !== lastReport.bouts) {
      parent.append(make('p', 'Caution: the scenarios differ. Treat the comparison as descriptive only.', 'small quiet'));
    }
  }

  async function loadFrozenReference() {
    const trigger = $('loadReference');
    trigger.disabled = true;
    set('referenceStatus', 'Loading the fixed-seed baseline from this site…');
    try {
      const response = await fetch('baselines/reference-v1.json', { cache: 'no-store' });
      if (!response.ok) throw Error('HTTP ' + response.status);
      const suite = await response.json();
      if (suite.schema !== 'office-graph-baseline-suite-v1' ||
          suite.totalBouts !== 1200 || !Array.isArray(suite.scenarios) || suite.scenarios.length !== 6 ||
          suite.scenarios.some(item => item.report?.schema !== 'office-graph-lab-v1')) {
        throw Error('Stored reference version or contents are incompatible.');
      }
      frozenSuite = suite;
      const picker = $('referenceScenario');
      picker.replaceChildren();
      for (const scenario of suite.scenarios) {
        const option = document.createElement('option');
        option.value = scenario.id;
        option.textContent = scenario.label + ' (' + scenario.report.bouts + ' bouts)';
        picker.append(option);
      }
      picker.disabled = false;
      $('applyReference').disabled = false;
      selectFrozenScenario();
      set('referenceStatus', 'Loaded ' + fmt(suite.totalBouts) + ' verified baseline matches in six reproducible scenarios.');
    } catch (error) {
      frozenSuite = null;
      $('referenceScenario').disabled = true;
      $('applyReference').disabled = true;
      set('referenceStatus', 'Could not load the stored baseline: ' + error.message);
    } finally {
      trigger.disabled = false;
    }
  }

  function selectedFrozenScenario() {
    return frozenSuite?.scenarios.find(s => s.id === $('referenceScenario').value) || null;
  }

  function selectFrozenScenario() {
    const scenario = selectedFrozenScenario();
    if (!scenario) return;
    savedReport = scenario.report;
    set('baselineName', 'Frozen v1: ' + scenario.label + ' / ' + fmt(scenario.report.bouts) + ' bouts');
    renderComparison();
  }

  function applyFrozenScenario() {
    const scenario = selectedFrozenScenario();
    if (!scenario) return;
    const params = scenario.parameters;
    for (const [key, elementId] of [
      ['wid', 'worker'], ['rid', 'opponent'], ['plan', 'plan'], ['finish', 'finish'],
      ['slot', 'slot'], ['rotation', 'rotation'], ['seed', 'seed'], ['count', 'bouts']
    ]) {
      const input = $(elementId);
      const value = String(params[key]);
      if (input.tagName === 'SELECT' && ![...input.options].some(option => option.value === value)) {
        set('referenceStatus', 'This version cannot run the stored ' + key + ' setting: ' + value);
        return;
      }
      input.value = value;
    }
    activateWorkspace('run');
    window.location.hash = 'run';
    updateSchoolReadout();
    set('status', 'Loaded ' + scenario.label + ' / ' + scenario.report.bouts +
      ' bouts / seed ' + params.seed + '. Run Simulation to compare exactly against the frozen baseline.');
  }

  async function loadBaseline(file) {
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw Error('Baseline exceeds 5 MB.');
      const value = JSON.parse(await file.text());
      if (value.schema !== 'office-graph-lab-v1' || !Number.isInteger(value.bouts) ||
          !Number.isFinite(value.nodeCoverage) || !Number.isFinite(value.edgeCoverage)) throw Error('Not a compatible Graph Lab baseline.');
      savedReport = value;
      set('baselineName', file.name + ' (' + fmt(value.bouts) + ' bouts)');
      renderComparison();
    } catch (error) {
      savedReport = null;
      set('baselineName', 'Could not load baseline: ' + error.message);
      renderComparison();
    }
  }

  async function run(event) {
    event.preventDefault();
    if (running) return;
    const count = Number($('bouts').value);
    const seed = Number($('seed').value);
    if (!Number.isSafeInteger(seed) || seed < 1 || seed > 2147483647) {
      set('status', 'Enter a positive integer seed no greater than 2,147,483,647.');
      return;
    }
    if (!Number.isInteger(count) || count < 1 || count > 1000) return;
    if ($('worker').value === $('opponent').value && $('rotation').value === 'fixed') {
      set('status', 'Choose two different wrestlers.');
      return;
    }
    running = true; stopped = false;
    $('run').disabled = true; $('stop').disabled = false; $('export').disabled = true;
    $('progress').value = 0;
    const config = { wid: $('worker').value, rid: $('opponent').value, plan: $('plan').value,
      finish: $('finish').value, slot: $('slot').value, seed, count, rotation: $('rotation').value };
    const snapshot = lab.empty(G, config);
    const evidence = validator.create(G);
    let lastYield = performance.now();
    try {
      for (let i = 0; i < count; i++) {
        if (stopped) break;
        const params = { ...config, seed: seed + i * 37 };
        if (config.rotation === 'roster') {
          const w = people[i % people.length];
          const f = people[(i * 7 + 19) % people.length];
          params.wid = w.id;
          params.rid = f.id === w.id ? people[(i + 1) % people.length].id : f.id;
        }
        const match = lab.runMatch(window, lab.makeOptions(D, params));
        lab.add(snapshot, match, G);
        validator.add(evidence, match, G, window.OfficeTechniqueBackgrounds);
        if (i === 0) showTrace(match);
        if (performance.now() - lastYield > 55 || i + 1 === count) {
          $('progress').value = (i + 1) / count * 100;
          set('status', fmt(i + 1) + ' / ' + fmt(count) + ' completed');
          await new Promise(resolve => setTimeout(resolve, 0));
          lastYield = performance.now();
        }
      }
      if (snapshot.bouts) {
        const report = lab.report(snapshot, G, { full: true });
        report.validation = validator.finish(evidence);
        updateResults(report);
      }
      set('status', (stopped ? 'Stopped — ' : 'Complete — ') + fmt(snapshot.bouts) + ' real engine matches measured. ' +
        fmt(snapshot.timingErrors.length) + ' sampled timing violations.');
    } catch (error) {
      console.error('Graph Lab run failed', error);
      set('status', 'Simulation stopped: ' + error.message);
      if (snapshot.bouts) {
        const report = lab.report(snapshot, G, { full: true });
        report.validation = validator.finish(evidence);
        updateResults(report);
      }
    } finally {
      running = false; $('run').disabled = false; $('stop').disabled = true;
      $('export').disabled = !lastReport;
    }
  }

  function init() {
    try {
      if (!D || !M || !lab || !G || !validator) throw Error('Shipped match-engine or validation scripts did not load.');
      window.OfficeRosterV4?.enableProfiles();
      info = lab.inspect(G, D);
      if (window.OfficeTechniqueRegistry) {
        const check = window.OfficeTechniqueRegistry.validate(G);
        if (!check.valid) console.warn('Phase 2 technique proposals need editorial repair:', check.errors);
      }
      set('totalNodes', fmt(info.stats.nodes));
      set('totalEdges', fmt(info.stats.edges));
      set('totalArcs', fmt(info.stats.arcs));
      const integrityIssues = !!(info.stats.errors.length || info.unreachable.length);
      set('validation', integrityIssues ? 'Issues' : 'Pass');
      $('validation').dataset.result = integrityIssues ? 'issues' : 'pass';
      if (integrityIssues) {
        set('status', info.stats.errors.length + ' graph errors, ' + info.unreachable.length + ' unreachable nodes. Review before interpreting results.');
      }
      fillRoster();
      setupWorkspaces();
      $('experiment').addEventListener('submit', run);
      $('stop').addEventListener('click', () => { stopped = true; set('status', 'Stopping after the current bout…'); });
      $('export').addEventListener('click', exportJSON);
      $('viewTape').addEventListener('click', () => { activateWorkspace('tape'); window.location.hash = 'tape'; });
      $('traceFilter').addEventListener('change', filterTrace);
      $('search').addEventListener('input', renderSearch);
      $('baseline').addEventListener('change', e => loadBaseline(e.target.files?.[0]));
      $('loadReference').addEventListener('click', loadFrozenReference);
      $('referenceScenario').addEventListener('change', selectFrozenScenario);
      $('applyReference').addEventListener('click', applyFrozenScenario);
      renderSearch();
      selectNode(G.A.wristlock ? 'wristlock' : info.nodes[0]);
    } catch (error) {
      console.error('Graph Lab failed to initialise', error);
      set('status', 'Cannot initialise Graph Lab: ' + error.message);
      $('run').disabled = true;
    }
  }

  init();
})();
