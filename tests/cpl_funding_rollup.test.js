// CPL Implementation Funding tab — renderer behaviour, part 2 (C8–C10).
//
// District rollup + period toggle + drill-ins, metric-measurability actuals,
// and the failure mode where the data never arrives (404 -> loadScript fails
// soft). Continues Part C of the original file.
//
// One of nine suites the 2,955-line cpl_funding.test.js was split into on
// 2026-08-20, after it stopped fitting in a 12 GB heap. Shared setup + the
// jsdom helpers live in tests/lib/cpl_funding_harness.js, which also carries the
// measurements behind the split and the per-window memory budget for anyone
// adding to these files.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_rollup.test.js`).
const {
  check,
  freshDom,
  boot,
  click,
  commit,
  footText,
  D,
  consumerSrc,
  idx,
  finish,
} = require("./lib/cpl_funding_harness.js");

// C8 — district rollup + period toggle + drill-ins (feature parity).
{
  const { window } = freshDom();
  const doc = boot(window);
  // Drill-in.
  click(window, doc.querySelector("tr.cplfund-row"));
  let detail = doc.querySelector("tr.cplfund-detail");
  check("college drill-in renders a detail row with per-priority math",
    detail && detail.textContent.indexOf("Priority 1") !== -1 && detail.textContent.indexOf("share") !== -1);
  check("drill-in shows the active year's metric", detail.textContent.indexOf("metric:") !== -1);
  click(window, doc.querySelector("tr.cplfund-row"));
  check("re-click collapses the drill-in", !doc.querySelector("tr.cplfund-detail"));

  // Year columns: SYSTEM tfoot carries each year's tranche + the window total.
  // The rural carve-out is now FOLDED into rural colleges' rows (Sam, 2026-07-28),
  // so the SYSTEM total = main net + rural = college funding before feeder only.
  const net = D.pool.college_funding_before_feeder - D.pool.feeder_carveout;
  const tranche = net / 2;
  check("SYSTEM tfoot Total = the college pool incl. folded rural ($" + net.toLocaleString() + ")",
    doc.querySelector("#cplFundTable .cplfund-systemrow").textContent.indexOf("$" + net.toLocaleString("en-US")) !== -1);
  check("SYSTEM tfoot year cells carry the per-year tranche ($" + Math.round(tranche).toLocaleString() + ")",
    doc.querySelector("#cplFundTable .cplfund-systemrow").textContent.indexOf("$" + Math.round(tranche).toLocaleString("en-US")) !== -1);

  // GROUP BY DISTRICT (Sam, 2026-07-30) replaced the Colleges|Districts VIEW
  // toggle. The old toggle REPLACED the college rows, so the per-college
  // numbers a curator wanted to compare vanished behind a drill-in. Grouping
  // keeps every college row visible and only ADDS district subtotal headers.
  const distinct = new Set(D.colleges.map(function (c) { return c.district || "(no district)"; })).size;
  const flatN = doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row").length;
  check("the retired Colleges|Districts view toggle is gone", !doc.querySelector("#cplFundView"));
  click(window, doc.querySelector('#cplFundGroup button[data-val="district"]'));
  const hdrs = doc.querySelectorAll("#cplFundTable tbody tr.cplfund-grouphdr");
  check("grouping adds one district header per district (" + distinct + ")", hdrs.length === distinct);
  check("grouping KEEPS every college row visible (the point of retiring the toggle)",
    doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row").length === flatN);
  const listHeads = D.colleges.reduce(function (s, c) { return s + (c.headcount || 0); }, 0);
  const gHead = Array.from(hdrs).reduce(function (s, tr) {
    const m = tr.textContent.match(/·\s*([\d,]+) students/);
    return s + (m ? Number(m[1].replace(/,/g, "")) : 0);
  }, 0);
  check("district subtotals conserve the college-list headcount", gHead === listHeads);
  // Groups are ordered by their subtotal, largest first (Sam's explicit call).
  const gTotals = Array.from(hdrs).map(function (tr) {
    const t = tr.querySelector("td.tot").textContent.match(/\$([\d,]+)/);
    return t ? Number(t[1].replace(/,/g, "")) : 0;
  });
  check("district groups are ordered by subtotal, largest first",
    gTotals.every(function (v, i) { return i === 0 || gTotals[i - 1] >= v; }));
  // Σ district subtotals == Σ college rows (conservation across the grouping).
  const sumCollege = D.colleges.reduce(function (s, c) {
    return s + window.CPL_FUNDING_TAB._alloc(c.college).total; }, 0);
  check("Σ district subtotals == Σ college allocations",
    Math.abs(gTotals.reduce(function (a, b) { return a + b; }, 0) - sumCollege) < distinct + 2);
  // A college drill-in still works while grouped.
  click(window, doc.querySelector("#cplFundTable tr.cplfund-row"));
  check("a college drill-in still opens while grouped", !!doc.querySelector("tr.cplfund-detail"));
  // Back to flat, and a college sort still works.
  click(window, doc.querySelector('#cplFundGroup button[data-val="none"]'));
  click(window, doc.querySelector('#cplFundTable th[data-sort="college"]'));
  check("ungrouping restores the flat list with no district headers",
    !doc.querySelector("#cplFundTable tbody tr.cplfund-grouphdr") &&
    doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row").length === flatN);
}

// C9 — metric-measurability actuals: Year-1 P1 (any transcribed) IS measurable
// from the daily MAP feed; the statewide-eligible metric carries an exhibit-
// linkage data-gap label; the Portal/Landing metric (P3) is wired to the
// portal-origin `pp` count (Sam, 2026-07-27) — a normal achievement-based metric
// (no full-cap advance), so without the feed it reads as pending, not a hard gap.
{
  // Without the perf artifact.
  // These assertions are ABOUT a data-gap metric vs a wired one, so they SET the
  // metrics instead of inheriting the baked defaults — which are hand-maintained
  // and drifted out from under this block on 2026-07-30.
  const { window } = freshDom();
  const doc = boot(window);
  window.CPL_FUNDING_TAB._setShared({ yearPriorities: { "1": {
    "0": { metric: "Headcount of students with transcribed CPL credit for at least one course." },
    "1": { metric: "Headcount with Eligible CPL Based on Statewide Credit Recommendations" },
    "2": { metric: "Headcount with Transcribed Credit from either CPL Portal or CPL Landing Page" }
  } } });
  window.CPL_FUNDING_TAB.render();
  check("Y1-P1 card hints actuals arrive with the daily refresh (measurable metric)",
    doc.querySelector(".cplfund-prio .p").textContent.indexOf("next daily data refresh") !== -1);
  check("Y1-P2 card carries the exhibit-linkage data-gap label",
    doc.querySelectorAll(".cplfund-prio .p")[1].textContent.indexOf("data gap") !== -1 &&
    doc.querySelectorAll(".cplfund-prio .p")[1].textContent.indexOf("STATEWIDE credit recommendation") !== -1);
  check("Y1-P3 (Portal/Landing) is no longer a hard data gap — it's the wired portal metric",
    doc.querySelectorAll(".cplfund-prio .p")[2].textContent.indexOf("data gap") === -1 &&
    doc.querySelectorAll(".cplfund-prio .p")[2].textContent.indexOf("Portal") !== -1);
  // Per-priority table columns: the exhibit-linkage P2 cell reads "gap"; the
  // wired-but-feedless P3 cell reads the pending ellipsis (…), not "gap".
  const gapCells = doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row td.cf-prio");
  check("P2 (exhibit-linkage) cell reads 'gap'; P3 (portal, feed pending) reads '…' not 'gap'",
    gapCells[1].textContent.indexOf("gap") !== -1 &&
    gapCells[2].textContent.indexOf("…") !== -1 && gapCells[2].textContent.indexOf("gap") === -1);
}
{
  // With a synthetic perf artifact.
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = {
    as_of: "2026-06-11", suppress_below: 5,
    statewide: { p2: 9000, p3: 20000 },
    colleges: { "Alameda": { p2: 120, p3: 300 }, "Yuba": { p2: 6, p3: null, p3_suppressed: true } },
    unmatched: { "Mystery University": { p2: null, p2_suppressed: true, p3: 7 } }
  };
  const doc = boot(window);
  // Pin P1 to the any-transcribed metric this fixture's p3 numbers are written
  // for (the baked default is now the ELIGIBLE metric → pe).
  window.CPL_FUNDING_TAB._setShared({ yearPriorities: { "1": {
    "0": { metric: "Headcount of students with transcribed CPL credit for at least one course." }
  } } });
  window.CPL_FUNDING_TAB.render();
  const p1card = doc.querySelectorAll(".cplfund-prio .p")[0];
  check("Y1-P1 card shows the any-transcribed statewide actual vs target",
    p1card.textContent.indexOf("20,000") !== -1 && p1card.textContent.indexOf("of target") !== -1);
  check("system row's P1 column carries the deduplicated statewide actual (20K, compact)",
    doc.querySelector("#cplFundTable .cplfund-systemrow td.cf-prio").textContent.indexOf("20K") !== -1);
  check("footer explains the per-priority target/actual cells + dedup",
    footText(doc).indexOf("deduplicate across colleges") !== -1 &&
    footText(doc).indexOf("target") !== -1 && footText(doc).indexOf("actual") !== -1);
  check("a non-empty unmatched bucket is surfaced in the footer",
    footText(doc).indexOf("Mystery University") !== -1);
  const rowsArr = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"));
  const alaRow = rowsArr.find(function (tr) { return tr.textContent.indexOf("Alameda") !== -1; });
  check("Alameda's P1 cell shows the any-transcribed actual (300) stacked under its target",
    alaRow.querySelector("td.cf-prio").querySelector(".cf-a").textContent.indexOf("300") !== -1);
  // Sort by the P1 (prio0) column → highest actual first.
  click(window, doc.querySelector('#cplFundTable th[data-sort="prio0"]'));
  check("sort by the P1 column puts the highest actual first",
    doc.querySelector("#cplFundTable tbody tr.cplfund-row").textContent.indexOf("Alameda") !== -1);
  // Year 2: all three metrics are gaps today (units builder / MIS match-back).
  click(window, doc.querySelector('#cplFundYear button[data-val="2"]'));
  check("Y2 cards carry data-gap labels (MIS match-back)",
    doc.querySelectorAll(".cplfund-prio .p")[1].textContent.indexOf("match-back") !== -1);
}

// C9b — measurability follows the METRIC, not the slot position (Sam, 2026-07-23).
// When priorities are REORDERED (Access ⇄ Success), the actual/data-gap must
// travel with the metric — a position-keyed map showed the "any transcribed"
// count under the statewide-eligibility priority.
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = {
    as_of: "2026-07-23", suppress_below: 5,
    statewide: { p2: 5000, p3: 16807 },
    colleges: { "Alameda": { p2: 100, p3: 250 } }, unmatched: {}
  };
  const doc = boot(window);
  // Reorder: slot-0 = statewide-eligibility (Access), slot-1 = any-transcribed
  // (Success), slot-2 = origin/Portal (Capacity) — Sam's live arrangement.
  window.CPL_FUNDING_TAB._setShared({ yearPriorities: { "1": {
    "0": { title: "Access", metric: "Headcount with Eligible CPL Based on Statewide Credit Recommendations, Joint Services Transcripts, or High School Credit" },
    "1": { title: "Success", metric: "Headcount of students with transcribed CPL credit for at least one course." },
    "2": { title: "Capacity", metric: "Headcount with Transcribed Credit from either CPL Student Portal or CPL Landing Page" }
  } } });
  window.CPL_FUNDING_TAB.render();
  const cards = doc.querySelectorAll(".cplfund-prio .p");
  check("reordered slot-0 (statewide eligibility) shows the exhibit-linkage data gap, not a number",
    cards[0].textContent.indexOf("data gap") !== -1 &&
    cards[0].textContent.indexOf("STATEWIDE credit recommendation") !== -1 &&
    cards[0].textContent.indexOf("16,807") === -1);
  check("reordered slot-1 (any transcribed) now carries the measurable actual (16,807 of target)",
    cards[1].textContent.indexOf("16,807") !== -1 && cards[1].textContent.indexOf("of target") !== -1);
  check("reordered slot-2 (Portal/Landing) carries the wired portal metric, not the eligibility gap",
    cards[2].textContent.indexOf("data gap") === -1 &&
    cards[2].textContent.indexOf("STATEWIDE credit recommendation") === -1 &&
    cards[2].textContent.indexOf("Portal") !== -1);
}

// C9c — Projection % row is clarified as a target that does NOT move/cap dollars.
{
  const { window } = freshDom();
  const doc = boot(window);
  const box = doc.querySelector(".cplfund-prio .p").textContent;
  check("projection line clarifies it does not cap funding + points at the Allocation share",
    box.indexOf("cap the funding") !== -1 && box.indexOf("Allocation share above") !== -1);
}

// C9d — Allocation-balance box in the Funding Pool area (Sam, 2026-07-23).
{
  const { window } = freshDom();
  const doc = boot(window);
  const bal = doc.querySelector(".cplfund-card.balance");
  check("a balance box renders in the pool area", !!bal);
  check("at 100% shares the balance is $0 (fully apportioned)",
    bal && bal.querySelector(".v").textContent.trim() === "$0" &&
    bal.textContent.indexOf("fully apportioned") !== -1 && bal.textContent.indexOf("100%") !== -1);
  check("balance box is not flagged over-allocated at 100%", bal && !bal.classList.contains("over"));
  // Push the shares past 100% → over-allocated, red, and quantified.
  commit(window, doc.querySelector('input[data-edit="share"][data-slot="1"][data-idx="0"]'), "60");
  const over = doc.querySelector(".cplfund-card.balance");
  check("shares over 100% flag the balance box as over-allocated (red border class)",
    over && over.classList.contains("over"));
  check("over-allocated balance names the overage + the >100% share sum",
    over && over.textContent.indexOf("Over-allocated") !== -1 &&
    over.textContent.indexOf("130%") !== -1 && over.querySelector(".v.neg"));
}

// C9e — the priority box + timing rows share one body-copy size (Sam, 2026-07-23).
{
  check("priority .nums / .desc / .metric all use the unified .8rem size",
    /\.cplfund-prio \.p \.nums \{[^}]*font-size:\s*\.8rem/.test(consumerSrc) &&
    /\.cplfund-prio \.p \.desc \{[^}]*font-size:\s*\.8rem/.test(consumerSrc) &&
    /\.cplfund-prio \.p \.metric \{[^}]*font-size:\s*\.8rem/.test(consumerSrc));
  check("strategies list + timing rows also carry the unified size",
    /\.cplfund-strat \{[^}]*font-size:\s*\.8rem/.test(consumerSrc) &&
    /\.cplfund-timing \{[^}]*font-size:\s*\.8rem/.test(consumerSrc));
  check("the priority TITLE stays larger than the body copy (1rem)",
    /\.cplfund-prio-title-input \{[^}]*font-size:\s*1rem/.test(consumerSrc) &&
    /\.cplfund-prio \.p h4 \{[^}]*font-size:\s*1rem/.test(consumerSrc));
}

// C10 — failure mode: data never arrives (404 → loadScript fails soft).
{
  const { window } = freshDom();
  window.eval(consumerSrc);
  let threw = false;
  try {
    window.CPL_FUNDING_TAB.boot();
    const s = window.document.querySelector('script[src="cpl_funding_data.js"]');
    s.dispatchEvent(new window.Event("error"));
  } catch (e) { threw = true; console.error(e); }
  check("missing-data boot does not throw", !threw);
  check("missing-data renders graceful empty state",
    window.document.getElementById("cplFundingMount").textContent.indexOf("unavailable") !== -1);
  check("DRAFT chip shows even in the no-data state", !!window.document.getElementById("cplFundingDraftChip"));
}

finish();
