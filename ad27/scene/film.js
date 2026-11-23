// Abu Dhabi Real Estate — 27-second film. Deterministic renderer: window.renderAt(t) draws frame t (seconds).
// Everything is drawn programmatically on one Canvas 2D: real boundary data (Overture Maps / OpenStreetMap),
// real building footprints + heights, a perspective camera with near-plane clipping, and sourced statistics.
// Layout is authored on a 1920×1080 grid and scaled by K, so ?w=1920 previews and ?w=3840 renders 4K.
const Q = new URLSearchParams(location.search);
const W = +(Q.get('w') || 3840), H = Math.round(W * 9 / 16), K = W / 1920;
const cv = document.getElementById('c'); cv.width = W; cv.height = H; cv.style.width = W + 'px'; cv.style.height = H + 'px';
const ctx = cv.getContext('2d');

// ---------------------------------------------------------------- data
const [GEO, BLD, FILM, ASSETS] = await Promise.all(['/data/geo27.json', '/data/buildings27.json', './film.json', './assets.json'].map((u) => fetch(u).then((r) => r.json())));
const LON0 = GEO.origin[0], LAT0 = GEO.origin[1], RE = 6378137, S0 = Math.cos(LAT0 * Math.PI / 180);
const mercY = (lat) => RE * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
const geo = (lon, lat) => [RE * (lon - LON0) * Math.PI / 180 * S0, (mercY(lat) - mercY(LAT0)) * S0];
const ungeo = (x, y) => [LON0 + x / (RE * S0) * 180 / Math.PI, (2 * Math.atan(Math.exp((y / S0 + mercY(LAT0)) / RE)) - Math.PI / 2) * 180 / Math.PI];

// ---------------------------------------------------------------- style
const C = {
  bg: '#050B14', sea0: '#071423', sea1: '#0A1C30', land: '#1A2533', landTop: '#202D3C', side: '#0B121B', coast: '#3A4B5F',
  nb: '#141D28', nbTop: '#18222E', gold: '#D9B26F', goldHi: '#F4DCA8', teal: '#5CC8D6', text: '#EEF2F6', muted: '#8E9CAF', dim: '#5D6B7D',
};
const EMC = { 'AE-AZ': '#C9A86A', 'AE-DU': '#4FA3A5', 'AE-SH': '#6C8EBF', 'AE-AJ': '#9C7FB8', 'AE-UQ': '#B87A8B', 'AE-RK': '#7FAE85', 'AE-FU': '#C88A5A' };
const F = (w, px, fam = 'Inter') => `${w} ${Math.round(px * K)}px ${fam === 'serif' ? 'Cormorant' : 'Inter'}`;

// ---------------------------------------------------------------- math
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const ss = (e0, e1, x) => { const u = clamp((x - e0) / (e1 - e0)); return u * u * (3 - 2 * u); };
const eio = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const eo = (u) => 1 - Math.pow(1 - clamp(u), 3);
const eoBack = (u) => { u = clamp(u); const c1 = 1.5; return 1 + (c1 + 1) * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const fmt = (v, d) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

// ---------------------------------------------------------------- camera
// cam = {x, y (world m), w (visible width in m at the focus), p (pitch°, 0 = top-down), b (bearing° that points up), oy (focus screen y 0..1)}
const ISL = Object.fromEntries(Object.entries(GEO.islands));
const ORDER = FILM.islands.map((i) => i.key);
const islC = ORDER.reduce((a, k) => [a[0] + ISL[k].pin[0] / 7, a[1] + ISL[k].pin[1] / 7], [0, 0]);
const ovw = 54e3, ovC = [islC[0] + 0.19 * ovw, islC[1] - 2.0e3];
const KEYS = [
  { t: 0.0, x: geo(54.6, 25.0)[0], y: geo(54.6, 25.0)[1], w: 1450e3, p: 0, b: 0 },
  { t: 1.5, x: geo(54.45, 24.75)[0], y: geo(54.45, 24.75)[1], w: 860e3, p: 14, b: 0 },
  { t: 4.0, x: geo(54.5, 24.7)[0], y: geo(54.5, 24.7)[1], w: 760e3, p: 20, b: 0 },
  { t: 7.75, x: ovC[0], y: ovC[1], w: ovw, p: 42, b: -4 },
];
function camMap(t) {
  if (t <= KEYS[3].t) {
    let i = 0; while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
    const A = KEYS[i], B = KEYS[i + 1], u = clamp((t - A.t) / (B.t - A.t));
    const big = B.w / A.w < 0.2;                       // long zoom: position leads, scale follows (keeps target on screen)
    const up = big ? eio(clamp(u * 1.15)) : eio(u), uw = eio(u);
    return { x: lerp(A.x, B.x, up), y: lerp(A.y, B.y, up), w: Math.exp(lerp(Math.log(A.w), Math.log(B.w), uw)), p: lerp(A.p, B.p, eio(u)), b: lerp(A.b, B.b, eio(u)), oy: 0.5 };
  }
  // islands: gentle drift toward the island in focus
  const tgt = (k) => { const P = ISL[k].pin; return [ovC[0] + 0.12 * (P[0] - islC[0]), ovC[1] + 0.12 * (P[1] - islC[1])]; };
  let pos = [ovC[0], ovC[1]], w = ovw;
  for (let i = 0; i < 7; i++) {
    const ti = FILM.islands[i].t - 0.15, u = eio(clamp((t - ti) / 0.7));
    if (u <= 0) break;
    const g = tgt(ORDER[i]); pos = [lerp(pos[0], g[0], u), lerp(pos[1], g[1], u)]; w = lerp(w, ovw * 0.94, u);
  }
  const back = eio(clamp((t - 15.0) / 1.2));             // pull back, all seven lit
  pos = [lerp(pos[0], ovC[0], back), lerp(pos[1], ovC[1], back)]; w = lerp(w, ovw * 1.25, back);
  return { x: pos[0], y: pos[1], w, p: lerp(42, 34, back), b: -4 + (t - 7.75) * 0.25, oy: 0.5 };
}
function camEnd(t) {     // closing: oblique wide (all seven) → push toward the Corniche / Reem / Maryah skyline
  const A = { x: ovC[0] - 0.12 * ovw, y: islC[1] - 6e3, w: 46e3, p: 50, b: -6 };
  const [bx, by] = geo(54.372, 24.468);
  const B = { x: bx, y: by, w: 5.5e3, p: 69, b: -14 };
  const u = eio(clamp((t - 23.0) / 2.6)), uw = eio(clamp((t - 23.25) / 2.35));
  return { x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), w: Math.exp(lerp(Math.log(A.w), Math.log(B.w), uw)), p: lerp(A.p, B.p, u), b: lerp(A.b, B.b, u), oy: lerp(0.5, 0.6, u) };
}

