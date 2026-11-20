"""Reel V2 (calm) soundtrack: original synthesised score + SFX locked to the reel EDL (scene/reel.json)
and to word timings of the reel VO (same algorithm as the on-screen subtitles).
Outputs audio/build_reel/{music,sfx,vo,mix}.wav"""
import json, os, wave
import numpy as np

ROOT = os.path.dirname(os.path.abspath(__file__))
R = json.load(open(os.path.join(ROOT, '..', 'scene', 'reel2.json')))
NAR = json.load(open(os.path.join(ROOT, 'narration_reel2.json')))
DUR = json.load(open(os.path.join(ROOT, 'vo_reel2', 'durations.json')))
SR = 48000; T = R['duration']; N = int(SR * T)
OUT = os.path.join(ROOT, 'build_reel2'); os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(11)
ta = lambda n: np.arange(n) / SR
midi = lambda m: 440.0 * 2 ** ((m - 69) / 12)

def fft_filter(x, lo=None, hi=None, slope=4):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); g = np.ones_like(f)
    if hi: g *= 1 / np.sqrt(1 + (f / hi) ** (2 * slope))
    if lo: g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * slope))
    return np.fft.irfft(X * g, len(x))
def adsr(n, a, r, s=1.0):
    e = np.ones(n) * s; na, nr = min(int(a * SR), n), min(int(r * SR), n)
    e[:na] = np.linspace(0, s, na); e[n - nr:] *= np.linspace(1, 0, nr); return e
def place(buf, sig, t0, pan=0.0, gain=1.0):
    i = int(max(0, t0) * SR)
    if i >= buf.shape[1]: return
    sig = sig[: buf.shape[1] - i] * gain
    buf[0, i:i + len(sig)] += sig * np.cos((pan + 1) * np.pi / 4) * 1.414
    buf[1, i:i + len(sig)] += sig * np.sin((pan + 1) * np.pi / 4) * 1.414
def reverb(x, decay=2.4, mix=0.28, seed=1):
    r = np.random.default_rng(seed); n = int(decay * SR); out = np.zeros_like(x)
    for ch in range(2):
        ir = r.standard_normal(n) * np.exp(-6.9 * np.arange(n) / n); ir = fft_filter(ir, lo=180, hi=7000, slope=1); ir /= np.sqrt((ir ** 2).sum())
        L = 1 << int(np.ceil(np.log2(x.shape[1] + n)))
        out[ch] = np.fft.irfft(np.fft.rfft(x[ch], L) * np.fft.rfft(ir, L), L)[: x.shape[1]]
    return x * (1 - mix) + out * mix

# word timings (identical to overlay_reel.js)
W = []
for L in NAR['lines']:
    t0, d, ws = R['vo'][L['id']], DUR[L['id']], L['text'].split(' ')
    tot = sum(len(w) + 1 for w in ws); acc = 0
    for w in ws: W.append((w.lower().strip('.,?!:'), t0 + acc / tot * d, L['id'])); acc += len(w) + 1
def word(prefix, line=None): return next(a for w, a, l in W if w.startswith(prefix) and (line is None or l == line))
def src2reel(shot, s):
    sh = next(x for x in R['shots'] if x['id'] == shot)
    return sh['r'][0] + (s - sh['src'][0]) * (sh['r'][1] - sh['r'][0]) / (sh['src'][1] - sh['src'][0])
CUTS = [s['r'][0] for s in R['shots'][1:]]

# ---------------------------------------------------------------- MUSIC (100 BPM)
BEAT = 0.75  # 80 BPM — calm
music = np.zeros((2, N))
CH = [(0.0, [38, 50, 57, 62, 64]), (3.7, [34, 50, 57, 62, 65]), (8.4, [41, 53, 57, 60, 64]), (13.4, [36, 52, 55, 60, 64]),
      (17.2, [41, 53, 57, 60, 67]), (23.0, [38, 50, 53, 57, 62]), (25.7, [33, 49, 52, 57, 61]), (28.3, [41, 53, 57, 60, 64, 69]), (T, None)]
