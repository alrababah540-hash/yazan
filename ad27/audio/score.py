"""Original score + sound design for the 27.000 s film (NumPy synthesis, no third-party samples).
120 BPM: every scene boundary (4, 8, 16, 23 s) and the end-card (25.5 s) falls on a beat.
Writes ad27/audio/build/{music,sfx,vo,mix}.wav at 48 kHz, exactly 27.000 s."""
import json, os, wave, numpy as np
ROOT = os.path.dirname(os.path.abspath(__file__))
NAR = json.load(open(os.path.join(ROOT, 'narration.json'))); DUR = json.load(open(os.path.join(ROOT, 'vo', 'durations.json')))
SR = 48000; T = 27.0; N = int(SR * T); OUT = os.path.join(ROOT, 'build'); os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(27); ta = lambda n: np.arange(n) / SR; midi = lambda m: 440.0 * 2 ** ((m - 69) / 12)
def filt(x, lo=None, hi=None, slope=4):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); g = np.ones_like(f)
    if hi: g *= 1 / np.sqrt(1 + (f / hi) ** (2 * slope))
    if lo: g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * slope))
    return np.fft.irfft(X * g, len(x))
def adsr(n, a, r):
    e = np.ones(n); na, nr = min(int(a * SR), n), min(int(r * SR), n); e[:na] = np.linspace(0, 1, na); e[n - nr:] *= np.linspace(1, 0, nr); return e
def place(buf, sig, t0, pan=0.0, gain=1.0):
    i = int(max(0, t0) * SR)
    if i >= buf.shape[1]: return
    sig = sig[: buf.shape[1] - i] * gain
    buf[0, i:i + len(sig)] += sig * np.cos((pan + 1) * np.pi / 4) * 1.414; buf[1, i:i + len(sig)] += sig * np.sin((pan + 1) * np.pi / 4) * 1.414
def reverb(x, decay, mix, seed):
    r = np.random.default_rng(seed); n = int(decay * SR); out = np.zeros_like(x)
    for ch in range(2):
        ir = r.standard_normal(n) * np.exp(-6.9 * np.arange(n) / n); ir = filt(ir, 180, 7000, 1); ir /= np.sqrt((ir ** 2).sum())
        L = 1 << int(np.ceil(np.log2(x.shape[1] + n))); out[ch] = np.fft.irfft(np.fft.rfft(x[ch], L) * np.fft.rfft(ir, L), L)[: x.shape[1]]
    return x * (1 - mix) + out * mix
BEAT = 0.5
# ---------------- MUSIC: D minor → Bb → F → C → (stats) Dm/Bb/F/C faster pulse → resolve on F major
music = np.zeros((2, N))
CH = [(0.0, [38, 50, 57, 62, 65]), (4.0, [34, 50, 58, 62, 65]), (8.0, [41, 53, 57, 60, 65]), (12.0, [36, 52, 55, 60, 64]),
      (16.0, [38, 50, 57, 62, 65]), (18.0, [34, 50, 58, 62, 65]), (20.0, [41, 53, 57, 60, 65]), (22.0, [36, 52, 55, 60, 67]),
      (23.0, [34, 50, 57, 62, 65]), (25.5, [41, 53, 57, 60, 64, 69]), (T, None)]
for (a, notes), (b, _) in zip(CH[:-1], CH[1:]):
    n = int((b - a + 0.6) * SR); tt = ta(n); seg = np.zeros(n)
    for k, m in enumerate(notes):
        for det in (-0.09, 0.0, 0.08):
            ph = 2 * np.pi * midi(m) * (1 + det / 100) * tt + rng.uniform(0, 6.28); seg += (np.sin(ph) + 0.28 * np.sin(2 * ph)) * (0.9 if k == 0 else 0.45)
    seg *= adsr(n, 0.25 if a > 0 else 0.02, 0.6); place(music, seg, a, gain=0.03)
music = np.vstack([filt(music[0], 40, 2800), filt(music[1], 40, 2600)])
def pluck(f, d=0.6):
    n = int(d * SR); tt = ta(n); mod = np.sin(2 * np.pi * f * 3 * tt) * 1.8 * np.exp(-tt * 12); return np.sin(2 * np.pi * f * tt + mod) * np.exp(-tt * 6) * (1 - np.exp(-tt * 900))
chord_at = lambda x: [nt for a, nt in CH[:-1] if x >= a][-1]
pat = [0, 2, 1, 3, 2, 4, 3, 1]; k = 0; x = 0.0
while x < 25.4:
    step = BEAT / 2 if x >= 8 else BEAT; nt = chord_at(x); m = nt[1:][pat[k % 8] % (len(nt) - 1)] + 12
    place(music, pluck(midi(m), 0.9), x, pan=0.35 * np.sin(k * 1.3), gain=0.03 if x < 16 else 0.036); x += step; k += 1
def kick():
    n = int(0.4 * SR); tt = ta(n); f = 42 + 80 * np.exp(-tt * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)
for x in np.arange(8.0, 23.0, BEAT * (2 if x < 16 else 1) if False else BEAT * 2): place(music, kick(), x, gain=0.11)
for x in np.arange(16.0, 23.0, BEAT * 2): place(music, kick(), x + BEAT, gain=0.07)      # double-time feel in the data section
hat = lambda: filt(rng.standard_normal(int(0.05 * SR)) * np.exp(-ta(int(0.05 * SR)) * 120), 6000, 14000, 2)
for x in np.arange(16.25, 23.0, BEAT): place(music, hat(), x, pan=0.3, gain=0.035)
n = int((T - 25.5) * SR); tt = ta(n); st = np.zeros(n)                                     # strings resolve on the end card
for m in (53, 57, 60, 64, 69, 72):
    for det in (-0.12, 0.1): st += 2 * ((midi(m) * (1 + det / 100) * tt + rng.uniform()) % 1.0) - 1
