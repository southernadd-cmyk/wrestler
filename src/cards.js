export const STAMINA = 3;
export const SPIRIT_CAP = 6;
export const EDGE = 4;
export const BRACE = -1;

export const CARDS = {
  thrust: { name: 'Palm Thrust', type: 'Attack', cost: 1, effect: 'push', value: 1, text: 'Push 1 step. A lead shove can interrupt a charge.' },
  drive: { name: 'Belt Drive', type: 'Attack', cost: 1, effect: 'drive', value: 1, text: 'Push 1 step, or 2 while you hold the belt.' },
  grip: { name: 'Belt Grip', type: 'Attack', cost: 1, effect: 'grip', text: 'Take the belt. Sets up stronger drives and throws.' },
  plant: { name: 'Plant Feet', type: 'Guard', cost: 1, effect: 'guard', value: 2, text: 'Absorb 2 steps of shove this exchange.' },
  sidestep: { name: 'Sidestep', type: 'Guard', cost: 1, effect: 'dodge', text: 'Lead to evade a rush or burst. Breaks a rival grip instead if held.' },
  gather: { name: 'Gather Spirit', type: 'Charge', cost: 1, effect: 'charge', value: 2, slow: true, text: 'Gain 2 Spirit if you hold your ground this exchange.' },
  thunder: { name: 'Thunder Palm', type: 'Special', cost: 2, spirit: 3, effect: 'burst', value: 3, slow: true, text: 'Release a 3-step blast. A shove can interrupt it.' },
  comet: { name: 'Comet Throw', type: 'Special', cost: 2, spirit: 3, effect: 'throw', needsGrip: true, slow: true, text: 'With a belt grip, throw the rival to the clay. A shove can interrupt it.' },
  mountain: { name: 'Mountain Anchor', type: 'Guard', cost: 1, effect: 'guard', value: 3, text: 'Absorb 3 steps of shove this exchange.' },
  slip: { name: 'Storm Step', type: 'Guard', cost: 1, effect: 'dodge', value: 1, text: 'Evade a rush or burst and gain 1 Spirit. Breaks a rival grip instead if held.' },
  quick: { name: 'Flash Breath', type: 'Charge', cost: 1, effect: 'charge', value: 1, text: 'Gain 1 Spirit immediately, even if you were shoved.' },
  'thrust+': { name: 'Driving Palm', type: 'Attack', cost: 1, effect: 'push', value: 2, text: 'Push 2 steps. A lead shove can interrupt a charge.' },
  'plant+': { name: 'Stone Feet', type: 'Guard', cost: 1, effect: 'guard', value: 3, text: 'Absorb 3 steps of shove this exchange.' },
  'gather+': { name: 'Deep Focus', type: 'Charge', cost: 1, effect: 'charge', value: 3, slow: true, text: 'Gain 3 Spirit if you hold your ground this exchange.' },
};

export const BASIC_BRACE = { name: 'Brace', type: 'Guard', cost: 1, effect: 'guard', value: 1, text: 'Absorb 1 step of shove. Available every exchange.' };

export const STARTER = ['thrust', 'thrust', 'drive', 'grip', 'plant', 'plant', 'sidestep', 'gather', 'gather', 'thunder'];
export const TRAINING = { thrust: 'thrust+', plant: 'plant+', gather: 'gather+' };

export const GEAR = {
  ironweave: { name: 'Ironweave Mawashi', colour: 'charcoal', text: 'Your first guard each exchange absorbs 1 extra step.' },
  storm: { name: 'Storm Stitch Mawashi', colour: 'jade', text: 'Gain 1 extra Spirit whenever you evade a rush or burst.' },
};

export const RIVALS = [
  { name: 'Aonami', epithet: 'The Blue Tide', stage: 'Qualifier', build: 'heavy', skin: 'light', colour: 'indigo', film: 'orbit', walk: 'measured',
    scout: 'Rushes straight ahead and leaves room to counter between charges.' },
  { name: 'Tetsumori', epithet: 'Iron Grove', stage: 'Semifinal', build: 'balanced', skin: 'warm', colour: 'charcoal', film: 'crest', walk: 'poised',
    scout: 'Works for a belt grip. A shove or sidestep can break his hold.' },
  { name: 'Koganeiwa', epithet: 'The Golden Comet', stage: 'Final', build: 'heavy', skin: 'deep', colour: 'ivory', film: 'ink', walk: 'brisk',
    scout: 'Opens with Meteor Palm, then charges it again. Read the tell and guard or evade the blast.' },
];

