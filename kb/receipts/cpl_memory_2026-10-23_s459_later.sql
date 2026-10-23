-- S459 SkyBuckeye, 2026-10-23, the later checkpoint: Rule 8 ingest of this run's durable learnings. INSERT-only,
-- idempotent on slug, author s459-skybuckeye-later. Rollback: delete the log rows (actor s459-skybuckeye-later), then the rows by slug.
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by, now(), '2026-10-23'::date, 's459-skybuckeye-later', x.related
from jsonb_to_recordset($json$[
 {"slug":"kb-tab-folded-into-library-2026-10-23","kind":"milestone",
  "title":"The Knowledge Base tab folded into the Library as its second view, with the knowledge rule (knowledge, kb_note) and a Needs attention count (Sam's Sheet 121 card 1)",
  "summary":"Built by S459 on 2026-10-23 under Sam's fold-rule ruling (21:27Z): the side menu loses Knowledge Base; the portal frame sits inside the Library pane, shown by a Pieces / Knowledge Base view control, its own magic-link sign-in untouched; #knowledge-base links route to #library/knowledge-base. cpl_library gains knowledge and kb_note; Needs attention counts knowledge pieces with no KB note.",
  "detail":"cpl-project-tracker#2397 (the fold, the schema apply cpl_library_knowledge_2026_10_23_s459 through supabase-migrate.yml). The frame is static markup beside #library-root (never repainted, so the sign-in holds); library.js toggles it; tabs.js FOLDED maps the old hash. A typed KB note says knowledge on its own (cpl_library_kb_note_ck). The note itself still reaches the public KB only through CURATION.md; the Library links it. Tests: library.test.js block 12, kb_portal_tab.test.js rewritten.",
  "plain":"The team has one tab fewer: the Knowledge Base reader now lives inside the Library, and a Library piece that carries knowledge says which KB note holds it, or shows up as needing one.",
  "tags":["library","knowledge-base","cobi-tabs"],"status":"proposed","source":"cpl-project-tracker#2397; docs/reference/lanes/library.md","verified_by":null,
  "related":["sam-sheet-121-rulings-2026-10-23","sam-kb-tab-and-library-consolidation-2026-10-23"]},
 {"slug":"coci-program-export-names-colleges-in-mis-short-caps-2026-10-23","kind":"pitfall",
  "title":"COCI's program export names colleges in MIS short form, in capitals; a join to MAP's names finds nothing until the names are mapped",
  "summary":"coci_programs_data.js carries CANYONS, EAST L.A., SAN FRANCISCO CTRS, COALINGA COLLEGE and the like; the first match against MAP's college names found 0 of 121 (S459, the ELL IET brief). A hand map for about thirty irregular names plus a normalized compare (drop Community and Junior) maps every college but Calbright and the CCCCO row.",
  "detail":"CPLBrain/04-projects/cpl-initiative/ell-iet/make_brief.py COCI_NAMES and coci_to_map(). Any script joining COCI programs to MAP colleges by name needs the same map; the college identity crosswalk (kb/_build_college_identity_crosswalk.py) is the longer-term home.",
  "plain":"Two of our data sources spell college names differently, so a program count by college reads as zero until the spellings are matched.",
  "tags":["coci","college-identity","data-join"],"status":"proposed","source":"CPLBrain/04-projects/cpl-initiative/ell-iet/make_brief.py; docs/library_lessons.md S459 later","verified_by":null,"related":[]},
 {"slug":"push-without-check-generated-turns-lints-red-2026-10-23","kind":"pitfall",
  "title":"A new receipt file is a dependency-map consumer: a branch pushed without scripts/check_generated.sh turned lints red (S459, #2396)",
  "summary":"#2396 added a receipt SQL and the lints check read the dependency map as stale; the branch had been pushed after the Library test alone. CLAUDE.md's rule stands: git add, then bash scripts/check_generated.sh, is the last thing before every push, on every branch, however small the diff.",
  "detail":"The map regenerated (python3 kb/_build_dependency_map.py) and pushed as its own commit; lints and test passed on the next head. The fold branch, which ran the check, needed no fix.",
  "plain":"A small push skipped the one check that catches generated files going stale, and the build went red until the file was regenerated.",
  "tags":["ci","generated-files","pitfall"],"status":"proposed","source":"cpl-project-tracker#2396, run 40037654463","verified_by":null,"related":[]}
]$json$::jsonb) as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text, source text, verified_by text, related text[])
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 's459-skybuckeye-later', 'create', 'S459 later checkpoint ingest', to_jsonb(m)
from public.cpl_memory m where m.author = 's459-skybuckeye-later'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.actor = 's459-skybuckeye-later');

select slug, status from public.cpl_memory where author = 's459-skybuckeye-later' order by slug;
