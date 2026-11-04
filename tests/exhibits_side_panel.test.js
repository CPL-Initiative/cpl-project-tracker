// The Exhibits List's side panel (Sam, 2026-11-03: "when you click on an exhibit in the list and open the side bar it
// shows a list (like you've designed) of the folded members"; "yes, build the side panel into the Exhibits List").
//
// The engine's panel hook (commons_list.js) and Exhibits' contents (listPanelBody in exhibits.js). Guarded here:
//   (1) pressing a row's title opens the panel beside the table, in place of the title's drawer, and the title says so;
//   (2) the panel: the title, one line of what it is, and the members (the MAP exhibits folded under it), sortable,
//       each with its MAP link;
//   (3) the rest folded below: what each college awards, the issuer and training sites, who could adopt it;
//   (4) another title swaps the panel; Close and Escape shut it and return focus to the row's title;
//   (5) the Students column reads the reference's count, a suppressed one Too few;
//   (6) the issuer and training sites are edited in the panel, with the Credentials view's own editor (a site for a
//       college or any college), so that view can retire: the fold keeps its place through a redraw, Save writes the
//       three _CREDENTIAL_REVIEW:: rows, the List's row shows it at once and joins Changed this visit.
// Run from repo root: `node tests/exhibits_side_panel.test.js` (or `npm test`).
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
const listSrc = fs.readFileSync("commons_list.js", "utf8");
check("the engine documents the panel hook", /\/\/   panel              \{ label\(r\)/.test(listSrc));
check("the panel's CSS names no raw hex color", !/#[0-9a-fA-F]{3,8}\b/.test(src.slice(src.indexOf('".exh-l-pn-h'), src.indexOf('".exh-vh'))));

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
    if (/\/rest\/v1\/kb_curation/.test(url)) return ok([]);
    return bad(404);
  };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(opts.signedIn ? { access_token: "t", email: "reviewer@example.org" } : null); },
    authHeaders: function () { return { apikey: "anon" }; } };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "credential_reference_data.js") w[name] = JSON.parse(JSON.stringify(CREDREF));
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = fs.readFileSync("commons_list.js", "utf8"); w.document.body.appendChild(e); }
    setTimeout(cb, 0);
  } };
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