const INTENTS = {
  rush: { name: 'Opening Rush', kind: 'rush', value: 2, text: 'Pushes 2 steps. Lead with guard or a sidestep.' },
  palm: { name: 'Palm Thrust', kind: 'push', value: 1, text: 'Pushes 1 step. A guard can absorb it.' },
  grip: { name: 'Belt Grip', kind: 'grip', text: 'Takes the belt. A shove or sidestep can break it.' },
  drive: { name: 'Belt Drive', kind: 'drive', value: 2, text: 'Pushes 2 steps with a grip, or 1 if you break it first.' },
  guard: { name: 'Rooted Stance', kind: 'guard', value: 2, text: 'Guards against the first 2 steps of shove. A chance to gather Spirit.' },
  gather: { name: 'Gather Spirit', kind: 'charge', value: 3, text: 'Charges 3 Spirit. A lead shove interrupts it.' },
  meteor: { name: 'Meteor Palm', kind: 'burst', value: 3, text: 'Spends 3 Spirit to push 3 steps. Lead with a sidestep or enough guard.' },
  throw: { name: 'Overarm Throw', kind: 'throw', text: 'Throws from a belt grip. Break the grip with your lead card.' },
  recover: { name: 'Recover', kind: 'wait', text: 'Regains footing. Use the opening to move or charge.' },
};

export function intentFor(bout, round) {
  const turn = bout.turn - 1;
  if (round === 0) return INTENTS[['rush', 'recover', 'palm', 'guard'][turn % 4]];
  if (round === 1) {
    if (bout.grip === 'west') return INTENTS[bout.position <= -2 ? 'throw' : 'drive'];
    return INTENTS[['grip', 'palm', 'guard', 'grip'][turn % 4]];
  }
  if (bout.rivalSpirit >= 3) return INTENTS.meteor;
  return INTENTS[['gather', 'rush', 'guard', 'gather'][turn % 4]];
}

