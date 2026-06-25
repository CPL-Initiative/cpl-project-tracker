// Session 70 (PaintSky) — the ✨ Suggested-merges worklist Beg/Int/Adv/Lab/WkExp
// band filter. Walk the worklist one level/format band at a time: toggling a band
// OFF narrows to groups with ≥2 matching members and pre-checks only matching
// members. "Beg" includes unqualified titles; "Lab" isolates lab-only merges.
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_level_filters.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [
  { kind: "Course", id: "WELD M1001", title: "Introduction to Welding", id_system: "M-ID",
    disc: "Welding", subj: ["WELD"], units: 3, credit: "Credit", members: 2, adopted: [], potential: [], flags: {} },
];
// Two anchored groups (merge into existing): one all-beginning, one all-advanced.
const sug = {
  groups: [
    { score: 0.9, members: [
      { id: "WELD M1001", t: "Introduction to Welding", s: "WELD", u: 3, k: "M-ID" },
      { id: "WELD M1002", t: "Welding Fundamentals", s: "WELD", u: 3, k: "M-ID" },
    ] },
    { score: 0.9, members: [
      { id: "WELD M2001", t: "Advanced Welding", s: "WELD", u: 3, k: "M-ID" },
      { id: "WELD M2002", t: "Welding III", s: "WELD", u: 3, k: "M-ID" },
    ] },
  ],
  family_groups: [], desc_groups: [], title_groups: [], evidence_groups: [], singleton_groups: [],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses"><div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div></div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Welding"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sug)};
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

function bandCb(label) {
  return Array.from(document.querySelectorAll("label")).find(function (l) {
    return txt(l) === label && l.querySelector('input[type="checkbox"]');
  });
}
function proposedTitle() {
  // The first text input in the shell is the "Proposed unified title".
  var inp = document.querySelector('input[type="text"]');
  return inp ? inp.value : "";
}

(async function () {
  await sleep(120);
  const open = Array.from(document.querySelectorAll("button, a")).find(function (b) { return /Suggested merges/.test(txt(b)); });
  check("Suggested-merges entry present", !!open);
  if (open) open.dispatchEvent(new window.Event("click"));
  await sleep(240);

  // 1. The band filter row renders with all five toggles.
  ["Beg", "Int", "Adv", "Lab", "WkExp"].forEach(function (lbl) {
    check("band toggle '" + lbl + "' present", !!bandCb(lbl));
  });

  // 2. First (beginning) group renders + a member row shows a 'Beg' chip.
  check("first group is the beginning pair", /Welding/.test(proposedTitle()));
  check("a 'Beg' level chip renders on a member row",
    Array.from(document.querySelectorAll("span")).some(function (s) { return txt(s) === "Beg"; }));

  // 3. Uncheck 'Beg' → the all-beginning group is hidden; worklist advances to the
  //    advanced group (its title shown, an 'Adv' chip present).
  const begCb = bandCb("Beg").querySelector('input[type="checkbox"]');
  begCb.checked = false; begCb.dispatchEvent(new window.Event("change"));
  await sleep(60);
  check("unchecking Beg advances to the advanced group", /Advanced Welding|Welding III/.test(proposedTitle()));
  check("an 'Adv' chip renders after the band switch",
    Array.from(document.querySelectorAll("span")).some(function (s) { return txt(s) === "Adv"; }));

  // 4. Re-check Beg, then leave ONLY 'Lab' on → neither group has lab members →
  //    end-of-worklist message.
  begCb.checked = true; begCb.dispatchEvent(new window.Event("change"));
  await sleep(40);
  ["Beg", "Int", "Adv", "WkExp"].forEach(function (lbl) {
    var c = bandCb(lbl).querySelector('input[type="checkbox"]'); c.checked = false; c.dispatchEvent(new window.Event("change"));
  });
  await sleep(60);
  check("Lab-only filter (no lab members) shows the end-of-worklist state",
    /End of the worklist|No suggested merges/.test(txt(document.querySelector("#tab-unified-courses"))) ||
    Array.from(document.querySelectorAll("p")).some(function (p) { return /End of the worklist|No suggested merges/.test(txt(p)); }));

  // ---- report ----
  let pass = 0;
  for (const [name, ok] of results) { console.log((ok ? "PASS  " : "FAIL  ") + name); if (ok) pass++; }
  console.log("\n" + pass + "/" + results.length + " assertions passed");
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
