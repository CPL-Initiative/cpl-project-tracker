// CPL Implementation Funding tab — renderer behaviour, part 1 (C1–C7).
//
// boot() draws the full view; the 2-year window + year filter; the noncredit
// feeder carve-out; editable priority text/shares; and the three config layers
// (baked defaults ⊕ shared Supabase config ⊕ per-browser scenario) resolving to
// the right store.
//
// One of nine suites the 2,955-line cpl_funding.test.js was split into on
// 2026-08-20, after it stopped fitting in a 12 GB heap. Shared setup + the
// jsdom helpers live in tests/lib/cpl_funding_harness.js, which also carries the
// measurements behind the split and the per-window memory budget for anyone
// adding to these files.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_render.test.js`).
const {
  check,
  freshDom,
  boot,
  click,
  commit,
  scenSlot,
  footText,
  D,
  cpl,
  idx,
  finish,
} = require("./lib/cpl_funding_harness.js");

// ─────────────────────────────────────────────────────────────────────────────
// Part C — renderer behaviour (jsdom). NO_REMOTE keeps the shared-config fetch
// out of the tests (the sandbox is egress-blocked anyway).
// ─────────────────────────────────────────────────────────────────────────────

// C1 — happy path.
{
  const { window } = freshDom();
  let threw = false;
  let doc;
  try { doc = boot(window); } catch (e) { threw = true; console.error(e); }
  check("boot() renders without throwing", !threw);
  check("renders pool cards (incl. feeder carve-out)", doc.querySelectorAll(".cplfund-card").length >= 6);
  // Item-2 sanity (Sam, 2026-07-03): the basis card shows the college basis +
  // the noncredit-feeder side + the combined CCC total.
  //
  // BASIS-AWARE since 2026-08-01. This card hardcoded HEADCOUNT and called it
  // "the allocation basis" — which stopped being true when the basis moved to
  // credit FTES (#959), so it asserted a false thing on the live page for two
  // days. It now follows the seam, and the feeder side switches with it:
  // credit FTES on the college side pairs with NONCREDIT FTES on the feeder
  // side (the feeders are noncredit campuses; pairing credit FTES with feeder
  // HEADCOUNT would add two different quantities and call the sum a total).
  {
    const feederFtes = D.feeders.reduce(function (s, f) {
    // Placeholder-aware, matching feederBasis(): a campus whose reported figure
    // is not yet trustworthy contributes its PLACEHOLDER to the basis. Summing
    // the raw reported values here would silently re-admit the number the
    // placeholder exists to keep out of the model.
    const ph = Number(f.noncredit_ftes_placeholder);
    return s + ((isFinite(ph) && ph > 0) ? ph : (Number(f.noncredit_ftes) || 0));
  }, 0);
    const collegeFtes = D.colleges.reduce(function (s, c) { return s + (c.credit_ftes || 0); }, 0);
    const combined = Math.round(collegeFtes + feederFtes);
    const card = Array.from(doc.querySelectorAll(".cplfund-card .l"))
      .find(function (l) { return l.textContent.indexOf("CCC total") !== -1; });
    check("basis card names the ACTIVE basis, not a hardcoded 'headcount'",
      card && /credit FTES \(allocation basis\)/.test(card.textContent));
    check("basis card shows colleges + feeders + combined CCC total, all in FTES",
      card && card.textContent.indexOf(Math.round(feederFtes).toLocaleString("en-US")) !== -1 &&
      card.textContent.indexOf(combined.toLocaleString("en-US")) !== -1);
    check("basis card does NOT pair credit FTES with feeder HEADCOUNT",
      card && card.textContent.indexOf(
        D.feeders.reduce(function (s, f) { return s + f.headcount; }, 0).toLocaleString("en-US")) === -1);
  }
  // The rate card FOLLOWS THE METRICS. This fixture boots the committed baked
  // defaults, whose Year-1 metrics are headcount-denominated ("Headcount of
  // students eligible for..."), so the per-student card is the CORRECT render
  // here and Scenario 2 keeps working. The CPL-FTES rate card that replaces it
  // under FTES metrics is asserted in cpl_funding_cpl_ftes.test.js, which boots
  // the FTES metric strings.
  {
    const cards = Array.from(doc.querySelectorAll(".cplfund-card .l"))
      .map(function (l) { return l.textContent; });
    check("headcount metrics keep the per-student rate card (Scenario 2 path)",
      cards.some(function (t) { return /Per-student rate/.test(t); }));
    check("...and say why it is headcount-denominated rather than asserting it bare",
      cards.some(function (t) { return /metrics are headcount-denominated/.test(t); }));
    check("the CPL-FTES rate card does NOT appear when no metric is in FTES",
      !cards.some(function (t) { return /Reimbursement rate per/.test(t); }));
  }
  check("feeder carve-out card is a deduction", !!doc.querySelector(".cplfund-card.feeder"));
  check("renders 3 priority cards", doc.querySelectorAll(".cplfund-prio .p").length === 3);
  const tables = doc.querySelectorAll(".cplfund-table");
  check("three tables: college + feeder + rural allowance", tables.length === 3);
  check("renders one row per college", tables[0].querySelectorAll("tbody tr.cplfund-row").length === D.colleges.length);
  // Sam, 2026-08-04: advisory noncredit-FTES companion line in the size cell + the DeAnza display override.
  {
    const bodyText = tables[0].textContent;
    check("size cell shows the advisory 'NC FTES' companion line", bodyText.indexOf("NC FTES") !== -1);
    check("De Anza renders via the display override 'DeAnza' (no space)",
      bodyText.indexOf("DeAnza") !== -1 &&
      D.colleges.some(function (c) { return c.college === "De Anza" && c.display === "DeAnza"; }));
    const sf = D.colleges.find(function (c) { return c.college === "San Francisco"; });
    const sfRow = Array.from(tables[0].querySelectorAll("tbody tr.cplfund-row"))
      .find(function (tr) { return tr.textContent.indexOf("San Francisco") !== -1; });
    check("a college's own noncredit FTES renders in its size cell (San Francisco)",
      !!sfRow && sfRow.textContent.indexOf("NC FTES") !== -1 &&
      sfRow.textContent.indexOf(Math.round(sf.noncredit_ftes).toLocaleString("en-US")) !== -1);
  }
  check("renders one row per feeder (4)", tables[1].querySelectorAll("tbody tr").length === 4);
  // SYSTEM total moved from <tfoot> to the FIRST body row (Sam, 2026-07-23).
  check("SYSTEM pinned as the FIRST body row (moved from tfoot)",
    !tables[0].querySelector("tfoot") &&
    tables[0].querySelector("tbody tr").classList.contains("cplfund-systemrow") &&
    tables[0].querySelector("tbody tr.cplfund-systemrow").textContent.indexOf("SYSTEM") !== -1);
  // PR-1 (Sam, 2026-07-23): Total Available Funds + Award range boxes.
  {
    const totalAvail = D.pool.one_time_2026_27;   // $35M — the 2025-26 remaining is a separate topic
    const totalCard = doc.querySelector(".cplfund-card.total");
    // Sam, 2026-08-04: a single revenue source collapses to ONE editable box (no
    // duplicate computed total). It carries the source value (editable input) + the
    // total-available note.
    check("Total Available Funding card = the one editable 2026-27 appropriation box ($35M)",
      !!totalCard &&
      doc.querySelectorAll(".cplfund-card.total").length === 1 &&
      totalCard.querySelector(".v").innerHTML.indexOf(Math.round(totalAvail).toLocaleString("en-US")) !== -1 &&
      totalCard.textContent.toLowerCase().indexOf("total available funding") !== -1);
    const awardCards = Array.from(doc.querySelectorAll(".cplfund-card.award"));
    check("Award range shows Average / Minimum / Maximum (3 cards)",
      awardCards.length === 3 &&
      awardCards.some(function (c) { return c.textContent.indexOf("Average award") !== -1; }) &&
      awardCards.some(function (c) { return c.textContent.indexOf("Minimum award") !== -1; }) &&
      awardCards.some(function (c) { return c.textContent.indexOf("Maximum award") !== -1; }));
    // Sam, 2026-08-04: ordered Minimum · Average · Maximum (low→high).
    check("Award range cards ordered Minimum · Average · Maximum",
      awardCards[0].textContent.indexOf("Minimum award") !== -1 &&
      awardCards[1].textContent.indexOf("Average award") !== -1 &&
      awardCards[2].textContent.indexOf("Maximum award") !== -1);
    const avgAward = D.colleges.reduce(function (s, c) {
      return s + window.CPL_FUNDING_TAB._alloc(c.college).total; }, 0) / D.colleges.length;
    check("Average award card = Σ college window totals ÷ N",
      awardCards[1].querySelector(".v").textContent.indexOf("$" + Math.round(avgAward).toLocaleString("en-US")) !== -1);
    // With the default floor active, many colleges share the minimum — the Min
    // card names the floor count, not one arbitrary college.
    check("Minimum award card reports the floored-college count (not one college)",
      awardCards[0].textContent.indexOf("floor") !== -1);
  }
  check("scoped CSS injected once", doc.querySelectorAll("#cpl-funding-css").length === 1);
  window.CPL_FUNDING_TAB.render();
  check("DRAFT chip renders in the pane header, once",
    doc.querySelectorAll("#cplFundingDraftChip").length === 1 &&
    doc.querySelector("#tab-implementation-funding h2 .cplfund-draftchip").textContent === "Draft");
  check("uses var(--token) CSS, no raw hex", !/#[0-9a-fA-F]{3,6}\b/.test(doc.getElementById("cpl-funding-css").textContent));
  check("null working-adults cells render as —", tables[0].textContent.indexOf("NaN") === -1);

  // No-horizontal-scroll rule: district fold + P1/P2/P3 headers.
  const distCell = tables[0].querySelector("tbody tr td.trunc");
  check("district cell folds the CCD suffix + keeps the full name in title",
    distCell.textContent.indexOf(" CCD") !== -1 &&
    distCell.textContent.indexOf("Community College District") === -1 &&
    distCell.getAttribute("title").indexOf("Community College District") !== -1);
  // One dollar column PER FUNDING YEAR + a window Total (Sam, 2026-07-03) —
  // the P1/P2/P3 columns are retired to the drill-in.
  check("table has one column per funding year (Yr 1 / Yr 2) with the year in the tooltip",
    doc.querySelector('th[data-sort="y1"]') && doc.querySelector('th[data-sort="y2"]') &&
    (doc.querySelector('th[data-sort="y1"]').getAttribute("title") || "").indexOf("2026-27") !== -1);
  check("no per-priority P1/P2/P3 columns in the table", !doc.querySelector('th[data-sort="p1"]'));
  check("Total column is labeled with the window",
    doc.querySelector('th[data-sort="total"]').textContent.indexOf("Total 2026") === 0);
  check("no period toggle (per-year + window total are both columns now)",
    !doc.getElementById("cplFundPeriod"));

  // Search narrows.
  const input = doc.getElementById("cplFundSearch");
  commit(window, input, "Yuba");
  input.dispatchEvent(new window.Event("input"));
  const afterSearch = doc.querySelectorAll("#cplFundTable tbody tr").length;
  check("search narrows rows (Yuba)", afterSearch >= 1 && afterSearch < D.colleges.length);
  input.value = ""; input.dispatchEvent(new window.Event("input"));

  // Sort by Total desc.
  const totalTh = doc.querySelector('#cplFundTable th[data-sort="total"]');
  click(window, totalTh);
  // First SORTABLE college row — the pinned SYSTEM total row is tbody's first
  // child now, so skip it via .cplfund-row.
  const firstRow = doc.querySelector("#cplFundTable tbody tr.cplfund-row");
  // largest headcount college = largest total (default balanced shares).
  const maxHc = Math.max.apply(null, D.colleges.map(function (c) { return c.headcount; }));
  const maxCollege = D.colleges.filter(function (c) { return c.headcount === maxHc; })[0].college;
  check("sort by Total desc puts the largest college first", firstRow.textContent.indexOf(maxCollege) !== -1);

  // Provenance surfaces.
  check("footnote cites the DataMart headcount source",
    footText(doc).indexOf("DataMart") !== -1);
  // The size column follows the ALLOCATION BASIS (credit FTES by default since
  // 2026-07-31), so assert against the active basis rather than a fixed key.
  check("size column header names the basis + cites its source",
    (doc.querySelector('th[data-sort="credit_ftes"]').getAttribute("title") || "")
      .indexOf("allocation basis") !== -1);
  check("mixed-vintage honesty note counts the rows still on 2022-23",
    footText(doc).indexOf("await a 2025-26 headcount") !== -1);

  // No-match empty row.
  commit(window, doc.getElementById("cplFundSearch"), "zzz-no-such-college");
  doc.getElementById("cplFundSearch").dispatchEvent(new window.Event("input"));
  check("no-match search shows an explicit empty row",
    doc.querySelector("#cplFundTable tbody").textContent.indexOf("No colleges match") !== -1);
}

// C1b — PR-A editable content (Sam, 2026-07-23): priority TITLE + STRATEGIES
// (both YEAR-SPECIFIC), the TIMING milestone list, and the editable eligibility
// INTRO. Locked mode → edits land in the active per-browser scenario override.
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;

  // #1 — priority titles default Access / Success / Capacity (Year 1 shown).
  const titleInputs = doc.querySelectorAll('.cplfund-prio .p input[data-edit="prio-title"]');
  check("each priority box has an editable title input", titleInputs.length === 3);
  check("priority titles default to Access / Success / Capacity",
    titleInputs[0].value === "Access" && titleInputs[1].value === "Success" && titleInputs[2].value === "Capacity");
  commit(window, titleInputs[0], "Access & Onboarding");
  check("editing a priority title persists to the active Year-1 slot",
    !!(T._getScenario().yearPriorities && T._getScenario().yearPriorities["1"] &&
       T._getScenario().yearPriorities["1"]["0"] &&
       T._getScenario().yearPriorities["1"]["0"].title === "Access & Onboarding"));

  // #2 — recommended strategies: empty by default; add, edit, delete (Year 1).
  check("Recommended strategies header + Add button per priority box",
    doc.querySelectorAll(".cplfund-strat-h").length === 3 && doc.querySelectorAll("[data-stratadd]").length === 3);
  check("no strategies by default", doc.querySelectorAll('.cplfund-strat input[data-edit="strategy"]').length === 0);
  click(window, doc.querySelector('[data-stratadd="1:0"]'));
  const stratInput = doc.querySelector('.cplfund-strat input[data-edit="strategy"]');
  check("＋ Add strategy adds an editable strategy row", !!stratInput);
  commit(window, stratInput, "Embed CPL in onboarding");
  check("editing a strategy persists to the active Year-1 slot",
    !!(T._getScenario().yearPriorities["1"]["0"].strategies &&
       T._getScenario().yearPriorities["1"]["0"].strategies[0] === "Embed CPL in onboarding"));
  click(window, doc.querySelector('[data-stratdel="1:0:0"]'));
  check("✕ deletes the strategy row", doc.querySelectorAll('.cplfund-strat input[data-edit="strategy"]').length === 0);

  // #3 — timing: 9 seeded milestones, last undated (italic), add/delete.
  const timingRows = doc.querySelectorAll(".cplfund-timing-row");
  check("Timing renders the 9 seeded milestones", timingRows.length === 9);
  check("first milestone = Funding Model Finalized · Aug 2026",
    doc.querySelector('.cplfund-timing-row input[data-edit="timing-label"]').value === "Funding Model Finalized" &&
    doc.querySelector('.cplfund-timing-row input[data-edit="timing-date"]').value === "Aug 2026");
  check("Potential Year 3 milestone is undated (italic .nodate)",
    timingRows[8].classList.contains("nodate") &&
    timingRows[8].querySelector('input[data-edit="timing-label"]').value.indexOf("Potential Year 3") !== -1);
  commit(window, doc.querySelectorAll('.cplfund-timing-row input[data-edit="timing-date"]')[0], "Sep 2026");
  check("editing a timing date persists", T._getScenario().timing && T._getScenario().timing[0].date === "Sep 2026");
  click(window, doc.getElementById("cplFundTimingAdd"));
  check("＋ Add item appends a timing row", doc.querySelectorAll(".cplfund-timing-row").length === 10);
  click(window, doc.querySelector('[data-timingdel="0"]'));
  check("✕ removes a timing row", doc.querySelectorAll(".cplfund-timing-row").length === 9);

  // #4 — baseline eligibility intro is editable.
  const introEl = doc.querySelector('.cplfund-elig-intro [data-edit="elig-intro"]');
  check("eligibility intro is an editable field with the default sentence",
    !!introEl && introEl.value.indexOf("Proposed baseline requirements to qualify") !== -1);
  commit(window, introEl, "Colleges must meet these to receive funding:");
  check("editing the eligibility intro persists", T._getScenario().eligIntro === "Colleges must meet these to receive funding:");

  // Year-specific: Year 2's P1 title is independent of the Year-1 edit above.
  click(window, doc.querySelector('#cplFundYear button[data-val="2"]'));
  check("Year-2 priority title is independent (still the default)",
    doc.querySelectorAll('.cplfund-prio .p input[data-edit="prio-title"]')[0].value === "Access");
}

