// MAP Users resolves colleges through the TAXONOMY, not through name strings.
//
// ⭐ WHY. Sam, 2026-09-11: "College taxonomy should be wired to the MAP Users tab
// and data as well. I'm sure it already is..." It was not. Every lookup in this
// tab keyed on the college NAME AS TEXT — the roster read, the contacts read, and
// three hand-written lists of 95 names — with only normCollege() to absorb drift.
//
// ⚠ AND IT WORKED, WHICH IS THE PROBLEM. Measured the same day: all 128 names in
// map_college_users match a canonical map_colleges.college_name exactly, and 74 of
// the 78 distinct hand-written keys do too. Nothing was broken. It worked because
// MAP happens to spell things canonically, and nothing enforced that it keeps
// doing so. These checks exist so the wiring is the thing that holds, not the luck.
//
// What normCollege can never do is bridge a VARIANT to its canonical name: "San
// Diego College of Continuing Education Credit" and "…Continuing Education"
// normalize to different strings, and only map_colleges.variants knows they are
// one institution.
//
// Run from repo root: `npm test` (or `node tests/map_users_taxonomy.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const SRC = fs.readFileSync("map_users.js", "utf8");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

// A cut of the real map_colleges, including the three cases that matter.
const ROWS = [
  { college_id: 82, college_name: "Mission College", district: "West Valley-Mission Community College District",
    mis_district_code: "490", mis_college_code: "492", variants: ["MISSION", "Mission"], entity_kind: "college" },
  { college_id: 71, college_name: "Los Angeles Mission College", district: "Los Angeles Community College District",
    mis_district_code: "740", mis_college_code: "743", variants: ["LA MISSION", "LA Mission", "Mission College"],
    entity_kind: "college" },
  { college_id: 46, college_name: "Cypress College", district: "North Orange County Community College District",
    mis_district_code: "860", mis_college_code: "861", variants: ["CYPRESS", "Cypress", "Cypress College "],
    entity_kind: "college" },
  { college_id: 200, college_name: "San Diego College of Continuing Education", district: null,
    mis_district_code: "070", mis_college_code: "076",
    variants: ["San Diego Adult", "San Diego College of Continuing Education Credit"],
    entity_kind: "continuing_education" },
  { college_id: 201, college_name: "Calbright College Non-Credit", district: null,
    mis_district_code: null, mis_college_code: null, variants: ["CALBRIGHT", "Calbright College"],
    entity_kind: "college" },
];

function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><body><div id="map-users-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.__fetches = [];
  w.fetch = function (url) {
    w.__fetches.push(String(url));
    if (opts.failTaxonomy && String(url).indexOf("/map_colleges?") >= 0) {
      return Promise.resolve({ ok: false, status: 401, json: function () { return Promise.resolve([]); } });
    }
    if (String(url).indexOf("/map_colleges?") >= 0) {
      return Promise.resolve({ ok: true, json: function () { return Promise.resolve(opts.rows || ROWS); } });
    }
    if (String(url).indexOf("/map_college_contacts?") >= 0) {
      return Promise.resolve({ ok: true, json: function () { return Promise.resolve(opts.contacts || []); } });
    }
    return Promise.resolve({ ok: true, json: function () { return Promise.resolve([]); } });
  };
  const el = w.document.createElement("script");
  el.textContent = SRC;
  w.document.body.appendChild(el);
  return w;
}

function ready(opts) {
  const w = makeWin(opts);
  return w.CPL_MAP_USERS_TAB._loadTaxonomy().then(function () { return w; });
}

const tests = [];

// ── 1. It resolves — canonical, variant, and the whitespace case ────────────
tests.push(ready().then(function (w) {
  const M = w.CPL_MAP_USERS_TAB;
  block("1. resolution", () => {
    check("(1) the taxonomy loaded", M._taxonomy.status === "ok" && M._taxonomy.count === ROWS.length,
      "status=" + M._taxonomy.status + " count=" + M._taxonomy.count);
    check("(1) a canonical name resolves to itself",
      (M._identityFor("Cypress College") || {}).canonical === "Cypress College");
    check("(1) ⭐ a VARIANT resolves to its canonical — what normCollege can never do",
      (M._identityFor("San Diego College of Continuing Education Credit") || {}).canonical
        === "San Diego College of Continuing Education",
      "the two normalize to different strings; only map_colleges.variants joins them");
    check("(1) a trailing-space name resolves",
      (M._identityFor("Cypress College ") || {}).canonical === "Cypress College");
    check("(1) ⚠ an unknown name resolves to NOTHING, and that is a result",
      M._identityFor("Calbright College Credit") === null,
      "MAP has not issued it an id; inventing one fabricates an identity the system trusts");
    check("(1) the identity carries more than a name",
      (M._identityFor("Cypress College") || {}).college_id === 46
        && (M._identityFor("Cypress College") || {}).mis === "860/861");
  });
}));

