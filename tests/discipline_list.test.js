// tests/discipline_list.test.js
//
// A LIST OF DISCIPLINES IS SPLIT AGAINST THE MQ NAMES (COBIx on #3025, 2026-11-10).
// `cross_listed_disciplines` holds a course's second disciplines as one comma-separated string, and two MQ names
// carry commas of their own: "Air Conditioning, Refrigeration, Heating" and "Sign Language, American". A plain split
// read the second as two disciplines that do not exist. kb/discipline_list.py takes the longest run of pieces that
// spells a known name; excel_to_dashboard.py's xdisc_of reads through it.
//
// Guards: a comma name survives whole, anywhere in the list; names without commas split as they always did; an unknown
// piece stands alone; no dictionary is the plain split; the real MQ list still holds exactly the names this was
// written for (a third comma name would be handled, and should be looked at); the generator uses the splitter.
//
// Run from repo root: `npm test` (or `node tests/discipline_list.test.js`).
const fs = require("fs");
const { spawnSync } = require("child_process");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const CASES = [
  ["Sign Language, American", ["Sign Language, American"]],
  ["Psychology, Sign Language, American", ["Psychology", "Sign Language, American"]],
  ["Sign Language, American, Psychology", ["Sign Language, American", "Psychology"]],
  ["Air Conditioning, Refrigeration, Heating, Kinesiology", ["Air Conditioning, Refrigeration, Heating", "Kinesiology"]],
  ["Agriculture, Business", ["Agriculture", "Business"]],
  ["Agriculture,Business ,  History", ["Agriculture", "Business", "History"]],
  ["Not A Discipline, History", ["Not A Discipline", "History"]],
  ["History, History", ["History"]],
  ["", []]
];
const py = [
  "import json, sys",
  "sys.path.insert(0, 'kb')",
  "from discipline_list import split_disciplines",
  "mq = json.load(open('kb/reference/mq_disciplines.json', encoding='utf-8'))['disciplines']",
  "cases = json.loads(sys.argv[1])",
  "print(json.dumps({'with': [split_disciplines(c, mq) for c in cases], 'plain': [split_disciplines(c) for c in cases],",
  "  'commas': sorted(n for n in mq if ',' in n), 'count': len(mq)}))"
].join("\n");
const r = spawnSync("python3", ["-c", py, JSON.stringify(CASES.map((c) => c[0]))], { encoding: "utf8" });
let out = null;
try { out = JSON.parse(r.stdout); } catch (e) { /* reported below */ }
check("the splitter runs", !!out, (r.stderr || "").slice(0, 300));
if (out) {
  CASES.forEach((c, i) => check("split: " + JSON.stringify(c[0]) + " reads " + JSON.stringify(c[1]),
    JSON.stringify(out.with[i]) === JSON.stringify(c[1]), JSON.stringify(out.with[i])));
  check("⭐ with no dictionary it is the plain split, so a caller without the MQ list behaves as before",
    JSON.stringify(out.plain[1]) === JSON.stringify(["Psychology", "Sign Language", "American"]), JSON.stringify(out.plain[1]));
  check("the MQ list holds the two comma names this was written for (" + out.count + " names)",
    JSON.stringify(out.commas) === JSON.stringify(["Air Conditioning, Refrigeration, Heating", "Sign Language, American"]), JSON.stringify(out.commas));
}
const GEN = fs.readFileSync("excel_to_dashboard.py", "utf8");
check("⭐ the generator's cross-list reader splits through it, against the MQ names",
  /from discipline_list import split_disciplines as _split_disciplines/.test(GEN) && /return _split_disciplines\(v, _mq_names\) or None/.test(GEN) &&
  !/parts = \[p\.strip\(\) for p in str\(v\)\.split\(","\) if p\.strip\(\)\]\s*\n\s*return parts or None/.test(GEN));
const TAB = fs.readFileSync("coci_lookup.js", "utf8");
check("the Courses List never splits the string back into names", !/value\.split\(", "\)/.test(TAB) && /value: value\.join\(", "\)/.test(TAB));

const failed = results.filter((x) => !x[1]);
results.forEach(([name, ok, why]) => console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\ndiscipline_list.test.js: " + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
