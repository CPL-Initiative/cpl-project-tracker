// The Honors rows plan and its drafted migrations (S653, #3315), checked from the committed files.
//
// WHY. Two reviews of #3315. The first: a person guard that refused on unrelated merges, rollbacks keyed on pre-mint
// ids, a receipt that promised images the runner truncates, a fan-in key collision, misclassed multi-base pairs.
// The second: HUMA M1084 written as single-base because a space before Fullerton's college letter hid its second
// base; lead mints on bases that hold several courses (ENGL M1258, MUSI M1002, ECON M1026, CHEM M1044); a SQL
// "stale" guard that compared two constants; a --check that never re-measured the pairs; rollbacks that deleted a
// row a person verified. The plan was redesigned: a row needs two derivations that share no code; a base or Honors id
// holding more than one course is held, leads included. This test pins each on the committed plan and SQL. The
// Postgres proof (tests/kb_curation_guarded_sql_proof.py, run with a server) runs the files themselves, and
// tests/honors_of_rows_check_test.py runs the apply-day check.
//
// Run from repo root: `npm test` (or `node tests/honors_of_rows_plan.test.js`).
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const DIR = "kb/honors_of_s653_out/2026-11-14/";
const results = [];
const check = (name, ok, why) => results.push([name, !!ok, why]);
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const code = (s) => s.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");

const plan = JSON.parse(read(DIR + "plan.json"));
const pairs = plan.pairs;
const by = {};
pairs.forEach((p) => { by[p.honors_id + "|" + p.base_id] = p; });
const act = (h, b) => (by[h + "|" + b] || {}).action || "(absent)";
const held = (h, b, re) => act(h, b) === "held" && (!re || by[h + "|" + b].holds.some((x) => re.test(x)));

const chk = spawnSync("python3", ["kb/_honors_of_s653_dryrun.py", "--check-sql", "--date", "2026-11-14"],
  { cwd: ROOT, encoding: "utf8" });
check("(1) the committed rows SQL and rollback are what the plan writes, and the digest is the rows'",
  chk.status === 0, (chk.stderr || chk.stdout).slice(-300));

// Two signals or hold.
const rows = pairs.filter((p) => p.action.startsWith("row"));
check("(2) every row pair is found by both derivations", rows.length > 0 && rows.every((p) => p.found_by.length === 2),
  rows.filter((p) => p.found_by.length !== 2).map((p) => p.honors_id).join(", "));
const one = pairs.filter((p) => p.found_by.length === 1 && p.honors_system === "M-ID");
check("(3) a pair one derivation alone finds is held and says which", one.length > 0
  && one.every((p) => p.action === "held" && p.holds.some((x) => /alone/.test(x))), one.length);
check("(4) the second derivation's wrong pair never gets a row (MATH 211 / MATH 221)", !act("MATH 211", "MATH 221").startsWith("row"));

// The space before the college letter: HUMA M1084 has two bases and holds.
check("(5) HUMA M1084 is multi-base and held", held("HUMA M1084", "PHIL M1095", /base identities/)
  && held("HUMA M1084", "PHIL M1003"));

// Lumps, leads included.
[["ENGL M11BL", "ENGL M1258"], ["MUSI M10BT", "MUSI M1002"], ["ECON M1029", "ECON M1026"], ["PHYS M10EV", "CHEM M1044"],
 ["HIST M1200", "HIST M1201"], ["HIST M10HN", "HIST M1096"], ["ARTS M10LJ", "ARTS M1566"]]
  .forEach(([h, b]) => check("(6) a lead on a base that holds more than one course is held: " + h,
    held(h, b, /holds more than one course|parts or periods|two Honors courses/), act(h, b)));
const lumpRows = rows.filter((p) => p.base_system === "M-ID" && p.holds.length);
check("(7) no row carries a hold", lumpRows.length === 0, lumpRows.map((p) => p.honors_id).join(", "));
[["ENGL M11BM", "ENGL M1258"], ["ENGL M11BN", "ENGL M1258"], ["MUSI M10CE", "MUSI M1002"], ["ECON M10BX", "ECON M1026"]]
  .forEach(([h, b]) => check("(8) a follower on a lumped base is held: " + h, held(h, b), act(h, b)));

