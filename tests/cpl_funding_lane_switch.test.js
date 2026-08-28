// tests/cpl_funding_lane_switch.test.js
//
// The CR / NC lane switch on the priority cards (Sam, 2026-08-28).
//
// WHAT THIS GUARDS, AND WHY IT IS NOT OBVIOUS FROM THE SCREEN.
//
// The noncredit lane reuses the credit CARD. That is the design — Sam's words:
// "Keep the cards the same and just switch out the data necessary." But three of
// the card's lines cannot carry over, and each of the three fails in a way that
// LOOKS correct:
//
//   1. STRATEGIES are inherited verbatim by ncPriorities() (`strategies:
//      p.strategies`). Credit's Success list names "noncredit mirror courses"
//      among the things to batch-upload — on a noncredit card that instructs a
//      noncredit institution about itself, and every other bullet is written for
//      a credit college. A plausible-looking bullet list is the failure.
//   2. The ACTUALS line falls through to "Actuals (per MAP) arrive with the next
//      daily data refresh." measureOf() returns `undelivered` with NO `gap` for
//      a pinned-but-undelivered source, so nothing before that branch catches
//      it. The sentence is false — the nc_* keys land when MAP ships the
//      origination fields — and it is the most reassuring sentence available.
//   3. The EARNING line reads earnAgg().perPrio[i] — the CREDIT statewide
//      aggregate, indexed by POSITION. It renders a dollar figure that is
//      correct for the credit lane and meaningless on a noncredit card.
//
// And one that is not a display bug at all: every field on the card is an EDITOR
// addressed by data-slot/data-idx, which applyEdit writes to the stored CREDIT
// priority. An edit made while the NC lane shows would silently change credit's
// configuration. The NC cards therefore carry no edit controls at all.
//
// ⚠️ ONE SWITCH, NOT THREE. Sam ruled the toggle sits above the cards and moves
// all three together, across every year — "otherwise I'll be a confuseled Pooh".
// A per-card toggle is eight states, six of which describe no lane: the shares
// still read 34/33/33 while the pots come from two pools that sum to nothing.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_lane_switch.test.js`).
const { check, freshDom, boot, click, finish } = require("./lib/cpl_funding_harness.js");

// Locate things STRUCTURALLY, never by index or by a literal label — both of
// those broke suites on 2026-08-27 for reasons unrelated to what they tested.
const cards = (doc) => Array.from(doc.querySelectorAll(".cplfund-prio .p"));
const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const laneSeg = (doc) => doc.getElementById("cplFundLane");
const laneBtn = (doc, val) =>
  laneSeg(doc) && laneSeg(doc).querySelector('button[data-val="' + val + '"]');

// ── boot once; the whole suite runs against one window (harness memory budget) ─
const dom = freshDom();
const win = dom.window;
const doc = boot(win);
const T = win.CPL_FUNDING_TAB;

// ── 1. the switch exists, above the cards, and is ONE control ────────────────
check("a single lane switch is rendered", !!laneSeg(doc));
check("the lane switch offers exactly two lanes",
  laneSeg(doc) && laneSeg(doc).querySelectorAll("button").length === 2);
check("the lane switch names both pools",
  /Credit/.test(flat(laneSeg(doc))) && /Noncredit/.test(flat(laneSeg(doc))));
// The switch must sit BEFORE the cards in document order — it governs all three.
check("the lane switch precedes the priority cards", (function () {
  const seg = laneSeg(doc), grid = doc.querySelector(".cplfund-prio");
  if (!seg || !grid) return false;
  return !!(seg.compareDocumentPosition(grid) & win.Node.DOCUMENT_POSITION_FOLLOWING);
})());
// ⚠️ THE PER-CARD TOGGLE MUST NOT EXIST. This is the assertion that fails if
// someone "helpfully" adds one back: no lane control may live inside a card.
check("no lane control lives inside any priority card",
  cards(doc).every((c) => !c.querySelector("[data-val='nc'], [data-val='cr']")));

// ── 2. the credit lane is the default and every card says so ────────────────
check("three cards render in the credit lane", cards(doc).length === 3);
check("every card carries a CR chip in the credit lane",
  cards(doc).length === 3 && cards(doc).every((c) => {
    const chip = c.querySelector(".cf-lanechip");
    return chip && chip.textContent.trim() === "CR";
  }));
const creditText = cards(doc).map(flat).join(" ");
const creditEditors = cards(doc).reduce((n, c) => n + c.querySelectorAll("[data-edit]").length, 0);
check("the credit cards are editable (the curator's dials live there)", creditEditors > 0);

// ── 3. flip the lane — ALL THREE cards move together ────────────────────────
click(win, laneBtn(doc, "nc"));
const ncCards = cards(win.document);
check("flipping the switch moves all three cards to NC", ncCards.length === 3 &&
  ncCards.every((c) => {
    const chip = c.querySelector(".cf-lanechip");
    return chip && chip.textContent.trim() === "NC";
  }));

// ── 4. the three lines that must not carry over ─────────────────────────────
const ncText = ncCards.map(flat).join(" ");

