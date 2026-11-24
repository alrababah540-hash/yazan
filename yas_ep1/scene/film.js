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
const P = '/yas_ep1/assets/_prepared/';
const SRC = {
  sat: '01_Hook_Aerial/01_satellite_ferrari_world_yas_mall.jpg', ferrari: '02_Ferrari_World/01_ferrari_world_aerial.jpg',
  circuit: '03_Yas_Marina_Circuit/01_circuit_w_hotel_day.jpg', wb: '04_Warner_Bros_World/01_warner_bros_world_entrance.jpg',
  bay: '05_Yas_Bay/01_yas_bay_waterfront_etihad_arena.jpg', resto: '07_Restaurants_Residential/01_yas_bay_restaurants_beach_club.jpg',
  disney: '08_Disneyland_Abu_Dhabi/01_disney_artist_concept.jpg', sphere: '09_Sphere_Abu_Dhabi/01_sphere_abu_dhabi_concept.jpg',
  sunset: '10_Sunset_Residential/01_yas_sunset_aerial.jpg',
};
const IMG = {}, BLUR = {};
await Promise.all(Object.entries(SRC).map(([k, s]) => new Promise((res, rej) => { const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = () => rej(new Error('missing ' + s)); im.src = P + s; })));
for (const k of ['wb', 'disney', 'sphere']) {   // pre-blurred backdrops for panel shots
  const c = document.createElement('canvas'); c.width = Math.round(W / 4); c.height = Math.round(H / 4); const x = c.getContext('2d');
  x.filter = k === 'wb' ? 'blur(10px) brightness(0.32) saturate(0.6)' : 'blur(10px) brightness(0.55) saturate(1.1)'; const im = IMG[k], s = Math.max(c.width / im.width, c.height / im.height) * 1.15;
  x.drawImage(im, (c.width - im.width * s) / 2, (c.height - im.height * s) / 2, im.width * s, im.height * s); BLUR[k] = c;
}
// original-pixel → prepared-pixel scale (landmark coordinates were measured on the originals)
const ORIG = { sat: [1733, 2000], ferrari: [4128, 2752], circuit: [1600, 1200], bay: [5101, 3824], resto: [1200, 900], sunset: [5749, 3833] };
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
function series(a) { text('ISLAND INVESTMENT SERIES  ·  EP. 01', 540, 268, F(600, 22), C.gold, a, 'center', 6); }

// ---------------------------------------------------------------- map (real OSM coastline) for the hook
const LON0 = GEO.origin[0], LAT0 = GEO.origin[1], RE = 6378137, S0 = Math.cos(LAT0 * Math.PI / 180);
const mercY = (lat) => RE * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
const geo = (lon, lat) => [RE * (lon - LON0) * Math.PI / 180 * S0, (mercY(lat) - mercY(LAT0)) * S0];
function mapShot(t) {
  const u = clamp(t / 1.15), yas = GEO.islands.yas.pin, c0 = geo(54.47, 24.47);
  const cx = lerp(c0[0], yas[0], eio(u)), cy = lerp(c0[1], yas[1], eio(u)), w = Math.exp(lerp(Math.log(46e3), Math.log(5.2e3), Math.pow(u, 1.6))), s = W / w;
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.7); g.addColorStop(0, C.navy2); g.addColorStop(1, C.navy); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const pr = (p) => [W / 2 + (p[0] - cx) * s, H / 2 - (p[1] - cy) * s];
  const path = (rings) => { ctx.beginPath(); for (const r of rings) { const a = pr(r[0]); ctx.moveTo(a[0], a[1]); for (let i = 1; i < r.length; i++) { const b = pr(r[i]); ctx.lineTo(b[0], b[1]); } ctx.closePath(); } };
  path(GEO.ad_land); ctx.fillStyle = C.land; ctx.fill(); ctx.strokeStyle = C.coast; ctx.lineWidth = 1.2 * K; ctx.stroke();
  path(GEO.islands.yas.rings); ctx.fillStyle = hexA(C.gold, 0.2 + 0.15 * u); ctx.fill();
  ctx.save(); ctx.strokeStyle = C.champ; ctx.lineWidth = 3 * K; ctx.shadowColor = C.gold; ctx.shadowBlur = 26 * K; ctx.stroke(); ctx.restore();
}

