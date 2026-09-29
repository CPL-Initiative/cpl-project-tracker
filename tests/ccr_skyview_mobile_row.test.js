// SkyView — the row on a narrow screen (Sam, 2026-09-09: "I'm thinking of the
// header toolbar on the tab … It now takes up half the screen").
//
// MEASURED IN CHROMIUM AT 390x844 BEFORE THE FIX: #u-top was 254px over four
// wrapped rows (30% of the viewport) and .u-foot another 430px — MORE than the
// header — so 81% of a screenful was not the map. After: header 114px, map
// 730px (86%). Desktop at 1440px is untouched (78px, the row intact).
//
// ⚠️ jsdom RETURNS ZEROES FOR EVERY RECTANGLE, so nothing here proves layout —
// `npm run a11y skyview` and the Chromium runs above do that. What this suite
// guards are the things that broke silently WHILE building it, each of which a
// layout run would only show as "looks a bit wrong":
//   · (7) the two breakpoints drifting apart — the CSS decides whether the
//     Controls word appears, NARROW_MAX decides whether the legend starts shut,
//     and a drift shows up as a legend folded on a screen with no way to
//     unfold it;
//   · (8) the specificity tie. `.u-top .u-ctl` is two classes and so is the
//     `.u-top .btn{display:inline-flex}` block further down the sheet — a tie
//     decided by source order, which that block wins. The desktop row grew a
//     word that opens something already open, and only a 1440px screenshot
//     showed it;
//   · ⭐ (9) fitCanvas's BRANCH ORDER. `window.innerWidth<700` used to win over
//     the solo test, so the map was pinned at 0.62 x the viewport by arithmetic
//     — 523px at 390x844, exactly the canvas that was there. Shrinking the
//     header could never have helped: the freed pixels had nowhere to go;
//   · ⭐ (10) the observer. fitCanvas ran while the row was still 393px tall,
//     wrote a 451px canvas and left it; the window never resizes on a phone, so
//     the resize listener could not correct it.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.dirname(__dirname);
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const U = {
  _generated_from: "fixture",
  counts: { identities: 1, stand_alone: 0, points: 1, orbiting: 0, orbiting_cross: 0, rim: 0, disciplines: 1 },
  why_bits: { subject: 1, subj4: 2, title: 4, top: 8, units: 16, credit: 32 },
  bounds: { x0: -100, x1: 100, y0: -100, y1: 100 },
  islands: [{ d: "Welding", sh: "welding", x: 0, y: 0, r: 60, n: 1, sa: 0, al: 0,
    p: [{ i: "WELD M1001", x: -8, y: 0, t: "Welding Practice", n: 3, s: 0, f: 0, r: 0, u: 3, c: 0, e: 1 }] }],
};
const MEM = { colleges: ["Alpha College"],
  counts: { identities: 1, members: 1, dropped_no_key: 0, cn_on_multiple_identities: 0 },
  m: { "WELD M1001": [[100000, "WELD 1", 0]] } };
const ATLAS = { _generated_from: "fixture",
  totals: { decision_components: 0, identities_inbrowser: 1, suggestion_groups: 0, member_rows: 1 },
  disciplines: [{ name: "Welding", decisions: 0, ids: 1, members: 1, flagged: 0, reviewed: 0 }], detail: {} };

const tplRaw = fs.readFileSync(path.join(ROOT, "prototype/ccr_atlas_v1.html"), "utf8");
const ujs = fs.readFileSync(path.join(ROOT, "prototype/ccr_universe.js"), "utf8");
const safe = (o) => JSON.stringify(o).replace(/<\//g, "<\\/");
const html = tplRaw.replace("__DATA__", safe(ATLAS)).replace("__GRAPHJS__", "")
  .replace("__ESLDATA__", "null").replace("__ESLJS__", "")
  .replace("__UNIVDATA__", safe(U)).replace("__UNIVMEM__", safe(MEM)).replace("__UNIVJS__", ujs);

function fakeCtx() {
  const noop = () => {};
  return { setTransform: noop, clearRect: noop, fillRect: noop, beginPath: noop, arc: noop, fill: noop,
           closePath: noop, createRadialGradient: () => ({ addColorStop: noop }), rect: noop, clip: noop,
           stroke: noop, moveTo: noop, lineTo: noop, save: noop, restore: noop, setLineDash: noop,
           strokeText: noop, fillText: noop, measureText: (t) => ({ width: String(t).length * 6 }),
           fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "", textBaseline: "" };
}

/* The narrow screen is SIMULATED at the one place the module asks about it —
 * matchMedia — because jsdom answers `matches:false` to everything and the
 * legend default is read once, at module load, before any test can intervene. */
const observed = [];
const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true,
  url: "https://example.org/prototype/skyview.html",
  beforeParse(window) {
    window.CPL_SKYVIEW_OPENS = "map";
    window.HTMLCanvasElement.prototype.getContext = function () { return fakeCtx(); };
    window.fetch = () => Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    const real = window.matchMedia;
    window.matchMedia = function (q) {
      const m = /max-width:\s*(\d+)px/.exec(String(q));
      if (m) return { matches: 390 <= Number(m[1]), media: q, addListener() {}, removeListener() {},
                      addEventListener() {}, removeEventListener() {} };
      return real ? real.call(window, q) : { matches: false, media: q, addListener() {}, removeListener() {},
                      addEventListener() {}, removeEventListener() {} };
    };
    window.ResizeObserver = function (cb) {
      this._cb = cb;
      this.observe = function (el) { observed.push(el && el.id); };
      this.unobserve = function () {};
      this.disconnect = function () {};
    };
    Object.defineProperty(window, "innerWidth", { value: 390, configurable: true });
  },
});
const w = dom.window, d = w.document;
const q = (s) => d.querySelector(s);
const tick = () => new Promise((r) => setTimeout(r, 0));
const click = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

