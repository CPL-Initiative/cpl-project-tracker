// The Exhibits List view's finder and its find and replace (Sam, 2026-11-01; his asks in docs/cer_v2_redesign_lessons.md,
// The List view). Guards:
//   (1) the search bar finds a credential by college, district, SWP region or ASCCC area, accents aside, through
//       college_lookup.js (window.CCC_COLLEGE_LOOKUP);
//   (2) find and replace previews every change with its own check before anything saves, and saves only the checked rows,
//       through the same kb_curation fields Edit writes (issuing_agency_override, unified_title_override);
//   (3) a whole-cell rule leaves a partial match alone; a rule that would empty a title leaves that row out;
//   (4) Undo this replace writes the old values back;
//   (5) AI sort orders the rows by kb/exhibits_ai_sort.json, a band names each group of two or more (and each run of
//       titles alone, "Not in a group"), and a header press
//       leaves it (Sam, 2026-11-01: "like with like in an alpha-like order");
//   (6) Edit every row turns Title, Issuer and Training sites into boxes on every row; leaving a box saves that field
//       alone, Escape puts the value back (Sam, 2026-11-01: "a global Edit button");
//   (7) a column resizes on a phone (Sam, 2026-11-01: "trying to resize the first column but not having luck"): the
//       table keeps its fixed layout under 560px, where automatic layout ignored the widths a drag set, and the grip
//       sits inside its own header, takes the finger (touch-action:none) and captures the pointer;
//   (8) a spelling twin carries a suggested fold (Sam, 2026-11-01: "offering suggested titles based on what you see"):
//       the Suggested folds filter shows only twins; Accept writes unified_title_override and unified_title_merge_confirm
//       naming the same target, the pair the rename dry-run folds on; Dismiss hides it for the visit;
//   (9) an accepted fold stays improvable (Sam, 2026-11-01: "for the folds already accepted I would want to be sure
//       that we can fold to better titles"): a fold whose target itself folds shows Re-point, which writes both rows
//       to the chain's end; Folds waiting for the apply lists the accepted folds; a group's band counts its
//       suggested folds; a suggestion points at the end of the chain;
//  (10) Basis (Sam, 2026-11-01: "count all canonical exhibit titles that include a statewide as based on a statewide,
//       whether local or not"): a credential with a statewide exhibit in fact-sheet/statewide_recs.js reads Statewide,
//       the Based on statewide and Local only filters split the list, and its drawer names the statewide exhibits;
//  (11) every drawer answers its own column by name (the Confidence column had shifted the drawers by one);
//  (12) the cert link (Sam, 2026-11-01: "a separate canonical list of just our certs, apart from how they might be
//       bundled"): a test's name finds the bundle holding it, the title drawer lists its certs by catalog id and the
//       names not yet in the cert table, and Show every exhibit with it narrows the list until Clear.
// Run from repo root: `npm test` (or `node tests/exhibits_list_find.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const src = fs.readFileSync("exhibits.js", "utf8");
// The List is drawn by the shared engine (commons_list.js, S542); the grip's pointer handling lives there.
const listSrc = fs.readFileSync("commons_list.js", "utf8");

const CREDREF = { _generated_at: "2026-11-01T05:19:00+00:00", unified_titles: [
  { ut: "Welding Level 1", issuer: "AWS", cpl_types: ["Industry Certification"], disc_modal: "Welding", top_modal: "0956.50",
    curated_by: "reviewer", curated_at: "2026-10-01", conf_title: 0.9, raw_count: 3,
    articulations: [{ cid: "WELD M1001", sys: "M-ID", local: [{ colleges: ["Norco College", "Bakersfield College"] }] }] },
  { ut: "10-Key Data Entry", issuer: "Proctored Testing Center", cpl_types: ["Credit By Exam"], disc_modal: "Building Codes and Regulations",
    top_modal: "0514.00", curated_by: "session105-skyclose@bot", curated_at: "2026-07-08", conf_title: 0.45, quality_flag: "suspect_course_as_exhibit",
    raw_count: 2, articulations: [{ cid: "CNSR M10AA", sys: "M-ID", local: [{ colleges: ["Modesto Junior College"] }] }] },
  { ut: "Apiary Basics", issuer: "", cpl_types: [], disc_modal: "", raw_count: 1, articulations: [] }
] };
const ADOPTION = { schema: 1, cip_sectors: { "48": "Precision Production", "52": "Business" }, colleges: [],
  credentials: { "Welding Level 1": { s: "48" }, "10-Key Data Entry": { s: "52" } } };
