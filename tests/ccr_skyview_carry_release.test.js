// SkyView — THE CARRY ENDS WHERE THE MOVE IS STAGED, BY WHATEVER ROUTE.
//
// Sam, 2026-09-07, after pressing Put back on a staged course: "Staged move
// seems to clear but I can't drag it to the new home."
//
// ⭐ THE FAILURE MODE THIS FILE EXISTS FOR. Picking a course up sets `drag`;
// putting it down has to clear it. The CANVAS paths did (pointerup on a circle,
// Esc). The PANEL paths did not: a click on a destination, "Move here", and
// Accept all went straight to applyMove, which staged the move and returned
// with `drag` still holding the course. Nothing on screen said the reader was
// still carrying anything — and because the pick-up handlers refuse to start a
// second carry while one is live, EVERY "Drag…" button in the panel became a
// silent no-op from that moment on. The course could be Put back, and then
// never moved anywhere again, for the rest of the session.
//
// The release belongs in applyMove because that is the one place every route
// meets. It sits AFTER the gates on purpose: a refused move (a shared key, or
// a destination the course already sits on) returns with the carry intact, so
// the reader can choose another destination without picking the course up
// again.
//
// Run from repo root: `node tests/ccr_skyview_carry_release.test.js`.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.dirname(__dirname);
const results = [];
const check = (name, cond, why) => results.push([name, !!cond, why]);
const done = () => {
  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
};

// ── fixture: one discipline, two identities, courses on the first ────────────
const U = {
  _generated_from: "fixture",
  counts: { identities: 2, stand_alone: 0, points: 2, orbiting: 0, orbiting_cross: 0, rim: 0, disciplines: 1,
            member_rows: 6, member_rows_all_identities: 6, described_courses: 0 },
  why_bits: { subject: 1, subj4: 2, title: 4, top: 8, units: 16, credit: 32 },
  bounds: { x0: -200, x1: 200, y0: -200, y1: 200 },
  islands: [
    { d: "Welding", sh: "welding", x: 0, y: 0, r: 90, n: 2, sa: 0, al: 0, p: [
      { i: "WELD M1109", x: 0,  y: 0, t: "Introduction to Welding",               n: 5, s: 0, f: 0, r: 0, u: 2 },
      { i: "WELD M1106", x: 60, y: 0, t: "Introduction to the Welding Processes", n: 1, s: 0, f: 0, r: 0, u: 3 },
    ] },
  ],
};
const MEM = {
  colleges: ["American River College", "Barstow Community College", "Chabot College", "Glendale Community College"],
  counts: { identities: 2, members: 6, dropped_no_key: 0, cn_on_multiple_identities: 0 },
  m: {
    "WELD M1109": [[300, "WELD 300", 0], [50, "WELD 50A", 1], [70, "WELD 70", 2], [117, "WELD 117", 3], [205, "WELD 205", 0]],
    "WELD M1106": [[901, "WELD 901", 1]],
  },
};
const ATLAS = { _generated_from: "fixture", totals: { decision_components: 0, identities_inbrowser: 2,
                suggestion_groups: 0, member_rows: 6 },
                disciplines: [{ name: "Welding", decisions: 0, ids: 2, members: 6, flagged: 0, reviewed: 0 }], detail: {} };

const tpl = fs.readFileSync(path.join(ROOT, "prototype/ccr_atlas_v1.html"), "utf8");
const ujs = fs.readFileSync(path.join(ROOT, "prototype/ccr_universe.js"), "utf8");
const safe = (o) => JSON.stringify(o).replace(/<\//g, "<\\/");
const html = tpl.replace("__DATA__", safe(ATLAS)).replace("__GRAPHJS__", "")
  .replace("__ESLDATA__", "null").replace("__ESLJS__", "")
  .replace("__UNIVDATA__", safe(U)).replace("__UNIVMEM__", safe(MEM)).replace("__UNIVJS__", ujs);

// ⚠️ A fake canvas needs every method the draw path calls, `rect` and `clip`
// included — a missing one leaves setProj half done and reads as a state bug.
function fakeCtx() {
  const noop = () => {};
  const c = { setTransform: noop, clearRect: noop, fillRect: noop, beginPath: noop, arc: noop, fill: noop,
           closePath: noop, rect: noop, clip: noop, createRadialGradient: () => ({ addColorStop: noop }),
           moveTo: noop, lineTo: noop, restore: noop, save: noop, setLineDash: noop, stroke: noop,
           strokeText: noop, fillText: noop, measureText: (t) => ({ width: String(t).length * 6 }),
           drawImage: noop, createImageData: null, putImageData: noop,
           fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "", textBaseline: "", globalAlpha: 1 };
  return c;
}
const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true,
  url: "https://example.org/prototype/skyview.html",
  beforeParse(window) {
    window.CPL_SKYVIEW_OPENS = "map";   // this suite drives the flat map; the carry is the same on the sphere
    window.HTMLCanvasElement.prototype.getContext = function () { return fakeCtx(); };
    window.fetch = () => Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
  },
});
const w = dom.window, d = w.document;
const q = (s) => d.querySelector(s);
const qa = (s) => Array.prototype.slice.call(d.querySelectorAll(s));
const st = () => w.__ccrUniverseState();
const pointer = (type, x, y) => q("#u-cvs").dispatchEvent(
  new w.MouseEvent(type, { clientX: x, clientY: y, bubbles: true, button: 0 }));
