// The identity lint must not be able to empty itself silently.
//
// ⭐ WHY. kb/_build_college_identity_crosswalk.py takes an OPTIONAL
// `--observed-json` — every college-name string seen in a live table — and that
// input is what produces the `findings` list the College Identity tab exists to
// show. On 2026-08-21 (#1283) the builder was re-run without it. `findings` went
// **13 -> 0** in a -135-line diff, the tab began printing "Nothing outstanding",
// and it stayed that way through four merges while two real join defects
// ("Cypress College " and "San Jose City College ", both with a trailing space
// and a real coordinator) sat unfixed in map_college_contacts.
//
// ⚠️ NOBODY MISREAD THE DIFF — an empty findings list is INDISTINGUISHABLE from
// a clean bill of health, which is precisely the distinction this artifact is
// for. `cpl_memory` recorded the hazard the same day
// (`regenerating-an-artifact-without-its-input-empties-the-finding`) and the
// artifact still shipped empty, because recording a rule and enforcing it are
// two different events.
//
// So there are now two mechanisms and this file pins both:
//   1. the builder REFUSES to publish an unlinted artifact over a linted one
//      (exit non-zero, artifact untouched) unless --no-lint is passed;
//   2. the artifact stamps `linted`, and the tab renders "not checked" rather
//      than "Nothing outstanding" when it is false.
//
// Run from repo root: `npm test` (or `node tests/college_identity_lint_guard.test.js`).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const BUILDER = "kb/_build_college_identity_crosswalk.py";
const PY = fs.readFileSync(BUILDER, "utf8");
const TAB = fs.readFileSync("college_identity.js", "utf8");
const ART = fs.readFileSync("college_identity_data.js", "utf8");

// ── 1. The shipped artifact is actually linted ──────────────────────────────
block("1. the artifact", () => {
  let data = null;
  try {
    const sandbox = { window: {} };
    new Function("window", ART).call(sandbox, sandbox.window);
    data = sandbox.window.CPL_COLLEGE_IDENTITY;
  } catch (e) { /* reported below */ }
  check("(1) college_identity_data.js parses and exposes CPL_COLLEGE_IDENTITY", !!data);
  if (!data) return;
  check("(1) ⭐ it records that the lint RAN", data.linted === true,
    "linted=" + JSON.stringify(data.linted) + " — an artifact that does not say "
    + "whether it was checked cannot be told apart from one that was checked and "
    + "found nothing");
  check("(1) …and how many names were checked", typeof data.observed_names === "number"
    && data.observed_names > 100, "observed_names=" + data.observed_names);
  check("(1) ⚠️ the findings list is NOT empty",
    Array.isArray(data.findings) && data.findings.length > 0,
    "this is the state #1283 shipped for four merges; if this ever legitimately "
    + "reaches zero, the two whitespace join defects have been fixed at source "
    + "and THAT is worth a note, not a silent green");
  check("(1) ⚠️ the MAP sandbox colleges are gone from Sierra's corpus",
    !/Test College|PosTest|CabTest|SantTest/.test(ART),
    "deleted from chatbox_college_profiles 2026-08-23; receipt in "
    + "kb/college_identity/2026-08-23_test_org_removal.md");
});

// ── 2. THE GUARD, exercised — not merely read ───────────────────────────────
// Receipt directories that are tracked in git. The cleanup below must never
// remove one of these — only the spill from this test's own rebuilds.
const COMMITTED_RECEIPTS = new Set(
  (() => { try {
    return require("child_process")
      .execSync("git ls-files kb/college_identity/", { encoding: "utf8" })
      .split("\n").map((f) => (f.split("/")[2] || "")).filter(Boolean);
  } catch (e) { return []; } })());

