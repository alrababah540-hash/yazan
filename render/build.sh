#!/usr/bin/env bash
# Assemble rendered segments + master audio into the final deliverable.
#  - concat H.264 segments (stream copy, no generational loss)
#  - master mix: loudness-normalised to -14 LUFS integrated, -1 dBTP (social/mobile delivery)
#  - mux: H.264 High, yuv420p, 30 fps, AAC 320k 48 kHz, faststart for streaming
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=output; mkdir -p "$OUT"
ls frames/seg_*.mp4 | sort | sed "s#^#file '$(pwd)/#; s#\$#'#" > frames/concat.txt
ffmpeg -y -v error -f concat -safe 0 -i frames/concat.txt -c copy frames/video_only.mp4

# two-pass loudnorm for accurate integrated loudness
J=$(ffmpeg -hide_banner -nostats -i audio/build/mix.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
mi=$(echo "$J" | python3 -c 'import json,sys;print(json.load(sys.stdin)["input_i"])')
mtp=$(echo "$J" | python3 -c 'import json,sys;print(json.load(sys.stdin)["input_tp"])')
mlra=$(echo "$J" | python3 -c 'import json,sys;print(json.load(sys.stdin)["input_lra"])')
mth=$(echo "$J" | python3 -c 'import json,sys;print(json.load(sys.stdin)["input_thresh"])')
ffmpeg -y -v error -i audio/build/mix.wav -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$mi:measured_TP=$mtp:measured_LRA=$mlra:measured_thresh=$mth:linear=true,aresample=48000" \
  -c:a pcm_s16le audio/build/master.wav

ffmpeg -y -v error -i frames/video_only.mp4 -i audio/build/master.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -t 76 -movflags +faststart \
  -metadata title="ما هو العقار على المخطط (أوف بلان) في أبوظبي؟" -metadata language=ara \
  "$OUT/offplan_abu_dhabi_ar_1080x1920.mp4"
echo "wrote $OUT/offplan_abu_dhabi_ar_1080x1920.mp4"
