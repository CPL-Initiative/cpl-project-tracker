// cobi_refresh.js + cpl_writer.js: the refresh click and the drafting call carry the
// reader's credential and no shared secret (COBIx round 1 items 1 and 2, 2026-11-05).
//
// Failure modes guarded:
//   1. the click sends a secret (the SEC-3 regression) or sends nothing identifying;
//   2. a reader with no credential fires a request that can only 403;
//   3. the phrase or the bearer is read once at load and goes stale (read at click time);
//   4. cpl_writer.draft() stops sending x-team-pass / Authorization, so every writer 401s.
// Run from repo root: `npm test` (or `node tests/cobi_refresh.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const REFRESH = fs.readFileSync("cobi_refresh.js", "utf8");
const WRITER = fs.readFileSync("cpl_writer.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }

function page() {
  const dom = new JSDOM("<!doctype html><html><body><button id=\"refreshBtn\">Manually Refresh COBI</button></body></html>",
    { url: "https://cpl-initiative.github.io/cpl-project-tracker/", runScripts: "dangerously" });
  const w = dom.window;
  w.eval(REFRESH);
  return w;
}
function fakeFetch(log, reply) {
  return function (url, init) {
    log.push({ url, init });
    return Promise.resolve({ status: 200, json: () => Promise.resolve(reply || { success: true }) });
  };
}

(async () => {
  // (1) no credential: a sentence, no request
  let w = page(); let log = [];
  let btn = w.document.getElementById("refreshBtn");
  let out = await w.COBI_REFRESH.trigger(btn, { confirm: () => true, fetch: fakeFetch(log), reload: () => {} });
  check("no credential → no request, button says so, re-enabled", out === "no-credential" && log.length === 0 && btn.textContent === w.COBI_REFRESH.NEED_CREDENTIAL && btn.disabled === false);

  // (2) declined confirm: nothing
  log = [];
  out = await w.COBI_REFRESH.trigger(btn, { confirm: () => false, fetch: fakeFetch(log) });
  check("declined confirm → nothing sent", out === "declined" && log.length === 0);

  // (3) team phrase from the shared localStorage key, no module present
  w = page(); log = []; btn = w.document.getElementById("refreshBtn");
  w.localStorage.setItem("cpl_team_pass", "phrase-1");
  out = await w.COBI_REFRESH.trigger(btn, { confirm: () => true, fetch: fakeFetch(log), reload: () => {} });
  check("phrase in localStorage → one POST to /trigger with x-team-pass", out === "ok" && log.length === 1 && /\/trigger$/.test(log[0].url) && log[0].init.headers["x-team-pass"] === "phrase-1");
  check("no secret anywhere in the request", !/secret/.test(log[0].url) && !/secret/.test(String(log[0].init.body)));
  check("button reports the run", /Pipeline running/.test(btn.textContent));

  // (4) the keeper modules win over the raw key, and are read at click time
  w = page(); log = []; btn = w.document.getElementById("refreshBtn");
  let token = "t1.t1.t1";
  w.CPL_SESSION = { get: () => ({ access_token: token }), ensureFresh: () => { token = "t2.t2.t2"; return Promise.resolve({ access_token: token }); } };
  w.CPL_TEAM_PHRASE = { get: () => "phrase-2" };
  out = await w.COBI_REFRESH.trigger(btn, { confirm: () => true, fetch: fakeFetch(log), reload: () => {} });
  check("reviewer session → Authorization bearer, renewed by ensureFresh before the send", log[0].init.headers.Authorization === "Bearer t2.t2.t2");
  check("phrase module → x-team-pass beside the bearer", log[0].init.headers["x-team-pass"] === "phrase-2");

  // (5) the worker's refusal is shown as its sentence
  w = page(); log = []; btn = w.document.getElementById("refreshBtn");
  w.localStorage.setItem("cpl_team_pass", "stale");
  out = await w.COBI_REFRESH.trigger(btn, { confirm: () => true, fetch: function (u, i) { log.push({ u, i }); return Promise.resolve({ status: 403, json: () => Promise.resolve({ error: "Sign in or enter the team phrase" }) }); } });
  check("a 403 shows the worker's sentence and re-enables the button", out === "error" && /Sign in or enter the team phrase/.test(btn.textContent) && btn.disabled === false);

  // (6) cpl_writer.draft() carries the same credential
  w = page(); log = [];
  w.CPL_REPORT_PROXY_URL = "https://cpl-proxy.slee-548.workers.dev";
  w.fetch = function (url, init) { log.push({ url, init }); return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ content: [{ type: "text", text: "drafted" }], model: "m" }) }); };
  w.eval(WRITER);
  w.CPL_TEAM_PHRASE = { get: () => "phrase-3" };
  let d = await w.CPL_WRITER.draft("hello");
  check("writer: the phrase module's phrase rides as x-team-pass", d.text === "drafted" && log[0].init.headers["x-team-pass"] === "phrase-3");
  check("writer: no Authorization when there is no session", !log[0].init.headers.Authorization);
  log = [];
  await w.CPL_WRITER.draft("portal", { headers: { "x-team-pass": "portal-phrase" } });
  check("writer: opts.headers (the KB portal's own phrase) wins, so a page without the keepers still drafts", log[0].init.headers["x-team-pass"] === "portal-phrase");
  check("writer: touches no storage itself (the keeper modules and opts.headers are its only sources)", !/localStorage|sessionStorage/.test(WRITER));
  w.CPL_SESSION = { get: () => ({ access_token: "r.r.r" }) };
  log = [];
  await w.CPL_WRITER.draft("again");
  check("writer: reviewer session → Authorization bearer, read at call time", log[0].init.headers.Authorization === "Bearer r.r.r");
  check("writer: credentialHeaders is exposed for consumers that fetch the proxy themselves", typeof w.CPL_WRITER.credentialHeaders === "function" && w.CPL_WRITER.credentialHeaders({}).Authorization === "Bearer r.r.r");
  // (7) the worker's 401 sentence surfaces as the writer's rejection
  w.fetch = function () { return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({ error: { type: "authentication_error", message: "Sign in or enter the team phrase: the proxy answers only a reviewer session or the team phrase." } }) }); };
  let msg = "";
  try { await w.CPL_WRITER.draft("x"); } catch (e) { msg = e.message; }
  check("writer: the worker's 401 sentence is what the tab shows", /Sign in or enter the team phrase/.test(msg));

  let failed = 0;
  for (const [name, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + name); if (!ok) failed++; }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
