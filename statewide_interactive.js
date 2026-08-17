/**
 * Statewide Exhibit Adoption — Interactive Card
 * Reads window.CPL_STATEWIDE and window.CCC_COLLEGE_LOOKUP
 * Paginated (50 rows/page), search, multi-select filters, checkboxes,
 * expandable credit recs, Statewide/Local toggle, Word/Excel/JSON export
 */
(function () {
  "use strict";

  // Data (window.CPL_STATEWIDE / CPL_STATEWIDE_PRESCRIPTIVE) is lazy-loaded on
  // first EACR-tab open (perf — it's ~7 MB and not needed for the default
  // dashboard view). tabs.js loadScript injects the payloads when the
  // "exhibit-adoption" tab is first activated; start() (bottom of file) then
  // assigns these and runs the first render. The functions below close over
  // these vars and only execute after start() has run.
  var DATA = null;
  var LOOKUP = window.CCC_COLLEGE_LOOKUP || {};
  // MAP's sandbox organisations, as named by Sam 2026-08-13. Supabase carries the
  // same list as map_colleges.entity_kind='test' (college_briefing.js reads it as
  // entity_kind=neq.test); this static artifact has no such column, so the EACR
  // keeps the names. Do NOT add real institutions here — the two continuing-ed
  // colleges and the partner entities are legitimate and must stay visible.
  var TEST_ORGS = [
    "CabTest", "MorTest City", "Nortest City", "RivTest City", "SantTest Ana",
    "Testing College", "NORCO College - Syllabus Manager", "CA MAP INITIATIVE COLLEGE"
  ];
  var exhibits = null;
  var container = null;

  // ── Default order (Sam's tweaks, 2026-06-01) ──
  //  (1) Sink UNCLASSIFIED cards (no credential identity in the KB yet) to the
  //      bottom — lowest confidence, least actionable, and it collects the
  //      "curate the unclassified" triage backlog in one place.
  //  (2) Cluster a credential's variants together (CompTIA A+ was scattered)
  //      while keeping high-opportunity credentials near the top: order each
  //      (issuer, credential) cluster by its best potential, then issuer + title
  //      so variants stay contiguous, then potential/adopters within.
  function sortExhibits() {
    var clusterMax = {};
    function ckey(e) { return (e.issuing_agency || "") + "||" + (e.unified_title || e.title || ""); }
    exhibits.forEach(function (e) {
      var k = ckey(e), p = e.potential || 0;
      if (clusterMax[k] === undefined || p > clusterMax[k]) clusterMax[k] = p;
    });
    function unclassified(e) { return e.is_classified === false ? 1 : 0; }
    exhibits.sort(function (a, b) {
      return (unclassified(a) - unclassified(b))                                   // classified first
        || (clusterMax[ckey(b)] - clusterMax[ckey(a)])                             // best-opportunity cluster first
        || (a.issuing_agency || "").localeCompare(b.issuing_agency || "")          // group by issuer
        || (a.unified_title || a.title || "").localeCompare(b.unified_title || b.title || "")  // variants contiguous
        || ((b.potential || 0) - (a.potential || 0))                              // within: potential desc
        || ((b.adopters || 0) - (a.adopters || 0));
    });
  }

  var PAGE_SIZE = 50;

  // ── Supabase config (shared with the credential / common-course tabs) ──
  // Edits to the EACR card-level flag write to kb_curation under the
  // synthesized namespace `_EACR_FLAG::<exhibit_card_key>`. Auth piggybacks
  // on the unified_courses.js session (sessionStorage `cpl_sb`); curators
  // sign in via that tab once and the flag select lights up here.
  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var FLAG_KEY_PREFIX = "_EACR_FLAG::";
  var FLAG_FIELD = "flag";

  function isValidJwt(t) {
    return typeof t === "string"
      && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t);
  }
  function getSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem("cpl_sb") || "null");
      if (s && isValidJwt(s.access_token)
          && (s.refresh_token || s.exp > Date.now())) return s;
    } catch (e) {}
    return null;
  }
  function fetchFlagOverlay() {
    var url = SUPABASE_URL + "/rest/v1/kb_curation"
      + "?select=course_id,field,value,reviewer_email,reviewed_at"
      + "&course_id=like." + encodeURIComponent(FLAG_KEY_PREFIX) + "%25";
    return fetch(url, { headers: { "apikey": SUPABASE_ANON } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (arr) {
        var m = {};
        arr.forEach(function (row) {
          var eid = (row.course_id || "").slice(FLAG_KEY_PREFIX.length);
          if (!eid) return;
          if (row.field === FLAG_FIELD) {
            m[eid] = {
              flag: row.value || "",
              reviewed_by: row.reviewer_email || "",
              reviewed_at: row.reviewed_at || "",
            };
          }
        });
        return m;
      })
      .catch(function () { return {}; });
  }
  function saveFlag(eid, flagValue, sess) {
    var body = {
      course_id: FLAG_KEY_PREFIX + eid,
      field: FLAG_FIELD,
      value: flagValue,
      reviewer_email: sess.email
    };
    return fetch(SUPABASE_URL + "/rest/v1/kb_curation", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON,
        "Authorization": "Bearer " + sess.access_token,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(body)
    });
  }

  // ── Filter option sets + college rollups ──
  // Derived from `exhibits` by deriveFromData() inside start(), after the lazy
  // data load. Declared here (closure scope) so the functions below can read
  // them; populated once start() runs.
  var cplTypes = [], disciplines = [], sectors = [], collabTypes = [], issuers = [];
  var allColleges = {}, collegeNames = [], districtSet = {}, swRegionSet = {}, districts = [], swRegions = [];
  // unified_title → { college: [courses] } from the prescriptive (M-ID leverage)
  // layer. This is the STRONG "could adopt" signal — the college already teaches
  // a course that maps to the credential's identity, and we can name it. Built
  // once in deriveFromData() so collegeNamesFor() is a lookup, not a scan.
  var presByTitle = {};
  // Vision §6.2 — cards with modal confidence_title below this threshold get a "needs review" badge.
  var CONFIDENCE_THRESHOLD = 0.75;
  function deriveFromData() {
    cplTypes = unique(exhibits.map(function (e) { return e.cpl_type || "Unknown"; }));
    disciplines = unique(exhibits.map(function (e) { return e.discipline || "Unknown"; }));
    sectors = unique(exhibits.map(function (e) { return e.sector || "Unassigned"; }));
    collabTypes = unique(exhibits.map(function (e) { return e.collaborative_type || "Local"; }));
    // Issuing agencies — only collect non-empty (cards without an issuer skip the filter).
    // Added by EACR Phase 4 PR-C2 once the generator started emitting e.issuing_agency.
    issuers = unique(exhibits.map(function (e) { return e.issuing_agency || ""; }).filter(Boolean));
    // Collect all college names across adopters + potential
    allColleges = {};
    exhibits.forEach(function (e) {
      (e.adopter_names || []).concat(e.potential_names || []).forEach(function (c) { allColleges[c] = 1; });
    });
    // MAP's sandbox orgs leak into the adoption data (Sam, 2026-08-13). Supabase
    // tags them map_colleges.entity_kind='test', but statewide_data.js is a static
    // artifact with no such column, so the EACR excludes them by name. Only
    // CA MAP INITIATIVE COLLEGE actually appears here today (2 rows) — the rest of
    // Sam's list is absent — but the set is kept whole so a future rebuild that
    // pulls one in is covered.
    collegeNames = Object.keys(allColleges).filter(function (c) {
      return TEST_ORGS.indexOf(c) === -1;
    }).sort();
    districtSet = {}; swRegionSet = {};
    // A LOOKUP miss makes a college unfilterable by district/SW region, because
    // collegeMatchesFilters() fails closed (correctly — we must not claim an
    // unknown college sits in the district you asked for). The danger is that it
    // does so SILENTLY, which is how Calbright College Non-Credit lost 88 rows.
    // Fail closed, but say so.
    var unresolved = [];
    collegeNames.forEach(function (c) {
      var info = LOOKUP[c];
      if (info) {
        if (info.district) districtSet[info.district] = 1;
        if (info.swRegion) swRegionSet[info.swRegion] = 1;
      } else {
        unresolved.push(c);
      }
    });
    if (unresolved.length && window.console && console.warn) {
      console.warn("[EACR] " + unresolved.length + " college name(s) missing from " +
        "CCC_COLLEGE_LOOKUP — excluded from the District and SW Region filters. " +
        "Add them to college_lookup.js: " + unresolved.join(" | "));
    }
    districts = Object.keys(districtSet).sort();
    swRegions = Object.keys(swRegionSet).sort();

    // Index the prescriptive layer by unified_title → college → courses.
    presByTitle = {};
    var presAll = window.CPL_STATEWIDE_PRESCRIPTIVE || {};
    Object.keys(presAll).forEach(function (t) {
      var m = {};
      (presAll[t].colleges || []).forEach(function (c) {
        if (TEST_ORGS.indexOf(c.college) === -1) m[c.college] = c.courses || [];
      });
      presByTitle[t] = m;
    });
  }

  // ── College scope (2026-08-16, Sam: "make sure it filters for colleges that
  // have adopted the exhibit") ──
  // The College / District / SW Region filters used to match on
  // adopter_names ∪ potential_names, which made them 93.6% noise: filtering to
  // Pasadena City College returned 1,790 cards of which it had adopted 44. The
  // median card carries 1 adopter and 41 "potential" colleges.
  //
  // "Potential" is generated (excel_to_dashboard.py) as every college with a
  // program of study under the same TOP code, ∪ every college teaching a course
  // with a matching C-ID, minus adopters. TOP is a last-in-line corroborator
  // (Rule 7) — it cannot carry a primary "this college could adopt" claim on its
  // own, so it is no longer folded into the default and is labelled where shown.
  //
  // Three scopes, not a binary, because the middle one is a genuinely different
  // and much stronger signal that was previously unreachable by any filter:
  //   adopted — the college has articulated it (the default; 8,436 pairs)
  //   likely  — the M-ID prescriptive layer: already teaches a course that maps
  //             to this credential's identity, and we can NAME it (4,972 pairs)
  //   any     — + the broad TOP/C-ID program overlap (122,836 pairs)
  var SCOPES = {
    adopted: {
      label: "Adopted",
      hint: "Colleges that have articulated this exhibit."
    },
    likely: {
      label: "Adopted + likely",
      hint: "Also colleges already teaching a course that maps to this credential — the local course is named on the card."
    },
    any: {
      label: "Adopted + any could-adopt",
      hint: "Also every college with a program under the same TOP code or a matching C-ID. Broad: TOP is a weak signal, so treat these as leads, not matches."
    }
  };

  // The college names an exhibit is considered to "reach" under the active
  // scope. Used by both the filter and the row rendering so the columns can
  // never disagree with the rows they justify.
  function collegeNamesFor(e, scope) {
    var names = (e.adopter_names || []).slice();
    if (scope === "adopted") return names;
    var pres = presByTitle[e.unified_title || e.title || ""];
    if (pres) names = names.concat(Object.keys(pres));
    if (scope === "likely") return names;
    return names.concat(e.potential_names || []);
  }

  // Colleges reached ONLY by the could-adopt half, for the column that shows them.
  function couldAdoptNamesFor(e, scope) {
    if (scope === "adopted") return [];
    var adopted = {};
    (e.adopter_names || []).forEach(function (c) { adopted[c] = 1; });
    var seen = {}, out = [];
    var pres = presByTitle[e.unified_title || e.title || ""];
    if (pres) Object.keys(pres).forEach(function (c) {
      if (!adopted[c] && !seen[c]) { seen[c] = 1; out.push({ college: c, likely: true }); }
    });
    if (scope === "any") {
      (e.potential_names || []).forEach(function (c) {
        if (!adopted[c] && !seen[c]) { seen[c] = 1; out.push({ college: c, likely: false }); }
      });
    }
    return out;
  }

  // ── College roster rules (mirror of kb/reference/map_college_roster_rules.json) ──
  // Sam, 2026-08-17: "CAlbright, etc. should only be in once and CAMAP can be
  // left out altogether—it's our sandbox."
  //
  // The GENERATOR already applies these to `adopter_units` at build time, so the
  // green half of the matrix arrives clean. The prescriptive layer — which is
  // the brown half — is a SEPARATE artifact that does not, so the axis must fold
  // here too or one institution renders as two columns.
  //
  // The mojibake entry is escaped rather than written literally: "CaÃ±ada" is
  // "Cañada" read as latin-1 and re-encoded, and a file that spells it out
  // invites the very corruption it is guarding against. Both spellings come out
  // of excel_to_dashboard.py on different paths — the correct one into
  // potential_names, the mangled one into statewide_prescriptive.js — so before
  // this fold the axis carried a second Cañada column holding all 26 of its
  // opportunities while the correctly-spelled one sat empty. It read as 118
  // anyway because cplCollegeShort()'s normalize() folds Ã± → n, so the LABEL
  // count was right while the axis under it was 119: the collision was hidden
  // precisely by the thing that made the headers legible.
  var ROSTER_SANDBOX = {};
  ["CA MAP INITIATIVE COLLEGE", "CabTest College", "MorTest City College",
   "NORCO College - Syllabus Manager", "Nortest City College", "RivTest City College",
   "SantTest Ana College", "Testing College"].forEach(function (n) { ROSTER_SANDBOX[n] = 1; });
  var ROSTER_FOLD = {
    "Calbright College Credit": "Calbright College Non-Credit",
    "North Orange Continuing Education Credit": "North Orange Continuing Education",
    "San Diego College of Continuing Education Credit": "San Diego College of Continuing Education"
  };
  ROSTER_FOLD["CaÃ±ada College"] = "Cañada College";

  // Canonical column name for a raw college spelling. Returns "" for a sandbox
  // org — callers MUST drop those rather than render them, because a MAP test
  // entity counted as an adopter publishes a number that is simply false (it
  // published 7 adopters on California Real Estate Broker License where the
  // truth is 6).
  function rosterName(c) {
    if (!c || ROSTER_SANDBOX[c]) return "";
    return ROSTER_FOLD[c] || c;
  }

  // ── State ──
  var state = {
    search: "",
    filters: { collabType: [], cplType: [], sector: [], discipline: [], issuer: [], college: [], district: [], swRegion: [] },
    // Which colleges a College/District/Region filter matches on. Defaults to
    // real adoptions — see SCOPES above.
    collegeScope: "adopted",
    // Which view is showing. Two sub-tabs replaced three stacked collapsibles
    // (2026-08-16): all three used to re-render on every keystroke, and the
    // student framing is a MODE of the credential view, not a third place.
    view: "credentials",
    // ── Matrix sub-tab ──
    // Sam's ruling: the row axis opens at credentials with ≥2 adopting colleges
    // (434 of 2,345). 1,853 titles have exactly ONE adopter, and in a 118-column
    // grid each of those is a label and a single mark — the full grid is 4.4%
    // inked against 17.0% here. All 2,345 stay reachable through this control
    // and the search box.
    matrixMin: 2,
    matrixCells: "both",   // both | got (adopted only) | opp (opportunity only)
    matrixExpanded: {},    // unified_title → the folded MAP exhibit IDs are open
    selected: {},
    expanded: {},
    flags: {},   // eid → { flag: "stale" | "duplicate" | "", reviewed_by, reviewed_at }
    sess: null,  // Supabase session (read once at init); curator sign-in is in another tab
    page: 0,
    filteredCache: null
  };

  // ── Helpers ──
  function unique(arr) {
    var s = {}; arr.forEach(function (v) { s[v] = 1; }); return Object.keys(s).sort();
  }
  function fmt(n) { return n.toLocaleString(); }

  function collegeMatchesFilters(name) {
    var f = state.filters;
    if (f.college.length && f.college.indexOf(name) === -1) return false;
    var info = LOOKUP[name];
    if (f.district.length && (!info || f.district.indexOf(info.district) === -1)) return false;
    if (f.swRegion.length && (!info || f.swRegion.indexOf(info.swRegion) === -1)) return false;
    return true;
  }

  function exhibitMatchesFilters(e) {
    var f = state.filters;
    if (f.collabType.length && f.collabType.indexOf(e.collaborative_type || "Local") === -1) return false;
    if (f.cplType.length && f.cplType.indexOf(e.cpl_type || "Unknown") === -1) return false;
    if (f.sector.length && f.sector.indexOf(e.sector || "Unassigned") === -1) return false;
    if (f.discipline.length && f.discipline.indexOf(e.discipline || "Unknown") === -1) return false;
    if (f.issuer.length && f.issuer.indexOf(e.issuing_agency || "") === -1) return false;
    if (f.college.length || f.district.length || f.swRegion.length) {
      if (!collegeNamesFor(e, state.collegeScope).some(collegeMatchesFilters)) return false;
    }
    if (state.search) {
      var q = state.search.toLowerCase();
      var hay = (e.title || "") + " " + (e.cpl_type || "") + " " + (e.discipline || "") + " " +
        (e.collaborative_type || "") + " " + (e.issuing_agency || "") + " " +
        (e.raw_titles || []).join(" ") + " " +
        (e.adopter_names || []).join(" ") + " " +
        (e.potential_names || []).join(" ");
      if (hay.toLowerCase().indexOf(q) === -1) return false;
    }
    return true;
  }

  function getFiltered() {
    if (!state.filteredCache) {
      state.filteredCache = exhibits.filter(exhibitMatchesFilters);
    }
    return state.filteredCache;
  }

  function invalidateCache() {
    state.filteredCache = null;
    state.page = 0;
  }

  // ── Credential view (v2 · master-detail) styles — self-contained, injected
  // once so the daily regen / generator never needs to carry them. ──
  var CV_STYLE = '<style>'
    + '.sw-gallery-sec{border:1px solid rgba(10,34,64,0.12);border-radius:6px;margin:0 0 0.6rem;}'
    // Section titles render on the LIGHT dashboard page (the dark card sits INSIDE
    // the section), so use the dashboard navy for readable contrast — the old gold
    // (#E3B341) was washed out on white.
    + '.sw-gallery-sum{cursor:pointer;padding:0.55rem 0.8rem;font-size:0.84rem;font-weight:700;color:var(--text-strong);list-style:none;}'
    + '.sw-gallery-sum::-webkit-details-marker{display:none;}'
    + '.sw-gallery-sum::before{content:"▸";display:inline-block;margin-right:0.4rem;color:var(--text-strong);transition:transform 0.15s ease;}'
    + '.sw-gallery-sec[open]>.sw-gallery-sum::before{transform:rotate(90deg);}'
    + '.sw-gallery-tag{font-size:0.62rem;background:rgba(227,179,65,0.22);color:var(--mustard-text);padding:1px 5px;border-radius:3px;margin-left:0.35rem;font-weight:600;}'
    // Page-level filter bar — lifted out of the v1 card so search + filters sit
    // above the whole gallery and apply to every view (not repeated per card).
    // overflow:visible is LOAD-BEARING — .sw-interactive sets overflow:hidden (it
    // clips the v1 table's corners to the card radius), and the filter bar reuses
    // that class. Every .sw-filter-dropdown is position:absolute; top:100%, so
    // inside a ~70px-tall wrapper they were clipped to a sliver: all 8 filters
    // opened into nothing. That is why they read as "not dropdowns" AND as
    // "don't work" — one defect, both halves of the report (Sam, 2026-08-13).
    + '.sw-filterbar{margin-bottom:0.6rem;overflow:visible;}'
    + '.sw-filterbar .sw-toolbar{border-bottom:none;}'
    + '.sw-filterbar-hint{font-size:0.64rem;color:var(--text-muted);padding:0 0.8rem 0.6rem;font-style:italic;}'
    // College scope control + sub-tabs. Plain words, no glyphs.
    // The radios are visually hidden but NOT display:none — they must stay
    // focusable and reachable by arrow keys; the <label> is the visible pill.
    + '.sw-scopebar{display:flex;align-items:center;flex-wrap:wrap;gap:0.35rem;padding:0 0.8rem 0.5rem;'
      + 'border:0;margin:0;min-width:0;}'
    + '.sw-scope-label{font-size:0.7rem;font-weight:600;color:var(--text-body);margin-right:0.15rem;padding:0;float:none;}'
    + '.sw-scope-opt{display:inline-flex;position:relative;}'
    + '.sw-scope-radio{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer;}'
    + '.sw-scope-btn{display:inline-flex;align-items:center;min-height:32px;background:var(--surface-subtle);'
      + 'color:var(--text-body);border:1px solid var(--border-strong);border-radius:999px;padding:4px 13px;'
      + 'font-size:0.72rem;font-family:inherit;cursor:pointer;font-weight:600;}'
    // Selected state carries a WEIGHT + BORDER change as well as colour, so it
    // survives forced-colours and colour-blindness.
    + '.sw-scope-radio:checked + .sw-scope-btn{background:var(--seal-blue);color:var(--white);'
      + 'border-color:var(--seal-blue);box-shadow:inset 0 0 0 1px var(--white);}'
    + '.sw-scope-radio:focus-visible + .sw-scope-btn{outline:3px solid var(--accent-link);outline-offset:2px;}'
    + '.sw-scope-hint{font-size:0.64rem;color:var(--text-muted);font-style:italic;flex-basis:100%;padding-top:0.2rem;}'
    + '.sw-subtabs{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 0.6rem;}'
    + '.sw-subtabs button{background:var(--surface-opaque);color:var(--text-body);border:1px solid var(--border-strong);'
      + 'border-bottom:none;border-radius:8px 8px 0 0;padding:8px 16px;min-height:40px;font-size:0.85rem;'
      + 'font-family:inherit;cursor:pointer;font-weight:600;}'
    + '.sw-subtabs button.on{background:var(--seal-blue);color:var(--white);border-color:var(--seal-blue);}'
    + '.sw-subtabs button:focus-visible{outline:3px solid var(--accent-link);outline-offset:2px;}'
    + '.sw-view:focus-visible{outline:2px solid var(--accent-link);outline-offset:2px;}'
    // Could-adopt column: the claim is carried by a TEXT LABEL, not a colour.
    + '.sw-could-group{margin:0 0 0.25rem;}'
    + '.sw-could-group:last-child{margin-bottom:0;}'
    + '.sw-could-label{display:block;font-size:0.6rem;font-weight:700;color:var(--text-muted);'
      + 'text-transform:uppercase;letter-spacing:0.02em;}'
    + '.sw-col-empty{opacity:0.55;font-style:italic;}'
    // Chips are <abbr>; suppress the UA dotted underline on the pill variants
    // (the pill is already the affordance) and keep it on the plain table lists,
    // where it is the only cue that a full name is available.
    + '.sv-chip,.cv-rx-college{text-decoration:none;}'
    + 'abbr.sw-college{text-decoration:underline dotted;text-underline-offset:2px;cursor:help;}'
    + '.sw-show-more:focus-visible{outline:2px solid var(--accent-link);outline-offset:2px;}'
    // Aligned MAP exhibits under a common title.
    // A likely could-adopt chip (teaches the mapping course) reads stronger than
    // a broad TOP/C-ID lead — same column, deliberately different weight.
    + '.sw-potential-likely{outline:1px solid rgba(76,175,120,0.55);font-weight:600;}'
    + '.cv-ex{margin-top:0.45rem;border-top:1px dashed var(--border);padding-top:0.35rem;}'
    + '.cv-ex>summary{cursor:pointer;font-size:0.7rem;font-weight:600;color:var(--cobalt);list-style:none;}'
    + '.cv-ex>summary::-webkit-details-marker{display:none;}'
    + '.cv-ex>summary::before{content:"▸";display:inline-block;margin-right:0.35rem;transition:transform 0.15s ease;}'
    + '.cv-ex[open]>summary::before{transform:rotate(90deg);}'
    + '.cv-ex-body{padding:0.3rem 0 0.2rem 0.6rem;}'
    + '.cv-ex-hint{font-size:0.6rem;color:var(--text-muted);font-style:italic;margin-bottom:0.3rem;}'
    + '.cv-ex-row{font-size:0.68rem;color:var(--text-body);padding:0.15rem 0;line-height:1.35;}'
    + '.cv-ex-id{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--cobalt);margin-right:0.4rem;}'
    + '.cv-ex-meta{font-size:0.62rem;color:var(--text-muted);}'
    + '.cv-ex-raw{font-size:0.62rem;color:var(--text-muted);padding-left:0.2rem;}'
    // Dark navy card so the v2 credential view's white/grey text is readable —
    // it renders on the light dashboard page, and (unlike the v1 table, which
    // sits inside .sw-interactive) cv-body was transparent → text was invisible.
    + '.cv-body{padding:0.8rem 0.9rem 1rem;background:var(--surface-opaque);border:1px solid rgba(227,179,65,0.25);border-radius:10px;box-shadow:0 8px 30px rgba(20,20,30,0.08);}'
    + '.cv-note{font-size:0.66rem;color:var(--text-muted);padding:0.4rem 0;font-style:italic;}'
    + '.cv-credential{border:1px solid var(--border);border-radius:6px;padding:0.6rem 0.8rem;margin-bottom:0.55rem;background:var(--surface-subtle);}'
    + '.cv-title{font-size:0.9rem;font-weight:700;color:var(--text-strong);margin-bottom:0.15rem;}'
    + '.cv-issuer{font-size:0.72rem;font-weight:400;color:var(--text-muted);}'
    + '.cv-standard{border-left:3px solid #E3B341;padding:0.2rem 0 0.2rem 0.6rem;margin:0.3rem 0;}'
    + '.cv-others{margin-top:0.45rem;border-top:1px dashed var(--border);padding-top:0.4rem;}'
    + '.cv-others-label{font-size:0.66rem;font-weight:600;color:var(--text-muted);margin-bottom:0.2rem;}'
    + '.cv-variant{padding:0.15rem 0 0.15rem 0.6rem;border-left:2px solid var(--border);margin:0.25rem 0;}'
    + '.cv-meta{font-size:0.66rem;color:var(--text-muted);}'
    + '.cv-badge{font-size:0.6rem;padding:1px 5px;border-radius:3px;font-weight:600;white-space:nowrap;}'
    + '.cv-ccc{background:rgba(76,175,120,0.2);color:var(--hunter);}'
    + '.cv-synth{background:rgba(227,179,65,0.18);color:var(--mustard-text);}'
    + '.cv-local{background:var(--surface-subtle);color:var(--text-body);}'
    // Prescriptive adoption layer (PR-4) — green "adopt" accent.
    + '.cv-rx{margin-top:0.45rem;border-top:1px dashed rgba(127,208,160,0.28);padding-top:0.35rem;}'
    + '.cv-rx>summary{cursor:pointer;font-size:0.7rem;font-weight:600;color:var(--hunter);list-style:none;}'
    + '.cv-rx>summary::-webkit-details-marker{display:none;}'
    + '.cv-rx>summary::before{content:"▸";display:inline-block;margin-right:0.35rem;transition:transform 0.15s ease;}'
    + '.cv-rx[open]>summary::before{transform:rotate(90deg);}'
    + '.cv-rx-body{padding:0.3rem 0 0.2rem 0.6rem;}'
    + '.cv-rx-hint{font-size:0.6rem;color:var(--text-muted);font-style:italic;margin-bottom:0.3rem;}'
    + '.cv-rx-row{font-size:0.68rem;color:var(--text-body);padding:0.12rem 0;line-height:1.35;}'
    + '.cv-rx-college{font-weight:600;color:var(--text-strong);}'
    + '.cv-rx-arrow{color:var(--hunter);margin:0 0.2rem;}'
    + '.cv-rx-course{color:var(--cobalt);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}'
    + '.cv-rx-note{font-size:0.62rem;color:var(--mustard-text);font-style:italic;margin-top:0.3rem;}'
    // Student view (v3) — seeker lens. Renders inside the same dark .cv-body.
    + '.sv-banner{font-size:0.72rem;color:var(--cobalt);background:rgba(125,161,212,0.12);border-left:3px solid var(--cobalt);padding:0.45rem 0.7rem;border-radius:4px;margin-bottom:0.6rem;}'
    + '.sv-banner b{color:var(--text-strong);}'
    + '.sv-status{font-size:0.7rem;line-height:1.55;padding:0.15rem 0;color:var(--text-body);}'
    + '.sv-yes b{color:var(--hunter);}'
    + '.sv-maybe b{color:var(--mustard-text);}'
    + '.sv-prog b{color:var(--text-muted);}'
    + '.sv-cta{font-style:italic;color:var(--text-muted);font-size:0.64rem;}'
    + '.sv-teaches{font-size:0.64rem;color:var(--text-muted);}'
    + '.sv-chip{font-size:0.62rem;padding:1px 6px;border-radius:3px;margin:0 1px;white-space:nowrap;display:inline-block;}'
    + '.sv-chip-yes{background:rgba(76,175,120,0.25);color:var(--hunter);}'
    + '.sv-chip-maybe{background:rgba(227,179,65,0.22);color:var(--mustard-text);}'
    + '.sv-chip-prog{background:var(--surface-subtle);color:var(--text-body);}'
    + '.sv-more{font-size:0.6rem;color:var(--text-muted);}'

    // ── Motion / contrast preferences ──────────────────────────────────────
    // The disclosure carets animate; honour a reduced-motion request.
    + '@media (prefers-reduced-motion: reduce){'
      + '.sw-gallery-sum::before,.cv-rx>summary::before,.cv-ex>summary::before{transition:none;}'
    + '}'
    // Forced-colours (Windows high contrast) drops background-colour, so the
    // selected scope pill and active sub-tab would become indistinguishable.
    // Restore the distinction with properties forced-colours keeps.
    + '@media (forced-colors: active){'
      + '.sw-scope-radio:checked + .sw-scope-btn,.sw-subtabs button.on,.mx-seg input:checked + label{'
        + 'border:2px solid Highlight;forced-color-adjust:none;background:Highlight;color:HighlightText;}'
      + '.sw-potential-likely{outline:2px solid CanvasText;}'
      // Forced colours drops the green/brown entirely. The matrix does not
      // depend on them — the opportunity figure is parenthesised — but the
      // sticky panes need an opaque ground or the scrolled cells show through.
      + '.mx-table thead th.mx-col,.mx-table thead th.mx-corner,.mx-table tbody th.mx-row{background:Canvas;}'
    + '}'

    // ── Mobile ─────────────────────────────────────────────────────────────
    // The EACR had NO responsive rules of its own. Two things actually break on
    // a phone: the filter dropdowns (position:absolute, min-width:220px, anchored
    // to a ~90px-wide button near the right edge → opens off-screen), and the
    // touch targets.
    + '@media (max-width: 640px){'
      // Anchor dropdowns to the filter BAR, not the button, so they can never
      // open past the viewport edge. .sw-filterbar already has overflow:visible.
      + '.sw-filterbar{position:relative;}'
      + '.sw-filter-group{position:static;}'
      + '.sw-filter-dropdown{left:0.6rem;right:0.6rem;min-width:0;max-height:60vh;}'
      // WCAG 2.5.8 target size — 24px minimum, 44px is the comfortable target.
      + '.sw-filter-btn{min-height:40px;padding:0.5rem 0.8rem;font-size:0.8rem;}'
      + '.sw-filter-dropdown label{min-height:40px;padding:0.5rem 0.7rem;font-size:0.8rem;}'
      + '.sw-scope-btn{min-height:40px;padding:8px 14px;font-size:0.78rem;}'
      + '.sw-scopebar{padding:0 0.6rem 0.5rem;}'
      + '.sw-subtabs button{flex:1 1 auto;min-height:44px;padding:10px 12px;}'
      + '.sw-action-btn,.sw-page-btn{min-height:40px;}'
      // Cards: give the text room back that the desktop padding takes.
      + '.cv-body{padding:0.6rem 0.55rem 0.8rem;}'
      + '.cv-credential{padding:0.6rem 0.55rem;}'
      // The 10-column table cannot fit a phone; the wrap scrolls it. Make that
      // scroll discoverable + smooth rather than a silently clipped table.
      + '.sw-table-wrap{max-height:none;-webkit-overflow-scrolling:touch;}'
      + '.sw-table-hint{display:block;}'
      // The matrix scrolls sideways by design; give the frozen title column
      // back some of the phone's width so the cells are not squeezed off.
      + '.mx-table thead th.mx-corner,.mx-table tbody th.mx-row{min-width:180px;width:180px;}'
      + '.mx-box{max-height:70vh;-webkit-overflow-scrolling:touch;}'
      + '.mx-seg label{min-height:40px;padding:8px 13px;}'
    + '}'
    + '.sw-table-hint{display:none;font-size:0.64rem;color:var(--text-muted);padding:0 1rem 0.5rem;font-style:italic;}'
    // ── CER Adoption Matrix ──
    // Geometry IS the design here: 118 numeric columns is ~3,500px, about twice
    // a desktop viewport, so the grid gets a frozen title column, rotated
    // short-caps headers and horizontal scroll rather than a density trick. A
    // legible 2–3 digit cell needs ~26px; the 34px column below is that plus
    // borders, and shrinking it further does not buy a fit, it just stops the
    // numbers being readable.
    + '.mx-controls{display:flex;flex-wrap:wrap;gap:0.9rem;align-items:flex-end;margin-bottom:0.5rem;}'
    + '.mx-fs{border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;min-width:0;}'
    + '.mx-lg{padding:0;float:none;font-size:0.62rem;text-transform:uppercase;letter-spacing:0.09em;'
      + 'color:var(--text-muted);font-weight:700;}'
    + '.mx-seg{display:flex;border:1px solid var(--border-strong);border-radius:4px;overflow:hidden;'
      + 'background:var(--surface-opaque);}'
    + '.mx-seg label{padding:6px 12px;font-size:0.74rem;cursor:pointer;color:var(--text-body);'
      + 'border-right:1px solid var(--border);min-height:36px;display:flex;align-items:center;}'
    + '.mx-seg label:last-of-type{border-right:0;}'
    // Visually hidden but NOT display:none — same rule as the scope radios, so
    // arrow-key navigation and the focus ring keep working.
    + '.mx-seg input{position:absolute;opacity:0;width:0;height:0;}'
    + '.mx-seg input:checked + label{background:var(--seal-blue);color:var(--white);font-weight:700;'
      + 'box-shadow:inset 0 0 0 1px var(--white);}'
    + '.mx-seg input:focus-visible + label{outline:3px solid var(--accent-link);outline-offset:-3px;}'
    + '.mx-key{display:flex;flex-wrap:wrap;gap:1rem;font-size:0.72rem;color:var(--text-body);'
      + 'align-items:center;margin-bottom:0.45rem;}'
    + '.mx-key b{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}'
    + '.mx-got{color:var(--hunter);font-weight:700;}'
    + '.mx-opp{color:var(--mustard-text);}'
    + '.mx-box{overflow:auto;max-height:600px;border:1px solid var(--border-strong);'
      + 'background:var(--surface-opaque);border-radius:4px;position:relative;}'
    + '.mx-table{border-collapse:separate;border-spacing:0;font-variant-numeric:tabular-nums;}'
    + '.mx-table th,.mx-table td{padding:0;margin:0;}'
    + '.mx-table thead th.mx-col{height:132px;vertical-align:bottom;position:sticky;top:0;z-index:3;'
      + 'background:var(--surface-opaque);border-bottom:1px solid var(--border-strong);'
      + 'border-left:1px solid var(--border);width:34px;min-width:34px;max-width:34px;}'
    // Rotation is presentation only — the header text stays in normal DOM order,
    // so a screen reader and find-in-page read it upright.
    + '.mx-table thead th.mx-col>div{transform:rotate(-60deg);transform-origin:left bottom;width:132px;'
      + 'font-size:0.6rem;letter-spacing:0.04em;font-weight:700;color:var(--text-body);'
      + 'white-space:nowrap;text-align:left;margin-left:15px;padding-bottom:5px;}'
    + '.mx-table thead th.mx-corner{position:sticky;left:0;top:0;z-index:5;background:var(--surface-opaque);'
      + 'border-bottom:1px solid var(--border-strong);border-right:1px solid var(--border-strong);'
      + 'min-width:280px;width:280px;vertical-align:bottom;text-align:left;padding:0 12px 9px;'
      + 'font-size:0.64rem;text-transform:uppercase;letter-spacing:0.09em;color:var(--text-muted);font-weight:700;}'
    + '.mx-table tbody th.mx-row{position:sticky;left:0;z-index:2;background:var(--surface-opaque);'
      + 'text-align:left;border-right:1px solid var(--border-strong);border-bottom:1px solid var(--border);'
      + 'min-width:280px;width:280px;padding:6px 12px;font-weight:500;vertical-align:top;}'
    + '.mx-rtitle{font-size:0.8rem;color:var(--text-strong);font-weight:700;line-height:1.3;}'
    + '.mx-rmeta{font-size:0.66rem;color:var(--text-muted);margin-top:2px;}'
    + '.mx-disc{border:0;background:none;padding:0;cursor:pointer;color:var(--cobalt);font:inherit;'
      + 'font-size:0.66rem;text-decoration:underline;text-underline-offset:2px;}'
    + '.mx-disc:focus-visible{outline:2px solid var(--accent-link);outline-offset:2px;}'
    + '.mx-cell{width:34px;min-width:34px;max-width:34px;height:31px;text-align:center;'
      + 'border-left:1px solid var(--border);border-bottom:1px solid var(--border);'
      + 'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:0.7rem;line-height:31px;}'
    // Colour is REINFORCEMENT, never the message: an adopted figure is bare and
    // an opportunity figure is parenthesised, so the two stay distinguishable in
    // greyscale, in forced colours and when read aloud (WCAG 1.4.1).
    + '.mx-has{color:var(--hunter);font-weight:700;}'
    + '.mx-opp-cell{color:var(--mustard-text);}'
    + '.mx-none{color:var(--text-muted);opacity:0.5;}'
    + '.mx-exp td{border-bottom:1px solid var(--border-strong);background:var(--surface-subtle);'
      + 'padding:8px 12px;font-size:0.72rem;color:var(--text-muted);}'
    + '.mx-exp code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:0.68rem;'
      + 'color:var(--text-body);background:var(--surface-opaque);padding:1px 5px;border-radius:2px;'
      + 'margin:0 4px 3px 0;display:inline-block;}'
    + '.mx-stats{font-size:0.68rem;color:var(--text-muted);margin-top:0.45rem;font-style:italic;}'
    + '.mx-note{font-size:0.66rem;color:var(--text-muted);padding:0.4rem 0;font-style:italic;}'
    // NAMESPACED deliberately: `.sr-only` lives in fact-sheet/factsheet.css and
    // is NOT loaded on the dashboard page, so borrowing the name would leave the
    // caption rendered in full at the top of the grid.
    + '.mx-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;'
      + 'clip:rect(0 0 0 0);white-space:nowrap;border:0;}'
    + '</style>';

  // ── Prescriptive adoption layer (PR-4) ──
  // Per credential, the colleges that could adopt it and the likely local course
  // each ALREADY teaches that maps to the credential's M-ID identity — turning
  // "could adopt" into an actionable "here's the course to articulate" worklist.
  // Data is keyed by unified_title in window.CPL_STATEWIDE_PRESCRIPTIVE
  // (statewide_prescriptive.js, generated by _build_statewide_prescriptive()):
  // M-ID adoption_leverage joined to minted memberships, over-merged withheld.
  function buildPrescriptiveHtml(title) {
    var pres = (window.CPL_STATEWIDE_PRESCRIPTIVE || {})[title];
    if (!pres) return "";
    var n = pres.n_colleges || 0;
    var withheld = pres.withheld || 0;
    if (!n && !withheld) return "";
    if (!n) {
      // Only over-merged signals for this credential — be honest, recommend nothing bogus.
      return '<div class="cv-rx"><div class="cv-rx-note">🎯 ' + withheld +
        ' aligned college' + (withheld === 1 ? '' : 's') +
        ' flagged but withheld — identity is over-merged; needs curation before recommending.</div></div>';
    }
    var rowsHtml = (pres.colleges || []).map(function (c) {
      var courses = (c.courses || []).map(function (q) {
        var code = ((q.subject || "") + " " + (q.number || "")).trim();
        var u = (q.units != null && q.units !== "") ? " (" + fmtUnits(q.units) + "u)" : "";
        return '<span class="cv-rx-course">' + esc(code) + u + '</span>';
      }).join(", ");
      return '<div class="cv-rx-row">' + collegeChip(c.college, "cv-rx-college") +
        (courses ? '<span class="cv-rx-arrow">→</span>' + courses : '') + '</div>';
    }).join("");
    var note = withheld
      ? '<div class="cv-rx-note">+ ' + withheld + ' more flagged but withheld (identity over-merged).</div>'
      : "";
    return '<details class="cv-rx"><summary>🎯 ' + n + ' college' + (n === 1 ? '' : 's') +
      ' could adopt this — likely local course to articulate</summary>' +
      '<div class="cv-rx-body">' +
        '<div class="cv-rx-hint">These colleges already teach a course that maps to this credential’s identity — a likely match (membership key is approximate; confirm before articulating).</div>' +
        rowsHtml + note +
      '</div></details>';
  }

  // ── Credential view (v2): one card per credential (unified_title + issuer),
  // CCC version as the standard on top (or a synthesized "suggested standard"
  // when no CCC exists), with the other CPL-Type/collab variants sub-listed.
  // Shares the v1 search + filters via getFiltered(); reuses buildCreditRecsHtml.
  // Consumer-side, additive — the per-college prescriptive layer (PR-4) appends
  // a "colleges that could adopt → likely local course" block per card.
  // ── Grouping to the CER's common reference (2026-08-16) ──
  // The card grain is (unified_title, issuer, CPL type); the CER's grain is the
  // unified_title alone. Grouping on title+issuer therefore split 8 credentials
  // into TWO cards each — a classified one carrying the issuer, and an
  // unclassified twin with a BLANK issuer (Firefighter I, Firefighter II, CNA
  // Certification, Computer Keyboarding…). The twin sorts to the bottom with the
  // other unclassified cards, so a curator sees one and never learns of the
  // other.
  //
  // A blank issuer means UNKNOWN, not DIFFERENT, so it folds into the title's
  // named issuer. Two genuinely different NAMED issuers on one title stay
  // separate — that is a real distinction and we must not invent a merge. (No
  // such case exists in the data today; the rule is what keeps it honest if one
  // appears.)
  function credentialKey(e, namedByTitle) {
    var t = e.unified_title || e.title || "";
    var iss = e.issuing_agency || "";
    if (!iss) {
      var named = namedByTitle[t];
      if (named && named.length === 1) iss = named[0];
    }
    return t + "||" + iss;
  }
  function groupToCredentials(cards) {
    var namedByTitle = {};
    cards.forEach(function (e) {
      var t = e.unified_title || e.title || "";
      var iss = e.issuing_agency || "";
      if (!iss) return;
      if (!namedByTitle[t]) namedByTitle[t] = [];
      if (namedByTitle[t].indexOf(iss) === -1) namedByTitle[t].push(iss);
    });
    var groups = {}, order = [];
    cards.forEach(function (e) {
      var k = credentialKey(e, namedByTitle);
      if (!groups[k]) { groups[k] = []; order.push(k); }
      groups[k].push(e);
    });
    return { groups: groups, order: order };
  }

  // The MAP exhibits folded under one common reference — Sam: "list all the
  // different aligned exhibits under the common title." `exhibit_ids` and
  // `raw_titles` have always been in the payload and were rendered NOWHERE:
  // 5,135 MAP exhibit IDs fold into 2,673 cards and none were visible.
  function buildAlignedExhibitsHtml(cards) {
    var seen = {}, rows = [];
    cards.forEach(function (e) {
      var ids = e.exhibit_ids || (e.exhibit_id ? [e.exhibit_id] : []);
      var raws = e.raw_titles || [];
      ids.forEach(function (id, i) {
        if (seen[id]) return;
        seen[id] = 1;
        // raw_titles and exhibit_ids are independently sorted lists of the same
        // fold, so they align only when the counts match. Pair them when they
        // do; otherwise show the id alone rather than mislabel it.
        var raw = (raws.length === ids.length) ? raws[i] : "";
        rows.push({ id: id, raw: raw, cpl: e.cpl_type || "", collab: e.collaborative_type || "Local" });
      });
    });
    if (!rows.length) return "";
    var n = rows.length;
    return '<details class="cv-ex"><summary>' + n + ' MAP exhibit' + (n === 1 ? '' : 's') +
      ' under this common title</summary><div class="cv-ex-body">' +
      '<div class="cv-ex-hint">These are the separate exhibit records colleges articulate against. ' +
      'They are the same credential — the common title above is the CER reference that folds them.</div>' +
      rows.map(function (r) {
        return '<div class="cv-ex-row"><span class="cv-ex-id">' + esc(r.id) + '</span>' +
          '<span class="cv-ex-meta">' + esc(r.cpl) + (r.collab === "CCC Collaborative" ? ' · CCC' : '') + '</span>' +
          (r.raw ? '<div class="cv-ex-raw">' + esc(r.raw) + '</div>' : '') + '</div>';
      }).join("") + '</div></details>';
  }

  // ══════════════════════════════════════════════════════════════════════
  // CER Adoption Matrix — credentials down the side, colleges across the top
  // ══════════════════════════════════════════════════════════════════════
  // Sam's Excel pivot rendered on live MAP data. Four rulings from the scoping
  // run are INPUTS here, not open choices:
  //
  //  1. The opportunity number is the PEER BENCHMARK — what colleges that
  //     adopted this credential actually obtained — NEVER `rec_units_total`.
  //     83% of adoptions are partial (a college claims a median 3.07 of 9.26
  //     available recommendation lines) and NO college has ever reached the
  //     line total. A brown 36.0 on AP Biology would promise roughly triple
  //     what the strongest college in California has ever obtained, in a
  //     column that leaves this tab as a CSV. See
  //     docs/kb-notes/methodology-an-opportunity-figure-must-be-what-peers-achieved.md
  //  2. Columns open on COLLEGES (the region-first recommendation was overruled).
  //     District/region drill-down is the EXISTING filter bar narrowing the
  //     column set — not a second grain with its own roll-up arithmetic, which
  //     would need its own peer-benchmark reasoning to stay honest.
  //  3. Rows default to >= 2 adopting colleges.
  //  4. Opportunity lands on CREDIBLE cells only. A NON-adopter gets a figure
  //     only where the M-ID *likely* layer (`presByTitle`) says it already
  //     teaches a course mapping to this credential's identity. Brown on all
  //     118 would assert that every college in California should adopt every
  //     credential. An ADOPTER's figure is a different and self-evidently
  //     credible claim — it is already in the peer cohort, so "peers here get
  //     more than you have claimed" is a fact about a group it belongs to.
  //     That partial-adopter gap is 349 cells across 172 credentials, ~1,106
  //     units; Sam approved showing it 2026-08-17.
  //
  // WCAG 1.4.1 — the opportunity figure is PARENTHESISED as well as brown, so
  // the distinction survives colour-blindness, forced colours and a printout.

  // Column identity, in two layers that each catch what the other cannot.
  //
  // FIRST the committed roster rules (`rosterName`): sandbox orgs are dropped
  // outright and known duplicate spellings fold to a canonical name. Each of
  // those is an explicit, listed, reviewable decision — and the Python
  // generator reads the same file.
  //
  // THEN cplCollegeShort(), which absorbs anything the list has not caught yet
  // (Credit/Non-Credit, Community/Junior, punctuation, the ñ spellings). On its
  // own this second layer is NOT enough — resolving identity through a function
  // whose job is shortening headers is what hid a duplicate Cañada column for a
  // day, because the LABEL count read 118 over a 119-row axis. Belt and braces:
  // the explicit list keeps the audit trail, the resolver keeps a new duplicate
  // from silently splitting a column, and a test asserts no two columns collide.
  //
  // Measured 2026-08-17: 118 payload spellings and 119 prescriptive spellings
  // all resolve to 118 canonical columns, 118 distinct short-caps headers, zero
  // collisions, zero dropped cells.
  function mxName(c, style) {
    var n = rosterName(c);
    if (!n) return "";              // sandbox — callers must drop it
    var f = window.cplCollegeShort;
    return (f ? (f(n, style) || n) : n);
  }
  function round1(n) { return Math.round(n * 10) / 10; }

  function matrixColumns() {
    // A College/District/SW Region filter NARROWS the column set — that is
    // ruling 2's drill-down. Content filters (search, CPL type, discipline) do
    // NOT: they narrow rows, and a column vanishing because of one would read
    // as "this college has nothing", a different and false claim.
    var hasFilter = state.filters.college.length || state.filters.district.length
      || state.filters.swRegion.length;
    var seen = {}, cols = [];
    collegeNames.forEach(function (c) {
      if (hasFilter && !collegeMatchesFilters(c)) return;
      var k = mxName(c, "full");
      if (!k || seen[k]) return;
      seen[k] = 1;
      cols.push({ key: k, full: k, caps: mxName(c, "caps"), short: mxName(c, "short") });
    });
    cols.sort(function (a, b) { return a.short.localeCompare(b.short); });
    return cols;
  }

  // One row per common exhibit title, merging every (issuer, CPL type) card
  // that folds under it — the same grain the CER uses, and the grain Sam's
  // screenshot had. Deliberately NOT credentialKey(), which splits a title
  // carrying two NAMED issuers and yields 431 rows against this grain's 434.
  //
  // The peer median is RECOMPUTED over the merged per-college units rather than
  // lifted from any one card's `peer_units_median`, because the row is the
  // merged credential and the median has to be the median of what it shows.
  // For a single-card title the two are identical, which the test asserts.
  function matrixRows() {
    var byTitle = {}, order = [];
    getFiltered().forEach(function (e) {
      var t = e.unified_title || e.title || "";
      if (!t) return;
      var r = byTitle[t];
      if (!r) {
        r = byTitle[t] = { title: t, units: {}, adopted: {}, ids: {}, med: 0, max: 0, nAdopt: 0 };
        order.push(t);
      }
      var u = e.adopter_units || {};
      Object.keys(u).forEach(function (c) {
        var k = mxName(c, "full");
        if (!k) return;
        r.units[k] = (r.units[k] || 0) + (u[c] || 0);
      });
      (e.adopter_names || []).forEach(function (c) {
        var k = mxName(c, "full");
        if (k) r.adopted[k] = 1;
      });
      (e.exhibit_ids || (e.exhibit_id ? [e.exhibit_id] : [])).forEach(function (id) { r.ids[id] = 1; });
    });
    var rows = [];
    order.forEach(function (t) {
      var r = byTitle[t];
      // Adopters counted AFTER the fold: four spellings where one is the
      // sandbox and two are one institution honestly has two adopters.
      r.nAdopt = Object.keys(r.adopted).length;
      var vals = Object.keys(r.units).map(function (k) { return r.units[k]; })
        .filter(function (v) { return v > 0; }).sort(function (a, b) { return a - b; });
      if (vals.length) {
        var mid = Math.floor(vals.length / 2);
        r.med = round1(vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2);
        r.max = round1(vals[vals.length - 1]);
      }
      if (r.nAdopt >= state.matrixMin) rows.push(r);
    });
    // Open on the head: the most-adopted credentials carry most of the ink, so
    // the first screen is read rather than scrolled past.
    rows.sort(function (a, b) { return b.nAdopt - a.nAdopt || a.title.localeCompare(b.title); });
    return rows;
  }

  // The colleges the M-ID *likely* layer names for a title, keyed the same way
  // the columns are. This is ruling 4's gate for NON-adopters.
  function matrixLikelyFor(title) {
    var pres = presByTitle[title] || {}, out = {};
    Object.keys(pres).forEach(function (c) {
      var k = mxName(c, "full");
      if (k) out[k] = 1;
    });
    return out;
  }

  // What one cell says, as DATA — shared by the grid and the CSV export so the
  // spreadsheet can never disagree with the screen. This tab has fixed that
  // exact defect once already, and the export is the layer that reaches a
  // college by email, so the sharing is structural rather than a discipline.
  function matrixCell(r, colKey, likely) {
    var got = r.units[colKey] || 0;
    var isAdopter = !!r.adopted[colKey];
    var opp = 0;
    if (isAdopter) {
      // Partial adopter: the gap to what its peers typically obtained. No M-ID
      // gate needed — this college is already in the peer cohort.
      var gap = round1(r.med - got);
      if (gap >= 0.5) opp = gap;
    } else if (likely[colKey] && r.med > 0) {
      opp = r.med;
    }
    return { got: isAdopter ? round1(got) : 0, opp: opp, adopter: isAdopter };
  }

  function buildMatrixView() {
    var cols = matrixColumns();
    var rows = matrixRows();
    var showGot = state.matrixCells !== "opp";
    var showOpp = state.matrixCells !== "got";

    var out = [];
    out.push('<div class="mx-controls">' +
      '<fieldset class="mx-fs"><legend class="mx-lg">Rows — credentials with at least</legend>' +
        '<div class="mx-seg" role="radiogroup" aria-label="Minimum adopting colleges per row">' +
        [1, 2, 5, 10].map(function (n) {
          var id = "mx-min-" + n;
          return '<input type="radio" name="mx-min" class="mx-min-radio" id="' + id + '" value="' + n + '"' +
            (state.matrixMin === n ? ' checked' : '') + ' />' +
            '<label for="' + id + '">' + n + (n === 1 ? ' adopter' : ' adopters') + '</label>';
        }).join("") + '</div></fieldset>' +
      '<fieldset class="mx-fs"><legend class="mx-lg">Show in cells</legend>' +
        '<div class="mx-seg" role="radiogroup" aria-label="Cell contents">' +
        [["both", "Both"], ["got", "Adopted only"], ["opp", "Opportunity only"]].map(function (o) {
          var id = "mx-cells-" + o[0];
          return '<input type="radio" name="mx-cells" class="mx-cells-radio" id="' + id + '" value="' + o[0] + '"' +
            (state.matrixCells === o[0] ? ' checked' : '') + ' />' +
            '<label for="' + id + '">' + esc(o[1]) + '</label>';
        }).join("") + '</div></fieldset>' +
      '<fieldset class="mx-fs"><legend class="mx-lg">Export</legend>' +
        '<button class="sw-action-btn" id="mx-export-csv" type="button">⬇ Matrix CSV</button>' +
      '</fieldset></div>');

    out.push('<div class="mx-key">' +
      '<span><b class="mx-got">4</b> adopted — credit-recommendation units this college has articulated</span>' +
      '<span><b class="mx-opp">(3)</b> opportunity — units the median adopting peer obtained and this one has not</span>' +
      '<span><b class="mx-none">·</b> no signal</span></div>');

    if (!rows.length) {
      out.push('<div class="mx-note">No credentials match the current filters at this row threshold.</div>');
      return out.join("");
    }
    if (!cols.length) {
      out.push('<div class="mx-note">The active College / District / SW Region filter matches no college, ' +
        'so the matrix has no columns.</div>');
      return out.join("");
    }

    var green = 0, brown = 0, oppRows = 0;
    var head = '<thead><tr><th class="mx-corner" scope="col">Common exhibit title</th>' +
      cols.map(function (c) {
        return '<th class="mx-col" scope="col"><div><abbr class="sw-college" title="' +
          escAttr(c.full) + '">' + esc(c.caps) + '</abbr></div></th>';
      }).join("") + '</tr></thead>';

    var body = rows.map(function (r) {
      var likely = matrixLikelyFor(r.title);
      var rowOpp = 0;
      var cells = cols.map(function (c) {
        var v = matrixCell(r, c.key, likely);
        if (v.got > 0) green++;
        if (v.opp > 0 && !v.adopter) { brown++; rowOpp++; }
        var bits = [], cls = "mx-cell";
        if (showGot && v.got > 0) { bits.push('<span class="mx-has">' + fmtUnits(v.got) + '</span>'); }
        if (showOpp && v.opp > 0) { bits.push('<span class="mx-opp-cell">(' + fmtUnits(v.opp) + ')</span>'); }
        if (!bits.length) return '<td class="mx-cell mx-none">·</td>';
        // The title attribute is the drill-down Sam asked for on the unit
        // totals — it names the college and says which half is which, so the
        // meaning does not depend on remembering the legend.
        var tip = c.full + " — " +
          (v.adopter ? "has " + fmtUnits(v.got) + " units" : "has not adopted") +
          (v.opp > 0 ? "; peers here reach " + fmtUnits(r.med) + " (gap " + fmtUnits(v.opp) + ")" : "");
        return '<td class="' + cls + '" title="' + escAttr(tip) + '">' + bits.join(" ") + '</td>';
      }).join("");
      if (rowOpp > 0) oppRows++;

      var ids = Object.keys(r.ids).sort();
      var open = !!state.matrixExpanded[r.title];
      var meta = '<div class="mx-rmeta">' + r.nAdopt + ' adopting · peer median ' +
        fmtUnits(r.med) + 'u · best ' + fmtUnits(r.max) + 'u' +
        (ids.length ? ' · <button class="mx-disc" type="button" data-mx-title="' + escAttr(r.title) +
          '" aria-expanded="' + (open ? 'true' : 'false') + '">' + ids.length +
          ' exhibit' + (ids.length === 1 ? '' : 's') + '</button>' : '') + '</div>';
      var tr = '<tr><th class="mx-row" scope="row"><div class="mx-rtitle">' + esc(r.title) + '</div>' +
        meta + '</th>' + cells + '</tr>';
      if (open && ids.length) {
        tr += '<tr class="mx-exp"><td colspan="' + (cols.length + 1) + '">' +
          'MAP exhibit records folded under this common title: ' +
          ids.map(function (i) { return '<code>' + esc(i) + '</code>'; }).join("") + '</td></tr>';
      }
      return tr;
    }).join("");

    var cells = rows.length * cols.length;
    out.push('<div class="mx-box" tabindex="0" role="region" aria-label="Credential adoption matrix (scrollable)">' +
      '<table class="mx-table"><caption class="mx-sr-only">Credit-recommendation units by credential and college. ' +
      'A bare figure is what a college has articulated; a parenthesised figure is what the median adopting peer ' +
      'obtained and this college has not.</caption>' + head + '<tbody>' + body + '</tbody></table></div>');
    out.push('<div class="mx-stats">' + fmt(rows.length) + ' credentials × ' + fmt(cols.length) +
      ' colleges = ' + fmt(cells) + ' cells · ' +
      ((green + brown) / cells * 100).toFixed(1) + '% inked (' +
      (green / cells * 100).toFixed(1) + '% adopted, ' + (brown / cells * 100).toFixed(1) +
      '% opportunity) · ' + Math.round(oppRows / rows.length * 100) +
      '% of rows carry an opportunity.</div>');
    out.push('<div class="mx-note">Scroll sideways for the rest of the colleges — ' + fmt(cols.length) +
      ' numeric columns is about twice a desktop viewport, so the title column stays frozen. ' +
      'An opportunity figure is what adopting peers actually obtained, never the credential’s full ' +
      'recommendation total: 83% of adoptions are partial and no college has reached that total.</div>');
    return out.join("");
  }

  // Export. Re-derived from the SAME matrixCell() the grid uses, and led by a
  // provenance line, because a spreadsheet outlives the screen that made it and
  // "opportunity" is exactly the number that must not travel unexplained.
  function exportMatrixCSV() {
    var cols = matrixColumns(), rows = matrixRows();
    if (!rows.length || !cols.length) { alert("The matrix is empty under the current filters."); return; }
    var lines = [];
    lines.push(csvCell("Credit-recommendation units by credential and college. " +
      "Adopted = units this college has articulated. Opportunity = the median units colleges that " +
      "adopted this credential actually obtained, minus what this one has — NOT the credential's full " +
      "recommendation total, which no college has ever reached."));
    lines.push(csvCell("College scope: " + scopeLabelForExport()));
    lines.push(csvCell("Rows: credentials with at least " + state.matrixMin + " adopting college(s)"));
    lines.push(["Common exhibit title", "Adopting colleges", "Peer median units", "Best adopter units"]
      .concat(cols.map(function (c) { return c.short + " — adopted"; }))
      .concat(cols.map(function (c) { return c.short + " — opportunity"; }))
      .map(csvCell).join(","));
    rows.forEach(function (r) {
      var likely = matrixLikelyFor(r.title);
      var vals = cols.map(function (c) { return matrixCell(r, c.key, likely); });
      lines.push([csvCell(r.title), r.nAdopt, fmtUnits(r.med), fmtUnits(r.max)]
        .concat(vals.map(function (v) { return v.got > 0 ? fmtUnits(v.got) : ""; }))
        .concat(vals.map(function (v) { return v.opp > 0 ? fmtUnits(v.opp) : ""; }))
        .join(","));
    });
    downloadBlob(new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" }),
      "cer_adoption_matrix.csv");
  }


  function buildCredentialView() {
    var filtered = getFiltered();
    var grouped = groupToCredentials(filtered);
    var groups = grouped.groups, order = grouped.order;
    function bestPot(cards) { return cards.reduce(function (m, e) { return Math.max(m, e.potential || 0); }, 0); }
    function allUnclassified(cards) { return cards.every(function (e) { return e.is_classified === false; }); }
    // Same ordering spirit as the table: unclassified last, best-opportunity first.
    order.sort(function (a, b) {
      var ua = allUnclassified(groups[a]) ? 1 : 0, ub = allUnclassified(groups[b]) ? 1 : 0;
      return (ua - ub) || (bestPot(groups[b]) - bestPot(groups[a]));
    });

    var LIMIT = 50;
    var out = [];
    if (order.length > LIMIT) {
      out.push('<div class="cv-note">Showing top ' + LIMIT + ' of ' + fmt(order.length) +
        ' credentials — use the search box / filters above to narrow.</div>');
    }
    var nearMe = nearMeColleges();
    if (nearMe) {
      var scopeLbl = state.filters.college.length
        ? state.filters.college.join(", ")
        : state.filters.district.concat(state.filters.swRegion).join(", ");
      out.push('<div class="sv-banner">Scoped to <b>' + esc(scopeLbl) + '</b> — ' +
        esc(SCOPES[state.collegeScope].hint) + '</div>');
    }
    order.slice(0, LIMIT).forEach(function (k) {
      var cards = groups[k];
      var title = cards[0].unified_title || cards[0].title || "";
      // The issuer comes from the GROUP KEY, not cards[0] — a blank-issuer card
      // folded into a named credential must render under that credential's name.
      var issuer = k.slice(title.length + 2);
      // Anchor = the CCC version (most adopters) if any; else the top-adopter local card.
      var byAdopt = function (a, b) { return (b.adopters || 0) - (a.adopters || 0); };
      var ccc = cards.filter(function (e) { return e.collaborative_type === "CCC Collaborative"; }).sort(byAdopt);
      var isCCC = ccc.length > 0;
      var anchor = isCCC ? ccc[0] : cards.slice().sort(byAdopt)[0];
      var stdBadge = isCCC
        ? '<span class="cv-badge cv-ccc">🏛 Statewide CCC standard</span>'
        : '<span class="cv-badge cv-synth">⚙ Suggested standard (local) — not yet official</span>';
      var head = '<div class="cv-title">' + esc(title) +
        (issuer ? ' <span class="cv-issuer">· ' + esc(issuer) + '</span>' : '') + '</div>';
      var std = '<div class="cv-standard">' + stdBadge +
        ' <span class="cv-meta">' + esc(anchor.cpl_type || "") + ' · ' +
        (anchor.adopters || 0) + ' colleges · ' + (anchor.potential || 0) + ' potential</span>' +
        buildCreditRecsHtml(anchor.credit_recs) + '</div>';
      var others = cards.filter(function (e) { return e !== anchor; }).sort(byAdopt);
      var othersHtml = "";
      if (others.length) {
        othersHtml = '<div class="cv-others"><div class="cv-others-label">Other ways to earn credit:</div>' +
          others.map(function (e) {
            var badge = e.collaborative_type === "CCC Collaborative"
              ? '<span class="cv-badge cv-ccc">CCC</span>'
              : '<span class="cv-badge cv-local">' + esc(e.collaborative_type || "Local") + '</span>';
            return '<div class="cv-variant"><div class="cv-meta">' + esc(e.cpl_type || "") + ' ' + badge +
              ' · ' + (e.adopters || 0) + ' colleges · ' + (e.potential || 0) + ' potential</div>' +
              buildCreditRecsHtml(e.credit_recs) + '</div>';
          }).join("") + '</div>';
      }
      out.push('<div class="cv-credential">' + head +
        (nearMe ? buildNearMeHtml(cards, title, nearMe) : "") +
        std + othersHtml +
        buildAlignedExhibitsHtml(cards) +
        buildPrescriptiveHtml(title) + '</div>');
    });
    return out.join("") || '<div class="cv-note">No credentials match the current filters.</div>';
  }

  // ── Near-me band (folded in from the standalone Student view, 2026-08-16) ──
  // Same three states the v3 seeker lens used, rendered inside the credential
  // card instead of a third place to look: the college either HAS it, LIKELY
  // qualifies (and we name the local course), or has an aligned program only.
  // Each state is sourced from a different signal and they are never merged —
  // "already teaches the matching course" is a far stronger claim than "has a
  // program under the same TOP code", and the copy says which is which.
  function buildNearMeHtml(cards, title, nearMe) {
    var adoptSet = {}, potSet = {};
    cards.forEach(function (e) {
      (e.adopter_names || []).forEach(function (c) { adoptSet[c] = 1; });
      (e.potential_names || []).forEach(function (c) { potSet[c] = 1; });
    });
    var pres = presByTitle[title] || {};
    var avail = [], qualify = [], aligned = [];
    Object.keys(nearMe).forEach(function (c) {
      if (adoptSet[c]) avail.push(c);
      else if (pres[c]) qualify.push({ college: c, courses: pres[c] });
      else if (potSet[c] && state.collegeScope === "any") aligned.push(c);
    });
    var bits = [];
    if (avail.length) {
      bits.push('<div class="sv-status sv-yes"><b>Adopted</b> at ' +
        avail.sort().map(function (c) { return collegeChip(c, "sv-chip sv-chip-yes"); }).join(" ") + '</div>');
    }
    if (qualify.length) {
      bits.push('<div class="sv-status sv-maybe"><b>Could adopt — already teaches a matching course</b> at ' +
        qualify.map(function (q) {
          var courses = (q.courses || []).map(function (c) {
            var code = ((c.subject || "") + " " + (c.number || "")).trim();
            var u = (c.units != null && c.units !== "") ? " (" + fmtUnits(c.units) + "u)" : "";
            return '<span class="cv-rx-course">' + esc(code) + u + '</span>';
          }).join(", ");
          return collegeChip(q.college, "sv-chip sv-chip-maybe") +
            (courses ? ' <span class="sv-teaches">teaches ' + courses + '</span>' : '');
        }).join(" · ") + '</div>');
    }
    if (aligned.length) {
      bits.push('<div class="sv-status sv-prog"><b>Aligned program only</b> at ' +
        aligned.sort().slice(0, 8).map(function (c) { return collegeChip(c, "sv-chip sv-chip-prog"); }).join(" ") +
        (aligned.length > 8 ? ' <span class="sv-more">+' + (aligned.length - 8) + ' more</span>' : '') +
        ' <span class="sv-cta">— same TOP code or C-ID; a lead, not a match</span></div>');
    }
    return bits.join("");
  }

  // Set of college names matching the active college/district/region filters, or
  // null when none is active. This is the "near me" set the credential view's
  // near-me band classifies against (folded in from the standalone Student view,
  // 2026-08-16 — the seeker framing is a MODE of the credential view, not a third
  // place to look).
  function nearMeColleges() {
    var f = state.filters;
    if (!f.college.length && !f.district.length && !f.swRegion.length) return null;
    var set = {};
    collegeNames.forEach(function (c) { if (collegeMatchesFilters(c)) set[c] = 1; });
    return set;
  }

  // ── Build DOM ──
  function buildCard() {
    // Header count leads with COMMON EXHIBIT TITLES (2026-07-09 re-grain,
    // Sam's call) — distinct unified titles across the cards. The cards
    // themselves deliberately STAY at the (title, issuer, CPL type) grain:
    // AHA vs Red Cross First Aid are different credential records a curator
    // acts on; only the headline count collapses to the canonical grain.
    var totalPotential = 0, withPotential = 0, totalRecs = 0, statewide = 0, local = 0;
    var titleSet = {};
    exhibits.forEach(function (e) {
      totalPotential += (e.potential || 0);
      if (e.potential > 0) withPotential++;
      totalRecs += (e.credit_recs || []).length;
      if (e.collaborative_type === "CCC Collaborative") statewide++; else local++;
      titleSet[e.unified_title || e.title || ""] = 1;
    });
    var nCommonTitles = Object.keys(titleSet).length;

    var html = '<div class="sw-interactive">';

    html += '<div class="exhibit-card-header">' +
      '<div class="exhibit-card-title">Exhibit Adoption &amp; Credit Recommendations</div>' +
      '<div class="exhibit-card-subtitle">' + fmt(nCommonTitles) + ' common exhibit titles · ' +
      fmt(exhibits.length) + ' issuer/type cards (' +
      fmt(statewide) + ' CCC Collaborative, ' + fmt(local) + ' Local) | ' +
      fmt(withPotential) + ' with growth potential | ' +
      fmt(totalPotential) + ' potential new adoptions | ' +
      fmt(totalRecs) + ' credit recommendations</div></div>';

    // Page-level filter bar (search + multi-select filters). Built separately and
    // rendered ABOVE the gallery so it applies to every view (v1 table, v2
    // credential view, future audience views) instead of being repeated per card.
    var toolbarHtml = '<div class="sw-toolbar">'
      + '<input type="text" id="sw-search" placeholder="Search exhibits, colleges, courses..." />'
      + buildFilterButton("collabType", "Statewide / Local", collabTypes)
      + buildFilterButton("cplType", "CPL Type", cplTypes)
      + buildFilterButton("sector", "Career Cluster", sectors)
      + buildFilterButton("discipline", "TOP Code Category", disciplines)
      + (issuers.length ? buildFilterButton("issuer", "Issuing Agency", issuers) : "")
      + buildFilterButton("college", "College", collegeNames)
      + buildFilterButton("district", "District", districts)
      + buildFilterButton("swRegion", "SW Region", swRegions)
      + '</div>';

    html += '<div class="sw-action-bar">';
    html += '<label style="font-size:0.72rem;color:var(--text-body);cursor:pointer;display:flex;align-items:center;gap:0.3rem;">' +
      '<input type="checkbox" class="sw-chk" id="sw-select-all" /> Select All</label>';
    html += '<button class="sw-action-btn primary" id="sw-gen-report">Generate Word Report</button>';
    html += '<button class="sw-action-btn" id="sw-export-excel">Export Excel</button>';
    html += '<button class="sw-action-btn" id="sw-export-json">Export JSON</button>';
    html += '<span class="sw-count" id="sw-status"></span>';
    html += '</div>';

    // Shown on narrow screens only (CSS) — a 10-column table scrolls sideways
    // there, and a silently clipped table reads as missing columns.
    html += '<p class="sw-table-hint">This table scrolls sideways — swipe to see ' +
      'the adoption and could-adopt columns. The Credentials view above reflows to fit.</p>';
    html += '<div class="sw-table-wrap" id="sw-table-wrap" tabindex="0" role="region" ' +
      'aria-label="Exhibit adoption table (scrollable)">';
    html += '<table class="exhibit-table" id="sw-table"><thead><tr>' +
      '<th style="width:30px;"></th>' +
      '<th>Exhibit &amp; Credit Recommendations</th><th>Type</th><th>CPL Type</th><th>Discipline</th>' +
      '<th>Adopted</th><th>Potential</th>' +
      '<th>Colleges Adopted</th><th title="Colleges that have not adopted it, under the scope selected above.">Colleges — Could Adopt</th>' +
      '<th style="width:78px;" title="Curator flag — sign in via the Common Course Reference or Credential Reference tab to flag stale or duplicate cards.">Flag</th>' +
      '</tr></thead><tbody id="sw-tbody"></tbody></table>';

    // Pagination
    html += '<div class="sw-pagination" id="sw-pagination"></div>';
    html += '</div>';

    // ── Collapsible algorithm description (matches the 19 cards rendered by Python) ──
    html += '<div style="padding:0 1rem 0.8rem;">' +
      '<details class="algo-details">' +
        '<summary>How this is calculated</summary>' +
        '<div class="algo-body">' +
          '<div class="algo-row"><span class="algo-label">Source:</span> ' +
            '<span class="algo-value">View_ArticulatedMAPExhibits joined with college/district/region lookups from college_lookup.js.</span></div>' +
          '<div class="algo-row"><span class="algo-label">Formula:</span> ' +
            '<span class="algo-value">For each statewide (CCC Collaborative) exhibit: count adopting colleges and list potential adopters (colleges in the same district/region that are eligible but haven&apos;t articulated).</span></div>' +
          '<div class="algo-row"><span class="algo-label">Assumptions:</span> ' +
            '<span class="algo-value">Potential adopters = colleges in the CCC system not currently articulating this exhibit. Credit recs count each college-course pair separately.</span></div>' +
          '<div class="algo-row"><span class="algo-label">Caveats:</span> ' +
            '<span class="algo-value">Interactive filters (CPL Type, Discipline, District, SW Region) narrow results client-side. Exports reflect current filter state.</span></div>' +
          '<div class="algo-meta">Description last updated: 2026-04-19</div>' +
        '</div>' +
      '</details>' +
    '</div>';

    html += '</div>';

    // ── Two sub-tabs, replacing three stacked collapsibles (2026-08-16) ──
    // The three views were `<details>` sections that ALL re-rendered on every
    // keystroke, and the third (Student) was the same credential grouping under
    // a different framing — so it became a MODE of the credential view (the
    // near-me band) rather than a third place to look. Only the active view
    // renders now.
    container.innerHTML = CV_STYLE
      // Page-level filter bar (dark wrapper so the existing dark-bg toolbar styles
      // read correctly) — shared by both views below.
      + '<div class="sw-interactive sw-filterbar">' + toolbarHtml
      + buildScopeBar()
      + '<div class="sw-filterbar-hint">Search &amp; filters apply to whichever view is showing.</div></div>'
      + '<div class="sw-subtabs" role="tablist" aria-label="Exhibit adoption views">'
      +   '<button class="sw-subtab" data-view="credentials" role="tab" type="button"'
      +     ' id="sw-tab-credentials" aria-controls="sw-view-credentials">Credentials</button>'
      +   '<button class="sw-subtab" data-view="table" role="tab" type="button"'
      +     ' id="sw-tab-table" aria-controls="sw-view-table">Adoption table</button>'
      +   '<button class="sw-subtab" data-view="matrix" role="tab" type="button"'
      +     ' id="sw-tab-matrix" aria-controls="sw-view-matrix">Adoption matrix</button>'
      + '</div>'
      + '<div id="sw-view-credentials" class="sw-view" role="tabpanel" tabindex="0"'
      +   ' aria-labelledby="sw-tab-credentials"><div id="sw-cv-body" class="cv-body"></div></div>'
      + '<div id="sw-view-table" class="sw-view" role="tabpanel" tabindex="0"'
      +   ' aria-labelledby="sw-tab-table">' + html + '</div>'
      + '<div id="sw-view-matrix" class="sw-view" role="tabpanel" tabindex="0"'
      +   ' aria-labelledby="sw-tab-matrix"><div id="sw-mx-body"></div></div>';
    syncSubtabs();
  }

  // ── College scope control ──
  // Plain words, no glyphs: each option states what it matches. The hint below
  // restates it in a sentence, because "Adopted + any could-adopt" is a claim
  // about DATA QUALITY and the reader deserves to know which signal they bought.
  //
  // NATIVE RADIOS IN A FIELDSET, not styled buttons. The three scopes are
  // mutually exclusive, so a radiogroup is the right semantics — and taking the
  // native control means arrow-key navigation, "2 of 3, selected" announcements
  // and the focus ring all work without custom keyboard code. A hand-rolled
  // ARIA radiogroup is a thing to get subtly wrong; this one cannot be.
  // The hint is `aria-live` so changing scope ANNOUNCES what changed, rather
  // than silently re-filtering the page under a screen-reader user.
  function buildScopeBar() {
    var opts = ["adopted", "likely", "any"].map(function (k) {
      var id = "sw-scope-" + k;
      return '<span class="sw-scope-opt">' +
        '<input type="radio" name="sw-college-scope" id="' + id + '" class="sw-scope-radio" value="' + k + '"' +
        (k === state.collegeScope ? ' checked' : '') + ' />' +
        '<label for="' + id + '" class="sw-scope-btn">' + esc(SCOPES[k].label) + '</label></span>';
    }).join("");
    return '<fieldset class="sw-scopebar">' +
      '<legend class="sw-scope-label">College filter matches</legend>' + opts +
      '<span class="sw-scope-hint" id="sw-scope-hint" role="status" aria-live="polite"></span></fieldset>';
  }

  function syncScopeBar() {
    if (!container) return;
    container.querySelectorAll(".sw-scope-radio").forEach(function (r) {
      r.checked = r.value === state.collegeScope;
    });
    var hint = document.getElementById("sw-scope-hint");
    if (hint) hint.textContent = SCOPES[state.collegeScope].hint;
  }

  // Complete the ARIA tab pattern. A PARTIAL one is worse than none: it
  // announces "tab, 1 of 2" and then arrow keys do nothing, so the user is told
  // about an interaction that isn't there. Roving tabindex + arrow/Home/End are
  // wired in bindEvents().
  function selectView(v) {
    if (!v || v === state.view) return;
    state.view = v;
    syncSubtabs();
    renderRows();
  }

  function syncSubtabs() {
    if (!container) return;
    container.querySelectorAll(".sw-subtab").forEach(function (b) {
      var on = b.getAttribute("data-view") === state.view;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
      // Only the selected tab is in the tab order; arrows move between them.
      b.setAttribute("tabindex", on ? "0" : "-1");
    });
    var cred = document.getElementById("sw-view-credentials");
    var tbl = document.getElementById("sw-view-table");
    var mx = document.getElementById("sw-view-matrix");
    // `hidden` (not display:none) so the panel is removed from the a11y tree
    // and from find-in-page, which display:none alone on a wrapper can miss.
    if (cred) cred.hidden = state.view !== "credentials";
    if (tbl) tbl.hidden = state.view !== "table";
    if (mx) mx.hidden = state.view !== "matrix";
    syncScopeBar();
  }

  function buildFilterButton(key, label, options) {
    var id = "sw-filter-" + key;
    return '<div class="sw-filter-group" data-filter="' + key + '">' +
      '<button class="sw-filter-btn" id="' + id + '-btn">' + label + ' ▾</button>' +
      '<div class="sw-filter-dropdown" id="' + id + '-dd">' +
      '<input type="text" class="sw-filter-search" placeholder="Search ' + label.toLowerCase() + '..." />' +
      '<div class="sw-filter-options">' +
      options.map(function (o) {
        return '<label><input type="checkbox" value="' + escAttr(o) + '" /> ' + esc(o) + '</label>';
      }).join("") +
      '</div></div></div>';
  }

  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function escAttr(s) { return esc(s).replace(/"/g, "&quot;"); }
  // Compact college label for chips (full name kept in the title attr). Looks up
  // window.cplCollegeShort lazily at call time (college_short_names.js loads after
  // this file), falling back to the full name so a chip never renders blank.
  function SHORT(c) { var f = window.cplCollegeShort; return (f ? (f(c) || c) : c); }
  // A college chip: short label, full name on hover.
  // <abbr>, not <span> — the short label IS an abbreviation of the full college
  // name, and on a <span> the `title` is announced inconsistently (and on touch,
  // not at all). <abbr title> is the element assistive tech actually expands, so
  // the full name reaches a screen-reader user instead of living in a tooltip
  // only a mouse can reach. Visual weight is unchanged; the UA underline is
  // suppressed on the pill variants in CSS.
  function collegeChip(c, cls) {
    return '<abbr class="' + cls + '" title="' + escAttr(c) + '">' + esc(SHORT(c)) + '</abbr>';
  }

  // ── Consolidated credit recommendations (PR-1) ──
  // Each (course, credit) pair is one college's local mapping of the credential.
  // Rendering them all as a flat list reads like a stackable "bucket of CPL," when
  // a student really earns ONE college's mapping (~a few units). Group the recs by
  // (normalized course title, units), list the local course codes inline, and lead
  // with a "typical award" headline framed as alternatives, not a sum.
  function fmtUnits(u) {
    if (u == null) return "";
    return (u % 1 === 0) ? u.toFixed(0) : String(u);
  }
  // Parse a credit-rec list into (course title, units) buckets + a "typical
  // award" summary, on the SAME basis the v1/v2 list rendering uses (distinct
  // mappings, not raw rows). Shared by buildCreditRecsHtml (v1/v2) and the
  // Student view (v3) so the headline number is identical everywhere.
  //   → { grouped: [{units, title, courses:[…]}] (sorted), award: {modal,min,max,text}|null }
  function typicalAward(recs) {
    recs = recs || [];
    var groups = {}, order = [];
    recs.forEach(function (r) {
      var m = (r.credit || "").match(/^(\d+\.?\d*)\s*(?:hours?|units?)\s+(?:in\s+)?(.+)/i);
      var units = m ? parseFloat(m[1]) : null;
      var title = m ? m[2].trim() : (r.credit || r.course || "").trim();
      var key = title.toLowerCase().replace(/\s+/g, " ").trim() + "|" + (units == null ? "" : units);
      if (!groups[key]) { groups[key] = { units: units, title: title, courses: [] }; order.push(key); }
      if (r.course && groups[key].courses.indexOf(r.course) === -1) groups[key].courses.push(r.course);
    });
    var grouped = order.map(function (k) { return groups[k]; });
    // Surface the dominant mapping first (most local courses ≈ most colleges).
    grouped.sort(function (a, b) {
      return b.courses.length - a.courses.length || (a.units || 0) - (b.units || 0);
    });
    var unitVals = grouped.map(function (g) { return g.units; }).filter(function (u) { return u != null; });
    var award = null;
    if (unitVals.length) {
      var freq = {};
      unitVals.forEach(function (u) { freq[u] = (freq[u] || 0) + 1; });
      var modal = null, best = -1;
      // Highest frequency wins; ties break to the LOWER value (don't overstate).
      unitVals.forEach(function (u) {
        if (freq[u] > best || (freq[u] === best && (modal == null || u < modal))) { best = freq[u]; modal = u; }
      });
      var mn = Math.min.apply(null, unitVals), mx = Math.max.apply(null, unitVals);
      var text;
      if (mn === mx) {
        text = '~' + fmtUnits(modal) + ' unit' + (modal === 1 ? '' : 's');
      } else if (best <= 1) {
        // No repeated value → no real mode; lead with the honest range.
        text = fmtUnits(mn) + '–' + fmtUnits(mx) + ' units';
      } else {
        text = '~' + fmtUnits(modal) + ' unit' + (modal === 1 ? '' : 's') +
          ' (range ' + fmtUnits(mn) + '–' + fmtUnits(mx) + ')';
      }
      award = { modal: modal, min: mn, max: mx, text: text };
    }
    return { grouped: grouped, award: award };
  }
  function buildCreditRecsHtml(recs) {
    recs = recs || [];
    if (!recs.length) return "";

    var ta = typicalAward(recs);
    var grouped = ta.grouped;

    // "Typical award" headline from the per-group unit values.
    var headline = "";
    if (ta.award) {
      headline =
        '<div style="font-size:0.66rem;color:var(--mustard-text);font-weight:600;margin:0.15rem 0 0.05rem;">' +
          '💡 Typical CPL: ' + ta.award.text +
        '</div>' +
        '<div style="font-size:0.57rem;color:var(--text-muted);font-style:italic;margin-bottom:0.15rem;">' +
          'a student earns one college’s mapping below — not the sum' +
        '</div>';
    }

    var lines = grouped.map(function (g) {
      var label = (g.units != null)
        ? fmtUnits(g.units) + ' unit' + (g.units === 1 ? '' : 's') + ' — ' + esc(g.title)
        : esc(g.title);
      var codes = g.courses.length
        ? ' <span class="sw-rec-course">(' + g.courses.map(esc).join(", ") + ')</span>'
        : "";
      return '<div class="sw-rec-line">' + label + codes + '</div>';
    }).join("");

    return '<div class="sw-credit-recs">' + headline + lines + '</div>';
  }

  // ── Render rows (paginated) ──
  function renderRows() {
    var filtered = getFiltered();
    var tbody = document.getElementById("sw-tbody");
    if (!tbody) return;

    var totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    if (state.page >= totalPages) state.page = Math.max(0, totalPages - 1);
    var startIdx = state.page * PAGE_SIZE;
    var pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

    var hasCollegeFilter = state.filters.college.length || state.filters.district.length || state.filters.swRegion.length;
    var selectedCount = 0;
    var rows = [];

    pageItems.forEach(function (e) {
      var eid = e.exhibit_id || e.title;
      var checked = state.selected[eid] ? ' checked' : '';
      if (state.selected[eid]) selectedCount++;
      // Keyed `<eid>_pot` — the "+N more" handler has always WRITTEN that key
      // while this read used the bare eid, so expanding the college list has
      // never actually worked. One key, both sides.
      var isExpanded = state.expanded[eid + "_pot"];

      var adopters = hasCollegeFilter ? (e.adopter_names || []).filter(collegeMatchesFilters) : (e.adopter_names || []);
      // The could-adopt column is sourced from the SAME scope the filter used,
      // so a row can never be returned by one signal and justified by another.
      var couldAll = couldAdoptNamesFor(e, state.collegeScope);
      var potentials = hasCollegeFilter
        ? couldAll.filter(function (c) { return collegeMatchesFilters(c.college); })
        : couldAll;

      var adopterTags = adopters.length > 0
        ? adopters.map(function (c) { return collegeChip(c, "sw-college sw-adopted"); }).join(", ")
        : '<span style="opacity:0.4;font-style:italic;">none</span>';

      // A likely match (already teaches the mapping course) and a broad TOP/C-ID
      // lead are different claims. They were separated by an OUTLINE COLOUR
      // alone, which fails WCAG 1.4.1 (Use of Color) — a colour-blind or
      // high-contrast user saw one undifferentiated list. Split them into two
      // TEXT-LABELLED groups instead: the label carries the distinction, the
      // styling only reinforces it.
      function couldChip(c) {
        return collegeChip(c.college, "sw-college " + (c.likely ? "sw-potential sw-potential-likely" : "sw-potential"));
      }
      function couldGroup(label, list) {
        if (!list.length) return "";
        var shown = list, more = "";
        if (list.length > 10 && !isExpanded) {
          shown = list.slice(0, 10);
          more = ' <span class="sw-show-more" data-eid="' + escAttr(eid) + '" role="button" tabindex="0">+' +
            (list.length - 10) + ' more</span>';
        }
        return '<div class="sw-could-group"><span class="sw-could-label">' + esc(label) + '</span> ' +
          shown.map(couldChip).join(", ") + more + '</div>';
      }
      var potentialTags;
      if (state.collegeScope === "adopted") {
        potentialTags = '<span class="sw-col-empty">— (showing adoptions only)</span>';
      } else if (potentials.length > 0) {
        potentialTags =
          couldGroup("Already teaches a matching course:", potentials.filter(function (c) { return c.likely; })) +
          couldGroup("Same TOP code or C-ID (a lead):", potentials.filter(function (c) { return !c.likely; }));
      } else {
        potentialTags = '<span class="sw-col-empty">none identified</span>';
      }

      var typeBadge = e.collaborative_type === "CCC Collaborative"
        ? '<span class="sw-badge sw-badge-ccc">CCC</span>'
        : '<span class="sw-badge sw-badge-local">' + esc(e.collaborative_type || "Local") + '</span>';

      // Build consolidated credit recs inline under the title (PR-1: group by
      // (course title, units), local codes inline, + a "typical award" headline).
      var recsHtml = buildCreditRecsHtml(e.credit_recs);

      // Curator flag cell — small select (or read-only badge if not signed in).
      // No flag for anonymous viewers; flagged rows still show the badge so
      // everyone sees the curator's annotation.
      var currentFlag = (state.flags[eid] || {}).flag || "";
      var flagBy     = (state.flags[eid] || {}).reviewed_by || "";
      var flagAt     = (state.flags[eid] || {}).reviewed_at || "";
      var flagTitle  = currentFlag
        ? "Flagged " + currentFlag + (flagBy ? " by " + flagBy.split("@")[0] : "")
          + (flagAt ? " on " + flagAt.slice(0, 10) : "")
        : "Not flagged";
      var flagCell;
      if (state.sess) {
        flagCell = '<select class="sw-flag-select" data-eid="' + escAttr(eid) + '" title="' + escAttr(flagTitle) + '">'
          + '<option value=""'           + (currentFlag === ""          ? ' selected' : '') + '>—</option>'
          + '<option value="stale"'      + (currentFlag === "stale"     ? ' selected' : '') + '>🚩 stale</option>'
          + '<option value="duplicate"'  + (currentFlag === "duplicate" ? ' selected' : '') + '>🚩 dup</option>'
          + '</select>';
      } else if (currentFlag) {
        flagCell = '<span class="sw-flag-readonly" title="' + escAttr(flagTitle) + '">🚩 ' + esc(currentFlag) + '</span>';
      } else {
        flagCell = '<span class="sw-flag-none" title="Sign in via the Common Course Reference tab to flag cards.">—</span>';
      }

      // Title cell — PR-C2 layout: unified_title + issuer subtitle + confidence/quality badges
      // + "Also entered as N variants" disclosure when ≥2 raw titles fold into this card.
      var titleBits = '<div class="exhibit-cell-name">' + esc(e.title) + '</div>';
      var badgeBits = '';
      if (e.is_classified === false) {
        // Raw-fallback card — no KB classification at all. Surface for curator triage.
        badgeBits += '<span class="sw-conf-badge sw-conf-low" title="Raw exhibit title — no entry in the credential KB yet.">unclassified</span>';
      } else if ((e.confidence_title || 0) > 0 && (e.confidence_title || 0) < CONFIDENCE_THRESHOLD) {
        badgeBits += '<span class="sw-conf-badge" title="Modal title confidence ' + (e.confidence_title || 0).toFixed(2) + ' (threshold ' + CONFIDENCE_THRESHOLD.toFixed(2) + ' per vision §6.2).">needs review · ' + (e.confidence_title || 0).toFixed(2) + '</span>';
      }
      if (e.quality_flag === "suspect_course_as_exhibit") {
        badgeBits += '<span class="sw-quality-badge" title="At least one raw row was typed Industry Certification but appears to be a course with no associated credential (data-entry artifact).">⚠ course-as-exhibit</span>';
      }
      if (badgeBits) titleBits += '<div class="sw-title-badges">' + badgeBits + '</div>';
      if (e.issuing_agency) {
        titleBits += '<div class="sw-issuer-subtitle">' + esc(e.issuing_agency) +
          (e.training_agency ? ' · trainer: ' + esc(e.training_agency) : '') + '</div>';
      }
      var rawTitles = e.raw_titles || [];
      if (rawTitles.length >= 2) {
        titleBits += '<details class="sw-also-entered"><summary>Also entered as ' + (rawTitles.length) + ' variants</summary>' +
          '<ul class="sw-raw-titles">' +
          rawTitles.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') +
          '</ul></details>';
      }

      rows.push('<tr class="' + (state.selected[eid] ? 'sw-row-selected' : '') + '" data-eid="' + escAttr(eid) + '">' +
        '<td><input type="checkbox" class="sw-chk sw-row-chk"' + checked + ' /></td>' +
        '<td style="max-width:350px;">' + titleBits + recsHtml + '</td>' +
        '<td>' + typeBadge + '</td>' +
        '<td>' + esc(e.cpl_type || "") + '</td>' +
        '<td>' + esc(e.discipline || "") + '</td>' +
        '<td class="exhibit-cell-num">' + (e.adopters || 0) + '</td>' +
        '<td class="exhibit-cell-num" style="color:var(--mustard-text);font-weight:600;">' + (e.potential || 0) + '</td>' +
        '<td class="sw-college-list">' + adopterTags + '</td>' +
        '<td class="sw-college-list">' + potentialTags + '</td>' +
        '<td class="sw-flag-cell">' + flagCell + '</td></tr>');
    });

    tbody.innerHTML = rows.join("");

    // The credential view shares the same filtered set. Only render it when it
    // is the visible sub-tab — all three views used to rebuild on every
    // keystroke, over 2,673 cards.
    var cvBody = document.getElementById("sw-cv-body");
    if (cvBody && state.view === "credentials") cvBody.innerHTML = buildCredentialView();

    // Same rule for the matrix: 434 rows × 118 columns is ~51,000 cells, so it
    // must never rebuild while the user is typing in a different view.
    var mxBody = document.getElementById("sw-mx-body");
    if (mxBody && state.view === "matrix") mxBody.innerHTML = buildMatrixView();

    // Pagination controls
    renderPagination(filtered.length, totalPages);

    // Status
    var totalSelected = Object.keys(state.selected).length;
    var statusEl = document.getElementById("sw-status");
    if (statusEl) {
      statusEl.textContent = "Showing " + (startIdx + 1) + "-" + Math.min(startIdx + PAGE_SIZE, filtered.length) +
        " of " + fmt(filtered.length) + " exhibits" +
        (totalSelected > 0 ? " | " + totalSelected + " selected" : "");
    }
  }

  function renderPagination(totalItems, totalPages) {
    var el = document.getElementById("sw-pagination");
    if (!el || totalPages <= 1) { if (el) el.innerHTML = ""; return; }

    var html = [];
    html.push('<button class="sw-page-btn" data-page="prev"' + (state.page === 0 ? ' disabled' : '') + '>◀ Prev</button>');

    // Show max 7 page buttons
    var start = Math.max(0, state.page - 3);
    var end = Math.min(totalPages, start + 7);
    if (end - start < 7) start = Math.max(0, end - 7);

    if (start > 0) {
      html.push('<button class="sw-page-btn" data-page="0">1</button>');
      if (start > 1) html.push('<span style="color:var(--text-muted);padding:0 4px;">…</span>');
    }
    for (var i = start; i < end; i++) {
      html.push('<button class="sw-page-btn' + (i === state.page ? ' active' : '') + '" data-page="' + i + '">' + (i + 1) + '</button>');
    }
    if (end < totalPages) {
      if (end < totalPages - 1) html.push('<span style="color:var(--text-muted);padding:0 4px;">…</span>');
      html.push('<button class="sw-page-btn" data-page="' + (totalPages - 1) + '">' + totalPages + '</button>');
    }

    html.push('<button class="sw-page-btn" data-page="next"' + (state.page >= totalPages - 1 ? ' disabled' : '') + '>Next ▶</button>');
    el.innerHTML = html.join("");
  }

  // ── Bind events ──
  function bindEvents() {
    var debounceTimer;
    var searchEl = document.getElementById("sw-search");
    if (searchEl) {
      searchEl.addEventListener("input", function () {
        var val = this.value;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          state.search = val;
          invalidateCache();
          renderRows();
        }, 300);
      });
    }

    // Curator flag select → save to Supabase + update local state.
    container.addEventListener("change", function (ev) {
      var sel = ev.target.closest(".sw-flag-select");
      if (!sel || !state.sess) return;
      var eid = sel.getAttribute("data-eid");
      var newFlag = sel.value;
      var prev = state.flags[eid] || {};
      sel.disabled = true;
      saveFlag(eid, newFlag, state.sess)
        .then(function (resp) {
          sel.disabled = false;
          if (!resp.ok) {
            // Revert on failure.
            sel.value = prev.flag || "";
            return;
          }
          state.flags[eid] = {
            flag: newFlag,
            reviewed_by: state.sess.email,
            reviewed_at: new Date().toISOString(),
          };
          // Update tooltip in place; full re-render isn't needed for one
          // cell change.
          var newTitle = newFlag
            ? "Flagged " + newFlag + " by " + state.sess.email.split("@")[0]
              + " on " + new Date().toISOString().slice(0, 10)
            : "Not flagged";
          sel.title = newTitle;
        })
        .catch(function () { sel.disabled = false; sel.value = prev.flag || ""; });
    });

    // ── Sub-tab keyboard navigation (the other half of role="tablist") ──
    // Left/Right move between tabs and ACTIVATE on arrival (the automatic
    // activation pattern, correct when switching is cheap and lossless);
    // Home/End jump to the ends. Without this the role is a promise we break.
    container.addEventListener("keydown", function (ev) {
      // "+N more" is a span carrying role="button", so it gets no native key
      // activation — a mouse-only control is invisible to a keyboard user.
      var more = ev.target.closest && ev.target.closest(".sw-show-more");
      if (more && (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar")) {
        ev.preventDefault();
        state.expanded[more.getAttribute("data-eid") + "_pot"] = true;
        renderRows();
        return;
      }

      var tab = ev.target.closest && ev.target.closest(".sw-subtab");
      if (!tab) return;
      var keys = { ArrowLeft: -1, ArrowRight: 1, Home: "first", End: "last" };
      if (!(ev.key in keys)) return;
      if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
      var tabs = Array.prototype.slice.call(container.querySelectorAll(".sw-subtab"));
      var i = tabs.indexOf(tab), move = keys[ev.key], next;
      if (move === "first") next = tabs[0];
      else if (move === "last") next = tabs[tabs.length - 1];
      else next = tabs[(i + move + tabs.length) % tabs.length];
      if (!next) return;
      ev.preventDefault();
      selectView(next.getAttribute("data-view"));
      next.focus();
    });

    container.addEventListener("click", function (ev) {
      // Sub-tab switch. The newly-shown view may be stale (renderRows only
      // builds the visible one), so re-render after flipping.
      var sub = ev.target.closest(".sw-subtab");
      if (sub) {
        selectView(sub.getAttribute("data-view"));
        return;
      }

      // Matrix CSV. Re-derived from the same matrixCell() the grid uses, so the
      // spreadsheet cannot disagree with the screen.
      if (ev.target.closest("#mx-export-csv")) {
        exportMatrixCSV();
        return;
      }

      // Matrix row disclosure — which MAP exhibit records fold under this
      // common title. Open state lives in `state`, not the DOM, because
      // renderRows() rewrites the whole grid.
      var disc = ev.target.closest(".mx-disc");
      if (disc) {
        var mxT = disc.getAttribute("data-mx-title");
        if (state.matrixExpanded[mxT]) delete state.matrixExpanded[mxT];
        else state.matrixExpanded[mxT] = 1;
        renderRows();
        return;
      }

      // Gallery section disclosure (v1 table / v2 credential view). The native
      // <details> marker is hidden for styling, so drive the open state in JS
      // too — this is immune to any stacking/overflow quirk in the v1 table
      // that could swallow the summary's native toggle. preventDefault stops the
      // native toggle from racing ours (a double-toggle reads as "nothing happened").
      var galSum = ev.target.closest(".sw-gallery-sum");
      if (galSum) {
        var galDet = galSum.closest("details");
        if (galDet) {
          ev.preventDefault();
          if (galDet.open) galDet.removeAttribute("open");
          else galDet.setAttribute("open", "");
        }
        return;
      }

      // Show more potential colleges
      var showMore = ev.target.closest(".sw-show-more");
      if (showMore) {
        var eid2 = showMore.getAttribute("data-eid");
        state.expanded[eid2 + "_pot"] = true;
        renderRows();
        return;
      }

      // Pagination
      var pageBtn = ev.target.closest(".sw-page-btn");
      if (pageBtn && !pageBtn.disabled) {
        var p = pageBtn.getAttribute("data-page");
        var filtered = getFiltered();
        var totalPages = Math.ceil(filtered.length / PAGE_SIZE);
        if (p === "prev") state.page = Math.max(0, state.page - 1);
        else if (p === "next") state.page = Math.min(totalPages - 1, state.page + 1);
        else state.page = parseInt(p, 10);
        renderRows();
        // Scroll to top of table
        var wrap = document.getElementById("sw-table-wrap");
        if (wrap) wrap.scrollTop = 0;
        return;
      }

      // Filter dropdown toggle
      var btn = ev.target.closest(".sw-filter-btn");
      if (btn) {
        var group = btn.closest(".sw-filter-group");
        var dd = group.querySelector(".sw-filter-dropdown");
        container.querySelectorAll(".sw-filter-dropdown.open").forEach(function (d) {
          if (d !== dd) d.classList.remove("open");
        });
        dd.classList.toggle("open");
        if (dd.classList.contains("open")) {
          var si = dd.querySelector(".sw-filter-search");
          if (si) setTimeout(function () { si.focus(); }, 50);
        }
        ev.stopPropagation();
      }
    });

    document.addEventListener("click", function (ev) {
      if (!ev.target.closest(".sw-filter-group")) {
        container.querySelectorAll(".sw-filter-dropdown.open").forEach(function (d) { d.classList.remove("open"); });
      }
    });

    container.addEventListener("change", function (ev) {
      var cb = ev.target;
      // Radios (the college-scope control) as well as checkboxes — the old
      // checkbox-only guard would have silently swallowed every scope change.
      if (cb.type !== "checkbox" && cb.type !== "radio") return;

      if (cb.classList.contains("sw-row-chk")) {
        var tr = cb.closest("tr");
        var eid = tr.getAttribute("data-eid");
        if (cb.checked) { state.selected[eid] = true; tr.classList.add("sw-row-selected"); }
        else { delete state.selected[eid]; tr.classList.remove("sw-row-selected"); }
        updateStatus();
        return;
      }

      if (cb.id === "sw-select-all") {
        var filtered = getFiltered();
        if (cb.checked) {
          filtered.forEach(function (e) { state.selected[e.exhibit_id || e.title] = true; });
        } else {
          filtered.forEach(function (e) { delete state.selected[e.exhibit_id || e.title]; });
        }
        renderRows();
        return;
      }

      // Matrix row depth and cell contents. These change only what the matrix
      // DISPLAYS, not the filtered card set, so the filter cache stays valid —
      // invalidating it here would rebuild all 2,673 cards to answer a question
      // about display.
      if (cb.classList.contains("mx-min-radio")) {
        state.matrixMin = parseInt(cb.value, 10) || 1;
        renderRows();
        return;
      }
      if (cb.classList.contains("mx-cells-radio")) {
        state.matrixCells = cb.value;
        renderRows();
        return;
      }

      // College scope (native radio). Changing which colleges a filter matches
      // changes the RESULT SET, so the cache must go — page 0, like any filter.
      if (cb.classList.contains("sw-scope-radio")) {
        state.collegeScope = cb.value;
        syncScopeBar();
        invalidateCache();
        renderRows();
        return;
      }

      var group = cb.closest(".sw-filter-group");
      if (group) {
        var filterKey = group.getAttribute("data-filter");
        updateFilterState(filterKey, group);
        invalidateCache();
        renderRows();
        var btnEl = group.querySelector(".sw-filter-btn");
        var labels = { collabType: "Statewide / Local", cplType: "CPL Type", sector: "Career Cluster", discipline: "TOP Code Category", issuer: "Issuing Agency", college: "College", district: "District", swRegion: "SW Region" };
        var count = state.filters[filterKey].length;
        btnEl.textContent = labels[filterKey] + (count > 0 ? " (" + count + ")" : "") + " ▾";
        btnEl.classList.toggle("active", count > 0);
      }
    });

    container.addEventListener("input", function (ev) {
      if (ev.target.classList.contains("sw-filter-search")) {
        var q = ev.target.value.toLowerCase();
        ev.target.closest(".sw-filter-dropdown").querySelectorAll("label").forEach(function (lbl) {
          lbl.style.display = lbl.textContent.toLowerCase().indexOf(q) !== -1 ? "" : "none";
        });
      }
    });

    document.getElementById("sw-gen-report").addEventListener("click", generateWordReport);
    document.getElementById("sw-export-excel").addEventListener("click", exportExcel);
    document.getElementById("sw-export-json").addEventListener("click", exportJSON);
  }

  function updateFilterState(key, group) {
    var checks = group.querySelectorAll('.sw-filter-options input[type=checkbox]:checked');
    state.filters[key] = Array.prototype.map.call(checks, function (c) { return c.value; });
  }

  function updateStatus() {
    var count = Object.keys(state.selected).length;
    var filtered = getFiltered();
    var startIdx = state.page * PAGE_SIZE;
    var statusEl = document.getElementById("sw-status");
    if (statusEl) {
      statusEl.textContent = "Showing " + (startIdx + 1) + "-" + Math.min(startIdx + PAGE_SIZE, filtered.length) +
        " of " + fmt(filtered.length) + " exhibits" + (count > 0 ? " | " + count + " selected" : "");
    }
  }

  // ── Exports ──
  // An export that disagrees with the screen is the same defect this tab just
  // fixed, one layer down — and it is the layer that gets emailed to a college.
  // Every export re-derives its could-adopt list from the ACTIVE scope and
  // labels which scope produced it, so a broad TOP/C-ID lead list can never
  // leave here dressed as an adoption worklist.
  function scopeLabelForExport() {
    return SCOPES[state.collegeScope].label + " — " + SCOPES[state.collegeScope].hint;
  }
  function couldAdoptForExport(e) {
    return couldAdoptNamesFor(e, state.collegeScope).map(function (c) {
      return c.likely ? c.college + " (teaches a matching course)" : c.college;
    });
  }

  function exportJSON() {
    var data = getSelectedExhibits();
    if (!data.length) { alert("Select at least one exhibit to export."); return; }
    // Ship the scope alongside the rows, and re-key could-adopt to it. The raw
    // `potential_names` stays available under its own name so nothing is lost \u2014
    // it just no longer masquerades as the answer to "who could adopt this".
    var payload = {
      _scope: state.collegeScope,
      _scope_meaning: scopeLabelForExport(),
      _exported_at: new Date().toISOString(),
      exhibits: data.map(function (e) {
        var row = {};
        Object.keys(e).forEach(function (k) { row[k] = e[k]; });
        row.could_adopt_names = couldAdoptForExport(e);
        row.could_adopt = row.could_adopt_names.length;
        return row;
      })
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    downloadBlob(blob, "exhibit_adoption_export.json");
  }

  function exportExcel() {
    var data = getSelectedExhibits();
    if (!data.length) { alert("Select at least one exhibit to export."); return; }
    var headers = ["Exhibit Title", "Type", "CPL Type", "Discipline", "Adopters", "Could Adopt",
      "Credit Recs", "Colleges Adopted", "Colleges Could Adopt", "Credit Recommendation Details"];
    var rows = data.map(function (e) {
      var recDetails = (e.credit_recs || []).map(function (r) { return r.course + ": " + r.credit; }).join(" | ");
      var could = couldAdoptForExport(e);
      return [csvCell(e.title), csvCell(e.collaborative_type || "Local"), csvCell(e.cpl_type || ""),
        csvCell(e.discipline || ""), e.adopters || 0, could.length, (e.credit_recs || []).length,
        csvCell((e.adopter_names || []).join("; ")), csvCell(could.join("; ")),
        csvCell(recDetails)].join(",");
    });
    // A leading provenance line, because a spreadsheet outlives the screen that
    // produced it and "Could Adopt" means three different things.
    var scopeNote = csvCell("Could-adopt scope: " + scopeLabelForExport());
    var csv = scopeNote + "\n" + headers.join(",") + "\n" + rows.join("\n");
    downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), "exhibit_adoption_export.csv");
  }

  function csvCell(s) { return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }

  function generateWordReport() {
    var data = getSelectedExhibits();
    if (!data.length) { alert("Select at least one exhibit to generate a report."); return; }
    if (typeof docx === "undefined") { alert("Word document library (docx.min.js) not loaded."); return; }

    var children = [];
    children.push(new docx.Paragraph({
      children: [new docx.TextRun({ text: "Exhibit Adoption & Credit Recommendations Report", bold: true, size: 32, font: "Calibri" })],
      spacing: { after: 200 }, alignment: docx.AlignmentType.CENTER
    }));
    children.push(new docx.Paragraph({
      children: [new docx.TextRun({ text: "Generated: " + new Date().toLocaleDateString() + " | " + data.length + " exhibits", size: 20, color: "666666", font: "Calibri" })],
      spacing: { after: 120 }, alignment: docx.AlignmentType.CENTER
    }));
    // The report can be forwarded to a college. Say what "could adopt" meant
    // when it was generated, in the document itself.
    children.push(new docx.Paragraph({
      children: [new docx.TextRun({ text: "Could-adopt scope: " + scopeLabelForExport(), size: 18, color: "666666", italics: true, font: "Calibri" })],
      spacing: { after: 400 }, alignment: docx.AlignmentType.CENTER
    }));

    data.forEach(function (e, idx) {
      children.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: (idx + 1) + ". " + e.title, bold: true, size: 24, font: "Calibri" })],
        spacing: { before: 300, after: 100 },
        border: { bottom: { style: docx.BorderStyle.SINGLE, size: 1, color: "CCCCCC" } }
      }));
      children.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: "Type: " + (e.collaborative_type || "Local") + "  |  CPL: " + (e.cpl_type || "N/A") + "  |  Discipline: " + (e.discipline || "N/A") + "  |  Adopters: " + (e.adopters || 0) + "  |  Could adopt: " + couldAdoptForExport(e).length, size: 18, color: "555555", font: "Calibri" })],
        spacing: { after: 100 }
      }));

      var recs = e.credit_recs || [];
      if (recs.length > 0) {
        children.push(new docx.Paragraph({ children: [new docx.TextRun({ text: "Credit Recommendations (" + recs.length + "):", bold: true, size: 20, font: "Calibri" })], spacing: { before: 100 } }));
        recs.forEach(function (r) {
          children.push(new docx.Paragraph({
            children: [new docx.TextRun({ text: r.course + ": ", bold: true, size: 18, font: "Calibri" }), new docx.TextRun({ text: r.credit, size: 18, font: "Calibri" })],
            spacing: { after: 40 }, indent: { left: 360 }
          }));
        });
      }

      children.push(new docx.Paragraph({ children: [new docx.TextRun({ text: "Colleges Adopted (" + (e.adopters || 0) + "):", bold: true, size: 20, font: "Calibri" })], spacing: { before: 100 } }));
      children.push(new docx.Paragraph({ children: [new docx.TextRun({ text: (e.adopter_names || []).join(", ") || "None", size: 18, font: "Calibri" })], spacing: { after: 100 } }));
      var couldNames = couldAdoptForExport(e);
      children.push(new docx.Paragraph({ children: [new docx.TextRun({ text: "Colleges That Could Adopt (" + couldNames.length + "):", bold: true, size: 20, font: "Calibri" })], spacing: { before: 100 } }));
      children.push(new docx.Paragraph({ children: [new docx.TextRun({ text: couldNames.join(", ") || "None identified", size: 18, font: "Calibri" })], spacing: { after: 200 } }));
    });

    var doc = new docx.Document({ sections: [{ properties: {}, children: children }] });
    docx.Packer.toBlob(doc).then(function (blob) { downloadBlob(blob, "Exhibit_Adoption_Report.docx"); });
  }

  function getSelectedExhibits() {
    var keys = Object.keys(state.selected);
    return keys.length ? exhibits.filter(function (e) { return state.selected[e.exhibit_id || e.title]; }) : getFiltered();
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a"); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  // ── Init (deferred until the EACR tab is first opened) ──
  // Assign the lazy-loaded data, derive the filter vocab, then build the card
  // chrome so the table is visible immediately; the Supabase flag overlay loads
  // in the background and triggers a re-render when it lands. Anonymous viewers
  // see the table fully without waiting.
  function start() {
    DATA = window.CPL_STATEWIDE;
    if (!DATA || !DATA.exhibits) return;
    exhibits = DATA.exhibits;
    container = document.getElementById("statewide-interactive-container");
    if (!container) return;
    sortExhibits();
    deriveFromData();
    state.sess = getSession();
    buildCard();
    renderRows();
    bindEvents();
    fetchFlagOverlay().then(function (m) {
      state.flags = m || {};
      // Re-render so existing flags surface on first paint after the fetch.
      renderRows();
    });
  }

  // Lazy boot (perf): pull the heavy CPL_STATEWIDE (+ prescriptive) payload only
  // when the Exhibit-Adoption (EACR) tab is first activated — it's ~7 MB and not
  // needed for the default dashboard view. See tabs.js onActivate/loadScript.
  if (window.CPL_TABS && CPL_TABS.onActivate) {
    CPL_TABS.onActivate("exhibit-adoption", function () {
      CPL_TABS.loadScript("statewide_data.js", "CPL_STATEWIDE", function () {
        CPL_TABS.loadScript("statewide_prescriptive.js", "CPL_STATEWIDE_PRESCRIPTIVE", start);
      });
    });
  } else {
    // Fallback (tabs.js absent — unit tests, or a load-order regression): eager
    // start, as before the lazy split. start() guards on the data global itself.
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
  }
})();
