// CPL Implementation Funding tab — renderer + shell-wiring + data guards.
//
// v2 (2026-07-03): the model became a Chancellor-facing POLICY config — a
// 2-year selectable window, year-specific priorities (metric text + factors),
// a noncredit-feeder carve-out, and three edit layers (baked defaults ⊕ shared
// Supabase config, team-phrase editable ⊕ per-browser what-if scenario). These
// tests guard:
//  (a) the tab shell (nav button, pane, lazy boot) stays present + IDENTICAL in
//      both HTMLs, and team_phrase.js loads before the funding boot;
//  (b) the data stays LAZY (no eager <script>);
//  (c) the renderer draws the full view + a graceful empty state on data 404;
//  (d) the year window + year filter + feeder carve-out + editable text behave;
//  (e) the three config layers resolve correctly and scenario/shared edits go
//      to the right store;
//  (f) PII: institutional/census aggregates only, no person-level keys.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ─────────────────────────────────────────────────────────────────────────────
// Part A — static invariants: shell wiring + lazy loading + Rule 4
// ─────────────────────────────────────────────────────────────────────────────
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");

check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
[["nav button", 'data-tab="implementation-funding" role="tab"'],
 ["pane", 'id="tab-implementation-funding"'],
 ["mount", 'id="cplFundingMount"'],
 ["lazy boot", "loadScript('cpl_funding.js', 'CPL_FUNDING_TAB'"]].forEach(function (pair) {
  check("shell " + pair[0] + " present (CPL_Dashboard.html)", cpl.indexOf(pair[1]) !== -1);
  check("shell " + pair[0] + " present (index.html)", idx.indexOf(pair[1]) !== -1);
});
["cpl_funding.js", "cpl_funding_data.js", "cpl_funding_performance.js"].forEach(function (f) {
  check("no eager <script> for " + f, idx.indexOf('<script src="' + f + '">') === -1);
});
// team_phrase.js is a dependency (window.CPL_TEAM_PHRASE) — must be present +
// loaded before the funding boot snippet in both HTMLs.
[cpl, idx].forEach(function (html, i) {
  const tag = i === 0 ? "CPL_Dashboard.html" : "index.html";
  const tp = html.indexOf('<script src="team_phrase.js">');
  const boot = html.indexOf("loadScript('cpl_funding.js', 'CPL_FUNDING_TAB'");
  check("team_phrase.js loads before the funding boot (" + tag + ")", tp !== -1 && tp < boot);
});

const consumerSrc = fs.readFileSync("cpl_funding.js", "utf8");
check("consumer lazy-loads cpl_funding_data.js via CPL_TABS.loadScript",
  /CPL_TABS\.loadScript\("cpl_funding_data\.js",\s*"CPL_FUNDING"/.test(consumerSrc));
check("consumer lazy-loads cpl_funding_performance.js (fail-soft actuals)",
  /CPL_TABS\.loadScript\("cpl_funding_performance\.js",\s*"CPL_FUNDING_PERF"/.test(consumerSrc));
check("consumer reads/writes the shared config table cpl_funding_config",
  /cpl_funding_config/.test(consumerSrc));
check("consumer routes writes through CPL_TEAM_PHRASE (decorateHeaders)",
  /CPL_TEAM_PHRASE|decorateHeaders/.test(consumerSrc));

// ─────────────────────────────────────────────────────────────────────────────
// Part B — data artifact: schema + PII scan
// ─────────────────────────────────────────────────────────────────────────────
const dataSrc = fs.readFileSync("cpl_funding_data.js", "utf8");
const sandbox = { window: {} };
new Function("window", dataSrc)(sandbox.window);
const D = sandbox.window.CPL_FUNDING;

check("data global parses (window.CPL_FUNDING)", !!D);
check("data: >100 colleges + SYSTEM row", D && D.colleges.length > 100 && D.system && D.system.college === "SYSTEM");

// 2-year selectable window.
check("data: year_options list + a 2-year default window",
  D && Array.isArray(D.year_options) && D.year_options.length >= 2 &&
  Array.isArray(D.default_years) && D.default_years.length === 2);

// Year-specific priorities: two slots, each 3 priorities, each slot's shares
// sum to 1, with year-1 vs year-2 metric text differing.
check("data: year_priorities has slots 1 and 2, 3 priorities each",
  D && D.year_priorities && D.year_priorities["1"].length === 3 && D.year_priorities["2"].length === 3);
["1", "2"].forEach(function (slot) {
  check("data: year " + slot + " shares sum to 1",
    D && Math.abs(D.year_priorities[slot].reduce(function (s, p) { return s + p.share; }, 0) - 1) < 1e-6);
  check("data: year " + slot + " priorities carry metric + target_rate, no factor",
    D && D.year_priorities[slot].every(function (p) {
      return p.metric && p.share != null && p.target_rate != null && p.factor === undefined;
    }));
});
check("data: year-1 P1 metric is Sam's spec text",
  D && D.year_priorities["1"][0].metric === "Headcount with any transcribed CPL");
check("data: year-2 P1 metric differs from year-1",
  D && D.year_priorities["2"][0].metric === "Units of Transcribed CPL" &&
  D.year_priorities["2"][0].metric !== D.year_priorities["1"][0].metric);

// Noncredit feeders + carve-out.
check("data: 4 noncredit feeders with headcount + short name",
  D && Array.isArray(D.feeders) && D.feeders.length === 4 &&
  D.feeders.every(function (f) { return f.name && f.short && typeof f.headcount === "number"; }));
check("data: feeder roster names NOCE / SD Cont. Ed / Mt. SAC / Calbright",
  D && ["NOCE", "SD Cont. Ed", "Mt. SAC NC", "Calbright"].every(function (s) {
    return D.feeders.some(function (f) { return f.short === s; });
  }));
check("data: feeder_metric + pool.feeder_carveout present",
  D && D.feeder_metric && typeof D.pool.feeder_carveout === "number");
// The feeder institutions were MOVED OUT of the college table (2026-07-03 —
// they can't earn the CPL priority metrics; the carve-out supports them).
check("data: no feeder institution doubles as a college row",
  D && !D.colleges.some(function (c) {
    return /CalBright|Mt San Antonio Noncredit|North Orange Adult|San Diego Adult/i.test(c.college);
  }));
// 2025-26 headcount refresh (Sam, 2026-07-03): per-row vintage stamps; the
// SYSTEM row + shares recomputed over the new roster.
check("data: every college row carries an hc_vintage stamp",
  D && D.colleges.every(function (c) { return c.hc_vintage === "2025-26" || c.hc_vintage === "2022-23"; }));
check("data: the 2025-26 update landed (East LA = 65,933)",
  D && D.colleges.some(function (c) { return c.college === "East LA" && c.headcount === 65933 && c.hc_vintage === "2025-26"; }));
check("data: headcount_pct sums to 1 over the new roster",
  D && Math.abs(D.colleges.reduce(function (s, c) { return s + c.headcount_pct; }, 0) - 1) < 1e-4);

// Pool math: the workbook chain still validates (before the feeder carve-out).
check("data: pool math (remaining + one-time − admin − scaling = college_funding_before_feeder)",
  D && Math.abs((D.pool.remaining_2025_26 + D.pool.one_time_2026_27 -
    D.pool.admin_cost - D.pool.scaling_projects_tech) - D.pool.college_funding_before_feeder) < 0.01);
check("data: SYSTEM headcount = Σ college rows",
  D && D.system.headcount === D.colleges.reduce(function (s, c) { return s + (c.headcount || 0); }, 0));
// College rows are now inputs only (dollars computed live) — no baked dollar cols.
check("data: college rows carry headcount + geo, no baked dollar columns",
  D && D.colleges.every(function (c) {
    return typeof c.headcount === "number" && c.headcount_pct != null && c.p1 === undefined && c.total === undefined;
  }));

// Headcount provenance.
check("data: headcount_label carries the workbook vintage",
  D && /MIS ANNUAL HEADCOUNT/i.test(D.headcount_label || ""));
check("data: headcount_source points at the CCCCO DataMart report",
  D && D.headcount_source && /datamart\.cccco\.edu/.test(D.headcount_source.url || ""));

// PII: emails (allow-list) + person-level keys.
const emails = dataSrc.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
const badEmails = emails.filter(function (e) { return !/@(rccd\.edu|example\.(com|org|net))$/i.test(e); });
check("PII: no emails in cpl_funding_data.js (outside allow-list)", badEmails.length === 0);
const PERSON_KEYS = /"(first_?name|last_?name|student_?id|ssn|dob|birth|email|phone)"\s*:/i;
check("PII: no person-level keys in the data artifact", !PERSON_KEYS.test(dataSrc));

// ─────────────────────────────────────────────────────────────────────────────
// Part C — renderer behaviour (jsdom). NO_REMOTE keeps the shared-config fetch
// out of the tests (the sandbox is egress-blocked anyway).
// ─────────────────────────────────────────────────────────────────────────────
function freshDom() {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><head></head><body>' +
    '<div class="cpl-tab-pane" id="tab-implementation-funding"><div class="main-container">' +
    '<div><h2>CPL Implementation Funding</h2></div>' +
    '<div id="cplFundingMount">placeholder</div>' +
    "</div></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/" });
  dom.window.scrollTo = function () {};
  dom.window.CPL_FUNDING_NO_REMOTE = true;   // no Supabase fetch in tests
  return dom;
}
function boot(window) {
  window.eval(dataSrc);
  window.eval(consumerSrc);
  window.CPL_FUNDING_TAB.boot();
  return window.document;
}
function click(window, el) { el.dispatchEvent(new window.Event("click", { bubbles: true })); }
function commit(window, el, v) { el.value = v; el.dispatchEvent(new window.Event("change")); }
// Per-browser what-if overlay (v3): the local override for the CPL project's
// given scenario (default "Scenario 1"), read straight from localStorage.
function scenSlot(window, name) {
  const raw = window.localStorage.getItem("cpl_funding_whatif_v3");
  if (!raw) return null;
  const wf = JSON.parse(raw);
  return wf["cpl-implementation::" + (name || "Scenario 1")] || null;
}
// There can be >1 .cplfund-foot (the feeder note + the main footer); scan all.
function footText(doc) {
  return Array.from(doc.querySelectorAll(".cplfund-foot")).map(function (e) { return e.textContent; }).join(" ");
}
// The Elig column is a numbered pie: count met (green-filled) slices in an
// element's pie glyph (met requirements) and its total slice count.
function greenSlices(el) {
  const pie = el && el.querySelector(".cf-eligpie");
  return pie ? (pie.innerHTML.match(/var\(--green-progress\)/g) || []).length : -1;
}
function pieSlices(el) {
  const pie = el && el.querySelector(".cf-eligpie");
  return pie ? pie.querySelectorAll("path, circle").length : -1;
}

