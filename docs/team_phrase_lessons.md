---
title: Team phrase & site access — workstream lessons
created: 2026-08-12
updated: 2026-08-12
tags: [lessons, auth, team-phrase, rls, org-layer, supabase, cobi]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/team_phrase_expansion_plan]]"
  - "[[docs/kb-notes/methodology-a-shared-credential-can-only-scope-to-an-exclusive-surface]]"
  - "[[docs/kb-notes/methodology-server-enforced-shared-password-gate]]"
artifacts:
  - team_phrase.js
  - team_phrase_header.js
  - team_phrases.js
  - contracts.js
  - kb/supabase_site_phrase_fin.sql
  - tests/team_phrase_sites.test.js
  - tests/team_phrases.test.js
---

# Team phrase & site access — workstream lessons

The scratchpad for how COBI's shared phrases work, what they gate, and the
decisions still open. The distilled, reusable half lives in
[`methodology-a-shared-credential-can-only-scope-to-an-exclusive-surface`](kb-notes/methodology-a-shared-credential-can-only-scope-to-an-exclusive-surface.md).

---

## 2026-08-12 — Session 146 (SkyFund): the header control, and what site-awareness actually meant

### What Sam asked

> *"Look at each COBI tab and make sure there is a place to enter the team phrase
> wherever needed… It might be more efficient to just add it to the main header as
> long as it would reliably work for each tab that requires it. Since we select
> from the Site drop down initially, it would have to be aware of that and respond
> to the correct team phrase for the site."*

### What was measured first

Across all 34 tabs:

| | Count | Tabs |
|---|---:|---|
| Had its own phrase box | 11 | Team & RACI, Annual Workplan, Budget, Memory, MAP Data Quality, TMC Builder, Implementation Funding, Add project, Project lifecycle, GR Priorities, Mission Control |
| **Needed the phrase, offered none** | **7** | Contracts, Governance, MAP Users, NC/Learning Partners, Sierra Training, MAP Queue, College Briefing |
| Magic-link only | 5 | Credential Reference, Unified Courses, Canonical SUBJ4, Projects Editor, CPL News |

All 7 rendered *"sign in on the **Team & RACI** tab … and re-open this tab."* Two
of them gate a **read**, so the bounce cost the whole tab, not just the pen.

### ⭐ The premise in the question was wrong, and the app already knew

Selecting a site did **nothing** to auth. `cobi_orgs.js` is presentation-only and
says so in its own header. Worse, `team_pass_check()` is
`exists (select 1 from team_access where secret = p)` — it matches **any** row's
secret. So all three phrases (`ci`, `gr`, `raci`) already opened every
`team_pass_ok()` table, and **there was no `cpl` phrase at all** — what everyone
calls "the CPL phrase" is the `raci` row.

The real constraint: **a tab can require a site phrase only if it is EXCLUSIVE to
that site.** Every other gated tab is *also* a CPL tab, so demanding the org
phrase there locks out CPL users. `cobi_orgs.js` already carried that list
(`EXCLUSIVE`). Exactly two tabs qualify — `gr-priorities` (shipped long ago) and
`contracts`. And **C&I and CIP have zero Supabase-backed tables of their own**, so
their phrase protects nothing. An empty set, not an oversight.

Sam's steer closed it: *"so if they show up on two tabs, allow either…"* — which
costs nothing to implement, because the shared check already matches every secret.
That collapsed a job I had sized as "~45 tables, a judgment call per table" into
one function, one row, twelve policies and an unlock box.

### What shipped

- **`team_phrase_header.js`** — masthead control that follows the Site dropdown
  and names the scope it will unlock. Fixes all 7 bounce tabs by re-dispatching
  `cpl-tab-activated` for the live tab, reusing wiring 5 of them already had.
- **`team_phrase.js`** — site-scoped API. Each site phrase gets its **own** slot
  (`cpl_gr_pass` / `cpl_fin_pass`), generalizing what `gr_priorities.js` had done
  since it shipped, so holding Finance never costs you the shared phrase.
