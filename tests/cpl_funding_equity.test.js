// CPL Implementation Funding tab — the 2026-07-06 equity refinements (Part D),
// ported to the ONE-POOL model (adopted 2026-08-31).
//
// Front-load · base-award floor · rural retirement · baseline eligibility.
// Data defaults first, then renderer behavior. The floor/cap now bound ONE
// combined award per institution (118 rows — the noncredit-only trio are
// ordinary rows), sized by credit + noncredit FTES; the per-year Yr1/Yr2
// columns and the standalone-noncredit table these checks used to read are
// retired (R6/R9), so the front-load and SYSTEM-row guards are re-aimed at
// the CR award / NC award pair and the drill-in.
//
// One of nine suites the 2,955-line cpl_funding.test.js was split into on
// 2026-08-20, after it stopped fitting in a 12 GB heap. Shared setup + the
// jsdom helpers live in tests/lib/cpl_funding_harness.js, which also carries the
// measurements behind the split and the per-window memory budget for anyone
// adding to these files.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_equity.test.js`).
const fs = require("fs");
const {
  check,
  freshDom,
  boot,
  click,
  commit,
  scenSlot,
  footText,
  greenSlices,
  pieSlices,
  D,
  consumerSrc,
  cpl,
  idx,
  finish,
} = require("./lib/cpl_funding_harness.js");

// The one-pool roster: 115 colleges + the noncredit-only rows (NOCE / SD
// Cont. Ed / Calbright; Mt. SAC Noncredit rides the Mt San Antonio row).
const NCO_N = D.feeders.filter(function (f) { return !f.nc_ftes_on_credit_row; }).length;
const ROSTER_N = D.colleges.length + NCO_N;
// An institution's size under one pool: credit + noncredit FTES combined.
function combinedFtes(c) { return (c.credit_ftes || 0) + (Number(c.noncredit_ftes) || 0); }

// ─────────────────────────────────────────────────────────────────────────────
// Part D — the 2026-07-06 equity refinements (front-load · floor · rural ·
// eligibility). Data defaults first, then renderer behavior.
// ─────────────────────────────────────────────────────────────────────────────

// D0 — data defaults for all four features.
check("data: disbursement defaults to even tranches", D.disbursement === "even");
check("data: base award default $150K/window on the COMBINED award (one-pool dials, 2026-08-31; " +
  "the pre-adoption floor was $175K)", D.pool.floor_window === 150000);
check("data: the cap ships beside it at $400K", D.pool.cap_window === 400000);
check("data: the rural carve-out and its label are retired",
  D.pool.rural_carveout === undefined && D.pool.rural_carveout_label === undefined &&
  D.rural_threshold === undefined);
// The FLAGS outlive the money — federal categorization is a true fact about the
// college, and the roster is one Sam's team maintains.
check("data: exactly the 13 federally-rural colleges are still rural-flagged (context only)",
  D.colleges.filter(function (c) { return c.rural; }).length === 13 &&
  ["Siskiyous", "Feather River", "Lassen", "Redwoods", "Shasta",
   "Columbia", "Cerro Coso", "Taft", "West Hills Coalinga", "Barstow",
   "Palo Verde", "Copper Mountain", "Imperial"].every(function (n) {
    return D.colleges.some(function (c) { return c.college === n && c.rural === true; });
  }));
check("data: rural roster provenance cites the federal rural categorization",
  /federally categorized as rural/.test(D.rural_source || ""));
check("data: participation deadline default Sept 1, 2026", D.participation_deadline === "2026-09-01");