// C1 — happy path.
{
  const { window } = freshDom();
  let threw = false;
  let doc;
  try { doc = boot(window); } catch (e) { threw = true; console.error(e); }
  check("boot() renders without throwing", !threw);
  check("renders pool cards (incl. feeder carve-out)", doc.querySelectorAll(".cplfund-card").length >= 6);
  // Item-2 sanity (Sam, 2026-07-03): the headcount card shows the college
  // basis + the noncredit-feeder heads + the combined CCC total.
  {
    const feederSum = D.feeders.reduce(function (s, f) { return s + f.headcount; }, 0);
    const combined = D.system.headcount + feederSum;
    const hcCard = Array.from(doc.querySelectorAll(".cplfund-card .l"))
      .find(function (l) { return l.textContent.indexOf("CCC total") !== -1; });
    check("headcount card shows colleges + feeders + combined CCC total",
      hcCard && hcCard.textContent.indexOf(feederSum.toLocaleString("en-US")) !== -1 &&
      hcCard.textContent.indexOf(combined.toLocaleString("en-US")) !== -1);
  }
  check("feeder carve-out card is a deduction", !!doc.querySelector(".cplfund-card.feeder"));
  check("renders 3 priority cards", doc.querySelectorAll(".cplfund-prio .p").length === 3);
  const tables = doc.querySelectorAll(".cplfund-table");
  check("three tables: college + feeder + rural allowance", tables.length === 3);
  check("renders one row per college", tables[0].querySelectorAll("tbody tr.cplfund-row").length === D.colleges.length);
  check("renders one row per feeder (4)", tables[1].querySelectorAll("tbody tr").length === 4);
  // SYSTEM total moved from <tfoot> to the FIRST body row (Sam, 2026-07-23).
  check("SYSTEM pinned as the FIRST body row (moved from tfoot)",
    !tables[0].querySelector("tfoot") &&
    tables[0].querySelector("tbody tr").classList.contains("cplfund-systemrow") &&
    tables[0].querySelector("tbody tr.cplfund-systemrow").textContent.indexOf("SYSTEM") !== -1);
  // PR-1 (Sam, 2026-07-23): Total Available Funds + Award range boxes.
  {
    const totalAvail = D.pool.remaining_2025_26 + D.pool.one_time_2026_27;
    const totalCard = doc.querySelector(".cplfund-card.total");
    check("Total Available Funds card = remaining + one-time",
      !!totalCard &&
      totalCard.querySelector(".v").textContent.indexOf("$" + Math.round(totalAvail).toLocaleString("en-US")) !== -1 &&
      totalCard.textContent.toLowerCase().indexOf("total available funds") !== -1);
    const awardCards = Array.from(doc.querySelectorAll(".cplfund-card.award"));
    check("Award range shows Average / Minimum / Maximum (3 cards)",
      awardCards.length === 3 &&
      awardCards.some(function (c) { return c.textContent.indexOf("Average award") !== -1; }) &&
      awardCards.some(function (c) { return c.textContent.indexOf("Minimum award") !== -1; }) &&
      awardCards.some(function (c) { return c.textContent.indexOf("Maximum award") !== -1; }));
    const avgAward = D.colleges.reduce(function (s, c) {
      return s + window.CPL_FUNDING_TAB._alloc(c.college).total; }, 0) / D.colleges.length;
    check("Average award card = Σ college window totals ÷ N",
      awardCards[0].querySelector(".v").textContent.indexOf("$" + Math.round(avgAward).toLocaleString("en-US")) !== -1);
    // With the default floor active, many colleges share the minimum — the Min
    // card names the floor count, not one arbitrary college.
    check("Minimum award card reports the floored-college count (not one college)",
      awardCards[1].textContent.indexOf("floor") !== -1);
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
  check("headcount column header tooltips the vintage",
    (doc.querySelector('th[data-sort="headcount"]').getAttribute("title") || "").indexOf("2025-2026") !== -1);
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
  // baked remaining + one_time − admin − scaling − feeder − rural formula.
  const bakedNet = P.remaining_2025_26 + P.one_time_2026_27 - P.admin_cost -
    P.scaling_projects_tech - P.feeder_carveout - P.rural_carveout;
  check("net college funding matches the baked formula (conservation)", Math.round(T._netCollege()) === Math.round(bakedNet));
  const gross = P.remaining_2025_26 + P.one_time_2026_27;
  check("Total Available Funds = Σ revenue sources",
    doc.querySelector(".cplfund-card.total .v").textContent.indexOf("$" + Math.round(gross).toLocaleString("en-US")) !== -1);

  // Editable label persists.
  const remLabel = doc.querySelector('.cplfund-card input[data-edit="pool-label"][data-field="remaining_2025_26"]');
  check("each core pool box has an editable label", !!remLabel);
  commit(window, remLabel, "AB 123 rollover funds");
  check("editing a pool label persists",
    !!(T._getScenario().poolLabels && T._getScenario().poolLabels.remaining_2025_26 === "AB 123 rollover funds"));

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
  const net = D.pool.college_funding_before_feeder - D.pool.feeder_carveout - D.pool.rural_carveout;   // 34.8M − 1M − 1M
  const perYear = net / 2;
  check("hero = college funding after feeder + rural carve-outs ($" + net.toLocaleString() + ")",
    doc.querySelector(".cplfund-card.hero .v").textContent.indexOf("$" + net.toLocaleString("en-US")) !== -1);
  check("hero label states 2 annual tranches of the per-year amount",
    doc.querySelector(".cplfund-card.hero .l").textContent.indexOf("$" + Math.round(perYear).toLocaleString("en-US")) !== -1);

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
  check("year 1 shows the year-1 P1 metric", m1 && m1.value === "Headcount with any transcribed CPL");
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
    metric.value === "Headcount with any transcribed CPL");
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
  const totalHc = D.feeders.reduce(function (s, f) { return s + f.headcount; }, 0);
  const perYearPool = D.pool.feeder_carveout / 2;
  check("feeder pool per year = carve-out ÷ years ($" + Math.round(perYearPool).toLocaleString() + ")",
    feederTable.querySelector("tfoot").textContent.indexOf("$" + Math.round(perYearPool).toLocaleString("en-US")) !== -1);
  // NOCE's share = its headcount ÷ Σ feeder headcount.
  const noce = D.feeders.filter(function (f) { return f.short === "NOCE"; })[0];
  const noceAlloc = Math.round((noce.headcount / totalHc) * perYearPool);
  const noceRow = Array.from(feederTable.querySelectorAll("tbody tr")).find(function (tr) {
    return tr.textContent.indexOf("North Orange") !== -1;
  });
  check("NOCE gets its headcount share of the feeder pool",
    noceRow.textContent.indexOf("$" + noceAlloc.toLocaleString("en-US")) !== -1);

  // Editing a feeder headcount re-splits the pool + drops the "est." flag.
  const hcInput = noceRow.querySelector('input[data-edit="feeder-hc"]');
  commit(window, hcInput, "40000");
  const feederTable2 = doc.querySelectorAll(".cplfund-table")[1];
  const noceRow2 = Array.from(feederTable2.querySelectorAll("tbody tr")).find(function (tr) {
    return tr.textContent.indexOf("North Orange") !== -1;
  });
  check("editing NOCE headcount clears its est. flag", noceRow2.querySelector(".cplfund-est") === null);
  check("feeder headcount edit persisted to the scenario",
    scenSlot(window).feeders[0].headcount === 40000);

  // Carve-out edit reduces the college tranche.
  const carveInput = doc.querySelector('input[data-edit="pool"][data-field="feeder_carveout"]');
  commit(window, carveInput, "2,000,000");
  const net2 = D.pool.college_funding_before_feeder - 2000000 - D.pool.rural_carveout;
  check("raising the carve-out shrinks the college hero pool",
    doc.querySelector(".cplfund-card.hero .v").textContent.indexOf("$" + net2.toLocaleString("en-US")) !== -1);
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
    doc.querySelector('[data-edit="metric"][data-slot="1"][data-idx="0"]').value === "Headcount with any transcribed CPL");
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

