// The Honors rows plan and its drafted migrations (S653, redrawn S654; #3315), checked from the committed files.
//
// WHY. Three reviews of #3315. The first: a person guard that refused on unrelated merges, rollbacks keyed on pre-mint
// ids, a receipt that promised images the runner truncates, a fan-in key collision, misclassed multi-base pairs. The
// second: HUMA M1084 written as single-base, lead mints on lumped bases, a "stale" guard that compared two constants,
// a --check that never re-measured. The third: the lump and sequence classes leaked for a third round (MUSI M1044,
// HUMA M1114, ITIS M1068, FTVE M1002, FREN M1014 and the rest minted), so the design was replaced by a narrow rule: a
// row and a mint only where the second derivation finds the pair by number, the base holds one title group, no
// college gives the base two course numbers, and the raw sequence marks agree; held is the default. This test pins
// the third review's findings on the committed plan and SQL. The Postgres proof
// (tests/kb_curation_guarded_sql_proof.py, run with a server) runs the files themselves, and
// tests/honors_of_rows_check_test.py runs the apply-day check and its receipt.
//
// Run from repo root: `npm test` (or `node tests/honors_of_rows_plan.test.js`).
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const OUT = "kb/honors_of_s653_out/";
const dated = fs.readdirSync(path.join(ROOT, OUT)).filter((n) => /^\d{4}-\d{2}-\d{2}$/.test(n)
  && fs.existsSync(path.join(ROOT, OUT, n, "plan.json"))).sort();
const DIR = OUT + dated[dated.length - 1] + "/";
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

const chk = spawnSync("python3", ["kb/_honors_of_s653_dryrun.py", "--check-sql"], { cwd: ROOT, encoding: "utf8" });
check("(1) the committed rows SQL and rollback are what the newest plan writes, and both digests are its own",
  chk.status === 0, (chk.stderr || chk.stdout).slice(-300));
check("(1b) only one plan folder holds a plan.json, so --check cannot read a superseded one", dated.length === 1,
  dated.join(", "));

// (a): two signals, the second derivation by number.
const rows = pairs.filter((p) => p.action.startsWith("row"));
check("(2) every row pair is found by both derivations, and by number", rows.length > 0
  && rows.every((p) => p.found_by.length === 2 && p.second_by.indexOf("number") >= 0),
  rows.filter((p) => p.found_by.length !== 2 || p.second_by.indexOf("number") < 0).map((p) => p.honors_id).join(", "));
const one = pairs.filter((p) => p.found_by.length === 1 && p.honors_system === "M-ID");
check("(3) a pair one derivation alone finds is held and says which", one.length > 0
  && one.every((p) => p.action === "held" && p.holds.some((x) => /alone/.test(x))), one.length);
check("(4) the second derivation's wrong pair never gets a row (MATH 211 / MATH 221)", !act("MATH 211", "MATH 221").startsWith("row"));
// The review's minor finding: six rows on the title route alone.
[["ARTH M10DA", "ARTH 150"], ["ASTR M10BC", "ASTR M1014"], ["BIOL M10ZW", "GEOL M1054"], ["GEOL M10HI", "GEOL 100 L"],
 ["HIST M10UM", "HIST M1183"], ["NUTR M10BL", "NUTR M1014"]]
  .forEach(([h, b]) => check("(5) a title-only pair is held by (a): " + h, held(h, b, /^\(a\)/), act(h, b)));

// Findings 1 and 2: every base the review named lands in held, and by the four tests, not only by the named list.
const NAMED = ["MUSI M1044", "HUMA M1114", "ITIS M1068", "BIOL M1262", "HIST M1183", "BIOL M1049", "ENGL M1348",
  "MATH M1123", "HUMA M1125", "ETHS M1256", "ASTR M1019", "FTVE M1002", "FREN M1035", "FREN M1014", "JAPN M1017",
  "JAPN M1032", "MUSI M1237"];
NAMED.forEach((b) => {
  const ps = pairs.filter((p) => p.base_id === b);
  check("(6) a base the review named is held by the four tests: " + b, ps.length > 0
    && ps.every((p) => p.action === "held" && (p.narrow || []).length > 0),
    ps.map((p) => p.honors_id + " " + p.action).join(", ") || "not in the plan");
});
check("(7) no row carries a hold", rows.every((p) => !p.holds.length), rows.filter((p) => p.holds.length).length);
check("(8) the lump test decides nothing: no hold is a lump_reasons sentence, and it stays a report column",
  pairs.every((p) => p.holds.every((x) => !/^the base holds (more than one course|two parts)|^the Honors id holds two/.test(x)))
  && pairs.some((p) => (p.report_lump || []).length));
