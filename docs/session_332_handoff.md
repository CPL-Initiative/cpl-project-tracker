---
title: Session 332 handoff — the harvest tab in COBI, Cerritos's high school list by every public route, sheet 37
date: 2026-10-05
session: 331 (SkyForge)
tags: [handoff, program-requirements-harvest, cpl-pathways, college-page-read, harvest-tab, decision-sheet]
status: current
---

# You are Session 332

Your moniker is **SkyBridge**. SkyForge (S331, `session_01DiE8Qmnaxtu78GknbQp4Fn`) checkpointed with most of
its context left. If Sam's routine started you, read
[`docs/reference/scheduled_sessions.md`](reference/scheduled_sessions.md) first and follow it.

## First, in this order

1. **#1860** (the tab, reads 7-12, this checkpoint): merge it on a green `test` if S331 did not
   ([CPL-Initiative/cpl-project-tracker#1860](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1860)).
   Mark it ready for review first; it opened as a draft.
2. **Sheet 37** ([Open Asks Sheet 37](https://claude.ai/artifact/HNF6zXcqeCS5LRLYLB3x2F), current; it replaces
   sheet 36, which is answered). One card: send the request for Cerritos's high school list? Read its `replies`
   store with `ArtifactData` before acting. On "send": the MAP team sends the draft (sessions never send mail);
   record it on Cerritos's procedure record (`requests[0].status`) through `program_source_procedure_set` (v4,
   md5 `290ad739ec4acbe46b39793ac5642046`) and drop the lane's NEEDS SAM in the same change.
3. **The OSHA 30 question** (new, from read 12): Columbus High's welding capstone awards OSHA 30 Construction;
   the Ironworker A.S. lists IWAP 41.09 OSHA 30/Extension Review (1.5 units). Check CER/EACR for an OSHA 30
   credential pointing at IWAP 41.09 (the "for consideration" kind of CPL in `kb/_build_roep_display.py`).
4. **Dock Sierra in the tab**: `CPL_CHAT.mountInto(host, "program-requirements")` needs no deploy (`cpl-chat`
   reads an unknown surface as unscoped); adding it to `KNOWN_SURFACES` scopes her guidance (a deploy, under the
   standing A/B authorization only if it covers it).

## Decisions Sam made this run

None. Sam's only message was the opening line. His standing rulings still hold: find the list another way first
(sheet 36 card 2), the request stays held, and the decision now sits on sheet 37.

## What shipped (S331, #1860)

- **Program Requirements tab** (Beta draft, Reference & Curation): `program_requirements.js` reads
  `program_source_registry` and `program_requirement_records` live. Views: Catalogs, Program records, Sequences,
  Procedures. Test `tests/program_requirements.test.js` (45). The admin surface counts a read only in the
  `REST + "/<table>"` idiom, so the module keeps that form.
- **The reader** (`kb/_college_page_read.py`): `expand` opens collapsed sections (clicks only toggles that stay
  on the page; a still-hidden panel is read by textContent, tested with `getClientRects`); `rows` prints every
  matching table row with its links. A plan may read only named outside hosts.
- **Cerritos reads 7-12** (runs 37247286802, 37247716971, 37248015019, 37248993313, 37249565514, 37250119275):
  - Dead or closed: Cerritos is not a CATEMA site, `cerritos.ctecourseconnect.com` has no DNS, BoardDocs bars
    readers, DualEnroll is a sign-in page, and `/epp/Articulation_List.htm` returns 404.
  - Found: the CCAP partner schools (Downey, Warren, Columbus) and the archive's 2016 statewide list (57
    agreements, 27 schools and ROPs, no welding; `kb/program_requirements_pilot/cerritos_hs_agreements_2016.json`).
  - Columbus High's pathway: Welding and Materials Joining I and its Capstone, with OSHA 10 and OSHA 30.
- **Ladder** (`cpl_pathways_data.js`): three new In our data lines on the Start step; To confirm narrowed.
- **Procedure record v4** (receipt `kb/receipts/program_source_procedure_cerritos_v4_2026-10-05_s331.sql`):
  composed in SQL from the stored v3, dry run first, then written through the function on v3's md5.
- **cpl_memory**: four rows (receipt `kb/receipts/cpl_memory_2026-10-05_s331.sql`), each logged.
- **KB note** `methodology-a-search-result-is-a-lead-not-a-source`.

## Safety patterns

- **A search result is a lead.** Three addresses search returned for Cerritos were dead. Load before citing.
- **A procedure record changes through its function**, composed from the stored record (`p || jsonb_build_object(...)`)
  so nothing unchanged is retyped; dry-run the composition with a counting SELECT first.
- **The push reads only plans its last commit changes.** Commit a read plan alone (or as the only plan), push,
  then commit other work; two commits in one push read nothing.
- **`pkill -f <pattern>`** matches its own shell; prefer killing by PID.
- **The full `npm test` takes over 10 minutes locally**; CI runs it in four shards and is the gate.
- The sandbox reaches cccco.edu but not college sites, catema.com, `*.supabase.co` or artifact storage;
  runners reach the sites. The container restarted twice this run: uncommitted files survived both times.
- CLAUDE.md is at 59,997 of 60,000 bytes; the harvest lane at 19,936 of 20,000. Add nothing without trimming.

## Next work (after the four above)

- Re-read Cerritos Schedule+ for Spring 2027 IWAP and AED sections once they post (read 5's Spring spec).
- Record shape v3 (outcomes as printed); the program view's By requirement / By term layouts.
- The addenda reading agent after the 2026-10-11 apply (Cerritos's B.S. list may arrive as an addendum).
- Widen the harvest past the pilot, with a procedure record per college as each is read.
- Apply the statement on the public KB once CPL-Initiative/cpl-knowledge-base#25 merges (Sam's review).
- Raise Miramar's AUTO 156G articulations (EMT, Driver Operator 1B) in the clean-up lane.
