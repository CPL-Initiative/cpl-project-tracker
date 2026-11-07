// TMC Builder owner token (COBIx item 9, security step 3, S602). Before it, any visitor could rewrite any
// college's saved draft (`tmc_submissions_anon_update using (true)`). The guard:
//   (1) a save carries ONE token in both the body and the x-tmc-token header, and reuses it on the next save;
//   (2) no read or upsert asks for owner_token or select=* (anon has no SELECT on it, so either would fail);
//   (3) a refused save says so in words;
//   (4) the migration keeps the token unreadable and the UPDATE policy keyed on it.
// Run from repo root: `npm test` (or `node tests/tmc_owner_token.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const src = fs.readFileSync("tmc_builder.js", "utf8");
const mig = fs.readFileSync("kb/migrations/2026-11-07_tmc_submissions_owner_token.sql", "utf8");
const rb = fs.readFileSync("kb/migrations/2026-11-07_tmc_submissions_owner_token_rollback.sql", "utf8");

// ── (4) the migration ────────────────────────────────────────────────────────
const colGrant = (mig.match(/grant select \(([^)]*)\)\s*on public\.tmc_submissions/i) || [])[1] || "";
check("migration grants SELECT by column", colGrant.length > 0);
check("the column grant leaves owner_token out", colGrant && !/owner_token/.test(colGrant));
check("table-wide SELECT is revoked from anon and authenticated",
  /revoke select[^;]*on public\.tmc_submissions from anon, authenticated/i.test(mig));
check("the open UPDATE policy is dropped", /drop policy if exists tmc_submissions_anon_update/i.test(mig));
check("the UPDATE policy matches the caller's token",
  /for update to anon\s+using \(owner_token is not null and owner_token = public\.tmc_request_token\(\)\)/i.test(mig));
check("the UPDATE check keeps the token from changing",
  /with check \([^;]*owner_token = public\.tmc_request_token\(\)\)/i.test(mig));
check("an insert must carry a token", /for insert to anon[\s\S]*owner_token is not null/i.test(mig));
check("a malformed header reads as null, never a cast error", /then h::uuid end/.test(mig));
check("the rollback restores the open policy and drops the column",
  /using \(true\)/.test(rb) && /drop column if exists owner_token/i.test(rb));

// ── (1)-(3) the client ───────────────────────────────────────────────────────
check("no tmc_submissions read uses select=*",
  !/tmc_submissions\?[^"]*select=\*/.test(src) && !/tmc_id\)\s*\+\s*"&select=\*"/.test(src));
const subCols = (src.match(/var SUB_COLS = ("[^;]*);/) || [])[1] || "";
check("SUB_COLS is defined and leaves owner_token out", subCols.length > 0 && !/owner_token/.test(subCols));

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", { runScripts: "outside-only", url: "https://example.test/" });
const w = dom.window;
const calls = [];
let respond = () => ({ ok: true, status: 201, json: async () => [{}], text: async () => "" });
w.fetch = (url, init) => { calls.push({ url: String(url), init: init || {} }); return Promise.resolve(respond()); };
w.eval(src);
const B = w.CPL_TMC_BUILDER;

(async () => {
  check("the module exposes its save and load for this test", B && typeof B._sbSave === "function" && typeof B._sbLoad === "function");
  const payload = { college: "Example College", tmc_id: "psychology", status: "draft", alignments: {} };
  await B._sbSave(payload);
  const c1 = calls[calls.length - 1];
  const body1 = JSON.parse(c1.init.body || "{}");
  const h1 = c1.init.headers || {};
  check("a save sends a uuid owner token in the body",
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body1.owner_token || ""));
  check("the header carries the same token", h1["x-tmc-token"] === body1.owner_token);
  check("the upsert names its RETURNING columns, owner_token not among them",
    /&select=id,/.test(c1.url) && !/owner_token/.test(c1.url));
  check("the caller's payload is not mutated", !("owner_token" in payload));

  await B._sbSave(payload);
  const body2 = JSON.parse(calls[calls.length - 1].init.body || "{}");
  check("a second save reuses the token", body2.owner_token === body1.owner_token);

  await B._sbSave({ college: "Example College", tmc_id: "sociology", status: "draft", alignments: {} });
  const body3 = JSON.parse(calls[calls.length - 1].init.body || "{}");
  check("another TMC gets its own token", body3.owner_token && body3.owner_token !== body1.owner_token);

  await B._sbLoad("Example College", "psychology");
  const lc = calls[calls.length - 1];
  check("a load names its columns and never owner_token", /&select=id,/.test(lc.url) && !/owner_token/.test(lc.url));

  check("a refused save has a plain-words message",
    /saveRefused\(r\)\) setMsg\(REFUSED_MSG/.test(src) && /saved from another browser/.test(src));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "  ok  " : "  FAIL ") + r[0]));
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
})();
