// Session 70 — the worklist "will mint under <Common SUBJ>" preview.
// A fresh mint's Common SUBJ is derived from the chosen discipline; the popup
// previews that destination (the banded number is still assigned at the next
// build). Built from DISC_COMMON_SUBJ — the modal Common SUBJ of a discipline's
// existing M-ID rows.
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_mint_preview.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A Photography M-ID seeds DISC_COMMON_SUBJ["Photography"] = "PHOT".
const rows = [
  { kind: "Course", id: "PHOT M1064", title: "Digital Imaging 1", id_system: "M-ID",
    disc: "Photography", credit: "Credit", units: 3.0, top: "1012.00", subj: ["PHOT"],
    members: 4, adopted: [], potential: [], conf: 0.85, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
];
// A singleton-only group → Confirm MINTS a new course; discipline picker enabled.
const sugStub = {
  groups: [], family_groups: [], desc_groups: [], evidence_groups: [],
  title_count: 0, title_groups: [],
  singleton_groups: [
    { sig: "Intro Digital Photography", n: 2, score: 0.9, same_college: false,
      members: [
        { id: "DIGI SA1", t: "Intro Digital Photography", s: "DIGI", u: 3.0, k: "Stand-Alone", g: 1 },
        { id: "PHOT SA2", t: "Introduction to Digital Photography", s: "PHOT", u: 3.0, k: "Stand-Alone", g: 1 },
      ] },
  ],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses"><div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div></div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A", "B"], mq_disciplines: ["Photography", "Welding"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
</script></body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
window.fetch = (url, opts) => {
  const method = (opts && opts.method) || "GET";
  return Promise.resolve({ ok: true, status: method === "GET" ? 200 : 201, json: () => Promise.resolve([]) });
};
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("consumer init does not throw", !threw);

function curBox(doc) {
  const boxes = Array.from(doc.querySelectorAll("div")).filter((d) => /Proposed unified title/.test(txt(d)));
  return boxes[boxes.length - 1];
}

(async function main() {
  await sleep(120);
  const doc = window.document;
  Array.from(doc.querySelectorAll("button, a")).find((b) => /Suggested merges/.test(txt(b)))
    .dispatchEvent(new window.Event("click"));
  await sleep(220);
  const box = curBox(doc);

  // Before a discipline is picked, the mint hint prompts for one.
  check("mint hint prompts for a discipline before one is picked",
    /pick a discipline to set its Common SUBJ/.test(box.textContent));
  const discSel = box.querySelector("select.uc-filter");
  check("discipline picker is enabled for a mint", discSel && discSel.disabled === false);

  // Pick Photography → preview resolves to its Common SUBJ (PHOT) from the seed M-ID.
  discSel.value = "Photography"; discSel.dispatchEvent(new window.Event("change"));
  await sleep(20);
  check("picking a discipline previews its Common SUBJ (PHOT)",
    /under Common SUBJ PHOT/.test(box.textContent));
  check("the preview notes the number is assigned at the next build",
    /banded course number is assigned at the next build/.test(box.textContent));

  // A discipline with no existing M-ID falls back to "a new Common SUBJ".
  discSel.value = "Welding"; discSel.dispatchEvent(new window.Event("change"));
  await sleep(20);
  check("a discipline with no existing M-ID previews a new Common SUBJ",
    /under a new Common SUBJ for Welding/.test(box.textContent));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
