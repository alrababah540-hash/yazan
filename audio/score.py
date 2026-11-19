"""Original procedural score + sound design, synthesised from scratch with NumPy.
No samples, no third-party audio -> fully owned, license-clean.

Arc (matches the film's emotional progression):
  S1 curiosity   : low drone, glassy rising shimmer, impact on the tower reveal
  S2-S4 clarity  : warm pad progression + soft plucked arpeggio
  S5-S6 confidence: pulse + fuller pad, gentle orchestral swell
  S7 caution     : harmony darkens, filtered ticking pulse
  S8 decision    : resolves to a warm major chord, strings swell, clean tail

Outputs: audio/build/music.wav, audio/build/sfx.wav, audio/build/vo.wav (placed), audio/build/mix.wav
"""
import json, os, wave
import numpy as np

ROOT = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(ROOT, '..', 'scene', 'timeline.json')))
SR = 48000
DUR = TL['duration']
N = int(SR * DUR)
OUT = os.path.join(ROOT, 'build'); os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)
S = TL['scenes']

def t_axis(n): return np.arange(n) / SR

def env_adsr(n, a, d, s, r):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n); e[:na] = np.linspace(0, 1, na) if na else e[:na]
    if nd: e[na:na + nd] = np.linspace(1, s, len(e[na:na + nd]))
    if nr: e[-nr:] *= np.linspace(1, 0, len(e[-nr:]))
    return e

def lp1(x, fc):
    """One-pole low-pass, fc may be scalar or array (time-varying)."""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):  # small loops only (short events); long beds use FFT filter below
        acc = (1 - a[i]) * x[i] + a[i] * acc; y[i] = acc
    return y

def fft_filter(x, lo=None, hi=None, slope=4):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); g = np.ones_like(f)
    if hi: g *= 1 / np.sqrt(1 + (f / hi) ** (2 * slope))
    if lo: g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * slope))
    return np.fft.irfft(X * g, len(x))

def place(buf, sig, t0, pan=0.0, gain=1.0):
    i = int(t0 * SR)
    if i >= buf.shape[1]: return
    sig = sig[: buf.shape[1] - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(sig)] += sig * l * 1.414
    buf[1, i:i + len(sig)] += sig * r * 1.414

def reverb(x, decay=2.8, mix=0.3, seed=1):
    """Stereo convolution reverb with a synthetic exponentially-decaying noise IR."""
    r = np.random.default_rng(seed); n = int(decay * SR)
    out = np.zeros((2, x.shape[1] + n))
    for ch in range(2):
        ir = r.standard_normal(n) * np.exp(-6.9 * np.arange(n) / n)
        ir = fft_filter(ir, lo=180, hi=7000, slope=1); ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        ir /= np.sqrt(np.sum(ir ** 2))
        L = 1 << int(np.ceil(np.log2(x.shape[1] + n)))
        out[ch] = np.fft.irfft(np.fft.rfft(x[ch], L) * np.fft.rfft(ir, L), L)[: x.shape[1] + n]
    return x * (1 - mix) + out[:, : x.shape[1]] * mix

def midi(m): return 440.0 * 2 ** ((m - 69) / 12)

# ---------------------------------------------------------------- MUSIC
music = np.zeros((2, N))
t = t_axis(N)

# chord plan (MIDI notes) with times — D minor colour → F major resolution
CH = [
    (0.0,  [38, 50, 57, 62, 64]),        # Dm(add9)  curiosity
    (6.5,  [34, 50, 57, 62, 65]),        # Bbmaj7    "what is off-plan"
    (12.0, [41, 53, 57, 60, 64]),        # Fmaj7
    (17.3, [36, 52, 55, 60, 62]),        # C(add9)   Abu Dhabi
    (25.6, [38, 50, 57, 62, 64]),        # Dm9       choosing
    (30.0, [34, 50, 53, 58, 62]),        # Bb
    (34.2, [41, 53, 57, 60, 67]),        # F(add9)   payment plan
    (38.6, [36, 52, 55, 60, 64]),        # C
    (43.0, [34, 50, 57, 62, 65]),        # Bbmaj7    why off-plan
    (47.6, [41, 53, 60, 64, 69]),        # F
    (52.2, [38, 50, 53, 57, 62]),        # Dm        risks
    (58.5, [33, 49, 52, 57, 61]),        # A (V)     tension
    (66.0, [41, 53, 57, 60, 64, 69]),    # Fmaj9     resolution / decision
    (DUR, None),
]

