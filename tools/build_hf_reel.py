"""Generates the HyperFrames version of the final reel (hyperframes-reel/) from the reel's own sources:
scene/reel3.json (shots), audio/narration_reel3.json + audio/vo_reel3/durations.json (word timings),
scene/brand.json (palette), the themed overlay markup/CSS of scene/lib/overlay_reel2.js, and the
island-label anchors recorded by tools/render_plate_hf.js. Re-run after changing any of those:
    python3 tools/build_hf_reel.py
The generated files are plain HyperFrames HTML: edit them in the HyperFrames app or by hand afterwards."""
import glob, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HF = os.path.join(ROOT, 'hyperframes-reel')
R = json.load(open(os.path.join(ROOT, 'scene', 'reel3.json')))
NAR = json.load(open(os.path.join(ROOT, 'audio', 'narration_reel3.json')))
DUR = json.load(open(os.path.join(ROOT, 'audio', 'vo_reel3', 'durations.json')))
BR = json.load(open(os.path.join(ROOT, 'scene', 'brand.json')))
S = {s['id']: s['r'] for s in R['shots']}
FPS, TOTAL = R['fps'], R['duration']

# ---------------------------------------------------------------- word timings (same algorithm as overlay_reel2.js)
W = []
for L in NAR['lines']:
    t0, d, ws = R['vo'][L['id']], DUR[L['id']], L['text'].split(' ')
    tot = sum(len(w) + 1 for w in ws); acc = 0
    for w in ws:
        a = t0 + acc / tot * d; acc += len(w) + 1
        W.append(dict(w=w, a=a, b=t0 + acc / tot * d, line=L['id']))
groups, g = [], []
for i, x in enumerate(W):
    g.append(x)
    nxt = W[i + 1] if i + 1 < len(W) else None
    if re.search(r'[.,?!:—]$', x['w']) or x['w'] == '—' or len(g) >= 4 or not nxt or nxt['line'] != x['line']:
        groups.append(g); g = []
def line_with(s): return next(l['id'] for l in NAR['lines'] if s in l['text'].lower())
def at(prefix, line):
    for x in W:
        if x['line'] == line and re.sub(r"[^a-z']", '', x['w'].lower()).startswith(prefix): return x['a']
    return 0

# ---------------------------------------------------------------- palette → CSS variables
def mix(var, a): return f'color-mix(in srgb, var(--{var}) {round(a * 100, 1)}%, transparent)'
DEEP = 'color-mix(in srgb, var(--slate) 62%, black)'
def colors(s):
    s = re.sub(r'rgba\(230,\s*213,\s*184,\s*([\d.]+)\)', lambda m: mix('sand', float(m[1])), s)
    s = re.sub(r'rgba\(31,\s*41,\s*55,\s*([\d.]+)\)', lambda m: mix('dark', float(m[1])), s)
    s = re.sub(r'rgba\(47,\s*53,\s*61,\s*([\d.]+)\)', lambda m: f'color-mix(in srgb, {DEEP} {round(float(m[1]) * 100, 1)}%, transparent)', s)
    s = re.sub(r'#cdbea4', 'color-mix(in srgb, var(--sand) 89%, black)', s, flags=re.I)
    for h, v in ((BR['accent'], 'sand'), (BR['primary'], 'slate'), (BR['text'], 'dark')):
        s = re.sub(re.escape(h), f'var(--{v})', s, flags=re.I)
    return s
def svg_attrs(html):  # presentation attributes can't take var(): move colour attributes into style
    def fix(m):
        tag = m[0]; props = []
        for a in ('fill', 'stroke'):
            mm = re.search(rf'\s{a}="(var\([^"]+\))"', tag)
            if mm: props.append(f'{a}:{mm[1]}'); tag = tag.replace(mm[0], '')
        return tag if not props else tag[:-1].rstrip('/') + f' style="{";".join(props)}"' + ('/>' if tag.endswith('/>') else '>')
    return re.sub(r'<(svg|path|circle|rect|text)\b[^>]*>', fix, html)

