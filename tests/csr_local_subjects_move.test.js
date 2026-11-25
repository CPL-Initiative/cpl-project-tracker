// The CSR Local subjects courses sidebar and Edit's filing (csr_local_subjects.js, S733).
//
// Sam, 2026-11-25: on row "A" (Astronomy, 4 courses, "Interdisciplinary Studies 1" in the seed) "the sidebar showing the
// courses does not allow me to move a course to another common subject", and "there should at least be a side bar that
// allows me to move one or more courses to another subject". Guarded here, on a fixture:
//   (1) a row's Courses opens a sidebar beside the list that lists the code's courses statewide, college, number, title
//       and M-ID, and says in words which one sits under another subject (A 31 under IDST), not by color;
//   (2) the sidebar keeps the Subjects tab's sidebar rules: the view gives up its width, a resize grip, a frozen top
//       row with Close, and Close shuts it;
//   (3) a move writes course_subject_decision through the shared save, one row per checked course, key
//       CRS:<college slug>|<local code>|<course number>, value { common_code, from_mid, title, band }; the course then
//       says who moved it and when, and Take it back deletes that row;
//   (4) signed out, the courses show with no move controls and one line saying sign in to move;
//   (5) Edit saves a filing (subject_discipline_confirm) from a typed Common SUBJ, and the row then shows it.
// Run from repo root: `node tests/csr_local_subjects_move.test.js` (or `npm test`).
const fs = require("fs");
const vm = require("vm");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(n) { return (n && n.textContent || "").replace(/\s+/g, " ").trim(); }

const SRC = fs.readFileSync("canonical_subj4.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");
const LOCAL_SRC = fs.readFileSync("csr_local_subjects.js", "utf8");
const SUBJ_SRC = fs.readFileSync("commons_subjects.js", "utf8");

function entry(code, extra) {
  return Object.assign({ canonical_subj4: code, source: "data_modal", reviewed_at: null, reviewed_by: null, data_modal: code, data_modal_is_4letter: true,
    data_modal_share: 0.8, total_mids: 10, variants_observed: {}, local_subject_variants: {}, local_subject_total: 0, top_category_2digit: "19",
    canonical_source: "csr", authority_flag: "proposed", authority_chips: [], cid_subject_codes: [], ccn_subject_code: null }, extra || {});
}
const SEED = { _counts: {}, _seeded_at: "2026-09-30", _synced_at: "2026-10-19T13:25:33Z", disciplines: {
  "Astronomy": entry("ASTR", { local_subject_variants: { A: 3, ASTR: 40 }, local_subject_total: 43 }),
  "Interdisciplinary Studies": entry("IDST", { local_subject_variants: { A: 1, IDST: 20 }, local_subject_total: 21 }) } };
const MAP = { map: { A: "Astronomy", ASTR: "Astronomy", IDST: "Interdisciplinary Studies" }, _deliberately_unmapped: {} };
const TITLES = { columns: ["code", "printed_name"], colleges: [{ slug: "college_of_the_desert", college: "College of the Desert", rows: [["A", "Astronomy"]] }],
  common_codes: { ASTR: "Astronomy", IDST: "Interdisciplinary Studies" } };
const SHARD = { columns: ["college", "subject", "number", "title", "band", "top", "mid"], codes: { A: { colleges: ["College of the Desert"], rows: [
  [0, "", "1", "Descriptive Astronomy", "C", "1911.00", "ASTR M1004"], [0, "", "3", "Planetary Astronomy", "C", "1911.00", "ASTR M1023"],
  [0, "", "31", "Undergraduate Research Experience", "C", "1911.00", "IDST M1120"]] } } };

