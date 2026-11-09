import './styles.css';
import {
  BUILDS, COLOURS, DEFAULT_WRESTLER, FILMS, MAX_STAT, RANKS, TACTICS, TECHNIQUES,
  THEMES, TRAINING, WALKS, createCareer, meetGoal, nextOpponent, readCareer,
  recordBout, scout, simulateBout,
} from './career.js';
import { createBroadcast, currentBeat } from './broadcast.js';
import { createSound } from './sound.js';

const STORE_KEY = 'dohyo-career-v1';
const $ = id => document.getElementById(id);
const panel = $('panel');
const progress = $('bout-progress');
const sound = createSound();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let storageAvailable = true;

function load() {
  try {
    return readCareer(localStorage.getItem(STORE_KEY));
  } catch {
    return null;
  }
}

let career = load();
let profile = { ...(career?.wrestler ?? DEFAULT_WRESTLER) };
let screen = career ? 'booking' : 'creator';
let editorOrigin = 'booking';
let tab = 'identity';
let training = 'power';
let tactic = profile.style;
let preview = null;
let playback = null;
let muted = false;
let currentMessage = '';
let viewer;

function fallback() {
  viewer = null;
  $('viewport-fallback').hidden = false;
}

try {
  viewer = createBroadcast($('arena'));
  $('arena').addEventListener('webglcontextlost', event => {
    event.preventDefault();
    fallback();
  });
} catch {
  fallback();
}

