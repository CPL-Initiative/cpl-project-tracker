// The Exhibits Queue (Sam's Commons ruling 1, 2026-11-08, #2921; COBIx's filter contract of 16:49Z): six lenses in
// the ruled order, each a set of entry points into a list the tab already holds, counted from the set that list opens.
// Needs Sam's Start opens the same capped batch as the Commons' Start; a failed read or the classifier's errors show
// as Blocked on Sky, never as an empty lens; a count whose data is unread shows no number, never a 0. Review stays
// the tab's first view.
// Run from repo root: `npm test` (or `node tests/exhibits_queue.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim().replace(/\s+/g, " "); }
const src = fs.readFileSync("exhibits.js", "utf8");

function heldOf(raw, step) {
  return { raw: raw, step: step, why: "a reason", colleges: [], title: "T " + raw, issuer: "", from: "the classifier",
    ids: ["MAPCX-" + raw], art: [], could: [], basis: "", same: false, trainers: [], exists: false };
}
const REVIEW = { schema: 1, written_at: new Date().toISOString(), sources: {}, tiles: { names: { n: 0, of: 0, waiting: 0 }, aligned: { n: 0, of: 0 }, saved_not_folded: 4 },
  steps: {}, colleges: [],
  held: [heldOf("a", "Proposed"), heldOf("b", "Proposed"), heldOf("c", "Wording check"), heldOf("d", "Two issuers"),
    heldOf("e", "Conflict with the reference"), heldOf("f", "Conflict with the reference"), heldOf("g", "Conflict with the reference")] };
function cardOf(i) {
  return { id: "c" + i, rules: ["fold"], current: "Title " + i, proposed: "Proposed " + i, why: ["why " + i], issuer: "",
    locals: [{ raw: "Local " + i, colleges: [], course: "", credit: "" }], proposed_exists: false, proposed_locals: 0,
    proposed_issuer: "", current_locals: 1, moves_all: true };
}
const SWEEP = { schema: 1, generated_at: "2026-11-07T15:00:00Z", rules: [{ id: "fold", label: "Fold", tip: "" }], counts: { fold: 9 },
  cards: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(cardOf) };
const CREDREF = { _generated_at: "2026-11-01T05:19:00+00:00", unified_titles: [
  { ut: "Welding Level 1", issuer: "AWS", cpl_types: [], disc_modal: "Welding", conf_title: 0.9, raw_count: 3,
    articulations: [{ cid: "WELD M1001", sys: "M-ID", local: [{ colleges: ["Norco College"] }] }] },
  { ut: "Apiary Basics", issuer: "", cpl_types: [], disc_modal: "", raw_count: 1, articulations: [] },
  { ut: "Beekeeping II", issuer: "", cpl_types: [], disc_modal: "", raw_count: 1, articulations: [] }
] };

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/" + (opts.hash || "#exhibits/queue"), runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    const ok = (o) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(o))) });
    const no = (n) => Promise.resolve({ ok: false, status: n, json: () => Promise.resolve({}) });
    if (url === "kb/exhibits_review.json") return opts.reviewFails ? no(503) : ok(opts.review || REVIEW);
    if (url === "kb/exhibits_sweep.json") return ok(SWEEP);
    if (url === "kb/cer_procedures_out/latest.json") return ok(opts.report || { classifier_run: { answered: 12, errors: [] } });
    if (/\/rest\/v1\/rpc\/exhibit_title_students$/.test(url)) return ok([]);
    if (/\/rest\/v1\/kb_curation/.test(url) && (init.method || "GET") === "GET") return ok([]);
    return no(404);
  };
  const sess = { access_token: "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccc", email: "reviewer@example.org" };
  w.CPL_SESSION = { ensureFresh: () => Promise.resolve(sess), authHeaders: () => ({ apikey: "anon-key", Authorization: "Bearer anon-key" }),
    viewAddress: function (tab, fn) { w.__addr = fn; } };
  w.cplCollegeShort = (n) => n;
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = fs.readFileSync("commons_list.js", "utf8"); w.document.body.appendChild(e); }
    if (s === "credential_reference_data.js") w[name] = JSON.parse(JSON.stringify(CREDREF));
    setTimeout(cb, 0); } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 12; i++) await tick(); }
const root = (t) => t.d.getElementById("exhibits-root");
const lensNav = (t) => t.d.querySelector('nav[aria-label="Queue"]');
const clickWord = (t, scope, words) => { const b = Array.from(scope.querySelectorAll("button")).find((x) => txt(x) === words); if (b) b.click(); return !!b; };
const entry = (t, re) => Array.from(t.d.querySelectorAll(".exh-qs .exh-qe")).find((li) => re.test(txt(li)));