// D1 — base-award floor: waterfall math (model-level, via test hooks).
// The CAP is switched OFF for this whole block. These assertions are about the
// floor in isolation — with a cap live the largest institutions TIE at it, so
// "the largest takes the max entitlement" stops being a floor property at all.
// The cap, and the two solved together, have their own suite:
// tests/cpl_funding_cap.test.js.
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setScenario({ pool: { cap_window: 0 } });
  const m = T._model();
  const net = T._netCollege();
  check("floor model: ONE pool conserved (Σ entitlements over all 118 institutions = net pool)",
    Math.abs(Object.values(m.W).reduce(function (s, w) { return s + w; }, 0) - net) < 1);
  // One floor for everyone since the carve-out was retired: no institution's
  // entitlement sits below it any more, because there is no second component to
  // make up the difference.
  check("floor model: no college's TOTAL window falls below the floor",
    D.colleges.every(function (c) { return T._alloc(c.college).total >= m.floor - 0.01; }));
  // How MANY colleges the floor catches scales inversely with the pool, so bound it
  // by the structural invariant rather than a literal that a pool change silently
  // invalidates. The invariant that CANNOT go stale is monotonicity: the floored
  // set is a contiguous bottom slice by SIZE, so no college is floored while a
  // SMALLER one is not. Size under one pool is credit + noncredit FTES COMBINED
  // (sorting by credit alone would call a noncredit-heavy college "smaller" than
  // it is and read a correct waterfall as broken).
  const bySize = D.colleges.slice().sort(function (a, b) { return combinedFtes(a) - combinedFtes(b); });
  const flooredFlags = bySize.map(function (c) { return !!m.floored[c.college]; });
  check("floor model: the floored set is a contiguous bottom slice by combined size",
    m.floorCount > 0 && m.floorCount < ROSTER_N &&
    flooredFlags.indexOf(false) !== -1 &&
    flooredFlags.slice(flooredFlags.indexOf(false)).every(function (f) { return f === false; }));
  check("floor model: a rural college is floored on the SAME floor as anyone else",
    Math.abs(m.W["Copper Mountain"] - m.floor) < 1);
  // Assert the property, not the name: the largest entitlement follows the
  // ALLOCATION BASIS, which is combined FTES under one pool.
  {
    const biggestByFtes = D.colleges.slice().sort(function (a, b) { return combinedFtes(b) - combinedFtes(a); })[0].college;
    check("floor model: the largest institution on the basis takes the max entitlement, well above the floor",
      m.W[biggestByFtes] === Math.max.apply(null, Object.values(m.W)) && m.W[biggestByFtes] > m.floor * 2);
  }
  const cm = T._alloc("Copper Mountain");
  check("a floored college's window total = exactly the floor, with no second component",
    cm.rural_w === undefined && Math.abs(cm.total - m.floor) < 1 && Math.abs(cm.main_w - m.floor) < 1);
  check("floored college is flagged for the 'at base' chip", cm.floored === true);

  // UI: floor pool card + chip + drill-in line. Chips are ghosted WORDS since
  // 2026-08-31 ("at base" / "at cap" — no ⬆/⬇ glyphs). The card note carries
  // Sam's sentence shape (2026-09-01): "supported by minimum base funding";
  // "topped up" stays banned (CCC norms doctrine).
  const doc = window.document;
  const floorCard = doc.querySelector(".cplfund-card.floor");
  check("floor pool card renders with the supported-by-minimum-base-funding count",
    floorCard && /supported by minimum base funding/.test(floorCard.textContent) &&
    !/topped up/.test(floorCard.textContent));
  check("formula explains the base award renormalization",
    /Base award:/.test(doc.querySelector(".cplfund-formula").textContent));
  const cmRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr")).find(function (tr) {
    return tr.textContent.indexOf("Copper Mountain") !== -1;
  });
  check("floored row carries the 'at base' word chip, no ⬆ glyph",
    cmRow && cmRow.textContent.indexOf("at base") !== -1 && cmRow.innerHTML.indexOf("⬆") === -1);
  // Rows key their open state by NAME now (data-id "c:<college>", 2026-08-31).
  T._state.open["c:Copper Mountain"] = true;
  T.render();
  const detail = Array.from(doc.querySelectorAll("tr.cplfund-detail")).find(function (tr) {
    return tr.textContent.indexOf("At the base:") !== -1;
  });
  check("floored drill-in explains the base top-up vs the proportional share",
    !!detail && /pure proportional share/.test(detail.textContent));
  T._state.open = {};

  // Setting the floor to 0 disables it (pure proportional, no floored rows).
  T._setScenario({ pool: { floor_window: 0, cap_window: 0 } });
  const m0 = T._model();
  check("floor 0 disables the waterfall (no floored institutions)", m0.floorCount === 0);
  // Pure proportional = combined-FTES share × net, over the WHOLE roster —
  // the trio (placeholder-aware: Calbright sizes at its 1,000-FTES stand-in)
  // are in the denominator.
  const totalBasis = D.colleges.reduce(function (s, c) { return s + combinedFtes(c); }, 0) +
    D.feeders.filter(function (f) { return !f.nc_ftes_on_credit_row; })
      .reduce(function (s, f) {
        const ph = Number(f.noncredit_ftes_placeholder);
        return s + ((isFinite(ph) && ph > 0) ? ph : (Number(f.noncredit_ftes) || 0));
      }, 0);
  check("floor 0 → pure proportional (Copper Mountain ≈ combined-FTES share × net)",
    Math.abs(m0.W["Copper Mountain"] -
      combinedFtes(D.colleges.find(function (c) { return c.college === "Copper Mountain"; })) /
        totalBasis * net) < 1);
}

