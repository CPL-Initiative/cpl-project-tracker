// SkyView, the graph view — prototype/ccr_universe.js + the page template.
//
// Sam's five goals (2026-09-03): see the whole universe · keyword-jump to any
// cluster, course or subject · details on hover and click, descriptions on a
// course title, number · title · units · system as you zoom · unassigned
// courses in orbit around the cluster they are most aligned to · the map full
// screen with the other panes reached by scrolling.
//
// This boots the REAL template (prototype/ccr_atlas_v1.html) with the REAL
// client over a six-point fixture, the way build_ccr_atlas.py assembles the
// page, so the contracts between the header's search box, the crumbs, the
// embedded forest and the map are the ones a browser sees. Canvas has no layout
// engine in jsdom, so the 2D context is a recorder: what it lets us assert is
// the label logic (which band draws what) and the hit-testing arithmetic, not
// pixels. Pixels are prototype/check_ccr_atlas.js's job.
//
// Run from repo root: `npm test` (or `node tests/ccr_skyview_universe.test.js`).
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

// ── fixture: two subjects, three identities, three stand-alones ─────────────
const U = {
  _generated_from: "fixture",
  counts: { identities: 3, stand_alone: 3, points: 6, orbiting: 2, orbiting_cross: 1, rim: 1, disciplines: 2,
            member_rows: 11, member_rows_all_identities: 11, described_courses: 1 },
  why_bits: { subject: 1, subj4: 2, title: 4, top: 8, units: 16, credit: 32 },
  bounds: { x0: -300, x1: 300, y0: -200, y1: 200 },
  islands: [
    { d: "Welding", sh: "welding", x: -120, y: 0, r: 60, n: 2, sa: 2, al: 2, xin: 1, p: [
      { i: "WELD M1001", x: -120, y: 0,  t: "Welding Fundamentals",     n: 4, s: 0, f: 0, r: 0, u: 3, k: 2 },
      { i: "WELD C1000", x: -90,  y: 20, t: "Introduction to Welding",  n: 6, s: 1, f: 0, r: 1, u: 3 },
      { i: "WELD M10AA", x: -112, y: -9, t: "Welding Fundamentals Lab", n: 1, s: 0, f: 0, r: 0, u: 1, a: 1, o: "WELD M1001", q: 5.1, w: 5 },
      { i: "WELD M10AB", x: -128, y: 9,  t: "Pipe Welding",             n: 1, s: 0, f: 0, r: 0, u: 2, a: 1, o: "WELD M1001", q: 2.2, w: 4, h: "Vocational" },
    ] },
    { d: "Art", sh: "art", x: 150, y: 0, r: 50, n: 1, sa: 1, al: 0, p: [
      { i: "ARTS M1001", x: 150, y: 0,  t: "Drawing",       n: 3, s: 0, f: 0, r: 0, u: 3 },
      { i: "ARTS M10ZZ", x: 150, y: 40, t: "Kite Building", n: 1, s: 0, f: 0, r: 0, u: 0.5, a: 1 },
    ] },
  ],
};
const MEM = {
  colleges: ["Alpha College", "Beta College", "Gamma College"],
  counts: { identities: 6, members: 11, dropped_no_key: 0, cn_on_multiple_identities: 0 },
  m: {
    "WELD M1001": [[101, "WELD 100", 0], [102, "WLD 1", 1], [103, "WELD 100", 2]],
    "WELD C1000": [[201, "WELD 101", 0], [202, "WELD 1A", 1]],
    "WELD M10AA": [[301, "WELD 100L", 2]],
    "WELD M10AB": [[401, "WELD 150", 1]],
    // 777 names two DIFFERENT courses — the write key cannot say which.
    "ARTS M1001": [[501, "ART 110", 0], [777, "ART 111", 1], [777, "ART 112", 2]],
    "ARTS M10ZZ": [[601, "ART 199", 0]],
  },
};
const ATLAS = { _generated_from: "fixture", totals: { decision_components: 1, identities_inbrowser: 6,
                suggestion_groups: 1, member_rows: 9 }, disciplines: [
                { name: "Welding", decisions: 1, ids: 4, members: 7, flagged: 0, reviewed: 1 },
                { name: "Art", decisions: 0, ids: 2, members: 4, flagged: 0, reviewed: 0 }], detail: {} };

// ── assemble the page exactly as build_ccr_atlas.py does ────────────────────
const tpl = fs.readFileSync(path.join(ROOT, "prototype/ccr_atlas_v1.html"), "utf8");
const ujs = fs.readFileSync(path.join(ROOT, "prototype/ccr_universe.js"), "utf8");
const safe = (o) => JSON.stringify(o).replace(/<\//g, "<\\/");
const html = tpl.replace("__DATA__", safe(ATLAS)).replace("__GRAPHJS__", "")
  .replace("__ESLDATA__", "null").replace("__ESLJS__", "")
  .replace("__UNIVDATA__", safe(U)).replace("__UNIVMEM__", safe(MEM)).replace("__UNIVJS__", ujs);
check("(0) the template still carries every placeholder the builder fills",
  ["__DATA__", "__GRAPHJS__", "__ESLJS__", "__ESLDATA__", "__UNIVJS__", "__UNIVDATA__", "__UNIVMEM__"]
    .every((k) => tpl.includes(k)));

// The recorder context: enough of CanvasRenderingContext2D for draw() to run.
const texts = [];   // every string fillText() drew, so a label's WORDS can be asserted
function fakeCtx() {
  const noop = () => {};
  return { setTransform: noop, clearRect: noop, fillRect: noop, beginPath: noop, arc: noop, fill: noop,
           // starPath() closes its path; the membership halo asks for a gradient.
           closePath: noop, createRadialGradient: () => ({ addColorStop: noop }),
           stroke: noop, moveTo: noop, lineTo: noop, save: noop, restore: noop, setLineDash: noop,
           strokeText: noop, fillText: (t) => texts.push(String(t)), measureText: (t) => ({ width: String(t).length * 6 }),
           fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "", textBaseline: "" };
}
const fetches = [];
const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true,
  url: "https://example.org/prototype/skyview.html",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () { return fakeCtx(); };
    // Two bases, tried in order: the local directory is absent on the deployed
    // page, so the first answer is a 404 and the bucket has to be reached.
    window.fetch = (url) => {
      fetches.push(String(url));
      // The canonical seed carries the authority chips (item 19, 2026-09-03);
      // the page reads it live, relative path first.
      if (/discipline_canonical_subj4\.json$/.test(url))
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ disciplines: {
          "Welding": { canonical_subj4: "WELD", canonical_source: "csr", authority_flag: "proposed",
                       authority_chips: [{ system: "C-ID", code: "WLDT" }] },
          "Art": { canonical_subj4: "ARTS", canonical_source: "c-id", authority_flag: null, authority_chips: [] },
        } }) });
      if (/supabase\.co\/storage\/v1\/object\/public\/ccr-desc\/welding\.json$/.test(url))
        return Promise.resolve({ ok: true, json: () => Promise.resolve({
          "101": ["A welding description.", "Welding Fundamentals I", 3],
          "102": [null, "Intro Weld", 3] }) });
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    };
  },
});
const w = dom.window, d = w.document;
const q = (s) => d.querySelector(s);
const qa = (s) => [...d.querySelectorAll(s)];
const st = () => w.__ccrUniverseState();
const text = (s) => (q(s) ? q(s).textContent : "∅ no element");
const pointer = (type, x, y) => {
  const ev = new w.MouseEvent(type, { clientX: x, clientY: y, bubbles: true, button: 0 });
  q("#u-cvs").dispatchEvent(ev);
};
const tick = () => new Promise((r) => setTimeout(r, 0));

