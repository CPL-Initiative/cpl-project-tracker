// SkyView — where a carried course LANDS.
//
// Sam, 2026-09-07: "courses no longer responsive after 2nd drag and drop (e.g.,
// intro to welding — tried to drag a selected [course] into to welding and
// processes and no go)."
//
// ⭐ THE FAILURE MODE THIS FILE EXISTS FOR. When an identity is open its member
// courses ring it, and that ring SPREADS out over its neighbors. pick() gives
// the open identity's own stars absolute priority — right for READING (a star
// sitting inside a neighbor's circle is still the course the reader is pointing
// at) and wrong for MOVING: the destination circle a curator aims at is
// routinely eclipsed by one of those stars, the drop resolves to the identity
// the course is ALREADY in, and applyMove() refuses it as "That course is
// already there." in a hint at the foot of the window. Nothing moves and
// nothing visible says why, so the map reads as dead.
//
// Measured in Chromium 2026-09-07, Introduction to Welding open at 296%: six
// identity circles inside the viewport sat under one of its stars, and a drop
// on each of the first three moved nothing. The fixture below reproduces that
// geometry exactly — a second identity is placed ON one of the open identity's
// drawn stars — so the guard is the arrangement, not a coordinate.
//
// Run from repo root: `node tests/ccr_skyview_drop_target.test.js`.
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

