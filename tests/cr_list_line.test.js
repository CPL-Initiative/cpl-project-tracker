// The line over the Common CR Reference List and its folded cards (the List norms, The List is the workspace, norm 1;
// Sam, 2026-11-03: "incorporating the list view below the action/metric cards and make that top level collapsible while
// keeping the one-line action/metric links like we do elsewhere"). Exhibits drew the first line; the engine draws it now
// for every List (commons_list.js api.line, readCommons, lineItems). Guards:
//   (1) the line reads the CR row of kb/status/commons.json: the pair's count of its whole and its words up to the first
//       parenthesis or semicolon, the confirmed count, then each known issue, joined by a quiet middle dot;
//   (2) a count whose place is the List's own filter is a word that sets it; the count of where the List already is is
//       plain text, and the List's own count turns back into a word once a filter is set;
//   (3) the worklist's measured stance sits in a fold under the line; Hide the summary hides it, its word says so
//       (aria-expanded, aria-controls), and focus stays on the word;
//   (4) a failed read says the figures could not be read, once, with no retry loop; a new visit reads again;
//   (5) lineItems shortens a row the way the line reads it.
// Run from repo root: `npm test` (or `node tests/cr_list_line.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
const SRC = fs.readFileSync("cr_reference.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");
const COMMONS = { schema: 1, written_at: "2026-11-03T20:00:00Z", rows: [{ key: "exhibit", pair: [], issues: [] }, { key: "cr", title: "Common CR Reference",
  pair: [{ n: 460, of: 2344, words: "wordings resolve to a settled reference (410 by a rung 1 to 4 rule, 50 more by a curator); 5,900 of 9,432 articulations", open: "#cr-reference/list" },
    { n: 97, of: 2344, words: "confirmed by a person, 97 of them settled", open: "#cr-reference/list", error: null }],
  issues: [{ n: 1884, words: "wordings no rule places and no curator has decided, where a curator judges across groups", open: "#cr-reference/open" },
    { n: 38, words: "groups an official number reaches whose title shares no word with the wordings, held for a check", open: "#cr-reference/names" },
    { n: null, words: "groups a reviewer flagged", open: "#cr-reference/flagged", error: "unread" }] }] };

function member(rec, rows, colleges, extra) {
  return Object.assign({ rec: rec, topic: rec, rows: rows, screens: { level: false }, units_lo: 3, units_hi: 3, unit_word: "hour",
    credentials: [], credentials_n: 0, colleges_n: colleges, courses: [] }, extra || {});
}
const WORKLIST = { _stats: { distinct_strings: 5, total_rows: 900 }, groups: [
  { key: "community relations", canonical: "3 hours in Community Relations", canonical_source: "published_statewide", rung: 1,
    rung_why: "Published statewide recommendation", acts_automatically: true, screens_objecting: [], wordings: 2, rows: 415,
    credentials: 4, colleges: 28, courses: [], subjects: [], members: [
      member("3 hours in Community Relations", 293, 28, { credentials: ["POST Basic Academy"] }),
      member("3.0 hours in Community Relations", 122, 20)] },
  { key: "engine performance", canonical: "3 or 4 hours in Engine Performance", canonical_source: "published_statewide", rung: 5,
    rung_why: "", acts_automatically: false, screens_objecting: [], wordings: 2, rows: 66, credentials: 3, colleges: 15,
    courses: ["AUTO M1008"], subjects: [], members: [
      member("3 or 4 hours in Engine Performance", 38, 9, { courses: ["AUTO M1008"] }),
      member("5 hours in Engine Performance", 28, 8)] },
  { key: "welding", canonical: "4 hours in Welding", canonical_source: "modal", rung: 5, rung_why: "", acts_automatically: false,
    screens_objecting: [], wordings: 1, rows: 12, credentials: 1, colleges: 3, courses: [], subjects: [], members: [
      member("4 hours in Welding", 12, 3, { credentials: ["AWS Certified Welder"] })] }
] };

function tab(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-cr-reference" class="cpl-tab-pane"><div id="cr-reference-root"></div></div></body></html>',
    { url: "https://example.org/#cr-reference/list", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  if (opts.signedIn !== false) w.localStorage.setItem("cpl_team_pass", "phrase");
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url: url, method: init.method || "GET", body: body });
    const ok = (o) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(o))) });
    if (url === "kb/cr_reference_worklist.json") return ok(WORKLIST);
    if (url === "kb/status/commons.json") return opts.commons ? ok(opts.commons) : Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
    if (/\/kb_curation\?select/.test(url)) return opts.flagReadFails ? Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }) : ok(opts.flags || []);
    if (/\/kb_curation$/.test(url) && init.method === "POST") return ok(body.map((r) => Object.assign({}, r)));
    if (/cr_reference_decisions\?select/.test(url)) return ok(opts.decisions || []);
    if (/cr_reference_decisions/.test(url) && init.method === "POST") return ok(opts.refuse ? [] : body.map((r) => Object.assign({}, r)));
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  };
  w.CPL_SESSION = { ensureFresh: () => Promise.resolve(opts.reviewer === false ? null : { access_token: "a.b.c", email: "sam@example.org" }) };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    calls.push({ url: "loadScript:" + s, method: "SCRIPT" });
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = LIST_SRC; w.document.body.appendChild(e); }
    setTimeout(cb, 0);
  } };
  w.eval(SRC);
  return { w: w, d: w.document, M: w.CPL_CR_REFERENCE, calls: calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 12; i++) await tick(); }
