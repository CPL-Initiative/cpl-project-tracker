// My College — two figures, two names (Sam, 2026-09-30, open-asks sheet 6
// card 5: "rename"). Start here led with every unit not yet acted on and Where
// you stand with the articulated units awaiting an award, and both read "units
// waiting" (96,268 and about 6,500 at San Diego City College). The larger now
// reads "units not yet acted on"; "units waiting" stays with the articulated
// units, where nothing blocks the award.
//
// Run from repo root: `npm test` (or `node tests/my_college_units_labels.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const dom = new JSDOM('<!doctype html><html><body><div id="college-briefing-root"></div></body></html>',
  { url: "https://example.org/", runScripts: "dangerously" });
const w = dom.window;
w.fetch = function () { return new Promise(function () {}); };
const s = w.document.createElement("script");
s.textContent = fs.readFileSync("college_briefing.js", "utf8");
w.document.body.appendChild(s);
const B = w.CPL_COLLEGE_BRIEFING;

const m = B._measureFor("Act on all JST credit recommendations for enrolled service members",
  { name: "Test College", dormant_credits: 96268, articulated_waiting: 6500 });
const head = m && m.result && m.result.headline;
check("the Start here figure reads 'units not yet acted on'", head === "96,268 units not yet acted on");
check("…and no longer 'units waiting'", !/units waiting/.test(head || ""));
check("the detail still names the articulated units inside it", m && /6,500 of those are already articulated/.test(m.result.detail));

const src = fs.readFileSync("college_briefing.js", "utf8");
check("Where you stand keeps 'units waiting' for the articulated units",
  /fmt\(st\.articulatedWaiting\) \+ " units waiting"/.test(src));
check("one label per figure: 'units waiting' labels the articulated figure alone",
  (src.match(/\+ " units waiting/g) || []).length === 1);

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