(async function () {
  const t = load();
  await t.M.boot(); await settle();
  check("the address opens the Queue view", t.M._state.view === "queue");
  const words = Array.from(lensNav(t).children).map(txt);
  check("six lenses in the ruled order", words.join("|") === "Needs Sam|Ready to check|All|Connections|Later|History");
  check("the open lens is marked and is not a control", lensNav(t).querySelector('[aria-current="true"]') && txt(lensNav(t).querySelector('[aria-current="true"]')) === "Needs Sam");
  check("the view reports its address with its lens", t.w.__addr && t.w.__addr() === "exhibits/queue/needs-sam");
  check("Queue leads the views and Review is still there", (function () {
    const v = Array.from(t.d.querySelectorAll('nav[aria-label="Views"] > *')).map(txt);
    return /^Queue/.test(v[0]) && v.some((x) => /^Review/.test(x));
  })());

  // Needs Sam: the batch is the capped six, the conflicts are the Review step's own count
  const batch = entry(t, /Another look cards in your next batch/);
  check("Needs Sam counts the batch the Start word opens: six of nine open cards", batch && /^6 /.test(txt(batch)));
  check("Needs Sam counts conflicts from the Review step", /^3 saved titles that disagree/.test(txt(entry(t, /disagree with one a person approved/))));
  check("Two issuers is a judgment for Sam", /^1 titles with two issuers/.test(txt(entry(t, /two issuers/))));
  check("no Blocked on Sky line while every read answered", !t.d.querySelector(".exh-qb"));
  clickWord(t, batch, "Start"); await settle();
  check("Start opens the capped batch, the Commons' own", t.M._state.view === "review" && t.M._state.sw.batchMode
    && /Card 1 of 6 in this batch/.test(txt(t.d.querySelector(".exh-batch-pos"))));
  check("and its address is the Commons' Start address", t.w.__addr() === "exhibits/another-look/batch");

  // Ready to check: Review's Proposed and Wording check, and the process waits held apart
  const r = load({ hash: "#exhibits/queue/ready" });
  await r.M.boot(); await settle();
  check("a lens opens from its address", txt(lensNav(r).querySelector('[aria-current="true"]')) === "Ready to check");
  check("Ready counts Proposed from the Review step", /^2 titles the nightly run proposed/.test(txt(entry(r, /proposed a name/))));
  check("saved-not-folded waits on a process and has no check control",
    (function () { const li = entry(r, /saved and not yet folded/); return li && /^4 /.test(txt(li)) && !li.querySelector("button"); })());
  const proposed = entry(r, /proposed a name/);
  clickWord(r, proposed, "Check them"); await settle();
  check("Check them opens Review on Proposed", r.M._state.view === "review" && r.M._state.filter === "Proposed");

  // Connections: the List's own filter count; an unread filter shows no number
  const c = load({ hash: "#exhibits/queue/connections" });
  await c.M.boot(); await settle();
  const bare = entry(c, /no articulation yet/);
  check("Connections counts No articulation from the List's own filter", bare && /^2 credentials with no articulation/.test(txt(bare)));
  const out = entry(c, /outcomes match/);
  check("an unread filter shows no count, never a 0", out && !/^\d/.test(txt(out)) && /counted once the List reads its file/.test(txt(out)));
  clickWord(c, bare, "Open them"); await settle();
  check("Open them opens the List on that filter", c.M._state.view === "list" && c.w.__addr() === "exhibits/list/bare");

  // Later says Park is not yet lasting
  const l = load({ hash: "#exhibits/queue/later" });
  await l.M.boot(); await settle();
  check("Later says Skip lasts the visit only", /Park is not yet a lasting status/.test(txt(root(l))));

  // Blocked on Sky: the classifier's errors and a failed review read, in their own line
  const b = load({ report: { classifier_run: { answered: 0, errors: ["HTTP 413: rules are 251866 characters; the limit is 250000"] } }, reviewFails: true });
  await b.M.boot(); await settle();
  const bl = b.d.querySelector(".exh-qb");
  check("a classifier error shows as Blocked on Sky", bl && bl.getAttribute("role") === "status" && /classifier answered 0 and reported: HTTP 413/.test(txt(bl)));
  check("a failed review read shows there too", bl && /review file could not be read/.test(txt(bl)));
  check("a failed read leaves its counts blank, not 0", (function () { const li = entry(b, /disagree with one a person approved/); return li && !/^\d/.test(txt(li)) && !li.querySelector("button"); })());

  // a stale review file is named
  const old = Object.assign({}, REVIEW, { written_at: "2026-01-01T00:00:00Z" });
  const s = load({ review: old });
  await s.M.boot(); await settle();
  check("a review file more than two days old reads stale", /more than two days ago/.test(txt(s.d.querySelector(".exh-qb"))));

  // the tab still opens on Review with no address
  const plain = load({ hash: "#exhibits" });
  await plain.M.boot(); await settle();
  check("with no address the tab opens on Review", plain.M._state.view === "review");

  const failed = results.filter((x) => !x[1]);
  results.forEach((x) => console.log((x[1] ? "  ok  " : "  FAIL ") + x[0]));
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exit(1);
})();
