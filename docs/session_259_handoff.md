---
title: Session 259 handoff — four asks on the funding tab, and a resolver nobody could reach
date: 2026-09-12
session: 259 (SkyGuard)
tags: [handoff, implementation-funding, curation, testing, sierra]
status: current
---

# You are Session 259

Your moniker is **SkyGuard**. SkyList (S258) shipped Sam's four funding-tab asks and
found, on the way, that six of the public explainer's seven sections could never
be curated — and that the test covering it proved the wrong half.

⚠️ **PARALLEL LANES.** [`docs/session_253_handoff.md`](session_253_handoff.md)
(SkyProof, dark mode) and [`docs/session_254_handoff.md`](session_254_handoff.md)
(SkyStar, SkyView) are still live for their lanes; this file supersedes only
[`docs/session_258_handoff.md`](session_258_handoff.md).

Read in order:
[`lanes/implementation-funding.md`](reference/lanes/implementation-funding.md) ·
[`methodology-a-guard-that-supplies-its-own-input-tests-only-half`](kb-notes/methodology-a-guard-that-supplies-its-own-input-tests-only-half.md) ·
[`methodology-a-styling-class-is-an-api`](kb-notes/methodology-a-styling-class-is-an-api.md) ·
[PR #1563](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1563) (merged, `d1c7009`).

## What Session 258 did

- **Sections move when curating.** Id-keyed order (`secOrder`; the public page's
  own is `pubSecOrder`), position picker per section, no drag handle — a
  `<summary>` is the only always-visible strip and a draggable span there fights
  the fold. ⭐ **Never positional**: the set grows whenever we ship a section, so
  a stored `[0,3,1,2]` re-points the first time one is added.
- ⭐ **SIX OF THE EXPLAINER'S SEVEN SECTIONS WERE UNREACHABLE.** Only `timing` is
  in both id sets, by coincidence of naming, so a section the CO held back stayed
  VISIBLE on the page colleges read. The test wrote `{titles:{qualify}}` into the
  shared map and read it back — proving the resolver resolves, never that any
  control emits that id. `PUBLIC_SECTIONS` now declares the page's seven and the
  suite asserts declaration == markup, in membership AND order.
- **A reported box** for any goal carrying designated activities, derived and
  ⚠️ **never an entry in `priorities(slot)`** — so (D) gets one on the same path.
  `projectGoals()` had storage since 2026-08-28 and no control anywhere; the
  multi-select over the whole register (grouped by Activity, additive) is what
  made it reachable. Seeded (C): 1.4 · 4.2 · 3.5.
- **Exclude chips on the public preview**, where the question actually occurs;
  an excluded section leaves a stub with the way back. Deliberately NOT on the
  live explainer — that is a new public write surface (Rule 10 a3).
- ⚠️ **I shipped a bug and CI caught it.** `class="p"` on the box made it a
  priority card to every selector; `.cplfund-prio .p` is counted or indexed by
  eleven assertions across five suites. Seven files red from one class. And my
  guard asserted the *attribute*, not the *selector* — it now pins both counts.

## Sam's decisions this run

1. **The explainer video may carry details** — *"it will be shown only after we
   finalize the model"* — and **focuses the public view, not the internal tab**.
   Plan delivered as an artifact (shot sheet, 7 beats on the page's own
   sections, toolchain: OBS → Descript, his own voice, Claude Design for cards).
2. **"Show the whole list so I can choose any"** and **"make it a multi-select
   dropdown"** — both built; already-designated rows say so rather than leaving.
3. **"That would be the same for the Opportunities card"** — (D) is the same code
   path, no special case.
4. **LWDA acknowledged, not designated.**
5. ⭐ **ALL THREE OPEN QUESTIONS RULED AT SESSION END (2026-09-12).** He answered
   them by number: **"1. Hold, no action / 2. Frame / 3. Yes"** —
   (1) the LWDA designation is **held**, not pending; (2) the video **frames**
   the institution table rather than blurring it; (3) **build the Sierra scope
   flag**. Nothing in this handoff is waiting on him.

## NEEDS SAM

1. **Nothing from this run.** He ruled all three before signing off.
2. Carried from earlier sessions: the funding dials (Accepted 25% / factor 1.0);
   the sixteen-row register sweep; `sierra_guidance`'s CHECK constraint lacks
   `skyview-ask`.

⚠️ **HELD, NOT PENDING — do not re-ask and do not act on inference.** The
**LWDA partnership** stays undesignated on the (C) card. No LWDA project exists
(the agency appears only inside 1.4's own update text; 4.3 Strategic
Partnerships names no partner) and he chose to leave it rather than file it
under the nearest row. The multi-select is built and waiting for him.

## Queue

- ⚠️ **15a/15c still red** and #1555 did not close them — two correct answers
  trip the stripper's narrow shapes. Patch proposed in the #1559 comment,
  unpushed.
- ⭐ **BUILD THE SIERRA `surface` FIELD — Sam ruled "Yes" (2026-09-12).** A
  `surface` field on the request plus a nullable `surface` column on
  `sierra_guidance`; not a forked Sierra, not a `mode` enum. ⚠️ **The access bit
  is derived SERVER-SIDE from the reviewer credential, never sent by the page** —
  a browser-declared "I am the internal bubble" is a claim any caller can make,
  which would turn the public Sierra endpoint into a read API for COBI's
  internals. It is per-VIEWER, not per-surface. ⚠️ **It does not widen retrieval
  by itself:** Sierra reads the purpose-built `chatbox_*` tables, so letting her
  see COBI data is a SECOND build, and the boundary inside COBI is aggregate vs
  student-detail — that one routes through Governance and the student-detail
  disclosure ADR (Rule 10 a3) before it ships.
  [lane](reference/lanes/sierra-retrieval-corpus.md)
- **The explainer video FRAMES rather than blurs** (Sam, 2026-09-12). Search to
  one college on camera, then open its drill-in; no blur anywhere. The
  [shot sheet](https://claude.ai/code/artifact/c88e9677-9585-4171-8634-9aeee7c38f8e)
  already carries this as beat 2.
- **Raise `cpl-chat-health.yml` to hourly** — its own header says to.
- **The probe's blind spot:** read the blank rate from `chat_interactions`
  rather than adding a second question.
- **`/a11y-pass`.** The funding tab FAILS both routes, and **none of it is
  S258's**: 317 sub-24×24 targets (`cplfund-optbtn`, `cplfund-caret`,
  `cplfund-optin-jump`) and 18 `--text-faint` contrast pairs. Fact Sheet is still
  the biggest (141) and public-facing.
- ⚠️ **Two docs are at or over budget because of this run.**
  `lanes/implementation-funding.md` is 14.5 KB / 12 KB (1.20×) after I added
  load-bearing facts and compacted twice; `cpl_funding_lessons.md` is 51 bytes
  over 120 KB. Both want a real compaction pass, not another trim.
- ⚠️ **`docs/roadmap_archive.md` is 4.3× over** (645 KB / 150 KB) — still the
  worst in the corpus, still untouched.
- **Add `funding-model/` to `a11y.config.js`** — the explainer is a shipped
  public view and no a11y target covers it. (Distinct from lane NEXT ⑥, which is
  `check_public_page_layout.js`.)
- Carried: `Counselor_Verified` into the daily fetch; 51 guessed column offsets
  in `excel_to_dashboard.py`; SkyView ⑩/⑪ (S254).

## Patterns that worked

- **Ask what EMITS a value, not whether the consumer reads it.** The whole
  defect was one grep: nothing emitted six of seven ids.
- **Check the repo before proposing.** "Hide on the public page" already
  existed; the ask was really about the preview carrying no controls at all.
- **Mutation-test a new guard.** Making `render()` ignore the stored order fails
  1f/1j; inverting the sweep exemption takes the suite out. One guard was
  vacuous until I tried to break it, and one crashed instead of naming a check.
- ⚠️ **When a suite fails in a full run and passes alone, re-run it alone AT THE
  CURRENT TREE before reaching for an environmental explanation.** I called
  seven real assertion failures "memory pressure" because a suite had passed
  standalone — before the edit that broke it. Two later confusions were also
  mine: three overlapping background `render` runs starving each other, and
  `pkill -f cpl_funding_render` killing the wrapper shell that launched it.

## Safety patterns to honor

Rule 4 · Rule 5 (never force-push `main`) · Rule 10 (Supabase only through MCP;
the sandbox cannot reach `*.supabase.co`, `api.github.com` or `map.rccd.edu`) ·
the `test` check green on the CURRENT head before every merge, and ⚠️ a
`check_suite.completed` wake routinely names a SUPERSEDED sha · `cpl-chat deploy`
is a production dispatch · MAP read-only · the public KB untouched · **rebuild
`kb/dependency_map.json` as the genuinely LAST step before a push** — it records
LINE OFFSETS, so any edit moves them · **never re-baseline `check_floor.json`
from a contended run** (it has had a LOWER floor written into it that way; one
hand-added measured entry is safer) · DON'T LOCK IN: end the turn when the next
step waits on anything external.

## KB notes added this run

- `methodology-a-guard-that-supplies-its-own-input-tests-only-half`
- `methodology-a-styling-class-is-an-api`

---

*Greetings, you are Sky**Guard** (Session 259), see Sky**List**'s handoff —
`docs/session_259_handoff.md` — let's keep rolling with our queue.*
