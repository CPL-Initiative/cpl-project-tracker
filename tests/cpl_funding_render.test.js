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
    // Placeholder-aware, matching feederBasis(): a campus whose reported figure
    // is not yet trustworthy contributes its PLACEHOLDER. Summing the raw
    // reported values would silently re-admit the number the placeholder exists
    // to keep out of the model.
    const basisOf = function (f) {
      const ph = Number(f.noncredit_ftes_placeholder);
      return (isFinite(ph) && ph > 0) ? ph : (Number(f.noncredit_ftes) || 0);
    };
    // The STANDALONE roster only — what this card used to print as the whole of
    // noncredit. It is now the wrong number: 108 college rows carry noncredit
    // FTES of their own, so the old figure understated system noncredit by
    // ~57,000 FTES on a card whose entire job is to state the CCC total.
    const standaloneOnly = D.feeders.reduce(function (s, f) { return s + basisOf(f); }, 0);
    const allNoncredit = D.colleges.reduce(function (s, c) { return s + (c.noncredit_ftes || 0); }, 0) +
      D.feeders.filter(function (f) { return !f.nc_ftes_on_credit_row; }).reduce(function (s, f) { return s + basisOf(f); }, 0);
    const collegeFtes = D.colleges.reduce(function (s, c) { return s + (c.credit_ftes || 0); }, 0);
    const combined = Math.round(collegeFtes + allNoncredit);
    const card = Array.from(doc.querySelectorAll(".cplfund-card .l"))
      .find(function (l) { return l.textContent.indexOf("CCC total") !== -1; });
    check("basis card names the ACTIVE basis, not a hardcoded 'headcount'",
      card && /credit FTES \(allocation basis\)/.test(card.textContent));
    check("basis card counts ALL noncredit FTES, not just the standalone roster",
      card && card.textContent.indexOf(Math.round(allNoncredit).toLocaleString("en-US")) !== -1 &&
      card.textContent.indexOf(combined.toLocaleString("en-US")) !== -1);
    check("basis card no longer prints the standalone-only figure as the noncredit total",
      card && Math.round(standaloneOnly) !== Math.round(allNoncredit) &&
      card.textContent.indexOf(Math.round(standaloneOnly).toLocaleString("en-US")) === -1);
    check("basis card does NOT pair credit FTES with feeder HEADCOUNT",
      card && card.textContent.indexOf(
        D.feeders.reduce(function (s, f) { return s + f.headcount; }, 0).toLocaleString("en-US")) === -1);

    // The parity card Sam asked for: noncredit's share of the teaching against
    // its share of the money. Both sides must be FTES — a share computed with
    // headcount on one side is not a share of anything.
    const parity = Array.from(doc.querySelectorAll(".cplfund-card"))
      .find(function (c) { return /share of the/i.test(c.textContent) && /teaching/i.test(c.textContent); });
    check("a noncredit parity card states teaching share vs money share",
      !!parity && /7\.1%/.test(parity.textContent) && /4\.0% of the money/.test(parity.textContent));
    check("...and names what parity would cost, as a choice rather than a formula",
      !!parity && /\$1,797,660/.test(parity.textContent) && /policy choice, not a formula/.test(parity.textContent));
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
  // Two tables since the Rural section was retired (2026-08-22): colleges + the
  // noncredit feeder campuses.
  check("two tables: college + noncredit feeder", tables.length === 2);
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
    // The award range gained a SECOND LANE ROW (2026-08-28): credit, then the
    // noncredit carve-out. Assert PER ROW rather than counting cards globally —
    // a bare count would have to be bumped 3 -> 6 and would then pass for a
    // layout that lost the Minimum from one row and doubled the Maximum in the
    // other. What this guards is that each lane states all three bounds.
    const awardRows = Array.from(doc.querySelectorAll(".cplfund-awardrow"));
    const rowStatesAllThree = (row) => {
      const cards = Array.from(row.querySelectorAll(".cplfund-card.award"));
      return cards.length === 3 &&
        cards.some(function (c) { return c.textContent.indexOf("Minimum award") !== -1; }) &&
        cards.some(function (c) { return c.textContent.indexOf("Average award") !== -1; }) &&
        cards.some(function (c) { return c.textContent.indexOf("Maximum award") !== -1; });
    };
    check("Award range states Minimum / Average / Maximum in each lane row",
      awardRows.length === 2 && awardRows.every(rowStatesAllThree));
    // ⚠️ The two lanes are solved separately and never summed (Sam). A single
    // undifferentiated row is the shape this must never regress to.
    check("Award range separates the credit and noncredit lanes",
      awardRows.length === 2 &&
      /^Credit/.test(awardRows[0].textContent.replace(/\s+/g, " ").trim()) &&
      /^Noncredit/.test(awardRows[1].textContent.replace(/\s+/g, " ").trim()));
    // The three assertions below are CREDIT-lane facts (Σ college totals ÷ N,
    // the floored-college count), so they read the credit row's cards. Before
    // the noncredit row existed this was the only row and a bare document-wide
    // query meant the same thing; it no longer does.
    const awardCards = Array.from(awardRows[0].querySelectorAll(".cplfund-card.award"));
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
    // ⚠️ The noncredit row must be the NONCREDIT lane's own arithmetic, not a
    // slice of the credit one. Its average is the carve-out over the funded
    // roster — a figure the credit lane cannot produce.
    {
      const ncCards = Array.from(awardRows[1].querySelectorAll(".cplfund-card.award"));
      const nc = window.CPL_FUNDING_TAB._ncModel();
      const ncAvg = nc.rows.reduce(function (s2, r) { return s2 + (nc.W[r.key] || 0); }, 0) / nc.rows.length;
      check("Noncredit average award = the carve-out over the funded NC roster",
        ncCards[1].querySelector(".v").textContent
          .indexOf("$" + Math.round(ncAvg).toLocaleString("en-US")) !== -1);
      check("Noncredit minimum is the NONCREDIT floor, never the credit one",
        ncCards[0].querySelector(".v").textContent
          .indexOf("$" + Math.round(nc.floor).toLocaleString("en-US")) !== -1 &&
        Math.round(nc.floor) !== Math.round(window.CPL_FUNDING_TAB._model().floor));
    }
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
  // The largest college no longer has a UNIQUE largest total: Sam's $400K
  // maximum (2026-08-22) holds the six largest colleges at the same figure, so
  // "the largest college sorts first" is a coin-toss between six tied rows.
  // Assert what the sort actually promises — the first row carries the maximum
  // total — and, separately, that the largest college on the allocation basis
  // is one of the rows holding it.
  const T = window.CPL_FUNDING_TAB;
  const totals = D.colleges.map(function (c) { return T._alloc(c.college).total; });
  const maxTotal = Math.max.apply(null, totals);
  const atMax = D.colleges.filter(function (c) {
    return Math.abs(T._alloc(c.college).total - maxTotal) < 0.5;
  }).map(function (c) { return c.college; });
  check("sort by Total desc puts a maximum-total college first",
    atMax.some(function (n) { return firstRow.textContent.indexOf(n) !== -1; }));
  const biggest = D.colleges.reduce(function (a, b) {
    return (a.credit_ftes || 0) >= (b.credit_ftes || 0) ? a : b;
  }).college;
  check("the largest college on the allocation basis holds the maximum total",
    atMax.indexOf(biggest) !== -1);

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
  // baked one_time − admin − scaling − feeder formula (the 2025-26 remaining is
  // NOT a revenue source of the $35M model — Sam, 2026-07-29; the rural term
  // came out when the carve-out was retired, 2026-08-22).
  const bakedNet = P.one_time_2026_27 - P.admin_cost -
    P.scaling_projects_tech - P.feeder_carveout;
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
  // PLUS the $1M noncredit feeder carve-out = the amendment's $25,240,308. The
  // note breaks out the college pool + NC (the rural line went with the
  // carve-out, 2026-08-22).
  const net = D.pool.college_funding_before_feeder - D.pool.feeder_carveout;       // the college pool
  const inst = D.pool.college_funding_before_feeder;                               // + feeder = institution total
  const mainNet = net;
  const perYear = net / 2;                                                         // college per-year tranche
  check("hero = the institution total incl. the noncredit feeder carve-out ($" + inst.toLocaleString() + ")",
    doc.querySelector(".cplfund-card.hero .v").textContent.indexOf("$" + inst.toLocaleString("en-US")) !== -1);
  check("hero label states 2 annual tranches of the per-year amount ($" + Math.round(perYear).toLocaleString() + ")",
    doc.querySelector(".cplfund-card.hero .l").textContent.indexOf("$" + Math.round(perYear).toLocaleString("en-US")) !== -1);
  // The note breaks the institution total into its two lanes. Asserted on the
  // FIGURES and on the lane it names, not on a fixed phrase: this check used to
  // require the words "noncredit feeder support", which survived the sentence
  // being wrong. It said the carve-out went "to the 4 NC campuses below" long
  // after the lane became 33 institutions — a card a reader uses to judge
  // whether the carve-out is proportionate (2026-08-23).
  {
    const noteEl = doc.querySelector(".cplfund-card.hero .l");
    const note = noteEl ? noteEl.textContent : "";
    const laneN = window.CPL_FUNDING_TAB._ncModel().rows.length;
    check("hero note breaks out the college pool + the noncredit carve-out",
      note.indexOf("$" + mainNet.toLocaleString("en-US")) !== -1 &&
      note.indexOf("$" + D.pool.feeder_carveout.toLocaleString("en-US")) !== -1 &&
      /noncredit/i.test(note) &&
      !/Rural College allowance/.test(note));
    check("...and sizes the noncredit lane correctly (" + laneN + " institutions), " +
          "not by the standalone roster (" + D.feeders.length + ")",
      note.indexOf(laneN + " institutions") !== -1 &&
      !new RegExp("\\b" + D.feeders.length + " NC campuses\\b").test(note));
  }

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

