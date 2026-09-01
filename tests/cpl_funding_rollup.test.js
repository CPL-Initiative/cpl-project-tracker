// CPL Implementation Funding tab — renderer behaviour, part 2 (C8–C10).
//
// District rollup + drill-ins + the SYSTEM row's conservation, metric-
// measurability actuals, and the failure mode where the data never arrives
// (404 -> loadScript fails soft). Continues Part C of the original file,
// ported to the one-pool model (adopted 2026-08-31): ONE row per institution
// over the 118-row roster, a CR award / NC award pair instead of the Yr/Total
// columns, per-priority detail in each row's expand instead of P1/P2/P3 table
// columns, and the allocation-balance box consolidated into the Summary (R11).
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

const NET = 25240308;   // the one pool (pinned to the model by the anchor suite)
// First $-figure in a cell (the max award; the earning sub-line comes after).
function firstMoney(el) {
  const m = (el ? el.textContent : "").match(/\$[\d,]+/);
  return m ? Number(m[0].replace(/[$,]/g, "")) : NaN;
}
// Minimal CSV splitter honoring double-quoted fields (csvEscape's shape).
function splitCsv(line) {
  const out = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
// The one-pool roster's district set: the 115 college rows plus the
// noncredit-only rows (Calbright carries none → "(no district)"; Mt. SAC NC
// rides the Mt San Antonio row and adds nothing). Recomputed from the data so
// the expected group count never trusts the code it is checking.
const DISTRICTS = (function () {
  const s = new Set(D.colleges.map(function (c) { return c.district || "(no district)"; }));
  (D.feeders || []).forEach(function (f) {
    if (f.nc_ftes_on_credit_row) return;
    const ph = Number(f.noncredit_ftes_placeholder);
    const basis = (isFinite(ph) && ph > 0) ? ph : (Number(f.noncredit_ftes) || 0);
    if (basis > 0) s.add(f.district || "(no district)");
  });
  return s;
})();

// C8 — district rollup + drill-ins + SYSTEM conservation (feature parity).
{
  const { window } = freshDom();
  const doc = boot(window);
  // Drill-in: one row per institution; a click opens the expand, whose
  // 7-column detail table replaced the in-row P1/P2/P3 math (2026-08-31).
  click(window, doc.querySelector("tr.cplfund-row"));
  let detail = doc.querySelector("tr.cplfund-detail");
  check("college drill-in renders a detail row with per-priority math",
    detail && detail.textContent.indexOf("Priority 1") !== -1 && detail.textContent.indexOf("share") !== -1);
  check("drill-in carries the 7-column detail table (Current Total / Total Possible)",
    !!detail.querySelector(".cplfund-dtl-table") &&
    Array.from(detail.querySelectorAll(".cplfund-dtl-table th")).map(function (h) { return h.textContent; })
      .join("|").indexOf("Current Total|Total Possible") !== -1);
  // The active year's metric moved from the drill-in to the priority CARDS —
  // still one click away, and the card is the surface the curator edits.
  check("the active year's metric shows on the priority cards (the drill-in's metric line moved there)",
    doc.querySelectorAll(".cplfund-prio .p .metric").length === 3);
  click(window, doc.querySelector("tr.cplfund-row"));
  check("re-click collapses the drill-in", !doc.querySelector("tr.cplfund-detail"));

  // SYSTEM row conservation: the ONE SYSTEM row's CR/NC pair must reconstitute
  // the pool — the per-year tranche under Annual funding, the full window under
  // Combined funding (the retired Yr1/Yr2/Total columns' invariants, on the
  // pair). ±$2 = two independently rounded cells.
  const sysCells = function () { return doc.querySelector("tr.cplfund-systemrow").querySelectorAll("td.cf-award"); };
  check("ONE SYSTEM row renders (R6), carrying the CR/NC award pair",
    doc.querySelectorAll("tr.cplfund-systemrow").length === 1 && sysCells().length === 2);
  check("SYSTEM pair under Annual funding = the per-year tranche ($" + Math.round(NET / 2).toLocaleString("en-US") + ")",
    Math.abs((firstMoney(sysCells()[0]) + firstMoney(sysCells()[1])) - NET / 2) <= 2);
  click(window, doc.querySelector('#cplFundDisb button[data-val="frontload"]'));
  check("SYSTEM pair under Combined funding = the full pool ($" + NET.toLocaleString("en-US") + ")",
    Math.abs((firstMoney(sysCells()[0]) + firstMoney(sysCells()[1])) - NET) <= 2);
  click(window, doc.querySelector('#cplFundDisb button[data-val="even"]'));

  // GROUP BY DISTRICT (Sam, 2026-07-30) replaced the Colleges|Districts VIEW
  // toggle. The old toggle REPLACED the college rows, so the per-college
  // numbers a curator wanted to compare vanished behind a drill-in. Grouping
  // keeps every institution row visible and only ADDS district subtotal headers
  // — the trio group under their own districts (Calbright none).
  const distinct = DISTRICTS.size;
  const flatN = doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row").length;
  check("the flat list is the whole 118-institution roster", flatN === D.colleges.length + 3);
  check("the retired Colleges|Districts view toggle is gone", !doc.querySelector("#cplFundView"));
  click(window, doc.querySelector('#cplFundGroup button[data-val="district"]'));
  const hdrs = doc.querySelectorAll("#cplFundTable tbody tr.cplfund-grouphdr");
  check("grouping adds one district header per district (" + distinct + ")", hdrs.length === distinct);
  check("grouping KEEPS every institution row visible (the point of retiring the toggle)",
    doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row").length === flatN);
  // Subtotals conserve the size column (credit FTES — each header's cell is
  // independently rounded, so tolerance = one dollar per header).
  const listCrFtes = D.colleges.reduce(function (s, c) { return s + (c.credit_ftes || 0); }, 0);
  const gCrFtes = Array.from(hdrs).reduce(function (s, tr) {
    return s + (Number(tr.querySelectorAll("td")[1].textContent.replace(/,/g, "")) || 0);
  }, 0);
  check("district subtotals conserve the roster's credit FTES", Math.abs(gCrFtes - listCrFtes) <= distinct);
  // Groups are ordered by their subtotal, largest first (Sam's explicit call).
  // The subtotal now reads as the CR/NC award pair on each header row.
  const gTotals = Array.from(hdrs).map(function (tr) {
    const aw = tr.querySelectorAll("td.cf-award");
    return firstMoney(aw[0]) + firstMoney(aw[1]);
  });
  check("district groups are ordered by subtotal, largest first",
    gTotals.every(function (v, i) { return i === 0 || gTotals[i - 1] >= v - 2; }));
  // Σ district subtotal pairs == the pool's tranche (conservation across the grouping).
  check("Σ district subtotal pairs == the annual tranche of the one pool",
    Math.abs(gTotals.reduce(function (a, b) { return a + b; }, 0) - NET / 2) < distinct * 2 + 2);
  check("each header labels itself a district subtotal",
    /district subtotal/.test(hdrs[0].textContent));
  // A drill-in still works while grouped.
  click(window, doc.querySelector("#cplFundTable tr.cplfund-row"));
  check("an institution drill-in still opens while grouped", !!doc.querySelector("tr.cplfund-detail"));
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
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: "Headcount of students with transcribed CPL credit for at least one course." },
    "1": { metric: "Headcount with Eligible CPL Based on Statewide Credit Recommendations" },
    "2": { metric: "Headcount with Transcribed Credit from either CPL Portal or CPL Landing Page" }
  } } });
  T.render();
  check("Y1-P1 card hints actuals arrive with the daily refresh (measurable metric)",
    doc.querySelector(".cplfund-prio .p").textContent.indexOf("next daily data refresh") !== -1);
  check("Y1-P2 card carries the exhibit-linkage data-gap label",
    doc.querySelectorAll(".cplfund-prio .p")[1].textContent.indexOf("data gap") !== -1 &&
    doc.querySelectorAll(".cplfund-prio .p")[1].textContent.indexOf("STATEWIDE credit recommendation") !== -1);
  check("Y1-P3 (Portal/Landing) is no longer a hard data gap — it's the wired portal metric",
    doc.querySelectorAll(".cplfund-prio .p")[2].textContent.indexOf("data gap") === -1 &&
    doc.querySelectorAll(".cplfund-prio .p")[2].textContent.indexOf("Portal") !== -1);
  // Per-priority detail (the expand — the P-columns' successor): the
  // exhibit-linkage P2 row reads "data gap"; the wired-but-feedless P3 row
  // reads pending — both say they advance, neither reads as a measured zero.
  T._state.open["c:" + D.colleges[0].college] = true;
  T.render();
  const dtl = doc.querySelector("tr.cplfund-detail .cplfund-dtl-table");
  const act = function (i) {
    return Array.from(dtl.querySelectorAll("tr"))[i + 1].querySelectorAll("td")[4].textContent;
  };
  check("P2 (exhibit-linkage) detail reads 'data gap'; P3 (portal, feed pending) reads 'pending' not 'gap'",
    act(1).indexOf("data gap") !== -1 &&
    act(2).indexOf("pending") !== -1 && act(2).indexOf("gap") === -1);
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
  const T = window.CPL_FUNDING_TAB;
  // Pin P1 to the any-transcribed metric this fixture's p3 numbers are written
  // for (the baked default is now the ELIGIBLE metric → pe).
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: "Headcount of students with transcribed CPL credit for at least one course." }
  } } });
  T.render();
  const p1card = doc.querySelectorAll(".cplfund-prio .p")[0];
  check("Y1-P1 card shows the any-transcribed statewide actual vs target",
    p1card.textContent.indexOf("20,000") !== -1 && p1card.textContent.indexOf("of target") !== -1);
  // The SYSTEM row's P-columns are retired; the deduplicated statewide actual
  // still exports on the CSV's SYSTEM line (never the column sum).
  const csvLines = T._csv().split("\r\n").map(splitCsv);
  const head = csvLines[1];
  const iP1a = head.indexOf("P1 actual");
  const sysLine = csvLines.find(function (f) { return /SYSTEM/.test(f[1] || ""); });
  check("the CSV SYSTEM line carries the deduplicated statewide P1 actual (20,000)",
    iP1a >= 0 && !!sysLine && Number(sysLine[iP1a]) === 20000);
  check("the retired P1/P2/P3 table columns are gone (absence guard, 2026-08-31)",
    !doc.querySelector('th[data-sort="prio0"]') && !doc.querySelector("#cplFundTable td.cf-prio"));
  check("footer explains the per-priority target/actual detail + dedup",
    // case-insensitive: the footer names the expand's Target/Actual COLUMNS
    // since the P-columns sentence was rewritten (2026-09-01)
    footText(doc).indexOf("deduplicate across colleges") !== -1 &&
    /target/i.test(footText(doc)) && /actual/i.test(footText(doc)));
  check("a non-empty unmatched bucket is surfaced in the footer",
    footText(doc).indexOf("Mystery University") !== -1);
  // Alameda's expand: the P1 detail row stacks the actual (300) under its target.
  T._state.open["c:Alameda"] = true;
  T.render();
  const alaRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find(function (tr) { return tr.getAttribute("data-id") === "c:Alameda"; });
  const alaDtl = alaRow.nextElementSibling.querySelector(".cplfund-dtl-table");
  check("Alameda's P1 detail row shows the any-transcribed actual (300) beside its target",
    Array.from(alaDtl.querySelectorAll("tr"))[1].querySelectorAll("td")[4].textContent.indexOf("300") !== -1);
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

