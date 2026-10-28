-- S507 (SkyDewberry, Sam's session), 2026-10-28: Sam's Sheet 138 and 139 rulings, his "funding procedure" correction, and three learnings.
-- INSERT-only under author/actor memory-s507-2026-10-28. ROLLBACK:
--   delete from public.cpl_memory_log where actor = 'memory-s507-2026-10-28';
--   delete from public.cpl_memory where author = 'memory-s507-2026-10-28';
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, x.event_date::date, 'memory-s507-2026-10-28', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "sam-sheet-138-faq-rulings-2026-10-28",
  "kind": "decision",
  "title": "Sam's Sheet 138 rulings: the funding FAQ, his words on seven cards, card 8 left out",
  "summary": "Sam completed Open Asks Sheet 138 (the funding FAQ, 21 cards) at 21:16Z 2026-10-28, all his own call: his own answers on cards 2, 4, 6, 7, 9 and 17; card 1 his draft plus his added sentence (\"by screening incoming students for CPL, colleges will inevitably improve their Priority 1 outcomes and funding\"); cards 3, 5, 10 and 11-21 as revised; card 8 left out: \"Do not include this question since we are no longer linking adoption of statewide exhibits to the funding outcomes.\" S507 posted the set to FAQ_DEFAULT_PLAIN (cpl-project-tracker#2536).",
  "tags": [
   "implementation-funding",
   "funding-faq"
  ],
  "status": "verified",
  "source": "Open Asks Sheet 138 replies store; cpl-project-tracker#2536",
  "verified_by": "Sam",
  "detail": null,
  "plain": null,
  "event_date": "2026-10-28",
  "related": null
 },
 {
  "slug": "sam-funding-procedure-not-proposed-2026-10-28",
  "kind": "decision",
  "title": "Sam: the FAQ says the funding procedure, never proposed",
  "summary": "Sam in session, 2026-10-28, on his own FAQ draft (\"the proposed funding model measures outcomes\"): \"should be funding model not proposed (no longer proposed)\", then \"funding procedure is beter\". Card 1 reads \"the funding procedure measures outcomes based on CPL units recorded in MAP\".",
  "tags": [
   "implementation-funding",
   "funding-vocabulary",
   "funding-faq"
  ],
  "status": "verified",
  "source": "S507 session, 2026-10-28; cpl-project-tracker#2536",
  "verified_by": "Sam",
  "detail": null,
  "plain": null,
  "event_date": "2026-10-28",
  "related": null
 },
 {
  "slug": "sam-apportionment-in-funding-faq-2026-10-28",
  "kind": "decision",
  "title": "Sam: the FAQ names the apportionment procedure, because funding through it can get buried at colleges",
  "summary": "Sam, Open Asks Sheet 139 card 2 (\"written\"), 22:00Z 2026-10-28: \"It arrives through the apportionment funding procedure used by the CO. It is not apportionment for CPL, which is something we hope for in the future, but it is important to use the term because funding distributed through the apportionment procedure can get buried at the colleges.\" His FAQ answer on where the funding goes posts as written; cpl_funding_calm lifts out his two phrases and no other. Narrows his 2026-10-01 ruling (\"through apportionment\" for the seed grant only) for this one answer.",
  "tags": [
   "implementation-funding",
   "funding-vocabulary",
   "funding-faq"
  ],
  "status": "verified",
  "source": "Open Asks Sheet 139 replies store; cpl-project-tracker#2536",
  "verified_by": "Sam",
  "detail": null,
  "plain": null,
  "event_date": "2026-10-28",
  "related": null
 },
 {
  "slug": "sam-statute-link-leaves-section-title-2026-10-28",
  "kind": "decision",
  "title": "Sam: the priorities title's statute link moves to the section's first line",
  "summary": "Sam, Open Asks Sheet 139 card 1 (\"move\"), 2026-10-28: a link in a funding section's title now opens the section's body as \"Source: Ed. Code §78093.2(d)(1)\" (sectionShell, .cplfund-sec-ref). The title keeps his words. It was the one COBI fault in S507's 131-target sweep (axe nested-interactive: a link inside the <summary> that opens the section).",
  "tags": [
   "implementation-funding",
   "a11y",
   "cobi-dark-mode"
  ],
  "status": "verified",
  "source": "Open Asks Sheet 139 replies store; cpl-project-tracker#2536",
  "verified_by": "Sam",
  "detail": null,
  "plain": null,
  "event_date": "2026-10-28",
  "related": null
 },
 {
  "slug": "a11y-sweep-s507-131-targets-2026-10-28",
  "kind": "fact",
  "title": "S507 swept all 131 a11y targets two days before the Summit: 125 passed, six shared one node",
  "summary": "npm run a11y on main 157c3b39 (after #2533's funding forms): the ten public Summit targets, funding-film-narrated, the public pages' dark themes and every other view pass, axe-core 4.10.2 included. cobi, cobi-dark and the four funding-curator targets failed on one node, the priorities title's statute link inside its <summary>; #2536 moved it on Sam's word, and its FAQ answers wrap a long URL so the tab stays inside 390px. Re-measured clean in both themes.",
  "tags": [
   "a11y",
   "implementation-funding",
   "cobi-dark-mode"
  ],
  "status": "proposed",
  "source": "docs/reference/lanes/cobi-dark-mode.md; cpl-project-tracker#2534, #2536",
  "verified_by": null,
  "detail": null,
  "plain": null,
  "event_date": "2026-10-28",
  "related": null
 },
 {
  "slug": "pitfall-two-sessions-one-sheet-number-2026-10-28",
  "kind": "pitfall",
  "title": "Two live sessions both published an Open Asks Sheet 138, and one nearly overwrote handoff 507",
  "summary": "On 2026-10-28 S506 (funding tweaks) and S507 (a11y sweep) each built and published a Sheet 138 on the same lane within minutes, editing the same builder lines; S506 then set out to write docs/session_507_handoff.md, which already held Sam's S505 checkpoint. Caught because Sam flagged the other session. Before numbering a sheet or a handoff, run list_sessions and read the open PRs, and agree the number and one writer per file with any live session.",
  "tags": [
   "scheduled-sessions",
   "decision-sheets"
  ],
  "status": "proposed",
  "source": "S507 session; samueltlee/CPLBrain#523, #524",
  "verified_by": null,
  "detail": null,
  "plain": null,
  "event_date": "2026-10-28",
  "related": null
 },
 {
  "slug": "pitfall-glyph-sweep-counts-by-line-2026-10-28",
  "kind": "pitfall",
  "title": "The glyph sweep classifies by line, so a button on a line turns every glyph there into a control",
  "summary": "kb/_glyph_sweep.py's control count rose from 53 (10-19) to 176 (10-28) with no new glyph: each Workplan Goals row is one generated line that now holds a Details <button>, so the row's primary-activity star and hidden pencil count as control. Read a jump against the lines it names before treating it as new glyphs.",
  "tags": [
   "a11y",
   "glyph-sweep"
  ],
  "status": "proposed",
  "source": "kb/glyph_sweep/2026-10-28.md",
  "verified_by": null,
  "detail": null,
  "plain": null,
  "event_date": "2026-10-28",
  "related": null
 }
]$json$::jsonb) as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text, source text, verified_by text, event_date text, related text[])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'memory-s507-2026-10-28', 'create', 'S507: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'memory-s507-2026-10-28'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'memory-s507-2026-10-28');
select slug, status from public.cpl_memory where author = 'memory-s507-2026-10-28';
