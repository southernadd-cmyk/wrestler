export const RANKS = [
  'Jonokuchi', 'Jonidan', 'Sandanme', 'Makushita', 'Jūryō',
  'Maegashira', 'Komusubi', 'Sekiwake', 'Ōzeki', 'Yokozuna',
];

export const BUILDS = {
  balanced: { label: 'Balanced', width: 1, stats: { power: 8, grip: 8, balance: 8 } },
  heavy: { label: 'Heavyweight', width: 1.14, stats: { power: 10, grip: 8, balance: 6 } },
  light: { label: 'Lightweight', width: 0.87, stats: { power: 6, grip: 8, balance: 10 } },
};

export const COLOURS = {
  vermilion: { label: 'Vermilion', value: '#be432f' },
  indigo: { label: 'Indigo', value: '#334d85' },
  jade: { label: 'Jade', value: '#367661' },
  charcoal: { label: 'Charcoal', value: '#24262d' },
  ivory: { label: 'Ivory', value: '#d8c99d' },
};

export const SKINS = { warm: '#c28a67', light: '#dfaa87', deep: '#845337' };

export const TACTICS = {
  drive: { label: 'Drive forward', style: 'Thrusting', hint: 'Meet the charge with a low stance and push through before a grip settles.' },
  grip: { label: 'Take the belt', style: 'Belt wrestling', hint: 'Establish a grip, control the hips and close down space for a counter.' },
  counter: { label: 'Absorb & counter', style: 'Counter wrestling', hint: 'Stay balanced and redirect an opponent who commits too much to the charge.' },
};

export const TECHNIQUES = {
  oshidashi: { name: 'Oshidashi', label: 'Frontal push-out', kind: 'out', tactic: 'drive' },
  yorikiri: { name: 'Yorikiri', label: 'Frontal force-out', kind: 'out', tactic: 'grip' },
  uwatenage: { name: 'Uwatenage', label: 'Overarm throw', kind: 'throw', tactic: 'grip' },
  hatakikomi: { name: 'Hatakikomi', label: 'Slap-down', kind: 'down', tactic: 'counter' },
};

export const THEMES = { drum: 'Low drum', pulse: 'Night pulse', bell: 'Bell and drum', silent: 'Silence' };
export const FILMS = { ink: 'Ink sweep', orbit: 'Ring lines', crest: 'Stable crest' };
export const WALKS = { measured: 'Measured', brisk: 'Brisk', poised: 'Pause at the edge' };
export const TRAINING = {
  power: { label: 'Drive practice', stat: 'Power', hint: 'Push harder in the initial charge.' },
  grip: { label: 'Belt drills', stat: 'Grip', hint: 'Control more of the clinch.' },
  balance: { label: 'Footwork', stat: 'Balance', hint: 'Recover and counter under pressure.' },
};

export const DEFAULT_WRESTLER = {
  name: 'Hoshimori', epithet: 'Quiet Thunder', build: 'balanced', skin: 'warm',
  colour: 'vermilion', style: 'drive', signature: 'oshidashi', alternate: 'uwatenage',
  theme: 'drum', film: 'ink', walk: 'measured',
};

const OPPONENTS = [
  { name: 'Aonami', epithet: 'The Blue Tide', style: 'drive', colour: 'indigo', build: 'heavy', skin: 'light' },
  { name: 'Tetsumori', epithet: 'Iron Grove', style: 'grip', colour: 'charcoal', build: 'balanced', skin: 'warm' },
  { name: 'Kurohama', epithet: 'Black Shore', style: 'counter', colour: 'jade', build: 'light', skin: 'deep' },
  { name: 'Koganeiwa', epithet: 'Golden Rock', style: 'grip', colour: 'ivory', build: 'heavy', skin: 'deep' },
  { name: 'Kaminosaki', epithet: 'Mountain Wind', style: 'counter', colour: 'indigo', build: 'balanced', skin: 'light' },
  { name: 'Iwahane', epithet: 'Stone Feather', style: 'drive', colour: 'charcoal', build: 'light', skin: 'warm' },
];

const STATS = Object.keys(TRAINING);
export const MAX_STAT = 24;
const CARD_SIZE = 3;
const BEATS = { drive: 'grip', grip: 'counter', counter: 'drive' };
const WEIGHTS = {
  drive: [0.65, 0.13, 0.22],
  grip: [0.25, 0.57, 0.18],
  counter: [0.18, 0.22, 0.60],
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createCareer(wrestler, seed = Math.floor(Math.random() * 2 ** 32)) {
  return {
    version: 1, wrestler: { ...wrestler }, seed, rank: 0, meet: 1,
    bouts: 0, wins: 0, titles: 0, skills: { ...BUILDS[wrestler.build].stats },
    card: [], latest: null,
  };
}

export function meetGoal(rank) {
  return rank === RANKS.length - 2 ? 3 : 2;
}

export function nextOpponent(career) {
  const index = ((career.meet - 1) * 2 + career.card.length) % OPPONENTS.length;
  const opponent = OPPONENTS[index];
  const base = 7.4 + career.rank * 1.31;
  const stats = Object.fromEntries(STATS.map(stat => [stat, base + (BUILDS[opponent.build].stats[stat] - 8) * 0.8]));
  stats[{ drive: 'power', grip: 'grip', counter: 'balance' }[opponent.style]] += 1.1;
  return { ...opponent, stats };
}

export function scout(opponent) {
  return {
    drive: 'Charges hard and tries to keep pushing. A well-timed sidestep can turn that force against them.',
    grip: 'Looks for an early grip on the mawashi. Keep their hands busy before they get settled.',
    counter: 'Gives ground and waits for you to overreach. A stable belt grip limits their escape.',
  }[opponent.style];
}

function seededRandom(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let mixed = Math.imul(seed ^ seed >>> 15, seed | 1);
    mixed ^= mixed + Math.imul(mixed ^ mixed >>> 7, mixed | 61);
    return ((mixed ^ mixed >>> 14) >>> 0) / 4294967296;
  };
}

