import * as THREE from 'three';
import { block, material, mesh } from './rikishi.js';

export const RING_RADIUS = 2.67;
const CYLINDER = new THREE.CylinderGeometry(1, 1, 1, 36);
const CLAY = material('#b6855b');
const SAND = material('#cc9c6c');
const EDGE = material('#956445');
const STRAW = [material('#e0ba75'), material('#cfa463'), material('#e5c787')];
const WOOD = material('#2e2524');
const BRASS = material('#70503b');
const DARK = material('#141922');

function circle(parent, mat, x, y, z, sx, sy, sz) {
  return mesh(parent, CYLINDER, mat, x, y, z, sx, sy, sz);
}

function makeBillboard(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(7.0, 1.75),
    new THREE.MeshBasicMaterial({ map: texture }),
  );
  board.position.set(0, 3.18, -5.94);
  scene.add(board);
  block(scene, WOOD, 0, 3.18, -6.01, 7.11, 1.86, 0.11);

  let previous = '';
  function paint(time, film, name, accent) {
    const frame = Math.floor(time * 16);
    const key = [frame, film, name, accent].join('|');
    if (key === previous) return;
    previous = key;
    ctx.fillStyle = '#1d1c22';
    ctx.fillRect(0, 0, 768, 192);
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = accent;
    ctx.fillStyle = accent;

    if (film === 'orbit') {
      for (let i = 0; i < 7; i += 1) {
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.arc(565, 100, 20 + i * 26 + frame % 32, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (film === 'crest') {
      ctx.save();
      ctx.translate(614, 96);
      ctx.rotate(frame * 0.013);
      ctx.lineWidth = 4;
      for (let i = 0; i < 3; i += 1) {
        ctx.rotate(Math.PI / 3);
        ctx.strokeRect(-65, -65, 130, 130);
      }
      ctx.restore();
    } else {
      for (let i = 0; i < 12; i += 1) {
        const x = 310 + (i * 51 + frame * 3) % 520;
        ctx.save();
        ctx.translate(x, 0);
        ctx.transform(1, 0, -0.46, 1, 0, 0);
        ctx.fillRect(0, 0, 18 + i % 4 * 7, 192);
        ctx.restore();
      }
    }

    ctx.globalAlpha = 1;
    const gradient = ctx.createLinearGradient(0, 0, 720, 0);
    gradient.addColorStop(0, '#1d1c22');
    gradient.addColorStop(0.5, '#1d1c22ed');
    gradient.addColorStop(1, '#1d1c2200');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 768, 192);
    ctx.fillStyle = '#f4e5cf';
    ctx.font = 'bold 58px sans-serif';
    ctx.fillText(name.toLocaleUpperCase(), 39, 111, 680);
    ctx.fillStyle = '#ffcd8a';
    ctx.font = 'bold 17px monospace';
    ctx.fillText('D O H Y Ō   /   B O U T   H A L L', 42, 150);
    texture.needsUpdate = true;
  }
  return paint;
}

function makeCrowd(scene) {
  const dummy = new THREE.Object3D();
  const audience = new THREE.Group();
  const jacket = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 8, 6),
    material('#ffffff'), 104,
  );
  const head = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 8, 6),
    material('#ffffff'), 104,
  );
  const colours = ['#394052', '#634745', '#374955', '#6e5945', '#3e384d', '#58655e'];
  const tones = ['#886f62', '#a58a72', '#785949', '#b09174'];
  let index = 0;
  for (let row = 0; row < 4; row += 1) {
    for (let seat = 0; seat < 26; seat += 1) {
      const x = (seat - 12.5) * 0.65;
      const z = -7 - row * 0.89 + Math.sin(seat * 2.1) * 0.13;
      const y = 0.39 + row * 0.48 + Math.sin(seat * 1.4 + row) * 0.12;
      dummy.position.set(x, y, z);
      dummy.scale.set(0.25, 0.31, 0.18);
      dummy.updateMatrix();
      jacket.setMatrixAt(index, dummy.matrix);
      jacket.setColorAt(index, new THREE.Color(colours[(seat * 7 + row * 3) % colours.length]));
      dummy.position.y += 0.36;
      dummy.scale.set(0.125, 0.155, 0.118);
      dummy.updateMatrix();
      head.setMatrixAt(index, dummy.matrix);
      head.setColorAt(index, new THREE.Color(tones[(seat + row * 7) % tones.length]));
      index += 1;
    }
    block(scene, DARK, 0, -0.03 + row * 0.48, -7.15 - row * 0.89, 19, 0.33, 0.91);
  }
  audience.add(jacket, head);
  scene.add(audience);
}