UI = json.load(open(os.environ.get('UI_DUMP', os.path.join(ROOT, 'tools', 'hf_reel_ui.json'))))
CSS = colors(UI['styles'][-1] + '\n' + UI['styles'][-2])
CSS = CSS.replace('.r2-isl { position:absolute; transform:translate(-50%,-100%);', '.r2-isl { position:absolute; left:0; top:0;')
FONTS = """
      @font-face { font-family: 'Plex Latin'; font-weight: 500; src: url('assets/fonts/ibm-plex-sans-arabic-latin-500-normal.woff2') format('woff2'); }
      @font-face { font-family: 'Plex Latin'; font-weight: 600; src: url('assets/fonts/ibm-plex-sans-arabic-latin-600-normal.woff2') format('woff2'); }
      @font-face { font-family: 'Plex Latin'; font-weight: 700; src: url('assets/fonts/ibm-plex-sans-arabic-latin-700-normal.woff2') format('woff2'); }
      @font-face { font-family: 'Cormorant'; font-weight: 500; src: url('assets/fonts/cormorant-garamond-latin-500-normal.woff2') format('woff2'); }
      @font-face { font-family: 'IBM Plex Sans Arabic'; font-weight: 500; src: url('assets/fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2') format('woff2'); }"""
UIH = {}
for u in UI['ui']:
    if u['cls'].startswith('r2'): UIH.setdefault(u['cls'], []).append(u)
def blk(cls, i): return svg_attrs(colors(UIH[cls][i]['html']))

# The reel's reveal helper, as GSAP: show(el, a, b) fades/rises in over fi from a (cubic out) and fades out over fo before b.
HELPERS = """
      const EO = (p) => 1 - Math.pow(1 - p, 3);
      const EIO = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
      // a tween that started before this scene: keep only its visible remainder, on the same curve
      const trim = (a, dur, ease) => (a >= 0 ? [a, dur, ease] : [0, dur + a, (p) => ease(-a / dur + (1 + a / dur) * p)]);
      function show(sel, a, b, { rise = 26, blur = 8, fi = 0.55, fo = 0.3, slot = Infinity } = {}) {
        const [p, d, e] = trim(a, fi, EO);
        tl.fromTo(sel, { opacity: 0, y: rise, filter: blur ? `blur(${blur}px)` : 'none' }, { opacity: 1, y: 0, filter: blur ? 'blur(0px)' : 'none', duration: d, ease: e }, p);
        if (b <= slot) tl.to(sel, { opacity: 0, filter: blur ? `blur(${blur}px)` : 'none', duration: fo, ease: EIO }, b - fo);
      }"""

def r(x): return f'{x:.3f}'.rstrip('0').rstrip('.') if abs(x) > 1e-9 else '0'

def scene(cid, start, dur, body, script, extra_css=''):
    return f"""<template>
  <style>{FONTS}
      #root {{ position: absolute; inset: 0; font-family: 'Plex Latin'; }}
      #root .lay {{ position: absolute; inset: 0; }}
{CSS}
{extra_css}
  </style>
  <div id="root" data-composition-id="{cid}" data-width="1080" data-height="1920" data-duration="{r(dur)}">
{body}
  </div>
  <script>
    (() => {{
      const tl = gsap.timeline({{ paused: true }});{HELPERS}
{script}
      window.__timelines["{cid}"] = tl;
    }})();
  </script>
</template>
"""

def clip(id_, a, b, inner, cls='r2', top=None, slot=None, track=1):
    a0 = max(0, a); b0 = min(b, slot) if slot else b
    st = f' style="top:{top}px"' if top is not None else ''
    return f'    <div id="{id_}" class="clip lay" data-start="{r(a0)}" data-duration="{r(b0 - a0)}" data-track-index="{track}"><div id="{id_}-in" class="{cls}"{st}>{inner}</div></div>'

scenes = []

# 1 HOOK -----------------------------------------------------------------------------------------
c, (s0, s1) = 'hook', S['hook']
L = s1 - s0
body = clip('hook-title', 0, s1 - 0.05 - s0, blk('r2', 0), top=300)
js = f"""      show('#hook-title-in', -0.2, {r(L - 0.05)}, {{ rise: 0, blur: 0, slot: {r(L)} }});
      // word-by-word reveal, readable from frame 1
      document.querySelectorAll('#hook-title-in .w').forEach((w, k) => {{
        const [p, d, e] = trim(-0.45 + k * 0.13, 0.45, EO);
        tl.fromTo(w, {{ opacity: 0, y: 22, filter: 'blur(6px)' }}, {{ opacity: 1, y: 0, filter: 'blur(0px)', duration: d, ease: e }}, p);
      }});"""
scenes.append((c, s0, L, scene(c, s0, L, body, js)))

# 2 OFF-PLAN -------------------------------------------------------------------------------------
c, (s0, s1) = 'offplan', S['offplan']; L = s1 - s0
body = '\n'.join([clip('offplan-word', 0.25, L - 0.05, blk('r2', 1), top=270),
                  clip('offplan-steps', 0.6, L - 0.05, blk('r2', 2).replace('<span class="s">', '<span class="s" id="offplan-s{}">'), top=440)])
