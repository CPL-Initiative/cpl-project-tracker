// The EFFECTIVE dials hook — _effective() must report what the model USES.
//
// WHY THIS EXISTS. Sam, 2026-08-26: "Never rely on the config, Sky." A session
// read `yearPriorities["2"].factor = 1` out of the live Supabase config and
// reported it as the model's Year-2 factor. The model uses 0.5, because
// `mirrorYears` makes prioSlot() return "1" for EVERY year, so the stored
// Year-2 block is never read. The value was saved, present, and completely
// inert — a MISSING value sends you looking, a dormant one does not.
//
// So the fixture below is built to be a TRAP: Year 2 carries deliberately
// different values from Year 1, and the pool block carries the RETIRED
// noncredit dials (feeder_carveout / nc_floor_window / nc_cap_window /
// nc_threshold_ftes — R3–R5, one-pool adoption 2026-08-31), which a real
// stored config still holds and the model reads none of. A hook that
// transcribes storage reports Year 2's numbers and a noncredit lane; a hook
// that asks the model reports Year 1's and one pool. Only one of those passes.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_effective.test.js`).
const { check, freshDom, boot, finish } = require("./lib/cpl_funding_harness.js");

const CFG = (mirror) => ({
  projects: {
    "cpl-implementation": {
      area: "cpl", label: "CPL Implementation and Project Funding",
      scenarios: {
        "Scenario 1": {
          // floor/cap deliberately differ from the baked 150,000 / 400,000 so
          // section 3 proves the hook reports the CONFIG the model resolved,
          // not the data file's defaults. The four retired noncredit dials are
          // the pool block's own trap (present, stored, read by nothing).
          pool: { admin_cost: 800000, floor_window: 140000, cap_window: 390000,
                  feeder_carveout: 1800000, nc_floor_window: 50000,
                  nc_cap_window: 100000, nc_threshold_ftes: 500,
                  scaling_projects_tech: 8959692 },
          years: ["2026-27", "2027-28"],
          mirrorYears: mirror,
          disbursement: "frontload",
          priorityOrder: [2, 0, 1],
          yearPriorities: {
            "1": {
              "0": { share: 0.33, title: "Outreach", factor: 0.5, metric: "Eligible CPL Units measured in FTES" },
              "1": { share: 0.33, title: "Success", factor: 0.5, metric: "Transcribed CPL Units measured in FTES" },
              "2": { share: 0.34, title: "Access", factor: 0.5, metric: "Applied units measured in FTES" },
            },
            // THE TRAP — every value here differs from Year 1.
            "2": {
              "0": { share: 0.10, title: "Y2Outreach", factor: 1, metric: "Y2 metric A" },
              "1": { share: 0.10, title: "Y2Success", factor: 1, metric: "Y2 metric B" },
              "2": { share: 0.80, title: "Y2Access", factor: 1, metric: "Y2 metric C" },
            },
          },
        },
      },
    },
  },
});

// ── 1. mirrorYears ON — Year 2 must report YEAR 1's values ───────────────
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setConfig(CFG(true));
  const e = T._effective();
  const y2 = e.years.find((y) => y.slot === "2");

  check("1a: mirrorYears is reported as on", e.mirrorYears === true);
  check("1b: Year 2 is flagged as mirrored FROM year 1", y2 && y2.mirroredFrom === "1");
  check("1c: Year 2 factor is Year 1's 0.5, NOT the stored 1 — the exact 2026-08-26 error",
    y2 && y2.priorities.every((p) => p.factor === 0.5));
  check("1d: Year 2 titles are Year 1's, not the stored Y2* ones",
    y2 && y2.priorities.every((p) => !/^Y2/.test(p.title || "")));
  check("1e: Year 2 shares are Year 1's (0.34/0.33/0.33), not the stored 0.80/0.10/0.10",
    y2 && y2.priorities.every((p) => p.share !== 0.8 && p.share !== 0.1));
  // Front-load is the SECOND reason a stored Year-2 block cannot matter, and it
  // is independent of the mirror. Both are reported so neither is inferred.
  check("1f: Year 2 is flagged as carryover under front-load", y2 && y2.carryover === true);
  check("1g: Year 1 is NOT flagged mirrored or carryover",
    e.years[0].mirroredFrom === null && e.years[0].carryover === false);

  // priorityOrder [2,0,1] — the screen ordinal is not the stored index. Quoting
  // one as the other is its own bug, so both are reported per priority.
  const p1 = e.years[0].priorities[0];
  check("1h: P1 on screen is stored index 2 (the permutation is reported)",
    p1.pos === 1 && p1.srcIndex === 2 && p1.title === "Access");
}

