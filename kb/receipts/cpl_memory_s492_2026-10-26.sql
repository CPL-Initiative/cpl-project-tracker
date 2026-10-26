-- S492 (SkyCloudberry), 2026-10-26: Rule 8 ingest at the checkpoint. INSERT-only under author/actor
-- memory-s492-checkpoint-2026-10-26. ROLLBACK: delete from public.cpl_memory_log where actor = 'memory-s492-checkpoint-2026-10-26';
--   delete from public.cpl_memory where author = 'memory-s492-checkpoint-2026-10-26';
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, '2026-10-26'::date, 'memory-s492-checkpoint-2026-10-26', x.related
from jsonb_to_recordset($json$[
 {
  "slug": "sam-funding-public-header-asks-2026-10-26",
  "kind": "decision",
  "title": "Sam's public funding page asks: one Resource Links drop-down, the controls in the header, Edit off the public view, the Sierra chip, the Library off",
  "summary": "Sam, 2026-10-26 ~19:45Z (S492), on a screenshot: all header links in one Resource Links drop-down; Collapse all furthest right, PDF just left of it; the row under the title moves to the header; hide or delete Edit from the public view; the Ask Sierra chip lower right in the resizable side bar. Then: take the Public Library link off the funding page for now. Built in #2478.",
  "detail": "His Library words: \"we'll just use it with our meetings with colleges and agencies since it limited curated content.\" Edit stays inside COBI's Public page view, which frames the page (edit_page.js: window.self !== window.top).",
  "plain": "Sam reorganized the public funding page's header and kept the Library link for meetings only.",
  "tags": [
   "implementation-funding",
   "public-page",
   "library"
  ],
  "status": "verified",
  "source": "Sam, in session S492, 2026-10-26",
  "verified_by": "Sam",
  "related": []
 },
 {
  "slug": "sam-summit-accessibility-ask-2026-10-26",
  "kind": "decision",
  "title": "Sam: the public funding page and every view it links to fully accessible and mobile friendly before the 7th Annual CPL Summit (Fri 2026-10-30)",
  "summary": "Sam, 2026-10-26 (S492): \"I need the public funding page and all views linked to it to be fully accessible according to the latest state and federal standards and mobile friendly\"; \"We're making all this public at our 7th Annual CPL Summit this Friday!\" S492 took WCAG 2.2 AA as the target and shipped #2478, #2479, #2482.",
  "detail": "WCAG 2.2 AA contains the 2.1 AA the DOJ ADA Title II rule names and the 2.0 AA Section 508 adopts. Open: WCAG 1.2.5 audio description of the funding film (Open Asks Sheet 133 card 1).",
  "plain": "Sam set the funding page and its links to meet accessibility standards before Friday's CPL Summit.",
  "tags": [
   "implementation-funding",
   "accessibility",
   "public-page"
  ],
  "status": "verified",
  "source": "Sam, in session S492, 2026-10-26",
  "verified_by": "Sam",
  "related": [
   "methodology-geometry-half-a11y-audit-2026-10-26"
  ]
 },
 {
  "slug": "methodology-geometry-half-a11y-audit-2026-10-26",
  "kind": "procedure",
  "title": "npm run a11y measures paint, not the accessibility tree: run axe beside it before calling a public view accessible",
  "summary": "Measured S492, 2026-10-26: npm run a11y passed eight public views; axe-core 4.10.2 found a film page with no lang, 21 Fact Sheet links told apart by color alone, 16 headings coded role=button, two regions sharing one name. The runner measures contrast, targets, overflow and focus; axe measures names, roles, language and landmarks. KB note methodology-geometry-is-half-an-accessibility-audit.",
  "detail": "Next: fold axe into scripts/a11y.js. A music-only film needs a transcript (1.2.1/1.2.3) and, at AA, audio description (1.2.5).",
  "plain": "The repo's accessibility check misses a class of problems another free tool catches; use both.",
  "tags": [
   "accessibility",
   "methodology",
   "a11y"
  ],
  "status": "proposed",
  "source": "cpl-project-tracker#2479, #2482 (S492)",
  "verified_by": null,
  "related": []
 },
 {
  "slug": "naming-rule-builtin-proven-2026-10-26",
  "kind": "milestone",
  "title": "The naming rule lives in Sierra's built-in instructions alone; row cb226a48 is off and 7z passes without it",
  "summary": "S492, 2026-10-26: sierra_guidance cb226a48 switched off through supabase-migrate run 40394964778 (read back inactive; #2480). The smoke after it (run 40396104138) passed 7y and 7z: Sierra expands MAP as Mapping Articulated Pathways from NAMING_RULE alone. Two earlier runs failed (a 502; the 300-character note check).",
  "detail": "The same smoke failed 7q once: Sierra wrote 'an inactive COCI record'. 7q passed in run 373 and #2476's branch smoke, so it reads as a slip.",
  "plain": "Sierra's naming rule is now built into her and no longer uses space in the team's instruction list.",
  "tags": [
   "sierra",
   "guidance"
  ],
  "status": "proposed",
  "source": "cpl-project-tracker#2480 (S492)",
  "verified_by": null,
  "related": [
   "sam-sheet-132-rulings-2026-10-26"
  ]
 },
 {
  "slug": "pitfall-apply-reset-reads-main-fresh-2026-10-26",
  "kind": "pitfall",
  "title": "Set .apply back to main's value only from a fresh fetch, and never pipe check_generated.sh",
  "summary": "S492, 2026-10-26: copying .apply from a stale origin/main made the migrate gate see a difference from the new main, so the apply job ran an old trigger (it refused, no harm). Separately, piping scripts/check_generated.sh through grep or tail returns the pipe's 0, and a stale dependency map rode a push. Fetch main first; write the check to a file and test its exit.",
  "detail": "A runner's receipt commit starts no CI, so a real commit is needed before merge; the .apply reset is a natural one when it reads main fresh.",
  "plain": "Two small git habits that keep the automated database runner and file checks honest.",
  "tags": [
   "supabase-migrate",
   "ci",
   "pitfall"
  ],
  "status": "proposed",
  "source": "S492 session, 2026-10-26",
  "verified_by": null,
  "related": []
 },
 {
  "slug": "sam-sheet-133-rulings-2026-10-26",
  "kind": "decision",
  "title": "Sam's Sheet 133 replies: keep Step 1's words; find the narration the funding film already had",
  "summary": "Sam, Open Asks Sheet 133, 21:24Z 2026-10-26, both his own call: card 2 keep (Step 1 prints the chosen view's description). Card 1 no verdict, his note: \"We had a narration for this already. Can you search for it?\" S492 found Sierra's 2026-10-02 read (voice_s2/, 11 clips): 7 scenes hold for Scenario 4, scenes 5 to 8 redrafted in the sheet's thread.",
  "detail": "The four drafts carry the credit funding and the two noncredit outcomes, about 3,600 FTES per priority, the average Access target about 31 FTES, December 31 and the Noncredit CPL Lead. Re-reading waits on his go in the thread.",
  "plain": "Sam kept the Step 1 change and pointed to the funding film's earlier narration, which can be mostly reused.",
  "tags": [
   "implementation-funding",
   "decision-sheet",
   "funding-film"
  ],
  "status": "verified",
  "source": "Sam, Open Asks Sheet 133 replies",
  "verified_by": "Sam",
  "related": [
   "sam-summit-accessibility-ask-2026-10-26"
  ]
 }
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'memory-s492-checkpoint-2026-10-26', 'create', 'S492: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'memory-s492-checkpoint-2026-10-26'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'memory-s492-checkpoint-2026-10-26');
select slug, status from public.cpl_memory where author = 'memory-s492-checkpoint-2026-10-26' order by slug;
-- The Library's series record moves to Open Asks Sheet 133 (one guarded UPDATE, read live at 21:40Z).
-- BEFORE: url https://claude.ai/artifact/84gYwWMaFVYKGo461YLLnT, version '132', updated_at 2026-10-26 17:34:27.88918+00.
-- ROLLBACK: update public.cpl_library set url = 'https://claude.ai/artifact/84gYwWMaFVYKGo461YLLnT', version = '132'
--   where slug = 'open-asks-sheets';
update public.cpl_library
set url = 'https://claude.ai/artifact/Vzy2jpwwBJsJoZ2Y3fv199', version = '133'
where slug = 'open-asks-sheets' and version = '132' and url = 'https://claude.ai/artifact/84gYwWMaFVYKGo461YLLnT';
select slug, version, url from public.cpl_library where slug = 'open-asks-sheets';
