// CPL Implementation Funding — Sam's four Public view tweaks of 2026-09-30 (S308).
//
//   1. "For all text views possible on this tab eliminate the gray background
//      box to simplify visually." Minimum Conditions, the Timeline, the Total
//      Possible strip, the formula, the basis line and the goal-alignment
//      paragraph lose their fill and border.
//   2. "Eliminate any unnecessary line breaks or font size changes with text
//      to enhance readability." Those blocks read at the prose size (.92rem).
//      In the Public view each minimum condition is one paragraph, its live
//      status running on from the requirement ("Local confirmation on file by
//      2026-11-01. 0 of 116 colleges confirmed so far ..."), and the two folds
//      under the priority cards share one face.
//   3. "Delete the 2 marked chips": Copy requirements and Generate brief leave
//      the Public view (with the Add requirement row and its save note). The
//      curator's view keeps them, where the memo and the brief are made.
//   4. "Fix the dates so they are appropriately spaced." The Public view's
//      Timeline printed "Funding Model FinalizedSep 2026": edText returns bare
//      text there, and two bare text nodes in a flex row join into one
//      anonymous item. Each value now has its own span.
//
// Windows: 6. Run from repo root: `npm test`
// (or `node tests/cpl_funding_public_view_text.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }

function session() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
}
const TIMING = [{ date: "Sep 2026", label: "Funding Model Finalized" },
  { date: "Nov 2026", label: "Confirmation Deadline" },
  { date: "", label: "Potential Year 3 Depending on Funding Availability" }];