// C9c — the target line.
//
// ⚠️ THIS ASSERTION WAS DELIBERATELY NARROWED, not fixed (Sam, 2026-08-28):
// "Remove most of the added explanatory language such as ... '(≈ 84,640 semester
// units — DERIVED; a performance target only, it does not move or cap the
// funding)'." The sentence this used to require is the sentence he asked to
// delete, so requiring it would pin the card to a ruling that has been reversed.
//
// What survives is the fact the prose was there to protect: the TARGET and the
// ALLOCATION SHARE are two different quantities, both stated, and the target is
// never presented as the funding. A card that printed only one of them, or that
// denominated the target in dollars, still fails here.
//
// C9d — the allocation balance moved into the SUMMARY (R11, ruled 2026-08-31):
// the balance box is retired and the over/under readout rides .cplfund-summary.
{
  const { window } = freshDom();
  const doc = boot(window);
  const card = doc.querySelector(".cplfund-prio .p");
  const box = card.textContent;
  check("the card states the allocation share and the target as separate figures",
    /Allocation share/.test(box) && /Target|per student/.test(box));
  check("the target is never denominated in dollars",
    !/Target\s*\$/.test(card.innerHTML.replace(/<[^>]*>/g, "")));

  // C9d — the balance readout, now in the Summary.
  check("the balance boxes are retired (R11) — no .cplfund-card.balance renders",
    !doc.querySelector(".cplfund-card.balance"));
  // The balanced line's WORDING is being polished live; the durable tokens are
  // the OK state and Sam's funding vocabulary ("fully allocated" — never
  // "spent"/"apportioned" for this split, 2026-08-31).
  const sum0 = doc.querySelector(".cplfund-summary");
  check("at 100% shares the Summary reads as the OK state and says fully allocated",
    !!sum0 && /fully allocated/.test(sum0.textContent) && !!sum0.querySelector(".ok") &&
    !sum0.querySelector(".warn"));
  // Push the shares past 100% → over-allocated, warned, and quantified.
  commit(window, doc.querySelector('input[data-edit="share"][data-slot="1"][data-idx="0"]'), "60");
  const sum1 = doc.querySelector(".cplfund-summary");
  check("shares over 100% flag the Summary as over-allocated (warn styling)",
    !!sum1 && /Over-allocated/.test(sum1.textContent) && !!sum1.querySelector(".warn"));
  check("over-allocated Summary names the overage + the >100% share sum",
    /130%/.test(sum1.textContent) && /over/.test(sum1.textContent) &&
    /\$[\d,]+ over/.test(sum1.textContent.replace(/\s+/g, " ")));
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
