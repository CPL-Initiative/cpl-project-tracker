// Funding tab: who sent each request, and the one response email (Sam,
// 2026-10-31, SkyCloudberry).
//
//   "check to see if they are a map user and add their map role next to their
//   name; if it is possible to look up their title on the college website when
//   they select 'Other' as their title, add that as well; check if they are
//   listed on the college landing page and give info on that as well--keep it
//   all as simple and short as possible."
//   "Give me a place to revise the response email once for both the
//   confirmation and the attestation. Will want to refer to us as the CPL
//   Initiative team and include the CPL Initiative logo on the signature line."
//
// Guards: the few words after a requester's name (MAP role, landing page, a
// title search for Other), the Lead's landing-page check on an attestation, the
// template a reviewer edits once and Accept fills for either kind, and that none
// of it reaches a public rendering. Run from repo root: `npm test`.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const dataSrc = fs.readFileSync("cpl_funding_data.js", "utf8");
const consumerSrc = fs.readFileSync("cpl_funding.js", "utf8");
const SQL = fs.readFileSync("funding/supabase_cpl_funding_requester_context.sql", "utf8");
const D = (function () {
  var sandbox = { window: {} };
  new Function("window", dataSrc).call(sandbox, sandbox.window);
  return sandbox.window.CPL_FUNDING;
})();
const COL = D.colleges[0].college, OTHER = D.colleges[1].college;

function freshDom() {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><head></head><body>' +
    '<div class="cpl-tab-pane" id="tab-implementation-funding"><div class="main-container">' +
    '<div id="cplFundingMount">placeholder</div>' +
    "</div></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/" });
  dom.window.scrollTo = function () {};
  dom.window.CPL_FUNDING_NO_REMOTE = true;
  return dom;
}
function boot(window) {
  window.eval(dataSrc);
  window.eval(consumerSrc);
  window.CPL_FUNDING_TAB.boot();
  return window.document;
}
function click(window, el) { el.dispatchEvent(new window.MouseEvent("click", { bubbles: true })); }
function reviewerSession() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function (extra) {
      var h = { apikey: "anon", Authorization: "Bearer header.payload.sig" };
      if (extra) for (var k in extra) h[k] = extra[k];
      return h;
    }
  };
}
const flat = (el) => (el ? el.textContent.replace(/\s+/g, " ") : "");

// ── The SQL of record: one gate, the mirror closed, the write the sync's alone ──
check("S1: the lookup answers a reviewer or the team phrase alone",
  /if not \(public\.is_allowed_reviewer\(\) or public\.team_pass_ok\(\)\) then\s*return;/.test(SQL));
check("S2: the landing mirror is closed to every API role, and its replace is the service role's",
  /alter table public\.map_landing_contacts enable row level security;/.test(SQL) &&
  /revoke all on public\.map_landing_contacts from public, anon, authenticated;/.test(SQL) &&
  /revoke all on function public\.map_landing_contacts_replace\(jsonb\) from public, anon, authenticated;/.test(SQL) &&
  /grant execute on function public\.map_landing_contacts_replace\(jsonb\) to service_role;/.test(SQL));
