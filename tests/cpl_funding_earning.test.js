// CPL Implementation Funding tab — achievement-based earning under ONE POOL,
// plus the column menus and the expand's per-priority detail (Parts E, F, G).
//
// Allocation = MAX AWARD and an institution earns against it. Ported to the
// one-pool model (adopted 2026-08-31): one combined award per institution,
// decomposed into a CREDIT share (earns on the credit priorities, advances
// included) and a NONCREDIT share (earns ONLY on the noncredit measures —
// listed from day one, $0 until those feeds report (F1), NEVER an advance).
// The Yr/Total money columns and the P1/P2/P3 table columns are retired; the
// earning story now rides the CR award / NC award cells and each row's expand
// (the 7-column .cplfund-dtl-table). The POLICY guards are unchanged: an
// advance must never masquerade as achievement, a suppressed cell is never
// blind-credited, and earned splits into measured + advance that reconstitute.
//
// One of nine suites the 2,955-line cpl_funding.test.js was split into on
// 2026-08-20, after it stopped fitting in a 12 GB heap. Shared setup + the
// jsdom helpers live in tests/lib/cpl_funding_harness.js, which also carries the
// measurements behind the split and the per-window memory budget for anyone
// adding to these files.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_earning.test.js`).
const {
  check,
  freshDom,
  boot,
  greenSlices,
  pieSlices,
  D,
  finish,
} = require("./lib/cpl_funding_harness.js");

// The three noncredit-only rows ride the one roster keyed by their shorts
// (Mt. SAC NC rides the Mt San Antonio row and is NOT a key).
const TRIO = ["NOCE", "SD Cont. Ed", "Calbright"];

