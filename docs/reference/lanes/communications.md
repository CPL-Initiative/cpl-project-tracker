---
title: "Letters, Memos & Reports / the communications register — lane state"
created: 2026-10-23
updated: 2026-10-23
tags: [reference, roadmap-lane, communications, letters, library]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
  - "[[library]]"
---

# Letters, Memos & Reports / the communications register

**What this lane is:** one COBI tab (`#letters`, *Sierra & Team Tools*) that holds every
communication the Initiative drafts and sends, with the recipients read from MAP's roster by
role, the figures read from the daily feeds, and the words from the team, with Claude's draft
on request. Sam, 2026-10-23: *"I need to send an email to the CEOs and cc their CIO and CSSO.
Thinking you could set this up on our COBI Letter, Memos, Reports tab which I haven't used
since it was created. It was designed to support funding advocacy but thinking it should be
expanded for any type of communication I need to craft that needs to incorporate current data
and contacts for various roles in the system that we may already store (e.g., CEO name and
email and current CPL metrics)."*

## Status

✅ **The register is built** (`comms.js`, the side session beside S457, 2026-10-23). It reads
`cpl_comms` live behind the team phrase, joined at render time to `map_college_contacts`
(the roster, gated the same way), `map_colleges` (the identity table: partners and test rows
drop out, a spelling variant resolves) and `veteran_jst.json` (the daily JST feed). Each
record carries a kind (email, letter, CO memo, MAP Team note, report, flyer, other), an
audience, a status (draft, final, tabled), the recipients as roster **roles** (To and Cc), an
optional college scope, a subject, a body with merge fields in braces, a signature block,
an occasion and a note. The register has a search box and kind, status and audience
filters. Schema `kb/supabase_cpl_comms.sql` (applied by `supabase-migrate.yml` run
39995811630; the session's `apply_migration` timed out, the known failure). Test
`tests/comms.test.js` (78 checks). Governance: `table:cpl_comms` is dismissed with its
reason in `kb/governance_surface_map.json` (the register records; the sender decides).

**A record holds roles, never addresses.** The roster is the one copy of every contact; a
stored letter never freezes a stale name, and no second table holds staff emails
([`methodology-a-letter-holds-roles-never-addresses`](../../kb-notes/methodology-a-letter-holds-roles-never-addresses.md)).
The open record shows a recipients table: a row per college in scope with the To and Cc
people, their JST standing (JSTs / reported veterans, the 75 percent mark) and the gaps a
To role leaves (a CEO with no address in MAP is named, never a blank letter). Per row:
Preview (the merged text), Copy, and *Open in mail* (a `mailto:` with To, Cc, subject and
body). Per record: a CSV of every recipient for a mail merge, and a Word file of the body.
**COBI sends nothing**; a human presses send.

**Claude drafts through the report proxy** (`window.CPL_REPORT_PROXY_URL`, model
`claude-opus-5-5`, effort high, one constant in the module) under a system prompt that
carries the house voice, the naming rule, American spelling, the banned business words
and the funding vocabulary, with the audience's one-line guidance and the merge-field
vocabulary; it is told to write the fields in braces, never a literal, and no address reaches
it. The draft sits beside the body until *Use this draft*; nothing is sent.

**Post to the Library** writes a `cpl_library` row (kind document, home web, the link
`#letters/<slug>`, seen_by from the audience) and stores its id on the record; a second
post refreshes that row. Retire sets `retired_at`; a trigger files every prior row in
`cpl_comms_history`.

**The May 2026 budget-support curator stays, folded.** The tab was an iframe to
`budget-support/web/curator.html` (the KB project's Supabase, passcode-gated; S10's
[hand-off](../../letter_curator_handoff.md)). It now sits under *Earlier* at the foot of the
tab and loads only when opened.

**The first record is Sam's CEO email** (receipt
`kb/receipts/cpl_comms_seed_2026-10-23.sql`, cohort `comms-seed-s457side@bot`): his draft
of 2026-10-23 with merge fields, status draft, To the CEO, Cc the CIO and CSSO, and a
JST-figures sentence from the feed. Its note names what he decides before it goes
([Open Asks Sheet 118](https://claude.ai/artifact/D3uYDvJ3MigHaM8CgpKWse)).

## Measured 2026-10-23

- The roster holds **124** rows; a CEO address for **70**, a CIO (vpaa) for **95**, a CSSO
  (vpss) for **58**; all three for **33**. `count(col)` reads 124 for each because MAP syncs
  empty strings, never nulls: measure with `count(nullif(col, ''))`.
- Names are hand-typed in MAP with no title or last-name field (*Dr. Jennifer Zellet*,
  *Kevin G. Walthers*, a double space inside one). The salutation reads an honorific from
  the name, else the role's word (*President* for the CEO).
- `veteran_jst.json`: 63 colleges at the 75 percent mark, 29,272 JSTs against 33,435
  reported veterans statewide (read 2026-10-23 14:17Z).
- Twelve surfaces draft prose or call Claude, each with its own prompt rules and model
  pin: `report_generator.js`, `college_report_generator.js`, `annual_report.js`,
  `master_report.js`, `generate_reports.js` (pipeline docx), `activity_summaries.js`,
  `raci.js` (polish an update), `credential_reference.js` (two small calls), `quickstart.js`
  (routing, Haiku), the funding tab's memo, letter, brief and report builder in
  `cpl_funding.js` (saved passages, no model), the GR register's memos (`gr_memos`),
  Sierra (`cpl-chat`), and now this tab. The naming rule is copied into at least three of
  them by hand.

## NEEDS SAM ([Open Asks Sheet 118](https://claude.ai/artifact/D3uYDvJ3MigHaM8CgpKWse), cards 4 to 8)

1. **The dollar range in the CEO email.** His draft names *$150,000 to $400,000*, the
   model's max-award range. The sunshine rule (2026-09-01) keeps the model's dollar figures
   out of outward materials until he confirms with CO leadership. Keep the range, replace
   it with the shape ("a larger 2026-2028 award"), or confirm the rule is lifted.
2. **Consolidate the writing layer, not the tabs.** One `cpl_writer.js` holding the naming
   rule, the house voice, the funding vocabulary, the audience definitions, the model
   constant and the proxy call, consumed by every surface above one PR at a time, with
   this tab the first. The tabs keep their own data and UI. Or leave them as they are.
3. **The JST sentence** in the email: keep it (each CEO sees their college's figure from
   the daily feed), or drop it.
4. **The salutation default** for a CEO without an honorific: *President {last}*, or the
   full name.
5. **The old curator's future:** fold it as shipped, or retire it and the KB project's
   `letter-curator` and `generate-letter` functions.

## Next

- Sam answers Sheet 118; the email goes out from his mail client by mail merge (the
  CSV) or one college at a time (the mail link). The hub records `sent_on` and status final.
- The writer module (card 2), if he says so: extract `NAMING_RULE`, the house voice and the
  funding words from this tab's `SYSTEM` into `cpl_writer.js`; port `activity_summaries.js`
  and `report_generator.js` first; retire the two older model pins (`claude-sonnet-4-5`,
  `claude-sonnet-4-5-20250929` in `raci.js`).
- A per-college salutation override and a per-record recipient exclusion list, when a
  send shows the need.
- A send log: `sent_on` is one date per record; a per-college sent mark would need a
  child table, so wait for the first real send to see whether the CSV's record suffices.
