// Arabic typography layer (HTML/CSS → native Chromium shaping & bidi, true RTL).
// Every property is computed from t, so frames are deterministic.
import { clamp, remap, easeOut, easeInOut } from './util.js';

const el = (tag, cls, html = '', parent) => { const e = document.createElement(tag); if (cls) e.className = cls; e.innerHTML = html; (parent || document.getElementById('ui')).appendChild(e); return e; };

// in/out envelope with rise + de-blur (classic premium title reveal)
function reveal(e, t, a, b, { rise = 34, blur = 10, fi = 0.6, fo = 0.45, scale = 0 } = {}) {
  const i = easeOut(remap(t, a, a + fi)), o = 1 - easeInOut(remap(t, b - fo, b));
  const v = Math.min(i, o);
  e.style.opacity = v.toFixed(3);
  e.style.filter = v < 0.999 ? `blur(${((1 - v) * blur).toFixed(2)}px)` : 'none';
  const ty = (1 - i) * rise - (1 - o) * rise * 0.4;
  e.style.transform = `translateY(${ty.toFixed(1)}px)` + (scale ? ` scale(${(1 + (1 - v) * scale).toFixed(4)})` : '');
  e.style.display = v > 0.001 ? '' : 'none';
  return v;
}

export function buildOverlay({ narration, durations, timeline }) {
  const ui = document.getElementById('ui');
  const gradTop = el('div', '', ''); gradTop.style.cssText = 'position:absolute;left:0;right:0;top:0;height:760px;background:linear-gradient(rgba(5,10,18,.62),rgba(5,10,18,0));';
  const gradBot = el('div', '', ''); gradBot.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:640px;background:linear-gradient(rgba(5,10,18,0),rgba(5,10,18,.55));';
  const TOP = (y) => `top:${y}px`;
  // ---------- headings
  const H = {
    s1: el('div', 'layer', `<div class="eyebrow">OFF-PLAN · ABU DHABI</div><div class="rule"></div><div class="h1">كيف تشتري عقاراً<br>قبل أن يُبنى؟</div>`),
    s2: el('div', 'layer', `<div class="h1"><span class="latin gold" style="font-size:86px">OFF-PLAN</span></div><div class="rule"></div><div class="h2">الشراء على المخطط</div>`),
    s3: el('div', 'layer', `<div class="eyebrow">ABU DHABI</div><div class="rule"></div><div class="h2">أبوظبي</div>`),
    s4: el('div', 'layer', `<div class="h2" id="path"><span data-k="0">المشروع</span> <span class="gold">←</span> <span data-k="1">الوحدة</span> <span class="gold">←</span> <span data-k="2">التفاصيل</span></div>`),
    s5: el('div', 'layer', `<div class="eyebrow">PAYMENT PLAN</div><div class="rule"></div><div class="h2">خطة الدفع تختلف<br>من مشروع لآخر</div>`),
    s6: el('div', 'layer', `<div id="chips"><span class="chip" data-k="0">خيارات</span><span class="chip" data-k="1">دفعات مرحلية</span><span class="chip" data-k="2">تخطيط للمستقبل</span></div>`),
    s7a: el('div', 'layer', `<div class="eyebrow" style="color:#e9b86f">RISKS</div><div class="rule"></div><div class="h2">مخاطر يجب معرفتها</div>`),
    s7: el('div', 'layer', `<div class="eyebrow">VERIFY</div><div class="rule"></div><div class="h1">تحقق قبل أن تقرر</div>`),
  };
  H.s1.style.cssText = TOP(250); H.s2.style.cssText = TOP(250); H.s3.style.cssText = TOP(250); H.s4.style.cssText = TOP(270);
  H.s5.style.cssText = TOP(240); H.s6.style.cssText = TOP(270); H.s7a.style.cssText = TOP(250); H.s7.style.cssText = TOP(230);
  const pathSpans = [...H.s4.querySelectorAll('[data-k]')];
  const chips = [...H.s6.querySelectorAll('.chip')];
  H.s6.querySelector('#chips').style.cssText = 'display:flex;justify-content:center;flex-wrap:nowrap;gap:0;';
  chips.forEach((c) => { c.style.fontSize = '36px'; c.style.padding = '12px 24px'; c.style.margin = '0 7px'; });

  // checklist (S7)
  const checklist = el('div', 'layer', `<div style="display:inline-block;text-align:right">
      <div class="check" data-k="0"><i>✓</i><span>المطوّر</span></div>
      <div class="check" data-k="1"><i>✓</i><span>المشروع</span></div>
      <div class="check" data-k="2"><i>✓</i><span>العقد</span></div>
      <div class="check" data-k="3"><i>✓</i><span>خطة الدفع</span></div></div>`);
  checklist.style.cssText = 'top:520px';
  const checks = [...checklist.querySelectorAll('.check')];
  const foot = el('div', 'foot', 'تحقّق من بيانات المشروع وحساب الضمان (Escrow)<br>لدى الجهات الرسمية، مثل مركز أبوظبي العقاري (ADREC)');
  foot.style.top = '1000px'; foot.style.bottom = 'auto'; foot.style.fontSize = '27px'; foot.style.lineHeight = '1.6';

  // risk labels (S7)
  const riskDelay = el('div', 'ms', 'تأخّر التسليم<small>DELAY</small>');
  const riskPrice = el('div', 'ms', 'تغيّر الأسعار<small>PRICE CHANGE</small>');

  // closing (S8)
  const close = el('div', 'layer', `<div class="h2" style="font-weight:600">
      <div data-k="0">اعرف المشروع.</div><div data-k="1">افهم التفاصيل.</div><div data-k="2" class="gold">اختار بوعي.</div></div>`);
  close.style.cssText = TOP(330);
  const closeLines = [...close.querySelectorAll('[data-k]')];
  const cta = el('div', 'layer', `<div class="rule" style="width:180px"></div><div style="font-weight:500;font-size:44px">اكتشف المزيد عن عقارات أبوظبي</div>`);
  cta.style.cssText = 'bottom:285px';

  // map labels (S3), milestone labels (S5), layout labels (S6)
  const mkLabel = (ar, en) => el('div', 'label', `<div class="ar">${ar}</div><div class="en">${en}</div><div class="stem"></div>`);
  const mapL = { yas: mkLabel('جزيرة ياس', 'Yas Island'), saadiyat: mkLabel('جزيرة السعديات', 'Saadiyat Island'), reem: mkLabel('جزيرة الريم', 'Al Reem Island') };
  const ms = [el('div', 'ms', 'الحجز والعقد<small>BOOKING · CONTRACT</small>'), el('div', 'ms', 'دفعات أثناء البناء<small>CONSTRUCTION</small>'), el('div', 'ms', 'التسليم<small>HANDOVER</small>')];
  const lay = ['غرفة نوم', 'غرفتا نوم', 'ثلاث غرف'].map((s) => { const e = el('div', 'ms', s); e.style.fontSize = '32px'; return e; });
  const planTag = el('div', 'ms', 'المخطط<small>FLOOR PLAN</small>');

  // ---------- captions (VO subtitles), chunked at punctuation, timed by character share
  const capBox = el('div', 'cap', '<span></span>'); const capSpan = capBox.firstChild;
  const chunks = [];
  for (const L of narration.lines) {
    const t0 = timeline.vo[L.id], d = durations[L.id];
    const parts = L.text.split(/(?<=[،.!…؟])\s+/).filter(Boolean);
    const total = parts.reduce((a, p) => a + p.length, 0); let acc = 0;
    for (const p of parts) { const a = t0 + (acc / total) * d; acc += p.length; chunks.push({ a, b: t0 + (acc / total) * d, text: p }); }
  }
  chunks.forEach((c, i) => { const n = chunks[i + 1]; c.b = n && n.a - c.b < 0.6 ? n.a : c.b + 0.35; });

  const all = [...Object.values(H), checklist, foot, riskDelay, riskPrice, close, cta, ...Object.values(mapL), ...ms, ...lay, planTag];
  const hideAll = () => all.forEach((e) => { e.style.display = 'none'; });

  function place(e, p, v, dy = 0) { // p = projected {x,y,visible}
    if (!p || !p.visible || v <= 0.001) { e.style.display = 'none'; return; }
    e.style.display = ''; e.style.left = `${p.x}px`; e.style.top = `${p.y + dy}px`; e.style.opacity = v.toFixed(3);
  }

  return {
    update(t, A) { // A: anchors {name: {x,y,visible}} computed by the 3D side
      hideAll();
      reveal(H.s1, t, 1.6, 6.1);
      reveal(H.s2, t, 8.1, 14.8, { scale: 0.04 });
      reveal(H.s3, t, 18.2, 21.2);
      if (reveal(H.s4, t, 26.0, 33.9) > 0) pathSpans.forEach((s, k) => { const on = t > [26.2, 29.3, 31.2][k]; s.style.color = on ? '#f3eee4' : 'rgba(243,238,228,0.28)'; s.style.transition = 'none'; });
      reveal(H.s5, t, 35.4, 42.4);
      if (reveal(H.s6, t, 43.4, 51.9) > 0) chips.forEach((c, k) => { const on = (k === 0 && t < 46.6) || (k === 1 && t >= 46.6 && t < 48.6) || (k === 2 && t >= 48.6); c.classList.toggle('on', on); c.style.opacity = on ? 1 : 0.55; });
      reveal(H.s7a, t, 52.8, 58.1);
      reveal(H.s7, t, 58.5, 65.8, { scale: 0.03 });
      if (reveal(checklist, t, 59.0, 65.8, { rise: 20 }) > 0) checks.forEach((c, k) => { const on = t > [59.6, 60.6, 62.3, 63.4][k]; c.classList.toggle('on', on); c.style.opacity = on ? 1 : 0.45; });
      reveal(foot, t, 63.8, 65.8, { rise: 10, fi: 0.5 });
      // closing lines (staggered), CTA
      if (reveal(close, t, 70.3, 76.5, { rise: 0, blur: 0 }) > 0) closeLines.forEach((l, k) => reveal(l, t, 70.3 + k * 0.9, 77));
      reveal(cta, t, 73.5, 77, { rise: 20 });
      // anchored labels
      for (const [k, a] of Object.entries({ yas: 21.3, saadiyat: 23.0, reem: 24.2 })) place(mapL[k], A[k], clamp((t - a) / 0.5) * (1 - remap(t, 25.0, 25.5)));
      const msOn = [35.8, 37.6, 40.6];
      ms.forEach((e, k) => place(e, A['ms' + k], clamp((t - msOn[k]) / 0.5) * (1 - remap(t, 41.9, 42.4)), 0));
      lay.forEach((e, k) => place(e, A['lay' + k], clamp((t - 44.0 - k * 0.25) / 0.5) * (1 - remap(t, 46.2, 46.55))));
      place(planTag, A.plan, clamp((t - 11.0) / 0.5) * (1 - remap(t, 14.8, 15.3)));
      place(riskDelay, A.delay, clamp((t - 55.4) / 0.5) * (1 - remap(t, 57.9, 58.3)));
      place(riskPrice, A.price, clamp((t - 56.6) / 0.5) * (1 - remap(t, 57.9, 58.3)));
      // captions
      const c = chunks.find((c) => t >= c.a && t < c.b);
      if (c) { capBox.style.display = ''; capSpan.textContent = c.text; const v = Math.min(clamp((t - c.a) / 0.15), clamp((c.b - t) / 0.15)); capBox.style.opacity = v.toFixed(3); }
      else capBox.style.display = 'none';
    },
    chunks,
  };
}
