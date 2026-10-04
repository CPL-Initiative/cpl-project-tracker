#!/usr/bin/env bash
# Renders the MP4: bash prototype/ironworker_video/render.sh  (about 5 minutes)
# It writes the file the page's Download link names (`mp4` in build.py's CONFIG), so a re-version is named there once.
# The frame capture is the funding film's: ../funding_video/render.mjs drives headless Chromium over DevTools from
# this folder (it reads PAGE and writes .frames/, .music.wav and .dur in the working directory).
# Needs node 22+, headless Chromium (CHROME=...), npm, and an ffmpeg with libx264 + aac (FFMPEG=...):
#   FFMPEG=$(python3 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())")
set -euo pipefail
cd "$(dirname "$0")"
FFMPEG=${FFMPEG:-ffmpeg}
mkdir -p .fonts && ( cd .fonts && for p in playfair-display source-sans-3; do [ -d $p ] || { npm pack -q @fontsource/$p@5.3.0 >/dev/null && mkdir $p && tar xzf fontsource-$p-5.3.0.tgz -C $p --strip-components 1; }; done )
python3 build.py --render
rm -rf .frames && PAGE="render.html" node ../funding_video/render.mjs
OUT=$(python3 -c "import json,re,sys; print(json.loads(re.search(r'CFG=(\{[\s\S]*?\});', open(sys.argv[1], encoding='utf8').read()).group(1))['mp4'])" ironworker_in_motion.html)
DUR=$(cat .dur); END=$(python3 -c "print(round($DUR+1,2))"); FADE=$(python3 -c "print(round($DUR-1,2))")
"$FFMPEG" -y -hide_banner -loglevel error -framerate 30 -i .frames/f%05d.jpg -i .music.wav -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -af "afade=t=out:st=$FADE:d=2" -t "$END" -movflags +faststart "$OUT"
rm -rf .frames .music.wav .dur render.html
echo "wrote prototype/ironworker_video/$OUT"
