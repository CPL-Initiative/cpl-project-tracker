// CPL Implementation Funding — what a reader of the institution table can and
// cannot see. Born from two of Sam's 2026-08-23 reports (priority columns
// named "P1" and nothing else; a gated college with nothing earned saying
// nothing at all), re-aimed 2026-08-31 at the ONE-POOL table (adopted that
// day; tests/cpl_funding_one_pool.test.js is the anchor suite):
//
// (1) THE PRIORITY NAME RIDES THE ROW THE READER ACTUALLY SEES.
//     Sam's original ask — "add the main title to them (e.g., P1 Access)" —
//     was about the P1/P2/P3 table columns. Those columns are RETIRED (the
//     locked mock / R6, 2026-08-31): per-priority detail lives in each row's
//     expand, whose 7-column table names every priority row with its ordinal
//     AND its title ("Priority 1 Access"), and the priority cards name theirs
//     the same way. The title stays OPTIONAL: `yearPriorities` is a sparse
//     overlay, so a slot with no title must fall back to the ordinal alone,
//     never print "Priority 3 undefined".
//
// (2) A GATED COLLEGE WITH NOTHING EARNED SAID NOTHING AT ALL.
//     "Why don't Cosumnes and Grossmont and others have the opt in to begin
//     earning note?" The prompt keyed on `held > 0.5` — the SIZE of the
//     withheld figure — so a college that is gated but whose earnable amount
//     computes to zero rendered no prompt, no explanation, an ordinary-looking
//     row. The prompt is driven by the GATE, and under one pool the money
//     cells it rides are the CR award / NC award pair.
//
// (3) THE S215 REACTION RULINGS — the one-row shape (Sam, 2026-08-31, the
//     locked mock's own comment): "Low-key rows: nothing bold, FTES and
//     funding centered, the rightmost column right-justified." Chips are
//     ghosted words; the SYSTEM row alone stays bold.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_row_legibility.test.js`).
const { check, freshDom, boot, D, consumerSrc, finish } = require("./lib/cpl_funding_harness.js");

// Open one institution row's expand through the public path (the caret) and
// return its detail row. The click re-renders the table, so the row is
// re-queried after the toggle.
function openDetail(window, doc, name) {
  const find = () => Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find((r) => r.textContent.indexOf(name) !== -1);
  const row = find();
  if (!row) return null;
  row.querySelector(".cplfund-caret").dispatchEvent(new window.Event("click", { bubbles: true }));
  const row2 = find();
  const det = row2 && row2.nextElementSibling;
  return det && det.classList.contains("cplfund-detail") ? det : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// L1 — the priority rows carry their ordinal and their name
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;

  // The retired surface first: no P1/P2/P3 table columns, no priority cells
  // in the institution table (R6 / the locked mock, 2026-08-31 — the detail
  // moved into the expand).
  check("the P1/P2/P3 table columns stay retired (R6, 2026-08-31)",
    ![...doc.querySelectorAll("#cplFundTable th")].some((th) => /^P\d/.test(th.textContent.trim())) &&
    doc.querySelectorAll("#cplFundTable td.cf-prio").length === 0);

  const det = openDetail(window, doc, "Bakersfield");
  const prioCells = det
    ? Array.from(det.querySelectorAll(".cplfund-dtl-table tr")).slice(1)
        .map((tr) => tr.querySelector("td").textContent.replace(/\s+/g, " ").trim())
    : [];
  check("the expand's detail table has one row per priority", prioCells.length === 3);
  check("each carries its ordinal AND its name, not the ordinal alone",
    prioCells.length === 3 && prioCells.every((t) => /^Priority \d+ \S/.test(t)));
  check("no priority row prints an undefined title",
    prioCells.every((t) => !/undefined|null/i.test(t)));
  // The name must be the priority's own, not a positional guess.
  const names = T._prios ? T._prios(D.colleges[0].college, "1") : null;
  check("the row name matches the priority the row represents",
    !names || prioCells.every((t, i) => {
      const nm = names[i] && names[i].title;
      return !nm || t.indexOf(nm) !== -1;
    }));
  // The statewide priority CARDS name theirs the same way ("Priority 1:" +
  // the editable title, defaulting Access / Success / Capacity).
  const cardH4s = Array.from(doc.querySelectorAll(".cplfund-prio .p h4"));
  const cardTitles = Array.from(doc.querySelectorAll('.cplfund-prio .p input[data-edit="prio-title"]'))
    .map((i) => i.value);
  check("the priority cards pair the ordinal with the editable title",
    cardH4s.length === 3 && cardH4s.every((h, i) => /Priority \d+:/.test(h.textContent)) &&
    cardTitles.join("|") === "Access|Success|Capacity");

  // ───────────────────────────────────────────────────────────────────────────
  // L4 — the S215 one-row rulings (Sam, 2026-08-31): "Low-key rows: nothing
  // bold, FTES and funding centered, the rightmost column right-justified."
  // Verified on COMPUTED style so the mechanism (a class, an nth-child rule)
  // stays free to change while the ruling holds.
  // ───────────────────────────────────────────────────────────────────────────
  const row = doc.querySelector("#cplFundTable tbody tr.cplfund-row");
  const tds = Array.from(row.querySelectorAll("td"));
  const cs = (el) => window.getComputedStyle(el);
  const isBold = (w) => w === "bold" || w === "bolder" || parseInt(w, 10) >= 600;
  check("no institution-row CELL is bold any more (the bold money column is gone with the pair)",
    doc.querySelectorAll("#cplFundTable td.tot").length === 0 &&
    tds.every((td) => !isBold(cs(td).fontWeight)));
  // The NAME too — the ruled mock's `.who` is weight 400 ("nothing bold").
  // Reaction round 2 landed the CENTERING half of this ruling (anchor D23);
  // the name still renders in <strong>. If keeping the bold name is a
  // deliberate carve-out from "nothing bold", this is the check to retire —
  // with the ruling, not around it.
  const nameEl = row.querySelector("td.t strong") || row.querySelector("td.t");
  check("the institution name is non-bold (Sam's 'nothing bold' row ruling, 2026-08-31)",
    !isBold(cs(nameEl).fontWeight));
  // FTES and funding centered; the rightmost VISIBLE column (NC award —
  // Working adults* is hidden by default) right-justified. Computed style, so
  // the mechanism (th.c/td.c today) stays free to change while the ruling
  // holds. Cells are located by their header's data-sort key, never by index.
  const colTd = (key) => {
    const ths = Array.from(doc.querySelectorAll("#cplFundTable thead th"));
    const i = ths.findIndex((th) => th.getAttribute("data-sort") === key);
    return i >= 0 ? tds[i] : null;
  };
  check("CR FTES · NC FTES · Elig · CR award are CENTERED (Sam's ruling)",
    ["cr_ftes", "nc_ftes", "elig", "cr_award"].every(
      (k) => colTd(k) && cs(colTd(k)).textAlign === "center"));
  check("...and NC award, the rightmost visible column, stays right-justified",
    !!colTd("nc_award") && cs(colTd("nc_award")).textAlign === "right");
  // The SYSTEM row alone keeps its weight (the mock keeps it bold), and chips
  // are ghosted words at normal weight.
  check("the SYSTEM row alone stays bold; chips stay ghosted words",
    isBold(cs(doc.querySelector("tr.cplfund-systemrow td")).fontWeight) &&
    (function () {
      const chip = doc.querySelector(".cplfund-chip");
      return !!chip && !isBold(cs(chip).fontWeight);
    })());
}

