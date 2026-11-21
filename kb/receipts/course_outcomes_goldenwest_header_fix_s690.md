# Plan: Golden West SLO rows, the "Course Outcomes" sub-heading moved out of the outcomes (S690, 2026-11-20; S691, 2026-11-21T07:48Z)

**Status: a plan, not run.** The before-values are filed by id (S691, below). The write waits on a plain session's
review and runs before this branch's corrected filed reads merge; nothing below has changed `course_outcomes`.

**What:** a guarded UPDATE on `course_outcomes` for exactly 476 Golden West College SLO rows from CourseLeaf read
41399075269 (`f-golden-west-474-header-rows-s689`). The ids come from load receipt
`kb/receipts/course_outcomes_cccd_41412025040.json` (its `inserted_keys`, one id per course code, 7451 to 8018):
each row whose filed outcomes carry a line matching `^cour?se (learning )?outcomes?:?$` and whose `lead` is null.
S689's live count was 474; the two more are THEA G210 (id 7729, "Course Outcome") and MUS G111 (id 7934, "Couse
Outcomes"), both sub-headings (second reader on #3601). In the filed read, 471 carry the line first and last, 4 sit
under an ILOs block (CS G262, DANC G125, MUS G261, THEA G211) and ACCT G163 carries it twice. Each row's outcomes
become the items after the last such line; that line moves to `lead`; `shape` becomes `paragraph` where one outcome
is left (22 rows), else `list`; `fingerprint` becomes `md5(outcomes::text)`, the way S665's fix reproduced the
loader's fingerprints. No other column, row or table changes. The write refuses any count but 476.

**Why in place** (`d-goldenwest-subhead-fix-in-place-s665`): the load inserts by fingerprint, so a reread under the
reader fix on this branch would otherwise insert a second copy beside each row.

**The filed reads (second reader's MAJOR):** this branch corrects both of Golden West's filed reads the same way,
as S665 corrected its 3 rows: `kb/course_outcomes/cccd/read_41399075269_p{1,2}of2.json` (476 rows) and
`read_44251936045_p{1,2}of2.json` (454 rows; that read loaded objectives only, receipt
`course_outcomes_cccd_44263910106.json`). Each file carries a `corrected` note. A `golden_west` SLO load of the newest
read (`read_44251936045`) now posts no row with the sub-heading: replayed against the corrected live keys, it would
insert 19 rows and none carries it (`gw_reload.py`). Chosen over `never_load`, which would keep the read's 19 new
outcome blocks out too.

## What changed in S691 (the second reader's two points, `d-golden-west-stops-after-two-rounds-s690`)

**Point 1, the rollback no longer depends on the write's one large result.** The before-values are filed first, by
id, in [`course_outcomes_goldenwest_header_before_s691.json`](course_outcomes_goldenwest_header_before_s691.json):
476 rows, each with its course, address, outcomes, lead, shape and fingerprint, and the lead, shape and fingerprint
the correction sets (`after_*`). The outcomes come from main's filed read 41399075269 as load 41412025040 posted
them; a read-only live read then compared every live row with its own line by id
(`kb/migrations/2026-11-21_s691_goldenwest_before_live_read.sql`, supabase-migrate run 44881579974, 07:45Z on
2026-11-21; receipt `migration_s691_goldenwest_before_live_read_44881579974.json`): 476 listed, 476 rows, 476 the
guard accepts, no id differs or is missing, live checksum `cb441aa17605cc3827460f2e207587bb` (the receipt's
`before_checksum`), and no live row already holds a fingerprint the correction would set. A fingerprint is md5 of
the outcomes as jsonb text, so each id's fingerprint pins its outcomes. The `after_*` values equal the corrected
filed read on this branch for all 476. The write now returns each id with the fingerprint it set (`rows`, after the
short fields), and the rollback joins those to the before-values receipt by id.

**Point 2, the write goes before the merge.** If this branch's corrected filed reads reach `main` first, a
`golden_west` (`cccd`) load would insert the 476 corrected blocks beside the live header rows. So the order is fixed:

1. **Done (S691):** the before-values receipt, above.
2. **A plain session reviews** this plan, the write and the rollback (COBIx on #3358: *"then the guarded correction
   after a plain-session review"*). Nothing runs before that review.
3. **Re-read at write time** (Rule 10 a): run the live read file again under a new `.apply` line. Go only when it
   reads exactly as the receipt's `live_read.result` (476, 476, 476, `differ` and `missing` empty, the same
   checksum, `after_taken` 0).
4. **The write:** [`kb/migrations/2026-11-21_s691_goldenwest_header_fix.sql`](../migrations/2026-11-21_s691_goldenwest_header_fix.sql)
   through `supabase-migrate.yml`. It changes a row only when all 476 hold the receipt's fingerprint and each
   correction yields exactly its `after_fingerprint`; otherwise it updates nothing and returns `refused` true.
   Expected: `updated` 476, `eligible` 476, `refused` false, `mismatch` [], `checksum`
   `39192560b8b1319ac4981b4b98c31d8a` (the receipt's `after_checksum`). The runner's receipt keeps 4,000 characters;
   the short fields come first, so a cut leaves them whole, and `rows` past the cut are the receipt's `after_*`
   values, which the checksum confirms.
5. **Then merge** this branch's corrected filed reads. No `cccd` load runs between steps 4 and 5.

**The rollback:** [`kb/migrations/2026-11-21_s691_goldenwest_header_fix_rollback.sql`](../migrations/2026-11-21_s691_goldenwest_header_fix_rollback.sql),
never run unless step 4 ran and is to be undone. Its literal is the receipt's rows; it restores each row whose live
fingerprint is still the `after_fingerprint` the write set, and holds out and lists any other row for Sam
(`docs/reference/data_write_rollback.md`, step 2). It runs in the same sitting as a `git revert` of the read
correction on `main`, with no `cccd` load between, and then the live read file again reads `before_checksum` over
the rolled-back ids.

**Checked on a scratch Postgres 16 copy (S691)** of the 476 rows as the receipt holds them: the live read returned
the live run's result exactly; the write updated 476 with `mismatch` [] and checksum `39192560...`, left no header
line in the outcomes, and a second write updated 0 and returned refused; with 7451 curated before the write
(eligible 475) it updated nothing and returned refused; with 7729 edited after the write the rollback restored 475 and
held out 7729; a write then a rollback restored all 476, and the live read read `cb441aa1...` again.

**Same shape elsewhere, reported, not in this plan:** Coastline ANTH G190 (id 7204), and four Golden West rows whose
outcomes open with "Course Objectives" (ELL G015N, ART G145, AUTO G004N, ELL G025N).
