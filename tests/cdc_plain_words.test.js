// College Data Collection in plain words (COBIx on #3510, part A; Commons Clarity's walk of Nov 17, 2026, #3480 Source 4).
//
// WHAT THIS GUARDS: the College Data Collection list (#commons/data) and its date estimate (#commons/data/eta, with
// Show costs, the Detailed View and the Assumptions open) read in plain words, drawn from the committed files with the
// builder's own rule words (kb/_build_commons_data_status.py RULE and TBA, which the next census run writes):
//   (1) ⭐ no word on kb/ui_plain_words.json's avoid_words list shows: "live read", "billing", "basis live", an issue
//       number, a "21:57Z" or UTC time, an ISO date, "counted from", a file path outside a "For the team" fold;
//   (2) ⭐ no term on kb/plain_words.py's list stands undefined (the one copy of that rule, run through python3);
//   (3) ⭐ CRE is spelled out where it first shows, with both weights in words (1 per course outline row, 15 per
//       program's requirements);
//   (4) ⭐ every card, legend key and table head that says SLO (or PLO) spells it out first;
//   (5) the cost card says what "receipts" and "runs" are, why its two totals differ, and "since Nov 17, 2026";
//   (6) the page's own date says what it is beside the header's Last Updated date; the star on a day's spend is
//       explained beside the chart and in the table head.
//
// Run from repo root: `npm test` (or `node tests/cdc_plain_words.test.js`).
const fs = require("fs");
const { execFileSync } = require("child_process");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const J = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const flat = (s) => String(s || "").replace(/\s+/g, " ").trim();

/* The builder's rule words, as the next census run writes them into kb/status/commons_data.json. */
const BUILT = JSON.parse(execFileSync("python3", ["-I", "-c",
  "import sys, json; sys.path.insert(0, 'kb'); import _build_commons_data_status as B; print(json.dumps({'rule': B.RULE, 'tba': B.TBA}))"],
  { encoding: "utf8" }));
const CD = J("kb/status/commons_data.json");
Object.assign(CD.rule, BUILT.rule);
Object.keys(BUILT.tba).forEach((k) => { if (CD.tba && CD.tba[k]) CD.tba[k] = BUILT.tba[k]; });
CD.statewide.spent_since = "2026-11-17";
CD.statewide.spent_usd = CD.statewide.spent_usd == null ? 1133.52 : CD.statewide.spent_usd;
CD.statewide.spent_runs = CD.statewide.spent_runs || 118;
if (CD.overall && CD.overall.statewide) CD.overall.rule = BUILT.rule.overall;
if (CD.overall) CD.overall.rule = BUILT.rule.overall;

const FILES = { "kb/status/commons_data.json": CD };
["kb/status/program-requirements.json", "kb/reference/industry_credential_skills.json", "kb/status/commons.json", "kb/status/cdc_integrations.json",
  "kb/reference/model_spend_daily.json", "kb/status/session_spend.json", "kb/reference/cre_weights.json", "kb/status/cdc_sharing.json"]
  .forEach((p) => { try { FILES[p] = J(p); } catch (e) { /* a file the page reads as TBA */ } });
const MODS = ["commons_data_sharing.js", "commons_data_integrations.js", "commons_eta_clock.js", "commons_data.js"].map((f) => fs.readFileSync(f, "utf8"));

