---
title: Session 203 handoff — from SkyLens (Session 202)
created: 2026-08-28
updated: 2026-08-28
tags: [handoff, session-203, cpl-funding, noncredit, auth, ed-code-78093]
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# You are Session 203

SkyLens here. The noncredit lane is live on the priority cards (#1369, merged
`80d96b6`), and then Sam found something better than anything in that PR.

## ⛔ START HERE — the finding, and the one thing Sam must do

**He relabelled the three priorities on the live tab and nothing reached Supabase.**

My first diagnosis was **wrong** — I concluded he had not been signed in. He sent a
screenshot: the masthead read **"● Signed in."**

```js
function unlocked() { var t = tp(); return !!(t && t.session()); }   // team PHRASE only
```
```sql
with check (is_allowed_reviewer() OR team_pass_ok())                -- all 3 funding tables
```

**The database would have accepted his write. The client never attempted it.**
`activeOverride()` handed him the per-browser scenario layer, `persistActive()`
wrote `localStorage` inside a swallowed `try/catch`, and **that layer wins the
render** — so the tab showed his new labels back and looked published.

⭐ **Two credentials, one word.** COBI's masthead reports the **reviewer** session;
this tab gated on the **team phrase**. Seven write paths across three tables had
it; fixed as ONE `applyWriteAuth()` — seven copies of an auth decision is seven
chances to drift from the policy, which is how it survived.

⚠️ **Sam still needs to re-apply his relabels.** They are not in Supabase. With
the gate fixed his reviewer session will now save for everyone. **Ask him what the
four names are, or confirm he has redone it, before anything else touches the
priorities.**

⚠️ **The routing was never at fault** — his actual question. Every consumer reads
`_prios()`/`_ncPrios()` (`college_briefing.js`, `funding_model_payload.js`, the
memo/docx path). Nothing hardcodes a priority name. **Verify a change reached the
store before auditing the fan-out.**

## What Sam ruled this run

| Ruling | |
|---|---|
| One switch above the cards, all three, every year | *"otherwise I'll be a confuseled Pooh"* |
| Same FTES rate in both lanes | no noncredit rate |
| `Annual funding` / `Combined funding` | replacing Disbursement / Even tranches / Front-load |
| Remove most explanatory language from the cards | **keep the derivations** |
| No feed keys in reader-facing text | *"what does this mean? Metric · pinned to ppa_u"* |
| Noncredit needs its own strategies | *"NC programs do not generally award credit"* — different work |
| Career attainment sits with the **project pool**, reported qualitatively | **no invented metric** |
| Wire the **ABCD §78093.2 outcomes** in and make them visible | **with superscript links from whatever serves each** |
| *"Unearned reallocated after 2028"* | **he withdrew it himself as invented** — replaced with §78093.2(d)(1) |

## Your priority: build the ABCD spine (his ask, designed, not built)

Ed. Code **§78093.2(d)(1)** — the statutory basis for the allocation, verbatim:

- **(A)** Increasing access to CPL opportunities equitably for all eligible students
- **(B)** Increasing completion through CPL awards
- **(C)** Advancing career attainment through CPL
- **(D)** Supporting CPL through the chancellor's office's pilot projects, *such as
  the California Mapping Articulated Pathways Initiative*

**(d)(2) makes demonstrating these a precondition of a campus allocation** — so
they belong on the tab as structure, not commentary.

Two pieces, both small, neither moves a dollar:

1. **Goal-tagged project line items.** `scaling_projects_tech` is one ~$8.96M box
   labelled "CPL Projects & Innovation". Split it into named projects (WestEd,
   Credential Engine, apprenticeship partners, CA Credential Registry, MAP), each
   tagged to the goal it serves. The pool card system already supports custom
   boxes with editable labels — **the math is unchanged as long as the sum is
   preserved**. This is most of the (d)(2) reporting artifact for free.
2. **A four-goal spine**: goal → what funds it → how it is evidenced → *"no
   measure yet"* where true. Plus Sam's superscript **ᴬᴮᶜᴰ** markers on whatever
   serves each, linking back to the spine.

