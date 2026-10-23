-- The S449 side session (beside SkyBuckwheat), 2026-10-22: Rule 8 ingest for the Scenario 4 build - three new rows.
-- INSERT-only; nothing superseded. Rollback: supersede the three rows by author 'S449-side', logged under
-- 'S449-side-rollback'. Applied through the Supabase MCP after tracker PR #2362 opened (summary <= 400 chars,
-- detail <= 4000, the table's checks).
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, source, related, status, verified_by, verified_at, event_date, author)
select x.slug, x.kind, 'cpl', x.title, x.summary, x.detail, x.plain, x.tags, x.source, '{}'::text[], x.status, x.verified_by,
       case when x.status = 'verified' then now() end, x.event_date::date, 'S449-side'
from jsonb_to_recordset($json$[
 {
  "slug": "scenario-4-noncredit-outcomes-lane-built-2026-10-22",
  "kind": "decision",
  "event_date": "2026-10-22",
  "title": "Scenario 4 built: the noncredit outcomes lane is a scenario setting; Scenario 3 stays published until Sam publishes 4",
  "summary": "Built 2026-10-22 on Sam's go (~20:26Z; tracker #2362). ncLane: \"outcomes\" on the scenario; unset, Scenarios 1 to 3 keep the origination lane unchanged and the public page reads Scenario 3 until he publishes 4. The noncredit share keeps its FTES sizing and releases on NC-1 exhibits (floor 2, 5% of CDCP courses, cap 10) and NC-2 the portfolio course (1), 50/50, under its own two conditions.",
  "detail": "The scenario's own ncOutcomes are counted, not priced: each a metric_src (nc_exh, nc_course), a target_rule (pct_floor_cap over nc_cdcp; fixed 1) and a share; ncReported carries the count of former noncredit students awarded CPL credit as a reported line, funded by nothing. Its own conditions (a noncredit CPL coordinator published; the strike-team attestation standing, read from cpl_funding_nc_attestation_pub) gate the noncredit share alone; the credit share keeps the credit conditions; a standalone's whole list is the lane's. Statewide targets are the institutions' targets summed. TBA and $0 until the builder emits nc_exh, nc_cdcp and nc_course; the conditions read pending until the attestation view exists, which neither holds nor releases on them. Seed receipt kb/receipts/cpl_funding_config_scenario4_2026-10-22_s449.sql (Scenario 4 = the live Scenario 3 minus docStatus plus the keys), applied after the merge. Two calls made on the recommendation, recorded in the implementation-funding lane for Sam to reverse: (1) a credit college's noncredit share gates on the confirmation plus the two noncredit conditions, never on the MAP coordinator or the veteran JSTs; (2) for the three standalone noncredit institutions the attested noncredit coordinator stands in for the MAP coordinator condition, and the certificates-posted condition retires (NC-1 carries it with a target). Guard tests/cpl_funding_nc_outcomes.test.js (51). Not yet: the builder (the four channels from COCI and MAP, the attested list, nc_cdcp for every roster institution, nc_course from the attested control number confirmed in COCI), the attestation surface (table, form, reviewer Reject, the _pub view; Governance DR-09 and the privacy ADRs first), the film's figures for 4, How to meet it for the two conditions.",
  "plain": "Scenario 4 exists in the model: the noncredit share releases on exhibits and the portfolio course, under its own two conditions. Colleges still read Scenario 3 until Sam publishes 4, and the figures stay TBA until the daily feed carries the counts.",
  "tags": ["implementation-funding", "nc-learning-partners", "scenario-4", "noncredit"],
  "source": "The S449 side session, 2026-10-22; Sam's go in chat ~20:26Z (sam-build-scenario-4-go-2026-10-22); Sheets 113 and 114 rulings; tracker PR #2362",
  "status": "proposed",
  "verified_by": null
 },
 {
  "slug": "pitfall-noncredit-twins-are-index-aligned-2026-10-22",
  "kind": "pitfall",
  "event_date": "2026-10-22",
  "title": "ncPriorities() is index-aligned with priorities() on every twin surface; an outcome that is not credit's twin needs figures of its own",
  "summary": "addInstPrios writes perPrio[i] for both lanes, the drill-in pairs ncPs[i] with credit row i, scopeProgress adds crTarget + ncTarget, and prioCap(sp.w) on a credit card carried the noncredit money because the twins shared credit's shares. Scenario 4's outcomes ride none of that: perNc, ncOut and rows of their own, and the credit cards take sp.cr (guard B10).",
  "detail": "The two lanes add up to what one card family showed before (tests/cpl_funding_nc_outcomes.test.js B10). The consumers that never assumed alignment (the pay loop in collegeAlloc, ncShareSum, ncPrioCap, sysTarget's src pairing, _ncPrios) take the outcomes through ncPriorities() unchanged. Tracker PR #2362.",
  "plain": "The model's noncredit priorities used to be copies of the credit ones, matched by position; a noncredit outcome that is its own thing has to carry its own figures everywhere the position was assumed.",
  "tags": ["implementation-funding", "pitfall", "noncredit"],
  "source": "The S449 side session, 2026-10-22, building Scenario 4 (tracker PR #2362)",
  "status": "proposed",
  "verified_by": null
 },
 {
  "slug": "pitfall-absolute-sr-only-escapes-a-scroll-box-2026-10-22",
  "kind": "pitfall",
  "event_date": "2026-10-22",
  "title": "A visually hidden span positioned absolutely inside a scroll box that is not itself positioned sits against the page, and the page scrolls sideways",
  "summary": "The funding table's header bands print Curr with a hidden Current for screen readers (position: absolute). A thead th is sticky, so its span is contained; a drill-in band's th is not, so the span sat against the page: at 390px the page scrolled sideways by 488px whenever a drill-in was open, in every scenario. Fix: position: relative on .cplfund-tablewrap.",
  "detail": "No a11y target had opened a drill-in; the new targets funding-curator-nc and funding-curator-nc-dark open two. Measured with a Playwright script listing every element whose right edge passed the viewport; the one at the overflow width was the span, its computed left 450px. Tracker PR #2362.",
  "plain": "A screen-reader-only word in the funding table's drill-in was making phones scroll sideways; one CSS rule keeps it inside the table's box.",
  "tags": ["implementation-funding", "a11y", "pitfall", "ui"],
  "source": "The S449 side session, 2026-10-22; npm run a11y -- funding-curator-nc (tracker PR #2362)",
  "status": "proposed",
  "verified_by": null
 }
]$json$) as x(slug text, kind text, event_date text, title text, summary text, detail text, plain text, tags text[], source text, status text, verified_by text)
on conflict (slug) do nothing;
