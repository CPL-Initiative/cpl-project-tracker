---
title: MAP Users — lessons
date: 2026-08-05
tags: [map-users, contacts, cpl, pii, provenance, local-governance, cobi]
artifacts:
  - map_users.js
  - map/supabase_map_contact_gaps.sql
  - map/sync_map_users.py
  - map/probe_users_schema.py
  - tests/map_users.test.js
related:
  - "[[docs/map_users_tab_scope]]"
  - "[[docs/kb-notes/adr-surface-dont-edit-readonly-system-of-record]]"
  - "[[docs/kb-notes/methodology-map-api-value-signature-probe]]"
  - "[[docs/cobi_lessons]]"
---

# MAP Users — lessons

Workstream scratchpad. Append a dated section per checkpoint. The tab's original
build (Session 87, StarMax) is in [`map_users_tab_scope.md`](map_users_tab_scope.md)
and [`cobi_lessons.md`](cobi_lessons.md); this doc starts where the *contact*
work began.

---

## 2026-08-05 — Session 120 (SkyMail): the student-contact worklist

### What this run was actually about

Sam opened with "add some features to the MAP Users tab." The features turned out
to be downstream of a goal he stated a message later, and the goal is the thing
worth remembering:

> "The big goal is to have all College Landing Pages include contact so when
> students request CPL, it goes to a real person who can respond. MAP is set up
> to send requests to the Primary Contact using the PC email."

That reframes the whole tab. It is not a roster viewer; it is the instrument for
making sure a student's request lands on a desk. **25 of 123 colleges had no
Primary Contact email, and 24 of those had a live landing page** — a silent
service outage nobody was measuring, because every dashboard counts what exists
rather than what is missing.

### The constraint that produced the design

The first cascade I built preferred a **shared role inbox** (`cpl@college.edu`)
because it survives staff turnover, which is what causes these gaps in the first
place. Sam killed it in one sentence: colleges are **locally governed**, and
adopting an inbox convention on their behalf is a determination we don't get to
make.

That objection is what gave the feature its actual backbone. The rule that
survived is stronger and simpler than what I had:

> **Every proposal must be a person the COLLEGE already designated in MAP.**

We aren't appointing anyone; we're routing their landing page to someone they
already named. That is defensible under local governance in a way that "here's
who we picked for you" never is — and it's *also* the sentence the outbound email
leads with, so the college can check the claim.

Corollary applied the same day: **leadership stopped being a cascade rung.**
Routing student CPL requests into a vice president's inbox is a real operational
decision, and it's the one rung where we'd be deciding something the college
didn't. Those became *ask*, not *default*. Cost: 5 colleges move from
auto-proposed to needing a conversation. Worth it.

**Generalization worth keeping:** when you can't make a determination for
someone, look for a determination they already made. It is almost always
sitting in the system somewhere, unused.

### The measurement that unlocked it

The cascade was thin until a probe found the sync was leaving most of the data on
the floor. `View_CollegeContacts_APIDataset` carries **24 fields; we were pulling
11.** Newly wired: School Certifying Official (101/123), Articulation Officer
(87), Faculty Lead (84), Lead Initiator (82), Academic Senate President (67),
CPL Counselor (65), **CPL Assistant Email (52)**.

Sam had said the CPL Assistant field "should be in the dataset... I think it's
called Users and Contact but not sure." He was right about the substance and
unsure about the label — the correct response was to probe rather than to ask him
to recall a spelling. The probe answered in 90 seconds what a conversation would
have taken a day to resolve.

Effect on the outcome: **17 of 25 gaps resolved** from the colleges' own
designations, versus far fewer before. *Wiring the data we already had access to
mattered more than any logic I wrote.*

### Provenance is a field, not a footnote

Jessica supplied contacts for the two colleges my lookup couldn't resolve, and
that exposed a flattening in the design: a contact **a person who knows the
college gives you** is not the same object as one **a script found on a website**,
and the tab was about to render them identically.

Three tiers now exist and are shown, not implied:

| Tier | Trust | Rendered as |
|---|---|---|
| MAP designation | authoritative — feeds the cascade | the role name |
| Curator-supplied | strong — a human judgment | ✔ from &lt;who&gt;, &lt;when&gt; — *not a MAP designation* |
| Web-sourced | starting point | link to the page — *verify before use* |

The rule that fell out: **a web lookup may only ever yield a department inbox; a
curator may name an individual.** They know who actually answers, which a lookup
cannot. Gavilan is the worked example — Jessica named two specific counselors,
which my own sourcing rules forbade me from doing, and she was right to.

