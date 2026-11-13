// The title in use: exhibits.js and kb/title_in_use.py are ONE rule (Sam, in session, 2026-11-12: "being able to
// suggest the best canonical title based on what's in use"). The Review card names the title (relatedFor +
// relAligned, #3160); the pipeline makes it the proposal (kb/_build_exhibits_review.py). Both read
// tests/fixtures/title_in_use_cases.json: tests/title_in_use_test.py runs the Python side, this file the JS side.
// Guarded here:
//   - the JS constants (POPULAR_MIN, STATEWIDE_LEAD, the local issuer, REL_STOP) are the fixture's;
//   - every fixture case gets the fixture's answer from the card's own call, issuerFor included;
//   - a credit-by-exam case (own_issuer) asks the rule under the card's own issuer, as the card's line does (rule h);
//   - expect_order pins relatedFor's tie-break (local titles, then the lowercased title by code point);
//   - a card the pipeline flagged needs_official_name says so in words, and one without the flag says nothing;
//   - Accept all proposed titles never saves a flagged card, and its control and confirmation say so in words.
// Run from repo root: `npm test` (or `node tests/title_in_use_parity.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
const src = fs.readFileSync(process.env.EXHIBITS_JS || "exhibits.js", "utf8");   // a fail-first run points it elsewhere
const FX = JSON.parse(fs.readFileSync("tests/fixtures/title_in_use_cases.json", "utf8"));
const RELATED = Object.assign({ schema: 1, generated_at: "2026-11-12T07:55:00Z", rule: {}, paths: {}, families: {}, pending: {}, batches: [], waiting: [] }, FX.related);
const STATEWIDE = {};
FX.statewide.forEach(function (t) { STATEWIDE[t] = [{ t: "3 hours", id: "MAPICI-X-1-001" }]; });