def pad_voice(f, n, bright):
    tt = t_axis(n); s = np.zeros(n)
    for det in (-0.07, 0.0, 0.06):            # detuned stack
        ph = 2 * np.pi * f * (1 + det / 100) * tt + rng.uniform(0, 6.28)
        s += np.sin(ph) + 0.35 * np.sin(2 * ph) * bright + 0.15 * np.sin(3 * ph) * bright
    return s / 3

for (t0, notes), (t1, _) in zip(CH[:-1], CH[1:]):
    n = int((t1 - t0 + 1.6) * SR)
    bright = 0.4 if t0 < 52 else (0.25 if t0 < 66 else 0.7)
    seg = np.zeros(n)
    for k, m in enumerate(notes):
        seg += pad_voice(midi(m), n, bright) * (0.9 if k == 0 else 0.55)
    seg *= env_adsr(n, 1.4, 0.5, 0.85, 1.6)
    gain = 0.055 if t0 < 6.5 else 0.07
    if 34 <= t0 < 52: gain = 0.08
    if 52.2 <= t0 < 66: gain = 0.06
    if t0 >= 66: gain = 0.085
    place(music, seg, t0 - 0.3 if t0 > 0 else 0, pan=0, gain=gain)
music = np.vstack([fft_filter(music[0], hi=2600, lo=40), fft_filter(music[1], hi=2400, lo=40)])

# sub drone through S1 (curiosity)
dr = np.sin(2 * np.pi * midi(26) * t[: int(7.5 * SR)]) * env_adsr(int(7.5 * SR), 2.0, 0.1, 1, 2.5)
place(music, dr, 0, gain=0.12)

# plucked "glass marimba" arpeggio (FM bell) — understanding/clarity sections
def pluck(f, dur=0.9, bright=1.0):
    n = int(dur * SR); tt = t_axis(n)
    mod = np.sin(2 * np.pi * f * 3.5 * tt) * 2.2 * bright * np.exp(-tt * 9)
    return np.sin(2 * np.pi * f * tt + mod) * np.exp(-tt * 4.5) * (1 - np.exp(-tt * 900))

BPM = 96; BEAT = 60 / BPM
def chord_at(tt):
    cur = CH[0][1]
    for t0, nt in CH[:-1]:
        if tt >= t0: cur = nt
    return cur
pattern = [0, 2, 1, 3, 2, 4, 3, 1]
for sec, lev in (("s2", 0.5), ("s3", 0.7), ("s4", 0.8), ("s5", 0.9), ("s6", 1.0), ("s7", 0.45)):
    a, b = S[sec]
    k = 0; tt = a + (0.3 if sec == "s2" else 0)
    while tt < b - 0.1:
        notes = chord_at(tt); m = notes[1:][pattern[k % 8] % (len(notes) - 1)] + 12
        sig = pluck(midi(m), 1.0, 0.7 if sec != "s7" else 0.4)
        place(music, sig, tt, pan=0.35 * np.sin(k * 1.3), gain=0.05 * lev)
        tt += BEAT / 2; k += 1

# soft pulse (felt kick) for confidence sections
def kick():
    n = int(0.45 * SR); tt = t_axis(n)
    f = 38 + 60 * np.exp(-tt * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 8)
for sec, lev in (("s5", 0.8), ("s6", 1.0), ("s7", 0.55)):
    a, b = S[sec]; tt = a + 0.2
    while tt < b - 0.2:
        place(music, kick(), tt, gain=0.16 * lev); tt += BEAT

# caution: filtered ticking (clock-like) in S7
a, b = S['s7']; tt = a + 0.1
while tt < b - 0.5:
    n = int(0.03 * SR); tick = rng.standard_normal(n) * np.exp(-t_axis(n) * 220)
    tick = fft_filter(tick, lo=2500, hi=6000, slope=2)
    place(music, tick, tt, pan=0.4 if int((tt - a) / BEAT) % 2 else -0.4, gain=0.12); tt += BEAT

# strings swell for the resolution (S8) — slow-attack saw ensemble, low-passed
a, b = S['s8']; n = int((b - a + 0.5) * SR); tt = t_axis(n); st = np.zeros(n)
for m in (53, 57, 60, 64, 69, 72):
    for det in (-0.12, 0.1):
        ph = (midi(m) * (1 + det / 100) * tt + rng.uniform()) % 1.0
        st += (2 * ph - 1) * (1 + 0.003 * np.sin(2 * np.pi * 5.2 * tt))
st = fft_filter(st, hi=1800, lo=120) * env_adsr(n, 3.0, 0.5, 1.0, 3.5)
place(music, st, a, gain=0.022)

