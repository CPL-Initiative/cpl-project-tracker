-- S504 (SkyMulberry), 2026-10-28: Rule 8 ingest for the narrated funding film. INSERT-only under author/actor
-- memory-s504-2026-10-28. ROLLBACK: delete from public.cpl_memory_log where actor = 'memory-s504-2026-10-28';
--   delete from public.cpl_memory where author = 'memory-s504-2026-10-28';
-- related is coalesced to '{}' and every summary is <= 400 (S493's two failures).
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, '2026-10-28'::date, 'memory-s504-2026-10-28', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "sam-funding-film-his-script-draft-6-2026-10-27",
  "kind": "decision",
  "title": "Sam: the narrated funding film speaks his own script (Draft 6), with the period and the Noncredit CPL Lead",
  "summary": "Sam, 2026-10-27 ~22:48Z, on Draft 5: \"The script is an older one. The newer one starts with greetings CPL heroes and ends with Our Time is Now... The only changes to it are to take off the exclamation point on the opening and the addition of the nc condition.\" 2026-10-28: \"it was not the noncredit video. The file name is ..._Narrated_Draft_6.\" Built as Draft 7 (S504); Sam: \"Excellent video!\"",
  "detail": "S504 first read his ask as the Noncredit Summit film (its v3 opens \"Greetings, Noncredit CPL Heroes\" and closes \"Our time is now!\") and sent it; Sam corrected that. Draft 6 is the side session of 2026-10-21 (claude.ai session 01XQMmTq7rSj2Q4Q3fSJyV1m, cpl-project-tracker#2323): his marked-up script (20261021_CPL_Funding_in_Motion_Narration_Script_Sierra.docx), the say forms (C.P.L., F.T.E.S. for one, FTEs for more; his sample C), the barrier volleys and the Veteran Star. He told that session \"I'm stoked with the final outcome.\" On Draft 7 (2026-10-28, ~00:55Z, in chat): \"Excellent video! Thanks for hanging with me on this one--it's a biggy for our state!\"",
  "plain": null,
  "tags": [
   "implementation-funding",
   "funding-film",
   "sam-ruling"
  ],
  "status": "verified",
  "source": "Sam, in session chat, S503 (2026-10-27) and S504 (2026-10-28)",
  "verified_by": "Sam",
  "related": [
   "sam-film-recorded-piano-approved-2026-10-27"
  ]
 },
 {
  "slug": "side-session-pr-2323-never-merged-2026-10-28",
  "kind": "pitfall",
  "title": "A side session's open PR (#2323, the funding film in Sam's script) went unmerged for a week and main diverged",
  "summary": "#2323 (10-21, side session beside S443) was left to merge on a green test; its handoff was a side file, not the numbered line, so no session picked it up. Main rebuilt the film v9 to v12 and re-read Sierra's October 2 script on 10-27 while Sam's approved script sat on the branch. S504 ported it as Draft 7 and closed #2323.",
  "detail": "Detection: Sam named a file (..._Narrated_Draft_6.mp4) no main commit held; search_pull_requests for funding film found #2323 open. The version names collided too: the branch's Scenario_2_v9 and main's S466 v9 are different films. Guard: at session start, list open PRs (not just main's commits since the handoff) and read any side-session handoff a PR body names.",
  "plain": null,
  "tags": [
   "implementation-funding",
   "funding-film",
   "scheduled-sessions",
   "pitfall"
  ],
  "status": "proposed",
  "source": "cpl-project-tracker#2323; S504",
  "verified_by": null,
  "related": [
   "sam-funding-film-his-script-draft-6-2026-10-27"
  ]
 }
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'memory-s504-2026-10-28', 'create', 'S504: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'memory-s504-2026-10-28'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'memory-s504-2026-10-28');
select slug, status from public.cpl_memory where author = 'memory-s504-2026-10-28';
