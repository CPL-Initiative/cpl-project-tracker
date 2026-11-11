// The Exhibits List's Common SUBJ reads what the Catalog reads (Sam, in session 2026-11-11: "i notice that many
// of the exhibits don't have a subj"). The List read only M-ID articulations, so a credential the Catalog showed a
// subject for (a C-ID articulation, or a subject stored on _CREDENTIAL_REVIEW::<title>) read blank in Exhibits.
// Guards:
//   (1) a credential with only C-ID articulations is not blank in Exhibits;
//   (2) a stored subj_override (a person's, or the subject fill's) wins over the articulations, and the List asks
//       kb_curation for that field;
//   (3) the List's first subject is the Catalog's subjOf() answer on every fixture row (subjOf is lifted from
//       credential_reference.js and run beside it, so a change to one reader fails here until the other follows);
//   (4) the No Common SUBJ filter, where the Commons count opens, shows only the credentials with none.
// Run from repo root: `npm test` (or `node tests/exhibits_list_subject.test.js`).
const fs = require("fs");
const vm = require("vm");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const src = fs.readFileSync("exhibits.js", "utf8");

const CREDREF = { _generated_at: "2026-11-11T05:19:00+00:00", unified_titles: [
  { ut: "Justice Intro", issuer: "", cpl_types: [], raw_count: 1,
    articulations: [{ cid: "AJ 110", sys: "C-ID", local: [{ colleges: ["Lemoore College"] }] }] },
  { ut: "Heating and Air Conditioning", issuer: "ASE", cpl_types: ["Industry Certification"], raw_count: 1, articulations: [] },
  { ut: "Mixed Codes", issuer: "", cpl_types: [], raw_count: 1,
    articulations: [{ cid: "BUSI M10", sys: "M-ID" }, { cid: "ACCT 110", sys: "C-ID" }, { cid: "ACCT 120", sys: "C-ID" }] },
  { ut: "Overridden", issuer: "", cpl_types: [], raw_count: 1, articulations: [{ cid: "BUSI M11", sys: "M-ID" }] },
  { ut: "Nothing Yet", issuer: "", cpl_types: [], raw_count: 1, articulations: [] }
] };
const OVERLAY = [
  { course_id: "_CREDENTIAL_REVIEW::Heating and Air Conditioning", field: "subj_override", value: "AUTO", reviewed_at: "2026-11-12" },
  { course_id: "_CREDENTIAL_REVIEW::Overridden", field: "subj_override", value: "MGMT", reviewed_at: "2026-11-01" }
];

function load() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/#exhibits/list", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push(url);
    const ok = function (o) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(o))); } }); };
    if (url === "kb/exhibits_review.json") return ok({ schema: 1, written_at: "2026-11-11T05:22:00Z", sources: {}, tiles: {}, steps: {}, colleges: [], held: [] });
    if (url === "kb/exhibits_adoption.json") return ok({ schema: 1, cip_sectors: {}, colleges: [], credentials: {} });
    if (/\/rest\/v1\/kb_curation/.test(url) && /subj_override/.test(url)) return ok(OVERLAY);
    if (/\/rest\/v1\/kb_curation/.test(url)) return ok([]);
    return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } });
  };
  const sess = { access_token: "a.b.c", email: "sam@example.org" };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(sess); },
    authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; } };
  w.CPL_TABS = { loadScript: function (s, name, cb) { if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = fs.readFileSync("commons_list.js", "utf8"); w.document.body.appendChild(e); } if (s === "credential_reference_data.js") w[name] = JSON.parse(JSON.stringify(CREDREF)); setTimeout(cb, 0); } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, calls: calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 10; i++) await tick(); }
function rows(d) { return Array.from(d.querySelectorAll(".exh-l-table tbody tr:not(.exh-l-editrow)")); }

/* The Catalog's reader, lifted from credential_reference.js as written. */
function catalogSubjOf() {
  const cr = fs.readFileSync("credential_reference.js", "utf8");
  const m = /function subjOf\(r\) \{[\s\S]*?\n  \}\n/.exec(cr);
  if (!m) return null;
  const ctx = {};
  vm.runInNewContext(m[0] + "\nthis.subjOf = subjOf;", ctx);
  return ctx.subjOf;
}

(async function () {
  const t = load();
  await t.M.boot(); await settle();
  const heads = Array.from(t.d.querySelectorAll(".exh-l-table th")).map(txt);
  const col = heads.indexOf("Common SUBJ");
  check("the List has its Common SUBJ column", col > -1, heads.join(","));
  const subj = {};
  rows(t.d).forEach(function (r) { const v = txt(r.children[col]); subj[txt(r.children[2]).split("collides")[0].trim()] = v === "\u2014" ? "" : v; });
  check("(1) ⭐ a credential with only C-ID articulations is not blank in Exhibits", subj["Justice Intro"] === "AJ", JSON.stringify(subj));
  check("(2) ⭐ a stored subj_override fills a credential with no articulation (MIL7 reads AUTO)",
    subj["Heating and Air Conditioning"] === "AUTO", JSON.stringify(subj));
  check("(2) a stored subj_override wins over the articulations", subj["Overridden"] === "MGMT", JSON.stringify(subj));
  check("(2) the List asks kb_curation for subj_override", t.calls.some((u) => /kb_curation/.test(u) && /subj_override/.test(u)));
  check("(3) the modal subject leads, the rest follow", subj["Mixed Codes"] === "ACCT, BUSI", JSON.stringify(subj));
  check("a credential with no articulation and no stored subject stays blank", subj["Nothing Yet"] === "", JSON.stringify(subj));

  const nos = Array.from(t.d.querySelectorAll("button")).find((b) => txt(b).replace(/ \([\d,]+\)$/, "") === "No Common SUBJ");
  if (nos) { nos.click(); await settle(); }
  check("(4) the No Common SUBJ filter (the Commons count's address, #exhibits/list/nosubj) shows only the blank one",
    !!nos && rows(t.d).length === 1 && /Nothing Yet/.test(txt(rows(t.d)[0])), rows(t.d).map(txt).join(" | "));

  const subjOf = catalogSubjOf();
  check("(3) the Catalog's subjOf() is found in credential_reference.js", typeof subjOf === "function");
  if (typeof subjOf === "function") {
    const ov = {}; OVERLAY.forEach((r) => { ov[r.course_id.replace("_CREDENTIAL_REVIEW::", "")] = r.value; });
    const agree = CREDREF.unified_titles.every(function (r) {
      const row = JSON.parse(JSON.stringify(r));
      if (ov[r.ut]) row._subj = ov[r.ut];          // the Catalog's overlay pre-seeds subjOf's cache the same way
      return (subjOf(row) || "") === (subj[r.ut] || "").split(", ")[0];
    });
    check("(3) ⭐ the List's first subject is the Catalog's subjOf() on every row", agree, JSON.stringify(subj));
  }

  let fail = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "ok   " : "FAIL ") + n + (ok || !why ? "" : "  -- " + why)); if (!ok) fail++; });
  console.log("\n" + results.length + " checks, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
