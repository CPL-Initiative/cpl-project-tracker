// Guards the WITNESS-KINSHIP gate on the official-ID fold + the Session-41
// CCR fixes (2026-06-11 — the AUTO 120X/150X chimera receipts), updated for
// the Session-42 promotions slot-fix (the re-key rebuilt with permutation
// semantics relocated 1,066 mis-keyed evidence records to their true rows).
//
//  A. Committed producer output: AUTO 120 X / 150 X carry their C-ID
//     descriptor titles and REAL kin folds (transmissions / brakes families);
//     stats describe the DISPLAYED members (claims ∪ folded leaves). The five
//     chimera M-IDs stay their own rows and carry NO official-id evidence
//     (their mis-keyed receipts relocated home). The SPAN 200/210 folds
//     survive (the gate must not undo Session 40's win). Claims-only official
//     rows exist. Lane: AUTO 120 X no longer queues (its evidence folds);
//     FLSP M1379 stays contested; kin-failed members are pre-unchecked.
//
//  B. jsdom drive of the real consumer: the ⚠ title-mismatch chip renders and
//     the member starts UNCHECKED; the all-mismatched group banner shows; the
//     "🧾 stale evidence" badge renders on a gated row; the Session-41 CSS
//     (title wrap + white member-table headers) is injected.
//
// Run from repo root: `npm test` (or `node tests/uc_kinship_gate.test.js`).
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

const a120 = byId["AUTO 120 X"], a150 = byId["AUTO 150 X"];
check("AUTO 120 X row exists", !!a120);
check("AUTO 120 X is titled by its C-ID descriptor, not a folded remnant",
  a120 && a120.title === "Automatic Transmissions and Transaxles");
// Session 42 (slot-fix): the promotions re-key was rebuilt with permutation
// semantics, relocating mis-keyed evidence to its true rows — AUTO 120 X now
// carries REAL kin folds (transmissions families), not the chimera set.
// The kin SETS are pinned by TITLE + count (title_variants carries the
// folded variants' titles), never by M-ID — the 2026-06-12 SUBJ4 fold
// re-sequenced the AUTO bucket WITH SLOT REUSE (ex-M1067 now sits at
// M1065, one of the previously-pinned ids), so id pins would silently
// assert the wrong rows after any re-mint.
check("AUTO 120 X folds are exactly the kin transmissions M-IDs",
  a120 && (a120.consolidated_from || []).length === 2
  && JSON.stringify((a120.title_variants || []).slice().sort()) ===
    JSON.stringify(["Automatic Transmission - Transaxle", "Automatic Transmissions and Transaxles"]));
// Phase 3 (Session 45): statewide C-ID routing adds routed members to the
// displayed set — AUTO 120 X gained 6 (21 → 27, rfold 3).
check("AUTO 120 X stats describe the DISPLAYED members (claims ∪ folded ∪ routed)",
  a120 && a120.members === 27 && a120.umin === 0 && a120.umax === 9
       && (a120.rfold || 0) >= 1);
check("AUTO 120 X credit resolved (was blank)", a120 && a120.credit === "Credit");
check("AUTO 150 X is titled by its C-ID descriptor",
  a150 && a150.title === "Automotive Braking Systems");
check("AUTO 150 X folds are exactly the kin brakes M-IDs",
  a150 && (a150.consolidated_from || []).length === 3
  && JSON.stringify((a150.title_variants || []).slice().sort()) ===
    JSON.stringify(["Automotive Brake Systems", "Automotive Brakes", "Automotive Braking Systems"]));

// The five chimera M-IDs — derived by TITLE (unique per title among the AUTO
// M-ID rows); the fold re-occupied several of their vacated slots with
// neighbouring courses (ex-M1025 now sits at M1024), so the old id pins
// silently pointed at the wrong rows.
const CHIMERA_TITLES = [
  "Advanced Automotive Engine Performance",
  "Light Vehicle Diesel Engines",
  "Advanced Student Projects",
  "Hybrid Vehicles and Advanced Electric Vehicle Technology",
  "Advanced Engine Management",
];
const chimeras = CHIMERA_TITLES.map((t) => data.rows.find((r) =>
  r.id_system === "M-ID" && /^AUTO M/.test(r.id) && (r.title || "") === t));