// ── fixture: one discipline, two identities, one course each side ───────────
const U = {
  _generated_from: "fixture",
  counts: { identities: 2, stand_alone: 0, points: 2, orbiting: 0, orbiting_cross: 0, rim: 0, disciplines: 1,
            member_rows: 6, member_rows_all_identities: 6, described_courses: 0 },
  why_bits: { subject: 1, subj4: 2, title: 4, top: 8, units: 16, credit: 32 },
  bounds: { x0: -200, x1: 200, y0: -200, y1: 200 },
  islands: [
    { d: "Welding", sh: "welding", x: 0, y: 0, r: 90, n: 2, sa: 0, al: 0, p: [
      { i: "WELD M1109", x: 0,  y: 0,  t: "Introduction to Welding",            n: 5, s: 0, f: 0, r: 0, u: 2 },
      { i: "WELD M1106", x: 40, y: 40, t: "Introduction to the Welding Processes", n: 1, s: 0, f: 0, r: 0, u: 3 },
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
    window.fetch = () => Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
  },
});
const w = dom.window, d = w.document;
const q = (s) => d.querySelector(s);
const st = () => w.__ccrUniverseState();
const pointer = (type, x, y) => q("#u-cvs").dispatchEvent(
  new w.MouseEvent(type, { clientX: x, clientY: y, bubbles: true, button: 0 }));
const tick = () => new Promise((r) => setTimeout(r, 0));
// jsdom reports every rectangle as 0, so the client falls back to 960 × 600 —
// the canvas centre is (480, 300) and every screen coordinate below is exact.
const CX = 480, CY = 300;

(async () => {
  await new Promise((r) => { if (d.readyState === "complete") r(); else w.addEventListener("load", r); });
  await tick();
  const PU = w.CPL_CCR_UNIVERSE;
  const NODE = (id) => { for (const I of PU.islands) for (const p of I.p) if (p.i === id) return p; return null; };
  const AT = (id) => { const p = NODE(id); return [p.x, p.y]; };
  const K = 3;
  const scr = (id) => { const p = NODE(id); return [(p.x + st().view.x) * K + CX, (p.y + st().view.y) * K + CY]; };

  w.__ccrUniverse({ solo: true });
  await tick();
  w.__ccrUniverseFly(AT("WELD M1109")[0], AT("WELD M1109")[1], K);
  pointer("pointerdown", CX, CY); pointer("pointerup", CX, CY);        // open WELD M1109
  await tick();
  check("(1) the open identity rings itself with its college courses",
    st().sel === "WELD M1109" && st().memberPoints === 5, `${st().sel} / ${st().memberPoints}`);

  // ⭐ Put the OTHER identity exactly under one of the drawn stars. This is the
  // arrangement Chromium found on the live corpus; building it rather than
  // hunting for it is what keeps the guard from depending on a layout.
  const star = w.__ccrMemberPoints()[0];
  const B = NODE("WELD M1106");
  B.x = (star.x - CX) / K - st().view.x;
  B.y = (star.y - CY) / K - st().view.y;
  w.__ccrUniverseFly(AT("WELD M1109")[0], AT("WELD M1109")[1], K);     // redraw at the same view
  const [bx, by] = scr("WELD M1106");
  check("(2) the fixture reproduces the eclipse: a neighbour's circle sits under the open identity's star",
    Math.abs(bx - star.x) < 0.5 && Math.abs(by - star.y) < 0.5,
    `circle ${bx.toFixed(1)},${by.toFixed(1)} vs star ${star.x.toFixed(1)},${star.y.toFixed(1)}`);

  // ── reading is UNCHANGED: the star still wins a hover and a click ─────────
  // The S236 ruling this must not undo — with the pointer on a drawn star,
  // 110 of 120 used to return the identity card instead of the course.
  pointer("pointermove", star.x, star.y);
  const tip = q("#u-tip");
  check("(3) ⭐ hovering the eclipsed point still names the COLLEGE COURSE, not the circle beneath it",
    !tip.hidden && new RegExp(star.code).test(tip.textContent) && /under WELD M1109/.test(tip.textContent),
    tip.textContent);

  // ── moving is FIXED: the drop lands on the circle ─────────────────────────
  const before = st().moves.length;
  const mv = q("#u-detail ul.mlist > li .mv");
  check("(4) the panel offers the carried course a Drag… button", !!mv);
  mv.dispatchEvent(new w.MouseEvent("pointerdown", { bubbles: true, button: 0 }));
  check("(5) pressing Drag… picks the course up", st().carrying === mv.dataset.code, String(st().carrying));
  pointer("pointermove", star.x, star.y);
  check("(6) ⭐ the carry NAMES the identity the release would write to — a curator can see it land",
    st().dropTarget === "WELD M1106", String(st().dropTarget));
  pointer("pointerup", star.x, star.y);
  const last = st().moves[st().moves.length - 1];
  check("(7) ⭐ THE BUG: a drop on a circle eclipsed by the open identity's own star lands on the CIRCLE",
    st().moves.length === before + 1 && last && last.to === "WELD M1106",
    `moves ${before}→${st().moves.length} ${JSON.stringify(last)}`);
  check("(8) …and it is not silently refused as already-there",
    !/already there/i.test(q("#u-hint").textContent), q("#u-hint").textContent);

  // ── the receipt must not name a pane the reader cannot see ────────────────
  // #u-writes lives in #u-below, and body.u-solo — SkyView, the default — hides
  // that whole pane. Telling a curator their move is "below the map" when there
  // is no below is the same as telling them nothing happened.
  check("(9) ⭐ in SkyView-alone the receipt says the move is staged here, not 'below the map'",
    st().solo && /staged in this browser/i.test(q("#u-hint").textContent) &&
    !/below the map\./i.test(q("#u-hint").textContent), q("#u-hint").textContent);
  w.__ccrUniverse({ solo: false });
  await tick();
  q("#u-cvs").dispatchEvent(new w.MouseEvent("pointerdown", { clientX: CX, clientY: CY, bubbles: true, button: 0 }));
  q("#u-cvs").dispatchEvent(new w.MouseEvent("pointerup", { clientX: CX, clientY: CY, bubbles: true, button: 0 }));
  await tick();
  const mv2 = q("#u-detail ul.mlist > li .mv");
  mv2.dispatchEvent(new w.MouseEvent("pointerdown", { bubbles: true, button: 0 }));
  const [b2x, b2y] = scr("WELD M1106");
  pointer("pointerup", b2x, b2y);
  check("(10) …and in the comprehensive view, where the pane IS painted, it still points at it",
    /below the map/i.test(q("#u-hint").textContent), q("#u-hint").textContent);

  // ── a drop that lands on nothing still says so ────────────────────────────
  const before2 = st().moves.length;
  const mv3 = q("#u-detail ul.mlist > li .mv");
  mv3.dispatchEvent(new w.MouseEvent("pointerdown", { bubbles: true, button: 0 }));
  pointer("pointermove", CX, CY + 900);
  check("(11) over empty ground the carry names no destination", st().dropTarget === null, String(st().dropTarget));
  pointer("pointerup", CX, CY + 900);
  check("(12) a drop on empty ground moves nothing and says so",
    st().moves.length === before2 && /empty space/i.test(q("#u-hint").textContent), q("#u-hint").textContent);

  // ── the row that records a move has to READ on the canvas it sits on ──────
  // Sam, 2026-09-07: "Merged courses on side view have white background and
  // shouldn't." `.mlist li.moved` hardcoded a light green, so on the dark
  // canvas a re-homed course rendered near-white under near-white text — in the
  // one place a curator reads their own work back. The guard below is the CLASS,
  // not the instance: any rule that paints a raw hex background and has no
  // `body.u-dark` counterpart is the same defect waiting to be re-typed.
  const css = tpl.slice(tpl.indexOf("<style"), tpl.indexOf("</style>")).replace(/\/\*[\s\S]*?\*\//g, "");
  // Split on the closing brace: a chunk is "…{selector{declarations", so the
  // last "{" separates the two and any @media wrapper falls away with the rest.
  const rules = css.split("}").map((chunk) => {
    const j = chunk.lastIndexOf("{");
    if (j < 0) return null;
    return { sel: chunk.slice(0, j).split("{").pop().trim(), decls: chunk.slice(j + 1) };
  }).filter(Boolean);
  const dark = new Set();
  rules.forEach((r) => r.sel.split(",").forEach((sel) => {
    sel = sel.trim();
    if (/^body\.u-dark/.test(sel)) dark.add(sel.replace(/^body\.u-dark\s*/, ""));
  }));
  const stranded = [];
  rules.forEach((r) => {
    if (!/background(-color)?:\s*#[0-9A-Fa-f]{3,8}/.test(r.decls)) return;
    r.sel.split(",").map((x) => x.trim()).forEach((sel) => {
      if (!sel || /^body\.u-dark/.test(sel) || dark.has(sel)) return;
      stranded.push(sel);
    });
  });
  check("(13) ⭐ no rule paints a raw hex background with no dark-canvas counterpart",
    stranded.length === 0, stranded.join(" · "));
  check("(14) the moved row takes its background from a token, in both themes",
    /\.mlist li\.moved\{[^}]*background:var\(--row-moved\)/.test(css) &&
    /\.orbits li\.moved\{[^}]*background:var\(--row-moved\)/.test(css) &&
    /:root\{[\s\S]*?--row-moved:#[0-9A-Fa-f]{6}[\s\S]*?\}/.test(css) &&
    /body\.u-dark\{[\s\S]*?--row-moved:#[0-9A-Fa-f]{6}[\s\S]*?\}/.test(css));
  done();
})().catch((e) => { console.error(e); process.exit(1); });
