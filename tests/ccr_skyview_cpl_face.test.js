// SkyView — the CPL face and the articulations light (Sam's rulings 1-3 of the
// 2026-09-07 decision sheet, all "yes", one note).
//
//   1. THE CEILING IS THE RECEIVING COURSE. A MAP exhibit reaches a point only
//      through the college course the credit is awarded against, so the CPL
//      face SAYS ITS OWN COVERAGE on the surface — computed from the payload,
//      never quoted. The fixture's numbers (4 of 777) are nothing like the real
//      ones (1,924 of 5,497) on purpose: a literal would fail here.
//   2. THE ARTICULATIONS TOGGLE SHOWS PRESENCE ONLY. It lights what has a number
//      and leaves the rest drawn as it is — no gray, no hollow, no "none".
//   3. THE CPL FACE LEADS WITH THE CREDENTIAL, then the issuing agency AND the
//      training agency where they differ, then what it earns, then the
//      colleges holding it. Search switches with it. A point no exhibit
//      reaches stays drawn and UNLABELED. His note: the agencies go on the
//      course outline of record too.
//
// ⚠️ WHAT THIS FILE CANNOT SEE. jsdom has no layout engine and no canvas: the
// 2D context here is a recorder, so the light is asserted as the strokes the
// draw path asks for (their color and width), not as pixels. The pixels were
// checked in Chromium against the served page — recorded in the lane.
//
// Run from repo root: `npm test` (or `node tests/ccr_skyview_cpl_face.test.js`).
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
 * Three disciplines. Welding holds six identities and one stand-alone; two of
 * the identities carry an articulation (`ar`), four do not. Art holds two, one
 * articulated. Nursing holds one with nothing — the island the light must
 * leave alone. */
const pt = (i, t, n, extra) => Object.assign({ i, t, n, s: 0, f: 0, r: 0, u: 3, c: 0, x: 0, y: 0 }, extra || {});
const U = {
  _generated_from: "fixture",
  counts: { identities: 9, stand_alone: 1, points: 10, orbiting: 1, orbiting_cross: 0, rim: 0, disciplines: 3 },
  why_bits: { subject: 1, subj4: 2, title: 4, top: 8, units: 16, credit: 32 },
  bounds: { x0: -400, x1: 400, y0: -300, y1: 300 },
  islands: [
    { d: "Welding", sh: "welding", x: -200, y: 0, r: 90, n: 6, sa: 1, al: 1, p: [
      pt("WELD M1001", "Introduction to Welding", 24, { x: -200, y: 0, ar: 3 }),
      pt("WELD M1002", "Advanced Welding", 4, { x: -170, y: 20, ar: 1 }),
      pt("WELD M1003", "Welding Metallurgy", 3, { x: -230, y: -20 }),
      pt("WELD M1004", "Pipe Welding", 2, { x: -240, y: 30 }),
      pt("WELD M1005", "Welding Safety", 5, { x: -160, y: -30 }),
      pt("WELD M1006", "Blueprint Reading for Welders", 2, { x: -190, y: 40 }),
      pt("WELD M10ZZ", "Welding for Artists", 1, { x: -210, y: 12, a: 1, o: "WELD M1001", q: 3.1, w: 5 }),
    ] },
    { d: "Art", sh: "art", x: 240, y: 0, r: 40, n: 2, sa: 0, al: 0, p: [
      pt("ARTS M1001", "Drawing", 3, { x: 240, y: 0 }),
      pt("ARTS M1002", "Painting", 2, { x: 250, y: 8, ar: 1 }),
    ] },
    { d: "Nursing", sh: "nursing", x: 0, y: 200, r: 40, n: 1, sa: 0, al: 0, p: [
      pt("NRSG M1001", "Fundamentals of Nursing", 10, { x: 0, y: 200 }),
    ] },
  ],
};
const MEM = { colleges: ["Alpha College", "Beta Community College", "Gamma College"],
  counts: { identities: 10, members: 12, dropped_no_key: 0, cn_on_multiple_identities: 0 },
  m: { "WELD M1001": [[101, "WELD 101", 0], [102, "WELD 1A", 1], [103, "WELD 100", 2]] } };