check("the five chimera M-IDs remain their own rows (never folded)",
  chimeras.every((r) => !!r));
check("the chimera rows carry NO official-id evidence at all (the slot-fix " +
  "relocated the mis-keyed receipts to their true families)",
  chimeras.every((r) => r && !r.match));

// The Session-40 win must survive the gate: witnesses' own courses were
// title-kin ("Spanish 3" witnesses are titled "Spanish 3"), so these fold.
// Folds asserted via the anchors' title_variants (the folded variants'
// titles travel onto the surviving row; ids re-sequence under re-mints).
const s200 = byId["SPAN 200"], s210 = byId["SPAN 210"];
check("SPAN 200 keeps its Session-40 folds (gate preserves witness-kin evidence)",
  s200 && (s200.consolidated_from || []).length >= 2
       && (s200.title_variants || []).indexOf("Intermediate Spanish I") >= 0
       && (s200.title_variants || []).indexOf("Spanish 3") >= 0);
check("SPAN 210 keeps its folds (incl. the 24:1 plurality)",
  s210 && (s210.consolidated_from || []).length >= 1
       && (s210.title_variants || []).indexOf("Intermediate Spanish II") >= 0);

// Claims-only official rows: officials whose only membership is raw COCI
// claimants. They are unlocked C-ID/CCN rows with members but no folds.
const claimsOnly = data.rows.filter((r) =>
  (r.id_system === "C-ID" || r.id_system === "CCN-ID") && !r.locked
  && !(r.consolidated_from || []).length && (r.members || 0) >= 1);
check("claims-only official rows exist in force (the official reference layer)",
  claimsOnly.length >= 100);

// R4 singleton folds: evidence-bearing stand-alones folded under official
// rows (sfold), kinship-gated like everything else; the folded ids left the
// stand-alone payload (its writer excludes merge_into ids).
const sfoldTotal = data.rows.reduce((n, r) => n + (r.sfold || 0), 0);
check("R4 folded a substantial set of evidence-bearing stand-alones (sfold ≥ 200)",
  sfoldTotal >= 200);
check("SPAN 210 absorbed its R4 stand-alone variants (Level II / IV / Advanced Intermediate)",
  byId["SPAN 210"] && (byId["SPAN 210"].sfold || 0) >= 2
    && (byId["SPAN 210"].title_variants || []).indexOf("Intermediate Spanish: Level II") >= 0);
// The R4-folded stand-alones are identified by TITLE (their ids re-sequence
// under re-mints — FLSP M11HH/M11HY rode to M10LD/M10LN, AHSD M90BK to
// IDST M90LB): once folded, their titles leave the stand-alone payload
// entirely (the writer excludes merge_into ids).
const saPayload = loadPayload("unified_courses_standalone.js", "window.CPL_UC_STANDALONE");
const saTitles = new Set(saPayload.rows.map((r) => (r.title || "").trim()));
check("R4-folded stand-alones are out of the stand-alone payload",
  !saTitles.has("Intermediate Spanish: Level I")
  && !saTitles.has("Intermediate Spanish: Level II")
  && !saTitles.has("Introduction to American Government"));

// Lane payload. Post-slot-fix the lane is the CONTESTED/queued evidence only:
// the 187 phantom "stale-receipt" groups dissolved when their evidence was
// re-keyed home (AUTO 120 X folds instead of laning), and the marquee
// genuinely-mixed row (the bare "Intermediate Spanish" M-ID — was
// FLSP M1379, era-dependent — SPAN 200 ×8 vs 210 ×6) still queues.
const sug = loadPayload("unified_courses_suggestions.js", "window.CPL_UC_SUGGESTIONS");
const eg = sug.evidence_groups || [];
check("AUTO 120 X no longer needs a lane group (its evidence folds)",
  !eg.find((g) => g.sig === "AUTO 120 X"));
const isBareIntSpanish = (m) =>
  m.k === "M-ID" && /^intermediate spanish$/i.test((m.t || "").trim());