k = 0
def numbered(m):
    global k; k += 1; return m[0].replace('{}', str(k - 1))
body = re.sub(r'id="offplan-s\{\}"', numbered, body)
js = f"""      show('#offplan-word-in', 0.25, {r(L - 0.05)}, {{ fi: 0.7, slot: {r(L)} }});
      show('#offplan-steps-in', 0.6, {r(L - 0.05)}, {{ slot: {r(L)} }});
      // BLUEPRINT → CONSTRUCTION → COMPLETION light up as the build progresses
      [0.0, 1.5, 3.9].forEach((t, i) => tl.set('#offplan-s' + i, {{ attr: {{ class: 's on' }} }}, t));"""
scenes.append((c, s0, L, scene(c, s0, L, body, js)))

# 3 MAP ------------------------------------------------------------------------------------------
c, (s0, s1) = 'map', S['map']; L = s1 - s0
ISL = ['abudhabi', 'reem', 'saadiyat', 'yas']
anchors = {}
for f in sorted(glob.glob(os.path.join(ROOT, 'frames_plate', 'anchors_*.json'))):
    anchors.update({int(k): v for k, v in json.load(open(f)).items()})
f0, f1 = round(s0 * FPS), round(s1 * FPS)
track = {k: [[anchors[f][f'isl_{k}']['x'], anchors[f][f'isl_{k}']['y'], 1 if anchors[f][f'isl_{k}']['v'] else 0] if f in anchors and f'isl_{k}' in anchors[f] else [0, 0, 0]
             for f in range(f0, f1)] for k in ISL}
isl_html = UIH['r2-isl']
body = '\n'.join([clip('map-title', 0.25, L - 0.05, blk('r2', 3), top=280),
                  clip('map-north', 0.4, L - 0.05, blk('r2-north', 0), cls='r2-north'),
                  clip('map-attr', 0.4, L - 0.05, blk('r2-attr', 0), cls='r2-attr')] +
                 [f'    <div id="map-{k}" class="clip lay" data-start="0" data-duration="{r(L)}" data-track-index="2"><div id="map-{k}-in" class="r2-isl">{svg_attrs(colors(isl_html[i]["html"]))}</div></div>' for i, k in enumerate(ISL)])
drops, focus = R['map']['drops'], R['map']['focus']
js = f"""      show('#map-title-in', 0.25, {r(L - 0.05)}, {{ slot: {r(L)} }});
      show('#map-north-in', 0.4, {r(L - 0.05)}, {{ rise: 0, slot: {r(L)} }});
      show('#map-attr-in', 0.4, {r(L - 0.05)}, {{ rise: 0, slot: {r(L)} }});
      // Island labels ride on the 3D map: screen positions per frame ([x, y, visible]) recorded from the 3D scene
      const FPS = {FPS}, TRACK = {json.dumps(track, separators=(',', ':'))};
      const DROPS = {json.dumps(drops)}, FOCUS = {json.dumps(focus)};
      const clamp = (x) => Math.min(1, Math.max(0, x));
      const labels = {json.dumps(ISL)}.map((k) => document.querySelector('#map-' + k + '-in'));
      function place(T) {{
        const f = Math.min({f1 - f0 - 1}, Math.max(0, Math.floor(T * FPS + 1e-6)));
        labels.forEach((e, i) => {{
          const [x, y, vis] = TRACK[{json.dumps(ISL)}[i]][f];
          const v = clamp((T - DROPS[i] - 0.25) / 0.45), act = clamp(1 - Math.abs(T - FOCUS[i]) / 0.75);
          const w = e.offsetWidth, cx = Math.min(940 - w / 2, Math.max(50 + w / 2, x));
          gsap.set(e, {{ x: cx, y, xPercent: -50, yPercent: -100, scale: 0.86 + 0.14 * act, opacity: vis && v > 0 ? v * (0.6 + 0.4 * act) : 0 }});
        }});
      }}
      const clock = {{ T: 0 }};
      tl.fromTo(clock, {{ T: 0 }}, {{ T: {r(L)}, duration: {r(L)}, ease: 'none', onUpdate: () => place(clock.T) }}, 0);
      place(0);"""
scenes.append((c, s0, L, scene(c, s0, L, body, js, '#root .r2-isl { transform-origin: 50% 50%; }')))

