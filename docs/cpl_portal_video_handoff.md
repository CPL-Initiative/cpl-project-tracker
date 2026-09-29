---
title: CPL Student Portal video — continuation capsule (SkyVid → next)
date: 2026-07-23
tags: [handoff, video, audio, accessibility, cpl-student-portal, side-lane]
related:
  - "[[docs/cpl_portal_video_lessons]]"
  - "[[docs/kb-notes/methodology-recover-music-bed-by-voice-stem-subtraction]]"
  - "[[docs/kb-notes/methodology-warm-a-tinny-voiceover-measured-eq]]"
---

# CPL Student Portal video — continuation capsule

You are picking up **SkyVid's** side-lane: polishing the CPL Student Portal
**"Credit for Being You"** (creditforbeingyou.org) 1:51 intro video. This is a
**side-lane** — it does **not** own the CCR mainline's `cpl_todos.json` or the
numbered `session_<N>_handoff.md`, and it must **never** write to the public KB.

## What shipped (delivered to Sam directly, not committed)

A finished, publish-ready master: **warm ("Broadcast"/warmer) voice** + the
**original music bed** (recovered, +7 dB, ducked), a **2 s frozen end card with a
music fade-out**, corrected **captions** embedded + as `.vtt`/`.srt` sidecars, a
**transcript**, and a README — all zipped. Final audio −16.5 LUFS, peak-safe;
video re-encoded once at `-crf 18` (screen content, ~6 MB).

Sam's verdicts along the way: "Broadcast sounds best" → "warmer still, all the
better" → "music a bit too quiet, balance it" (→ +7 dB ducked) → "extend the end
so it fades rather than cuts" → "Sounds and looks great!"

## Read these first (in order)

1. `docs/cpl_portal_video_lessons.md` — the full story + gotchas.
2. `docs/kb-notes/methodology-recover-music-bed-by-voice-stem-subtraction.md` —
   the `music = mix − g·voice` extraction (why we can rebalance freely).
3. `docs/kb-notes/methodology-warm-a-tinny-voiceover-measured-eq.md` — the
   diagnose-then-correct voice warmth method.
4. The **polish-plan artifact**:
   https://claude.ai/code/artifact/2222f015-6251-4e3a-87f5-9ebd950f1889 — the
   beat-by-beat motion plan, open-source music sources, accessibility checklist.

## What's parked (pick up if Sam asks)

- **Motion pass** (the artifact's shot list): a kinetic-type **intro** + a clean
  **end card** (remove the stray cursor visible on the current CTA frame),
  guided **zoom-to-cursor** across the screen-recorded sections, count-up on the
  "47 matches" beat, map-pin drop-in, a Sierra typing indicator, soft dissolves.
  Buildable as an HTML/CSS Claude artifact Sam screen-records, or in DaVinci
  Resolve (free).
- **Music swap** — if Sam wants a different/open-source track, the voice-stem
  extraction leaves a **clean VO stem** to mix any bed under (sidechain-duck at
  ~−12 to −15 LU below the voice). Sources are in the polish plan.
- **30–45 s social teaser** with burned-in captions (students meet it muted on
  social first).
- **YouTube/Demucs were proxy-blocked (403)** in-session — if you need the live
  YouTube cut or ML stem separation, that must happen where those hosts are
  reachable.

## Patterns that worked

- **Measure before you process** (band energy + spectrogram + silence scan) —
  it's what caught "no music in this export" and "don't boost absent bass."
- **A/B on the same sentence** for every subjective call (warmth level, music
  level) — Sam decides fast and confidently.
- **Verify claims before conceding** — I wrongly agreed "there's music" mid-turn;
  the silence scan showed the uploaded cut had none. Show the evidence
  (waveform/spectrogram) rather than defer.

## Safety patterns honored

- Side-lane discipline: left `cpl_todos.json` + the numbered handoff to the CCR
  mainline; did not write the public KB; committed **docs only** (no video
  binaries — large, delivered to Sam directly).

Moniker suggestion for the next video-lane session: **SkyReel** (or coin your own).
