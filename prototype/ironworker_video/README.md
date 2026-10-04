# Ironworker Pathway in Motion

A 100-second film of one pathway at Cerritos College, high school to a bachelor's degree, with the credit for prior learning (CPL) at each step. It is the CPL Pathways proof of concept (Sam, 2026-10-04 18:23Z: Cerritos Ironworker, high school to career) told the way the funding introduction tells the funding model. Sam asked for it at ~19:55Z: *"Would love to have a 100-second video like the one we did for the funding model for this use case...but we can play with that at the stage you recommend."* The stage came when the Cerritos runner reads confirmed the ladder's lines (S329-S330). Draft v1, S330; it waits on Sam's review.

## Files

- `ironworker_in_motion.src.html`: the source. The engine (motion helpers, the logo lockup, the arrow and its trail, the pixel barriers, the score, the player) is the funding film's `prototype/funding_video/funding_in_motion.src.html`, forked; the scenes, the barriers' timing, the arrow's flight and the score's section order are this film's.
- `build.py`: `FACTS` holds every figure on screen with its source, and `CONFIG` the page and the barriers. `python3 build.py` writes `ironworker_in_motion.html` (every image inlined); `--render` also writes the 1920×1080 frame page.
- `render.sh`: the MP4, through the funding film's `render.mjs` (headless Chromium, the score rendered offline, ffmpeg). About five minutes. `FFMPEG` must point at a build with libx264 and aac (the `imageio-ffmpeg` wheel's binary).
- `20261004_Ironworker_Pathway_in_Motion_v1.mp4`: 1920×1080, 30 fps, 101 seconds, with music.

## What it says, and what it leaves out

**Only lines the ladder marks *In our data*** (`cpl_pathways_data.js`, `cerritos-ironworker-ladder`), and the display build's A.S. figure (`cpl_pathways_roep_data.js`, `cerritos_42158`). Nine scenes: the title; high school (Columbus High's welding pathway maps to WELD 160 and WELD 100, 3.5 units; Cerritos's two routes, credit by exam for an articulated course or dual enrollment); the apprenticeship (four years, 878 and 898 classroom hours, 22 IWAP courses this fall, credited through CPL); the two certificates; the A.S., the turn of the film (up to 31.5 of the major's 34-38 units through CPL Cerritos has articulated; 15 of 24 courses); the B.S. (approved, Spring 2027, its admission rule); the career (median wages, 1,810 supervisor openings); a recap; the close, linked to CPL Pathways in the web player.

**Left out on purpose:** the noncredit step (the Pre-Apprenticeship certificate admits registered apprentices only, and Schedule+ lists no section of the 26 mirror courses this year, so in a high-school-to-career film it would read as an open door that is not); the B.S.'s 2024 proposed course list (a proposal reads as fact on screen); the route Columbus High uses (still To confirm, so the scene names both routes and claims neither); "a degree" for the A.S. figure (34-38 is the major; general education sits beside it).

**The storyboard took Fable's critique** (S330, under Sam's scheduled-session terms: a design judgment with nothing to score against). Taken: the A.S. figure as the turn and the score's peak; cut noncredit; cut the proposed B.S. list; show 3.5 units, never the 30-unit cap beside two courses; "median" on every wage and the two regions' openings beside their sum; each barrier answered by the scene it opens, four words or fewer; a recap before the close; close on a bachelor's degree, never on a job outcome no source confirms. Corrected against our data: Fable's "Credit by Exam, B or better: 3.5 units" asserted Columbus High's route; "Credit by Exam" for the apprenticeship is not a verified line (MAP's articulated exhibits are); "nearly a whole degree" overstated the major; "the A.S. credit carries into the lower division" comes from the B.S. map's discussion draft, not a data line.

## The barriers

Five, each at the top of the scene whose fact brings it down: *Retaking high school welding* (high school), *Four years, zero units* (the apprenticeship), *A degree from zero* (the A.S.), *Nothing past the A.S.* (the B.S.), *Same job, same wage* (the career).

## The score

The funding film's orchestra and theme, in this film's order: the horn call; the theme on bell and pizzicato under high school; the strings and snare under the apprenticeship; the horn countermelody under the certificates; the theme in the horns under the A.S., its peak; the last statement a whole step up under the B.S. and the career; the breakdown, quiet, under the recap, climbing into the closing chord as the lockup lands at 90 s. The beat is 90/148 s so 37 bars end exactly there. Measured on v1 (mean volume per scene, dBFS): intro -23.6, high school -24.4, apprenticeship -21.8, certificates -20.4, A.S. -17.2, B.S. and career -16.8, recap -22.6, close -21.1; peak -2.9, no clipped samples. If you rebalance, keep the climb to the A.S.

## To change it

Edit a line in `FACTS` when its ladder line changes, then `python3 build.py` and `render.sh`. A re-version keeps the date code and takes a version suffix (`..._v2.mp4`), named once in `CONFIG['mp4']`.