// projection state (set per frame)
let PJ;
function setCam(c) {
  const scale = W / c.w, f = 1.55 * H, D = f / scale, p = c.p * Math.PI / 180, b = c.b * Math.PI / 180;
  PJ = { ...c, scale, f, D, cp: Math.cos(p), sp: Math.sin(p), cb: Math.cos(b), sb: Math.sin(b), near: 0.06 * D, cy: H * c.oy };
}
function toCam(x, y, h = 0) {
  const dx = x - PJ.x, dy = y - PJ.y, rx = dx * PJ.cb - dy * PJ.sb, ry = dx * PJ.sb + dy * PJ.cb;
  return [rx, ry * PJ.cp + h * PJ.sp, PJ.D + ry * PJ.sp - h * PJ.cp];
}
const camToScr = (q) => [W / 2 + q[0] * PJ.f / q[2], PJ.cy - q[1] * PJ.f / q[2]];
const proj = (x, y, h = 0) => { const q = toCam(x, y, h); return q[2] < PJ.near ? null : camToScr(q); };
function projRing(ring, h = 0) {                // Sutherland–Hodgman clip against the near plane, then project
  const n = ring.length, out = []; let prev = toCam(ring[n - 1][0], ring[n - 1][1], h), pin = prev[2] >= PJ.near;
  for (let i = 0; i < n; i++) {
    const cur = toCam(ring[i][0], ring[i][1], h), cin = cur[2] >= PJ.near;
    if (cin !== pin) { const u = (PJ.near - prev[2]) / (cur[2] - prev[2]); out.push(camToScr([lerp(prev[0], cur[0], u), lerp(prev[1], cur[1], u), PJ.near])); }
    if (cin) out.push(camToScr(cur));
    prev = cur; pin = cin;
  }
  return out;
}
function ringBBoxVisible(ring) {   // cheap cull in world space
  const R = PJ.w * 2.2; let any = false;
  for (let i = 0; i < ring.length; i += Math.max(1, ring.length >> 4)) { if (Math.abs(ring[i][0] - PJ.x) < R && Math.abs(ring[i][1] - PJ.y) < R * 1.6) { any = true; break; } }
  return any || ring.length > 200;
}
function pathRings(rings, h = 0, cull = true) {
  ctx.beginPath();
  for (const r of rings) {
    if (cull && !ringBBoxVisible(r)) continue;
    const s = projRing(r, h); if (s.length < 3) continue;
    ctx.moveTo(s[0][0], s[0][1]); for (let i = 1; i < s.length; i++) ctx.lineTo(s[i][0], s[i][1]); ctx.closePath();
  }
}
// precomputed per-ring bboxes for faster culling of big sets
for (const set of [GEO.ad_land, ...Object.values(GEO.countries).map((c) => c.rings), ...Object.values(GEO.emirates).map((e) => e.rings)]) for (const r of set) r.n = r.length;

// ---------------------------------------------------------------- buildings (real footprints + heights)
const BUILD = BLD.buildings.map((b) => {
  let a = 0, cx = 0, cy = 0; const c = b.c;
  for (let i = 0; i < c.length; i++) { const p = c[i], q = c[(i + 1) % c.length]; a += p[0] * q[1] - q[0] * p[1]; cx += p[0]; cy += p[1]; }
  return { h: b.h, c, ccw: a > 0, cx: cx / c.length, cy: cy / c.length };
});
function drawBuildings(alpha, exag, warm = 0) {
  if (alpha <= 0.01) return;
  const R = PJ.w * 1.6, list = [];
  for (const b of BUILD) {
    if (Math.abs(b.cx - PJ.x) > R || Math.abs(b.cy - PJ.y) > R * 1.8) continue;
    const q = toCam(b.cx, b.cy, 0); if (q[2] < PJ.near * 1.5) continue;
    list.push([q[2], b]);
  }
  list.sort((a, b) => b[0] - a[0]);
  const fx = PJ.sb, fy = PJ.cb;   // camera forward (world) = bearing direction
  const L = [-0.55, -0.35];        // key light from the south-west-ish (world xy, normalised later)
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineJoin = 'round';
  for (const [, b] of list) {
    const hh = b.h * exag, c = b.c, n = c.length, tall = clamp((b.h - 40) / 180);
    const base = c.map((p) => proj(p[0], p[1], 0)), top = c.map((p) => proj(p[0], p[1], hh));
    if (base.some((v) => !v) || top.some((v) => !v)) continue;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, ex = c[j][0] - c[i][0], ey = c[j][1] - c[i][1], len = Math.hypot(ex, ey) || 1;
      let nx = ey / len, ny = -ex / len; if (!b.ccw) { nx = -nx; ny = -ny; }
      if (nx * fx + ny * fy > 0.02) continue;              // back face
      const lit = 0.35 + 0.65 * clamp(-(nx * L[0] + ny * L[1]) / 0.65);
      const wl = warm * (0.4 + 0.6 * tall); const r = Math.round(lerp(38, 104, lit) + wl * 80), g = Math.round(lerp(48, 112, lit) + wl * 56), bl = Math.round(lerp(64, 132, lit) + wl * 10);
      ctx.fillStyle = `rgb(${r},${g},${bl})`;
      ctx.beginPath(); ctx.moveTo(base[i][0], base[i][1]); ctx.lineTo(base[j][0], base[j][1]); ctx.lineTo(top[j][0], top[j][1]); ctx.lineTo(top[i][0], top[i][1]); ctx.closePath(); ctx.fill();
      const wallPx = Math.abs(base[i][1] - top[i][1]);
      if (warm > 0 && b.h > 45 && wallPx > 14 * K) {          // floor-light bands (night look), spacing ~ every 4 floors
        const nb = Math.min(14, Math.floor(b.h / 14)); ctx.strokeStyle = `rgba(255,214,150,${0.22 * warm})`; ctx.lineWidth = Math.max(0.6, wallPx / nb * 0.18); ctx.beginPath();
        for (let q = 1; q < nb; q++) { const u = q / nb; ctx.moveTo(lerp(base[i][0], top[i][0], u), lerp(base[i][1], top[i][1], u)); ctx.lineTo(lerp(base[j][0], top[j][0], u), lerp(base[j][1], top[j][1], u)); }
        ctx.stroke();
      }
    }
    ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(top[i][0], top[i][1]); ctx.closePath();
    ctx.fillStyle = tall > 0.3 ? '#74859C' : '#4E5D72'; ctx.fill();
    if (tall > 0.25) { ctx.strokeStyle = hexA(C.goldHi, 0.25 + 0.5 * tall * warm); ctx.lineWidth = 0.8 * K; ctx.stroke(); }
  }
  ctx.restore();
}