place(music, filt(st, 120, 2200) * adsr(n, 0.4, 0.5), 25.5, gain=0.02)
place(music, np.sin(2 * np.pi * midi(26) * ta(int(3.6 * SR))) * adsr(int(3.6 * SR), 0.01, 1.0), 0, gain=0.12)
music = reverb(music, 2.6, 0.3, 3)
# ---------------- SFX
sfx = np.zeros((2, N))
def whoosh(d, hi=4000):
    n = int(d * SR); e = np.sin(np.pi * np.linspace(0, 1, n)) ** 2; return filt(rng.standard_normal(n), 250, hi, 2) * e
def impact(g=1.0):
    n = int(1.6 * SR); tt = ta(n); f = 30 + 50 * np.exp(-tt * 12)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.8) + filt(rng.standard_normal(n), 80, 900) * np.exp(-tt * 8) * 0.35) * g
def tick(f=2200):
    n = int(0.07 * SR); tt = ta(n); return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 80) + filt(rng.standard_normal(n), 1500, 9000) * np.exp(-tt * 400) * 0.6
def shimmer(d=0.9):
    n = int(d * SR); tt = ta(n); s = np.zeros(n)
    for k, m in enumerate((81, 84, 88, 91)): s += np.sin(2 * np.pi * midi(m) * tt) * np.exp(-np.maximum(tt - k * 0.04, 0) * 4) * (tt > k * 0.04)
    return s * 0.3
def riser(d):
    n = int(d * SR); tt = ta(n); return filt(rng.standard_normal(n), 600, 9000, 1) * (tt / d) ** 2 * 0.5 + np.sin(2 * np.pi * np.cumsum(200 + 1100 * (tt / d) ** 2) / SR) * (tt / d) ** 3 * 0.25
place(sfx, impact(0.6), 0.0, gain=0.35)
for i in range(7): place(sfx, tick(1500 + 120 * i), 1.45 + i * 0.34 + 0.05, pan=-0.5 + i * 0.16, gain=0.12)      # emirates reveal
place(sfx, whoosh(3.2, 3000), 3.9, gain=0.22); place(sfx, impact(0.5), 4.0, gain=0.3)                            # zoom to Abu Dhabi
place(sfx, impact(0.45), 8.0, gain=0.28)
for i in range(7): place(sfx, tick(2400), 8.0 + i, pan=-0.3 + 0.1 * i, gain=0.16); place(sfx, shimmer(0.8), 8.05 + i, gain=0.08)   # island pins
place(sfx, shimmer(1.2), 15.0, gain=0.14)
place(sfx, riser(1.0), 15.0, gain=0.2); place(sfx, impact(0.9), 16.0, gain=0.36)                                  # into data
for i, x in enumerate([16.55, 17.0, 17.0, 17.3, 17.6] + [19.7 + k * 0.12 for k in range(7)] + [20.75, 20.9, 21.05, 21.2]): place(sfx, tick(2800 + (i % 4) * 150), x, pan=0.2 * ((i % 5) - 2), gain=0.08)
place(sfx, whoosh(0.6, 5000), 19.3, gain=0.14)
place(sfx, riser(0.9), 22.1, gain=0.2); place(sfx, impact(0.9), 23.0, gain=0.38); place(sfx, whoosh(2.4, 2500), 23.1, gain=0.16)
place(sfx, impact(0.5), 25.5, gain=0.26); place(sfx, shimmer(1.4), 25.5, gain=0.16)
sfx = reverb(sfx, 1.3, 0.18, 5)
# ---------------- VO + ducking + mix
vo = np.zeros((2, N)); env = np.zeros(N)
for L in NAR['lines']:
    with wave.open(os.path.join(ROOT, 'vo', L['id'] + '.wav')) as w:
        sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
    a = np.interp(np.linspace(0, len(a) - 1, int(len(a) * SR / sr)), np.arange(len(a)), a)
    a = filt(a, 85, 12000, 2); a = a + 0.2 * filt(a, 2200, 5000, 2); a = a / np.max(np.abs(a)) * 0.72
    place(vo, a, L['start']); i = int(L['start'] * SR); env[i:i + len(a)] = 1
vo = reverb(vo, 0.45, 0.05, 9)
k = int(0.25 * SR); cs = np.concatenate([[0.0], np.cumsum(env)]); idx = np.arange(N)
duck = 1 - 0.55 * (cs[np.clip(idx + k // 2, 0, N)] - cs[np.clip(idx - k // 2, 0, N)]) / k
music *= 0.9 / np.max(np.abs(music)); sfx *= 0.9 / np.max(np.abs(sfx))
fade = np.ones(N); fo = int(0.6 * SR); fade[-fo:] = np.linspace(1, 0.0, fo) ** 1.5; fade[:int(0.01 * SR)] = np.linspace(0, 1, int(0.01 * SR))
mix = (music * duck * 0.5 + sfx * 0.36 + vo) * fade; mix *= 0.89 / np.max(np.abs(mix))
def write(p, x):
    with wave.open(p, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1).T * 32767).astype(np.int16).tobytes())
for name, x in (('music', music * 0.9), ('sfx', sfx * 0.9), ('vo', vo), ('mix', mix)): write(os.path.join(OUT, f'{name}.wav'), x)
print('audio', N / SR, 's')
