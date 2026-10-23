-- S459 SkyBuckeye, 2026-10-23: the ELL IET CPL Starting Points page gets its Library record (CPLBrain/CLAUDE.md: a Claude
-- artifact made to share gets a record, Sam 2026-10-20), and Rule 8 ingest of the agency template's existence.
-- Sam's calls: Open Asks Sheet 120 card 5 (template, ~20:02Z) and Sheet 121 card 3 (text, 21:27Z), both his own.
-- INSERT-only, idempotent on slug, cohort library-s459@bot. Seen by the team until Sam lists it (anything outward is his).
-- APPLIED: run 40037603941, 2026-10-23 (kb/receipts/migration_cpl_library_ell_iet_starting_points_2026_10_23_s459_40037603941.json); read back:
--   visual, agency, EDD ELL IET Fund grantees, seen by team, draft.
-- Rollback: delete from public.cpl_library where slug = 'ell-iet-cpl-starting-points' and added_by = 'library-s459@bot';
--           delete the memory log row (actor library-s459-2026-10-23), then the memory row by slug.
insert into public.cpl_library (slug, title, kind, occasion, made_on, version, summary, extent, file_type,
  status, seen_by, home, url, file_name, made_by, rebuild_from, note, versions, added_by, for_kind, for_name)
values ('ell-iet-cpl-starting-points', 'ELL IET CPL Starting Points', 'visual',
  'Prepare to meet with grant recipients on CPL', '2026-10-23', '1',
  'A card per ELL IET Fund project (EDD, PY 2022-23: eight grantees, $17.97 million), ordered by fit: where a project''s completers could already turn their training into community college credit, read from the MAP platform and COCI.',
  'One page', 'html', 'draft', 'team', 'web', 'https://claude.ai/artifact/WnEFhH4yuoSdx6mCnoqRpe',
  '20261023_ELL_IET_CPL_Starting_Points.html', 'S459 SkyBuckeye, 2026-10-23',
  'CPLBrain/04-projects/cpl-initiative/ell-iet/make_brief.py, then CPLBrain/04-projects/cpl-initiative/agency-visual/build.py on briefs/20261023_ELL_IET_CPL_Starting_Points.json',
  'The first instance of the agency template. Sources: EDD''s award notice (filed beside the page), MAP''s adoption view, the COCI program inventory (June 17, 2026 export) and each college''s county, read 2026-10-23. Delivery mode is not in our data, so every match reads to confirm.',
  '[{"url":"https://claude.ai/artifact/WnEFhH4yuoSdx6mCnoqRpe","date":"2026-10-23","label":"Version 1","status":"Current"}]'::jsonb,
  'library-s459@bot', 'agency', 'EDD ELL IET Fund grantees')
on conflict (slug) do nothing;

insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       now(), '2026-10-23'::date, 'library-s459-2026-10-23', x.related
from jsonb_to_recordset($json$[
 {"slug":"agency-visual-template-built-2026-10-23","kind":"milestone",
  "title":"The agency visual has a builder (CPLBrain agency-visual/build.py, the DSP page's shape from a JSON brief); ELL IET CPL Starting Points is its first instance",
  "summary":"Sam's Sheet 120 card 5 (template), built by S459 on 2026-10-23: build.py paints a JSON brief (the meeting, the training facts, colleges tiered by fit, what to confirm, next steps, sources) with First Light, both themes and the public header. First instance: ELL IET CPL Starting Points, every count computed from the notice, MAP and COCI.",
  "detail":"CPLBrain/04-projects/cpl-initiative/agency-visual/build.py renders BRIEF.json (schema in its README) and applies the public header from ../public-header at build time. The ELL IET instance (https://claude.ai/artifact/WnEFhH4yuoSdx6mCnoqRpe; Library record ell-iet-cpl-starting-points, kind visual, Made for Agency, For EDD ELL IET Fund grantees) comes from ell-iet/make_brief.py: the eight projects as EDD's award notice states them, the MAP adoption view (adopters and potential adopters per unified title), COCI's active programs (MIS short names mapped to MAP names) and each college's county. Read 2026-10-23: four projects have credit articulated in their own counties or at a partner college (Fresno Area WIC, Get Focused Stay Focused, Corona-Norco USD, ECEPTS); two have the program nearby with no articulation (North Central Counties Consortium, Mountain View Los Altos Adult School); Fairfield-Suisun's CMA has its precedent at Modesto Junior College; WERC's workplace English is not credential-shaped; home health aide has no exhibit in MAP. The Library tab's Make a visual paste names the builder.",
  "plain":"When the CPL Initiative needs a one-page visual for an agency before a meeting, a script now builds it from a short brief in the same shape every time; the ELL IET page is the first one.",
  "tags":["library","artifacts","agency-visual","ell-iet"],"status":"proposed",
  "source":"cpl-project-tracker: this receipt's PR; CPLBrain/04-projects/cpl-initiative/agency-visual/README.md","verified_by":null,
  "related":["sam-sheet-120-rulings-2026-10-23","sam-sheet-121-rulings-2026-10-23","sam-claude-artifacts-go-in-library-2026-10-20"]}
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;

-- Log, as its own statement (a CTE log insert sees nothing; playbook step 6).
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'library-s459-2026-10-23', 'create', 'The agency visual builder and the ELL IET page', to_jsonb(m)
from public.cpl_memory m
where m.slug = 'agency-visual-template-built-2026-10-23' and m.author = 'library-s459-2026-10-23';

select slug, kind, for_kind, for_name, seen_by, status from public.cpl_library where slug = 'ell-iet-cpl-starting-points';
