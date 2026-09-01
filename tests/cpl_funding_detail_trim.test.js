// CPL Implementation Funding — the college drill-in after Sam's 2026-09-01 trim.
//
// Four sentences came off the expand and one column went on, and both halves
// need a guard for the same reason: the removals were removals of RESTATEMENT,
// so the natural way to lose them is for a later session to helpfully add the
// explanation back where it "seems missing" — and the addition is a distance
// figure, which is exactly the kind of number that must not appear beside a
// value privacy has masked.
//
// What Sam asked for, in his words (2026-09-01):
//   1. the headcount aside — "not needed and just a distraction"
//   2. the base/cap tail    — "not helpful for the college and a distraction"
//   3. the elig parenthetical — "restating what was just said"
//   4. the reserve sentence — "restating what was said in 3rd column"
//   2 (his numbering) — the targets and current numbers, so a college can see
//      "where they are and where they could be by priority"
//   3-4 — the red gate mark off the row, and Confirm Participation as a word
//
// The targets were never missing. The table is a GRID ITEM, and the grid is
// repeat(auto-fit, minmax(240px, 1fr)) — so 620px of table was scrolling
// sideways inside a 240px column, three columns out of view. That is the
// failure this file pins first: the fix is a span, and a span is invisible in
// a screenshot the moment someone edits the grid.
const H = require("./lib/cpl_funding_harness.js");
const { freshDom, boot, check, finish, consumerSrc } = H;

function openDetail(window, doc, name) {
  const find = () => Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find((r) => r.textContent.indexOf(name) !== -1);
  const row = find();
  if (!row) return null;
  row.querySelector(".cplfund-caret").dispatchEvent(new window.Event("click", { bubbles: true }));
  const row2 = find();
  const det = row2 && row2.nextElementSibling;
  return det && det.classList.contains("cplfund-detail") ? det : null;
}
// Read the detail table BY HEADER — never by position. Adding "To go" shifted
// every index in the metric-pin suite; that suite is header-keyed now and so
// is this one, so the next column insert cannot quietly re-point an assertion.
function detRows(det) {
  const trs = Array.from(det.querySelectorAll(".cplfund-dtl-table tr"));
  const keys = Array.from(trs[0].querySelectorAll("th"))
    .map((th) => th.textContent.replace(/\s+/g, " ").trim().toLowerCase());
  return trs.slice(1).map((tr) => {
    const out = {};
    Array.from(tr.querySelectorAll("td")).forEach((td, i) => {
      out[keys[i]] = td.textContent.replace(/\s+/g, " ").trim();
    });
    return out;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// T1 — the four strikes, and the span that made the targets readable
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  // A CAPPED institution, so the cap line is on screen — Sam's screenshot was
  // Bakersfield, and the cap tail is the one of the four with a mirror (the
  // base tail) that has to come off with it.
  const m = T._model();
  const cappedName = Object.keys(m.capped)[0];
  const det = openDetail(window, doc, cappedName);
  const txt = det ? det.textContent.replace(/\s+/g, " ") : "";

  check("T1: a capped drill-in renders at all (the fixture still finds one)", !!det);
  check("T1a: no headcount aside on the FTES-share line",
    !/headcount, context only/.test(txt));
  check("T1b: the cap line names the hold and stops there — no re-split, no 'not the bar'",
    /At the cap:/.test(txt) && /held at the/.test(txt) &&
    !/re-splits across the institutions below the cap/.test(txt) &&
    !/lowers the funding, not the bar/.test(txt));
  check("T1b2: …and the base line's mirror tail came off with it",
    !/raises the funding, not the bar/.test(txt) && !/PRE-BASE share/.test(txt) &&
    !/PRE-CAP share/.test(txt));
  check("T1c: 'Baseline eligibility' stands alone — the parenthetical restated the label",
    /Baseline eligibility:/.test(txt) && !/the gate to participate/.test(txt) &&
    !/Baseline eligibility \(/.test(txt));
  check("T1d: nothing in the expand restates the gate's roll-forward sentence twice",
    (txt.match(/qualifying later still lets it draw/g) || []).length <= 1 &&
    !/nothing is redistributed, so qualifying later/.test(txt));

  // THE SPAN. The table is a direct child of the detail grid, and the grid is
  // auto-fit minmax(240px, 1fr) — without the span rule it lands in one column
  // and its 740px min-width scrolls sideways inside ~240px, which is how three
  // of its eight columns went unread. jsdom does no layout, so assert the two
  // facts layout depends on: the element is a grid child, and the rule granting
  // it the full row is present in the injected CSS.
  const tscroll = det.querySelector(".cplfund-dtl-tscroll");
  check("T1e: the priority table is a DIRECT child of the detail grid",
    !!tscroll && tscroll.parentElement.classList.contains("cplfund-detail-grid"));
  check("T1e2: …and the injected CSS spans it across every grid column",
    /\.cplfund-detail-grid\s*>\s*\.cplfund-dtl-tscroll[^{]*\{[^}]*grid-column:\s*1\s*\/\s*-1/
      .test(consumerSrc));
  check("T1e3: …and the scroller is still the narrow-screen safety net beneath it",
    /"\.cplfund-dtl-tscroll \{ overflow-x: auto/.test(consumerSrc));

  // Sam's items 3 and 4, on the row itself.
  const row = det.previousElementSibling;
  check("T1f: no red gate mark on the row — the Elig pie beside it says the same thing",
    !row.querySelector(".cf-gatechip") && row.innerHTML.indexOf("⛔") === -1 &&
    !/cf-gatechip/.test(consumerSrc));
  check("T1g: the row control is the words Confirm Participation, with no pencil",
    /Confirm Participation/.test(row.textContent) && row.innerHTML.indexOf("✎") === -1);
}

// ─────────────────────────────────────────────────────────────────────────────
// T2 — "To go": the distance, and the two states that must NOT show one
// ─────────────────────────────────────────────────────────────────────────────
// Three priorities on one college, pinned to three sources, so one render
// produces all three states: under target, over target, and privacy-suppressed.
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = {
    as_of: "2026-09-01", suppress_below: 5,
    statewide: { pe_u: 900000, pa_u: 600000, p3_u: 300000 },
    colleges: {
      // pe_u far under this college's target; pa_u far over it; p3_u masked.
      "Laney": { pe_u: 60, pa_u: 900000, p3_u_suppressed: true }
    },
    unmatched: {}
  };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: "Eligible CPL Units measured in FTES", metric_src: "pe_u" },
    "1": { metric: "Applied CPL Units measured in FTES", metric_src: "pa_u" },
    "2": { metric: "Transcribed CPL Units measured in FTES", metric_src: "p3_u" }
  } } });
  T.render();
  const R = detRows(openDetail(window, doc, "Laney"));

  check("T2: the table carries a To go column", R.length === 3 && "to go" in R[0]);
  check("T2a: under target — To go names the distance AND the funding it would earn",
    R.length === 3 && /\d/.test(R[0]["to go"]) && /\$[\d,]+ still to earn/.test(R[0]["to go"]));
  check("T2a2: …and the distance is not the whole target (the posted amount is subtracted)",
    R.length === 3 && R[0]["to go"] !== R[0].target);
  check("T2b: at or over target — To go says target met, and offers no negative distance",
    R.length === 3 && /target met/.test(R[1]["to go"]) && !/-/.test(R[1]["to go"]));
  // THE ONE THAT MATTERS. A masked actual plus a distance is the actual: a
  // reader subtracts. The privacy mask has to hold across the whole row, not
  // just the cell it was applied to.
  check("T2c: a privacy-suppressed actual gets NO distance — it would leak the value by subtraction",
    R.length === 3 && /privacy/.test(R[2].actual) &&
    !/\d/.test(R[2]["to go"]) && !/still to earn/.test(R[2]["to go"]));
  check("T2c2: …and the masked row's To go is a plain absence, not a zero",
    R.length === 3 && !/^0\b/.test(R[2]["to go"]) && !/target met/.test(R[2]["to go"]));
}

