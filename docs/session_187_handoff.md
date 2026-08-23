---
title: Session 187 handoff — the funding tab is sewn up; one dial is Sam's and one metric question is open
created: 2026-08-23
updated: 2026-08-23
tags: [handoff, session-187, funding, noncredit, exports, sierra]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/session_186_handoff]]"
  - "[[docs/cpl_funding_lessons]]"
---

# Session 187 handoff

You are **Session 187**. Session 186 ran as **SkySew** — Sam asked to "get the
funding tab sewn up", and the seam that had come apart was not on the tab.

⚠️ Sam frequently runs several sessions at once. `git log origin/main` before
assuming your branch is the only work in flight.

---

## Read this first: two things that decide how you start

**1. Rule 8's read step closed a listed "open item" before any code was read.**
Handoff 186 and §11 both said the parity question was open. `cpl_memory` already
held Sam's verified ruling on it, and the live `cpl_funding_config` showed he had
since acted — carve-out **$1,800,000**, credit floor **$150,000**, NC floor
**$50,000**. **Read the memory table AND the live config before trusting a
handoff's "open" list.** Two of the three things I was told to do were already
done or already decided.

**2. The baked defaults are not the model.** `cpl_funding_data.js` still says
$1M / $175K / $25K. Every figure a session quotes to Sam must come from the
Supabase overlay, and `yearPriorities` there is a **sparse** overlay — one
priority slot carries no title at all and falls back to a baked default.

---

## What shipped (#1307)

| | |
|---|---|
| Memo | `memoModel()` sourced from `ncModel()`; the retired flat NC split is gone |
| Memo | A **noncredit column** in the district table, so it ties out without folding NC into credit |
| Tab | Two cards stopped describing a 33-institution lane as "4 NC campuses" |
| Tab | The opt-in prompt is driven by the **gate**, not by the size of the withheld figure |
| Tab | Priority columns carry their names (`P1 Access`), centered |
| Tab | The noncredit calculation is in "How an allocation is computed" |
| Explainer | Live page and frozen snapshot both paint the carve-out figure; a structural lint stops the next bare one |

### The one worth understanding

The noncredit lane became a bounded allocation over 33 institutions on
2026-08-23. The tab migrated; **the exported memo did not**. It kept
`campusBasis / Σ × carveout`, so at Sam's live dials the document paid the whole
$1.8M to four standalone campuses — **$779,862 of it to Mt. SAC Noncredit, which
the model pays $0** because its FTES is counted on the Mt. San Antonio credit
row — and showed **nothing for the 30 colleges** that receive the rest.

⭐ **It survived because the total balanced.** Credit pool + carve-out tied to the
cent, because the four campuses had absorbed exactly the carve-out. A
reconciliation says the money is accounted for; it says nothing about *who*.
Durable: [`a-total-that-balances-is-not-a-total-that-is-right`](kb-notes/methodology-a-total-that-balances-is-not-a-total-that-is-right.md).

**If you migrate a computation, grep for the old formula's SHAPE.** It is
open-coded arithmetic — no rename and no compiler will find it.

---

## Open, and it is Sam's: the noncredit floor

This is the single remaining decision on the tab, and the numbers moved against
the thing he built the lane for:

| | at $25,000 (baked) | at $50,000 (his live setting) |
|---|---|---|
| at the minimum | 27 of 33 | **30 of 33** |
| growth starts paying above | 3,022 FTES | **3,909 FTES** |

Raising the floor **and** the pool together pushed the incentive further toward
*entry* and flattened the middle. Lowering the floor is what moves it back.
Nothing is broken — the model is honest about it, and the box and the explainer
both print `breakEven`. It is a policy call.

---

## Open, and Sam asked it directly: should P1 split into three metrics?

He wants to count FTES by where the student record originated — **college landing
page, student portal, batch upload** — and will be able to distinguish them in
the data next week. Today P1 is ONE metric whose text already names all three.

The answer he was given, and the reasoning to carry forward:

- **Splitting into three priorities splits the MONEY.** Each priority carries its
  own share, own target and its own 100% cap, so a college strong on one route
  could no longer make up the shortfall on another. That is a real policy change
  — it *mandates a mix* rather than a total. Right if compelling all three routes
  is the intent; wrong if the intent is "these are the legitimate sources".
- **Batch upload is not the same kind of event.** Portal and landing page are
  student-initiated arrivals; batch upload is an administrative import of
  existing records. It is the one genuinely worth separating or weighting down.
- **Recommended: ship origin as a BREAKDOWN first** (drill-in + CSV columns) on
  the existing P1. Reversible, no policy change, and it produces the evidence for
  a share change. `factor` already exists per priority if he wants to price the
  routes differently without three separate caps.
- Adding a priority later is a **config** change, not an engineering project —
  which is itself the argument for not doing it now.

⚠️ **A `cpl_memory` row is stale here**: `p3-portal-routing-is-standard-practice`
(2026-08-11, Sam) says P3 pays on portal/landing-page arrivals. The live config
now measures **P1 = applied units by origin · P2 = eligible units · P3 =
transcribed units**. Flagged rather than silently superseded (Rule 8); it is the
same author's later statement, so confirm with him before rewriting the row.

---

## Carryover

- 🔴 **Sierra billing to the corporate account.** Two outages in two days on
  Sam's personal balance. `cpl-chat-health.yml` probes every 3 hours; raise to
  hourly once billing moves (cost arithmetic is in the workflow header).
- 🟡 The durable half of the sandbox-college fix is not built — nothing in
  `cpl-chat` stops an equivalent row arriving tomorrow.
- 🟡 12 adoption-file statewide titles still absent from `chatbox_credentials`.
- 🟡 Sam still owes a **phone check** on the three public pages; no session can.
- 🟢 Docs lint long tail: `american_spelling` 171, `kb_note_dialect` 60,
  `oversized_doc` 4. Fix in files you touch.

---

## Patterns that worked

- **Drive the engine, don't reason about it.** Booting `cpl_funding.js` in the
  jsdom harness under Sam's live overlay produced every finding in this run. Two
  of them were invisible in the code and obvious in the output.
- **Break your own checks.** Nine deliberate breakages; each fired the intended
  check and only that check. One "passing" assertion turned out to match a
  *seed-grant* sentence rather than the row it claimed to test — parse the row,
  do not grep the document.
- **Let the lint complain about your own edit.** `unindexed_kb_note` and
  `stacked_roadmap_cell` both fired on this run's work. The funding cell ended
  **smaller** (5,208 → 3,256 chars) while carrying more findings.
- **A test that fails may be wrong before the code is.** A test "proving" the
  missing-title fallback failed, and the code was right — `prioTitle()` falls
  back to `DEFAULT_PRIORITY_TITLES`. It now asserts what is true instead of
  staging a path it cannot reach.

## Safety patterns to honor

- **Rule 5**: never force-push `main`.
- **Merge on `unstable`**, not just `clean` — but **name what the green check
  covered**. Session 184 put `main` red merging on a secret scanner while the
  suite covering its own files was still running.
- ⚠️ **`grep -c` after a pipe reports the PIPE's exit code.** Write
  `cmd > log; echo "REAL_EXIT=$?"` — the SIGTERM-143 trap has now bitten twice.
- ⚠️ **Never re-derive an allocation** — `_alloc()` and `ncModel()`, in both
  lanes, on every surface including exports.

## Moniker

**SkySeam** is going if you want it — this run was about a seam between a model
and the document that quotes it. Take it, take your own, or use whatever Sam
names in his greeting.

**Next is Session 188 — `docs/session_188_handoff.md`.**
