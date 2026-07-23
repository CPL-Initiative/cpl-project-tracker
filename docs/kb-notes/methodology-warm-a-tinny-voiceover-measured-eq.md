---
title: Warm a tinny voiceover with measured EQ — diagnose before you boost
created: 2026-07-23
updated: 2026-07-23
tags: [methodology, audio, video, ffmpeg, voiceover, accessibility]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_portal_video_lessons]]"
  - "[[docs/kb-notes/methodology-recover-music-bed-by-voice-stem-subtraction]]"
artifacts:
  - "in-session ffmpeg (volumedetect / showspectrumpic / loudnorm / equalizer / bass / treble / acompressor)"
---

# Warm a tinny voiceover with measured EQ — diagnose before you boost

> **One-sentence summary** — "Tinny" narration (Zoom mic + low-bitrate AAC) is
> fixable, but **measure the spectrum first**: restore the low-mid body that's
> actually present, tame the harsh edge, and don't boost frequencies the source
> already filtered out.

## Context

A CPL Student Portal voiceover read thin/"tinny." The instinct is to grab a bass
slider — wrong. There was nothing at 60 Hz to boost (the mic high-passed it), so
a naive bass lift just adds rumble/noise. The right fix is diagnosis-led EQ.

## The claim

**Diagnose, then correct — in this order:**

1. **Measure per-band energy** (`ffmpeg -af "highpass=f=LO,lowpass=f=HI,volumedetect"`
   across octave bands) **and render a spectrogram** (`showspectrumpic`, log scale).
   This tells you where the body actually is and where it's been cut. Typical
   Zoom/AAC VO: rolled off below ~120 Hz, and a **hard brick-wall around 12 kHz**
   (the "small speaker" quality) from the low-bitrate codec.
2. **Restore body where content exists** — a low-shelf + a bell around
   **120–300 Hz** (there's usually real fundamental/chest energy there to lift).
   A high-pass at ~65 Hz keeps it clean.
3. **Tame the tinniness** — a gentle cut in the harsh presence region (~2.5–3.5 kHz)
   and, if needed, a slight high-shelf darkening above ~5 kHz. "Tinny" is a
   *ratio* problem (too much presence relative to body), so restoring lows fixes
   most of it; darkening the top finishes it.
4. **Even the level** — light compression for density/consistency (helps a bed sit
   evenly), then **two-pass `loudnorm`** to the **−16 LUFS** web/education standard,
   true-peak safe.
5. **Offer variants, let the human pick** — "Warm" (natural) vs "Broadcast"
   (fuller) vs "Warmer" as short A/B clips on the *same sentence* beats guessing a
   single curve.

**Honest limits:** you **cannot recover audio above the codec's brick-wall** (the
lost ~12–20 kHz octave). Don't synthesize fake "air" up top — on a tinny source it
just adds harshness. And `loudnorm` can't reach −16 on a peaky VO without limiting;
a transparent two-pass that lands ~−17 with safe peaks is the honest stopping point.

## How we got here

The CPL Student Portal video (SkyVid, 2026-07-23). Band measurement showed the
peak at 320–1280 Hz, thin below 160 Hz, and a hard 12 kHz ceiling on the
spectrogram. The applied chain restored 80–320 Hz (**+3–4.5 dB relative to the
vocal peak**), notched ~2.8 kHz, darkened above ~4.8 kHz, compressed lightly, and
two-pass-normalized to −16 LUFS. Sam chose "Broadcast," then "warmer still" → a
Warmer pass with more 120–210 Hz and a gently darker top, mud kept in check.
Full story: `docs/cpl_portal_video_lessons.md`.

## When this applies (and when it doesn't)

- **Any spoken-word deliverable** captured on a consumer mic / conferencing tool /
  low-bitrate export (webinar, Zoom, phone).
- **Not a substitute for re-recording.** If the VO can be redone, even a cheap USB
  mic — or Zoom set to "Original Sound"/music mode (which disables the aggressive
  filtering) — beats any post-processing. Post can de-thin; it can't un-delete the
  lost top octave.
- **On a voice+music mix, EQ colours the music too.** Prefer to warm the isolated
  voice stem and remix (see
  `[[docs/kb-notes/methodology-recover-music-bed-by-voice-stem-subtraction]]`),
  rather than EQ the whole bus.

## See also

- `[[docs/cpl_portal_video_lessons]]` — the workstream that produced this
- `[[docs/kb-notes/methodology-recover-music-bed-by-voice-stem-subtraction]]` —
  how to isolate the voice so this EQ doesn't touch the music

---

*Authoring check: durable (DSP/perception, not a tool version), reusable (any VO
polish task), distilled (measure-then-correct), self-contained.*
