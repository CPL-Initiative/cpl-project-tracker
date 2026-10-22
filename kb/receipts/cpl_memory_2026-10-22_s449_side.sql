-- The S449 side session (beside SkyBuckwheat), 2026-10-22: Rule 8 ingest for the Scenario 4 build - three new rows.
-- INSERT-only; nothing superseded. Rollback: supersede the three rows by author 'S449-side', logged under
-- 'S449-side-rollback'. Applied through the Supabase MCP after the code PR opened; the PR number is in each row.
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, source, related, status, verified_by, verified_at, event_date, author)
select x.slug, x.kind, 'cpl', x.title, x.summary, x.detail, x.plain, x.tags, x.source, '{}'::text[], x.status, x.verified_by,
       case when x.status = 'verified' then now() end, x.event_date::date, 'S449-side'
from jsonb_to_recordset($json$[
 {
  "slug": "scenario-4-noncredit-outcomes-lane-built-2026-10-22",
  "kind": "decision",
  "event_date": "2026-10-22",
  "title": "Scenario 4 built: the noncredit outcomes lane is a scenario setting; Scenario 3 stays published until Sam publishes 4",
  "summary": "Built 2026-10-22 on Sam's go (~20:26Z). ncLane: \"outcomes\" on the scenario; unset, the model is the origination lane of Scenarios 1 to 3, unchanged. The noncredit share keeps its FTES sizing and releases on the scenario's own ncOutcomes, counted not priced: NC-1 nc_exh under pct_floor_cap (floor 2, 5% of nc_cdcp, cap 10), NC-2 nc_course under fixed 1, 50/50; ncReported carries the student award count as a reported line. Its own conditions (noncredit coordinator published, strike team attested, from cpl_funding_nc_attestation_pub) gate the noncredit share alone; a standalone's whole list is the lane's. Statewide targets are the institutions' summed. TBA and $0 until the builder emits nc_exh, nc_cdcp and nc_course; the conditions read pending until the attestation view exists. Seed receipt kb/receipts/cpl_funding_config_scenario4_2026-10-22_s449.sql (Scenario 4 = live Scenario 3 minus docStatus plus the keys), applied after the merge. Tracker PR #PRNUM.",
  "detail": "Two calls made on the recommendation, recorded in the implementation-funding lane for Sam to reverse: (1) a credit college's noncredit share gates on the confirmation plus the two noncredit conditions, never on the MAP coordinator or the veteran JSTs; (2) for the three standalone noncredit institutions the attested noncredit coordinator stands in for the MAP coordinator condition, and the certificates-posted condition retires (NC-1 carries it with a target). Guard tests/cpl_funding_nc_outcomes.test.js (51). Not yet: the builder (the four channels from COCI and MAP, the attested list, nc_cdcp for every roster institution, nc_course from the attested control number confirmed in COCI), the attestation surface (table, form, reviewer Reject, the _pub view; Governance DR-09 and the privacy ADRs first), the film's figures for 4, How to meet it for the two conditions.",
  "plain": "Scenario 4 exists in the model: the noncredit share releases on exhibits and the portfolio course, under its own two conditions. Colleges still read Scenario 3 until Sam publishes 4, and the figures stay TBA until the daily feed carries the counts.",
  "tags": ["implementation-funding", "nc-learning-partners", "scenario-4", "noncredit"],
  "source": "The S449 side session, 2026-10-22; Sam's go in chat ~20:26Z (sam-build-scenario-4-go-2026-10-22); Sheets 113 and 114 rulings",
  "status": "proposed",
  "verified_by": null
 },
 {
  "slug": "pitfall-noncredit-twins-are-index-aligned-2026-10-22",
  "kind": "pitfall",
  "event_date": "2026-10-22",
  "title": "ncPriorities() is index-aligned with priorities() on every twin surface; an outcome that is not credit's twin needs figures of its own",
  "summary": "addInstPrios writes perPrio[i] for both lanes, the drill-in pairs ncPs[i] with credit row i, scopeProgress adds crTarget + ncTarget, and prioCap(sp.w) on a credit card carried the noncredit money because the twins shared credit's shares. A noncredit list that is not the twins (Scenario 4's outcomes) rides none of that: it gets perNc, ncOut and rows of its own, the credit cards take sp.cr, and the two lanes add up to what one card family showed before (guard B10 in tests/cpl_funding_nc_outcomes.test.js).",
  "detail": "The consumers that never assumed alignment (the pay loop in collegeAlloc, ncShareSum, ncPrioCap, sysTarget's src pairing, _ncPrios) take the outcomes through ncPriorities() unchanged. Tracker PR #PRNUM.",
  "plain": "The model's noncredit priorities used to be copies of the credit ones, matched by position; a noncredit outcome that is its own thing has to carry its own figures everywhere the position was assumed.",
  "tags": ["implementation-funding", "pitfall", "noncredit"],
  "source": "The S449 side session, 2026-10-22, building Scenario 4",
  "status": "proposed",
  "verified_by": null
 },
 {
  "slug": "pitfall-absolute-sr-only-escapes-a-scroll-box-2026-10-22",
  "kind": "pitfall",
  "event_date": "2026-10-22",
  "title": "A visually hidden span positioned absolutely inside a scroll box that is not itself positioned sits against the page, and the page scrolls sideways",
  "summary": "The funding table's header bands print Curr with a hidden Current for screen readers (position: absolute, 1px). A thead th is sticky, so its span is contained; a drill-in band's th is not, so the span's containing block was the page: at 390px the page scrolled sideways by 488px whenever a drill-in was open, in every scenario, and no a11y target had opened one. Fix: position: relative on .cplfund-tablewrap; the new targets funding-curator-nc and -dark open two drill-ins.",
  "detail": "Measured with a Playwright script listing every element whose right edge passed the viewport; the one at the overflow width was the span, its computed left 450px. Tracker PR #PRNUM.",
  "plain": "A screen-reader-only word in the funding table's drill-in was making phones scroll sideways; one CSS rule keeps it inside the table's box.",
  "tags": ["implementation-funding", "a11y", "pitfall", "ui"],
  "source": "The S449 side session, 2026-10-22; npm run a11y -- funding-curator-nc",
  "status": "proposed",
  "verified_by": null
 }
]$json$) as x(slug text, kind text, event_date text, title text, summary text, detail text, plain text, tags text[], source text, status text, verified_by text)
on conflict (slug) do nothing;
