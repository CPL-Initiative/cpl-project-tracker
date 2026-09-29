// SkyView — THE FRAME BUDGET (S242).
//
// Three defects, one shape: a value that DRIFTS was used as if it were stable,
// and work was done for points nobody could see. Measured on the served page at
// the opening width, before and after: 13.2 → 20.4 frames a second.
//
//   1  the label memo asked a question it had never asked, every frame. Its key
//      was `ctx.font` + the string, and an island label is sized off the drawn
//      radius — 18.0263px, 18.2506px, 18.1185px as the sky turns. So it never
//      hit once, and each miss handed Chromium a font size it had to build:
//      `measureText` 11.2% of the profile against `textW`'s own 0.5%.
//   2  the same drift re-rasterized every island name every frame. Fixing (1)
//      alone just moved the bill — `strokeText` went 0.6% → 9.6%, because the
//      first USE of a novel font is what builds it.
//   3  an island the window shows is not an island whose points it shows: 5,755
//      of 27,931 batched dots a frame — 20.6% — were pushed and rasterized
//      wholly outside the canvas.
//
// ⚠️ WHAT THIS SUITE CAN AND CANNOT SEE. jsdom has no layout, so it cannot time
// a frame and no assertion here is about speed. What it CAN see is the shape of
// the failure: how many distinct fonts the draw path asks for, whether a label
// size is a whole number, and whether an off-screen dot is pushed. Those are
// the properties; the frame rate is in `docs/ccr_atlas_lessons.md`, measured in
// a browser, which is the only place a frame rate exists.
//
// ⚠️ THE FAKE CONTEXT IS SIZE-AWARE HERE, DELIBERATELY. Every other SkyView
// suite stubs `measureText` as `len * 6`, ignoring the font — fine when the
// width is only fed to a collision box, and useless for a test about font
// churn. This one models the one property real text has: width scales with the
// size. A stub that ignores the font cannot fail (1).
//
// Run from repo root: `node tests/ccr_skyview_frame_budget.test.js`.
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

// ── fixture: two disciplines, one on each side of the sky ───────────────────
const U = {
  _generated_from: "fixture",
  counts: { identities: 4, stand_alone: 0, points: 4, orbiting: 0, orbiting_cross: 0, rim: 0, disciplines: 2,
            member_rows: 6, member_rows_all_identities: 6, described_courses: 0 },
  why_bits: { subject: 1, subj4: 2, title: 4, top: 8, units: 16, credit: 32 },
  bounds: { x0: -400, x1: 400, y0: -300, y1: 300 },
  islands: [
    { d: "Welding", sh: "welding", x: 0, y: 0, r: 90, n: 3, sa: 0, al: 0, p: [
      { i: "WELD M1109", x: 0,  y: 0,  t: "Introduction to Welding",              n: 5, s: 0, f: 0, r: 0, u: 2 },
      { i: "WELD M1106", x: 60, y: 0,  t: "Introduction to the Welding Processes", n: 1, s: 0, f: 0, r: 0, u: 3 },
      /* ⚠️ THE OFF-SCREEN PROBE. Welding's disc is on screen, so the island
       * survives S241's angular cull and its whole point list is walked — which
       * is the exact case S242's test guards. This one sits 4,000 units out,
       * far past any window, and must never reach the batch. Without it the
       * fixture's three points all land near the middle and the guard passes
       * against the defect, which is no guard at all. */
      { i: "WELD M9999", x: 4000, y: 4000, t: "Off-screen probe", n: 1, s: 0, f: 0, r: 0, u: 1 },
    ] },
    { d: "English", sh: "english", x: 300, y: 0, r: 60, n: 1, sa: 0, al: 0, p: [
      { i: "ENGL M1001", x: 300, y: 0, t: "College Composition", n: 3, s: 0, f: 0, r: 0, u: 3 },
    ] },
  ],
};
const MEM = {
  colleges: ["American River College", "Barstow Community College", "Chabot College", "Glendale Community College"],
  counts: { identities: 2, members: 6, dropped_no_key: 0, cn_on_multiple_identities: 0 },
  m: { "WELD M1109": [[300, "WELD 300", 0], [50, "WELD 50A", 1], [70, "WELD 70", 2], [117, "WELD 117", 3], [205, "WELD 205", 0]],
       "WELD M1106": [[901, "WELD 901", 1]] },
};
const SKY = {
  _generated_by: "fixture", radians_per_unit: 0.0019, round_scale: 0.62, lat_span_deg: 162,
  kind: { boundary_deg: 101.1, cte_side_share: 0.6, cte: 1, academic: 1, mixed: 0, held: [] },
  islands: [
    { d: "Welding", n: 3, pts: 3, base: 3, cte: 3, share: 1.0, cls: "cte",      committed: [0, 0],   spread: [0, 0],   kind: [60, 0] },
    { d: "English", n: 1, pts: 1, base: 1, cte: 0, share: 0.0, cls: "academic", committed: [135, 0], spread: [135, 0], kind: [-100, 5] },
  ],
};
const ATLAS = { _generated_from: "fixture", totals: { decision_components: 0, identities_inbrowser: 3, suggestion_groups: 0, member_rows: 6 },
                disciplines: [{ name: "Welding", decisions: 0, ids: 2, members: 6, flagged: 0, reviewed: 0 },
                              { name: "English", decisions: 0, ids: 1, members: 0, flagged: 0, reviewed: 0 }], detail: {} };