U.islands.forEach((I) => I.p.forEach((nd, k) => { if (!MEM.m[nd.i]) MEM.m[nd.i] = [[200 + k + I.d.length * 100, `${nd.i.split(" ")[0]} ${100 + k}`, k % 3]]; }));
const ATLAS = { _generated_from: "fixture", totals: { decision_components: 0, identities_inbrowser: 9,
                suggestion_groups: 0, member_rows: 12 }, disciplines: [
                { name: "Welding", decisions: 0, ids: 6, members: 8, flagged: 0, reviewed: 0 },
                { name: "Art", decisions: 0, ids: 2, members: 2, flagged: 0, reviewed: 0 },
                { name: "Nursing", decisions: 0, ids: 1, members: 1, flagged: 0, reviewed: 0 }], detail: {} };

/* The CPL payload, in the shape kb/_build_ccr_cpl.py writes. The counts are
 * deliberately unlike the real ones. One credential carries a training agency
 * that differs from its issuer; the others carry none. One exhibit is flagged
 * stale (not in today's feed). */
const CPL = {
  _generated_from: "fixture",
  counts: { points: 10, identities_reached: 3, identities_with_ar: 3, records: 5,
            exhibits_on_map: 4, exhibits_articulated: 777, exhibits_in_feed: 770, exhibits_on_map_not_in_feed: 1,
            credentials: 3, issuers: 3, credentials_with_trainer: 1, trainer_names: 1, colleges: 2,
            by_type: { "Industry Certification": 4, "Credit By Exam": 1 },
            funnel: { rows: 1000, rows_naming_course: 43, exhibits: 6388, exhibits_naming_course: 12, colleges: 9 },
            funnel_read_at: "2026-09-07" },
  types: ["Industry Certification", "Credit By Exam", "Military"],
  colleges: ["Alpha College", "Beta Community College"],
  creds: [
    ["Certified Welder — AWS", "American Welding Society (AWS)", "Welding Training Center of Alpha"],
    ["Introduction to Welding", "California Community Colleges", null],
    ["ASE A5 — Brakes", "National Institute for Automotive Service Excellence (ASE)", null],
  ],
  by: {
    "WELD M1001": [
      [0, [["MAPICI-AWS-1-001", "AWS Certified Welder — SMAW", 0, ["3 hours in shielded metal arc welding"], [0, 1]],
           ["MAPICI-AWS-2-001", "AWS Certified Welder — GMAW", 0, ["3 hours in gas metal arc welding"], [0]]]],
      [1, [["MAPCXN-V1IT-1-001", "VCNST 101: Introduction to Welding", 1, ["3 hours in Introduction to Welding"], [1], 1]]],
    ],
    /* Eight exhibits under one credential, so the six-name cap on the card's
     * exhibit line has something to cut. Rows, not credentials: `ar` is
     * untouched, so the light still counts three points. */
    "WELD M1002": [[0, [["MAPICI-AWS-3-001", "AWS Certified Welder — Advanced", 0, ["2 hours in advanced welding"], [0]],
           ["MAPICI-AWS-3-002", "AWS D1.1 SMAW Plate", 0, ["2 hours in plate welding"], [0]],
           ["MAPICI-AWS-3-003", "AWS D1.1 GMAW Plate", 0, ["2 hours in plate welding"], [0]],
           ["MAPICI-AWS-3-004", "AWS D1.1 FCAW Plate", 0, ["2 hours in plate welding"], [0]],
           ["MAPICI-AWS-3-005", "AWS D1.5 Bridge Welding", 0, ["2 hours in bridge welding"], [0]],
           ["MAPICI-AWS-3-006", "AWS D17.1 Aerospace", 0, ["2 hours in aerospace welding"], [0]],
           ["MAPICI-AWS-3-007", "AWS B2.1 Procedure Qualification", 0, ["2 hours in procedure qualification"], [0]],
           ["MAPICI-AWS-3-008", "AWS D1.1 GTAW Plate", 0, ["2 hours in plate welding"], [0]]]]],
    "ARTS M1002": [[2, [["MAPICI-ASE-5-001", "ASE A5 Brakes", 0, ["2 hours in brakes"], [1]]]]],
  },
};

