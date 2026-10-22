-- Bakersfield side session (session_01T5QwZ9pwxbHeZGwpabCDe8), 2026-10-22: Rule 8 ingest of two measured facts.
-- INSERT-only, idempotent on slug. Rollback: delete the two log rows (actor cpl-opportunity-side-2026-10-22), then the rows by slug.
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       now(), '2026-10-22'::date, 'cpl-opportunity-side-2026-10-22', x.related
from jsonb_to_recordset($json$[
 {"slug":"map-landing-api-pages-at-ten-2026-10-21","kind":"finding",
  "title":"MAP's landing-page API returns 10 courses unless asked for more, and carries military CPL its export lacks",
  "summary":"MAP's api/cpl-courses?college=<id> returns 10 courses per page (metadata.total, hasMore) unless &limit= is given; read in full, college landing pages show military articulations absent from MAP's articulation export that COBI reads: Bakersfield 2,310 on 60 courses, Norco 354, San Bernardino Valley 294, Riverside City 205, Moreno Valley 152.",
  "detail":"Found 2026-10-21 building Norco's CPL opportunity workbook: every college had returned exactly 10 courses. With &limit=1000 the totals were 255 (Norco), 173 (Moreno Valley), 130 (Bakersfield), 41 (Cerritos, Foothill). The vault scripts under CPLBrain/04-projects/cpl-initiative/*-cpl-analysis/ read it in full and add landing-only lines to Tab 3. The live cpl-opportunity page reads only statewide_data.js; Sam ruled to build a nightly landing snapshot for it (CPL Opportunity Asks card 2, 2026-10-21).",
  "plain":"MAP's public college page shows more credit, mostly military, than the data COBI reads, and its feed only sends ten courses at a time unless you ask for all of them.",
  "tags":["my-college","cpl-opportunity","map","military"],"status":"verified",
  "source":"Measured by the side session, 2026-10-21","verified_by":"measurement",
  "related":["cpl-opportunity-analysis-any-college-2026-10-20"]},
 {"slug":"map-no-card-link-copy-id-2026-10-21","kind":"decision",
  "title":"Could Adopt copies the exhibit ID; Sam asked Malone for a search link",
  "summary":"Because MAP keeps its CPL Opportunities search in page state and Quick Adopt needs a signed-in MAP session, COBI's Could Adopt button copies the exhibit ID as it opens MAP (tracker #2318); Sam sent Malone the request to honor /insights/exhibit-courses?search=<ID> on 2026-10-21.",
  "detail":"Sam and Ashley, 2026-10-21, before Crystal's 2 p.m. college workgroup: \"Any way you can navigate to the exact card by entering the MAP ID in the search bar so it goes directly to the card?\" MAP's bundle read the same day: no URL search parameter; Quick Adopt posts to /api/auth/one-time-session with the user's bearer token, then opens modules/popups/CreditRecommendations.aspx. Sam: \"sent the note to Malone\". When MAP ships ?search=, point the link at the card.",
  "plain":"The MAP button copies the ID so you can paste it into MAP's search; a direct link waits on a small change from MAP's developers.",
  "tags":["my-college","cpl-opportunity","map"],"status":"verified",
  "source":"Sam and Ashley in chat, 2026-10-21","verified_by":"Sam",
  "related":["map-no-deep-link-to-one-exhibit-card-2026-10-20"]}
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'cpl-opportunity-side-2026-10-22', 'create', 'Rule 8 ingest: MAP landing API and the copy-ID link', to_jsonb(m)
from public.cpl_memory m
where m.author = 'cpl-opportunity-side-2026-10-22'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
