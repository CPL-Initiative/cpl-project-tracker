// The Honors rows plan and its drafted migrations (S653, #3315), checked from the committed files.
//
// WHY. #3313's readers found the first rows plan unsafe: its person guard refused the whole insert over 45 person
// merges that join no pair; its rollbacks keyed on pre-mint ids and missed every row a mint re-keys; its receipt
// promised row images the runner truncates at 4,000 characters; a fan-in fold wrote one (course_id, field) key twice;
// four multi-base pairs were classed single-base; ASTR M1010 would have minted beside the CCN record ASTR C1001H; and
// three folds joined distinct Honors courses (Modern Fiction into Introduction to Fiction; Music History part II into
// part I). This test pins each fix on the committed plan and SQL. The Postgres proof
// (tests/kb_curation_guarded_sql_proof.py, run locally with a server) runs the files themselves.
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

const chk = spawnSync("python3", ["kb/_honors_of_s653_dryrun.py", "--check-sql", "--date", "2026-11-14"],
  { cwd: ROOT, encoding: "utf8" });
check("(1) the committed rows SQL and rollback are what the plan writes, and the digest is the rows'",
  chk.status === 0, (chk.stderr || chk.stdout).slice(-300));

// Item 1: the person guard holds only a join.
const pm = plan.summary.person_merges_into_a_planned_id || {};
check("(2) person merges into planned ids are counted and none joins a pair", pm.rows >= 1 && pm.joining_a_planned_pair === 0,
  JSON.stringify(pm));
const fwd = code(read("kb/migrations/2026-11-14_s653_honors_of_rows.sql"));
check("(3) the insert's guard walks merge chains for a join and never refuses on a merge's value alone",
  /with recursive planned/.test(fwd) && /joined as \(/.test(fwd) && !/p\.value = n\.id/.test(fwd));

// Items 2 and 3: cohort-keyed rollbacks, a receipt that fits.
const rb = code(read("kb/migrations/2026-11-14_s653_honors_of_rows_rollback.sql"));
check("(4) the step-2 rollback keys on its cohort and the field, with no id list",
  /k\.reviewer_email = 'honors-rows-s653@bot' and k\.field = 'honors_of'/.test(rb) && !/course_id in/.test(rb));
const rb1 = code(read("kb/migrations/2026-11-14_s653_honors_of_field_rollback.sql"));
check("(5) the step-1 rollback deletes by cohort and field, refuses while a step-2 row stands or a title is missing",
  /where g\.ok and k\.reviewer_email = 'honors-s653@bot' and k\.field = 'honors_of'\s*\n\s*returning/.test(rb1)
  && /r\.reviewer_email = 'honors-rows-s653@bot'\) = 0/.test(rb1) && /::int::text::jsonb/.test(rb1));
check("(6) the insert returns a count and a digest, never the row images",
  /jsonb_build_object\('inserted', d\.n, 'md5', d\.md5/.test(fwd) && !/to_jsonb\(k\)/.test(fwd)
  && fwd.indexOf(plan.rows_md5) >= 0);
const before = JSON.parse(read(DIR + "step1_restamp_before.json"));
check("(7) the restamp's before-values are committed: two rows, automerge-v1@bot, the June stamp",
  before.rows.length === 2 && before.rows.every((r) => r.reviewer_email === "automerge-v1" + "@bot"
    && r.reviewed_at === "2026-06-12T22:47:01.69179+00:00"));

// Item 4: the S652 rollback refuses unless it restores both titles.
const rb652 = code(read("kb/migrations/2026-11-14_s652_honors_followups_rollback.sql"));
check("(8) the S652 follow-ups rollback refuses a partial restore and deletes by cohort and field",
  /when g\.ok and \(select count\(\*\) from restored\) = 2 and \(select count\(\*\) from removed\) = 2/.test(rb652)
  && !/k\.course_id in/.test(rb652));

// Item 5: the live id set.
check("(9) the insert refuses a planned value outside its named set", /stale as \(/.test(fwd)
  && /p\.value not in \(select id from named\)/.test(fwd));

// Item 6: fan-in.
const mints = pairs.filter((p) => p.action === "row and mint").map((p) => p.proposed_h_id);
check("(10) the mint is one to one: no two Honors ids take one H id", new Set(mints).size === mints.length, mints.length);
const folds = pairs.filter((p) => p.action === "row, fold after the mint");
check("(11) each fold keeps its own row, names its lead, and the lead mints the H id",
  folds.length > 0 && folds.every((p) => p.fold_lead && act(p.fold_lead, p.base_id) === "row and mint"
    && by[p.fold_lead + "|" + p.base_id].proposed_h_id === p.fold_into));

// Item 7: reclassed pairs.
[["ANTH M1015", "ETHS M1117"], ["ENGL M1269", "ENGL M1272"], ["ETHS M1266", "ETHS M1213"], ["MATH M1330", "MATH 250"]]
  .forEach(([h, b]) => check("(12) multi-base, held: " + h, act(h, b) === "held"
    && by[h + "|" + b].holds.some((x) => /base identities/.test(x)), act(h, b)));
check("(13) ASTR M1010 is held beside the CCN record ASTR C1001H", act("ASTR M1010", "ASTR M1012") === "held"
  && by["ASTR M1010|ASTR M1012"].holds.some((x) => /ASTR C1001H/.test(x)));
[["ENGL M11BM", "ENGL M1258"], ["ENGL M11BN", "ENGL M1258"], ["MUSI M10CE", "MUSI M1002"], ["ECON M10BX", "ECON M1026"]]
  .forEach(([h, b]) => check("(14) a fold that would join distinct Honors courses is held: " + h,
    act(h, b) === "held" && by[h + "|" + b].holds.some((x) => /distinct Honors courses/.test(x)), act(h, b)));

// Item 8: the matcher's recall, on the plan's own members file.
check("(15) the plan records the recall test: none wrong, none missed", plan.recall && plan.recall.wrong === 0
  && plan.recall.missed === 0, JSON.stringify(plan.recall && { w: plan.recall.wrong, m: plan.recall.missed }));
check("(16) the wrong pair is gone and a recovered pair is planned", act("MATH 211", "MATH 221") === "(absent)"
  && act("ARCH M10AP", "ARCH M10AN") === "row and mint");

// Item 10: every count names its measure.
check("(17) the plan names its measures", /unified_courses_members\.js/.test(read(DIR + "plan.md"))
  && /unified_courses_members\.js/.test(plan.recall.measure) && /kb\/coci_curation\.json/.test(pm.measure || ""));
check("(18) nothing is listed to apply", !/honors_of/.test(read("kb/migrations/.apply")));

const bad = results.filter((x) => !x[1]);
results.forEach(([n, ok, why]) => console.log((ok ? "  ok  " : "  FAIL ") + n + (ok ? "" : "\n        " + why)));
console.log(`\nhonors_of_rows_plan.test.js: ${results.length - bad.length}/${results.length} checks passed`);
process.exit(bad.length ? 1 : 0);
