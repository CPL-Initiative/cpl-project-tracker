// The Commons' next batch in Exhibits (Sam's Commons rulings, 2026-11-08, #2921 item 2; COBIx on #2923): Start opens
// #exhibits/another-look/batch, at most six of Another look's open cards, fixed for the visit, one at a time with no
// bulk acceptance, then a stop. A card someone kept or changed since the nightly sweep was built leaves the batch.
// Run from repo root: `npm test` (or `node tests/exhibits_batch.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const src = fs.readFileSync("exhibits.js", "utf8");

const REVIEW = { schema: 1, written_at: "2026-11-01T07:50:00Z", sources: {}, tiles: { names: { n: 0, of: 0, waiting: 0 }, aligned: { n: 0, of: 0 }, saved_not_folded: 0 },
  steps: {}, colleges: [], held: [] };
function cardOf(i) {
  return { id: "c" + i, rules: ["fold"], current: "Title " + i, proposed: "Proposed " + i, why: ["why " + i], issuer: "",
    locals: [{ raw: "Local " + i, colleges: [], course: "", credit: "" }], proposed_exists: false, proposed_locals: 0,
    proposed_issuer: "", current_locals: 1, moves_all: true };
}
const SWEEP = { schema: 1, generated_at: "2026-11-07T15:00:00Z", rules: [{ id: "fold", label: "Fold", tip: "" }], counts: { fold: 9 },
  cards: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(cardOf) };

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/" + (opts.hash || "#exhibits/another-look/batch"), runScripts: "dangerously" });
  const w = dom.window;
  const calls = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null });
    const ok = (o) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(o))) });
    if (url === "kb/exhibits_review.json") return ok(REVIEW);
    if (url === "kb/exhibits_sweep.json") return ok(SWEEP);
    if (/\/rest\/v1\/rpc\/exhibit_title_students$/.test(url)) return ok([]);
    if (/\/rest\/v1\/kb_curation\?select=course_id,field,value,reviewed_at&field=in\.\(title_sweep_kept/.test(url)) return ok(opts.since || []);
    if (/\/rest\/v1\/kb_curation/.test(url)) return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(null) });
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  };
  const sess = { access_token: "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccc", email: "reviewer@example.org" };
  w.CPL_SESSION = { ensureFresh: () => Promise.resolve(sess), authHeaders: () => ({ apikey: "anon-key", Authorization: "Bearer anon-key" }),
    viewAddress: function (tab, fn) { w.__addr = fn; } };
  w.cplCollegeShort = (n) => n;
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, calls: calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 8; i++) await tick(); }
const byText = (d, sel, t) => Array.from(d.querySelectorAll(sel)).find((b) => txt(b) === t);

(async function () {
  // one card (c2) was kept after the sweep was built; one (c3) was folded onto another title, not off its own
  const t = load({ since: [
    { course_id: "_UNCLASSIFIED::Local 2", field: "title_sweep_kept", value: "Proposed 2", reviewed_at: "2026-11-08T10:00:00Z" },
    { course_id: "_UNCLASSIFIED::Local 3", field: "unified_title_supersedes", value: "Something else", reviewed_at: "2026-11-08T10:00:00Z" }] });
  await t.M.boot(); await settle();
  const rec = t.calls.find((c) => /title_sweep_kept,unified_title_supersedes/.test(c.url));
  check("the sweep reconciles with saves written since it was built", rec && /reviewed_at=gt\.2026-11-07T15%3A00%3A00Z/.test(rec.url));
  check("the batch opens on its trail back to the Commons", /CPL Commons \/ Another look \/ Your next batch/.test(txt(t.d.querySelector(".exh-trail")))
    && t.d.querySelector('.exh-trail a[href="#commons"]'));
  check("the batch is six cards, counted after the reconcile (c2 kept since, so c1, c3 to c7)", /Card 1 of 6 in this batch/.test(txt(t.d.querySelector(".exh-batch-pos")))
    && t.M._state.sw.batch.join(",") === "c1,c3,c4,c5,c6,c7");
  check("a fold onto another title does not decide the card", t.M._state.sw.batch.indexOf("c3") >= 0);
  check("the batch offers no bulk acceptance and no rule filter", !/Accept all proposed titles/.test(txt(t.d.getElementById("exhibits-root"))) && !t.d.querySelector('[aria-label="Another look by rule"]'));
  check("the view reports its address", t.w.__addr && t.w.__addr() === "exhibits/another-look/batch");
  for (let i = 0; i < 6; i++) { byText(t.d, ".exh-acts button", "Keep Current Title").click(); await settle(); }
  const done = t.d.querySelector(".exh-batch-done");
  check("after six decisions the batch stops, and says how many were decided", done && /This batch is done/.test(txt(done)) && /You decided 6 of 6\./.test(txt(done)));
  check("the stop leads back to the Commons and never to a seventh card", done.querySelector('a[href="#commons"]') && !t.d.querySelector("#exh-sw-title"));

  // the plain Another look view is unchanged: every open card, the rule filter, bulk acceptance
  const u = load({ hash: "#exhibits/another-look" });
  await u.M.boot(); await settle();
  check("plain Another look still shows every open card with the rule filter", !u.M._state.sw.batchMode && u.d.querySelector('[aria-label="Another look by rule"]')
    && /Accept all proposed titles \(9\)/.test(txt(u.d.getElementById("exhibits-root"))));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "  ok  " : "  FAIL ") + r[0]));
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exit(1);
})();
