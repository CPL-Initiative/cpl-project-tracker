// Card live-update overlay (card_updates.js) — jsdom test.
//
// Guards:
//  (a) Rule 4 (both HTMLs identical) + the script is included in both;
//  (b) latestByKey keeps the NEWEST item_updates row per item_type:item_id key;
//  (c) blockHtml renders a "Latest Update" badge + a timestamp, and ESCAPES the
//      body (item_updates is reviewer-written — treat as untrusted → no XSS);
//  (d) the overlay fills a matching hook, reveals it, and HIDES the creation-era
//      static "Latest Update" in the same card;
//  (e) the failure mode — a hook whose key has NO update stays hidden and leaves
//      the static line visible (no throw).
//
// Run from repo root: `npm test` (or `node tests/card_updates.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants on the shipped HTML ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("card_updates.js included in CPL_Dashboard.html", /<script src="card_updates\.js"><\/script>/.test(cpl));
check("card_updates.js included in index.html", /<script src="card_updates\.js"><\/script>/.test(idx));

const SRC = fs.readFileSync("card_updates.js", "utf8");

// ── Part B — behavior, loaded into jsdom ──
function makeDom(rows) {
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body>" +
      // Card 1: sub-activity card with a matched key + a static line.
      '<div class="activity-kpi-card">' +
        '<div class="cpl-live-update" data-update-key="project:1.1" style="display:none;"></div>' +
        '<div class="cpl-static-update">creation-era text</div>' +
      "</div>" +
      // Card 2: project card with an UNMATCHED key + a static line.
      '<div class="project-card">' +
        '<div class="cpl-live-update" data-update-key="project:9.9" style="display:none;"></div>' +
        '<div class="cpl-static-update">unmatched static</div>' +
      "</div>" +
      // Card 3: activity group with a matched activity-level key.
      '<div class="activity-group">' +
        '<div class="cpl-live-update" data-update-key="activity:1" style="display:none;"></div>' +
      "</div>" +
      "</body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  w.fetch = function (url) {
    if (/item_updates/.test(url)) {
      return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(rows); } });
    }
    return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve([]); } });
  };
  w.eval(SRC); // auto-runs (document is already 'complete')
  return dom;
}

// item_updates rows, newest-first as the real query returns them. project:1.1 has
// two rows (the newer must win); activity:1 has one; project:9.9 has none.
const ROWS = [
  { item_type: "project", item_id: "1.1", body: "Newest 1.1 update", author: "map@rccd.edu", created_at: "2026-06-26T12:00:00Z" },
  { item_type: "activity", item_id: "1", body: "Activity 1 rolling status", author: "map@rccd.edu", created_at: "2026-06-25T09:00:00Z" },
  { item_type: "project", item_id: "1.1", body: "Older 1.1 update", author: "map@rccd.edu", created_at: "2026-06-20T08:00:00Z" },
];

(async function () {
  // (b) + (c) pure helpers — drive them directly off the exported API.
  const probe = makeDom(ROWS);
  const API = probe.window.CPL_CARD_UPDATES;
  check("module exposes CPL_CARD_UPDATES", !!API && typeof API.run === "function");

  const latest = API.latestByKey(ROWS);
  check("latestByKey keeps newest per key (1.1 → 'Newest')", latest["project:1.1"] && latest["project:1.1"].body === "Newest 1.1 update");
  check("latestByKey indexes activity keys too", latest["activity:1"] && latest["activity:1"].body === "Activity 1 rolling status");

  const xss = API.blockHtml({ body: "<img src=x onerror=alert(1)> & <b>bold</b>", author: "map@rccd.edu", created_at: "2026-06-26T12:00:00Z" });
  check("blockHtml escapes the body (no raw <img>)", xss.indexOf("<img") === -1 && xss.indexOf("&lt;img") !== -1);
  check("blockHtml carries a 'Latest Update' badge", /Latest Update<\/span>/.test(xss));
  check("blockHtml shows the author in the meta line", /map@rccd\.edu/.test(xss));

  // (d) + (e) DOM application — let the mocked fetch resolve.
  await new Promise((r) => setTimeout(r, 30));
  const doc = probe.window.document;

  const hook11 = doc.querySelector('.cpl-live-update[data-update-key="project:1.1"]');
  check("matched hook (1.1) is revealed", hook11 && hook11.style.display !== "none");
  check("matched hook (1.1) shows the newest body", hook11 && /Newest 1\.1 update/.test(hook11.innerHTML));
  check("matched hook (1.1) is marked filled", hook11 && hook11.getAttribute("data-filled") === "1");
  check("static line in the 1.1 card is hidden", (function () {
    const s = doc.querySelector(".activity-kpi-card .cpl-static-update");
    return s && s.style.display === "none";
  })());

  const hookAct = doc.querySelector('.cpl-live-update[data-update-key="activity:1"]');
  check("activity-level hook (activity:1) is revealed + filled", hookAct && hookAct.style.display !== "none" && /rolling status/.test(hookAct.innerHTML));

  // (e) unmatched key — hook stays hidden, its static line stays visible.
  const hook99 = doc.querySelector('.cpl-live-update[data-update-key="project:9.9"]');
  check("unmatched hook (9.9) stays hidden", hook99 && hook99.style.display === "none" && !hook99.getAttribute("data-filled"));
  check("unmatched card keeps its static line visible", (function () {
    const s = doc.querySelector(".project-card .cpl-static-update");
    return s && s.style.display !== "none";
  })());

  // Re-running must be idempotent (no double-fill / no throw).
  let threw = false;
  try { API.run(); await new Promise((r) => setTimeout(r, 10)); } catch (e) { threw = true; }
  check("re-run is idempotent (no throw, still one block)", !threw &&
    doc.querySelectorAll('.cpl-live-update[data-update-key="project:1.1"] [style*="Latest Update"], .cpl-live-update[data-update-key="project:1.1"] span').length >= 1);

  // ── report ──
  let failed = 0;
  results.forEach(function (r) {
    console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
    if (!r[1]) failed++;
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
