// Guards the CCR worklist's EVIDENCE LANE + the R2 witness badges
// (2026-06-11, docs/official_id_fold_scope.md). Two halves:
//
//  A. Committed producer output (unified_courses_suggestions.js +
//     unified_courses_data.js — the pii_guard/family-merges pattern):
//     evidence_groups exist; every group leads with the OFFICIAL id; every
//     claimant carries its 🧾 witness distribution (ev); contested members
//     (multi-target evidence) are flagged x:1; the motivating case holds —
//     the bare-titled "Intermediate Spanish" M-ID (was FLSP M1379,
//     era-dependent) is surfaced CONTESTED under SPAN 200 (8 vs 6
//     witnesses), while the clean variants ("Intermediate Spanish I" etc.)
//     auto-folded into the SPAN 200/210 anchors via Phase B and are NOT
//     separate rows. M-IDs are derived by TITLE at runtime (slot reuse).
//
//  B. jsdom drive of the real consumer (unified_courses.js) with a stubbed
//     suggestions payload: the 🧾 evidence section renders; witness chips
//     show; the contested member starts UNCHECKED; the official title is the
//     dialog default; Confirm writes merge_into -> the official id for the
//     checked claimant ONLY, and never writes unified_title/discipline on
//     the official target.
//
// Run from repo root: `npm test` (or `node tests/uc_evidence_lane.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadPayload(file, globalName) {
  const src = fs.readFileSync(file, "utf8");
  const i = src.indexOf(globalName);
  let s = src.slice(src.indexOf("=", i) + 1).trim();
  if (s.endsWith(";")) s = s.slice(0, -1);
  return JSON.parse(s);
}

// ── A. committed producer output ────────────────────────────────────────────
const sug = loadPayload("unified_courses_suggestions.js", "window.CPL_UC_SUGGESTIONS");
const eg = sug.evidence_groups || [];
check("evidence_groups present in the payload", Array.isArray(eg) && eg.length > 0);
check("evidence_count matches the array length", sug.evidence_count === eg.length);
check("every evidence group has >= 2 members", eg.every((g) => (g.members || []).length >= 2));
check("every evidence group LEADS with the official id (C-ID/CCN-ID first)",
  eg.every((g) => g.members[0] && (g.members[0].k === "C-ID" || g.members[0].k === "CCN-ID")
                  && g.members[0].id === g.sig));
check("every non-official member carries its witness distribution (ev)",
  eg.every((g) => g.members.slice(1).every((m) => m.ev && Object.keys(m.ev).length >= 1)));
check("every contested member (x:1) has multi-target evidence OR failed the kinship title check (tm)",
  eg.every((g) => g.members.every((m) => !m.x || Object.keys(m.ev || {}).length > 1 || m.tm)));
check("every clean member (no x) has single-target evidence",
  eg.every((g) => g.members.slice(1).every((m) => m.x || Object.keys(m.ev || {}).length === 1)));

// Mechanism-style pins (post 2026-06-12 SUBJ4 fold): every M-ID below is
// DERIVED by TITLE at runtime, never hardcoded — re-mints re-sequence ids
// with slot reuse (the contested bare row rode FLSP M1379 → M1099; the clean
// variants rode M1342 → M1090, M1043 → M1004, M1352 → M1093, M1045 → M1005;
// a vacated id may hold an unrelated course next regen). Titles travel with
// rows; the C-ID anchors (SPAN 200/210) are official and stable.
const isBareIntSpanish = (m) =>
  m.k === "M-ID" && /^intermediate spanish$/i.test((m.t || "").trim());
const span200 = eg.find((g) => g.sig === "SPAN 200");
check("SPAN 200 evidence group surfaced", !!span200);
let bareLane = null;
if (span200) {
  bareLane = span200.members.find(isBareIntSpanish);
  check("the bare-titled 'Intermediate Spanish' M-ID surfaces under SPAN 200", !!bareLane);
  check("the bare claimant is CONTESTED (x:1 — its colleges split between SPAN 200/210)",
    bareLane && bareLane.x === 1 && bareLane.ev
    && bareLane.ev["SPAN 200"] >= 1 && bareLane.ev["SPAN 210"] >= 1);
  check("no clean 'Intermediate Spanish 1' variant queues in the lane (it auto-folded via Phase B)",
    !span200.members.some((m) =>
      m.k === "M-ID" && /^intermediate spanish (i|1)$/i.test((m.t || "").trim())));
}

