// SkyView — the STAGED-TO-MOVE mark on a re-homed course (v4 item 7, the last
// open item of the governing review).
//
// Sam, 2026-09-06, after dragging a course onto another identity: "Now I'm
// moving it over here and it looks like it was moved over there. It didn't
// really change over here, which I would expect it to change and to give me a
// confirmation that it was moved and to change this outline to show it was
// staged to move."
//
// ⭐ THE FAILURE MODE THIS FILE EXISTS FOR. movedTo[cn] relocates a course —
// membersOf() returns it under the destination and drops it from the origin —
// and until 2026-09-07 nothing said "staged, not saved" on the course itself:
// the destination row read "moved here" (a done word), the origin lost a row
// with no trace, the identity labels and hovers said nothing, and the outline
// of record counted the course as if the move were real. The confirmation at
// the foot of the window (S237) was true and out of sight.
//
// The mark lives on the MODEL (stagedHere / stagedAwayFrom / stagedWords) and
// every view asks it, so the flat map and the sphere say the same words. This
// suite drives a real move on the drop-target fixture and reads each surface.
//
// Run from repo root: `node tests/ccr_skyview_staged_move.test.js`.
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

// ── fixture: one discipline, two identities, one course each side (the drop-target fixture) ──
const U = {
  _generated_from: "fixture",
  counts: { identities: 2, stand_alone: 0, points: 2, orbiting: 0, orbiting_cross: 0, rim: 0, disciplines: 1,
            member_rows: 6, member_rows_all_identities: 6, described_courses: 0 },
  why_bits: { subject: 1, subj4: 2, title: 4, top: 8, units: 16, credit: 32 },
  bounds: { x0: -200, x1: 200, y0: -200, y1: 200 },
  islands: [
    { d: "Welding", sh: "welding", x: 0, y: 0, r: 90, n: 2, sa: 0, al: 0, p: [
      { i: "WELD M1109", x: 0,  y: 0,  t: "Introduction to Welding",            n: 5, s: 0, f: 0, r: 0, u: 2 },
      { i: "WELD M1106", x: 60, y: 0,  t: "Introduction to the Welding Processes", n: 1, s: 0, f: 0, r: 0, u: 3 },
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

// The fake canvas RECORDS which stroke was dashed, so the ghost star's dashed
// spoke and outline are assertable — the one part of the mark jsdom can see.
const canvasLog = { dashed: 0, stars: 0, dashedStrokes: 0 };
function fakeCtx() {
  const noop = () => {};
  const c = { setTransform: noop, clearRect: noop, fillRect: noop, beginPath: noop, arc: noop, fill: noop,
           closePath: noop, createRadialGradient: () => ({ addColorStop: noop }),
           moveTo: noop, lineTo: noop, restore() { c._dash = false; }, save: noop,
           setLineDash(d) { c._dash = Array.isArray(d) && d.length > 0; if (c._dash) canvasLog.dashed++; },
           stroke() { if (c._dash) canvasLog.dashedStrokes++; },
           strokeText: noop, fillText: noop, measureText: (t) => ({ width: String(t).length * 6 }),
           fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "", textBaseline: "", _dash: false };
  return c;
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
const CX = 480, CY = 300;

(async () => {
  await new Promise((r) => { if (d.readyState === "complete") r(); else w.addEventListener("load", r); });
  await tick();
  const PU = w.CPL_CCR_UNIVERSE;
  const NODE = (id) => { for (const I of PU.islands) for (const p of I.p) if (p.i === id) return p; return null; };
  const AT = (id) => { const p = NODE(id); return [p.x, p.y]; };
  const K = 3;
  const scr = (id) => { const p = NODE(id); return [(p.x + st().view.x) * K + CX, (p.y + st().view.y) * K + CY]; };
  const text = (sel) => (q(sel) ? q(sel).textContent : "");

  w.__ccrUniverse({ solo: true });
  await tick();
  w.__ccrUniverseFly(AT("WELD M1109")[0], AT("WELD M1109")[1], K);
  pointer("pointerdown", CX, CY); pointer("pointerup", CX, CY);        // open WELD M1109 (the origin)
  await tick();
  check("(1) the origin opens with its five college courses and nothing staged",
    st().sel === "WELD M1109" && st().memberPoints === 5 && st().moves.length === 0 && !/staged/i.test(text("#u-detail")),
    `${st().sel} / ${st().memberPoints} / ${st().moves.length}`);

  // ── the move: press Drag… on WELD 300, drop it on the other identity ──────
  const mv = q('#u-detail ul.mlist > li .mv');
  const code = mv.dataset.code, cn = mv.dataset.cn;
  mv.dispatchEvent(new w.MouseEvent("pointerdown", { bubbles: true, button: 0 }));
  const [bx, by] = scr("WELD M1106");
  pointer("pointermove", bx, by);
  pointer("pointerup", bx, by);
  await tick();
  const last = st().moves[st().moves.length - 1];
  check("(2) the drop stages one move, from the origin to the destination, and remembers the course's home",
    st().moves.length === 1 && last && last.cn === cn && last.to === "WELD M1106" && last.from === "WELD M1109" && last.home === "WELD M1109",
    JSON.stringify(last));

  // ── the confirmation says STAGED, not moved ───────────────────────────────
  const hint = text("#u-hint");
  check("(3) the hint says the move is staged and not saved — never that the course \"moved\"",
    /Staged to move/.test(hint) && /not saved/.test(hint) && !/^\s*Moved /.test(hint), hint);
  check("(4) in SkyView the hint names where the record lives without pointing below the map",
    /listed under the map in the comprehensive view/.test(hint) && !/Recorded below the map/.test(hint), hint);

  // ── the ORIGIN: the course it lost is listed, named, and can be put back ──
  const panel = text("#u-detail");
  check("(5) ⭐ the origin's panel lists the course under \"Staged to move away\" with the destination's title and the words not saved",
    /Staged to move away \(1\)/.test(panel) && new RegExp(code).test(panel) &&
    /staged to move to Introduction to the Welding Processes — not saved/.test(panel), panel.slice(0, 400));
  check("(6) the staged-away row is not a member row (it cannot be dragged as one) and offers Put back",
    !!q('#u-detail li.away[data-cn="' + cn + '"]') && !q('#u-detail li.away .mv') && !!q('#u-detail li.away .putback'));
  check("(7) the origin no longer counts the course among its members",
    st().memberPoints === 4 || w.__ccrMemberPoints().filter((m) => !m.ghost && m.id === "WELD M1109").length === 4,
    String(st().memberPoints));
  const ghosts = w.__ccrMemberPoints().filter((m) => m.ghost);
  check("(8) ⭐ the origin's ring still DRAWS the course as a ghost star with the course code on it",
    ghosts.length === 1 && ghosts[0].id === "WELD M1109" && ghosts[0].code === code, JSON.stringify(ghosts));
  check("(9) the ghost is drawn dashed (its state survives grayscale)", canvasLog.dashedStrokes > 0, String(canvasLog));
  // hovering the ghost names the staged move, never the identity card
  pointer("pointermove", ghosts[0].x, ghosts[0].y);
  const tip = q("#u-tip");
  check("(10) hovering the ghost says the course is staged to move, where to, and that Put back undoes it",
    !tip.hidden && new RegExp(code).test(tip.textContent) && /staged to move to Introduction to the Welding Processes/.test(tip.textContent) &&
    /Put back/.test(tip.textContent), tip.textContent);

  // ── the model, asked directly (the one source every view reads) ──────────
  const S = st().staged;
  check("(11) the model answers for both ends: staged here at the destination, staged away from the origin",
    S.here(cn, "WELD M1106") && !S.here(cn, "WELD M1109") && S.awayFrom("WELD M1109").length === 1 && S.countHere("WELD M1106") === 1);
  check("(12) the words are written once: the destination's phrase and the origin's phrase",
    S.words(S.of(cn), "here") === "staged here — not saved" &&
    S.words(S.of(cn), "away") === "staged to move to Introduction to the Welding Processes — not saved");

  // ── the DESTINATION: the row says staged here, not \"moved here\" ──────────
  pointer("pointermove", 0, 0);
  const [dx, dy] = scr("WELD M1106");
  pointer("pointerdown", dx, dy); pointer("pointerup", dx, dy);          // open the destination
  await tick();
  const dpanel = text("#u-detail");
  check("(13) ⭐ the destination's row says \"staged here — not saved\" and never \"moved here\"",
    st().sel === "WELD M1106" && /staged here — not saved/.test(dpanel) && !/moved here/.test(dpanel), dpanel.slice(0, 300));
  check("(14) the staged row leads the destination's list",
    (q("#u-detail ul.mlist > li") || {}).getAttribute && q("#u-detail ul.mlist > li").getAttribute("data-cn") === cn);
  // the destination's own label and hover carry the count
  pointer("pointermove", dx, dy);
  check("(15) hovering the destination circle says a course is staged here, not saved",
    /1 course staged here, not saved/.test(q("#u-tip").textContent), q("#u-tip").textContent);
  // ── the outline of record counts the staged course as staged, not as a member ──
  const ol = w.__ccrOutlineHtml ? w.__ccrOutlineHtml("WELD M1106") : null;
  if (ol !== null) {
    check("(16) the outline's band says \"1 staged here — not saved\" beside the course count", /1 staged here — not saved/.test(ol), ol.slice(0, 300));
    const olo = w.__ccrOutlineHtml("WELD M1109");
    check("(17) the origin's outline says \"1 staged to move away — not saved\"", /1 staged to move away — not saved/.test(olo), olo.slice(0, 300));
  } else {
    check("(16) the outline's band words are exported for reading", false, "window.__ccrOutlineHtml is missing");
  }

  // ── Put back: the record is dropped and the course is home again ─────────
  pointer("pointermove", 0, 0);
  const [ox, oy] = scr("WELD M1109");
  pointer("pointerdown", ox, oy); pointer("pointerup", ox, oy);          // back to the origin
  await tick();
  const pb = q('#u-detail li.away .putback');
  check("(18) the origin offers Put back on the staged row", !!pb);
  pb.click();
  await tick();
  check("(19) ⭐ Put back drops the staged move: no record, five members again, no ghost, the panel says nothing is staged",
    st().moves.length === 0 && st().memberPoints === 5 && !w.__ccrMemberPoints().some((m) => m.ghost) &&
    !/Staged to move away/.test(text("#u-detail")), `${st().moves.length} / ${st().memberPoints}`);
  check("(20) the hint says what Put back did", /Put back/.test(text("#u-hint")) && /nothing is staged/.test(text("#u-hint")), text("#u-hint"));

  done();
})().catch((e) => { console.error(e); process.exit(1); });
