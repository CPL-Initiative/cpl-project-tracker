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
    p.push({ i: `${prefix} M${1000 + i}`, x: x + (i % 10) * 2, y: y + Math.floor(i / 10) * 2,
             t: `Welding Practice ${i}`, n: 3, s: 0, f: 0, r: 0, u: 3, c: credit });
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
  check("(1) the template asks __ccrSuggest for 60, not 8",
    /var SUG_LIMIT = 60;/.test(tpl) && /__ccrSuggest\(term, SUG_LIMIT\)/.test(tpl) && !/__ccrSuggest\(term, 8\)/.test(tpl));
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
    /Showing the closest 60/.test(q("#sug").getAttribute("aria-label") || "") &&
    /sorted by best match/.test(q("#sug").getAttribute("aria-label") || ""),
    q("#sug").getAttribute("aria-label"));
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
    q("#u-show-word").textContent === "0 of 12", q("#u-show-word").textContent);
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
     disc is the thing being studied, and a neighbour's name across it reads as
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

  done();
})().catch((e) => { console.error("HARNESS ERROR", e); check("the suite ran to the end", false, String(e && e.stack || e)); done(); });
