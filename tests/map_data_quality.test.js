// 🩺 MAP Data Quality register — map_data_quality.js.
//   Team-gated tab: an issue list (cards) with status/severity/category chips,
//   status/category/college/search filters, add/edit form (querySelector field
//   access — never form.<name>, per the p8/title-collision lesson), a status
//   "Advance" cycle, and a "Copy for MAP devs" export. Deterministic: seed via
//   _setData, drive filters via _setFilter, no real network in the assertions.
//
// Run from repo root: `npm test` (or `node tests/map_data_quality.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const tick = () => new Promise((r) => setTimeout(r, 0));

const src = fs.readFileSync("map_data_quality.js", "utf8");
const teamSrc = fs.readFileSync("team_phrase.js", "utf8");

function makeDom() {
  return new JSDOM(`<!DOCTYPE html><html><head></head><body>
    <div id="tab-map-data-quality"><div id="mdq-root"></div></div></body></html>`,
    { runScripts: "outside-only", url: "https://example.org/" });
}

const FIXTURE = [
  { id: "a1", title: "Chaffey batch blanks (Cx & exams)", category: "blank-fields", severity: "high",
    status: "open", description: "Blank Cx + standardized-exam fields on batch uploads.", expected: "Validate required fields.",
    example_records: "student IDs TBD", affected_count: 427, college: "Chaffey College", source_report: "View_StudentAggregatedValues" },
  { id: "a2", title: "Potential Student = Yes origin lost", category: "origin-attribution", severity: "medium",
    status: "reported", description: "Boolean collapses 3 origins.", expected: "RequestOrigin enum.",
    example_records: "4 test records", affected_count: 4, college: "", source_report: "View_StudentAggregatedValues",
    reported_to: "MAP dev team", reported_at: "2026-07-26" },
  { id: "a3", title: "USMC JST eligibility inflation", category: "eligibility-inflation", severity: "high",
    status: "in_progress", description: "Skill-level CR duplication over-counts.", expected: "Dedupe CRs within an exhibit.",
    example_records: "", affected_count: null, college: "", source_report: "JST" },
  { id: "a4", title: "Old resolved thing", category: "other", severity: "low",
    status: "verified", description: "Was fixed.", expected: "", example_records: "", affected_count: null, college: "Foothill", resolution: "Fixed in MAP 2.1." },
];

function boot(dom, withPhrase) {
  const { window } = dom;
  if (withPhrase) { try { window.localStorage.setItem("cpl_team_pass", "team-secret"); } catch (e) {} }
  else { try { window.localStorage.removeItem("cpl_team_pass"); } catch (e) {} }
  window.fetch = function () { return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) }); };
  window.eval(teamSrc);
  window.eval(src);
  return window;
}