const LOOKUP = {
  "Norco College": { district: "Riverside Community College District", swRegion: "Inland Empire/Desert (Region 9)", ascccArea: "D" },
  "Bakersfield College": { district: "Kern Community College District", swRegion: "Central Valley/Mother Lode (Region 5)", ascccArea: "A" },
  "Modesto Junior College": { district: "Yosemite Community College District", swRegion: "Central Valley/Mother Lode (Region 5)", ascccArea: "A" }
};
const AISORT = { schema: 1, _reference_generated_at: "2026-11-01T05:19:00+00:00",
  groups: [{ name: "Apiary", n: 1 }, { name: "Data and Welding", n: 2 }],
  order: { "Apiary Basics": [0, 0], "Welding Level 1": [1, 1], "10-Key Data Entry": [1, 2] },
  counts: { suggested_folds: 1 },
  suggest: { "10-Key Data Entry": { to: "Apiary Basics", why: "the same words spelled another way" } } };
let OVERLAY_ROWS = [];
const CERTLINKS = { schema: 1, certs: { ITC1: { code: "T8", name: "Preventive Maintenance Inspection", family: "ASE" },
  ITC2: { code: "A5", name: "Brakes", family: "ASE" } },
  links: { "Welding Level 1": { relation: "holds", rule: "all", certs: ["ITC1", "ITC2"], unresolved: ["SP/2 HD"] },
    "Apiary Basics": { relation: "aligned", rule: "all", certs: ["ITC2"] } } };
const COLLISIONS = { collisions: [{ old_unified_title: "Apiary Basics", proposed_new_title: "Beekeeping" }] };

function load() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/#exhibits/list", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null });
    const ok = function (o) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(o))); } }); };
    if (url === "kb/exhibits_review.json") return ok({ schema: 1, written_at: "2026-11-01T05:22:00Z", sources: {}, tiles: {}, steps: {}, colleges: [], held: [] });
    if (url === "kb/exhibits_adoption.json") return ok(ADOPTION);
    if (url === "kb/cred_rename_dryrun/collisions.json") return ok(COLLISIONS);
    if (url === "kb/exhibits_ai_sort.json") return ok(AISORT);
    if (url === "kb/exhibit_cert_links.json") return ok(CERTLINKS);
    if (/\/rest\/v1\/kb_curation/.test(url) && (init.method || "GET") === "GET") return ok(/unified_title_override/.test(url) ? OVERLAY_ROWS : []);
    if (/\/rest\/v1\/kb_curation/.test(url)) return Promise.resolve({ ok: true, status: 201, json: function () { return Promise.resolve(null); } });
    return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } });
  };
  const sess = { access_token: "a.b.c", email: "sam@example.org" };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(sess); },
    authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; } };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = fs.readFileSync("commons_list.js", "utf8"); w.document.body.appendChild(e); }
    if (s === "credential_reference_data.js") w[name] = JSON.parse(JSON.stringify(CREDREF));
    if (s === "fact-sheet/statewide_recs.js") w[name] = { "Welding Level 1": [{ t: "Welding 101", u: "3", id: "MAPICI-WELD-1-001" }, { t: "Welding 102", u: "3", id: "MAPICI-WELD-1-001" }] };
    setTimeout(cb, 0); } };
  w.CCC_COLLEGE_LOOKUP = LOOKUP;
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, calls: calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 10; i++) await tick(); }
function rows(d) { return Array.from(d.querySelectorAll(".exh-l-table tbody tr:not(.exh-l-editrow)")); }
function words(d, t) { return Array.from(d.querySelectorAll("button")).find((b) => txt(b) === t); }

