#!/usr/bin/env bash
# Concat 1440x2560 segments → Lanczos to 1080x1920 (supersampled), master audio −14 LUFS, mux, hard-check 20.000 s.
set -euo pipefail; cd "$(dirname "$0")/.."
FR=frames_1440; OUT=output/yas_island_ep01_20s_1080x1920.mp4
ls $FR/seg_*.mp4 | sort | sed "s|^|file '$PWD/|; s|$|'|" > $FR/list.txt
ffmpeg -y -v error -f concat -safe 0 -i $FR/list.txt -c copy $FR/video.mp4
J=$(ffmpeg -hide_banner -i audio/build/mix.wav -af loudnorm=I=-14:TP=-1.0:LRA=9:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
g() { echo "$J" | python3 -c "import sys,json; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -y -v error -i audio/build/mix.wav -af "loudnorm=I=-14:TP=-1.0:LRA=9:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000,atrim=0:20,apad=whole_dur=20" -ar 48000 audio/build/master.wav
ffmpeg -y -v error -i $FR/video.mp4 -i audio/build/master.wav -map 0:v -map 1:a \
  -vf "scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int,unsharp=5:5:0.35:5:5:0.0,format=yuv420p" \
  -c:v libx264 -preset slower -tune film -crf 14 -profile:v high -level 4.2 -r 30 -x264-params keyint=60:min-keyint=30 -maxrate 25M -bufsize 50M \
  -c:a aac -b:a 320k -ar 48000 -t 20 -movflags +faststart -metadata title="Yas Island — The Investment Behind 44 Million Visits (Island Investment Series Ep.01)" -metadata artist="Yazan Aljalamneh · Expora Realty" $OUT
cp audio/build/master.wav output/yas_island_ep01_voiceover_and_mix_master.wav
ffmpeg -y -v error -i audio/build/vo.wav -c:a pcm_s16le output/yas_island_ep01_voiceover_only.wav
python3 tools/validate.py $OUT
