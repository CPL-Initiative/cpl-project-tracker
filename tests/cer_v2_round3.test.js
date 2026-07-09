// CER v2 round 3 (2026-07-09 — Sam's nine-item shakedown, the UI batch):
//   1. the cream tab background is GHOSTED (rgba, so the First Light painting
//      shows through) — the exact token is pinned in cer_v2_round2.test.js
//   2. an originating-College filter incl. "CCC (statewide)"
//   4. user-adjustable column widths (drag handles, persisted per-browser in
//      cplCerColWidths.v1, ↺ reset in the ⚙ Columns panel)
//   5. violet chip font colors → CO dark blue (var(--seal-blue))
//   6. header row font color → white (was gold)
//   7. Initiated / Not-initiated clarified in the lane-chip + Status tooltips
//   8. cpl_type_override (the apprenticeship-tagging lane) — overlay-only
//      kb_curation field consumed by cplTypesOf(): chips, the CPL-type
//      filter, and the extracts all see the curated type
//
// (Items 3 + 8's bulk writes are Supabase data jobs with committed receipts —
// not testable here; this file guards the display/filter layer they ride on.)
//
// Run from repo root: `npm test` (or `node tests/cer_v2_round3.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const payload = { _generated_at: "t", top_categories: {}, unified_titles: [
  // The apprenticeship row — carries a cpl_type_override in the overlay.
  { ut: "Carpentry Apprenticeship Level 1", raw_count: 2, conf_title: 0.85,
    issuer: "Carpenters Training Committee for Northern California",
    disc_modal: "Construction Crafts Technology",
    students_served: 41, cpl_types: ["Industry Certification"],
    audit_tags: {}, audit_tag_total: 0,
    raw_variants: [{ r: "CTCNC Carpentry Level 1", c: 0.85 }],
    articulations: [{ cid: "CARP M1001", sys: "M-ID", t: "Carpentry 1",
      disc: "Construction Crafts Technology",
      local: [{ subj: "CARP", num: "015", title: "Carpentry Fundamentals",
        colleges: ["Bakersfield College"] }] }] },
  // A second college's row — the college filter must separate these two.
  { ut: "OSHA 10-Hour Card", raw_count: 1, conf_title: 0.9, issuer: "OSHA",
    disc_modal: "Industrial Technology",
    students_served: 88, cpl_types: ["Industry Certification"],
    audit_tags: {}, audit_tag_total: 0,
    raw_variants: [{ r: "OSHA 10", c: 0.9 }],
    articulations: [{ cid: "INDT M1010", sys: "M-ID", t: "Ind. Safety",
      disc: "Industrial Technology",
      local: [{ subj: "INDT", num: "101", title: "Industrial Safety",
        colleges: ["Sierra College"] }] }] },
  // A statewide-collaborative row — "CCC (statewide)" must isolate it.
  { ut: "EMT Statewide Standard", raw_count: 1, conf_title: 0.95,
    issuer: "CCCCO", statewide: true,
    students_served: 500, cpl_types: ["Industry Certification"],
    audit_tags: {}, audit_tag_total: 0,
    raw_variants: [{ r: "EMT (statewide)", c: 0.95 }], articulations: [] },
] };

// Overlay stub: the curated CPL type on the apprenticeship row.
const overlayRows = [
  { course_id: "_CREDENTIAL_REVIEW::Carpentry Apprenticeship Level 1",
    field: "cpl_type_override", value: "Apprenticeship",
    reviewer_email: "map@rccd.edu", reviewed_at: "2026-07-09T00:00:00Z" },
];