(async function () {
  const t = load();
  await t.M.boot(); await settle();
  const q = t.d.getElementById("exh-l-find");
  async function find(v) { q.value = v; q.dispatchEvent(new t.w.Event("input")); await settle(); return rows(t.d).map((r) => txt(r.children[2])); }
  let got = await find("Norco College");
  check("(1) a college finds the credentials it articulates", got.length === 1 && /^Welding/.test(got[0]), got.join(" | "));
  got = await find("Yosemite Community College District");
  check("(1) a district finds its colleges' credentials", got.length === 1 && /^10-Key/.test(got[0]), got.join(" | "));
  got = await find("Region 5");
  check("(1) an SWP region finds every credential its colleges articulate", got.length === 2, got.join(" | "));
  got = await find("ASCCC Area D");
  check("(1) an ASCCC area finds its colleges' credentials", got.length === 1 && /^Welding/.test(got[0]), got.join(" | "));
  got = await find("weldíng");
  check("(1) accents and case aside", got.length === 1 && /^Welding/.test(got[0]), got.join(" | "));
  check("(1) the box says what it searches", /college, district, SWP region, ASCCC area/.test(q.getAttribute("placeholder")));
  await find("");

  words(t.d, "Find and replace").click(); await settle();
  const panel = t.d.getElementById("exh-fr");
  check("(2) Find and replace opens a labelled panel", !!panel && txt(t.d.getElementById("exh-fr-h")) === "Find and replace");
  function setv(id, v) { const n = t.d.getElementById(id); n.value = v; n.dispatchEvent(new t.w.Event(n.tagName === "SELECT" ? "change" : "input")); }
  setv("exh-fr-col", "issuer"); setv("exh-fr-find", "testing center"); setv("exh-fr-rep", "Testing Office");
  const before = t.calls.filter((c) => c.method === "POST").length;
  t.d.getElementById("exh-fr-prev").click(); await settle();
  let prev = Array.from(t.d.querySelectorAll(".exh-fr-table tbody tr"));
  check("(2) ⭐ the preview lists the change, now and after, before anything saves",
    prev.length === 1 && /Proctored Testing Center/.test(txt(prev[0])) && /Proctored Testing Office/.test(txt(prev[0]))
    && t.calls.filter((c) => c.method === "POST").length === before, prev.map(txt).join(" | "));
  check("(2) the preview's header cells are th scope=col in a labelled region",
    t.d.querySelectorAll('.exh-fr-table th[scope="col"]').length === 4 && !!t.d.querySelector('.exh-fr-wrap[role="region"][aria-label]'));

  t.d.getElementById("exh-fr-whole").click(); await settle();
  t.d.getElementById("exh-fr-prev").click(); await settle();
  check("(3) Whole cell leaves a partial match alone", t.d.querySelectorAll(".exh-fr-table tbody tr").length === 0
    && /No row/.test(txt(t.d.getElementById("exh-fr-count"))), txt(t.d.getElementById("exh-fr")));
  t.d.getElementById("exh-fr-whole").click(); await settle();

  t.d.getElementById("exh-fr-prev").click(); await settle();
  t.d.getElementById("exh-fr-save").click(); await settle(); await settle();
  let posts = t.calls.filter((c) => c.method === "POST").slice(before);
  check("(2) ⭐ Save writes issuing_agency_override for the checked row only",
    posts.length === 1 && posts[0].body.field === "issuing_agency_override" && posts[0].body.value === "Proctored Testing Office"
    && posts[0].body.course_id === "_CREDENTIAL_REVIEW::10-Key Data Entry", JSON.stringify(posts.map((p) => p.body)));
  check("(2) the row shows the new issuer at once", txt(rows(t.d)[0].children[6]) === "Proctored Testing Office", txt(rows(t.d)[0]));
  check("(2) it says what it did", /Replaced in 1 credential/.test(txt(t.d.getElementById("exh-fr"))), txt(t.d.getElementById("exh-fr")));

  const n0 = t.calls.filter((c) => c.method === "POST").length;
  words(t.d, "Undo this replace (1)").click(); await settle(); await settle();
  posts = t.calls.filter((c) => c.method === "POST").slice(n0);
  check("(4) ⭐ Undo writes the old value back", posts.length === 1 && posts[0].body.value === "Proctored Testing Center"
    && txt(rows(t.d)[0].children[6]) === "Proctored Testing Center", JSON.stringify(posts.map((p) => p.body)));

  setv("exh-fr-col", "title"); setv("exh-fr-find", "e"); setv("exh-fr-rep", "E");
  t.d.getElementById("exh-fr-prev").click(); await settle();
  prev = Array.from(t.d.querySelectorAll(".exh-fr-table tbody tr"));
  const n1 = t.calls.filter((c) => c.method === "POST").length;
  prev[0].querySelector("input").click(); await settle();
  check("(2) unchecking a row updates the count", prev.length === 2 && /1 checked/.test(txt(t.d.getElementById("exh-fr-count"))) && txt(t.d.getElementById("exh-fr-save")) === "Save the 1 checked",
    txt(t.d.getElementById("exh-fr-count")));
  t.d.getElementById("exh-fr-save").click(); await settle(); await settle();
  posts = t.calls.filter((c) => c.method === "POST").slice(n1);
  check("(2) a title replace writes unified_title_override for each checked row, the unchecked one left alone",
    posts.length === 1 && posts.every((p) => p.body.field === "unified_title_override") && !posts.some((p) => p.body.course_id === "_CREDENTIAL_REVIEW::" + txt(prev[0].children[1])),
    JSON.stringify(posts.map((p) => p.body)));

  setv("exh-fr-col", "title"); setv("exh-fr-find", "Apiary Basics"); setv("exh-fr-rep", "");
  t.d.getElementById("exh-fr-whole").click(); await settle();
  t.d.getElementById("exh-fr-prev").click(); await settle();
  check("(3) a rule that would empty a title leaves the row out", t.d.querySelectorAll(".exh-fr-table tbody tr").length === 0
    && /empty title/.test(txt(t.d.getElementById("exh-fr-count"))), txt(t.d.getElementById("exh-fr-count")));

  words(t.d, "Close").click(); await settle();
  t.d.getElementById("exh-l-ai").click(); await settle();
  const body = Array.from(t.d.querySelectorAll(".exh-l-table tbody tr"));
  const seq = body.map((r) => r.classList.contains("exh-l-band") ? "band:" + txt(r) : txt(r.children[2]).slice(0, 7));
  check("(5) ⭐ AI sort orders like with like, a band over each group of two or more and one over each run of titles alone",
    seq.length === 5 && seq[0] === "band:Not in a group" && seq[1] === "Apiary " && /^band:Data and Welding/.test(seq[2]) && /^welding/i.test(seq[3])
    && /^10-Key/.test(seq[4]), seq.join(" | "));
  check("(5) the band is a th scope=rowgroup and the button says it is on",
    !!t.d.querySelector('.exh-l-band th[scope="rowgroup"]') && t.d.getElementById("exh-l-ai").getAttribute("aria-pressed") === "true");
  check("(5) the sort line says how the groups were made", /AI sort: like with like/.test(txt(t.d.getElementById("exh-l-sortline"))));
  Array.from(t.d.querySelectorAll(".exh-l-sort"))[0].click(); await settle();
  check("(5) a header press leaves the AI sort", !t.d.querySelector(".exh-l-band") && t.d.getElementById("exh-l-ai").getAttribute("aria-pressed") === "false");

  t.d.getElementById("exh-l-editall").click(); await settle();
  const boxes = t.d.querySelectorAll(".exh-l-cellin");
  check("(6) Edit every row puts a Title, Issuer and Training sites box on every row", boxes.length === 9, String(boxes.length));
  const iss = Array.from(boxes).find((b) => /^Issuer of welding level 1$/i.test(b.getAttribute("aria-label")));
  const n2 = t.calls.filter((c) => c.method === "POST").length;
  iss.value = "American Welding Society (AWS)"; iss.dispatchEvent(new t.w.Event("change")); await settle(); await settle();
  posts = t.calls.filter((c) => c.method === "POST").slice(n2);
  check("(6) ⭐ leaving a box saves that field alone", posts.length === 1 && posts[0].body.field === "issuing_agency_override"
    && posts[0].body.value === "American Welding Society (AWS)" && posts[0].body.course_id === "_CREDENTIAL_REVIEW::Welding Level 1"
    && /Saved the issuer of welding level 1/i.test(txt(t.d.getElementById("exh-l-cellnote"))), JSON.stringify(posts.map((p) => p.body)));
  const tbox = Array.from(t.d.querySelectorAll(".exh-l-cellin")).find((b) => b.getAttribute("aria-label") === "Title of Apiary Basics");
  tbox.value = "Bees"; tbox.dispatchEvent(new t.w.KeyboardEvent("keydown", { key: "Escape" }));
  check("(6) Escape puts the value back", tbox.value === "Apiary Basics");
  const n3 = t.calls.filter((c) => c.method === "POST").length;
  tbox.value = "   "; tbox.dispatchEvent(new t.w.Event("change")); await settle();
  check("(6) an emptied title does not save", t.calls.filter((c) => c.method === "POST").length === n3 && tbox.value === "Apiary Basics");

  const css = txt(t.d.getElementById("exh-l-css"));
  check("(7) ⭐ a phone keeps the fixed table layout, so a dragged width applies",
    !/max-width:560px\)\{\.exh-l-table\{[^}]*table-layout:auto/.test(css) && /\.exh-l-table\{[^}]*table-layout:fixed/.test(css), css.slice(0, 200));
  check("(7) the grip sits inside its header and takes the finger", /\.exh-l-grip\{[^}]*right:0;[^}]*touch-action:none/.test(css)
    && /setPointerCapture/.test(listSrc) && /pointercancel/.test(listSrc));

  t.d.getElementById("exh-l-editall").click(); await settle();
  words(t.d, "Suggested folds").click(); await settle();
  const sgRows = rows(t.d);
  check("(8) Suggested folds shows only the twin, with its fold and why", sgRows.length === 1 && /^10-Key/.test(txt(sgRows[0].children[2]))
    && /Suggested: fold into Apiary Basics \(the same words spelled another way\)/.test(txt(sgRows[0].children[2])), sgRows.map(txt).join(" | "));
  const n4 = t.calls.filter((c) => c.method === "POST").length;
  Array.from(sgRows[0].querySelectorAll("button")).find((b) => txt(b) === "Accept").click(); await settle(); await settle();
  posts = t.calls.filter((c) => c.method === "POST").slice(n4);
  check("(8) ⭐ Accept writes the rename and the merge confirm, both naming the target",
    posts.length === 2 && posts.every((p) => p.body.course_id === "_CREDENTIAL_REVIEW::10-Key Data Entry" && p.body.value === "Apiary Basics")
    && posts.map((p) => p.body.field).sort().join(",") === "unified_title_merge_confirm,unified_title_override", JSON.stringify(posts.map((p) => p.body)));
  check("(8) an accepted fold leaves the Suggested list", rows(t.d).length === 0 && /folds into Apiary Basics/.test(txt(t.d.getElementById("exh-l-cellnote"))),
    txt(t.d.getElementById("exh-l-cellnote")));
  t.M._state.ls.aiData.suggest["Apiary Basics"] = { to: "Welding Level 1", why: "test" }; t.M._state.ls.f = ""; t.M.render(); await settle();
  words(t.d, "Suggested folds").click(); await settle();
  Array.from(rows(t.d)[0].querySelectorAll("button")).find((b) => txt(b) === "Dismiss").click(); await settle();
  check("(8) Dismiss hides the suggestion", rows(t.d).length === 0);

  // (9) A second visit, with two waiting folds: 10-Key into Apiary, and Apiary into Welding Level 1.
  OVERLAY_ROWS = [
    { course_id: "_CREDENTIAL_REVIEW::10-Key Data Entry", field: "unified_title_override", value: "Apiary Basics" },
    { course_id: "_CREDENTIAL_REVIEW::10-Key Data Entry", field: "unified_title_merge_confirm", value: "Apiary Basics" },
    { course_id: "_CREDENTIAL_REVIEW::Apiary Basics", field: "unified_title_override", value: "Welding Level 1" },
    { course_id: "_CREDENTIAL_REVIEW::Apiary Basics", field: "unified_title_merge_confirm", value: "Welding Level 1" }];
  const u = load();
  await u.M.boot(); await settle();
  Array.from(u.d.querySelectorAll("button")).find((b) => txt(b) === "Folds waiting for the apply").click(); await settle();
  const wr = rows(u.d).map((r) => txt(r.children[2]));
  check("(9) Folds waiting for the apply lists both accepted folds", wr.length === 2, wr.join(" | "));
  const stalled = rows(u.d).find((r) => /now folds into Welding Level 1/.test(txt(r.children[2])));
  check("(9) ⭐ a fold whose target itself folds says it would stall and offers Re-point",
    !!stalled && /Apiary Basics now folds into Welding Level 1, so this fold would stall/.test(txt(stalled.children[2])), wr.join(" | "));
  const n5 = u.calls.filter((c) => c.method === "POST").length;
  Array.from(stalled.querySelectorAll("button")).find((b) => txt(b) === "Re-point to Welding Level 1").click(); await settle(); await settle();
  const rp = u.calls.filter((c) => c.method === "POST").slice(n5);
  check("(9) ⭐ Re-point writes the rename and the merge confirm to the chain's end",
    rp.length === 2 && rp.every((p) => p.body.course_id === "_CREDENTIAL_REVIEW::10-Key Data Entry" && p.body.value === "Welding Level 1")
    && rp.map((p) => p.body.field).sort().join(",") === "unified_title_merge_confirm,unified_title_override", JSON.stringify(rp.map((p) => p.body)));
  check("(9) after Re-point no waiting fold stalls", !rows(u.d).some((r) => /would stall/.test(txt(r))));
  OVERLAY_ROWS = [{ course_id: "_CREDENTIAL_REVIEW::Apiary Basics", field: "unified_title_override", value: "Welding Level 1" },
    { course_id: "_CREDENTIAL_REVIEW::Apiary Basics", field: "unified_title_merge_confirm", value: "Welding Level 1" }];
  const v = load();
  await v.M.boot(); await settle();
  v.d.getElementById("exh-l-ai").click(); await settle();
  const band = Array.from(v.d.querySelectorAll(".exh-l-band")).map(txt).join(" | ");
  check("(9) a group's band counts its suggested folds", /2 in this group, .*1 suggested fold/.test(band), band);
  const tenKey = rows(v.d).find((r) => /^10-Key/.test(txt(r.children[2])));
  check("(9) a suggestion points at the end of the chain",
    !!tenKey && /Suggested: fold into Welding Level 1 \(the same words spelled another way; Apiary Basics itself now folds into Welding Level 1\)/.test(txt(tenKey.children[2])),
    tenKey && txt(tenKey.children[2]));

  // (10) and (11) on a fresh visit.
  OVERLAY_ROWS = [];
  const x = load();
  await x.M.boot(); await settle();
  const heads2 = Array.from(x.d.querySelectorAll(".exh-l-table thead th")).map(txt);
  check("(10) a Basis column after MAP titles", heads2.some((h) => /^Basis/.test(h)), heads2.join(","));
  const bi = Array.from(x.d.querySelectorAll(".exh-l-table thead tr:first-child th")).findIndex((h) => /^Basis/.test(txt(h)));
  const basis = rows(x.d).map((r) => txt(r.children[2]).slice(0, 7) + "=" + txt(r.children[bi]));
  check("(10) ⭐ a credential with a statewide exhibit reads Statewide, the rest Local",
    basis.join("|") === "10-Key =Local|Apiary =Local|Welding=Statewide", basis.join("|"));
  Array.from(x.d.querySelectorAll("button")).find((b) => txt(b) === "Based on statewide").click(); await settle();
  check("(10) Based on statewide shows only it", rows(x.d).length === 1 && /^Welding/.test(txt(rows(x.d)[0].children[2])));
  Array.from(rows(x.d)[0].children[bi].querySelectorAll("button")).find((b) => /Basis/.test(b.getAttribute("aria-label"))).click(); await settle();
  check("(10) its drawer names the statewide exhibit and its recommendations",
    /Based on statewide/.test(txt(x.d.querySelector(".exh-l-drawer"))) && /MAPICI-WELD-1-001, 2 credit recommendations/.test(txt(x.d.querySelector(".exh-l-drawer"))),
    txt(x.d.querySelector(".exh-l-drawer")));
  Array.from(x.d.querySelectorAll("button")).find((b) => txt(b) === "Local only").click(); await settle();
  check("(10) Local only shows the rest", rows(x.d).length === 2);
  Array.from(x.d.querySelectorAll("button")).find((b) => txt(b) === "All").click(); await settle();
  const issIdx = Array.from(x.d.querySelectorAll(".exh-l-table thead tr:first-child th")).findIndex((h) => /^Issuer/.test(txt(h)));
  const wRow = rows(x.d).find((r) => /^Welding/.test(txt(r.children[2])));
  wRow.children[issIdx].querySelector("button.exh-l-open").click(); await settle();
  check("(11) ⭐ the Issuer drawer answers about the issuer", /credentials? names? AWS/.test(txt(x.d.querySelector(".exh-l-drawer"))),
    txt(x.d.querySelector(".exh-l-drawer")));
  const typIdx = Array.from(x.d.querySelectorAll(".exh-l-table thead tr:first-child th")).findIndex((h) => /^CPL types/.test(txt(h)));
  rows(x.d).find((r) => /^Welding/.test(txt(r.children[2]))).children[typIdx].querySelector("button.exh-l-open").click(); await settle();
  Array.from(x.d.querySelectorAll(".exh-l-drawer button")).find((b) => txt(b) === "Industry Certification").click(); await settle();
  check("(11) a CPL type picked in its drawer filters the CPL types column", rows(x.d).length === 1 && /^Welding/.test(txt(rows(x.d)[0].children[2]))
    && x.d.getElementById("exh-l-cf-" + (typIdx - 2)).value === "Industry Certification", rows(x.d).map((r) => txt(r.children[2])).join("|"));

  // (12) on a fresh visit.
  const z = load();
  await z.M.boot(); await settle();
  const zq = z.d.getElementById("exh-l-find");
  zq.value = "preventive maintenance"; zq.dispatchEvent(new z.w.Event("input")); await settle();
  check("(12) ⭐ a test's name finds the bundle holding it", rows(z.d).length === 1 && /^Welding/.test(txt(rows(z.d)[0].children[2])),
    rows(z.d).map((r) => txt(r.children[2])).join("|"));
  zq.value = ""; zq.dispatchEvent(new z.w.Event("input")); await settle();
  const wz = rows(z.d).find((r) => /^Welding/.test(txt(r.children[2])));
  wz.children[2].querySelector("button.exh-l-open").click(); await settle();
  const dz = txt(z.d.querySelector(".exh-l-drawer"));
  check("(12) the title drawer lists the certs by catalog id and the names not yet in the table",
    /Holds all of these certifications/.test(dz) && /ASE T8 Preventive Maintenance Inspection \(ITC1\)/.test(dz) && /ASE A5 Brakes \(ITC2\)/.test(dz)
    && /not yet in the cert table: SP\/2 HD/.test(dz), dz);
  Array.from(z.d.querySelectorAll(".exh-l-drawer button")).find((b) => /Show every exhibit with ASE A5 Brakes/.test(b.getAttribute("aria-label") || "")).click(); await settle();
  check("(12) Show every exhibit with it lists the holder and the aligned course", rows(z.d).length === 2
    && /ASE A5 Brakes/.test(txt(z.d.getElementById("exh-l-certline"))), rows(z.d).map((r) => txt(r.children[2])).join("|"));
  Array.from(z.d.getElementById("exh-l-certline").querySelectorAll("button")).find((b) => txt(b) === "Clear").click(); await settle();
  check("(12) Clear restores the list", rows(z.d).length === 3 && !z.d.getElementById("exh-l-certline"));

  let fail = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "  -- " + why)); if (!ok) fail++; });
  console.log("\n" + (results.length - fail) + "/" + results.length + " passed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
