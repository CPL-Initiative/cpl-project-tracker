/**
 * Statewide Exhibit Adoption — Interactive Card
 * Reads window.CPL_STATEWIDE and window.CCC_COLLEGE_LOOKUP
 * Renders search, multi-select filters, checkboxes, Word/Excel/JSON export
 */
(function () {
  "use strict";

  var DATA = window.CPL_STATEWIDE;
  var LOOKUP = window.CCC_COLLEGE_LOOKUP || {};
  if (!DATA || !DATA.exhibits) return;

  var exhibits = DATA.exhibits;
  var container = document.getElementById("statewide-interactive-container");
  if (!container) return;

  // ── Derive filter option sets ──
  var cplTypes = unique(exhibits.map(function (e) { return e.cpl_type || "Unknown"; }));
  var disciplines = unique(exhibits.map(function (e) { return e.discipline || "Unknown"; }));

  // Collect all college names across adopters + potential
  var allColleges = {};
  exhibits.forEach(function (e) {
    (e.adopter_names || []).concat(e.potential_names || []).forEach(function (c) { allColleges[c] = 1; });
  });
  var collegeNames = Object.keys(allColleges).sort();

  // Derive district and SW region lists from lookup
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
    filters: { cplType: [], discipline: [], college: [], district: [], swRegion: [] },
    selected: {},
    selectAll: false
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
    if (f.district.length) {
      if (!info || f.district.indexOf(info.district) === -1) return false;
    }
    if (f.swRegion.length) {
      if (!info || f.swRegion.indexOf(info.swRegion) === -1) return false;
    }
    return true;
  }

  function exhibitMatchesFilters(e) {
    var f = state.filters;
    // CPL Type
    if (f.cplType.length && f.cplType.indexOf(e.cpl_type || "Unknown") === -1) return false;
    // Discipline (TOP Code Category)
    if (f.discipline.length && f.discipline.indexOf(e.discipline || "Unknown") === -1) return false;
    // College / District / SW Region: at least one adopter or potential must match
    if (f.college.length || f.district.length || f.swRegion.length) {
      var names = (e.adopter_names || []).concat(e.potential_names || []);
      var hasMatch = names.some(collegeMatchesFilters);
      if (!hasMatch) return false;
    }
    // Search
    if (state.search) {
      var q = state.search.toLowerCase();
      var hay = (e.title || "").toLowerCase() + " " +
        (e.adopter_names || []).join(" ").toLowerCase() + " " +
        (e.potential_names || []).join(" ").toLowerCase() + " " +
        (e.cpl_type || "").toLowerCase() + " " +
        (e.discipline || "").toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  function getFiltered() {
    return exhibits.filter(exhibitMatchesFilters);
  }

  // ── Build DOM ──
  function buildCard() {
    var totalPotential = 0, withPotential = 0;
    exhibits.forEach(function (e) {
      totalPotential += (e.potential || 0);
      if (e.potential > 0) withPotential++;
    });

    var html = '<div class="sw-interactive">';

    // Header
    html += '<div class="exhibit-card-header">' +
      '<div class="exhibit-card-title">Statewide (CCC Collaborative) Exhibit Adoption</div>' +
      '<div class="exhibit-card-subtitle">' + exhibits.length + ' statewide exhibits | ' +
      withPotential + ' with growth potential | ' + fmt(totalPotential) + ' potential new college adoptions</div>' +
      '</div>';

    // Toolbar: search + filters
    html += '<div class="sw-toolbar">';
    html += '<input type="text" id="sw-search" placeholder="Search exhibits, colleges, types..." />';
    html += buildFilterButton("cplType", "CPL Type", cplTypes);
    html += buildFilterButton("discipline", "TOP Code Category", disciplines);
    html += buildFilterButton("college", "College", collegeNames);
    html += buildFilterButton("district", "District", districts);
    html += buildFilterButton("swRegion", "SW Region", swRegions);
    html += '</div>';

    // Action bar: select all, generate report, export
    html += '<div class="sw-action-bar">';
    html += '<label style="font-size:0.72rem;color:rgba(255,255,255,0.7);cursor:pointer;display:flex;align-items:center;gap:0.3rem;">' +
      '<input type="checkbox" class="sw-chk" id="sw-select-all" /> Select All</label>';
    html += '<button class="sw-action-btn primary" id="sw-gen-report">Generate Word Report</button>';
    html += '<button class="sw-action-btn" id="sw-export-excel">Export Excel</button>';
    html += '<button class="sw-action-btn" id="sw-export-json">Export JSON</button>';
    html += '<span class="sw-count" id="sw-status"></span>';
    html += '</div>';

    // Table
    html += '<div class="sw-table-wrap" id="sw-table-wrap">';
    html += '<table class="exhibit-table" id="sw-table"><thead><tr>' +
      '<th style="width:30px;"></th>' +
      '<th>Statewide Exhibit</th><th>CPL Type</th><th>Discipline</th>' +
      '<th>Adopted</th><th>Potential</th>' +
      '<th>Colleges Adopted</th><th>Colleges — Potential Adopters</th>' +
      '</tr></thead><tbody id="sw-tbody"></tbody></table>';
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

  // ── Render table rows ──
  function renderRows() {
    var filtered = getFiltered();
    var tbody = document.getElementById("sw-tbody");
    if (!tbody) return;

    var selectedCount = 0;
    var rows = filtered.map(function (e) {
      var eid = e.exhibit_id || e.title;
      var checked = state.selected[eid] ? ' checked' : '';
      if (state.selected[eid]) selectedCount++;

      var adopters = (e.adopter_names || []).filter(collegeMatchesFilters);
      var potentials = (e.potential_names || []).filter(collegeMatchesFilters);
      // If no college/district/region filters, show all
      if (!state.filters.college.length && !state.filters.district.length && !state.filters.swRegion.length) {
        adopters = e.adopter_names || [];
        potentials = e.potential_names || [];
      }

      var adopterTags = adopters.map(function (c) {
        return '<span class="sw-college sw-adopted">' + esc(c) + '</span>';
      }).join(", ");
      var potentialTags = potentials.length > 0
        ? potentials.map(function (c) { return '<span class="sw-college sw-potential">' + esc(c) + '</span>'; }).join(", ")
        : '<span style="opacity:0.4;font-style:italic;">none identified</span>';

      return '<tr class="' + (state.selected[eid] ? 'sw-row-selected' : '') + '" data-eid="' + escAttr(eid) + '">' +
        '<td><input type="checkbox" class="sw-chk sw-row-chk"' + checked + ' /></td>' +
        '<td class="exhibit-cell-name" style="max-width:220px;">' + esc(e.title) + '</td>' +
        '<td>' + esc(e.cpl_type || "") + '</td>' +
        '<td>' + esc(e.discipline || "") + '</td>' +
        '<td class="exhibit-cell-num">' + (e.adopters || 0) + '</td>' +
        '<td class="exhibit-cell-num" style="color:#C9A84C;font-weight:600;">' + (e.potential || 0) + '</td>' +
        '<td class="sw-college-list">' + adopterTags + '</td>' +
        '<td class="sw-college-list">' + potentialTags + '</td>' +
        '</tr>';
    });

    tbody.innerHTML = rows.join("");
    var statusEl = document.getElementById("sw-status");
    if (statusEl) {
      statusEl.textContent = "Showing " + filtered.length + " of " + exhibits.length +
        " exhibits" + (selectedCount > 0 ? " | " + selectedCount + " selected" : "");
    }
  }

  // ── Bind events ──
  function bindEvents() {
    // Search
    var searchEl = document.getElementById("sw-search");
    if (searchEl) {
      searchEl.addEventListener("input", function () {
        state.search = this.value;
        renderRows();
      });
    }

    // Filter dropdown toggle
    container.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".sw-filter-btn");
      if (btn) {
        var group = btn.closest(".sw-filter-group");
        var dd = group.querySelector(".sw-filter-dropdown");
        // Close all others
        container.querySelectorAll(".sw-filter-dropdown.open").forEach(function (d) {
          if (d !== dd) d.classList.remove("open");
        });
        dd.classList.toggle("open");
        if (dd.classList.contains("open")) {
          var si = dd.querySelector(".sw-filter-search");
          if (si) setTimeout(function () { si.focus(); }, 50);
        }
        ev.stopPropagation();
        return;
      }
    });

    // Close dropdowns on outside click
    document.addEventListener("click", function (ev) {
      if (!ev.target.closest(".sw-filter-group")) {
        container.querySelectorAll(".sw-filter-dropdown.open").forEach(function (d) {
          d.classList.remove("open");
        });
      }
    });

    // Filter checkbox changes
    container.addEventListener("change", function (ev) {
      var cb = ev.target;
      if (cb.type !== "checkbox") return;

      // Row checkbox
      if (cb.classList.contains("sw-row-chk")) {
        var tr = cb.closest("tr");
        var eid = tr.getAttribute("data-eid");
        if (cb.checked) {
          state.selected[eid] = true;
          tr.classList.add("sw-row-selected");
        } else {
          delete state.selected[eid];
          tr.classList.remove("sw-row-selected");
        }
        updateStatus();
        return;
      }

      // Select all
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

      // Filter checkbox
      var group = cb.closest(".sw-filter-group");
      if (group) {
        var filterKey = group.getAttribute("data-filter");
        updateFilterState(filterKey, group);
        renderRows();
        // Update button text
        var btnEl = group.querySelector(".sw-filter-btn");
        var labels = { cplType: "CPL Type", discipline: "TOP Code Category", college: "College", district: "District", swRegion: "SW Region" };
        var count = state.filters[filterKey].length;
        btnEl.textContent = labels[filterKey] + (count > 0 ? " (" + count + ")" : "") + " ▾";
        btnEl.classList.toggle("active", count > 0);
      }
    });

    // Filter search within dropdowns
    container.addEventListener("input", function (ev) {
      if (ev.target.classList.contains("sw-filter-search")) {
        var q = ev.target.value.toLowerCase();
        var labels = ev.target.closest(".sw-filter-dropdown").querySelectorAll("label");
        labels.forEach(function (lbl) {
          lbl.style.display = lbl.textContent.toLowerCase().indexOf(q) !== -1 ? "" : "none";
        });
      }
    });

    // Action buttons
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
    var statusEl = document.getElementById("sw-status");
    if (statusEl) {
      statusEl.textContent = "Showing " + filtered.length + " of " + exhibits.length +
        " exhibits" + (count > 0 ? " | " + count + " selected" : "");
    }
  }

  // ── Export: JSON ──
  function exportJSON() {
    var data = getSelectedExhibits();
    if (!data.length) { alert("Select at least one exhibit to export."); return; }
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    downloadBlob(blob, "statewide_exhibits_export.json");
  }

  // ── Export: Excel (CSV for broad compatibility) ──
  function exportExcel() {
    var data = getSelectedExhibits();
    if (!data.length) { alert("Select at least one exhibit to export."); return; }
    var headers = ["Exhibit Title", "CPL Type", "Discipline", "Adopters", "Potential", "Colleges Adopted", "Potential Adopters"];
    var rows = data.map(function (e) {
      return [
        csvCell(e.title),
        csvCell(e.cpl_type || ""),
        csvCell(e.discipline || ""),
        e.adopters || 0,
        e.potential || 0,
        csvCell((e.adopter_names || []).join("; ")),
        csvCell((e.potential_names || []).join("; "))
      ].join(",");
    });
    var csv = headers.join(",") + "\n" + rows.join("\n");
    var blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, "statewide_exhibits_export.csv");
  }

  function csvCell(s) {
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  // ── Export: Word Report (using docx.min.js) ──
  function generateWordReport() {
    var data = getSelectedExhibits();
    if (!data.length) { alert("Select at least one exhibit to generate a report."); return; }

    if (typeof docx === "undefined") {
      alert("Word document library (docx.min.js) not loaded. Cannot generate report.");
      return;
    }

    var children = [];

    // Title
    children.push(new docx.Paragraph({
      children: [new docx.TextRun({ text: "Statewide Exhibit Adoption Report", bold: true, size: 32, font: "Calibri" })],
      spacing: { after: 200 },
      alignment: docx.AlignmentType.CENTER
    }));
    children.push(new docx.Paragraph({
      children: [new docx.TextRun({ text: "Generated: " + new Date().toLocaleDateString() + " | " + data.length + " exhibits selected", size: 20, color: "666666", font: "Calibri" })],
      spacing: { after: 400 },
      alignment: docx.AlignmentType.CENTER
    }));

    data.forEach(function (e, idx) {
      // Exhibit title
      children.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: (idx + 1) + ". " + e.title, bold: true, size: 24, font: "Calibri" })],
        spacing: { before: 300, after: 100 },
        border: { bottom: { style: docx.BorderStyle.SINGLE, size: 1, color: "CCCCCC" } }
      }));

      // Metadata
      var meta = "CPL Type: " + (e.cpl_type || "N/A") + "  |  Discipline: " + (e.discipline || "N/A") +
        "  |  Adopters: " + (e.adopters || 0) + "  |  Potential: " + (e.potential || 0);
      children.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: meta, size: 18, color: "555555", font: "Calibri" })],
        spacing: { after: 100 }
      }));

      // Adopted colleges
      children.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: "Colleges Adopted:", bold: true, size: 20, font: "Calibri" })],
        spacing: { before: 100 }
      }));
      children.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: (e.adopter_names || []).join(", ") || "None", size: 18, font: "Calibri" })],
        spacing: { after: 100 }
      }));

      // Potential adopters
      children.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: "Potential Adopters:", bold: true, size: 20, font: "Calibri" })],
        spacing: { before: 100 }
      }));
      children.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: (e.potential_names || []).join(", ") || "None identified", size: 18, font: "Calibri" })],
        spacing: { after: 200 }
      }));
    });

    var doc = new docx.Document({
      sections: [{ properties: {}, children: children }]
    });

    docx.Packer.toBlob(doc).then(function (blob) {
      downloadBlob(blob, "Statewide_Exhibit_Report.docx");
    });
  }

  function getSelectedExhibits() {
    var keys = Object.keys(state.selected);
    if (!keys.length) {
      // If none selected, use all filtered
      return getFiltered();
    }
    return exhibits.filter(function (e) {
      return state.selected[e.exhibit_id || e.title];
    });
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  // ── Init ──
  buildCard();
  renderRows();
  bindEvents();
})();