// C1c — PR-B editable / add / delete funding pool boxes (Sam, 2026-07-23). Net =
// Σrevenue − Σdeduction − carve-outs; add/hide/delete are guarded by confirm().
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const P = D.pool;

  // Conservation: with NO custom boxes and nothing hidden, netCollege equals the
  // baked one_time − admin − scaling − feeder − rural formula (the 2025-26 remaining
  // is NOT a revenue source of the $35M model — Sam, 2026-07-29).
  const bakedNet = P.one_time_2026_27 - P.admin_cost -
    P.scaling_projects_tech - P.feeder_carveout - P.rural_carveout;
  check("net college funding matches the baked formula (conservation)", Math.round(T._netCollege()) === Math.round(bakedNet));
  const gross = P.one_time_2026_27;
  check("Total Available Funding card carries the single revenue source ($35M one-time)",
    doc.querySelector(".cplfund-card.total .v").innerHTML.indexOf(Math.round(gross).toLocaleString("en-US")) !== -1);

  // Editable label persists (the one-time appropriation box; the 2025-26 remaining
  // box is no longer a revenue source of this model).
  const otLabel = doc.querySelector('.cplfund-card input[data-edit="pool-label"][data-field="one_time_2026_27"]');
  check("each core pool box has an editable label", !!otLabel);
  commit(window, otLabel, "AB 123 one-time (2026-27)");
  check("editing a pool label persists",
    !!(T._getScenario().poolLabels && T._getScenario().poolLabels.one_time_2026_27 === "AB 123 one-time (2026-27)"));

  // Add a revenue box → net rises by its amount; it flows into Total Available too.
  const netBefore = T._netCollege();
  click(window, doc.querySelector('[data-pooladd="revenue"]'));
  const custAmt = doc.querySelector('.cplfund-card.custom input[data-edit="pool-custom-amt"]');
  check("＋ Add revenue source adds a custom box", !!custAmt);
  commit(window, custAmt, "500000");
  check("custom revenue raises net college funding by its amount",
    Math.round(T._netCollege()) === Math.round(netBefore + 500000));
  check("custom revenue is included in Total Available Funds",
    doc.querySelector(".cplfund-card.total .v").textContent.indexOf("$" + Math.round(gross + 500000).toLocaleString("en-US")) !== -1);

  // Flip the custom box to a deduction → it now SUBTRACTS.
  click(window, doc.querySelector('[data-poolkind="0"]'));
  check("flipping a custom box to a deduction subtracts it", Math.round(T._netCollege()) === Math.round(netBefore - 500000));

  // Delete the custom box (confirm stubbed true) → back to baseline.
  window.confirm = function () { return true; };
  click(window, doc.querySelector('[data-pooldel="0"]'));
  check("deleting a custom box restores the net", Math.round(T._netCollege()) === Math.round(netBefore));
  check("delete removed the custom box", !doc.querySelector(".cplfund-card.custom"));

  // Delete is guarded by confirm() — declining keeps the box.
  click(window, doc.querySelector('[data-pooladd="deduction"]'));
  window.confirm = function () { return false; };
  click(window, doc.querySelector('[data-pooldel="0"]'));
  check("declining the delete confirmation keeps the box", !!doc.querySelector(".cplfund-card.custom"));
  window.confirm = function () { return true; };
  click(window, doc.querySelector('[data-pooldel="0"]'));   // clean up

  // Hide a core deduction → excluded from the math; restore chip brings it back.
  const netBaseline = T._netCollege();
  click(window, doc.querySelector('[data-poolhide="admin_cost"]'));
  check("hiding the admin deduction raises net by admin_cost", Math.round(T._netCollege()) === Math.round(netBaseline + P.admin_cost));
  check("hidden box shows a restore chip", !!doc.querySelector('[data-poolshow="admin_cost"]'));
  click(window, doc.querySelector('[data-poolshow="admin_cost"]'));
  check("restoring the box returns the net", Math.round(T._netCollege()) === Math.round(netBaseline));

  // Carve-outs + computed boxes are NOT deletable.
  check("feeder carve-out has no delete ✕ (structural)", !doc.querySelector(".cplfund-card.feeder .cplfund-card-x"));
  check("net hero has no delete ✕ (computed)", !doc.querySelector(".cplfund-card.hero .cplfund-card-x"));
}

