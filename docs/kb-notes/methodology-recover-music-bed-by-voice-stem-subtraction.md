---
title: Recover a music bed from a mixed video by subtracting the clean voice stem
created: 2026-07-23
updated: 2026-07-23
tags: [methodology, audio, video, ffmpeg, numpy, signal-processing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_portal_video_lessons]]"
  - "[[docs/kb-notes/methodology-warm-a-tinny-voiceover-measured-eq]]"
artifacts:
  - "in-session ffmpeg + numpy (no committed script — the technique, not a tool)"
---

# Recover a music bed from a mixed video by subtracting the clean voice stem

> **One-sentence summary** — When you have both a mixed export (voice **over**
> music) *and* the isolated clean voice-over, you can extract the music with plain
> arithmetic — `music = mix − g·voice`, sample-aligned — no AI stem-separation
> model, and no quality loss on the music.

## Context

A screen-recording video's exported cut mixed a music bed onto a thin "Zoom-mic"
voice; the goal was to keep the music but replace the voice with a warmed
version. AI stem separation (Demucs) was unavailable — its model hosts were
blocked by the egress proxy (403). But the clean voice-over stem existed as a
separate file, which makes the mix algebraically invertible.

## The claim

If `mix = g·voice + music` (voice-over laid over a bed, a linear sum), and you
hold the isolated `voice`, then `music ≈ mix − g·voice`. Recover `g` and the
alignment empirically:

1. **Decode both to raw PCM** (same rate, e.g. mono/stereo f32 at 48 kHz).
2. **Find the lag** by cross-correlating a speech-dense window (often 0 —
   same editing timeline).
3. **Solve the gain** by least squares over speech: `g = ⟨mix,voice⟩ / ⟨voice,voice⟩`.
4. **Subtract per channel**: `music = mix − g·voice` (subtract the centered voice
   from both L and R to preserve stereo width in the bed).
5. **Sanity-check**: `g` should be **consistent across independent speech
   regions** (proof the same take is in both), voice should **cancel by ≥15 dB**,
   and a voice-silent region (intro) should leave `music ≈ mix` unchanged.

The payoff is bigger than extraction: you now hold **music and voice as separate
stems**, so you can swap the voice tone, rebalance the bed (level + sidechain
ducking), or add an end fade — all freely.

## How we got here

The CPL Student Portal "Credit for Being You" video (SkyVid, 2026-07-23). The mix
and the clean `.m4a` voice were sample-aligned (lag 0) with `g = 1.30` — **identical
in two separate speech windows**, which is what proved the mix carried the same VO
take. Voice cancelled 15–20 dB; the intro bed measured identically before and after
(−44.6 dB → −44.6 dB), confirming the music was untouched. The warm voice was then
re-laid on top and the bed raised +7 dB with ducking. Full story:
`docs/cpl_portal_video_lessons.md`.

## When this applies (and when it doesn't)

- **Needs the *same* voice take in both files.** Verify with the two tells above
  (consistent `g`, ≥15 dB cancellation). If `g` drifts between regions or
  cancellation is weak, the mix used a different/re-processed voice — don't trust
  the residual.
- **Codec differences cap cancellation** at ~15–20 dB (the mix and the stem are
  different encodes), so a faint voice ghost remains in the extracted music. That's
  fine **only because you re-lay a full voice on top** (same words, same timing) —
  the −15-to-20 dB ghost is masked. Don't ship the raw extracted "music" as a
  clean bed; it isn't one.
- **It's a linear-sum assumption.** Bus compression / limiting applied *after* the
  voice+music sum will smear the subtraction. Worked here because the bed was a
  simple, quiet, mostly-mono "volume mid" layer.
- **Prefer a real stem** when you can get it — ask for the isolated music track
  (solo the music, export). This method is the fallback when only the mix + the VO
  stem exist and ML separation is unavailable.

## See also

- `[[docs/cpl_portal_video_lessons]]` — the workstream that produced this
- `[[docs/kb-notes/methodology-warm-a-tinny-voiceover-measured-eq]]` — the voice
  treatment that got re-laid on top

---

*Authoring check: durable (linear algebra, not a tool version), reusable (any
mix + isolated-stem situation), distilled (one technique), self-contained.*