function persist() {
  try {
    if (career) localStorage.setItem(STORE_KEY, JSON.stringify(career));
    else localStorage.removeItem(STORE_KEY);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
}

const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const pad = value => String(value).padStart(2, '0');
const option = (value, label, selected) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${escape(label)}</option>`;
const select = (key, label, values) => `
  <label class="field"><span>${label}</span>
    <select data-profile="${key}" ${key === 'build' && career ? 'disabled' : ''}>
      ${Object.entries(values).map(([id, name]) => option(id, name, profile[key])).join('')}
    </select>
  </label>`;
const names = (values, key) => Object.fromEntries(Object.entries(values).map(([id, value]) => [id, value[key]]));
const techniqueNames = Object.fromEntries(Object.entries(TECHNIQUES).map(([id, move]) => [id, `${move.name} · ${move.label}`]));

function message(text) {
  if (text === currentMessage) return;
  currentMessage = text;
  $('commentary').textContent = text;
}

function overlay(mode, label, title, subtitle) {
  $('view-mode').textContent = mode;
  $('view-label').textContent = label;
  $('view-title').textContent = title;
  $('view-subtitle').textContent = subtitle;
}

function creatorOverlay() {
  overlay(preview ? 'ENTRANCE PREVIEW' : 'STABLE CAM', 'EAST SIDE / RIKISHI PROFILE',
    profile.name.trim() || 'Your rikishi', profile.epithet.trim() || TACTICS[profile.style].style);
}

function creator() {
  const stats = BUILDS[profile.build].stats;
  const tabs = { identity: 'Identity', techniques: 'Techniques', entrance: 'Entrance' };
  let fields;
  if (tab === 'identity') {
    fields = `
      <label class="field"><span>Ring name <small>Shikona</small></span>
        <input data-profile="name" value="${escape(profile.name)}" maxlength="24" autocomplete="off" required>
      </label>
      <label class="field"><span>Nickname</span>
        <input data-profile="epithet" value="${escape(profile.epithet)}" maxlength="32" autocomplete="off">
      </label>
      <div class="field-row">
        ${select('build', 'Build', names(BUILDS, 'label'))}
        ${select('skin', 'Skin tone', { warm: 'Warm', light: 'Light', deep: 'Deep' })}
      </div>
      <p class="stat-line" id="build-stats">${Object.entries(stats).map(([stat, value]) => `${TRAINING[stat].stat} <b>${value}</b>`).join('<span> / </span>')}</p>
      <fieldset class="colours">
        <legend>Mawashi colour</legend>
        ${Object.entries(COLOURS).map(([id, colour]) => `
          <label class="colour" title="${colour.label}">
            <input type="radio" name="colour" data-profile="colour" value="${id}" ${profile.colour === id ? 'checked' : ''}>
            <span style="--swatch: ${colour.value}"><span class="sr-only">${colour.label}</span></span>
          </label>`).join('')}
        <span class="colour-name" id="colour-name">${COLOURS[profile.colour].label}</span>
      </fieldset>`;
  } else if (tab === 'techniques') {
    fields = `
      ${select('style', 'Wrestling style', names(TACTICS, 'style'))}
      <p class="field-hint">Fighting in your preferred style gives you an edge in the clinch.</p>
      ${select('signature', 'Signature technique', techniqueNames)}
      ${select('alternate', 'Second technique', techniqueNames)}
      <p class="field-hint">Your tactic and the flow of the bout influence which technique you finish with.</p>`;
  } else {
    fields = `
      ${select('theme', 'Broadcast theme', THEMES)}
      ${select('film', 'Entrance film', FILMS)}
      ${select('walk', 'Walkout style', WALKS)}
      <button class="button outline wide" type="button" data-action="preview">${preview ? 'Stop preview' : 'Preview entrance'}</button>
      <p class="field-hint">Your theme and film play during the game’s opening broadcast.</p>`;
  }

  panel.innerHTML = `
    <p class="kicker panel-kicker">RIKISHI FILE</p>
    <h2>${career ? 'Edit your rikishi' : 'Your wrestler'}</h2>
    <div class="tabs" aria-label="Creator sections">
      ${Object.entries(tabs).map(([id, title]) => `<button type="button" data-action="tab" data-tab="${id}" aria-pressed="${id === tab}">${title}</button>`).join('')}
    </div>
    <div class="editor-fields">${fields}</div>
    <div class="panel-actions">
      <button type="button" class="button primary wide" data-action="sign">${career ? 'Save wrestler' : 'Begin career'} <span aria-hidden="true">→</span></button>
      ${career ? '<button type="button" class="text-button" data-action="cancel-edit">Cancel edits</button>' : ''}
    </div>`;
}

function statsStrip(skills, selected) {
  return `<div class="stats-strip" aria-label="Wrestler skills">${Object.entries(skills).map(([stat, value]) => `
    <div><span>${TRAINING[stat].stat}</span><b>${value}${stat === selected && value < MAX_STAT ? '<small> +1</small>' : ''}</b></div>`).join('')}</div>`;
}

function cardStrip(card) {
  return `<div class="card-strip" aria-label="Meet record">${Array.from({ length: 3 }, (_, i) => {
    const result = card[i];
    return `<span class="${result ? result.win ? 'won' : 'lost' : 'pending'}">${result ? result.win ? 'Win' : 'Loss' : `Bout ${i + 1}`}</span>`;
  }).join('')}</div>`;
}

function booking() {
  const opponent = nextOpponent(career);
  const goal = career.rank === RANKS.length - 1
    ? 'Win all three for another top-division title.'
    : `Win ${meetGoal(career.rank)} of 3 to reach ${RANKS[career.rank + 1]}.`;
  panel.innerHTML = `
    <div class="panel-top"><p class="kicker panel-kicker">MEET ${pad(career.meet)} / BOUT ${pad(career.card.length + 1)}</p>
      <span class="rank-badge">${RANKS[career.rank]}</span></div>
    <h2>vs ${opponent.name}</h2>
    <p class="scouting">${scout(opponent)}</p>
    ${cardStrip(career.card)}
    <p class="field-hint">${goal}</p>
    ${statsStrip(career.skills, training)}
    <label class="field"><span>Training session</span><select id="training">
      ${Object.entries(TRAINING).map(([id, drill]) => option(id, drill.label, training)).join('')}
    </select></label>
    <p class="field-hint" id="training-hint">${TRAINING[training].hint}</p>
    <label class="field"><span>Bout tactic</span><select id="tactic">
      ${Object.entries(TACTICS).map(([id, approach]) => option(id, approach.label, tactic)).join('')}
    </select></label>
    <p class="field-hint" id="tactic-hint">${TACTICS[tactic].hint}</p>
    <div class="panel-actions">
      <button type="button" class="button primary wide" data-action="watch">Watch bout <span aria-hidden="true">→</span></button>
      <div class="inline-actions">
        <button type="button" class="text-button" data-action="edit">Edit rikishi</button>
        ${career.latest ? '<button type="button" class="text-button" data-action="latest">Last report</button>' : ''}
        <button type="button" class="text-button muted" data-action="restart">New career</button>
      </div>
    </div>`;
}

function broadcastPanel() {
  const { bout, replay, paused, speed } = playback;
  const decision = TECHNIQUES[bout.wrestler.signature];
  panel.innerHTML = `
    <p class="kicker panel-kicker">${replay ? 'REPLAY' : 'RINGSIDE'} / BOUT ${pad(bout.serial + 1)}</p>
    <h2>${escape(bout.wrestler.name)} <span class="vs">vs</span> ${bout.opponent.name}</h2>
    <dl class="match-card">
      <div><dt>East</dt><dd>${escape(bout.wrestler.name)} <span>${RANKS[bout.rank]}</span></dd></div>
      <div><dt>West</dt><dd>${bout.opponent.name} <span>${TACTICS[bout.opponent.style].style}</span></dd></div>
      <div><dt>Your tactic</dt><dd>${TACTICS[bout.tactic].label}</dd></div>
      <div><dt>Signature</dt><dd>${decision.name} <span>${decision.label}</span></dd></div>
    </dl>
    <div class="transport">
      <button class="button outline" type="button" id="pause" data-action="pause">${paused ? 'Resume' : 'Pause'}</button>
      <button class="button outline speed" type="button" id="speed" aria-label="Playback speed" data-action="speed">${speed}×</button>
    </div>
    <p class="field-hint">Step outside the straw boundary or touch down with anything other than the soles of your feet and you lose the bout.</p>
    ${replay ? '<button type="button" class="text-button" data-action="latest">Back to report</button>' : ''}`;
}

function report() {
  const { bout, card, cardWins, finished, promoted, title } = career.latest;
  const finish = TECHNIQUES[bout.technique];
  const winner = bout.win ? bout.wrestler.name : bout.opponent.name;
  const trainingGain = bout.trainingGain ? `+1 ${TRAINING[bout.training].stat.toLowerCase()} from training` : 'Training cap reached';
  let takeaway = `${3 - card.length} bout${card.length === 2 ? '' : 's'} left in this meet.`;
  if (finished) takeaway = promoted
    ? `Promoted to ${RANKS[career.rank]} after going ${cardWins}–${3 - cardWins}.`
    : `You stay at ${RANKS[career.rank]} after going ${cardWins}–${3 - cardWins}.`;
  panel.innerHTML = `
    <div class="panel-top"><p class="kicker panel-kicker">MEET ${pad(bout.meet)} / RESULT</p>
      <span class="rank-badge">${RANKS[career.rank]}</span></div>
    <h2>${bout.win ? 'Bout won' : 'Bout lost'}</h2>
    <div class="decision-card"><strong>${finish.name}</strong><span>${finish.label}</span>
      <p>${escape(winner)} takes the bout.</p></div>
    ${cardStrip(card)}
    <p class="scouting">${takeaway}${title ? ' You also take the top-division title.' : ''}</p>
    <p class="stat-line">${trainingGain} <span> / </span> ${career.wins} W · ${career.bouts - career.wins} L <span> / </span> ${career.titles} titles</p>
    <div class="panel-actions">
      <button type="button" class="button primary wide" data-action="next">${finished ? 'Prepare next meet' : 'Prepare next bout'} <span aria-hidden="true">→</span></button>
      <button type="button" class="button outline wide" data-action="replay">Replay bout</button>
    </div>`;
}

const PAGES = {
  creator: ['THE STABLE', 'Create your rikishi', 'Give your wrestler a ring name, a mawashi and a way to win.'],
  booking: ['THE STABLE', 'Prepare for the bout', 'Scout the opponent, train one skill and choose your approach.'],
  broadcast: ['LIVE FROM THE HALL', 'On the dohyō', 'Two rikishi. One straw boundary.'],
  report: ['THE DECISION', 'Bout report', 'Review the finish and see where the result takes your career.'],
};

function render(moveFocus = false) {
  const [kicker, title, description] = PAGES[screen];
  $('page-kicker').textContent = kicker;
  $('page-title').textContent = title;
  $('page-description').textContent = description;
  $('save-status').textContent = career ? storageAvailable ? 'Career saved locally' : 'This session only' : 'New career';
  document.querySelectorAll('.steps li').forEach(step => {
    if (step.dataset.screen === screen) step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
  });
  progress.hidden = screen !== 'broadcast';

  if (screen === 'creator') {
    creator();
    creatorOverlay();
    message('Choose a build and mawashi colour to see the change in the arena.');
  } else if (screen === 'booking') {
    booking();
    overlay('STABLE CAM', `${RANKS[career.rank].toUpperCase()} / MEET ${pad(career.meet)}`,
      career.wrestler.name, career.wrestler.epithet || TACTICS[career.wrestler.style].style);
    message(`Next opponent • ${nextOpponent(career).name}`);
  } else if (screen === 'broadcast') {
    broadcastPanel();
    overlay(playback.replay ? 'REPLAY' : 'BOUT CAM', `MEET ${pad(playback.bout.meet)} / EAST & WEST`,
      `${playback.bout.wrestler.name} vs ${playback.bout.opponent.name}`, 'The walkout');
    message('Both rikishi enter the dohyō.');
    progress.value = 0;
  } else {
    report();
    const bout = career.latest.bout;
    overlay('BOUT COMPLETE', bout.win ? 'EAST WINS' : 'WEST WINS',
      bout.win ? bout.wrestler.name : bout.opponent.name, TECHNIQUES[bout.technique].name);
    message(`${TECHNIQUES[bout.technique].label} • Bout ${bout.serial + 1}`);
  }
  if (moveFocus) {
    $('page-title').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

function start(bout, replay) {
  sound.unlock();
  preview = null;
  playback = { bout, replay, time: 0, speed: 1, paused: false, cue: '', music: -1, progress: -1 };
  screen = 'broadcast';
  render(true);
}

function endMatch() {
  const { bout, replay } = playback;
  if (!replay) {
    const saved = load();
    if (saved && (saved.seed !== bout.seed || saved.bouts > bout.serial)) {
      career = saved;
      playback = null;
      screen = saved.latest ? 'report' : 'booking';
      render(true);
      message('Loaded the career saved in another tab.');
      return;
    }
    career = recordBout(career, bout);
    persist();
  }
  playback = null;
  screen = 'report';
  render(true);
}

function profileChanged(input) {
  const key = input.dataset.profile;
  const prior = profile[key];
  profile = { ...profile, [key]: input.value };
  if (['signature', 'alternate'].includes(key) && profile.signature === profile.alternate) {
    const other = key === 'signature' ? 'alternate' : 'signature';
    profile[other] = prior;
    panel.querySelector(`[data-profile="${other}"]`).value = prior;
  }
  if (key === 'colour') $('colour-name').textContent = COLOURS[profile.colour].label;
  if (key === 'build') {
    $('build-stats').innerHTML = Object.entries(BUILDS[profile.build].stats)
      .map(([stat, value]) => `${TRAINING[stat].stat} <b>${value}</b>`).join('<span> / </span>');
  }
  creatorOverlay();
}

panel.addEventListener('input', event => {
  const input = event.target;
  if (input.dataset.profile) profileChanged(input);
  if (input.id === 'tactic') {
    tactic = input.value;
    $('tactic-hint').textContent = TACTICS[tactic].hint;
  }
  if (input.id === 'training') {
    training = input.value;
    $('training-hint').textContent = TRAINING[training].hint;
    panel.querySelector('.stats-strip').outerHTML = statsStrip(career.skills, training);
  }
});

panel.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  switch (button.dataset.action) {
    case 'tab':
      tab = button.dataset.tab;
      preview = null;
      render();
      panel.querySelector(`[data-tab="${tab}"]`).focus();
      break;
    case 'preview':
      if (preview) {
        preview = null;
        button.textContent = 'Preview entrance';
      } else {
        sound.unlock();
        preview = { start: performance.now(), music: -1 };
        button.textContent = 'Stop preview';
      }
      creatorOverlay();
      break;
    case 'sign':
      if (!profile.name.trim()) {
        tab = 'identity';
        render();
        const input = panel.querySelector('[data-profile="name"]');
        input.value = '';
        input.focus();
        input.reportValidity();
        break;
      }
      profile = { ...profile, name: profile.name.trim(), epithet: profile.epithet.trim() };
      career = career ? { ...career, wrestler: { ...profile } } : createCareer(profile);
      tactic = profile.style;
      preview = null;
      persist();
      screen = 'booking';
      render(true);
      break;
    case 'watch':
      start(simulateBout(career, training, tactic), false);
      break;
    case 'pause':
      playback.paused = !playback.paused;
      button.textContent = playback.paused ? 'Resume' : 'Pause';
      break;
    case 'speed':
      playback.speed = playback.speed === 1 ? 2 : 1;
      button.textContent = `${playback.speed}×`;
      break;
    case 'next':
      screen = 'booking';
      render(true);
      break;
    case 'replay':
      start(career.latest.bout, true);
      break;
    case 'latest':
      screen = 'report';
      playback = null;
      render(true);
      break;
    case 'edit':
      editorOrigin = screen;
      profile = { ...career.wrestler };
      screen = 'creator';
      tab = 'identity';
      render(true);
      break;
    case 'cancel-edit':
      screen = editorOrigin;
      preview = null;
      render(true);
      break;
    case 'restart':
      if (!window.confirm('Replace this career and create a new rikishi?')) break;
      career = null;
      profile = { ...DEFAULT_WRESTLER };
      screen = 'creator';
      tab = 'identity';
      training = 'power';
      persist();
      render(true);
      break;
  }
});

$('sound-toggle').addEventListener('click', event => {
  muted = !muted;
  sound.mute(muted);
  if (!muted) sound.unlock();
  event.currentTarget.textContent = muted ? 'Sound off' : 'Sound on';
  event.currentTarget.setAttribute('aria-pressed', String(!muted));
});

function playTheme(state, theme, time) {
  const tick = Math.floor(time / 0.33);
  if (state.music === tick) return;
  state.music = tick;
  sound.theme(theme, tick);
}

function announceBeat(bout, beat) {
  const attacker = beat.driver === 'east' ? bout.wrestler.name : bout.opponent.name;
  const winner = bout.win ? bout.wrestler.name : bout.opponent.name;
  const side = bout.win ? 'East' : 'West';
  const finish = TECHNIQUES[bout.technique];
  const exchange = {
    drive: `${attacker} pushes through the clinch.`,
    grip: `${attacker} works for a grip on the mawashi.`,
    counter: `${attacker} shifts sideways and redirects the charge.`,
  };
  const calls = {
    entrance: ['The walkout', 'Both rikishi enter the dohyō.'],
    set: ['At the starting lines', 'Both rikishi settle into a crouch.'],
    charge: ['Tachi-ai', 'They collide in the opening charge.'],
    exchange: ['The clinch', exchange[beat.action]],
    finish: ['Decisive exchange', 'The wrestlers commit to the final exchange.'],
    result: [`${side} wins · ${finish.name}`, `${winner} wins by ${finish.label.toLowerCase()}.`],
  };
  const [subtitle, text] = calls[beat.type];
  $('view-subtitle').textContent = subtitle;
  message(text);
}

function tickMatch(delta) {
  const state = playback;
  const { bout } = state;
  if (!state.paused) state.time = Math.min(state.time + delta * state.speed, bout.duration);
  const beat = currentBeat(bout, state.time);
  if (state.cue !== beat.start) {
    state.cue = beat.start;
    announceBeat(bout, beat);
  }
  if (!state.paused) {
    const portion = (state.time - beat.start) / beat.duration;
    if (beat.type === 'entrance') playTheme(state, bout.wrestler.theme, state.time);
    if ((beat.type === 'charge' || beat.type === 'finish') && portion > 0.43 && state.impact !== beat.start) {
      state.impact = beat.start;
      sound.impact();
    }
    if (beat.type === 'result' && !state.decision) {
      state.decision = true;
      sound.decision();
    }
  }
  const marker = Math.floor(state.time * 5);
  if (marker !== state.progress) {
    progress.value = state.time / bout.duration;
    state.progress = marker;
  }
  viewer?.match(bout, state.time);
  if (state.time >= bout.duration) endMatch();
}

let last = performance.now();
function frame(now) {
  const delta = Math.min((now - last) / 1000, 0.20);
  last = now;
  if (screen === 'broadcast') {
    tickMatch(delta);
  } else if (screen === 'report') {
    const bout = career.latest.bout;
    viewer?.match(bout, bout.duration);
  } else {
    const character = screen === 'creator' ? profile : career.wrestler;
    if (preview) {
      const time = (now - preview.start) / 1000;
      if (time < 5.4) {
        playTheme(preview, character.theme, time);
        viewer?.portrait(character, 0, time);
      } else {
        preview = null;
        const button = panel.querySelector('[data-action="preview"]');
        if (button) button.textContent = 'Preview entrance';
        creatorOverlay();
      }
    } else {
      viewer?.portrait(character, reducedMotion.matches ? 0 : now / 1000, null);
    }
  }
  requestAnimationFrame(frame);
}

render();
requestAnimationFrame(frame);
