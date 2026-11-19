#!/usr/bin/env bash
# Assemble rendered segments + master audio into the final deliverable.
#  - concat H.264 segments (stream copy, no generational loss)
#  - master mix: loudness-normalised to -14 LUFS integrated, -1 dBTP (social/mobile delivery)
#  - mux: H.264 High, yuv420p, 30 fps, AAC 320k 48 kHz, faststart for streaming
set -euo pipefail
cd "$(dirname "$0")/.."
LANG_="${1:-ar}"
if [ "$LANG_" = en ]; then FR=frames_en; AB=audio/build_en; NAME=offplan_abu_dhabi_en_1080x1920.mp4; TITLE="What is off-plan real estate in Abu Dhabi?"; ML=eng; else FR=frames; AB=audio/build; NAME=offplan_abu_dhabi_ar_1080x1920.mp4; TITLE="ما هو العقار على المخطط (أوف بلان) في أبوظبي؟"; ML=ara; fi
OUT=output; mkdir -p "$OUT"
ls $FR/seg_*.mp4 | grep -v tmp | sort | sed "s#^#file '$(pwd)/#; s#\$#'#" > $FR/concat.txt
ffmpeg -y -v error -f concat -safe 0 -i $FR/concat.txt -c copy $FR/video_only.mp4

# two-pass loudnorm for accurate integrated loudness
J=$(ffmpeg -hide_banner -nostats -i $AB/mix.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
mi=$(echo "$J" | python3 -c 'import json,sys;print(json.load(sys.stdin)["input_i"])')
mtp=$(echo "$J" | python3 -c 'import json,sys;print(json.load(sys.stdin)["input_tp"])')
mlra=$(echo "$J" | python3 -c 'import json,sys;print(json.load(sys.stdin)["input_lra"])')
mth=$(echo "$J" | python3 -c 'import json,sys;print(json.load(sys.stdin)["input_thresh"])')
ffmpeg -y -v error -i $AB/mix.wav -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$mi:measured_TP=$mtp:measured_LRA=$mlra:measured_thresh=$mth:linear=true,aresample=48000" \
  -c:a pcm_s16le $AB/master.wav

ffmpeg -y -v error -i $FR/video_only.mp4 -i $AB/master.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -t 76 -movflags +faststart \
  -metadata title="$TITLE" -metadata language=$ML \
  "$OUT/$NAME"
echo "wrote $OUT/$NAME"
