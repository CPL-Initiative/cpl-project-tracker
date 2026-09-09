// SkyView — pinch to zoom (Sam, 2026-09-09: "Also need to be able to zoom in
// out using pinch on mobile").
//
// ⚠️ IT WAS NOT MERELY MISSING, IT WAS WORSE THAN MISSING, and that is what
// these checks are written against. Measured in Chromium at 390x844 before the
// fix: a 5x two-finger spread left the zoom readout on "188° across" for all
// eight frames. The canvas carries touch-action:none, so the browser's own
// pinch is off; nothing in the handler read a second pointer; and pointerdown
// set `drag` UNCONDITIONALLY, so the second finger replaced the first one's
// grab and both fingers then fed the same pan. Two fingers did not zoom — they
// fought over the turn.
//
// ⚠️ WHAT EACH CHECK ACTUALLY CATCHES — established by REVERTING each line and
// re-running, not by reading the code. The repo has shipped checks that could
// not fail (handoff 247), so the mapping is written down rather than assumed:
//   · (3)(5)(8)  the pinch start (`pinch={d:ptSpan(open)}`). Removing it leaves
//     the zoom untouched by a 5x spread — the pre-fix behavior exactly.
//   · (6)  the pointerup early return, which is what calls endPinch(). Removing
//     it strands `pinch` truthy forever, so pointermove returns early on every
//     later move and ONE finger stops panning. That is the loud symptom.
//   · (7)  the pointercancel handler. The OS takes a pointer away on a system
//     gesture or a palm rejection and never sends pointerup, so the phantom
//     sits in the registry for the life of the page and the next single-finger
//     drag counts two.
//   · ⭐ (4)(11)  the SELECTION guard, which is defended TWICE on purpose —
//     `drag=null` at the pinch start and `drag=null` in the pointerup return.
//     Either alone holds, so neither single revert fails these two; removing
//     BOTH selects WELD M1002 on the wide release and WELD M1001 on the small
//     one. That redundancy is deliberate: a pinch must never leave the reader
//     on a course they did not choose, and the cost of the second belt is a
//     line. Do not "simplify" one away on the grounds that a test still passes.
//
// Declared on the flat map (CPL_SKYVIEW_OPENS) so the assertion can read
// view.k directly; zoomAt() is ONE function serving both projections, so the
// sphere reaches the same code with sph.half in place of view.k.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.dirname(__dirname);
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

function pts(prefix, x, y) {
  return [
    { i: `${prefix} M1001`, x: x, y: y, t: "Welding Practice", n: 3, s: 0, f: 0, r: 0, u: 3, c: 0, e: 1 },
    { i: `${prefix} M1002`, x: x + 4, y: y, t: "Art History", n: 3, s: 0, f: 0, r: 0, u: 3, c: 0, e: 0 },
  ];
}
const U = {
  _generated_from: "fixture",
  counts: { identities: 2, stand_alone: 0, points: 2, orbiting: 0, orbiting_cross: 0, rim: 0, disciplines: 1 },
  why_bits: { subject: 1, subj4: 2, title: 4, top: 8, units: 16, credit: 32 },
  bounds: { x0: -100, x1: 100, y0: -100, y1: 100 },
  islands: [{ d: "Welding", sh: "welding", x: 0, y: 0, r: 60, n: 2, sa: 0, al: 0, p: pts("WELD", -8, 0) }],
};
const MEM = { colleges: ["Alpha College"],
  counts: { identities: 2, members: 2, dropped_no_key: 0, cn_on_multiple_identities: 0 }, m: {} };
U.islands[0].p.forEach((nd, k) => { MEM.m[nd.i] = [[100000 + k, `WELD ${k}`, 0]]; });
const ATLAS = { _generated_from: "fixture",
  totals: { decision_components: 0, identities_inbrowser: 2, suggestion_groups: 0, member_rows: 2 },
  disciplines: [{ name: "Welding", decisions: 0, ids: 2, members: 2, flagged: 0, reviewed: 0 }], detail: {} };

