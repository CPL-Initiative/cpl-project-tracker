// SkyView — the course outline of record, and the three fixes from the 2026-09-06
// screen recording.
//
// Sam ruled three things that morning, and the outline had been planned three
// times and built zero times:
//
//   1. Enter CLOSES the search panel — a reversal of item 6 of the same morning,
//      which he flagged himself. With it: the sort control moves to the list's
//      top right and an Enter button takes its place at the bottom.
//   2. Double-click opens the course outline of record work surface.
//   3. The chip row reserves its space — "stability wins".
//
// ⚠️ WHAT THIS FILE CANNOT SEE, AND WHY IT STILL GUARDS IT. jsdom has no layout
// engine: getBoundingClientRect() returns zeroes and no breakpoint fires, so the
// 36px the dropdown used to drop is invisible here — it was measured in Chromium
// against the served page. What IS checkable is the CSS CONTRACT that makes the
// reserve work, so that is what the layout checks below assert: delete the
// min-height and this file goes red even though nothing here can measure a
// pixel. The value assertion lives in the browser run, recorded in the lane.
//
// Run from repo root: `npm test` (or `node tests/ccr_skyview_outline.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.dirname(__dirname);
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const done = () => {
  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
};

/* ── fixture ────────────────────────────────────────────────────────────────
 * Three identities, each shaped to catch one extraction defect that a real
 * corpus produced and a naive fixture would not:
 *
 *   WELD M1012 "Advanced Gas Tungsten Arc Welding" — the TWO-AXIS case. Its
 *     title says Advanced; four of its five colleges name "gas tungsten arc
 *     welding", which says nothing about level. If the skill reads "Advanced"
 *     the course's axis has leaked onto the skill's, which is precisely what
 *     Sam ruled against.
 *   NRSR M1101 — the PUNCTUATION case. Its descriptions carry a comma list, and
 *     a word-only tokenizer walks straight across it: the real corpus produced
 *     "pain tissue integrity gas" as a skill.
 *   WELD M1073 — the SUB-PHRASE case: a long name repeated, whose fragments
 *     must not be listed beside it.
 *
 * ⚠️ A fixture too small to fail makes a guard a decoration. Each phrase below
 * appears in ENOUGH colleges to clear the two-college confidence tier. */
/* The migration boilerplate as the corpus actually carries it — 345 characters
 * of prose whose whole content is that the field is blank. 49 rows carry this
 * exact string; it is the single most-reused description in the corpus. */
