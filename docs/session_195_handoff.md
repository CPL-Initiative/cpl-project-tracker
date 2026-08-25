---
title: Session 195 handoff — the sweep is the routine, and Sierra is out of credit
created: 2026-08-25
updated: 2026-08-25
tags: [handoff, session-195, gr, regulation, sb135, auth, cpl-chat]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/gr_sb135_row_sweep]]"
  - "[[docs/kb-notes/methodology-a-client-cannot-see-the-cap-the-server-enforces]]"
---

# Session 195 handoff

You are **Session 195**. Session 194 ran as **SkyMoon** (Sam named it at the end). It began as a planned
build and turned into a live session: Sam drove the GR register in a browser,
hit a defect that signed him out of every tab, and supplied three authenticated
PDFs of brand-new law that changed what several register rows should say.

⚠️ Sam runs several sessions at once. `git log origin/main` before assuming your
branch is the only work in flight — and see the very first item below, because
that habit is now load-bearing for a different reason.

---

## Read this first — the Sierra outage is RESOLVED

**Sierra ran out of Anthropic API credit at ~22:40 UTC and Sam restored it the
same evening.** Issue **#1335** was raised automatically and closes itself on the
next successful probe — check it is closed, and if it is not, dispatch
`cpl-chat-health.yml`.

⭐ **The monitor is NOT blind, and that was worth establishing.** A suspicion was
raised mid-session that `cpl-chat-health.yml` might read a wrapped
`{"error":"AI response failed","status":400}` as healthy, because the function
returns its own envelope. **It does not.** A dispatched run detected the outage,
raised the issue with the exact remedy, and failed correctly. The only gap was
the **3-hour cadence**: the scheduled probe passed at 21:38 and the outage began
after it.

⚠️ **So the standing risk is the cadence, not the probe** — an outage can run up
to three hours before anyone is told, and this was the **third** credit-balance
outage (2026-08-21, 2026-08-22, 2026-08-25). A balance-threshold alert at the
account level would catch what a liveness probe can only catch after the fact;
that is Sam's to set up, and it is the one durable fix.

## ⚠️ Sierra is on HAIKU 4.5, and it is TEMPORARY

Sam, at the end of the session: *"set Sierra to run on Haiku 4.5 rather than Opus
or Sonnet? It's a temporary fix until we can get our corporate billing
released."* It was **Sonnet 4.6**, never Opus — which matters, because the saving
is **3×** ($1/$5 per MTok vs $3/$15), not the ~5× an Opus baseline implies. The
endpoint is INPUT-dominated (`MAX_TOKENS` caps every answer at 2,048).

⭐ **REVERTING NEEDS NO DEPLOY** — set `CPL_CHAT_MODEL` on the Supabase project
and it overrides the committed default. **When Sam says billing is restored,
that is the whole action.** The default stays Haiku so an unset secret is the
intended state, not an accident.

⚠️ **Prompt caching survives, but the floor moved.** Haiku's minimum cacheable
prefix is **2,048 tokens — double Sonnet's 1,024** — and a breakpoint on a
shorter prefix is accepted while caching NOTHING, silently. The `stable` block is
~3,234 tokens so it clears the bar; `tests/sierra_model_choice.test.js` pins the
floor to the family actually configured, so trimming that block goes red.

✅ **SAM VERIFIED IT IN A BROWSER TWICE, 2026-08-25:** *"I tried Sierra on Haiku
and the results look good"*, and separately *"I tried Sierra from the My College
tab and the response to a district question also looks good."* The second is the
harder path — host-scoped, with the host owning the questions, the anchor **and**
the thread, and a district question resolved from the `map_colleges` roster
rather than a name match. Deployed **v61**, byte-identical to `origin/main`, sha
`e373d731`. **Do not re-ask.**

⚠️ **ONE REAL REGRESSION, AND IT IS NAMED.** First smoke run on Haiku: **22 modes,
40 assertions pass, ONE fails** — mode **15a, "carries the Not-Applicable ceiling
caveat"**. The instruction exists and is explicit (*"Say this whenever you quote
the total, so nobody reads the ceiling as a debt"*), so this is a **compliance**
gap, not a missing rule: Haiku is less reliable at honoring a "say this whenever"
buried in a long rules block.

