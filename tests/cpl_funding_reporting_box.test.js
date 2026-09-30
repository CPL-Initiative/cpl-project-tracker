// CPL Implementation Funding — the Reporting box (S307, 2026-09-30).
//
// Sam's calls on open-asks sheet 6, cards 2–4: a college reports ONCE A YEAR,
// in ALL EIGHT NOVA expenditure categories, and each college sees its own
// figures on My College (that half waits on how college staff sign in). This
// suite guards the reviewer half, built from the round-1 mockup
// (prototype/cplfund_reporting_box_v1.html) re-keyed to fiscal years:
//
//   1. WHO SEES IT. A signed-in reviewer, in the drill-in under the note.
//      Signed out, the public preview and the public page show none of it.
//   2. THE FORM. The window's fiscal years plus the close-out year, the eight
//      categories in NOVA's order, a running total, and refusals in words for
//      a missing reporter or an amount that is not dollars.
//   3. THE LEDGER IS INSERT-ONLY. A correction is a newer report for the same
//      year and the newest counts; a withdrawal is a newer row after which the
//      year counts as unreported; the history keeps every row. Expended to
//      date adds the counting report of each year.
//   4. THE SCHEMA OF RECORD matches: no UPDATE or DELETE policy, both revoked,
//      reviewer-gated read and write, the recorder stamped from the session,
//      and the tab never sends a PATCH or DELETE to the table.
//   5. The PDF drops the entry form and keeps the reports on file.
//
// Windows: 4 booted. Run from repo root: `npm test`
// (or `node tests/cpl_funding_reporting_box.test.js`).
const fs = require("fs");
const path = require("path");
const H = require("./lib/cpl_funding_harness.js");
const { freshDom, boot, click, check, finish, consumerSrc, D } = H;

const ROOT = path.join(__dirname, "..");
const COLLEGE = D.colleges[0].college;
const ID = "c:" + COLLEGE;
const CATS = ["c1000", "c2000", "c3000", "c4000", "c5000", "c6000", "c7000", "c_indirect"];

