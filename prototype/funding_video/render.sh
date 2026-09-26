#!/usr/bin/env bash
# Renders the MP4: bash prototype/funding_video/render.sh [s2]  (about 5 minutes each)
# Needs node 22+, headless Chromium (CHROME=...), npm, and an ffmpeg with libx264 + aac (FFMPEG=...).
# Playwright's bundled ffmpeg has neither; the imageio-ffmpeg wheel's binary has both:
#   FFMPEG=$(python3 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())")
set -euo pipefail
cd "$(dirname "$0")"
FFMPEG=${FFMPEG:-ffmpeg}
VARIANT=${1:-s1}
SUFFIX=""; NAME="CPL_Funding_in_Motion"
if [ "$VARIANT" != "s1" ]; then SUFFIX="_$VARIANT"; NAME="CPL_Funding_in_Motion_Scenario_${VARIANT#s}"; fi
mkdir -p .fonts && ( cd .fonts && for p in playfair-display source-sans-3; do [ -d $p ] || { npm pack -q @fontsource/$p@5.3.0 >/dev/null && mkdir $p && tar xzf fontsource-$p-5.3.0.tgz -C $p --strip-components 1; }; done )
python3 build.py "$VARIANT" --render
rm -rf .frames && PAGE="render$SUFFIX.html" node render.mjs
OUT=$(date +%Y%m%d)_$NAME.mp4
"$FFMPEG" -y -hide_banner -loglevel error -framerate 30 -i .frames/f%05d.jpg -i .music.wav -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -af "afade=t=out:st=89:d=2" -t 91 -movflags +faststart "$OUT"
rm -rf .frames .music.wav "render$SUFFIX.html"
echo "wrote prototype/funding_video/$OUT"
