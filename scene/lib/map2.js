import * as THREE from 'three';

// Abu Dhabi map v2 — current OpenStreetMap coastline via Overture Maps (data/abudhabi_map_v2.json, ODbL).
// The four focus islands are the polygons carrying their official OSM names.
// World units: 1 unit = 1/K metres; x = east, z = −north (north-up when camera yaw = 0).
export const K2 = 0.012;

function shapeFrom(r) {
  const s = new THREE.Shape(r.outer.map(([x, y]) => new THREE.Vector2(x * K2, y * K2)));
  for (const h of r.holes) s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x * K2, y * K2))));
  return s;
}
function linesFrom(rings, y) {
  const p = [];
  for (const r of rings) for (const ring of [r.outer, ...r.holes]) for (let i = 0; i < ring.length - 1; i++) p.push(ring[i][0] * K2, ring[i][1] * K2, y, ring[i + 1][0] * K2, ring[i + 1][1] * K2, y);
  return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
}

export async function buildMap2(M) {
  const D = await (await fetch('/data/abudhabi_map_v2.json')).json();
  const root = new THREE.Group();
  const flat = new THREE.Group(); flat.rotation.x = -Math.PI / 2; root.add(flat); // shape XY → world X,−Z
  // sea: deep navy lacquer with a very faint nautical grid
  const gc = document.createElement('canvas'); gc.width = gc.height = 512; const g = gc.getContext('2d');
  g.fillStyle = '#08121f'; g.fillRect(0, 0, 512, 512); g.strokeStyle = 'rgba(226,199,143,0.06)'; g.lineWidth = 1.5;
  for (let i = 0; i <= 512; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); }
  const gt = new THREE.CanvasTexture(gc); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(40, 40); gt.colorSpace = THREE.SRGBColorSpace;
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshStandardMaterial({ map: gt, roughness: 0.55, metalness: 0.0, envMapIntensity: 0.25 }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -0.3; root.add(sea);
  // context land: deep slate
  const landTop = new THREE.MeshStandardMaterial({ color: 0x1b2532, roughness: 0.9, metalness: 0.0, side: THREE.DoubleSide });
  const landSide = new THREE.MeshStandardMaterial({ color: 0x111822, roughness: 0.95, side: THREE.DoubleSide });
  for (const r of D.land) flat.add(new THREE.Mesh(new THREE.ExtrudeGeometry(shapeFrom(r), { depth: 0.45, bevelEnabled: false, curveSegments: 1 }), [landTop, landSide]));
  const coast = new THREE.LineSegments(linesFrom(D.land, 0.47), new THREE.LineBasicMaterial({ color: 0xe2c78f, transparent: true, opacity: 0.22, depthWrite: false }));
  flat.add(coast);
  // focus islands: own materials so each can light up in gold
  const focus = {};
  for (const [k, f] of Object.entries(D.focus)) {
    const top = new THREE.MeshStandardMaterial({ color: 0x242c36, roughness: 0.6, metalness: 0.3, emissive: 0xc9a96a, emissiveIntensity: 0, side: THREE.DoubleSide });
    const side = new THREE.MeshStandardMaterial({ color: 0x6f5a35, roughness: 0.6, metalness: 0.4, side: THREE.DoubleSide });
    const grp = new THREE.Group();
    for (const r of f.rings) grp.add(new THREE.Mesh(new THREE.ExtrudeGeometry(shapeFrom(r), { depth: 0.6, bevelEnabled: false, curveSegments: 1 }), [top, side]));
    const edge = new THREE.LineSegments(linesFrom(f.rings, 0.62), new THREE.LineBasicMaterial({ color: 0xf0d59c, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false }));
    grp.add(edge); flat.add(grp);
    const pos = new THREE.Vector3(f.xy[0] * K2, 0.6, -f.xy[1] * K2);
    // animated location marker: stem, glowing head, pulsing ground ring
    const pin = new THREE.Group(); pin.position.copy(pos);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 7, 10), M.gold); stem.position.y = 3.5;
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.05, 28, 18), new THREE.MeshStandardMaterial({ color: 0xe2c78f, emissive: 0xc9a96a, emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.3 }));
    head.position.y = 7.6;
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf0d59c, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.0, 64), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.1;
    pin.add(stem, head, ring); root.add(pin);
    focus[k] = { ...f, pos, top, edge, pin, head, ring, ringMat, base: new THREE.Color(0.14, 0.17, 0.21), hi: new THREE.Color(0.64, 0.59, 0.41) };
  }
  return { root, focus, source: D.source,
    setFocus(k, a, pulseT) { // a ∈ [0,1] highlight; pulseT seconds since marker drop
      const F = focus[k]; F.top.emissiveIntensity = 0.55 * a; F.top.color.copy(F.base).lerp(F.hi, a);
      F.edge.material.opacity = 0.35 + 0.65 * a;
      const p = ((pulseT % 1.6) + 1.6) % 1.6 / 1.6; F.ring.scale.setScalar(1 + 2.6 * p); F.ringMat.opacity = pulseT > 0 ? 0.85 * (1 - p) * (0.4 + 0.6 * a) : 0;
    },
    setPin(k, s) { const F = focus[k]; F.pin.visible = s > 0.001; F.pin.scale.set(1, Math.max(0.001, s), 1); },
  };
}
