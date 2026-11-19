import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from './util.js';

const box = (w, h, d, x = 0, y = 0, z = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };
const beam = (a, b, t = 0.18) => { // lattice member between two points
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const len = A.distanceTo(B);
  const g = new THREE.BoxGeometry(t, len, t); g.translate(0, len / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  g.applyQuaternion(q); g.translate(A.x, A.y, A.z); return g;
};

// Tower crane: lattice mast, jib, counter-jib, cab, trolley + hook cable (ivory/charcoal, gold accent)
export function buildCrane(M, H = 120) {
  const root = new THREE.Group(); const parts = []; const s = 1.1;
  for (let y = 0; y < H; y += 2.2) {
    for (const [x, z] of [[-s, -s], [s, -s], [s, s], [-s, s]]) parts.push(beam([x, y, z], [x, y + 2.2, z], 0.22));
    parts.push(beam([-s, y, -s], [s, y + 2.2, -s], 0.08), beam([s, y, s], [-s, y + 2.2, s], 0.08), beam([s, y, -s], [s, y + 2.2, s], 0.08), beam([-s, y, s], [-s, y + 2.2, -s], 0.08));
  }
  const JL = 62, CL = 18;
  for (let x = 0; x < JL; x += 2.4) { parts.push(beam([x, H, -s], [x + 2.4, H, -s], 0.18), beam([x, H, s], [x + 2.4, H, s], 0.18), beam([x, H + 2, 0], [x + 2.4, H + 2, 0], 0.16), beam([x, H, -s], [x + 1.2, H + 2, 0], 0.07), beam([x + 1.2, H + 2, 0], [x + 2.4, H, s], 0.07)); }
  for (let x = 0; x > -CL; x -= 2.4) { parts.push(beam([x, H, -s], [x - 2.4, H, -s], 0.2), beam([x, H, s], [x - 2.4, H, s], 0.2)); }
  parts.push(beam([0, H, 0], [0, H + 9, 0], 0.4), beam([0, H + 9, 0], [JL * 0.7, H + 2, 0], 0.06), beam([0, H + 9, 0], [-CL, H + 1, 0], 0.08));
  const lattice = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({ color: 0xe9e3d6, roughness: 0.5, metalness: 0.3 }));
  lattice.castShadow = true;
  const cw = new THREE.Mesh(box(5, 3, 3, -CL + 3, H - 1, 0), M.concrete); cw.castShadow = true;
  const cab = new THREE.Mesh(box(2.6, 2.4, 2.4, 1.2, H - 1.4, s + 1.2), M.metal);
  const trolley = new THREE.Group(); trolley.position.set(JL * 0.62, H - 0.4, 0);
  const cableMat = new THREE.MeshStandardMaterial({ color: 0xc9a96a, metalness: 1, roughness: 0.3, emissive: 0xc9a96a, emissiveIntensity: 0.25 });
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 6), cableMat); cable.geometry.translate(0, -0.5, 0);
  const hook = new THREE.Mesh(box(0.9, 1.4, 0.5), M.gold); trolley.add(cable, hook);
  root.add(lattice, cw, cab, trolley);
  return { root, trolley, cable, hook, H, JL,
    setCable(len) { cable.scale.y = Math.max(0.01, len); hook.position.y = -len - 0.7; } };
}

// Studio set: seamless navy floor with fine blueprint grid fading to darkness
export function buildStudio() {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
  g.fillStyle = '#0d1828'; g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = 'rgba(226,199,143,0.07)'; g.lineWidth = 1;
  for (let i = 0; i <= 1024; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 1024); g.moveTo(0, i); g.lineTo(1024, i); g.stroke(); }
  g.strokeStyle = 'rgba(226,199,143,0.14)'; g.lineWidth = 2;
  for (let i = 0; i <= 1024; i += 256) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 1024); g.moveTo(0, i); g.lineTo(1024, i); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 30); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: t, roughness: 0.7, clearcoat: 0.25, clearcoatRoughness: 0.5, envMapIntensity: 0.08, transparent: true });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1500, 1500), mat); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.62; floor.receiveShadow = true;
  const root = new THREE.Group(); root.add(floor);
  return { root, floor, mat, setOpacity(a) { mat.opacity = a; root.visible = a > 0.01; } };
}

