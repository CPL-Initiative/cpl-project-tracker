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
  3001: ["Introduction to blueprint reading for the welding trade.", "Blueprints", 2],
  3002: ["Blueprint reading for the welding trade, with shop drawings.", "Blueprints", 2],
  3003: ["Blueprint reading for the welding trade and construction drawings.", "Blueprints", 2],
};
const U = { counts: { identities: 3, standalone: 0 },
  bounds: { x0: -60, x1: 160, y0: -60, y1: 60 }, islands: [
  { d: "Welding", sh: "welding", x: 0, y: 0, r: 40, p: [
      { i: "WELD M1012", t: "Advanced Gas Tungsten Arc Welding", x: 0, y: 0, s: 0, u: 3, n: 5, ar: 6 },
      { i: "WELD M1073", t: "Blueprint Reading (Metal Trades)",  x: 6, y: 0, s: 0, u: 2, n: 3 } ] },
  { d: "Nursing", sh: "nursing", x: 90, y: 0, r: 40, p: [
      { i: "NRSR M1101", t: "Fundamentals of Nursing", x: 90, y: 0, s: 0, u: 4, n: 3 } ] },
]};
const MEM = { colleges: ["Alpha College", "Beta College", "Gamma College", "Delta College", "Epsilon College"],
  counts: { identities: 3, members: 11, dropped_no_key: 0, cn_on_multiple_identities: 0 },
  m: { "WELD M1012": [[1001,"WELD 60",0],[1002,"WELD 60",1],[1003,"WELD 61",2],[1004,"WELD 62",3],[1005,"WELD 63",4]],
       "NRSR M1101": [[2001,"NURS 10",0],[2002,"NURS 10",1],[2003,"NURS 11",2]],
       "WELD M1073": [[3001,"WELD 20",0],[3002,"WELD 21",1],[3003,"WELD 22",2]] } };
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

  /* ⭐ SAM'S SENTENCE, VERBATIM. He authorised a synthetic description "as long
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

  // ── (10) the masthead names the data, not a version ───────────────────────
  check("the masthead no longer claims 'prototype v1'",
        !/prototype v1/i.test((q(".brand") || {}).textContent || ""),
        `brand read: ${(q(".brand") || {}).textContent}`);

  done();
})().catch((e) => { console.error(e); process.exit(1); });
