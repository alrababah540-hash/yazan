"""VO intelligibility QA: transcribe each rendered line with Whisper (sherpa-onnx, offline)
and report character-level similarity against the script (diacritics/punctuation stripped)."""
import sys, json, os, wave, re, difflib
import numpy as np, sherpa_onnx
M = sys.argv[1]; ROOT = os.path.dirname(os.path.abspath(__file__)) + '/../audio'
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{M}/small-encoder.int8.onnx', decoder=f'{M}/small-decoder.int8.onnx',
                                                 tokens=f'{M}/small-tokens.txt', language='ar', task='transcribe', num_threads=4)
def norm(s):
    s = re.sub(r'[ً-ْـ]', '', s)          # tashkeel, tatweel
    s = re.sub(r'[أإآ]', 'ا', s).replace('ة', 'ه').replace('ى', 'ي')
    return re.sub(r'[^ء-ي ]', ' ', s).split()
N = json.load(open(f'{ROOT}/narration.json')); out = []
for L in N['lines']:
    with wave.open(f"{ROOT}/vo/{L['id']}.wav") as w:
        sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    s = rec.create_stream(); s.accept_waveform(sr, a); rec.decode_stream(s)
    hyp = s.result.text.strip(); ref = ' '.join(norm(L['text'])); h = ' '.join(norm(hyp))
    sim = difflib.SequenceMatcher(None, ref, h).ratio()
    out.append({'id': L['id'], 'similarity': round(sim, 3), 'asr': hyp}); print(L['id'], round(sim, 3), '|', hyp)
json.dump(out, open(f'{ROOT}/vo/asr_check.json', 'w'), ensure_ascii=False, indent=1)
print('mean', round(sum(o['similarity'] for o in out) / len(out), 3))
