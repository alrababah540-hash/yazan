"""Ep.01 Yas Island — original score + SFX (NumPy synthesis), 20.000 s, 120 BPM so every scene change (3, 7, 12, 16 s) is on a beat.
Writes audio/build/{music,sfx,vo,mix}.wav (48 kHz)."""
import json, os, wave, numpy as np
ROOT = os.path.dirname(os.path.abspath(__file__)); NAR = json.load(open(os.path.join(ROOT, 'narration.json')))
SR = 48000; T = 20.0; N = int(SR * T); OUT = os.path.join(ROOT, 'build'); os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(20); ta = lambda n: np.arange(n) / SR; midi = lambda m: 440.0 * 2 ** ((m - 69) / 12)
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
music = np.zeros((2, N))
CH = [(0.0, [33, 45, 52, 57, 60, 64]), (3.0, [29, 41, 53, 57, 60, 65]), (5.0, [36, 48, 55, 60, 64, 67]), (7.0, [31, 43, 55, 59, 62, 67]),
      (9.5, [33, 45, 57, 60, 64, 69]), (12.0, [29, 41, 53, 57, 60, 64]), (14.0, [31, 43, 55, 59, 62, 66]), (16.0, [36, 48, 55, 60, 64, 67, 71]), (T, None)]
for (a, notes), (b, _) in zip(CH[:-1], CH[1:]):
    n = int((b - a + 0.5) * SR); tt = ta(n); seg = np.zeros(n)
    for k, m in enumerate(notes):
        for det in (-0.09, 0.0, 0.08):
            ph = 2 * np.pi * midi(m) * (1 + det / 100) * tt + rng.uniform(0, 6.28); seg += (np.sin(ph) + 0.3 * np.sin(2 * ph)) * (0.9 if k == 0 else 0.42)
    seg *= adsr(n, 0.15 if a > 0 else 0.01, 0.45); place(music, seg, a, gain=0.03)
music = np.vstack([filt(music[0], 40, 3000), filt(music[1], 40, 2800)])
def pluck(f, d=0.5):
    n = int(d * SR); tt = ta(n); mod = np.sin(2 * np.pi * f * 3 * tt) * 1.6 * np.exp(-tt * 12); return np.sin(2 * np.pi * f * tt + mod) * np.exp(-tt * 7) * (1 - np.exp(-tt * 900))
chord_at = lambda x: [nt for a, nt in CH[:-1] if x >= a][-1]
pat = [0, 2, 4, 3, 1, 4, 2, 3]; k = 0; x = 0.0
while x < 19.4:
    nt = chord_at(x); m = nt[1:][pat[k % 8] % (len(nt) - 1)] + 12; place(music, pluck(midi(m), 0.7), x, pan=0.35 * np.sin(k * 1.3), gain=0.028 if x < 3 else 0.034); x += BEAT / 2; k += 1
def kick():
    n = int(0.4 * SR); tt = ta(n); f = 42 + 85 * np.exp(-tt * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)
for x in np.arange(3.0, 16.0, BEAT): place(music, kick(), x, gain=0.12 if (x * 2) % 2 == 0 else 0.07)
hat = lambda: filt(rng.standard_normal(int(0.05 * SR)) * np.exp(-ta(int(0.05 * SR)) * 120), 6000, 14000, 2)
for x in np.arange(7.25, 16.0, BEAT): place(music, hat(), x, pan=0.3, gain=0.03)
n = int(4.0 * SR); tt = ta(n); st = np.zeros(n)
for m in (55, 60, 64, 67, 71, 76):
    for det in (-0.12, 0.1): st += 2 * ((midi(m) * (1 + det / 100) * tt + rng.uniform()) % 1.0) - 1
place(music, filt(st, 140, 2400) * adsr(n, 0.5, 0.6), 16.0, gain=0.02)
place(music, np.sin(2 * np.pi * midi(21) * ta(int(3.0 * SR))) * adsr(int(3.0 * SR), 0.005, 0.9), 0, gain=0.15)
music = reverb(music, 2.4, 0.28, 3)
sfx = np.zeros((2, N))
def whoosh(d, hi=5000):
    n = int(d * SR); e = np.sin(np.pi * np.linspace(0, 1, n)) ** 2; return filt(rng.standard_normal(n), 300, hi, 2) * e * np.linspace(0.4, 1, n)
