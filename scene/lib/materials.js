import * as THREE from 'three';
import { rng } from './util.js';

// Design system — palette (linear-space conversion handled by THREE.Color)
export const PAL = {
  navy: 0x0b1626, navyDeep: 0x070e19, charcoal: 0x23262b, ivory: 0xf3eee4,
  stone: 0xd6c9b1, stoneDark: 0xa89a82, gold: 0xc9a96a, goldBright: 0xe2c78f,
  emerald: 0x2f6b57, concrete: 0xb8b2a8, glass: 0x1a2738,
};

function canvasTex(w, h, draw, repeat = 1, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat);
  t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Travertine-like natural stone: horizontal veining + pores (procedural, no external assets)
export function stoneTexture(seed = 3, base = '#d9ccb4') {
  const r = rng(seed);
  return canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const y = r() * h, th = 1 + r() * 10;
      g.fillStyle = `rgba(${150 + r() * 60},${130 + r() * 50},${100 + r() * 40},${0.04 + r() * 0.09})`;
      g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 6 + (r() - 0.5) * 3);
      g.lineTo(w, y + th); g.lineTo(0, y + th); g.fill();
    }
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = `rgba(110,90,60,${0.05 + r() * 0.12})`;
      g.beginPath(); g.ellipse(r() * w, r() * h, 0.5 + r() * 2.5, 0.4 + r() * 1.2, 0, 0, 7); g.fill();
    }
  });
}

export function concreteTexture(seed = 9) {
  const r = rng(seed);
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#bdb7ad'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const v = 150 + r() * 70; g.fillStyle = `rgba(${v},${v - 4},${v - 10},0.08)`;
      g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
    }
  });
}

// Generic roughness variation for large surfaces (breaks CG-perfect uniformity)
export function noiseTexture(seed = 5, size = 256) {
  const r = rng(seed);
  return canvasTex(size, size, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { const v = 150 + r() * 60; img.data.set([v, v, v, 255], i * 4); }
    g.putImageData(img, 0, 0);
  }, 1, false);
}

export function makeMaterials() {
  const stoneMap = stoneTexture(3);
  stoneMap.repeat.set(2, 6);
  const concMap = concreteTexture();
  const rough = noiseTexture();
  const M = {
    concrete: new THREE.MeshStandardMaterial({ color: 0xffffff, map: concMap, roughness: 0.92, metalness: 0 }),
    stone: new THREE.MeshStandardMaterial({ color: 0xffffff, map: stoneMap, roughness: 0.62, metalness: 0, roughnessMap: rough }),
    stoneLight: new THREE.MeshStandardMaterial({ color: 0x9d968a, roughness: 0.75 }),
    slab: new THREE.MeshStandardMaterial({ color: 0xcfc8bb, roughness: 0.8 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.35, metalness: 0.85 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x16222f, metalness: 0.35, roughness: 0.03, transparent: true, opacity: 0.55,
      envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: 0.03, side: THREE.DoubleSide, depthWrite: false,
    }),
    rail: new THREE.MeshPhysicalMaterial({ color: 0x8fa3b5, roughness: 0.05, transparent: true, opacity: 0.28, depthWrite: false }),
    metal: new THREE.MeshStandardMaterial({ color: 0x3a3f46, roughness: 0.35, metalness: 0.9 }),
    gold: new THREE.MeshStandardMaterial({ color: PAL.gold, roughness: 0.28, metalness: 1, envMapIntensity: 1.3 }),
    goldGlow: new THREE.MeshStandardMaterial({ color: PAL.gold, emissive: PAL.gold, emissiveIntensity: 0.6, roughness: 0.4, metalness: 0.6, transparent: true, opacity: 0.85 }),
    interior: new THREE.MeshBasicMaterial({ color: 0xffd9a0 }),
    interiorDim: new THREE.MeshBasicMaterial({ color: 0x5a4a38 }),
    ground: new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: 0.95 }),
    sand: new THREE.MeshStandardMaterial({ color: 0xcdbd9e, roughness: 1, map: concMap }),
    clay: new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.85 }),
    emerald: new THREE.MeshStandardMaterial({ color: PAL.emerald, roughness: 0.85 }),
    water: new THREE.MeshPhysicalMaterial({ color: 0x07121e, roughness: 0.22, metalness: 0.0, clearcoat: 0.6, clearcoatRoughness: 0.15, envMapIntensity: 0.55 }),
    line: new THREE.LineBasicMaterial({ color: PAL.goldBright, transparent: true, opacity: 1, depthWrite: false }),
    lineIvory: new THREE.LineBasicMaterial({ color: PAL.ivory, transparent: true, opacity: 0.6, depthWrite: false }),
  };
  M.stoneMap = stoneMap;
  return M;
}

// Image-based lighting: a procedural dusk sky (navy zenith, warm champagne horizon, soft
// sun disc and large area "softboxes") baked into a PMREM env map for physically based reflections.
export function makeEnvironment(renderer) {
  const s = new THREE.Scene();
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: {},
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec3 vP;
      void main(){
        float h = vP.y;
        vec3 zen = vec3(0.035,0.07,0.14), hor = vec3(1.05,0.78,0.52), gnd = vec3(0.06,0.06,0.07);
        vec3 c = mix(hor, zen, smoothstep(0.0, 0.55, h));
        c = mix(gnd, c, smoothstep(-0.08, 0.02, h));
        vec3 sd = normalize(vec3(-0.6,0.18,-0.75));
        float sun = pow(max(dot(vP, sd),0.), 300.)*5. + pow(max(dot(vP, sd),0.), 8.)*0.5;
        c += vec3(1.0,0.82,0.6)*sun;
        // overhead softbox for crisp glass highlights
        float box = smoothstep(0.92, 0.95, vP.y) * 1.4;
        c += vec3(box);
        gl_FragColor = vec4(c,1.);
      }`,
  });
  s.add(new THREE.Mesh(new THREE.SphereGeometry(50, 64, 32), skyMat));
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.02);
  pm.dispose();
  return rt.texture;
}

// Visible backdrop: graded gradient (navy → charcoal → faint champagne haze at horizon)
export function makeBackdrop() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uWarm: { value: 1 }, uDark: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position = p.xyww; }',
    fragmentShader: `uniform float uWarm, uDark; varying vec3 vP;
      void main(){
        float h = vP.y;
        vec3 zen = vec3(0.006,0.014,0.035), mid = vec3(0.03,0.045,0.075), hor = vec3(0.22,0.14,0.085);
        vec3 c = mix(mix(hor, mid, smoothstep(-0.02, 0.18, h)), zen, smoothstep(0.15, 0.7, h));
        c = mix(mid*0.6, c, smoothstep(-0.2, 0.0, h));
        c = mix(c, mix(zen, mid, 0.4 + 0.3*h), 1.0 - uWarm);
        c *= 1.0 - uDark;
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(4000, 48, 24), mat);
  m.frustumCulled = false; m.renderOrder = -10;
  return m;
}
