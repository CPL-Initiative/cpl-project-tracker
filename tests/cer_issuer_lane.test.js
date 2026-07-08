// Session 105 (2026-07-08) — the missing-issuer triage lane + the "＋ set"
// direct-to-edit fix + the live issuer datalist.
// Session 106 (2026-07-08) — Sam's asks: (1) the pre-seeded exhibit TITLE is
// editable right in the lane (saves the standard unified_title_override);
// (2) each row shows the raw college-entered title(s) + originating college
// so triage completes without flipping to the main CER list; (3) Rule 5f —
// HS/ROP/adult-school Cx rows stage the school as BOTH issuer and trainer
// (training_agency_override rides the same Save), and issuer-carrying rows
// staged for title/trainer cleanup RESURFACE in the lane without ever
// rewriting their real issuer.
//
// Run from repo root: `npm test` (or `node tests/cer_issuer_lane.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const payload = { _generated_at: "t", top_categories: {}, unified_titles: [
  // the 10-Key case: null issuer, no preseed
  { ut: "10-Key Data Entry", raw_count: 2, conf_title: 0.45, issuer: null,
    cpl_types: ["Credit By Exam"], audit_tags: {}, audit_tag_total: 0, articulations: [] },
  // null issuer WITH a staged issuer preseed (cx lane)
  { ut: "Basic Welding CBE", raw_count: 1, conf_title: 0.7, issuer: null,
    cpl_types: ["Credit By Exam"], audit_tags: {}, audit_tag_total: 0, articulations: [] },
  // Rule 5f: null issuer + null trainer, school-decorated title, staged
  // title+issuer+trainer (a baked trainer already equal to the school would
  // correctly suppress the trainer write — that no-op path is deliberate)
  { ut: "Business and Finance (High School Articulation)", raw_count: 1,
    conf_title: 0.65, issuer: null, trainer: null,
    cpl_types: ["Credit By Exam"], audit_tags: {}, audit_tag_total: 0,
    articulations: [],
    raw_variants: [{ r: "SUMMIT HIGH SCHOOL- Business and Finance", c: 0.65 }] },
  // Rule 5f RESURFACE: issuer already set (PLTW) — staged title/trainer only
  { ut: "PLTW Civil Engineering and Architecture — Baldy View ROP", raw_count: 1,
    conf_title: 0.8, issuer: "Project Lead The Way (PLTW)", trainer: null,
    cpl_types: ["Industry Certification"], audit_tags: {}, audit_tag_total: 0,
    articulations: [],
    raw_variants: [{ r: "Baldy View ROP - Civil Engineering & Architecture (CEA)", c: 0.8 }] },
  // already has an issuer and no staged cleanup — must NOT appear in the lane
  { ut: "ServSafe Manager", raw_count: 3, conf_title: 0.9,
    issuer: "National Restaurant Association",
    audit_tags: {}, audit_tag_total: 0, articulations: [] },
] };

const issuerPreseedStub = { staged: {
  "Basic Welding CBE": { issuer: "California Community Colleges", via: "cx",
    confidence: 0.7, note: "cx-typed — issuer = CCC." },
  "Business and Finance (High School Articulation)": {
    issuer: "Summit High School", trainer: "Summit High School",
    title: "Business and Finance", via: "local-trainer", confidence: 0.7,
    note: "Rule 5f: trainer-named local pathway exhibit." },
  "PLTW Civil Engineering and Architecture — Baldy View ROP": {
    issuer: null, trainer: "Baldy View Regional Occupational Program",
    title: "PLTW Civil Engineering and Architecture", via: "local-trainer",
    confidence: 0.7, resurface: true,
    note: "Rule 5f: existing issuer kept; trainer = the ROP." },
} };