# 4 UNIT (project selection) ---------------------------------------------------------------------
c, (s0, s1) = 'unit', S['unit']; L = s1 - s0
L3 = line_with('location'); on = [at('location', L3), at('developer', L3), at('unit', L3)]
sel = blk('r2', 5)
sel = re.sub(r'<div class="c[^"]*" data-k="(\d)"[^>]*>', lambda m: f'<div class="c" id="unit-c{m[1]}">', sel)
body = '\n'.join([clip('unit-title', 0.2, L - 0.05, blk('r2', 4), top=270), clip('unit-cards', 0.35, L - 0.05, sel, top=470)])
js = f"""      show('#unit-title-in', 0.2, {r(L - 0.05)}, {{ slot: {r(L)} }});
      show('#unit-cards-in', 0.35, {r(L - 0.05)}, {{ rise: 16, slot: {r(L)} }});
      // each card slides in, then lights on its spoken word (location · developer · unit) with a small pop
      const ON = {json.dumps([round(x - s0, 3) for x in on])};
      [0, 1, 2].forEach((k) => {{
        const c = '#unit-c' + k;
        tl.fromTo(c, {{ opacity: 0, x: -20 }}, {{ opacity: 1, x: 0, duration: 0.5, ease: EO }}, 0.35 + k * 0.2);
        const lit = ON[k] - 0.05;
        tl.set(c, {{ attr: {{ class: 'c on' }} }}, Math.max(0, lit));
        if (lit >= 0) tl.fromTo(c, {{ scale: 1 + 0.04 * (1 + 0.05 / 0.3) }}, {{ scale: 1, duration: 0.35, ease: 'none', immediateRender: false }}, lit);
      }});"""
scenes.append((c, s0, L, scene(c, s0, L, body, js)))

# 5 PAYMENT --------------------------------------------------------------------------------------
c, (s0, s1) = 'payment', S['payment']; L = s1 - s0
tlh = blk('r2-tl', 0)
NX = [120, 450, 780]; TX = [180 + k * 110 + (30 if k >= 2 else 0) for k in range(5)]
tlh = re.sub(r'<div class="node" data-k="(\d)"[^>]*>', lambda m: f'<div class="node" id="pay-node{m[1]}" style="left:{NX[int(m[1])]}px">', tlh)
tlh = re.sub(r'<div class="tick" data-k="(\d)"[^>]*>', lambda m: f'<div class="tick" id="pay-tick{m[1]}" style="left:{TX[int(m[1])]}px">', tlh)
tlh = re.sub(r'<div class="col (top|bot)" data-k="(\d)"[^>]*>', lambda m: f'<div class="col {m[1]}" id="pay-{m[1]}{m[2]}" style="top:{72 if m[1] == "top" else 344}px;left:{NX[int(m[2])]}px">', tlh)
tlh = tlh.replace('<div class="fill"></div>', '<div class="fill" id="pay-fill" style="width:660px;transform-origin:0 50%"></div>')
body = '\n'.join([clip('pay-title', 0.25, L - 0.05, blk('r2', 6), top=270),
                  clip('pay-chart', 0.45, L - 0.05, tlh, cls='r2-tl', top=560),
                  clip('pay-note', 3.9, L - 0.05, blk('r2', 7), top=1118)])
js = f"""      show('#pay-title-in', 0.25, {r(L - 0.05)}, {{ slot: {r(L)} }});
      show('#pay-chart-in', 0.45, {r(L - 0.05)}, {{ rise: 20, slot: {r(L)} }});
      show('#pay-note-in', 3.9, {r(L - 0.05)}, {{ rise: 12, slot: {r(L)} }});
      // the progress rail fills with construction; each stage's payment lights as the rail reaches it
      const NX = {json.dumps(NX)}, TX = {json.dumps(TX)}, SM = (p) => p * p * (3 - 2 * p);
      const P = {{ u: 0 }};
      function rail(u) {{
        const px = 120 + u * 660;
        gsap.set('#pay-fill', {{ scaleX: u }});
        NX.forEach((x, k) => {{
          document.querySelector('#pay-node' + k).className = 'node' + (px >= x - 2 ? ' on' : '');
          const v = EO(Math.min(1, Math.max(0, (px - x + 40) / 80)));
          gsap.set(['#pay-top' + k, '#pay-bot' + k], {{ opacity: 0.18 + 0.82 * v, y: (1 - v) * 10 }});
        }});
        TX.forEach((x, k) => gsap.set('#pay-tick' + k, {{ opacity: px >= x ? 1 : 0.15 }}));
      }}
      tl.fromTo(P, {{ u: 0 }}, {{ u: 1, duration: 3.3, ease: SM, onUpdate: () => rail(P.u) }}, 0.9);
      rail(0);"""
