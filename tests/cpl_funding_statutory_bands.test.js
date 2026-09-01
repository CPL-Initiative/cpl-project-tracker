// CPL Implementation Funding tab — the statutory BANDS (Sam, 2026-09-01).
//
// The tab carried two sections describing one allocation: "Three Priority
// Outcome-Based Allocations" and "Funding Outcomes Required by Ed. Code
// §78093.2(d)(1)", stitched together by a raised letter on each priority card.
// Sam's consolidation makes the statutory outcome the STRUCTURE and the
// priority the thing inside it, folding the four goals into three bands:
//
//     (A)        Access
//     (B) + (C)  Success        — his fold: completion and career attainment
//                                 paired "the same way we combine two aspects
//                                 of Access"
//     (D)        Opportunities  — named for the statute's own object ("credit
//                                 for prior learning opportunities") rather
//                                 than for the pilot projects that are its means
//
// ⚠️ WHAT THIS SUITE PROTECTS IS THAT NO PRIORITY CAN GO MISSING. Grouping
// cards into bands introduces a failure the flat list could not have: a card
// whose goal does not resolve gets filtered into nothing and silently stops
// rendering — and a priority that is invisible on this page still earns funding
// against a target nobody can see. Sections 2 and 5 are that guard, from both
// directions: every card is placed, and an unplaceable one surfaces LOUDLY in
// an orphan band instead of disappearing.
//
// ⚠️ AND THAT MEMBERSHIP STAYS DERIVED. A band is chosen by the goal
// prioGoals() resolves from the metric's MILESTONE — the same resolver the
// earning math uses — never by matching a title. Titles are curator-editable
// and drift; a title-matched band would let the card a college reads and the
// dollars it earns disagree about what is being measured. Section 3 fails if
// anyone reintroduces prose matching.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_statutory_bands.test.js`).
const { check, freshDom, boot, finish } = require("./lib/cpl_funding_harness.js");

const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const bands = (doc) => Array.from(doc.querySelectorAll(".cplfund-band"));
const bandById = (doc, id) => doc.getElementById("cplfund-band-" + id);
const bandName = (b) => flat(b.querySelector(".cplfund-band-name"));
const cardsIn = (el) => Array.from(el.querySelectorAll("[data-priocard]"));

const dom = freshDom();
const win = dom.window;
const doc = boot(win);

// ── 1. three bands, in statute order, each citing its own subdivisions ──────
const bs = bands(doc).filter((b) => !b.classList.contains("cplfund-band-orphan"));
check("three statutory bands render", bs.length === 3);
check("the bands are Access, Success, Opportunities in statute order",
  bs.map(bandName).join("|") === "Access|Success|Opportunities");
check("Access cites (A)", /78093\.2\(d\)\(1\)\(A\)/.test(flat(bandById(doc, "access"))));
check("Success cites BOTH (B) and (C) — the fold is visible in the citation",
  /78093\.2\(d\)\(1\)\(B\) and \(C\)/.test(flat(bandById(doc, "success"))));
check("Opportunities cites (D)", /78093\.2\(d\)\(1\)\(D\)/.test(flat(bandById(doc, "opps"))));
// The statute's own words, not a paraphrase — same standard the goal spine holds.
check("every band quotes the statute verbatim",
  bs.every((b) => !!b.querySelector(".cplfund-band-quote")));
check("Opportunities quotes the goal that names MAP",
  /Mapping Articulated Pathways/i.test(flat(bandById(doc, "opps"))));

// ── 2. EVERY priority card is placed — none lost to the grouping ────────────
// The count is taken from the model, not typed, so this keeps holding when Sam
// adds or removes a priority through the tab.
const modelPrios = win.CPL_FUNDING_TAB._effective().years[0].priorities.length;
const rendered = cardsIn(doc).length;
check("every priority in the model renders a card somewhere on the page",
  rendered === modelPrios);
check("every rendered card sits inside a band (none orphaned outside the structure)",
  cardsIn(doc).every((c) => !!c.closest(".cplfund-band")));
const placed = bands(doc).reduce((n, b) => n + cardsIn(b).length, 0);
check("no card is double-counted into two bands", placed === rendered);

// ── 3. membership is DERIVED from the milestone, not matched on a title ─────
// On the live config both Access priorities measure eligible/applied and
// Completion measures transcribed. Renaming a title must not move a card.
check("Access holds the eligible/applied measures", cardsIn(bandById(doc, "access")).length >= 1);
check("Success holds the transcribed measure", cardsIn(bandById(doc, "success")).length >= 1);
// The proof that it is not title matching: the Success band's own name appears
// in no priority title on the live config, and the card is there anyway.
const successCards = cardsIn(bandById(doc, "success")).map(flat).join(" ");
check("Success's card is placed without the word 'Success' appearing in its title",
  successCards.length > 0 && !/Priority \d+: *Success/i.test(successCards));