// C8 — district rollup + period toggle + drill-ins (feature parity).
{
  const { window } = freshDom();
  const doc = boot(window);
  // Drill-in.
  click(window, doc.querySelector("tr.cplfund-row"));
  let detail = doc.querySelector("tr.cplfund-detail");
  check("college drill-in renders a detail row with per-priority math",
    detail && detail.textContent.indexOf("Priority 1") !== -1 && detail.textContent.indexOf("share") !== -1);
  check("drill-in shows the active year's metric", detail.textContent.indexOf("metric:") !== -1);
  click(window, doc.querySelector("tr.cplfund-row"));
  check("re-click collapses the drill-in", !doc.querySelector("tr.cplfund-detail"));

  // Year columns: SYSTEM tfoot carries each year's tranche + the window total.
  const net = D.pool.college_funding_before_feeder - D.pool.feeder_carveout - D.pool.rural_carveout;
  const tranche = net / 2;
  check("SYSTEM tfoot Total = the college pool ($" + net.toLocaleString() + ")",
    doc.querySelector("#cplFundTable .cplfund-systemrow").textContent.indexOf("$" + net.toLocaleString("en-US")) !== -1);
  check("SYSTEM tfoot year cells carry the per-year tranche ($" + Math.round(tranche).toLocaleString() + ")",
    doc.querySelector("#cplFundTable .cplfund-systemrow").textContent.indexOf("$" + Math.round(tranche).toLocaleString("en-US")) !== -1);

  // District rollup: one row per district; headcount conserves.
  const distinct = new Set(D.colleges.map(function (c) { return c.district || "(no district)"; })).size;
  click(window, doc.querySelector('#cplFundView button[data-val="district"]'));
  const dRows = doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row");
  check("district view renders one row per district (" + distinct + ")", dRows.length === distinct);
  const listHeads = D.colleges.reduce(function (s, c) { return s + (c.headcount || 0); }, 0);
  const dHead = Array.from(dRows).reduce(function (s, tr) {
    return s + Number(tr.querySelectorAll("td")[3].textContent.replace(/,/g, ""));
  }, 0);
  check("district rollup conserves the college-list headcount", dHead === listHeads);
  // District drill-in lists members.
  click(window, doc.querySelector("#cplFundTable tr.cplfund-row"));
  check("district drill-in lists member colleges",
    !!doc.querySelector("tr.cplfund-detail") &&
    doc.querySelector("tr.cplfund-detail").querySelectorAll(".cplfund-detail-grid div").length >= 1);
  // View switch resets a college-only sort key without crashing.
  click(window, doc.querySelector('#cplFundView button[data-val="college"]'));
  click(window, doc.querySelector('#cplFundTable th[data-sort="college"]'));
  click(window, doc.querySelector('#cplFundView button[data-val="district"]'));
  check("view switch resets a college-only sort key without crashing",
    doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row").length === distinct);
}

// C9 — metric-measurability actuals: Year-1 P1 (any transcribed) IS measurable
// from the daily MAP feed; the statewide-eligible metric carries an exhibit-
// linkage data-gap label; the Portal/Landing metric (P3) is wired to the
// portal-origin `pp` count (Sam, 2026-07-27) — a normal achievement-based metric
// (no full-cap advance), so without the feed it reads as pending, not a hard gap.
{
  // Without the perf artifact.
  const { window } = freshDom();
  const doc = boot(window);
  check("Y1-P1 card hints actuals arrive with the daily refresh (measurable metric)",
    doc.querySelector(".cplfund-prio .p").textContent.indexOf("next daily data refresh") !== -1);
  check("Y1-P2 card carries the exhibit-linkage data-gap label",
    doc.querySelectorAll(".cplfund-prio .p")[1].textContent.indexOf("data gap") !== -1 &&
    doc.querySelectorAll(".cplfund-prio .p")[1].textContent.indexOf("STATEWIDE credit recommendation") !== -1);
  check("Y1-P3 (Portal/Landing) is no longer a hard data gap — it's the wired portal metric",
    doc.querySelectorAll(".cplfund-prio .p")[2].textContent.indexOf("data gap") === -1 &&
    doc.querySelectorAll(".cplfund-prio .p")[2].textContent.indexOf("Portal") !== -1);
  // Per-priority table columns: the exhibit-linkage P2 cell reads "gap"; the
  // wired-but-feedless P3 cell reads the pending ellipsis (…), not "gap".
  const gapCells = doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row td.cf-prio");
  check("P2 (exhibit-linkage) cell reads 'gap'; P3 (portal, feed pending) reads '…' not 'gap'",
    gapCells[1].textContent.indexOf("gap") !== -1 &&
    gapCells[2].textContent.indexOf("…") !== -1 && gapCells[2].textContent.indexOf("gap") === -1);
}
{
  // With a synthetic perf artifact.
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = {
    as_of: "2026-06-11", suppress_below: 5,
    statewide: { p2: 9000, p3: 20000 },
    colleges: { "Alameda": { p2: 120, p3: 300 }, "Yuba": { p2: 6, p3: null, p3_suppressed: true } },
    unmatched: { "Mystery University": { p2: null, p2_suppressed: true, p3: 7 } }
  };
  const doc = boot(window);
  const p1card = doc.querySelectorAll(".cplfund-prio .p")[0];
  check("Y1-P1 card shows the any-transcribed statewide actual vs target",
    p1card.textContent.indexOf("20,000") !== -1 && p1card.textContent.indexOf("of target") !== -1);
  check("system row's P1 column carries the deduplicated statewide actual (20K, compact)",
    doc.querySelector("#cplFundTable .cplfund-systemrow td.cf-prio").textContent.indexOf("20K") !== -1);
  check("footer explains the per-priority target/actual cells + dedup",
    footText(doc).indexOf("deduplicate across colleges") !== -1 &&
    footText(doc).indexOf("target") !== -1 && footText(doc).indexOf("actual") !== -1);
  check("a non-empty unmatched bucket is surfaced in the footer",
    footText(doc).indexOf("Mystery University") !== -1);
  const rowsArr = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"));
  const alaRow = rowsArr.find(function (tr) { return tr.textContent.indexOf("Alameda") !== -1; });
  check("Alameda's P1 cell shows the any-transcribed actual (300) stacked under its target",
    alaRow.querySelector("td.cf-prio").querySelector(".cf-a").textContent.indexOf("300") !== -1);
  // Sort by the P1 (prio0) column → highest actual first.
  click(window, doc.querySelector('#cplFundTable th[data-sort="prio0"]'));
  check("sort by the P1 column puts the highest actual first",
    doc.querySelector("#cplFundTable tbody tr.cplfund-row").textContent.indexOf("Alameda") !== -1);
  // Year 2: all three metrics are gaps today (units builder / MIS match-back).
  click(window, doc.querySelector('#cplFundYear button[data-val="2"]'));
  check("Y2 cards carry data-gap labels (MIS match-back)",
    doc.querySelectorAll(".cplfund-prio .p")[1].textContent.indexOf("match-back") !== -1);
}

// C9b — measurability follows the METRIC, not the slot position (Sam, 2026-07-23).
// When priorities are REORDERED (Access ⇄ Success), the actual/data-gap must
// travel with the metric — a position-keyed map showed the "any transcribed"
// count under the statewide-eligibility priority.
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = {
    as_of: "2026-07-23", suppress_below: 5,
    statewide: { p2: 5000, p3: 16807 },
    colleges: { "Alameda": { p2: 100, p3: 250 } }, unmatched: {}
  };
  const doc = boot(window);
  // Reorder: slot-0 = statewide-eligibility (Access), slot-1 = any-transcribed
  // (Success), slot-2 = origin/Portal (Capacity) — Sam's live arrangement.
  window.CPL_FUNDING_TAB._setShared({ yearPriorities: { "1": {
    "0": { title: "Access", metric: "Headcount with Eligible CPL Based on Statewide Credit Recommendations, Joint Services Transcripts, or High School Credit" },
    "1": { title: "Success", metric: "Headcount with any transcribed CPL" },
    "2": { title: "Capacity", metric: "Headcount with Transcribed Credit from either CPL Student Portal or CPL Landing Page" }
  } } });
  window.CPL_FUNDING_TAB.render();
  const cards = doc.querySelectorAll(".cplfund-prio .p");
  check("reordered slot-0 (statewide eligibility) shows the exhibit-linkage data gap, not a number",
    cards[0].textContent.indexOf("data gap") !== -1 &&
    cards[0].textContent.indexOf("STATEWIDE credit recommendation") !== -1 &&
    cards[0].textContent.indexOf("16,807") === -1);
  check("reordered slot-1 (any transcribed) now carries the measurable actual (16,807 of target)",
    cards[1].textContent.indexOf("16,807") !== -1 && cards[1].textContent.indexOf("of target") !== -1);
  check("reordered slot-2 (Portal/Landing) carries the wired portal metric, not the eligibility gap",
    cards[2].textContent.indexOf("data gap") === -1 &&
    cards[2].textContent.indexOf("STATEWIDE credit recommendation") === -1 &&
    cards[2].textContent.indexOf("Portal") !== -1);
}

