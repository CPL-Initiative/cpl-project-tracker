// cloudflare-worker-proxy.js: /trigger and the drafting path answer only a credential
// Postgres recognizes (COBIx round 1 items 1 and 2, 2026-11-05).
//
// Failure modes guarded:
//   1. an anonymous POST to the drafting path spends the Anthropic key (the open proxy);
//   2. an anonymous POST to /trigger dispatches the daily workflow (the published secret);
//   3. the reader's credential leaks onward to api.anthropic.com or api.github.com;
//   4. the preflight stops naming Authorization / x-team-pass, so the browser never sends them;
//   5. the daily workflow's own GET /scrape?secret= stops working.
//
// The worker is an ES module; it is loaded here with a fake global fetch that plays
// Supabase (the two RPCs), GitHub (the dispatch) and Anthropic (the model).
// Run from repo root: `npm test` (or `node tests/worker_credential.test.js`).
const path = require("path");

const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
const ORIGIN = "https://cpl-initiative.github.io";
const ENV = { ANTHROPIC_API_KEY: "sk-ant-test", SCRAPE_SECRET: "worker-only-value", GITHUB_TOKEN: "ghp_test" };
const REVIEWER_JWT = "aaa.bbb.ccc";
const PHRASE = "right-phrase";

const calls = [];
globalThis.fetch = async function (url, init) {
  init = init || {};
  const h = {};
  for (const k of Object.keys(init.headers || {})) h[k.toLowerCase()] = init.headers[k];
  calls.push({ url: String(url), init, h });
  if (/\/rest\/v1\/rpc\/team_pass_ok$/.test(url)) {
    return new Response(JSON.stringify(h["x-team-pass"] === PHRASE), { status: 200 });
  }
  if (/\/rest\/v1\/rpc\/is_allowed_reviewer$/.test(url)) {
    return new Response(JSON.stringify(h.authorization === "Bearer " + REVIEWER_JWT), { status: 200 });
  }
  if (/api\.github\.com\/.*\/dispatches$/.test(url)) return new Response(null, { status: 204 });
  if (/api\.anthropic\.com\/v1\/messages$/.test(url)) {
    return new Response(JSON.stringify({ content: [{ type: "text", text: "ok" }], model: "m" }), { status: 200 });
  }
  if (/cpldashboardcccco/.test(url)) {
    return new Response(JSON.stringify([{ Sorder: 1, Students: 1, Units: 1, Savings: 1 }]), { status: 200 });
  }
  return new Response("unexpected " + url, { status: 599 });
};

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function req(pathname, opts) {
  opts = opts || {};
  const headers = Object.assign({ Origin: ORIGIN, "Content-Type": "application/json" }, opts.headers || {});
  return new Request("https://cpl-proxy.slee-548.workers.dev" + pathname, {
    method: opts.method || "POST", headers, body: opts.method === "GET" || opts.method === "OPTIONS" ? undefined : (opts.body || "{}"),
  });
}
function reset() { calls.length = 0; }
const hit = (re) => calls.filter((c) => re.test(c.url));

