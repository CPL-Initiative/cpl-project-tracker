// A Common Exhibit Reference tab (credential_reference.js) in jsdom, the way the dashboard loads it: combine_guard.js
// first, then the tab. Shared by the tests that press its merge writers (tests/cer_combine_guard.test.js and the
// two-step case in tests/exhibits_list_left.test.js). Not itself a test: run.js reads only *.test.js.
//
//   boot({ payload, overlay, types, signedIn }) -> { window, doc, writes, confirms }
//     payload  the CPL_CREDENTIAL_REFERENCE data (unified_titles)
//     overlay  the kb_curation rows the tab reads on load
//     types    the CPL types file's body, or 404
//   writes holds every POST and DELETE body the tab sent, in order.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const guardEnv = require("./combine_guard_env.js");

const SRC = fs.readFileSync(path.join(__dirname, "..", "..", "credential_reference.js"), "utf8");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function boot(opts) {
  opts = opts || {};
  const html = `<!DOCTYPE html><html><body>
  <div id="tab-credential-reference">
    <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
  </div></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const window = dom.window;
  window.CPL_CREDENTIAL_REFERENCE = JSON.parse(JSON.stringify(opts.payload));
  const log = { writes: [], confirms: [] };
  window.confirm = function (m) { log.confirms.push(m); return opts.confirmAnswer !== false; };
  window.fetch = function (url, o) {
    url = String(url); const method = (o && o.method) || "GET";
    const respond = (body, status) => Promise.resolve({ ok: !status || status < 400, status: status || 200, json: () => Promise.resolve(body) });
    if (url.indexOf("exhibit_audit/latest.json") >= 0) return respond({ title_cards: [] });
    if (url.indexOf("issuer_preseed.json") >= 0) return respond({ staged: {} });
    if (url.indexOf("unclassified_preseed.json") >= 0) return respond({ staged: {} });
    if (url.indexOf("unclassified_suggestions.json") >= 0) return respond({ suggestions: {} });
    if (method === "POST" || method === "DELETE") {
      log.writes.push({ url, method, body: o.body && JSON.parse(o.body) });
      return respond([], method === "POST" ? 201 : 204);
    }
    if (url.indexOf("/rest/v1/kb_curation") >= 0) return respond(opts.overlay || []);
    return respond([], 404);
  };
  if (opts.signedIn !== false) {
    const jwt = "eyJhbGciOiJIUzI1NiJ9." + Buffer.from(JSON.stringify({ email: "map@rccd.edu" })).toString("base64") + ".x";
    window.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: jwt, refresh_token: "rt", email: "map@rccd.edu", exp: Date.now() + 3600000 }));
  }
  guardEnv.install(window, opts.types === undefined ? 404 : opts.types);
  window.eval(SRC);
  await sleep(150);
  return { window, doc: window.document, writes: log.writes, confirms: log.confirms };
}

module.exports = { boot, sleep };
