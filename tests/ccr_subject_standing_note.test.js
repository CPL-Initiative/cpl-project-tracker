// The subject table's standing line — the note that fires when the SUBJECT MAP
// and the identities disagree about a discipline.
//
// ⚠️ WHY THIS EXISTS. DR-25 made the subject→discipline edge the authority and
// the vote a fallback, and Sam's item 3 of 2026-09-08 asked the row to "say on
// the row which of the two answered". The note was built — and then appended to
// ONE of standingHtml()'s four exits, the branch for a subject that IS its
// home's Common SUBJ. A subject whose identities sit under a DIFFERENT
// discipline is by construction usually NOT its home's Common SUBJ, so it left
// by the umbrella exit or the not-its-code exit, and both dropped the note; the
// two largest cases (ATHL, THTR) returned even earlier, at the no-seed-entry
// guard. Measured 2026-09-08 on prototype/ccr_universe.json against the map
// file the page itself fetches: NINE subjects disagree and ZERO of them printed
// anything. A note computed and discarded is the same as no note.
//
// Each check below names the exit it guards, because the defect was never in
// the note's WORDS — it was in which exits carried it.
//
// Run from repo root: `npm test` (or `node tests/ccr_subject_standing_note.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.resolve(__dirname, "..");
const results = [];
const check = (name, cond, detail) => results.push([name, !!cond, detail]);

const U = {
  _generated_from: "fixture",
  counts: { identities: 2, stand_alone: 0, points: 2, orbiting: 0, orbiting_cross: 0, rim: 0, disciplines: 2,
            member_rows: 0, member_rows_all_identities: 0, described_courses: 0 },
  why_bits: { subject: 1, subj4: 2, title: 4, top: 8, units: 16, credit: 32 },
  bounds: { x0: -300, x1: 300, y0: -200, y1: 200 },
  islands: [
    { d: "Welding", sh: "welding", x: -120, y: 0, r: 60, n: 1, sa: 0, al: 0, p: [
      { i: "WELD M1001", x: -120, y: 0, t: "Welding Fundamentals", n: 4, s: 0, f: 0, r: 0, u: 3 } ] },
    { d: "Art", sh: "art", x: 150, y: 0, r: 50, n: 1, sa: 0, al: 0, p: [
      { i: "ARTS M1001", x: 150, y: 0, t: "Drawing", n: 3, s: 0, f: 0, r: 0, u: 3 } ] },
  ],
};

// One discipline in the seed, carrying a Common SUBJ and an umbrella code, so
// all three post-seed exits are reachable. "Physical Education" is deliberately
// ABSENT — that is the ATHL/THTR shape, the exit that fires before the seed is
// ever consulted.
const SEED = { disciplines: {
  "Welding": { canonical_subj4: "WELD", canonical_source: "csr", authority_flag: null,
               authority_chips: [], umbrella_codes: ["WLDG"] },
} };

function fakeCtx() {
  const noop = () => {};
  return { setTransform: noop, clearRect: noop, fillRect: noop, beginPath: noop, arc: noop, fill: noop,
           closePath: noop, createRadialGradient: () => ({ addColorStop: noop }), rect: noop, clip: noop,
           stroke: noop, moveTo: noop, lineTo: noop, save: noop, restore: noop, setLineDash: noop,
           strokeText: noop, fillText: noop, measureText: (t) => ({ width: String(t).length * 6 }),
           fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "", textBaseline: "" };
}

