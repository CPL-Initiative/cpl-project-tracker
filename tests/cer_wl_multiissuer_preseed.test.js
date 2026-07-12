// Session 112 (2026-07-11) — Sam's two CER Unclassified-triage asks:
//   (1) MULTI-ISSUER: "I need to be able to add multiple issuing agencies and
//       can only add one." The No-issuer lane's "＋ add issuing agency" reveal
//       is ported onto the triage row; extras join into ONE " | "-delimited
//       value saved as issuing_agency_assignment2 (the primary field is never
//       touched), and _apply_unclassified_triage.py splits them back out.
//   (2) C-ID/CCN TITLE PRE-SEED: "many had reliable recommended C-ID titles and
//       would have expected those to pre-seed." A bare row now prefills the
//       title from the top AUTHORITATIVE suggestion — an official CCN, else a
//       VERIFIED C-ID. Fuzzy COS/modal matches and UNVERIFIED C-IDs stay
//       click-only (they need a human pick). Prefill only; Save stays a click.
//
// Run from repo root: `npm test` (or `node tests/cer_wl_multiissuer_preseed.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const auditStub = { title_cards: [
  { raw_title: "ADM JUS 003 - Legal Aspects of Evidence", unified_title: null, tags: ["unclassified_in_map"], band: "<0.40" },
  { raw_title: "MATH 100 - College Algebra Thing",        unified_title: null, tags: ["unclassified_in_map"], band: "<0.40" },
  { raw_title: "Some Unverified CID Row",                 unified_title: null, tags: ["unclassified_in_map"], band: "<0.40" },
  { raw_title: "CompTIA Cert Prep Thing",                 unified_title: null, tags: ["unclassified_in_map"], band: "<0.40" },
  { raw_title: "Bare Row No Suggestion",                  unified_title: null, tags: ["unclassified_in_map"], band: "<0.40" },
  { raw_title: "Already Saved Multi Issuer",              unified_title: null, tags: ["unclassified_in_map"], band: "<0.40" },
] };

const suggStub = { suggestions: {
  // verified C-ID as the top (and only) authoritative match → should pre-seed
  "ADM JUS 003 - Legal Aspects of Evidence": [
    { kind: "cid", id: "AJ 124", title: "Legal Aspects of Evidence", code: "ADM JUS 003" },
    { kind: "course", title: "Legal Aspects of Evidence II", code: "ADM JUS 003", share: 0.8 },
  ],
  // a CCN outranks the C-ID → pre-seed should take the CCN title
  "MATH 100 - College Algebra Thing": [
    { kind: "ccn", id: "MATH C1000", title: "College Algebra", code: "MATH 100" },
    { kind: "cid", id: "MATH 150", title: "College Algebra (C-ID)", code: "MATH 100" },
  ],
  // ONLY an UNVERIFIED C-ID → must NOT pre-seed (needs verification)
  "Some Unverified CID Row": [
    { kind: "cid", id: "ZZ 999", title: "Unverified Descriptor", code: "ZZ 100", unverified: true },
  ],
  // ONLY a fuzzy COS match → must NOT pre-seed (human pick), stays click-only
  "CompTIA Cert Prep Thing": [
    { kind: "cos", id: "1234-A", title: "CompTIA A+", org: "CompTIA" },
  ],
} };

// One saved assignment already carrying extra agencies (overlay read-back path).
const overlayRows = [
  { course_id: "_UNCLASSIFIED::Already Saved Multi Issuer", field: "unified_title_assignment",   value: "Spanish Heritage", reviewer_email: "map@rccd.edu", reviewed_at: "2026-07-11T00:00:00Z" },
  { course_id: "_UNCLASSIFIED::Already Saved Multi Issuer", field: "issuing_agency_assignment",  value: "College Board (AP)", reviewer_email: "map@rccd.edu", reviewed_at: "2026-07-11T00:00:00Z" },
  { course_id: "_UNCLASSIFIED::Already Saved Multi Issuer", field: "issuing_agency_assignment2", value: "Defense Language Institute | Local Credit-by-Exam", reviewer_email: "map@rccd.edu", reviewed_at: "2026-07-11T00:00:00Z" },
];

