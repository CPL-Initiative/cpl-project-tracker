// tests/cpl_funding_s478_asks.test.js
//
// SAM'S FIVE FUNDING-PAGE ASKS OF 2026-10-25 (Session 478), the parts that live
// in cpl_funding.js. What this pins, in order of how expensive each would be to
// get wrong:
//
//   ⚠️ 1. TWO FUNDING COLUMNS. "Consolidating the 4 CR and NC Max and Curr
//   columns into just 2 Max and Curr columns and show the totals on the Priority
//   rows." Max Funds and Curr Funds show by default; the split columns wait in
//   the Columns menu. Each priority and outcome row carries its own figure in
//   the two shown columns, with the hovers that say how it is reached and the
//   reviewer's Unit sources word, which lived in the split columns until now.
//   The noncredit lane's "Reported, not funded" line left the table.
//
//   ⚠️ 2. THE NONCREDIT CONDITION NAMES THE NONCREDIT CPL LEAD, and the
//   strike-team checkbox retires: one noncredit condition gates the share.
//
//   ⚠️ 3. THE REPORT BOX FOLDS behind a Report word that names the nearest
//   report deadline not yet met, read from the timeline, which every rendering
//   sorts by date while edits keep the stored position.
//
//   4. The Contents' fixed links take a curator's words (pubLinks).
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_s478_asks.test.js`).
const H = require("./lib/cpl_funding_harness.js");
const { check, freshDom, boot, consumerSrc, finish, click, colKeys, openDrill } = H;

const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const OUTCOMES = {
  ncLane: "outcomes",
  ncOutcomes: { "1": [
    { key: "exh", title: "Exhibits built or adopted", share: 0.5, goals: ["A"], unit_word: "exhibits",
      metric: "Exhibits in MAP built or adopted", metric_src: "nc_exh",
      target_rule: { kind: "pct_floor_cap", of: "nc_cdcp", pct: 0.05, floor: 2, cap: 10 } },
    { key: "course", title: "Noncredit CPL portfolio-development course", share: 0.5, goals: ["A"], unit_word: "courses",
      metric: "A noncredit CPL portfolio-development course", metric_src: "nc_course", target_rule: { kind: "fixed", n: 1 } }
  ] },
  ncReported: [{ key: "awarded", title: "Former noncredit students awarded CPL credit", text: "The count the college reports." }],
  timing: [
    { label: "CPL Funding Procedure Finalized", date: "Oct 2026" },
    { label: "Confirmation Deadline", date: "Dec 31, 2026" },
    { label: "First Disbursement based on cumulative CPL", date: "Feb 2027" },
    { label: "Potential Year 3 Depending on Funding Availability", date: "" },
    { label: "First Report Deadline", date: "Jan 31, 2027" },
    { label: "Second Report Deadline", date: "Jun 30, 2027" },
    { label: "Third Report Deadline", date: "Nov 30, 2027" }
  ]
};
const PERF = { as_of: "2026-10-25", suppress_below: 10,
  statewide: { pa_u: 10, nc_exh: 5, nc_cdcp: 196, nc_course: 0 },
  colleges: { "Mt San Antonio": { pa_u: 100, nc_exh: 5, nc_cdcp: 196, nc_course: 0 } },
  feeders: {}, unmatched: {}, vet_star: {}, origination: { in_scope: {} } };
const COLLEGE = "Mt San Antonio";
function session() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
}
function setup(opts) {
  opts = opts || {};
  const { window } = freshDom();
  if (opts.signedIn) window.CPL_SESSION = session();
  window.CPL_FUNDING_PERF = JSON.parse(JSON.stringify(PERF));
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const shared = T._getShared();
  T._setShared(Object.assign({}, shared, JSON.parse(JSON.stringify(OUTCOMES)),
    { pool: Object.assign({}, shared.pool, { nc_portion_pct: 15 }) }));
  T._setElig({ coordOk: true, coord: { [COLLEGE]: true }, optin: { [COLLEGE]: { status: "self_attested" } },
    ncAttestOk: true, ncAttest: {} });
  T.render();
  return { window, doc, T };
}
// The column a cell sits under is hidden by the table's own style rule.
function hiddenKeys(doc) {
  const css = Array.from(doc.querySelectorAll("style")).map((s) => s.textContent).join("\n");
  return colKeys(doc).filter((k, i) => new RegExp("thead > tr > th:nth-child\\(" + (i + 1) + "\\)[^{]*\\{display:none\\}").test(css));
}

// ── 1. two funding columns ──────────────────────────────────────────────────
{
  const { window, doc } = setup({ signedIn: true });
  const keys = colKeys(doc), hid = hiddenKeys(doc);
  const shown = keys.filter((k) => hid.indexOf(k) < 0);
  const head = (k) => flat(doc.querySelectorAll("#cplFundTable thead th")[keys.indexOf(k)]);
  check("1a ⭐ the table shows the institution, Max Funds and Curr Funds; the CR and NC split columns are hidden",
    shown.join(",") === "college,total,current_total" &&
    ["cr_award", "cr_current", "nc_award", "nc_current"].every((k) => hid.indexOf(k) >= 0));
  check("1b the two headers read Max Funds and Curr Funds (Current Funds to a screen reader)",
    /^Max Funds/.test(head("total")) && /Curr\s*Current\s*Funds/.test(head("current_total")));
  const menu = Array.from(doc.querySelectorAll(".cplfund-colmenu-item")).map(flat);
  check("1c the split columns stay in the Columns menu", ["Max CR Funds", "Current CR Funds", "Max NC Funds", "Current NC Funds"]
    .every((w) => menu.indexOf(w) >= 0));
  check("1d a fresh browser starts from the v3 column store, and the v1 and v2 stores are cleared",
    /var COLS_STORE = "cplfund_cols_v3"/.test(consumerSrc) && /COLS_STORE_RETIRED = \["cplfund_cols_v1", "cplfund_cols_v2"\]/.test(consumerSrc));
  const d = openDrill(window, doc, "c:" + COLLEGE);
  const isOut = (c) => c.college.td.closest("tr").classList.contains("cplfund-ncoutrow");
  const credit = d.cells.filter((c) => !isOut(c));
  const outs = d.cells.filter(isOut);
  check("1e ⭐ each credit priority row carries its figure in Max Funds and Curr Funds, its hovers with it",
    credit.length > 0 && credit.every((c) => /^\$[\d,]+$/.test(c.total.fig) && /FTES|stu/.test(c.total.line) &&
      /Max Funds|share/i.test(c.total.tip) && /still to qualify for/.test(c.current_total.tip)));
  check("1f under the outcomes lane a credit row's Max Funds is its Max CR Funds",
    credit.every((c) => c.total.fig === c.cr_award.fig));
  check("1g each noncredit outcome row carries its own figure and target, with how it is reached on hover",
    outs.length === 2 && outs.every((c) => /^\$[\d,]+$/.test(c.total.fig) && /^Target/.test(c.total.line) &&
      /noncredit funding/.test(c.total.tip) && c.total.fig === c.nc_award.fig));
  check("1h the reviewer's Unit sources word rides Curr Funds, once per row",
    d.rows.every((r) => r.querySelectorAll(".cplfund-srclink").length <= 1) &&
    d.rows.filter((r) => r.querySelector(".cplfund-srclink")).every((r) => {
      const i = colKeys(doc).indexOf("current_total");
      return !!r.cells[i].querySelector(".cplfund-srclink");
    }));
  check("1i ⭐ the band over the rows reads Max Funds and Curr Funds",
    d.bandCells && /^Max Funds$/.test(d.bandCells.total.text) && /Funds$/.test(d.bandCells.current_total.text));
  check("1j the noncredit lane's reported count left the table (Sam struck the line)",
    !d.all.some((tr) => /Reported, not funded/.test(flat(tr))));
  const foot = flat(doc.querySelector(".cplfund-foot"));
  check("1k the sources line drops the headcount and the Census while the table reads neither",
    /Sources:/.test(foot) && !/Annual\/Term Student Count/.test(foot) && !/American Community Survey/.test(foot));
}

// ── 2. the Noncredit CPL Lead ───────────────────────────────────────────────
{
  const { window, doc, T } = setup();
  const det = openDrill(window, doc, "c:" + COLLEGE).first;
  const nc = flat(det && det.querySelector(".cf-conds-nc"));
  check("2a ⭐ the noncredit share's condition names the Noncredit CPL Lead; the strike-team checkbox is gone",
    /Noncredit CPL Lead not yet attested/.test(nc) && !/[Ss]trike/.test(nc) && !/coordinator/i.test(nc));
  check("2b one noncredit condition gates the share: the Lead",
    T._alloc(COLLEGE).nc_gate_blocked === true && /Noncredit CPL Lead named and published/.test(consumerSrc) &&
    !/Noncredit CPL coordinator/.test(consumerSrc));
  click(window, det.querySelector("[data-ncattestopen]"));
  // Email first (2026-10-28): the address opens the rest of the form.
  doc.querySelector('[data-ncattestwrap] [data-ncattestfield="email"]').value = "dean@college.edu";
  click(window, doc.querySelector("[data-ncattestwrap] [data-ncattestemailgo]"));
  const wrap = doc.querySelector("[data-ncattestwrap]");
  check("2c the attestation names the Lead and has the Lead meet regularly with the CPL Coordinator",
    /The Noncredit CPL Lead/.test(flat(wrap)) && /meets regularly with the college's CPL Coordinator/.test(flat(wrap)) &&
    !/strike team/i.test(flat(wrap)));
}

// ── 3. the timeline in date order, and the Report fold ──────────────────────
{
  const { window, doc, T } = setup({ signedIn: true });
  const order = T._timing().map((t) => t.label);
  check("3a ⭐ the timeline renders in date order; a milestone with no date follows the dated ones",
    order.join("|") === ["CPL Funding Procedure Finalized", "Confirmation Deadline", "First Report Deadline",
      "First Disbursement based on cumulative CPL", "Second Report Deadline", "Third Report Deadline",
      "Potential Year 3 Depending on Funding Availability"].join("|"));
  check("3b the report deadlines are the milestones naming a report and a deadline, each in its fiscal year",
    T._reportDeadlines().map((x) => x.iso + " " + x.fy).join(",") === "2027-01-31 2026-27,2027-06-30 2026-27,2027-11-30 2027-28");
  check("3c with no report on file, the nearest deadline not met is the first",
    T._nextReportDue(COLLEGE, "2026-10-25").iso === "2027-01-31" && T._nextReportDue(COLLEGE, "2026-10-25").overdue === false &&
    T._nextReportDue(COLLEGE, "2027-02-10").overdue === true);
  T._setReports([{ college: COLLEGE, fiscal_year: "2026-27", reported_on: "2027-01-20", c1000: 5 }]);
  check("3d a 2026-27 report meets the year's first deadline; the second needs one filed after it",
    T._nextReportDue(COLLEGE, "2027-02-01").iso === "2027-06-30");
  T._setReports([{ college: COLLEGE, fiscal_year: "2026-27", reported_on: "2027-01-20", c1000: 5 },
    { college: COLLEGE, fiscal_year: "2026-27", reported_on: "2027-06-15", c1000: 9 }]);
  check("3e a second 2026-27 report after the first deadline meets the second; the next is 2027-28's",
    T._nextReportDue(COLLEGE, "2027-07-01").iso === "2027-11-30");
  T._setReports([{ college: COLLEGE, fiscal_year: "2026-27", reported_on: "2027-01-20", c1000: 5 },
    { college: COLLEGE, fiscal_year: "2026-27", withdrawn: true, recorded_at: "2027-01-25T00:00:00Z" }]);
  check("3f a year whose newest row is a withdrawal meets none of its deadlines",
    T._nextReportDue(COLLEGE, "2027-02-01").iso === "2027-01-31");
  T._setReports([]);
  T.render();
  const det = openDrill(window, doc, "c:" + COLLEGE).first;
  const word = det && det.querySelector("[data-repopen]");
  const box = det && det.querySelector(".cplfund-rep");
  check("3g ⭐ the Reporting box opens folded, behind its Report word naming the nearest deadline",
    !!word && !!box && box.hidden === true && word.getAttribute("aria-expanded") === "false" &&
    word.getAttribute("aria-controls") === box.id && /^Report (by|overdue, due) 01-31-27$/.test(flat(word)) &&
    /First Report Deadline/.test(word.getAttribute("title")));
  click(window, word);
  check("3h the word opens the box and says so; a second press folds it", box.hidden === false &&
    word.getAttribute("aria-expanded") === "true" && (click(window, word), box.hidden === true));
  const pub = (function () {
    const { window: w } = freshDom();
    w.CPL_FUNDING_PUBLIC = true;
    w.CPL_FUNDING_PERF = JSON.parse(JSON.stringify(PERF));
    const dd = boot(w);
    return dd.querySelector("[data-repopen]");
  })();
  check("3i the public rendering has no Report word", pub === null);
}

// ── 4. the Contents' fixed links ────────────────────────────────────────────
{
  const { T } = setup();
  check("4a the fixed links are the memo, the memo in Word, the video, its narrated cut and the three help links",
    T.publicLinkIds().join(",") === "memo,memo_word,video,video_narrated,hours,landing,training");
  T.setPubLinkLabel("video", "  Watch the  introduction ", "Watch the 100-second introduction");
  T.setPubLinkLabel("memo", "Read the funding guidance memo", "Read the funding guidance memo");
  T.setPubLinkLabel("nope", "Anything", "");
  check("4b a rename stores one plain line; the house words and an unknown id store nothing",
    T.pubLinkLabel("video") === "Watch the introduction" && T.pubLinkLabel("memo") === null && T.pubLinkLabel("nope") === null);
  T.setPubLinkLabel("video", "", "Watch the 100-second introduction");
  check("4c clearing restores the house words", T.pubLinkLabel("video") === null);
}

finish();
