---
title: Session 186 handoff — the cache is merged and inert until you deploy it
created: 2026-08-23
updated: 2026-08-23
tags: [handoff, session-186, sierra, cpl-chat, prompt-caching, monitoring, college-identity]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/session_185_handoff]]"
  - "[[docs/cpl_assistant_lessons]]"
---

# Session 186 handoff

You are **Session 186**. Session 185 ran as **SkyScope** (Sam's greeting named it;
note Session 183 also used that moniker — disambiguate by number). It worked the
To-Do queue and one thing that was not in it.

⚠️ Sam frequently runs several sessions at once. `git log origin/main` before
assuming your branch is the only work in flight — four PRs (#1294–#1297) landed
between handoff 185 being written and 185 starting.

---

## Read this first: Sierra went down twice in two days

The Anthropic balance behind `cpl-chat` ran out on 2026-08-21 and **again**
overnight on 2026-08-22. Both outages took down **every** Sierra surface at once
and both were found by a session happening to look, because nothing watched her.
Sam topped up mid-run from **personal funds** — the corporate account does not
exist yet, which is why cost decisions in this lane are real.

`.github/workflows/cpl-chat-health.yml` now probes her every 3 hours and opens /
reuses / closes a GitHub issue. **Raise it to hourly once billing moves** — the
cost arithmetic is in the workflow header so that is a decision, not a shrug.

---

## What shipped

| | |
|---|---|
| Uptime | `chatbox/health_check.sh` + a scheduled workflow; 21 checks, exercised against a mock in five response shapes |
| Cost | **Prompt caching** on `cpl-chat` — a 2,992-token stable block, byte-identical every request |
| Smoke | Mode 7's part-3 prose grep → **mode 7r**, a deterministic retrieval assertion |
| Data | MAP's three sandbox colleges deleted from `chatbox_college_profiles` |
| Lint | The College Identity finding list restored **13 → 10** and made impossible to empty silently |

---

## 🔴 THE ONE THING THAT MUST HAPPEN NEXT

**Deploy `cpl-chat` and verify the cache actually caches.** The code is merged and
**inert** until then.

1. Dispatch `.github/workflows/cpl-chat-deploy.yml` (`confirm: DEPLOY`, ref
   `main`) — **never** the inline MCP `deploy_edge_function` (playbook
   `playbook-deploy-shared-supabase-edge-function`, superseded section).
2. Dispatch `cpl-chat-smoke.yml`. **This is the real gate, not the unit tests** —
   the change reorders the prompt (always-rules now precede the retrieved
   sources, because caching only works on the front of a prompt).
3. Read the function log for `cpl-chat cache: read=… write=…`. **If both stay at
   zero the change is costing MORE than before**, because a cache write is ~1.25×
   and a read is ~0.1×. Something would be invalidating the block every turn.
4. If the smoke degrades on a *capability* assertion (not a prose one), revert the
   deploy first and diagnose second.

---

## Then: the Haiku question Sam asked

He asked whether Sierra could run on Haiku "to be cheaper with comparable
results". Answer so far: **there is no Haiku 4.6** — it is **Haiku 4.5**
(`claude-haiku-4-5`), **$1/$5 vs Sonnet 4.6's $3/$15**, and **200K context, not
1M**. Caching was the first lever because it is model-neutral; Haiku is the
second and it is **not** free:

- Her context builders are capped but the offerings query already **fills** its
  150-row limit — measure the peak prompt against 200K, do not assume.
- **The caveats are the product.** A smaller model drops a hedge before it drops a
  fact, and several smoke assertions test exactly those hedges (15a's
  Not-Applicable ceiling, 16a's no-cannot-enumerate, 14b's suppression).
- Run the suite on both and **diff the failures**. Report; do not switch quietly.

---

## Carryover

- 🔴 **Deploy + verify the cache** (above).
- 🟡 **The durable half of the sandbox-college fix is not built.** Nothing in
  `cpl-chat` stops an equivalent row arriving tomorrow; the structural guard is
  the function refusing to surface a college absent from (or `test` in) the
  authoritative roster. Needs a deploy and a smoke, which is why 185 left it.
- 🟡 **12 adoption-file statewide titles** still absent from `chatbox_credentials`.
- 🟡 Sam still owes a **phone check** on the three public pages; no session can.
- 🟢 Docs lint long tail: `american_spelling` 172, `oversized_doc` 4
  (`roadmap_archive` 3.1×, `INDEX.md` 6.4×). Fix in files you touch.

---

## Patterns that worked

- **Rule 8's read step paid for itself in the first five minutes.** The most
  important thing in the run — a live outage — was a `verified` `cpl_memory` row,
  not a queue item.
- **Verify a live data set by checksum, not by sampling.** `md5(string_agg(name,
  E'\n' ORDER BY name COLLATE "C"))` proved 130 observed names and 120 roster rows
  were unchanged against the committed inputs, in one query, without moving the
  rows through the session's context.
- **Break your own checks.** Twelve deliberate breakages across four new test
  files; every one fired the intended check and only that check.
- **Read the lint's complaint about your own edit.** `stacked_roadmap_cell` and
  `unindexed_kb_note` both fired on this run's work. The roadmap cell ended up
  **smaller than it started** (3,094 → 2,718 chars) while carrying more findings.

## Safety patterns to honor

- **Rule 5**: never force-push `main`.
- **Merge on `unstable`**, not just `clean`.
- ⚠️ **A cache breakpoint on "mostly stable" material is a surcharge, not a
  saving.** Prove invariance by RUNNING the builder over every input combination.
- ⚠️ **Comments are not code.** A grep asserting "the old assertion is gone" will
  match the comment that quotes it — strip comment lines first.
- ⚠️ **An optional input can silently empty a finding list**, and an empty finding
  list reads as good news. The builder refuses now; keep it that way.

## Moniker

**SkyGuard** is going if you want it — this run was about things that were
supposed to be watching and weren't. Take it, take your own, or use whatever Sam
names in his greeting.