const data = loadPayload("unified_courses_data.js", "window.CPL_UNIFIED_COURSES");
const byId = {};
data.rows.forEach((r) => { byId[r.id] = r; });
const s200 = byId["SPAN 200"], s210 = byId["SPAN 210"];
// The folds are asserted via the anchors' title_variants (the folded
// variants' titles travel onto the surviving row) + fold counts. Variant
// titles are post-normalization (2026-06-12: romans→digits — "Intermediate
// Spanish I" now reads "Intermediate Spanish 1").
check("SPAN 200 anchor row consolidated the Intermediate-Spanish-1 family",
  s200 && (s200.consolidated_from || []).length >= 2
       && (s200.title_variants || []).indexOf("Intermediate Spanish 1") >= 0
       && (s200.title_variants || []).indexOf("Spanish 3") >= 0);
check("SPAN 210 anchor row consolidated the 2/4 family (plurality 24:1 included)",
  s210 && (s210.consolidated_from || []).length >= 2
       && (s210.title_variants || []).indexOf("Intermediate Spanish 2") >= 0
       && (s210.title_variants || []).indexOf("Spanish 4") >= 0);
const folded = ((s200 && s200.consolidated_from) || [])
  .concat((s210 && s210.consolidated_from) || []);
check("folded variants are no longer separate CCR rows",
  folded.length >= 4 && folded.every((id) => !byId[id]));
const bareRow = bareLane && byId[bareLane.id];
check("the bare 'Intermediate Spanish' M-ID stays a row, conflict-badged with the witness distribution",
  bareRow && /^intermediate spanish$/i.test((bareRow.title || "").trim())
    && (bareRow.match || {}).cid_conflict && (bareRow.match || {}).evidence);