// (a) strategies. Count the STRATEGY ROWS, not the prose: the explanatory note
// deliberately quotes the offending phrase, so a text match on
// "noncredit mirror courses" would match the explanation and pass while the
// real bullet list was still being rendered.
check("no credit strategy bullets render on a noncredit card",
  ncCards.every((c) => c.querySelectorAll(".cplfund-strat .cplfund-reqrow").length === 0));
check("no strategy edit control renders on a noncredit card",
  ncCards.every((c) => !c.querySelector("[data-stratadd], [data-stratdel]")));

// (b) the false promise.
check("a noncredit card never promises the next daily data refresh",
  !/next daily data refresh/i.test(ncText));
check("a noncredit card says the measure is pinned but undelivered",
  /does not carry that measure/i.test(ncText));
check("the undelivered line names the pinned source", /nc_p[eat]_u/.test(ncText));

// (c) the earning line is the NC lane's own.
// Cross-check against the model rather than a literal: every NC priority's
// full-window cap must equal ncPrioCap over the carve-out, which is at least an
// order of magnitude below any credit priority's.
const ncModel = T._ncModel();
const creditPot = T._netCollege();
check("the noncredit carve-out is far smaller than the college pool",
  ncModel.pool > 0 && ncModel.pool < creditPot / 5);
check("no noncredit card prints a figure larger than the whole carve-out",
  ncCards.every((c) => {
    const earn = c.querySelector(".cplfund-earned-line");
    if (!earn) return true;
    const nums = flat(earn).match(/\$[\d,]+/g) || [];
    return nums.every((n) => Number(n.replace(/[$,]/g, "")) <= ncModel.pool + 1);
  }));
// Sam's ruling: NC shows its targets with $0 earned — never the credit lane's
// full-cap advance. A non-zero earning here means the credit aggregate leaked in.
check("every noncredit priority is earning $0 while the feed is undelivered",
  ncCards.every((c) => /\$0 of \$/.test(flat(c.querySelector(".cplfund-earned-line")))));

// ── 4b. `undelivered` conflates two things, and the order matters ───────────
// REGRESSION GUARD for a bug this branch shipped and fixed. srcDelivered() asks
// the LOADED artifact whether a key is present, so when the artifact has not
// loaded at all it answers false for EVERY source — credit included. The first
// cut of the undelivered branch tested `meas.undelivered` before asking whether
// the artifact was there, so in any artifact-less context every CREDIT card
// claimed its measure "is not carried for anyone yet", when the truth was only
// that the file had not arrived. cpl_funding_rollup caught it.
//
// The ordering now mirrors earnFraction() exactly, which is the point: the
// earning line and the actuals line describe the same measure, so a surface
// that ordered these differently would contradict the one beside it.
//
// This harness boots WITHOUT the performance artifact, which is precisely the
// state that exposed the bug.
(function () {
  check("the fixture has no performance artifact (the state that exposed it)",
    !win.CPL_FUNDING_PERF);
  click(win, laneBtn(win.document, "cr"));
  const creditCardsNow = cards(win.document).map(flat).join(" ");
  check("with no artifact, a CREDIT card says the refresh is pending",
    /next daily data refresh/i.test(creditCardsNow));
  check("with no artifact, a CREDIT card does NOT claim its measure is uncarried",
    !/does not carry that measure/i.test(creditCardsNow));
  click(win, laneBtn(win.document, "nc"));
  const ncNow = cards(win.document).map(flat).join(" ");
  check("with no artifact, a NONCREDIT card still says uncarried, not pending",
    /does not carry that measure/i.test(ncNow) && !/next daily data refresh/i.test(ncNow));
})();

// ── 5. the NC cards may not edit the credit configuration ───────────────────
check("no noncredit card carries an edit control",
  ncCards.every((c) => c.querySelectorAll("[data-edit]").length === 0));
check("no noncredit card carries a priority-reorder control",
  ncCards.every((c) => !c.querySelector("[data-priomove], [data-priopos]")));

// ── 6. the lane survives a year change (it is not per-year) ─────────────────
const yearSeg = doc.getElementById("cplFundYear");
const y2 = yearSeg && yearSeg.querySelector('button[data-val="2"]');
if (y2) {
  click(win, y2);
  check("switching year keeps the NC lane selected",
    cards(win.document).every((c) => {
      const chip = c.querySelector(".cf-lanechip");
      return chip && chip.textContent.trim() === "NC";
    }));
} else {
  check("switching year keeps the NC lane selected (no year 2 in fixture)", true);
}

// ── 7. back to credit — the switch is reversible and restores the editors ───
click(win, laneBtn(win.document, "cr"));
const backCards = cards(win.document);
check("flipping back restores the credit lane on all three cards",
  backCards.length === 3 && backCards.every((c) => {
    const chip = c.querySelector(".cf-lanechip");
    return chip && chip.textContent.trim() === "CR";
  }));
check("flipping back restores the credit editors",
  backCards.reduce((n, c) => n + c.querySelectorAll("[data-edit]").length, 0) === creditEditors);