check("(9) the sequence marks are read before strip_honors: De Anza's dashed periods hold FTVE M1002 by (d)",
  held("FTVE M1003", "FTVE M1002", /^\(d\)/));
check("(10) Advanced C, C++ and C# are three title groups: ITIS M1068 holds by (b)", held("ITIS M10KP", "ITIS M1068", /^\(b\)/));
check("(11) MUSIC 015A and 015B at one college: MUSI M1044 holds by (c)", held("MUSI M11AP", "MUSI M1044", /^\(c\)/));

// Finding 5: two Honors ids with different parts on one official base, and THTR M11MI.
[["MATH M11DN", "MATH 151"], ["MATH M11DO", "MATH 151"], ["BUSI M10FD", "ACCT 110"], ["BUSI M10FE", "ACCT 110"],
 ["BIOL M10OY", "BIOL 190"], ["BIOL M1103", "BIOL 190"], ["THTR M11MI", "THTR 113"]]
  .forEach(([h, b]) => check("(12) finding 5, held: " + h + " on " + b, held(h, b), act(h, b)));
check("(13) finding 5 is a rule as well as a list: MATH 151's two Precalculus ids hold on their titles",
  held("MATH M11DN", "MATH 151", /takes \d Honors ids whose Honors titles name different courses/));
