// The three browser readers of a fold's issuer resolution (#3116 redesign): exhibits.js (the editor), map_export.js (the
// MAP export) and credential_reference.js (the Catalog) resolve a title's issuer rows through issuer_resolution.js.
// Guarded: the editor shows the fold's winner with one plain line, "Set by the fold on <date>", and the person's
// older row as superseded; saving there writes a normal person row with its own stamp, which wins at once; a row saved
// one second after decided_at wins on load; the export and the Catalog take the resolved issuer, a dropped issuer
// struck. The fixtures are the side panel test's (tests/exhibits_side_panel.test.js).
// Run from repo root: `node tests/issuer_resolution_readers.test.js` (or `npm test`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) {
  if (!el) return "";
  const parts = [], walk = el.ownerDocument.createTreeWalker(el, 4);
  while (walk.nextNode()) parts.push(walk.currentNode.nodeValue);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}
const src = fs.readFileSync("exhibits.js", "utf8");

const H = 36e5;
function ago(h) { return new Date(Date.now() - h * H).toISOString().replace(/\.\d+Z$/, "Z"); }
const PAIR_WORDS = "titles carry a review stamp (1,088 a person's, 1,314 a cohort's); 2,673 credentials, 2,188 of 2,961 records stamped";
function exhibitRow(over) {
  return Object.assign({
    key: "exhibit", title: "Common Exhibit Reference", tab: "#exhibits", links: [{ href: "#exhibits", text: "Open Exhibits" }],
    status_file: "kb/status/exhibit.json",
    pair: [{ n: 2402, of: 5492, words: PAIR_WORDS, open: "#exhibits/credentials" }],
    tests: ["curator-stamped", "procedure-settled"],
    issues: [
      { n: 351, words: "titles held for a person", owner: "a curator (the classifier is unsure 274, a merge would join two issuers 42)", open: "#exhibits/held", error: null },
      { n: 18, words: "saved assignments the fold holds", owner: "a curator (a human-reviewed classification stands)", open: "#exhibits/conflict", error: null },
      { n: 621, words: "titles in the reference that have left MAP", owner: "a curator (retire or keep)", open: "#credential-reference/all", error: null }
    ],
    procedures: [
      { n: 16, words: "in force: 8 rules applied by code, 8 read by the classifier", open: "#credential-reference/procs", error: null },
      { words: "A procedure's saves undo together" }
    ],
    machine: { what: "the saving run and the fold", at: ago(3), every_hours: 24 }
  }, over || {});
}
function status(row) {
  return { schema: 1, written_at: ago(2), rows: [{ key: "subjects", title: "Common Subjects Reference", pair: [], issues: [], procedures: [] }, row] };
}
const ANSWERED = [
  { title: "Merge EACR into the CER as one Exhibits tab", text: "Answered on Open Asks Sheet 147 card 1.", link: "https://claude.ai/artifact/XVNFzgxMW4mAiCC9YUsABB",
    answer: { by: "Sam", at: "2026-10-31", words: "merge" } },
  { title: "Which names CLEP exams take", text: "Answered fold.", link: "https://claude.ai/artifact/3MJJ8ftqz7BABwnQAsjfFL",
    answer: { by: "Sam", at: "2026-11-01", words: "fold" } }
];
const OPEN_CALL = { title: "Name the public adoption page", text: "Waiting on Sam.", link: "https://claude.ai/artifact/OpenSheetLink00000000" };
function runlog(over) {
  return Object.assign({ schema: 1, session: 541, moniker: "SkyBlatusoff", decider: "Sam", calls: ANSWERED.slice(),
    written_at: ago(1), next_step: { title: "The cert link's next families", text: "Add AP, CLEP and IB." } }, over || {});
}
const REVIEW = { schema: 1, written_at: ago(5), sources: { procedures_run: ago(5) },
  tiles: { names: { n: 10, of: 12, waiting: 2 }, aligned: { n: 1, of: 2 }, saved_not_folded: 0 },
  colleges: ["Norco College"],
  held: [{ raw: "Welding 1 for", step: "Wording check", why: "a dangling word", colleges: [0], title: "Welding 1", issuer: "", from: "the classifier",
    ids: ["MAPCXI-WELD-1-001"], art: [0], could: [], basis: "", same: false },
  { raw: "ADJU 232", step: "Conflict with the reference", why: "the fold held the saved assignment", colleges: [], title: "Juvenile Law", issuer: "",
    from: "the reference", saved: "Juvenile Justice", ids: ["MAPCXS-A2-J-1-001"], art: [0], could: [], basis: "", same: false, exists: true }] };
