// The Exhibits List's groups under the AI sort (Sam, 2026-11-01: "it would be helpful to establish the groups and be
// able to move exhibits out and into more appropriate groups where needed ... See the 832 arrest group and notice there
// are exhibits that should be moved and a way to do it easily from this view"). Guards:
//   (1) every run of rows has its band: a title alone sits under "Not in a group", never under the group before it
//       (the 832 Arrest screenshot: AAG, ABA and Abutments read as members of a group of two);
//   (2) a group's band says what it holds across its titles (titles, colleges, statewide basis);
//   (3) ticking rows opens the move bar under the table; Move writes one exhibit_group row per title in one request,
//       and the titles join that group; a group a move empties to one title stops being a group;
//   (4) Keep this group saves every title's group under the name in the box; a rename carries the group; a kept group
//       says so and offers Rename and Release;
//   (5) a new name starts a group, kept even with one title;
//   (6) Out of every group writes _NO_GROUP; Back to the AI sort writes "" and the title returns to the night's group;
//   (7) Release hands a kept group's titles back to the AI sort;
//   (8) saved groups load from the store and hold over the night's order;
//   (9) a refused save changes nothing on screen and says so.
// Run from repo root: `npm test` (or `node tests/exhibits_list_groups.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const src = fs.readFileSync("exhibits.js", "utf8");

function cred(ut, colleges) {
  return { ut: ut, issuer: "", cpl_types: [], disc_modal: "", raw_count: 1,
    articulations: colleges.length ? [{ cid: "ADMJ M1001", sys: "M-ID", local: [{ colleges: colleges }] }] : [] };
}
const CREDREF = { _generated_at: "2026-11-01T05:19:00+00:00", unified_titles: [
  cred("P.C. 832 Arrest and Control Certification", ["Norco College", "Bakersfield College"]),
  cred("PC 832 Arrest and Firearms Training", ["Modesto Junior College"]),
  cred("AAG Industry Recognized", []),
  cred("ABA Bank Management", ["Norco College"]),
  cred("Report Writing for Peace Officers", ["Norco College"]),
  cred("Police Work Experience", []),
  cred("Nursing Work Experience", []),
  cred("Zoology Field Survey", [])
] };
const AISORT = { schema: 1, _reference_generated_at: "2026-11-01T05:19:00+00:00",
  groups: [{ name: "832 Arrest", n: 2 }, { name: "AAG Industry Recognized", n: 1 }, { name: "ABA Bank Management", n: 1 },
    { name: "Report Writing Peace Officers", n: 1 }, { name: "Work Experience", n: 2 }],
  order: { "P.C. 832 Arrest and Control Certification": [0, 0], "PC 832 Arrest and Firearms Training": [0, 1],
    "AAG Industry Recognized": [1, 2], "ABA Bank Management": [2, 3], "Report Writing for Peace Officers": [3, 4],
    "Police Work Experience": [4, 5], "Nursing Work Experience": [4, 6] },
  counts: {}, suggest: {} };
let OVERLAY_ROWS = [];
let POST_OK = true;

function load() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/#exhibits/list", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null });
    const ok = function (o) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(o))); } }); };
    if (url === "kb/exhibits_review.json") return ok({ schema: 1, written_at: "2026-11-01T05:22:00Z", sources: {}, tiles: {}, steps: {}, colleges: [], held: [] });
    if (url === "kb/exhibits_ai_sort.json") return ok(AISORT);
    if (/\/rest\/v1\/kb_curation/.test(url) && (init.method || "GET") === "GET") return ok(/exhibit_group/.test(url) ? OVERLAY_ROWS : []);
    if (/\/rest\/v1\/kb_curation/.test(url)) return Promise.resolve({ ok: POST_OK, status: POST_OK ? 201 : 500, json: function () { return Promise.resolve(null); } });
    return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } });
  };
  const sess = { access_token: "a.b.c", email: "sam@example.org" };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(sess); },
    authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; } };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "credential_reference_data.js") w[name] = JSON.parse(JSON.stringify(CREDREF));
    if (s === "fact-sheet/statewide_recs.js") w[name] = { "PC 832 Arrest and Firearms Training": [{ t: "Arrest", u: "3", id: "MAPICI-ADMJ-1-001" }] };
    setTimeout(cb, 0); } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, calls: calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 12; i++) await tick(); }
