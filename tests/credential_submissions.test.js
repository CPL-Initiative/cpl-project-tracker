// Add your credential (SkyHarbor, 2026-11-06; Sam: "yes, build the add your credential route"; DR-32).
//
// The public Credential Catalog (library/adopt/) offers Add it when its search finds nothing; the form writes
// credential_submissions through one INSERT-only function; nothing shows until a signed-in reviewer verifies it in the
// Exhibits tab's Requests view; a verified one joins the Catalog as Not yet evaluated with its asks counted. Pins:
//   - the migration: no API role inserts or updates the table; the add and the verified read are the public's two doors;
//     the decision is a reviewer's (is_allowed_reviewer, granted to authenticated, never anon) and keeps the prior state
//     in history; the verified read returns verified rows only and no college, email or note; each function is closed
//     to PUBLIC, anon and authenticated before its grant (Rule 10 b2);
//   - the record around it: Governance maps the table, the add and the decision to DR-32, dismisses the read with its
//     reason, and DR-32 exists;
//   - the Catalog: a search that finds nothing in any status offers Add it with the words; the form opens with them filled
//     in and the picked college; a bad link is refused before any post; the post carries the fields; an already-added
//     credential counts as a request to prioritize instead; a verified submission joins as Not yet evaluated, one already
//     held is skipped, and its asks paint;
//   - the Requests view: the added credentials listed newest first with their link and decision; no email printed;
//     Verify posts the decision; a refused decision asks for a reviewer sign-in; Merge asks for the credential it merges
//     into; the views row counts the waiting ones.
//
// Run from repo root: `npm test` (or `node tests/credential_submissions.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 30));

// ── the migration and the record ──
const SQL = fs.readFileSync("kb/migrations/2026-11-06_credential_submissions.sql", "utf8");
const RB = fs.readFileSync("kb/migrations/2026-11-06_credential_submissions_rollback.sql", "utf8");
check("no API role inserts, updates or deletes the table; the team policy reads", /revoke all on public\.credential_submissions from anon, authenticated;\s*grant select on public\.credential_submissions to anon, authenticated;/.test(SQL)
  && !/grant [^;]*(insert|update|delete)[^;]* on public\.credential_submissions to [^;]*(anon|authenticated)/.test(SQL)
  && !/create policy [^\n]* for (insert|update|delete|all)/.test(SQL) && /team_pass_ok\(\) or public\.is_allowed_reviewer\(\)/.test(SQL));
check("each function is closed to public, anon and authenticated before its grant", ["credential_submission_add(text, text, text, text, text, text, text)",
  "credential_submission_decide(uuid, text, text, text)", "credential_submissions_verified()"].every((f) =>
  SQL.indexOf("revoke all on function public." + f + " from public, anon, authenticated;") >= 0 && SQL.indexOf("grant execute on function public." + f + " to ") >= 0));
check("the add is the public's, INSERT-only, validated", /grant execute on function public\.credential_submission_add\([^)]*\) to anon, authenticated, service_role/.test(SQL)
  && /insert into public\.credential_submissions/.test(SQL) && /'license', 'certification', 'badge'/.test(SQL) && /\^https\?:\/\//.test(SQL));
check("the decision is a reviewer's, never anon's, and keeps the prior state", /if not public\.is_allowed_reviewer\(\) then/.test(SQL)
  && /grant execute on function public\.credential_submission_decide\(uuid, text, text, text\) to authenticated, service_role;/.test(SQL)
  && /set history = history \|\| jsonb_build_array/.test(SQL));
(function () {
  const body = SQL.slice(SQL.indexOf("create or replace function public.credential_submissions_verified"));
  check("the verified read returns verified rows only and nothing a visitor typed about themselves",
    /where s\.status = 'verified'/.test(body) && /returns table \(name text, issuer text, kind text, link text, asks bigint\)/.test(body)
    && !/s\.(college|email|note)/.test(body));
})();
check("the rollback drops the three functions and the table", /drop function if exists public\.credential_submissions_verified\(\)/.test(RB)
  && /drop function if exists public\.credential_submission_decide/.test(RB) && /drop function if exists public\.credential_submission_add/.test(RB)
  && /drop table if exists public\.credential_submissions;/.test(RB));
const gov = JSON.parse(fs.readFileSync("kb/governance_surface_map.json", "utf8"));
const reg = JSON.parse(fs.readFileSync("kb/governance_register.json", "utf8"));
check("Governance maps the table, the add and the decision to DR-32, and DR-32 exists", ["table:credential_submissions", "rpc:credential_submission_add",
  "rpc:credential_submission_decide"].every((k) => gov.mapped[k] === "DR-32") && reg.decision_rights.some((d) => d.id === "DR-32" && /add your credential/i.test(d.decides)));