function boot(opts) {
  opts = opts || {};
  const posts = [], deletes = [];
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>
    <div id="tab-canonical-subj4">
      <div id="cs-toolbar"></div><div id="cs-summary"></div>
      <div id="cs-table-wrap"></div><div id="cs-toast"></div>
      <div id="cs-variants-modal" class="cs-modal-bg"><div class="cs-modal"><button class="cs-modal-close"></button><h3 id="cs-variants-title"></h3><div id="cs-variants-body"></div></div></div>
    </div></body></html>`, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://localhost/#canonical-subj4/local" });
  const w = dom.window;
  const reply = (body, status) => Promise.resolve({ ok: (status || 200) < 300, status: status || 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(body))) });
  w.fetch = function (url, init) {
    const u = String(url);
    if (u.indexOf("kb_curation") >= 0 && init && init.method === "POST") { posts.push(JSON.parse(init.body)); return reply([], 201); }
    if (u.indexOf("kb_curation") >= 0 && init && init.method === "DELETE") { deletes.push(u); return reply([{ course_id: "x" }]); }
    if (u.indexOf("kb_curation") >= 0) return reply([]);
    if (u.indexOf("discipline_canonical_subj4.json") >= 0) return reply(SEED);
    if (u.indexOf("subject_discipline_map.json") >= 0) return reply(MAP);
    if (u.indexOf("local_subject_titles.json") >= 0) return reply(TITLES);
    if (u.indexOf("statewide_code_courses/A.json") >= 0) return reply(SHARD);
    if (u.indexOf("discipline_cpl_rollup.json") >= 0) return reply({ byDiscipline: {} });
    return reply({}, 404);
  };
  w.matchMedia = w.matchMedia || function () { return { matches: false, addListener() {}, removeListener() {} }; };
  w.HTMLElement.prototype.scrollIntoView = function () {};
  const sess = { access_token: "aaa.bbb.ccc", refresh_token: "rrr", email: "curator@rccd.edu", exp: Date.now() + 9e6 };
  if (opts.signedIn !== false) w.sessionStorage.setItem("cpl_sb", JSON.stringify(sess));
  w.CPL_SESSION = { get: () => (opts.signedIn === false ? null : sess), isFresh: () => true, ensureFresh: () => Promise.resolve(opts.signedIn === false ? null : sess),
    authHeaders: (h) => Object.assign({ apikey: "anon", Authorization: "Bearer " + sess.access_token }, h || {}) };
  w.confirm = function () { return false; };
  const ctx = dom.getInternalVMContext ? dom.getInternalVMContext() : vm.createContext(w);
  const loads = [];
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    loads.push(s);
    if (s === "commons_list.js") vm.runInContext(LIST_SRC, ctx, { filename: s });
    if (s === "csr_local_subjects.js") vm.runInContext(LOCAL_SRC, ctx, { filename: s });
    if (s === "commons_subjects.js") vm.runInContext(SUBJ_SRC, ctx, { filename: s });
    setTimeout(cb, 0);
  } };
  vm.runInContext(SRC, ctx, { filename: "canonical_subj4.js" });
  return { w: w, d: w.document, posts: posts, deletes: deletes, loads: loads };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }
function rows(d) { return Array.from(d.querySelectorAll("#cs-local .csls-table tbody tr:not(.csls-editrow):not(.csls-band)")); }
function heads(d) { return Array.from(d.querySelectorAll("#cs-local .csls-table thead tr:first-child th")).map(txt); }
function col(d, name) { return heads(d).map((h) => h.replace(/ \(\d+\)/, "").replace(/, (A to Z|Z to A|low to high|high to low)$/, "")).indexOf(name); }
function titleOf(r) { return txt(r.children[1].querySelector(".csls-open") || r.children[1]); }
function rowOf(d, code) { return rows(d).find((r) => titleOf(r) === code); }
function cell(d, code, name) { const r = rowOf(d, code); return r ? txt(r.children[col(d, name)]) : null; }
function button(root, t) { return Array.from(root.querySelectorAll("button")).find((b) => txt(b) === t); }
function side(d) { return d.getElementById("csls-side"); }
async function openCourses(t) {
  const c = rowOf(t.d, "A").children[col(t.d, "Courses")];
  (c.querySelector("button") || c).click();
  await settle();
}

(async function () {
  // ── (1) the sidebar lists the code's courses ──
  const t = boot();
  await settle();
  check("(1) row A reads Astronomy with its seed spread", cell(t.d, "A", "MQ discipline") === "Astronomy" && /Interdisciplinary Studies 1/.test(cell(t.d, "A", "Where its courses land")),
    cell(t.d, "A", "Where its courses land"));
  await openCourses(t);
  const P = side(t.d);
  check("(1) Courses opens the sidebar and loads the Subjects tab's code for it", !!P && t.loads.indexOf("commons_subjects.js") >= 0, t.loads.join(","));
  const trs = P ? Array.from(P.querySelectorAll(".csls-side-tbl tbody tr")) : [];
  check("(1) ⭐ it lists every course under A: college, number, title and M-ID", trs.length === 3
    && /A 31/.test(txt(trs[2])) && /College of the Desert/.test(txt(trs[2])) && /Undergraduate Research Experience/.test(txt(trs[2])) && /IDST M1120/.test(txt(trs[2])),
    trs.map(txt).join(" || "));
  check("(1) the course under another subject says so in words", /Under another subject: IDST Interdisciplinary Studies/.test(txt(trs[2]))
    && trs[2].getAttribute("data-off") === "yes" && !/another subject/.test(txt(trs[0])), txt(trs[2]));
  check("(1) the sidebar names the odd course above the table", /1 course holds an M-ID under another subject than ASTR: A 31 Undergraduate Research Experience \(IDST/.test(txt(t.d.getElementById("csls-side-off"))),
    txt(t.d.getElementById("csls-side-off")));
  check("(1) the seed's count stays a one-line summary in the drawer", /In the seed: Astronomy 3, Interdisciplinary Studies 1/.test(txt(t.d.querySelector("#cs-local .csls-drawer"))),
    txt(t.d.querySelector("#cs-local .csls-drawer")));

  // ── (2) the sidebar rules ──
  const root = t.d.getElementById("cs-local");
  check("(2) the view gives up the panel's width beside it", root.classList.contains("csb-beside") && !!root.style.getPropertyValue("--csb-panel-w")
    && !!t.d.querySelector("#cs-local > .csls-page"), root.className);
  check("(2) a resize grip on the inner edge and a frozen top row with Close", !!P.querySelector(".csb-pgrip[role=separator]") && !!P.querySelector(".csb-panel-head #csls-side-close"));

  // ── (3) a move writes course_subject_decision ──
  const boxes = Array.from(P.querySelectorAll("input.csls-move"));
  check("(3) a signed-in reviewer sees a box per course and the move controls", boxes.length === 3 && !!t.d.getElementById("csls-move-to") && !!t.d.getElementById("csls-move-go"));
  boxes[2].checked = true;
  t.d.getElementById("csls-move-to").value = "idst";
  t.d.getElementById("csls-move-go").click();
  await settle();
  const mv = t.posts.filter((p) => p.field === "course_subject_decision");
  const val = mv[0] ? JSON.parse(mv[0].value) : {};
  check("(3) ⭐ the move writes one course_subject_decision row under the CRS: key with the chosen code", mv.length === 1 && t.posts.length === 1
    && mv[0].course_id === "CRS:college_of_the_desert|A|31" && val.common_code === "IDST" && val.from_mid === "IDST M1120" && mv[0].reviewer_email === "curator@rccd.edu",
    JSON.stringify(t.posts));
  const moved = side(t.d).querySelector("tr[data-course='CRS:college_of_the_desert|A|31']");
  check("(3) the course then says who moved it and when", /Moved to IDST Interdisciplinary Studies by you, [A-Z][a-z]+ \d+, \d{4}\./.test(txt(moved)), txt(moved));
  check("(3) the status line says what moved", /Moved A 31 to IDST/.test(txt(t.d.getElementById("csls-move-msg"))), txt(t.d.getElementById("csls-move-msg")));
  button(moved, "Take it back").click();
  await settle();
  check("(3) Take it back deletes that row under the reviewer's email", t.deletes.length === 1 && /course_id=eq\.CRS%3Acollege_of_the_desert%7CA%7C31/.test(t.deletes[0])
    && /field=eq\.course_subject_decision/.test(t.deletes[0]) && /reviewer_email=eq\.curator/.test(t.deletes[0]), t.deletes.join(" "));
  check("(3) the course then shows no move", !/Moved to/.test(txt(side(t.d).querySelector("tr[data-course='CRS:college_of_the_desert|A|31']"))));
  const before = t.posts.length;
  side(t.d).querySelectorAll("input.csls-move")[0].checked = true;
  t.d.getElementById("csls-move-to").value = "ZZZZ";
  t.d.getElementById("csls-move-go").click();
  await settle();
  check("(3) a code that is not a common subject saves nothing and says so", t.posts.length === before && /ZZZZ is not a common subject/.test(txt(t.d.getElementById("csls-move-msg"))));
  t.d.getElementById("csls-side-close").click();
  await settle();
  check("(2) Close shuts the sidebar and the view takes its width back", !side(t.d) && !root.classList.contains("csb-beside"));

  // ── (4) signed out ──
  const o = boot({ signedIn: false });
  await settle();
  await openCourses(o);
  const PO = side(o.d);
  check("(4) ⭐ signed out the courses show with no move controls", !!PO && PO.querySelectorAll(".csls-side-tbl tbody tr").length === 3
    && !PO.querySelector("input.csls-move") && !o.d.getElementById("csls-move-go") && !o.d.getElementById("csls-move-to"));
  check("(4) one line says sign in to move", /Sign in to move a course/.test(txt(o.d.getElementById("csls-side-signin"))));

  // ── (5) Edit saves a filing ──
  const y = boot();
  await settle();
  rowOf(y.d, "A").querySelector("button[aria-label='Edit A']").click(); await settle();
  const disc = y.d.getElementById("csls-disc");
  check("(5) Edit opens the filing beside the note", !!disc && disc.value === "Astronomy" && !!y.d.getElementById("csls-note"));
  disc.value = "IDST"; disc.dispatchEvent(new y.w.Event("input"));
  check("(5) a typed Common SUBJ names its discipline", /IDST is the Common SUBJ of Interdisciplinary Studies/.test(txt(y.d.getElementById("csls-edit-hint"))));
  button(y.d.getElementById("cs-local"), "Save").click(); await settle();
  check("(5) ⭐ Save writes the filing through subject_discipline_confirm", y.posts.length === 1 && y.posts[0].course_id === "_SUBJ_DISC::A"
    && y.posts[0].field === "subject_discipline_confirm" && y.posts[0].value === "Interdisciplinary Studies", JSON.stringify(y.posts));
  check("(5) the row then shows the person's filing and its Common SUBJ", /^Interdisciplinary Studies \(a person’s filing; the map says Astronomy\)$/.test(cell(y.d, "A", "MQ discipline"))
    && cell(y.d, "A", "Common SUBJ") === "IDST", cell(y.d, "A", "MQ discipline") + " / " + cell(y.d, "A", "Common SUBJ"));

  let pass = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
  console.log("\n" + pass + "/" + results.length + " checks passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
