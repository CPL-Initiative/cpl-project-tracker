/**
 * Small-cell suppression floor — the label must never drift from the threshold.
 *
 * Why this test exists (2026-08-10, SkyLine): the floor rose 5 → 10 at Sam's
 * direction. The threshold was a named constant in Python, but the MASK was the
 * literal "<5" hard-coded in eight JS call sites — one of which already printed
 * the live floor beside a stale "<5" ("counts under 10 read <5"). Changing the
 * number alone would have made every public surface UNDERSTATE the protection
 * while OVERSTATING precision, and nothing would have failed.
 *
 * So the guard is not "the floor is 10" — that would just re-encode the value.
 * It is "no surface hard-codes a suppression mask", plus a positive control that
 * the helpers actually track a changed payload.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

const results = [];
const check = (name, fn) => {
  try { fn(); results.push([true, name]); }
  catch (e) { results.push([false, name + " — " + e.message]); }
};

/* ── 1. No hard-coded mask literals in the consumers ───────────────────────── */

// Matches "<5" / "&lt;5" / "<10" / "&lt;10" only where it is a MASK — i.e. a
// standalone quoted token or an escaped entity in markup — not a comparison
// like `n < 5` and not prose inside a comment.
const MASK_LITERAL = /(["'])\s*(?:<|&lt;)\s*\d+\s*\1|&lt;\d+\s*(?:students|eligible)/g;

for (const file of ["cpl_funding.js", "credential_reference.js"]) {
  check(`${file}: no hard-coded suppression mask outside comments`, () => {
    const offenders = [];
    read(file).split("\n").forEach((line, i) => {
      const code = line.replace(/^\s*\/\/.*$/, "");   // drop whole-line comments
      if (/^\s*(\/\/|\*)/.test(line)) return;          // skip comment/JSDoc lines
      let m;
      MASK_LITERAL.lastIndex = 0;
      while ((m = MASK_LITERAL.exec(code)) !== null) offenders.push(`${i + 1}: ${m[0]}`);
    });
    assert.strictEqual(offenders.length, 0,
      "hard-coded mask(s) found — render from the emitted floor instead:\n  " +
      offenders.join("\n  "));
  });
}

/* ── 2. The generator emits the floor so consumers can read it ─────────────── */

check("excel_to_dashboard.py emits served_suppress_below in _stats", () => {
  const py = read("excel_to_dashboard.py");
  assert.ok(/"served_suppress_below":\s*SERVED_SUPPRESS_BELOW/.test(py),
    "the CER payload must carry the floor, not just apply it");
});

check("the two published floors agree", () => {
  const a = /SERVED_SUPPRESS_BELOW\s*=\s*(\d+)/.exec(read("excel_to_dashboard.py"));
  const b = /^SUPPRESS_BELOW\s*=\s*(\d+)/m.exec(read("funding/_build_cr_backlog.py"));
  assert.ok(a && b, "could not read both floors");
  assert.strictEqual(a[1], b[1],
    `credential floor ${a[1]} vs backlog floor ${b[1]} — two floors for the same ` +
    `anonymous asker is the inconsistency this change removed`);
});

/* ── 3. Positive control: the helpers TRACK the payload, not a constant ────── */

check("credential_reference servedMask() follows a changed payload", () => {
  const src = read("credential_reference.js");
  const konst = /var SERVED_FLOOR_FALLBACK\s*=\s*\d+;/.exec(src);
  const body = /function servedFloor\(\)\s*\{[\s\S]*?\n  \}/.exec(src);
  const mask = /function servedMask\(\)\s*\{[\s\S]*?\}/.exec(src);
  assert.ok(konst && body && mask, "servedFloor()/servedMask()/fallback not found");

  const sandbox = { window: {} };
  const fn = new Function("window",
    `${konst[0]}\n${body[0]}\n${mask[0]}\nreturn {servedFloor, servedMask};`);
  const api = fn(sandbox.window);

  // No payload at all → safe fallback, never an unmasked or lower value.
  assert.strictEqual(api.servedFloor(), 10, "fallback floor must be the safe one");

  // A payload with a DIFFERENT floor must win — this is what proves the helper
  // reads rather than hard-codes. If someone re-inlines a literal, this fails.
  sandbox.window.CPL_CREDENTIAL_REFERENCE = { _stats: { served_suppress_below: 25 } };
  assert.strictEqual(api.servedFloor(), 25, "helper ignored the payload floor");
  assert.strictEqual(api.servedMask(), "<25", "mask did not follow the floor");

  // A garbage floor must not disable suppression.
  sandbox.window.CPL_CREDENTIAL_REFERENCE = { _stats: { served_suppress_below: 0 } };
  assert.strictEqual(api.servedFloor(), 10, "a zero floor must fall back, not pass through");
});

check("cpl_funding maskLt() follows a changed payload", () => {
  const src = read("cpl_funding.js");
  const perf = /function perf\(\)\s*\{[^}]*\}/.exec(src);
  const floor = /function suppressFloor\(\)\s*\{[\s\S]*?\n  \}/.exec(src);
  const mask = /function maskLt\(esc\)\s*\{[\s\S]*?\}/.exec(src);
  assert.ok(perf && floor && mask, "suppressFloor()/maskLt() not found");

  const sandbox = { window: {} };
  const api = new Function("window",
    `${perf[0]}\n${floor[0]}\n${mask[0]}\nreturn {suppressFloor, maskLt};`)(sandbox.window);

  assert.strictEqual(api.suppressFloor(), 10, "fallback floor must be the safe one");
  assert.strictEqual(api.maskLt(true), "&lt;10", "escaped mask wrong");
  assert.strictEqual(api.maskLt(false), "<10", "plain mask wrong");

  sandbox.window.CPL_FUNDING_PERF = { suppress_below: 25 };
  assert.strictEqual(api.maskLt(true), "&lt;25", "mask did not follow the payload floor");
});

/* ── report ────────────────────────────────────────────────────────────────── */
let failed = 0;
results.forEach(([ok, name]) => {
  if (!ok) failed++;
  console.log(`  ${ok ? "✓" : "✗"} ${name}`);
});
console.log(`\nsuppression_floor: ${results.length - failed}/${results.length} passed`);
if (failed) process.exit(1);
