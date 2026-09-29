// MAP Export tab (map_export.js) — jsdom test.
//
// Guards:
//  (a) Rule 4 (both HTMLs identical) + the nav button / pane / lazy-boot are
//      present in BOTH HTMLs, and Malone's FullExhibitJSON sample is committed
//      at kb/reference/map_full_exhibit_sample.json (provenance);
//  (b) buildEntries/buildRecord map a stub CPL_CREDENTIAL_REFERENCE payload to
//      Malone's shape — honest nulls, status, classification (cpl_types joined,
//      TOP name via 2-digit prefix), criteria min/max units + courseNumber +
//      cidDisplayText (C-ID only), adoptions = college UNION across
//      articulations, evidence gated on an issuer existing;
//  (c) the live-overlay resolution — unified_title_override WINS over the baked
//      title; issuer override + " | "-joined additional issuers; trainer;
//  (d) the COBI extensions — localVariants populated from raw_variants (r/c/q),
//      [] when null; trainingAgency; _meta documents them;
//  (e) CSV row count + download-all JSON parses with _meta present;
//  (f) search filters the list (title / issuer / raw variant), and the
//      overlay-unavailable note renders on fetch failure;
//  (g) XSS — a hostile title renders via textContent (no live element).
//
// Run from repo root: `npm test` (or `node tests/map_export.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants on the shipped HTML + the committed sample ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
[["CPL_Dashboard.html", cpl], ["index.html", idx]].forEach(function (p) {
  check("nav button in " + p[0], /data-tab="map-export"[^>]*>MAP Export</.test(p[1]));
  check("pane #map-export-root in " + p[0], /id="map-export-root"/.test(p[1]));
  check("lazy boot loadScript in " + p[0], /loadScript\('map_export\.js', 'CPL_MAP_EXPORT_TAB'/.test(p[1]));
});
// Malone's sample committed verbatim for provenance.
let sample = null;
try { sample = JSON.parse(fs.readFileSync("kb/reference/map_full_exhibit_sample.json", "utf8")); } catch (e) {}
check("sample JSON committed + parses", !!sample);
check("sample carries the FullExhibitJSON keys",
  !!sample && "exhibitId" in sample && Array.isArray(sample.criteria) && !!sample.classification && !!sample.adoptions);

// ── Part B — behavior, loaded into jsdom ──
const SRC = fs.readFileSync("map_export.js", "utf8");

// Stub CER payload: row 1 = multi-articulation / multi-college; row 2 = fully
// overridden via the overlay; row 3 = no issuer / no articulations / null
// raw_variants (the honest-empty case).
function stubPayload() {
  return {
    _generated_at: "2026-07-09T00:00:00+00:00",
    top_categories: { "05": "Business and Management", "07": "Information Technology" },
    unified_titles: [
      {
        ut: "CompTIA A+ Certification", issuer: "CompTIA", trainer: null,
        cpl_types: ["Industry Certification"], top_modal: "0708.00",
        gen_rec: "3 hours in Computer Fundamentals",
        raw_variants: [
          { r: "COMPTIA A+", c: 0.9 },
          { r: "CompTIA A Plus Cert", c: 0.7, q: "suspect_course_as_exhibit" },
        ],
        articulations: [
          { cid: "ITIS 110", sys: "C-ID", title: "Computer Hardware", disc: "CS", top: "0708.00",
            local: [
              { subj: "CIS", num: "101", t: "Hardware", colleges: ["Alpha College", "Beta College"], u: 3 },
              { subj: "CIT", num: "5", t: "Hardware II", colleges: ["Beta College", "Gamma College"], u: 4 },
            ] },
          { cid: "CNSR M10AA", sys: "M-ID", title: "Networking Basics", disc: "CS", top: "0708.00",
            local: [{ subj: "NET", num: "1", t: "Net", colleges: ["Alpha College"], u: 2 }] },
        ],
      },
      {
        ut: "Old Title Credential", issuer: "Old Issuer", trainer: "Old Trainer",
        cpl_types: ["Credit By Exam", "Industry Certification"], top_modal: "0514.00",
        gen_rec: "1 hour in Something",
        raw_variants: [{ r: "OLD TITLE RAW", c: 0.5 }],
        articulations: [
          { cid: "BUSI M9001", sys: "M-ID", title: "Something", disc: "Business", top: "0514.00",
            local: [{ subj: "BUS", num: "375", t: "Something", colleges: ["Delta College"], u: 1 }] },
        ],
      },
      {
        ut: "No Issuer Credential", issuer: null, trainer: null,
        cpl_types: [], top_modal: null, gen_rec: "",
        raw_variants: null, articulations: [],
      },
    ],
  };
}

function stubOverlayRows() {
  return [
    { course_id: "_CREDENTIAL_REVIEW::Old Title Credential", field: "unified_title_override", value: "New Shiny Title" },
    { course_id: "_CREDENTIAL_REVIEW::Old Title Credential", field: "issuing_agency_override", value: "New Issuer" },
    { course_id: "_CREDENTIAL_REVIEW::Old Title Credential", field: "issuing_agency_additional_override", value: "Extra Agency | Another Agency" },
    { course_id: "_CREDENTIAL_REVIEW::Old Title Credential", field: "training_agency_override", value: "New Trainer" },
    { course_id: "_CREDENTIAL_REVIEW::Old Title Credential", field: "reviewed_marker", value: "1" }, // ignored field
  ];
}

function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="map-export-root" style="border:1px dashed gray"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.CPL_CREDENTIAL_REFERENCE = opts.payload === undefined ? stubPayload() : opts.payload;
  w.fetch = function (url, init) {
    w.__fetches = w.__fetches || [];
    w.__fetches.push({ url: url, init: init || {} });
    if (opts.fetchFails) return Promise.reject(new Error("network down"));
    return Promise.resolve({
      ok: true,
      json: function () { return Promise.resolve(opts.overlayRows || []); },
    });
  };
  const el = w.document.createElement("script");
  el.textContent = SRC;
  w.document.body.appendChild(el);
  return w;
}

