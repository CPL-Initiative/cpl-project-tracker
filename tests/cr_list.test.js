// The Common CR Reference's List view on the Catalog Commons' shared engine (Sam, 2026-11-01: "This new list view is
// so helpful that I want one now for each of our Catalog Commons groups"). Guards:
//   (1) #cr-reference/list opens the List: the view row presses List, the engine loads through CPL_TABS.loadScript, and
//       every wording is one row, A to Z, under th scope=col headers in a labelled region, with a Flag column;
//   (2) the Reference column reads the group's decision over the builder's canonical;
//   (3) the filters narrow by group (Needs a decision, Decided, Single wording) and the finder finds a credential;
//   (4) Edit every row turns Reference into boxes; leaving one writes the group's cr_reference_decisions row the way the
//       worklist's setCanonical does (decision kept, or deferred; the group's wordings as members), and every wording of
//       the group then reads it;
//   (5) a write RLS filters (200 with no row) says it did not save and puts the value back;
//   (6) signed out, the List says so and a save asks for a sign-in without writing;
//   (7) the Reference drawer lists the group's wordings, and Confirm the group records "confirmed" with the reference kept;
//   (8) no raw hex in the List's CSS;
//   (9) your flag (Sam, 2026-11-01: "give me the flag but no find and replace"): saved flags load from kb_curation
//       (_CR_LIST::<wording>, list_flag), Your flags narrows to them, a tick writes one row with the time and an untick
//       writes "", the team phrase alone sets none and says so, a failed read says so, and there is no Find and replace.
// Run from repo root: `npm test` (or `node tests/cr_list.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const SRC = fs.readFileSync("cr_reference.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");

function member(rec, rows, colleges, extra) {
  return Object.assign({ rec: rec, topic: rec, rows: rows, screens: { level: false }, units_lo: 3, units_hi: 3, unit_word: "hour",
    credentials: [], credentials_n: 0, colleges_n: colleges, courses: [] }, extra || {});
}
const WORKLIST = { _stats: { distinct_strings: 5, total_rows: 900 }, groups: [
  { key: "community relations", canonical: "3 hours in Community Relations", canonical_source: "published_statewide", rung: 1,
    rung_why: "Published statewide recommendation", acts_automatically: true, screens_objecting: [], wordings: 2, rows: 415,
    credentials: 4, colleges: 28, courses: [], subjects: [], members: [
      member("3 hours in Community Relations", 293, 28, { credentials: ["POST Basic Academy"] }),
      member("3.0 hours in Community Relations", 122, 20)] },
  { key: "engine performance", canonical: "3 or 4 hours in Engine Performance", canonical_source: "published_statewide", rung: 5,
    rung_why: "", acts_automatically: false, screens_objecting: [], wordings: 2, rows: 66, credentials: 3, colleges: 15,
    courses: ["AUTO M1008"], subjects: [], members: [
      member("3 or 4 hours in Engine Performance", 38, 9, { courses: ["AUTO M1008"] }),
      member("5 hours in Engine Performance", 28, 8)] },
  { key: "welding", canonical: "4 hours in Welding", canonical_source: "modal", rung: 5, rung_why: "", acts_automatically: false,
    screens_objecting: [], wordings: 1, rows: 12, credentials: 1, colleges: 3, courses: [], subjects: [], members: [
      member("4 hours in Welding", 12, 3, { credentials: ["AWS Certified Welder"] })] }
] };