const STUB = "This text field is blank due to the March 2012 data migration and CCC Curriculum Inventory Version 1 protocol. In an effort to maximize the accuracy of your college data in the CCC Curriculum Inventory, it is recommended but not required that the college takes action to amend via correction this data field to update the inventory record.";
const DESCS = {
  // WELD M1012 — five colleges, four naming the process, none naming a level
  1001: ["Students practice gas tungsten arc welding on plate and pipe.", "Welding I", 3],
  1002: ["Instruction in gas tungsten arc welding and shop safety.", "Welding II", 3],
  1003: ["This course covers gas tungsten arc welding of stainless steel.", "Welding III", 3],
  1004: ["Practice in gas tungsten arc welding and welding positions.", "Welding IV", 3],
  1005: ["Shop safety and welding positions for the metal trades.", "Welding V", 3],
  // NRSR M1101 — a comma list in every description
  2001: ["Concepts include infection, thermoregulation, pain, tissue integrity, gas exchange.", "Fundamentals", 4],
  2002: ["Concepts include infection, thermoregulation, pain, tissue integrity, gas exchange.", "Fundamentals", 4],
  2003: ["The nursing process and infection, thermoregulation, pain, tissue integrity.", "Fundamentals", 4],
  // WELD M1073 — the long name, three times
  // WELD M10TJ — carried by ONE college: ruling 5's "complete evidence" case
  4001: ["Basic shielded metal arc welding and shop safety.", "Welding basics", 2],
  3001: ["Introduction to blueprint reading for the welding trade.", "Blueprints", 2],
  3002: ["Blueprint reading for the welding trade, with shop drawings.", "Blueprints", 2],
  3003: ["Blueprint reading for the welding trade and construction drawings.", "Blueprints", 2],
  /* WELD M1041 — the SPELLING case, taken from the corpus. Three colleges write
     "flux cored" and one writes "flux-cored"; two write a safety document
     singular and plural. Before the fold each spelling was its own skill, so
     one card listed the same name twice — what Sam photographed on WELD M1109. */
  5001: ["Instruction in flux cored arc welding and safety data sheets.", "FCAW I", 3],
  5002: ["Practice in flux cored arc welding and the safety data sheet.", "FCAW II", 3],
  5003: ["This course covers flux cored arc welding of carbon steel.", "FCAW III", 3],
  5004: ["Training in flux-cored arc welding for structural steel.", "FCAW IV", 3],
  /* ⭐ WELD M10PH — the PLACEHOLDER case (Sam, 2026-09-10: "some of the course
     descriptions have boilerplate"). Two colleges publish the March 2012
     migration notice and one publishes a real sentence. The two stubs are
     IDENTICAL to each other and share almost no content words with the real
     one, so the medoid — the description most typical of the rest — hands the
     card a paragraph whose entire content is that the field is blank. It is not
     a tie the fix breaks; the stub wins outright. */
  6001: [STUB, "Special Topics", 3],
  6002: [STUB, "Special Topics", 3],
  6003: ["Fabrication of sheet metal ductwork, including layout and seaming.", "Sheet Metal", 3],
  /* WELD M10EX — the only description is one that says there is none. */
  7001: ["Experimental course.", "Experimental", 1],
  /* ⭐ WELD M10CN — the CONSOLIDATION case (Sam's ruling, 2026-09-10). Four
     colleges. Three open with the same sentence in near-identical words; two
     add a second shared sentence; one adds a line only it carries. The opening
     sentence sits SECOND in one catalog, so ordering by agreement alone would
     start the card mid-thought — the real defect on ITIS M1449. */
  8001: ["This course introduces the principles of hydraulic systems used in mobile equipment. "
       + "Students diagnose and repair pumps, valves and cylinders. Field trips may be required.", "Hydraulics I", 3],
  8002: ["This course introduces the principles of hydraulic systems used on mobile equipment. "
       + "Students diagnose and repair pumps, valves and cylinders.", "Hydraulics I", 3],
  8003: ["Students diagnose and repair pumps, valves and cylinders.", "Hydraulics I", 3],
  8004: ["Students diagnose and repair pumps, valves and cylinders. "
       + "A survey of pneumatic control circuits for industrial machinery.", "Pneumatics", 3],
  /* WELD M10AD — every college fills the description field with the catalog's
     administration, and one of them runs the hour block straight into the only
     real sentence with no full stop between. That sentence is the whole
     description on PLGL M1026, and the first draft of the filter deleted it. */
  9001: ["Advisory: WELD 10 or equivalent.", "Special Topics", 1],
  9002: ["Prerequisite(s): None. Not repeatable.", "Special Topics", 1],
  9003: ["Lec Hrs: 24.00 Out of Class Hrs: 48.00 Total Student Learning Hrs: 72.00 "
       + "Current developments in the substantive law of an area of legal practice.", "Special Topics", 1],
  /* WELD M10HD — the record dump: a course code, its own title, and an inline
     "Prerequisite: None" in front of the sentence that actually describes it.
     Unanimous across all three, so it leads the card unless it is stripped. */
  9101: ["WLD-51 : Shop Safety Prerequisite: None Shop safety covers the handling of compressed "
       + "gas cylinders and personal protective equipment.", "Shop Safety", 2],
  9102: ["WLD-52 : Shop Safety Prerequisite: None Shop safety covers the handling of compressed "
       + "gas cylinders and personal protective equipment.", "Shop Safety", 2],
  9103: ["(See general education pages for the requirement this course meets.) Advisory: ENGL 1A. "
       + "Shop safety covers the handling of compressed gas cylinders and protective equipment. "
       + "(Also listed as WLD-99.) Torch cutting is introduced in the second half of the term.", "Shop Safety", 2],
  /* ⭐ WELD M10CH — the CHAIN. Three sentences where the first and third share
     nothing, and the middle one touches both. Single-link clustering welds all
     three into one "agreed" sentence through the middle; complete-link cannot,
     because the weakest pair has to clear the bar too. Measured on the real
     corpus, single-link at 0.4 left a loose pair in 10.1% of multi-sentence
     clusters — "the fundamentals of acting in film and television" bound to
     "acting in film and television commercials, episodic screen work". */
  9201: ["Welders practice aluminum brazing.", "Brazing", 2],
  9202: ["Welders practice aluminum brazing and titanium soldering.", "Brazing", 2],
  9203: ["Titanium soldering and copper flaring.", "Brazing", 2],
};
const U = { counts: { identities: 3, standalone: 0 },
  bounds: { x0: -60, x1: 160, y0: -60, y1: 60 }, islands: [
  { d: "Welding", sh: "welding", x: 0, y: 0, r: 40, p: [
      { i: "WELD M1012", t: "Advanced Gas Tungsten Arc Welding", x: 0, y: 0, s: 0, u: 3, n: 5, ar: 6 },
      { i: "WELD M1073", t: "Blueprint Reading (Metal Trades)",  x: 6, y: 0, s: 0, u: 2, n: 3 },
      { i: "WELD M10TJ", t: "Welding Basics",                    x: 12, y: 0, s: 0, u: 2, n: 1 },
      { i: "WELD M1041", t: "Flux Cored Arc Welding",            x: 18, y: 0, s: 0, u: 3, n: 4 },
      { i: "WELD M10PH", t: "Special Topics in Sheet Metal",      x: 24, y: 0, s: 0, u: 3, n: 3 },
      { i: "WELD M10EX", t: "Experimental Welding Topics",        x: 30, y: 0, s: 0, u: 1, n: 1 },
      { i: "WELD M10CN", t: "Mobile Hydraulics",                  x: 36, y: 0, s: 0, u: 3, n: 4 },
      { i: "WELD M10AD", t: "Special Topics in Welding",          x: 42, y: 0, s: 0, u: 1, n: 3 },
      { i: "WELD M10HD", t: "Shop Safety",                        x: 48, y: 0, s: 1, u: 2, n: 3 },
      { i: "WELD M10CH", t: "Brazing and Soldering",              x: 54, y: 0, s: 0, u: 2, n: 3 } ] },
  { d: "Nursing", sh: "nursing", x: 90, y: 0, r: 40, p: [
      { i: "NRSR M1101", t: "Fundamentals of Nursing", x: 90, y: 0, s: 0, u: 4, n: 3 } ] },
]};
const MEM = { colleges: ["Alpha College", "Beta College", "Gamma College", "Delta College", "Epsilon College"],
  counts: { identities: 3, members: 11, dropped_no_key: 0, cn_on_multiple_identities: 0 },
  m: { "WELD M1012": [[1001,"WELD 60",0],[1002,"WELD 60",1],[1003,"WELD 61",2],[1004,"WELD 62",3],[1005,"WELD 63",4]],
       "NRSR M1101": [[2001,"NURS 10",0],[2002,"NURS 10",1],[2003,"NURS 11",2]],
       "WELD M1073": [[3001,"WELD 20",0],[3002,"WELD 21",1],[3003,"WELD 22",2]],
       "WELD M10TJ": [[4001,"WELD 5",0]],
       "WELD M1041": [[5001,"WELD 40",0],[5002,"WELD 41",1],[5003,"WELD 42",2],[5004,"WELD 43",3]],
       "WELD M10PH": [[6001,"WELD 88",0],[6002,"WELD 88",1],[6003,"WELD 89",2]],
       "WELD M10EX": [[7001,"WELD 99",0]],
       "WELD M10CN": [[8001,"WELD 60A",0],[8002,"WELD 60B",1],[8003,"WELD 60C",2],[8004,"WELD 60D",3]],
       "WELD M10AD": [[9001,"WELD 70",0],[9002,"WELD 71",1],[9003,"WELD 72",2]],
       "WELD M10HD": [[9101,"WLD 51",0],[9102,"WLD 52",1],[9103,"WLD 53",2]],
       "WELD M10CH": [[9201,"WLD 61",0],[9202,"WLD 62",1],[9203,"WLD 63",2]] } };
