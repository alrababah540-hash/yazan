# V2 — Storyboard & image-to-scene mapping (for approval before render)

**Output:** 1920×1080 · 30 fps · 16:9 · MP4 · **exactly 27.000 s (810 frames)** · VO = client ElevenLabs recording (Yazan Jalamneh voice), cut only at its own pauses.
Preview frames: `docs/v2_preview_contact_sheet.jpg`.

## Storyboard

| Time | Scene | Picture | Image used | Voice-over (client recording) |
|---|---|---|---|---|
| 0.0–4.0 | UAE | Real-boundary map of the Gulf; UAE border traces in gold; 7 emirates fill in order with labels | — (map data) | 0.30 "Seven emirates." · 1.76 "One nation." |
| 4.0–8.0 | Zoom to Abu Dhabi | Continuous zoom from emirate to the capital's islands; real 3D buildings rise | — (map data) | 4.15 "And at its heart," · 5.65 "the capital," · 6.73 "Abu Dhabi." |
| 8.00–9.15 | 01 Yas Island | Map: island outline glows, pin drops (map stays visible left). Card: image + locator inset + fact | **Yas** render (Ferrari World + circuit grandstands) | 8.05 "Yas Island." |
| 9.15–10.30 | 02 Al Fahid | same | **Al Fahid** masterplan render | 9.20 "Al Fahid Island." |
| 10.30–11.60 | 03 Saadiyat | same | **Saadiyat** render (Louvre dome, cultural district) | 10.35 "Saadiyat Island." |
| 11.60–12.35 | 04 Al Reem | same | **Al Reem** photo (Gate Towers, Sky Tower) | 11.65 "Al Reem." |
| 12.35–13.20 | 05 Al Maryah | same | **Al Maryah** photo (ADGM Square) | 12.40 "Al Maryah." |
| 13.20–14.40 | 06 Hudayriyat | same | **Hudayriyat** villa render | 13.25 "Hudayriyat." |
| 14.40–16.00 | 07 Lulu Island | same; at 15.0 all seven glow together, camera pulls back | **Lulu** aerial photo (push drifts toward Lulu, right of frame) | 14.45 "Lulu Island." |
| 16.0–23.0 | Market data | Three hero figures land one by one with the VO, counters stop exactly on the published value; small secondary row at 21.1 s | — | 16.15 "2025…" · 17.55 "a record year." · 18.80 "Then the first half of 2026…" · 21.70 "more than doubled." |
| 23.0–23.9 | All seven | Oblique map, all seven islands glowing with names | — | 23.30 "Abu Dhabi." |
| 23.75–25.4 | Skyline | Dissolve to the sunset skyline photo, golden grade, slow push; statement in serif/gold | **Skyline** Corniche sunset photo | 24.29 "An evolving investment destination." |
| 25.4–27.0 | Final | Same photo dimmed; gold typography: *Understand the Market. / Identify the Opportunity. / Invest Strategically.*; gold rule; **Yazan Jalamneh** + phone; data/map credit line | Skyline (continued) | — (music resolves) |

## Statistics on screen (every figure with period + source; counters end on the published value)
| Figure | Period | Comparison shown | Source |
|---|---|---|---|
| **AED 142 billion** total transaction value | Full year 2025 (record) | +44% vs 2024 | ADREC 2025 performance release, 20 Feb 2026 |
| **AED 117 billion** total transaction value | H1 2026 (Jan–Jun) | +112% vs H1 2025 | ADREC H1 2026 release, 17 Jul 2026 |
| **AED 13.8 billion** foreign direct investment | H1 2026 (Jan–Jun) | +309%, above all of 2025 (AED 8.2 bn) | ADREC H1 2026 release, 17 Jul 2026 |
| Secondary: 42,814 transactions (+52%) · apartments +11% · villas +8.9% (Q3 2026 YoY) · 26.6 m visitors (2025) | as labelled | — | ADREC · Cavendish Maxwell · DCT Abu Dhabi |

## Image-to-scene mapping
| # | File | Scene | Type (as captioned on screen) | Verified by | Size | Note |
|---|---|---|---|---|---|---|
| 1 | `03_Yas_Island/01_yas_client.jpg` | 01 Yas | Development render | Ferrari World red roof + Yas Marina Circuit grandstand canopies | 554×554 | Small → slightly soft |
| 2 | `04_Al_Fahid/01_fahid_client.jpg` | 02 Al Fahid | Development render | Long narrow island, mangrove fringe, bridge — matches OSM shape & Aldar masterplan | 678×452 | Small |
| 3 | `05_Saadiyat/01_saadiyat_client.jpg` | 03 Saadiyat | Development render | Louvre Abu Dhabi dome, Guggenheim form | 596×335 | Small |
| 4 | `06_Al_Reem/01_reem_client_gate_towers.webp` | 04 Al Reem | Photograph | Gate Towers sky-bridge, Sky Tower (Shams) | 1300×731 | Good |
| 5 | `07_Al_Maryah/01_maryah_client_adgm.jpg` | 05 Al Maryah | Photograph | ADGM Square, Four Seasons, Rosewood | 2000×1333 | Excellent |
| 6 | `08_Hudayriyat/01_hudayriyat_client_render.jpg` | 06 Hudayriyat | Development render | Client-identified; no unique landmark to confirm independently | 554×554 | Small |
| 7 | `09_Lulu_Island/01_lulu_client_aerial.jpg` | 07 Lulu | Photograph | Long sandy island parallel to the Corniche, Breakwater marina | 1200×800 | Good |
| 8 | `02_Abu_Dhabi_Maps/01_skyline_client_corniche_sunset.jpg` | Closing + final | Photograph | Corniche towers, beach, sunset over the Gulf | 822×373 | Upscaled ~2.9× full-screen → soft |

Image treatment (all): slow push-in with per-image drift toward the subject, natural grade (contrast +6%, saturation +8%), warm soft-light pass, soft vignette, gold 1.5 px border; closing adds a golden-hour gradient. No AI-generated imagery; renders are captioned "Development render", photos "Photograph".
