// tests/cpl_funding_public_dollars_at_cap.test.js
//
// A PUBLIC FIGURE BESIDE ITS MAX (Cabrillo College's question, 2026-11-17).
// The public page coarsens Funds Qualified So Far to the nearest $1,000 (the
// ADR docs/kb-notes/adr-funding-counts-mask-under-10-units-carry-the-money.md,
// decision 5) and prints Max Funds exactly. Cabrillo's noncredit exhibits
// outcome, 37 exhibits against a target of 9, qualified for its whole
// $18,336 and read "$18,000"; two credit priorities at $65,545 read "$66,000",
// more than their max. A figure at its cap is the cap the page already prints,
// so it prints exactly; a figure short of its cap never rounds past the cap's
// own thousand. The curator view is exact throughout.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_public_dollars_at_cap.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

function boot(isPublic) {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><head></head><body>' +
    '<div class="cpl-tab-pane" id="tab-implementation-funding"><div class="main-container">' +
    '<div id="cplFundingMount"></div></div></div></body></html>',
    { runScripts: "outside-only", url: "https://example.org/" });
  dom.window.scrollTo = function () {};
  dom.window.CPL_FUNDING_NO_REMOTE = true;
  if (isPublic) dom.window.CPL_FUNDING_PUBLIC = true;
  dom.window.eval(fs.readFileSync("cpl_funding_data.js", "utf8"));
  dom.window.eval(fs.readFileSync("cpl_funding.js", "utf8"));
  dom.window.CPL_FUNDING_TAB.boot();
  return dom.window.CPL_FUNDING_TAB;
}

const B = boot(true), P = boot(false);

// 1. Cabrillo's noncredit exhibits outcome: met, so the exact max.
check("A1: a met $18,336 outcome reads $18,336 on the public page, not $18,000",
  B._earnedMoney(18336, 18336) === "$18,336");
check("A1: ...and nothing is left to qualify for", B._diffMoney(18336, 18336) === "$0");
// 2. The credit priorities at $65,545: never above the max.
check("A2: a met $65,545 priority reads $65,545, not $66,000",
  B._earnedMoney(65545, 65545) === "$65,545");
check("A2: a figure just short of its cap rounds down to the cap's thousand, never to $66,000",
  B._earnedMoney(65520, 65545) === "$65,000");
check("A2: ...and its remaining figure stays positive",
  B._diffMoney(65545, 65520) === "$545");
// 3. A figure well short of its cap keeps the ADR's nearest-$1,000 rule.
check("A3: a partial figure still coarsens to the nearest $1,000",
  B._earnedMoney(9168, 18336) === "$9,000" && B._earnedMoney(9600, 18336) === "$10,000");
check("A3: under the floor it still reads <$1,000", B._earnedMoney(420, 18336) === "<$1,000");
check("A3: a met cap under $1,000 reads its exact cap", B._earnedMoney(812, 812) === "$812");
check("A3: $0 stays $0", B._earnedMoney(0, 18336) === "$0");
check("A3: a caller with no cap keeps the plain rule", B._earnedMoney(18336) === "$18,000");
// 4. The curator view is exact whatever the cap.
check("A4: the curator view prints the exact figure", P._earnedMoney(18336, 18336) === "$18,336" &&
  P._earnedMoney(65520, 65545) === "$65,520");

