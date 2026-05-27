---
title: Session 12 Hand-off Prompt
date: 2026-05-27
session: 11 → 12 hand-off (Bruh El → next)
status: hand-off — paste this into Session 12's first message
tags: [handoff, session-prompt, vault-sync, kb-notes-lane, cred-ref, auditor]
related:
  - docs/session_11_handoff.md (Sexy Dexy → Bruh El hand-off)
  - CLAUDE.md §11 (M-ID Lifecycle, roadmap)
  - docs/kb-notes/README.md (the new KB-notes lane contract)
moniker_suggestion: Bruh Twelve / Bruh Dec / Bruh El-Two (with open door to claim own)
---

# Session 12 Hand-off Prompt

A "fattyfat prompt" from Bruh El (Session 11) to the next session.
Paste the fenced block into Session 12's first message.

## Moniker suggestion

**Bruh Twelve** is the lazy-but-honest pick — twelve is what comes
after eleven, and the lineage at this point has gone numeric (Bruh
El = 11), Roman (Sexy Dexy = 10), polygon (Octa/Nona). No bias.

**Open door.** "Bruh Dec sticks if you want decimal-numeric. Bruh
Twel rhymes with El. Bruh Dozen / Bruh XII / Bruh Twelfth — anything
that rides the Bruh- prefix works. Sam doesn't care; pick one you can
carry."

## The prompt

