// The Exhibits List view's finder and its find and replace (Sam, 2026-11-01; his asks in docs/cer_v2_redesign_lessons.md,
// The List view). Guards:
//   (1) the search bar finds a credential by college, district, SWP region or ASCCC area, accents aside, through
//       college_lookup.js (window.CCC_COLLEGE_LOOKUP);
//   (2) find and replace previews every change with its own check before anything saves, and saves only the checked rows,
//       through the same kb_curation fields Edit writes (issuing_agency_override, unified_title_override);
//   (3) a whole-cell rule leaves a partial match alone; a rule that would empty a title leaves that row out;
//   (4) Undo this replace writes the old values back.
// Run from repo root: `npm test` (or `node tests/exhibits_list_find.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const src = fs.readFileSync("exhibits.js", "utf8");

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
    if (/\/rest\/v1\/kb_curation/.test(url) && (init.method || "GET") === "GET") return ok([]);
    if (/\/rest\/v1\/kb_curation/.test(url)) return Promise.resolve({ ok: true, status: 201, json: function () { return Promise.resolve(null); } });
    return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } });
  };
  const sess = { access_token: "a.b.c", email: "sam@example.org" };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(sess); },
    authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; } };
  w.CPL_TABS = { loadScript: function (s, name, cb) { if (s === "credential_reference_data.js") w[name] = JSON.parse(JSON.stringify(CREDREF)); setTimeout(cb, 0); } };
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

  let fail = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "  -- " + why)); if (!ok) fail++; });
  console.log("\n" + (results.length - fail) + "/" + results.length + " passed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
