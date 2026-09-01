// CPL Implementation Funding tab — renderer behaviour, part 1 (C1–C7).
//
// boot() draws the full ONE-POOL view (Sam adopted the model 2026-08-31; the
// locked mock docs/visuals/2026-08-31-if-tab-simplified.html is the design of
// record and tests/cpl_funding_one_pool.test.js the anchor suite): the pool
// cards + Summary, the 2-year window + year filter, ONE institution table
// (118 rows — 115 colleges + the noncredit-only three as ordinary rows),
// editable priority text/shares, and the three config layers (baked defaults
// ⊕ shared Supabase config ⊕ per-browser scenario) resolving to the right
// store. The retired two-lane surfaces (the noncredit carve-out and its
// dials, the second solve, the paired NC rows, the Award range section) are
// guarded as ABSENT, each against the R-item (R1–R11, 2026-08-31) that
// retired it — the repo's cpl_funding_rural.test.js pattern.
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
  consumerSrc,
  finish,
} = require("./lib/cpl_funding_harness.js");

// The one-pool roster: every college plus the noncredit-only institutions
// (rows whose FTES does NOT ride a credit row — Mt. SAC NC's does).
const TRIO = D.feeders.filter(function (f) { return !f.nc_ftes_on_credit_row; });
const ROSTER_N = D.colleges.length + TRIO.length;   // 118
const money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };

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
  const cardsWrap = doc.querySelector(".cplfund-cards");
  check("renders the pool cards — and the carve-out card is NOT among them (R3)",
    doc.querySelectorAll(".cplfund-card").length >= 6 &&
    !doc.querySelector(".cplfund-card.feeder"));
  // Item-2 sanity, one-pool form: the basis card states the ONE allocation
  // basis — combined credit + noncredit FTES over every institution row.
  //
  // BASIS-AWARE since 2026-08-01 (it once hardcoded HEADCOUNT and asserted a
  // false thing on the live page for two days); COMBINED since one-pool
  // adoption. The unit-agreement guard survives: the aggregate must never
  // pair FTES with feeder HEADCOUNT, and a placeholder campus contributes its
  // PLACEHOLDER, never the untrustworthy reported figure.
  {
    const basisOf = function (f) {
      const ph = Number(f.noncredit_ftes_placeholder);
      return (isFinite(ph) && ph > 0) ? ph : (Number(f.noncredit_ftes) || 0);
    };
    const combined = Math.round(
      D.colleges.reduce(function (s, c) {
        return s + (Number(c.credit_ftes) || 0) + (Number(c.noncredit_ftes) || 0); }, 0) +
      TRIO.reduce(function (s, f) { return s + basisOf(f); }, 0));
    const withReported = Math.round(
      D.colleges.reduce(function (s, c) {
        return s + (Number(c.credit_ftes) || 0) + (Number(c.noncredit_ftes) || 0); }, 0) +
      TRIO.reduce(function (s, f) { return s + (Number(f.noncredit_ftes) || 0); }, 0));
    const card = Array.from(doc.querySelectorAll(".cplfund-card"))
      .find(function (c) { return /allocation basis/.test(c.textContent); });
    check("basis card names the ACTIVE basis — combined credit + noncredit FTES",
      !!card && /credit \+ noncredit FTES \(allocation basis\)/.test(card.textContent));
    check("basis card sums ALL " + ROSTER_N + " institution rows, placeholder-aware",
      !!card && card.textContent.indexOf(combined.toLocaleString("en-US")) !== -1 &&
      new RegExp("of all " + ROSTER_N + " institution rows").test(card.textContent));
    check("...never Calbright's untrustworthy reported figure",
      !!card && combined !== withReported &&
      card.textContent.indexOf(withReported.toLocaleString("en-US")) === -1);
    check("basis card does NOT pair FTES with feeder HEADCOUNT",
      !!card && card.textContent.indexOf(
        D.feeders.reduce(function (s, f) { return s + f.headcount; }, 0).toLocaleString("en-US")) === -1);

    // The noncredit parity card is RETIRED (R8, 2026-08-31): the CR/NC
    // decomposition on every award's face — columns, expands, the pool line —
    // makes the parity case continuously, so the one-off share-of-the-teaching
    // card left the tab.
    check("no parity card any more (R8) — the CR/NC decomposition carries the case",
      !Array.from(doc.querySelectorAll(".cplfund-card")).some(function (c) {
        return /share of the/i.test(c.textContent) && /teaching/i.test(c.textContent); }) &&
      !/policy choice, not a formula/.test(cardsWrap.textContent));
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
  check("renders 3 priority cards", doc.querySelectorAll(".cplfund-prio .p").length === 3);
  const tables = doc.querySelectorAll(".cplfund-table");
  // ONE table (R9, 2026-08-31): the standalone-NC / feeder section is retired —
  // the noncredit-only three are ordinary rows of the one institution table.
  check("ONE table — the standalone feeder section is retired (R9)", tables.length === 1);
  check("renders one row per INSTITUTION (" + ROSTER_N + " — the trio included)",
    tables[0].querySelectorAll("tbody tr.cplfund-row").length === ROSTER_N);
  check("the noncredit-only three are ordinary rows; Mt. SAC NC is NOT a row (rides Mt San Antonio)",
    /NOCE/.test(tables[0].textContent) && /SD Cont\. Ed/.test(tables[0].textContent) &&
    /Calbright/.test(tables[0].textContent) && tables[0].textContent.indexOf("Mt. SAC NC") === -1);
  // Rows are keyed by the INSTITUTION, not by a roster ordinal: data-id is
  // "c:<college>" (was "c:<order>"), so an expand survives any re-sort and a
  // deep link names a college, not a position.
  check("row data-id is 'c:<college>' — never the retired 'c:<order>' form",
    (function () {
      const rows = Array.from(tables[0].querySelectorAll("tbody tr.cplfund-row"));
      const bak = rows.find(function (r) { return /Bakersfield/.test(r.textContent); });
      return !!bak && bak.getAttribute("data-id") === "c:Bakersfield" &&
        rows.every(function (r) { return !/^c:\d+$/.test(r.getAttribute("data-id") || ""); });
    })());
  // Default sort is ALPHABETICAL by displayed name (Sam, 2026-08-31: a
  // size-sorted list reads as a league table and invites colleges to compare
  // max awards first).
  check("the institution list is alphabetical by default",
    (function () {
      // .cplfund-instname replaced the <strong> wrap (Sam's low-key-rows
      // ruling, "nothing bold" — 2026-09-01)
      const names = Array.from(tables[0].querySelectorAll("tbody tr.cplfund-row td.t .cplfund-instname"))
        .map(function (e) { return e.textContent; });
      return names.length === ROSTER_N && names.slice(0, 30).every(function (n, i, a) {
        return i === 0 || a[i - 1].localeCompare(n) <= 0;
      });
    })());
  // The Summary sits at the TOP, before any section fold (R11) — the one
  // over/under readout the retired balance boxes fed.
  // ⚠️ RE-AIMED to R11's actual requirement (2026-09-01), not weakened. R11 is
  // "the Summary is never inside a fold"; "above the first section" was an
  // equivalent proxy until Sam asked for a collapsible introduction, which is a
  // section and belongs above it — a reader should be told what the model IS
  // before being shown a readout about it. So assert BOTH halves directly: the
  // Summary is in no <details> at all, and nothing carrying figures precedes it.
  check("the Summary is never inside a fold (R11)",
    (function () {
      const sum = doc.querySelector(".cplfund-summary");
      return !!sum && !sum.closest("details");
    })());
  check("...and every figure-bearing section still follows it — only the intro may precede",
    (function () {
      const sum = doc.querySelector(".cplfund-summary");
      const secs = Array.from(doc.querySelectorAll("details.cplfund-sec"));
      if (!sum || !secs.length) return false;
      const before = secs.filter((s) =>
        !!(s.compareDocumentPosition(sum) & 4 /* sum FOLLOWS s */));
      return before.length === 1 && before[0].getAttribute("data-sec") === "about";
    })());
  // Section titles carry Sam's live renames (2026-08-31).
  {
    const mountText = doc.getElementById("cplFundingMount").textContent;
    check("section titles carry Sam's renames (2026-08-31)",
      /Funding Breakdown/.test(mountText) && /Eligibility Requirements/.test(mountText) &&
      /Funding Outcomes Required by/.test(mountText) &&
      /Outcomes-based awards/.test(mountText));
    // The band consolidation's absence guard (Sam, 2026-09-01). The priorities
    // and the statutory goals were two sections describing one allocation; they
    // are now one, titled by the statute, with the priorities as bands inside
    // it. The retired title returning would mean the second section returned.
    check("the retired 'Three Priority Outcome-Based Allocations' title is GONE, and the " +
          "statutory title appears exactly once (Sam's band consolidation, 2026-09-01)",
      !/Three Priority Outcome-Based Allocations/.test(mountText) &&
      (mountText.match(/Funding Outcomes Required by/g) || []).length === 1);
    check("chips are ghosted WORDS — at base / at cap / NC only, no ⬆/⬇ glyphs in the table",
      /at base/.test(mountText) && /at cap/.test(mountText) && /NC only/.test(mountText) &&
      !/[⬆⬇]/.test(doc.getElementById("cplFundTable").textContent));
  }
  // Sam, 2026-08-04: the noncredit FTES rides the surface, LABELLED. The old
  // advisory sub-line (then the paired NC row's size cell) is now a COLUMN of
  // its own — "NC FTES" — beside the credit one (the reaction round's CR/NC
  // columns, 2026-08-31). The label is what is being protected: a bare number
  // under a generic size header does not say it is noncredit.
  {
    const sf = D.colleges.find(function (c) { return c.college === "San Francisco"; });
    const sfRow = Array.from(tables[0].querySelectorAll("tbody tr.cplfund-row"))
      .find(function (tr) { return tr.textContent.indexOf("San Francisco") !== -1; });
    check("the NC FTES column carries a college's own noncredit FTES (San Francisco)",
      !!doc.querySelector('th[data-sort="nc_ftes"]') &&
      doc.querySelector('th[data-sort="nc_ftes"]').textContent.indexOf("NC FTES") !== -1 &&
      !!sfRow && sfRow.textContent.indexOf(Math.round(sf.noncredit_ftes).toLocaleString("en-US")) !== -1);
    check("De Anza renders via the display override 'DeAnza' (no space)",
      tables[0].textContent.indexOf("DeAnza") !== -1 &&
      D.colleges.some(function (c) { return c.college === "De Anza" && c.display === "DeAnza"; }));
  }
  // SYSTEM total moved from <tfoot> to the FIRST body row (Sam, 2026-07-23);
  // ONE SYSTEM row under one pool (R6) — the CR/NC pair is two CELLS on it.
  check("SYSTEM pinned as the FIRST body row (one row, moved from tfoot)",
    !tables[0].querySelector("tfoot") &&
    tables[0].querySelector("tbody tr").classList.contains("cplfund-systemrow") &&
    tables[0].querySelector("tbody tr.cplfund-systemrow").textContent.indexOf("SYSTEM") !== -1 &&
    doc.querySelectorAll(".cplfund-systemrow").length === 1);
  // PR-1 (Sam, 2026-07-23): Total Available Funds; the Award range section is
  // retired (R7) — its successor is the window card's bounds fold.
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
    // ⚠️ The Award range section — two separately-solved lane rows of Minimum /
    // Average / Maximum cards — is RETIRED (R7, 2026-08-31): one pool has ONE
    // window, and the two-lane arithmetic it separated no longer exists.
    check("the Award range section stays retired (R7) — no lane rows, no award cards",
      doc.querySelectorAll(".cplfund-awardrow").length === 0 &&
      !Array.from(doc.querySelectorAll(".cplfund-card")).some(function (c) {
        return /Minimum award|Average award|Maximum award/.test(c.textContent); }));
    // The successor: the window card's fold, Sam's wording, carrying the
    // at-cap names, the at-base count and the range + average.
    const T0 = window.CPL_FUNDING_TAB;
    const m0 = T0._model();
    const fold = Array.from(doc.querySelectorAll(".cplfund-pool-projects"))
      .find(function (d) { return /Show the institutions with Base and Cap funding/.test(d.textContent); });
    check("the bounds fold replaces it: at-cap names, the at-base count, range + average",
      !!fold &&
      /At the cap:/.test(fold.textContent) && /Mt San Antonio/.test(fold.textContent) &&
      new RegExp("At the base:\\s*" + m0.floorCount + " institutions").test(fold.textContent) &&
      fold.textContent.indexOf("average max award " +
        money(T0._netCollege() / ROSTER_N)) !== -1);
    // The bounds themselves stay honest: base × at-base and cap × at-cap are
    // the ADOPTED dials (51 and 7 at the committed defaults — the mock's
    // figures of record, asserted exactly in cpl_funding_one_pool.test.js A6).
    check("the base and cap figures on the fold are the adopted window",
      fold.textContent.indexOf(money(m0.floor)) !== -1 &&
      fold.textContent.indexOf(money(m0.cap)) !== -1);
  }
  check("scoped CSS injected once", doc.querySelectorAll("#cpl-funding-css").length === 1);
  window.CPL_FUNDING_TAB.render();
  check("DRAFT chip renders in the pane header, once",
    doc.querySelectorAll("#cplFundingDraftChip").length === 1 &&
    doc.querySelector("#tab-implementation-funding h2 .cplfund-draftchip").textContent === "Draft");
  check("uses var(--token) CSS, no raw hex", !/#[0-9a-fA-F]{3,6}\b/.test(doc.getElementById("cpl-funding-css").textContent));
  check("null working-adults cells render as —", tables[0].textContent.indexOf("NaN") === -1);

  // No-horizontal-scroll rule: the district fold survives (the column is in
  // the Columns menu, hidden by default — the cell still renders for it).
  const distCell = tables[0].querySelector("tbody tr td.trunc");
  check("district cell folds the CCD suffix + keeps the full name in title",
    distCell.textContent.indexOf(" CCD") !== -1 &&
    distCell.textContent.indexOf("Community College District") === -1 &&
    distCell.getAttribute("title").indexOf("Community College District") !== -1);
  // The award columns are the CR/NC pair (the locked mock): the per-year
  // Yr 1 / Yr 2 columns, the window Total column and the Combined column are
  // all retired — per-priority and per-year detail lives in the row expand.
  check("the money columns are the CR award / NC award pair",
    !!doc.querySelector('th[data-sort="cr_award"]') && !!doc.querySelector('th[data-sort="nc_award"]'));
  check("no Yr 1 / Yr 2 / Total / Combined columns any more (the expand carries the detail)",
    !doc.querySelector('th[data-sort="y1"]') && !doc.querySelector('th[data-sort="y2"]') &&
    !doc.querySelector('th[data-sort="total"]') && !doc.querySelector('th[data-sort="combined"]'));
  check("no per-priority P1/P2/P3 columns in the table", !doc.querySelector('th[data-sort="p1"]'));
  check("no period toggle (funding timing is a model dial, not a view toggle)",
    !doc.getElementById("cplFundPeriod"));

  // Search narrows.
  const input = doc.getElementById("cplFundSearch");
  commit(window, input, "Yuba");
  input.dispatchEvent(new window.Event("input"));
  const afterSearch = doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row").length;
  check("search narrows rows (Yuba)", afterSearch >= 1 && afterSearch < ROSTER_N);
  input.value = ""; input.dispatchEvent(new window.Event("input"));

  // Sort by CR award desc (the Total column is retired; the award columns are
  // the sortable money now).
  const crTh = doc.querySelector('#cplFundTable th[data-sort="cr_award"]');
  click(window, crTh);
  const firstRow = doc.querySelector("#cplFundTable tbody tr.cplfund-row");
  const T = window.CPL_FUNDING_TAB;
  const names = D.colleges.map(function (c) { return c.college; })
    .concat(TRIO.map(function (f) { return f.short; }));
  const crMax = Math.max.apply(null, names.map(function (n) { return T._alloc(n).cr_award; }));
  const atCrMax = names.filter(function (n) { return Math.abs(T._alloc(n).cr_award - crMax) < 0.5; });
  check("sort by CR award desc puts a maximum-CR-award institution first",
    atCrMax.some(function (n) { return firstRow.textContent.indexOf(n) !== -1; }));
  // The cap holds the largest institutions at one combined figure (Sam's $400K
  // maximum), so "largest sorts first" is a coin-toss between tied rows —
  // assert the MODEL claim instead: the biggest institution on the combined
  // basis holds the maximum combined award.
  const sizeOf = function (n) {
    const c = D.colleges.find(function (x) { return x.college === n; });
    if (c) return (Number(c.credit_ftes) || 0) + (Number(c.noncredit_ftes) || 0);
    const f = TRIO.find(function (x) { return x.short === n; });
    const ph = Number(f.noncredit_ftes_placeholder);
    return (isFinite(ph) && ph > 0) ? ph : (Number(f.noncredit_ftes) || 0);
  };
  const biggest = names.reduce(function (a, b) { return sizeOf(a) >= sizeOf(b) ? a : b; });
  const maxTotal = Math.max.apply(null, names.map(function (n) { return T._alloc(n).total; }));
  check("the largest institution on the allocation basis holds the maximum combined award",
    Math.abs(T._alloc(biggest).total - maxTotal) < 0.5);

  // Provenance surfaces.
  check("footnote cites the DataMart headcount source",
    footText(doc).indexOf("DataMart") !== -1);
  // The size PAIR follows the one-pool basis: each column cites its own source
  // and says what it sizes (the share of the ONE pool).
  check("the CR FTES header cites its source + the combined sizing it feeds",
    /DataMart/.test(doc.querySelector('th[data-sort="cr_ftes"]').getAttribute("title") || "") &&
    /Combined with its noncredit FTES/.test(doc.querySelector('th[data-sort="cr_ftes"]').getAttribute("title") || ""));
  check("the NC FTES header cites MIS + the noncredit restriction",
    /MIS/.test(doc.querySelector('th[data-sort="nc_ftes"]').getAttribute("title") || "") &&
    /noncredit/.test(doc.querySelector('th[data-sort="nc_ftes"]').getAttribute("title") || ""));
  check("mixed-vintage honesty note counts the rows still on 2022-23",
    footText(doc).indexOf("await a 2025-26 headcount") !== -1);

  // No-match empty row.
  commit(window, doc.getElementById("cplFundSearch"), "zzz-no-such-college");
  doc.getElementById("cplFundSearch").dispatchEvent(new window.Event("input"));
  check("no-match search shows an explicit empty row",
    doc.querySelector("#cplFundTable tbody").textContent.indexOf("No institutions match") !== -1);
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
// Σrevenue − Σdeduction; add/hide/delete are guarded by confirm().
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const P = D.pool;

  // Conservation: with NO custom boxes and nothing hidden, netCollege equals
  // the baked one_time − admin − projects formula. The feeder-carve-out TERM is
  // retired (R3, one-pool adoption 2026-08-31): the field still sits in the
  // data for config-shape stability, and the model reads none of it — the
  // whole $25,240,308 goes to institutions.
  const bakedNet = P.one_time_2026_27 - P.admin_cost - P.scaling_projects_tech;
  check("net college funding matches the baked formula (conservation — no carve-out term, R3)",
    Math.round(T._netCollege()) === Math.round(bakedNet) &&
    P.feeder_carveout > 0 /* the retired field is still there — and ignored */);
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

  // Computed boxes are NOT deletable; the carve-out box no longer exists to
  // need the protection (R3).
  check("no carve-out box to delete (R3) — and the net hero has no delete ✕ (computed)",
    !doc.querySelector(".cplfund-card.feeder") &&
    !doc.querySelector(".cplfund-card.hero .cplfund-card-x"));
}

