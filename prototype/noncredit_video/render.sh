#!/usr/bin/env bash
# Renders an MP4: bash prototype/noncredit_video/render.sh [narrated]  (about 5 minutes for the music cut; the narrated cut longer)
# It writes the file the page's Download link names (`mp4` in build.py's CONFIG), so a re-version is named there once.
# The frame capture is the funding film's: ../funding_video/render.mjs drives headless Chromium over DevTools from
# this folder (it reads PAGE and writes .frames/, .music.wav and .dur in the working directory).
# Needs node 22+, headless Chromium (CHROME=...), npm, and an ffmpeg with libx264 + aac (FFMPEG=...):
#   FFMPEG=$(python3 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())")
set -euo pipefail
cd "$(dirname "$0")"
FFMPEG=${FFMPEG:-ffmpeg}
VARIANT=${1:-}
SUFFIX=""; if [ -n "$VARIANT" ]; then SUFFIX="_$VARIANT"; fi
mkdir -p .fonts && ( cd .fonts && for p in playfair-display source-sans-3; do [ -d $p ] || { npm pack -q @fontsource/$p@5.3.0 >/dev/null && mkdir $p && tar xzf fontsource-$p-5.3.0.tgz -C $p --strip-components 1; }; done )
python3 build.py $VARIANT --render
rm -rf .frames && PAGE="render$SUFFIX.html" node ../funding_video/render.mjs
OUT=$(python3 -c "import json,re,sys; print(json.loads(re.search(r'CFG=(\{[\s\S]*?\});', open(sys.argv[1], encoding='utf8').read()).group(1))['mp4'])" "noncredit_in_motion$SUFFIX.html")
DUR=$(cat .dur); END=$(python3 -c "print(round($DUR+1,2))"); FADE=$(python3 -c "print(round($DUR-1,2))")
if [ -n "$VARIANT" ]; then
  # the narrated cut: the voice over the score's bed, and the captions as a subtitle track a viewer can switch off;
  # loudnorm brings it to the music cut's level, as the funding film's narrated cuts do
  "$FFMPEG" -y -hide_banner -loglevel error -framerate 30 -i .frames/f%05d.jpg -i .music.wav -i narration.mp3 -i ".captions$SUFFIX.srt" \
    -filter_complex "[1:a][2:a]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95,afade=t=out:st=$FADE:d=2,loudnorm=I=-17:TP=-1.5:LRA=11,aresample=44100[a]" \
    -map 0:v -map "[a]" -map 3:s -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k \
    -c:s mov_text -metadata:s:s:0 language=eng -t "$END" -movflags +faststart "$OUT"
else
  "$FFMPEG" -y -hide_banner -loglevel error -framerate 30 -i .frames/f%05d.jpg -i .music.wav -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
    -c:a aac -b:a 192k -af "afade=t=out:st=$FADE:d=2" -t "$END" -movflags +faststart "$OUT"
fi
rm -rf .frames .music.wav .dur .captions*.srt "render$SUFFIX.html"
echo "wrote prototype/noncredit_video/$OUT"
