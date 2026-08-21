// The check-count floor — does the runner actually go red when a file quietly
// stops running some of its checks?
//
// WHY THIS TEST EXISTS
// --------------------
// `tests/run.js` judged a file by its exit status alone, which cannot see a
// check that stops registering: the missing check subtracts from BOTH sides of
// the ratio, so the file prints "N/N passed" and exits 0. Four `cpl_memory`
// rows record that failure in three different harnesses. It is the repo's
// most-repeated lesson and, until this ledger, its least-enforced one.
//
// So this file does not settle for asserting that the parser parses. It builds
// a THROWAWAY RUNNER — a temp directory holding a copy of run.js, its lib, a
// ledger, and a fixture test — and runs it for real, twice: once with the
// fixture at full strength, once with two checks skipped. The second run must
// exit non-zero. If the guard is ever wired up wrongly, this fails.
//
// ⚠ The demonstration is the point, so it must be able to FAIL. Verified
// fail-first 2026-08-21 by running the SAME fixture against the pre-change
// tests/run.js: it printed "All 1 test file(s) passed" and exited 0 with two
// checks gone. The guard is what changed, not the fixture.
//
// The rule being enforced was written down on 2026-08-15 and updated on 08-16:
// docs/kb-notes/methodology-a-check-that-never-registers-can-never-fail.md,
// which already says "watch the total, not just the ratio". Nothing watched it,
// so the trap recurred in two more harnesses. This file is that note's consumer.
//
// Run from repo root: `npm test` (or `node tests/check_ledger.test.js`).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const lib = require("./lib/check_ledger.js");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
// A driver that throws between checks removes them without failing anything —
// the exact defect this file exists to catch, so guard against it here too.
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

// ── (1) The parser reads every shape the corpus actually prints ────────────
// Measured across the whole suite rather than guessed; a shape that stops being
// recognised silently converts a floored file into an unfloored one.
block("(1)", function () {
  const shapes = [
    ["12/12 checks passed", 12, "the most common shape"],
    ["21/21 assertions passed", 21, "the second shape"],
    ["15/15 passed", 15, "bare 'passed'"],
    ["All 45 checks passed.", 45, "the no-ratio shape"],
    ["name.test.js: 12/12 checks passed", 12, "prefixed by the file name"],
    ["3/7 checks passed", 7, "reads the TOTAL, not the pass count"],
    ["nothing to see", null, "no summary at all"],
  ];
  for (const [text, want, why] of shapes) {
    check("(1) parses " + JSON.stringify(text.slice(0, 34)),
      lib.reportedTotal(text) === want, why);
  }
  check("(1) a grand total after section totals wins",
    lib.reportedTotal("part 4/4 checks passed\ntotal 30/30 checks passed") === 30,
    "files that print per-section counts print the grand total last");
});

// ── (2) classify() only calls a DROP a defect ─────────────────────────────
// `a-guard-that-fails-on-truth-gets-muted`: firing on correct behaviour trains
// everyone to discount the check, and a discounted check protects nothing.
block("(2)", function () {
  const led = { files: { "a.test.js": 10, "b.test.js": null } };
  const cases = [
    ["a.test.js", 9, "dropped", "fewer checks than recorded is the defect"],
    ["a.test.js", 10, "ok", "the same count is fine"],
    ["a.test.js", 12, "grown", "MORE checks must never fail — adding tests stays free"],
    ["a.test.js", null, "lost-count", "a floored file that stops reporting lost its cover"],
    ["b.test.js", null, "unparsed", "deliberately unfloored AND silent — already accounted for, stays quiet"],
    ["new.test.js", 5, "unfloored", "a brand-new file must not fail the run"],
    ["new.test.js", null, "unparsed", "no floor and no count — reported, not failed"],
  ];
  for (const [f, obs, want, why] of cases) {
    check("(2) " + f + " @ " + obs + " → " + want,
      lib.classify(f, obs, led).state === want, why);
  }
});

