// The Honors pair matcher's self-recall test (S653).
//
// WHY. The readers of #3313 found Honors courses with an M-ID Honors side that the matcher in
// kb/_reclustering_s648_dryrun.py (measure_honors, find_base) never paired: abbreviated base titles ("Hist Of
// Arch 2"), the HNRS spelling, the CHEM H206 number form. They got no honors_of row and no hold. The same matcher
// paired Glendale MATH 103H with Calculus II by title. The S648 fixtures pinned the precision gates only. This test
// pins recall: kb/_honors_matcher_recall.py derives the pairs a second way, sharing none of the matcher's helpers,
// and reports right, wrong and missed on the committed members file, with hand labels for the candidates.
//
// Measured 2026-11-14 on the members file: before the fix 508 pairs, right 507, wrong 1, missed 14; after it 521
// pairs, right 521, wrong 0, missed 0 (one uncertain candidate, Mt. SAC COUN 7H, labeled and held out by the
// title gate). The ten row fixtures and three HNRS titles fail on the old matcher.
//
// Run from repo root: `npm test` (or `node tests/honors_matcher_recall.test.js`).
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const results = [];
const check = (name, ok, why) => results.push([name, !!ok, why]);

const r = spawnSync("python3", ["kb/_honors_matcher_recall.py", "--json"], { cwd: ROOT, encoding: "utf8" });
let res = {};
try { res = JSON.parse(r.stdout); } catch (e) { res = { error: (r.stderr || r.stdout || "").slice(-400) }; }
check("(1) the recall measure runs", r.status === 0 && !res.error, res.error || "exit " + r.status);

const fx = res.fixtures || [];
check("(2) thirteen fixtures", fx.length === 13, fx.length + " fixtures");
fx.forEach((f) => check("(3) " + f.name, f.pass, "expected " + f.expected + ", got " + f.got));

check("(4) every pair the readers named as missed is found", (res.must_find_missing || []).length === 0,
  JSON.stringify(res.must_find_missing));
check("(5) no pair labeled wrong is made", res.wrong === 0, JSON.stringify(res.wrong_pairs));
// A ceiling, not zero: the members file is rebuilt daily, and one new course may wait for a label. More than two
// unlabeled misses means the matcher lost recall.
check("(6) at most two code-path pairs with an M-ID Honors side are missed", res.missed <= 2,
  res.missed + " missed: " + JSON.stringify(res.missed_pairs));
check("(7) the matcher finds at least 98% of the code-path pairs with an M-ID Honors side",
  res.code_path_m_id_pairs > 0 && (res.code_path_m_id_pairs - res.missed) / res.code_path_m_id_pairs >= 0.98,
  (res.code_path_m_id_pairs - res.missed) + " of " + res.code_path_m_id_pairs);
check("(8) every count names its measure", /unified_courses_members\.js/.test(res.measure || ""), res.measure);

const bad = results.filter((x) => !x[1]);
results.forEach(([n, ok, why]) => console.log((ok ? "  ok  " : "  FAIL ") + n + (ok ? "" : "\n        " + why)));
console.log(`\nhonors_matcher_recall.test.js: ${results.length - bad.length}/${results.length} checks passed`);
process.exit(bad.length ? 1 : 0);
