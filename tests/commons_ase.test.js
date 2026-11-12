// The CPL Commons' first slice: where an ASE certification can count (commons_ase.js, opened by commons.js).
//
// The Commons plan's v2 Agreed final (#3111, comment 6808952144; Sam's go, Open Asks Sheet 181 card 10): every ASE
// credential in MAP at every college in one of three states (lists credit, a likely match with its level, no answer
// yet), the level and reasons, a source and read date under each fact, the data gaps the slice found. Read-only.
//
// WHAT THIS GUARDS (each a way the slice can mislead a student):
//   (1) ⭐ a retired title shown instead of its live one: a stored key a rename moved, and an address naming the old
//       title, both read as the live title, through map_links.js's one reader of kb/credential_title_moves.json;
//   (2) ⭐ an exhibit shown under an issuer that is really its assessor: scope and the issuer line come from the
//       title's issuer field, so a colleges-issued "ASE standards" title whose exhibits ASE assessed stays out, and a
//       credit-by-exam exhibit under an ASE title reads "assessed by the college" while the issuer stays ASE;
//   (3) ⭐ the view's address round trip: #commons/ase and #commons/ase/<title> open their view, the view reports the
//       address it shows, a pick reports the new one, a later visit on #commons draws the first view again;
//   (4) the three states, the levels and their reasons, and a figure that opens what it counts;
//   (5) no write and no stored pick; tokens only; plain words; Request CPL Review linked nowhere, named as a gap.
//
// Run from repo root: `npm test` (or `node tests/commons_ase.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const PROGRESS = fs.readFileSync("commons_progress.js", "utf8");
const COMMONS = fs.readFileSync("commons.js", "utf8");
const LINKS = fs.readFileSync("map_links.js", "utf8");
const SRC = fs.readFileSync("commons_ase.js", "utf8");

const ASE = "National Institute for Automotive Service Excellence (ASE)";
const A5 = "ASE A5 — Brakes", BUNDLE = "ASE Certificate Bundles: A4 + A5", OLD = "ASE Bundle — A4, A5", STD = "Brakes (ASE A5 standards)";
const RELATED = {
  generated_at: "2026-11-12T07:34:48Z",
  paths: { ic: { words: "industry certification", assessed_by: "issuer" }, cx: { words: "credit by exam", assessed_by: "college" } },
  issuers: ["California Community Colleges", ASE],
  titles: [
    [A5, 1, 14, 1, 0, ["Automotive Brakes"], [["ic", 10], ["cx", 1]]],
    [STD, 0, 7, 1, 0, [], [["ic", 3]]],          // the colleges issue it; ASE assessed its exhibits
    [BUNDLE, 1, 2, 1, 0, [], [["ic", 2]]],
    ["Proposed Brakes (ASE A5)", 1, 0, 0, 1, [], []]   // only proposed: out of the reference
  ]
};
const ADOPTION = {
  written_at: "2026-11-12T06:40:07Z",
  colleges: ["Alpha College", "Beta College", "Gamma College", "Delta College"],
  credentials: {
    [A5]: { a: { "0": [3, [["AUTO 54", "3 hours in Brakes"]]] }, c: { "1": [["AT 110", "", 3]] }, x: [["MAPICI-ASE5-1-001", "ASE A5", 3]] },
    [OLD]: { a: { "2": [6, [["AUTO 60", "6 hours in Brakes and Steering"]]] } },     // a stored key a rename moved
    [STD]: { a: { "3": [4, [["AUTO 99", "4 hours in Brakes"]]] } }
  }
};
const AI = {
  written_at: "2026-11-07T02:33:51Z", page: "https://map.rccd.edu/CPL-AI/", credit: "Funded by College Futures Foundation.",
  tiers: { 1: "Strong evidence", 2: "Faculty interpretation", 3: "Limited evidence" },
  colleges: ["Alpha College", "Beta College", "Gamma College", "Delta College"],
  by_exhibit: { [A5]: [{ code: "ase5", title: "ASE Certification A5: Brakes", by_college: {
    "2": [["AUTO 9", "Brakes II", 1, 7, 8, "x1"]], "1": [["AT 110", "Brakes", 3, 1, 9, "x2"]] } }] }
};
const MOVES = { moves: { [OLD]: [BUNDLE] }, retires: {} };
const VERIFIED = { checked_at: "2026-10-26T23:35Z", found: { "MAPICI-ASE5-1-001": { college: "Alpha College", title: "ASE A5" } },
  by_title: { [A5]: ["MAPICI-ASE5-1-001"] } };
