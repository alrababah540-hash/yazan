import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { makeEnvironment, makeBackdrop } from './materials.js';

// Film finish: vignette, gentle film grain (seeded by frame → deterministic), slight lens
// chromatic fringe at edges, and a global fade used for scene in/out.
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uFade: { value: 0 }, uVig: { value: 0.32 }, uGrain: { value: 0.035 }, uFadeCol: { value: new THREE.Vector3(0.027, 0.055, 0.098) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uFade, uVig, uGrain; uniform vec3 uFadeCol; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime*7.13) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5; float r2 = dot(d,d);
      vec2 off = d * 0.0022 * r2 * 4.0;
      vec3 c = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      c *= 1.0 - uVig * smoothstep(0.08, 0.55, r2 * 1.6);
      c += (h(vUv * vec2(1080.,1920.)) - 0.5) * uGrain;
      c = mix(c, uFadeCol, uFade);
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export function createEngine(canvas, { width = 1080, height = 1920, dof = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.9;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.environment = makeEnvironment(renderer);
  const backdrop = makeBackdrop(); scene.add(backdrop);
  scene.fog = new THREE.FogExp2(0x1a2433, 0.0016);

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.3, 6000);

  // lighting: warm low sun (key, shadows) + cool sky fill + subtle rim
  const sun = new THREE.DirectionalLight(0xffc890, 3.2);
  sun.position.set(-120, 70, 95); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
  const sc = sun.shadow.camera; sc.left = -80; sc.right = 80; sc.top = 120; sc.bottom = -60; sc.near = 10; sc.far = 400;
  sun.shadow.radius = 4;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0x6f88b0, 0x1e1a17, 0.35); scene.add(hemi);
  const rim = new THREE.DirectionalLight(0x9fb8ff, 0.5); rim.position.set(80, 40, 120); scene.add(rim);

  // Composer at full res with MSAA render target for clean architectural edges
  const rt = new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(1); composer.setSize(width, height);
  const renderPass = new RenderPass(scene, camera); composer.addPass(renderPass);
  const bokeh = new BokehPass(scene, camera, { focus: 80, aperture: 0.00012, maxblur: 0.006 });
  bokeh.enabled = dof; composer.addPass(bokeh);
  const bloom = new UnrealBloomPass(new THREE.Vector2(width / 2, height / 2), 0.35, 0.6, 0.86); composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader); composer.addPass(grade);

  return { renderer, scene, camera, composer, sun, hemi, rim, bloom, bokeh, grade, backdrop };
}
