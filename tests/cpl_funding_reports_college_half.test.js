// The Reporting box's college half (S308, 2026-09-30).
//
// Sam, open-asks sheet 7 card 1 (2026-09-30 17:09Z): a person MAP lists as a
// college's CPL coordinator or primary CPL contact signs in with the reviewer
// email link and sees that college's reports on My College, read only, for
// every college MAP lists the address under.
//
//   A. cpl_funding_my_reports() — who sees what is decided in SQL, from the
//      verified session: both contact fields, split, through map_colleges on
//      both sides, closed to anon (PUBLIC *and* anon, since this project's
//      default privileges grant anon by name), no reviewer address returned.
//   B. One "newest report for a year counts" rule, shared by the reviewer's
//      box and My College (CPL_FUNDING_TAB.reports).
//   C. Governance: the new read surface is mapped to DR-09 (Rule 10 a3).
//   D. The panel says something true in every state: signed out (and the
//      team phrase alone, which is not a person), not listed, listed with no
//      report yet, and listed with reports (a correction and a withdrawal).
//      Since 2026-10-21 (Sam: "move funding to Implementation Funding") it is
//      drawn on Implementation Funding (college_briefing.js reportsPanel), and
//      My College links there.
//   E. The loader asks with the person's own token, and only with one.
//
// Windows: 6. Run from repo root: `npm test`
// (or `node tests/cpl_funding_reports_college_half.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── A. the SQL of record ─────────────────────────────────────────────────────
{
  const sql = read("funding/supabase_cpl_funding_reports.sql");
  const at = sql.indexOf("create or replace function public.cpl_funding_my_reports()");
  const fn = at === -1 ? "" : sql.slice(at, sql.indexOf("$$;", at) + 3);
  check("A1: the function is in the schema of record", !!fn);
  check("A2: security definer with a pinned search_path",
    /security definer\s+set search_path = public/.test(fn));
  check("A3: the caller is the verified session's address, lowercased and trimmed",
    /lower\(btrim\(coalesce\(auth\.jwt\(\) ->> 'email', ''\)\)\)/.test(fn) && !/\$1\b|\bp_(email|college)\b/.test(fn));
  check("A4: both of MAP's contacts count, each field split into its addresses",
    /regexp_split_to_array\(lower\(coalesce\(c\.cpl_coordinator_email, ''\)\), '\[,;\[:space:\]\]\+'\)/.test(fn) &&
    /regexp_split_to_array\(lower\(coalesce\(c\.primary_contact_email, ''\)\), '\[,;\[:space:\]\]\+'\)/.test(fn) &&
    !/vpaa_email|ceo_email|faculty_lead_email/.test(fn));
  check("A5: both names resolve through map_colleges, trimmed, canonical first",
    (fn.match(/from public\.map_colleges m/g) || []).length === 2 &&
    /m\.college_name = btrim\(c\.college\) or btrim\(c\.college\) = any\(m\.variants\)/.test(fn) &&
    /m\.college_name = btrim\(rr\.college\) or btrim\(rr\.college\) = any\(m\.variants\)/.test(fn) &&
    (fn.match(/order by \(m\.college_name = btrim\((c|rr)\.college\)\) desc/g) || []).length === 2);
  check("A6: one row per listed college even with no report (left join from mine)",
    /from mine\s+left join lateral/.test(fn));
  check("A7: the reviewer's address stays behind", !/recorded_by/.test(fn));
  const grants = sql.slice(sql.indexOf("$$;", at));
  const svc = grants.indexOf("to service_role;"), rev = grants.indexOf("from public, anon;");
  check("A8: service_role is granted before the revoke, and the revoke names PUBLIC and anon",
    svc !== -1 && rev !== -1 && svc < rev);
  check("A9: authenticated may call it; anon is never granted",
    /grant execute on function public\.cpl_funding_my_reports\(\) to authenticated;/.test(grants) &&
    !/cpl_funding_my_reports\(\) to [^;]*\banon\b/.test(grants));
}