const VET = "Minimum of 75% of enrolled veteran Joint Services Transcripts uploaded in MAP and processed for CPL";
function setup(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body>' +
    '<div id="tab-implementation-funding"><div><h2>x</h2><span id="cplFundTitleLink"></span></div>' +
    '<div id="cplFundingMount"></div></div></body></html>',
    { url: opts.url || "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.scrollTo = function () {};
  w.Element.prototype.scrollIntoView = function () {};
  w.CPL_FUNDING_NO_REMOTE = true;
  w.fetch = function () { return new Promise(function () {}); };
  if (opts.signedIn) w.CPL_SESSION = session();
  const run = (f) => { const s = w.document.createElement("script"); s.textContent = read(f); w.document.body.appendChild(s); };
  ["college_short_names.js", "cpl_funding_data.js", "cpl_funding.js"].forEach(run);
  w.CPL_FUNDING_PERF = Object.assign({}, w.CPL_FUNDING_PERF || {}, {
    vet_star: { "Alameda": true, "Laney": true, "Berkeley City": false }, vet_star_as_of: "2026-09-30" });
  const T = w.CPL_FUNDING_TAB;
  T.boot();
  T._setShared({ extraReqs: [VET], partLabel: "Local confirmation on file by", timing: TIMING,
    participationDeadline: "2026-11-01" });
  if (opts.preview) T._state.previewPublic = true;
  if (opts.eye) T._state.publicEye = true;
  T.render();
  return { w, doc: w.document, T };
}
const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();

// ── the stylesheet the tab injects ─────────────────────────────────────────
function cssRule(css, sel) {
  const at = css.indexOf(sel + " {");
  if (at === -1) return null;
  return css.slice(at, css.indexOf("}", at) + 1);
}
{
  const { doc } = setup({ url: "https://example.org/?fundview=public#implementation-funding" });
  const css = doc.getElementById("cpl-funding-css").textContent;
  const boxes = [".cplfund-elig", ".cplfund-timing", ".cplfund-formula", ".cplfund-basis", ".cplfund-otot"];
  boxes.forEach((sel) => {
    const r = cssRule(css, sel);
    check("1: " + sel + " paints no box (no background, no border)", !!r && !/background|border/.test(r));
  });
  check("1: the goal-alignment paragraph lost its box rule",
    css.indexOf(".cplfund-goal-align {") === -1);
  const prose = cssRule(css, ".cplfund-prose p");
  const proseSize = prose && (prose.match(/font-size: ([\d.]+rem)/) || [])[1];
  check("2: the prose size the text blocks match is .92rem", proseSize === ".92rem");
  [".cplfund-elig", ".cplfund-timing", ".cplfund-timing-note", ".cplfund-formula"].forEach((sel) => {
    const r = cssRule(css, sel);
    check("2: " + sel + " reads at the prose size", !!r && r.indexOf("font-size: " + proseSize) !== -1);
  });
  const status = cssRule(css, ".cplfund-reqstatus");
  check("2: a requirement's status line keeps the requirement's size (no font-size of its own)",
    !!status && !/font-size/.test(status));
  check("2: the two folds under the priority cards share one rule",
    css.indexOf(".cplfund-goalspine-fold > summary, .cplfund-ncrules > summary {") !== -1);
}

// ── the Public view, as a reader opens it by link ──────────────────────────
function publicChecks(label, env) {
  const { doc } = env;
  const root = doc.querySelector("#cplFundingMount > .cplfund");
  check(label + ": the root carries cplfund-pub", !!root && root.classList.contains("cplfund-pub"));
  const elig = doc.querySelector(".cplfund-elig");
  check(label + ": Minimum Conditions renders", !!elig);
  if (!elig) return;
  const rows = Array.from(elig.querySelectorAll(".cplfund-reqitem"));
  check(label + ": three conditions, each one paragraph (no status line of its own)",
    rows.length === 3 && rows.every((r) => r.children.length === 1 && r.querySelector(".cplfund-reqrow")) &&
    !elig.querySelector("div.cplfund-reqstatus"));
  const part = rows.map((r) => norm(r.textContent)).find((t) => /Local confirmation/.test(t)) || "";
  check(label + ": the deadline reads into the requirement (" + part.slice(0, 60) + ")",
    /^•\s*Local confirmation on file by 2026-11-01\. \d+ of \d+ colleges confirmed so far/.test(part) &&
    !/deadline/.test(part));
  const vet = rows.map((r) => norm(r.textContent)).find((t) => /Joint Services/.test(t)) || "";
  check(label + ": the veteran status and the noncredit sentence finish the veteran paragraph",
    /processed for CPL\. \d+ of \d+ colleges meet this\./.test(vet) &&
    /The three noncredit-only institutions meet this requirement/.test(vet));
  check(label + ": no Copy requirements or Generate brief",
    !doc.getElementById("cplFundReqCopy") && !doc.getElementById("cplFundReqBrief") &&
    !/Copy requirements|Generate brief/.test(elig.textContent));
  check(label + ": no Add requirement row or its save note",
    !elig.querySelector(".cplfund-reqadd") && !/saved for the whole team|explored on this browser/.test(elig.textContent));
  const trows = Array.from(doc.querySelectorAll(".cplfund-timing-row"));
  const bare = trows.some((r) => Array.from(r.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim()));
  check(label + ": every Timeline value sits in its own element (no bare text in a flex row)",
    trows.length === TIMING.length && !bare);
  check(label + ": each label and date keep their classes, apart",
    trows.length === TIMING.length && trows.every((r, i) =>
      norm((r.querySelector(".cplfund-timing-label") || {}).textContent) === TIMING[i].label &&
      norm((r.querySelector(".cplfund-timing-date") || {}).textContent) === TIMING[i].date));
  const folds = [doc.querySelector(".cplfund-goalspine-fold > summary"), doc.querySelector(".cplfund-ncrules > summary")];
  check(label + ": both folds carry a title and a muted gloss, the same way",
    folds.every((s) => s && s.querySelector("strong") && s.querySelector(".dk")) &&
    norm(folds[1].textContent) === "The noncredit funding rules — show them");
}
publicChecks("by link", setup({ url: "https://example.org/?fundview=public#implementation-funding" }));
publicChecks("As colleges see it", setup({ signedIn: true, preview: true, eye: true }));

// ── the curator's own view keeps its tools and its editable fields ─────────
{
  const { doc } = setup({ signedIn: true });
  const root = doc.querySelector("#cplFundingMount > .cplfund");
  check("3: the internal view carries no cplfund-pub", !!root && !root.classList.contains("cplfund-pub"));
  check("3: the internal view keeps Copy requirements and Generate brief",
    !!doc.getElementById("cplFundReqCopy") && !!doc.getElementById("cplFundReqBrief"));
  check("3: and Add requirement", !!doc.getElementById("cplFundReqAdd"));
  check("3: the deadline stays an editable field on the participation status line",
    !!doc.querySelector('div.cplfund-reqstatus input[data-edit="deadline"]'));
  check("4: the Timeline stays editable there",
    doc.querySelectorAll('input[data-edit="timing-label"]').length === TIMING.length &&
    doc.querySelectorAll('input[data-edit="timing-date"]').length === TIMING.length);
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
