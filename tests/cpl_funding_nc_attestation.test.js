// tests/cpl_funding_nc_attestation.test.js
//
// THE NONCREDIT ATTESTATION (Scenario 4; Sam's Open Asks Sheets 113 and 114,
// 2026-10-22). A scenario under the outcomes lane gates the noncredit share on
// two conditions: a noncredit CPL coordinator named and published, and a
// strike-team attestation renewed each year, taken in COBI until MAP carries
// the role. Since 2026-10-25 (Sam) the person is the Noncredit CPL Lead and the
// strike-team condition is retired: one condition, the Lead, who meets
// regularly with the CPL Coordinator. The college attests once a fiscal year, attest-first as the
// participation opt-in is, and the CO acts only to reject. The SQL of record
// is kb/supabase_cpl_funding_nc_attestation.sql.
//
// What this pins, in order of how expensive each would be to get wrong:
//
//   ⚠️ 1. NOTHING PRIVATE REACHES THE PUBLIC VIEW. The published columns are
//   the coordinator's name and title, the year, the status and the dates. An
//   email, the attestor, the award count (a student count; the funding ADR's
//   floor is 10), the exhibits or the course reaching anon is a disclosure.
//
//   ⚠️ 2. THE YEAR LAPSES. The view holds this fiscal year and the next, so
//   last year's attestation stops counting on July 1; the JS and the SQL
//   compute the year the same way.
//
//   ⚠️ 3. THE CO'S CONTROLS ARE THE CO'S. Reject, Re-confirm and Remove show to
//   a signed-in reviewer alone, never in the public preview; the college's
//   form shows to everyone, as the opt-in form does.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_nc_attestation.test.js`).
const fs = require("fs");
const path = require("path");
const H = require("./lib/cpl_funding_harness.js");
const { check, freshDom, boot, consumerSrc, finish, click } = H;

const ROOT = path.join(__dirname, "..");
const SQL = fs.readFileSync(path.join(ROOT, "kb", "supabase_cpl_funding_nc_attestation.sql"), "utf8");
const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const PRIVATE = ["attestor_name", "attestor_title", "attestor_email",
  "nc_awarded_count", "attested_exhibits", "portfolio_course", "confirmed_by", "noted_by", "source"];