// ── B. one rule, two views ───────────────────────────────────────────────────
{
  const src = read("cpl_funding.js");
  check("B1: the reviewer's box marks its rows with the shared rule",
    /function reportsFor\(college\) \{\s*return markReports\(/.test(src));
  check("B2: the rule and the categories are exported for My College",
    /reports: \{ cats: REPORT_CATS, mark: markReports, total: reportTotal \}/.test(src));
}

// ── C. Governance ────────────────────────────────────────────────────────────
{
  const gov = JSON.parse(read("kb/governance_surface_map.json"));
  check("C1: the new read surface is mapped to DR-09", gov.mapped["rpc:cpl_funding_my_reports"] === "DR-09");
}

// ── D/E. The panel, on Implementation Funding ────────────────────────────────
const TOKEN = "header." + "p".repeat(48) + ".sig";
const NAMES = { 9: "Chaffey College", 12: "Citrus College" };
function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><body><div id="college-briefing-root"></div><div id="panel"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  if (opts.phrase) w.localStorage.setItem("cpl_team_pass", "phrase");
  if (opts.token) w.CPL_SESSION = { get: () => ({ access_token: TOKEN, email: "coord@chaffey.edu" }) };
  const calls = [];
  w.fetch = function (url, init) {
    calls.push({ url: String(url), init: init || {} });
    if (/\/rpc\/cpl_funding_my_reports$/.test(String(url))) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(opts.rpcRows || []) });
    }
    const m = /\/map_colleges\?.*college_id=in\.\(([^)]*)\)/.exec(String(url));
    if (m) {
      const rows = m[1].split(",").map(Number).filter((id) => NAMES[id]).map((id) => ({ college_id: id, college_name: NAMES[id] }));
      return Promise.resolve({ ok: true, json: () => Promise.resolve(rows) });
    }
    return new Promise(function () {});
  };
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  const mounts = [];
  w.CPL_REVIEWER_SIGNIN = { mountInto: function (el, o) { mounts.push(o); el.textContent = "sign-in form"; } };
  ["cpl_funding_data.js", "cpl_funding.js", "team_phrase.js", "cpl_chat.js", "college_briefing.js"].forEach(function (f) {
    const s = w.document.createElement("script"); s.textContent = read(f); w.document.body.appendChild(s);
  });
  const M = w.CPL_COLLEGE_BRIEFING;
  if (opts.state) Object.assign(M._state, opts.state, opts.token ? { myToken: TOKEN } : {});
  const el = w.document.getElementById("panel");
  return { w, M, el, calls, mounts };
}
async function panel(opts) {
  const v = load(opts);
  v.shown = v.M.reportsPanel(v.el, { invite: opts.invite !== false, returnTab: "implementation-funding" });
  for (let i = 0; i < 6; i++) await new Promise((r) => setTimeout(r, 0));
  v.text = v.el.textContent.replace(/\s+/g, " ");
  return v;
}
const report = (o) => Object.assign({ college_id: 9, college: "Chaffey", fiscal_year: "2026-27", withdrawn: false,
  reported_by: "Pat Lee", reported_on: "2026-10-15", c1000: 0, c2000: 0, c3000: 0, c4000: 0, c5000: 0,
  c6000: 0, c7000: 0, c_indirect: 0, note: null, recorded_at: "2026-10-16T00:00:00Z" }, o);