// C2 — 2-year window + year selector + the tranche math.
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  check("two year dropdowns (2-year window)", doc.querySelectorAll('select[data-edit="year"]').length === 2);
  // ONE POOL (Sam, 2026-08-31): the hero is the whole $25,240,308 to
  // institutions — no carve-out line — under Sam's renamed label. The note
  // decomposes the pool's noncredit face instead of breaking out a lane.
  const net = T._netCollege();
  const perYear = net / 2;
  const eff = T._effective();
  check("hero = the one pool to institutions (" + money(net) + ", Sam's 'Total credit and noncredit potential awards')",
    doc.querySelector(".cplfund-card.hero .v").textContent.indexOf(money(net)) !== -1 &&
    /Total credit and noncredit potential awards/.test(doc.querySelector(".cplfund-card.hero .l").textContent));
  check("hero label states 2 annual tranches of the per-year amount (" + money(perYear) + ")",
    doc.querySelector(".cplfund-card.hero .l").textContent.indexOf(money(perYear)) !== -1);
  // The note carries the pool's noncredit DECOMPOSITION — the trio's
  // origination-held figure and the college NC shares riding their awards —
  // never a carve-out or rural line. Asserted on the FIGURES (from
  // _effective, the same accessors the note renders through), not on a fixed
  // sentence: this check used to require exact phrases, which broke under a
  // live vocabulary sweep without the note being wrong.
  {
    const note = doc.querySelector(".cplfund-card.hero .l").textContent;
    check("hero note decomposes the pool's noncredit share (no carve-out line)",
      // Case-insensitive: the phrase became the start of its own sentence when
      // the timing moved out of the hero LABEL into its note (2026-09-01), and
      // this check is deliberately about the figures rather than the wording.
      /no carve-out line/i.test(note) &&
      note.indexOf(money(eff.pool.nc_only_held_by_origination)) !== -1 &&
      /riding college awards/.test(note) &&
      !/Rural College allowance/.test(note) && !/NC campuses/.test(note));
  }

  // Change Year 2 to 2028-29 → the window widens in the labels; still 2 years.
  const y2 = doc.querySelectorAll('select[data-edit="year"]')[1];
  commit(window, y2, "2028-29");
  check("changing a year updates the window label",
    doc.querySelector(".cplfund-card.hero .l").textContent.indexOf("2028-29") !== -1);
  check("still a 2-year window (per-year unchanged)",
    doc.querySelector(".cplfund-card.hero .l").textContent.indexOf(money(perYear)) !== -1);
  check("year change persisted to the local scenario",
    !!scenSlot(window));
}

