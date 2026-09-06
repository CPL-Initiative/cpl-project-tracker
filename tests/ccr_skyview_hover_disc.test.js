/* SkyView — the canvas hit test for a college course, and the focus disc.
 *
 * Both defects Sam reported on 2026-09-06 need a DENSE fixture to exist at all,
 * which is why they do not belong in ccr_skyview_universe.test.js: that fixture
 * has 6 identities and 11 members, so no ring ever spreads across a neighbor
 * and no disc ever approaches the viewport. Removed from there after both
 * perturbations passed — a test that survives deleting the code it covers is a
 * decoration. This fixture packs 120 identities two units apart and gives one of
 * them 30 college courses, which is the shape of a real well-adopted course
 * (WELD M1109 is taught at 24 colleges).
 *
 *   1. "the hover over the course members of the CCR all showed the same
 *      descriptor for the welding discipline instead of course details"
 *   2. "the background of SkyView changes to purple … instead of staying the
 *      same charcoal as the opening view … changes when a search item is
 *      selected"
 */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const ROOT = path.join(__dirname, "..");

const results = [];
function check(name, ok, detail) {
  results.push(ok);
  console.log((ok ? "PASS  " : "FAIL  ") + name + (ok || detail == null ? "" : "  — " + detail));
}
function done() {
  const pass = results.filter(Boolean).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
}

function ident(prefix, n, x, y) {
  const p = [];
  for (let i = 0; i < n; i++)
    p.push({ i: `${prefix} M${1000 + i}`, x: x + (i % 10) * 2, y: y + Math.floor(i / 10) * 2,
             t: `Welding Practice ${i}`, n: 3, s: 0, f: 0, r: 0, u: 3, c: 0 });
  return p;
}
const U = {
  _generated_from: "fixture",
  counts: { identities: 120, stand_alone: 0, points: 120, orbiting: 0, orbiting_cross: 0, rim: 0, disciplines: 1 },
  why_bits: { subject: 1, subj4: 2, title: 4, top: 8, units: 16, credit: 32 },
  bounds: { x0: -400, x1: 400, y0: -300, y1: 300 },
  islands: [{ d: "Welding", sh: "welding", x: -200, y: 0, r: 90, n: 120, sa: 0, al: 0, p: ident("WELD", 120, -210, -10) }],
};
const HOST = "WELD M1000";                       // the one opened for reading
/* Its disc scales with nodeRad, which scales with the row count — a real
 * well-adopted identity draws a big one. 2,500 puts the disc past the viewport
 * at reading zoom, which is the condition the clamp exists for and the reason
 * this fixture cannot be small. */
const MEM = { colleges: ["Alpha College", "Beta Community College"],
              counts: { identities: 120, members: 149, dropped_no_key: 0, cn_on_multiple_identities: 0 }, m: {} };
U.islands[0].p.find((nd) => nd.i === HOST).n = 2500;
U.islands[0].p.forEach((nd, k) => { MEM.m[nd.i] = [[100000 + k, `WELD ${k}`, 0]]; });
MEM.m[HOST] = [];
for (let z = 0; z < 30; z++) MEM.m[HOST].push([700000 + z, `WELD ${100 + z}`, z % 2]);

const ATLAS = { _generated_from: "fixture",
  totals: { decision_components: 0, identities_inbrowser: 120, suggestion_groups: 0, member_rows: 149 },
  disciplines: [{ name: "Welding", decisions: 0, ids: 120, members: 149, flagged: 0, reviewed: 0 }], detail: {} };

