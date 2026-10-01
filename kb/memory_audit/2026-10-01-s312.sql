-- S312 (SkyLantern) memory receipt, 2026-10-01. Idempotent (not-exists guards).
-- Rolls back by author: delete from cpl_memory where author = 'SkyLantern-s312'
-- (and the matching cpl_memory_log rows by actor).
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, source, related, status, author, event_date)
select x.slug, x.kind, 'cpl', x.title, x.summary, x.detail, x.plain, x.tags, x.source, '{}'::text[], x.status, 'SkyLantern-s312', date '2026-10-01'
from jsonb_to_recordset($json$[
{"slug":"sam-explainer-fact-sheet-layout-2026-10-01","kind":"decision","status":"verified",
 "title":"Sam: the funding explainer takes the Fact Sheet's layout, and shows the average",
 "summary":"Sam, 2026-10-01 (S312): \"revise the Explainer funding view based on how the CPL Fact Sheet is formatted and organized--each section should have a link at the top that take the user to the clicked section and opens it\", plus Ask Sierra; \"this will likely be the main view for the colleges\"; projects and staff in one box; \"Use the average funding rather than typical\".",
 "detail":"Built in S312: a sticky action bar, a Contents card that opens each section's fold, every section a fold, Ask Sierra (the Fact Sheet's drawer), the tab's FAQ, one statewide box ($9,759,692), the Average box with $198,542 credit and $15,359 noncredit. The 90-second introductions show the average allocation in place of Sample College; the narrated drafts keep it until their scripts change. Whether colleges also get the Public view is sheet 14 card 6.",
 "plain":"Sam asked for the funding explainer page to work like the CPL Fact Sheet: a list of sections at the top that jumps to each one and opens it, an Ask Sierra button, and the average award shown instead of the middle one. He expects colleges to use this page most.",
 "tags":["implementation-funding","explainer","funding-video","decision"],"source":"Sam, chat, 2026-10-01 (S312 greeting)"},
{"slug":"explainer-root-token-reaches-embedded-table-2026-10-01","kind":"pitfall","status":"proposed",
 "title":"A token on the explainer's :root reaches the embedded table",
 "summary":"Defining --seal-blue on the funding explainer's :root painted the embedded table's header navy behind body-colored text, 1.13:1: cpl_funding.js reads --seal-blue, --on-accent and --surface with fallbacks the page relied on. Scope page tokens to the page's own chrome. npm run a11y caught it (S312).",
 "detail":"The mirror of explainer-defines-only-its-own-tokens-2026-09-29: a token the tab reads but the page lacks paints nothing; a token the page adds switches on a tab rule built for COBI's palette. Before adding a :root token to the explainer, grep cpl_funding.js and college_briefing.js for var(--<name>.",
 "plain":"Giving the funding page a new color name changed the colors of the table it borrows from the main dashboard, because the table used the same name. The fix keeps the new color to the page's own header.",
 "tags":["implementation-funding","explainer","a11y","pitfall","css"],"source":"S312 npm run a11y funding-model; funding-model/index.html"},
{"slug":"video-preview-font-narrower-than-render-2026-10-01","kind":"pitfall","status":"proposed",
 "title":"Check a video text change on the render page, not the preview",
 "summary":"A preview of funding_in_motion_s2.html fit \"The average allocation splits in two\" on one line; the MP4, drawn in the Playfair Display 900 that render.sh installs, wrapped it into the figures. Check a heading change on build.py <v> --render (the .fonts page) before a five-minute render (S312).",
 "detail":"The built page names fonts the preview browser may not hold, so the preview falls back to a narrower serif. render_<v>.html loads .fonts/ via @font-face; one frame of it at the scene's time shows the real wrap.",
 "plain":"The video's preview used a different font than the finished video, so a heading that fit in the preview spilled onto a second line in the video. Check new text in the render version first.",
 "tags":["funding-video","pitfall","rendering"],"source":"S312 prototype/funding_video render.sh s2"},
{"slug":"average-max-award-split-2026-10-01","kind":"fact","status":"proposed",
 "title":"The average max award is $213,901: $198,542 credit, $15,359 noncredit",
 "summary":"Measured 2026-10-01 (S312), engine over config md5 e21658f9: the 118 max awards average $213,901 (median $172,314); credit and noncredit shares average $198,541.56 and $15,359.35. The average Access target: 34.49 FTES behind $99,270.78 (Scenario 2), 22.76 FTES behind $65,518.72 (Scenario 1).",
 "detail":"funding_model_payload.js emits avgCr and avgNc (avgCr = avg - avgNc, so the printed pair sums to the printed average). The noncredit average equals the statewide noncredit face, $1,812,403, over 118.",
 "plain":"On average an institution can qualify for about $213,900 over the two years, about $198,500 of it for credit and $15,400 for noncredit.",
 "tags":["implementation-funding","measurement","explainer","funding-video"],"source":"scripts via T._alloc() over the live cpl_funding_config, S312"}
]$json$::jsonb)
  as x(slug text, kind text, status text, title text, summary text, detail text, plain text, tags text[], source text)
where not exists (select 1 from public.cpl_memory c where c.slug = x.slug);

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyLantern-s312', 'create', 'S312 session write', to_jsonb(m)
from public.cpl_memory m
where m.author = 'SkyLantern-s312'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

select m.slug, m.status, (select count(*) from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create') as creates
from public.cpl_memory m where m.author = 'SkyLantern-s312' order by m.slug;