def impact(g=1.0):
    n = int(1.6 * SR); tt = ta(n); f = 30 + 55 * np.exp(-tt * 12)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.8) + filt(rng.standard_normal(n), 80, 1000) * np.exp(-tt * 8) * 0.4) * g
def tick(f=2400):
    n = int(0.07 * SR); tt = ta(n); return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 80) + filt(rng.standard_normal(n), 1500, 9000) * np.exp(-tt * 400) * 0.6
def riser(d):
    n = int(d * SR); tt = ta(n); return filt(rng.standard_normal(n), 600, 9000, 1) * (tt / d) ** 2 * 0.5 + np.sin(2 * np.pi * np.cumsum(220 + 1200 * (tt / d) ** 2) / SR) * (tt / d) ** 3 * 0.25
place(sfx, whoosh(1.0, 3500), -0.1, gain=0.25); place(sfx, impact(0.9), 0.3, gain=0.4)            # hook: zoom + hit on the number
for c in (3.0, 7.0, 12.0, 16.0): place(sfx, whoosh(0.5, 6000), c - 0.35, gain=0.22); place(sfx, impact(0.6), c, gain=0.3)
for c in (4.0, 5.0, 6.0, 8.7, 10.4, 13.45, 14.75): place(sfx, whoosh(0.35, 7000), c - 0.2, gain=0.14)
for i, c in enumerate((12.15, 12.25, 12.35, 12.45, 12.6)): place(sfx, tick(2200 + 150 * i), c, pan=-0.4 + 0.2 * i, gain=0.1)
place(sfx, impact(0.5), 7.15, gain=0.22); place(sfx, riser(0.9), 11.1, gain=0.18); place(sfx, riser(0.9), 15.1, gain=0.18)
sfx = reverb(sfx, 1.2, 0.16, 5)
import subprocess   # client ElevenLabs VO, placed per audio/vo_user_edit.json
ED = json.load(open(os.path.join(ROOT, 'vo_user_edit.json')))
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(ROOT, '..', ED['source']), '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
SRC = np.frombuffer(raw, np.int16).astype(float) / 32768
vo = np.zeros((2, N)); env = np.zeros(N)
for c in ED['clips']:
    i0, i1 = int(max(0, c['src'][0] - 0.03) * SR), int((c['src'][1] + 0.05) * SR); a = SRC[i0:i1].copy()
    f = int(0.02 * SR); a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f)
    place(vo, a, max(0, c['at'] - 0.03)); j = int(c['at'] * SR); env[j:j + len(a)] = 1
vo = np.vstack([filt(vo[0], 80, 14000, 2), filt(vo[1], 80, 14000, 2)]); vo = vo / np.max(np.abs(vo)) * 0.75
vo = reverb(vo, 0.4, 0.05, 9)
k = int(0.25 * SR); cs = np.concatenate([[0.0], np.cumsum(env)]); idx = np.arange(N)
duck = 1 - 0.55 * (cs[np.clip(idx + k // 2, 0, N)] - cs[np.clip(idx - k // 2, 0, N)]) / k
music *= 0.9 / np.max(np.abs(music)); sfx *= 0.9 / np.max(np.abs(sfx))
fade = np.ones(N); fo = int(0.5 * SR); fade[-fo:] = np.linspace(1, 0, fo) ** 1.5
mix = (music * duck * 0.5 + sfx * 0.36 + vo) * fade; mix *= 0.89 / np.max(np.abs(mix))
def write(p, x):
    with wave.open(p, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1).T * 32767).astype(np.int16).tobytes())
for name, x in (('music', music * 0.9), ('sfx', sfx * 0.9), ('vo', vo), ('mix', mix)): write(os.path.join(OUT, f'{name}.wav'), x)
print('audio', N / SR, 's')
