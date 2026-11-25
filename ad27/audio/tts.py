"""VO with Kokoro-82M (Apache-2.0) via sherpa-onnx 1.12.40. Writes audio/vo/<id>.wav + durations.json.
Each line is auto-fitted: if longer than its window, speed is raised (max 1.25) and regenerated."""
import json, os, wave, numpy as np, sherpa_onnx
ROOT = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(ROOT, '..', '..', 'tools', 'tts', 'kokoro-en-v0_19')
N = json.load(open(os.path.join(ROOT, 'narration.json')))
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
    kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=f'{P}/model.onnx', voices=f'{P}/voices.bin', tokens=f'{P}/tokens.txt', data_dir=f'{P}/espeak-ng-data'), num_threads=4)))
def gen(text, speed):
    g = tts.generate(text, sid=N['sid'], speed=speed); sr = g.sample_rate
    a = (np.clip(np.array(g.samples), -1, 1) * 32767).astype(np.int16)
    env = np.convolve(np.abs(a.astype(np.float32)), np.ones(240) / 240, 'same'); idx = np.where(env > 0.012 * 32767)[0]
    pad = int(0.03 * sr); return a[max(0, idx[0] - pad): idx[-1] + pad], sr
out = {}
for L in N['lines']:
    room = L['window'][1] - L['start']; sp = L['speed']
    a, sr = gen(L['tts'], sp)
    while len(a) / sr > room and sp < 1.2:
        sp = round(sp + 0.03, 2); a, sr = gen(L['tts'], sp)
    with wave.open(os.path.join(ROOT, 'vo', L['id'] + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(a.tobytes())
    out[L['id']] = {'dur': round(len(a) / sr, 3), 'speed': sp, 'start': L['start'], 'end': round(L['start'] + len(a) / sr, 3), 'fits': len(a) / sr <= room}
    print(L['id'], out[L['id']])
json.dump(out, open(os.path.join(ROOT, 'vo', 'durations.json'), 'w'), indent=1)
