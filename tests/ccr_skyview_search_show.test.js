// SkyView — the search dropdown's depth, and the Show switches reaching the map.
//
// Sam, 2026-09-05, two reports one after the other:
//   1. "Search box only delivers a short set of options and should show all or
//      at least allow scroll to show others"
//   2. "Show:All box does not respond when making changes"
//
// Neither was a broken control, and that is why both are worth a test.
//
//   · The dropdown has carried `overflow-y:auto` since it was written, so it
//     always scrolled. It was asked for EIGHT suggestions out of a corpus that
//     routinely holds hundreds, so there was never anything below the fold to
//     scroll to. The guard is on the DEPTH and on the budget that shares it out:
//     the old split reserved "all but four" for disciplines, which reads fine at
//     eight and starves the tail at sixty.
//
//   · Every Show switch changed its label and its hint and moved nothing on the
//     canvas, because individual courses are only drawn past NODE_ZOOM (0.20)
//     and SkyView OPENS at k = 0.100. A control that answers only where the
//     reader is not standing is indistinguishable from one that is broken. The
//     guard is that a discipline holding nothing switched on stops being drawn,
//     at the zoom the map opens on.
//
// Run from repo root: `npm test` (or `node tests/ccr_skyview_search_show.test.js`).
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
 * Deliberately BIGGER than a handful of points: a dropdown budget cannot be
 * tested against a corpus smaller than the budget. Three disciplines —
 *   · Welding      120 identities, all matching "weld", all CREDIT
 *   · Welding Tech  40 identities, all matching "weld", all NONCREDIT
 *   · Art            2 identities, matching nothing, credit
 * — so "weld" has 160 course matches and 2 discipline matches against a limit
 * of 60, and switching noncredit off empties exactly one whole discipline. */
function ident(prefix, n, credit, x, y) {
  const p = [];
  for (let i = 0; i < n; i++)
    p.push(Object.assign({ i: `${prefix} M${1000 + i}`, x: x + (i % 10) * 2, y: y + Math.floor(i / 10) * 2,
             /* ⭐ ONE identity carries the search word as a LATER word, and is the
              * most adopted thing in the island — the shape of the real failure
              * (Sam, 2026-09-06: "weldi" lost Introduction to Welding, which is
              * taught at 24 colleges). Every other title begins with the word, so
              * a string-prefix tier hands all 60 slots to them and this one, the
              * best answer, never reaches the list. */
             /* A level ladder to order: the same course said three ways, plus
              * plenty with no level word at all — which is the real corpus
              * (44% of Welding's titles carry one). */
             t: i === 7 ? `Introduction to Welding Practice ${i}`
               : i % 5 === 1 ? `Beginning Welding Practice ${i}`
               : i % 5 === 2 ? `Intermediate Welding Practice ${i}`
               : i % 5 === 3 ? `Advanced Welding Practice ${i}`
               : `Welding Practice ${i}`,
             n: i === 7 ? 99 : 3, s: 0, f: 0, r: 0, u: 3, c: credit },
             // Every third identity carries articulations, so the switch has both
             // sides to act on. `ar` is ABSENT on the rest, never 0 — that is the
             // payload's own contract (Session 232).
             i % 3 === 0 ? { ar: i + 1 } : {}));
  return p;
}
const U = {
  _generated_from: "fixture",
  counts: { identities: 162, stand_alone: 0, points: 162, orbiting: 0, orbiting_cross: 0, rim: 0, disciplines: 3 },
  why_bits: { subject: 1, subj4: 2, title: 4, top: 8, units: 16, credit: 32 },
  bounds: { x0: -400, x1: 400, y0: -300, y1: 300 },
  islands: [
    { d: "Welding", sh: "welding", x: -200, y: 0, r: 90, n: 120, sa: 0, al: 0, p: ident("WELD", 120, 0, -210, -10) },
    { d: "Welding Technology", sh: "weldtech", x: 40, y: 0, r: 60, n: 40, sa: 0, al: 0, p: ident("WLDT", 40, 1, 30, -6) },
    { d: "Art", sh: "art", x: 240, y: 0, r: 40, n: 3, sa: 1, al: 0, p: [
      /* One stand-alone, so the loner rules have something to act on: it is the
         moon that must not glow, and the one course whose college names it. */
      { i: "ARTS M10AA", x: 248, y: 8, t: "Kite Building", n: 1, s: 0, f: 0, r: 0, u: 1, c: 0,
        a: 1, o: "ARTS M1001", q: 3.1, w: 5 },
      { i: "ARTS M1001", x: 240, y: 0, t: "Drawing", n: 3, s: 0, f: 0, r: 0, u: 3, c: 0 },
      { i: "ARTS M1002", x: 244, y: 4, t: "Painting", n: 2, s: 0, f: 0, r: 0, u: 3, c: 0 },
    ] },
  ],
};
// One college course per identity, all of them matching "weld" by code, so the
// college-course share of the budget has more than it can hold too.
const MEM = { colleges: ["Alpha College"], counts: { identities: 163, members: 163, dropped_no_key: 0, cn_on_multiple_identities: 0 }, m: {} };
U.islands.forEach((I) => I.p.forEach((nd, k) => { MEM.m[nd.i] = [[100000 + k + I.d.length * 1000, `WELD ${k}`, 0]]; }));
// The stand-alone's one college is a different one, so the short form is visible.
MEM.m["ARTS M10AA"] = [[999001, "ART 5", 1]];
MEM.colleges = ["Alpha College", "Beta Community College"];
MEM.counts.members = 163;
const ATLAS = { _generated_from: "fixture", totals: { decision_components: 0, identities_inbrowser: 162,
                suggestion_groups: 0, member_rows: 162 }, disciplines: [
                { name: "Welding", decisions: 0, ids: 120, members: 120, flagged: 0, reviewed: 0 },
                { name: "Welding Technology", decisions: 0, ids: 40, members: 40, flagged: 0, reviewed: 0 },
                { name: "Art", decisions: 0, ids: 2, members: 2, flagged: 0, reviewed: 0 }], detail: {} };