// C2 — 2-year window + year selector + the tranche math.
{
  const { window } = freshDom();
  const doc = boot(window);
  check("two year dropdowns (2-year window)", doc.querySelectorAll('select[data-edit="year"]').length === 2);
  // Sam, 2026-08-04: the hero is now the INSTITUTION total — the college pool (incl.
  // the folded rural allowance) PLUS the $1M noncredit feeder carve-out = the
  // amendment's $25,240,308. The note still breaks out the main pool + rural + NC.
  const net = D.pool.college_funding_before_feeder - D.pool.feeder_carveout;       // college pool (main+rural)
  const inst = D.pool.college_funding_before_feeder;                               // + feeder = institution total
  const mainNet = net - D.pool.rural_carveout;                                     // main proportional pool
  const perYear = net / 2;                                                         // college per-year tranche
  check("hero = the institution total incl. the noncredit feeder carve-out ($" + inst.toLocaleString() + ")",
    doc.querySelector(".cplfund-card.hero .v").textContent.indexOf("$" + inst.toLocaleString("en-US")) !== -1);
  check("hero label states 2 annual tranches of the per-year amount ($" + Math.round(perYear).toLocaleString() + ")",
    doc.querySelector(".cplfund-card.hero .l").textContent.indexOf("$" + Math.round(perYear).toLocaleString("en-US")) !== -1);
  check("hero note breaks out the main proportional pool + the rural allowance",
    doc.querySelector(".cplfund-card.hero .l").textContent.indexOf("$" + mainNet.toLocaleString("en-US")) !== -1 &&
    /Rural College allowance/.test(doc.querySelector(".cplfund-card.hero .l").textContent));

  // Change Year 2 to 2028-29 → the window widens in the labels; still 2 years.
  const y2 = doc.querySelectorAll('select[data-edit="year"]')[1];
  commit(window, y2, "2028-29");
  check("changing a year updates the window label",
    doc.querySelector(".cplfund-card.hero .l").textContent.indexOf("2028-29") !== -1);
  check("still a 2-year window (per-year unchanged)",
    doc.querySelector(".cplfund-card.hero .l").textContent.indexOf("$" + Math.round(perYear).toLocaleString("en-US")) !== -1);
  check("year change persisted to the local scenario",
    !!scenSlot(window));
}

