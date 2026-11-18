// Lassen College's Cal-GETC figure from its own catalog (S651, d-calgetc-34-per-college-evidence-s648).
//
// WHY. A transfer degree that names Cal-GETC and reads no unit figure for it fails on arithmetic alone. The
// ruling lets such a degree take a figure only from words the reconcile config quotes for that college: a
// catalog that prints its own figure takes a `set` step, never the statewide default and never a regex over
// free text. Lassen's 2026-2027 catalog prints it on the pattern page (PDF p.72, printed p.70):
// "Cal-GETC General Education Certificate of Achievement requires 34 Units." The fixture
// tests/fixtures/lassen_calgetc_p72.txt holds that page's lines as college-page-read run 43570566375 printed
// them (course lists under Areas 3 to 5 left out), so the guard is pinned to the quoted page, never to a live
// file's size.
//
// What it guards: (1) the config entry quotes the page's own sentence, at its page, as a set step for transfer
// degrees naming the pattern and degree total, and carries no statewide step; (2) the quoted words are on the
// fixture page, and its six area figures add to the 34 it prints; (3) the step, run by the reconcile itself,
// fills 34 only on a transfer degree that names Cal-GETC, its pattern and its degree total, and leaves a
// record with a figure, a local degree and a record without a degree total alone; (4) the committed apply plan
// applies only the ten records that fail on arithmetic alone, holds the two overlap records and 31297 (42300's
// legacy number, held by the conductor) for restore, and turns no passing record failing; (5) a plan rebuilt by
// --calgetc-apply from the filed records never reaches 33388 (the step's only_with total_units: no printed
// major total, the electives-fill false-pass class) and still holds the overlap pair, and the one hold it cannot
// carry, 31297, is named so a committed rebuild that drops it fails here.
//
// Run from repo root: `npm test` (or `node tests/program_requirements_lassen_calgetc.test.js`).
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const COLLEGE = "Lassen College";
const WORDS = "Cal-GETC General Education Certificate of Achievement requires 34 Units.";
const PAGE = fs.readFileSync(path.join(__dirname, "fixtures", "lassen_calgetc_p72.txt"), "utf8");
const CONF = (JSON.parse(fs.readFileSync(path.join(ROOT, "kb", "program_requirements_reconcile.json"), "utf8"))
  .colleges || {})[COLLEGE] || {};
const STEP = (CONF.steps || []).find((s) => s.field === "ge_units") || {};

