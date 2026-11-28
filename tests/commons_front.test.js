// The CPL Commons front page (commons_front.js, opened by commons.js on the bare #commons; #3533, Sam's go Nov 19,
// 2026, relayed by COBIx in comment 7006930860).
//
// WHAT THIS GUARDS (each a way the page can mislead the person reading it at a conference table):
//   (1) ⭐ figures disagree across the page (S490): the programs figure on the widget, the Programs card and the
//       Colleges card's "left to finish" are one model value; the projected date is the pace rule applied to the
//       committed series, recomputed here, never a stored date;
//   (2) ⭐ the 30 daily bars rebuilt from the live files: thirty days ending on the last headline day, each
//       program bar the day's rise in complete, each skills bar that day's harvested_on credentials;
//   (3) the page in its order, the nine cards with their fold keys, the Courses data card's id, the labels plain
//       nouns (none opens on What, When, How or Why, none is a question);
//   (4) ⭐ the fold: cplCommons.fold.v1 holds the collapsed keys ([] all expanded); Collapse all / Expand all reads
//       right; the earlier view's order and fold move once to their own keys and cplCommons.order.v1 is removed;
//   (5) the load-error notice still fires when the status file cannot be read;
//   (6) the old #commons/data links: tabs.js rewrites them to #collect and folds #collect into the tab; the
//       First Light greeting skips the Commons; tokens only (raw hex only in the token block).
//
// Run from repo root: `npm test` (or `node tests/commons_front.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const PROGRESS = fs.readFileSync("commons_progress.js", "utf8");
const COMMONS = fs.readFileSync("commons.js", "utf8");
const SRC = fs.readFileSync("commons_front.js", "utf8");
const PRG = fs.readFileSync("commons_program_records.js", "utf8");
const TABS = fs.readFileSync("tabs.js", "utf8");
const FL = fs.readFileSync("first_light.js", "utf8");
const FILES = {
  "kb/status/commons.json": JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")),
  "kb/status/program-requirements.json": JSON.parse(fs.readFileSync("kb/status/program-requirements.json", "utf8")),
  "kb/status/commons_data.json": JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8")),
  "kb/reference/industry_credential_skills.json": JSON.parse(fs.readFileSync("kb/reference/industry_credential_skills.json", "utf8"))
};

function load(hash, opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window;
  const o = {};
  Object.assign(o, opts.store || {});
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }, configurable: true });
  const files = Object.assign({}, FILES, opts.files || {});
  w.fetch = function (url) {
    const hit = files[String(url)];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  [PROGRESS, PRG, SRC, COMMONS].forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, F: w.CPL_COMMONS_FRONT, store: o };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }
function dnum(s) { const p = String(s).split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000; }
function longDate(n) { return new Date(n * 86400000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }); }
const fmt = (n) => Number(n).toLocaleString("en-US");

