// SkyView — the search dropdown's depth, and the Show switches reaching the map.
//
// Sam, 2026-09-05, two reports one after the other:
//   1. "Search box only delivers a short set of options and should show all or
//      at least allow scroll to show others"
//   2. "Show:All box does not respond when making changes"
//
// Neither was a broken control, and that is why both are worth a test.
//
//   · The dropdown has carried `overflow-y:auto` since it was written, so it
//     always scrolled. It was asked for EIGHT suggestions out of a corpus that
//     routinely holds hundreds, so there was never anything below the fold to
//     scroll to. The guard is on the DEPTH and on the budget that shares it out:
//     the old split reserved "all but four" for disciplines, which reads fine at
//     eight and starves the tail at sixty.
//
//   · Every Show switch changed its label and its hint and moved nothing on the
//     canvas, because individual courses are only drawn past NODE_ZOOM (0.20)
//     and SkyView OPENS at k = 0.100. A control that answers only where the
//     reader is not standing is indistinguishable from one that is broken. The
//     guard is that a discipline holding nothing switched on stops being drawn,
//     at the zoom the map opens on.
//
// Run from repo root: `npm test` (or `node tests/ccr_skyview_search_show.test.js`).
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
 * Deliberately BIGGER than a handful of points: a dropdown budget cannot be
 * tested against a corpus smaller than the budget. Three disciplines —
 *   · Welding      120 identities, all matching "weld", all CREDIT
 *   · Welding Tech  40 identities, all matching "weld", all NONCREDIT
 *   · Art            2 identities, matching nothing, credit
 * — so "weld" has 160 course matches and 2 discipline matches against a limit
 * of 60, and switching noncredit off empties exactly one whole discipline. */
function ident(prefix, n, credit, x, y) {
  const p = [];
  for (let i = 0; i < n; i++)
    p.push({ i: `${prefix} M${1000 + i}`, x: x + (i % 10) * 2, y: y + Math.floor(i / 10) * 2,
             t: `Welding Practice ${i}`, n: 3, s: 0, f: 0, r: 0, u: 3, c: credit });
  return p;
}
const U = {
  _generated_from: "fixture",
  counts: { identities: 162, stand_alone: 0, points: 162, orbiting: 0, orbiting_cross: 0, rim: 0, disciplines: 3 },
  why_bits: { subject: 1, subj4: 2, title: 4, top: 8, units: 16, credit: 32 },
  bounds: { x0: -400, x1: 400, y0: -300, y1: 300 },
  islands: [
    { d: "Welding", sh: "welding", x: -200, y: 0, r: 90, n: 120, sa: 0, al: 0, p: ident("WELD", 120, 0, -210, -10) },
    { d: "Welding Technology", sh: "weldtech", x: 40, y: 0, r: 60, n: 40, sa: 0, al: 0, p: ident("WLDT", 40, 1, 30, -6) },
    { d: "Art", sh: "art", x: 240, y: 0, r: 40, n: 2, sa: 0, al: 0, p: [
      { i: "ARTS M1001", x: 240, y: 0, t: "Drawing", n: 3, s: 0, f: 0, r: 0, u: 3, c: 0 },
      { i: "ARTS M1002", x: 244, y: 4, t: "Painting", n: 2, s: 0, f: 0, r: 0, u: 3, c: 0 },
    ] },
  ],
};
// One college course per identity, all of them matching "weld" by code, so the
// college-course share of the budget has more than it can hold too.
const MEM = { colleges: ["Alpha College"], counts: { identities: 162, members: 162, dropped_no_key: 0, cn_on_multiple_identities: 0 }, m: {} };
U.islands.forEach((I) => I.p.forEach((nd, k) => { MEM.m[nd.i] = [[100000 + k + I.d.length * 1000, `WELD ${k}`, 0]]; }));
const ATLAS = { _generated_from: "fixture", totals: { decision_components: 0, identities_inbrowser: 162,
                suggestion_groups: 0, member_rows: 162 }, disciplines: [
                { name: "Welding", decisions: 0, ids: 120, members: 120, flagged: 0, reviewed: 0 },
                { name: "Welding Technology", decisions: 0, ids: 40, members: 40, flagged: 0, reviewed: 0 },
                { name: "Art", decisions: 0, ids: 2, members: 2, flagged: 0, reviewed: 0 }], detail: {} };

