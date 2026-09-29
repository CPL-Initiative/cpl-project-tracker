---
title: Hear a synthetic voice through a recognizer before a person listens
created: 2026-09-26
updated: 2026-09-26
tags: [methodology, audio, video, voiceover, tts, accessibility]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-warm-a-tinny-voiceover-measured-eq]]"
  - "[[docs/kb-notes/methodology-recover-music-bed-by-voice-stem-subtraction]]"
artifacts:
  - prototype/funding_video/narrate.py
  - prototype/funding_video/narration_s1.json
  - tests/funding_video_page.test.js
---

# Hear a synthetic voice through a recognizer before a person listens

> **Read the tokenizer's phonemes in the sentence, fix what spelling cannot at the phoneme level, then run the finished read through a local speech recognizer:** it hears the misreads a listener would and times every word, so a fix is measured before anyone spends a listen on it.

## Context

The funding video's narration (Kokoro-82M, the Heart voice, run locally) read
"stilted" to Sam on its second pass: *"especially when sounding out C-P-L rather
than just saying it quickly--same with sounding out the year numbers"* (2026-09-26).
Each listen costs the curator a sitting, so the third read had to be right before
it reached him. The story is in [`docs/cpl_funding_lessons.md`](../cpl_funding_lessons.md).

## The claim

### 1. Measure the spelling in its sentence, never the word alone

The engine turns text into phonemes first, and that string decides the read.
`C P L` gives three full stresses (`sˈiː pˈiː ˈɛl`), the stilted read; `CPL` gives
one quick word with the stress on its last letter (`sˌiːpˌiːˈɛl`). Initialisms do
not all behave alike: unspaced `FTES` reads as the word "eftess" (`ˈɛftˈɛs`), and
`EDD` alone reads "ed" while inside a sentence it reads its letters. Capital `MAP`
reads as the word alone and spells itself out inside a sentence. Digits read a
year as "two thousand twenty-six". Only the sentence tells you which you get.

### 2. Fix at the phoneme level what spelling cannot, and make every fix prove it fired

A fix is a find-and-replace on the phoneme string (`ˈɛftˈɛs` becomes the four
letters, `ˌɛftˌiːˌiːˈɛs`). Two guards keep the fixes honest. Every fix must fire
at least once, so a change to the text or the tokenizer cannot skip one silently.
A `never` list names the readings the listener rejected, and a scene whose
phonemes still carry one fails the run; run on the rejected read, it failed in 14
places. `narrate.py --check` does both in seconds, with no audio.

### 3. Transcribe the read with a local recognizer

`faster-whisper` (model `small`, on the machine, so the audio never leaves it)
hears what a listener hears, and it caught two misreads the phonemes could not
show. *The twenty-six twenty-seven year* came back as "the 2627 year", the two
years run together; a comma keeps them apart ("the 26, 27 year"). *Due November
first* came back as "do November first"; *by November first*, the scene
headline's own word, reads cleanly. The recognizer writes digits and its own
punctuation, so compare what it understood with what the script says, never the
strings.

### 4. Time the words to measure "quickly"

The recognizer's word timestamps turn "less stilted" into a number. Over the
twelve times the script says it, "CPL" took 702 ms spaced and 570 ms unspaced;
"EDD" went from 800 to 620 ms. The timestamps are approximate, and they are
consistent from one read to the next, which is what a before-and-after needs.

### 5. Wording moves the read more than stress marks

Demoting a year's first stress to a secondary one changed the phrase's length
from 2.24 s to 2.22 s. The years improved through their wording: fewer year
words where the screen already shows the year, the shorthand people say aloud,
and a comma between a pair. Try the wording first; keep the phoneme edits for
what wording cannot reach.

## How we got here

S293 measured `C P L` against `CPL` in the tokenizer after Sam's note on v2.
S294 ([#1701](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1701))
found that the tokenizer's context changes `FTES`, `EDD` and `MAP`, built the
fixes and bans into `narrate.py`, transcribed v2 and v3 with `faster-whisper`,
found the two misreads above, re-read, and measured the word timings. The
narrated draft of the funding introduction is built on that read.

## When this applies (and when it doesn't)

It applies to any synthetic narration in this repo. The phoneme details are
Kokoro's (espeak's rules); another engine reads differently, and the recognizer
check still applies to it. A recognizer measures misreads and timing and says
nothing about warmth or pace, which is what Sam means by natural, so a person
still listens last. It shortens that listen to the question only a person can
answer.

## See also

- [`methodology-warm-a-tinny-voiceover-measured-eq`](methodology-warm-a-tinny-voiceover-measured-eq.md): measure before you change how a voice sounds.
- [`methodology-recover-music-bed-by-voice-stem-subtraction`](methodology-recover-music-bed-by-voice-stem-subtraction.md): the voice and the music bed as separate tracks.
- `prototype/funding_video/README.md`, *The narrated draft*.
