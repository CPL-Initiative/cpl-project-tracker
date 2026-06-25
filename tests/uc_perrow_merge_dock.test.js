// Session 72 (StarLander) #1 — the per-row ⚇ Merge now opens the DOCKED sidebar
// (Sam: "open the sidebar itself"), not a centered modal. Guards:
//   1. Clicking ⚇ Merge mounts the right-hand docked panel (.uc-worklist-dock,
//      position:fixed right:0) and reflows the page (body padding-right), with a
//      "⚇ Merge" header carrying the course title.
//   2. Single-course mode drops the suggestion-QUEUE chrome (no aggressiveness
//      slider, no Skip/Keep, no "N of M") but embeds the SAME shared editor
//      (Proposed unified title + Confirm) and a Beg/Int/Adv/Lab/WkExp band row.
//   3. The band row filters the candidate POOL: unchecking "Adv" hides the
//      advanced candidate row (display:none) without touching the others.
//   4. ✕ closes the dock and clears the page reflow.
//
// Run from repo root: `npm test` (or `node tests/uc_perrow_merge_dock.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkRow = (id, title) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID", disc: "Kinesiology",
  credit: "Credit", units: 1, top: "0835.00", subj: ["KIN"], members: 2,
  adopted: [], potential: [], conf: 0.7, locked: false,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
});
const rows = [
  mkRow("WEIG M1001", "Weight Training"),
  mkRow("WEIG M1002", "Weight Training Advanced"),
  mkRow("WEIG M1003", "Weight Training Lab"),
];
const idx = [
  ["WEIG M1001", "Weight Training", "WEIG", "M-ID", 1],
  ["WEIG M1002", "Weight Training Advanced", "WEIG", "M-ID", 1],
  ["WEIG M1003", "Weight Training Lab", "WEIG", "M-ID", 1],
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Kinesiology"], topmap: {} })};
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

  rowFor("WEIG M1001").querySelector("a.uc-merge-link").dispatchEvent(new window.Event("click"));
  await sleep(300);   // loadIndex + dock build

  // ── 1. docked panel + reflow + header ─────────────────────────────────────
  const dock = doc.querySelector(".uc-worklist-dock");
  check("⚇ Merge opens the right-hand docked panel (not a modal)",
    dock && dock.style.position === "fixed" && dock.style.right === "0px");
  check("opening the dock reflows the page (body padding-right)",
    !!doc.body.style.paddingRight && parseInt(doc.body.style.paddingRight, 10) > 0);
  const strong = Array.from(dock.querySelectorAll("strong")).find((s) => /⚇ Merge/.test(txt(s)));
  check("header reads ⚇ Merge", !!strong);
  check("header carries the course title", /Weight Training/.test(txt(strong.parentNode)));

  // ── 2. single-course mode: queue chrome dropped, editor + band row present ─
  // The QUEUE aggressiveness slider (Cons↔Aggr, gates the suggestion queue) is
  // dropped; the editor's candidate Tight↔Loose looseness slider IS present
  // (Sam S72 follow-up — it's the "add more similar courses" control).
  check("no QUEUE aggressiveness slider (Cons↔Aggr) in single-course mode",
    !/Cons\.|Aggr\./.test(txt(dock)));
  check("no Skip / Keep-as-is buttons", !Array.from(dock.querySelectorAll("button")).some((b) => /Skip|Keep as-is/.test(txt(b))));
  check("no 'N of M' queue counter", !/\d+ of \d+/.test(txt(dock)));
  check("embeds the shared editor (Proposed unified title)", /Proposed unified title/.test(dock.textContent));
  check("embeds the shared editor (Confirm merge)",
    Array.from(dock.querySelectorAll("button")).some((b) => /Confirm merge/.test(txt(b))));
  check("the candidate Tight↔Loose looseness slider IS present",
    !!dock.querySelector('input[type="range"]') && /Tight/.test(txt(dock)) && /Loose/.test(txt(dock)));
  check("top Search box present (the single keyword source, S72 #5)",
    Array.from(dock.querySelectorAll('input[type=search]')).some((i) => /to add more/i.test(i.placeholder || "")));
  const bandLabels = Array.from(dock.querySelectorAll("label")).filter((l) => /^(Beg|Int|Adv|Lab|WkExp)$/.test(txt(l)));
  check("Beg/Int/Adv/Lab/WkExp band row present", bandLabels.length === 5);

  // ── 3. band filter hides candidate rows ───────────────────────────────────
  check("advanced candidate row visible before filtering",
    candRow("WEIG M1002") && candRow("WEIG M1002").style.display !== "none");
  const advCb = bandLabels.find((l) => txt(l) === "Adv").querySelector('input[type=checkbox]');
  advCb.checked = false; advCb.dispatchEvent(new window.Event("change"));
  await sleep(20);
  check("unchecking Adv hides the advanced candidate row",
    candRow("WEIG M1002") && candRow("WEIG M1002").style.display === "none");
  check("the beginning seed row stays visible",
    candRow("WEIG M1001") && candRow("WEIG M1001").style.display !== "none");
  check("the Lab candidate stays visible (beg-level, not adv)",
    candRow("WEIG M1003") && candRow("WEIG M1003").style.display !== "none");

  // ── 4. ✕ closes + clears reflow ───────────────────────────────────────────
  const closeX = Array.from(dock.querySelectorAll("button")).find((b) => b.getAttribute("aria-label") === "Close");
  closeX.dispatchEvent(new window.Event("click"));
  await sleep(20);
  check("✕ closes the dock", !doc.querySelector(".uc-worklist-dock"));
  check("closing clears the page reflow", !doc.body.style.paddingRight);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