music = reverb(music, decay=3.2, mix=0.32, seed=3)

# ---------------------------------------------------------------- SFX (cue-synced)
sfx = np.zeros((2, N))
def whoosh(dur=1.2, up=True, hi=4000):
    n = int(dur * SR); x = rng.standard_normal(n)
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    lo_band = fft_filter(x, lo=300, hi=hi, slope=2)
    sweep = np.linspace(0.2, 1.0, n) if up else np.linspace(1.0, 0.2, n)
    return lo_band * e * (0.6 + 0.4 * sweep)
def impact(depth=1.0):
    n = int(2.2 * SR); tt = t_axis(n)
    f = 32 + 45 * np.exp(-tt * 12)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.2)
    air = fft_filter(rng.standard_normal(n), lo=80, hi=900) * np.exp(-tt * 6) * 0.4
    return (body + air) * depth
def click(f=2400, dur=0.06, ring=1.0):
    n = int(dur * SR); tt = t_axis(n)
    return (np.sin(2 * np.pi * f * tt) * np.exp(-tt * 90) * ring + fft_filter(rng.standard_normal(n), lo=1500, hi=9000) * np.exp(-tt * 400))
def thunk(f=140):
    n = int(0.35 * SR); tt = t_axis(n)
    return np.sin(2 * np.pi * f * tt * (1 - 0.3 * tt)) * np.exp(-tt * 18) + fft_filter(rng.standard_normal(n), lo=200, hi=2000) * np.exp(-tt * 60) * 0.5
def shimmer(dur=1.6):
    n = int(dur * SR); tt = t_axis(n); s = np.zeros(n)
    for k, m in enumerate((81, 84, 88, 91, 93)):
        s += np.sin(2 * np.pi * midi(m) * tt) * np.exp(-np.maximum(tt - k * 0.07, 0) * 3) * (tt > k * 0.07)
    return s * 0.3
def riser(dur=2.0):
    n = int(dur * SR); tt = t_axis(n)
    x = fft_filter(rng.standard_normal(n), lo=600, hi=8000, slope=1) * (tt / dur) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(200 + 900 * (tt / dur) ** 2) / SR) * (tt / dur) ** 3 * 0.3
    return x * 0.5 + tone
def paper(dur=0.7):
    n = int(dur * SR); x = fft_filter(rng.standard_normal(n), lo=1200, hi=7000)
    return x * np.sin(np.pi * np.linspace(0, 1, n)) ** 3

# S1 — construction assembly: thunks as columns/slabs land, clicks as facade locks in
place(sfx, riser(1.2), 0.0, gain=0.25)
place(sfx, impact(0.6), 0.55, gain=0.5)                      # blueprint ignites
for i in range(12):
    tt = 1.25 + i * 0.22; place(sfx, thunk(120 + (i % 3) * 15), tt, pan=(i % 5 - 2) * 0.15, gain=0.32)
for i in range(14):
    tt = 2.8 + i * 0.17; place(sfx, click(2000 + 120 * (i % 4)), tt, pan=np.sin(i) * 0.5, gain=0.12)
place(sfx, shimmer(), 5.0, gain=0.4)                          # crown completes
place(sfx, impact(1.0), 5.2, gain=0.55)
place(sfx, whoosh(1.4, True), 5.9, gain=0.5)                  # fly-through glass
# S2
place(sfx, whoosh(0.9, False, 2500), 7.2, gain=0.25)
place(sfx, shimmer(1.2), 9.0, gain=0.35)                      # unit turns gold
place(sfx, paper(0.6), 11.0, gain=0.35)                       # plan panel unfolds
place(sfx, whoosh(1.6, True), 15.6, gain=0.4)                 # shrink to miniature
# S3
place(sfx, thunk(90), 17.9, gain=0.5); place(sfx, impact(0.5), 17.9, gain=0.35)  # miniature lands
for k, tt in enumerate((19.05, 19.2, 19.35)):                 # pins rise
    place(sfx, click(1800, 0.08, 1.4), tt, pan=(0.4, -0.2, -0.4)[k], gain=0.2)
for k, tt in enumerate((21.3, 23.0, 24.2)):                    # labels reveal
    place(sfx, shimmer(0.8), tt, pan=(0.3, -0.1, -0.3)[k], gain=0.18)
