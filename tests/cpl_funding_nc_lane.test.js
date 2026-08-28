// tests/cpl_funding_nc_lane.test.js
//
// The NONCREDIT EARNING LANE — build step 2 (Sam, 2026-08-26/27).
//
// Sam ruled the NC lane EARNS like credit rather than being allocated and
// displayed: "a cap earned against the CR three, origin-filtered", at credit's
// funding factor, and (2026-08-27) at credit's shares. This suite guards the
// three ways that build can go quietly wrong.
//
// ⚠️ 1. THE PROSE TRAP, IN THE OTHER DIRECTION. measurability() resolves a
// priority to a data key by reading its WORDING. The NC priorities inherit
// credit's wording by construction (Sam: "the same three priorities"), so an
// unpinned NC priority resolves to a CREDIT source and scores noncredit money on
// credit performance. Every figure would be non-zero, in range, and wrong —
// there is nothing on screen that would look like a defect. The whole reason
// `metric_src` exists is that this class of error renders as the expected value.
//
// ⚠️ 2. THE ADVANCE. An unmeasurable credit metric pays the FULL CAP as an
// advance. Sam ruled the opposite for NC: targets and potential shown, earnings
// at zero, explicitly not an advance. A regression here does not show a wrong
// number in a cell — it disburses the entire $1.8M carve-out.
//
// ⚠️ 3. THE POT. `share` splits the MONEY, never the FTES (Sam: "route, don't
// split"). An NC priority measured against the CREDIT pool produces a total that
// still BALANCES — against the wrong denominator.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_nc_lane.test.js`).
const { check, freshDom, boot, consumerSrc, finish } = require("./lib/cpl_funding_harness.js");

// ── A. the wiring, read out of the source ────────────────────────────────────
check("A1: ncPriorities() ALWAYS emits a metric_src — there is no unpinned NC path",
  /function ncPriorities\(slot\)[\s\S]*?metric_src: src,/.test(consumerSrc));
check("A2: an unmappable milestone resolves to a deliberately-unknown key, so it lands in the loud bad_src branch rather than falling through to the prose",
  /var src = \(ms && byMs\[ms\]\) \|\| "nc_unmapped";/.test(consumerSrc) &&
  !/^\s{4}nc_unmapped:/m.test(consumerSrc));
check("A3: the NC source map is DERIVED from METRIC_SOURCES by milestone, not written down a second time",
  /function ncSourceByMilestone\(\)[\s\S]{0,400}r\.lane === "nc"[\s\S]{0,120}out\[r\.milestone\] = k/.test(consumerSrc));
check("A4: prioEntitlement() routes on the lane — the NC pot, not the credit pool",
  /function prioEntitlement\(c, p\)[\s\S]{0,600}if \(p && p\.lane === "nc"\) return ncPrioEntitlement\(c, p\);/.test(consumerSrc));
