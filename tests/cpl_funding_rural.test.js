// CPL Implementation Funding — the RURAL CARVE-OUT IS RETIRED (Sam, 2026-08-22).
//
// This file used to be Part N/O: 56 checks over a $1,000,000 guaranteed earmark
// split 13 ways, which funded a rural college's own minimum first and rode on
// top above it. Sam retired it once the model gained a ceiling:
//
//   "since we have now both a floor and ceiling to the funding, it seems we
//    don't need the rural carve out since all are benefitting from the floor"
//
// Measured before agreeing, because the claim was two-thirds true: TEN of the
// 13 rural colleges sit at the minimum and moved $0 — the floor genuinely does
// that work. THREE sat above it and would have lost $88,594 between them
// (Shasta −$70,656), and that money re-splits proportionally, so it would have
// gone to the LARGEST non-rural colleges. So the carve-out was retired TOGETHER
// with a floor raise from $150,000 to $175,000, under which the 13 rural
// colleges receive $2,275,000 — $236,406 MORE than the carve-out ever paid.
//
// What survives here is a RETIREMENT GUARD, and it is not ceremonial: the
// mechanism was threaded through the pool arithmetic, the earned split, the
// per-college bounds and four UI surfaces. Re-introducing any one of them
// silently changes every college's number, so each is pinned as absent.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_rural.test.js`).
const { check, freshDom, boot, D, consumerSrc, dataSrc, finish } = require("./lib/cpl_funding_harness.js");

// ── the data no longer carries the earmark ───────────────────────────────
check("data: no rural_carveout in the pool", D.pool.rural_carveout === undefined);
check("data: no rural_carveout label either", D.pool.rural_carveout_label === undefined);
check("data: the minimum rose to $175,000 in the same change", D.pool.floor_window === 175000);
// The FLAGS stay — they are federal categorization, i.e. a true fact about the
// college that costs nothing to keep. They just no longer move a dollar.
check("data: the 13 rural flags survive as context", D.colleges.filter(function (c) { return c.rural; }).length === 13);
check("data: …and their provenance survives with them", /federally categorized as rural/.test(D.rural_source || ""));
// A retired mechanism must be explained where the next reader will look.
check("data: the retirement is recorded in the data file's own header",
  /RURAL CARVE-OUT IS RETIRED/.test(dataSrc) || /rural carve-out is retired/i.test(dataSrc));

// ── the pool arithmetic ──────────────────────────────────────────────────
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const m = T._model();
  // $23,240,308 + the released $1,000,000. If a rural deduction ever comes back
  // this is the first thing that moves.
  check("pool: the college pool absorbed the $1M (net = $24,240,308)",
    Math.abs(T._netCollege() - 24240308) < 1);
  check("pool: Σ college window totals == the pool, with nothing held aside",
    Math.abs(D.colleges.reduce(function (s, c) { return s + T._alloc(c.college).total; }, 0) - 24240308) < 1);
  check("pool: no college's total falls below the raised minimum",
    D.colleges.every(function (c) { return T._alloc(c.college).total >= 175000 - 0.01; }));

  // ⭐ The measurement that justified the change, pinned so it cannot rot.
  const rural13 = D.colleges.filter(function (c) { return c.rural; })
    .reduce(function (s, c) { return s + T._alloc(c.college).total; }, 0);
  check("⭐ the 13 rural colleges are BETTER off than under the carve-out ($2,275,000 vs $2,038,594)",
    Math.abs(rural13 - 2275000) < 1 && rural13 > 2038594);

  // ── the row shape: no second, guaranteed component ─────────────────────
  const row = T._alloc("Feather River");
  check("row: no rural_w component on a rural college's row", row.rural_w === undefined);
  check("row: no earned_guaranteed split any more", row.earned_guaranteed === undefined);
  check("row: a rural college's entitlement IS its main-pool entitlement",
    Math.abs(row.w - row.main_w) < 0.01);
  // ⭐ NOTHING in the college pool is unconditional now. That is the real policy
  // consequence of the retirement and the one least visible on screen.
  check("⭐ every dollar now flexes on achievement — no unconditional slice survives",
    D.colleges.every(function (c) {
      const a = T._alloc(c.college);
      return a.earned_guaranteed === undefined && !(a.earned_total > a.total + 0.01);
    }));

  // ── the bounds are uniform ─────────────────────────────────────────────
  // A rural college used to carry a REDUCED main-pool floor (floor − ruralPer).
  // Every college must now sit on the same two bounds, or the carve-out is back
  // under another name.
  const floored = D.colleges.filter(function (c) { return m.floored[c.college]; });
  check("bounds: every floored college sits on the SAME floor, rural or not",
    floored.length > 0 && floored.every(function (c) {
      return Math.abs(T._alloc(c.college).total - m.floor) < 0.01;
    }));
  check("bounds: floored rural colleges are in that set (they are not special-cased out)",
    floored.some(function (c) { return c.rural; }));
}

