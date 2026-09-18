// Sierra route time limit — every retrieval read has a limit of its own.
//
// WHY THIS TEST EXISTS
// --------------------
// The retrieval routes run together in one Promise.all and the answer waits for
// the slowest. Until 2026-09-18 the only limit was the database's 8 s
// statement_timeout, so one slow route (search_college_programs under two
// concurrent smoke suites — five cuts in the 24 hours to 2026-09-18) held the
// whole answer for eight seconds before failing safe. The fix is ONE fetch
// wrapper on the supabase-js clients: every GET and every rpc POST carries an
// AbortSignal; table writes keep the database's limit; the value comes from the
// CPL_ROUTE_TIMEOUT_MS secret with a 5,000 ms default and 0 to disable.
//
// The helpers are pure and lifted out of index.ts, so this test proves the real
// cut with a fetch that never answers — never a re-implementation.
//
// Run from repo root: `npm test` (or `node tests/sierra_route_time_limit.test.js`).
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}
const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

let R = null, liftErr = null;
try {
  R = liftBlock(SRC, "// Route time limit — pure helpers", "// End of the route time limit helpers",
    ["routeTimeoutMs", "routeLimitApplies", "routePath", "fetchWithRouteLimit"]);
} catch (e) { liftErr = e; }
check("(0) the route time limit helpers lift out of index.ts", !liftErr && R, liftErr && liftErr.message);

const RPC = "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/rpc/search_college_programs";
const TABLE = "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/chat_interactions";
const SELECT = "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/chatbox_college_courses?select=college";

block("1. the value", () => {
  check("(1) the default is 5,000 ms when the secret is unset or blank",
    R.routeTimeoutMs(undefined) === 5000 && R.routeTimeoutMs(null) === 5000 && R.routeTimeoutMs("") === 5000 && R.routeTimeoutMs("  ") === 5000);
  check("(1) the secret overrides it, whole milliseconds", R.routeTimeoutMs("2500") === 2500 && R.routeTimeoutMs("1500.7") === 1500);
  check("(1) zero disables; a negative or unreadable value falls back to the default",
    R.routeTimeoutMs("0") === 0 && R.routeTimeoutMs("-1") === 5000 && R.routeTimeoutMs("abc") === 5000);
  check("(1) ⭐ the constant reads the secret through the helper", /const ROUTE_TIMEOUT_MS = routeTimeoutMs\(Deno\.env\.get\("CPL_ROUTE_TIMEOUT_MS"\)\);/.test(SRC));
  check("(1) the file header says the secret needs no deploy", /CPL_ROUTE_TIMEOUT_MS/.test(SRC) && /THE ROUTE TIME LIMIT NEEDS NO DEPLOY/.test(SRC));
});

block("2. what the limit covers", () => {
  check("(2) every GET and HEAD", R.routeLimitApplies(SELECT, "GET") && R.routeLimitApplies(SELECT, "get") && R.routeLimitApplies(SELECT, "HEAD"));
  check("(2) ⭐ a PostgREST function call (POST to /rest/v1/rpc/)", R.routeLimitApplies(RPC, "POST"));
  check("(2) ⭐ never a table write — POST, PATCH, DELETE to a table keep the database's limit",
    !R.routeLimitApplies(TABLE, "POST") && !R.routeLimitApplies(TABLE, "PATCH") && !R.routeLimitApplies(TABLE, "DELETE"));
  check("(2) an unknown method is read as GET", R.routeLimitApplies(SELECT, "") && R.routeLimitApplies(SELECT, undefined));
  check("(2) routePath keeps the path and drops the host and query", R.routePath(SELECT) === "/rest/v1/chatbox_college_courses" && R.routePath("not a url") === "not a url");
});

