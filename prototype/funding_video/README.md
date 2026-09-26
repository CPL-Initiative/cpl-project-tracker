# CPL Funding in Motion

A 90-second animated guide for colleges on how CPL implementation funding works: animated text, a score generated in the browser, and a closing link to the funding model explainer. One page and one MP4 per scenario.

## Scenario 1

- `funding_in_motion.src.html`: the source. Edit the script, figures and music here.
- `funding_in_motion.html`: the built page, with the logo inlined. Rebuild with `python3 prototype/funding_video/build.py`.
- `20260925_CPL_Funding_in_Motion.mp4`: 1920×1080, 30 fps, 91 seconds, with music.

## Scenario 2

- `funding_in_motion_s2.src.html`: the source. Two priorities carry the funding (Access 50%, Completion 50%); Career attainment and innovation projects are a reported card, funded statewide through the project allocation. Sample College's Access target reads 67.1 FTES behind $170,431, half of it 33.6 FTES for $85,216, computed from the engine under the stored Scenario 2 config on 2026-09-26.
- `funding_in_motion_s2.html`: the built page. Rebuild with `python3 prototype/funding_video/build.py s2`.
- `20260926_CPL_Funding_in_Motion_Scenario_2.mp4`: 1920×1080, 30 fps, 91 seconds, with music.
- The logo lockup is the MAP wordmark (`assets/map_wordmark.png`, cut from Sam's logo file with the red arrow removed and the background made transparent), the platform's long name and tagline as text, and the CPL Initiative logo beneath. The arrow (`assets/map_arrow.png`) is its own element: it starts nested in the A, flies through every scene pointing at the figure in play, laps the lockup at the close and settles back into the A. Its path is a keyframe list in the source (`K`), in stage units.
- The score is orchestral rather than synth: strings with a slow bow and vibrato, French horns (a saw and a triangle through a dark low-pass and a formant peak), contrabass with a sub octave, timpani with a felt thump, pizzicato, and a light bell. The mix was measured offline: peak 0.91, no clipped samples, 46% of the energy under 120 Hz.
- The explainer links this guide when it shows Scenario 2 (`?scenario=Scenario%202`).

## Rendering

`render.sh [s2]` re-renders an MP4, in about 5 minutes. It fetches the two fonts from npm, renders the score offline to WAV, captures every frame in headless Chromium, and encodes with ffmpeg (libx264 and aac). Playwright's bundled ffmpeg has neither codec; point `FFMPEG` at the `imageio-ffmpeg` wheel's binary:

    FFMPEG=$(python3 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())") bash prototype/funding_video/render.sh s2

The dollar figures and dates are typed into each script from the funding model as of its render date. They are not read live. If a scenario's settings change, update that scenario's source and re-render. Sample College uses Chaffey College's figures.

Before production, change `EXPLAINER` in each source, and the link below the player, to the public repo's address, then rebuild and re-render.
