---
title: Unified memory table — one cross-repo store for facts, pitfalls, opportunities, wishlist, and timeline events
created: 2026-07-24
updated: 2026-07-24
tags: [adr, architecture, supabase, obsidian-target, memory, taxonomy]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/adr-reference-data-committed-json-vs-supabase]]"
  - "[[docs/kb-notes/playbook-write-only-table-private-vault-digest]]"
  - "[[docs/memory/cpl_memory]]"
artifacts:
  - kb/supabase_cpl_memory.sql
  - docs/memory/cpl_memory.md
---

# Unified memory table — one cross-repo store for facts, pitfalls, opportunities, wishlist, and timeline events

> **One-sentence summary** — A single, queryable **`cpl_memory`** table (Supabase,
> live-curatable, mirrored to an Obsidian-visible markdown file) that indexes the
> notable **facts · observations · pitfalls · opportunities · wishlist items ·
> milestones · events · changes** already scattered across the three repos, with a
> per-entry **verification status** so a collect-and-verify loop can keep it honest.

## Context

Sam (SkyKnow session, 2026-07-24) asked whether the projects would benefit from a
**one-stop cumulative memory** — "notable facts, observations, pitfalls,
opportunities, and wish list items" (later extended to **notable events,
milestones, and changes**) — that improves over time through a **collection +
verification process that loops**, with columns for a layman summary, an
AI-useful form, and a timestamp/user log. He asked first whether we already have
the equivalent.

**We have all the ingredients, fragmented.** Every "kind" already lives
somewhere, but across five artifact types, two formats, and three repos, with no
single queryable surface and no consistent "is this still true?" field:

| Kind | Lives today in | Format |
|---|---|---|
| facts | `docs/kb-notes/` (`reference`/`glossary`), `CLAUDE.md` | markdown |
| observations | `docs/<workstream>_lessons.md` | markdown |
| pitfalls | `CLAUDE.md` Critical Rules, `methodology` KB notes | markdown |
| opportunities | §11 Roadmap "parked/queued", cross-lane flags in narratives | markdown |
| wishlist | `kb/cpl_todos.json` (the 📋 feed — capped ~12, resets) | JSON |

The closest existing analogues are **`cpl_todos.json`** (proves the
structured-feed-rendered-on-the-dashboard pattern, but wishlist-only, tracker-only,
deliberately ephemeral) and two **domain-specific** Supabase tables (`sierra_guidance`,
`merge_doctrine_notes`). There is **no general, cross-repo, cumulative memory store**.

## The claim (the decision)

**Stand up one `cpl_memory` table as a cross-repo *index* over the existing
lanes — not a sixth silo that duplicates them.** Three design calls:

### 1. Structure the "AI column", don't paraphrase into it

Sam's instinct — a column "in efficient AI-useful language" — is right that AI
wants something different, but the difference is **not compressed jargon** (modern
models read plain English fine, and a paraphrase doubles maintenance for no gain).
What makes an entry machine-*actionable* is **structure**:

