# CPL Funding in Motion

A 90-second animated introduction for colleges to how CPL implementation funding works: animated text, a score generated in the browser, the MAP logo's red arrow flying the whole piece and shooting down barriers to CPL between scenes, and a closing link to the funding model explainer. It is an introduction (Sam, 2026-09-26: "a guide would be much longer and more detailed"); detailed guidance follows separately. One built page and one MP4 per scenario, from one source.

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

## The page

The player opens filling the window: the stage takes the largest 16:9 box that leaves one row of controls on screen, and the page header and scene list sit below it. The controls carry Play, Replay, a scrubber, Mute, **Full screen** (the player, stage and controls, takes the whole screen) and **Download MP4** (the scenario's MP4, `mp4` in `CONFIG`). The big Play button enters full screen and plays in one click, the one gesture a browser accepts for full screen; Esc leaves. Type and marks are sized to fill the frame: at 1920 wide a body line is 63 px and a headline 115 px (Sam, 2026-09-26: "sized to fill the screen for readability and dramatic effect").

## The lockup, the arrow, the barriers, the score

- The lockup leads with the CPL Initiative logo, the largest mark (Sam, 2026-09-26: the CPL Initiative logo stays most prominent; the MAP logo plays second fiddle with special treatment). Beneath a rule sits the MAP wordmark at three-fifths the width, with the platform's long name and tagline as text.
- The arrow starts nested in the A, flies every scene pointing at the figure in play (each keyframe is where its TIP points, and most are MEASURED from the element in play at a settled moment of its scene, so a layout change carries the arrow with it), laps the lockup at the close and settles back into the A. Sam's reading (2026-09-26): a student searching for its pathway, and CPL helps it speed and find its direction home. A trail of seven fainter, smaller copies samples the arrow's own path 40 ms apart, so it reads as a small ship under way and the wake follows through turns. The path is a keyframe list (`buildK`) in stage units; the home is measured from the wordmark's rendered box, so a change to the lockup's CSS moves the nest with it.
- The barriers (Sam, 2026-09-26: the arrow "might even fire at barriers to CPL we hope to bring down... like the old Space Invaders arcade game... have to be sly with it"): five pixel invaders in muted gray, one at each of five scene seams (`ENC`), each captioned with a barrier (Retaking what you know, No transcript on file, Nobody to ask, Unclear local policy, Credit left on the table). Each drops in, marches a step, and the arrow comes under it and fires once; the invader bursts into its own pixels and the caption is struck through. About a second each, placed where the next scene has not yet drawn, so they read as a wink. A small shot and a pop in the key sit under the orchestra. Reduced motion shows none.
- The score is orchestral and BUILDS over one four-bar theme (Sam, 2026-09-26: "should build rather than just repeat--don't be afraid to be more creative"): a horn call alone (0:00); the theme on bell and pizzicato (0:05); the theme in the strings as the snare enters on the backbeat (0:14); a new progression with a horn countermelody and the full march (0:24); the theme in the horns with driving bass eighths (0:43); a breakdown in B minor, drums out but a timpani heartbeat, climbing into a snare roll (1:02); and the theme recast over I-V-vi-IV a whole step up in D with brighter horns (1:12), ending on a D major chord. The instruments: strings with a slow bow and vibrato, French horns leading (a saw and a triangle through a dark low-pass and a formant peak; the fanfare doubled an octave down), contrabass with a sub octave, timpani with a felt thump, pizzicato, a light bell, and a march snare (eighths weighted on 2 and 4, sixteenth rolls into the bar) in the spirit Sam named; the horns open their filter for the last statement, nearer a trumpet. Measured offline on 2026-09-26, section by section (RMS, dBFS): intro -24.4, A1 -23.9, A2 -21.7, B -20.8, C -17.4, breakdown -23.6, last statement -16.3; peak 0.81, no clipped samples. If you rebalance, keep that climb: the first mix opened louder than its first theme section.

## The narrated draft

A narrated cut of Scenario 1 is in draft beside the introductions (Sam, 2026-09-26: "a natural feminine voice-over that follows a script your write... tone down the music to just background level... slow down and lengthen the timing a bit to accommodate readability and narration"). It is built from the same source as variant `n1`: `funding_in_motion_n1.html` and `20260926_CPL_Funding_in_Motion_Narrated_Draft.mp4`, three minutes long. The script and the build plan are in `20260926_Narration_Script_Draft.md`.

    pip install kokoro-onnx soundfile imageio-ffmpeg
    python3 prototype/funding_video/narrate.py --check   # the phonemes only, in seconds
    python3 prototype/funding_video/narrate.py           # about a minute: narration_s1.mp3 and narration_s1_layout.json
    python3 prototype/funding_video/build.py n1          # the page
    FFMPEG=... bash prototype/funding_video/render.sh n1 # the MP4, about 12 minutes

**The voice.** `narrate.py` reads `narration_s1.json` with Kokoro-82M's Heart voice (`af_heart`, Apache-2.0), locally; the first run downloads the model (about 350 MB) from huggingface.co into `~/.cache/kokoro` (`KOKORO_DIR`). The spoken form departs from the written script where the voice needs it to: acronyms are unspaced (`CPL`, `EDD`, `FTES`) so each reads as one quick word, MAP is written `map` because capitals spell it out, and years are words because digits read as "two thousand". `phoneme_fixes` corrects what spelling cannot (unspaced `FTES` reads as the word "eftess", and each year takes a lighter stress on its twenties); every fix must fire, and `never` lists the readings Sam rejected in v2 ("stilted, especially when sounding out C-P-L... same with sounding out the year numbers"), so a run that still carries one fails. A local transcription (`faster-whisper`, model `small`) hears v3 as written, and each "CPL" takes 570 ms against v2's 702 ms.

**The clock.** The narration drives it: `narrate.py` lays each scene out as a lead-in (1.0 s; 1.4 s for the title), its clip, and air (0.8 s; 3.4 s at the close), per `layout` in the JSON, and writes the voice as one track on that timeline (`narration_s1.mp3`) with the layout beside it (`narration_s1_layout.json`, committed because the page and the MP4 are built from it). In the page, `ft()` maps the player's time to the film's, so each scene's picture stretches across its narrated span and every reveal, barrier and arrow keyframe keeps its place in its scene; `nt()` maps the other way for the chapters and the score. The 90-second introductions have no layout and run exactly as before.

**The score.** Under narration it is a bed, 14 dB down, and dips 6 dB more under the voice (`duck()`), easing over 0.4 s at each edge. Its sections keep their tempo and arrive just ahead of the scenes they belong to, repeating more of their phrase where a scene runs longer; every rule that named a bar of the 90-second score (the crash into each section, the swell out of it, the bells from the middle of B) now names a position within its section. Measured against the previous source, the introductions' score keeps all 1,293 events with the same times, pitches and voices; four gains differ in the seventeenth decimal place, from floating-point rounding.

**Captions.** Each scene's text is cut at sentences, and a long sentence at its commas, into cues of about two lines, timed by phoneme count and snapped to the pauses the voice leaves; they write MAP where the voice reads "map". The page shows them over the stage with a Hide captions control; the MP4 carries them as a subtitle track a viewer can switch off. The closing scene says the voice is synthetic.

## Rendering

`render.sh [s2]` re-renders an MP4, in about 5 minutes. It fetches the two fonts from npm, renders the score offline to WAV, captures every frame in headless Chromium, and encodes with ffmpeg (libx264 and aac). Playwright's bundled ffmpeg has neither codec; point `FFMPEG` at the `imageio-ffmpeg` wheel's binary:

    FFMPEG=$(python3 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())") bash prototype/funding_video/render.sh
    FFMPEG=... bash prototype/funding_video/render.sh s2

The explainer links Scenario 1's guide by default and Scenario 2's when it shows Scenario 2 (`?scenario=Scenario%202`). Before production, change `BASE` in `build.py` to the public repo's address, rebuild and re-render.
