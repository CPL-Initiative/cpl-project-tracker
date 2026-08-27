// tests/cpl_funding_metric_pin.test.js
//
// The explicit metric SOURCE pin (`metric_src`) — and the defect that forced it.
//
// measurability() resolves a priority to its data source by substring-matching
// the metric's PROSE. That was sound while every metric in the system described
// CREDIT performance: a text match could only land on the right measure or on
// none at all.
//
// It stops being sound the moment a second lane exists. Measured 2026-08-27
// against the real predicates: all three of Sam's noncredit metrics, written in
// his own idiom and naming the noncredit LANDING PAGE (which is how an origin
// filter reads in prose), collapse onto `pp_u` — the CREDIT lane's portal-origin
// transcribed units — because the portal entry sits first among the unit
// measures and wins before "eligible"/"applied"/"transcribed" is consulted.
//
// ⚠️ The reason this needed a guard rather than a look at the screen: statewide
// pp_u is 25.0 units carried by 3 of 105 colleges, so 102 colleges would render
// 0 — which is EXACTLY the honest zero Sam asked the NC lane to show while the
// origination field is undelivered. The wrong number and the right number are
// indistinguishable by eye.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_metric_pin.test.js`).
const { check, freshDom, boot, consumerSrc, finish } = require("./lib/cpl_funding_harness.js");

// ── 1. the defect itself, against the REAL predicates ────────────────────────
// Rebuilt out of the consumer so this cannot drift into testing a copy.
const has = (m, s) => String(m || "").toLowerCase().indexOf(s) !== -1;
const wantsUnits = (function () {
  const m = consumerSrc.match(/function wantsUnits\(m\) \{[\s\S]*?\n  \}/);
  return eval("(" + m[0].replace(/^function wantsUnits/, "function") + ")");
})();
const MEASURES = (function () {
  const start = consumerSrc.indexOf("var MEASURES = [");
  const end = consumerSrc.indexOf("];", start) + 2;
  return eval("(" + consumerSrc.slice(start + "var MEASURES = ".length, end - 1) + ")");
})();
function proseMeasure(metric) {
  const m = String(metric || "").toLowerCase();
  return MEASURES.find((x) => x.test(m)) || {};
}

const NC_METRICS = [
  "Eligible CPL Units as FTES for students originating from the Noncredit Landing Page",
  "Applied CPL Units as FTES for students originating from the Noncredit Landing Page",
  "Transcribed CPL Units as FTES for students originating from the Noncredit Landing Page",
];
const resolved = NC_METRICS.map((m) => proseMeasure(m).src);
check("1a: prose matching still collapses all three NC metrics onto one credit source (the pin is still needed)",
  resolved.length === 3 && new Set(resolved).size === 1 && resolved[0] === "pp_u");
check("1b: and that collapse destroys the eligible/applied/transcribed milestone distinction",
  proseMeasure(NC_METRICS[0]).src === proseMeasure(NC_METRICS[2]).src);