const STATUS = { schema: 1, written_at: "2026-11-12T06:00:00Z", rows: [] };

function load(hash) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window, calls = [];
  const bag = () => { const o = {}; return { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; }, _o: o }; };
  Object.defineProperty(w, "localStorage", { value: bag(), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(), configurable: true });
  const files = { "kb/exhibits_related.json": RELATED, "kb/exhibits_adoption.json": ADOPTION, "library/adopt/adopt_ai.json": AI,
    "kb/credential_title_moves.json": MOVES, "kb/reference/map_cpl_opportunities_verified.json": VERIFIED, "kb/status/commons.json": STATUS };
  w.fetch = function (url, init) {
    calls.push([String(url), (init && init.method) || "GET"]);
    const hit = files[String(url)];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  [SESSION, LINKS, PROGRESS, SRC, COMMONS].forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, calls, M: w.CPL_COMMONS, A: w.CPL_COMMONS_ASE };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }
function reported(x) { x.w.CPL_SESSION.stashReturnTab("commons"); return (JSON.parse(x.w.localStorage.getItem("cpl_sb_return_tab")) || {}).tab; }
function row(x, college) { return x.d.querySelector('#cas-colleges tr[data-college="' + college + '"]'); }
function titlesListed(x) { return Array.from(x.d.querySelectorAll(".cas-table tbody tr[data-title]")).map((r) => r.getAttribute("data-title")); }

