// A decided Review card stays decided (#3223, Sam 2026-11-13: "I changed those las positas exhibits in the exhibit
// commons and think we have a loop going where the reanalysis does know I just relied on them and then brings them
// back endlessly"). kb/exhibits_review.json is built nightly; a title saved on Review since then is on kb_curation
// under _UNCLASSIFIED::<raw MAP title> as unified_title_assignment. On load the tab reads those saves, Range-paged,
// and a card whose raw title carries one leaves the queue; a clear (no row, or an empty value) leaves it open; a
// conflict card stays. When COBI cannot be read the cards stand and the view says so in words.
// Fixtures only: never the committed kb/exhibits_review.json.
// Run from repo root: `npm test` (or `node tests/exhibits_review_reconcile.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim().replace(/\s+/g, " "); }
const src = fs.readFileSync("exhibits.js", "utf8");

const ODD = 'Industry Training Evidence for KIN 6, "Personal" (Trainer) \\ 1';
function heldOf(raw, step) {
  return { raw: raw, step: step, why: "a reason", colleges: [], title: "T " + raw, issuer: "", from: "the classifier",
    ids: ["MAPCX-" + raw], art: [], could: [], basis: "", same: false, trainers: [], exists: false };
}
function reviewOf(held) {
  return { schema: 1, written_at: new Date().toISOString(), sources: {}, tiles: { names: { n: 0, of: 0, waiting: 0 }, aligned: { n: 0, of: 0 } },
    steps: {}, colleges: [], held: held };
}
const REVIEW = reviewOf([heldOf("Industry Training Evidence for EMS 10", "Proposed"), heldOf(ODD, "Proposed"),
  heldOf("Cleared Title", "Proposed"), heldOf("Open Title", "Wording check"), heldOf("Saved Conflict", "Conflict with the reference")]);

// The ids a kb_curation read asks for, decoded from PostgREST's quoted in-list.
function idsOf(url) {
  const m = /course_id=in\.\((.*?)\)(&|$)/.exec(url);
  if (!m) return [];
  const list = decodeURIComponent(m[1].split(",").join("\u0000")).split("\u0000").join(",");
  const out = [], re = /"((?:[^"\\]|\\.)*)"/g;
  let x;
  while ((x = re.exec(list))) out.push(x[1].replace(/\\(.)/g, "$1"));
  return out;
}

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/" + (opts.hash || "#exhibits"), runScripts: "dangerously" });
  const w = dom.window;
  const reads = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    const ok = (o) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(o))) });
    const no = (n) => Promise.resolve({ ok: false, status: n, json: () => Promise.resolve({}) });
    if (url === "kb/exhibits_review.json") return ok(opts.review || REVIEW);
    if (url === "kb/exhibits_sweep.json") return no(404);
    if (/\/rest\/v1\/rpc\/exhibit_title_students$/.test(url)) return ok([]);
    if (/\/rest\/v1\/kb_curation\?select=course_id,field,value&field=eq\.unified_title_assignment/.test(url) && (init.method || "GET") === "GET") {
      reads.push({ url: url, range: (init.headers || {}).Range });
      if (opts.fail) return no(503);
      if (opts.pages) return ok(opts.pages((init.headers || {}).Range));
      const saved = opts.saved || {};
      return ok(idsOf(url).filter((id) => id in saved).map((id) => ({ course_id: id, field: "unified_title_assignment", value: saved[id] })));
    }
    if (/\/rest\/v1\/kb_curation/.test(url) && (init.method || "GET") === "GET") return ok([]);
    return no(404);
  };
  const sess = { access_token: "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccc", email: "reviewer@example.org" };
  w.CPL_SESSION = { ensureFresh: () => Promise.resolve(sess), viewAddress: function () {},
    authHeaders: () => (opts.noKey ? {} : { apikey: "anon-key", Authorization: "Bearer anon-key" }) };
  w.cplCollegeShort = (n) => n;
  w.CPL_TABS = { loadScript: function (s, name, cb) { setTimeout(cb, 0); } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, reads: reads };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 12; i++) await tick(); }
const shownRaws = (t) => t.M._shown().map((h) => h.raw);
const P = "_UNCLASSIFIED::";

