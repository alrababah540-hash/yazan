// WHAT IS OFF-PLAN REAL ESTATE IN ABU DHABI? — 76 s vertical film, one continuous 3D world.
// renderAt(t) is a pure function of time → deterministic frame-accurate rendering.
import * as THREE from 'three';
import { createEngine } from './lib/engine.js';
import { makeMaterials, stoneTexture } from './lib/materials.js';
import { buildTower, buildPlot, buildContext, T } from './lib/tower.js';
import { buildApartment, buildPlanPanel } from './lib/apartment.js';
import { buildMap } from './lib/map.js';
import { buildCrane, buildStudio, buildBlueprint, buildTimeline, buildChart, buildContract, buildPlinth } from './lib/props.js';
import { buildOverlay } from './lib/overlay.js';
import { buildReelOverlay } from './lib/overlay_reel.js';
import { buildReelOverlay2 } from './lib/overlay_reel2.js';
import { buildMap2 } from './lib/map2.js';
import { LAYOUTS } from './lib/plan.js';
import { clamp, lerp, remap, smooth, smoother, easeOut, easeInOut, easeOutBack, track, cine } from './lib/util.js';

const Q = new URLSearchParams(location.search);
const LANG = Q.get('lang') === 'en' ? 'en' : 'ar';
if (LANG === 'en') { document.documentElement.lang = 'en'; document.documentElement.dir = 'ltr'; window.__LANG = 'en'; }
const E = createEngine(document.getElementById('gl'), { dof: Q.get('dof') !== '0' });
const { scene, camera } = E;
const M = makeMaterials();
await document.fonts.load('600 40px "IBM Plex Sans Arabic"'); await document.fonts.load('500 40px "IBM Plex Sans Arabic"');
await document.fonts.load('700 40px "IBM Plex Sans Arabic"'); await document.fonts.load('600 30px "Plex Latin"');
await document.fonts.load('500 30px "Plex Latin"'); await document.fonts.load('700 30px "Plex Latin"');
await document.fonts.ready;

const TL = await (await fetch('/scene/timeline.json')).json();
const NAR = await (await fetch(LANG === 'en' ? '/audio/narration_en.json' : '/audio/narration.json')).json();
const DUR = await (await fetch(LANG === 'en' ? '/audio/vo_en/durations.json' : '/audio/vo/durations.json')).json();

// ---------------------------------------------------------------- world
const tower = buildTower(M); scene.add(tower.root);
const plot = buildPlot(M); scene.add(plot.root);
const city = buildContext(M); scene.add(city.root);
const blueprint = buildBlueprint(T); scene.add(blueprint.root);
const studio = buildStudio(); scene.add(studio.root);
const map = await buildMap(M); scene.add(map.root);
const apt = buildApartment('b2', M); scene.add(apt.root);
const planV = buildPlanPanel('b2', { w: 15 }); scene.add(planV.root);      // vertical plan beside tower (S2)
const planH = buildPlanPanel('b2', { w: 15.5 }); scene.add(planH.root);    // horizontal plan under the unit (S4→S5)
const timeline = buildTimeline(M); scene.add(timeline.root);
const crane = buildCrane(M); scene.add(crane.root);
const chart = buildChart(); scene.add(chart.root);
const contract = buildContract(M); scene.add(contract.root);
const plinth = buildPlinth(M); scene.add(plinth.root);
const layouts = ['b1', 'b2', 'b3'].map((k) => buildApartment(k, M)); layouts.forEach((l) => scene.add(l.root));
const darkStone = new THREE.MeshStandardMaterial({ map: stoneTexture(31, '#6f675c'), roughness: 0.42, metalness: 0, envMapIntensity: 0.8 }); darkStone.map.repeat.set(3, 2);
const stoneTable = new THREE.Mesh(new THREE.BoxGeometry(70, 3, 46), darkStone); stoneTable.position.y = -1.6; stoneTable.receiveShadow = true; scene.add(stoneTable);
M.stoneMap.repeat.set(2, 6);

// floor-highlight outline for the selected floor (S4)
const FOCUS = 14;
const hiMat = new THREE.LineBasicMaterial({ color: 0xf0d59c, transparent: true, opacity: 0 });
const hiFloor = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(T.W + 0.6, T.FH, T.D + 0.6).translate(0, T.FH / 2 - 0.3, 0)), hiMat);
tower.floors[FOCUS].add(hiFloor);
// gold leader line (unit → plan panel)
const leader = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xe2c78f, transparent: true, opacity: 0 }));
scene.add(leader);
// light streaks (miniature → three island pins) S3
const streaks = ['yas', 'saadiyat', 'reem'].map(() => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xf0d59c, transparent: true, opacity: 0, toneMapped: false })); scene.add(l); return l; });
// phased-payment blocks (S6 comp 2)
const phase = new THREE.Group(); scene.add(phase);
const phaseBlocks = [];
for (let i = 0; i < 7; i++) {
  const a = -1.25 + i * (2.5 / 6), h = 1.2 + i * 0.75;
  const g = new THREE.Group(); g.position.set(Math.sin(a) * 8.5, 0, Math.cos(a) * 8.5 - 2);
  const b = new THREE.Mesh(new THREE.BoxGeometry(2.6, h, 2.6).translate(0, h / 2, 0), M.stoneLight.clone()); b.material.color.setHex(0xe9e1d2); b.castShadow = b.receiveShadow = true;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.16, 2.7).translate(0, h + 0.08, 0), M.gold); g.add(b, cap); phase.add(g); phaseBlocks.push(g);
}
const phaseHead = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 12), new THREE.MeshBasicMaterial({ color: 0xffe9b8, toneMapped: false })); phase.add(phaseHead);
// delay timeline (S7) — handover marker slips, dashed amber extension
const delay = new THREE.Group(); scene.add(delay);
const dRail = new THREE.Mesh(new THREE.BoxGeometry(44, 0.35, 0.35), new THREE.MeshStandardMaterial({ color: 0xc9a96a, metalness: 1, roughness: 0.3, emissive: 0x6a5020, emissiveIntensity: 0.5 }));
const dMarker = new THREE.Mesh(new THREE.OctahedronGeometry(1.4), new THREE.MeshStandardMaterial({ color: 0xe2c78f, metalness: 1, roughness: 0.2, emissive: 0xc9a96a, emissiveIntensity: 0.5 }));
const dGhost = new THREE.Mesh(new THREE.OctahedronGeometry(1.4), new THREE.MeshBasicMaterial({ color: 0xe2c78f, wireframe: true, transparent: true, opacity: 0.5 }));
const dashes = new THREE.Group(); for (let i = 0; i < 8; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.36, 0.36), new THREE.MeshBasicMaterial({ color: 0xe9a85a, toneMapped: false })); d.position.x = i * 1.3; dashes.add(d); }
delay.add(dRail, dMarker, dGhost, dashes);

