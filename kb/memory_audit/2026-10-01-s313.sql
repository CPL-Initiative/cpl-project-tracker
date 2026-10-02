-- S313 (SkyReel) memory receipt, 2026-10-01. Idempotent (not-exists guards).
-- Written live through the Supabase MCP on 2026-10-01 23:55 UTC, each row logged
-- in cpl_memory_log (action 'create', actor 'SkyReel-s313').
-- Rolls back by author: delete from cpl_memory where author = 'SkyReel-s313'
-- (and the matching cpl_memory_log rows by actor), then restore the supersede below.
insert into public.cpl_memory (slug, kind, org, share_across_orgs, title, summary, detail, tags, source, related, status, visibility, author, event_date)
select x.slug, x.kind, 'cpl', true, x.title, x.summary, x.detail, x.tags, x.source, x.related, 'proposed', 'internal', 'SkyReel-s313', date '2026-10-01'
from jsonb_to_recordset($json$[
{"slug":"sierra-possessive-hid-college-2026-10-01","kind":"pitfall",
 "title":"A possessive hid City College of San Francisco from Sierra's college matcher",
 "summary":"Sierra (v76) answered CCSF's split statewide because detectAndFetchCollegeProfile stripped punctuation only at a word's ends: \"Francisco's\" searched %francisco's%, matched nothing, and \"city\" tied across a dozen City colleges, so no college resolved. #1808 strips 's and ’s (cpl-chat v77, deployed 2026-10-01 23:23 UTC).",
 "detail":"Reproduced on Sam's question in tests/sierra_geo_ranking 3b (red on v76 code, green after). The same PR keeps smoke 7c's first sentence to the course, its title and its college; the dispatched smoke on v77 (run 36942436624) passed every mode, 7c included. Sam asks the CCSF question again to close sheet 14 card 1.",
 "tags":["sierra","cpl-chat","college-detection","pitfall"],"source":"PR #1808; smoke run 36942436624 (S313)",
 "related":["sierra-ccsf-split-wrong-v76-2026-10-01","smoke-7c-course-past-400-on-v76-2026-10-01"]},
{"slug":"cred-rename-apply-left-derived-files-stale-2026-10-01","kind":"pitfall",
 "title":"The credential rename apply left three derived files stale, and lints went red on main",
 "summary":"cred-rename-apply.yml rewrote credentials.json at 22:46 UTC 2026-10-01 without rebuilding kb/remint_blast_worklist.json, prototype/ccr_remint_blast.json or prototype/ccr_cpl.json, so the lints job failed on main and every PR. #1808 rebuilt them by hand; #1809 adds the rebuild to the workflow.",
 "detail":"check_generated.sh flags the re-mint worklist but not ccr_cpl.json; only the lints job's ccr_cpl_payload_test caught the second. The test job aggregates lints, so a red lints turns test red.",
 "tags":["cer","cred-rename","ci","pitfall"],"source":"PR #1808, PR #1809 (S313)","related":[]},
{"slug":"statewide-target-exceeds-institution-sum-2026-10-01","kind":"question",
 "title":"The statewide Access target exceeds the sum of the institutions' Access targets by 2.3%",
 "summary":"Engine under config md5 e21658f9, Scenario 2: the statewide Access target is $12,620,154 / $2,824.82 = 4,467.6 CPL FTES, while the 118 institutions' Access targets sum to 4,366.66 (credit 4,069.31 + noncredit 297.35), 100.9 FTES short. The average target, 34.49 FTES, is not the average Access funding over the price (35.14).",
 "detail":"An institution's target rides its size (prioTarget) while its award is clamped between base and cap, so per-institution targets do not divide like their funding. Where the 100.9 FTES go is unexamined. The video's targets slide and the explainer's ported lines state only the statewide division.",
 "tags":["implementation-funding","targets","question"],"source":"measured S313 with T._prios over the stored config","related":[]},
{"slug":"video-shift-function-shadowed-2026-10-01","kind":"pitfall",
 "title":"A clock-shift function named L was shadowed inside the film's buildK, and jsdom could not see it",
 "summary":"Adding the targets slide shifted every film time after 46 s through a function L; buildK declares its own var L, so the arrow keyframes threw in Chromium (a blank film), and a missed .map(L) left the offline score silent. jsdom never runs buildK's measured path or the score; the fix renamed it LS, and test m0 guards the source.",
 "detail":"To prove the narrated drafts unchanged, a screenshot byte comparison is noise (main against itself differed at 11 of 41 frames); a dump of the stage DOM after each seek is deterministic (82 of 82) and showed the one real difference. render.mjs now stops when the score returns no length.",
 "tags":["funding-video","testing","pitfall"],"source":"PR #1809 (S313)","related":[]},
{"slug":"explainer-progress-lines-ported-2026-10-01","kind":"milestone",
 "title":"The explainer carries the Public view's progress lines (sheet 14 card 6)",
 "summary":"Each priority's statewide target, price and progress, and the count under each minimum condition, now print on the funding explainer from the tab's _publicProgress(), the same figures the Public view prints (#1809). The page repaints when MAP's counts load. A target prints only for an FTES priority.",
 "detail":null,"tags":["implementation-funding","explainer","milestone"],"source":"PR #1809 (S313)","related":["sam-sheet14-rulings-2026-10-01"]}
]$json$::jsonb) as x(slug text, kind text, title text, summary text, detail text, tags text[], source text, related text[])
where not exists (select 1 from public.cpl_memory m where m.slug = x.slug);

-- Superseded (an automated-source row, resolved on v77; logged as 'supersede'):
update public.cpl_memory set status = 'superseded', superseded_by = 'sierra-possessive-hid-college-2026-10-01'
where slug = 'smoke-7c-course-past-400-on-v76-2026-10-01' and status = 'proposed';
-- Restore: update public.cpl_memory set status = 'proposed', superseded_by = null
--          where slug = 'smoke-7c-course-past-400-on-v76-2026-10-01';
