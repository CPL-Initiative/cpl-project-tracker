// Session 72 (StarLander) — fixes the opt-in Confirm no-op (Sam #3: "tried to
// save, at first it didn't do anything"). The Session-70 opt-in model pre-checks
// only the ★ target, so clicking Confirm with a single selection hit the "Check
// at least two members" alert and looked like nothing happened. The fix keeps
// opt-in but makes the dead-end VISIBLE: the Confirm button is DISABLED + dimmed
// until the selection is valid (≥2 checked for a merge/mint) — so it can never
// silently no-op — and re-enables the moment a second member is ticked. Guarded
// on both a 2-member and a 3-member group.
//
// The per-row ⚇ dialog keeps its seed-only pre-check (covered by uc_merge_target).
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_confirm_optin.test.js`).
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
// Group A = exactly 2 members (the silent-no-op case); Group B = 3 members.
const rows = [
  mkRow("ARTS M1001", "Ceramics"), mkRow("ARTS M1002", "Ceramics I"),
  mkRow("ARTS M2001", "Painting"), mkRow("ARTS M2002", "Painting I"), mkRow("ARTS M2003", "Painting II"),
];
const sugStub = {
  singleton_groups: [], family_groups: [], desc_groups: [], evidence_groups: [], title_groups: [],
  groups: [
    { sig: "ceramics", n: 2, score: 0.9, members: [
      { id: "ARTS M1001", t: "Ceramics", s: "ART", u: 3.0, k: "M-ID" },
      { id: "ARTS M1002", t: "Ceramics I", s: "ART", u: 3.0, k: "M-ID" },
    ] },
    { sig: "painting", n: 3, score: 0.9, members: [
      { id: "ARTS M2001", t: "Painting", s: "ART", u: 3.0, k: "M-ID" },
      { id: "ARTS M2002", t: "Painting I", s: "ART", u: 3.0, k: "M-ID" },
      { id: "ARTS M2003", t: "Painting II", s: "ART", u: 3.0, k: "M-ID" },
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

  function candRow(id) {
    return Array.from(doc.querySelectorAll("div"))
      .find((d) => d.querySelector(":scope > input.uc-cand-cb") && d.textContent.indexOf(id) >= 0);
  }
  function candCb(id) { const r = candRow(id); return r && r.querySelector("input.uc-cand-cb"); }
  function confirmBtn() { return Array.from(doc.querySelectorAll("button")).find((b) => /Confirm merge|Create unified/.test(txt(b))); }

  // ── 1. a 2-member worklist group keeps opt-in → Confirm starts DISABLED ────
  check("2-member group: only the ★ target pre-checked (opt-in preserved)",
    candCb("ARTS M1001") && candCb("ARTS M1001").checked === true
    && candCb("ARTS M1002") && candCb("ARTS M1002").checked === false);
  check("2-member group: Confirm DISABLED with a single selection (no silent no-op)",
    confirmBtn() && confirmBtn().disabled === true);
  // Ticking the second course enables Confirm.
  const m2 = candCb("ARTS M1002"); m2.checked = true; m2.dispatchEvent(new window.Event("change"));
  await sleep(20);
  check("2-member group: Confirm ENABLES once both are checked", confirmBtn() && confirmBtn().disabled === false);
  check("2-member help text matches opt-in (no stale 'leave BOTH checked')",
    !/leave BOTH checked/.test(doc.body.textContent));

  // ── advance to the 3-member group ────────────────────────────────────────
  Array.from(doc.querySelectorAll("button")).find((b) => /Skip/.test(txt(b))).dispatchEvent(new window.Event("click"));
  await sleep(60);

  // ── 2. a 3-member group: only ★ pre-checked → Confirm DISABLED until valid ─
  const checkedN = ["ARTS M2001", "ARTS M2002", "ARTS M2003"].filter((id) => candCb(id) && candCb(id).checked).length;
  check("3-member group: only one member pre-checked (opt-in preserved)", checkedN === 1);
  check("3-member group: Confirm DISABLED with a single selection (no silent no-op)", confirmBtn() && confirmBtn().disabled === true);

  // Opt in a second member → Confirm enables.
  const secondCb = candCb("ARTS M2002");
  secondCb.checked = true; secondCb.dispatchEvent(new window.Event("change"));
  await sleep(20);
  check("3-member group: Confirm ENABLES once a second member is checked", confirmBtn() && confirmBtn().disabled === false);

  // Uncheck back to one → disabled again (defensive).
  secondCb.checked = false; secondCb.dispatchEvent(new window.Event("change"));
  await sleep(20);
  check("3-member group: Confirm re-DISABLES when back to one selection", confirmBtn() && confirmBtn().disabled === true);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
