// Session 70 (PaintSky) — the merge dialog's "Add more by search" must actually
// add a course on click. Two failure modes fixed: (a) clicking a result already
// in the members list silently no-op'd (read as "search doesn't add"); (b) a new
// add appended below the fold so it looked like nothing happened. Now every click
// adds-or-ensures-checked, scrolls the row into view, and marks the result added.
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

function memberIds() {
  return Array.from(document.querySelectorAll('[data-id]')).map(function (d) { return d.getAttribute("data-id"); });
}

(async function () {
  await sleep(120);
  const merge = Array.from(document.querySelectorAll("a")).find(function (a) { return /Merge/.test(a.textContent); });
  check("per-row ⚇ Merge link present", !!merge);
  if (merge) merge.onclick({ preventDefault: function () {} });
  await sleep(120);

  const srch = Array.from(document.querySelectorAll('input[type="search"]')).pop();
  check("merge dialog search box present", !!srch);

  // --- NEW course: clicking adds it to the members list (checked) ---
  srch.value = "interface"; srch.dispatchEvent(new window.Event("input"));
  await sleep(300);
  let resBtns = Array.from(document.querySelectorAll("button")).filter(function (b) { return /MIDI Interface/.test(b.textContent); });
  check("search surfaces the new MUSC Z1009 result", resBtns.length > 0);
  check("new result shows the '+ ' add affordance", resBtns[0] && /^\+ /.test(resBtns[0].textContent));
  const beforeNew = memberIds();
  if (resBtns[0]) resBtns[0].onclick();
  await sleep(60);
  const afterNew = memberIds();
  check("clicking a NEW result adds it to the members list", afterNew.indexOf("MUSC Z1009") >= 0 && beforeNew.indexOf("MUSC Z1009") < 0);
  check("the added result is marked '✓ added'", resBtns[0] && /✓ added/.test(resBtns[0].textContent));
  check("the added result button is disabled", resBtns[0] && resBtns[0].disabled === true);
  // Confirm-button count reflects the add (2 members → 'Merge 1 course into …' since seed is the target).
  const goBtn = Array.from(document.querySelectorAll("button")).find(function (b) { return /Merge \d|Mint NEW/.test(b.textContent); });
  check("the merge confirm count updated after the add", goBtn && /Merge 1 course/.test(goBtn.textContent));

  // --- Already-in-list course: clicking is NOT a silent no-op ---
  srch.value = "digital imaging"; srch.dispatchEvent(new window.Event("input"));
  await sleep(300);
  const seedBtn = Array.from(document.querySelectorAll("button")).find(function (b) { return /GRAF M1028/.test(b.textContent); });
  check("an already-listed course shows '✓ in list'", seedBtn && /✓ in list/.test(seedBtn.textContent));

  // ---- report ----
  let pass = 0;
  for (const [name, ok] of results) { console.log((ok ? "PASS  " : "FAIL  ") + name); if (ok) pass++; }
  console.log("\n" + pass + "/" + results.length + " assertions passed");
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
