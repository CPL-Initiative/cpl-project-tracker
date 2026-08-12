// Contracts tab (contracts.js) — jsdom test.
//
// Guards the properties that make this register trustworthy rather than
// quietly libellous:
//  (a) Rule 4 + nav/pane/lazy-boot in BOTH HTMLs, and the FIN site's tab list
//      resolves to panes that actually exist (a typo'd tab id = a site whose
//      home lands on a blank pane, and nothing errors);
//  (b) 'contracts' is EXCLUSIVE — vendor payment terms and staff contacts must
//      not appear in the default CPL nav. This is the one property whose failure
//      is invisible from inside the FIN site, where it always looks right;
//  (c) AN ABSENT MEASUREMENT IS NOT A ZERO, AND NOT AN ACCUSATION. A closed
//      period with no row says "Not recorded", never "Not received"; a null
//      count renders a dash, never 0. Four quarters closed before this tab
//      existed and it knows nothing about them;
//  (d) a role duty is not a vendor deliverable — Goal 2's six liaison bullets
//      must not inflate the obligation denominator the vendor is scored on;
//  (e) the reporting periods are COMPUTED from the contract's own term dates,
//      not carried as a list, and a term of 34.8 months never rounds DOWN into
//      a claim that its "3 year" cost lines fit;
//  (f) a collapsed goal header still carries that goal's own figures.
//
// Run from repo root: `npm test` (or `node tests/contracts.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
const orgs = fs.readFileSync("cobi_orgs.js", "utf8");
const navg = fs.readFileSync("nav_groups.js", "utf8");

check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
[["CPL_Dashboard.html", cpl], ["index.html", idx]].forEach(function (p) {
  check("nav button in " + p[0], /data-tab="contracts"[^>]*>📋 Contracts</.test(p[1]));
  check("pane #contracts-root in " + p[0], /id="contracts-root"/.test(p[1]));
  check("lazy boot in " + p[0], /loadScript\('contracts\.js', 'CPL_CONTRACTS'/.test(p[1]));
});
check("nav: contracts leads the Funding group",
  /tabs: \['contracts', 'budget', 'implementation-funding'\]/.test(navg));

// (b) THE gating property. Failing this puts vendor payment terms in the public
// default nav, and it looks perfectly fine from inside the FIN site.
check("⚠ 'contracts' is EXCLUSIVE — hidden from the default CPL nav",
  /var EXCLUSIVE = \[[^\]]*"contracts"[^\]]*\]/.test(orgs));
check("FIN site is registered in the org switcher",
  /id: "fin"[\s\S]{0,220}home: "contracts"/.test(orgs));

// (a) Every tab an org claims must exist as a real pane, or selecting that site
// strands the visitor on nothing at all — silently.
(function () {
  const finMatch = /id: "fin",[\s\S]*?tabs: \[([^\]]*)\]/.exec(orgs);
  check("FIN declares a tab list", !!finMatch);
  if (!finMatch) return;
  const tabs = finMatch[1].split(",").map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
  check("FIN carries Contracts + Budget + Implementation Funding",
    tabs.length === 3 && tabs.indexOf("contracts") >= 0 &&
    tabs.indexOf("budget") >= 0 && tabs.indexOf("implementation-funding") >= 0);
  tabs.forEach(function (t) {
    check("FIN tab '" + t + "' resolves to a real pane",
      cpl.indexOf('id="tab-' + t + '"') >= 0);
  });
})();

// ── Part B — behaviour ──
const SRC = fs.readFileSync("contracts.js", "utf8");