scenes.append((c, s0, L, scene(c, s0, L, body, js)))

# 6 DUE DILIGENCE --------------------------------------------------------------------------------
c, (s0, s1) = 'verify', S['verify']; L = s1 - s0
L5 = line_with('escrow'); on = [at('developer', L5), at('escrow', L5), at('spa', L5)]
ok_svg = '<svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="18" style="fill:var(--sand)"/><path d="M12 20.5l5.5 5.5L28.5 14" fill="none" style="stroke:var(--slate)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
dd = blk('r2-dd', 0)
dd = re.sub(r'<div class="row[^"]*" data-k="(\d)"[^>]*>', lambda m: f'<div class="row" id="dd-row{m[1]}">', dd)
parts = dd.split('<div class="ok"></div>')
dd = ''.join(p + (f'<div class="ok"><div id="dd-ok{i}">{ok_svg}</div></div>' if i < len(parts) - 1 else '') for i, p in enumerate(parts))
tspa = on[2] - s0
body = '\n'.join([clip('dd-title', 0.25, L - 0.05, blk('r2', 8), top=270),
                  clip('dd-list', 0.4, L - 0.05, dd, cls='r2-dd', top=540),
                  clip('dd-note', tspa + 0.2, L - 0.05, blk('r2', 9), top=1105)])
js = f"""      show('#dd-title-in', 0.25, {r(L - 0.05)}, {{ slot: {r(L)} }});
      show('#dd-list-in', 0.4, {r(L - 0.05)}, {{ rise: 18, slot: {r(L)} }});
      show('#dd-note-in', {r(tspa + 0.2)}, {r(L - 0.05)}, {{ rise: 10, slot: {r(L)} }});
      // three checks, each ticked on its spoken word: developer · escrow account · SPA
      const ON = {json.dumps([round(x - s0, 3) for x in on])};
      [0, 1, 2].forEach((k) => {{
        tl.fromTo('#dd-row' + k, {{ opacity: 0, x: -24 }}, {{ opacity: 1, x: 0, duration: 0.5, ease: EO }}, 0.45 + k * 0.22);
        tl.set('#dd-row' + k, {{ attr: {{ class: 'row on' }} }}, ON[k]);
        tl.fromTo('#dd-ok' + k, {{ scale: 0 }}, {{ scale: 1, duration: 0.3, ease: 'back.out(1.4)' }}, ON[k]);
      }});"""
scenes.append((c, s0, L, scene(c, s0, L, body, js, '#root .r2-dd .ok > div { width: 40px; height: 40px; transform-origin: 50% 50%; }')))

# 7 SAVE & SHARE ---------------------------------------------------------------------------------
c, (s0, s1) = 'end', S['end']; L = TOTAL - s0
tS = at('save', line_with('save this guide')) - s0
sv = blk('r2', 10).replace('class="fill"', 'id="end-fill"').replace('<div class="ic">', '<div class="ic" id="end-icon">')
a_save = min(tS - 0.25, 0.3)
body = '\n'.join([clip('end-save', a_save, L, sv, top=290), clip('end-share', tS + 1.1, L, blk('r2', 11), top=530)])
js = f"""      show('#end-save-in', {r(a_save)}, 99, {{ fi: 0.6, slot: {r(L)} }});
      show('#end-share-in', {r(tS + 1.1)}, 99, {{ rise: 12, slot: {r(L)} }});
      // the bookmark fills on "save", then gives one small pulse
      tl.fromTo('#end-fill', {{ clipPath: 'inset(100% 0% 0% 0%)' }}, {{ clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: EIO }}, {r(tS + 0.25)});
      tl.fromTo('#end-icon', {{ scale: 1 }}, {{ scale: 1, duration: 0.4, ease: 'none', onUpdate() {{ gsap.set('#end-icon', {{ scale: 1 + 0.08 * Math.sin(this.progress() * Math.PI) }}); }} }}, {r(tS + 0.75)});"""
scenes.append((c, s0, L, scene(c, s0, L, body, js, '#root #end-icon { transform-origin: 50% 50%; }')))