const overlay = buildOverlay({ narration: NAR, durations: DUR, timeline: TL, lang: LANG });

// ---------------------------------------------------------------- helpers
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const tmp = new THREE.Vector3();
function project(v) { camera.updateMatrixWorld(); tmp.copy(v).project(camera); return { x: (tmp.x * 0.5 + 0.5) * 1080, y: (-tmp.y * 0.5 + 0.5) * 1920, visible: tmp.z < 1 && Math.abs(tmp.x) < 1.15 && Math.abs(tmp.y) < 1.15 }; }
function cam(posKeys, lookKeys, t, fov = 40, roll = 0) {
  const p = track(posKeys, t), l = track(lookKeys, t);
  camera.position.set(...p); camera.up.set(Math.sin(roll), Math.cos(roll), 0); camera.lookAt(...l);
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  return V(...l);
}
function dof(target, aperture = 0.00008, maxblur = 0.006) {
  E.bokeh.uniforms.focus.value = camera.position.distanceTo(target);
  E.bokeh.uniforms.aperture.value = aperture; E.bokeh.uniforms.maxblur.value = maxblur;
  E.bokeh.enabled = aperture >= 0.0001; // depth-of-field only where the shot uses shallow focus (costly extra depth render)
}
const dip = (t, c, w = 0.32) => Math.max(0, 1 - Math.abs(t - c) / w); // navy dip envelope centred on c
function aptAttach(scaleOverride) { // place the unit inside floor FOCUS of the (possibly transformed) tower
  tower.root.updateMatrixWorld(true);
  const f = tower.floors[FOCUS]; f.userData.parts.interior.visible = false;
  const local = V(-7, 0, 5.6).add(f.position);
  const w = local.applyMatrix4(tower.root.matrixWorld);
  apt.root.position.copy(w); apt.root.scale.setScalar(scaleOverride ?? tower.root.scale.x); apt.root.rotation.set(0, 0, 0);
}
function resetAll() {
  for (const o of [tower.root, plot.root, city.root, blueprint.root, studio.root, map.root, apt.root, planV.root, planH.root, timeline.root, crane.root, chart.root, contract.root, plinth.root, stoneTable, phase, delay, leader, ...streaks, ...layouts.map((l) => l.root)]) o.visible = false;
  tower.root.position.set(0, 0, 0); tower.root.scale.setScalar(1); tower.root.rotation.set(0, 0, 0);
  tower.setExplode(0); hiMat.opacity = 0; apt.setGlow(0); apt.setOpacity(1); apt.root.scale.set(1, 1, 1);
  M.slab.transparent = false; M.slab.opacity = 1; M.slab.depthWrite = true;
  tower.interiorMats.forEach((m) => { m.opacity = 1; });
  E.backdrop.material.uniforms.uWarm.value = 1; E.backdrop.material.uniforms.uDark.value = 0;
  scene.fog.density = 0.0016; E.bloom.strength = 0.35; E.sun.intensity = 3.2; E.sun.castShadow = true; E.hemi.intensity = 0.35;
  blueprint.mat.uniforms.uAlpha.value = 1; blueprint.root.position.set(0, -0.4, 0); blueprint.root.scale.setScalar(1);
  crane.root.scale.setScalar(1); crane.root.position.set(0, 0, 0); crane.root.rotation.set(0, 0, 0);
  timeline.railPivot.rotation.set(0, 0, 0);
  plinth.root.position.set(0, 0, 0); plinth.root.scale.set(1, 1, 1); plinth.root.rotation.set(0, 0, 0);
}
function citySet() { tower.root.visible = plot.root.visible = city.root.visible = true; }
function xray(x) { // tower x-ray incl. slab ghosting
  tower.setXray(x);
  if (x > 0) { M.slab.transparent = true; M.slab.opacity = 1 - 0.75 * x; M.slab.depthWrite = x < 0.5; }
}

// ---------------------------------------------------------------- scenes
const A = {}; // screen anchors for the overlay
const AW = {}; // anchor world positions (projected after the camera is set)