// ---------------------------------------------------------------- satellite with future overlays (scene 4)
function satMap(u, a) {
  const r = full('sat', u, { f0: [1150, 1000], f1: [1185, 1020], z0: 1.08, z1: 1.15, filter: 'contrast(1.05) saturate(0.85) brightness(0.62)' });
  ctx.fillStyle = 'rgba(5,11,20,0.25)'; ctx.fillRect(0, 0, W, H);
  const P2 = (x, y) => [r.x + x * sc('sat') * r.s, r.y + y * sc('sat') * r.s];
  const pin = (x, y, name, d, al = 'left', ap = 1) => {
    const [px, py] = P2(x, y), pa = ap * a; if (pa <= 0) return;
    ctx.save(); ctx.globalAlpha = pa; ctx.fillStyle = C.champ; ctx.shadowColor = C.gold; ctx.shadowBlur = 14 * K; ctx.beginPath(); ctx.arc(px, py, 7 * K, 0, 7); ctx.fill(); ctx.restore();
    text(name, px / K + (al === 'left' ? 16 : -16), py / K + 9, F(600, 24), C.white, pa, al, 1);
  };
  pin(770, 1090, 'Ferrari World', 0, 'left', ss(12.15, 12.35, t0));
  pin(900, 740, 'Yas Mall', 0, 'right', ss(12.25, 12.45, t0));
  pin(1560, 960, 'SeaWorld', 0, 'right', ss(12.35, 12.55, t0));
  // Sphere: officially "between Yas Mall and SeaWorld" → marked as an approximate zone, not a parcel
  const [sx, sy] = P2(1230, 850), pulse = (t0 * 1.3) % 1, sa = ss(12.45, 12.7, t0) * a;
  if (sa > 0) {
    ctx.save(); ctx.globalAlpha = sa; ctx.setLineDash([8 * K, 7 * K]); ctx.strokeStyle = C.champ; ctx.lineWidth = 2.5 * K; ctx.beginPath(); ctx.arc(sx, sy, 62 * K, 0, 7); ctx.stroke();
    ctx.setLineDash([]); ctx.strokeStyle = hexA(C.gold, 0.6 * (1 - pulse)); ctx.beginPath(); ctx.arc(sx, sy, (62 + 40 * pulse) * K, 0, 7); ctx.stroke(); ctx.restore();
    text('SPHERE ABU DHABI', sx / K, sy / K - 84, F(700, 26), C.champ, sa, 'center', 4);
    text('approx. · announced site between', sx / K, sy / K + 92, F(500, 20), C.white, sa, 'center');
    text('Yas Mall & SeaWorld', sx / K, sy / K + 118, F(500, 20), C.white, sa, 'center');
  }
  // Tram Line 4: planned link toward Zayed International Airport (to the south-east) — schematic only
  const ta = ss(12.6, 12.9, t0) * a, [cx0, cy0] = P2(820, 1400), ex = W * 0.98, ey = H * 0.72, prog = eo(clamp((t0 - 12.6) / 0.6));
  if (ta > 0) {
    ctx.save(); ctx.globalAlpha = ta; ctx.setLineDash([14 * K, 10 * K]); ctx.lineDashOffset = -t0 * 60 * K; ctx.strokeStyle = C.gold; ctx.lineWidth = 4 * K; ctx.shadowColor = C.gold; ctx.shadowBlur = 10 * K;
    ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(lerp(cx0, ex, prog), lerp(cy0, ey, prog)); ctx.stroke(); ctx.restore();
    text('TRAM LINE 4  ·  PLANNED 2030', 1040, ey / K + 62, F(700, 24), C.champ, ta, 'right', 3);
    text('to Zayed International Airport · schematic', 1040, ey / K + 94, F(500, 20), C.white, ta, 'right');
  }
}
let t0 = 0;

// ---------------------------------------------------------------- timeline
const SHOTS = [
  // scene 2 — more than entertainment (1 s each)
  { a: 3.0, b: 4.05, k: 'ferrari', o: { f0: [2000, 1420], f1: [2000, 1380], z0: 1.12, z1: 1.22 }, label: 'FERRARI WORLD' },
  { a: 4.0, b: 5.05, k: 'circuit', o: { f0: [1280, 700], f1: [1330, 640], z0: 1.06, z1: 1.14 }, label: 'YAS MARINA CIRCUIT' },
  { a: 5.0, b: 6.05, k: 'wb', panel: { cy: 0.56, dx: 1 }, label: 'WARNER BROS. WORLD' },
  { a: 6.0, b: 7.1, k: 'bay', o: { f0: [3350, 2050], f1: [3500, 2000], z0: 1.04, z1: 1.12 }, label: 'YAS BAY' },
  // scene 3 — hospitality
  { a: 7.0, b: 8.8, k: 'circuit', o: { f0: [430, 420], f1: [470, 470], z0: 1.04, z1: 1.14 }, label: 'W ABU DHABI – YAS ISLAND' },
  { a: 8.7, b: 10.5, k: 'resto', o: { f0: [420, 470], f1: [520, 430], z0: 1.03, z1: 1.12 }, label: 'YAS BAY WATERFRONT DINING' },
  { a: 10.4, b: 12.1, k: 'bay', o: { f0: [2150, 1500], f1: [2050, 1400], z0: 1.06, z1: 1.14 }, label: 'YAS BAY HOSPITALITY' },
];
function shotAt(t) { return SHOTS.filter((s) => t >= s.a && t < s.b); }
function drawShot(s, t) {
  const u = clamp((t - s.a) / (s.b - s.a)); if (s.panel) return panel(s.k, u, s.panel); return full(s.k, u, s.o);
}