// D2 — front-load Year 1: timing changes, totals don't.
// The Yr1/Yr2 columns are retired (2026-08-31): the ONE award pair (CR award ·
// NC award) reads per year under Annual funding and the full window under
// Combined funding, so the timing story is asserted on those cells, the year
// filter, and the drill-in's carryover line.
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const fmtM = function (v) { return "$" + Math.round(v).toLocaleString("en-US"); };
  check("disbursement toggle renders (even ⇄ front-load)",
    doc.querySelectorAll("#cplFundDisb button").length === 2 &&
    doc.querySelector('#cplFundDisb button[data-val="even"]').className === "on");
  const evenAlloc = T._alloc("Alameda");
  const noceEven = T._alloc("NOCE").total;
  const ncEvenMt = T._ncAward("Mt San Antonio");
  check("even mode: Y1 ≈ half the window total", Math.abs(evenAlloc.y1 - evenAlloc.total / 2) < 1);
  const alaCr = function () {
    const row = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
      .find(function (r) { return /Alameda/.test(r.textContent); });
    return row.querySelector("td.cf-award").textContent;
  };
  check("even mode: the CR award cell reads the ANNUAL figure (cr_award ÷ 2)",
    alaCr().indexOf(fmtM(evenAlloc.cr_award / 2)) === 0);

  // Click Combined funding (stored value stays `frontload`).
  click(window, doc.querySelector('#cplFundDisb button[data-val="frontload"]'));
  check("front-load click persisted to the local scenario",
    T._getScenario().disbursement === "frontload");
  const fl = T._alloc("Alameda");
  check("front-load: Y1 carries the FULL window total", Math.abs(fl.y1 - fl.total) < 0.01);
  check("front-load: Y2 disbursement is $0 (carryover only)", fl.y2 === 0);
  check("front-load: window total unchanged (timing only)", Math.abs(fl.total - evenAlloc.total) < 0.01);
  check("front-load: the CR award cell now reads the WHOLE window (same cell, window figure)",
    alaCr().indexOf(fmtM(fl.cr_award)) === 0);
  check("front-load: the year filter marks Year 2 as carryover (a word, never a glyph)",
    /carryover/i.test(Array.from(doc.querySelectorAll("#cplFundYear button"))
      .map(function (b) { return b.textContent; }).join(" ")));
  // The carryover story on a Year-2 drill-in — the per-year columns' successor.
  T._state.viewSlot = "2";
  T._state.open["c:Alameda"] = true;
  T.render();
  check("front-load: a Year-2 drill-in says the year is carryover",
    (function () {
      const det = Array.from(doc.querySelectorAll("tr.cplfund-detail")).find(function (tr) {
        return /carryover under front-loaded disbursement/.test(tr.textContent);
      });
      return !!det;
    })());
  T._state.viewSlot = "1";
  T._state.open = {};
  T.render();
  check("front-load: window note explains roll-forward + the close-out year",
    doc.querySelector(".cplfund-years").textContent.indexOf("close out by 2028-29") !== -1);
  check("front-load: footer explains the Combined-funding columns + roll-forward",
    /Combined funding:/.test(footText(doc)) && /rolls forward/.test(footText(doc)));
  // The standalone-noncredit table is retired (R9, 2026-08-31): ONE table, one
  // row per institution — the trio's timing rides the same cells as everyone's.
  check("one college table only — no standalone noncredit table survives (R9)",
    doc.querySelectorAll(".cplfund-table").length === 1);
  check("front-load: it moves the TIMING, never the noncredit totals",
    Math.abs(T._alloc("NOCE").total - noceEven) < 0.5 &&
    Math.abs(T._ncAward("Mt San Antonio") - ncEvenMt) < 0.5);

  // Three-layer resolution: SHARED frontload, SCENARIO even → even wins.
  T._setScenario({ disbursement: "even" });
  T._setShared({ disbursement: "frontload" });
  T.render();
  check("scenario disbursement shadows shared",
    doc.querySelector('#cplFundDisb button[data-val="even"]').className === "on");
  T._setScenario({});
  T.render();
  check("shared disbursement applies when no scenario",
    doc.querySelector('#cplFundDisb button[data-val="frontload"]').className === "on");
}