function S1(t) { // HOOK 0–6.5: empty plot → blueprint → structure → finished tower, one shot
  citySet(); blueprint.root.visible = true;
  const p = smoother(remap(t, 0.5, 5.6));
  tower.setBuild(p); xray(0);
  blueprint.mat.uniforms.uReveal.value = easeOut(remap(t, 0.35, 1.6)) * 1.05;
  blueprint.mat.uniforms.uAlpha.value = 1 - 0.75 * remap(t, 3.2, 5.6);
  plot.pegs.visible = t < 4.2; plot.pegs.scale.setScalar(1 - easeInOut(remap(t, 3.4, 4.2)) + 0.001);
  plot.plaza.visible = t > 4.0; plot.plaza.position.y = -1.2 * (1 - easeOut(remap(t, 4.0, 5.6)));
  apt.root.visible = t > 6.2; if (apt.root.visible) aptAttach();
  const look = cam(
    [{ t: 0, v: [30, 300, 270] }, { t: 2.4, v: [70, 120, 215] }, { t: 4.8, v: [118, 52, 150] }, { t: 6.0, v: [45, 52, 62] }, { t: 6.5, v: [8, 50, 24] }, { t: 7.3, v: [-4, 49.4, 4.5] }],
    [{ t: 0, v: [0, 0, 0] }, { t: 2.4, v: [0, 22, 0] }, { t: 4.8, v: [0, 48, 0] }, { t: 6.0, v: [-3, 50, 0] }, { t: 6.5, v: [-5, 49.6, 0] }, { t: 7.3, v: [-7, 49, -5] }], t);
  dof(look, 0.00005);
  E.bloom.strength = 0.35 + 0.5 * dip(t, 0.9, 0.5); // blueprint ignition
}

function S2(t) { // WHAT IS OFF-PLAN 6.5–17.3
  citySet();
  tower.setBuild(1);
  const x = smooth(remap(t, 7.0, 8.4));
  xray(x);
  tower.interiorMats.forEach((m) => { m.opacity = 1; });
  apt.root.visible = true; aptAttach();
  apt.setGlow(easeOut(remap(t, 8.6, 9.6)) * (1 - 0.4 * remap(t, 15.2, 16.2)));
  // plan panel unfolds beside the tower (RTL draw-on)
  const pv = remap(t, 10.0, 11.0);
  planV.root.position.set(13, 63, 20); planV.root.lookAt(-70, 66, 104);
  planV.root.scale.set(0.82 * Math.max(0.001, easeOut(pv)), 0.82, 0.82);
  planV.set(easeInOut(remap(t, 10.3, 12.6)), pv * (1 - remap(t, 15.0, 15.6)));
  AW.plan = (V(13, 63 + 7.4, 20));
  leader.visible = true; leader.material.opacity = 0.8 * remap(t, 10.6, 11.2) * (1 - remap(t, 15.0, 15.6));
  leader.geometry.setFromPoints([V(-1, 49.5, 9), V(8.5, 57.5, 18)]);
  const look = cam(
    [{ t: 6.5, v: [8, 50, 24] }, { t: 7.3, v: [-4, 49.4, 4.5] }, { t: 8.0, v: [-8, 50.5, -1] }, { t: 9.4, v: [-34, 62, 62] }, { t: 11.2, v: [-72, 70, 100] }, { t: 15.0, v: [-66, 66, 110] }, { t: 17.3, v: [-30, 300, 240] }],
    [{ t: 6.5, v: [-5, 49.6, 0] }, { t: 7.3, v: [-7, 49, -5] }, { t: 8.0, v: [-8, 49, 3] }, { t: 9.4, v: [-5, 52, 4] }, { t: 11.2, v: [4, 54, 4] }, { t: 15.0, v: [4, 53, 4] }, { t: 17.3, v: [0, 20, 0] }], t);
  dof(look, 0.00006);
  E.grade.uniforms.uFade.value = 0.92 * dip(t, 17.0, 0.35);
}

function S3(t) { // ABU DHABI 17.3–25.6 — OSM-derived map; areas only, no projects
  map.root.visible = true; map.setOpacity(1);
  scene.fog.density = 0.0009;
  E.backdrop.material.uniforms.uWarm.value = 0.15;
  map.setDrawing(smooth(remap(t, 24.6, 25.4)));
  // miniature (gold wire model) floats above the map, dissolves into three light streaks → pins
  const ms = 0.07 * (1 - easeInOut(remap(t, 18.3, 19.2)));
  if (ms > 0.002) {
    tower.root.visible = true; tower.setBuild(1); xray(1); tower.edgeMat.opacity = 0.95;
    tower.root.scale.setScalar(ms); tower.root.position.set(25, 14 - 4 * remap(t, 17.3, 18.3), -18);
    tower.root.rotation.y = t * 0.4;
  }
  const origin = V(25, 16, -18);
  ['yas', 'saadiyat', 'reem'].forEach((k, i) => {
    const pin = map.pins[k]; pin.visible = true;
    const u = easeOutBack(remap(t, 19.0 + i * 0.15, 19.8 + i * 0.15));
    pin.scale.set(1, Math.max(0.001, u), 1);
    const pulse = remap((t - 19.6 - i * 0.2) % 2.2, 0, 2.2);
    pin.userData.ring.scale.setScalar(1 + 2.4 * pulse); pin.userData.ring.material.opacity = 0.8 * (1 - pulse) * (t > 19.6 ? 1 : 0);
    const s = streaks[i]; s.visible = true;
    const sp = easeInOut(remap(t, 18.5, 19.4));
    const head = map.labels[k].clone().setY(7.5);
    s.geometry.setFromPoints([origin.clone().lerp(head, Math.max(0, sp - 0.35) / 0.65), origin.clone().lerp(head, sp)]);
    s.material.opacity = sp > 0 && sp < 1 ? 1 : 0;
    AW[k] = (head.clone().setY(9.5));
  });
  const look = cam(
    [{ t: 17.3, v: [30, 420, 330] }, { t: 19.8, v: [60, 260, 250] }, { t: 21.4, v: [180, 72, 100] }, { t: 22.3, v: [176, 66, 92] }, { t: 23.2, v: [-30, 82, 26] }, { t: 23.7, v: [-36, 78, 22] }, { t: 24.4, v: [-66, 66, 62] }, { t: 25.6, v: [-84, 140, 34] }],
    [{ t: 17.3, v: [20, 0, -40] }, { t: 19.8, v: [30, 0, -30] }, { t: 21.4, v: [152, 0, 0] }, { t: 22.3, v: [150, 0, -2] }, { t: 23.2, v: [-55, 0, -70] }, { t: 23.7, v: [-56, 0, -72] }, { t: 24.4, v: [-91, 0, -12] }, { t: 25.6, v: [-90, 0, -14] }], t);
  dof(look, 0.00004);
  E.sun.castShadow = false;
  E.grade.uniforms.uFade.value = Math.max(0.92 * dip(t, 17.6, 0.35) * (t < 17.6 ? 1 : 1), 0.95 * dip(t, 25.65, 0.3));
}

