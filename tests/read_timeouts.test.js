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

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "  ok  " : "  FAIL ") + r[0]));
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
})();