function held(raw, title, issuer, extra) {
  return Object.assign({ raw: raw, step: "Proposed", title: title, issuer: issuer, ids: ["MAPICI-" + raw.length + "-1-001"], art: [0], could: [],
    under: [], under_count: 0, exists: false, from: "the classifier" }, extra || {});
}
function boot(card, opts) {
  opts = opts || {};
  const posts = [];
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/#exhibits", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    if ((init.method || "GET") === "POST") { if (/\/rest\/v1\/kb_curation$/.test(url)) posts.push(JSON.parse(init.body)); return Promise.resolve({ ok: true, status: 201, json: function () { return Promise.resolve(null); } }); }
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    if (url === "kb/exhibits_review.json") return ok({ schema: 1, written_at: "2026-11-12T07:50:00Z", sources: { procedures_run: "2026-11-12T07:47:00Z" },
      tiles: { names: { n: 1, of: 2, waiting: 1 }, aligned: { n: 0, of: 1 }, saved_not_folded: 0 }, steps: {}, colleges: ["American River College"], held: Array.isArray(card) ? card : [card] });
    if (url === "kb/exhibits_related.json") return ok(RELATED);
    if (url === "kb/cred_rename_dryrun/alias_map.json") return ok({ renames: {}, merges: {}, held_family: [], held_emptied: [], ruled: { applied: [], held: [], done: [] } });
    if (/\/rest\/v1\//.test(url)) return ok([]);
    return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } });
  };
  const sess = opts.signedIn ? { access_token: "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccc", email: "reviewer@example.org" } : null;
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(sess); }, authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; } };
  w.CPL_TABS = { loadScript: function (name, key, cb) { setTimeout(function () { if (name === "fact-sheet/statewide_recs.js") w.CPL_STATEWIDE_RECS = JSON.parse(JSON.stringify(STATEWIDE)); cb(); }, 0); } };
  w.cplCollegeShort = function (n) { return n; };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, posts: posts };
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
    // The card's own call (exhibits.js card(): drawAlign): the box's issuer follows the title, except on a
    // credit-by-exam card, which keeps its own (rule h).
    const iss = c.own_issuer ? c.issuer : (M._issuerFor(c.title, c.issuer).trim() || c.issuer);
    const got = M._relatedFor(c.title, c.raw, iss, []);
    const a = M._relInUse(c.title, c.raw, c.issuer, !!c.own_issuer);
    const have = a ? { kind: a.kind === "statewide" ? "in_use_statewide" : a.kind === "popular" ? "in_use_most_used" : a.kind, title: a.o.t } : null;
    check("parity: " + c.why, JSON.stringify(have) === JSON.stringify(c.expect), JSON.stringify(have));
    if (c.expect_order) {
      const order = got.rows.map(function (x) { return x.o.t; }).slice(0, c.expect_order.length);
      check("order: " + c.why, JSON.stringify(order) === JSON.stringify(c.expect_order), JSON.stringify(order));
    }
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
  check("…and a record the builder gave no name source draws no source line", !b.d.querySelector(".exh-name-source"));

  // The name source (d-official-name-source-confidence-s648): its level in words beside the proposal, never a glyph or a
  // color alone; a missing or unreadable source reads limited, never strong; a limited source never holds the card back.
  b = boot(held("Industry Training Evidence for CNT 7285", "CompTIA Cloud+", "CompTIA",
    { proposal_source: "official_name", name_source: { url: "https://www.comptia.org/en-us/certifications/cloud/", level: "strong" } }));
  await b.M.boot(); await settle();
  let ns = b.d.querySelector(".exh-name-source");
  check("a strong source says so in words and links the issuer's page",
    ns && /^Name source: strong, the issuer's own page names it\./.test(txt(ns))
    && ns.querySelector("a[href='https://www.comptia.org/en-us/certifications/cloud/'][target=_blank]"), txt(ns));
  check("the source line is plain words: no glyph, no color class", ns && !/[^\x20-\x7E’]/.test(txt(ns)) && !/green|red|alert/.test(ns.className), ns && ns.className);
  const tbox = b.d.querySelector("#exh-title");
  tbox.value = "Something else"; tbox.dispatchEvent(new b.w.Event("input"));
  check("the line belongs to the proposed title: it hides once the title is edited", ns.hidden === true);
  tbox.value = "CompTIA Cloud+"; tbox.dispatchEvent(new b.w.Event("input"));
  check("…and shows again when the box holds the proposed title", ns.hidden === false);
  // The review of #3241: a title set in code (an alternate's Use it) hides it too, though no input event fires.
  b = boot(held("Industry Training Evidence for CNT 7285", "CompTIA Cloud+", "CompTIA",
    { proposal_source: "official_name", alternates: ["Computer Networking Technology (CNT 7285)"],
      name_source: { url: "https://www.comptia.org/en-us/certifications/cloud/", level: "strong" }, series_aliases: ["CV0-004"] }));
  await b.M.boot(); await settle();
  ns = b.d.querySelector(".exh-name-source");
  const useAlt = Array.prototype.slice.call(b.d.querySelectorAll("button, a")).filter(function (x) {
    return txt(x) === "Use it" && /Also proposed: Computer Networking Technology/.test(txt(x.parentNode)); })[0];
  check("the card offers the alternate's Use it, and the source line shows before it", !!useAlt && ns && ns.hidden === false);
  if (useAlt) useAlt.click();
  check("an alternate's Use it hides the source line with the title it replaced",
    b.d.querySelector("#exh-title").value === "Computer Networking Technology (CNT 7285)" && ns.hidden === true, ns && ns.hidden);
  const ser = b.d.querySelector(".exh-series");
  check("an exam series the builder took out shows as one muted line in words",
    ser && txt(ser) === "Exam series: CV0-004, kept as a search alias" && /exh-muted/.test(ser.className), txt(ser));
  check("two series read as aliases, and none, or junk, draws no line",
    txt(M._seriesLine(held("r", "T", "I", { series_aliases: ["220-1101", "220-1102"] }))) === "Exam series: 220-1101, 220-1102, kept as search aliases"
    && M._seriesLine(held("r", "T", "I")) === null && M._seriesLine(held("r", "T", "I", { series_aliases: "CV0-004" })) === null);
  [[null, "a null source"], [{}, "an empty source"], [{ level: "certain", url: "https://x.example" }, "an unknown level"], ["strong", "a bare string"]]
    .forEach(function (p) {
      const line = M._nameSourceLine(held("r", "T", "I", { name_source: p[0] }));
      check(p[1] + " reads limited, with no link", line && /^Name source: limited, /.test(txt(line)) && !line.querySelector("a"), txt(line));
    });
  check("a partial source reads partial, with no link",
    /^Name source: partial, another exhibit in the reference carries it\.$/.test(txt(M._nameSourceLine(held("r", "T", "I", { name_source: { level: "partial", url: "" } })))));
  b = boot(held("Some Vendor Cert evidence", "Some Vendor Cert", "Some Vendor", { proposal_source: "official_name", name_source: { url: "", level: "limited" } }));
  await b.M.boot(); await settle();
  check("a limited source never holds the card back: it counts toward Accept all",
    b.d.querySelector(".exh-name-source") && /^Name source: limited, /.test(txt(b.d.querySelector(".exh-name-source")))
    && b.M._bulkItems([held("x", "Some Vendor Cert", "Some Vendor", { name_source: { url: "", level: "limited" } })]).length === 1);
  b = boot(held("Firefighter Recruit Academy Certificate", "Firefighter 1", "California State Fire Training (SFT)",
    { proposal_source: "in_use_statewide", from: "the statewide exhibit in use (11 local titles, at 19 colleges)", exists: true, alternates: ["Firefighter 1 Academy"] }));
  await b.M.boot(); await settle();
  const lab = b.d.querySelector("label[for=exh-title]");
  check("an in-use proposal's reason reads on the card from the record, no recompute",
    /^Canonical title, from the statewide exhibit in use \(11 local titles, at 19 colleges\)/.test(txt(lab)), txt(lab));
  const al = b.d.querySelector(".exh-align");
  check("and the card's own line agrees: the proposal is the statewide exhibit", al && /This is a statewide exhibit\./.test(txt(al)), txt(al));

  // A credit-by-exam card (a MAPCX id) on the card: the line asks the rule under the college's issuer, so an ASE-form
  // title names no ASE title there either (rule h, the review of #3168).
  b = boot(held("Noncredit Course for AUTO A5", "Brakes (ASE A5)", "California Community Colleges", { ids: ["MAPCXN-NFAB-1-001"] }));
  await b.M.boot(); await settle();
  const cbeAl = b.d.querySelector(".exh-align");
  check("a credit-by-exam card's line names no ASE title", !cbeAl || cbeAl.hidden, txt(cbeAl));
  b = boot(held("Industry Training Evidence for AUTO A5", "Brakes (ASE A5)", "National Institute for Automotive Service Excellence (ASE)", { ids: ["MAPICI-IFAB-1-001"] }));
  await b.M.boot(); await settle();
  check("an industry-certification card with the same title still names ASE A5's statewide title",
    /This looks like the statewide exhibit ASE A5 — Brakes/.test(txt(b.d.querySelector(".exh-align"))), txt(b.d.querySelector(".exh-align")));

  // Accept all proposed titles never saves a card whose official name is not on file (the review of #3168).
  const cards = [held("Card A raw", "Welding Fundamentals Certificate", "California Community Colleges"),
    held("Card B raw", "Guitar Ensemble", "California Community Colleges"),
    held("Card C raw", "UA Steamfitter Apprenticeship — Level 1", "United Association (UA)", { needs_official_name: true }),
    held("Card D raw", "Ironworker Apprenticeship — Level 2", "Ironworkers", { needs_official_name: true })];
  b = boot(cards, { signedIn: true });
  await b.M.boot(); await settle();

  check("bulkItems leaves out every card flagged needs_official_name",
    b.M._bulkItems(cards).map(function (it) { return it.raw; }).join("|") === "Card A raw|Card B raw", JSON.stringify(b.M._bulkItems(cards).map(function (it) { return it.raw; })));
  const bulk = b.d.querySelector(".exh-bulk");
  check("the control counts the two it will save and says the others stay, in words",
    bulk && /Accept all proposed titles \(2\)/.test(txt(bulk)) && /The 2 whose official name is not on file stay for a card\./.test(txt(bulk)), txt(bulk));
  const acc = bulk && Array.from(bulk.querySelectorAll("button")).find(function (x) { return /^Accept all proposed titles/.test(txt(x)); });
  if (acc) { acc.click(); await settle(); }
  const bulk2 = b.d.querySelector(".exh-bulk");
  check("its confirmation says the same in words", bulk2 && /The 2 whose official name is not on file stay for a card\./.test(txt(bulk2)), txt(bulk2));
  const save = bulk2 && Array.from(bulk2.querySelectorAll("button")).find(function (x) { return /^Save all/.test(txt(x)); });
  if (save) { save.click(); await settle(); }
  const saved = [].concat.apply([], b.posts).map(function (r) { return r.course_id; });
  check("Save all writes the two cards and neither flagged one", saved.length === 4 && saved.every(function (c) { return /Card [AB] raw$/.test(c); }), JSON.stringify(saved));


  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || r[2] == null ? "" : " — " + r[2])); });
  console.log(results.length - failed.length + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
