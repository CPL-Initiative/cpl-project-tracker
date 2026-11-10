// tests/cpl_funding_nc_lead_in_map.test.js
//
// THE NONCREDIT CPL LEAD ROLE IN MAP MEETS THE LEAD CONDITION (Sam, in session 2026-11-09, S622).
//
// "itpi just added the nc cpl lead role to the map users we pull ... we can start listing that role next to the
// priority requiring attestation of a nc cpl lead and complete the attestation for them if the nc cpl lead role is
// in map." The EXACT title only counts, with a near title flagged for a CSM. The role stands in for the WHOLE
// noncredit attestation, the strike-team condition included, with no form (Sam, in session 2026-11-10: "Nc yes
// exact wor whole", then "Word"; the 2026-11-09 build had the role meet the lead condition alone).
//
// Guards the failure modes that matter:
//   1. The role meets the lead condition with no attestation on file, and the strike-team condition where shown.
//   2. A near title ("CPL Coordinator/Noncredit Lead") meets nothing.
//   3. A database that predates the column reads as "not in MAP": the condition falls back to the attestation.
//   4. NO NAME LEAVES THE DATABASE: the function answers booleans; its select list names no person column.
//   5. The words say where the lead was found, and the workspace record tells a CSM what to do with a near title.
//   6. A college with the role is offered no form, counts as attested in the filter, and a form it left waiting
//      shows no chip; a college without the role keeps all three.
//
// Run from repo root: `npm test` (or `node --max-old-space-size=12288 tests/cpl_funding_nc_lead_in_map.test.js`).
const fs = require("fs");
const path = require("path");
const H = require("./lib/cpl_funding_harness.js");
const { check, freshDom, boot, finish } = H;

const ROOT = path.join(__dirname, "..");
const MIG = fs.readFileSync(path.join(ROOT, "kb/migrations/2026-11-09_nc_cpl_lead_in_map.sql"), "utf8");
const BACK = fs.readFileSync(path.join(ROOT, "kb/migrations/2026-11-09_nc_cpl_lead_in_map_rollback.sql"), "utf8");
const SRCSQL = fs.readFileSync(path.join(ROOT, "map/supabase_map_contacts.sql"), "utf8");
const WS = fs.readFileSync(path.join(ROOT, "csm_workspace.js"), "utf8");

const OUTCOMES = { ncLane: "outcomes", ncOutcomes: { "1": [
  { key: "exh", title: "Exhibits built or adopted", share: 0.5, goals: ["A"], unit_word: "exhibits", metric: "Exhibits", metric_src: "nc_exh",
    target_rule: { kind: "pct_floor_cap", of: "nc_cdcp", pct: 0.05, floor: 2, cap: 10 } },
  { key: "course", title: "A noncredit CPL course", share: 0.5, goals: ["A"], unit_word: "courses", metric: "A course", metric_src: "nc_course",
    target_rule: { kind: "fixed", n: 1 } }] } };
const ROW = (college, o) => Object.assign({ college, has_coordinator: true, has_primary_contact: true, has_landing_page: true }, o || {});
const nc = (T, name, kind) => T._conditions(name).ncItems.find((i) => i.kind === kind);

function make(elig) {
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared(OUTCOMES);
  T._setElig(Object.assign({ coordOk: true, ncAttestOk: true, ncAttest: {} }, elig));
  T.render();
  return { window, doc, T };
}

// ── 1 and 2. the role, a near title, and neither ──────────────────────────────────────────────────────────────
{
  // Participation is confirmed for both, so the lead is the one thing that differs between them.
  const { T } = make({ optin: { Laney: true, Alameda: true }, coordRows: [
    ROW("Laney", { has_nc_cpl_lead: true }),
    ROW("Merritt", { nc_lead_title_near: true }),
    ROW("Alameda", { has_nc_cpl_lead: false, nc_lead_title_near: false }),
    ROW("Berkeley City") ] });           // a row from a database that predates the two columns
  check("1a: fixture: these colleges carry the noncredit share's lead condition",
    ["Laney", "Merritt", "Alameda", "Berkeley City"].every((k) => !!nc(T, k, "nc_coord")));
  check("1b: the role in MAP meets the Noncredit CPL Lead condition with no attestation on file",
    nc(T, "Laney", "nc_coord").met === true && nc(T, "Laney", "nc_coord").pending === false);
  check("1c: with the lead met and no other noncredit condition shown, the noncredit share is no longer held; without the role it is",
    T._conditions("Laney").ncBlocked === false && T._conditions("Alameda").ncBlocked === true);
  const nudged = T._nudgeInstitutions().filter((r) => r.missing.indexOf("nc") >= 0).map((r) => r.key);
  check("1e: the Nudge stops asking a college whose noncredit condition is met from MAP, and still asks the others",
    nudged.indexOf("Laney") < 0 && nudged.indexOf("Alameda") >= 0 && nudged.indexOf("Merritt") >= 0);
  check("2a: a near title meets nothing", nc(T, "Merritt", "nc_coord").met === false);
  check("2b: no role, no near title: unmet, as before", nc(T, "Alameda", "nc_coord").met === false);
  check("3a: a row without the two columns reads as not in MAP and breaks nothing", nc(T, "Berkeley City", "nc_coord").met === false);
  const snap = T.csm.snapshot();
  const row = (k) => snap.rows.find((r) => r.key === k);
  check("5a: the workspace's snapshot says which is which",
    row("Laney").nc.lead === true && row("Laney").nc.leadNear === false &&
    row("Merritt").nc.lead === false && row("Merritt").nc.leadNear === true &&
    row("Alameda").nc.lead === false && row("Alameda").nc.leadNear === false);
}

