# Rendering & validation report

## 1. Tool audit (production sandbox, 2026-11-19)

| Requested tool | Available? | What was used instead / notes |
|---|---|---|
| Blender | ❌ not installed. `bpy` 5.3 is on PyPI, but Cycles on 4 CPU cores would take ~15–30 s/frame (10+ h) and EEVEE needs a GPU | **three.js** real-time PBR, rendered headless |
| GPU | ❌ none | Chromium WebGL2 on **SwiftShader** (CPU) |
| Remotion | Installable, but it adds nothing over a custom deterministic renderer here | Custom Playwright frame capture, `renderAt(t)` |
| three.js | ✅ npm 0.170.0 | Main 3D engine |
| FFmpeg | ✅ libx264, AAC | Encode, concat, loudness, QA |
| Arabic TTS | Cloud TTS hosts blocked by network policy | **Piper** `ar_JO-kareem-medium`, offline |
| English TTS | — | **Kokoro-82M** `bm_george` (Apache-2.0), offline |
| Image/video generation APIs | ❌ none (no paid APIs assumed) | Everything is procedural geometry and textures |
| Map data | Overpass/OSM servers blocked | OSM-derived `@geo-maps/earth-lands-100m` from npm |

## 2. Pipeline

`scene/timeline.json` drives every system (shots, captions, VO placement, SFX cues).
three.js scene → Playwright screenshots (JPEG q95) → FFmpeg x264 CRF 14 in 120-frame resumable segments → concat → mezzanine master (~50 Mb/s) → delivery encode (x264 slow, CRF 19, VBV 8.5 Mb/s, High@4.2, faststart).
Audio: VO lines + synthesised score/SFX → sidechain ducking (−8 dB) → two-pass loudnorm −14 LUFS / −1 dBTP → AAC 320 kb/s.

Render cost: ~5–7 s per frame per browser process at full quality (4× MSAA, PCF soft shadows 2048², bloom, film grade; bokeh DOF only in shallow-focus shots). That came to about 1 h 45 min per language with two browser processes in parallel.

## 3. Validation results

| Check | Arabic | English |
|---|---|---|
| File | `output/offplan_abu_dhabi_ar_1080x1920.mp4` | `output/offplan_abu_dhabi_en_1080x1920.mp4` |
| Duration | 76.000 s | 76.000 s |
| Resolution / fps | 1080×1920 / 30 | 1080×1920 / 30 |
| Frames | 2,280 | 2,280 |
| Video | H.264 High, yuv420p, 8.9 Mb/s, 84.6 MB | H.264 High, yuv420p, 8.9 Mb/s, 84.5 MB |
| Audio | AAC-LC 48 kHz stereo | AAC-LC 48 kHz stereo |
| Integrated loudness | −14.2 LUFS | −14.2 LUFS |
| Full decode (`ffmpeg -f null`) | ✅ no errors | ✅ no errors |
| VO intelligibility (Whisper-small round-trip, script similarity) | 97.2 % mean | 98.4 % mean |
| Text direction / shaping | RTL, correct Arabic joining & diacritics (native Chromium shaping) | LTR |
| Captions | Burned-in, chunked at punctuation, timed to VO | Same |
| Mobile safe zones | Headings 230–560 px from top; captions 330 px from bottom; anchored labels clamped 36 px from edges | Same |
| Factual guardrails | No percentages, prices, returns or guarantees. Generic tower/units. Areas only on the map. Escrow/ADREC reference checked against law-firm summaries (see narration_script.md) | Same |

Contact sheets: `docs/stills/contact_sheet_ar.jpg`, `docs/stills/contact_sheet_en.jpg`.

## 4. Known limitations

- **Not path-traced CGI.** The visuals are real-time rasterised PBR (image-based lighting, soft shadows, DOF, bloom). They're polished and consistent, but they don't reach the global-illumination realism of a Blender Cycles or V-Ray launch film. A GPU machine running Blender would be the upgrade path. The scene logic and timeline here can be ported.
- **Arabic voice** is a neural TTS placeholder with an unverified dataset license (see `licenses.md`). Replace it with a licensed voice actor before commercial use. The English voice (Apache-2.0) is clear.
- **Map resolution:** the OSM-derived coastline dataset (2017, ~100 m) merges Yas Island's narrow channels into the mainland outline. Labels sit at correct island coordinates.
- **Length:** 76 s rather than 70 s. The Arabic narration needs about 67 s of natural-paced speech, and squeezing it further hurt intelligibility.
- Film grain is part of the look and raises bitrate. The masters (`output/master_*.mp4`, ~480 MB each) are kept locally and not committed.
