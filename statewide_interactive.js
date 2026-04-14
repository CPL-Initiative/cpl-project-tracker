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

  var PAGE_SIZE = 50;

  // ── Derive filter option sets ──
  var cplTypes = unique(exhibits.map(function (e) { return e.cpl_type || "Unknown"; }));
  var disciplines = unique(exhibits.map(function (e) { return e.discipline || "Unknown"; }));
  var collabTypes = unique(exhibits.map(function (e) { return e.collaborative_type || "Local"; }));

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
    filters: { collabType: [], cplType: [], discipline: [], college: [], district: [], swRegion: [] },
    selected: {},
    expanded: {},
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
    if (f.discipline.length && f.discipline.indexOf(e.discipline || "Unknown") === -1) return false;
    if (f.college.length || f.district.length || f.swRegion.length) {
      var names = (e.adopter_names || []).concat(e.potential_names || []);
      if (!names.some(collegeMatchesFilters)) return false;
    }
    if (state.search) {
      var q = state.search.toLowerCase();
      var hay = (e.title || "") + " " + (e.cpl_type || "") + " " + (e.discipline || "") + " " +
        (e.collaborative_type || "") + " " + (e.adopter_names || []).join(" ") + " " +
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
    html += buildFilterButton("discipline", "TOP Code Category", disciplines);
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
      '</tr></thead><tbody id="sw-tbody"></tbody></table>';

    // Pagination
    html += '<div class="sw-pagination" id="sw-pagination"></div>';
    html += '</div></div>';

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

      // Build credit recs inline under the title
      var recs = e.credit_recs || [];
      var recsHtml = "";
      if (recs.length > 0) {
        recsHtml = '<div class="sw-credit-recs">' + recs.map(function (r) {
          // Extract units from CRUnits-style ("3.00") or from credit text
          var units = r.course.match(/(\d+\.?\d*)\s*(unit|hr|hour)/i);
          var unitStr = "";
          // Try to parse "3 hours in Course Title" pattern from credit field
          var creditMatch = r.credit.match(/^(\d+\.?\d*)\s*(hours?|units?)\s+(?:in\s+)?(.+)/i);
          if (creditMatch) {
            unitStr = creditMatch[1] + " " + creditMatch[2].charAt(0).toUpperCase() + creditMatch[2].slice(1).toLowerCase();
            if (unitStr.match(/hour/i)) unitStr = unitStr.replace(/hours?/i, "Hours");
            return '<div class="sw-rec-line">' + esc(unitStr) + ' — ' + esc(creditMatch[3]) + ' <span class="sw-rec-course">(' + esc(r.course) + ')</span></div>';
          }
          return '<div class="sw-rec-line">' + esc(r.course) + ': ' + esc(r.credit) + '</div>';
        }).join("") + '</div>';
      }

      rows.push('<tr class="' + (state.selected[eid] ? 'sw-row-selected' : '') + '" data-eid="' + escAttr(eid) + '">' +
        '<td><input type="checkbox" class="sw-chk sw-row-chk"' + checked + ' /></td>' +
        '<td style="max-width:350px;"><div class="exhibit-cell-name">' + esc(e.title) + '</div>' + recsHtml + '</td>' +
        '<td>' + typeBadge + '</td>' +
        '<td>' + esc(e.cpl_type || "") + '</td>' +
        '<td>' + esc(e.discipline || "") + '</td>' +
        '<td class="exhibit-cell-num">' + (e.adopters || 0) + '</td>' +
        '<td class="exhibit-cell-num" style="color:#C9A84C;font-weight:600;">' + (e.potential || 0) + '</td>' +
        '<td class="sw-college-list">' + adopterTags + '</td>' +
        '<td class="sw-college-list">' + potentialTags + '</td></tr>');
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
        var labels = { collabType: "Statewide / Local", cplType: "CPL Type", discipline: "TOP Code Category", college: "College", district: "District", swRegion: "SW Region" };
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
  buildCard();
  renderRows();
  bindEvents();
})();