The strongest record is both together: Jessica later supplied the *page* she
chose from, so that entry now carries a human judgment **and** its source.

### Things the data said that nobody asked

Measurement kept surfacing findings adjacent to the request. All were worth more
than the thing I was looking for at the time:

- **The public headline was overstating.** The roster carries 7 sandbox colleges
  plus the statewide team account (102 users). "2,769 users / 128 colleges" is
  really **2,657 / 120**. Fixed by *labelling* (`college_kind`), not filtering —
  the RPC still returns everything and the consumer decides, so nothing is
  hidden from a future reader.
- **`disciplines` is pipe-delimited, not comma-delimited.** The original scope
  assumed commas, so a user carrying their college's full subject list rendered
  as one 1,364-character cell. Live for two months.
- **Contact cells are not single values.** 15 colleges hold several addresses in
  one Primary Contact cell; some hold single-character junk. Parse, don't trust —
  `map_first_email()` takes the first thing that *is* an address, and the row
  flags when more were present rather than hiding the truncation.
- **The 3 "no MAP presence" colleges are the standalone continuing-ed
  institutions** the NC workstream flagged at zero articulations. Same
  institutions, different symptom. That's an onboarding problem, not a routing
  one, and pretending a cascade fixes it would have buried a real finding.

### On the instrument itself

The probe's `_looks_real()` rejected any column under a 25% fill rate, so a
genuinely real but sparsely-populated column was **indistinguishable from
garbage in the log**. Sparse is not fake — a fake column returns *nothing*. Added
a third `weak` verdict that reports the counts for a human call instead of
silently dropping. Had the CPL Assistant field been rarer, the old gate would
have hidden it and I'd have told Sam it didn't exist.

**Lesson: a detector with two states will eventually be wrong about the middle
one.** When the cost of a false negative is "we tell someone their data isn't
there," add the middle state.

### Current state

- Reviewer-only **⚠ No student contact** lens on the tab: 25 colleges, the
  proposed person, why them, CSV export, and a per-college draft email.
- `map_contact_gaps` — a `security_invoker` view, so RLS on the base tables gates
  it. Verified 0 rows for anon on the view and both base tables.
- Contact sync extended to all 12 roles; applied and populated.
- Tests 70 → 108, all 184 files green. PRs #991, #992, #993.

### Next concrete step

1. **Jessica/Ashley verify the 6 web-sourced fallbacks** (Siskiyous, Cosumnes
   River, Feather River, Hartnell, NOCE, Calbright). Gavilan needed a human;
   assume at least one of those six does too.
2. **Jessica's "no CPL Assistant" cut (71 colleges) as a live tab filter** — it
   was delivered as a chat table, which is a snapshot that goes stale against a
   monthly sync.
3. The **MAP "manage users" URL** is still open, carried since Session 87.
4. Consider whether the 5 leadership-only colleges should show VPAA/CEO as
   *context* without letting them auto-propose.

---

## 2026-08-05 (later) — Session 120 (SkyMail): the contact directory, and Jessica's rules

### What changed

Jessica joined the session and asked for a college-by-college contact table for a
professional-development session with Malone. I started building a static
spreadsheet; **Sam redirected it in one line** — *"rather than a spreadsheet, have
SkyMail rework the tab the way you need to see it and add an export button. That
way you always have access to fresh data."* That's the right instinct and it's now
the standing guidance in `docs/working_with_claude_code.md`: **anything handed
over in chat is a photograph, and it starts aging immediately.**

