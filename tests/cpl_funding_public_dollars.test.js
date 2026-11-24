// tests/cpl_funding_public_dollars.test.js
//
// COUNTS MASK UNDER 10, UNITS CARRY THE MONEY (Sam, 2026-09-03 —
// docs/kb-notes/adr-funding-counts-mask-under-10-units-carry-the-money.md),
// AND PUBLIC DOLLARS ARE EXACT (Sam, 2026-11-24, reversing the $1,000 rounding).
//
// A college whose every student COUNT is masked in the published artifact
// still carries its UNIT sums, so its earning computes on the true numbers in
// both views; on the public page its earned figures print the same whole
// dollars as the curator view (the CSV too), and the caps stay exact
// everywhere. Two DOMs only (heap).
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_public_dollars.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const dataSrc = fs.readFileSync("cpl_funding_data.js", "utf8");
const consumerSrc = fs.readFileSync("cpl_funding.js", "utf8");

function freshDom() {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><head></head><body>' +
    '<div class="cpl-tab-pane" id="tab-implementation-funding"><div class="main-container">' +
    '<div><h2>CPL Implementation Funding</h2><span id="cplFundTitleLink"></span></div>' +
    '<div id="cplFundingMount">placeholder</div>' +
    "</div></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/" });
  dom.window.scrollTo = function () {};
  dom.window.CPL_FUNDING_NO_REMOTE = true;
  // The artifact as the builder now bakes it: every count under the floor is
  // null + flagged, every unit sum is present. Alameda is the first roster row.
  dom.window.CPL_FUNDING_PERF = { as_of: "2026-09-03", suppress_below: 10,
    statewide: { pe: 43088, pe_u: 1389229.9, pa: 39037, pa_u: 216321.6, ppe: 115, ppe_u: 6605.5,
                 pac: 2820, pac_u: 24699.0, p3: 14450, p3_u: 72613.9 },
    colleges: { "Alameda": { pe: null, pe_suppressed: true, pe_u: 300,
                             pa: null, pa_suppressed: true, pa_u: 120,
                             ppe: null, ppe_suppressed: true, ppe_u: 90,
                             pac: null, pac_suppressed: true, pac_u: 60,
                             p3: null, p3_suppressed: true, p3_u: 45 } },
    unmatched: {} };
  return dom;
}
function boot(window) {
  window.eval(dataSrc);
  window.eval(consumerSrc);
  window.CPL_FUNDING_TAB.boot();
  return window.document;
}
// Pin the three measures to UNIT sources (the live model prices units), so the
// earning is a function of the artifact's unit sums, not of prose matching.
function pin(T) {
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: "Eligible units among portal-origin students", metric_src: "ppe_u" },
    "1": { metric: "Applied units on a counselor-verified plan", metric_src: "pac_u" },
    "2": { metric: "Transcribed CPL units", metric_src: "p3_u" }
  } } });
}

const priv = freshDom();
const privDoc = boot(priv.window);
const P = priv.window.CPL_FUNDING_TAB;
pin(P); P.render();

const pub = freshDom();
pub.window.CPL_FUNDING_PUBLIC = true;
const pubDoc = boot(pub.window);
const B = pub.window.CPL_FUNDING_TAB;
pin(B); B.render();

// 1. The money computes on the true numbers though every count is masked.
const pa = P._alloc("Alameda"), ba = B._alloc("Alameda");
check("D1: a college with every count masked still EARNS (units carry the money)",
  !!pa && pa.earned_total > 0);
check("D1: the public and curator views compute the SAME earned figure",
  !!ba && Math.abs(pa.earned_total - ba.earned_total) < 0.01);