const tpl = fs.readFileSync(path.join(ROOT, "prototype/ccr_atlas_v1.html"), "utf8");
const ujs = fs.readFileSync(path.join(ROOT, "prototype/ccr_universe.js"), "utf8");
const safe = (o) => JSON.stringify(o).replace(/<\//g, "<\\/");
const html = tpl.replace("__DATA__", safe(ATLAS)).replace("__GRAPHJS__", "")
  .replace("__ESLDATA__", "null").replace("__ESLJS__", "")
  .replace("__UNIVDATA__", safe(U)).replace("__UNIVMEM__", safe(MEM)).replace("__UNIVJS__", ujs);

const arcFills = [];    // {r, style} per fill, so the focus disc is identifiable
function fakeCtx() {
  const noop = () => {};
  let lastR = 0;
  const c = {
    setTransform: noop, clearRect: noop, fillRect: noop, beginPath: noop,
    arc: (x, y, r) => { lastR = r; },
    fill: () => {
      const st = c.fillStyle;
      arcFills.push({ r: lastR, style: st && st.__grad ? "gradient" : String(st) });
    },
    closePath: noop, createRadialGradient: () => ({ __grad: true, addColorStop: noop }),
    stroke: noop, moveTo: noop, lineTo: noop, save: noop, restore: noop, setLineDash: noop,
    strokeText: noop, fillText: noop, measureText: (t) => ({ width: String(t).length * 6 }),
    fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "", textBaseline: "",
  };
  return c;
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
const st = () => w.__ccrUniverseState();
const tick = () => new Promise((r) => setTimeout(r, 0));

(async () => {
  await new Promise((r) => { if (d.readyState === "complete") r(); else w.addEventListener("load", r); });
  await tick();

  const host = U.islands[0].p.find((nd) => nd.i === HOST);
  w.__ccrGoSuggestion({ kind: "course", isl: U.islands[0], nd: host, label: host.t });
  await tick();
  /* Reading zoom, still inside the focus branch (k <= MEMBER_ZOOM_ALL 4.2), which
   * is where the ring spreads and the disc is at its largest. */
  q("#u-in").click(); q("#u-in").click();
  await tick();
  check("the map is at reading zoom, where the glow is at its largest",
    st().view.k > 4, `k=${st().view.k}`);
  arcFills.length = 0;                 // measure the frame we are looking at
  q("#u-in").click(); q("#u-out").click();   // one clean redraw at this zoom
  await tick();

  // ── 1 · the hover ─────────────────────────────────────────────────────────
  const mine = (w.__ccrMemberPoints() || []).filter((mp) => mp.id === HOST);
  check("the opened identity draws all 30 of its college courses", mine.length === 30, `${mine.length} stars`);
  check("its neighbors are drawn too, so the rings genuinely overlap",
    (w.__ccrMemberPoints() || []).length > 30, `${(w.__ccrMemberPoints() || []).length} stars in all`);

  let asMember = 0; const strays = [];
  mine.forEach((mp) => {
    q("#u-cvs").dispatchEvent(new w.MouseEvent("pointermove", { clientX: mp.x, clientY: mp.y, bubbles: true }));
    const tip = q("#u-tip");
    const html2 = tip && !tip.hidden ? tip.innerHTML : "";
    if (/college course under/.test(html2)) asMember++;
    else if (strays.length < 3) strays.push(mp.code + " -> " + html2.replace(/<[^>]+>/g, " ").slice(0, 60));
  });
  /* ⭐ THE DEFECT. An opened identity's ring SPREADS (drawMembers, `spread`), so
   * its own stars sit over neighboring identities; "a pointer inside the
   * nearest identity's circle means that identity" then took them, and the
   * reader got the same identity card on nearly every course. Measured before
   * the fix: 16 of 30. */
  check("⭐ every college course on the opened identity hovers to ITS OWN card",
    asMember === mine.length, `${asMember}/${mine.length} — strays: ${strays.join(" | ")}`);
  check("and that card is the course, with its college and the identity it sits under",
    /college course under/.test(q("#u-tip").innerHTML), q("#u-tip").textContent.slice(0, 90));

  // ── 2 · the glow that became the background ───────────────────────────────
  /* ⭐ THE PURPLE. haloAround() reaches r*2.6, and r is the DRAWN radius, so it
   * grows with the zoom: opening a well-adopted identity painted its system
   * color over the whole viewport at 30% alpha and the charcoal canvas turned
   * violet. The signal is "colleges have joined this one", which reads from a
   * glow around the disc — it does not need the screen, and past a certain size
   * the reader stops seeing a glow and just sees a tinted page.
   * cw()/ch() fall back to 960x600 under jsdom, which reports 0 for every
   * rectangle, so the page's own fallback is the bound here. */
  const cvsW = q("#u-cvs").clientWidth || 960, cvsH = q("#u-cvs").clientHeight || 600;
  const reach = Math.max(24, Math.min(cvsW, cvsH) * 0.22);   // the glow's bound
  const cap = Math.max(40, Math.min(cvsW, cvsH) * 0.42);     // the focus disc's
  const glows = arcFills.filter((f) => f.style === "gradient");
  const over = glows.filter((f) => f.r > reach + 1);
  check("the membership glow is painted — it is Sam's own signal, not decoration",
    glows.length > 0 && glows.some((f) => f.r > 10),
    `${glows.length} glows, largest ${Math.round(Math.max(0, ...glows.map((f) => f.r)))}`);
  check("⭐ and no glow reaches across the canvas, so the ground stays charcoal",
    over.length === 0,
    `${over.length} of ${glows.length} past ${Math.round(reach)}px, largest ${Math.round(Math.max(0, ...glows.map((f) => f.r)))}`);

  // ── 3 · the focus disc, at the zoom where it is drawn ─────────────────────
  /* The ring only spreads, and the disc behind it is only painted, while
   * k <= MEMBER_ZOOM_ALL (4.2). Its radius grows with the member count and the
   * zoom the same way the glow does, so it needs the same bound — a disc wider
   * than the canvas is not a disc either. */
  for (let g = 0; g < 12 && st().view.k > 4.0; g++) q("#u-out").click();
  await tick();
  check("the map is back inside the focus branch, where the disc is painted",
    st().view.k <= 4.2 && st().view.k > 2.7, `k=${st().view.k}`);
  arcFills.length = 0;
  q("#u-in").click(); q("#u-out").click();     // one clean redraw at this zoom
  await tick();
  const discs = arcFills.filter((f) => /^rgba\(255,255,255,\.8\)$/.test(f.style));
  const discOver = discs.filter((f) => f.r > cap + 1);
  check("the focus disc is painted at this zoom", discs.length > 0,
    `${discs.length} discs, largest ${Math.round(Math.max(0, ...discs.map((f) => f.r)))}`);
  check("⭐ and it never outgrows the canvas either",
    discOver.length === 0,
    `${discOver.length} of ${discs.length} over ${Math.round(cap)}px, largest ${Math.round(Math.max(0, ...discs.map((f) => f.r)))}`);

  done();
})().catch((e) => { console.error("HARNESS ERROR", e); check("the suite ran to the end", false, String(e && e.stack || e)); done(); });
