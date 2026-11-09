// tests/cpl_funding_nc_lead_in_map.test.js
//
// THE NONCREDIT CPL LEAD ROLE IN MAP MEETS THE LEAD CONDITION (Sam, in session 2026-11-09, S622).
//
// "itpi just added the nc cpl lead role to the map users we pull ... we can start listing that role next to the
// priority requiring attestation of a nc cpl lead and complete the attestation for them if the nc cpl lead role is
// in map." His two calls, the same day: the role meets the Noncredit CPL Lead condition ALONE (the strike-team
// attestation still comes on the form), and the EXACT title only counts, with a near title flagged for a CSM.
//
// Guards the failure modes that matter:
//   1. The role meets the lead condition with no attestation on file, and nothing else.
//   2. A near title ("CPL Coordinator/Noncredit Lead") meets nothing.
//   3. A database that predates the column reads as "not in MAP": the condition falls back to the attestation.
//   4. NO NAME LEAVES THE DATABASE: the function answers booleans; its select list names no person column.
//   5. The words say where the lead was found, and the workspace record tells a CSM what to do with a near title.
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
  // A scenario that also shows the strike-team condition: the role meets the lead condition ALONE.
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared(Object.assign({ ncTeamHidden: false }, OUTCOMES));
  T._setElig({ coordOk: true, ncAttestOk: true, ncAttest: {}, ncLead: { Laney: true } });
  T.render();
  check("1f: where the strike-team condition shows, the role leaves it unmet and the share held",
    nc(T, "Laney", "nc_coord").met === true && !!nc(T, "Laney", "nc_team") && nc(T, "Laney", "nc_team").met === false &&
    T._conditions("Laney").ncBlocked === true);
  check("1g: and the Nudge still asks that college for the attestation",
    T._nudgeInstitutions().some((r) => r.key === "Laney" && r.missing.indexOf("nc") >= 0));
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
check("5d: the record says the role meets the Noncredit CPL Lead condition",
  /A Noncredit CPL Lead is on the college's MAP landing page, which meets the Noncredit CPL Lead condition\./.test(WS));
check("5e: a near title tells the CSM to ask for the role", /The MAP landing page lists a close title\. Ask the college to use the Noncredit CPL Lead role\./.test(WS));

finish();
