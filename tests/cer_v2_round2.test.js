// CER v2 round 2 (2026-07-09 — Sam's three asks after the v2 shakedown):
//   1. the tab's background is CREAM (#FEF9DA), scoped to the CER pane
//   2. Discipline + SUBJ edit in-cell at the top layer → NEW overlay-only
//      kb_curation fields discipline_override / subj_override (deliberately
//      NOT in the apply lanes yet), reflected live + in the extracts
//   3. a ⇆ merge-suggestion chip on look-alike titles (normalized-signature
//      collision) whose panel merges via the STANDARD PR-5b/2 flow
//      (unified_title_override = the target's KB key + merge_confirm)
//
// Run from repo root: `npm test` (or `node tests/cer_v2_round2.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const payload = { _generated_at: "t", top_categories: {}, unified_titles: [
  // A look-alike pair: "ASE Brakes (A5)" vs "ASE Brakes Certification"
  // normalize to the same signature ("ase brakes").
  { ut: "ASE Brakes (A5)", raw_count: 2, conf_title: 0.79, issuer: "ASE",
    disc_modal: "Automotive Technology",
    students_served: 64, cpl_types: ["Industry Certification"],
    audit_tags: {}, audit_tag_total: 0,
    raw_variants: [{ r: "ASE A5 Brakes Cert", c: 0.79 }],
    articulations: [{ cid: "AUTO M1150", sys: "M-ID", t: "Brakes",
      disc: "Automotive Technology", local: [] }] },
  { ut: "ASE Brakes Certification", raw_count: 3, conf_title: 0.9, issuer: "ASE",
    students_served: 120, cpl_types: ["Industry Certification"],
    audit_tags: {}, audit_tag_total: 0,
    raw_variants: [{ r: "Automotive Service Excellence - Brakes", c: 0.9 }],
    articulations: [{ cid: "AUTO M1150", sys: "M-ID", t: "Brakes",
      disc: "Automotive Technology", local: [] }] },
  // Issuer-conflict look-alikes: same signature, different certifying body.
  { ut: "First Aid (AHA)", raw_count: 1, conf_title: 0.8,
    issuer: "American Heart Association", students_served: 30,
    cpl_types: ["Industry Certification"], audit_tags: {}, audit_tag_total: 0,
    raw_variants: [{ r: "AHA First Aid", c: 0.8 }], articulations: [] },
  { ut: "First Aid Certificate", raw_count: 1, conf_title: 0.8,
    issuer: "American Red Cross", students_served: 40,
    cpl_types: ["Industry Certification"], audit_tags: {}, audit_tag_total: 0,
    raw_variants: [{ r: "Red Cross First Aid", c: 0.8 }], articulations: [] },
  // A loner — must carry NO merge chip.
  { ut: "Cosmetology License", raw_count: 1, conf_title: 0.93,
    issuer: "CA Board of Barbering & Cosmetology", students_served: 342,
    cpl_types: ["State/Federal License"], audit_tags: {}, audit_tag_total: 0,
    raw_variants: [{ r: "CA Cosmetology License", c: 0.93 }],
    articulations: [{ cid: "COSM M1001", sys: "M-ID", t: "Cosmetology I",
      disc: "Cosmetology and Barbering", local: [] }] },
] };

