// tests/cpl_funding_nc_lane.test.js
//
// THE NONCREDIT CARVE-OUT LANE IS RETIRED (Sam adopted the one-pool model,
// 2026-08-31 — R3 no carve-out card, R4–R5 no NC dials, R8 no parity card).
//
// This file used to guard the SECOND SOLVE: ncModel() splitting a $1.8M
// carve-out across its own roster under its own floor/cap/threshold dials.
// One pool ended that mechanism: noncredit FTES now size the ONE combined
// award, and an institution's noncredit money is the FTES-share DECOMPOSITION
// of that award (instSplit → laneShareOf), restricted to the noncredit
// measures. The successor coverage of the adopted model is
// tests/cpl_funding_one_pool.test.js; the retirement pattern here is
// tests/cpl_funding_rural.test.js.
//
// What SURVIVES from the old lane — because Sam's earning rulings survived the
// pool merge — is re-aimed below at _ncPrios / _ncAward / the NC award cell:
//
//   ⚠️ 1. THE PROSE TRAP. measurability() resolves a priority to a data key by
//   reading its WORDING, and the NC priorities inherit credit's wording. An
//   unpinned NC priority would resolve to a CREDIT source and score noncredit
//   money on credit performance — every figure non-zero, in range, and wrong.
//   ncPriorities() therefore ALWAYS pins a metric_src (A1–A3).
//
//   ⚠️ 2. THE ADVANCE. An unmeasurable credit metric pays the FULL CAP as an
//   advance. Sam ruled the opposite for noncredit (F1 / N2 b): targets and
//   potential shown, earnings $0, explicitly NOT an advance. A regression here
//   does not show a wrong number — it disburses the noncredit shares.
//
//   ⚠️ 3. THE POT. `share` splits the MONEY, never the FTES ("route, don't
//   split"). An NC priority is measured against the award's NONCREDIT SLICE —
//   under one pool that is laneShareOf(c).nc of the entitlement, never the
//   credit slice and never a second pool.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_nc_lane.test.js`).
const { check, freshDom, boot, D, consumerSrc, finish } = require("./lib/cpl_funding_harness.js");

// ── A. the wiring, read out of the source ────────────────────────────────────
check("A1: ncPriorities() ALWAYS emits a metric_src — there is no unpinned NC path",
  /function ncPriorities\(slot\)[\s\S]*?metric_src: src,/.test(consumerSrc));
check("A2: an unmappable milestone resolves to a deliberately-unknown key, so it lands in the loud bad_src branch rather than falling through to the prose",
  /var src = \(ms && byMs\[ms\]\) \|\| "nc_unmapped";/.test(consumerSrc) &&
  !/^\s{4}nc_unmapped:/m.test(consumerSrc));
check("A3: the NC source map is DERIVED from METRIC_SOURCES by milestone, not written down a second time",
  /function ncSourceByMilestone\(\)[\s\S]{0,400}r\.lane === "nc"[\s\S]{0,120}out\[r\.milestone\] = k/.test(consumerSrc));
// A4 re-aimed (one-pool form): the routing is no longer to a second pool's
// entitlement — a priority is measured against ITS LANE'S SLICE of the one
// award's entitlement, by the institution's own FTES split.
check("A4: prioEntitlement() routes each lane onto its OWN slice of the one entitlement (laneShareOf), never the other lane's money",
  /function prioEntitlement\(c, p\)[\s\S]{0,1200}laneFrac = \(p && p\.lane === "nc"\) \? laneShareOf\(c\)\.nc : laneShareOf\(c\)\.cr;/.test(consumerSrc));
