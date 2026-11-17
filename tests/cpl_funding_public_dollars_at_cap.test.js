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

let fails = 0;
results.forEach(function (r) { console.log((r[1] ? "  ok   " : "  FAIL ") + r[0]); if (!r[1]) fails++; });
console.log("\n" + (results.length - fails) + "/" + results.length + " passed");
if (fails) process.exit(1);
