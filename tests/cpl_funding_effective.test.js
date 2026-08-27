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
// different values from Year 1. A hook that transcribes storage reports Year
// 2's numbers; a hook that asks the model reports Year 1's. Only one of those
// passes.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_effective.test.js`).
const { check, freshDom, boot, finish } = require("./lib/cpl_funding_harness.js");

const CFG = (mirror) => ({
  projects: {
    "cpl-implementation": {
      area: "cpl", label: "CPL Implementation and Project Funding",
      scenarios: {
        "Scenario 1": {
          pool: { admin_cost: 800000, floor_window: 150000, cap_window: 400000,
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

// ── 3. The noncredit lane comes from ncModel(), never re-derived ─────────
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setConfig(CFG(true));
  const e = T._effective();
  const nc = T._nc();

  check("3a: _effective's nc block agrees with ncModel() on the roster size",
    e.nc.institutions === nc.rows.length);
  check("3b: ...on the at-floor count", e.nc.at_floor === Object.keys(nc.floored).length);
  check("3c: ...on the pool", e.nc.pool === nc.pool);
  check("3d: the dials are reported, not assumed",
    e.nc.floor_window === 50000 && e.nc.cap_window === 100000 && e.nc.threshold_ftes === 500);
  // The clamp is bounded, so nobody can sit outside it.
  const awards = Object.keys(nc.W).map((k) => nc.W[k]).filter((v) => v > 0);
  check("3e: every noncredit award sits within its own floor and cap",
    awards.length > 0 && awards.every((v) => v >= nc.floor - 0.01 && v <= nc.cap + 0.01));
}

// ── 4. _nc() re-solves rather than returning a stale cache ───────────────
// The sweep in scripts/funding_effective.js moves a dial between calls; a
// cached answer would silently report the previous floor's numbers.
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setConfig(CFG(true));
  const before = T._nc();
  const shared = T._getShared();
  shared.pool = Object.assign({}, shared.pool, { nc_floor_window: 15000 });
  const after = T._nc();

  check("4a: lowering the floor is reflected on the next _nc() call",
    after.floor === 15000 && before.floor === 50000);
  check("4b: lowering the floor moves institutions OFF the floor",
    Object.keys(after.floored).length < Object.keys(before.floored).length);
}

finish();
