#!/usr/bin/env bash
# Instagram Reels exports from the 4K master: 2160x3840 (upload master) + 1080x1920 (sharpened, high bitrate). Both exactly 27.000 s.
set -euo pipefail; cd "$(dirname "$0")/.."
SRC=output/abu_dhabi_real_estate_27s_v2_4k.mp4
# 4K vertical: centre panel = 4K frame scaled to 2160 wide (2160x1215) at y=1312; overlay rendered at 2x
ffmpeg -v error -y -i $SRC -i reels/overlay_2x.png -filter_complex "[0:v]split=2[a][b];[a]scale=-2:3840:flags=bicubic,crop=2160:3840,gblur=sigma=56,eq=brightness=-0.22:saturation=0.85[bg];[b]scale=2160:1216:flags=lanczos+accurate_rnd+full_chroma_int[fg];[bg][fg]overlay=0:1312[v1];[v1][1:v]overlay=0:0,format=yuv420p[v]" \
  -map "[v]" -map 0:a -c:v libx264 -preset slower -crf 13 -tune film -profile:v high -level 5.2 -r 30 -x264-params keyint=60:min-keyint=30 -c:a aac -b:a 320k -ar 48000 -t 27 -movflags +faststart output/abu_dhabi_real_estate_27s_reels_4k_2160x3840.mp4
# 1080 vertical from the 4K vertical: Lanczos downscale + light unsharp (pre-compensates Instagram's re-encode), constrained high bitrate
ffmpeg -v error -y -i output/abu_dhabi_real_estate_27s_reels_4k_2160x3840.mp4 -vf "scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int,unsharp=5:5:0.45:5:5:0.0,format=yuv420p" \
  -c:v libx264 -preset slower -tune film -profile:v high -level 4.2 -r 30 -b:v 16M -maxrate 20M -bufsize 32M -x264-params keyint=60:min-keyint=30 -c:a aac -b:a 320k -ar 48000 -t 27 -movflags +faststart output/abu_dhabi_real_estate_27s_reels_1080x1920_HQ.mp4
for f in output/abu_dhabi_real_estate_27s_reels_4k_2160x3840.mp4 output/abu_dhabi_real_estate_27s_reels_1080x1920_HQ.mp4; do python3 tools/validate.py $f | grep -E '"(frames|size|video_duration|audio_duration|integrated_lufs)"|false'; done
