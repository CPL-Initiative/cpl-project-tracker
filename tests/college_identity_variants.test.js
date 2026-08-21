// My College — the contact join resolves through map_colleges.variants.
//
// WHY THIS TEST EXISTS
// --------------------
// Measured 2026-08-21 against the live database: TWO rows in
// map_college_contacts are keyed on a name with a TRAILING SPACE —
// "Cypress College " and "San Jose City College ". Both carry a real
// primary_contact_email and a named CPL coordinator, and NEITHER exact-matches
// map_colleges. So contactByName was built under a key nothing ever looked up,
// and both colleges rendered as having no CPL contact.
//
// ⭐ The failure mode is the dangerous one: a missing key is indistinguishable
// from a college that genuinely has no contact. Nothing throws, nothing logs,
// and the MAP Users worklist counts them among the blanks. It surfaced only
// because the identity crosswalk linted every observed name against every
// known identity — which is the whole argument for that artifact.
//
// ⚠ THE FIX IS THE JOIN, NOT THE DATA. map_college_contacts is rebuilt from MAP
// on the daily cron, so trimming the stored string puts the space back tomorrow,
// and a load must reproduce its source rather than improve it. map_colleges
// .variants (landed 2026-08-21, 118 of 128 rows) carries both trailing-space
// spellings, so the join can absorb the variance where it belongs.
//
// Run from repo root: `npm test` (or `node tests/college_identity_variants.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  return Promise.resolve()
    .then(fn)
    .catch((e) => check(label + " — driver threw: " + (e && e.message), false));
}

const SRC = fs.readFileSync("college_briefing.js", "utf8");
const JWT = "eyJhbGciOiJIUzI1NiJ9." + "x".repeat(60) + ".signature";

// Two colleges whose CONTACT row is spelled with a trailing space, exactly as
// the live table has them, plus a clean control.
const COLLEGES = [
  { college_id: 46, college_name: "Cypress College",
    variants: ["CYPRESS", "Cypress", "Cypress College "] },
  { college_id: 100, college_name: "San Jose City College",
    variants: ["SAN JOSE CITY", "San Jose City", "San Jose City College "] },
  { college_id: 23, college_name: "Cabrillo College", variants: ["CABRILLO", "Cabrillo"] },
  // A partner: variants is EMPTY BY DESIGN, and must not read as a failed load.
  { college_id: 133, college_name: "Futuro Health", variants: [] },
];
const CONTACTS = [
  { college: "Cypress College ", primary_contact_email: "cypress@x.edu", cpl_coordinator: "Jolena Grande" },
  { college: "San Jose City College ", primary_contact_email: "sjcc@x.edu", cpl_coordinator: "Maria Plancarte" },
  { college: "Cabrillo College", primary_contact_email: "cab@x.edu", cpl_coordinator: "A Curator" },
];

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="college-briefing-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  const urls = [];
  w.localStorage.setItem("cpl_sb", JSON.stringify({ access_token: JWT }));
  w.fetch = function (url) {
    const u = String(url);
    urls.push(u);
    let body = [];
    if (u.indexOf("/map_colleges") >= 0) body = opts.colleges || COLLEGES;
    else if (u.indexOf("/map_college_contacts") >= 0) body = opts.contacts || CONTACTS;
    else if (u.indexOf("/cpl_funding_config") >= 0) body = [{ config: {} }];
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
  };
  ["team_phrase.js", "college_briefing.js"].forEach(function (f) {
    const s = w.document.createElement("script");
    s.textContent = fs.readFileSync(f, "utf8");
    w.document.body.appendChild(s);
  });
  const M = w.CPL_COLLEGE_BRIEFING;
  M.activate(w.document.getElementById("college-briefing-root"));
  return { w, M, urls };
}
const settle = () => new Promise((r) => setTimeout(r, 0));

