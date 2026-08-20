// CPL Implementation Funding tab — the 2026-07-06 equity refinements (Part D).
//
// Front-load · minimum-viable floor · rural allowance · baseline eligibility.
// Data defaults first, then renderer behaviour.
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

// ─────────────────────────────────────────────────────────────────────────────
// Part D — the 2026-07-06 equity refinements (front-load · floor · rural ·
// eligibility). Data defaults first, then renderer behaviour.
// ─────────────────────────────────────────────────────────────────────────────

// D0 — data defaults for all four features.
check("data: disbursement defaults to even tranches", D.disbursement === "even");
check("data: minimum-viable floor default $150K/window", D.pool.floor_window === 150000);
check("data: rural carve-out default $1M", D.pool.rural_carveout === 1000000);
check("data: rural allowance is now a guaranteed earmark (no ≥50% threshold)",
  D.rural_threshold === undefined && /guaranteed/.test(D.pool.rural_carveout_label || ""));
check("data: exactly the 13 federally-rural colleges are rural-flagged",
  D.colleges.filter(function (c) { return c.rural; }).length === 13 &&
  ["Siskiyous", "Feather River", "Lassen", "Redwoods", "Shasta",
   "Columbia", "Cerro Coso", "Taft", "West Hills Coalinga", "Barstow",
   "Palo Verde", "Copper Mountain", "Imperial"].every(function (n) {
    return D.colleges.some(function (c) { return c.college === n && c.rural === true; });
  }));
check("data: rural roster provenance cites the federal rural categorization",
  /federally categorized as rural/.test(D.rural_source || ""));
check("data: participation deadline default Sept 1, 2026", D.participation_deadline === "2026-09-01");

// D1 — minimum-viable floor: waterfall math (model-level, via test hooks).
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const m = T._model();
  const net = T._netCollege();
  check("floor model: MAIN pool conserved (Σ main entitlements = net main pool)",
    Math.abs(Object.values(m.W).reduce(function (s, w) { return s + w; }, 0) - net) < 1);
  // PR4 (Sam, 2026-07-28): the floor now guarantees each college's TOTAL window
  // (main + guaranteed rural) ≥ the floor — a rural college's MAIN entitlement can
  // sit below the full floor (at the reduced floor = floor − ruralPer) because its
  // guaranteed rural allowance funds the rest.
  check("floor model: no college's TOTAL window falls below the $150K floor",
    D.colleges.every(function (c) { return T._alloc(c.college).total >= m.floor - 0.01; }));
  // How MANY colleges the floor catches scales inversely with the pool, so bound it
  // by the structural invariant (a minority, and only sub-scale colleges) rather
  // than a literal that a pool change silently invalidates.
  const meanFtes = D.colleges.reduce(function (s, c) { return s + (c.credit_ftes || 0); }, 0) / D.colleges.length;
  check("floor model: floored set is non-empty and bounded (sub-scale colleges only)",
    m.floorCount > 0 && m.floorCount < D.colleges.length / 2 &&
    Object.keys(m.floored).every(function (n) {
      const c = D.colleges.find(function (x) { return x.college === n; });
      // Floored colleges are sub-scale on the ALLOCATION BASIS (credit FTES
      // since 2026-07-31), which is not the same set as sub-scale by headcount.
      return c && (c.credit_ftes || 0) < meanFtes;
    }));
  const perRural = D.pool.rural_carveout / 13;
  check("floor model: smallest college (Copper Mountain, rural) main entitlement sits at the REDUCED floor (floor − rural allowance)",
    Math.abs(m.W["Copper Mountain"] - (m.floor - perRural)) < 1);
  // Named college removed deliberately: the largest entitlement follows the
  // ALLOCATION BASIS, and under credit FTES that is Mt San Antonio, not East LA
  // (which is the largest by headcount). Assert the property, not the name.
  {
    const biggestByFtes = D.colleges.slice().sort(function (a, b) { return b.credit_ftes - a.credit_ftes; })[0].college;
    check("floor model: the largest college on the basis takes the max entitlement, well above the floor",
      m.W[biggestByFtes] === Math.max.apply(null, Object.values(m.W)) && m.W[biggestByFtes] > m.floor * 3);
  }
  const cm = T._alloc("Copper Mountain");
  // Copper Mountain is BOTH floored and (federally) rural. Under PR4 its rural
  // allowance is consumed reaching the floor, so its window total = exactly the
  // floor (main reduced-floor + guaranteed rural = floor; no on-top bonus).
  check("PR4: floored rural college's window total = exactly the floor (rural fully funds the gap)",
    cm.rural_w > 0 && Math.abs(cm.total - m.floor) < 1);
  check("PR4: its rural allowance is fully consumed as floor-fill (no on-top bonus)",
    Math.abs(cm.main_w + cm.rural_w - m.floor) < 1);
  check("floored college is flagged for the ⬆ chip", cm.floored === true);

  // UI: floor pool card + chip + drill-in line.
  const doc = window.document;
  const floorCard = doc.querySelector(".cplfund-card.floor");
  check("floor pool card renders with the top-up count", floorCard && /topped up/.test(floorCard.textContent));
  check("formula explains the floor renormalization", /Minimum-viable floor/.test(doc.querySelector(".cplfund-formula").textContent));
  const cmRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr")).find(function (tr) {
    return tr.textContent.indexOf("Copper Mountain") !== -1;
  });
  check("floored row carries the ⬆ chip", cmRow && cmRow.innerHTML.indexOf("⬆") !== -1);
  window.eval('CPL_FUNDING_TAB._state.open["c:' + D.colleges.find(function (c) { return c.college === "Copper Mountain"; }).order + '"] = true;');
  T.render();
  const detail = Array.from(doc.querySelectorAll("tr.cplfund-detail")).find(function (tr) {
    return tr.textContent.indexOf("Floor applied") !== -1;
  });
  check("floored drill-in explains the top-up vs the proportional share", !!detail);

  // Setting the floor to 0 disables it (pure proportional, no floored rows).
  T._setScenario({ pool: { floor_window: 0 } });
  const m0 = T._model();
  check("floor 0 disables the waterfall (no floored colleges)", m0.floorCount === 0);
  check("floor 0 → pure proportional (Copper Mountain ≈ credit-FTES share × net)",
    Math.abs(m0.W["Copper Mountain"] -
      D.colleges.find(function (c) { return c.college === "Copper Mountain"; }).credit_ftes /
        D.colleges.reduce(function (t, c) { return t + c.credit_ftes; }, 0) * net) < 1);
}

