// The extraction function's caller check: 503 when the lookup gives no answer, 401 for a real refusal (S647).
//
// Sam, Open Asks Sheet 190 card 6 (2026-11-13 13:21Z, "deploy"), on COBIx's finding on #3202 (comment 6850015321):
// "Returning 503 on an upstream error (and keeping 401 for a real auth refusal) would make the next outage obvious."
// From about 09:29Z to 11:15Z that day the database refused connections; program-requirements-extract answered 401 to
// all 135 of Glendale's paid calls (run 43384599013), which filed 121 error stubs over good records and read as an
// expired key for an hour.
//
// Guards the failure modes:
//   A. A lookup that gives no answer answers 503 and names the cause: a probe that times out (a real timeout, the
//      fetch honoring the signal), PostgREST answering 5xx, the database unreachable (fetch throws), a reply that is
//      not the row list, any other non-2xx.
//   B. A real refusal still answers 401: the gateway's 401 or 403, an empty row list (RLS hides every row from a key
//      that is not the service key), no bearer, a bearer that cannot be a header value (refused before any lookup,
//      so a malformed key never reads as an outage).
//   C. Only one answer lets the caller through: a 2xx list holding a row. No refusal and no outage is ok.
//   D. The function uses the shared check before it reads the body, returns its status and body when it is not ok,
//      keeps no copy of the old probe, and the deploy list still names it.
//
// The handler itself is TypeScript, which Node 20 (CI) cannot load, so D reads its source; the check is plain
// JavaScript in ../_shared/service_caller.mjs, which A to C run.
//
// Run: node tests/service_caller_check.test.js
const fs = require("fs");
const path = require("path");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const SHARED_PATH = "chatbox/supabase/functions/_shared/service_caller.mjs";
const SHARED = fs.readFileSync(SHARED_PATH, "utf8");
// The module's code without its comment lines, which name what the code does and does not do.
const SHARED_CODE = SHARED.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");
const FN = fs.readFileSync("chatbox/supabase/functions/program-requirements-extract/index.ts", "utf8");
const URL_BASE = "https://db.example";

function answer(status, body) {
  return Promise.resolve(new Response(typeof body === "string" ? body : JSON.stringify(body), { status: status }));
}
// A fetch that records each call and answers with `fn`.
function fake(fn) {
  const calls = [];
  const f = function (url, init) { calls.push({ url: url, init: init }); return fn(url, init); };
  f.calls = calls;
  return f;
}

