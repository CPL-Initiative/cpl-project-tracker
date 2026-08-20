// CPL Implementation Funding tab — static invariants — shell wiring, lazy loading, Rule 4, and the data artifact.
//
// (a) the tab shell (nav button, pane, lazy boot) stays present + IDENTICAL in
//     both HTMLs, and team_phrase.js loads before the funding boot;
// (b) the data stays LAZY (no eager <script>);
// (c) the data artifact's schema — year window, year priorities, feeders;
// (d) PII: institutional/census aggregates only, no person-level keys.
//
// No jsdom here — this suite is pure static analysis and runs in ~1s.
//
// One of nine suites the 2,955-line cpl_funding.test.js was split into on
// 2026-08-20, after it stopped fitting in a 12 GB heap. Shared setup + the
// jsdom helpers live in tests/lib/cpl_funding_harness.js, which also carries the
// measurements behind the split and the per-window memory budget for anyone
// adding to these files.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_shell.test.js`).
const {
  check,
  D,
  dataSrc,
  consumerSrc,
  cpl,
  idx,
  finish,
} = require("./lib/cpl_funding_harness.js");

// ─────────────────────────────────────────────────────────────────────────────
// Part A — static invariants: shell wiring + lazy loading + Rule 4
// ─────────────────────────────────────────────────────────────────────────────

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
  check("data: year " + slot + " priorities carry metric + price factor (default 1.0)",
    D && D.year_priorities[slot].every(function (p) {
      return p.metric && p.share != null && p.factor === 1;
    }));
  // 2026-08-06 — the unit is an EXPLICIT field, not sniffed from the metric text.
  // It used to be decided by string-matching "headcount" in the LABEL, which made
  // a curator retitling a metric silently move the target off the SCFF-rate path
  // onto sizeOf(c) × target_rate — and target_rate is a headcount-era percentage,
  // so the flip was also a category error under the credit-FTES basis.
  check("data: year " + slot + " priorities declare an EXPLICIT unit",
    D && D.year_priorities[slot].every(function (p) {
      return p.unit === "ftes" || p.unit === "headcount";
    }));
  check("data: year " + slot + " explicit units agree with the legacy label sniff " +
    "(the field is behaviour-neutral, it just stops the label being the switch)",
    D && D.year_priorities[slot].every(function (p) {
      const sniffed = !/headcount/i.test(p.metric) && /ftes|unit/i.test(p.metric);
      return p.unit === (sniffed ? "ftes" : "headcount");
    }));
  check("data: year " + slot + " FTES rows carry NO leftover headcount-era target_rate",
    D && D.year_priorities[slot].every(function (p) {
      return p.unit !== "ftes" || p.target_rate == null;
    }));
});
// Synced 2026-07-30 to the wording live in cpl_funding_config. The workbook +
// builder were retired, so these baked defaults are hand-maintained and drift
// silently — tests/cpl_funding_metric_wiring.test.js guards that they at least
// stay MEASURABLE; this pins the exact text.
check("data: year-1 P1 metric matches the live curated wording",
  D && D.year_priorities["1"][0].metric ===
    "Headcount of students eligible for at least one course offered through CPL");
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
check("data: the 2026-07-31 headcount refresh landed (East LA = 64,167)",
  D && D.colleges.some(function (c) { return c.college === "East LA" && c.headcount === 64167 && c.hc_vintage === "2025-26"; }));
// The refresh corrected several badly-understated rows that credit FTES had
// flagged (Pasadena's load factor was 1.56 FTES/head — 47 units per student).
check("data: the refresh fixed the Pasadena understatement (14,936 -> 41,521)",
  D && D.colleges.some(function (c) { return c.college === "Pasadena" && c.headcount === 41521; }));
check("data: headcount_pct sums to 1 over the new roster",
  D && Math.abs(D.colleges.reduce(function (s, c) { return s + c.headcount_pct; }, 0) - 1) < 1e-4);

// Pool math: the workbook chain still validates (before the feeder carve-out).
check("data: pool math (one-time − admin − projects&innovation = college_funding_before_feeder)",
  D && Math.abs((D.pool.one_time_2026_27 -
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

finish();