- **`team_phrases.js`** — 🔑 Team Phrases tab (see below).
- **`fin_pass_ok()`** + the `fin` row, applied additively.

### Bugs found on the way, all the same shape

- **Contracts' reload check tracked only the reviewer JWT**, so a *phrase* unlock
  left the "could not read the register" pane on screen until a manual reload.
- **The ⚙ phrase admin was hardcoded to `id=eq.raci`** — a site phrase would have
  had **no rotation path at all**. A credential you cannot change is one you
  cannot un-share when someone leaves.
- **NC/Learning Partners had no `cpl-tab-activated` listener**, so nothing entered
  anywhere else ever reached it.
- **The header popover kept its state in the DOM**, so a re-render arriving
  mid-typing (rAF, tab switch, site change) swallowed both the half-typed phrase
  and the error line — the control looked like it had ignored the click.

### 🔑 Team Phrases as a tab

Sam, later the same session: *"I lost track of where Manage team phrases is."*
Of course he had — it was a modal behind a button that only rendered for a
signed-in reviewer, inside one of 34 tabs. Now a listed tab, contents on a
magic-link reviewer sign-in.

⚠️ **The failure that tab exists to get right:** `team_access` RLS **filters** a
non-reviewer to zero rows and returns `200 + []`, not `403`. Rendering that as
"no phrases configured" tells a locked-out person the exact opposite of the
truth. Not-signed-in / not-a-reviewer / read-failed are three distinct renders.
Same on write — a policy-filtered `PATCH` answers `200` with an empty body, so a
save must prove it touched a row.

## 2026-08-14 — Session 157 (Sky157): the magic link had no door, and eight tabs had no input

Two PRs, both merged: **#1200** (reviewer sign-in moves to ℹ About) and **#1201**
(the shared locked banner + a CI guard).

### The reviewer sign-in was a pointer at a route that no longer existed

Sam: *"I tried using the magic link login on RACI tab but it only has the team
phrase input now, so I can't edit the new Admin tab."*

`raci.js` still carried a **complete `signIn()` whose button had been removed** —
the function had no caller anywhere. Meanwhile `admin.js` told anyone landing
signed-out to *"sign in with a magic link on the Team & RACI tab, then re-open
this tab."* Admin is **reviewer-only**, so the team phrase could never have
opened it either: the single documented way in was an instruction that could not
be carried out.

⭐ **Dead code that an instruction still points at is worse than no code**, because
it reads as a working path — to a session grepping for `signIn`, and to a person
following the words on screen.

This is the same bounce `team_phrase_header.js` was written to end (its docstring
quotes the very sentence), **one credential along**: SkyFund fixed it for the
phrase and the magic link kept the bug. The fix went to **ℹ About**, on Sam's
call and for a structural reason — the 🔒 masthead control is **site-scoped**
(Team ⇄ GR ⇄ Finance), while a reviewer sign-in is **personal identity** and not
site-scoped at all; nesting it there would imply a scoping the database does not
enforce. `mountInto()` lets Admin mount the *same* control inline, so nobody is
bounced anywhere. RACI keeps its phrase box — Sam: *"RACI can use the team phrase
rather than the magic link."*

### Then the same question, generalized — and it had to be measured

Sam: *"What do you recommend to insure that all tabs that require a Team Phrase
have an input on them?"*

**43 tables gate on a phrase, 26 on the READ.** Of 18 tabs touching one, **eight**
had neither an input nor a mention of the header control, and **thirteen live
strings across five files** still sent people to Team & RACI. Where the gate is on
the *read*, such a tab does not look locked — it looks **broken**: empty, nothing
to act on.

The answer was **not** a box on each of eighteen tabs (eighteen implementations to
drift, re-creating what the header solved). It was one
`CPL_TEAM_PHRASE.lockedBanner()` carrying a **working input**, plus
`tests/team_phrase_affordance.test.js` as the guard — because a rule that depends
on the next tab's author remembering it fails on their first day.

### ⚠️ My own detector was wrong twice, and both were caught by reading its output

