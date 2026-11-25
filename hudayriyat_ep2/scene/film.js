// Island Investment Series — Ep.01 Yas Island. 20.000 s, 9:16. Deterministic: window.renderAt(t).
// Layout authored on a 1080×1920 grid (K scales it); rendered at 1440×2560 and downsampled for crispness.
const Q = new URLSearchParams(location.search);
const W = +(Q.get('w') || 1440), H = Math.round(W * 16 / 9), K = W / 1080;
const cv = document.getElementById('c'); cv.width = W; cv.height = H; cv.style.width = W + 'px'; cv.style.height = H + 'px';
const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
const GEO = await fetch('/data/geo27.json').then((r) => r.json());
const POI = await fetch('/data/hudayriyat_poi.json').then((r) => r.json());

const C = { navy: '#050B14', navy2: '#0A1626', gold: '#D9B26F', champ: '#F1DDB0', white: '#F7F5F0', muted: '#AEB8C6', land: '#1B2735', coast: '#41546C' };
const F = (w, px, fam) => `${w} ${Math.round(px * K)}px ${fam === 'serif' ? 'Cormorant' : 'Inter'}`;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, u) => a + (b - a) * u;
const ss = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const eo = (u) => 1 - Math.pow(1 - clamp(u), 3), eio = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

// ---------------------------------------------------------------- images
const P = '/hudayriyat_ep2/assets/_prepared/';
const SRC = {
  master: '05_Masterplan/01_hudayriyat_masterplan_aerial_render.jpg', beach: '02_Beach/01_beach_loungers.jpg', cycle: '04_Cycling_Sports/01_cycling_coastal_track.jpg',
  nawayef: '07_Villas/01_nawayef_heights_modon_render.jpg', villa: '07_Villas/02_villa_twilight_render.jpg', sunset: '09_Sunset_Aerial/01_sunset_mangrove_cycling_track.jpg',
  family: '02_Beach/02_family_beach_pier.jpg', surf: '03_Surf_Abu_Dhabi/01_surf_abu_dhabi_aerial.jpg', velo: '04_Cycling_Sports/02_velodrome_concept_render.jpg', marina: '08_Waterfront_Marina/01_hudayriyat_marina_sign.jpg',
};
const IMG = {}, BLUR = {};
await Promise.all(Object.entries(SRC).map(([k, s]) => new Promise((res, rej) => { const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = () => rej(new Error('missing ' + s)); im.src = P + s; })));
for (const k of ['master']) {
  const c = document.createElement('canvas'); c.width = Math.round(W / 4); c.height = Math.round(H / 4); const x = c.getContext('2d');
  x.filter = 'blur(12px) brightness(0.42) saturate(0.9)'; const im = IMG[k], s = Math.max(c.width / im.width, c.height / im.height) * 1.15;
  x.drawImage(im, (c.width - im.width * s) / 2, (c.height - im.height * s) / 2, im.width * s, im.height * s); BLUR[k] = c;
}
const ORIG = { master: [1475, 831], beach: [1936, 1286], cycle: [1903, 1288], nawayef: [2215, 1230], villa: [2215, 1241], sunset: [1277, 1279], family: [2223, 1262], surf: [1925, 1281], velo: [1284, 1307], marina: [1930, 1283] };
const sc = (k) => IMG[k].width / ORIG[k][0];

