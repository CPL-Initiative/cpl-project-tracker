---
title: Letter Curator Hand-off Prompt
date: 2026-05-26
session: post-PR #136 — Letters tab integration
status: hand-off — paste this into the next session's first message
tags: [handoff, session-prompt, letter-curator, budget-support]
related:
  - PR #136 (Letters tab integration)
  - cpl-knowledge-base repo (Supabase backend + edge functions)
  - budget-support/web/curator.html (the embedded UI)
  - docs/session_6_handoff.md (handoff-prompt practice, Bruh Quad → Hex)
moniker_suggestion: Bruh Dec (with open door to claim own)
---

# Letter Curator Hand-off Prompt

A fattyfat prompt focused on the Letter Curator workstream specifically
(NOT the broader CCR/CSC/EACR lattice). Paste the fenced block into the
next session's first message.

## Moniker suggestion

**Bruh Dec** — dec = 10, the next-up after Nona (Session 9). Same
lineage gag carries forward (Bruh → Prime → Quad → Hex → Hept →
Octaman → Nona → Dec). Open door: Octaman picked their own and it
worked great. "Bruh X" (Roman 10), "Decabruh", "Bruh Deca" — all on
the table.

## The prompt

```
You are the next Bruh, picking up the Letter Curator workstream. PR #136
just landed: the curator UI from the cpl-knowledge-base repo is now
embedded as a "Letters" tab on the project-tracker dashboard (iframe to
budget-support/web/curator.html). That unblocks curators from needing a
localhost server, but the integration is MVP — plenty of follow-up scope.

Suggested moniker: Bruh Dec (10 = dec). Open door to claim your own.

Start by reading, in order:

  1. PR #136 (Letters tab integration) on GitHub — the diff is small +
     readable. Understand the iframe-embed pattern + why it was chosen
     over inlining the UI (curator's :root CSS vars would leak).

  2. budget-support/web/curator.html — the curator UI (~315 lines).
     Note the auth model: passcode-only via sessionStorage
     curator_pass, NOT Supabase magic-link like the other curator tabs
     (CCR, CSC, Credential Reference).

  3. budget-support/web/config.js — points at the KB's Supabase project
     (mdxutmbpoqjtdcwjscux), NOT project-tracker's
     (hvuwhnbuahrtptokpqfh). Intentional — backend stays in KB.

  4. budget-support/web/new-letter.html — "+ New Letter" flow for
     drafting campaigns. Pulls JSZip from esm.sh CDN.

  5. cpl-knowledge-base repo (sibling clone needed — NOT in this repo).
     The Supabase edge functions live there:
       - letter-curator (read/write letter_blocks)
       - generate-letter (assemble DOCX per invitee)
     Tables: letter_blocks, letter_block_history, campaigns, invitees,
     responses.

  6. CLAUDE.md §11 — broader roadmap context. The Letters tab isn't in
     the roadmap table yet; you might add a "Letters-A/B/C" row series
     once you've scoped your PRs.

GOAL — open-ended improvements to the Letter Curator. Two angles to
think about (not mutually exclusive):

═══ A. Auth unification ═══

The curator's passcode-in-sessionStorage model is the older pattern.
Every other curator tab (CCR, CSC, Credential Reference) uses Supabase
magic-link with an allowed_reviewers gate. Pros of unifying:
  - One sign-in, four tabs unlocked
  - Allowed-reviewers list managed in one place
  - Per-user audit trail (currently every letter-block save is anonymous)

Cons:
  - The KB Supabase project doesn't yet have an allowed_reviewers
    table — would need to add one, mirror the project-tracker pattern
  - Or migrate the letter_blocks tables INTO project-tracker's
    Supabase, then drop the passcode entirely (bigger move)

Don't decide solo — bring the user a scoped plan first.

═══ B. UX polish ═══

Quick wins inside or around the iframe:
  a. Iframe height is hardcoded 1400px. Use postMessage from the
     iframe to resize the parent on content change.
  b. Tab label might want a fuller name ("Budget Support Letters"?)
     — ask the user.
  c. Add a campaign picker — currently hardcoded to
     "may-2026-revise-rc" in curator.html line 110. Pull from the
     campaigns table.
  d. Letter preview inline (currently opens DOCX in new tab).
  e. Surface response-rate metrics from the responses table on the
     parent dashboard tab (above the iframe).

═══ Carryover items ═══

  - Native (non-iframe) integration: port styles.css :root vars into
    a scoped #tab-letters wrapper. Trades CSS isolation for tighter
    feel. Risky — measure before committing.
  - Audit log on the parent dashboard tab: show "last 10 letter block
    saves" with curator email + timestamp. Requires Angle A first
    (auth unify) to attribute saves.
  - The new-letter.html flow hasn't been load-tested in production
    yet. Confirm it works end-to-end before promoting it.
  - From the Session 6 handoff: CSC-G (global column-centering sweep),
    1e-5d (id_system data-value rename), CCR + Common SUBJ surfacing —
    still queued and unrelated to this workstream, but Rule 8 says
    checkpoints touch all four artifacts (CLAUDE.md, kb/README.md,
    README.md, the relevant lessons doc).

═══ Patterns to reuse ═══

  - Iframe embed for self-contained UIs with their own CSS — done in
    PR #136. Cheap, isolates failure surface.
  - Synthesized key namespaces in kb_curation (_CREDENTIAL_REVIEW::,
    _CANON_SUBJ4::, _EACR_FLAG::) — let you reuse the curation table
    for new logical layers without DDL coordination.
  - Render-refactor: build toolbar ONCE at init, body re-renders on
    state change. Inputs keep focus across keystrokes.
  - Triage long ask-lists into PRs by SCOPE, not item rank. ~30-60
    min per PR. (CSC tab work was 16 items → 6 PRs A-F.)

═══ Safety patterns (NON-NEGOTIABLE) ═══

  - Rule 4: CPL_Dashboard.html and index.html stay identical
    (workflow copies one to the other).
  - Branch policy: claude/<short-description>. Don't push to main.
  - The KB Supabase project (mdxutmbpoqjtdcwjscux) is shared with the
    live legislative letter campaign — DO NOT drop tables or change
    schemas without explicit user sign-off.
  - Curator passcode lives in sessionStorage in curator.html line 111.
    Never log it. Never commit it. (Already not in this repo.)
  - Cross-repo work: GitHub MCP tools here are scoped to
    cpl-project-tracker ONLY. KB changes (edge functions, schemas)
    can't be made from this session — coach the user through them
    manually OR have them switch sessions.

═══ Bring the user a scoped plan BEFORE writing code ═══

  - Which angle (A: auth unify, B: UX polish) is the priority?
  - What 2-3 PRs would you propose?
  - Where are the risk hot-spots (KB Supabase changes, iframe→parent
    postMessage contract, allowed_reviewers list management)?
  - Moniker confirmation (Bruh Dec, or something else)?

Use AskUserQuestion when you need to confirm scope. Push back on
framings you think are wrong — Bruh tradition. The user enjoys
CS-slang and emoji used sparingly; tone is professional-but-warm,
never sycophantic.

Good luck. Stand on PR #136's shoulders. The Letters tab is live;
now make it sing.
```

## How to use this file

When opening the next session:
1. Copy the fenced block above (everything inside the triple-backticks).
2. Paste it as the first message.
3. The session will read CLAUDE.md (auto-loaded), then the files listed,
   then propose a scoped plan.