function renderAt(t) {
  t0 = t; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.setLineDash([]); ctx.shadowBlur = 0;
  ctx.fillStyle = C.navy; ctx.fillRect(0, 0, W, H);
  if (t < 3.0) {
    // ---- 1. HOOK: real map zoom → satellite of the island's core, fast push
    if (t < 1.25) mapShot(t);
    const sa = ss(0.95, 1.25, t);
    if (sa > 0) { ctx.save(); ctx.globalAlpha = sa; full('sat', clamp((t - 0.95) / 2.05), { f0: [800, 1080], f1: [780, 1100], z0: 1.75, z1: 1.08, filter: 'contrast(1.08) saturate(1.05) brightness(0.92)' }); ctx.restore(); grade(0.12, 0.6, 0.8); }
    series(ss(0.1, 0.4, t));
    scrim(1050, 420, ss(0.2, 0.5, t));
    const ca = ss(0.25, 0.5, t), cu = clamp((t - 0.25) / 0.7), punch = 1 + 0.12 * (1 - eo(clamp((t - 0.25) / 0.45)));
    ctx.save(); ctx.translate(540 * K, 960 * K); ctx.scale(punch, punch); ctx.translate(-540 * K, -960 * K);
    text(`${Math.round(44 * eo(cu))} MILLION+`, 540, 975, F(800, fitFont('44 MILLION+', 800, 132, 930)), C.white, ca, 'center', -2);
    ctx.restore();
    text('VISITS', 540, 1060, F(700, 46), C.champ, ss(0.55, 0.8, t), 'center', 22);
    rule(540, 1100, 90 * eo(clamp((t - 0.7) / 0.4)), ss(0.7, 0.9, t));
    text('Yas Island destination visits in 2025  ·  Source: Miral', 540, 1150, F(500, 24), C.white, ss(0.9, 1.2, t), 'center');
  } else if (t < 12.0) {
    // ---- 2 & 3: photography sequence with soft-cut dissolves
    const act = shotAt(t);
    act.forEach((s, i) => { const fa = i === 0 ? 1 : ss(s.a, s.a + 0.12, t); ctx.save(); ctx.globalAlpha = fa; drawShot(s, t); ctx.restore(); });
    grade(0.14, 0.62, t < 7 ? 0.55 : 0.8);
    const cur = act[act.length - 1];
    if (cur) { const la = ss(cur.a + 0.05, cur.a + 0.25, t) * (1 - ss(cur.b - 0.12, cur.b, t)); chip(cur.label, t < 7 ? 1420 : 1460, la); }
    if (t < 7.0) {
      const a = ss(3.05, 3.35, t) * (1 - ss(6.85, 7.0, t));
      text('MORE THAN', 540, 395, F(600, 40), C.white, a, 'center', 14);
      text('ENTERTAINMENT', 540, 470, F(800, fitFont('ENTERTAINMENT', 800, 86, 940)), C.champ, a, 'center', 6);
    } else {
      const a = ss(7.15, 7.45, t) * (1 - ss(11.85, 12.0, t)), cu = clamp((t - 7.15) / 0.8), punch = 1 + 0.1 * (1 - eo(clamp((t - 7.15) / 0.45)));
      scrim(1260, 380, a);
      ctx.save(); ctx.translate(540 * K, 1180 * K); ctx.scale(punch, punch); ctx.translate(-540 * K, -1180 * K);
      text(`${Math.round(84 * eo(cu))}%`, 540, 1230, F(800, 230), C.white, a, 'center', -4); ctx.restore();
      text('HOTEL OCCUPANCY  |  2025', 540, 1305, F(700, 36), C.champ, a, 'center', 6);
      text('Full-year average · Source: Miral', 540, 1352, F(500, 23), C.white, a * ss(7.5, 7.8, t), 'center');
    }
  } else if (t < 16.0) {
    // ---- 4. THE FUTURE: satellite map with planned infrastructure → official concepts
    const ma = 1 - ss(13.45, 13.6, t);
    if (ma > 0) { ctx.save(); ctx.globalAlpha = ma; satMap(clamp((t - 12) / 1.6), 1); ctx.restore(); }
    const da = ss(13.45, 13.6, t) * (1 - ss(14.75, 14.9, t)), pa = ss(14.75, 14.9, t);
    if (da > 0) { ctx.save(); ctx.globalAlpha = da; panel('disney', clamp((t - 13.45) / 1.45), { top: 600 }); ctx.restore();
      chip('DISNEYLAND ABU DHABI', 1300, da, 'Announced May 2025 · opening expected ~2030–2032');
      text('Expected timing — not an officially confirmed date', 540, 1394, F(500, 21), C.muted, da, 'center'); }
    if (pa > 0) { ctx.save(); ctx.globalAlpha = pa; panel('sphere', clamp((t - 14.75) / 1.25), { top: 600, maxH: 610, oy: -40 }); ctx.restore();
      chip('SPHERE ABU DHABI', 1300, pa, 'Announced May 2026 · completion targeted end-2029');
      text('Concept render · DCT Abu Dhabi & Sphere Entertainment', 540, 1394, F(500, 21), C.muted, pa, 'center'); }
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.3); g.addColorStop(0, 'rgba(5,11,20,0.8)'); g.addColorStop(1, 'rgba(5,11,20,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.3);
    const a = ss(12.05, 12.35, t) * (1 - ss(15.85, 16.0, t));
    text('THE NEXT CHAPTER', 540, 395, F(700, 44), C.white, a, 'center', 12);
    text('2030+', 540, 500, F(800, 110), C.champ, a, 'center', 2);
  } else {
    // ---- 5. THE INVESTMENT MESSAGE: sunset aerial, slow pan from the sun to the circuit
    const u = clamp((t - 16) / 4);
    full('sunset', u, { f0: [2300, 1700], f1: [3400, 1900], z0: 1.06, z1: 1.16, filter: 'contrast(1.07) saturate(1.1)' });
    grade(0.16, 0.6, 0.9);
    const dim = ss(17.6, 18.2, t); ctx.fillStyle = `rgba(5,11,20,${0.35 * dim})`; ctx.fillRect(0, 0, W, H);
    series(ss(16.1, 16.4, t));
    scrim(905, 300, ss(16.2, 16.6, t));
    text('UNDERSTAND THE ISLAND.', 540, 890, F(700, fitFont('UNDERSTAND THE INVESTMENT.', 700, 60, 960)), C.white, ss(16.25, 16.6, t), 'center', 3);
    text('UNDERSTAND THE INVESTMENT.', 540, 966, F(700, fitFont('UNDERSTAND THE INVESTMENT.', 700, 60, 960)), C.champ, ss(16.7, 17.05, t), 'center', 3);
    const b = ss(17.7, 18.1, t);
    scrim(1290, 360, b);
    rule(540, 1150, 120 * eo(clamp((t - 17.7) / 0.5)), b);
    text('YAZAN ALJALAMNEH', 540, 1225, F(700, 46), C.white, b, 'center', 8);
    text('REAL ESTATE INVESTMENT ADVISOR', 540, 1275, F(500, 24), C.muted, ss(17.85, 18.25, t), 'center', 6);
    text('EXPORA REALTY', 540, 1345, F(700, 34), C.champ, ss(18.0, 18.4, t), 'center', 12);
    text('+971 50 500 4472', 540, 1405, F(600, 30), C.white, ss(18.15, 18.55, t), 'center', 4);
    text('Data: Miral (2025) · Images: Yas Island / Miral, Disney, DCT Abu Dhabi · Not investment advice', 540, 1560, F(400, 17), C.muted, ss(18.3, 18.7, t), 'center');
  }
  // cut flashes on scene changes (soft champagne bloom, 3 frames)
  for (const c of [3.0, 7.0, 12.0, 16.0]) { const f = 1 - clamp(Math.abs(t - c) / 0.07); if (f > 0) { ctx.fillStyle = `rgba(241,221,176,${0.22 * f})`; ctx.fillRect(0, 0, W, H); } }
}
window.renderAt = renderAt;
for (const w of [400, 500, 600, 700, 800]) await document.fonts.load(F(w, 20));
await document.fonts.load(F(600, 20, 'serif')); await document.fonts.ready;
renderAt(0); window.__ready = true;