// C9c — Projection % row is clarified as a target that does NOT move/cap dollars.
{
  const { window } = freshDom();
  const doc = boot(window);
  const box = doc.querySelector(".cplfund-prio .p").textContent;
  check("projection line clarifies it does not cap funding + points at the Allocation share",
    box.indexOf("cap the funding") !== -1 && box.indexOf("Allocation share above") !== -1);
}

// C9d — Allocation-balance box in the Funding Pool area (Sam, 2026-07-23).
{
  const { window } = freshDom();
  const doc = boot(window);
  const bal = doc.querySelector(".cplfund-card.balance");
  check("a balance box renders in the pool area", !!bal);
  check("at 100% shares the balance is $0 (fully apportioned)",
    bal && bal.querySelector(".v").textContent.trim() === "$0" &&
    bal.textContent.indexOf("fully apportioned") !== -1 && bal.textContent.indexOf("100%") !== -1);
  check("balance box is not flagged over-allocated at 100%", bal && !bal.classList.contains("over"));
  // Push the shares past 100% → over-allocated, red, and quantified.
  commit(window, doc.querySelector('input[data-edit="share"][data-slot="1"][data-idx="0"]'), "60");
  const over = doc.querySelector(".cplfund-card.balance");
  check("shares over 100% flag the balance box as over-allocated (red border class)",
    over && over.classList.contains("over"));
  check("over-allocated balance names the overage + the >100% share sum",
    over && over.textContent.indexOf("Over-allocated") !== -1 &&
    over.textContent.indexOf("130%") !== -1 && over.querySelector(".v.neg"));
}

// C9e — the priority box + timing rows share one body-copy size (Sam, 2026-07-23).
{
  check("priority .nums / .desc / .metric all use the unified .8rem size",
    /\.cplfund-prio \.p \.nums \{[^}]*font-size:\s*\.8rem/.test(consumerSrc) &&
    /\.cplfund-prio \.p \.desc \{[^}]*font-size:\s*\.8rem/.test(consumerSrc) &&
    /\.cplfund-prio \.p \.metric \{[^}]*font-size:\s*\.8rem/.test(consumerSrc));
  check("strategies list + timing rows also carry the unified size",
    /\.cplfund-strat \{[^}]*font-size:\s*\.8rem/.test(consumerSrc) &&
    /\.cplfund-timing \{[^}]*font-size:\s*\.8rem/.test(consumerSrc));
  check("the priority TITLE stays larger than the body copy (1rem)",
    /\.cplfund-prio-title-input \{[^}]*font-size:\s*1rem/.test(consumerSrc) &&
    /\.cplfund-prio \.p h4 \{[^}]*font-size:\s*1rem/.test(consumerSrc));
}

// C10 — failure mode: data never arrives (404 → loadScript fails soft).
{
  const { window } = freshDom();
  window.eval(consumerSrc);
  let threw = false;
  try {
    window.CPL_FUNDING_TAB.boot();
    const s = window.document.querySelector('script[src="cpl_funding_data.js"]');
    s.dispatchEvent(new window.Event("error"));
  } catch (e) { threw = true; console.error(e); }
  check("missing-data boot does not throw", !threw);
  check("missing-data renders graceful empty state",
    window.document.getElementById("cplFundingMount").textContent.indexOf("unavailable") !== -1);
  check("DRAFT chip shows even in the no-data state", !!window.document.getElementById("cplFundingDraftChip"));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part D — the 2026-07-06 equity refinements (front-load · floor · rural ·
// eligibility). Data defaults first, then renderer behaviour.
// ─────────────────────────────────────────────────────────────────────────────

// D0 — data defaults for all four features.
check("data: disbursement defaults to even tranches", D.disbursement === "even");
check("data: minimum-viable floor default $150K/window", D.pool.floor_window === 150000);
check("data: rural carve-out default $1M", D.pool.rural_carveout === 1000000);
check("data: rural threshold default 50%", D.rural_threshold === 0.5);
check("data: exactly the 10 RCTC colleges are rural-flagged",
  D.colleges.filter(function (c) { return c.rural; }).length === 10 &&
  ["Butte", "Redwoods", "Siskiyous", "Feather River", "Lassen",
   "Lake Tahoe", "Mendocino", "Shasta", "Woodland", "Yuba"].every(function (n) {
    return D.colleges.some(function (c) { return c.college === n && c.rural === true; });
  }));
check("data: rural roster carries a DRAFT provenance note", /DRAFT/.test(D.rural_source || ""));
check("data: participation deadline default Sept 1, 2026", D.participation_deadline === "2026-09-01");

// D1 — minimum-viable floor: waterfall math (model-level, via test hooks).
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const m = T._model();
  const net = T._netCollege();
  check("floor model: pool conserved (Σ window entitlements = net pool)",
    Math.abs(Object.values(m.W).reduce(function (s, w) { return s + w; }, 0) - net) < 1);
  check("floor model: no college below the $150K floor",
    Object.values(m.W).every(function (w) { return w >= m.floor - 0.01; }));
  check("floor model: floored set is non-empty and bounded (sub-scale colleges only)",
    m.floorCount > 0 && m.floorCount < 40);
  check("floor model: smallest college (Copper Mountain) sits exactly at the floor",
    Math.abs(m.W["Copper Mountain"] - m.floor) < 0.01);
  check("floor model: largest college (East LA) stays proportional (well above floor)",
    m.W["East LA"] > 900000);
  const cm = T._alloc("Copper Mountain");
  check("floored college's window total = the floor", Math.abs(cm.total - m.floor) < 0.01);
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
  check("floor 0 → pure proportional (Copper Mountain ≈ headcount share × net)",
    Math.abs(m0.W["Copper Mountain"] -
      D.colleges.find(function (c) { return c.college === "Copper Mountain"; }).headcount_pct * net) < 1);
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
  // The label is now an editable input, so "carve-out" lives in its value, not textContent.
  check("rural carve-out pool card renders as a deduction", !!(ruralCard && ruralCard.querySelector(".v.neg") &&
    /carve-out/.test((ruralCard.querySelector('input[data-edit="pool-label"]') || {}).value || "")));
  const ruralTable = doc.querySelectorAll(".cplfund-table")[2];
  check("rural section lists the 10 rural-flagged colleges",
    ruralTable && ruralTable.querySelectorAll("tbody tr").length === 10);
  const perRural = D.pool.rural_carveout / 10;
  check("each rural college can earn an equal share ($" + perRural.toLocaleString() + ")",
    ruralTable.textContent.indexOf("$" + perRural.toLocaleString("en-US")) !== -1);
  check("no actuals loaded → every rural row is pending data",
    Array.from(ruralTable.querySelectorAll("tbody tr")).every(function (tr) {
      return tr.textContent.indexOf("pending data") !== -1;
    }));
  const butteRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr")).find(function (tr) {
    return tr.textContent.indexOf("Butte") !== -1;
  });
  check("rural college row carries the 🌲 chip", butteRow && butteRow.innerHTML.indexOf("🌲") !== -1);

  // With actuals: attainment vs targets gates the allowance.
  const butte = D.colleges.find(function (c) { return c.college === "Butte"; });
  const p1 = D.year_priorities["1"][0];
  const target = butte.headcount * p1.target_rate;
  window.CPL_FUNDING_PERF = {
    as_of: "2026-07-06", suppress_below: 5,
    statewide: { p2: 1000, p3: 1000 },
    colleges: { "Butte": { p2: 10, p3: Math.ceil(target) } },   // ≥100% of the P1 target
    unmatched: {}
  };
  T.render();
  const ruralTable2 = doc.querySelectorAll(".cplfund-table")[2];
  const butteRural = Array.from(ruralTable2.querySelectorAll("tbody tr")).find(function (tr) {
    return tr.textContent.indexOf("Butte") !== -1;
  });
  check("rural college at ≥50% of measurable Yr-1 targets qualifies",
    butteRural && butteRural.textContent.indexOf("✓ qualifies") !== -1);
  check("rural tfoot counts qualifiers honestly (1 of 10)",
    ruralTable2.querySelector("tfoot").textContent.indexOf("1 of 10 qualify") !== -1);

  // Threshold is editable: raise it to 200% → Butte no longer qualifies.
  const thr = doc.querySelector('input[data-edit="rural-threshold"]');
  commit(window, thr, "200");
  check("threshold edit persisted (scenario)", T._getScenario().ruralThreshold === 2);
  const ruralTable3 = doc.querySelectorAll(".cplfund-table")[2];
  check("raised threshold demotes the qualifier",
    ruralTable3.querySelector("tfoot").textContent.indexOf("0 of 10 qualify") !== -1);

  // Rural flag override via config (the drill-in button's write path).
  T._setScenario({ ruralOverrides: { "Alameda": true, "Butte": false } });
  T.render();
  const ruralTable4 = doc.querySelectorAll(".cplfund-table")[2];
  check("rural overrides add/remove colleges from the roster",
    ruralTable4.textContent.indexOf("Alameda") !== -1 &&
    Array.from(ruralTable4.querySelectorAll("tbody tr")).every(function (tr) {
      return tr.textContent.indexOf("Butte") === -1;
    }));
  delete window.CPL_FUNDING_PERF;
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
  check("SYSTEM tfoot shows the coordinator coverage fraction",
    doc.querySelector("#cplFundTable .cplfund-systemrow").textContent.indexOf("2/" + D.colleges.length) !== -1);
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

