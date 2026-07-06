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
// There can be >1 .cplfund-foot (the feeder note + the main footer); scan all.
function footText(doc) {
  return Array.from(doc.querySelectorAll(".cplfund-foot")).map(function (e) { return e.textContent; }).join(" ");
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
  check("renders one row per college", tables[0].querySelectorAll("tbody tr").length === D.colleges.length);
  check("renders one row per feeder (4)", tables[1].querySelectorAll("tbody tr").length === 4);
  check("SYSTEM pinned as tfoot total row (not a body row)",
    tables[0].querySelector("tfoot").textContent.indexOf("SYSTEM") !== -1);
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
  const firstRow = doc.querySelector("#cplFundTable tbody tr");
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
    !!window.localStorage.getItem("cpl_funding_scenario_v1"));
}

// C3 — year filter: switches priority metrics (and the college P1/P2/P3 columns
// reflect the active year).
{
  const { window } = freshDom();
  const doc = boot(window);
  check("year filter has one button per selected year", doc.querySelectorAll("#cplFundYear button").length === 2);
  const m1 = doc.querySelector('input[data-edit="metric"][data-slot="1"][data-idx="0"]');
  check("year 1 shows the year-1 P1 metric", m1 && m1.value === "Headcount with any transcribed CPL");
  // switch to Year 2.
  click(window, doc.querySelector('#cplFundYear button[data-val="2"]'));
  const m2 = doc.querySelector('input[data-edit="metric"][data-slot="2"][data-idx="0"]');
  check("year 2 shows the year-2 P1 metric", m2 && m2.value === "Units of Transcribed CPL");
  check("metric label names the active year", doc.querySelector(".cplfund-prio .p .metric").textContent.indexOf("Year 2") !== -1);
  // default shares equal both years → the college TOTAL column is unchanged.
  const totalY2 = doc.querySelector("#cplFundTable tbody tr td.tot").textContent;
  click(window, doc.querySelector('#cplFundYear button[data-val="1"]'));
  const totalY1 = doc.querySelector("#cplFundTable tbody tr td.tot").textContent;
  check("college TOTAL is stable across years at default shares", totalY1 === totalY2);
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
    JSON.parse(window.localStorage.getItem("cpl_funding_scenario_v1")).feeders[0].headcount === 40000);

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
  const metric = doc.querySelector('input[data-edit="metric"][data-slot="1"][data-idx="0"]');
  commit(window, metric, "Custom metric text");
  const scen = JSON.parse(window.localStorage.getItem("cpl_funding_scenario_v1"));
  check("editing a metric persists to the scenario", scen.yearPriorities["1"][0].metric === "Custom metric text");
  check("the edited metric re-renders",
    doc.querySelector('input[data-edit="metric"][data-slot="1"][data-idx="0"]').value === "Custom metric text");

  // Edit P1 share 30% → 60% ⇒ shares sum 130% ⇒ formula warns.
  commit(window, doc.querySelector('input[data-edit="share"][data-slot="1"][data-idx="0"]'), "60");
  check("priority share chip recomputes (60% of each tranche)",
    doc.querySelector(".cplfund-prio .p .share").textContent.indexOf("60%") !== -1);
  check("formula warns when the year's shares no longer sum to 100%",
    (doc.querySelector(".cplfund-formula .cplfund-warn-text") || { textContent: "" }).textContent.indexOf("130") !== -1);

  // Projection target moves students, not dollars.
  commit(window, doc.querySelector('input[data-edit="share"][data-slot="1"][data-idx="0"]'), "30");
  const totalBefore = doc.querySelector("#cplFundTable tbody tr td.tot").textContent;
  commit(window, doc.querySelector('input[data-edit="target"][data-slot="1"][data-idx="0"]'), "10");
  check("target edit moves NO dollars (first-row total unchanged)",
    doc.querySelector("#cplFundTable tbody tr td.tot").textContent === totalBefore);

  // Scenario status + reset.
  check("auth bar shows the local-scenario mode when edited",
    doc.querySelector(".cplfund-authbar .mode.scenario").textContent.indexOf("Local scenario") !== -1);
  click(window, doc.getElementById("cplFundReset"));
  check("reset clears the scenario (localStorage gone)", !window.localStorage.getItem("cpl_funding_scenario_v1"));
  check("reset restores the baked P1 metric",
    doc.querySelector('input[data-edit="metric"][data-slot="1"][data-idx="0"]').value === "Headcount with any transcribed CPL");
}

