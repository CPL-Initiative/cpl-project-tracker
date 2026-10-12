// My College, the contact strategy for a public reader (S370 UI pass).
//
// "Ensure a CPL Coordinator and/or Counselor is listed and responsive" measured
// MAP's primary contact. A public reader reads map_college_contacts_pub, which
// carries the CPL coordinator, the CPL counselor and the landing page, and no
// primary contact. So every college read "No contact listed in MAP ... has
// nowhere to land" to the public, in high emphasis, beside a contacts table on
// the same page listing its coordinator ("2 of 2 roles filled").
//
// Guarded on the load, where it failed: a signed-out load of a public row with
// a coordinator measures that coordinator; a row with neither role still reads
// as none; a signed-in load still measures the primary contact.
//
// Run from repo root: `npm test` (or `node tests/my_college_public_contact.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const JWT = "eyJhbGciOiJIUzI1NiJ9." + "x".repeat(60) + ".signature";

const COLLEGES = [
  { college_id: 9, college_name: "Chaffey College", variants: [] },
  { college_id: 23, college_name: "Cabrillo College", variants: [] },
  { college_id: 46, college_name: "Cypress College", variants: [] },
];
// The public mirror's columns (information_schema, 2026-10-12): no primary contact.
const PUB = [
  { college: "Chaffey College", cpl_coordinator: "Pat Lee", cpl_coordinator_email: "coord@x.edu",
    cpl_counselor: "Jordan Cruz", cpl_counselor_email: "couns@x.edu", landing_page_url: "https://x.edu/cpl" },
  { college: "Cabrillo College", cpl_coordinator: null, cpl_coordinator_email: null,
    cpl_counselor: "Ana Ruiz", cpl_counselor_email: "ana@x.edu", landing_page_url: null },
  { college: "Cypress College", cpl_coordinator: null, cpl_coordinator_email: null,
    cpl_counselor: null, cpl_counselor_email: null, landing_page_url: null },
];
const BASE = [
  { college: "Chaffey College", primary_contact_email: "primary@x.edu", cpl_coordinator_email: "coord@x.edu" },
  { college: "Cypress College", primary_contact_email: null, cpl_coordinator_email: "cyp@x.edu" },
];

function load(signedIn) {
  const dom = new JSDOM('<!doctype html><html><body><div id="college-briefing-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  if (signedIn) w.localStorage.setItem("cpl_sb", JSON.stringify({ access_token: JWT }));
  const urls = [];
  w.fetch = function (url) {
    const u = String(url);
    urls.push(u);
    let body = [];
    if (u.indexOf("/map_colleges") >= 0) body = COLLEGES;
    else if (u.indexOf("/map_college_contacts_pub") >= 0) body = PUB;
    else if (u.indexOf("/map_college_contacts") >= 0) body = BASE;
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
const CONTACT = "Ensure a CPL Coordinator and/or Counselor is listed and responsive";

(async () => {
  // ── public ───────────────────────────────────────────────────────────────
  const pub = load(false);
  for (let i = 0; i < 4; i++) await settle();
  const M = pub.M, raw = ((M._state.data || {}).raw) || {};
  check("public: precondition, the load read the published mirror",
    !!M._state.data && pub.urls.some((u) => /map_college_contacts_pub\?/.test(u)));
  const by = raw.contactByName || {};
  check("public: a college whose mirror row names a coordinator is measured by that coordinator",
    by["Chaffey College"] === "coord@x.edu", JSON.stringify(by));
  check("public: a counselor alone counts, as the strategy says (and/or)",
    by["Cabrillo College"] === "ana@x.edu", JSON.stringify(by));
  check("public: a row with neither role still reads as none (the measure is not forced)",
    by["Cypress College"] === null && Object.prototype.hasOwnProperty.call(by, "Cypress College"));
  const col = { name: "Chaffey College", contactEmail: by["Chaffey College"], contactKnown: true };
  const m = M._measureFor(CONTACT, col);
  check("public: the strategy card no longer says No contact listed beside a listed coordinator",
    m && m.result && !/No contact listed/.test(m.result.headline) && /coord@x\.edu/.test(m.result.headline),
    JSON.stringify(m && m.result));

  // ── signed in: unchanged, the primary contact MAP routes on ───────────────
  const sig = load(true);
  for (let i = 0; i < 4; i++) await settle();
  const by2 = (((sig.M._state.data || {}).raw) || {}).contactByName || {};
  check("signed in: precondition, the load read the base table",
    sig.urls.some((u) => /map_college_contacts\?/.test(u)));
  check("signed in: still measures MAP's primary contact", by2["Chaffey College"] === "primary@x.edu", JSON.stringify(by2));
  check("signed in: a blank primary contact still reads as none",
    by2["Cypress College"] === null, JSON.stringify(by2));

  let pass = 0;
  for (const [name, ok, why] of results) {
    console.log((ok ? "  ok  " : "FAIL  ") + name + (!ok && why ? "\n        > " + why : ""));
    if (ok) pass++;
  }
  console.log("\nmy_college_public_contact.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
})();
