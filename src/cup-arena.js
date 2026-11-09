import { createBroadcast } from './broadcast.js';
import { BUILDS, COLOURS, SKINS } from './career.js';

const ease = value => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

function overheadView(canvas) {
  const ink = canvas.getContext('2d');
  if (!ink) return () => {};

  function ellipse(x, y, rx, ry, colour, rotation = 0) {
    ink.beginPath();
    ink.ellipse(x, y, rx, ry, rotation, 0, 2 * Math.PI);
    ink.fillStyle = colour;
    ink.fill();
  }

  function fighter(x, y, side, wrestler, motion) {
    const belt = COLOURS[wrestler.colour].value;
    const skin = SKINS[wrestler.skin];
    const scale = BUILDS[wrestler.build].width;
    ink.save();
    ink.translate(x, y);
    ink.rotate(motion.angle);
    ink.scale(scale, 1);
    ellipse(0, 0.28, 0.43, 0.20, '#30222c65');
    ellipse(-0.14, -0.24, 0.24, 0.125, skin, -0.12);
    ellipse(-0.14, 0.24, 0.24, 0.125, skin, 0.12);
    ellipse(0, 0, 0.32, 0.39, skin);
    ellipse(-0.18, 0, 0.14, 0.37, belt);
    const reach = 0.15 + motion.reach * 0.23;
    ellipse(reach, -0.31, 0.23, 0.12, skin, 0.19);
    ellipse(reach, 0.31, 0.23, 0.12, skin, -0.19);
    ellipse(0.28, 0, 0.19, 0.18, skin);
    ellipse(0.26, 0, 0.145, 0.15, '#29202b');
    ellipse(0.22, 0, 0.068, 0.07, '#3b2931');
    ink.restore();
    ellipse(x, y + 0.64, 0.11, 0.07, side === 'east' ? '#ffc283' : '#b9acff');
  }

  return (wrestler, opponent, event, progress, position, reducedMotion) => {
    const { width, height } = canvas.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    const ratio = Math.min(1.65, window.devicePixelRatio);
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    const background = ink.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, '#251d35');
    background.addColorStop(1, '#100e17');
    ink.fillStyle = background;
    ink.fillRect(0, 0, width, height);
    const scale = Math.min(width / 8.9, height / 5.25);
    ink.translate(width / 2, height * 0.51);
    ink.scale(scale, scale * 0.83);
    ellipse(0, 0.1, 4.35, 2.86, '#100d169a');

    for (const side of [-1, 1]) {
      for (let seat = 0; seat < 22; seat += 1) {
        const x = (seat - 10.5) * 0.38;
        const y = side * (2.46 + 0.11 * Math.cos(seat * 1.7));
        ellipse(x, y, 0.10, 0.09, seat % 3 === 0 ? '#534162' : '#3c2d4b');
      }
    }

    ink.fillStyle = '#754b45';
    ink.fillRect(-3.18, -2.04, 6.36, 4.18);
    ink.fillStyle = '#ad795a';
    ink.fillRect(-3.18, -2.17, 6.36, 4.16);
    ellipse(0, -0.04, 2.73, 2.03, '#d9a779');
    ellipse(0, -0.04, 2.53, 1.86, '#c8936b');

    for (let i = 0; i < 40; i += 1) {
      const a = i / 40 * 2 * Math.PI;
      ellipse(2.65 * Math.cos(a), 1.95 * Math.sin(a) - 0.04, 0.165, 0.057,
        i % 2 ? '#e3b884' : '#f1cb90', a + Math.PI / 2);
    }
    ink.strokeStyle = '#f9d5a6b0';
    ink.lineWidth = 0.028;
    for (const x of [-0.36, 0.36]) {
      ink.beginPath();
      ink.moveTo(x, -0.27);
      ink.lineTo(x, 0.23);
      ink.stroke();
    }

    const p = Math.max(0, Math.min(1, progress));
    const drift = ease((p - 0.12) / 0.78);
    const pulse = Math.sin(p * Math.PI);
    const centre = 0.54 * (event ? event.from + (event.to - event.from) * drift : position);
    const kind = event?.kind;
    const shove = ['push', 'rush', 'burst', 'out', 'block'].includes(kind);
    for (const side of ['east', 'west']) {
      const east = side === 'east';
      const direction = east ? -1 : 1;
      const actor = event?.side === side;
      const striker = kind === 'block' ? !actor : actor;
      const dropped = kind === 'throw' && !actor;
      const dodge = actor && ['dodge', 'evade', 'escape'].includes(kind);
      let x = centre + direction * 0.61;
      if (kind === 'out') x += 0.55 * Math.sign(event.to) * drift;
      const y = (dodge ? -0.58 * pulse : 0) + (dropped ? 0.60 * drift : 0);
      const power = (kind === 'charge' && actor) || (event?.source === 'burst' && striker);
      if (power && p < 1) {
        const spread = reducedMotion ? 0.52 : 0.35 + drift * 0.65;
        ink.strokeStyle = east ? '#fff0ae' : '#ddd1ff';
        ink.lineWidth = 0.032;
        ink.globalAlpha = pulse * 0.9;
        for (const offset of [0, 0.14, 0.26]) {
          ink.beginPath();
          ink.ellipse(x, y, spread + offset, (spread + offset) * 0.75, 0, 0, 2 * Math.PI);
          ink.stroke();
        }
        ink.globalAlpha = 1;
      }
      fighter(x, y, side, east ? wrestler : opponent, {
        angle: (east ? 0 : Math.PI) + (dropped ? drift * 1.2 : dodge ? pulse * 0.40 : 0),
        reach: (shove && striker) || (actor && kind === 'grip') ? pulse : 0,
      });
    }
  };
}

export function createCupArena(canvas, fallback) {
  let draw;
  let view = 'RINGSIDE';
  function switchToOverhead() {
    canvas.hidden = true;
    fallback.hidden = false;
    draw = overheadView(fallback);
    view = 'OVERHEAD';
  }
  try {
    const context = canvas.getContext('webgl2', { antialias: true });
    if (context) {
      draw = createBroadcast(canvas, context).cardExchange;
      canvas.addEventListener('webglcontextlost', event => {
        event.preventDefault();
        switchToOverhead();
      });
    } else {
      switchToOverhead();
    }
  } catch {
    switchToOverhead();
  }
  return {
    draw(...args) { draw(...args); },
    get view() { return view; },
  };
}
