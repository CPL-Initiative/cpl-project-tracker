// Another look (Sam, 2026-10-31): "build an audit process as part of the overall procedure to look for
// opportunities to take another look at exhibits that look the same but still have differences and things
// we can fold and correct". kb/_sweep_exhibit_titles.py writes kb/exhibits_sweep.json; the Exhibits tab's
// Review draws it as the Another look step. These checks pin:
//   - the pipeline: both workflows build and commit the file after the fold, CI runs the builder's test,
//     the sync carries the two new fields, the fold has its revise lane, Governance names the fields;
//   - the card: the current title, the editable proposal, why, the local titles that move, the rule chips;
//   - the writes: Change saves each local title's assignment, issuer and the title it replaces
//     (unified_title_supersedes); Keep saves title_sweep_kept; Back then Keep puts the assignment back;
//     Accept all saves every card in the rule on screen; signed out, nothing is written.
//
// Run from repo root: `npm test` (or `node tests/exhibits_sweep.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

// ── static: the pipeline around the file ──
const daily = fs.readFileSync(".github/workflows/daily-dashboard.yml", "utf8");
const proc = fs.readFileSync(".github/workflows/cer-procedures.yml", "utf8");
check("the daily run builds the sweep after the fold and commits it",
  /python3 kb\/_sweep_exhibit_titles\.py/.test(daily) && /git add kb\/exhibits_sweep\.json/.test(daily)
  && daily.indexOf("_fold_unclassified.py --apply-if-safe") < daily.indexOf("_sweep_exhibit_titles.py"));
check("the nightly procedures run rebuilds and commits it", /python3 kb\/_sweep_exhibit_titles\.py/.test(proc) && /kb\/exhibits_sweep\.json/.test(proc));
check("CI runs the sweep builder's test", /python3 tests\/exhibits_sweep_build_test\.py/.test(fs.readFileSync(".github/workflows/js-tests.yml", "utf8")));
const sync = fs.readFileSync("kb/_apply_unclassified_triage.py", "utf8");
check("the overlay sync carries the title replaced and the proposal kept",
  /"unified_title_supersedes"/.test(sync) && /"title_sweep_kept"/.test(sync) && /"sweep_kept": kept/.test(sync));
check("the fold re-points only while the replaced title stands (its revise lane)",
  /REVISE lane/.test(fs.readFileSync("kb/_fold_unclassified.py", "utf8")));
check("the governance map names both new fields", (function () {
  const g = JSON.parse(fs.readFileSync("kb/governance_surface_map.json", "utf8"));
  return g.mapped["field:kb_curation.unified_title_supersedes"] === "DR-07" && g.mapped["field:kb_curation.title_sweep_kept"] === "DR-07";
})());
const src = fs.readFileSync("exhibits.js", "utf8");
check("exhibits.js writes the two fields under the CER's own namespace",
  /"unified_title_supersedes"/.test(src) && /"title_sweep_kept"/.test(src) && /"_UNCLASSIFIED::"/.test(src));

// ── the renderer in jsdom ──
const REVIEW = { schema: 1, written_at: "2026-11-01T07:50:00Z", sources: { procedures_run: "2026-11-01T07:47:00Z" },
  tiles: { names: { n: 10, of: 12, waiting: 2 }, aligned: { n: 1, of: 2 }, saved_not_folded: 0 },
  steps: {}, colleges: ["Las Positas College", "El Camino College"],
  held: [{ raw: "Held one", step: "Proposed", title: "Held One", issuer: "", ids: ["X-1"], art: [0], could: [], under: [], under_count: 0, exists: false }] };