// ─────────────────────────────────────────────────────────────────────────────
// Part E — achievement-based earning (Sam, 2026-07-24; one-pool form
// 2026-08-31): the award is a CAP and an institution is paid on the CPL it
// actually posts in MAP, proportional to target, capped at 100%; unearned rolls
// forward. Phase-in: data-gap CREDIT metrics advance at full cap; a college
// that posts nothing on a MEASURABLE metric earns $0 (the incentive). The
// NONCREDIT share advances NEVER — it reads $0 until its feeds report (F1).
// Default data order: Year-1 P1 ("any transcribed") is the one measurable
// metric; P2 (+ all of Year 2) are data gaps. P3 (Portal) is now a measurable
// metric (→ pp); Part E overrides it to a data gap so its "only P1 flexes"
// model holds — the pp/achievement-based path is exercised in Part H5.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-07-24", suppress_below: 5,
    statewide: { p2: 9000, p3: 16807 },
    colleges: { "Laney": { p2: 120, p3: 200 }, "Yuba": { p2: 6, p3: null, p3_suppressed: true } },
    unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  // Pin all three Year-1 metrics so exactly ONE (P1) is measurable and flexes —
  // that is what this block verifies. Inheriting the baked defaults broke it on
  // 2026-07-30 when P1's live metric became the ELIGIBLE headcount (`pe`, absent
  // from this fixture) and P2 became the measurable transcribed one.
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: "Headcount of students with transcribed CPL credit for at least one course." },
    "1": { metric: "Headcount with Eligible CPL Based on Statewide Credit Recommendations" },
    "2": { metric: "Headcount with CPL Matched in MAP and MIS" }
    },
    "2": {
      // Pin Year 2 to NAMED GAPS. Inheriting the bake made these tests
      // hostage to it: Y2 P1 "Units of Transcribed CPL" flipped from a gap
      // to a real unit measure on 2026-07-31 and silently changed the
      // earned totals these assertions are about.
      "0": { metric: "Headcount with CPL Matched in MAP and MIS" },
      "1": { metric: "Headcount with Completion and 3+ Transcribed CPL Units" },
      "2": { metric: "Headcount with CPL Matched in MAP and MIS" }
    }
  } });
  T.render();

  // The Potential⇄Earned basis TOGGLE was RETIRED 2026-07-30 (Sam): both numbers
  // now ride in every money cell, so there is no mode to get stuck in and the
  // money columns can no longer disagree invisibly with the earning figures.
  check("E: the Potential/Earned basis toggle is gone (no mode to get stuck in)",
    !doc.querySelector("#cplFundBasis") && !("basis" in T._state));
  const potRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find(function (r) { return /Laney/.test(r.textContent); });
  const awardCells = potRow.querySelectorAll("td.cf-award");
  check("E: one row carries the CR award / NC award pair (the retired Total/Yr columns' successor)",
    awardCells.length === 2);
  check("E: the CR award cell stacks the max award over the earning figure, unconditionally",
    !!awardCells[0].querySelector(".sub") &&
    // ⚠️ "earning", not "earned" (Sam, 2026-08-27): the money is not a done deal
    // until the college qualifies, and the past tense read like a settled award.
    // Asserted BOTH ways so a revert to the past tense fails rather than passing
    // on a loose /earn/ match.
    (function (t) { return /earning/i.test(t) && !/\bearned\b/i.test(t); })(
      awardCells[0].querySelector(".sub").textContent));
  check("E: the NC award cell carries its own sub-line — '$0 until feeds report' (F1, never an advance)",
    !!awardCells[1].querySelector(".sub") &&
    /\$0 until feeds report/.test(awardCells[1].textContent));

  const la = T._alloc("Laney");   // in-feed, underachieving on the measurable P1
  const f = Math.min(1, 200 / la.p1_heads);
  // One pool: the earn base for the credit priorities is the CREDIT SHARE of
  // the one award (cr_award), never the combined total — the noncredit share
  // is restricted to the noncredit measures and reads $0 today.
  check("E: in-feed underachiever earns its credit share − the Year-1 P1 shortfall (earned = crCap × actual/target)",
    Math.abs(la.earned_total - (la.cr_award - la.p1 * (1 - f))) < 1);
  check("E: the noncredit share is NOT advanced into the earned figure (earned_nc = $0 today — F1)",
    la.earned_nc === 0 && la.earned_total <= la.cr_award + 0.5);
  check("E: earned is strictly below the combined max award when underachieving, and positive",
    la.earned_total < la.total && la.earned_total > 0);

  const bc = T._alloc("Berkeley City");   // NOT in the feed → $0 on the measurable P1
  check("E: a college absent from the feed earns $0 on the measurable priority (= credit share − P1)",
    Math.abs(bc.earned_total - (bc.cr_award - bc.p1)) < 1);

  // The earned / unearned / balance POOL CARDS were consolidated into the
  // Summary at the top (R11, ruled 2026-08-31) — the boxes are retired and the
  // same readout rides .cplfund-summary, advances named so it reads honestly.
  check("E: the earned/unearned pool cards are retired (R11) — the Summary carries the readout",
    !doc.querySelector(".cplfund-card.earned") && !doc.querySelector(".cplfund-card.unearned") &&
    (function (s) {
      return !!s && /earned so far/.test(s.textContent) && /unearned rolls forward/.test(s.textContent);
    })(doc.querySelector(".cplfund-summary")));

  const pcards = doc.querySelectorAll(".cplfund-prio .p");
  check("E: measurable priority card shows a Current Total line (not full advance)",
    pcards[0].textContent.indexOf("Current Total") !== -1 && pcards[0].textContent.indexOf("full advance") === -1);
  check("E: data-gap priority cards show full advance until the feed lands",
    pcards[1].textContent.indexOf("full advance") !== -1 && pcards[2].textContent.indexOf("full advance") !== -1);

  const crTxt = awardCells[0].textContent;
  check("E: the CR award cell carries BOTH the max award and the earning figure",
    (crTxt.match(/\$/g) || []).length >= 2 && /earning/i.test(crTxt) && !/\bearned\b/i.test(crTxt));
  check("E: the CR award cell hover breaks earning into measured / advance",
    /measured|advance/.test(awardCells[0].getAttribute("title") || ""));

  // Earned splits TWO ways since the guaranteed rural slice was retired
  // (2026-08-22), and the parts must reconstitute the whole — this is what keeps
  // an ADVANCE from silently reading as achievement.
  check("E: earned splits into measured + advance, summing to earned_total",
    la.earned_guaranteed === undefined &&
    Math.abs((la.earned_measured + la.earned_advance) - la.earned_total) < 1);
  check("E: the data-gap priorities land in the ADVANCE bucket, not measured",
    la.earned_advance > 0);
  check("E: the advance is visibly TAGGED in the cell (adv chip), so it cannot read as achievement",
    /adv/.test(awardCells[0].textContent));

  const csv = T._csv().split("\r\n");
  check("E: CSV always carries Earned + % of max award columns",
    csv[1].indexOf("Earned ") !== -1 && csv[1].indexOf("% of max award") !== -1);
  check("E: CSV carries the measured/advance split, not just a lump earned figure",
    csv[1].indexOf("Earned: measured") !== -1 && csv[1].indexOf("Earned: advance") !== -1);
  check("E: CSV meta describes max-awards-with-earned rather than a basis mode",
    csv[0].indexOf("earned-to-date") !== -1 && csv[0].indexOf("EARNED basis") === -1);
}
{
  // Capped at 100%: an overachiever earns its FULL credit share (never more) —
  // and the combined award still shows the gap that is its NONCREDIT share,
  // which no amount of credit overachievement may draw (the restriction).
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-07-24", suppress_below: 5,
    statewide: { p3: 16807 }, colleges: { "Laney": { p3: 9999999 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: "Headcount of students with transcribed CPL credit for at least one course." },
    "1": { metric: "Headcount with Eligible CPL Based on Statewide Credit Recommendations" },
    "2": { metric: "Headcount with CPL Matched in MAP and MIS" }
    },
    "2": {
      "0": { metric: "Headcount with CPL Matched in MAP and MIS" },
      "1": { metric: "Headcount with Completion and 3+ Transcribed CPL Units" },
      "2": { metric: "Headcount with CPL Matched in MAP and MIS" }
    }
  } });
  T.render();
  const la = T._alloc("Laney");
  check("E: overachiever is capped at 100% of its CREDIT share (earned == cr_award)",
    Math.abs(la.earned_total - la.cr_award) < 1);
  check("E: …and the credit program cannot draw the noncredit share (total − earned == nc_award)",
    Math.abs((la.total - la.earned_total) - la.nc_award) < 1);
  // Row expands are keyed "c:<college>" since the one-pool port (was "c:<order>").
  T._state.open["c:Laney"] = true;
  T.render();
  const det = doc.querySelector("tr.cplfund-detail");   // only Laney is open
  check("E: drill-in shows the per-priority earning detail (7-column table, Current Total column)",
    !!det && !!det.querySelector(".cplfund-dtl-table") &&
    /Current Total: \$[\d,]+/.test(det.querySelector(".cplfund-dtl-table caption").textContent) &&
    Array.from(det.querySelectorAll(".cplfund-dtl-table th")).some(function (h) { return /Current Total/.test(h.textContent); }));
}
{
  // Feed not loaded → the CREDIT priorities advance at full cap (transient), so
  // earned == the credit share. The NONCREDIT share must NOT ride along: its
  // measures have never been in the feed, so it reads $0 — undelivered ≠ a slow
  // refresh, and it never advances (F1 / N2 b).
  const { window } = freshDom();
  boot(window);   // no CPL_FUNDING_PERF
  const T = window.CPL_FUNDING_TAB;
  T.render();
  const la = T._alloc("Laney");
  check("E: feed not loaded → credit advances at full cap (earned == cr_award)",
    Math.abs(la.earned_total - la.cr_award) < 1);
  check("E: …but the noncredit share does NOT advance with it (earned_nc == $0)",
    la.earned_nc === 0 && la.total - la.earned_total > la.nc_award - 1);
}
{
  // Suppressed (<5): earns $0 on the measurable priority + is flagged, not blind-credited.
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-07-24", suppress_below: 5,
    statewide: { p3: 16807 }, colleges: { "Yuba": { p3: null, p3_suppressed: true } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: "Headcount of students with transcribed CPL credit for at least one course." },
    "1": { metric: "Headcount with Eligible CPL Based on Statewide Credit Recommendations" },
    "2": { metric: "Headcount with CPL Matched in MAP and MIS" }
    },
    "2": {
      "0": { metric: "Headcount with CPL Matched in MAP and MIS" },
      "1": { metric: "Headcount with Completion and 3+ Transcribed CPL Units" },
      "2": { metric: "Headcount with CPL Matched in MAP and MIS" }
    }
  } });
  T.render();
  const yu = T._alloc("Yuba");
  check("E: suppressed college earns $0 on the measurable priority (= credit share − P1)",
    Math.abs(yu.earned_total - (yu.cr_award - yu.p1)) < 1);
  T._state.open["c:Yuba"] = true;
  T.render();
  const det = doc.querySelector("tr.cplfund-detail");   // only Yuba is open
  // The drill-in's Actual cell masks the count (<5) and names privacy — the
  // suppression is FLAGGED, never rendered as a measured zero or blind-credited.
  check("E: suppressed shows the masked count + a privacy flag in the drill-in",
    !!det && det.textContent.indexOf("(privacy)") !== -1 && det.textContent.indexOf("<5") !== -1);
}
{
  // Conservation over the ONE ROSTER (118 institutions, trio included):
  // earned ≤ the combined max award for every row, and the system earned stays
  // inside the pool. The trio must hold at $0 — no advances on origination (N2 b).
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-07-24", suppress_below: 5,
    statewide: { p3: 16807 }, colleges: { "Laney": { p3: 200 }, "Alameda": { p3: 80 } }, unmatched: {} };
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  T.render();
  const names = D.colleges.map(function (c) { return c.college; }).concat(TRIO);
  let capSum = 0, earnSum = 0, everOver = false;
  names.forEach(function (n) {
    var a = T._alloc(n);
    capSum += a.total; earnSum += a.earned_total;
    if (a.earned_total > a.total + 1) everOver = true;
  });
  check("E: no institution ever earns above its combined max award", !everOver);
  check("E: system earned ≤ system max awards and > 0", earnSum <= capSum + 1 && earnSum > 0);
  check("E: the noncredit-only trio earn $0 today — no advances on origination (N2 b)",
    TRIO.every(function (n) { return T._alloc(n).earned_total === 0; }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part F — column show/hide (Sam, 2026-07-24; one-pool columns 2026-08-31): a
// ⚙ Columns menu; District AND the county context hidden by default (the locked
// mock's default view); per-view + persisted; CSS nth-child hiding that spares
// detail rows; the identity column (Institution) is never hideable. Plus the
// Elig tooltip audit (the column is ON by default — Sam's R10 veto).
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  check("F: ⚙ Columns menu renders", !!doc.querySelector(".cplfund-colmenu"));
  const keys = Array.from(doc.querySelectorAll(".cplfund-colmenu input[data-colkey]")).map(function (cb) { return cb.getAttribute("data-colkey"); });
  check("F: the Institution identity column is NOT hideable (absent from the menu)", keys.indexOf("college") === -1);
  check("F: other columns are hideable (district, the FTES pair, the award pair)",
    keys.indexOf("district") !== -1 && keys.indexOf("cr_ftes") !== -1 && keys.indexOf("nc_ftes") !== -1 &&
    keys.indexOf("cr_award") !== -1 && keys.indexOf("nc_award") !== -1);
  check("F: no retired money column lingers in the menu (total/combined/yr — R6/R7)",
    keys.indexOf("total") === -1 && keys.indexOf("combined") === -1 && keys.indexOf("y1") === -1);
  const waCb = doc.querySelector('.cplfund-colmenu input[data-colkey="working_adults"]');
  check("F: county (working adults) is unchecked/hidden by default", !!waCb && !waCb.checked);
  const distCb = doc.querySelector('.cplfund-colmenu input[data-colkey="district"]');
  check("F: District is unchecked/hidden by default too (the mock's default view)", !!distCb && !distCb.checked);
  const style0 = doc.querySelector("#cplFundTable style");
  check("F: a hide <style> is injected for both default-hidden columns (District 3rd, county 9th)",
    !!style0 && /nth-child\(3\)/.test(style0.textContent) && /nth-child\(9\)/.test(style0.textContent));
  check("F: the hide rule excludes detail rows so a drill-in never collapses",
    style0.textContent.indexOf(":not(.cplfund-detail)") !== -1);

  // Toggle District back ON, then OFF again — the rule follows, and the choice persists.
  distCb.checked = true; distCb.dispatchEvent(new window.Event("change", { bubbles: true }));
  const style1 = doc.querySelector("#cplFundTable style");
  check("F: re-showing District removes its nth-child(3) hide rule",
    !!style1 && style1.textContent.indexOf("nth-child(3)") === -1);
  const distCb2 = doc.querySelector('.cplfund-colmenu input[data-colkey="district"]');
  distCb2.checked = false; distCb2.dispatchEvent(new window.Event("change", { bubbles: true }));
  const style2 = doc.querySelector("#cplFundTable style");
  check("F: hiding District re-injects the nth-child(3) hide rule",
    !!style2 && style2.textContent.indexOf("nth-child(3)") !== -1);
  check("F: the column choice persists to localStorage",
    JSON.parse(window.localStorage.getItem("cplfund_cols_v1")).college.district === true);

  const eligTh = doc.querySelector('#cplFundTable th[data-sort="elig"]');
  check("F: the Elig column renders by default (Sam's R10 veto) and its tooltip clarifies participate-vs-earn",
    !!eligTh && (eligTh.getAttribute("title") || "").indexOf("PARTICIPATE") !== -1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part G — the per-priority target/actual detail + the numbered Elig pie glyph
// (Sam, 2026-07-24). The P1/P2/P3 TABLE COLUMNS are retired (one-pool port,
// 2026-08-31) — the same target-over-actual detail now lives in each row's
// expand as the 7-column .cplfund-dtl-table, one ROW per priority.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-07-24", suppress_below: 5,
    statewide: { p3: 16807 }, colleges: { "Laney": { p3: 200 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: "Headcount of students with transcribed CPL credit for at least one course." },
    "1": { metric: "Headcount with Eligible CPL Based on Statewide Credit Recommendations" },
    "2": { metric: "Headcount with CPL Matched in MAP and MIS" }
    },
    "2": {
      "0": { metric: "Headcount with CPL Matched in MAP and MIS" },
      "1": { metric: "Headcount with Completion and 3+ Transcribed CPL Units" },
      "2": { metric: "Headcount with CPL Matched in MAP and MIS" }
    }
  } });
  T.render();
  check("G: the retired P1/P2/P3 table columns are gone (per-priority detail lives in the expand)",
    !doc.querySelector("#cplFundTable td.cf-prio") && !doc.querySelector('th[data-sort="prio0"]'));
  T._state.open["c:Laney"] = true;
  T.render();
  const dtl = doc.querySelector("tr.cplfund-detail .cplfund-dtl-table");
  const rows = dtl ? Array.from(dtl.querySelectorAll("tr")).slice(1) : [];
  check("G: the expand renders one detail row per priority (three)", rows.length === 3);
  const cells = function (i) { return Array.from(rows[i].querySelectorAll("td")).map(function (td) { return td.textContent; }); };
  check("G: the detail table stacks a Target column beside an Actual column",
    Array.from(dtl.querySelectorAll("th")).map(function (h) { return h.textContent; }).join("|").indexOf("Target|Actual") !== -1);
  check("G: the measurable P1 row shows the actual + a % of target",
    cells(0)[4].indexOf("200") !== -1 && cells(0)[4].indexOf("%") !== -1);
  check("G: a data-gap priority row reads 'data gap' in its Actual cell (and says it advances)",
    cells(1)[4].indexOf("data gap") !== -1 && cells(1)[4].indexOf("advances") !== -1);
  check("G: the priority rows carry funding ($ figures) alongside the measures",
    /\$/.test(cells(0)[1]) && /\$/.test(cells(0)[6]));
  // The metric itself stays visible where the priority is defined — the card's
  // METRIC block (the retired column-header hover's successor).
  check("G: each priority card carries its METRIC block",
    doc.querySelectorAll(".cplfund-prio .p .metric").length === 3 &&
    /METRIC/.test(doc.querySelector(".cplfund-prio .p .metric").textContent));
  // The Elig pie: a college meeting both tracked reqs shows 2 numbered green slices.
  T._setElig({ coordOk: true, coord: { "Laney": true }, optin: { "Laney": true }, asOf: "2026-07-24" });
  T.render();
  const laney2 = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find(function (r) { return /Laney/.test(r.textContent); });
  const pie = laney2.querySelector(".cf-eligpie");
  check("G: the Elig glyph is an SVG pie", !!pie && pie.tagName.toLowerCase() === "svg");
  check("G: the pie has one numbered slice per tracked requirement, all green when met",
    pieSlices(laney2) === 2 && greenSlices(laney2) === 2 &&
    Array.from(pie.querySelectorAll("text")).map(function (t) { return t.textContent; }).join("") === "12");
}

// ─────────────────────────────────────────────────────────────────────────────

finish();