function reviewerSession() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
}
function setup(opts) {
  opts = opts || {};
  const { window } = freshDom();
  if (opts.public) window.CPL_FUNDING_PUBLIC = true;
  if (opts.signedIn) window.CPL_SESSION = reviewerSession();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T.render();
  return { window, doc, T };
}
function openBox(window, doc) {
  const tr = doc.querySelector('#cplFundTable tr[data-id="' + ID + '"]');
  if (!tr) return null;
  const next = tr.nextElementSibling;
  if (!(next && next.classList.contains("cplfund-detail"))) click(window, tr.querySelector(".cplfund-caret"));
  return doc.querySelector('#cplFundTable .cplfund-rep[aria-label="Reporting for ' + COLLEGE + '"]') ||
    doc.querySelector("#cplFundTable .cplfund-rep");
}
const formOf = (box) => box && box.querySelector("form[data-repform]");
function fill(window, form, vals) {
  Object.keys(vals).forEach((k) => {
    const el = form.querySelector('[data-repf="' + k + '"]') || form.querySelector('[data-repcat="' + k + '"]');
    el.value = vals[k];
    el.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}
function submit(window, form) {
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
}
const sumText = (box) => box.querySelector(".cplfund-rep-sum").textContent.replace(/\s+/g, " ");
const histRows = (box) => Array.from(box.querySelectorAll("table.cplfund-reptable tbody tr"));
const cellText = (tr, i) => tr.cells[i].textContent.replace(/\s+/g, " ").trim();
function nextFy(fy) {
  const m = /^(\d{4})-(\d{2})$/.exec(fy);
  const a = Number(m[1]) + 1;
  return a + "-" + String((a + 1) % 100).padStart(2, "0");
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Who sees it
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window, doc } = setup();
  const box = openBox(window, doc);
  check("1a: signed out, the drill-in opens with no Reporting box",
    !!doc.querySelector('#cplFundTable tr[data-id="' + ID + '"] + tr.cplfund-detail') && !box);
}
{
  const { window, doc } = setup({ public: true, signedIn: true });
  check("1b: the public page shows no Reporting box, even to a signed-in reviewer", !openBox(window, doc));
}
{
  const { window, doc, T } = setup({ signedIn: true });
  const box = openBox(window, doc);
  check("1c: signed in, the drill-in carries the Reporting box", !!box);
  const note = doc.querySelector("#cplFundTable .cplfund-notewrap");
  check("1d: …after the CO Monitor's note, in the same detail grid",
    !!note && !!box && note.parentNode === box.parentNode &&
    (note.compareDocumentPosition(box) & window.Node.DOCUMENT_POSITION_FOLLOWING) !== 0);
  check("1e: …with no priority figure cell holding any of it (the readCells caveat)",
    !!box && !box.closest("td.c, .cplfund-subrow"));
  T._state.previewPublic = true;
  T.render();
  check("1f: previewing Public hides it", !openBox(window, doc));
  T._state.previewPublic = false;
  T.render();

  // ───────────────────────────────────────────────────────────────────────────
  // 2. The form
  // ───────────────────────────────────────────────────────────────────────────
  const b2 = openBox(window, doc);
  const form = formOf(b2);
  const years = Array.from(form.querySelectorAll('[data-repf="fiscal_year"] option')).map((o) => o.value);
  const win = D.default_years;
  check("2a: the fiscal years are the window's, then its close-out year",
    JSON.stringify(years) === JSON.stringify(win.concat([nextFy(win[win.length - 1])])));
  const cats = Array.from(form.querySelectorAll("[data-repcat]"));
  check("2b: all eight NOVA categories, in object-code order, each inside its label",
    JSON.stringify(cats.map((el) => el.getAttribute("data-repcat"))) === JSON.stringify(CATS) &&
    cats.every((el) => el.closest("label") && /^(\d000 |Indirect costs)/.test(el.closest("label").textContent)));
  check("2c: the summary reads $0 to date, none of the years reported, beside the max award",
    /Expended to date \$0/.test(sumText(b2)) && new RegExp("0 of " + years.length + " fiscal years reported").test(sumText(b2)) &&
    /Max award \$[\d,]+/.test(sumText(b2)));
  check("2d: with nothing on file it says so in words", /No reports on file\./.test(b2.textContent));
  fill(window, form, { c1000: "9,600", c3000: "$3,950.50", c_indirect: "880" });
  check("2e: the running total adds the categories as they are typed",
    form.querySelector("[data-reptotal]").textContent === "$14,431");
  submit(window, form);
  check("2f: no reporter named: refused in words, nothing saved",
    /Name who at the college reported it/.test(form.querySelector("[data-repmsg]").textContent) && T._reports().length === 0);
  fill(window, form, { reported_by: "Dean of Instruction", c2000: "abc" });
  submit(window, form);
  check("2g: an amount that is not dollars: refused, naming its category",
    /2000 Noninstructional salaries/.test(form.querySelector("[data-repmsg]").textContent) && T._reports().length === 0);
  fill(window, form, { c2000: "-5" });
  submit(window, form);
  check("2h: a negative amount is refused too", T._reports().length === 0);

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Save, correct, withdraw
  // ───────────────────────────────────────────────────────────────────────────
  fill(window, form, { c2000: "0", reported_on: "2027-07-15", note: "Reassigned time for two evaluators." });
  submit(window, form);
  const saved = T._reports();
  check("3a: a valid report saves one row with the year, the reporter and every category",
    saved.length === 1 && saved[0].college === COLLEGE && saved[0].fiscal_year === years[0] &&
    saved[0].reported_by === "Dean of Instruction" && saved[0].reported_on === "2027-07-15" &&
    saved[0].c1000 === 9600 && saved[0].c3000 === 3950.5 && saved[0].c_indirect === 880 &&
    CATS.every((k) => typeof saved[0][k] === "number") && !saved[0].withdrawn);
  let b3 = openBox(window, doc);
  check("3b: the summary adds it: $14,431 to date, 1 fiscal year reported",
    /Expended to date \$14,431/.test(sumText(b3)) && new RegExp("1 of " + years.length + " fiscal years").test(sumText(b3)));
  let rows = histRows(b3);
  check("3c: the history shows it, counting, with a Withdraw control named for its year",
    rows.length === 1 && cellText(rows[0], 0) === years[0] && cellText(rows[0], 1) === "$14,431" &&
    /^Counts/.test(cellText(rows[0], 4)) &&
    /Withdraw the 2026-27 report/.test((rows[0].querySelector("[data-repwithdraw]") || { getAttribute: () => "" }).getAttribute("aria-label")));
  check("3d: the history region scrolls in its own box, labeled, with header scopes",
    !!b3.querySelector('.cplfund-rep-hwrap[role="region"][aria-label][tabindex="0"]') &&
    Array.from(b3.querySelectorAll("table.cplfund-reptable th")).every((th) => th.getAttribute("scope") === "col"));

  // A correction for the same year: the newer counts, the older stays.
  const f3 = formOf(b3);
  fill(window, f3, { reported_by: "Dean of Instruction", c1000: "10,000" });
  submit(window, f3);
  b3 = openBox(window, doc);
  rows = histRows(b3);
  check("3e: a correction is a new row; the newest counts and the older reads as replaced",
    T._reports().length === 2 && rows.length === 2 && /^Counts/.test(cellText(rows[0], 4)) &&
    cellText(rows[1], 4) === "Replaced by a newer report" && !rows[1].querySelector("[data-repwithdraw]"));
  check("3f: expended to date follows the correction, not the sum of both",
    /Expended to date \$10,000/.test(sumText(b3)) && new RegExp("1 of " + years.length).test(sumText(b3)));

  // A second year adds to the first.
  const f4 = formOf(b3);
  fill(window, f4, { fiscal_year: years[1], reported_by: "VP Instruction", c5000: "2,500" });
  submit(window, f4);
  b3 = openBox(window, doc);
  check("3g: a second year adds: $12,500 across 2 fiscal years",
    /Expended to date \$12,500/.test(sumText(b3)) && new RegExp("2 of " + years.length).test(sumText(b3)));

  // Withdraw the first year's report.
  const wd = Array.from(b3.querySelectorAll("[data-repwithdraw]")).find((b) => b.getAttribute("data-repyear") === years[0]);
  click(window, wd);
  const all = T._reports();
  b3 = openBox(window, doc);
  rows = histRows(b3);
  check("3h: Withdraw writes a newer row for that year, with no figures",
    all.length === 4 && all[3].withdrawn === true && all[3].fiscal_year === years[0] && all[3].college === COLLEGE &&
    CATS.every((k) => !all[3][k]));
  check("3i: …after which the year counts as unreported and the other year stands",
    /Expended to date \$2,500/.test(sumText(b3)) && new RegExp("1 of " + years.length).test(sumText(b3)));
  check("3j: …and the history keeps every row, the withdrawal reading as such",
    rows.length === 4 && rows.some((r) => cellText(r, 4) === "Withdrawn" && cellText(r, 1) === "—") &&
    !Array.from(b3.querySelectorAll("[data-repwithdraw]")).some((b) => b.getAttribute("data-repyear") === years[0]));
  check("3k: every row names who recorded it and when",
    rows.every((r) => /co@cccco\.edu/.test(cellText(r, 3)) && /\d{4}-\d{2}-\d{2}/.test(cellText(r, 3))));

  // ───────────────────────────────────────────────────────────────────────────
  // 5. The PDF drops the form and keeps the reports on file
  // ───────────────────────────────────────────────────────────────────────────
  const html = T._printHtml();
  check("5a: the print window carries the reports on file and no entry form",
    /Reports on file/.test(html) && /Expended to date/.test(html) && !/data-repform/.test(html) && !/Save report/.test(html));
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. The schema of record and the writer agree: INSERT-only, reviewer-gated
// ─────────────────────────────────────────────────────────────────────────────
{
  const sql = fs.readFileSync(path.join(ROOT, "funding", "supabase_cpl_funding_reports.sql"), "utf8");
  const code = sql.replace(/--[^\n]*/g, "");
  check("4a: no UPDATE or DELETE policy on the table",
    !/create policy[^;]*for (update|delete|all)/i.test(code));
  check("4b: UPDATE and DELETE revoked from the API roles",
    /revoke update, delete, truncate on public\.cpl_funding_reports from anon, authenticated/i.test(code));
  check("4c: read and write gate on is_allowed_reviewer()",
    /cfr_select[^;]*for select[^;]*using \(is_allowed_reviewer\(\)\)/i.test(code) &&
    /cfr_insert[^;]*for insert[^;]*with check \(is_allowed_reviewer\(\)\)/i.test(code));
  check("4d: the recorder is stamped from the session, never trusted from the body",
    /new\.recorded_by := coalesce\(nullif\(auth\.jwt\(\) ->> 'email', ''\)/.test(code) && /new\.recorded_at := now\(\)/.test(code));
  check("4e: all eight categories are columns",
    CATS.every((k) => new RegExp("\\b" + k + "\\s+numeric").test(code)));
  const writer = consumerSrc.slice(consumerSrc.indexOf("var REPORTS_URL"), consumerSrc.indexOf("function reportingBoxHtml"));
  check("4f: the tab only reads and POSTs the table: no PATCH, no DELETE, no upsert",
    writer.length > 0 && /method: "POST"/.test(writer) && !/PATCH|DELETE|merge-duplicates|on_conflict/.test(writer));
  const gov = JSON.parse(fs.readFileSync(path.join(ROOT, "kb", "governance_surface_map.json"), "utf8"));
  check("4g: the governance map places the table under DR-09",
    JSON.stringify(gov).indexOf('"table:cpl_funding_reports":"DR-09"') !== -1);
}

finish();
