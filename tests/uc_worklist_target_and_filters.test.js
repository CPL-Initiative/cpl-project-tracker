// Guards two Session-70 Suggested-merges refinements (Sam's handoff asks):
//
//   Task 2 & 4 — "set as target": the surviving identity is auto-picked by §10
//   precedence, but a curator can pin a DIFFERENT checked candidate (incl. one
//   with a different SUBJ) as the survivor. The ★ badge moves to the pinned row
//   and Confirm folds the others INTO it (its id/subject win).
//
//   Task 1 — CCR filter carry-over: the discipline/subject/etc. filters set on
//   the main CCR table carry into the worklist — a group surfaces only when ≥1
//   live member satisfies them. A checkbox lets the curator drop the carry-over.
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_target_and_filters.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Two Photography M-IDs (mirrors the screenshot's different-SUBJ candidates:
// ART vs PHOT) + a Welding group used to prove the discipline carry-over hides
// the off-discipline group.
const rows = [
  { kind: "Course", id: "ART M1011", title: "Image Manipulation in Adobe Photoshop", id_system: "M-ID",
    disc: "Photography", credit: "Credit", units: 3.0, top: "1012.00", subj: ["ART"],
    members: 2, adopted: [], potential: [], conf: 0.8, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
  { kind: "Course", id: "PHOT M1064", title: "Digital Imaging 1", id_system: "M-ID",
    disc: "Photography", credit: "Credit", units: 3.0, top: "1012.00", subj: ["PHOT"],
    members: 4, adopted: [], potential: [], conf: 0.85, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
  { kind: "Course", id: "WELD M2001", title: "Intro Welding Safety", id_system: "M-ID",
    disc: "Welding", credit: "Credit", units: 1.0, top: "0956.00", subj: ["WELD"],
    members: 2, adopted: [], potential: [], conf: 0.8, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
  { kind: "Course", id: "WELD M2002", title: "Introduction to Welding Safety", id_system: "M-ID",
    disc: "Welding", credit: "Credit", units: 1.0, top: "0956.00", subj: ["WELD"],
    members: 2, adopted: [], potential: [], conf: 0.8, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
];

// Group A = the different-SUBJ Photography pair; ART M1011 sorts first so it's
// the §10 auto-pick. Group B = Welding (used for the filter test).
const sugStub = {
  groups: [
    { sig: "Digital Imaging", n: 2, score: 0.8,
      members: [
        { id: "ART M1011", t: "Image Manipulation in Adobe Photoshop", s: "ART", u: 3.0, k: "M-ID" },
        { id: "PHOT M1064", t: "Digital Imaging 1", s: "PHOT", u: 3.0, k: "M-ID" },
      ] },
    { sig: "Welding Safety", n: 2, score: 0.8,
      members: [
        { id: "WELD M2001", t: "Intro Welding Safety", s: "WELD", u: 1.0, k: "M-ID" },
        { id: "WELD M2002", t: "Introduction to Welding Safety", s: "WELD", u: 1.0, k: "M-ID" },
      ] },
  ],
  singleton_groups: [], family_groups: [], desc_groups: [], evidence_groups: [],
  title_count: 0, title_groups: [],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A", "B"], mq_disciplines: ["Photography", "Welding"], topmap: {} })};
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

function curBox(doc) {
  const boxes = Array.from(doc.querySelectorAll("div")).filter((d) => /Proposed unified title/.test(txt(d)));
  return boxes[boxes.length - 1];
}
function memberRows(box) {
  return Array.from(box.querySelectorAll("div")).filter((d) => d.querySelector(":scope > input[type=checkbox]"));
}
function badgeIn(row) { return Array.from(row.querySelectorAll("span")).find((s) => /★\s*merge target/.test(txt(s))); }
function setLink(row) { return Array.from(row.querySelectorAll("a")).find((a) => /set as target/.test(txt(a))); }
function shown(elm) { return elm && elm.style.display !== "none"; }
function openWorklist(doc) {
  Array.from(doc.querySelectorAll("button, a")).find((b) => /Suggested merges/.test(txt(b)))
    .dispatchEvent(new window.Event("click"));
}
function headCount(box) {
  // The "N of M" span lives in the head bar — a sibling of `box` inside the shell.
  const s = Array.from(box.parentNode.querySelectorAll("span")).find((x) => /\d+\s+of\s+\d+/.test(txt(x)));
  return s ? txt(s) : "";
}
function closeWorklist(doc) {
  Array.from(doc.querySelectorAll("button")).filter((b) => txt(b) === "✕")
    .forEach((b) => b.dispatchEvent(new window.Event("click")));
}

(async function main() {
  await sleep(120);
  const doc = window.document;

  // ── Task 2 & 4: pin a different-SUBJ candidate as the surviving target ──
  openWorklist(doc);
  await sleep(220);
  let box = curBox(doc);
  let mrows = memberRows(box);
  check("group A renders both Photography candidates", mrows.length === 2);
  const artRow = mrows.find((r) => /ART M1011/.test(txt(r)));
  const photRow = mrows.find((r) => /PHOT M1064/.test(txt(r)));
  check("ART M1011 is the §10 auto-pick target", shown(badgeIn(artRow)));
  check("PHOT M1064 is NOT the target yet", !shown(badgeIn(photRow)));
  // The ☆ set-as-target link only appears on a CHECKED non-target row, and
  // candidates start UNCHECKED (Sam, S70) — opt PHOT M1064 in so it can be pinned.
  const photCb = photRow.querySelector(".uc-cand-cb");
  photCb.checked = true; photCb.dispatchEvent(new window.Event("change"));
  await sleep(20);
  // The non-target checked row offers a ☆ set-as-target link.
  const photSet = setLink(photRow);
  check("the non-target row offers a ☆ set-as-target link", shown(photSet));
  check("the current target row does NOT offer set-as-target", !shown(setLink(artRow)));

  photSet.dispatchEvent(new window.Event("click"));
  await sleep(20);
  check("pinning moves the ★ to PHOT M1064", shown(badgeIn(photRow)));
  check("ART M1011 is no longer the target", !shown(badgeIn(artRow)));

  const go = Array.from(box.querySelectorAll("button")).find((b) => /Confirm merge/.test(txt(b)));
  go.dispatchEvent(new window.Event("click"));
  await sleep(250);
  let bodies = posts.map((p) => String(p.body || "")).join(" ");
  check("Confirm folds ART M1011 INTO the pinned PHOT M1064",
    /"course_id":\s*"ART M1011"[^]*?"value":\s*"PHOT M1064"/.test(bodies)
    || (/"course_id":\s*"ART M1011"/.test(bodies) && /"value":\s*"PHOT M1064"/.test(bodies)));
  check("the unified_title is written on the pinned PHOT M1064 survivor",
    /"course_id":\s*"PHOT M1064"[^]*?"field":\s*"unified_title"/.test(bodies));

  // Confirm advances to the next group but leaves the dialog open — close it so
  // the filter test drives a single, fresh overlay.
  closeWorklist(doc);
  await sleep(40);

  // ── Task 1: CCR discipline filter carries into the worklist ──
  // Reset to a clean view, then filter the CCR table to Welding.
  posts.length = 0;
  const fDisc = doc.getElementById("uc-disc");
  check("the CCR discipline filter exists", !!fDisc);
  fDisc.value = "Welding"; fDisc.dispatchEvent(new window.Event("change"));
  await sleep(60);
  openWorklist(doc);
  await sleep(220);
  box = curBox(doc);
  check("with Welding selected, the worklist surfaces a Welding group",
    /Welding Safety/i.test(box.textContent) || /Welding/i.test(box.textContent));
  check("the Photography (ART/PHOT) group is filtered out", !/Adobe Photoshop/i.test(box.textContent));
  check("the carry-over count reflects a single matching group", /1 of 1/.test(headCount(box)) || /1 of 1/.test(box.textContent + headCount(box)));

  // The carry-over checkbox is present and labelled; unchecking it restores all.
  const ccrLabel = Array.from(box.parentNode.querySelectorAll("label"))
    .find((l) => /Match the CCR table filters/.test(txt(l)))
    || Array.from(doc.querySelectorAll("label")).find((l) => /Match the CCR table filters/.test(txt(l)));
  check("a 'Match the CCR table filters' toggle is present", !!ccrLabel);
  const ccrCb = ccrLabel && ccrLabel.querySelector("input[type=checkbox]");
  check("the carry-over toggle is ON by default", ccrCb && ccrCb.checked === true);
  ccrCb.checked = false; ccrCb.dispatchEvent(new window.Event("change"));
  await sleep(40);
  check("dropping the carry-over re-reveals both groups (2 total)",
    /of 2/.test(headCount(box) + " " + box.textContent));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
