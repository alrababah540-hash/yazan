import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { stoneTexture } from './materials.js';

// Abu Dhabi map from OpenStreetMap-derived land polygons (data/abudhabi_land.json, ODbL).
// Projection: local metres around the bbox centre → world units (x = east, z = −north).
export const MAP_K = 0.012;

function chaikin(pts, it = 2) {
  let p = pts;
  for (let k = 0; k < it; k++) {
    const q = [];
    for (let i = 0; i < p.length - 1; i++) {
      const [a, b] = [p[i], p[i + 1]];
      q.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]], [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
    }
    q.push(q[0]); p = q;
  }
  return p;
}

export async function buildMap(M) {
  const data = await (await fetch('/data/abudhabi_land.json')).json();
  const root = new THREE.Group();
  const geos = []; const lines = [];
  for (const poly of data.polys) {
    const outer = chaikin(poly.outer);
    const shape = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x * MAP_K, y * MAP_K)));
    for (const h of poly.holes) shape.holes.push(new THREE.Path(chaikin(h).map(([x, y]) => new THREE.Vector2(x * MAP_K, y * MAP_K))));
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.9, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.2, bevelSegments: 1, curveSegments: 1 });
    geos.push(g);
    for (let i = 0; i < outer.length - 1; i++) lines.push(outer[i][0] * MAP_K, outer[i][1] * MAP_K, 1.25, outer[i + 1][0] * MAP_K, outer[i + 1][1] * MAP_K, 1.25);
  }

  const top = stoneTexture(17, '#d8cab0'); top.repeat.set(0.02, 0.02);
  const landTop = new THREE.MeshStandardMaterial({ color: 0xffffff, map: top, roughness: 0.75, transparent: true, side: THREE.DoubleSide });
  const landSide = new THREE.MeshStandardMaterial({ color: 0x8c7f6a, roughness: 0.85, transparent: true, side: THREE.DoubleSide });
  const land = new THREE.Group(); // one mesh per landmass (keeps cap/side material groups intact)
  for (const g of geos) { const m = new THREE.Mesh(g, [landTop, landSide]); m.receiveShadow = true; land.add(m); }
  land.rotation.x = -Math.PI / 2; // shape XY → world XZ (y north → −z)
  const coast = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(lines, 3)),
    new THREE.LineBasicMaterial({ color: 0xe2c78f, transparent: true, opacity: 0.35, depthWrite: false }));
  coast.rotation.x = -Math.PI / 2;
  // sea: lacquered navy with a fine nautical grid
  const gc = document.createElement('canvas'); gc.width = gc.height = 512; const g2 = gc.getContext('2d');
  g2.fillStyle = '#0a1522'; g2.fillRect(0, 0, 512, 512); g2.strokeStyle = 'rgba(226,199,143,0.10)'; g2.lineWidth = 2;
  for (let i = 0; i <= 512; i += 64) { g2.beginPath(); g2.moveTo(i, 0); g2.lineTo(i, 512); g2.moveTo(0, i); g2.lineTo(512, i); g2.stroke(); }
  const gt = new THREE.CanvasTexture(gc); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(24, 24); gt.colorSpace = THREE.SRGBColorSpace;
  const seaMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: gt, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2, envMapIntensity: 0.5, transparent: true });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), seaMat); sea.rotation.x = -Math.PI / 2; sea.position.y = -0.2;
  root.add(sea, land, coast);
  const labels = {};
  for (const [k, v] of Object.entries(data.labels)) labels[k] = new THREE.Vector3(v.x * MAP_K, 1.5, -v.y * MAP_K);
  // golden locator pins (generic area markers — not projects)
  const pins = {};
  for (const k of Object.keys(labels)) {
    const pin = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 8), M.gold); stem.position.y = 3;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 16), M.goldGlow); head.position.y = 6.4;
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.75, 48), new THREE.MeshBasicMaterial({ color: 0xe2c78f, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.15;
    pin.add(stem, head, ring); pin.position.copy(labels[k]); pin.position.y = 1.1; pin.userData = { head, ring, stem };
    root.add(pin); pins[k] = pin;
  }
  return { root, land, coast, sea, labels, pins, landTop, landSide, seaMat, source: data.source,
    setDrawing(d) { // coastline → architectural drawing transition
      landTop.color.setRGB(1 - 0.85 * d, 1 - 0.82 * d, 1 - 0.75 * d); landSide.color.setRGB(0.55 * (1 - d) + 0.04 * d, 0.5 * (1 - d) + 0.06 * d, 0.42 * (1 - d) + 0.1 * d);
      coast.material.opacity = 0.35 + 0.65 * d;
    },
    setOpacity(a) { landTop.opacity = landSide.opacity = seaMat.opacity = a; coast.material.opacity *= a; root.visible = a > 0.01; },
  };
}