// C3 — year filter: switches priority metrics (and the college P1/P2/P3 columns
// reflect the active year).
{
  const { window } = freshDom();
  const doc = boot(window);
  check("year filter has one button per selected year", doc.querySelectorAll("#cplFundYear button").length === 2);
  const m1 = doc.querySelector('[data-edit="metric"][data-slot="1"][data-idx="0"]');
  check("year 1 shows the year-1 P1 metric", m1 && m1.value === "Headcount of students eligible for at least one course offered through CPL");
  // switch to Year 2.
  click(window, doc.querySelector('#cplFundYear button[data-val="2"]'));
  const m2 = doc.querySelector('[data-edit="metric"][data-slot="2"][data-idx="0"]');
  check("year 2 shows the year-2 P1 metric", m2 && m2.value === "Units of Transcribed CPL");
  check("metric label names the active year", doc.querySelector(".cplfund-prio .p .metric").textContent.indexOf("Year 2") !== -1);
  // default shares equal both years → the college TOTAL column is unchanged.
  const totalY2 = doc.querySelector("#cplFundTable tbody tr td.tot").textContent;
  click(window, doc.querySelector('#cplFundYear button[data-val="1"]'));
  const totalY1 = doc.querySelector("#cplFundTable tbody tr td.tot").textContent;
  check("college TOTAL is stable across years at default shares", totalY1 === totalY2);
}

