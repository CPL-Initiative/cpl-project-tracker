// The Exhibits List's "Folds waiting for the apply" tells the truth about a saved fold (#3110 build step 2, S638).
// Sam approved 35 folds on 2026-11-11, opened the waiting filter, and every row read "Unreviewed" with no hint what to
// do: listStatus read only the frozen reference's curated_at/curated_by. Saving the decision is the review. Guards:
//   (1) a saved, unapplied fold (a title override plus a merge confirm in kb_curation) never renders "Unreviewed";
//       it reads "Saved, waiting for apply", and the Unreviewed filter leaves it out;
//   (2) a fold the reference already carries (the title is an old name of its target in kb/exhibits_related.json)
//       reads "Applied";
//   (3) the waiting view opens on one plain sentence: saved, applied without a click, leaving the list once applied;
//       no Apply button;
//   (4) a retired name that is an old name of two titles (Elementary French went to French 1 and French 2) names both.
// Run from repo root: `npm test` (or `node tests/exhibits_folds_saved_status.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const src = fs.readFileSync("exhibits.js", "utf8");

const P = "_CREDENTIAL_REVIEW::";
const CREDREF = { _generated_at: "2026-11-11T14:43:28+00:00", unified_titles: [
  // Saved and not applied: no review stamp in the reference, a fold in today's saves.
  { ut: "ASE Bundle A4 A5", issuer: "", cpl_types: ["Credit By Exam"], raw_count: 1, articulations: [] },
  // The reference already carries the fold (an old name of ASE Certificate Bundles) while the row is still drawn.
  { ut: "ASE Bundle T2 T8", issuer: "", cpl_types: ["Credit By Exam"], raw_count: 1, articulations: [] },
  { ut: "ASE Certificate Bundles", issuer: "", cpl_types: ["Industry Certification"], raw_count: 2, articulations: [] },
  // No decision, no stamp: still Unreviewed.
  { ut: "Apiary Basics", issuer: "", cpl_types: [], raw_count: 1, articulations: [] }
] };
const OVERLAY = [
  { course_id: P + "ASE Bundle A4 A5", field: "unified_title_override", value: "ASE Certificate Bundles", reviewed_at: "2026-11-11T15:26:00Z" },
  { course_id: P + "ASE Bundle A4 A5", field: "unified_title_merge_confirm", value: "ASE Certificate Bundles", reviewed_at: "2026-11-11T15:26:00Z" },
  { course_id: P + "ASE Bundle T2 T8", field: "unified_title_override", value: "ASE Certificate Bundles", reviewed_at: "2026-11-11T15:26:00Z" },
  { course_id: P + "ASE Bundle T2 T8", field: "unified_title_merge_confirm", value: "ASE Certificate Bundles", reviewed_at: "2026-11-11T15:26:00Z" }
];
const RELATED = { schema: 1, issuers: [], paths: {}, pending: {}, titles: [
  ["ASE Certificate Bundles", -1, 2, 0, 0, ["ASE Bundle T2 T8"], []],
  ["ASE Bundle A4 A5", -1, 1, 0, 0, [], []],
  ["ASE Bundle T2 T8", -1, 1, 0, 0, [], []],
  ["Apiary Basics", -1, 1, 0, 0, [], []],
  ["Elementary French 1", -1, 1, 0, 0, ["Elementary French"], []],
  ["Elementary French 2", -1, 1, 0, 0, ["Elementary French"], []]
] };

function load() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/#exhibits/list", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    const ok = function (o) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(o))); } }); };
    if (url === "kb/exhibits_review.json") return ok({ schema: 1, written_at: "2026-11-11T05:22:00Z", sources: {}, tiles: {}, steps: {}, colleges: [], held: [] });
    if (url === "kb/exhibits_related.json") return ok(RELATED);
    if (url === "kb/cred_rename_dryrun/collisions.json") return ok({ collisions: [] });
    if (/\/rest\/v1\/kb_curation/.test(url) && (init.method || "GET") === "GET")
      return ok(/unified_title_override/.test(decodeURIComponent(url)) ? OVERLAY : []);
    if (/\/rest\/v1\/kb_curation/.test(url)) return Promise.resolve({ ok: true, status: 201, json: function () { return Promise.resolve(null); } });
    return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } });
  };
  const sess = { access_token: "a.b.c", email: "sam@example.org" };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(sess); },
    authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; } };
  w.CPL_TABS = { loadScript: function (s, name, cb) { if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = fs.readFileSync("commons_list.js", "utf8"); w.document.body.appendChild(e); } if (s === "credential_reference_data.js") w[name] = JSON.parse(JSON.stringify(CREDREF)); setTimeout(cb, 0); } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 12; i++) await tick(); }
function rows(d) { return Array.from(d.querySelectorAll(".exh-l-table tbody tr:not(.exh-l-editrow)")); }
function words(d, t) { return Array.from(d.querySelectorAll("button")).find((b) => txt(b) === t || txt(b).replace(/ \([\d,]+\)$/, "") === t); }
(async function () {
  const t = load();
  await t.M.boot(); await settle();
  check("the List opens with today's saves read", t.M._state.view === "list" && t.M._state.cs.overlayOk === true);

  const f = words(t.d, "Folds waiting for the apply");
  check("the waiting filter is on the bar", !!f);
  if (f) { f.click(); await settle(); }
  const shown = rows(t.d);
  check("the waiting view lists the two saved folds", shown.length === 2, shown.map(txt).join(" | "));
  const statuses = shown.map((r) => {
    const heads = Array.from(t.d.querySelectorAll(".exh-l-table thead th")).map(txt);
    return txt(r.children[heads.indexOf("Status")]);
  });
  check("(1) ⭐ a saved, unapplied fold never renders Unreviewed", statuses.length === 2 && statuses.every((s) => !/Unreviewed/.test(s)), statuses.join(" | "));
  check("(1) the saved, unapplied fold reads Saved, waiting for apply",
    statuses.indexOf("Saved, waiting for apply") > -1, statuses.join(" | "));
  check("(2) a fold the reference already carries reads Applied", statuses.indexOf("Applied") > -1, statuses.join(" | "));

  const line = t.d.getElementById("exh-l-waitline");
  check("(3) one plain sentence opens the waiting view", !!line
    && txt(line) === "These folds are saved, the apply runs them without a click from you, and each one leaves this list once it is applied.", txt(line));
  check("(3) no Apply button", !Array.from(t.d.querySelectorAll("button")).some((b) => /^Apply\b/.test(txt(b))));

  check("(4) an old name of two titles names both, never the last one read",
    t.M._appliedTo("Elementary French") === "Elementary French 1 and Elementary French 2", t.M._appliedTo("Elementary French"));

  const u = words(t.d, "Unreviewed");
  if (u) { u.click(); await settle(); }
  const left = rows(t.d).map(txt);
  check("(1) the Unreviewed filter leaves the decided rows out", left.length === 2 && !left.some((x) => /ASE Bundle/.test(x)), left.join(" | "));
  check("(3) the waiting sentence shows only on the waiting view", !t.d.getElementById("exh-l-waitline"));

  let failed = 0;
  results.forEach(([n, ok, why]) => { if (!ok) failed++; console.log((ok ? "PASS " : "FAIL ") + n + (ok || why == null ? "" : " — " + why)); });
  console.log(failed ? failed + " failed" : "all " + results.length + " passed");
  process.exit(failed ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
