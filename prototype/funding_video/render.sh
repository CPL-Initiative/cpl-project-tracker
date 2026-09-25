#!/usr/bin/env bash
# Renders the MP4: bash prototype/funding_video/render.sh  (about 5 minutes)
# Needs node 22+, headless Chromium (CHROME=...), npm, and an ffmpeg with libx264 + aac (FFMPEG=...).
set -euo pipefail
cd "$(dirname "$0")"
FFMPEG=${FFMPEG:-ffmpeg}
mkdir -p .fonts && ( cd .fonts && for p in playfair-display source-sans-3; do [ -d $p ] || { npm pack -q @fontsource/$p@5.3.0 >/dev/null && mkdir $p && tar xzf fontsource-$p-5.3.0.tgz -C $p --strip-components 1; }; done )
python3 build.py --render
rm -rf .frames && node render.mjs
OUT=$(date +%Y%m%d)_CPL_Funding_in_Motion.mp4
"$FFMPEG" -y -hide_banner -loglevel error -framerate 30 -i .frames/f%05d.jpg -i .music.wav -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -af "afade=t=out:st=89:d=2" -t 91 -movflags +faststart "$OUT"
rm -rf .frames .music.wav render.html
echo "wrote prototype/funding_video/$OUT"
