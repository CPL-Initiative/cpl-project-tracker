-- S640 (SkyHeron, the conductor), 2026-11-12: two rulings of Sam's that COBIx relayed on issue 3110
-- (comment 6813256997). A relayed ruling is confirmed (cpl_memory sam-cobix-relay-confirms-2026-11-11).
-- One INSERT-only statement under author memory-s640-relayed-rulings-2026-11-12.
-- ROLLBACK:
--   delete from public.cpl_memory where author = 'memory-s640-relayed-rulings-2026-11-12';
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, x.event_date::date, 'memory-s640-relayed-rulings-2026-11-12', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "sam-conductor-model-fable-5-2-2026-11-11",
  "kind": "decision",
  "title": "The CPL Queue conductor runs as Fable 5.2, ultracode on, medium effort, with Opus 5.5 workers and COBIx",
  "summary": "Sam, 2026-11-11 7:02-7:40 PM PT, relayed by COBIx: \"Yes, if we can keep the conductor operating in the cpl queue as fable 5.2 ultracode medium effort employing opus 5.5 workers in collaboration with [Cobix].\" and \"I can only set fable 5.2 and ultracode on medium is in instructions only and hopefully that works.\" He set the routine to Fable 5.2 with ultracode on; medium effort lives in its prompt.",
  "tags": ["conductor", "governance-team-enablement", "scheduled-sessions", "decision"],
  "source": "Sam Lee, 7:02-7:40 PM PT 2026-11-11, relayed by COBIx on issue 3110 (comment 6813256997)",
  "related": ["sam-conductor-mode-settings-2026-11-11", "sam-cobix-relay-confirms-2026-11-11"],
  "status": "verified",
  "verified_by": "Sam Lee",
  "event_date": "2026-11-11",
  "detail": null,
  "plain": null
 },
 {
  "slug": "sam-harvest-next-steps-tonight-2026-11-11",
  "kind": "decision",
  "title": "The queue takes the harvest side session's Next 1 to 4 tonight",
  "summary": "Sam, 2026-11-11 7:13 PM PT, relayed by COBIx: \"Yes, pick them up tonight.\" The queue takes the harvest side handoff's Next 1 to 4, all free runner-minute steps: merge Victor Valley (3131), reread and merge West Valley (3137), Rio Hondo (3136) and Berkeley City (3138), and the PDF reader's proofs (3135). Paid Los Rios re-extractions wait until 3135 has merged.",
  "tags": ["program-requirements", "harvest", "conductor", "decision"],
  "source": "Sam Lee, 7:13 PM PT 2026-11-11, relayed by COBIx on issue 3110 (comment 6813256997)",
  "related": [],
  "status": "verified",
  "verified_by": "Sam Lee",
  "event_date": "2026-11-11",
  "detail": null,
  "plain": null
 }
]$json$::jsonb) as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text, source text, verified_by text, event_date text, related text[])
on conflict (slug) do nothing
returning slug, char_length(summary) as summary_chars;