// The V0718 shape, as seeded. Deliberately a fixture rather than a live read:
// the test must fail when the RULES break, not when the network does.
const CONTRACT = {
  id: "c1", agreement_no: "V0718", title: "Mapping Articulated Pathways for CPL",
  vendor_name: "Academic Senate for California Community Colleges", vendor_short: "ASCCC",
  fiscal_agent: "Rancho Santiago CCD", amount_total: "1063900.00",
  term_start_est: "2025-06-30", term_executed: "2025-08-07", term_end: "2028-06-30",
  status: "executed", parse_status: "proposed",
  co_monitor: { name: "Michael Wagner", email: "mwagner@cccco.edu" },
  vendor_contact: { name: "Carrie Roberson", title: "ASCCC North Representative" },
  funding_ref: { funding_year: "2024-25", chapter: "22", statute: "2024" },
  invoice_cadence: "quarterly",
  report_clause: "Every quarterly invoice must include a summary of tasks performed for each deliverable.",
  report_clause_ref: "Section D — Invoice Submission & Payment Process",
  findings: [{ title: "The term start is ambiguous", detail: "Cover page vs Section B.", ref: "Section B" }]
};
const DELIVERABLES = [
  { id: "d1", contract_id: "c1", goal_no: 1, goal_title: "Expand faculty-led development",
    goal_amount: "376120.00", seq: 1, kind: "obligation", status: "not_started",
    label: "Form 15–30 distinct faculty workgroups", countable_target: "15–30",
    countable_unit: "workgroups", recorded_count: null, source_ref: "Goal 1 · deliverable 1",
    goal_preamble: "In Collaboration with the MAP Team and the Chancellor's Office, establish between 15-30 Faculty Workgroups:",
    goal_outcome: "College credit recommendations and validated competencies documented on CPL exhibits.",
    detail: {
      verbatim: "Form 15-30 distinct faculty workgroups to develop college credit recommendations for CPL.",
      parts: ["Developing credit recommendations", "Aligning and validating associated competencies"],
      funded_by: "Faculty stipends: $130,000",
      evaluated_by: "Quarterly check-ins with Chancellor's Office to discuss progress.",
      note: "The hourly rate itself is not stated in the agreement."
    } },
  { id: "d2", contract_id: "c1", goal_no: 1, seq: 2, kind: "obligation", status: "complete",
    label: "Recruit faculty for each workgroup", recorded_count: null },
  { id: "d3", contract_id: "c1", goal_no: 1, seq: 50, kind: "evaluation", status: "not_started",
    cadence: "quarterly", label: "Quarterly check-ins with the Chancellor's Office" },
  { id: "d4", contract_id: "c1", goal_no: 2, goal_title: "Strengthen faculty leadership",
    goal_amount: "567780.00", seq: 1, kind: "obligation", status: "not_started",
    label: "Appoint and stipend CPL Liaisons", countable_target: "115",
    countable_unit: "liaisons × 3 years", recorded_count: null },
  // The six liaison bullets. These are duties of the ROLE, not vendor deliverables.
  { id: "d5", contract_id: "c1", goal_no: 2, seq: 10, kind: "role_duty", status: "not_started",
    label: "Serve as primary points of contact for CPL efforts" },
  { id: "d6", contract_id: "c1", goal_no: 2, seq: 11, kind: "role_duty", status: "not_started",
    label: "Collaborate with local academic senates" },
  { id: "d7", contract_id: "c1", goal_no: 2, seq: 50, kind: "evaluation", status: "not_started",
    cadence: "bi-annual", label: "Bi-annual check-ins with the Chancellor's Office" }
];

function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><div id="contracts-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  if (opts.teamPass) w.localStorage.setItem("cpl_team_pass", opts.teamPass);
  if (opts.jwt) w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: opts.jwt, email: "map@rccd.edu" }));
  w.fetch = function () { return new Promise(function () {}); };  // never resolves — no network in tests
  w.eval(SRC);
  return w;
}
// A syntactically valid stand-in JWT (three dot-separated segments, long enough).
const FAKE_JWT = "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccccccccccccc";

function seeded(opts) {
  const w = makeWin(opts);
  const S = w.CPL_CONTRACTS._state;
  S.contracts = [CONTRACT];
  S.deliverables = DELIVERABLES;
  S.reports = [];
  S.docs = [];
  S.activeId = "c1";
  S.loading = false;
  S.signedIn = !!(opts && opts.jwt);
  return w;
}

// (e) The reporting periods — computed, never carried.
(function () {
  const w = makeWin();
  const C = w.CPL_CONTRACTS;
  const periods = C._periodsFor(CONTRACT);
  check("periods: V0718 spans exactly 12 state-FY quarters", periods.length === 12);
  check("periods: first is 2025-26 Q1 (execution, 7 Aug 2025)", periods[0].label === "2025-26 Q1");
  check("periods: last is 2027-28 Q4 (expiry, 30 Jun 2028)", periods[11].label === "2027-28 Q4");
  check("periods: Q1 is Jul–Sep, matching the state fiscal year",
    periods[0].start.getUTCMonth() === 6 && periods[0].end.getUTCMonth() === 8);
  check("periods: a June date lands in Q4 of the PRIOR fiscal year",
    C._fyOf(new Date(Date.UTC(2028, 5, 30))).fyStart === 2027 &&
    C._fyOf(new Date(Date.UTC(2028, 5, 30))).q === 4);
  check("periods: a July date opens a NEW fiscal year",
    C._fyOf(new Date(Date.UTC(2026, 6, 1))).fyStart === 2026 &&
    C._fyOf(new Date(Date.UTC(2026, 6, 1))).q === 1);
  // A contract with no end date must yield nothing, not an infinite loop.
  check("periods: a contract missing its term yields none, and does not hang",
    C._periodsFor({ term_executed: "2025-08-07", term_end: null }).length === 0);

  // The term. 2025-08-07 → 2028-06-30 is 34 whole months + 23 days.
  const m = C._termMonths(CONTRACT);
  check("term: V0718 measures 34 whole months", m === 34);
  check("⚠ term never rounds DOWN into a claim — 34.8 months reads 'under 35'",
    C._monthsPhrase(m) === "under 35 months");
})();

