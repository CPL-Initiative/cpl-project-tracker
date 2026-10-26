-- S482 (SkyShootingStar), 2026-10-26: Rule 8 ingest at the checkpoint. Sam's film asks of this run, verbatim, and one
-- proposed pitfall (a passage the memo follows is the public page's text too).
-- INSERT-only, idempotent on slug; author library-s482-2026-10-26 (the cohort that filed the run's first row).
-- Rollback: delete the memory log rows (actor library-s482-2026-10-26) for these slugs, then the memory rows by slug.
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, '2026-10-26'::date, 'library-s482-2026-10-26', x.related
from jsonb_to_recordset($json$[
 {"slug":"sam-s482-film-asks-2026-10-26","kind":"decision",
  "title":"Sam's S482 film asks: a softer Summit greeting, \"for\" two outcomes, the NC Lead in the funding film, centered numbers, the DSP redo",
  "summary":"Sam, 2026-10-26 (S482): the Noncredit Summit film's greeting ends on a period (the second take, his pick) and its funding line says \"for two noncredit outcomes\"; yes to the Noncredit CPL Lead in the funding film's first minimum condition (v11); center the 1, 2, 3 in the condition discs; redo the DSP visual the way the ELL one was, next session.",
  "detail":"Verbatim: \"For the video script, take off the exclamation mark on the first line as well--so the voice comes in a bit softer on the intro.\" \"2nd voice render sounds good to me. Change the word 'restricted' to 'for'\" then \"'restricted to' to 'for'\". \"On questions: Yes, 2nd voice greeting; and yes to adding NC lead\". \"Can you center the 1,2,3 numbers in the blue circles?\" \"We can do this in the next session, but I'll want to redo the DSP visual in the Library the same way we're redoing the ELL one.\" Built: prototype/noncredit_video v3 (two scenes re-read, Sarah Explains), prototype/funding_video v11 (COORD_LINE_NC, lining figures lifted .21cqw), cpl-project-tracker#2457.",
  "plain":"Sam approved the film changes this session: a gentler opening line, the word for in the funding line, the Noncredit CPL Lead in the funding film, centered numbers, and a redo of the DSP visual next time.",
  "tags":["implementation-funding","funding-film","noncredit-summit-film","library"],"status":"verified",
  "source":"Sam in chat, S482, 2026-10-26","verified_by":"Sam",
  "related":["sam-s482-frame-what-is-possible-2026-10-26"]},
 {"slug":"pitfall-memo-lead-follows-overview-2026-10-26","kind":"pitfall",
  "title":"The funding memo's opening follows the explainer's Overview until saved, so an edit to one is an edit to both",
  "summary":"memo_lead follows x_lede until memo_lead is saved (cpl_funding.js MEMO_BLOCKS, follows). Sam's memo revision of 2026-10-26, typed into the Overview, reached the public funding page as \"This memorandum sets out …\" and doubled the memo's seed-grant and confirmation passages, which print again under their own headings.",
  "detail":"Found by S482 rendering the memo to Word (jsdom + docx.min.js + LibreOffice) from the live config. The fix is curator text: save the memo's own opening, restore the page's Overview. Open Asks Sheet 128 card 1 carries the proposed opening. Before calling a memo or Overview edit done, render both.",
  "plain":"Editing the funding page's overview also changes the start of the memo, and the reverse, until the memo is given its own opening.",
  "tags":["implementation-funding","memo"],"status":"proposed",
  "source":"S482 render, 2026-10-26","verified_by":null,
  "related":["sam-s482-film-asks-2026-10-26"]}
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;

-- Log, as its own statement (a CTE log insert sees nothing; playbook step 6).
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'library-s482-2026-10-26', 'create', 'S482 checkpoint: Sam''s film asks and the memo pitfall', to_jsonb(m)
from public.cpl_memory m
where m.slug in ('sam-s482-film-asks-2026-10-26', 'pitfall-memo-lead-follows-overview-2026-10-26')
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'library-s482-2026-10-26');