// Finding 6: a base holding a CCN-coded course (Skyline ASTR C1001L in ASTR M1014).
const astr = pairs.filter((p) => p.base_id === "ASTR M1014");
check("(14) finding 6: every pair on ASTR M1014 is held by the CCN gold standard", astr.length > 0
  && astr.every((p) => p.action === "held" && p.holds.some((x) => /CCN-coded course \(.*ASTR C1001L/.test(x))),
  astr.map((p) => p.honors_id + " " + p.action).join(", "));

// The SQL: the third review's minors and COBIx's two notes.
const pm = plan.summary.person_merges_into_a_planned_id || {};
check("(15) person merges into planned ids are counted and none joins a pair", pm.rows >= 1 && pm.joining_a_planned_pair === 0,
  JSON.stringify(pm));
const fwdAll = read("kb/migrations/2026-11-14_s653_honors_of_rows.sql");
const fwd = code(fwdAll);
check("(16) the SQL header's count of person merges is the overlay's", fwdAll.indexOf(pm.rows + " such rows when this plan was drawn") >= 0,
  pm.rows);
check("(17) the dead joined CTE and its chain walk are gone; moved covers every join", !/joined as \(/.test(fwd)
  && !/with recursive/.test(fwd) && !/walk/.test(fwd) && /moved as \(/.test(fwd));
check("(18) the insert refuses beside a pending unified_title_merge_confirm on a named id (Rule 10 a)",
  /field = 'unified_title_merge_confirm'/.test(fwd) && /\(select n from confirm\) = 0/.test(fwd));
check("(19) the insert refuses once the mint has landed (a row keyed on an H id)", /\(select n from minted\) = 0/.test(fwd));
check("(20) the header names the check receipt the runner requires",
  new RegExp("^-- requires-check-receipt: " + DIR.replace(/[/.]/g, "\\$&") + "check_receipt\\.json$", "m").test(fwdAll));
check("(21) no guard that compares two constants, and the header says --check checks liveness",
  !/stale as \(/.test(fwd) && /--check/.test(fwdAll) && /cannot see the live id set/.test(fwdAll));
const rb = code(read("kb/migrations/2026-11-14_s653_honors_of_rows_rollback.sql"));
check("(22) the step-2 rollback keys on cohort and field, keeps a row a person validated, and counts it",
  /k\.reviewer_email = 'honors-rows-s653@bot' and k\.field = 'honors_of'/.test(rb) && !/course_id in/.test(rb)
  && /and \(k\.validated_by is null or k\.validated_by like '%@bot'\)/.test(rb) && /'kept_for_a_person'/.test(rb));
check("(23) the step-2 rollback refuses after the step-4 mint, on the mint's marker (a row keyed on an H id)",
  /\(select n from minted\) = 0 as ok/.test(rb) && /where g\.ok and k\.reviewer_email/.test(rb) && /::int::text::jsonb/.test(rb));
const rb1 = code(read("kb/migrations/2026-11-14_s653_honors_of_field_rollback.sql"));
check("(24) the step-1 rollback counts only removable step-2 rows, so a person's Verify blocks nothing",
  /r\.reviewer_email = 'honors-rows-s653@bot' and \(r\.validated_by is null or r\.validated_by like '%@bot'\)/.test(rb1)
  && /\(select n from step2\) = 0/.test(rb1) && /\(select n from minted\) = 0/.test(rb1));
check("(25) the step-1 rollback deletes by cohort and field and keeps a validated row",
  /and \(k\.validated_by is null or k\.validated_by like '%@bot'\)/.test(rb1) && /::int::text::jsonb/.test(rb1));
check("(26) the insert returns a count and a digest, never the row images",
  /jsonb_build_object\('inserted', d\.n, 'md5', d\.md5/.test(fwd) && !/to_jsonb\(k\)/.test(fwd)
  && fwd.indexOf(plan.rows_md5) >= 0);
check("(27) the plan carries a class digest beside the rows digest", /^[0-9a-f]{32}$/.test(plan.plan_md5 || "")
  && fwdAll.indexOf(plan.plan_md5) >= 0);

const mints = pairs.filter((p) => p.action === "row and mint").map((p) => p.proposed_h_id);
check("(28) the mint is one to one: no two Honors ids take one H id", new Set(mints).size === mints.length, mints.length);
const folds = pairs.filter((p) => p.action === "row, fold after the mint");
check("(29) each fold keeps its own row, names its lead, and the lead mints the H id",
  folds.every((p) => p.fold_lead && act(p.fold_lead, p.base_id) === "row and mint"
    && by[p.fold_lead + "|" + p.base_id].proposed_h_id === p.fold_into));
[["ANTH M1015", "ETHS M1117"], ["ENGL M1269", "ENGL M1272"], ["ETHS M1266", "ETHS M1213"], ["MATH M1330", "MATH 250"],
 ["HUMA M1084", "PHIL M1095"]]
  .forEach(([h, b]) => check("(30) multi-base, held: " + h, held(h, b, /base identities/), act(h, b)));
check("(31) ASTR M1010 is held beside the CCN record ASTR C1001H", held("ASTR M1010", "ASTR M1012", /ASTR C1001H/));
check("(32) step 1's row stands and step 2 writes none for its two ids",
  !/'HUMA M10ME'\)|\('LIBR M10CJ'/.test(fwd.split("named (id)")[0])
  && pairs.filter((p) => ["HUMA M10ME", "LIBR M10CJ"].indexOf(p.honors_id) >= 0).every((p) => p.notes.some((n) => /step 1's row stands/.test(n))));

// The self-recall measures, recorded in the plan.
const rc = plan.recall || {};
const nr = rc.narrow || {};
check("(33) the plan records each derivation against hand labels; the rows' set makes no labeled-wrong pair",
  rc.both && rc.both.wrong === 0 && rc.matcher && rc.second, JSON.stringify(rc.both && { w: rc.both.wrong }));
check("(34) the narrow rule's labels, both sides: every positive held", nr.positives && nr.positives.labels >= 24
  && nr.positives.wrong === 0 && nr.negatives && nr.negatives.labels >= 24, JSON.stringify(nr.positives));
check("(35) the plan names its measures", /unified_courses_members\.js/.test(read(DIR + "plan.md"))
  && /unified_courses_members\.js/.test(rc.measure || "") && /kb\/coci_curation\.json/.test(pm.measure || "")
  && /unified_courses_members\.js/.test((plan.narrow || {}).measure || ""));
check("(36) nothing is listed to apply", !/honors_of/.test(read("kb/migrations/.apply")));

// The design doc's two minors.
const design = read("docs/reference/honors_of_design.md");
check("(37) the design's step 4 starts its own line", /already stands\.\n4\. \*\*The mints\*\*/.test(design)
  && !/stands\.4\./.test(design));
check("(38) prototype/ccr_remint_blast.json is a dependent and on step 4's land list",
  (design.match(/ccr_remint_blast\.json/g) || []).length >= 2);

const bad = results.filter((x) => !x[1]);
results.forEach(([n, ok, why]) => console.log((ok ? "  ok  " : "  FAIL ") + n + (ok ? "" : "\n        " + why)));
console.log(`\nhonors_of_rows_plan.test.js: ${results.length - bad.length}/${results.length} checks passed`);
process.exit(bad.length ? 1 : 0);
