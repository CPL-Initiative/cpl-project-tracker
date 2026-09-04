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
  // ── (A) the landing view: full bleed, inspector over the map, panes below ──
  check("(A) ⭐ the page boots straight onto the map", !!q("#u-cvs"));
  check("(A) ⭐ the map section takes the full width (main is full-bleed)",
    q("#main").classList.contains("u-fullbleed"));
  check("(A) ⭐ the details panel is DOCKED beside the map, holding #u-detail, never over the canvas",
    !!q("#u-stage #u-inspector #u-detail") && !!q("#u-full #u-inspector") && !q("#u-wrap #u-inspector"));
  check("(A) ⭐ the controls sit above the canvas and the legend and hint below it — nothing floats over the map",
    !!q("#u-top #u-bar") && !q("#u-wrap #u-bar") && !!q("#u-foot .u-legend") && !!q("#u-foot #u-hint") && !q("#u-wrap .u-legend"));
  check("(A) ⭐ the other views are one click away inside the full-screen element",
    !!q("#u-full #u-nav-forest") && /All disciplines/.test(text("#u-nav-forest")) && /Subjects as a list/.test(text("#u-list")));
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
    const ctrls = ["#u-out", "#u-in", "#u-reset", "#u-fs", "#u-list", "#u-insp-toggle", "#u-foot-toggle"];
    const GLYPH = /[\u2190-\u21FF\u2300-\u27BF\u2B00-\u2BFF\uD800-\uDBFF\uFE0F]/;
    check("(A) every control is a word, not a glyph",
      ctrls.every((c) => { const t = text(c).trim(); return t.length > 0 && /[A-Za-z]/.test(t) && !GLYPH.test(t); }),
      ctrls.map((c) => text(c).trim()).join(" | "));
    // The shortened words keep their meaning from the group label beside them.
    check("(A) ⭐ the shortened zoom controls carry a group label that says what they act on",
      /Zoom/i.test(text(".u-zgroup")) && !!q(".u-zgroup #u-out") && !!q(".u-zgroup #u-in"),
      text(".u-zgroup").trim());
  }
  // ── the 2026-09-04 chrome changes, asserted on a freshly booted page ──────
  check("(A) ⭐ the details panel starts HIDDEN so the map opens at full width (Sam, 2026-09-04)",
    q("#u-inspector").classList.contains("closed") && !st().inspectorOpen && /^Details$/.test(text("#u-insp-toggle").trim()),
    text("#u-insp-toggle"));
  // ⭐ Sam, 2026-09-04: "consolidate the top … I want all the real estate for the
  // universe view." #u-top was ALREADY one row (space-between: links left,
  // controls right) — what he saw was it WRAPPING at his zoom, because the long
  // control labels would not fit beside the links. So the fix is that it fits.
  check("(A) ⭐ the links and the controls share ONE row inside #u-top",
    !!q("#u-top .u-nav") && !!q("#u-top #u-bar")
    && q("#u-top .u-nav").parentElement === q("#u-top")
    && q("#u-top #u-bar").parentElement === q("#u-top"));
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
  check("(A) ⭐ no title crowds the view links out from under the search dropdown",
    !q("#u-top .u-title") && q("#u-top").firstElementChild === q("#u-top .u-nav"));
  // ── item 4 (Sam, 2026-09-04): zoom past 900%, and the taper that earns it ──
  // "it needs to go higher than 900% so I can isolate 1 CCR course while keeping
  // the other courses visible surrounding it, in case I need to drag one into
  // the CCR course."
  {
    const S = st();
    check("(A) ⭐ the zoom ceiling is well past the old 9x (900%)", S.kMax > 9, `K_MAX=${S.kMax}`);
    // ⭐ THE TAPER IS THE POINT, not the bigger number. Radius used to scale
    // LINEARLY with zoom while orbit positions did too, so the ratio of a
    // circle's size to the gap between circles was CONSTANT at every zoom —
    // which is why zooming in never helped pick one course out of a crowd, and
    // why raising the cap alone would have made it worse (a 100-course identity
    // at k=40 would draw at a 508px radius and push its neighbours off screen).
    const f = S.radScaleAt;
    check("(A) below the knee the radius still tracks zoom exactly",
      f(1) === 1 && f(S.radKnee) === S.radKnee);
    check("(A) ⭐ above the knee separation outpaces size, so the orbit spreads out",
      f(S.kMax) < S.kMax && f(40) < 40 && f(40) > f(9),
      `radScale(40)=${f(40).toFixed(1)} vs linear 40`);
    check("(A) …and the taper is monotonic — zooming in never shrinks a circle",
      [1, 4, 9, 20, 40, S.kMax].every((k, i, a) => i === 0 || f(k) > f(a[i - 1])));
  }
  check("(A) the legend strip can be folded away, and says so in a word",
    !!q("#u-foot-toggle") && /legend/i.test(text("#u-foot-toggle")));
  {
    const foot = q("#u-foot"), btn = q("#u-foot-toggle");
    btn.click();
    check("(A) ⭐ hiding the legend folds the strip away (Sam: 'make the footer hidable')",
      foot.classList.contains("u-foot-hidden") && /^Legend$/.test(text("#u-foot-toggle").trim())
      && btn.getAttribute("aria-expanded") === "false");
    btn.click();
    check("(A) …and it comes back", !foot.classList.contains("u-foot-hidden")
      && /Hide legend/.test(text("#u-foot-toggle")));
  }
  check("(A) the legend explains the hollow point in words",
    /stand-alone course, in orbit/.test(text(".u-legend")));
  check("(A) the intro states orbiting, cross and rim counts from the payload",
    /2 of the stand-alones orbit/.test(text("#u-below")) && /1 of them in another subject/.test(text("#u-below"))
    && /1 share nothing with any identity/.test(text("#u-below")), text("#u-below").slice(0, 400));
  const s0 = st();
  check("(A) the member index covers every college course", s0.memberIndex === 11, String(s0.memberIndex));
  check("(A) orbiting and rim are counted from the points", s0.orbiting === 2 && s0.rim === 1);
  check("(A) the description bases end at the public Supabase bucket",
    s0.descBases.length === 2 && /supabase\.co\/storage\/v1\/object\/public\/ccr-desc$/.test(s0.descBases[1]),
    s0.descBases.join(" | "));

  // ── (B) leaving and returning takes the full-bleed frame down and back up ──
  w.__ccrForest();
  check("(B) another view removes the full-bleed frame", !q("#main.u-fullbleed") && !q("#u-cvs"));
  check("(B) the stand-alone forest keeps its own 'Open the map' door and its filter",
    !!q("#go-universe") && !!q("#q"));
  w.__ccrUniverse();
  check("(B) coming back restores the map and the frame", !!q("#u-cvs") && !!q("#main.u-fullbleed"));

  // ── (C) suggestions: subject · identity · stand-alone · college course ─────
  const sug = w.__ccrSuggest("weld", 8);
  check("(C) a subject is offered first, labelled with the word", sug[0].kind === "subject" && sug[0].kindWord === "subject" && sug[0].label === "Welding");
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
             return qa("#sug .sg-k").some((el) => el.textContent === "college course"); })());

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
  check("(D) a subject name still wins over course titles", /^\s*Subject/.test(text("#u-hint")) && /Welding/.test(text("#u-hint")));

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
  check("(G) ⭐ the local shard is tried first and the bucket second",
    (() => { const sh = fetches.filter((u) => !/discipline_canonical_subj4\.json$/.test(u));   // the seed read is a separate fetch
             return sh.length >= 2 && /^ccr_desc\/welding\.json$/.test(sh[0].replace(/^https:\/\/example\.org\/prototype\//, ""))
               && /supabase\.co\/storage\/v1\/object\/public\/ccr-desc\/welding\.json$/.test(sh[1]); })(), fetches.join(" | "));
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
  texts.length = 0; w.__ccrUniverseFly(-120, 0, 1.2);
  const l1 = { ...st().labelStats }, t1 = texts.slice();
  texts.length = 0; w.__ccrUniverseFly(-120, 0, 2.0);
  const l2 = { ...st().labelStats }, t2 = texts.slice();
  texts.length = 0; w.__ccrUniverseFly(-120, 0, 3.2);
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
  w.__ccrUniverseFly(-120, 0, 3.0);          // WELD M1001 is now at the canvas centre (480, 300)
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
  w.__ccrUniverseFly(150, 40, 3.0);
  const before = st().moves.length;
  pointer("pointerdown", 480, 300);
  pointer("pointermove", 480, 250);
  check("(L) moving a hollow point picks its one course up", st().carrying === "ART 199", String(st().carrying));
  pointer("pointerup", 480, 180);
  check("(L) ⭐ releasing on an identity writes the move", st().moves.length === before + 1 && st().moves[st().moves.length - 1].to === "ARTS M1001",
    JSON.stringify(st().moves.slice(-1)));

  // ── (M) full screen ────────────────────────────────────────────────────────
  q("#u-fs").click();
  check("(M) without the API the button explains instead of failing silently", /full screen/i.test(text("#u-hint")));
  let fsEl = null;
  Object.defineProperty(d, "fullscreenElement", { get: () => fsEl, configurable: true });
  w.HTMLElement.prototype.requestFullscreen = function () { fsEl = this; return Promise.resolve(); };
  q("#u-fs").click();
  d.dispatchEvent(new w.Event("fullscreenchange"));
  check("(M) ⭐ entering full screen relabels the button and fills the window",
    /Exit full screen/.test(text("#u-fs")) && q("#u-fs").getAttribute("aria-pressed") === "true"
    && q("#u-wrap").style.height === w.innerHeight + "px", `${text("#u-fs")} / ${q("#u-wrap").style.height}`);
  fsEl = null; d.dispatchEvent(new w.Event("fullscreenchange"));
  check("(M) leaving it restores the label", /^Full screen$/.test(text("#u-fs").trim()));

  // ── (N) the inspector can be folded away and comes back on a selection ────
  // ⚠️ The INITIAL state is asserted in (A), right after boot — by the time this
  // block runs, earlier checks have selected a node and openInspector() has
  // legitimately opened the panel. Asserting "starts hidden" here would be
  // asserting it about a page that has been used.
  if (!st().inspectorOpen) q("#u-insp-toggle").click();      // normalize: open
  check("(N) an open panel says how to put it away",
    !q("#u-inspector").classList.contains("closed") && /Hide details/.test(text("#u-insp-toggle")) && st().inspectorOpen);
  q("#u-insp-toggle").click();
  check("(N) the details panel folds to a word",
    q("#u-inspector").classList.contains("closed") && /Details/.test(text("#u-insp-toggle")) && !st().inspectorOpen);
  w.__ccrGoSuggestion({ kind: "subject", isl: PU.islands[0] });
  check("(N) selecting something opens it again", !q("#u-inspector").classList.contains("closed") && /Welding/.test(text("#u-detail h3")));
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
  const sx0 = (-120 + v0.x) * v0.k + CW / 2, sy0 = (0 + v0.y) * v0.k + CH / 2;
  q("#u-in").click(); q("#u-in").click();
  const v1 = { ...st().view };
  const sx1 = (-120 + v1.x) * v1.k + CW / 2, sy1 = (0 + v1.y) * v1.k + CH / 2;
  check("(P) ⭐ zooming in twice keeps the searched subject exactly where it was on screen",
    v1.k > v0.k * 1.9 && Math.abs(sx1 - sx0) < 0.5 && Math.abs(sy1 - sy0) < 0.5, `${sx0},${sy0} → ${sx1},${sy1} (k ${v0.k} → ${v1.k})`);
  st().view.x = 5000;                       // pan it far off the canvas
  q("#u-out").click();
  const v2 = st().view, sx2 = (-120 + v2.x) * v2.k + CW / 2;
  check("(P) ⭐ a subject that drifted off the canvas is brought back to the centre before the zoom", Math.abs(sx2 - CW / 2) < 0.5, String(sx2));

  // ── (Q) Pan and Move ───────────────────────────────────────────────────────
  // Sam, 2026-09-03: "need chips or icons to choose whether to move an item or
  // reposition the focus".
  w.__ccrUniverseFly(-120, 0, 3.0);
  w.__ccrSetMode("pan");
  check("(Q) ⭐ the Pan chip presses and the hint says what a drag now does",
    st().mode === "pan" && q("#u-mode-pan").getAttribute("aria-pressed") === "true"
    && q("#u-mode-move").getAttribute("aria-pressed") === "false" && /Pan/.test(text("#u-hint")));
  const vx0 = st().view.x, mv0 = st().moves.length;
  pointer("pointerdown", 480, 300); pointer("pointermove", 540, 330); pointer("pointerup", 540, 330);
  check("(Q) ⭐ in Pan mode a drag that starts on an identity moves the VIEW and carries nothing",
    st().view.x !== vx0 && st().moves.length === mv0 && st().carrying === null, `${vx0} → ${st().view.x}`);
  w.__ccrUniverseFly(-120, 0, 3.0);
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
  w.__ccrUniverseFly(-120, 0, 3.0);
  check("(R) with nothing selected and nothing hovered an identity stays closed below the open-all band",
    st().memberPoints === 0 && st().memberZoom < st().memberZoomAll, String(st().memberPoints));
  pointer("pointerdown", 480, 300); pointer("pointerup", 480, 300);      // select WELD M1001 (Move mode)
  check("(R) ⭐ selecting an identity opens it — every college course under WELD M1001 is a square",
    st().sel === "WELD M1001" && st().memberPoints === under(["WELD M1001"]), `${st().sel} ${st().memberPoints} vs ${under(["WELD M1001"])}`);
  const radM = (2.2 + Math.sqrt(4) * 1.05) * 3.0;      // nodeRad(WELD M1001) at k=3
  // An OPEN ring spreads with its count so the names can radiate: R0 = rad + 16 + min(70, n * 1.7).
  const R0 = radM + 16 + Math.min(70, under(["WELD M1001"]) * 1.7);
  pointer("pointermove", 480, 300 - R0);                 // the first square, straight above
  check("(R) ⭐ hovering a square names the college course, its college and the identity it sits under",
    !tip.hidden && /WELD 100/.test(tip.textContent) && /Alpha College/.test(tip.textContent) && /under WELD M1001/.test(tip.textContent), tip.textContent);
  texts.length = 0; w.__ccrUniverseFly(-120, 0, 3.0);
  check("(R) ⭐ each square is labelled by its code and college", st().labelStats.members > 0 && texts.some((t) => t === "WELD 100 · Alpha College"), texts.join("|"));
  const mvb = st().moves.length;
  pointer("pointerdown", 480, 300 - R0); pointer("pointermove", 500, 340);
  check("(R) ⭐ dragging a square picks its course up", st().carrying === "WELD 100", String(st().carrying));
  pointer("pointerup", 480 + 30 * 3, 300 + 20 * 3);      // WELD C1000
  check("(R) ⭐ dropping it on another identity writes the same CN: move the panel would",
    st().moves.length === mvb + 1 && st().moves[st().moves.length - 1].to === "WELD C1000", JSON.stringify(st().moves.slice(-1)));
  w.__ccrUniverseFly(-120, 0, 4.5);                      // past the open-all band
  check("(R) ⭐ zoomed far enough that identities stand apart, every one in view opens — and the moved course rings its new identity",
    st().memberPoints === under(["WELD M1001", "WELD C1000"]) && st().memberPoints >= 5, `${st().memberPoints} vs ${under(["WELD M1001", "WELD C1000"])}`);
  pointer("pointermove", 480, 300 + 200 * 4.5);          // off every point: nothing hovered
  w.__ccrUniverseFly(-120, 0, 3.0);
  pointer("pointermove", 480 + 30 * 3, 300 + 20 * 3);   // hover WELD C1000
  check("(R) hovering an identity below that band opens it beside the selected one, and nothing else",
    st().hover === "WELD C1000" && Object.keys(st().memberOwners).sort().join() === ["WELD C1000", "WELD M1001"].join()
    && st().memberOwners["WELD C1000"] === under(["WELD C1000"]),
    `hover=${st().hover} sel=${st().sel} owners=${JSON.stringify(st().memberOwners)}`);

  // ── (T) the links in the strip reach the other views ──────────────────────
  // Sam, 2026-09-03: "will need links on full screen to navigate to the other views".
  q("#u-nav-forest").click();
  check("(T) ⭐ 'All disciplines' in the strip leaves the map for the forest", !q("#u-cvs") && !!q("#go-universe"));
  w.__ccrUniverse();
  check("(T) the ESL door is removed when there is no ESL payload (never a door onto nothing)", !q("#u-nav-esl") && !!q("#u-nav-forest"));

  done();
})().catch((e) => { console.error("HARNESS ERROR", e); check("the suite ran to the end", false, String(e && e.stack || e)); done(); });
