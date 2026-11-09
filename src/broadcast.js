import * as THREE from 'three';
import { makeArena, makeReferee, RING_RADIUS } from './arena.js';
import { makeRikishi } from './rikishi.js';
import { COLOURS, TECHNIQUES } from './career.js';

const HALF_GAP = 0.54;
const START_GAP = 1.44;
const TURN = Math.PI / 2;
const lerp = THREE.MathUtils.lerp;
const limit = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const ease = value => {
  const t = limit(value);
  return t * t * (3 - 2 * t);
};

export function currentBeat(bout, seconds) {
  return bout.beats.findLast(beat => beat.start <= seconds) ?? bout.beats[0];
}

function entrancePose(side, progress, walk) {
  const offset = walk === 'poised' ? 0.18 : 0;
  const walkEnd = walk === 'brisk' ? 0.51 : 0.73;
  const distance = ease((progress - offset) / (walkEnd - offset));
  return {
    x: side * lerp(3.27, START_GAP, distance),
    z: side * lerp(0.26, 0.03, distance),
    yaw: -side * TURN + (1 - distance) * side * 0.2,
    step: Math.sin(distance * Math.PI) * 0.91,
    gait: distance * Math.PI * 6,
    bow: Math.sin(Math.PI * limit((progress - walkEnd) / (1 - walkEnd))),
  };
}