// C3b — priority description + metric are 2-row textareas so long text wraps
// (Sam, 2026-07-20: "2 rows high … keep it visually consistent").
{
  const { window } = freshDom();
  const doc = boot(window);
  const desc = doc.querySelector('textarea[data-edit="description"][data-slot="1"][data-idx="0"]');
  const metric = doc.querySelector('textarea[data-edit="metric"][data-slot="1"][data-idx="0"]');
  check("priority description is a 2-row textarea",
    desc && desc.tagName === "TEXTAREA" && desc.getAttribute("rows") === "2");
  check("priority metric is a 2-row textarea",
    metric && metric.tagName === "TEXTAREA" && metric.getAttribute("rows") === "2");
  check("priority textareas carry the multi-line style class",
    desc.className.indexOf("cplfund-ed-area") !== -1 && metric.className.indexOf("cplfund-ed-area") !== -1);
  check("the textarea shows the baked value (from its text content, not a value attr)",
    metric.value === "Headcount of students eligible for at least one course offered through CPL");
  // Editing the textarea still commits on change, exactly like the old input.
  commit(window, metric, "Wrapped metric text");
  check("editing a metric textarea persists to the scenario",
    scenSlot(window).yearPriorities["1"][0].metric === "Wrapped metric text");
  check("the edited textarea re-renders with the new value",
    doc.querySelector('textarea[data-edit="metric"][data-slot="1"][data-idx="0"]').value === "Wrapped metric text");
  const css = doc.getElementById("cpl-funding-css").textContent;
  check("ed-area CSS is a block textarea that wraps (display:block + line-height)",
    /cplfund-ed-area \{[^}]*display: block/.test(css) && /cplfund-ed-area \{[^}]*line-height/.test(css));
}

