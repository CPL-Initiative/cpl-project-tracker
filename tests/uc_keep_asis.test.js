// Guards the worklist "Keep as-is" affordance (2026-06-12, Sam): a third
// button beside Confirm/Skip that records a PERSISTENT dismissal — one
// kb_curation row (course_id = the group's first live member sorted asc,
// field merge_dismissed, value = the live-member ids sorted asc joined "|")
// — so the group is never re-offered. Skip only advances for the session;
// Keep as-is survives reloads. If a later regen changes the membership, the
// signature differs and the group legitimately re-offers.
//   1. The button renders with the explanatory tooltip.
//   2. Clicking it POSTs the merge_dismissed row with the expected signature
//      and advances to the next group.
//   3. Re-opening the worklist with that dismissal in the overlay fetch
//      skips group 1 and shows group 2 first.
//
// Run from repo root: `npm test` (or `node tests/uc_keep_asis.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkRow = (id, title) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID",
  disc: "Art", credit: "Credit", units: 3.0, top: "1002.00", subj: ["ART"],
  members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
});
const rows = [
  mkRow("ARTS M1001", "Ceramics"), mkRow("ARTS M1002", "Ceramics I"),
  mkRow("ARTS M1003", "Painting"), mkRow("ARTS M1004", "Painting I"),
];
const sugStub = {
  singleton_groups: [], family_groups: [], desc_groups: [], evidence_groups: [], title_groups: [],
  groups: [
    { sig: "ceramics", n: 2, score: 0.9, members: [
      { id: "ARTS M1001", t: "Ceramics", s: "ART", u: 3.0, k: "M-ID" },
      { id: "ARTS M1002", t: "Ceramics I", s: "ART", u: 3.0, k: "M-ID" },
    ] },
    { sig: "painting", n: 2, score: 0.9, members: [
      { id: "ARTS M1003", t: "Painting", s: "ART", u: 3.0, k: "M-ID" },
      { id: "ARTS M1004", t: "Painting I", s: "ART", u: 3.0, k: "M-ID" },
    ] },
  ],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Art"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));

// Mutable dismissal store: empty on the first worklist open; phase 2 swaps in
// the saved row to simulate a fresh page reading the overlay back.
let dismissalRows = [];
const posts = [];
window.fetch = (url, opts) => {
  const u = String(url);
  const method = (opts && opts.method) || "GET";
  if (method !== "GET") posts.push({ url: u, method, body: opts && opts.body ? JSON.parse(opts.body) : null });
  const body = u.indexOf("field=eq.merge_dismissed") >= 0 ? dismissalRows : [];
  return Promise.resolve({ ok: true, status: method === "GET" ? 200 : 201, json: () => Promise.resolve(body) });
};
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw", !threw);

(async function main() {
  await sleep(120);
  const doc = window.document;
  const sugBtn = Array.from(doc.querySelectorAll("button")).find((b) => /Suggested merges/.test(txt(b)));
  check("✨ Suggested merges control present", !!sugBtn);

  // ── 1 + 2. open the worklist, Keep-as-is group 1 ─────────────────────────
  sugBtn.dispatchEvent(new window.Event("click"));
  await sleep(200);
  const overlay1 = doc.body.lastElementChild;
  check("group 1 shows first", /Suggested merge 1 of 2/.test(doc.body.textContent)
    && doc.body.textContent.indexOf("Ceramics") >= 0);
  const keep = Array.from(doc.querySelectorAll("button")).find((b) => txt(b) === "Keep as-is");
  check("Keep as-is button renders alongside Confirm/Skip", !!keep);
  check("Keep as-is carries the explanatory tooltip",
    keep && keep.getAttribute("title") === "These stay separate — don't suggest this group again (unless its membership changes)");

  keep.dispatchEvent(new window.Event("click"));
  await sleep(150);
  const post = posts.find((p) => p.method === "POST" && p.url.indexOf("kb_curation") >= 0
    && Array.isArray(p.body) && p.body.some((i) => i.field === "merge_dismissed"));
  check("dismissal POSTed to kb_curation", !!post);
  const item = post && post.body.find((i) => i.field === "merge_dismissed");
  check("dismissal keyed by the group's FIRST live member (sorted asc)",
    item && item.course_id === "ARTS M1001");
  check("dismissal value = live-member ids sorted asc joined with |",
    item && item.value === "ARTS M1001|ARTS M1002");
  check("worklist advanced to group 2 after Keep as-is",
    /Suggested merge 2 of 2/.test(doc.body.textContent));

  // ── 3. re-open with the dismissal in the overlay: group 1 is skipped ─────
  overlay1.dispatchEvent(new window.Event("click"));   // backdrop click closes
  await sleep(50);
  check("worklist closed", !/Suggested merge \d of/.test(doc.body.textContent));
  dismissalRows = [{ course_id: item.course_id, value: item.value }];
  sugBtn.dispatchEvent(new window.Event("click"));
  await sleep(200);
  check("re-open skips the dismissed group (group 2 shows first)",
    /Suggested merge 2 of 2/.test(doc.body.textContent)
    && !/Suggested merge 1 of 2/.test(doc.body.textContent));
  // Scope the member check to the worklist overlay (the main table behind it
  // legitimately still lists ARTS M1001 — it was dismissed, not merged).
  const overlay2 = doc.body.lastElementChild;
  check("group 2's members render in the worklist (Painting), group 1's do not",
    overlay2.textContent.indexOf("ARTS M1003") >= 0
    && overlay2.textContent.indexOf("ARTS M1001") < 0);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