const tpl = fs.readFileSync(path.join(ROOT, "prototype/ccr_atlas_v1.html"), "utf8");
const ujs = fs.readFileSync(path.join(ROOT, "prototype/ccr_universe.js"), "utf8");
const safe = (o) => JSON.stringify(o).replace(/<\//g, "<\\/");
const html = tpl.replace("__DATA__", safe(ATLAS)).replace("__GRAPHJS__", "")
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

/* jsdom has no PointerEvent constructor in every version we run against, and
 * addEventListener("pointerdown") fires for any event of that TYPE whatever its
 * class — so a MouseEvent carrying a pointerId is the portable way to say
 * "finger 2". clientX/clientY come through unchanged, which is all the handler
 * reads besides the id. */
function finger(type, id, x, y) {
  const e = new w.MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true });
  Object.defineProperty(e, "pointerId", { value: id });
  return e;
}

(async () => {
  await new Promise((r) => { if (d.readyState === "complete") r(); else w.addEventListener("load", r); });
  await tick(); await tick();

  const cvs = q("#u-cvs");
  check("(1) the map is on screen", !!cvs, "no #u-cvs");
  check("(2) it opened on the flat map, so view.k is the zoom",
    st().proj === "map", `proj=${st().proj}`);

  // ── a spread ──────────────────────────────────────────────────────────────
  const k0 = st().view.k;
  cvs.dispatchEvent(finger("pointerdown", 1, 470, 300));
  cvs.dispatchEvent(finger("pointerdown", 2, 490, 300));
  for (let i = 1; i <= 8; i++) {
    cvs.dispatchEvent(finger("pointermove", 1, 480 - (10 + i * 20), 300));
    cvs.dispatchEvent(finger("pointermove", 2, 480 + (10 + i * 20), 300));
  }
  const kSpread = st().view.k;
  check("(3) ⭐ two fingers spreading ZOOM IN — the whole ask",
    kSpread > k0 * 1.5, `k ${k0} -> ${kSpread}`);

  cvs.dispatchEvent(finger("pointerup", 1, 310, 300));
  cvs.dispatchEvent(finger("pointerup", 2, 650, 300));
  await tick();
  check("(4) the release of a WIDE pinch selects nothing", st().sel === null, `sel=${st().sel}`);

  // ── a squeeze ─────────────────────────────────────────────────────────────
  cvs.dispatchEvent(finger("pointerdown", 1, 310, 300));
  cvs.dispatchEvent(finger("pointerdown", 2, 650, 300));
  for (let i = 8; i >= 1; i--) {
    cvs.dispatchEvent(finger("pointermove", 1, 480 - (10 + i * 20), 300));
    cvs.dispatchEvent(finger("pointermove", 2, 480 + (10 + i * 20), 300));
  }
  const kSqueeze = st().view.k;
  check("(5) …and squeezing zooms back out", kSqueeze < kSpread * 0.8,
    `k ${kSpread} -> ${kSqueeze}`);
  cvs.dispatchEvent(finger("pointerup", 1, 470, 300));
  cvs.dispatchEvent(finger("pointerup", 2, 490, 300));
  await tick();

  // ── one finger still pans ─────────────────────────────────────────────────
  w.__ccrSetMode("pan");
  const before = { x: st().view.x, y: st().view.y };
  cvs.dispatchEvent(finger("pointerdown", 1, 400, 300));
  cvs.dispatchEvent(finger("pointermove", 1, 500, 340));
  cvs.dispatchEvent(finger("pointerup", 1, 500, 340));
  await tick();
  check("(6) ONE finger still pans — the registry did not break the single drag",
    st().view.x !== before.x || st().view.y !== before.y,
    `view ${before.x},${before.y} -> ${st().view.x},${st().view.y}`);

  // ── the phantom finger ────────────────────────────────────────────────────
  // A touch the OS takes away: pointerdown, then pointercancel and NO pointerup.
  cvs.dispatchEvent(finger("pointerdown", 7, 400, 300));
  cvs.dispatchEvent(finger("pointercancel", 7, 400, 300));
  await tick();
  const kBefore = st().view.k;
  const p2 = { x: st().view.x, y: st().view.y };
  cvs.dispatchEvent(finger("pointerdown", 8, 400, 300));
  cvs.dispatchEvent(finger("pointermove", 8, 520, 300));
  cvs.dispatchEvent(finger("pointerup", 8, 520, 300));
  await tick();
  check("(7) ⭐ a CANCELLED touch leaves no phantom finger — the next single " +
        "drag pans and does not pinch",
    st().view.k === kBefore && (st().view.x !== p2.x || st().view.y !== p2.y),
    `k ${kBefore} -> ${st().view.k}; view ${p2.x},${p2.y} -> ${st().view.x},${st().view.y}`);

  // ── ⭐ THE SMALL PINCH ─ the check (4) could not make ───────────────
  // (4) passes with the fix REVERTED, because a wide spread moves each finger
  // far enough to set drag.moved and the click branches decline on their own.
  // The early return only earns its place on a pinch that barely travels — two
  // fingers resting on a point and squeezing a little — where drag.moved stays
  // false and the second pointerup WOULD have selected whatever was under it.
  // So this proves the coordinate is a live target first, then pinches on it.
  q("#u-reset").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  await tick();
  const nd = U.islands[0].p[0], v = st().view;
  const sx = (nd.x + v.x) * v.k + 480, sy = (nd.y + v.y) * v.k + 300;

  cvs.dispatchEvent(finger("pointerdown", 11, sx, sy));
  cvs.dispatchEvent(finger("pointerup", 11, sx, sy));
  await tick();
  check("(9) one finger on that point DOES select it — the target is live",
    st().sel === nd.i, `sel=${st().sel}, wanted ${nd.i} at ${Math.round(sx)},${Math.round(sy)}`);

  cvs.dispatchEvent(finger("pointerdown", 12, 40, 560));      // empty ground
  cvs.dispatchEvent(finger("pointerup", 12, 40, 560));
  await tick();
  check("(10) a tap on empty ground clears it", st().sel === null, `sel=${st().sel}`);

  cvs.dispatchEvent(finger("pointerdown", 13, sx - 6, sy));
  cvs.dispatchEvent(finger("pointerdown", 14, sx + 6, sy));
  cvs.dispatchEvent(finger("pointermove", 13, sx - 5, sy));   // barely travels:
  cvs.dispatchEvent(finger("pointermove", 14, sx + 5, sy));   // drag.moved stays false
  cvs.dispatchEvent(finger("pointerup", 13, sx - 5, sy));
  cvs.dispatchEvent(finger("pointerup", 14, sx + 5, sy));
  await tick();
  check("(11) ⭐ a SMALL pinch on a live point still selects nothing",
    st().sel === null, `sel=${st().sel}`);

  // ── a carried course outranks a pinch ─────────────────────────────────────
  // Ruling 4's invariant: a carried course never sees a moving target, so a
  // stray second finger must not start a zoom underneath it.
  const src = fs.readFileSync(path.join(ROOT, "prototype/ccr_universe.js"), "utf8");
  const downBody = src.slice(src.indexOf('cvs.addEventListener("pointerdown"'));
  const carryAt = downBody.indexOf('drag.kind==="course"');
  const pinchAt = downBody.indexOf("pinch={d:ptSpan(open)}");
  check("(8) ⭐ the carried-course branch returns BEFORE a pinch can start",
    carryAt > -1 && pinchAt > -1 && carryAt < pinchAt,
    `carry@${carryAt} pinch@${pinchAt}`);

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (ok || why === undefined ? "" : "  — " + why));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
