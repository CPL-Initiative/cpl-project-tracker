// tests/cpl_funding_round8.test.js
//
// Round 8 of the College Dashboard (Sam, 2026-09-29), approved from the mockup
// ("mockup looks good!"). His three asks, verbatim:
//   1. "Gray out the Curr Funds and FTES until the 3 conditions are met--explain
//      why gray on the label hover overs."
//   2. "Line up and use the same column fields in drill down as the college row.
//      Gray the curr drill down columns in the same way as rows until conditions
//      met"
//   3. "Show the CPL contact name in small font under the indicator that the
//      condition was met", then: a CPL Coordinator assigned, a CPL Primary
//      contact ("it's OK is the same name is listed twice"), and the landing
//      page "configured" ("need the link to it next to the names").
//
// These checks guard the failure each ask names: a gated institution whose
// Curr figures read like qualified funding, a drill-in whose figures sit under
// the wrong heads, and a public page that shows the directory's primary
// contact, which only signed-in reviewers read.
//
// Run from repo root: `node tests/cpl_funding_round8.test.js`.
const H = require("./lib/cpl_funding_harness.js");
const { check, finish, freshDom, boot, consumerSrc, colKeys, readCells, rowById, openDrill } = H;

const CURR = ["cr_current", "nc_current", "current_total"];
const DASH = "—";

// ── 1 and 2: gray Curr figures, on the rows and in the drill-in ─────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  // Laney meets every condition; Berkeley City lacks the participation request.
  T._setElig({ coordOk: true, coord: { "Laney": true, "Berkeley City": true }, optin: { "Laney": true } });
  T.render();
  check("setup: Berkeley City is gated and Laney is not",
    T._alloc("Berkeley City").gate_blocked === true && !T._alloc("Laney").gate_blocked);

  const keys = colKeys(doc);
  const cellsOf = (id) => { const tr = rowById(doc, id); return tr ? readCells(keys, tr) : {}; };
  const held = cellsOf("c:Berkeley City"), met = cellsOf("c:Laney");
  check("1a: a gated institution's Curr CR, Curr NC and Curr Total cells read gray",
    CURR.every((k) => held[k] && held[k].gated));
  check("1b: a qualified institution's Curr cells do not",
    CURR.every((k) => met[k] && !met[k].gated));
  check("1c: the Max cells never read gray",
    ["cr_award", "nc_award", "total"].every((k) => held[k] && !held[k].gated));
  check("1d: a gray cell's own hover says why it is gray",
    CURR.every((k) => /Gray until the institution meets all its minimum conditions, and available once it meets them\./.test(held[k].tip)));
  check("1e: a qualified cell's hover carries no gray words",
    CURR.every((k) => !/Gray until/.test(met[k].tip)));
  const head = (k) => doc.querySelector('#cplFundTable thead th[data-sort="' + k + '"]');
  check("1f: each Curr header's hover explains the gray",
    CURR.every((k) => head(k) && /A gray figure means the institution has yet to meet all its minimum conditions; it shows the funding its measures compute to, available once it meets them\./
      .test(head(k).getAttribute("title") || "")));
  check("1g: the gray is the text-muted token, the lightest gray that stays AA-readable",
    /\.cf-gated[^{]*\{[^}]*color:\s*var\(--text-muted/.test(consumerSrc));

  const dHeld = openDrill(window, doc, "c:Berkeley City");
  check("2a: each priority is a row of the table, one cell per column and no colspan",
    dHeld.rows.length > 0 && dHeld.rows.every((r) => r.cells.length === keys.length &&
      !Array.from(r.cells).some((td) => td.colSpan > 1)));
  check("2b: a header band heads the same columns",
    !!dHeld.band && dHeld.band.cells.length === keys.length);
  check("2c: the band names each figure's column in the row's own words",
    !!dHeld.bandCells && /^Max CR Funds$/.test(dHeld.bandCells.cr_award.text) &&
    /CR Funds$/.test(dHeld.bandCells.cr_current.text) && /^Total Funds$/.test(dHeld.bandCells.total.text));
  check("2d: a gated institution's drill-in Curr cells read gray, as its row does",
    dHeld.cells.every((c) => CURR.every((k) => c[k] && (c[k].text === DASH || c[k].gated))));
  check("2e: each drill-in Curr figure carries its Actual FTES beneath it",
    dHeld.cells.every((c) => c.cr_current && c.cr_current.line !== ""));
  const dMet = openDrill(window, doc, "c:Laney");
  check("2f: a qualified institution's drill-in Curr cells do not read gray",
    dMet.cells.length > 0 && dMet.cells.every((c) => CURR.every((k) => c[k] && !c[k].gated)));
  check("2g: the lane tables of 2026-09-24 are gone",
    !doc.querySelector(".cplfund-dtl-table"));
}

// ── 3: the people behind the first condition ────────────────────────────────
// The harness loads no short-name map (college_short_names.js), so a
// directory row names the college as the roster does.
const LANEY = { college: "Laney", cpl_coordinator: "Pat Rivera",
  primary_contact: "Pat Rivera", landing_page_url: "https://laney.edu/cpl" };
function whoOf(window, doc) {
  const d = openDrill(window, doc, "c:Laney");
  return d.first ? d.first.querySelector(".cf-met .cf-cond-who") : null;
}
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setElig({ coordOk: true, coord: { "Laney": true }, optin: { "Laney": true }, contacts: [LANEY] });
  T.render();
  const who = whoOf(window, doc);
  check("3a: under the met first condition: the CPL Coordinator",
    !!who && /CPL Coordinator: Pat Rivera/.test(who.textContent));
  check("3b: ...the primary CPL contact, even when it is the same name",
    !!who && /Primary CPL contact: Pat Rivera/.test(who.textContent));
  check("3c: ...and a link to the configured landing page, next to the names",
    !!who && !!who.querySelector('a[href="https://laney.edu/cpl"][target="_blank"][rel="noopener"]'));

  T._setElig({ coordOk: true, coord: { "Laney": true }, optin: { "Laney": true },
    contacts: [Object.assign({}, LANEY, { landing_page_url: "javascript:alert(1)" })] });
  T.render();
  const bad = whoOf(window, doc);
  check("3d: a landing page that is not an https URL never becomes a link",
    !!bad && !bad.querySelector("a") && /CPL landing page: none configured in MAP/.test(bad.textContent));

  T._setElig({ coordOk: true, coord: { "Laney": true }, optin: { "Laney": true },
    contacts: [{ college: "Laney", cpl_coordinator: "Pat Rivera", landing_page_url: "https://laney.edu/cpl" }] });
  T.render();
  const mirror = whoOf(window, doc);
  check("3e: from the published mirror (no primary_contact column) the line names the coordinator and the page alone",
    !!mirror && /CPL Coordinator: Pat Rivera/.test(mirror.textContent) && !/Primary CPL contact/.test(mirror.textContent));
}
{
  const { window } = freshDom();
  window.CPL_FUNDING_PUBLIC = true;
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setElig({ coordOk: true, coord: { "Laney": true }, optin: { "Laney": true }, contacts: [LANEY] });
  T.render();
  const pub = whoOf(window, doc);
  check("3f: a public page never shows the primary contact, even from a directory row",
    !pub || !/Primary CPL contact/.test(pub.textContent));
}
check("3g: a public page never asks the directory: only a signed-in reviewer's tab reads map_college_contacts",
  /\(!publicMode\(\) && reviewerSession\(\)\s*\? fetch\(CONTACTS_URL/.test(consumerSrc) &&
  /return fetch\(CONTACTS_PUB_URL/.test(consumerSrc));

finish();
