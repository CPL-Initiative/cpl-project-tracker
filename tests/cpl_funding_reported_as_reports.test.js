// CPL Implementation Funding — a reported outcome shown AS A REPORT (sheet 4,
// card 7). Sam, 2026-09-29, on Scenario 2: "I will be reporting on P3 Career
// Attainment together with P4 projects using more qualitative data rather than
// tying it to FTES." He approved the mockup on 2026-09-30 ("go ahead with the
// card 7 mockup"): each reported card says what is reported, when and where,
// and carries no target, FTES or funding line.
//
// What is guarded:
//  (a) with `reportedAsReports` on, a reported card prints NO figure: no Metric
//      block, no Project allocation section, no dollar sign anywhere on it;
//  (b) it carries the state word and the what / when rows, and an empty "when"
//      reads TBA (Sam, 2026-09-28: "show TBA everywhere");
//  (c) the setting is a SCENARIO setting: without it the card is the one it
//      always was, Project allocation included (Scenario 1 keeps its cards);
//  (d) a curator edits the report's words, and the card reads them back.
//
// Run from repo root: `node tests/cpl_funding_reported_as_reports.test.js`.
const { check, freshDom, boot, commit, finish } = require("./lib/cpl_funding_harness.js");

const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const reported = (doc) => Array.from(doc.querySelectorAll("[data-rcard]"));
const KEY = "cpl_funding_whatif_v3";
const SLOT = "cpl-implementation::Scenario 1";

function reviewerSession() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
}
function bootWith(override, signedIn) {
  const { window } = freshDom();
  if (override) window.localStorage.setItem(KEY, JSON.stringify({ [SLOT]: override }));
  if (signedIn) window.CPL_SESSION = reviewerSession();
  const doc = boot(window);
  window.CPL_FUNDING_TAB.render();
  return { window, doc };
}
const S2_SHAPE = {
  reportedAsReports: true,
  reportedCards: ["C", "D"],
  reportedTitles: { C: "Career Attainment", D: "Innovation Projects" }
};

// ── (a) + (b) the report shape, read as the public reads it ─────────────────
{
  const { doc } = bootWith(S2_SHAPE, false);
  const rc = reported(doc);
  check("(a) both reported cards render, C and D", rc.length === 2 &&
    rc.map((c) => c.getAttribute("data-rprio")).join(",") === "C,D");
  check("(a) a report carries no Metric block", rc.every((c) => !c.querySelector(".metric")));
  check("(a) a report carries no Project allocation section",
    rc.every((c) => !/Project allocation/i.test(flat(c))));
  check("(a) a report prints no dollar figure at all", rc.every((c) => flat(c).indexOf("$") === -1));
  check("(b) each report carries the state word Reported",
    rc.every((c) => flat(c.querySelector(".cplfund-rstate")) === "Reported"));
  check("(b) each report says what is reported",
    rc.every((c) => /What is reported/.test(flat(c)) && flat(c.querySelector(".cplfund-rrow-v")).length > 20));
  check("(b) an empty When reads TBA", rc.every((c) => {
    const rows = Array.from(c.querySelectorAll(".cplfund-rrow"));
    const when = rows.find((r) => /^When/.test(flat(r)));
    return !!when && /TBA/.test(flat(when));
  }));
  check("(b) an empty Where is left off the public card",
    rc.every((c) => !Array.from(c.querySelectorAll(".cplfund-rrow")).some((r) => /^Where/.test(flat(r)))));
  // The internal view edits the title in place, so it is an input's value.
  const titleOf = (c) => { const i = c.querySelector('[data-edit="rtitle"]'); return i ? i.value : flat(c); };
  // A title equal to the outcome's own name reads as the outcome (cardHeadHtml),
  // so Career Attainment heads its card as "(C) Career attainment".
  check("(b) the titles are the curator's", /career attainment/i.test(flat(rc[0].querySelector(".cplfund-cardhead"))) &&
    titleOf(rc[1]) === "Innovation Projects");
  check("(b) Career Attainment cites the statute's (C) goal", /78093\.2\(d\)\(1\)\(C\)/.test(flat(rc[0])));
}

// ── (c) without the setting, the card is the one it always was ──────────────
{
  const { doc } = bootWith({ reportedCards: ["D"] }, false);
  const rc = reported(doc);
  check("(c) without reportedAsReports the card keeps its Metric block",
    rc.length === 1 && !!rc[0].querySelector(".metric"));
  check("(c) and its Project allocation section", /Project allocation/i.test(flat(rc[0])));
  check("(c) and no Reported state word", !rc[0].querySelector(".cplfund-rstate"));
}

// ── (d) a curator edits the report's words ──────────────────────────────────
{
  const { window, doc } = bootWith(S2_SHAPE, true);
  const whenD = doc.querySelector('[data-edit="rtext"][data-field="D::when"]');
  check("(d) a curator sees When as a field", !!whenD);
  check("(d) and Where as a field to fill", !!doc.querySelector('[data-edit="rtext"][data-field="C::where"]'));
  if (whenD) commit(window, whenD, "With each disbursement report");
  // A signed-in curator's edit goes to the shared config (activeOverride), so
  // the proof it held is the re-rendered card reading it back.
  const after = reported(doc).find((c) => c.getAttribute("data-rprio") === "D");
  check("(d) the card reads the saved text back",
    !!after && after.querySelector('[data-field="D::when"]').value === "With each disbursement report");
}

finish();