// ── 2. the registry ──────────────────────────────────────────────────────────
check("2a: METRIC_SOURCES declares the legal pins, so metric_src is not free text",
  /var METRIC_SOURCES = \{/.test(consumerSrc));
check("2b: every source the prose matcher can return is also declarable as a pin",
  MEASURES.filter((x) => x.src).every((x) =>
    new RegExp("^\\s{4}" + x.src + ":\\s*\\{", "m").test(consumerSrc)));
check("2c: measureOf() is the single seam — no site reads measurability(p.metric) directly any more",
  /function measureOf\(p\)/.test(consumerSrc) && !/measurability\(p\.metric\)/.test(consumerSrc));
check("2d: srcDelivered() asks the ARTIFACT, not the registry (a declared key may be undelivered)",
  /function srcDelivered\(src\)[\s\S]{0,320}hasOwnProperty\.call\(pf\.statewide, src\)/.test(consumerSrc));

// ── 3. the pin actually overrides the prose, end to end ──────────────────────
{
  const { window } = freshDom();
  // pa_u present for one college; pp_u present too, so a regression that fell
  // back to prose would find a REAL value and look fine.
  window.CPL_FUNDING_PERF = { as_of: "2026-08-27", suppress_below: 5,
    statewide: { pa_u: 500000, pp_u: 25 },
    colleges: { "Laney": { pa_u: 12000, pp_u: 3 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    // Same prose for all three; only the pin differs.
    "0": { metric: NC_METRICS[1], metric_src: "pa_u" },
    "1": { metric: NC_METRICS[1] },                     // unpinned → prose → pp_u
    "2": { metric: NC_METRICS[1], metric_src: "nope_u" } // unknown pin
  } } });
  T.render();
  const row = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find((r) => /Laney/.test(r.textContent));
  const cells = Array.from(row.querySelectorAll("td")).map((td) => td.textContent);
  const joined = cells.join(" | ");
  // P1 and P2 carry the SAME metric prose and differ only by the pin. P1 scores
  // on pa_u (12,000 units / 30 = 400 CPL FTES, its full cap); P2 falls through
  // to the prose and scores on pp_u (3 units = 0.1 FTES, ~$389). One config
  // field, a 4,000x difference in what the college is judged on — and neither
  // cell looks broken.
  check("3a: the pinned priority scores on pa_u (400 FTES), not on the prose's pp_u",
    /Now 400 FTES/.test(cells[4]));
  check("3b: the UNPINNED twin, same prose, silently scores on the credit portal measure",
    /Now 0 FTES/.test(cells[5]) && /1\.06%/.test(cells[5]));
  check("3b2: so the pin changes the answer — identical prose, different earning",
    cells[4] !== cells[5]);
  check("3c: an unknown pin renders 'not wired' rather than a plausible number",
    /not wired/.test(cells[6]) && /\$0/.test(cells[6]));
  check("3d: a pinned unit source forces the FTES unit, whatever the prose sniffs",
    T._prios("Laney", "1")[0].unit === "FTES");

  // ⚠️ 3d above cannot actually discriminate on its own: its prose ("...Units as
  // FTES...") already sniffs to units, so blanking the registry lookup in
  // prioUnit() left it green. Proven by mutation, then fixed here — the pin has
  // to be the ONLY thing that can produce FTES.
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: "Headcount of students with transcribed CPL credit", metric_src: "pa_u" },
    "1": { metric: "Headcount of students with transcribed CPL credit" },
    "2": { metric: "Headcount with CPL Matched in MAP and MIS" }
  } } });
  T.render();
  const pr = T._prios("Laney", "1");
  check("3d2: prose says HEADCOUNT, pin says units — the pin wins",
    pr[0].unit === "FTES" && pr[1].unit === "students");
}

// ── 3e. DECLARED BUT UNDELIVERED, behaviorally ───────────────────────────────
// Sam's NC ruling: the row shows its target and potential with current earnings
// at ZERO — explicitly not the full-cap advance an unmeasurable credit metric
// gets. A source declared in the registry but absent from the published artifact
// is that state, and it is the state every NC priority is in today.
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-08-27", suppress_below: 5,
    statewide: { pa_u: 500000 },                       // no nc_* key anywhere
    colleges: { "Laney": { pa_u: 12000 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: NC_METRICS[1], metric_src: "nc_pa_u" },
    "1": { metric: "Headcount with CPL Matched in MAP and MIS" },   // a real data gap, for contrast
    "2": { metric: NC_METRICS[1], metric_src: "pa_u" }
  } } });
  T.render();
  const row = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find((r) => /Laney/.test(r.textContent));
  const cells = Array.from(row.querySelectorAll("td")).map((td) => td.textContent);
  check("3e: an undelivered NC source earns $0 and says 'no feed'",
    /no feed/.test(cells[4]) && /\$0/.test(cells[4]));
  check("3e2: it does NOT advance the full cap — the contrast is the data-gap cell beside it",
    !/no feed/.test(cells[5]) && /gap/.test(cells[5]));
  check("3e3: and it is not reported as a measured zero ('0 FTES ... 0%')",
    !/Now 0 FTES/.test(cells[4]));
  const nc = cells[4].match(/\$[\d.,]+K?/g) || [];
  const gap = cells[5].match(/\$[\d.,]+K?/g) || [];
  check("3e4: the undelivered cell earns strictly less than the data-gap cell advances",
    nc.length >= 2 && gap.length >= 2 && nc[1] === "$0" && gap[1] !== "$0");
}