check("the verified read is dismissed with its reason", /verified/.test(gov.dismissed["rpc:credential_submissions_verified"] || "") && /email/.test(gov.dismissed["rpc:credential_submissions_verified"] || ""));

// ── the Catalog ──
const PAGE = fs.readFileSync("library/adopt/index.html", "utf8");
const JS = fs.readFileSync("library/adopt/adopt.js", "utf8");
const DATA = { written_at: "2026-11-06T12:00:00Z", counts: { settled: 1 }, colleges: [["Alpha College", "Alpha", "Alpha CCD", "Bay Area (Region 3)", "B"]],
  sectors: { "11": "Computer Sciences" }, types: ["Industry Certification"],
  credentials: [{ t: "CompTIA Security+", i: "CompTIA", y: [0], s: "11", p: 3, a: [[0, 3, "CIS 75"]], m: [["MAP-A", 0, ""]] }], review: [] };
const MORE = { held: [], harvested: [{ t: "AWS Certified Cloud Practitioner", i: "Amazon Web Services", k: "certification", s: "11", src: ["iss"] }] };
const VERIFIED = [
  { name: "Life Agent License", issuer: "California Department of Insurance", kind: "license", link: "https://www.insurance.ca.gov/license", asks: 4 },
  { name: "aws certified cloud practitioner", issuer: "Amazon Web Services", kind: "certification", link: "https://aws.example/ccp", asks: 9 },
];
function loadCatalog(opts) {
  opts = opts || {};
  const posts = [];
  const dom = new JSDOM(PAGE, { url: "https://cpl-initiative.github.io/cpl-project-tracker/library/adopt/" + (opts.query || ""), runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  w.Element.prototype.scrollIntoView = function () {};
  w.requestAnimationFrame = (f) => setTimeout(f, 0);
  function ok(v) { return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(v))) }); }
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    if (/credential_priority_counts/.test(url)) return ok([]);
    if (/credential_submissions_verified/.test(url)) return ok(opts.verified || []);
    if (/credential_submission_add/.test(url) || /credential_priority_request/.test(url)) {
      posts.push({ url: url, body: JSON.parse(init.body), headers: init.headers });
      return ok(/credential_submission_add/.test(url) ? (opts.addReply === undefined ? true : opts.addReply) : 1);
    }
    if (/adopt_more/.test(url)) return ok(MORE);
    if (/adopt_ai|adopt_align/.test(url)) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return ok(DATA);
  };
  w.eval(JS);
  return new Promise((res) => setTimeout(() => res({ w: w, d: w.document, posts: posts }), 80));
}
function search(t, words) { const q = t.d.getElementById("ad-q"); q.value = words; q.dispatchEvent(new t.w.Event("input")); return tick(250); }

// ── the Requests view ──
const EXH = fs.readFileSync("exhibits.js", "utf8");
const REVIEW = { schema: 1, written_at: "2026-11-01T07:50:00Z", sources: {}, tiles: { names: { n: 1, of: 1, waiting: 0 }, aligned: { n: 0, of: 0 }, saved_not_folded: 0 },
  steps: {}, colleges: [], held: [] };
function subs() {
  return [
    { id: "11111111-1111-1111-1111-111111111111", created_at: "2026-11-06T22:00:00Z", name: "Life Agent License", issuer: "California Department of Insurance",
      kind: "license", link: "https://www.insurance.ca.gov/license", college: "Pierce College", email: "ao@example.edu", note: null, status: "new" },
    { id: "22222222-2222-2222-2222-222222222222", created_at: "2026-11-05T22:00:00Z", name: "Old Badge", issuer: "Someone", kind: "badge",
      link: "https://badge.example/x", college: null, email: null, note: null, status: "declined", decided_by: "reviewer@example.org", decided_at: "2026-11-06T01:00:00Z" },
  ];
}
function loadExhibits(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/#exhibits/requests", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET", body: init.body || null });
    function ok(o) { return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(o))) }); }
    if (url === "kb/exhibits_review.json") return ok(REVIEW);
    if (/\/rest\/v1\/credential_priority_requests/.test(url)) return ok([]);
    if (/\/rest\/v1\/credential_submissions\?/.test(url)) return ok(opts.rows || subs());
    if (/\/rest\/v1\/rpc\/credential_submission_decide$/.test(url)) {
      if (opts.refuse) return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({ message: "a reviewer sign-in decides a submission" }) });
      return ok(JSON.parse(init.body).p_decision === "verify" ? "verified" : "merged");
    }
    if (/\/rest\/v1\/kb_curation/.test(url)) return ok([]);
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  };
  const sess = { access_token: "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccc", email: "reviewer@example.org" };
  w.CPL_SESSION = { ensureFresh: () => Promise.resolve(sess), viewAddress: function () {},
    authHeaders: function (extra) { const h = { apikey: "anon-key", Authorization: "Bearer anon-key" }; if (extra) for (const k in extra) h[k] = extra[k]; return h; } };
  w.CPL_TEAM_PHRASE = { decorateHeaders: (h) => h };
  w.CPL_TABS = { loadScript: function (f, n, cb) { setTimeout(cb, 0); } };
  const s = w.document.createElement("script"); s.textContent = EXH; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, calls: calls };
}
async function settle() { for (let i = 0; i < 10; i++) await tick(0); }
function btn(root, label) { return Array.from(root.querySelectorAll("button")).find((b) => txt(b) === label); }