const ATLAS = { _generated_from: "2026-09-06 15:35", totals: { decision_components: 0, identities_inbrowser: 3,
  suggestion_groups: 0, member_rows: 11 }, disciplines: [
  { name: "Welding", decisions: 0, ids: 2, members: 8, flagged: 0, reviewed: 0 },
  { name: "Nursing", decisions: 0, ids: 1, members: 3, flagged: 0, reviewed: 0 }], detail: {} };

const tpl = fs.readFileSync(path.join(ROOT, "prototype/ccr_atlas_v1.html"), "utf8");
const ujs = fs.readFileSync(path.join(ROOT, "prototype/ccr_universe.js"), "utf8");
const safe = (o) => JSON.stringify(o).replace(/<\//g, "<\\/");
const html = tpl.replace("__DATA__", safe(ATLAS)).replace("__GRAPHJS__", "")
  .replace("__ESLDATA__", "null").replace("__ESLJS__", "")
  .replace("__UNIVDATA__", safe(U)).replace("__UNIVMEM__", safe(MEM)).replace("__UNIVJS__", ujs);

function fakeCtx() {
  const noop = () => {};
  return { setTransform: noop, clearRect: noop, fillRect: noop, beginPath: noop, arc: noop, fill: noop,
           closePath: noop, createRadialGradient: () => ({ addColorStop: noop }),
           stroke: noop, moveTo: noop, lineTo: noop, save: noop, restore: noop, setLineDash: noop,
           strokeText: noop, fillText: noop, measureText: (t) => ({ width: String(t).length * 6 }),
           fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "", textBaseline: "" };
}
const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true,
  url: "https://example.org/prototype/skyview.html",
  beforeParse(window) {
    window.CPL_SKYVIEW_OPENS = "map";   // this suite measures the flat map; the Sky has its own (ccr_skyview_sky.test.js)
    window.HTMLCanvasElement.prototype.getContext = function () { return fakeCtx(); };
    // The description shards, served rather than 404'd: two of the six layers
    // have nothing to say without them.
    window.fetch = (url) => /welding|nursing/.test(String(url))
      ? Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(DESCS) })
      : Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
  },
});
const w = dom.window, d = w.document;
const q = (s) => d.querySelector(s);
const qa = (s) => [...d.querySelectorAll(s)];
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = tpl;                                  // the stylesheet, as authored

