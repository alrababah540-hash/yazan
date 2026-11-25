# Ep.02 Hudayriyat Island — storyboard, assets & production report

**Output:** `output/hudayriyat_island_ep02_22s_1080x1920.mp4` · 1080×1920 · 30 fps · **22.000 s / 660 frames** (rendered 1440×2560, Lanczos-downsampled) · −14 LUFS · H.264 CRF 14 + AAC 320k.
VO files: `output/hudayriyat_island_ep02_voiceover_only.wav`, `output/hudayriyat_island_ep02_voiceover_and_mix_master.wav`.

## Storyboard (re-timed to the client's ElevenLabs voice; 120 BPM, cuts at 5, 9, 14, 18 s on beats)
| Time | Picture | Text | Client VO (cut at its own pauses, no stretch) |
|---|---|---|---|
| 0–2.9 | Real OSM coastline; Hudayriyat outline draws on in gold | EP. 02 · ABU DHABI / HUDAYRIYAT ISLAND · **51 MILLION+ SQM** · A NEW DESTINATION IS RISING | 0.00 "More than fifty-one million square metres." |
| 2.6–5.0 | Official Modon masterplan render (framed), push-in | "Official masterplan render · Modon (2023)" | 2.85 "Abu Dhabi's next major destination." |
| 5.0–6.0 | Family on the beach | **SPORT. BEACH. LIFESTYLE.** · HUDAYRIYAT BEACH | 5.15 "An island designed around lifestyle, sports and the waterfront." |
| 6.0–7.0 | Surf Abu Dhabi aerial | SURF ABU DHABI | |
| 7.0–8.0 | Cyclists on the coastal track | CYCLING · 220 KM NETWORK PLANNED | |
| 8.0–9.0 | Velodrome concept render | PLANNED VELODROME · Concept render | |
| 9.0–11.2 | Masterplan render, communities | THE MASTERPLAN · **53.5 KM COASTLINE** | 9.30 "With extensive coastline, beaches and ambitious residential communities." |
| 11.2–12.7 | Masterplan render, beach front | **16 KM BEACHES** | |
| 12.6–14.0 | Marina with the #HUDAYRIYAT sign | HUDAYRIYAT MARINA | |
| 14.0–16.1 | Nawayef Heights (Modon render) | **A NEW CHAPTER OF ABU DHABI REAL ESTATE** · Development render | 14.15 "Creating new opportunities for long-term property investors." |
| 16.0–18.0 | Twilight villa render | HUDAYRIYAT VILLAS · Development render | |
| 18.0–22.0 | Golden-hour aerial, mangrove cycling track | **UNDERSTAND THE ISLAND. / DISCOVER THE OPPORTUNITY.** → YAZAN ALJALAMNEH · REAL ESTATE INVESTMENT ADVISOR · EXPORA REALTY · +971 50 500 4472 | 18.40 "The next frontier starts with understanding the location." |

## Assets (client-supplied, `assets/`)
| File | Size | Check | Use |
|---|---|---|---|
| 05_Masterplan/01_hudayriyat_masterplan_aerial_render.jpg | 1475×831 | Official masterplan render (Modon) | Hook + masterplan (framed panel, Lanczos ×1.85) |
| 02_Beach/01_beach_loungers.jpg | 1936×1286 | Real photo (client-identified as Hudayriyat Beach) | Lifestyle |
| 04_Cycling_Sports/01_cycling_coastal_track.jpg | 1903×1288 | Real photo | Lifestyle |
| 07_Villas/01_nawayef_heights_modon_render.jpg | 2215×1230 | Official Modon brochure render (Nawayef Heights, Type 06) | Investment |
| 07_Villas/02_villa_twilight_render.jpg | 2215×1241 | Development render, no AI watermark (client-identified) | Investment |
| 09_Sunset_Aerial/01_sunset_mangrove_cycling_track.jpg | 1277×1279 | Real photo | Lifestyle crop + ending |
| 02_Beach/02_family_beach_pier.jpg | 2223×1262 | Real lifestyle photo | Lifestyle |
| 03_Surf_Abu_Dhabi/01_surf_abu_dhabi_aerial.jpg | 1925×1281 | Real photo (wave pool, Abu Dhabi skyline) | Lifestyle |
| 04_Cycling_Sports/02_velodrome_concept_render.jpg | 1284×1307 | Concept render (planned velodrome) — labelled | Lifestyle |
| 08_Waterfront_Marina/01_hudayriyat_marina_sign.jpg | 1930×1283 | Real photo, #HUDAYRIYAT sign | Masterplan |
| 04_Cycling_Sports/03_cyclists_sunset_dome.jpg | 2211×1251 | Real photo | spare (not used) |
| 02_Beach/01_beach_loungers.jpg | — | Real photo | spare (replaced by family beach) |
| _excluded/NOT_HUDAYRIYAT_dunc_gray_velodrome_sydney.jpg | 2247×757 | **Dunc Gray Velodrome, Sydney** ("SYDNEY" banners, Sydney 2000 pictograms) | **Not used** |
Not supplied: golf course → not shown. Map: © OpenStreetMap contributors (ODbL) via Overture Maps.

## Facts on screen
51M+ sqm, 53.5 km coastline, 16 km beaches, 220 km cycling network — Modon masterplan, June 2023 (see `facts.md`). No prices, returns, launch or completion dates. Brief figures not used (unverified): 53M sqm, 88 km coastline, 22 km beaches, 5 marinas / 900 berths, two 18-hole courses.

## QC (measured on the final MP4)
22.000 s container/video/audio · 660 frames · 1080×1920 · 30 fps · −14.0 LUFS · no black frames · no frozen stretches · watched every 0.5 s (`contact_sheet_every_0.5s.jpg`) · all type inside the Reels safe area · speech recognition: all five lines in their scenes.
Fixed during review: near-black first frame (title now on screen from frame 1), map-data edge visible in frame 0, low-contrast "SPORT." over bright sky.

## To do / limitations
- Voice: client ElevenLabs recording (`audio/vo_user/`), placed per `audio/vo_user_edit.json`; speech check confirms every line incl. "waterfront" after ducking effects under the voice.
- Masterplan render is small (1475 px) → used framed, not full-screen.
- Image usage rights (Modon renders, client photos) must be confirmed by the client before publishing.