(async function () {
  // The offer.
  let t = await loadCatalog();
  await search(t, "life agent");
  const offer = t.d.getElementById("ad-add");
  check("a search that finds nothing offers Add it with the words", offer && !offer.hidden && /life agent/.test(txt(offer)) && !!offer.querySelector("[data-add]"));
  await search(t, "aws");
  check("a search that finds it under another status offers nothing", offer.hidden);
  await search(t, "security");
  check("a search that finds it offers nothing", offer.hidden);

  // The form.
  await search(t, "life agent");
  t.d.querySelector("#ad-add [data-add]").click();
  const form = t.d.getElementById("pn-add-form");
  check("Add it opens the form in the panel with the search words filled in", form && t.d.getElementById("ad-panel").classList.contains("open")
    && t.d.getElementById("pn-add-name").value === "life agent" && txt(t.d.getElementById("pn-kicker")) === "Add a credential");
  check("each field has its label, and the kind is a labeled group", ["pn-add-name", "pn-add-issuer", "pn-add-link", "pn-add-college", "pn-add-email"].every((id) => t.d.querySelector('label[for="' + id + '"]'))
    && form.querySelectorAll("fieldset legend").length === 1 && form.querySelectorAll('input[name=kind]').length === 3);
  check("the form says the team checks it and no reply is sent", /team checks it/.test(txt(t.d.getElementById("pn-body"))) && /no reply/.test(txt(t.d.getElementById("pn-body"))));
  t.d.getElementById("pn-add-issuer").value = "California Department of Insurance";
  t.d.getElementById("pn-add-link").value = "not a link";
  form.dispatchEvent(new t.w.Event("submit", { cancelable: true, bubbles: true }));
  await tick();
  check("a bad link is refused before any post", t.posts.length === 0 && /https:\/\//.test(txt(t.d.getElementById("pn-add-msg"))));
  t.d.getElementById("pn-add-link").value = "https://www.insurance.ca.gov/license";
  form.querySelector('input[value="license"]').checked = true;
  t.d.getElementById("pn-add-email").value = "ao@example.edu";
  form.dispatchEvent(new t.w.Event("submit", { cancelable: true, bubbles: true }));
  await tick(60);
  const p0 = t.posts[0];
  check("the post goes to the one add function with the anon key and the fields", p0 && /\/rpc\/credential_submission_add$/.test(p0.url) && p0.headers.apikey && p0.body.p_name === "life agent"
    && p0.body.p_issuer === "California Department of Insurance" && p0.body.p_kind === "license" && p0.body.p_link === "https://www.insurance.ca.gov/license"
    && p0.body.p_email === "ao@example.edu" && p0.body.p_college === null);
  check("the reply says the team checks it first", /Received/.test(txt(t.d.getElementById("pn-add-msg"))) && form.hidden);

  // Already added: the word counts as a request to prioritize.
  t = await loadCatalog({ addReply: false, query: "?college=Alpha%20College" });
  await search(t, "life agent");
  t.d.querySelector("#ad-add [data-add]").click();
  check("the picked college fills in", t.d.getElementById("pn-add-college").value === "Alpha College");
  t.d.getElementById("pn-add-issuer").value = "CDI"; t.d.getElementById("pn-add-link").value = "https://x.example/";
  t.d.getElementById("pn-add-form").dispatchEvent(new t.w.Event("submit", { cancelable: true, bubbles: true }));
  await tick(80);
  check("an already-added credential counts as a request to prioritize instead", t.posts.length === 2 && /credential_priority_request$/.test(t.posts[1].url)
    && t.posts[1].body.p_credential === "life agent" && /already added/.test(txt(t.d.getElementById("pn-add-msg"))));

  // Verified submissions join the Catalog.
  t = await loadCatalog({ verified: VERIFIED });
  await tick(120);
  await search(t, "life agent");
  check("a verified submission joins as Not yet evaluated, its offer gone", t.d.getElementById("ad-add").hidden
    && /1 not yet evaluated/.test(txt(t.d.getElementById("ad-other"))));
  t.d.querySelector('#ad-other [data-std="harvested"]').click();
  await tick();
  const card = t.d.querySelector("#ad-list .cred");
  check("its card names it, the issuer, Not yet evaluated and its asks", card && /Life Agent License/.test(txt(card)) && /Not yet evaluated/.test(txt(card)) && /4/.test(txt(card)));
  check("one the Catalog already holds is skipped", t.w.CPL_ADOPT && Array.from(t.d.querySelectorAll("#ad-list .cred h3")).length === 1);

  // The Requests view.
  let e = loadExhibits();
  await e.M.boot(); await settle();
  const h = e.d.getElementById("exh-cs-h");
  check("the Requests view lists the added credentials with the waiting count", h && txt(h) === "Credentials the public added (2, 1 waiting)");
  const rows = Array.from(e.d.querySelectorAll(".exh-cs tbody tr"));
  check("newest first, with its issuer, kind, link and decision", rows.length === 2 && /^Life Agent License California Department of Insurance/.test(txt(rows[0].querySelector("th")))
    && rows[0].querySelector('a[href="https://www.insurance.ca.gov/license"]') && /Waiting/.test(txt(rows[0])) && /Declined/.test(txt(rows[1])));
  check("no email is printed; whether one was left is", !/@example\.edu/.test(txt(e.d.getElementById("exhibits-root"))) && /Yes/.test(txt(rows[0])));
  check("a waiting one offers Verify, Merge, Decline; a decided one Reopen", btn(rows[0], "Verify") && btn(rows[0], "Merge") && btn(rows[0], "Decline") && btn(rows[1], "Reopen"));
  check("the views row counts the waiting one", txt(e.d.querySelector('.exh-views [aria-current="page"] .exh-n')) === "1");
  check("the table sits in a labeled region with row and column headers", e.d.querySelector('.exh-tblwrap[aria-label="Credentials the public added"]')
    && e.d.querySelectorAll('.exh-cs th[scope="col"]').length === 8 && e.d.querySelectorAll('.exh-cs th[scope="row"]').length === 2);
  btn(rows[0], "Verify").click(); await settle();
  const dec = e.calls.find((c) => /credential_submission_decide$/.test(c.url));
  check("Verify posts the decision for that row", dec && dec.method === "POST" && JSON.parse(dec.body).p_id === "11111111-1111-1111-1111-111111111111" && JSON.parse(dec.body).p_decision === "verify");
  check("and says where it goes", /Life Agent License: Verified/.test(txt(e.d.getElementById("exhibits-root"))));

  e = loadExhibits({ refuse: true });
  await e.M.boot(); await settle();
  btn(e.d.querySelector(".exh-cs tbody tr"), "Decline").click(); await settle();
  check("a refused decision asks for a reviewer sign-in", /Sign in as a reviewer to decide/.test(txt(e.d.getElementById("exhibits-root"))));

  e = loadExhibits();
  await e.M.boot(); await settle();
  btn(e.d.querySelector(".exh-cs tbody tr"), "Merge").click(); await settle();
  const into = e.d.getElementById("exh-cs-into-11111111-1111-1111-1111-111111111111");
  check("Merge asks for the credential it merges into", into && into.getAttribute("aria-label"));
  btn(e.d.querySelector(".exh-cs tbody tr"), "Merge").click(); await settle();
  check("and refuses an empty name before any post", !e.calls.some((c) => /credential_submission_decide$/.test(c.url)) && /Name the credential it merges into/.test(txt(e.d.getElementById("exhibits-root"))));
  e.d.getElementById("exh-cs-into-11111111-1111-1111-1111-111111111111").value = "Life Agent";
  btn(e.d.querySelector(".exh-cs tbody tr"), "Merge").click(); await settle();
  const m = e.calls.find((c) => /credential_submission_decide$/.test(c.url));
  check("a named merge posts it", m && JSON.parse(m.body).p_decision === "merge" && JSON.parse(m.body).p_merged_into === "Life Agent");

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0]));
  console.log((results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });
