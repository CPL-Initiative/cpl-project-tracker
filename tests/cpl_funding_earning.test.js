// CPL Implementation Funding tab — achievement-based earning + the column menus (Parts E-earning, F, G).
//
// Allocation = CAP and a college earns against it; the ⚙ Columns menu; and the
// per-priority P1/P2/P3 columns (target over actual).
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

// ─────────────────────────────────────────────────────────────────────────────
// Part E — achievement-based earning (Sam, 2026-07-24): allocation = CAP; a
// college is paid on the CPL it actually posts in MAP, proportional to target,
// capped at 100%; unearned rolls forward. Phase-in: data-gap metrics advance at
// full cap; a college that posts nothing on a MEASURABLE metric earns $0 (the
// incentive). Default data order: Year-1 P1 ("any transcribed") is the one
// measurable metric; P2 (+ all of Year 2) are data gaps. P3 (Portal) is now a
// measurable metric (→ pp); Part E overrides it to a data gap so its "only P1
// flexes" model holds — the pp/achievement-based path is exercised in Part H5.
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
  // money columns can no longer disagree invisibly with the P-cells.
  check("E: the Potential/Earned basis toggle is gone (no mode to get stuck in)",
    !doc.querySelector("#cplFundBasis") && !("basis" in T._state));
  const potRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find(function (r) { return /Laney/.test(r.textContent); });
  check("E: the Total cell stacks the cap over the earned figure, unconditionally",
    !!potRow.querySelector("td.tot .sub") &&
    /earned/i.test(potRow.querySelector("td.tot .sub").textContent));
  check("E: the year cells stack earned under the cap too",
    !!potRow.querySelector("td:not(.tot) .sub"));

  const la = T._alloc("Laney");   // in-feed, underachieving on the measurable P1
  const f = Math.min(1, 200 / la.p1_heads);
  check("E: in-feed underachiever earns cap − its Year-1 P1 shortfall (earned = cap × actual/target)",
    Math.abs(la.earned_total - (la.total - la.p1 * (1 - f))) < 1);
  check("E: earned is strictly below cap when underachieving, and positive",
    la.earned_total < la.total && la.earned_total > 0);

  const bc = T._alloc("Berkeley City");   // NOT in the feed → $0 on the measurable P1
  check("E: a college absent from the feed earns $0 on the measurable priority (= cap − P1)",
    Math.abs(bc.earned_total - (bc.total - bc.p1)) < 1);

  check("E: earned + unearned pool cards always render",
    !!doc.querySelector(".cplfund-card.earned") && !!doc.querySelector(".cplfund-card.unearned"));

  const pcards = doc.querySelectorAll(".cplfund-prio .p");
  check("E: measurable priority card shows an earned-so-far line (not full advance)",
    pcards[0].textContent.indexOf("Earned so far") !== -1 && pcards[0].textContent.indexOf("full advance") === -1);
  check("E: data-gap priority cards show full advance until the feed lands",
    pcards[1].textContent.indexOf("full advance") !== -1 && pcards[2].textContent.indexOf("full advance") !== -1);

  const earnRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find(function (r) { return /Laney/.test(r.textContent); });
  const totTxt = earnRow.querySelector("td.tot").textContent;
  check("E: the Total cell carries BOTH the cap and the earned figure",
    (totTxt.match(/\$/g) || []).length >= 2 && /earned/i.test(totTxt));
  check("E: the Total cell hover breaks earned into measured / advance",
    /measured|advance/.test(earnRow.querySelector("td.tot").getAttribute("title") || ""));

  // Earned splits TWO ways since the guaranteed rural slice was retired
  // (2026-08-22), and the parts must reconstitute the whole — this is what keeps
  // an ADVANCE from silently reading as achievement.
  check("E: earned splits into measured + advance, summing to earned_total",
    la.earned_guaranteed === undefined &&
    Math.abs((la.earned_measured + la.earned_advance) - la.earned_total) < 1);
  check("E: the data-gap priorities land in the ADVANCE bucket, not measured",
    la.earned_advance > 0);

  const csv = T._csv().split("\r\n");
  check("E: CSV always carries Earned + % of cap columns",
    csv[1].indexOf("Earned ") !== -1 && csv[1].indexOf("% of cap") !== -1);
  check("E: CSV carries the measured/advance split, not just a lump earned figure",
    csv[1].indexOf("Earned: measured") !== -1 && csv[1].indexOf("Earned: advance") !== -1);
  check("E: CSV meta describes caps-with-earned rather than a basis mode",
    csv[0].indexOf("earned-to-date") !== -1 && csv[0].indexOf("EARNED basis") === -1);
}
{
  // Capped at 100%: an overachiever earns its FULL cap (never more).
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
  const la = T._alloc("Laney");
  check("E: overachiever is capped at 100% of its cap (earned == cap)", Math.abs(la.earned_total - la.total) < 1);
  window.eval('CPL_FUNDING_TAB._state.open["c:' + D.colleges.find(function (c) { return c.college === "Laney"; }).order + '"] = true;');
  T.render();
  const det = doc.querySelector("tr.cplfund-detail");   // only Laney is open
  check("E: drill-in shows the per-priority earned line", !!det && det.textContent.indexOf("earned:") !== -1);
}
{
  // Feed not loaded → everything advances at full cap (transient), earned == cap.
  const { window } = freshDom();
  const doc = boot(window);   // no CPL_FUNDING_PERF
  const T = window.CPL_FUNDING_TAB;
  T.render();
  const la = T._alloc("Laney");
  check("E: feed not loaded → earned advances at full cap (earned == cap)", Math.abs(la.earned_total - la.total) < 1);
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
  const yu = T._alloc("Yuba");
  check("E: suppressed college earns $0 on the measurable priority (= cap − P1)",
    Math.abs(yu.earned_total - (yu.total - yu.p1)) < 1);
  window.eval('CPL_FUNDING_TAB._state.open["c:' + D.colleges.find(function (c) { return c.college === "Yuba"; }).order + '"] = true;');
  T.render();
  const det = doc.querySelector("tr.cplfund-detail");   // only Yuba is open
  check("E: suppressed shows a privacy-suppressed note in the drill-in", !!det && det.textContent.indexOf("privacy-suppressed") !== -1);
}
{
  // Conservation: earned ≤ cap for every college, and the pool 'unearned' = Σ (cap − earned).
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-07-24", suppress_below: 5,
    statewide: { p3: 16807 }, colleges: { "Laney": { p3: 200 }, "Alameda": { p3: 80 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T.render();
  const D2 = window.CPL_FUNDING;
  let capSum = 0, earnSum = 0, everOver = false;
  D2.colleges.forEach(function (c) { var a = T._alloc(c.college); capSum += a.total; earnSum += a.earned_total; if (a.earned_total > a.total + 1) everOver = true; });
  check("E: no college ever earns above its cap", !everOver);
  check("E: system earned ≤ system cap and > 0", earnSum <= capSum + 1 && earnSum > 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part F — column show/hide (Sam, 2026-07-24): a ⚙ Columns menu; county hidden
// by default; per-view + persisted; CSS nth-child hiding that spares detail rows;
// the identity column (College) is never hideable. Plus the Elig tooltip audit.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  check("F: ⚙ Columns menu renders", !!doc.querySelector(".cplfund-colmenu"));
  const keys = Array.from(doc.querySelectorAll(".cplfund-colmenu input[data-colkey]")).map(function (cb) { return cb.getAttribute("data-colkey"); });
  check("F: the College identity column is NOT hideable (absent from the menu)", keys.indexOf("college") === -1);
  check("F: other columns are hideable (district, the size column, total in the menu)",
    keys.indexOf("district") !== -1 && keys.indexOf("credit_ftes") !== -1 && keys.indexOf("total") !== -1);
  const waCb = doc.querySelector('.cplfund-colmenu input[data-colkey="working_adults"]');
  check("F: county (working adults) is unchecked/hidden by default", !!waCb && !waCb.checked);
  const style0 = doc.querySelector("#cplFundTable style");
  check("F: a hide <style> is injected for the default-hidden county", !!style0 && /nth-child/.test(style0.textContent));
  check("F: the hide rule excludes detail rows so a drill-in never collapses",
    style0.textContent.indexOf(":not(.cplfund-detail)") !== -1);

  const distCb = doc.querySelector('.cplfund-colmenu input[data-colkey="district"]');
  distCb.checked = false; distCb.dispatchEvent(new window.Event("change", { bubbles: true }));
  const style1 = doc.querySelector("#cplFundTable style").textContent;
  check("F: hiding District injects an nth-child(3) hide rule", style1.indexOf("nth-child(3)") !== -1);
  check("F: the column choice persists to localStorage",
    JSON.parse(window.localStorage.getItem("cplfund_cols_v1")).college.district === true);
  distCb.checked = true; distCb.dispatchEvent(new window.Event("change", { bubbles: true }));
  const style2 = doc.querySelector("#cplFundTable style");
  check("F: re-showing District removes its hide rule",
    (style2 ? style2.textContent : "").indexOf("nth-child(3)") === -1);

  const eligTh = doc.querySelector('#cplFundTable th[data-sort="elig"]');
  check("F: Elig column tooltip clarifies the participate-vs-earn structure",
    (eligTh.getAttribute("title") || "").indexOf("PARTICIPATE") !== -1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part G — per-priority P1/P2/P3 columns (target over actual) + the numbered
// Elig pie glyph (Sam, 2026-07-24).
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
  const laney = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find(function (r) { return /Laney/.test(r.textContent); });
  const cells = laney.querySelectorAll("td.cf-prio");
  check("G: three per-priority columns render per college row", cells.length === 3);
  check("G: each priority cell stacks a target line over an actual line",
    !!cells[0].querySelector(".cf-t") && !!cells[0].querySelector(".cf-a"));
  check("G: the measurable P1 cell shows the actual + a % of target",
    cells[0].querySelector(".cf-a").textContent.indexOf("200") !== -1 && cells[0].textContent.indexOf("%") !== -1);
  check("G: a data-gap priority cell reads 'gap' in its actual line",
    cells[1].querySelector(".cf-a").textContent.indexOf("gap") !== -1);
  check("G: the priority cell carries funding (a $ figure) alongside the metric",
    /\$/.test(cells[0].textContent));
  check("G: the P1 header hover carries the priority goal + metric",
    (doc.querySelector('th[data-sort="prio0"]').getAttribute("title") || "").indexOf("METRIC:") !== -1);
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