// D3 — RURAL ALLOWANCE RETIRED (Sam, 2026-08-22). The 26 checks that lived here
// covered the carve-out's card, its 13-row section, the floor-fill/bonus split
// and the guarantee. All of it is gone; the retirement itself is guarded in
// tests/cpl_funding_rural.test.js, which is the one place that should know
// about it. Nothing to assert here — the block is retired, not weakened.

// D4 — baseline eligibility badges (informational only).
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  check("eligibility block renders the two built-in requirements as editable text",
    doc.querySelector(".cplfund-elig") &&
    doc.querySelector('input[data-edit="coord-label"]') &&
    doc.querySelector('input[data-edit="coord-label"]').value === "CPL Coordinator listed in MAP" &&
    doc.querySelector('input[data-edit="part-label"]').value === "Participation request by");
  check("deadline is editable and defaults to 2026-09-01",
    doc.querySelector('input[data-edit="deadline"]').value === "2026-09-01");
  check("Elig column renders with pending dashes before data loads",
    doc.querySelector('th[data-sort="elig"]') &&
    doc.querySelector("#cplFundTable tbody tr").innerHTML.indexOf("—") !== -1);

  // Seed eligibility (the RPC + participation reads, minus the network).
  T._setElig({
    coordOk: true,
    coord: { "Alameda": true, "Butte": true },
    optin: { "Alameda": { college: "Alameda" } },
    asOf: "2026-07-06T06:00:00Z"
  });
  T.render();
  check("summary counts coordinators (2 of " + D.colleges.length + ")",
    doc.querySelector(".cplfund-elig").textContent.indexOf("2 of " + D.colleges.length) !== -1);
  check("summary counts opt-ins (1 opted in)",
    doc.querySelector(".cplfund-elig").textContent.indexOf("1") !== -1);
  const alamedaRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr")).find(function (tr) {
    return tr.textContent.indexOf("Alameda") !== -1;
  });
  const butteRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr")).find(function (tr) {
    return tr.textContent.indexOf("Butte") !== -1;
  });
  check("both requirements met → 2 green pie slices", greenSlices(alamedaRow) === 2);
  check("one requirement met → 1 green pie slice", greenSlices(butteRow) === 1);
  // SYSTEM row Elig = institutions meeting ALL tracked requirements (Sam,
  // 2026-07-27) — over the 118-row one-pool roster, not just the colleges:
  // only Alameda has BOTH coordinator + participation here, so 1 of 118.
  check("SYSTEM row shows the all-requirements-met fraction over the one-pool roster",
    doc.querySelector("#cplFundTable .cplfund-systemrow").textContent.indexOf("1/" + ROSTER_N) !== -1);
  check("deadline edit writes to the scenario", (function () {
    commit(window, doc.querySelector('input[data-edit="deadline"]'), "2026-10-01");
    return T._getScenario().participationDeadline === "2026-10-01";
  })());
  // Dollars unchanged by badges: eligibility never enters the alloc model.
  const before = T._alloc("Alameda").total;
  T._setElig({ coordOk: true, coord: {}, optin: {} });
  T.render();
  check("badges never move dollars", Math.abs(T._alloc("Alameda").total - before) < 0.01);
}