export function makeArena(scene) {
  scene.background = new THREE.Color('#161823');
  scene.fog = new THREE.Fog('#161823', 10, 22);

  const hemi = new THREE.HemisphereLight('#f4e0c5', '#574c62', 2.3);
  scene.add(hemi);
  const spot = new THREE.DirectionalLight('#ffe0b1', 2.25);
  spot.position.set(-3.4, 7.2, 3.5);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.camera.left = -5.3;
  spot.shadow.camera.right = 5.3;
  spot.shadow.camera.top = 5.3;
  spot.shadow.camera.bottom = -5.3;
  spot.shadow.normalBias = 0.023;
  scene.add(spot);
  const rim = new THREE.DirectionalLight('#a1bbff', 1.6);
  rim.position.set(3.7, 4.2, -5.3);
  scene.add(rim);

  block(scene, DARK, 0, -0.57, 0, 38, 0.14, 30);
  block(scene, EDGE, 0, -0.282, 0, 7.65, 0.56, 7.65);
  block(scene, CLAY, 0, -0.072, 0, 7.7, 0.14, 7.7);
  circle(scene, SAND, 0, 0.001, 0, RING_RADIUS, 0.01, RING_RADIUS);
  for (const side of [-1, 1]) {
    block(scene, EDGE, side * 4.12, -0.398, 0, 0.57, 0.31, 1.5);
    block(scene, CLAY, side * 4.02, -0.296, 0, 0.37, 0.15, 1.5);
  }
  const startLine = material('#ead9b7');
  for (const x of [-0.37, 0.37]) {
    block(scene, startLine, x, 0.012, 0, 0.045, 0.006, 0.49);
  }
  for (let i = 0; i < 38; i += 1) {
    const angle = i / 38 * Math.PI * 2;
    const bale = circle(scene, STRAW[i % STRAW.length], RING_RADIUS * Math.cos(angle), 0.027,
      RING_RADIUS * Math.sin(angle), 0.072, 0.435, 0.072);
    bale.rotation.set(Math.PI / 2, 0, angle);
    for (const offset of [-0.14, 0.14]) {
      const binding = circle(scene, STRAW[1], bale.position.x - Math.sin(angle) * offset, 0.031,
        bale.position.z + Math.cos(angle) * offset, 0.074, 0.023, 0.074);
      binding.rotation.copy(bale.rotation);
    }
  }

  for (const side of [-1, 1]) {
    block(scene, WOOD, side * 4.2, 1.61, -5.96, 0.25, 4.42, 0.32);
    block(scene, BRASS, side * 4.2, 3.91, -5.96, 0.38, 0.11, 0.41);
    block(scene, WOOD, side * 7.3, 1.41, -5.12, 5.85, 2.9, 0.13);
    for (let i = 0; i < 7; i += 1) {
      block(scene, BRASS, side * (4.7 + i * 0.66), 1.41, -5.01, 0.029, 2.9, 0.052);
    }
  }
  block(scene, WOOD, 0, 4.25, -5.95, 9.4, 0.23, 0.47);
  block(scene, BRASS, 0, 4.41, -5.94, 9.8, 0.078, 0.42);
  makeCrowd(scene);

  return { billboard: makeBillboard(scene), spot };
}

export function makeReferee(scene) {
  const root = new THREE.Group();
  const robes = material('#333b5c');
  const trim = material('#c6b791');
  const skin = material('#ae7b5c');
  const hat = material('#29242d');
  const fan = new THREE.Group();
  root.add(fan);
  scene.add(root);
  root.scale.setScalar(0.89);
  circle(root, robes, 0, 0.38, 0, 0.239, 0.77, 0.215);
  circle(root, robes, 0, 0.95, 0, 0.241, 0.48, 0.184);
  circle(root, trim, 0, 0.728, 0, 0.244, 0.074, 0.219);
  circle(root, skin, 0, 1.29, 0.004, 0.124, 0.194, 0.114);
  circle(root, hat, 0, 1.457, -0.009, 0.115, 0.17, 0.102);
  block(root, trim, 0, 1.061, 0.173, 0.04, 0.27, 0.021).rotation.z = -0.38;
  block(fan, robes, 0.14, 0, 0, 0.34, 0.15, 0.19);
  block(fan, trim, 0.36, 0, 0, 0.16, 0.033, 0.036);
  circle(fan, BRASS, 0.48, 0.035, 0, 0.113, 0.034, 0.148).rotation.x = Math.PI / 2;
  fan.position.set(0, 0.98, 0.13);

  return {
    root,
    position(centre, winner) {
      root.position.set(centre * 0.48, 0, -1.68);
      fan.rotation.z = winner ? (winner === 'east' ? Math.PI - 0.20 : 0.20) : 1.40;
    },
  };
}