// C6 — config layers: baked ⊕ shared ⊕ scenario resolution.
{
  const { window } = freshDom();
  const doc = boot(window);
  // Inject a shared config (as if fetched from Supabase). Anonymous viewers see it.
  window.CPL_FUNDING_TAB._setShared({ yearPriorities: { "1": { "0": { metric: "SHARED metric" } } } });
  window.CPL_FUNDING_TAB.render();
  check("shared config overrides the baked default",
    doc.querySelector('input[data-edit="metric"][data-slot="1"][data-idx="0"]').value === "SHARED metric");
  // A local scenario shadows the shared value.
  commit(window, doc.querySelector('input[data-edit="metric"][data-slot="1"][data-idx="0"]'), "SCENARIO metric");
  check("scenario shadows shared",
    doc.querySelector('input[data-edit="metric"][data-slot="1"][data-idx="0"]').value === "SCENARIO metric");
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
  commit(window, doc.querySelector('input[data-edit="metric"][data-slot="1"][data-idx="0"]'), "TEAM edit");
  check("unlocked edit writes to the SHARED store",
    window.CPL_FUNDING_TAB._getShared().yearPriorities["1"]["0"].metric === "TEAM edit");
  check("unlocked edit did NOT write a local scenario", !window.localStorage.getItem("cpl_funding_scenario_v1"));
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
  commit(window, doc.querySelector('input[data-edit="metric"][data-slot="1"][data-idx="0"]'), "explored metric");
  check("locked edit is a local scenario", !!window.localStorage.getItem("cpl_funding_scenario_v1"));
  // Unlock → the scenario promotes into SHARED and clears.
  click(window, doc.querySelector(".mock-unlock"));
  check("unlock promotes the scenario into the shared config",
    window.CPL_FUNDING_TAB._getShared().yearPriorities["1"]["0"].metric === "explored metric");
  check("unlock clears the local scenario after promotion",
    !window.localStorage.getItem("cpl_funding_scenario_v1"));
  check("promoted model still renders the edited value",
    doc.querySelector('input[data-edit="metric"][data-slot="1"][data-idx="0"]').value === "explored metric");
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
    doc.querySelector("#cplFundTable tfoot").textContent.indexOf("$" + net.toLocaleString("en-US")) !== -1);
  check("SYSTEM tfoot year cells carry the per-year tranche ($" + Math.round(tranche).toLocaleString() + ")",
    doc.querySelector("#cplFundTable tfoot").textContent.indexOf("$" + Math.round(tranche).toLocaleString("en-US")) !== -1);

  // District rollup: one row per district; headcount conserves.
  const distinct = new Set(D.colleges.map(function (c) { return c.district || "(no district)"; })).size;
  click(window, doc.querySelector('#cplFundView button[data-val="district"]'));
  const dRows = doc.querySelectorAll("#cplFundTable tbody tr");
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
    doc.querySelectorAll("#cplFundTable tbody tr").length === distinct);
}

