// Guards the WITNESS-KINSHIP gate on the official-ID fold + the Session-41
// CCR fixes (2026-06-11 — the AUTO 120X/150X chimera receipts).
//
//  A. Committed producer output: the marquee mis-folds are corrected —
//     AUTO 120 X / 150 X carry their C-ID descriptor titles (not a folded
//     remnant's), no bogus consolidated_from, Credit, the 4–6 units range of
//     their DISPLAYED claimant members, and a members count that matches the
//     member table. The five chimera M-IDs are back as their own rows with
//     evidence-but-empty-kin (lane-visible, never auto-folded). The SPAN
//     200/210 folds survive (the gate must not undo Session 40's win).
//     Claims-only official rows exist. Lane: kin-failed members carry tm + x,
//     all-mismatch groups score 0 and rank after kin-backed groups.
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
check("AUTO 120 X row exists (claims-only after the bogus folds dropped)", !!a120);
check("AUTO 120 X is titled by its C-ID descriptor, not a folded remnant",
  a120 && a120.title === "Automatic Transmissions and Transaxles");
check("AUTO 120 X carries NO consolidated_from (the chimera folds are gone)",
  a120 && !(a120.consolidated_from || []).length);
check("AUTO 120 X units range matches its displayed members (4–6, not 0–6)",
  a120 && a120.umin === 4 && a120.umax === 6);
check("AUTO 120 X credit resolved (was blank)", a120 && a120.credit === "Credit");
check("AUTO 120 X members count matches the member table (3 claimants)",
  a120 && a120.members === 3);
check("AUTO 150 X is titled by its C-ID descriptor",
  a150 && a150.title === "Automotive Braking Systems");
check("AUTO 150 X carries NO consolidated_from",
  a150 && !(a150.consolidated_from || []).length);

const chimeras = ["AUTO M1017", "AUTO M1176", "AUTO M1027", "AUTO M1024", "AUTO M1025"];
check("the five chimera M-IDs are back as their own rows",
  chimeras.every((id) => byId[id]));
check("each chimera row keeps its evidence with an EMPTY kin (gated, lane-visible)",
  chimeras.every((id) => {
    const mt = (byId[id] || {}).match || {};
    return mt.evidence && mt.kin && Object.keys(mt.kin).length === 0
      && !mt.cid && !mt.ccn;
  }));

// The Session-40 win must survive the gate: witnesses' own courses were
// title-kin ("Spanish 3" witnesses are titled "Spanish 3"), so these fold.
const s200 = byId["SPAN 200"], s210 = byId["SPAN 210"];
check("SPAN 200 keeps its Session-40 folds (gate preserves witness-kin evidence)",
  s200 && (s200.consolidated_from || []).indexOf("FLSP M1342") >= 0
       && (s200.consolidated_from || []).indexOf("FLSP M1043") >= 0);
check("SPAN 210 keeps its folds (incl. the 24:1 plurality)",
  s210 && (s210.consolidated_from || []).indexOf("FLSP M1352") >= 0);

// Claims-only official rows: officials whose only membership is raw COCI
// claimants. They are unlocked C-ID/CCN rows with members but no folds.
const claimsOnly = data.rows.filter((r) =>
  (r.id_system === "C-ID" || r.id_system === "CCN-ID") && !r.locked
  && !(r.consolidated_from || []).length && (r.members || 0) >= 1);
check("claims-only official rows exist in force (the official reference layer)",
  claimsOnly.length >= 100);

// Lane payload: kin-failed members are tm-flagged + pre-unchecked; groups with
// zero kin-valid witnesses score 0 and sort after every kin-backed group.
const sug = loadPayload("unified_courses_suggestions.js", "window.CPL_UC_SUGGESTIONS");
const eg = sug.evidence_groups || [];
const g120 = eg.find((g) => g.sig === "AUTO 120 X");
check("AUTO 120 X evidence group surfaced in the lane", !!g120);
check("its chimera members are tm-flagged AND pre-unchecked (x:1)",
  g120 && g120.members.slice(1).every((m) => m.tm >= 1 && m.x === 1));
check("all-mismatch group scores 0", g120 && g120.score === 0 && g120.tm >= 1);
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