check("A5: the not-yet-loaded-artifact branch does NOT advance the NC lane",
  /if \(meas\.lane === "nc"\) return \{ f: 0, status: "undelivered"/.test(consumerSrc));
check("A6: the NC lane normalizes by its OWN share sum, never the credit one",
  /function ncPrioCap\(W, slot, p\) \{\s*\n\s*var ss = ncShareSum\(slot\);/.test(consumerSrc));

// ── A'. the RETIRED second solve is gone from the source, not merely unused ──
// (R3–R5, 2026-08-31.) Comment lines are stripped first — the retirement is
// deliberately RECORDED in comments (ncModel's epitaph, the R-item notes), and
// a bare grep would match the explanation of why the mechanism went.
{
  const code = consumerSrc.split("\n")
    .filter(function (l) { return !/^\s*(\/\/|\*|\/\*)/.test(l); }).join("\n");
  ["ncModel", "ncInstitutions", "ncPrioEntitlement", "ncSizePct", "ncCapScale",
   "feederCarveout", "ncThresholdFtes", "ncFloorWindow", "ncCapWindow",
   "ncParity", "allNoncreditFtes"
  ].forEach(function (fn) {
    check("A7: " + fn + "() is gone from live code", code.indexOf("function " + fn) === -1);
  });
  check("A7b: nothing calls ncModel() any more — the decomposition is instSplit, not a second solve",
    !/ncModel\s*\(/.test(code));
  check("A7c: no net_before_feeder survives — nothing is netted down for a carve-out",
    !/net_before_feeder/.test(code));
}

// ── B. the earning rule on today's feed (the surviving semantics) ────────────
(function () {
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;

  // The retired API surface (R3–R5): no second model to ask.
  check("B0: _nc() and _ncModel() are gone from the module API",
    typeof T._nc === "undefined" && typeof T._ncModel === "undefined");
  check("B0b: _effective() carries no `.nc` block and no net_before_feeder — one pool, one report",
    !("nc" in T._effective()) && !("net_before_feeder" in T._effective().pool));
  // The NC dials cannot be rendered (R4–R5): no editable box addresses them.
  ["feeder_carveout", "nc_floor_window", "nc_cap_window", "nc_threshold_ftes"].forEach(function (f) {
    check("B0c: no editable dial for the retired `" + f + "` field renders",
      !doc.querySelector('[data-field="' + f + '"]'));
  });
  // …and the stored config fields are INERT: nothing reads them, so setting
  // them moves not a single award. This is the "cannot come back through the
  // config" guard — the carve-out's own version of the rural retirement's
  // pool-arithmetic pin.
  (function () {
    const w0 = T._model().W;
    T._setScenario({ pool: { feeder_carveout: 1800000, nc_threshold_ftes: 500,
                             nc_floor_window: 50000, nc_cap_window: 100000 } });
    const w1 = T._model().W;
    const moved = Object.keys(w0).filter(function (k) { return Math.abs(w0[k] - w1[k]) > 0.01; });
    check("B0d: the retired carve-out/threshold/NC-window dials move NO award — the fields are read by nothing",
      Object.keys(w0).length === 118 && moved.length === 0);
    T._setScenario({});
  })();

  // The lane's earning rule, on a college that runs a real noncredit program.
  const ps = T._ncPrios("Mt San Antonio", "1");
  check("B1: every NC priority is pinned to a noncredit-lane source",
    ps.length === 3 && ps.every(function (p) { return /^nc_/.test(p.metric_src) && p.metric_src !== "nc_unmapped"; }));
  check("B2: every NC priority reports lane 'nc' and is scored in FTES",
    ps.every(function (p) { return p.lane === "nc" && p.unit === "FTES"; }));
  check("B3: TODAY every NC priority is 'undelivered' — the feed carries no nc_* key",
    ps.every(function (p) { return p.status === "undelivered"; }));
  check("B4: and therefore earns exactly $0 — NOT the full-cap advance an unmeasurable credit metric gets (F1)",
    ps.every(function (p) { return p.earned === 0; }));
  check("B5: but the TARGET and the CAP still stand (Sam: targets and potential shown)",
    ps.every(function (p) { return p.target > 0 && p.cap > 0; }));

  // `share` splits the MONEY: the three caps summed across every year slot are
  // the award's whole NONCREDIT SHARE — instSplit(c).nc, the same figure
  // _ncAward returns — no more and no less. Under the old lane this summed to
  // ncModel's W; the invariant survived the pool merge with a new right-hand
  // side.
  const slots = ["1", "2"];
  const capAll = slots.reduce(function (s, sl) {
    return s + (T._ncPrios("Mt San Antonio", sl) || []).reduce(function (t, p) { return t + p.cap; }, 0);
  }, 0);
  check("B6: the three shares split the award's noncredit slice exactly — share splits the MONEY, not the FTES",
    Math.abs(capAll - T._ncAward("Mt San Antonio")) < 0.01);

  // The BASE is deliberately one-way (the base raises funding, not the bar —
  // targets ride the PRE-BOUNDS entitlement). It must stay one-way for the
  // noncredit slice too: a brought-up-to-base institution's NC target per
  // noncredit FTES has to match an unbounded one's, or the base would be
  // charging for itself.
  const withNc = D.colleges.filter(function (c) { return (c.noncredit_ftes || 0) > 0; });
  const floored = withNc.find(function (c) { var a = T._alloc(c.college); return a.floored && !a.capped; });
  const plain = withNc.find(function (c) { var a = T._alloc(c.college); return !a.floored && !a.capped; });
  const rate = function (c) { return T._ncPrios(c.college, "1")[0].target / c.noncredit_ftes; };
  check("B7: the base raises an institution's noncredit MONEY and never its TARGET (equal target per NC FTES, floored vs not)",
    !!floored && !!plain && Math.abs(rate(floored) / rate(plain) - 1) < 1e-6);
  check("B8: so a brought-up-to-base institution earns its noncredit share at a better rate than an unbounded one",
    !!floored && !!plain &&
    (function () {
      const fp = T._ncPrios(floored.college, "1"), pp = T._ncPrios(plain.college, "1");
      return (fp[0].cap / fp[0].target) > (pp[0].cap / pp[0].target);
    })());

  // Sam, 2026-08-27: NC inherits credit's shares (the ncPriorities override
  // layer survives one pool as the divergence seam — see block E).
  const cs = T._prios("Mt San Antonio", "1");
  check("B9: NC shares default to credit's (Sam's ruling), matched by priority IDENTITY not position",
    ps.every(function (p) { const c = cs.find(function (x) { return x.src === p.src; }); return c && c.share === p.share; }));
  check("B10: an NC priority key can never be read off a credit row — the keys are namespaced",
    ps.every(function (p) { return /^nc_/.test(p.key); }) && cs.every(function (p) { return !/^nc_/.test(p.key); }));
  check("B11: the NC target is the noncredit slice's own, never a copy of the credit target",
    ps.every(function (p) { const c = cs.find(function (x) { return x.src === p.src; }); return c && Math.abs(c.target - p.target) > 1; }));

  // The noncredit-only trio: their WHOLE award is the nc slice, held by
  // origination (N2 b — no advances). This is where the old standalone-feeder
  // rows went: ordinary roster rows whose credit slice is zero.
  const noce = T._alloc("NOCE");
  check("B12: a noncredit-only institution's whole award IS its noncredit share, and it earns $0 today (N2 b)",
    !!noce && noce.cr_award === 0 && Math.abs(noce.nc_award - noce.total) < 0.5 &&
    Math.abs(T._ncAward("NOCE") - noce.total) < 0.5 && noce.earned_total === 0);
  // A college with no noncredit program: nothing to restrict, nothing to earn.
  check("B13: a no-noncredit college's NC priorities cap at $0 and its award has no NC share (Taft)",
    T._ncAward("Taft") === 0 &&
    (T._ncPrios("Taft", "1") || []).every(function (p) { return p.cap === 0; }));

  // ── the NC award CELL (the rendered face of F1 / N2 b) ────────────────────
  // One row per institution (R6): the second .cf-award cell is the noncredit
  // share. Its sub-line is the earning rule in words — the honest "$0 until
  // feeds report" for a college share, "awaits origination" for the trio, and
  // "none on record" for the checkable-claim zero. A $0 that read as "posted
  // nothing" would be the same misstatement the old paired-row suite guarded.
  function ncCell(id) {
    const r = doc.querySelector('tr[data-id="c:' + id + '"]');
    return r ? r.querySelectorAll("td.cf-award")[1] : null;
  }
  check("B14: a college's NC award cell reads its share with '$0 until feeds report' — listed, not advanced",
    (function () { const c = ncCell("Mt San Antonio"); return !!c && /\$0 until feeds report/.test(c.textContent) && /\$57,551|\$115,102/.test(c.textContent); })());
  check("B15: a trio row's NC award cell reads 'awaits origination' (N2 b), never an earned or advanced figure",
    (function () { const c = ncCell("NOCE"); return !!c && /awaits origination/.test(c.textContent); })());
  check("B16: a no-noncredit college's cell is the checkable claim — '$0 · none on record', inviting the correction",
    (function () { const c = ncCell("Taft"); return !!c && /none on record/.test(c.textContent); })());
  check("B17: no paired NC row and no NC SYSTEM row survives (R6) — the share lives ON the one row",
    !doc.querySelector("tr.cplfund-ncrow") && !doc.querySelector("tr.cplfund-ncsysrow"));
})();

// ── C. the trap: a rich CREDIT feed must not leak into the NC lane ───────────
(function () {
  const { window } = freshDom();
  // Every credit measure present and healthy; no nc_* key at all. This is the
  // live shape, and it is exactly the state in which a prose-resolved NC
  // priority would score credit performance and look completely normal.
  window.CPL_FUNDING_PERF = {
    as_of: "2026-08-27", suppress_below: 5,
    statewide: { pe: 900, pa: 800, p2: 700, p3: 600, pp: 25, pe_u: 90000, pa_u: 80000, p3_u: 70000, pp_u: 25, ppa: 108, ppa_u: 661.5 },
    colleges: { "Mt San Antonio": { pe: 900, pa: 800, p2: 700, p3: 600, pe_u: 9000, pa_u: 8000, p3_u: 7000, pp_u: 25, ppa_u: 661.5 } }
  };
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const ps = T._ncPrios("Mt San Antonio", "1");
  check("C1: with a full CREDIT feed and no nc_* key, the NC share still earns $0 — it did not silently score credit performance",
    ps.every(function (p) { return p.status === "undelivered" && p.earned === 0; }));
  const a = T._alloc("Mt San Antonio");
  check("C2: and the credit slice of the same award IS earning, so C1 is not just an empty artifact",
    (T._prios("Mt San Antonio", "1") || []).length === 3 && a.earned_total > 0 && (a.earned_nc || 0) === 0);
})();

// ── C'. and the cutover is zero-change: deliver the keys, earning starts ─────
(function () {
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = {
    as_of: "2026-08-27", suppress_below: 5,
    statewide: { pe_u: 90000, pa_u: 80000, p3_u: 70000, nc_pe_u: 500, nc_pa_u: 400, nc_pt_u: 300 },
    colleges: { "Mt San Antonio": { pe_u: 9000, pa_u: 8000, p3_u: 7000, nc_pe_u: 60, nc_pa_u: 45, nc_pt_u: 30 } }
  };
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const ps = T._ncPrios("Mt San Antonio", "1");
  check("C3: the day MAP delivers the nc_* keys the noncredit share starts earning with NO code change",
    ps.some(function (p) { return p.status === "earned" && p.earned > 0; }) &&
    (T._alloc("Mt San Antonio").earned_nc || 0) > 0);
  check("C4: and an institution with no nc_* value of its own reads 'none' ($0 posted), never an advance",
    (T._ncPrios("Canyons", "1") || []).every(function (p) { return p.status === "none" && p.earned === 0; }));
})();

// ── E. divergence: NC shares are a dial of their own ─────────────────────────
// The ncPriorities override layer SURVIVED the pool merge (it is the noncredit
// shares' earning arithmetic, not the retired second solve), so its divergence
// semantics still need pinning.
(function () {
  const { window } = freshDom();
  // Give the NC lane its own share on ONE priority. If ncPrioCap normalized by
  // the CREDIT share sum, the three caps would no longer land on the invariant.
  window.localStorage.setItem("cpl_funding_whatif_v3", JSON.stringify({
    "cpl-implementation::Scenario 1": { ncPriorities: { "1": { "0": { share: 0.6 } } } }
  }));
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const key = (D.colleges.find(function (c) {
    const a = T._alloc(c.college);
    return (c.noncredit_ftes || 0) > 0 && !a.floored && !a.capped;
  }) || {}).college;
  const ps = T._ncPrios(key, "1");
  const cs = T._prios(key, "1");
  check("E1: an NC share override actually moves the NC share",
    ps.find(function (p) { return p.src === 0; }).share === 0.6);
  check("E2: and does NOT move the credit share — the lanes are separate dials",
    cs.find(function (p) { return p.src === 0; }).share !== 0.6);
  const capAll = ["1", "2"].reduce(function (s, sl) {
    return s + (T._ncPrios(key, sl) || []).reduce(function (t, p) { return t + p.cap; }, 0);
  }, 0);
  // ⚠️ MEASURED, not assumed. A share set is a MULTIPLIER on the pot in this
  // model, not a normalizer: the credit lane's own slotEntitlement() is
  // `W × shareSum ÷ nYears`, so shares summing past 1 place MORE than the pot.
  // The NC arithmetic must behave IDENTICALLY (Sam ruled parity), so the
  // invariant is not "the caps sum to the nc share" — it is "the caps sum to
  // the nc share scaled by this lane's OWN per-slot share sums". Wiring
  // ncPrioCap to the credit shareSum (the bug this guards) yields an ncSS²/crSS
  // scaling instead — a plausible figure no total on the page contradicts.
  // ⚠️ Per SLOT — the override lands on year 1 only when years are not
  // mirrored, so the two slots can hold DIFFERENT share sums; both are read
  // from the model rather than assumed.
  const ssOf = function (sl) { return (T._ncPrios(key, sl) || []).reduce(function (t, p) { return t + p.share; }, 0); };
  const ncW = T._ncAward(key);
  const expected = ["1", "2"].reduce(function (s, sl) { return s + ncW * ssOf(sl) / 2; }, 0);
  const crSS = function (sl) { return (T._prios(key, sl) || []).reduce(function (t, p) { return t + p.share; }, 0); };
  const wrong = ["1", "2"].reduce(function (s, sl) { return s + ncW * ssOf(sl) / 2 * ssOf(sl) / crSS(sl); }, 0);
  check("E3: with the shares diverged the NC caps scale on the NC lane's OWN share sum, exactly as the credit lane scales on its own",
    Math.abs(capAll - expected) < 0.01);
  check("E4: and NOT on the credit share sum — the two now differ, so this discriminates",
    Math.abs(ssOf("1") - crSS("1")) > 0.01 && Math.abs(capAll - wrong) > 1);
})();

// ── F. the LIVE-SHAPED config ────────────────────────────────────────────────
// Sam, mid-build: "The config is likely old news. Check the tab for current
// numbers and metrics." The BAKED defaults every block above runs on are stale
// BY DESIGN — different shares, factor 1, mirrorYears off, and two priorities
// sharing the transcribed rung. The live model differs on all four, so a lane
// proved correct only against the bake is proved against the wrong thing.
//
// This fixture is live-SHAPED, not a copy of live: it reproduces the four
// STRUCTURAL properties (mirrorYears, front-load, a reordered priorityOrder,
// three DISTINCT milestones) without pinning a single dial Sam can move. Its
// pool block now carries only the DIALS THAT EXIST — the adopted base/cap pair
// (the retired carve-out/threshold/NC-window fields are read by nothing; block
// B pins that).
(function () {
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const prio = function (share, title, metric, factor) { return { share: share, title: title, factor: factor, metric: metric, unit: "ftes" }; };
  T._setConfig({ projects: { "cpl-implementation": { area: "cpl", label: "CPL", scenarios: { "Scenario 1": {
    pool: { admin_cost: 800000, floor_window: 150000, cap_window: 400000,
            scaling_projects_tech: 8959692 },
    years: ["2026-27", "2027-28"],
    mirrorYears: true, disbursement: "frontload", priorityOrder: [2, 0, 1],
    yearPriorities: { "1": {
      "0": prio(0.33, "Outreach", "Eligible CPL Units measured in FTES", 0.5),
      "1": prio(0.33, "Success", "Transcribed CPL Units measured in FTES", 0.5),
      // ⚠️ The pin is part of the LIVE SHAPE, not decoration. Without it this
      // metric's prose resolves to pp_u (portal-origin TRANSCRIBED) — the
      // defect #1364 fixed — and because the NC lane takes its rung from the
      // CREDIT resolution, the noncredit Access priority would inherit the
      // transcribed rung too. Dropping it here is how F2/F3 first went red.
      "2": Object.assign(prio(0.34, "Access", "Applied units measured in FTES for students originating from either CPL Portal, College CPL Landing Page, or batch upload", 0.5), { metric_src: "ppa_u" })
    } }
  } } } } });
  // Institutions whose award HAS a noncredit share under this config — the
  // college programs plus the noncredit-only trio, read from the model.
  const funded = D.colleges.filter(function (c) { return (c.noncredit_ftes || 0) > 0; })
    .map(function (c) { return c.college; })
    .concat(["NOCE", "SD Cont. Ed", "Calbright"])
    .filter(function (k) { return T._ncAward(k) > 0.5; });
  check("F1: the noncredit shares stand up under a live-shaped config (no second solve required)",
    funded.length > 30 && T._ncAward("NOCE") > 0);

  const ps = T._ncPrios(funded[0], "1");
  check("F2: three DISTINCT noncredit sources — one per milestone (the bake collapses two onto the transcribed rung; live does not)",
    new Set(ps.map(function (p) { return p.metric_src; })).size === 3 &&
    ["nc_pe_u", "nc_pa_u", "nc_pt_u"].every(function (k) { return ps.some(function (p) { return p.metric_src === k; }); }));
  check("F3: each NC priority sits on the SAME milestone as the credit priority it mirrors",
    ps.every(function (p) {
      const c = (T._prios(funded[0], "1") || []).find(function (x) { return x.src === p.src; });
      const rung = { nc_pe_u: "Eligible", nc_pa_u: "Applied", nc_pt_u: "Transcribed" }[p.metric_src];
      return c && new RegExp(rung, "i").test(c.metric);
    }));
  check("F4: NC inherits the live factor and shares from credit, priority by IDENTITY",
    ps.every(function (p) {
      const c = (T._prios(funded[0], "1") || []).find(function (x) { return x.src === p.src; });
      return c && c.share === p.share && p.factor === 0.5;
    }));
  // Front-load: the whole window is on the table in year 1, later years carry
  // nothing. The noncredit slice has to agree with the credit slice about this
  // or one award's two shares would describe different disbursement schedules.
  const sum = function (sl) { return (T._ncPrios(funded[0], sl) || []).reduce(function (t, p) { return t + p.cap; }, 0); };
  check("F5: front-loaded — the whole noncredit share is on the table in Year 1",
    Math.abs(sum("1") - T._ncAward(funded[0])) < 0.01);
  check("F6: and Year 2 carries no new noncredit funding",
    Math.abs(sum("2")) < 0.01);
  check("F7: EVERY institution with a noncredit share earns exactly $0 today — across the whole roster, not just the sampled one",
    funded.every(function (k) { return (T._ncPrios(k, "1") || []).every(function (p) { return p.status === "undelivered" && p.earned === 0; }); }));
  check("F8: while every one of them carries a real target and a real cap",
    funded.every(function (k) { return (T._ncPrios(k, "1") || []).every(function (p) { return p.target > 0 && p.cap > 0; }); }));

  // ⭐ THE COUPLING, stated so it is a decision rather than an accident. An NC
  // priority takes its RUNG from how the CREDIT priority resolved, so the two
  // lanes can never disagree about which milestone a priority is on — which is
  // what you want, and which also means a mis-resolved credit metric hands its
  // error straight to the noncredit share. Un-pin the credit Access metric and
  // the noncredit one follows it onto the transcribed rung.
  T._setScenario({ yearPriorities: { "1": { "2": { metric_src: "" } } } });
  const unpinned = T._ncPrios(funded[0], "1");
  check("F9: un-pinning the CREDIT metric moves its NONCREDIT counterpart too — the lanes share one milestone by design",
    unpinned.find(function (p) { return p.src === 2; }).metric_src === "nc_pt_u");
  check("F10: and that collapses two NC priorities onto one source, which is why the credit pin is load-bearing for BOTH lanes",
    new Set(unpinned.map(function (p) { return p.metric_src; })).size === 2);
})();

finish();
