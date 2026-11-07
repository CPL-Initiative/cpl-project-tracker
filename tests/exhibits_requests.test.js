// The Exhibits tab's Requests view (SkyLoop, 2026-11-06): the public's asks to prioritize a credential's review, as Sam
// ruled on Open Asks Sheet 162 ("a public request to prioritize review of a credential ... without promising any one
// person that we would evaluate their credential"). The Credential Catalog writes credential_priority_requests through
// one INSERT-only function; this view reads the rows behind the team phrase or a reviewer sign-in. These checks pin:
//   - the views row names Requests with the count still new; the Progress view lists the count as an item that opens it;
//   - the view groups rows by credential, most asked first, names the colleges a requester named (or Statewide only),
//     counts the emails left without showing one, and dates the first and last ask;
//   - #exhibits/requests opens it and the address reads back; a failed read says so; signed out with no phrase the
//     read is sent with the session's headers and an empty answer reads as nothing to show;
//   - the record around it: Governance maps the table and the write to DR-31 and dismisses the counts read with its reason.
//
// Run from repo root: `npm test` (or `node tests/exhibits_requests.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

// ── static ──
const src = fs.readFileSync("exhibits.js", "utf8");
const gov = JSON.parse(fs.readFileSync("kb/governance_surface_map.json", "utf8"));
const reg = JSON.parse(fs.readFileSync("kb/governance_register.json", "utf8"));
check("Governance maps the table and the write to DR-31, and DR-31 exists", gov.mapped["table:credential_priority_requests"] === "DR-31"
  && gov.mapped["rpc:credential_priority_request"] === "DR-31" && reg.decision_rights.some((d) => d.id === "DR-31" && /prioritize/.test(d.element)));
check("the counts read is dismissed with its privacy reason", /aggregate|count/.test(gov.dismissed["rpc:credential_priority_counts"] || "") && /email/.test(gov.dismissed["rpc:credential_priority_counts"] || ""));
check("the tab reads the table, never a service key, and never writes it", /\/rest\/v1\/credential_priority_requests\?select=/.test(src) && src.indexOf("service_role") === -1
  && !/credential_priority_requests[^\n]*method: "(POST|PATCH|DELETE)"/.test(src));
check("the migration grants anon no insert on the table and opens only the two functions", (function () {
  const sql = fs.readFileSync("kb/migrations/2026-11-06_credential_priority_requests.sql", "utf8");
  return /revoke all on public\.credential_priority_requests from anon, authenticated;\s*grant select on public\.credential_priority_requests to anon, authenticated;/.test(sql)
    && /grant execute on function public\.credential_priority_request\(text, text, text, text, text, text\) to anon, authenticated, service_role/.test(sql)
    && /grant execute on function public\.credential_priority_counts\(\) to anon, authenticated, service_role/.test(sql)
    && !/create policy [^\n]* for insert/.test(sql);
})());

// ── fixtures ──
const REVIEW = { schema: 1, written_at: "2026-11-01T07:50:00Z", sources: { procedures_run: "2026-11-01T07:47:00Z" },
  tiles: { names: { n: 10, of: 12, waiting: 2 }, aligned: { n: 1, of: 2 }, saved_not_folded: 0 }, steps: {}, colleges: [],
  held: [{ raw: "Held one", step: "Proposed", title: "Held One", issuer: "", ids: ["X-1"], art: [0], could: [], under: [], under_count: 0, exists: false }] };
function rows() {
  return [
    { credential: "CompTIA Security+", issuer: "CompTIA", college: "Alpha College", email: "a@example.edu", note: null, source: "catalog", status: "new", created_at: "2026-11-06T17:00:00Z" },
    { credential: "comptia security+", issuer: "CompTIA", college: null, email: null, note: null, source: "catalog", status: "new", created_at: "2026-11-06T16:30:00Z" },
    { credential: "CompTIA Security+", issuer: null, college: "Beta College", email: "b@example.edu", note: null, source: "catalog", status: "noted", created_at: "2026-11-05T09:00:00Z" },
    { credential: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", college: null, email: null, note: null, source: "catalog", status: "new", created_at: "2026-11-06T12:00:00Z" },
  ];
}
function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/" + (opts.hash || "#exhibits"), runScripts: "dangerously" });
  const w = dom.window;
  const calls = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET", headers: init.headers || {} });
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    function bad(status) { return Promise.resolve({ ok: false, status: status, json: function () { return Promise.resolve({}); } }); }
    if (url === "kb/exhibits_review.json") return ok(REVIEW);
    if (/\/rest\/v1\/credential_priority_requests/.test(url)) return opts.pqFail ? bad(503) : ok(opts.pq || rows());
    if (/\/rest\/v1\/rpc\/exhibit_title_students$/.test(url)) return ok([]);
    if (/\/rest\/v1\/kb_curation/.test(url) && (init.method || "GET") === "GET") return ok([]);
    return bad(404);
  };
  const sess = opts.signedIn ? { access_token: "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccc", email: "reviewer@example.org" } : null;
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(sess); },
    authHeaders: function (extra) { const h = { apikey: "anon-key", Authorization: "Bearer anon-key" }; if (extra) for (const k in extra) h[k] = extra[k]; return h; },
    viewAddress: function (tab, fn) { w.__addr = fn; } };
  w.CPL_TEAM_PHRASE = { decorateHeaders: function (h) { h["x-team-pass"] = "the-phrase"; return h; } };
  w.cplCollegeShort = function (n) { return n.replace(/ College$/, ""); };
  // The Progress view is drawn by the Commons' shared renderer, loaded as COBI loads it.
  w.CPL_TABS = { loadScript: function (file, name, cb) {
    if (file === "commons_page.js") { const e = w.document.createElement("script"); e.textContent = fs.readFileSync("commons_page.js", "utf8"); w.document.body.appendChild(e); }
    setTimeout(cb, 0);
  } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, calls: calls };
}
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
async function settle() { for (let i = 0; i < 8; i++) await tick(); }
function viewBtn(d, name) { return Array.from(d.querySelectorAll(".exh-views button")).find(function (b) { return txt(b).indexOf(name) === 0; }); }

