# ما هو العقار على المخطط (أوف بلان) في أبوظبي؟ — 3D motion film

A vertical (1080×1920, 30 fps, 76 s) Arabic film that explains off-plan property buying in Abu Dhabi. It runs as one continuous procedural 3D world: empty plot → blueprint → tower → selected apartment → payment timeline → completed building → model on stone.

**Final videos:**
- Arabic: `output/offplan_abu_dhabi_ar_1080x1920.mp4`
- **35-second Instagram Reel (English):** `output/offplan_abu_dhabi_reel_35s_1080x1920.mp4` + captions `output/offplan_abu_dhabi_reel_35s.srt` (see `docs/reel_edit_plan.md`; rebuild: `node render/render.js --reel 1` → `python3 audio/score_reel.py` → `bash render/build_reel.sh`)
- English: `output/offplan_abu_dhabi_en_1080x1920.mp4` (same visuals; English VO, text, captions, plan labels and contract; left-to-right layout)

| Doc | Contents |
|---|---|
| `docs/narration_script.md` | Arabic VO with timings, on-screen text, accuracy/compliance notes |
| `docs/storyboard.md` | Scene-by-scene shot list, transitions, audio cue sheet |
| `docs/stills/` | Frame grabs from the rendered film (visual storyboard) |
| `docs/licenses.md` | Every asset, its source, license and status |
| `docs/render_report.md` | Tool audit, pipeline choices, validation results, known limitations |

## Pipeline (why this stack)

The production environment has **no GPU and no Blender**, and only package registries on the network. So:

| Stage | Tool |
|---|---|
| 3D scene, animation, camera | **three.js 0.170** (PBR materials, PMREM image-based lighting, PCF soft shadows, MSAA, bokeh DOF, bloom, film grade) |
| Rendering | Headless **Chromium + Playwright**, WebGL2 on SwiftShader (CPU). `renderAt(t)` is a pure function of time, so frames are deterministic |
| Typography | HTML/CSS overlay in the same page: native Arabic shaping and RTL, IBM Plex Sans Arabic |
| Voice | Arabic: **Piper** `ar_JO-kareem-medium` (hand-diacritised input). English: **Kokoro-82M** `bm_george` (Apache-2.0). Both offline |
| Music + SFX | Original synthesis in NumPy (`audio/score.py`), cue-locked to `scene/timeline.json` |
| Map data | OpenStreetMap-derived land polygons (ODbL), clipped and projected by `tools/clip_geo.py` |
| Encode / master | FFmpeg: x264 CRF 14 segments → concat, two-pass loudnorm −14 LUFS / −1 dBTP, AAC 320k |

## Re-render

```bash
npm install                      # three.js + fonts
bash tools/fetch_assets.sh       # Piper Arabic voice model + python deps
python3 audio/tts.py             # VO lines → audio/vo/*.wav (+ durations.json)
python3 audio/score.py           # music, SFX, ducking, mix → audio/build/
node render/render.js --workers 1   # Arabic frames → frames/seg_*.mp4 (resumable; run 2 processes on split --from/--to ranges for speed)
bash render/build.sh             # concat + master + mux → output/ (Arabic)

# English version
venv/bin/python audio/tts_en.py   # needs sherpa-onnx==1.12.40 + tools/tts/kokoro-en-v0_19
python3 audio/score.py en
node render/render.js --lang en --workers 1   # → frames_en/
bash render/build.sh en
node render/render.js --stills 3,10,22 --dir docs/stills   # optional frame grabs
```

To swap in a professional voice actor, replace `audio/vo/s1…s8.wav`, update `audio/vo/durations.json` and, if needed, the VO start times in `scene/timeline.json`. Then re-run `score.py` and `build.sh`. Visuals only need re-rendering if the timings change.

## Project layout

```
scene/            index.html (overlay CSS), main.js (timeline & 8 scenes), timeline.json
scene/lib/        engine (renderer/post), materials (PBR, procedural stone, IBL), tower (parametric
                  construction rig), apartment + plan (one plan → 2D drawing and 3D model), map,
                  props (crane, timeline, chart, contract, studio, blueprint, plinth), overlay (Arabic type)
audio/            narration.json, tts.py, score.py, vo/ (rendered lines, ASR QA), build/ (stems, mix, master)
render/           serve.js, render.js (frame capture), build.sh (assembly/master)
data/             abudhabi_land.json (OSM-derived)
tools/            clip_geo.py, asr_check.py, fetch_assets.sh
```

Map data © OpenStreetMap contributors (ODbL).
