"""Render each narration line with Piper (ar_JO-kareem-medium), offline.
Speed <1 = slower (length_scale = 1/speed). Writes audio/vo/<id>.wav + durations.json"""
import json, wave, os, sys
import numpy as np
from piper import PiperVoice, SynthesisConfig
ROOT = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(ROOT, '..', 'tools', 'tts', 'vits-piper-ar_JO-kareem-medium', 'ar_JO-kareem-medium.onnx')
N = json.load(open(os.path.join(ROOT, 'narration.json')))
v = PiperVoice.load(MODEL); dur = {}
for L in N['lines']:
    out = os.path.join(ROOT, 'vo', L['id'] + '.wav')
    cfg = SynthesisConfig(length_scale=1.0 / L['speed'], noise_scale=0.6, noise_w_scale=0.7)
    with wave.open(out, 'wb') as w: v.synthesize_wav(L['tts'], w, syn_config=cfg)
    with wave.open(out) as w:
        sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), np.int16)
    env = np.convolve(np.abs(a.astype(np.float32)), np.ones(220) / 220, 'same')
    idx = np.where(env > 0.012 * 32767)[0]
    pad = int(0.04 * sr); a = a[max(0, idx[0] - pad): idx[-1] + pad]
    with wave.open(out, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(a.tobytes())
    dur[L['id']] = round(len(a) / sr, 3)
    print(L['id'], dur[L['id']])
json.dump(dur, open(os.path.join(ROOT, 'vo', 'durations.json'), 'w'), indent=1)
print('total', round(sum(dur.values()), 2))