const GAP = 2.6;
const C4 = V(-7, 14 * T.FH + 14 * GAP + 1.2, 5.6 + 34); // detached unit centre (S4)
function S4(t) { // CHOOSING AN APARTMENT 25.6–34.2 (studio, blueprint ground)
  studio.root.visible = true; studio.setOpacity(1); blueprint.root.visible = true;
  E.backdrop.material.uniforms.uWarm.value = 0.25; scene.fog.density = 0.0022;
  blueprint.mat.uniforms.uReveal.value = 1.1; blueprint.mat.uniforms.uAlpha.value = 1 - 0.6 * remap(t, 27.0, 28.5);
  tower.root.visible = true;
  const p = smoother(remap(t, 25.75, 28.2)); tower.setBuild(p, 1.0);
  const e = easeInOut(remap(t, 28.4, 29.6)); tower.setExplode(e * GAP / 2.2);
  tower.root.updateMatrixWorld(true);
  // the tower's setExplode uses 2.2 * factor; we pass e*1.4/2.2 so the gap is 1.4 m
  const fade = smooth(remap(t, 30.2, 31.4));
  xray(fade); tower.edgeMat.opacity = Math.max(tower.edgeMat.opacity, 0.25 * e) * (1 - 0.7 * fade);
  hiMat.opacity = remap(t, 29.0, 29.4) * (1 - remap(t, 31.0, 31.6));
  // unit detaches and slides out toward the camera
  apt.root.visible = t > 28.0; aptAttach();
  const d = easeInOut(remap(t, 29.8, 31.0));
  apt.root.position.lerp(C4, d);
  apt.setGlow(remap(t, 29.2, 29.6) * (1 - 0.6 * remap(t, 31.2, 32)));
  // floor plan projected beneath the unit
  planH.root.visible = t > 31.4;
  planH.root.position.copy(C4).add(V(0, -1.6, 0)); planH.root.rotation.set(-Math.PI / 2, 0, 0); planH.root.scale.setScalar(1);
  planH.set(easeInOut(remap(t, 31.6, 33.2)), remap(t, 31.4, 31.9), 0.8);
  // camera: tower → exploded view → orbit around the detached unit
  let look;
  if (t < 31.0) {
    look = cam([{ t: 25.6, v: [70, 30, 150] }, { t: 28.3, v: [125, 74, 215] }, { t: 29.7, v: [150, 110, 265] }, { t: 31.0, v: [30, C4.y + 20, C4.z + 40] }],
      [{ t: 25.6, v: [0, 26, 0] }, { t: 28.3, v: [0, 58, 0] }, { t: 29.7, v: [0, 92, 0] }, { t: 31.0, v: [C4.x, C4.y, C4.z] }], t);
  } else {
    const a = lerp(0.75, -0.95, cine(remap(t, 31.0, 34.6)));
    const r = lerp(44, 36, remap(t, 31, 34.2));
    camera.position.set(C4.x + Math.sin(a) * r, C4.y + 22 - 4 * remap(t, 31, 34.2), C4.z + Math.cos(a) * r);
    look = C4.clone().add(V(0, -0.5, 0)); camera.up.set(0, 1, 0); camera.lookAt(look);
  }
  dof(look, t > 31 ? 0.00025 : 0.00006, 0.008);
}