// ── assemble the page exactly as build_ccr_atlas.py does ────────────────────
const tpl = fs.readFileSync(path.join(ROOT, "prototype/ccr_atlas_v1.html"), "utf8");
const ujs = fs.readFileSync(path.join(ROOT, "prototype/ccr_universe.js"), "utf8");
const safe = (o) => JSON.stringify(o).replace(/<\//g, "<\\/");
const html = tpl.replace("__DATA__", safe(ATLAS)).replace("__GRAPHJS__", "")
  .replace("__ESLDATA__", "null").replace("__ESLJS__", "")
  .replace("__UNIVDATA__", safe(U)).replace("__UNIVMEM__", safe(MEM)).replace("__UNIVJS__", ujs);

/* The recorder context: every stroke() with the style and width it was asked
 * for, so the light — a ring in the lit color — can be counted. */
let strokes = [];
function fakeCtx() {
  const noop = () => {};
  const c = { setTransform: noop, clearRect: noop, fillRect: noop, beginPath: noop, arc: noop, fill: noop,
              closePath: noop, createRadialGradient: () => ({ addColorStop: noop }),
              moveTo: noop, lineTo: noop, save: noop, restore: noop, setLineDash: noop,
              strokeText: noop, fillText: noop, measureText: (t) => ({ width: String(t).length * 6 }),
              fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "", textBaseline: "", globalAlpha: 1 };
  c.stroke = () => { strokes.push([c.strokeStyle, c.lineWidth]); };
  return c;
}
const fetches = [];
const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true,
  url: "https://example.org/prototype/skyview.html",
  beforeParse(window) {
    window.CPL_SKYVIEW_OPENS = "map";   // this suite measures the flat map; the Sky has its own (ccr_skyview_sky.test.js)
    window.HTMLCanvasElement.prototype.getContext = function () { return fakeCtx(); };
    // The payload is bound from the window, the way the harness and a host
    // page can supply it, so no fetch is needed to reach the CPL face.
    window.CPL_CCR_CPL = CPL;
    window.fetch = (url) => { fetches.push(String(url)); return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) }); };
  },
});
const w = dom.window, d = w.document;
const q = (s) => d.querySelector(s);
const qa = (s) => [...d.querySelectorAll(s)];
const st = () => w.__ccrUniverseState();
const tick = () => new Promise((r) => setTimeout(r, 0));
const nodeFor = (id) => { for (const I of w.CPL_CCR_UNIVERSE.islands) for (const p of I.p) if (p.i === id) return p; return null; };
const islFor = (name) => w.CPL_CCR_UNIVERSE.islands.find((I) => I.d === name);
const LIT = "#8B6800";   // --sky-lit on the light canvas (the PAL_LIGHT fallback jsdom lands on)

