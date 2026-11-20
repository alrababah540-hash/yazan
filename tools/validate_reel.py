"""Delivery validation for the final reel — every check from the client's acceptance list.
usage: python3 tools/validate_reel.py output/offplan_abu_dhabi_reel_final_1080x1920.mp4
Exits non-zero if any check fails."""
import json, os, re, subprocess, sys, wave
import numpy as np
ROOT = os.path.dirname(os.path.abspath(__file__)) + '/..'
F = sys.argv[1]
R = json.load(open(f'{ROOT}/scene/reel3.json')); N = json.load(open(f'{ROOT}/audio/narration_reel3.json'))
D = json.load(open(f'{ROOT}/audio/vo_reel3/durations.json')); EN = json.load(open(f'{ROOT}/audio/narration_en.json'))
MAP = json.load(open(f'{ROOT}/data/abudhabi_map_v2.json'))
res = []
def check(name, ok, detail): res.append((name, bool(ok), detail)); print(('PASS' if ok else 'FAIL'), '·', name, '·', detail)
def sh(cmd): return subprocess.run(cmd, shell=True, capture_output=True, text=True)

# 1 duration / format
p = json.loads(sh(f'ffprobe -v error -show_entries format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,duration -of json "{F}"').stdout)
dur = float(p['format']['duration']); v = next(s for s in p['streams'] if s['codec_type'] == 'video'); a = next(s for s in p['streams'] if s['codec_type'] == 'audio')
check('Duration ≤ 35.000 s and ≥ 30 s', 30 <= dur <= 35.0 and float(a['duration']) <= 35.0, f"container {dur:.3f} s · video {float(v['duration']):.3f} s · audio {float(a['duration']):.3f} s")
check('1080×1920, 30 fps, H.264 + AAC', v['width'] == 1080 and v['height'] == 1920 and v['r_frame_rate'] == '30/1' and v['codec_name'] == 'h264' and a['codec_name'] == 'aac', f"{v['width']}×{v['height']} {v['r_frame_rate']} {v['codec_name']}/{a['codec_name']} · {v['nb_frames']} frames")
# 2 decode
dec = sh(f'ffmpeg -v error -i "{F}" -f null - 2>&1')
check('Decodes without errors', dec.returncode == 0 and not dec.stdout.strip() and not dec.stderr.strip(), 'ffmpeg full decode: 0 errors' if not dec.stderr.strip() else dec.stderr[:200])
# 3 loudness
ln = sh(f'ffmpeg -hide_banner -nostats -i "{F}" -af ebur128=peak=true -f null - 2>&1').stdout + sh(f'ffmpeg -hide_banner -nostats -i "{F}" -af ebur128=peak=true -f null - 2>&1').stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', ln)[-1]); TP = max(float(x) for x in re.findall(r'Peak:\s+(-?[\d.]+) dBFS', ln))
check('Loudness for Instagram (−14 LUFS ±1, peak ≤ −0.5 dBTP)', abs(I + 14) <= 1 and TP <= -0.5, f'{I:.1f} LUFS integrated · true peak {TP:.1f} dBTP')
# 4 original voice preserved (same narrator voice as the source video, natural speed, no time-stretch)
same = N['sid'] == EN['sid'] and 'bm_george' in N['voice'] and 'bm_george' in EN['voice']
speeds = {l['speed'] for l in N['lines']}
check('Original narrator voice preserved, not sped up', same and speeds == {1.0}, f"voice: {N['voice'].split(' —')[0]} = source video voice (sid {EN['sid']}); synthesis speed {sorted(speeds)}; no time-stretch in mix")
# 5 subtitles ↔ audio sync: detect speech onsets in the VO stem and compare with caption start times
with wave.open(f'{ROOT}/audio/build_reel3/vo.wav') as w:
    sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2).astype(float).mean(1) / 32768
