// Unclassified-view upgrades (S110 — Sam's three asks):
//   1. the 🔎 "what is this?" + ✨ suggest lookup pair on every Unclassified
//      row (the #701/#707 pattern, previously issuer-lane/grid only)
//   2. the ⤷ use-raw-title chip — ONLY on rows that are truly bare (no saved
//      assignment, no 💡 suggestion, no ⚡ pre-seed); fills the title input
//      with the raw title minus any course-code text
//   3. "✓ Initiate all assigned" — marks every assignment's TARGET credential
//      Initiated (reviewed_marker) so post-fold they skip ○ Not initiated;
//      existing-row targets resolve to the row KEY, already-initiated skipped
//
// Run from repo root: `npm test` (or `node tests/cer_unclass_lookup.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const fixtureRows = [
  // existing credential, NOT yet initiated — Initiate All must key on this
  { ut: "Alpha Credential", raw_count: 1, articulations: [], audit_tags: {}, audit_tag_total: 0 },
  // existing credential ALREADY initiated — must be skipped
  { ut: "Beta Credential", raw_count: 1, articulations: [], audit_tags: {}, audit_tag_total: 0,
    curated_at: "2026-07-01T00:00:00Z", curated_by: "map@rccd.edu" },
];
const auditStub = {
  _generated_at: "2026-07-09T00:00:00+00:00",
  title_cards: [
    { raw_title: "Fire Technology Training FIRE 101", unified_title: null,
      tags: ["unclassified_in_map"], band: "<0.40", colleges: ["Rio Hondo College"] },
    { raw_title: "CD-005", unified_title: null,
      tags: ["unclassified_in_map"], band: "<0.40" },
    { raw_title: "Raw Suggested", unified_title: null,
      tags: ["unclassified_in_map"], band: "<0.40" },
    { raw_title: "Raw Preseeded", unified_title: null,
      tags: ["unclassified_in_map"], band: "<0.40" },
    { raw_title: "Raw Assigned Existing", unified_title: null,
      tags: ["unclassified_in_map"], band: "<0.40" },
    { raw_title: "Raw Assigned Initiated", unified_title: null,
      tags: ["unclassified_in_map"], band: "<0.40" },
    { raw_title: "Raw Assigned New", unified_title: null,
      tags: ["unclassified_in_map"], band: "<0.40" },
    { raw_title: "Raw Assigned New Twin", unified_title: null,
      tags: ["unclassified_in_map"], band: "<0.40" },
  ],
  stats: {},
};
const suggStub = { suggestions: {
  "Raw Suggested": [{ kind: "local", title: "Suggested Course Title", code: "X 1", share: 0.8 }],
} };
const preseedStub = { staged: {
  "Raw Preseeded": { title: "Preseeded Title", issuer: "", via: "cx", confidence: 0.7, note: "" },
} };
const overlayRows = [
  { course_id: "_UNCLASSIFIED::Raw Assigned Existing", field: "unified_title_assignment",
    value: "Alpha Credential", reviewer_email: "map@rccd.edu", reviewed_at: "2026-07-09T14:00:00+00:00" },
  { course_id: "_UNCLASSIFIED::Raw Assigned Initiated", field: "unified_title_assignment",
    value: "Beta Credential", reviewer_email: "map@rccd.edu", reviewed_at: "2026-07-09T14:00:00+00:00" },
  // two raws assigned to the SAME brand-new title — Initiate All must dedupe
  { course_id: "_UNCLASSIFIED::Raw Assigned New", field: "unified_title_assignment",
    value: "Brand New Credential", reviewer_email: "map@rccd.edu", reviewed_at: "2026-07-09T14:00:00+00:00" },
  { course_id: "_UNCLASSIFIED::Raw Assigned New Twin", field: "unified_title_assignment",
    value: "Brand New Credential", reviewer_email: "map@rccd.edu", reviewed_at: "2026-07-09T14:00:00+00:00" },
];

