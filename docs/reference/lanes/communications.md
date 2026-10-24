---
title: "Letters, Memos & Reports / the communications register — lane state"
created: 2026-10-23
updated: 2026-10-24
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

**Claude drafts through the writer module** (S460, 2026-10-24, Sam's Sheet 118 ruling 5):
`cpl_writer.js` (`window.CPL_WRITER`, static in both HTMLs before `report_generator.js`) holds
each shared rule once as a named part (`NAMING_RULE`, `HOUSE_VOICE`, `SPELLING`,
`BUSINESS_WORDS`, `FUNDING_WORDS`, the eleven `AUDIENCES` with one line of guidance each),
the one `MODEL` (`claude-opus-5-5`, an unversioned alias, named nowhere else) and the one
proxy call, `draft(prompt, opts)` over `window.CPL_REPORT_PROXY_URL`, which resolves the text
and the served model or rejects with a sentence a tab can show. `system({ role, extra, omit })`
composes a consumer's system prompt: its role line, the voice, one Words paragraph, then its
own paragraphs. This tab is the first consumer: it keeps its role line, its facts rule, its
return format and the merge-field vocabulary, reads its audience maps from the writer's list,
and names no model. The model is told to write the fields in braces, never a literal, and no
address reaches it. The draft sits beside the body until *Use this draft*; nothing is sent.
Tests `tests/cpl_writer.test.js` (38) and `tests/comms.test.js` (79).

**Post to the Library** writes a `cpl_library` row (kind document, home web, the link
`#letters/<slug>`, seen_by from the audience) and stores its id on the record; a second
post refreshes that row. Retire sets `retired_at`; a trigger files every prior row in
`cpl_comms_history`.

**The May 2026 budget-support curator stays, folded.** The tab was an iframe to
`budget-support/web/curator.html` (the KB project's Supabase, passcode-gated; S10's
[hand-off](../../letter_curator_handoff.md)). It now sits under *Earlier* at the foot of the
tab and loads only when opened.

**The first record is Sam's CEO email** (receipt
`kb/receipts/cpl_comms_seed_2026-10-23.sql`, cohort `comms-seed-s457side@bot`, applied by
`supabase-migrate.yml` run 40000312732 after the session's insert was held by the Supabase
guard, which passes `cpl_memory` writes alone): his draft of 2026-10-23 with merge fields, status
draft, To the CEO, Cc the CIO and CSSO, and a JST-figures sentence from the feed. The Library's
open-asks series record moved to Sheet 118 the same way (run 40001082184; version 118, 37
versions). Its note names what he decides before it goes
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

## Sam's rulings ([Open Asks Sheet 118](https://claude.ai/artifact/D3uYDvJ3MigHaM8CgpKWse), 2026-10-23 18:44Z, all his own call; `cpl_memory` `sam-sheet-118-rulings-2026-10-23`)

4. **Keep the range.** The CEO email names $150,000 to $400,000 as typed. The sunshine rule
   stays as written for other outward materials; this email carries the figure on his call.
5. **One writer module** (`cpl_writer.js`): the naming rule, the house voice, the funding
   vocabulary, American spelling, the audience definitions, the model constant and the proxy
   call, consumed by every surface one PR at a time, this tab first. To build.
6. **Keep the JST-figures sentence.**
7. **President {last}** stays the salutation default for a CEO without an honorific.
8. **Keep the old curator folded** under *Earlier*; retire it and the two KB-project functions
   in one PR if nobody opens it after the Summit and the funding memo season.

## Next

- **The writer's next consumers (ruling 5), one PR each.** `activity_summaries.js` ported (S460,
  the second consumer: its role line and facts rule compose the system prompt through
  `W.system`, the draft goes through `W.draft` at 700 tokens, the posted row's `raw.model` names
  the served model, and its own naming-rule copy and `claude-sonnet-4-5` pin are gone).
  `report_generator.js` ported (S460, the third consumer): its six audiences live in the writer as
  `REPORT_AUDIENCES` (id, label, the report title the docx renders, a guide), `buildSystem()` composes
  its system prompt through `W.system`, the narrative goes through `W.draft` at the altitude band's
  tokens, and its naming-rule copy, its `claude-sonnet-4-5` pin and the direct `api.anthropic.com`
  fallback are gone. Next `college_report_generator.js` (its own six audiences and pin), `annual_report.js`,
  `raci.js` (the dated `claude-sonnet-4-5-20250929` pin), `credential_reference.js` (two small
  calls) and `quickstart.js` (routing; Haiku stays its own call by design, through
  `draft(..., { model })`). Each port deletes the surface's own copy of the rules and its model
  pin; `tests/cpl_writer.test.js` (6) pins that `comms.js` names no model, and each port adds
  its surface to that check.
- The email goes out from Sam's mail client by mail merge (the CSV) or one college at a time
  (the mail link); the record then takes `sent_on` and status final. Forty-five colleges have
  no CEO address in MAP; those need a directory MAP does not hold before they get the email.
- A per-college salutation override and a per-record recipient exclusion list, when a
  send shows the need.
- A send log: `sent_on` is one date per record; a per-college sent mark would need a
  child table, so wait for the first real send to see whether the CSV's record suffices.