// A fetch that never answers unless its signal fires — the slow route.
const hang = (input, init) => new Promise((resolve, reject) => {
  const s = init && init.signal;
  if (s) s.addEventListener("abort", () => reject(Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" })));
});
const captured = [];
const realError = console.error;
let block3Promise = Promise.resolve();
// Node does not keep the event loop alive for an AbortSignal.timeout timer, so
// without this handle the process exits before the 40 ms cut fires and prints
// nothing (exit 0, no report) — a test that cannot fail.
const keepAlive = setTimeout(() => {}, 10000);

block("3. the cut", () => {
  console.error = (...a) => captured.push(a.join(" "));
  const t0 = Date.now();
  let seen = null, calls = [];
  const spy = (input, init) => { calls.push({ input, init }); return hang(input, init); };
  const p = R.fetchWithRouteLimit(RPC, { method: "POST", body: "{}" }, 40, spy)
    .then(() => { seen = "resolved"; }, (e) => { seen = e; });
  // Synchronous facts first: the wrapper passed a signal and kept the body.
  check("(3) the wrapped request carries a signal and keeps the caller's init", calls.length === 1 && calls[0].init.signal && calls[0].init.body === "{}" && calls[0].init.method === "POST");
  // The asynchronous facts are collected below, after the timers run.
  block3Promise = p.then(() => {
    const ms = Date.now() - t0;
    check("(3) ⭐ a read that never answers is cut at the limit, not at the database's 8 s", seen && seen.name === "TimeoutError" && ms < 1000, "took " + ms + " ms, seen=" + (seen && seen.name));
    check("(3) ⭐ the cut is logged with the limit, the method, the path and the elapsed time",
      captured.some((l) => /^route time limit: 40 ms cut POST \/rest\/v1\/rpc\/search_college_programs after \d+ ms$/.test(l)), captured.join(" | "));
  });
});

block("4. what the limit leaves alone", () => {
  let initSeen = "unset";
  const echo = (input, init) => { initSeen = init; return Promise.resolve({ ok: true }); };
  const r1 = R.fetchWithRouteLimit(TABLE, { method: "POST", body: "{}" }, 40, echo);
  check("(4) ⭐ a table write is passed through untouched — no signal added", initSeen && !("signal" in initSeen) && r1 instanceof Promise);
  initSeen = "unset";
  R.fetchWithRouteLimit(RPC, { method: "POST" }, 0, echo);
  check("(4) a limit of 0 passes every request through untouched", initSeen && !("signal" in initSeen));
  initSeen = "unset";
  const outer = new AbortController();
  R.fetchWithRouteLimit(SELECT, { method: "GET", signal: outer.signal }, 40, echo);
  check("(4) a caller's own signal is merged, never dropped", initSeen && initSeen.signal && initSeen.signal !== outer.signal);
  check("(4) a Request object is read for its url and method", (() => {
    let s = null; const seeReq = (input, init) => { s = init; return Promise.resolve({ ok: true }); };
    R.fetchWithRouteLimit(new Request(SELECT, { method: "GET" }), undefined, 40, seeReq);
    return s && s.signal;
  })());
});

block("5. the wiring", () => {
  check("(5) ⭐ the service-role client is created with the limited fetch",
    /createClient\(SUPABASE_URL, SUPABASE_SERVICE_KEY, \{ global: \{ fetch: routeLimitedFetch \} \}\)/.test(SRC));
  check("(5) ⭐ the user-scoped (anon) client too, keeping its headers",
    /createClient\(SUPABASE_URL, anonKey, \{ global: \{ headers: extraHeaders, fetch: routeLimitedFetch \} \}\)/.test(SRC));
  check("(5) the limited fetch binds the constant and the real fetch", /const routeLimitedFetch = \(input: any, init\?: any\) => fetchWithRouteLimit\(input, init, ROUTE_TIMEOUT_MS, fetch\);/.test(SRC));
  check("(5) no bare createClient is left on either key", (SRC.match(/createClient\(SUPABASE_URL, (SUPABASE_SERVICE_KEY|anonKey)\)/g) || []).length === 0);
});

block3Promise.then(() => {
  clearTimeout(keepAlive);
  console.error = realError;
  let passed = 0;
  for (const [name, ok, why] of results) {
    if (ok) passed++;
    console.log(`  ${ok ? "ok  " : "FAIL"} ${name}${!ok && why ? " — " + why : ""}`);
  }
  console.log(`\nsierra_route_time_limit.test.js: ${passed}/${results.length} checks passed`);
  if (passed !== results.length) process.exit(1);
});
