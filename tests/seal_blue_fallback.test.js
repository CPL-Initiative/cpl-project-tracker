// Seal blue is #002F6D (First Light; CPL_Dashboard.html, fact-sheet/factsheet.css,
// funding-model/index.html). A var() fallback or a print palette that names another
// value paints a second seal blue wherever the token is missing (the Pathways print
// palette painted #0b3d61 until the S461 UI pass of Sierra, 2026-10-24).
//
// Run from repo root: `npm test` (or `node tests/seal_blue_fallback.test.js`).
const fs = require("fs");

const FILES = ["sierra/sierra.js", "fact-sheet/factsheet_sierra.js", "cpl_chat.js", "cpl_pathways.js"];
const results = [];
function check(name, cond) { results.push([name, !!cond]); }

FILES.forEach(function (f) {
  const src = fs.readFileSync(f, "utf8");
  const bad = src.match(/--(?:seal-blue|sierra-navy)\s*[,:]\s*#(?!002F6D\b)[0-9a-fA-F]{3,6}\b/gi) || [];
  check(f + ": every seal-blue fallback or print value is #002F6D" + (bad.length ? " (found " + bad.join(", ") + ")" : ""), bad.length === 0);
});

let failed = 0;
results.forEach(function (r) {
  console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
  if (!r[1]) failed++;
});
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);
