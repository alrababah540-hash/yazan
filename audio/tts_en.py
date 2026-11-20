"""English VO with Kokoro-82M (Apache-2.0) via sherpa-onnx 1.12.x (needs the espeak frontend).
Writes audio/vo_en/<id>.wav (trimmed) + durations.json."""
import json, os, wave
import numpy as np, sherpa_onnx
ROOT = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(ROOT, '..', 'tools', 'tts', 'kokoro-en-v0_19')
import sys
TAG = sys.argv[1] if len(sys.argv) > 1 else 'en'
N = json.load(open(os.path.join(ROOT, f'narration_{TAG}.json')))
VD = 'vo_en' if TAG == 'en' else f'vo_{TAG}'
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
    kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=f'{P}/model.onnx', voices=f'{P}/voices.bin', tokens=f'{P}/tokens.txt', data_dir=f'{P}/espeak-ng-data'), num_threads=2)))
dur = {}
for L in N['lines']:
    g = tts.generate(L['tts'], sid=N['sid'], speed=L['speed']); sr = g.sample_rate
    a = (np.clip(np.array(g.samples), -1, 1) * 32767).astype(np.int16)
    env = np.convolve(np.abs(a.astype(np.float32)), np.ones(240) / 240, 'same'); idx = np.where(env > 0.012 * 32767)[0]
    pad = int(0.04 * sr); a = a[max(0, idx[0] - pad): idx[-1] + pad]
    with wave.open(os.path.join(ROOT, VD, L['id'] + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(a.tobytes())
    dur[L['id']] = round(len(a) / sr, 3); print(L['id'], dur[L['id']])
json.dump(dur, open(os.path.join(ROOT, VD, 'durations.json'), 'w'), indent=1); print('total', round(sum(dur.values()), 2))