const bareGroup = eg.find((g) => g.members.some(isBareIntSpanish));
check("the genuinely mixed bare 'Intermediate Spanish' M-ID stays contested in the lane",
  !!bareGroup && bareGroup.sig === "SPAN 200"
  && bareGroup.members.some((m) => isBareIntSpanish(m) && m.x === 1));
check("kin-failed members anywhere in the lane are pre-unchecked (x:1)",
  eg.every((g) => g.members.filter((m) => m.tm && !m.ev).every((m) => m.x === 1)));
const firstZero = eg.findIndex((g) => g.score === 0);
check("score-0 (stale-receipt) groups rank after every kin-backed group",
  firstZero === -1 || eg.slice(firstZero).every((g) => g.score === 0));

// ── B. jsdom consumer drive (stubbed payload — UI mechanics) ───────────────
const src = fs.readFileSync("unified_courses.js", "utf8");
const rows = [
  { kind: "Course", id: "AUTO M9901", title: "Advanced Engine Performance", id_system: "M-ID",
    disc: "Automotive Technology", credit: "Credit", units: 6.0, top: "0948.00", subj: ["AUT"],
    members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
    match: { evidence: { "C-ID:AUTO 999 X": 1 }, kin: {} },
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
];
const sugStub = {
  groups: [], singleton_groups: [], family_groups: [],
  evidence_count: 1,
  evidence_groups: [{
    sig: "AUTO 999 X", official: "Automatic Transmissions and Transaxles", n: 2,
    score: 0, tm: 1,
    members: [
      { id: "AUTO 999 X", t: "Automatic Transmissions and Transaxles", s: "AUTO", u: null, k: "C-ID" },
      { id: "AUTO M9901", t: "Advanced Engine Performance", s: "AUT", u: 6.0, k: "M-ID",
        ev: { "AUTO 999 X": 1 }, tm: 1, x: 1 },
    ],
  }],
};
const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Automotive Technology"], topmap: {} })};
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

(async function main() {
  await sleep(120);
  const doc = window.document;

  // Session-41 CSS injection: title wrap + white member-table headers.
  const fixCss = doc.getElementById("uc-fix-css");
  check("uc-fix-css injected", !!fixCss);
  check("title column wraps instead of ellipsis",
    fixCss && /td:nth-child\(3\) \.uc-trunc\{white-space:normal/.test(fixCss.textContent));
  check("member-table headers are white on the navy band",
    fixCss && /\.uc-member-table th\{color:#fff/.test(fixCss.textContent));

  // The gated row's badge: evidence present, nothing folds, all witnesses
  // failed → "🧾 stale evidence" with the mismatch count in the tooltip.
  const badges = Array.from(doc.querySelectorAll(".uc-badge"));
  const stale = badges.find((b) => /stale evidence/.test(txt(b)));
  check("'🧾 stale evidence' badge renders on the gated row", !!stale);
  check("its tooltip carries the title-mismatch annotation",
    stale && /title-mismatched/.test(stale.getAttribute("title") || ""));

  // Open the worklist: banner + ⚠ chip + pre-unchecked member.
  const sugBtn = Array.from(doc.querySelectorAll("button, a")).find((b) => /Suggested merges/.test(txt(b)));
  check("✨ Suggested merges control present", !!sugBtn);
  sugBtn.dispatchEvent(new window.Event("click"));
  await sleep(250);

  check("all-mismatched group banner renders",
    /Every witness in this group is title-mismatched/.test(doc.body.textContent));
  const chips = Array.from(doc.querySelectorAll("span")).filter((s) => /title mismatch/.test(txt(s)));
  check("⚠ title-mismatch chip renders on the kin-failed member", chips.length >= 1);
  const dialogBoxes = Array.from(doc.querySelectorAll("div")).filter((d) => /Suggested merge 1 of/.test(txt(d)));
  const box = dialogBoxes[dialogBoxes.length - 1];
  const cbRows = box ? Array.from(box.querySelectorAll("input[type=checkbox]")) : [];
  const mismatchCb = cbRows.find((cb) => (cb.parentNode.textContent || "").indexOf("AUTO M9901") >= 0);
  check("kin-failed member starts UNCHECKED", mismatchCb && !mismatchCb.checked);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