// C4 — noncredit feeder carve-out: pool split + editable headcounts + carve-out
// flows through to the college tranche.
{
  const { window } = freshDom();
  const doc = boot(window);
  const feederTable = doc.querySelectorAll(".cplfund-table")[1];
  // 2026-08-06: the $1M split moved off HEADCOUNT onto NONCREDIT FTES via the
  // feederBasis() seam — the like-for-like counterpart of the colleges'
  // credit-FTES basis, and the only remaining place headcount converted to
  // dollars. Headcount also mixed vintages here (NOCE/SD 2025-26 vs Mt. SAC NC
  // and Calbright 2022-23) while every noncredit_ftes is 2025-26.
  const fBasis = function (f) {
    const ph = Number(f.noncredit_ftes_placeholder);
    return (isFinite(ph) && ph > 0) ? ph : (Number(f.noncredit_ftes) || 0);
  };
  const totalBasis = D.feeders.reduce(function (s, f) { return s + fBasis(f); }, 0);
  const perYearPool = D.pool.feeder_carveout / 2;
  check("feeder pool per year = carve-out ÷ years ($" + Math.round(perYearPool).toLocaleString() + ")",
    feederTable.querySelector("tfoot").textContent.indexOf("$" + Math.round(perYearPool).toLocaleString("en-US")) !== -1);
  const noce = D.feeders.filter(function (f) { return f.short === "NOCE"; })[0];
  const noceAlloc = Math.round((fBasis(noce) / totalBasis) * perYearPool);
  const noceRow = Array.from(feederTable.querySelectorAll("tbody tr")).find(function (tr) {
    return tr.textContent.indexOf("North Orange") !== -1;
  });
  check("NOCE gets its noncredit-FTES share of the feeder pool",
    noceRow.textContent.indexOf("$" + noceAlloc.toLocaleString("en-US")) !== -1);
  // Guard the TRANSITION, not just the new arithmetic: assert the old headcount
  // split is gone, since the two bases would otherwise agree by coincidence.
  const totalHc = D.feeders.reduce(function (s, f) { return s + f.headcount; }, 0);
  const noceHcAlloc = Math.round((noce.headcount / totalHc) * perYearPool);
  check("the feeder split is no longer headcount-denominated",
    noceHcAlloc !== noceAlloc &&
    noceRow.textContent.indexOf("$" + noceHcAlloc.toLocaleString("en-US")) === -1);

  // Calbright carries a PLACEHOLDER noncredit FTES. Its reported 21,438.17 over
  // 2,484 headcount is 8.63 FTES/student — impossible (a full-time year is ~1.0),
  // and on the raw figure it would take 47% of the $1M as the SMALLEST campus.
  // The placeholder must drive the split, the reported figure must survive in the
  // data, and the row must be chipped so a stand-in is never read as reported.
  const cal = D.feeders.filter(function (f) { return f.short === "Calbright"; })[0];
  check("Calbright keeps its REPORTED noncredit FTES alongside the placeholder",
    cal.noncredit_ftes === 21438.17 && cal.noncredit_ftes_placeholder === 1000);
  check("the placeholder, not the reported figure, drives the split", fBasis(cal) === 1000);
  check("the placeholder records WHY it exists (a bare number would become fact)",
    typeof cal.noncredit_ftes_placeholder_basis === "string" &&
    cal.noncredit_ftes_placeholder_basis.length > 40);
  const calRow = Array.from(feederTable.querySelectorAll("tbody tr")).find(function (tr) {
    return tr.textContent.indexOf("Calbright") !== -1;
  });
  check("Calbright's row carries a placeholder chip that explains itself",
    !!calRow.querySelector(".cplfund-ph") &&
    /PLACEHOLDER/.test(calRow.querySelector(".cplfund-ph").getAttribute("title") || ""));
  check("a placeholder in play is disclosed in the section footer, not only the chip",
    /placeholder/i.test(doc.querySelector(".cplfund").textContent));
  check("the raw reported figure never reaches the split",
    calRow.textContent.indexOf("21,438") === -1);

  // Editing a feeder's FTES re-splits the pool, drops "est.", and RETIRES the
  // placeholder — otherwise the stand-in keeps beating the curator's own number.
  const ftesInput = noceRow.querySelector('input[data-edit="feeder-ftes"]');
  commit(window, ftesInput, "4000");
  const feederTable2 = doc.querySelectorAll(".cplfund-table")[1];
  const noceRow2 = Array.from(feederTable2.querySelectorAll("tbody tr")).find(function (tr) {
    return tr.textContent.indexOf("North Orange") !== -1;
  });
  check("editing NOCE noncredit FTES clears its est. flag", noceRow2.querySelector(".cplfund-est") === null);
  check("feeder FTES edit persisted to the scenario",
    scenSlot(window).feeders[0].noncredit_ftes === 4000);

  // Sam, 2026-08-04: the hero is now the INSTITUTION total (colleges + NC feeders),
  // so raising the feeder carve-out does NOT change it — the money just moves from the
  // college pool into the NC feeder line, both inside the total. The institution total
  // holds; the college pool shrinks by the increase.
  const carveInput = doc.querySelector('input[data-edit="pool"][data-field="feeder_carveout"]');
  commit(window, carveInput, "2,000,000");
  const inst2 = D.pool.college_funding_before_feeder;   // colleges + NC = invariant to the feeder split
  check("raising the feeder carve-out leaves the institution-total hero unchanged",
    doc.querySelector(".cplfund-card.hero .v").textContent.indexOf("$" + inst2.toLocaleString("en-US")) !== -1);
  check("raising the feeder carve-out moves that money out of the college pool",
    Math.round(window.CPL_FUNDING_TAB._netCollege()) ===
      Math.round(D.pool.college_funding_before_feeder - 2000000 - D.pool.rural_carveout));
  check("the hero note carries the $2,000,000 noncredit feeder line",
    doc.querySelector(".cplfund-card.hero .l").textContent.indexOf("$2,000,000") !== -1);
}

