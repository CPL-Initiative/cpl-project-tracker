// Session 71 (PR-4): the docked Suggested-merges worklist re-filters LIVE as the
// CCR table filters change (before PR-4 the CCR carry-over was snapshotted when
// the panel opened). Guards:
//   1. With the carry-over ON, changing the CCR Discipline filter while the dock
//      is open re-runs the queue to the matching group (Art group → Biology group).
//   2. The position counter reflects the live-filtered set ("N of M matching").
//   3. With the carry-over OFF, a CCR filter change does NOT disturb the dock
//      (it stays independent).
//   4. The wiring exists (worklistRefilter + the sig guard) so a post-merge
//      render() — filters unchanged → signature unchanged — never resets the queue.
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_live_refilter.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Structural guard: the live-refilter hook + signature guard are present.
check("render() drives an open dock's refilter (worklistRefilter call)",
  /if \(worklistRefilter\) worklistRefilter\(\);/.test(src));
check("the refilter is signature-guarded (no reset when CCR fields unchanged)",
  /function ccrSig\(\)/.test(src) && /sig === lastCcrSig\) return;/.test(src));

const mk = (id, title, disc, subj) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID", disc: disc,
  credit: "Credit", units: 3, top: "1000.00", subj: subj, members: 2,
  adopted: [], potential: [], conf: 0.8, locked: false,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
});
const rows = [
  mk("ARTS M1001", "Drawing I", "Art", ["ARTS"]),
  mk("ARTS M1002", "Drawing I", "Art", ["ARTS"]),
  mk("BIOL M1001", "General Biology", "Biology", ["BIOL"]),
  mk("BIOL M1002", "General Biology", "Biology", ["BIOL"]),
];
const sugStub = {
  groups: [
    { sig: "Drawing I", n: 2, score: 0.8, members: [
      { id: "ARTS M1001", t: "Drawing I", s: "ARTS", u: 3, k: "M-ID" },
      { id: "ARTS M1002", t: "Drawing I", s: "ARTS", u: 3, k: "M-ID" },
    ] },
    { sig: "General Biology", n: 2, score: 0.8, members: [
      { id: "BIOL M1001", t: "General Biology", s: "BIOL", u: 3, k: "M-ID" },
      { id: "BIOL M1002", t: "General Biology", s: "BIOL", u: 3, k: "M-ID" },
    ] },
  ],
  singleton_groups: [], family_groups: [], desc_groups: [], evidence_groups: [], title_groups: [],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Art", "Biology"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
</script>
</body></html>`;

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

function dockText(doc) {
  const d = doc.querySelector(".uc-worklist-dock");
  return d ? d.textContent : "";
}

(async function main() {
  await sleep(120);
  const doc = window.document;

  const sugBtn = Array.from(doc.querySelectorAll("button, a")).find((b) => /Suggested merges/.test(txt(b)));
  sugBtn.dispatchEvent(new window.Event("click"));
  await sleep(200);

  // ── 1. open with no filter: group 1 (Art) shows ──
  check("dock opens on the Art group", /Drawing I/.test(dockText(doc)) && /1 of 2/.test(dockText(doc)));

  // ── 2. change the CCR Discipline filter → live re-filter to the Biology group ──
  const discSel = doc.getElementById("uc-disc");
  check("CCR discipline filter present", !!discSel);
  discSel.value = "Biology";
  discSel.dispatchEvent(new window.Event("change"));
  await sleep(60);
  check("changing the CCR filter live-refilters the dock to the Biology group",
    /General Biology/.test(dockText(doc)) && !/Drawing I/.test(dockText(doc)));
  check("the counter reflects the live-filtered set ('matching')",
    /of \d+ matching/.test(dockText(doc)));

  // ── 3. carry-over OFF → CCR filter changes no longer disturb the dock ──
  const ccrCb = Array.from(doc.querySelectorAll(".uc-worklist-dock label"))
    .map((l) => ({ l, cb: l.querySelector("input[type=checkbox]") }))
    .find((x) => x.cb && /Match the CCR table filters/.test(txt(x.l)));
  check("carry-over checkbox present in the dock", !!(ccrCb && ccrCb.cb));
  ccrCb.cb.checked = false; ccrCb.cb.dispatchEvent(new window.Event("change"));
  await sleep(40);
  const before = dockText(doc);
  // Flip the discipline filter again; with carry-over OFF the dock must not move.
  discSel.value = "Art"; discSel.dispatchEvent(new window.Event("change"));
  await sleep(60);
  check("with carry-over OFF, a CCR filter change does not disturb the dock",
    dockText(doc) === before);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
