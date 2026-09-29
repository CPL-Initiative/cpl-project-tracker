---
title: CPL Student Portal "Credit for Being You" video — audio restoration & accessibility lessons
date: 2026-07-23
tags: [video, audio, accessibility, captions, ffmpeg, cpl-student-portal, side-lane, sky-vid]
artifacts:
  - "polish plan artifact: https://claude.ai/code/artifact/2222f015-6251-4e3a-87f5-9ebd950f1889"
  - "deliverables handed to Sam directly (not committed): CPLPortalOverview_MASTER.mp4 (+no-captions), .vtt/.srt, transcript.txt, README"
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-recover-music-bed-by-voice-stem-subtraction]]"
  - "[[docs/kb-notes/methodology-warm-a-tinny-voiceover-measured-eq]]"
  - "[[docs/cpl_portal_video_handoff]]"
---

# CPL Student Portal video — audio restoration & accessibility (SkyVid, 2026-07-23)

> Sam asked me to "work some magic" on the new CPL Student Portal
> (**creditforbeingyou.org**) 1:51 intro video — accessibility, animation/music
> upgrades (open source), "cool and inviting, not salesy" — and to advise
> whether the job was for Claude Code (CC) or Claude Design. Everything below
> was done in-session with `ffmpeg` + `numpy`; **no repo code was touched** and
> the video files were delivered to Sam directly (not committed — large binaries,
> not repo-appropriate).

## What the source was

A 1080p/25fps H.264 **screen recording** of the live portal (very low
motion/bitrate) with an embedded voiceover, walking through: Home → Profile
Builder → CPL Matches Dashboard → Map View → Request Review → Student Intake →
Meet Sierra → the `creditforbeingyou.org` end card. Uploads: the edited `.mp4`,
the narration `.m4a` (identical to the video's audio), an auto-generated `.vtt`,
and a `recording.conf`.

## What shipped (3 passes + a fade)

1. **Captions / accessibility.** The auto-`.vtt` had real errors —
   **CLAP→CLEP**, **CDL→CPL**, **credit4Beingu.org→creditforbeingyou.org** — and
   several 15–16 s run-on cues that blow past caption reading-speed limits.
   Rebuilt into **22 WCAG-clean cues** (≤2 lines, ≤~44 char/line, ≤~20 cps, no
   overlaps), plus a `.srt` and a plain-text transcript (a Section-508
   expectation for public CCC media). Validated programmatically.

2. **Voice de-tinny (warmth).** The narration sat at **−18.7 LUFS** and read
   "tinny" — a Zoom-mic high-pass (nothing below ~120 Hz) + 84 kbps AAC with a
   **hard ~12 kHz brick-wall** (the "small speaker" quality). *Measured band
   energy + a spectrogram first* so as not to boost frequencies that were filtered
   out. Built **Warm** (natural) and **Broadcast** (fuller + light compression)
   variants via measured EQ; Sam picked **Broadcast**, then asked for "warmer
   still" → a **Warmer** pass (more 120–210 Hz body, gently darker top, mud kept
   in check). Two-pass loudnorm; low end came up **~3–4.5 dB relative to the
   vocal peak**, peak-safe. Method → KB note
   `methodology-warm-a-tinny-voiceover-measured-eq`.

3. **Music.** Sam believed the edit had music; the **exported cut did not** — a
   silence scan found the track drops to true silence in ~12 places (a 3.4 s
   silent intro, 4 s silent outro), which a continuous music bed can't do. The
   music lived only in a **separate higher-quality export** he then sent
   (`...Track1volumemid...`), where it's **mixed onto the same tinny voice**.
   Sam's **YouTube link and Demucs (stem-separation) model hosts were both
   proxy-blocked (403)**, so the music was recovered by **subtracting the clean
   voice stem from the mixed export**: `music = mix − 1.30·voice` (lag-0
   alignment, gain from least-squares, consistent across regions → 15–20 dB voice
   cancellation). The **warm** voice was then re-laid on top, giving *warm voice +
   untouched original music* with no ML and no re-encode of the music. Method →
   KB note `methodology-recover-music-bed-by-voice-stem-subtraction`.

4. **Balance + fade.** Because the extraction left music and voice as separate
   stems, rebalancing was free: Sam wanted the bed louder → **+7 dB with gentle
   sidechain ducking** (music eases under speech, blooms in intro/outro/pauses),
   an A/B level picker (+4/+7/+10). Final: **−16.5 LUFS, peak-safe**. Then he
   asked to extend the end so the music **fades rather than cuts** → a **2 s
   frozen end-card** + a music fade-out to silence.

## Tool advice given (the "CC or Claude Design?" answer)

Both, plus one editor. **Claude Code** = the deterministic engine
(captions/transcript/loudness/mixing/encoding — done). **Claude (app)** = visual
concepting (an on-brand animated intro + end card as an HTML/CSS artifact you
screen-record, lower-thirds, thumbnail). **DaVinci Resolve** (free) = the
timeline (guided zoom-to-cursor, dissolves, callouts). Neither Claude surface
*renders* a finished motion-graphics video end-to-end. The full beat-by-beat
motion plan + open-source music sources + accessibility checklist live in the
**polish-plan artifact** (link in frontmatter).

## Gotchas worth keeping

- **`ffmpeg -map 0:a` breaks image outputs** (`showspectrumpic`/`showwavespic`):
  the audio map conflicts with the single image stream → "encoder not found."
  Drop `-map` for spectrogram/waveform PNGs.
- **`sidechaincompress` `makeup` range is [1,64]** — `makeup=0` errors; use
  `makeup=1` for unity.
- **Send-size limit:** the full zip (two 22 MB videos) exceeded the 30 MB upload
  cap. Re-encoding the extended master with `libx264 -crf 18` dropped it to
  ~6 MB (screen content compresses hard), so the whole package then fit.
- **Loudnorm can't hit −16 on a peaky VO without limiting** — a transparent
  two-pass lands ~−17 when the true-peak ceiling binds; that's the honest stop.

## Current state / roadmap

**DONE & delivered:** warm-voice + original-music master (music +7 dB ducked, end
fade, extended end card), corrected `.vtt`/`.srt`, transcript, README, packaged
zip. Audio + accessibility pass is complete and publish-ready.

**Parked (Sam can pick up anytime):** the motion pass — animated kinetic-type
**intro** + clean **end card** (remove the stray cursor), guided **zoom-to-cursor**
across the screen-recorded sections, count-up on the 47-matches beat, map-pin
drop-in, a Sierra typing indicator, soft dissolves. A different/open-source
**music track** if he ever wants to swap the bed (the extraction gives a clean VO
stem to mix any track under). A 30–45 s **social teaser** with burned-in captions.
Continuation capsule: `docs/cpl_portal_video_handoff.md`.
