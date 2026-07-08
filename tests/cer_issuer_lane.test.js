// Session 105 (2026-07-08) — the missing-issuer triage lane + the "＋ set"
// direct-to-edit fix + the live issuer datalist.
//
// Sam's asks: (a) "exhibits that don't have an issuing agency [should] pop on
// the Triage list" — classified credentials with a null issuer now get their
// own worklist section, saving the standard issuing_agency_override (the Mode
// A2 promotion lane); (b) the 10-Key "＋ set" click now jumps STRAIGHT into
// the Curate panel's issuer edit input (it previously just opened the panel,
// so a second click did nothing — "the + doesn't work"); (c) a newly typed
// agency becomes pickable in the datalists immediately after a save.
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
  // null issuer WITH a staged issuer preseed
  { ut: "Basic Welding CBE", raw_count: 1, conf_title: 0.7, issuer: null,
    cpl_types: ["Credit By Exam"], audit_tags: {}, audit_tag_total: 0, articulations: [] },
  // null issuer WITH a staged "" (no-formal-issuer) preseed
  { ut: "AB Miller High School Pathway", raw_count: 1, conf_title: 0.7, issuer: null,
    audit_tags: {}, audit_tag_total: 0, articulations: [] },
  // already has an issuer — must NOT appear in the lane
  { ut: "ServSafe Manager", raw_count: 3, conf_title: 0.9,
    issuer: "National Restaurant Association",
    audit_tags: {}, audit_tag_total: 0, articulations: [] },
] };

const issuerPreseedStub = { staged: {
  "Basic Welding CBE": { issuer: "California Community Colleges", via: "cx",
    confidence: 0.7, note: "cx-typed — issuer = CCC." },
  "AB Miller High School Pathway": { issuer: "", via: "local-hs",
    confidence: 0.6, note: "Local HS pathway — no formal issuing body." },
} };

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
    if (url.indexOf("exhibit_audit/latest.json") >= 0) return respond({ title_cards: [] });
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

(async () => {
  // ── A. the lane inside the triage worklist ──
  const { window, log } = makeDom({});
  const doc = window.document;
  await sleep(120);

  check("toolbar: triage button carries the no-issuer count",
    /· 3 no-issuer/.test(txt(doc.querySelector(".cr-triage-btn"))));

  doc.querySelector(".cr-triage-btn").click();
  await sleep(120);

  const laneTitle = doc.querySelector(".cr-ni-title");
  check("lane: renders even though the unclassified queue is clear",
    !!laneTitle && /Missing issuing agency \(3\)/.test(txt(laneTitle)));
  const rows = Array.from(doc.querySelectorAll(".cr-ni-row"));
  check("lane: exactly the null-issuer credentials listed", rows.length === 3);
  check("lane: issuered credential excluded",
    !rows.some((r) => txt(r).indexOf("ServSafe") >= 0));
  check("lane: staged pre-seeds sort first",
    txt(rows[0].querySelector(".cr-wl-rawt")) !== "10-Key Data Entry");

  const psRow = rows.find((r) => txt(r.querySelector(".cr-wl-rawt")) === "Basic Welding CBE");
  check("lane: issuer input pre-filled from the staged plan",
    psRow.querySelector(".cr-ni-input").value === "California Community Colleges");
  check("lane: ⚡ badge names the lane",
    /pre-seed · cx/.test(txt(psRow.querySelector(".cr-wl-preseed-badge"))));

  const hsRow = rows.find((r) => txt(r.querySelector(".cr-wl-rawt")).indexOf("AB Miller") >= 0);
  check("lane: \"\" pre-seed badge reads no-formal-issuer",
    /no formal issuer/.test(txt(hsRow.querySelector(".cr-wl-preseed-badge"))));
  check("lane: empty input flips the Save label to “no issuer”",
    /no issuer/.test(txt(hsRow.querySelector(".cr-ni-save"))));
  check("lane: nothing auto-saved", log.writes.length === 0);

  // per-row save: type a NEW agency into the 10-Key row
  const tenKey = rows.find((r) => txt(r.querySelector(".cr-wl-rawt")) === "10-Key Data Entry");
  const inp = tenKey.querySelector(".cr-ni-input");
  inp.value = "Proctored Testing Center";
  inp.dispatchEvent(new window.Event("input", { bubbles: true }));
  tenKey.querySelector(".cr-ni-save").click();
  await sleep(120);
  const w = log.writes[0] && log.writes[0].body;
  check("save: POSTs the standard issuing_agency_override (Mode A2 lane)",
    w && w.course_id === "_CREDENTIAL_REVIEW::10-Key Data Entry"
      && w.field === "issuing_agency_override"
      && w.value === "Proctored Testing Center");
  check("save: row flips ✓ in place",
    tenKey.className.indexOf("cr-wl-done") >= 0);
  check("save: lane count decrements in place",
    /Missing issuing agency \(2\)/.test(txt(doc.querySelector(".cr-ni-title"))));
  check("save: toolbar no-issuer count follows",
    /· 2 no-issuer/.test(txt(doc.querySelector(".cr-triage-btn"))));
  const dl = doc.getElementById("cr-unclass-issuers");
  check("datalist: the NEW agency is immediately pickable",
    !!dl && Array.from(dl.children).some((o) => o.value === "Proctored Testing Center"));

  // bulk save: the ⚡-filled row + the ""-staged row save; count both kinds
  doc.querySelector(".cr-ni-title").parentNode
    .querySelectorAll(".cr-wl-saveall").forEach(() => {});
  const bulkBtns = Array.from(doc.querySelectorAll(".cr-wl-saveall"));
  const niBulk = bulkBtns[bulkBtns.length - 1];
  log.writes.length = 0;
  niBulk.click();
  await sleep(200);
  const bodies = log.writes.map((x) => x.body);
  check("bulk: filled row saved",
    bodies.some((b) => b.course_id === "_CREDENTIAL_REVIEW::Basic Welding CBE"
      && b.value === "California Community Colleges"));
  check("bulk: \"\"-staged row saved as the explicit no-issuer verdict",
    bodies.some((b) => b.course_id === "_CREDENTIAL_REVIEW::AB Miller High School Pathway"
      && b.value === ""));
  check("bulk: exactly the two remaining rows written", bodies.length === 2);
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