// buildEntries + record shape (no overlay)
(function () {
  const w = makeWin();
  const api = w.CPL_MAP_EXPORT_TAB;
  const entries = api._buildEntries(stubPayload(), {});
  check("buildEntries: one record per unified_title", entries.length === 3);
  const rec = entries[0].rec;
  check("record: title = baked canonical when no override", rec.title === "CompTIA A+ Certification");
  check("record: honest nulls (exhibitId/aceId/description/sourceId/notes)",
    rec.exhibitId === null && rec.aceId === null && rec.description === null && rec.sourceId === null && rec.notes === null);
  check("record: minimal Active status", rec.status && rec.status.combinedStatusName === "Active");
  const cl = rec.classification;
  check("classification: cplTypeDescription from cpl_types", cl.cplTypeDescription === "Industry Certification");
  check("classification: null ids (cplTypeId/learningMode/estimatedUnits/cip/soc)",
    cl.cplTypeId === null && cl.learningModeId === null && cl.learningModeDescription === null &&
    cl.estimatedUnits === null && cl.cipCodeID === null && cl.socCodeID === null);
  check("classification: agency = baked issuer", cl.agency === "CompTIA");
  check("classification: topCodeID kept verbatim", cl.topCodeID === "0708.00");
  check("classification: topCodeName looked up by 2-digit prefix", cl.topCodeName === "Information Technology");
  const multiTypes = entries[1].rec.classification.cplTypeDescription;
  check("classification: multiple cpl_types joined with ' | '", multiTypes === "Credit By Exam | Industry Certification");
  check("classification: no top_modal → null topCode fields",
    entries[2].rec.classification.topCodeID === null && entries[2].rec.classification.topCodeName === null);

  // criteria
  check("criteria: one per articulation line", rec.criteria.length === 2);
  const c0 = rec.criteria[0], c1 = rec.criteria[1];
  check("criteria: min/max units across local courses", c0.minUnits === 3 && c0.maxUnits === 4);
  check("criteria: single-local line min == max", c1.minUnits === 2 && c1.maxUnits === 2);
  check("criteria: courseNumber = first local subj+num", c0.course.courseNumber === "CIS 101");
  check("criteria: course.title = articulation title", c0.course.title === "Computer Hardware");
  check("criteria: cidDisplayText only for sys C-ID", c0.course.cidDisplayText === "ITIS 110" && c1.course.cidDisplayText === "");
  check("criteria: isArticulated true", c0.isArticulated === true && c1.isArticulated === true);
  check("criteria: multi-line row uses per-articulation titles", c0.criteria === "Computer Hardware" && c0.criteriaNormalized === c0.criteria);
  const single = entries[1].rec.criteria[0];
  check("criteria: single-line row uses gen_rec", single.criteria === "1 hour in Something");

  // adoptions — union, deduped
  const adopted = rec.adoptions.adoptedByColleges;
  check("adoptions: union of colleges across articulations (3, deduped)",
    adopted.length === 3 &&
    adopted.map(function (c) { return c.collegeName; }).sort().join("|") === "Alpha College|Beta College|Gamma College");
  check("adoptions: collegeId null (MAP assigns)", adopted.every(function (c) { return c.collegeId === null; }));

  // evidence — gated on issuer
  check("evidence: Certificate entry when an issuer exists",
    rec.evidence.length === 1 && rec.evidence[0].evidenceTypeName === "Certificate" && rec.evidence[0].issuer === "CompTIA"
    && rec.evidence[0].description === null && rec.evidence[0].submissionGuidelines === null);
  check("evidence: [] when no issuer", Array.isArray(entries[2].rec.evidence) && entries[2].rec.evidence.length === 0);

  // COBI extensions
  check("localVariants: populated from raw_variants (r/c/q)",
    rec.localVariants.length === 2 && rec.localVariants[0].rawTitle === "COMPTIA A+"
    && rec.localVariants[0].confidence === 0.9 && rec.localVariants[0].qualityFlag === null
    && rec.localVariants[1].qualityFlag === "suspect_course_as_exhibit");
  check("localVariants: [] when raw_variants null", Array.isArray(entries[2].rec.localVariants) && entries[2].rec.localVariants.length === 0);
  check("trainingAgency: baked trainer (null-safe)", entries[1].rec.trainingAgency === "Old Trainer" && rec.trainingAgency === null);
})();

