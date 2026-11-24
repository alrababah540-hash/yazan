"""Voiceover for Yas Island Ep. 1 with Kokoro-82M via sherpa-onnx 1.12.40 (offline).
usage: venv/bin/python yas-ep1/source/voice/tts.py [sid]  → yas-ep1/source/voice/<id>.wav + durations.json"""
import json, os, sys, wave
import numpy as np, sherpa_onnx
HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(HERE, '..', '..', '..', 'tools', 'tts', 'kokoro-en-v0_19')
N = json.load(open(os.path.join(HERE, 'narration.json'))); sid = int(sys.argv[1]) if len(sys.argv) > 1 else N['sid']
out = os.path.join(HERE, sys.argv[2]) if len(sys.argv) > 2 else HERE; os.makedirs(out, exist_ok=True)
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
    kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=f'{P}/model.onnx', voices=f'{P}/voices.bin', tokens=f'{P}/tokens.txt', data_dir=f'{P}/espeak-ng-data'), num_threads=2)))
dur = {}
for L in N['lines']:
    g = tts.generate(L['tts'], sid=sid, speed=L['speed']); sr = g.sample_rate
    a = (np.clip(np.array(g.samples), -1, 1) * 32767).astype(np.int16)
    env = np.convolve(np.abs(a.astype(np.float32)), np.ones(240) / 240, 'same'); idx = np.where(env > 0.012 * 32767)[0]
    pad = int(0.04 * sr); a = a[max(0, idx[0] - pad): idx[-1] + pad]
    with wave.open(os.path.join(out, L['id'] + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(a.tobytes())
    dur[L['id']] = round(len(a) / sr, 3); print(L['id'], dur[L['id']], 'ends', round(L['start'] + dur[L['id']], 2))
json.dump(dur, open(os.path.join(out, 'durations.json'), 'w'), indent=1)