// Blueprint ground drawing for the tower (site plan + column grid), revealed radially by shader
export function buildBlueprint(T) {
  const S = 2048, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  const span = 110, k = S / span, X = (x) => S / 2 + x * k, Z = (z) => S / 2 + z * k;
  g.clearRect(0, 0, S, S);
  g.strokeStyle = 'rgba(226,199,143,0.16)'; g.lineWidth = 1.5;
  for (let x = -55; x <= 55; x += 2.5) { g.beginPath(); g.moveTo(X(x), 0); g.lineTo(X(x), S); g.moveTo(0, Z(x)); g.lineTo(S, Z(x)); g.stroke(); }
  g.strokeStyle = 'rgba(232,206,150,0.95)'; g.lineWidth = 5;
  g.strokeRect(X(-T.W / 2), Z(-T.D / 2), T.W * k, T.D * k);
  g.lineWidth = 3; g.strokeRect(X(-T.W / 2 - 2), Z(-T.D / 2 - 3), (T.W + 4) * k, (T.D + 6) * k);
  g.setLineDash([18, 12]); g.lineWidth = 3; g.strokeRect(X(-34), Z(-30), 68 * k, 62 * k); g.setLineDash([]);
  // structural grid axes + bubbles
  g.lineWidth = 2; g.strokeStyle = 'rgba(232,206,150,0.6)'; g.fillStyle = 'rgba(232,206,150,0.95)';
  const xs = [-1, -1 / 3, 1 / 3, 1].map((f) => f * (T.W / 2 - 2.2)), zs = [-1, 0, 1].map((f) => f * (T.D / 2 - 2.2));
  g.font = '600 34px "Plex Latin"'; g.textAlign = 'center'; g.textBaseline = 'middle';
  xs.forEach((x, i) => { g.beginPath(); g.moveTo(X(x), Z(-T.D / 2 - 9)); g.lineTo(X(x), Z(T.D / 2 + 9)); g.stroke(); g.beginPath(); g.arc(X(x), Z(-T.D / 2 - 11), 26, 0, 7); g.stroke(); g.fillText(String.fromCharCode(65 + i), X(x), Z(-T.D / 2 - 11)); });
  zs.forEach((z, i) => { g.beginPath(); g.moveTo(X(-T.W / 2 - 9), Z(z)); g.lineTo(X(T.W / 2 + 9), Z(z)); g.stroke(); g.beginPath(); g.arc(X(-T.W / 2 - 11), Z(z), 26, 0, 7); g.stroke(); g.fillText(String(i + 1), X(-T.W / 2 - 11), Z(z)); });
  xs.forEach((x) => zs.forEach((z) => { g.fillRect(X(x) - 12, Z(z) - 12, 24, 24); }));
  // landscape & pool outlines
  g.strokeStyle = 'rgba(232,206,150,0.45)'; g.lineWidth = 2.5; g.strokeRect(X(-21), Z(18.5), 22 * k, 7 * k);
  for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2; g.beginPath(); g.arc(X(Math.cos(a) * 30), Z(Math.sin(a) * 27 + 2), 1.6 * k, 0, 7); g.stroke(); }
  // north arrow + dimension
  g.beginPath(); g.moveTo(X(44), Z(-40)); g.lineTo(X(46), Z(-34)); g.lineTo(X(42), Z(-34)); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(X(-T.W / 2), Z(T.D / 2 + 6)); g.lineTo(X(T.W / 2), Z(T.D / 2 + 6)); g.stroke();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { map: { value: tex }, uReveal: { value: 0 }, uAlpha: { value: 1 }, uGlow: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform sampler2D map; uniform float uReveal, uAlpha, uGlow; varying vec2 vUv;
      void main(){ vec4 c = texture2D(map, vUv); float d = length(vUv-0.5)*2.0;
        float front = smoothstep(uReveal, uReveal-0.06, d); float edge = smoothstep(0.05,0.0,abs(d-uReveal))*0.8;
        vec3 col = c.rgb * (1.2 + edge*2.0) * uGlow;
        gl_FragColor = vec4(col, c.a*front*uAlpha + edge*0.25*uAlpha*step(d,1.0)*c.a); }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(span, span), mat);
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = -0.4; mesh.renderOrder = 1;
  return { root: mesh, mat };
}

