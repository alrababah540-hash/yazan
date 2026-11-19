import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAYOUTS, drawPlan } from './plan.js';

const box = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };

// Cut-away 3D apartment extruded from the plan data (walls, glazing, balcony, furniture).
// Returned group is centred on its footprint so it can orbit/rotate cleanly.
export function buildApartment(key, M, { wallH = 2.7 } = {}) {
  const L = LAYOUTS[key];
  const pivot = new THREE.Group(); const g = new THREE.Group(); pivot.add(g);
  g.position.set(-L.W / 2, 0, -(L.D + L.balcony) / 2);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xc9b393, roughness: 0.55, map: woodTex() });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1ece2, roughness: 0.85 });
  const fabric = new THREE.MeshStandardMaterial({ color: 0xb9ad9a, roughness: 0.95 });
  const linen = new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.9 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x7a5a3e, roughness: 0.6 });
  const stone = M.stone;

  const floor = new THREE.Mesh(box(L.W, 0.2, L.D, L.W / 2, -0.1, L.D / 2), floorMat); floor.receiveShadow = true;
  const balcony = new THREE.Mesh(box(L.W - 0.6, 0.2, L.balcony, L.W / 2, -0.12, L.D + L.balcony / 2), stone); balcony.receiveShadow = true;
  const ext = [box(L.door[0], wallH, 0.25, L.door[0] / 2, wallH / 2, 0.125), box(L.W - L.door[1], wallH, 0.25, (L.W + L.door[1]) / 2, wallH / 2, 0.125),
    box(0.25, wallH, L.D, 0.125, wallH / 2, L.D / 2), box(0.25, wallH, L.D, L.W - 0.125, wallH / 2, L.D / 2)];
  const parts = [];
  for (const [x1, y1, x2, y2] of L.walls) {
    const len = Math.hypot(x2 - x1, y2 - y1); if (len < 0.05) continue;
    const vertical = Math.abs(x2 - x1) < 0.01;
    parts.push(vertical ? box(0.12, wallH, len, x1, wallH / 2, (y1 + y2) / 2) : box(len, wallH, 0.12, (x1 + x2) / 2, wallH / 2, y1));
  }
  const walls = new THREE.Mesh(mergeGeometries([...ext, ...parts]), wallMat); walls.castShadow = walls.receiveShadow = true;
  // facade glazing + slim bronze mullions
  const glass = new THREE.Mesh(box(L.W - 0.5, wallH, 0.05, L.W / 2, wallH / 2, L.D - 0.05), M.glass.clone());
  glass.material.opacity = 0.25;
  const mulls = []; for (let x = 0.25; x <= L.W - 0.24; x += 1.5) mulls.push(box(0.06, wallH, 0.1, x, wallH / 2, L.D - 0.05));
  const mull = new THREE.Mesh(mergeGeometries(mulls), M.bronze || M.metal);
  const rail = new THREE.Mesh(box(L.W - 0.6, 1.05, 0.04, L.W / 2, 0.52, L.D + L.balcony - 0.05), M.rail);
  const hand = new THREE.Mesh(box(L.W - 0.6, 0.05, 0.07, L.W / 2, 1.06, L.D + L.balcony - 0.05), M.gold);
  g.add(floor, balcony, walls, glass, mull, rail, hand);
  // furniture
  for (const [x, y, w, d, h, k] of L.furniture) {
    const mat = k === 'sofa' ? fabric : k === 'bed' ? linen : k === 'counter' ? stone : k === 'bath' ? linen : wood;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x + w / 2, h / 2, y + d / 2); m.castShadow = true; m.receiveShadow = true; g.add(m);
    if (k === 'bed') { const p = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.12, 0.4), linen); p.position.set(x + w / 2, h + 0.06, y + 0.3); g.add(p); }
  }
  // champagne outline (selection highlight)
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(box(L.W, wallH, L.D, L.W / 2, wallH / 2, L.D / 2)), M.line.clone());
  edges.material.opacity = 0; g.add(edges);
  // translucent gold volume shown while the unit is "selected" inside the tower
  const volMat = new THREE.MeshBasicMaterial({ color: 0xd9b46a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const vol = new THREE.Mesh(box(L.W, wallH + 0.4, L.D, L.W / 2, wallH / 2, L.D / 2), volMat); g.add(vol);
  const allMats = [floorMat, wallMat, fabric, linen, wood];
  return { root: pivot, inner: g, L, edges, vol, glass, allMats,
    setGlow(a) { edges.material.opacity = a; volMat.opacity = 0.42 * a; },
    setOpacity(a) { // fade whole model (used for morph transitions)
      for (const m of allMats) { m.transparent = a < 1; m.opacity = a; m.depthWrite = a > 0.5; }
      if (a <= 0.01) pivot.visible = false;
    },
  };
}

function woodTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#c8b291'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16; i++) { g.fillStyle = `rgba(120,90,60,${0.05 + (i % 3) * 0.03})`; g.fillRect(0, i * 32, 512, 1.5); }
  for (let i = 0; i < 400; i++) { g.fillStyle = 'rgba(110,80,50,0.06)'; g.fillRect((i * 97) % 512, (i * 53) % 512, 60, 1); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// Plan drawing as a 3D panel (canvas texture), with animated RTL draw-on reveal
export function buildPlanPanel(key, { size = 1024, style = 'blueprint', w = 14 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, w), new THREE.MeshBasicMaterial({ color: 0x0b1626, transparent: true, opacity: 0.0, depthWrite: false }));
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, w), mat);
  const root = new THREE.Group(); root.add(back, mesh);
  let last = -1;
  return { root, mat, back, set(reveal, alpha = 1, backAlpha = 0.55) {
    const r = Math.round(reveal * 120) / 120;
    if (r !== last) { drawPlan(ctx, LAYOUTS[key], { size, style, reveal: r }); tex.needsUpdate = true; last = r; }
    mat.opacity = alpha; back.material.opacity = backAlpha * alpha; root.visible = alpha > 0.01;
  } };
}