// 5. The CSV export and the district line at their max (Sam's go on #3471,
// COBIx finding 1), under Annual funding (awardDivisor() is the number of
// years, 2) and under front-loading (awardDivisor() is 1). Every measure is
// fed a figure far past its target, so every institution meets its year; the
// public page must then print the max exactly on both surfaces, and the CSV
// tests its window figures against the window award.
function bootMet(frontload) {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><head></head><body>' +
    '<div class="cpl-tab-pane" id="tab-implementation-funding"><div class="main-container">' +
    '<div id="cplFundingMount"></div></div></div></body></html>',
    { runScripts: "outside-only", url: "https://example.org/" });
  const w = dom.window;
  w.scrollTo = function () {};
  w.CPL_FUNDING_NO_REMOTE = true;
  w.CPL_FUNDING_PUBLIC = true;
  w.eval(fs.readFileSync("cpl_funding_data.js", "utf8"));
  const src = fs.readFileSync("cpl_funding.js", "utf8");
  // Every declared measure key (METRIC_SOURCES), each far past any target.
  const big = {};
  [...src.matchAll(/^\s{4}(\w+):\s*\{ ?(?:label:|unit:)/gm)].forEach(function (m) { big[m[1]] = 1e7; });
  const cols = {};
  w.CPL_FUNDING.colleges.forEach(function (c) { cols[c.college] = Object.assign({}, big); });
  w.CPL_FUNDING_PERF = { as_of: "2026-11-17", suppress_below: 10, statewide: Object.assign({}, big),
    colleges: cols, unmatched: {} };
  w.eval(src);
  const T = w.CPL_FUNDING_TAB;
  T.boot();
  if (frontload) T._setShared({ disbursement: "frontload" });
  return T;
}
function csvDemonstrated(T, name) {
  const lines = T._csv().split("\n");
  const head = lines.find(function (l) { return /Institution/.test(l) && /Demonstrated/.test(l); }) || "";
  const iEarn = head.split(",").findIndex(function (h) { return /^Demonstrated/.test(h); });
  const line = lines.find(function (l) { return new RegExp("^\\d+," + name + ",").test(l); }) || "";
  return line.split(",")[iEarn];
}
function money(v) { return "$" + Math.round(v).toLocaleString("en-US"); }
const CAB_D = "Cabrillo Community College District";
[false, true].forEach(function (frontload) {
  const T = bootMet(frontload), tag = frontload ? "front-loaded, divisor 1" : "Annual, divisor 2";
  const a = T._alloc("Cabrillo");
  const windowMet = Math.abs(a.earned_total + (a.earned_withheld || 0) - a.total) < 0.5;
  const yearCap = frontload ? a.total : a.total / 2;
  check("B0 (" + tag + "): Cabrillo's award is not a round thousand, so exact and coarse differ (" +
    money(a.total) + ")", Math.round(yearCap) % 1000 !== 0 && Math.round(a.total) % 1000 !== 0);
  // The district line prints the max and the figure for one span, both exact at the max.
  const line = T._districtHead(CAB_D).replace(/<[^>]+>/g, "");
  check("B1 (" + tag + "): the district line prints the span's max, " + money(yearCap) + ", beside the met figure",
    line.indexOf("combined max award of " + money(yearCap)) !== -1 &&
    line.indexOf("funds qualified so far of " + money(yearCap)) !== -1);
  check("B1 (" + tag + "): the district line never prints a rounded figure for a met year",
    line.indexOf("funds qualified so far of " + money(Math.round(yearCap / 1000) * 1000)) === -1);
  // The CSV carries the window: exact at the window max, else coarse and never above it.
  const csv = csvDemonstrated(T, "Cabrillo");
  if (windowMet) {
    check("B2 (" + tag + "): the CSV's Demonstrated column prints the window max exactly (" + csv + ")",
      csv === String(Math.round(a.total)));
  } else {
    check("B2 (" + tag + "): short of the window max, the CSV keeps the $1,000 rule and stays under the max (" + csv + ")",
      /^\d+$/.test(csv) && Number(csv) % 1000 === 0 && Number(csv) <= Math.floor(a.total / 1000) * 1000);
  }
});

let fails = 0;
results.forEach(function (r) { console.log((r[1] ? "  ok   " : "  FAIL ") + r[0]); if (!r[1]) fails++; });
console.log("\n" + (results.length - fails) + "/" + results.length + " passed");
if (fails) process.exit(1);