// Payment-plan timeline: booking/contract → construction installments → handover.
// Deliberately carries NO percentages (they differ by project and contract).
export function buildTimeline(M) {
  const root = new THREE.Group();
  const L = 60;
  const railMat = new THREE.MeshStandardMaterial({ color: 0xc9a96a, metalness: 1, roughness: 0.25, emissive: 0x8a6a30, emissiveIntensity: 0.4 });
  const RL = L - 8; // rail runs from booking to the handover milestone; pivot sits at handover
  const railPivot = new THREE.Group(); railPivot.position.x = L / 2 - 8;
  const rail = new THREE.Mesh(box(RL, 0.3, 0.3, -RL / 2, 0, 0), railMat); railPivot.add(rail);
  const base = new THREE.Mesh(box(L + 10, 0.6, 9, 0, -0.6, 0), M.stone); base.receiveShadow = true;
  root.add(base, railPivot);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xbfd0e0, roughness: 0.05, transmission: 0, transparent: true, opacity: 0.35, clearcoat: 1, envMapIntensity: 1.5 });
  const mk = (x, w, h, d) => {
    const g = new THREE.Group(); g.position.x = x;
    const plinth = new THREE.Mesh(box(w, h, d, 0, h / 2, 0), M.stone); plinth.castShadow = plinth.receiveShadow = true;
    const capGeo = box(w + 0.1, 0.18, d + 0.1, 0, h + 0.09, 0);
    const cap = new THREE.Mesh(capGeo, M.gold.clone());
    const glow = new THREE.Mesh(box(w * 0.92, 0.6, d * 0.92, 0, h + 0.5, 0), glassMat);
    g.add(plinth, cap, glow); g.userData = { cap, plinth, h }; root.add(g); return g;
  };
  const m1 = mk(-L / 2 + 6, 6, 2.6, 6);                     // booking & contract
  const inst = [0, 1, 2, 3, 4].map((i) => mk(-L / 2 + 17 + i * 6.2, 3.4, 1.6, 3.4)); // construction installments
  const m3 = mk(L / 2 - 8, 7, 3.4, 7);                      // handover
  // symbolic icons: contract sheet on m1, small key on m3
  const sheet = new THREE.Mesh(box(2.6, 0.08, 3.4, 0, 0, 0), new THREE.MeshStandardMaterial({ color: 0xf3eee4, roughness: 0.6 }));
  sheet.position.set(0, m1.userData.h + 0.5, 0); sheet.rotation.y = 0.3; m1.add(sheet);
  const key = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.22, 12, 32), M.gold); const shaft = new THREE.Mesh(box(2.2, 0.3, 0.3, 1.9, 0, 0), M.gold);
  const bit = new THREE.Mesh(box(0.3, 0.7, 0.3, 2.7, -0.35, 0), M.gold); key.add(ring, shaft, bit);
  key.position.set(-0.9, m3.userData.h + 1.6, 0); key.rotation.x = Math.PI / 2 * 0.0; m3.add(key);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffe9b8 }));
  root.add(head);
  return { root, rail, railPivot, m1, inst, m3, head, key, L, RL, base,
    xAt(u) { return -L / 2 + u * L; } };
}

// Abstract market line (no axes, no figures): a glowing ribbon over a glass panel
export function buildChart() {
  const root = new THREE.Group();
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(44, 26), new THREE.MeshPhysicalMaterial({ color: 0x16253a, roughness: 0.2, transparent: true, opacity: 0.55, clearcoat: 1, envMapIntensity: 1.2, side: THREE.DoubleSide }));
  const gridPts = []; for (let i = -2; i <= 2; i++) gridPts.push(-20, i * 5, 0.05, 20, i * 5, 0.05);
  const grid = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3)), new THREE.LineBasicMaterial({ color: 0xe2c78f, transparent: true, opacity: 0.15 }));
  const mat = new THREE.MeshBasicMaterial({ color: 0xe8cd96, toneMapped: false });
  const tube = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 12), new THREE.MeshBasicMaterial({ color: 0xfff1cc, toneMapped: false }));
  root.add(panel, grid, tube, dot);
  return { root, setPhase(t, draw = 1) {
    const pts = []; const n = 90;
    for (let i = 0; i <= Math.max(2, Math.floor(n * draw)); i++) {
      const u = i / n; const x = -19 + u * 38;
      const y = 3.2 * Math.sin(u * 7.0 + t * 2.2) + 2.1 * Math.sin(u * 13.0 - t * 1.6 + 1.3) + 1.2 * Math.sin(u * 23.0 + t * 3.1) ;
      pts.push(new THREE.Vector3(x, y * 1.15, 0.3));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    tube.geometry.dispose(); tube.geometry = new THREE.TubeGeometry(curve, pts.length * 2, 0.28, 8, false);
    dot.position.copy(pts[pts.length - 1]);
  } };
}

