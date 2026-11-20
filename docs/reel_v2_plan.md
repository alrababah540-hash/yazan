# Reel V2: calm, 7-scene revision (35.0 s)

**Deliverable:** `output/offplan_abu_dhabi_reel_v2_35s_1080x1920.mp4` and `output/offplan_abu_dhabi_reel_v2_35s.srt`

## Brief → changes
- **Pace:** 7 scenes instead of 8 fast cuts with zoom punches. Each scene carries one idea. Cuts are soft 0.22 s dips, with no flashes or zoom punches.
- **Speed:** the voice is at natural speed (Kokoro `bm_george`, 1.0×, 25.0 s of speech). The 3D source shots now play slower than real time (0.76×), not faster.
- **Repetition:** the tower appears in one building animation only (scene 2). Payment and due diligence are infographics over abstract blueprint backdrops.

## Script (as supplied)
| Line | Start (s) | Text |
|---|---|---|
| v1 | 0.12 | Buying a home that isn't built yet? That's off-plan. |
| v2 | 3.95 | You're purchasing a property directly from a developer before completion. |
| v3 | 10.10 | Start with the right location, project, and unit. |
| v4 | 17.45 | Understand the payment plan — because every project is different. |
| v5 | 23.20 | Before committing, verify the developer, the project's escrow account, and the SPA. |
| v6 | 28.40 | Don't invest based on the payment plan alone. |
| v7 | 31.55 | Save this guide before your next property investment. |

## Timeline
| # | Time | Scene | Source |
|---|---|---|---|
| 1 | 0.0–3.7 | Hero tower at dusk + "Buying a home that isn't built yet?" | Master 66.35–69.15 s at 0.76× |
| 2 | 3.7–8.4 | OFF-PLAN: blueprint → construction → completion (one build shot) | Master 0.45–5.9 s |
| 3 | 8.4–13.4 | **Real Abu Dhabi map**: markers drop, glide Abu Dhabi Island → Al Reem → Saadiyat → Yas | New (`scene/lib/map2.js`) |
| 4 | 13.4–17.2 | Apartment cut-away, floating room labels + floor plan | Master 31.0–33.9 s at 0.76× |
| 5 | 17.2–23.0 | Payment infographic | New HTML/SVG over blurred blueprint studio |
| 6 | 23.0–28.3 | Due-diligence infographic (Developer · Escrow account · SPA review) | New, over a slow top-down blueprint drift |
| 7 | 28.3–35.0 | Tower revealed as a model on stone → SAVE THIS GUIDE + share prompt | Master 70.1–75.3 s at 0.79× |

## Map: data and verification
- **Source:** Overture Maps release `2026-11-18.0`, `theme=base/type=land`. This is the current OpenStreetMap coastline, © OpenStreetMap contributors, ODbL 1.0. It's fetched by `tools/fetch_overture.py` and processed by `tools/build_map_v2.py` into `data/abudhabi_map_v2.json`, which keeps the full-resolution coastline with 8–12 m simplification.
- **AD-SDI:** `sdi.gov.abudhabi` was not reachable from the production sandbox, and its datasets normally need registered access. To swap in official AD-SDI coastline data later, replace the JSON with the same structure.
- **Focus islands:** each one is the polygon carrying its official OSM name. No coordinates were typed in by hand.

| Island | OSM name | Label point | Area |
|---|---|---|---|
| Abu Dhabi Island | جزيرة أبو ظبي | 24.47°N 54.37°E | 91.6 km² |
| Al Reem Island | جزيرة الريم | 24.49°N 54.41°E | 9.7 km² |
| Saadiyat Island | جزيرة السعديات | 24.55°N 54.44°E | 24.1 km² |
| Yas Island | جزيرة ياس | 24.49°N 54.61°E | 22.4 km² |

- **Orientation:** the camera keeps north up throughout, so the north arrow is true.

## Payment infographic
- **Layout:** one horizontal timeline. Construction milestones sit above the line (BOOKING, BUILD, HANDOVER) and the payment each triggers sits below it (Deposit + SPA signed · Instalments linked to milestones · Final payment + keys).
- **Animation:** a gold progress line fills from left to right.
- **No numbers or percentages:** the footnote reads "Amounts & timing vary by project — check your SPA".

## Due-diligence infographic
- **Cards:** three, each with a line icon (developer, escrow shield, SPA document). Each card is confirmed with a gold check on its spoken word.
- **Footnote:** "Check with ADREC — Abu Dhabi Real Estate Centre". ADREC is the regulator, and the project escrow-account requirement comes from Abu Dhabi Law No. 3 of 2015 as amended.