// D2 — front-load Year 1: timing changes, totals don't.
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  check("disbursement toggle renders (even ⇄ front-load)",
    doc.querySelectorAll("#cplFundDisb button").length === 2 &&
    doc.querySelector('#cplFundDisb button[data-val="even"]').className === "on");
  const evenAlloc = T._alloc("Alameda");
  check("even mode: Y1 ≈ half the window total", Math.abs(evenAlloc.y1 - evenAlloc.total / 2) < 1);

  // Click Front-load Year 1.
  click(window, doc.querySelector('#cplFundDisb button[data-val="frontload"]'));
  check("front-load click persisted to the local scenario",
    T._getScenario().disbursement === "frontload");
  const fl = T._alloc("Alameda");
  check("front-load: Y1 carries the FULL window total", Math.abs(fl.y1 - fl.total) < 0.01);
  check("front-load: Y2 disbursement is $0 (carryover only)", fl.y2 === 0);
  check("front-load: window total unchanged (timing only)", Math.abs(fl.total - evenAlloc.total) < 0.01);
  const row = doc.querySelector("#cplFundTable tbody tr");
  check("front-load: later year cells render ↻ carryover", row.textContent.indexOf("↻ carryover") !== -1);
  check("front-load: SYSTEM tfoot Y2 is carryover too",
    doc.querySelector("#cplFundTable .cplfund-systemrow").textContent.indexOf("↻ carryover") !== -1);
  check("front-load: window note explains roll-forward + the close-out year",
    doc.querySelector(".cplfund-years").textContent.indexOf("close out by 2028-29") !== -1);
  check("front-load: footer explains the Yr-1 column + carryover",
    footText(doc).indexOf("Front-loaded disbursement") !== -1);
  const feederTable = doc.querySelectorAll(".cplfund-table")[1];
  check("front-load: feeder pool disburses up front (full carve-out in Yr 1)",
    feederTable.textContent.indexOf("$" + D.pool.feeder_carveout.toLocaleString("en-US")) !== -1 &&
    feederTable.querySelector("thead").textContent.indexOf("front-loaded") !== -1);

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

