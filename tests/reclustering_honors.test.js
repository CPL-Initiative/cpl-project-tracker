// The Honors detection rule of the S648 re-clustering plan, gate by gate.
//
// WHY. Sam ruled on 2026-11-13 (Open Asks Sheet 191 card 1, cpl_memory sam-honors-own-mid-2026-11-13) that an
// Honors course gets its own M-ID with a declared equivalence to its base course. Which course is Honors, and
// which is its base, decides how many identities move, so each reading of the rule is a gate in
// kb/_reclustering_s648_dryrun.py and each gate has a fixture here. A fixture that passes with its gate removed
// guards nothing, so this file runs the fixtures twice: as written (each must pass) and with each gate dropped
// (`--drop-gate`, its own fixture must fail while the positive controls still pass).
//
// The gates: title_word ("Honoring Diversity" is not Honors), code_not_enough (De Anza's AUTO 060H is not
// Honors), program_course (Honors Colloquium has no base), same_college, base_not_honors, code_and_title (a code
// match must agree on title), unique_title (a title-only base must be the only one at the college).
//
// Run from repo root: `npm test` (or `node tests/reclustering_honors.test.js`).
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const SCRIPT = "kb/_reclustering_s648_dryrun.py";
const results = [];
const check = (name, ok, why) => results.push([name, !!ok, why]);

function run(args) {
  const r = spawnSync("python3", [SCRIPT, "--selftest"].concat(args), { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) return { error: (r.stderr || "").slice(-400) };
  try { return JSON.parse(r.stdout); } catch (e) { return { error: "unparseable: " + r.stdout.slice(0, 200) }; }
}

const base = run([]);
check("(1) the selftest runs", !base.error, base.error);
const gates = (base.gates || []);
const fixtures = (base.results || []).filter((x) => x.gate);
const controls = (base.results || []).filter((x) => !x.gate);

check("(2) seven gates are declared", gates.length === 7, "gates: " + gates.join(", "));
gates.forEach((g) => {
  check("(3) gate " + g + " has a fixture", fixtures.some((x) => x.gate === g), "no fixture names " + g);
});
fixtures.forEach((x) => {
  check("(4) as written: " + x.name, x.pass, "expected " + JSON.stringify(x.expected) + ", got " + JSON.stringify(x.got));
});
check("(5) four or more positive controls", controls.length >= 4, controls.length + " controls");
controls.forEach((x) => {
  check("(6) as written: " + x.name, x.pass, "expected " + x.expected + ", got " + x.got);
});

gates.forEach((g) => {
  const dropped = run(["--drop-gate", g]);
  const mine = (dropped.results || []).filter((x) => x.gate === g);
  check("(7) dropping " + g + " fails its own fixture", !dropped.error && mine.length && mine.every((x) => !x.pass),
    dropped.error || "the fixture still passes with the gate removed, so it guards nothing");
  const ctl = (dropped.results || []).filter((x) => !x.gate);
  check("(8) dropping " + g + " leaves the positive controls passing", ctl.length && ctl.every((x) => x.pass),
    "a control fails: " + ctl.filter((x) => !x.pass).map((x) => x.name).join(", "));
});

const bad = spawnSync("python3", [SCRIPT, "--drop-gate", "title_word"], { cwd: ROOT, encoding: "utf8" });
check("(9) --drop-gate outside --selftest is refused, so a plan is never cut with a gate removed",
  bad.status !== 0, "exit " + bad.status);

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nreclustering_honors.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
