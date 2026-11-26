// A piece waiting on its first accessibility check shows where it is (Sam, 2026-11-26, in session: "when it is being
// check for accessibility, i need a progress indicator...it's just been stuck there"). library-publish.yml checks on
// its schedule (every three hours at :41 UTC), so the card showed one unchanging line for up to three hours.
//
// Guards the failure mode: a published piece with no check record draws the steps (Published, Accessibility check,
// Listed), a progress bar, the next check run's time, and a way to add its public summary while it waits; the summary
// press opens the form with the summary prefilled. And "File a new version" stays off the card (Sam, 2026-11-26: "the
// file feature is not needed").
//
// Run from repo root: `npm test` (or `node tests/library_check_progress.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const SRC = fs.readFileSync("library.js", "utf8");
const LIST = fs.readFileSync("commons_list.js", "utf8");

const BASE = { kind: "document", occasion: "Summit", made_on: "2026-10-19", status: "approved", seen_by: "team", home: "drive",
  sources: [], versions: [], updated_at: "2026-11-01T10:00:00Z", publish_target: null, template: false, division: "cobi" };
const ROWS = [
  Object.assign({}, BASE, { id: "m1", slug: "memo", title: "A memo", url: "https://studentrcc.sharepoint.com/sites/x/memo.docx", summary: "A memo for the summit." }),
  // No check record yet: the form draws its "Not yet certified" line and buttons, with no Public summary.
  Object.assign({}, BASE, { id: "m2", slug: "brief", title: "A brief", url: "https://studentrcc.sharepoint.com/sites/x/brief.docx", summary: "A brief.",
    updated_at: "2026-10-30T10:00:00Z" })
];
// A passing check record for m1's page as the record names it now.
const PASS = { library_id: "m1", version_key: "page", url: ROWS[0].url, standard: "WCAG 2.1 AA and Section 508", checked_at: "2026-11-19T18:00:00Z",
  tool_or_reviewer: "axe-core automated check", result: "pass", report_url: "https://example.org/report" };

function response(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status: status,
    json: function () { return Promise.resolve(body); }, text: function () { return Promise.resolve(JSON.stringify(body)); } });
}
const settle = () => new Promise((r) => setTimeout(r, 0)).then(() => new Promise((r) => setTimeout(r, 0)));
function click(w, el) { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }

function load(hash) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="library-root"></div></body></html>',
    { url: "https://example.org/" + hash, runScripts: "dangerously" });
  const w = dom.window, calls = [];
  w.localStorage.setItem("cpl_team_pass", "p");
  w.localStorage.setItem("cpl_library_author", "Sam");
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.fetch = function (url, init) {
    url = String(url);
    if (init && init.method && init.method !== "GET") { calls.push({ url: url, method: init.method, body: JSON.parse(init.body || "{}") }); return response(200, [{}]); }
    if (/cpl_library_checks/.test(url)) return response(200, []);
    if (/cpl_library_drafts|cpl_library_division_settings|\/rpc\//.test(url)) return response(200, []);
    return response(200, ROWS);
  };
  const l = w.document.createElement("script"); l.textContent = LIST; w.document.body.appendChild(l);
  const s = w.document.createElement("script"); s.textContent = SRC; w.document.body.appendChild(s);
  return { w: w, doc: w.document, calls: calls, M: w.CPL_LIBRARY, root: w.document.getElementById("library-root") };
}


(async function () {
  const WAIT = Object.assign({}, ROWS[1], { publish_target: "public", public_listed: false, public_summary: null });
  ROWS.length = 0; ROWS.push(WAIT);
  const m = load("#library/cards");
  await m.M.activate(); await settle();
  const prog = m.root.querySelector('[data-checkwait="' + WAIT.id + '"]');
  check("⭐ a piece waiting on its first check shows a progress block", !!prog, m.root.textContent.slice(0, 300));
  check("it marks the Accessibility check step as the current one", !!prog && /Accessibility check/.test((prog.querySelector('[aria-current="step"]') || {}).textContent || ""));
  check("it carries a progress bar with a label", !!prog && !!prog.querySelector("progress[aria-label]"));
  check("⭐ it names the next check run", !!prog && /next check run starts at/.test(prog.textContent), prog && prog.textContent);
  check("it is announced as a status", !!prog && prog.getAttribute("role") === "status");
  const add = prog && prog.querySelector('[data-pubtop="' + WAIT.id + '"]');
  check("⭐ it offers Add its public summary while it waits", !!add && /Add its public summary/.test(add.textContent));
  if (add) click(m.w, add);
  await settle();
  const sum = m.doc.getElementById("lp-sum");
  check("⭐ the press opens the form with the summary prefilled from the internal one", !!sum && sum.value === WAIT.summary, sum ? sum.value : "no #lp-sum");
  check("File a new version is gone from the card", !/File a new version/.test(m.root.textContent));
  const n = m.w.CPL_LIBRARY && m.w.CPL_LIBRARY._nextCheckRun;
  if (n) {
    const at = n(Date.parse("2026-11-26T00:20:00Z"));
    check("the next run after 00:20Z is 00:41Z", at.toISOString() === "2026-11-26T00:41:00.000Z", at.toISOString());
    const at2 = n(Date.parse("2026-11-26T00:41:00Z"));
    check("at 00:41Z exactly the next run is 03:41Z", at2.toISOString() === "2026-11-26T03:41:00.000Z", at2.toISOString());
  }
  let fail = 0;
  for (const [name, ok, why] of results) {
    console.log((ok ? "ok   " : "FAIL ") + name + (ok || !why ? "" : "\n       " + why));
    if (!ok) fail++;
  }
  console.log("\nlibrary_check_progress.test.js: " + (results.length - fail) + "/" + results.length + " checks passed");
  process.exit(fail ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
