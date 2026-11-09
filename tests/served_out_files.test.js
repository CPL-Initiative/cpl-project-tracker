// Every kb/<x>_out/latest.json a page fetches is served by Pages (COBIx #2921, S604). pages.yml prunes every
// kb/*_out directory but the ones it names, so a page that reads a pruned summary 404s on the deployed site with
// nothing red anywhere: kb/csr_out/latest.json in S574, kb/cer_procedures_out/latest.json until S604 (Exhibits'
// "Last night's procedures report ... could not be read").
// Run from repo root: `npm test` (or `node tests/served_out_files.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const pages = fs.readFileSync(".github/workflows/pages.yml", "utf8");
const read = new Set();
fs.readdirSync(".").filter((f) => /\.js$/.test(f)).forEach((f) => {
  const src = fs.readFileSync(f, "utf8");
  (src.match(/kb\/[a-z0-9_]+_out\/latest\.json/g) || []).forEach((p) => read.add(p));
});
check("at least the two known summaries are read by a page", read.has("kb/csr_out/latest.json") && read.has("kb/cer_procedures_out/latest.json"));
read.forEach((p) => {
  const dir = p.replace(/\/latest\.json$/, "");
  check(p + " survives the prune", new RegExp('\\[ "\\$d" = "_site/' + dir.replace(/[/.]/g, "\\$&") + '" \\]').test(pages));
  check(p + " is in the served-path assertion list", pages.indexOf('"_site/' + p + '"') >= 0);
});

const failed = results.filter((r) => !r[1]);
results.forEach((r) => console.log((r[1] ? "  ok  " : "  FAIL ") + r[0]));
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exit(1);
