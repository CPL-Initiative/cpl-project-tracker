// Session 72 (StarLander) #9 — the Title-5-§55050 Common-Course LEVEL convention.
// courseBands() classifies a title to a level (internal beg/int/adv) and the
// per-candidate chip shows Beg/Int/Adv (Sam, S72: keep the human Beg/Int/Adv
// labels; the §55050 classification logic stays). Order: explicit ranges
// (1-2/3-4/5-6 → Beg/Int/Adv) win, then words + Roman ordinals + First/Second/
// Third Semester, then a bare single number as a HINT (1→Beg, 2→Int, 3+→Adv).
// Verified via the per-row ⚇ dock's candidate level chips (all "Spanish …"
// variants share the token {spanish}, so they all surface as candidates of the seed).
//
// Run from repo root: `npm test` (or `node tests/uc_course_level_convention.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mk = (id, title) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID", disc: "Foreign Languages",
  credit: "Credit", units: 4, top: "1105.00", subj: ["SPAN"], members: 2,
  adopted: [], potential: [], conf: 0.7, locked: false,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
});
// id → [title, expected level chip]
const cases = {
  "SPAN M1001": ["Spanish", "Beg"],                    // unqualified → Beg (seed)
  "SPAN M1012": ["Spanish 1-2", "Beg"],                // range 1-2 → Beg
  "SPAN M1034": ["Spanish 3-4", "Int"],                // range 3-4 → Int
  "SPAN M1056": ["Spanish 5-6", "Adv"],                // range 5-6 → Adv
  "SPAN M1100": ["Intermediate Spanish", "Int"],       // word → Int
  "SPAN M1101": ["Spanish III", "Adv"],                // Roman ordinal → Adv
  "SPAN M1102": ["Second Semester Spanish", "Int"],    // First/Second/Third Semester → Int
  "SPAN M1103": ["Advanced Spanish", "Adv"],           // word → Adv
  "SPAN M1104": ["Spanish 2", "Int"],                  // bare number hint → Int
  "SPAN M1105": ["Spanish 3", "Adv"],                  // bare number hint (3+) → Adv
};
const rows = Object.keys(cases).map((id) => mk(id, cases[id][0]));
const idx = Object.keys(cases).map((id) => [id, cases[id][0], "SPAN", "M-ID", 4]);

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Foreign Languages"], topmap: {} })};
  window.CPL_UC_INDEX = ${JSON.stringify(idx)};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
window.fetch = (url, opts) => {
  const u = String(url), method = (opts && opts.method) || "GET";
  let body = []; if (u.indexOf("allowed_reviewers") >= 0) body = [{ email: "test@rccd.edu" }];
  return Promise.resolve({ ok: true, status: method === "GET" ? 200 : 201, json: () => Promise.resolve(body) });
};
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw", !threw);

(async function main() {
  await sleep(120);
  const doc = window.document;
  const rowFor = (id) => Array.from(doc.querySelectorAll("table.uc-table tbody tr"))
    .find((tr) => txt(tr.querySelectorAll("td")[1]).indexOf(id) >= 0);
  function candRow(id) {
    return Array.from(doc.querySelectorAll("div"))
      .find((d) => d.querySelector(":scope > input.uc-cand-cb") && d.textContent.indexOf(id) >= 0);
  }
  function levelChip(id) {
    const r = candRow(id); if (!r) return null;
    const s = Array.from(r.querySelectorAll("span")).find((x) => /^(Beg|Int|Adv)$/.test(txt(x)));
    return s ? txt(s) : null;
  }

  rowFor("SPAN M1001").querySelector("a.uc-merge-link").dispatchEvent(new window.Event("click"));
  await sleep(300);
  // Loosen fully so every "Spanish …" variant surfaces (some carry extra tokens
  // — "Second Semester Spanish" — that sit below the default similarity cutoff).
  const slider = doc.querySelector(".uc-worklist-dock").querySelector('input[type="range"]');
  slider.value = "100"; slider.dispatchEvent(new window.Event("input"));
  await sleep(350);

  Object.keys(cases).forEach((id) => {
    const [title, expected] = cases[id];
    check('"' + title + '" → ' + expected, levelChip(id) === expected);
  });

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
