# Final Reel: delivery and validation report

**Video:** `output/offplan_abu_dhabi_reel_final_1080x1920.mp4`
**Captions:** `output/offplan_abu_dhabi_reel_final.srt`
**Contact sheet:** `docs/stills/contact_sheet_reel_final.jpg` (2 frames per scene)
**Brand:** Slate `#4B5563` backgrounds · Sand `#E6D5B8` panels and highlights · Dark `#1F2937` text on sand panels (set in `scene/brand.json`).

The brand system keeps every text and background pairing readable:

| Pairing | Contrast |
|---|---|
| Dark on Sand | 10.3:1 |
| Sand on Slate | 5.1:1 |

Dark text never sits directly on Slate (that pairing is only 2.0:1).

## Timeline (34.9 s)
| Scene | Time | Content |
|---|---|---|
| Hook | 0–4 | Hero tower. "Buying a home that isn't built yet?" |
| What is off-plan | 4–9 | Blueprint → construction → completion |
| Abu Dhabi map | 9–15 | Current OSM coastline. Abu Dhabi Island, Al Reem, Saadiyat and Yas highlighted in turn |
| Project selection | 15–20 | Location · Developer · Unit, over the apartment cut-away |
| Payment plan | 20–26 | Booking (deposit + SPA) → Build (instalments linked to milestones) → Handover (final payment + keys) |
| Due diligence | 26–31 | Developer · Escrow account · SPA review |
| Save & share | 31–34.9 | The model on stone. SAVE THIS GUIDE + share prompt |

## Validation (`python3 tools/validate_reel.py`, all pass)
See `docs/reel_final_validation.json` for the detailed results.

1. **Duration:** 34.900 s (container, video and audio). 1,047 frames.
2. **Format:** 1080×1920, 30 fps, H.264 High + AAC 48 kHz.
3. **Decode:** full ffmpeg decode, 0 errors.
4. **Loudness:** −14.1 LUFS integrated, true peak −1.0 dBTP.
5. **Voice:** the source video's narrator, George (Kokoro `bm_george`), at synthesis speed 1.0 with no time-stretch.
6. **Subtitle sync:** speech onsets are within 40 ms of caption starts on all 6 lines. SRT timing matches VO placement exactly.
7. **Map labels:** each label sits within 0.05 km of its OSM-named island polygon. Source: Overture Maps 2026-11-18, ODbL.
8. **No financial figures:** 95 on-screen text items, sampled every 0.5 s. No %, prices or yields. The only numbers are island coordinates and the step labels 01–03.
9. **Mobile readability:** content text is ≥ 21 px and subtitles are 42 px on the 1080 px frame. The 19–20 px sizes appear only in the map attribution and coordinate captions.
10. **Timeline:** matches the requested 0–4 / 4–9 / 9–15 / 15–20 / 20–26 / 26–31 / 31–35 structure.

## Known limits
- **AD-SDI data:** the official Abu Dhabi GIS portal was not reachable from the production sandbox, so the map uses the current OpenStreetMap coastline. Measured water gaps to the nearest large landmass: Yas 77 m, Al Reem 108 m, Abu Dhabi Island 157 m, Saadiyat 610 m.
- **Rendering:** real-time 3D (three.js on CPU), not path-traced. A GPU and Blender would be the upgrade path for photoreal lighting.
