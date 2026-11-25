# Ep.02 v2 — interactive masterplan map

The real top-down map of Hudayriyat (OpenStreetMap coastline + existing cycle tracks, via Overture Maps) stays on screen for all 22 s.
Each location opens a floating picture-in-picture window (~80% width × ~30% height of the frame) with a thin gold leader line from its marker; the camera eases toward the marker and back.
Previous full-screen cut preserved in `scene/film_v1_fullscreen.js`.

## Marker positions — verified only (`data/hudayriyat_poi.json`)
| Location | Position | Evidence |
|---|---|---|
| Hudayriyat Beach | 54.3517 E, 24.4125 N | Overture place "Al Hudayriat Beach" + OSM beach feature at the same point |
| Surf Abu Dhabi | 54.3318 E, 24.4241 N | OSM human-made pool of 72,419 m² (published wave-pool area: 75,000 m²) |
| Marsana Waterfront | 54.3487 E, 24.4135 N | Overture place "Marsana Hudayriyat Island" + OSM "Marsana Beach" |
| Cycling network | real tracks drawn | 46 OSM cycleway segments on the island; "220 km planned" labelled as Modon's plan |
| Abu Dhabi Velodrome | **no marker** | no published site → island glows, window labelled "site not yet published" |
| Hudayriyat Golf Estates | **no marker** | not in map data → island glows; no image supplied (typographic card "18-hole course") |
| Nawayef | **no marker** | not in map data → island glows; official Modon render |

## Sequence (on the client voice)
0–2.6 map + coastline draw-on, 51M+ SQM · 2.6–5.0 official masterplan window · 5.0 beach · 6.45 surf · 7.85 cycling network · 9.25 velodrome (53.5 km / 16 km strip) · 10.75 golf estates · 12.25 Nawayef · 13.9 Marsana waterfront · 15.8 pull-back, all verified markers · "A new chapter of Abu Dhabi real estate" · 18.0 golden-hour photo window → statement → branding.

QC: 22.000 s · 660 frames · 1080×1920 · 30 fps · −14 LUFS · no black/frozen frames · checked every 0.5 s.
