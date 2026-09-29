// tests/cpl_funding_first_condition.test.js
//
// Sheet 4, card 1 (Sam, 2026-09-29: "Check all three"). The first minimum
// condition has three parts, his words: "a CPL Coordinator assigned ... a CPL
// Primary contact ... the CPL college landing page configured." The tab's check
// read the coordinator alone, so six colleges with a coordinator but no primary
// contact in MAP read as meeting it.
//
// map_coordinator_summary() now answers each part as a boolean, never a name,
// so the public page and the reviewer's tab run the same check. These checks
// guard the failure the card names (a college missing a part reads as meeting
// the condition) and the transition (an RPC that predates the new columns falls
// back to the coordinator alone rather than failing every college).
//
// The harness loads no short-name map, so a row names the college as the roster does.
// Run from repo root: `node tests/cpl_funding_first_condition.test.js`.
const fs = require("fs");
const path = require("path");
const H = require("./lib/cpl_funding_harness.js");
const { check, finish, freshDom, boot, consumerSrc, openDrill } = H;

const ROW = (college, parts) => Object.assign({ college: college, has_coordinator: true,
  has_primary_contact: true, has_landing_page: true, last_synced: "2026-09-29T00:00:00Z" }, parts || {});

function condWords(window, doc, id) {
  const d = openDrill(window, doc, id);
  const c = d.first ? Array.from(d.first.querySelectorAll(".cf-cond")) : [];
  return c.length ? c[0].textContent : "";
}

{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setElig({ coordRows: [
    ROW("Laney"),
    ROW("Berkeley City", { has_primary_contact: false }),
    ROW("Alameda", { has_landing_page: false }),
    ROW("Merritt", { has_coordinator: false }),
  ] });
  T.render();
  const gate = (n) => T._alloc(n).gate_missing || [];
  check("1a: all three parts on file meets the first condition",
    !gate("Laney").some((m) => /Coordinator/i.test(m)));
  check("1b: a coordinator without a primary CPL contact does not meet it",
    gate("Berkeley City").some((m) => /Coordinator/i.test(m)));
  check("1c: a coordinator and contact without a configured landing page does not meet it",
    gate("Alameda").some((m) => /Coordinator/i.test(m)));
  check("1d: no coordinator does not meet it",
    gate("Merritt").some((m) => /Coordinator/i.test(m)));
  check("1e: the unmet line names the missing part: the primary contact",
    /Primary CPL contact not yet on file/.test(condWords(window, doc, "c:Berkeley City")));
  check("1f: ...the landing page",
    /CPL landing page not yet configured/.test(condWords(window, doc, "c:Alameda")));
  check("1g: ...or the coordinator",
    /Coordinator not yet on file/.test(condWords(window, doc, "c:Merritt")));
  check("1h: the met line keeps its words",
    /Coordinator on file/.test(condWords(window, doc, "c:Laney")));
}

{
  // An RPC deployed before the two columns: the check reads the coordinator alone.
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setElig({ coordRows: [{ college: "Laney", has_coordinator: true },
                           { college: "Merritt", has_coordinator: false }] });
  T.render();
  const gate = (n) => T._alloc(n).gate_missing || [];
  check("2a: without the new columns a coordinator alone still meets the condition",
    !gate("Laney").some((m) => /Coordinator/i.test(m)) && gate("Merritt").some((m) => /Coordinator/i.test(m)));
}

{
  // Two MAP rows for one college (Calbright): either row meeting all three meets it.
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setElig({ coordRows: [ROW("Calbright College Non-Credit", { has_primary_contact: false }),
                           ROW("Calbright College Credit")] });
  T.render();
  check("3a: Calbright meets the condition when either of its rows carries all three parts",
    !(T._alloc("Calbright").gate_missing || []).some((m) => /Coordinator/i.test(m)));
}

// The RPC's SQL source answers all three parts as booleans and keeps its grant.
const sql = fs.readFileSync(path.join(__dirname, "..", "map", "supabase_map_contacts.sql"), "utf8");
check("4a: map_coordinator_summary() returns the three booleans and no name",
  /returns table \(college text, has_coordinator boolean, has_primary_contact boolean,\s*has_landing_page boolean, last_synced timestamptz\)/.test(sql)
    && !/returns table[^)]*primary_contact text/.test(sql));
check("4b: the function keeps its execute grant after the drop and recreate",
  /drop function if exists public\.map_coordinator_summary\(\);[\s\S]*grant execute on function public\.map_coordinator_summary\(\) to anon, authenticated, service_role;/.test(sql));
check("4c: the tab reads the two new booleans through one ingestion path",
  /function coordPartMissing\(row\)/.test(consumerSrc) && /ingestCoord\(coord, roster\)/.test(consumerSrc));

finish();