It matters — without the caveat the ~1M Needs Action total reads as a **debt**
rather than a ceiling, when ~30% of reviewed credit is correctly ruled Not
Applicable. The smoke test's own comment calls it *"the single most likely way
this feature misleads."*

⭐ **RECOMMENDED FIX, NOT SHIPPED:** attach the caveat to the **DATA**, not to a
distant rules block — the credit context that carries the total should carry the
caveat inline, so the model sees them together. That makes it robust on **any**
model, not just Haiku. It was deliberately not shipped unattended at the end of
a session Sam had closed; it is a public-surface prompt change and his call.
Alternative: `CPL_CHAT_MODEL` → `claude-sonnet-4-6`, a secret, no deploy.

⚠️ **Watch the GR area sweep first.** It is the most demanding caller on this
endpoint by a distance — a legal instrument determination across sixteen rows as
strict JSON. Student questions are not where a smaller model shows first.

## What shipped

| PR | |
|---|---|
| **#1333** | Lane B per-row deep re-analysis · the keeper's cross-tab rotation bug · Ed. Code Part 48 citation bands · artifacts as evidence |
| **#1334** | The **area sweep** + proposed new priorities · `docs/gr_sb135_row_sweep.md` |

Both merged, and **`cpl-chat` is deployed and byte-verified at v60** — identical
to `origin/main`, sha `5f817014`, with `QUERY_CAP_GR_ANALYSIS = 40000` and
`gr-analysis` present in all three server lists. Two deploys: v59 for the surface,
v60 for the raised cap the area sweep needs. **Nothing about the deploy is
outstanding.**

## ⭐ The four findings worth carrying

**1. A client cannot see the cap the server enforces.** `gr_priorities.js` ships
with Pages on merge; `cpl-chat` ships only on a dispatch. In between, an unknown
surface normalizes to null and takes the 1,000-char chat cap, so the envelope
loses everything after the first 1,000 — including the JSON contract at the END —
and the model answers in confident prose. The client validates against the
constant in its OWN repo, and **CI cannot see it either** because the smoke test
tests the *deployed* function. Put the SUBJECT first so truncation fails loudly,
and make the failure name the DEPLOY.
[`methodology-a-client-cannot-see-the-cap-the-server-enforces`](kb-notes/methodology-a-client-cannot-see-the-cap-the-server-enforces.md)

**2. A rotating credential in a shared store has no owner.** `sync()` said *"this
tab has the session: it is the truth."* Refresh tokens rotate, so a tab holding a
pre-renewal copy **published its consumed token over the sibling's live one**,
exchanged it, got a definitive 400, and `drop()` cleared BOTH stores. Sam was
signed out of every tab mid-edit. Now the **freshest token wins** (compare on
`exp`). ⚠️ A single-window fixture cannot see this — the guard runs two windows
sharing one `localStorage`.