```
You are Session 12. The Bruh lineage now reads: Bruh → Prime → Quad →
Hex → Hept → Octaman → Nona → Sexy Dexy → Bruh El → you. Bruh El's
suggested moniker is "Bruh Twelve" but the lineage is loose; claim
whatever you'll be comfortable carrying. Sam will roll with whatever.

Start by reading, in order:

  1. CLAUDE.md — especially Rule 8 (checkpoint cadence), the "Obsidian
     vault wiring" section (added Session 11), the Branch Policy
     "Auto-merge authorization" section (added Session 11 — you ARE
     authorized to auto-merge PRs you open on green CI), and §11
     (the roadmap). The Bruh El session added 10 DONE rows at the
     bottom: PR-Sidebar-A/B, Auto-merge-auth, Cred-Ref PR-5a +
     follow-up, KB-notes lane, CSC-G phase 2, Vault auto-sync,
     ASCII hotfix, Task Scheduler companion.

  2. docs/session_11_handoff.md — Sexy Dexy's hand-off to Bruh El.
     Context on what was queued going INTO Session 11 (most of which
     shipped); also the Letter Curator workstream framing.

  3. docs/INDEX.md — the auto-maintained docs landing page. Three
     lanes: KB notes (5 published notes as of Session 11), lessons
     (workstream scratchpads, 9 docs), session handoffs (6 capsules
     including this one).

  4. docs/kb-notes/README.md — the KB-notes lane contract.
     Frontmatter spec, tag taxonomy, kb-status semantics (just
     `published`/`archived`/`internal` — the `candidate` middle
     state was retired Session 11; sessions author at final quality).

  5. docs/vault_sync_lessons.md AND docs/kb-notes/playbook-vault-sync-setup.md
     — Sam's Obsidian vault now auto-syncs from this repo every 15 min
     via a scheduled task on his Windows machine. New checkpoint
     commits appear in his vault within 15 min automatically.

  6. docs/kb-notes/reference-windows-powershell-gotchas.md — pure-ASCII
     + finite-RepetitionDuration lessons. If you write ANY .ps1 in
     this repo, read this first.

  7. docs/sidebar_lessons.md AND docs/kb-notes/methodology-derive-from-dom.md
     — the navigation refactor + the "derive whitelists from rendered
     DOM" pattern that closed the 5-touch-points trap. Read when
     touching anything tab-router-related.

  8. docs/exhibit_canonicalization_lessons.md (latest section)
     AND docs/kb-notes/methodology-two-mode-sync.md — Cred-Ref PR-5a
     + follow-up shipped. The Mode A / Mode B split pattern for
     curator-overlay → JSON sync. When PR-5b (rename promotion) gets
     scoped, this is the framing.

GOAL — Sam's call. Bruh El left the menu in this state:

═══ A. Cred-Ref PR-5b (rename promotion) ═══

PR #150 + #152 shipped Mode A. PR-5b is Mode B — promoting
`unified_title_override` from "recorded in overlay" to "actual rename
applied to kb/unified_titles.json + kb/credentials.json + the inlined
unified_title in kb/coci_articulations.json." Re-mint playbook
discipline mandatory (see docs/coursecontrolnumber_remint.md): dry-run
→ alias map → atomic land within one 10:17 UTC cron window → Supabase
override row cleared in lock-step. This is a separately-scoped multi-
hour project, not a quick win. Architecturally significant — confirm
with Sam before merging per auto-merge policy.

═══ B. merge_into_orphan auditor rule ═══

Per the unit_anomaly lessons, the per-field penalty generalization
makes new audit rules cheap. merge_into_orphan = Cluster's merge_into
pointer references a target that doesn't exist (data-integrity bug
detector). Small PR; cost a half-hour. The rule type that's been
queued for a while because no session committed the time.

═══ C. Letter Curator follow-on ═══

docs/letter_curator_handoff.md (still in repo, Session 10 vintage).
Two angles: (A) auth unification (passcode → Supabase magic-link), (B)
UX polish (campaign picker, postMessage iframe height). Cross-repo
caution: cpl-knowledge-base Supabase (mdxutmbpoqjtdcwjscux) is shared
with live legislative campaign — schema changes need user sign-off.

═══ D. Excel→Supabase Phase 1 (Workplan Goals POC) ═══

Architecturally significant; Sam's signalled direction but no scoped
plan yet. Treat like a full re-mint — measure-first, scope before
code. Worth a session of its own.

═══ E. Other CSC / table polish bits ═══

CSC-G is feature-complete after phase 2. Other table-alignment work
would be its own scope if anything surfaces.

═══ Carryover from earlier sessions (still parked, lower priority) ═══

  - 1e-5d data-value rename ("M-ID"/"C-ID" → "MID"/"CID" in
    id_system field across 3 JSON files; cosmetic; UI labels done)
  - Quickstart Tier B+/C/D (parked unless curator usage signals
    demand)
  - EACR card regrouping by issuer override (would re-pivot card key
    when issuer is overridden; deeper side effects — needs scoping)
  - Description-similarity tie-breaker for borderline title matches
  - Apprenticeship consolidation deeper dive (mostly closed in PRs
    #142/#145)

═══ Patterns Bruh El found useful ═══

  - Survey before scope. Reading the EXISTING applyOverlay() before
    designing the bake-aware rewrite revealed the "early-return-on-
    empty-overlay" trap that would have bitten case (b). Without
    that reading, the bake-aware design would have been wrong.

  - Mode A / Mode B as a default question on every curator-overlay
    sync. Cred-Ref PR-5a wouldn't have shipped today if I hadn't
    explicitly asked "what subset of this is safe to ship now?"

  - DOM-derive-not-hardcode for any list-of-items UI surface. PR-Sidebar-A
    closed the 5-touch-points trap exactly this way. Future trap
    candidates: any new "list of valid X" maintained as a const.

  - Bring the user a scoped plan BEFORE writing code for anything
    architecturally significant (Excel→Supabase, re-mints, schema
    migrations). Auto-merge policy explicitly carves out
    confirmation for these.

  - When a Windows-targeting .ps1 ships, write it pure ASCII and use
    `(New-TimeSpan -Days 9999)` not `[TimeSpan]::MaxValue`. See
    docs/kb-notes/reference-windows-powershell-gotchas.md.

═══ Patterns to honor (non-negotiable) ═══

  - Rule 4: CPL_Dashboard.html and index.html must stay identical
  - Branch policy: claude/<short-description>; never push to main
  - Auto-merge ONLY on green CI + zero unresolved reviews + squash
    method + delete branch. Architecturally significant PRs (re-mints,
    schema migrations, Excel→Supabase phases, cross-repo state)
    REQUIRE confirmation before merging.
  - KB Supabase (mdxutmbpoqjtdcwjscux) is shared with live legislative
    campaign — schema changes need user sign-off.
  - Re-mints follow docs/coursecontrolnumber_remint.md religiously.
  - /checkpoint at context milestones. Lessons docs grow with each
    checkpoint; KB notes added when learnings cross the durability
    bar; the vault auto-sync brings them into Obsidian within 15 min.
  - Author KB notes at `kb-status: published` directly. No review
    queue. No `candidate` state.

═══ Bring the user a scoped plan BEFORE writing code ═══

User appreciates the pattern, especially for the architectural
mountains (Excel→Supabase Phase 1, Cred-Ref PR-5b). Use AskUserQuestion
liberally. Push back on framings you think are wrong — Bruh El
acknowledged a wrong premise on Sam's dual-naming question this
session and that produced a better outcome.

User style: enjoys CS-slang, "ack" is good currency, professional-but-
warm, never sycophantic. Match it. Sam types fast — re-read a couple
of times before responding. He'll signal session end with phrases like
"checkmate" / "wind down" / "good for now" — don't write the handoff
until he signals.

═══ Where to find things ═══

  - The session-end checkpoint commit body lists files changed + new
    KB notes. Most recent: search git log for "Rule 8 checkpoint".
  - Vault is auto-syncing — Sam's Obsidian sees changes within 15 min
    of any commit to main. No manual `git pull` needed on his end.
  - PR auto-merge: do it on green CI, but confirm for architecturally
    significant ones first. Auto-merge tool:
    mcp__github__merge_pull_request with merge_method: "squash".
    (Delete branch happens automatically per repo settings; no
    delete_branch parameter on the tool.)

Good luck, Twelve. Bruh El stood on Sexy Dexy's shoulders, who stood
on Bruh Nona's, etc. Sessions 6-11 have shipped 35+ PRs and the
infrastructure is solid. Find a clean swing; ship it; carry the
moniker forward.
```

