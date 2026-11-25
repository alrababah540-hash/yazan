// Island Investment Series — Ep.01 Yas Island. 20.000 s, 9:16. Deterministic: window.renderAt(t).
// Layout authored on a 1080×1920 grid (K scales it); rendered at 1440×2560 and downsampled for crispness.
const Q = new URLSearchParams(location.search);
const W = +(Q.get('w') || 1440), H = Math.round(W * 16 / 9), K = W / 1080;
const cv = document.getElementById('c'); cv.width = W; cv.height = H; cv.style.width = W + 'px'; cv.style.height = H + 'px';
const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
const GEO = await fetch('/data/geo27.json').then((r) => r.json());

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
};
const IMG = {}, BLUR = {};
await Promise.all(Object.entries(SRC).map(([k, s]) => new Promise((res, rej) => { const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = () => rej(new Error('missing ' + s)); im.src = P + s; })));
for (const k of ['master']) {
  const c = document.createElement('canvas'); c.width = Math.round(W / 4); c.height = Math.round(H / 4); const x = c.getContext('2d');
  x.filter = 'blur(12px) brightness(0.42) saturate(0.9)'; const im = IMG[k], s = Math.max(c.width / im.width, c.height / im.height) * 1.15;
  x.drawImage(im, (c.width - im.width * s) / 2, (c.height - im.height * s) / 2, im.width * s, im.height * s); BLUR[k] = c;
}
const ORIG = { master: [1475, 831], beach: [1936, 1286], cycle: [1903, 1288], nawayef: [2215, 1230], villa: [2215, 1241], sunset: [1277, 1279] };
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

// ---------------------------------------------------------------- map (real OSM coastline): zoom onto Hudayriyat
const LON0 = GEO.origin[0], LAT0 = GEO.origin[1], RE = 6378137, S0 = Math.cos(LAT0 * Math.PI / 180);
const mercY = (lat) => RE * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
const geo = (lon, lat) => [RE * (lon - LON0) * Math.PI / 180 * S0, (mercY(lat) - mercY(LAT0)) * S0];
const HUD = GEO.islands.hudayriyat; let hb = [1e9, 1e9, -1e9, -1e9];
for (const r of HUD.rings) for (const p of r) { hb = [Math.min(hb[0], p[0]), Math.min(hb[1], p[1]), Math.max(hb[2], p[0]), Math.max(hb[3], p[1])]; }
const hc = [(hb[0] + hb[2]) / 2, (hb[1] + hb[3]) / 2];
function mapShot(t) {
  const u = clamp((t + 0.35) / 2.55), c0 = geo(54.42, 24.47);
  const cx = lerp(c0[0], hc[0], eio(u)), cy = lerp(c0[1], hc[1] + 2500, eio(u)), w = Math.exp(lerp(Math.log(33e3), Math.log(19e3), eio(u))), s = W / w;
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.7); g.addColorStop(0, C.navy2); g.addColorStop(1, C.navy); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const pr = (p) => [W / 2 + (p[0] - cx) * s, H / 2 - (p[1] - cy) * s];
  const path = (rings) => { ctx.beginPath(); for (const r of rings) { const a = pr(r[0]); ctx.moveTo(a[0], a[1]); for (let i = 1; i < r.length; i++) { const b = pr(r[i]); ctx.lineTo(b[0], b[1]); } ctx.closePath(); } };
  path(GEO.ad_land); ctx.fillStyle = C.land; ctx.fill(); ctx.strokeStyle = C.coast; ctx.lineWidth = 1.2 * K; ctx.stroke();
  const draw = eo(clamp((t - 0.3) / 1.2));
  path(HUD.rings); ctx.fillStyle = hexA(C.gold, 0.12 + 0.2 * draw); ctx.fill();
  ctx.save(); ctx.strokeStyle = C.champ; ctx.lineWidth = 3.2 * K; ctx.shadowColor = C.gold; ctx.shadowBlur = 28 * K; ctx.setLineDash([12000 * K * draw, 12000 * K]); ctx.stroke(); ctx.restore();
  const ai = pr(GEO.islands.abudhabi.pin); text('ABU DHABI ISLAND', ai[0] / K, ai[1] / K, F(600, 22), C.muted, ss(0.4, 0.8, t) * (1 - ss(1.8, 2.2, t)), 'center', 6);
}

