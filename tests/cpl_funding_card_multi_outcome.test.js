// CPL Implementation Funding — priority cards, Sam's 2026-09-25 asks:
//
//   1. "Multi-select outcomes. In Scenario 2, want to combine P3 and 4 into
//      just P3." A measured card carries more than one statutory outcome, the
//      closed picker names them all, and a card serving an outcome the project
//      allocation funds shows that allocation.
//   2. "The Strategies editor ... closes when click Add Strategy." A card
//      section keeps the open state the reader left it in across a redraw.
//   3. "Need to be able to drag to reorder strategies on card." Each row
//      carries a Drag handle; the arrow keys on the handle move the row, which
//      is the path this suite drives (jsdom has no drag and drop).
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_card_multi_outcome.test.js`).
const { check, finish, freshDom, boot, click } = require("./lib/cpl_funding_harness.js");

function reviewerSession() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    onChange: function () {},
  };
}

const { window } = freshDom();
const doc = boot(window);
const T = window.CPL_FUNDING_TAB;
window.CPL_SESSION = reviewerSession();
T.render();

// ── 1. multi-select outcomes ────────────────────────────────────────────
const boxes = doc.querySelectorAll('[data-priogoalmulti="0"]');
check("1a: the first card offers one Serves box per statutory outcome", boxes.length === 4);
const dBox = Array.from(boxes).find(function (b) { return b.value === "D"; });
const firstKeys = Array.from(boxes).filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
check("1b: the boxes start on the card's own outcome", firstKeys.length >= 1 && firstKeys.indexOf("D") < 0);
dBox.checked = true;
dBox.dispatchEvent(new window.Event("change"));
const sel = doc.querySelector('[data-priogoal="0"]');
const shown = sel && sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].textContent : "";
check("1c: the closed picker names every outcome the card now serves — " + shown,
  /\(D\)/.test(shown) && /\+/.test(shown));
const labs = Array.from(doc.querySelectorAll('[data-priocard="0"] .cplfund-cardsec-lab'))
  .map(function (x) { return x.textContent; });
check("1d: the card now carries the project allocation for (D)",
  labs.indexOf("Project allocation (D)") >= 0);
Array.from(doc.querySelectorAll('[data-priogoalmulti="0"]')).forEach(function (b) {
  if (b.checked) { b.checked = false; b.dispatchEvent(new window.Event("change")); }
});
const back = doc.querySelector('[data-priogoal="0"]');
check("1e: unticking every box hands the card back to its metric",
  back && back.value === "derived");

// ── 2. the strategies fold stays open across Add strategy ──────────────
let fold = doc.querySelector('[data-priocard="0"] details.cplfund-strat');
fold.open = true;
fold.dispatchEvent(new window.Event("toggle"));
click(window, doc.querySelector('[data-priocard="0"] [data-stratadd]'));
fold = doc.querySelector('[data-priocard="0"] details.cplfund-strat');
check("2a: the strategies fold is still open after Add strategy", !!fold && fold.open === true);
check("2b: the new row exists", doc.querySelectorAll('[data-priocard="0"] [data-stratlist]').length >= 1);

// ── 3. reorder by the handle ─────────────────────────────────────────────
// Seed two named strategies, then move the first one down.
const rows0 = doc.querySelectorAll('[data-priocard="0"] [data-stratlist]');
const n0 = rows0.length;
const setRow = function (row, v) {
  const inp = row.querySelector("input, textarea");
  inp.value = v;
  inp.dispatchEvent(new window.Event("change"));
};
setRow(rows0[n0 - 1], "first");
click(window, doc.querySelector('[data-priocard="0"] [data-stratadd]'));
let rows = doc.querySelectorAll('[data-priocard="0"] [data-stratlist]');
setRow(rows[rows.length - 1], "second");
const vals = function () {
  return Array.from(doc.querySelectorAll('[data-priocard="0"] [data-stratlist]'))
    .map(function (r) { return r.querySelector("input, textarea").value; });
};
const before = vals();
const i1 = before.indexOf("first");
const handle = doc.querySelectorAll('[data-priocard="0"] [data-stratlist] .cplfund-strathandle')[i1];
check("3a: every row carries a Drag handle, a word and focusable", !!handle &&
  handle.textContent === "Drag" && handle.getAttribute("tabindex") === "0");
handle.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
const after = vals();
check("3b: ArrowDown on the handle moves the row one place down",
  after.indexOf("first") === i1 + 1 && after.indexOf("second") === i1);
// Signed out, the outcome picker stays (a what-if saves only in this browser),
// so the Serves boxes stay beside it; the drag handle is a reviewer's control.
window.CPL_SESSION = null;
T.render();
check("3c: signed out, no strategy row carries a Drag handle",
  doc.querySelectorAll(".cplfund-strathandle").length === 0);
check("3d: signed out, the Serves boxes follow the outcome picker",
  doc.querySelectorAll("[data-priogoal]").length > 0 &&
  doc.querySelectorAll('[data-priogoalmulti="0"]').length === 4);

finish();
