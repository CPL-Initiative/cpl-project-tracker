# CPL Funding in Motion

A 90-second animated guide for colleges on how CPL implementation funding works: animated text, a celebratory score generated in the browser, and a closing link to the funding model explainer.

- `funding_in_motion.src.html`: the source. Edit the script, figures and music here.
- `funding_in_motion.html`: the built page, with the logo inlined. Rebuild with `python3 prototype/funding_video/build.py`.
- `20260925_CPL_Funding_in_Motion.mp4`: 1920×1080, 30 fps, 91 seconds, with music.
- `render.sh`: re-renders the MP4, in about 5 minutes. It fetches the two fonts from npm, renders the score offline to WAV, captures every frame in headless Chromium, and encodes with ffmpeg (libx264 and aac).

The dollar figures and dates are typed into the script from the funding model as of September 24, 2026. They are not read live. If the model's settings change, update `funding_in_motion.src.html` and re-render. Sample College uses Chaffey College's figures.

Before production, change `EXPLAINER` in the source, and the link below the player, to the public repo's address, then rebuild and re-render.