// D4b — every requirement is a full-width, bulleted, left-aligned editable line
// (Sam, 2026-07-20: "add bullets … left justify … the whole row of text should
// be editable"). Built-in labels editable, live data on a status sub-line;
// extras are free text with add/edit/remove; all three-layer.
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const nExtra = () => doc.querySelectorAll('.cplfund-elig [data-edit="extra-req"]').length;
  check("data: extra_reqs default is an empty list", Array.isArray(D.extra_reqs) && D.extra_reqs.length === 0);
  check("data: built-in requirement labels have defaults",
    D.coord_req_label === "CPL Coordinator listed in MAP" && D.participation_req_label === "Participation request by");
  check("no extra-requirement rows by default", nExtra() === 0);
  check("number glyphs are removed (curators number them by hand)",
    doc.querySelector(".cplfund-elig").textContent.indexOf("①") === -1 &&
    doc.querySelector(".cplfund-elig").textContent.indexOf("②") === -1);
  // Layout: each requirement is a bulleted, left-aligned row; the box is left-justified.
  check("the eligibility box is left-aligned",
    /cplfund-elig \{[^}]*text-align: left/.test(doc.getElementById("cpl-funding-css").textContent));
  check("each requirement line carries a bullet (2 built-ins, 0 extras)",
    doc.querySelectorAll(".cplfund-elig .cplfund-bullet").length === 2);
  check("both built-in requirement labels are full-width editable inputs",
    !!doc.querySelector('input[data-edit="coord-label"]') && !!doc.querySelector('input[data-edit="part-label"]') &&
    !doc.querySelector('input[data-edit="coord-label"]').getAttribute("size"));
  // The live data lives on a status sub-line under each built-in (so the
  // requirement text itself is the whole editable row).
  check("coordinator live status renders on a sub-line",
    !!doc.querySelector(".cplfund-reqstatus") &&
    doc.querySelector(".cplfund-elig").textContent.indexOf("checking MAP") !== -1);
  check("the deadline field lives on the participation status sub-line",
    !!doc.querySelector('.cplfund-reqstatus input[data-edit="deadline"]'));
  check("an ＋ Add requirement button renders", !!doc.getElementById("cplFundReqAdd"));

  // Built-in label edits persist (and keep their live-data sub-line intact).
  commit(window, doc.querySelector('input[data-edit="coord-label"]'), "1. Coordinator on file in MAP");
  check("editing a built-in requirement label persists to the scenario",
    scenSlot(window).coordLabel === "1. Coordinator on file in MAP");
  check("the edited built-in label re-renders",
    doc.querySelector('input[data-edit="coord-label"]').value === "1. Coordinator on file in MAP");
  check("the coordinator live status survives the label edit",
    doc.querySelector(".cplfund-elig").textContent.indexOf("checking MAP") !== -1 ||
    /\d+ of \d+/.test(doc.querySelector(".cplfund-elig").textContent));

  // Add a qual → a blank bulleted row appears; edit it → persists.
  click(window, doc.getElementById("cplFundReqAdd"));
  check("Add appends a blank additional-requirement row (bullet count 3)",
    nExtra() === 1 && doc.querySelectorAll(".cplfund-elig .cplfund-bullet").length === 3);
  const req0 = doc.querySelector('[data-edit="extra-req"]');
  check("the new requirement box carries a placeholder hint", !!req0.getAttribute("placeholder"));
  commit(window, req0, "Signed MOU on file");
  check("editing the requirement persists to the scenario",
    scenSlot(window).extraReqs && scenSlot(window).extraReqs[0] === "Signed MOU on file");
  check("the edited requirement re-renders",
    doc.querySelector('[data-edit="extra-req"][data-idx="0"]').value === "Signed MOU on file");

  // A second qual.
  click(window, doc.getElementById("cplFundReqAdd"));
  commit(window, doc.querySelectorAll('[data-edit="extra-req"]')[1], "Local CPL policy adopted");
  check("a second qual renders and both persist",
    nExtra() === 2 &&
    scenSlot(window).extraReqs.length === 2 && scenSlot(window).extraReqs[1] === "Local CPL policy adopted");

  // Remove the first → the remaining qual stays. (Target the extra's delete
  // explicitly — the built-ins now carry a .cplfund-reqdel hide button too.)
  click(window, doc.querySelector("[data-reqdel]"));
  check("✕ removes an additional requirement",
    nExtra() === 1 &&
    scenSlot(window).extraReqs.length === 1 && scenSlot(window).extraReqs[0] === "Local CPL policy adopted" &&
    doc.querySelector('[data-edit="extra-req"][data-idx="0"]').value === "Local CPL policy adopted");

  // Informational only: quals never enter the allocation model.
  const dollarsBefore = T._alloc("Alameda").total;
  T._setScenario({ extraReqs: ["a", "b", "c"] });
  T.render();
  check("extra requirements never move dollars", Math.abs(T._alloc("Alameda").total - dollarsBefore) < 0.01);

  // Three-layer resolution: SHARED quals show for anonymous viewers; a SCENARIO
  // (empty list) shadows them → the box shows none.
  T._setScenario({});
  T._setShared({ extraReqs: ["Shared qual"] });
  T.render();
  check("shared-config quals render for anonymous viewers",
    doc.querySelector('[data-edit="extra-req"][data-idx="0"]').value === "Shared qual");
  T._setScenario({ extraReqs: [] });
  T.render();
  check("an empty scenario list shadows the shared quals (box shows none)", nExtra() === 0);
}

