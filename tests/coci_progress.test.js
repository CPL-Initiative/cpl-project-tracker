// COCI Lookup's Progress view (S559, 2026-11-03): the Common Course Reference's opened page, the CPL Commons
// mock's shape drawn by commons_page.js, the last reference to take it. Guards:
//   - the view's word sits first in the row; the tab still opens on the Courses List;
//   - #coci-lookup/progress opens the page;
//   - the page reads the Commons' own row (kb/status/commons.json, key "course") and its run log, so the headline
//     is the Commons card's pair (ready of the auditor's cards) and the two pages cannot disagree;
//   - Needs attention: needs repair, then the row's issues, an Open SkyView each; the run log's next step;
//   - the three questions count cards free of one auditor tag over the one denominator;
//   - a failed read says Could not be read, never a zero; without the renderer the view says so;
//   - a person's confirmation (Sheet 160) is a row beside ready, never the headline; Could not be read without it;
//   - the builder writes the tags the page reads, and the confirmed count from the curation overlay.
//
// Run from repo root: `npm test` (or `node tests/coci_progress.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(n) { return (n && n.textContent || "").trim(); }

const SRC = fs.readFileSync("coci_lookup.js", "utf8");
const PAGE = fs.readFileSync("commons_page.js", "utf8");
const BUILDER = fs.readFileSync("kb/_build_commons_status.py", "utf8");

const COMMONS = {
  written_at: "2026-11-03T06:30:00Z",
  rows: [{ key: "exhibit", pair: [{ n: 1, of: 2 }] }, {
    key: "course", tab: "https://cpl-initiative.github.io/cpl-project-tracker/prototype/skyview.html",
    status_file: "kb/status/course.json",
    pair: [{ n: 3205, of: 27581 }],
    issues: [
      { n: 14523, words: "cards carry a discipline no seed has touched, capped at 0.79", owner: "the Common Subjects reference" },
      { n: 0, words: "unit anomalies", owner: "a curator" },
      { n: 5750, words: "blank descriptions", owner: "the colleges' COCI entries" }],
    procedures: [{ n: 16478, words: "identities and 33,418 stand-alone courses on the canvas" }],
    facts: { total: 27581, ready: 3205, needs_review: 17036, needs_repair: 7335, not_ready: 5, confirmed: 812, confirmed_ready: 126,
      tags: { blank_description: 5750, discipline_title_mismatch: 1116, blank_discipline: 89,
        seed_untouched_discipline: 14523, top_discipline_disagreement: 1159, unit_anomaly: 4179 } } }],
};
const RUNLOG = { written_at: "2026-11-02T01:20:14Z", calls: [],
  next_step: { title: "The List norms on the Courses List", text: "The engine's suggest slot comes next." },
  changes: [{ text: "COCI Lookup's Courses view is the Courses List. More words." }] };

