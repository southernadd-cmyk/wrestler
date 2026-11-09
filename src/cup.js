import './cup.css';
import { cardArt, typeIcon } from './card-art.js';
import { COLOURS, DEFAULT_WRESTLER, readCareer } from './career.js';
import {
  BASIC_BRACE, BRACE, CARDS, EDGE, GEAR, RIVALS, SPIRIT_CAP, STAMINA, TRAINING,
  cardAt, chooseCamp, chooseDraft, draftOptions, intentFor, newRun, planStatus, resolveExchange,
} from './cards.js';
import { createCupArena } from './cup-arena.js';
import { createSound } from './sound.js';

const SAVE_KEY = 'dohyo-spirit-cup-v1';
const $ = id => document.getElementById(id);
const panel = $('play-panel');
const sidePanel = $('side-panel');
const sound = createSound();
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const arena = createCupArena($('arena-3d'), $('arena-overhead'));
const cardIds = ids => Array.isArray(ids) && ids.every(id => Object.hasOwn(CARDS, id));
const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

function initialSave() {
  let profile = DEFAULT_WRESTLER;
  try {
    profile = readCareer(localStorage.getItem('dohyo-career-v1'))?.wrestler ?? profile;
  } catch {
    // A new cup can start with the default rikishi if the classic save cannot be read.
  }
  return { version: 1, profile: { ...profile }, run: null, runs: 0, best: 0, cups: 0, muted: false };
}

function validRun(run) {
  if (run === null) return true;
  const bout = run?.bout;
  return Number.isInteger(run?.seed) && Number.isInteger(run.round) && Boolean(RIVALS[run.round])
    && ['bout', 'draft', 'camp', 'won', 'lost'].includes(run.phase)
    && (run.gear === null || Object.hasOwn(GEAR, run.gear))
    && cardIds(run.deck) && run.deck.length >= 5
    && cardIds(bout?.hand) && bout.hand.length === 5 && cardIds(bout.draw) && cardIds(bout.discard)
    && Number.isInteger(bout.turn) && bout.turn >= 1 && Number.isInteger(bout.position) && Math.abs(bout.position) <= EDGE
    && Number.isInteger(bout.spirit) && Number.isInteger(bout.rivalSpirit) && Number.isInteger(bout.rng)
    && [null, 'east', 'west'].includes(bout.grip) && Array.isArray(run.last);
}

function load() {
  const fresh = initialSave();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
    if (saved?.version !== 1 || !validRun(saved.run) || typeof saved.profile?.name !== 'string'
      || !Object.hasOwn(COLOURS, saved.profile.colour)) return fresh;
    return { ...fresh, ...saved, profile: { ...fresh.profile, ...saved.profile } };
  } catch {
    return fresh;
  }
}

let state = load();
let plan = [];
let playback = null;
let message = '';
let saving = true;
sound.mute(state.muted);

function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    saving = true;
  } catch {
    saving = false;
  }
}

function showSound() {
  $('sound-toggle').textContent = state.muted ? 'Sound off' : 'Sound on';
  $('sound-toggle').setAttribute('aria-pressed', String(!state.muted));
}

function track(position) {
  const text = position === 0 ? 'Centre' : Math.abs(position) >= EDGE
    ? position < 0 ? 'East out' : 'West out'
    : `${EDGE - Math.abs(position)} ${EDGE - Math.abs(position) === 1 ? 'step' : 'steps'} from ${position < 0 ? 'your' : 'rival'} edge`;
  return `<div class="track" aria-label="Ring position, ${text}">
    <span>YOUR EDGE</span><div class="track-pips" aria-hidden="true">
      ${Array.from({ length: 9 }, (_, i) => `<i class="${i === position + EDGE ? 'active ' : ''}${i === 0 || i === 8 ? 'rim' : ''}"></i>`).join('')}
    </div><span>RIVAL EDGE</span><strong>${text}</strong>
  </div>`;
}

