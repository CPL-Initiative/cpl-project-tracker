// Guards the Session-57 Suggested-merges polish (Sam, 2026-06-16):
//   - task 2: the Proposed unified title defaults to the ★ merge target's
//     CLEANED name — "(NC)" / noncredit noise never rides along as the minted
//     common-course title (it used to default to the LONGEST member title,
//     which surfaced the noisy variant — the screenshot's "Voice (NC)").
//   - task 3: each candidate row carries a ⓘ description toggle that lazy-loads
//     CPL_UC_DETAILS inline so a curator can disambiguate without leaving the popup.
//   - task 4: a fresh-mint group PRE-SELECTS the modal member discipline (so the
//     curator just confirms) instead of a bare "— choose —".
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_polish.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkRow = (id, title, disc) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID",
  disc: disc || "Music", credit: "Credit", units: 1.0, top: "1004.00", subj: ["MUS"],
  members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
});
// The screenshot's group: an M-ID "Voice" (the ★ target) + a Stand-Alone
// "Voice (NC)". The OLD heuristic proposed "Voice (NC)" (longest); the new one
// proposes the target's cleaned "Voice".
const rows = [mkRow("MUSI M1548", "Voice", "Music")];
const sugStub = {
  family_groups: [], desc_groups: [], evidence_groups: [], title_groups: [],
  groups: [
    { sig: "voice", n: 2, score: 0.69, members: [
      { id: "MUSI M1548", t: "Voice", s: "MUS", u: 1.0, k: "M-ID", d: "Music" },
      { id: "MUSI M90FT", t: "Voice (NC)", s: "MUS", u: 0, k: "Stand-Alone", g: 1, d: "Music" },
    ] },
  ],
  // an all-Stand-Alone mint group: modal cleaned title "Jazz Voice", modal disc "Music".
  singleton_groups: [
    { sig: "jazz voice", n: 2, score: 0.8, same_college: false, members: [
      { id: "MUSI SA1", t: "Jazz Voice (NC)", s: "MUS", u: 1.0, k: "Stand-Alone", g: 1, d: "Music" },
      { id: "MUSI SA2", t: "Jazz Voice", s: "MUS", u: 1.0, k: "Stand-Alone", g: 1, d: "Music" },
    ] },
  ],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Music", "Art"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
  window.CPL_UC_DETAILS = ${JSON.stringify({ "MUSI M90FT": { d: "Noncredit voice technique and performance practice." } })};
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

// The currently-rendered worklist group box (renderGroup re-fills it).
function curBox(doc) {
  const boxes = Array.from(doc.querySelectorAll("div")).filter((d) => /Proposed unified title/.test(txt(d)));
  return boxes[boxes.length - 1];
}

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw", !threw);

(async function main() {
  await sleep(120);
  const doc = window.document;
  const sugBtn = Array.from(doc.querySelectorAll("button")).find((b) => /Suggested merges/.test(txt(b)));
  check("✨ Suggested merges control present", !!sugBtn);
  sugBtn.dispatchEvent(new window.Event("click"));
  await sleep(200);

  // ── task 2: clean target title is the proposed default ─────────────────────
  let box = curBox(doc);
  const titleIn = box && box.querySelector('input[type="text"]');
  check("proposed title defaults to the ★ target's CLEANED name (no '(NC)')",
    titleIn && titleIn.value === "Voice");

  // ── task 3: per-candidate ⓘ description toggle lazy-loads CPL_UC_DETAILS ────
  const rowsList = Array.from(box.querySelectorAll("input[type=checkbox]")).map((cb) => cb.parentNode);
  const ncRow = rowsList.find((r) => /MUSI M90FT/.test(txt(r)));
  const dTog = ncRow && Array.from(ncRow.querySelectorAll("a")).find((a) => txt(a) === "ⓘ");
  check("each candidate row carries a ⓘ description toggle", !!dTog);
  dTog.dispatchEvent(new window.Event("click"));
  await sleep(80);
  check("clicking ⓘ reveals the lazy-loaded catalog description",
    /Noncredit voice technique/.test(txt(box)));

  // ── advance to the singleton-only mint group ───────────────────────────────
  const skip = Array.from(doc.querySelectorAll("button")).find((b) => /Skip/.test(txt(b)));
  skip.dispatchEvent(new window.Event("click"));
  await sleep(80);
  box = curBox(doc);

  // ── task 2 (mint): modal cleaned title wins over the "(NC)" variant ─────────
  const titleIn2 = box && box.querySelector('input[type="text"]');
  check("mint proposed title is the modal cleaned title ('Jazz Voice')",
    titleIn2 && titleIn2.value === "Jazz Voice");

  // ── task 4: mint pre-selects the modal member discipline, ENABLED ──────────
  const discSel = box.querySelector("select.uc-filter");
  check("discipline select is ENABLED for a mint", discSel && discSel.disabled === false);
  check("discipline PRE-SELECTED to the modal member discipline (Music)",
    discSel && discSel.value === "Music");

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