// ---------------------------------------------------------------- timeline
const SHOTS = [
  // 2 — lifestyle
  { a: 4.0, b: 5.45, k: 'beach', o: { f0: [1180, 760], f1: [1080, 720], z0: 1.04, z1: 1.12 }, label: 'HUDAYRIYAT BEACH' },
  { a: 5.35, b: 6.8, k: 'cycle', o: { f0: [960, 700], f1: [930, 560], z0: 1.06, z1: 1.15 }, label: 'CYCLING · 220 KM NETWORK PLANNED' },
  { a: 6.7, b: 8.05, k: 'sunset', o: { f0: [560, 900], f1: [640, 860], z0: 1.35, z1: 1.45 }, label: 'WATERFRONT LIFESTYLE' },
  // 4 — investment (official renders)
  { a: 13.0, b: 15.65, k: 'nawayef', o: { f0: [1150, 640], f1: [1210, 640], z0: 1.05, z1: 1.14 }, label: 'NAWAYEF HEIGHTS · MODON', sub: 'Development render' },
  { a: 15.55, b: 18.05, k: 'villa', o: { f0: [1000, 640], f1: [1080, 680], z0: 1.04, z1: 1.13 }, label: 'HUDAYRIYAT VILLAS', sub: 'Development render' },
];
function masterPanel(t, a, crop) {  // official masterplan render framed full-width; crop = [cx, cy, zoom] in original px
  ctx.save(); ctx.globalAlpha = a; ctx.drawImage(BLUR.master, 0, 0, W, H);
  const im = IMG.master, s0 = sc('master'), pw = W, ph = 1060 * K, py = 520 * K, z = crop[2];
  const s = Math.max(pw / im.width, ph / im.height) * z, iw = im.width * s, ih = im.height * s;
  const x = clamp(pw / 2 - crop[0] * s0 * s, pw - iw, 0), y = clamp(ph / 2 - crop[1] * s0 * s, ph - ih, 0);
  ctx.beginPath(); ctx.rect(0, py, pw, ph); ctx.clip(); ctx.filter = 'contrast(1.06) saturate(1.05)'; ctx.drawImage(im, x, py + y, iw, ih); ctx.filter = 'none';
  ctx.restore(); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = hexA(C.gold, 0.85); ctx.fillRect(0, py - 2 * K, W, 2 * K); ctx.fillRect(0, py + ph, W, 2 * K); ctx.restore();
  return { py, ph };
}
function stat(t0, value, unit, label, src, y, a, dec = 0) {
  const u = clamp((t - t0) / 0.8), v = value * eo(u);
  text(`${dec ? v.toFixed(dec) : Math.round(v)}${unit}`, 540, y, F(800, 150), C.white, a * ss(t0 - 0.05, t0 + 0.2, t), 'center', -3);
  text(label, 540, y + 62, F(700, 34), C.champ, a * ss(t0 + 0.1, t0 + 0.35, t), 'center', 8);
  if (src) text(src, 540, y + 104, F(500, 22), C.white, a * ss(t0 + 0.3, t0 + 0.6, t), 'center');
}
let t = 0;
function renderAt(tt) {
  t = tt; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.setLineDash([]); ctx.shadowBlur = 0;
  ctx.fillStyle = C.navy; ctx.fillRect(0, 0, W, H);
  if (t < 4.0) {
    // ---- 1. HOOK: real OSM outline of Hudayriyat draws on, then the official masterplan
    if (t < 2.4) mapShot(t);
    const ma = ss(2.1, 2.45, t); if (ma > 0) masterPanel(t, ma, [lerp(760, 820, eio(clamp((t - 2.1) / 1.9))), 520, lerp(1.0, 1.12, eio(clamp((t - 2.1) / 1.9)))]);
    grade(0.1, 0.6, 0.75); series(ss(0.0, 0.2, t));
    scrim(1720, 330, ss(0.3, 0.6, t));
    const ca = ss(0.0, 0.2, t), cu = clamp(t / 0.9), punch = 1 + 0.1 * (1 - eo(clamp(t / 0.45)));
    ctx.save(); ctx.translate(540 * K, 1690 * K); ctx.scale(punch, punch); ctx.translate(-540 * K, -1690 * K);
    text(`${Math.round(51 * eo(cu))} MILLION+ SQM`, 540, 1700, F(800, fitFont('51 MILLION+ SQM', 800, 104, 940)), C.white, ca, 'center', -2); ctx.restore();
    text('A NEW DESTINATION IS RISING', 540, 1760, F(700, 30), C.champ, ss(0.6, 0.9, t), 'center', 7);
    text(t < 2.3 ? 'Hudayriyat Island · real coastline, OpenStreetMap' : 'Official masterplan render · Modon (2023)', 540, 1806, F(500, 21), C.white, ss(0.9, 1.2, t) * (1 - ss(2.1, 2.25, t)) + ss(2.35, 2.55, t), 'center');
    text('ABU DHABI', 540, 395, F(600, 36), C.white, 0.35 + 0.65 * ss(0.0, 0.25, t), 'center', 18);
    text('HUDAYRIYAT ISLAND', 540, 470, F(800, fitFont('HUDAYRIYAT ISLAND', 800, 78, 950)), C.champ, 0.35 + 0.65 * ss(0.0, 0.3, t), 'center', 4);
  } else if (t < 8.0 || (t >= 13.0 && t < 18.0)) {
    // ---- 2 & 4: photography / official renders
    const act = SHOTS.filter((s) => t >= s.a && t < s.b);
    act.forEach((s, i) => { ctx.save(); ctx.globalAlpha = i === 0 ? 1 : ss(s.a, s.a + 0.12, t); full(s.k, clamp((t - s.a) / (s.b - s.a)), s.o); ctx.restore(); });
    grade(0.14, 0.62, 0.8);
    const cur = act[act.length - 1];
    if (cur) { const la = ss(cur.a + 0.05, cur.a + 0.25, t) * (1 - ss(cur.b - 0.12, cur.b, t)); chip(cur.label, 1440, la, cur.sub); }
    if (t < 8.0) {
      const a = ss(4.05, 4.35, t) * (1 - ss(7.85, 8.0, t));
      scrim(475, 360, a);
      ['SPORT.', 'BEACH.', 'LIFESTYLE.'].forEach((w, i) => text(w, 540, 400 + i * 78, F(800, 70), i === 2 ? C.champ : C.white, a * ss(4.05 + i * 0.25, 4.35 + i * 0.25, t), 'center', 6));
    } else {
      const a = ss(13.05, 13.4, t) * (1 - ss(17.85, 18.0, t));
      scrim(470, 300, a);
      text('A NEW CHAPTER OF', 540, 420, F(600, 40), C.white, a, 'center', 10);
      text('ABU DHABI', 540, 500, F(800, 76), C.champ, a, 'center', 8);
      text('REAL ESTATE', 540, 572, F(800, 76), C.champ, a * ss(13.2, 13.55, t), 'center', 8);
    }
  } else if (t < 13.0) {
    // ---- 3. THE MASTERPLAN: official render, coastline then beaches
    const u = clamp((t - 8) / 5);
    const crop = t < 10.5 ? [lerp(700, 760, u * 2), lerp(430, 450, u * 2), lerp(1.25, 1.4, eio(clamp((t - 8) / 2.5)))] : [lerp(1000, 1060, eio(clamp((t - 10.5) / 2.5))), 300, lerp(1.55, 1.7, eio(clamp((t - 10.5) / 2.5)))];
    masterPanel(t, 1, crop);
    const xf = 1 - clamp(Math.abs(t - 10.5) / 0.12); if (xf > 0) { ctx.fillStyle = `rgba(5,11,20,${0.8 * xf})`; ctx.fillRect(0, 0, W, H); }
    grade(0.08, 0.7, 0.85);
    const ta = ss(8.05, 8.35, t) * (1 - ss(12.85, 13.0, t));
    text('THE MASTERPLAN', 540, 400, F(700, 44), C.white, ta, 'center', 12);
    text('Official render · Modon', 540, 452, F(500, 22), C.muted, ta, 'center', 1);
    scrim(1760, 300, ta);
    if (t < 10.5) stat(8.3, 53.5, ' KM', 'COASTLINE', 'Modon masterplan (2023)', 1720, 1 - ss(10.35, 10.5, t), 1);
    else stat(10.6, 16, ' KM', 'BEACHES', 'Modon masterplan (2023)', 1720, ss(10.5, 10.65, t) * (1 - ss(12.85, 13.0, t)));
  } else {
    // ---- 5. ENDING: golden-hour aerial — mangrove cycling track, beach, waterfront homes
    const u = clamp((t - 18) / 4);
    full('sunset', u, { f0: [700, 560], f1: [690, 640], z0: 1.04, z1: 1.14, filter: 'contrast(1.07) saturate(1.1)' });
    grade(0.16, 0.6, 0.9);
    const dim = ss(19.6, 20.2, t); ctx.fillStyle = `rgba(5,11,20,${0.35 * dim})`; ctx.fillRect(0, 0, W, H);
    series(ss(18.1, 18.4, t));
    scrim(930, 300, ss(18.2, 18.6, t));
    const fs = fitFont('DISCOVER THE OPPORTUNITY.', 700, 60, 960);
    text('UNDERSTAND THE ISLAND.', 540, 910, F(700, fs), C.white, ss(18.25, 18.6, t), 'center', 3);
    text('DISCOVER THE OPPORTUNITY.', 540, 986, F(700, fs), C.champ, ss(18.7, 19.05, t), 'center', 3);
    const b = ss(19.7, 20.1, t);
    scrim(1290, 360, b);
    rule(540, 1150, 120 * eo(clamp((t - 19.7) / 0.5)), b);
    text('YAZAN ALJALAMNEH', 540, 1225, F(700, 46), C.white, b, 'center', 8);
    text('REAL ESTATE INVESTMENT ADVISOR', 540, 1275, F(500, 24), C.muted, ss(19.85, 20.25, t), 'center', 6);
    text('EXPORA REALTY', 540, 1345, F(700, 34), C.champ, ss(20.0, 20.4, t), 'center', 12);
    text('+971 50 500 4472', 540, 1405, F(600, 30), C.white, ss(20.15, 20.55, t), 'center', 4);
    text('Figures: Modon masterplan (2023) · Map © OpenStreetMap contributors · Renders: Modon · Not investment advice', 540, 1560, F(400, 17), C.muted, ss(20.3, 20.7, t), 'center');
  }
  for (const c of [4.0, 8.0, 13.0, 18.0]) { const f = 1 - clamp(Math.abs(t - c) / 0.07); if (f > 0) { ctx.fillStyle = `rgba(241,221,176,${0.22 * f})`; ctx.fillRect(0, 0, W, H); } }
}
window.renderAt = renderAt;
for (const w of [400, 500, 600, 700, 800]) await document.fonts.load(F(w, 20));
await document.fonts.load(F(600, 20, 'serif')); await document.fonts.ready;
renderAt(0); window.__ready = true;