check("flipping back restores the credit strategy editor",
  backCards.every((c) => !!c.querySelector("[data-stratadd]")));

// ── 7b. suppression proven on REAL strategy content ─────────────────────────
// ⚠️ The baked fixture carries NO strategies, so "the NC card has no bullets"
// passes trivially against it — a guard that cannot fail is not a guard. Seed
// credit strategies into the shared overlay, confirm they render in the credit
// lane, and only then confirm the NC lane drops them.
(function () {
  // ⚠️ Section 6 clicked Year 2, and the slot is still there. Seeding slot "1"
  // while the view shows slot "2" reads as "suppression works" for the wrong
  // reason — there was simply nothing to suppress. Pin the slot first.
  T._state.viewSlot = "1";
  const shared = T._getShared();
  shared.yearPriorities = shared.yearPriorities || {};
  shared.yearPriorities["1"] = shared.yearPriorities["1"] || {};
  [0, 1, 2].forEach((i) => {
    shared.yearPriorities["1"][i] = Object.assign({}, shared.yearPriorities["1"][i], {
      strategies: ["Batch upload to MAP all transcribed CPL", "Include noncredit mirror courses"]
    });
  });
  T.render();
  const seeded = cards(win.document);
  check("seeded credit strategies do render in the credit lane",
    seeded.length === 3 &&
    seeded.every((c) => c.querySelectorAll(".cplfund-strat .cplfund-reqrow").length === 2));

  click(win, laneBtn(win.document, "nc"));
  const seededNc = cards(win.document);
  check("seeded credit strategies are DROPPED in the noncredit lane",
    seededNc.every((c) => c.querySelectorAll(".cplfund-strat .cplfund-reqrow").length === 0));
  // The specific phrase that makes this matter — it must not reach a noncredit
  // card as an instruction. It appears only inside the explanatory note, which
  // is why the bullet COUNT above is the real assertion and this is the second.
  check("no seeded strategy text is presented as a noncredit instruction",
    seededNc.every((c) => {
      const block = c.querySelector(".cplfund-strat");
      return block && !block.querySelector("li, .cplfund-reqrow, [data-edit]");
    }));

  click(win, laneBtn(win.document, "cr"));
})();

// ── 8. the award range carries BOTH lanes, never merged ─────────────────────
const rows = Array.from(win.document.querySelectorAll(".cplfund-awardrow"));
check("the award range renders two lane rows", rows.length === 2);
check("the first award row is the credit lane", /^Credit/.test(flat(rows[0])));
check("the second award row is the noncredit lane", /^Noncredit/.test(flat(rows[1])));
// The rosters are different sizes and must be described as such — an average
// "across 148" would double-count the 30 institutions in both lanes.
check("the credit row counts colleges and the noncredit row counts institutions",
  /colleges/.test(flat(rows[0])) && /institutions/.test(flat(rows[1])));
check("the noncredit row's roster is the funded NC lane, not the college roster",
  new RegExp("across " + ncModel.rows.length + " institutions").test(flat(rows[1])));
// ⚠️ A MERGED MINIMUM WOULD PRINT THE NONCREDIT FLOOR AS THE CREDIT MINIMUM.
// That is the specific figure-that-looks-right this split exists to prevent.
check("the credit minimum is the credit floor, not the noncredit one", (function () {
  const m = flat(rows[0]).match(/\$[\d,]+/);
  return m && Number(m[0].replace(/[$,]/g, "")) === Math.round(T._model().floor);
})());
check("the noncredit minimum is the noncredit floor", (function () {
  const m = flat(rows[1]).match(/\$[\d,]+/);
  return m && Number(m[0].replace(/[$,]/g, "")) === Math.round(ncModel.floor);
})());

// ── 9. a shared bound is COUNTED, not attributed to one institution ─────────
// The minimum box has counted ties since the floor shipped; the maximum box did
// not, so it named one of the five colleges at the ceiling as though that were a
// fact about that college. Both bounds now count.
//
// ⚠️ The test is the VALUE, never the model's clamp count. An institution can
// receive exactly the ceiling without being HELD to it — on the live dials Santa
// Ana's unclamped noncredit award solves to exactly $100,000 — so ncModel().capped
// and "how many receive the maximum" legitimately differ.
function boundIsCounted(rowText, which) {
  const seg = flat(rowText).split(which + " award")[1] || "";
  return /^\s*—\s*\d+\s+(colleges|institutions)\s+at the/.test(seg);
}
const creditAtCap = T._model().cap > 0 &&
  Object.keys(T._model().capped || {}).length > 1;
check("the credit maximum counts the colleges sharing the ceiling",
  !creditAtCap || boundIsCounted(rows[0], "Maximum"));
check("the credit minimum counts the colleges sharing the floor",
  boundIsCounted(rows[0], "Minimum"));
check("the noncredit minimum counts the institutions sharing the floor",
  ncModel.floorCount <= 1 || boundIsCounted(rows[1], "Minimum"));

finish();
