// CPL Implementation Funding — the memo's NONCREDIT OUTCOMES section
// (Scenario 4, Sam's Sheets 113 and 114; the lane's NEXT, S472).
//
// WHY THIS FILE EXISTS. Scenario 4 funds the noncredit share on two outcomes
// gated by two noncredit conditions, and until S472 the memo printed only the
// credit priorities, so the exported document never told a college what its
// noncredit share asks of it. The section reads the model (ncOutcomes,
// ncCondWords, ncReportedList), never a passage, so an edit to an outcome on
// the tab reaches the memo. Under origination (Scenarios 1 to 3) the memo is
// unchanged: no section, no passage in the curator's list.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_memo_nc_outcomes.test.js`).
const { check, freshDom, boot, finish } = require("./lib/cpl_funding_harness.js");

const OUTCOMES = {
  ncLane: "outcomes",
  ncOutcomes: { "1": [
    { key: "exh", title: "Exhibits built or adopted", share: 0.5, goals: ["A"], unit_word: "exhibits",
      metric: "Exhibits in MAP built or adopted for the noncredit program's learning", metric_src: "nc_exh",
      target_rule: { kind: "pct_floor_cap", of: "nc_cdcp", pct: 0.05, floor: 2, cap: 10 },
      description: "Create or adopt exhibits for at least 5% of the program's CDCP courses.",
      strategies: ["Adopt a statewide exhibit for a course the program mirrors"] },
    { key: "course", title: "Noncredit CPL portfolio-development course", share: 0.5, goals: ["A"], unit_word: "courses",
      metric: "A noncredit CPL portfolio-development course chaptered in a CDCP program.", metric_src: "nc_course",
      target_rule: { kind: "fixed", n: 1 }, description: "The program's own course." }
  ] },
  ncReported: [{ key: "students", title: "Former noncredit students awarded CPL credit",
    text: "Reported on the annual attestation from the college's SIS." }]
};

const win = freshDom().window;
boot(win);
const T = win.CPL_FUNDING_TAB;

// A. origination: the memo it always was.
const before = T._buildMemo("memo");
check("A1: under origination the memo carries no Noncredit Outcomes section",
  before.indexOf("Noncredit Outcomes") === -1 && before.indexOf("NC-1") === -1);

// B. the outcomes lane.
const shared = T._getShared();
T._setShared(Object.assign({}, shared, JSON.parse(JSON.stringify(OUTCOMES))));
const memo = T._buildMemo("memo");
const sec = (memo.split("<h2>Noncredit Outcomes</h2>")[1] || "").split("<h2>")[0];
check("B1: the memo carries the Noncredit Outcomes section, after the credit priorities and before the strategies",
  !!sec && memo.indexOf("<h2>Priority Outcomes</h2>") < memo.indexOf("<h2>Noncredit Outcomes</h2>") &&
  memo.indexOf("<h2>Noncredit Outcomes</h2>") < memo.indexOf("<h2>Recommended Strategies</h2>"));
check("B2: each outcome is listed from the model with its label, title and part of the share",
  /<strong>NC-1: Exhibits built or adopted<\/strong> \(half of the noncredit share\)/.test(sec) &&
  /<strong>NC-2: Noncredit CPL portfolio-development course<\/strong> \(half of the noncredit share\)/.test(sec));
check("B3: a metric gets one closing period, never two",
  sec.indexOf("noncredit program&#39;s learning.</em>") !== -1 || sec.indexOf("noncredit program's learning.</em>") !== -1);
check("B3b: a metric that ends in a period keeps exactly one", sec.indexOf("CDCP program.</em>") !== -1 && sec.indexOf("..") === -1);
check("B4: the passage fills the conditions from the model, never braces left in",
  sec.indexOf("a Noncredit CPL Lead named and published") !== -1 &&
  sec.indexOf("strike-team") === -1 && sec.indexOf("{") === -1);
check("B5: the passage counts the outcomes as a word", sec.indexOf("The two outcomes below") !== -1);
check("B6: the reported figure is printed under its own line, outside the funded list",
  sec.indexOf("Also reported: Former noncredit students awarded CPL credit.") !== -1);
const strat = (memo.split("<h2>Recommended Strategies</h2>")[1] || "").split("<h2>")[0];
check("B7: an outcome's strategies join the Recommended Strategies", strat.indexOf("NC-1: Exhibits built or adopted") !== -1 &&
  strat.indexOf("Adopt a statewide exhibit for a course the program mirrors") !== -1);
check("B8: the brief carries the section too", T._buildMemo("brief").indexOf("<h2>Noncredit Outcomes</h2>") !== -1);
// The edited share reaches the memo (the model, never a passage).
const o2 = JSON.parse(JSON.stringify(OUTCOMES));
o2.ncOutcomes["1"][0].share = 0.6; o2.ncOutcomes["1"][1].share = 0.4;
T._setShared(Object.assign({}, shared, o2));
const memo2 = T._buildMemo("memo");
check("B9: a share edited on the tab reaches the memo (60% / 40%)",
  memo2.indexOf("(60% of the noncredit share)") !== -1 && memo2.indexOf("(40% of the noncredit share)") !== -1);

finish();