(async () => {
  // ── locked (no phrase): unlock row shows, no cards ──
  const domLocked = makeDom();
  let win = boot(domLocked, false), threw = false;
  try { win.CPL_MAP_DQ.activate(); } catch (e) { threw = true; console.error(e); }
  await tick();
  check("evaluates + activates without throwing", !threw && win.CPL_MAP_DQ);
  check("exposes seams", win.CPL_MAP_DQ && typeof win.CPL_MAP_DQ._setData === "function" &&
    typeof win.CPL_MAP_DQ._exportText === "function" && typeof win.CPL_MAP_DQ._openForm === "function");
  const lockedRoot = domLocked.window.document.getElementById("mdq-root");
  check("locked: shows the team-phrase unlock affordance", (function () {
    return !!lockedRoot.querySelector(".cpl-tp-unlock") || /unlock/i.test(lockedRoot.textContent);
  })());

  // ── unlocked: seed + render cards ──
  const dom = makeDom();
  win = boot(dom, true);
  const api = win.CPL_MAP_DQ;
  api.activate(); await tick();
  api._setData(FIXTURE);
  const doc = dom.window.document, root = doc.getElementById("mdq-root");

  check("renders the header 'MAP Data Quality'", /MAP Data Quality/.test(root.querySelector(".mdq-title h1").textContent));
  check("curate mode shown with a valid phrase", /curate mode/i.test(root.querySelector(".mdq-authbar").textContent));
  check("renders a card per issue (4)", root.querySelectorAll(".mdq-card").length === 4);
  check("meta reads 4 of 4 issues", /4 of 4/.test(root.querySelector(".mdq-meta").textContent));
  check("a card shows its title", /Chaffey batch blanks/.test(root.textContent));
  check("a card shows a status chip", /In progress/.test(root.textContent) && /Reported/.test(root.textContent));
  check("a card shows severity + category + college", (function () {
    const c = Array.prototype.filter.call(root.querySelectorAll(".mdq-card"), (x) => /Chaffey batch blanks/.test(x.textContent))[0];
    return c && /high/.test(c.textContent) && /Blank fields/.test(c.textContent) && /Chaffey College/.test(c.textContent) && /427 affected/.test(c.textContent);
  })());
  check("signed-in cards carry Advance + Edit actions", root.querySelector(".mdq-card .mdq-card-actions") &&
    /Advance status/.test(root.querySelector(".mdq-card-actions").textContent));

  // ── status-chip filter ──
  api._setFilter("status", "high"); // not a status → matches nothing via status filter? high is severity; use a real status
  api._setFilter("status", "open");
  check("status filter (open) narrows to the 1 open issue", root.querySelectorAll(".mdq-card").length === 1 && /Chaffey/.test(root.textContent));
  api._setFilter("status", "");
  check("clearing status restores all 4", root.querySelectorAll(".mdq-card").length === 4);

  // ── category filter ──
  api._setFilter("category", "eligibility-inflation");
  check("category filter narrows to the USMC issue", root.querySelectorAll(".mdq-card").length === 1 && /USMC JST/.test(root.textContent));
  api._setFilter("category", "");

  // ── college filter ──
  api._setFilter("college", "foothill");
  check("college filter (case-insensitive) narrows to Foothill", root.querySelectorAll(".mdq-card").length === 1 && /Old resolved thing/.test(root.textContent));
  api._setFilter("college", "");

  // ── search ──
  api._setFilter("q", "dedupe");
  check("search matches the 'expected' text", root.querySelectorAll(".mdq-card").length === 1 && /USMC JST/.test(root.textContent));
  api._setFilter("q", "");

  // ── export for MAP devs ──
  const exp = api._exportText();
  check("export lists the issues with titles", /MAP Data Quality/.test(exp) && /Chaffey batch blanks/.test(exp) && /USMC JST/.test(exp));
  check("export carries evidence + expected lines", /Expected:/.test(exp) && /Evidence:/.test(exp));
  check("export honors the active filter", (function () {
    api._setFilter("category", "eligibility-inflation");
    const e = api._exportText();
    api._setFilter("category", "");
    return /USMC JST/.test(e) && !/Chaffey batch blanks/.test(e);
  })());

  // ── add form (querySelector field access, never form.<name>) ──
  let formThrew = false;
  try { api._openForm(null); } catch (e) { formThrew = true; console.error(e); }
  check("openForm(null) builds the add form without throwing", !formThrew);
  const form = root.querySelector("form.mdq-form");
  check("add form present with a Title field", !!form && !!form.querySelector('[name="title"]'));
  check("add form has category/severity/status selects + date fields", (function () {
    return !!form.querySelector('[name="category"]') && !!form.querySelector('[name="severity"]') &&
      !!form.querySelector('[name="status"]') && !!form.querySelector('[name="followup_on"]');
  })());

  // ── write path: filling + submitting POSTs to map_data_quality ──
  let postUrl = null, postBody = null;
  win.fetch = function (url, opts) {
    if (opts && opts.method === "POST") { postUrl = url; postBody = opts.body; return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve([{ id: "new" }]) }); }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(FIXTURE) });
  };
  form.querySelector('[name="title"]').value = "New parser gap";
  form.querySelector('[name="category"]').value = "duplication";
  form.querySelector('[name="affected_count"]').value = "12";
  form.dispatchEvent(new dom.window.Event("submit"));
  await tick(); await tick();
  check("submit POSTs to map_data_quality", /map_data_quality/.test(String(postUrl)) && /New parser gap/.test(String(postBody)));
  check("submit sends the category + numeric count", /duplication/.test(String(postBody)) && /"affected_count":12/.test(String(postBody)));

  // ── edit form pre-fills from an existing row (querySelector, not form.title) ──
  api._openForm(FIXTURE[0]);
  const eform = root.querySelector("form.mdq-form");
  check("edit form pre-fills the title via querySelector (no form.title collision)",
    eform.querySelector('[name="title"]').value === "Chaffey batch blanks (Cx & exams)");

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
