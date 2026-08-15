---
title: Session 156 handoff (Sky155 → next) — the Admin tab, then the two-lane memory tab
created: 2026-08-14
updated: 2026-08-14
tags: [handoff, sierra, governance, architecture, admin, cobi, curation]
related:
  - "[[docs/kb-notes/adr-judgment-in-tables-mechanism-in-code]]"
  - "[[docs/kb-notes/reference-ui-design-system]]"
superseded: true
superseded_by: session_159_handoff.md
---

# You are Session 156

Session 155 was **Sky155**. Five PRs, all merged: **#1184** (adopter landing
pages), **#1185** (Send note), **#1186** (`sierra_rules`), **#1187** (hand-off
resilience), **#1188** (side-menu glyphs). `cpl-chat` is at **v51**.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['sierra','governance','architecture','admin','cobi','curation','testing']
       or summary ilike '%admin%')
order by event_date desc nulls last limit 40;
```

Seven rows carry `author = 'Sky155'`. **Do not re-derive:**
`sierra-rules-overlay-is-live`, `an-author-display-rule-defeats-the-hidden-attribute`,
`confirm-a-write-on-res-ok-not-on-having-sent-it`,
`a-test-bound-rots-when-the-code-legitimately-changes`,
`cpl-assistant-tab-is-the-same-assistant-but-carries-two-dependencies`,
`measure-a-join-match-rate-before-building-on-it`,
`d11-answer-covered-1-of-9-curated-credentials`.

Also **`normalise-both-sides-of-a-join` was promoted to `verified`** — its
`source` already cited a committed KB note and merged PR #1128, which the
corroboration gate treats *as* corroboration. Nobody had applied it, so the row
warning about the join scar sat outside the default view. **Check for others in
that state**; the gate does not enforce itself.

## ✅ What closed this run

**Sam tested live throughout, and every fix came from a real report.**

1. **Adopter landing pages (#1184).** He asked for links after #1183 landed.
   `STATEWIDE_RULE` asks for a `college | credit | landing page` table, but
   `renderAdopters()` emitted names and NO URLs — and the same rule says never
   guess a link. **Sierra was obeying exactly**; the rule's own fail-safe
   produced the empty column. `chatbox_college_profiles.landing_page_url` had
   been populated for 123 of 130 colleges the whole time — the **fourth**
   instance of curated-data-nobody-reads. Also fixed the LOCAL branch, which
   printed a bare count and no names, silently dropping Lemoore and Riverside.
2. **Send note (#1185).** Four defects, one root: `.cplchat-fb-note {display:flex}`
   is an author rule and **beats `[hidden]`**, so `hidden` was inert. The worst
   was the fourth — the confirmation was **unconditional**, so a note that never
   saved was thanked for.
3. **`sierra_rules` (#1186)** — Priority 1 of the ADR. See below.
4. **Hand-off resilience (#1187)** — from his own question about suppressing
   CPL Assistant.
5. **Glyphs (#1188)** — 10 of 36 side-menu items, all decorative, both HTMLs.

## 🎯 PRIORITY 1 — the Admin tab

Sam asked directly whether this run would ship it. It did not, and **the reason
is decisions, not size.** Two questions are open and both are structural:

1. **What gates Admin itself?** It controls visibility and access for every
   other tab. **Recommend reviewer magic-link ONLY** — a phrase holder able to
   re-scope what other phrase holders see is the unresolved site-phrase superset
   problem one level up, and worse.
2. **Does it absorb Team Phrases?** That tab deliberately does *not* open to a
   phrase holder (a holder who can rotate makes rotation meaningless). If Admin
   is reviewer-gated anyway they may be the same gate — **merge deliberately or
   keep them apart deliberately, not by accident.**

⚠️ **THE TRAP:** a nav "access" setting is a **DISPLAY control, not a security
control.** Hiding a menu item does not protect the data behind it; RLS does. A
manager UI with an access dropdown *invites* the opposite belief. Put it beside
the real gates — which tables carry RLS, which tabs gate a READ vs only a
render — so the difference is structural rather than something a tooltip keeps
insisting on. **Only two tabs gate a READ.**

⚠️ **SUPPRESS BY HIDING, NEVER BY REMOVING.** Measured this run: the base
`cplchat-*` CSS lives in the `#chatbot` pane's MARKUP, and My College's embedded
Sierra depends on it. Hiding is safe (CSS in a hidden container still applies
document-wide); removing the pane unstyles Sierra everywhere else.
`cobi_orgs.js` already does the safe thing — hides the nav button, keeps the
pane, and marks it `data-org-hidden="1"`. **Reuse that attribute**; it is what
#1187's fallback keys on, and it is testable in jsdom where `offsetParent` is not.

Admin is also the natural home for the **`sierra_rules` curator UI** (below) and
collects the config surfaces now scattered across four places: Team Phrases,
governance owners, Sierra instructions, `sierra_rules`.

## 🎯 PRIORITY 2 — `sierra_rules` has no UI yet

The table is **live and wired**; Sierra reads it every turn. Nothing can edit it
but SQL. Schema: `key, title, body, applies_when, sort_order, active,
memory_slug, updated_by/at` + `sierra_rules_log` (trigger-written).

- **Seeded EMPTY on purpose** — zero rows means every rule comes from its code
  default, so the overlay is proven by construction and the table reads as *what
  we deliberately changed* rather than a second copy of `index.ts`.