(async function () {
  let t = await boot({ hash: "#exhibits/list" });
  const d = t.d;
  const emt = titleBtn(d, "Emergency Medical Technician");
  check("(1) the row's title is the panel's control, closed", !!emt && emt.getAttribute("aria-expanded") === "false"
    && emt.getAttribute("aria-controls") === "exh-l-panel" && /open its panel$/.test(emt.getAttribute("aria-label")), emt && emt.outerHTML);
  emt.click(); await settle();
  const p = panel(d);
  check("(1) pressing it opens the panel beside the table, no drawer", !!p && p.tagName === "ASIDE" && !!d.querySelector(".exh-l-split .exh-l-wrap")
    && !d.querySelector(".exh-l-drawer"));
  check("(1) focus moves to the panel's bar, which names it", d.activeElement && d.activeElement.id === "exh-l-panel-t"
    && txt(d.getElementById("exh-l-panel-t")) === "Exhibit: Emergency Medical Technician");
  check("(1) the title now says it closes the panel", /close its panel$/.test(titleBtn(d, "Emergency Medical Technician").getAttribute("aria-label")));
  check("(2) the title and one line of what it is", txt(p.querySelector(".exh-l-pn-h")) === "Emergency Medical Technician"
    && txt(p.querySelector(".exh-l-pn-meta")) === "National Registry of Emergency Medical Technicians · CIP 51 Health Professions and Related Programs · 3 MAP titles · 2 colleges articulate · 1 could adopt · Students: Too few",
    txt(p.querySelector(".exh-l-pn-meta")));
  const memberRows = () => Array.from(panel(t.d).querySelectorAll(".exh-l-pn-table tbody tr")).map((r) => txt(r.children[1]));
  check("(2) the members: every MAP exhibit folded under it, A to Z by local title", memberRows().join("|")
    === "Emergency Medical Technician (EMT) Certification|RCOE Emergency Medical Technician (HS: RCOE)|State or County EMT Certification", memberRows().join("|"));
  const link = p.querySelector(".exh-l-pn-table tbody tr a");
  check("(2) each member links to MAP", !!link && /Exhibit=MAPICI-EMT/.test(decodeURIComponent(link.getAttribute("href"))) && link.getAttribute("target") === "_blank", link && link.getAttribute("href"));
  Array.from(p.querySelectorAll(".exh-l-pn-table th button")).find((b) => /^Units/.test(txt(b))).click(); await settle();
  check("(2) a header sorts the members, focus kept on it", memberRows().join("|")
    === "Emergency Medical Technician (EMT) Certification|RCOE Emergency Medical Technician (HS: RCOE)|State or County EMT Certification"
    && /^Units, low to high/.test(txt(t.d.activeElement)), memberRows().join("|") + " / " + txt(t.d.activeElement));
  const more = panel(t.d).querySelector("details.exh-l-pn-more");
  check("(3) the rest is folded below", !!more && !more.open && /^More about this exhibit/.test(txt(more.querySelector("summary"))));
  check("(3) what each college awards, most units first, with the median", /The median articulating college awards 6 units\./.test(txt(more))
    && /Bakersfield College , 9 units: EMTC B50, 9 hours in Emergency Medical Technician/.test(txt(more))
    && txt(more).indexOf("Bakersfield") < txt(more).indexOf("Los Angeles Mission"), txt(more));
  check("(3) and who could adopt it", /College of San Mateo already teaches FIRE 717 \(3 units\)/.test(txt(more)), txt(more));
  check("(6) the panel, its title's drawer included, no longer sends a reader to the Credentials view", !/Credentials/.test(txt(panel(t.d))), txt(panel(t.d)));
  const ed = () => panel(t.d).querySelector("details.exh-l-pn-edit");
  check("(6) the issuer and training sites fold above the rest, the summary naming both", !!ed() && !ed().open
    && txt(ed().querySelector("summary")) === "Who issues it, and where it is trained: National Registry of Emergency Medical Technicians; 1 training site"
    && ed().compareDocumentPosition(more) === 4, ed() && txt(ed().querySelector("summary")));
  ed().open = true; await settle();
  const $ = (id) => t.d.getElementById(id);
  check("(6) the editor holds the issuer and the site, for any college", $("exh-pn-issuer").value === "National Registry of Emergency Medical Technicians"
    && $("exh-pn-site-0").value === "Fontana High School" && $("exh-pn-col-0").value === "");
  check("(6) a site's college is one of the colleges articulating it", Array.from($("exh-pn-col-0").options).map((o) => o.value).join("|")
    === "|Bakersfield College|Los Angeles Mission College", Array.from($("exh-pn-col-0").options).map((o) => o.value).join("|"));
  $("exh-pn-issuer").value = "Comp"; $("exh-pn-issuer").dispatchEvent(new t.w.Event("input"));
  const opts = $("exh-pn-issuer-opts");
  check("(6) the issuer box offers the names already in the reference", !!opts && !opts.hidden && /CompTIA/.test(txt(opts)), opts && txt(opts));
  Array.from(opts.querySelectorAll("button")).find((b) => txt(b) === "CompTIA").click();
  $("exh-pn-issuer").value = "NREMT"; $("exh-pn-issuer").dispatchEvent(new t.w.Event("input"));
  Array.from(panel(t.d).querySelectorAll(".exh-l-pn-table th button")).find((b) => /^Exhibit/.test(txt(b))).click(); await settle();
  check("(6) a redraw keeps both folds where the reader left them, and the draft", ed().open && !panel(t.d).querySelector("details.exh-l-pn-more").open
    && $("exh-pn-issuer").value === "NREMT");
  Array.from(ed().querySelectorAll("button")).find((b) => txt(b) === "Add a training site").click(); await settle();
  check("(6) Add a training site adds a row and focuses its box", !!$("exh-pn-site-1") && t.d.activeElement === $("exh-pn-site-1") && ed().open);
  t.d.querySelector('#exh-l-panel [aria-label="Remove training site 2"]').click(); await settle();
  check("(6) Remove takes it away and returns focus to Add", !$("exh-pn-site-1") && t.d.activeElement === $("exh-pn-add"));
  $("exh-pn-save").click(); await settle();
  check("(6) signed out, Save asks for a sign-in and writes nothing", /Sign in as a reviewer to save/.test(txt(ed().querySelector(".exh-status")))
    && !t.calls.some((c) => /kb_curation$/.test(c.url) && c.method === "POST") && panel(t.d) && ed().open);
  // (4) another title swaps it; Close and Escape return focus to the row
  titleBtn(t.d, "CompTIA Security+").click(); await settle();
  check("(4) another title swaps the panel", txt(panel(t.d).querySelector(".exh-l-pn-h")) === "CompTIA Security+"
    && /MAP records no exhibit under this name/.test(txt(panel(t.d))));
  Array.from(panel(t.d).querySelectorAll("button")).find((b) => txt(b) === "Close").click(); await settle();
  check("(4) Close shuts it and returns focus to the row's title", !panel(t.d) && t.d.activeElement && txt(t.d.activeElement) === "CompTIA Security+");
  titleBtn(t.d, "Emergency Medical Technician").click(); await settle();
  panel(t.d).dispatchEvent(new t.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await settle();
  check("(4) Escape shuts it too", !panel(t.d) && txt(t.d.activeElement) === "Emergency Medical Technician");
  // (5) the Students column
  const heads = Array.from(t.d.querySelectorAll(".exh-l-table thead tr:first-child th")).map(txt);
  const si = heads.findIndex((h) => /^Students/.test(h));
  const rowOf = (ut) => Array.from(t.d.querySelectorAll(".exh-l-table tbody tr")).find((r) => r.querySelector("td[data-key]") && r.querySelector("td[data-key]").getAttribute("data-key") === ut);
  check("(5) the Students column reads the count, a suppressed one Too few", si > -1 && txt(rowOf("CompTIA Security+").children[si]) === "57"
    && txt(rowOf("Emergency Medical Technician").children[si]) === "Too few", heads.join(" | "));

  // (6) signed in: the save
  t = await boot({ hash: "#exhibits/list", signedIn: true });
  titleBtn(t.d, "Emergency Medical Technician").click(); await settle();
  const ed2 = () => panel(t.d).querySelector("details.exh-l-pn-edit");
  ed2().open = true; await settle();
  const $2 = (id) => t.d.getElementById(id);
  $2("exh-pn-save").click(); await settle();
  check("(6) Save with nothing changed writes nothing and says so", /Nothing changed/.test(txt(ed2().querySelector(".exh-status")))
    && !t.calls.some((c) => /kb_curation$/.test(c.url) && c.method === "POST"));
  $2("exh-pn-issuer").value = "  NREMT "; $2("exh-pn-issuer").dispatchEvent(new t.w.Event("input"));
  $2("exh-pn-col-0").value = "Bakersfield College"; $2("exh-pn-col-0").dispatchEvent(new t.w.Event("change"));
  Array.from(ed2().querySelectorAll("button")).find((b) => txt(b) === "Add a training site").click(); await settle();
  $2("exh-pn-col-1").value = "Los Angeles Mission College"; $2("exh-pn-col-1").dispatchEvent(new t.w.Event("change"));
  $2("exh-pn-site-1").value = "LA Mission   EMT Academy"; $2("exh-pn-site-1").dispatchEvent(new t.w.Event("input"));
  $2("exh-pn-save").click(); await settle();
  const posts = t.calls.filter((c) => /kb_curation$/.test(c.url) && c.method === "POST");
  const byField = {}; posts.forEach((c) => { byField[c.body.field] = c.body; });
  check("(6) Save writes three rows under the credential's key, as the reviewer", posts.length === 3
    && posts.every((c) => c.body.course_id === "_CREDENTIAL_REVIEW::Emergency Medical Technician" && c.body.reviewer_email === "reviewer@example.org"),
    JSON.stringify(posts.map((c) => c.body)));
  check("(6) the issuer, the sites each with its college, and the sites joined", byField.issuing_agency_override && byField.issuing_agency_override.value === "NREMT"
    && byField.training_sites_override && byField.training_sites_override.value === JSON.stringify([{ site: "Fontana High School", college: "Bakersfield College" },
      { site: "LA Mission EMT Academy", college: "Los Angeles Mission College" }])
    && byField.training_agency_override && byField.training_agency_override.value === "Fontana High School; LA Mission EMT Academy");
  const heads2 = Array.from(t.d.querySelectorAll(".exh-l-table thead tr:first-child th")).map(txt);
  const ii = heads2.findIndex((h) => /^Issuer/.test(h));
  const emtRow = Array.from(t.d.querySelectorAll(".exh-l-table tbody tr")).find((r) => r.querySelector('td[data-key="Emergency Medical Technician"]'));
  check("(6) the save says so, the panel and its fold stay, the row shows the issuer at once", /Saved\. The tabs show it now/.test(txt(ed2().querySelector(".exh-status")))
    && ed2().open && t.d.activeElement === $2("exh-pn-save") && ii > -1 && txt(emtRow.children[ii]) === "NREMT",
    txt(ed2().querySelector(".exh-status")) + " / " + (emtRow && ii > -1 ? txt(emtRow.children[ii]) : "no row"));
  check("(6) the row joins Changed this visit", (t.M._state.ls.changed || []).indexOf("Emergency Medical Technician") > -1);
  check("(6) the summary follows the save", /: NREMT; 2 training sites$/.test(txt(ed2().querySelector("summary"))), txt(ed2().querySelector("summary")));
  check("(6) the Credentials view reads the same save", t.M._credCurrent(t.M._state.cs.rows.find((r) => r.ut === "Emergency Medical Technician")).sites.length === 2);
  // The row's Edit holds site names alone; a site it keeps keeps its college.
  Array.from(t.d.querySelectorAll("button")).find((b) => b.getAttribute("aria-label") === "Edit Emergency Medical Technician").click(); await settle();
  $2("exh-l-s").value = "Fontana High School; LA Mission EMT Academy; Riverside EMS Academy"; $2("exh-l-s").dispatchEvent(new t.w.Event("input"));
  Array.from(t.d.querySelectorAll("button")).find((b) => txt(b) === "Save" && b.id !== "exh-pn-save").click(); await settle();
  const rowSites = t.calls.filter((c) => /kb_curation$/.test(c.url) && c.method === "POST" && c.body.field === "training_sites_override").slice(1);
  check("(6) the row's Edit keeps each kept site's college, a new site for any college", rowSites.length === 1 && rowSites[0].body.value === JSON.stringify([
    { site: "Fontana High School", college: "Bakersfield College" }, { site: "LA Mission EMT Academy", college: "Los Angeles Mission College" },
    { site: "Riverside EMS Academy" }]), JSON.stringify(rowSites.map((c) => c.body.value)));

  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n     " + r[2])); });
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