(async function () {
  // A reload after Sam saved two titles: both leave the queue, the rest stand.
  const saved = {};
  saved[P + "Industry Training Evidence for EMS 10"] = "Paramedic Theory 1";
  saved[P + ODD] = "Personal Trainer";
  saved[P + "Cleared Title"] = "";
  saved[P + "Saved Conflict"] = "Juvenile Law";
  let t = load({ saved: saved });
  await t.M.boot(); await settle();
  let raws = shownRaws(t);
  check("a title saved since the build does not come back on a reload", raws.indexOf("Industry Training Evidence for EMS 10") < 0);
  check("a title with a comma, quotes, parentheses and a backslash is matched by its exact raw title", raws.indexOf(ODD) < 0);
  check("a cleared assignment (an empty value) leaves the card open", raws.indexOf("Cleared Title") >= 0);
  check("a title with no save stays open", raws.indexOf("Open Title") >= 0);
  check("a conflict card stays though a title is saved for it (its saved title is the point)", (function () {
    t.M._state.filter = "Conflict with the reference"; const r = shownRaws(t); t.M._state.filter = ""; return r.indexOf("Saved Conflict") >= 0;
  })());
  check("no unread notice when COBI answered", !t.d.querySelector(".exh-unread"));
  check("the read asks for the assignment field alone, by the stable raw-title key", t.reads.length === 1
    && /field=eq\.unified_title_assignment/.test(t.reads[0].url) && /course_id=in\./.test(t.reads[0].url)
    && idsOf(t.reads[0].url).indexOf(P + "Saved Conflict") < 0 && idsOf(t.reads[0].url).length === 4);
  check("the read is Range-paged from the first row (Rule 10 b)", t.reads[0].range === "0-999");

  // A clear deletes the row: the same file, no save on COBI, every open card returns.
  t = load({ saved: {} });
  await t.M.boot(); await settle();
  check("with no save on COBI every card the file holds is open", shownRaws(t).length === 5);

  // A full page asks for the next.
  t = load({ pages: (range) => range === "0-999"
    ? Array.from({ length: 1000 }, (_, i) => ({ course_id: P + "Filler " + i, field: "unified_title_assignment", value: "x" }))
    : [{ course_id: P + "Open Title", field: "unified_title_assignment", value: "Saved On Page Two" }] });
  await t.M.boot(); await settle();
  check("a full page of 1,000 rows reads the next page", t.reads.map((r) => r.range).join("|") === "0-999|1000-1999");
  check("and a save on the second page still leaves the queue", shownRaws(t).indexOf("Open Title") < 0);

  // Many titles go in chunks, so no request outgrows a URL.
  const many = reviewOf(Array.from({ length: 95 }, (_, i) => heldOf("Many " + i, "Proposed")));
  t = load({ review: many, saved: { "_UNCLASSIFIED::Many 90": "Saved" } });
  await t.M.boot(); await settle();
  check("95 titles are read in three requests of at most 40", t.reads.length === 3
    && t.reads.every((r) => idsOf(r.url).length <= 40) && t.reads.reduce((n, r) => n + idsOf(r.url).length, 0) === 95);
  check("and a save in the last chunk is honored", shownRaws(t).indexOf("Many 90") < 0 && shownRaws(t).length === 94);

  // COBI cannot be read: the cards stand and the Review view says so in words.
  t = load({ fail: true });
  await t.M.boot(); await settle();
  const note = t.d.querySelector(".exh-unread");
  check("a failed read leaves the file's cards", shownRaws(t).length === 5);
  check("and the Review view says the saves could not be read and a decided card may show again",
    note && note.getAttribute("role") === "status"
    && /could not be read from COBI \(HTTP 503\), so a card decided since then may show again here/.test(txt(note)));
  check("the notice is words, with no glyph", note && !/[←-➿\u{1F300}-\u{1FAFF}]/u.test(txt(note)));

  // No key on the page: never silently current.
  t = load({ noKey: true });
  await t.M.boot(); await settle();
  check("with no COBI key the view says the saves could not be read", /could not be read from COBI \(COBI could not be reached from this page\)/.test(txt(t.d.querySelector(".exh-unread"))));

  // The Queue's Blocked on Sky line names it too.
  t = load({ fail: true, hash: "#exhibits/queue" });
  await t.M.boot(); await settle();
  check("the Queue names the unread saves in its blocked line", /titles saved since the review file was built could not be read from COBI \(HTTP 503\)/.test(txt(t.d.querySelector(".exh-qb"))));

  const failed = results.filter((x) => !x[1]);
  results.forEach((x) => console.log((x[1] ? "  ok  " : "  FAIL ") + x[0]));
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exit(1);
})();