check("S3: the module never reads a coordinator's address (the PII guard holds)", !/coordinator_email/.test(consumerSrc));
// Measured 2026-10-31: inlined, the correlated lookups recomputed every MAP user's name key per row and the
// roster timed out at 60s over 313 contacts; materialized, both lookups answer in under half a second.
const ROSTER_SQL = fs.readFileSync("map/supabase_map_landing_contacts_roster.sql", "utf8");
check("S4: both lookups compute the MAP users' name keys once, in a materialized CTE",
  /u as materialized \(/.test(SQL) && /l as materialized \(/.test(SQL) &&
  /u as materialized \(/.test(ROSTER_SQL) && /l as materialized \(/.test(ROSTER_SQL) &&
  !/from public\.map_college_users u\s+where/.test(SQL));

// ── A signed-in reviewer ──────────────────────────────────────────────────────
{
  const dom = freshDom();
  dom.window.CPL_SESSION = reviewerSession();
  const doc = boot(dom.window);
  const P = dom.window.CPL_FUNDING_TAB;
  const row = {}; row[COL] = { college: COL, status: "self_attested", source: "self", requested_at: "2026-10-30T17:00:00Z" };
  row[OTHER] = { college: OTHER, status: "self_attested", source: "self", requested_at: "2026-10-30T18:00:00Z" };
  P._setElig({ coordOk: true, coord: {}, optinRow: row, optinReview: [
    { college: COL, name: "Torres-Benavides, Cari M", title: "Other", email: "ctb@college.edu",
      status: "self_attested", requested_at: "2026-10-30T17:00:00Z" },
    { college: OTHER, name: "Jeff Lamb", title: "VPAA", email: "lamb@other.edu",
      status: "self_attested", requested_at: "2026-10-30T18:00:00Z" }
  ], reqCtx: [
    { kind: "part", college: COL, fiscal_year: null,
      map_users: [{ role: "Initiator", college: COL, status: "Active" }], landing: [] },
    { kind: "part", college: OTHER, fiscal_year: null, map_users: [],
      landing: [{ title: "Evaluator", college: COL }] }
  ] });
  P.render();
  const open = (c) => {
    const tr = doc.querySelector('#cplFundTable tr.cplfund-row[data-id="c:' + c + '"]');
    const next = tr && tr.nextElementSibling;
    if (!(next && next.classList.contains("cplfund-detail"))) click(dom.window, tr.querySelector(".cplfund-caret") || tr);
    const again = doc.querySelector('#cplFundTable tr.cplfund-row[data-id="c:' + c + '"]');
    return again && again.nextElementSibling;
  };
  let det = open(COL);
  const line = det && det.querySelector(".cf-conds .cplfund-corow .dk");
  check("R1: the requester line reads name (Other, find title) · MAP role · landing page, then the email",
    /Requested by Torres-Benavides, Cari M \(Other, find title\) · MAP role: Initiator · Not on landing page · ctb@college\.edu/.test(flat(line)));
  const find = line && line.querySelector("a");
  check("R2: find title searches the college's own site for the person, first and last name, in a new tab",
    !!find && find.textContent === "find title" && find.getAttribute("target") === "_blank" &&
    decodeURIComponent(find.getAttribute("href")) === 'https://www.google.com/search?q="Cari Torres-Benavides" site:college.edu' &&
    /^Find Cari Torres-Benavides's title on college\.edu/.test(find.getAttribute("aria-label")));
  det = open(OTHER);
  const line2 = det && det.querySelector(".cf-conds .cplfund-corow .dk");
  check("R3: a named title takes no search; no MAP user says so; another college's listing names it",
    /Jeff Lamb \(VPAA\) · Not a MAP user · On landing page as Evaluator \(/.test(flat(line2)) && !line2.querySelector("a"));
  const lane = doc.querySelector(".cplfund-colane");
  check("R4: the CO review lane carries the same few words",
    !!lane && /MAP role: Initiator · Not on landing page/.test(flat(lane)) && /Not a MAP user/.test(flat(lane)));

  // The one template, edited once, filled for each request.
  const tpl = doc.getElementById("cplfund-mailtpl");
  check("E1: the Response email sits under Minimum Conditions for a reviewer, with Edit and the logo",
    !!tpl && /^Response email/.test(flat(tpl.querySelector("summary")).trim()) &&
    !!tpl.querySelector('[data-textedit="accept_email"]') &&
    !!tpl.querySelector('img[src$="sierra/cpl-initiative-logo-navy.png"]') &&
    /Subject: CPL Implementation Funding: \{request\} accepted for \{college\}/.test(flat(tpl)) &&
    /The CPL Initiative team has accepted it/.test(flat(tpl)) && !/MAP team/.test(flat(tpl)));
  click(dom.window, tpl.querySelector('[data-textedit="accept_email"]'));
  const ta = doc.querySelector('#cplfund-mailtpl [data-textarea="accept_email"]');
  check("E2: Edit opens the template as plain text, the subject line first", !!ta && /^Subject: /.test(ta.value));
  ta.value = "Subject: Accepted: {request}, {college}\n\nHello {name},\n\nWe accepted the {request} of {date}.\n\nThe CPL Initiative team";
  click(dom.window, doc.querySelector('#cplfund-mailtpl [data-textsave="accept_email"]'));
  const mails = [];
  dom.window.CPL_FUNDING_OPEN_MAIL = function (href) { mails.push(href); };
  det = open(COL);
  click(dom.window, det.querySelector("[data-optinaccept]"));
  const dlg = doc.getElementById("cplfund-maildlg");
  const body = dlg && dlg.querySelector("[data-maildlgbody]");
  check("E3: Accept fills the saved template: subject, the name turned round, the date in words, the logo last",
    !!dlg && /Subject: Accepted: participation confirmation, /.test(flat(dlg)) &&
    /Hello Cari Torres-Benavides,/.test(flat(body)) && /of October 30, 2026\./.test(flat(body)) &&
    !!body && body.lastElementChild && body.lastElementChild.querySelector && !!body.querySelector("p:last-child img"));
  check("E4: the window is a labeled dialog that takes the focus",
    dlg.getAttribute("role") === "dialog" && dlg.getAttribute("aria-modal") === "true" &&
    doc.activeElement === dlg.querySelector("#cplfund-maildlg-h"));
  click(dom.window, dlg.querySelector("[data-maildlgsend]"));
  const m = decodeURIComponent(mails[0] || "");
  check("E5: Copy and open draft opens a draft to the requester alone; a browser that cannot copy gets the plain text",
    mails.length === 1 && m.indexOf("mailto:ctb@college.edu?subject=Accepted: participation confirmation, ") === 0 &&
    /&body=Hello Cari Torres-Benavides,/.test(m) && !/cc=/.test(m) &&
    /would not copy/.test(flat(dlg.querySelector(".cplfund-maildlg-msg"))));
  dlg.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check("E6: Escape closes the window", !doc.getElementById("cplfund-maildlg"));
}

// ── The public page: none of it ─────────────────────────────────────────────
{
  const dom = freshDom();
  dom.window.CPL_FUNDING_PUBLIC = true;
  const doc = boot(dom.window);
  const Q = dom.window.CPL_FUNDING_TAB;
  const row = {}; row[COL] = { college: COL, status: "self_attested", source: "self" };
  Q._setElig({ coordOk: true, coord: {}, optinRow: row, reqCtx: [
    { kind: "part", college: COL, fiscal_year: null, map_users: [{ role: "Initiator", college: COL, status: "Active" }], landing: [] }
  ] });
  Q.render();
  const t = doc.body.textContent;
  check("P1: a public rendering shows no Response email and no requester context",
    !doc.getElementById("cplfund-mailtpl") && !/MAP role:|Not on landing page|find title/.test(t));
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
