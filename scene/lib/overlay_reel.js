// 35-second Instagram Reel typography layer: kinetic headlines, live data, warning cards,
// verification checklist, save/share CTA and word-highlighted subtitles.
// Everything is a pure function of reel time t (deterministic frames).
// Safe zones (Instagram Reels UI): nothing below y=1500 or above y=250; right 120 px kept clear.
import { clamp, remap, easeOut, easeInOut, easeOutBack } from './util.js';

const GOLD = '#e2c78f', IVORY = '#f3eee4';
const ICON = {
  warn: `<svg viewBox="0 0 64 64" width="58" height="58"><path d="M32 6 L60 56 H4 Z" fill="none" stroke="#e9a85a" stroke-width="4.5" stroke-linejoin="round"/><path d="M32 24 V40" stroke="#e9a85a" stroke-width="5" stroke-linecap="round"/><circle cx="32" cy="48" r="3.2" fill="#e9a85a"/></svg>`,
  check: `<svg viewBox="0 0 64 64" width="56" height="56"><circle cx="32" cy="32" r="28" fill="#c9a96a"/><path d="M19 33 L28 42 L46 23" fill="none" stroke="#0b1626" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  ring: `<svg viewBox="0 0 64 64" width="56" height="56"><circle cx="32" cy="32" r="27" fill="none" stroke="rgba(226,199,143,.55)" stroke-width="3"/></svg>`,
  save: `<svg viewBox="0 0 64 80" width="92" height="115"><path d="M10 6 H54 V74 L32 56 L10 74 Z" fill="none" stroke="${GOLD}" stroke-width="5" stroke-linejoin="round"/><path class="fill" d="M10 6 H54 V74 L32 56 L10 74 Z" fill="${GOLD}"/></svg>`,
  send: `<svg viewBox="0 0 64 64" width="46" height="46"><path d="M6 30 L58 8 L44 58 L30 38 Z" fill="none" stroke="${GOLD}" stroke-width="4" stroke-linejoin="round"/><path d="M30 38 L58 8" stroke="${GOLD}" stroke-width="4"/></svg>`,
};

const css = `
.rl { position:absolute; left:60px; right:140px; text-align:center; pointer-events:none; }
.rl .w { display:inline-block; will-change:transform,opacity; }
.rl-h { font:700 82px/1.08 'Plex Latin'; letter-spacing:-0.015em; color:${IVORY}; text-transform:uppercase; text-shadow:0 6px 40px rgba(0,0,0,.6); }
.rl-h .g { color:${GOLD}; }
.rl-eb { font:600 26px 'Plex Latin'; letter-spacing:.34em; color:${GOLD}; text-transform:uppercase; margin-bottom:18px; }
.rl-word { font:500 120px 'Cormorant'; letter-spacing:.14em; color:${GOLD}; text-shadow:0 6px 40px rgba(0,0,0,.6); }
.rl-sub { font:500 40px 'Plex Latin'; color:${IVORY}; text-shadow:0 3px 20px rgba(0,0,0,.8); }
.rl-flow { display:flex; justify-content:center; align-items:center; gap:18px; font:600 30px 'Plex Latin'; letter-spacing:.16em; color:${IVORY}; }
.rl-flow .n { padding:12px 22px; border:1.5px solid rgba(226,199,143,.5); border-radius:40px; background:rgba(7,14,25,.5); }
.rl-flow .n.on { background:${GOLD}; color:#0b1626; border-color:${GOLD}; }
.rl-flow .ar { width:46px; height:2px; background:${GOLD}; position:relative; }
.rl-flow .ar:after { content:''; position:absolute; right:-2px; top:-6px; border-left:10px solid ${GOLD}; border-top:7px solid transparent; border-bottom:7px solid transparent; }
.rl-tri { display:flex; justify-content:center; gap:16px; }
.rl-tri .t { font:700 46px 'Plex Latin'; letter-spacing:.06em; color:rgba(243,238,228,.28); text-transform:uppercase; }
.rl-tri .t.on { color:${IVORY}; } .rl-tri .t .tick { color:${GOLD}; font-size:34px; vertical-align:middle; }
.rl-dot { color:${GOLD}; font:700 46px 'Plex Latin'; }
.rl-data { display:inline-flex; flex-direction:column; align-items:center; padding:22px 44px 18px; border:1.5px solid rgba(226,199,143,.45); border-radius:22px; background:rgba(7,14,25,.55); }
.rl-data .k { font:600 22px 'Plex Latin'; letter-spacing:.3em; color:${GOLD}; }
.rl-data .v { font:700 110px/1 'Plex Latin'; color:${IVORY}; font-variant-numeric:tabular-nums; letter-spacing:-0.02em; margin-top:8px; }
.rl-data .bar { width:360px; height:6px; border-radius:3px; background:rgba(243,238,228,.15); margin-top:16px; overflow:hidden; }
.rl-data .bar i { display:block; height:100%; background:linear-gradient(90deg,#9c7c43,${GOLD}); }
.rl-stage { font:600 26px 'Plex Latin'; letter-spacing:.24em; color:${IVORY}; margin-top:14px; }
.rl-cards { display:flex; justify-content:center; gap:22px; }
.rl-card { display:flex; align-items:center; gap:16px; padding:20px 28px; border-radius:20px; background:rgba(28,16,8,.62); border:1.5px solid rgba(233,168,90,.6); font:700 36px 'Plex Latin'; letter-spacing:.06em; color:${IVORY}; text-transform:uppercase; }
.rl-check { display:inline-block; text-align:left; }
.rl-check .row { display:flex; align-items:center; gap:22px; font:600 48px 'Plex Latin'; color:${IVORY}; margin:18px 0; }
.rl-check .row.off { color:rgba(243,238,228,.35); }
.rl-cap { position:absolute; left:60px; right:140px; top:1268px; text-align:center; }
.rl-cap span.box { display:inline-block; padding:12px 24px; border-radius:14px; background:rgba(7,14,25,.66); font:600 44px/1.3 'Plex Latin'; color:${IVORY}; }
.rl-cap .cw { color:${GOLD}; }
.rl-save { display:flex; flex-direction:column; align-items:center; gap:14px; }
.rl-save .lbl { font:700 64px 'Plex Latin'; letter-spacing:.04em; color:${IVORY}; text-transform:uppercase; }
.rl-send { display:flex; align-items:center; justify-content:center; gap:16px; font:500 36px 'Plex Latin'; color:${IVORY}; }
`;

const mk = (html, top, cls = 'rl') => { const e = document.createElement('div'); e.className = cls; e.innerHTML = html; if (top != null) e.style.top = `${top}px`; document.getElementById('ui').appendChild(e); return e; };
const words = (txt, goldFrom = 99) => txt.split(' ').map((w, i) => `<span class="w${i >= goldFrom ? ' g' : ''}">${w}</span>`).join(' ');

// block reveal with optional exit
function show(e, t, a, b, { rise = 40, blur = 12, fi = 0.35, fo = 0.25, pop = 0 } = {}) {
  const i = easeOut(remap(t, a, a + fi)), o = 1 - easeInOut(remap(t, b - fo, b)), v = Math.min(i, o);
  e.style.display = v > 0.002 ? '' : 'none'; if (v <= 0.002) return 0;
  e.style.opacity = v.toFixed(3);
  e.style.filter = v < 0.995 ? `blur(${((1 - v) * blur).toFixed(1)}px)` : 'none';
  const s = pop ? 1 + pop * (1 - easeOutBack(remap(t, a, a + fi * 1.4))) : 1;
  e.style.transform = `translateY(${((1 - i) * rise - (1 - o) * 20).toFixed(1)}px) scale(${s.toFixed(4)})`;
  return v;
}
// kinetic word-by-word reveal inside an element
function kinetic(e, t, a, step = 0.11, dur = 0.32) {
  e.querySelectorAll('.w').forEach((w, k) => {
    const u = remap(t, a + k * step, a + k * step + dur);
    w.style.opacity = easeOut(u).toFixed(3);
    w.style.transform = `translateY(${((1 - easeOutBack(u, 1.6)) * 46).toFixed(1)}px) scale(${(0.86 + 0.14 * easeOutBack(u, 1.6)).toFixed(3)})`;
    w.style.filter = u < 0.99 ? `blur(${((1 - u) * 8).toFixed(1)}px)` : 'none';
  });
}

export function buildReelOverlay({ narration, durations, reel }) {
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const E = {
    hook: mk(`<div class="rl-h">${words('Buying a home')}<br>${words("that isn't built yet?", 1)}</div>`, 300),
    offT: mk(`<div class="rl-word">OFF-PLAN</div>`, 280),
    offF: mk(`<div class="rl-flow"><span class="n">PLAN</span><span class="ar"></span><span class="n">BUILD</span><span class="ar"></span><span class="n">HANDOVER</span></div>`, 470),
    selE: mk(`<div class="rl-eb">Abu Dhabi · choose right</div>`, 300),
    selT: mk(`<div class="rl-tri"><span class="t">Location</span><span class="rl-dot">·</span><span class="t">Project</span><span class="rl-dot">·</span><span class="t">Unit</span></div>`, 352),
    payT: mk(`<div class="rl-eb">Payment plan</div><div class="rl-h" style="font-size:70px">${words('Staged payments', 1)}</div>`, 270),
    payD: mk(`<div class="rl-data"><span class="k">CONSTRUCTION</span><span class="v">0%</span><span class="bar"><i></i></span><span class="rl-stage">STAGE 1 / 3 · BOOKING</span></div>`, 470),
    payN: mk(`<div class="rl-sub">Every plan is different — <span style="color:${GOLD}">read yours</span></div>`, 830),
    riskT: mk(`<div class="rl-eb" style="color:#e9a85a">Know the risks</div>`, 300),
    riskC: mk(`<div class="rl-cards"><div class="rl-card" data-k="0">${ICON.warn}<span>Delays</span></div><div class="rl-card" data-k="1">${ICON.warn}<span>Price changes</span></div></div>`, 352),
    verT: mk(`<div class="rl-eb">Due diligence</div><div class="rl-h" style="font-size:76px">${words('Verify first', 1)}</div>`, 270),
    verC: mk(`<div class="rl-check">${['Developer', 'Escrow account', 'Contract'].map((r, k) => `<div class="row off" data-k="${k}"><span class="ic">${ICON.ring}</span><span>${r}</span></div>`).join('')}</div>`, 470),
    ctaT: mk(`<div class="rl-h" style="font-size:66px;text-transform:none;letter-spacing:-0.01em">${words('Off-plan starts with')}<br>${words('the right information.', 1)}</div>`, 300),
    ctaS: mk(`<div class="rl-save"><div class="ic">${ICON.save}</div><div class="lbl">Save this guide</div></div>`, 280),
    ctaF: mk(`<div class="rl-send">${ICON.send}<span>Send it to someone buying off-plan</span></div>`, 545),
  };
  const flowN = [...E.offF.querySelectorAll('.n')];
  const triT = [...E.selT.querySelectorAll('.t')];
  const cards = [...E.riskC.querySelectorAll('.rl-card')];
  const rows = [...E.verC.querySelectorAll('.row')];
  const payV = E.payD.querySelector('.v'), payBar = E.payD.querySelector('.bar i'), payStage = E.payD.querySelector('.rl-stage');
  const saveFill = E.ctaS.querySelector('.fill'), saveIc = E.ctaS.querySelector('.ic');

  // word-level subtitle timeline (share of characters within each VO line)
  const cap = mk('<span class="box"></span>', null, 'rl-cap'); const capBox = cap.firstChild;
  const W = [];
  for (const L of narration.lines) {
    const t0 = reel.vo[L.id], d = durations[L.id], ws = L.text.split(' ');
    const tot = ws.reduce((a, w) => a + w.length + 1, 0); let acc = 0;
    ws.forEach((w) => { const a = t0 + (acc / tot) * d; acc += w.length + 1; W.push({ w, a, b: t0 + (acc / tot) * d, line: L.id }); });
  }
  const groups = []; let g = [];
  W.forEach((x, i) => { g.push(x); const end = /[.,?!:]$/.test(x.w) || g.length >= 4 || !W[i + 1] || W[i + 1].line !== x.line; if (end) { groups.push(g); g = []; } });
  const wordAt = (re, line) => { const x = W.find((w) => (!line || w.line === line) && w.w.toLowerCase().replace(/[^a-z-]/g, '').startsWith(re)); return x ? x.a : 0; };

  return {
    words: W,
    update(t, ctx) {
      for (const e of Object.values(E)) e.style.display = 'none';
      // HOOK — text on screen from frame 1 (no dead air), word-by-word kinetic build
      if (show(E.hook, t, -0.1, 3.65, { rise: 0, blur: 0 })) kinetic(E.hook, t, -0.32, 0.15, 0.3);
      // OFF-PLAN
      show(E.offT, t, 3.75, 8.3, { pop: 0.25, fi: 0.4 });
      if (show(E.offF, t, 4.6, 8.3, { rise: 24 })) flowN.forEach((n, k) => n.classList.toggle('on', t > [4.8, wordAt('finished') || 6.2, wordAt('handover') || 7.2][k]));
      // SELECTION
      show(E.selE, t, 8.5, 14.1, { rise: 16 });
      if (show(E.selT, t, 8.6, 14.1, { rise: 20 })) {
        const on = [wordAt('location', 'r3'), wordAt('project', 'r3'), wordAt('unit', 'r3')];
        triT.forEach((x, k) => { const u = clamp((t - on[k]) / 0.25); x.classList.toggle('on', u > 0); x.style.transform = `scale(${(1 + 0.12 * (1 - easeOut(u)) * (u > 0 ? 1 : 0)).toFixed(3)})`; });
      }
      // PAYMENT — live counter is construction progress (no invented financial figures)
      show(E.payT, t, 14.3, 20.1, { rise: 18 });
      if (show(E.payD, t, 14.7, 20.1, { rise: 24 })) {
        const u = ctx.payU; payV.textContent = `${Math.round(u * 100)}%`; payBar.style.width = `${(u * 100).toFixed(1)}%`;
        payStage.textContent = u < 0.04 ? 'STAGE 1 / 3 · BOOKING' : u < 0.97 ? 'STAGE 2 / 3 · INSTALMENTS' : 'STAGE 3 / 3 · HANDOVER';
      }
      show(E.payN, t, wordAt('every') - 0.1, 20.1, { rise: 16 });
      // RISKS — warning cards pulse in on the spoken words
      show(E.riskT, t, 20.3, 23.75, { rise: 16 });
      if (show(E.riskC, t, 20.4, 23.75, { rise: 0, blur: 0 })) {
        const on = [wordAt('delays'), wordAt('price')];
        cards.forEach((c, k) => { const u = clamp((t - on[k] + 0.1) / 0.3); c.style.opacity = u.toFixed(3); c.style.transform = `scale(${(0.8 + 0.2 * easeOutBack(u, 2)).toFixed(3)})`;
          const p = 0.5 + 0.5 * Math.sin((t - on[k]) * 9); c.style.boxShadow = u >= 1 ? `0 0 ${(18 + 18 * p).toFixed(0)}px rgba(233,168,90,${(0.25 + 0.25 * p).toFixed(2)})` : 'none'; });
      }
      // VERIFY — checklist ticks on the spoken words
      show(E.verT, t, 23.85, 27.5, { rise: 18 });
      if (show(E.verC, t, 24.0, 27.5, { rise: 20 })) {
        const on = [wordAt('developer'), wordAt('escrow'), wordAt('contract')];
        rows.forEach((r, k) => { const done = t > on[k]; r.classList.toggle('off', !done); r.querySelector('.ic').innerHTML = done ? ICON.check : ICON.ring;
          const u = clamp((t - on[k]) / 0.25); r.style.transform = `translateX(${done ? ((1 - easeOutBack(u)) * -14).toFixed(1) : 0}px)`; });
      }
      // CTA — message, then animated bookmark "save" + share prompt
      if (show(E.ctaT, t, 27.7, 29.75, { rise: 0, blur: 0, fo: 0.3 })) kinetic(E.ctaT, t, 27.75, 0.12, 0.34);
      if (show(E.ctaS, t, 29.65, 34.6, { pop: 0.3, fi: 0.4 })) {
        const f = easeInOut(remap(t, wordAt('save') + 0.1, wordAt('save') + 0.55)); saveFill.style.clipPath = `inset(${((1 - f) * 100).toFixed(1)}% 0 0 0)`;
        const b = Math.sin(clamp((t - wordAt('save') - 0.45) / 0.35) * Math.PI); saveIc.style.transform = `scale(${(1 + 0.14 * b).toFixed(3)})`;
      }
      show(E.ctaF, t, wordAt('send') - 0.1, 34.6, { rise: 18 });
      // SUBTITLES — 2–4 word groups, current word in gold
      const gi = groups.findIndex((gr) => t >= gr[0].a - 0.05 && t < gr[gr.length - 1].b + 0.12);
      if (gi >= 0) {
        cap.style.display = ''; const gr = groups[gi];
        capBox.innerHTML = gr.map((x) => `<span class="${t >= x.a && t < x.b + 0.05 ? 'cw' : ''}">${x.w}</span>`).join(' ');
        const u = clamp((t - gr[0].a + 0.05) / 0.12); cap.style.opacity = u.toFixed(3); cap.style.transform = `translateY(${((1 - easeOut(u)) * 12).toFixed(1)}px)`;
      } else cap.style.display = 'none';
    },
  };
}