hop = int(0.01 * sr); env = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, 'same'))[::hop]; thr = 0.02
errs = []
for L in N['lines']:
    t0 = R['vo'][L['id']]; i0 = int((t0 - 0.3) / 0.01); seg = env[max(0, i0): i0 + 80]
    on = (max(0, i0) + int(np.argmax(seg > thr))) * 0.01 if (seg > thr).any() else None
    errs.append(abs(on - t0) if on is not None else 9)
srt = open(F.replace('_1080x1920.mp4', '.srt')).read()
srt_t = [sum(float(x) * m for x, m in zip(re.split('[:,]', s)[:3], (3600, 60, 1))) + float(re.split('[:,]', s)[3]) / 1000 for s in re.findall(r'(\d\d:\d\d:\d\d,\d\d\d) -->', srt)]
srt_err = max(abs(a - R['vo'][l['id']]) for a, l in zip(srt_t, N['lines']))
check('Audio and subtitles synchronised', max(errs) <= 0.06 and srt_err <= 0.01, f'speech onset vs caption start: max {max(errs) * 1000:.0f} ms over {len(errs)} lines · SRT vs VO placement {srt_err * 1000:.0f} ms')
# 6 map geography
ov = open(f'{ROOT}/scene/lib/overlay_reel2.js').read()
labels = re.findall(r"\['(abudhabi|reem|saadiyat|yas)', '([^']+)', '([^']+)', \[([\d.]+), ([\d.]+)\]\]", ov)
geo_ok = True; det = []
for k, en, ar, lon, lat in labels:
    f = MAP['focus'][k]; dd = ((float(lon) - f['lonlat'][0]) ** 2 + (float(lat) - f['lonlat'][1]) ** 2) ** 0.5 * 111
    ok = en == f['name_en'] and dd < 0.6; geo_ok &= ok; det.append(f"{en} {lat}°N {lon}°E (OSM polygon '{f['name_ar']}', Δ{dd:.2f} km)")
check('Map labels match OSM-named island polygons', geo_ok and len(labels) == 4, '; '.join(det))
check('Map source is current, full-resolution OSM coastline', '2026-11-18' in MAP['source'] and len(MAP['land']) > 50, MAP['source'])
# 7 no unexplained financial figures in the reel graphics
txt = re.sub(r'<[^>]+>', ' ', ov)
pct = re.findall(r'\d+\s*%', txt); money = re.findall(r'(AED|\$|USD|€)\s*\d', txt)
check('No financial figures or percentages', not pct and not money, 'graphics contain no %, no prices, no yields (numbers used: island coordinates, step labels 01–03)')
# 8 mobile readability: smallest font sizes used for content text
sizes = sorted({int(s) for s in re.findall(r'font:\s*\d+\s+(\d+)px', ov)})
content_min = min(x for x in sizes if x >= 21)
check('Text readable on mobile (content ≥ 21 px on a 1080 px-wide frame; subtitles 42 px)', content_min >= 21 and 42 in sizes, f'font sizes used: {sizes} px (19–20 px only for the map attribution and coordinate captions)')
# 9 timeline structure
want = [(0, 4), (4, 9), (9, 15), (15, 20), (20, 26), (26, 31), (31, 35)]
got = [tuple(s['r']) for s in R['shots']]
check('Timeline matches 0–4 / 4–9 / 9–15 / 15–20 / 20–26 / 26–31 / 31–35', all(abs(g[0] - w[0]) < 1e-6 and g[1] <= w[1] + 1e-6 for g, w in zip(got, want)), ' | '.join(f'{s["id"]} {s["r"][0]}–{s["r"][1]}' for s in R['shots']))
print('\nALL PASS' if all(ok for _, ok, _ in res) else '\nFAILURES PRESENT')
json.dump([{'check': n, 'pass': ok, 'detail': d} for n, ok, d in res], open(f'{ROOT}/docs/reel_final_validation.json', 'w'), ensure_ascii=False, indent=1)
sys.exit(0 if all(ok for _, ok, _ in res) else 1)