// ── an attestation still meets it the first way, and the words say which way ──────────────────────────────────
{
  const att = { college: "Alameda", status: "confirmed", fiscal_year: "2026-27", coordinator_name: "A lead", requested_at: "2026-11-02T04:00:00Z" };
  const { doc, window, T } = make({ ncAttest: { Alameda: att }, ncLead: { Laney: true } });
  check("1d: an accepted attestation that names the lead still meets the condition", nc(T, "Alameda", "nc_coord").met === true);
  const open = (name) => {
    const r = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find((x) => x.textContent.indexOf(name) !== -1);
    r.querySelector(".cplfund-caret").dispatchEvent(new window.Event("click", { bubbles: true }));
    const det = doc.querySelector("tr.cplfund-detail");
    return det ? det.textContent.replace(/\s+/g, " ") : "";
  };
  const laney = open("Laney");
  check("5b: the condition's words say the lead is in MAP", /Noncredit CPL Lead in MAP/.test(laney));
}
{
  // A scenario that also shows the strike-team condition: the role meets it too (Sam, 2026-11-10).
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared(Object.assign({ ncTeamHidden: false }, OUTCOMES));
  T._setElig({ coordOk: true, ncAttestOk: true, ncAttest: {}, ncLead: { Laney: true }, optin: { Laney: true, Alameda: true } });
  T.render();
  check("1f: where the strike-team condition shows, the role meets it too and the share is no longer held",
    nc(T, "Laney", "nc_coord").met === true && !!nc(T, "Laney", "nc_team") && nc(T, "Laney", "nc_team").met === true &&
    nc(T, "Laney", "nc_team").pending === false && T._conditions("Laney").ncBlocked === false);
  check("1g: and the Nudge no longer asks that college for the attestation, and still asks one without the role",
    !T._nudgeInstitutions().some((r) => r.key === "Laney" && r.missing.indexOf("nc") >= 0) &&
    T._nudgeInstitutions().some((r) => r.key === "Alameda" && r.missing.indexOf("nc") >= 0));
  check("1h: without the role the strike-team condition still waits on an accepted attestation",
    nc(T, "Alameda", "nc_team").met === false && T._conditions("Alameda").ncBlocked === true);
  const r = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find((x) => x.textContent.indexOf("Laney") !== -1);
  r.querySelector(".cplfund-caret").dispatchEvent(new window.Event("click", { bubbles: true }));
  const det = doc.querySelector("tr.cplfund-detail");
  check("5c: the strike-team condition's words say the lead is in MAP, and nothing reads not yet on file",
    !!det && (det.textContent.match(/Noncredit CPL Lead in MAP/g) || []).length === 2 &&
    !/Strike-team attestation not yet on file/.test(det.textContent));
}