const tick = () => new Promise((r) => setTimeout(r, 0));
const CX = 480, CY = 300;
const hint = () => (q("#u-hint") ? q("#u-hint").textContent : "");
// The one observable that says a carry is live: the hint the pick-up writes.
const carrying = () => /Carrying/i.test(hint());

(async () => {
  await new Promise((r) => { if (d.readyState === "complete") r(); else w.addEventListener("load", r); });
  await tick();
  const PU = w.CPL_CCR_UNIVERSE;
  const NODE = (id) => { for (const I of PU.islands) for (const p of I.p) if (p.i === id) return p; return null; };
  const AT = (id) => { const p = NODE(id); return [p.x, p.y]; };
  const K = 3;

  w.__ccrUniverse({ solo: true });
  await tick();
  w.__ccrUniverseFly(AT("WELD M1109")[0], AT("WELD M1109")[1], K);
  pointer("pointerdown", CX, CY); pointer("pointerup", CX, CY);        // open the origin
  await tick();
  check("(1) the origin opens with its college courses and nothing staged",
    st().sel === "WELD M1109" && st().moves.length === 0 && !carrying(),
    `${st().sel} / ${st().moves.length} / ${hint().slice(0, 60)}`);

  // ── carry a course and complete the move FROM THE PANEL (a destination click) ──
  const mv = q('#u-detail ul.mlist > li .mv');
  const cn = mv.dataset.cn, code = mv.dataset.code;
  mv.dispatchEvent(new w.MouseEvent("click", { bubbles: true, button: 0 }));
  await tick();
  check("(2) clicking Drag… starts the carry", carrying(), hint().slice(0, 80));

  const go = qa("#u-detail [data-go]").filter((b) => b.dataset.go !== "WELD M1109")[0];
  check("(3) the panel offers a destination while carrying", !!go);
  go.dispatchEvent(new w.MouseEvent("click", { bubbles: true, button: 0 }));
  await tick();
  check("(4) the move is staged from the panel",
    st().moves.length === 1 && st().moves[0].cn === cn, JSON.stringify(st().moves));
  check("(5) ⭐ and the carry is RELEASED — the reader is not still holding it",
    !carrying(), hint().slice(0, 90));

  // ── Put back, then move it somewhere: the bug Sam hit ────────────────────
  const pb = q("#u-detail [data-putback]");
  check("(6) Put back is offered at the origin", !!pb && pb.dataset.putback === cn);
  pb.dispatchEvent(new w.MouseEvent("click", { bubbles: true, button: 0 }));
  await tick();
  check("(7) Put back drops the staged move", st().moves.length === 0, JSON.stringify(st().moves));

  const mv2 = qa("#u-detail ul.mlist > li .mv").filter((b) => b.dataset.cn === cn)[0];
  check("(8) the course is draggable again at the origin", !!mv2, "no Drag… button for " + code);
  mv2.dispatchEvent(new w.MouseEvent("click", { bubbles: true, button: 0 }));
  await tick();
  check("(9) ⭐ IT CAN BE PICKED UP AGAIN — the regression Sam reported",
    carrying(), hint().slice(0, 90));

  const go2 = qa("#u-detail [data-go]").filter((b) => b.dataset.go !== "WELD M1109")[0];
  go2.dispatchEvent(new w.MouseEvent("click", { bubbles: true, button: 0 }));
  await tick();
  check("(10) ⭐ and it reaches its new home", st().moves.length === 1 && st().moves[0].cn === cn,
    JSON.stringify(st().moves));
  check("(11) the second carry is released too", !carrying(), hint().slice(0, 90));

  // ── a REFUSED move keeps the carry, so another destination can be chosen ──
  const pb2 = q("#u-detail [data-putback]");
  if (pb2) { pb2.dispatchEvent(new w.MouseEvent("click", { bubbles: true, button: 0 })); await tick(); }
  const mv3 = qa("#u-detail ul.mlist > li .mv").filter((b) => b.dataset.cn === cn)[0];
  mv3.dispatchEvent(new w.MouseEvent("click", { bubbles: true, button: 0 }));
  await tick();
  const home = qa("#u-detail [data-go]").filter((b) => b.dataset.go === "WELD M1109")[0];
  if (home) {
    home.dispatchEvent(new w.MouseEvent("click", { bubbles: true, button: 0 }));
    await tick();
    check("(12) a move onto the identity it already sits on is refused, carry intact",
      st().moves.length === 0 && carrying(), `${st().moves.length} / ${hint().slice(0, 70)}`);
  } else {
    check("(12) a move onto the identity it already sits on is refused, carry intact",
      carrying(), "no self destination offered; carry checked alone");
  }

  done();
})().catch((e) => { console.error(e); process.exit(1); });
