// Guards the DESCRIPTION-EVIDENCE worklist lane (Session 45 —
// kb/_desc_consolidation_dryrun.py + the desc_groups join in
// export_unified_courses()): DARK M-IDs (no official evidence anywhere)
// whose catalog descriptions match across colleges surface as a fourth
// suggestion section, merging into an existing identity like family groups.
//
//  A. Committed producer output: desc_groups exists in the suggestions
//     payload; every member id is a live mergeable row (M-ID/Unified, not
//     locked); groups are >= 2 members; cross-college groups rank before
//     same_college ones.
//  B. jsdom drive of the real consumer with a stubbed payload: the 📝 badge
//     renders; the explainer carries the similarity + shared terms; members
//     start CHECKED; Confirm fires the curation write (fetch POST) and
//     advances; the same_college group shows the amber variants banner.
//
// Run from repo root: `npm test` (or `node tests/uc_desc_lane.test.js`).
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
const data = loadPayload("unified_courses_data.js", "window.CPL_UNIFIED_COURSES");
const byId = {};
data.rows.forEach((r) => { byId[r.id] = r; });
const sug = loadPayload("unified_courses_suggestions.js", "window.CPL_UC_SUGGESTIONS");
const dg = sug.desc_groups || [];

check("desc_groups present in the suggestions payload", Array.isArray(dg) && dg.length >= 50);
check("desc_count matches", sug.desc_count === dg.length);
check("every desc group has >= 2 members", dg.every((g) => g.members.length >= 2 && g.n === g.members.length));
check("every desc member is a live mergeable row (M-ID/Unified, unlocked)",
  dg.every((g) => g.members.every((m) => {
    const r = byId[m.id];
    return r && !r.locked && (r.id_system === "M-ID" || r.id_system === "Unified");
  })));
check("cross-college groups rank before same_college ones",
  (() => { const f = dg.findIndex((g) => g.same_college);
           return f === -1 || dg.slice(f).every((g) => g.same_college); })());
check("groups carry similarity scores + shared terms",
  dg.every((g) => typeof g.score === "number" && Array.isArray(g.terms)));
// the marquee find: the fragmented infant/toddler ECED family groups together.
// Found by TITLE family, never by pinned M-ID — re-mints re-sequence ids with
// slot reuse (the survivor rode ECED M1098 → M1087 in the 2026-06-12 SUBJ4
// fold; member titles travel with the rows). The family = the desc group with
// the most infant/toddler-titled ECED members (≥4 = the fragmentation).
const infTod = (t) => /infant/i.test(t || "") && /toddler/i.test(t || "");
const ecedG = dg.filter((g) => g.members.filter((m) => infTod(m.t) && /^ECED /.test(m.id || "")).length >= 4)
  .sort((a, b) => b.members.length - a.members.length)[0];
check("the ECED infant/toddler fragmentation surfaces as one desc group",
  !!ecedG && ecedG.members.length >= 4
  && ecedG.members.some((m) => /care/i.test(m.t || "")));

// ── B. jsdom consumer drive (stubbed payload — UI mechanics) ───────────────
const src = fs.readFileSync("unified_courses.js", "utf8");
const rows = [
  { kind: "Course", id: "FIRE M9001", title: "I-200 Basic Incident Command System", id_system: "M-ID",
    disc: "Fire Technology", credit: "Credit", units: 0.5, top: "2133.00", subj: ["FIRE"],
    members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
  { kind: "Course", id: "FIRE M9002", title: "I-200 Incident Command System", id_system: "M-ID",
    disc: "Fire Technology", credit: "Credit", units: 0.5, top: "2133.00", subj: ["FIRE"],
    members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
  { kind: "Course", id: "ARTS M9003", title: "Ceramics Studio", id_system: "M-ID",
    disc: "Art", credit: "Credit", units: 3.0, top: "1002.00", subj: ["ARTS"],
    members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
  { kind: "Course", id: "ARTS M9004", title: "Studio Ceramics Practice", id_system: "M-ID",
    disc: "Art", credit: "Credit", units: 3.0, top: "1002.00", subj: ["ARTS"],
    members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
];
const sugStub = {
  groups: [], singleton_groups: [], family_groups: [], evidence_groups: [],
  desc_count: 2,
  desc_groups: [
    { sig: "I-200 Incident Command System", n: 2, score: 0.98, cos_max: 1.0,
      same_college: false, terms: ["briefings", "delegation", "transfers"],
      members: [
        { id: "FIRE M9002", t: "I-200 Incident Command System", s: "FIRE", u: 0.5, k: "M-ID" },
        { id: "FIRE M9001", t: "I-200 Basic Incident Command System", s: "FIRE", u: 0.5, k: "M-ID" },
      ] },
    { sig: "Ceramics Studio", n: 2, score: 0.91, cos_max: 0.91,
      same_college: true, terms: ["glaze", "kiln"],
      members: [
        { id: "ARTS M9003", t: "Ceramics Studio", s: "ARTS", u: 3.0, k: "M-ID" },
        { id: "ARTS M9004", t: "Studio Ceramics Practice", s: "ARTS", u: 3.0, k: "M-ID" },
      ] },
  ],
};
const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A", "B"], mq_disciplines: ["Fire Technology", "Art"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
const posts = [];
window.fetch = (url, opts) => {
  const method = (opts && opts.method) || "GET";
  if (method !== "GET") posts.push({ url: String(url), method, body: opts && opts.body });
  return Promise.resolve({ ok: true, status: method === "GET" ? 200 : 201, json: () => Promise.resolve([]) });
};
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("consumer init does not throw", !threw);

(async function main() {
  await sleep(120);
  const doc = window.document;

  const sugBtn = Array.from(doc.querySelectorAll("button, a")).find((b) => /Suggested merges/.test(txt(b)));
  check("✨ Suggested merges control present", !!sugBtn);
  sugBtn.dispatchEvent(new window.Event("click"));
  await sleep(250);

  check("📝 Description-evidence badge renders",
    /Description evidence · same catalog description/.test(doc.body.textContent));
  check("explainer carries the similarity score and shared terms",
    /NO official identity evidence/.test(doc.body.textContent)
    && /0\.98/.test(doc.body.textContent)
    && /briefings/.test(doc.body.textContent));
  const boxes = Array.from(doc.querySelectorAll("div")).filter((d) => /Suggested merge 1 of/.test(txt(d)));
  const box = boxes[boxes.length - 1];
  const cbs = box ? Array.from(box.querySelectorAll("input[type=checkbox]")) : [];
  check("both members render with checkboxes pre-CHECKED",
    cbs.length === 2 && cbs.every((cb) => cb.checked));
  check("cross-college group shows NO same-college banner",
    !/shares a member college/.test(doc.body.textContent));

  // Confirm the merge — the curation write fires and the worklist advances.
  const go = Array.from(doc.querySelectorAll("button")).find((b) => /Confirm merge/.test(txt(b)));
  check("Confirm merge button present", !!go);
  go.dispatchEvent(new window.Event("click"));
  await sleep(300);
  check("Confirm fired the curation write (fetch POST)", posts.length >= 1);
  check("worklist advanced to the same_college group",
    /Suggested merge 2 of 2/.test(doc.body.textContent));
  check("same_college desc group shows the amber variants banner",
    /shares a member college/.test(doc.body.textContent));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
