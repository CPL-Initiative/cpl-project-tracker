---
title: Session 293 handoff — the funding video becomes an introduction, fills the screen, shoots down barriers, and its score builds
date: 2026-09-26
session: 293 (SkyBeam)
tags: [handoff, implementation-funding, video]
status: current
---

# You are Session 294

Your moniker is **SkyCadence** (renamed from SkyForge, which S280 already carried). SkyBeam (S293) took Sam's five notes on the funding
video and landed all five in one PR. Read
[`session_292_handoff.md`](session_292_handoff.md) for the Scenario 2 video and the
one-source build, and [`session_289_handoff.md`](session_289_handoff.md) for the
funding lane. This was a short session (one commit's worth of work), so the full
Rule 9 checkpoint did not run; the lane file, the README and a `cpl_memory` row
carry the state.

## What shipped (one PR, branch `claude/jolly-hopper-txrag9`)

Sam's notes, verbatim in `cpl_memory`
(`sam-funding-video-is-an-introduction-barriers-building-score-2026-09-26`):

1. **An introduction, not a guide.** *"a guide would be much longer and more
   detailed."* The page title, kicker, Play button, region label and the
   explainer's link (both scenarios) say **"90-second introduction"**. File names
   are unchanged, so every link holds. A real guide is a separate, longer piece.
2. **The arrow shoots down barriers to CPL**, *"sly"*: five muted gray pixel
   invaders at scene seams (`ENC` in the source), captioned Retaking what you
   know · No transcript on file · Nobody to ask · Unclear local policy · Credit
   left on the table. About a second each; none under reduced motion; a small
   shot and pop pitched in the key.
3. **The score builds**: seven sections over one four-bar theme, a B-minor
   breakdown, and a key change up to D for the last statement. Measured RMS climbs
   at every step (intro −24.4 → climax −16.3 dBFS), peak 0.81, no clipping.
4. **Everything fills the frame**: every scene re-laid out (1920-wide body line 63
   px, headline 115 px; the title and closing scenes set the lockup beside the
   title). The arrow's keyframes are now **measured from the elements**, so a
   future layout change carries the arrow with it.
5. **Full window + download**: the player opens at the largest 16:9 box that keeps
   the controls on screen; **Full screen** and **Download MP4** controls; the big
   Play button enters full screen and plays in one click. The explainer's MP4 link
   gained `download`.

Both MP4s re-rendered (`20260926_*`). `tests/funding_video_page.test.js` (new,
32 checks) guards the rename, the controls, the download targets, the barriers,
that the built pages carry the current source, and the target figures below.

Verifying the MP4s frame by frame turned up two defects, both fixed and
re-rendered: Scenario 2's reported card ran past the bottom of the frame, and the
targets scene halved the ROUNDED target, so its hold read 22.1 FTES (Scenario 2:
33.5) where the engine's half target and the scene text say 22.2 (33.6). The second
was present since S291; the page now shows the typed figures on the hold and at the
full target, and checks e1/e2 fail on the old code.

## Verified

- `funding_video_page` 32/32 · `funding_model_page` 84/84 · CI `test` green on the fix commit (full suite, four shards).
- Frames sampled across all ten scenes, one iteration to clear six overlaps.
- Live page at 1440×900 (stage 1408×792, controls on screen) and 390×844, no
  sideways scroll.

## Open

- **A narrated draft is next** (Sam, 2026-09-26: *"Keep these drafts...but can you
  make a draft version with a natural feminine voice-over that follows a script your
  write? We could tone down the music to just background level. Might need to slow
  down and lengthen the timing a bit"*). The draft script and the build plan are in
  [`prototype/funding_video/20260926_Narration_Script_Draft.md`](../prototype/funding_video/20260926_Narration_Script_Draft.md)
  (339 words, about 2:15 to 2:30). Waiting on two things from Sam: edits or approval
  of the script, and the environment's network access set to Custom with
  `huggingface.co`, `*.huggingface.co`, `*.hf.co` allowed (defaults kept) so the
  Kokoro-82M voice (`af_heart`, Apache-2.0) can run locally. He also shared an X post
  (a video he says Opus 5.5 produced) that no route here can reach; allowing
  `cdn.syndication.twimg.com` and `video.twimg.com` would let a session pull it.
- Sam watched the Scenario 1 render and replied "Looks great!"; the two fixes above
  came after, so he has not seen those frames.
- Carried from S292: the explainer timeline's "Undispersed Funds Rolled to Year 2
  and Releveled" wording (a curator edit); `EXPLAINER` to the public repo's address
  before production; the video pages are still not in `a11y.config.js`.

## ONE THREAD FROM HERE — the reconciled map (Sam, 2026-09-26)

*"I was running simultaneous sessions last week so handoffs got disconnected. I would
like to get back on a single threaded workstream on my session."* This handoff is the
**only head**. How last week forked, so nothing it did is lost:

| Handoffs | Thread | State now |
|---|---|---|
| 279 (SkyWarden, 9/19) | **SkyView** goes public read-only | Lane file current (9/23). Carryover: the pinch failure (`s278-fable-skyview-pinch-registry`); the sweep is not in CI |
| 280–283 (9/20–9/22) | **Jev + the CCR** | First title-rung sitting: Sam reviewed 26 of 50, 7 moves / 19 keeps; Jev ranks well (AUC 0.865), no safe gate, so the CCR stays out of `GATES`. **Waiting on Sam:** nest or cross-list the misfits (283 §"first sitting"), which everything downstream of the misfit rung waits on. No CCR decisions table exists (needs Governance, Rule 10(a3)). CER/CSR scanners last ran 2026-07-10 |
| 283 carryover | **ESL merging decision sheet** | **Asked for by name on 2026-09-21 and never built**; five sessions carried it forward. Build it first when the CCR work resumes: [`lanes/esl-packaging`](reference/lanes/esl-packaging.md) |
| 283 | **Discipline cross-list** | 3 of 12 items landed per [the lane](reference/lanes/discipline-crosslist.md) (283's "6 of 12" predates it) |
| 288 (SkyMatrix, 9/24) + 290 (SkyZ, 9/25) | **EACR exhibit matrix** | Ten tweaks, the windowed matrix, CIP sectors from title rules (Sam: sectors are a filter only, never the TOP/CIP project). **Waiting on Sam:** look at the grid in a browser (52px rows, title clamp, figures, the panel). ASCCC roster waits on Pedro's MAP Custom Report |
| 284–287, 289, 291–293 | **Funding model** | Done except the narrated draft (below) and the timeline's "Releveled" wording |

**Stranded work recovered:** eight CPLBrain files from 9/14–9/23 (seven session notes
and Sam's 2026-09-16 braindump) sat on unmerged branches, so Obsidian never had them:
[samueltlee/CPLBrain#182](https://github.com/samueltlee/CPLBrain/pull/182). Older draft
PRs remain in the vault (#147, #133, #32, #16–19, July–August) and in the public KB
(#14, #19, #20, #22; human-gated by design).

**The narration, Sam's verdict on v2 (2026-09-26):** *"Narration still a bit stilted,
especially when sounding out C-P-L rather than just saying it quickly--same with sounding
out the year numbers--too stilted. We can work on this in a later session."* The cause is
measured, and so is the fix (Kokoro's tokenizer, `kokoro_onnx.tokenizer.Tokenizer().phonemize`):

| Written | Phonemes | Read |
|---|---|---|
| `C P L` (v2) | `sˈiː pˈiː ˈɛl`, three primary stresses | stilted |
| `CPL` | `sˌiːpˌiːˈɛl`, one word, stress on the last letter | quick, as people say it |
| `twenty twenty-six` (v2) | `twˈɛnti twˈɛntisˈɪks`, two primary stresses | stilted |
| `2026` | `tˈuː θˈaʊzənd twˈɛnti sˈɪks` | wrong (two thousand) |

So: write `CPL`, `EDD` and `FTES` unspaced (keep `map` lowercase, since capitals spell it
out); for years, either pass phonemes with a lighter first stress (`create(...,
is_phonemes=True)`) or say "twenty-six to twenty-eight". Then re-read v3 and send it.

**The queue, in Sam's order:** (1) the narrated funding video, once he approves the v2
read (Heart voice, "map" said as a word, 2:55; audio sent 2026-09-26). The script is
[`20260926_Narration_Script_Draft.md`](../prototype/funding_video/20260926_Narration_Script_Draft.md)
and the spoken form the voice reads is `prototype/funding_video/narration_s1.json`. The
Kokoro model (`fastrtc/kokoro-onnx` on Hugging Face) and `pip install kokoro-onnx` rebuild
the voice in about a minute; (2) the
ESL decision sheet, then the Jev CCR's misfit ruling and next rung; (3) SkyView;
(4) the EACR grid review whenever he opens it.

## Read in order

1. `docs/reference/lanes/implementation-funding.md` (the video paragraphs)
2. `prototype/funding_video/README.md`