// overlay resolution — overrides win
(function () {
  const w = makeWin();
  const api = w.CPL_MAP_EXPORT_TAB;
  const overlayMap = {
    "Old Title Credential": {
      utitle: "New Shiny Title",
      issuer: "New Issuer",
      issuer2: "Extra Agency | Another Agency",
      trainer: "New Trainer",
    },
  };
  const entries = api._buildEntries(stubPayload(), overlayMap);
  const rec = entries[1].rec;
  check("overlay: unified_title_override wins as the title", rec.title === "New Shiny Title");
  check("overlay: issuer override + ' | '-joined additional issuers",
    rec.classification.agency === "New Issuer | Extra Agency | Another Agency");
  check("overlay: evidence issuer = resolved agency", rec.evidence[0].issuer === "New Issuer | Extra Agency | Another Agency");
  check("overlay: trainer override wins", rec.trainingAgency === "New Trainer");
  check("overlay: untouched rows keep baked values", entries[0].rec.title === "CompTIA A+ Certification");
  // cleared issuer ("" override) → no agency, no evidence
  const cleared = api._buildEntries(stubPayload(), { "CompTIA A+ Certification": { issuer: "" } });
  check("overlay: cleared ('') issuer → agency null + evidence []",
    cleared[0].rec.classification.agency === null && cleared[0].rec.evidence.length === 0);
})();

// fetchOverlay — endpoint shape, field mapping, fail-soft
(function () {
  const w = makeWin({ overlayRows: stubOverlayRows() });
  const api = w.CPL_MAP_EXPORT_TAB;
  api._fetchOverlay().then(function (ov) {
    check("fetchOverlay: ok on success", ov.ok === true);
    const rec = ov.map["Old Title Credential"];
    check("fetchOverlay: maps the 4 fields of interest",
      !!rec && rec.utitle === "New Shiny Title" && rec.issuer === "New Issuer"
      && rec.issuer2 === "Extra Agency | Another Agency" && rec.trainer === "New Trainer");
    check("fetchOverlay: ignores other fields (reviewed_marker)", !("reviewed_marker" in (rec || {})));
    const f = w.__fetches[0];
    check("fetchOverlay: hits kb_curation with the _CREDENTIAL_REVIEW namespace filter",
      f.url.indexOf("/rest/v1/kb_curation") >= 0 && f.url.indexOf("course_id=like.") >= 0
      && decodeURIComponent(f.url).indexOf("_CREDENTIAL_REVIEW::") >= 0);
    check("fetchOverlay: paginates with Range headers over a stable order",
      f.init.headers && f.init.headers.Range === "0-999" && f.url.indexOf("order=course_id.asc") >= 0);
  });
})();

// CSV + download-all JSON
(function () {
  const w = makeWin();
  const api = w.CPL_MAP_EXPORT_TAB;
  const entries = api._buildEntries(stubPayload(), {
    "Old Title Credential": { utitle: "New Shiny Title", issuer: "New Issuer", issuer2: "Extra Agency" },
  });
  const csv = api._csv(entries);
  const lines = csv.split("\n");
  check("CSV: header + one row per credential (4 lines)", lines.length === 4);
  check("CSV: header carries the flat columns",
    lines[0] === "title,issuer,additional_issuers,trainer,cpl_type,top_code,n_criteria,n_colleges,n_variants");
  check("CSV: overridden issuer + additional issuers land in their columns",
    /New Shiny Title,New Issuer,Extra Agency/.test(csv));
  check("CSV: counts row (2 criteria / 3 colleges / 2 variants)",
    lines[1].indexOf(",2,3,2") === lines[1].length - 6);
  check("CSV: cpl_type cell with comma-free join is unquoted",
    lines[2].indexOf("Credit By Exam | Industry Certification") >= 0);

  const json = api._exportJson(entries, stubPayload(), true);
  let parsed = null;
  try { parsed = JSON.parse(json); } catch (e) {}
  check("download-all JSON: parses", !!parsed);
  check("download-all JSON: _meta present with source + count",
    !!parsed && parsed._meta && parsed._meta.source === "COBI Credential Reference (canonical layer)"
    && parsed._meta.record_count === 3 && parsed._meta.curation_overlay_applied === true
    && parsed._meta.map_schema_sample === "kb/reference/map_full_exhibit_sample.json");
  check("download-all JSON: _meta documents the extension fields",
    !!parsed && /localVariants/.test(parsed._meta.extensions) && /trainingAgency/.test(parsed._meta.extensions));
  check("download-all JSON: exhibits array carries every record", !!parsed && parsed.exhibits.length === 3);
})();

