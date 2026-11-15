// The Honors rows plan and its drafted migrations (S653, redrawn S654 on anchors; #3315), checked from the committed
// files.
//
// WHY. Four reviews of #3315. The first three found person guards, rollback keying, fan-in and the lump and sequence
// class; the fourth found the class again (LIBR M10CL, BIOL M1317, HIST M1165, HUMA M10LS minting on impure
// clusters, the CCN hold skipping official bases). Every design had asserted the Honors relation between two clusters
// and tried to certify each cluster as one course. The conductor replaced the question (d-honors-anchored-rows-s654):
// a row rests on same-college course pairs, its anchors (kb/_honors_anchors.py), and carries them, so a later split
// of either cluster can rewire it. This test pins the anchored plan, the SQL and the design doc. The Postgres proof
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
const get = (h, b) => by[h + "|" + b] || { action: "(absent)", holds: [], no_mint: [], anchors: [] };
const act = (h, b) => get(h, b).action;

const chk = spawnSync("python3", ["kb/_honors_of_s653_dryrun.py", "--check-sql"], { cwd: ROOT, encoding: "utf8" });
check("(1) the committed rows SQL and rollback are what the newest plan writes, and both digests are its own",
  chk.status === 0, (chk.stderr || chk.stdout).slice(-300));
check("(1b) only one plan folder holds a plan.json, so --check cannot read a superseded one", dated.length === 1,
  dated.join(", "));

// Rules 1 and 2: every row rests on anchors, and every anchor of a row lands in its base.
const rows = pairs.filter((p) => p.action.startsWith("row"));
check("(2) every row carries its anchors, each a same-college pair with both codes and both titles", rows.length > 0
  && rows.every((p) => p.anchors.length > 0 && p.anchors.every((a) => a.college && a.honors_code && a.base_code
    && typeof a.honors_title === "string" && typeof a.base_title === "string")),
  rows.filter((p) => !p.anchors.length).map((p) => p.honors_id).join(", "));
check("(3) every anchor of a row is a good anchor and lands in the row's base", rows.every((p) => p.anchors.every((a) =>
  a.kind === "anchor" && a.base_id === p.base_id)), rows.filter((p) => p.anchors.some((a) => a.base_id !== p.base_id))
  .map((p) => p.honors_id).join(", "));
const split = pairs.filter((p) => p.action === "held" && p.holds.some((x) => /^anchors split/.test(x)));
check("(4) anchors in two bases hold the Honors id (anchors split)", split.length > 0
  && split.every((p) => new Set(p.anchors.filter((a) => a.kind === "anchor").map((a) => a.base_id)).size > 1), split.length);
check("(5) a doubtful anchor never sits on a row", rows.every((p) => p.anchors.every((a) => a.kind !== "doubtful")));
check("(6) an M-ID pair with no anchor gets no row (none: no anchor)", pairs.some((p) => p.action === "none: no anchor")
  && pairs.filter((p) => p.action === "none: no anchor").every((p) => !p.anchors.length));
check("(7) no row carries a hold", rows.every((p) => !p.holds.length), rows.filter((p) => p.holds.length).length);

// Rule 3: the mint.
const mints = pairs.filter((p) => p.action === "row and mint");
check("(8) a mint's every member course is the Honors course of an anchor", mints.every((p) =>
  p.honors.local_courses === new Set(p.anchors.map((a) => a.college + "|" + a.honors_code)).size));
const into = {};
pairs.forEach((p) => p.honors_system === "M-ID" && (p.anchors || []).forEach((a) => {
  if (a.kind === "anchor" && a.base_id !== p.honors_id) (into[a.base_id] = into[a.base_id] || new Set()).add(p.honors_id);
}));
check("(9) a mint's base has exactly one Honors M-ID anchored into it", mints.every((p) => into[p.base_id].size === 1),
  mints.filter((p) => into[p.base_id].size !== 1).map((p) => p.base_id).join(", "));
check("(10) the mint is one to one: no two Honors ids take one H id", new Set(mints.map((p) => p.proposed_h_id)).size === mints.length);
check("(11) a mint never sits on an official base", mints.every((p) => p.base_system === "M-ID"));
check("(12) a base holding a CCN-coded course mints nothing, whatever its kind",
  pairs.filter((p) => p.no_mint.concat(p.holds).some((x) => /CCN-coded course/.test(x))).every((p) => p.action !== "row and mint"));

