// cpl-chat — WHO IS ASKING is decided by the SERVER from the credential the
// request carries, never declared by the page (v66, 2026-09-12).
//
// ⭐ WHY. Sam asked for one assistant on every COBI surface that may, in a later
// build, use non-public data. The question put to him (To-Do s258-sam-sierra-
// bubble-scope) was whether to build the SCOPE FLAG, and the caution attached
// to it: "whether Sierra may read non-public data has to be decided by the
// server from your sign-in, not claimed by the page — otherwise the public
// Sierra becomes a way to read COBI's internal data." He ruled "3. Yes". (The
// checkpoint that carried the ruling relabeled it "the surface field", which
// had shipped on 2026-08-22 as v56 — the flag is the part that was unbuilt.)
//
// So the function derives a per-VIEWER kind — reviewer · team · public — by
// asking the database's own predicates with the caller's own credential, files
// it beside the turn, and echoes it in an `event: meta` frame. The page only
// carries the credential. This file pins the properties that make that safe:
//
//   (1) the credential split is pure and drops the anon key — it is not a user
//   (2) the derivation grants only on a strict `true` from the DB, is made with
//       the ANON key and the caller's header, and FAILS CLOSED on every path
//   (3) the request body cannot supply a viewer; the flag has exactly the
//       consumers this change intends (the log row and the meta frame)
//   (4) the SQL vocabulary equals the function's
//   (5)+(6) the COBI widget sends what it holds and never names a kind; the
//       recognition line is words, and nothing for the public
//   (7) the public page and the Fact Sheet drawer are untouched
//
// Run from repo root: `npm test` (or `node tests/sierra_viewer.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const { liftBlock } = require("./lib/lift_ts.js");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}
async function ablock(label, fn) {
  try { await fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
const SQL = fs.readFileSync("chatbox/supabase_sierra_feedback.sql", "utf8");
const CHAT = fs.readFileSync("cpl_chat.js", "utf8");
const SIERRA = fs.readFileSync("sierra/sierra.js", "utf8");
const FACTSHEET = fs.readFileSync("fact-sheet/factsheet_sierra.js", "utf8");

/* Scan CODE, not prose — the comments above the code quote the traps they
 * guard (same lesson as sierra_surface.test.js codeOnly()). */
function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const VIEWER_SRC = SRC.slice(SRC.indexOf("const VIEWER_KINDS"), SRC.indexOf("function hostScopeBlock("));
const VIEWER_CODE = codeOnly(VIEWER_SRC);
const HANDLER = SRC.slice(SRC.indexOf("Deno.serve("));
const HANDLER_CODE = codeOnly(HANDLER);

// Two credentials with the shape the function tests for: three dot-separated
// segments, longer than 40 characters. Neither is a real key.
const ANON = "anon-key-header.anon-key-payload-segment-x.anon-key-signature";
const JWT = "user-jwt-header.user-jwt-payload-segment-yyyyy.user-jwt-signature";
const SHORT = "a.b.c";

// A Headers-like object: case-insensitive get(), null when absent — what the
// real `req.headers` does, and the only surface the function reads.
function H(o) {
  const low = {};
  Object.keys(o || {}).forEach((k) => { low[k.toLowerCase()] = o[k]; });
  return { get: (k) => (Object.prototype.hasOwnProperty.call(low, k.toLowerCase()) ? low[k.toLowerCase()] : null) };
}

let M = null;
block("(0)", function () {
  M = liftBlock(SRC, "const VIEWER_KINDS", "function hostScopeBlock(",
    ["VIEWER_KINDS", "VIEWER_PUBLIC", "viewerCredentials", "deriveViewer"]);
  check("(0) the viewer block lifts out of the edge function", !!(M && typeof M.deriveViewer === "function"));
  check("(0) the vocabulary is the three kinds and no more",
    M && M.VIEWER_KINDS.size === 3 && ["reviewer", "team", "public"].every((k) => M.VIEWER_KINDS.has(k)));
  check("(0) the public default is frozen — nothing can promote it in place",
    M && Object.isFrozen(M.VIEWER_PUBLIC) && M.VIEWER_PUBLIC.kind === "public");
});

// ── (1) The credential split: pure, and the anon key is not a user ───────────
block("(1)", function () {
  if (!M) return;
  const c = M.viewerCredentials;
  check("(1) ⭐ the anon key as bearer is NOT a user credential",
    c(H({ Authorization: "Bearer " + ANON }), ANON).jwt === null,
    "every public page sends it; treating it as a JWT would spend an RPC per turn and prove nothing");
  check("(1) a user JWT as bearer is the credential",
    c(H({ Authorization: "Bearer " + JWT }), ANON).jwt === JWT);
  check("(1) the scheme is case-insensitive, as HTTP says",
    c(H({ authorization: "bearer " + JWT }), ANON).jwt === JWT);
  check("(1) a bearer that is not JWT-shaped is nothing",
    c(H({ Authorization: "Bearer " + SHORT }), ANON).jwt === null &&
    c(H({ Authorization: "Bearer " + JWT.replace(/\./g, "-") }), ANON).jwt === null &&
    c(H({ Authorization: JWT }), ANON).jwt === null);
  check("(1) the team phrase rides in x-team-pass",
    c(H({ Authorization: "Bearer " + ANON, "x-team-pass": " open sesame " }), ANON).teamPass === "open sesame");
  check("(1) …bounded: an overlong phrase is dropped, not forwarded",
    c(H({ "x-team-pass": "p".repeat(201) }), ANON).teamPass === null &&
    c(H({ "x-team-pass": "p".repeat(200) }), ANON).teamPass !== null);
  check("(1) no headers at all → nothing, and no throw",
    (() => { const r = c(null, ANON); return r.jwt === null && r.teamPass === null; })() &&
    (() => { const r = c({}, ANON); return r.jwt === null && r.teamPass === null; })());
  check("(1) ⚠ with no anon key to compare against, no bearer counts as a user",
    c(H({ Authorization: "Bearer " + JWT }), "").jwt === null,
    "an empty comparison key must not turn the anon key into a JWT");
});

// ── (2) The derivation: strict, anon-signed, fail-closed ─────────────────────
function fakeFactory(answers) {
  const calls = [];
  const mk = (key, headers) => ({
    rpc: async (fn) => {
      calls.push({ key, headers, fn });
      const a = answers[fn];
      if (a instanceof Error) throw a;
      return a || { data: null, error: { message: "no such rpc" } };
    },
  });
  return { mk, calls };
}
const savedDeno = global.Deno;
function withAnonKey(key) { global.Deno = { env: { get: (k) => (k === "SUPABASE_ANON_KEY" ? key : "") } }; }

async function derivation() {
  if (!M) return;
  const D = M.deriveViewer;

  withAnonKey(ANON);
  let f = fakeFactory({ is_allowed_reviewer: { data: true, error: null } });
  let v = await D(H({ Authorization: "Bearer " + JWT }), f.mk);
  check("(2) ⭐ a JWT the database accepts is a reviewer", v.kind === "reviewer");
  check("(2) ⭐ …checked with the ANON key and the caller's own bearer",
    f.calls.length === 1 && f.calls[0].key === ANON && f.calls[0].fn === "is_allowed_reviewer"
      && f.calls[0].headers.Authorization === "Bearer " + JWT,
    "the service key would make auth.jwt() name nobody; the anon key + the user's JWT is a browser request");
  check("(2) …and the phrase is not asked about once the JWT answered", !f.calls.some((c) => c.fn === "team_pass_ok"));

  f = fakeFactory({ is_allowed_reviewer: { data: false, error: null }, team_pass_ok: { data: true, error: null } });
  v = await D(H({ Authorization: "Bearer " + JWT, "x-team-pass": "phrase" }), f.mk);
  check("(2) ⭐ a signed-in NON-reviewer holding the phrase is team",
    v.kind === "team" && f.calls.length === 2 && f.calls[1].fn === "team_pass_ok"
      && f.calls[1].headers["x-team-pass"] === "phrase" && f.calls[1].key === ANON,
    "the phrase un-shadows a JWT that fails is_allowed_reviewer(), exactly as the RLS OR-gates do");

  f = fakeFactory({ team_pass_ok: { data: true, error: null } });
  v = await D(H({ Authorization: "Bearer " + ANON, "x-team-pass": "phrase" }), f.mk);
  check("(2) the anon bearer plus a valid phrase is team, with no reviewer RPC spent",
    v.kind === "team" && f.calls.length === 1 && f.calls[0].fn === "team_pass_ok");

  f = fakeFactory({});
  v = await D(H({ Authorization: "Bearer " + ANON }), f.mk);
  check("(2) ⭐ the anon bearer alone is public and costs ZERO round trips",
    v.kind === "public" && f.calls.length === 0);

  f = fakeFactory({ is_allowed_reviewer: { data: null, error: { message: "JWT expired", code: "PGRST301" } } });
  v = await D(H({ Authorization: "Bearer " + JWT }), f.mk);
  check("(2) ⭐ an expired or forged JWT (a PostgREST error) is public", v.kind === "public");

  f = fakeFactory({ is_allowed_reviewer: { data: "true", error: null } });
  v = await D(H({ Authorization: "Bearer " + JWT }), f.mk);
  check("(2) ⚠ only a strict boolean true grants — a truthy string does not", v.kind === "public");

  f = fakeFactory({ is_allowed_reviewer: new Error("network down") });
  v = await D(H({ Authorization: "Bearer " + JWT, "x-team-pass": "phrase" }), f.mk);
  check("(2) ⭐ a thrown check is public — FAIL CLOSED, and the phrase is not reached past the throw",
    v.kind === "public");

  f = fakeFactory({ team_pass_ok: { data: false, error: null } });
  v = await D(H({ "x-team-pass": "wrong" }), f.mk);
  check("(2) a wrong phrase is public", v.kind === "public");

  const before = { kind: "public" };
  f = fakeFactory({ is_allowed_reviewer: { data: true, error: null } });
  v = await D(H({ Authorization: "Bearer " + JWT }), f.mk);
  check("(2) a grant is a fresh object, never a mutation of the shared public default",
    v !== M.VIEWER_PUBLIC && M.VIEWER_PUBLIC.kind === before.kind);

  withAnonKey("");
  f = fakeFactory({ is_allowed_reviewer: { data: true, error: null }, team_pass_ok: { data: true, error: null } });
  v = await D(H({ Authorization: "Bearer " + JWT, "x-team-pass": "phrase" }), f.mk);
  check("(2) ⭐ with no anon key to sign the check, everyone is public and nothing is asked",
    v.kind === "public" && f.calls.length === 0,
    "a check signed with nothing is a check that could be answered by anything");

  global.Deno = savedDeno;
}

// ── (3) Source claims the lift cannot make ───────────────────────────────────
block("(3)", function () {
  const parse = (HANDLER.match(/const \{[^}]*\} = await req\.json\(\);/) || [""])[0];
  check("(3) ⭐ the request body is never read for a viewer",
    parse.length > 0 && !/\bviewer\b/.test(parse) && !/\bviewer\b/.test(codeOnly(parse)),
    "a body-declared access bit is a claim any caller can make");
  check("(3) the derivation is made from req.headers, inside the parallel retrieval batch",
    /await Promise\.all\(\[[\s\S]*?deriveViewer\(req\.headers\)[\s\S]*?\]\);/.test(HANDLER_CODE),
    "so recognizing a reviewer costs no latency a public reader pays for");
  const viewerMentions = (HANDLER_CODE.match(/\bviewer\b/g) || []).length;
  check("(3) ⭐ the viewer reaches exactly two places — the log row and the meta frame",
    viewerMentions === 5
      && /, viewer\] = await Promise\.all\(/.test(HANDLER_CODE)
      && (HANDLER_CODE.match(/viewer: viewer\.kind/g) || []).length === 2,
    "found " + viewerMentions + " code mentions, expected 5 (1 binding + 2 in the meta frame + 2 in the log insert). "
    + "A prompt or retrieval consumer is the SECOND build and routes through Governance first");
  check("(3) …the log insert carries both the viewer and the surface",
    /\.from\("chat_interactions"\)\.insert\(\{[\s\S]*?viewer: viewer\.kind,[\s\S]*?surface: hostSurface,[\s\S]*?\}\);/.test(HANDLER));
  check("(3) …and the meta frame names exactly {surface, viewer}",
    /event: meta\\ndata: \$\{JSON\.stringify\(\{ surface: hostSurface, viewer: viewer\.kind \}\)\}/.test(HANDLER));
  const iS = HANDLER_CODE.indexOf("event: sources"), iM = HANDLER_CODE.indexOf("event: meta"), iT = HANDLER_CODE.indexOf("event: text");
  check("(3) the meta frame is sent after sources and before any text",
    iS > 0 && iM > iS && iT > iM);

  check("(3) ⭐ the check is the database's own predicates, by RPC",
    /\.rpc\("is_allowed_reviewer"\)/.test(VIEWER_CODE) && /\.rpc\("team_pass_ok"\)/.test(VIEWER_CODE));
  check("(3) ⚠ …never a decode of the token, a local allowlist, or a table read",
    !/atob\(|JSON\.parse\(|allowed_reviewers|\.from\(/.test(VIEWER_CODE),
    "decoding a JWT here would trust an unverified signature; reading the table would re-implement the predicate");
  check("(3) ⚠ …and never signed with the service key",
    !/SUPABASE_SERVICE_KEY|SERVICE_ROLE/.test(VIEWER_CODE),
    "under the service key auth.jwt() names nobody and team_pass_ok() reads no header");
  check("(3) the clients are made with the anon key from the environment",
    /Deno\.env\.get\("SUPABASE_ANON_KEY"\)/.test(VIEWER_CODE) && /createClient\(SUPABASE_URL, anonKey,/.test(VIEWER_CODE));
  check("(3) ⭐ fail closed: the derivation ends in the public default after its catch",
    /catch \(e\) \{[\s\S]*?\}\s*return VIEWER_PUBLIC;\s*\}\s*$/.test(VIEWER_CODE.trimEnd()));
  check("(3) CORS admits the x-team-pass header, or every phrase holder reads as public",
    /"Access-Control-Allow-Headers": "[^"]*\bx-team-pass\b[^"]*"/.test(SRC));
});

// ── (4) The SQL vocabulary and the function's are ONE list ───────────────────
block("(4)", function () {
  if (!M) return;
  const ck = (SQL.match(/chat_interactions_viewer_ck[\s\S]*?check \(([^;]*)\);/) || [])[1] || "";
  check("(4) the schema of record carries the viewer constraint", ck.length > 0,
    "chatbox/supabase_sierra_feedback.sql holds every chat_interactions addition");
  const names = (ck.match(/'([a-z]+)'/g) || []).map((t) => t.slice(1, -1));
  const missing = [...M.VIEWER_KINDS].filter((k) => names.indexOf(k) < 0);
  const extra = names.filter((k) => !M.VIEWER_KINDS.has(k));
  check("(4) ⭐ every kind the function can write is allowed by the constraint",
    ck.length > 0 && missing.length === 0, "missing from SQL: " + missing.join(", "));
  check("(4) …and the constraint allows nothing the function never writes",
    ck.length > 0 && extra.length === 0, "in SQL but not in VIEWER_KINDS: " + extra.join(", "));
  check("(4) the constraint admits NULL — rows from before the migration have no viewer",
    /viewer is null or viewer in/.test(ck));
  check("(4) the surface column is added, nullable and unconstrained (telemetry normalized upstream)",
    /add column if not exists surface text;/.test(SQL) && !/surface_ck/.test(SQL.slice(SQL.indexOf("viewer + surface"))));
});

// ── (5) The COBI widget: sends what it holds, never names a kind ─────────────
block("(5)", function () {
  const call = CHAT.slice(CHAT.indexOf("resp = await fetch(CHAT_URL, {"), CHAT.indexOf("body: JSON.stringify({", CHAT.indexOf("resp = await fetch(CHAT_URL, {")));
  check("(5) ⭐ the chat request's headers come from credentialHeaders()",
    /headers: credentialHeaders\(\),/.test(call) && !/'Bearer ' \+ SUPABASE_ANON/.test(call));
  const body = (CHAT.match(/body: JSON\.stringify\(\{\s*query: query,[\s\S]*?\}\),/) || [""])[0];
  check("(5) ⭐ the request body still names no viewer",
    body.length > 0 && !/\bviewer\b/.test(body) && /surface: hostSurface,/.test(body));
  check("(5) ⚠ no header of our own names a kind either",
    !/x-cpl-viewer|x-viewer|x-internal|x-reviewer/i.test(CHAT));
  check("(5) the JWT replaces the bearer only when it is JWT-shaped",
    /tok\.split\('\.'\)\.length === 3 && tok\.length > 40\) h\['Authorization'\] = 'Bearer ' \+ tok;/.test(CHAT));
  check("(5) the phrase rides through the shared decorateHeaders(), the same as every gated tab",
    /P\.decorateHeaders\(h, sess\)/.test(CHAT));
  check("(5) the meta frame is handled by name, and only by name",
    /evt\.event === 'meta'/.test(CHAT) && /noteViewer\(JSON\.parse\(evt\.data\)\)/.test(CHAT));
});

// ── (6) The recognition line, in a real DOM ──────────────────────────────────
const HTML = '<!doctype html><html><head></head><body>' +
  '<div id="tab-chatbot"><div class="main-container"></div></div></body></html>';
function streamResp(frames) {
  const enc = new TextEncoder();
  let i = 0;
  return {
    ok: true, status: 200,
    body: { getReader: () => ({
      read: () => i < frames.length
        ? Promise.resolve({ value: enc.encode(frames[i++]), done: false })
        : Promise.resolve({ value: undefined, done: true }),
      releaseLock: function () {},
    }) },
    text: () => Promise.resolve(""),
  };
}
function loadDom(frames) {
  const dom = new JSDOM(HTML, { runScripts: "outside-only",
    url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  const requests = [];
  w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder;
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  try { w.localStorage.setItem("cplSierraAudience.v1", "student"); } catch (e) { /* ignore */ }
  try { w.sessionStorage.setItem("cplSierraAudienceOk.v1", "student"); } catch (e) { /* ignore */ }
  w.fetch = function (url, init) {
    requests.push({ url: String(url), init: init });
    return Promise.resolve(streamResp(frames || []));
  };
  w.eval(CHAT);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: false }));
  return { w, API: w.CPL_CHAT, requests };
}
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 60));

