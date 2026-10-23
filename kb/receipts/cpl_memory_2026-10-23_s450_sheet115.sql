-- S450 SkyMariposa, 2026-10-23: Sam's Sheet 115 rulings as one verified cpl_memory row (Rule 8 ingest).
-- INSERT-only, ON CONFLICT DO NOTHING, author 'S450' (Rule 10 a). Rollback: delete from public.cpl_memory where slug =
-- 'sam-sheet-115-rulings-2026-10-23' and author = 'S450'.
-- A good result: one row inserted (rows_inserted 1); 0 means the slug exists, re-read before retrying.
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, source, related, status, verified_by, verified_at, event_date, author)
select x.slug, x.kind, 'cpl', x.title, x.summary, x.detail, x.plain, x.tags, x.source, '{}'::text[], x.status, x.verified_by,
       case when x.status = 'verified' then now() end, x.event_date::date, 'S450'
from jsonb_to_recordset($json$[
 {
  "slug": "sam-sheet-115-rulings-2026-10-23",
  "kind": "decision",
  "event_date": "2026-10-23",
  "title": "Sam's Sheet 115 rulings: remove the 25 older-build program records and Victor Valley's two; keep Scenario 4's noncredit gate and the standalone condition list as built",
  "summary": "Sam, Open Asks Sheet 115 (https://claude.ai/artifact/QTC1MKB7AbWBMQtL9iPba9), 12:23-12:26Z 2026-10-23, Complete through 3, each his own call: card 1 remove (the 25 live records on an older display build and Victor Valley's two department-list records, with a receipt); card 2 keep (a credit college's noncredit share gates on its confirmation plus the two noncredit conditions); card 3 keep (a standalone's attested noncredit coordinator stands in for the MAP coordinator condition). The rulings stand for Sheet 116 cards 1 to 3, the same cards at the same positions; its card 4 is unanswered.",
  "detail": "S450 recorded cards 2 and 3 in the implementation-funding lane and handed card 1 to S455, the harvest queue's writer that morning. S450's live read at write time (12:5xZ): of the card's 25 rows, 16 still carried an older build and were extracted before the 10:31Z display apply (10 page-claimed with no filed record, 6 filed records placing none); Sierra 11965 and 21557 had been re-extracted by S455's run 39951768339 (alive); the card's other 7 Sierra rows were re-filed; Victor Valley 20545 sat on the latest build with a filed record (the card names it: remove, folder record too); 38852 was no longer in the table. Five rows of the same kind had appeared since the card (Hartnell 21450, 31592; Long Beach City 43802, 46290; Palo Verde 04436): never asked, so a card on the next sheet, since deleting data holds for his reply.",
  "plain": "Sam ruled on Sheet 115: remove the stale older-build program records with a receipt, and keep Scenario 4's noncredit gate and the standalone institutions' condition list as built.",
  "tags": [
   "decision-sheets",
   "implementation-funding",
   "program-requirements-harvest",
   "scenario-4",
   "noncredit"
  ],
  "source": "Open Asks Sheet 115 replies store (by sam, 12:23:39Z, 12:24:58Z, 12:26:38Z; done 12:26:43Z through 3), read by S450 through ArtifactData 2026-10-23 12:27Z",
  "status": "verified",
  "verified_by": "Sam Lee"
 }
]$json$) as x(slug text, kind text, event_date text, title text, summary text, detail text, plain text, tags text[], source text, status text, verified_by text)
on conflict (slug) do nothing;
