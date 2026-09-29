// Governance → "Docs & doctrine" panel — jsdom test.
//
// Sam, 2026-08-28: *"I definitely don't want to get trapped reviewing for a
// living :) But it would be nice to be able to easily look at them when I see
// recurring or thematic misalignments with my expectations that could be
// artifact-based."*
//
// That is a DIAGNOSTIC, not a cadence, and every guard here defends one of the
// two properties that distinguishes the two:
//
//  (a) IT MUST NEVER ACQUIRE REVIEW STATE. No checkbox, no "mark reviewed", no
//      unread count, no owner column. Those are exactly what a future session
//      would add to be helpful, and adding them turns a thing he pulls from into
//      a thing that nags him — the outcome he explicitly ruled out.
//  (b) IT MUST SEARCH WHAT A NOTE GOVERNS, not just its title. "Which document
//      taught it that?" is answered by `artifacts:`, and a matcher that quietly
//      searched titles only would look like it worked while missing the point.
//
// Plus the ordinary silent failures: an index that fails to load must not read
// as "no guidance exists", and the JSON must agree with the markdown catalogs.
//
// Run from repo root: `npm test` (or `node tests/governance_docs_panel.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("governance.js", "utf8");
const IDX = JSON.parse(fs.readFileSync("docs/catalog/index.json", "utf8"));

// ── Part A — the payload ──────────────────────────────────────────────────
check("index.json: every lane carries docs",
  (IDX.lanes || []).length >= 5 && IDX.lanes.every((l) => Array.isArray(l.docs)));
check("index.json: total matches the sum of the lanes",
  IDX.total === IDX.lanes.reduce((n, l) => n + l.docs.length, 0));
check("index.json: each lane's count matches its own docs",
  IDX.lanes.every((l) => l.count === l.docs.length));

// The doctrine lane is the whole reason this is not just doctrine.py: that tool
// puts CLAUDE.md in NOISE, and CLAUDE.md auto-loads into EVERY session, so it is
// the likeliest source of a recurring behavioral mismatch.
const doctrine = IDX.lanes.find((l) => l.slug === "doctrine");
check("index.json: a doctrine lane exists", !!doctrine);
check("index.json: doctrine includes CLAUDE.md",
  !!doctrine && doctrine.docs.some((d) => d.path === "CLAUDE.md"));
check("index.json: doctrine includes the checkpoint command",
  !!doctrine && doctrine.docs.some((d) => d.path === ".claude/commands/checkpoint.md"));

// One collector, so the panel and the catalogs cannot disagree about what exists.
IDX.lanes.forEach((l) => {
  const md = fs.readFileSync("docs/catalog/" + l.slug + ".md", "utf8");
  check("index.json agrees with catalog/" + l.slug + ".md",
    md.indexOf(l.count + " document(s).") !== -1);
});

// `governs` is what makes a theme traceable to the document that set it.
const kb = IDX.lanes.find((l) => l.slug === "kb-notes");
check("index.json: KB notes carry the files they govern",
  kb.docs.filter((d) => (d.governs || []).length).length > 50);
check("index.json: KB notes carry tags",
  kb.docs.filter((d) => (d.tags || []).length).length > 300);

// ── Part B — behavior ─────────────────────────────────────────────────────
function makeWin() {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><div id="governance-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function () { return new Promise(function () {}); };
  w.eval(fs.readFileSync("team_phrase.js", "utf8"));
  w.eval(SRC);
  return w;
}

const W = makeWin();
const G = W.CPL_GOVERNANCE;

// (b) the matcher reads `governs`, not only the title
const probe = { title: "Something unrelated", path: "docs/kb-notes/x.md",
                tags: ["methodology"], governs: ["chatbox/supabase/functions/cpl-chat/index.ts"] };
check("search: matches on a file the note GOVERNS", G._docMatches(probe, "cpl-chat"));
check("search: matches on a tag", G._docMatches(probe, "methodology"));
check("search: matches on the title", G._docMatches(probe, "unrelated"));
check("search: all words must match (AND, not OR)",
  !G._docMatches(probe, "methodology nonsense"));
check("search: empty query matches everything", G._docMatches(probe, ""));

// ordering — newest first, and handoffs by session number
check("sort: handoffs order by session number, descending",
  JSON.stringify(G._sortDocs({ docs: [{ n: 3 }, { n: 12 }, { n: 7 }] }).map((d) => d.n))
    === JSON.stringify([12, 7, 3]));
check("sort: everything else orders by date, descending",
  JSON.stringify(G._sortDocs({ docs: [
    { updated: "2026-01-01", title: "a" }, { updated: "2026-08-01", title: "b" },
    { updated: "2026-04-01", title: "c" }] }).map((d) => d.title))
    === JSON.stringify(["b", "c", "a"]));