const tpl = fs.readFileSync(path.join(ROOT, "prototype/ccr_atlas_v1.html"), "utf8");
const ujs = fs.readFileSync(path.join(ROOT, "prototype/ccr_universe.js"), "utf8");
const safe = (o) => JSON.stringify(o).replace(/<\//g, "<\\/");
const html = tpl.replace("__DATA__", "null").replace("__GRAPHJS__", "")
  .replace("__ESLDATA__", "null").replace("__ESLJS__", "")
  .replace("__UNIVDATA__", safe(U)).replace("__UNIVMEM__", "null").replace("__UNIVJS__", ujs);

const dom = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true,
  url: "https://example.org/prototype/skyview.html",
  beforeParse(window) {
    window.CPL_SKYVIEW_OPENS = "map";
    // The crumb bar belongs to the page shell (prototype/skyview.html), not to
    // ccr_universe.js; this suite mounts the module alone, so it gets a stub.
    // The real one overwrites it if the shell defines one.
    window.__crumbs = function () {};
    window.HTMLCanvasElement.prototype.getContext = function () { return fakeCtx(); };
    window.fetch = (url) => {
      if (/discipline_canonical_subj4\.json$/.test(url))
        return Promise.resolve({ ok: true, json: () => Promise.resolve(SEED) });
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    };
  },
});
const w = dom.window;

// A row as subjectRows() builds it. `homeSrc:"edge"` is the map answering;
// `voted` is what the identities say.
const row = (code, home, voted, homeSrc) =>
  ({ code, home, voted, homeSrc: homeSrc || "edge", others: [], n: 1, sa: 0, rec: { voted } });

(async () => {
  // The seed fetch is async and is kicked off by opening the map (line 2363's
  // `if(!authority) loadAuthority()`). The workspace route is NOT used here: it
  // needs the page shell's __crumbs, and this suite is about one function.
  w.__ccrUniverse({ solo: true });
  await new Promise((r) => setTimeout(r, 40));

  const S = w.__ccrStandingHtml;
  check("(0) standingHtml is exposed for testing", typeof S === "function");
  check("(0) the canonical seed loaded, so the branches below are real",
    typeof S === "function" && /Common SUBJ of Welding/.test(S(row("WELD", "Welding", "Welding"))),
    typeof S === "function" ? S(row("WELD", "Welding", "Welding")) : "no function");

  const says = (h) => /the subject map says/.test(h) && /its identities sit under/.test(h);

  // ── the four exits, each with the map and the vote disagreeing ──
  check("(A) exit 1 — no seed entry for the home discipline (the ATHL/THTR shape) SAYS SO",
    says(S(row("ATHL", "Physical Education", "Kinesiology"))),
    S(row("ATHL", "Physical Education", "Kinesiology")));
  check("(B) exit 2 — the subject IS its home's Common SUBJ, and says so (this one always worked)",
    says(S(row("WELD", "Welding", "Art"))), S(row("WELD", "Welding", "Art")));
  check("(C) exit 3 — an umbrella code under its home SAYS SO",
    says(S(row("WLDG", "Welding", "Art"))), S(row("WLDG", "Welding", "Art")));
  check("(D) exit 4 — not its home's code at all (the ETHN/MUSC shape) SAYS SO",
    says(S(row("ETHN", "Welding", "Art"))), S(row("ETHN", "Welding", "Art")));

  // ── and it stays quiet when there is nothing to report ──
  check("(E) a subject whose identities AGREE with the map says nothing extra",
    !says(S(row("WELD", "Welding", "Welding"))) && !says(S(row("WLDG", "Welding", "Welding"))) &&
    !says(S(row("ETHN", "Welding", "Welding"))),
    S(row("ETHN", "Welding", "Welding")));
  check("(F) a home that came from the VOTE says that instead, on every exit",
    [row("ETHN", "Art", "Art", "vote"), row("WLDG", "Welding", "Welding", "vote"),
     row("ATHL", "Physical Education", "Physical Education", "vote")]
      .every((r) => /inferred from its identities/.test(S(r))),
    S(row("ETHN", "Art", "Art", "vote")));
  check("(G) 'no discipline yet' is still its own line and takes no note",
    !says(S(row("ZZZZ", "no discipline yet", "Art"))), S(row("ZZZZ", "no discipline yet", "Art")));

  let pass = 0;
  for (const [name, ok, detail] of results) {
    console.log((ok ? "PASS " : "FAIL ") + name + (ok || detail === undefined ? "" : "\n      → " + detail));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