// 2. The earned figure is exact, in whole dollars, in both views (2026-11-24).
// The qualifying figure reads in the Curr Total Funds column since the College
// Dashboard (Sam, 2026-09-28), beside the award it is measured against.
function curTotal(doc) {
  const row = doc.querySelector('tr[data-id="c:Alameda"]');
  return row ? row.querySelector("td.cf-cur-total") : null;
}
// ⚠ THE WORD IS "qualifying", PRESENT TENSE, and both halves are rulings: Sam
// retired "earn" on 2026-09-13, and on 2026-08-27 he required the present
// participle because a past tense "read like a settled award". It rides the
// cell's hover now.
function earnFigure(td) {
  const t = td ? td.textContent.trim() : "";
  return /^\$[\d,]+$/.test(t) && /qualifying so far/.test(td.getAttribute("title") || "") ? t : null;
}
const pubFig = earnFigure(curTotal(pubDoc)), privFig = earnFigure(curTotal(privDoc));
// The row prints the figure for the span its award covers (Sam, 2026-09-27):
// under the default Annual funding, the viewed year's qualifying figure.
const shown = pa["ey" + P._state.viewSlot];
const exact = "$" + Math.round(shown).toLocaleString("en-US");
// The figure is deliberately NOT a multiple of 1,000, so a return of the
// $1,000 rounding cannot pass these checks.
check("D2: the fixture's figure is not a round thousand (" + exact + ")", Math.round(shown) % 1000 !== 0);
check("D2: the public row prints the exact earned figure in whole dollars (" + (pubFig || "none") + " for " + exact + ")",
  pubFig === exact);
check("D2: the curator row prints the same figure (" + exact + ")", privFig === exact);
// No public figure reads "<$1,000" any more: the old floor is gone everywhere on the page.
check("D2: no figure on the public page prints the retired <$1,000 floor",
  !/<\$1,000/.test(pubDoc.getElementById("cplFundingMount").textContent));

// 3. Caps stay exact on the public page — they are size allocations, not
// measures — so the max-award figure is IDENTICAL in both views and never
// carries the floor label.
function capText(doc) {
  const row = doc.querySelector('tr[data-id="c:Alameda"]');
  return row ? row.querySelector(".cf-award").childNodes[0].textContent : "";
}
const pubCap = capText(pubDoc), privCap = capText(privDoc);
check("D3: the public CR max-award cell is exact — identical to the curator view, no floor label",
  pubCap.length > 1 && pubCap === privCap && !/<\$/.test(pubCap) && /^\$[\d,]+$/.test(pubCap.trim()));

// 4. The CSV follows the same rule: never a figure the screen withholds.
function alamedaCsvEarned(T) {
  const lines = T._csv().split("\n");
  // The CSV column header followed the same sweep: "Earned <window>" is now
  // "Demonstrated <window>". The export is read by a human, so the vocabulary
  // ruling reaches it — and no DOM-rendered-text guard can see a CSV.
  const head = lines.find(function (l) { return /Institution/.test(l) && /Demonstrated/.test(l); }) || "";
  const cols = head.split(",");
  const iEarn = cols.findIndex(function (h) { return /^Demonstrated/.test(h); });
  const line = lines.find(function (l) { return /^\d+,Alameda,/.test(l); }) || "";
  return line.split(",")[iEarn];
}
const pubCsv = alamedaCsvEarned(B), privCsv = alamedaCsvEarned(P);
check("D4: the public CSV earned column is the same whole dollars as the curator CSV (" + pubCsv + ")",
  /^\d+$/.test(pubCsv) && pubCsv === privCsv);
// Demonstrated is what the measures show, the minimum conditions aside
// (2026-09-29): the qualifying figure plus any part held.
check("D4: the curator CSV Demonstrated column is the exact figure",
  /^\d+$/.test(privCsv) && Math.abs(Number(privCsv) - Math.round(pa.earned_total + (pa.earned_withheld || 0))) <= 1);

// 5. The mask label follows the artifact's floor: 10, never a literal 5.
const pubText = pubDoc.getElementById("cplFundingMount").textContent;
check("D5: the page names the floor from the artifact (<10)", /<10/.test(pubText) && !/<5\b/.test(pubText));

let fails = 0;
results.forEach(function (r) { console.log((r[1] ? "  ok   " : "  FAIL ") + r[0]); if (!r[1]) fails++; });
console.log("\n" + (results.length - fails) + "/" + results.length + " passed");
if (fails) process.exit(1);
