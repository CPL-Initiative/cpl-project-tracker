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

---

## 2026-08-15 — Sky159: one ladder, a chip on every row, and a harness that was dropping checks

Two PRs (**#1209**, **#1210**), both from Sam's own Admin reports of 2026-08-14
that Session 158 recorded and left unbuilt. Plus **#1204** merged (the held
Memory-tab fix).

### Hide and audience were one question wearing two controls

`hidden` was an 👁 toggle on the row; `audience` was a `<select>` buried in the
✏️ editor. They are rungs of one ladder — Everyone → signed-in → magic-link only
→ nobody — and the split cost twice. Sam pressed 👁 expecting it to **ask** who,
and it toggled silently. Separately he narrowed an audience meaning only to
annotate: *"I wasn't trying to hide it… just noting that they need a team phrase
to curate."*

**The merge is at the CONTROL, not in the table.** `plan()` treats the two
columns differently — an audience rule is per-viewer and recoverable, `hidden` is
neither, and the editor renders them differently for that reason. Collapsing them
in storage would have destroyed a distinction the overlay depends on. `rungOf` /
`applyRung` are the only places that translate.

**`hidden` deliberately preserves the audience underneath it.** Clearing it would
silently widen a magic-link-only item to everyone on un-hide — the one direction
of drift nobody would notice, because the item simply reappears and looks right.

**An option that cannot be honoured is not offered.** Admin gets no *nobody* rung;
Dashboard gets no ladder at all. Re-checked at the point of the write, because
the render decides what to *offer* and the handler decides what *happens*, and
those two must not be able to disagree.

### Only the alarming case was labelled

The protection chip rendered for `open`/`public`/`view` **alone**. A properly
protected tab showed nothing — indistinguishable from one nobody had examined.
Measured: **1 of 7 items carried a chip before, 7 of 7 now.**

This is the same asymmetry as the audience note (stated only inside the ⚠, which
fires on public-read tabs, so on most items it never appeared while it applied to
all of them). Worth naming as a pattern: **when only the bad case is labelled,
silence means two different things and the reader cannot tell which.**

⚠️ **Chipping every row had a trap that would have been worse than the gap.**
With no gate measurement, `classify()` returns unknown for every table — so the
rail would have reported **"Not mapped" 35 times**, turning one failed request
into a site-wide finding. Two states are now resolved at the point of display and
never counted as gates: `nodata` (the tab reads nothing) and `unread` (the RPC
did not return). The `unread` branch is **defensive today** — `render()`
short-circuits the whole tab on a failed read — and the test asserts the
short-circuit too, so anyone who later lets the arrange view render without a
measurement fails loudly instead of silently activating it.

### The test harness was silently dropping checks

Found while verifying, and probably worth more than either fix. The summary fired
on a **fixed 1400 ms timer** while async blocks were still running:

```
admin_tab.test.js: 116/116   ← same source
admin_tab.test.js: 122/122   ← same source
admin_tab.test.js: 123/123   ← same source
```

Up to **7 checks silently never registered**, and **a check that never registers
can never fail**. Same shape as the detectors this repo keeps catching: it
reports clean because it never ran, and the count is what hides it. Now
`Promise.allSettled` over every block, and a block that *throws* is reported as a
named failed check rather than vanishing.

It earned its keep within the hour: the item-3 verification run surfaced
`async block 11 ran to completion — Cannot read properties of undefined`, a block
that under the old harness would have contributed nothing and looked fine.

### Curator-created categories, and the three quiet failures

A group had to exist in `nav_groups.js`, and a tab parented to an unknown group
**silently degraded to top level** — which is exactly what a curator-made group
would have looked like. `plan()` now unions overlay-only group rows.

⭐ **The repo had already answered one of my design questions.** I filtered empty
groups out of `plan().groups`; a test comment said they are kept on purpose
because `makeGroup` already returns `null` for an empty group and `plan()`'s list
is also the editor's **drop targets**. The failing test was right and my change
was redundant. Reverted — this is the "check whether this repo has already
answered it" rule paying off in the narrowest possible way.

⚠️ **Removing a category is a DELETE, not an omission.** The save is an upsert
(`resolution=merge-duplicates`), so a row left out of the payload **stays** and
the category returns on the next load, out of position. A failed delete now
aborts the save — writing the arrangement anyway would read as the save having
partly worked.

Three more, each of which would have been quiet:

| Risk | Guard |
|---|---|
| Duplicate key merges two categories into one row; a key matching a shipped group takes that group over | `newGroupKey()` slugs and suffixes until unique across the draft **and** the code groups |
| A curator category renamed to **blank** is dropped by the overlay, scattering its tabs to top level | Label falls back to the key. A shipped group may still write null — it falls back to code |
| Deleting a **non-empty** category scatters its tabs the same way | Removal offered only while empty, re-checked at the click |

### A test that passed while proving nothing

My first curator-category fixture *appended* a second `cpl-pathways` row rather
than replacing it. `get()` returns the **first** match, so the appended row was
shadowed by the one `draftRows` had already written — the check passed against
the old placement. Caught because two sibling checks failed and the explanation
had to cover all three. **A green check on a fixture you built yourself is worth
one look at the fixture.**

### Current state

- `cobi_nav` still seeded **empty** — and after #1203, saving works. **Nobody has
  dragged-and-saved in a real browser yet**; that is still the open verification.
- Admin: one visibility ladder · a protection chip on every row · "+ Add category"
  with delete-on-empty.
- `admin_tab.test.js` **101 → 151 checks**, deterministic.

### Next concrete step

1. **The real-browser round trip** (Priority 1 of handoff 159, still unproven):
   sign in from ℹ About → the *other* open tab signs in → drag + Save on Admin →
   leave an hour → sign out and confirm **both** tabs stay out.
2. Then: create a category, drag two tabs into it, save, reload — and delete it.
3. **Fill owners on DR-13…DR-18** (OQ-01) — unchanged, and still nobody's.
