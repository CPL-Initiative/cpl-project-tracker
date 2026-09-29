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
//
// ROUND 8 (Sam, 2026-09-29) moved the priorities out of the grid altogether:
// they are rows of the institution table, one cell per column, so no span can
// be lost. T1e now pins that, and the distance guards of T2 and T3 read the
// Curr cell's hover, where the retired Difference column's figures ride.
const H = require("./lib/cpl_funding_harness.js");
const { NPRIO } = require("./lib/cpl_funding_harness.js");
const { freshDom, boot, check, finish, consumerSrc, drillOf, remainingOf } = H;

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
// Read the priority rows BY COLUMN KEY — never by position (the harness's
// drillOf reads the table's own header). Adding "To go" once shifted every
// index in the metric-pin suite; a key cannot be re-pointed by a new column.
// The credit lane: Max CR Funds with its Max FTES beneath, Curr CR Funds with
// its Actual FTES beneath and the funding remaining on hover.
function detRows(det) {
  const d = drillOf(det.ownerDocument, det && det.previousElementSibling);
  return d.cells.map((c) => ({ maxFunds: c.cr_award.fig, maxFtes: c.cr_award.line,
    cur: c.cr_current.fig, actual: c.cr_current.line, actualTip: c.cr_current.lineTip,
    tip: c.cr_current.tip, remaining: remainingOf(c.cr_current) }));
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
  // Sam, 2026-09-23 (funding review item 3, "Consolidate as proposed"): the
  // FTES-share, base and cap cells left the expand. Their figures ride the
  // row — the CR FTES hover and the bound word's hover.
  check("T1a: the FTES share left the expand, and rides the CR FTES hover with its statewide total",
    !/FTES share:/.test(txt) && !/headcount, context only/.test(txt) &&
    /FTES in all: [\d.]+% of the statewide [\d,]+, the allocation basis/
      .test((det.previousElementSibling.querySelector("td.c") || {}).title || ""));
  check("T1b: no cap cell in the expand — no re-split, no 'not the bar'",
    !/At the cap:/.test(txt) && !/At the base:/.test(txt) &&
    !/re-splits across the institutions below the cap/.test(txt) &&
    !/lowers the funding, not the bar/.test(txt));
  check("T1b2: …and the base line's mirror tail came off with it",
    !/raises the funding, not the bar/.test(txt) && !/PRE-BASE share/.test(txt) &&
    !/PRE-CAP share/.test(txt));
  // "Minimum Conditions" since the College Dashboard (Sam, 2026-09-28: "a
  // better term than baseline").
  check("T1c: the conditions are ONE line, 'Minimum Conditions:', and the old paragraph is gone",
    det.querySelectorAll(".cplfund-basestatus").length === 1 && /^Minimum Conditions:/.test(
      det.querySelector(".cplfund-basestatus").textContent.replace(/\s+/g, " ").trim()) &&
    !/Baseline eligibility/.test(txt) && !/the gate to participate/.test(txt));
  check("T1c2: …and the expand carries no second Confirm Participation control beside the row's",
    !det.querySelector("[data-optinbtn]") && !/Confirm Participation/.test(txt));
  // THE ROLL-FORWARD SENTENCE IS RETIRED (Sam, 2026-09-28: "we make it clear
  // that colleges need to meet all 3 baselines to receive any funding"). The
  // expand once risked stating it twice; the College Dashboard states it
  // nowhere, and baselineGateText(), the hover that carried it, left with the
  // reserve words. Both halves are asserted, so a sentence that comes back
  // under new wording still has to get past the rendered-text half.
  check("T1d: nothing in the expand speaks of reserve, roll-forward or qualifying later",
    !/qualifying later still counts toward it|nothing is redistributed|held in reserve|rolls? forward/i.test(txt));
  check("T1d: …and the gate's roll-forward sentence is retired from the module, with the hover that carried it",
    !/qualifying later still counts toward it/.test(consumerSrc) && !/function baselineGateText\(/.test(consumerSrc));

  // THE SPAN, RETIRED WITH ITS CAUSE. The lane tables were grid items of the
  // detail row, and the grid is auto-fit minmax(240px, 1fr): without a span
  // rule a table landed in one column and scrolled sideways inside ~240px,
  // which is how three of its eight columns once went unread. Since round 8
  // the priorities are rows of the institution table, so the columns they
  // read under are the table's own and no grid holds them.
  const d = drillOf(doc, det.previousElementSibling);
  check("T1e: the priority rows are rows of the institution table, not grid items of the detail row",
    d.rows.length === NPRIO && d.rows.every((tr) => tr.parentElement === det.parentElement) &&
    !det.querySelector("table") && !det.querySelector(".cplfund-detail-grid table"));
  check("T1e2: …one cell per column, none spanning, so each figure sits under the header it answers",
    d.rows.length === NPRIO && d.rows.every((tr) => tr.cells.length === det.previousElementSibling.cells.length &&
      Array.from(tr.cells).every((td) => !td.hasAttribute("colspan"))));
  check("T1e3: …and the table's own wrap is still the narrow-screen safety net beneath them",
    /"\.cplfund-tablewrap \{ overflow-x: auto/.test(consumerSrc) && !/cplfund-dtl-tscroll/.test(consumerSrc));

  // Sam's items 3 and 4, on the row itself.
  const row = det.previousElementSibling;
  check("T1f: no red gate mark on the row — the Elig pie beside it says the same thing",
    !row.querySelector(".cf-gatechip") && row.innerHTML.indexOf("⛔") === -1 &&
    !/cf-gatechip/.test(consumerSrc));
  // The words carry the deadline since 2026-09-28 ("Confirm by MM-DD-YY",
  // "Confirm now" once it passes); this fixture keeps the baked deadline.
  check("T1g: the row control is a word, Confirm by its deadline (or Confirm now), with no pencil",
    !!row.querySelector("button.cplfund-optin-jump") &&
    /^Confirm (by \d\d-\d\d-\d\d|now)$/.test(row.querySelector("button.cplfund-optin-jump").textContent) &&
    row.innerHTML.indexOf("✎") === -1);
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

  // "To go" retired on 2026-09-24 for a Difference column, and Difference
  // retired with the lane tables on 2026-09-29 (Sam, round 8): the funding
  // still to qualify for rides the Curr cell's hover, with the FTES distance
  // beside it. Every guard below still holds, on the hover that carries it.
  check("T2: the Curr cell's hover carries the funding remaining, and no Difference or To go column is left",
    R.length === NPRIO && R.every((r) => r.remaining !== null) &&
    !/>Difference<|>To go</.test(consumerSrc));
  check("T2a: under target — the hover names the funding still to qualify for, and the FTES gap",
    R.length === NPRIO && /^\$[\d,]+$/.test(R[0].remaining) && /FTES to Max FTES/.test(R[0].tip));
  check("T2a1: …and the cell's figure is the funding alone, its FTES on the line beneath (Sam, 2026-09-29)",
    R.length === NPRIO && /^\$[\d,]+$/.test(R[0].cur) && /^[\d,.]+ FTES$/.test(R[0].actual));
  const n = (v) => Number(String(v || "").replace(/[^\d.]/g, ""));
  check("T2a2: …and the remaining funding is not the whole Max (the Curr figure is subtracted)",
    R.length === NPRIO && R[0].remaining !== R[0].maxFunds && R[0].cur !== "$0" &&
    Math.abs(n(R[0].maxFunds) - n(R[0].cur) - n(R[0].remaining)) <= 1);
  check("T2b: at or over target — nothing remains, the hover says Max FTES met, and never a negative",
    R.length === NPRIO && R[1].remaining === "$0" && /Max FTES met/.test(R[1].tip) && !/-/.test(R[1].remaining));
  // THE ONE THAT MATTERS. A masked actual plus a distance is the actual: a
  // reader subtracts. The privacy mask has to hold across the whole cell — the
  // funds and the remaining included, since funds are the actual times a
  // known price.
  check("T2c: a privacy-suppressed actual gets NO distance and no funds to subtract",
    R.length === NPRIO && /privacy/.test(R[2].actual) &&
    R[2].cur === "$0" && R[2].remaining === R[2].maxFunds &&
    // The hover is part of the cell: an FTES gap or share there leaks the same way.
    !/FTES/.test(R[2].tip) && !/\d/.test(R[2].actualTip));
  check("T2c2: …and the masked cell's hover names the funding alone, never Max FTES met",
    R.length === NPRIO && R[2].tip === R[2].maxFunds + " still to qualify for");
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

  // TBA since 2026-09-28 (Sam: "show TBA everywhere so when it changes, it
  // will already be wired"), its meaning on hover.
  check("T3a: an undelivered source reads TBA and shows no distance",
    R.length === NPRIO && R[0].actual === "TBA" && R[0].actualTip === "To be announced once measured" &&
    !/FTES/.test(R[0].tip));
  check("T3b: a miswired pin reads awaiting a known measure and shows no distance",
    R.length === NPRIO && /awaiting a known measure/.test(R[1].actual) && !/FTES/.test(R[1].tip));
  check("T3c: the measured row beside them DOES show one — the hover is not dead",
    R.length === NPRIO && /FTES to Max FTES|Max FTES met/.test(R[2].tip));
}

finish();
