-- S641 (SkyOtter, two firings; the second was the conductor), 2026-11-12: the Rule 9 checkpoint's cpl_memory rows
-- (step 10): the second firing's eight decisions, the first firing's three (from its lane lines and its #3110 note),
-- and two lessons worth a row; all status proposed, for Sam to revise on Open Asks Sheet 184.
-- Drafted by the documents worker; the conductor runs it. One INSERT-only statement under author memory-s641-checkpoint-2026-11-12.
-- ROLLBACK:
--   delete from public.cpl_memory where author = 'memory-s641-checkpoint-2026-11-12';
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, x.event_date::date, 'memory-s641-checkpoint-2026-11-12', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "d-stopped-session-queue-takeover-s641",
  "kind": "decision",
  "title": "A firing takes a stopped session's queue after reading every channel and a quiet watch",
  "summary": "The S641 conductor, 2026-11-12: the 06:12Z firing stopped at 09:15Z with no handoff. The 10:12Z firing, with no list_sessions, read open PRs, main, runs, #3110 and cpl_memory (87 minutes silent), watched git ls-remote 23 more minutes, then opened draft #3149 declaring the whole queue before any other write. Procedure: scheduled_sessions.md, A session that stopped without a handoff.",
  "tags": [
   "scheduled-sessions",
   "conductor",
   "governance-team-enablement",
   "decision"
  ],
  "source": "Session call, S641 second firing (the conductor, session 01Rvwe2VStEWM8QUudeduFpw); docs/reference/scheduled_sessions.md",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-pdf-reader-equal-coverage-holds-s641",
  "kind": "decision",
  "title": "The PDF reader holds a passing record at equal coverage; a catalog year rereads every record",
  "summary": "The S641 conductor, 2026-11-12 (#3135): equal coverage holds a passing record, fingerprint or not. A worker's narrowing (read again when the fingerprint changed) was taken out: the fingerprint moves on unchanged text and a kept record keeps its old source_sha, so it would pay for the same records every run. A text change at equal coverage goes to a catalog-year rule, a design item, not built.",
  "tags": [
   "program-requirements",
   "pdf-reader",
   "cost",
   "decision"
  ],
  "source": "Session call, S641 second firing (the conductor, session 01Rvwe2VStEWM8QUudeduFpw); docs/reference/lanes/program-requirements-harvest.md",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-kept-passing-protects-full-pass-s641",
  "kind": "decision",
  "title": "A filed record that passes in full is replaced only by a read that passes in full",
  "summary": "The S641 conductor, 2026-11-12 (#3135): kept_passing keeps a filed record that passes score.pass and the live test unless the new read also passes both; before, a read passing passes_live but failing score.pass replaced it. The program goes to kept_passing.json with both scores for a person; force overrides. Guarded by a test in the reader's suite.",
  "tags": [
   "program-requirements",
   "pdf-reader",
   "decision"
  ],
  "source": "Session call, S641 second firing (the conductor, session 01Rvwe2VStEWM8QUudeduFpw); kb/_program_requirements_score.py",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-daily-rebuild-one-build-script-s641",
  "kind": "decision",
  "title": "The daily run's rebuild runs one build script, never an imitation of the runner",
  "summary": "The S641 conductor, 2026-11-12 (#3150, COBIx #3110 finding 8): a Python runner replaying the workflow's steps was replaced after three readers (shell flags differed, workflow env and defaults neither copied nor refused, every step got both secrets). scripts/daily_build.sh holds the 40 commands; on a conflicted rebase the job resets to the new main and runs that script once, then pushes.",
  "tags": [
   "governance-team-enablement",
   "ci",
   "daily-dashboard",
   "decision"
  ],
  "source": "Session call, S641 second firing (the conductor, session 01Rvwe2VStEWM8QUudeduFpw); docs/kb-notes/methodology-a-rebuild-runs-the-same-build-script.md",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-dsp-v3-public-25px-floor-s641",
  "kind": "decision",
  "title": "DSP Credit Starting Points public copy is Version 3; public targets take a 25px floor",
  "summary": "The S641 conductor, 2026-11-12 (#3151), on Sam's Revise and remediate of 2026-11-11 15:30Z: eight targets at exactly min-height 24px measured 23.9 at 90% and 133% zoom, three in the shared public header. Floor 25px in the vault sources (CPLBrain 0e4b1091); public pages took the header's lengths. cpl_library guarded UPDATE; receipt kb/receipts/cpl_library_dsp_v3_public_s641_2026-11-12.sql.",
  "tags": [
   "library",
   "accessibility",
   "target-size",
   "decision"
  ],
  "source": "Session call, S641 second firing (the conductor, session 01Rvwe2VStEWM8QUudeduFpw); Sam's request on the card, 2026-11-11 15:30Z, approved 15:31Z",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-de-anza-slo-held-s641",
  "kind": "decision",
  "title": "De Anza's SLO read is held: its catalog does not answer the older course codes",
  "summary": "The S641 conductor, 2026-11-12 (#3145): De Anza's 12-page trial got HTTP 200 on all 12 pages and 11 came back empty; one parsed (PSYCC 1000, 4 SLOs). The 2026-27 eLumen catalog does not answer the older course codes. Verdict row held in kb/course_outcomes/queue.json; waits on the reader mapping codes, then a fresh trial.",
  "tags": [
   "program-requirements",
   "course-outcomes",
   "slo",
   "decision"
  ],
  "source": "Session call, S641 second firing (the conductor, session 01Rvwe2VStEWM8QUudeduFpw); kb/course_outcomes/queue.json",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-desert-fetch-limit-2400-s641",
  "kind": "decision",
  "title": "College of the Desert's catalog fetch limit is 2,400 seconds",
  "summary": "The S641 conductor, 2026-11-12: the college's 21 MB catalog PDF ran past the 900 s fetch limit twice. catalog.timeout_s set 900 to 2400 through program_source_procedure_set (md5 before 5a5273a9..., after bbf96cf2...). Receipt and rollback: kb/receipts/program_source_procedure_desert_timeout_s641_2026-11-12.sql.",
  "tags": [
   "program-requirements",
   "pdf-reader",
   "procedure-record",
   "decision"
  ],
  "source": "Session call, S641 second firing (the conductor, session 01Rvwe2VStEWM8QUudeduFpw); the receipt",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-paid-reads-arc-lacc-s641",
  "kind": "decision",
  "title": "Paid reads for American River and Los Angeles City under the $40 standing go",
  "summary": "The S641 conductor, 2026-11-12: on the merged PDF reader, American River (capture 43209644816: 33 to extract, about $2.80) and Los Angeles City (capture 43209649692: 145 to extract, about $11.14), each on its own branch off main 17d5ac54, under the $40 per college per run go (sam-extraction-standing-go-40-per-college-2026-10-14). A record loads only through a receipt naming every inserted key.",
  "tags": [
   "program-requirements",
   "cost",
   "paid-run",
   "decision"
  ],
  "source": "Session call, S641 second firing (the conductor, session 01Rvwe2VStEWM8QUudeduFpw); docs/reference/lanes/program-requirements-harvest.md",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-credential-title-read-time-resolution-s641",
  "kind": "decision",
  "title": "A stored credential title resolves at read time through the applied renames (D1 to D3)",
  "summary": "The S641 first firing, 2026-11-12 (#3148): D1 a live title (a kb/credentials.json key) is itself; any other resolves through every in-force snapshot in _applied_at order. D2 retire aliases read kb/unclassified_fold/retires.json. D3 a resolution ends on a live title or is reported; no alias on a dead title. Retired names became search aliases; #3140 closed with this in its place.",
  "tags": [
   "cer-procedures",
   "exhibits",
   "rename",
   "decision"
  ],
  "source": "Session call, S641 first firing (the 06:12Z routine firing, session 01Rvwe2YRHaDAm69etRjXcPp); its #3110 note, comment 6817896225",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-lost-push-rebuilt-in-job-s641",
  "kind": "decision",
  "title": "A lost daily push is rebuilt inside the job, never by a dispatch",
  "summary": "The S641 first firing, 2026-11-12 (#3147 review): a dispatched rebuild would let the conflicted run end green having published nothing, the gate would stand the later rungs down, and a canceled rebuild would leave a day with no dashboard and a gap in kpi_history.json. Built by the second firing as #3150.",
  "tags": [
   "governance-team-enablement",
   "ci",
   "daily-dashboard",
   "decision"
  ],
  "source": "Session call, S641 first firing (the 06:12Z routine firing, session 01Rvwe2YRHaDAm69etRjXcPp); its #3110 note, comment 6817896225",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-cer-procedures-own-group-s641",
  "kind": "decision",
  "title": "cer-procedures.yml keeps its own concurrency group",
  "summary": "The S641 first firing, 2026-11-12 (COBIx #3110 finding 7's other option): cer-procedures.yml keeps its own group, its 07:47 cron clear of the daily ladder. GitHub cancels an older pending run in a group without an alert, so a wider group costs more than the overlap of four committed files it would remove.",
  "tags": [
   "governance-team-enablement",
   "ci",
   "cer-procedures",
   "decision"
  ],
  "source": "Session call, S641 first firing (the 06:12Z routine firing, session 01Rvwe2YRHaDAm69etRjXcPp); its #3110 note, comment 6817896225",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "p-shallow-clone-bare-fetch-s641",
  "kind": "pitfall",
  "title": "A bare git fetch on the shallow tracker clone pulls over a gigabyte",
  "summary": "S641, 2026-11-12: a bare git fetch origin on the session's shallow clone pulled over a gigabyte for 302 branches and tightened the disk. Fetch a branch by name with --depth (git fetch --depth 50 origin <branch>). Related: never copy the repository (4.4 GB) into the scratchpad; check du on the scratchpad after each review.",
  "tags": [
   "conductor",
   "scheduled-sessions",
   "disk",
   "pitfall"
  ],
  "source": "docs/reference/conductor_mode.md (What went wrong in S641)",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "p-read-receipt-keys-not-values-s641",
  "kind": "pitfall",
  "title": "Read a load receipt's keys and counts, never its values",
  "summary": "S641, 2026-11-12: the conductor printed a load receipt's whole rollback string (1,549 course_outcomes ids) into its context. Read a receipt's keys and counts (a short script over the JSON), never its values. Also: get_check_runs with perPage 1 shows test first only once it has finished; while it runs another job is first.",
  "tags": [
   "conductor",
   "context",
   "receipts",
   "pitfall"
  ],
  "source": "docs/reference/conductor_mode.md (What went wrong in S641)",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 }
]$json$::jsonb) as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text, source text, verified_by text, event_date text, related text[])
on conflict (slug) do nothing
returning slug, char_length(summary) as summary_chars;
