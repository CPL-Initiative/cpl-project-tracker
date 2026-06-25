// Session 72 followup (Sam's wave-5 review) — three worklist refinements:
//   Item 2 — a KEYWORD surfaces ALL matching courses as candidates, even one
//     whose title similarity is below the slider's Tight threshold (the keyword
//     is an explicit override of the similarity gate; also decoupled from the
//     CCR table filters — see uc_worklist_live_refilter / _target_and_filters).
//   Item 3 — SINGLE-COURSE RENAME: when only the ★ target is checked (nothing to
//     merge with) and the Proposed title is edited, the Confirm button becomes
//     "✓ Save" and writes unified_title to that one course (NO merge_into).
//   Item 4 — the header carries Prev/Next (‹ ›) so you can step BACKWARD without
//     scrolling to the bottom pager.
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_polish_wave5.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mk = (id, title, subj) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID", disc: "Foreign Languages",
  credit: "Credit", units: 4, top: "1105.00", subj: subj, members: 2,
  adopted: [], potential: [], conf: 0.7, locked: false,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
});
const rows = [
  mk("RUSS M1002", "Russian 1", ["RUSS"]),
  mk("RUSS M1006", "Russian I", ["RUSS"]),
  mk("FREN M2001", "French 1", ["FREN"]),
  mk("FREN M2002", "French I", ["FREN"]),
  // A multi-subject over-merge whose title is LOW-similarity to "Russian 1"
  // (Jaccard well under Tight) but still contains the keyword "russian" — it
  // must surface via the keyword path, not the similarity slider (item 2).
  mk("FLRU M1004", "Intensive Beginning Russian for Heritage Speakers", ["ARAB", "FREN", "RUSS"]),
];
const grp = (sig, a, b) => ({ sig: sig, n: 2, score: 0.9, members: [
  { id: a, t: rows.find((r) => r.id === a).title, s: rows.find((r) => r.id === a).subj[0], u: 4, k: "M-ID", d: "Foreign Languages" },
  { id: b, t: rows.find((r) => r.id === b).title, s: rows.find((r) => r.id === b).subj[0], u: 4, k: "M-ID", d: "Foreign Languages" },
] });
const sugStub = {
  singleton_groups: [], family_groups: [], desc_groups: [], evidence_groups: [], title_groups: [],
  groups: [grp("russian", "RUSS M1002", "RUSS M1006"), grp("french", "FREN M2001", "FREN M2002")],
};
// Index includes the over-merge row so the keyword candidate search can find it.
const idx = rows.map((r) => [r.id, r.title, r.subj.join(";"), "Course", r.units]);

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Foreign Languages"], topmap: {} })};
  window.CPL_UC_INDEX = ${JSON.stringify(idx)};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
// Tight by default so the keyword (not the slider) is what surfaces the
// low-similarity over-merge row in item 2.
window.localStorage.setItem("cplCandLoosen.v1", "0");
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
const posts = [];
window.fetch = (url, opts) => {
  const method = (opts && opts.method) || "GET";
  if (method !== "GET") posts.push({ url: String(url), body: (opts && opts.body) || "" });
  let body = []; if (String(url).indexOf("allowed_reviewers") >= 0) body = [{ email: "test@rccd.edu" }];
  return Promise.resolve({ ok: true, status: method === "GET" ? 200 : 201, json: () => Promise.resolve(body) });
};
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw", !threw);

const doc = window.document;
function dock() { return doc.querySelector(".uc-worklist-dock"); }
function dockText() { var d = dock(); return d ? d.textContent : ""; }
function openWorklist() {
  Array.from(doc.querySelectorAll("button, a")).find((b) => /Suggested merges/.test(txt(b)))
    .dispatchEvent(new window.Event("click"));
}
function closeWorklist() {
  Array.from(doc.querySelectorAll(".uc-worklist-dock button")).filter((b) => txt(b) === "✕")
    .forEach((b) => b.dispatchEvent(new window.Event("click")));
}
function goButton() {
  return Array.from(dock().querySelectorAll("button")).find((b) => /Confirm merge|✓ Save|Create unified/.test(txt(b)));
}
function worklistSearch() {
  return Array.from(dock().querySelectorAll("input[type=search]")).find((i) => /comma separates terms/.test(i.placeholder || ""));
}

(async function main() {
  await sleep(140);

  // ── Item 4: header Prev/Next pager ────────────────────────────────────────
  openWorklist();
  await sleep(220);
  const headBtns = Array.from(dock().querySelectorAll("button"));
  const headPrev = headBtns.find((b) => txt(b) === "‹");
  const headNext = headBtns.find((b) => txt(b) === "›");
  check("header has a ‹ Prev button", !!headPrev);
  check("header has a › Next button", !!headNext);
  check("at the first group, ‹ Prev is disabled", headPrev && headPrev.disabled === true);
  check("a › Next is enabled (a second group exists)", headNext && headNext.disabled === false);
  check("worklist starts on the Russian group", /Russian/.test(dockText()) && !/French/.test(dockText()));
  headNext.dispatchEvent(new window.Event("click"));
  await sleep(80);
  check("clicking › advances to the French group", /French/.test(dockText()));
  const headPrev2 = Array.from(dock().querySelectorAll("button")).find((b) => txt(b) === "‹");
  check("‹ Prev is now enabled (can step backward)", headPrev2 && headPrev2.disabled === false);
  headPrev2.dispatchEvent(new window.Event("click"));
  await sleep(80);
  check("clicking ‹ steps BACK to the Russian group", /Russian/.test(dockText()) && !/French/.test(dockText()));
  closeWorklist();
  await sleep(40);

  // ── Item 2: a keyword surfaces a low-similarity matching course ───────────
  openWorklist();
  await sleep(240);   // loadIndex + Tight auto-surface
  check("at Tight, the low-similarity over-merge row is NOT pre-surfaced",
    !/Heritage Speakers/.test(dockText()));
  const search = worklistSearch();
  check("the worklist Search box is present", !!search);
  search.value = "russian"; search.dispatchEvent(new window.Event("input"));
  await sleep(320);   // group re-render + keyword candidate surface
  check("typing 'russian' surfaces the matching over-merge row as a candidate (item 2)",
    /Heritage Speakers/.test(dockText()));
  closeWorklist();
  await sleep(40);

  // ── Item 3: single-course rename → Save ───────────────────────────────────
  posts.length = 0;
  openWorklist();
  await sleep(240);
  // Opt-in: only the ★ target is pre-checked → exactly one course checked.
  var go = goButton();
  check("with one course checked and no edit, the button reads Confirm merge (disabled)",
    go && /Confirm merge/.test(txt(go)) && go.disabled === true);
  const titleIn = dock().querySelector('input[type=text]');
  check("Proposed unified title input present", !!titleIn);
  titleIn.value = "Russian (Beg)"; titleIn.dispatchEvent(new window.Event("input"));
  await sleep(40);
  go = goButton();
  check("editing the title with one course checked flips the button to ✓ Save (enabled)",
    go && /✓ Save/.test(txt(go)) && go.disabled === false);
  go.dispatchEvent(new window.Event("click"));
  await sleep(120);
  const bodies = posts.map((p) => p.body).join("\n");
  check("Save writes unified_title = 'Russian (Beg)' to the single course",
    /"field":\s*"unified_title"/.test(bodies) && /"value":\s*"Russian \(Beg\)"/.test(bodies));
  check("a single-course rename writes NO merge_into pointer",
    !/"field":\s*"merge_into"/.test(bodies));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