const TLZ = 40; // timeline world z
const TLR = 0; // timeline yaw: booking far, handover near the viewer
const TLW = (x, y, z) => V(x, y, z).applyAxisAngle(V(0, 1, 0), TLR).add(V(0, 0, TLZ));
function S5(t) { // PAYMENT PLAN 34.2–43.0
  studio.root.visible = true; E.backdrop.material.uniforms.uWarm.value = 0.25; scene.fog.density = 0.0022;
  // 34.2–35.4: unit flattens into its plan, plan drops to the floor and stretches into the rail
  const fl = easeInOut(remap(t, 34.2, 34.9));
  if (t < 35.0) {
    apt.root.visible = true; apt.root.position.copy(C4); apt.root.scale.set(1, Math.max(0.02, 1 - fl), 1);
    apt.setOpacity(1 - remap(t, 34.6, 34.95));
  }
  const drop = easeInOut(remap(t, 34.7, 35.5));
  const stretch = easeInOut(remap(t, 35.2, 35.9));
  planH.root.visible = stretch < 1;
  const pT = TLW(timeline.xAt(0.5) - 4, 0.2, 0);
  planH.root.position.set(lerp(C4.x, pT.x, drop), lerp(C4.y - 1.6, 0.2, drop), lerp(C4.z, pT.z, drop));
  planH.root.rotation.set(-Math.PI / 2, 0, TLR * drop);
  planH.root.scale.set(lerp(1, 4.1, stretch), lerp(1, 0.02, stretch), 1);
  planH.set(1, 1 - remap(t, 35.6, 35.9), 0.8 * (1 - stretch));
  // timeline
  timeline.root.visible = true; timeline.root.position.set(0, 0, TLZ); timeline.root.rotation.y = TLR;
  const rp = easeOut(remap(t, 35.5, 36.1));
  timeline.rail.scale.x = Math.max(0.001, rp);
  timeline.root.children[0].visible = true; // stone base
  const u = smooth(remap(t, 35.8, 41.2));
  const grow = (g, a) => { const s = easeOutBack(remap(t, a, a + 0.55)); g.scale.set(1, Math.max(0.001, s), 1); g.visible = s > 0.001; };
  grow(timeline.m1, 35.6); timeline.inst.forEach((g, i) => grow(g, 37.2 + i * 0.4)); grow(timeline.m3, 40.2);
  const lit = (g, uu) => { g.userData.cap.material.emissive.setHex(0xc9a96a); g.userData.cap.material.emissiveIntensity = u >= uu ? 0.9 : 0.05; };
  lit(timeline.m1, 0.0); timeline.inst.forEach((g, i) => lit(g, 0.3 + i * 0.1)); lit(timeline.m3, 0.97);
  timeline.head.visible = rp > 0.9; timeline.head.position.set(timeline.xAt(0.03 + u * 0.88), 0.9, 0);
  timeline.key.rotation.y = t * 1.2;
  // background: miniature tower grows with the payment milestones
  const TP = TLW(-12, 0, -24);
  tower.root.visible = true; tower.root.scale.setScalar(0.3); tower.root.position.set(TP.x, 0.18, TP.z);
  plinth.root.visible = true; plinth.root.position.set(TP.x, 0, TP.z); plinth.root.scale.set(0.9, 0.3, 0.9);
  tower.setBuild(Math.min(1, u * 1.05), 0.6); xray(0);
  // 42.0–43.0: rail swings up to vertical and becomes the crane cable
  const sw = easeInOut(remap(t, 41.9, 42.6));
  timeline.railPivot.rotation.z = -Math.PI / 2 * sw;
  const CS = 0.45, m3x = timeline.xAt(1) - 8;
  crane.root.visible = t > 41.9; crane.root.scale.setScalar(CS * easeOut(remap(t, 41.9, 42.5)) + 0.001);
  const cp = TLW(m3x, 0, 0); crane.root.rotation.y = TLR; crane.root.position.copy(cp).add(V(-crane.JL * 0.62 * CS, 0, 0).applyAxisAngle(V(0, 1, 0), TLR));
  crane.setCable(Math.max(0.01, (crane.H * CS - 0.4 - timeline.RL) / CS));
  const A3 = (g) => { const v = V(0, g.userData.h + 2.4, 0); g.localToWorld(v); return v; };
  timeline.root.updateMatrixWorld(true);
  AW.ms0 = (A3(timeline.m1).add(V(0, 2.0, 0))); AW.ms1 = (A3(timeline.inst[2]).add(V(0, 4.8, 0))); AW.ms2 = (A3(timeline.m3).add(V(0, 2.4, 0)));
  const hx = timeline.xAt(0.03 + u * 0.88);
  const m3w = TLW(m3x, 0, 0), C4c = V(C4.x + Math.sin(-0.95) * 36, C4.y + 18, C4.z + Math.cos(-0.95) * 36);
  const look = cam(
    [{ t: 34.2, v: C4c.toArray() }, { t: 35.0, v: TLW(30, 46, 52).toArray() }, { t: 35.8, v: TLW(52, 30, 38).toArray() }, { t: 41.2, v: TLW(58, 24, 26).toArray() }, { t: 42.0, v: TLW(52, 16, 22).toArray() }, { t: 43.0, v: TLW(44, 10, 18).toArray() }],
    [{ t: 34.2, v: [C4.x, C4.y - 0.5, C4.z] }, { t: 35.0, v: TLW(0, 4, 0).toArray() }, { t: 35.8, v: TLW(-2, 3, -2).toArray() }, { t: 41.2, v: TLW(6, 4, -2).toArray() }, { t: 42.0, v: [m3w.x, 10, m3w.z] }, { t: 43.0, v: [m3w.x, 64, m3w.z] }], t);
  void hx;
  dof(look, 0.00022, 0.008);
  E.grade.uniforms.uFade.value = 0.95 * dip(t, 42.95, 0.3);
}