// C5 — editable priority text + shares (scenario mode) + reset.
{
  const { window } = freshDom();
  const doc = boot(window);
  // Edit P1 metric text.
  const metric = doc.querySelector('[data-edit="metric"][data-slot="1"][data-idx="0"]');
  commit(window, metric, "Custom metric text");
  const scen = scenSlot(window);
  check("editing a metric persists to the scenario", scen.yearPriorities["1"][0].metric === "Custom metric text");
  check("the edited metric re-renders",
    doc.querySelector('[data-edit="metric"][data-slot="1"][data-idx="0"]').value === "Custom metric text");

  // Edit P1 share 30% → 60% ⇒ shares sum 130% ⇒ formula warns. (The duplicate
  // "% of each tranche" header chip was dropped Sam 2026-07-23; the editable
  // Allocation-share input carries the value now.)
  commit(window, doc.querySelector('input[data-edit="share"][data-slot="1"][data-idx="0"]'), "60");
  check("priority allocation-share input recomputes to 60% after the edit",
    doc.querySelector('input[data-edit="share"][data-slot="1"][data-idx="0"]').value === "60");
  check("formula warns when the year's shares no longer sum to 100%",
    (doc.querySelector(".cplfund-formula .cplfund-warn-text") || { textContent: "" }).textContent.indexOf("130") !== -1);

  // Per-student rate sets the student target, moves NO dollars (Sam, 2026-07-27).
  commit(window, doc.querySelector('input[data-edit="share"][data-slot="1"][data-idx="0"]'), "30");
  const totalBefore = doc.querySelector("#cplFundTable tbody tr td.tot").textContent;
  commit(window, doc.querySelector('input[data-edit="perstudent"][data-slot="1"][data-idx="0"]'), "75");
  check("per-student edit moves NO dollars (first-row total unchanged)",
    doc.querySelector("#cplFundTable tbody tr td.tot").textContent === totalBefore);

  // Scenario status + reset.
  check("auth bar shows the local-scenario mode when edited (named slot)",
    doc.querySelector(".cplfund-authbar .mode.scenario").textContent.indexOf("Scenario 1") !== -1);
  click(window, doc.getElementById("cplFundReset"));
  check("reset clears the scenario (localStorage slot gone)", !scenSlot(window));
  check("reset restores the baked P1 metric",
    doc.querySelector('[data-edit="metric"][data-slot="1"][data-idx="0"]').value === "Headcount of students eligible for at least one course offered through CPL");
}