// ── 2. ⚠ A VARIANT MUST NEVER SHADOW A CANONICAL NAME ──────────────────────
// "Mission College" is both: its own college, and a variant of LA Mission.
tests.push(ready().then(function (w) {
  const M = w.CPL_MAP_USERS_TAB;
  block("2. no shadowing (canonical first in payload)", () => {
    check("(2) ⭐ 'Mission College' is Mission College, not LA Mission",
      (M._identityFor("Mission College") || {}).college_id === 82,
      "got " + JSON.stringify((M._identityFor("Mission College") || {}).canonical));
  });
}));
tests.push(ready({ rows: ROWS.slice().reverse() }).then(function (w) {
  const M = w.CPL_MAP_USERS_TAB;
  block("2b. no shadowing (payload order REVERSED)", () => {
    check("(2) ⭐ …and payload order cannot change that",
      (M._identityFor("Mission College") || {}).college_id === 82,
      "reversed order gave " + JSON.stringify((M._identityFor("Mission College") || {}).canonical)
        + " — the index must build canonicals in their own pass first");
  });
}));

// ── 3. The queries ask for every spelling ──────────────────────────────────
tests.push(ready().then(function (w) {
  const M = w.CPL_MAP_USERS_TAB;
  block("3. queries", () => {
    const sp = M._spellingsFor("San Diego College of Continuing Education");
    check("(3) spellingsFor returns canonical + variants", sp.length === 3 && sp[0] === "San Diego College of Continuing Education");
    check("(3) an unresolved name yields just itself — the query is unchanged",
      JSON.stringify(M._spellingsFor("Calbright College Credit")) === '["Calbright College Credit"]');
    check("(3) inList quotes values so a comma in a name is not a separator",
      M._inList(['A, Inc', 'B']) === 'in.("A, Inc","B")', M._inList(['A, Inc', 'B']));
    check("(3) …and escapes a quote", M._inList(['He said "hi"']).indexOf('\\"hi\\"') > 0,
      M._inList(['He said "hi"']));
  });
}));

// ── 4. ⭐ Contacts merge across spellings — canonical wins, variant fills ───
tests.push(ready({ contacts: [
  { college: "San Diego College of Continuing Education", primary_contact: "Shelly Hess",
    primary_contact_email: "shess@sdccd.edu", landing_page_url: "" },
  { college: "San Diego College of Continuing Education Credit", primary_contact: "",
    primary_contact_email: "", landing_page_url: "https://map.rccd.edu/cpl-student-portal/SDCC" },
] }).then(function (w) {
  const M = w.CPL_MAP_USERS_TAB;
  return M._loadContacts("San Diego College of Continuing Education").then(function (row) {
    block("4. contacts merge", () => {
      check("(4) canonical wins the fields it fills", row && row.primary_contact === "Shelly Hess");
      check("(4) ⭐ the variant supplies what canonical left empty",
        row && row.landing_page_url === "https://map.rccd.edu/cpl-student-portal/SDCC",
        "an eq.<canonical> read dropped this URL silently — that is the live defect");
      check("(4) the merged row reports itself under the canonical name",
        row && row.college === "San Diego College of Continuing Education");
      check("(4) ⚠ and SAYS which rows contributed — an invisible merge cannot be questioned",
        row && Array.isArray(row._merged_from) && row._merged_from.length === 2);
      const url = w.__fetches.filter(function (u) { return u.indexOf("map_college_contacts") >= 0; })[0] || "";
      check("(4) the query asked for every spelling, not eq.<one name>",
        url.indexOf("in.") >= 0 && url.indexOf("eq.") < 0, url.slice(0, 150));
    });
  });
}));