function makeDom(opts) {
  opts = opts || {};
  const html = `<!DOCTYPE html><html><body>
  <div id="tab-credential-reference">
    <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
  </div></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  window.CPL_CREDENTIAL_REFERENCE = { _generated_at: "t", top_categories: {}, unified_titles: fixtureRows };
  window.CPL_REPORT_PROXY_URL = "https://proxy.example/";
  window.sessionStorage.setItem("cpl_sb", JSON.stringify({
    access_token: "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Im1hcEByY2NkLmVkdSJ9.b2xk",
    refresh_token: "rt-1", email: "map@rccd.edu", exp: Date.now() + 3600e3,
  }));
  window.confirm = function () { return true; };
  const log = { writes: [], opened: [] };
  window.open = function (url) { log.opened.push(String(url)); return null; };
  window.fetch = function (url, o) {
    url = String(url); const method = (o && o.method) || "GET";
    const respond = (body, status) => Promise.resolve({
      ok: !status || status < 400, status: status || 200,
      json: () => Promise.resolve(body),
    });
    if (url.indexOf("exhibit_audit/latest.json") >= 0) return respond(auditStub);
    if (url.indexOf("unclassified_preseed.json") >= 0) return respond(preseedStub);
    if (url.indexOf("unclassified_suggestions.json") >= 0) return respond(suggStub);
    if (url.indexOf("issuer_preseed.json") >= 0) return respond({ staged: {} });
    if (url.indexOf("kb_curation") >= 0 && method === "GET") return respond(overlayRows);
    if (method === "POST" || method === "DELETE") {
      log.writes.push({ url, body: o.body && JSON.parse(o.body) });
      return respond([], 201);
    }
    return respond([]);
  };
  window.eval(src);
  return { window, log };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function openUnc() {
  const ctx = makeDom();
  await sleep(80);
  Array.from(ctx.window.document.querySelectorAll(".cr-lane"))
    .find((b) => /Unclassified/.test(b.textContent)).click();
  await sleep(80);
  return ctx;
}
const rowByRaw = (doc, raw) => Array.from(doc.querySelectorAll(".cr-wl-table tbody tr"))
  .find((r) => txt(r.querySelector(".cr-wl-rawt")) === raw);

(async () => {
  const { window, log } = await openUnc();
  const doc = window.document;

  // ── 1. lookup pair on every unc row ──
  const fireRow = rowByRaw(doc, "Fire Technology Training FIRE 101");
  check("lookup: 🔎 what-is-this present on an unc row",
    !!fireRow && !!fireRow.querySelector(".cr-ni-tsearch"));
  check("lookup: ✨ suggest present when the report proxy is configured",
    !!fireRow.querySelector(".cr-ni-tsuggest"));
  fireRow.querySelector(".cr-ni-tsearch").click();
  check("lookup: 🔎 opens a search with the raw title + originating college",
    log.opened.length === 1
    && log.opened[0].indexOf(encodeURIComponent("\"Fire Technology Training FIRE 101\"")) >= 0
    && log.opened[0].indexOf(encodeURIComponent("Rio Hondo College")) >= 0);

  // typed input wins over the raw title in the search ctx
  const fireInp = fireRow.querySelector(".cr-wl-title-input");
  fireInp.value = "Fire Academy Basics";
  fireInp.dispatchEvent(new window.Event("input", { bubbles: true }));
  fireRow.querySelector(".cr-ni-tsearch").click();
  check("lookup: typed title takes precedence in the 🔎 query",
    log.opened[1].indexOf(encodeURIComponent("\"Fire Academy Basics\"")) >= 0);

  // ── 2. the ⤷ use-raw-title chip ──
  const fireChip = fireRow.querySelector(".cr-wl-rawfill");
  check("rawfill: chip present on a bare row", !!fireChip);
  check("rawfill: chip strips the trailing course-code text",
    txt(fireChip) === "⤷ Fire Technology Training");
  fireChip.click();
  check("rawfill: click fills the title input with the stripped title",
    fireRow.querySelector(".cr-wl-title-input").value === "Fire Technology Training");

  const cdRow = rowByRaw(doc, "CD-005");
  const cdChip = cdRow && cdRow.querySelector(".cr-wl-rawfill");
  check("rawfill: an all-code raw title falls back to verbatim (still one click)",
    !!cdChip && txt(cdChip) === "⤷ CD-005");

  check("rawfill: NO chip when a 💡 suggestion exists",
    !rowByRaw(doc, "Raw Suggested").querySelector(".cr-wl-rawfill"));
  check("rawfill: NO chip when an ⚡ pre-seed prefills the row",
    !rowByRaw(doc, "Raw Preseeded").querySelector(".cr-wl-rawfill"));

  // ── 3. Initiate all assigned ──
  const initBtn = doc.getElementById("cr-wl-initall");
  check("init-all: button present with the deduped, skip-initiated count (2)",
    !!initBtn && txt(initBtn) === "✓ Initiate all assigned (2)");
  initBtn.click();
  await sleep(60);
  const markers = log.writes.filter((w) =>
    w.body && w.body.field === "reviewed_marker");
  const keys = markers.map((w) => w.body.course_id).sort();
  check("init-all: writes reviewed_marker for the existing UNinitiated target (row key)",
    keys.indexOf("_CREDENTIAL_REVIEW::Alpha Credential") >= 0);
  check("init-all: writes reviewed_marker for the brand-new title (deduped across twin raws)",
    keys.filter((k) => k === "_CREDENTIAL_REVIEW::Brand New Credential").length === 1);
  check("init-all: SKIPS the already-initiated target", markers.length === 2
    && keys.indexOf("_CREDENTIAL_REVIEW::Beta Credential") < 0);
  check("init-all: button reports completion", txt(initBtn).indexOf("2 initiated") >= 0);

  // ── report ──
  let fail = 0;
  results.forEach(([name, ok]) => {
    console.log((ok ? "  ✓ " : "  ✗ ") + name);
    if (!ok) fail++;
  });
  console.log(`\ncer_unclass_lookup: ${results.length - fail}/${results.length} checks passed`);
  if (fail) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
