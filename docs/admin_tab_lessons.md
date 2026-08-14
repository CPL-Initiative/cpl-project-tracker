---
title: Admin tab + the side menu as data — lessons
created: 2026-08-14
updated: 2026-08-14
tags: [lessons, admin, cobi, navigation, governance, sierra]
artifacts:
  - admin.js
  - nav_overlay.js
  - nav_groups.js
  - cobi_orgs.js
  - sierra_training.js
  - chatbox/supabase_cobi_nav.sql
  - chatbox/supabase_cobi_rls_gates.sql
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/adr-the-side-menu-as-an-overlay-over-code-defaults]]"
  - "[[docs/kb-notes/methodology-an-empty-read-is-only-evidence-if-the-set-cannot-be-empty]]"
  - "[[docs/session_157_handoff]]"
---

# Admin tab + the side menu as data — lessons

## 2026-08-14 — Session 156 (SkyGate)

Five PRs: **#1190** (Sierra's built-in rules pane), **#1193** (Admin tab),
**#1195** (drag and drop), **#1196** (Arrange to the top + audience filter),
plus the governance-red resolution. Sam tested live throughout and every
correction below came from a real report.

### What shipped

1. **Sierra's built-in rules, visible and editable** (Sierra Training, not Admin —
   Sam's call, and it puts the whole instruction stack on one screen in
   precedence order). All ten rules, in the order she reads them.
2. **The Admin tab** — every menu item beside the RLS gate that actually protects
   it, read live.
3. **The menu became data** (`cobi_nav`) with drag and drop.
4. **The audience filter** — show a menu item only to signed-in people.

### The lesson that generalises furthest

**An empty read is only evidence if the set cannot legitimately be empty.**
`team_phrases.js` infers "not a reviewer" from `200 + []` because `team_access`
is known non-empty. `sierra_rules` is **seeded empty on purpose**, so copying
that inference would have told a reviewer they were locked out AND told a
locked-out person Sierra has no rules. Full note:
[[docs/kb-notes/methodology-an-empty-read-is-only-evidence-if-the-set-cannot-be-empty]].

The corollary saved work later: the Admin tab's `cobi_rls_gates()` RPC returns one
row per table — a set that is never empty — so it needed **no probe at all**.

### Five ways a static scan says "nothing to protect"

Building the tab→data map, every one of these produced a confident, wrong,
reassuring answer:

1. **13 of 35 tabs load eagerly**, not through the boot dispatch.
2. The boot regex captured only the **first** `loadScript` per tab — so every
   chain-loading tab was credited with its data file, not its implementation.
3. `cpl_memory.js` defines `REST` **with a trailing slash**, so the table regex
   missed it entirely.
4. Tabs reaching data only through **RPCs** (`chatbot`, `raci`) looked dataless —
   and `cpl_chat` is the widest data surface in the app.
5. **Views were excluded** from the RPC, so any tab reading one said "not
   mapped". Views carry no RLS of their own.

On a security-facing surface each of these is not a gap but a **claim**. Five
tabs remain genuinely unmapped and render as *unknown with the reason stated* —
the `waitingBreakdown()` lesson applied to a scan rather than a query.

### Defects found in my own work before shipping

- **`buildDraft` seeded from `plan()`, which carries placement only.** A save
  after *any* drag would have blanked every label, site list and pin the curator
  had ever set — caused by an unrelated edit, silently. The test reproduces it:
  **7 checks fail against the pre-fix source, 0 after.** The general shape:
  *when a save is a full rewrite, hydrate the editor model from the stored row,
  not from whatever subset the layout needed.*
- **Ties in `sort_order` resolved to DOM order**, which reads as random. They now
  resolve to the shipped position, so a tie is at worst a no-op.

### What Sam caught that I got wrong