(async () => {
  await new Promise((r) => { if (d.readyState === "complete") r(); else w.addEventListener("load", r); });
  await tick();

  // ── (1) two controls next to Show, each a word ────────────────────────────
  const fc = q("#u-face-courses"), fp = q("#u-face-cpl"), lb = q("#u-lit");
  check("(1) the face switch and the light sit in the map's control row", !!fc && !!fp && !!lb &&
    q("#u-bar").contains(fc) && q("#u-bar").contains(lb));
  check("(1) ⭐ every control is a word, never a glyph (Sam's glyph rule)",
    [fc, fp, lb].every((b) => /^[A-Za-z ]+$/.test(b.textContent.trim())) &&
    fc.textContent.trim() === "Courses" && fp.textContent.trim() === "CPL" && lb.textContent.trim() === "Articulations");
  check("(1) the pressed state is exposed to assistive tech, Courses first",
    fc.getAttribute("aria-pressed") === "true" && fp.getAttribute("aria-pressed") === "false" && lb.getAttribute("aria-pressed") === "false");
  check("(1) the coverage line and the lit legend entry are hidden until asked for",
    q("#u-face-line").hidden === true && q("#u-lg-lit").hidden === true);
  check("(1) the Show menu keeps its articulation FILTER — the light is a different control",
    !!q('#u-show-menu input[data-show="arty"]') && !!q('#u-show-menu input[data-show="noart"]'));
  check("(1) nothing was fetched for the light or the face on first paint (the payload is on demand)",
    !fetches.some((u) => /ccr_cpl\.json/.test(u)), fetches.join(","));

  // ── (2) the Courses face is what it always was ────────────────────────────
  const zooms = st().labelZooms;
  const titled = zooms.title + 0.05, full = zooms.full + 0.05;
  const lab = (id, k) => w.__ccrLabelLines(nodeFor(id), k);
  check("(2) on the Courses face a point is named by its course", (lab("WELD M1001", titled) || { lines: [""] }).lines[0].indexOf("Introduction to Welding") === 0);
  check("(2) …and a point no exhibit reaches is named too", (lab("WELD M1003", titled) || { lines: [""] }).lines[0].indexOf("Welding Metallurgy") === 0);
  check("(2) the island label is the discipline and its count", w.__ccrIslandLabel(islFor("Welding")) === "Welding (6)");

  // ── (3) switching the face: state, hash, coverage line ────────────────────
  w.__ccrSetFace("cpl");
  await tick();
  check("(3) the face switches and the state says so", st().face === "cpl" && st().cpl === "ok");
  check("(3) the pressed state moved with it", fp.getAttribute("aria-pressed") === "true" && fc.getAttribute("aria-pressed") === "false");
  check("(3) ⭐ the face is a link: #skyview/cpl", String(w.location.hash) === "#skyview/cpl", w.location.hash);
  const line = q("#u-face-line");
  check("(3) ⭐ the CPL face says its own coverage, on the surface, from the payload's counts",
    line.hidden === false && /\b4 of 777 articulated exhibits reach a course on this map/.test(line.textContent), line.textContent);
  check("(3) …and says what an unlabeled point means", /stays drawn and unlabeled/.test(line.textContent));
  check("(3) the coverage sentence carries no literal figure in the source",
    (() => { const m = ujs.match(/function cplLineText\(\)[\s\S]*?\n}/); return !!m && !/\d,\d{3}/.test(m[0]); })());
  check("(3) the canvas height accounts for the line (the contract fitCanvas reads)",
    /lineEl&&!lineEl\.hidden\)\?lineEl\.offsetHeight/.test(ujs));

  // ── (4) the CPL face's labels ─────────────────────────────────────────────
  const l1 = lab("WELD M1001", titled);
  check("(4) ⭐ the point is named by the credential that reaches it, most-held first",
    !!l1 && l1.lines[0] === "Certified Welder — AWS +1", JSON.stringify(l1));
  const l1f = lab("WELD M1001", full);
  check("(4) the full band adds the issuing agency AND the training agency where it differs",
    !!l1f && l1f.lines.length === 2 && /American Welding Society/.test(l1f.lines[1]) && /trained by Welding Training/.test(l1f.lines[1]), JSON.stringify(l1f));
  const l2f = lab("ARTS M1002", full);
  check("(4) a credential with no separate trainer names the issuer alone",
    !!l2f && /National Institute/.test(l2f.lines[1]) && !/trained by/.test(l2f.lines[1]), JSON.stringify(l2f));
  check("(4) ⭐ a point no exhibit reaches is UNLABELED — no gray, no hollow, no \"none\"",
    lab("WELD M1003", titled) === null && lab("WELD M1004", full) === null && lab("NRSG M1001", full) === null);
  check("(4) a stand-alone nothing reaches is unlabeled too", lab("WELD M10ZZ", full) === null);
  check("(4) the island label says how many credentials reach it — and only where any does",
    w.__ccrIslandLabel(islFor("Welding")) === "Welding (6) · 2 credentials" && w.__ccrIslandLabel(islFor("Nursing")) === "Nursing (1)",
    w.__ccrIslandLabel(islFor("Welding")) + " | " + w.__ccrIslandLabel(islFor("Nursing")));

  // ── (5) the hover leads with the credential ───────────────────────────────
  const tip1 = w.__ccrTipHtml({ nd: nodeFor("WELD M1001"), isl: islFor("Welding") });
  check("(5) ⭐ credential → issuer → trainer → what it earns → who holds it → the course last",
    /^<b>Certified Welder — AWS<\/b>/.test(tip1) && /American Welding Society/.test(tip1) && /Training: Welding Training Center/.test(tip1) &&
    /earns 3 hours in shielded metal arc welding/.test(tip1) && /held by 2 colleges/.test(tip1) && /2 credentials reach WELD M1001/.test(tip1) &&
    tip1.indexOf("Certified Welder") < tip1.indexOf("American Welding") && tip1.indexOf("American Welding") < tip1.indexOf("WELD M1001"), tip1);
  const tip2 = w.__ccrTipHtml({ nd: nodeFor("ARTS M1002"), isl: islFor("Art") });
  check("(5) no trainer line when the credential names none", /ASE A5/.test(tip2) && !/Training:/.test(tip2), tip2);
  const tip3 = w.__ccrTipHtml({ nd: nodeFor("WELD M1003"), isl: islFor("Welding") });
  check("(5) a point nothing reaches still answers a hover — as the course it is", /Welding Metallurgy/.test(tip3) && !/Certified Welder/.test(tip3), tip3);

  // ── (6) the panel ─────────────────────────────────────────────────────────
  w.__ccrGoSuggestion({ kind: "course", isl: islFor("Welding"), nd: nodeFor("WELD M1001"), label: "Introduction to Welding" });
  await tick();
  let det = q("#u-detail").innerHTML;
  const at = (re) => { const m = det.search(re); return m; };
  check("(6) the panel opened on the course", st().sel === "WELD M1001");
  check("(6) ⭐ on the CPL face the credentials LEAD the college courses",
    at(/Credit for prior learning reaching this course/) > 0 && at(/Credit for prior learning/) < at(/<ul class="mlist">/), `cpl@${at(/Credit for prior learning/)} members@${at(/<ul class="mlist">/)}`);
  check("(6) the block names the count and the join",
    /2 credentials, 3 exhibits/.test(det) && /joined through the receiving college course/.test(det));
  check("(6) each credential carries its issuer, and the trainer only where it differs",
    /Issued by American Welding Society \(AWS\) · training by Welding Training Center of Alpha/.test(det) &&
    /Issued by California Community Colleges<\/div>/.test(det));
  check("(6) what it earns, who holds it, and the exhibit a college typed",
    /3 hours in shielded metal arc welding/.test(det) && /Alpha, Beta ·/.test(det) && /MAP exhibit: AWS Certified Welder — SMAW/.test(det));
  check("(6) ⭐ an exhibit missing from today's feed is flagged in words, never dropped",
    /not in today’s feed/.test(det) && det.indexOf("VCNST 101") < det.indexOf("not in today’s feed"));
  // Courses face: the block follows the members, and only for an articulated course.
  w.__ccrSetFace("courses"); await tick();
  det = q("#u-detail").innerHTML;
  check("(6) on the Courses face the same block FOLLOWS the college courses",
    at(/Credit for prior learning/) > at(/<ul class="mlist">/), `cpl@${at(/Credit for prior learning/)} members@${at(/<ul class="mlist">/)}`);
  w.__ccrGoSuggestion({ kind: "course", isl: islFor("Welding"), nd: nodeFor("WELD M1003"), label: "Welding Metallurgy" });
  await tick();
  check("(6) …and a course with no articulation carries no block there", !/Credit for prior learning/.test(q("#u-detail").innerHTML));
  w.__ccrSetFace("cpl"); await tick();
  det = q("#u-detail").innerHTML;
  check("(6) ⭐ on the CPL face an empty answer states the ceiling in words — from the funnel counts",
    /No MAP exhibit reaches this course/.test(det) && /Absence here is not evidence/.test(det) && /4 of 777/.test(det) && /4\.3% of its rows/.test(det), det.slice(0, 400));

  // ── (7) the discipline panel on the CPL face ──────────────────────────────
  w.__ccrGoSuggestion({ kind: "subject", isl: islFor("Welding"), label: "Welding" });
  await tick();
  det = q("#u-detail").innerHTML;
  check("(7) the discipline panel says what reaches it, most-held first",
    /<strong>2<\/strong> credentials reach 2 courses in this discipline/.test(det) &&
    det.indexOf("Certified Welder — AWS") < det.indexOf("Introduction to Welding</button>"), det.slice(0, 600));
  w.__ccrGoSuggestion({ kind: "subject", isl: islFor("Nursing"), label: "Nursing" });
  await tick();
  check("(7) a discipline nothing reaches says so, with the ceiling", /No MAP exhibit reaches a course in this discipline/.test(q("#u-detail").innerHTML));

  // ── (8) search switches with the face ─────────────────────────────────────
  const sug = (t) => w.__ccrSuggest(t, 60) || [];
  const agency = sug("american").find((s) => s.kind === "cpl" && s.kindWord === "agency");
  check("(8) ⭐ typing an agency finds it, with the courses it reaches",
    !!agency && agency.label === "American Welding Society (AWS)" && agency.ids.indexOf("WELD M1001") >= 0 && agency.ids.indexOf("WELD M1002") >= 0, JSON.stringify(agency && agency.label));
  const cred = sug("welder").find((s) => s.kind === "cpl" && s.kindWord === "credential");
  check("(8) a credential name is found", !!cred && cred.label === "Certified Welder — AWS");
  const rec = sug("shielded").find((s) => s.kind === "cpl" && s.kindWord === "credit recommendation");
  check("(8) a credit recommendation is found by its words", !!rec && /shielded metal arc welding/.test(rec.label));
  check("(8) ⭐ on the CPL face course titles give way to the vocabulary", !sug("welding").some((s) => s.kind === "course") &&
    sug("welding").some((s) => s.kind === "subject"), JSON.stringify(sug("welding").map((s) => s.kind)));
  check("(8) the kind is a word on the row", ["CREDENTIAL", "AGENCY", "CREDIT REC"].indexOf(agency.kindShort) >= 0 && /reaches 2 courses/.test(agency.sub));
  // The dropdown renders the new kind.
  const gq = q("#gq");
  gq.value = "american"; gq.dispatchEvent(new w.Event("input", { bubbles: true }));
  await tick();
  check("(8) the dropdown renders an agency row with its kind word", qa("#sug li[role=option] .sg-k").some((e) => e.textContent === "AGENCY"));
  // A pick rings every course it reaches — on its own, so the earlier picks are cleared first.
  w.__ccrClearSelection();
  w.__ccrGoSuggestion(agency);
  await tick();
  check("(8) ⭐ picking the agency rings both courses it reaches and makes a chip", st().hits === 2 && st().tokens.indexOf("American Welding Society (AWS)") >= 0, `hits=${st().hits} tokens=${st().tokens}`);
  w.__ccrClearSelection();
  w.__ccrUniverseSearch("brakes");
  await tick();
  check("(8) Enter on a term searches the vocabulary: one hit opens the course it reaches", st().hits === 1 && st().sel === "ARTS M1002", `hits=${st().hits} sel=${st().sel}`);
  w.__ccrClearSelection();
  w.__ccrSetFace("courses"); await tick();
  check("(8) on the Courses face the vocabulary is out of the way again", !sug("american").some((s) => s.kind === "cpl") && sug("welding").some((s) => s.kind === "course"));

  // ── (9) the light: what has a number glows, the rest is untouched ─────────
  const litRings = () => strokes.filter(([s, wd]) => s === LIT && wd === 1.6).length;
  const litIslands = () => strokes.filter(([s, wd]) => s === LIT && wd === 2).length;
  strokes = [];
  w.__ccrUniverseFly(-200, 0, 1.0);   // Welding at a zoom that draws courses; Art is on screen too
  await tick();
  check("(9) with the light off the draw path asks for no lit ring at all", litRings() === 0 && litIslands() === 0, `${litRings()}/${litIslands()}`);
  w.__ccrSetLit(true);
  await tick();
  check("(9) the switch reads pressed and the legend names the glow in words",
    lb.getAttribute("aria-pressed") === "true" && q("#u-lg-lit").hidden === false && /gold glow/.test(q("#u-lg-lit").textContent));
  strokes = [];
  w.__ccrUniverseFly(-200, 0, 1.0);
  await tick();
  check("(9) ⭐ exactly the three articulated points are lit — the seven others are drawn as they are",
    litRings() === 3, `lit rings=${litRings()}`);
  strokes = [];
  w.__ccrUniverseFly(0, 0, 0.1);      // below NODE_ZOOM: disciplines only
  await tick();
  check("(9) ⭐ below the course zoom a discipline holding a lit course carries the ring, and Nursing does not",
    litIslands() === 2 && litRings() === 0, `islands=${litIslands()} rings=${litRings()}`);
  w.__ccrSetLit(false);
  strokes = [];
  w.__ccrUniverseFly(-200, 0, 1.0);
  await tick();
  check("(9) the light goes out completely", litRings() === 0 && litIslands() === 0);
  check("(9) the light's color is a token, in both themes, and the palette reads it",
    /--sky-lit:#8B6800/.test(tpl) && /--sky-lit:#E3B341/.test(tpl) && /lit:"#8B6800"/.test(ujs) && /\.u-sw\.lit\{/.test(tpl));

  // ── (10) the legend's `unified` gloss (v4 item 8) and the id hovers ───────
  const legend = qa(".u-legend span");
  const uni = legend.find((s) => /^unified/.test(s.textContent.trim()));
  check("(10) ⭐ `unified` carries a note like every other entry", !!uni && uni.textContent.trim().length > 30 && /synthetic row/.test(uni.textContent), uni && uni.textContent);
  check("(10) M-ID, C-ID and CCN carry their meaning as a hover",
    legend.filter((s) => /^(M-ID|C-ID|CCN)/.test(s.textContent.trim())).every((s) => (s.getAttribute("title") || "").length > 20));

  // ── (11) the outline of record carries the agencies (Sam's note) ──────────
  w.__ccrOutline("WELD M1001");
  await tick();
  let ol = q("#ol-cpl");
  check("(11) the CPL layer is BUILT — no longer 'not built'", !!ol && !/not built/.test(ol.textContent) && !ol.classList.contains("empty"));
  check("(11) ⭐ issuing agency and, where it differs, the training agency — on the course outline of record",
    /Issued by American Welding Society \(AWS\) · training by Welding Training Center of Alpha/.test(ol.innerHTML) &&
    /Issued by California Community Colleges<\/div>/.test(ol.innerHTML));
  check("(11) the layer's tag counts the credentials", /2 credentials/.test(ol.querySelector(".ol-lh").textContent));
  check("(11) the source line states the coverage and the funnel's ceiling, from the counts",
    /4 of 777/.test(ol.querySelector(".ol-src").textContent) && /4\.3% of its rows/.test(ol.querySelector(".ol-src").textContent));
  check("(11) what it earns and who holds it are on the outline too", /3 hours in shielded metal arc welding/.test(ol.textContent) && /Alpha, Beta ·/.test(ol.textContent));
  w.__ccrOutline("WELD M1003");
  await tick();
  ol = q("#ol-cpl");
  check("(11) a course nothing reaches says so — a gap in the record, not a finding",
    !!ol && ol.classList.contains("empty") && /Absence here is not evidence/.test(ol.textContent) && /none reaches it/.test(ol.textContent));

  // ── (12) routing: the hash restores the face ──────────────────────────────
  w.__ccrUniverse({ solo: true });
  await tick();
  check("(12) back on the map, the face is what it was left at", st().face === "courses");
  w.location.hash = "#skyview/cpl";
  w.dispatchEvent(new w.Event("hashchange"));
  await tick();
  check("(12) ⭐ #skyview/cpl opens the CPL face", st().face === "cpl", st().face);
  w.location.hash = "#skyview";
  w.dispatchEvent(new w.Event("hashchange"));
  await tick();
  check("(12) …and Back to #skyview puts the course names back", st().face === "courses", st().face);

  /* ── (13) ⭐ THE EXHIBIT NAMES, ON THE CARD, ABOVE THE FOLD (Sam, 2026-09-10)
   * "Add the name of any articulated exhibits to the course description card
   * for the MID as well" — and, on the decision sheet, the surface: "I would
   * like the exhibits list on the course cards in course view (not just CPL
   * view) when the Articulations chip is selected."
   *
   * ⚠️ THE SHEET'S FIRST ANSWER WAS "THEY ARE ALREADY THERE", AND THAT ANSWER
   * WAS TRUE AND USELESS. Check (6) above already asserts `MAP exhibit: AWS
   * Certified Welder — SMAW` renders on the Courses face — it passed the whole
   * time Sam was asking for it. It renders as the last muted line of a nested
   * block, below the description and below every member row: 55 of them on the
   * FIRE 110 X he was looking at. So these checks are about POSITION, not
   * presence, which is the same lesson S250 wrote up one surface over.
   *
   * ⚠️ AND THE LIGHT NOW REPAINTS THE PANEL. The chip decides what an OPEN card
   * says, so a chip that repainted only the canvas would land the line on the
   * next course opened. Check (13d) turns it on with the card already open. */
  w.__ccrSetFace("courses"); await tick();
  w.__ccrSetLit(false); await tick();
  w.__ccrGoSuggestion({ kind: "course", isl: islFor("Welding"), nd: nodeFor("WELD M1001"), label: "Introduction to Welding" });
  await tick();
  check("(13) with the chip OFF the card is exactly what it was", !q("#u-detail .u-exl"));

  w.__ccrSetLit(true); await tick();
  let exl = q("#u-detail .u-exl");
  check("(13a) ⭐ the chip names the exhibits on the card, in course view", !!exl, q("#u-detail").innerHTML.slice(0, 200));
  check("(13a) all three, by name, with the count",
    !!exl && /3\b/.test(exl.textContent) &&
    /AWS Certified Welder — SMAW/.test(exl.textContent) &&
    /AWS Certified Welder — GMAW/.test(exl.textContent) &&
    /VCNST 101: Introduction to Welding/.test(exl.textContent), exl && exl.textContent);
  {
    const h = q("#u-detail").innerHTML;
    check("(13b) ⭐ ABOVE the member list — the position IS the fix",
      h.indexOf('class="u-exl') < h.indexOf('<ul class="mlist">'),
      `line@${h.indexOf('class="u-exl')} members@${h.indexOf('<ul class="mlist">')}`);
    check("(13b) …and the full block still follows it, uncut",
      h.indexOf('<ul class="mlist">') < h.indexOf("Credit for prior learning") &&
      /3 hours in shielded metal arc welding/.test(h));
  }

  /* (13c) The cap. Eight exhibits, six named, and the tail says how many are
   * held back AND where they are — a truncation that does not name its
   * remainder is just a shorter lie. */
  w.__ccrGoSuggestion({ kind: "course", isl: islFor("Welding"), nd: nodeFor("WELD M1002"), label: "Advanced Welding" });
  await tick();
  exl = q("#u-detail .u-exl");
  check("(13c) a long list is capped at six names, and says how many more",
    !!exl && /8\b/.test(exl.textContent) && /and 2 more/.test(exl.textContent) &&
    /AWS D1\.1 SMAW Plate/.test(exl.textContent) && !/AWS D1\.1 GTAW Plate/.test(exl.textContent),
    exl && exl.textContent);
  check("(13c) …and it says where the rest are, rather than stopping",
    !!exl && /Credit for prior learning/.test(exl.textContent));

  /* (13d) The repaint. The card is ALREADY open; the chip has to change it. */
  w.__ccrSetLit(false); await tick();
  check("(13d) chip off, card open: the line goes with it", !q("#u-detail .u-exl"));
  w.__ccrSetLit(true); await tick();
  check("(13d) ⭐ chip on, card still open: the line arrives WITHOUT reopening the course",
    !!q("#u-detail .u-exl"), q("#u-detail").innerHTML.slice(0, 200));

  /* (13e) Absence is not a finding on this feed — the same reason the light
   * marks presence only. A course nothing reaches grows no line at all. */
  w.__ccrGoSuggestion({ kind: "course", isl: islFor("Welding"), nd: nodeFor("WELD M1003"), label: "Welding Metallurgy" });
  await tick();
  check("(13e) ⭐ a course no exhibit reaches says nothing, rather than \"none\"",
    !q("#u-detail .u-exl") && !/no exhibit|none/i.test((q("#u-detail .u-exl") || { textContent: "" }).textContent));

  /* (13f) The CPL face already led with the credentials, and must not now
   * carry the same names twice. */
  w.__ccrSetFace("cpl"); await tick();
  w.__ccrGoSuggestion({ kind: "course", isl: islFor("Welding"), nd: nodeFor("WELD M1001"), label: "Introduction to Welding" });
  await tick();
  check("(13f) on the CPL face the credentials still lead and the line is not repeated",
    !q("#u-detail .u-exl") && /Credit for prior learning reaching this course/.test(q("#u-detail").innerHTML));
  w.__ccrSetFace("courses"); await tick();

  /* (13g) The outline card, whose own CPL layer is the fourth section down and
   * collapsible — so without this the card could name a course and no exhibit
   * until somebody opened the layer. */
  w.__ccrOutline("WELD M1001");
  await tick();
  const oex = q(".ol .u-exl");
  check("(13g) the outline card names them too, above Sam's MAP-Generated line",
    !!oex && /AWS Certified Welder — SMAW/.test(oex.textContent), oex && oex.textContent);
  {
    const h = q("#view").innerHTML;
    check("(13g) …above the description layer, not buried under it",
      h.indexOf('class="u-exl') < h.indexOf('id="ol-desc"') &&
      h.indexOf('class="u-exl') < h.indexOf('id="ol-cpl"'));
  }
  check("(13g) every word of it is a word — no glyph stands in for a label",
    !!oex && !/[←-⇿☀-➿\uD83C-\uDBFF]/.test(oex.textContent), oex && oex.textContent);

  done();
})().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