(async () => {
  const worker = (await import(path.resolve("cloudflare-worker-proxy.js"))).default;

  // ── /trigger ──
  reset();
  let r = await worker.fetch(req("/trigger"), ENV);
  check("trigger: no credential → 403", r.status === 403);
  check("trigger: no credential → no dispatch", hit(/dispatches/).length === 0);
  check("trigger: the 403 names the sentence the button shows", /team phrase/.test((await r.json()).error));

  reset();
  r = await worker.fetch(req("/trigger", { body: JSON.stringify({ secret: "CPL_SCRAPE_2026" }) }), ENV);
  check("trigger: a published-style secret that is not the worker's → 403, no dispatch", r.status === 403 && hit(/dispatches/).length === 0);

  reset();
  r = await worker.fetch(req("/trigger", { headers: { "x-team-pass": PHRASE } }), ENV);
  let d = await r.json();
  check("trigger: team phrase → dispatch with the PAT", d.success === true && hit(/dispatches/).length === 1 && hit(/dispatches/)[0].h.authorization === "Bearer ghp_test");
  check("trigger: phrase verified by rpc/team_pass_ok under the anon key", hit(/team_pass_ok/).length === 1 && hit(/team_pass_ok/)[0].h.authorization === "Bearer " + ANON && hit(/team_pass_ok/)[0].h.apikey === ANON);
  check("trigger: phrase never reaches GitHub", !hit(/dispatches/)[0].h["x-team-pass"]);

  reset();
  r = await worker.fetch(req("/trigger", { headers: { "x-team-pass": "wrong" } }), ENV);
  check("trigger: wrong phrase → 403, no dispatch", r.status === 403 && hit(/dispatches/).length === 0);

  reset();
  r = await worker.fetch(req("/trigger", { headers: { Authorization: "Bearer " + REVIEWER_JWT } }), ENV);
  d = await r.json();
  check("trigger: reviewer bearer → dispatch", d.success === true && hit(/dispatches/).length === 1);
  check("trigger: bearer verified by rpc/is_allowed_reviewer with that bearer", hit(/is_allowed_reviewer/).length === 1 && hit(/is_allowed_reviewer/)[0].h.authorization === "Bearer " + REVIEWER_JWT);

  reset();
  r = await worker.fetch(req("/trigger", { headers: { Authorization: "Bearer " + ANON } }), ENV);
  check("trigger: the anon key as bearer is no credential (no reviewer RPC, 403)", r.status === 403 && hit(/is_allowed_reviewer/).length === 0);

  reset();
  r = await worker.fetch(req("/trigger", { body: JSON.stringify({ secret: ENV.SCRAPE_SECRET }) }), ENV);
  check("trigger: the worker's own secret in the body still opens it (console curl)", (await r.json()).success === true);

  reset();
  r = await worker.fetch(req("/trigger", { headers: { Origin: "https://evil.example" } }), ENV);
  check("trigger: foreign origin → 403 before any RPC", r.status === 403 && calls.length === 0);

  // ── drafting path ──
  reset();
  r = await worker.fetch(req("/", { body: JSON.stringify({ model: "m", messages: [] }) }), ENV);
  d = await r.json();
  check("draft: no credential → 401 in Anthropic's error shape", r.status === 401 && d.error && typeof d.error.message === "string");
  check("draft: no credential → the key is never spent", hit(/anthropic/).length === 0);

  reset();
  r = await worker.fetch(req("/", { headers: { "x-team-pass": PHRASE }, body: JSON.stringify({ model: "m", messages: [] }) }), ENV);
  check("draft: team phrase → forwarded with x-api-key", r.status === 200 && hit(/anthropic/).length === 1 && hit(/anthropic/)[0].h["x-api-key"] === "sk-ant-test");
  check("draft: the phrase never reaches Anthropic", !hit(/anthropic/)[0].h["x-team-pass"] && !hit(/anthropic/)[0].h.authorization);

  reset();
  r = await worker.fetch(req("/", { headers: { Authorization: "Bearer " + REVIEWER_JWT }, body: JSON.stringify({ model: "m", messages: [] }) }), ENV);
  check("draft: reviewer bearer → forwarded, bearer not forwarded", r.status === 200 && hit(/anthropic/).length === 1 && !hit(/anthropic/)[0].h.authorization);

  // ── preflight ──
  r = await worker.fetch(req("/", { method: "OPTIONS" }), ENV);
  const allow = r.headers.get("Access-Control-Allow-Headers") || "";
  check("preflight names Authorization and x-team-pass", /Authorization/.test(allow) && /x-team-pass/.test(allow));

  // ── /scrape (the daily workflow) ──
  reset();
  r = await worker.fetch(new Request("https://cpl-proxy.slee-548.workers.dev/scrape?secret=" + ENV.SCRAPE_SECRET, { method: "GET" }), ENV);
  check("scrape: the workflow's secret still passes the gate without a credential (the fixture is not a full API row, so the status is the parser's, not 403)", r.status !== 403 && hit(/cpldashboardcccco/).length === 1);
  reset();
  r = await worker.fetch(new Request("https://cpl-proxy.slee-548.workers.dev/scrape?secret=nope", { method: "GET" }), ENV);
  check("scrape: wrong secret → 403", r.status === 403);

  let failed = 0;
  for (const [name, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + name); if (!ok) failed++; }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
