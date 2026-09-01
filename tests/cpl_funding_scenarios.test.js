// CPL Implementation Funding tab — the 2026-07-06 evening batch + the shared project/scenario layer (Part E),
// ported to the ONE-POOL model (adopted 2026-08-31).
//
// Table refinements, CO seal-blue, the shared project + scenario selectors,
// exports, and the gated CO Monitor notes. The scenario/project MACHINERY is
// unchanged; what moved is the table (one row per institution, the CR award /
// NC award pair — the P1/P2/P3 columns live on in the expand's 7-column
// detail table), the retired NC carve-out dial the edit checks used to type
// into (they type into admin_cost now), and the one-pool CSV/memo shapes.
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

// The one-pool roster: 115 colleges + the noncredit-only rows (Mt. SAC
// Noncredit rides the Mt San Antonio row, so it is not one of them).
const NCO_N = D.feeders.filter(function (f) { return !f.nc_ftes_on_credit_row; }).length;
const ROSTER_N = D.colleges.length + NCO_N;
const fmtM = function (v) { return "$" + Math.round(v).toLocaleString("en-US"); };

// ─────────────────────────────────────────────────────────────────────────────
// Part E — the 2026-07-06 evening batch (Sam's 8+3): county hidden, eligible
// column, count note, floor-targets note, seal-blue, scenarios, exports,
// monitor notes, alignment polish.
// ─────────────────────────────────────────────────────────────────────────────

// E1 — table refinements.
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  check("County column is hidden (data stays in drill-in + CSV)",
    !doc.querySelector('#cplFundTable th[data-sort="county"]'));
  // The per-priority P1/P2/P3 COLUMNS are retired (one-pool table, 2026-08-31):
  // one row per institution carries the CR award / NC award pair, and the
  // per-priority detail lives in the expand's 7-column .cplfund-dtl-table.
  check("the P1/P2/P3 columns are retired — the award pair heads the table instead",
    !doc.querySelector('th[data-sort="prio0"]') && !doc.querySelector('th[data-sort="prio1"]') &&
    !doc.querySelector('th[data-sort="prio2"]') &&
    !!doc.querySelector('th[data-sort="cr_award"]') && !!doc.querySelector('th[data-sort="nc_award"]'));
  // The count line sizes the ONE roster and quotes the average in Sam's ruled
  // vocabulary ("max award"); the carve-out it used to name is retired (R3).
  {
    const line = doc.getElementById("cplFundCount").textContent;
    check("count note sizes the one-pool roster (" + ROSTER_N + " institutions)",
      line.indexOf(ROSTER_N + " institutions") !== -1);
    check("...and quotes the average max award from the model",
      /average max award/.test(line) && line.indexOf(fmtM(T._netCollege() / ROSTER_N)) !== -1);
    check("...and no carve-out survives in it (R3)", line.indexOf("carve-out") === -1);
  }
  check("floor note: funding raised, targets not (formula)",
    doc.querySelector(".cplfund-formula").textContent.indexOf("not its targets") !== -1);
  // Drill-in county context survives the hidden column.
  click(window, doc.querySelector("tr.cplfund-row"));
  check("drill-in still shows the county context",
    doc.querySelector("tr.cplfund-detail").textContent.indexOf("County context") !== -1);
  // Priority actuals render from the perf artifact. P1's live metric is the
  // ELIGIBLE headcount → `pe` (Sam's 2026-07-30 wording), so the fixture's pe
  // value is what the surfaces must show — the per-college figure in the
  // expand's detail table (the P-cells' successor), the statewide figure on
  // the priority card's Actual line.
  window.CPL_FUNDING_PERF = {
    as_of: "2026-07-06", suppress_below: 5,
    statewide: { pe: 50000, p2: 100, p3: 20000 },
    colleges: { "Alameda": { pe: 777, p2: 10, p3: 300 } }, unmatched: {}
  };
  T._state.open["c:Alameda"] = true;   // rows key by name since 2026-08-31
  T.render();
  const dtl = doc.querySelector("tr.cplfund-detail .cplfund-dtl-table");
  check("Alameda's expand shows the measurable actual (777 eligible) in its Actual column",
    !!dtl && Array.from(dtl.querySelectorAll("tr")).slice(1).some(function (tr) {
      const tds = tr.querySelectorAll("td");
      return tds[4] && /^777 stu/.test(tds[4].textContent);
    }));
  check("the priority card shows the statewide measurable actual (50,000 eligible per MAP)",
    /Actual 50,000 students per MAP/.test(doc.getElementById("cplFundingMount").textContent));
  delete window.CPL_FUNDING_PERF;
}