// D5 — noncredit student counts are included in the totals (Sam, 2026-07-06):
// the SYSTEM headcount total shows allocation basis + feeders = CCC total in
// BOTH table views (the pool card already showed it).
{
  const { window } = freshDom();
  const doc = boot(window);
  const feederSum = D.feeders.reduce(function (s, f) { return s + f.headcount; }, 0);
  const combined = (D.system.headcount + feederSum).toLocaleString("en-US");
  check("college-view SYSTEM row includes the noncredit feeders in the CCC total",
    doc.querySelector("#cplFundTable .cplfund-systemrow").textContent.indexOf(combined) !== -1 &&
    doc.querySelector("#cplFundTable .cplfund-systemrow").textContent.indexOf("noncredit") !== -1);
  click(window, doc.querySelector('#cplFundView button[data-val="district"]'));
  check("district-view SYSTEM row includes the noncredit feeders in the CCC total",
    doc.querySelector("#cplFundTable .cplfund-systemrow").textContent.indexOf(combined) !== -1);
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

// ─────────────────────────────────────────────────────────────────────────────
// Part E — the 2026-07-06 evening batch (Sam's 8+3): county hidden, eligible
// column, count note, floor-targets note, seal-blue, scenarios, exports,
// monitor notes, alignment polish.
// ─────────────────────────────────────────────────────────────────────────────

// E1 — table refinements.
{
  const { window } = freshDom();
  const doc = boot(window);
  check("County column is hidden (data stays in drill-in + CSV)",
    !doc.querySelector('#cplFundTable th[data-sort="county"]'));
  check("per-priority P1/P2/P3 columns render (replacing Eligible/Transcribed)",
    !!doc.querySelector('th[data-sort="prio0"]') && !!doc.querySelector('th[data-sort="prio1"]') &&
    !!doc.querySelector('th[data-sort="prio2"]') &&
    doc.querySelector('th[data-sort="prio0"]').textContent.indexOf("P1") !== -1);
  check("a P1 column header hover carries the priority goal + metric",
    (doc.querySelector('th[data-sort="prio0"]').getAttribute("title") || "").indexOf("METRIC:") !== -1);
  check("count note includes the noncredit campuses",
    doc.getElementById("cplFundCount").textContent.indexOf("noncredit campuses") !== -1 &&
    doc.getElementById("cplFundCount").textContent.indexOf("carve-out") !== -1);
  check("floor note: funding raised, targets not (formula)",
    doc.querySelector(".cplfund-formula").textContent.indexOf("not its targets") !== -1);
  // Drill-in county context survives the hidden column.
  click(window, doc.querySelector("tr.cplfund-row"));
  check("drill-in still shows the county context",
    doc.querySelector("tr.cplfund-detail").textContent.indexOf("County context") !== -1);
  // Priority-column actuals render from the perf artifact (measurable P1 = p3).
  window.CPL_FUNDING_PERF = {
    as_of: "2026-07-06", suppress_below: 5,
    statewide: { pe: 50000, p2: 100, p3: 20000 },
    colleges: { "Alameda": { pe: 777, p2: 10, p3: 300 } }, unmatched: {}
  };
  window.CPL_FUNDING_TAB.render();
  const alamedaRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find(function (tr) {
    return tr.textContent.indexOf("Alameda") !== -1;
  });
  check("Alameda's P1 cell shows the measurable actual (300) in its actual line",
    alamedaRow.querySelector("td.cf-prio .cf-a").textContent.indexOf("300") !== -1);
  check("SYSTEM P1 cell shows the statewide measurable actual (20K, compact)",
    doc.querySelector("#cplFundTable .cplfund-systemrow td.cf-prio").textContent.indexOf("20K") !== -1);
  delete window.CPL_FUNDING_PERF;
}

// E2 — CO seal-blue on the previously-black backgrounds.
{
  const { window } = freshDom();
  const doc = boot(window);
  const css = doc.getElementById("cpl-funding-css").textContent;
  ["card.hero", "table th", "seg button.on"].forEach(function (which) {});
  check("hero card background = seal blue", /cplfund-card\.hero \{ background: var\(--seal-blue\)/.test(css));
  check("table header background = seal blue", /cplfund-table th \{ background: var\(--seal-blue\)/.test(css));
  check("active seg button background = seal blue", /seg button\.on \{ background: var\(--seal-blue\)/.test(css));
  check("no black/charcoal backgrounds remain (navy-primary only as text color)",
    !/background: var\(--navy-primary\)/.test(css));
  // Alignment polish (Sam's screenshot): pool values centered, priority labels
  // left, small numeric inputs centered.
  check("pool-card values are centered", /cplfund-card \.v \{[^}]*text-align: center/.test(css));
  check("priority labels are left-aligned",
    /cplfund-prio \.p h4 \{[^}]*text-align: left/.test(css));
  check("priority-box inputs are centered", /cplfund-ed-s \{[^}]*text-align: center/.test(css));
}

// E3 — the shared project + scenario layer (Sam, 2026-07-23): selectors render
// for everyone; ＋New / ＋Project are curator-gated; a locked edit is a per-browser
// what-if overlay on the selected shared scenario.
{
  const { window } = freshDom();
  const doc = boot(window);
  check("project + scenario selectors render at the top",
    !!doc.getElementById("cplFundProjSel") && !!doc.getElementById("cplFundScenSel"));
  check("default project is the CPL Implementation project, tagged CPL",
    doc.getElementById("cplFundProjSel").textContent.indexOf("CPL Implementation and Project Funding") !== -1 &&
    doc.querySelector(".cplfund-area").textContent.indexOf("CPL") !== -1);
  check("locked mode hides ＋New / ＋Project (curator-only) + shows the unlock hint",
    !doc.getElementById("cplFundScenNew") && !doc.getElementById("cplFundProjAdd") &&
    !!doc.querySelector(".cplfund-ctl-hint"));
  commit(window, doc.querySelector('input[data-edit="pool"][data-field="feeder_carveout"]'), "2,000,000");
  check("locked edit lands in the CPL / Scenario-1 what-if overlay",
    scenSlot(window, "Scenario 1").pool.feeder_carveout === 2000000);
}

// E3b — curator (unlocked): ＋New CLONES the current scenario; ＋Project clones the
// CPL template into a new project tagged with a COBI area.
{
  const { window } = freshDom();
  window.CPL_ORGS = { ORGS: [
    { id: "cpl", label: "CPL", full: "CPL Initiative" },
    { id: "ci",  label: "C&I", full: "Curriculum & Instruction" },
    { id: "cip", label: "CIP", full: "TOP-to-CIP Transition" },
    { id: "gr",  label: "GR",  full: "Government Relations" }
  ] };
  window.CPL_TEAM_PHRASE = {
    _pass: "x",
    session: function () { return this._pass ? { teamPass: this._pass, email: "(team)" } : null; },
    clear: function () { this._pass = null; },
    decorateHeaders: function (h) { return h; },
    checkWrite: function () { return Promise.resolve({ ok: true, status: 200 }); },
    handleWriteFailure: function () { return false; },
    unlockRow: function () { return window.document.createElement("span"); }
  };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  check("curator sees ＋New + ＋Project", !!doc.getElementById("cplFundScenNew") && !!doc.getElementById("cplFundProjAdd"));
  // Edit Scenario 1 (unlocked → shared), then ＋New clones it.
  commit(window, doc.querySelector('input[data-edit="pool"][data-field="feeder_carveout"]'), "2,000,000");
  click(window, doc.getElementById("cplFundScenNew"));
  check("＋New creates Scenario 2 that CLONES the current scenario (not blank)",
    T._scenario().name === "Scenario 2" && T._getShared().pool.feeder_carveout === 2000000);
  // The clone is independent.
  commit(window, doc.querySelector('input[data-edit="pool"][data-field="feeder_carveout"]'), "3,000,000");
  const cfg = T._config();
  check("cloned scenarios are independent",
    cfg.projects["cpl-implementation"].scenarios["Scenario 2"].pool.feeder_carveout === 3000000 &&
    cfg.projects["cpl-implementation"].scenarios["Scenario 1"].pool.feeder_carveout === 2000000);
  const scenSel = doc.getElementById("cplFundScenSel");
  scenSel.value = "Scenario 1"; scenSel.dispatchEvent(new window.Event("change"));
  check("switching scenario restores its model", T._getShared().pool.feeder_carveout === 2000000);
  // ＋Project → the add form → create a C&I project cloning the current (CPL) model.
  click(window, doc.getElementById("cplFundProjAdd"));
  const nameEl = doc.getElementById("cplFundProjName");
  const areaEl = doc.getElementById("cplFundProjArea");
  check("add-project form renders with a name input + area <select> of the COBI areas",
    !!nameEl && !!areaEl && areaEl.querySelectorAll("option").length === 4);
  nameEl.value = "C&I Faculty Support"; areaEl.value = "ci";
  click(window, doc.getElementById("cplFundProjCreate"));
  const cfg2 = T._config();
  const newPid = T._scenario().project;
  check("＋Project creates a new project tagged with the chosen area, cloning the CPL template",
    newPid !== "cpl-implementation" &&
    cfg2.projects[newPid].area === "ci" &&
    cfg2.projects[newPid].label === "C&I Faculty Support" &&
    cfg2.projects[newPid].scenarios["Scenario 1"].pool.feeder_carveout === 2000000);
  check("the area badge reflects the active project's area",
    doc.querySelector(".cplfund-area").textContent.indexOf("C&I") !== -1);
  delete window.CPL_ORGS;
}

// E3c — normalizeConfig migration: an OLD flat override becomes CPL / Scenario 1.
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const migrated = T._normalizeConfig({ disbursement: "frontload", pool: { feeder_carveout: 500000 } });
  check("normalizeConfig wraps a flat override as the CPL project's Scenario 1",
    migrated.projects["cpl-implementation"].area === "cpl" &&
    migrated.projects["cpl-implementation"].scenarios["Scenario 1"].disbursement === "frontload");
  T._setConfig({ disbursement: "frontload", pool: { feeder_carveout: 500000 } });
  T.render();
  check("a migrated flat config drives the model (frontload applied)",
    doc.querySelector('#cplFundDisb button[data-val="frontload"]').className === "on");
}

// E3d — a legacy per-browser scenario store migrates into the what-if overlay.
{
  const dom2 = freshDom();
  dom2.window.localStorage.setItem("cpl_funding_scenarios_v2",
    JSON.stringify({ active: "Scenario 1", scenarios: { "Scenario 1": { disbursement: "frontload" } } }));
  const doc2 = boot(dom2.window);
  check("legacy per-browser scenario migrates into the CPL / Scenario-1 what-if overlay",
    dom2.window.CPL_FUNDING_TAB._getScenario().disbursement === "frontload" &&
    doc2.querySelector('#cplFundDisb button[data-val="frontload"]').className === "on");
}

// E-Report — the editable ESS-25-82 memo Report sub-view (Sam, 2026-07-23).
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  check("Report sub-tab renders alongside the Funding-model tab",
    doc.querySelectorAll('#cplFundingMount [data-subview]').length === 2 &&
    !!doc.querySelector('[data-subview="report"]'));
  T._setSubview("report");
  check("Report view renders an editable memo + doc-type toolbar + Copy/PDF/Word exports",
    !!doc.getElementById("cplFundMemo") &&
    doc.getElementById("cplFundMemo").getAttribute("contenteditable") === "true" &&
    !!doc.getElementById("cplFundDocType") &&
    !!doc.getElementById("cplFundMemoPdf") && !!doc.getElementById("cplFundMemoDocx") && !!doc.getElementById("cplFundMemoCopy"));
  // The default memo carries the ESS-25-82 skeleton.
  const memo = T._buildMemo("memo");
  ["MEMORANDUM", "TO:", "FROM:", "RE:", "Funding Overview", "Priority Outcomes",
   "Allowable Use of Funds", "Outcomes Reporting", "Conclusion", "cc:"].forEach(function (sec) {
    check("memo includes the ESS section — " + sec, memo.indexOf(sec) !== -1);
  });
  // The memo reflects the live model numbers + priorities + allocation.
  const totalAvail = "$" + Math.round(D.pool.remaining_2025_26 + D.pool.one_time_2026_27).toLocaleString("en-US");
  check("memo Funding Overview carries the Total Available Funds figure", memo.indexOf(totalAvail) !== -1);
  check("memo lists the three priorities",
    D.year_priorities["1"].every(function (p) { return memo.indexOf(p.label) !== -1; }));
  check("memo allocation table carries the SYSTEM statewide total", memo.indexOf("SYSTEM (statewide)") !== -1);
  // Doc-type variants share the body but differ in framing.
  const letter = T._buildMemo("letter");
  const brief = T._buildMemo("brief");
  const report = T._buildMemo("report");
  check("Letter uses a Dear Colleague greeting (no MEMORANDUM header)",
    letter.indexOf("Dear Colleague") !== -1 && letter.indexOf("MEMORANDUM") === -1);
  check("Brief is condensed (no cc / TO block)", brief.indexOf("cc:") === -1 && brief.indexOf("TO:") === -1);
  check("Report is titled (no MEMORANDUM / TO block) but keeps the body",
    report.indexOf("MEMORANDUM") === -1 && report.indexOf("Funding Overview") !== -1);
  // The memo tracks the active project's AREA framing.
  check("memo RE line reflects the project area (CPL Initiative)", memo.indexOf("CPL Initiative") !== -1);
}

// E4 — exports.
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  check("toolbar renders ⬇ Excel + ⬇ PDF buttons",
    !!doc.getElementById("cplFundCsv") && !!doc.getElementById("cplFundPdf"));
  const csv = T._csv();
  const lines = csv.split("\r\n");
  check("CSV: meta line + header + one line per college + SYSTEM",
    lines.length === 2 + D.colleges.length + 1 && lines[0].indexOf("DRAFT model") !== -1);
  check("CSV: header carries County + per-priority target/actual + eligibility + rural/floor",
    lines[1].indexOf("County") !== -1 && lines[1].indexOf("P1 target") !== -1 && lines[1].indexOf("P1 actual") !== -1 &&
    lines[1].indexOf("Rural") !== -1 && lines[1].indexOf("Floor applied") !== -1);
  check("CSV: a rural floored college carries its flags",
    lines.some(function (l) { return l.indexOf("Feather River") !== -1 && l.indexOf("rural") !== -1 && l.indexOf("floor") !== -1; }));
  check("CSV: SYSTEM row includes the noncredit-inclusive headcount",
    lines[lines.length - 1].indexOf(String(D.system.headcount + D.feeders.reduce(function (s, f) { return s + f.headcount; }, 0))) !== -1);
  check("CSV: no HTML entities leak", csv.indexOf("&lt;") === -1 && csv.indexOf("<span") === -1);
  const ph = T._printHtml();
  check("print HTML: standalone doc with the seal-blue header style",
    ph.indexOf("<!doctype html>") === 0 && ph.indexOf("#002F6D") !== -1);
  check("print HTML: inputs flattened to text (no form controls)",
    ph.indexOf("<input") === -1 && ph.indexOf("<select") === -1 && ph.indexOf("<button") === -1 &&
    ph.indexOf("<textarea") === -1);
  check("print HTML: priority metric textarea flattens to its text (survives print)",
    ph.indexOf("Headcount with any transcribed CPL") !== -1);
  check("print HTML: the college table content survives",
    ph.indexOf("SYSTEM (statewide)") !== -1);
}

// E5 — CO Monitor's notes (gated).
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  check("consumer targets the gated cpl_funding_notes table", /cpl_funding_notes/.test(consumerSrc));
  // Anonymous: no notes fetched → no note line in the drill-in.
  click(window, doc.querySelector("tr.cplfund-row"));
  check("anonymous drill-in shows no monitor-note UI",
    doc.querySelector("tr.cplfund-detail").textContent.indexOf("CO Monitor") === -1);
  // Phrase-holder (read-only view): a fetched note renders as text.
  T._setNotes({ "Alameda": { college: "Alameda", note: "Coordinator hire in progress.", updated_at: "2026-07-06T20:00:00Z" } });
  T.render();
  window.eval('CPL_FUNDING_TAB._state.open["c:' + D.colleges.find(function (c) { return c.college === "Alameda"; }).order + '"] = true;');
  T.render();
  const detail = Array.from(doc.querySelectorAll("tr.cplfund-detail")).find(function (tr) {
    return tr.textContent.indexOf("Alameda") !== -1 || tr.textContent.indexOf("Coordinator hire") !== -1;
  });
  check("fetched note renders read-only in the drill-in",
    detail && detail.textContent.indexOf("Coordinator hire in progress.") !== -1 &&
    !detail.querySelector("textarea"));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part E — achievement-based earning (Sam, 2026-07-24): allocation = CAP; a
// college is paid on the CPL it actually posts in MAP, proportional to target,
// capped at 100%; unearned rolls forward. Phase-in: data-gap metrics advance at
// full cap; a college that posts nothing on a MEASURABLE metric earns $0 (the
// incentive). Default data order: Year-1 P1 ("any transcribed") is the one
// measurable metric; P2 (+ all of Year 2) are data gaps. P3 (Portal) is now a
// measurable metric (→ pp); Part E overrides it to a data gap so its "only P1
// flexes" model holds — the pp/achievement-based path is exercised in Part H5.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-07-24", suppress_below: 5,
    statewide: { p2: 9000, p3: 16807 },
    colleges: { "Laney": { p2: 120, p3: 200 }, "Yuba": { p2: 6, p3: null, p3_suppressed: true } },
    unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  // Hold P3 as a data gap for this part (see the note above).
  T._setShared({ yearPriorities: { "1": { "2": { metric: "Headcount with CPL Matched in MAP and MIS" } } } });
  T.render();

  check("E: basis defaults to potential (cap)", T._state.basis === "potential");
  check("E: basis toggle renders both options",
    !!doc.querySelector('#cplFundBasis button[data-val="potential"]') &&
    !!doc.querySelector('#cplFundBasis button[data-val="earned"]'));
  const potRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find(function (r) { return /Laney/.test(r.textContent); });
  check("E: potential mode Total cell shows the cap (no earned sub)",
    potRow.querySelector("td.tot").textContent.indexOf("of ") === -1);

  T._state.basis = "earned"; T.render();
  check("E: earned basis now selected", !!doc.querySelector('#cplFundBasis button[data-val="earned"].on'));

  const la = T._alloc("Laney");   // in-feed, underachieving on the measurable P1
  const f = Math.min(1, 200 / la.p1_heads);
  check("E: in-feed underachiever earns cap − its Year-1 P1 shortfall (earned = cap × actual/target)",
    Math.abs(la.earned_total - (la.total - la.p1 * (1 - f))) < 1);
  check("E: earned is strictly below cap when underachieving, and positive",
    la.earned_total < la.total && la.earned_total > 0);

  const bc = T._alloc("Berkeley City");   // NOT in the feed → $0 on the measurable P1
  check("E: a college absent from the feed earns $0 on the measurable priority (= cap − P1)",
    Math.abs(bc.earned_total - (bc.total - bc.p1)) < 1);

  check("E: earned + unearned pool cards render in earned mode",
    !!doc.querySelector(".cplfund-card.earned") && !!doc.querySelector(".cplfund-card.unearned"));

  const pcards = doc.querySelectorAll(".cplfund-prio .p");
  check("E: measurable priority card shows an earned-so-far line (not full advance)",
    pcards[0].textContent.indexOf("Earned so far") !== -1 && pcards[0].textContent.indexOf("full advance") === -1);
  check("E: data-gap priority cards show full advance until the feed lands",
    pcards[1].textContent.indexOf("full advance") !== -1 && pcards[2].textContent.indexOf("full advance") !== -1);

  const earnRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find(function (r) { return /Laney/.test(r.textContent); });
  check("E: earned mode Total cell shows earned with the cap in a sub",
    !!earnRow.querySelector("td.tot .sub") && earnRow.querySelector("td.tot").textContent.indexOf("of ") !== -1);

  const csv = T._csv().split("\r\n");
  check("E: CSV adds Earned + % of cap columns in earned mode",
    csv[1].indexOf("Earned ") !== -1 && csv[1].indexOf("% of cap") !== -1);
  check("E: CSV meta flags the EARNED basis", csv[0].indexOf("EARNED basis") !== -1);
}
{
  // Capped at 100%: an overachiever earns its FULL cap (never more).
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-07-24", suppress_below: 5,
    statewide: { p3: 16807 }, colleges: { "Laney": { p3: 9999999 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": { "2": { metric: "Headcount with CPL Matched in MAP and MIS" } } } });  // hold P3 as a gap
  T._state.basis = "earned"; T.render();
  const la = T._alloc("Laney");
  check("E: overachiever is capped at 100% of its cap (earned == cap)", Math.abs(la.earned_total - la.total) < 1);
  window.eval('CPL_FUNDING_TAB._state.open["c:' + D.colleges.find(function (c) { return c.college === "Laney"; }).order + '"] = true;');
  T.render();
  const det = doc.querySelector("tr.cplfund-detail");   // only Laney is open
  check("E: drill-in shows the per-priority earned line", !!det && det.textContent.indexOf("earned:") !== -1);
}
{
  // Feed not loaded → everything advances at full cap (transient), earned == cap.
  const { window } = freshDom();
  const doc = boot(window);   // no CPL_FUNDING_PERF
  const T = window.CPL_FUNDING_TAB;
  T._state.basis = "earned"; T.render();
  const la = T._alloc("Laney");
  check("E: feed not loaded → earned advances at full cap (earned == cap)", Math.abs(la.earned_total - la.total) < 1);
}
{
  // Suppressed (<5): earns $0 on the measurable priority + is flagged, not blind-credited.
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-07-24", suppress_below: 5,
    statewide: { p3: 16807 }, colleges: { "Yuba": { p3: null, p3_suppressed: true } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": { "2": { metric: "Headcount with CPL Matched in MAP and MIS" } } } });  // hold P3 as a gap
  T._state.basis = "earned"; T.render();
  const yu = T._alloc("Yuba");
  check("E: suppressed college earns $0 on the measurable priority (= cap − P1)",
    Math.abs(yu.earned_total - (yu.total - yu.p1)) < 1);
  window.eval('CPL_FUNDING_TAB._state.open["c:' + D.colleges.find(function (c) { return c.college === "Yuba"; }).order + '"] = true;');
  T.render();
  const det = doc.querySelector("tr.cplfund-detail");   // only Yuba is open
  check("E: suppressed shows a privacy-suppressed note in the drill-in", !!det && det.textContent.indexOf("privacy-suppressed") !== -1);
}
{
  // Conservation: earned ≤ cap for every college, and the pool 'unearned' = Σ (cap − earned).
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-07-24", suppress_below: 5,
    statewide: { p3: 16807 }, colleges: { "Laney": { p3: 200 }, "Alameda": { p3: 80 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._state.basis = "earned"; T.render();
  const D2 = window.CPL_FUNDING;
  let capSum = 0, earnSum = 0, everOver = false;
  D2.colleges.forEach(function (c) { var a = T._alloc(c.college); capSum += a.total; earnSum += a.earned_total; if (a.earned_total > a.total + 1) everOver = true; });
  check("E: no college ever earns above its cap", !everOver);
  check("E: system earned ≤ system cap and > 0", earnSum <= capSum + 1 && earnSum > 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part F — column show/hide (Sam, 2026-07-24): a ⚙ Columns menu; county hidden
// by default; per-view + persisted; CSS nth-child hiding that spares detail rows;
// the identity column (College) is never hideable. Plus the Elig tooltip audit.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  check("F: ⚙ Columns menu renders", !!doc.querySelector(".cplfund-colmenu"));
  const keys = Array.from(doc.querySelectorAll(".cplfund-colmenu input[data-colkey]")).map(function (cb) { return cb.getAttribute("data-colkey"); });
  check("F: the College identity column is NOT hideable (absent from the menu)", keys.indexOf("college") === -1);
  check("F: other columns are hideable (district, headcount, total in the menu)",
    keys.indexOf("district") !== -1 && keys.indexOf("headcount") !== -1 && keys.indexOf("total") !== -1);
  const waCb = doc.querySelector('.cplfund-colmenu input[data-colkey="working_adults"]');
  check("F: county (working adults) is unchecked/hidden by default", !!waCb && !waCb.checked);
  const style0 = doc.querySelector("#cplFundTable style");
  check("F: a hide <style> is injected for the default-hidden county", !!style0 && /nth-child/.test(style0.textContent));
  check("F: the hide rule excludes detail rows so a drill-in never collapses",
    style0.textContent.indexOf(":not(.cplfund-detail)") !== -1);

  const distCb = doc.querySelector('.cplfund-colmenu input[data-colkey="district"]');
  distCb.checked = false; distCb.dispatchEvent(new window.Event("change", { bubbles: true }));
  const style1 = doc.querySelector("#cplFundTable style").textContent;
  check("F: hiding District injects an nth-child(3) hide rule", style1.indexOf("nth-child(3)") !== -1);
  check("F: the column choice persists to localStorage",
    JSON.parse(window.localStorage.getItem("cplfund_cols_v1")).college.district === true);
  distCb.checked = true; distCb.dispatchEvent(new window.Event("change", { bubbles: true }));
  const style2 = doc.querySelector("#cplFundTable style");
  check("F: re-showing District removes its hide rule",
    (style2 ? style2.textContent : "").indexOf("nth-child(3)") === -1);

  const eligTh = doc.querySelector('#cplFundTable th[data-sort="elig"]');
  check("F: Elig column tooltip clarifies the participate-vs-earn structure",
    (eligTh.getAttribute("title") || "").indexOf("PARTICIPATE") !== -1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part G — per-priority P1/P2/P3 columns (target over actual) + the numbered
// Elig pie glyph (Sam, 2026-07-24).
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-07-24", suppress_below: 5,
    statewide: { p3: 16807 }, colleges: { "Laney": { p3: 200 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const laney = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find(function (r) { return /Laney/.test(r.textContent); });
  const cells = laney.querySelectorAll("td.cf-prio");
  check("G: three per-priority columns render per college row", cells.length === 3);
  check("G: each priority cell stacks a target line over an actual line",
    !!cells[0].querySelector(".cf-t") && !!cells[0].querySelector(".cf-a"));
  check("G: the measurable P1 cell shows the actual + a % of target",
    cells[0].querySelector(".cf-a").textContent.indexOf("200") !== -1 && cells[0].textContent.indexOf("%") !== -1);
  check("G: a data-gap priority cell reads 'gap' in its actual line",
    cells[1].querySelector(".cf-a").textContent.indexOf("gap") !== -1);
  check("G: the priority cell carries funding (a $ figure) alongside the metric",
    /\$/.test(cells[0].textContent));
  check("G: the P1 header hover carries the priority goal + metric",
    (doc.querySelector('th[data-sort="prio0"]').getAttribute("title") || "").indexOf("METRIC:") !== -1);
  // The Elig pie: a college meeting both tracked reqs shows 2 numbered green slices.
  T._setElig({ coordOk: true, coord: { "Laney": true }, optin: { "Laney": true }, asOf: "2026-07-24" });
  T.render();
  const laney2 = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find(function (r) { return /Laney/.test(r.textContent); });
  const pie = laney2.querySelector(".cf-eligpie");
  check("G: the Elig glyph is an SVG pie", !!pie && pie.tagName.toLowerCase() === "svg");
  check("G: the pie has one numbered slice per tracked requirement, all green when met",
    pieSlices(laney2) === 2 && greenSlices(laney2) === 2 &&
    Array.from(pie.querySelectorAll("text")).map(function (t) { return t.textContent; }).join("") === "12");
}

// ─────────────────────────────────────────────────────────────────────────────
// Part H — per-student funding rate (Sam, 2026-07-27): the curator types a
// $/student rate; the # students + % of headcount are DERIVED. Plus collapsible
// sections and the reworded P1 (eligible→pe) / P3 (portal→pp) metric wiring.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;

  // H1 — the priority card takes a per-student $ input, not a % input.
  check("H1: priority card renders a per-student ($/student) input",
    !!doc.querySelector('input[data-edit="perstudent"][data-slot="1"][data-idx="0"]'));
  check("H1: no legacy 'target' (% of headcount) input is rendered",
    !doc.querySelector('input[data-edit="target"]'));
  check("H1: the priority line reads 'per student' + shows the derived % of headcount",
    doc.querySelector(".cplfund-prio .p").textContent.indexOf("per student") !== -1 &&
    doc.querySelector(".cplfund-prio .p").textContent.indexOf("of headcount") !== -1);
  check("H1: the default (legacy target_rate) shows a positive implied $/student",
    Number(doc.querySelector('input[data-edit="perstudent"][data-slot="1"][data-idx="0"]').value) > 0);

  // H2 — per_student is the source of truth; the student target is INVERSE to it,
  // and it moves no dollars (the allocation is share-based).
  T._setShared({ yearPriorities: { "1": { "0": { per_student: 100 } } } });
  T.render();
  check("H2: the per-student input round-trips the stored $/student",
    Math.abs(Number(doc.querySelector('input[data-edit="perstudent"][data-slot="1"][data-idx="0"]').value) - 100) < 0.01);
  const a100 = T._alloc(D.colleges[0].college);
  T._setShared({ yearPriorities: { "1": { "0": { per_student: 50 } } } });
  T.render();
  const a50 = T._alloc(D.colleges[0].college);
  check("H2: halving $/student ~doubles the student target (inverse), unless clamped at 100%",
    Math.abs(a50.p1_heads - 2 * a100.p1_heads) < 1 || a50.p1_heads >= D.colleges[0].headcount - 1);
  check("H2: changing the per-student rate moves NO dollars (allocation is share-based)",
    Math.abs(a50.total - a100.total) < 1);

  // H3 — the per-student rate shows on each college row's P-cell.
  const rateEl = doc.querySelector("#cplFundTable tbody tr.cplfund-row td.cf-prio .cf-rate");
  check("H3: each P-cell surfaces the per-student rate (/stu)",
    !!rateEl && rateEl.textContent.indexOf("/stu") !== -1);
}
{
  // H4 — collapsible sections: native <details>, default open, persisted.
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const secs = doc.querySelectorAll("#cplFundingMount details.cplfund-sec");
  check("H4: top-level sections render as collapsible <details> (>=6)", secs.length >= 6);
  check("H4: sections default to open, each with an <h3> summary",
    Array.from(secs).every(function (s) { return s.open && !!s.querySelector("summary h3"); }));
  check("H4: the college table lives inside a section and still renders rows",
    !!doc.querySelector("details.cplfund-sec #cplFundTable tbody tr.cplfund-row"));
  const win = doc.querySelector('details.cplfund-sec[data-sec="window"]');
  win.open = false;
  win.dispatchEvent(new window.Event("toggle"));
  T.render();
  check("H4: a collapsed section stays collapsed across a re-render (persisted)",
    !doc.querySelector('details.cplfund-sec[data-sec="window"]').open);
}
{
  // H5 — reworded metrics: P1 'eligible' → the eligible (pe) count; P3 'portal'
  // → the portal-origin (pp) count, now a NORMAL achievement-based metric (Sam,
  // 2026-07-27): a college earns on its actual portal count, and one with none
  // earns $0 (no more full-cap "advancing").
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-07-27", suppress_below: 5,
    statewide: { pe: 42962, p2: 5000, p3: 16811, pp: 8 },
    colleges: { "Laney": { pe: 44, p2: 0, p3: 0, pp: 3 }, "Ohlone": { pe: 10, p2: 0, p3: 0, pp: 0 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: "Headcount of students eligible for at least one course offered through CPL" },
    "2": { metric: "Headcount of students with transcribed Credit from either CPL Student Portal or CPL Landing Page" }
  } } });
  T.render();
  const cards = doc.querySelectorAll(".cplfund-prio .p");
  check("H5: the reworded P1 'eligible' metric is wired to the eligible (pe) count",
    cards[0].textContent.indexOf("42,962") !== -1 && cards[0].textContent.indexOf("of target") !== -1);
  check("H5: the P3 Portal metric shows the portal-origin (pp) count vs target, NOT 'advancing'",
    cards[2].textContent.indexOf("portal-origin") !== -1 &&
    cards[2].textContent.indexOf("of target") !== -1 &&
    cards[2].textContent.indexOf("advancing") === -1);
  // Achievement-based P3: a college with 0 portal students earns $0 on P3 (its
  // full P3 cap is unearned); a college with a portal count shows it in the cell.
  T._state.basis = "earned"; T.render();
  const oh = T._alloc("Ohlone");     // pp = 0 → P3 fully unearned
  check("H5: P3 earns $0 for a college with no portal students (P3 cap fully unearned, no advance)",
    oh.earned_total <= oh.total - oh.p3 + 1);
  const rowsE = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"));
  const ohP3 = rowsE.find(function (r) { return /Ohlone/.test(r.textContent); }).querySelectorAll("td.cf-prio")[2];
  const laP3 = rowsE.find(function (r) { return /Laney/.test(r.textContent); }).querySelectorAll("td.cf-prio")[2];
  check("H5: P3 cell reads 0 (none) for a college with no portal students — not 'gap'/'…'",
    ohP3.querySelector(".cf-a").textContent.indexOf("0") !== -1 &&
    ohP3.textContent.indexOf("gap") === -1 && ohP3.textContent.indexOf("…") === -1);
  check("H5: P3 cell surfaces the portal count for a college WITH portal students",
    laP3.querySelector(".cf-a").textContent.indexOf("3") !== -1);
}

// ─────────────────────────────────────────────────────────────────────────────
let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