// ---------------------------------------------------------------- images (user asset library)
const IMG = {};
await Promise.all(Object.entries(ASSETS.islands || {}).filter(([, v]) => v.length).map(([k, v]) => new Promise((res) => { const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = res; im.src = '/ad27' + v[0]; })));
for (const key of ['skyline', 'logo']) if (ASSETS[key]) await new Promise((res) => { const im = new Image(); im.onload = () => { IMG[key] = im; res(); }; im.onerror = res; im.src = '/ad27' + ASSETS[key]; });
function drawCover(im, x, y, w, h, zoom = 1, px = 0, py = 0) {
  const s = Math.max(w / im.width, h / im.height) * zoom, iw = im.width * s, ih = im.height * s;
  ctx.drawImage(im, x + (w - iw) / 2 + px, y + (h - ih) / 2 + py, iw, ih);
}

// ---------------------------------------------------------------- text helpers
function text(str, x, y, font, color, align = 'left', alpha = 1, track = 0) {
  if (alpha <= 0.005) return; ctx.save(); ctx.globalAlpha *= alpha; ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  if (track) ctx.letterSpacing = `${track * K}px`;
  ctx.fillText(str, x * K, y * K); ctx.restore();
}
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x * K, y * K, w * K, h * K, r * K); }
function kicker(str, x, y, a) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = C.gold; ctx.fillRect(x * K, (y - 7) * K, 26 * K * eo(a), 2 * K); ctx.restore();
  text(str, x + 38, y, F(600, 15), C.gold, 'left', a, 3);
}
function titleBlock(t, t0, t1, kick, title, sub, x = 96, y = 118) {
  const a = ss(t0, t0 + 0.45, t) * (1 - ss(t1 - 0.35, t1, t)); if (a <= 0) return;
  const dy = (1 - eo(clamp((t - t0) / 0.6))) * 16;
  kicker(kick, x, y + dy, a);
  text(title, x, y + 62 + dy, F(600, 54, 'serif'), C.text, 'left', a);
  if (sub) text(sub, x, y + 98 + dy, F(400, 20), C.muted, 'left', a * ss(t0 + 0.2, t0 + 0.7, t));
}

// ---------------------------------------------------------------- map layers
function drawSea(alpha = 1) {
  const g = ctx.createRadialGradient(W * 0.45, H * 0.45, 0, W * 0.5, H * 0.5, W * 0.75);
  g.addColorStop(0, C.sea1); g.addColorStop(1, C.sea0); ctx.fillStyle = g; ctx.globalAlpha = alpha; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
}
function graticule(alpha) {
  if (alpha <= 0) return;
  const step = PJ.w > 400e3 ? 1 : PJ.w > 80e3 ? 0.25 : 0.05;
  const [lon0, lat0] = ungeo(PJ.x, PJ.y), span = PJ.w / 111e3 * 1.6;
  ctx.save(); ctx.strokeStyle = hexA('#7FA6C9', 0.07 * alpha); ctx.lineWidth = 1 * K; ctx.beginPath();
  for (let lo = Math.floor((lon0 - span) / step) * step; lo <= lon0 + span; lo += step) {
    let first = true; for (let la = lat0 - span; la <= lat0 + span; la += span / 24) { const s = proj(...geo(lo, la)); if (!s) { first = true; continue; } first ? ctx.moveTo(s[0], s[1]) : ctx.lineTo(s[0], s[1]); first = false; }
  }
  for (let la = Math.floor((lat0 - span) / step) * step; la <= lat0 + span; la += step) {
    let first = true; for (let lo = lon0 - span; lo <= lon0 + span; lo += span / 24) { const s = proj(...geo(lo, la)); if (!s) { first = true; continue; } first ? ctx.moveTo(s[0], s[1]) : ctx.lineTo(s[0], s[1]); first = false; }
  }
  ctx.stroke(); ctx.restore();
}
function extruded(rings, topCol, sideCol, alpha, thick, coastCol, coastW = 1) {
  if (alpha <= 0.01) return;
  ctx.save(); ctx.globalAlpha = alpha;
  if (PJ.p > 2) { pathRings(rings, -thick); ctx.fillStyle = sideCol; ctx.fill(); }
  pathRings(rings, 0); ctx.fillStyle = topCol; ctx.fill();
  if (coastCol) { ctx.strokeStyle = coastCol; ctx.lineWidth = coastW * K; ctx.lineJoin = 'round'; ctx.stroke(); }
  ctx.restore();
}
function glowStroke(rings, color, width, blur, alpha, dash = 1) {
  if (alpha <= 0.01) return;
  ctx.save(); ctx.globalAlpha = alpha; pathRings(rings, 0, false);
  ctx.strokeStyle = color; ctx.lineWidth = width * K; ctx.lineJoin = 'round'; ctx.shadowColor = color; ctx.shadowBlur = blur * K;
  if (dash < 1) { const L = 40000 * K; ctx.setLineDash([L * dash, L]); }
  ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = alpha * 0.9; ctx.lineWidth = width * 0.45 * K; ctx.strokeStyle = '#FFF4DC'; ctx.stroke(); ctx.restore();
}
function label(str, sx, sy, a, opts = {}) {
  if (a <= 0.01) return;
  const { size = 18, color = C.text, weight = 600, pill = true, dx = 0, dy = 0, lead = false, sub = null, align = 'left' } = opts;
  ctx.save(); ctx.globalAlpha = a; ctx.font = F(weight, size); ctx.letterSpacing = `${0.6 * K}px`;
  const tw = ctx.measureText(str).width, lx = sx + dx * K, ly = sy + dy * K;
  if (lead) { ctx.strokeStyle = hexA(C.text, 0.55); ctx.lineWidth = 1.2 * K; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(lx + (align === 'right' ? 6 * K : -6 * K), ly - size * 0.35 * K); ctx.stroke(); ctx.fillStyle = C.text; ctx.beginPath(); ctx.arc(sx, sy, 3 * K, 0, 7); ctx.fill(); }
  const x0 = align === 'right' ? lx - tw : lx;
  if (pill) { ctx.fillStyle = 'rgba(5,11,20,0.72)'; ctx.beginPath(); ctx.roundRect(x0 - 10 * K, ly - size * 1.05 * K, tw + 20 * K, size * 1.5 * K + (sub ? 20 * K : 0), 5 * K); ctx.fill(); }
  ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.fillText(str, x0, ly);
  if (sub) { ctx.font = F(400, 13); ctx.fillStyle = C.muted; ctx.fillText(sub, x0, ly + 19 * K); }
  ctx.restore();
}
function waterLabel(str, lon, lat, a, size = 16) { const s = proj(...geo(lon, lat)); if (!s) return; ctx.save(); ctx.globalAlpha = a; ctx.font = `italic 500 ${Math.round(size * K)}px Cormorant`; ctx.letterSpacing = `${4 * K}px`; ctx.fillStyle = '#7F9BB8'; ctx.textAlign = 'center'; ctx.fillText(str, s[0], s[1]); ctx.restore(); }
function countryLabel(str, lon, lat, a) { const s = proj(...geo(lon, lat)); if (!s) return; ctx.save(); ctx.globalAlpha = a; ctx.font = F(500, 14); ctx.letterSpacing = `${5 * K}px`; ctx.fillStyle = '#6F7F93'; ctx.textAlign = 'center'; ctx.fillText(str, s[0], s[1]); ctx.restore(); }