const SWEEP = { schema: 1, generated_at: "2026-11-01T07:52:00Z",
  rules: [{ id: "ase", label: "ASE", tip: "ASE tip" }, { id: "numerals", label: "Numerals", tip: "Numerals tip" },
    { id: "language", label: "Language level", tip: "Language tip" }],
  counts: { ase: 1, numerals: 1, language: 1 },
  cards: [
    { id: "c-ase", rules: ["ase"], current: "Engine Repair", proposed: "Automotive Technology (ASE A1 Engine Repair)",
      why: ["the course is A1, named for the ASE test"], issuer: "California Community Colleges",
      locals: [{ raw: "Noncredit for AUTO A1", colleges: ["Las Positas College"], course: "AUTO A1", credit: "4 units in AUTO A1 Engine Repair" }],
      proposed_exists: false, proposed_locals: 0, proposed_issuer: "", current_locals: 2, moves_all: false },
    { id: "c-num", rules: ["numerals"], current: "Elementary Spanish I", proposed: "Elementary Spanish 1",
      why: ["Roman numerals become Arabic"], issuer: "California Community Colleges",
      locals: [{ raw: "SPAN 001: Elementary Spanish I", colleges: [], course: "", credit: "" },
        { raw: "SPAN 1: Beginning Spanish", colleges: [], course: "", credit: "" }],
      proposed_exists: true, proposed_locals: 9, proposed_issuer: "California Community Colleges", current_locals: 2, moves_all: true },
    { id: "c-lang", rules: ["language"], current: "Chinese 1", proposed: "Elementary Chinese 1",
      why: ["“CHIN 1: Beginning Chinese” reads as elementary level 1"], issuer: "California Community Colleges",
      locals: [{ raw: "CHIN 1: Beginning Chinese", colleges: [], course: "", credit: "" }],
      proposed_exists: false, proposed_locals: 0, proposed_issuer: "", current_locals: 1, moves_all: true }
  ] };

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/" + (opts.hash || "#exhibits"), runScripts: "dangerously" });
  const w = dom.window;
  const calls = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null });
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    function bad(status) { return Promise.resolve({ ok: false, status: status, json: function () { return Promise.resolve({}); } }); }
    if (url === "kb/exhibits_review.json") return ok(REVIEW);
    if (url === "kb/exhibits_sweep.json") return opts.noSweep ? bad(404) : ok(SWEEP);
    if (/\/rest\/v1\/rpc\/exhibit_title_students$/.test(url)) return ok([]);
    if (/\/rest\/v1\/kb_curation/.test(url)) return Promise.resolve({ ok: true, status: 201, json: function () { return Promise.resolve(null); } });
    return bad(404);
  };
  const sess = opts.signedIn ? { access_token: "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccc", email: "reviewer@example.org" } : null;
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(sess); },
    authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; } };
  w.cplCollegeShort = function (n) { return n.replace(/ College$/, ""); };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, calls: calls };
}
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
async function settle() { for (let i = 0; i < 6; i++) await tick(); }
function byText(d, sel, t) { return Array.from(d.querySelectorAll(sel)).find(function (b) { return txt(b) === t; }); }
function stepTile(d, label) { return Array.from(d.querySelectorAll(".exh-step")).find(function (b) { return txt(b.querySelector(".exh-sl")) === label; }); }
function posts(t) { return t.calls.filter(function (c) { return c.method === "POST" && /kb_curation/.test(c.url); }); }
function rowsOf(t) { return posts(t).reduce(function (a, c) { return a.concat(c.body); }, []); }
function card(d) { return d.querySelector("section.exh-card"); }