// D4c — the two built-ins get a ✕ too (hide, reversibly), + Copy-requirements
// and Generate-brief actions (Sam, 2026-07-20). Hiding follows through to the
// Elig badge so the table stays consistent.
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  // Seed eligibility so the badge has data to reflect.
  T._setElig({ coordOk: true, coord: { "Alameda": true }, optin: {}, asOf: "2026-07-20T06:00:00Z" });
  T.render();
  const alamedaEligCell = () => {
    const tr = Array.from(doc.querySelectorAll("#cplFundTable tbody tr")).find(t => t.textContent.indexOf("Alameda") !== -1);
    // Elig column = the td whose title is the eligTitle string ("… the participation gate …").
    return Array.from(tr.querySelectorAll("td")).find(td => (td.getAttribute("title") || "").indexOf("participation gate") !== -1);
  };
  check("each built-in requirement has a ✕ (hide) control",
    doc.querySelectorAll('[data-reqhide="coord"]').length === 1 && doc.querySelectorAll('[data-reqhide="part"]').length === 1);
  check("Alameda meets 1 of 2 tracked requirements → 1 green of 2 pie slices before hiding",
    alamedaEligCell() && greenSlices(alamedaEligCell()) === 1 && pieSlices(alamedaEligCell()) === 2);

  // Hide the participation requirement → its row disappears, a restore chip
  // appears, and Alameda (coordinator only) now meets ALL shown → ✓.
  click(window, doc.querySelector('[data-reqhide="part"]'));
  check("hiding a built-in removes its row from the box",
    !doc.querySelector('input[data-edit="part-label"]') && !!doc.querySelector('input[data-edit="coord-label"]'));
  check("a restore chip appears for the hidden requirement", !!doc.querySelector('[data-reqshow="part"]'));
  check("hide persists to the scenario", scenSlot(window).partHidden === true);
  check("badge follows: with only coordinator tracked, Alameda's pie is 1 green of 1",
    greenSlices(alamedaEligCell()) === 1 && pieSlices(alamedaEligCell()) === 1);
  check("SYSTEM row still shows the coordinator fraction over the roster (coord not hidden)",
    doc.querySelector("#cplFundTable .cplfund-systemrow").textContent.indexOf("1/" + ROSTER_N) !== -1);

  // Restore it.
  click(window, doc.querySelector('[data-reqshow="part"]'));
  check("restore brings the built-in row back",
    !!doc.querySelector('input[data-edit="part-label"]') && !doc.querySelector('[data-reqshow="part"]') &&
    scenSlot(window).partHidden === false);

  // Copy requirements → formatted memo text via the builder.
  check("Copy-requirements button renders", !!doc.getElementById("cplFundReqCopy"));
  const txt = T._requirementsText();
  check("requirements text is a numbered list with both built-ins + funding line",
    /1\. CPL Coordinator listed in MAP/.test(txt) &&
    /2\. Participation request by 2026-09-01/.test(txt) &&
    /1 of \d+ colleges currently have one on file/.test(txt) &&
    /Mapping Articulated Pathways \(MAP\) platform/.test(txt));
  // Clicking Copy must not throw even without a clipboard API (jsdom).
  let copyThrew = false;
  try { click(window, doc.getElementById("cplFundReqCopy")); } catch (e) { copyThrew = true; }
  check("clicking Copy does not throw when no clipboard API is present", !copyThrew);

  // Generate brief → a standalone, sendable HTML doc (reflects the model).
  check("Generate-brief button renders", !!doc.getElementById("cplFundReqBrief"));
  const brief = T._briefHtml();
  check("brief is a standalone doc naming the CPL Initiative + MAP platform",
    brief.indexOf("<!doctype html>") === 0 &&
    brief.indexOf("CPL Initiative") !== -1 &&
    brief.indexOf("Mapping Articulated Pathways (MAP) platform") !== -1 &&
    brief.indexOf("MAP Initiative") === -1);
  check("brief lists the current requirements + a what-to-do section",
    brief.indexOf("Proposed baseline requirements") !== -1 &&
    brief.indexOf("CPL Coordinator listed in MAP") !== -1 &&
    brief.indexOf("What your college should do") !== -1 &&
    brief.indexOf("participation request by 2026-09-01") !== -1);
  check("brief reflects an edited requirement (regenerable after revisions)", (function () {
    T._setScenario({ extraReqs: ["75% of veteran JSTs uploaded in MAP"] });
    T.render();
    return T._briefHtml().indexOf("75% of veteran JSTs uploaded in MAP") !== -1 &&
           T._requirementsText().indexOf("75% of veteran JSTs uploaded in MAP") !== -1;
  })());
}