function makeDom(opts) {
  opts = opts || {};
  const html = `<!DOCTYPE html><html><body>
  <div id="tab-credential-reference">
    <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
  </div></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  window.CPL_CREDENTIAL_REFERENCE = { _generated_at: "t", top_categories: {}, unified_titles: [] };
  const log = { writes: [] };
  window.confirm = function () { return true; };
  window.fetch = function (url, o) {
    url = String(url); const method = (o && o.method) || "GET";
    const respond = (body, status) => Promise.resolve({
      ok: !status || status < 400, status: status || 200,
      json: () => Promise.resolve(body),
    });
    if (url.indexOf("exhibit_audit/latest.json") >= 0) return respond(auditStub);
    if (url.indexOf("unclassified_suggestions.json") >= 0) return respond(suggStub);
    if (url.indexOf("issuer_preseed.json") >= 0) return respond({ staged: {} });
    if (url.indexOf("unclassified_preseed.json") >= 0) return respond({ staged: {} });
    if (url.indexOf("cos_matches.json") >= 0) return respond({}, 404);
    if (url.indexOf("kb_curation") >= 0 && method === "GET")
      return respond(url.indexOf("_UNCLASSIFIED") >= 0 ? overlayRows : []);
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
const rowFor = (doc, name) => Array.from(doc.querySelectorAll(".cr-wl-table tbody tr"))
  .find((r) => txt(r.querySelector(".cr-wl-rawt")).indexOf(name) >= 0);

(async () => {
  const { window, log } = makeDom({});
  const doc = window.document;
  await sleep(120);
  Array.from(doc.querySelectorAll(".cr-lane")).find((b) => /Unclassified/.test(b.textContent)).click();
  await sleep(120);

  // ── (2) C-ID / CCN title pre-seed ──────────────────────────────────────
  const cidRow = rowFor(doc, "ADM JUS 003");
  check("preseed: verified C-ID prefills the title input",
    cidRow.querySelector(".cr-wl-title-input").value === "Legal Aspects of Evidence");
  check("preseed: a hint announces the pre-fill source",
    /pre-filled from C-ID AJ 124/.test(txt(cidRow.querySelector(".cr-wl-preseed-hint"))));
  check("preseed: the seeding chip renders active",
    !!cidRow.querySelector(".cr-wl-sugg.cr-wl-sugg-active"));
  check("preseed: pre-fill never auto-saves (Save still armed)",
    txt(cidRow.querySelector(".cr-wl-save")) === "Save"
    && cidRow.className.indexOf("cr-wl-done") < 0);

  const ccnRow = rowFor(doc, "MATH 100");
  check("preseed: a CCN outranks the C-ID for the pre-fill",
    ccnRow.querySelector(".cr-wl-title-input").value === "College Algebra");
  check("preseed: hint names the CCN",
    /pre-filled from CCN MATH C1000/.test(txt(ccnRow.querySelector(".cr-wl-preseed-hint"))));

  const unv = rowFor(doc, "Some Unverified CID Row");
  check("preseed: an UNVERIFIED C-ID does NOT pre-fill",
    unv.querySelector(".cr-wl-title-input").value === "");
  check("preseed: unverified row still shows the click-only chip",
    unv.querySelectorAll(".cr-wl-sugg").length === 1
    && !unv.querySelector(".cr-wl-sugg-active"));

  const cos = rowFor(doc, "CompTIA Cert Prep Thing");
  check("preseed: a fuzzy COS match does NOT pre-fill (human pick)",
    cos.querySelector(".cr-wl-title-input").value === ""
    && !cos.querySelector(".cr-wl-preseed-hint"));

  const bare = rowFor(doc, "Bare Row No Suggestion");
  check("preseed: a bare row stays blank with no hint",
    bare.querySelector(".cr-wl-title-input").value === ""
    && !bare.querySelector(".cr-wl-preseed-hint"));
  check("nothing auto-saved during pre-seed render", log.writes.length === 0);

  // ── (1) multi-issuer add + save ────────────────────────────────────────
  const addLink = bare.querySelector(".cr-ni-add-issuer");
  check("multi-issuer: ＋ link renders; no extra input until clicked",
    !!addLink && bare.querySelectorAll(".cr-ni-input2").length === 0);
  addLink.click();
  const inp2 = bare.querySelector(".cr-ni-input2");
  check("multi-issuer: click adds an extra input; the ＋ link stays for more",
    !!inp2 && addLink.style.display !== "none");

  // Fill title (required) + primary issuer + one extra, then Save.
  const titleInp = bare.querySelector(".cr-wl-title-input");
  const issInp = bare.querySelector(".cr-wl-iss-input");
  titleInp.value = "Portfolio Assessment";
  titleInp.dispatchEvent(new window.Event("input", { bubbles: true }));
  issInp.value = "College Board (AP)";
  issInp.dispatchEvent(new window.Event("input", { bubbles: true }));
  inp2.value = "Defense Language Institute (DLPT)";
  inp2.dispatchEvent(new window.Event("input", { bubbles: true }));
  log.writes.length = 0;
  bare.querySelector(".cr-wl-save").click();
  await sleep(140);
  const bodies = log.writes.map((x) => x.body);
  check("multi-issuer save: writes the title assignment",
    bodies.some((b) => b.course_id === "_UNCLASSIFIED::Bare Row No Suggestion"
      && b.field === "unified_title_assignment" && b.value === "Portfolio Assessment"));
  check("multi-issuer save: writes the PRIMARY issuer assignment",
    bodies.some((b) => b.field === "issuing_agency_assignment" && b.value === "College Board (AP)"));
  check("multi-issuer save: writes the extras into issuing_agency_assignment2 (never the primary)",
    bodies.some((b) => b.field === "issuing_agency_assignment2"
      && b.value === "Defense Language Institute (DLPT)")
    && !bodies.some((b) => b.field === "issuing_agency_assignment"
      && b.value === "Defense Language Institute (DLPT)"));

  // A SECOND ＋ click stacks another agency; both join " | " on save.
  addLink.click();
  const extras = bare.querySelectorAll(".cr-ni-input2");
  check("multi-issuer: second ＋ click stacks another input", extras.length === 2);
  extras[1].value = "Local Credit-by-Exam";
  extras[1].dispatchEvent(new window.Event("input", { bubbles: true }));
  log.writes.length = 0;
  bare.querySelector(".cr-wl-save").click();
  await sleep(140);
  check("multi-issuer: both extras save as one pipe-joined value",
    log.writes.some((x) => x.body.field === "issuing_agency_assignment2"
      && x.body.value === "Defense Language Institute (DLPT) | Local Credit-by-Exam"));

  // ── overlay read-back: a saved assignment hydrates its extra inputs ──────
  // The already-saved row is "done", so switch to the "All" view to see it.
  Array.from(doc.querySelectorAll(".cr-wl-toggle-btn")).find((b) => /^All /.test(txt(b))).click();
  await sleep(60);
  const saved = rowFor(doc, "Already Saved Multi Issuer");
  check("overlay: saved primary issuer hydrates the input",
    saved.querySelector(".cr-wl-iss-input").value === "College Board (AP)");
  const savedExtras = Array.from(saved.querySelectorAll(".cr-ni-input2")).map((x) => x.value);
  check("overlay: saved additional agencies split back into the extra inputs",
    savedExtras.length === 2
    && savedExtras[0] === "Defense Language Institute"
    && savedExtras[1] === "Local Credit-by-Exam");

  // ── signed out: the ＋ affordance is withheld ────────────────────────────
  const so = makeDom({ signedIn: false });
  await sleep(120);
  Array.from(so.window.document.querySelectorAll(".cr-lane")).find((b) => /Unclassified/.test(b.textContent)).click();
  await sleep(120);
  const soRow = rowFor(so.window.document, "Bare Row No Suggestion");
  check("signed-out: no ＋ add-issuer link on the triage row",
    soRow && !soRow.querySelector(".cr-ni-add-issuer"));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