// boot + render: list, detail, search filter, overlay note, XSS
(function () {
  const w = makeWin({ overlayRows: stubOverlayRows() });
  const api = w.CPL_MAP_EXPORT_TAB;
  api.boot();
  setTimeout(function () {
    const root = w.document.getElementById("map-export-root");
    const html = root.innerHTML;
    check("render: header line with count + sample path",
      html.indexOf("MAP Export") >= 0 && html.indexOf("3 canonical credentials") >= 0
      && html.indexOf("kb/reference/map_full_exhibit_sample.json") >= 0);
    check("render: no overlay-unavailable note when the fetch succeeded", html.indexOf("overlay unavailable") < 0);
    const rows = root.querySelectorAll(".cplmx-row");
    check("render: a list row per credential", rows.length === 3);
    check("render: overlay title shows in the list", html.indexOf("New Shiny Title") >= 0);
    check("render: download buttons present",
      html.indexOf("⬇ Download all (JSON)") >= 0 && html.indexOf("⬇ CSV") >= 0);
    // first row selected by default → detail <pre> shows its JSON
    const pre = root.querySelector(".cplmx-pre");
    check("render: detail pre shows the selected record's JSON",
      !!pre && pre.textContent.indexOf('"title": "CompTIA A+ Certification"') >= 0
      && pre.textContent.indexOf('"combinedStatusName": "Active"') >= 0);
    check("render: per-record ⬇ + ⧉ copy affordances", !!root.querySelector('.cplmx-detail-head') &&
      root.querySelector(".cplmx-detail-head").textContent.indexOf("⬇") >= 0 &&
      root.querySelector(".cplmx-detail-head").textContent.indexOf("⧉") >= 0);
    // click the second row → detail switches
    rows[1].click();
    check("render: clicking a row switches the detail",
      root.querySelector(".cplmx-pre").textContent.indexOf('"title": "New Shiny Title"') >= 0);
    // search by raw variant text
    const q = root.querySelector("input.q");
    q.value = "OLD TITLE RAW";
    q.dispatchEvent(new w.Event("input"));
    check("search: raw-variant text matches its credential",
      root.querySelectorAll(".cplmx-row").length === 1 &&
      root.querySelector(".cplmx-row .t").textContent === "New Shiny Title");
    q.value = "comptia";
    q.dispatchEvent(new w.Event("input"));
    check("search: title/issuer match (case-insensitive)", root.querySelectorAll(".cplmx-row").length === 1);
    q.value = "zzz-no-match";
    q.dispatchEvent(new w.Event("input"));
    check("search: no match → empty state", root.innerHTML.indexOf("No credentials match") >= 0);
    report();
  }, 40);
})();

// overlay fetch failure → fail-soft render with a note; XSS-hostile title
(function () {
  const payload = stubPayload();
  payload.unified_titles[0].ut = 'Evil <script>alert(1)</script> Cert';
  const w = makeWin({ payload: payload, fetchFails: true });
  w.CPL_MAP_EXPORT_TAB.boot();
  setTimeout(function () {
    const root = w.document.getElementById("map-export-root");
    check("fail-soft: renders from the baked payload on overlay failure",
      root.querySelectorAll(".cplmx-row").length === 3);
    check("fail-soft: shows the overlay-unavailable note", root.innerHTML.indexOf("overlay unavailable") >= 0);
    check("XSS: hostile title is text, never a live element",
      root.getElementsByTagName("script").length === 0 && root.innerHTML.indexOf("Evil &lt;script&gt;") >= 0);
  }, 40);
})();

// ── report (deferred so the async boot checks land first) ──
let reported = false;
function report() {
  if (reported) return;
  reported = true;
  setTimeout(function () {
    let failed = 0;
    for (const [name, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; }
    console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
    process.exit(failed ? 1 : 0);
  }, 60);
}
setTimeout(report, 500); // safety net if the async block never calls report()