// Illustrative contract document (generic sample — no real legal text)
export function buildContract(M) {
  const S = 1024, c = document.createElement('canvas'); c.width = S; c.height = Math.round(S * 1.414); const g = c.getContext('2d');
  const H = c.height;
  g.fillStyle = '#f5f0e6'; g.fillRect(0, 0, S, H);
  g.strokeStyle = '#c9a96a'; g.lineWidth = 6; g.strokeRect(40, 40, S - 80, H - 80); g.lineWidth = 1.5; g.strokeRect(56, 56, S - 112, H - 112);
  const en = window.__LANG === 'en';
  g.fillStyle = '#1b2433'; g.textAlign = 'center'; g.direction = en ? 'ltr' : 'rtl';
  g.font = en ? '600 58px "Plex Latin"' : '700 70px "IBM Plex Sans Arabic"';
  g.fillText(en ? 'Sale & Purchase Agreement' : 'عقد بيع وحدة عقارية', S / 2, 190);
  g.font = en ? '500 32px "Plex Latin"' : '500 34px "IBM Plex Sans Arabic"'; g.fillStyle = '#7a6a50';
  g.fillText(en ? 'Off-plan unit — illustrative sample' : 'على المخطط — نموذج توضيحي', S / 2, 255);
  const r = rng(4); g.fillStyle = 'rgba(27,36,51,0.22)';
  let y = 340; const sections = en ? ['Developer', 'Project', 'Unit', 'Payment plan', 'Expected handover'] : ['المطوّر', 'المشروع', 'الوحدة', 'خطة الدفع', 'موعد التسليم المتوقع'];
  for (const s of sections) {
    g.fillStyle = '#1b2433'; g.textAlign = en ? 'left' : 'right'; g.font = en ? '600 36px "Plex Latin"' : '600 38px "IBM Plex Sans Arabic"'; g.fillText(s, en ? 110 : S - 110, y); y += 34;
    g.fillStyle = 'rgba(27,36,51,0.18)';
    for (let i = 0; i < 3; i++) { const w = (0.55 + r() * 0.3) * (S - 220); g.fillRect(en ? 110 : S - 110 - w, y, w, 12); y += 30; }
    y += 40;
  }
  g.strokeStyle = 'rgba(27,36,51,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(120, H - 200); g.lineTo(420, H - 200); g.moveTo(S - 420, H - 200); g.lineTo(S - 120, H - 200); g.stroke();
  g.beginPath(); g.strokeStyle = '#c9a96a'; g.lineWidth = 8; g.arc(S / 2, H - 220, 70, 0, 7); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(S / 2, H - 220, 54, 0, 7); g.stroke();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const W = 21, D = 29.7; const root = new THREE.Group();
  const paper = new THREE.MeshStandardMaterial({ color: 0xf2ede3, roughness: 0.7 });
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(box(W, 0.12, D, 0, i * 0.14, 0), i === 3 ? [paper, paper, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), paper, paper, paper] : paper);
    s.rotation.y = (i - 3) * 0.035; s.castShadow = s.receiveShadow = true; root.add(s);
  }
  const pen = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 14, 20), M.metal); body.rotation.z = Math.PI / 2;
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.6, 20), M.gold); tip.rotation.z = Math.PI / 2; tip.position.x = 6.5;
  pen.add(body, tip); pen.position.set(6, 1.0, 12); pen.rotation.y = -0.5; root.add(pen);
  return { root };
}

// Circular natural-stone plinth used for S6 match cuts and the S8 model reveal
export function buildPlinth(M, r = 14) {
  const root = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1.2, 96), M.stone); top.position.y = -0.6; top.receiveShadow = top.castShadow = true;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.05, 0.08, 8, 128), M.gold); ring.rotation.x = Math.PI / 2; ring.position.y = 0.0;
  root.add(top, ring); return { root };
}
