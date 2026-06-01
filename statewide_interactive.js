/**
 * Statewide Exhibit Adoption — Interactive Card
 * Reads window.CPL_STATEWIDE and window.CCC_COLLEGE_LOOKUP
 * Paginated (50 rows/page), search, multi-select filters, checkboxes,
 * expandable credit recs, Statewide/Local toggle, Word/Excel/JSON export
 */
(function () {
  "use strict";

  var DATA = window.CPL_STATEWIDE;
  var LOOKUP = window.CCC_COLLEGE_LOOKUP || {};
  if (!DATA || !DATA.exhibits) return;

  var exhibits = DATA.exhibits;
  var container = document.getElementById("statewide-interactive-container");
  if (!container) return;

  // ── Default order (Sam's tweaks, 2026-06-01) ──
  //  (1) Sink UNCLASSIFIED cards (no credential identity in the KB yet) to the
  //      bottom — lowest confidence, least actionable, and it collects the
  //      "curate the unclassified" triage backlog in one place.
  //  (2) Cluster a credential's variants together (CompTIA A+ was scattered)
  //      while keeping high-opportunity credentials near the top: order each
  //      (issuer, credential) cluster by its best potential, then issuer + title
  //      so variants stay contiguous, then potential/adopters within.
  (function sortExhibits() {
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
  })();

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

  // ── Derive filter option sets ──
  var cplTypes = unique(exhibits.map(function (e) { return e.cpl_type || "Unknown"; }));
  var disciplines = unique(exhibits.map(function (e) { return e.discipline || "Unknown"; }));
  var sectors = unique(exhibits.map(function (e) { return e.sector || "Unassigned"; }));
  var collabTypes = unique(exhibits.map(function (e) { return e.collaborative_type || "Local"; }));
  // Issuing agencies — only collect non-empty (cards without an issuer skip the filter).
  // Added by EACR Phase 4 PR-C2 once the generator started emitting e.issuing_agency.
  var issuers = unique(exhibits.map(function (e) { return e.issuing_agency || ""; }).filter(Boolean));
  // Vision §6.2 — cards with modal confidence_title below this threshold get a "needs review" badge.
  var CONFIDENCE_THRESHOLD = 0.75;

  // Collect all college names across adopters + potential
  var allColleges = {};
  exhibits.forEach(function (e) {
    (e.adopter_names || []).concat(e.potential_names || []).forEach(function (c) { allColleges[c] = 1; });
  });
  var collegeNames = Object.keys(allColleges).sort();

  var districtSet = {}, swRegionSet = {};
  collegeNames.forEach(function (c) {
    var info = LOOKUP[c];
    if (info) {
      if (info.district) districtSet[info.district] = 1;
      if (info.swRegion) swRegionSet[info.swRegion] = 1;
    }
  });
  var districts = Object.keys(districtSet).sort();
  var swRegions = Object.keys(swRegionSet).sort();

  // ── State ──
  var state = {
    search: "",
    filters: { collabType: [], cplType: [], sector: [], discipline: [], issuer: [], college: [], district: [], swRegion: [] },
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
      var names = (e.adopter_names || []).concat(e.potential_names || []);
      if (!names.some(collegeMatchesFilters)) return false;
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

  // ── Build DOM ──
  function buildCard() {
    var totalPotential = 0, withPotential = 0, totalRecs = 0, statewide = 0, local = 0;
    exhibits.forEach(function (e) {
      totalPotential += (e.potential || 0);
      if (e.potential > 0) withPotential++;
      totalRecs += (e.credit_recs || []).length;
      if (e.collaborative_type === "CCC Collaborative") statewide++; else local++;
    });

    var html = '<div class="sw-interactive">';

    html += '<div class="exhibit-card-header">' +
      '<div class="exhibit-card-title">Exhibit Adoption &amp; Credit Recommendations</div>' +
      '<div class="exhibit-card-subtitle">' + fmt(exhibits.length) + ' exhibits (' +
      fmt(statewide) + ' CCC Collaborative, ' + fmt(local) + ' Local) | ' +
      fmt(withPotential) + ' with growth potential | ' +
      fmt(totalPotential) + ' potential new adoptions | ' +
      fmt(totalRecs) + ' credit recommendations</div></div>';

    html += '<div class="sw-toolbar">';
    html += '<input type="text" id="sw-search" placeholder="Search exhibits, colleges, courses..." />';
    html += buildFilterButton("collabType", "Statewide / Local", collabTypes);
    html += buildFilterButton("cplType", "CPL Type", cplTypes);
    html += buildFilterButton("sector", "Career Cluster", sectors);
    html += buildFilterButton("discipline", "TOP Code Category", disciplines);
    if (issuers.length) html += buildFilterButton("issuer", "Issuing Agency", issuers);
    html += buildFilterButton("college", "College", collegeNames);
    html += buildFilterButton("district", "District", districts);
    html += buildFilterButton("swRegion", "SW Region", swRegions);
    html += '</div>';

    html += '<div class="sw-action-bar">';
    html += '<label style="font-size:0.72rem;color:rgba(255,255,255,0.7);cursor:pointer;display:flex;align-items:center;gap:0.3rem;">' +
      '<input type="checkbox" class="sw-chk" id="sw-select-all" /> Select All</label>';
    html += '<button class="sw-action-btn primary" id="sw-gen-report">Generate Word Report</button>';
    html += '<button class="sw-action-btn" id="sw-export-excel">Export Excel</button>';
    html += '<button class="sw-action-btn" id="sw-export-json">Export JSON</button>';
    html += '<span class="sw-count" id="sw-status"></span>';
    html += '</div>';

    html += '<div class="sw-table-wrap" id="sw-table-wrap">';
    html += '<table class="exhibit-table" id="sw-table"><thead><tr>' +
      '<th style="width:30px;"></th>' +
      '<th>Exhibit &amp; Credit Recommendations</th><th>Type</th><th>CPL Type</th><th>Discipline</th>' +
      '<th>Adopted</th><th>Potential</th>' +
      '<th>Colleges Adopted</th><th>Colleges — Potential Adopters</th>' +
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

    container.innerHTML = html;
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
  function buildCreditRecsHtml(recs) {
    recs = recs || [];
    if (!recs.length) return "";

    // Parse "N hours in Title" → {units, title}; keep unparseable recs as raw.
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

    // "Typical award" headline from the per-group unit values.
    var unitVals = grouped.map(function (g) { return g.units; }).filter(function (u) { return u != null; });
    var headline = "";
    if (unitVals.length) {
      var freq = {};
      unitVals.forEach(function (u) { freq[u] = (freq[u] || 0) + 1; });
      var modal = null, best = -1;
      // Highest frequency wins; ties break to the LOWER value (don't overstate).
      unitVals.forEach(function (u) {
        if (freq[u] > best || (freq[u] === best && (modal == null || u < modal))) { best = freq[u]; modal = u; }
      });
      var mn = Math.min.apply(null, unitVals), mx = Math.max.apply(null, unitVals);
      var awardTxt;
      if (mn === mx) {
        awardTxt = '~' + fmtUnits(modal) + ' unit' + (modal === 1 ? '' : 's');
      } else if (best <= 1) {
        // No repeated value → no real mode; lead with the honest range.
        awardTxt = fmtUnits(mn) + '–' + fmtUnits(mx) + ' units';
      } else {
        awardTxt = '~' + fmtUnits(modal) + ' unit' + (modal === 1 ? '' : 's') +
          ' (range ' + fmtUnits(mn) + '–' + fmtUnits(mx) + ')';
      }
      headline =
        '<div style="font-size:0.66rem;color:#C9A84C;font-weight:600;margin:0.15rem 0 0.05rem;">' +
          '💡 Typical CPL: ' + awardTxt +
        '</div>' +
        '<div style="font-size:0.57rem;color:rgba(255,255,255,0.45);font-style:italic;margin-bottom:0.15rem;">' +
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
      var isExpanded = state.expanded[eid];

      var adopters = hasCollegeFilter ? (e.adopter_names || []).filter(collegeMatchesFilters) : (e.adopter_names || []);
      var potentials = hasCollegeFilter ? (e.potential_names || []).filter(collegeMatchesFilters) : (e.potential_names || []);

      var adopterTags = adopters.length > 0
        ? adopters.map(function (c) { return '<span class="sw-college sw-adopted">' + esc(c) + '</span>'; }).join(", ")
        : '<span style="opacity:0.4;font-style:italic;">none</span>';

      var potentialTags;
      if (potentials.length > 10 && !isExpanded) {
        potentialTags = potentials.slice(0, 10).map(function (c) {
          return '<span class="sw-college sw-potential">' + esc(c) + '</span>';
        }).join(", ") + ' <span class="sw-show-more" data-eid="' + escAttr(eid) + '">+' + (potentials.length - 10) + ' more</span>';
      } else if (potentials.length > 0) {
        potentialTags = potentials.map(function (c) { return '<span class="sw-college sw-potential">' + esc(c) + '</span>'; }).join(", ");
      } else {
        potentialTags = '<span style="opacity:0.4;font-style:italic;">none identified</span>';
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
        '<td class="exhibit-cell-num" style="color:#C9A84C;font-weight:600;">' + (e.potential || 0) + '</td>' +
        '<td class="sw-college-list">' + adopterTags + '</td>' +
        '<td class="sw-college-list">' + potentialTags + '</td>' +
        '<td class="sw-flag-cell">' + flagCell + '</td></tr>');
    });

    tbody.innerHTML = rows.join("");

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
      if (start > 1) html.push('<span style="color:rgba(255,255,255,0.3);padding:0 4px;">…</span>');
    }
    for (var i = start; i < end; i++) {
      html.push('<button class="sw-page-btn' + (i === state.page ? ' active' : '') + '" data-page="' + i + '">' + (i + 1) + '</button>');
    }
    if (end < totalPages) {
      if (end < totalPages - 1) html.push('<span style="color:rgba(255,255,255,0.3);padding:0 4px;">…</span>');
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

    container.addEventListener("click", function (ev) {
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
      if (cb.type !== "checkbox") return;

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
  function exportJSON() {
    var data = getSelectedExhibits();
    if (!data.length) { alert("Select at least one exhibit to export."); return; }
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    downloadBlob(blob, "exhibit_adoption_export.json");
  }

  function exportExcel() {
    var data = getSelectedExhibits();
    if (!data.length) { alert("Select at least one exhibit to export."); return; }
    var headers = ["Exhibit Title", "Type", "CPL Type", "Discipline", "Adopters", "Potential",
      "Credit Recs", "Colleges Adopted", "Potential Adopters", "Credit Recommendation Details"];
    var rows = data.map(function (e) {
      var recDetails = (e.credit_recs || []).map(function (r) { return r.course + ": " + r.credit; }).join(" | ");
      return [csvCell(e.title), csvCell(e.collaborative_type || "Local"), csvCell(e.cpl_type || ""),
        csvCell(e.discipline || ""), e.adopters || 0, e.potential || 0, (e.credit_recs || []).length,
        csvCell((e.adopter_names || []).join("; ")), csvCell((e.potential_names || []).join("; ")),
        csvCell(recDetails)].join(",");
    });
    var csv = headers.join(",") + "\n" + rows.join("\n");
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
      spacing: { after: 400 }, alignment: docx.AlignmentType.CENTER
    }));

    data.forEach(function (e, idx) {
      children.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: (idx + 1) + ". " + e.title, bold: true, size: 24, font: "Calibri" })],
        spacing: { before: 300, after: 100 },
        border: { bottom: { style: docx.BorderStyle.SINGLE, size: 1, color: "CCCCCC" } }
      }));
      children.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: "Type: " + (e.collaborative_type || "Local") + "  |  CPL: " + (e.cpl_type || "N/A") + "  |  Discipline: " + (e.discipline || "N/A") + "  |  Adopters: " + (e.adopters || 0) + "  |  Potential: " + (e.potential || 0), size: 18, color: "555555", font: "Calibri" })],
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
      children.push(new docx.Paragraph({ children: [new docx.TextRun({ text: "Potential Adopters (" + (e.potential || 0) + "):", bold: true, size: 20, font: "Calibri" })], spacing: { before: 100 } }));
      children.push(new docx.Paragraph({ children: [new docx.TextRun({ text: (e.potential_names || []).join(", ") || "None identified", size: 18, font: "Calibri" })], spacing: { after: 200 } }));
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

  // ── Init ──
  // Build the card chrome first so the table is visible immediately; the
  // Supabase flag overlay loads in the background and triggers a re-render
  // when it lands. Anonymous viewers see the table fully without waiting.
  state.sess = getSession();
  buildCard();
  renderRows();
  bindEvents();
  fetchFlagOverlay().then(function (m) {
    state.flags = m || {};
    // Re-render so existing flags surface on first paint after the fetch.
    renderRows();
  });
})();