⭐ **The project pool answers (C) AND (D)** — (D) is literally the pool in the
statute's own words, and is the best-evidenced of the four.

⚠️ **Do NOT invent a career-attainment metric.** The model already distinguishes a
`gap` (nobody can measure this) from `undelivered` (declared, feed missing) and
renders a gap honestly. An absent number is fine; a plausible wrong one never is.

⚠️ **The CPL story corpus evidences the wrong goal.** Measured: of 36 stories in
`fact-sheet/cpl_stories.js`, **5** destinations name a job, ~4 are genuine
progression, and 8 of 36 quotes mention employment at all — often aspirationally
(*"time I need to move my career forward"*). It documents **educational**
attainment, which is goal (B). The left side of the arrow is often the job
(*Firefighter →*, *Registered Dental Assistant →*) — worker-becomes-student, the
inverse. **Fixable at intake** (ask what changed at work: hired, promoted,
licensed, apprenticeship placement), not in analysis.

## Read in this order

1. `CLAUDE.md` §11 — the funding cell (rewritten this run; states current truth)
2. `docs/cpl_funding_lessons.md` — the 2026-08-28 section
3. `docs/kb-notes/methodology-a-client-gate-must-mirror-its-own-rls-policy.md`
4. `cpl_memory` — `tags && array['cpl-funding','auth']` **before** touching this

## Patterns that earned their place

- ⚠️ **Three things I cut as "gloss" were data**, and three existing suites caught
  all three: the effective rate, `meas.basis` (a **different author** from the
  METRIC block — curator vs system, and their divergence shows nowhere else), and
  roll-forward (a different fact from reprioritization). **Of the assertions I was
  ready to call stale, most were protecting something.**
- ⚠️ **A bound is tested by VALUE, not the model's clamp count** — Santa Ana
  receives exactly $100,000 without being *held* there, so `capped` says 2 while 3
  receive the max.
- ⚠️ **`undelivered` conflates artifact-not-loaded with feed-does-not-carry.** Test
  the artifact FIRST, mirroring `earnFraction()`, or every **credit** card claims
  its measure is uncarried.
- ⚠️ **A python patch script that writes only at the end loses every edit when a
  later assertion raises.** One did; the `unlocked()` fix silently never landed and
  the file still parsed. Only the new test caught it. **Write per-edit, or assert
  the result.**
- **Guard the destination, not the keystroke.** The NC strategy editor's test
  asserts the text landed in `ncPriorities` *and* that credit's rows are
  byte-identical — a control writing to the wrong store looks identical on screen.

## Safety patterns to honor

- **Never read the config — call `_effective()` / `_alloc()` / `_nc()` / `_prios()`.**
- Live config writes: fresh read, **guard the UPDATE on the before-md5**, commit a
  receipt (`kb/funding_strategies_out/2026-08-28/` is the worked example).
- Never force-push `main`. Merge on `clean` OR `unstable`.
- ⚠️ A `check_suite` / `check_run` wake names a `head_sha` that is **routinely
  superseded** — it was wrong three times on #1369. Always re-read
  `get_check_runs` on the current head.

## Carryover

- **Sam's relabels** — not in Supabase (above).
- **The threshold/floor coupling**, unruled since SkyLane: 400 FTES is the last
  feasible step at the $50k floor; 350 demands $1.90M against $1.8M.
- **The optional Combined award row** (Mt. SAC $400,000 + $100,000 = $500,000).
- **NC share/factor are still read-only** — `ncPrioOverride()` accepts both; only
  strategies have an editor.
- `npm run test:floor` has never recorded a floor for
  `tests/cpl_funding_lane_switch.test.js` (not a failure).
- **Lint debt, pre-existing:** `american_spelling` 171 · `oversized_doc` 5 ·
  `CLAUDE.md` at 2.48× its always-loaded budget.

## Moniker

I took **SkyLens** — the lane switch is a lens on one card set, and the run's real
finding was that a "Signed in" indicator was focused on the wrong credential.
Yours is open.

**Next is Session 204 — `docs/session_204_handoff.md`.**