// ── A. the SQL and the reader agree on what is public ────────────────────────
const grantCols = (SQL.match(/grant select \(([^)]+)\)\s+on public\.cpl_funding_nc_attestation to anon, authenticated;/) || [])[1];
const granted = grantCols ? grantCols.split(",").map((s) => s.trim()) : [];
const viewSel = (SQL.match(/create or replace view public\.cpl_funding_nc_attestation_pub[\s\S]*?select ([\s\S]*?)\s+from public\.cpl_funding_nc_attestation a/) || [])[1];
const viewCols = viewSel ? viewSel.split(",").map((s) => s.trim().replace(/^a\./, "")) : [];
const readerSel = (consumerSrc.match(/cpl_funding_nc_attestation_pub" \+\s*"\?select=([^"&]+)/) || [])[1];
const readerCols = readerSel ? readerSel.split(",") : [];
check("A1: the table grants anon the published columns alone — no attestor, email, count, list or course",
  granted.length === 8 && PRIVATE.every((c) => granted.indexOf(c) < 0) &&
  /revoke all on public\.cpl_funding_nc_attestation from anon, authenticated;/.test(SQL));
check("A2: the view selects exactly the granted columns, and the page reads a subset of them",
  viewCols.length === granted.length && viewCols.every((c) => granted.indexOf(c) >= 0) &&
  readerCols.length > 0 && readerCols.every((c) => viewCols.indexOf(c) >= 0));
check("A3: the view runs as its reader (security_invoker) and keeps this fiscal year and the next",
  /with \(security_invoker = true\)/.test(SQL) && /where a\.fiscal_year >= public\.cpl_funding_fy\(current_date\);/.test(SQL));
check("A4: the review RPC returns nothing to anon, masks a count of 1 to 9 for the team phrase, and is closed to PUBLIC",
  /if not \(reviewer or public\.team_pass_ok\(\)\) then\s*\n\s*return;/.test(SQL) &&
  /case when reviewer or a\.nc_awarded_count is null or a\.nc_awarded_count = 0\s*\n\s*or a\.nc_awarded_count >= 10/.test(SQL) &&
  /revoke all on function public\.cpl_funding_nc_attestation_review\(\) from public, anon, authenticated;/.test(SQL) &&
  /grant execute on function public\.cpl_funding_nc_attestation_review\(\) to anon, authenticated, service_role;/.test(SQL));
const sqlTitles = ((SQL.match(/attestor_title in \(([^)]+)\)/) || [])[1] || "").split(",").map((s) => s.trim().replace(/'/g, ""));
const jsTitles = ((consumerSrc.match(/var NC_ATTEST_TITLES = \[([\s\S]*?)\];/) || [])[1] || "").match(/val: "([^"]+)"/g) || [];
check("A5: the form's titles are the insert policy's titles, in lockstep",
  sqlTitles.length === 5 && jsTitles.map((s) => s.slice(6, -1)).join(",") === sqlTitles.join(","));
check("A6: a college's insert is attest-first and for this fiscal year or the next; the CO's writes need a signed-in reviewer",
  /status = 'self_attested' and source = 'self'/.test(SQL) &&
  /fiscal_year in \(public\.cpl_funding_fy\(current_date\),/.test(SQL) &&
  /cna_update on public\.cpl_funding_nc_attestation\s*\n\s*for update to anon, authenticated\s*\n\s*using \(public\.is_allowed_reviewer\(\)\) with check \(public\.is_allowed_reviewer\(\)\);/.test(SQL) &&
  /cna_delete on public\.cpl_funding_nc_attestation\s*\n\s*for delete to anon, authenticated using \(public\.is_allowed_reviewer\(\)\);/.test(SQL) &&
  /create unique index if not exists cna_college_fy_uq\s*\n\s*on public\.cpl_funding_nc_attestation \(college, fiscal_year\);/.test(SQL));
const swept = (consumerSrc.match(/var CURATE_ATTRS = \[([\s\S]*?)\];/) || [])[1] || "";
check("A7: the CO's three controls are swept from a public rendering; the college's form controls are not",
  /"data-ncattestreject", "data-ncattestconfirm", "data-ncattestremove"/.test(swept) &&
  !/data-ncattest(open|submit|cancel|wrap|field)/.test(swept));

// ── B. the model, Scenario 4's lane ──────────────────────────────────────────
const OUTCOMES = {
  ncLane: "outcomes",
  ncOutcomes: { "1": [
    { key: "exh", title: "Exhibits built or adopted", share: 0.5, goals: ["A"], unit_word: "exhibits",
      metric: "Exhibits in MAP built or adopted", metric_src: "nc_exh",
      target_rule: { kind: "pct_floor_cap", of: "nc_cdcp", pct: 0.05, floor: 2, cap: 10 } },
    { key: "course", title: "Noncredit CPL portfolio-development course", share: 0.5, goals: ["A"], unit_word: "courses",
      metric: "A noncredit CPL portfolio-development course", metric_src: "nc_course", target_rule: { kind: "fixed", n: 1 } }
  ] }
};
const PERF = { as_of: "2026-10-25", suppress_below: 10,
  statewide: { pa_u: 10, nc_exh: 5, nc_cdcp: 196, nc_course: 0 },
  colleges: { "Mt San Antonio": { pa_u: 100, nc_exh: 5, nc_cdcp: 196, nc_course: 0 } },
  feeders: {}, unmatched: {}, vet_star: {}, origination: { in_scope: {} } };
const COLLEGE = "Mt San Antonio";

function session() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
}
function setup(opts) {
  opts = opts || {};
  const { window } = freshDom();
  if (opts.public) window.CPL_FUNDING_PUBLIC = true;
  if (opts.signedIn) window.CPL_SESSION = session();
  window.CPL_FUNDING_PERF = JSON.parse(JSON.stringify(PERF));
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const shared = T._getShared();
  T._setShared(Object.assign({}, shared, JSON.parse(JSON.stringify(OUTCOMES)),
    { pool: Object.assign({}, shared.pool, { nc_portion_pct: 15 }) }));
  T._setElig(Object.assign({ coordOk: true, coord: { [COLLEGE]: true },
    optin: { [COLLEGE]: { status: "self_attested" } } }, opts.elig || {}));
  T.render();
  return { window, doc, T };
}
function rowOf(doc, name) {
  return Array.from(doc.querySelectorAll("tr[data-id]")).find((tr) => tr.getAttribute("data-id") === "c:" + name) || null;
}
function drill(window, doc, name) {
  const tr = rowOf(doc, name);
  if (!tr) return null;
  const next = tr.nextElementSibling;
  if (!(next && next.classList.contains("cplfund-detail"))) click(window, tr.querySelector(".cplfund-caret"));
  const t2 = rowOf(doc, name);
  let n = t2 ? t2.nextElementSibling : null;
  while (n && !n.classList.contains("cplfund-detail") && !n.hasAttribute("data-id")) n = n.nextElementSibling;
  return n && n.classList.contains("cplfund-detail") ? n : null;
}

{
  const { T } = setup();
  check("B1: the fiscal year runs July to June, as cpl_funding_fy() computes it",
    T._fiscalYearOf(new Date("2026-10-25T12:00:00Z")) === "2026-27" && T._fiscalYearOf(new Date("2026-06-30T12:00:00Z")) === "2025-26" &&
    T._fiscalYearOf(new Date("2026-07-01T12:00:00Z")) === "2026-27" && T._fiscalYearOf(new Date("2099-12-31T12:00:00Z")) === "2099-00");
  const read = (o) => T._ncAttestFormRead((k) => o[k]);
  const ok = { coordName: " Ana Ruiz ", coordTitle: "Noncredit CPL Coordinator", leadTypes: ["ft_faculty"],
    assignment: " 20% release fall and spring ", meets: "every two weeks", name: "Ben Ko", title: "NCDEAN", email: "ben@college.edu" };
  const good = read(ok);
  check("B2: a complete form reads into a record, trimmed, with the Lead's type, assignment and meetings and no count, course or exhibits (Sam, 2026-10-26)",
    !good.error && good.form.coordName === "Ana Ruiz" && good.form.title === "NCDEAN" &&
    good.form.leadTypes.join() === "ft_faculty" && good.form.assignment === "20% release fall and spring" &&
    good.form.meets === "every two weeks" && !("count" in good.form) && !("course" in good.form) && !("exhibits" in good.form));
  check("B3: the form names the first missing field, in the order it asks",
    /Noncredit CPL Lead's name/.test(read(Object.assign({}, ok, { coordName: "" })).error) &&
    /Noncredit CPL Lead's title/.test(read(Object.assign({}, ok, { coordTitle: "" })).error) &&
    /what kind of employee/.test(read(Object.assign({}, ok, { leadTypes: [] })).error) &&
    /about the Lead's assignment/.test(read(Object.assign({}, ok, { assignment: " " })).error) &&
    /how often the Lead meets/.test(read(Object.assign({}, ok, { meets: "" })).error) &&
    /your name/.test(read(Object.assign({}, ok, { name: "" })).error) &&
    /choose your title/.test(read(Object.assign({}, ok, { title: "Dean" })).error) &&
    /valid college email/.test(read(Object.assign({}, ok, { email: "ben" })).error));
  const many = read(Object.assign({}, ok, { leadTypes: ["staff", "dean", "administrator"] }));
  check("B4: the Lead may be more than one type; a type the table refuses is dropped, and none left asks again",
    many.form.leadTypes.join() === "staff,administrator" &&
    /what kind of employee/.test(read(Object.assign({}, ok, { leadTypes: ["dean"] })).error));
  const jsTypes = ((consumerSrc.match(/var NC_LEAD_TYPES = \[([\s\S]*?)\];/) || [])[1] || "").match(/val: "([^"]+)"/g) || [];
  const sqlTypes = ((SQL.match(/lead_types <@ array\[([^\]]+)\]/) || [])[1] || "").split(",").map((x) => x.trim().replace(/'/g, ""));
  check("B5: the form's employee types are the table's check, in lockstep",
    sqlTypes.length === 4 && jsTypes.map((x) => x.slice(6, -1)).join(",") === sqlTypes.join(","));
}

// ── C. a college attests from its drill-in ───────────────────────────────────
{
  const { window, doc, T } = setup({ elig: { ncAttestOk: true, ncAttest: {} } });
  const before = T._alloc(COLLEGE);
  let det = drill(window, doc, COLLEGE);
  const open = det && det.querySelector("[data-ncattestopen]");
  // Since 2026-10-28 (Sam: "Move the NC attest link up next to the NC checkbox to the right of the label text and
  // aligned vertically under the confirmation check box") the word rides the noncredit row, after the Lead's words,
  // in the cell under the institution row's second box.
  const ncRow = det && det.querySelector(".cf-conds-nc");
  check("C1: once the view answers and the college has not attested, its drill-in offers the attestation, and the noncredit share is held",
    !!open && open.textContent === "Attest for the noncredit share" && before.nc_gate_blocked === true &&
    /Noncredit CPL Lead not yet attested/.test(flat(ncRow)) && !/[Ss]trike/.test(flat(ncRow)) &&
    open.getAttribute("aria-expanded") === "false" && /Once each fiscal year; \d{4}-\d{2} is open\./.test(open.title));
  check("C1b: the word sits in the noncredit row's second cell, after the Lead's box, and the row's first cell holds the Lead",
    !!ncRow && open.parentNode === ncRow.querySelector(":scope > .cf-conds-items") &&
    /Noncredit CPL Lead not yet attested/.test(flat(ncRow.querySelector(":scope > .cf-conds-first"))) &&
    !!det.querySelector(".cf-conds > .cf-conds-first") && !det.querySelector(".cplfund-optin [data-ncattestopen]"));
  click(window, open);
  det = drill(window, doc, COLLEGE);
  let wrap = det && det.querySelector("[data-ncattestwrap]");
  check("C1c: the word opens the form, which starts on the attestor's email alone, the support address under it",
    !!wrap && wrap.querySelectorAll("[data-ncattestfield]").length === 1 && !!wrap.querySelector('[data-ncattestfield="email"]') &&
    !!wrap.querySelector('.cplfund-support a[href="mailto:map@rccd.edu"]') && !wrap.querySelector("[data-ncattestsubmit]") &&
    det.querySelector("[data-ncattestopen]").getAttribute("aria-expanded") === "true");
  wrap.querySelector('[data-ncattestfield="email"]').value = "ben@mtsac.edu";
  click(window, wrap.querySelector("[data-ncattestemailgo]"));
  det = drill(window, doc, COLLEGE);
  wrap = det && det.querySelector("[data-ncattestwrap]");
  const ack = wrap && wrap.querySelector(".cplfund-optin-ack");
  check("C1d: an allowed address is acknowledged: it may attest, and the Lead shows as complete once CPL Initiative staff approve",
    !!ack && /ben@mtsac\.edu may attest for .+'s noncredit share\. Once CPL Initiative staff approve the attestation, the Noncredit CPL Lead shows as complete on this dashboard\./.test(flat(ack)));
  const fields = wrap ? Array.from(wrap.querySelectorAll("[data-ncattestfield]")).map((el) => el.getAttribute("data-ncattestfield")) : [];
  const types = wrap ? Array.from(wrap.querySelectorAll("[data-ncattestlead]")) : [];
  check("C2: the form asks for the Lead (name, title, type, assignment, meetings) and the attestor, every control labeled; no count, course or exhibits",
    fields.join(",") === "coordName,coordTitle,assignment,meets,name,title" &&
    types.map((b) => b.closest("label").textContent.trim()).join("|") === "Staff|FT Faculty|PT Faculty|Administrator" &&
    types.every((b) => b.type === "checkbox") &&
    Array.from(wrap.querySelectorAll("fieldset > legend")).map((l) => l.textContent).join("|") === "The Noncredit CPL Lead|The Lead is|You, attesting for the college" &&
    Array.from(wrap.querySelectorAll("input, select, textarea")).every((el) => !!el.closest("label")) &&
    !/Reported this year|former noncredit students|portfolio course|Exhibits the college/i.test(flat(wrap)));
  const head = wrap && wrap.querySelector(".cplfund-optin-head");
  check("C3: Sam's words: the college in regular type, his intro, the same-person note; what is public and what goes to the CO alone",
    !!head && !head.querySelector("strong, b") &&
    flat(wrap.querySelector(".cplfund-ncattest-intro")) === "Complete the items below to qualify for noncredit CPL funding." &&
    /Tell us briefly about the assignment/.test(flat(wrap)) &&
    /How often does the Noncredit CPL Lead meet with credit CPL colleagues\?/.test(flat(wrap)) &&
    /The CPL Coordinator and the Noncredit CPL Lead may be the same person\./.test(flat(wrap)) &&
    /name and title appear publicly/.test(flat(wrap)) && /Your name, your email and the Lead's assignment go to the Chancellor's Office alone/.test(flat(wrap)));
  click(window, wrap.querySelector("[data-ncattestsubmit]"));
  check("C4: an empty submit names the first missing field and records nothing",
    /Noncredit CPL Lead's name/.test(flat(wrap.querySelector("[data-ncattesterr]"))) && !T._ncAttest(COLLEGE));
  const set = (k, v) => { const el = wrap.querySelector('[data-ncattestfield="' + k + '"]'); el.value = v; };
  set("coordName", "Ana Ruiz"); set("coordTitle", "Noncredit CPL Lead");
  click(window, wrap.querySelector('[data-ncattestsubmit]'));
  check("C4b: the Lead's type is asked next, before the attestor",
    /what kind of employee/.test(flat(wrap.querySelector("[data-ncattesterr]"))) && !T._ncAttest(COLLEGE));
  wrap.querySelector('[data-ncattestlead="pt_faculty"]').checked = true;
  set("assignment", "OT 10 hours per week"); set("meets", "monthly");
  set("name", "Ben Ko"); set("title", "NCDEAN");
  click(window, wrap.querySelector("[data-ncattestsubmit]"));
  const att = T._ncAttest(COLLEGE), after = T._alloc(COLLEGE);
  det = drill(window, doc, COLLEGE);
  // Since Sam's 2026-10-27 ruling the attestation waits for a MAP team reviewer.
  check("C5: a complete submit waits for a MAP team reviewer: the share stays held, the line says so, a thank-you",
    !!att && att.status === "self_attested" && att.fiscal_year === T._fiscalYearOf() && after.nc_gate_blocked === true &&
    /Noncredit CPL Lead: Awaiting CPL Initiative Confirmation/.test(flat(det.querySelector(".cf-conds-nc"))) &&
    /Thank you\. CPL Initiative staff will review the noncredit attestation for \d{4}-\d{2} and send a confirmation to ben@mtsac\.edu\. Once they approve it, the Noncredit CPL Lead shows as complete on this dashboard\./.test(flat(det)) &&
    !/Ana Ruiz/.test(flat(det.querySelector(".cf-conds-nc"))));
}
{
  const { window, doc } = setup({ elig: {} });
  const det = drill(window, doc, COLLEGE);
  check("C6: before the view answers there is nothing to write to, so no form",
    !!det && !det.querySelector("[data-ncattestopen]"));
}
{
  const { window, doc, T } = setup({ elig: { ncAttestOk: true, ncAttest: {} } });
  const credOnly = H.D.colleges.map((c) => c.college).find((n) => T._ncAward(n) === 0 && rowOf(doc, n));
  const det = credOnly ? drill(window, doc, credOnly) : null;
  check("C7: an institution with no noncredit share is never asked to attest", !!det && !det.querySelector("[data-ncattestopen]"));
}

// ── D. the CO's controls ─────────────────────────────────────────────────────
const FY = "2026-27";
const STANDING = { [COLLEGE]: { college: COLLEGE, fiscal_year: FY, status: "confirmed",
  coordinator_name: "Ana Ruiz", coordinator_title: "Noncredit CPL Coordinator", requested_at: "2026-10-25T04:00:00Z" } };
const REVIEW = [{ key: COLLEGE, college: COLLEGE, fiscal_year: FY, status: "confirmed", attestor_name: "Ben Ko",
  attestor_title: "NCDEAN", attestor_email: "ben@mtsac.edu", nc_awarded_count: 4, portfolio_course: "CCC000123",
  attested_exhibits: "EX-1", lead_types: ["staff", "administrator"], lead_assignment: "20% release fall and spring",
  lead_meets: "every two weeks", requested_at: "2026-10-25T04:00:00Z" }];
// D0. A waiting attestation (Sam, 2026-10-27): Accept confirms it and opens the
// confirmation email; Deny removes it, and the form returns.
{
  const waiting = JSON.parse(JSON.stringify(STANDING)); waiting[COLLEGE].status = "self_attested";
  const rev = JSON.parse(JSON.stringify(REVIEW)); rev[0].status = "self_attested";
  const { window, doc, T } = setup({ signedIn: true, elig: { ncAttestOk: true, ncAttest: waiting, ncAttestReview: rev } });
  const mails = [];
  window.CPL_FUNDING_OPEN_MAIL = function (href) { mails.push(href); };
  let det = drill(window, doc, COLLEGE);
  const acc = det && det.querySelector("[data-ncattestaccept]"), deny = det && det.querySelector("[data-ncattestdeny]");
  check("D0a: a waiting attestation offers a signed-in reviewer Accept and Deny, no Reject",
    !!acc && !!deny && acc.textContent === "Accept" && deny.textContent === "Deny" && !det.querySelector("[data-ncattestreject]"));
  click(window, acc);
  det = drill(window, doc, COLLEGE);
  check("D0b: Accept confirms it: the Lead's condition met, the share released, and Reject offered",
    T._ncAttest(COLLEGE).status === "confirmed" && T._alloc(COLLEGE).nc_gate_blocked === false &&
    /Noncredit CPL Lead published/.test(flat(det.querySelector(".cf-conds-nc"))) && !!det.querySelector("[data-ncattestreject]"));
  check("D0c: …and opens the confirmation email to the attestor, with the reply line",
    mails.length === 1 && mails[0].indexOf("mailto:ben%40mtsac.edu?") === 0 &&
    decodeURIComponent(mails[0]).indexOf("If you did not send this request, please reply to this email.") >= 0);
}
// D0r (S530; Sam, 2026-10-30: "a chip to the college rows showing that a confirmation has been submitted and a
// way for the MAP team to respond easily with an acceptance--same thing needed for the NC Lead attestation").
{
  const waiting = JSON.parse(JSON.stringify(STANDING)); waiting[COLLEGE].status = "self_attested";
  const rev = JSON.parse(JSON.stringify(REVIEW)); rev[0].status = "self_attested";
  const { window, doc, T } = setup({ signedIn: true, elig: { ncAttestOk: true, ncAttest: waiting, ncAttestReview: rev } });
  const mails = [];
  window.CPL_FUNDING_OPEN_MAIL = function (href) { mails.push(href); };
  const tr = rowOf(doc, COLLEGE);
  const word = tr && Array.from(tr.querySelectorAll("td.cf-inst .cf-waitchip")).find((s) => s.textContent === "NC Lead attestation submitted");
  const acc = tr && tr.querySelector("td.cf-inst [data-ncattestaccept]");
  check("D0r: the row says the Lead attestation was submitted and offers a reviewer Accept there",
    !!word && /Awaiting CPL Initiative Confirmation/.test(word.getAttribute("title")) &&
    !!acc && acc.textContent === "Accept" && /^Accept the Noncredit CPL Lead attestation for /.test(acc.getAttribute("aria-label")));
  if (acc) click(window, acc);
  check("D0s: the row's Accept confirms it and opens the email to the attestor; the row's word leaves",
    T._ncAttest(COLLEGE).status === "confirmed" && mails.length === 1 && mails[0].indexOf("mailto:ben%40mtsac.edu?") === 0 &&
    !rowOf(doc, COLLEGE).querySelector(".cf-waitchip"));
  const waiting2 = JSON.parse(JSON.stringify(STANDING)); waiting2[COLLEGE].status = "self_attested";
  const pub = setup({ public: true, elig: { ncAttestOk: true, ncAttest: waiting2 } });
  const ptr = rowOf(pub.doc, COLLEGE);
  check("D0t: the public row shows the submitted word and no Accept",
    !!ptr && Array.from(ptr.querySelectorAll(".cf-waitchip")).some((s) => s.textContent === "NC Lead attestation submitted") &&
    !ptr.querySelector("[data-ncattestaccept]"));
}
{
  const waiting = JSON.parse(JSON.stringify(STANDING)); waiting[COLLEGE].status = "self_attested";
  const { window, doc, T } = setup({ signedIn: true, elig: { ncAttestOk: true, ncAttest: waiting, ncAttestReview: REVIEW } });
  let det = drill(window, doc, COLLEGE);
  const deny = det && det.querySelector("[data-ncattestdeny]");
  if (deny) click(window, deny);
  det = drill(window, doc, COLLEGE);
  check("D0d: Deny removes it, and the college may attest again",
    !!deny && !T._ncAttest(COLLEGE) && !!det.querySelector("[data-ncattestopen]"));
}
{
  const { window, doc, T } = setup({ signedIn: true,
    elig: { ncAttestOk: true, ncAttest: JSON.parse(JSON.stringify(STANDING)), ncAttestReview: REVIEW } });
  let det = drill(window, doc, COLLEGE);
  const rows = det ? Array.from(det.querySelectorAll(".cf-conds .cplfund-corow")) : [];
  const nc = rows.find((r) => r.querySelector("[data-ncattestreject]"));
  check("D1: a signed-in reviewer reads who attested and what the college reported, with Reject alone",
    !!nc && /Noncredit attestation 2026-27 by Ben Ko \(NCDEAN\) · ben@mtsac\.edu/.test(flat(nc)) &&
    /4 former noncredit students awarded CPL/.test(flat(nc)) && /portfolio course CCC000123/.test(flat(nc)) &&
    /Lead: Staff, Administrator/.test(flat(nc)) && /assignment: 20% release fall and spring/.test(flat(nc)) &&
    /meets credit CPL colleagues every two weeks/.test(flat(nc)) &&
    nc.querySelectorAll("button").length === 1 && nc.querySelector("button").textContent === "Reject" &&
    !det.querySelector("[data-ncattestopen]"));
  click(window, nc.querySelector("[data-ncattestreject]"));
  det = drill(window, doc, COLLEGE);
  const nc2 = Array.from(det.querySelectorAll(".cf-conds .cplfund-corow")).find((r) => r.querySelector("[data-ncattestconfirm]"));
  check("D2: Reject holds the noncredit share and offers Re-confirm and Remove; the college reads that the CO rejected it",
    T._ncAttest(COLLEGE).status === "rejected" && T._alloc(COLLEGE).nc_gate_blocked === true &&
    !!nc2 && !!nc2.querySelector("[data-ncattestremove]") && !det.querySelector("[data-ncattestopen]") &&
    /rejected this college's noncredit attestation for 2026-27\. Contact the CO to re-open it\./.test(flat(det)));
  click(window, nc2.querySelector("[data-ncattestremove]"));
  det = drill(window, doc, COLLEGE);
  check("D3: Remove clears the row, so the college can attest again", !T._ncAttest(COLLEGE) && !!det.querySelector("[data-ncattestopen]"));
}
{
  const { window, doc } = setup({ public: true, signedIn: true,
    elig: { ncAttestOk: true, ncAttest: JSON.parse(JSON.stringify(STANDING)), ncAttestReview: REVIEW } });
  const det = drill(window, doc, COLLEGE);
  check("D4: the public page never shows the CO's controls or the attestor, even to a signed-in reviewer",
    !!det && !det.querySelector("[data-ncattestreject], [data-ncattestconfirm], [data-ncattestremove]") &&
    !/ben@mtsac\.edu|Ben Ko|former noncredit students awarded|20% release|every two weeks|Lead: Staff/.test(flat(det)) &&
    /Noncredit CPL Lead: Ana Ruiz/.test(flat(det)));
}
{
  const { window, doc } = setup({ public: true, elig: { ncAttestOk: true, ncAttest: {} } });
  const det = drill(window, doc, COLLEGE);
  check("D5: the public page offers the college its form", !!det && !!det.querySelector("[data-ncattestopen]"));
}

// ── E. How to meet it, for the two noncredit conditions (S471) ───────────────
{
  const { doc, T } = setup({ elig: { ncAttestOk: true, ncAttest: {} } });
  const kinds = T.howToKinds();
  check("E1: both noncredit conditions carry a How to meet it passage",
    kinds.indexOf("nc_coord") >= 0 && kinds.indexOf("nc_team") >= 0);
  T.howToOpen("nc_team", COLLEGE, {});
  const dlg = doc.getElementById("cplFundHowTo");
  check("E2: the strike-team passage opens for the college, naming the button the drill-in offers",
    !!dlg && /Attest for your noncredit CPL strike team/.test(dlg.textContent) &&
    /Attest for the noncredit share/.test(dlg.textContent));
  T.howToOpen("nc_coord", COLLEGE, {});
  check("E3: the Noncredit CPL Lead passage opens too",
    /Name and publish your Noncredit CPL Lead/.test(doc.getElementById("cplFundHowTo").textContent));
  const brief = fs.readFileSync(path.join(__dirname, "..", "college_briefing.js"), "utf8");
  const ncBlock = (brief.match(/cond\.ncItems\.forEach\(function \(it, i\) \{([\s\S]*?)\}\);/) || [])[1] || "";
  check("E4: the college panel's noncredit list offers How to meet it, as the main list does",
    /data-howto=/.test(ncBlock) && /kinds\.indexOf\(it\.kind\)/.test(ncBlock));
}

finish();