function tab(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-cr-reference" class="cpl-tab-pane"><div id="cr-reference-root"></div></div></body></html>',
    { url: "https://example.org/#cr-reference/list", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  if (opts.signedIn !== false) w.localStorage.setItem("cpl_team_pass", "phrase");
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url: url, method: init.method || "GET", body: body });
    const ok = (o) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(o))) });
    if (url === "kb/cr_reference_worklist.json") return ok(WORKLIST);
    if (/\/kb_curation\?select/.test(url)) return opts.flagReadFails ? Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }) : ok(opts.flags || []);
    if (/\/kb_curation$/.test(url) && init.method === "POST") return ok(body.map((r) => Object.assign({}, r)));
    if (/cr_reference_decisions\?select/.test(url)) return ok(opts.decisions || []);
    if (/cr_reference_decisions/.test(url) && init.method === "POST") return ok(opts.refuse ? [] : body.map((r) => Object.assign({}, r)));
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  };
  w.CPL_SESSION = { ensureFresh: () => Promise.resolve(opts.reviewer === false ? null : { access_token: "a.b.c", email: "sam@example.org" }) };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    calls.push({ url: "loadScript:" + s, method: "SCRIPT" });
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = LIST_SRC; w.document.body.appendChild(e); }
    setTimeout(cb, 0);
  } };
  w.eval(SRC);
  return { w: w, d: w.document, M: w.CPL_CR_REFERENCE, calls: calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 12; i++) await tick(); }
function rows(d) { return Array.from(d.querySelectorAll(".crl-table tbody tr:not(.crl-editrow):not(.crl-band)")); }
function words(d, t) { return Array.from(d.querySelectorAll("button")).find((b) => txt(b) === t); }
function posts(t) { return t.calls.filter((c) => c.method === "POST"); }

