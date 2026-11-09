// A read that never answers fails with words instead of leaving "Loading" up for good (COBIx #2921, S604: an endless
// spinner on #cr-reference/open). The CR Reference's worklist read and the Commons list's figures read each carry a
// deadline; past it the request is aborted and the view falls to the failure state it already had.
// Run from repo root: `npm test` (or `node tests/read_timeouts.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async function () {
  // the CR Reference: a worklist fetch that never settles, a 50 ms deadline
  {
    const dom = new JSDOM('<!doctype html><html><body><div id="cr-reference-root"></div></body></html>',
      { url: "https://example.org/#cr-reference/open", runScripts: "dangerously" });
    const w = dom.window;
    let aborted = false;
    w.CPL_READ_TIMEOUT_MS = 50;
    w.fetch = function (url, opts) {
      if (opts && opts.signal) opts.signal.addEventListener("abort", function () { aborted = true; });
      return new Promise(function () {});
    };
    w.eval(fs.readFileSync("cr_reference.js", "utf8"));
    w.CPL_CR_REFERENCE.activate();
    const root = w.document.getElementById("cr-reference-root");
    const before = root.textContent;
    await wait(200);
    const after = root.textContent;
    check("CR Reference: while the read is out, it says it is loading", /Loading/.test(before));
    check("CR Reference: past the deadline the failure state replaces the loading line",
      /Could not load the reference/.test(after) && /did not answer within/.test(after) && !/Loading the Common CR Reference/.test(after));
    check("CR Reference: the hung request is aborted", aborted);
  }

  // the Commons list: the figures read rejects with words past its deadline
  {
    const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://example.org/", runScripts: "dangerously" });
    const w = dom.window;
    w.CPL_READ_TIMEOUT_MS = 50;
    w.fetch = function () { return new Promise(function () {}); };
    w.eval(fs.readFileSync("commons_list.js", "utf8"));
    let err = null;
    // the watchdog: a read with no deadline never settles, and that must fail the test rather than end it quietly
    await Promise.race([w.CPL_COMMONS_LIST.readCommons(true).catch(function (e) { err = e; }), wait(1000)]);
    check("Commons list: a figures read that never answers rejects with words", err && /did not answer within/.test(err.message));
    w.fetch = function () { return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ rows: [] }); } }); };
    let d = null;
    await Promise.race([w.CPL_COMMONS_LIST.readCommons().then(function (x) { d = x; }), wait(1000)]);
    check("Commons list: after a failed read the next one reads again, never the cached failure", d && Array.isArray(d.rows));
  }

  // COBIx on #2926: a signed-in decisions read that hangs, a JSON body that stalls, the failure as the List's line shows it
  {
    const W = { groups: [], _stats: {} };
    const ok = (o) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(o))) });
    function crr(fetcher, hash, opts) {
      const dom = new JSDOM('<!doctype html><html><body><div id="cr-reference-root"></div></body></html>',
        { url: "https://example.org/" + (hash || "#cr-reference"), runScripts: "dangerously" });
      const w = dom.window;
      w.CPL_READ_TIMEOUT_MS = 50;
      if (opts && opts.team) w.localStorage.setItem("cpl_team_pass", "a team phrase");
      w.fetch = fetcher;
      if (opts && opts.list) w.eval(fs.readFileSync("commons_list.js", "utf8"));
      w.eval(fs.readFileSync("cr_reference.js", "utf8"));
      return w;
    }
    // (a) signed in with the team phrase, the worklist answers and the decisions read never does
    const a = crr(function (url) { return /cr_reference_decisions/.test(String(url)) ? new Promise(function () {}) : ok(W); }, "#cr-reference", { team: true });
    a.CPL_CR_REFERENCE.activate();
    await wait(250);
    check("signed in: a decisions read that never answers marks the decisions stale, never an empty table",
      a.CPL_CR_REFERENCE._state.decisionsStale === true && a.CPL_CR_REFERENCE._state.loading === false);
    // (b) the worklist answers 200 and its body never arrives
    const b = crr(function () { return Promise.resolve({ ok: true, status: 200, json: () => new Promise(function () {}) }); });
    b.CPL_CR_REFERENCE.activate();
    await wait(250);
    check("a 200 whose JSON body stalls also falls to the failure state", /Could not load the reference/.test(b.document.getElementById("cr-reference-root").textContent)
      && /did not answer within/.test(b.document.getElementById("cr-reference-root").textContent));
    // (c) the List: the worklist answers, the Commons' figures never do, and the List's line says so in words
    const c = crr(function (url) { return /kb\/status\/commons\.json/.test(String(url)) ? new Promise(function () {}) : ok(W); }, "#cr-reference/list", { list: true });
    c.CPL_CR_REFERENCE.activate();
    await wait(400);
    const ct = c.document.getElementById("cr-reference-root").textContent;
    check("the List's line reads that the Commons' figures could not be read, with the deadline, never Reading forever",
      /The Commons' figures could not be read \(kb\/status\/commons\.json did not answer within/.test(ct) && !/Reading the Commons' figures/.test(ct));
    // (d) with no script loader the List says it could not be loaded, never Loading the List forever
    const d = crr(function () { return ok(W); }, "#cr-reference/list");
    d.CPL_CR_REFERENCE.activate();
    await wait(100);
    check("with no loader the List says it could not be loaded", /The List \(commons_list\.js\) could not be loaded/.test(d.document.getElementById("cr-reference-root").textContent));
  }

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "  ok  " : "  FAIL ") + r[0]));
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
})();