// C3 — year filter: switches priority metrics; the award columns are window
// quantities, stable across the year filter at default (equal) shares.
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
  // default shares equal both years → the award pair on a row is unchanged.
  const awardsY2 = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row td.cf-award"))
    .slice(0, 2).map(function (td) { return td.textContent; }).join("|");
  click(window, doc.querySelector('#cplFundYear button[data-val="1"]'));
  const awardsY1 = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row td.cf-award"))
    .slice(0, 2).map(function (td) { return td.textContent; }).join("|");
  check("a row's CR/NC award pair is stable across years at default shares", awardsY1 === awardsY2);
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

// C4 — THE SECOND NONCREDIT SOLVE IS RETIRED (one-pool adoption, 2026-08-31).
// This block was the noncredit LANE's render coverage: the three dials, the
// bounded second solve over a 33-institution roster, the paired NC rows and
// the carve-out arithmetic. All of that is gone by ruling — R3 (no carve-out
// card/line), R4–R5 (no NC dials), R6 (one row per institution) — and its
// successor model (one solve, FTES-share decomposition, the trio as ordinary
// rows) is asserted in tests/cpl_funding_one_pool.test.js. What stays here:
// the ABSENCE of every retired surface, plus the surviving guards those rows
// used to carry (the duplication that retired the NC $ column; the Mt. SAC
// dedup; the Calbright placeholder discipline).
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;

  // ── the retired mechanism, pinned absent ───────────────────────────────
  check("API: the second solve is gone — no _ncModel / _nc on the module (one pool, one solve)",
    !("_ncModel" in T) && !("_nc" in T));
  ["ncModel", "ncThresholdFtes", "ncFloorWindow", "ncCapWindow", "feederCarveout", "ncParity"]
    .forEach(function (fn) {
      check("source: " + fn + "() is gone", consumerSrc.indexOf("function " + fn + "(") === -1);
    });
  check("no NC dials on the tab (R4–R5) and no carve-out input (R3)",
    ["nc_threshold_ftes", "nc_floor_window", "nc_cap_window", "feeder_carveout"]
      .every(function (f) {
        return !doc.querySelector('input[data-edit="pool"][data-field="' + f + '"]'); }));
  check("no paired NC rows, no NC SYSTEM row, no below-threshold chip (R6)",
    !doc.querySelector(".cplfund-ncrow") && !doc.querySelector(".cplfund-ncsysrow") &&
    !doc.querySelector(".cf-belowchip"));

  // ── the surviving guards, on the one-row surfaces ──────────────────────
  const headers = Array.from(doc.querySelectorAll("#cplFundTable thead th")).map((h) => h.textContent.trim());
  // ⚠️ The NC $ column was RETIRED 2026-08-28 because it printed the same money
  // twice (the carve-out on the credit row AND on the noncredit row). The
  // NC AWARD column is NOT its return: it is the one award's FTES-share
  // decomposition — the figure exists nowhere else on the row.
  check("the duplicating NC $ column has not come back", !headers.some((h) => /^NC \$/.test(h)));
  const mtsacA = T._alloc("Mt San Antonio");
  const mtsac = Array.from(doc.querySelectorAll("tr.cplfund-row"))
    .find((tr) => tr.textContent.indexOf("Mt San Antonio") !== -1);
  const cells = Array.from(mtsac.querySelectorAll("td.cf-award")).map((td) => td.textContent);
  // Annual funding (the baked default) shows per-year figures: award ÷ 2.
  check("a college's noncredit award renders in ITS OWN labelled column, exactly once",
    cells.length === 2 &&
    cells[1].indexOf(money(mtsacA.nc_award / 2)) !== -1 &&
    cells[0].indexOf(money(mtsacA.nc_award / 2)) === -1);
  // Sam: "I want it on the surface the amount admin should give to NC so it
  // doesn't get lumped into the whole". The credit cell carries the CR slice —
  // never the combined total — and the two slices sum to the one award.
  check("the credit cell is the CR slice, not the combined total (CR + NC = the one award)",
    cells[0].indexOf(money(mtsacA.cr_award / 2)) !== -1 &&
    cells[0].indexOf(money(mtsacA.total / 2)) === -1 &&
    Math.abs(mtsacA.cr_award + mtsacA.nc_award - mtsacA.total) < 1);

  // ── the Mt. SAC dedup: excluded from the ROSTER, not deleted ───────────
  // Removing the institution outright erased a real $50,000 ESS 25-82 grant.
  // The FTES is the duplicate, not the institution: its noncredit FTES rides
  // the Mt. San Antonio row (one pool), and the campus keeps its grant record.
  check("Mt. SAC Noncredit is still an institution in the data",
    D.feeders.some((f) => f.short === "Mt. SAC NC") &&
    D.feeders.filter((f) => f.short === "Mt. SAC NC")[0].nc_ftes_on_credit_row === "Mt San Antonio");
  check("...not a table row (its FTES rides the Mt San Antonio row)",
    doc.querySelector("#cplFundTable").textContent.indexOf("Mt. SAC NC") === -1);
  check("...and it still receives its $50,000 seed grant in the distributions view",
    T._grantRecipients().filter((r) => r.name === "Mt. SAC NC").length === 1);

  // ── the placeholder guards, unchanged in substance ─────────────────────
  const cal = D.feeders.filter((f) => f.short === "Calbright")[0];
  check("Calbright keeps its REPORTED noncredit FTES alongside the placeholder",
    cal.noncredit_ftes === 21438.17 && cal.noncredit_ftes_placeholder === 1000);
  check("the placeholder records WHY it exists (a bare number would become fact)",
    typeof cal.noncredit_ftes_placeholder_basis === "string" &&
    cal.noncredit_ftes_placeholder_basis.length > 40);
  const calRow = Array.from(doc.querySelectorAll("tr.cplfund-row")).find((tr) => /Calbright/.test(tr.textContent));
  check("the placeholder, not the reported figure, sizes Calbright's row",
    !!calRow && calRow.textContent.indexOf("1,000") !== -1 &&
    doc.querySelector("#cplFundTable").textContent.indexOf("21,438") === -1);
  check("...and the size cell SAYS it is a stand-in (N3 a) rather than a bare number",
    !!Array.from(calRow.querySelectorAll("td")).find((td) => /stand-in/.test(td.getAttribute("title") || "")));

  // ── no carve-out arithmetic left to move ───────────────────────────────
  // The retired pool field is still in the data (config-shape stability) and
  // moves NOTHING: the net to institutions is the amendment's full figure.
  check("the retired feeder_carveout field moves no funding (net = $25,240,308)",
    D.pool.feeder_carveout === 1000000 &&
    Math.abs(T._netCollege() - 25240308) < 1);
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
  const awardBefore = doc.querySelector("#cplFundTable tbody tr.cplfund-row td.cf-award").textContent;
  commit(window, doc.querySelector('input[data-edit="perstudent"][data-slot="1"][data-idx="0"]'), "75");
  check("per-student edit moves NO dollars (first-row award unchanged)",
    doc.querySelector("#cplFundTable tbody tr.cplfund-row td.cf-award").textContent === awardBefore);

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
