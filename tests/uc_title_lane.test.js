// Guards the TITLE-EVIDENCE worklist lane (Session 46 — the AUTO/smog
// over-mint case study: kb/_title_consolidation_dryrun.py + the
// title_groups join in export_unified_courses()): dark M-IDs PLUS
// Stand-Alone singletons whose titles are near-duplicates under the
// shared guard suite (kb/_consolidation_guards.py) surface as a worklist
// section. Mixed groups merge into the M-ID; all-singleton groups mint a
// new unified course. NO units gate by design (BAR smog: one state spec
// packaged at 1.0-7.0 units across colleges).
//
//  A. Committed producer output: title_groups exists in the suggestions
//     payload; M-ID members are live mergeable rows; Stand-Alone members
//     carry k="Stand-Alone" + g:1; cross-college groups rank before
//     same_college ones; the marquee smog families surface (the combined
//     L1&2 family reunites "Level 1 & 2" with "Level One and Level Two";
//     the Level-2 family crosses SUBJ4 via TOP corroboration).
//  B. jsdom drive of the real consumer with a stubbed payload: the 🏷 badge
//     renders; the explainer carries similarity + the units-spread note;
//     members start CHECKED; Confirm writes merge_into pointing at the
//     M-ID (never the Stand-Alone) and advances; the same_college group
//     shows the amber banner.
//
// Run from repo root: `npm test` (or `node tests/uc_title_lane.test.js`).
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
const tg = sug.title_groups || [];

check("title_groups present in the suggestions payload", Array.isArray(tg) && tg.length >= 1000);
check("title_count matches", sug.title_count === tg.length);
check("every title group has >= 2 members", tg.every((g) => g.members.length >= 2 && g.n === g.members.length));
check("every M-ID member is a live mergeable row; Stand-Alones carry g:1",
  tg.every((g) => g.members.every((m) => {
    if (m.g) return m.k === "Stand-Alone";
    const r = byId[m.id];
    return r && !r.locked && (r.id_system === "M-ID" || r.id_system === "Unified");
  })));
check("identities lead each mixed group (the Confirm target pick)",
  tg.filter((g) => g.members.some((m) => !m.g) && g.members.some((m) => m.g))
    .every((g) => !g.members[0].g));
check("cross-college groups rank before same_college ones",
  (() => { const f = tg.findIndex((g) => g.same_college);
           return f === -1 || tg.slice(f).every((g) => g.same_college); })());
check("groups carry similarity scores + shared terms",
  tg.every((g) => typeof g.score === "number" && Array.isArray(g.terms)));
// a stable un-curated marquee: the state fire curriculum's HazMat First
// Responder Operations/Decontamination family (~10 ids across ~10 colleges).
// Found by TITLE, not id — re-mints legitimately re-sequence ids (the
// 2026-06-12 SUBJ4 fold moved FIRE M1383 → M1363); titles travel with rows.
const fro = tg.find((g) =>
  g.members.filter((m) => /decontamination|responder operation/i.test(m.t || "")).length >= 4);
check("the HazMat FRO family surfaces as one title group",
  !!fro && fro.members.length >= 6);

// the smog families themselves were CONSOLIDATED (Session 46, Sam-confirmed).
// Asserted by MECHANISM (titles + pointer convergence), never by pinned ids:
// the 2026-06-12 SUBJ4 fold re-sequenced the AUTO bucket (M1007→M1006,
// M1217→M1211, … — kb/subj4_fold_out/2026-06-12/alias_map.json), and under
// slot reuse a vacated id is legitimately RE-OCCUPIED by a different course,
// so id pins would assert the wrong row after any re-mint. (AUTB M1037 kept
// its id and stays a concrete anchor for the cross-SUBJ4 fold.)
const cur = JSON.parse(fs.readFileSync("kb/coci_curation.json", "utf8")).curations;
const L2_TITLE = "Smog Check Inspector Training Level 2";
const l2Key = Object.keys(cur).find((k) => cur[k].unified_title === L2_TITLE);
const l2Pointers = Object.keys(cur).filter((k) => cur[k].merge_into === l2Key);
check("smog Level-2 family converges on ONE curated target (incl. the AUTB row)",
  !!l2Key && l2Pointers.length >= 10 && l2Pointers.includes("AUTB M1037"));
const l12rows = data.rows.filter((r) => /smog check inspector level 1\s*&\s*2/i.test(r.title || ""));
check("smog L1&2 family is ONE physical row with >= 2 curation folds",
  l12rows.length === 1
  && Object.keys(cur).filter((k) => cur[k].merge_into === l12rows[0].id).length >= 2);
// Resolve the target ROW via the curated key, not a title find: since the
// 2026-06-12 title normalization, the noncredit (M9xxx) twin — which the
// band rule keeps separate by design — shares the exact display title, so
// a first-by-title lookup can land on the 2-member noncredit row.
const l2row = data.rows.find((r) => r.id === l2Key);
check("the Level-2 curated target renders as ONE row (unified title, 10+ members)",
  !!l2row && (l2row.title || "") === L2_TITLE && l2row.members >= 10);