// The cases four reviews named, as the anchored rule decides them (kb/_honors_matcher_recall.py CLUSTER_LABELS).
check("(13) LIBR M10CL mints on its one anchor, Fullerton LIB 100HF beside LIB 100 F", act("LIBR M10CL", "LIBR M1026") === "row and mint"
  && get("LIBR M10CL", "LIBR M1026").anchors.some((a) => a.honors_code === "LIB 100HF"));
check("(14) BIOL M1317's row stands and its mint waits on the unanchored Cosumnes BIOL 485",
  act("BIOL M1317", "BIOL M1318") === "row, mint held"
  && get("BIOL M1317", "BIOL M1318").no_mint.some((x) => /BIOL 485/.test(x)));
check("(15) HIST M1165 and HUMA M10LS mint on their anchors", act("HIST M1165", "HIST M1191") === "row and mint"
  && act("HUMA M10LS", "HUMA M1088") === "row and mint");
check("(16) MATH M10NA anchors once the padding zero drops (071H beside 71) and holds on MATH 210's CCN course",
  act("MATH M10NA", "MATH 210") === "held" && get("MATH M10NA", "MATH 210").anchors.some((a) => /071H/.test(a.honors_code))
  && get("MATH M10NA", "MATH 210").holds.some((x) => /CCN-coded course/.test(x)));
check("(16b) ETHS M1266 is held as split once San Jose City's (ETH) 027H meets (ETH) 27, and the SQL writes no row for it",
  pairs.filter((p) => p.honors_id === "ETHS M1266").every((p) => p.action === "held")
  && get("ETHS M1266", "ETHS M1213").holds.some((x) => /^anchors split/.test(x))
  && read("kb/migrations/2026-11-14_s653_honors_of_rows.sql").indexOf("('ETHS M1266'") < 0);
check("(16c) an anchor with no Honors word is doubtful: PHYS M1015 (Contra Costa PHYS 121H) is held and has no row",
  act("PHYS M1015", "PHYS 110") === "held" && get("PHYS M1015", "PHYS 110").anchors.every((a) => a.kind === "doubtful")
  && read("kb/migrations/2026-11-14_s653_honors_of_rows.sql").indexOf("('PHYS M1015'") < 0);
