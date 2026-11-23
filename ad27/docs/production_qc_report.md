# Production & quality-control report

**Deliverable:** `output/abu_dhabi_real_estate_27s_4k.mp4` (3840×2160) + `output/abu_dhabi_real_estate_27s_1080p.mp4`
**Measured with ffprobe/ffmpeg on the final files** (`output/*_qc.json`, produced by `tools/validate.py`):

| Check | 4K | 1080p |
|---|---|---|
| Duration (container / video / audio) | **27.000 / 27.000 / 27.000 s** | 27.000 / 27.000 / 27.000 s |
| Frames | **810** | 810 |
| Frame rate | 30/1 | 30/1 |
| Aspect | 16:9 (3840×2160) | 16:9 (1920×1080) |
| Codecs | H.264 High, yuv420p, CRF 16 · AAC 320 kbps 48 kHz stereo | H.264 CRF 17 · AAC |
| Loudness | −14.0 LUFS integrated, −1.0 dBTP | same |
| Black frames (blackdetect) | none | none |
| Frozen stretches > 1.5 s (freezedetect) | none | none |

## Tool audit (what was available, what was used)
| Category | Available here | Used |
|---|---|---|
| Claude Code skills | No motion-graphics, Remotion, After Effects, GIS or audio skills are installed. The installed skills cover documents, artifacts, data-viz guidance, etc. | Data-viz principles applied manually. Everything else was built with code |
| Animation / 3D | No GPU, no Blender, no After Effects. Headless Chromium + Playwright, Node 22, three.js 0.170 (from an earlier project in this repo) | **Custom Canvas 2D renderer** (`scene/film.js`): perspective camera, near-plane clipping, extruded land, real extruded buildings, glow passes. A pure function of time, so every frame is deterministic and re-renderable |
| Mapping / GIS | Shapely, PyArrow, anonymous S3 access to the **Overture Maps** open dataset | Real boundaries and coastline (OSM-derived), islands matched by OSM name, Web Mercator projection (`../tools/build_geo27.py`) |
| Research | Web search (official sites blocked by this environment's network policy) | Cross-checked each figure across at least two outlets quoting the same official release (`docs/sources.md`) |
| Voice-over | Kokoro-82M (Apache-2.0) via sherpa-onnx, offline | British male voice `bm_george`. Lines are auto-fitted to their time windows |
| Music / SFX | NumPy synthesis | Original 120 BPM score + cue-locked SFX + VO ducking (`audio/score.py`) |
| Encode / QC | FFmpeg 6, ffprobe | Segment render → concat → 2-pass loudnorm → mux → automated validation |

## Quality checklist
- [x] **Seven emirates geographically correct**: Overture `division_area` regions AE-AZ/DU/SH/AJ/UQ/RK/FU, drawn from the data, revealed in the requested order. Labels for the small northern emirates use leader lines.
- [x] **Seven Abu Dhabi locations correctly positioned**: each polygon is the OSM feature carrying that island's name. Al Fahid (OSM "Bisrat Fahd") matches the published 24.510 N 54.549 E. Hudayriyat's ~49 km² polygon matches its ~5,000 ha size. Abu Dhabi Island is drawn separately and never highlighted as one of the seven. No geographic connections are invented: land is shown exactly as OSM maps it (bridges are not drawn).
- [x] **No distortion**: conformal Web Mercator, so island shapes are true. The only intentional exaggeration is building height (×1.25–3, zoom-dependent), noted in the sources doc.
- [x] **Smooth zoom transitions**: logarithmic scale interpolation with position leading scale. The coarse-to-detailed map crossfade is invisible (no clip edges).
- [x] **Statistics accurate and sourced**: a source line sits under every figure. Annual vs quarterly vs half-year is labelled on each tile. The outlook panel is marked "announced projects, not forecasts". Unverifiable items were omitted (listed in `docs/sources.md`).
- [x] **Readable text**: smallest text (credits) is 25 px at 4K. Body labels are 30–40 px at 4K, headline numbers 96–116 px.
- [x] **VO matches the picture**: each island name is spoken as its pin drops (8.12 s + n·1.0 s); the stats line lands on the dashboard; the closing line lands on the skyline.
- [~] **VO intelligibility** (Whisper tiny.en, `docs/asr_check.json`): all English is transcribed correctly. The Arabic place names come back as close phonetic matches (Al Fahid → "Alpha head", Al Maryah → "Almeria", Saadiyat → "Sodiat"). A professional voice actor would pronounce them natively. To swap one in: replace `audio/vo/*.wav` and keep the start times in `audio/narration.json`.
- [x] **Spelling**: all on-screen strings live in `scene/film.json` / `scene/film.js` and were proofread.
- [x] **Consistent branding**: one palette and one type system (see `docs/style_guide.md`).
- [x] **No black frames, glitches or missing assets**: automated blackdetect/freezedetect on the final MP4, plus the visual contact sheet `docs/stills/contact_sheet.jpg`.

## Images (Section 9 of the brief)
**No images were uploaded to this session.** `Abu_Dhabi_Video/` and its 12 folders exist, and every folder is empty. Nothing was replaced with stock or AI imagery. Instead:
- Island cards show a **true-shape inset** of each island (OSM outline + real building footprints), labelled as such on screen.
- The closing skyline is built from **real building footprints and heights** (Overture), not a photo or an AI render.
- The end card shows no logo or name, because `12_Personal_Branding/` is empty.

**To use your images:** drop them into the matching folders, then run `python3 tools/scan_assets.py`, `node render/render.js --w 3840 --force 1` and `bash render/build.sh`. Each island card then switches to your hero photo with a slow push-in. A `logo*.png` goes on the end card, and a file named `*skyline*` is picked up for the closing shot.

## Known limitations
- The "3D" is a 2.5D perspective render of real vector data. There is no terrain elevation model or satellite texture, because the environment has no GPU and no imagery source.
- 27 s is a hard limit, so each island gets 1.0 s and the dashboard 7 s. Cards and tiles are designed to be glanceable, not read word for word.
- The ADREC 2025 value growth appears as 44% in most coverage and 48% in one secondary summary of ADREC's page. 44% is shown.