(async () => {
  await new Promise((r) => { if (d.readyState === "complete") r(); else w.addEventListener("load", r); });
  await tick();

  // ── (1) the outline renders, layered ──────────────────────────────────────
  w.__ccrOutline("WELD M1012");
  await tick(); await tick(); await tick();
  const layers = qa(".ol-layer h2").map((e) => e.textContent);
  check("the outline renders every layer", layers.length === 6,
        `expected 6 layers, got ${layers.length}: ${layers.join(" | ")}`);
  check("the CPL layer is present and empty, not omitted",
        !!q("#ol-cpl") && q("#ol-cpl").classList.contains("empty"),
        "a surface that omits the layers it cannot fill reads as finished");

  /* ⭐ SAM'S SENTENCE, VERBATIM. He authorized a synthetic description "as long
   * as it is clearly labeled MAP-Generated for faculty consideration and
   * revision before use" — a paraphrase is not the ruling. */
  const gen = (q(".ol-gen") || {}).textContent || "";
  check("the MAP-Generated label is Sam's sentence, verbatim",
        /MAP-Generated/.test(gen) && /for faculty consideration and revision before use/.test(gen),
        `got: ${gen.slice(0, 90)}`);

  // ── (2) the thirteen outline-of-record slots ──────────────────────────────
  check("all thirteen outline-of-record slots render", qa("#ol-mc li").length === 13,
        `got ${qa("#ol-mc li").length}`);

  // ── (3) ⭐ TWO LEVEL AXES, NEITHER DERIVED FROM THE OTHER ──────────────────
  /* The course title says Advanced. The skill "gas tungsten arc welding" says
   * nothing about level. If the skill has inherited the course's level, the
   * second axis is manufactured out of the first — the one thing Sam's ruling
   * of 2026-09-05 forbids. */
  check("the course level is read off the title",
        /Advanced/.test((q(".ol-lvl .chip") || {}).textContent || ""),
        `course level chip read: ${(q(".ol-lvl .chip") || {}).textContent}`);
  const gtaw = qa("#ol-skills .ol-skills li")
    .find((li) => /gas tungsten arc welding/.test(li.textContent));
  check("a skill that names no level reads 'not stated', NOT the course's level",
        !!gtaw && /level not stated/.test(gtaw.textContent) && !/Advanced/.test(gtaw.textContent),
        gtaw ? `skill row read: ${gtaw.textContent}` : "the skill was not extracted at all");

  // ── (4) sub-phrase fragments do not survive ───────────────────────────────
  const skills = qa("#ol-skills .ol-skills li").map((li) => (li.querySelector(".ol-sk") || {}).textContent);
  check("the long name is kept whole", skills.includes("gas tungsten arc welding"),
        `skills: ${skills.join(" | ")}`);
  check("its fragments are not listed beside it",
        !skills.includes("tungsten arc welding") && !skills.includes("gas tungsten arc"),
        `skills: ${skills.join(" | ")}`);

  // ── (5) ⚠️ A NAME NEVER SPANS A COMMA ─────────────────────────────────────
  /* The real corpus produced "pain tissue integrity gas" from an enumeration.
   * Nothing in the fixture's comma list may appear as one phrase. */
  w.__ccrOutline("NRSR M1101");
  await tick(); await tick();
  const nSkills = qa("#ol-skills .ol-skills li").map((li) => (li.querySelector(".ol-sk") || {}).textContent);
  check("no skill is stitched across a comma",
        !nSkills.some((s) => /pain tissue|integrity gas|infection thermoregulation/.test(s)),
        `skills: ${nSkills.join(" | ")}`);

  // ── (6) ⭐ A VIEW SWAP MOVES THE HASH, AND THE SELECTION SURVIVES IT ───────
  w.__ccrUniverse({ solo: true });
  await tick();
  /* Use the module's OWN suggestion objects: a hand-built one has no `isl` and
   * tokenFromSuggestion reads it. Tests that fake a payload shape drift from it. */
  const sugs = w.__ccrSuggest("weld", 10) || [];
  check("the fixture yields something to pick", sugs.length > 0, "__ccrSuggest returned nothing for 'weld'");
  if (sugs.length) w.__ccrToggleSuggestion(sugs[0]);
  await tick();
  const before = (w.__ccrTokenKeys() || []).slice();
  check("a pick is held before the trip", before.length > 0, "the fixture never made a selection");
  w.__ccrDiscipline("Welding");
  await tick();
  check("the hash names the view being shown", w.location.hash === "#work/Welding",
        `hash read ${w.location.hash} while the Welding work surface was on screen`);
  check("the selection survives leaving the map",
        (w.__ccrTokenKeys() || []).length === before.length,
        `picks went from ${before.length} to ${(w.__ccrTokenKeys() || []).length} on the way out`);
  check("a crumb leads back to SkyView",
        qa("#crumbs button").some((b) => /SkyView/.test(b.textContent)),
        "the only way back was to search for the discipline again");

  // ── (7) the outline is routable ───────────────────────────────────────────
  w.location.hash = "#outline/WELD M1073";
  w.__ccrRoute();
  await tick(); await tick();
  check("#outline/<id> routes to that course's outline",
        /Blueprint Reading/.test(((q("#ol-title") || {}).textContent) || ""),
        `#ol-title read: ${(q("#ol-title") || {}).textContent}`);

  // ── (8) ruling 1: the search panel ────────────────────────────────────────
  w.__ccrUniverse({ solo: true });
  await tick();
  const box = q("#gq");
  box.value = "weld";
  box.dispatchEvent(new w.Event("input", { bubbles: true }));
  await tick();
  const sug = q("#sug");
  check("the sort control sits in the list's header", !!q("#sug .sug-head .sug-sort"),
        "ruling 1 moved it to the top right");
  check("an Enter button sits where the sort button was", !!q("#sug .sug-more .sug-go"),
        "ruling 1 put it in the bottom row");
  /* ⚠️ The header is a child of the listbox, so a cursor addressed by CHILD
   * POSITION now points one row above where the reader is looking. */
  box.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  box.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  const on = q("#sug li.on");
  check("the arrow cursor lands on the row it names",
        !!on && on.id === box.getAttribute("aria-activedescendant"),
        `.on is ${on && on.id}, aria-activedescendant is ${box.getAttribute("aria-activedescendant")}`);
  // Enter, with nothing highlighted, closes the panel.
  q("#sug li.on").classList.remove("on");
  box.value = "weld";
  box.dispatchEvent(new w.Event("input", { bubbles: true }));
  await tick();
  q("#msearch").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await tick();
  check("Enter closes the search panel (ruling 1 reverses item 6)", sug.hidden,
        "the list stayed up after Enter");

  // ── (9) the layout contract jsdom cannot measure ──────────────────────────
  /* ⚠️ These assert the CSS TEXT, not a rectangle. The 36px drop was measured in
   * Chromium; what a jsdom run can still catch is the rule being deleted. */
  check("the chip row reserves two rows (ruling 3, 'stability wins')",
        /\.u-search-slot \.sugwrap\{[^}]*min-height:calc\(var\(--u-chip-h\) \* 2/.test(css),
        "the reserve on .sugwrap is what stops the dropdown moving when the chips wrap");
  /* ⚠️ Sam asked whether the chips could be tighter. Contrast was never the
   * constraint — TARGET SIZE is, and both of these sit exactly on the WCAG 2.2
   * SC 2.5.8 AA floor. A later tightening must not take them below it. */
  check("the chip's remove target stays on the 24px AA floor",
        /\.u-tok-x\{[^}]*width:24px;height:24px/.test(css.replace(/\s*\n\s*/g, "")),
        "SC 2.5.8 gives 24x24 as the minimum; only padding, gap and max-width were free to shrink");
  check("the chip's label target stays on the 24px AA floor",
        /\.u-tok-go\{[^}]*min-height:24px/.test(css.replace(/\s*\n\s*/g, "")),
        "same floor");

  // ── (10) ⭐ RULING 5: "one college" meant two opposite things ─────────────
  /* On a course taught at twenty, one college naming a skill means it is poorly
   * corroborated; on a course taught at ONE, it means the evidence is complete.
   * The words must not be the same. ⚠️ The distinction is the MEMBER count, not
   * the description count — a course taught at five where only one publishes a
   * catalog is not "the only college teaching it". */
  w.__ccrOutline("WELD M10TJ");
  await tick(); await tick();
  const soloSkills = qa("#ol-skills .ol-skills li").map((li) => li.textContent);
  check("(10) a course carried by ONE college says the evidence is complete",
        soloSkills.length > 0 && soloSkills.every((t) => /the only college teaching it/.test(t)),
        soloSkills.slice(0, 2).join(" | ") || "no skills extracted");
  check("(10) and never the bare 'one college', which reads as thin",
        !soloSkills.some((t) => />\s*one college\s*</.test(t)),
        soloSkills.slice(0, 2).join(" | "));
  /* The other half of the ruling, guarded by its CODE rather than a fixture:
   * the two cases must be told apart by the member count. */
  check("(10) the two cases are separated by the member count, not the catalog count",
        /function olConfWord\(n, total, taught\)/.test(ujs) &&
        /taught===1/.test(ujs) && /the only college with a description/.test(ujs),
        "olConfWord must take `taught` and branch on it");

  // ── (11) ⭐ RULING 3: text size is a SECOND axis ──────────────────────────
  /* Sam was explicit that this must not change the behavior where text does not
   * zoom with the map. jsdom cannot measure a rendered glyph, so the guard is on
   * the contract: three bounded steps, persisted, and the map's own zoom
   * untouched by a step change. The pixel check ran in Chromium. */
  const kBefore = w.__ccrUniverseState().view ? w.__ccrUniverseState().view.k : w.__ccrUniverseState().k;
  w.__ccrUniverse({ solo: true });
  await tick();
  check("(11) the text size control is a WORD with a word for its state",
        !!q("#u-textsize") && /Label text/.test(q("#u-textsize").textContent),
        (q("#u-textsize") || {}).textContent);
  w.__ccrTextStep(2);
  await tick();
  check("(11) it steps", w.__ccrTextStep() === 2, String(w.__ccrTextStep()));
  const kAfter = w.__ccrUniverseState().view ? w.__ccrUniverseState().view.k : w.__ccrUniverseState().k;
  check("(11) ⭐ and the MAP's zoom does not move with it (Sam's constraint)",
        kAfter === kBefore, `${kBefore} -> ${kAfter}`);
  /* ⚠️ Scaling the font without the collision box would let the placer accept
   * labels that then overlap — worse than a dropped label. */
  /* ⚠️ REWRITTEN, NOT RELAXED (S242). The island size now goes through
   * labelSize() — whole pixels with a dead band, because a font size that
   * drifts is rebuilt every frame and shimmers. `tx()` is still inside it, and
   * that is what this check is about; the wrapper is why the old literal no
   * longer matches. Region labels read tx() too, via Math.round(15*tx()). */
  check("(11) the collision boxes scale with the text, not just the font",
        /var size=labelSize\(q, Math\.max\(11,Math\.min\(19,q\.r\*0\.17\)\)\*tx\(\)\)/.test(ujs) &&
        /var mem=q\.band==="member", lh=Math\.round\(\(mem\?11:12\)\*tx\(\)\)/.test(ujs),
        "both the island label size and the course line-height must read tx()");
  check("(11) three bounded steps, not a slider the label placer cannot honor",
        /var TEXT_STEPS=\[\["Smaller",0\.85\],\["Normal",1\],\["Larger",1\.25\]\]/.test(ujs));
  w.__ccrTextStep(1);

  // ── (12) the masthead names the data, not a version ───────────────────────
  check("the masthead no longer claims 'prototype v1'",
        !/prototype v1/i.test((q(".brand") || {}).textContent || ""),
        `brand read: ${(q(".brand") || {}).textContent}`);

  // ── (13) ⭐ ONE SKILL, ONE ROW — the same name spelled two ways ───────────
  /* Sam, 2026-09-07: "duplicated skills." WELD M1109 listed "flux cored arc
   * welding" AND "flux-cored arc welding" side by side. olWords() keeps a
   * hyphen inside a token, so the hyphenated spelling is a three-token phrase
   * and the spaced one a four-token phrase, and nothing downstream could see
   * they were one name. Measured over all 46,317 identities carrying a catalog
   * description: 209 rows differ from another on the same card only by a hyphen
   * and 835 only by a plural. */
  w.__ccrOutline("WELD M1041");
  await tick(); await tick(); await tick();
  const skRows = qa("#ol-skills .ol-skills li").map((li) => ({
    name: li.querySelector(".ol-sk").textContent,
    chips: [...li.querySelectorAll(".chip")].map((c) => c.textContent),
  }));
  const names = skRows.map((r) => r.name);
  const folded = names.map((n) => w.__ccrSkillFold(n));
  check("(13) ⭐ no skill is listed twice once hyphens and plurals are folded",
        folded.length === new Set(folded).size,
        names.join(" | "));
  const fcaw = skRows.filter((r) => w.__ccrSkillFold(r.name) === "flux cored arc welding");
  check("(13) ⭐ the two spellings are ONE row",
        fcaw.length === 1, `${fcaw.length} rows: ${names.join(" | ")}`);
  /* ⚠️ The count is COLLEGES, so folding has to happen at the counting step:
   * all four colleges name this skill, three of them spelled one way. Collapsing
   * finished rows instead would have kept whichever count was already wrong. */
  check("(13) ⭐ …counted as all four colleges, not three and one",
        fcaw[0] && /most colleges/.test(fcaw[0].chips.join(" ")),
        fcaw[0] ? fcaw[0].chips.join(" | ") : "no row");
  check("(13) the row shows the spelling the most colleges published, not one we invented",
        fcaw[0] && fcaw[0].name === "flux cored arc welding", fcaw[0] && fcaw[0].name);
  const sds = names.filter((n) => w.__ccrSkillFold(n) === "safety data sheet");
  check("(13) a singular and a plural are one skill too", sds.length === 1, sds.join(" | "));

  // ── (14) ⭐ A REVIEWER MAY ADD A SKILL AND TAKE ONE OUT ───────────────────
  /* Sam, 2026-09-07: "need to be able to add or delete a skill on curate."
   * Both stage; nothing is written from this page, which is the lane invariant. */
  check("(14) every imputed skill offers a way to take it out — a WORD, not a glyph",
        qa("#ol-skills [data-drop]").length === skRows.length &&
        qa("#ol-skills [data-drop]").every((b) => /^Remove$/.test(b.textContent.trim())),
        qa("#ol-skills [data-drop]").map((b) => b.textContent).join("|"));
  check("(14) and the layer offers a way to add one", !!q("#ol-sk-add") && /Add a skill/.test(q("#ol-sk-add").textContent));

  const dropBtn0 = q("#ol-skills [data-drop]");
  const dropKey = dropBtn0 ? dropBtn0.dataset.drop : "";
  if (dropBtn0) dropBtn0.click();
  await tick();
  const liveAfter = qa("#ol-skills [data-drop]").map((b) => b.dataset.drop);
  check("(14) Remove takes the skill off the list", !liveAfter.includes(dropKey), liveAfter.join(" | "));
  /* ⚠️ RECORDED, NEVER DERIVED BY SUBTRACTION. The imputation re-runs every time
   * a catalog description lands, so a surface that stored "what is left" would
   * silently delete every skill that arrived after the reviewer last looked —
   * S236's lesson one layer up. The removed key is named, and it is restorable. */
  check("(14) ⭐ …and NAMES it as removed rather than letting it vanish",
        qa("#ol-skills .ol-thin summary").some((x) => /Removed by a reviewer \(1\)/.test(x.textContent)) &&
        qa("#ol-skills [data-restore]").some((b) => b.dataset.restore === dropKey),
        qa("#ol-skills .ol-thin summary").map((x) => x.textContent).join(" | "));
  check("(14) the removal is stored as an explicit key, not as a snapshot of survivors",
        /skillDrop/.test(ujs) && !/skillKeep/.test(ujs));
  const restoreBtn = q("#ol-skills [data-restore]");
  if (restoreBtn) restoreBtn.click();
  await tick();
  check("(14) Put back restores it",
        !!restoreBtn && qa("#ol-skills [data-drop]").map((b) => b.dataset.drop).includes(dropKey),
        restoreBtn ? "restored" : "there was nothing to put back");

  w.prompt = () => "pipe fit-up and alignment";
  if (q("#ol-sk-add")) q("#ol-sk-add").click();
  await tick();
  const addedLi = qa("#ol-skills .ol-skills li").find((li) => /pipe fit-up and alignment/.test(li.textContent));
  check("(14) ⭐ Add a skill stages a row the catalogs do not name", !!addedLi,
        qa("#ol-skills .ol-sk").map((e) => e.textContent).join(" | "));
  /* A curator's knowledge is a first-class input — attributed, not laundered
   * into an anonymous row (the MAP-team obligation in CLAUDE.md). */
  check("(14) …attributed to the reviewer, with the day it was staged",
        addedLi && /added by a reviewer/.test(addedLi.textContent) &&
        /Staged in this browser/.test(addedLi.querySelector(".chip.gen").getAttribute("title")) &&
        /\d{4}-\d{2}-\d{2}/.test(addedLi.querySelector(".chip.gen").getAttribute("title")),
        addedLi ? addedLi.querySelector(".chip.gen").getAttribute("title") : "");
  check("(14) the review layer lists what is staged, so its summary is true",
        /Skills added by a reviewer/.test(q("#ol-review").textContent) &&
        /pipe fit-up and alignment/.test(q("#ol-review").textContent) &&
        /staged, not saved/.test(q("#ol-review").textContent));
  check("(14) …and 'Drop the proposals' appears for a skill edit, not only a rename",
        !!q("#ol-revert"));
  if (q("#ol-revert")) q("#ol-revert").click();
  await tick();
  check("(14) dropping the proposals clears the skill edits too",
        !qa("#ol-skills .ol-sk").some((e) => /pipe fit-up/.test(e.textContent)) &&
        !qa("#ol-skills .ol-thin summary").some((x) => /Removed by a reviewer/.test(x.textContent)));
  check("(14) nothing on this page writes — the layer says so in the words of the invariant",
        /Nothing is written from this page/.test(q("#ol-review").textContent) &&
        /nothing is written/i.test(q("#ol-skills").textContent));

  // ── (15) ⭐ AN OUTLINE OPENED BY ITS OWN LINK STILL HAS ITS COURSES ───────
  /* buildMemberIndex() ran only inside __ccrUniverse, so a reader arriving on
   * #outline/<id> — a shared link, or a reload, which is what the hash routing
   * exists for — got an outline with ZERO college courses: nothing to quote,
   * nothing to impute, an empty member list. Every layer said "none", which is
   * not a rendering gap but a false statement about the data. */
  check("(15) the corpus is built by whichever view is entered first, not only by the map",
        /function ensureCorpus\(\)/.test(ujs) &&
        /if\(!roster\) buildMemberIndex\(\);/.test(ujs) &&
        (ujs.match(/ensureCorpus\(\)/g) || []).length >= 4,
        "every non-map entry point must call ensureCorpus()");
  check("(15) …and the outline it renders carries them",
        w.__ccrUniverseState().members > 0 && qa("#ol-members li").length === 4,
        `members ${w.__ccrUniverseState().members}, rows ${qa("#ol-members li").length}`);

  /* ── (12) ⭐ A PLACEHOLDER IS NOT A DESCRIPTION (Sam, 2026-09-10) ──────────
   * "Some of the course descriptions have boilerplate test for descriptions."
   *
   * ⚠️ THE OBVIOUS DETECTOR IS THE WRONG ONE. Reuse looks like the signal and
   * is not: the six most-reused description strings in the corpus are the C-ID
   * descriptors for statistics, psychology, government, composition, public
   * speaking and critical thinking — 1,149 rows of GOOD text that many colleges
   * publish identically on purpose. What is junk is text that announces it is
   * not a description, and there is little of it: 247 of 127,266 non-empty rows
   * (0.19%) across 107 distinct strings, every one read by hand before this
   * shipped (measured 2026-09-10).
   *
   * ⚠️ AND NEVER BY LENGTH. "Study of selected works of Shakespeare." is 38
   * characters and real. Check (12d) pins that. */
  w.__ccrOutline("WELD M10PH");
  await tick(); await tick(); await tick();
  {
    const desc = q("#ol-desc");
    const quote = desc.querySelector(".ol-desc");
    check("(12) ⭐ the card quotes the real description, not the migration stub",
      !!quote && /sheet metal ductwork/.test(quote.textContent) &&
      !/data migration/.test(quote.textContent), quote && quote.textContent.slice(0, 120));
    /* ⭐ AND NO COLLEGE IS NAMED — Sam's ruling, 2026-09-10: "I don't want to
     * choose the single most representative description and attribute it to
     * the college it came from. Doing so could lead to division as some
     * faculty may question the choice." The card used to print "Gamma College
     * · WELD 89 — the description most typical of the 3 colleges"; naming the
     * winner is the thing that was wrong with it, not the choosing. */
    check("(12a) ⭐ no college is named in the Description layer at all",
      !/Alpha|Beta|Gamma|Delta|Epsilon/.test(desc.textContent), desc.textContent.slice(0, 240));
    check("(12a) …and it says what it is instead: consolidated, and the reviewer's to revise",
      /Consolidated from|in its own words/.test(desc.querySelector(".ol-attr").textContent) &&
      /Revise it/.test(desc.querySelector(".ol-attr").textContent),
      desc.querySelector(".ol-attr").textContent);
    check("(12b) ⭐ the count says 1 of 3, not 3 of 3 — a stub is not a published description",
      /<strong>1 of 3<\/strong>/.test(desc.querySelector(".ol-src").innerHTML),
      desc.querySelector(".ol-src").textContent.slice(0, 200));
    check("(12b) …and it says what it set aside, and why, rather than dropping it silently",
      /A further 2 publish a placeholder/.test(desc.querySelector(".ol-src").textContent) &&
      /March 2012/.test(desc.querySelector(".ol-src").textContent),
      desc.querySelector(".ol-src").textContent.slice(0, 300));
    /* ⚠️ NOTHING IS HIDDEN — IT IS LABELLED, and the first draft of this check
     * asserted the wrong surface. The outline's member list prints no
     * description text at all, so "the stub is still there" was never true of
     * it; the map panel is where a curator reads a college's own words. What
     * the outline owes the reader is which rows the layers above skipped. */
    check("(12b) ⚠️ the outline's member list marks the two rows the layers above did not use",
      q("#ol-members").querySelectorAll(".chip").length === 2 &&
      /placeholder/.test(q("#ol-members").textContent) &&
      !/no description/.test(q("#ol-members").textContent),
      q("#ol-members").textContent.slice(0, 200));
    check("(12b) …and nowhere in the imputed skills, which must not read a blank field as content",
      !/migration|inventory|curriculum inventory/i.test(q("#ol-skills").textContent),
      q("#ol-skills").textContent.slice(0, 200));
  }

  /* (12c) The other silence: an identity whose ONLY description says there is
   * none. Quoting it would launder a placeholder into prose, which is exactly
   * what Sam asked not to happen. */
  w.__ccrOutline("WELD M10EX");
  await tick(); await tick(); await tick();
  {
    const desc = q("#ol-desc");
    check("(12c) ⭐ an identity with nothing but a placeholder says it has NO description",
      desc.classList.contains("empty") && /nothing to draw a description from/.test(desc.textContent) &&
      !desc.querySelector(".ol-desc"), desc.textContent.slice(0, 200));
    check("(12c) …and names the placeholder, so the two silences are told apart",
      /1 publishes a placeholder/.test(desc.textContent) && /Experimental course/.test(desc.textContent),
      desc.textContent.slice(0, 300));
  }

  /* (12d) The false positives the rule must not make — checked against the
   * predicate itself, since a fixture cannot carry 107 strings. */
  {
    const src = ujs;
    const m = src.match(/var OL_STUB =[\s\S]*?^\}/m);
    const f = new Function(m[0] + "; return olIsPlaceholder;")();
    const junk = ["Experimental course.", "Experimental Offering in Biology", "See Experimental Offerings",
                  "N/A", "n/a", ".", "tbd", "  ", STUB];
    const real = ["Study of selected works of Shakespeare.",
                  "Experimental course in advanced welding techniques, covering plate and pipe.",
                  "An introduction to the experimental method in psychology.",
                  "Students practice gas tungsten arc welding on plate and pipe.",
                  "None of the above applies; this course surveys the None Group of compilers."];
    check("(12d) every placeholder shape is caught", junk.every(f), junk.filter((x) => !f(x)).join(" | "));
    check("(12d) ⭐ and no real description is — a length rule would kill the 38-character Shakespeare",
      real.every((x) => !f(x)), real.filter(f).join(" | "));
  }

  /* ── (13) ⭐ THE CONSOLIDATION, AND NO COLLEGE NAMED (Sam, 2026-09-10) ─────
   * "I don't want to choose the single most representative description and
   * attribute it to the college it came from. Doing so could lead to division
   * as some faculty may question the choice… It's better to generate a
   * description that best represents what most agree upon and note the few
   * additional descriptive items… If we always provide a generative
   * description and note such, it will allow the faculty reviewers the freedom
   * to revise and accept by consensus."
   *
   * ⚠️ NOTHING IS COMPOSED. Every sentence on the card was written by a college
   * — the unit is the SENTENCE rather than the whole document, and the selector
   * is agreement rather than typicality. That is the half of the medoid's old
   * defense worth keeping: a card that reads as authoritative and belongs to
   * nobody would be worse than either. Check (13e) is what holds it. */
  w.__ccrOutline("WELD M10CN");
  await tick(); await tick(); await tick();
  {
    const desc = q("#ol-desc");
    const quote = desc.querySelector(".ol-desc");
    check("(13) the card carries a consolidation, not a quotation", !!quote);
    check("(13) ⭐ no college is named anywhere in the layer",
      !/Alpha|Beta|Gamma|Delta|Epsilon/.test(desc.textContent), desc.textContent.slice(0, 200));
    check("(13) it holds BOTH shared sentences, each once",
      !!quote && /principles of hydraulic systems/.test(quote.textContent) &&
      /diagnose and repair pumps/.test(quote.textContent) &&
      quote.textContent.match(/principles of hydraulic systems/g).length === 1,
      quote && quote.textContent);
    /* ⭐ THE ORDERING IS THE ONE FROM ITIS M1449, where the card opened
     * "Key topics include text preprocessing…" — a sentence that carried a
     * majority while four differently-worded OPENING sentences each carried
     * one. Here "Students diagnose and repair…" is in all four catalogs and
     * the opener is in two, so ordering by agreement puts the card's first
     * sentence second. Position decides, and the support still decides the
     * held-out list below. */
    check("(13a) ⭐ it opens with the sentence the colleges open with",
      !!quote && quote.textContent.indexOf("principles of hydraulic systems") <
                 quote.textContent.indexOf("diagnose and repair pumps"),
      quote && quote.textContent);
    check("(13b) a line only one college carries is held out, and counted",
      /Some colleges also include/.test(desc.textContent) &&
      /pneumatic control circuits/.test(desc.textContent) &&
      /1 of 4/.test(desc.textContent), desc.textContent.slice(0, 400));
    check("(13b) …and the held-out line is NOT in the consolidation",
      !!quote && !/pneumatic/.test(quote.textContent));
    check("(13c) the source line says what it is and hands the reviewer the pen",
      /MAP-Generated/.test(desc.querySelector(".ol-src").textContent) &&
      /Revise it/.test(desc.querySelector(".ol-attr").textContent) &&
      /no college is named/.test(desc.querySelector(".ol-src").textContent),
      desc.querySelector(".ol-src").textContent.slice(0, 200));
    check("(13d) the field trips line, carried by one college, is held out too",
      !!quote && !/Field trips/.test(quote.textContent) && /Field trips/.test(desc.textContent));
    /* (13e) ⭐ THE INVARIANT: every sentence on the card is a college's own. */
    const src4 = [
      "This course introduces the principles of hydraulic systems used in mobile equipment.",
      "Students diagnose and repair pumps, valves and cylinders.",
      "Field trips may be required.",
      "This course introduces the principles of hydraulic systems used on mobile equipment.",
      "A survey of pneumatic control circuits for industrial machinery."];
    const norm = (t) => t.replace(/[…]/g, "").replace(/\s+/g, " ").trim();
    const shown = [...desc.querySelectorAll(".ol-desc span, .ol-also-l li")]
      .map((e) => norm(e.textContent.replace(/\s*\d+ of \d+\s*$/, "")));
    check("(13e) ⭐ every sentence shown was written by a college — nothing composed",
      shown.length > 0 && shown.every((t) => src4.some((o) => norm(o) === t)),
      shown.filter((t) => !src4.some((o) => norm(o) === t)).join(" | "));
  }

  /* (13f) Every college fills the field with the catalog's administration. The
   * one real sentence is glued to an hour block with no full stop in between —
   * dropping the sentence for its heading deletes the only description these
   * colleges have, which is what happened to PLGL M1026's four. */
  w.__ccrOutline("WELD M10AD");
  await tick(); await tick(); await tick();
  {
    const desc = q("#ol-desc");
    /* ⚠️ THE BODY, NOT THE LAYER. The source line above it explains that
     * "advisories, prerequisites, hour counts and transfer codes are dropped",
     * so a scan of the whole layer finds those words and fails on its own
     * explanation. The first draft of this check did exactly that. */
    const txt = [...desc.querySelectorAll(".ol-desc, .ol-also-l, .empty")]
      .map((e) => e.textContent).join(" ");
    check("(13f) ⭐ the sentence glued to an hour block survives its heading",
      /substantive law of an area of legal practice/.test(txt), txt.slice(0, 260));
    check("(13f) …and the hour block itself does not reach the card",
      !/Lec Hrs|Out of Class|Total Student Learning/.test(txt), txt.slice(0, 260));
    check("(13f) nor do the advisory, the prerequisite, or the repeatability note",
      !/Advisory|Prerequisite|repeatable/i.test(txt), txt.slice(0, 260));
  }

  /* (13g) The record dump: a course code, the course's own title, and an inline
   * "Prerequisite: None" in front of the sentence that describes it. Every
   * college copies the same header format, so a header is the ONE thing that
   * reaches unanimous agreement and leads the card — ENTR M1004 opened with
   * "ENP-51 : Entrepreneurship Basics Prerequisite: None Entrepreneurship has
   * been described as…" on 7 of 7. And a parenthetical cross-reference ends
   * with ".)", which a splitter that wants a stop followed by a space will not
   * break on, so the advisory behind it stops being at the front of anything. */
  w.__ccrOutline("WELD M10HD");
  await tick(); await tick(); await tick();
  {
    const desc = q("#ol-desc"), quote = desc.querySelector(".ol-desc");
    check("(13g) ⭐ the consolidation opens with the description, not the header",
      !!quote && /^Shop safety covers the handling/.test(quote.textContent.trim()),
      quote && quote.textContent.slice(0, 160));
    check("(13g) the course code, the repeated title and the inline prerequisite are gone",
      !!quote && !/WLD-5|Prerequisite/i.test(quote.textContent), quote && quote.textContent);
    const body = [...desc.querySelectorAll(".ol-desc, .ol-also-l, .empty")]
      .map((e) => e.textContent).join(" ");
    check("(13g) …and so is the parenthetical cross-reference and the advisory behind it",
      !/general education pages|Advisory|Also listed as/.test(body), body.slice(0, 300));
    /* ⚠️ A CROSS-REFERENCE ENDS ".)" AND THE DESCRIPTION FOLLOWS IT IN THE SAME
     * BREATH. A splitter that wants a stop followed by a space never breaks
     * there, so "(Also listed as WLD-99.) Torch cutting is introduced…" is one
     * sentence, it starts with a cross-reference, and the sentence a college
     * actually wrote is DELETED rather than merely mis-ordered. */
    check("(13g) ⭐ the sentence behind a cross-reference survives, rather than going with it",
      /Torch cutting is introduced/.test(body), body.slice(0, 300));
    /* Sam: "when a course is a CID or CCN the description should come from the
     * template (assuming we have those in our dataset)." We hold the
     * designation, not the descriptor text — 541 of 49,896 identities. Say so
     * rather than presenting a consolidation as the statewide text. */
    check("(13h) ⭐ a C-ID identity names the descriptor as the authority and says MAP lacks it",
      /C-ID/.test(desc.textContent) && /statewide descriptor is the authority/.test(desc.textContent) &&
      /not the descriptor text/.test(desc.textContent), desc.textContent.slice(0, 320));
  }
  /* (13i) ⭐ THE CHAIN. Complete-link, not single-link: a sentence joins a
   * cluster only if it clears the bar against EVERY member. "Welders practice
   * aluminum brazing" and "Titanium soldering and copper flaring" share no
   * content word at all; the middle sentence touches both. Single-link welds
   * all three and reports a unanimous agreed sentence that no two colleges
   * actually share. */
  w.__ccrOutline("WELD M10CH");
  await tick(); await tick(); await tick();
  {
    const desc = q("#ol-desc");
    const quote = desc.querySelector(".ol-desc");
    const also = [...desc.querySelectorAll(".ol-also-l li")].map((e) => e.textContent).join(" ");
    check("(13i) ⭐ a sentence sharing nothing with the first is NOT folded in with it",
      /copper flaring/.test(also) && !(quote && /copper flaring/.test(quote.textContent)),
      "quote=" + (quote ? quote.textContent : "(none)") + " | also=" + also);
    check("(13i) …and the two that do share words are folded, once",
      !!quote && /aluminum brazing/.test(quote.textContent) &&
      quote.textContent.match(/aluminum brazing/g).length === 1, quote && quote.textContent);
  }

  w.__ccrOutline("WELD M1012");
  await tick(); await tick(); await tick();
  check("(13h) …and an M-ID identity carries no such note",
    !/statewide descriptor is the authority/.test(q("#ol-desc").textContent));

  done();
})().catch((e) => { console.error(e); process.exit(1); });
