# 35-second Instagram Reel — re-edit plan

**Deliverable:** `output/offplan_abu_dhabi_reel_35s_1080x1920.mp4` (34.5 s, 1080×1920, 9:16, 30 fps, H.264 + AAC) and `output/offplan_abu_dhabi_reel_35s.srt` (English captions).

## Approach

This is a re-edit from the 3D source, not a trim of the 76 s MP4. The master film's captions and titles are burned in, so a straight cut would carry outdated text. Instead, `scene/reel.json` is an **edit decision list**. Each reel shot plays a time-remapped section of the master film's 3D world, faster and tighter, and a new kinetic-typography layer goes on top (`scene/lib/overlay_reel.js`). Cuts get a 4-frame navy flash-in, a subtle zoom punch and a bloom accent (pattern interrupts), plus a whoosh/impact.

## Script (72 words · same English voice, Kokoro `bm_george`)

| # | Reel time | Narration |
|---|---|---|
| r1 | 0.12 s | Buying a home that isn't built yet? That's off-plan. |
| r2 | 3.90 s | You buy from the plans, and receive the finished unit at handover. |
| r3 | 8.70 s | In Abu Dhabi, start with the right location, project and unit. |
| r4 | 14.55 s | Payments are staged through construction, and every plan is different. |
| r5 | 20.45 s | The risks: delays and price changes. So verify the developer, the escrow account, and the contract. |
| r6 | 29.70 s | Save this guide before you buy, and send it to someone who needs it. |

Removed from the 76 s version: the long "what is off-plan" definition, the "why buyers choose off-plan" section (variety / staged payments / future planning, which was partly duplicated by the payment section), the stand-alone map narration, and the slow closing reflection. The map and the floor-plan details are now shown rather than narrated.

## Shot list

| Reel | Source (master time → speed) | Visual | Typography / graphics | Sound |
|---|---|---|---|---|
| 0.0–3.7 Hook | 0.5–6.4 s → 1.6× | Blueprint ignites, tower assembles floor by floor | **BUYING A HOME / THAT ISN'T BUILT YET?** Word-by-word, readable from frame 1 | Impact on frame 1, structural thunks, crown shimmer |
| 3.7–8.4 Off-plan | 6.4–14.6 → 1.74× | Fly-through façade → x-ray → gold unit → plan panel | **OFF-PLAN** wordmark. PLAN → BUILD → HANDOVER flow lights on the spoken words | Shimmer, paper |
| 8.4–11.6 Location | 18.2–24.8 → 2.06× | Stone-relief Abu Dhabi map, pins, island labels | **LOCATION · PROJECT · UNIT** lights word by word | Pin clicks |
| 11.6–14.2 Unit | 29.5–32.8 → 1.27× | Exploded tower → unit detaches, cut-away orbit | (continues) | Whoosh |
| 14.2–20.2 Payment | 35.3–41.7 → 1.07× | Plan → gold rail, milestones rise, tower grows | **STAGED PAYMENTS**. Live **construction counter 0→100 %** with stage 1/3 → 3/3. "Every plan is different — read yours" | Milestone thunks |
| 20.2–23.8 Risks | 52.55–57.9 → 1.49× | Tower reverses into construction, delay marker slips, price line | Pulsing ⚠ **DELAYS** / ⚠ **PRICE CHANGES** cards on the spoken words | Low hits, clock ticks |
| 23.8–27.6 Verify | 59.0–64.4 → 1.42× | Contract stack | **VERIFY FIRST**. Checklist ✓ Developer ✓ Escrow account ✓ Contract, ticking on the words | Check clicks |
| 27.6–34.5 CTA | 66.35–75.3 → 1.3× | Pull-away → tower revealed as a model on stone | "Off-plan starts with **the right information.**" → animated bookmark **SAVE THIS GUIDE** + "Send it to someone buying off-plan" | Strings resolve, bookmark ping |

## Retention and Instagram choices

- **First 3 s:** a question hook with visible motion and text on frame 1, plus an audio hit on frame 1.
- **Pace:** 8 shots, so a cut or major graphic change lands every 2.6–6 s.
- **Saves and sends:** the save-this-guide call is spoken, shown and animated. A share prompt follows.
- **Rewatch loop:** the last frame (model on stone) matches the first (empty plot) thematically, and the end is not faded to black.
- **Subtitles:** 2–4 word groups with the current word highlighted in gold, kept inside the Reels safe zone (y 1268–1340 px, x 60–940 px). All titles stay between y 270 and y 900. Nothing sits in the bottom 420 px or near the right-side buttons.
- **"Financial indicators":** the only animated number is construction progress. The reel shows no prices, percentages of payment, yields or returns, because those vary by project and would be invented.

## Tools actually used

These were used in place of Premiere, After Effects, Blender and CapCut, none of which are available here:
- three.js (3D), HTML/CSS (kinetic type)
- Playwright + headless Chromium (frame rendering)
- NumPy (score and SFX synthesis)
- Kokoro TTS (voice)
- FFmpeg (edit assembly, loudness, encoding)