# CAPTIONS (word-level, current word highlighted) ------------------------------------------------
cap_body, cap_js, prev_end = [], [], 0
for gi, gr in enumerate(groups):
    a0, b1 = gr[0]['a'] - 0.05, gr[-1]['b'] + 0.15
    s, e = max(a0, prev_end), b1; prev_end = e
    words = ' '.join(f'<span id="cap{gi}-w{j}">{x["w"]}</span>' for j, x in enumerate(gr))
    cap_body.append(f'    <div id="cap{gi}" class="clip lay" data-start="{r(s)}" data-duration="{r(e - s)}" data-track-index="1"><div id="cap{gi}-in" class="r2-cap"><span class="box">{words}</span></div></div>')
    if s < a0 + 0.15: cap_js.append(f"      tl.fromTo('#cap{gi}-in', {{ opacity: {r(max(0, (s - a0) / 0.15))} }}, {{ opacity: 1, duration: {r(a0 + 0.15 - s)}, ease: 'none' }}, {r(s)});")
    for j, x in enumerate(gr):
        hs, he = max(x['a'], s), min(x['b'] + 0.05, e)
        if he > hs: cap_js.append(f"      tl.set('#cap{gi}-w{j}', {{ attr: {{ class: 'cw' }} }}, {r(hs)}).set('#cap{gi}-w{j}', {{ attr: {{ class: '' }} }}, {r(he)});")
caps = f"""<template>
  <style>{FONTS}
      #root {{ position: absolute; inset: 0; font-family: 'Plex Latin'; }}
      #root .lay {{ position: absolute; inset: 0; }}
{CSS}
  </style>
  <div id="root" data-composition-id="captions" data-width="1080" data-height="1920" data-duration="{r(TOTAL)}">
{chr(10).join(cap_body)}
  </div>
  <script>
    (() => {{
      const tl = gsap.timeline({{ paused: true }});
{chr(10).join(cap_js)}
      window.__timelines["captions"] = tl;
    }})();
  </script>
</template>
"""

# ---------------------------------------------------------------- write
os.makedirs(os.path.join(HF, 'compositions'), exist_ok=True)
for cid, s0, L, html in scenes: open(os.path.join(HF, 'compositions', f'{cid}.html'), 'w').write(html)
open(os.path.join(HF, 'compositions', 'captions.html'), 'w').write(caps)
hosts = '\n'.join(f'      <div id="{cid}" data-composition-id="{cid}" data-composition-src="compositions/{cid}.html" data-start="{r(s0)}" data-duration="{r(L)}" data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:{2 + i}"></div>'
                  for i, (cid, s0, L, _) in enumerate(scenes))
VARS = [dict(id='sand', type='color', label='Brand sand (panels, highlights)', default=BR['accent']),
        dict(id='slate', type='color', label='Brand slate (backgrounds)', default=BR['primary']),
        dict(id='dark', type='color', label='Brand dark (text on sand)', default=BR['text'])]
index = f"""<!doctype html>
<html lang="en" data-composition-variables='{json.dumps(VARS)}'>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>Off-plan in Abu Dhabi — final reel</title>
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      :root {{ --sand: {BR['accent']}; --slate: {BR['primary']}; --dark: {BR['text']}; }}
      * {{ box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #070e19; }}
      #plate {{ position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; object-fit: contain; z-index: 1; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{r(TOTAL)}" data-width="1080" data-height="1920" data-fps="{FPS}">
      <!-- 3D world (three.js, rendered from scene/ with the text layer off) -->
      <video id="plate" class="clip" src="assets/plate.mp4" data-start="0" data-duration="{r(TOTAL)}" data-track-index="0" muted playsinline></video>
      <!-- titles and infographics, one scene per shot -->
{hosts}
      <!-- word-level subtitles -->
      <div id="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="{r(TOTAL)}" data-track-index="2" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index:20"></div>
      <!-- sound: narrator (Kokoro bm_george), original score, effects -->
      <audio id="voice" class="clip" src="assets/audio/vo.wav" data-start="0" data-duration="{r(TOTAL)}" data-track-index="3" data-volume="1"></audio>
      <audio id="music" class="clip" src="assets/audio/music.wav" data-start="0" data-duration="{r(TOTAL)}" data-track-index="4" data-volume="1"></audio>
      <audio id="sfx" class="clip" src="assets/audio/sfx.wav" data-start="0" data-duration="{r(TOTAL)}" data-track-index="5" data-volume="1"></audio>
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
"""
open(os.path.join(HF, 'index.html'), 'w').write(index)
print('wrote', len(scenes) + 1, 'compositions +', 'index.html;', len(groups), 'caption groups;', 'anchors:', len(anchors), 'frames')