- `summary` — plain-language, one sentence (**Sam's column 1**).
- `detail` — why it matters **+ the trigger** ("read before touching X"). The
  trigger is the highest-value field: it's the `Read it BEFORE:` pattern the KB
  notes already use, and it's what turns memory from an archive into something a
  session consults *at the right moment* (**Sam's column 2, reshaped**).
- `kind` · `scope` · `tags[]` · `status` · `source` · `affects[]` · `related[]` —
  the fields a loop can filter, dedupe, verify, and cross-link on. `source`
  **links to the KB note / PR / file that holds the full record**, so the table
  indexes the durable lanes instead of competing with them; `affects[]` / `related[]`
  carry the ripple layer (below).
- `created_at` · `updated_at` · `author` · `verified_at`/`verified_by` (**Sam's
  column 3** — timestamp + user log).

### 2. Home = Supabase + an Obsidian-visible markdown mirror (hybrid)

Measured against the standing **[[docs/kb-notes/adr-reference-data-committed-json-vs-supabase]]**
decision rule (Supabase only if curators edit live through the dashboard AND edits
must show live AND PR-per-change is friction), memory **passes all three** — Sam
wants to curate it live and grow it continuously. So it earns Supabase. But that
ADR's fourth point stands: **a DB table is invisible to Obsidian, and the vault is
the memory layer.** So the table is mirrored to a committed markdown file
(`docs/memory/cpl_memory.md`) that vault-sync carries into the graph, with
wikilinks back to each entry's source note. Direction of truth: unlike a reference
authority (JSON is source-of-record, Supabase is the diff), here **Supabase is the
live capture/curate surface and the markdown is a periodic *digest*** — the
`[[docs/kb-notes/playbook-write-only-table-private-vault-digest]]` direction.

### 3. The loop = the existing checkpoint cadence, not a new ritual

The "collection + verification process that loops" rides Rule 8. Each checkpoint a
session (a) **proposes** new rows from what it learned and (b) **re-verifies** a
slice of existing ones — bumping `verified_at`, flipping `status` to `stale`, or
marking `superseded_by`. Wiring it to something that already runs is what stops it
rotting (the same failure mode Rule 3's kpi-gap and the stale-handoff rule warn about).

## The taxonomy — the concise-yet-comprehensive `kind` set

Sam asked for "the most concise and comprehensive set of memory types." The key
move is **two orthogonal axes, not one growing list**:

- **`kind`** = the *nature* of an entry (a small **closed** set — 8).
- **`tags`** = the *domain* it's about (an **open** facet — `security`, `privacy`,
  `org-access`, `integration`, `auditor`, `supabase`, `ui`, `re-mint`, …).

Security/privacy/org-access/integration are **not** peers of "fact" — a security
item can *be* a fact, a pitfall, a risk, or a decision. Making them kinds would
explode the list combinatorially; making them tags keeps 8 kinds covering
everything. The collapses that got us to 8: `observation` → `fact` + status
`proposed` (the status field already carries provisional-ness); `event` → `milestone`;
`change` → `decision`.

| Family | Kind | Captures |
|---|---|---|
| **Knowledge** | `fact` | a durable, verified truth |
| | `pitfall` | a trap / failure-mode / gotcha to avoid |
| **Operational** | `procedure` | a **ripple checklist** — change X → also update Y, Z, W (Sam's COBI pain; see below) |
| **Direction** | `opportunity` | an opening worth pursuing (upside) |
| | `risk` | an open concern to watch (downside — often security/privacy/access) |
| | `wishlist` | a wanted-but-unscheduled item (feeds the 📋 To-Do) |
| **Timeline** | `decision` | a choice / policy / direction set |
| | `milestone` | a notable achievement or event reached (dated) |

`status`: `proposed` → `verified` → (`stale` | `superseded`).

### The `procedure` kind + the ripple layer (Sam's COBI change-impact pain)

Sam's sharpest observation: *"it's tricky to update all related fields in various
tabs and report engines when I make a change."* Half the Critical Rules already
**are** ripple rules (Rule 4's twin HTMLs; the naming rule enforced across 4 report
engines + docx + a `sierra_guidance` row + the public KB; "re-key **every**
id-keyed map or evidence severs silently"; the checkpoint's ~8 artifacts). So the
table carries the blast radius as data:

- a **`procedure`** kind — the runbook/checklist itself ("when you touch X, also
  update Y, Z, W");
- **`affects text[]`** — the surfaces (files/tabs/report engines) an entry ripples
  to, so it's **reverse-queryable** ("show me every entry whose `affects` includes
  `annual_report.js` before I edit it");
- **`related uuid[]`** — links any `decision`/`fact` to its `procedure`(s) and to
  related entries.

This turns `cpl_memory` from an archive into a **change-impact map**. The seed
ships 6 real procedures (`pr1`–`pr6` in the mirror) drawn straight from the ripple
rules the codebase already lives by.

## Security, privacy & organizational access

Sam asked these be first-class. The posture:

- **Never anon/public-readable.** Unlike the `*_suggestion` / `*_interest` intake
  tables (anon-insert), `cpl_memory` has **no anon policy**. Read is gated to the
  team (`is_allowed_reviewer() OR team_pass_ok()`); write to reviewers. If entries
  get candid, tighten read to `is_allowed_reviewer()` alone.
- **Content rule — no secrets/PII.** No tokens, keys, or unpublished sensitive
  personal data in any row. Candid *internal* observations are fine (this is the
  private vault layer); nothing that would harm if the vault leaked.
- **The public boundary holds.** The table syncs to the vault + CPLBrain with no
  review gate, but **never** to the public `cpl-knowledge-base` except through the
  human-gated curation pipeline — same rule as `/checkpoint`. A `visibility` column
  (`internal` default; `public` never set automatically) makes the boundary explicit.
- **Org access is a known gap, tracked as a `risk` row.** The COBI org layer has no
  per-area data isolation yet (CPL and C&I phrases unlock the same tables); when
  multi-org gating lands, `cpl_memory` can scope by `scope`/tags or a future
  `org` column. Captured as seed entry `r2`.

## Integration

How `cpl_memory` plugs into what already exists (rather than sitting apart):

- **Checkpoint loop (Rule 8)** — the collect+verify engine; `pr6` lists it as a
  procedure. The checkpoint adds `cpl_memory` to the artifacts it refreshes.
- **Dashboard** — a team-gated 🧠 Memory pane beside the 📋 To-Do feed (same gated
  read path); the 📋 feed becomes the short, live slice of the `wishlist`/`opportunity`
  kinds.
- **Obsidian** — the `docs/memory/cpl_memory.md` mirror rides vault-sync; wikilinks
  wire entries into the graph.
- **Agents/MCP** — sessions read/write via the Supabase MCP tools (the sandbox
  can't reach `*.supabase.co` directly — `f7`).
- **Ripple map** — `affects[]` is the reverse index that answers "what must I
  update when I touch this engine?" — the direct payoff for the COBI pain.

## How we got here

Prototyped as a **seed of 33 real entries** across all 8 kinds (incl. 6 `procedure`
ripple checklists) pulled from the existing corpus — Critical Rules, the roadmap,
KB notes, `cpl_todos.json`, session narratives — so the shape can be felt with true
content before the schema and loop are committed (`docs/memory/cpl_memory.md`). The
schema-of-record lives at `kb/supabase_cpl_memory.sql` and is **not yet applied to
the live DB** (per Rule 9: apply only after Sam's review, with a fresh read at
write-time).

## When this applies (and when it doesn't)

- **Applies to:** durable, cross-cutting knowledge and timeline items worth one
  canonical, queryable home and a "still true?" check.
- **Does NOT replace:** the KB notes (the *full* prose record — the table `source`
  points *into* them), the lessons docs (workstream scratchpads), or `cpl_todos.json`
  (the short, resetting dashboard checklist — memory is the cumulative store behind it).
- **Guard:** the value is the *index*, not another place to keep in sync. If an
  entry's full story belongs in a KB note, write the note and let the row point to
  it — don't inline the whole thing.

## See also

- `[[docs/memory/cpl_memory]]` — the seeded markdown mirror (this ADR's prototype)
- `kb/supabase_cpl_memory.sql` — the schema-of-record (pending apply)
- `[[docs/kb-notes/adr-reference-data-committed-json-vs-supabase]]` — the home decision rule
- `[[docs/kb-notes/playbook-write-only-table-private-vault-digest]]` — the DB→vault digest direction

---

*Authoring check: durable (the design decision is stable), reusable (any future
cross-repo memory work), distilled (one decision + one taxonomy), self-contained.*
