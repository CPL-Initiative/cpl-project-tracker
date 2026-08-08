---
title: Session 129 handoff (SkyNaut → next) — the data is in; Sierra can't see it yet
created: 2026-08-08
updated: 2026-08-08
tags: [handoff, student-detail, disposition, veteran-sprint, supabase, sierra]
related:
  - "[[docs/student_detail_load_lessons]]"
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
  - "[[docs/kb-notes/playbook-access-export-to-supabase]]"
  - "[[docs/map_nightly_feed_spec]]"
---

# You are Session 129

Previous session was **SkyNaut (128)** — a long one, 14 PRs. Sam named it, then renamed it
*SkyInsistent* after I refused to drop one column. Take a name or coin your own.

## Read first, in order

1. This file.
2. `docs/student_detail_load_lessons.md` — both dated sections. The story is written once, there.
3. `docs/kb-notes/adr-student-detail-aggregate-disclosure-control.md` — **before publishing any per-college number.** Ratified, not draft.
4. `docs/kb-notes/playbook-access-export-to-supabase.md` — before the next load.

## ✅ What is live

| Table | Rows | Gate |
|---|---|---|
| `map_student_credit` | **220,588** | reviewer-only, **no write policies** |
| `map_college_cr_unit` | **204,714** | reviewer/team |
| `map_college_goal2` | 171 cells | reviewer/team |
| `map_college_credit_summary` | 111 | reviewer/team |
| `map_colleges` | 128 (+`entity_kind`) | public read |
| `map_data_loads` | provenance | reviewer/team |

Both loads **reconciled exactly** against Sam's Access counts. Both staging tables dropped.
🎓 **Course Credit tab is live** — goal 2 *and* credits, filterable, team-gated, states its own freshness. 44 committed checks.

### The numbers

- ⭐ **1,052,531 units of credit at Needs Action** — already earned, never awarded
- ⭐ **64,074 of those are ALREADY ARTICULATED** — everything built, nobody acted (~1,000 degrees' worth)
- Applied **111,779** → transcribed **60,246 (54%)** — the next gap
- Sprint goal 2: **60.0% statewide / 71.7% median college**, 14 at 100%, none at 0
- **Every non-college entity is at zero awarded** — 127 trainees, 5 institutions, not one award

**Lead with the 64,074, not the million.** The million is a ceiling: ~30% of reviewed credit is correctly
*Not Applicable*, and ruling a recommendation out is legitimate work. Say so before someone else does.

---

# 🎯 PRIORITY 1 — wire the COBI Sierra

**Sierra reaches none of this.** No retrieval path, tables gated to reviewer/team, no prompt rules, no smoke
assertions. Sam asked whether she'd have it "tonight" — the honest answer was no.

⭐ **THERE ARE TWO SIERRAS, and it changes the risk profile completely.** Sam, 2026-08-08: *"Sierra only lives
in COBY for now. We use a different Sierra for the colleges and portal."*

- **The COBI Sierra is INTERNAL** — same audience as the Course Credit tab, which already shows per-college
  figures behind the team gate. Wiring *that* one carries **no new disclosure decision**: the blast radius is
  identical to a tab that already shipped. **Start here.**
- **The colleges/portal Sierra is PUBLIC.** *"Your college has 12,000 units unawarded"* would be a public
  per-college performance statement, and *never rank colleges publicly* is standing. That is a **separate
  decision for Sam**, and only if that instance is ever pointed at this data. **Do not assume the two share a
  retrieval path — confirm the deployment topology before touching anything.**

Then: retrieval against the **published** aggregates (never the student grain), **service-role read** from the
edge function (it runs server-side — do *not* widen RLS to anon), prompt rules carrying the ceiling caveat,
smoke assertions, deploy via `.github/workflows/cpl-chat-deploy.yml`.

⚠️ The verified fact here is Sam's statement about the two instances. **Which function/deploy each one uses is
NOT verified** — check it rather than inferring from `cpl-chat` being the only function you find.

# 🎯 PRIORITY 2 — nightly, via MAP's API

Sam wants this **nightly**, not monthly, and the MAP team will mirror whatever we specify.
`docs/map_nightly_feed_spec.md` is **drafted and awaiting his read** — three feeds, the stable-student-key ask,
the district reference, nine documented pitfalls.

**Blocked on one string:** the view name. Three candidates return `400 … is not Valid`; a single-column retry
gives the identical error, so it is the *name*, not the column list. Sam expects it **next week**. When it
lands it is a **~4-line change** to `REQUEST_PAYLOAD` in `fetch_custom_report.py` — the cron already fetches
8 views from that endpoint, unauthenticated. No new infrastructure.

⚠️ Recommend the **persistent surrogate** over a salted hash for the student key (a hash of a small enumerable
ID space inverts for anyone holding the salt), plus a **key version stamp** so a regenerated mapping is
detectable rather than silently comparing incomparable extracts. The spec still says "salted hash" — **Sam has
not yet said whether to swap it.**

# 🎯 PRIORITY 3 — the smaller open items

- **Name colleges 122 and 131.** In the student data, absent from `map_college_users`. 122 has **117 trainees
  and zero awards**. Sam's read: agency partners (Futuro Health is 133, Launch is 132, so these are others).
  `entity_kind` is deliberately NULL for both — do not guess it.
- **The NC roadmap row is wrong.** It says those institutions are "at ZERO". They are at zero on **awards**,
  not on **recommendations** — a better and more urgent framing for the landing-page work.
- **`variants[]` in `map_colleges` is empty on purpose.** Internal names have zero variation (123 names, 120
  resolve, 0 differing). The variation is against **external** CCC sources — accumulate spellings there as you
  meet them, curated once each.

## ⚠️ Things earlier handoffs got wrong — do not re-inherit

1. *"Same gate as `kb_curation`"* — `kb_curation` is **world-readable**. Use the `team_access` shape.
2. The goal-2 formula over four credit columns **divides by zero** on the whole backlog. Use `course_type`'s suffix.
3. `course_type` is **12 values across two vocabularies**, not 3.
4. `distinct_students` **does not sum** across rows. Credits sum; students dedupe.

## Patterns that worked

- **Ask for 30 real rows before designing.** Four schema errors, none of which would have errored.
- **Stage to capture, let the PK detect.** Staging makes a load succeed; the primary key is what refuses to
  absorb corruption. The importer's batch re-send is **intermittent** — a count check that passed last time
  proves nothing.
- **Route the unknown to a visible bucket.** `Unspecified`/`UNKNOWN` both came back 0 — but only because they
  could have come back non-zero.
- **A detector returning zero deserves investigation, not relief.** The empty `variants[]` was checked before
  being believed.
- **Sam's pushback beat my inference twice** — the default-units point, and the college lookup that was already
  in the database. Believe him, then verify, then record it.

## Safety patterns to honour

- Never route per-student rows through a session's context. Aggregates only.
- Sandbox cannot reach `*.supabase.co` — all Supabase access via MCP.
- **Never commit any MAP export** — this repo is public.
- Merge on `clean` OR `unstable`; never force-push `main`.
- After a squash-merge, `git fetch && git reset --hard origin/main`. The stop-hook "unpushed commits" nag that
  follows is a **documented false positive** — verify committer + ancestry, then ignore.
- Wrap networked git calls in `timeout`.

## Moniker

**SkyWire** is suggested — the next lane is connecting what exists to who needs it.