const lay = layouts;
function S6(t) { // WHY OFF-PLAN 43.0–52.2: three compositions, same plinth, match cuts
  studio.root.visible = true; plinth.root.visible = true; E.backdrop.material.uniforms.uWarm.value = 0.3; scene.fog.density = 0.002;
  const spin = (t - 43.0) * 0.22; E.sun.intensity = 2.0; E.backdrop.material.uniforms.uDark.value = 0.3;
  plinth.root.rotation.y = spin;
  const c = t < 46.6 ? 0 : t < 48.6 ? 1 : 2;
  const pop = (a) => easeOutBack(remap(t, a, a + 0.35), 1.2);
  if (c === 0) {
    const xs = [-9.4, 0, 10.2], ca = 0.55 + (t - 43.0) * 0.07;
    lay.forEach((l, i) => {
      l.root.visible = true; const s = 0.56 * pop(43.0 + i * 0.12);
      l.root.scale.setScalar(Math.max(0.001, s));
      l.root.position.set(Math.cos(ca) * xs[i], 0.05, -Math.sin(ca) * xs[i]); l.root.rotation.y = ca + 0.35 * Math.sin((t - 43) * 0.6 + i);
      AW['lay' + i] = (l.root.position.clone().add(V(0, 5.5, 0)));
    });
  } else if (c === 1) {
    phase.visible = true; phase.scale.setScalar(1.0); phase.rotation.y = 0.55 + (t - 43.0) * 0.07 + 0.25 * Math.sin((t - 46.6) * 0.8);
    phaseBlocks.forEach((b, i) => { const s = easeOutBack(remap(t, 46.6 + i * 0.13, 46.95 + i * 0.13)); b.scale.set(1, Math.max(0.001, s), 1); });
    const k = clamp((t - 46.9) / 1.5) * 6; const i0 = Math.floor(k), fr = k - i0;
    const pa = phaseBlocks[Math.min(6, i0)].position, pb = phaseBlocks[Math.min(6, i0 + 1)].position;
    const ha = 1.2 + Math.min(6, i0) * 0.75, hb = 1.2 + Math.min(6, i0 + 1) * 0.75;
    phaseHead.position.set(lerp(pa.x, pb.x, fr), lerp(ha, hb, fr) + 0.8 + Math.sin(fr * Math.PI) * 1.2, lerp(pa.z, pb.z, fr));
  } else {
    tower.root.visible = true; tower.setBuild(1); xray(0);
    const s = 0.2 * pop(48.6); tower.root.scale.setScalar(Math.max(0.001, s)); tower.root.position.set(0, 0.0, 0); tower.root.rotation.y = spin;
  }
  const a = 0.55 + (t - 43.0) * 0.07;
  camera.position.set(Math.sin(a) * 68, 34 - (c === 2 ? 4 : 0), Math.cos(a) * 68);
  const look = V(0, c === 2 ? 10 : 2.5, 0); camera.up.set(0, 1, 0); camera.lookAt(look);
  if (camera.fov !== 40) { camera.fov = 40; camera.updateProjectionMatrix(); }
  dof(look, 0.0005, 0.01);
  E.bloom.strength = 0.35 + 0.6 * Math.max(dip(t, 46.6, 0.18), dip(t, 48.6, 0.18));
  E.grade.uniforms.uFade.value = Math.max(0.95 * dip(t, 43.05, 0.3) * (t < 43.05 ? 1 : 1), 0.95 * dip(t, 52.2, 0.3));
}

function S7(t) { // RISKS & VERIFICATION 52.2–66.0
  if (t < 58.2) {
    citySet();
    const p = 1 - 0.4 * easeInOut(remap(t, 52.5, 54.6)); tower.setBuild(p, 0.35); xray(0);
    crane.root.visible = true; crane.root.position.set(24, 0, -18); crane.root.rotation.y = Math.PI * 0.78;
    const cr = easeOut(remap(t, 52.6, 53.8)); crane.root.scale.set(1, Math.max(0.001, cr), 1);
    crane.setCable(18 + 6 * Math.sin(t * 0.8));
    plot.plaza.visible = true; plot.pegs.visible = false;
    // handover marker slips (delay)
    const look7 = cam([{ t: 52.2, v: [88, 10, 150] }, { t: 55.0, v: [70, 14, 128] }, { t: 58.2, v: [52, 22, 120] }],
      [{ t: 52.2, v: [0, 50, 0] }, { t: 55.0, v: [2, 42, 8] }, { t: 58.2, v: [0, 36, 14] }], t);
    camera.updateMatrixWorld();
    const fwd = V(0, 0, -1).applyQuaternion(camera.quaternion), up = V(0, 1, 0).applyQuaternion(camera.quaternion), rt = V(1, 0, 0).applyQuaternion(camera.quaternion);
    const inFront = (d, u, r) => camera.position.clone().addScaledVector(fwd, d).addScaledVector(up, u).addScaledVector(rt, r);
    delay.visible = t > 54.8; delay.position.copy(inFront(62, -9, 0)); delay.quaternion.copy(camera.quaternion);
    delay.scale.setScalar(0.52 * easeOut(remap(t, 54.8, 55.3)) + 0.001);
    const sl = easeInOut(remap(t, 55.5, 56.6));
    dMarker.position.x = lerp(6, 16, sl); dGhost.position.x = 6; dGhost.visible = sl > 0.05;
    dashes.position.x = 6.6; dashes.children.forEach((d, i) => { d.visible = i * 1.3 < (dMarker.position.x - 6.6); });
    dMarker.rotation.y = t; delay.updateMatrixWorld(true); chart.root.updateMatrixWorld(true);
    AW.delay = (delay.localToWorld(dMarker.position.clone().add(V(0, 3.4, 0))));
    // market chart (no figures)
    chart.root.visible = t > 56.4; chart.root.position.copy(inFront(72, -1.5, 0)); chart.root.quaternion.copy(camera.quaternion);
    chart.root.scale.setScalar(0.62 * easeOut(remap(t, 56.4, 56.9)) + 0.001);
    chart.setPhase(t, remap(t, 56.5, 57.4));
    chart.root.updateMatrixWorld(true); AW.price = (chart.root.localToWorld(V(0, 16, 0)));
    dof(look7, 0.00005);
  } else {
    studio.root.visible = true; contract.root.visible = true; E.backdrop.material.uniforms.uWarm.value = 0.2; scene.fog.density = 0.002;
    contract.root.position.set(0, -0.5, 0); contract.root.rotation.y = 0.08 + (t - 58.2) * 0.012;
    const look = cam([{ t: 58.2, v: [-5, 44, 58] }, { t: 66.0, v: [-1, 42, 50] }], [{ t: 58.2, v: [0, 0, -30] }, { t: 66.0, v: [0, 0, -28] }], t);
    dof(V(0, 0, 0), 0.00035, 0.008);
  }
  E.grade.uniforms.uFade.value = Math.max(0.95 * dip(t, 52.2, 0.3), 0.95 * dip(t, 58.2, 0.3), 0.95 * dip(t, 66.0, 0.3));
}