const tpl = fs.readFileSync(path.join(ROOT, "prototype/ccr_atlas_v1.html"), "utf8");
const ujs = fs.readFileSync(path.join(ROOT, "prototype/ccr_universe.js"), "utf8");
const safe = (o) => JSON.stringify(o).replace(/<\//g, "<\\/");
const html = tpl.replace("__DATA__", safe(ATLAS)).replace("__GRAPHJS__", "")
  .replace("__ESLDATA__", "null").replace("__ESLJS__", "")
  .replace("__UNIVDATA__", safe(U)).replace("__UNIVMEM__", safe(MEM)).replace("__UNIVJS__", ujs);

const SIZE_RE = /(\d*\.?\d+)px/;
// jsdom's rects are zero, so the canvas falls back to 960 × 600 (see the Sky suite).
const CW = 960, CH = 600;

function fakeCtx(log) {
  const noop = () => {};
  const c = {
    setTransform: noop, clearRect: noop, fillRect: noop, beginPath: noop, fill: noop, closePath: noop,
    createRadialGradient: () => ({ addColorStop: noop }), createImageData: () => null,
    moveTo: noop, lineTo: noop, clip: noop, save: noop, restore: noop, setLineDash: noop, drawImage: noop,
    arc: noop, stroke: noop,
    // The one property real text has: the width scales with the font size. A
    // stub returning a constant cannot see a memo that never hits.
    measureText(t) {
      const m = SIZE_RE.exec(this.font || "");
      const size = m ? parseFloat(m[1]) : 16;
      if (log) log.measured.push(String(this.font));
      return { width: String(t).length * 0.6 * size };
    },
    rect(x, y, w, h) {
      if (log) { log.rects++; if (x + w < 0 || x > CW || y + h < 0 || y > CH) log.offscreen++; }
    },
    strokeText(t) { if (log) log.drawnFonts.push(String(this.font)); },
    fillText: noop,
    fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "", textBaseline: "", globalAlpha: 1,
  };
  return c;
}

const log = { measured: [], drawnFonts: [], rects: 0, offscreen: 0 };
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 0));