// The six consolidated variant titles must be out of the queue in EVERY id
// era. The noncredit pair ("… Training Level II" / "Smog Level 2 …") is NOT
// here — it legitimately stays queued (credit status differs; curator call).
const CONSUMED_TITLES = new Set([
  "smog check procedures training level 2", "smog check training level 2",
  "smog check ii", "smog inspector - level 2 training",
  "smog level one and level two", "level 1 and level 2 smog inspector training",
]);
check("consumed smog variants no longer appear in any title group",
  !tg.some((g) => g.members.some((m) => CONSUMED_TITLES.has((m.t || "").toLowerCase()))));

// ── B. jsdom consumer drive (stubbed payload — UI mechanics) ───────────────
const src = fs.readFileSync("unified_courses.js", "utf8");
const rows = [
  { kind: "Course", id: "AUTO M9101", title: "Smog Check Training Level 2", id_system: "M-ID",
    disc: "Automotive Technology", credit: "Credit", units: 1.0, top: "0948.00", subj: ["AUTO"],
    members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
  { kind: "Course", id: "AUTO M9103", title: "Honda Skills Training Session A", id_system: "M-ID",
    disc: "Automotive Technology", credit: "Credit", units: 1.5, top: "0948.00", subj: ["AUTO"],
    members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
  { kind: "Course", id: "AUTO M9104", title: "Honda Skills Lab Session A", id_system: "M-ID",
    disc: "Automotive Technology", credit: "Credit", units: 1.5, top: "0948.00", subj: ["AUTO"],
    members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
];
const sugStub = {
  groups: [], singleton_groups: [], family_groups: [], desc_groups: [], evidence_groups: [],
  title_count: 2,
  title_groups: [
    { sig: "Smog Check Training Level 2", n: 2, score: 0.81, cos_max: 0.81,
      same_college: false, spread: 1.5, terms: ["smog", "check", "2"],
      members: [
        { id: "AUTO M9101", t: "Smog Check Training Level 2", s: "AUTO", u: 1.0, k: "M-ID" },
        { id: "AUTO M9102", t: "Level 2 Smog Technician Training", s: "AUTO", u: 2.5, k: "Stand-Alone", g: 1 },
      ] },
    { sig: "Honda Skills Training Session A", n: 2, score: 0.93, cos_max: 0.93,
      same_college: true, spread: 0, terms: ["honda", "session"],
      members: [
        { id: "AUTO M9103", t: "Honda Skills Training Session A", s: "AUTO", u: 1.5, k: "M-ID" },
        { id: "AUTO M9104", t: "Honda Skills Lab Session A", s: "AUTO", u: 1.5, k: "M-ID" },
      ] },
  ],
};
const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A", "B"], mq_disciplines: ["Automotive Technology"], topmap: {} })};
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

  check("🏷 Title-evidence badge renders",
    /Title evidence · near-duplicate course titles/.test(doc.body.textContent));
  check("explainer carries the similarity score and units-spread note",
    /TITLES are near-duplicates/.test(doc.body.textContent)
    && /0\.81/.test(doc.body.textContent)
    && /spread here: 1\.5u/.test(doc.body.textContent));
  const boxes = Array.from(doc.querySelectorAll("div")).filter((d) => /Suggested merge 1 of/.test(txt(d)));
  const box = boxes[boxes.length - 1];
  const cbs = box ? Array.from(box.querySelectorAll("input[type=checkbox]")) : [];
  check("both members render with checkboxes pre-CHECKED",
    cbs.length === 2 && cbs.every((cb) => cb.checked));
  check("Stand-Alone member is labelled", /Stand-Alone/.test(doc.body.textContent));
  check("cross-college group shows NO same-college banner",
    !/resolve to ONE college/.test(doc.body.textContent));

  // Confirm the merge — merge_into must point at the M-ID, not the Stand-Alone.
  const go = Array.from(doc.querySelectorAll("button")).find((b) => /Confirm merge/.test(txt(b)));
  check("Confirm merge button present", !!go);
  go.dispatchEvent(new window.Event("click"));
  await sleep(300);
  check("Confirm fired the curation write (fetch POST)", posts.length >= 1);
  const allBodies = posts.map((p) => String(p.body || "")).join(" ");
  check("merge_into targets the M-ID (Stand-Alone folds INTO it)",
    /"field":\s*"merge_into"/.test(allBodies)
    && /"value":\s*"AUTO M9101"/.test(allBodies)
    && /"course_id":\s*"AUTO M9102"/.test(allBodies));
  check("worklist advanced to the same_college group",
    /Suggested merge 2 of 2/.test(doc.body.textContent));
  check("same_college title group shows the amber banner",
    /resolve to ONE college/.test(doc.body.textContent));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
