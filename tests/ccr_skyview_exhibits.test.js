// SkyView — CPL is a UNIVERSE, not a lens (Sam, 2026-09-10).
//
// "another universe where the entities are exhibits rather than courses … a
// Firefighter 1 Exhibit would be like a MID grouping showing all the local
// exhibits as members of the group as if they were courses. Then we would show
// the course(s), perhaps on the exhibit cards, that have CPL based on the
// exhibit." The CPL word beside Courses now swaps the payload under the same
// map: a second file (kb/_build_ccr_cpl_universe.py) places one point per
// curated credential, and its members file carries the local MAP exhibits
// folded into each and the course identities articulated to it.
//
// This supersedes the S238 "CPL face" (a relabeling of the course points by
// the credential that reached them): tests/ccr_skyview_cpl_face.test.js keeps
// the checks that still hold on the Courses map — the Articulations light, the
// exhibit names on a course card, the outline's CPL layer — and the face-only
// checks moved here as universe checks.
//
// ⚠️ WHAT THIS FILE CANNOT SEE. jsdom has no layout and no canvas: the
// statewide second ring is asserted as the stroke the draw path asks for, and
// the pixels were checked in Chromium against the served page (the lane
// records the screenshot). Where a check reads the source, the regex is the
// contract and the sentence beside it says why.
//
// Run from repo root: `npm test` (or `node tests/ccr_skyview_exhibits.test.js`).
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

/* ── the course universe: two disciplines, one articulated course in each ── */
const pt = (i, t, n, extra) => Object.assign({ i, t, n, s: 0, f: 0, r: 0, u: 3, c: 0, x: 0, y: 0 }, extra || {});
const U = {
  _generated_from: "fixture",
  counts: { identities: 3, stand_alone: 0, points: 3, orbiting: 0, orbiting_cross: 0, rim: 0, disciplines: 2 },
  why_bits: { subject: 1, subj4: 2, title: 4, top: 8, units: 16, credit: 32 },
  bounds: { x0: -400, x1: 400, y0: -300, y1: 300 },
  islands: [
    { d: "Fire Technology", sh: "fire-technology", x: -200, y: 0, r: 60, n: 2, sa: 0, al: 0, p: [
      pt("FIRE M1001", "Firefighter 1 Academy", 3, { x: -200, y: 0, ar: 1 }),
      pt("FIRE M1002", "Fire Behavior", 2, { x: -170, y: 20 }) ] },
    { d: "Business", sh: "business", x: 240, y: 0, r: 40, n: 1, sa: 0, al: 0, p: [
      pt("BUS M1001", "Keyboarding", 2, { x: 240, y: 0, ar: 1 }) ] },
  ],
};
const MEM = { colleges: ["Alpha College", "Beta Community College", "Gamma College"],
  counts: { identities: 3, members: 7, dropped_no_key: 0, cn_on_multiple_identities: 0 },
  m: { "FIRE M1001": [[101, "FIRE 110", 0], [102, "FIRE 1", 1], [103, "FIRE 100", 2]],
       "FIRE M1002": [[201, "FIRE 120", 0], [202, "FIRE 2", 1]],
       "BUS M1001": [[301, "BUS 101", 1], [302, "BUS 1A", 2]] } };
const ATLAS = { _generated_from: "fixture", totals: { decision_components: 0, identities_inbrowser: 3,
                suggestion_groups: 0, member_rows: 7 }, disciplines: [
                { name: "Fire Technology", decisions: 0, ids: 2, members: 5, flagged: 0, reviewed: 0 },
                { name: "Business", decisions: 0, ids: 1, members: 2, flagged: 0, reviewed: 0 }], detail: {} };

/* ── the exhibit universe, in the shape kb/_build_ccr_cpl_universe.py writes ──
 * Four credentials. Firefighter 1 is statewide, articulated to one course and
 * folds two local exhibits; EMT Basic carries two CPL types and no course;
 * Wildland Firefighter carries no type and no issuer (the two "not recorded"
 * branches); 10-Key sits in Business, articulated. The counts are nothing like
 * the real ones (1,987 / 3,813) on purpose: a literal would fail here. */
