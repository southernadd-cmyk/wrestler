import * as THREE from 'three';
import { BUILDS, COLOURS, SKINS } from './career.js';

const sphere = new THREE.SphereGeometry(1, 20, 14);
const box = new THREE.BoxGeometry(1, 1, 1);
const band = new THREE.CylinderGeometry(1, 1, 1, 36);

export function material(colour, roughness = 0.82) {
  return new THREE.MeshStandardMaterial({ color: colour, roughness });
}

export function mesh(parent, geometry, mat, x, y, z, sx, sy, sz) {
  const object = new THREE.Mesh(geometry, mat);
  object.position.set(x, y, z);
  object.scale.set(sx, sy, sz);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

export function block(parent, mat, x, y, z, sx, sy, sz) {
  return mesh(parent, box, mat, x, y, z, sx, sy, sz);
}

function shape(parent, mat, x, y, z, sx, sy, sz) {
  return mesh(parent, sphere, mat, x, y, z, sx, sy, sz);
}

function joint(parent, x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  parent.add(group);
  return group;
}

export function makeRikishi(scene) {
  const root = joint(scene, 0, 0, 0);
  const body = joint(root, 0, 0.81, 0);
  const chest = joint(body, 0, 0, 0);
  const skin = material('#c28a67', 0.72);
  const shade = material('#9a6649');
  const hair = material('#242020');
  const eyes = material('#f1dfc6');
  const belt = material('#be432f');
  const beltShade = material('#753126');

  shape(chest, skin, 0, 0.28, 0.015, 0.465, 0.45, 0.352);
  shape(chest, skin, 0, 0.16, 0.13, 0.428, 0.31, 0.314);
  shape(chest, skin, 0, 0.48, -0.035, 0.477, 0.238, 0.294);
  shape(body, beltShade, 0, -0.06, 0, 0.37, 0.21, 0.271);
  mesh(body, band, belt, 0, 0.003, 0.009, 0.414, 0.172, 0.336);
  mesh(body, band, beltShade, 0, -0.067, 0.01, 0.417, 0.026, 0.338);
  shape(body, belt, 0, -0.062, 0.278, 0.119, 0.165, 0.064);
  shape(body, beltShade, 0, 0.006, -0.324, 0.122, 0.077, 0.084);
  for (let strand = -2; strand <= 2; strand += 1) {
    const cord = shape(body, belt, strand * 0.061, -0.135, 0.307 - Math.abs(strand) * 0.012, 0.014, 0.083, 0.017);
    cord.rotation.z = strand * 0.08;
  }

  shape(chest, skin, 0, 0.638, -0.004, 0.155, 0.15, 0.142);
  const head = joint(chest, 0, 0.793, 0.006);
  shape(head, skin, 0, 0.043, 0, 0.199, 0.218, 0.178);
  shape(head, skin, 0, -0.047, 0.048, 0.157, 0.124, 0.14);
  shape(head, hair, 0, 0.162, -0.049, 0.193, 0.116, 0.147);
  shape(head, hair, 0, 0.264, -0.067, 0.097, 0.054, 0.122).rotation.x = -0.18;
  shape(head, shade, 0, 0.025, 0.165, 0.048, 0.049, 0.048);
  shape(head, shade, 0, -0.056, 0.165, 0.059, 0.011, 0.021);
  for (const side of [-1, 1]) {
    shape(head, skin, side * 0.193, 0.023, -0.002, 0.036, 0.057, 0.03);
    shape(head, eyes, side * 0.079, 0.059, 0.154, 0.041, 0.019, 0.019);
    shape(head, hair, side * 0.077, 0.059, 0.17, 0.017, 0.018, 0.008);
    shape(head, hair, side * 0.081, 0.087, 0.153, 0.047, 0.013, 0.017).rotation.z = side * 0.18;
  }

  const arms = [];
  const legs = [];
  for (const side of [-1, 1]) {
    const upper = joint(chest, side * 0.389, 0.493, -0.022);
    shape(upper, skin, 0, -0.119, 0, 0.155, 0.24, 0.153);
    const elbow = joint(upper, 0, -0.278, 0);
    shape(elbow, skin, 0, -0.097, 0, 0.117, 0.162, 0.117);
    shape(elbow, skin, 0, -0.243, 0.008, 0.105, 0.108, 0.092);
    shape(elbow, skin, side * -0.075, -0.223, 0.049, 0.048, 0.07, 0.052);
    arms.push({ upper, elbow, side });

    const thigh = joint(body, side * 0.223, -0.081, -0.018);
    shape(thigh, skin, 0, -0.136, 0.006, 0.157, 0.239, 0.163);
    const shin = joint(thigh, 0, -0.342, 0);
    shape(shin, skin, 0, -0.097, 0, 0.112, 0.174, 0.114);
    const foot = joint(shin, 0, -0.299, 0);
    shape(foot, skin, 0, -0.028, 0.071, 0.105, 0.063, 0.162);
    legs.push({ thigh, shin, foot, side });
  }

  function dress(profile) {
    root.scale.x = BUILDS[profile.build].width;
    skin.color.set(SKINS[profile.skin]);
    shade.color.copy(skin.color).multiplyScalar(0.70);
    belt.color.set(COLOURS[profile.colour].value);
    beltShade.color.copy(belt.color).multiplyScalar(0.62);
  }

  function pose({
    x = 0, z = 0, yaw = 0, crouch = 0, step = 0, gait = 0,
    reach = 0, grip = 0, bow = 0, twist = 0, fall = 0, roll = 0, recoil = 0,
  } = {}) {
    root.position.set(x, 0, z);
    root.rotation.y = yaw;
    body.position.y = 0.814 - 0.26 * crouch - 0.62 * Math.abs(fall) + 0.029 * Math.abs(step);
    body.rotation.set(fall * 1.53, twist, roll * 0.37);
    chest.rotation.x = 0.035 + 0.39 * crouch + 0.41 * bow - 0.21 * recoil;
    head.rotation.x = 0.15 * bow - 0.21 * crouch + 0.16 * recoil;
    for (const { upper, elbow, side } of arms) {
      const swing = step * side * Math.sin(gait);
      upper.rotation.set(-0.09 - 0.43 * crouch - reach * 1.05 - swing * 0.5,
        side * (0.06 + reach * 0.11), side * (0.26 - grip * 0.16 + reach * 0.09));
      elbow.rotation.x = -0.16 - 0.43 * reach - 0.56 * grip + 0.38 * crouch;
    }
    for (const { thigh, shin, foot, side } of legs) {
      const swing = Math.sin(gait + (side < 0 ? Math.PI : 0)) * step;
      thigh.rotation.set(-0.90 * crouch + 0.54 * swing, 0, side * (0.10 + 0.15 * crouch));
      shin.rotation.x = 1.42 * crouch + Math.max(0, -swing) * 0.46;
      foot.rotation.x = -0.60 * crouch - 0.35 * swing;
    }
  }

  return { root, dress, pose };
}
