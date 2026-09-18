---
title: Session 269 handoff — the register's three tweaks, half landed (EMERGENCY checkpoint)
date: 2026-09-17
session: 268 (SkyBridge, continued as SkyQuarry's second run)
tags: [handoff, partner-crosswalks, my-college, register, emergency-checkpoint]
status: current
superseded: true
superseded_by: session_274_handoff.md
---

# You are Session 269

Your moniker is **SkyLedger** — the work in front of you is the register's
ledger of exhibits and their credit recommendations.

⚠️ **THIS IS AN EMERGENCY CHECKPOINT** (Rule 9a, 53,168 tokens left at 93.2%).
Sam asked to hand over before a compaction. **NOT refreshed this run:** the KB
notes, `kb/cpl_todos.json`, `docs/INDEX.md` + `docs/catalog/`, `kb/README.md`,
`README.md`, the Pipeline tab, `cpl_memory` rows, the lessons doc, and the
`CPLBrain` vault note. The lane file and this handoff are what got written.
**Run `python3 kb/_docs_audit.py` first**, then catch the rest up.

⚠️ **PR #1594 IS OPEN AND DELIBERATELY A DRAFT** — it carries this checkpoint
and the generator edits below. It stays a draft until you have RUN the generator
for one college, because nothing here is verified end to end. Mark it ready and
merge once it is.

Read: [`lanes/partner-crosswalks.md`](reference/lanes/partner-crosswalks.md) ·
`docs/session_268_handoff.md` · PRs #1591 #1593.

## What shipped earlier today (all merged)

- **#1591** — the occupation opportunity register in the My College tab.
- **#1593** — the Strong Workforce scope turned on, plus **"Narrow by Strong
  Workforce region"** on the college picker. Live on Pages, confirmed.

## ⚠️ SAM'S THREE ASKS — the live work, ONE of three done

He reviewed the register on 2026-09-17 and asked for three changes. Verbatim:

> 1. No need to list items where the college has no aligned course or program
> 2. Need to list the MAP exhibit CER names above any of the aligned credit
>    recommendations and note any that are Statewide exhibits/CRs
> 3. Add a CIP Sector filter rather than the numbered P chips — I think the page
>    chips may not be needed once you get rid of all the non-aligned items

He then pointed at the reference for #2:

> Refer to the Delta College example you created for Ashley...
> "G:\\My Drive\\AI Documentation\\delta_cpl_crosswalk (2).html"

⭐ **THAT FILE IS IN DRIVE AND IS NEWER THAN OURS** — `delta_cpl_crosswalk
(2).html`, id `1OS7C1oNmM6tAmOIJwp3BPfklNB5u_EAy`, 406 KB, **modified
2026-09-17 14:48**, owner `camapinitiative@gmail.com`. It is `text/html`, which
`read_file_content` does not accept — use
`mcp__Google_Drive__download_file_content` (base64) instead. **READ IT BEFORE
BUILDING #2**; it is the layout Sam wants and it has been edited since the copy
our generator produces. Ours regenerates with:

    python3 kb/_build_college_offering_crosswalk.py --college "San Joaquin Delta College" \
      --slug delta --partner "San Joaquin County Office of Education" \
      --partner-run kb/partner_crosswalk_out/2026-08-06-sjcoe/summary.json

## State of each ask

**⚠️ THE GENERATOR IS EDITED AND COMMITTED BUT NOT RUN END TO END.** Syntax is
checked; no full build has been done since. Run one college first.

| Ask | State |
|---|---|
| 1 — drop no-alignment rows | **NOT started.** These are the **P5** tier (`fit: none`, exhibit exists). Measured: dropping P5 takes 6,903 rows to **2,978** across the Bay 28 (57% goes); Chabot 253 → 129. Do it in `kb/_emit_regional_opps_data.py` beside the existing P6 handling, and disclose the count the way P6 already is. |
| 2 — CER above its CRs, statewide marked | **DATA DONE, view NOT started.** `map_exhibits()` now carries `recs` per unified title, and each row carries `exhibit_detail`: `[{cer, statewide, adopted, recs:[{course, credit}]}]`. Statewide is `collaborative_type == "CCC Collaborative"` (137 of 2,958 exhibits). ⚠️ `exhibits` STAYS a flat list of CER names — the workbook, page and handout all `"; ".join()` it, so `exhibit_detail` is ADDITIVE. |
| 3 — CIP Sector filter | **DATA DONE, view NOT started.** Rows carry `cip_sectors` (2-digit prefixes of the matched programs' CIPs, from `coci_programs_data.js` column `r[4]`). ⚠️ **"CIP Sector" is Sam's word for the 2-DIGIT CIP level** — `cip_crosswalk.js:1782` says so outright, and its labels come from `window.CIP_CROSSWALK.fams` (50 families). |

⚠️ **THE NEAR-MISS TO AVOID ON ASK 3.** `statewide_data.js` carries a `sector`
field with exactly **10** values (Academic Transfer & General Education,
ICT/Digital Media, Health, …). Those are the CCC **industry** sectors, NOT CIP.
The CO's **ten noncredit CIP categories** (`kb/_build_noncredit_cip_categories.py`)
are a third ten-value taxonomy, about CDCP eligibility. **Three different tens.**
Sam's "CIP Sector" is the 2-digit CIP family, evidenced in the code. Getting
this wrong looks exactly like getting it right.

⚠️ **P2 AND P4 ROWS HAVE NO CIP SECTOR** — they are the no-exhibit tiers, and
`cip_sectors` comes from matched programs. At Chabot that is 34 of the 129 rows
that survive ask 1. The filter needs a "No CIP assigned yet" bucket, which is
what `cip_crosswalk.js` already calls it — match that wording.

## Also fixed this run, uncommitted risk now gone

⛔ **A REGRESSION I SHIPPED IN #1591.** Last night's "write the dependency-free
output first" reorder put `write_workbook` dead LAST — but `write_handout`
**reads the workbook** to base64-embed its download button, so every run raised
`FileNotFoundError`. The rule was right and my ordering was wrong: order by what
can FAIL, and the handout depends on the step that can. Order is now page →
receipt → workbook (guarded) → handout, and the handout drops only its download
button when `openpyxl` is absent. ⚠️ **Not yet verified by a run.**

## Next concrete step

1. `python3 kb/_docs_audit.py`, then catch up the artifacts this run skipped.
2. Download the Drive file and read its layout before writing any markup.
3. Run the generator for ONE college and confirm `exhibit_detail`, `cip_sectors`
   and the handout all come out right.
4. Then asks 1–3 in the emitter and `college_briefing.js`, and re-emit.

⚠️ **A full Bay 28 rebuild is ~6.5 minutes**, and the register data file must be
re-emitted from the new receipt (`kb/_emit_regional_opps_data.py`) or the tab
keeps reading rows that carry none of the new fields.

## Safety patterns to honor

- **Rebuild the dependency map genuinely LAST** — a DOCSTRING edit counts; that
  made it stale once already today. `git add` a new data file BEFORE rebuilding,
  or it maps with no producer recorded.
- **`check_floor.json`: hand-add ONE entry from an ISOLATED run**, at `indent=2`.
- **A `check_suite.completed` wake routinely names a SUPERSEDED `head_sha`** —
  re-read `get_check_runs` on the current head every time.
- **Doc budgets are UTF-8 BYTES, not characters** (⚠️ is 6, ⭐ is 3).
- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase only
  through MCP) · `test` green on the CURRENT head before every merge.

## KB notes added this run

(none — emergency checkpoint; the write-order correction above is a candidate
and should be folded into `methodology-write-the-dependency-free-output-first`,
which currently states the rule without the ordering caveat that broke it.)

---

*Greetings, you are Sky**Ledger** (Session 269), see Sky**Bridge**'s handoff —
`docs/session_269_handoff.md` — let's keep rolling with our queue.*