(async function () {
  const S = await import(path.resolve(SHARED_PATH));
  const run = (f, bearer, ms) => S.checkServiceCaller(URL_BASE, bearer === undefined ? "sb_secret_abc" : bearer, f, ms);

  // ── A. No answer: 503, the cause named ──
  {
    // A real timeout: the fake never answers and rejects only when the probe's own signal fires. Node unrefs
    // AbortSignal.timeout's timer, so a held timer keeps the test alive until the signal fires (without it the
    // process would exit 0 here, silently, with no check run).
    const hang = fake(function (_u, init) {
      return new Promise(function (_res, rej) {
        const hold = setTimeout(function () { rej(new Error("the probe's signal never fired")); }, 3000);
        init.signal.addEventListener("abort", function () { clearTimeout(hold); rej(init.signal.reason); });
      });
    });
    const t0 = Date.now();
    const got = await run(hang, undefined, 50);
    check("A ⭐ a lookup that times out answers 503, upstream_timeout, and does not wait past its limit",
      got.ok === false && got.status === 503 && got.body.reason === "upstream_timeout" && Date.now() - t0 < 2000,
      JSON.stringify(got));
    check("A the 503 body names the cause and says no call was made",
      /could not reach the database/.test(got.body.error) && /no call was made/.test(got.body.error) && got.body.ok === false);

    for (const st of [500, 502, 503, 504, 520, 544]) {
      const r = await run(fake(() => answer(st, { code: "PGRST001", message: "Could not connect" })));
      check("A ⭐ PostgREST answering " + st + " answers 503 (upstream_http_" + st + ")",
        r.ok === false && r.status === 503 && r.body.reason === "upstream_http_" + st, JSON.stringify(r));
    }
    // The thrown text names the probe's URL (host and table), and this answer goes to a caller not yet checked: the
    // log keeps it, the body does not (S648 review).
    const _err = console.error;
    const logged = [];
    console.error = function () { logged.push(Array.from(arguments).join(" ")); };
    let down;
    try {
      down = await run(fake(() => Promise.reject(new TypeError(
        "error sending request for url (https://db.example/rest/v1/allowed_reviewers?select=email&limit=1): connect ECONNREFUSED"))));
    } finally { console.error = _err; }
    check("A the database unreachable (fetch throws) answers 503, upstream_unreachable",
      down.status === 503 && down.body.reason === "upstream_unreachable", JSON.stringify(down));
    check("A ⭐ the unreachable answer echoes no exception text (no URL, host or table) to the caller; the log keeps it",
      !/allowed_reviewers|db\.example|ECONNREFUSED|rest\/v1/.test(JSON.stringify(down.body))
      && logged.some((l) => /ECONNREFUSED/.test(l)), JSON.stringify(down.body) + " | " + logged.join(" / "));
    const html = await run(fake(() => answer(200, "<html>gateway</html>")));
    check("A a 200 that is not JSON answers 503, upstream_malformed", html.status === 503 && html.body.reason === "upstream_malformed");
    // A 200 whose body the probe's timeout cuts off: the body read rejects with TimeoutError. A slow database is a
    // timeout, so the cause the runner prints names it (it read upstream_malformed before S648).
    const cut = await run(fake(() => Promise.resolve({
      status: 200,
      json: function () { const e = new Error("The operation timed out."); e.name = "TimeoutError"; return Promise.reject(e); },
    })));
    check("A a reply cut off by the probe's timeout answers 503, upstream_timeout",
      cut.ok === false && cut.status === 503 && cut.body.reason === "upstream_timeout", JSON.stringify(cut));
    const obj = await run(fake(() => answer(200, { rows: [{ email: "a" }] })));
    check("A a 200 that is not the row list answers 503, upstream_malformed (and never lets the caller through)",
      obj.ok === false && obj.status === 503 && obj.body.reason === "upstream_malformed");
    for (const st of [429, 404, 400]) {
      const r = await run(fake(() => answer(st, {})));
      check("A PostgREST answering " + st + " is no answer about the caller: 503", r.ok === false && r.status === 503);
    }
    check("A the siblings' 503s set no Retry-After, and neither does this one", !/retry-after/i.test(SHARED_CODE));
  }

  // ── B. A real refusal: 401 ──
  {
    for (const st of [401, 403]) {
      const r = await run(fake(() => answer(st, { message: "Invalid API key" })));
      check("B ⭐ the gateway answering " + st + " still answers 401 (key_refused)",
        r.ok === false && r.status === 401 && r.body.error === "unauthorized" && r.body.reason === "key_refused", JSON.stringify(r));
    }
    const anon = await run(fake(() => answer(200, [])));
    check("B ⭐ an empty row list (the anon key, RLS hides every row) still answers 401",
      anon.ok === false && anon.status === 401 && anon.body.reason === "not_service_key", JSON.stringify(anon));
    const none = fake(() => answer(200, [{ email: "a" }]));
    const nb = await run(none, "");
    check("B no bearer answers 401 with no lookup", nb.status === 401 && none.calls.length === 0);
    const bad = fake(() => Promise.reject(new TypeError("invalid header value")));
    const r1 = await run(bad, "abc\ndef"), r2 = await run(bad, "abc def");
    check("B a bearer that cannot be a header value answers 401, before any lookup, so it never reads as an outage",
      r1.status === 401 && r2.status === 401 && r1.body.reason === "bearer_malformed" && bad.calls.length === 0);
  }

  // ── C. Only a row lets the caller through ──
  {
    const f = fake(() => answer(200, [{ email: "someone@example.org" }]));
    const ok = await run(f);
    check("C ⭐ the service key (a 200 list holding a row) proceeds", ok.ok === true && !ok.status, JSON.stringify(ok));
    const c = f.calls[0] || {};
    check("C the probe reads allowed_reviewers, one row, with the caller's key as apikey and bearer, under a timeout",
      c.url === URL_BASE + "/rest/v1/allowed_reviewers?select=email&limit=1"
      && c.init.headers.apikey === "sb_secret_abc" && c.init.headers.Authorization === "Bearer sb_secret_abc"
      && c.init.signal && typeof c.init.signal.aborted === "boolean");
    check("C the default limit is the old probe's 12 s", S.PROBE_TIMEOUT_MS === 12000);
    check("C every return but one says ok: false", (SHARED_CODE.match(/ok: true/g) || []).length === 1);
  }

  // ── D. The function's wiring ──
  {
    check("D ⭐ the function imports the one shared check and keeps no copy of the old probe",
      /^import \{ checkServiceCaller \} from "\.\.\/_shared\/service_caller\.mjs";$/m.test(FN)
      && !/isServiceCred/.test(FN) && !/allowed_reviewers\?select/.test(FN));
    const handler = FN.split("Deno.serve(", 2)[1] || "";
    const at = handler.indexOf("checkServiceCaller(SUPABASE_URL, bearer)");
    const refuse = handler.indexOf("if (!caller.ok) return reply(caller.status, caller.body);");
    const body = handler.indexOf("await req.json()");
    check("D ⭐ the handler checks the caller first, returns its status and body when not ok, and reads the body after",
      at > 0 && refuse > at && body > refuse && handler.indexOf("client.beta.messages.create") > body
      && handler.indexOf("readWithXai(") > body);
    check("D the shared check is plain JavaScript with no imports and writes nothing",
      !/^\s*import\s/m.test(SHARED) && !/method:\s*"(POST|PATCH|DELETE|PUT)"/.test(SHARED));
    const DEPLOY = fs.readFileSync(".github/workflows/cpl-chat-deploy.yml", "utf8");
    check("D the deploy list names the function, runs from chatbox/ (where _shared sits) and records the shared bytes",
      /options:[\s\S]*- program-requirements-extract/.test(DEPLOY) && /working-directory: chatbox/.test(DEPLOY)
      && /_shared/.test(DEPLOY) && !fs.existsSync("chatbox/supabase/functions/_shared/index.ts"));
  }
})().catch(function (e) { check("driver threw: " + (e && e.stack), false); }).then(function () {
  let failed = 0;
  results.forEach(function (r) { if (!r[1]) failed++; console.log((r[1] ? "ok   " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n       " + r[2])); });
  console.log("\nservice_caller_check.test.js: " + (results.length - failed) + "/" + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
});