function shuffle(input, seed) {
  const cards = [...input];
  let rng = seed >>> 0;
  for (let i = cards.length - 1; i > 0; i -= 1) {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((rng / 2 ** 32) * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return { cards, rng };
}

function deal(bout) {
  let draw = [...bout.draw];
  let discard = [...bout.discard];
  let rng = bout.rng;
  if (draw.length < 5) {
    const shuffled = shuffle(discard, rng);
    draw = draw.concat(shuffled.cards);
    discard = [];
    rng = shuffled.rng;
  }
  const hand = draw.splice(0, 5);
  return { ...bout, hand, draw, discard, rng };
}

function newBout(deck, seed, round) {
  const { cards, rng } = shuffle(deck, seed ^ Math.imul(round + 1, 0x9e3779b9));
  const rivalSpirit = round === RIVALS.length - 1 ? 3 : 0;
  return deal({ turn: 1, position: 0, spirit: 0, rivalSpirit, grip: null, draw: cards, discard: [], rng, hand: [] });
}

export function newRun(seed = Math.floor(Math.random() * 2 ** 32)) {
  const deck = [...STARTER];
  return { seed, round: 0, phase: 'bout', deck, gear: null, bout: newBout(deck, seed, 0), last: [], winner: null };
}

export const cardAt = (bout, slot) => slot === BRACE ? BASIC_BRACE : CARDS[bout.hand[slot]];

export function planStatus(bout, plan) {
  let stamina = STAMINA;
  let spirit = bout.spirit;
  let grip = bout.grip;
  const spent = new Set();
  for (const slot of plan) {
    const card = cardAt(bout, slot);
    if (!Number.isInteger(slot) || !card || spent.has(slot)) return { stamina, issue: 'Choose each card once.' };
    if (stamina < card.cost) return { stamina, issue: 'You only have 3 stamina per exchange.' };
    if (card.needsGrip && grip !== 'east') return { stamina, issue: 'Play Belt Grip before Comet Throw.' };
    if (spirit < (card.spirit ?? 0)) return { stamina, issue: `${card.name} needs ${card.spirit} Spirit. Plan a charge first.` };
    stamina -= card.cost;
    spirit -= card.spirit ?? 0;
    if (card.effect === 'grip') grip = 'east';
    if (card.effect === 'charge') spirit = Math.min(SPIRIT_CAP, spirit + card.value);
    spent.add(slot);
  }
  return { stamina, issue: null };
}

export function resolveExchange(run, plan) {
  if (run.phase !== 'bout' || !plan.length || planStatus(run.bout, plan).issue) return run;

  const bout = { ...run.bout };
  const rival = RIVALS[run.round].name;
  const intent = intentFor(bout, run.round);
  const cards = plan.map(slot => cardAt(bout, slot));
  const events = [];
  let eastGuard = 0;
  let westGuard = 0;
  let sidestep = null;
  let guarded = false;
  let eastMoved = false;
  let westMoved = false;
  let winner = null;

  function emit(kind, side, move, text, details = {}) {
    events.push({ kind, side, move, text, from: bout.position, to: bout.position, ...details });
  }

  function shove(side, amount, move, kind) {
    const east = side === 'east';
    if (!east && sidestep && ['rush', 'burst'].includes(kind)) {
      const bonus = Math.min(SPIRIT_CAP - bout.spirit, (sidestep.value ?? 0) + Number(run.gear === 'storm'));
      bout.spirit += bonus;
      emit('evade', 'east', sidestep.name, `You slip past ${rival}’s ${move}.${bonus ? ` +${bonus} Spirit.` : ''}`, { source: kind });
      sidestep = null;
      return;
    }

    const guard = east ? westGuard : eastGuard;
    const absorbed = Math.min(amount, guard);
    const travel = amount - absorbed;
    if (east) westGuard -= absorbed;
    else eastGuard -= absorbed;
    if (!travel) {
      emit('block', east ? 'west' : 'east', move, `${east ? rival : 'You'} ${east ? 'absorbs' : 'absorb'} the shove.`, { source: kind, strength: amount });
      return;
    }

    const from = bout.position;
    const to = Math.max(-EDGE, Math.min(EDGE, from + (east ? travel : -travel)));
    const brokeGrip = bout.grip === (east ? 'west' : 'east');
    if (brokeGrip) bout.grip = null;
    bout.position = to;
    if (east) westMoved = true;
    else eastMoved = true;
    if (Math.abs(to) === EDGE) winner = side;

    const actor = east ? 'You' : rival;
    const step = travel === 1 ? 'step' : 'steps';
    const text = winner
      ? `${move} sends ${east ? rival : 'you'} past the straw.`
      : `${actor} ${east ? 'push' : 'pushes'} ${Math.abs(to - from)} ${step}.${absorbed ? ` Guard absorbed ${absorbed}.` : ''}${brokeGrip ? ' The grip breaks.' : ''}`;
    emit(winner ? 'out' : kind, side, move, text, { from, to, source: kind, strength: amount, winner });
  }

  function throwRival(side, name) {
    winner = side;
    emit('throw', side, name, `${side === 'east' ? rival : 'You'} ${side === 'east' ? 'touches' : 'touch'} the clay first.`,
      { winner, source: side === 'east' ? 'burst' : 'throw' });
  }

  function playCard(card) {
    const { name, effect, value, spirit = 0 } = card;
    if ((card.slow && eastMoved) || (card.needsGrip && bout.grip !== 'east') || bout.spirit < spirit) {
      const reason = card.slow && eastMoved ? 'the shove breaks your stance' : card.needsGrip && bout.grip !== 'east' ? 'you lose the belt grip' : 'you lack the Spirit';
      emit('interrupt', 'east', name, `${name} fails when ${reason}.`);
      return;
    }
    bout.spirit -= spirit;
    switch (effect) {
      case 'push':
      case 'burst':
        shove('east', value, name, effect);
        break;
      case 'drive':
        shove('east', bout.grip === 'east' ? value + 1 : value, name, 'push');
        break;
      case 'grip':
        bout.grip = 'east';
        emit('grip', 'east', name, 'You establish the belt grip.');
        break;
      case 'guard': {
        const bonus = Number(!guarded && run.gear === 'ironweave');
        eastGuard += value + bonus;
        guarded = true;
        emit('guard', 'east', name, `You set your stance for ${value + bonus} steps of guard.`);
        break;
      }
      case 'dodge':
        if (bout.grip === 'west') {
          bout.grip = null;
          emit('escape', 'east', name, 'You break the rival’s belt grip.');
        } else {
          sidestep = card;
          emit('dodge', 'east', name, 'You get ready to move off the line.');
        }
        break;
      case 'charge': {
        const gain = Math.min(SPIRIT_CAP - bout.spirit, value);
        bout.spirit += gain;
        emit('charge', 'east', name, `You gather ${gain} Spirit.`);
        break;
      }
      case 'throw':
        throwRival('east', name);
        break;
    }
  }

  function rivalAction() {
    const { kind, value, name } = intent;
    switch (kind) {
      case 'push':
      case 'rush':
        shove('west', value, name, kind);
        break;
      case 'burst':
        bout.rivalSpirit -= 3;
        shove('west', value, name, kind);
        break;
      case 'drive':
        shove('west', bout.grip === 'west' ? value : 1, name, 'push');
        break;
      case 'grip':
        if (westMoved) {
          emit('interrupt', 'west', name, 'Your lead shove stops the rival taking the belt.');
        } else {
          bout.grip = 'west';
          emit('grip', 'west', name, `${rival} takes your belt.`);
        }
        break;
      case 'throw':
        if (bout.grip === 'west') throwRival('west', name);
        else emit('interrupt', 'west', name, `${rival} loses the grip before the throw.`);
        break;
      case 'guard':
        westGuard += value;
        emit('guard', 'west', name, `${rival} roots their feet.`);
        break;
      case 'charge':
        if (westMoved) {
          emit('interrupt', 'west', name, 'Your lead shove interrupts the rival’s charge.');
        } else {
          bout.rivalSpirit = Math.min(SPIRIT_CAP, bout.rivalSpirit + value);
          emit('charge', 'west', name, `${rival} gathers ${value} Spirit. A burst is coming.`);
        }
        break;
      case 'wait':
        emit('wait', 'west', name, `${rival} resets their stance.`);
        break;
    }
  }

  const lead = cards.shift();
  const rivalActsFirst = intent.kind === 'guard' || lead.slow;
  if (rivalActsFirst) rivalAction();
  if (!winner) playCard(lead);
  if (!winner && !rivalActsFirst) rivalAction();
  for (const card of cards) {
    if (winner) break;
    playCard(card);
  }

  if (!winner) {
    return { ...run, bout: deal({ ...bout, turn: bout.turn + 1, discard: [...bout.discard, ...bout.hand] }), last: events };
  }
  const phase = winner === 'west' ? 'lost' : ['draft', 'camp', 'won'][run.round];
  return { ...run, bout, phase, last: events, winner };
}

export function draftOptions(run) {
  const pool = shuffle(['mountain', 'slip', 'quick'], run.seed ^ 0x61c88647).cards;
  return ['comet', ...pool.slice(0, 2)];
}

function advance(run, deck, gear) {
  const round = run.round + 1;
  return { ...run, deck, gear, round, phase: 'bout', winner: null, bout: newBout(deck, run.seed, round), last: [] };
}

export function chooseDraft(run, pick) {
  if (run.phase !== 'draft' || (pick !== 'skip' && !draftOptions(run).includes(pick))) return run;
  const deck = pick === 'skip' ? run.deck : [...run.deck, pick];
  return advance(run, deck, run.gear);
}

export function chooseCamp(run, pick) {
  if (run.phase !== 'camp') return run;
  if (Object.hasOwn(GEAR, pick)) return advance(run, run.deck, pick);
  const index = run.deck.indexOf(pick);
  if (index < 0 || !Object.hasOwn(TRAINING, pick)) return run;
  const deck = [...run.deck];
  deck[index] = TRAINING[pick];
  return advance(run, deck, run.gear);
}
