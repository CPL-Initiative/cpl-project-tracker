// CER SUBJ Code filter (S110 — the carpentry-pass-2 build item):
//   a datalist-backed SUBJ input next to the Discipline filter, matching
//   subjOf() — i.e. the modal SUBJ4 derived from a credential's articulated
//   common courses OR the curated kb_curation `subj_override` (which
//   applyOverlay pre-seeds into the _subj cache). Guards:
//   1. the input renders, datalist-backed, options = distinct SUBJ4s
//   2. typing a SUBJ filters the grid to matching rows
//   3. an overlay subj_override row (zero articulations → nothing derivable)
//      is matched by the filter — the CARP queue-fill case
//   4. clearing the input restores all rows
//
// Run from repo root: `npm test` (or `node tests/cer_subj_filter.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const payload = { _generated_at: "t", top_categories: {}, unified_titles: [
  // Articulated row — derives SUBJ=CARP from its M-ID.
  { ut: "Structural Framing", raw_count: 1, conf_title: 0.85,
    issuer: "Carpenters Training Committee for Northern California",
    disc_modal: "Construction Technology",
    students_served: 12, cpl_types: ["Apprenticeship"],
    audit_tags: {}, audit_tag_total: 0,
    raw_variants: [{ r: "Carpenters Apprenticeship — CARP 006", c: 0.75 }],
    articulations: [{ cid: "CARP M1006", sys: "M-ID", t: "Structural Framing",
      disc: "Construction Technology",
      local: [{ subj: "CARPT", num: "112", title: "Structural Framing",
        colleges: ["American River College"] }] }] },
  // Articulated row in a different SUBJ — must NOT match CARP.
  { ut: "OSHA 10-Hour Card", raw_count: 1, conf_title: 0.9, issuer: "OSHA",
    disc_modal: "Industrial Technology",
    students_served: 88, cpl_types: ["Industry Certification"],
    audit_tags: {}, audit_tag_total: 0,
    raw_variants: [{ r: "OSHA 10", c: 0.9 }],
    articulations: [{ cid: "INDT M1010", sys: "M-ID", t: "Ind. Safety",
      disc: "Industrial Technology",
      local: [{ subj: "INDT", num: "101", title: "Industrial Safety",
        colleges: ["Sierra College"] }] }] },
  // The queue case: ZERO articulations (nothing derivable) + an overlay
  // subj_override=CARP — the S110 carp-subj-s110@bot fill.
  { ut: "Carpenters Apprenticeship — CARP 002", raw_count: 1, conf_title: 0.75,
    issuer: "Carpenters Training Committee for Northern California",
    disc_modal: "",
    students_served: null, cpl_types: ["Apprenticeship"],
    audit_tags: {}, audit_tag_total: 0,
    raw_variants: [{ r: "Carpenter's Training Center CTCNC CARP 002", c: 0.75 }],
    articulations: [] },
] };

const overlayRows = [
  { course_id: "_CREDENTIAL_REVIEW::Carpenters Apprenticeship — CARP 002",
    field: "subj_override", value: "CARP",
    reviewer_email: "carp-subj-s110@bot", reviewed_at: "2026-07-09T22:22:45Z" },
  { course_id: "_CREDENTIAL_REVIEW::Carpenters Apprenticeship — CARP 002",
    field: "discipline_override", value: "Carpentry",
    reviewer_email: "carp-disc-s110@bot", reviewed_at: "2026-07-09T22:22:45Z" },
];

