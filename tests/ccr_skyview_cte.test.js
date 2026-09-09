// SkyView — career technical (CTE) vs academic, as Show switches.
//
// Sam, 2026-09-09: "Need check boxes added to Show All drop down to show career
// technical ed (CTE) vs. academic. I think we have an indicator of that in our
// COCI dataset … I believe the TOP codes with an asterisk are all CTE."
//
// He is right, and this repo had already ruled it: CLAUDE.md's TOP caveat says
// TOP is unreliable for nearly everything, then names the CTE FLAG as one of
// only TWO places it is authoritative BY DEFINITION. The payload carries the
// verdict as `e` (1 CTE, 0 academic, ABSENT when the code does not resolve),
// read from the manual's asterisk in kb/reference/top_categories.json.
//
// ⭐ THE CHECK THAT MATTERS IS THE THIRD STATE. 15% of points on the real map
// (7,569 of 49,896) carry no resolvable TOP code. Folding those into "Academic"
// would assert something about every one of them that the data does not say —
// the same false-zero shape the credit block avoids with `unrec`. So absence
// gets its own switch, and the test below proves an unflagged point survives
// "academic off" and disappears only when its own switch is cleared.
const fs = require("fs");
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

  // ── the three switches exist, grouped, and start on ──────────────────────
  check("(1) the menu carries CTE, Academic and 'not recorded' switches",
    !!q('#u-show-menu input[data-show="cte"]') &&
    !!q('#u-show-menu input[data-show="aca"]') &&
    !!q('#u-show-menu input[data-show="ctena"]'));
  check("(2) they sit under one legend of their own",
    [...d.querySelectorAll("#u-show-menu legend")].some((l) => /career technical/i.test(l.textContent)),
    [...d.querySelectorAll("#u-show-menu legend")].map((l) => l.textContent).join(" | "));
  check("(3) every switch starts on, so the map opens complete",
    st().show.cte === true && st().show.aca === true && st().show.ctena === true);
  const all = st().coursesShown;
  check("(4) all three points are drawn to begin with", all === 3, `shown=${all}`);

  // ── each switch hides exactly its own state ──────────────────────────────
  setSwitch("cte", false); await tick();
  check("(5) CTE off hides only the career-technical point",
    st().coursesShown === 2, `shown=${st().coursesShown}`);
  setSwitch("cte", true); setSwitch("aca", false); await tick();
  check("(6) Academic off hides only the academic point",
    st().coursesShown === 2, `shown=${st().coursesShown}`);

  // ⭐ the reason this suite exists
  check("(7) ⭐ a point with NO CTE verdict SURVIVES 'Academic off' — absence is not academic",
    st().coursesShown === 2 && st().show.aca === false, `shown=${st().coursesShown}`);
  setSwitch("ctena", false); await tick();
  check("(8) ⭐ …and disappears only under its OWN switch",
    st().coursesShown === 1, `shown=${st().coursesShown}`);

  setSwitch("aca", true); setSwitch("ctena", true); await tick();
  check("(9) switching them back restores the map", st().coursesShown === 3, `shown=${st().coursesShown}`);

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (ok || why === undefined ? "" : "  — " + why));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