async function widget() {
  await ablock("(6)", async function () {
    const { w, API, requests } = loadDom([
      "event: sources\ndata: []\n\n",
      "event: meta\ndata: " + JSON.stringify({ surface: "cobi-assistant", viewer: "reviewer" }) + "\n\n",
      "event: text\ndata: " + JSON.stringify({ text: "Hello." }) + "\n\n",
      "event: done\ndata: {}\n\n",
    ]);
    const line = w.document.querySelector(".cplchat-viewer");
    check("(6) the recognition line exists and starts hidden and empty",
      !!line && line.hidden === true && line.textContent === "");

    // Headers: nothing held → the anon key, and no phrase header.
    let h = API.credentialHeaders();
    check("(6) ⭐ with nothing held, the bearer is the anon key and no phrase rides",
      /^Bearer /.test(h.Authorization) && h.Authorization !== "Bearer " + JWT && !("x-team-pass" in h) && !!h.apikey);
    const anonBearer = h.Authorization;

    // A magic-link session → its JWT is the bearer; apikey unchanged.
    w.CPL_SESSION = { get: () => ({ access_token: JWT, email: "someone@rccd.edu" }) };
    h = API.credentialHeaders();
    check("(6) ⭐ a held magic-link session makes its JWT the bearer, apikey unchanged",
      h.Authorization === "Bearer " + JWT && h.apikey && h.apikey !== JWT);
    // A malformed token is not sent as a bearer.
    w.CPL_SESSION = { get: () => ({ access_token: SHORT }) };
    check("(6) a malformed token is not sent — the anon bearer stands",
      API.credentialHeaders().Authorization === anonBearer);
    // The session holder throwing must not break the ask.
    w.CPL_SESSION = { get: () => { throw new Error("storage unavailable"); } };
    check("(6) a throwing session holder falls back to the anon bearer, no throw",
      API.credentialHeaders().Authorization === anonBearer);
    // The team phrase rides through decorateHeaders().
    w.CPL_SESSION = null;
    w.CPL_TEAM_PHRASE = { decorateHeaders: (hh, sess) => { hh["x-team-pass"] = "the-phrase"; return hh; } };
    h = API.credentialHeaders();
    check("(6) ⭐ a held team phrase rides in x-team-pass beside the anon bearer",
      h["x-team-pass"] === "the-phrase" && h.Authorization === anonBearer);

    // Direct rendering contract.
    API.noteViewer({ surface: "cobi-assistant", viewer: "reviewer" });
    check("(6) ⭐ reviewer → the line shows the reviewer words",
      line.hidden === false && line.textContent === API.VIEWER_WORDS.reviewer);
    API.noteViewer({ viewer: "team" });
    check("(6) team → the team words", line.hidden === false && line.textContent === API.VIEWER_WORDS.team);
    API.noteViewer({ viewer: "public" });
    check("(6) ⭐ public → nothing: hidden and empty, the line's default",
      line.hidden === true && line.textContent === "");
    API.noteViewer({ viewer: "reviewer" });
    API.noteViewer({ viewer: "constructor" });
    check("(6) ⚠ an unknown kind renders nothing, and prototype names are not words",
      line.hidden === true && line.textContent === "");
    API.noteViewer(null);
    check("(6) a missing frame renders nothing", line.hidden === true && line.textContent === "");
    check("(6) ⭐ the words are WORDS — no emoji, no glyph, and none for the public",
      Object.keys(API.VIEWER_WORDS).sort().join(",") === "reviewer,team"
        && Object.values(API.VIEWER_WORDS).every((t) => /^[A-Za-z ,.\-']+$/.test(t) && t.indexOf("Recognized by the assistant") === 0));

    // End to end: a real turn whose stream carries a meta frame.
    w.CPL_SESSION = { get: () => ({ access_token: JWT }) };
    w.CPL_TEAM_PHRASE = null;
    const input = w.document.querySelector("#cplchat-input, .cplchat-input");
    const send = w.document.querySelector(".cplchat-send");
    input.value = "What is CPL?";
    send.click();
    await tick(120);
    check("(6) ⭐ the turn's request carried the held JWT as its bearer",
      requests.length === 1 && requests[0].init.headers.Authorization === "Bearer " + JWT);
    check("(6) …and the body carried the surface but no viewer",
      requests.length === 1 && /"surface":"cobi-assistant"/.test(requests[0].init.body)
        && !/viewer/.test(requests[0].init.body));
    check("(6) ⭐ the meta frame from the stream rendered the reviewer line",
      line.hidden === false && line.textContent === API.VIEWER_WORDS.reviewer);
  });
}

// ── (7) The public surfaces are untouched ────────────────────────────────────
block("(7)", function () {
  check("(7) ⭐ the public Sierra page still sends the anon key and holds no credential",
    /'Authorization': 'Bearer ' \+ SUPABASE_ANON/.test(SIERRA) && !/CPL_SESSION|credentialHeaders|x-team-pass/.test(SIERRA));
  check("(7) ⭐ so does the Fact Sheet drawer",
    /'Authorization': 'Bearer ' \+ SUPABASE_ANON/.test(FACTSHEET) && !/CPL_SESSION|credentialHeaders|x-team-pass/.test(FACTSHEET));
});

(async function main() {
  await derivation();
  await widget();
  const failed = results.filter((r) => !r[1]);
  results.forEach(([name, ok, why]) =>
    console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
  console.log("\nsierra_viewer.test.js: "
    + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})();