// ── (3) END TO END: a real runner, a real drop, a real red ────────────────
// The parser being right proves nothing about the runner being wired to it.
block("(3)", function () {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "floor-"));
  const tdir = path.join(tmp, "tests");
  fs.mkdirSync(path.join(tdir, "lib"), { recursive: true });
  fs.copyFileSync(path.join(__dirname, "run.js"), path.join(tdir, "run.js"));
  fs.copyFileSync(path.join(__dirname, "lib", "check_ledger.js"),
    path.join(tdir, "lib", "check_ledger.js"));

  // A fixture shaped like the real corpus: it counts what it ran and prints the
  // house summary line. SKIP=1 removes two checks the way a selector that stops
  // matching does — silently, with nothing thrown and nothing failed.
  fs.writeFileSync(path.join(tdir, "fixture.test.js"),
    'const r = [];\n' +
    'const check = (n, c) => r.push([n, !!c]);\n' +
    'check("one", true); check("two", true); check("three", true);\n' +
    'if (!process.env.SKIP) { check("four", true); check("five", true); }\n' +
    'let p = 0; for (const [n, ok] of r) { console.log((ok ? "  ok  " : "FAIL  ") + n); if (ok) p++; }\n' +
    'console.log("\\nfixture.test.js: " + p + "/" + r.length + " checks passed");\n' +
    'if (p !== r.length) process.exit(1);\n');

  const ledgerPath = path.join(tdir, "check_floor.json");
  fs.writeFileSync(ledgerPath, JSON.stringify({ files: { "fixture.test.js": 5 } }));
  const run = (env) => spawnSync("node", [path.join(tdir, "run.js")],
    { encoding: "utf8", env: Object.assign({}, process.env, env) });

  const full = run({});
  check("(3) at full strength the runner is green",
    full.status === 0 && /All 1 test file\(s\) passed/.test(full.stdout || ""),
    "5 of 5 checks ran and the floor is 5");

  const short = run({ SKIP: "1" });
  const out = (short.stdout || "") + (short.stderr || "");
  // The pre-fix behaviour, stated so the demonstration is legible: the fixture
  // itself is perfectly happy — it says 3/3 and exits 0. Only the floor sees it.
  check("(3) the shortened fixture still reports itself as fully passing",
    /3\/3 checks passed/.test(out),
    "this is exactly why exit status cannot catch it");
  check("(3) ⭐ but the RUNNER goes red on the drop",
    short.status !== 0,
    "5 checks were recorded, 3 ran — two rules stopped being enforced");
  check("(3) and it names the file and the size of the loss",
    /fixture\.test\.js/.test(out) && /2 check\(s\) stopped running/.test(out),
    "a failure nobody can act on is barely better than no failure");

  // A brand-new file must never fail the run — adding a test has to stay free,
  // or the guard becomes something people route around.
  fs.writeFileSync(ledgerPath, JSON.stringify({ files: {} }));
  const fresh = run({});
  check("(3) an unfloored file is reported, NOT failed",
    fresh.status === 0 && /no recorded floor yet/.test(fresh.stdout || ""),
    "a guard that fires on correct behaviour gets muted");

  fs.rmSync(tmp, { recursive: true, force: true });
});

// ── (4) The committed ledger matches the committed suite ──────────────────
block("(4)", function () {
  const led = lib.loadLedger();
  const files = fs.readdirSync(__dirname).filter((f) => f.endsWith(".test.js"));
  const known = Object.keys(led.files || {});
  check("(4) a ledger is committed", known.length > 0,
    "without it every file is unfloored and the guard protects nothing");
  const stale = known.filter((f) => !files.includes(f));
  check("(4) it names no file that no longer exists", stale.length === 0,
    "stale entries: " + stale.slice(0, 5).join(", "));
  const floored = known.filter((f) => led.files[f] !== null);
  check("(4) most of the suite is floored",
    files.length > 0 && floored.length / files.length > 0.6,
    floored.length + " of " + files.length + " floored — the rest print no readable count");
});

let pass = 0;
for (const [name, ok, why] of results) {
  console.log((ok ? "  ok  " : "FAIL  ") + name + (!ok && why ? "\n        > " + why : ""));
  if (ok) pass++;
}
console.log("\ncheck_ledger.test.js: " + pass + "/" + results.length + " checks passed");
if (pass !== results.length) process.exit(1);