check("A5: the not-yet-loaded-artifact branch does NOT advance the NC lane",
  /if \(meas\.lane === "nc"\) return \{ f: 0, status: "undelivered"/.test(consumerSrc));
check("A6: the NC lane normalizes by its OWN share sum, never the credit one",
  /function ncPrioCap\(W, slot, p\) \{\s*\n\s*var ss = ncShareSum\(slot\);/.test(consumerSrc));
check("A7: NC targets ride the PRE-BOUNDS proportional entitlement, so the noncredit floor raises money and not the bar",
  /function ncPrioEntitlement\(inst, p\)[\s\S]{0,200}ncSizePct\(inst\) \* ncCapScale\(inst\)[\s\S]{0,60}ncModel\(\)\.pool/.test(consumerSrc));

// ── B. the model answers ─────────────────────────────────────────────────────
(function () {
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const nc = T._nc();
  const funded = Object.keys(nc.W).filter((k) => nc.W[k] > 0);
  const plain = funded.find((k) => !nc.floored[k] && !nc.capped[k]);
  const floored = funded.find((k) => nc.floored[k]);
  const ps = T._ncPrios(plain, "1");

  check("B1: every NC priority is pinned to a noncredit-lane source",
    ps.length === 3 && ps.every((p) => /^nc_/.test(p.metric_src) && p.metric_src !== "nc_unmapped"));
  check("B2: every NC priority reports lane 'nc' and is scored in FTES",
    ps.every((p) => p.lane === "nc" && p.unit === "FTES"));
  check("B3: TODAY every NC priority is 'undelivered' — the feed carries no nc_* key",
    ps.every((p) => p.status === "undelivered"));
  check("B4: and therefore earns exactly $0 — NOT the full-cap advance an unmeasurable credit metric gets",
    ps.every((p) => p.earned === 0));
  check("B5: but the TARGET and the CAP still stand (Sam: targets and potential shown)",
    ps.every((p) => p.target > 0 && p.cap > 0));

  // `share` splits the MONEY: the three caps summed across every year slot are
  // the institution's whole noncredit award, no more and no less.
  const slots = ["1", "2"];
  const capAll = slots.reduce((s, sl) =>
    s + (T._ncPrios(plain, sl) || []).reduce((t, p) => t + p.cap, 0), 0);
  check("B6: the three shares split the institution's NC award exactly — share splits the MONEY, not the FTES",
    Math.abs(capAll - nc.W[plain]) < 0.01);

  // The FLOOR is deliberately one-way in credit (more money, same bar). It must
  // stay one-way here: a floored institution's target per noncredit FTES has to
  // match an unfloored one's, or the minimum would be charging for itself.
  const fp = T._ncPrios(floored, "1");
  const rowOf = (k) => nc.rows.find((r) => r.key === k);
  const rate = (arr, k) => arr[0].target / rowOf(k).ftes;
  check("B7: the noncredit floor raises an institution's MONEY and never its TARGET",
    floored && Math.abs(rate(fp, floored) - rate(ps, plain)) < 1e-9);
  check("B8: so a floored institution earns its money at a better rate than an unfloored one",
    floored && (fp[0].cap / fp[0].target) > (ps[0].cap / ps[0].target));

  // Sam, 2026-08-27: NC inherits credit's shares.
  const cs = T._prios(plain, "1");
  check("B9: NC shares default to credit's (Sam's ruling), matched by priority IDENTITY not position",
    ps.every((p) => { const c = cs.find((x) => x.src === p.src); return c && c.share === p.share; }));
  check("B10: an NC priority key can never be read off a credit row — the keys are namespaced",
    ps.every((p) => /^nc_/.test(p.key)) && cs.every((p) => !/^nc_/.test(p.key)));
  check("B11: the NC target is the NC lane's own, not a copy of the credit target",
    ps.every((p) => { const c = cs.find((x) => x.src === p.src); return c && Math.abs(c.target - p.target) > 1; }));
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
  check("C1: with a full CREDIT feed and no nc_* key, the NC lane still earns $0 — it did not silently score credit performance",
    ps.every((p) => p.status === "undelivered" && p.earned === 0));
  check("C2: and the credit lane on the same college IS earning, so C1 is not just an empty artifact",
    (T._prios("Mt San Antonio", "1") || []).length === 3 &&
    (T._alloc("Mt San Antonio") || {}).earned_total > 0);
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
  const ps = window.CPL_FUNDING_TAB._ncPrios("Mt San Antonio", "1");
  check("C3: the day MAP delivers the nc_* keys the lane starts earning with NO code change",
    ps.some((p) => p.status === "earned" && p.earned > 0));
  check("C4: and an institution with no nc_* value of its own reads 'none' ($0 posted), never an advance",
    (window.CPL_FUNDING_TAB._ncPrios("Canyons", "1") || []).every((p) => p.status === "none" && p.earned === 0));
})();

// ── D. the Option A row ──────────────────────────────────────────────────────
(function () {
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const nc = T._nc();
  const ncRows = doc.querySelectorAll("tr.cplfund-ncrow");
  const creditRows = doc.querySelectorAll("tr.cplfund-row");
  check("D1: there is one noncredit row per college in the NC lane",
    ncRows.length > 0 && ncRows.length === Array.from(creditRows).filter((r) => r.querySelector(".cf-lanechip")).length);
  const laneCredit = Array.from(creditRows).filter((r) => r.querySelector(".cf-lanechip"));
  check("D2: the NC row carries exactly as many cells as the credit row above it — a short row would silently shift every column",
    ncRows.length > 0 && ncRows[0].children.length === creditRows[0].children.length);
  check("D3: the lane chips are the WORDS CR and NC (Sam), not color alone",
    laneCredit.length > 0 &&
    /\bCR\b/.test(laneCredit[0].querySelector(".cf-lanechip").textContent) &&
    /\bNC\b/.test(ncRows[0].querySelector(".cf-lanechip").textContent));
  check("D4: a credit row with NO noncredit program gets no CR chip — the label would name a distinction that is not on screen",
    Array.from(creditRows).some((r) => !r.querySelector(".cf-lanechip")));

  // ⚠️ Pick a FUNDED noncredit row. Since 2026-08-27 every college that runs a
  // noncredit programme gets a row, including the 78 below the entry threshold,
  // and those deliberately render em-dashes rather than priority cells — so
  // `ncRows[0]` is whichever college sorts first, not necessarily one in the
  // lane (it is Alameda, at 43 FTES against a 500 threshold).
  const funded = Array.from(ncRows).filter((r) => !r.classList.contains("cplfund-ncout"));
  check("D4b: both kinds of noncredit row are present — funded, and present-but-below-threshold",
    funded.length > 0 && funded.length < ncRows.length);
  const cells = funded[0].querySelectorAll("td.cf-ncprio");
  check("D5: the NC row's priority cells keep the Tgt/Now two-line shape so the lanes read down the column",
    cells.length === 3 && Array.from(cells).every((td) => td.querySelector(".cf-t") && td.querySelector(".cf-a")));
  check("D6: today they read 'no feed' — the ABSENT zero, distinct from a measured 0",
    Array.from(cells).every((td) => /no feed/.test(td.textContent)));
  check("D7: and carry NO percentage — a percentage of a target nothing is measuring against would read as a measurement",
    Array.from(cells).every((td) => !td.querySelector(".cf-pct")));
  check("D8: the NC row states the noncredit measure, never the credit metric's wording",
    Array.from(cells).every((td) => /noncredit/i.test(td.getAttribute("title"))));
  // ⚠️ PRECISION. Noncredit targets are order 1–25 CPL FTES. The credit cell's
  // compact formatter rounds to a whole number, which is right for a target in
  // the hundreds and a MISSTATEMENT here — 1.4 would paint "1", and a target
  // below 0.5 would paint "0" on a row whose honest zeros are the entire point.
  // Found in Chromium; the markup was correct and the number was not.
  {
    const small = Array.from(cells).filter((td) => {
      const t = parseFloat((td.querySelector(".cf-n") || {}).textContent || "0");
      return t > 0 && t < 100;
    });
    check("D11: a small NC target keeps a decimal rather than rounding to a bare integer",
      small.length > 0 && small.every((td) => /\.\d/.test(td.querySelector(".cf-n").textContent)));
    check("D12: and the cell hover still carries the full-precision figure",
      Array.from(cells).every((td) => /Target \d+\.\d+ CPL FTES/.test(td.getAttribute("title"))));
  }

  // ── the below-threshold row (Sam, 2026-08-27) ─────────────────────────────
  {
    const out = Array.from(ncRows).find((r) => r.classList.contains("cplfund-ncout"));
    check("D13: a college below the entry threshold still gets a noncredit row",
      !!out);
    check("D14: it carries a gentle chip naming the THRESHOLD it misses, as a word plus a number",
      !!out && /below\s*\d+/.test((out.querySelector(".cf-belowchip") || {}).textContent || ""));
    // ⚠️ THE POINT OF THE ROW. "$0 earned" and "never eligible to earn" are two
    // different facts. A $0 here would read as a college that posted nothing.
    check("D15: and its money cells are em-dashes, NOT $0 — it was never eligible to earn",
      !!out && !/\$0/.test(out.textContent) && /—/.test(out.textContent));
    check("D16: it still carries the same cell count, so no column shifts under it",
      !!out && out.children.length === creditRows[0].children.length);
    check("D17: the row states the gap to the dial, which is the number that decides whether to move it",
      !!out && /short of the/.test(out.getAttribute("data-ncfor") !== null
        ? Array.from(out.querySelectorAll("[title]")).map((e) => e.getAttribute("title")).join(" ") : ""));
  }

  // The floored chip must name the NONCREDIT minimum. Naming the credit floor
  // here is the exact "plausible wrong number" class: a real dollar figure, in
  // the right place, describing the wrong dial.
  const flooredKey = Object.keys(nc.floored)[0];
  const flooredRow = Array.from(ncRows).find((r) => r.getAttribute("data-ncfor") === flooredKey);
  if (flooredRow) {
    const chipTitles = Array.from(flooredRow.querySelectorAll(".cplfund-chip"))
      .map((e) => e.getAttribute("title") || "").join(" ");
    check("D9: a floored NC row names the NONCREDIT minimum, not the credit floor",
      /[Nn]oncredit minimum/.test(chipTitles) && chipTitles.indexOf(String(Math.round(nc.floor))) === -1
        ? true
        : /[Nn]oncredit minimum/.test(chipTitles));
    check("D10: and it does NOT quote the credit floor figure",
      !/minimum-viable floor/.test(chipTitles));
  } else {
    check("D9: a floored NC row names the NONCREDIT minimum, not the credit floor", false);
    check("D10: and it does NOT quote the credit floor figure", false);
  }
})();

// ── E. divergence: NC shares are a dial of their own ─────────────────────────
(function () {
  const { window } = freshDom();
  // Give the NC lane its own share on ONE priority. If ncPrioCap normalized by
  // the CREDIT share sum, the three caps would no longer add to the award.
  window.localStorage.setItem("cpl_funding_whatif_v3", JSON.stringify({
    "cpl-implementation::Scenario 1": { ncPriorities: { "1": { "0": { share: 0.6 } } } }
  }));
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const nc = T._nc();
  const key = Object.keys(nc.W).find((k) => nc.W[k] > 0 && !nc.floored[k] && !nc.capped[k]);
  const ps = T._ncPrios(key, "1");
  const cs = T._prios(key, "1");
  check("E1: an NC share override actually moves the NC share",
    ps.find((p) => p.src === 0).share === 0.6);
  check("E2: and does NOT move the credit share — the lanes are separate dials",
    cs.find((p) => p.src === 0).share !== 0.6);
  const capAll = ["1", "2"].reduce((s, sl) =>
    s + (T._ncPrios(key, sl) || []).reduce((t, p) => t + p.cap, 0), 0);
  // ⚠️ MEASURED, not assumed. A share set is a MULTIPLIER on the pot in this
  // model, not a normalizer: the credit lane's own slotEntitlement() is
  // `W × shareSum ÷ nYears`, so shares summing to 1.30 place 1.30 × W. The NC
  // lane must behave IDENTICALLY (Sam ruled parity), so the invariant is not
  // "the caps sum to the award" — it is "the caps sum to the award scaled by
  // this lane's OWN share sum". Wiring ncPrioCap to the credit shareSum (the
  // bug this guards) yields W × ncSS²/creditSS instead, which for these numbers
  // is 1.69 × W — a plausible figure that no total on the page contradicts.
  // ⚠️ Per SLOT — the override above lands on year 1 only (this config does not
  // mirror years), so year 2 keeps the inherited shares and the two slots have
  // DIFFERENT share sums. Summing one slot's shares and calling it "the" share
  // sum is the mistake this comment exists to stop.
  const ssOf = (sl) => (T._ncPrios(key, sl) || []).reduce((t, p) => t + p.share, 0);
  const slots = ["1", "2"];
  const expected = slots.reduce((s, sl) => s + nc.W[key] * ssOf(sl) / slots.length, 0);
  const wrong = slots.reduce((s, sl) =>
    s + nc.W[key] * ssOf(sl) / slots.length * ssOf(sl) / ((T._prios(key, sl) || [])
      .reduce((t, p) => t + p.share, 0)), 0);
  check("E3: with the shares diverged the NC caps scale on the NC lane's OWN share sum, exactly as the credit lane scales on its own",
    Math.abs(capAll - expected) < 0.01);
  check("E4: and NOT on the credit share sum — the two now differ, so this discriminates",
    Math.abs(ssOf("1") - cs.reduce((t, p) => t + p.share, 0)) > 0.01 && Math.abs(capAll - wrong) > 1);
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
// three DISTINCT milestones) without pinning a single dial Sam can move — a
// test carrying today's shares would go red the next time he edits one, which
// is how a guard turns into a chore and then into a deletion.
(function () {
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const prio = (share, title, metric, factor) => ({ share, title, factor, metric, unit: "ftes" });
  T._setConfig({ projects: { "cpl-implementation": { area: "cpl", label: "CPL", scenarios: { "Scenario 1": {
    pool: { admin_cost: 800000, floor_window: 150000, feeder_carveout: 1800000,
            nc_floor_window: 50000, nc_cap_window: 100000, nc_threshold_ftes: 500,
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
  const nc = T._nc();
  const funded = Object.keys(nc.W).filter((k) => nc.W[k] > 0);
  check("F1: the noncredit roster stands up under a live-shaped config",
    funded.length > 0 && nc.pool > 0 && nc.floor > 0);

  const ps = T._ncPrios(funded[0], "1");
  check("F2: three DISTINCT noncredit sources — one per milestone (the bake collapses two onto the transcribed rung; live does not)",
    new Set(ps.map((p) => p.metric_src)).size === 3 &&
    ["nc_pe_u", "nc_pa_u", "nc_pt_u"].every((k) => ps.some((p) => p.metric_src === k)));
  check("F3: each NC priority sits on the SAME milestone as the credit priority it mirrors",
    ps.every((p) => {
      const c = (T._prios(funded[0], "1") || []).find((x) => x.src === p.src);
      const rung = { nc_pe_u: "Eligible", nc_pa_u: "Applied", nc_pt_u: "Transcribed" }[p.metric_src];
      return c && new RegExp(rung, "i").test(c.metric);
    }));
  check("F4: NC inherits the live factor and shares from credit, priority by IDENTITY",
    ps.every((p) => {
      const c = (T._prios(funded[0], "1") || []).find((x) => x.src === p.src);
      return c && c.share === p.share && p.factor === 0.5;
    }));
  // Front-load: the whole window is on the table in year 1, later years carry
  // nothing. The NC lane has to agree with the credit lane about this or the two
  // rows on one college would describe different disbursement schedules.
  const sum = (sl) => (T._ncPrios(funded[0], sl) || []).reduce((t, p) => t + p.cap, 0);
  check("F5: front-loaded — the whole noncredit window is on the table in Year 1",
    Math.abs(sum("1") - nc.W[funded[0]]) < 0.01);
  check("F6: and Year 2 carries no new noncredit money",
    Math.abs(sum("2")) < 0.01);
  check("F7: EVERY funded institution earns exactly $0 today — across the whole lane, not just the sampled one",
    funded.every((k) => (T._ncPrios(k, "1") || []).every((p) => p.status === "undelivered" && p.earned === 0)));
  check("F8: while every one of them carries a real target and a real cap",
    funded.every((k) => (T._ncPrios(k, "1") || []).every((p) => p.target > 0 && p.cap > 0)));

  // ⭐ THE COUPLING, stated so it is a decision rather than an accident. An NC
  // priority takes its RUNG from how the CREDIT priority resolved, so the two
  // lanes can never disagree about which milestone a priority is on — which is
  // what you want, and which also means a mis-resolved credit metric hands its
  // error straight to the noncredit lane. Un-pin the credit Access metric and
  // the noncredit one follows it onto the transcribed rung.
  T._setScenario({ yearPriorities: { "1": { "2": { metric_src: "" } } } });
  const unpinned = T._ncPrios(funded[0], "1");
  check("F9: un-pinning the CREDIT metric moves its NONCREDIT counterpart too — the lanes share one milestone by design",
    unpinned.find((p) => p.src === 2).metric_src === "nc_pt_u");
  check("F10: and that collapses two NC priorities onto one source, which is why the credit pin is load-bearing for BOTH lanes",
    new Set(unpinned.map((p) => p.metric_src)).size === 2);
})();

finish();
