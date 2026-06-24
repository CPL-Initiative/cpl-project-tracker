// Session 71 (PR-2b): the per-row ⚇ Merge dialog now embeds the SHARED merge-
// editor (the same one as the ✨ worklist), with the in-row ★ target model. This
// guards the two things consolidation had to PRESERVE / give the per-row surface:
//
//   1. The dialog renders the shared editor (Proposed unified title + Candidates
//      list + ✓ Confirm merge), seeded with the opened row as the ★ target — and
//      NO "Merge into" dropdown.
//   2. Re-discipline-on-merge (#503) survives: merging a NON-official M-ID into a
//      twin keeps the discipline picker ENABLED, and changing it to a DIFFERENT
//      discipline writes a discipline curation on the survivor (re-keys Common
//      SUBJ per §11). Merging into an OFFICIAL anchor is firewalled (separately
//      covered by uc_official_anchor_target).
//
// Run from repo root: `npm test` (or `node tests/uc_merge_dialog_shared_editor.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkRow = (id, title, disc, extra) => Object.assign({
  kind: "Course", id: id, title: title, id_system: "M-ID", disc: disc,
  credit: "Credit", units: 3, top: "1002.00", subj: ["PHOT"], members: 2,
  adopted: [], potential: [], conf: 0.7,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
  locked: false,
}, extra || {});

// Two same-title Photography M-IDs (the seed + a twin to fold in).
const rows = [
  mkRow("PHOT M1100", "Digital Photography", "Photography", { members: 12 }),
  mkRow("PHOT M1201", "Digital Photography", "Photography", { members: 4 }),
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Photography", "Art History"], topmap: {} })};
  window.CPL_UC_INDEX = ${JSON.stringify([
    ["PHOT M1100", "Digital Photography", "PHOT", "M-ID", 3],
    ["PHOT M1201", "Digital Photography", "PHOT", "M-ID", 3],
  ])};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
const calls = [];
window.fetch = (url, opts) => {
  const u = String(url), method = (opts && opts.method) || "GET";
  calls.push({ url: u, method: method, body: opts && opts.body ? JSON.parse(opts.body) : null });
  let body = [];
  if (u.indexOf("allowed_reviewers") >= 0) body = [{ email: "test@rccd.edu" }];
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
  function candCb(id) { const r = candRow(id); return r && r.querySelector("input.uc-cand-cb"); }
  function starShown(id) {
    const r = candRow(id); if (!r) return false;
    const b = Array.from(r.querySelectorAll("span")).find((s) => /★\s*merge target/.test(txt(s)));
    return !!(b && b.style.display !== "none");
  }

  rowFor("PHOT M1100").querySelector("a.uc-merge-link").dispatchEvent(new window.Event("click"));
  await sleep(300);

  // ── 1. shared editor, in-row ★, no dropdown ──
  check("dialog renders the shared editor's Proposed unified title",
    /Proposed unified title/.test(doc.body.textContent));
  check("the opened seed is the ★ target (in-row model)", starShown("PHOT M1100"));
  check("there is NO 'Merge into' dropdown",
    !Array.from(doc.querySelectorAll("option")).some((o) => /Mint a NEW unified course/.test(o.textContent)));

  // ── 2. re-discipline-on-merge (#503) preserved ──
  const discSel = Array.from(doc.querySelectorAll("select.uc-filter")).pop();
  check("discipline picker is ENABLED for a non-official M-ID survivor", discSel && discSel.disabled === false);
  check("discipline pre-filled from the survivor (Photography)", discSel && discSel.value === "Photography");

  const twinCb = candCb("PHOT M1201");
  twinCb.checked = true; twinCb.dispatchEvent(new window.Event("change"));
  await sleep(20);
  // Re-discipline the survivor to a DIFFERENT discipline.
  discSel.value = "Art History"; discSel._userPicked = true; discSel.dispatchEvent(new window.Event("change"));
  await sleep(20);

  const goBtn = Array.from(doc.querySelectorAll("button")).find((b) => /✓ Confirm merge/.test(txt(b)));
  goBtn.dispatchEvent(new window.Event("click"));
  await sleep(150);

  const post = calls.find((c) => c.method === "POST" && c.url.indexOf("kb_curation") >= 0 && Array.isArray(c.body));
  check("consolidation saved", !!post);
  check("twin folds into the seed survivor (merge_into -> PHOT M1100)",
    post && post.body.some((i) => i.field === "merge_into" && i.value === "PHOT M1100" && i.course_id === "PHOT M1201"));
  check("re-discipline WRITES a discipline curation on the survivor (Art History)",
    post && post.body.some((i) => i.field === "discipline" && i.value === "Art History" && i.course_id === "PHOT M1100"));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