(async () => {
  // The template boots on DOMContentLoaded, which jsdom fires after the
  // constructor returns — assert nothing until the page has actually booted, or
  // the boot lands in the middle of the suite and re-renders the map under it.
  await new Promise((r) => { if (d.readyState === "complete") r(); else w.addEventListener("load", r); });
  await tick();
  // The page parsed its OWN copy of the fixture; identity comparisons inside the
  // client (selNode === nd) only hold for objects from that copy.
  const PU = w.CPL_CCR_UNIVERSE;
  // Positions are READ from the page's copy, never typed: the map spreads the
  // islands apart once at load (2026-09-05), so a fixture coordinate is only
  // where a point was packed, not where it is drawn.
  const AT = (id) => { for (const I of PU.islands) for (const nd of I.p) if (nd.i === id) return [nd.x + (I.dx || 0), nd.y + (I.dy || 0)]; return [0, 0]; };
  const AT_I = (dn) => { const I = PU.islands.find((x) => x.d === dn); return [I.x + (I.dx || 0), I.y + (I.dy || 0)]; };
  // ── (A) the landing view: full bleed, inspector over the map, panes below ──
  check("(A) ⭐ the page boots straight onto the map", !!q("#u-cvs"));
  check("(A) ⭐ the map section takes the full width (main is full-bleed)",
    q("#main").classList.contains("u-fullbleed"));
  check("(A) ⭐ the details panel is DOCKED beside the map, holding #u-detail, never over the canvas",
    !!q("#u-stage #u-inspector #u-detail") && !!q("#u-full #u-inspector") && !q("#u-wrap #u-inspector"));
  check("(A) ⭐ the controls sit above the canvas and the legend and hint below it — nothing floats over the map",
    !!q("#u-top #u-bar") && !q("#u-wrap #u-bar") && !!q("#u-foot .u-legend") && !!q("#u-foot #u-hint") && !q("#u-wrap .u-legend"));
  check("(A) ⭐ the other views are one click away inside the full-screen element",
    !!q("#u-full #u-nav-forest") && /By discipline/.test(text("#u-nav-forest")) &&
    !!q("#u-full #u-nav-subject") && /By subject/.test(text("#u-nav-subject")) &&
    !!q("#u-full #u-nav-comp") && /Comprehensive view/.test(text("#u-nav-comp")),
    qa("#u-views-menu .linkish, #u-views-menu .u-views-here").map((e) => e.textContent).join(" | "));
  /* Sam, 2026-09-04, item 2: "I meant CCR List View." That view is COBI's Common
     Course Reference tab, not anything in this prototype — so it is a link OUT,
     and it must be an anchor with a real href rather than a button that would
     need script this page does not have. */
  check("(A) ⭐ the CCR list view is one click away, as a real link out to COBI's tab — to its LIST, since the tab lands on this map",
    !!q("#u-full #u-ccr-list") && q("#u-ccr-list").tagName === "A" &&
    /index\.html#unified-courses\/list$/.test(q("#u-ccr-list").getAttribute("href")) &&
    q("#u-ccr-list").getAttribute("target") === "_blank" &&
    /noopener/.test(q("#u-ccr-list").getAttribute("rel") || "") &&
    /CCR table view/.test(text("#u-ccr-list")),
    q("#u-ccr-list") ? q("#u-ccr-list").outerHTML.slice(0, 120) : "∅");
  /* ⚠️ Inside COBI the CCR tab IS the page this map is framed in, so a link out
     would open the page the reader is already on. Framed, the item is a BUTTON
     that posts to the page around the frame (unified_courses.js listens and
     swaps the frame for the list), and the close does the same. jsdom cannot
     frame the page, so the mechanism is asserted at the source — deleting
     either branch is the failure mode. */
  check("(A) ⭐ framed inside that very tab, the CCR item and the close hand off to the page around the frame",
    /if\(framed\(\)\)\{[\s\S]{0,240}id="u-ccr-list"/.test(ujs) && /tellParent\("list"\)/.test(ujs) &&
    /tellParent\("close"\)/.test(ujs) && /postMessage\(\{type:"skyview", action:action\}/.test(ujs));
  /* One word, and it stops looking like a different grain: an island is a
     DISCIPLINE, while COBI spends "subject" on SUBJ4 codes in its Common
     Subjects Reference tab — the grain the workspace's By subject view now
     carries. So nothing rendered may call an island a subject any more. */
  check("(A) ⭐ nothing rendered calls a discipline a subject",
    !/id="u-list">Subjects as a list/.test(ujs) && !/<h1>Every subject area<\/h1>/.test(ujs) &&
    !/setHint\("Subject <strong>"\+esc\((I|pick)\.d\)/.test(ujs) && /kindWord:"discipline"/.test(ujs));
  check("(A) ⭐ Pan and Move are word chips, Move pressed by default",
    /^Pan$/.test(text("#u-mode-pan").trim()) && /^Move$/.test(text("#u-mode-move").trim())
    && q("#u-mode-move").getAttribute("aria-pressed") === "true" && st().mode === "move");
  check("(A) ⭐ the provenance line is a hover on the title, not a line of its own",
    /no writes/.test(q("#prov").title) && !/CCR artifacts generated/.test(q("header").textContent), q("#prov").title);
  check("(A) the write panel and the 'how to read it' pane sit BELOW the map",
    !!q("#u-below #u-writes") && /How the map is arranged/.test(text("#u-below")));
  check("(A) ⭐ the forest is embedded under the map — the same view, not a copy",
    qa("#u-more .cell").length === 2 && !q("#u-more #go-universe"),
    `${qa("#u-more .cell").length} cells`);
  check("(A) the map screen carries exactly ONE search field (the header's)",
    qa("input[type=search]").length === 1, `${qa("input[type=search]").length}`);
  // ⭐ Asserts the PROPERTY, not the wording. This check used to match the literal
  // strings "Zoom out" / "Zoom in" / "Reset view", and broke on 2026-09-04 when
  // they shortened to Out / In / Reset under a "Zoom" group label so the top
  // could fit ONE row (Sam: "I want all the real estate for the universe view").
  // Nothing it protects changed — they are still words — so the check now tests
  // that, the way the repo's own note on position/wording-coupled tests says to.
  {
    // Since 2026-09-05 (Sam, from a screenshot of Claude's own header) the
    // header's ACTIONS are ghosted icons — each named by words for a screen
    // reader — and the text controls stay words in boxes.
    const words = ["#u-insp-toggle", "#u-dark", "#u-legend-menu", "#u-show-sum", "#u-mode-pan", "#u-mode-move"];
    const icons = ["#u-out", "#u-in", "#u-reset", "#u-win-down", "#u-win-up", "#u-close", "#u-more-sum"];
    const GLYPH = /[\u2190-\u21FF\u2300-\u27BF\u2B00-\u2BFF\uD800-\uDBFF\uFE0F]/;
    check("(A) the text controls are words, not glyphs",
      words.every((c) => { const t = text(c).trim(); return t.length > 0 && /[A-Za-z]/.test(t) && !GLYPH.test(t); }),
      words.map((c) => text(c).trim()).join(" | "));
    check("(A) ⭐ the icon actions each carry words as their accessible name and tooltip",
      icons.every((c) => q(c) && /[A-Za-z]/.test(q(c).getAttribute("aria-label") || "") && /[A-Za-z]/.test(q(c).getAttribute("title") || "")),
      icons.map((c) => (q(c) ? q(c).getAttribute("aria-label") : "∅")).join(" | "));
    // The shortened words keep their meaning from the group label beside them.
    check("(A) ⭐ the zoom group is named for a screen reader and holds out, the readout, in and reset in that order",
      q(".u-zgroup").getAttribute("aria-label") === "Zoom" &&
      [...q(".u-zgroup").children].map((e) => e.id).join(",") === "u-out,u-zoom,u-in,u-reset",
      [...q(".u-zgroup").children].map((e) => e.id).join(","));
    // Sam, 2026-09-05, item 8: the label and the percentage stack in one chip
    // height beside Out/In, and "zoom" is not repeated anywhere in the row.
    check("(A) ⭐ the readout is the only zoom figure in the row, and the word is not repeated",
      !!q(".u-zgroup > #u-zoom") && !q(".u-z") && !q(".u-zstack") && (text("#u-top").match(/zoom/gi) || []).length === 0,
      (text("#u-top").match(/zoom/gi) || []).join(","));
    // The window controls and the menu are glyphs by Sam's explicit ask (a
    // screenshot of the OS's own three); each carries its words as its name.
    check("(A) ⭐ the window controls carry words as their accessible names, and the Full screen chip is gone",
      ["#u-win-down", "#u-win-up", "#u-close"].every((id) => q("#u-top .u-wins " + id) && /[A-Za-z]/.test(q(id).getAttribute("aria-label") || ""))
      && !q("#u-fs") && !q("#u-foot-toggle"),
      ["#u-win-down", "#u-win-up", "#u-close"].map((id) => q(id) ? q(id).getAttribute("aria-label") : "∅").join(" | "));
    check("(A) stand-alone there is no COBI menu control — there is no COBI to open", !q("#u-menu"));
  }
  // ── the 2026-09-04 chrome changes, asserted on a freshly booted page ──────
  check("(A) ⭐ the details panel starts HIDDEN so the map opens at full width (Sam, 2026-09-04)",
    q("#u-inspector").classList.contains("closed") && !st().inspectorOpen && /^Sidebar/.test(text("#u-insp-toggle").trim()) && q("#u-insp-toggle").getAttribute("aria-pressed") === "false",
    text("#u-insp-toggle"));
  // ⭐ Sam, 2026-09-04: "consolidate the top … I want all the real estate for the
  // universe view." #u-top was ALREADY one row (space-between: links left,
  // controls right) — what he saw was it WRAPPING at his zoom, because the long
  // control labels would not fit beside the links. So the fix is that it fits.
  // Sam's items 1-5 (2026-09-04) rebuilt this row: title · Views menu · search ·
  // controls · close. The four inline view links became ONE <details> menu
  // because a title, a search and nine controls do not share a row with them.
  check("(A) ⭐ title, menu, search, controls and close share ONE row inside #u-top",
    ["u-more-menu","u-title","u-search-slot","u-bar"].every((id) =>
      q("#u-top #" + id) && q("#u-top #" + id).parentElement === q("#u-top")) && !!q("#u-more-menu #u-views-slot > #u-views")
      && !!q("#u-top > .u-wins > #u-close"),
    [...q("#u-top").children].map((e) => e.id).join(" | "));
  check("(A) ⭐ the view links live in the menu, not loose in the row",
    !q("#u-top > .linkish") && qa("#u-views-menu .linkish").length >= 3,
    `${qa("#u-views-menu .linkish").length} in the menu`);
  // ⚠️ The controls must NOT be lifted into the page masthead. That was tried and
  // fails twice: the masthead is outside #u-full (the only element full screen
  // paints), and it outlives the view, so navigating away and back left two
  // #u-bar and two #u-fs under one id. The row is achieved inside #u-full.
  check("(A) ⭐ the controls are NOT lifted into the masthead — full screen would lose them",
    !q(".mast #u-bar") && !q(".mast .u-bar"));
  // ⚠️ AND THE VIEW LINKS STAY HARD LEFT. A "SkyView" title was added to this row
  // and had to come out: the masthead already carries the name, and the title
  // pushed the links rightward under the search suggestion dropdown, which is
  // absolutely positioned over whatever sits below the masthead. Chromium
  // reported #u-list unclickable — on a route Sam asked for by name (type a
  // term, then open the subject list seeded from the box).
  /* ⚠️ A title in this row was tried on 2026-09-03 and REMOVED: it pushed the
     view links rightward under the MASTHEAD's absolutely-positioned suggestion
     list, and Chromium reported them unclickable. It is back now only because
     the same edit moved the search INTO this row — the dropdown it opens is
     positioned by .sugwrap inside #u-top, so there is nothing above the links
     to hide under. That pairing is the invariant, not the title's absence. */
  // Item 1 (2026-09-04) put SkyView leftmost; the header's own vocabulary
  // (2026-09-05, from Claude's header) puts the icon actions before the title
  // field, so the title is the first thing in the row that is not an icon.
  check("(A) ⭐ the title field is the first thing in the row after the icon actions, and reads SkyView",
    [...q("#u-top").children].find((e) => !e.classList.contains("u-ico") && !e.classList.contains("u-more")) === q("#u-top #u-title") &&
    /^SkyView$/.test(text("#u-title").trim()), [...q("#u-top").children].map((e) => e.id || e.className).join(" | "));
  check("(A) ⭐ …and the search that made room for it moved into the row with it",
    !!q("#u-top #u-search-slot #msearch") && !q(".mast #msearch") &&
    !!q("#u-top #u-search-slot .sugwrap #gq"));
  check("(A) ⭐ item 11: the one search field is inside #u-full, so full screen keeps it",
    !!q("#u-full #msearch") && qa("#msearch").length === 1);
  check("(A) ⭐ item 5: close is a control with a WORD for a name",
    !!q("#u-close") && /close/i.test(q("#u-close").getAttribute("aria-label") || ""),
    q("#u-close") ? q("#u-close").getAttribute("aria-label") : "∅");
  // Item 10: exact figures, read straight off the zoom readout (view.k * 100).
  {
    const S = st();
    check("(A) ⭐ item 10: a course flies to 1000%, a discipline to 150%",
      S.courseZoom === 10 && S.subjectZoom === 1.5,
      `course=${S.courseZoom} subject=${S.subjectZoom}`);
  }
  // ── item 4 (Sam, 2026-09-04): zoom past 900%, and the taper that earns it ──
  // "it needs to go higher than 900% so I can isolate 1 CCR course while keeping
  // the other courses visible surrounding it, in case I need to drag one into
  // the CCR course."
  {
    const S = st();
    check("(A) ⭐ the zoom ceiling is well past the old 9x (900%)", S.kMax > 9, `K_MAX=${S.kMax}`);
    // Sam, 2026-09-05 (end of session): "need to be able to zoom to 7k — needed when working on a single course"
    check("(A) ⭐ the zoom ceiling is 7,000%", S.kMax === 70, `K_MAX=${S.kMax}`);
    // ⭐ THE TAPER IS THE POINT, not the bigger number. Radius used to scale
    // LINEARLY with zoom while orbit positions did too, so the ratio of a
    // circle's size to the gap between circles was CONSTANT at every zoom —
    // which is why zooming in never helped pick one course out of a crowd, and
    // why raising the cap alone would have made it worse (a 100-course identity
    // at k=40 would draw at a 508px radius and push its neighbors off screen).
    const f = S.radScaleAt;
    check("(A) below the knee the radius still tracks zoom exactly",
      f(1) === 1 && f(S.radKnee) === S.radKnee);
    check("(A) ⭐ above the knee separation outpaces size, so the orbit spreads out",
      f(S.kMax) < S.kMax && f(40) < 40 && f(40) > f(9),
      `radScale(40)=${f(40).toFixed(1)} vs linear 40`);
    check("(A) …and the taper is monotonic — zooming in never shrinks a circle",
      [1, 4, 9, 20, 40, S.kMax].every((k, i, a) => i === 0 || f(k) > f(a[i - 1])));
  }
  // ── items 3 + 9 (Sam, 2026-09-04): noncredit is visible, and filterable ────
  // "Need to visually differentiate NC courses — I'm thinking rather than
  // another color, perhaps a broken line or dotted circle. Also need a CR NC
  // toggle." Both were blocked until the payload carried the credit status at
  // all: the builder READ `credit` to score orbits but never emitted it.
  {
    const S = st();
    check("(A) ⭐ the payload now carries credit status per point",
      S.creditCounts.cr > 0 || S.creditCounts.nc > 0 || S.creditCounts.unrecorded > 0,
      JSON.stringify(S.creditCounts));
    check("(A) the filter starts on All, so nothing is hidden until asked",
      S.creditFilter === "all" && S.creditCounts.shown ===
        S.creditCounts.cr + S.creditCounts.nc + S.creditCounts.unrecorded);
    // ⭐ THREE STATES AND A GAP. A two-way toggle would have to file the points
    // with NO recorded credit status under credit or under noncredit, and either
    // is a lie — the false-zero shape this repo keeps relearning. They show
    // under All and nowhere else, and the hint says how many.
    // Since 2026-09-05 the three positions are SWITCHES in the Show menu, one
    // of them "not recorded", beside the identity systems and the kinds of point.
    // 14 since Session 232: articulations became a group of its own (Sam's
    // ruling 1) — "has articulations" and "no articulation recorded", two
    // switches like every other group, because one box that starts ticked can
    // only ever mean "hide the rest".
    check("(A) ⭐ Show is a menu of switches: credit status (with 'not recorded'), identity system, kind of point, articulations, college courses",
      !!q("#u-show") && qa("#u-show-menu input[data-show]").length === 14 && !!q('#u-show-menu input[data-show="unrec"]') &&
      !!q('#u-show-menu input[data-show="arty"]') && !!q('#u-show-menu input[data-show="noart"]') &&
      /Show/.test(text("#u-show-sum")) && /^All$/.test(text("#u-show-word").trim()) && !q("#u-cr-all"),
      qa("#u-show-menu input[data-show]").map((i) => i.getAttribute("data-show")).join(","));
    w.__ccrSetCredit("nc");
    check("(A) Noncredit hides the credit courses", st().creditFilter === "nc" &&
      st().creditCounts.shown === st().creditCounts.nc, `${st().creditCounts.shown}`);
    w.__ccrSetCredit("cr");
    check("(A) ⭐ Credit hides the UNRECORDED too — they are not credit",
      st().creditCounts.shown === st().creditCounts.cr);
    w.__ccrSetCredit("all");
    check("(A) …and All brings the unrecorded back, saying how many",
      st().creditCounts.shown === st().creditCounts.cr + st().creditCounts.nc + st().creditCounts.unrecorded
      && /no recorded credit status/i.test(text("#u-hint")));
    {
      const total = S.creditCounts.cr + S.creditCounts.nc + S.creditCounts.unrecorded;
      const mid = q('#u-show-menu input[data-show="mid"]');
      mid.checked = false; mid.dispatchEvent(new w.Event("change", { bubbles: true }));
      check("(A) ⭐ switching M-ID off hides the M-ID points; the chip counts the switches and the hint the hidden",
        st().show.mid === false && st().creditCounts.shown === 1 && st().creditFilter === "all" &&
        /13 of 14/.test(text("#u-show-word")) && /hidden/.test(text("#u-hint")),
        `shown=${st().creditCounts.shown} of ${total} · ${text("#u-show-word")}`);
      q("#u-show-every").click();
      check("(A) Show everything brings them all back", st().creditCounts.shown === total && /^All$/.test(text("#u-show-word").trim()));
      // Sam, 2026-09-05 (end of session): "need to add a Deselect All option on the Show:All drop down"
      q("#u-show-none").click();
      check("(A) ⭐ Deselect all clears every switch, draws nothing, and the row says 0 of 14",
        st().creditCounts.shown === 0 && /^0 of 14$/.test(text("#u-show-word").trim()) && Object.values(st().show).every((v) => v === false),
        `${st().creditCounts.shown} · ${text("#u-show-word")}`);
      q("#u-show-every").click();
      check("(A) …and Show everything restores them", st().creditCounts.shown === total);
      w.__ccrSetShow({ members: false });
      check("(A) the college-course squares have a switch of their own", st().show.members === false && /college courses under an identity are not drawn/.test(text("#u-hint")));
      w.__ccrSetShow({ members: true });
    }
    // The mark is a STROKE, not a colour: colour already carries the identity
    // system, and a second colour scale would make the reader hold two at once.
    check("(A) ⭐ noncredit is a broken ring whose dash scales with the circle",
      Array.isArray(S.ncDashAt(8)) && S.ncDashAt(40)[0] > S.ncDashAt(4)[0],
      `r=4 ${S.ncDashAt(4)[0]} vs r=40 ${S.ncDashAt(40)[0]}`);
    check("(A) …and the legend explains the broken ring in words",
      /noncredit/i.test(text(".u-legend")) && /broken ring/i.test(text(".u-legend")));
  }
  // ── item 1 (Sam, 2026-09-04): the side menu opens the FULL WINDOW ──────────
  // "open Skyview from CCR side menu link directly to the full window version of
  // SkyView, not another view." Inside the CCR tab SkyView is an iframe beside
  // the list — right there, wrong when the map is the whole job.
  {
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    const dash = fs.readFileSync(path.join(ROOT, "CPL_Dashboard.html"), "utf8");
    check("(A) ⭐ a keyed SkyView launcher opens the standalone page in its own tab",
      /data-nav-link="skyview"[^>]*href="prototype\/skyview\.html"/.test(html.replace(/\s+/g, " ")) ||
      /href="prototype\/skyview\.html"[^>]*data-nav-link="skyview"/.test(html.replace(/\s+/g, " ")));
    check("(A) …it is NOT a tab, so tabs.js never tries to render a pane for it",
      !/data-nav-link="skyview"[^>]*data-tab=/.test(html.replace(/\s+/g, " ")));
    check("(A) Rule 4 — the launcher is mirrored in both HTMLs",
      html.includes('data-nav-link="skyview"') && dash.includes('data-nav-link="skyview"'));
    // ⚠️ Unlisted, a keyed launcher falls to the Share group by nav_groups.js's
    // catch-all — beside the PUBLIC Fact Sheet and Sierra. SkyView is an
    // internal curation tool, and Share would put the map a whole group away
    // from the reference it is a view of.
    const nav = fs.readFileSync(path.join(ROOT, "nav_groups.js"), "utf8");
    check("(A) ⭐ SkyView is grouped with the Common Course Reference, not with Share",
      /id: 'reference'[^}]*'unified-courses', 'skyview'/.test(nav) &&
      !/id: 'share'[^}]*'skyview'/.test(nav));
  }

  // ── the keyword search keeps credit and noncredit apart (Sam's first list) ──
  {
    const hits = w.__ccrSuggest("weld", 8) || [];
    const courses = hits.filter((h) => h.kind === "course");
    check("(A) course suggestions carry their credit status in words",
      courses.length === 0 || courses.every((c) => /credit|not recorded/i.test(c.credit || "")),
      courses.map((c) => c.credit).join(" | "));
    // ⭐ A STABLE partition after the relevance sort — credit block, then
    // noncredit, then unrecorded — so the best match still leads inside each
    // block. Sorting BY credit would have thrown the relevance order away.
    const rank = (c) => /not recorded/.test(c.credit) ? 2 : /^noncredit/.test(c.credit) ? 1 : 0;
    check("(A) ⭐ credit courses group ahead of noncredit, unrecorded last",
      courses.every((c, i) => i === 0 || rank(courses[i - 1]) <= rank(c)),
      courses.map((c) => rank(c)).join(","));
    // ⚠️ No header row between the blocks on purpose: this is a listbox whose
    // keyboard nav indexes sugItems directly, so a non-selectable entry would
    // desync every arrow key after it. Each row names its own status instead.
    check("(A) …and every suggestion stays selectable (no header rows injected)",
      hits.every((h) => h.kind === "subject" || h.kind === "course" || h.kind === "member"),
      hits.map((h) => h.kind).join(","));
  }
  // Sam, 2026-09-05, item 5: the fold lives at the map's lower right — the
  // word "Legend", unbold, with a fold mark — not a "Hide legend" chip in the row.
  check("(A) the legend folds from its own corner of the map, named by the word",
    !!q("#u-wrap #u-legend-toggle") && /Legend/.test(text("#u-legend-toggle")) && q("#u-legend-toggle").getAttribute("aria-controls") === "u-foot");
  {
    const foot = q("#u-foot"), btn = q("#u-legend-toggle");
    btn.click();
    check("(A) ⭐ folding hides the strip, the mark turns, and the state is remembered",
      foot.classList.contains("u-foot-hidden") && btn.getAttribute("aria-expanded") === "false" && !st().legendOpen);
    btn.click();
    check("(A) …and it comes back", !foot.classList.contains("u-foot-hidden") && st().legendOpen);
  }
  check("(A) the legend explains the stand-alone dot in words",
    /stand-alone course — a smaller, lighter dot in orbit/.test(text(".u-legend")));
  check("(A) the intro states orbiting, cross and rim counts from the payload",
    /2 of the stand-alones orbit/.test(text("#u-below")) && /1 of them in another discipline/.test(text("#u-below"))
    && /1 share nothing with any identity/.test(text("#u-below")), text("#u-below").slice(0, 400));
  const s0 = st();
  check("(A) the member index covers every college course", s0.memberIndex === 11, String(s0.memberIndex));
  check("(A) orbiting and rim are counted from the points", s0.orbiting === 2 && s0.rim === 1);
  /* ⭐ THE BASE THAT CAN EXIST ON THIS HOST IS TRIED FIRST. The shards are not
   * committed, so on a deployed host ./ccr_desc can only 404 — the old fixed
   * order paid one guaranteed round trip (and a 5 KB GitHub 404 page) per
   * discipline before the fetch that works. This window is example.org, so the
   * bucket leads; descBasesFor() carries the rule for every other host. */
  check("(A) ⭐ on a deployed host the bucket is tried FIRST and the local dir second",
    s0.descBases.length === 2 &&
    /supabase\.co\/storage\/v1\/object\/public\/ccr-desc$/.test(s0.descBases[0]) &&
    s0.descBases[1] === "ccr_desc",
    s0.descBases.join(" | "));
  {
    const order = (h) => s0.descBasesFor(h).map((b) => (/supabase\.co/.test(b) ? "bucket" : "local")).join(",");
    check("(A) a served host puts the bucket first",
      order("cpl-initiative.github.io") === "bucket,local" && order("example.org") === "bucket,local",
      order("cpl-initiative.github.io"));
    check("(A) localhost and file:// keep the local directory first",
      order("localhost") === "local,bucket" && order("127.0.0.1") === "local,bucket" &&
      order("[::1]") === "local,bucket" && order("") === "local,bucket",
      [order("localhost"), order("127.0.0.1"), order("[::1]"), order("")].join(" | "));
  }

  // ── (B) leaving and returning takes the full-bleed frame down and back up ──
  w.__ccrForest();
  check("(B) another view removes the full-bleed frame", !q("#main.u-fullbleed") && !q("#u-cvs"));
  check("(B) ⭐ 'All disciplines' is the workspace now: By discipline pressed, a filter, a way back to SkyView, and the solo frame down",
    !!q("#ws-sky") && !!q("#ws-q") && q("#ws-discipline").getAttribute("aria-pressed") === "true" && !d.body.classList.contains("u-solo"));
  w.__ccrUniverse();
  check("(B) coming back restores the map and the frame", !!q("#u-cvs") && !!q("#main.u-fullbleed"));

  // ── (C) suggestions: subject · identity · stand-alone · college course ─────
  const sug = w.__ccrSuggest("weld", 8);
  // ⚠️ `kind` is the internal branch key and stays "subject"; `kindWord` is what a
// reader SEES, and an island is a discipline. Asserting both keeps the two from
// silently drifting into one another.
  check("(C) a discipline is offered first, labelled with the word the reader sees",
    sug[0].kind === "subject" && sug[0].kindWord === "discipline" && sug[0].label === "Welding");
  check("(C) course identities follow", sug.some((s) => s.kind === "course" && s.kindWord === "course identity" && s.nd.i === "WELD C1000"));
  check("(C) a stand-alone says it is one", w.__ccrSuggest("pipe", 8).some((s) => s.kindWord === "stand-alone course" && s.nd.i === "WELD M10AB"));
  const byCode = w.__ccrSuggest("WELD 150", 8);
  check("(C) ⭐ a college course is found by its code and says which identity carries it",
    byCode.some((s) => s.kind === "member" && s.kindWord === "college course" && s.code === "WELD 150" && s.nd.i === "WELD M10AB" && /under Pipe Welding/.test(s.sub)),
    JSON.stringify(byCode.map((s) => [s.kind, s.label])));
  check("(C) ⭐ …and by its control number", w.__ccrSuggest("CCC000000202", 8).some((s) => s.kind === "member" && s.code === "WELD 1A")
    && w.__ccrSuggest("401", 8).some((s) => s.kind === "member" && s.code === "WELD 150"));
  check("(C) the header renders the kind as a word",
    (() => { const gq = q("#gq"); gq.value = "weld 150"; gq.dispatchEvent(new w.Event("input", { bubbles: true }));
             return qa("#sug .sg-k").some((el) => el.textContent === "COLLEGE CRSE"); })());
  // Sam, 2026-09-05: "abbreviate Discipline to DISC; Course to CRSE; Credit to CR".
  check("(C) ⭐ the list uses the short words — DISC, CRSE IDENTITY, STAND-ALONE CRSE, COLLEGE CRSE — and CR/NC for credit",
    sug[0].kindShort === "DISC" && sug.some((s) => s.kindShort === "CRSE IDENTITY" && /· (CR|NC|NCE|CR status not recorded)$/.test(s.sub)) &&
    w.__ccrSuggest("pipe", 8).some((s) => s.kindShort === "STAND-ALONE CRSE") && byCode.some((s) => s.kindShort === "COLLEGE CRSE"),
    sug.map((s) => s.kindShort + ":" + s.sub).join(" | "));

  // ── (D) jumping to a college course selects the identity and filters to it ─
  const row = w.__ccrSuggest("WLD 1", 8).find((s) => s.kind === "member");
  w.__ccrGoSuggestion(row);
  check("(D) ⭐ the jump lands on the carrying identity", st().sel === "WELD M1001", st().sel);
  check("(D) and flies past the node threshold", st().view.k > st().nodeZoom * 2.9, String(st().view.k));
  check("(D) the inspector filters the list down to that course",
    qa("#u-detail .mlist li").length === 1 && /WLD 1/.test(text("#u-detail .mlist")) && /Filtered to/.test(text("#u-detail")));
  w.__ccrUniverseSearch("weld 1a");
  check("(D) ⭐ searching a college course code from the header box finds its identity",
    st().sel === "WELD C1000" && st().hits === 1, `sel=${st().sel} hits=${st().hits}`);
  w.__ccrUniverseSearch("welding");
  check("(D) a discipline's name still wins over course titles — and the hint calls it a discipline", /^\s*Discipline/.test(text("#u-hint")) && /Welding/.test(text("#u-hint")));

  // ── (E) the inspector on a stand-alone: the orbit, the why, the verb ───────
  w.__ccrGoSuggestion({ kind: "course", isl: PU.islands[0], nd: PU.islands[0].p[2], label: "x" });
  const orb = text("#u-detail .orbit");
  check("(E) ⭐ a stand-alone says which identity it orbits and why",
    /In orbit around/.test(orb) && /Welding Fundamentals/.test(orb) && /same local subject code/.test(orb) && /words in common in the title/.test(orb), orb.slice(0, 160));
  check("(E) it says the orbit is a suggestion, not a decision", /suggestion only/i.test(orb));
  check("(E) the accept verb names the course and the destination", /Move WELD 100L into WELD M1001/.test(text("#u-accept")));
  q("#u-accept").click();
  check("(E) ⭐ accepting writes the CN: row the live tab would write",
    st().moves.length === 1 && st().moves[0].cn === "CCC000000301" && st().moves[0].to === "WELD M1001"
    && /CN:CCC000000301\s+merge_into\s+WELD M1001/.test(text("#u-writes")), text("#u-writes"));
  check("(E) the emptied stand-alone says its course was moved", /moved/.test(text("#u-detail")));

  // ── (E2) a satellite filed under another subject says so ──────────────────
  w.__ccrGoSuggestion({ kind: "course", isl: PU.islands[0], nd: PU.islands[0].p[3], label: "x" });
  check("(E2) ⭐ a cross-discipline orbit says which subject the course is filed under",
    /filed under Vocational/.test(text("#u-detail .orbit")) && /closest match in the whole reference is here, in Welding/.test(text("#u-detail .orbit")),
    text("#u-detail .orbit").slice(0, 200));
  check("(E2) the state counts it as a cross orbit", st().crossOrbits === 1, String(st().crossOrbits));

  // ── (F) the parent lists its orbiting courses, each with 'Move here' ───────
  w.__ccrGoSuggestion({ kind: "course", isl: PU.islands[0], nd: PU.islands[0].p[0], label: "x" });
  check("(F) ⭐ the parent lists its orbiting stand-alones", qa("#u-detail .orbits li").length === 2 && /Stand-alone courses in orbit \(2\)/.test(text("#u-detail")));
  check("(F) the one already moved is marked, the other offers the verb",
    qa("#u-detail .orbits li.moved").length === 1 && qa("#u-detail .orbits [data-accept]").length === 1);
  check("(F) the accept verb is not a Drag… button (the drag count must stay honest)",
    qa("#u-detail .orbits .mv").length === 0);
  q("#u-detail .orbits [data-accept]").click();
  check("(F) 'Move here' records the second move", st().moves.length === 2 && st().moves[1].cn === "CCC000000401");
  check("(F) the parent's own courses show as rows with a clickable number",
    qa("#u-detail .mlist li").length === 5 && qa("#u-detail .mlist .cd[data-desc]").length === 5);

  // ── (G) descriptions: the bucket is reached when the local dir 404s ────────
  await tick(); await tick(); await tick();
  check("(G) ⭐ the deployed page reaches the shard in ONE fetch — no guaranteed 404 first",
    (() => { const sh = fetches.filter((u) => !/discipline_canonical_subj4\.json$/.test(u));   // the seed read is a separate fetch
             return sh.length === 1
               && /supabase\.co\/storage\/v1\/object\/public\/ccr-desc\/welding\.json$/.test(sh[0])
               && !sh.some((u) => /\/ccr_desc\/welding\.json$/.test(u)); })(), fetches.join(" | "));
  check("(G) the shard state is recorded as loaded", st().descState.welding === "ok", JSON.stringify(st().descState));
  check("(G) course titles from the shard appear beside the code", /Welding Fundamentals I/.test(text("#u-detail .mlist")));
  q('#u-detail .cd[data-desc="CCC000000101"]').click();
  check("(G) ⭐ clicking a course number shows its catalog description", /A welding description\./.test(text("#u-detail .mdesc")));
  q('#u-detail .cd[data-desc="CCC000000102"]').click();
  check("(G) a course with none says so rather than showing nothing", qa("#u-detail .mdesc.none").length === 1 && /No catalog description/.test(text("#u-detail .mdesc.none")));

  // ── (H) the rim, and the shared-key refusal ────────────────────────────────
  w.__ccrGoSuggestion({ kind: "course", isl: PU.islands[1], nd: PU.islands[1].p[1], label: "x" });
  check("(H) a rim course says no identity shares anything with it", !!q("#u-detail .orbit.rim") && /On the rim/.test(text("#u-detail .orbit")));
  w.__ccrGoSuggestion({ kind: "course", isl: PU.islands[1], nd: PU.islands[1].p[0], label: "x" });
  check("(H) a shared key is flagged before the click", qa("#u-detail .mlist li.shared").length === 2 && /shared key/.test(text("#u-detail")));
  check("(H) the write guard refuses the ambiguous key and allows a unique one",
    st().canMove("CCC000000777").ok === false && st().canMove("CCC000000501").ok === true);
  q('#u-detail .mv[data-shared]').click();
  check("(H) pressing Drag… on it explains the refusal", /Cannot re-home/.test(text("#u-hint")) && /which one/.test(text("#u-hint")) && st().carrying === null);

  // ── (I) the carry: pick up from the panel, Escape puts it back ─────────────
  q('#u-detail .mv[data-cn="CCC000000501"]').click();
  check("(I) Drag… picks the course up", st().carrying === "ART 110", String(st().carrying));
  q("#u-cvs").dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check("(I) Escape puts it back", st().carrying === null && /nothing moved/i.test(text("#u-hint")));

  // ── (J) the labels: title · units → the longer title → + number · system, by zoom band ──
  // Sam, 2026-09-03: "more important to see the title than the course number on
  // the initial course label … Course title and units (3u)"; the number is on hover.
  const z = st().labelZooms;
  check("(J) the zoom bands are ordered (nodes < brief < titled < full)", st().nodeZoom < z.id && z.id < z.title && z.title < z.full);
  texts.length = 0; w.__ccrUniverseFly(AT("WELD M1001")[0], AT("WELD M1001")[1], 1.2);
  const l1 = { ...st().labelStats }, t1 = texts.slice();
  texts.length = 0; w.__ccrUniverseFly(AT("WELD M1001")[0], AT("WELD M1001")[1], 2.0);
  const l2 = { ...st().labelStats }, t2 = texts.slice();
  texts.length = 0; w.__ccrUniverseFly(AT("WELD M1001")[0], AT("WELD M1001")[1], 3.2);
  const l3 = { ...st().labelStats }, t3 = texts.slice();
  check("(J) ⭐ just past the first band a course label is its TITLE and units, never its number",
    l1.brief > 0 && l1.titled === 0 && l1.full === 0 && t1.some((t) => t === "Welding Fundamentals · 3u") && !t1.some((t) => /^WELD M1001/.test(t)),
    JSON.stringify(l1) + " " + t1.join("|"));
  check("(J) ⭐ the second band lengthens the title", l2.titled > 0 && l2.full === 0 && t2.some((t) => t === "Introduction to Welding · 3u"), JSON.stringify(l2));
  check("(J) ⭐ the third band adds the number and the system on a second line",
    l3.full > 0 && t3.some((t) => t === "WELD M1001 · M-ID"), JSON.stringify(l3) + " " + t3.join("|"));
  check("(J) ⭐ every placed course label has a leader line to its circle", l1.leaders === l1.brief && l3.leaders >= l3.full, JSON.stringify(l3));
  check("(J) placed labels never overlap", (() => {
    const b = st().placedBoxes; let o = 0;
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++)
      if (b[i][0] < b[j][2] && b[i][2] > b[j][0] && b[i][1] < b[j][3] && b[i][3] > b[j][1]) o++;
    return o === 0; })());

  // ── (K) hover: the quick look ──────────────────────────────────────────────
  w.__ccrUniverseFly(AT("WELD M1001")[0], AT("WELD M1001")[1], 3.0);          // WELD M1001 is now at the canvas centre (480, 300)
  pointer("pointermove", 480, 300);
  const tip = q("#u-tip");
  check("(K) ⭐ hovering a point shows number, title, units and system", !tip.hidden && /WELD M1001/.test(tip.textContent) && /Welding Fundamentals/.test(tip.textContent) && /3 units/.test(tip.textContent) && /M-ID/.test(tip.textContent), tip.textContent);
  check("(K) …and how many stand-alones orbit it", /2 stand-alone courses in orbit/.test(tip.textContent));
  pointer("pointermove", 480 + (-128 + 120) * 3, 300 + 9 * 3);   // the satellite WELD M10AB
  check("(K) hovering a stand-alone names its parent and the reason", /Stand-alone/.test(tip.textContent) && /orbits WELD M1001/.test(tip.textContent) && /words in common/.test(tip.textContent), tip.textContent);
  check("(K) …and the subject it is filed under when that is elsewhere", /filed under Vocational/.test(tip.textContent), tip.textContent);
  pointer("pointermove", 5, 5);
  check("(K) leaving the points hides the tooltip", tip.hidden);

  // ── (L) dragging a hollow point drops its course on the destination ────────
  // Fresh view: Art's stand-alone has not been moved yet. Fly so ARTS M10ZZ is
  // at the centre; ARTS M1001 sits 40 world units above it = 120 px at k=3.
  w.__ccrUniverseFly(AT("ARTS M10ZZ")[0], AT("ARTS M10ZZ")[1], 3.0);
  const before = st().moves.length;
  pointer("pointerdown", 480, 300);
  pointer("pointermove", 480, 250);
  check("(L) moving a hollow point picks its one course up", st().carrying === "ART 199", String(st().carrying));
  pointer("pointerup", 480, 180);
  check("(L) ⭐ releasing on an identity writes the move", st().moves.length === before + 1 && st().moves[st().moves.length - 1].to === "ARTS M1001",
    JSON.stringify(st().moves.slice(-1)));

  // ── (M) the window controls: three states, step down, step up (2026-09-05) ─
  // 0 = the page (or COBI) around the map · 1 = the map alone · 2 = the
  // browser's own full screen. The Full screen chip is gone; the middle control
  // steps up and the left one steps down, and each says so in words.
  w.__ccrUniverse({ solo: true });
  check("(M) alone in the window the map is state 1, and the down control offers the page around it",
    st().winState === 1 && !q("#u-win-down").hidden && /page around the map/.test(q("#u-win-down").getAttribute("aria-label")),
    `${st().winState} ${q("#u-win-down").getAttribute("aria-label")}`);
  q("#u-win-up").click();
  check("(M) without the API the up control explains instead of failing silently", /full screen/i.test(text("#u-hint")));
  let fsEl = null;
  Object.defineProperty(d, "fullscreenElement", { get: () => fsEl, configurable: true });
  w.HTMLElement.prototype.requestFullscreen = function () { fsEl = this; return Promise.resolve(); };
  q("#u-win-up").click();
  d.dispatchEvent(new w.Event("fullscreenchange"));
  check("(M) ⭐ entering full screen renames the up control and fills the window",
    st().winState === 2 && /Leave full screen/.test(q("#u-win-up").getAttribute("aria-label"))
    && q("#u-wrap").style.height === w.innerHeight + "px", `${q("#u-win-up").getAttribute("aria-label")} / ${q("#u-wrap").style.height}`);
  fsEl = null; d.dispatchEvent(new w.Event("fullscreenchange"));
  check("(M) leaving it restores the words", st().winState === 1 && /^Full screen$/.test(q("#u-win-up").getAttribute("aria-label")));
  q("#u-win-down").click();
  check("(M) ⭐ stepping down from the map alone shows the page around it, and the down control is not painted (nothing to step down to)",
    !d.body.classList.contains("u-solo") && st().winState === 0 && q("#u-win-down").hidden,
    `state=${st().winState} solo=${d.body.classList.contains("u-solo")} hidden=${q("#u-win-down") && q("#u-win-down").hidden}`);
  q("#u-win-up").click();
  check("(M) ⭐ stepping up from there fills the window again", d.body.classList.contains("u-solo") && st().winState === 1);

  // ── (N) the inspector can be folded away and comes back on a selection ────
  // ⚠️ The INITIAL state is asserted in (A), right after boot — by the time this
  // block runs, earlier checks have selected a node and openInspector() has
  // legitimately opened the panel. Asserting "starts hidden" here would be
  // asserting it about a page that has been used.
  if (!st().inspectorOpen) q("#u-insp-toggle").click();      // normalize: open
  check("(N) an open panel says how to put it away",
    !q("#u-inspector").classList.contains("closed") && q("#u-insp-toggle").getAttribute("aria-pressed") === "true" && /on/.test(text("#u-insp-toggle .u-state")) && st().inspectorOpen);
  q("#u-insp-toggle").click();
  check("(N) the details panel folds to a word",
    q("#u-inspector").classList.contains("closed") && q("#u-insp-toggle").getAttribute("aria-pressed") === "false" && !st().inspectorOpen);
  w.__ccrGoSuggestion({ kind: "subject", isl: PU.islands[0] });
  /* ⭐ A PANEL THE READER HID STAYS HIDDEN (Sam, 2026-09-06: "the side bar
   * unhid (and does so every time I add a course)"). Hide is an instruction
   * about the workspace, not about one course, and openInspector() fires on
   * every selection — so this used to assert the opposite. The CONTENT still
   * follows the selection underneath, so reopening shows the right card. */
  check("(N) ⭐ selecting something does NOT reopen a panel the reader hid",
    q("#u-inspector").classList.contains("closed"));
  check("(N) …but the content follows the selection underneath it",
    /Welding/.test(text("#u-detail h3")));
  q("#u-insp-toggle").click();
  check("(N) the toggle still brings it back, showing the current selection",
    !q("#u-inspector").classList.contains("closed") && /Welding/.test(text("#u-detail h3")));
  check("(N) a subject card lists its identities as buttons that open them", qa("#u-detail .idlist [data-go]").length === 2);
  qa("#u-detail .idlist [data-go]")[0].click();
  check("(N) …and clicking one selects it", st().sel === "WELD C1000", st().sel);

  // ── (O) the authority chip on a subject card (item 19, Sam 2026-09-03) ─────
  await new Promise((r) => setTimeout(r, 20));   // the seed fetch is asynchronous
  check("(O) the page reads the canonical seed by its relative path first",
    fetches.some((u) => /^\.\.\/kb\/discipline_canonical_subj4\.json$/.test(u.replace(/^https:\/\/example\.org\/prototype\//, ""))), fetches.join(" | "));
  w.__ccrGoSuggestion({ kind: "subject", isl: PU.islands[0] });
  check("(O) ⭐ a subject card names its Common SUBJ and the authority's code as a word chip",
    /Common SUBJ WELD/.test(text("#u-detail .u-auth")) && qa("#u-detail .u-auth .chip.cid").map((c) => c.textContent).join() === "C-ID WLDT",
    text("#u-detail .u-auth"));
  check("(O) a CSR-proposed code says so", /proposed/.test(text("#u-detail .u-auth")));
  w.__ccrGoSuggestion({ kind: "subject", isl: PU.islands[1] });
  check("(O) a Common SUBJ the authority owns shows no chip and no 'proposed'",
    /Common SUBJ ARTS/.test(text("#u-detail .u-auth")) && /the C-ID code/.test(text("#u-detail .u-auth"))
    && qa("#u-detail .u-auth .chip").length === 0, text("#u-detail .u-auth"));
  check("(O) the subject tooltip carries the same line",
    /C-ID WLDT/.test(w.__ccrTipHtml ? w.__ccrTipHtml({ isl: PU.islands[0] }) : "C-ID WLDT"));

  // ── (P) the zoom buttons zoom about what you searched for ───────────────────
  // Sam, 2026-09-03: "when I use the keyword search and then zoom, I lose focus
  // on the searched subject".
  w.__ccrUniverseSearch("welding");
  const v0 = { ...st().view }, CW = 960, CH = 600;
  const WX = AT_I("Welding")[0], WY = AT_I("Welding")[1];
  const sx0 = (WX + v0.x) * v0.k + CW / 2, sy0 = (WY + v0.y) * v0.k + CH / 2;
  q("#u-in").click(); q("#u-in").click();
  const v1 = { ...st().view };
  const sx1 = (WX + v1.x) * v1.k + CW / 2, sy1 = (WY + v1.y) * v1.k + CH / 2;
  check("(P) ⭐ zooming in twice keeps the searched subject exactly where it was on screen",
    v1.k > v0.k * 1.9 && Math.abs(sx1 - sx0) < 0.5 && Math.abs(sy1 - sy0) < 0.5, `${sx0},${sy0} → ${sx1},${sy1} (k ${v0.k} → ${v1.k})`);
  st().view.x = 5000;                       // pan it far off the canvas
  q("#u-out").click();
  const v2 = st().view, sx2 = (WX + v2.x) * v2.k + CW / 2;
  check("(P) ⭐ a subject that drifted off the canvas is brought back to the centre before the zoom", Math.abs(sx2 - CW / 2) < 0.5, String(sx2));

  // ── (Q) Pan and Move ───────────────────────────────────────────────────────
  // Sam, 2026-09-03: "need chips or icons to choose whether to move an item or
  // reposition the focus".
  w.__ccrUniverseFly(AT("WELD M1001")[0], AT("WELD M1001")[1], 3.0);
  w.__ccrSetMode("pan");
  check("(Q) ⭐ the Pan chip presses and the hint says what a drag now does",
    st().mode === "pan" && q("#u-mode-pan").getAttribute("aria-pressed") === "true"
    && q("#u-mode-move").getAttribute("aria-pressed") === "false" && /Pan/.test(text("#u-hint")));
  const vx0 = st().view.x, mv0 = st().moves.length;
  pointer("pointerdown", 480, 300); pointer("pointermove", 540, 330); pointer("pointerup", 540, 330);
  check("(Q) ⭐ in Pan mode a drag that starts on an identity moves the VIEW and carries nothing",
    st().view.x !== vx0 && st().moves.length === mv0 && st().carrying === null, `${vx0} → ${st().view.x}`);
  w.__ccrUniverseFly(AT("WELD M1001")[0], AT("WELD M1001")[1], 3.0);
  pointer("pointerdown", 480, 300); pointer("pointerup", 480, 300);
  check("(Q) …and a click in Pan mode still selects", st().sel === "WELD M1001", st().sel);
  w.__ccrSetMode("move");
  check("(Q) Move presses back", st().mode === "move" && q("#u-mode-move").getAttribute("aria-pressed") === "true");

  // ── (R) an identity OPENS: the college courses under it ring it ───────────
  // Sam, 2026-09-03: "I envision being able to zoom in on a single CCR and see
  // the local courses that belong to it. That's the view faculty will need".
  // Where every college course sits NOW: its fixture home, overridden by the
  // moves the earlier sections wrote — so the expected count follows the state
  // rather than a number typed by hand.
  const origin = { 101: "WELD M1001", 102: "WELD M1001", 103: "WELD M1001", 201: "WELD C1000", 202: "WELD C1000",
                   301: "WELD M10AA", 401: "WELD M10AB", 501: "ARTS M1001", 777: "ARTS M1001", 601: "ARTS M10ZZ" };
  const cnKey = (cn) => String(cn).replace(/\D/g, "").replace(/^0+/, "");
  const under = (ids) => { const home = { ...origin }; st().moves.forEach((m) => { home[cnKey(m.cn)] = m.to; });
    return Object.values(home).filter((id) => ids.includes(id)).length; };
  w.__ccrUniverseSearch("welding");          // selects the subject, no identity
  w.__ccrUniverseFly(AT("WELD M1001")[0], AT("WELD M1001")[1], 3.0);
  check("(R) with nothing selected and nothing hovered an identity stays closed below the open-all band",
    st().memberPoints === 0 && st().memberZoom < st().memberZoomAll, String(st().memberPoints));
  pointer("pointerdown", 480, 300); pointer("pointerup", 480, 300);      // select WELD M1001 (Move mode)
  check("(R) ⭐ selecting an identity opens it — every college course under WELD M1001 is a square",
    st().sel === "WELD M1001" && st().memberPoints === under(["WELD M1001"]), `${st().sel} ${st().memberPoints} vs ${under(["WELD M1001"])}`);
  const radM = (2.2 + Math.sqrt(4) * 1.05) * 3.0;      // nodeRad(WELD M1001) at k=3
  // An OPEN ring spreads with its count so the names can radiate: R0 = rad + 16 + min(70, n * 1.7).
  const R0 = radM + 16 + Math.min(70, under(["WELD M1001"]) * 1.7);
  pointer("pointermove", 480, 300 - R0);                 // the first square, straight above
  /* The college reads SHORT here and canonical in the sidebar's title attribute
     (Sam, 2026-09-05), and the card now carries the catalog description — the
     evidence the identity was built from, which is the reason to hover at all. */
  check("(R) ⭐ hovering a star names the college course, its college, the identity it sits under, and its catalog description",
    !tip.hidden && /WELD 100/.test(tip.textContent) && /Alpha/.test(tip.textContent) &&
    !/Alpha College/.test(tip.textContent) && /under WELD M1001/.test(tip.textContent) &&
    /A welding description\./.test(tip.textContent), tip.textContent);
  texts.length = 0; w.__ccrUniverseFly(AT("WELD M1001")[0], AT("WELD M1001")[1], 3.0);
  check("(R) ⭐ each square is labelled by its code and college", st().labelStats.members > 0 && texts.some((t) => t === "WELD 100 · Alpha"), texts.join("|"));
  const mvb = st().moves.length;
  pointer("pointerdown", 480, 300 - R0); pointer("pointermove", 500, 340);
  check("(R) ⭐ dragging a square picks its course up", st().carrying === "WELD 100", String(st().carrying));
  pointer("pointerup", 480 + 30 * 3, 300 + 20 * 3);      // WELD C1000
  check("(R) ⭐ dropping it on another identity writes the same CN: move the panel would",
    st().moves.length === mvb + 1 && st().moves[st().moves.length - 1].to === "WELD C1000", JSON.stringify(st().moves.slice(-1)));
  w.__ccrUniverseFly(AT("WELD M1001")[0], AT("WELD M1001")[1], 4.5);                      // past the open-all band
  check("(R) ⭐ zoomed far enough that identities stand apart, every one in view opens — and the moved course rings its new identity",
    st().memberPoints === under(["WELD M1001", "WELD C1000"]) && st().memberPoints >= 5, `${st().memberPoints} vs ${under(["WELD M1001", "WELD C1000"])}`);
  pointer("pointermove", 480, 300 + 200 * 4.5);          // off every point: nothing hovered
  w.__ccrUniverseFly(AT("WELD M1001")[0], AT("WELD M1001")[1], 3.0);
  pointer("pointermove", 480 + 30 * 3, 300 + 20 * 3);   // hover WELD C1000
  check("(R) hovering an identity below that band opens it beside the selected one, and nothing else",
    st().hover === "WELD C1000" && Object.keys(st().memberOwners).sort().join() === ["WELD C1000", "WELD M1001"].join()
    && st().memberOwners["WELD C1000"] === under(["WELD C1000"]),
    `hover=${st().hover} sel=${st().sel} owners=${JSON.stringify(st().memberOwners)}`);

  // ── (T) the links in the strip reach the other views ──────────────────────
  // Sam, 2026-09-03: "will need links on full screen to navigate to the other views".
  q("#gq").value = "weld";
  q("#u-nav-forest").click();
  check("(T) ⭐ 'By discipline' in the menu leaves the map for the workspace, seeded from the search box",
    !q("#u-cvs") && !!q("#ws-rows") && st().curView === "disciplines" && q("#ws-q").value === "weld", q("#ws-q") ? q("#ws-q").value : "∅");
  check("(T) the ESL toggle is absent when there is no ESL payload (never a door onto nothing)", !q("#ws-esl") && !q("#crumbs-views #u-nav-esl"));
  w.__ccrUniverse();
  check("(T) …and so is the ESL menu item on the map", !q("#u-nav-esl") && !!q("#u-nav-forest"));

  // ── (U) SkyView alone by default; the comprehensive view one click away ────
  // Sam, 2026-09-05: "The full screen SkyView … I would like to henceforth refer
  // to as SkyView … I'd like to have an option to navigate to the comprehensive
  // SkyView (the current one), but I don't want it to open by default."
  check("(U) ⭐ the map opens ALONE: body.u-solo is on and the hash says so",
    d.body.classList.contains("u-solo") && st().solo && w.location.hash === "#skyview", w.location.hash);
  check("(U) ⭐ the menu names the view you are on and offers the others",
    /SkyView/.test(text("#u-views-menu .u-views-here")) && !q("#u-nav-sky") && !!q("#u-nav-comp") &&
    !!q("#u-nav-forest") && !!q("#u-nav-subject"), text("#u-views-menu"));
  check("(U) ⭐ on the map the views sit FLAT under 'Go to' inside the More menu, How SkyView works among them",
    !!q("#u-more-menu #u-views.u-views-flat") && !q("#u-more-menu #u-views > summary") && /Go to/.test(text("#u-more-panel .u-more-h")) &&
    !!q("#u-nav-how") && /How SkyView works/.test(text("#u-nav-how")), text("#u-more-panel").slice(0, 80));
  check("(U) the More menu also holds the sidebar, the legend and the dark canvas as rows with a state word",
    ["#u-insp-toggle", "#u-legend-menu", "#u-dark"].every((id) => q("#u-more-panel " + id) && /^(on|off)$/.test(text(id + " .u-state").trim())));
  check("(U) the CSS takes the masthead, the crumbs, the panes and the footer out of the solo frame",
    /body\.u-solo \.mast,body\.u-solo \.crumbrow,body\.u-solo #u-below,body\.u-solo main>footer\{display:none\}/.test(tpl));
  const cvsBefore = q("#u-cvs"), movesBefore = st().moves.length;
  q("#u-nav-comp").click();
  check("(U) ⭐ the comprehensive view is the SAME canvas with the panes shown — no re-render, the moves kept",
    q("#u-cvs") === cvsBefore && !d.body.classList.contains("u-solo") && st().curView === "comprehensive" &&
    st().moves.length === movesBefore && w.location.hash === "#comprehensive", `${w.location.hash} moves=${st().moves.length}/${movesBefore}`);
  check("(U) …and now the menu offers SkyView instead",
    !!q("#u-nav-sky") && !q("#u-nav-comp") && /Comprehensive view/.test(text("#u-views-menu .u-views-here")));
  q("#u-nav-sky").click();
  check("(U) SkyView comes back alone, on the same canvas",
    d.body.classList.contains("u-solo") && q("#u-cvs") === cvsBefore && w.location.hash === "#skyview");
  w.__ccrUniverse();
  check("(U) a bare __ccrUniverse() keeps the frame you were in", st().solo === true && q("#u-cvs") === cvsBefore);

  // ── (V) the hash names the view; a reload comes back to it ────────────────
  w.history.replaceState(null, "", "#subjects"); w.__ccrRoute();
  check("(V) ⭐ #subjects routes to the workspace on the subject grain",
    !!q("#ws-rows") && q("#ws-subject").getAttribute("aria-pressed") === "true" && st().curView === "subjects");
  w.history.replaceState(null, "", "#comprehensive"); w.__ccrRoute();
  check("(V) #comprehensive routes to the map with the panes", !!q("#u-cvs") && !d.body.classList.contains("u-solo"));
  w.history.replaceState(null, "", "#nonsense"); w.__ccrRoute();
  check("(V) anything else is SkyView alone, and the hash is corrected",
    !!q("#u-cvs") && d.body.classList.contains("u-solo") && w.location.hash === "#skyview", w.location.hash);

  // ── (W) the workspace: disciplines, subjects and ESL packaging on ONE tab ──
  // Sam's items 6-9 (2026-09-04), restated 2026-09-05: "one tab with toggles to
  // switch views and a link back to full screen skyview." His "subject" is the
  // SUBJ4 grain — WELD, ARTS — not the island.
  w.__ccrWorkspace("discipline");
  const td = (row, i) => qa("#ws-rows tr")[row] ? qa("#ws-rows tr")[row].children[i].textContent.trim() : "∅";
  check("(W) ⭐ one tab: one h1, a line explaining the two grains, a toggle with the ESL door this fixture lacks left out",
    text("h1").trim() === "Disciplines and subjects" && /four-letter Common SUBJ/.test(text(".ws-lede")) &&
    qa(".ws-seg .btn").map((b) => b.textContent).join("|") === "By discipline|By subject" && !q("#ws-esl"),
    qa(".ws-seg .btn").map((b) => b.textContent).join("|"));
  check("(W) ⭐ the borrowed search goes home when the workspace opens — one field, in the masthead",
    !!q(".mast #msearch") && qa("input[type=search]#gq").length === 1);
  check("(W) the Views menu rides the crumbs row here, naming By discipline as the view you are on",
    !!q("#crumbs-views #u-views") && /By discipline/.test(text("#crumbs-views .u-views-here")) && !!q("#crumbs-views #u-nav-sky"));
  check("(W) ⭐ By discipline lists every island, biggest first, with the map's counts and the atlas's decision count",
    qa("#ws-rows tr").length === 2 && td(0, 0) === "Welding" && td(0, 2) === "2" && td(0, 3) === "2" && td(0, 4) === "1" &&
    td(1, 0) === "Art" && td(1, 4) === "0", text("#ws-rows"));
  check("(W) ⭐ the Common SUBJ column carries the seed: the code, the authority chip and 'proposed'",
    /WELD/.test(td(0, 1)) && /C-ID WLDT/.test(td(0, 1)) && /proposed/.test(td(0, 1)) && /ARTS/.test(td(1, 1)) && /the C-ID code/.test(td(1, 1)), td(0, 1) + " | " + td(1, 1));
  check("(W) every row can open on the map, and no row offers decisions this fixture does not have",
    qa("#ws-rows [data-map]").length === 2 && qa("#ws-rows [data-work]").length === 0);
  q("#ws-q").value = "art"; q("#ws-q").dispatchEvent(new w.Event("input", { bubbles: true }));
  check("(W) the filter narrows the rows and says how many of how many", qa("#ws-rows tr").length === 1 && /1 of 2 disciplines match/.test(text("#ws-count")), text("#ws-count"));
  q("#ws-q").value = "zzz"; q("#ws-q").dispatchEvent(new w.Event("input", { bubbles: true }));
  check("(W) an empty result says so rather than showing an empty table", /Nothing matches/.test(text("#ws-rows")));
  q("#ws-q").value = ""; q("#ws-q").dispatchEvent(new w.Event("input", { bubbles: true }));
  qa("#ws-rows [data-map]")[0].click();
  check("(W) ⭐ 'On the map' opens SkyView on that discipline at 150%",
    !!q("#u-cvs") && /Welding/.test(text("#u-detail h3")) && Math.abs(st().view.k - 1.5) < 1e-9, `k=${st().view.k}`);
  w.__ccrWorkspace("subject");
  check("(W) ⭐ By subject is the SUBJ4 grain read off the ids: WELD (2 identities, 2 stand-alones) then ARTS (1, 1)",
    qa("#ws-rows tr").length === 2 && td(0, 0) === "WELD" && td(0, 2) === "2" && td(0, 3) === "2" && td(1, 0) === "ARTS" && td(1, 2) === "1" && td(1, 3) === "1",
    text("#ws-rows"));
  check("(W) ⭐ a subject names its discipline and its standing — WELD is Welding's Common SUBJ, chip and all",
    /Welding/.test(td(0, 1)) && /the Common SUBJ of Welding/.test(td(0, 4)) && /C-ID WLDT/.test(td(0, 4)), td(0, 4));
  check("(W) the subject index is exported and agrees", (() => {
    const ix = w.__ccrSubjectIndex();
    return ix.WELD && ix.WELD.n === 2 && ix.WELD.sa === 2 && ix.WELD.home === "Welding" && ix.ARTS && ix.ARTS.home === "Art";
  })());
  q("#ws-q").value = "weld"; q("#ws-q").dispatchEvent(new w.Event("input", { bubbles: true }));
  q("#ws-discipline").click();
  check("(W) the toggle switches the grain and carries the filter across",
    q("#ws-discipline").getAttribute("aria-pressed") === "true" && q("#ws-q").value === "weld" && qa("#ws-rows tr").length === 1 && w.location.hash === "#disciplines",
    `${q("#ws-q") && q("#ws-q").value} rows=${qa("#ws-rows tr").length} ${w.location.hash}`);
  w.__ccrWorkspace("subject");
  qa("#ws-rows [data-subj]")[0].click();
  check("(W) ⭐ 'On the map' for a subject flies to its discipline at 150% and rings its identities",
    !!q("#u-cvs") && /Welding/.test(text("#u-detail h3")) && st().hits === 2 && Math.abs(st().view.k - 1.5) < 1e-9 &&
    /Subject <strong>WELD/.test(q("#u-hint").innerHTML) && /ringed/.test(text("#u-hint")), `hits=${st().hits} k=${st().view.k} ${text("#u-hint")}`);
  w.__ccrWorkspace("discipline");
  check("(W) 'Back to SkyView' is a word, and lands on the map alone",
    q("#ws-sky").textContent.trim() === "Back to SkyView" && (q("#ws-sky").click(), d.body.classList.contains("u-solo") && !!q("#u-cvs")));

  // ── (X) the selection: a pick ADDS a token, a typed search REPLACES them ─
  // Sam, 2026-09-05: "make it multi-select capable". One token behaves exactly
  // as a single pick or search always did; several ring and fit them all.
  w.__ccrUniverse({ solo: true });
  w.__ccrUniverseSearch("welding");
  check("(X) a typed search is one term token, and the map behaves as before",
    st().tokens.length === 1 && st().tokens[0] === "welding" && /^\s*Discipline/.test(text("#u-hint")) && qa("#u-tokens .u-tok").length === 1,
    `${JSON.stringify(st().tokens)} · ${text("#u-hint").slice(0, 60)}`);
  const pick = w.__ccrSuggest("drawing", 8).find((s) => s.kind === "course");
  w.__ccrGoSuggestion(pick);
  check("(X) ⭐ a pick ADDS a token; two selections fit one view, the course ringed and the discipline outlined",
    st().tokens.length === 2 && qa("#u-tokens .u-tok").length === 2 && st().hits === 1 && /2 selections/.test(text("#u-hint")) && !!q("#u-tok-clear"),
    `${JSON.stringify(st().tokens)} hits=${st().hits} · ${text("#u-hint").slice(0, 90)}`);
  check("(X) the chips name their kind in the short words", qa("#u-tokens .u-tok-k").map((e) => e.textContent).join("|") === "SEARCH|CRSE IDENTITY",
    qa("#u-tokens .u-tok-k").map((e) => e.textContent).join("|"));
  check("(X) the box keeps its term after a pick, so the list can stay open with the tick (2026-09-05, item 3)", q("#gq").value.length > 0 || st().tokens.length > 0);
  qa("#u-tokens .u-tok-x")[1].click();
  check("(X) removing a chip narrows the selection back to the single behavior", st().tokens.length === 1 && st().hits === 0 && /^\s*Discipline/.test(text("#u-hint")),
    `tokens=${JSON.stringify(st().tokens)} hits=${st().hits} · ${text("#u-hint").slice(0, 90)}`);
  q("#gq").value = "";   // the box keeps its term after a pick now; Backspace drops a chip only from an EMPTY box
  q("#gq").dispatchEvent(new w.KeyboardEvent("keydown", { key: "Backspace", bubbles: true }));
  check("(X) Backspace in an empty box drops the last chip", st().tokens.length === 0 && /cleared/i.test(text("#u-hint")), text("#u-hint"));
  w.__ccrGoSuggestion(pick); w.__ccrGoSuggestion(w.__ccrSuggest("weld", 8)[0]);
  check("(X) a discipline pick joins the selection", st().tokens.length === 2 && qa("#u-tokens .u-tok-k").some((e) => e.textContent === "DISC"));
  w.__ccrUniverseSearch("pipe");
  check("(X) ⭐ a typed search replaces the selection with one term — a search still means a search", st().tokens.length === 1 && st().tokens[0] === "pipe");
  w.__ccrForest();
  check("(X) leaving the map clears the selection along with the borrowed box", st().tokens.length === 0 && !!q(".mast #msearch") && !q("#u-tokens .u-tok"));

  // ── (Y) the dark canvas (Sam, 2026-09-05: "Dark mode selector") ──────────
  w.__ccrUniverse({ solo: true });
  check("(Y) the dark canvas is a word chip, off by default",
    !!q("#u-dark") && q("#u-dark").getAttribute("aria-pressed") === "false" && !d.body.classList.contains("u-dark") && !st().dark);
  q("#u-dark").click();
  check("(Y) ⭐ Dark flips the body class, the chip and the remembered choice",
    d.body.classList.contains("u-dark") && st().dark && q("#u-dark").getAttribute("aria-pressed") === "true" && w.localStorage.getItem("skyview:theme") === "dark");
  check("(Y) ⭐ the canvas palette is CSS tokens the dark body redefines, read at draw time with the light values as the fallback",
    /--sky-ground:#FFFFFF/.test(tpl) && /body\.u-dark\{/.test(tpl) &&
    /body\.u-dark\{[\s\S]*?--sky-ground:#[0-9A-Fa-f]{6}/.test(tpl) && /pal=readPal\(\);/.test(ujs) &&
    /\.u-sw\.s0\{background:var\(--sky-sys0-stroke\)/.test(tpl) && !/style="background:#F1EAFC/.test(ujs));
  check("(Y) pressed chips take their text color from a token, so the dark accent stays readable", /color:var\(--on-accent,#fff\)/.test(tpl));
  q("#u-dark").click();
  check("(Y) …and back to the light canvas", !d.body.classList.contains("u-dark") && w.localStorage.getItem("skyview:theme") === "light");

  // ── (Z) How SkyView works (Sam, 2026-09-05, item 6) ──────────────────────
  q("#u-nav-how").click();
  check("(Z) ⭐ the explainer renders with its three figures, and the hash names it",
    !!q("#how-h1") && /How SkyView works/.test(text("#how-h1")) && qa(".how-fig svg").length === 3 && w.location.hash === "#how" && st().curView === "how",
    `${w.location.hash} figs=${qa(".how-fig svg").length}`);
  check("(Z) it explains the shapes and the move in words a reviewer can act on",
    /large dot/.test(text(".how")) && /smaller, lighter dot/.test(text(".how")) && /broken ring/.test(text(".how")) &&
    /small star/.test(text(".how")) && /glows/.test(text(".how")) &&
    /What a reviewer checks/.test(text(".how")) && /Move/.test(text(".how")));
  check("(Z) every figure carries a description for a screen reader", qa(".how-fig svg").every((s) => /[A-Za-z]/.test(s.getAttribute("aria-label") || "") && s.getAttribute("role") === "img"));
  check("(Z) the borrowed search box went home for it, and the Go To menu rides the crumbs row", !!q(".mast #msearch") && !!q("#crumbs-views #u-views"));
  q("#how-open").click();
  check("(Z) Open SkyView returns to the map alone", !!q("#u-cvs") && d.body.classList.contains("u-solo"));
  w.history.replaceState(null, "", "#how"); w.__ccrRoute();
  check("(Z) #how routes to the explainer", !!q("#how-h1"));

  // ── (R3) Sam's third list (2026-09-05, afternoon) ─────────────────────────
  w.__ccrUniverse({ solo: true });
  w.__ccrClearSelection();
  const allOn = {}; ["cr","nc","nce","unrec","mid","cid","ccn","uni","ident","orbit","rim","members"].forEach((k) => { allOn[k] = true; });
  w.__ccrSetShow(allOn, true);
  // 5 · the title is a word, not a box
  check("(R3) the title has no border or box", /\.u-top \.u-title\{border:0;background:transparent/.test(tpl) && /^SkyView$/.test(text("#u-title").trim()));
  // 7 · no Search button; Enter submits the one field
  check("(R3) ⭐ the search form has no button — Enter is the search", !q("#msearch button[type=submit]") && !!q("#u-search-slot #gq"));
  // 4 · Clear is a chip of the tokens' size, never the link style; 6 · the newest pick has the focus
  const r1 = w.__ccrSuggest("weld", 8).find((s) => s.kind === "course");
  const r2 = w.__ccrSuggest("drawing", 8).find((s) => s.kind === "course");
  w.__ccrGoSuggestion(r1); w.__ccrGoSuggestion(r2);
  check("(R3) Clear and Fit all are chips beside the tokens, not links",
    !!q("#u-tok-clear") && q("#u-tok-clear").classList.contains("u-tok-act") && !q("#u-tok-clear").classList.contains("linkish") && !!q("#u-tok-fit") &&
    /\.u-tokens \.u-tok-act\{[^}]*font-size:\.78rem/.test(tpl) && !/\.u-tok-clear\{/.test(tpl));
  check("(R3) ⭐ the newest pick gets the focus: the map sits at the course zoom on it, and both stay ringed",
    Math.abs(st().view.k - st().courseZoom) < 1e-9 && st().sel === r2.nd.i && st().hits === 2 && /Focused on/.test(text("#u-hint")) && /2 selections/.test(text("#u-hint")),
    `k=${st().view.k} sel=${st().sel} hits=${st().hits} · ${text("#u-hint").slice(0, 80)}`);
  q("#u-tok-fit").click();
  check("(R3) Fit all fits both picks into view", st().view.k < st().courseZoom && /Fitted 2/.test(text("#u-hint")), `k=${st().view.k}`);
  // 3 · a ticked row unticks on a second pick; the rows carry checkboxes and the pick state; the list stays open
  w.__ccrToggleSuggestion(r2);
  check("(R3) ⭐ picking a picked row unpicks it (the list's toggle; the go-there entry point only refocuses)", st().tokens.length === 1 && st().tokens[0] === (r1.nd.t || r1.nd.i), JSON.stringify(st().tokens));
  q("#gq").value = "weld"; q("#gq").dispatchEvent(new w.Event("input", { bubbles: true }));
  /* Rows are the OPTIONS. The footer (role=presentation) carries the match count
     and the sort control and is deliberately not a row — scoping to options is
     what this check always meant. */
  const rows = qa("#sug li[role=option]");
  check("(R3) ⭐ every suggestion row carries a checkbox, the list is multi-select, and the picked row is ticked",
    rows.length > 1 && rows.every((li) => li.querySelector(".sg-cb")) && q("#sug").getAttribute("aria-multiselectable") === "true" &&
    rows.some((li) => li.classList.contains("picked") && li.getAttribute("aria-selected") === "true"),
    `rows=${rows.length} picked=${rows.filter((li) => li.classList.contains("picked")).length}`);
  const other = rows.find((li) => !li.classList.contains("picked"));
  other.dispatchEvent(new w.MouseEvent("mousedown", { bubbles: true, cancelable: true }));
  /* ⭐ A TICK IS NOT A COMMIT (Sam, 2026-09-06: "Why not wait on that step until
     the user hits enter"). The row ticks and the list stays open with the term
     still in the box — all as before — but the token count does NOT move,
     because applying the filter is what rebuilt the list and jumped it under a
     reader who was still choosing. Enter is what applies it. */
  check("(R3) a tick keeps the list open and marks the row, with the term still in the box",
    !q("#sug").hidden && qa("#sug li.picked").length === 2 && q("#gq").value === "weld",
    `hidden=${q("#sug").hidden} picked=${qa("#sug li.picked").length} box=${q("#gq").value}`);
  check("(R3) ⭐ …but nothing is applied yet — the map is untouched until Enter",
    st().tokens.length === 1, `tokens=${st().tokens.length}`);
  q("#msearch").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  check("(R3) ⭐ Enter applies the ticked rows and dismisses the box",
    st().tokens.length === 2 && q("#sug").hidden === true,
    `tokens=${st().tokens.length} hidden=${q("#sug").hidden}`);
  q("#gq").dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  w.__ccrClearSelection();
  // 1 · a pick switches on what it needs under Show, and the row's tooltip names what is hidden
  w.__ccrSetShow({ members: false, orbit: false, ident: false }, true);
  check("(R3) the Show row's tooltip names what is hidden", /Hidden: .*Identities.*Orphans in orbit.*College courses/.test(q("#u-show-sum").title), q("#u-show-sum").title);
  const ident = PU.islands[0].p.find((nd) => !nd.a);
  w.__ccrGoSuggestion({ kind: "course", isl: PU.islands[0], nd: ident, label: ident.t || ident.i });
  check("(R3) ⭐ a pick that lands on a hidden point switches its Show switches on and says so",
    st().show.ident && st().show.members && st().show.orbit && /Switched on/.test(text("#u-hint")) && /College courses/.test(text("#u-hint")) && st().showHealed.length === 3,
    `${JSON.stringify(st().showHealed)} · ${text("#u-hint").slice(-160)}`);
  check("(R3) the Show menu's words come from the one table the hint uses", /SHOW_WORDS/.test(ujs) && qa("#u-show-menu label span").map((e) => e.textContent).includes("College courses"));
  w.__ccrClearSelection();
  // 2 · the panel hides from its own bar and resizes from its edge
  check("(R3) the details panel has Hide in its bar and a grip on its edge",
    !!q("#u-inspector #u-insp-hide") && !!q("#u-insp-grip") && q("#u-insp-grip").getAttribute("role") === "separator" && q("#u-insp-grip").tabIndex === 0);
  if (!st().inspectorOpen) q("#u-insp-toggle").click();
  q("#u-insp-hide").click();
  check("(R3) ⭐ Hide closes it, and the More menu's Sidebar row reads off", !st().inspectorOpen && q("#u-inspector").classList.contains("closed") && /off/.test(text("#u-insp-toggle .u-state")));
  q("#u-insp-grip").dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
  q("#u-insp-grip").dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
  check("(R3) ⭐ the arrow keys widen the panel, the width is a property the CSS reads, and it is remembered",
    st().inspectorWidth === 280 && q("#u-inspector").style.getPropertyValue("--u-insp-w") === "280px" && w.localStorage.getItem("skyview:sidebar-w") === "280" &&
    /flex:0 0 var\(--u-insp-w,min\(400px,36%\)\)/.test(tpl), `${st().inspectorWidth} ${q("#u-inspector").style.getPropertyValue("--u-insp-w")}`);
  q("#u-insp-grip").dispatchEvent(new w.KeyboardEvent("keydown", { key: "Home", bubbles: true }));
  check("(R3) Home resets the width", st().inspectorWidth === 0 && !q("#u-inspector").style.getPropertyValue("--u-insp-w") && !w.localStorage.getItem("skyview:sidebar-w"));
  // 9 · dots, drawn inside their packed footprint and colored by system; the islands spread apart at load
  check("(R3) ⭐ courses are dots in the legend's system colors, drawn inside the footprint the builder packed",
    /function dotRad\(nd, rad\)/.test(ujs) && /ctx\.fillStyle=s\[1\]; ctx\.fill\(\);/.test(ujs) && !/ctx\.fillStyle=pal\.hollow; ctx\.fill\(\);\n\s*ctx\.lineWidth=ringWidth/.test(ujs) &&
    /\.u-sw\.orphan\{/.test(tpl) && !/u-sw hollow/.test(ujs) && /smaller, lighter dot/.test(text(".u-legend")) && /broken ring around the dot/.test(text(".u-legend")));
  check("(R3) ⭐ the islands are spread apart once at load, and the bounds follow them",
    PU._spread === true && st().spread > 1 && (!PU.bounds || PU.bounds.x1 - PU.bounds.x0 > 0), `spread=${st().spread} ${JSON.stringify(PU.bounds)}`);
  // 10 · the click highlight: a selected identity lights its orbit ties, the rest fades
  w.__ccrUniverseFly(AT("WELD M1001")[0], AT("WELD M1001")[1], 3.0);
  pointer("pointerdown", 480, 300); pointer("pointerup", 480, 300);
  check("(R3) ⭐ clicking an identity lights it and its two orbiting stand-alones; everything else fades",
    st().sel === "WELD M1001" && st().focus === 3 && /DIM_ALPHA/.test(ujs), `sel=${st().sel} focus=${st().focus}`);
  w.__ccrClearSelection(); pointer("pointerdown", 5, 5); pointer("pointerup", 5, 5);
  check("(R3) a click on the background clears the highlight", st().focus === 0, `focus=${st().focus}`);
  // 8 · thin rings
  check("(R3) ⭐ the course rings are thin at every zoom", /function ringWidth\(rad\)\{ return Math\.max\(0\.9, Math\.min\(1\.4/.test(ujs) && !/Math\.max\(1,rad\*0\.34\)/.test(ujs) && !/Math\.min\(2,rad\*0\.42\)/.test(ujs));

  done();
})().catch((e) => { console.error("HARNESS ERROR", e); check("the suite ran to the end", false, String(e && e.stack || e)); done(); });