function rating(stats, tactic) {
  return STATS.reduce((total, stat, i) => total + stats[stat] * WEIGHTS[tactic][i], 0);
}

function pickFinish(wrestler, tactic, random) {
  if (TECHNIQUES[wrestler.signature].tactic === tactic || random() < 0.46) return wrestler.signature;
  if (TECHNIQUES[wrestler.alternate].tactic === tactic || random() < 0.6) return wrestler.alternate;
  return wrestler.signature;
}

export function simulateBout(career, training, tactic) {
  const opponent = nextOpponent(career);
  const wrestler = career.wrestler;
  const skills = { ...career.skills, [training]: Math.min(career.skills[training] + 1, MAX_STAT) };
  const random = seededRandom(career.seed ^ Math.imul(career.bouts + 1, 0x9e3779b9));
  const matchup = BEATS[tactic] === opponent.style ? 2 : BEATS[opponent.style] === tactic ? -2 : 0;
  const edge = rating(skills, tactic) - rating(opponent.stats, opponent.style)
    + matchup + (wrestler.style === tactic ? 0.85 : 0);
  const charge = clamp((edge + (random() - 0.5) * 5) * 0.082, -0.42, 0.42);
  const beats = [];
  let elapsed = 0;
  const add = (type, duration, details = {}) => {
    beats.push({ type, start: elapsed, duration, ...details });
    elapsed += duration;
  };
  add('entrance', 5.4);
  add('set', 1.85);
  add('charge', 1.12, { to: charge });

  let centre = charge;
  for (let i = 0; i < 6; i += 1) {
    const surge = clamp((edge + (random() - 0.5) * 12) * 0.16, -0.73, 0.73);
    const next = clamp(centre + surge, -1.82, 1.82);
    const driver = surge >= 0 ? 'east' : 'west';
    add('exchange', 1.45 + random() * 0.7, {
      from: centre, to: next, driver, action: driver === 'east' ? tactic : opponent.style,
    });
    centre = next;
    if (i >= 2 && Math.abs(centre) > 1.54) break;
  }

  const win = centre >= 0;
  const winner = win ? 'east' : 'west';
  const technique = win
    ? pickFinish(wrestler, tactic, random)
    : { drive: 'oshidashi', grip: random() > 0.45 ? 'yorikiri' : 'uwatenage', counter: 'hatakikomi' }[opponent.style];
  add('finish', 2.55, { from: centre, winner, technique });
  add('result', 2.15, { winner, technique });

  return {
    seed: career.seed, serial: career.bouts, meet: career.meet, rank: career.rank,
    wrestler: { ...wrestler }, opponent, training, tactic, skills, win, technique,
    trainingGain: skills[training] - career.skills[training],
    beats, duration: elapsed,
  };
}

export function recordBout(career, bout) {
  if (bout.seed !== career.seed || bout.serial !== career.bouts) return career;

  const card = [...career.card, { win: bout.win, opponent: bout.opponent.name, technique: bout.technique }];
  const cardWins = card.filter(result => result.win).length;
  const finished = card.length === CARD_SIZE;
  const promoted = finished && cardWins >= meetGoal(career.rank) && career.rank < RANKS.length - 1;
  const title = finished && cardWins === CARD_SIZE && career.rank >= RANKS.indexOf('Maegashira');

  return {
    ...career,
    rank: career.rank + Number(promoted),
    meet: career.meet + Number(finished),
    bouts: career.bouts + 1,
    wins: career.wins + Number(bout.win),
    titles: career.titles + Number(title),
    skills: { ...bout.skills },
    card: finished ? [] : card,
    latest: { bout, card, cardWins, finished, promoted, title },
  };
}

export function readCareer(saved) {
  const data = JSON.parse(saved ?? 'null');
  if (!data || data.version !== 1 || !RANKS[data.rank] || !Array.isArray(data.card)
    || !Number.isInteger(data.bouts) || !Number.isInteger(data.wins)
    || !Number.isInteger(data.meet) || !Number.isInteger(data.seed)
    || !Number.isInteger(data.titles) || !data.wrestler
    || !STATS.every(stat => Number.isFinite(data.skills?.[stat]))) return null;

  const { wrestler } = data;
  if (typeof wrestler.name !== 'string' || typeof wrestler.epithet !== 'string') return null;
  for (const [key, choices] of Object.entries({
    build: BUILDS, skin: SKINS, colour: COLOURS, style: TACTICS,
    signature: TECHNIQUES, alternate: TECHNIQUES, theme: THEMES, film: FILMS, walk: WALKS,
  })) {
    if (!Object.hasOwn(choices, wrestler[key])) return null;
  }
  if (data.latest && !Array.isArray(data.latest.bout?.beats)) data.latest = null;
  return data;
}