// ── 4. (D) is a band with NO campus card, and says why ──────────────────────
// The statute points goal (D) at the Chancellor's Office, so no college earns
// against it. It still gets a band: a reader told to allocate "using all of the
// following goals" has to be able to see all of them.
check("Opportunities carries no priority card", cardsIn(bandById(doc, "opps")).length === 0);
check("Opportunities says no campus earns against it",
  /no campus earns against/i.test(flat(bandById(doc, "opps"))));
check("Opportunities names its funding source rather than showing a share",
  /CPL Projects & Innovation/i.test(flat(bandById(doc, "opps"))));

// ── 5. an unplaceable priority surfaces LOUDLY, never silently ──────────────
// The failure this whole suite exists for. A metric whose milestone resolves to
// no statutory goal must still render its card — in a visible orphan band — so
// the gap is a thing someone can see and fix, not funding earned off-screen.
const dom2 = freshDom();
const win2 = dom2.window;
const doc2 = boot(win2);
const T2 = win2.CPL_FUNDING_TAB;
const cfg = JSON.parse(JSON.stringify(T2._config()));
const sc = cfg.projects["cpl-implementation"].scenarios["Scenario 1"];
// A metric no resolver can map: not eligible, not applied, not transcribed, not
// accepted. Written as a SCENARIO OVERRIDE (the layer the tab itself writes),
// not by reaching into the baked defaults — the baked scenario carries no
// yearPriorities block at all, so this has to create one the way a curator edit
// would rather than assume the shape.
sc.yearPriorities = sc.yearPriorities || {};
sc.yearPriorities["1"] = sc.yearPriorities["1"] || {};
sc.yearPriorities["1"]["1"] = Object.assign({}, sc.yearPriorities["1"]["1"],
  { metric: "Something MAP has never measured" });
delete sc.yearPriorities["1"]["1"].metric_src;
T2._setConfig(cfg);
T2.boot();
T2.render();
const orphanBands = Array.from(doc2.querySelectorAll(".cplfund-band-orphan"));
const allCards2 = cardsIn(doc2).length;
check("an unresolvable priority still renders its card", allCards2 === modelPrios);
check("it surfaces in a visible orphan band rather than vanishing", orphanBands.length === 1);
check("the orphan band says what is wrong and how to fix it",
  /does not resolve to a goal/i.test(flat(orphanBands[0])) &&
  /tag the goal explicitly/i.test(flat(orphanBands[0])));

// ── 5b. the reorder controls are wired in EVERY band, not just the first ────
// A real bug this consolidation introduced and this check now pins. The handler
// bound `document.querySelector("#cplFundingMount .cplfund-prio")` — singular —
// which was right while there was one grid. Banding creates one grid per band,
// so only Access's cards got listeners: the position picker on every card below
// it looked live, accepted the change, and reordered nothing. A control that
// silently does nothing is worse than one that is visibly absent, and no
// assertion about markup would have caught it — only exercising the last card.
const lastIdx = modelPrios - 1;
const lastCard = doc.querySelector('.cplfund-prio .p[data-priocard="' + lastIdx + '"]');
check("the last priority card exists and sits in a later band than the first",
  !!lastCard && !!doc.querySelector('.cplfund-prio .p[data-priocard="0"]'));
const picker = lastCard && lastCard.querySelector("[data-priopos]");
check("the LAST card carries a position picker", !!picker);
const orderBefore = win.CPL_FUNDING_TAB._effective().years[0].priorities
  .map((p) => p.srcIndex).join("");
picker.value = "0";
picker.dispatchEvent(new win.Event("change", { bubbles: true }));
const orderAfter = win.CPL_FUNDING_TAB._effective().years[0].priorities
  .map((p) => p.srcIndex).join("");
check("changing it ACTUALLY reorders — the handler reaches past the first band",
  orderBefore !== orderAfter, "before " + orderBefore + " after " + orderAfter);

// ── 6. the §78093.2(d)(2) reporting artifact SURVIVES the consolidation ─────
// Collapsing two sections into one must not delete the goal spine: it is the
// (d)(2) demonstration record, and it is the only place goal (C) comes out
// honestly funded-and-unmeasured. It moves one click down; it does not retire.
check("the goal spine still renders, inside the consolidated section",
  doc.querySelectorAll(".cplfund-goal").length === 4);
const fold = doc.querySelector(".cplfund-goalspine-fold");
check("the goal spine is a fold under the bands, not a rival section", !!fold);
check("the fold names what it holds", /(d\)\(2\)|how it is evidenced)/i.test(flat(fold.querySelector("summary"))));
check("there is exactly ONE section carrying the statutory outcomes title",
  (doc.body.innerHTML.match(/Funding Outcomes Required by/g) || []).length === 1);

finish();