const cp = (i, t, n, extra) => Object.assign({ i, t, n, x: 0, y: 0 }, extra || {});
const EXU = {
  _generated_from: "fixture",
  counts: { identities: 4, members: 6, disciplines: 2, articulated: 2, statewide: 1, statewide_articulated: 1, no_discipline: 0, grouped: 3, singleton: 1 },
  cpl_types: ["Credit By Exam", "Industry Certification", "Portfolio Review", "Standardized Assessment", "Military", "Other"],
  bounds: { x0: -400, x1: 400, y0: -300, y1: 300 },
  islands: [
    { d: "Fire Technology", sh: "fire-technology", x: -200, y: 0, r: 70, n: 3, sa: 0, al: 0, xin: 0, p: [
      cp("CPL-firefighter-1-5728d7", "Firefighter 1", 2, { x: -200, y: 0, ar: 3, sw: 1, c: [1], g: "California State Fire Training (SFT)", ss: 33 }),
      cp("CPL-emt-basic-0a1b2c", "EMT Basic", 1, { x: -170, y: 20, c: [1, 4], g: "National Registry of EMTs", ss: 0 }),
      cp("CPL-wildland-firefighter-9f9f9f", "Wildland Firefighter", 1, { x: -230, y: -20, c: [], g: "", ss: 0 }) ] },
    { d: "Business", sh: "business", x: 240, y: 0, r: 40, n: 1, sa: 0, al: 0, xin: 0, p: [
      cp("CPL-10-key-data-entry-2d55ea", "10-Key Data Entry", 2, { x: 240, y: 0, ar: 1, c: [0], g: "", ss: 4 }) ] },
  ],
};
const EXM = {
  counts: { identities_with_members: 4, members: 6, identities_with_courses: 2, courses: 2, local_receiving_courses: 4 },
  m: { "CPL-firefighter-1-5728d7": [["Firefighter I Certificate", 0.9, ""], ["Fire Fighter 1 - SFT", 0.8, "suspect_course_as_exhibit"]],
       "CPL-emt-basic-0a1b2c": [["EMT-B", 0.7, ""]],
       "CPL-wildland-firefighter-9f9f9f": [["Wildland FF Type 2", null, ""]],
       "CPL-10-key-data-entry-2d55ea": [["OFADM 375 10-Key on the Computer - Credit by Exam", 0.55, ""], ["BIT 375 10-KEY", 0.45, ""]] },
  /* `ar` on a point is the count of RECEIVING COLLEGE COURSES under the course
   * identities listed here (the CER's articulation lines) — Firefighter 1: one
   * identity, three lines. tests/ccr_cpl_universe_members_test.py pins that. */
  courses: { "CPL-firefighter-1-5728d7": [["FIRE M1001", "M-ID", "Firefighter 1 Academy", "Fire Technology",
               [["FIRE 110", "Firefighter 1", ["Alpha College"]], ["FIRE 1", "Firefighter I", ["Beta Community College"]], ["FIRE 100", "Fire Fighter 1", ["Gamma College"]]]]],
             "CPL-10-key-data-entry-2d55ea": [["BUS M1001", "M-ID", "Keyboarding", "Business", [["BUS 101", "Keyboarding", ["Beta Community College", "Gamma College"]]]]] },
};

