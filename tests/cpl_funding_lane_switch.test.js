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
const { check, freshDom, boot, click, commit, finish } = require("./lib/cpl_funding_harness.js");

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
// ⚠️ ASSERT THE CONTRACT, NOT THE WORDING. The first cut of these matched the
// sentence verbatim and went red the moment the sentence was reworded for
// plain language — a change that says nothing about what they guard.
check("a noncredit card says its measure is not carried yet and earns nothing",
  /not carry this measure/i.test(ncText) && /\$0/.test(ncText));
// Sam, 2026-08-28: "what does this mean? Metric · pinned to ppa_u". The feed key
// is provenance a curator may want; it is not something a reader should have to
// decode. So it must be DISCOVERABLE and INVISIBLE — a title, never body text.
check("the feed key is discoverable from a title attribute",
  ncCards.some((c) => Array.from(c.querySelectorAll("[title]"))
    .some((e) => /nc_p[eat]_u/.test(e.getAttribute("title")))));
check("no feed key appears in a noncredit card's visible text",
  !/nc_p[eat]_u|ppa_u|pe_u|pa_u|p3_u/.test(ncText));

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
    /not carry this measure/i.test(ncNow) && !/next daily data refresh/i.test(ncNow));
})();

// ── 4c. the noncredit lane has its OWN strategies ───────────────────────────
// Sam, 2026-08-28: "NC programs do not generally award credit, they get students
// trained and qualified to get credit at a credit college — hence different
// strategies." So credit's list must never be the fallback, and NC's own list
// must render when it exists. Both halves are asserted: an implementation that
// simply never shows strategies would pass the first and fail the second.
//
// ⚠️ TWO TRAPS THIS BLOCK HAD TO GET PAST, both in the test rather than the code:
//   * Clicking the lane button is a NO-OP when that lane is already selected
//     (wireSeg early-returns on an unchanged value), so seeding config and then
//     "clicking" never re-renders. Call render() explicitly.
//   * A CREDIT strategy renders as <input value="…">, which textContent cannot
//     see. Read the control's value, or the assertion tests nothing.
(function () {
  const stratTexts = (card) =>
    Array.from(card.querySelectorAll(".cplfund-strat .cplfund-reqrow")).map((r) => {
      const inp = r.querySelector("input, textarea");
      return inp ? inp.value : r.textContent.replace(/\s+/g, " ").trim();
    }).join(" | ");

  const shared = T._getShared();
  T._state.viewSlot = "1";
  shared.yearPriorities = shared.yearPriorities || {};
  shared.yearPriorities["1"] = shared.yearPriorities["1"] || {};
  shared.ncPriorities = { "1": {} };
  [0, 1, 2].forEach((i) => {
    shared.yearPriorities["1"][i] = Object.assign({}, shared.yearPriorities["1"][i], {
      strategies: ["CREDIT ONLY: batch upload transcribed CPL"]
    });
    shared.ncPriorities["1"][i] = { strategies: ["NC ONLY: refer completers to a credit college"] };
  });

  T._state.viewLane = "nc"; T.render();
  const ncNow = cards(win.document);
  check("noncredit strategies render when the NC override carries them",
    ncNow.length === 3 && ncNow.every((c) => /NC ONLY: refer completers/.test(stratTexts(c))));
  check("credit's strategies never leak into the noncredit lane",
    ncNow.every((c) => !/CREDIT ONLY:/.test(flat(c) + stratTexts(c))));
  // ⭐ THE ONE NC CONTROL THAT IS EDITABLE, and the reason is the mirror image
  // of why the others are not (Sam, 2026-08-28: "get it into supabase where it
  // belongs"). Every other field addresses credit's stored row; strategies have
  // a store of their own, so an edit lands on the noncredit priority.
  check("noncredit strategies ARE editable — they have a store of their own",
    ncNow.every((c) => !!c.querySelector('.cplfund-strat [data-edit="nc-strategy"]')));
  check("...and never through credit's strategy edit key",
    ncNow.every((c) => !c.querySelector('.cplfund-strat [data-edit="strategy"], ' +
      ".cplfund-strat [data-stratadd], .cplfund-strat [data-stratdel]")));

  T._state.viewLane = "cr"; T.render();
  const crNow = cards(win.document);
  check("the credit lane still shows its own strategies",
    crNow.every((c) => /CREDIT ONLY:/.test(stratTexts(c))) &&
    crNow.every((c) => !/NC ONLY:/.test(stratTexts(c))));

  delete shared.ncPriorities;
  T._state.viewLane = "nc"; T.render();
  check("with no NC override, the card says none are written (never credit's)",
    cards(win.document).every((c) => /None written for the noncredit lane/.test(flat(c))) &&
    cards(win.document).every((c) => !/CREDIT ONLY:/.test(flat(c) + stratTexts(c))));
  // ── the round trip: an edit in the NC lane must land on ncPriorities ─────
  // ⚠️ THE ASSERTION THAT MATTERS IS WHERE IT LANDED, not that the field
  // accepted a keystroke. A control that wrote to yearPriorities would look
  // identical on screen and would silently rewrite the CREDIT priority.
  {
    // ⚠️ Re-seed: the block above deletes ncPriorities to prove the empty state,
    // so without this there is no strategy row to edit and the null read would
    // look like a missing editor rather than a missing fixture.
    shared.ncPriorities = { "1": {} };
    [0, 1, 2].forEach((i) => {
      shared.ncPriorities["1"][i] = { strategies: ["NC ONLY: refer completers to a credit college"] };
    });
    T._state.viewLane = "nc"; T.render();
    const before = JSON.parse(JSON.stringify(shared.yearPriorities["1"]));
    const input = cards(win.document)[0].querySelector('[data-edit="nc-strategy"]');
    commit(win, input, "EDITED NC STRATEGY");
    const ov = T._getScenario().ncPriorities || shared.ncPriorities || {};
    const landed = JSON.stringify(ov);
    check("editing an NC strategy writes into ncPriorities",
      /EDITED NC STRATEGY/.test(landed));
    check("editing an NC strategy does NOT touch the credit priorities",
      JSON.stringify(shared.yearPriorities["1"]) === JSON.stringify(before));
    check("the edited text renders back on the card",
      /EDITED NC STRATEGY/.test(
        Array.from(cards(win.document)[0].querySelectorAll('[data-edit="nc-strategy"]'))
          .map((e) => e.value).join(" ")));
  }
  // Adding a strategy on an empty NC priority must create the store, not throw.
  {
    delete shared.ncPriorities;
    const sc = T._getScenario(); delete sc.ncPriorities;
    T.render();
    const add = cards(win.document)[0].querySelector("[data-ncstratadd]");
    check("an empty NC priority still offers the add control", !!add);
    click(win, add);
    check("adding on an empty NC priority creates the store rather than throwing",
      !!((T._getScenario().ncPriorities) || (T._getShared().ncPriorities)));
  }
  // ⚠️ LEAVE THE FIXTURE AS FOUND. A later block asserts the noncredit lane
  // drops CREDIT's strategies, and it read "no strategy rows at all" as the
  // proxy for that — which stops being true the moment NC has a set of its own.
  // Clearing here keeps each block's precondition its own business.
  delete shared.ncPriorities;
  const sc0 = T._getScenario(); delete sc0.ncPriorities;
  // Leave the lane on NC — sections 5 and 6 below assert against it.
  T._state.viewLane = "nc"; T.render();
})();