function makeDom() {
  const html = `<!DOCTYPE html><html><body>
  <div id="tab-credential-reference">
    <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
  </div></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  window.CPL_CREDENTIAL_REFERENCE = payload;
  window.confirm = function () { return true; };
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
    if (method === "POST" || method === "DELETE") return respond([], 201);
    return respond([]);
  };
  const jwt = "eyJhbGciOiJIUzI1NiJ9."
    + Buffer.from(JSON.stringify({ email: "map@rccd.edu" })).toString("base64") + ".x";
  window.sessionStorage.setItem("cpl_sb", JSON.stringify({
    access_token: jwt, refresh_token: "rt", email: "map@rccd.edu",
    exp: Date.now() + 3600000 }));
  window.eval(src);
  return { window };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const visibleTitles = (doc) => Array.from(doc.querySelectorAll("tr.cr-row"))
  .map((tr) => {
    const inp = tr.querySelector(".cr-title-in");
    return inp ? inp.value : txt(tr.querySelector("td"));
  });

(async () => {
  const { window } = makeDom();
  const doc = window.document;
  await sleep(150);

  // ── 1. presence + datalist contents ──
  const subjInput = doc.getElementById("cr-subj-filter");
  const subjDl = doc.getElementById("cr-subj-list");
  check("subj: filter input present, datalist-backed",
    !!subjInput && subjInput.getAttribute("list") === "cr-subj-list" && !!subjDl);
  const dlVals = Array.from(subjDl.querySelectorAll("option")).map((o) => o.value);
  check("subj: datalist carries the derived SUBJ4s (CARP, INDT)",
    dlVals.indexOf("CARP") >= 0 && dlVals.indexOf("INDT") >= 0);
  check("subj: datalist values are unique + sorted",
    JSON.stringify(dlVals) === JSON.stringify(Array.from(new Set(dlVals)).sort()));
  const discSel = doc.getElementById("cr-disc-filter");
  check("subj: sits in the same toolbar as the Discipline filter",
    !!discSel && subjInput.parentNode === discSel.parentNode);

  // ── 2 + 3. filtering — derived AND override rows match ──
  subjInput.value = "carp";  // case-insensitive (uppercased on input)
  subjInput.dispatchEvent(new window.Event("input"));
  await sleep(20);
  let vis = visibleTitles(doc);
  check("subj: CARP shows the articulation-derived row",
    vis.indexOf("Structural Framing") >= 0);
  check("subj: CARP shows the overlay subj_override row (zero articulations)",
    vis.indexOf("Carpenters Apprenticeship — CARP 002") >= 0);
  check("subj: CARP hides the INDT row",
    vis.indexOf("OSHA 10-Hour Card") < 0 && vis.length === 2);

  // The discipline_override rode along in the same fill — spot-check it shows.
  const carpRow = Array.from(doc.querySelectorAll("tr.cr-row")).find((tr) => {
    const inp = tr.querySelector(".cr-title-in");
    return (inp ? inp.value : "") === "Carpenters Apprenticeship — CARP 002";
  });
  const discIn = carpRow && carpRow.querySelector(".cr-disc-in");
  check("subj: the queue row's discipline reads the Carpentry override",
    !!discIn && discIn.value === "Carpentry");

  // INDT isolates the other row.
  const subjInput2 = doc.getElementById("cr-subj-filter");
  subjInput2.value = "INDT";
  subjInput2.dispatchEvent(new window.Event("input"));
  await sleep(20);
  vis = visibleTitles(doc);
  check("subj: INDT isolates the OSHA row",
    vis.length === 1 && vis[0] === "OSHA 10-Hour Card");

  // ── 4. clearing restores everything ──
  const subjInput3 = doc.getElementById("cr-subj-filter");
  subjInput3.value = "";
  subjInput3.dispatchEvent(new window.Event("input"));
  await sleep(20);
  vis = visibleTitles(doc);
  check("subj: clearing the input restores all rows", vis.length === 3);

  // Unknown value = no filter (the college-filter convention).
  const subjInput4 = doc.getElementById("cr-subj-filter");
  subjInput4.value = "ZZZZ";
  subjInput4.dispatchEvent(new window.Event("input"));
  await sleep(20);
  vis = visibleTitles(doc);
  check("subj: an unknown SUBJ falls back to no filter", vis.length === 3);

  // ── report ──
  let fail = 0;
  results.forEach(([name, ok]) => {
    console.log((ok ? "  ✓ " : "  ✗ ") + name);
    if (!ok) fail++;
  });
  console.log(`\ncer_subj_filter: ${results.length - fail}/${results.length} checks passed`);
  if (fail) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