// ── 6. no form, the filter, and a form left waiting ───────────────────────────────────────────────────────────
{
  const waiting = (college) => ({ college, status: "self_attested", fiscal_year: "2026-27", coordinator_name: "A lead", requested_at: "2026-11-02T04:00:00Z" });
  const { doc, window } = make({ ncLead: { Laney: true }, ncAttest: { Laney: waiting("Laney"), Merritt: waiting("Merritt") } });
  const rowOf = (name) => Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find((x) => x.textContent.indexOf(name) !== -1);
  const chip = (name) => { const tr = rowOf(name); return !!tr && Array.from(tr.querySelectorAll(".cf-waitchip")).some((x) => x.textContent === "NC Lead attestation submitted"); };
  check("6a: a form left waiting shows no chip where the role is in MAP, and still shows where it is not",
    !!rowOf("Laney") && chip("Laney") === false && chip("Merritt") === true);
}
{
  const { doc, window } = make({ ncLead: { Laney: true } });
  const sel = doc.getElementById("cplFundCondFilter");
  const names = (val) => {
    const el = doc.getElementById("cplFundCondFilter");
    el.value = val; el.dispatchEvent(new window.Event("change", { bubbles: true }));
    return Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).map((x) => x.textContent);
  };
  const has = (rows, name) => rows.some((t) => t.indexOf(name) !== -1);
  check("6b: fixture: the filter is on the page", !!sel);
  const yes = names("nc_yes"), no = names("nc_no");
  check("6c: the filter counts the role as attested, with no attestation on file",
    has(yes, "Laney") && !has(yes, "Alameda") && !has(no, "Laney") && has(no, "Alameda"));
  names("");
  {
    // The attestations have not loaded: nobody is in either list, the role colleges included.
    const m = make({ ncAttestOk: false, ncAttest: null, ncLead: { Laney: true } });   // the hook reads a given ncAttest as loaded
    const pick = (val) => { const el = m.doc.getElementById("cplFundCondFilter"); el.value = val;
      el.dispatchEvent(new m.window.Event("change", { bubbles: true }));
      return m.doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row").length; };
    check("6f: while the attestations load, neither filter choice lists anyone", pick("nc_yes") === 0 && pick("nc_no") === 0);
  }
  const open = (name) => {
    const r = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find((x) => x.textContent.indexOf(name) !== -1);
    r.querySelector(".cplfund-caret").dispatchEvent(new window.Event("click", { bubbles: true }));
    const again = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find((x) => x.textContent.indexOf(name) !== -1);
    const det = again && again.nextElementSibling;
    return det && det.classList.contains("cplfund-detail") ? det : null;
  };
  const laney = open("Laney");
  check("6d: a college with the role is offered no attestation form", !!laney && !laney.querySelector("[data-ncattestopen]"));
  const alameda = open("Alameda");
  check("6e: a college without it still is", !!alameda && !!alameda.querySelector("[data-ncattestopen]"));
}

// ── 4. the database answers booleans ──────────────────────────────────────────────────────────────────────────
const fn = (MIG.match(/create function public\.map_coordinator_summary\(\)[\s\S]*?\$\$;/) || [""])[0];
check("4a: the function returns the two new columns as booleans, after the six it had",
  /has_cpl_assistant boolean,\s*has_nc_cpl_lead boolean, nc_lead_title_near boolean\)/.test(fn));
check("4b: its select list names no person column (no name, no address, no title text)",
  !/\bl\.contact_(name|email)/.test(fn) && !/\bl\.contact_title\s*(,|as\b)/i.test(fn) &&
  (fn.match(/exists \(select 1 from public\.map_landing_contacts l/g) || []).length === 2);
check("4c: the role is the exact title, in any case; a near title names noncredit and is not the role",
  /lower\(trim\(l\.contact_title\)\) = 'noncredit cpl lead'\) as has_nc_cpl_lead/.test(fn) &&
  /l\.contact_title ~\* 'non-\?credit'\s*and lower\(trim\(l\.contact_title\)\) <> 'noncredit cpl lead'\) as nc_lead_title_near/.test(fn));
check("4d: PUBLIC's default EXECUTE is revoked, then the three roles that read it are granted",
  /revoke all on function public\.map_coordinator_summary\(\) from public;\s*grant execute on function public\.map_coordinator_summary\(\) to anon, authenticated, service_role;/.test(MIG));
check("4e: the source of truth carries the same function", SRCSQL.indexOf(fn) >= 0);
check("4f: the rollback restores the six-column function and its grant",
  /has_cpl_assistant boolean\)\s*language sql/.test(BACK) && !/has_nc_cpl_lead boolean/.test(BACK) &&
  /grant execute on function public\.map_coordinator_summary\(\) to anon, authenticated, service_role;/.test(BACK));

// ── 5. the workspace record ───────────────────────────────────────────────────────────────────────────────────
check("5d: the record says the role stands in for the attestation, and a college with the role is never told not yet attested",
  // The record's conditions are a table since the clarity mock's build (S624): the role reads Met with its reason, and
  // the row tests the role before it can say the lead is not yet in MAP or attested.
  /r\.nc\.lead \? "The role is on the college's MAP landing page, which stands in for the attestation\."/.test(WS) &&
  /r\.nc\.lead \? "The role is on[^\n]*\n(?:[^\n]*\n){0,4}[^\n]*"Not yet in MAP, and not yet attested\."/.test(WS) &&
  /stWord\(ncMet\(r\), false, ncWaiting\(r\)\)/.test(WS));
check("5e: a near title tells the CSM to ask for the role", /The MAP landing page lists a close title\. Ask the college to use the Noncredit CPL Lead role\./.test(WS));

finish();