// D3 — rural allowance: carve-out + roster + performance gate.
{
  const { window } = freshDom();
  window.eval(fs.readFileSync("tests/fixtures" in {} ? "" : "cpl_funding_data.js", "utf8"));
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const ruralCard = doc.querySelector(".cplfund-card.rural");
  // The label is now an editable input, so its text lives in the value.
  check("rural pool card is a GUARANTEED earmark within the pool (no longer a deduction)", !!(ruralCard &&
    !ruralCard.querySelector(".v.neg") &&
    /guaranteed/i.test((ruralCard.querySelector('input[data-edit="pool-label"]') || {}).value || "") &&
    /funds rural colleges&#39;? floor first|floor first/.test(ruralCard.innerHTML)));
  const ruralTable = doc.querySelectorAll(".cplfund-table")[2];
  check("rural section lists the 13 rural-flagged colleges",
    ruralTable && ruralTable.querySelectorAll("tbody tr").length === 13);
  const perRural = Math.round(D.pool.rural_carveout / 13);   // $76,923 (rendered rounds)
  check("each rural college gets an equal guaranteed share ($" + perRural.toLocaleString() + ")",
    ruralTable.textContent.indexOf("$" + perRural.toLocaleString("en-US")) !== -1);
  // PR4: the allowance is GUARANTEED — it shows regardless of actuals, never "pending data".
  check("guaranteed model: no rural row reads 'pending data' (allowance is not performance-gated)",
    Array.from(ruralTable.querySelectorAll("tbody tr")).every(function (tr) {
      return tr.textContent.indexOf("pending data") === -1;
    }));
  check("guaranteed model: the ≥50% threshold input is gone", !doc.querySelector('input[data-edit="rural-threshold"]'));

  // A floored rural college (Copper Mountain): its slice is fully consumed as
  // floor-fill; bonus column is a dash; window total = exactly the floor.
  const cmRuralRow = Array.from(ruralTable.querySelectorAll("tbody tr")).find(function (tr) {
    return tr.textContent.indexOf("Copper Mountain") !== -1;
  });
  const cmCells = cmRuralRow ? cmRuralRow.querySelectorAll("td") : [];
  check("floored rural college: floor-fill column shows the (nearly full) allowance",
    cmCells.length === 6 && cmCells[3].textContent.indexOf("76,9") !== -1);
  check("floored rural college: on-top bonus is a dash (allowance consumed by the floor)",
    cmCells.length === 6 && cmCells[4].textContent.trim() === "—");
  check("floored rural college: window total = exactly the $150K floor",
    cmCells.length === 6 && cmCells[5].textContent.indexOf("150,000") !== -1);

  // The rural college with the LARGEST main-pool entitlement. Whether ANY rural
  // college's main share clears the FULL floor is a function of pool size — at the
  // Sept-2026 amendment pool ($23.24M main) none do; before it, Shasta did. So
  // assert whichever branch the model is actually in, and in BOTH branches assert
  // the conservation identity (floor-fill + bonus = the guaranteed allowance).
  const mdlBR = T._model();
  const bigRural = D.colleges.filter(function (c) { return c.rural; })
    .reduce(function (a, b) { return (mdlBR.W[a.college] || 0) >= (mdlBR.W[b.college] || 0) ? a : b; });
  const brRow = Array.from(ruralTable.querySelectorAll("tbody tr")).find(function (tr) {
    return tr.textContent.indexOf(bigRural.display || bigRural.college) !== -1;
  });
  const brCells = brRow ? brRow.querySelectorAll("td") : [];
  const money = function (td) { return Number(String(td.textContent).replace(/[^0-9.]/g, "")) || 0; };
  const brGap = Math.max(0, mdlBR.floor - (mdlBR.W[bigRural.college] || 0));
  if (brGap <= 0.5) {
    check("largest rural college (main share ≥ floor): floor-fill is a dash",
      brCells.length === 6 && brCells[3].textContent.trim() === "—");
    check("largest rural college (main share ≥ floor): the full allowance rides on top as a bonus",
      brCells.length === 6 && Math.abs(money(brCells[4]) - perRural) < 2);
  } else {
    check("largest rural college (main share < floor): floor-fill equals its exact gap to the floor",
      brCells.length === 6 && Math.abs(money(brCells[3]) - brGap) < 2);
    check("largest rural college (main share < floor): floor-fill + bonus conserve the allowance",
      brCells.length === 6 && Math.abs(money(brCells[3]) + money(brCells[4]) - perRural) < 2);
  }

  // tfoot: RURAL POOL conserves floor-fill + bonus = the carve-out; funding-their-floor
  // count is derived from the model (robust to pool size).
  const rtFoot = ruralTable.querySelector("tfoot");
  const mdl = T._model(); const perR3 = D.pool.rural_carveout / 13; let nFillR3 = 0;
  D.colleges.filter(function (c) { return c.rural; }).forEach(function (c) {
    if (Math.max(0, mdl.floor - (mdl.W[c.college] || 0)) > 0.5) nFillR3++;
  });
  check("rural tfoot reports the count funding their floor (derived N of 13)",
    rtFoot && nFillR3 > 0 && rtFoot.textContent.indexOf(nFillR3 + " of 13 funding their floor") !== -1);

  const shastaRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr")).find(function (tr) {
    return tr.textContent.indexOf("Shasta") !== -1;
  });
  check("rural college row carries the 🌲 chip", shastaRow && shastaRow.innerHTML.indexOf("🌲") !== -1);
  check("the rural 🌲 glyph is the larger, muted variant (cplfund-tree)",
    !!(shastaRow && shastaRow.querySelector(".cplfund-tree")) &&
    /\.cplfund-chip\.cplfund-tree \{[^}]*opacity: \.5;[^}]*filter: grayscale/.test(consumerSrc));

  // Guaranteed regardless of performance: even when a rural college posts NOTHING
  // in the feed, its allowance + window total are unchanged (no gate).
  const cmTotalBefore = cmCells.length === 6 ? cmCells[5].textContent : "";
  window.CPL_FUNDING_PERF = {
    as_of: "2026-07-06", suppress_below: 5,
    statewide: { pe: 100, p2: 100, p3: 100 },
    colleges: {}, unmatched: {}
  };
  T.render();
  const ruralTable2 = doc.querySelectorAll(".cplfund-table")[2];
  const cmRow2 = Array.from(ruralTable2.querySelectorAll("tbody tr")).find(function (tr) {
    return tr.textContent.indexOf("Copper Mountain") !== -1;
  });
  check("guaranteed: a rural college that posts nothing keeps its full allowance + floor total",
    cmRow2 && cmRow2.querySelectorAll("td")[5].textContent === cmTotalBefore &&
    cmRow2.textContent.indexOf("76,9") !== -1);
  delete window.CPL_FUNDING_PERF;

  // Rural flag override via config (the drill-in button's write path): add a
  // non-rural college (Alameda) and remove a rural one (Shasta).
  T._setScenario({ ruralOverrides: { "Alameda": true, "Shasta": false } });
  T.render();
  const ruralTable4 = doc.querySelectorAll(".cplfund-table")[2];
  check("rural overrides add/remove colleges from the roster",
    ruralTable4.textContent.indexOf("Alameda") !== -1 &&
    Array.from(ruralTable4.querySelectorAll("tbody tr")).every(function (tr) {
      return tr.textContent.indexOf("Shasta") === -1;
    }));
}

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
  // SYSTEM row Elig = colleges meeting ALL tracked requirements (Sam, 2026-07-27):
  // only Alameda has BOTH coordinator + participation here, so 1 of N.
  check("SYSTEM tfoot shows the all-requirements-met fraction (not the coordinator count)",
    doc.querySelector("#cplFundTable .cplfund-systemrow").textContent.indexOf("1/" + D.colleges.length) !== -1);
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
  check("SYSTEM tfoot still shows the coordinator fraction (coord not hidden)",
    doc.querySelector("#cplFundTable .cplfund-systemrow").textContent.indexOf("1/" + D.colleges.length) !== -1);

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

