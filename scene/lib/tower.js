import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, remap, easeOut, smooth, rng } from './util.js';

// Parametric residential tower. Built from per-floor groups so construction, x-ray,
// exploded view and unit highlight are all driven from one rig (no cuts between models).
export const T = { N: 30, FH: 3.4, W: 26, D: 18 };

const box = (w, h, d, x = 0, y = 0, z = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };

export function buildTower(M, opts = {}) {
  const { N, FH, W, D } = T;
  const root = new THREE.Group(); root.name = 'tower';
  const floors = [];
  const r = rng(11);
  const glassMat = M.glass.clone();
  const interiorMats = [0xe9b878, 0xd9a868, 0xc89a62, 0x2e2822, 0x3a3128].map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 1 }));
  const edgeMat = M.line.clone(); edgeMat.opacity = 0;

  // shared per-floor geometries
  const colGeo = mergeGeometries([-1, -1 / 3, 1 / 3, 1].flatMap((fx) => [-1, 0, 1].map((fz) =>
    box(0.7, 1, 0.7, fx * (W / 2 - 2.2), 0.5, fz * (D / 2 - 2.2)))));
  const slabGeo = box(W + 0.3, 0.32, D + 0.3, 0, -0.16, 0);
  const balcGeo = box(W * 0.84, 0.22, 2.4, 0, -0.11, D / 2 + 1.35);
  const bandGeo = mergeGeometries([box(W + 0.5, 0.36, 0.3, 0, -0.16, D / 2 + 0.2), box(W + 0.5, 0.36, 0.3, 0, -0.16, -D / 2 - 0.2), box(0.3, 0.36, D + 0.5, W / 2 + 0.2, -0.16, 0), box(0.3, 0.36, D + 0.5, -W / 2 - 0.2, -0.16, 0)]);
  const glassGeo = mergeGeometries([
    box(W - 0.8, FH - 0.32, 0.06, 0, (FH - 0.32) / 2, D / 2 - 0.4), box(W - 0.8, FH - 0.32, 0.06, 0, (FH - 0.32) / 2, -D / 2 + 0.4),
    box(0.06, FH - 0.32, D - 0.8, W / 2 - 0.4, (FH - 0.32) / 2, 0), box(0.06, FH - 0.32, D - 0.8, -W / 2 + 0.4, (FH - 0.32) / 2, 0),
  ]);
  const mullGeo = (() => {
    const g = [];
    for (let x = -W / 2 + 0.4; x <= W / 2 - 0.39; x += 1.6) { g.push(box(0.09, FH - 0.32, 0.16, x, (FH - 0.32) / 2, D / 2 - 0.36)); g.push(box(0.09, FH - 0.32, 0.16, x, (FH - 0.32) / 2, -D / 2 + 0.36)); }
    for (let z = -D / 2 + 0.4; z <= D / 2 - 0.39; z += 1.6) { g.push(box(0.16, FH - 0.32, 0.09, W / 2 - 0.36, (FH - 0.32) / 2, z)); g.push(box(0.16, FH - 0.32, 0.09, -W / 2 + 0.36, (FH - 0.32) / 2, z)); }
    g.push(box(W - 0.6, 0.12, 0.18, 0, 1.05, D / 2 - 0.34)); // transom
    return mergeGeometries(g);
  })();
  // natural-stone vertical fins on the front & sides + corner piers
  const finGeo = (() => {
    const g = [];
    for (let i = 1; i < 6; i++) { const x = -W / 2 + i * (W / 6); g.push(box(0.45, FH, 1.5, x, FH / 2 - 0.32, D / 2 + 0.45)); }
    for (const s of [-1, 1]) {
      g.push(box(1.6, FH, 1.6, s * (W / 2 - 0.5), FH / 2 - 0.32, D / 2 - 0.5));
      g.push(box(1.6, FH, 1.6, s * (W / 2 - 0.5), FH / 2 - 0.32, -D / 2 + 0.5));
      for (let k = 1; k < 3; k++) g.push(box(1.3, FH, 0.45, s * (W / 2 + 0.3), FH / 2 - 0.32, -D / 2 + k * (D / 3)));
    }
    return mergeGeometries(g);
  })();
  const railGeo = box(W * 0.84, 1.05, 0.04, 0, 0.53, D / 2 + 2.5);
  const handGeo = mergeGeometries([box(W * 0.84, 0.06, 0.08, 0, 1.08, D / 2 + 2.5)]);
  const intGeo = box(W - 2.2, FH - 0.7, D - 2.2, 0, (FH - 0.32) / 2, 0);
  const envEdges = new THREE.EdgesGeometry(box(W, FH, D, 0, FH / 2 - 0.32, 0));
  const gridEdges = (() => { // panel grid used during the wireframe phase
    const pts = [];
    for (let x = -W / 2; x <= W / 2 + 0.01; x += 3.2) { pts.push(x, -0.32, D / 2, x, FH - 0.32, D / 2); }
    return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  })();

  for (let i = 0; i < N; i++) {
    const f = new THREE.Group(); f.position.y = i * FH; f.userData.baseY = i * FH;
    const cols = new THREE.Mesh(colGeo, M.concrete); cols.scale.y = FH - 0.32; cols.castShadow = true;
    const slab = new THREE.Mesh(slabGeo, M.slab); slab.position.y = FH - 0.0; slab.castShadow = slab.receiveShadow = true;
    const band = new THREE.Mesh(bandGeo, i % 2 ? M.bronze : M.stone); slab.add(band); band.castShadow = true;
    const balc = new THREE.Mesh(balcGeo, M.stone); slab.add(balc); balc.castShadow = balc.receiveShadow = true;
    slab.userData.band = band; slab.userData.balc = balc;
    // floor 0 sits on the plinth; its "slab" is the roof of the floor
    const glass = new THREE.Mesh(glassGeo, glassMat);
    const mull = new THREE.Mesh(mullGeo, M.metal);
    const fins = new THREE.Mesh(finGeo, M.stone); fins.castShadow = true; fins.receiveShadow = true;
    const rail = new THREE.Mesh(railGeo, M.rail);
    const hand = new THREE.Mesh(handGeo, M.gold);
    const lit = r() < 0.4 ? interiorMats[Math.floor(r() * 3)] : interiorMats[3 + Math.floor(r() * 2)];
    const interior = new THREE.Mesh(intGeo, lit);
    const edges = new THREE.LineSegments(envEdges, edgeMat);
    const grid = new THREE.LineSegments(gridEdges, edgeMat);
    rail.position.y = hand.position.y = FH - 0.0; // balcony belongs to the slab above
    rail.renderOrder = 2; glass.renderOrder = 3;
    f.add(cols, slab, glass, mull, fins, rail, hand, interior, edges, grid);
    f.userData.parts = { cols, slab, glass, mull, fins, rail, hand, interior, edges, grid };
    floors.push(f); root.add(f);
  }
  // podium / plinth (double-height lobby in stone)
  const plinth = new THREE.Group();
  const lobbyStone = new THREE.Mesh(mergeGeometries([box(W + 4, 0.6, D + 6, 0, -0.3, 1)]), M.stone);
  lobbyStone.receiveShadow = true; plinth.add(lobbyStone);
  root.add(plinth);
  // crown: roof slab, parapet and champagne-gold louvre frame
  const crown = new THREE.Group(); crown.position.y = N * FH;
  const cg = [];
  for (let x = -W / 2 + 1; x <= W / 2 - 0.99; x += 1.2) cg.push(box(0.14, 5.5, 0.5, x, 2.75 + 0.3, D / 2 - 1));
  for (let z = -D / 2 + 1; z <= D / 2 - 0.99; z += 1.2) { cg.push(box(0.5, 5.5, 0.14, W / 2 - 1, 2.75 + 0.3, z)); cg.push(box(0.5, 5.5, 0.14, -W / 2 + 1, 2.75 + 0.3, z)); }
  cg.push(box(W - 1.6, 0.3, D - 1.6, 0, 5.9, 0));
  const louvre = new THREE.Mesh(mergeGeometries(cg), M.gold); louvre.castShadow = true;
  const parapet = new THREE.Mesh(box(W + 0.6, 1.2, D + 0.6, 0, 0.3, 0), M.stone);
  crown.add(louvre, parapet); root.add(crown);

  const tower = { root, floors, crown, louvre, plinth, glassMat, edgeMat, interiorMats };

  // --- rig controls -------------------------------------------------------------------
  // build p ∈ [0,1]: columns rise → slabs → (wireframe) → glass & fins → balconies → crown
  tower.setBuild = (p, wireBias = 1) => {
    for (let i = 0; i < N; i++) {
      const { cols, slab, glass, mull, fins, rail, hand, interior, edges, grid } = floors[i].userData.parts;
      const s0 = 0.04 + 0.5 * (i / N);
      const cs = easeOut(remap(p, s0, s0 + 0.06));           // column rise
      const ss = easeOut(remap(p, s0 + 0.04, s0 + 0.09));    // slab
      const w0 = s0 + 0.08;
      const wf = remap(p, w0, w0 + 0.05) * (1 - remap(p, w0 + 0.22, w0 + 0.3)); // wireframe life
      const g0 = 0.3 + 0.55 * (i / N);
      const gs = smooth(remap(p, g0, g0 + 0.1));             // glass/facade material in
      const fs = easeOut(remap(p, g0 + 0.03, g0 + 0.12));    // fins slide/grow
      cols.visible = cs > 0.001; cols.scale.y = Math.max(0.001, (FH - 0.32) * cs);
      slab.visible = ss > 0.001; slab.scale.set(0.6 + 0.4 * ss, 1, 0.6 + 0.4 * ss);
      glass.visible = mull.visible = gs > 0.001; mull.scale.y = Math.max(0.001, gs);
      fins.visible = fs > 0.001; fins.scale.y = Math.max(0.001, fs);
      rail.visible = hand.visible = fs > 0.5;
      interior.visible = gs > 0.6;
      edges.visible = grid.visible = wf * wireBias > 0.01;
      floors[i].userData.wire = wf * wireBias; floors[i].userData.glass = gs;
    }
    const pl = easeOut(remap(p, 0.0, 0.05)); tower.plinth.visible = pl > 0.001; tower.plinth.scale.set(1, Math.max(0.001, pl), 1);
    const cr = easeOut(remap(p, 0.86, 0.98));
    tower.crown.visible = cr > 0.001; tower.crown.scale.set(1, Math.max(0.001, cr), 1);
    // global material ramps (wireframe glow and glass fade-in are shared materials)
    const anyWire = floors.reduce((a, f) => Math.max(a, f.userData.wire), 0);
    edgeMat.opacity = 0.9 * anyWire;
    glassMat.opacity = 0.72 * smooth(remap(p, 0.3, 0.6)) * tower._xglass;
  };
  tower._xglass = 1;
  // x-ray: facade becomes transparent, slabs read as ivory volumes, edges in champagne
  tower.setXray = (x) => {
    tower._xglass = 1 - 0.85 * x;
    glassMat.opacity = 0.72 * tower._xglass;
    for (const f of floors) {
      const { fins, mull, interior, edges, rail, hand } = f.userData.parts;
      fins.visible = fins.visible && x < 0.95; mull.visible = mull.visible && x < 0.95;
      interior.visible = interior.visible && x < 0.5;
      rail.visible = rail.visible && x < 0.9; hand.visible = hand.visible && x < 0.9;
      if (x > 0.05) { edges.visible = true; }
    }
    if (x > 0.05) edgeMat.opacity = Math.max(edgeMat.opacity, 0.55 * x);
    tower.louvre.visible = x < 0.9;
  };
  // exploded axonometric: floors separate vertically, focus floor pulled forward
  tower.setExplode = (e, focus = -1, pull = 0) => {
    for (let i = 0; i < N; i++) {
      const f = floors[i];
      f.position.y = f.userData.baseY + e * i * 2.2;
      f.position.z = i === focus ? pull : 0;
    }
    tower.crown.position.y = N * FH + e * N * 2.2;
  };
  return tower;
}