for (a, notes), (b, _) in zip(CH[:-1], CH[1:]):
    n = int((b - a + 0.8) * SR); tt = ta(n); seg = np.zeros(n)
    for k, m in enumerate(notes):
        for det in (-0.08, 0.0, 0.07):
            ph = 2 * np.pi * midi(m) * (1 + det / 100) * tt + rng.uniform(0, 6.28)
            seg += (np.sin(ph) + 0.3 * np.sin(2 * ph)) * (0.9 if k == 0 else 0.5)
    seg *= adsr(n, 0.6 if a > 0 else 0.05, 1.0)
    place(music, seg, a, gain=0.034 if a < 28.3 else 0.04)
music = np.vstack([fft_filter(music[0], lo=40, hi=2600), fft_filter(music[1], lo=40, hi=2400)])
place(music, np.sin(2 * np.pi * midi(26) * ta(int(3.9 * SR))) * adsr(int(3.9 * SR), 0.02, 0.6), 0, gain=0.14)   # sub from frame 1
def pluck(f, dur=0.7):
    n = int(dur * SR); tt = ta(n); mod = np.sin(2 * np.pi * f * 3.5 * tt) * 2.0 * np.exp(-tt * 10)
    return np.sin(2 * np.pi * f * tt + mod) * np.exp(-tt * 5) * (1 - np.exp(-tt * 900))
def chord_at(x): return [nt for a, nt in CH[:-1] if x >= a][-1]
pat = [0, 2, 1, 3, 2, 4, 3, 1]; k = 0; x = 3.7
while x < T - 0.4:
    nt = chord_at(x); m = nt[1:][pat[k % 8] % (len(nt) - 1)] + 12
    lev = 0.6 if 23.0 <= x < 28.3 else 1.0
    place(music, pluck(midi(m), 1.1), x, pan=0.3 * np.sin(k * 1.3), gain=0.032 * lev); x += BEAT / 2; k += 1
def kick():
    n = int(0.42 * SR); tt = ta(n); f = 40 + 70 * np.exp(-tt * 32)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 8)
x = 8.4
while x < 28.1:   # soft felt pulse only in the information section
    place(music, kick(), x, gain=0.09); x += BEAT * 2
x = 23.05
while x < 28.1:  # caution: clock ticks under the risk section
    n = int(0.03 * SR); place(music, fft_filter(rng.standard_normal(n) * np.exp(-ta(n) * 220), lo=2500, hi=6000, slope=2), x, pan=0.4 if int((x - 23.05) / BEAT) % 2 else -0.4, gain=0.05); x += BEAT
n = int((T - 28.3 + 0.3) * SR); tt = ta(n); st = np.zeros(n)   # strings resolve on the ending
for m in (53, 57, 60, 64, 69, 72):
    for det in (-0.12, 0.1): st += 2 * ((midi(m) * (1 + det / 100) * tt + rng.uniform()) % 1.0) - 1
place(music, fft_filter(st, lo=120, hi=1800) * adsr(n, 2.2, 0.8), 28.3, gain=0.022)
music = reverb(music, 3.0, 0.3, 3)

# ---------------------------------------------------------------- SFX
sfx = np.zeros((2, N))
def whoosh(dur=0.55, hi=5000):
    n = int(dur * SR); e = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return fft_filter(rng.standard_normal(n), lo=300, hi=hi, slope=2) * e * np.linspace(0.3, 1, n)
def impact(d=1.0):
    n = int(1.8 * SR); tt = ta(n); f = 32 + 48 * np.exp(-tt * 12)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.6) + fft_filter(rng.standard_normal(n), lo=80, hi=900) * np.exp(-tt * 7) * 0.4) * d
def click(f=2400, dur=0.06, ring=1.0):
    n = int(dur * SR); tt = ta(n)
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 90) * ring + fft_filter(rng.standard_normal(n), lo=1500, hi=9000) * np.exp(-tt * 400)
def thunk(f=140):
    n = int(0.3 * SR); tt = ta(n)
    return np.sin(2 * np.pi * f * tt * (1 - 0.3 * tt)) * np.exp(-tt * 20) + fft_filter(rng.standard_normal(n), lo=200, hi=2000) * np.exp(-tt * 60) * 0.5
def shimmer(dur=1.2):
    n = int(dur * SR); tt = ta(n); s = np.zeros(n)
    for k, m in enumerate((81, 84, 88, 91, 93)): s += np.sin(2 * np.pi * midi(m) * tt) * np.exp(-np.maximum(tt - k * 0.05, 0) * 3.5) * (tt > k * 0.05)
    return s * 0.3
