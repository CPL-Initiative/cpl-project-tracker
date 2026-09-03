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
function fakeCtx() {
  const noop = () => {};
  return { setTransform: noop, clearRect: noop, fillRect: noop, beginPath: noop, arc: noop, fill: noop,
           stroke: noop, moveTo: noop, lineTo: noop, save: noop, restore: noop, setLineDash: noop,
           strokeText: noop, fillText: noop, measureText: (t) => ({ width: String(t).length * 6 }),
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
  check("(A) the details panel is an inspector OVER the map, holding #u-detail",
    !!q("#u-inspector #u-detail") && !!q("#u-full #u-inspector"));
  check("(A) the write panel and the 'how to read it' pane sit BELOW the map",
    !!q("#u-below #u-writes") && /How the map is arranged/.test(text("#u-below")));
  check("(A) ⭐ the forest is embedded under the map — the same view, not a copy",
    qa("#u-more .cell").length === 2 && !q("#u-more #go-universe"),
    `${qa("#u-more .cell").length} cells`);
  check("(A) the map screen carries exactly ONE search field (the header's)",
    qa("input[type=search]").length === 1, `${qa("input[type=search]").length}`);
  check("(A) every control is a word, not a glyph",
    /Zoom out/.test(text("#u-out")) && /Zoom in/.test(text("#u-in")) && /Full screen/.test(text("#u-fs")) &&
    /Reset view/.test(text("#u-reset")) && /Browse subjects/.test(text("#u-list")));
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

  // ── (J) the labels: number → number · title → full line, by zoom band ──────
  const z = st().labelZooms;
  check("(J) the zoom bands are ordered (nodes < id < title < full)", st().nodeZoom < z.id && z.id < z.title && z.title < z.full);
  w.__ccrUniverseFly(-120, 0, 1.2);
  const l1 = { ...st().labelStats };
  w.__ccrUniverseFly(-120, 0, 2.0);
  const l2 = { ...st().labelStats };
  w.__ccrUniverseFly(-120, 0, 3.2);
  const l3 = { ...st().labelStats };
  check("(J) ⭐ just past the first band only numbers are drawn", l1.ids > 0 && l1.titles === 0 && l1.full === 0, JSON.stringify(l1));
  check("(J) ⭐ the second band adds the title", l2.titles > 0 && l2.full === 0, JSON.stringify(l2));
  check("(J) ⭐ the third band draws the full line with units and system", l3.full > 0, JSON.stringify(l3));
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
  q("#u-insp-toggle").click();
  check("(N) the details panel folds to a word", q("#u-inspector").classList.contains("closed") && /Show details/.test(text("#u-insp-toggle")) && !st().inspectorOpen);
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

  done();
})().catch((e) => { console.error("HARNESS ERROR", e); check("the suite ran to the end", false, String(e && e.stack || e)); done(); });