(async function () {
  const x = load("#commons");
  await x.M.boot(); await settle();
  const d = x.d;

  // (3) the page in its order
  check("⭐ the bare #commons draws the CPL Commons front page", txt(d.querySelector("#cmf-h")) === "CPL Commons");
  check("Sam's lede, exactly", /^Workspace to collect, curate, and connect common datasets: catalogs with program and course requirements, PLOs, SLOs, objectives, and attributes; CPL credentials and exhibits with credit recommendations and skills; and connections to the related datasets and platforms needed to clarify paths, in one integrated statewide view\.$/.test(txt(d.querySelector(".cmf .cmn-lede"))));
  const order = Array.from(d.querySelectorAll(".cmf > *")).map((n) => n.className.split(" ")[0]);
  check("top to bottom: header, the widget, Needs you, the groups, Building, More collection detail, the scorecard line",
    order.join(",") === "cmn-top,cmf-eta,cmf-needs,cmf-groups,cmf-planrow,cmf-line,cmf-line,cmf-line");
  check("no Pierce and no transcribed units on the page", !/Pierce|transcribed/i.test(txt(d.querySelector(".cmf"))));
  const keys = Array.from(d.querySelectorAll(".cmf-card")).map((c) => c.getAttribute("data-key"));
  check("⭐ eleven cards with their fold keys, in Collect / Curate / Connect order, then the Plan (Sam, 2026-11-21, items 4, 5 and 8)", keys.join(",") === "colleges,programs,courses-data,cdc,subjects,courses,exhibit,credentials,cr,interconnect,plan");
  check("the groups are Collect, Curate and Connect", Array.from(d.querySelectorAll(".cmf-group-h")).map(txt).join(",") === "Collect,Curate,Connect");
  check("the Courses data card carries id courses-data", d.getElementById("courses-data") && d.getElementById("courses-data").getAttribute("data-key") === "courses-data");
  const labels = Array.from(d.querySelectorAll(".cmf h2, .cmf h3, .cmf h4, .cmf summary, .cmf button, .cmf-links a")).map(txt);
  check("⭐ no label opens on What, When, How or Why, and none is a question", labels.length > 20 && labels.every((l) => !/^(what|when|how|why)\b/i.test(l) && !/\?$/.test(l)));
  check("no bare issue number in the visible text", !/#\d{3,}/.test(txt(d.querySelector(".cmf"))));
  check("the Credit Recommendations card links to #cr-reference and does not embed it", d.querySelector('.cmf-card[data-key="cr"] .cmf-links a[href="#cr-reference"]') && !d.querySelector("#tab-commons script[src*=cr_reference]"));
  check("Name-check groups is linked once, in the link row", Array.from(d.querySelectorAll('a[href="#cr-reference/names"]')).length === 1);
  check("Interconnectivity keeps an empty, reserved link row", d.querySelector('.cmf-card[data-key="interconnect"] .cmf-links') && !d.querySelector('.cmf-card[data-key="interconnect"] .cmf-links a'));
  /* S723: the five "ruled" cards held no ruling (Sam: "I don't remember anything about those rulings..."), so the card
     no longer points at a Backfill fix; the doubt list is a check of its own. */
  check("the Courses and M-IDs card claims no Backfill fix, and carries the doubt list as a check", !/Backfill fix|already ruled/.test(txt(d.querySelector('.cmf-card[data-key="courses"]')))
    && !!d.querySelector('.cmf-card[data-key="courses"] .cmf-check[data-ref="doubt"] .cmf-act a[href="#coci-lookup/list/doubt"]'));

  // (1) one model, figures agree
  const PR = FILES["kb/status/program-requirements.json"].headline.filter((r) => typeof r.complete === "number");
  const last = PR[PR.length - 1], lastN = dnum(last.day);
  const at = (n) => { for (let i = 0; i < 8; i++) { const r = PR.find((h) => dnum(h.day) === n - i); if (r) return r.complete; } return null; };
  const pace = (at(lastN) - at(lastN - 7)) / 7, left = last.active - x.F.ASKED.cociOnly - last.complete - (last.gaps_noted || 0); // gaps noted count as collected (r-eta-gaps-noted-count-collected-sam-2026-11-28)
  const want = longDate(lastN + Math.ceil(left / pace));
  check("⭐ the Data Collection Phase 1 date is the 7-day pace rule on the committed series (" + want + "), labeled estimated", txt(d.querySelector(".cmf-date-v")) === want + " estimated");
  const pair = fmt(last.complete) + " of " + fmt(last.active);
  check("⭐ S490: the widget's notes and the Programs card show the same pair", txt(d.querySelector(".cmf-date .cmf-more-body")).indexOf(pair + " Active programs are complete") >= 0
    && txt(d.querySelector('.cmf-card[data-key="programs"] .cmf-big')) === pair);
  /* COBIx's review of #3554: one "left to finish" on the page, the target's (active minus the COCI-only programs minus complete). */
  check("S490: the Colleges card's programs left to finish is the same target-based figure the date uses", txt(d.querySelector('.cmf-card[data-key="colleges"] .cmf-body')).indexOf("about " + fmt(left) + " Active programs in current catalogs left") >= 0
    && txt(d.querySelector('.cmf-card[data-key="programs"] .cmf-more-body')).indexOf("about " + fmt(left) + " remain") >= 0);
  check("no link opens #credentials, which is no route", !d.querySelector('a[href="#credentials"]') && d.querySelector('.cmf-card[data-key="credentials"] .cmf-links a[href="#exhibits/list"]'));
  check("the Data Collection line says program records set its date", /^Set by program records:/.test(txt(d.querySelector(".cmf-date .cmf-date-n"))));
  /* The held line draws only while titles are held (the 2026-11-23 CER run held none, and the line left the card), so the
     check reads the line where it is and asks only for no lone owner line where it is not. */
  const heldLine = Array.from(d.querySelectorAll(".cmf-need p")).find((p) => /held for a person/.test(txt(p)));
  check("the curator owner trails the held titles' line, never a paragraph of its own", !Array.from(d.querySelectorAll(".cmf-need p")).some((p) => txt(p) === "· a curator")
    && (!heldLine || /held for a person.*· a curator$/.test(txt(heldLine))));
  check("no card carries a fixed tall minimum in the CSS", !/\.cmf-card \{[^}]*min-height:\s*44rem/.test(SRC));
  check("the Data Curation line reads an estimated date or TBA, never Not dated yet", /^(\w+ \d+, \d{4} estimated|TBA)$/.test(txt(d.querySelectorAll(".cmf-date-v")[1])) && !/Not dated yet/.test(txt(d.querySelector(".cmf-eta"))));

  // (2) the daily chart's table
  const rows = Array.from(d.querySelectorAll(".cmf-table tbody tr"));
  check("⭐ thirty daily rows ending on the last headline day", rows.length === 30 && txt(rows[29].querySelector("th")) === new Date(lastN * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }));
  const byDay = {}; PR.forEach((h) => { byDay[dnum(h.day)] = h.complete; });
  const rise = byDay[lastN] != null && byDay[lastN - 1] != null ? fmt(Math.max(0, byDay[lastN] - byDay[lastN - 1])) : "no count";
  check("each day's program records is the day's rise in complete", txt(rows[29].querySelectorAll("td")[0]) === rise);

  // (4) the fold
  const all = d.getElementById("cmf-all");
  check("the header word reads Collapse all with nothing folded, and the fold key is []", txt(all) === "Collapse all" && x.store["cplCommons.fold.v1"] === "[]");
  d.querySelector('.cmf-card[data-key="cr"] .cmf-fold').click();
  check("⭐ one card folded: the key holds it, the card shows only its title and number", x.store["cplCommons.fold.v1"] === '["cr"]'
    && d.querySelector('.cmf-card[data-key="cr"]').classList.contains("cmf-folded") && txt(d.querySelector('.cmf-card[data-key="cr"] .cmf-fold')) === "Expand");
  all.click();
  check("Collapse all folds every card and the word reads Expand all", JSON.parse(x.store["cplCommons.fold.v1"]).length === 11 && txt(all) === "Expand all");
  all.click();
  check("Expand all opens every card and stores []", x.store["cplCommons.fold.v1"] === "[]" && txt(all) === "Collapse all");

  const m = load("#commons", { store: { "cplCommons.order.v1": '["exhibit","requirements"]', "cplCommons.fold.v1": '["cr"]' } });
  await m.M.boot(); await settle();
  check("⭐ migration: the earlier view's order and fold move to their own keys, order.v1 is removed, fold.v1 starts at []",
    m.store["cplCommons.detailsOrder.v1"] === '["exhibit","requirements"]' && m.store["cplCommons.detailsFold.v1"] === '["cr"]'
    && !("cplCommons.order.v1" in m.store) && m.store["cplCommons.fold.v1"] === "[]" && m.store["cplCommons.front.v1"] === "1");
  const k = load("#commons", { store: { "cplCommons.front.v1": "1", "cplCommons.fold.v1": '["programs","nope"]' } });
  await k.M.boot(); await settle();
  check("a kept fold applies after the migration, unknown keys ignored", k.d.querySelector('.cmf-card[data-key="programs"]').classList.contains("cmf-folded")
    && k.d.querySelectorAll(".cmf-card.cmf-folded").length === 1);

  // (5) the load-error notice
  const e = load("#commons", { files: { "kb/status/commons.json": null } });
  await e.M.boot(); await settle();
  check("⭐ the load-error notice fires when the status file cannot be read", /The Commons’ figures could not be read|The Commons' figures could not be read/.test(txt(e.d.getElementById("commons-root"))));

  // (6) addresses, the greeting, tokens
  check("tabs.js folds #collect into the Commons tab and rewrites #commons/data to #collect", /'collect': \['commons', 'collect'\]/.test(TABS) && /\^commons\\\/data\(\\\/\.\*\)\?\$/.test(TABS) && /'#collect' \+/.test(TABS));
  check("the earlier first view stays at #commons/details", /a\[0\] === "details"/.test(COMMONS));
  check("First Light does not greet on the Commons", /function onCommons\(\)/.test(FL) && /if \(onCommons\(\)\) return;/.test(FL));
  const hexLines = SRC.split("\n").filter((l) => /#[0-9A-Fa-f]{6}\b/.test(l) && !/^\s*\/\//.test(l));
  check("raw hex only in the token block", hexLines.every((l) => /--cmf-[a-z-]+:#/.test(l)));
  check("the module is on the Pages allowlist", /^publish commons_front\.js$/m.test(fs.readFileSync(".github/pages_allowlist.txt", "utf8")));
  check("no write path", !/method:\s*"(POST|PATCH|PUT|DELETE)"|\/rpc\//.test(SRC));
  check("American spelling", !/\b(colour|behaviour|organisation|analyse|centre|catalogue|whilst|amongst)\b/i.test(SRC));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0]));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