function S8(t) { // FINAL MESSAGE 66.0–76.0
  if (t < 69.8) {
    citySet(); tower.setBuild(1); xray(0); plot.pegs.visible = false;
    const look = cam([{ t: 66.0, v: [46, 92, 66] }, { t: 69.8, v: [150, 112, 320] }], [{ t: 66.0, v: [0, 84, 0] }, { t: 69.8, v: [0, 44, 0] }], t);
    dof(look, 0.00005);
  } else {
    // it was a model all along: the tower on a natural-stone surface, shallow depth of field
    studio.root.visible = true; stoneTable.visible = true; tower.root.visible = true; tower.setBuild(1); xray(0);
    E.backdrop.material.uniforms.uWarm.value = 0.55; scene.fog.density = 0.0015;
    const s = 0.16; tower.root.scale.setScalar(s); tower.root.position.set(0, 0.0 + 0.62 * s - 0.1, 0);
    const u = remap(t, 69.8, 76.0);
    const look = cam([{ t: 69.8, v: [150 * s * 1.25, 112 * s * 1.25, 320 * s * 1.25] }, { t: 76.0, v: [12, 15, 52] }], [{ t: 69.8, v: [0, 44 * s, 0] }, { t: 76.0, v: [0, 12.5, 0] }], t);
    E.sun.intensity = 2.2; E.backdrop.material.uniforms.uDark.value = 0.35;
    dof(look, 0.0007, 0.012); void u;
    E.sun.position.set(-120, 70, 95);
  }
  E.grade.uniforms.uFade.value = Math.max(0.95 * dip(t, 66.0, 0.3), 0.95 * dip(t, 69.8, 0.3), smooth(remap(t, 75.4, 76.0)));
}

const SCENES = [['s1', S1], ['s2', S2], ['s3', S3], ['s4', S4], ['s5', S5], ['s6', S6], ['s7', S7], ['s8', S8]];
function renderSource(t) {
  resetAll(); E.grade.uniforms.uFade.value = 0;
  for (const k in A) delete A[k]; for (const k in AW) delete AW[k];
  const [, fn] = SCENES.find(([k]) => t >= TL.scenes[k][0] && t < TL.scenes[k][1]) || SCENES[SCENES.length - 1];
  fn(t);
}
window.renderAt = (t) => {
  renderSource(t);
  for (const k in AW) A[k] = project(AW[k]);
  E.grade.uniforms.uTime.value = Math.floor(t * 30) / 30;
  overlay.update(t, A);
  E.composer.render();
};

// ---------------------------------------------------------------- 35 s REEL (re-edit via EDL)
// Each reel shot plays a time-remapped section of the master film's 3D world (faster, tighter),
// with a new kinetic-typography layer. Cuts get a 4-frame navy flash-in + subtle zoom punch.
if (Q.get('reel') === '1') {
  const R = await (await fetch('/scene/reel.json')).json();
  const RN = await (await fetch('/audio/narration_reel.json')).json();
  const RD = await (await fetch('/audio/vo_reel/durations.json')).json();
  const reelUI = buildReelOverlay({ narration: RN, durations: RD, reel: R });
  window.__reelWords = reelUI.words;
  window.renderAt = (t) => {
    const sh = R.shots.find((x) => t >= x.r[0] && t < x.r[1]) || R.shots[R.shots.length - 1];
    const k = (sh.src[1] - sh.src[0]) / (sh.r[1] - sh.r[0]);
    const src = sh.src[0] + (t - sh.r[0]) * k;
    renderSource(src);
    const since = t - sh.r[0];
    const punch = sh.r[0] > 0 ? Math.exp(-since * 5.5) : 0;            // zoom punch on each cut
    camera.fov = camera.fov / (1 + 0.06 * punch); camera.updateProjectionMatrix();
    for (const kk in AW) A[kk] = project(AW[kk]);
    if (sh.r[0] > 0) E.grade.uniforms.uFade.value = Math.max(E.grade.uniforms.uFade.value, 0.75 * clamp(1 - since / 0.13));
    E.bloom.strength += 0.5 * punch;
    E.grade.uniforms.uTime.value = Math.floor(t * 30) / 30;
    overlay.update(src, A, true);
    const payU = sh.id === 'payment' ? smooth(remap(src, 35.8, 41.2)) : 0;
    reelUI.update(t, { payU });
    E.composer.render();
    camera.fov = 40; camera.updateProjectionMatrix();
  };
}
window.__chunks = overlay.chunks; window.__A = A; window.__dbg = { scene, apt, layouts, tower };

