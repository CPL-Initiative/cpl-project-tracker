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

### The lesson that generalizes furthest

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

### Only the alarming case was labeled

The protection chip rendered for `open`/`public`/`view` **alone**. A properly
protected tab showed nothing — indistinguishable from one nobody had examined.
Measured: **1 of 7 items carried a chip before, 7 of 7 now.**

This is the same asymmetry as the audience note (stated only inside the ⚠, which
fires on public-read tabs, so on most items it never appeared while it applied to
all of them). Worth naming as a pattern: **when only the bad case is labeled,
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

---

## 2026-08-15 (later) — Sky160: the manager could not see two of its own items

Three merges: **#1212** (plain words, no glyphs, Admin may live in a category),
**#1213** (Share becomes a real, manageable group), **#1214** (per-site fallback
tab; the shared phrase renamed `raci` → `team`).

### The headline finding

⭐ **`cobi_nav` holds 43 rows, stamped `slee@cccco.edu` at 13:59 UTC.** The
"nobody has dragged-and-saved in a real browser" item — Priority 1 in three
consecutive handoffs — is **closed by evidence, not by a test.** Sam's renames
(`workplan` → *Metrics and Plans*, `sierra` → *MAP Team Tools*), his `settings`
category, his hidden CPL Assistant and every audience rung he set are all
readable in the table. Nobody had looked.

**The lesson is about verification, not the tab: the answer had been sitting in
the database for hours while three handoffs described it as unproven.** A
verification step that only a human can perform still has to be *checked* by
someone; asking is not the only way to find out.

### Share: an omission with no symptom

Sam: *"Why isn't the Shared Category on my Admin page? Seems it should be."*

Not a failed read. Share was **synthesised** inside `nav_groups.build()` from
anything carrying `.cpl-tab-external` — the Fact Sheet and Ask Sierra launchers,
anchors with **no `data-tab`** because they open their own page. Every query on
the Admin tab asks for `.cpl-tab[data-tab]`, so both were invisible to it, and
Share had no id for the overlay to write a row against.

⚠️ **The manager looked complete while omitting part of what it manages.** That
is strictly worse than one that reports it cannot see something: there was
nothing to notice. Sam found it by looking at his own sidebar and asking why the
two did not match — which is the only way it *could* have been found.

Three places would have lied once the launchers became visible, and each is the
same shape — a rule written for tabs, silently applied to a thing that is not a
tab:

- `cobi_orgs.applyNav()` never saw them, so they showed under every site whatever
  anyone set. Fixing that naively would have been **worse**: `allow` lists TAB
  ids, so testing a link key against it hides both launchers the moment anyone
  picks a site. A launcher with no curator rule shows everywhere, by design.
- `sitesFor()` had the identical hazard on the *reporting* side. **A table that
  describes the menu differently from how the menu behaves is worse than one that
  omits it** — the omission is at least visible.
- `rowGate()` would have called both *"not checked"*, so **"Not checked yet"
  would have risen by two the day Share became visible.** A count going up
  because we started *showing* something is a false finding. New `link` gate.

### The guard was on the wrong axis

Admin refused to be dragged into Sam's Settings category, because `PROTECTED`
tabs were barred from every group on the theory that a group can be hidden.

⭐ **It cannot actually take Admin with it.** `plan()` already *lifts* a protected
tab out of a hidden group, asserted in `nav_overlay.test.js` since #1195. The
drag ban was a second belt over a door already sealed one layer down — and it
cost Sam the arrangement he wanted. Split into `GROUP_LOCKED`, holding
`dashboard` alone, and for a different reason than hiding: it is where every
unmatched link lands.

**Three lists now, each on its own axis** — `PROTECTED` (never hidden),
`AUDIENCE_LOCKED` (never narrowed), `GROUP_LOCKED` (never grouped). The axis is
always *what would the viewer be unable to undo*.

### A rule recorded is not a rule applied

Sam, mid-run: *"I dislike the standard cheesy glyphs … prefer either simple text
chips or muted monocolor glyphs."*

⚠️ **He had already said this.** `cpl_memory` carries
`cobi-no-cheesy-glyphs-design-rule` from **2026-08-14**, in his words, about the
side menu. The Admin tab shipped that same week with 👁 👥 🔑 🙈 📌 ✏️ 🗑 💾 on
every row. Recording a rule and applying it are two different events, and only
the first happened — the same shape as *"a settled ruling does not enforce
itself, the consumer has to change"* from the statewide-flag work.

Every control is a word now. A word also survives being read aloud, which a
pictogram does not.

### The fallback tab was curator-editable and nobody meant it to be

Sam asked for the ~10-line per-site fallback. Writing it turned up worse than
described: the fallback was not `dashboard`, it was **`valid[0]` — the first
button in DOM order**, with `dashboard` only behind it.

⚠️ **DOM order became curator-editable the day the Admin tab shipped.** Dragging
any tab above Dashboard silently changed where every broken link lands. A menu
edit quietly rewriting routing, with nothing to notice. `homeTab()` asks the
active site for its declared `home` and keeps DOM order as the last resort — the
org layer is optional, and a router that depended on it would fail closed, with
no page at all.

### A live rename has to be order-proof

`team_access.id` was `raci` — named after the Team & RACI tab, which Sam renamed
to *Team*. He could not find it because **the id is internal and appears nowhere
a phrase holder can see**; the card is simply labeled *Shared team phrase*.