// ─────────────────────────────────────────────────────────────────────────────
// L2 — a missing title falls back to the bare ordinal
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ READ BEFORE CHANGING THIS BLOCK. The first draft (of the P-column era)
// stripped `title` from every entry of `year_priorities` and asserted bare
// ordinals came out. It FAILED — and the code was right, the test was wrong:
// `yearPriorities` is a sparse overlay, but `prioTitle()` falls back to
// `DEFAULT_PRIORITY_TITLES` keyed on the priority's SOURCE index, so a title
// is always supplied for the three baked slots. An empty title is only
// reachable by ADDING a priority beyond the baked defaults, which is why the
// guard stays. Assert the guard's existence in the source, and the property
// that actually holds at runtime.
{
  check("the detail row appends a name only when there is one",
    /esc\(p\.label\) \+ \(p\.title \? " " \+ esc\(p\.title\) : ""\)/.test(consumerSrc));
  check("the title fallback keys on the priority's SOURCE index, not its position",
    /DEFAULT_PRIORITY_TITLES\[srcIdx\(prioSlot\(slot\), i\)\] \|\| ""/.test(consumerSrc));
  // The runtime property: every title the model yields is non-empty, so no
  // row can currently render a dangling ordinal-plus-nothing.
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const titles = T._prios ? T._prios(D.colleges[0].college, "1").map((p) => p.title) : [];
  check("every priority resolves to a non-empty title today (the fallback works)",
    titles.length === 0 || titles.every((t) => typeof t === "string" && t.trim() !== ""));
}

// ─────────────────────────────────────────────────────────────────────────────
// L3 — the opt-in prompt is driven by the GATE, not by the withheld amount
// ─────────────────────────────────────────────────────────────────────────────
// The harness has no coordinator/participation feed, so the gate reads PENDING
// and no row is blocked — which is why this defect could never be reproduced by
// rendering the table offline. Assert on the function's contract instead: it is
// exported through the same module surface the table calls. Under one pool the
// money cells are the CR award / NC award pair (crAwardCellHtml /
// ncAwardCellHtml) — both must pass the college's gate state.
{
  const src = consumerSrc;
  // The signature carries the gate.
  check("earnedSubHtml takes a `gated` argument",
    /function earnedSubHtml\(cap, earned, adv, held, gated\)/.test(src));
  check("...and the prompt branch fires on it, not on held alone",
    /if \(held > 0\.5 \|\| gated\)/.test(src));
  check("the CR award cell passes the college's gate state",
    /earnedSubHtml\(cap, earned, row\.earned_advance \|\| 0, row\.earned_withheld \|\| 0, row\.gate_blocked\)/.test(src));
  check("the NC award cell passes it too",
    /earnedSubHtml\(cap, row\.earned_nc \|\| 0, 0, 0, row\.gate_blocked\)/.test(src));
  // A gated college with nothing withheld must NOT be told money is held.
  // ⚠️ Guards the BRANCH, not the wording. This pinned the literal call-to-action
  // string, so it went red when Sam changed "opt in" to "confirm participation"
  // (2026-08-27) — a rename that says nothing about whether the figure is
  // conditional, which is what this assertion exists for. The words are guarded
  // where they are RENDERED, by cpl_funding_gate_ledger_public S5. The
  // formatter is earnedMoney() since 2026-09-03 (public dollars coarsen to
  // "<$1,000" / the nearest $1,000); either formatter satisfies the BRANCH.
  check("the figure renders only when there IS one to hold",
    /var showFig = due && held > 0\.5;/.test(src) &&
    /showFig \? "held " \+ (?:fmtMoney|earnedMoney)\(held\) : "[^"]+"/.test(src));
  // The old unconditional wording would have printed "held $0" after the
  // deadline for exactly the colleges this change is for.
  check("no branch can emit a bare `held $0`",
    !/due \? "held " \+ (?:fmtMoney|earnedMoney)\(held\)/.test(src));
}

finish();
