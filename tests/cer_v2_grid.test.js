// CER v2 — the triage-first single-surface redesign (2026-07-09, design
// locked on prototype/cer_triage_redesign_v1.html). Guards the failure modes
// the port introduced:
//   - lane chips render with counts and filter ONE surface (grid + triage
//     sections share the lane bar; no more separate worklist button)
//   - the main grid edits IN-CELL: title/issuer/trainer inputs, dirty stripe,
//     per-row 💾 Save writing the SAME kb_curation overrides as the Curate
//     panel, Save-all counter
//   - SUBJ column (modal SUBJ4 from articulations) beside Discipline
//   - retired columns: Audit + Quality flag headers GONE; Eligible units +
//     Variants + Confidence hidden by default, resurrectable via ⚙ Columns
//   - "Eligible students" renamed "Students"
//   - ⬇ Excel (CSV) + ⬇ JSON extract buttons produce live overlay-applied data
//
// Run from repo root: `npm test` (or `node tests/cer_v2_grid.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const payload = { _generated_at: "t", top_categories: { "07": "Information Technology" }, unified_titles: [
  { ut: "CompTIA A+ Certification", raw_count: 2, conf_title: 0.96,
    issuer: "CompTIA", trainer: null, students_served: 412,
    cpl_types: ["Industry Certification"], audit_tags: {}, audit_tag_total: 0,
    raw_variants: [{ r: "CompTIA A+", c: 0.96 }, { r: "COMPTIA A+ Cert", c: 0.9 }],
    articulations: [
      { cid: "CISC M1210", sys: "M-ID", t: "Computer Hardware Fundamentals",
        disc: "Computer Information Systems", local: [] },
      { cid: "CISC M1300", sys: "M-ID", t: "IT Essentials",
        disc: "Computer Information Systems", local: [] },
    ] },
  { ut: "Fire Inspector I", raw_count: 3, conf_title: 0.88,
    issuer: "ICC", trainer: null, students_served: null, served_suppressed: true,
    cpl_types: ["Industry Certification"], audit_tags: { x: 1 }, audit_tag_total: 1,
    quality_flag: "suspect_course_as_exhibit",
    raw_variants: [{ r: "Fire Inspector 1 - ICC", c: 0.88 }],
    articulations: [{ cid: "FIRE M1032", sys: "M-ID", t: "Fire Prevention",
      disc: "Fire Technology", local: [] }] },
  { ut: "Retail Management Certificate", raw_count: 1, conf_title: 0.71,
    issuer: null, trainer: "WAFC", students_served: 58,
    cpl_types: ["Industry Certification"], audit_tags: {}, audit_tag_total: 0,
    raw_variants: [{ r: "WAFC Retail Management Cert", c: 0.71 }],
    articulations: [] },
] };

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
  // Capture downloads: Blob text + createObjectURL stub.
  window.URL.createObjectURL = function (blob) {
    log.blobs.push(blob);
    return "blob:stub";
  };
  window.URL.revokeObjectURL = function () {};
  window.fetch = function (url, o) {
    url = String(url); const method = (o && o.method) || "GET";
    const respond = (body, status) => Promise.resolve({
      ok: !status || status < 400, status: status || 200,
      json: () => Promise.resolve(body),
    });
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
const laneBtn = (doc, rx) => Array.from(doc.querySelectorAll(".cr-lane"))
  .find((b) => rx.test(b.textContent));
const rowByTitle = (doc, needle) => Array.from(doc.querySelectorAll("tr.cr-row"))
  .find((tr) => {
    const inp = tr.querySelector(".cr-title-in");
    return inp ? inp.value.indexOf(needle) >= 0 : txt(tr).indexOf(needle) >= 0;
  });

(async () => {
  // ── A. one surface: lanes + the lean grid ──
  const { window, log } = makeDom({});
  const doc = window.document;
  await sleep(150);

  const lanes = Array.from(doc.querySelectorAll(".cr-lane"));
  check("lanes: 6 chips render", lanes.length === 6);
  check("lanes: All carries the row count", /All \(3\)/.test(txt(laneBtn(doc, /All/))));
  check("lanes: No-issuer count = 1 (Retail Management)",
    /No issuer \(1\)/.test(txt(laneBtn(doc, /No issuer/))));
  check("lanes: Not-initiated = 3", /Not initiated \(3\)/.test(txt(laneBtn(doc, /Not initiated/))));
  check("toolbar: the old ⚠ Triage button is GONE", !doc.querySelector(".cr-triage-btn"));

  const ths = Array.from(doc.querySelectorAll("table.cr-table thead th")).map(txt);
  check("columns: SUBJ present beside Discipline",
    ths.some((t) => /^SUBJ/.test(t))
    && ths.findIndex((t) => /^SUBJ/.test(t)) + 1 === ths.findIndex((t) => /^Discipline/.test(t)));
  check("columns: Students renamed (no 'Eligible students')",
    ths.some((t) => /^Students/.test(t)) && !ths.some((t) => /Eligible students/.test(t)));
  check("columns: Audit + Quality flag headers RETIRED",
    !ths.some((t) => /^Audit/.test(t)) && !ths.some((t) => /Quality flag/.test(t)));
  check("columns: Eligible units hidden by default", !ths.some((t) => /Elig\./.test(t)));
  check("columns: Trainer present", ths.some((t) => /^Trainer/.test(t)));

  // SUBJ derivation: modal across articulations.
  const comptia = rowByTitle(doc, "CompTIA A+");
  check("SUBJ: CompTIA row shows modal SUBJ4 CISC",
    !!comptia && txt(comptia.querySelector(".cr-subj")) === "CISC");

  // ── B. in-cell editing: title + trainer, dirty → Save → overrides ──
  const titleInp = comptia.querySelector(".cr-title-in");
  check("in-cell: title renders as an input (signed in)", !!titleInp);
  titleInp.value = "CompTIA A+ (Core 1 + Core 2)";
  titleInp.dispatchEvent(new window.Event("input"));
  await sleep(20);
  check("in-cell: dirty stripe class applied", comptia.classList.contains("cr-dirty"));
  const saveAll = doc.querySelector(".cr-saveall");
  check("in-cell: Save-all counter appears", !!saveAll && /Save all \(1\)/.test(txt(saveAll)));

  const trInp = comptia.querySelector(".cr-trainer-in");
  trInp.value = "Certiport";
  trInp.dispatchEvent(new window.Event("input"));
  await sleep(20);
  comptia.querySelector(".cr-grid-save").click();
  await sleep(150);
  const bodies = log.writes.map((w) => w.body).filter(Boolean);
  check("save: unified_title_override written",
    bodies.some((b) => b.field === "unified_title_override"
      && b.value === "CompTIA A+ (Core 1 + Core 2)"
      && b.course_id === "_CREDENTIAL_REVIEW::CompTIA A+ Certification"));
  check("save: training_agency_override written",
    bodies.some((b) => b.field === "training_agency_override" && b.value === "Certiport"));
  check("save: NO issuer write (unchanged field)",
    !bodies.some((b) => b.field === "issuing_agency_override"));
  check("save: row flips to saved state", comptia.classList.contains("cr-saved"));

  // ── C. ＋ issuer (additional agencies) joins " | " into ONE override ──
  const fire = rowByTitle(doc, "Fire Inspector I");
  fire.querySelector(".cr-issuer-add").click();
  await sleep(30);
  const fire2 = rowByTitle(doc, "Fire Inspector I");  // re-render replaced the row
  const extra = fire2.querySelector(".cr-issuer-in2");
  check("＋issuer: an additional-agency input appears", !!extra);
  extra.value = "NFPA";
  extra.dispatchEvent(new window.Event("input"));
  await sleep(20);
  fire2.querySelector(".cr-grid-save").click();
  await sleep(150);
  const bodies2 = log.writes.map((w) => w.body).filter(Boolean);
  check("＋issuer: issuing_agency_additional_override written",
    bodies2.some((b) => b.field === "issuing_agency_additional_override" && b.value === "NFPA"));

  // ── D. ⚙ Columns picker resurrects a hidden column ──
  const colPanel = doc.querySelector(".cr-cols-panel");
  const eligLabel = Array.from(colPanel.querySelectorAll("label"))
    .find((l) => /Eligible units/.test(txt(l)));
  eligLabel.querySelector("input").click();
  await sleep(30);
  const ths2 = Array.from(doc.querySelectorAll("table.cr-table thead th")).map(txt);
  check("⚙ columns: Eligible units resurrects", ths2.some((t) => /Elig\./.test(t)));
  check("⚙ columns: pref persisted per-browser",
    JSON.parse(window.localStorage.getItem("cplCerCols.v1")).elig === true);

  // ── E. extract buttons: live CSV + JSON ──
  const exportBtns = Array.from(doc.querySelectorAll(".cr-export-btn"));
  check("exports: both buttons render", exportBtns.length === 2);
  exportBtns[1].click();  // ⬇ JSON
  await sleep(30);
  check("exports: JSON download produced", log.blobs.length >= 1);
  const jsonText = await log.blobs[log.blobs.length - 1].text();
  const parsed = JSON.parse(jsonText);
  check("exports: JSON carries _meta + credentials", !!parsed._meta && parsed.credentials.length === 3);
  const compRec = parsed.credentials.find((c) => c.kb_key === "CompTIA A+ Certification");
  check("exports: JSON reflects the LIVE title override (saved this session)",
    compRec.unified_title === "CompTIA A+ (Core 1 + Core 2)");
  check("exports: JSON carries SUBJ + raw variants",
    compRec.subj === "CISC" && compRec.raw_variants.length === 2);
  exportBtns[0].click();  // ⬇ Excel (CSV)
  await sleep(30);
  const csvText = await log.blobs[log.blobs.length - 1].text();
  check("exports: CSV header row present", /Unified Title,Issuing Agency/.test(csvText));
  check("exports: CSV has one line per credential (+header)",
    csvText.trim().split("\n").length === 4);

  // ── F. lane switch renders the triage section in the SAME surface ──
  laneBtn(doc, /No issuer/).click();
  await sleep(80);
  check("lane switch: No-issuer renders the in-cell issuer lane",
    !!doc.querySelector(".cr-ni-table"));
  check("lane switch: grid hidden while the lane is active",
    !doc.querySelector("table.cr-grid-v2"));
  laneBtn(doc, /All/).click();
  await sleep(80);
  check("lane switch: All returns to the grid", !!doc.querySelector("table.cr-grid-v2"));

  // ── G. signed-out: read-only grid (no inputs), title still expands ──
  const anon = makeDom({ signedIn: false });
  await sleep(150);
  const adoc = anon.window.document;
  check("anon: no in-cell inputs", !adoc.querySelector(".cr-cellin"));
  check("anon: title renders as the expand toggle", !!adoc.querySelector(".cr-title-toggle"));
  check("anon: no Save-all", !adoc.querySelector(".cr-saveall"));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