place(sfx, whoosh(1.2, True, 3000), 24.6, gain=0.35)
# S4
for i in range(8): place(sfx, thunk(110 + i * 6), 26.0 + i * 0.12, gain=0.18)
place(sfx, whoosh(1.2, True, 2500), 28.3, gain=0.35)          # floors separate
place(sfx, click(1500, 0.1, 1.5), 29.0, gain=0.3)             # floor highlight
place(sfx, whoosh(0.8, False, 3500), 29.8, gain=0.3)          # unit detaches
place(sfx, paper(0.7), 33.2, gain=0.3)
# S5 — milestones snap into place
place(sfx, paper(0.6), 34.6, gain=0.3)                        # unit flattens into plan
for tt in (35.75, 40.35): place(sfx, thunk(160), tt, gain=0.35); place(sfx, click(2600, 0.06), tt + 0.02, gain=0.18)
for i in range(5): place(sfx, thunk(190 + i * 12), 37.35 + i * 0.4, gain=0.18); place(sfx, click(2200, 0.05), 37.37 + i * 0.4, gain=0.1)
place(sfx, whoosh(1.4, True), 41.8, gain=0.4)                 # rail swings up → crane cable
# S6 — match cuts
for tt in (43.05, 46.6, 48.6): place(sfx, whoosh(0.7, True, 5000), tt - 0.35, gain=0.3); place(sfx, impact(0.35), tt, gain=0.35)
# S7 — rewind, delay shift, document
place(sfx, riser(1.0)[::-1], 52.3, gain=0.3)                   # reverse build
place(sfx, thunk(70), 55.5, gain=0.35); place(sfx, whoosh(1.1, False, 1800), 55.5, gain=0.2)  # handover marker slips
place(sfx, paper(0.9), 58.3, gain=0.45)                       # contract appears
for tt in (59.6, 60.6, 62.3, 63.4): place(sfx, click(2900, 0.08, 1.6), tt, gain=0.3)
# S8
place(sfx, whoosh(2.0, False, 2000), 66.2, gain=0.3)
place(sfx, impact(0.7), 69.8, gain=0.4)                       # model revealed on stone
place(sfx, shimmer(2.0), 72.1, gain=0.25)                     # 'اختار بوعي'
sfx = reverb(sfx, decay=1.6, mix=0.18, seed=5)

# ---------------------------------------------------------------- VO placement
def read_wav(p):
    with wave.open(p) as w:
        sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
    # resample to 48k (linear-phase via FFT)
    n2 = int(len(a) * SR / sr)
    return np.fft.irfft(np.fft.rfft(a), n2 * 1)[:n2] if False else np.interp(np.linspace(0, len(a) - 1, n2), np.arange(len(a)), a)

vo = np.zeros((2, N)); vo_env = np.zeros(N)
for sid, t0 in TL['vo'].items():
    a = read_wav(os.path.join(ROOT, 'vo', sid + '.wav'))
    a = fft_filter(a, lo=85, hi=11000, slope=2)          # clean rumble & hiss
    # gentle presence lift (~3 kHz) for intelligibility on phone speakers
    a = a + 0.25 * fft_filter(a, lo=2200, hi=5000, slope=2)
    a = a / (np.max(np.abs(a)) + 1e-9) * 0.7
    place(vo, a, t0, gain=1.0)
    i = int(t0 * SR); vo_env[i:i + len(a)] = 1
vo = reverb(vo, decay=0.6, mix=0.06, seed=9)               # small room, keeps it natural

# sidechain duck: music −8 dB under VO with smooth 250 ms ramps
k = int(0.25 * SR); kern = np.ones(k) / k
duck = 1 - 0.6 * np.convolve(vo_env, kern, 'same')

def write(p, x):
    x = np.clip(x, -1, 1)
    with wave.open(p, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x.T * 32767).astype(np.int16).tobytes())

music *= 0.9 / (np.max(np.abs(music)) + 1e-9)
sfx *= 0.9 / (np.max(np.abs(sfx)) + 1e-9)
# fade in/out
fade = np.ones(N); fade[: int(0.05 * SR)] = np.linspace(0, 1, int(0.05 * SR)); fo = int(2.5 * SR); fade[-fo:] = np.linspace(1, 0, fo) ** 1.5
mix = (music * duck * 0.42 + sfx * 0.32 + vo * 1.0) * fade
mix *= 0.89 / np.max(np.abs(mix))
write(os.path.join(OUT, 'music.wav'), music * 0.9); write(os.path.join(OUT, 'sfx.wav'), sfx * 0.9)
write(os.path.join(OUT, 'vo.wav'), vo); write(os.path.join(OUT, 'mix.wav'), mix)
print('wrote', OUT, 'duration', DUR)
