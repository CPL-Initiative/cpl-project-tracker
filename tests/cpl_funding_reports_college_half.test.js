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
//   D. My College says something true in every state: signed out (and the
//      team phrase alone, which is not a person), not listed, listed with no
//      report yet, and listed with reports (a correction and a withdrawal).
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

// ── D/E. My College ──────────────────────────────────────────────────────────
const NAME_TO_ID = { "Chaffey College": 9, "Citrus College": 12 };
const TOKEN = "header." + "p".repeat(48) + ".sig";
function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><body><div id="college-briefing-root"></div></body></html>',
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
    return new Promise(function () {});
  };
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  const mounts = [];
  w.CPL_REVIEWER_SIGNIN = { mountInto: function (el, o) { mounts.push(o); el.textContent = "sign-in form"; } };
  ["cpl_funding_data.js", "cpl_funding.js", "team_phrase.js", "cpl_chat.js", "college_briefing.js"].forEach(function (f) {
    const s = w.document.createElement("script"); s.textContent = read(f); w.document.body.appendChild(s);
  });
  const M = w.CPL_COLLEGE_BRIEFING;
  const root = w.document.getElementById("college-briefing-root");
  M._state.data = { colleges: Object.keys(NAME_TO_ID), summaryByName: {}, nameToId: NAME_TO_ID,
    raw: { nameToId: NAME_TO_ID },
    briefing: { unread: [], leads: [], programs: [], strategyTotal: 0, scenario: "Scenario 2", year: "1" } };
  M._state.scope = "college";
  M._state.college = opts.college || "Chaffey College";
  if (opts.state) Object.assign(M._state, opts.state);
  M.render(root);
  const sec = root.querySelector('details.cb-sec[data-sec="reports"]');
  return { w, M, root, sec, calls, mounts,
    text: sec ? sec.textContent.replace(/\s+/g, " ") : "",
    summary: sec ? (sec.querySelector(".cb-sum-v") || {}).textContent : "" };
}
const report = (o) => Object.assign({ college_id: 9, college: "Chaffey", fiscal_year: "2026-27", withdrawn: false,
  reported_by: "Pat Lee", reported_on: "2026-10-15", c1000: 0, c2000: 0, c3000: 0, c4000: 0, c5000: 0,
  c6000: 0, c7000: 0, c_indirect: 0, note: null, recorded_at: "2026-10-16T00:00:00Z" }, o);

{
  const v = load({});
  check("D1: the section renders after My CPL Funding, and Expand all knows it",
    !!v.sec && v.M._SECTION_IDS.indexOf("reports") !== -1);
  check("D2: signed out, it says who can read the reports and offers the email link",
    v.summary === "for college staff" && /CPL coordinator or primary CPL contact can read/.test(v.text) &&
    v.mounts.length === 1 && v.mounts[0].returnTab === "college-briefing");
  const p = load({ phrase: true });
  check("D3: the team phrase alone is not a person, so it still offers the sign-in",
    p.summary === "for college staff" && p.mounts.length === 1);
}
{
  const v = load({ state: { myReports: "ready", myEmail: "coord@citrus.edu", myRows: [report({ college_id: 12, college: "Citrus", fiscal_year: null })] } });
  check("D4: listed elsewhere, it names the colleges the address is listed for",
    v.summary === "not listed for this college" && /coord@citrus\.edu/.test(v.text) && /Citrus College/.test(v.text) &&
    !v.sec.querySelector("table"));
  const n = load({ state: { myReports: "ready", myEmail: "x@y.edu", myRows: [] } });
  check("D5: listed nowhere, it says so and where a college updates its contacts",
    n.summary === "not listed for this college" && /does not list this address/.test(n.text) && /College Contacts/.test(n.text));
}
{
  const v = load({ state: { myReports: "ready", myEmail: "coord@chaffey.edu", myRows: [report({ fiscal_year: null, college: null, reported_by: null })] } });
  check("D6: listed with nothing recorded yet, it says so rather than showing a zero",
    v.summary === "none recorded" && /No expenditure report is recorded yet for Chaffey College/.test(v.text) &&
    !/\$0/.test(v.text));
}
{
  const rows = [
    report({ c1000: 1000, recorded_at: "2026-10-16T00:00:00Z" }),
    report({ c1000: 2000, c3000: 500, reported_on: "2026-11-02", recorded_at: "2026-11-03T00:00:00Z" }),
    report({ fiscal_year: "2027-28", c4000: 9000, recorded_at: "2027-09-01T00:00:00Z" }),
    report({ fiscal_year: "2027-28", withdrawn: true, reported_by: null, reported_on: null, recorded_at: "2027-09-05T00:00:00Z" })
  ];
  const v = load({ state: { myReports: "ready", myEmail: "coord@chaffey.edu", myRows: rows } });
  const t = v.sec && v.sec.querySelector("table");
  const heads = t ? Array.from(t.querySelectorAll("thead th")).map((th) => th.textContent) : [];
  check("D7: one column per fiscal year, oldest first", heads.join("|") === "Category|2026-27|2027-28");
  check("D8: the newer report for a year replaces the earlier one, and a withdrawal counts as unreported",
    v.summary === "$2,500 expended to date" && /Expended to date: \$2,500, over 1 reported fiscal year/.test(v.text));
  const tot = t && t.querySelector("tr.cb-rep-tot");
  check("D9: the total row reads the counting report and names the withdrawal",
    !!tot && /\$2,500/.test(tot.textContent) && /Withdrawn/.test(tot.textContent));
  check("D10: all eight categories, each a row header",
    !!t && t.querySelectorAll('tbody th[scope="row"]').length === 9 &&
    Array.from(t.querySelectorAll("thead th")).every((th) => th.getAttribute("scope") === "col"));
  const wrap = v.sec && v.sec.querySelector(".cb-rep-wrap");
  check("D11: the table scrolls inside a labelled region, never the page",
    !!wrap && wrap.getAttribute("role") === "region" && wrap.getAttribute("aria-label") === "Reported expenditures, Chaffey College" &&
    wrap.getAttribute("tabindex") === "0");
  check("D12: each year names who reported it and when",
    /2026-27: reported by Pat Lee on 2026-11-02\./.test(v.text) && /2027-28: withdrawn on 2027-09-05, so the year counts as unreported\./.test(v.text));
  check("D13: read only: no input, no button", !!v.sec && !v.sec.querySelector("input, textarea, button, select"));
}

// ── E. the loader ────────────────────────────────────────────────────────────
(async function () {
  const out = load({});
  out.M.activate();
  await new Promise((r) => setTimeout(r, 0));
  check("E1: signed out, the page never asks", !out.calls.some((c) => /cpl_funding_my_reports/.test(c.url)));
  const ph = load({ phrase: true });
  ph.M.activate();
  await new Promise((r) => setTimeout(r, 0));
  check("E1b: the team phrase alone never asks either, and the page stays signed out",
    !ph.calls.some((c) => /cpl_funding_my_reports/.test(c.url)) && ph.M._state.myReports === "signedout");
  const v = load({ token: true, rpcRows: [report({ fiscal_year: null, college: null })] });
  v.M.activate();
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
  const call = v.calls.find((c) => /\/rpc\/cpl_funding_my_reports$/.test(c.url));
  check("E2: signed in, it asks once, by POST, with the person's own token",
    !!call && call.init.method === "POST" && call.init.headers.Authorization === "Bearer " + TOKEN &&
    v.calls.filter((c) => /cpl_funding_my_reports/.test(c.url)).length === 1);
  check("E3: and shows what came back", v.M._state.myReports === "ready" && v.M._state.myRows.length === 1);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