def riser(dur=1.0):
    n = int(dur * SR); tt = ta(n)
    return fft_filter(rng.standard_normal(n), lo=600, hi=8000, slope=1) * (tt / dur) ** 2 * 0.5 + np.sin(2 * np.pi * np.cumsum(200 + 900 * (tt / dur) ** 2) / SR) * (tt / dur) ** 3 * 0.3
def ping():
    n = int(1.4 * SR); tt = ta(n)
    return (np.sin(2 * np.pi * midi(88) * tt) + 0.5 * np.sin(2 * np.pi * midi(95) * tt)) * np.exp(-tt * 3.2)
def paper(dur=0.5):
    n = int(dur * SR); return fft_filter(rng.standard_normal(n), lo=1200, hi=7000) * np.sin(np.pi * np.linspace(0, 1, n)) ** 3

# calm cue sheet: soft swell into each scene, gentle confirmations where information appears
place(sfx, impact(0.5), 0.0, gain=0.3)                                                  # soft downbeat on frame 1
for c in CUTS: place(sfx, whoosh(0.9, 2500), c - 0.6, gain=0.16)                         # airy swell, no hits
for i in range(8): place(sfx, thunk(120 + (i % 3) * 15), src2reel('offplan', 1.25 + i * 0.32), pan=(i % 5 - 2) * 0.15, gain=0.14)   # floors land
place(sfx, shimmer(1.2), src2reel('offplan', 5.0), gain=0.2)
for i, d in enumerate((0.15, 0.4, 0.65, 0.9)): place(sfx, click(1700 + 150 * i, 0.08, 1.2), 8.4 + d + 0.3, pan=(-0.3, -0.1, 0.1, 0.3)[i], gain=0.14)   # markers drop
for f in (1.55, 2.35, 3.2, 4.05): place(sfx, shimmer(0.7), 8.4 + f - 0.2, gain=0.09)                                   # island focus
for i in range(6): place(sfx, click(2600, 0.04), 13.4 + 0.5 + i * 0.18, gain=0.06)                                    # room labels
for k, x in enumerate((0.0, 0.5, 1.0)): place(sfx, click(2200, 0.07, 1.3), 17.2 + 0.9 + (3.3 * x if k else 0) + (0.05 if k else 0.0), gain=0.15)  # timeline nodes
for s_ in ('developer', 'escrow', 'spa'): place(sfx, click(2900, 0.08, 1.5), word(s_, 'v5'), gain=0.2)
place(sfx, ping(), word('save', 'v7') + 0.6, gain=0.25)
sfx = reverb(sfx, 1.4, 0.16, 5)

# ---------------------------------------------------------------- VO + duck + mix
vo = np.zeros((2, N)); env = np.zeros(N)
for sid, t0 in R['vo'].items():
    with wave.open(os.path.join(ROOT, 'vo_reel2', sid + '.wav')) as w:
        sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
    a = np.interp(np.linspace(0, len(a) - 1, int(len(a) * SR / sr)), np.arange(len(a)), a)
    a = fft_filter(a, lo=85, hi=12000, slope=2); a = a + 0.22 * fft_filter(a, lo=2200, hi=5000, slope=2)
    a = a / np.max(np.abs(a)) * 0.7; place(vo, a, t0); i = int(t0 * SR); env[i:i + len(a)] = 1
vo = reverb(vo, 0.5, 0.05, 9)
k = int(0.2 * SR); cs = np.concatenate([[0.0], np.cumsum(env)]); idx = np.arange(N)
duck = 1 - 0.62 * (cs[np.clip(idx + k - k // 2, 0, N)] - cs[np.clip(idx - k // 2, 0, N)]) / k
music *= 0.9 / np.max(np.abs(music)); sfx *= 0.9 / np.max(np.abs(sfx))
fade = np.ones(N); fo = int(0.9 * SR); fade[-fo:] = np.linspace(1, 0.0, fo) ** 1.2
mix = (music * duck * 0.45 + sfx * 0.34 + vo) * fade; mix *= 0.89 / np.max(np.abs(mix))
def write(p, x):
    with wave.open(p, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1).T * 32767).astype(np.int16).tobytes())
for name, x in (('music', music * 0.9), ('sfx', sfx * 0.9), ('vo', vo), ('mix', mix)): write(os.path.join(OUT, f'{name}.wav'), x)
print('reel v2 audio', T, 's; cue words:', {s: round(word(s), 2) for s in ('location', 'developer', 'escrow', 'spa', 'save')})