// ── assemble the page exactly as build_ccr_atlas.py does ────────────────────
const tpl = fs.readFileSync(path.join(ROOT, "prototype/ccr_atlas_v1.html"), "utf8");
const ujs = fs.readFileSync(path.join(ROOT, "prototype/ccr_universe.js"), "utf8");
const safe = (o) => JSON.stringify(o).replace(/<\//g, "<\\/");
const html = tpl.replace("__DATA__", safe(ATLAS)).replace("__GRAPHJS__", "")
  .replace("__ESLDATA__", "null").replace("__ESLJS__", "")
  .replace("__UNIVDATA__", safe(U)).replace("__UNIVMEM__", safe(MEM)).replace("__UNIVJS__", ujs);

/* The recorder context: every stroke() with the style and width it was asked
 * for, so the statewide second ring (width 1.1) can be counted. */
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
function build(withExhibits) {
  const fetches = [];
  const dom = new JSDOM(html, {
    runScripts: "dangerously", pretendToBeVisual: true,
    url: "https://example.org/prototype/skyview.html",
    beforeParse(window) {
      window.CPL_SKYVIEW_OPENS = "map";   // the flat map; the Sky has its own suite
      window.HTMLCanvasElement.prototype.getContext = function () { return fakeCtx(); };
      if (withExhibits) { window.CPL_CCR_EXHIBITS = EXU; window.CPL_CCR_EXHIBITS_MEMBERS = EXM; }
      window.fetch = (url) => { fetches.push(String(url)); return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) }); };
    },
  });
  dom.fetches = fetches;
  return dom;
}
const dom = build(true);
const w = dom.window, d = w.document;
const q = (s) => d.querySelector(s);
const qa = (s) => [...d.querySelectorAll(s)];
const st = () => w.__ccrUniverseState();
const text = (s) => (q(s) ? q(s).textContent : "");
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 0));
const nodeFor = (id) => { for (const I of w.CPL_CCR_UNIVERSE.islands) for (const p of I.p) if (p.i === id) return p; return null; };
const islFor = (name) => w.CPL_CCR_UNIVERSE.islands.find((I) => I.d === name);
const FF = "CPL-firefighter-1-5728d7", EMT = "CPL-emt-basic-0a1b2c", WILD = "CPL-wildland-firefighter-9f9f9f", KEY = "CPL-10-key-data-entry-2d55ea";

