// CPL Implementation Funding tab — the project-pool card's live breakdown
// (Sam's Open Verdicts item 5, 2026-08-30): the named projects are SOURCED
// from the jointly wired Activities / Annual Targets / Budget tables — the
// ledger's pool-section rows — behind a word-toggle fold, and never a
// hand-typed split.
//
// What these tests pin, and why each is the failure mode:
//   * HONEST EMPTY — with no ledger read, the fold must say the rows are not
//     loaded, never render a stale or invented list. A hardcoded project list
//     is exactly what Sam ruled out.
//   * ONE PROGRAM, NO ATTRIBUTION — the $35M and $15M shares fund one
//     program; a card that assigned projects to either share alone would
//     invent the split the amendment deliberately does not make.
//   * THE DRIFT LINE — when the program rows stop summing to the two shares,
//     the card must SAY so rather than smooth it; and when they match, the
//     warning must not cry wolf.
//   * SCOPE — the fold belongs to the projects card alone; the admin card
//     carries none.
//
// Memory budget (tests/lib/cpl_funding_harness.js): 1 booted window.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_pool_projects.test.js`).
const {
  check,
  freshDom,
  boot,
  finish,
} = require("./lib/cpl_funding_harness.js");

{
  const dom = freshDom();
  const { window } = dom;
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;

  function fold() {
    const all = Array.from(doc.querySelectorAll(".cplfund-card details.cplfund-pool-projects"));
    return all.length === 1 ? all[0] : null;
  }

  // ── honest empty state (NO_REMOTE: the ledger never loaded) ───────────────
  let f = fold();
  check("exactly one projects fold renders, on the projects card only", !!f);
  check("the toggle is a word control, collapsed by default",
    !!f && /named projects/i.test(f.querySelector("summary").textContent) && !f.hasAttribute("open"));
  check("without the ledger, the fold says so — no list, never a stale copy",
    !!f && /not loaded right now/i.test(f.textContent) && f.querySelectorAll("li").length === 0);

  // ── loaded state: the Budget table's own rows, one program, no drift ──────
  T._ledger.pool = { remaining_2025_26: 9040308 };
  T._ledger.projectRows = [
    { id: 13, name: "CPL Initiative RCCD Projects", total: 10556650, parent_id: null, section: "pool" },
    { id: 16, name: "Lightleap AI Apprenticeship Tools", total: 6600000, parent_id: 13, section: "pool" },
    { id: 21, name: "ASCCC Pathways to Credit", total: 500000, parent_id: 13, section: "pool" },
    { id: 15, name: "Additional CPL Initiative Projects — CO or TBA", total: 7443350, parent_id: null, section: "pool" },
    { id: 25, name: "Lake Tahoe Valid8 — Portfolio Builder & CPL Navigators", total: 2520000, parent_id: 15, section: "pool" },
  ];
  T.render();
  f = fold();
  const txt = f ? f.textContent : "";
  check("loaded: both program parents render with their amounts",
    /CPL Initiative RCCD Projects/.test(txt) && /\$10,556,650/.test(txt) &&
    /Additional CPL Initiative Projects/.test(txt) && /\$7,443,350/.test(txt));
  check("loaded: children nest under their parents",
    !!f && /Lightleap AI Apprenticeship Tools/.test(txt) && /\$6,600,000/.test(txt) &&
    f.querySelectorAll("ul ul li").length === 3);
  check("the one-program framing names the combined $18M and both shares' join",
    /one \$18,000,000 project program/.test(txt) && /\$9,040,308/.test(txt) &&
    /not\s+split projects by appropriation/i.test(txt.replace(/\s+/g, " ")));
  check("no project is attributed to either share alone",
    !/\$35M share pays|\$15M share pays|funded by the \$35M|funded by the \$15M/i.test(txt));
  check("matching sums draw NO drift warning",
    !f.querySelector(".cplfund-pool-projects-drift"));
  check("leads and status are pointed at the Activities register, not copied",
    /Activities register/.test(txt) && !/lead:/i.test(txt));

  // ── the drift line: program rows that stop summing to the shares ──────────
  T._ledger.projectRows[0].total = 10000000;   // 556,650 short
  T.render();
  f = fold();
  const drift = f && f.querySelector(".cplfund-pool-projects-drift");
  check("a sum mismatch is REPORTED, with the gap and the deference to the Budget table",
    !!drift && /\$556,650/.test(drift.textContent) && /Budget table decides/i.test(drift.textContent));
}

finish();