// (c) The honesty properties — the reason this tab is safe to show a vendor.
(function () {
  const w = seeded({ teamPass: "p" });
  const C = w.CPL_CONTRACTS;
  check("⚠ a null count renders a dash, never 0", C._count(null) === "—" && C._count("") === "—");
  check("...and a real 0 still renders 0", C._count(0) === "0");

  const r = w.document.getElementById("contracts-root");
  C.activate();
  const html = r.innerHTML;
  const text = r.textContent;

  check("the register renders for a team-phrase user", /V0718/.test(text));
  check("⚠ a closed unreported quarter says 'Not recorded'", /Not recorded/.test(text));
  check("⚠ ...and NEVER says 'Not received'", !/Not received/.test(text));
  check("...and the page explains the difference in words",
    /is not/.test(text) && /not received/i.test(text));
  check("the countable commitments carry a dash, not a zero",
    /Recorded/.test(text) && !/\b0 of 15–30\b/.test(text));
  check("the Section D lever is stated with its citation",
    /Section D/.test(text) && /already have the lever/i.test(text));
  check("an unconfirmed parse is badged as machine-read",
    /Parsed, unconfirmed/.test(text));
})();

// (d) A role duty is not a vendor deliverable.
(function () {
  const w = seeded({ teamPass: "p" });
  const C = w.CPL_CONTRACTS;
  const goals = C._goalsOf(DELIVERABLES);
  check("goals: three rows fold into two goals here", goals.length === 2);
  check("goals: the title rides the goal's first row",
    goals[0].title === "Expand faculty-led development" && Number(goals[0].amount) === 376120);

  const g2 = goals[1];
  const dc = C._doneCount(g2.items);
  // Goal 2 holds 1 obligation + 2 role duties + 1 evaluation in this fixture.
  check("⚠ liaison duties do NOT inflate the vendor's obligation denominator",
    dc.total === 1);
  check("...even though the goal carries four rows", g2.items.length === 4);
  const g1 = C._doneCount(goals[0].items);
  check("only obligations count toward done, evaluations excluded",
    g1.total === 2 && g1.done === 1);

  const r = w.document.getElementById("contracts-root");
  C.activate();
  const text = r.textContent;
  check("the split is explained on the page, not just enforced in code",
    /Role duty/.test(text) && /neither fair nor measurable/.test(text));
})();

// (f) A collapsed section still informs.
(function () {
  const w = seeded({ teamPass: "p" });
  const C = w.CPL_CONTRACTS;
  const r = w.document.getElementById("contracts-root");
  C.activate();
  const openGoals = r.querySelectorAll(".ctr-goal.open");
  check("goals start collapsed — a minimal initial view", openGoals.length === 0);

  const head = r.querySelector(".ctr-goal .ctr-gh");
  check("⚠ a COLLAPSED goal header still carries its own figures",
    /obligations complete/.test(head.textContent) && /\$376,120/.test(head.textContent));
  check("...including its countable target", /15–30/.test(head.textContent));
  check("...and its own evaluation cadence", /Quarterly check-in/.test(head.textContent));

  // Open state lives in state.open, not the DOM, because render() rewrites innerHTML.
  head.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  check("clicking a goal opens it", !!r.querySelector(".ctr-goal.open"));
  check("...and the open state survives a re-render (it is not in the DOM)",
    (function () { C.activate(); return !!r.querySelector(".ctr-goal.open"); })());
})();