1. It flagged five tabs as bare. **Three were false** — `gr-priorities` validates
   with `gr_pass_ok` (a site phrase is still a phrase), `unified-courses` gates on
   a **magic link** not the phrase, and `cpl-pathways` only anon-INSERTs to a
   public intake form. **Acting on that list would have added three wrong
   banners**, one of them an input that could never succeed. They are now
   `ALLOW_LIST` entries *with their reasons*, visible in a diff.
2. It then reported **clean while five live instances sat in one file** — the copy
   is written across concatenated string literals, so any regex over raw source
   must cross `" + "` to see it. It also had to strip comments first: its first
   run flagged the very comments explaining the fix.

Durable: [`methodology-a-copy-detector-must-read-the-rendered-string`](kb-notes/methodology-a-copy-detector-must-read-the-rendered-string.md).

### A fail-safe the tests caught

With `team_phrase.js` not yet loaded, the three rewritten tabs rendered an
**empty** locked state — strictly worse than the copy they replaced, which at
least named a tab. Each now falls back to a plain notice naming the header. Five
existing suites asserted the old copy; they were updated to assert the **better**
contract (a locked tab hands you a way *in*) and their harnesses now load
`team_phrase.js` so they exercise the path a browser takes.

`kb/phrase_gated_tables.json` is a **tripwire, not an authority** — it can only
under-report, and nothing reads it to claim something is protected. `admin.js`
still reads the gates live.


## Current state

| Phrase | Row | Gates | Client slot |
|---|---|---|---|
| Shared ("the CPL phrase") | `raci` | every `team_pass_ok()` table | `cpl_team_pass` |
| C&I | `ci` | nothing of its own | — |
| Government Relations | `gr` | `gr_content` + all shared | `cpl_gr_pass` |
| Finance | `fin` | **contracts** (`fin_pass_ok`, live 2026-08-12) + all shared | `cpl_fin_pass` |

**Where a credential is entered (as of 2026-08-14):** the **team phrase** at the
🔒 masthead control (any tab) or in a tab's own locked banner; the **personal
reviewer sign-in** at **ℹ About** in the header, or inline on Admin's signed-out
screen. Nothing sends anyone to another tab for a credential, and
`tests/team_phrase_affordance.test.js` fails the build if that copy returns.

**Coverage:** 18 tabs touch a phrase-gated table — 12 carry an input, 4 name the
header, 3 are exempt with a recorded reason. **5 tabs have an unmapped data
surface** (`activities-projects`, `military-partnerships`, `exhibit-adoption`,
`letters`, `knowledge-base`) and cannot be checked at all; the guard prints them
rather than counting them clean.

## Open — needs Sam

1. **Is a site phrase meant to be a superset?** Under "allow either" it opens its
   own tabs *plus* every shared one. Safe only while every holder is trusted with
   all shared CPL data. **Decide before the Finance phrase reaches anyone in
   Finance**: the split is a `scope` column, with `team_pass_check()` matching
   only `scope='shared'`.
2. **The three deep curation tabs still cannot take a phrase** — `kb_curation`'s
   INSERT policy binds `reviewer_email` to the JWT, so CER / Unified Courses /
   Canonical SUBJ4 are attribution-bound by design. That is Phase 2 of
   `docs/team_phrase_expansion_plan.md`, still unexecuted, and it needs the
   `team:<name>` stamp decision first.
3. **Projects Editor is a free win** — `projects` INSERT/UPDATE is already
   `is_allowed_reviewer() OR team_pass_ok()`, yet the tab offers magic-link only.

*(The Contracts policy swap, formerly item 1, is done — applied 2026-08-12; the
narrative above keeps the sequencing lesson.)*

## Next concrete step

**Nobody has exercised the reviewer sign-in in a real browser** — the sandbox
cannot reach the site, so #1200 is jsdom-verified only. The round trip to run:
**ℹ About → email me a link → follow it → land back on the tab you started from,
signed in.** Then settle the superset question (open item 1) before the Finance
phrase spreads, and take the Projects Editor win.