// emirate label placement (screen offsets on the 1920 grid; small northern emirates use leader lines into the sea)
const EML = { 'AE-AZ': { dx: 0, dy: 0 }, 'AE-DU': { dx: -150, dy: -20, lead: 1, align: 'right' }, 'AE-SH': { dx: -170, dy: -70, lead: 1, align: 'right' }, 'AE-AJ': { dx: -180, dy: -110, lead: 1, align: 'right' },
  'AE-UQ': { dx: -170, dy: -150, lead: 1, align: 'right' }, 'AE-RK': { dx: -150, dy: -200, lead: 1, align: 'right' }, 'AE-FU': { dx: 130, dy: 40, lead: 1 } };
const EMT = (o) => 1.45 + (o - 1) * 0.34;          // reveal times: 1.45 … 3.49 s

function drawPin(sx, sy, a, drop, col = C.gold, big = true) {
  if (a <= 0.01) return;
  const hgt = (big ? 58 : 34) * K, off = (1 - eoBack(drop)) * -70 * K;
  ctx.save(); ctx.globalAlpha = a;
  const pr = (t) => { ctx.strokeStyle = hexA(col, (1 - t) * 0.8); ctx.lineWidth = 2 * K; ctx.beginPath(); ctx.ellipse(sx, sy, (8 + 46 * t) * K, (8 + 46 * t) * K * Math.max(0.35, PJ.cp), 0, 0, 7); ctx.stroke(); };
  if (big && drop > 0.5) { pr((drop * 1.6) % 1); }
  ctx.fillStyle = hexA(col, 0.9); ctx.beginPath(); ctx.ellipse(sx, sy, 5 * K, 5 * K * Math.max(0.4, PJ.cp), 0, 0, 7); ctx.fill();
  const g = ctx.createLinearGradient(0, sy - hgt + off, 0, sy); g.addColorStop(0, hexA(col, 1)); g.addColorStop(1, hexA(col, 0.1));
  ctx.strokeStyle = g; ctx.lineWidth = 2.2 * K; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy - hgt + off); ctx.stroke();
  ctx.shadowColor = col; ctx.shadowBlur = 18 * K; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(sx, sy - hgt + off, (big ? 9 : 6) * K, 0, 7); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = '#0A1420'; ctx.beginPath(); ctx.arc(sx, sy - hgt + off, (big ? 3.6 : 2.4) * K, 0, 7); ctx.fill();
  ctx.restore();
  return [sx, sy - hgt + off];
}
// island label offsets (1920 grid) chosen to avoid overlaps between Reem / Maryah / Lulu
const ILO = { yas: [-18, -6, 'right'], fahid: [16, -10], saadiyat: [16, -12], reem: [18, 20], maryah: [-18, -12, 'right'], hudayriyat: [16, -8], lulu: [-18, -8, 'right'] };