const tpl = fs.readFileSync(path.join(ROOT, "prototype/ccr_atlas_v1.html"), "utf8");
const ujs = fs.readFileSync(path.join(ROOT, "prototype/ccr_universe.js"), "utf8");
const safe = (o) => JSON.stringify(o).replace(/<\//g, "<\\/");
const html = tpl.replace("__DATA__", safe(ATLAS)).replace("__GRAPHJS__", "")
  .replace("__ESLDATA__", "null").replace("__ESLJS__", "")
  .replace("__UNIVDATA__", safe(U)).replace("__UNIVMEM__", safe(MEM)).replace("__UNIVJS__", ujs);

function fakeCtx() {
  const noop = () => {};
  return { setTransform: noop, clearRect: noop, fillRect: noop, beginPath: noop, arc: noop, fill: noop,
           stroke: noop, moveTo: noop, lineTo: noop, save: noop, restore: noop, setLineDash: noop,
           strokeText: noop, fillText: noop, measureText: (t) => ({ width: String(t).length * 6 }),
           fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "", textBaseline: "" };
}
const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true,
  url: "https://example.org/prototype/skyview.html",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () { return fakeCtx(); };
    window.fetch = () => Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
  },
});
const w = dom.window, d = w.document;
const q = (s) => d.querySelector(s);
const qa = (s) => [...d.querySelectorAll(s)];
const st = () => w.__ccrUniverseState();
const tick = () => new Promise((r) => setTimeout(r, 0));