(async () => {
  await new Promise((r) => { if (d.readyState === "complete") r(); else w.addEventListener("load", r); });
  await tick();

  // ── (1) the page opens on the courses, and the CPL word is a word ─────────
  const fc = q("#u-face-courses"), fp = q("#u-face-cpl");
  check("(1) the two universes are two words in the control row, Courses pressed first",
    !!fc && !!fp && fc.textContent.trim() === "Courses" && fp.textContent.trim() === "CPL" &&
    fc.getAttribute("aria-pressed") === "true" && fp.getAttribute("aria-pressed") === "false");
  check("(1) the state names the universe, and the exhibit payload is not loaded until asked for",
    st().universe === "courses" && st().exhibits === "" && !dom.fetches.some((u) => /ccr_cpl_universe/.test(u)), `${st().universe} ${st().exhibits}`);
  check("(1) the coverage line is hidden on the courses", q("#u-face-line").hidden === true);
  check("(1) the Show menu is the course menu: 17 switches, M-ID among them, no CPL type",
    Object.keys(st().show).length === 17 && "mid" in st().show && !("icert" in st().show), Object.keys(st().show).join(","));

  // ── (2) pressing CPL swaps the payload under the same map ─────────────────
  fp.click(); await tick();
  check("(2) ⭐ CPL binds the exhibit universe: the state, the pressed word, the hash",
    st().universe === "cpl" && st().face === "cpl" && st().exhibits === "ok" &&
    q("#u-face-cpl").getAttribute("aria-pressed") === "true" && q("#u-face-courses").getAttribute("aria-pressed") === "false" &&
    String(w.location.hash) === "#skyview/cpl", `${st().universe} ${st().exhibits} ${w.location.hash}`);
  check("(2) ⭐ the swap is a full render: the control row, the legend and the menu are rebuilt (a stale handle proves it)",
    fp !== q("#u-face-cpl") && !d.contains(fp));
  check("(2) the payload came from the window, so nothing was fetched", !dom.fetches.some((u) => /ccr_cpl_universe/.test(u)), dom.fetches.join(","));
  check("(2) the map is the exhibit payload now: a credential answers to its id", !!nodeFor(FF) && !nodeFor("FIRE M1001"));
  check("(2) ⭐ the light comes on with the universe — the ring is the point of it (Sam: \"circles around the exhibits\")",
    st().lit === true && q("#u-lit").getAttribute("aria-pressed") === "true");
  const line = q("#u-face-line");
  check("(2) ⭐ the coverage line says its own counts, from the payload, on the surface",
    line.hidden === false && /4 credentials folding 6 local MAP exhibits across 2 disciplines; 2 carry an articulation and 1 is statewide\./.test(line.textContent), line.textContent);
  check("(2) the coverage sentence carries no literal figure in the source",
    (() => { const m = ujs.match(/function exLineText\(\)[\s\S]*?\n}/); return !!m && !/\d,\d{3}/.test(m[0]); })());
  check("(2) the hint says what the word did", /<strong>CPL<\/strong>/.test(q("#u-hint").innerHTML) && /Search finds credentials/.test(text("#u-hint")));
  check("(2) the selection, the chips and the search came across empty", st().sel === null && st().tokens.length === 0 && st().hits === 0);

  // ── (3) the legend describes THIS universe ────────────────────────────────
  const legend = () => qa("#u-foot .u-legend span").map((s) => s.textContent.trim());
  check("(3) ⭐ the legend names credentials, the statewide ring and local exhibits — and no M-ID",
    legend().some((t) => /^credential/.test(t)) && legend().some((t) => /^statewide/.test(t)) &&
    legend().some((t) => /^local MAP exhibit/.test(t)) && !legend().some((t) => /^M-ID/.test(t)), legend().join(" | "));
  check("(3) the lit row is shown, in words, and says what glows here", q("#u-lg-lit").hidden === false && /gold glow on a credential/.test(text("#u-lg-lit")));
  check("(3) the statewide swatch is a token, not a hex, in the template", /\.u-sw\.sw\{background:var\(--sky-sys0-stroke\)/.test(tpl));

  // ── (4) labels: the credential's own name, statewide on the label ─────────
  const zooms = st().labelZooms;
  const titled = zooms.title + 0.05, full = zooms.full + 0.05;
  const lab = (id, k) => w.__ccrLabelLines(nodeFor(id), k);
  check("(4) ⭐ a point is named by the credential, and statewide rides the label",
    (lab(FF, titled) || { lines: [""] }).lines[0] === "Firefighter 1 · statewide", JSON.stringify(lab(FF, titled)));
  const lf = lab(FF, full);
  check("(4) the full band adds the issuer, the exhibits folded and the articulations — the ring's own count",
    !!lf && lf.lines.length === 2 && /California State Fire Training \(SFT\) · 2 local exhibits · 3 articulations/.test(lf.lines[1]), JSON.stringify(lf));
  check("(4) a credential with no issuer says so, in words, rather than a blank",
    /issuing agency not recorded · 1 local exhibit$/.test((lab(WILD, full) || { lines: ["", ""] }).lines[1]), JSON.stringify(lab(WILD, full)));
  check("(4) a credential with no articulation carries no count", !/articulation/.test((lab(EMT, full) || { lines: ["", ""] }).lines[1]));
  check("(4) the island label is the discipline and its count of credentials", w.__ccrIslandLabel(islFor("Fire Technology")) === "Fire Technology (3)");
  check("(4) the local exhibit's map label is its title alone — a row with no college takes the other branch",
    /m\.ex \? trunc\(m\.n,34\)/.test(ujs));

  // ── (5) the hover ─────────────────────────────────────────────────────────
  const tip1 = w.__ccrTipHtml({ nd: nodeFor(FF), isl: islFor("Fire Technology") });
  check("(5) ⭐ credential → statewide → issuer → types · exhibits · courses · students · discipline",
    /^<b>Firefighter 1<\/b>/.test(tip1) && /statewide/.test(tip1) && /California State Fire Training/.test(tip1) &&
    /Industry Certification · 2 local exhibits · 3 articulations · 33 students served · Fire Technology/.test(tip1), tip1);
  const tip2 = w.__ccrTipHtml({ nd: nodeFor(EMT), isl: islFor("Fire Technology") });
  check("(5) two CPL types are both named, and no course reads as a sentence, not a zero",
    /Industry Certification · Military/.test(tip2) && /no articulation yet/.test(tip2) && !/statewide/.test(tip2), tip2);
  const tipi = w.__ccrTipHtml({ isl: islFor("Fire Technology") });
  check("(5) an island's hover counts credentials, exhibits folded and articulations — not identities and stand-alones",
    /^<b>Fire Technology<\/b>/.test(tipi) && /3 credentials folding 4 local MAP exhibits · 1 with an articulation/.test(tipi) && !/stand-alone/.test(tipi), tipi);
  const tipm = w.__ccrTipHtml({ nd: nodeFor(FF), isl: islFor("Fire Technology"), mem: { n: "Firefighter I Certificate", conf: 0.9, q: "", ex: true } });
  check("(5) a local exhibit's hover says what it is folded into, with the confidence",
    /^<b>Firefighter I Certificate<\/b>/.test(tipm) && /a local MAP exhibit folded into Firefighter 1 · confidence 90%/.test(tipm), tipm);

  // ── (6) search finds credentials and their local exhibits ─────────────────
  const sug = (t) => w.__ccrSuggest(t, 60) || [];
  const cred = sug("firefighter").find((s) => s.kind === "course");
  check("(6) ⭐ typing a credential finds it, as a credential, with its issuer, discipline and statewide on the row",
    !!cred && cred.kindWord === "credential" && cred.kindShort === "EXHIBIT" && cred.label === "Firefighter 1" &&
    /California State Fire Training \(SFT\) · Fire Technology · statewide/.test(cred.sub), JSON.stringify(cred && [cred.kindWord, cred.kindShort, cred.sub]));
  const mem = sug("fire fighter 1").find((s) => s.kind === "member");
  check("(6) a local exhibit's typed title is found, and the row says what it is",
    !!mem && mem.kindShort === "LOCAL EXHIBIT" && mem.kindWord === "local exhibit" && /Fire Fighter 1 - SFT/.test(mem.label), JSON.stringify(mem && [mem.kindShort, mem.label]));
  check("(6) the S238 vocabulary rows (agency, credit recommendation) are gone: a credential is a point now",
    !sug("california state").some((s) => s.kind === "cpl") && !sug("firefighter").some((s) => s.kind === "cpl"));
  const gq = q("#gq");
  gq.value = "firefighter"; gq.dispatchEvent(new w.Event("input", { bubbles: true }));
  await tick();
  check("(6) the dropdown renders the kind as the word EXHIBIT", qa("#sug li[role=option] .sg-k").some((e) => e.textContent === "EXHIBIT"),
    qa("#sug li[role=option] .sg-k").map((e) => e.textContent).join(","));
  w.__ccrClearSelection();
  w.__ccrUniverseSearch("emt");
  await tick();
  check("(6) Enter on one hit opens the credential", st().hits === 1 && st().sel === EMT, `hits=${st().hits} sel=${st().sel}`);
  w.__ccrClearSelection();

  // ── (7) the exhibit card ──────────────────────────────────────────────────
  w.__ccrGoSuggestion({ kind: "course", isl: islFor("Fire Technology"), nd: nodeFor(FF), label: "Firefighter 1" });
  await tick();
  let det = q("#u-detail").innerHTML;
  check("(7) the card opened on the credential", st().sel === FF && /<h3>Firefighter 1<\/h3>/.test(det));
  check("(7) ⭐ what it is, in chips that are words: a CER unified title, statewide",
    /credential — CER unified title/.test(det) && /class="chip cid"[^>]*>statewide</.test(det));
  check("(7) the issuer, the CPL type, the students served, the exhibits folded and the courses articulated",
    /Issued by <strong>California State Fire Training \(SFT\)<\/strong>/.test(det) && /Industry Certification/.test(det) &&
    /33 students served/.test(det) && /2 local exhibits · 3 articulations/.test(det), det.slice(0, 500));
  check("(7) ⭐ the courses articulated to it are listed — each a door onto the Courses map (Sam: \"show the course(s) … on the exhibit cards\")",
    /Courses articulated to it \(1 course identity · 3 receiving college courses\)/.test(det) && /data-course="FIRE M1001"[^>]*>Firefighter 1 Academy</.test(det) &&
    /3 receiving college courses: FIRE 110 \(Alpha\), FIRE 1 \(Beta\), FIRE 100 \(Gamma\)/.test(det), det.slice(0, 900));
  check("(7) ⭐ the local MAP exhibits folded in, best confidence first, with the flag in words",
    /Local MAP exhibits folded in \(2\)/.test(det) && det.indexOf("Firefighter I Certificate") < det.indexOf("Fire Fighter 1 - SFT") &&
    /90%/.test(det) && /suspect course as exhibit/.test(det), det.slice(-900));
  check("(7) ⭐ nothing is moved from this map — no Drag…, no Move instead…, and the card says where curation lives",
    !/Drag…/.test(det) && !/class="mv"/.test(det) && !/Move instead/.test(det) &&
    /Exhibits are curated in the Credential Reference; nothing is moved from this map\./.test(det));
  check("(7) the course-card CPL block does not render here — it belongs to a course", !/Credit for prior learning reaching this course/.test(det));
  w.__ccrGoSuggestion({ kind: "course", isl: islFor("Fire Technology"), nd: nodeFor(EMT), label: "EMT Basic" });
  await tick();
  det = q("#u-detail").innerHTML;
  check("(7) a credential no course is articulated to says so as a gap in the record, not a finding",
    /Courses articulated to it \(0 course identities\)/.test(det) && /No course is articulated to this credential yet/.test(det) && /a gap in MAP’s record/.test(det));
  w.__ccrGoSuggestion({ kind: "course", isl: islFor("Fire Technology"), nd: nodeFor(WILD), label: "Wildland Firefighter" });
  await tick();
  det = q("#u-detail").innerHTML;
  check("(7) no issuer and no type: both said in words", /Issuing agency not recorded/.test(det) && !/Industry Certification/.test(det));
  check("(7) a local exhibit with no confidence recorded shows no percentage", !/%<\/span>/.test(det));

  // ── (8) the discipline card ───────────────────────────────────────────────
  w.__ccrGoSuggestion({ kind: "subject", isl: islFor("Fire Technology"), label: "Fire Technology" });
  await tick();
  det = q("#u-detail").innerHTML;
  check("(8) the discipline card counts credentials, exhibits folded, articulated and statewide",
    /3 credentials folding 4 local MAP exhibits · 1 with an articulation · 1 statewide\./.test(det), det.slice(0, 300));
  check("(8) its rows carry the issuer and the counts, and no work surface is offered",
    /California State Fire Training \(SFT\) · 2 local exhibits · 3 articulations/.test(det) && !/work surface/i.test(det) && !/Drag this discipline/.test(det));

  // ── (9) the door: a course on the card opens on the Courses map ───────────
  w.__ccrGoSuggestion({ kind: "course", isl: islFor("Fire Technology"), nd: nodeFor(FF), label: "Firefighter 1" });
  await tick();
  q('#u-detail [data-course="FIRE M1001"]').click();
  await tick(); await tick();
  check("(9) ⭐ the click lands on the course, on the Courses map, with the hash back to #skyview",
    st().universe === "courses" && st().sel === "FIRE M1001" && String(w.location.hash) === "#skyview", `${st().universe} ${st().sel} ${w.location.hash}`);
  check("(9) the hint says where the reader is and how to get back",
    /Opened <strong>FIRE M1001<\/strong> on the Courses map/.test(q("#u-hint").innerHTML) && /Press <strong>CPL<\/strong> to return/.test(q("#u-hint").innerHTML));
  check("(9) ⭐ the light is remembered per universe: the Courses map comes back with it OFF, as the reader left it",
    st().lit === false && q("#u-lit").getAttribute("aria-pressed") === "false");
  check("(9) the course card is the course card: its CPL block follows the members",
    // (a swap re-renders the row, so the word is re-queried — a handle from before it is a detached node)
    /Credit for prior learning reaching this course/.test(q("#u-detail").innerHTML) && q("#u-face-courses").getAttribute("aria-pressed") === "true",
    `credit@${q("#u-detail").innerHTML.indexOf("Credit for prior")} mlist@${q("#u-detail").innerHTML.indexOf("<ul class=\"mlist\">")}`);
  w.__ccrSetUniverse("cpl"); await tick();
  check("(9) ⭐ a re-render repaints the staged-moves pane — a swap (or any trip off the map) must not blank a curator's list",
    /restoreTokens\(\);[^\n]*\n\s*drawWrites\(\);/.test(ujs));
  check("(9) …and CPL brings the credentials back, lit, with nothing carried across", st().universe === "cpl" && st().lit === true && st().sel === null && st().tokens.length === 0);

  // ── (10) the Show menu is this universe's ─────────────────────────────────
  const sw = (k) => q(`#u-show-menu input[data-show="${k}"]`);
  check("(10) ⭐ the switches are CPL types, statewide and the light's two — no M-ID, no credit status",
    ["cbe", "icert", "port", "stdz", "mil", "oth", "tna", "sw", "nsw", "members", "arty", "noart"].every((k) => !!sw(k)) && !sw("mid") && !sw("cr"),
    qa("#u-show-menu input[data-show]").map((i) => i.getAttribute("data-show")).join(","));
  check("(10) the state reports those twelve", Object.keys(st().show).length === 12 && Object.values(st().show).every((v) => v === true));
  check("(10) the members switch is worded for this universe", /Local exhibits/.test(q("#u-show-menu").textContent));
  const total = () => st().creditCounts.cr + st().creditCounts.nc + st().creditCounts.unrecorded;
  w.__ccrSetShow({ icert: false }); await tick();
  check("(10) ⭐ a CPL type off hides the credentials carrying it — and a credential with a second type stays",
    st().creditCounts.shown === 3 && /11 of 12/.test(text("#u-show-word")), `${st().creditCounts.shown} of ${total()} · ${text("#u-show-word")}`);
  w.__ccrSetShow({ icert: true, mil: false }); await tick();
  check("(10) …so EMT Basic (certification AND military) goes only when both are off", st().creditCounts.shown === 4);
  w.__ccrSetShow({ icert: false }); await tick();
  check("(10) both off: it is hidden", st().creditCounts.shown === 2, `${st().creditCounts.shown}`);
  w.__ccrSetShow({ icert: true, mil: true, tna: false }); await tick();
  check("(10) the type-not-recorded switch reaches the credential with no type", st().creditCounts.shown === 3);
  w.__ccrSetShow({ tna: true, sw: false }); await tick();
  check("(10) Statewide off hides the statewide credential", st().creditCounts.shown === 3 && /hidden/.test(text("#u-hint")));
  w.__ccrSetShow({ sw: true, noart: false }); await tick();
  check("(10) the articulation filter is the Show menu's here too: no-articulation off leaves the two articulated", st().creditCounts.shown === 2);
  q("#u-show-none").click(); await tick();
  check("(10) Deselect all clears the twelve and the row says 0 of 12",
    st().creditCounts.shown === 0 && /^0 of 12$/.test(text("#u-show-word").trim()) && Object.values(st().show).every((v) => v === false));
  w.__ccrSetUniverse("courses"); await tick();
  check("(10) ⭐ the course map's own switches were not touched by that — one set per universe",
    Object.keys(st().show).length === 17 && Object.values(st().show).every((v) => v === true), JSON.stringify(st().show));
  w.__ccrSetUniverse("cpl"); await tick();
  check("(10) and the CPL map remembers its own", Object.values(st().show).every((v) => v === false));
  q("#u-show-every").click(); await tick();
  check("(10) Show everything brings the four back", st().creditCounts.shown === 4 && /^All$/.test(text("#u-show-word").trim()));

  // ── (11) the statewide second ring, as the stroke the draw path asks for ──
  strokes = [];
  w.__ccrUniverseFly(-200, 0, 1.0); await tick();
  // Label leaders stroke at 1.1 too; the ring is the one in the point's own stroke color (sys0 on the light canvas).
  const ring = strokes.filter(([c, wd]) => c === "#6D28D9" && wd === 1.1).length;
  check("(11) ⭐ exactly one point wears the statewide ring (width 1.1, its own stroke): Firefighter 1", ring === 1, `rings=${ring}`);
  check("(11) the ring is a mark, not a color: it borrows the point's own stroke", /nd\.sw && dr>1\.8\)\{\s*ctx\.beginPath\(\); ctx\.arc\(p\[0\],p\[1\],dr\+3\.2/.test(ujs));

  // ── (12) nothing moves here ───────────────────────────────────────────────
  check("(12) canMove refuses every point of this universe, and says why",
    /if\(isExhibits\(\)\) return \{ok:false, others:\[\], exhibits:true\};/.test(ujs) &&
    /Exhibits are curated in the Credential Reference; nothing is moved from the CPL map\./.test(ujs));

  // ── (13) routes ───────────────────────────────────────────────────────────
  const route = async (h) => { w.location.hash = h; w.dispatchEvent(new w.Event("hashchange")); await tick(); await tick(); };
  await route("#skyview");
  check("(13) #skyview is the courses", st().universe === "courses" && st().face === "courses");
  await route("#skyview/cpl");
  check("(13) ⭐ #skyview/cpl is the credentials", st().universe === "cpl", st().universe);
  await route("#globe/cpl");
  check("(13) the face is a link on every place to stand: #globe/cpl", st().universe === "cpl" && st().proj === "globe", `${st().universe} ${st().proj}`);
  await route("#comprehensive/cpl");
  check("(13) …and in the comprehensive view", st().universe === "cpl" && st().solo === false, `${st().universe} ${st().solo}`);
  await route("#skyview/cpl");
  check("(13) back to SkyView alone, still the credentials", st().universe === "cpl" && st().solo === true);

  // ── (14) the workspace and the outline are the course universe's ──────────
  w.__ccrWorkspace("discipline"); await tick();
  check("(14) ⭐ the Disciplines and subjects tables bind the courses first — an exhibit is not a row there", st().universe === "courses", st().universe);
  w.__ccrUniverse({ solo: true, face: "cpl" }); await tick();
  check("(14) the map comes back as the credentials when asked", st().universe === "cpl");
  w.__ccrOutline("FIRE M1001"); await tick();
  check("(14) an outline of record is a course's: opening one from the CPL map binds the courses", st().universe === "courses" && !!q(".ol"));

  // ── (15) a payload that never comes: the courses stay, and the page says so ──
  const d2 = build(false); const w2 = d2.window;
  await new Promise((r) => { if (w2.document.readyState === "complete") r(); else w2.addEventListener("load", r); });
  w2.location.hash = "#skyview/cpl"; w2.__ccrRoute(); await tick(); await tick(); await tick();
  const st2 = () => w2.__ccrUniverseState();
  check("(15) ⭐ #skyview/cpl with no payload still DRAWS — the courses, with the map on screen",
    !!w2.document.querySelector("#u-cvs") && st2().universe === "courses" && st2().exhibits === "missing", `${st2().universe} ${st2().exhibits}`);
  check("(15) the hint says the exhibit universe could not be loaded, by file name",
    /could not be loaded/.test(w2.document.querySelector("#u-hint").textContent) && /ccr_cpl_universe\.json/.test(w2.document.querySelector("#u-hint").textContent));
  check("(15) the hash falls back with it, and Courses reads pressed",
    String(w2.location.hash) === "#skyview" && w2.document.querySelector("#u-face-courses").getAttribute("aria-pressed") === "true", w2.location.hash);
  check("(15) it asked for the payload once, by its two file names",
    d2.fetches.some((u) => /ccr_cpl_universe\.json/.test(u)) && !d2.fetches.some((u) => /ccr_cpl_universe_members\.json/.test(u)), d2.fetches.join(","));
  w2.document.querySelector("#u-face-cpl").click(); await tick();
  check("(15) pressing CPL again explains again rather than switching to nothing", st2().universe === "courses" && /could not be loaded/.test(w2.document.querySelector("#u-hint").textContent));

  // ── (16) the payload's two files and the one id function ──────────────────
  check("(16) the client fetches the two files the builders write",
    /EXU_URL\s*=\s*[^;]*ccr_cpl_universe\.json/.test(ujs) && /EXM_URL\s*=\s*[^;]*ccr_cpl_universe_members\.json/.test(ujs));
  check("(16) the members builder imports the id function rather than restating it",
    /from _build_ccr_cpl_universe import .*ident_id/.test(fs.readFileSync(path.join(ROOT, "kb/_build_ccr_cpl_universe_members.py"), "utf8")));

  done();
})().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