(async () => {
  await new Promise((r) => { if (d.readyState === "complete") r(); else w.addEventListener("load", r); });
  await tick(); await tick();

  const ctl = q("#u-ctl"), bar = q("#u-bar"), full = q("#u-full");

  check("(1) the row carries a Controls door", !!ctl, "no #u-ctl");
  check("(2) it is a WORD, not a glyph", ctl && ctl.textContent.trim() === "Controls",
    ctl && JSON.stringify(ctl.textContent));
  check("(3) it names what it opens for a screen reader",
    ctl.getAttribute("aria-controls") === "u-bar" && ctl.getAttribute("aria-expanded") === "false",
    `aria-controls=${ctl.getAttribute("aria-controls")} expanded=${ctl.getAttribute("aria-expanded")}`);
  check("(4) ⭐ #u-bar keeps its place in the DOM — the fold is CSS, so every " +
        "handler and every paint* function is untouched",
    bar && bar.parentElement && bar.parentElement.id === "u-top" && d.querySelectorAll("#u-bar").length === 1,
    `parent=${bar && bar.parentElement && bar.parentElement.id}, count=${d.querySelectorAll("#u-bar").length}`);

  click(ctl); await tick();
  check("(5) opening it marks the section and the button together",
    full.classList.contains("u-ctls-on") && ctl.getAttribute("aria-expanded") === "true",
    `class=${full.className} expanded=${ctl.getAttribute("aria-expanded")}`);

  // A touch on the map puts it away — the sheet sits over the map's lower edge.
  const cvs = q("#u-cvs");
  const down = new w.MouseEvent("pointerdown", { clientX: 400, clientY: 300, bubbles: true, cancelable: true });
  Object.defineProperty(down, "pointerId", { value: 1 });
  cvs.dispatchEvent(down);
  const up = new w.MouseEvent("pointerup", { clientX: 400, clientY: 300, bubbles: true, cancelable: true });
  Object.defineProperty(up, "pointerId", { value: 1 });
  cvs.dispatchEvent(up);
  await tick();
  check("(6) a touch on the map puts the sheet away",
    !full.classList.contains("u-ctls-on") && ctl.getAttribute("aria-expanded") === "false",
    `class=${full.className}`);

  click(ctl); await tick();
  full.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await tick();
  check("(6b) Escape closes it too", !full.classList.contains("u-ctls-on"), full.className);

  // ── the legend starts shut on a narrow screen ─────────────────────────────
  const foot = q("#u-foot"), lt = q("#u-legend-toggle");
  check("(7a) ⭐ the legend starts FOLDED on a narrow screen — it is 430px, " +
        "more than the header it sits under",
    foot.classList.contains("u-foot-hidden") && lt.getAttribute("aria-expanded") === "false",
    `class=${foot.className} expanded=${lt.getAttribute("aria-expanded")}`);
  click(lt); await tick();
  check("(7b) …and the reader can still open it",
    !foot.classList.contains("u-foot-hidden") && lt.getAttribute("aria-expanded") === "true",
    foot.className);

  // ── the two breakpoints may not drift ─────────────────────────────────────
  const jsSrc = fs.readFileSync(path.join(ROOT, "prototype/ccr_universe.js"), "utf8");
  const css = tplRaw;
  const jsBp = /var NARROW_MAX=(\d+);/.exec(jsSrc);
  const cssBp = /@media \(max-width:(\d+)px\)\{\s*\n?\s*#u-top \.u-ctl\{display:inline-flex/.exec(css);
  check("(8) ⭐ NARROW_MAX and the stylesheet's breakpoint are the SAME number",
    !!jsBp && !!cssBp && jsBp[1] === cssBp[1],
    `js=${jsBp && jsBp[1]} css=${cssBp && cssBp[1]}`);

  check("(9) ⭐ the base hide rule is scoped to the ID — `.u-top .u-ctl` ties " +
        "with `.u-top .btn` and loses on source order",
    /(^|\n)#u-top \.u-ctl\{display:none\}/.test(css) && !/(^|\n)\.u-top \.u-ctl\{display:none\}/.test(css),
    "the base rule is not #u-top .u-ctl");

  // ── fitCanvas branch order ────────────────────────────────────────────────
  const fit = jsSrc.slice(jsSrc.indexOf("function fitCanvas()"), jsSrc.indexOf("function sizeCanvas()"));
  const soloAt = fit.indexOf('document.body.classList.contains("u-solo")');
  const narrowAt = fit.indexOf("window.innerWidth<700");
  check("(10) ⭐ fitCanvas tests SOLO before it tests narrow — the other order " +
        "pins the map at 0.62 of the viewport on every phone",
    soloAt > -1 && narrowAt > -1 && soloAt < narrowAt, `solo@${soloAt} narrow@${narrowAt}`);
  check("(10b) …and 0.62 is still there for the comprehensive view, which scrolls",
    /window\.innerHeight\s*\*\s*0\.62/.test(fit), "the comprehensive-view height went missing");

  // ── the observer ──────────────────────────────────────────────────────────
  check("(11) ⭐ the row's height is WATCHED — a resize listener never fires on " +
        "a phone, and fitCanvas ran before the row had settled",
    observed.indexOf("u-top") > -1 && observed.indexOf("u-foot") > -1,
    `observed=${JSON.stringify(observed)}`);

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (ok || why === undefined ? "" : "  — " + why));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