// ── the UI surfaces ──────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  check("ui: no Rural section on the tab",
    !doc.querySelector("#cplfund-sec-rural") &&
    !/Rural College allowance/.test(doc.getElementById("cplFundingMount").textContent));
  check("ui: no rural pool card", !doc.querySelector(".cplfund-card.rural"));
  // Sam, 2026-08-22: "We won't need the rural glyph on the college rows either".
  check("ui: no 🌲 glyph on any college row",
    doc.getElementById("cplFundingMount").innerHTML.indexOf("🌲") === -1);
  check("ui: no rural-flag curator control", !doc.querySelector("[data-ruralflag]"));
  check("ui: the footer legend no longer explains a rural glyph",
    !/rural-flagged/.test(Array.from(doc.querySelectorAll(".cplfund-foot"))
      .map(function (e) { return e.textContent; }).join(" ")));
  const csv = window.CPL_FUNDING_TAB._csv().split("\r\n");
  check("ui: the CSV drops its Rural column", csv[1].split(",").indexOf("Rural") === -1);
  check("ui: …and drops the guaranteed-rural earned column",
    csv[1].indexOf("guaranteed rural") === -1);
}

// ── the mechanism is gone from the source, not just unreachable ──────────
// Dead code that still computes a rural pool is a trap for the next reader and
// for the next person who greps for how the pool is built.
["ruralCarve", "ruralPerCollege", "ruralPoolDistributed", "ruralAlloc",
 "ruralWindow", "netCollegeWithRural", "ruralSectionHtml", "setRuralOverride"
].forEach(function (fn) {
  check("source: " + fn + "() is gone", consumerSrc.indexOf("function " + fn) === -1);
});
check("source: no rural override layer left in the config",
  consumerSrc.indexOf("ruralOverrides") === -1);
// My College rendered the allowance as its own line; it must not resurrect.
const fs = require("fs");
const briefing = fs.readFileSync("college_briefing.js", "utf8");
check("source: My College no longer claims a guaranteed rural allowance",
  !/guaranteed rural allowance/.test(briefing) && briefing.indexOf("alloc.rural_w") === -1);

// ── the husk a removal leaves behind ─────────────────────────────────────
// Removing netCollegeWithRural() left `fmtMoney(netCollege() - netCollege())`
// in TWO audience-facing briefs — the copyable text and the print HTML — so
// both told colleges the pool included "the $0 Rural College allowance". It
// rendered, it was arithmetically valid, and no test could see it because the
// function it had referenced was already gone. A self-subtraction is the
// signature of exactly that mistake.
check("source: no self-subtracting money expression is left behind",
  !/fmtMoney\(\s*(\w+)\(\)\s*-\s*\1\(\)\s*\)/.test(consumerSrc));
check("source: neither brief still names a Rural College allowance",
  consumerSrc.indexOf("Rural College allowance") === -1);

finish();