// C6 — config layers: baked ⊕ shared ⊕ scenario resolution.
{
  const { window } = freshDom();
  const doc = boot(window);
  // Inject a shared config (as if fetched from Supabase). Anonymous viewers see it.
  window.CPL_FUNDING_TAB._setShared({ yearPriorities: { "1": { "0": { metric: "SHARED metric" } } } });
  window.CPL_FUNDING_TAB.render();
  check("shared config overrides the baked default",
    doc.querySelector('[data-edit="metric"][data-slot="1"][data-idx="0"]').value === "SHARED metric");
  // A local scenario shadows the shared value.
  commit(window, doc.querySelector('[data-edit="metric"][data-slot="1"][data-idx="0"]'), "SCENARIO metric");
  check("scenario shadows shared",
    doc.querySelector('[data-edit="metric"][data-slot="1"][data-idx="0"]').value === "SCENARIO metric");
  check("scenario edit did NOT touch the shared config",
    window.CPL_FUNDING_TAB._getShared().yearPriorities["1"]["0"].metric === "SHARED metric");
}

// C7 — team-phrase (shared) editing: when unlocked, edits go to the SHARED store
// and reset clears it (not the scenario). Mock CPL_TEAM_PHRASE with a session.
{
  const { window } = freshDom();
  window.CPL_TEAM_PHRASE = {
    _pass: "x",
    session: function () { return this._pass ? { teamPass: this._pass, email: "(team)" } : null; },
    clear: function () { this._pass = null; },
    decorateHeaders: function (h) { return h; },
    checkWrite: function (r) { return Promise.resolve({ ok: true, status: 200 }); },
    handleWriteFailure: function () { return false; },
    unlockRow: function () { return window.document.createElement("span"); }
  };
  const doc = boot(window);
  check("auth bar shows team-editing-on when unlocked",
    doc.querySelector(".cplfund-authbar .mode.shared") &&
    doc.querySelector(".cplfund-authbar .mode.shared").textContent.indexOf("Team editing on") !== -1);
  // Edit the visible (Year-1) P1 metric → it lands in SHARED (not the scenario).
  commit(window, doc.querySelector('[data-edit="metric"][data-slot="1"][data-idx="0"]'), "TEAM edit");
  check("unlocked edit writes to the SHARED store",
    window.CPL_FUNDING_TAB._getShared().yearPriorities["1"]["0"].metric === "TEAM edit");
  check("unlocked edit did NOT write a local scenario", !scenSlot(window));
  // Reset clears the shared config, not a scenario.
  click(window, doc.getElementById("cplFundReset"));
  check("reset (unlocked) clears the shared config",
    Object.keys(window.CPL_FUNDING_TAB._getShared()).length === 0);
  // Lock returns to anonymous scenario mode.
  click(window, doc.getElementById("cplFundLock"));
  check("lock returns to the anonymous scenario mode",
    !!doc.querySelector(".cplfund-authbar .mode.scenario"));
}

// C7b — a local scenario is PROMOTED into the shared config on unlock
// ("what you were exploring becomes the team's model").
{
  const { window } = freshDom();
  const mock = {
    _pass: null,
    session: function () { return this._pass ? { teamPass: this._pass } : null; },
    clear: function () { this._pass = null; },
    decorateHeaders: function (h) { return h; },
    checkWrite: function () { return Promise.resolve({ ok: true, status: 200 }); },
    handleWriteFailure: function () { return false; },
    unlockRow: function (opts) {
      const b = window.document.createElement("button");
      b.className = "mock-unlock";
      const self = this;
      b.addEventListener("click", function () { self._pass = "x"; opts.onUnlocked(self.session()); });
      return b;
    }
  };
  window.CPL_TEAM_PHRASE = mock;
  const doc = boot(window);   // locked (no pass) → scenario mode
  commit(window, doc.querySelector('[data-edit="metric"][data-slot="1"][data-idx="0"]'), "explored metric");
  check("locked edit is a local scenario", !!scenSlot(window));
  // Unlock → the scenario promotes into SHARED and clears.
  click(window, doc.querySelector(".mock-unlock"));
  check("unlock promotes the scenario into the shared config",
    window.CPL_FUNDING_TAB._getShared().yearPriorities["1"]["0"].metric === "explored metric");
  check("unlock clears the local scenario after promotion", !scenSlot(window));
  check("promoted model still renders the edited value",
    doc.querySelector('[data-edit="metric"][data-slot="1"][data-idx="0"]').value === "explored metric");
  delete window.CPL_TEAM_PHRASE;
}

finish();