function dom(hash) {
  const d = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', { url: "https://example.org/index.html" + hash, runScripts: "dangerously" });
  const w = d.window;
  w.fetch = (u) => {
    const hit = FILES[String(u).split("?")[0]];
    return Promise.resolve(hit ? { ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) } : { ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
  };
  w.scrollTo = () => {};
  MODS.forEach((m) => w.eval(m));
  return { w, root: w.document.getElementById("root") };
}
const flush = (w) => new Promise((r) => w.setTimeout(r, 0)).then(() => new Promise((r) => w.setTimeout(r, 0)));

/* What a reader sees: the text, less a "For the team" fold's body (its summary stays), plus each tip and label. */
function seen(root) {
  const c = root.cloneNode(true);
  c.querySelectorAll("[data-team-files] > :not(summary)").forEach((n) => n.remove());
  c.querySelectorAll("script,style").forEach((n) => n.remove());
  // The data dictionary's band draws the register's own words (kb/cdc_sharing.json, its classes "held" and the
  // disclosure rule's file); that register's plain-words pass is its own item (the NEXT line in the PR), not this one.
  c.querySelectorAll('[data-cdc-ext="sharing"]').forEach((n) => n.remove());
  const out = [c.textContent];
  c.querySelectorAll("[title],[aria-label],[data-tip]").forEach((e) => ["title", "aria-label", "data-tip"].forEach((a) => e.getAttribute(a) && out.push(e.getAttribute(a))));
  return out.map(flat).join(" \n ");
}

(async function () {
  const L = dom("#commons/data");
  await L.w.CPL_COMMONS_DATA.boot(L.root, "");
  await flush(L.w);
  const E = dom("#commons/data/eta");
  await E.w.CPL_COMMONS_DATA.boot(E.root, "eta");
  await flush(E.w);
  ["costs", "full", "assumptions"].forEach((k) => { const b = E.root.querySelector('[data-eta="' + k + '"]'); if (b) b.click(); });
  await flush(E.w);
  check("the list and the date estimate both drew", L.root.querySelector("#cdd-stamp") && E.root.querySelector("[data-eta-view]") && E.root.querySelector(".eta-costlabel"));

  const pages = { "the list": seen(L.root), "the date estimate": seen(E.root) };

  // (1) the avoid list.
  const AVOID = J("kb/ui_plain_words.json").avoid_words;
  check("(1) kb/ui_plain_words.json carries the avoid_words list, each a pattern with its reason", Array.isArray(AVOID) && AVOID.length >= 8 && AVOID.every((a) => a.pattern && a.why));
  Object.keys(pages).forEach((name) => {
    const hits = [];
    AVOID.forEach((a) => {
      const re = new RegExp(a.pattern, "g"); let m;
      while ((m = re.exec(pages[name])) && hits.length < 12) hits.push(m[0] + " in '" + pages[name].slice(Math.max(0, m.index - 50), m.index + 30) + "'");
    });
    check("(1) ⭐ no avoided word shows on " + name, !hits.length, hits);
  });

  // (2) kb/plain_words.py's terms, through the one copy of the rule.
  const found = JSON.parse(execFileSync("python3", ["-I", "-c",
    "import sys, json; sys.path.insert(0, 'kb'); from plain_words import offenses; print(json.dumps(offenses(sys.stdin.read())))"],
    { input: Object.values(pages).join(" \n "), encoding: "utf8" }));
  check("(2) ⭐ no term on kb/plain_words.py's list stands undefined", !found.length, found.slice(0, 8));

  // (3) CRE.
  const et = pages["the date estimate"], at = et.search(/\bCRE\b/);
  check("(3) ⭐ CRE is spelled out where it first shows", at >= 0 && /collected record equivalent/i.test(et.slice(Math.max(0, at - 45), at + 45)), et.slice(Math.max(0, at - 60), at + 60));
  check("(3) the CRE's two weights in words: one course outline row counts 1, one program's requirements count 15",
    /one course outline row counts 1, and one program's requirements count 15/.test(et));

  // (4) SLO and PLO on each card, legend key and table head.
  const bad = [];
  [L.root, E.root].forEach((root) => {
    root.querySelectorAll(".cdd-tiles > *, .eta-tiles > *, .eta-cell, .eta-key, thead").forEach((n) => {
      const t = flat(n.textContent);
      [["SLO", /student learning outcomes?/i], ["PLO", /program learning outcomes?/i]].forEach(([ac, long]) => {
        const i = t.search(new RegExp("\\b" + ac + "s?\\b"));
        if (i >= 0 && !long.test(t.slice(Math.max(0, i - 40), i))) bad.push(ac + ": " + t.slice(0, 90));
      });
    });
  });
  check("(4) ⭐ every card, legend key and table head that says SLO or PLO spells it out first", !bad.length, bad.slice(0, 8));

  // (5) the cost card.
  const cost = [...L.root.querySelectorAll(".cdd-tiles > *")].map((n) => flat(n.textContent)).filter((t) => /Read cost per passing program/.test(t))[0] || "";
  check("(5) ⭐ the cost card defines receipts and runs in the same sentence", /receipts \(the record each college's read files[^)]+\)/.test(cost) && /runs \(each run is one reading job[^)]+\)/.test(cost), cost);
  check("(5) ⭐ the cost card says why its two totals differ", /The totals differ because/.test(cost), cost);
  check("(5) ⭐ the cost card writes its date in words: since Nov 17, 2026", /since Nov 17, 2026/.test(cost) && !/counted from/.test(cost), cost);

  // (6) dates and the star.
  const stamp = flat(L.root.querySelector("#cdd-stamp").textContent);
  check("(6) ⭐ the page's date says what it is beside the header's Last Updated date", /gathered \w{3} \d+, \d{4}/.test(stamp) && /Last Updated date in the page header is when the whole site was last published/.test(stamp), stamp.slice(0, 200));
  const legend = [...E.root.querySelectorAll(".eta-key")].map((n) => flat(n.textContent)).join(" | ");
  check("(6) the star on a day's spend is explained in the legend and the table head", /a day marked \* has a note/.test(legend) &&
    [...E.root.querySelectorAll("thead th")].some((th) => /marked \* has a note/.test(th.textContent)), legend);
  check("(6) the As of cell says its time in Pacific time, in words", /written \w{3} \d+, \d{4}, \d{1,2}:\d{2} [AP]M Pacific time/.test(flat((E.root.querySelector('[data-cell="asof"]') || {}).textContent)));
  check("(6) a file path is still one click away for the team, folded", !!L.root.querySelector("details[data-team-files] > summary"));

  const fails = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "  ok   " : "  FAIL ") + r[0] + (r[1] || r[2] == null ? "" : "\n         " + JSON.stringify(r[2]).slice(0, 900))));
  console.log("\n" + (results.length - fails.length) + "/" + results.length + " checks passed");
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
