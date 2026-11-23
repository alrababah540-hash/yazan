#!/usr/bin/env bash
# Assemble 4K segments + mastered audio → output/abu_dhabi_real_estate_27s_4k.mp4 (+ 1080p), then hard-verify 27.00 s.
set -euo pipefail
cd "$(dirname "$0")/.."
FR=frames_3840; OUTV=output/abu_dhabi_real_estate_27s_4k.mp4; OUTH=output/abu_dhabi_real_estate_27s_1080p.mp4
ls $FR/seg_*.mp4 | sort | sed "s|^|file '$PWD/|; s|$|'|" > $FR/list.txt
ffmpeg -y -v error -f concat -safe 0 -i $FR/list.txt -c copy $FR/video.mp4
NF=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $FR/video.mp4)
[ "$NF" = "810" ] || { echo "video has $NF frames, expected 810"; exit 1; }
# two-pass loudness normalisation (−14 LUFS integrated, −1 dBTP), trimmed to exactly 27 s
J=$(ffmpeg -hide_banner -i audio/build/mix.wav -af loudnorm=I=-14:TP=-1.0:LRA=9:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
g() { echo "$J" | python3 -c "import sys,json; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -y -v error -i audio/build/mix.wav -af "loudnorm=I=-14:TP=-1.0:LRA=9:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000,atrim=0:27,apad=whole_dur=27" -ar 48000 audio/build/master.wav
mkdir -p output
ffmpeg -y -v error -i $FR/video.mp4 -i audio/build/master.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 16 -profile:v high -level 5.1 -pix_fmt yuv420p -r 30 \
  -x264-params keyint=60:min-keyint=30 -c:a aac -b:a 320k -ar 48000 -t 27 -movflags +faststart -metadata title="Abu Dhabi Real Estate – From UAE to Investment Opportunities" $OUTV
ffmpeg -y -v error -i $OUTV -vf scale=1920:1080:flags=lanczos -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -r 30 -c:a copy -t 27 -movflags +faststart $OUTH
for f in $OUTV $OUTH; do
  python3 tools/validate.py "$f"
done