// ── 2. mirrorYears OFF — Year 2 must now report its OWN values ───────────
// The mirror-on case alone would also pass if the hook simply always read
// Year 1. This is what separates "asks the model" from "hardcodes slot 1".
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setConfig(CFG(false));
  const e = T._effective();
  const y2 = e.years.find((y) => y.slot === "2");

  check("2a: with the mirror off, Year 2 is not flagged mirrored", y2 && y2.mirroredFrom === null);
  check("2b: with the mirror off, Year 2 reports its OWN factor of 1",
    y2 && y2.priorities.every((p) => p.factor === 1));
  check("2c: with the mirror off, Year 2 reports its own titles",
    y2 && y2.priorities.some((p) => /^Y2/.test(p.title || "")));
}

// ── 3. ONE POOL: _effective().pool agrees with _model()/_alloc(), and the
//       retired noncredit lane is not reported (R3–R5, 2026-08-31) ────────
// This block used to pin _effective().nc against the SECOND SOLVE (_nc());
// that solve is gone — one pool, one solve — so it now pins the same
// two-readers-of-one-fact property against _model() and the per-institution
// _alloc()/_ncAward() decomposition. 3b/3c are still the checks that caught
// _effective() reading a boot-time memo while the model had moved on.
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setConfig(CFG(true));
  const e = T._effective();
  const m = T._model();

  check("3a: _effective's pool block agrees with the model on the roster size (118 institutions)",
    e.pool.institutions === Object.keys(m.W).length && e.pool.institutions === 118);
  check("3b: ...on the at-base and at-cap counts", e.pool.at_floor === m.floorCount &&
    e.pool.at_cap === m.cappedCount);
  check("3c: ...on the pool — net_college is what the awards actually sum to",
    Math.abs(e.pool.net_college - T._netCollege()) < 0.5 &&
    Math.abs(Object.keys(m.W).reduce((s, k) => s + m.W[k], 0) - e.pool.net_college) < 1);
  check("3d: the dials are reported from the resolved config, not assumed from the baked file",
    e.pool.floor_window === 140000 && e.pool.cap_window === 390000);
  // The clamp is bounded, so nobody can sit outside it.
  const awards = Object.keys(m.W).map((k) => m.W[k]).filter((v) => v > 0);
  check("3e: every award sits within the one base/cap window",
    awards.length > 0 && awards.every((v) => v >= 140000 - 0.01 && v <= 390000 + 0.01));
  // The stored NC dials above are PRESENT and INERT — the 2026-08-26 error
  // class, reproduced deliberately. A hook that transcribed the config would
  // report them; the model's hook must not (there is no nc block at all).
  check("3f: no _effective().nc block, and no retired dial is reported (R3–R5)",
    e.nc === undefined &&
    !("net_before_feeder" in e.pool) &&
    !("nc_floor_window" in e.pool) && !("nc_cap_window" in e.pool) &&
    !("nc_threshold_ftes" in e.pool) && !("feeder_carveout" in e.pool));
  // The noncredit story the hook DOES report is the one-pool decomposition,
  // and it must agree with the per-institution API, never be re-derived.
  const trioHeld = ["NOCE", "SD Cont. Ed", "Calbright"]
    .reduce((s, k) => s + T._alloc(k).w, 0);
  const colShares = Object.keys(m.W)
    .filter((k) => ["NOCE", "SD Cont. Ed", "Calbright"].indexOf(k) === -1)
    .reduce((s, k) => s + T._ncAward(k), 0);
  check("3g: nc_only_held_by_origination = Σ trio awards (their whole award is the nc slice)",
    Math.abs(e.pool.nc_only_held_by_origination - trioHeld) < 1);
  check("3h: nc_college_shares = Σ college _ncAward() (the FTES-split decomposition, not a 2nd pool)",
    Math.abs(e.pool.nc_college_shares - colShares) < 1);
}

// ── 4. _effective() re-solves rather than returning a stale cache ────────
// The sweep in scripts/funding_effective.js moves a dial between calls; a
// cached answer would silently report the previous base's numbers. The
// mutation below deliberately bypasses the setters (no render, no cache
// clear), so only _effective()'s own cache-clearing makes 4a/4b pass —
// exactly the property the product comment credits this file for.
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setConfig(CFG(true));
  const before = T._effective();
  const shared = T._getShared();
  shared.pool = Object.assign({}, shared.pool, { floor_window: 15000 });
  const after = T._effective();

  check("4a: lowering the base award is reflected on the next _effective() call",
    after.pool.floor_window === 15000 && before.pool.floor_window === 140000);
  check("4b: lowering the base moves institutions OFF it",
    after.pool.at_floor < before.pool.at_floor);
  check("4c: ...and _effective() still agrees with _model() after the change",
    after.pool.at_floor === T._model().floorCount);
}

finish();
