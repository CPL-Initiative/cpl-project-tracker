// Guards tests/lib/limiter.js — the scheduling behind the parallel test runner.
//
// Written because the runner's failure modes here are both silent-ish and
// expensive: a limiter that leaks a slot runs unbounded (a 3.8 GB file times N
// is an OOM, which reads as a TEST FAILURE), and one that never releases
// deadlocks — a CI job that hangs with no output at all. Neither is visible
// from reading the code, so each is provoked here.
const { makeLimiter } = require("./lib/limiter.js");

// ⚠️ An unresolved promise does NOT keep Node alive: on a deadlock this file
// used to reach the end of the event loop and exit 0 — a silent PASS for the
// exact bug it exists to catch. Every wait below is time-bounded, and this
// counter is asserted at the end so an early exit cannot masquerade as success
// (the runner's check-ledger floors the total independently).
const EXPECTED_CHECKS = 9;
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name); }
}

// ⚠️ Every await here is bounded. A leaked slot does not FAIL a naive test, it
// HANGS it — and a hung suite in CI reads as a timeout with no output, which is
// exactly the failure this file is supposed to name. `within` turns "waits for
// ever" into a check that fails in a second.
const within = (promise, ms, what) => Promise.race([
  promise,
  new Promise((_, rej) => setTimeout(() => rej(new Error("timed out: " + what)), ms)),
]);

const defer = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

(async () => {
  // ── never exceeds its width ────────────────────────────────────────────
  {
    const limit = makeLimiter(3);
    let active = 0, peak = 0;
    const gates = [];
    const tasks = Array.from({ length: 12 }, () => {
      const g = defer(); gates.push(g);
      return limit(async () => {
        active++; peak = Math.max(peak, active);
        await g.promise;
        active--;
      });
    });
    await new Promise((r) => setImmediate(r));
    check("limiter: never runs more than its width at once", peak === 3);
    check("limiter: fills its width immediately", peak === 3 && active === 3);
    gates.forEach((g) => g.resolve());
    let drained = true;
    try {
      await within(Promise.all(tasks), 3000, "all 12 tasks to drain");
    } catch (e) { drained = false; }
    check("limiter: a released task frees its slot so the queue drains "
          + "(a leak HANGS instead of failing, so this is time-bounded)",
      drained && active === 0);
  }

  // ── submission order is preserved ──────────────────────────────────────
  {
    const limit = makeLimiter(1);
    const order = [];
    try {
      await within(Promise.all([1, 2, 3, 4].map((i) =>
        limit(async () => { order.push(i); }))), 3000, "four serial tasks");
    } catch (e) { /* order stays short -> the check fails */ }
    check("limiter: at width 1 tasks run in submission order",
      order.join(",") === "1,2,3,4");
  }

  // ── a REJECTING task must not leak its slot ────────────────────────────
  // Without release-on-failure the counter never decrements and every later
  // task waits for ever — a hung job rather than a red one.
  {
    const limit = makeLimiter(2);
    const results = [];
    await Promise.allSettled([
      limit(async () => { throw new Error("boom"); }),
      limit(async () => { throw new Error("boom"); }),
    ]);
    let freed = true;
    try {
      await within(Promise.all([limit(async () => results.push("a")),
                                limit(async () => results.push("b"))]),
                   3000, "tasks queued behind two rejections");
    } catch (e) { freed = false; }
    check("limiter: a rejected task releases its slot", freed && results.length === 2);
  }

  // ── a SYNCHRONOUS throw must not leak its slot either ──────────────────
  {
    const limit = makeLimiter(1);
    await Promise.allSettled([limit(() => { throw new Error("sync"); })]);
    let ran = false;
    let ok = true;
    try {
      await within(limit(async () => { ran = true; }), 3000, "task after a sync throw");
    } catch (e) { ok = false; }
    check("limiter: a synchronous throw releases its slot", ok && ran);
  }

  // ── width is clamped to something runnable ─────────────────────────────
  {
    for (const bad of [0, -4, NaN]) {
      const limit = makeLimiter(bad);
      let ran = false;
      try { await within(limit(async () => { ran = true; }), 3000, "clamped width"); }
      catch (e) { /* ran stays false -> the check fails */ }
      check("limiter: width " + bad + " still runs (clamped to 1)", ran);
    }
  }

  if (pass + fail !== EXPECTED_CHECKS) {
    fail++;
    console.log("  FAIL limiter: only " + (pass + fail - 1) + " of " +
      EXPECTED_CHECKS + " checks ran — the suite exited early");
  }
  console.log("\n" + pass + "/" + (pass + fail) + " checks passed");
  process.exit(fail === 0 ? 0 : 1);
})();
