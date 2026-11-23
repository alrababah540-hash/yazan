# V2 — Render & QC report

**Deliverable:** `output/abu_dhabi_real_estate_27s_v2_1080p.mp4` (main, 1920×1080) · bonus `output/abu_dhabi_real_estate_27s_v2_4k.mp4`

| Check (ffprobe/ffmpeg on the final files) | 1080p | 4K |
|---|---|---|
| Duration container / video / audio | **27.000 / 27.000 / 27.000 s** | 27.000 / 27.000 / 27.000 s |
| Frames · fps · aspect | 810 · 30/1 · 16:9 | 810 · 30/1 · 16:9 |
| Codec | H.264 High, CRF 14, preset slower, tune film · AAC 320 kbps | H.264 CRF 16 · AAC 320 kbps |
| Loudness | −14.0 LUFS, −1.0 dBTP | same |
| Black frames / frozen stretches | none / none | none / none |

## Quality measures
- Rendered at 3840×2160 and downsampled (Lanczos, full-chroma) to 1080p: supersampled text, map lines and image edges.
- Client images pre-scaled offline (Lanczos + gentle unsharp) to their on-screen size; high-quality canvas smoothing.
- 1080p encoded directly from near-lossless 4K intermediates (single generation of compression).

## Content checks
- Voice-over: client ElevenLabs recording, cut only at its own pauses (no stretch/pitch). ASR of the final mix: "Seven Emirates, One Nation" · "2025, a record year. Then the first half of 2026 more than doubled." · "Abu Dhabi, … evolving investment destination." Island names land on their reveals (8.05 / 9.20 / 10.35 / 11.65 / 12.40 / 13.25 / 14.45 s).
- Counters end on the published values and hold: AED 142 bn (FY2025), AED 117 bn (H1 2026), AED 13.8 bn FDI (H1 2026), each with period, comparison and ADREC release date.
- Every image checked against identifying landmarks (see `v2_storyboard_and_asset_map.md`); renders captioned "Development render", photos "Photograph"; the locator inset sits bottom-right so no landmark is covered.
- End card: "Understand the Market. / Identify the Opportunity. / Invest Strategically." + Yazan Aljalamneh · +971 50 500 4472 · data/map credits · "Not investment advice".

## Known limitations
- Yas, Saadiyat, Hudayriyat and the skyline images are small originals (373–554 px tall); they were upscaled with care but remain softer than the Al Maryah, Al Reem and Lulu photos. Larger originals would improve them directly.
- Hudayriyat render has no unique landmark to verify independently; its identification is the client's.
- Al Reem's card is on screen 0.75 s (matching the VO pace "Al Reem."), the shortest of the seven.
