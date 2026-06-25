// The per-row ⚇ Merge dialog's "Add more courses" search must actually add a
// course. Session 71 (PR-2b) consolidated the per-row dialog onto the shared
// merge-editor; Session 72 (#2) replaced the collapsible ➕ keyword-gather with
// an always-visible inline search whose matches drop straight into the
// Candidates list as UNCHECKED rows. This exercises that in the per-row context:
// a NEW course appears as an unchecked candidate, and a course already in the
// merge is EXCLUDED from the results.
//
// Run from repo root: `npm test` (or `node tests/uc_merge_search_add.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [
  { kind: "Course", id: "GRAF M1028", title: "Digital Imaging UI Design", id_system: "M-ID",
    disc: "Graphic Arts", subj: ["GRAF"], units: 3, credit: "Credit", members: 2,
    adopted: [], potential: [], flags: {} },
];
// Search index: the seed (already in list), a NEW course, and another in the list.
const idx = [
  ["GRAF M1028", "Digital Imaging UI Design", "GRAF", "Course", 3],
  ["MUSC Z1009", "Intermediate MIDI Interface", "MUSM", "Unified", 3],
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses"><div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div></div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Graphic Arts"], topmap: {} })};
  window.CPL_UC_INDEX = ${JSON.stringify(idx)};
</script></body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
const { document } = window;
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
window.fetch = function () { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve([]); } }); };
window.alert = function () {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("consumer init does not throw", !threw);

// Per-row dialog now embeds the shared editor (Session 71). Candidate rows are
// .uc-cand-cb checkbox rows (no [data-id]); "Add more by search" is the editor's
// ➕ keyword-gather panel.
function candCb(id) {
  return Array.from(document.querySelectorAll("input.uc-cand-cb"))
    .find(function (cb) { return cb.parentNode.textContent.indexOf(id) >= 0; });
}
function hasCand(id) { return !!candCb(id); }

(async function () {
  await sleep(120);
  const merge = Array.from(document.querySelectorAll("a")).find(function (a) { return /Merge/.test(a.textContent); });
  check("per-row ⚇ Merge link present", !!merge);
  if (merge) merge.onclick({ preventDefault: function () {} });
  await sleep(300);

  // The per-row dock's top Search box is the single keyword source (S72 #5);
  // matches land in the Candidates list as unchecked rows.
  const srch = Array.from(document.querySelectorAll('input[type="search"]'))
    .find(function (i) { return /to add more/i.test(i.placeholder || ""); });
  check("the top Search box is present", !!srch);

  // --- NEW course: typing drops it into the list as an UNCHECKED candidate ---
  const beforeNew = hasCand("MUSC Z1009");
  srch.value = "interface"; srch.dispatchEvent(new window.Event("input"));
  await sleep(300);
  check("typing adds the new MUSC Z1009 as a candidate row", !beforeNew && hasCand("MUSC Z1009"));
  check("the search-added candidate starts UNCHECKED (check to merge or ignore)",
    candCb("MUSC Z1009") && candCb("MUSC Z1009").checked === false);
  // Ticking it includes it; it survives a later (different) search.
  const z = candCb("MUSC Z1009"); z.checked = true; z.dispatchEvent(new window.Event("change"));

  // --- Already-in-the-merge course is EXCLUDED from results ---
  srch.value = "digital imaging"; srch.dispatchEvent(new window.Event("input"));
  await sleep(300);
  const seedRows = Array.from(document.querySelectorAll("div"))
    .filter(function (d) { return d.querySelector(":scope > input.uc-cand-cb") && /GRAF M1028/.test(d.textContent); });
  check("the seed (already in the merge) is NOT re-added by the search", seedRows.length === 1);
  check("a ticked search-added row persists across a new query", candCb("MUSC Z1009") && candCb("MUSC Z1009").checked === true);

  // ---- report ----
  let pass = 0;
  for (const [name, ok] of results) { console.log((ok ? "PASS  " : "FAIL  ") + name); if (ok) pass++; }
  console.log("\n" + pass + "/" + results.length + " assertions passed");
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
