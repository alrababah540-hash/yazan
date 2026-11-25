# Ep.02 Hudayriyat Island — storyboard, assets & production report

**Output:** `output/hudayriyat_island_ep02_22s_1080x1920.mp4` · 1080×1920 · 30 fps · **22.000 s / 660 frames** (rendered 1440×2560, Lanczos-downsampled) · −14 LUFS · H.264 CRF 14 + AAC 320k.
VO files: `output/hudayriyat_island_ep02_voiceover_only.wav`, `output/hudayriyat_island_ep02_voiceover_and_mix_master.wav`.

## Storyboard (120 BPM; cuts at 4, 8, 13, 18 s on beats)
| Time | Picture | Text | VO (placeholder voice) |
|---|---|---|---|
| 0–2.4 | Real OSM coastline; Hudayriyat's outline draws on in gold | ISLAND INVESTMENT SERIES · EP. 02 · ABU DHABI / HUDAYRIYAT ISLAND · **51 MILLION+ SQM** · A NEW DESTINATION IS RISING | "Over fifty-one million square metres. Abu Dhabi's next major destination." |
| 2.1–4.0 | Official Modon masterplan render (framed), slow push | same; "Official masterplan render · Modon (2023)" | |
| 4.0–5.45 | Beach photo | **SPORT. BEACH. LIFESTYLE.** · HUDAYRIYAT BEACH | "An island designed around lifestyle, sports and the waterfront." |
| 5.35–6.8 | Cyclists on the coastal track | CYCLING · 220 KM NETWORK PLANNED | |
| 6.7–8.0 | Mangrove cycling track, beach and pools (crop of the sunset aerial) | WATERFRONT LIFESTYLE | |
| 8.0–10.5 | Masterplan render, push into the communities | THE MASTERPLAN · **53.5 KM COASTLINE** · Modon masterplan (2023) | "With extensive coastline, beaches and ambitious residential communities." |
| 10.5–13.0 | Masterplan render, push along the beach front | **16 KM BEACHES** | |
| 13.0–15.6 | Nawayef Heights villa (Modon render; brochure text cropped out) | **A NEW CHAPTER OF ABU DHABI REAL ESTATE** · NAWAYEF HEIGHTS · MODON · Development render | "Creating new opportunities for long-term property investors." |
| 15.55–18.0 | Twilight villa render | HUDAYRIYAT VILLAS · Development render | |
| 18.0–22.0 | Golden-hour aerial: mangrove cycling track, beach, waterfront homes, bridge | **UNDERSTAND THE ISLAND. / DISCOVER THE OPPORTUNITY.** → YAZAN ALJALAMNEH · REAL ESTATE INVESTMENT ADVISOR · EXPORA REALTY · +971 50 500 4472 · credits | "The next frontier starts with understanding the location." |

## Assets (client-supplied, `assets/`)
| File | Size | Check | Use |
|---|---|---|---|
| 05_Masterplan/01_hudayriyat_masterplan_aerial_render.jpg | 1475×831 | Official masterplan render (Modon) | Hook + masterplan (framed panel, Lanczos ×1.85) |
| 02_Beach/01_beach_loungers.jpg | 1936×1286 | Real photo (client-identified as Hudayriyat Beach) | Lifestyle |
| 04_Cycling_Sports/01_cycling_coastal_track.jpg | 1903×1288 | Real photo | Lifestyle |
| 07_Villas/01_nawayef_heights_modon_render.jpg | 2215×1230 | Official Modon brochure render (Nawayef Heights, Type 06) | Investment |
| 07_Villas/02_villa_twilight_render.jpg | 2215×1241 | Development render, no AI watermark (client-identified) | Investment |
| 09_Sunset_Aerial/01_sunset_mangrove_cycling_track.jpg | 1277×1279 | Real photo | Lifestyle crop + ending |
| _excluded/NOT_HUDAYRIYAT_dunc_gray_velodrome_sydney.jpg | 2247×757 | **Dunc Gray Velodrome, Sydney** ("SYDNEY" banners, Sydney 2000 pictograms) | **Not used** |
Not supplied: Surf Abu Dhabi, golf course, marina → those lines were not shown. Map: © OpenStreetMap contributors (ODbL) via Overture Maps.

## Facts on screen
51M+ sqm, 53.5 km coastline, 16 km beaches, 220 km cycling network — Modon masterplan, June 2023 (see `facts.md`). No prices, returns, launch or completion dates. Brief figures not used (unverified): 53M sqm, 88 km coastline, 22 km beaches, 5 marinas / 900 berths, two 18-hole courses.

## QC (measured on the final MP4)
22.000 s container/video/audio · 660 frames · 1080×1920 · 30 fps · −14.0 LUFS · no black frames · no frozen stretches · watched every 0.5 s (`contact_sheet_every_0.5s.jpg`) · all type inside the Reels safe area · speech recognition: all five lines in their scenes.
Fixed during review: near-black first frame (title now on screen from frame 1), map-data edge visible in frame 0, low-contrast "SPORT." over bright sky.

## To do / limitations
- Voice is a built-in placeholder; client ElevenLabs recording to be dropped in (cut at its pauses, video stays 22.000 s).
- Masterplan render is small (1475 px) → used framed, not full-screen.
- Image usage rights (Modon renders, client photos) must be confirmed by the client before publishing.