function makeDom(opts) {
  opts = opts || {};
  const html = `<!DOCTYPE html><html><body>
  <div id="tab-credential-reference">
    <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
  </div></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  window.CPL_CREDENTIAL_REFERENCE = payload;
  const log = { writes: [], blobs: [] };
  window.confirm = function () { return true; };
  window.URL.createObjectURL = function (blob) { log.blobs.push(blob); return "blob:stub"; };
  window.URL.revokeObjectURL = function () {};
  window.fetch = function (url, o) {
    url = String(url); const method = (o && o.method) || "GET";
    const respond = (body, status) => Promise.resolve({
      ok: !status || status < 400, status: status || 200,
      json: () => Promise.resolve(body),
    });
    if (url.indexOf("kb_curation") >= 0 && method === "GET") return respond(overlayRows);
    if (url.indexOf("exhibit_audit/latest.json") >= 0) return respond({ title_cards: [] });
    if (url.indexOf("issuer_preseed.json") >= 0) return respond({ staged: {} });
    if (url.indexOf("unclassified_preseed.json") >= 0) return respond({ staged: {} });
    if (url.indexOf("unclassified_suggestions.json") >= 0) return respond({ suggestions: {} });
    if (method === "POST" || method === "DELETE") {
      log.writes.push({ url, method, body: o.body && JSON.parse(o.body) });
      return respond([], 201);
    }
    return respond([]);
  };
  if (opts.signedIn !== false) {
    const jwt = "eyJhbGciOiJIUzI1NiJ9."
      + Buffer.from(JSON.stringify({ email: "map@rccd.edu" })).toString("base64") + ".x";
    window.sessionStorage.setItem("cpl_sb", JSON.stringify({
      access_token: jwt, refresh_token: "rt", email: "map@rccd.edu",
      exp: Date.now() + 3600000 }));
  }
  window.eval(src);
  return { window, log };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const visibleTitles = (doc) => Array.from(doc.querySelectorAll("tr.cr-row"))
  .map((tr) => {
    const inp = tr.querySelector(".cr-title-in");
    return inp ? inp.value : txt(tr.querySelector("td"));
  });

(async () => {
  const { window, log } = makeDom({});
  const doc = window.document;
  await sleep(150);
  const css = doc.getElementById("cr-scope-css").textContent;

  // ── 5. violet → CO dark blue chips ──
  check("chips: generated-suggestion chip text rides var(--seal-blue)",
    css.indexOf(".cr-chip-gen{color:var(--seal-blue,#1e40af);}") >= 0);
  check("chips: ⇆ merge chip text + border ride var(--seal-blue)",
    css.indexOf(".cr-chip-mergesug{color:var(--seal-blue,#1e40af);border-color:var(--seal-blue,#1e40af);}") >= 0);
  check("chips: merge-panel heading rides var(--seal-blue)",
    css.indexOf(".cr-mergesug-h{color:var(--seal-blue,#1e40af);}") >= 0);

  // ── 6. header row text white ──
  check("header: th text is white", css.indexOf(".cr-table th{color:#fff;}") >= 0);
  check("header: active sort indicator is white",
    css.indexOf(".cr-sort-indicator.active{color:#fff;}") >= 0);

  // ── 4. column drag-resize ──
  check("resize: handle CSS present",
    css.indexOf(".cr-resize{position:absolute;right:0;top:0;bottom:0;width:7px;cursor:col-resize;") >= 0);
  const credTh = Array.from(doc.querySelectorAll(".cr-table th"))
    .find((th) => txt(th).indexOf("Credential") === 0);
  const handle = credTh && credTh.querySelector(".cr-resize");
  check("resize: sortable th carries a drag handle", !!handle);
  const sortableThs = Array.from(doc.querySelectorAll(".cr-table th.sortable"));
  check("resize: EVERY sortable column carries a handle",
    sortableThs.length > 3 && sortableThs.every((th) => !!th.querySelector(".cr-resize")));

  // Drag: mousedown on the handle (offsetWidth=0 in jsdom → startW 0), move
  // +120px, release → width max(48, 120) persisted under the sort key.
  handle.onmousedown({ preventDefault() {}, stopPropagation() {}, clientX: 100 });
  doc.dispatchEvent(new window.MouseEvent("mousemove", { clientX: 220 }));
  doc.dispatchEvent(new window.MouseEvent("mouseup", { clientX: 220 }));
  const savedW = JSON.parse(window.localStorage.getItem("cplCerColWidths.v1") || "{}");
  check("resize: drag persists the width to cplCerColWidths.v1",
    savedW.unified_title === 120);

  // A re-render applies the saved width + flips the table to fixed layout.
  doc.getElementById("cr-search").dispatchEvent(new window.Event("input"));
  await sleep(20);
  const credTh2 = Array.from(doc.querySelectorAll(".cr-table th"))
    .find((th) => txt(th).indexOf("Credential") === 0);
  check("resize: saved width applied on re-render (fixed layout)",
    credTh2.style.width === "120px"
    && doc.querySelector(".cr-table").style.tableLayout === "fixed");

  // A click on the handle must NOT toggle the column sort.
  const indBefore = txt(credTh2.querySelector(".cr-sort-indicator"));
  credTh2.querySelector(".cr-resize").dispatchEvent(
    new window.MouseEvent("click", { bubbles: true }));
  await sleep(20);
  const credTh2b = Array.from(doc.querySelectorAll(".cr-table th"))
    .find((th) => txt(th).indexOf("Credential") === 0);
  check("resize: clicking the handle never triggers the th sort",
    txt(credTh2b.querySelector(".cr-sort-indicator")) === indBefore);

  // ↺ reset lives in the ⚙ Columns panel and clears the stored widths.
  const resetBtn = doc.querySelector(".cr-cols-panel .cr-resetw-btn");
  check("resize: ↺ reset button lives in the ⚙ Columns panel", !!resetBtn);
  resetBtn.click();
  await sleep(20);
  check("resize: reset clears cplCerColWidths.v1",
    window.localStorage.getItem("cplCerColWidths.v1") === "{}");

  // ── 2. originating-College filter ──
  const colInput = doc.getElementById("cr-college-filter");
  const colDl = doc.getElementById("cr-college-list");
  check("college: filter input present, datalist-backed",
    !!colInput && colInput.getAttribute("list") === "cr-college-list" && !!colDl);
  const dlVals = Array.from(colDl.querySelectorAll("option")).map((o) => o.value);
  check("college: datalist = CCC (statewide) first + the originating colleges",
    dlVals[0] === "CCC (statewide)"
    && dlVals.indexOf("Bakersfield College") >= 0
    && dlVals.indexOf("Sierra College") >= 0);

  colInput.value = "Bakersfield College";
  colInput.dispatchEvent(new window.Event("input"));
  await sleep(20);
  let vis = visibleTitles(doc);
  check("college: picking a college filters the grid to its rows",
    vis.length === 1 && vis[0] === "Carpentry Apprenticeship Level 1");

  const colInput2 = doc.getElementById("cr-college-filter");
  colInput2.value = "CCC (statewide)";
  colInput2.dispatchEvent(new window.Event("input"));
  await sleep(20);
  vis = visibleTitles(doc);
  check("college: CCC (statewide) isolates the statewide-collaborative rows",
    vis.length === 1 && vis[0] === "EMT Statewide Standard");

  const colInput3 = doc.getElementById("cr-college-filter");
  colInput3.value = "";
  colInput3.dispatchEvent(new window.Event("input"));
  await sleep(20);
  check("college: clearing the input restores all rows",
    visibleTitles(doc).length === 3);

  // ── 8. cpl_type_override (the apprenticeship display lane) ──
  const cplSel = doc.getElementById("cr-cpltype-filter");
  const cplOpts = Array.from(cplSel.querySelectorAll("option")).map((o) => o.value);
  check("cpltype: the curated type joins the CPL-type filter options",
    cplOpts.indexOf("Apprenticeship") >= 0);
  cplSel.value = "Apprenticeship";
  cplSel.dispatchEvent(new window.Event("change"));
  await sleep(20);
  vis = visibleTitles(doc);
  check("cpltype: filtering by the curated type shows only the overridden row",
    vis.length === 1 && vis[0] === "Carpentry Apprenticeship Level 1");
  doc.getElementById("cr-cpltype-filter").value = "all";
  doc.getElementById("cr-cpltype-filter").dispatchEvent(new window.Event("change"));
  await sleep(20);

  // The extracts ride the override too.
  const jsonBtn = Array.from(doc.querySelectorAll(".cr-export-btn"))
    .find((b) => txt(b) === "⬇ JSON");
  jsonBtn.click();
  await sleep(30);
  const parsed = JSON.parse(await log.blobs[log.blobs.length - 1].text());
  const carp = parsed.credentials.find(
    (c) => c.kb_key === "Carpentry Apprenticeship Level 1");
  check("cpltype: JSON extract carries the curated type",
    JSON.stringify(carp.cpl_types) === JSON.stringify(["Apprenticeship"]));

  // ── 7. Initiated clarified ──
  const lanes = Array.from(doc.querySelectorAll(".cr-lane"));
  const openLane = lanes.find((b) => txt(b).indexOf("Not initiated") >= 0);
  const doneLane = lanes.find((b) => txt(b).indexOf("✓ Initiated") >= 0);
  check("initiated: ○ lane tooltip says sign-off changes nothing + no action required",
    /never changes the data/.test(openLane.title)
    && /no other action is required/.test(openLane.title));
  check("initiated: ✓ lane tooltip says it is purely a review receipt",
    /review receipt/.test(doneLane.title));
  const statusTh = Array.from(doc.querySelectorAll(".cr-table th"))
    .find((th) => txt(th).indexOf("Status") === 0);
  check("initiated: Status column tooltip repeats the changes-nothing contract",
    /changes nothing in the data and is never required/.test(statusTh.title));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