// Plot & landscape: empty surveyed plot → finished plaza
export function buildPlot(M) {
  const g = new THREE.Group();
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(90, 80), M.sand.clone());
  sand.rotation.x = -Math.PI / 2; sand.position.y = -0.62; sand.receiveShadow = true; g.add(sand);
  // survey pegs + boundary tape (empty plot state)
  const pegs = new THREE.Group();
  const peg = new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8);
  const pegMat = new THREE.MeshStandardMaterial({ color: 0xd8b26a, roughness: 0.5, metalness: 0.3 });
  for (const [x, z] of [[-34, -30], [34, -30], [34, 32], [-34, 32], [0, -30], [0, 32], [-34, 1], [34, 1]]) {
    const m = new THREE.Mesh(peg, pegMat); m.position.set(x, 0.1, z); m.castShadow = true; pegs.add(m);
  }
  const tapePts = [[-34, -30], [34, -30], [34, 32], [-34, 32], [-34, -30]].map(([x, z]) => new THREE.Vector3(x, 0.55, z));
  const tape = new THREE.Line(new THREE.BufferGeometry().setFromPoints(tapePts), new THREE.LineBasicMaterial({ color: 0xe2c78f, transparent: true }));
  pegs.add(tape); g.add(pegs);
  // finished plaza: stone paving, planters, pool
  const plaza = new THREE.Group();
  const pave = new THREE.Mesh(new THREE.BoxGeometry(70, 0.3, 64), M.stoneLight); pave.position.set(0, -0.6, 1); pave.receiveShadow = true;
  const pool = new THREE.Mesh(new THREE.BoxGeometry(22, 0.1, 7), M.water); pool.position.set(-10, -0.42, 22);
  plaza.add(pave, pool);
  const rr = rng(7);
  const treeGeo = new THREE.IcosahedronGeometry(1.6, 1); const trunk = new THREE.CylinderGeometry(0.15, 0.2, 2.2, 6);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2; const x = Math.cos(a) * 30 + (rr() - 0.5) * 3, z = Math.sin(a) * 27 + 2 + (rr() - 0.5) * 3;
    if (Math.abs(x) < 16 && z > 8 && z < 30 && Math.abs(x + 10) < 13) continue;
    const t = new THREE.Group();
    const crown = new THREE.Mesh(treeGeo, M.emerald); crown.position.y = 2.6; crown.scale.set(1, 1.15, 1); crown.castShadow = true;
    const tr = new THREE.Mesh(trunk, M.metal); tr.position.y = 1.1; t.add(crown, tr); t.position.set(x, -0.45, z);
    t.scale.setScalar(0.8 + rr() * 0.5); plaza.add(t);
  }
  g.add(plaza);
  return { root: g, pegs, plaza, tape, sand };
}

