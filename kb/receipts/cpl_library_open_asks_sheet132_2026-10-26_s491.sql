-- S491 (SkySalmonberry), 2026-10-26. Open Asks Sheet 132 (https://claude.ai/artifact/84gYwWMaFVYKGo461YLLnT, three cards:
-- a cpl-chat deploy with Suggest wording, the naming rule into Sierra's built-in instructions, and four corrections to
-- switched-on instructions made on the recommendation) joins the series record open-asks-sheets.
-- Rule 10: one guarded UPDATE from the values read live at 17:35Z: version 131, updated_by S490 SkyGooseberry,
-- versions[0] Sheet 131 Current (50 entries).
-- rows_updated = 0 means someone edited the row since: re-read and retry.
-- ROLLBACK: update public.cpl_library set version = '131', url = 'https://claude.ai/artifact/6SM1HwKbvPWLt5534vhcyV',
--   made_by = 'Each sheet by the session that built it: sheets 46 to 131 by S341 SkyTerrace through S490 SkyGooseberry, sheet 49 by the library side session',
--   updated_by = 'S490 SkyGooseberry',
--   versions = jsonb_set(versions - 0, '{0,status}', '"Current"') where slug = 'open-asks-sheets';
-- A good result is version 132 with 51 versions.
update public.cpl_library l
set version = '132',
    url = 'https://claude.ai/artifact/84gYwWMaFVYKGo461YLLnT',
    made_by = 'Each sheet by the session that built it: sheets 46 to 132 by S341 SkyTerrace through S491 SkySalmonberry, sheet 49 by the library side session',
    versions = '[{"url":"https://claude.ai/artifact/84gYwWMaFVYKGo461YLLnT","date":"2026-10-26","label":"Sheet 132","status":"Current"}]'::jsonb
               || jsonb_set(l.versions, '{0,status}', '"Earlier"'),
    updated_by = 'S491 SkySalmonberry'
where l.slug = 'open-asks-sheets'
  and l.version = '131'
  and l.updated_by = 'S490 SkyGooseberry'
returning l.slug, l.version, jsonb_array_length(l.versions) as versions;

-- And three cpl_memory rows (Rule 8 ingest), INSERT-only under author/actor sierra-s491-wording-2026-10-26.
-- ROLLBACK: delete from public.cpl_memory_log where actor = 'sierra-s491-wording-2026-10-26';
--           delete from public.cpl_memory where author = 'sierra-s491-wording-2026-10-26';
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, '2026-10-26'::date, 'sierra-s491-wording-2026-10-26', x.related
from jsonb_to_recordset($json$[
 {
  "slug": "sierra-wording-check-built-2026-10-26",
  "kind": "milestone",
  "title": "Check wording is built: the Sierra Training tab reads a draft instruction by rule as it is typed (cpl-project-tracker#2474)",
  "summary": "Built by S491 at Sam's ask of ~15:40Z (S490): sierra_wording_check.js, under the Sierra Training tab's new-instruction box and editor, flags a bad or misspelled link, an open quotation, a cut-off sentence, a website Sierra is told to open, an internal tool named, a repeated sentence, and which instruction would stop reaching Sierra. Reports only; Save stays the curator's.",
  "detail": "Mock: https://claude.ai/artifact/KTxz6o8byt2oioPZof73HZ. tests/sierra_wording_check.test.js lifts cpl-chat's guidanceBlock() and pins RULE_MAX 1,500, TOTAL_MAX 9,000 and SENT_CAP 20 to the function and the tab. Suggest wording (the model half) waits on Open Asks Sheet 132 card 1.",
  "plain": "The Sierra Training tab now flags problems in an instruction before it is saved.",
  "tags": [
   "sierra",
   "guidance",
   "sierra-training"
  ],
  "status": "proposed",
  "source": "S491, 2026-10-26",
  "verified_by": null,
  "related": [
   "sam-sierra-instruction-wording-help-ask-2026-10-26"
  ]
 },
 {
  "slug": "pitfall-guidance-budget-drops-naming-rule-2026-10-26",
  "kind": "pitfall",
  "title": "Sierra's instruction set is nearly full, and the next long instruction silently drops the naming rule",
  "summary": "Measured S491, 2026-10-26: cpl-chat adds switched-on instructions newest first and stops at the first that does not fit 9,000 characters. On My College the set reads 8,693, and the oldest is the naming rule (cb226a48), which nothing else in cpl-chat carries. A new instruction over about 300 characters drops it there with no message; the tab's meter never named what would go.",
  "detail": "The wording check now names the instruction that would stop. Open Asks Sheet 132 card 2 asks to move the naming rule into Sierra's built-in instructions in the Suggest wording deploy. A break, not a skip: one long instruction in the middle also drops every shorter one after it. Before S491's four corrections the set read 8,653 on My College and 7,300 elsewhere.",
  "plain": "Adding one more long instruction to Sierra would quietly stop her following the naming rule on My College.",
  "tags": [
   "sierra",
   "guidance",
   "naming"
  ],
  "status": "proposed",
  "source": "S491, measured against sierra_guidance at 17:20Z and cpl-chat index.ts",
  "verified_by": null,
  "related": [
   "sierra-wording-check-built-2026-10-26"
  ]
 },
 {
  "slug": "sierra-four-instructions-corrected-2026-10-26",
  "kind": "fact",
  "title": "Four switched-on Sierra instructions corrected on the recommendation: a link that led nowhere, two open quotations, a sentence cut at the old 500 limit, a website she cannot open",
  "summary": "S491, 2026-10-26, found by the new wording check and fixed with the smallest change each: 858c6c87 linked crediforbeingyou.org; 98258907's example quotation never closed; f57638f9 (2026-08-12) stopped mid-sentence at exactly 500 characters; 6b5ae5d9 told Sierra to scan map.rccd.edu. Applied by supabase-migrate run 40366680106 and read back. Sheet 132 card 3: reply to reverse.",
  "detail": "Receipt kb/receipts/sierra_guidance_wording_fixes_2026-10-26_s491.sql holds every original word. Whatever f57638f9 said past 500 characters was lost when it was saved; only the team knows it.",
  "plain": "Four of Sierra's instructions had typos or missing words that changed her answers; they are fixed.",
  "tags": [
   "sierra",
   "guidance",
   "sierra-training"
  ],
  "status": "proposed",
  "source": "S491, 2026-10-26",
  "verified_by": null,
  "related": [
   "sierra-wording-check-built-2026-10-26"
  ]
 }
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'sierra-s491-wording-2026-10-26', 'create', 'S491: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'sierra-s491-wording-2026-10-26'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'sierra-s491-wording-2026-10-26');
