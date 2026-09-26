# CPL Funding in Motion

A 90-second animated guide for colleges on how CPL implementation funding works: animated text, a score generated in the browser, the MAP logo's red arrow flying the guide, and a closing link to the funding model explainer. One built page and one MP4 per scenario, from one source.

## Files

- `funding_in_motion.src.html`: THE source. The animation, the score and the arrow's flight live here once. Placeholders (`__CFG__`, `__LOGO__`, `__MAP__`, `__ARROW__`, the page chrome) are filled by `build.py`.
- `build.py`: holds `CONFIG`, one entry per scenario: the priorities scene, Sample College's target, the explainer link and the page chrome. `python3 prototype/funding_video/build.py` builds Scenario 1; `build.py s2` builds Scenario 2.
- `funding_in_motion.html`, `funding_in_motion_s2.html`: the built pages, every image inlined.
- `20260926_CPL_Funding_in_Motion.mp4`, `20260926_CPL_Funding_in_Motion_Scenario_2.mp4`: 1920×1080, 30 fps, 91 seconds, with music.
- `assets/map_wordmark.png`: the MAP wordmark, cut from Sam's logo file with the red arrow removed and the background made transparent. `assets/map_arrow.png`: the arrow.

## The scenarios

- **Scenario 1** (the published scenario, config read 2026-09-24): Access 33%, Completion 34%, Career attainment 33%. Sample College's Access target 44.3 FTES behind $112,484; half is 22.2 FTES for $56,242.
- **Scenario 2** (stored 2026-09-25): Access 50%, Completion 50%; Career attainment and innovation projects is a reported card, funded statewide through the project allocation. Sample College's Access target 67.1 FTES behind $170,431; half is 33.6 FTES for $85,216.

Sample College uses Chaffey College's figures. Every figure is typed from the engine under the stored scenario config on its date; nothing is read live. If a dial moves, update `CONFIG` in `build.py` and re-render.

## The lockup, the arrow, the score

- The lockup leads with the CPL Initiative logo, the largest mark (Sam, 2026-09-26: the CPL Initiative logo stays most prominent; the MAP logo plays second fiddle with special treatment). Beneath a rule sits the MAP wordmark at three-fifths the width, with the platform's long name and tagline as text.
- The arrow starts nested in the A, flies every scene pointing at the figure in play, laps the lockup at the close and settles back into the A. Sam's reading (2026-09-26): a student searching for its pathway, and CPL helps it speed and find its direction home. A trail of seven fainter, smaller copies samples the arrow's own path 40 ms apart, so it reads as a small ship under way and the wake follows through turns. The path is a keyframe list (`buildK`) in stage units; the home is measured from the wordmark's rendered box, so a change to the lockup's CSS moves the nest with it.
- The score is orchestral: strings with a slow bow and vibrato, French horns leading (a saw and a triangle through a dark low-pass and a formant peak; the fanfare doubled an octave down), contrabass with a sub octave, timpani with a felt thump, pizzicato, a light bell, and from bar 2 a driving march snare (eighths weighted on 2 and 4, a sixteenth roll into every second bar), in the spirit Sam named. Measured offline on 2026-09-26: peak 0.96, no clipped samples.

## Rendering

`render.sh [s2]` re-renders an MP4, in about 5 minutes. It fetches the two fonts from npm, renders the score offline to WAV, captures every frame in headless Chromium, and encodes with ffmpeg (libx264 and aac). Playwright's bundled ffmpeg has neither codec; point `FFMPEG` at the `imageio-ffmpeg` wheel's binary:

    FFMPEG=$(python3 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())") bash prototype/funding_video/render.sh
    FFMPEG=... bash prototype/funding_video/render.sh s2

The explainer links Scenario 1's guide by default and Scenario 2's when it shows Scenario 2 (`?scenario=Scenario%202`). Before production, change `BASE` in `build.py` to the public repo's address, rebuild and re-render.