(async () => {
  // ── the source-level halves: a reader who "simplifies" either one back ──────
  check("textW does not key its memo on the raw ctx.font (a size that drifts is not a key)",
    !/_twCache\[\s*ctx\.font\s*\+/.test(ujs) && /TW_REF/.test(ujs),
    "the memo is keyed on the whole font declaration again — it will never hit on the sphere");
  check("textW measures at TW_REF and scales, so one font serves every label size",
    /ctx\.font\s*=\s*m\[1\]\s*\+\s*TW_REF\s*\+\s*"px"\s*\+\s*m\[3\]/.test(ujs) &&
    /\/\s*TW_REF/.test(ujs), "the reference measure is gone");
  check("textW restores the caller's font before returning (the caller is mid-draw)",
    /ctx\.font\s*=\s*m\[1\]\s*\+\s*TW_REF[\s\S]{0,120}?ctx\.font\s*=\s*f\s*;/.test(ujs),
    "measuring left ctx.font pointing at the reference size");
  check("placeLabels sizes island labels through labelSize (whole pixels, with a dead band)",
    /var size\s*=\s*labelSize\(q,\s*Math\.max\(11/.test(ujs), "the raw drifting size is being drawn again");
  check("labelSize holds its remembered size until the raw value is 0.6px away",
    /Math\.abs\(raw\s*-\s*L\)\s*>=\s*0\.6/.test(ujs),
    "a bare Math.round on a drifting value flips 18 to 19 and back forever");
  check("the batched star path tests the point against the window before pushing it",
    /if\(sx\+dr<0\|\|sx-dr>W\|\|sy\+dr<0\|\|sy-dr>H\) return;/.test(ujs),
    "off-screen dots are being pushed and rasterized again");

  // ── and what jsdom can actually watch happen ───────────────────────────────
  const dom = new JSDOM(html, {
    runScripts: "dangerously", pretendToBeVisual: true,
    url: "https://example.org/prototype/skyview.html#skyview",
    beforeParse(window) {
      window.HTMLCanvasElement.prototype.getContext = function () { return fakeCtx(log); };
      window.fetch = () => Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
      window.CPL_CCR_SKY = SKY;
    },
  });
  const w = dom.window, d = w.document;
  await new Promise((r) => { if (d.readyState === "complete") r(); else w.addEventListener("load", r); });
  await tick();

  const st = w.__ccrUniverseState();
  check("(harness) the Sky is what opened, and it is turning", st.proj === "sky" && st.rotating === true,
    `proj=${st.proj} rotating=${st.rotating}`);

  // Let the sky turn. Every frame re-derives each island's scale, so a size that
  // drifts shows up as a new font; one that is rounded and sticky does not.
  /* ⚠️ THE FIXTURE'S ISLANDS SIT AT THE SIZE CLAMP, so `q.r*0.17` alone cannot
   * produce a fractional size and a guard written on it would pass against the
   * defect — a decoration. `tx()` is the other factor and it is 0.85 at
   * "Smaller", so 11 × 0.85 = 9.35: fractional if the raw size is drawn,
   * whole if it goes through labelSize. Verified by reverting the fix. */
  w.__ccrTextStep(0);
  log.drawnFonts.length = 0;
  for (let i = 0; i < 40; i++) { w.__ccrUniverse && w.__ccrUniverse(); await tick(0); }
  const sizesDrawn = [...new Set(log.drawnFonts.map((f) => (SIZE_RE.exec(f) || [0, "?"])[1]))];

  check("every island label is drawn at a whole number of pixels",
    sizesDrawn.length > 0 && sizesDrawn.every((s) => /^\d+$/.test(s)),
    `fractional sizes drawn: ${sizesDrawn.filter((s) => !/^\d+$/.test(s)).slice(0, 6).join(", ")}`);
  /* ⚠️ NO CHECK HERE ON THE NUMBER OF DISTINCT FONTS MEASURED. It is the
   * obvious assertion for defect (1) and it cannot fail: once the drawn size is
   * rounded, the font is stable however textW keys its memo, so the count stays
   * at 2 with the fix reverted. Verified by reverting both halves — 6 of 10,
   * and not on that line. The reference measure is pinned by the source checks
   * above instead, which do fail. Rounding is what stops the churn; measuring
   * at TW_REF is what stops a future caller from starting it again. */
  check("no dot is batched wholly outside the canvas",
    log.offscreen === 0, `${log.offscreen} of ${log.rects} rects lay off screen`);

  done();
})().catch((e) => { console.error(e); process.exit(1); });