- **"Can't see how to drag and drop."** I shipped Arrange as Section 3, below a
  36-row table and the protections table — two screens down. Not a load failure,
  a layout mistake. **A tab's primary action goes above its reference material.**
  It is worth noticing that my first instinct was to check whether the deploy had
  landed; the user was describing the page accurately and I nearly diagnosed past
  them.
- **"Should the Admin tab be at the top level so I can manage all the orgs?"**
  Yes — and being ungrouped was only the cosmetic half. `applyNav()` hides any tab
  missing from the active site's list, so without a new `ALWAYS` list, switching
  to GR to fix GR's menu would make Admin vanish out from under you. His question
  had a functional half he did not ask about.
- **"A couple reds on the admin actions"** — twice. See below.

### The governance red, and why "it's pre-existing" was the wrong answer twice

`JS tests` had been red on every commit since before this session: one file,
`governance.test.js`, asserting the drift-candidate queue stays `< 25`.

First response: *"pre-existing, not mine."* True but useless — and **partly
false**, because the detector had correctly caught `cobi_nav` as a new governance
surface my own PR created (26 → 27). Second response: added DR-12, back to 26,
*"it stays red, bulk-dismissing would defeat the tripwire."* Also true, also
useless: Sam reported it again, which is the signal that a permanently-red
non-required check is **taxing attention every time he looks** — exactly the
failure Sky155 named.

The resolution was to **read what the guard actually asserts**. Its own comment:
*"39 was the unfiltered first draft; if the list ever climbs back there the
filters have stopped doing their job."* It is a **noise** guard, not a triage
counter. The queue had grown because the project grew — several surfaces from
this very session — not because the filters broke.

So: **19 of the 26 were genuinely resolvable.** Four mapped to existing rows
(`sierra_rules`→DR-11, `sierra_turn_review`→CA-06,
`map_contact_proposals`→DR-01/02, `merge_doctrine_notes`→DR-04) and fifteen
belonged to six real, previously-unrecorded decision rights: **the workplan
itself** (DR-13 — the most public artifact the project has, with no named owner),
**phrase rotation** (DR-14), **contracts** (DR-15), **CPL News** (DR-16), **the
Common CR Reference** (DR-17), **TMC submissions** (DR-18).

Every one has `owner: null`, because filling owners *is* the review (OQ-01). The
detector proposes; a human promotes. This was that promotion, done by hand,
exactly as CLAUDE.md describes.

**And DR-16 immediately flagged itself stale — which was a detector bug.** The
path regex anchored on `\b`, which cannot match before a dot, so
`.github/workflows/cpl-news.yml` was captured as `github/...` and reported
missing. Its own docstring warns that a false stale flag "sends someone hunting
for a problem that is not there"; my row tripped precisely that. Fixed with a
negative lookbehind.

**Result: 7 candidates, all genuinely-unlisted scheduled workflows — the honest
backlog, now visible instead of buried under 19 resolvable ones. 90/90, and the
whole 218-suite sweep is green.**

The transferable bit: **when a guard has been red long enough to be furniture,
read the assertion's rationale before either fixing the number or defending it.**
Both of my first two answers were defensible and neither was useful.

### Current state

- `cobi_nav` seeded **empty** — the menu is exactly what the code ships until
  someone drags something.
- `sierra_rules` seeded **empty** — every rule running its code default.
- Governance register: 18 decision rights · 8 acceptance standards · 6 cadences ·
  8 open questions. Candidate queue: **7**.

### Next concrete step

1. **Sam drags something** and confirms the arrangement survives a reload — the
   full round trip has been tested in jsdom but never in a browser.
2. **Fill owners on DR-13…DR-18** (OQ-01). DR-13 (the workplan) and DR-14 (phrase
   rotation) are the two worth naming first.
3. **Decide the 7 scheduled workflows**: cadence rows, or dismissed as automated
   plumbing with the reason in the surface map.
4. `sierra_rules` still has no **"which rules were in play"** view
   (`chat_interactions.rules_fired`) — the ADR argues that is worth more than
   editability, and it remains unbuilt.
