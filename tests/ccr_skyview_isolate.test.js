const fs = require// SkyView — the Isolate toggle (Sam, 2026-09-09).
//
// "Need an Isolate toggle in the header to show only the selected items
// filtered. This will allow users to eliminate the noise of other groupings on
// screen. Sometimes you need to keep the universe in view and other times not."
//
// The last sentence is why it is a toggle and not a mode. The checks are
// written against the two ways this kind of control goes wrong:
//   · ⭐ it must not be PRESSABLE with nothing selected — isolating an empty
//     selection empties the map, and a blank canvas is indistinguishable from a
//     broken control (the exact failure the Show switches were fixed for);
//   · ⭐ islandPass MEMOIZES its per-island count on a signature. Isolation
//     changes which points pass without touching a single switch, so a
//     signature of the switches alone would serve a stale count and the map
//     would not change at all. (7) and (8) are that guard.
("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.dirname(__dirname);
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

/* Three identities per island so each CTE state is represented exactly once:
 * e:1 career technical, e:0 academic, and NO `e` at all — the unresolvable
 * third, which is the one this suite exists for. */
function pts(prefix, x, y) {
  return [
    { i: `${prefix} M1001`, x: x,     y: y, t: "Welding Practice", n: 3, s: 0, f: 0, r: 0, u: 3, c: 0, e: 1 },
    { i: `${prefix} M1002`, x: x + 4, y: y, t: "Art History",      n: 3, s: 0, f: 0, r: 0, u: 3, c: 0, e: 0 },
    { i: `${prefix} M1003`, x: x + 8, y: y, t: "Unlisted Subject", n: 3, s: 0, f: 0, r: 0, u: 3, c: 0 },
  ];
}
const U = {
  _generated_from: "fixture",
  counts: { identities: 3, stand_alone: 0, points: 3, orbiting: 0, orbiting_cross: 0, rim: 0, disciplines: 1 },
  why_bits: { subject: 1, subj4: 2, title: 4, top: 8, units: 16, credit: 32 },
  bounds: { x0: -100, x1: 100, y0: -100, y1: 100 },
  islands: [{ d: "Welding", sh: "welding", x: 0, y: 0, r: 60, n: 3, sa: 0, al: 0, p: pts("WELD", -8, 0) }],
};
const MEM = { colleges: ["Alpha College"],
  counts: { identities: 3, members: 3, dropped_no_key: 0, cn_on_multiple_identities: 0 }, m: {} };
U.islands[0].p.forEach((nd, k) => { MEM.m[nd.i] = [[100000 + k, `WELD ${k}`, 0]]; });
const ATLAS = { _generated_from: "fixture",
  totals: { decision_components: 0, identities_inbrowser: 3, suggestion_groups: 0, member_rows: 3 },
  disciplines: [{ name: "Welding", decisions: 0, ids: 3, members: 3, flagged: 0, reviewed: 0 }], detail: {} };

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
    window.CPL_SKYVIEW_OPENS = "map";
    window.HTMLCanvasElement.prototype.getContext = function () { return fakeCtx(); };
    window.fetch = () => Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
  },
});
const w = dom.window, d = w.document;
const q = (s) => d.querySelector(s);
const st = () => w.__ccrUniverseState();
const tick = () => new Promise((r) => setTimeout(r, 0));

function setSwitch(key, on) {
  const box = q(`#u-show-menu input[data-show="${key}"]`);
  if (box.checked !== on) box.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
}

(async () => {
  await new Promise((r) => { if (d.readyState === "complete") r(); else w.addEventListener("load", r); });
  await tick(); await tick();

  const iso = () => q("#u-iso");
  check("(1) the header carries an Isolate toggle", !!iso(), "missing #u-iso");
  check("(2) it is a word, not a glyph", iso() && iso().textContent.trim() === "Isolate",
    iso() && iso().textContent);
  check("(3) ⭐ with nothing selected it is DISABLED, not silently inert",
    iso().disabled === true && /select a discipline or a course first/i.test(iso().title), iso().title);
  check("(4) …and starts unpressed", iso().getAttribute("aria-pressed") === "false");

  const all = st().coursesShown;
  check("(5) the whole island is drawn to begin with", all === 3, `shown=${all}`);

  w.__ccrIsolate(true);
  check("(6) ⭐ pressing it with nothing selected isolates nothing",
    w.__ccrIsolate() === false && st().coursesShown === all, `shown=${st().coursesShown}`);

  // Select one course through the same path a reader uses.
  const sug = w.__ccrSuggest("Art History", 20).find((x) => x.kind === "course");
  w.__ccrGoSuggestion(sug);
  await tick();
  check("(7a) selecting a course arms the toggle", iso().disabled === false, iso().title);

  w.__ccrIsolate(true);
  await tick();
  check("(7) ⭐ Isolate draws ONLY the selection — the memo signature carries it",
    w.__ccrIsolate() === true && st().coursesShown < all && st().coursesShown >= 1,
    `shown=${st().coursesShown} of ${all}`);
  check("(8) ⭐ …and the island count follows, so it works at map zoom too",
    st().islandsShown >= 1, `islands=${st().islandsShown}`);
  check("(9) the button reads pressed", iso().getAttribute("aria-pressed") === "true");

  w.__ccrIsolate(false);
  await tick();
  check("(10) switching it off brings the universe back",
    st().coursesShown === all && iso().getAttribute("aria-pressed") === "false",
    `shown=${st().coursesShown}`);

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (ok || why === undefined ? "" : "  — " + why));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
