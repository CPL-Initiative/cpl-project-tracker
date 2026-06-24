// The per-row ⚇ Merge dialog's "add more by search" must actually add a course.
// Session 71 (PR-2b) consolidated the per-row dialog onto the shared merge-editor,
// so this now exercises the editor's ➕ keyword-gather panel in the per-row
// context: a NEW course is added as a CHECKED candidate + the result button is
// marked "✓ added"/disabled, and a course already in the merge is EXCLUDED from
// the gather results (rather than the old dialog's "✓ in list").
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

  // The per-row dialog embeds the shared editor — "Add more by search" is the
  // editor's ➕ keyword-gather panel. Open it, then use its search box.
  const gatherToggle = Array.from(document.querySelectorAll("a"))
    .find(function (a) { return /Add more courses to this merge by keyword/.test(a.textContent); });
  check("➕ keyword-gather toggle present", !!gatherToggle);
  gatherToggle.onclick({ preventDefault: function () {} });
  await sleep(60);
  const srch = Array.from(document.querySelectorAll('input[type="search"]'))
    .find(function (i) { return /keyword or title/.test(i.placeholder); });
  check("the gather search box is present", !!srch);

  // --- NEW course: clicking adds it as a checked candidate ---
  srch.value = "interface"; srch.dispatchEvent(new window.Event("input"));
  await sleep(300);
  let resBtns = Array.from(document.querySelectorAll("button")).filter(function (b) { return /MIDI Interface/.test(b.textContent); });
  check("gather surfaces the new MUSC Z1009 result", resBtns.length > 0);
  check("new result shows the '+ ' add affordance", resBtns[0] && /^\+ /.test(resBtns[0].textContent));
  const beforeNew = hasCand("MUSC Z1009");
  if (resBtns[0]) resBtns[0].onclick();
  await sleep(60);
  check("clicking a gather result adds it as a candidate", !beforeNew && hasCand("MUSC Z1009"));
  check("the gathered candidate starts CHECKED (opted in by the add)", candCb("MUSC Z1009") && candCb("MUSC Z1009").checked === true);
  check("the added result is marked '✓ added'", resBtns[0] && /✓ added/.test(resBtns[0].textContent));
  check("the added result button is disabled", resBtns[0] && resBtns[0].disabled === true);

  // --- Already-in-the-merge course is EXCLUDED from gather results ---
  srch.value = "digital imaging"; srch.dispatchEvent(new window.Event("input"));
  await sleep(300);
  const seedBtn = Array.from(document.querySelectorAll("button")).find(function (b) { return /GRAF M1028/.test(b.textContent); });
  check("the seed (already in the merge) is NOT offered by the gather", !seedBtn);

  // ---- report ----
  let pass = 0;
  for (const [name, ok] of results) { console.log((ok ? "PASS  " : "FAIL  ") + name); if (ok) pass++; }
  console.log("\n" + pass + "/" + results.length + " assertions passed");
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