const CREDREF = { _generated_at: ago(6), unified_titles: [
  { ut: "CompTIA Security+", issuer: "CompTIA", trainer: null, students_served: 57, served_suppressed: false, raw_variants: [{ r: "Sec Plus" }],
    articulations: [], potential_colleges: [], cpl_types: [], gen_rec: "3 units", ccc_rec: "", disc_modal: "", raw_count: 1 },
  { ut: "Emergency Medical Technician", issuer: "National Registry of Emergency Medical Technicians", trainer: "Fontana High School", students_served: null,
    served_suppressed: true, raw_variants: [{ r: "EMT Card" }], articulations: [], potential_colleges: [], cpl_types: ["Industry Certification"],
    gen_rec: "", ccc_rec: "", disc_modal: "Emergency Medical Technologies", raw_count: 3 }] };
const ADOPT = { schema: 1, written_at: ago(6), colleges: ["Bakersfield College", "Los Angeles Mission College", "College of San Mateo"],
  cip_sectors: { "51": "Health Professions and Related Programs" },
  credentials: { "Emergency Medical Technician": {
    a: { "0": [9, [["EMTC B50", "9 hours in Emergency Medical Technician"]]], "1": [3, [["LACCD GE 7", "3 hours in Lifelong Learning"]]] },
    c: { "2": [["FIRE 717", "", 3]] },
    x: [["MAPICI-SOCE-1-001", "State or County EMT Certification", 9], ["MAPCXH-REMT-1-001", "RCOE Emergency Medical Technician (HS: RCOE)", 6],
        ["MAPICI-EMT(3-1-001", "Emergency Medical Technician (EMT) Certification", 3]],
    s: "51", p: 6 } } };

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/" + (opts.hash || "#exhibits/credentials"), runScripts: "dangerously" });
  const w = dom.window;
  const calls = [];
  const files = Object.assign({
    "kb/status/commons.json": status(exhibitRow()),
    "kb/status/exhibit.json": runlog(),
    "kb/exhibits_review.json": REVIEW,
    "kb/exhibits_adoption.json": ADOPT
  }, opts.files || {});
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null });
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    function bad(st) { return Promise.resolve({ ok: false, status: st, json: function () { return Promise.resolve({}); } }); }
    if (Object.prototype.hasOwnProperty.call(files, url)) return files[url] === 404 ? bad(404) : ok(files[url]);
    if (/\/rest\/v1\/kb_curation/.test(url)) return ok((init.method || "GET") === "GET" ? (opts.curation || []) : []);
    return bad(404);
  };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(opts.signedIn ? { access_token: "t", email: "reviewer@example.org" } : null); },
    authHeaders: function () { return { apikey: "anon" }; } };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "credential_reference_data.js") w[name] = JSON.parse(JSON.stringify(CREDREF));
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = fs.readFileSync("commons_list.js", "utf8"); w.document.body.appendChild(e); }
    setTimeout(cb, 0);
  } };
  const r0 = w.document.createElement("script"); r0.textContent = fs.readFileSync("issuer_resolution.js", "utf8"); w.document.body.appendChild(r0);
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, root: w.document.getElementById("exhibits-root"), calls: calls };
}
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
async function settle() { for (let i = 0; i < 8; i++) await tick(); }
async function boot(opts) { const t = load(opts); await t.M.boot(); await settle(); return t; }
function tiles(d, label) { return Array.from(d.querySelectorAll(".exh-tile")).filter(function (x) { return txt(x.querySelector(".exh-tl")) === label; }); }
function tile(d, label) { return tiles(d, label)[0]; }
function titleBtn(d, t) { return Array.from(d.querySelectorAll("td.exh-l-title .exh-l-open, td[class$='title'] button")).find((b) => /^[^,]+/.exec(b.getAttribute("aria-label") || "") && txt(b) === t); }
function panel(d) { return d.getElementById("exh-l-panel"); }