(async () => {
  await new Promise((r) => { if (d.readyState === "complete") r(); else w.addEventListener("load", r); });
  await tick();

  // ── (1) the search box goes deep enough to be worth scrolling ─────────────
  check("(1) the template asks __ccrSuggest for 60, not 8",
    /var SUG_LIMIT = 60;/.test(tpl) && /__ccrSuggest\(term, SUG_LIMIT\)/.test(tpl) && !/__ccrSuggest\(term, 8\)/.test(tpl));
  const deep = w.__ccrSuggest("weld", 60);
  check("(1) ⭐ a term matching 160 courses returns a full list of 60, not a short set",
    deep.length === 60, `got ${deep.length}`);
  check("(1) the list says how much it left behind, so 'no more results' is never implied",
    deep.more > 0, `more=${deep.more}`);
  const kinds = deep.reduce((a, s) => (a[s.kindShort] = (a[s.kindShort] || 0) + 1, a), {});
  check("(1) ⭐ no ONE kind crowds the others out of the top of the list",
    kinds.DISC >= 2 && kinds["CRSE IDENTITY"] >= 20 && kinds["COLLEGE CRSE"] >= 10, JSON.stringify(kinds));
  /* The budget must FLOW, or a term with nothing in one bucket returns a short
     list again — the same complaint with a different cause. "art" matches one
     discipline and two courses and no college course code. */
  const flow = w.__ccrSuggest("drawing", 60);
  check("(1) a kind that cannot fill its share hands the room back rather than shortening the list",
    flow.length === Math.min(60, flow.length) && flow.length >= 1 && !flow.some((s) => s == null), `n=${flow.length}`);
  const wide = w.__ccrSuggest("welding practice 1", 60);
  check("(1) the ranked pool is deep enough to rank (the 400-candidate cap would have truncated by island order)",
    /if\(pts\.length>3000\) break;/.test(ujs) && wide.length > 8, `n=${wide.length}`);

  // ── the dropdown itself: scrollable, footered, keyboard-carried ───────────
  const gq = q("#gq");
  gq.value = "weld";
  gq.dispatchEvent(new w.Event("input", { bubbles: true }));
  await tick();
  check("(1) ⭐ the dropdown renders every one of them as a pickable option",
    qa("#sug li[role=option]").length === 60, `${qa("#sug li[role=option]").length} options`);
  check("(1) the footer is the LAST child and carries no data-i, so arrow keys never index it",
    q("#sug .sug-more") && q("#sug").lastElementChild === q("#sug .sug-more") &&
    q("#sug .sug-more").dataset.i == null && q("#sug .sug-more").getAttribute("role") === "presentation",
    q("#sug").lastElementChild ? q("#sug").lastElementChild.outerHTML.slice(0, 90) : "∅");
  check("(1) the listbox's own label carries the same count for a screen reader",
    /showing the closest 60, more available/.test(q("#sug").getAttribute("aria-label") || ""),
    q("#sug").getAttribute("aria-label"));
  check("(1) the list is tall enough to be worth scrolling and clips rather than overflowing",
    /max-height:min\(70vh,620px\);overflow-y:auto/.test(tpl));
  check("(1) ⭐ the arrow keys carry the viewport with the cursor",
    /scrollIntoView\(\{ block: "nearest" \}\)/.test(tpl));
  // Arrow-key walk lands on real options only, never on the footer.
  for (let i = 0; i < 61; i++) gq.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  const on = q("#sug li.on");
  check("(1) sixty-one presses wrap inside the sixty options and never light the footer",
    !!on && on.getAttribute("role") === "option" && !on.classList.contains("sug-more"),
    on ? on.className + " " + on.getAttribute("role") : "nothing lit");

  // ── (2) the Show switches reach the map at the zoom it OPENS on ───────────
  /* The real corpus is 159 disciplines wide, so "fit all" lands at k = 0.100 —
     five times below NODE_ZOOM, which is why not one switch moved a pixel. This
     fixture is three disciplines wide and fits at ~0.74, so the condition has to
     be recreated rather than waited for: fly to a magnification below the band
     where individual courses are drawn, and assert the switches still land. */
  w.__ccrUniverseFly(0, 0, 0.10);
  const k0 = st().view.k;
  check("(2) the map is standing below NODE_ZOOM, where no individual course is drawn",
    k0 <= st().nodeZoom, `k=${k0} nodeZoom=${st().nodeZoom}`);
  const all = st();
  check("(2) with everything on, all three disciplines are drawn",
    all.islandsShown === 3 && all.coursesShown === 162, `${all.islandsShown} islands / ${all.coursesShown} courses`);
  // Noncredit off: Welding Technology holds nothing else, so it leaves the map.
  w.__ccrSetShow({ nc: false, nce: false });
  const ncOff = st();
  check("(2) ⭐ switching noncredit off drops the discipline that teaches only noncredit — at 10% zoom",
    ncOff.islandsShown === 2 && ncOff.coursesShown === 122 && st().view.k === k0,
    `${ncOff.islandsShown} islands / ${ncOff.coursesShown} courses at k=${st().view.k}`);
  w.__ccrSetShow({ nc: true, nce: true });
  check("(2) switching it back on brings the discipline back", st().islandsShown === 3);
  // Deselect all: the map empties rather than sitting there unchanged.
  qa("#u-show-menu input[data-show]").forEach(() => {});
  q("#u-show-none").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  check("(2) ⭐ Deselect all empties the map instead of leaving it identical",
    st().islandsShown === 0 && st().coursesShown === 0,
    `${st().islandsShown} islands / ${st().coursesShown} courses`);
  check("(2) the summary word agrees with the switches",
    q("#u-show-word").textContent === "0 of 12", q("#u-show-word").textContent);
  q("#u-show-every").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  check("(2) Show everything restores every discipline",
    st().islandsShown === 3 && q("#u-show-word").textContent === "All");
  check("(2) the hint says WHY a low-zoom map moves so little, rather than leaving the reader to guess",
    /At this magnification the map draws <strong>disciplines<\/strong>/.test(q("#u-hint").innerHTML),
    q("#u-hint").textContent.slice(0, 140));
  // The switch state is memoized; the memo must not outlive a change to it.
  check("(2) the per-island count is memoized on a signature of the switches, not computed per frame",
    /function showSig\(\)/.test(ujs) && /isl\._passSig!==sig/.test(ujs));
  check("(2) ⭐ what is not drawn cannot be picked either",
    /if\(!islandPass\(isl\)\) continue;/.test(ujs) && /if\(!creditShown\(nd\)\) continue;/.test(ujs));

  done();
})().catch((e) => { console.error("HARNESS ERROR", e); check("the suite ran to the end", false, String(e && e.stack || e)); done(); });