// D5 — the noncredit feeders are included in the totals (Sam, 2026-07-06):
// the SYSTEM row shows allocation basis + feeders = CCC total in BOTH table
// views (the pool card already showed it).
//
// BASIS-AWARE 2026-08-01. This row printed sys.headcount unconditionally, so
// under the credit-FTES basis the column header read "Credit FTES" and the
// SYSTEM row beneath it read 2,517,685 — the headcount — while every college
// row above it correctly read credit FTES. A total not in the units of the
// column it tops is worse than no total: it invites the reader to add up the
// column, and it will not reconcile. The feeder side switches with it too
// (noncredit FTES against credit FTES, never feeder headcount).
{
  const { window } = freshDom();
  const doc = boot(window);
  const feederFtes = D.feeders.reduce(function (s, f) {
    // Placeholder-aware, matching feederBasis(): a campus whose reported figure
    // is not yet trustworthy contributes its PLACEHOLDER to the basis. Summing
    // the raw reported values here would silently re-admit the number the
    // placeholder exists to keep out of the model.
    const ph = Number(f.noncredit_ftes_placeholder);
    return s + ((isFinite(ph) && ph > 0) ? ph : (Number(f.noncredit_ftes) || 0));
  }, 0);
  const collegeFtes = D.colleges.reduce(function (s, c) { return s + (c.credit_ftes || 0); }, 0);
  const combined = Math.round(collegeFtes + feederFtes).toLocaleString("en-US");
  const sysText = function () {
    return doc.querySelector("#cplFundTable .cplfund-systemrow").textContent;
  };
  check("college-view SYSTEM row includes the noncredit feeders in the CCC total",
    sysText().indexOf(combined) !== -1 && sysText().indexOf("noncredit") !== -1);
  // The regression that shipped: the row total must be in the SAME unit as the
  // column header above it, so assert the headcount total is NOT what's there.
  check("SYSTEM row totals the ACTIVE basis, not headcount, under its own header",
    sysText().indexOf(Math.round(collegeFtes).toLocaleString("en-US")) !== -1 &&
    sysText().indexOf(D.system.headcount.toLocaleString("en-US")) === -1);
  click(window, doc.querySelector('#cplFundGroup button[data-val="district"]'));
  check("the SYSTEM row still carries the noncredit feeders when grouped by district",
    sysText().indexOf(combined) !== -1);
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