// Full-bleed shot: cover the frame, keep focus point fx,fy (original px) near frame centre, zoom z, shift toward f1 over the shot
function full(k, u, o) {
  const im = IMG[k], s0 = sc(k), z = lerp(o.z0, o.z1, o.ease === 'fast' ? eo(u) : eio(u));
  const fx = lerp(o.f0[0], (o.f1 || o.f0)[0], eio(u)) * s0, fy = lerp(o.f0[1], (o.f1 || o.f0)[1], eio(u)) * s0;
  const s = Math.max(W / im.width, H / im.height) * z, iw = im.width * s, ih = im.height * s;
  const x = clamp(W / 2 - fx * s, W - iw, 0), y = clamp(H / 2 - fy * s, H - ih, 0);
  ctx.save(); ctx.filter = o.filter || 'contrast(1.06) saturate(1.06)'; ctx.drawImage(im, x, y, iw, ih); ctx.restore();
  return { x, y, s };
}
// Panel shot (landscape images whose subject would be cut by a 9:16 crop): blurred fill + full-width framed image
function panel(k, u, o) {
  ctx.drawImage(BLUR[k], 0, 0, W, H);
  const im = IMG[k], pw = W, nh = pw * im.height / im.width, ph = Math.min(nh, (o.maxH || 9999) * K), py = o.top != null ? o.top * K : (o.cy || 0.5) * H - ph / 2, z = lerp(1.0, 1.07, eio(u));
  ctx.save(); ctx.beginPath(); ctx.rect(0, py, pw, ph); ctx.clip(); ctx.filter = o.filter || 'contrast(1.05) saturate(1.05)';
  ctx.drawImage(im, (pw - pw * z) / 2 + (o.dx || 0) * 20 * K * u, py + (ph - nh * z) / 2 + (o.oy || 0) * K, pw * z, nh * z); ctx.restore();
  ctx.fillStyle = hexA(C.gold, 0.85); ctx.fillRect(0, py - 2 * K, W, 2 * K); ctx.fillRect(0, py + ph, W, 2 * K);
  return { py, ph };
}
function grade(warm = 0.14, top = 0.55, bottom = 0.75) {   // champagne soft-light + navy top/bottom for type legibility
  ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(241,205,150,${warm})`; ctx.fillRect(0, 0, W, H); ctx.restore();
  let g = ctx.createLinearGradient(0, 0, 0, H * 0.32); g.addColorStop(0, `rgba(5,11,20,${top})`); g.addColorStop(1, 'rgba(5,11,20,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.32);
  g = ctx.createLinearGradient(0, H * 0.5, 0, H); g.addColorStop(0, 'rgba(5,11,20,0)'); g.addColorStop(1, `rgba(5,11,20,${bottom})`); ctx.fillStyle = g; ctx.fillRect(0, H * 0.5, W, H * 0.5);
}

// ---------------------------------------------------------------- type
function text(s, x, y, font, color, a = 1, align = 'center', track = 0, shadow = true) {
  if (a <= 0.004) return; ctx.save(); ctx.globalAlpha *= a; ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.letterSpacing = `${track * K}px`;
  if (shadow) { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 18 * K; ctx.shadowOffsetY = 3 * K; }
  ctx.fillText(s, x * K, y * K); ctx.restore();
}
function fitFont(s, w, px, max, fam) { ctx.font = F(w, px, fam); const m = ctx.measureText(s).width / K; return m > max ? px * max / m : px; }
function rule(x, y, w, a) { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = C.gold; ctx.fillRect((x - w / 2) * K, y * K, w * K, 2.5 * K); ctx.restore(); }
function chip(s, y, a, sub) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.font = F(600, 26); ctx.letterSpacing = `${5 * K}px`;
  const w = ctx.measureText(s).width / K + 48; ctx.fillStyle = 'rgba(5,11,20,0.62)'; ctx.beginPath(); ctx.roundRect((540 - w / 2) * K, (y - 38) * K, w * K, 56 * K, 28 * K); ctx.fill();
  ctx.strokeStyle = hexA(C.gold, 0.7); ctx.lineWidth = 1.5 * K; ctx.stroke(); ctx.restore();
  text(s, 540, y, F(600, 26), C.champ, a, 'center', 5, false);
  if (sub) text(sub, 540, y + 46, F(500, 22), C.white, a * 0.92, 'center', 1);
}
function scrim(cy, h, a) {          // soft dark band behind central type
  if (a <= 0) return; const g = ctx.createLinearGradient(0, (cy - h / 2) * K, 0, (cy + h / 2) * K);
  g.addColorStop(0, 'rgba(5,11,20,0)'); g.addColorStop(0.3, `rgba(5,11,20,${0.62 * a})`); g.addColorStop(0.7, `rgba(5,11,20,${0.62 * a})`); g.addColorStop(1, 'rgba(5,11,20,0)');
  ctx.fillStyle = g; ctx.fillRect(0, (cy - h / 2) * K, W, h * K);
}
function series(a) { text('ISLAND INVESTMENT SERIES  ·  EP. 02', 540, 268, F(600, 22), C.gold, a, 'center', 6); }

// ================================================================ INTERACTIVE MASTERPLAN MAP (v2)
// The real top-down map of Hudayriyat (OpenStreetMap coastline + cycle tracks) is the permanent hero.
// Markers only where the position is verified (data/hudayriyat_poi.json); unplaced projects highlight the whole island.
const HUD = GEO.islands.hudayriyat; let hb = [1e9, 1e9, -1e9, -1e9];
for (const r of HUD.rings) for (const p of r) hb = [Math.min(hb[0], p[0]), Math.min(hb[1], p[1]), Math.max(hb[2], p[0]), Math.max(hb[3], p[1])];
const ISL = { cx: (hb[0] + hb[2]) / 2, cy: (hb[1] + hb[3]) / 2 };
const M = POI.markers;
let cwC = [0, 0, 0]; for (const l of POI.cycleways) for (const p of l) { cwC[0] += p[0]; cwC[1] += p[1]; cwC[2]++; } cwC = [cwC[0] / cwC[2], cwC[1] / cwC[2]];
const FOCUS_Y = 1180;                                  // markers sit here on screen (1080-grid); PiP floats above
const camFor = (x, y, w) => ({ x, y: y + (FOCUS_Y - 960) / 1080 * w, w });
const ISLAND_W = 19000, CLOSE_W = 5200;
// highlight sequence (times on the voice: lifestyle 5.15–9.15, coastline/communities 9.3–13.8, investment 14.15–17.7)
const SEQ = [
  { a: 2.6, b: 5.0, kind: 'island', img: 'master', label: 'OFFICIAL MASTERPLAN', sub: 'Modon · development render', top: 520 },
  { a: 5.0, b: 6.45, kind: 'pin', m: 'beach', img: 'family', label: 'HUDAYRIYAT BEACH', sub: 'Photograph' },
  { a: 6.45, b: 7.85, kind: 'pin', m: 'surf', img: 'surf', label: 'SURF ABU DHABI', sub: 'Photograph · wave pool, 75,000 m²' },
  { a: 7.85, b: 9.25, kind: 'cycle', img: 'cycle', label: 'CYCLING NETWORK', sub: 'Existing tracks shown · 220 km planned (Modon)' },
  { a: 9.25, b: 10.75, kind: 'island', img: 'velo', label: 'ABU DHABI VELODROME', sub: 'Planned · concept render · site not yet published' },
  { a: 10.75, b: 12.25, kind: 'island', card: true, label: 'HUDAYRIYAT GOLF ESTATES', sub: 'Modon community · 18-hole golf course' },
  { a: 12.25, b: 13.9, kind: 'island', img: 'nawayef', label: 'NAWAYEF', sub: 'Modon residential community · development render' },
  { a: 13.9, b: 15.8, kind: 'pin', m: 'marsana', img: 'marina', label: 'MARSANA WATERFRONT', sub: 'Photograph · Hudayriyat waterfront' },
];
const segAt = (t) => SEQ.find((s) => t >= s.a && t < s.b);
function camTarget(s) {
  if (!s || s.kind === 'island') return camFor(ISL.cx, ISL.cy - 1500, ISLAND_W);
  if (s.kind === 'cycle') return camFor(cwC[0], cwC[1], 7000);
  const p = M[s.m].xy; return camFor(p[0], p[1], CLOSE_W);
}
const KEYS = [{ t: 0, ...camFor(ISL.cx, ISL.cy - 1500, 30000) }, { t: 2.4, ...camFor(ISL.cx, ISL.cy - 1500, ISLAND_W) }];
for (const s of SEQ.slice(1)) KEYS.push({ t: s.a + 0.55, ...camTarget(s) }, { t: s.b - 0.05, ...camTarget(s) });
const MC = Object.values(M).reduce((a, m) => [a[0] + m.xy[0] / 3, a[1] + m.xy[1] / 3], [0, 0]);
KEYS.push({ t: 16.4, ...camFor(MC[0] + 1900, MC[1] + 600, 11000) }, { t: 18.0, ...camFor(MC[0] + 2100, MC[1] + 400, 10500) }, { t: 22.0, ...camFor(ISL.cx, ISL.cy - 1200, 17500) });
function cam(t) {
  let i = 0; while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
  const A = KEYS[i], B = KEYS[i + 1], u = eio(clamp((t - A.t) / Math.max(0.001, B.t - A.t)));
  return { x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), w: Math.exp(lerp(Math.log(A.w), Math.log(B.w), u)) };
}
let CAM, S;
const pr = (p) => [W / 2 + (p[0] - CAM.x) * S, H / 2 - (p[1] - CAM.y) * S];
function pathRings(rings) { ctx.beginPath(); for (const r of rings) { const a = pr(r[0]); ctx.moveTo(a[0], a[1]); for (let i = 1; i < r.length; i++) { const b = pr(r[i]); ctx.lineTo(b[0], b[1]); } ctx.closePath(); } }
function drawMap(t, glow, cycle, golden) {
  const g = ctx.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, H * 0.75); g.addColorStop(0, '#0C1D31'); g.addColorStop(1, C.navy); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // faint grid (survey feel)
  ctx.save(); ctx.strokeStyle = 'rgba(140,175,210,0.05)'; ctx.lineWidth = 1 * K; ctx.beginPath(); const step = 1000 * S;
  if (step > 12 * K) { const ox = ((W / 2 - CAM.x * S) % step + step) % step, oy = ((H / 2 + CAM.y * S) % step + step) % step; for (let x = ox; x < W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = oy; y < H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); } }
  ctx.stroke(); ctx.restore();
  pathRings(GEO.ad_land); ctx.fillStyle = '#1B2A40'; ctx.fill(); ctx.strokeStyle = 'rgba(90,115,145,0.55)'; ctx.lineWidth = 1.1 * K; ctx.stroke();
  // Hudayriyat: champagne-tinted land + glowing coastline (draw-on during the opening)
  const draw = eo(clamp((t - 0.15) / 1.3));
  pathRings(HUD.rings); ctx.fillStyle = hexA(C.gold, 0.1 + 0.14 * glow * (0.8 + 0.2 * Math.sin(t * 6))); ctx.fill();
  ctx.save(); ctx.setLineDash([16000 * K * draw, 16000 * K]); ctx.strokeStyle = C.champ; ctx.lineWidth = (2.2 + 2.2 * glow) * K; ctx.shadowColor = C.gold; ctx.shadowBlur = (12 + 34 * glow) * K; ctx.stroke(); ctx.restore();
  // real cycle tracks (OSM)
  if (cycle > 0) {
    ctx.save(); ctx.globalAlpha = cycle; ctx.strokeStyle = C.gold; ctx.lineWidth = 3 * K; ctx.lineCap = 'round'; ctx.shadowColor = C.gold; ctx.shadowBlur = 14 * K; ctx.beginPath();
    for (const l of POI.cycleways) { const a = pr(l[0]); ctx.moveTo(a[0], a[1]); for (let i = 1; i < l.length; i++) { const b = pr(l[i]); ctx.lineTo(b[0], b[1]); } }
    ctx.stroke(); ctx.restore();
  }
  // navy vignette + optional golden-hour wash
  const v = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.25, W / 2, H * 0.55, H * 0.8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(3,7,14,0.75)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  if (golden > 0) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(255,170,80,${0.35 * golden})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}
function marker(p, a, active, t) {
  if (a <= 0) return; const [x, y] = pr(p); ctx.save(); ctx.globalAlpha = a;
  const pulse = (t * 0.9) % 1;
  if (active) { ctx.strokeStyle = hexA(C.champ, 0.7 * (1 - pulse)); ctx.lineWidth = 2 * K; ctx.beginPath(); ctx.arc(x, y, (14 + 46 * pulse) * K, 0, 7); ctx.stroke(); }
  ctx.strokeStyle = C.champ; ctx.lineWidth = 2 * K; ctx.beginPath(); ctx.arc(x, y, (active ? 16 : 10) * K, 0, 7); ctx.stroke();
  ctx.fillStyle = C.champ; ctx.shadowColor = C.gold; ctx.shadowBlur = 16 * K; ctx.beginPath(); ctx.arc(x, y, (active ? 6 : 4.5) * K, 0, 7); ctx.fill(); ctx.restore();
  return [x, y];
}
// floating picture-in-picture window with a thin animated leader line from the marker
const PIP = { x: 110, w: 860, top: 285, h: 560 };
function pip(s, t, anchor) {
  const o = ss(s.a + 0.12, s.a + 0.42, t), c = 1 - ss(s.b - 0.3, s.b - 0.08, t), a = Math.min(o, c); if (a <= 0) return;
  const top = s.top || PIP.top, im = s.img ? IMG[s.img] : null, h = im ? Math.min(PIP.h, PIP.w * im.height / im.width) : 300;
  const sc0 = lerp(0.94, 1, eo(o)), cx = 540, cy = top + h / 2;
  // leader line: marker → bottom-centre of the window (drawn on as the window opens)
  if (anchor) { const ln = eo(clamp((t - s.a) / 0.35)); const bx = cx * K, by = (top + h + 118) * K; ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = hexA(C.champ, 0.85); ctx.lineWidth = 1.6 * K;
    ctx.beginPath(); ctx.moveTo(anchor[0], anchor[1]); ctx.lineTo(lerp(anchor[0], bx, ln), lerp(anchor[1], by, ln)); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.globalAlpha = a; ctx.translate(cx * K, cy * K); ctx.scale(sc0, sc0); ctx.translate(-cx * K, -cy * K);
  const x0 = PIP.x * K, y0 = top * K, w = PIP.w * K, hh = h * K;
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40 * K; ctx.shadowOffsetY = 12 * K; ctx.fillStyle = '#0A1626'; ctx.beginPath(); ctx.roundRect(x0, y0, w, hh, 10 * K); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); ctx.beginPath(); ctx.roundRect(x0, y0, w, hh, 10 * K); ctx.clip();
  if (im) { const u = clamp((t - s.a) / (s.b - s.a)), z = lerp(1.03, 1.1, u), s2 = Math.max(w / im.width, hh / im.height) * z; ctx.filter = 'contrast(1.06) saturate(1.06)';
    ctx.drawImage(im, x0 + (w - im.width * s2) / 2, y0 + (hh - im.height * s2) / 2, im.width * s2, im.height * s2); ctx.filter = 'none';
    ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(241,205,150,0.12)'; ctx.fillRect(x0, y0, w, hh); ctx.globalCompositeOperation = 'source-over'; }
  else { const g = ctx.createLinearGradient(0, y0, 0, y0 + hh); g.addColorStop(0, '#132A44'); g.addColorStop(1, '#0A1626'); ctx.fillStyle = g; ctx.fillRect(x0, y0, w, hh);
    ctx.strokeStyle = hexA(C.gold, 0.35); ctx.lineWidth = 1 * K; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(x0 + w / 2, y0 + hh / 2, (60 + i * 46) * K, (26 + i * 20) * K, 0, 0, 7); ctx.stroke(); }
    ctx.fillStyle = C.champ; ctx.font = F(700, 64); ctx.textAlign = 'center'; ctx.fillText('18', x0 + w / 2, y0 + hh / 2 + 10 * K); ctx.font = F(600, 20); ctx.letterSpacing = `${6 * K}px`; ctx.fillText('HOLE COURSE', x0 + w / 2, y0 + hh / 2 + 48 * K); }
  ctx.restore();
  ctx.strokeStyle = hexA(C.gold, 0.9); ctx.lineWidth = 2 * K; ctx.beginPath(); ctx.roundRect(x0, y0, w, hh, 10 * K); ctx.stroke();
  ctx.restore();
  text(s.label, 540, top + h + 56, F(700, 34), C.champ, a, 'center', 6);
  text(s.sub, 540, top + h + 94, F(500, 22), C.white, a * 0.95, 'center', 1);
}

let t = 0;
function renderAt(tt) {
  t = tt; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.setLineDash([]); ctx.shadowBlur = 0;
  CAM = cam(t); S = W / CAM.w;
  const s = segAt(t);
  const islandGlow = s && s.kind === 'island' ? ss(s.a, s.a + 0.3, t) * (1 - ss(s.b - 0.25, s.b, t)) : (t > 15.8 ? ss(15.8, 16.3, t) : 0);
  const cyc = Math.max(ss(7.85, 8.3, t) * (1 - ss(9.05, 9.3, t)), ss(15.8, 16.4, t) * 0.7);
  drawMap(t, islandGlow, cyc, ss(18.0, 19.0, t));
  // markers: verified positions only
  const shown = { beach: 5.0, surf: 6.45, marsana: 13.9 };
  let anchor = null;
  for (const [k, t0] of Object.entries(shown)) {
    const act = s && s.m === k, a = ss(t0 - 0.05, t0 + 0.2, t);
    const p = marker(M[k].xy, a * (act ? 1 : 0.75), act, t);
    if (act) anchor = p;
    const LO = { beach: [18, 34, 'left'], marsana: [-18, -18, 'right'], surf: [0, -28, 'center'] }[k];
    if (a > 0 && !act && t > 15.8) { text(M[k].name.toUpperCase(), p[0] / K + LO[0], p[1] / K + LO[1], F(600, 19), C.champ, a * ss(15.9, 16.3, t) * (1 - ss(17.85, 18.0, t)), LO[2], 3); }
  }
  if (s && s.kind === 'cycle') { const c = pr(cwC); anchor = [c[0], c[1]]; }
  // unplaced projects: no leader line (no verified position) — the whole island glows instead
  // top title / series (opening and close)
  const ta = 1 - ss(2.4, 2.65, t);
  series(Math.max(ss(0, 0.2, t) * ta, ss(18.1, 18.4, t)));
  if (ta > 0) {
    scrim(440, 300, ta * 0.8);
    text('ABU DHABI', 540, 395, F(600, 36), C.white, (0.35 + 0.65 * ss(0, 0.25, t)) * ta, 'center', 18);
    text('HUDAYRIYAT ISLAND', 540, 470, F(800, fitFont('HUDAYRIYAT ISLAND', 800, 78, 950)), C.champ, (0.35 + 0.65 * ss(0, 0.3, t)) * ta, 'center', 4);
  }
  // 51M+ hook stat (bottom) through the opening + masterplan window
  const ha = 1 - ss(4.75, 5.0, t);
  if (ha > 0) {
    scrim(1700, 300, ha);
    const cu = clamp(t / 0.9), punch = 1 + 0.1 * (1 - eo(clamp(t / 0.45)));
    ctx.save(); ctx.translate(540 * K, 1690 * K); ctx.scale(punch, punch); ctx.translate(-540 * K, -1690 * K);
    text(`${Math.round(51 * eo(cu))} MILLION+ SQM`, 540, 1700, F(800, fitFont('51 MILLION+ SQM', 800, 104, 940)), C.white, ss(0, 0.2, t) * ha, 'center', -2); ctx.restore();
    text('A NEW DESTINATION IS RISING', 540, 1760, F(700, 30), C.champ, ss(0.6, 0.9, t) * ha, 'center', 7);
    text('Real coastline: OpenStreetMap · Figures: Modon masterplan (2023)', 540, 1806, F(500, 21), C.white, ss(0.9, 1.2, t) * ha, 'center');
  }
  // section headings (small, top-left aligned to the series line)
  const heads = [[5.0, 9.25, 'SPORT  ·  BEACH  ·  LIFESTYLE'], [9.25, 13.9, 'THE MASTERPLAN'], [13.9, 15.8, 'WATERFRONT']];
  for (const [a0, b0, hd] of heads) { const ha2 = ss(a0, a0 + 0.3, t) * (1 - ss(b0 - 0.25, b0, t)); if (ha2 > 0) text(hd, 540, 250, F(700, 24), C.gold, ha2, 'center', 8); }
  // coastline / beaches strip while the masterplan items play
  const st = ss(9.3, 9.6, t) * (1 - ss(13.7, 13.9, t));
  if (st > 0) { scrim(1470, 170, st);
    const u1 = clamp((t - 9.3) / 0.8), u2 = clamp((t - 9.7) / 0.8);
    text(`${(53.5 * eo(u1)).toFixed(1)} KM`, 300, 1470, F(800, 60), C.white, st, 'center', -1); text('COASTLINE', 300, 1510, F(700, 20), C.champ, st, 'center', 6);
    text(`${Math.round(16 * eo(u2))} KM`, 780, 1470, F(800, 60), C.white, st * ss(9.7, 9.9, t), 'center', -1); text('BEACHES', 780, 1510, F(700, 20), C.champ, st * ss(9.7, 9.9, t), 'center', 6);
    ctx.save(); ctx.globalAlpha = st; ctx.fillStyle = hexA(C.gold, 0.6); ctx.fillRect(539 * K, 1425 * K, 2 * K, 90 * K); ctx.restore();
    text('Modon masterplan (2023)', 540, 1548, F(500, 18), C.muted, st, 'center'); }
  // floating windows
  if (s) pip(s, t, anchor);
  // 15.8–18: pull back — all verified locations + network; the investment line
  const na = ss(15.9, 16.3, t) * (1 - ss(17.85, 18.0, t));
  if (na > 0) { scrim(470, 330, na);
    text('A NEW CHAPTER OF', 540, 420, F(600, 40), C.white, na, 'center', 10);
    text('ABU DHABI', 540, 500, F(800, 76), C.champ, na, 'center', 8);
    text('REAL ESTATE', 540, 572, F(800, 76), C.champ, na * ss(16.05, 16.4, t), 'center', 8); }
  // 18–22: golden-hour close over the map — sunset photograph floats in, then the statement and branding
  if (t >= 18.0) {
    const sp = { a: 18.0, b: 19.9, img: 'sunset', label: 'HUDAYRIYAT AT GOLDEN HOUR', sub: 'Photograph · mangrove cycling track' };
    pip(sp, t, null);
    const sa = ss(19.6, 20.0, t);
    scrim(960, 330, sa);
    const fs = fitFont('DISCOVER THE OPPORTUNITY.', 700, 60, 960);
    text('UNDERSTAND THE ISLAND.', 540, 930, F(700, fs), C.white, ss(19.7, 20.0, t), 'center', 3);
    text('DISCOVER THE OPPORTUNITY.', 540, 1006, F(700, fs), C.champ, ss(19.9, 20.2, t), 'center', 3);
    const b = ss(20.2, 20.6, t);
    scrim(1290, 360, b);
    rule(540, 1150, 120 * eo(clamp((t - 20.2) / 0.5)), b);
    text('YAZAN ALJALAMNEH', 540, 1225, F(700, 46), C.white, b, 'center', 8);
    text('REAL ESTATE INVESTMENT ADVISOR', 540, 1275, F(500, 24), C.muted, ss(20.3, 20.7, t), 'center', 6);
    text('EXPORA REALTY', 540, 1345, F(700, 34), C.champ, ss(20.4, 20.8, t), 'center', 12);
    text('+971 50 500 4472', 540, 1405, F(600, 30), C.white, ss(20.5, 20.9, t), 'center', 4);
    text('Map © OpenStreetMap contributors · Figures & renders: Modon · Markers only at verified locations · Not investment advice', 540, 1560, F(400, 17), C.muted, ss(20.6, 21.0, t), 'center');
  }
}
window.renderAt = renderAt;
for (const w of [400, 500, 600, 700, 800]) await document.fonts.load(F(w, 20));
await document.fonts.load(F(600, 20, 'serif')); await document.fonts.ready;
renderAt(0); window.__ready = true;
