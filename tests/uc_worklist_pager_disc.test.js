// Session 72 (StarLander) #1 + #2 — worklist chrome:
//   #1 a ‹ Prev · position · Next › PAGER at the sidebar bottom: step backward AND
//      forward through the queue (not only Skip-forward); Prev disabled on the
//      first group, Next disabled on the last.
//   #2 a Discipline filter populated from the disciplines present in the
//      suggestion set (with group counts); selecting one narrows the queue.
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_pager_disc.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkRow = (id, title, disc) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID", disc: disc,
  credit: "Credit", units: 3, top: "1002.00", subj: [id.split(" ")[0]], members: 2,
  adopted: [], potential: [], conf: 0.7, locked: false,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
});
const rows = [
  mkRow("ARTS M1001", "Ceramics", "Art"), mkRow("ARTS M1002", "Ceramics I", "Art"),
  mkRow("ARTS M2001", "Painting", "Art"), mkRow("ARTS M2002", "Painting I", "Art"),
  mkRow("MUSC M3001", "Voice", "Music"), mkRow("MUSC M3002", "Voice I", "Music"),
];
const grp = (sig, a, b, d) => ({ sig: sig, n: 2, score: 0.9, members: [
  { id: a, t: rows.find((r) => r.id === a).title, s: a.split(" ")[0], u: 3, k: "M-ID", d: d },
  { id: b, t: rows.find((r) => r.id === b).title, s: b.split(" ")[0], u: 3, k: "M-ID", d: d },
] });
const sugStub = {
  singleton_groups: [], family_groups: [], desc_groups: [], evidence_groups: [], title_groups: [],
  groups: [
    grp("ceramics", "ARTS M1001", "ARTS M1002", "Art"),
    grp("painting", "ARTS M2001", "ARTS M2002", "Art"),
    grp("voice", "MUSC M3001", "MUSC M3002", "Music"),
  ],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Art", "Music"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.localStorage.setItem("cplCandLoosen.v1", "0");   // Tight — no auto-surface noise
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
window.fetch = (url, opts) => Promise.resolve({
  ok: true, status: (opts && opts.method && opts.method !== "GET") ? 201 : 200,
  json: () => Promise.resolve([]),
});
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw", !threw);

(async function main() {
  await sleep(120);
  const doc = window.document;
  Array.from(doc.querySelectorAll("button")).find((b) => /Suggested merges/.test(txt(b)))
    .dispatchEvent(new window.Event("click"));
  await sleep(200);
  const dock = doc.querySelector(".uc-worklist-dock");
  const head = Array.from(dock.querySelectorAll("strong")).find((s) => /Suggested merges/.test(txt(s))).parentNode;
  const prevB = () => Array.from(dock.querySelectorAll("button")).find((b) => /‹ Prev/.test(txt(b)));
  const nextB = () => Array.from(dock.querySelectorAll("button")).find((b) => /Next ›/.test(txt(b)));

  // ── #1 pager ──────────────────────────────────────────────────────────────
  check("pager Prev button present", !!prevB());
  check("pager Next button present", !!nextB());
  check("starts at group 1 of 3", /1 of 3/.test(txt(head)));
  check("Prev is DISABLED on the first group", prevB().disabled === true);
  check("Next is ENABLED on the first group", nextB().disabled === false);
  nextB().dispatchEvent(new window.Event("click"));
  await sleep(40);
  check("Next advances to group 2 of 3", /2 of 3/.test(txt(head)));
  nextB().dispatchEvent(new window.Event("click"));
  await sleep(40);
  check("Next advances to group 3 of 3", /3 of 3/.test(txt(head)));
  check("Next is DISABLED on the last group", nextB().disabled === true);
  prevB().dispatchEvent(new window.Event("click"));
  await sleep(40);
  check("Prev steps BACK to group 2 of 3", /2 of 3/.test(txt(head)));

  // ── #2 discipline filter ────────────────────────────────────────────────
  const discSel = Array.from(dock.querySelectorAll("select.uc-filter"))
    .find((s) => /All disciplines/.test(txt(s)));
  check("discipline filter present", !!discSel);
  const optTexts = Array.from(discSel.querySelectorAll("option")).map((o) => txt(o));
  check("discipline menu lists 'Art (2)' with the group count", optTexts.some((t) => /^Art \(2\)/.test(t)));
  check("discipline menu lists 'Music (1)' with the group count", optTexts.some((t) => /^Music \(1\)/.test(t)));
  discSel.value = "Music"; discSel.dispatchEvent(new window.Event("change"));
  await sleep(40);
  check("selecting Music narrows the queue to 1 matching", /1 of 1 matching/.test(txt(head)));
  check("the surfaced group is the Voice (Music) group", /Voice/.test(txt(dock)) && !/Ceramics|Painting/.test(txt(dock)));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
