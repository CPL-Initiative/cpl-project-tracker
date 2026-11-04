// One reader for the Commons file (the List norms, "never a second reader"; 2026-11-04). Where the List engine is
// loaded, Exhibits' tiles and line and the CR Reference's Progress view read kb/status/commons.json through
// CPL_COMMONS_LIST.readCommons, so one fetch serves every List and page in a visit; before the engine arrives each
// keeps its own read. Guards:
//   (1) exhibits.js and cr_progress.js route their Commons read through readCommons when the engine is present, and
//       fall back to their own read only when it is not;
//   (2) the engine's reader: a fresh read fetches once and later readers share it; a failed read rejects with its words
//       and is not kept, so the next read tries again.
// Run from repo root: `npm test` (or `node tests/commons_one_reader.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const EX = fs.readFileSync("exhibits.js", "utf8"), CRP = fs.readFileSync("cr_progress.js", "utf8"), LIST = fs.readFileSync("commons_list.js", "utf8");
function block(src, from, to) { const i = src.indexOf(from); return i < 0 ? "" : src.slice(i, src.indexOf(to, i)); }
const exRead = block(EX, "function readCommonsJson()", "function loadCommons()");
const crRead = block(CRP, "function readCommonsSoft()", "function load()");
check("(1) Exhibits reads the Commons file through the engine's reader when it is loaded", /CLM\.readCommons\(true\)/.test(exRead)
  && /readStatusJson\(COMMONS_URL\)/.test(exRead) && /readCommonsJson\(\)/.test(block(EX, "function loadCommons()", "function cmDate")));
check("(1) the CR Progress view does too", /CLM\.readCommons\(true\)/.test(crRead) && /readSoft\(COMMONS_URL, cr_row\)/.test(crRead)
  && /readCommonsSoft\(\)/.test(block(CRP, "function load()", "var TO")));

(async function () {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window; let n = 0, fail = true;
  w.fetch = function () { n++; return Promise.resolve(fail ? { ok: false, status: 503, json: () => Promise.resolve({}) }
    : { ok: true, status: 200, json: () => Promise.resolve({ written_at: "2026-11-04T00:00:00Z", rows: [{ key: "cr" }] }) }); };
  const e = w.document.createElement("script"); e.textContent = LIST; w.document.body.appendChild(e);
  const R = w.CPL_COMMONS_LIST.readCommons;
  let err = null;
  await R(true).catch((x) => { err = x; });
  check("(2) a failed read rejects with its words", !!err && /answered 503/.test(err.message), err && err.message);
  fail = false;
  const a = await R();
  check("(2) a failed read is not kept: the next read fetches again", n === 2 && Array.isArray(a.rows), String(n));
  const b = await R();
  check("(2) a later reader shares the read: no second fetch", n === 2 && b === a, String(n));
  await R(true);
  check("(2) a fresh read fetches once more", n === 3, String(n));

  let pass = 0;
  results.forEach(([nm, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + nm + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
  console.log("\ncommons_one_reader: " + pass + "/" + results.length + " passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((x) => { console.error(x); process.exit(1); });