block("2. the builder refuses to empty itself", () => {
  const MAP = "kb/college_identity/_inputs/map_colleges_2026-08-21.json";
  const OBS = "kb/college_identity/_inputs/observed_names_2026-08-23.json";
  check("(2) the committed lint inputs are present",
    fs.existsSync(MAP) && fs.existsSync(OBS),
    "the guard is only useful if the input it demands is actually in the repo");
  if (!fs.existsSync(MAP)) return;

  // The builder writes college_identity_data.js in place, so snapshot and
  // restore around every invocation. A test that leaves the artifact emptied
  // would itself commit the bug it is guarding.
  const before = fs.readFileSync("college_identity_data.js");
  const restore = () => fs.writeFileSync("college_identity_data.js", before);
  const run = (args) => spawnSync("python3", [BUILDER, "--map-json", MAP].concat(args),
    { encoding: "utf8" });

  try {
    const refused = run([]);
    check("(2) ⭐ no --observed-json over an artifact WITH findings → exits non-zero",
      refused.status !== 0, "exit=" + refused.status);
    check("(2) ⚠️ …and says why, naming the flag that fixes it",
      /REFUSING to regenerate without --observed-json/.test(refused.stderr || "")
      && /--no-lint/.test(refused.stderr || ""),
      "stderr=" + JSON.stringify(String(refused.stderr || "").slice(0, 160)));
    check("(2) ⭐ …and leaves the artifact UNTOUCHED",
      fs.readFileSync("college_identity_data.js").equals(before),
      "refusing but writing anyway would be the same defect with a warning");

    const deliberate = run(["--no-lint"]);
    check("(2) --no-lint is honored (the escape hatch exists)",
      deliberate.status === 0);
    const unlinted = fs.readFileSync("college_identity_data.js", "utf8");
    check("(2) ⚠️ …and the unlinted artifact SAYS it is unlinted",
      /"linted":\s*false/.test(unlinted),
      "this is what stops the tab reporting a clean bill of health");
    restore();

    const good = run(["--observed-json", OBS]);
    check("(2) with the input it rebuilds cleanly", good.status === 0,
      "exit=" + good.status + " stderr=" + String(good.stderr || "").slice(0, 120));
    // Compare everything EXCEPT the embedded generation date. The artifact
    // stamps the day it was built, so a literal byte-for-byte assertion goes
    // red at 00:00 UTC on the day after every rebuild — for every session, on
    // every branch, with nothing actually wrong. (It did, on 2026-08-24.)
    // The claim this check exists to make is "the committed artifact is what
    // the committed INPUTS produce"; the calendar is not one of the inputs.
    const undate = (b) => String(b).replace(/"generated":\s*"\d{4}-\d{2}-\d{2}"/,
                                           '"generated":"<date>"');
    check("(2) …reproducing the committed artifact exactly (bar its build date)",
      undate(fs.readFileSync("college_identity_data.js")) === undate(before),
      "if this fails the committed artifact is not what the committed inputs "
      + "produce, which makes the whole lint unreproducible");
    check("(2) \u26a0 …and the only tolerated difference IS the date",
      /"generated":\s*"\d{4}-\d{2}-\d{2}"/.test(String(before)),
      "the exemption above is only safe while the field it forgives exists; if "
      + "the stamp is ever renamed this check fails instead of silently widening");
  } finally {
    restore();
    // The builder also writes kb/college_identity/<today>/ as a side effect.
    // Left behind, it shows up as untracked work nobody did — and on a new
    // date it is a fresh directory, which is what trips a git-clean hook.
    const today = new Date().toISOString().slice(0, 10);
    const spill = "kb/college_identity/" + today;
    if (!COMMITTED_RECEIPTS.has(today) && fs.existsSync(spill))
      fs.rmSync(spill, { recursive: true, force: true });
  }
});

// ── 3. The tab tells the two states apart ───────────────────────────────────
block("3. the tab", () => {
  check("(3) ⭐ an unlinted snapshot renders as NOT CHECKED",
    /linted === false/.test(TAB) && /NOT checked/.test(TAB),
    "a tab whose job is making absence visible must not present its own absence "
    + "as health");
  check("(3) ⚠️ …and explicitly denies the 'nothing outstanding' reading",
    /it is \\u201cnot looked at\\u201d|not looked at/.test(TAB));
  check("(3) the genuine empty case still reads as clean, with its denominator",
    /Nothing outstanding/.test(TAB) && /observed_names/.test(TAB),
    "'Nothing outstanding — 130 names checked' is a claim; 'Nothing outstanding' "
    + "alone is an assertion with no evidence attached");
});

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\ncollege_identity_lint_guard.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