// C9 — metric-measurability actuals: Year-1 P1 (any transcribed) IS measurable
// from the daily MAP feed; the five other metrics carry honest data-gap labels
// until their feeds exist (exhibit linkage / origin tracking / MIS match-back).
{
  // Without the perf artifact.
  const { window } = freshDom();
  const doc = boot(window);
  check("Y1-P1 card hints actuals arrive with the daily refresh (measurable metric)",
    doc.querySelector(".cplfund-prio .p").textContent.indexOf("next daily data refresh") !== -1);
  check("Y1-P2 card carries the exhibit-linkage data-gap label",
    doc.querySelectorAll(".cplfund-prio .p")[1].textContent.indexOf("data gap") !== -1 &&
    doc.querySelectorAll(".cplfund-prio .p")[1].textContent.indexOf("STATEWIDE credit recommendation") !== -1);
  check("Y1-P3 card carries the origin-tracking data-gap label",
    doc.querySelectorAll(".cplfund-prio .p")[2].textContent.indexOf("Portal") !== -1);
  check("CPL-students column renders dashes without the artifact",
    doc.querySelector("#cplFundTable tbody tr td:nth-child(6)").textContent.trim() === "—");
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
  check("tfoot carries the deduplicated statewide any-transcribed actual (20,000)",
    doc.querySelector("#cplFundTable tfoot").textContent.indexOf("20,000") !== -1);
  check("footer explains the actuals basis + suppression",
    footText(doc).indexOf("deduplicates across colleges") !== -1);
  check("a non-empty unmatched bucket is surfaced in the footer",
    footText(doc).indexOf("Mystery University") !== -1);
  const rowsArr = Array.from(doc.querySelectorAll("#cplFundTable tbody tr"));
  const alaRow = rowsArr.find(function (tr) { return tr.textContent.indexOf("Alameda") !== -1; });
  check("Alameda's CPL-students cell shows the any-transcribed actual (300)",
    alaRow.querySelector("td:nth-child(6)").textContent.trim() === "300");
  // Sort by the actuals column.
  click(window, doc.querySelector('#cplFundTable th[data-sort="p3a"]'));
  check("sort by CPL students puts the highest actual first",
    doc.querySelector("#cplFundTable tbody tr").textContent.indexOf("Alameda") !== -1);
  // Year 2: all three metrics are gaps today (units builder / MIS match-back).
  click(window, doc.querySelector('#cplFundYear button[data-val="2"]'));
  check("Y2 cards carry data-gap labels (MIS match-back)",
    doc.querySelectorAll(".cplfund-prio .p")[1].textContent.indexOf("match-back") !== -1);
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
    doc.querySelector("#cplFundTable tfoot").textContent.indexOf("↻ carryover") !== -1);
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
  check("rural carve-out pool card renders as a deduction", ruralCard && /carve-out/.test(ruralCard.textContent));
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
  check("eligibility block renders the two proposed requirements",
    doc.querySelector(".cplfund-elig") &&
    /CPL Coordinator listed in MAP/.test(doc.querySelector(".cplfund-elig").textContent) &&
    /Participation request by/.test(doc.querySelector(".cplfund-elig").textContent));
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
  check("both requirements met → ✓", alamedaRow.textContent.indexOf("✓") !== -1);
  check("one requirement met → ◐", butteRow.textContent.indexOf("◐") !== -1);
  check("SYSTEM tfoot shows the coordinator coverage fraction",
    doc.querySelector("#cplFundTable tfoot").textContent.indexOf("2/" + D.colleges.length) !== -1);
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

// D5 — noncredit student counts are included in the totals (Sam, 2026-07-06):
// the SYSTEM headcount total shows allocation basis + feeders = CCC total in
// BOTH table views (the pool card already showed it).
{
  const { window } = freshDom();
  const doc = boot(window);
  const feederSum = D.feeders.reduce(function (s, f) { return s + f.headcount; }, 0);
  const combined = (D.system.headcount + feederSum).toLocaleString("en-US");
  check("college-view SYSTEM row includes the noncredit feeders in the CCC total",
    doc.querySelector("#cplFundTable tfoot").textContent.indexOf(combined) !== -1 &&
    doc.querySelector("#cplFundTable tfoot").textContent.indexOf("noncredit") !== -1);
  click(window, doc.querySelector('#cplFundView button[data-val="district"]'));
  check("district-view SYSTEM row includes the noncredit feeders in the CCC total",
    doc.querySelector("#cplFundTable tfoot").textContent.indexOf(combined) !== -1);
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
let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