block("(1) config", () => {
  check("(1) Lassen's entry is one set step on ge_units at 34 for transfer degrees",
    (CONF.steps || []).length === 1 && STEP.kind === "set"
    && JSON.stringify(STEP.value) === JSON.stringify({ min: 34, max: 34 }) && STEP.awards === "transfer");
  check("(1) only where the record names its pattern, degree total and printed major total",
    JSON.stringify(STEP.only_with) === JSON.stringify(["ge_pattern", "degree_total", "total_units"]));
  check("(1) the source is the 2026-2027 catalog at PDF p.72 and the words are the page's own sentence",
    /2026-2027-College-Catalog-3\.pdf#page=72$/.test(STEP.source || "") && STEP.source_words === WORDS);
  check("(1) no statewide step: the catalog prints its own figure", !("statewide_cal_getc" in CONF));
  check("(1) the why names the ruling and the page read's run",
    /d-calgetc-34-per-college-evidence-s648/.test(CONF.why || "") && /43570566375/.test(CONF.why || ""));
});

block("(2) the page", () => {
  check("(2) the fixture is printed page 70 of the 2026-2027 catalog, PDF p.72",
    /^\[pdf page 72\]/.test(PAGE) && /Lassen Community College 2026-2027 Page 70/.test(PAGE));
  check("(2) the quoted sentence is on the page word for word", PAGE.includes(WORDS));
  const areas = [...PAGE.matchAll(/^AREA (\d):[^\n]*?(\d+) units/gm)].map((m) => [m[1], Number(m[2])]);
  check("(2) six areas, 1 to 6, whose figures (9, 3, 6, 6, 7, 3) add to the 34 the page prints",
    areas.map((a) => a[0]).join("") === "123456"
    && areas.map((a) => a[1]).join(",") === "9,3,6,6,7,3"
    && areas.reduce((t, a) => t + a[1], 0) === 34, JSON.stringify(areas));
});

// The reconcile itself, on Lassen's committed config: one Python run, its answers as JSON.
const PY = `
import json, sys
sys.path.insert(0, "kb")
import _program_requirements_reconcile as R
def rec(**p):
    base = {"section_heading": "Associate in Arts Degree in Sociology for Transfer", "total_units": {"min": 18, "max": 18},
            "ge_pattern": "Cal-GETC", "degree_total": {"min": 60, "max": 60}, "ge_units": {"min": None, "max": None},
            "electives_fill_degree": True}
    base.update(p)
    return {"program": base, "blocks": []}
text = "Associate in Arts Degree in Sociology for Transfer\\nComplete the Cal-GETC pattern.\\nTotal 60 units"
C = "Lassen College"
out = {}
r, n = R.reconcile(rec(), text, C, "A.A- T Degree")
out["fills"] = [r["program"]["ge_units"], [x["words"] for x in n]]
out["has_figure"] = R.reconcile(rec(ge_units={"min": 37, "max": 37}), text, C, "A.A- T Degree")[0]["program"]["ge_units"]
out["local"] = R.reconcile(rec(), text, C, "A.A. Degree")[0]["program"]["ge_units"]
out["no_major"] = R.reconcile(rec(total_units={"min": None, "max": None}), text, C, "A.A- T Degree")[0]["program"]["ge_units"]
out["no_total"] = R.reconcile(rec(degree_total={"min": None, "max": None}), text, C, "A.S. T Degree")[0]["program"]["ge_units"]
out["no_name"] = R.reconcile(rec(), "Associate in Arts Degree in Sociology for Transfer\\nTotal 60 units", C, "A.A- T Degree")[0]["program"]["ge_units"]
out["statewide"] = R.calgetc_step(R.load_steps().get(C)) is None
print(json.dumps(out))
`;
block("(3) the reconcile", () => {
  const got = JSON.parse(execFileSync("python3", ["-c", PY], { cwd: ROOT, encoding: "utf8" }));
  const empty = JSON.stringify({ min: null, max: null });
  check("(3) a transfer degree naming Cal-GETC, its pattern and degree total takes 34",
    JSON.stringify(got.fills[0]) === JSON.stringify({ min: 34, max: 34 }), JSON.stringify(got.fills));
  check("(3) its note names the page and quotes the catalog's sentence",
    got.fills[1].length === 1 && got.fills[1][0].includes("#page=72") && got.fills[1][0].includes(WORDS));
  check("(3) a record already holding a figure keeps it",
    JSON.stringify(got.has_figure) === JSON.stringify({ min: 37, max: 37 }));
  check("(3) a local degree is left alone", JSON.stringify(got.local) === empty);
  check("(3) a record without a degree total is left alone", JSON.stringify(got.no_total) === empty);
  check("(3) a record without a printed major total is left alone (33388's shape)",
    JSON.stringify(got.no_major) === empty);
  check("(3) a page that never names Cal-GETC fills nothing", JSON.stringify(got.no_name) === empty);
  check("(3) the statewide rule does not run at Lassen", got.statewide === true);
});

block("(4) the apply plan", () => {
  const plan = JSON.parse(fs.readFileSync(path.join(ROOT, "kb", "program_requirements_college", "lassen",
    "calgetc_apply_plan.json"), "utf8"));
  const TEN = ["30947", "31015", "31037", "31132", "31379", "32083", "33263", "33729", "33730", "42300"];
  check("(4) the route is the college's set step, quoting p.72",
    plan.route === "college set step" && plan.step && plan.step.source_words === WORDS);
  check("(4) the ten that fail on arithmetic alone are applied at 34",
    TEN.every((cn) => plan.apply.includes(cn))
    && plan.rows.filter((r) => TEN.includes(r.control_number))
      .every((r) => JSON.stringify(r.ge_units_after) === JSON.stringify({ min: 34, max: 34 }) && r.passes_after));
  const HELD = ["31297", "35106", "41912"];
  check("(4) only the ten are applied",
    JSON.stringify(plan.apply) === JSON.stringify(TEN) && plan.counts.apply === 10);
  check("(4) the two overlap records (35106, 41912) and 31297 are held and restored before the reread",
    JSON.stringify(plan.held) === JSON.stringify(HELD)
    && JSON.stringify(plan.restore_before_reread) === JSON.stringify(HELD)
    && plan.rows.filter((r) => HELD.includes(r.control_number))
      .every((r) => r.held && JSON.stringify(r.ge_units_after) === JSON.stringify(r.ge_units_before)));
  check("(4) 31297 waits as 42300's legacy number, held by hand and said so",
    /legacy number of 42300/.test((plan.rows.find((r) => r.control_number === "31297") || {}).held || "")
    && /by hand on the conductor's decision/.test(plan.hand_holds || ""));
  check("(4) 33388 never reaches the plan", !plan.rows.some((r) => r.control_number === "33388"));
  check("(4) no passing record turns failing", plan.counts.pass_to_fail === 0);
  check("(4) Lassen's first reconcile: the run's whole filing is compared with main", plan.first_reconcile === true);
});

// (5) The plan as --calgetc-apply would rebuild it from the filed records, on the committed config.
const REBUILD = `
import json, sys
sys.path.insert(0, "kb")
import _program_requirements_readings_measure as RM
recs = [f for f in RM.filed_records() if f["college"] == "Lassen College"]
p = RM.calgetc_apply_plan(recs, "Lassen College")
print(json.dumps({"apply": p["apply"], "held": p["held"], "rows": [r["control_number"] for r in p["rows"]],
                  "pass_to_fail": p["counts"]["pass_to_fail"]}))
`;
block("(5) a rebuilt plan", () => {
  const got = JSON.parse(execFileSync("python3", ["-c", REBUILD], { cwd: ROOT, encoding: "utf8" }));
  const TEN = ["30947", "31015", "31037", "31132", "31379", "32083", "33263", "33729", "33730", "42300"];
  check("(5) the rebuilt plan never reaches 33388: the config keeps it out", !got.rows.includes("33388"));
  check("(5) the rebuilt plan still holds the overlap pair (35106, 41912)",
    JSON.stringify(got.held) === JSON.stringify(["35106", "41912"]));
  // A record a reread already filed at 34 leaves the rebuild ("field already set"), so the rebuild applies a
  // subset of the ten, plus 31297, whose ge_units the hold keeps empty.
  check("(5) the rebuilt plan applies only from the ten, and 31297, so 31297 is the one hand hold",
    got.apply.every((cn) => TEN.includes(cn) || cn === "31297") && got.apply.includes("31297")
    && got.pass_to_fail === 0, JSON.stringify(got.apply));
  const plan = JSON.parse(fs.readFileSync(path.join(ROOT, "kb", "program_requirements_college", "lassen",
    "calgetc_apply_plan.json"), "utf8"));
  check("(5) the committed plan carries that hand hold: a rebuild committed without it fails here",
    plan.held.includes("31297") && !plan.apply.includes("31297"));
});

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nprogram_requirements_lassen_calgetc.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