// ── B. jsdom consumer drive (stubbed payload — UI mechanics) ───────────────
const src = fs.readFileSync("unified_courses.js", "utf8");
const rows = [
  { kind: "Course", id: "FLSP M1379", title: "Intermediate Spanish", id_system: "M-ID",
    disc: "Foreign Languages", credit: "Credit", units: 4.0, top: "1105.00", subj: ["SPAN"],
    members: 24, adopted: [], potential: [], conf: 0.8, locked: false,
    match: { cid_conflict: ["SPAN 200", "SPAN 210"],
             evidence: { "C-ID:SPAN 200": 8, "C-ID:SPAN 210": 6 } },
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
  { kind: "Course", id: "FLSP M1246", title: "Third Course in Spanish", id_system: "M-ID",
    disc: "Foreign Languages", credit: "Credit", units: 5.0, top: "1105.00", subj: ["SPAN"],
    members: 5, adopted: [], potential: [], conf: 0.8, locked: false,
    match: { cid: "SPAN 200", evidence: { "C-ID:SPAN 200": 1 } },
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
];
const sugStub = {
  groups: [], singleton_groups: [], family_groups: [],
  evidence_count: 1,
  evidence_groups: [{
    sig: "SPAN 200", official: "Intermediate Spanish I", n: 3, score: 9,
    members: [
      { id: "SPAN 200", t: "Intermediate Spanish I", s: "SPAN", u: null, k: "C-ID" },
      { id: "FLSP M1246", t: "Third Course in Spanish", s: "SPAN", u: 5.0, k: "M-ID",
        ev: { "SPAN 200": 1 } },
      { id: "FLSP M1379", t: "Intermediate Spanish", s: "SPAN", u: 4.0, k: "M-ID",
        ev: { "SPAN 200": 8, "SPAN 210": 6 }, x: 1 },
    ],
  }],
};
const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Foreign Languages"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
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
  const method = (opts && opts.method) || "GET";
  calls.push({ url: String(url), method: method, body: opts && opts.body ? JSON.parse(opts.body) : null });
  return Promise.resolve({ ok: true, status: method === "GET" ? 200 : 201, json: () => Promise.resolve([]) });
};
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("consumer init does not throw", !threw);

(async function main() {
  await sleep(120);
  const doc = window.document;

  // R2 witness counts in the match badge tooltips (signed-out-visible UI)
  const badges = Array.from(doc.querySelectorAll(".uc-badge"));
  const conflictBadge = badges.find((b) => /CID conflict/.test(txt(b)));
  check("conflict badge carries the witness distribution in its tooltip",
    conflictBadge && /SPAN 200 ×8/.test(conflictBadge.getAttribute("title") || "")
                  && /SPAN 210 ×6/.test(conflictBadge.getAttribute("title") || ""));
  const cidBadge = badges.find((b) => /→ CID SPAN 200/.test(txt(b)));
  check("CID match badge carries its witness count in the tooltip",
    cidBadge && /SPAN 200 ×1/.test(cidBadge.getAttribute("title") || ""));

  // Open the ✨ worklist — the stub has ONLY the evidence group.
  const sugBtn = Array.from(doc.querySelectorAll("button, a")).find((b) => /Suggested merges/.test(txt(b)));
  check("✨ Suggested merges control present", !!sugBtn);
  sugBtn.dispatchEvent(new window.Event("click"));
  await sleep(250);

  check("evidence section badge renders with the target id",
    /COCI evidence/.test(doc.body.textContent) && /fold into SPAN 200/.test(doc.body.textContent));
  check("witness chips render (🧾 SPAN 200 ×8 · SPAN 210 ×6)",
    /SPAN 200 ×8/.test(doc.body.textContent) && /SPAN 210 ×6/.test(doc.body.textContent));

  const dialogBoxes = Array.from(doc.querySelectorAll("div")).filter((d) => /Proposed unified title/.test(txt(d)));
  const box = dialogBoxes[dialogBoxes.length - 1];
  const cbRows = Array.from(box.querySelectorAll("input[type=checkbox]"));
  check("3 member checkboxes render", cbRows.length === 3);
  const rowOf = (id) => cbRows.find((cb) => (cb.parentNode.textContent || "").indexOf(id) >= 0);
  // Candidates start UNCHECKED (Sam, S70); only the official ★ target is pre-checked.
  check("official target starts CHECKED; clean claimant starts UNCHECKED (curator opts in)",
    rowOf("SPAN 200") && rowOf("SPAN 200").checked && rowOf("FLSP M1246") && !rowOf("FLSP M1246").checked);
  check("contested claimant (x:1) starts UNCHECKED",
    rowOf("FLSP M1379") && !rowOf("FLSP M1379").checked);
  const titleIn = box.querySelector("input[type=text]");
  check("dialog title defaults to the OFFICIAL descriptor title",
    titleIn && titleIn.value === "Intermediate Spanish I");

  // Opt the CLEAN claimant in; leave the contested (x:1) member unchecked.
  rowOf("FLSP M1246").checked = true;
  rowOf("FLSP M1246").dispatchEvent(new window.Event("change"));
  await sleep(20);

  // Confirm: checked = official + clean claimant; contested stays out.
  const goBtn = Array.from(box.querySelectorAll("button")).find((b) => /Confirm merge/.test(txt(b)));
  check("Confirm button present", !!goBtn);
  goBtn.dispatchEvent(new window.Event("click"));
  await sleep(150);
  const post = calls.find((c) => c.method === "POST" && c.url.indexOf("kb_curation") >= 0 && Array.isArray(c.body));
  check("confirm wrote a curation batch", !!post);
  check("clean claimant got merge_into -> SPAN 200",
    post && post.body.some((i) => i.course_id === "FLSP M1246" && i.field === "merge_into" && i.value === "SPAN 200"));
  check("contested claimant got NO write (stayed unchecked)",
    post && !post.body.some((i) => i.course_id === "FLSP M1379"));
  check("official target got NO unified_title/discipline writes",
    post && !post.body.some((i) => i.course_id === "SPAN 200" && (i.field === "unified_title" || i.field === "discipline")));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
