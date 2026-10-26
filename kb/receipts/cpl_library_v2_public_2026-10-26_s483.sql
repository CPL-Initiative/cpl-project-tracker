-- S483 (SkyCoyoteMint), 2026-10-26. Sam answered Open Asks Sheet 129 at 03:53Z (replies/done through 3, each his own
-- call): 1 proposed (the funding memo's opening; his paste on the tab), 2 replace (ELL IET Version 2 becomes the public
-- copy), 3 replace (DSP Credit Starting Points Version 2 becomes the public copy).
-- (1) The Pages copies library/ell-iet-cpl-starting-points/ and library/dsp-credit-starting-points/ were rewritten from
--     the v2 pages by scripts/library_page.py in the same PR; the records' url (the Pages address) does not change.
--     Each record moves to version 2: Version 2 Current, Version 1 "Replaced by v2".
-- (2) Rule 8 ingest: Sam's three rulings, verified by Sam.
-- Rule 10: two guarded UPDATEs from the before-values read live at ~03:54Z 2026-10-26:
--   dsp-credit-starting-points: version 1, updated_by library-s483@bot, updated_at 2026-10-26 03:23:08.402473+00,
--     versions [V1 Current P4R8jJ84xdnLGhdmDhQ3xE 2026-10-20, V2 Draft for review K2h4XZQ9oRb2AXbPSJYbPa 2026-10-26].
--   ell-iet-cpl-starting-points: version 1, updated_by library-s482@bot, updated_at 2026-10-26 01:59:08.801027+00,
--     versions [V1 Current WnEFhH4yuoSdx6mCnoqRpe 2026-10-23, V2 Draft for review Skw4HTtnQUPkQBUYYGFwtw 2026-10-26].
-- rows_updated = 0 for either means someone edited the row since: re-read and retry.
-- ROLLBACK (cpl_library_history_trg files the prior row either way; then git revert the Pages copies):
--   update public.cpl_library set version = '1', updated_by = 'library-s483@bot',
--     versions = '[{"url":"https://claude.ai/artifact/P4R8jJ84xdnLGhdmDhQ3xE","date":"2026-10-20","label":"Version 1","status":"Current"},{"url":"https://claude.ai/artifact/K2h4XZQ9oRb2AXbPSJYbPa","date":"2026-10-26","label":"Version 2","status":"Draft for review"}]'::jsonb
--   where slug = 'dsp-credit-starting-points';
--   update public.cpl_library set version = '1', updated_by = 'library-s482@bot',
--     versions = '[{"url":"https://claude.ai/artifact/WnEFhH4yuoSdx6mCnoqRpe","date":"2026-10-23","label":"Version 1","status":"Current"},{"url":"https://claude.ai/artifact/Skw4HTtnQUPkQBUYYGFwtw","date":"2026-10-26","label":"Version 2","status":"Draft for review"}]'::jsonb
--   where slug = 'ell-iet-cpl-starting-points';
--   delete the memory log rows (actor library-s483-sheet129-2026-10-26), then the memory row by slug.
-- A good result is two rows at version 2.
update public.cpl_library l
set version = '2',
    versions = '[{"url":"https://claude.ai/artifact/P4R8jJ84xdnLGhdmDhQ3xE","date":"2026-10-20","label":"Version 1","status":"Replaced by v2"},{"url":"https://claude.ai/artifact/K2h4XZQ9oRb2AXbPSJYbPa","date":"2026-10-26","label":"Version 2","status":"Current"}]'::jsonb,
    updated_by = 'library-s483@bot'
where l.slug = 'dsp-credit-starting-points'
  and l.version = '1'
  and l.updated_at = '2026-10-26 03:23:08.402473+00'
returning l.slug, l.version;

update public.cpl_library l
set version = '2',
    versions = '[{"url":"https://claude.ai/artifact/WnEFhH4yuoSdx6mCnoqRpe","date":"2026-10-23","label":"Version 1","status":"Replaced by v2"},{"url":"https://claude.ai/artifact/Skw4HTtnQUPkQBUYYGFwtw","date":"2026-10-26","label":"Version 2","status":"Current"}]'::jsonb,
    updated_by = 'library-s483@bot'
where l.slug = 'ell-iet-cpl-starting-points'
  and l.version = '1'
  and l.updated_at = '2026-10-26 01:59:08.801027+00'
returning l.slug, l.version;

insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, '2026-10-26'::date, 'library-s483-sheet129-2026-10-26', x.related
from jsonb_to_recordset($json$[
 {"slug":"sam-sheet-129-rulings-2026-10-26","kind":"decision",
  "title":"Sam's Sheet 129 rulings: the proposed memo opening (his paste); ELL IET and DSP Version 2 become the public copies",
  "summary":"Sam, Open Asks Sheet 129, 03:53Z 2026-10-26, reviewed through 3, each his own call, no notes: card 1 proposed (he pastes the proposed opening as memo_lead on the funding tab); card 2 replace (ELL IET CPL Starting Points Version 2 is the public copy); card 3 replace (DSP Credit Starting Points Version 2 is the public copy).",
  "detail":"Carried out by S483 the same run: library/ell-iet-cpl-starting-points/ and library/dsp-credit-starting-points/ rewritten from the v2 pages (scripts/library_page.py), both records at version 2 (receipt kb/receipts/cpl_library_v2_public_2026-10-26_s483.sql). Card 1 is curator text: cpl_funding_config still read updated_at 01:23:35Z at 03:55Z, so the paste waits on Sam; the card's text is in CPLBrain decision-sheets/_build_open_asks_decision_sheet.py (MEMO_LEAD_PROPOSED_128).",
  "plain":"Sam approved both new starting-point pages for the public library and will paste the memo opening himself.",
  "tags":["library","decision-sheets","ell-iet","dsp","implementation-funding"],"status":"verified",
  "source":"Sam, Open Asks Sheet 129 replies store, 2026-10-26 03:53Z","verified_by":"Sam",
  "related":["dsp-credit-starting-points-v2-built-2026-10-26","sam-s482-frame-what-is-possible-2026-10-26"]}
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;

-- Log, as its own statement (a CTE log insert sees nothing; playbook step 6).
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'library-s483-sheet129-2026-10-26', 'create', 'S483: Sam''s Sheet 129 rulings', to_jsonb(m)
from public.cpl_memory m
where m.slug = 'sam-sheet-129-rulings-2026-10-26'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'library-s483-sheet129-2026-10-26');