// E2 — CO seal-blue on the previously-black backgrounds.
{
  const { window } = freshDom();
  const doc = boot(window);
  const css = doc.getElementById("cpl-funding-css").textContent;
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
// what-if overlay on the selected shared scenario. (The edits type into
// admin_cost — the feeder_carveout dial these blocks used to use is retired,
// R3, and no longer renders an input.)
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
  commit(window, doc.querySelector('input[data-edit="pool"][data-field="admin_cost"]'), "900,000");
  check("locked edit lands in the CPL / Scenario-1 what-if overlay",
    scenSlot(window, "Scenario 1").pool.admin_cost === 900000);
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
  // ⚠️ Curating funding needs a magic-link reviewer since 2026-08-28, not the
  // team phrase. Without this the curator controls never render and the suite
  // CRASHES on a null element rather than failing an assertion.
  window.CPL_SESSION = {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  check("curator sees ＋New + ＋Project", !!doc.getElementById("cplFundScenNew") && !!doc.getElementById("cplFundProjAdd"));
  // Edit Scenario 1 (unlocked → shared), then ＋New clones it.
  commit(window, doc.querySelector('input[data-edit="pool"][data-field="admin_cost"]'), "2,000,000");
  click(window, doc.getElementById("cplFundScenNew"));
  check("＋New creates Scenario 2 that CLONES the current scenario (not blank)",
    T._scenario().name === "Scenario 2" && T._getShared().pool.admin_cost === 2000000);
  // The clone is independent.
  commit(window, doc.querySelector('input[data-edit="pool"][data-field="admin_cost"]'), "3,000,000");
  const cfg = T._config();
  check("cloned scenarios are independent",
    cfg.projects["cpl-implementation"].scenarios["Scenario 2"].pool.admin_cost === 3000000 &&
    cfg.projects["cpl-implementation"].scenarios["Scenario 1"].pool.admin_cost === 2000000);
  const scenSel = doc.getElementById("cplFundScenSel");
  scenSel.value = "Scenario 1"; scenSel.dispatchEvent(new window.Event("change"));
  check("switching scenario restores its model", T._getShared().pool.admin_cost === 2000000);
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
    cfg2.projects[newPid].scenarios["Scenario 1"].pool.admin_cost === 2000000);
  check("the area badge reflects the active project's area",
    doc.querySelector(".cplfund-area").textContent.indexOf("C&I") !== -1);
  delete window.CPL_ORGS;
}

// E3c — normalizeConfig migration: an OLD flat override becomes CPL / Scenario 1.
// The flat fixture deliberately carries the retired feeder_carveout key — a
// real legacy store would — and the migration must carry it inertly rather
// than choke on it (the model reads no retired dial either way).
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
  // Three sub-views since 2026-07-29: the funding model, the $15M
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
  // Sam, 2026-08-04: the memo leads with the AVAILABLE institution funding, not
  // the $35M gross appropriation — under one pool that is netCollege(), the
  // $25,240,308 every institution surface ties out to.
  const poolFig = fmtM(T._netCollege());
  check("memo Funding Overview leads with the available institution funding figure", memo.indexOf(poolFig) !== -1);
  const gross35 = fmtM(D.pool.one_time_2026_27);
  check("memo no longer prints the $35M gross appropriation", memo.indexOf(gross35) === -1);
  check("memo lists the three priorities",
    D.year_priorities["1"].every(function (p) { return memo.indexOf(p.label) !== -1; }));
  check("memo allocation table carries the statewide institution total", memo.indexOf("TOTAL (statewide") !== -1);
  // ONE POOL (2026-08-31): the allocation summary counts FUNDED INSTITUTIONS
  // (115 colleges + the 3 noncredit-only) — the old carve-out-era "Funded
  // Colleges / Funded Noncredit Campuses" split is retired with the carve-out.
  check("memo allocation summary counts the funded institutions (colleges + noncredit-only)",
    memo.indexOf("Funded institutions") !== -1 &&
    memo.indexOf(ROSTER_N + " (" + D.colleges.length + " colleges + " + NCO_N + " noncredit-only institutions)") !== -1);
  check("memo no longer splits the count into Funded Colleges / Funded Noncredit Campuses",
    memo.indexOf("Funded Colleges") === -1 && memo.indexOf("Funded Noncredit Campuses") === -1);
  // The one-pool allocation table: one combined max award per institution with
  // its credit/noncredit shares beside it (the anchor suite pins the headers;
  // here the SHAPE claims are the counts and the trio's rows).
  check("memo allocation table is one-pool shaped (Credit share · Noncredit share · Max award)",
    memo.indexOf("Credit share") !== -1 && memo.indexOf("Noncredit share") !== -1 &&
    memo.indexOf("Max award") !== -1);
  // Per-district grouping + the noncredit-only institutions under their districts.
  check("memo allocation is grouped by district (a district header appears)",
    memo.indexOf(D.colleges[0].district) !== -1);
  check("memo lists every noncredit-only institution, marked as earning by origination",
    memo.indexOf("(noncredit-only") !== -1 &&
    D.feeders.filter(function (f) { return !f.nc_ftes_on_credit_row; })
      .every(function (f) { return memo.indexOf(f.name) !== -1; }));
  check("memo gives Mt. SAC Noncredit no row of its own (its FTES ride the Mt San Antonio row)",
    memo.indexOf("Mt. San Antonio College — Noncredit") === -1);
  check("memo flags Calbright's stand-in size (nothing disburses on a placeholder — N3 a)",
    memo.indexOf("stand-in") !== -1);
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
  check("CSV: meta line + header + one line per institution + SYSTEM",
    lines.length === 2 + ROSTER_N + 1 && lines[0].indexOf("DRAFT model") !== -1);
  check("CSV: header carries County + per-priority target/actual + eligibility + base/cap state",
    lines[1].indexOf("County") !== -1 && lines[1].indexOf("P1 target") !== -1 && lines[1].indexOf("P1 actual") !== -1 &&
    lines[1].indexOf("Eligibility (proposed)") !== -1 && lines[1].indexOf("Base / cap applied") !== -1);
  // The Rural column went with the carve-out (2026-08-22) — guard its absence so
  // it cannot come back as an empty column nobody notices.
  check("CSV: no Rural column survives", lines[1].split(",").indexOf("Rural") === -1);
  // Counted against the model rather than a named college: the cap's bite
  // depends on the pool and the roster, so a literal name here would break for
  // a reason that has nothing to do with the CSV.
  check("CSV: every institution held at the cap carries the 'cap' flag",
    T._model().cappedCount > 0 &&
    lines.filter(function (l) { return /,cap,/.test(l); }).length === T._model().cappedCount);
  check("CSV: a floored college carries its 'base' flag",
    lines.some(function (l) { return l.indexOf("Feather River") !== -1 && /,base,/.test(l); }));
  // The SYSTEM line totals each lane in its own column (the unit-agreement
  // rule): Σ credit FTES and ALL noncredit — college rows + the standalone
  // trio, placeholder-aware (Calbright at its stand-in), Mt. SAC once.
  const crSum = Math.round(D.colleges.reduce(function (s, c) { return s + (c.credit_ftes || 0); }, 0));
  const ncSum = Math.round(D.colleges.reduce(function (s, c) { return s + (Number(c.noncredit_ftes) || 0); }, 0) +
    D.feeders.filter(function (f) { return !f.nc_ftes_on_credit_row; })
      .reduce(function (s, f) {
        const ph = Number(f.noncredit_ftes_placeholder);
        return s + ((isFinite(ph) && ph > 0) ? ph : (Number(f.noncredit_ftes) || 0));
      }, 0));
  check("CSV: SYSTEM row totals both FTES lanes (credit; all noncredit incl. the standalone trio)",
    lines[lines.length - 1].indexOf(String(crSum)) !== -1 &&
    lines[lines.length - 1].indexOf(String(ncSum)) !== -1);
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
  T._state.open["c:Alameda"] = true;   // rows key by name since 2026-08-31
  T.render();
  const detail = Array.from(doc.querySelectorAll("tr.cplfund-detail")).find(function (tr) {
    return tr.textContent.indexOf("Alameda") !== -1 || tr.textContent.indexOf("Coordinator hire") !== -1;
  });
  check("fetched note renders read-only in the drill-in",
    detail && detail.textContent.indexOf("Coordinator hire in progress.") !== -1 &&
    !detail.querySelector("textarea"));
}