const tpl = fs.readFileSync(path.join(ROOT, "prototype/ccr_atlas_v1.html"), "utf8");
const ujs = fs.readFileSync(path.join(ROOT, "prototype/ccr_universe.js"), "utf8");
const safe = (o) => JSON.stringify(o).replace(/<\//g, "<\\/");
const html = tpl.replace("__DATA__", safe(ATLAS)).replace("__GRAPHJS__", "")
  .replace("__ESLDATA__", "null").replace("__ESLJS__", "")
  .replace("__UNIVDATA__", safe(U)).replace("__UNIVMEM__", safe(MEM)).replace("__UNIVJS__", ujs);

function fakeCtx() {
  const noop = () => {};
  return { setTransform: noop, clearRect: noop, fillRect: noop, beginPath: noop, arc: noop, fill: noop,
           // starPath() closes its path; the membership halo asks for a gradient.
           closePath: noop, createRadialGradient: () => ({ addColorStop: noop }),
           stroke: noop, moveTo: noop, lineTo: noop, save: noop, restore: noop, setLineDash: noop,
           strokeText: noop, fillText: noop, measureText: (t) => ({ width: String(t).length * 6 }),
           fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "", textBaseline: "" };
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
const qa = (s) => [...d.querySelectorAll(s)];
const st = () => w.__ccrUniverseState();
const tick = () => new Promise((r) => setTimeout(r, 0));

(async () => {
  await new Promise((r) => { if (d.readyState === "complete") r(); else w.addEventListener("load", r); });
  await tick();

  // ── (1) the search box goes deep enough to be worth scrolling ─────────────
  /* ⭐ 60 IS THE PAGE, NOT THE LIST (Sam, 2026-09-06: "Can we make the list
   * longer than 60? Maybe with lazy load if needed?"). The ranking is computed
   * ONCE to SUG_MAX and revealed a page at a time — asking suggest() for a
   * bigger limit instead would re-cut the per-kind budget and reorder rows the
   * reader is already looking at. */
  check("(1) the template ranks to SUG_MAX and reveals SUG_LIMIT at a time",
    /var SUG_LIMIT = 60;/.test(tpl) && /var SUG_MAX = 300;/.test(tpl) &&
    /__ccrSuggest\(term, SUG_MAX\)/.test(tpl) && !/__ccrSuggest\(term, 8\)/.test(tpl));
  check("(1) reaching the bottom reveals the next page, and the listener is bound once",
    /sugEl\.addEventListener\("scroll"/.test(tpl) &&
    /sugShown = Math\.min\(sugShown \+ SUG_LIMIT, sugAll\.length\)/.test(tpl) &&
    (tpl.match(/sugEl\.addEventListener\("scroll"/g) || []).length === 1);
  const deep = w.__ccrSuggest("weld", 60);
  check("(1) ⭐ a term matching 160 courses returns a full list of 60, not a short set",
    deep.length === 60, `got ${deep.length}`);
  check("(1) the list says how much it left behind, so 'no more results' is never implied",
    deep.more > 0, `more=${deep.more}`);
  const kinds = deep.reduce((a, s) => (a[s.kindShort] = (a[s.kindShort] || 0) + 1, a), {});
  check("(1) ⭐ no ONE kind crowds the others out of the top of the list",
    kinds.DISC >= 2 && kinds["CRSE IDENTITY"] >= 20 && kinds["COLLEGE CRSE"] >= 10, JSON.stringify(kinds));
  /* The budget must FLOW, or a term with nothing in one bucket returns a short
     list again — the same complaint with a different cause. "art" matches one
     discipline and two courses and no college course code. */
  const flow = w.__ccrSuggest("drawing", 60);
  check("(1) a kind that cannot fill its share hands the room back rather than shortening the list",
    flow.length === Math.min(60, flow.length) && flow.length >= 1 && !flow.some((s) => s == null), `n=${flow.length}`);
  const wide = w.__ccrSuggest("welding practice 1", 60);
  check("(1) the ranked pool is deep enough to rank (the 400-candidate cap would have truncated by island order)",
    /if\(pts\.length>3000\) break;/.test(ujs) && wide.length > 8, `n=${wide.length}`);

  /* ── (1b) typing more of a word must not delete a match ───────────────────
   * Sam, 2026-09-06: "Try 'weldi' after you initially try 'weld' and you'll see
   * that there is no intro course in the list." Measured on the real payload:
   * "weld" put Introduction to Welding first, "weldi" returned it nowhere,
   * because "weld" prefix-matches every Welding identity's ID and one more
   * character drops to the titles alone. */
  {
    const firstCourse = (t) => {
      const a = w.__ccrSuggest(t, 60) || [];
      const c = a.find((x) => x.kind === "course");
      return c ? c.label : "(none)";
    };
    check("(1b) ⭐ the answer is stable as the reader keeps typing the same word",
      firstCourse("weld") === firstCourse("weldi") &&
      firstCourse("weldi") === firstCourse("welding"),
      ["weld", "weldi", "welding"].map((t) => t + "=" + firstCourse(t)).join(" | "));
    check("(1b) ⭐ and the answer is the most-adopted match, not whichever title starts with it",
      /^Introduction to Welding Practice 7$/.test(firstCourse("weldi")), firstCourse("weldi"));
    check("(1b) a match INSIDE a word still ranks below a word-start match",
      firstCourse("elding") !== "(none)");
  }

  // ── the dropdown itself: scrollable, footered, keyboard-carried ───────────
  const gq = q("#gq");
  gq.value = "weld";
  gq.dispatchEvent(new w.Event("input", { bubbles: true }));
  await tick();
  check("(1) ⭐ the dropdown renders every one of them as a pickable option",
    qa("#sug li[role=option]").length === 60, `${qa("#sug li[role=option]").length} options`);
  check("(1) the footer is the LAST child and carries no data-i, so arrow keys never index it",
    q("#sug .sug-more") && q("#sug").lastElementChild === q("#sug .sug-more") &&
    q("#sug .sug-more").dataset.i == null && q("#sug .sug-more").getAttribute("role") === "presentation",
    q("#sug").lastElementChild ? q("#sug").lastElementChild.outerHTML.slice(0, 90) : "∅");
  check("(1) the listbox's own label carries the count AND the order for a screen reader",
    /Showing 60 of \d+/.test(q("#sug").getAttribute("aria-label") || "") &&
    /sorted by best match/.test(q("#sug").getAttribute("aria-label") || ""),
    q("#sug").getAttribute("aria-label"));
  /* ⭐ THE REVEAL, END TO END. jsdom does no layout, so scrollHeight is 0 and a
   * real scroll cannot be simulated — the reveal is driven directly, which is
   * what the scroll handler does, and the assertions are about the CONTRACT it
   * has to keep: more rows, the same rows first (no re-cut), and the reader's
   * place preserved. */
  {
    const firstTen = qa("#sug li[role=option] .sg-l").slice(0, 10).map((e) => e.textContent);
    // jsdom reports 0 for every rectangle, so the handler's "am I at the
    // bottom" test (scrollTop + clientHeight >= scrollHeight - 24) is
    // satisfied by 0 >= -24 — which lets a real scroll event drive the real
    // listener rather than reaching into the page's scope.
    q("#sug").dispatchEvent(new w.Event("scroll"));
    const now = qa("#sug li[role=option]").length;
    check("(1) ⭐ revealing a page grows the list past 60", now > 60, `${now} options`);
    check("(1) ⭐ and the rows already on screen do not move (ranked once, not re-cut)",
      qa("#sug li[role=option] .sg-l").slice(0, 10).map((e) => e.textContent).join("|") === firstTen.join("|"));
    check("(1) the footer counts what is shown against what is ranked",
      /Showing \d+ of \d+/.test((q("#sug .sug-more")||{}).textContent||""),
      (q("#sug .sug-more")||{}).textContent||"∅");
  }
  check("(1) the list is tall enough to be worth scrolling and clips rather than overflowing",
    /max-height:min\(70vh,620px\);overflow-y:auto/.test(tpl));
  check("(1) ⭐ the arrow keys carry the viewport with the cursor",
    /scrollIntoView\(\{ block: "nearest" \}\)/.test(tpl));
  // Arrow-key walk lands on real options only, never on the footer.
  for (let i = 0; i < 61; i++) gq.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  const on = q("#sug li.on");
  check("(1) sixty-one presses wrap inside the sixty options and never light the footer",
    !!on && on.getAttribute("role") === "option" && !on.classList.contains("sug-more"),
    on ? on.className + " " + on.getAttribute("role") : "nothing lit");

  // ── (2) the Show switches reach the map at the zoom it OPENS on ───────────
  /* The real corpus is 159 disciplines wide, so "fit all" lands at k = 0.100 —
     five times below NODE_ZOOM, which is why not one switch moved a pixel. This
     fixture is three disciplines wide and fits at ~0.74, so the condition has to
     be recreated rather than waited for: fly to a magnification below the band
     where individual courses are drawn, and assert the switches still land. */
  w.__ccrUniverseFly(0, 0, 0.10);
  const k0 = st().view.k;
  check("(2) the map is standing below NODE_ZOOM, where no individual course is drawn",
    k0 <= st().nodeZoom, `k=${k0} nodeZoom=${st().nodeZoom}`);
  const all = st();
  check("(2) with everything on, all three disciplines are drawn",
    all.islandsShown === 3 && all.coursesShown === 163, `${all.islandsShown} islands / ${all.coursesShown} courses`);
  // Noncredit off: Welding Technology holds nothing else, so it leaves the map.
  w.__ccrSetShow({ nc: false, nce: false });
  const ncOff = st();
  check("(2) ⭐ switching noncredit off drops the discipline that teaches only noncredit — at 10% zoom",
    ncOff.islandsShown === 2 && ncOff.coursesShown === 123 && st().view.k === k0,
    `${ncOff.islandsShown} islands / ${ncOff.coursesShown} courses at k=${st().view.k}`);
  w.__ccrSetShow({ nc: true, nce: true });
  check("(2) switching it back on brings the discipline back", st().islandsShown === 3);
  // Deselect all: the map empties rather than sitting there unchanged.
  qa("#u-show-menu input[data-show]").forEach(() => {});
  q("#u-show-none").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  check("(2) ⭐ Deselect all empties the map instead of leaving it identical",
    st().islandsShown === 0 && st().coursesShown === 0,
    `${st().islandsShown} islands / ${st().coursesShown} courses`);
  check("(2) the summary word agrees with the switches",
    q("#u-show-word").textContent === "0 of 14", q("#u-show-word").textContent);
  q("#u-show-every").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  check("(2) Show everything restores every discipline",
    st().islandsShown === 3 && q("#u-show-word").textContent === "All");
  check("(2) the hint says WHY a low-zoom map moves so little, rather than leaving the reader to guess",
    /At this magnification the map draws <strong>disciplines<\/strong>/.test(q("#u-hint").innerHTML),
    q("#u-hint").textContent.slice(0, 140));
  // The switch state is memoized; the memo must not outlive a change to it.
  check("(2) the per-island count is memoized on a signature of the switches, not computed per frame",
    /function showSig\(\)/.test(ujs) && /isl\._passSig!==sig/.test(ujs));
  check("(2) ⭐ what is not drawn cannot be picked either",
    /if\(!islandPass\(isl\)\) continue;/.test(ujs) && /if\(!creditShown\(nd\)\) continue;/.test(ujs));

  /* ── (3) a pick must land somewhere you can SEE ───────────────────────────
     Dropping an empty discipline from the map created a second-order problem
     the Chromium sweep caught: picking that discipline from the search list now
     lands on nothing at all. healShow answered it for a COURSE pick (2026-09-05,
     "Courses are no longer visible when I filter for welding subject"); the
     discipline branch called healShow(null), which turns on `ident` and nothing
     else, and a typed search never healed at all. */
  w.__ccrSetShow({ cr: false, nc: false, nce: false, unrec: false, mid: false, cid: false,
                   ccn: false, uni: false, ident: false, orbit: false, rim: false, members: false });
  check("(3) with every switch off there is nothing on the map", st().islandsShown === 0);
  const disc = w.__ccrSuggest("welding", 60).find((x) => x.kind === "subject");
  w.__ccrGoSuggestion(disc);
  check("(3) ⭐ picking a discipline whose every course is switched off switches back what it needs",
    st().islandsShown > 0 && st().showHealed.length > 0,
    `islands=${st().islandsShown} healed=${JSON.stringify(st().showHealed)}`);
  check("(3) and the hint names the switches it turned on rather than doing it silently",
    /Switched on/.test(q("#u-hint").innerHTML), q("#u-hint").textContent.slice(0, 120));
  /* ⚠️ The other half of the rule: a filter that is WORKING must not be healed.
     Noncredit off still leaves Welding its 120 credit courses, so picking it
     must change nothing about the switches. */
  w.__ccrSetShow({ nc: false, nce: false });
  const before = JSON.stringify(st().show);
  w.__ccrGoSuggestion(w.__ccrSuggest("welding", 60).find((x) => x.kind === "subject"));
  check("(3) ⭐ a filter that still leaves something to look at is left alone",
    JSON.stringify(st().show) === before && st().showHealed.length === 0,
    `healed=${JSON.stringify(st().showHealed)}`);
  check("(3) a typed search heals on the same terms, from both of its branches",
    /healIsland\(pick\);/.test(ujs) && /healHits\(searchHits\);/.test(ujs) &&
    /healIsland\(I\);/.test(ujs) && !/healShow\(null\);/.test(ujs));

  /* ── (4) sorting by name, so near-identical titles sit together ───────────
     Sam, 2026-09-05, looking at the live list for "weld": "I probs would have
     spotted that earlier if the dropdown in SkyView showed all the welding
     courses in order--would have seen 2 named similarly or the same."

     The depth was not the problem; the SORT was. After the relevance tier the
     list orders by member count descending, so a small identity is buried by
     construction — and a duplicate of a well-adopted course is the less-adopted
     twin. On the live corpus "weld" matches 591 points: Introduction to Welding
     (24 colleges) ranks 1st, Introduction to the Welding Processes (3 colleges)
     ranks 132nd.

     ⚠️ And the first fix was wrong in a way this fixture reproduces: sorting the
     whole match set by name and taking the first N returns the titles beginning
     with "A". The window has to be CENTERED on the best match. */
  w.__ccrSetShow({ cr: true, nc: true, nce: true, unrec: true, mid: true, cid: true,
                   ccn: true, uni: true, ident: true, orbit: true, rim: true, members: true });
  check("(4) the ordering is a mode, defaulting to relevance",
    typeof w.__ccrSuggestOrder === "function" && w.__ccrSuggestOrder() === "relevance");

  const rel = w.__ccrSuggest("welding", 12).filter((x) => x.kind === "course").map((x) => x.label);
  check("(4) relevance still leads with the most-taught course",
    rel[0] === "Welding Practice 0" || /Welding Practice/.test(rel[0] || ""), rel.slice(0, 2).join(" | "));

  w.__ccrSuggestOrder("name");
  const named = w.__ccrSuggest("welding", 12).filter((x) => x.kind === "course").map((x) => x.label);
  const asc = named.every((t, i) => i === 0 || named[i - 1].toLowerCase() <= t.toLowerCase());
  check("(4) ⭐ by name, the course rows are in alphabetical order", asc, named.slice(0, 4).join(" | "));
  /* The anchor is the top relevance hit; the window sits AROUND it, so the list
     must not simply start at the alphabetical beginning of the match set. */
  /* ⚠️ This fixture's titles are all "Welding Practice N", so its alphabet
     happens to start at the anchor and cannot distinguish a centered window
     from one taken at the start — the assertion is on the MECHANISM instead,
     and the live-corpus proof is in the lessons doc (for "weld", the window
     runs Introduction to Multi-Process Welding → Metal Fabrication, with the
     two intro courses one row apart at its middle). */
  check("(4) ⭐ the window centers on the best match rather than starting at 'A'",
    /var anchor = pts\.length \? pts\[0\] : null;/.test(ujs) &&
    /byName\.indexOf\(anchor\)/.test(ujs) &&
    /Math\.max\(0, Math\.min\(at-before, byName\.length-want\[1\]\)\)/.test(ujs));
  check("(4) the anchor is inside the window it centered on",
    named.indexOf(rel[0]) >= 0, `anchor ${rel[0]} at ${named.indexOf(rel[0])}`);
  w.__ccrSuggestOrder("relevance");
  check("(4) the mode toggles back", w.__ccrSuggestOrder() === "relevance");
  check("(4) the credit partition is a relevance device and never splits a by-name list",
    /if\(ord!=="name"\)\{\s*\n\s*var byCredit/.test(ujs));

  /* ── (5) the sky metaphor: stars, glow, and moons ─────────────────────────
     Sam, 2026-09-05: "instead of a square we make each local member course a
     muted star… Could add a gentle glow to all circles as if they were light
     emitting stars" and then the rule that gives it meaning: "leave all the
     loners and nonmembers without the halo effect--haven't earned their wings
     yet and are still moons."

     ⭐ The glow is the MEMBERSHIP signal, not decoration: a point colleges have
     joined emits light, a stand-alone reflects it. So the halo answers the map's
     central question without a word, and the rule has to hold in the code rather
     than in a comment. */
  check("(5) ⭐ only a joined identity emits light — a stand-alone is a moon",
    /function emitsLight\(nd\)\{ return !!nd && !nd\.a && \(nd\.n\|\|0\) > 1; \}/.test(ujs) &&
    /if\(emitsLight\(nd\) && !dimmed\) haloAround/.test(ujs));
  check("(5) the halo is skipped where it would smear rather than glow",
    /if\(r < 2\.2\) return;/.test(ujs));
  check("(5) a college's course is drawn as a star, not a square",
    /function starPath\(cx, cy, r, points\)/.test(ujs) && /starPath\(x, y, 5\.2\);/.test(ujs) &&
    !/ctx\.lineTo\(x-3\.5,y\+3\.5\)/.test(ujs));
  check("(5) the legend and the explainer say star, not square",
    /a small star/.test(ujs) && /<strong>small star<\/strong>/.test(ujs) &&
    !/<strong>small square<\/strong>/.test(ujs));
  check("(5) the explainer names the glow rule in plain words",
    /A point that <strong>glows<\/strong> is a course more than one college teaches/.test(ujs));
  check("(5) the legend swatch is the same five-pointed mark the canvas draws",
    /\.u-sw\.member\{border:0;background:var\(--cobalt\);/.test(tpl) && /clip-path:polygon\(50% 0%/.test(tpl));

  /* ── (6) a loner names its one college ────────────────────────────────────
     Sam: "it would be helpful to have the short college on the loners." A
     stand-alone IS one college's course, so naming the college identifies it
     where three neighbors read `Introduction to Welding & Safety`. A clustered
     identity has many colleges and no single one to name. */
  const U2 = w.CPL_CCR_UNIVERSE;
  const loner = U2.islands.flatMap((I) => I.p).find((n) => n.a);
  const joined = U2.islands.flatMap((I) => I.p).find((n) => !n.a);
  check("(6) ⭐ a stand-alone resolves to its one college, short form",
    !!w.__ccrLoneCollege(loner) && w.__ccrLoneCollege(loner).length > 1,
    `${loner && loner.i} -> ${w.__ccrLoneCollege(loner)}`);
  check("(6) a clustered identity names none — it has many and no single one",
    w.__ccrLoneCollege(joined) === "", `${joined && joined.i} -> ${JSON.stringify(w.__ccrLoneCollege(joined))}`);
  check("(6) the short form drops the College suffix when no resolver is loaded",
    /replace\(\/\\s\+\(Community\\s\+\)\?College\$\/i,""\)/.test(ujs));
  check("(6) the member hover carries the catalog description, trimmed",
    /Sam, 2026-09-05: "The course title and description should show/.test(ujs) &&
    /esc\(trunc\(info\.desc, 260\)\)/.test(ujs));

  /* ── (7) an open identity keeps its own name in the middle ────────────────
     Sam, 2026-09-05: "Is there a reason the parent course isn't in the middle of
     the big circle? Seems it should be but maybe there's logic behind it."

     ⚠️ There WAS logic, and it was his own (2026-09-03): labels sit away from
     the circle with a thin leader, so a reader knows which dot they are about to
     drag. That is right for a 12px dot and wrong for an OPEN identity, which is
     drawn on a wide pale disc with its college courses pushed to the rim — the
     middle is the emptiest space on screen and the leader points from it to a
     corner. So the leader stays the default and the inside is the exception. */
  check("(7) ⭐ an open identity is offered the middle of its disc",
    /var willOpen = !nd\.a && \(k>MEMBER_ZOOM_ALL/.test(ujs) &&
    /open:willOpen && show\.members,/.test(ujs) &&
    /var inside = !mem && \(q\.open \|\| \(q\.rad >= 34/.test(ujs));
  check("(7) an inside label draws no leader — position is the tie",
    /No leader: the label IS this circle's, by sitting in it\./.test(ujs));
  check("(7) when it does not fit, the leader lands ON the circle's edge",
    /var ex=q\.px\+at\.sx\*q\.rad\*0\.98/.test(ujs) && !/q\.rad\*0\.71/.test(ujs));
  check("(7) ⭐ and the disc carries the identity system's color",
    /ctx\.globalAlpha=ctx\.globalAlpha\*0\.13;\s*\n\s*ctx\.fillStyle=sys\[1\]/.test(ujs));

  /* ── (8) short college names throughout ───────────────────────────────────
     Sam: "Could use the short names on the colleges throughout." A ring of 24
     spokes is where the repeated word "College" costs most and says least. The
     canonical name stays on the row's title so nothing is lost. */
  check("(8) the map's member labels use the short form",
    /lines:\[m\.n\+" · "\+trunc\(shortCollege\(m\.c\),26\)\]/.test(ujs));
  check("(8) so does the hover card",
    /return '<b>'\+esc\(m\.n\)\+'<\/b> '\+esc\(shortCollege\(m\.c\)\)/.test(ujs));
  check("(8) and the sidebar rows, with the canonical name kept on hover",
    /title="'\+esc\(m\.c\)\+'">'\+esc\(shortCollege\(m\.c\)\)/.test(ujs));

  /* ── (9) nothing lays a name across an open identity's disc ───────────────
     Sam, 2026-09-05: "probably no labels should transect the CCR circle." The
     disc is the thing being studied, and a neighbor's name across it reads as
     belonging to it. Recorded as an occupied box before any label is placed, so
     the existing placer treats it like a clash — try another corner, then drop
     rather than stack. The identity's OWN label is exempt: the inside branch
     puts it at the centre before any box is consulted. */
  check("(9) ⭐ an open identity's disc is reserved ground for label placement",
    /var discBoxes=\[\];/.test(ujs) && /discBoxes\.push\(\[p\[0\]-\(R0\+\(rings-1\)\*15\+10\)/.test(ujs) &&
    /placeLabels\(labelQueue, showLabels\)\.concat\(discBoxes\)/.test(ujs));
  check("(9) and it is cleared every frame, not accumulated",
    /memberPts=\[\]; discBoxes=\[\];/.test(ujs));

  /* ── (10) the title wears its identity system's color ─────────────────────
     Sam: "The label color should correspond with the MID,CID,CCN color."
     ⚠️ Measured in both themes before shipping: 5.15–8.44:1 on white,
     6.76–9.23:1 on the dark ground. A stand-alone keeps the muted ink — it is a
     moon, and coloring it would claim a membership it does not have. */
  check("(10) ⭐ the first line takes the system color; the id line stays muted",
    /function labelInk\(nd\)\{/.test(ujs) &&
    /return pal\["sys"\+i\+"Stroke"\] \|\| pal\.ink;/.test(ujs) &&
    /li\?pal\.inkMuted:labelInk\(q\.nd\)/.test(ujs));
  check("(10) a stand-alone keeps the muted ink — a moon claims no membership",
    /if\(!nd \|\| nd\.a\) return pal\.ink;/.test(ujs));

  /* ── (11) Sam's ruling 3 (2026-09-05): the three interface fixes ──────────
     Driven on the real page, not asserted against the source — a regex would
     confirm the control exists, which was never the half in doubt.
     ⚠️ Earlier sections leave picks behind, so this section picks only rows the
     list reports as UNSELECTED: a pick on a selected row TOGGLES IT OFF, and the
     first draft of this block spent its first click removing a token and then
     asserted the count had gone up. */
  const unpicked = () => qa("#sug li[role=option]").find((li) => li.getAttribute("aria-selected") !== "true");
  const gq11 = q("#gq");
  gq11.value = "welding";
  gq11.dispatchEvent(new w.Event("input", { bubbles: true }));
  await tick();
  gq11.focus();
  const nBefore = w.__ccrTokenKeys().length;

  // 11a — THE LIST STAYS WHERE IT WAS ON MULTI-SELECT. Sam: "focus jumps back
  // to the search bar on every selection when picking multiple courses and
  // should stay put." openSug() rebuilds the list with `scrollTop = 0`, so with
  // S231's 60-row dropdown every tick threw the reader back to the top.
  // ⚠️ The first draft of this fix FORCED focus onto the search box, which is
  // the complaint restated as a feature — and this suite caught it by passing
  // just as well without it (jsdom: the mousedown preventDefault means focus
  // never leaves #gq). What was actually moving was the scroll.
  const row11 = unpicked();
  check("(11a) the list offers an unpicked row", !!row11);
  const sug11 = q("#sug");
  // jsdom reports 0 for every layout box, so give the element a real scroll
  // extent to move: without this the assertion passes on 0 === 0 and proves
  // nothing, which is the failure mode this whole section exists to avoid.
  Object.defineProperty(sug11, "scrollHeight", { value: 4000, configurable: true });
  Object.defineProperty(sug11, "clientHeight", { value: 300, configurable: true });
  let scrollNow = 900;
  Object.defineProperty(sug11, "scrollTop", {
    configurable: true,
    get(){ return scrollNow; },
    set(v){ scrollNow = v; },
  });
  row11 && row11.dispatchEvent(new w.MouseEvent("mousedown", { bubbles: true, cancelable: true }));
  await tick();
  check("(11a) ⭐ the pick lands", w.__ccrTokenKeys().length === nBefore + 1,
    `${nBefore} -> ${w.__ccrTokenKeys().length}`);
  check("(11a) ⭐ the list is still where the reader left it, not snapped back to the top",
    scrollNow === 900, `scrollTop = ${scrollNow}`);
  check("(11a) focus never left the search box, so the keyboard still works",
    d.activeElement === gq11 || d.activeElement === d.body,
    `activeElement = ${d.activeElement && (d.activeElement.id || d.activeElement.tagName)}`);
  const second11 = unpicked();
  second11 && second11.dispatchEvent(new w.MouseEvent("mousedown", { bubbles: true, cancelable: true }));
  await tick();
  check("(11a) a second pick lands, and the list still has not moved",
    w.__ccrTokenKeys().length === nBefore + 2 && scrollNow === 900,
    `n=${w.__ccrTokenKeys().length} scrollTop=${scrollNow}`);
  delete sug11.scrollTop;

  // 11b — FULL TITLE ON HOVER FOR THE FILTER CHIPS. `.u-tok-l` is
  // text-overflow:ellipsis, so the tooltip is the only way to read a clipped
  // name; it used to hang on that span alone, leaving the kind, the padding and
  // the × — most of the chip — with no tooltip at all.
  const chips11 = qa("#u-tokens .u-tok");
  check("(11b) the picks render as chips", chips11.length >= 2, `${chips11.length} chips`);
  check("(11b) ⭐ the WHOLE chip carries a title, not just the clipped label",
    chips11.length > 0 && chips11.every((c) => (c.getAttribute("title") || "").length > 0),
    JSON.stringify(chips11.map((c) => c.getAttribute("title"))));
  check("(11b) the title carries the full label, so the clipped half is readable",
    chips11.every((c) => {
      const lab = c.querySelector(".u-tok-l");
      return lab && (c.getAttribute("title") || "").indexOf(lab.textContent) >= 0;
    }));
  check("(11b) one tooltip, not two — the label no longer carries its own",
    chips11.every((c) => { const l = c.querySelector(".u-tok-l"); return l && !l.hasAttribute("title"); }));

  // 11c — RECENTER ON THE CURRENT SELECTION. ↺ resets to the whole universe,
  // which is what ↺ is for; with ONE pick there was no way back to the pick.
  check("(11c) with several picks the button is Fit all, beside Clear",
    !!q("#u-tok-fit") && /Fit all/.test(q("#u-tok-fit").textContent) && !!q("#u-tok-clear"));
  let guard = 0;
  while (w.__ccrTokenKeys().length > 1 && guard++ < 20) {
    const xs = qa("#u-tokens .u-tok .u-tok-x");
    xs[xs.length - 1].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await tick();
  }
  check("(11c) ⭐ ONE pick still gets a recenter control (it used to render only above 1)",
    w.__ccrTokenKeys().length === 1 && !!q("#u-tok-fit"),
    `n=${w.__ccrTokenKeys().length} fit=${!!q("#u-tok-fit")}`);
  check("(11c) and it reads Recenter, because there is nothing to fit together",
    q("#u-tok-fit") && /Recenter/.test(q("#u-tok-fit").textContent),
    q("#u-tok-fit") && q("#u-tok-fit").textContent);
  check("(11c) Clear is gone with one pick — the × on the chip already is Clear",
    !q("#u-tok-clear"));
  check("(11c) ↺ is left alone — resetting to the whole universe is what it is for",
    /id="u-reset"/.test(ujs) && /searchHits=\[\]; resetView\(\);/.test(ujs));
  check("(11c) it actually recenters rather than no-opping on a single pick",
    w.__ccrFitSelection() === true);

  /* ── (12) Sam's ruling 1 (2026-09-05): articulation counts on the map ─────
     ⭐ Articulation runs OPPOSITE to adoption — the map sizes a point by how
     many colleges teach it, and the most-articulated identities are routinely
     its smallest. So this is a signal the map could not already imply. */
  const withAr = U.islands[0].p.filter((nd) => nd.ar > 0).length;
  const noAr = U.islands[0].p.length - withAr;
  check("(12) the fixture has both kinds to filter", withAr > 0 && noAr > 0, `${withAr}/${noAr}`);
  check("(12) `ar` is absent, not 0, on an identity with none — 'none recorded' is not a measurement",
    U.islands[0].p.every((nd) => nd.ar === undefined || nd.ar > 0));

  // the Show switches: two, like every other group here
  const setShow = (key, on) => {
    const cb = q(`#u-show-menu input[data-show="${key}"]`);
    if (!cb) return false;
    if (cb.checked !== on) cb.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    return true;
  };
  check("(12) both switches exist in the Show menu, as their own group",
    !!q('#u-show-menu input[data-show="arty"]') && !!q('#u-show-menu input[data-show="noart"]'));
  setShow("noart", false);
  const only = w.__ccrUniverseState();
  check("(12) ⭐ unticking 'No articulation recorded' leaves only the articulated points",
    only.coursesShown === U.islands.reduce((a, I) => a + I.p.filter((nd) => nd.ar > 0).length, 0),
    `shown ${only.coursesShown}`);
  setShow("noart", true); setShow("arty", false);
  const inverse = w.__ccrUniverseState();
  check("(12) and unticking 'Has articulations' leaves exactly the complement",
    inverse.coursesShown === U.islands.reduce((a, I) => a + I.p.filter((nd) => !(nd.ar > 0)).length, 0),
    `shown ${inverse.coursesShown}`);
  check("(12) the two together still cover every point (no point is filtered by both)",
    only.coursesShown + inverse.coursesShown ===
      U.islands.reduce((a, I) => a + I.p.length, 0));
  setShow("arty", true);
  check("(12) both back on restores the whole map",
    w.__ccrUniverseState().coursesShown === U.islands.reduce((a, I) => a + I.p.length, 0));

  // the count reaches the reader as a WORD on the identity, not a glyph
  // Use a REAL suggestion object rather than a hand-built one: the token
  // machinery reads fields a literal does not carry, and a hand-built stub
  // would be testing the stub.
  const artNode = U.islands[0].p.find((nd) => nd.ar > 0);
  const artSug = w.__ccrSuggest(artNode.t, 60).find((x) => x.kind === "course" && x.nd && x.nd.i === artNode.i)
              || w.__ccrSuggest(artNode.i, 60).find((x) => x.kind === "course");
  check("(12) the articulated identity is reachable from the search", !!artSug, artNode && artNode.i);
  artSug && w.__ccrGoSuggestion(artSug);
  await tick();
  const panel = d.body.innerHTML;
  check("(12) ⭐ the count is on the identity, spelled as a word",
    new RegExp(`${artNode.ar}\\s*articulations?`).test(panel),
    `looking for "${artNode.ar} articulations"`);
  check("(12) it is a word, not an emoji or an icon (the glyph rule)",
    !/[\u{1F300}-\u{1FAFF}]\s*\d+\s*articulation/u.test(panel));

  // ── (13) coming back out: the scroll, the cursor, and the click path ──────
  /* Three reports from the 2026-09-06 observation session, and two of them turn
   * out to be one defect. jsdom does no layout, so scrollTop is always 0 and a
   * behavioural test is impossible — the property is instrumented instead, which
   * is the actual contract: reset where the DOCUMENT changes, never where it
   * repaints. */
  const detail = q("#u-detail");
  let scrollWrites = [];
  Object.defineProperty(detail, "scrollTop", {
    configurable: true, get: () => 0, set: (v) => { scrollWrites.push(v); },
  });

  const discSug = w.__ccrSuggest("Welding", 60).find((x) => x.kind === "subject");
  w.__ccrGoSuggestion(discSug);
  await tick();
  check("(13) the discipline panel opens and lands at the top",
    scrollWrites.length >= 1 && scrollWrites.every((v) => v === 0), JSON.stringify(scrollWrites));

  scrollWrites = [];
  const firstId = q("#u-detail .idlist .ttl[data-go]");
  check("(13) the discipline panel lists its identities", !!firstId);
  firstId.click();
  await tick();
  check("(13) ⭐ opening an identity lands at the TOP of content the reader has never seen",
    scrollWrites.length >= 1 && scrollWrites.every((v) => v === 0), JSON.stringify(scrollWrites));

  check("(13) ⭐ the identity offers the click path back to its discipline — a word, not a glyph",
    !!q("#u-back-isl") && /^Back to Welding$/.test(q("#u-back-isl").textContent.trim()),
    q("#u-back-isl") && q("#u-back-isl").textContent);

  const chip = q("#u-detail .chip");
  check("(13) the identity-system chip says what follows from the system, not just its name",
    !!chip && /re-key/.test(chip.getAttribute("title") || ""),
    chip && (chip.getAttribute("title") || "∅ no title"));

  /* ⚠️ THE HALF THAT MUST NOT REGRESS. renderNode() fires on every filter
   * keystroke, description toggle and staged move; resetting there would throw
   * the reader to the top mid-task — the friction Sam reported on 2026-09-05
   * (ruling 3a), restated as a feature. */
  scrollWrites = [];
  const desc = q("#u-detail .mlist .cd[data-desc]");
  check("(13) the identity carries a member row to re-render", !!desc);
  desc && desc.click();
  await tick();
  check("(13) ⚠️ a re-render INSIDE the panel does not touch the scroll",
    scrollWrites.length === 0, JSON.stringify(scrollWrites));

  q("#u-back-isl").click();
  await tick();
  check("(13) Back returns to the discipline panel",
    !q("#u-back-isl") && /course identit/.test(detail.textContent));

  /* ⭐ THE CRUX. Escape used to work only if you had ARRIVED by keyboard: the
   * mouse path never set the cursor, so kbInside stayed false and the footer's
   * unconditional "Esc comes back out" was false for every mouse user. */
  q("#u-detail .idlist .ttl[data-go]").click();
  await tick();
  check("(13) an identity is open again, reached by CLICKING", !!q("#u-back-isl"));
  q("#u-cvs").dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await tick();
  check("(13) ⭐ Escape backs out of a selection made with the MOUSE, not only the keyboard",
    !q("#u-back-isl") && /course identit/.test(detail.textContent),
    detail.textContent.slice(0, 120));

  // ── (14) similar courses, ordered by level ────────────────────────────────
  /* Sam, 2026-09-06: "Would be great if the side bar details could show courses
   * similar to the selected courses in order… all the beg intros followed by
   * int intros." */
  {
    const target = U.islands[0].p.find((nd) => nd.i === "WELD M1000");
    w.__ccrGoSuggestion({ kind: "course", isl: U.islands[0], nd: target, label: target.t });
    await tick();
    const heads = qa("#u-detail .idlist.sim .sim-h").map((e) => e.textContent.trim());
    check("(14) the panel offers similar courses in this discipline",
      qa("#u-detail .idlist.sim li").length > 0 && /Similar courses in Welding/.test(d.body.textContent),
      `${qa("#u-detail .idlist.sim li").length} rows`);
    check("(14) ⭐ the rungs are in order: beginning, then intermediate, then advanced",
      heads.filter((x) => /^(Beginning|Intermediate|Advanced)$/.test(x)).join(",") ===
        ["Beginning", "Intermediate", "Advanced"].filter((L) => heads.indexOf(L) >= 0).join(","),
      heads.join(" | "));
    check("(14) ⭐ beginning really does come before advanced in the DOM",
      heads.indexOf("Beginning") >= 0 && heads.indexOf("Advanced") > heads.indexOf("Beginning"),
      heads.join(" | "));
    check("(14) a course whose title states no level is listed last, not guessed at",
      heads.indexOf("Level not stated") === heads.length - 1 || heads.indexOf("Level not stated") < 0,
      heads.join(" | "));
    /* ⚠️ THE LEVEL WORD MUST NOT DRIVE THE SIMILARITY, or the two rungs of one
     * course score as less alike than two unrelated beginning courses — and the
     * ladder is the point. */
    const labels = qa("#u-detail .idlist.sim .ttl").map((e) => e.textContent);
    check("(14) ⭐ the ladder holds every rung of the same course, not one level only",
      labels.some((t) => /^Beginning /.test(t)) && labels.some((t) => /^Advanced /.test(t)),
      labels.slice(0, 4).join(" | "));
    check("(14) every similar course is a link that opens it",
      qa("#u-detail .idlist.sim [data-go]").length === qa("#u-detail .idlist.sim .ttl").length);
    check("(14) the selected course does not list itself",
      labels.every((t) => t !== (target.t || target.i)), target.t);
  }

  // ── (15) Sam's seven calls of 2026-09-06 ──────────────────────────────────
  {
    // 2 · the chip's label is a control, not just a label.
    // Earlier sections leave picks behind, and the button's wording depends on
    // how many there are — so this starts from a clean selection.
    if (typeof w.__ccrClearSelection === "function") w.__ccrClearSelection();
    else qa(".u-tok .u-tok-x").forEach((x) => x.click());
    await tick();
    w.__ccrGoSuggestion({ kind: "subject", isl: U.islands[0], label: U.islands[0].d });
    await tick();
    const go = q(".u-tok-go");
    check("(15) ⭐ a search chip's label is a button that goes back to that pick",
      !!go && /^Go back to /.test(go.getAttribute("aria-label") || ""),
      go && go.getAttribute("aria-label"));
    check("(15) the × keeps its own job beside it",
      !!q(".u-tok .u-tok-x") && qa(".u-tok")[0].querySelectorAll("button").length === 2,
      `${qa(".u-tok")[0].querySelectorAll("button").length} buttons in the first chip, ${qa(".u-tok").length} chip(s)`);

    // 5 · the view button names its target
    const fit = q("#u-tok-fit");
    check("(15) ⭐ with one pick the button names what it re-centres on",
      !!fit && /^Recenter on /.test(fit.textContent) && /Welding/.test(fit.textContent),
      fit && fit.textContent);

    // 3 · the whole row opens the course, and the chip stays inert
    const row = q("#u-detail ul.idlist > li");
    const want = row.querySelector("[data-go]").dataset.go;
    row.querySelector(".sub").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await tick();
    check("(15) ⭐ clicking anywhere in a row opens that course", st().sel === want,
      `${st().sel} vs ${want}`);
    w.__ccrGoSuggestion({ kind: "subject", isl: U.islands[0] });
    await tick();
    const held = st().sel, chip = q("#u-detail ul.idlist > li .chip");
    if (chip) chip.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await tick();
    check("(15) ⚠️ but the identity chip stays inert, so its tooltip survives",
      st().sel === held, `${held} -> ${st().sel}`);

    // 4 · a carried course drops on a destination in the panel
    const target = U.islands[0].p.find((nd) => nd.i === "WELD M1000");
    w.__ccrGoSuggestion({ kind: "course", isl: U.islands[0], nd: target, label: target.t });
    await tick();
    const mv = q("#u-detail .mv"), dest = q("#u-detail .idlist.sim [data-go]");
    check("(15) the panel holds a draggable course and a destination at once", !!mv && !!dest);
    const before = st().moves.length;
    mv.click(); await tick();
    check("(15) picking one up says so where the destinations are",
      /Carrying/.test(q("#u-detail").textContent), q("#u-detail").textContent.slice(0, 60));
    const to = dest.dataset.go;
    dest.click(); await tick();
    check("(15) ⭐ clicking a destination MOVES the carried course instead of navigating",
      st().moves.length === before + 1 && st().moves[st().moves.length - 1].to === to,
      `moves ${before} -> ${st().moves.length}`);

    // 7 · the skip link, inside the element full screen paints
    const full = q("#u-full"), skip = q(".u-skip");
    const FOC = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,summary,[tabindex]:not([tabindex="-1"])';
    check("(15) ⭐ a skip link reaches the map, and it is the first stop inside #u-full",
      !!skip && skip.getAttribute("href") === "#u-cvs" && full.contains(skip) &&
      [...full.querySelectorAll(FOC)].indexOf(skip) === 0,
      skip ? "present" : "missing");
  }
  // 6 · Enter runs the search and leaves the answer on screen
  {
    // ⚠️ The page closes the suggestion list 120ms after the search box loses
    // focus (ccr_atlas_v1.html, `gqEl.addEventListener("blur", ...)`) — that is
    // deliberate, so a click elsewhere dismisses it. Section 15 above clicks
    // rows and move controls, which blurs the box the test focused at §11 and
    // schedules that close. `tick()` is ONE macrotask, so on an idle machine the
    // whole block finishes inside the 120ms and nobody notices; on a loaded
    // runner the timer lands mid-block and the list is closed for a reason that
    // has nothing to do with Enter. Measured: 7 of 24 concurrent runs failed
    // here (113/116 and 114/116) before this wait, 0 of 24 after.
    await new Promise((r) => setTimeout(r, 200));
    const gq = q("#gq"), form = q("#msearch");
    gq.value = "weld";
    gq.dispatchEvent(new w.Event("input", { bubbles: true }));
    await tick();
    check("(15) the list is open before Enter", !q("#sug").hidden);
    form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
    await tick();
    check("(15) ⭐ Enter no longer hides the answer — the list stays up",
      !q("#sug").hidden, q("#sug").hidden ? "closed" : "open");
    check("(15) …with the first row highlighted, so the next Enter opens it",
      q("#gq").getAttribute("aria-activedescendant") === "sug-0",
      q("#gq").getAttribute("aria-activedescendant"));
  }

  done();
})().catch((e) => { console.error("HARNESS ERROR", e); check("the suite ran to the end", false, String(e && e.stack || e)); done(); });