(async function () {
  // ── signed in: the tile, the card, Change ──
  let t = load({ signedIn: true });
  await t.M.boot(); await settle();
  const tile = stepTile(t.d, "Another look");
  check("the Another look tile sits among the step tiles with the card count", tile && txt(tile.querySelector(".exh-sn")) === "3" && !tile.disabled);
  check("its hover says what it holds", /an ASE test to name/.test(tile.getAttribute("data-tip")));
  tile.click(); await settle();
  let c = card(t.d);
  check("the first card shows the current title and how many local titles it has",
    /Current title: Engine Repair · 2 local titles · California Community Colleges/.test(txt(c)));
  check("the proposal is the editable box", t.d.getElementById("exh-sw-title").value === "Automotive Technology (ASE A1 Engine Repair)");
  check("the rule chip names the rule with its hover", txt(c.querySelector(".exh-chip")) === "ASE" && c.querySelector(".exh-chip").getAttribute("data-tip") === "ASE tip");
  check("why is listed", /the course is A1, named for the ASE test/.test(txt(c)));
  check("the local title that moves is bold, with its college, course and credit line",
    txt(c.querySelector(".exh-locals b")) === "Noncredit for AUTO A1" && /Las Positas · AUTO A1 · 4 units in AUTO A1 Engine Repair/.test(txt(c.querySelector(".exh-locals"))));
  check("a card that moves only some local titles says the rest stay", /The other 1 under “Engine Repair” stay where they are\./.test(txt(c)));
  check("a new credential says so", /A new credential in the reference\./.test(txt(c)));
  check("the rule filter lists every rule with its count",
    ["Every rule (3)", "ASE (1)", "Numerals (1)", "Language level (1)"].every(function (w) { return !!byText(t.d, ".exh-views button", w); }));
  check("the controls are the review card's words",
    ["Change to Proposed Title", "Keep Current Title", "Skip"].every(function (w) { return !!byText(t.d, ".exh-acts button", w); }));

  // Sam, 2026-10-31: "anything with an ASE cert in the title should auto-populate the issuer and allow me to accept it."
  check("a title naming an ASE test fills the issuer box with ASE and says why",
    t.d.getElementById("exh-sw-issuer").value === "National Institute for Automotive Service Excellence (ASE)"
    && /Issuer filled from the ASE test in the title/.test(txt(c)));
  byText(t.d, ".exh-acts button", "Change to Proposed Title").click(); await settle();
  let rows = rowsOf(t);
  check("Change saves the local title's assignment, its issuer and the title it replaces, in one post",
    posts(t).length === 1 && rows.length === 3
    && rows.some(function (r) { return r.course_id === "_UNCLASSIFIED::Noncredit for AUTO A1" && r.field === "unified_title_assignment" && r.value === "Automotive Technology (ASE A1 Engine Repair)"; })
    && rows.some(function (r) { return r.field === "issuing_agency_assignment" && r.value === "National Institute for Automotive Service Excellence (ASE)"; })
    && rows.some(function (r) { return r.field === "unified_title_supersedes" && r.value === "Engine Repair"; })
    && rows.every(function (r) { return r.reviewer_email === "reviewer@example.org" && /^\d{4}-\d\d-\d\dT/.test(r.reviewed_at); }));
  check("the note says the fold moves it while the current title stands", /while “Engine Repair” still stands/.test(txt(t.d.querySelector(".exh-status"))));
  c = card(t.d);
  check("the next card is up, the decided one gone", /Current title: Elementary Spanish I/.test(txt(c)) && txt(stepTile(t.d, "Another look").querySelector(".exh-sn")) === "2");
  check("a proposal that joins a credential says so, with its local titles", /Joins the credential already in the reference under this title \(9 local titles\)\./.test(txt(c)));

  // An edited proposal is what saves, for every local title on the card.
  const box = t.d.getElementById("exh-sw-title");
  box.value = "Elementary Spanish 1 (edited)"; box.dispatchEvent(new t.w.Event("input"));
  byText(t.d, ".exh-acts button", "Change to Proposed Title").click(); await settle();
  rows = posts(t)[1].body;
  check("an edited proposal saves for each local title on the card",
    rows.filter(function (r) { return r.field === "unified_title_assignment" && r.value === "Elementary Spanish 1 (edited)"; }).length === 2
    && rows.filter(function (r) { return r.field === "unified_title_supersedes" && r.value === "Elementary Spanish I"; }).length === 2);

  // Back, then Keep: the proposal is kept against, and the assignment goes back to the current title.
  byText(t.d, ".exh-acts button", "Back").click(); await settle();
  check("Back reopens the card and names the save", /Back to “Elementary Spanish I”\. You saved “Elementary Spanish 1 \(edited\)”/.test(txt(t.d.querySelector(".exh-status"))));
  byText(t.d, ".exh-acts button", "Keep Current Title").click(); await settle();
  rows = posts(t)[2].body;
  check("Keep after a Change saves the proposal kept and puts each assignment back on the current title",
    rows.filter(function (r) { return r.field === "title_sweep_kept" && r.value === "Elementary Spanish 1"; }).length === 2
    && rows.filter(function (r) { return r.field === "unified_title_assignment" && r.value === "Elementary Spanish I"; }).length === 2
    && rows.filter(function (r) { return r.field === "unified_title_supersedes" && r.value === "Elementary Spanish I"; }).length === 2);

  // Keep on a card never changed writes only the proposal kept.
  byText(t.d, ".exh-acts button", "Keep Current Title").click(); await settle();
  rows = posts(t)[3].body;
  check("Keep on a fresh card writes only title_sweep_kept",
    rows.length === 1 && rows[0].field === "title_sweep_kept" && rows[0].course_id === "_UNCLASSIFIED::CHIN 1: Beginning Chinese" && rows[0].value === "Elementary Chinese 1");
  check("an empty rule says nothing waits", /Nothing waits for another look/.test(txt(t.d.getElementById("exhibits-root"))));

  // ── Accept all, in one rule ──
  t = load({ signedIn: true, hash: "#exhibits/another-look" });
  await t.M.boot(); await settle();
  check("#exhibits/another-look opens the step", !!card(t.d) && stepTile(t.d, "Another look").getAttribute("aria-pressed") === "true");
  byText(t.d, ".exh-bulk button", "Accept all proposed titles (3)").click(); await settle();
  check("Accept all asks first", /Save the proposed title for the 3 cards in every rule\?/.test(txt(t.d.querySelector(".exh-bulk"))) && posts(t).length === 0);
  byText(t.d, ".exh-bulk button", "Save all 3").click(); await settle();
  rows = rowsOf(t);
  check("Accept all saves every card's local titles with the title each replaces",
    rows.filter(function (r) { return r.field === "unified_title_assignment"; }).length === 4
    && rows.filter(function (r) { return r.field === "unified_title_supersedes"; }).length === 4
    && rows.some(function (r) { return r.course_id === "_UNCLASSIFIED::CHIN 1: Beginning Chinese" && r.value === "Elementary Chinese 1"; }));
  check("then nothing waits", txt(stepTile(t.d, "Another look").querySelector(".exh-sn")) === "0");

  // ── signed out: nothing is written ──
  t = load({ hash: "#exhibits/another-look" });
  await t.M.boot(); await settle();
  byText(t.d, ".exh-acts button", "Change to Proposed Title").click(); await settle();
  check("signed out, Change asks for a sign-in and writes nothing",
    posts(t).length === 0 && /Sign in as a reviewer to save\./.test(txt(t.d.querySelector(".exh-status"))));

  // ── no sweep file: the tile waits, Review is untouched ──
  t = load({ signedIn: true, noSweep: true });
  await t.M.boot(); await settle();
  const off = stepTile(t.d, "Another look");
  check("without the file the tile is disabled and Review still shows its card",
    off && off.disabled && txt(off.querySelector(".exh-sn")) === "–" && !!t.d.getElementById("exh-title"));

  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { if (!r[1]) console.log("FAIL " + r[0]); });
  console.log((results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
