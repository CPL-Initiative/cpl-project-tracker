// The title in use: exhibits.js and kb/title_in_use.py are ONE rule (Sam, in session, 2026-11-12: "being able to
// suggest the best canonical title based on what's in use"). The Review card names the title (relatedFor +
// relAligned, #3160); the pipeline makes it the proposal (kb/_build_exhibits_review.py). Both read
// tests/fixtures/title_in_use_cases.json: tests/title_in_use_test.py runs the Python side, this file the JS side.
// Guarded here:
//   - the JS constants (POPULAR_MIN, STATEWIDE_LEAD, the local issuer, REL_STOP) are the fixture's;
//   - every fixture case gets the fixture's answer from the card's own call, issuerFor included;
//   - a card the pipeline flagged needs_official_name says so in words, and one without the flag says nothing.
// Run from repo root: `npm test` (or `node tests/title_in_use_parity.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
const src = fs.readFileSync("exhibits.js", "utf8");
const FX = JSON.parse(fs.readFileSync("tests/fixtures/title_in_use_cases.json", "utf8"));
const RELATED = Object.assign({ schema: 1, generated_at: "2026-11-12T07:55:00Z", rule: {}, paths: {}, families: {}, pending: {}, batches: [], waiting: [] }, FX.related);
const STATEWIDE = {};
FX.statewide.forEach(function (t) { STATEWIDE[t] = [{ t: "3 hours", id: "MAPICI-X-1-001" }]; });

function held(raw, title, issuer, extra) {
  return Object.assign({ raw: raw, step: "Proposed", title: title, issuer: issuer, ids: ["MAPICI-" + raw.length + "-1-001"], art: [0], could: [],
    under: [], under_count: 0, exists: false, from: "the classifier" }, extra || {});
}
function boot(card) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/#exhibits", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function (url) {
    url = String(url);
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    if (url === "kb/exhibits_review.json") return ok({ schema: 1, written_at: "2026-11-12T07:50:00Z", sources: { procedures_run: "2026-11-12T07:47:00Z" },
      tiles: { names: { n: 1, of: 2, waiting: 1 }, aligned: { n: 0, of: 1 }, saved_not_folded: 0 }, steps: {}, colleges: ["American River College"], held: [card] });
    if (url === "kb/exhibits_related.json") return ok(RELATED);
    if (url === "kb/cred_rename_dryrun/alias_map.json") return ok({ renames: {}, merges: {}, held_family: [], held_emptied: [], ruled: { applied: [], held: [], done: [] } });
    if (/\/rest\/v1\//.test(url)) return ok([]);
    return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } });
  };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(null); }, authHeaders: function () { return { apikey: "anon-key" }; } };
  w.CPL_TABS = { loadScript: function (name, key, cb) { setTimeout(function () { if (name === "fact-sheet/statewide_recs.js") w.CPL_STATEWIDE_RECS = JSON.parse(JSON.stringify(STATEWIDE)); cb(); }, 0); } };
  w.cplCollegeShort = function (n) { return n; };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS };
}
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
async function settle() { for (let i = 0; i < 10; i++) await tick(); }

(async function () {
  const t = boot(held("Some held title", "Some Title", "California Community Colleges"));
  await t.M.loadRelated();
  t.w.CPL_STATEWIDE_RECS = JSON.parse(JSON.stringify(STATEWIDE));
  const M = t.M, C = FX.constants;
  check("POPULAR_MIN is the fixture's", M._POPULAR_MIN === C.popular_min, M._POPULAR_MIN);
  check("STATEWIDE_LEAD is the fixture's", M._STATEWIDE_LEAD === C.statewide_lead, M._STATEWIDE_LEAD);
  check("the local issuer is the fixture's", M._LOCAL_ISSUER === C.local_issuer, M._LOCAL_ISSUER);
  check("REL_STOP is the fixture's stop words", JSON.stringify(Object.keys(M._REL_STOP || {}).sort()) === JSON.stringify(C.stop_words.slice().sort()),
    Object.keys(M._REL_STOP || {}).sort().join(","));
  FX.cases.forEach(function (c) {
    // The card's own call (exhibits.js card(): drawAlign): the box's issuer follows the title.
    const iss = M._issuerFor(c.title, c.issuer).trim() || c.issuer;
    const a = M._relAligned(M._relatedFor(c.title, c.raw, iss, []), c.title, iss);
    const have = a ? { kind: a.kind === "statewide" ? "in_use_statewide" : a.kind === "popular" ? "in_use_most_used" : a.kind, title: a.o.t } : null;
    check("parity: " + c.why, JSON.stringify(have) === JSON.stringify(c.expect), JSON.stringify(have));
  });

  // The flag the pipeline sets for a certification with no official name on file is said in words on the card.
  let b = boot(held("UA Steamfitter Apprenticeship Level 1 evidence", "UA Steamfitter Apprenticeship — Level 1", "United Association (UA)", { needs_official_name: true }));
  await b.M.boot(); await settle();
  const line = b.d.querySelector(".exh-needs-name");
  check("a card flagged needs_official_name says so in words", line && /official name for this credential is not on file/.test(txt(line)), txt(line));
  b = boot(held("Welding Fundamentals Cert", "Welding Fundamentals", "California Community Colleges"));
  await b.M.boot(); await settle();
  check("that card drew (the check above reads a real card)", !!b.d.querySelector("#exh-title"));
  check("a card without the flag says nothing about it", !b.d.querySelector(".exh-needs-name"));
  b = boot(held("Firefighter Recruit Academy Certificate", "Firefighter 1", "California State Fire Training (SFT)",
    { proposal_source: "in_use_statewide", from: "the statewide exhibit in use (11 local titles, at 19 colleges)", exists: true, alternates: ["Firefighter 1 Academy"] }));
  await b.M.boot(); await settle();
  const lab = b.d.querySelector("label[for=exh-title]");
  check("an in-use proposal's reason reads on the card from the record, no recompute",
    /^Canonical title, from the statewide exhibit in use \(11 local titles, at 19 colleges\)/.test(txt(lab)), txt(lab));
  const al = b.d.querySelector(".exh-align");
  check("and the card's own line agrees: the proposal is the statewide exhibit", al && /This is a statewide exhibit\./.test(txt(al)), txt(al));

  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || r[2] == null ? "" : " — " + r[2])); });
  console.log(results.length - failed.length + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
