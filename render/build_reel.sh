#!/usr/bin/env bash
# Assemble the 35 s Instagram Reel: concat segments, master audio (-14 LUFS / -1 dBTP), mux, delivery encode.
set -euo pipefail
cd "$(dirname "$0")/.."
V="${1:-1}"
if [ "$V" = 2 ]; then FR=frames_reel2; AB=audio/build_reel2; NAME=offplan_abu_dhabi_reel_v2_35s_1080x1920.mp4; DUR=35.0; RJ=reel2; NJ=narration_reel2; VD=vo_reel2; SRT=offplan_abu_dhabi_reel_v2_35s.srt
else FR=frames_reel; AB=audio/build_reel; NAME=offplan_abu_dhabi_reel_35s_1080x1920.mp4; DUR=34.5; RJ=reel; NJ=narration_reel; VD=vo_reel; SRT=offplan_abu_dhabi_reel_35s.srt; fi
mkdir -p output
ls $FR/seg_*.mp4 | grep -v tmp | sort | sed "s#^#file '$(pwd)/#; s#\$#'#" > $FR/concat.txt
ffmpeg -y -v error -f concat -safe 0 -i $FR/concat.txt -c copy $FR/video_only.mp4
J=$(ffmpeg -hide_banner -nostats -i $AB/mix.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -y -v error -i $AB/mix.wav -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):linear=true,aresample=48000" -c:a pcm_s16le $AB/master.wav
ffmpeg -y -v error -i $FR/video_only.mp4 -i $AB/master.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -t $DUR \
  -movflags +faststart output/master_$NAME
ffmpeg -y -v error -i output/master_$NAME -map 0 -c:v libx264 -preset slow -crf 18 -maxrate 10000k -bufsize 20000k -profile:v high -level 4.2 \
  -pix_fmt yuv420p -r 30 -c:a copy -t $DUR -metadata title="Off-plan in Abu Dhabi — 35s guide ($V)" -movflags +faststart output/$NAME
# sidecar subtitles (accurate English captions for Instagram's caption upload / accessibility)
node -e "
const R=require('./scene/$RJ.json'),N=require('./audio/$NJ.json'),D=require('./audio/$VD/durations.json');
const f=s=>{const h=Math.floor(s/3600),m=Math.floor(s/60)%60,x=(s%60).toFixed(3).padStart(6,'0').replace('.',',');return '00:'+String(m).padStart(2,'0')+':'+x;};
let i=1,o='';for(const L of N.lines){const a=R.vo[L.id],b=a+D[L.id];o+=(i++)+'\n'+f(a)+' --> '+f(b)+'\n'+L.text+'\n\n';}
require('fs').writeFileSync('output/$SRT',o);"
echo "wrote output/$NAME"