function drawMapScene(t, cam, opt = {}) {
  setCam(cam);
  drawSea(1);
  graticule(1);
  const w = PJ.w, thick = w * 0.011;
  const reg = ss(55e3, 170e3, w), det = 1 - ss(70e3, 150e3, w), w2 = PJ.w;
  // neighbours + region
  if (reg > 0) {
    for (const [code, c] of Object.entries(GEO.countries)) if (code !== 'AE') extruded(c.rings, C.nbTop, C.side, reg, thick, hexA('#53647A', 0.6), 1);
    const dimOthers = opt.focusAZ || 0;
    for (const [code, e] of Object.entries(GEO.emirates)) {
      const rv = opt.reveal ? ss(EMT(e.order), EMT(e.order) + 0.32, t) : 1;
      const base = C.landTop, col = EMC[code];
      const isAZ = code === 'AE-AZ';
      const k = isAZ ? 1 : 1 - 0.75 * dimOthers;
      extruded(e.rings, base, C.side, reg, thick, null);
      if (rv > 0) { ctx.save(); ctx.globalAlpha = reg * rv * (isAZ ? lerp(0.42, 0.55, dimOthers) : 0.58) * k; pathRings(e.rings); ctx.fillStyle = col; ctx.fill(); ctx.restore(); }
      if (rv > 0) { ctx.save(); ctx.globalAlpha = reg * 0.7 * k; pathRings(e.rings); ctx.strokeStyle = hexA('#0A1320', 0.9); ctx.lineWidth = 1.2 * K; ctx.stroke(); ctx.restore(); }
    }
    // UAE border draw-on
    if (opt.border != null) glowStroke(GEO.countries.AE.rings, C.goldHi, 2.2, 22, reg * opt.borderA, opt.border);
    if (dimOthers > 0) glowStroke(GEO.emirates['AE-AZ'].rings, C.goldHi, 2.4, 26, reg * dimOthers, 1);
  }
  // Abu Dhabi detail land
  if (det > 0 && reg < 1) { ctx.save(); ctx.globalAlpha = 1 - reg; pathRings(GEO.emirates['AE-AZ'].rings); ctx.fillStyle = C.landTop; ctx.fill(); ctx.restore(); }
  if (det > 0) extruded(GEO.ad_land, C.landTop, C.side, det, thick * 1.2, hexA('#4A5D74', 0.9 * det * det * det), 1.1);
  // islands highlights
  if (opt.islands) {
    for (let i = 0; i < 7; i++) {
      const I = FILM.islands[i], R = ISL[I.key].rings, a = opt.islands(i);
      if (a.on <= 0) continue;
      ctx.save(); ctx.globalAlpha = det * a.on * a.fill; pathRings(R, 0, false); ctx.fillStyle = C.gold; ctx.fill(); ctx.restore();
      glowStroke(R, a.cur > 0.5 ? C.goldHi : C.gold, a.cur > 0.5 ? 3.2 : 2.0, a.cur > 0.5 ? 30 : 14, det * a.on, a.draw);
    }
  }
  if (opt.buildings) drawBuildings(det * opt.buildings, opt.exag || clamp(w / 14e3, 1, 3), opt.warm || 0);
  // atmospheric depth (far = darker/bluer) + vignette
  if (PJ.p > 5) { const g = ctx.createLinearGradient(0, 0, 0, H * 0.6); g.addColorStop(0, hexA('#050B14', (opt.atmo ?? 0.9) * ss(10, 70, PJ.p))); g.addColorStop(1, 'rgba(5,11,20,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.6); }
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(2,5,10,0.78)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- HUD
function hud(t, a) {
  if (a <= 0) return;
  const [lon, lat] = ungeo(PJ.x, PJ.y);
  text(`${lat.toFixed(3)}° N   ${lon.toFixed(3)}° E`, 96, 1026, F(500, 14), C.muted, 'left', a * 0.9, 2);
  const km = PJ.w / 1000; text(`VIEW ${km >= 100 ? Math.round(km) : km.toFixed(1)} KM`, 330, 1026, F(500, 14), C.dim, 'left', a * 0.9, 2);
  text('Map data © OpenStreetMap contributors (ODbL) · Overture Maps Foundation', 1824, 1026, F(400, 13), C.dim, 'right', a * 0.85);
}

// ---------------------------------------------------------------- island card (right panel)
function islandCard(t) {
  const i = clamp(Math.floor(t - 8), 0, 6), I = FILM.islands[i], lt = t - I.t;
  const aIn = ss(7.9, 8.3, t) * (1 - ss(15.0, 15.4, t)); if (aIn <= 0) return;
  const sw = ss(0, 0.28, lt), x = 1288, y = 236, w = 540, h = 640;
  ctx.save(); ctx.globalAlpha = aIn;
  rrect(x, y, w, h, 14); ctx.fillStyle = 'rgba(6,13,23,0.82)'; ctx.fill(); ctx.strokeStyle = hexA(C.gold, 0.35); ctx.lineWidth = 1 * K; ctx.stroke();
  ctx.restore();
  // progress dots
  for (let k = 0; k < 7; k++) { ctx.save(); ctx.globalAlpha = aIn * (k <= i ? 1 : 0.3); ctx.fillStyle = k === i ? C.goldHi : k < i ? C.gold : C.dim; ctx.beginPath(); ctx.roundRect((x + 36 + k * 22) * K, (y + 34) * K, (k === i ? 16 : 8) * K, 4 * K, 2 * K); ctx.fill(); ctx.restore(); }
  const a = aIn * sw, dy = (1 - eo(clamp(lt / 0.4))) * 14;
  text(`${String(i + 1).padStart(2, '0')} / 07`, x + w - 36, y + 42, F(600, 14), C.gold, 'right', aIn, 2);
  text(I.name, x + 36, y + 104 + dy, F(600, 46, 'serif'), C.text, 'left', a);
  // tagline (wrap on ' · ')
  const parts = I.tag.split(' · '); let line = '', ly = y + 142 + dy; ctx.font = F(500, 17);
  const lines = []; for (const p of parts) { const tryL = line ? line + '  ·  ' + p : p; if (ctx.measureText(tryL).width > (w - 72) * K) { lines.push(line); line = p; } else line = tryL; } lines.push(line);
  lines.forEach((l, k) => text(l, x + 36, ly + k * 26, F(500, 17), C.goldHi, 'left', a));
  // visual: user photo if provided, else a true-shape data inset of the island (OSM outline + real buildings)
  const fx = x + 36, fy = y + 210, fw = w - 72, fh = 292;
  ctx.save(); rrect(fx, fy, fw, fh, 8); ctx.clip(); ctx.globalAlpha = a;
  if (IMG[I.key]) { drawCover(IMG[I.key], fx * K, fy * K, fw * K, fh * K, 1.06 + 0.06 * clamp(lt), -10 * K * lt, 0); }
  else islandInset(I.key, fx, fy, fw, fh, lt);
  ctx.restore();
  ctx.save(); ctx.globalAlpha = a; rrect(fx, fy, fw, fh, 8); ctx.strokeStyle = hexA(C.gold, 0.3); ctx.lineWidth = 1 * K; ctx.stroke(); ctx.restore();
  text(IMG[I.key] ? 'Project imagery: client asset library' : 'True shape · OpenStreetMap outline, building heights from Overture', fx + 12, fy + fh - 12, F(400, 12), '#AEB9C7', 'left', a * 0.9);
  text(I.fact, x + 36, fy + fh + 50 + dy * 0.5, F(600, 19), C.text, 'left', a);
  text(I.factSrc, x + 36, fy + fh + 76 + dy * 0.5, F(400, 14), C.muted, 'left', a);
}
function islandInset(key, x, y, w, h, lt) {
  const isl = ISL[key]; let x0 = 1e18, y0 = 1e18, x1 = -1e18, y1 = -1e18;
  for (const r of isl.rings) for (const p of r) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  const g = ctx.createLinearGradient(0, y * K, 0, (y + h) * K); g.addColorStop(0, '#0B1D31'); g.addColorStop(1, '#081422'); ctx.fillStyle = g; ctx.fillRect(x * K, y * K, w * K, h * K);
  const s = Math.min((w - 60) / (x1 - x0), (h - 60) / (y1 - y0)) * K * (1 + 0.05 * clamp(lt)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const X = (p) => (x + w / 2) * K + (p[0] - cx) * s, Y = (p) => (y + h / 2) * K - (p[1] - cy) * s;
  // neighbouring land for context
  ctx.beginPath(); for (const r of GEO.ad_land) { if (Math.abs(r[0][0] - cx) > 40e3 && r.length < 400) continue; ctx.moveTo(X(r[0]), Y(r[0])); for (const p of r) ctx.lineTo(X(p), Y(p)); ctx.closePath(); }
  ctx.fillStyle = '#18232F'; ctx.fill();
  ctx.beginPath(); for (const r of isl.rings) { ctx.moveTo(X(r[0]), Y(r[0])); for (const p of r) ctx.lineTo(X(p), Y(p)); ctx.closePath(); }
  ctx.fillStyle = hexA(C.gold, 0.16); ctx.fill(); ctx.strokeStyle = C.goldHi; ctx.lineWidth = 2 * K; ctx.shadowColor = C.gold; ctx.shadowBlur = 14 * K; ctx.stroke(); ctx.shadowBlur = 0;
  // building footprints within the island bbox, brightness by height
  for (const b of BUILD) {
    if (b.cx < x0 || b.cx > x1 || b.cy < y0 || b.cy > y1) continue;
    ctx.beginPath(); ctx.moveTo(X(b.c[0]), Y(b.c[0])); for (const p of b.c) ctx.lineTo(X(p), Y(p)); ctx.closePath();
    ctx.fillStyle = hexA('#E9EEF5', 0.25 + 0.6 * clamp(b.h / 200)); ctx.fill();
  }
  // north arrow + scale bar
  ctx.fillStyle = C.muted; ctx.font = F(600, 11); ctx.textAlign = 'center'; ctx.fillText('N', (x + w - 22) * K, (y + 22) * K);
  ctx.strokeStyle = C.muted; ctx.lineWidth = 1.2 * K; ctx.beginPath(); ctx.moveTo((x + w - 22) * K, (y + 28) * K); ctx.lineTo((x + w - 22) * K, (y + 44) * K); ctx.stroke();
  const km = [0.5, 1, 2, 5].find((k) => k * 1000 * s > 60 * K) || 5; ctx.beginPath(); ctx.moveTo((x + 14) * K, (y + 20) * K); ctx.lineTo((x + 14) * K + km * 1000 * s, (y + 20) * K); ctx.stroke();
  ctx.textAlign = 'left'; ctx.fillText(`${km} km`, (x + 14) * K, (y + 36) * K);
}

// ---------------------------------------------------------------- statistics (16–23 s)
function statsScene(t) {
  // dark backdrop with slow faint map + grid
  ctx.fillStyle = '#050A12'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.16; setCam({ x: ovC[0] - 4e3, y: ovC[1], w: 70e3 + (t - 16) * 2e3, p: 30, b: -4 + (t - 16) * 0.8, oy: 0.55 }); extruded(GEO.ad_land, '#1A2736', '#0A1018', 1, 300, hexA('#3D5068', 1), 1); ctx.restore();
  const v = ctx.createLinearGradient(0, 0, W, 0); v.addColorStop(0, 'rgba(5,10,18,0.96)'); v.addColorStop(0.6, 'rgba(5,10,18,0.82)'); v.addColorStop(1, 'rgba(5,10,18,0.93)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.strokeStyle = 'rgba(120,160,200,0.05)'; ctx.lineWidth = 1 * K; ctx.beginPath(); for (let gx = 0; gx <= 1920; gx += 80) { ctx.moveTo(gx * K, 0); ctx.lineTo(gx * K, H); } for (let gy = 0; gy <= 1080; gy += 80) { ctx.moveTo(0, gy * K); ctx.lineTo(W, gy * K); } ctx.stroke(); ctx.restore();
  const A = ss(16.0, 16.5, t) * (1 - ss(22.75, 23.05, t));
  ctx.save(); ctx.globalAlpha = A;
  kicker('THE INVESTMENT PERSPECTIVE', 96, 108, 1);
  text('Abu Dhabi Real Estate — A Market in Transformation', 96, 168, F(600, 52, 'serif'), C.text, 'left', ss(16.05, 16.5, t));
  const p1 = 1 - ss(19.35, 19.65, t), p2 = ss(19.5, 19.85, t);
  if (p1 > 0) statsP1(t, p1); if (p2 > 0) statsP2(t, p2);
  text('All figures historical unless marked. Annual = year-on-year; quarterly figures noted. Sources: official releases (see on-screen credits).', 96, 1040, F(400, 12.5), C.dim, 'left', 0.9);
  ctx.restore();
}
function counter(v, d, prefix, suffix, u) { return prefix + fmt(v * eo(u), d) + suffix; }
function statsP1(t, a) {
  const P = FILM.stats.p1, dy = (1 - a) * -30;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, dy * K);
  text('A · MARKET PERFORMANCE', 96, 236, F(600, 15), C.teal, 'left', 1, 3);
  // bar chart (same scale; full year vs half year clearly labelled)
  const bx = 150, by = 900, bh = 500, bw = 270, gap = 140, max = 150;
  ctx.strokeStyle = 'rgba(200,215,230,0.15)'; ctx.lineWidth = 1 * K;
  for (let g = 0; g <= 150; g += 50) { const yy = by - g / max * bh; ctx.beginPath(); ctx.moveTo((bx - 20) * K, yy * K); ctx.lineTo((bx + 2 * bw + gap + 40) * K, yy * K); ctx.stroke(); text(`${g}`, bx - 30, yy + 5, F(400, 13), C.dim, 'right'); }
  text('AED bn', bx - 30, by - bh - 22, F(500, 13), C.dim, 'right');
  P.hero.forEach((s, k) => {
    const t0 = 16.55 + k * 0.45, u = eo(clamp((t - t0) / 1.1)), x = bx + k * (bw + gap), hh = s.value / max * bh * u;
    const g = ctx.createLinearGradient(0, (by - hh) * K, 0, by * K); g.addColorStop(0, k ? C.goldHi : C.gold); g.addColorStop(1, hexA(C.gold, 0.25));
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x * K, (by - hh) * K, bw * K, hh * K, [6 * K, 6 * K, 0, 0]); ctx.fill();
    text(counter(s.value, s.decimals, s.prefix, s.suffix, u), x + bw / 2, by - hh - 52, F(700, 40), C.text, 'center', ss(t0, t0 + 0.2, t));
    const ba = ss(t0 + 0.8, t0 + 1.1, t); ctx.save(); ctx.globalAlpha *= ba; ctx.font = F(700, 16); const bwid = ctx.measureText(s.badge).width / K + 22;
    ctx.fillStyle = 'rgba(5,10,18,0.82)'; ctx.beginPath(); ctx.roundRect((x + bw / 2 - bwid / 2) * K, (by - hh + 14) * K, bwid * K, 26 * K, 13 * K); ctx.fill(); ctx.restore();
    text(s.badge, x + bw / 2, by - hh + 33, F(700, 16), C.teal, 'center', ba);
    text(s.period, x + bw / 2, by + 34, F(600, 17), C.text, 'center');
    text(s.src, x + bw / 2, by + 58, F(400, 13), C.muted, 'center');
  });
  // tiles
  P.tiles.forEach((s, k) => {
    const t0 = 17.0 + k * 0.3, u = clamp((t - t0) / 1.0), x = 960, y = 250 + k * 222, w = 860, h = 196, ta = ss(t0, t0 + 0.3, t);
    ctx.save(); ctx.globalAlpha *= ta; rrect(x, y, w, h, 12); ctx.fillStyle = 'rgba(14,26,42,0.85)'; ctx.fill(); ctx.strokeStyle = 'rgba(217,178,111,0.22)'; ctx.lineWidth = 1 * K; ctx.stroke();
    ctx.fillStyle = C.gold; ctx.fillRect(x * K, (y + 24) * K, 3 * K, (h - 48) * K); ctx.restore();
    text(counter(s.value, s.decimals, s.prefix, s.suffix, u), x + 40, y + 92, F(700, 58), C.text, 'left', ta);
    text(s.label, x + 40, y + 132, F(600, 20), C.text, 'left', ta);
    text(s.delta, x + 40, y + 162, F(500, 16), C.teal, 'left', ta);
    text(s.src, x + w - 30, y + 40, F(500, 13), C.muted, 'right', ta, 1);
  });
  ctx.restore();
}
function statsP2(t, a) {
  const P = FILM.stats.p2, dy = (1 - a) * 30;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, dy * K);
  const cols = [{ x: 96, label: 'B · RESIDENTIAL MARKET' }, { x: 1036, label: 'C · INVESTMENT & DEMAND' }];
  P.groups.forEach((g, gi) => {
    const X = cols[gi].x; text(cols[gi].label, X, 236, F(600, 15), C.teal, 'left', 1, 3);
    g.items.forEach((s, k) => {
      const col = k % 2, row = Math.floor(k / 2), x = X + col * 400, y = 258 + row * 214, w = 380, h = 194;
      const t0 = 19.7 + gi * 0.25 + k * 0.12, u = clamp((t - t0) / 0.9), ta = ss(t0, t0 + 0.25, t);
      ctx.save(); ctx.globalAlpha *= ta; rrect(x, y, w, h, 12); ctx.fillStyle = 'rgba(14,26,42,0.85)'; ctx.fill(); ctx.strokeStyle = 'rgba(217,178,111,0.2)'; ctx.lineWidth = 1 * K; ctx.stroke(); ctx.restore();
      text(counter(s.value, s.decimals, s.prefix, s.suffix, u), x + 28, y + 76, F(700, 48), C.text, 'left', ta);
      text(s.label, x + 28, y + 114, F(600, 18), C.text, 'left', ta);
      text(s.period, x + 28, y + 142, F(500, 15), C.teal, 'left', ta);
      text(s.src, x + 28, y + 170, F(400, 13), C.muted, 'left', ta);
    });
  });
  // outlook strip
  const O = P.outlook, oa = ss(20.6, 21.0, t), y = 720;
  ctx.save(); ctx.globalAlpha *= oa; rrect(96, y, 1720, 214, 12); ctx.fillStyle = 'rgba(217,178,111,0.07)'; ctx.fill(); ctx.setLineDash([6 * K, 6 * K]); ctx.strokeStyle = hexA(C.gold, 0.5); ctx.lineWidth = 1 * K; ctx.stroke(); ctx.restore();
  text('D · FUTURE OUTLOOK', 124, y + 40, F(600, 15), C.gold, 'left', oa, 3);
  text(O.title, 124, y + 66, F(500, 14), C.muted, 'left', oa);
  O.items.forEach((s, k) => { const ia = ss(20.75 + k * 0.15, 21.05 + k * 0.15, t); const xx = 124 + k * 425, yy = y + 128; ctx.save(); ctx.globalAlpha *= ia; ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc((xx + 5) * K, (yy - 6) * K, 4 * K, 0, 7); ctx.fill(); ctx.restore(); text(s, xx + 20, yy, F(500, 18), C.text, 'left', ia); });
  text('Sources: Disney & Miral (May 2025) · Aldar (2025) · The National (Aug 2026) · ADREC H1 2026', 124, y + 190, F(400, 12), C.dim, 'left', oa);
  ctx.restore();
}

// ---------------------------------------------------------------- closing
function closing(t) {
  const cam = camEnd(t);
  const all = (i) => ({ on: 1, fill: 0.16 + 0.06 * Math.sin(t * 4 + i), draw: 1, cur: 1 });
  drawMapScene(t, cam, { islands: all, buildings: ss(23.0, 23.6, t), warm: 1, atmo: lerp(0.9, 0.35, ss(23.6, 24.6, t)), exag: lerp(2.2, 1.25, ss(23.5, 25.4, t)) });
  // pins + names for all seven
  const la = ss(23.15, 23.5, t) * (1 - ss(23.95, 24.3, t));
  ORDER.forEach((k, i) => { const s = proj(ISL[k].pin[0], ISL[k].pin[1], 0); if (!s) return; const top = drawPin(s[0], s[1], la, 1, C.goldHi, false); if (top) label(GEO.islands[k].name, top[0], top[1], la * 0.95, { size: 14, dx: ILO[k][0] * 0.8, dy: ILO[k][1] + 4, align: ILO[k][2] || 'left' }); });
  // statement
  const sa = ss(23.95, 24.35, t) * (1 - ss(25.2, 25.45, t));
  if (sa > 0) {
    const g = ctx.createLinearGradient(0, H * 0.55, 0, H); g.addColorStop(0, 'rgba(4,8,15,0)'); g.addColorStop(0.45, 'rgba(4,8,15,0.7)'); g.addColorStop(1, 'rgba(4,8,15,0.85)');
    ctx.save(); ctx.globalAlpha = sa; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    text('Abu Dhabi is not just a real estate market.', 960, 846 + (1 - eo(clamp((t - 23.95) / 0.5))) * 12, F(500, 58, 'serif'), C.text, 'center', sa);
    text('It is an evolving investment destination.', 960, 924 + (1 - eo(clamp((t - 24.25) / 0.5))) * 12, `italic ${F(500, 58, 'serif')}`, C.goldHi, 'center', sa * ss(24.25, 24.6, t));
  }
  // final screen
  const fa = ss(25.25, 25.6, t);
  if (fa > 0) {
    ctx.save(); ctx.globalAlpha = fa; ctx.fillStyle = '#050A12'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H * 0.46, 0, W / 2, H * 0.46, W * 0.5); g.addColorStop(0, 'rgba(217,178,111,0.07)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    const L = ['Understand the Market.', 'Identify the Opportunity.', 'Invest Strategically.'];
    L.forEach((s, k) => { const t0 = 25.45 + k * 0.28, u = eo(clamp((t - t0) / 0.5)); text(s, 960, 430 + k * 92 + (1 - u) * 14, F(600, 60), k === 2 ? C.goldHi : C.text, 'center', ss(t0, t0 + 0.35, t), 0.5); });
    const ra = ss(26.1, 26.5, t); ctx.save(); ctx.globalAlpha = ra; ctx.fillStyle = C.gold; const rw = 160 * eo(clamp((t - 26.1) / 0.5)); ctx.fillRect((960 - rw / 2) * K, 740 * K, rw * K, 2 * K); ctx.restore();
    if (IMG.logo) { const im = IMG.logo, lh = 70 * K, lw = im.width / im.height * lh; ctx.save(); ctx.globalAlpha = ra; ctx.drawImage(im, W / 2 - lw / 2, 780 * K, lw, lh); ctx.restore(); }
    else if (ASSETS.signoff) text(ASSETS.signoff, 960, 790, F(600, 16), C.gold, 'center', ra, 6);
    text('Data: ADREC · Statistics Centre – Abu Dhabi · DCT Abu Dhabi · Cavendish Maxwell · Savills.  Map data © OpenStreetMap contributors (ODbL), Overture Maps Foundation.  Not investment advice.', 960, 1036, F(400, 12.5), C.dim, 'center', fa);
  }
}

// ---------------------------------------------------------------- master timeline
function renderAt(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.setLineDash([]); ctx.letterSpacing = '0px';
  if (t < 16.0) {
    const cam = camMap(t);
    const islFn = (i) => {
      const ti = FILM.islands[i].t, on = ss(ti - 0.05, ti + 0.2, t), cur = t >= ti && t < ti + 1 ? 1 : 0, allOn = ss(15.0, 15.3, t);
      return { on, draw: eo(clamp((t - ti) / 0.45)), fill: cur ? 0.30 : lerp(0.1, 0.22, allOn), cur: Math.max(cur, allOn) };
    };
    drawMapScene(t, cam, { reveal: true, border: eo(clamp((t - 0.35) / 1.2)), borderA: ss(0.3, 0.6, t) * (1 - ss(4.6, 6.0, t)), focusAZ: ss(4.0, 4.7, t), islands: t > 7.8 ? islFn : null, buildings: ss(6.6, 7.6, t) * 0.95 });
    // scene 1 labels
    const regA = ss(55e3, 170e3, PJ.w);
    const nbA = (1 - ss(3.6, 4.6, t)) * regA * 0.9;
    countryLabel('SAUDI ARABIA', 51.6, 23.2, nbA); countryLabel('OMAN', 56.6, 23.0, nbA); countryLabel('QATAR', 51.2, 25.35, nbA); countryLabel('IRAN', 55.0, 27.25, nbA);
    waterLabel('ARABIAN GULF', 52.6, 26.3, nbA * (1 - ss(1.0, 1.5, t)), 20); waterLabel('GULF OF OMAN', 57.6, 24.85, nbA * 0.9, 16);
    for (const [code, e] of Object.entries(GEO.emirates)) {
      const t0 = EMT(e.order), a = ss(t0 + 0.05, t0 + 0.35, t) * (1 - ss(4.0, 4.5, t)) * regA; if (a <= 0) continue;
      const s = proj(e.label[0], e.label[1]); if (!s) continue; const o = EML[code];
      if (code === 'AE-AZ') label(e.name.toUpperCase(), s[0], s[1], a, { size: 22, pill: false, color: C.text, align: 'left', dx: -70 });
      else label(e.name, s[0], s[1], a, { size: 16, dx: o.dx, dy: o.dy, lead: !!o.lead, align: o.align || 'left' });
      // order chip
    }
    titleBlock(t, 0.45, 4.0, '01 — THE UNITED ARAB EMIRATES', 'Seven Emirates. One Nation.', 'Federal boundaries from OpenStreetMap / Overture Maps');
    // scene 2
    const AZs = proj(...geo(54.37, 24.47));
    titleBlock(t, 4.3, 7.85, '02 — THE CAPITAL', 'Abu Dhabi', 'Capital of the United Arab Emirates · largest emirate by area');
    if (AZs) { const a = ss(6.4, 6.9, t) * (1 - ss(7.6, 8.0, t)); label('ABU DHABI ISLAND', AZs[0], AZs[1], a, { size: 16, pill: true, color: C.goldHi, dx: -60, dy: 30 }); }
    // scene 3: pins + labels
    if (t > 7.8) {
      for (let i = 0; i < 7; i++) {
        const I = FILM.islands[i], ti = I.t, a = ss(ti - 0.02, ti + 0.15, t) * (1 - ss(15.6, 16.0, t)); if (a <= 0) continue;
        const s = proj(ISL[I.key].pin[0], ISL[I.key].pin[1], 0); if (!s) continue;
        const cur = t >= ti && t < ti + 1;
        const top = drawPin(s[0], s[1], a, clamp((t - ti) / 0.5), cur ? C.goldHi : C.gold, cur || t > 15);
        const [dx, dy, al] = ILO[I.key];
        if (top) label(I.name, top[0], top[1], a * (cur ? 1 : 0.85), { size: cur ? 19 : 15, dx, dy, align: al || 'left', color: cur ? C.goldHi : C.text });
      }
      titleBlock(t, 7.9, 15.7, '03 — KEY INVESTMENT DESTINATIONS', 'Seven islands. Seven identities.', null);
      islandCard(t);
    }
    hud(t, ss(0.2, 0.8, t) * (1 - ss(15.4, 15.9, t)));
    // to-dark transition into data
    const d = ss(15.55, 16.0, t); if (d > 0) { ctx.fillStyle = `rgba(5,10,18,${d})`; ctx.fillRect(0, 0, W, H); }
    // opening: map is already faintly visible on frame 0 (no black frame)
    const o = 1 - ss(0.0, 0.5, t); if (o > 0) { ctx.fillStyle = `rgba(5,11,20,${o * 0.65})`; ctx.fillRect(0, 0, W, H); }
  } else if (t < 23.0) {
    statsScene(t);
  } else {
    closing(t);
    const x = 1 - ss(23.0, 23.3, t); if (x > 0) { ctx.fillStyle = `rgba(5,10,18,${x})`; ctx.fillRect(0, 0, W, H); }
  }
  // gentle film grain-free finishing: thin letterbox safe lines none; return
}
window.renderAt = renderAt;
await document.fonts.load(F(600, 20)); await document.fonts.load(F(600, 20, 'serif')); await document.fonts.load(`italic ${F(500, 20, 'serif')}`);
for (const w of [400, 500, 600, 700]) await document.fonts.load(F(w, 20));
await document.fonts.load(F(500, 20, 'serif')); await document.fonts.load(`italic 500 20px Cormorant`);
await document.fonts.ready;
renderAt(0);
window.__ready = true;