function makeDom(opts) {
  opts = opts || {};
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <div id="tab-coci-lookup"><div id="coci-lookup-root">Loading</div></div></body></html>`,
  { runScripts: "dangerously", url: "https://example.org/" + (opts.hash || "") });
  const { window } = dom;
  window.CPL_COCI_LOOKUP = { _built_at: "2026-11-01", colleges: ["A"], rows: [[0, "C1", "ENGL", "1", "Comp", 3, "C", "", "", "", ""]] };
  window.CPL_TABS = {
    loadScript: function (p, g, cb) {
      if (p === "commons_page.js" && !opts.noPage) window.eval(PAGE);
      if (p === "commons_list.js") { /* the List is guarded elsewhere; leave it unloaded */ }
      setTimeout(cb, 0);
    },
  };
  window.fetch = function (url) {
    url = String(url);
    if (/kb\/status\/commons\.json/.test(url)) {
      if (opts.failCommons) return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve(null) });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(opts.commons || COMMONS) });
    }
    if (/kb\/status\/course\.json/.test(url)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(RUNLOG) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  };
  window.eval(SRC);
  window.CPL_COCI_LOOKUP_TAB.activate();
  return window;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const btn = (doc, re) => Array.from(doc.querySelectorAll("button")).find((b) => re.test(txt(b)));

(async () => {
  // ── the views row; the tab opens on the List ──
  let w = makeDom();
  let doc = w.document;
  const words = Array.from(doc.querySelectorAll(".cplcoci-viewseg button")).map(txt);
  check("the views row reads Progress, Courses, Programs", words.join("|") === "Progress|Courses|Programs");
  check("the tab still opens on the Courses List", w.CPL_COCI_LOOKUP_TAB._state.view === "courses");
  btn(doc, /^Progress$/).click();
  await sleep(20);
  const page = doc.querySelector("#cplcoci-progress .cplcoci-pg-page");
  check("Progress draws the opened page", !!page);
  const t = txt(page);
  check("the headline is the Commons card's pair", /3,205 of 27,581 common-course cards the auditor scores 0\.85 or better/.test(t));
  check("the bar names its share", !!page.querySelector('[aria-label="12 percent ready"]'));
  check("the read time is Pacific", /Figures read Nov 2, 10:30 PM PT\./.test(t));
  check("Recently: the run log's first sentence", /Recently: COCI Lookup's Courses view is the Courses List\./.test(t) && !/More words/.test(t));
  check("no decisions wait", /No decisions wait on Sam\./.test(t));
  const items = Array.from(page.querySelectorAll(".cplcoci-pg-item")).map(txt);
  check("needs repair leads Needs attention", /^7,335 cards the auditor marks needs repair/.test(items[0] || ""));
  check("an issue names who fixes it", items.some((i) => /14,523 cards carry a discipline no seed has touched.*the Common Subjects reference fixes them\./.test(i)));
  check("a zero issue is left out", !items.some((i) => /unit anomalies/.test(i)));
  check("each item opens SkyView", Array.from(page.querySelectorAll(".cplcoci-pg-item a")).filter((a) => /skyview\.html$/.test(a.href)).length === 3);
  check("the team's next step from the run log", /Next for the team: The List norms on the Courses List\./.test(t));
  const qs = Array.from(page.querySelectorAll(".cplcoci-pg-groups h3")).map(txt);
  check("three questions fit a course", qs.join("|") === "What is it called?|Where does it sit?|Do its courses agree?");
  const rowText = (label) => { const r = Array.from(page.querySelectorAll(".cplcoci-pg-row")).find((x) => txt(x).indexOf(label) === 0); return txt(r); };
  check("description: cards free of the tag", /21,831 of 27,581$/.test(rowText("Carries a catalog description")));
  check("discipline confirmed: total less seed-untouched", /13,058 of 27,581$/.test(rowText("Its discipline confirmed")));
  check("TOP agrees", /26,422 of 27,581$/.test(rowText("TOP agrees")));
  check("units agree", /23,402 of 27,581$/.test(rowText("Units agree")));
  check("ready closes the third question", /3,205 of 27,581$/.test(rowText("Ready:")));
  check("a person's confirmation is counted beside ready (Sheet 160)", /812 of 27,581$/.test(rowText("Confirmed by a person in SkyView")));
  check("the confirmed line sits under the bar, beside ready (S565: all five references)",
    /812 confirmed by a person, 126 of them ready\./.test(txt(page.querySelector(".cplcoci-pg-confirmed"))));
  check("the headline stays the auditor's ready", /3,205 of 27,581 common-course cards/.test(t) && !/812 of 27,581 common-course/.test(t));
  check("the foot names the denominator", /Each count is of the 27,581 common-course cards the auditor scores\./.test(t));
  check("the List is one word away", !!btn(doc, /^Open the Courses List$/));
  btn(doc, /^Open the Courses List$/).click();
  check("Open the Courses List returns to the List", w.CPL_COCI_LOOKUP_TAB._state.view === "courses");

  // ── the deep link ──
  w = makeDom({ hash: "#coci-lookup/progress" });
  await sleep(20);
  check("#coci-lookup/progress opens the page", !!w.document.querySelector("#cplcoci-progress .cplcoci-pg-page"));

  // ── a failed read says so ──
  w = makeDom({ hash: "#coci-lookup/progress", failCommons: true });
  await sleep(20);
  const ft = txt(w.document.querySelector("#cplcoci-progress"));
  check("a failed Commons read says Could not be read", /Could not be read \(kb\/status\/commons\.json answered 404\)/.test(ft));
  check("and never a zero", !/\b0 of\b/.test(ft));
  const noTags = JSON.parse(JSON.stringify(COMMONS)); delete noTags.rows[1].facts.tags;
  w = makeDom({ hash: "#coci-lookup/progress", commons: noTags });
  await sleep(20);
  check("a row without the tags says Could not be read on the questions",
    /Carries a catalog descriptionCould not be read/.test(txt(w.document.querySelector("#cplcoci-progress"))));
  const noConf = JSON.parse(JSON.stringify(COMMONS)); delete noConf.rows[1].facts.confirmed;
  w = makeDom({ hash: "#coci-lookup/progress", commons: noConf });
  await sleep(20);
  check("a row without the confirmed count says Could not be read there",
    /Confirmed by a person in SkyView or COBICould not be read/.test(txt(w.document.querySelector("#cplcoci-progress"))));
  w = makeDom({ hash: "#coci-lookup/progress", noPage: true });
  await sleep(20);
  check("without the renderer the view says so", /commons_page\.js\) did not load/.test(txt(w.document.querySelector("#cplcoci-progress"))));

  // ── static ──
  check("the builder writes the tags the page reads", ["blank_description", "discipline_title_mismatch", "blank_discipline",
    "seed_untouched_discipline", "top_discipline_disagreement", "unit_anomaly"].every((k) => BUILDER.indexOf('"' + k + '"') >= 0) && /"tags": \{k: tags\.get\(k\)/.test(BUILDER));
  check("the builder counts a person's SkyView saves, never a cohort's", /def confirmed_cards/.test(BUILDER)
    && /kb\/coci_curation\.json/.test(BUILDER) && /not is_cohort\(v\.get\("reviewed_by"\)\)/.test(BUILDER) && /"confirmed": conf/.test(BUILDER));
  check("no raw hex in the view", !/#[0-9a-fA-F]{3,6}\b/.test(SRC.slice(SRC.indexOf("── Progress: the Common Course"), SRC.indexOf("function mkSelect"))));

  let fail = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "  ✓ " : "  ✗ ") + n); if (!ok) fail++; });
  console.log("coci_progress: " + (results.length - fail) + "/" + results.length + " checks passed");
  process.exit(fail ? 1 : 0);
})();
