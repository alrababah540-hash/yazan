"""Intelligibility QC: transcribe every VO clip with Whisper tiny.en (sherpa-onnx) and compare with the script."""
import json, os, wave, numpy as np, sherpa_onnx, re
R = os.path.dirname(os.path.abspath(__file__)); M = os.path.join(R, '..', '..', 'tools', 'tts', 'sherpa-onnx-whisper-tiny.en')
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{M}/tiny.en-encoder.onnx', decoder=f'{M}/tiny.en-decoder.onnx', tokens=f'{M}/tiny.en-tokens.txt', num_threads=4)
N = json.load(open(os.path.join(R, '..', 'audio', 'narration.json'))); out = []
for L in N['lines']:
    with wave.open(os.path.join(R, '..', 'audio', 'vo', L['id'] + '.wav')) as w: sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    a = np.concatenate([np.zeros(sr // 4, np.float32), a, np.zeros(sr // 4, np.float32)])
    s = rec.create_stream(); s.accept_waveform(sr, a); rec.decode_stream(s); txt = s.result.text.strip()
    out.append({'id': L['id'], 'script': L['text'], 'asr': txt}); print(f"{L['id']:6s} | {L['text']:70s} | {txt}")
json.dump(out, open(os.path.join(R, '..', 'docs', 'asr_check.json'), 'w'), indent=1)