check("(17) MATH M1333 is held: the official base MATH 210 holds MATH C2210 and C2210H", act("MATH M1333", "MATH 210") === "held"
  && get("MATH M1333", "MATH 210").holds.some((x) => /CCN-coded course \(MATH C2210/.test(x)));
check("(18) step 1's two rows stand, and neither base mints (each takes a second Honors M-ID)",
  ["HUMA M10ME|HUMA M1110", "LIBR M10CJ|LIBR M1040"].every((k) => (by[k] || {}).action === "row, mint held"
    && by[k].notes.some((n) => /step 1/.test(n))));

// The cluster tests are report columns only.
check("(19) a split candidate can carry a row: the cluster tests hold nothing", rows.some((p) => (p.split_candidate || []).length)
  && pairs.every((p) => p.holds.every((x) => !/title group|two course numbers|sequence marks/.test(x))));
check("(20) the plan lists the split candidates", (plan.summary.split_candidates || []).length > 0);
check("(21) plan.md says in two plain sentences that an impure base is the base's own, and the anchors rewire it",
  /A row on an impure base is the base's own impurity, not this plan's fault\. The anchors say where the row goes when the base is split/
    .test(read(DIR + "plan.md")));
check("(22) plan.md lists every row with its anchors", rows.every((p) => read(DIR + "plan.md").indexOf("`" + p.honors_id + "` to `" + p.base_id + "`") >= 0));
check("(23) the class digest covers the anchors", /^[0-9a-f]{32}$/.test(plan.plan_md5 || "")
  && /anchor/.test(read("kb/_honors_of_s653_dryrun.py").split("def plan_md5")[1].split("def plan_dir")[0]));

// The SQL.
const pm = plan.summary.person_merges_into_a_planned_id || {};
const fwdAll = read("kb/migrations/2026-11-14_s653_honors_of_rows.sql");
const fwd = code(fwdAll);
check("(24) person merges into planned ids are counted, none joins a pair, and the header's count is the overlay's",
  pm.rows >= 1 && pm.joining_a_planned_pair === 0 && fwdAll.indexOf(pm.rows + " such rows when this plan was drawn") >= 0,
  JSON.stringify(pm));
check("(25) no chain walk and no joined CTE; moved covers every join", !/joined as \(/.test(fwd) && !/with recursive/.test(fwd)
  && /moved as \(/.test(fwd));
check("(26) the insert refuses beside a pending unified_title_merge_confirm and after the mint",
  /field = 'unified_title_merge_confirm'/.test(fwd) && /\(select n from confirm\) = 0/.test(fwd) && /\(select n from minted\) = 0/.test(fwd));
check("(27) the header names the check receipt the runner requires, once",
  (fwdAll.match(/requires.?check.?receipt/gi) || []).length === 1
  && new RegExp("^-- requires-check-receipt: " + DIR.replace(/[/.]/g, "\\$&") + "check_receipt\\.json$", "m").test(fwdAll));
check("(28) the insert returns a count and a digest, never the row images, and its row count is the plan's",
  /jsonb_build_object\('inserted', d\.n, 'md5', d\.md5/.test(fwd) && !/to_jsonb\(k\)/.test(fwd)
  && fwd.indexOf(plan.rows_md5) >= 0 && plan.step2_rows === rows.filter((p) => ["HUMA M10ME", "LIBR M10CJ"].indexOf(p.honors_id) < 0).length);
const rb = code(read("kb/migrations/2026-11-14_s653_honors_of_rows_rollback.sql"));
check("(29) the step-2 rollback keys on cohort and field, keeps a validated row, and refuses after the mint",
  /k\.reviewer_email = 'honors-rows-s653@bot' and k\.field = 'honors_of'/.test(rb) && !/course_id in/.test(rb)
  && /'kept_for_a_person'/.test(rb) && /\(select n from minted\) = 0 as ok/.test(rb) && /::int::text::jsonb/.test(rb));
const rb1 = code(read("kb/migrations/2026-11-14_s653_honors_of_field_rollback.sql"));
check("(30) the step-1 rollback counts only removable step-2 rows and reads the mint's marker",
  /\(select n from step2\) = 0/.test(rb1) && /\(select n from minted\) = 0/.test(rb1));

// The self-recall measures, recorded in the plan.
const rc = plan.recall || {};
check("(31) anchor and cluster labels: every one right", rc.anchors && rc.anchors.wrong === 0 && rc.anchors.labels >= 22
  && rc.clusters && rc.clusters.wrong === 0 && rc.clusters.labels >= 20, JSON.stringify({ a: rc.anchors && rc.anchors.wrong, c: rc.clusters && rc.clusters.wrong }));
check("(32) every clause of rules 1 to 3, dropped, fails a label", (rc.mutation || []).length === 16
  && rc.mutation.every((m) => m.caught), JSON.stringify((rc.mutation || []).filter((m) => !m.caught)));
check("(33) the plan names its measures", /unified_courses_members\.js/.test(read(DIR + "plan.md"))
  && /unified_courses_members\.js/.test((plan.summary.anchors || {}).measure || "") && /kb\/coci_curation\.json/.test(pm.measure || ""));

// Applied state (#3315's fourth review, finding 7): once the rows apply, .apply names the rows file. This check then
// reports the applied state instead of failing; the honors_of_rows_check test reads the overlay the same way.
const apply = read("kb/migrations/.apply");
if (/s653_honors_of_rows\.sql/.test(apply)) {
  console.log("  note: kb/migrations/.apply names the rows file: the applied state; check (34) reads it as such");
  check("(34) the rows file is the one listed to apply", /file=kb\/migrations\/2026-11-14_s653_honors_of_rows\.sql/.test(apply));
} else {
  check("(34) nothing Honors-step-2 is listed to apply", !/honors_of_rows/.test(apply));
}

// The design doc.
const design = read("docs/reference/honors_of_design.md");
check("(35) the design names the anchored rows and the split candidates", /d-honors-anchored-rows-s654/.test(design)
  && /split candidate/.test(design) && /kb\/_honors_anchors\.py/.test(design));
check("(36) the design's step 4 starts its own line", /already stands\.\n4\. \*\*The mints\*\*/.test(design));
check("(36b) plan.md carries step 4's two notes: HLTH M10ZH beside PHS 102, and the mint's own rollback first",
  /## Before the mints \(step 4\)/.test(read(DIR + "plan.md")) && /HLTH M10ZH/.test(read(DIR + "plan.md"))
  && /Step 4's own rollback/.test(read(DIR + "plan.md")));
check("(37) prototype/ccr_remint_blast.json is a dependent and on step 4's land list",
  (design.match(/ccr_remint_blast\.json/g) || []).length >= 2);

const bad = results.filter((x) => !x[1]);
results.forEach(([n, ok, why]) => console.log((ok ? "  ok  " : "  FAIL ") + n + (ok ? "" : "\n        " + why)));
console.log(`\nhonors_of_rows_plan.test.js: ${results.length - bad.length}/${results.length} checks passed`);
process.exit(bad.length ? 1 : 0);