(async function () {
  // The view, from the views row.
  let t = load();
  await t.M.boot(); await settle();
  const vb = viewBtn(t.d, "Requests");
  check("the views row names Requests", !!vb);
  vb.click(); await settle();
  check("Requests is current and counts the asks still new (3)", /^Requests/.test(txt(t.d.querySelector('.exh-views [aria-current="page"]')))
    && txt(t.d.querySelector('.exh-views [aria-current="page"] .exh-n')) === "3");
  const read = t.calls.find((c) => /credential_priority_requests/.test(c.url));
  check("the read carries the session's headers, the phrase and a Range", read && read.headers.apikey === "anon-key" && read.headers["x-team-pass"] === "the-phrase" && read.headers.Range === "0-999");
  check("the address reads exhibits/requests", t.w.__addr && t.w.__addr() === "exhibits/requests");
  const h3 = t.d.getElementById("exh-pq-h");
  check("the heading counts rows and credentials", txt(h3) === "Requests by credential (4 on 2 credentials)");
  const trs = Array.from(t.d.querySelectorAll(".exh-pq tbody tr"));
  check("grouped by credential, case folded, most asked first", trs.length === 2 && /^CompTIA Security\+/.test(txt(trs[0].querySelector("th"))) && /^AWS Certified Cloud Practitioner/.test(txt(trs[1].querySelector("th"))));
  const c0 = Array.from(trs[0].querySelectorAll("td")).map(txt);
  check("the Security+ line: 3 asks (2 new), the two colleges named, 2 emails counted, first and last dated", c0[0] === "3 (2 new)" && c0[1] === "Alpha, Beta" && c0[2] === "2" && /2026/.test(c0[3]) && /2026/.test(c0[4]));
  const c1 = Array.from(trs[1].querySelectorAll("td")).map(txt);
  check("the AWS line: 1 ask, Statewide only, no email, one date", c1[0] === "1" && c1[1] === "Statewide only" && c1[2] === "0" && c1[4] === "");
  check("no email address is printed", !/@example\.edu/.test(txt(t.d.getElementById("exhibits-root"))));
  check("the view says what a request is and is not", /promises no one an evaluation/.test(txt(t.d.querySelector(".exh-wrap"))) && /no reply is owed/.test(txt(t.d.querySelector(".exh-wrap"))));
  check("the table sits in a labeled region with row and column headers", t.d.querySelector('.exh-tblwrap[role="region"][aria-label]')
    && t.d.querySelectorAll('.exh-pq th[scope="col"]').length === 6 && t.d.querySelectorAll('.exh-pq th[scope="row"]').length === 2);

  // The Progress view lists the count as an item that opens the view.
  t = load({ hash: "#exhibits/progress" });
  await t.M.boot(); await settle(); await settle(); await settle();
  const item = Array.from(t.d.querySelectorAll("li, p, div")).find((e) => /public requests to prioritize a credential/.test(txt(e)) && /Read them/.test(txt(e)) && !e.querySelector("div, li"));
  check("Progress lists the public requests with their count and Read them", !!item && /3/.test(txt(item)));

  // The route.
  t = load({ hash: "#exhibits/requests" });
  await t.M.boot(); await settle();
  check("#exhibits/requests opens the view", /^Requests/.test(txt(t.d.querySelector('.exh-views [aria-current="page"]'))) && !!t.d.getElementById("exh-pq-h"));

  // A failed read says so; an empty answer reads as nothing to show.
  t = load({ hash: "#exhibits/requests", pqFail: true });
  await t.M.boot(); await settle();
  check("a failed read says so", /could not be read \(HTTP 503\)/.test(txt(t.d.querySelector(".exh-empty"))));
  t = load({ hash: "#exhibits/requests", pq: [] });
  await t.M.boot(); await settle();
  check("an empty answer reads as nothing to show, behind the phrase", /No requests to show/.test(txt(t.d.querySelector(".exh-empty"))) && /team phrase/.test(txt(t.d.querySelector(".exh-empty"))));

  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); });
  console.log((results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