// ── 4. the two states that must never advance ────────────────────────────────
// A miswired pin falling into the data-gap branch would pay every college its
// FULL CAP — one typo in one config field disbursing a whole priority.
check("4a: a bad pin earns $0 and is NOT treated as a data gap",
  /if \(meas\.bad_src\) return \{ f: 0, status: "bad_src"/.test(consumerSrc));
check("4b: bad_src is checked BEFORE the gap branch (order is the whole protection)",
  consumerSrc.indexOf('status: "bad_src"') < consumerSrc.indexOf('status: "gap"'));
check("4c: a declared-but-undelivered source earns f=0 — Sam's NC ruling, not a full-cap advance",
  /if \(meas\.undelivered\) return \{ f: 0, status: "undelivered"/.test(consumerSrc));
check("4d: undelivered is a separate LABEL from none (absent zero vs measured zero)",
  /status === "undelivered"[\s\S]{0,400}not in the daily feed yet/.test(consumerSrc));

// ── 5. one place decides whether a number is a measurement ───────────────────
check("5a: earnIsMeasured() exists, so a new status cannot be forgotten at four sites",
  /function earnIsMeasured\(fr\)/.test(consumerSrc));
check("5b: no surface still tests the old inline gap-or-pending pair",
  !/status === "gap" \|\| fr\.status === "pending"/.test(consumerSrc.replace(/\/\/[^\n]*/g, "")));
check("5c: the CSV emits BLANK for an unmeasured priority, never 0",
  /!earnIsMeasured\(fr\) \? "" : 0/.test(consumerSrc));
// ⚠️ 5c is a source read and CANNOT fail if earnIsMeasured() itself is broken —
// proven by mutation (making it return true always left 5c green). The CSV is
// therefore also exercised for real: an undelivered priority must export an
// empty cell, because a 0 in a spreadsheet is a measurement someone will chart.
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-08-27", suppress_below: 5,
    statewide: { pa_u: 500000 }, colleges: { "Laney": { pa_u: 12000 } }, unmatched: {} };
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: NC_METRICS[1], metric_src: "nc_pa_u" },
    "1": { metric: NC_METRICS[1], metric_src: "pa_u" },
    "2": { metric: NC_METRICS[1], metric_src: "nc_pt_u" }
  } } });
  T.render();
  const line = T._csv().split("\n").find((l) => /Laney/.test(l));
  const cols = line.split(",");
  const p1a = cols.findIndex((v) => /^"?400/.test(v));   // the delivered pin's actual
  check("5c2: the CSV actually carries the delivered actual",
    p1a > 0);
  // P1 actual sits two columns before it (target, actual per priority).
  check("5c3: and the undelivered priorities export EMPTY cells, not zeros",
    cols[p1a - 2] === "" && cols[p1a + 2] === "");
}
check("5d: the drill-in does not claim 'no CPL posted' when nothing was measured",
  /status === "undelivered"[\s\S]{0,300}nothing about this college has been measured/.test(consumerSrc));