The secret was untouched (md5 identical before and after), so nobody was locked
out. But **a live rename and a deploy cannot be simultaneous**, and the
in-between state is not cosmetic: a card that cannot find its row renders
**blank**, and typing into a blank card and saving would create a **second row**
— which `team_pass_check()` accepts, because it matches *any* secret in the
table. Two live shared phrases, one invisible to whoever rotated the other.

`team_phrases.js` carries `legacy: "raci"` and resolves the id a row *actually
has* before PATCHing. The existing test fixture deliberately keeps the old id, so
the whole file is the pre-rename proof; a new block runs the same code against
the renamed database. **Both orders pass, so the order stopped mattering.**

### The harness lied again, one day later, in a second file

Verifying the Share work against the pre-fix source, both runs printed **zero
failures** — because an unguarded dereference *threw* and killed the file before
any check registered. That is
[`methodology-a-check-that-never-registers-can-never-fail`](kb-notes/methodology-a-check-that-never-registers-can-never-fail.md),
found yesterday in `admin_tab.test.js`, reappearing in `nav_groups.test.js`
**within 24 hours**.

⚠️ **A fix applied to one harness is not a fix applied to the practice.** Both
files carry `val()` now. Real numbers after: 15 of 17 new admin checks fail
pre-fix, 3 of 6 nav_groups checks — and the three that pass both ways are
**labeled regression guards rather than counted as proof.**

One new assertion was also wrong on first writing (it asserted a rendered count
was "not 2", which is a correct count in that fixture for unrelated reasons) —
caught by *reading what it found* rather than trusting the pass. Third session
running that this exact move has caught something.

### Where the org / phrase structure actually stands

Sam: *"Finance should not open the entire workplan… Seems like we should have an
Admin view for each org."*

Measured: the Finance phrase opens Contracts (8 policies / 4 tables) **plus ~30
more tables and 83 policies**, because `team_pass_check()` matches any secret in
`team_access`. Three lists describe "orgs" and none is authoritative —
`cobi_orgs.js` ORGS (5 sites), `team_access` (4 rows), `team_phrases.js` PHRASES
(4 descriptions) — and they already disagree: **CIP is a site with no phrase.**

⚠️ **A naive "scope each phrase to its own site" locks Finance out of Budget and
Implementation Funding**, which it genuinely needs — those are shared tables and
Sam's own June ruling is *shared tabs accept either phrase*. The defect is only
the third case: the Finance key opening tabs Finance has nothing to do with.

On per-org Admin: **a site FILTER, yes; per-org authority, no.** Admin is
reviewer-only precisely because a phrase holder who can re-scope what other
phrase holders see is the superset problem one level up. Most tabs are shared, so
two org Admins would fight over one menu. Delegation is a *roles* decision and
belongs in the Governance register.

### Current state

- Menu manager complete for every item in the rail, launchers included.
- Admin can sit in a category; Dashboard cannot, and says why.
- `admin_tab` **151 → 170** · `nav_groups` **12 → 20** · `team_phrases` **46 → 49**.
- `CLAUDE.md` still **2.05×** its budget; three finished §11 rows moved to
  `docs/reference/finished_workstreams.md` this checkpoint.

### Next concrete step

1. **Sam drags Admin into Settings and saves.** Enabled, not done — his
   arrangement to make.
2. **The Finance phrase scope** — needs a written plan and his go before touching
   live RLS on ~30 tables. Getting it wrong locks working people out mid-task.
3. **Org roster as data** (`cobi_orgs.js` → a table), which is what makes "what
   is in Finance" one list instead of two, and what a per-site Admin filter reads.
4. Fill owners on DR-13…DR-18 (OQ-01) — unchanged, still nobody's.

### Postscript, same day — the audience filter had never worked

Sam dragged Admin into Settings, it worked, and the **same save reset nine
audience rungs to `everyone`**. He was gracious — *"I don't mind resetting them
since this was a structural change"* — but it was not a structural change, and
the real finding is worse than data loss.

`nav_overlay.load()` names its columns explicitly and **omitted `audience` from
the day the column shipped**. PostgREST returns only what is asked for, so
`r.audience` was always `undefined`.

⭐ **The write path was correct. The READ path was one column short**, and that
made the failure silent in three places at once:

1. `audienceAllows()` always returned true — **the filter never hid a tab from
   anybody.** Team Phrases was set to magic-link-only and stayed visible to every
   visitor. Display only, RLS still gated the contents, but the control did not
   do what it said.
2. The Admin editor hydrates its draft from the same rows, so it showed
   "Everyone" for every tab. **It agreed with itself, and with nothing else** —
   which is why no amount of looking at the tab would have revealed it.
3. `draftRows()` writes the whole row back, so **any** save erased every
   audience in the table. That is the only reason it surfaced at all.

⚠️ **A default that "lands on the harmless side" is right for a bad VALUE and
wrong for an ABSENT column.** `sanitize()` maps an unrecognized audience to
`everyone` so a typo can never hide a menu item — deliberate, and documented.
But absent and invalid are different states, and collapsing them turned a
missing value into a *confident wrong one*.

⚠️ **An explicit select list is a SECOND schema** that has to be maintained in
step with the first, and nothing complains when it drifts. The guard therefore
derives the required set from `sanitize()`'s own body — every `r.<column>` it
reads must appear in the select — and prints what is missing: *"11 read, 1
missing: audience"*. Asserting "audience is present" would have guarded the
instance and missed the class.

**Correction to the record:** the checkpoint above cites Sam's audience rungs as
evidence the Admin save works. That is still true — the save *wrote* them — but
they never took effect, and the same mechanism erased them. Restored from a read
taken before the 15:00 write. Fixed in #1217.