// ─────────────────────────────────────────────────────────────────────────────
// T3 — an unmeasured state carries no distance either
// ─────────────────────────────────────────────────────────────────────────────
// "no data yet" and "0 to go" are different claims about a college. The first
// says the model cannot see; the second says the college is done. Rendering the
// second when the first is true is the same silent-omission class the earned
// column already guards against.
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-09-01", suppress_below: 5,
    statewide: { pa_u: 500000 }, colleges: { "Laney": { pa_u: 12000 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: "Applied CPL Units measured in FTES", metric_src: "nc_pa_u" },  // declared, undelivered
    "1": { metric: "Applied CPL Units measured in FTES", metric_src: "nope_u" },   // miswired pin
    "2": { metric: "Applied CPL Units measured in FTES", metric_src: "pa_u" }      // measured
  } } });
  T.render();
  const R = detRows(openDetail(window, doc, "Laney"));

  check("T3a: an undelivered source reads no data yet and shows no distance",
    R.length === 3 && /no data yet/.test(R[0].actual) && !/\d/.test(R[0]["to go"]));
  check("T3b: a miswired pin reads not wired and shows no distance",
    R.length === 3 && /not wired/.test(R[1].actual) && !/\d/.test(R[1]["to go"]));
  check("T3c: the measured row beside them DOES show one — the column is not dead",
    R.length === 3 && (/\d/.test(R[2]["to go"]) || /target met/.test(R[2]["to go"])));
}

finish();
