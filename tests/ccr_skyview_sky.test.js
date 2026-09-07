// SkyView — THE SKY: the map through a projection (Sam's eight rulings, 2026-09-07).
//
// Sam ruled the globe into SkyView ("Looks great! Let's go with it in next
// session") and answered yes to all eight calls on the S239 sheet. This suite
// pins each ruling where jsdom can see it:
//
//   1  the Sky opens (#skyview → the inside window, 150° across), with Globe
//      and Map one click away as three words; the hash names where you stand
//   2  the Map stays, on the same canvas
//   3  Night by default on the Sky, light on the Map, and ONE remembered choice
//      that holds everywhere; Day rims the dots and the legend swatches
//   4  the sky turns when it opens, stops at the first touch (a press, a key, a
//      search, a carry), never under reduced motion
//   5  a drop lands on a circle by angle on the sphere — S237's fixture (a
//      neighbor's circle under the open identity's own star) on the curve
//   6  By kind: the islands sit where the placement payload puts them and the
//      two region names ride the sky
//   7  the controls: Rotate is a word, Discipline names folds into the menu,
//      the zoom readout says degrees across / distance / percent
//   8  silver is the M-ID color on every dark canvas
//
// ⭐ THE SPHERE IS THE MAP THROUGH A PROJECTION. Every island is a locally flat
// disc placed by its projected center's Jacobian, so the drop test, the label
// placer, the member rings, the keyboard path and the staged-to-move mark run
// unchanged — and this suite proves the ones that matter most on the curve.
//
// Run from repo root: `node tests/ccr_skyview_sky.test.js`.
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
  counts: { identities: 3, stand_alone: 0, points: 3, orbiting: 0, orbiting_cross: 0, rim: 0, disciplines: 2,
            member_rows: 6, member_rows_all_identities: 6, described_courses: 0 },
  why_bits: { subject: 1, subj4: 2, title: 4, top: 8, units: 16, credit: 32 },
  bounds: { x0: -400, x1: 400, y0: -300, y1: 300 },
  islands: [
    { d: "Welding", sh: "welding", x: 0, y: 0, r: 90, n: 2, sa: 0, al: 0, p: [
      { i: "WELD M1109", x: 0,  y: 0,  t: "Introduction to Welding",               n: 5, s: 0, f: 0, r: 0, u: 2 },
      { i: "WELD M1106", x: 60, y: 0,  t: "Introduction to the Welding Processes",  n: 1, s: 0, f: 0, r: 0, u: 3 },
    ] },
    { d: "English", sh: "english", x: 300, y: 0, r: 60, n: 1, sa: 0, al: 0, p: [
      { i: "ENGL M1001", x: 300, y: 0, t: "College Composition", n: 3, s: 0, f: 0, r: 0, u: 3 },
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
// The placement payload, as kb/_build_ccr_sky.py writes it: CTE on one side of
// the sky (Welding at longitude 60°), academic on the other (English at −100°).
const SKY = {
  _generated_by: "fixture", radians_per_unit: 0.0019, round_scale: 0.62, lat_span_deg: 162,
  kind: { boundary_deg: 101.1, cte_side_share: 0.6, cte: 1, academic: 1, mixed: 0, held: [] },
  islands: [
    { d: "Welding", n: 2, pts: 2, base: 2, cte: 2, share: 1.0, cls: "cte",      committed: [0, 0],    spread: [0, 0],     kind: [60, 0] },
    { d: "English", n: 1, pts: 1, base: 1, cte: 0, share: 0.0, cls: "academic", committed: [135, 0],  spread: [135, 0],   kind: [-100, 5] },
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

function fakeCtx(log) {
  const noop = () => {};
  const c = { setTransform: noop, clearRect: noop, fillRect: noop, beginPath: noop, fill: noop,
           closePath: noop, createRadialGradient: () => ({ addColorStop: noop }), createImageData: () => null,
           moveTo: noop, lineTo: noop, rect: noop, clip: noop, save: noop, restore: noop, setLineDash: noop, drawImage: noop,
           arc(x, y, r) { if (log) log.arcs++; }, stroke: noop,
           strokeText: noop, fillText(t) { if (log) log.texts.push(String(t)); }, measureText: (t) => ({ width: String(t).length * 6 }),
           fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "", textBaseline: "", globalAlpha: 1 };
  return c;
}
const canvasLog = { arcs: 0, texts: [] };
function build(opts) {
  opts = opts || {};
  const dom = new JSDOM(html, {
    runScripts: "dangerously", pretendToBeVisual: true,
    url: "https://example.org/prototype/skyview.html" + (opts.hash || ""),
    beforeParse(window) {
      window.HTMLCanvasElement.prototype.getContext = function () { return fakeCtx(opts.log); };
      window.fetch = () => Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
      window.CPL_CCR_SKY = SKY;                       // the placement payload, inline (as CPL_CCR_CPL is for the face)
      if (opts.reduce) window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    },
  });
  return dom;
}
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 0));
const CX = 480, CY = 300;                        // jsdom's rects are zero; the canvas falls back to 960 × 600

(async () => {
  const dom = build({ log: canvasLog });
  const w = dom.window, d = w.document;
  const q = (s) => d.querySelector(s);
  const st = () => w.__ccrUniverseState();
  const text = (sel) => (q(sel) ? q(sel).textContent : "");
  const pointer = (type, x, y, extra) => q("#u-cvs").dispatchEvent(new w.MouseEvent(type, Object.assign({ clientX: x, clientY: y, bubbles: true, button: 0 }, extra || {})));
  const key = (k) => q("#u-cvs").dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true }));
  await new Promise((r) => { if (d.readyState === "complete") r(); else w.addEventListener("load", r); });
  await tick();

  // ── 1 · the route opens the Sky; three words; the hash names where you stand ──
  w.location.hash = "#skyview"; w.__ccrRoute(); await tick(20);
  check("(1) ⭐ #skyview opens the SKY — the inside window — not the flat map",
    st().proj === "sky" && q("#u-proj-sky").getAttribute("aria-pressed") === "true", st().proj);
  check("(1) the three words are in the row, and the Globe and the Map are one click away",
    !!q("#u-proj-sky") && !!q("#u-proj-globe") && !!q("#u-proj-map") && q("#u-proj-map").textContent === "Map");
  check("(1) the window opens 150° across, as the prototype did", Math.abs(st().sph.half * 2 * 180 / Math.PI - 150) < 0.01 && /150° across/.test(text("#u-zoom")), text("#u-zoom"));
  check("(1) the hash reads #skyview", w.location.hash === "#skyview", w.location.hash);
  check("(1) the placement payload bound", st().skyState === "ok", st().skyState);

  // ── 6 · By kind: the islands sit where the payload puts them; the region names ride the sky ──
  const wp = st().islandScreen("Welding"), ep = st().islandScreen("English");
  check("(6) ⭐ Welding (CTE, 60° east) is on the screen; English (academic, on the far side) is out of the window at the opening view",
    wp && wp.x > 0 && wp.x < 960 && wp.y > 0 && wp.y < 600 && (!ep || ep.x < 0 || ep.x > 960 || ep.y < 0 || ep.y > 600),
    JSON.stringify({ wp, ep }));
  check("(6) an island's screen radius is its world radius through the local scale", wp && Math.abs(wp.r - 90 * wp.k) < 1e-6);
  check("(6) both region names exist, and the CTE side's is in view",
    st().regions.length === 2 && st().regions.some((r) => r.text === "CTE disciplines" && r.on), JSON.stringify(st().regions));
  check("(6) the region name was drawn as text on the canvas", canvasLog.texts.some((t) => t === "CTE disciplines"));
  // the projection is the sky's own: the island's direction through the window
  const pw = w.__ccrW2S(0, 0, "Welding");
  check("(6) w2s through the sphere agrees with the island's center", pw && Math.abs(pw[0] - wp.x) < 1e-6 && Math.abs(pw[1] - wp.y) < 1e-6);

  // ── 3 · Night by default on the Sky; ONE remembered choice ──────────────────
  check("(3) ⭐ the Sky opens at NIGHT: the dark canvas is on, and no choice has been stored",
    d.body.classList.contains("u-dark") && st().dark === true && st().darkChoice === null, JSON.stringify({ dark: st().dark, choice: st().darkChoice }));
  check("(3) the control reads Night | Day on the Sky, and the Map's Dark canvas row is hidden",
    !q("#u-nd").hidden && q("#u-dark").hidden && q("#u-night").getAttribute("aria-pressed") === "true");
  check("(3) by night the legend swatch is not rimmed (body.u-day is off)", !d.body.classList.contains("u-day") && st().day === false);

  // ── 4 · the turn: on when the sky opens, off at the first touch ────────────
  check("(4) ⭐ the sky turns when it opens, and Rotate is pressed", st().rotating === true && q("#u-rotate").getAttribute("aria-pressed") === "true" && !q("#u-turn-grp").hidden);
  const spin0 = st().sph.spin; await tick(120);
  check("(4) the spin advances while it turns", st().sph.spin !== spin0, String(st().sph.spin - spin0));
  pointer("pointerdown", CX, CY); pointer("pointerup", CX, CY); await tick();
  check("(4) ⭐ the first touch stops it", st().rotating === false && q("#u-rotate").getAttribute("aria-pressed") === "false");
  const spin1 = st().sph.spin; await tick(80);
  check("(4) …and it stays still", st().sph.spin === spin1);
  q("#u-rotate").click(); await tick();
  check("(4) Rotate turns it back on", st().rotating === true);
  key("ArrowRight"); await tick();
  check("(4) a key is a touch", st().rotating === false);
  q("#u-rotate").click(); await tick();
  w.__ccrUniverseSearch("welding"); await tick();
  check("(4) a search is a touch", st().rotating === false);

  // ── 7 · the readout and the menu rows ───────────────────────────────────────
  key("+"); await tick();
  check("(7) + narrows the window and the readout says so in degrees across", st().sph.half * 2 * 180 / Math.PI < 150 && /° across/.test(text("#u-zoom")), text("#u-zoom"));
  q("#u-names").click(); await tick();
  check("(7) Discipline names is a row in More → Show or hide, a word with a state", st().namesOn === false && q("#u-names").querySelector(".u-state").textContent === "off");
  q("#u-names").click(); await tick();
  w.__ccrSetMode("move"); await tick();
  check("(7) the hint says what a drag does HERE: the sky turns", /turn/.test(text("#u-hint")), text("#u-hint"));

  // ── 5 · the drop lands on a circle by angle: S237's fixture, on the curve ──
  w.__ccrUniverseFly(0, 0, 3); await tick();
  const wk = st().islandScreen("Welding");
  check("(5) fly-to faces the identity and sets the window so the local scale is the zoom asked for",
    wk && Math.abs(wk.x - CX) < 1 && Math.abs(wk.y - CY) < 1 && Math.abs(wk.k - 3) / 3 < 0.03, JSON.stringify(wk));
  pointer("pointerdown", CX, CY); pointer("pointerup", CX, CY); await tick();
  check("(5) the identity at the center opens with its five college courses ringing it", st().sel === "WELD M1109" && st().memberPoints === 5, `${st().sel} / ${st().memberPoints}`);
  // put the neighbor's circle exactly under one of the open identity's stars — through the sphere's own inverse
  const star = w.__ccrMemberPoints().filter((m) => !m.ghost)[0];
  const B = U.islands[0].p[1];
  const wb = w.__ccrS2W(star.x, star.y, "Welding");
  const PU = w.CPL_CCR_UNIVERSE; const NB = PU.islands[0].p.find((p) => p.i === "WELD M1106");
  NB.x = wb[0]; NB.y = wb[1];
  w.__ccrUniverseFly(0, 0, 3); await tick();                               // redraw at the same view
  const bs = w.__ccrW2S(NB.x, NB.y, "Welding");
  check("(5) the fixture reproduces the eclipse on the sphere: the neighbor's circle sits under the star",
    Math.abs(bs[0] - star.x) < 0.5 && Math.abs(bs[1] - star.y) < 0.5, `circle ${bs[0].toFixed(1)},${bs[1].toFixed(1)} vs star ${star.x.toFixed(1)},${star.y.toFixed(1)}`);
  pointer("pointermove", star.x, star.y);
  check("(5) reading is unchanged: hovering the eclipsed point names the college course",
    !q("#u-tip").hidden && new RegExp(star.code).test(q("#u-tip").textContent), q("#u-tip").textContent);
  const mv = q("#u-detail ul.mlist > li .mv");
  mv.dispatchEvent(new w.MouseEvent("pointerdown", { bubbles: true, button: 0 }));
  check("(5) pressing Drag… picks the course up — and the sky holds still while it is carried",
    st().carrying === mv.dataset.code && st().rotating === false, String(st().carrying));
  pointer("pointermove", star.x, star.y);
  check("(5) ⭐ the carry NAMES the identity the release would write to", st().dropTarget === "WELD M1106", String(st().dropTarget));
  pointer("pointerup", star.x, star.y); await tick();
  const last = st().moves[st().moves.length - 1];
  check("(5) ⭐ the drop lands on the CIRCLE, not the star over it — on the curve", last && last.to === "WELD M1106" && last.from === "WELD M1109", JSON.stringify(last));
  check("(5) the staged-to-move mark answers from the same model on the sphere",
    st().staged.here(last.cn, "WELD M1106") && st().staged.awayFrom("WELD M1109").length === 1 && /Staged to move/.test(text("#u-hint")));
  st().staged.unstage(last.cn); await tick();

  // ── 5 · Pan: a drag turns the sky, and the sky follows the hand ────────────
  w.__ccrSetMode("pan"); await tick();
  const before = st().islandScreen("Welding");
  pointer("pointerdown", CX, CY); pointer("pointermove", CX + 60, CY); pointer("pointerup", CX + 60, CY); await tick();
  const after = st().islandScreen("Welding");
  check("(5) in Pan a drag turns the sky, and the island under the hand moves WITH the hand",
    before && after && after.x - before.x > 30 && Math.abs(after.y - before.y) < 5, JSON.stringify({ before, after }));
  pointer("pointerdown", CX, CY); pointer("pointermove", CX, CY + 40); pointer("pointerup", CX, CY + 40); await tick();
  const after2 = st().islandScreen("Welding");
  check("(5) …and down with the hand", after2 && after2.y - after.y > 20 && Math.abs(after2.x - after.x) < 5, JSON.stringify({ after, after2 }));
  // the globe, seen from outside, follows the hand too
  w.__ccrSetProj("globe"); await tick(); w.__ccrUniverseFly(0, 0, 3); await tick();
  const g0 = st().islandScreen("Welding");
  pointer("pointerdown", CX, CY); pointer("pointermove", CX + 60, CY); pointer("pointerup", CX + 60, CY); await tick();
  const g1 = st().islandScreen("Welding");
  check("(5) on the Globe a drag turns it the way a hand spins a globe: the near side follows the hand",
    g0 && g1 && g1.x - g0.x > 30 && Math.abs(g1.y - g0.y) < 5, JSON.stringify({ g0, g1 }));
  w.__ccrSetProj("sky"); await tick();
  w.__ccrSetMode("move"); await tick();

  // ── the keyboard path: Tab through disciplines, Enter, Escape ──────────────
  w.__ccrUniverseFly(0, 0, 3); await tick();
  key("Tab"); await tick();
  const tabbed = /Welding|English/.test(text("#u-hint"));
  key("Enter"); await tick();
  check("(kb) Tab reaches a discipline and Enter opens its first identity on the sphere", tabbed && !!st().sel, `${tabbed} / ${st().sel} / ${text("#u-hint").slice(0, 80)}`);
  key("Escape"); await tick();
  check("(kb) Escape backs out to the discipline", st().sel === null);

  // ── 3 · Day: the rim; the choice holds on the Map; a fresh reader sees each view's default ──
  q("#u-day").click(); await tick();
  check("(3) ⭐ Day: the dark canvas goes off, body.u-day comes on, the choice is stored",
    st().dark === false && st().day === true && d.body.classList.contains("u-day") && st().darkChoice === "light");
  const tplSrc = tpl;
  check("(3) the day tokens tint the ground to the CO blue and rim the legend swatches",
    /body\.u-day\{[^}]*--sky-ground:#A8C3E8/.test(tplSrc) && /body\.u-day \.u-sw\{box-shadow:inset 0 0 0 1\.5px var\(--sky-dot-rim\)\}/.test(tplSrc));
  check("(3) the canvas rims every dot by day", /if\(day\)\{ ctx\.lineWidth=Math\.max\(0\.8, dr\*0\.34\); ctx\.strokeStyle=pal\.dotRim; ctx\.stroke\(\); \}/.test(ujs));
  q("#u-proj-map").click(); await tick();
  check("(2) ⭐ the Map stays — one click away on the same canvas, and the hash says #map",
    st().proj === "map" && w.location.hash === "#map" && st().sel === null && !!q("#u-cvs"), `${st().proj} ${w.location.hash}`);
  check("(3) the light choice holds on the Map; the Map has no day", st().dark === false && st().day === false && !d.body.classList.contains("u-day"));
  check("(7) on the Map the readout is a percentage again and Rotate is gone", /%$/.test(text("#u-zoom")) && q("#u-turn-grp").hidden && !q("#u-dark").hidden);
  q("#u-proj-globe").click(); await tick();
  check("(1) the Globe: the sphere from outside, the readout in radii, the hash #globe",
    st().proj === "globe" && /R$/.test(text("#u-zoom")) && w.location.hash === "#globe" && st().islandScreen("Welding"), `${st().proj} ${text("#u-zoom")} ${w.location.hash}`);
  q("#u-face-cpl").click(); await tick();
  check("(1) the CPL face is a link on every place to stand: #globe/cpl", w.location.hash === "#globe/cpl", w.location.hash);
  q("#u-face-courses").click(); await tick();

  // ── 8 · silver on every dark canvas ─────────────────────────────────────────
  const darkBlock = (tplSrc.match(/body\.u-dark\{[\s\S]*?\n\}/) || [""])[0];
  check("(8) ⭐ the dark canvas paints an M-ID SILVER (#D6D6D0), the light canvas keeps violet",
    /--sky-sys0-stroke:#D6D6D0/.test(darkBlock) && /--sky-sys0-stroke:#6D28D9/.test(tplSrc), darkBlock.slice(0, 120));
  check("(8) the legend's M-ID swatch follows the token, so one legend serves every view", /\.u-sw\.s0\{background:var\(--sky-sys0-stroke\)/.test(tplSrc));

  // ── 3 · a fresh reader: the Map opens light, the Sky opens dark; a stored choice wins ──
  const d2 = build({}); const w2 = d2.window;
  await new Promise((r) => { if (d2.window.document.readyState === "complete") r(); else w2.addEventListener("load", r); });
  w2.location.hash = "#map"; w2.__ccrRoute(); await tick(20);
  const mapLight = w2.__ccrUniverseState().dark === false;
  w2.__ccrSetProj("sky"); await tick(20);
  check("(3) a fresh reader: the Map opens light and the Sky opens dark, with no choice stored",
    mapLight && w2.__ccrUniverseState().dark === true && w2.__ccrUniverseState().darkChoice === null);
  w2.__ccrSetDark(true); w2.__ccrSetProj("map"); await tick(20);
  check("(3) a stored choice (dark) holds on the Map too", w2.__ccrUniverseState().dark === true && w2.__ccrUniverseState().darkChoice === "dark");

  // ── 4 · reduced motion: no turn at all ─────────────────────────────────────
  const d3 = build({ reduce: true }); const w3 = d3.window;
  await new Promise((r) => { if (d3.window.document.readyState === "complete") r(); else w3.addEventListener("load", r); });
  w3.location.hash = "#skyview"; w3.__ccrRoute(); await tick(60);
  check("(4) ⭐ a reader who asked for reduced motion gets a still sky: no turn, Rotate not pressed",
    w3.__ccrUniverseState().reduceMotion === true && w3.__ccrUniverseState().rotating === false && w3.document.querySelector("#u-rotate").getAttribute("aria-pressed") === "false");

  // ── the harness hook: a flat-map suite names what #skyview opens ───────────
  check("(harness) the flat-map suites declare CPL_SKYVIEW_OPENS=\"map\"; production opens the Sky",
    /var OPENS = \(window\.CPL_SKYVIEW_OPENS==="map"\|\|window\.CPL_SKYVIEW_OPENS==="globe"\) \? window\.CPL_SKYVIEW_OPENS : "sky";/.test(ujs));

  done();
})().catch((e) => { console.error(e); process.exit(1); });