(async function () {
  {
    // My College links to the panel and carries no reports of its own.
    const v = load({});
    const M = v.M, root = v.w.document.getElementById("college-briefing-root");
    const nav = [];
    v.w.CPL_TABS = { navigate: (t) => nav.push(t), loadScript: (s2, g, cb) => cb() };
    M._state.data = { colleges: ["Chaffey College"], summaryByName: {}, nameToId: { "Chaffey College": 9 },
      raw: { nameToId: { "Chaffey College": 9 } },
      briefing: { unread: [], leads: [], programs: [], strategyTotal: 0, scenario: "Scenario 2", year: "1" } };
    M._state.scope = "college"; M._state.college = "Chaffey College";
    M.render(root);
    check("D1: My College carries no reports section, and Expand all no longer names one",
      !root.querySelector('details.cb-sec[data-sec="reports"]') && M._SECTION_IDS.indexOf("reports") === -1);
    const go = root.querySelector("#cb-reportsgo");
    go && go.click();
    check("D1b: its funding fold opens the reports on Implementation Funding, asking for them",
      !!go && nav.join() === "implementation-funding" && !!v.w.CPL_FUNDING_REPORTS_INTENT && v.w.CPL_FUNDING_REPORTS_INTENT.focus === true);
  }
  {
    const v = await panel({});
    check("D2: signed out, it says who can read the reports and offers the email link back to this tab",
      v.shown && /CPL coordinator or primary CPL contact can read/.test(v.text) &&
      v.mounts.length === 1 && v.mounts[0].returnTab === "implementation-funding");
    const p = await panel({ phrase: true });
    check("D3: the team phrase alone is not a person, so it still offers the sign-in", p.mounts.length === 1);
    const q = await panel({ invite: false });
    check("D3b: unasked and signed out, the panel stays hidden", q.el.hidden === true && q.text === "");
  }
  {
    const v = await panel({ token: true, state: { myReports: "ready", myEmail: "coord@citrus.edu",
      myRows: [report({ college_id: 12, college: "Citrus", fiscal_year: null }), report({ fiscal_year: null, college: null })] } });
    check("D4: listed for two colleges, it names both, each under its own name",
      /coord@citrus\.edu/.test(v.text) && /Chaffey College/.test(v.text) && /Citrus College/.test(v.text) &&
      v.el.querySelectorAll("h4.cb-myrep-h").length === 2);
    const n = await panel({ token: true, state: { myReports: "ready", myEmail: "x@y.edu", myRows: [] } });
    check("D5: listed nowhere, it says so and where a college updates its contacts",
      /does not list this address/.test(n.text) && /College Contacts/.test(n.text));
    const h = await panel({ token: true, invite: false, state: { myReports: "ready", myEmail: "x@y.edu", myRows: [] } });
    check("D5b: unasked and listed nowhere, a curator sees nothing new", h.el.hidden === true);
  }
  {
    const v = await panel({ token: true, state: { myReports: "ready", myEmail: "coord@chaffey.edu", myRows: [report({ fiscal_year: null, college: null, reported_by: null })] } });
    check("D6: listed with nothing recorded yet, it says so rather than showing a zero",
      /No expenditure report is recorded yet for Chaffey College/.test(v.text) && !/\$0/.test(v.text));
  }
  {
    const rows = [
      report({ c1000: 1000, recorded_at: "2026-10-16T00:00:00Z" }),
      report({ c1000: 2000, c3000: 500, reported_on: "2026-11-02", recorded_at: "2026-11-03T00:00:00Z" }),
      report({ fiscal_year: "2027-28", c4000: 9000, recorded_at: "2027-09-01T00:00:00Z" }),
      report({ fiscal_year: "2027-28", withdrawn: true, reported_by: null, reported_on: null, recorded_at: "2027-09-05T00:00:00Z" })
    ];
    const v = await panel({ token: true, invite: false, state: { myReports: "ready", myEmail: "coord@chaffey.edu", myRows: rows } });
    const t = v.el.querySelector("table");
    const heads = t ? Array.from(t.querySelectorAll("thead th")).map((th) => th.textContent) : [];
    check("D6b: a listed person sees their reports without being asked", v.el.hidden === false && !!t);
    check("D7: one column per fiscal year, oldest first", heads.join("|") === "Category|2026-27|2027-28");
    check("D8: the newer report for a year replaces the earlier one, and a withdrawal counts as unreported",
      /Expended to date: \$2,500, over 1 reported fiscal year/.test(v.text));
    const tot = t && t.querySelector("tr.cb-rep-tot");
    check("D9: the total row reads the counting report and names the withdrawal",
      !!tot && /\$2,500/.test(tot.textContent) && /Withdrawn/.test(tot.textContent));
    check("D10: all eight categories, each a row header",
      !!t && t.querySelectorAll('tbody th[scope="row"]').length === 9 &&
      Array.from(t.querySelectorAll("thead th")).every((th) => th.getAttribute("scope") === "col"));
    const wrap = v.el.querySelector(".cb-rep-wrap");
    check("D11: the table scrolls inside a labelled region, never the page",
      !!wrap && wrap.getAttribute("role") === "region" && wrap.getAttribute("aria-label") === "Reported expenditures, Chaffey College" &&
      wrap.getAttribute("tabindex") === "0");
    check("D12: each year names who reported it and when",
      /2026-27: reported by Pat Lee on 2026-11-02\./.test(v.text) && /2027-28: withdrawn on 2027-09-05, so the year counts as unreported\./.test(v.text));
    check("D13: read only: no input, no button", !v.el.querySelector("input, textarea, button, select"));
  }

  // ── E. the loader ──────────────────────────────────────────────────────────
  const out = await panel({});
  check("E1: signed out, the panel never asks", !out.calls.some((c) => /cpl_funding_my_reports/.test(c.url)));
  const ph = await panel({ phrase: true });
  check("E1b: the team phrase alone never asks either", !ph.calls.some((c) => /cpl_funding_my_reports/.test(c.url)));
  const v = await panel({ token: true, rpcRows: [report({ fiscal_year: null, college: null })] });
  const call = v.calls.find((c) => /\/rpc\/cpl_funding_my_reports$/.test(c.url));
  check("E2: signed in, it asks once, by POST, with the person's own token",
    !!call && call.init.method === "POST" && call.init.headers.Authorization === "Bearer " + TOKEN &&
    v.calls.filter((c) => /cpl_funding_my_reports/.test(c.url)).length === 1);
  check("E3: and shows what came back", v.M._state.myReports === "ready" && /No expenditure report is recorded yet for Chaffey College/.test(v.el.textContent));

  // ── F. Implementation Funding draws it ─────────────────────────────────────
  function fundTab(opts) {
    const dom = new JSDOM('<!doctype html><html><head></head><body>' +
      '<div id="tab-implementation-funding"><div><h2>x</h2><span id="cplFundTitleLink"></span></div>' +
      '<div id="cplFundingMount"></div></div></body></html>', { url: "https://example.org/", runScripts: "dangerously" });
    const w = dom.window;
    w.scrollTo = function () {}; w.Element.prototype.scrollIntoView = function () {};
    w.CPL_FUNDING_NO_REMOTE = true;
    w.fetch = function () { return new Promise(function () {}); };
    if (opts.intent) w.CPL_FUNDING_REPORTS_INTENT = { focus: true };
    if (opts.public) w.CPL_FUNDING_PUBLIC = true;
    w.CPL_REVIEWER_SIGNIN = { mountInto: function (el) { el.textContent = "sign-in form"; } };
    ["college_short_names.js", "cpl_funding_data.js", "cpl_funding.js", "team_phrase.js", "college_briefing.js"].forEach(function (f) {
      const sc = w.document.createElement("script"); sc.textContent = read(f); w.document.body.appendChild(sc);
    });
    w.CPL_FUNDING_TAB.boot();
    return w;
  }
  const asked = fundTab({ intent: true });
  asked.CPL_FUNDING_TAB.render();
  for (let i = 0; i < 4; i++) await new Promise((r) => setTimeout(r, 0));
  const pm = asked.document.getElementById("cplFundMyReports");
  check("F1: asked from My College, Implementation Funding shows the panel, sign-in included",
    !!pm && pm.hidden === false && /Your college.s expenditure reports/.test(pm.textContent) && /sign-in form/.test(pm.textContent));
  const plain = fundTab({});
  plain.CPL_FUNDING_TAB.render();
  for (let i = 0; i < 4; i++) await new Promise((r) => setTimeout(r, 0));
  const pp = plain.document.getElementById("cplFundMyReports");
  check("F2: unasked and signed out, the mount stays empty and hidden", !!pp && pp.hidden === true && pp.textContent === "");
  const pub = fundTab({ public: true, intent: true });
  pub.CPL_FUNDING_TAB.render();
  check("F3: the public rendering carries no reports mount", !pub.document.getElementById("cplFundMyReports"));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