// Quiet context massing (unbranded, generic) + coastline and sea for scale and atmosphere
// windowed facade texture for distant context massing (dusk: sparse warm windows)
function windowTexture(seed) {
  const r = rng(seed); const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#6e6b66'; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 16; y++) { g.fillStyle = 'rgba(30,32,38,0.5)'; g.fillRect(0, y * 32 + 5, 512, 22); }
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const lit = r() < 0.12; g.fillStyle = lit ? `rgba(${225 + r() * 25},${175 + r() * 30},${110 + r() * 30},${0.55 + r() * 0.4})` : `rgb(${30 + r() * 10},${34 + r() * 10},${44 + r() * 12})`;
    g.fillRect(x * 32 + 3, y * 32 + 6, 26, 20);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
// scale BoxGeometry UVs so one texture tile ≈ 8 bays × 8 floors (≈ 26 m × 27 m)
function uvBox(w, h, d, x, y, z) {
  const g = box(w, h, d, x, y, z); const uv = g.attributes.uv;
  const sz = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * sz[f][0] / 51, uv.getY(i) * sz[f][1] / 54); }
  return g;
}

// Quiet context massing (unbranded, generic) + coastline and sea for scale and atmosphere
export function buildContext(M) {
  const g = new THREE.Group(); const r = rng(21);
  const geos = [];
  for (let i = 0; i < 150; i++) {
    const a = r() * Math.PI * 2, d = 120 + r() * 420;
    const x = Math.cos(a) * d, z = Math.sin(a) * d * 0.9 + 40;
    if (z < -120) continue; // keep the sea open behind the hero tower
    if (z > -40 && Math.hypot(x, z) < 330 && Math.abs(Math.atan2(x, z)) < 1.2) continue; // camera corridor
    const w = 14 + r() * 22, dd = 14 + r() * 22, h = 8 + Math.pow(r(), 2.2) * (d < 200 ? 90 : 60);
    geos.push(uvBox(w, h, dd, x, h / 2 - 0.6, z));
  }
  const winMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: windowTexture(5), roughness: 0.6, metalness: 0.1, emissive: 0xffffff, emissiveMap: windowTexture(5), emissiveIntensity: 0.0 });
  winMat.emissiveMap = winMat.map; winMat.emissiveIntensity = 0.35; winMat.emissive.setHex(0x7a6650);
  const city = new THREE.Mesh(mergeGeometries(geos), winMat); city.castShadow = city.receiveShadow = true;
  const land = new THREE.Mesh(new THREE.PlaneGeometry(1600, 900), M.ground); land.rotation.x = -Math.PI / 2; land.position.set(0, -0.7, 330); land.receiveShadow = true;
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(4000, 2000), M.water); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -1.2, -1100);
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x15181d, roughness: 0.9 });
  const roads = new THREE.Mesh(mergeGeometries([box(1600, 0.05, 10, 0, -0.66, 50), box(10, 0.05, 900, 52, -0.66, 330), box(10, 0.05, 900, -52, -0.66, 330), box(1600, 0.05, 6, 0, -0.66, -60)]), roadMat);
  roads.receiveShadow = true;
  g.add(city, land, sea, roads);
  return { root: g, sea, land, city };
}