// Overlay stub: a pre-existing discipline override on the loner (round-trip).
const overlayRows = [
  { course_id: "_CREDENTIAL_REVIEW::Cosmetology License", field: "discipline_override",
    value: "Cosmetology", reviewer_email: "map@rccd.edu", reviewed_at: "2026-07-09T00:00:00Z" },
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
  const log = { writes: [], confirms: [], blobs: [] };
  window.confirm = function (msg) { log.confirms.push(msg); return true; };
  window.URL.createObjectURL = function (blob) { log.blobs.push(blob); return "blob:stub"; };
  window.URL.revokeObjectURL = function () {};
  window.fetch = function (url, o) {
    url = String(url); const method = (o && o.method) || "GET";
    const respond = (body, status) => Promise.resolve({
      ok: !status || status < 400, status: status || 200,
      json: () => Promise.resolve(body),
    });
    if (url.indexOf("kb_curation") >= 0 && method === "GET") {
      // first page carries the stub rows; the pagination loop stops on a
      // short page
      return respond(overlayRows);
    }
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
const rowByTitle = (doc, needle) => Array.from(doc.querySelectorAll("tr.cr-row"))
  .find((tr) => {
    const inp = tr.querySelector(".cr-title-in");
    return inp ? inp.value.indexOf(needle) >= 0 : txt(tr).indexOf(needle) >= 0;
  });

(async () => {
  const { window, log } = makeDom({});
  const doc = window.document;
  await sleep(150);

  // ── 1. cream background ──
  const css = doc.getElementById("cr-scope-css").textContent;
  check("cream: scoped --cer-cream token defined as #FEF9DA",
    css.indexOf("--cer-cream:#FEF9DA") >= 0);
  check("cream: the CER pane background rides the token",
    css.indexOf("#tab-credential-reference{--cer-cream:#FEF9DA;background:var(--cer-cream);}") >= 0);
  check("cream: the table wrap stays opaque white (data never on cream)",
    css.indexOf(".cr-table-wrap{background:var(--surface-opaque") >= 0);

  // ── 2. in-cell Discipline + SUBJ ──
  const ase = rowByTitle(doc, "ASE Brakes (A5)");
  const subjInp = ase.querySelector(".cr-subj-in");
  const discInp = ase.querySelector(".cr-disc-in");
  check("subj: renders as an in-cell input (signed in)", !!subjInp && subjInp.value === "AUTO");
  check("disc: renders as an in-cell input (signed in)",
    !!discInp && discInp.value === "Automotive Technology");
  check("disc: datalist of known disciplines attached",
    discInp.getAttribute("list") === "cr-disc-datalist"
    && !!doc.getElementById("cr-disc-datalist"));

  subjInp.value = "ase";  // lowercase — must save uppercased
  subjInp.dispatchEvent(new window.Event("input"));
  discInp.value = "Auto Mechanics";
  discInp.dispatchEvent(new window.Event("input"));
  await sleep(20);
  check("edit: row goes dirty", ase.classList.contains("cr-dirty"));
  ase.querySelector(".cr-grid-save").click();
  await sleep(150);
  const bodies = log.writes.map((w) => w.body).filter(Boolean);
  check("save: subj_override written UPPERCASED",
    bodies.some((b) => b.field === "subj_override" && b.value === "ASE"
      && b.course_id === "_CREDENTIAL_REVIEW::ASE Brakes (A5)"));
  check("save: discipline_override written",
    bodies.some((b) => b.field === "discipline_override" && b.value === "Auto Mechanics"));

  // overlay round-trip: the loner arrived with a discipline_override.
  const cosmo = rowByTitle(doc, "Cosmetology License");
  check("overlay: pre-existing discipline_override applied to the cell",
    cosmo.querySelector(".cr-disc-in").value === "Cosmetology");
  check("overlay: ✎ marker shows the curated discipline",
    !!cosmo.querySelector(".cr-disc-cell .cr-override-marker"));

  // extracts reflect the overrides (live layer).
  const exportBtns = Array.from(doc.querySelectorAll(".cr-export-btn"));
  exportBtns[1].click();  // ⬇ JSON
  await sleep(30);
  const parsed = JSON.parse(await log.blobs[log.blobs.length - 1].text());
  const aseRec = parsed.credentials.find((c) => c.kb_key === "ASE Brakes (A5)");
  const cosmoRec = parsed.credentials.find((c) => c.kb_key === "Cosmetology License");
  check("extract: JSON carries the curated SUBJ", aseRec.subj === "ASE");
  check("extract: JSON carries the curated discipline (both rows)",
    aseRec.discipline === "Auto Mechanics" && cosmoRec.discipline === "Cosmetology");

  // ── 3. the ⇆ merge-suggestion chip + panel ──
  const ase2 = rowByTitle(doc, "ASE Brakes Certification");
  check("chip: both ASE look-alikes carry ⇆ 1 similar",
    /⇆ 1 similar/.test(txt(ase2.querySelector(".cr-chip-mergesug")))
    && !!rowByTitle(doc, "ASE Brakes (A5)").querySelector(".cr-chip-mergesug"));
  check("chip: the loner carries NO merge chip",
    !cosmo.querySelector(".cr-chip-mergesug"));

  ase2.querySelector(".cr-chip-mergesug").click();
  await sleep(30);
  const ase2b = rowByTitle(doc, "ASE Brakes Certification");
  const panel = ase2b.querySelector(".cr-mergesug-panel");
  check("panel: opens from the chip", !!panel);
  check("panel: names the look-alike + its stats",
    txt(panel).indexOf("ASE Brakes (A5)") >= 0 && /2 variants/.test(txt(panel)));
  check("panel: same-issuer pair carries NO issuer warning",
    !panel.querySelector(".cr-mergesug-warn"));

  const before = log.writes.length;
  panel.querySelector(".cr-mergesug-btn").click();
  await sleep(150);
  check("merge: the standard confirm-merge dialog fired",
    log.confirms.some((m) => m.indexOf("CONFIRMS A MERGE") >= 0));
  const bodies2 = log.writes.slice(before).map((w) => w.body).filter(Boolean);
  check("merge: unified_title_override written = the TARGET's KB key",
    bodies2.some((b) => b.field === "unified_title_override"
      && b.value === "ASE Brakes (A5)"
      && b.course_id === "_CREDENTIAL_REVIEW::ASE Brakes Certification"));
  check("merge: unified_title_merge_confirm written naming the same target",
    bodies2.some((b) => b.field === "unified_title_merge_confirm"
      && b.value === "ASE Brakes (A5)"));

  // issuer-conflict pair: chip present, warning shown.
  const aha = rowByTitle(doc, "First Aid (AHA)");
  aha.querySelector(".cr-chip-mergesug").click();
  await sleep(30);
  const ahaPanel = rowByTitle(doc, "First Aid (AHA)").querySelector(".cr-mergesug-panel");
  check("panel: issuer-conflict pair carries the ⚠ different-issuer warning",
    !!ahaPanel.querySelector(".cr-mergesug-warn"));

  // ── signed out: no inputs, no merge actions, chip still informative ──
  const anon = makeDom({ signedIn: false });
  await sleep(150);
  const adoc = anon.window.document;
  check("anon: no subj/disc inputs", !adoc.querySelector(".cr-subj-in") && !adoc.querySelector(".cr-disc-in"));
  const anonAse = rowByTitle(adoc, "ASE Brakes Certification");
  check("anon: ⇆ chip still renders (informative)", !!anonAse.querySelector(".cr-chip-mergesug"));
  anonAse.querySelector(".cr-chip-mergesug").click();
  await sleep(30);
  const anonPanel = rowByTitle(adoc, "ASE Brakes Certification").querySelector(".cr-mergesug-panel");
  check("anon: panel opens but carries NO merge buttons",
    !!anonPanel && !anonPanel.querySelector(".cr-mergesug-btn"));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
