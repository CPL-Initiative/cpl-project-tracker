-- S491 (SkySalmonberry), 2026-10-26: Rule 8 ingest at the checkpoint. INSERT-only under author/actor
-- memory-s491-checkpoint-2026-10-26. ROLLBACK: delete from public.cpl_memory_log where actor = 'memory-s491-checkpoint-2026-10-26';
--   delete from public.cpl_memory where author = 'memory-s491-checkpoint-2026-10-26';
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, '2026-10-26'::date, 'memory-s491-checkpoint-2026-10-26', x.related
from jsonb_to_recordset($json$[
 {"slug": "sam-sheet-132-rulings-2026-10-26", "kind": "decision",
  "title": "Sam's Sheet 132 rulings: build Suggest wording, move the naming rule into Sierra's built-in instructions, keep the four corrections",
  "summary": "Sam, Open Asks Sheet 132, 18:13Z 2026-10-26, each his own call, no notes: 1 build (Suggest wording, the guidance-wording drafting caller in cpl-chat), 2 move (NAMING_RULE in cpl-chat's stable prompt, row cb226a48 switched off after the deploy), 3 keep (S491's four corrections to switched-on instructions stand).",
  "detail": "Built in cpl-project-tracker#2475, deployed 19:08Z (cpl-chat-deploy run 40383727809). The switch-off receipt is kb/receipts/sierra_guidance_naming_rule_builtin_2026-10-26_s491.sql, applied only after the smoke passes.",
  "plain": "Sam approved the wording helper for Sierra's instructions and moved the naming rule into Sierra herself.",
  "tags": ["sierra", "guidance", "decision-sheet"], "status": "verified", "source": "Sam, Open Asks Sheet 132 replies", "verified_by": "Sam",
  "related": ["sierra-wording-check-built-2026-10-26", "pitfall-guidance-budget-drops-naming-rule-2026-10-26"]},
 {"slug": "sam-funding-nc-attestation-form-asks-2026-10-26", "kind": "decision",
  "title": "Sam's funding-tab asks: the noncredit attestation in his words, the Lead's type, assignment and meetings, aligned conditions, (CR) credit rows",
  "summary": "Sam, 2026-10-26 ~19:00Z (S491), from two screenshots: college name in regular type; intro \"Complete the items below to qualify for noncredit CPL funding.\"; drop the optional count, course and exhibits; add the Lead's employee type (Staff, FT Faculty, PT Faculty, Administrator), the assignment, how often the Lead meets credit CPL colleagues; align the conditions; credit rows like the NC ones.",
  "detail": "His note: \"The CPL Coordinator and Noncredit CPL Lead may be the same person.\" His example credit label: \"Priority 1 (CR) Total Applied (articulated) credit\". Built as draft cpl-project-tracker#2476; tests and the three-column migration remain before merge.",
  "plain": "Sam reworded the noncredit attestation form on the funding tab and asked for clearer priority labels.",
  "tags": ["implementation-funding", "noncredit", "attestation"], "status": "verified", "source": "Sam, in session S491, 2026-10-26", "verified_by": "Sam",
  "related": []}
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'memory-s491-checkpoint-2026-10-26', 'create', 'S491: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'memory-s491-checkpoint-2026-10-26'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'memory-s491-checkpoint-2026-10-26');