check("sort: a missing `updated` falls back to `created`",
  G._sortDocs({ docs: [{ created: "2026-01-01", title: "old" },
                       { created: "2026-09-01", title: "new" }] })[0].title === "new");
check("sort: does not mutate its input", (function () {
  const src = [{ n: 1 }, { n: 9 }];
  G._sortDocs({ docs: src });
  return src[0].n === 1;
})());

// (a) NO REVIEW STATE — the constraint most likely to be "helpfully" violated
(function () {
  const w = makeWin();
  const root = w.document.getElementById("governance-root");
  root.innerHTML = '<div class="gov"></div>';
  w.CPL_GOVERNANCE._mountDocs(root);
  const panel = root.querySelector(".gov-docs");
  check("panel: mounts into the governance root", !!panel);
  check("panel: is collapsed until asked (inert by default)",
    !!panel && !panel.open);
  const html = root.innerHTML.toLowerCase();
  check("panel: no checkbox", html.indexOf("type=\"checkbox\"") === -1);
  check("panel: no review/approval affordance",
    !/mark reviewed|last reviewed|reviewed by|sign off|approve/.test(html));
  check("panel: no unread or due badge", !/unread|overdue|due |badge/.test(html));
  // Mounting twice must not double the panel — wire() re-runs on every render.
  w.CPL_GOVERNANCE._mountDocs(root);
  check("panel: mounting is idempotent",
    root.querySelectorAll(".gov-docs").length === 1);
})();

// A failed index must SAY SO — never render as an empty corpus. Exercised
// through the real path (a rejecting fetch), because the handler deliberately
// RETRIES on reopen when a previous attempt errored, so poking `state.error`
// and dispatching `toggle` would fetch again and never repaint. The first cut
// of this test did exactly that and failed against correct code.
function errorPath() {
  const w = makeWin();
  w.fetch = function () { return Promise.reject(new Error("index 404")); };
  const root = w.document.getElementById("governance-root");
  root.innerHTML = '<div class="gov"></div>';
  w.CPL_GOVERNANCE._mountDocs(root);
  const panel = root.querySelector(".gov-docs");
  panel.open = true;
  panel.dispatchEvent(new w.Event("toggle"));
  return new Promise(function (res) { setTimeout(res, 50); }).then(function () {
    const txt = panel.textContent;
    check("failure: a broken index reports the error", /could not load/i.test(txt));
    check("failure: …and names where the catalogs still are",
      /docs\/catalog/.test(txt));
    check("failure: …and does not read as an empty corpus",
      txt.trim().length > 40);
  });
}

// A successful load renders lanes, and a query with no hits says so rather than
// rendering blank — "nothing matches" is a RESULT (no committed guidance
// mentions it), which is itself the answer to "is this artifact-based?".
function happyPath() {
  const w = makeWin();
  w.fetch = function () {
    return Promise.resolve({ ok: true, json: function () { return Promise.resolve(IDX); } });
  };
  const root = w.document.getElementById("governance-root");
  root.innerHTML = '<div class="gov"></div>';
  w.CPL_GOVERNANCE._mountDocs(root);
  const panel = root.querySelector(".gov-docs");
  panel.open = true;
  panel.dispatchEvent(new w.Event("toggle"));
  return new Promise(function (res) { setTimeout(res, 50); }).then(function () {
    check("render: one collapsed dropdown per lane",
      panel.querySelectorAll(".gov-lane").length === IDX.lanes.length);
    check("render: lanes start collapsed",
      Array.prototype.every.call(panel.querySelectorAll(".gov-lane"), (d) => !d.open));
    check("render: rows link to GitHub blobs",
      /github\.com\/CPL-Initiative\/cpl-project-tracker\/blob\/main\//.test(panel.innerHTML));
    check("render: the theme box is labelled",
      !!panel.querySelector('label[for="gov-docs-q"]') && !!panel.querySelector("#gov-docs-q"));

    const q = panel.querySelector("#gov-docs-q");
    q.value = "cpl-chat";
    q.dispatchEvent(new w.Event("input"));
    check("filter: a theme search opens the lanes that answer it",
      Array.prototype.some.call(panel.querySelectorAll(".gov-lane"), (d) => d.open));
    check("filter: …and says WHICH file the note governs",
      /governs:/.test(panel.innerHTML));

    const q2 = panel.querySelector("#gov-docs-q");
    q2.value = "zzzznotathinganywhere";
    q2.dispatchEvent(new w.Event("input"));
    check("filter: no matches is reported as a result, not a blank",
      /nothing matches/i.test(panel.textContent)
      && /not coming from these documents/i.test(panel.textContent));
  });
}

Promise.resolve().then(errorPath).then(happyPath).then(report).catch(function (e) {
  check("async chain completed", false);
  console.error(e);
  report();
});

function report() {
  let failed = 0;
  for (const [name, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; }
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
}