function header(run) {
  const active = run?.phase === 'bout';
  const phase = run?.phase;
  const rival = RIVALS[run?.round ?? 0];
  const headings = {
    draft: ['AFTER THE QUALIFIER', 'Draft a card', 'Choose one reward for your deck or go straight to the semifinal.'],
    camp: ['BETWEEN BOUTS', 'Prepare for the final', 'Upgrade a card at the dojo or change your mawashi at the outfitter.'],
    won: ['SPIRIT CUP', 'Tournament champion', 'You won all three bouts. Your stable records the cup.'],
    lost: ['SPIRIT CUP', 'Run ended', 'Start a fresh run with the starter deck and a new deal.'],
  };
  const text = active ? [rival.stage.toUpperCase(), `vs ${rival.name}`, rival.scout] : headings[phase]
    ?? ['THE STABLE', 'Enter the Spirit Cup', 'Read the rival and build a sequence from the cards in your hand.'];
  $('page-kicker').textContent = text[0];
  $('page-title').textContent = text[1];
  $('page-subtitle').textContent = text[2];
  $('bracket').innerHTML = RIVALS.map((opponent, index) => {
    const completed = run && (index < run.round || (run.winner === 'east' && index === run.round));
    const current = run && index === run.round;
    return `<li class="${completed ? 'complete' : ''}" ${current ? 'aria-current="step"' : ''}>
      <span>${completed ? '✓' : `0${index + 1}`}</span><strong>${opponent.stage}</strong>
    </li>`;
  }).join('');
}

function homePanel() {
  return `<div class="panel-head">
      <div><p class="eyebrow">ENTRY FORM</p><h2>Your rikishi</h2></div>
      <span class="mini-tag">10-CARD STARTER</span>
    </div>
    <form id="entry-form">
      <div class="entry-fields">
        <label>Ring name<input id="entry-name" name="name" value="${escape(state.profile.name)}" maxlength="24" required></label>
        <label>Mawashi colour<select name="colour">${Object.entries(COLOURS).map(([id, info]) =>
          `<option value="${id}" ${state.profile.colour === id ? 'selected' : ''}>${info.label}</option>`).join('')}</select></label>
      </div>
      <button class="button primary" type="submit">Start tournament <span aria-hidden="true">→</span></button>
    </form>`;
}

