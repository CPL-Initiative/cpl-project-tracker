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

**Generalisation worth keeping:** when you can't make a determination for
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

**Generalisation:** when a domain expert relaxes a rule you set for yourself, check
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