Shipped: a **📇 Contact directory** lens on the MAP Users tab (#1001) with all
five columns and a CSV/Excel export, then the counseling lookups themselves
(#1003, #1004) — **all 71 colleges** that lack a CPL Assistant.

### ⭐ The curator's rules beat mine, specifically

My sourcing rule was **department inboxes only, never an individual** — defensible
in the abstract (individuals churn; naming one is a determination). Jessica
replaced it with a sharper set:

> a general counseling inbox → use it · **one named person who IS the designated
> contact** → use them · **just a list of counselors** → leave blank · the page
> **directs you to another department** → use that · never mental-health.

Applied to the real data, my rule would have **discarded five genuine contacts** —
Compton's Dean of Counseling, Imperial Valley's named point of contact, LA
Southwest's department chair, Napa Valley's Dean, Palo Verde's Associate Dean.
Each is what that college actually publishes.

The distinction she drew is the one that matters and I'd missed it: **a designated
person is not the same as a person picked off a list.** My rule collapsed both
into "individual → reject." Hers separates them, and it's enforceable — a
non-department address must now carry a note justifying it, which is what stops a
future contributor quietly pasting in some counselor's address.

**Generalization:** when a domain expert relaxes a rule you set for yourself, check
whether the rule was protecting against *your* failure mode rather than theirs. A
web lookup can't tell a designated contact from a name on a list. A person who
works those contacts daily can.

### The 15 blanks are the finding

56 of 71 have an address. The other 15 publish nothing usable, and *that's the
output*, not a gap:

- **individual counselors only** — Coalinga, Crafton Hills, Laney, Santa Rosa, Taft
- **⚠ only a mental-health inbox** — Contra Costa, LA Harbor. The dangerous ones:
  the obvious address on the page is actively the wrong door for a credit question,
  so a human doing this by eye would likely get it wrong.
- **phone/chat/form only** — Golden West, LA Valley, Mission, Mt. SAC, Sierra, West Valley
- **special** — Orange Coast (specialized inboxes only), Pasadena (ticketing form;
  its one inbox serves the noncredit division)

Two entries carry an explicit "verify before routing" note: Copper Mountain's
address contains an ampersand, and Diablo Valley publishes one individual whose
role the page doesn't state.

### Next concrete step

1. Work the 15 blanks in the PD session — start with the two mental-health ones.
2. The **52 colleges that DO have a CPL Assistant** were out of scope here and have
   no counseling lookup. If that's wanted, it's the same grind.
3. Flip any corrected entry to `via: "curator"` with the person's name and date.

## 2026-08-09 — Session 132 (SkyHigh): the seven in the shadow, and a tier for what we could not check

### What shipped

**#1078** — the seven colleges the 2026-08-05 sweep never reached, plus a new
provenance tier for them. Queue: never-looked-up **7 → 0**, search-only **0 → 7**,
with proposals (14) and looked-up-empty (4) **unchanged** as the control.

| College | Outcome |
|---|---|
| Yuba | `yubacounseling@yccd.edu` — publishes a page titled *"email the counseling department"* |
| Citrus | `counseling@citruscollege.edu` — Counseling and Advisement Center |
| Palomar | `counseling@palomar.edu` — ⚠ a separate Behavioral Health Counseling Services exists; confirm which |
| Saddleback | `sc-ecounselor@saddleback.edu` — eCounselor / callback |
| Futuro Health | `help@futurohealth.org` — a partner, not a college; general help address |
| College of the Canyons | **blank** — only `ConnectsHelp@`, which is *technical* support for the Connects platform |
| Launch Apprenticeship | **blank** — interest form only; the one name found sits on another college's domain |

### ⭐ The finding: the sweep method no longer exists

Sessions are **egress-blocked from college domains** — `curl` returns `000`,
`WebFetch` returns `EGRESS_BLOCKED`, for every `.edu` host involved. Search
results are reachable; pages are not.

That is not a nuisance, it is a **capability loss**, and it invalidates a
standing plan: this doc's own "next concrete step" #2 offers the 52 colleges
with a CPL Assistant as *"the same grind if wanted."* **That grind is no longer
available from a session.** It needs a human with a browser, a runner with
different egress, or a curator.

Nothing was broken — the code is fine and no test would ever catch this. The
environment moved underneath a documented plan.

### Why the addresses did not go in as `via: "web"`

They would have passed every test in the repo. They would still have been
mislabeled, because **a tier is a claim about method, not confidence**.
`via: "web"` means *somebody opened the page and applied Jessica's rules* — and
those rules are rules about what a *page* shows. A snippet cannot tell a
department inbox from a name off a list, and **2 of the previous 71 published
only a mental-health inbox** — invisible from search, and the one outcome that
actively harms a student.

So `via: "search"` exists, and `proposedFillFor()` refuses it **in code**: no
search row can reach the "Proposed for MAP" column. Full reasoning:
[`methodology-a-tier-must-encode-what-you-could-not-check`](kb-notes/methodology-a-tier-must-encode-what-you-could-not-check.md).

### Next concrete step

1. **Confirm the five candidates** — seconds each, links on the MAP Users tab.
   Start with **Palomar** (the BHCS ambiguity) and **Canyons** (whether anything
   usable exists at all). Flip each to `via: "curator"` with a name and date.
2. **Decide how the remaining 52 get swept**, now that a session cannot do it.
3. The 15 blank-with-a-finding colleges still need the PD session — start with
   the two mental-health ones.

---

## 2026-08-13 — SkyBridge (Session 148): the audit that found the wiring sound

Sam asked to "make sure the MAP Users list is correctly wired to give correct
college contacts." Measured rather than read through.

### (a) What was learned

**The wiring is sound, and saying so plainly was the result.** I went in expecting
the raw-string join bug — the one that once showed five colleges no implementation
funding (`methodology-normalise-both-sides-of-a-join`). It is not there:

- All **78** `FALLBACK_CONTACTS` keys, **16** `CPL_PAGES` keys and the one
  `CPL_LIAISONS` key resolve to a real `map_college_contacts.college`. Zero misses,
  zero dead keys.
- `map_contact_gaps`' cascade is faithful: **17** proposable / **5** leadership-only
  / **3** no-MAP-presence.
- The 3 "no MAP presence" colleges (Calbright Credit, North Orange CE Credit, San
  Diego CCE Credit) are **genuinely** the standalone continuing-ed institutions —
  re-checked under trimming, so not a join artifact.
- Addresses shared across colleges (`shess@sdccd.edu` ×4, `beckm@smccd.edu` ×3,
  `kseelbach@peralta.edu` ×2) are **legitimate district officers**, not copy-paste.

Not manufacturing a fix for an absent bug is the point. The temptation on an audit
is to return *something*.

**⚠️ Mission College's proposed student contact is a personal Gmail.**
`boothmelanie@gmail.com`, sitting in MAP's own `cpl_coordinator_email` and
therefore **first in the cascade** — it is what we would ask the MAP team to adopt
as the address a public college's landing page routes students to. It is the
**only** free-mail address anywhere in the contact table.

**Flagged, never filtered.** It is a real designation, and the standing doctrine is
*propose only someone the college already designated*. Suppressing it would
substitute our judgment for theirs **and hide the finding**. The warning says so in
words: *"it is still their designation, not ours to change."*

**A latent join fragility, caught before it fired.** MAP's college names are
hand-typed and two carry a **trailing space** — `"Cypress College "` and `"San Jose
City College "`. The fallback keys match that *exactly*, so the lookup works today
and would break **silently** the day MAP tidies the spelling, rendering a college
we *did* research as "not looked up". `fallbackFor()` now tries the exact key
first, then a normalized index. Nothing changes today, and nothing changes when
MAP fixes its typo either — which is the whole point.

**College of Marin** carries the literal string `"na"` in `cpl_counselor_email`;
`map_first_email()` already nulls it, so the guard is for the next one.

**Scope discipline on the flag.** `addressWarning()` flags a free-mail provider or
an unusable value and nothing else — `canyons.edu`, `sdccd.edu`, `smccd.edu`,
`peralta.edu`, `yccd.edu`, `futurohealth.org` and a departmental `sc-ecounselor@`
inbox are all asserted clean in the test. **A false positive here trains the team
to ignore the warning**, which costs more than the one true positive is worth.

### (b) Current state

`tests/map_users_contact_quality.test.js` — 18 checks against the real fallback map
lifted out of `map_users.js`, including that no code path *filters* on the warning.
`map_users.test.js` still 157/157. Shipped in #1151.

### (c) Roadmap · (d) Next concrete step

Unchanged by this run: confirm the 7 `via:"search"` candidates (start with Palomar
and Canyons) and flip them to `via:"curator"` with a name and date; work the 17
blanks; the 52 colleges *with* a CPL Assistant still need a differently-egressed
sweep. Ask the MAP team about Mission College's Gmail — that is a conversation, not
a data fix.

### Retired from CLAUDE.md this run

The §11 "MAP Users / student contact" cell had reached **5,261 chars** and tripped
`stacked_roadmap_cell`. It was compacted to current truth (2,334 chars); the
superseded per-session narrative (SkyMail's worklist build, the 71-college sweep,
SkyHigh's seven, SkyMind's confirmation) lives in the earlier sections of this
document, which is where the history belongs.

---

## 2026-08-13 — SkyRef: the contacts Sierra read were a fossil, and the chip never said why

### One report, a third of the system

Sam filed one line of Sierra feedback: *"Wrong contact information for RCC."* The
useful first move was not to fix RCC but to ask **how many colleges disagree**.

Sierra read `chatbox_college_profiles.contacts` — a JSONB blob written
**2026-06-25** that **nothing refreshes**. `map/sync_map_users.py` *writes*
`map_college_contacts` and only *reads* the profiles table (for dashboard URLs);
no builder for that blob exists anywhere in the repo. Seeded once, left.

Measured over the 122 colleges present in both tables, applying Sierra's own
preference logic (coordinator, else primary) to each side:

| | colleges |
|---|---|
| Sierra printed a **different** email than MAP holds | **41** |
| Sierra printed **nothing** while MAP had someone | **13** |
| agreed | 50 |

RCC was ordinary: Sierra said *Rene Felix*; MAP holds *Jeanine Gardner* as
primary contact and *Lisa Martin* as CPL coordinator — the slot Sierra's code
**prefers**, blank in the fossil.

**Re-seeding the blob was the wrong fix.** A fresher fossil is still a fossil.
The consumer changed instead (cpl-chat v45), which ends the staleness class —
the same lesson this repo learned the day before on the `statewide` flag: *a
settled ruling does not enforce itself, the consumer has to change.*

### Reading the authority is harder than reading the flattened copy

Four things the fossil had already smoothed away, each now a committed test in
`tests/sierra_college_contacts.test.js` (28 checks):

- **Normalize both sides.** Two real colleges carry a trailing space in MAP —
  `"Cypress College "`, `"San Jose City College "`. Exact matching drops them
  *silently back to the fossil*. Third occurrence of this in the repo.
- **Validate, don't just split.** 22 of 115 routable colleges hold several people
  in one field (semicolons, commas, embedded newlines). Cypress's coordinator
  field is `jgarcia@…, jrangel@cypresscollege,\njgrande@…` — the middle address
  has **no TLD**. A dead address is a false route.
- **Name and email from the same tier.** The old code used two independent `||`
  fallbacks, so a tier with a name but no email would pair that name with someone
  else's address. Zero colleges hit it — closed as a latent hazard.
- **Leadership is excluded from the cascade.** Routing a CPL question to a
  college president is worse than admitting we don't know. 115 of 122 route
  without them; **7 genuinely cannot**.

Fails safe: any error, or a college with no authority row, keeps the old blob —
*never worse than what it replaces*.

### The "Because" chip was right and unreadable

Sam: *"the Because column chips are unclear… Some are listed as CPL Assistant.
Does that mean that we have a CPL Assistant contact on file but nothing marked
Primary Contact? If so, I would think that our cascade process would assign the
assistant as the primary contact."*

**He was right, and the cascade already did it** — the address beside the chip
*was* the promoted assistant. The chip answered *why is this person here?* while
reading as *what is this person?* Now: header `Proposed because`, chip
`CPL Assistant in MAP`, hover stating the implication, and the cascade spelled
out once above the table.

Citrus showing a bare email next to Allan Hancock's named row was also not a
lookup failure: `map_college_contacts` has `cpl_assistant_email` with **no
matching name column**. The row now says so.

### Curator proposals are data now, not code

Curator-supplied contacts were **hardcoded in `map_users.js`** (Jessica's three),
so adding one meant a code change and a deploy. `map_contact_proposals` (gated,
reviewer-or-team-phrase) now overlays the worklist:

- **All 25 rows editable**, cascade pre-filled as the default (Sam's call).
- Curator values chip `curator-set` with **who** and **when**, and never claim
  MAP holds them.
- **Sierra does not read it** — Sam's call: MAP to-do only. A test asserts
  `cpl-chat` never references the table.
- Keyed on the **trimmed** college name, matching the table's check constraint.
- **Clearing writes nulls rather than deleting** — the table has no delete policy
  (matching `governance_owners`), and `governance_owners` already showed what a
  "clear" with no path becomes: a button that silently does nothing.
- An RLS-filtered write returns **200 with an empty body**, so a write touching
  no row is reported as a failure with the typed text kept.
- The CSV ships **both layers in separate columns** — it is the list someone
  works through *in MAP*, so a curator's suggestion must never be
  indistinguishable from a role the college designated.

### About those 8

**Five are not empty colleges.** Gavilan has **13 active MAP users**, Hartnell
**15** — they simply have nobody in any CPL role, only a VPAA or CEO. Those are
the real correction list. The other three (Calbright, North Orange Continuing
Education, San Diego College of Continuing Education) have zero MAP presence.

### Open

- **8 colleges keep a fossil contact where MAP is now blank.** They fall back
  under the fail-safe, which is conservative but arguable — MAP is the system of
  record, and a blank there could mean the person left the role. Flagged for Sam
  rather than decided.
- The 7 `via:"search"` fallback entries still need confirming; the 17 blanks
  still need working.

Durable: [`methodology-a-copy-with-no-refresh-path-is-a-fossil`](kb-notes/methodology-a-copy-with-no-refresh-path-is-a-fossil.md),
[`methodology-a-provenance-label-must-say-why-not-what`](kb-notes/methodology-a-provenance-label-must-say-why-not-what.md).
PRs #1164, #1167.