const P = "_CREDENTIAL_REVIEW::";
const DEC = "2026-11-11T16:00:00Z";
const RES = JSON.stringify({ rule: "reviewer", winner: "NREMT", dropped: ["National Registry of Emergency Medical Technicians"],
  kept_additional: [], decided_at: DEC, fold_id: "2026-11-11@2026-11-11T16:05:00Z" });
const ROWS = [
  { course_id: P + "Emergency Medical Technician", field: "issuing_agency_override", value: "State EMS Authority", reviewed_at: "2026-07-09T00:07:08Z" },
  { course_id: P + "Emergency Medical Technician", field: "issuer_resolution", value: RES, reviewed_at: "2026-11-11T16:06:00Z" }
];

(async function () {
  // ── exhibits.js: the editor shows the fold's winner with one plain line, the older row superseded ──
  let t = await boot({ hash: "#exhibits/list", signedIn: true, curation: ROWS });
  titleBtn(t.d, "Emergency Medical Technician").click(); await settle();
  const ed = () => panel(t.d).querySelector("details.exh-l-pn-edit");
  ed().open = true; await settle();
  const $ = (id) => t.d.getElementById(id);
  check("exhibits: the editor holds the fold's winner, not the stored older row", $("exh-pn-issuer").value === "NREMT", $("exh-pn-issuer").value);
  const lines = Array.from(ed().querySelectorAll(".exh-fold-line")).map(txt);
  check("exhibits: one plain line says the fold set it", lines[0] === "Set by the fold on 2026-11-11", JSON.stringify(lines));
  check("exhibits: the person's older row is named as superseded", lines[1] === "Superseded: State EMS Authority, saved 2026-07-09", JSON.stringify(lines));
  check("exhibits: the lines are words, no glyph", lines.every((x) => /^[A-Za-z0-9 ,:.\-()]+$/.test(x)));
  $("exh-pn-issuer").value = "Riverside County EMS"; $("exh-pn-issuer").dispatchEvent(new t.w.Event("input"));
  $("exh-pn-save").click(); await settle();
  const post = t.calls.filter((c) => /kb_curation$/.test(c.url) && c.method === "POST").map((c) => c.body)
    .find((b) => b.field === "issuing_agency_override");
  check("exhibits: saving writes a normal person row with its own stamp", post && post.reviewer_email === "reviewer@example.org"
    && post.value === "Riverside County EMS" && post.reviewed_at && post.reviewed_at > DEC, JSON.stringify(post));
  await settle();
  const after = Array.from((ed() || t.d).querySelectorAll(".exh-fold-line")).map(txt);
  check("exhibits: the person's newer row wins at once; the fold line goes", t.M._state.cs.overlay["Emergency Medical Technician"].issuer === "Riverside County EMS"
    && !after.some((x) => /Set by the fold/.test(x)), JSON.stringify(after));
  t = await boot({ hash: "#exhibits/list", curation: ROWS.concat([{ course_id: P + "Emergency Medical Technician", field: "issuing_agency_override",
    value: "Riverside County EMS", reviewed_at: "2026-11-11T16:00:01Z" }]).slice(1) });
  check("exhibits: a row saved one second after decided_at wins on load", t.M._state.cs.overlay["Emergency Medical Technician"].issuer === "Riverside County EMS");
  const q = t.calls.find((c) => /kb_curation\?/.test(c.url) && /issuing_agency_override/.test(decodeURIComponent(c.url)));
  check("exhibits: the overlay read asks for the resolution field", q && /issuer_resolution/.test(decodeURIComponent(q.url)),
    t.calls.filter((c) => /kb_curation/.test(c.url)).map((c) => decodeURIComponent(c.url)).join(" | ").slice(0, 400));

  // ── map_export.js: the export takes the resolved issuer ──
  {
    const dom = new JSDOM('<!doctype html><html><body><div id="map-export-root"></div></body></html>', { url: "https://example.org/", runScripts: "dangerously" });
    const w = dom.window;
    w.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve(ROWS.concat([
      { course_id: P + "Emergency Medical Technician", field: "issuing_agency_additional_override", value: "National Registry of Emergency Medical Technicians | AHA", reviewed_at: "2026-07-09T00:07:08Z" }])) });
    [fs.readFileSync("issuer_resolution.js", "utf8"), fs.readFileSync("map_export.js", "utf8")].forEach(function (code) {
      const e = w.document.createElement("script"); e.textContent = code; w.document.body.appendChild(e);
    });
    const ov = await w.CPL_MAP_EXPORT_TAB._fetchOverlay();
    const m = ov.map["Emergency Medical Technician"];
    check("map_export: the export's issuer is the fold's winner", ov.ok && m.issuer === "NREMT", JSON.stringify(m));
    check("map_export: the dropped issuer is struck from the additional issuers", m.issuer2 === "AHA", JSON.stringify(m));
  }

  // ── credential_reference.js: the Catalog's overlay and its plain lines ──
  {
    const dom = new JSDOM('<!doctype html><html><body><div id="tab-credential-reference"><div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div></div></body></html>',
      { url: "https://example.org/", runScripts: "dangerously" });
    const w = dom.window;
    w.CPL_CREDENTIAL_REFERENCE = { _generated_at: "test", top_categories: {}, unified_titles: [] };
    w.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    [fs.readFileSync("issuer_resolution.js", "utf8"), fs.readFileSync("credential_reference.js", "utf8")].forEach(function (code) {
      const e = w.document.createElement("script"); e.textContent = code; w.document.body.appendChild(e);
    });
    const F = w.CPL_CER_ISSUER_FOLD;
    const m = { "Emergency Medical Technician": { issuer_override: "State EMS Authority", issuer_overridden_at: "2026-07-09T00:07:08Z",
      issuer_overridden_by: "map@rccd.edu", issuer_resolution: RES } };
    F.resolve(m);
    const r = m["Emergency Medical Technician"];
    check("credential_reference: the override reads the fold's winner", r.issuer_override === "NREMT", JSON.stringify(r));
    check("credential_reference: the plain lines", JSON.stringify(F.lines(r.issuer_fold))
      === JSON.stringify(["Set by the fold on 2026-11-11", "Superseded: State EMS Authority, saved 2026-07-09"]), JSON.stringify(F.lines(r.issuer_fold)));
    const m2 = { "Emergency Medical Technician": { issuer_override: "Riverside County EMS", issuer_overridden_at: "2026-11-11T16:00:01Z", issuer_resolution: RES } };
    F.resolve(m2);
    check("credential_reference: a row saved one second after decided_at wins, no fold line",
      m2["Emergency Medical Technician"].issuer_override === "Riverside County EMS" && F.lines(m2["Emergency Medical Technician"].issuer_fold).length === 0);
    // A person's clear after the fold (#3116 round 3): an empty row stamped after decided_at is their decision; the
    // fold's winner and its kept additional issuers do not come back.
    const m3 = { "Emergency Medical Technician": { issuer_override: "", issuer_overridden_at: "2026-11-11T16:00:01Z",
      issuer2_override: "", issuer2_overridden_at: "2026-11-11T16:00:01Z",
      issuer_resolution: JSON.stringify(Object.assign(JSON.parse(RES), { kept_additional: ["K Org"] })) } };
    F.resolve(m3);
    const r3 = m3["Emergency Medical Technician"];
    check("credential_reference: a person's clear after the fold stands (no winner, no kept additional)",
      !r3.issuer_override && !r3.issuer2_override && !r3.issuer_fold.setByFold, JSON.stringify(r3));
    const src2 = fs.readFileSync("credential_reference.js", "utf8");
    const grid = src2.slice(src2.indexOf("function saveGridRowCore"), src2.indexOf("var trainerVal", src2.indexOf("function saveGridRowCore")));
    check("credential_reference: clearing the additional issuers on a folded title saves a stamped empty row, not a DELETE",
      /extraJoined \|\| ov\.issuer_resolution\s*\?\s*saveOverride\(ut, FIELD_ISSUER2_OVERRIDE, extraJoined\)/.test(grid), grid.slice(-400));
    check("credential_reference: a save writes its own stamp", /reviewed_at: new Date\(\)\.toISOString\(\)/.test(src2.slice(src2.indexOf("function saveOverride"), src2.indexOf("function clearOverride"))));
  }

  let failed = 0;
  results.forEach(function (r) { if (!r[1]) failed++; console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "  -- " + r[2])); });
  console.log((results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})().catch(function (e) { console.log("FAIL the test threw: " + (e && e.stack)); process.exit(1); });
