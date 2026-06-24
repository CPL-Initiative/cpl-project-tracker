// Regression tests for the merge-dialog target + merged-course semantics
// (2026-06-10 — the "Weight Training merge surprise"):
//   1. The "Merge into" selector DEFAULTS to the row the curator opened the
//      merge from (a blank default used to silently mint a synthetic UC-CUR
//      course), and the confirm button says exactly what it will do.
//   2. Merging into an EXISTING identity writes NO discipline curation (the
//      target keeps its own discipline; discipline-curation presence stays an
//      explicit-verify signal for the daily regen).
//   3. The merged row CARRIES the members' CPL-impact values (st/eu, max — so
//      it doesn't vanish from the Students/Eligible sorts mid-session).
//   4. The merge does NOT auto-verify (merge ≠ verify): the merged row stays
//      Generated; its Verify affordance PATCHes the separate validated_at/_by
//      stamp on the target's kb_curation rows, then shows Verified.
//
// Run from repo root: `npm test` (or `node tests/uc_merge_target.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkRow = (id, title, subj, units, extra) => Object.assign({
  kind: "Course", id: id, title: title, id_system: "M-ID",
  disc: "Kinesiology", credit: "Credit", units: units, top: "0835.00",
  subj: subj, members: 2, adopted: [], potential: [], conf: 0.7,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
  locked: false,
}, extra || {});

// Seed = the main course (carries the big impact numbers); twin = same title
// (pre-checked exact match); near = a near-title match (left unchecked).
const rows = [
  mkRow("KINE M1015", "Weight Training", ["KIN"], 1.0, { members: 49, st: 4823, eu: 14587.5 }),
  mkRow("KINE M1371", "Weight Training", ["PE"], 1.0, { st: 4404, eu: 11546.0 }),
  mkRow("KINE M1289", "Weight Training - Beginning", ["PE"], 1.0, { members: 24 }),
  mkRow("BIOL M1001", "Biology", ["BIOL"], 4.0),
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Kinesiology"], topmap: {} })};
  window.CPL_UC_INDEX = ${JSON.stringify([
    ["KINE M1015", "Weight Training", "KIN", "M-ID", 1.0],
    ["KINE M1371", "Weight Training", "PE", "M-ID", 1.0],
    ["KINE M1289", "Weight Training - Beginning", "PE", "M-ID", 1.0],
  ])};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;

// Signed-in session: well-formed (fake) JWT + future expiry so ensureFresh
// resolves without any network.
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));

// Record every Supabase write; answer reads with empty sets.
const calls = [];
window.fetch = (url, opts) => {
  const u = String(url);
  const method = (opts && opts.method) || "GET";
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

  // The per-row ⚇ dialog now embeds the SHARED merge-editor (Session 71): the
  // target is the in-row ★, not a "Merge into" dropdown. Helpers to read it.
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
  function confirmBtn() { return Array.from(doc.querySelectorAll("button")).find((b) => /✓ Confirm merge/.test(txt(b))); }

  // ── 1. dialog seeds the opened row as the ★ target ────────────────────────
  const seedRow = rowFor("KINE M1015");
  const mergeLink = seedRow && seedRow.querySelector("a.uc-merge-link");
  check("signed-in row renders an enabled ⚇ Merge link", !!mergeLink);
  mergeLink.dispatchEvent(new window.Event("click"));
  await sleep(300);   // loadIndex + dialog build

  check("the opened seed row is the ★ merge target (in-row model)", starShown("KINE M1015"));
  // Exact/near matches start UNCHECKED (Sam, S70) — opt in the twin to merge it.
  const twinCb = candCb("KINE M1371");
  check("exact-title twin starts UNCHECKED (curator opts in)", twinCb && twinCb.checked === false);
  twinCb.checked = true; twinCb.dispatchEvent(new window.Event("change"));
  await sleep(20);
  check("target stays on the seed M-ID after opting in the twin", starShown("KINE M1015"));
  const goBtn = confirmBtn();
  check("confirm button present (✓ Confirm merge)", !!goBtn);

  // ── 2 + 3 + 4. consolidate into the existing identity ────────────────────
  goBtn.dispatchEvent(new window.Event("click"));
  await sleep(150);

  const post = calls.find((c) => c.method === "POST" && c.url.indexOf("kb_curation") >= 0 && Array.isArray(c.body));
  check("consolidation saved (kb_curation POST)", !!post);
  const fields = post ? post.body.map((i) => i.field) : [];
  check("members got merge_into pointers at the chosen target",
    post && post.body.some((i) => i.field === "merge_into" && i.value === "KINE M1015"));
  check("NO discipline curation written for an existing-identity target",
    post && fields.indexOf("discipline") < 0);

  const tgtRow = rowFor("KINE M1015");
  check("merged member row is folded away", !rowFor("KINE M1371"));
  check("merged row keeps the impact Students value (4,823 — max of members)",
    tgtRow && tgtRow.textContent.indexOf("4,823") >= 0);
  check("merge does NOT auto-verify — no '✔ Verified' on the merged row",
    tgtRow && tgtRow.textContent.indexOf("✔ Verified") < 0);
  const verifyLink = tgtRow && Array.from(tgtRow.querySelectorAll("a")).find((a) => /Verify/.test(txt(a)));
  check("merged row offers the Verify affordance", !!verifyLink);

  // ── 4b. Verify on a merged row records the VALIDATION stamp ──────────────
  verifyLink.dispatchEvent(new window.Event("click"));
  await sleep(120);
  const patch = calls.find((c) => c.method === "PATCH" && c.url.indexOf("kb_curation") >= 0 &&
    c.url.indexOf(encodeURIComponent("KINE M1015")) >= 0);
  check("Verify PATCHes the target's kb_curation rows", !!patch);
  check("the PATCH carries validated_at + validated_by (not a discipline write)",
    patch && !!patch.body.validated_at && patch.body.validated_by === "test@rccd.edu");
  const tgtRow2 = rowFor("KINE M1015");
  check("after Verify the merged row shows Verified", tgtRow2 && tgtRow2.textContent.indexOf("✔ Verified") >= 0);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
