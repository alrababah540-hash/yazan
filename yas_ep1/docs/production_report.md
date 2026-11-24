# Ep.01 Yas Island — production & QC report

**Deliverables (`output/`):** `yas_island_ep01_20s_1080x1920.mp4` · `yas_island_ep01_voiceover_only.wav` · `yas_island_ep01_voiceover_and_mix_master.wav`
**Source project:** `scene/film.js` (renderer, all timings and copy) · `audio/` (VO script, TTS, score) · `render/` (frame capture, build) · `assets/` (organised by scene; `_excluded/` holds the rejected image)

## Measured on the final MP4 (`tools/validate.py`)
| Check | Result |
|---|---|
| Duration (container / video / audio) | **20.000 / 20.000 / 20.000 s** |
| Frames · fps | 600 · 30/1 |
| Resolution / aspect | 1080×1920 · 9:16 (rendered 1440×2560, Lanczos-downsampled) |
| Codec | H.264 High CRF 14, tune film · AAC 320 kbps 48 kHz |
| Loudness | −14.0 LUFS integrated, −1.0 dBTP |
| Black frames / frozen stretches | none / none |
| Voice-over (speech recognition of the final mix) | all five lines transcribed correctly, each inside its scene window |
| Text positioning | all copy between y 250–1600 (Reels safe area), visually checked every 0.5 s (`docs/contact_sheet_every_0.5s.jpg`) |

## Tools
Headless Chromium + Canvas 2D renderer (deterministic, editable), real OpenStreetMap coastline (Overture Maps) for the opening map, Kokoro-82M TTS (built-in male voice, swappable for the client's ElevenLabs voice), NumPy-synthesised original score at 120 BPM, FFmpeg for assembly/mastering. No AI-generated imagery used.

## Accuracy
- 44M+ **visits** (not unique visitors), 2025, and 84% full-year hotel occupancy, 2025 — Miral full-year 2025 figures (trade press citing Miral).
- Tram Line 4 shown as **planned (2030)**, drawn as a schematic link toward Zayed International Airport, not a surveyed route.
- Disneyland Abu Dhabi: announced May 2025; opening **expected ~2030–2032**, explicitly labelled "not an officially confirmed date"; image labelled artist concept © Disney.
- Sphere Abu Dhabi: announced May 2026, completion targeted end-2029; its site is marked as an **approximate** zone ("announced site between Yas Mall & SeaWorld"), not a parcel.
- The client report "Yas Island Investment Report 2026" was not received; figures were cross-checked against public sources instead.

## Issues found and fixed during review
- Client image #3 (W hotel at night) is **AI-generated** (Google Gemini watermark, wrong architecture) → excluded; the real daytime W hotel photo is used.
- Hook push-in stalled after 1.5 s → made continuous across the full 3 s.
- Warner Bros. backdrop glow → darkened; counters, chips and branding given dark scrims for legibility; SeaWorld label no longer clipped.

## Known limitations
- Restaurants (1200×900), circuit/W hotel (1600×1200) and Sphere (1200×900) images are low-resolution originals, enhanced with Lanczos + sharpening; larger originals would look crisper.
- Stills animated with camera moves — no video footage was supplied.
- Image usage rights must be confirmed by the client before publishing (see `docs/storyboard_and_assets.md`).