export function createBroadcast(canvas, context) {
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(41, 1, 0.05, 40);
  const arena = makeArena(scene);
  const east = makeRikishi(scene);
  const west = makeRikishi(scene);
  const referee = makeReferee(scene);
  let previousEast;
  let previousWest;
  let spiritRings;

  function dress(player, opponent) {
    if (player !== previousEast) east.dress(player);
    if (opponent && opponent !== previousWest) west.dress(opponent);
    previousEast = player;
    previousWest = opponent;
    west.root.visible = Boolean(opponent);
    referee.root.visible = Boolean(opponent);
  }

  function shoot(x, y, z, targetX, targetY, targetZ) {
    camera.position.set(x, y, z);
    camera.lookAt(targetX, targetY, targetZ);
    renderer.render(scene, camera);
  }

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  function portrait(wrestler, time, entranceTime) {
    dress(wrestler);
    const accent = COLOURS[wrestler.colour].value;
    const previewing = entranceTime !== null;
    arena.billboard(previewing ? entranceTime : 0, wrestler.film, wrestler.name, accent);
    if (previewing) {
      const pose = entrancePose(-1, limit(entranceTime / 5.4), wrestler.walk);
      east.pose(pose);
      shoot(pose.x * 0.28 - 0.35, 2.45, 6.9, pose.x * 0.75, 0.87, 0);
      return;
    }
    east.pose({ yaw: 0.3 + Math.sin(time * 0.70) * 0.22, reach: 0.02 });
    shoot(0.35, 1.68, 4.28, 0, 0.99, 0);
  }

  function duel(centre, gap, stance) {
    east.pose({ x: centre - gap, yaw: TURN, ...stance('east') });
    west.pose({ x: centre + gap, yaw: -TURN, ...stance('west') });
    referee.position(centre);
  }

  function finish(beat, t) {
    const technique = TECHNIQUES[beat.technique];
    const eastWon = beat.winner === 'east';
    const direction = eastWon ? 1 : -1;
    const windup = ease(t / 0.24);
    const release = ease((t - 0.18) / 0.62);
    const settle = ease((t - 0.82) / 0.18);
    const move = (side, rig) => {
      const won = side === beat.winner;
      const isEast = side === 'east';
      const start = beat.from + (isEast ? -HALF_GAP : HALF_GAP);
      const yaw = isEast ? TURN : -TURN;
      const grip = technique.tactic === 'grip' ? 0.77 : 0;
      if (technique.kind === 'out') {
        const target = won ? (RING_RADIUS - 0.54) * direction : (RING_RADIUS + 0.66) * direction;
        rig.pose({
          x: lerp(start, target, release),
          z: (won ? -0.10 : 0.10) * release,
          yaw,
          crouch: (won ? 0.39 : 0.30) * (1 - settle),
          reach: (won ? 0.76 : 0.40) * windup * (1 - settle),
          grip: grip * (1 - settle),
          recoil: won ? 0 : Math.sin(release * Math.PI * 0.74) * 0.95,
          step: Math.sin(release * Math.PI) * 0.88,
          gait: t * 23,
        });
        return;
      }
      const throwing = technique.kind === 'throw';
      const fall = won ? 0 : release * (throwing ? -1 : 1);
      rig.pose({
        x: lerp(start, limit(start + direction * (won ? 0.25 : 0.42), -2.28, 2.28), release),
        z: (won ? -0.22 : 0.80) * release,
        yaw: yaw + (won ? -0.36 : throwing ? -0.73 : 0.25) * direction * release,
        crouch: (won ? 0.36 : 0.30) * (1 - release),
        twist: direction * (won ? -0.42 : 0.54) * Math.sin(release * Math.PI),
        fall, roll: (won ? 0 : 0.64) * release * direction,
        reach: (won ? 0.76 : 0.52) * windup * (1 - 0.68 * release),
        grip: grip * windup * (1 - release),
      });
    };
    move('east', east);
    move('west', west);
    const cameraCentre = technique.kind === 'out' ? lerp(beat.from, direction * 1.42, release) : beat.from;
    referee.position(cameraCentre, t >= 0.8 ? beat.winner : null);
    return cameraCentre;
  }

  function match(bout, time) {
    dress(bout.wrestler, bout.opponent);
    const beat = currentBeat(bout, time);
    const p = limit((time - beat.start) / beat.duration);
    const portraitName = beat.type === 'entrance' ? bout.wrestler.name : 'TOURNAMENT HALL';
    arena.billboard(beat.type === 'entrance' ? p * beat.duration : 0, bout.wrestler.film,
      portraitName, COLOURS[bout.wrestler.colour].value);

    switch (beat.type) {
      case 'entrance':
        east.pose(entrancePose(-1, p, bout.wrestler.walk));
        west.pose(entrancePose(1, p, 'measured'));
        referee.position(0);
        shoot(0.8 - p * 1.8, 3.02 + p * 0.61, 8.7 - p * 0.58, 0, 0.98, 0);
        break;
      case 'set':
        duel(0, START_GAP, () => ({ crouch: 0.89 * ease(p / 0.66), reach: 0.12 * p }));
        shoot(-0.62, 2.3, 7.15, 0, 0.66, 0);
        break;
      case 'charge': {
        const rush = ease(p / 0.72);
        duel(beat.to * rush, lerp(START_GAP, HALF_GAP, rush), () => ({
          crouch: lerp(0.89, 0.42, rush),
          step: Math.sin(Math.PI * rush) * 0.77, gait: p * Math.PI * 5,
          reach: lerp(0.12, 0.62, rush), recoil: Math.sin(Math.PI * ease((p - 0.61) / 0.39)) * 0.61,
        }));
        shoot(-0.62 + p * 0.47, 2.37 + p * 0.55, 7.15, beat.to * rush, 0.64, 0);
        break;
      }
      case 'exchange': {
        const swing = ease(p);
        const centre = lerp(beat.from, beat.to, swing);
        const advance = Math.sin(Math.PI * swing);
        const grip = beat.action === 'grip';
        const counter = beat.action === 'counter';
        duel(centre, HALF_GAP - advance * 0.04, side => {
          const driver = side === beat.driver;
          return {
            crouch: 0.42 + (driver ? 0.09 : -0.06) * advance,
            step: advance * 0.67, gait: p * Math.PI * 6,
            reach: 0.62 + (driver ? 0.18 : -0.11) * advance,
            grip: grip ? 0.75 * advance : 0,
            twist: counter ? (driver ? 0.49 : -0.29) * advance : 0,
            recoil: driver ? 0 : advance * 0.51,
            z: (side === 'east' ? -1 : 1) * advance * (counter ? 0.22 : 0.075),
          };
        });
        shoot(centre * 0.40 + 0.32, 3.45, 7.46, centre * 0.73, 0.75, 0);
        break;
      }
      case 'finish': {
        const centre = finish(beat, p);
        shoot(centre * 0.42 + 0.29, 3.57, 7.80, centre * 0.82, 0.76, 0.12);
        break;
      }
      case 'result': {
        const centre = finish(bout.beats.at(-2), 1);
        shoot(centre * 0.42 + 0.29 - p * 0.45, 3.57 + p * 0.29, 7.8 + p * 0.31, centre * 0.82, 0.76, 0.12);
        break;
      }
    }
  }

  function powerRings(event, p, centre, reducedMotion) {
    const powered = event?.kind === 'charge' || event?.source === 'burst';
    if (!powered) {
      if (spiritRings) spiritRings.visible = false;
      return;
    }
    if (!spiritRings) {
      spiritRings = new THREE.Group();
      const geometry = new THREE.TorusGeometry(1, 0.024, 8, 36);
      for (let i = 0; i < 3; i += 1) {
        const material = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false });
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = -Math.PI / 2;
        spiritRings.add(ring);
      }
      scene.add(spiritRings);
    }
    const side = event.kind === 'block' || event.kind === 'evade'
      ? event.side === 'east' ? 'west' : 'east'
      : event.side;
    const burst = event.source === 'burst';
    spiritRings.visible = p < 1;
    spiritRings.position.x = centre + (side === 'east' ? -HALF_GAP : HALF_GAP);
    spiritRings.children.forEach((ring, i) => {
      const spread = burst ? ease((p - 0.25) / 0.7) : 1 - ease(p);
      ring.scale.setScalar((reducedMotion ? 0.7 : 0.28 + spread * (burst ? 1.7 : 0.62)) + i * 0.10);
      ring.position.y = 0.12 + i * (burst ? 0.15 : 0.37);
      ring.material.color.set(side === 'east' ? '#f7b56f' : '#aa9cff');
      ring.material.opacity = Math.sin(p * Math.PI) * (reducedMotion ? 0.32 : 0.76) * (1 - 0.18 * i);
    });
  }

  function cardExchange(wrestler, opponent, event, progress, position, reducedMotion) {
    dress(wrestler, opponent);
    arena.billboard(0, wrestler.film, 'SPIRIT CUP', COLOURS[wrestler.colour].value);
    const p = limit(progress);
    const kind = event?.kind;
    const cinematic = kind === 'out' || kind === 'throw';
    let centre = 0.54 * (event ? lerp(event.from, event.to, ease((p - 0.16) / 0.74)) : position);
    if (cinematic) {
      const technique = kind === 'throw' ? 'uwatenage' : 'oshidashi';
      centre = finish({ from: event.from * 0.54, winner: event.winner, technique }, p);
    } else {
      const pulse = Math.sin(Math.PI * p);
      const strike = ['push', 'rush', 'burst', 'block'].includes(kind);
      duel(centre, HALF_GAP, side => {
        const acting = event?.side === side;
        const pushing = kind === 'block' ? !acting : acting;
        const dodging = acting && (kind === 'evade' || kind === 'dodge' || kind === 'escape');
        return {
          crouch: 0.29 + (acting && ['guard', 'block', 'charge'].includes(kind) ? pulse * 0.37 : 0),
          reach: strike && pushing ? 0.25 + pulse * 0.58 : acting && kind === 'grip' ? pulse * 0.57 : 0.20,
          grip: acting && kind === 'grip' ? pulse * 0.85 : 0,
          step: strike && event.from !== event.to ? pulse * 0.83 : dodging ? pulse * 0.51 : 0,
          gait: p * Math.PI * 5,
          recoil: strike && !pushing && kind !== 'block' ? pulse * 0.8 : acting && kind === 'interrupt' ? pulse * 0.55 : 0,
          twist: dodging ? pulse * 0.55 : 0,
          z: dodging ? pulse * 0.57 * (side === 'east' ? 1 : -1) : 0,
        };
      });
    }
    powerRings(event, p, centre, reducedMotion);
    const zoom = cinematic && !reducedMotion ? Math.sin(Math.PI * p) * 0.45 : 0;
    const aspect = Math.min(1.5, camera.aspect);
    shoot(centre * 0.42 + 0.26, 3.52, 7.3 + (1.5 - aspect) * 2.5 - zoom, centre * 0.66, 0.66, 0);
  }

  return { portrait, match, cardExchange };
}
