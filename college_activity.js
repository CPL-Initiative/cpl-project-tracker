/* College Activity — Interactive Table
 *
 * Renders the 116-college tiered activity table with filters, sort, and exports.
 * Consumes data populated by excel_to_dashboard.py:
 *   window.COLLEGE_ACTIVITY_DATA      (array of per-college records)
 *   window.COLLEGE_DISCIPLINE_DETAIL  (per-college discipline breakdown)
 *
 * Template originally in CPL_Dashboard.html (commit 913afba). Externalized here
 * so the daily pipeline's render_college_activity_card() only needs to emit
 * the data blobs, preventing layout regressions.
 */
    (function() {
      const GOLD = '#C9A84C', GREEN = '#4CAF50', AMBER = '#FF9800', BLUE = '#5B9BD5', RED = '#EF5350';

      // Data embedded from Python
      const allData = window.COLLEGE_ACTIVITY_DATA || [];
      const collegeDisciplineDetail = window.COLLEGE_DISCIPLINE_DETAIL || {};
      let filteredData = [...allData];
      let sortKey = 'students';
      let sortAsc = false;

      // DOM references
      const tableBody = document.getElementById('collegeTableBody');
      const totalsRow = document.getElementById('collegeTotalsRow');
      const searchBox = document.getElementById('collegeSearchBox');
      const tierFilter = document.getElementById('tierFilter');
      const districtFilter = document.getElementById('caDistrictFilter');
      const disciplineFilter = document.getElementById('caDisciplineFilter');
      const exportExcelBtn = document.getElementById('exportExcelBtn');
      const exportCSVBtn = document.getElementById('exportCSVBtn');
      const exportJSONBtn = document.getElementById('exportJSONBtn');
      const customReportBtn = document.getElementById('caCustomReportBtn');
      const headers = document.querySelectorAll('#collegeActivityTable th[data-sort]');

      // ── Helpers ────────────────────────────────────────────────
      function fmtD(val) {
        if (!val) return '$0';
        if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B';
        if (val >= 1e6) return '$' + Math.round(val / 1e6) + 'M';
        if (val >= 1e3) return '$' + (val / 1e3).toFixed(1) + 'K';
        return '$' + Math.round(val);
      }
      function fmtN(n) { return (n || 0).toLocaleString(); }
      function fmtU(n) {
        if (!n) return '0';
        if (n >= 1000) return Math.round(n / 1000) + 'k';
        return n.toLocaleString();
      }
      function tierColor(t) { return t === 'Leading' ? GOLD : (t === 'Advancing' ? BLUE : 'rgba(255,255,255,0.3)'); }
      function bc(r) { return r >= 50 ? GREEN : (r >= 25 ? AMBER : 'rgba(255,255,255,0.25)'); }

      // ── Get effective exhibit values when discipline filter is active ──
      function getExhibitVals(row) {
        const disc = disciplineFilter.value;
        if (!disc) return { exhibits: row.exhibits, credit_recs: row.credit_recs, disciplines: row.disciplines };
        const cd = collegeDisciplineDetail[row.college];
        if (!cd || !cd[disc]) return { exhibits: 0, credit_recs: 0, disciplines: 0 };
        return { exhibits: cd[disc].exhibits, credit_recs: cd[disc].recs, disciplines: 1 };
      }

      // ── Render pinned totals row ───────────────────────────────
      function renderTotals() {
        const sums = { students:0, veterans:0, working_adults:0, apprentices:0,
                       eligible_units:0, transcribed_units:0, exhibits:0,
                       credit_recs:0, savings:0, year_impact:0 };
        const allDiscs = new Set();
        filteredData.forEach(r => {
          sums.students += r.students;
          sums.veterans += r.veterans;
          sums.working_adults += r.working_adults;
          sums.apprentices += r.apprentices;
          sums.eligible_units += r.eligible_units;
          sums.transcribed_units += r.transcribed_units;
          sums.savings += r.savings;
          sums.year_impact += r.year_impact;
          const ev = getExhibitVals(r);
          sums.exhibits += ev.exhibits;
          sums.credit_recs += ev.credit_recs;
          const cd = collegeDisciplineDetail[r.college];
          if (cd) Object.keys(cd).forEach(d => allDiscs.add(d));
        });
        const discCount = disciplineFilter.value
          ? filteredData.filter(r => { const cd = collegeDisciplineDetail[r.college]; return cd && cd[disciplineFilter.value]; }).length
          : allDiscs.size;

        const s = 'font-size:0.67rem;font-weight:700;padding:0.3rem 0.3rem;text-align:right;color:rgba(255,255,255,0.9);';
        totalsRow.innerHTML = `<tr style="background:rgba(201,168,76,0.08);">
          <td style="${s}text-align:center;" colspan="2">
            <span style="font-size:0.63rem;color:${GOLD};font-weight:700;">${filteredData.length}</span>
          </td>
          <td style="${s}text-align:left;color:${GOLD};">Totals</td>
          <td style="${s}text-align:left;font-size:0.6rem;color:rgba(255,255,255,0.5);">${filteredData.length} colleges</td>
          <td style="${s}">${fmtN(sums.students)}</td>
          <td style="${s}">${fmtN(sums.veterans)}</td>
          <td style="${s}">${fmtN(sums.working_adults)}</td>
          <td style="${s}">${fmtN(sums.apprentices)}</td>
          <td style="${s}">${fmtU(sums.eligible_units)}</td>
          <td style="${s}">${fmtU(sums.transcribed_units)}</td>
          <td style="${s}">${fmtN(sums.exhibits)}</td>
          <td style="${s}">${fmtN(sums.credit_recs)}</td>
          <td style="${s}">${discCount}</td>
          <td style="${s}">${fmtD(sums.savings)}</td>
          <td style="${s}">${fmtD(sums.year_impact)}</td>
          <td style="${s}text-align:center;" colspan="3"></td>
        </tr>`;
      }

      // ── Render data rows ───────────────────────────────────────
      function renderTable() {
        tableBody.innerHTML = '';
        filteredData.forEach(row => {
          const tr = document.createElement('tr');
          tr.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
          const tc = tierColor(row.tier);
          const nc = row.tier === 'Leading' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)';
          const brc = bc(row.trans_rate);
          const ev = getExhibitVals(row);

          const star = row.criteria_met >= 1 ? '&#11088;' : '';
          const dots = Array(5).fill(0).map((_,i) =>
            '<span style="color:' + (i < row.criteria_met ? GOLD : 'rgba(255,255,255,0.15)') + ';font-size:0.7rem;">' + (i < row.criteria_met ? '●' : '○') + '</span>'
          ).join('');

          let laHtml = '—';
          let laColor = 'rgba(255,255,255,0.2)';
          if (row.last_activity_days !== null) {
            const d = row.last_activity_days;
            laColor = d <= 30 ? GREEN : (d <= 90 ? AMBER : RED);
            const label = d < 365 ? d + 'd' : Math.floor(d/365) + 'y ' + Math.floor((d%365)/30) + 'm';
            laHtml = '<span style="color:' + laColor + ';">● ' + label + '</span>';
          }

          tr.innerHTML = `
            <td style="padding:0.2rem 0.3rem;text-align:center;font-size:0.6rem;">
              <span style="color:${tc};font-weight:700;border:1px solid ${tc};border-radius:2px;padding:0.02rem 0.2rem;font-size:0.55rem;text-transform:uppercase;letter-spacing:0.3px;">${row.tier}</span>
            </td>
            <td style="padding:0.2rem 0.2rem;text-align:center;font-size:0.7rem;">${star}</td>
            <td style="padding:0.2rem 0.3rem;font-size:0.68rem;color:${nc};white-space:nowrap;">${row.college}</td>
            <td style="padding:0.2rem 0.3rem;font-size:0.6rem;color:rgba(255,255,255,0.5);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${row.district}">${row.district}</td>
            <td style="padding:0.2rem 0.3rem;font-size:0.67rem;color:rgba(255,255,255,0.8);text-align:right;">${fmtN(row.students)}</td>
            <td style="padding:0.2rem 0.3rem;font-size:0.67rem;color:#7EC8E3;text-align:right;">${fmtN(row.veterans)}</td>
            <td style="padding:0.2rem 0.3rem;font-size:0.67rem;color:rgba(255,255,255,0.7);text-align:right;">${fmtN(row.working_adults)}</td>
            <td style="padding:0.2rem 0.3rem;font-size:0.67rem;color:rgba(255,255,255,0.7);text-align:right;">${fmtN(row.apprentices)}</td>
            <td style="padding:0.2rem 0.3rem;font-size:0.67rem;color:rgba(255,255,255,0.7);text-align:right;">${fmtU(row.eligible_units)}</td>
            <td style="padding:0.2rem 0.3rem;font-size:0.67rem;color:rgba(255,255,255,0.7);text-align:right;">${fmtU(row.transcribed_units)}</td>
            <td style="padding:0.2rem 0.3rem;font-size:0.67rem;color:rgba(255,255,255,0.7);text-align:right;">${fmtN(ev.exhibits)}</td>
            <td style="padding:0.2rem 0.3rem;font-size:0.67rem;color:rgba(255,255,255,0.7);text-align:right;">${fmtN(ev.credit_recs)}</td>
            <td style="padding:0.2rem 0.3rem;font-size:0.67rem;color:rgba(255,255,255,0.7);text-align:right;">${ev.disciplines}</td>
            <td style="padding:0.2rem 0.3rem;font-size:0.67rem;color:rgba(255,255,255,0.7);text-align:right;">${fmtD(row.savings)}</td>
            <td style="padding:0.2rem 0.3rem;font-size:0.67rem;color:rgba(255,255,255,0.7);text-align:right;">${fmtD(row.year_impact)}</td>
            <td style="padding:0.2rem 0.3rem;text-align:center;">
              <div style="display:flex;align-items:center;gap:3px;justify-content:center;">
                <div style="width:40px;height:5px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">
                  <div style="width:${Math.min(row.trans_rate/100,1)*40}px;height:100%;background:${brc};border-radius:3px;"></div>
                </div>
                <span style="font-size:0.6rem;color:rgba(255,255,255,0.6);">${row.trans_rate.toFixed(0)}%</span>
              </div>
            </td>
            <td style="padding:0.2rem 0.3rem;text-align:center;">${dots}</td>
            <td style="padding:0.2rem 0.3rem;text-align:center;font-size:0.62rem;">${laHtml}</td>
          `;
          tableBody.appendChild(tr);
        });
        renderTotals();
      }

      // ── Filter + Sort ──────────────────────────────────────────
      function applyFilters() {
        const search = searchBox.value.toLowerCase();
        const tier = tierFilter.value;
        const district = districtFilter.value;
        const disc = disciplineFilter.value;

        filteredData = allData.filter(row => {
          if (search && !row.college.toLowerCase().includes(search)) return false;
          if (tier && row.tier !== tier) return false;
          if (district && row.district !== district) return false;
          if (disc) {
            const cd = collegeDisciplineDetail[row.college];
            if (!cd || !cd[disc]) return false;
          }
          return true;
        });

        if (sortKey) {
          filteredData.sort((a, b) => {
            let va = a[sortKey], vb = b[sortKey];
            if (disc && (sortKey === 'exhibits' || sortKey === 'credit_recs' || sortKey === 'disciplines')) {
              const aev = getExhibitVals(a), bev = getExhibitVals(b);
              va = sortKey === 'disciplines' ? aev.disciplines : aev[sortKey];
              vb = sortKey === 'disciplines' ? bev.disciplines : bev[sortKey];
            }
            if (typeof va === 'string') va = va.toLowerCase();
            if (typeof vb === 'string') vb = vb.toLowerCase();
            if (va == null) va = sortAsc ? Infinity : -Infinity;
            if (vb == null) vb = sortAsc ? Infinity : -Infinity;
            if (va < vb) return sortAsc ? -1 : 1;
            if (va > vb) return sortAsc ? 1 : -1;
            return 0;
          });
        }
        renderTable();
      }

      // ── Export ──────────────────────────────────────────────────
      function buildExportFilename(ext) {
        const parts = ['College_Activity'];
        const dist = districtFilter.value;
        const tier = tierFilter.value;
        const disc = disciplineFilter.value;
        const search = searchBox.value.trim();
        if (dist) parts.push(dist.replace(/[^a-zA-Z0-9]+/g, '_'));
        if (tier) parts.push(tier);
        if (disc) parts.push(disc.replace(/[^a-zA-Z0-9]+/g, '_'));
        if (search) parts.push(search.replace(/[^a-zA-Z0-9]+/g, '_'));
        if (parts.length === 1) parts.push('All_Colleges');
        return parts.join('_') + '.' + ext;
      }

      function showToast(msg) {
        let toast = document.getElementById('ca-export-toast');
        if (!toast) {
          toast = document.createElement('div');
          toast.id = 'ca-export-toast';
          Object.assign(toast.style, {
            position:'fixed', bottom:'2rem', right:'2rem', padding:'0.75rem 1.25rem',
            background:'rgba(46,204,113,0.95)', color:'#fff', borderRadius:'8px',
            fontSize:'0.85rem', fontWeight:'600', zIndex:'99999',
            boxShadow:'0 4px 20px rgba(0,0,0,0.3)', opacity:'0',
            transition:'opacity 0.3s ease', pointerEvents:'none'
          });
          document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.opacity = '1';
        setTimeout(() => { toast.style.opacity = '0'; }, 3500);
      }

      function exportData(format) {
        const disc = disciplineFilter.value;
        const rows = filteredData.map(r => {
          const ev = getExhibitVals(r);
          return {
            Tier: r.tier, College: r.college, District: r.district,
            Students: r.students, Veterans: r.veterans, 'Working Adults': r.working_adults,
            Apprentices: r.apprentices, 'Eligible Units': Math.round(r.eligible_units),
            'Transcribed Units': Math.round(r.transcribed_units),
            Exhibits: ev.exhibits, 'Credit Recs': ev.credit_recs, Disciplines: ev.disciplines,
            Savings: r.savings, '20-Year Impact': r.year_impact,
            'Trans Rate %': r.trans_rate, 'Criteria Met': r.criteria_met,
            'Last Activity Days': r.last_activity_days
          };
        });
        if (!rows.length) { showToast('No data to export'); return; }

        const hdr = Object.keys(rows[0]);
        function toCSV() {
          return [hdr.join(','), ...rows.map(r =>
            hdr.map(h => { const v = r[h]; return typeof v === 'string' && v.includes(',') ? '"'+v+'"' : (v==null?'':v); }).join(',')
          )].join('\n');
        }
        function dl(blob, name) {
          const u = URL.createObjectURL(blob), a = document.createElement('a');
          a.href = u; a.download = name; a.click(); URL.revokeObjectURL(u);
        }

        let fname;
        if (format === 'json') {
          fname = buildExportFilename('json');
          dl(new Blob([JSON.stringify(rows,null,2)],{type:'application/json'}), fname);
        } else if (format === 'csv') {
          fname = buildExportFilename('csv');
          dl(new Blob([toCSV()],{type:'text/csv'}), fname);
        } else if (format === 'excel' && typeof XLSX !== 'undefined') {
          fname = buildExportFilename('xlsx');
          const ws = XLSX.utils.json_to_sheet(rows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'College Activity');
          XLSX.writeFile(wb, fname);
        } else {
          fname = buildExportFilename('csv');
          dl(new Blob([toCSV()],{type:'text/csv'}), fname);
        }
        showToast('✅ Export complete — ' + rows.length + ' colleges → ' + fname);
      }

      // ── Custom Report integration ──────────────────────────────
      // The College Activity panel uses a college-specific report generator
      // (college_report_generator.js). Falls back to the project-level
      // generator if the college one hasn't loaded.
      if (customReportBtn) {
        customReportBtn.addEventListener('click', () => {
          window._caFilteredData = filteredData;
          window._caAllData = allData;
          if (typeof window.openCollegeReportModal === 'function') {
            window.openCollegeReportModal();
          } else if (typeof window.openReportModal === 'function') {
            window.openReportModal();
          } else {
            alert('Custom Report generator not available. Ensure college_report_generator.js is loaded.');
          }
        });
      }

      // ── Event listeners ────────────────────────────────────────
      searchBox.addEventListener('input', applyFilters);
      tierFilter.addEventListener('change', applyFilters);
      districtFilter.addEventListener('change', applyFilters);
      disciplineFilter.addEventListener('change', applyFilters);
      exportExcelBtn.addEventListener('click', () => exportData('excel'));
      exportCSVBtn.addEventListener('click', () => exportData('csv'));
      exportJSONBtn.addEventListener('click', () => exportData('json'));

      headers.forEach(header => {
        header.addEventListener('click', () => {
          const newKey = header.getAttribute('data-sort');
          if (sortKey === newKey) sortAsc = !sortAsc;
          else { sortKey = newKey; sortAsc = (newKey === 'college' || newKey === 'district' || newKey === 'tier'); }
          headers.forEach(h => h.querySelector('.sort-indicator').textContent = '');
          header.querySelector('.sort-indicator').textContent = sortAsc ? ' ▲' : ' ▼';
          applyFilters();
        });
      });

      // Initial render (sorted by students desc)
      applyFilters();
    })();