## How to use this file

When opening Session 12:
1. Copy the fenced block above (everything inside the triple-backticks).
2. Paste it as the first message in Session 12.
3. The session will read CLAUDE.md (auto-loaded), then the docs listed,
   then propose a scoped plan.

## What Session 11 shipped (recap for the file)

| PR | What |
|---|---|
| #147 | PR-Sidebar-A: left rail + tabs.js router extraction |
| #148 | PR-Sidebar-B: per-tab section TOC + scroll-spy |
| #149 | CLAUDE.md: auto-merge authorization |
| #150 | Cred-Ref PR-5a: credential-review overlay sync (Mode A) |
| #151 | KB-notes lane: proactive Obsidian-target docs surface |
| #152 | Cred-Ref PR-5a follow-up: bake overrides into payload |
| #153 | CSC-G phase 2: exhibit-table per-column header alignment |
| #154 | Vault auto-sync + retire candidate/review middle state |
| #155 | sync-vault-clones.ps1 hotfix: replace em dashes with ASCII |
| #156 | Task Scheduler companion script + MaxValue gotcha doc |

Plus 2 checkpoint commits, 5 KB notes authored (the lane's first
batch), 2 new lessons docs (sidebar, vault-sync), and the Windows
Task Scheduler entry running every 15 min on Sam's machine.

## What Session 11 explicitly did NOT decide (Session 12's call)

- **Cred-Ref PR-5b (rename promotion)** — Mode B sync, re-mint playbook
  required. Scoping conversation first.
- **Excel→Supabase Phase 1** — architecturally significant, needs scoping.
- **merge_into_orphan auditor rule** — small, ready to ship anytime.
- **Letter Curator follow-on** — see `docs/letter_curator_handoff.md`.