// ── 5. the NC cards may not edit the credit configuration ───────────────────
// ⚠️ NARROWED, deliberately: the NC strategy editor is now a legitimate control
// (it writes to ncPriorities). What must still never appear is a control
// addressing the CREDIT row — share, factor, metric, title, description.
check("no noncredit card carries a control that writes to the credit priority",
  ncCards.every((c) => Array.from(c.querySelectorAll("[data-edit]"))
    .every((e) => e.getAttribute("data-edit") === "nc-strategy")));
check("specifically: no share, factor, metric, title or description editor in NC",
  ncCards.every((c) => !c.querySelector(
    '[data-edit="share"], [data-edit="priofactor"], [data-edit="metric"], ' +
    '[data-edit="prio-title"], [data-edit="description"], [data-edit="perstudent"]')));
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
  // ⚠️ ASSERT THE MEANING, NOT A ROW COUNT. This used to require the noncredit
  // strategy block to hold no rows at all, which was only ever a proxy for
  // "credit's list is not here" — and it stopped being true the day the NC lane
  // got strategies of its own. What must hold is that nothing on an NC card is
  // credit's text, and that any row present is addressed to the NC store.
  check("no seeded credit strategy text is presented as a noncredit instruction",
    seededNc.every((c) => {
      const block = c.querySelector(".cplfund-strat");
      if (!block) return false;
      const vals = Array.from(block.querySelectorAll("input, textarea")).map((e) => e.value).join(" ");
      const noCreditText = !/noncredit mirror courses|Batch upload to MAP/.test(block.textContent + vals);
      const onlyNcControls = Array.from(block.querySelectorAll("[data-edit]"))
        .every((e) => e.getAttribute("data-edit") === "nc-strategy");
      return noCreditText && onlyNcControls;
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


// ── 10. a private save and a published save must not feel the same ──────────
// Sam relabelled the three priorities on the live tab, 2026-08-28, and the
// change never reached Supabase. The routing was never at fault — every
// consumer reads the model through _prios()/_ncPrios(), so a rename propagates
// on its own. The change never ENTERED the routing.
//
// activeOverride() returns the per-browser SCENARIO layer whenever unlocked()
// is false, persistActive() writes it to localStorage inside a swallowed
// try/catch, and the scenario layer wins the render — so the tab shows the edit
// back and it looks published.
//
// ⚠️ THE ACKNOWLEDGMENT WAS GATED ON unlocked(). A signed-in curator got
// "saving… / ✓ saved" beside the field they had just typed in; a locked one got
// nothing but a static banner that was already on screen before they started
// and does not change when they type. The per-edit event existed exactly where
// it was not needed and was missing where it was.
{
  const dom2 = freshDom();
  const w2 = dom2.window;
  const d2 = boot(w2);
  const T2 = w2.CPL_FUNDING_TAB;
  const bar = () => (d2.querySelector(".cplfund-authbar") || { textContent: "" })
    .textContent.replace(/\s+/g, " ").trim();

  // The fixture boots LOCKED (no team phrase, no reviewer session).
  check("the fixture is locked, which is the state that loses work",
    /Exploring|Viewing the shared model/.test(bar()));

  // An edit in locked mode: it persists (to localStorage) and must SAY so.
  T2._state.viewSlot = "1";
  const sh2 = T2._getShared();
  sh2.yearPriorities = sh2.yearPriorities || {};
  sh2.yearPriorities["1"] = sh2.yearPriorities["1"] || {};
  const titleInput = d2.querySelector('.cplfund-prio [data-edit="prio-title"]');
  check("a priority title is editable in the credit lane", !!titleInput);
  if (titleInput) {
    commit(w2, titleInput, "RENAMED BY A LOCKED CURATOR");
    const after = bar();
    check("a locked edit is acknowledged at all (it used to be silent)",
      /saved/i.test(after));
    check("...and names the DESTINATION, not just the fact of saving",
      /this browser/i.test(after));
    check("...and tells the curator how to publish it",
      /sign in/i.test(after));
    // ⚠️ A bare "✓ saved" is true and is the exact misreading this prevents.
    check("a locked save never reads as a plain published save",
      !/^\s*✓ saved\s*$/.test(after) && !/save for everyone/i.test(after));
  }
}

// ── 11. the client's gate must mirror the RLS policy ────────────────────────
// Sam relabelled the priorities while the masthead read "● Signed in", and
// nothing reached Supabase.
//
// ⚠️ TWO CREDENTIALS, ONE WORD. COBI's masthead reports the REVIEWER magic-link
// session; this tab gated shared editing on `tp().session()`, which is non-null
// ONLY when a team PHRASE sits in localStorage. All three funding tables carry
//     with check (is_allowed_reviewer() OR team_pass_ok())
// so the DATABASE would have accepted his write. The client never attempted it:
// activeOverride() handed him the per-browser scenario layer, the edit went to
// localStorage, and the scenario layer won the render — so the tab showed the
// change back and it looked published.
//
// A gate that is STRICTER than its policy fails silently and in the direction
// of lost work; the guard is that the two agree.
{
  const dom3 = freshDom();
  const w3 = dom3.window;
  const d3 = boot(w3);
  const T3 = w3.CPL_FUNDING_TAB;
  const bar3 = () => (d3.querySelector(".cplfund-authbar") || { textContent: "" })
    .textContent.replace(/\s+/g, " ").trim();

  check("with neither credential the tab is locked", /Viewing the shared model|Exploring/.test(bar3()));

  // A reviewer session, no team phrase — the exact state in Sam's screenshot.
  w3.CPL_SESSION = {
    get: () => ({ access_token: "header.payload.sig", refresh_token: "r" }),
    isFresh: () => true,
    authHeaders: (extra) => Object.assign({ apikey: "anon", Authorization: "Bearer header.payload.sig" }, extra || {}),
  };
  T3.render();
  check("a fresh REVIEWER session unlocks shared editing (it used not to)",
    !!d3.querySelector(".cplfund-authbar .mode.shared"));
  check("...and the banner names the credential actually doing it",
    /Signed in/i.test(bar3()) && !/Team editing on/i.test(bar3()));

  // ⚠️ An EXPIRED reviewer session must NOT unlock: claiming unlocked() there
  // trades a silent private save for a loud 401. Neither is wanted.
  w3.CPL_SESSION.isFresh = () => false;
  T3.render();
  check("a STALE reviewer session does not unlock",
    !d3.querySelector(".cplfund-authbar .mode.shared"));

  // The policy accepts either credential, so the phrase must still work alone.
  w3.CPL_SESSION = null;
  w3.CPL_TEAM_PHRASE = {
    session: () => ({ teamPass: "p", email: "(team)" }),
    decorateHeaders: (h) => { h["x-team-pass"] = "p"; return h; },
  };
  T3.render();
  check("the team phrase alone still unlocks, and is named as such",
    !!d3.querySelector(".cplfund-authbar .mode.shared") && /Team editing on/i.test(bar3()));
}

// ── 12. work that exists only in this browser must say so, and be publishable ─
// Sam lost the same three priority relabels TWICE. The gate fix (#1370) let a
// reviewer write; it did not deal with what happens to edits made BEFORE they
// signed in. Those live in SCENARIO, and SCENARIO WINS THE RENDER — so the tab
// paints them back and they are indistinguishable from published work.
//
// ⚠️ THE PROMOTION EXISTED AND ONLY ONE PATH REACHED IT. The team-phrase unlock
// row promotes the local what-if into shared on unlock. A magic-link reviewer
// never passes through that row: unlocked() flips true, the row disappears, and
// the overlay is stranded on top of shared for ever.
{
  const dom4 = freshDom();
  const w4 = dom4.window;
  const d4 = boot(w4);
  const T4 = w4.CPL_FUNDING_TAB;
  const bar4 = () => (d4.querySelector(".cplfund-authbar") || { textContent: "" })
    .textContent.replace(/\s+/g, " ").trim();

  // Edit while LOCKED — the edit lands in the per-browser scenario layer.
  T4._setScenario({ yearPriorities: { "1": { "0": { title: "LOCAL ONLY TITLE" } } } });
  T4.render();
  check("a locked browser reports its edits as local", /this browser only/i.test(bar4()));

  // Now sign in by magic link, exactly as Sam did.
  w4.CPL_SESSION = {
    get: () => ({ access_token: "h.p.s", refresh_token: "r" }),
    isFresh: () => true,
    authHeaders: (extra) => Object.assign({ apikey: "anon" }, extra || {}),
  };
  T4.render();
  check("signing in unlocks shared editing", !!d4.querySelector(".cplfund-authbar .mode.shared"));
  // ⭐ THE ASSERTION THAT WOULD HAVE CAUGHT THIS: being unlocked is not enough.
  check("...and the stranded local overlay is called out, not left silent",
    /nobody else can see/i.test(bar4()));
  check("...with a control to publish it", !!d4.querySelector("#cplFundPromote"));

  // Publishing merges the overlay into shared.
  const btn4 = d4.querySelector("#cplFundPromote");
  if (btn4) {
    click(w4, btn4);
    check("publishing moves the local edit into the shared scenario",
      JSON.stringify(T4._getShared()).indexOf("LOCAL ONLY TITLE") !== -1);
    check("...and the warning clears once nothing is browser-only",
      !/nobody else can see/i.test(bar4()));
  }
}

// ── 13. an expired sign-in says so ──────────────────────────────────────────
// Sam, 2026-08-28: "I should get a notice if my token has expired." A Supabase
// token lives ~1h; without this a session that died mid-edit reads as ordinary
// exploring, and the curator cannot tell "I am browsing" from "I was working and
// silently stopped being able to save".
{
  const dom5 = freshDom();
  const w5 = dom5.window;
  const d5 = boot(w5);
  const T5 = w5.CPL_FUNDING_TAB;
  const bar5 = () => (d5.querySelector(".cplfund-authbar") || { textContent: "" })
    .textContent.replace(/\s+/g, " ").trim();

  w5.CPL_SESSION = {
    get: () => ({ access_token: "h.p.s", refresh_token: "r" }),
    isFresh: () => false,          // present, but dead
    authHeaders: (e) => Object.assign({}, e || {}),
  };
  T5.render();
  check("an EXPIRED session does not unlock shared editing",
    !d5.querySelector(".cplfund-authbar .mode.shared"));
  check("...and says the sign-in expired, not merely that you are exploring",
    /expired/i.test(bar5()));
  check("...and names the remedy", /sign in again/i.test(bar5()));

  // No session at all must NOT claim an expiry.
  w5.CPL_SESSION = null;
  T5.render();
  check("never-signed-in is not reported as an expiry", !/expired/i.test(bar5()));
}

finish();