// Expandable deliverables — the contract's own wording, one click away.
(function () {
  const w = seeded({ teamPass: "p" });
  const C = w.CPL_CONTRACTS;
  const r = w.document.getElementById("contracts-root");
  C.activate();
  // Goal 1 has to be open before its deliverables are reachable.
  r.querySelector('.ctr-goal[data-goal="g1"] .ctr-gh')
    .dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

  check("deliverables start collapsed", r.querySelectorAll(".ctr-item.open").length === 0);
  check("⚠ a collapsed deliverable does NOT leak its contract text into the page",
    r.textContent.indexOf("Form 15-30 distinct faculty workgroups to develop") === -1);
  check("...but the shortened label is visible", /Form 15–30 distinct faculty workgroups/.test(r.textContent));
  check("the goal's outcome shows once at goal level, not per deliverable",
    (r.textContent.match(/validated competencies documented on CPL exhibits/g) || []).length === 1);
  check("the goal's contract preamble renders", /establish between 15-30 Faculty Workgroups/.test(r.textContent));

  const row = r.querySelector('.ctr-item[data-item="d1"] .ctr-irow');
  check("an item with detail is a real toggle button", !!row && row.tagName === "BUTTON");
  check("...and reports its collapsed state to assistive tech",
    row.getAttribute("aria-expanded") === "false");
  row.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

  const opened = r.querySelector('.ctr-item[data-item="d1"]');
  const text = r.textContent;
  check("clicking a deliverable opens it", opened.className.indexOf("open") >= 0);
  check("⚠ the opened item quotes the contract VERBATIM, not the label",
    /Form 15-30 distinct faculty workgroups to develop college credit recommendations for CPL\./.test(text));
  check("...and the verbatim text is visually marked as a quotation",
    !!opened.querySelector(".ctr-quote"));
  check("opened item lists what the clause breaks into",
    /Aligning and validating associated competencies/.test(text));
  check("opened item names what funds it", /Faculty stipends: \$130,000/.test(text));
  check("opened item names how it is evaluated", /Quarterly check-ins/.test(text));
  check("opened item shows target beside what is recorded so far",
    /15–30 workgroups/.test(text) && /recorded so far/.test(text));
  check("⚠ a parse-time observation is kept separate from the contract's words",
    /Worth noting/.test(text) && !!opened.querySelector(".ctr-inote"));

  // Same rule as the goals: open state is in state.openItem, not the DOM.
  check("...and the open item survives a re-render",
    (function () { C.activate(); return r.querySelector('.ctr-item[data-item="d1"]').className.indexOf("open") >= 0; })());

  // Collapsing one item must not collapse the others, or the list is a radio group.
  const d2row = r.querySelector('.ctr-item[data-item="d2"] .ctr-irow');
  check("an item with NO detail is not a fake toggle",
    !d2row || d2row.tagName !== "BUTTON");
})();

// Documents: the private bucket is stricter than the register, and says so.
(function () {
  const team = seeded({ teamPass: "p" });
  team.CPL_CONTRACTS.activate();
  const tText = team.document.getElementById("contracts-root").textContent;
  check("⚠ a team-phrase user is told to sign in for documents, not left to fail",
    /Sign in to upload or open documents/.test(tText));
  check("...and is not offered an upload button that would 400",
    !/Choose a file/.test(tText));

  const rev = seeded({ jwt: FAKE_JWT });
  rev.CPL_CONTRACTS.activate();
  const rText = rev.document.getElementById("contracts-root").textContent;
  check("a signed-in reviewer IS offered the upload", /Choose a file/.test(rText));
  check("a contract with no document says so rather than showing an empty block",
    /No document on file/.test(rText));
})();

// The gate itself: nothing renders from a failed/ungated read.
(function () {
  const w = makeWin();                     // no phrase, no JWT
  const S = w.CPL_CONTRACTS._state;
  S.loading = false; S.contracts = []; S.deliverables = [];
  const r = w.document.getElementById("contracts-root");
  w.CPL_CONTRACTS.activate();
  const text = r.textContent;
  check("gate: an empty read shows an explanation, not a broken page",
    /No contracts on file yet|team-gated/.test(text));
  check("gate: no contract value leaks when the read returns nothing",
    !/1,063,900/.test(text) && !/ASCCC/.test(text));
})();

// An error must read as an error, never as "there is nothing here".
(function () {
  const w = makeWin({ teamPass: "p" });
  const S = w.CPL_CONTRACTS._state;
  S.loading = false; S.error = "HTTP 401 on /cpl_contracts";
  const r = w.document.getElementById("contracts-root");
  w.CPL_CONTRACTS.activate();
  check("⚠ a failed read says it FAILED, not that the register is empty",
    /Could not read the contract register/.test(r.textContent) &&
    !/No contracts on file/.test(r.textContent));
})();

// ── report ──
let failed = 0;
for (const [name, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; }
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);