// ── 5. ⭐ SAM'S RULING IS ENFORCED BY THE DATA, NOT BY A SPECIAL CASE ───────
tests.push(ready({ contacts: [
  { college: "Calbright College Non-Credit", primary_contact: "Carol DeLilly" },
] }).then(function (w) {
  const M = w.CPL_MAP_USERS_TAB;
  block("5. two entities stay two", () => {
    const sp = M._spellingsFor("Calbright College Non-Credit");
    check("(5) ⭐ 'Calbright College Credit' is NOT a spelling of the Non-Credit arm",
      sp.indexOf("Calbright College Credit") < 0,
      "Sam ruled 2026-08-21 that Calbright and LAUNCH are TWO entities each while "
      + "San Diego and North Orange are one; merging these would overrule him");
    check("(5) …and it resolves to no identity at all", M._identityFor("Calbright College Credit") === null);
  });
}));

// ── 6. Fail-open, but NOT fail-silent ──────────────────────────────────────
tests.push(ready({ failTaxonomy: true }).then(function (w) {
  const M = w.CPL_MAP_USERS_TAB;
  block("6. degradation", () => {
    check("(6) a failed taxonomy read is RECORDED, not swallowed",
      M._taxonomy.status === "failed" && !!M._taxonomy.error,
      "status=" + M._taxonomy.status + " error=" + M._taxonomy.error
        + " — a polite else-branch that hides a broken read is exactly what kept "
        + "the College Identity tab's table from ever rendering");
    check("(6) lookups still work, at exactly the old exact+normalized behavior",
      M._identityFor("Cypress College") === null
        && JSON.stringify(M._spellingsFor("Cypress College")) === '["Cypress College"]');
    check("(6) the hand-written lists still answer on an exact key",
      !!M._fallbackFor("Gavilan College"));
    check("(6) …and on a normalized one", !!M._fallbackFor("  gavilan   college "));
  });
}));

// ── 7. All three hand-written lists route through the identity ─────────────
tests.push(ready().then(function (w) {
  const M = w.CPL_MAP_USERS_TAB;
  block("7. the hand-written lists", () => {
    check("(7) FALLBACK_CONTACTS answers for a variant spelling",
      !!M._fallbackFor("Cypress College "), "78 entries keyed by name");
    check("(7) ⭐ CPL_PAGES no longer does a bare [name] lookup",
      !/CPL_PAGES\[college\]\s*\|\|/.test(SRC)
      && /cplPageFor\(college\)\s*\{\s*return pickByIdentity\(CPL_PAGES/.test(SRC),
      "it had no normalization at all, let alone variant resolution");
    check("(7) ⭐ CPL_LIAISONS likewise",
      !/CPL_LIAISONS\[college\]\s*\|\|/.test(SRC)
      && /cplLiaisonFor\(college\)\s*\{\s*return pickByIdentity\(CPL_LIAISONS/.test(SRC));
    /* ⚠ THE REGRESSION THIS ALREADY CAUGHT. The first cut of pickByIdentity
     * cached its normalized index as `map.__norm`, mutating the data object —
     * FALLBACK_CONTACTS grew an entry with no provenance and map_users.test.js's
     * "every entry declares a provenance" went red. A cache that changes the
     * thing it caches is not a cache. */
    const before = Object.keys(M._FALLBACK_CONTACTS).length;
    M._fallbackFor("Cypress College ");
    M._cplPageFor("Cypress College ");
    M._cplLiaisonFor("Cypress College ");
    check("(7) ⚠ a lookup does NOT mutate the list it reads",
      Object.keys(M._FALLBACK_CONTACTS).length === before
        && !("__norm" in M._FALLBACK_CONTACTS) && !("__norm" in M._CPL_PAGES),
      "keys went " + before + " -> " + Object.keys(M._FALLBACK_CONTACTS).length);
    check("(7) the roster read asks for every spelling",
      /map_college_users\?select=[\s\S]{0,240}?college=" \+ encodeURIComponent\(inList\(spellingsFor\(college\)\)\)/.test(SRC),
      "it keyed on eq.<one name> before");
  });
}));

Promise.all(tests).then(function () {
  const failed = results.filter((r) => !r[1]);
  results.forEach(([name, ok, why]) =>
    console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
  console.log("\nmap_users_taxonomy.test.js: " + (results.length - failed.length) + "/" + results.length + " checks passed");
  if (failed.length) process.exit(1);
}).catch(function (e) { console.error("driver failed:", e); process.exit(1); });