// ── 6. the curator diagnostic must not lie about the new states ──────────────
// It previously classified anything without a `src` as "not measurable — pays a
// FULL ADVANCE". Both new states have no measurement behind them and NEITHER
// advances, so that sentence would have been exactly backwards on both.
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-08-27", suppress_below: 5,
    statewide: { pa_u: 500000 }, colleges: { "Laney": { pa_u: 12000 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: NC_METRICS[1], metric_src: "nc_pa_u" },
    "1": { metric: NC_METRICS[1], metric_src: "nope_u" },
    // Same MILESTONE (applied), different UNIT — so the wording check fires and
    // the milestone check does not. Separating them matters: an earlier fixture
    // said "transcribed" and pinned pa_u, which trips BOTH, and the milestone
    // warning correctly outranks the wording one.
    "2": { metric: "Headcount of students with CPL applied to their record", metric_src: "pa_u" }
  } } });
  T.render();
  const diag = doc.querySelector(".cplfund-metricdiag");
  const txt = diag ? diag.textContent : "";
  check("6a: an undelivered pin reads 'declared, not delivered yet', not 'pays a FULL ADVANCE'",
    /declared, not delivered yet/.test(txt));
  check("6b: a bad pin reads NOT WIRED and says it earns $0",
    /NOT WIRED/.test(txt) && /earns \$0/.test(txt));
  check("6c: neither new state is described as advancing",
    !/nc_pa_u[\s\S]{0,120}FULL ADVANCE/.test(txt) && !/nope_u[\s\S]{0,120}FULL ADVANCE/.test(txt));
  check("6d: a prose/pin wording disagreement is flagged as WORDING, not as a unit mismatch",
    /wording says/.test(txt) && !/UNIT MISMATCH/.test(txt));
  check("6e: the panel opens itself when a pin is bad",
    !!diag && diag.hasAttribute("open"));
}

// ── 7. MILESTONE agreement — the live defect this PR found ───────────────────
// MAP's funnel is eligible -> applied -> transcribed, three different quantities
// (statewide 1,382,125 / 223,384 / 80,338 units). A metric naming one rung and a
// measure returning another scores the right college on the wrong thing.
//
// ⚠️ Sam's LIVE Year-1 Access metric does exactly this, and it is the priority
// with the largest share (0.34).
const LIVE_ACCESS = "Applied units measured in FTES for students originating from " +
  "either CPL Portal, College CPL Landing Page, or batch upload";
check("7a: the live Access metric still resolves to a TRANSCRIBED measure (pp_u)",
  proseMeasure(LIVE_ACCESS).src === "pp_u");
{
  const { window } = freshDom();
  // The REAL published artifact, so the numbers are the live ones.
  const fs = require("fs");
  new Function("window", fs.readFileSync("cpl_funding_performance.js", "utf8")).call(window, window);
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const LIVE = {
    "0": { metric: "Eligible CPL Units measured in FTES", share: 0.33, factor: 0.5 },
    "1": { metric: "Transcribed CPL Units measured in FTES", share: 0.33, factor: 0.5 },
    "2": { metric: LIVE_ACCESS, share: 0.34, factor: 0.5 }
  };
  T._setShared({ yearPriorities: { "1": LIVE, "2": LIVE }, mirrorYears: true, disbursement: "frontload" });
  T.render();
  const rows = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"));
  const zero = rows.filter((r) => /Now 0 FTES/.test(Array.from(r.querySelectorAll("td"))[6].textContent));
  check("7b: and every college in the system reads 0 FTES on it — the symptom nobody could see",
    rows.length > 100 && zero.length === rows.length);
  const diag = doc.querySelector(".cplfund-metricdiag");
  check("7c: the diagnostic now names it a MILESTONE MISMATCH instead of a clean ✔",
    !!diag && /MILESTONE MISMATCH/.test(diag.textContent) &&
    /asks for APPLIED CPL but pp_u returns transcribed/.test(diag.textContent));
  check("7d: and the panel opens itself, because this is a live risk",
    !!diag && diag.hasAttribute("open"));
  // Fires on P3 in BOTH years (the config mirrors), and on nothing else — the
  // eligible and transcribed metrics resolve to their own rungs and stay clean.
  const lis = Array.from(diag.querySelectorAll("li")).map((li) => li.textContent);
  check("7e: it fires on the Access slot in both years and on nothing else",
    lis.filter((t) => /MILESTONE MISMATCH/.test(t)).length === 2 &&
    lis.filter((t) => /MILESTONE MISMATCH/.test(t)).every((t) => /P3/.test(t)));
  check("7f: the four honest priorities stay a clean ✔",
    lis.filter((t) => /✔ measurable/.test(t) && !/MISMATCH/.test(t)).length === 4);
}

finish("cpl_funding_metric_pin");