// C4 — the NONCREDIT lane (Sam, 2026-08-23). Was a flat FTES split of the $1M
// among 4 feeder campuses; is now the same bounded allocation the credit pool
// uses, over every institution clearing an editable FTES threshold. The three
// dials, the dedup, the placeholder guards and the carve-out's effect on the
// college pool.
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const m = T._ncModel();
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

  // ── the lane itself ────────────────────────────────────────────────────
  check("the lane spans colleges AND standalone institutions, not just feeders",
    m.rows.length === 33 &&
    m.rows.filter((r) => r.kind === "college").length === 30 &&
    m.rows.filter((r) => r.kind === "standalone").length === 3);
  check("the lane spends the carve-out exactly",
    Math.abs(Object.values(m.W).reduce((s, v) => s + v, 0) - D.pool.feeder_carveout) < 0.5);
  check("every award sits between the noncredit floor and ceiling",
    Object.values(m.W).every((w) => w >= m.floor - 0.5 && w <= m.cap + 0.5));
  check("the floor binds and the ceiling does not, at the shipped dials",
    m.floorCount === 27 && m.cappedCount === 0);
  // The reason Sam gave for the lane is that it "gives the smaller NC programs
  // an incentive to grow", so the model has to be able to say where growth
  // actually starts paying — a lane that is mostly floor is mostly not one.
  check("the model reports where growth starts paying", Math.round(m.breakEven) === 3022);

  // ── the three dials are real, editable pool fields ─────────────────────
  ["nc_threshold_ftes", "nc_floor_window", "nc_cap_window"].forEach(function (f) {
    check("dial " + f + " is an editable pool input",
      !!doc.querySelector('input[data-edit="pool"][data-field="' + f + '"]'));
  });
  const thrInput = doc.querySelector('input[data-edit="pool"][data-field="nc_threshold_ftes"]');
  commit(window, thrInput, "3000");
  const m2 = T._ncModel();
  check("raising the threshold narrows the lane (the dial actually moves money)",
    m2.threshold === 3000 && m2.rows.length === 7 && m2.rows.length < m.rows.length);
  check("a narrowed lane pays its remaining members MORE",
    (m2.W["Mt San Antonio"] || 0) > (m.W["Mt San Antonio"] || 0));
  // Narrowing far enough makes the pool UNSPENDABLE — 7 institutions cannot
  // absorb $1,000,000 under a $100,000 ceiling. The model must surface the
  // remainder rather than quietly stop balancing, and the box must say so: this
  // is the one way a curator can move a dial and strand real money.
  check("a lane too narrow to spend the pool reports the remainder, never swallows it",
    m2.cappedCount === 7 &&
    Math.round(Object.values(m2.W).reduce((s, v) => s + v, 0)) === 700000 &&
    Math.round(m2.unspent) === 300000);
  check("...and the box warns about it on screen",
    /cannot be spent/.test(doc.querySelector(".cplfund").textContent));
  commit(window, thrInput, "500");

  // ── a floor the pool cannot honor must SAY SO ──────────────────────────
  // Sam set the noncredit floor to $50,000 to see how it played out. 33 × $50,000
  // is $1,650,000 against a $1,000,000 pool, so the solver degrades to a pro-rata
  // split and every institution receives $30,303 — 61% of the stated minimum —
  // while the box said "33 at the minimum". A model that silently pays less than
  // the number printed on its own dial is the worst state this thing has.
  const floorInput = doc.querySelector('input[data-edit="pool"][data-field="nc_floor_window"]');
  commit(window, floorInput, "50000");
  const inf = T._ncModel();
  check("an unhonorable floor is FLAGGED, not silently absorbed",
    inf.floorInfeasible === true && Math.round(inf.floorDemanded) === 1650000);
  check("...and nobody actually receives the stated minimum",
    Object.values(inf.W).every((w) => w < inf.floor - 1) &&
    Math.round(Math.max.apply(null, Object.values(inf.W))) === 30303);
  const boxTxt = Array.from(doc.querySelectorAll(".cplfund-card.floor"))
    .map((e) => e.textContent).join(" ");
  check("...the box says the minimum is not being paid, and names the real figure",
    /the minimum is not being paid/.test(boxTxt) &&
    /minimum cannot be honored/.test(boxTxt) && /\$30,303/.test(boxTxt));
  check("...and drops the count and break-even, which are false in that state",
    !/33 at the minimum/.test(boxTxt) && !/growth starts paying/.test(boxTxt));
  commit(window, floorInput, "25000");
  check("lowering it back clears the warning",
    T._ncModel().floorInfeasible === false &&
    !/minimum cannot be honored/.test(Array.from(doc.querySelectorAll(".cplfund-card.floor"))
      .map((e) => e.textContent).join(" ")));

  check("restoring the threshold restores the full lane and spends the pool again",
    T._ncModel().rows.length === 33 &&
    Math.abs(Object.values(T._ncModel().W).reduce((s, v) => s + v, 0) - D.pool.feeder_carveout) < 0.5);
}