(async () => {
  // ── (1) The column is actually requested ────────────────────────────────
  check("(1) the map_colleges read asks for `variants`",
    /map_colleges\?select=college_id,college_name,variants/.test(SRC),
    "an explicit PostgREST select list is a second schema — a column not named is always undefined");

  // ── (2) ⭐ The trailing-space rows resolve ──────────────────────────────
  await block("(2)", async function () {
    const { M } = load();
    await settle(); await settle(); await settle();
    const raw = (M._state.data && M._state.data.raw) || {};
    const byName = raw.contactByName || {};
    check("(2) precondition: the load completed", !!M._state.data,
      "no data means every assertion below is vacuous");
    check("(2) ⭐ Cypress College resolves to its contact despite the trailing space",
      byName["Cypress College"] === "cypress@x.edu", JSON.stringify(byName));
    check("(2) ⭐ San Jose City College does too",
      byName["San Jose City College"] === "sjcc@x.edu", JSON.stringify(byName));
    check("(2) the clean control is unaffected", byName["Cabrillo College"] === "cab@x.edu");
    check("(2) the full contact ROW is reachable too, not just the email",
      ((raw.contactRowByName || {})["Cypress College"] || {}).cpl_coordinator === "Jolena Grande",
      "the worklist reads the row; fixing only the email index would half-fix it");
    // The original spelling must ALSO still resolve — something may key on it.
    check("(2) the raw spelling still resolves as well",
      byName["Cypress College "] === "cypress@x.edu");
  });

  // ── (3) ⚠ A variant must never shadow a real college's own row ──────────
  await block("(3)", async function () {
    // "Mission College" is a real college AND a plausible variant of another.
    const colleges = [
      { college_id: 82, college_name: "Mission College", variants: ["MISSION"] },
      { college_id: 71, college_name: "Los Angeles Mission College",
        variants: ["LA MISSION", "Mission College"] },   // ⚠ collides on purpose
    ];
    const contacts = [
      { college: "Mission College", primary_contact_email: "real-mission@x.edu" },
    ];
    const { M } = load({ colleges, contacts });
    await settle(); await settle(); await settle();
    const byName = ((M._state.data || {}).raw || {}).contactByName || {};
    check("(3) ⚠ the college that OWNS the name keeps its own contact",
      byName["Mission College"] === "real-mission@x.edu", JSON.stringify(byName));
    check("(3) ⚠ …and the contact does not leak onto the college that merely lists it as a variant",
      byName["Los Angeles Mission College"] === undefined,
      "a variant claiming another college's canonical name must lose; " +
      "silently attaching one college's coordinator to another is worse than a blank");
  });

  // ── (4) Empty and missing variants are safe ─────────────────────────────
  await block("(4)", async function () {
    const colleges = [
      { college_id: 133, college_name: "Futuro Health", variants: [] },
      { college_id: 23, college_name: "Cabrillo College" },   // column absent entirely
    ];
    const { M } = load({ colleges, contacts: [{ college: "Cabrillo College", primary_contact_email: "c@x.edu" }] });
    await settle(); await settle(); await settle();
    const raw = (M._state.data || {}).raw || {};
    check("(4) an EMPTY variants array does not break the load",
      !!M._state.data && (raw.contactByName || {})["Cabrillo College"] === "c@x.edu",
      "the two partner rows carry [] by design — empty is not a failed read");
    check("(4) a MISSING variants field does not throw either",
      Object.keys(raw.contactByName || {}).length >= 1);
  });

  // ── (3b) ⚠ A variant TWO colleges claim must resolve to NEITHER ─────────
  // The (3) guard only catches a variant equal to some college's CANONICAL name.
  // It is blind to the other collision — two colleges offering the SAME variant —
  // which used to be resolved "first writer wins", silently, in college_name
  // order. Harmless while every variant was district-qualified ("LA PIERCE");
  // live the moment campus short names exist, because FIVE colleges' names
  // reduce to "City College".
  await block("(3b)", async function () {
    const colleges = [
      { college_id: 69, college_name: "Los Angeles City College",
        variants: ["LA CITY", "City College"] },        // ⚠ both claim it
      { college_id: 96, college_name: "San Diego City College",
        variants: ["SAN DIEGO CITY", "City College"] }, // ⚠ on purpose
    ];
    const contacts = [
      { college: "City College", primary_contact_email: "ambiguous@x.edu" },
      { college: "SAN DIEGO CITY", primary_contact_email: "sd@x.edu" },
    ];
    const { M } = load({ colleges, contacts });
    await settle(); await settle(); await settle();
    const byName = ((M._state.data || {}).raw || {}).contactByName || {};
    check("(3b) ⚠ an ambiguous variant attaches to NEITHER college",
      byName["Los Angeles City College"] === undefined
      && byName["San Diego City College"] !== "ambiguous@x.edu",
      "first-writer-wins would have given LA City the row that names neither of "
      + "them; a confidently wrong CPL contact is worse than the blank. Got: "
      + JSON.stringify(byName));
    check("(3b) an UNAMBIGUOUS variant on the same rows still resolves",
      byName["San Diego City College"] === "sd@x.edu",
      "the guard must refuse only the contested name, not disable variant "
      + "resolution for the whole row");
  });

  // ── (3c) the builder refuses to MINT an ambiguous short name ────────────
  // The consumer guard above is the backstop. The builder is where the name is
  // decided, and its two screens are what keep "City College" out of the column
  // in the first place. Asserted against the committed source so the rule cannot
  // be quietly relaxed to "strip the district prefix and hope".
  {
    const py = fs.readFileSync("kb/_build_college_identity_crosswalk.py", "utf8");
    check("(3c) the builder screens ambiguous and degenerate campus shorts",
      /def campus_short_variants/.test(py)
      && /tok_count\[lead\] > 1/.test(py)
      && /_EMPTY_TAIL_LEAD/.test(py)
      && /shadows the canonical name/.test(py));
    check("(3c) the builder ships its REFUSALS, not just its accepts",
      /"refused": campus_refused/.test(py) && /campus_short_refused/.test(py),
      "a screen that silently drops candidates cannot be reviewed");
  }

  // ── (5) The data is not silently 'repaired' ─────────────────────────────
  check("(5) ⚠ the fix does not trim the contacts table",
    !/\.trim\(\)\s*\]\s*=/.test(SRC) && !/contactByName\[[^\]]*trim\(\)/.test(SRC),
    "map_college_contacts rebuilds from MAP nightly; a trim here is undone tomorrow " +
    "and a load must reproduce its source, not improve it");

  let pass = 0;
  for (const [name, ok, why] of results) {
    console.log((ok ? "  ok  " : "FAIL  ") + name + (!ok && why ? "\n        > " + why : ""));
    if (ok) pass++;
  }
  console.log("\ncollege_identity_variants.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
})();
