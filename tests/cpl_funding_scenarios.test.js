// CPL Implementation Funding tab — the 2026-07-06 evening batch + the shared project/scenario layer (Part E).
//
// Table refinements, CO seal-blue, the shared project + scenario selectors,
// exports, and the gated CO Monitor notes.
//
// One of nine suites the 2,955-line cpl_funding.test.js was split into on
// 2026-08-20, after it stopped fitting in a 12 GB heap. Shared setup + the
// jsdom helpers live in tests/lib/cpl_funding_harness.js, which also carries the
// measurements behind the split and the per-window memory budget for anyone
// adding to these files.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_scenarios.test.js`).
const {
  check,
  freshDom,
  boot,
  click,
  commit,
  scenSlot,
  D,
  consumerSrc,
  cpl,
  finish,
} = require("./lib/cpl_funding_harness.js");

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
  // Priority-column actuals render from the perf artifact. P1's live metric is
  // the ELIGIBLE headcount → `pe` (Sam's 2026-07-30 wording), so the fixture's
  // pe value is what the P1 cell must show.
  window.CPL_FUNDING_PERF = {
    as_of: "2026-07-06", suppress_below: 5,
    statewide: { pe: 50000, p2: 100, p3: 20000 },
    colleges: { "Alameda": { pe: 777, p2: 10, p3: 300 } }, unmatched: {}
  };
  window.CPL_FUNDING_TAB.render();
  const alamedaRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find(function (tr) {
    return tr.textContent.indexOf("Alameda") !== -1;
  });
  check("Alameda's P1 cell shows the measurable actual (777 eligible) in its actual line",
    alamedaRow.querySelector("td.cf-prio .cf-a").textContent.indexOf("777") !== -1);
  check("SYSTEM P1 cell shows the statewide measurable actual (50K eligible, compact)",
    doc.querySelector("#cplFundTable .cplfund-systemrow td.cf-prio").textContent.indexOf("50K") !== -1);
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
  // Three sub-views since 2026-07-29: the $35M funding model, the $15M
  // Distributions receipt, and the Report.
  check("Report sub-tab renders alongside the Funding-model + $15M Distributions tabs",
    doc.querySelectorAll('#cplFundingMount [data-subview]').length === 3 &&
    !!doc.querySelector('[data-subview="report"]') &&
    !!doc.querySelector('[data-subview="model"]') &&
    !!doc.querySelector('[data-subview="grants"]'));
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
  // Sam, 2026-08-04: the memo now leads with the AVAILABLE college funding (the
  // pool colleges actually receive = Σ window totals), not the $35M gross
  // appropriation — that reference was dropped.
  const collegePool = D.colleges.reduce(function (s, c) {
    return s + window.CPL_FUNDING_TAB._alloc(c.college).total; }, 0);
  const poolFig = "$" + Math.round(collegePool).toLocaleString("en-US");
  check("memo Funding Overview leads with the available college funding figure", memo.indexOf(poolFig) !== -1);
  const gross35 = "$" + Math.round(D.pool.one_time_2026_27).toLocaleString("en-US");
  check("memo no longer prints the $35M gross appropriation", memo.indexOf(gross35) === -1);
  check("memo lists the three priorities",
    D.year_priorities["1"].every(function (p) { return memo.indexOf(p.label) !== -1; }));
  check("memo allocation table carries the statewide institution total", memo.indexOf("TOTAL (statewide") !== -1);
  // Sam, 2026-08-04: the allocation summary leads with the INSTITUTION total (college
  // pool + the $1M noncredit feeder support) and relabels the counts.
  const instTotal = collegePool + (D.pool.feeder_carveout || 0);
  check("memo allocation summary shows the institution total (incl. the $1M NC)",
    memo.indexOf("$" + Math.round(instTotal).toLocaleString("en-US")) !== -1);
  check("memo relabels the counts: Funded Colleges + Funded Noncredit Campuses",
    memo.indexOf("Funded Colleges") !== -1 && memo.indexOf("Funded Noncredit Campuses") !== -1);
  // Per-district grouping + the NC campuses listed under their districts.
  check("memo allocation is grouped by district (a district header appears)",
    memo.indexOf(D.colleges[0].district) !== -1);
  check("memo lists every noncredit feeder campus, marked (noncredit)",
    memo.indexOf("(noncredit)") !== -1 && D.feeders.every(function (f) { return memo.indexOf(f.name) !== -1; }));
  // $50k seed-funding intro (Sam, 2026-08-04) + the ESS 25-82 reference.
  check("memo intro cites the $50,000 seed grant and ESS 25-82",
    memo.indexOf("$50,000") !== -1 && memo.indexOf("ESS 25-82") !== -1);
  // Technical Assistance section (Sam, 2026-08-04) — verified KB links + Sam-supplied contacts.
  check("memo has a Technical Assistance section with verified MAP links",
    memo.indexOf("Technical Assistance") !== -1 &&
    memo.indexOf("map.rccd.edu/counselors/") !== -1 &&
    memo.indexOf("map.rccd.edu/cpl_implementation_guide/") !== -1);
  check("memo Technical Assistance lists the contacts",
    memo.indexOf("Mari Estrada") !== -1 && memo.indexOf("Terence Nelson") !== -1);
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
  // Sam, 2026-08-04: the CO division renamed Educational Services & Support → Academic Affairs.
  check("memo masthead uses Academic Affairs (not the retired ESS Division name)",
    memo.indexOf("Academic Affairs") !== -1 && memo.indexOf("Educational Services and Support") === -1);
  // Recommended Strategies section (Sam, 2026-08-04) — per-priority strategy lists,
  // omitted when empty and rendered when a priority carries strategies.
  check("memo omits the Recommended Strategies section when no priority has one",
    memo.indexOf("Recommended Strategies") === -1);
  T._setShared({ yearPriorities: { "1": { "0": { strategies: ["Screen at onboarding", "Notify eligible veterans"] } } } });
  const memoStrat = T._buildMemo("memo");
  check("memo shows Recommended Strategies when a priority carries strategies",
    memoStrat.indexOf("Recommended Strategies") !== -1 &&
    memoStrat.indexOf("Screen at onboarding") !== -1 &&
    memoStrat.indexOf("Notify eligible veterans") !== -1);
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
    ph.indexOf("Headcount of students eligible for at least one course offered through CPL") !== -1);
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

finish();
