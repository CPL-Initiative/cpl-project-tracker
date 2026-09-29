// tests/cpl_funding_round9.test.js
//
// Round 9 of the College Dashboard (Sam, 2026-09-29), three asks verbatim:
//   1. "The Hide function on the Intro section is buggy--keeps opening up
//      again after collapsing"
//   2. "The Vet/JST and % is not yet showing on the Minimum condition in
//      college rows" (the round 9 ask from the S303 handoff: "Next to Vet JST
//      not yet at 75%, show the college vet count vs. their JST count and the %")
//   3. "The Current Funding on college rows should not be 0; it should show
//      the calculated funding in gray with a hover over that it will be
//      available once minimum conditions are met"
//
// Each check guards the failure its ask names: a section rebuilt from state
// that has not heard of the click, a veteran condition with no counts (or a
// count under 10 printed, or a percent beside a masked count), and a gated
// row whose Curr cells read $0.
//
// Run from repo root: `node tests/cpl_funding_round9.test.js`.
const H = require("./lib/cpl_funding_harness.js");
const { check, finish, freshDom, boot, consumerSrc, colKeys, readCells, rowById, openDrill } = H;
const fs = require("fs");
const path = require("path");

// ── 1: a redraw never reopens a section the reader just closed ─────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const about = () => doc.querySelector('details.cplfund-sec[data-sec="about"]');
  check("1 setup: the Introduction opens by default", !!about() && about().open === true);
  // The browser's `toggle` event is a queued task. Close the section the way a
  // click does, then redraw BEFORE that task runs: the bug rebuilt it open.
  about().open = false;
  T.render();
  check("1a: a redraw between the click and its toggle event keeps the Introduction closed",
    !!about() && about().open === false);
  T.render();
  check("1b: ...and the next redraw keeps it closed too", !!about() && about().open === false);
  about().open = true;
  T.render();
  check("1c: reopening survives a redraw the same way", !!about() && about().open === true);
}

// ── 2: the veteran counts beside the third condition ────────────────────────
const VET_REQ = "Minimum of 75% of enrolled veteran Joint Services Transcripts uploaded in MAP";
function vetCondOf(window, doc, id) {
  const d = openDrill(window, doc, id);
  const conds = d.first ? Array.from(d.first.querySelectorAll(".cf-cond")) : [];
  return conds.find((c) => /Veteran JSTs/.test(c.textContent)) || null;
}
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = {
    as_of: "2026-09-29", colleges: {},
    vet_star: { "Laney": false, "Berkeley City": true, "Alameda": false },
    vet_star_as_of: "2026-09-29", vet_star_threshold: 0.75, vet_star_n: 1,
    vet_jst: {
      "Laney": { vets: 288, jst: 110, pct: 0.3819 },
      "Berkeley City": { vets: 182, jst: 347, pct: 1.9066 },
      "Alameda": { vets: null, vets_suppressed: true, jst: 12 }
    }
  };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ extraReqs: [VET_REQ] });
  T._setElig({ coordOk: true, coord: { "Laney": true, "Berkeley City": true, "Alameda": true }, optin: {} });
  T.render();
  const laney = vetCondOf(window, doc, "c:Laney");
  check("2a: the unmet veteran condition shows the veteran count, the JST count and the percent",
    !!laney && /Veteran JSTs not yet at 75%/.test(laney.textContent) &&
    /288 veterans \/ 110 JSTs \(38%\)/.test(laney.textContent));
  check("2b: ...next to the condition, in the small type of the coordinator's name",
    !!laney && !!laney.querySelector(".cf-cond-who.cf-vetcount"));
  const bc = vetCondOf(window, doc, "c:Berkeley City");
  check("2c: a met condition shows its counts too, after the Veteran Star",
    !!bc && /182 veterans \/ 347 JSTs \(191%\)/.test(bc.textContent) &&
    !!bc.querySelector(".cplfund-vstar + .cf-vetcount"));
  const al = vetCondOf(window, doc, "c:Alameda");
  check("2d: a count under 10 reads <10, and no percent sits beside it",
    !!al && /<10 veterans \/ 12 JSTs/.test(al.textContent) && !/%\)/.test(al.querySelector(".cf-vetcount").textContent));
  const pie = rowById(doc, "c:Laney").querySelector("svg.cf-eligpie");
  check("2e: the pie's slice hover carries the same counts",
    !!pie && /Veteran JSTs not yet at 75%: 288 veterans \/ 110 JSTs \(38%\)/.test(pie.textContent));
}
{
  // Before the feed carries the counts, the line reads as it did.
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-09-29", colleges: {}, vet_star: { "Laney": false },
    vet_star_threshold: 0.75 };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ extraReqs: [VET_REQ] });
  T._setElig({ coordOk: true, coord: { "Laney": true }, optin: {} });
  T.render();
  const laney = vetCondOf(window, doc, "c:Laney");
  check("2f: with no counts in the feed, the condition reads alone",
    !!laney && !laney.querySelector(".cf-vetcount") && /Veteran JSTs not yet at 75%/.test(laney.textContent));
}
{
  // The builder masks under 10 and bakes no percent beside a masked count.
  const src = fs.readFileSync(path.join(__dirname, "..", "funding", "_build_funding_performance.py"), "utf8");
  check("2g: the builder masks both counts under SUPPRESS_BELOW and emits vet_jst",
    /def vet_jst_counts\(rec\)/.test(src) && /0 < v < SUPPRESS_BELOW/.test(src) &&
    /payload\["vet_jst"\] = vet\["counts"\]/.test(src) &&
    /if vets and out\["vets"\] is not None and out\["jst"\] is not None:/.test(src));
}