// ── the export's shape ─────────────────────────────────────────────────────
// EVERY line must have exactly as many fields as the header. This is here
// because the SYSTEM row had THREE empties where the header has two, from
// whenever that block was written until 2026-08-23 — so the one row a reader
// checks first put its window total under "Earned", its earned under "Withheld",
// and so on. Nothing in the browser shows it; you have to open the file. A
// field-count check is the cheapest thing that can see it, and it generalizes:
// any future column added to one line and not another fails here.
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  function fields(line) {
    const out = []; let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur); return out;
  }
  function shapeOf(csv) {
    const lines = csv.split("\r\n").slice(1);        // [0] is the one-cell meta banner
    const head = fields(lines[0]).length;
    return { head: head, bad: lines.filter((l) => fields(l).length !== head).length, n: lines.length };
  }
  const flat = shapeOf(T._csv());
  check("CSV: every institution line matches the header's field count",
    flat.bad === 0 && flat.n > 110);
  const cols = fields(T._csv().split("\r\n")[1]);
  check("CSV: the SYSTEM total lands under the Max-award column, not one to its right",
    (function () {
      const lines = T._csv().split("\r\n");
      const sys = fields(lines[lines.length - 1]);
      // The window column label follows windowLabel() ("Max award 2026–2028").
      const idx = cols.findIndex(function (c) { return /^Max award /.test(c); });
      return sys[1] === "SYSTEM (statewide)" && idx !== -1 &&
        Number(sys[idx]) === Math.round(T._netCollege());
    })());
  check("CSV: the noncredit share is its own column, never folded into the credit figure",
    cols.some(function (c) { return /^Noncredit share /.test(c); }) &&
    cols.indexOf("Noncredit FTES") !== -1);
  // The district-grouped export interleaves subtotal lines — a second shape that
  // has to agree with the same header.
  click(window, doc.querySelector('#cplFundGroup button[data-val="district"]'));
  const grouped = shapeOf(T._csv());
  check("CSV: the district-grouped export keeps the same shape",
    grouped.bad === 0 && grouped.head === flat.head && grouped.n > flat.n);
}

finish();