(async function () {
  const t = tab({ decisions: [{ group_key: "engine performance", decision: "deferred", canonical: "Engine Performance (3 to 5 units)",
    members: ["3 or 4 hours in Engine Performance", "5 hours in Engine Performance"], excluded: [], note: "spread" }] });
  t.M.activate(); await settle();
  const views = Array.from(t.d.querySelectorAll("button.crr-view"));
  check("(1) #cr-reference/list presses List in the view row", views.map(txt).join(",") === "Progress,Worklist,List"
    && views[2].getAttribute("aria-pressed") === "true");
  check("(1) the engine loads through CPL_TABS.loadScript", t.calls.some((c) => c.url === "loadScript:commons_list.js") && !!t.w.CPL_COMMONS_LIST);
  let got = rows(t.d).map((r) => txt(r.children[2]));
  check("(1) ⭐ every wording is one row, A to Z", got.length === 5 && got[0] === "3 hours in Community Relations" && got[4] === "5 hours in Engine Performance",
    got.join(" | "));
  const heads = Array.from(t.d.querySelectorAll(".crl-table thead tr:first-child th")).map(txt);
  check("(1) th scope=col headers in a labelled region, with a Flag column",
    t.d.querySelectorAll(".crl-table thead tr:first-child th[scope='col']").length === heads.length && !!t.d.querySelector(".crl-wrap[role='region'][aria-label]")
    && heads.indexOf("Flag") === 1 && heads.some((h) => /^Reference/.test(h)) && heads.some((h) => /^Rung/.test(h)) && heads.some((h) => /^Decision/.test(h)), heads.join(","));
  const eng = rows(t.d).find((r) => /^3 or 4 hours/.test(txt(r.children[2])));
  check("(2) the Reference column reads the decision's name over the builder's", txt(eng.children[3]) === "Engine Performance (3 to 5 units)"
    && txt(eng.children[5]) === "Deferred", txt(eng));

  words(t.d, "Decided").click(); await settle();
  check("(3) Decided shows the decided group's wordings", rows(t.d).length === 2 && rows(t.d).every((r) => /Engine/.test(txt(r))));
  words(t.d, "Single wording").click(); await settle();
  check("(3) Single wording shows the group of one", rows(t.d).length === 1 && /Welding/.test(txt(rows(t.d)[0])));
  words(t.d, "Needs a decision").click(); await settle();
  check("(3) Needs a decision leaves out the decided and the single", rows(t.d).length === 2 && rows(t.d).every((r) => /Community/.test(txt(r))));
  words(t.d, "All").click(); await settle();
  const q = t.d.getElementById("crl-find");
  q.value = "AWS Certified"; q.dispatchEvent(new t.w.Event("input")); await settle();
  check("(3) the finder finds a wording by its credential", rows(t.d).length === 1 && /Welding/.test(txt(rows(t.d)[0])));
  q.value = ""; q.dispatchEvent(new t.w.Event("input")); await settle();

  t.d.getElementById("crl-editall").click(); await settle();
  const boxes = Array.from(t.d.querySelectorAll(".crl-cellin"));
  check("(4) Edit every row puts a Reference box on every row", boxes.length === 5 && boxes.every((b) => /^Reference of /.test(b.getAttribute("aria-label"))));
  const n0 = posts(t).length;
  const box = boxes.find((b) => b.getAttribute("aria-label") === "Reference of 3.0 hours in Community Relations");
  box.value = "Community Relations (3 units)"; box.dispatchEvent(new t.w.Event("change")); await settle();
  let p = posts(t).slice(n0);
  check("(4) ⭐ leaving the box writes the group's decision row, as the worklist does",
    p.length === 1 && p[0].body.length === 1 && p[0].body[0].group_key === "community relations" && p[0].body[0].canonical === "Community Relations (3 units)"
    && p[0].body[0].decision === "deferred" && p[0].body[0].members.join("|") === "3 hours in Community Relations|3.0 hours in Community Relations",
    JSON.stringify(p.map((x) => x.body)));
  const comm = Array.from(t.d.querySelectorAll(".crl-cellin")).filter((b) => /Community Relations$/.test(b.getAttribute("aria-label")));
  check("(4) every wording of the group then reads the new reference", comm.length === 2 && comm.every((b) => b.value === "Community Relations (3 units)")
    && /its group's other wordings read it too/.test(txt(t.d.getElementById("crl-cellnote"))), comm.map((b) => b.value).join(" | "));
  const engBox = Array.from(t.d.querySelectorAll(".crl-cellin")).find((b) => b.getAttribute("aria-label") === "Reference of 5 hours in Engine Performance");
  const n1 = posts(t).length;
  engBox.value = "Engine Performance"; engBox.dispatchEvent(new t.w.Event("change")); await settle();
  p = posts(t).slice(n1);
  check("(4) a decided group keeps its decision and its note through a rename", p.length === 1 && p[0].body[0].decision === "deferred"
    && p[0].body[0].note === "spread" && p[0].body[0].canonical === "Engine Performance");

  const u = tab({ refuse: true });
  u.M.activate(); await settle();
  u.d.getElementById("crl-editall").click(); await settle();
  const ub = Array.from(u.d.querySelectorAll(".crl-cellin")).find((b) => b.getAttribute("aria-label") === "Reference of 4 hours in Welding");
  ub.value = "Welding 1"; ub.dispatchEvent(new u.w.Event("change")); await settle();
  check("(5) ⭐ a write RLS filters says it did not save and puts the value back", ub.value === "4 hours in Welding"
    && /did not save \(not saved/.test(txt(u.d.getElementById("crl-cellnote"))), txt(u.d.getElementById("crl-cellnote")));

  const v = tab({ signedIn: false });
  v.M.activate(); await settle();
  check("(6) signed out, the List says so", /You are not signed in/.test(txt(v.d.getElementById("cr-reference-root"))));
  v.d.getElementById("crl-editall").click(); await settle();
  const vb = Array.from(v.d.querySelectorAll(".crl-cellin"))[0];
  vb.value = "Something"; vb.dispatchEvent(new v.w.Event("change")); await settle();
  check("(6) a save asks for a sign-in and writes nothing", posts(v).length === 0 && /Sign in as a reviewer/.test(txt(v.d.getElementById("crl-cellnote"))));

  const x = tab();
  x.M.activate(); await settle();
  const weld = rows(x.d).find((r) => /Welding/.test(txt(r.children[2])));
  weld.children[3].querySelector("button").click(); await settle();
  const drawer = x.d.querySelector(".crl-drawer");
  check("(7) the Reference drawer lists the group's wordings", !!drawer && /resolves to 4 hours in Welding/.test(txt(drawer)) && /4 hours in Welding \(12\)/.test(txt(drawer)), txt(drawer));
  const n2 = posts(x).length;
  words(x.d, "Confirm the group").click(); await settle();
  p = posts(x).slice(n2);
  check("(7) ⭐ Confirm the group records confirmed, the reference kept", p.length === 1 && p[0].body[0].decision === "confirmed"
    && p[0].body[0].canonical === "4 hours in Welding" && p[0].body[0].group_key === "welding");
  const after = rows(x.d).find((r) => /Welding/.test(txt(r.children[2])));
  check("(7) the row then reads Confirmed", txt(after.children[5]) === "Confirmed", txt(after));
  check("(8) no raw hex in the List's CSS", !/#[0-9a-fA-F]{3,6}\b/.test(txt(x.d.getElementById("crl-css"))));

  const f = tab({ flags: [{ course_id: "_CR_LIST::4 hours in Welding", value: "2026-11-01T21:30:00Z" }] });
  f.M.activate(); await settle();
  const flagRead = f.calls.find((c) => c.method === "GET" && /\/kb_curation\?select/.test(c.url));
  const flagBox = (d, w) => d.querySelector('input[aria-label="Flag ' + w + '"]');
  check("(9) saved flags load from kb_curation by the _CR_LIST:: key and list_flag",
    !!flagRead && /course_id=like\._CR_LIST%3A%3A%25/.test(flagRead.url) && /field=eq\.list_flag/.test(flagRead.url)
    && flagBox(f.d, "4 hours in Welding").checked && !flagBox(f.d, "5 hours in Engine Performance").checked, flagRead && flagRead.url);
  words(f.d, "Your flags").click(); await settle();
  check("(9) Your flags shows only the flagged wordings", rows(f.d).length === 1 && /Welding/.test(txt(rows(f.d)[0])));
  words(f.d, "All").click(); await settle();
  const nf = posts(f).length;
  flagBox(f.d, "5 hours in Engine Performance").click(); await settle();
  let fp = posts(f).slice(nf);
  check("(9) ⭐ a tick writes one kb_curation row: the wording's key, list_flag, the time, the reviewer",
    fp.length === 1 && /\/kb_curation$/.test(fp[0].url) && fp[0].body.length === 1 && fp[0].body[0].course_id === "_CR_LIST::5 hours in Engine Performance"
    && fp[0].body[0].field === "list_flag" && /^\d{4}-\d\d-\d\dT/.test(fp[0].body[0].value) && fp[0].body[0].reviewer_email === "sam@example.org"
    && flagBox(f.d, "5 hours in Engine Performance").checked, JSON.stringify(fp.map((x) => x.body)));
  const nf2 = posts(f).length;
  flagBox(f.d, "4 hours in Welding").click(); await settle();
  fp = posts(f).slice(nf2);
  check("(9) an untick writes \"\" and the box clears", fp.length === 1 && fp[0].body[0].value === "" && !flagBox(f.d, "4 hours in Welding").checked
    && /Cleared the flag/.test(txt(f.d.getElementById("cr-reference-root"))));
  check("(9) no Find and replace on the CR List", !words(f.d, "Find and replace"));

  const g = tab({ reviewer: false });
  g.M.activate(); await settle();
  const ng = posts(g).length;
  flagBox(g.d, "4 hours in Welding").click(); await settle();
  check("(9) the team phrase alone sets no flag and says so", posts(g).length === ng && !flagBox(g.d, "4 hours in Welding").checked
    && /Sign in with a reviewer link to flag a wording/.test(txt(g.d.getElementById("cr-reference-root"))));
  const h = tab({ flagReadFails: true });
  h.M.activate(); await settle();
  check("(9) a failed flag read says so", /Your flags could not be read/.test(txt(h.d.getElementById("cr-reference-root"))));

  let pass = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
  console.log("\n" + pass + "/" + results.length + " passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