// Items 1 to 3 and 5 of the first review, and the second review's SQL findings.
const pm = plan.summary.person_merges_into_a_planned_id || {};
check("(9) person merges into planned ids are counted and none joins a pair", pm.rows >= 1 && pm.joining_a_planned_pair === 0,
  JSON.stringify(pm));
const fwd = code(read("kb/migrations/2026-11-14_s653_honors_of_rows.sql"));
const fwdAll = read("kb/migrations/2026-11-14_s653_honors_of_rows.sql");
check("(10) the insert walks merge chains for a join and never refuses on a merge's value alone",
  /with recursive planned/.test(fwd) && /joined as \(/.test(fwd) && !/p\.value = n\.id/.test(fwd));
check("(11) no guard that compares two constants: the stale CTE is gone, and the header says --check checks liveness",
  !/stale as \(/.test(fwd) && /--check/.test(fwdAll) && /cannot see the live id set/.test(fwdAll)
  && !/outside the named set/.test(fwdAll));
const rb = code(read("kb/migrations/2026-11-14_s653_honors_of_rows_rollback.sql"));
check("(12) the step-2 rollback keys on cohort and field, keeps a row a person validated, and counts it",
  /k\.reviewer_email = 'honors-rows-s653@bot' and k\.field = 'honors_of'/.test(rb) && !/course_id in/.test(rb)
  && /and \(k\.validated_by is null or k\.validated_by like '%@bot'\)/.test(rb) && /'kept_for_a_person'/.test(rb));
const rb1 = code(read("kb/migrations/2026-11-14_s653_honors_of_field_rollback.sql"));
check("(13) the step-1 rollback deletes by cohort and field, keeps a validated row, refuses while a step-2 row stands",
  /and \(k\.validated_by is null or k\.validated_by like '%@bot'\)/.test(rb1)
  && /r\.reviewer_email = 'honors-rows-s653@bot'\) = 0/.test(rb1) && /::int::text::jsonb/.test(rb1));
check("(14) the insert returns a count and a digest, never the row images",
  /jsonb_build_object\('inserted', d\.n, 'md5', d\.md5/.test(fwd) && !/to_jsonb\(k\)/.test(fwd)
  && fwd.indexOf(plan.rows_md5) >= 0);
const mints = pairs.filter((p) => p.action === "row and mint").map((p) => p.proposed_h_id);
check("(15) the mint is one to one: no two Honors ids take one H id", new Set(mints).size === mints.length, mints.length);
const folds = pairs.filter((p) => p.action === "row, fold after the mint");
check("(16) each fold keeps its own row, names its lead, and the lead mints the H id",
  folds.every((p) => p.fold_lead && act(p.fold_lead, p.base_id) === "row and mint"
    && by[p.fold_lead + "|" + p.base_id].proposed_h_id === p.fold_into));
[["ANTH M1015", "ETHS M1117"], ["ENGL M1269", "ENGL M1272"], ["ETHS M1266", "ETHS M1213"], ["MATH M1330", "MATH 250"]]
  .forEach(([h, b]) => check("(17) multi-base, held: " + h, held(h, b, /base identities/), act(h, b)));
check("(18) ASTR M1010 is held beside the CCN record ASTR C1001H", held("ASTR M1010", "ASTR M1012", /ASTR C1001H/));

// The self-recall measures, recorded in the plan.
const rc = plan.recall || {};
check("(19) the plan records each derivation against hand labels; the rows' set makes no labeled-wrong pair",
  rc.both && rc.both.wrong === 0 && rc.matcher && rc.second && rc.lumps && rc.lumps.wrong === 0,
  JSON.stringify(rc.both && { w: rc.both.wrong }));
check("(20) the plan names its measures", /unified_courses_members\.js/.test(read(DIR + "plan.md"))
  && /unified_courses_members\.js/.test(rc.measure || "") && /kb\/coci_curation\.json/.test(pm.measure || ""));
check("(21) the plan lists its signals", plan.summary.by_signals && Object.keys(plan.summary.by_signals).length >= 1);
check("(22) nothing is listed to apply", !/honors_of/.test(read("kb/migrations/.apply")));

const bad = results.filter((x) => !x[1]);
results.forEach(([n, ok, why]) => console.log((ok ? "  ok  " : "  FAIL ") + n + (ok ? "" : "\n        " + why)));
console.log(`\nhonors_of_rows_plan.test.js: ${results.length - bad.length}/${results.length} checks passed`);
process.exit(bad.length ? 1 : 0);