// The auditor stamps originating colleges on classified cards too (S106).
const auditStub = { title_cards: [
  { raw_title: "SUMMIT HIGH SCHOOL- Business and Finance",
    unified_title: "Business and Finance (High School Articulation)",
    confidence_title: 0.65, band: "0.60-0.79", tags: [],
    colleges: ["Chaffey College"] },
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
  const log = { writes: [] };
  window.confirm = function () { return true; };
  window.fetch = function (url, o) {
    url = String(url); const method = (o && o.method) || "GET";
    const respond = (body, status) => Promise.resolve({
      ok: !status || status < 400, status: status || 200,
      json: () => Promise.resolve(body),
    });
    if (url.indexOf("exhibit_audit/latest.json") >= 0) return respond(auditStub);
    if (url.indexOf("issuer_preseed.json") >= 0) return respond(issuerPreseedStub);
    if (url.indexOf("unclassified_preseed.json") >= 0) return respond({ staged: {} });
    if (url.indexOf("unclassified_suggestions.json") >= 0) return respond({ suggestions: {} });
    if (method === "POST" || method === "DELETE") {
      log.writes.push({ url, body: o.body && JSON.parse(o.body) });
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
const rowFor = (doc, name) => Array.from(doc.querySelectorAll(".cr-ni-row"))
  .find((r) => txt(r.querySelector(".cr-wl-rawt")).indexOf(name) >= 0);

(async () => {
  // ── A. the lane inside the triage worklist ──
  const { window, log } = makeDom({});
  const doc = window.document;
  await sleep(120);

  check("toolbar: triage button carries the no-issuer count (preseed not yet loaded)",
    /· 3 no-issuer/.test(txt(doc.querySelector(".cr-triage-btn"))));

  doc.querySelector(".cr-triage-btn").click();
  await sleep(120);

  const laneTitle = doc.querySelector(".cr-ni-title");
  check("lane: renders even though the unclassified queue is clear",
    !!laneTitle && /Missing issuing agency \(4\)/.test(txt(laneTitle)));
  const rows = Array.from(doc.querySelectorAll(".cr-ni-row"));
  check("lane: null-issuer rows PLUS the staged resurface row listed", rows.length === 4);
  check("lane: issuered credential with no staged cleanup excluded",
    !rows.some((r) => txt(r).indexOf("ServSafe") >= 0));
  check("lane: staged pre-seeds sort first",
    txt(rows[0].querySelector(".cr-wl-rawt")) !== "10-Key Data Entry");
  check("toolbar: count follows the widened queue",
    /· 4 no-issuer/.test(txt(doc.querySelector(".cr-triage-btn"))));

  const psRow = rowFor(doc, "Basic Welding CBE");
  check("lane: issuer input pre-filled from the staged plan",
    psRow.querySelector(".cr-ni-input").value === "California Community Colleges");
  check("lane: ⚡ badge names the lane",
    /pre-seed · cx/.test(txt(psRow.querySelector(".cr-wl-preseed-badge"))));
  check("lane: nothing auto-saved", log.writes.length === 0);

  // ── Session 106: title editing + raw/college context (Rule 5f row) ──
  const hsRow = rowFor(doc, "Business and Finance");
  check("5f: unified-title input pre-filled with the STRIPPED title",
    hsRow.querySelector(".cr-ni-title-input").value === "Business and Finance");
  check("5f: issuer input pre-filled with the school",
    hsRow.querySelector(".cr-ni-input").value === "Summit High School");
  check("5f: trainer chip announces the same-school default",
    /trainer ⇒ Summit High School/.test(txt(hsRow.querySelector(".cr-ni-trainer-chip"))));
  check("5f: raw college-entered title rendered on the row",
    /SUMMIT HIGH SCHOOL- Business and Finance/.test(txt(hsRow.querySelector(".cr-ni-rawline"))));
  check("5f: originating-college chip rendered (auditor-stamped)",
    /Chaffey/.test(txt(hsRow.querySelector(".cr-wl-college"))));

  hsRow.querySelector(".cr-ni-save").click();
  await sleep(120);
  const hsBodies = log.writes.map((x) => x.body);
  check("5f save: writes the unified_title_override (display rename lane)",
    hsBodies.some((b) => b.course_id === "_CREDENTIAL_REVIEW::Business and Finance (High School Articulation)"
      && b.field === "unified_title_override" && b.value === "Business and Finance"));
  check("5f save: writes the issuing_agency_override = the school (Mode A2 lane)",
    hsBodies.some((b) => b.field === "issuing_agency_override" && b.value === "Summit High School"));
  check("5f save: writes the training_agency_override = the school (Mode A3 lane)",
    hsBodies.some((b) => b.field === "training_agency_override" && b.value === "Summit High School"));
  check("5f save: exactly the three overrides written", hsBodies.length === 3);
  check("5f save: row flips ✓ in place", hsRow.className.indexOf("cr-wl-done") >= 0);

  // ── Session 106: the resurface row never rewrites its real issuer ──
  const pltwRow = rowFor(doc, "PLTW Civil Engineering");
  check("resurface: row appears although its issuer is set",
    !!pltwRow);
  check("resurface: issuer input keeps the CURRENT issuer (null staged issuer)",
    pltwRow.querySelector(".cr-ni-input").value === "Project Lead The Way (PLTW)");
  log.writes.length = 0;
  pltwRow.querySelector(".cr-ni-save").click();
  await sleep(120);
  const pltwBodies = log.writes.map((x) => x.body);
  check("resurface save: title + trainer overrides written",
    pltwBodies.some((b) => b.field === "unified_title_override"
      && b.value === "PLTW Civil Engineering and Architecture")
    && pltwBodies.some((b) => b.field === "training_agency_override"
      && b.value === "Baldy View Regional Occupational Program"));
  check("resurface save: the REAL issuer is never rewritten",
    !pltwBodies.some((b) => b.field === "issuing_agency_override"));

  // ── per-row save: type a NEW agency into the 10-Key row ──
  const tenKey = rowFor(doc, "10-Key Data Entry");
  check("no-preseed row: empty issuer box flips the Save label to “no issuer”",
    /no issuer/.test(txt(tenKey.querySelector(".cr-ni-save"))));
  const inp = tenKey.querySelector(".cr-ni-input");
  log.writes.length = 0;
  inp.value = "Proctored Testing Center";
  inp.dispatchEvent(new window.Event("input", { bubbles: true }));
  tenKey.querySelector(".cr-ni-save").click();
  await sleep(120);
  const w = log.writes[0] && log.writes[0].body;
  check("save: POSTs the standard issuing_agency_override (Mode A2 lane)",
    w && w.course_id === "_CREDENTIAL_REVIEW::10-Key Data Entry"
      && w.field === "issuing_agency_override"
      && w.value === "Proctored Testing Center");
  check("save: an unchanged title never writes a title override",
    !log.writes.some((x) => x.body.field === "unified_title_override"));
  check("save: lane count decrements in place",
    /Missing issuing agency \(1\)/.test(txt(doc.querySelector(".cr-ni-title"))));
  check("save: toolbar no-issuer count follows",
    /· 1 no-issuer/.test(txt(doc.querySelector(".cr-triage-btn"))));
  const dl = doc.getElementById("cr-unclass-issuers");
  check("datalist: the NEW agency is immediately pickable",
    !!dl && Array.from(dl.children).some((o) => o.value === "Proctored Testing Center"));

  // ── the "＋ add issuing agency" affordance (Rule 4 multi-issuer, 2026-07-08):
  // a second agency saves to its OWN override field so it never clobbers the
  // primary; Mode A2 promotes it additively. ──
  const addLink = tenKey.querySelector(".cr-ni-add-issuer");
  const inp2 = tenKey.querySelector(".cr-ni-input2");
  check("multi-issuer: ＋ link renders; second input hidden until clicked",
    !!addLink && !!inp2 && inp2.parentElement.style.display === "none");
  addLink.click();
  check("multi-issuer: click reveals the second input and hides the link",
    inp2.parentElement.style.display === "" && addLink.style.display === "none");
  log.writes.length = 0;
  inp2.value = "Federal Aviation Administration (FAA)";
  inp2.dispatchEvent(new window.Event("input", { bubbles: true }));
  tenKey.querySelector(".cr-ni-save").click();
  await sleep(120);
  check("multi-issuer: saves issuing_agency_additional_override (never the primary field)",
    log.writes.some((x) => x.body.field === "issuing_agency_additional_override"
      && x.body.value === "Federal Aviation Administration (FAA)")
    && !log.writes.some((x) => x.body.field === "issuing_agency_override"
      && x.body.value === "Federal Aviation Administration (FAA)"));

  // ── save → re-edit → re-save (the unresponsive-firearms trap, 2026-07-08):
  // applySavedLane disables the button "✓ Saved" while the inputs stay live;
  // a keystroke used to relabel the still-DISABLED button "Save" — dead. ──
  const tkBtn = tenKey.querySelector(".cr-ni-save");
  check("re-edit trap: saved row's button starts disabled ✓",
    tkBtn.disabled && /Saved/.test(txt(tkBtn)));
  log.writes.length = 0;
  inp.value = "American Welding Society (AWS)";
  inp.dispatchEvent(new window.Event("input", { bubbles: true }));
  check("re-edit trap: editing a saved row RE-ARMS its Save button",
    !tkBtn.disabled && txt(tkBtn) === "Save");
  check("re-edit trap: the row leaves the done state",
    tenKey.className.indexOf("cr-wl-done") < 0);
  tkBtn.click();
  await sleep(120);
  check("re-edit trap: the re-save writes the corrected issuer",
    log.writes.some((x) => x.body.field === "issuing_agency_override"
      && x.body.value === "American Welding Society (AWS)"));
  check("re-edit trap: row flips back to ✓ Saved",
    tkBtn.disabled && /Saved/.test(txt(tkBtn)));

  // ── bulk save: the remaining ⚡ cx row saves its issuer ──
  const bulkBtns = Array.from(doc.querySelectorAll(".cr-wl-saveall"));
  const niBulk = bulkBtns[bulkBtns.length - 1];
  log.writes.length = 0;
  niBulk.click();
  await sleep(200);
  const bodies = log.writes.map((x) => x.body);
  check("bulk: filled row saved",
    bodies.some((b) => b.course_id === "_CREDENTIAL_REVIEW::Basic Welding CBE"
      && b.field === "issuing_agency_override"
      && b.value === "California Community Colleges"));
  check("bulk: exactly the one remaining row written", bodies.length === 1);
  check("bulk: lane empties",
    /Missing issuing agency \(0\)/.test(txt(doc.querySelector(".cr-ni-title"))));

  // ── B. the "＋ set" direct-to-edit path on the main table ──
  const b = makeDom({});
  await sleep(120);
  const bdoc = b.window.document;
  const setBtn = bdoc.querySelector(".cr-issuer-set");
  check("＋set: affordance renders on a null-issuer cell", !!setBtn);
  setBtn.click();
  await sleep(80);
  const panel = bdoc.querySelector(".cr-curation-panel");
  check("＋set: opens the Curate panel", !!panel);
  const editInput = panel && panel.querySelector(".cr-curation-input");
  check("＋set: lands DIRECTLY in the issuer edit input (no second click needed)",
    !!editInput && editInput.tagName === "INPUT");
  if (editInput) {
    editInput.value = "Proctored Testing Center";
    panel.querySelector(".cr-curation-save").click();
    await sleep(120);
    const bw = b.log.writes[0] && b.log.writes[0].body;
    check("＋set: Save POSTs the issuer override",
      bw && bw.field === "issuing_agency_override"
        && bw.value === "Proctored Testing Center");
  }

  // ── C. the curation-panel style neutralizer is injected (black-box fix) ──
  const css = bdoc.getElementById("cr-scope-css");
  check("style: curation-label th bleed neutralized (no more black boxes)",
    !!css && css.textContent.indexOf(".cr-curation-tbl th{position:static;background:transparent") >= 0);
  check("style: worklist headers ride the seal blue, not ink",
    css.textContent.indexOf(".cr-wl-table th{text-align:left;background:var(--seal-blue)") >= 0);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
