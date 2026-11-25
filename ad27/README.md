# Abu Dhabi Real Estate — From UAE to Investment Opportunities (27 s, 4K)

**Final video:** `output/abu_dhabi_real_estate_27s_4k.mp4` (3840×2160, 30 fps, **exactly 27.000 s / 810 frames**) · 1080p copy alongside.

| Deliverable | Path |
|---|---|
| Final MP4 (4K + 1080p) + QC json | `output/` |
| Editable source | `scene/film.js` (renderer), `scene/film.json` (all copy, island facts and statistics), `audio/` (VO script, TTS, score) |
| Assets & data | `../data/geo27.json`, `../data/buildings27.json` (Overture/OSM), `audio/vo/*.wav`, `audio/build/stem_*.flac`, `Abu_Dhabi_Video/` (your image library: currently empty) |
| Storyboard | `docs/storyboard.md` + frame grabs `docs/stills/` |
| Style guide | `docs/style_guide.md` |
| Research references | `docs/sources.md` |
| Production & QC report | `docs/production_qc_report.md` |

## Rebuild
```bash
# from the repo root
pip install shapely pyarrow s3fs numpy            # data step only
python3 tools/fetch_divisions.py 2026-11-18.0 geo_raw/divisions.json
python3 tools/fetch_overture.py 2026-11-18.0 land geo_raw/ad_land.json
python3 tools/fetch_buildings.py 2026-11-18.0 geo_raw/buildings.json && python3 tools/build_buildings27.py
python3 tools/build_geo27.py                      # → data/geo27.json

cd ad27
python3 tools/scan_assets.py                      # picks up images in Abu_Dhabi_Video/
../venv/bin/python audio/tts.py                   # Kokoro VO (needs sherpa-onnx==1.12.40 + tools/tts/kokoro-en-v0_19)
python3 audio/score.py                            # music + SFX + mix (27.000 s)
node render/render.js --w 3840 --workers 3        # frames → frames_3840/seg_*.mp4 (≈4 min on 4 CPUs)
bash render/build.sh                              # concat, master −14 LUFS, mux, validate (fails if not 810 frames / 27.00 s)
node render/render.js --w 1920 --stills 9,16.5,24.8 --dir /tmp/stills   # quick previews
```
To change any number or caption, edit `scene/film.json` and re-render. Timings live in `scene/film.js` (`renderAt`) and `audio/narration.json`.