- **Reviewer-only, read and write** (Sam's call).
- **The protected set is enforced in CODE**: `portal`, `landing_page`, `volume`,
  `credit_status` always ship their code body, `active=false` is ignored, and a
  curator body is APPENDED. Do not move that into the table — the table is the
  thing being guarded.
- **Ship the "which rules were in play" view with the UI.** `chat_interactions`
  now records `rules_fired` / `rules_overridden` per turn. The ADR argues this is
  worth more than editability, and it is the half not yet visible to anyone.
- `AUDIENCE_RULES` is still code-only — keyed by audience rather than ordered, so
  it wants a different shape. Deliberately deferred.

## 🎯 PRIORITY 3 — the two-lane memory tab, then the drift check

Unchanged from handoff 155, and now unblocked: `memory_slug` exists on
`sierra_rules`. Two lanes (`cpl_memory` = what we know; `sierra_rules` = what
Sierra does), one tab, then the cron check reporting **"decided in memory, no
Sierra rule implements it."** It would have caught this run's landing-page gap,
the statewide flag and the `ccc_rec` gate.

## 🔴 OPEN — Sierra named 1 of 9 D1.1 credentials

`cpl_memory` `d11-answer-covered-1-of-9-curated-credentials`. Sam's live answer
named `AWS D1.1 SMAW Qualified Welder` and its four adopters. There are **nine**
D1.1 credentials. **Riverside has articulated three and Lemoore one, and neither
college appeared anywhere** — not even in the teaches-welding band.

⚠️ **NOT YET DIAGNOSED:** whether retrieval never returned them, or the answer
rendered only the strongest match. **That distinction decides the fix — measure
before building.**
⚠️ The five `LA City Certified Welder` variants are a genuinely DIFFERENT
municipal certification. A plain AWS D1.1 holder must not be told they qualify.
Riverside's and Lemoore's ARE AWS-issued D1.1 — those are the real misses.

## ⚠️ Things that will mislead you

1. **`npm install` before trusting a green local sweep.** The sandbox ships no
   `node_modules`, so every jsdom suite crashes on a missing module — and that
   crash MASKS the real error underneath. #1184 merged with two suites broken
   because of exactly this.
2. **Check the failing test NAME before assuming it is yours** — needed twice
   this run. Four reds turned out to be stale test BOUNDS, not defects.
3. **`tests/lib/lift_ts.js` strips type ANNOTATIONS, not DECLARATIONS or `as`
   casts.** A `type X = {...}` inside a lifted region is a SyntaxError reading
   "Unexpected identifier". Inside a lifted block use `Array<X>` / `Record<X,Y>`,
   never `X[]` or a bare custom type, and no object-literal return annotation.
   `Record<string,(c:T)=>boolean>` also fails — the `>` in `=>` closes the
   generic early.
4. **A lift marker must include its `//`.** Slicing from mid-comment drops the
   `//` and the block starts with bare prose.
5. **`governance.test.js` is still the one known-red on `main`** (drift
   candidates `< 25`; the guard works, the queue needs triage).
   `cpl_funding.test.js` still hangs (rc=124), so `node tests/run.js` cannot
   finish — run suites individually.
6. **`cpl-chat-deploy.yml` needs `confirm: DEPLOY`.** A bare dispatch 422s.

## 🧹 Carryover

- **The §11 pare-down is owed a FOURTH session.** `stacked_roadmap_cell` flags
  **"MAP Users / student contact"**, now 4,447 chars. Left again for the same
  honest reason: Sky155 never worked that row, and compacting a cell about a
  workstream you have not worked risks deleting something load-bearing.
  **Whoever next touches MAP Users must compact it as part of that work.**
- `kb/docs_audit/2026-08-14.md`: 6 `oversized_doc`, 58 `kb_note_dialect`,
  44 `vault_heavy_path`.
- Older, unchanged: 12 adoption-file statewide titles absent from
  `chatbox_credentials` · corpus covers 59 of 123 colleges · the 7 `via:"search"`
  contacts · the site-phrase superset decision · the identity crosswalk write to
  Supabase · the partner-crosswalk engine's 2nd run · the freehand CR head.

## Patterns that worked

- **Measure the join before building on it.** 86/86 exact matches said an
  exact-key `.in()` was right and normalising would have been needless machinery.
  The scar creates a reflex to always fold both sides; over-folding is the mirror
  error.
- **Check whether a rule is even FOLLOWABLE before treating it as compliance.**
  Applied twice in two days now, and it was the whole diagnosis of #1184.
- **Verify a test against the pre-fix source.** 1/20 → 20/20 and 5/23 → 23/23
  prove reproduction rather than description.
- **Prove equivalence, don't infer it.** The `sierra_rules` refactor was shown
  byte-identical across all 16 context combinations rather than argued to be safe.
- **Answer an architecture question by reading the code, not from the shape of
  the question.** "It's the same assistant, so nothing is lost" was 90% right and
  the missing 10% would have silently broken the trainer.

## Safety patterns to honour

- Rule 4 — `CPL_Dashboard.html` / `index.html` byte-identical (`cmp -s`).
- Never force-push `main`; merge on `unstable`, not just `clean`.
- Sandbox is egress-blocked from `*.supabase.co` and the MAP hosts — Supabase via
  MCP only.
- `cpl_memory` CHECK constraints: `summary` ≤400 (hit twice this run), `detail`
  ≤4000, `kind` ∈ fact/pitfall/opportunity/risk/wishlist/question/decision/
  milestone/procedure, `org` ∈ cpl/ci/cip/gr/shared. `cpl_memory_log.action` ∈
  create/update/verify/stale/supersede/delete — **not** `insert`.
- **A public-bot deploy is outward-facing.** Say so before dispatching it.
- The stop hook's "unpushed commits" nag after a squash-merge is a false
  positive. Verify the four ways, then ignore. Never amend.

## Moniker

**SkyProse** is still unclaimed (offered five times). Or coin your own; if Sam
names one, his wins.
