#!/usr/bin/env bash
# Re-download large third-party assets that are not committed to git.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p tts
if [ ! -f tts/vits-piper-ar_JO-kareem-medium/ar_JO-kareem-medium.onnx ]; then
  curl -L -o tts/kareem.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-ar_JO-kareem-medium.tar.bz2
  tar xjf tts/kareem.tar.bz2 -C tts && rm tts/kareem.tar.bz2
fi
pip install piper-tts==1.8.0 numpy soundfile shapely
# Optional, only for re-clipping the map data (data/abudhabi_land.json is committed):
#   npm pack @geo-maps/earth-lands-100m@0.6.0 && tar xzf geo-maps-earth-lands-100m-0.6.0.tgz
#   python3 clip_geo.py package/map.geo.json ../data/abudhabi_land.json 0
# Optional, only for the ASR intelligibility check:
#   curl -L https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-small.tar.bz2 | tar xj
echo "assets ready"
