# Asset & license register

| Asset | Source | License | Use in film | Status |
|---|---|---|---|---|
| Music score (pads, arpeggio, pulse, strings) | Original, synthesised from scratch by `audio/score.py` (NumPy; no samples) | Owned by the production. No third-party rights | Full soundtrack | ✅ Clear |
| Sound effects (whooshes, impacts, clicks, shimmer, paper, riser) | Original, synthesised by `audio/score.py` | Owned. No third-party rights | All SFX | ✅ Clear |
| Arabic voice-over | Piper neural TTS voice **`ar_JO-kareem-medium`** (rhasspy/piper; mirrored in k2-fsa/sherpa-onnx `tts-models` release), rendered offline with `piper-tts` 1.8.0 | Model card says the dataset license is "see URL" (github.com/AliMokhammad/arabicttstrain). **I could not reach that repository from the production sandbox, so the dataset license is unverified.** | All narration | ⚠️ **Placeholder for commercial use.** Before paid or commercial distribution, re-record with a licensed voice actor (UAE/Gulf or white-dialect Arabic) or a TTS with commercial terms. Drop-in: replace `audio/vo/s1…s8.wav`, keep the timings in `scene/timeline.json` and re-run `python3 audio/score.py && bash render/build.sh` |
| English voice-over | **Kokoro-82M v0.19** (hexgrad), voice `bm_george`, via k2-fsa/sherpa-onnx `tts-models` release, run with sherpa-onnx 1.12.40 | **Apache-2.0** (model card + LICENSE file in the release) | English narration | ✅ Clear for commercial use |
| `piper-tts` engine | PyPI `piper-tts` 1.8.0 | GPL-3.0 (tool only. The audio it outputs is not a derivative of the code) | Offline synthesis | ✅ Tool use |
| Rejected voices | `ar_JO-SA_dii-high`, `ar_JO-SA_miro-high` | CC BY-NC-SA 4.0 (non-commercial) | **Not used** (unsuitable for advertising) | — |
| Abu Dhabi coastlines | `@geo-maps/earth-lands-100m` 0.6.0 (npm), derived from **OpenStreetMap** | Data: **ODbL 1.0, © OpenStreetMap contributors**. Code: MIT | Scene 3 stone-relief map (`data/abudhabi_land.json`, clipped to 54.28–54.68 E, 24.36–24.62 N) | ✅ Attribution required: "Map data © OpenStreetMap contributors (ODbL)". Put it in the post caption or description |
| IBM Plex Sans Arabic | `@fontsource/ibm-plex-sans-arabic` 5.2.8 | SIL Open Font License 1.1 | All Arabic typography | ✅ Clear |
| Cormorant Garamond | `@fontsource/cormorant-garamond` 5.2.8 | SIL Open Font License 1.1 | "OFF-PLAN" wordmark | ✅ Clear |
| three.js | npm `three` 0.170.0 | MIT | 3D engine | ✅ Clear |
| Playwright + Chromium | pre-installed | Apache-2.0 / BSD | Frame capture | ✅ Tool use |
| FFmpeg / x264 | system | LGPL/GPL (tool) | Encoding | ✅ Tool use |
| Whisper small (ASR QA only) | k2-fsa/sherpa-onnx `asr-models` (OpenAI Whisper weights) | MIT | Intelligibility check only, not in the film | ✅ Not distributed |
| 3D models, materials, textures, floor plans, contract graphic | Original, procedurally generated in `scene/lib/*.js` | Owned | Everything visual | ✅ Clear |

**Brand assets:** none were supplied, so the film ends unbranded, as the brief allows. It shows no real developer, project, logo or trademark.