{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const m = T._ncModel();
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

  // ── integrated on the college row, and never inside the credit total ───
  const headers = Array.from(doc.querySelectorAll("#cplFundTable thead th")).map((h) => h.textContent.trim());
  check("the college table carries its own NC $ column", headers.some((h) => /^NC \$/.test(h)));
  const mtsac = Array.from(doc.querySelectorAll("tr.cplfund-row"))
    .find((tr) => tr.textContent.indexOf("Mt San Antonio") !== -1);
  check("a college's noncredit award renders on its own row",
    mtsac.textContent.indexOf(money(m.W["Mt San Antonio"])) !== -1);
  // Sam: "I want it on the surface the amount admin should give to NC so it
  // doesn't get lumped into the whole". The credit total must not move.
  check("the noncredit award is NOT added into the credit total",
    Math.round(T._alloc("Mt San Antonio").total) === Math.round(T._model().W["Mt San Antonio"]));
  const belowThreshold = Array.from(doc.querySelectorAll("tr.cplfund-row"))
    .find((tr) => tr.textContent.indexOf("Palomar") !== -1);
  check("an institution below the threshold says WHY it is empty, not just —",
    /below the .*threshold/.test(belowThreshold.innerHTML));

  // ── the standalone block replaced the feeder section ───────────────────
  const stand = doc.querySelectorAll(".cplfund-table")[1];
  check("the standalone table lists the institutions with no credit row",
    /North Orange/.test(stand.textContent) && /San Diego College of Continuing Education/.test(stand.textContent));
  check("the retired per-year feeder pool is gone (window totals, no FEEDER POOL tfoot)",
    stand.querySelector("tfoot") === null && !/FEEDER POOL/.test(stand.textContent));
  check("the SYSTEM row's NC total names the standalone remainder rather than claiming the whole pool",
    /standalone =/.test(doc.querySelector(".cplfund-systemrow").textContent));

  // ── the Mt. SAC dedup: excluded from the SIZE BASIS, not deleted ───────
  // Removing the row outright erased a real $50,000 ESS 25-82 grant. The FTES is
  // the duplicate, not the institution.
  check("Mt. SAC Noncredit is still an institution on the roster",
    D.feeders.some((f) => f.short === "Mt. SAC NC"));
  check("...but earns nothing in this lane, because its FTES is on the college row",
    (m.W["NC:Mt. SAC NC"] || 0) === 0 &&
    D.feeders.filter((f) => f.short === "Mt. SAC NC")[0].nc_ftes_on_credit_row === "Mt San Antonio");
  check("...and the table SAYS so rather than showing a bare zero",
    /counted on the Mt San Antonio row/.test(stand.textContent));
  check("...and it still receives its $50,000 seed grant in the distributions view",
    T._grantRecipients().filter((r) => r.name === "Mt. SAC NC").length === 1);

  // ── the placeholder guards, unchanged in substance ─────────────────────
  const cal = D.feeders.filter((f) => f.short === "Calbright")[0];
  check("Calbright keeps its REPORTED noncredit FTES alongside the placeholder",
    cal.noncredit_ftes === 21438.17 && cal.noncredit_ftes_placeholder === 1000);
  check("the placeholder, not the reported figure, drives the size basis",
    m.rows.filter((r) => r.short === "Calbright")[0].ftes === 1000);
  check("the placeholder records WHY it exists (a bare number would become fact)",
    typeof cal.noncredit_ftes_placeholder_basis === "string" &&
    cal.noncredit_ftes_placeholder_basis.length > 40);
  const calRow = Array.from(stand.querySelectorAll("tbody tr")).find((tr) => /Calbright/.test(tr.textContent));
  check("Calbright's row carries a placeholder chip that explains itself",
    !!calRow.querySelector(".cplfund-ph") &&
    /PLACEHOLDER/.test(calRow.querySelector(".cplfund-ph").getAttribute("title") || ""));
  check("the raw reported figure never reaches the split", calRow.textContent.indexOf("21,438") === -1);

  // ── the carve-out still moves money out of the college pool ────────────
  const carveInput = doc.querySelector('input[data-edit="pool"][data-field="feeder_carveout"]');
  commit(window, carveInput, "2,000,000");
  check("raising the noncredit carve-out leaves the institution-total hero unchanged",
    doc.querySelector(".cplfund-card.hero .v").textContent
      .indexOf(money(D.pool.college_funding_before_feeder)) !== -1);
  check("raising the noncredit carve-out moves that money out of the college pool",
    Math.round(window.CPL_FUNDING_TAB._netCollege()) ===
      Math.round(D.pool.college_funding_before_feeder - 2000000));
  check("...and the noncredit lane grows to spend it",
    Math.abs(Object.values(T._ncModel().W).reduce((s, v) => s + v, 0) - 2000000) < 0.5);
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

// ⚠️ C7 / C7b USED THE TEAM PHRASE, WHICH NO LONGER UNLOCKS THIS TAB
// (2026-08-28, Sam: "clean up the auth so it requires the magic link auth and
// not the team phrase"). The BEHAVIOR both blocks guard is unchanged — unlocked
// edits land in SHARED, and work explored while locked can become the team's
// model — so they are re-pointed at the credential and the control that now
// carry it, never deleted.
function reviewerSession(win, email) {
  return {
    _live: true,
    get: function () { return this._live ? { access_token: "header.payload.sig", email: email || "co@cccco.edu" } : null; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; },
    signOut: function () { this._live = false; }
  };
}

// C7 — signed-in (shared) editing: when unlocked, edits go to the SHARED store
// and reset clears it (not the scenario).
{
  const { window } = freshDom();
  const sess = reviewerSession(window);
  window.CPL_SESSION = sess;
  const doc = boot(window);
  check("auth bar shows signed-in when unlocked",
    !!doc.querySelector(".cplfund-authbar .mode.shared"));
  check("...and names the curator rather than a shared placeholder",
    doc.querySelector(".cplfund-authbar .mode.shared").textContent.indexOf("co@cccco.edu") !== -1);
  // Edit the visible (Year-1) P1 metric -> it lands in SHARED (not the scenario).
  commit(window, doc.querySelector('[data-edit="metric"][data-slot="1"][data-idx="0"]'), "TEAM edit");
  check("unlocked edit writes to the SHARED store",
    window.CPL_FUNDING_TAB._getShared().yearPriorities["1"]["0"].metric === "TEAM edit");
  check("unlocked edit did NOT write a local scenario", !scenSlot(window));
  // Reset clears the shared config, not a scenario.
  click(window, doc.getElementById("cplFundReset"));
  check("reset (unlocked) clears the shared config",
    Object.keys(window.CPL_FUNDING_TAB._getShared()).length === 0);
  // ⚠️ No Lock button any more — the credential is a whole-session sign-in ended
  // from the masthead, so losing it is what returns the tab to scenario mode.
  sess.signOut();
  window.CPL_FUNDING_TAB.render();
  check("losing the session returns the tab to the anonymous scenario mode",
    !!doc.querySelector(".cplfund-authbar .mode.scenario"));
  delete window.CPL_SESSION;
}

// C7b — a local scenario is PROMOTED into the shared config, now via the Publish
// button. ⚠️ This is the ONLY path left: the phrase unlock row that used to carry
// the promotion is gone, so a regression here strands a curator's work silently,
// which is exactly the bug #1371 fixed.
{
  const { window } = freshDom();
  const doc = boot(window);   // locked (no session) -> scenario mode
  commit(window, doc.querySelector('[data-edit="metric"][data-slot="1"][data-idx="0"]'), "explored metric");
  check("locked edit is a local scenario", !!scenSlot(window));
  // Sign in: the overlay is NOT promoted automatically on this path — it is
  // called out, with a control to publish it.
  window.CPL_SESSION = reviewerSession(window);
  window.CPL_FUNDING_TAB.render();
  const promote = doc.getElementById("cplFundPromote");
  check("signing in over a local overlay offers a publish control", !!promote);
  click(window, promote);
  check("publishing promotes the scenario into the shared config",
    window.CPL_FUNDING_TAB._getShared().yearPriorities["1"]["0"].metric === "explored metric");
  check("publishing clears the local scenario after promotion", !scenSlot(window));
  check("promoted model still renders the edited value",
    doc.querySelector('[data-edit="metric"][data-slot="1"][data-idx="0"]').value === "explored metric");
  delete window.CPL_SESSION;
}

finish();
