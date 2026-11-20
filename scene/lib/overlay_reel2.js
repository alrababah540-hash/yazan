// Reel V2 typography & infographics — calm reveals, one idea per scene, mobile-readable.
// Gold = key information, ivory = supporting. Safe zones: y 250–1500, x 50–950.
import { clamp, remap, easeOut, easeInOut, easeOutBack, smooth } from './util.js';

const GOLD = '#e2c78f', IVORY = '#f3eee4', DIM = 'rgba(243,238,228,0.62)';
const I = { // consistent line-icon set (gold, 2.5px strokes)
  plan: `<svg viewBox="0 0 48 48" width="54" height="54" fill="none" stroke="${GOLD}" stroke-width="2.5" stroke-linejoin="round"><rect x="7" y="7" width="34" height="34" rx="2"/><path d="M7 22h14v19M21 7v8M29 22h12M29 22v8"/></svg>`,
  crane: `<svg viewBox="0 0 48 48" width="54" height="54" fill="none" stroke="${GOLD}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="M12 43V8M8 43h10M12 10h30M12 10l-6 4M36 10v9M33 19h6v5h-6z"/><path d="M12 16l6-6M12 22l6-6"/></svg>`,
  key: `<svg viewBox="0 0 48 48" width="54" height="54" fill="none" stroke="${GOLD}" stroke-width="2.5" stroke-linecap="round"><circle cx="15" cy="24" r="7"/><path d="M22 24h20M36 24v6M41 24v4"/></svg>`,
  dev: `<svg viewBox="0 0 48 48" width="50" height="50" fill="none" stroke="${GOLD}" stroke-width="2.5" stroke-linejoin="round"><path d="M10 42V12l14-6 14 6v30M6 42h36"/><path d="M17 18h4M27 18h4M17 26h4M27 26h4M21 42v-8h6v8"/></svg>`,
  escrow: `<svg viewBox="0 0 48 48" width="50" height="50" fill="none" stroke="${GOLD}" stroke-width="2.5" stroke-linejoin="round"><path d="M24 5l15 6v11c0 10-6.5 17-15 21-8.5-4-15-11-15-21V11z"/><rect x="17" y="22" width="14" height="11" rx="1.5"/><path d="M20 22v-3a4 4 0 018 0v3"/></svg>`,
  spa: `<svg viewBox="0 0 48 48" width="50" height="50" fill="none" stroke="${GOLD}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="M12 5h17l9 9v29H12z"/><path d="M29 5v9h9M18 22h14M18 28h14M18 34h8"/></svg>`,
  pin: `<svg viewBox="0 0 48 48" width="46" height="46" fill="none" stroke="${GOLD}" stroke-width="2.6" stroke-linejoin="round"><path d="M24 44s13-13.5 13-24a13 13 0 00-26 0c0 10.5 13 24 13 24z"/><circle cx="24" cy="20" r="5"/></svg>`,
  ok: `<svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="18" fill="${GOLD}"/><path d="M12 20.5l5.5 5.5L28.5 14" fill="none" stroke="#0b1626" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  save: `<svg viewBox="0 0 64 80" width="84" height="105"><path d="M10 6H54V74L32 56L10 74Z" fill="none" stroke="${GOLD}" stroke-width="4.5" stroke-linejoin="round"/><path class="fill" d="M10 6H54V74L32 56L10 74Z" fill="${GOLD}"/></svg>`,
  send: `<svg viewBox="0 0 64 64" width="40" height="40" fill="none" stroke="${GOLD}" stroke-width="4" stroke-linejoin="round"><path d="M6 30L58 8L44 58L30 38Z"/><path d="M30 38L58 8"/></svg>`,
  north: `<svg viewBox="0 0 40 56" width="34" height="48"><path d="M20 4L32 40L20 32L8 40Z" fill="${GOLD}"/><text x="20" y="54" text-anchor="middle" font-family="Plex Latin" font-weight="600" font-size="13" fill="${IVORY}">N</text></svg>`,
};

const css = `
.r2 { position:absolute; left:50px; right:130px; text-align:center; pointer-events:none; color:${IVORY}; font-family:'Plex Latin'; }
.r2 .w { display:inline-block; }
.r2-eb { font:600 25px 'Plex Latin'; letter-spacing:.34em; color:${GOLD}; text-transform:uppercase; }
.r2-rule { width:90px; height:2px; margin:16px auto 18px; background:linear-gradient(90deg,transparent,${GOLD},transparent); }
.r2-h { font:700 76px/1.1 'Plex Latin'; letter-spacing:-0.015em; text-shadow:0 6px 36px rgba(0,0,0,.55); }
.r2-h2 { font:700 62px/1.12 'Plex Latin'; letter-spacing:-0.01em; text-shadow:0 5px 30px rgba(0,0,0,.55); }
.r2 .g { color:${GOLD}; }
.r2-word { font:500 116px 'Cormorant'; letter-spacing:.14em; color:${GOLD}; text-shadow:0 6px 36px rgba(0,0,0,.55); }
.r2-steps { display:flex; justify-content:center; gap:14px; align-items:center; font:600 24px 'Plex Latin'; letter-spacing:.18em; }
.r2-steps .s { color:rgba(243,238,228,.35); } .r2-steps .s.on { color:${IVORY}; } .r2-steps .d { width:40px; height:2px; background:rgba(226,199,143,.35); }
.r2-isl { position:absolute; transform:translate(-50%,-100%); text-align:center; white-space:nowrap; }
.r2-isl .n { font:600 38px 'Plex Latin'; text-shadow:0 2px 14px rgba(0,0,0,.9); }
.r2-isl .c { font:500 20px 'Plex Latin'; letter-spacing:.14em; color:${GOLD}; margin-top:4px; text-shadow:0 2px 10px rgba(0,0,0,.9); }
.r2-isl .ar { font:500 22px 'IBM Plex Sans Arabic'; color:${DIM}; margin-top:2px; }
.r2-north { position:absolute; left:64px; top:560px; }
.r2-attr { position:absolute; left:50px; right:130px; top:1448px; text-align:center; font:500 19px 'Plex Latin'; color:rgba(243,238,228,.55); letter-spacing:.04em; }
.r2-room { position:absolute; transform:translate(-50%,-100%); font:600 22px 'Plex Latin'; letter-spacing:.16em; color:#0b1626; background:rgba(226,199,143,.94); padding:7px 14px; border-radius:20px; white-space:nowrap; box-shadow:0 4px 18px rgba(0,0,0,.35); }
.r2-room:after { content:''; position:absolute; left:50%; bottom:-9px; width:2px; height:9px; background:rgba(226,199,143,.94); }
.r2-tl { position:absolute; left:50px; width:900px; top:560px; height:520px; }
.r2-tl .card { position:absolute; inset:0; border-radius:28px; background:rgba(7,14,25,.72); border:1.5px solid rgba(226,199,143,.28); }
.r2-tl .rail { position:absolute; left:120px; right:120px; top:236px; height:4px; border-radius:2px; background:rgba(243,238,228,.16); }
.r2-tl .fill { position:absolute; left:0; top:0; bottom:0; border-radius:2px; background:linear-gradient(90deg,#a8874c,${GOLD}); box-shadow:0 0 14px rgba(226,199,143,.55); }
.r2-tl .node { position:absolute; top:220px; width:36px; height:36px; margin-left:-18px; border-radius:50%; border:3px solid rgba(226,199,143,.45); background:#0b1626; }
.r2-tl .node.on { background:${GOLD}; border-color:${GOLD}; box-shadow:0 0 0 8px rgba(226,199,143,.16); }
.r2-tl .tick { position:absolute; top:230px; width:2px; height:16px; margin-left:-1px; background:${GOLD}; }
.r2-tl .col { position:absolute; width:260px; margin-left:-130px; text-align:center; }
.r2-tl .col .ic { height:58px; }
.r2-tl .col .st { font:700 31px 'Plex Latin'; letter-spacing:.12em; margin-top:10px; }
.r2-tl .col .pay { font:700 38px 'Plex Latin'; color:${GOLD}; }
.r2-tl .col .when { font:500 26px 'Plex Latin'; color:${DIM}; margin-top:6px; }
.r2-tl .hdr { position:absolute; left:0; right:0; font:600 21px 'Plex Latin'; letter-spacing:.32em; color:rgba(243,238,228,.45); text-align:center; }
.r2-note { font:500 32px 'Plex Latin'; color:${IVORY}; }
.r2-sel { display:flex; flex-direction:column; gap:18px; align-items:stretch; width:620px; margin:0 auto; }
.r2-sel .c { display:flex; align-items:center; gap:22px; padding:18px 28px; border-radius:22px; background:rgba(7,14,25,.74); border:1.5px solid rgba(226,199,143,.25); font:700 44px 'Plex Latin'; color:rgba(243,238,228,.4); }
.r2-sel .c.on { color:${IVORY}; border-color:rgba(226,199,143,.8); box-shadow:0 0 24px rgba(226,199,143,.18); }
.r2-sel .c .num { font:600 24px 'Plex Latin'; color:${GOLD}; letter-spacing:.2em; width:44px; }
.r2-sel .c .ic2 { width:58px; height:58px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:rgba(226,199,143,.1); }
.r2-dd { position:absolute; left:50px; width:900px; }
.r2-dd .row { display:flex; align-items:center; gap:26px; padding:24px 30px; margin-bottom:20px; border-radius:24px; background:rgba(7,14,25,.74); border:1.5px solid rgba(226,199,143,.26); }
.r2-dd .row.on { border-color:rgba(226,199,143,.75); }
.r2-dd .ic { width:76px; height:76px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:rgba(226,199,143,.1); flex:none; }
.r2-dd .tx { flex:1; text-align:left; } .r2-dd .t1 { font:700 44px 'Plex Latin'; } .r2-dd .t2 { font:500 28px 'Plex Latin'; color:${DIM}; margin-top:4px; }
.r2-dd .ok { flex:none; width:40px; height:40px; }
.r2-save { display:flex; flex-direction:column; align-items:center; gap:12px; } .r2-save .lbl { font:700 62px 'Plex Latin'; letter-spacing:.04em; text-transform:uppercase; }
.r2-send { display:flex; align-items:center; justify-content:center; gap:14px; font:500 32px 'Plex Latin'; color:${DIM}; }
.r2-cap { position:absolute; left:50px; right:130px; top:1290px; text-align:center; }
.r2-cap .box { display:inline-block; padding:12px 24px; border-radius:14px; background:rgba(7,14,25,.7); font:600 42px/1.3 'Plex Latin'; color:${IVORY}; }
.r2-cap .cw { color:${GOLD}; }
`;

const mk = (html, top, cls = 'r2') => { const e = document.createElement('div'); e.className = cls; e.innerHTML = html; if (top != null) e.style.top = `${top}px`; document.getElementById('ui').appendChild(e); return e; };
const words = (t, gold = 99) => t.split(' ').map((w, i) => `<span class="w${i >= gold ? ' g' : ''}">${w}</span>`).join(' ');
function show(e, t, a, b, { rise = 26, blur = 8, fi = 0.55, fo = 0.3 } = {}) {
  const i = easeOut(remap(t, a, a + fi)), o = 1 - easeInOut(remap(t, b - fo, b)), v = Math.min(i, o);
  e.style.display = v > 0.002 ? '' : 'none'; if (v <= 0.002) return 0;
  e.style.opacity = v.toFixed(3); e.style.filter = v < 0.995 ? `blur(${((1 - v) * blur).toFixed(1)}px)` : 'none';
  e.style.transform = `translateY(${((1 - i) * rise).toFixed(1)}px)`; return v;
}
function stagger(e, t, a, step = 0.14, dur = 0.5) {
  e.querySelectorAll('.w').forEach((w, k) => { const u = easeOut(remap(t, a + k * step, a + k * step + dur));
    w.style.opacity = u.toFixed(3); w.style.transform = `translateY(${((1 - u) * 22).toFixed(1)}px)`; w.style.filter = u < 0.99 ? `blur(${((1 - u) * 6).toFixed(1)}px)` : 'none'; });
}
const fmt = ([lon, lat]) => `${lat.toFixed(2)}°N · ${lon.toFixed(2)}°E`;

export function buildReelOverlay2({ narration, durations, reel }) {
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const E = {
    hook: mk(`<div class="r2-h">${words('Buying a home')}<br>${words("that isn't built yet?", 1)}</div>`, 300),
    offT: mk(`<div class="r2-word">OFF-PLAN</div>`, 270),
    offS: mk(`<div class="r2-steps"><span class="s">BLUEPRINT</span><span class="d"></span><span class="s">CONSTRUCTION</span><span class="d"></span><span class="s">COMPLETION</span></div>`, 440),
    mapH: mk(`<div class="r2-eb">Abu Dhabi</div><div class="r2-rule"></div><div class="r2-h2">Location first</div>`, 280),
    north: mk(I.north, null, 'r2-north'),
    attr: mk('Map data © OpenStreetMap contributors · Overture Maps (ODbL)', null, 'r2-attr'),
    unitH: mk(`<div class="r2-eb">Project selection</div><div class="r2-rule"></div><div class="r2-h2">Choose the right</div>`, 270),
    sel: mk(`<div class="r2-sel">${[['pin', 'Location'], ['dev', 'Developer'], ['plan', 'Unit']].map(([ic, n], k) => `<div class="c" data-k="${k}"><span class="num">0${k + 1}</span><span class="ic2">${I[ic]}</span><span>${n}</span></div>`).join('')}</div>`, 470),
    payH: mk(`<div class="r2-eb">Payment plan</div><div class="r2-rule"></div><div class="r2-h2">Payments follow<br><span class="g">construction</span></div>`, 270),
    tl: mk(`<div class="card"></div>
      <div class="hdr" style="top:28px">CONSTRUCTION</div><div class="hdr" style="top:300px">PAYMENT</div>
      <div class="rail"><div class="fill"></div></div>
      ${[0, 1, 2].map((k) => `<div class="node" data-k="${k}"></div>`).join('')}
      ${[0, 1, 2, 3, 4].map((k) => `<div class="tick" data-k="${k}"></div>`).join('')}
      ${[['plan', 'BOOKING', 'Deposit', '+ SPA signed'], ['crane', 'BUILD', 'Instalments', 'linked to milestones'], ['key', 'HANDOVER', 'Final payment', '+ keys']].map(([ic, s, p, w], k) =>
        `<div class="col top" data-k="${k}" style="top:72px"><div class="ic">${I[ic]}</div><div class="st">${s}</div></div><div class="col bot" data-k="${k}" style="top:344px"><div class="pay">${p}</div><div class="when">${w}</div></div>`).join('')}`, null, 'r2-tl'),
    payN: mk(`<div class="r2-note">Amounts & timing vary by project — <span class="g">check your SPA</span></div>`, 1118),
    ddH: mk(`<div class="r2-eb">Due diligence</div><div class="r2-rule"></div><div class="r2-h2">Before you commit</div>`, 270),
    dd: mk([['dev', 'Developer', 'Registration & track record'], ['escrow', 'Escrow account', "The project's dedicated account"], ['spa', 'SPA review', 'Sale & Purchase Agreement']].map(([ic, a, b], k) =>
      `<div class="row" data-k="${k}"><div class="ic">${I[ic]}</div><div class="tx"><div class="t1">${a}</div><div class="t2">${b}</div></div><div class="ok"></div></div>`).join(''), 540, 'r2-dd'),
    ddN: mk(`<div class="r2-note" style="font-size:26px;color:${DIM}">Check with ADREC — Abu Dhabi Real Estate Centre</div>`, 1105),
    save: mk(`<div class="r2-save"><div class="ic">${I.save}</div><div class="lbl">Save this guide</div></div>`, 290),
    send: mk(`<div class="r2-send">${I.send}<span>Share it with someone buying off-plan</span></div>`, 530),
  };
  E.tl.style.top = '560px';
  const isl = {};
  for (const [k, n, ar, ll] of [['abudhabi', 'Abu Dhabi Island', 'جزيرة أبوظبي', [54.371, 24.469]], ['reem', 'Al Reem Island', 'جزيرة الريم', [54.409, 24.493]], ['saadiyat', 'Saadiyat Island', 'جزيرة السعديات', [54.444, 24.546]], ['yas', 'Yas Island', 'جزيرة ياس', [54.609, 24.486]]])
    isl[k] = mk(`<div class="n">${n}</div><div class="c">${fmt(ll)}</div><div class="ar">${ar}</div>`, null, 'r2-isl');
  const ROOMS = ['LIVING', 'KITCHEN', 'BEDROOM', null, 'BATH', null, 'BALCONY'];
  const rooms = ROOMS.map((r) => r && mk(r, null, 'r2-room'));
  const steps = [...E.offS.querySelectorAll('.s')];
  const nodes = [...E.tl.querySelectorAll('.node')], ticks = [...E.tl.querySelectorAll('.tick')], tops = [...E.tl.querySelectorAll('.col.top')], bots = [...E.tl.querySelectorAll('.col.bot')], fill = E.tl.querySelector('.fill');
  const NX = [120, 450, 780];                         // node x within the 900 px card
  nodes.forEach((n, k) => { n.style.left = `${NX[k]}px`; }); tops.forEach((c, k) => { c.style.left = `${NX[k]}px`; }); bots.forEach((c, k) => { c.style.left = `${NX[k]}px`; });
  ticks.forEach((x, k) => { x.style.left = `${180 + k * 110 + (k >= 2 ? 30 : 0)}px`; });
  const rows = [...E.dd.querySelectorAll('.row')];
  const saveFill = E.save.querySelector('.fill'), saveIc = E.save.querySelector('.ic');

  // word-level subtitles
  const cap = mk('<span class="box"></span>', null, 'r2-cap'); const box = cap.firstChild; const W = [];
  for (const L of narration.lines) { const t0 = reel.vo[L.id], d = durations[L.id], ws = L.text.split(' '); const tot = ws.reduce((a, w) => a + w.length + 1, 0); let acc = 0;
    ws.forEach((w) => { const a = t0 + (acc / tot) * d; acc += w.length + 1; W.push({ w, a, b: t0 + (acc / tot) * d, line: L.id }); }); }
  const groups = []; let g = [];
  W.forEach((x, i) => { g.push(x); if (/[.,?!:—]$/.test(x.w) || x.w === '—' || g.length >= 4 || !W[i + 1] || W[i + 1].line !== x.line) { groups.push(g); g = []; } });
  const at = (re, line) => { const x = W.find((w) => (!line || w.line === line) && w.w.toLowerCase().replace(/[^a-z']/g, '').startsWith(re)); return x ? x.a : 0; };
  const S = Object.fromEntries(reel.shots.map((s) => [s.id, s.r]));
  const lineWith = (w) => (narration.lines.find((l) => l.text.toLowerCase().includes(w)) || {}).id;
  const DROPS = (reel.map && reel.map.drops) || [0.15, 0.4, 0.65, 0.9], FOCUS = (reel.map && reel.map.focus) || [1.55, 2.35, 3.2, 4.05];
  const selC = [...E.sel.querySelectorAll('.c')];

  return {
    words: W,
    update(t, { A, shot, T }) {
      for (const e of [...Object.values(E), ...Object.values(isl), ...rooms.filter(Boolean)]) e.style.display = 'none';
      // 1 HOOK — first line readable on frame 1
      if (show(E.hook, t, -0.2, S.hook[1] - 0.05, { rise: 0, blur: 0 })) stagger(E.hook, t, -0.45, 0.13, 0.45);
      // 2 OFF-PLAN — one wordmark + the transformation it names
      show(E.offT, t, S.offplan[0] + 0.25, S.offplan[1] - 0.05, { fi: 0.7 });
      if (show(E.offS, t, S.offplan[0] + 0.6, S.offplan[1] - 0.05)) { const lit = [0.0, 1.5, 3.9]; steps.forEach((s, k) => s.classList.toggle('on', T >= lit[k])); }
      // 3 MAP
      if (shot === 'map') {
        show(E.mapH, t, S.map[0] + 0.25, S.map[1] - 0.05); show(E.north, t, S.map[0] + 0.4, S.map[1] - 0.05, { rise: 0 }); show(E.attr, t, S.map[0] + 0.4, S.map[1] - 0.05, { rise: 0 });
        const drops = DROPS, focusT = FOCUS;
        ['abudhabi', 'reem', 'saadiyat', 'yas'].forEach((k, i) => {
          const p = A['isl_' + k]; const e = isl[k]; if (!p || !p.visible) return;
          const v = clamp((T - drops[i] - 0.25) / 0.45); if (v <= 0) return;
          const act = clamp(1 - Math.abs(T - focusT[i]) / 0.75);
          e.style.display = ''; e.style.left = `${Math.min(940 - e.offsetWidth / 2, Math.max(50 + e.offsetWidth / 2, p.x))}px`; e.style.top = `${p.y}px`;
          e.style.opacity = (v * (0.6 + 0.4 * act)).toFixed(3); e.style.transform = `translate(-50%,-100%) scale(${(0.86 + 0.14 * act).toFixed(3)})`;
          e.querySelector('.n').style.color = act > 0.5 ? GOLD : IVORY;
        });
      }
      // 4 UNIT — floating room labels
      if (shot === 'unit') {
        show(E.unitH, t, S.unit[0] + 0.2, S.unit[1] - 0.05);
        if (show(E.sel, t, S.unit[0] + 0.35, S.unit[1] - 0.05, { rise: 16 })) {
          const L3 = lineWith('location'); const on = [at('location', L3), at('developer', L3), at('unit', L3)];
          selC.forEach((c, k) => { const lit = t >= on[k] - 0.05; c.classList.toggle('on', lit); const v = easeOut(clamp((T - 0.35 - k * 0.2) / 0.5)); c.style.opacity = v.toFixed(3); c.style.transform = `translateX(${((1 - v) * -20).toFixed(1)}px) scale(${lit ? (1 + 0.04 * Math.max(0, 1 - (t - on[k]) / 0.3)).toFixed(3) : 1})`; });
        }
        rooms.forEach((e, i) => { if (!e) return; const p = A['room' + i]; if (!p || !p.visible) return; const v = easeOut(clamp((T - 1.6 - i * 0.15) / 0.45));
          if (v <= 0) return; e.style.display = ''; e.style.left = `${p.x}px`; e.style.top = `${p.y}px`; e.style.opacity = v.toFixed(3); e.style.transform = `translate(-50%,-100%) translateY(${((1 - v) * 10).toFixed(1)}px)`; });
      }
      // 5 PAYMENT — one infographic: construction milestones above, payments below
      show(E.payH, t, S.payment[0] + 0.25, S.payment[1] - 0.05);
      if (show(E.tl, t, S.payment[0] + 0.45, S.payment[1] - 0.05, { rise: 20 })) {
        const u = smooth(remap(T, 0.9, 4.2)); const px = 120 + u * 660; fill.style.width = `${(px - 120).toFixed(1)}px`;
        nodes.forEach((n, k) => n.classList.toggle('on', px >= NX[k] - 2));
        ticks.forEach((x, k) => { x.style.opacity = px >= parseFloat(x.style.left) ? 1 : 0.15; });
        [tops, bots].forEach((arr) => arr.forEach((c, k) => { const v = easeOut(clamp((px - NX[k] + 40) / 80)); c.style.opacity = (0.18 + 0.82 * v).toFixed(3); c.style.transform = `translateY(${((1 - v) * 10).toFixed(1)}px)`; }));
      }
      show(E.payN, t, S.payment[0] + 3.9, S.payment[1] - 0.05, { rise: 12 });
      // 6 DUE DILIGENCE — three cards, each confirmed on its spoken word
      show(E.ddH, t, S.verify[0] + 0.25, S.verify[1] - 0.05);
      if (show(E.dd, t, S.verify[0] + 0.4, S.verify[1] - 0.05, { rise: 18 })) {
        const L5 = lineWith('escrow'); const on = [at('developer', L5), at('escrow', L5), at('spa', L5)];
        rows.forEach((r, k) => { const done = t >= on[k]; r.classList.toggle('on', done); const okEl = r.querySelector('.ok');
          const u = easeOutBack(clamp((t - on[k]) / 0.3)); okEl.innerHTML = done ? I.ok : ''; okEl.style.transform = `scale(${u.toFixed(3)})`;
          const v = easeOut(clamp((T - 0.45 - k * 0.22) / 0.5)); r.style.opacity = v.toFixed(3); r.style.transform = `translateX(${((1 - v) * -24).toFixed(1)}px)`; });
      }
      show(E.ddN, t, at('spa', lineWith('escrow')) + 0.2, S.verify[1] - 0.05, { rise: 10 });
      // 7 END — one closing graphic
      const LS = lineWith('save this guide'), tS = at('save', LS);
      if (show(E.save, t, Math.min(tS - 0.25, S.end[0] + 0.3), 35.2, { fi: 0.6 })) {
        const f = easeInOut(remap(t, tS + 0.25, tS + 0.85)); saveFill.style.clipPath = `inset(${((1 - f) * 100).toFixed(1)}% 0 0 0)`;
        saveIc.style.transform = `scale(${(1 + 0.08 * Math.sin(clamp((t - tS - 0.75) / 0.4) * Math.PI)).toFixed(3)})`;
      }
      show(E.send, t, tS + 1.1, 35.2, { rise: 12 });
      // SUBTITLES
      const gi = groups.findIndex((gr) => t >= gr[0].a - 0.05 && t < gr[gr.length - 1].b + 0.15);
      if (gi >= 0) { cap.style.display = ''; const gr = groups[gi]; box.innerHTML = gr.map((x) => `<span class="${t >= x.a && t < x.b + 0.05 ? 'cw' : ''}">${x.w}</span>`).join(' ');
        const u = clamp((t - gr[0].a + 0.05) / 0.15); cap.style.opacity = u.toFixed(3); } else cap.style.display = 'none';
    },
  };
}