// ---------------------------------------------------------------- REEL V2 — calm 7-scene edit (≤ 35 s)
// Fewer shots, natural-speed voice, slower camera, real Abu Dhabi map, one idea per scene.
if (Q.get('reel') === '2') {
  const R = await (await fetch('/scene/reel2.json')).json();
  const RN = await (await fetch('/audio/narration_reel2.json')).json();
  const RD = await (await fetch('/audio/vo_reel2/durations.json')).json();
  const map2 = await buildMap2(M); map2.root.visible = false; scene.add(map2.root);
  const ui2 = buildReelOverlay2({ narration: RN, durations: RD, reel: R });
  window.__reelWords = ui2.words;
  const FK = ['abudhabi', 'reem', 'saadiyat', 'yas'];
  const F = map2.focus;
  const P = (k) => F[k].pos;
  // --- custom scene: real Abu Dhabi map (north-up, slow glide across the four islands)
  function mapScene(u, T) {
    resetAll(); map2.root.visible = true; E.sun.castShadow = false; E.sun.intensity = 1.5; E.hemi.intensity = 0.25;
    E.backdrop.material.uniforms.uWarm.value = 0.1; E.backdrop.material.uniforms.uDark.value = 0.35; scene.fog.density = 0.0007;
    const drops = [0.15, 0.4, 0.65, 0.9];                  // markers drop in sequence (s)
    const focusT = [1.55, 2.35, 3.2, 4.05];                // camera passes each island (s)
    FK.forEach((k, i) => {
      map2.setPin(k, easeOutBack(remap(T, drops[i], drops[i] + 0.5)));
      const a = clamp(1 - Math.abs(T - focusT[i]) / 0.75) ** 0.8;
      map2.setFocus(k, Math.max(0.08 * remap(T, drops[i], drops[i] + 0.5), a), T - drops[i]);
      AW['isl_' + k] = P(k).clone().add(V(0, 9.5, 0));
    });
    const mid = P('abudhabi').clone().lerp(P('yas'), 0.5);
    const c = (k, d, h) => [P(k).x, h, P(k).z + d];
    const pos = [{ t: 0, v: [mid.x - 10, 560, mid.z + 300] }, { t: 1.0, v: [mid.x - 25, 470, mid.z + 255] },
      { t: 1.9, v: c('abudhabi', 150, 245).map((v, i) => v + (i === 0 ? 15 : 0)) }, { t: 2.8, v: c('saadiyat', 170, 240) }, { t: 4.1, v: c('yas', 175, 245) }, { t: 5.0, v: [mid.x + 10, 430, mid.z + 240] }];
    const look = [{ t: 0, v: [mid.x - 10, 0, mid.z - 30] }, { t: 1.0, v: [mid.x - 25, 0, mid.z - 20] },
      { t: 1.9, v: [(P('abudhabi').x + P('reem').x) / 2, 0, (P('abudhabi').z + P('reem').z) / 2] }, { t: 2.8, v: [P('saadiyat').x, 0, P('saadiyat').z] }, { t: 4.1, v: [P('yas').x, 0, P('yas').z] }, { t: 5.0, v: [mid.x + 10, 0, mid.z - 15] }];
    const l = cam(pos, look, T); dof(l, 0.00003);
  }
  // --- custom backdrop: payment infographic (low dolly over the gold grid, heavy DOF)
  function payBg(u, T) {
    resetAll(); studio.root.visible = true; blueprint.root.visible = true;
    blueprint.mat.uniforms.uReveal.value = 1.1; blueprint.mat.uniforms.uAlpha.value = 0.35;
    E.backdrop.material.uniforms.uWarm.value = 0.35; E.backdrop.material.uniforms.uDark.value = 0.25;
    const l = cam([{ t: 0, v: [-70, 16, 95] }, { t: 5.8, v: [-30, 12, 72] }], [{ t: 0, v: [0, 2, 0] }, { t: 5.8, v: [8, 2, 0] }], T);
    dof(V(0, 0, 0).lerp(camera.position, 0.15), 0.0006, 0.012); void l;
  }
  // --- custom backdrop: due-diligence infographic (slow top-down drift over the site blueprint)
  function riskBg(u, T) {
    resetAll(); studio.root.visible = true; blueprint.root.visible = true;
    blueprint.mat.uniforms.uReveal.value = 1.1; blueprint.mat.uniforms.uAlpha.value = 0.7; blueprint.mat.uniforms.uGlow.value = 0.8;
    E.backdrop.material.uniforms.uDark.value = 0.4;
    const a = 0.35 + 0.06 * T;
    camera.position.set(Math.sin(a) * 22, 92, Math.cos(a) * 22); camera.up.set(0, 1, 0); camera.lookAt(0, 0, 4);
    if (camera.fov !== 40) { camera.fov = 40; camera.updateProjectionMatrix(); }
    dof(V(0, 0, 0), 0.0002, 0.006);
  }
  const CUSTOM = { map: mapScene, paybg: payBg, riskbg: riskBg };
  window.renderAt = (t) => {
    const sh = R.shots.find((x) => t >= x.r[0] && t < x.r[1]) || R.shots[R.shots.length - 1];
    const T = t - sh.r[0], len = sh.r[1] - sh.r[0];
    let src = null;
    for (const kk in AW) delete AW[kk]; for (const kk in A) delete A[kk];
    map2.root.visible = false;
    if (sh.custom) CUSTOM[sh.custom](T / len, T);
    else {
      src = sh.src[0] + T * (sh.src[1] - sh.src[0]) / len; renderSource(src);
      if (sh.id === 'unit') { // floating room labels anchored to the 3D apartment
        apt.root.updateMatrixWorld(true);
        LAYOUTS.b2.rooms.forEach((r, i) => { AW['room' + i] = apt.inner.localToWorld(V(r.x, 3.1, r.y)); });
      }
    }
    for (const kk in AW) A[kk] = project(AW[kk]);
    // gentle dip between scenes (no zoom punches, no flashes)
    const dipIn = sh.r[0] > 0 ? clamp(1 - T / 0.22) : 0, dipOut = sh.r[1] < R.duration ? clamp(1 - (len - T) / 0.22) : 0;
    E.grade.uniforms.uFade.value = Math.max(E.grade.uniforms.uFade.value, 0.92 * smooth(Math.max(dipIn, dipOut)));
    E.grade.uniforms.uTime.value = Math.floor(t * 30) / 30;
    for (const e of document.querySelectorAll('#ui > .layer, #ui > .label, #ui > .ms, #ui > .foot, #ui > .cap')) e.style.display = 'none';
    ui2.update(t, { A, shot: sh.id, T, len });
    E.composer.render();
  };
}
window.__ready = true;