function seq(d) {
  return Array.from(d.querySelectorAll(".exh-l-table tbody tr:not(.exh-l-editrow)")).map((r) =>
    r.classList.contains("exh-l-band") ? "band:" + txt(r.querySelector("th > span")) : txt(r.children[2]).slice(0, 12));
}
function band(d, name) {
  return Array.from(d.querySelectorAll(".exh-l-band th")).find((th) => txt(th.querySelector("span")) === name);
}
function btn(root, t) { return Array.from(root.querySelectorAll("button")).find((b) => txt(b) === t); }
function select(t, title) {
  const box = t.d.querySelector('input[aria-label="Select ' + title + '"]');
  box.checked = true; box.dispatchEvent(new t.w.Event("change"));
}
function posts(t, from) { return t.calls.filter((c) => c.method === "POST").slice(from); }
function nPosts(t) { return t.calls.filter((c) => c.method === "POST").length; }

(async function () {
  const t = load();
  await t.M.boot(); await settle();
  t.d.getElementById("exh-l-ai").click(); await settle();
  let s = seq(t.d);
  check("(1) ⭐ a title alone sits under Not in a group, never under the group before it",
    s.join("|") === "band:832 Arrest|P.C. 832 Arr|PC 832 Arres|band:Not in a group|AAG Industry|ABA Bank Man|Report Writi"
      + "|band:Work Experience|Police Work |Nursing Work|band:Added since the AI sort was built|Zoology Fiel", s.join(" | "));
  check("(1) each band is a th scope=rowgroup", t.d.querySelectorAll(".exh-l-band th[scope='rowgroup']").length === t.d.querySelectorAll(".exh-l-band").length);
  check("(2) a group's band counts its titles, their colleges and the statewide basis",
    /2 in this group, 3 colleges, 1 based on statewide/.test(txt(band(t.d, "832 Arrest"))), txt(band(t.d, "832 Arrest")));
  check("(3) no move bar until a row is ticked", !t.d.querySelector(".exh-l-move"));

  select(t, "Report Writing for Peace Officers"); await settle();
  select(t, "Police Work Experience"); await settle();
  const bar = t.d.querySelector(".exh-l-move");
  check("(3) ticking rows opens the move bar under the table, labelled, its box tied to a label",
    !!bar && bar.getAttribute("role") === "group" && /Move the 2 selected titles/.test(bar.getAttribute("aria-label"))
    && !!t.d.querySelector('label[for="exh-l-moveto"]') && !!(t.d.querySelector(".exh-l-wrap").compareDocumentPosition(bar) & 4));
  const opts = Array.from(t.d.querySelectorAll("#exh-l-gnames option")).map((o) => o.value);
  check("(3) the box offers every group by name, not the titles alone", opts.join("|") === "832 Arrest|Work Experience", opts.join("|"));
  const box = t.d.getElementById("exh-l-moveto");
  box.value = "832 Arrest"; box.dispatchEvent(new t.w.Event("input"));
  let n0 = nPosts(t);
  btn(bar, "Move").click(); await settle();
  let p = posts(t, n0);
  check("(3) ⭐ Move writes one exhibit_group row per title, in one request",
    p.length === 1 && Array.isArray(p[0].body) && p[0].body.length === 2
    && p[0].body.every((r) => r.field === "exhibit_group" && r.value === "832 Arrest" && r.reviewer_email === "sam@example.org")
    && p[0].body.map((r) => r.course_id).sort().join("|") === "_CREDENTIAL_REVIEW::Police Work Experience|_CREDENTIAL_REVIEW::Report Writing for Peace Officers",
    JSON.stringify(p.map((x) => x.body)));
  s = seq(t.d);
  check("(3) the titles join the group in the night's order, and the group a move left with one title is no longer one",
    s.slice(0, 5).join("|") === "band:832 Arrest|P.C. 832 Arr|PC 832 Arres|Report Writi|Police Work " && s.indexOf("band:Work Experience") === -1
    && s.indexOf("Nursing Work") > s.lastIndexOf("band:Not in a group"), s.join(" | "));
  check("(3) the band counts the kept titles; the selection clears; the note says what moved",
    /4 in this group, .*; 2 kept/.test(txt(band(t.d, "832 Arrest"))) && !t.d.querySelector(".exh-l-move")
    && /Moved 2 titles to 832 Arrest/.test(txt(t.d.getElementById("exh-l-cellnote"))), txt(band(t.d, "832 Arrest")));

  btn(band(t.d, "832 Arrest"), "Keep this group").click(); await settle();
  const gname = t.d.getElementById("exh-l-gname");
  check("(4) Keep this group opens its name in a box, focused", !!gname && gname.value === "832 Arrest" && t.d.activeElement === gname);
  gname.value = "PC 832";
  n0 = nPosts(t);
  btn(gname.parentNode, "Keep under this name").click(); await settle();
  p = posts(t, n0);
  check("(4) ⭐ every title in the group saves the name in the box",
    p.length === 1 && p[0].body.length === 4 && p[0].body.every((r) => r.field === "exhibit_group" && r.value === "PC 832"), JSON.stringify(p.map((x) => x.body)));
  const kept = band(t.d, "PC 832");
  check("(4) a kept group says so and offers Rename and Release",
    !!kept && /4 in this group, .*; kept$/.test(txt(kept.querySelector(".exh-muted"))) && !!btn(kept, "Rename") && !!btn(kept, "Release") && !band(t.d, "832 Arrest"),
    kept && txt(kept));

  select(t, "AAG Industry Recognized"); await settle();
  const box2 = t.d.getElementById("exh-l-moveto");
  box2.value = "Banking"; box2.dispatchEvent(new t.w.Event("input"));
  btn(t.d.querySelector(".exh-l-move"), "Move").click(); await settle();
  check("(5) a new name starts a group, kept with one title", /1 in this group, .*; kept/.test(txt(band(t.d, "Banking"))), txt(band(t.d, "Banking")));

  select(t, "Police Work Experience"); await settle();
  n0 = nPosts(t);
  btn(t.d.querySelector(".exh-l-move"), "Out of every group").click(); await settle();
  p = posts(t, n0);
  s = seq(t.d);
  const pol = s.indexOf("Police Work ");
  check("(6) ⭐ Out of every group writes _NO_GROUP and the title stands alone",
    p.length === 1 && p[0].body[0].value === "_NO_GROUP" && s.slice(0, pol).lastIndexOf("band:Not in a group") > s.slice(0, pol).lastIndexOf("band:PC 832")
    && /3 in this group/.test(txt(band(t.d, "PC 832"))), s.join(" | "));
  select(t, "Police Work Experience"); await settle();
  const back = btn(t.d.querySelector(".exh-l-move"), "Back to the AI sort");
  n0 = nPosts(t);
  back.click(); await settle();
  p = posts(t, n0);
  check("(6) Back to the AI sort writes \"\" and the title returns to the night's group",
    !!back && p.length === 1 && p[0].body[0].value === "" && /2 in this group/.test(txt(band(t.d, "Work Experience"))), seq(t.d).join(" | "));

  n0 = nPosts(t);
  btn(band(t.d, "PC 832"), "Release").click(); await settle();
  p = posts(t, n0);
  s = seq(t.d);
  check("(7) ⭐ Release hands the kept titles back to the AI sort",
    p.length === 1 && p[0].body.length === 3 && p[0].body.every((r) => r.value === "") && !band(t.d, "PC 832")
    && s.slice(0, 3).join("|") === "band:832 Arrest|P.C. 832 Arr|PC 832 Arres", s.join(" | "));

  OVERLAY_ROWS = [{ course_id: "_CREDENTIAL_REVIEW::Report Writing for Peace Officers", field: "exhibit_group", value: "PC 832" },
    { course_id: "_CREDENTIAL_REVIEW::P.C. 832 Arrest and Control Certification", field: "exhibit_group", value: "PC 832" },
    { course_id: "_CREDENTIAL_REVIEW::ABA Bank Management", field: "exhibit_group", value: "_NO_GROUP" }];
  const u = load();
  await u.M.boot(); await settle();
  u.d.getElementById("exh-l-ai").click(); await settle();
  const getUrl = u.calls.find((c) => c.method === "GET" && /_CREDENTIAL_REVIEW/.test(decodeURIComponent(c.url)));
  check("(8) the overlay read names exhibit_group", !!getUrl && /exhibit_group/.test(getUrl.url));
  check("(8) ⭐ saved groups hold over the night's order",
    /2 in this group, .*; kept/.test(txt(band(u.d, "PC 832"))) && !band(u.d, "832 Arrest")
    && seq(u.d).indexOf("ABA Bank Man") > -1 && seq(u.d).slice(0, seq(u.d).indexOf("ABA Bank Man")).filter((x) => /^band:/.test(x)).pop() === "band:Not in a group",
    seq(u.d).join(" | "));

  POST_OK = false;
  select(u, "Zoology Field Survey"); await settle();
  const box3 = u.d.getElementById("exh-l-moveto");
  box3.value = "Field Work"; box3.dispatchEvent(new u.w.Event("input"));
  btn(u.d.querySelector(".exh-l-move"), "Move").click(); await settle();
  check("(9) a refused save changes nothing and says so",
    !band(u.d, "Field Work") && /did not save \(HTTP 500\)/.test(txt(u.d.getElementById("exh-l-cellnote"))) && !!u.d.querySelector(".exh-l-move"),
    txt(u.d.getElementById("exh-l-cellnote")));
  POST_OK = true;

  let pass = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
  console.log("\n" + pass + "/" + results.length + " passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