(async function () {
  // ── static ──
  const css = SRC.slice(SRC.indexOf("var CSS = ["), SRC.indexOf("].join(", SRC.indexOf("var CSS = [")));
  check("static: the injected CSS names no raw hex color and uses the tab's --cmn tokens", !/#[0-9a-fA-F]{3,8}\b/.test(css) && /var\(--cmn-link\)/.test(css));
  check("static: a scrolling table sits in a labeled region; th scope on every header", /role: "region", "aria-label"/.test(SRC) && !/el\("th", \{ (?!scope)/.test(SRC));
  check("static: the slice holds no resolver of its own: it calls CPL_MAP_LINKS.nowTitle and never reads a rename snapshot",
    /nowTitle\(mv\.moves/.test(SRC) && !/alias_map|cred_rename_out/.test(SRC));
  check("static: no write path: no POST, no rpc, no kb_curation, no storage", !/method:\s*"POST"|\/rpc\/|kb_curation|localStorage|sessionStorage/.test(SRC));
  check("static: American spelling", !/\b(colour|behaviour|organisation|analyse|centre|catalogue|whilst|amongst)\b/i.test(SRC));

  // ── (3) the overview's address ──
  const o = load("#commons/ase");
  await o.M.boot(); await settle();
  check("address 1: #commons/ase opens the slice's overview", txt(o.d.querySelector("#cas-h")) === "Where your ASE certification can count");
  check("address 2: the overview reports commons/ase", reported(o) === "commons/ase");

  // ── (2) scope by the issuer on the title ──
  const listed = titlesListed(o);
  check("issuer 1 ⭐: the overview lists the ASE-issued titles in the reference", listed.indexOf(A5) >= 0 && listed.indexOf(BUNDLE) >= 0);
  check("issuer 2 ⭐: a colleges-issued title whose exhibits ASE assessed stays out", listed.indexOf(STD) < 0 && txt(o.d.querySelector(".cas-table")).indexOf(STD) < 0);
  check("issuer 3: a title only proposed stays out", listed.indexOf("Proposed Brakes (ASE A5)") < 0 && listed.length === 2);
  // ── (1) a retired key ──
  check("rename 1 ⭐: a stored key a rename moved is counted under its live title, and the old title is never listed",
    listed.indexOf(OLD) < 0 && txt(o.d.querySelector('tr[data-title="' + BUNDLE + '"]')).indexOf("1") >= 0
    && txt(o.d.querySelector('tr[data-title="' + BUNDLE + '"] td')) === "1");
  check("top line: the share of pairs with an answer, from 2 titles x 4 colleges",
    /^50% of the 8 pairs/.test(txt(o.d.querySelector("#cas-top"))) && /2 list credit, 2 a likely match, 4 no answer yet/.test(txt(o.d.querySelector("#cas-top"))));

  // a pick from the overview reports its own address
  o.d.querySelector('a[data-cas-go="' + A5 + '"]').click();
  check("address 3: a pick draws the credential and reports commons/ase/<title>",
    txt(o.d.querySelector("#cas-h")) === A5 && reported(o) === "commons/ase/" + encodeURIComponent(A5) && o.w.location.hash === "#commons/ase/" + encodeURIComponent(A5));

  // ── the credential view ──
  check("issuer 4 ⭐: the issuer line names the title's issuer", txt(o.d.querySelector("#cas-issuer")) === "Issued by " + ASE + ".");
  const paths = txt(o.d.querySelector("#cas-paths"));
  check("issuer 5 ⭐: each path names its assessor; credit by exam is the college's, the certificate the issuer's",
    paths.indexOf("10 by industry certification (assessed by " + ASE + ")") >= 0 && paths.indexOf("1 by credit by exam (assessed by the college)") >= 0
    && paths.indexOf("11 local exhibits") >= 0);
  check("issuer 6: Delta's credit under the colleges' standards title does not show under the ASE title", row(o, "Delta College").getAttribute("data-state") === "none");
  const al = row(o, "Alpha College");
  check("state 1: a college that lists credit says so, with units and the course, and its MAP source with a read date",
    al.getAttribute("data-state") === "credit" && /3 units: AUTO 54 \(3 hours in Brakes\)\./.test(txt(al))
    && /Source: MAP's articulations, read Nov 12, 2026\./.test(txt(al))
    && al.querySelector('a[href*="Exhibit=MAPICI-ASE5-1-001"]') && txt(al.querySelector("a")) === "See it in MAP");
  const ga = row(o, "Gamma College"), be = row(o, "Beta College");
  check("state 2: CPL-AI's tier 1 reads Strong, with its reason and source",
    ga.getAttribute("data-state") === "likely" && ga.querySelector(".cas-level").getAttribute("data-level") === "strong"
    && /CPL-AI rated AUTO 9 \(Brakes II\) against ASE Certification A5: Brakes: 7 of 8 skill areas matched, strong evidence\./.test(txt(ga))
    && /CPL-AI's ratings, read Nov 7, 2026/.test(txt(ga)));
  check("state 3: the same common course is one identity signal, Partial, above CPL-AI's Limited; both reasons show",
    be.querySelector(".cas-level").getAttribute("data-level") === "partial" && be.querySelectorAll("[data-reason]").length === 2
    && /Teaches AT 110, in the same common course/.test(txt(be)) && /limited evidence/.test(txt(be)));
  check("state 4: the rows run lists credit, then likely by level, then no answer yet",
    Array.from(o.d.querySelectorAll("#cas-colleges tbody tr")).map((r) => r.getAttribute("data-college")).join(",") === "Alpha College,Gamma College,Beta College,Delta College");
  // a figure opens what it counts
  const fig = o.d.querySelector('button.cas-fig[data-show="likely"]');
  check("figure 1: the figure word carries its count", txt(fig) === "Likely match: 2");
  fig.click();
  check("figure 2: it opens the colleges it counts, and only those", Array.from(o.d.querySelectorAll("#cas-colleges tbody tr")).map((r) => r.getAttribute("data-state")).join(",") === "likely,likely"
    && fig.getAttribute("aria-pressed") === "true");
  check("figure 3: the filter is no part of the address", reported(o) === "commons/ase/" + encodeURIComponent(A5));

  // ── (5) the stamp, the ask and the gaps ──
  const page = txt(o.d.querySelector("#commons-root"));
  check("words 1: a best-effort stamp with read dates, and faculty decide", /^Best effort\./.test(txt(o.d.querySelector("#cas-stamp"))) && /faculty decide whether to award credit/.test(page));
  check("words 2: the page never says credit is awarded", !/\bawarded\b|you (will )?(get|receive) credit/i.test(page));
  check("words 3 ⭐: Request CPL Review is linked nowhere, and named as a gap",
    !Array.from(o.d.querySelectorAll("a")).some((a) => /Request CPL Review/i.test(txt(a))) && /Request CPL Review: no table we hold says which colleges have it on/.test(txt(o.d.querySelector("#cas-gaps"))));
  check("words 4: the gaps are counted from what was read", /1 of 2 ASE certifications have no CPL-AI rating/.test(txt(o.d.querySelector("#cas-gaps")))
    && /1 of 2 listed credits have no MAP exhibit page found/.test(txt(o.d.querySelector("#cas-gaps"))));
  check("words 5: no glyph in the rendered text", !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}✔✖▶▼]/u.test(page));
  check("no write 1: every read is a GET of a committed file", o.calls.every((c) => c[1] === "GET" && !/supabase|\/rest\/|\/rpc\//.test(c[0])));
  check("no write 2: nothing about the pick or the filter is stored", !Object.keys(o.w.localStorage._o).some((k) => /ase|filter|show|pick/i.test(k)));

  // ── (1) an address naming the retired title ──
  const r = load("#commons/ase/" + encodeURIComponent(OLD));
  await r.M.boot(); await settle();
  check("rename 2 ⭐: an address naming a retired title opens its live title", txt(r.d.querySelector("#cas-h")) === BUNDLE
    && txt(r.d.querySelector("#commons-root")).indexOf(OLD) < 0);
  check("rename 3 ⭐: the credit stored under the old key shows under the live title", r.d.querySelector('#cas-colleges tr[data-college="Gamma College"]').getAttribute("data-state") === "credit");
  check("rename 4: the view reports, and the address carries, the live title", reported(r) === "commons/ase/" + encodeURIComponent(BUNDLE)
    && r.w.location.hash === "#commons/ase/" + encodeURIComponent(BUNDLE));

  // an unknown title leaves the overview with a note
  const u = load("#commons/ase/" + encodeURIComponent("Not A Cert"));
  await u.M.boot(); await settle();
  check("address 4: an unknown title opens the overview and says so", txt(u.d.querySelector("#cas-h")) === "Where your ASE certification can count"
    && /No ASE certification in the reference is named Not A Cert/.test(txt(u.d.querySelector(".cas-note"))) && reported(u) === "commons/ase");

  // a later visit on the bare #commons draws the first view; one on #commons/ase draws the slice again
  r.w.history.replaceState(null, "", "#commons");
  r.w.dispatchEvent(new r.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } }));
  await settle();
  check("address 5: a later visit on #commons draws the Commons' first view, with the line that opens the slice",
    !r.d.querySelector("#cas-h") && r.d.querySelector('#cmn-ase-line a[href="#commons/ase"]') && reported(r) === "commons");
  r.w.history.replaceState(null, "", "#commons/ase/" + encodeURIComponent(A5));
  r.w.dispatchEvent(new r.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } }));
  await settle();
  check("address 6: a later visit on #commons/ase/<title> draws that credential", txt(r.d.querySelector("#cas-h")) === A5);

  const failed = results.filter((x) => !x[1]);
  results.forEach((x) => console.log((x[1] ? "PASS " : "FAIL ") + x[0]));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