// D5 — the SYSTEM row totals each lane in the UNITS of the column it tops.
//
// BASIS-AWARE 2026-08-01, RE-SHAPED for one pool 2026-08-31. This row once
// printed sys.headcount under a "Credit FTES" header — a total not in the
// units of its column is worse than no total: it invites the reader to add up
// the column, and it will not reconcile. Under one pool the SYSTEM row carries
// a CR FTES / NC FTES pair: the credit column must total the college credit
// FTES, and the noncredit column must total ALL noncredit — the college rows'
// own noncredit FTES plus the standalone trio (placeholder-aware, matching
// feederBasis(); Mt. SAC Noncredit counted ONCE, on the Mt San Antonio row) —
// while the 2.5M headcount stays context-only and never appears as a row figure.
{
  const { window } = freshDom();
  const doc = boot(window);
  const collegeFtes = D.colleges.reduce(function (s, c) { return s + (c.credit_ftes || 0); }, 0);
  // ALL noncredit: 108 college rows carry noncredit FTES of their own, plus the
  // standalone rows. A campus whose reported figure is not yet trustworthy
  // contributes its PLACEHOLDER to the basis — summing the raw reported values
  // would silently re-admit the number the placeholder exists to keep out.
  const allNoncredit = D.colleges.reduce(function (s, c) { return s + (Number(c.noncredit_ftes) || 0); }, 0) +
    D.feeders.filter(function (f) { return !f.nc_ftes_on_credit_row; })
      .reduce(function (s, f) {
        const ph = Number(f.noncredit_ftes_placeholder);
        return s + ((isFinite(ph) && ph > 0) ? ph : (Number(f.noncredit_ftes) || 0));
      }, 0);
  const sysText = function () {
    return doc.querySelector("#cplFundTable .cplfund-systemrow").textContent;
  };
  check("SYSTEM row totals credit FTES under the CR FTES header",
    sysText().indexOf(Math.round(collegeFtes).toLocaleString("en-US")) !== -1);
  check("SYSTEM row totals ALL noncredit (college rows + standalone trio, Mt. SAC once) under NC FTES",
    sysText().indexOf(Math.round(allNoncredit).toLocaleString("en-US")) !== -1);
  // The regression that shipped: the headcount total must NOT be a row figure.
  check("SYSTEM row never prints the context headcount as a column total",
    sysText().indexOf(D.system.headcount.toLocaleString("en-US")) === -1);
  click(window, doc.querySelector('#cplFundGroup button[data-val="district"]'));
  check("the SYSTEM row still carries both lane totals when grouped by district",
    sysText().indexOf(Math.round(collegeFtes).toLocaleString("en-US")) !== -1 &&
    sysText().indexOf(Math.round(allNoncredit).toLocaleString("en-US")) !== -1);
}

// D6 — consumer wiring for the eligibility reads (static greps).
check("consumer reads the PII-free coordinator RPC (map_coordinator_summary)",
  /map_coordinator_summary/.test(consumerSrc));
check("consumer reads/writes cpl_funding_participation",
  /cpl_funding_participation/.test(consumerSrc));
check("consumer joins college names through cplCollegeShort",
  /cplCollegeShort/.test(consumerSrc));
check("PII guard: consumer never renders coordinator names/emails (boolean only)",
  /has_coordinator/.test(consumerSrc) && !/coordinator_email/.test(consumerSrc));

finish();