// ── 3: a gated row's Curr cells show the computed funding, in gray ─────────
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-09-29", colleges: {
    "Berkeley City": { pe: 100, pe_u: 900, pa: 60, pa_u: 500, p3: 40, p3_u: 300 },
    "Laney": { pe: 100, pe_u: 900, pa: 60, pa_u: 500, p3: 40, p3_u: 300 } } };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  // Combined funding, as the live model runs: a cell reads the whole window.
  T._setShared({ disbursement: "frontload" });
  T._setElig({ coordOk: true, coord: { "Laney": true, "Berkeley City": true }, optin: { "Laney": true } });
  T.render();
  const held = T._alloc("Berkeley City"), met = T._alloc("Laney");
  check("3 setup: Berkeley City is gated with a computed figure; Laney qualifies",
    held.gate_blocked === true && held.earned_withheld > 0.5 && !met.gate_blocked && met.earned_total > 0.5);
  check("3a: the held figure splits by lane and the lanes add to the whole",
    Math.abs(held.held_cr + held.held_nc - held.earned_withheld) < 0.01);
  const keys = colKeys(doc);
  const cells = readCells(keys, rowById(doc, "c:Berkeley City"));
  check("3b: no gated Curr cell reads $0 where the measures compute funding",
    ["cr_current", "current_total"].every((k) => cells[k] && cells[k].gated && /^\$[1-9]/.test(cells[k].text)));
  check("3c: each gray cell's hover names the computed figure and says when it becomes available",
    ["cr_current", "current_total"].every((k) =>
      /the model computes.*: \$[\d,]+ of \$[\d,]+\. Gray until the institution meets all its minimum conditions, and available once it meets them\.$/
        .test(cells[k].tip)));
  check("3d: a qualified institution's Curr cells carry no gray words",
    ["cr_current", "current_total"].every((k) => {
      const c = readCells(keys, rowById(doc, "c:Laney"))[k];
      return c && !c.gated && !/Gray until|computes/.test(c.tip);
    }));
  // The gray Curr Total is the institution's own held figure, the same one
  // the CSV's Withheld column reports, so the screen and the export agree.
  check("3e: the gray Curr Total is the institution's computed (held) figure for the window",
    cells.current_total.text === "$" + Math.round(held.earned_withheld).toLocaleString("en-US"));
  const d = openDrill(window, doc, "c:Berkeley City");
  check("3f: the drill-in's gray Curr cells show the computed figure too",
    d.cells.length > 0 && d.cells.some((c) => c.current_total && c.current_total.gated && /^\$[1-9]/.test(c.current_total.text)));
  // The Statewide row adds only funding that qualifies: a gray figure never
  // enters a total.
  const sys = readCells(keys, doc.querySelector("#cplFundTable tbody tr.cplfund-sysrow") ||
    doc.querySelector("#cplFundTable tbody tr"));
  check("3g: the Statewide Curr Total is the qualifying funding alone",
    !!sys.current_total && !sys.current_total.gated);
}
check("3h: the gray field map sends each Curr lane to its held twin",
  /var GATED_FIELD = \{ earned_cr: "held_cr", earned_nc: "held_nc", earned_total: "earned_withheld" \};/.test(consumerSrc));

finish();