**3. THE SWEEP IS THE ROUTINE, AND IT IS NOT THE PER-ROW CALL WIDENED.** Sam,
after reading a hand pass: *"Your sweep is the routine I want to be able to run
on demand after edits."* Three of its findings are structurally invisible to a
per-row analyzer: the headline (**row #2 asks for enacted law**) only appears
reading a row against an AREA-level document; *"weakened"* is comparative (#5
lost value BECAUSE #2 became law); and a duty no row covers is not a finding
about any row at all.

**4. ⚠️ Two budgets, and the one you raise is not the binding one.** Input went
14,000 → 40,000 for the sweep. But **`MAX_TOKENS = 2048`** caps the REPLY, which
must carry a verdict for every row. A truncated reply is diagnosed as a
reply-budget problem, never as an undeployed surface — and that diagnosis was
**dead code until a test fired**, because `lastIndexOf("}")` finds the last
*complete* row's brace. It measures brace balance now.

## 🔭 Your priority — Sam has two decisions open, and they are legal calls

Read [`docs/gr_sb135_row_sweep.md`](gr_sb135_row_sweep.md) FIRST. **SB 135 added
Ed. Code Article 9, §78093–78093.2, effective 13 July 2026**, and Sam supplied it
as **authenticated** PDFs — so unlike the rest of the register those quotes are
primary-source, and the register is **0 of 16 verified**.

1. **Row #2 asks for something already enacted.** §78093.2(b)(2) makes CCC-to-CCC
   reciprocity mandatory. The row still reads Title 5 + Ed. Code, instrument
   `§55050 · TBL`, ranked **2 of 16**. What genuinely survives: *"no secondary
   review"* is not stated in terms, and the intersegmental half is **weaker** in
   statute (CSU *"shall collaborate to ensure"*, UC only *"encouraged"*) than in
   the TBL. **Sam's call. Nothing was written.**
2. **⚠️ One finding cuts AGAINST us, on the row we call the cleanest win.**
   §78093.1(f)(2)'s *"approved through established curricular processes"* is
   liftable as an objection to **#12**. The answer exists — (f)(2) governs the
   assessment METHOD, not what a COR must list — but #12 is written as though
   nothing could be said against it. Pre-empt it in the memo.

**Then:** four candidate new rows, chiefly **§78093.2(b)(1)** — evaluate the prior
learning of ALL incoming students at the §78212 education-plan point. That is the
largest new obligation in the article and appears nowhere in the register. The
sweep will propose it; a curator has to accept it.

## 🔭 Then

**Decision packs per discipline, fetched on demand** — unchanged from Session 193
and still the CCR bottleneck. The grouped work surface exists for **5 of 159
subjects (~1.2%)**, so a curator clicking into SkyView lands on nothing most of
the time. `kb/_build_ccr_universe.py --desc-dir` already shards on demand;
widening `kb/_build_ccr_atlas_extract.py` past its hardcoded demo list is a
walked path.

## Carryover

| Item | Status |
|---|---|
| Sierra credit balance | ✅ **RESOLVED** by Sam the same evening (#1335). Third occurrence — a balance alert is the durable fix, and it is his to set |
| Health probe blind to a wrapped 400? | ✅ **NO** — it detected the outage and raised the issue. The gap is the 3-hour cadence |
| Row #2 rework · #12 pre-emption | **Sam's** — legal calls, nothing written |
| The 4 candidate new rows | sweep proposes them; a curator accepts |
| GR: 0 of 20 revisions verified | **Sam's**, and Article 9 is the first primary-source material that can move it |
| Row #9's title typo | *"requirement to requirement to note"* — **left alone deliberately**, it is Sam's prose |
| Second cpl-chat deploy | ✅ **v60 byte-verified** against `origin/main` (sha `5f817014`, cap 40,000) |
| Sam's 3 PDFs | filed as artifacts; his own artifact's empty citations repaired (marked derived) |
| My College roadmap cell | **still flagged stacked** (4,292 chars) — two handoffs running |
| `docs/INDEX.md` at 6.6× budget | 264 KB, standing |
| `CLAUDE.md` at 2.47× budget | standing |

## Patterns that worked

- **Read the memory table before working.** It named two surface-declaration
  sites the scope doc did not, and neither source had all five.
- **Read the audit log.** `gr_history` turned "my save failed" into a proven data
  finding: every write that landed has a row, his edit had none.
- **Perturb every guard, separately, and conclude from the EXIT CODE.** Four
  guards this run were wrong before the code was — including one that could not
  fail for a typo, because `indexOf` matches inside a longer string.
- **Measure before scoping.** The sweep's cap, the doctrine's consistency and the
  HTML-strip saving were all measured against live data, not estimated.

## Safety patterns to honor

- Rule 10: fresh read at write time; the sandbox reaches Supabase only via MCP.
- Never force-push `main`. Restart your branch after every squash-merge.
- Rule 4: `index.html` ≡ `CPL_Dashboard.html` — `diff -q` them.
- The sandbox is egress-blocked from `*.supabase.co` and the published site, so
  **the last verification step is always Sam's.**
- ⚠️ A `check_suite.completed` wake is not a green light — it named a superseded
  head twice this session. Re-read `get_check_runs` on the CURRENT head.

**Moniker:** SkyMoon signing off. Next is **Session 196** —
`docs/session_196_handoff.md`. Take **Sky196** or coin your own.