function cardMarkup(card, options = {}) {
  const order = options.order ?? 0;
  const cost = `${card.cost} stamina${card.spirit ? ` · ${card.spirit} Spirit` : ''}`;
  return `<button type="button" class="move-card ${card.type.toLowerCase()}${order ? ' selected' : ''}"
      data-action="${options.action}" data-pick="${options.pick}"
      ${options.action === 'queue' ? `aria-pressed="${Boolean(order)}"` : ''}
      ${options.issue ? `aria-disabled="true" title="${escape(options.issue)}"` : ''}>
    <span class="card-meta"><span>${typeIcon(card.type)} ${card.type}</span><span>${order ? `#${order}` : cost}</span></span>
    ${cardArt(card.name)}
    <strong>${card.name}</strong>
    <span class="card-description">${card.text}</span>
    ${order ? `<span class="selected-cost">${cost}</span>` : ''}
  </button>`;
}

function handPanel(run) {
  const { bout } = run;
  const status = planStatus(bout, plan);
  const intent = intentFor(bout, run.round);
  const cards = bout.hand.map((id, slot) => {
    const order = plan.indexOf(slot) + 1;
    const issue = order ? '' : planStatus(bout, [...plan, slot]).issue;
    return cardMarkup(CARDS[id], { action: 'queue', pick: slot, order, issue });
  });
  const braceOrder = plan.indexOf(BRACE) + 1;
  const queue = plan.map((slot, i) => `<span>${i + 1} <b>${cardAt(bout, slot).name}</b></span>`).join('');
  return `<div class="panel-head">
      <div><p class="eyebrow">EXCHANGE ${bout.turn}</p><h2>Your hand</h2></div>
      <div class="meters">
        <span>STAMINA <b>${status.stamina}/${STAMINA}</b></span>
        <span class="spirit">SPIRIT <b>${bout.spirit}/${SPIRIT_CAP}</b></span>
      </div>
    </div>
    <div class="mobile-intent"><span class="eyebrow">RIVAL INTENT</span><strong>${typeIcon(intent.type)} ${intent.type}</strong></div>
    <div class="hand">${cards.join('')}</div>
    <div class="plan" id="queued-moves">${queue || '<span>Tap cards in the order you want to play them.</span>'}</div>
    <p class="plan-feedback" id="plan-feedback" role="status">${escape(message || status.issue || '')}</p>
    <div class="controls">
      <button type="button" class="button outline" data-action="queue" data-pick="${BRACE}"
        aria-pressed="${Boolean(braceOrder)}" ${!braceOrder && status.stamina < 1 ? 'aria-disabled="true"' : ''} title="${BASIC_BRACE.text}">
        ${braceOrder ? `#${braceOrder} Brace` : 'Brace · 1 stamina'}
      </button>
      <button type="button" class="button text" data-action="clear" ${plan.length ? '' : 'disabled'}>Clear</button>
      <button type="button" class="button primary" data-action="resolve" ${plan.length && !status.issue ? '' : 'disabled'}>Resolve exchange <span aria-hidden="true">→</span></button>
    </div>`;
}

function endPanel(run) {
  if (run.phase === 'draft') {
    return `<div class="panel-head"><div><p class="eyebrow">BOUT WON</p><h2>Choose a card</h2></div></div>
      <div class="rewards">${draftOptions(run).map(id => cardMarkup(CARDS[id], { action: 'draft', pick: id })).join('')}</div>
      <div class="controls"><button type="button" class="button outline" data-action="draft" data-pick="skip">Skip reward</button></div>`;
  }
  if (run.phase === 'camp') {
    const drills = Object.entries(TRAINING).filter(([id]) => run.deck.includes(id));
    return `<div class="panel-head"><div><p class="eyebrow">BOUT WON</p><h2>One camp choice</h2></div></div>
      <p class="section-label">Dojo <span>Upgrade one copy</span></p>
      <div class="rewards">${drills.map(([id, upgrade]) => cardMarkup(CARDS[upgrade], { action: 'camp', pick: id })).join('')}</div>
      <p class="section-label">Outfitter <span>Equip a perk</span></p>
      <div class="gear">${Object.entries(GEAR).map(([id, item]) => `<button type="button" class="gear-card" data-action="camp" data-pick="${id}">
        <i style="--belt:${COLOURS[item.colour].value}" aria-hidden="true"></i><span><strong>${item.name}</strong><small>${item.text}</small></span>
      </button>`).join('')}</div>`;
  }
  const won = run.phase === 'won';
  return `<div class="panel-head"><div><p class="eyebrow">${won ? 'THREE BOUTS WON' : 'TOURNAMENT RESULT'}</p>
      <h2>${won ? 'You lift the Spirit Cup' : `${RIVALS[run.round].name} takes the bout`}</h2></div></div>
    <p class="end-text">${escape(run.last.at(-1)?.text ?? '')}</p>
    <button type="button" class="button primary" data-action="stable">Return to stable <span aria-hidden="true">→</span></button>`;
}

function sideContent(run) {
  const rival = RIVALS[run?.round ?? 0];
  const active = run?.phase === 'bout';
  const intent = active ? intentFor(run.bout, run.round) : null;
  const gear = run?.gear ? GEAR[run.gear] : null;
  const log = run?.last ?? [];
  const grip = active && run.bout.grip;
  const deck = run?.deck ?? [];
  const copies = Object.fromEntries([...new Set(deck)].map(id => [id, deck.filter(card => card === id).length]));
  return `<div class="side-block intent">
      <p class="eyebrow">${active ? 'RIVAL INTENT' : 'RIVAL DOSSIER'}</p>
      <h2>${intent ? typeIcon(intent.type) + " " + intent.type : rival.name}</h2>
      <p>${intent ? "Exact move revealed when you commit." : rival.scout}</p>
      ${active ? `<div class="side-stats"><span>Rival Spirit <b>${run.bout.rivalSpirit}</b></span>
        <span>Grip <b>${grip === 'east' ? 'Yours' : grip === 'west' ? 'Rival’s' : 'Open'}</b></span></div>` : ''}
    </div>
    ${run ? `<div class="side-block">
      <p class="eyebrow">RUN KIT</p>
      <p class="kit-name">${gear?.name ?? 'Standard Mawashi'}</p>
      ${gear ? `<p>${gear.text}</p>` : ''}
      <details><summary>${deck.length} cards in deck</summary>
        <ul class="deck-list">${Object.entries(copies).map(([id, count]) => `<li><b>${count}×</b> ${CARDS[id].name}</li>`).join('')}</ul>
      </details>
      ${active ? `<p class="deck-count">${run.bout.draw.length} in draw pile · ${run.bout.discard.length} discarded</p>` : ''}
    </div>` : ''}
    <div class="side-block">
      <p class="eyebrow">STABLE RECORD</p>
      <div class="side-stats"><span>Runs <b>${state.runs}</b></span><span>Best <b>${state.best}/3</b></span><span>Cups <b>${state.cups}</b></span></div>
    </div>
    ${log.length ? `<div class="side-block"><p class="eyebrow">LAST EXCHANGE</p>${run.revealed ? `<p>Rival card · ${escape(run.revealed)}</p>` : ""}
      <ol class="exchange-log">${log.map(event => `<li>${escape(event.text)}</li>`).join('')}</ol>
    </div>` : ''}
    <div class="side-block">
      <details><summary>How to play</summary>
        <p>Order your cards. A quick lead acts before the rival. Their rooted stance is already set, and slow leads such as Gather Spirit act after the rival’s move.</p>
        <p>Guard or evade before a hit to protect your follow-up. When you resolve, the whole hand goes to discard and you draw five more cards.</p>
        <p>Cross the straw or touch the clay with anything except the soles of your feet and the bout ends.</p>
      </details>
      ${active && !playback ? '<button class="button text retire" type="button" data-action="retire">Retire run</button>' : ''}
    </div>`;
}

function showPanel(run) {
  if (playback) {
    panel.innerHTML = `<div class="panel-head"><div><p class="eyebrow">EXCHANGE ${run.bout.turn}</p><h2>On the dohyō</h2></div>
      <button type="button" class="button outline" data-action="skip">Skip playback</button></div>
      <p class="reveal">Rival card · ${escape(playback.revealed)}</p><div class="sequence">${playback.events.map((event, i) => `<span data-beat="${i}">${escape(event.move)}</span>`).join('')}</div>`;
  } else if (!run) {
    panel.innerHTML = homePanel();
  } else {
    panel.innerHTML = run.phase === 'bout' ? handPanel(run) : endPanel(run);
  }
}

function draw(event = null, progress = 1, run = playback?.before ?? state.run) {
  const terminal = run?.winner ? run.last.at(-1) : null;
  const profile = dressedProfile(run?.gear);
  const position = run?.bout.position ?? 0;
  const charged = !event && !terminal && run?.phase === 'bout' && intentFor(run.bout, run.round).type === 'Special';
  const tell = charged ? { kind: 'charge', side: 'west', from: position, to: position } : null;
  arena.draw(profile, RIVALS[run?.round ?? 0], event ?? terminal ?? tell, charged ? 0.42 : progress, position, motion.matches);
  $('camera-name').textContent = arena.view;
}

let cachedProfile;
let cachedGear;
let dressed;
function dressedProfile(gear) {
  if (cachedProfile !== state.profile || cachedGear !== gear) {
    cachedProfile = state.profile;
    cachedGear = gear;
    dressed = gear ? { ...state.profile, colour: GEAR[gear].colour } : state.profile;
  }
  return dressed;
}

function render(focus = false) {
  const run = playback?.before ?? state.run;
  const rival = RIVALS[run?.round ?? 0];
  header(run);
  showPanel(run);
  sidePanel.innerHTML = sideContent(run);
  $('east-name').textContent = state.profile.name;
  $('west-name').textContent = rival.name;
  $('arena-call').textContent = run?.last.at(-1)?.text ?? (run ? 'Read the rival and choose your lead card.' : 'Both rikishi take their marks.');
  $('position-track').innerHTML = track(run?.bout.position ?? 0);
  $('save-status').textContent = saving ? 'Progress saves in this browser.' : 'Progress is available for this session.';
  showSound();
  draw();
  if (focus) {
    $('page-title').focus({ preventScroll: true });
    if (window.scrollY > 100) window.scrollTo(0, 0);
  }
}

function queue(slot, button) {
  const run = state.run;
  if (playback || run?.phase !== 'bout' || !cardAt(run.bout, slot)) return;
  message = '';
  if (plan.includes(slot)) {
    plan = plan.filter(selected => selected !== slot);
  } else {
    const candidate = [...plan, slot];
    const status = planStatus(run.bout, candidate);
    if (status.issue) {
      message = status.issue;
      $('plan-feedback').textContent = message;
      return;
    }
    plan = candidate;
  }
  showPanel(run);
  panel.querySelector(`[data-action="queue"][data-pick="${button.dataset.pick}"]`)?.focus({ preventScroll: true });
}

const DURATIONS = { charge: 770, burst: 950, throw: 1310, out: 1240, evade: 610, rush: 640, push: 535 };

function endPlayback() {
  if (!playback) return;
  playback = null;
  render(true);
}

function animate(now) {
  if (!playback) return;
  const animation = playback;
  if (animation.start === null) animation.start = now;
  let event = animation.events[animation.index];
  let duration = (DURATIONS[event.kind] ?? 390) * (motion.matches ? 0.72 : 1);
  if (now - animation.start >= duration) {
    animation.index += 1;
    animation.start = now;
    event = animation.events[animation.index];
    if (!event) {
      endPlayback();
      return;
    }
    duration = (DURATIONS[event.kind] ?? 390) * (motion.matches ? 0.72 : 1);
  }

  if (animation.cue !== animation.index) {
    animation.cue = animation.index;
    $('arena-call').textContent = event.text;
    $('position-track').innerHTML = track(event.to);
    panel.querySelector('.sequence .active')?.classList.remove('active');
    panel.querySelector(`[data-beat="${animation.index}"]`)?.classList.add('active');
    if (event.kind === 'charge') sound.theme('pulse', animation.index);
    if (event.winner) sound.decision();
    else if (['push', 'rush', 'burst', 'block'].includes(event.kind)) sound.impact();
  }
  draw(event, (now - animation.start) / duration, animation.before);
  requestAnimationFrame(animate);
}

function resolve() {
  if (playback || state.run?.phase !== 'bout') return;
  const before = state.run;
  const next = resolveExchange(before, plan);
  if (next === before) return;
  sound.unlock();
  state.run = next;
  if (next.winner === 'east') {
    state.best = Math.max(state.best, next.round + 1);
    if (next.phase === 'won') state.cups += 1;
  }
  persist();
  plan = [];
  message = '';
  playback = { before, events: next.last, revealed: next.revealed, index: 0, cue: -1, start: null };
  render();
  $('arena-screen').scrollIntoView({ block: 'nearest' });
  panel.querySelector('[data-action="skip"]').focus({ preventScroll: true });
  requestAnimationFrame(animate);
}

panel.addEventListener('submit', event => {
  if (event.target.id !== 'entry-form' || state.run) return;
  event.preventDefault();
  const form = new FormData(event.target);
  const name = String(form.get('name')).trim();
  if (!name) {
    $('entry-name').value = '';
    $('entry-name').reportValidity();
    return;
  }
  state.profile = { ...state.profile, name, colour: form.get('colour') };
  state.run = newRun();
  state.runs += 1;
  persist();
  sound.unlock();
  render(true);
});

function changeRun(run) {
  if (run === state.run) return;
  state.run = run;
  plan = [];
  message = '';
  persist();
  render(true);
}

function click(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, pick } = button.dataset;
  if (playback && action !== 'skip') return;
  switch (action) {
    case 'queue':
      queue(Number(pick), button);
      break;
    case 'clear':
      plan = [];
      message = '';
      showPanel(state.run);
      panel.querySelector('[data-action="queue"]').focus({ preventScroll: true });
      break;
    case 'resolve':
      resolve();
      break;
    case 'skip':
      endPlayback();
      break;
    case 'draft':
      changeRun(chooseDraft(state.run, pick));
      break;
    case 'camp':
      changeRun(chooseCamp(state.run, pick));
      break;
    case 'stable':
      changeRun(null);
      break;
    case 'retire':
      if (window.confirm('Retire from this Spirit Cup and return to the stable?')) changeRun(null);
      break;
  }
}
panel.addEventListener('click', click);
sidePanel.addEventListener('click', click);

$('sound-toggle').addEventListener('click', () => {
  state.muted = !state.muted;
  sound.mute(state.muted);
  if (!state.muted) sound.unlock();
  persist();
  showSound();
});
$('arena-3d').addEventListener('webglcontextlost', () => requestAnimationFrame(() => draw()));
new ResizeObserver(() => requestAnimationFrame(() => {
  if (!playback) draw();
})).observe($('arena-screen'));

render();