function rows(d) { return Array.from(d.querySelectorAll(".crl-table tbody tr:not(.crl-editrow):not(.crl-band)")); }
/* A filter word carries its count, "Decided (2)"; a word is found by its label either way. */
function words(d, t) { return Array.from(d.querySelectorAll("button")).find((b) => txt(b) === t || txt(b).replace(/ \([\d,]+\)$/, "") === t); }
function posts(t) { return t.calls.filter((c) => c.method === "POST"); }

(async function () {
  check("(5) the engine documents the line and exports its reader and items", /The line \(api\.line/.test(LIST_SRC) && /readCommons: readCommons/.test(LIST_SRC) && /lineItems: lineItems/.test(LIST_SRC));
  let t = tab({ commons: COMMONS });
  t.M.activate(); await settle();
  const bar = () => t.d.querySelector(".crl-linebar");
  check("(1) the line sits above the List as a labelled group", !!bar() && bar().getAttribute("role") === "group" && bar().getAttribute("aria-label") === "The reference at a glance"
    && bar().compareDocumentPosition(t.d.querySelector(".crl-table")) === 4);
  const parts = () => Array.from(bar().querySelector(".crl-line").childNodes).filter((n) => !(n.classList && n.classList.contains("crl-sep"))).map(txt);
  check("(1) the pair's count of its whole, the confirmed count, then each known issue", parts().join(" | ") === "460 of 2,344 wordings resolve to a settled reference | 97 confirmed by a person"
    + " | 1,884 wordings no rule places and no curator has decided, where a curator judges across groups | 38 groups an official number reaches whose title shares no word with the wordings, held for a check"
    + " | Could not be read: groups a reviewer flagged", parts().join(" | "));
  check("(1) the dots are quiet and hidden from a screen reader", Array.from(bar().querySelectorAll(".crl-sep")).every((x) => x.getAttribute("aria-hidden") === "true" && txt(x) === "·"));
  const lineWord = (re) => Array.from(bar().querySelectorAll(".crl-line button")).find((b) => re.test(txt(b)));
  check("(2) where the List already is reads as plain text", !lineWord(/^460 of/) && !lineWord(/^97 confirmed/));
  lineWord(/^1,884 wordings/).click(); await settle();
  const on = Array.from(t.d.querySelectorAll(".cl-on")).map(txt).join(",");
  check("(2) an issue's count sets the List's own filter", /No rule or decision/.test(on) && !lineWord(/^1,884/) && !!lineWord(/^460 of/), on);
  // A count pressed from the line resets the page to the first one; a null limit drew an empty table (2026-11-04).
  check("(2) ⭐ the filter the line sets shows its rows, never an empty table", rows(t.d).length > 0, String(rows(t.d).length));
  lineWord(/^460 of/).click(); await settle();
  check("(2) the List's own count turns back to All, every wording shown", /^All/.test(Array.from(t.d.querySelectorAll(".cl-on")).map(txt).join(",")) && !lineWord(/^460 of/)
    && rows(t.d).length === 5, String(rows(t.d).length));
  const fold = () => t.d.getElementById("crl-fold"), tog = () => t.d.getElementById("crl-fold-w");
  check("(3) the worklist's measured stance sits in the fold, open", !!fold() && !fold().hidden && fold().querySelectorAll(".crr-stat").length === 5
    && /5wordings in the corpus/.test(txt(fold())) && txt(tog()) === "Hide the summary" && tog().getAttribute("aria-expanded") === "true"
    && tog().getAttribute("aria-controls") === "crl-fold", fold() && txt(fold()));
  tog().click(); await settle();
  check("(3) Hide the summary folds the cards, says so, and keeps focus", fold().hidden && txt(tog()) === "Show the summary" && tog().getAttribute("aria-expanded") === "false"
    && t.d.activeElement === tog() && !!bar());
  tog().click(); await settle();
  check("(3) Show the summary brings them back", !fold().hidden && txt(tog()) === "Hide the summary");
  const reads = () => t.calls.filter((c) => c.url === "kb/status/commons.json").length;
  check("(4) the figures are read once a visit", reads() === 1, String(reads()));
  t.M.activate(); await settle();
  check("(4) a new visit reads them again", reads() === 2, String(reads()));

  t = tab();
  t.M.activate(); await settle();
  for (let i = 0; i < 6; i++) await settle();
  check("(4) a failed read says so, once, with no loop", /The Commons' figures could not be read \(kb\/status\/commons\.json answered 404\)/.test(txt(t.d.querySelector(".crl-linebar")))
    && t.calls.filter((c) => c.url === "kb/status/commons.json").length === 1, txt(t.d.querySelector(".crl-linebar")));
  check("(4) the List and the cards stand", t.d.querySelectorAll(".crl-table tbody tr").length > 0 && t.d.querySelectorAll("#crl-fold .crr-stat").length === 5);

  const items = t.w.CPL_COMMONS_LIST.lineItems({ pair: [{ n: 5, of: null, words: "titles; more" }, { n: 2, words: "confirmed by a person (2 settled)" }], issues: [] });
  check("(5) lineItems: no whole, no \"of\"; words cut at a semicolon, a comma or a parenthesis", items.map((x) => x.words).join("|") === "titles|confirmed by a person");

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n     " + r[2])));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
