---
title: "CER redesign handoff: the review card's Back and Accept all, the funding requesters, the landing-page contacts (SkyCloudberry)"
date: 2026-10-31
session: CER redesign build, side session after S536 (SkyCloudberry)
tags: [handoff, cer, exhibits, implementation-funding, map-users, landing-page]
status: current
---

# You are SkyCoralberry, the Exhibits tab's next build

SkyCloudberry ran on 2026-10-31 from 15:10Z. Sam opened it on funding tweaks before the Exhibits queue, then asked for
the review card's Back and Accept all, then for the landing pages' contacts in the MAP Users tab. No other session was
live on these files. This is a **light checkpoint**: three lane files moved (`implementation-funding`, `cer-procedures`,
`map-users-student-contact`), the two over budget moved history verbatim to their lessons docs, and the docs index, the
Exhibit status file, the memory rows and the vault note moved. No Roadmap row moved, no re-mint or Rule 10 receipt was
written, and `README.md`, `kb/README.md`, the pipeline view and the KB notes were not touched. The numbered session
handoffs stay with the main queue; this lane keeps this file.

## What shipped

- **#2620: the Exhibits review card.** Change to Proposed Title first, the local title in bold, **Back** (this visit's
  decided or skipped cards, newest first, naming the save; a new choice replaces it, since `kb_curation`'s key is
  (course_id, field) and the write merges), and **Accept all proposed titles (N)**, which asks first and leaves a conflict
  or a title someone already saved as it is.
- **#2619: the funding requesters.** A reviewer's requester line reads *name (title) · MAP role · landing page*; *find
  title* searches the requester's domain when the title is Other; an attestation also says whether its Lead is on the
  landing page. One editable response email (`accept_email`, Minimum Conditions, *Response email*) serves both kinds and
  signs *The CPL Initiative team* with the navy logo; Accept opens it in a window with *Copy and open draft*.
- **#2621: the MAP Users tab** carries a *Landing page* column, a stat box and, in each roster, *On the landing page*
  (title the page gives, name, email, MAP role or *Not a MAP user*).
- **The data under both:** `map_landing_contacts`, a gated mirror of each MAP landing page's `api/ui-settings/<slug>`
  contacts, rebuilt daily by `map/sync_landing_contacts.py` in `map-users-sync.yml`. First full sync 16:24Z: 313 named
  contacts at 105 colleges, 61 not MAP users. Lookups `cpl_funding_requester_context()` and
  `map_landing_contacts_roster()` answer in 0.47s together.

## Read first

`docs/reference/lanes/cer-procedures.md` (*The Exhibits tab*, NEXT), then `docs/cer_v2_redesign_lessons.md` (its
SkyElderberry and SkyCloudberry sections).

## Open work, in order

1. **Read Sam's first Back and Accept all use** in `kb_curation` (his `reviewer_email`, `_UNCLASSIFIED::` rows after
   about 16:30Z). If he accepted all, the next nightly fold (07:47Z cron) should drop the Proposed count sharply.
2. **The routine** (Open Asks Sheet 149 card 2, *routine*): a rule Sam adds in the Exhibits tab becomes a request row; a
   scheduled session builds it with tests, runs the dry run, opens the PR and writes the dry run back for *Turn on* or
   *Discard*. Map it in `kb/governance_surface_map.json` (DR-07) and check the privacy ADRs first.
3. **Read tonight's run:** `brand-family`'s first AP saves; the AP fold (#2617) should leave no conflicts.
4. **IB on the AP pattern**, then CLEP's official names.
5. **One open question to Sam, asked in chat:** whether "the college landing page" meant MAP's landing page (built) or
   the college's own site. Act on his answer if it comes.
6. Carried: the Catalog's *Courses that may align*; training sites for a held title new to the reference, only if Sam
   asks; the college short-name editor; the CPL-AI snapshot by hand.

## Lessons to honor

- A correlated subquery over a function of another table's column recomputes it per row: compute keys once in a
  `materialized` CTE (the roster timed out at 60s, then answered in under half a second).
- A new public table needs its own `grant ... to service_role` (`supabase_table_grants_test`).
- A drawer table inside the main table inherits its header style; scope it (`.mapu-table .mapu-roster th`).
- The sandbox reached `cpldashboardcccco.azurewebsites.net` on 2026-10-31, though older notes call it egress-blocked.
- Two PRs that both regenerate the dependency map: merge one, merge `main` into the other, regenerate. Never pick a side.

## Let go

At sign-off this session dropped its PR watches (#2619, #2620, #2621) and its one check-in; it holds no artifact watch.
