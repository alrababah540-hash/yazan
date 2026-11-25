# Visual style guide

**Mood:** a night-time financial documentary: dark, precise and calm, with gold used only for what matters.

## Colour
| Token | Hex | Use |
|---|---|---|
| Background | `#050B14` / `#050A12` | Page and dashboard base |
| Sea | `#071423` → `#0A1C30` radial | Water |
| Land top / side | `#202D3C` / `#0B121B` | Extruded land (top face / thickness) |
| Neighbour land | `#18222E` | Countries outside the UAE |
| Gold | `#D9B26F` | Highlights, pins, kickers, bars |
| Gold light | `#F4DCA8` | Active outline core, key numbers |
| Teal | `#5CC8D6` | Growth deltas, category headers |
| Text / muted / dim | `#EEF2F6` / `#8E9CAF` / `#5D6B7D` | Copy hierarchy |

Emirate colours, muted for dark backgrounds: Abu Dhabi `#C9A86A` · Dubai `#4FA3A5` · Sharjah `#6C8EBF` · Ajman `#9C7FB8` · Umm Al Quwain `#B87A8B` · Ras Al Khaimah `#7FAE85` · Fujairah `#C88A5A`.

## Type
- **Cormorant Garamond 600** (italic 500 for the statement): scene titles and the closing line. Gives an editorial, premium feel.
- **Inter 400–700**: labels, numbers and sources. Tabular and highly legible at small sizes.
- Kicker: Inter 600, 15 px, tracking +3, gold, preceded by a 26 px gold rule.
- Minimum on-screen size: 12.5 px on the 1080 grid (25 px at 4K), used only for source/credit lines.

## Map language
- Real geometry only (Overture Maps / OpenStreetMap), Web Mercator, which is conformal, so island shapes are not distorted.
- 2.5D: perspective camera, land extruded (thickness proportional to view width), depth haze toward the horizon, radial vignette.
- Highlight = gold fill (10–30%) + glowing outline with a white-hot core. Active item is brighter and thicker.
- Pins: thin gold stem, glowing head, pulse ring flattened by camera tilt.
- Buildings: real footprints and heights, night shading, floor-light bands on towers taller than 45 m.

## Motion
- Easing: cubic in-out for camera moves, cubic-out for UI, slight back-overshoot for pin drops.
- Long zooms interpolate scale logarithmically, and position leads scale.
- UI enters with a 12–16 px rise and fade (0.3–0.6 s). Numbers count up with cubic-out.
- Nothing hard-cuts. Every change rides the 120 BPM grid.

## Layout (1920×1080 grid, scaled ×2 for 4K)
- Safe margins 96 px left/right. Title block at (96, 118). HUD/credits baseline y = 1026.
- Island card: x 1288–1828, y 236–876. Map composition keeps the islands left of x ≈ 1250.
