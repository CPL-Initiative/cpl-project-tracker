/*
 * CPL Dashboard — Filter & Search
 * Standalone external JS file (not affected by HTML truncation or sync issues)
 * Filters Activity KPI cards (with Goal sub-headers) and Project cards (grouped by Goal)
 */

// ── Shared Excel URL ──
// When hosted (GitHub Pages, etc.), Update buttons link to this shared URL.
// Replace with your OneDrive/SharePoint share link.
// When empty, buttons link to the local Excel file.
var SHARED_EXCEL_URL = 'https://studentrcc.sharepoint.com/:x:/s/MilitaryArticulationPlatform/IQDtrAHqCEmCTZXE7sqqeLMZAQkt2PJzGno44GfJVp5b6Ak?e=8W61fK';

// ── Attachments Folder URL ──
// SharePoint folder for project attachments (workplan docs, reports, etc.)
var ATTACHMENTS_URL = 'https://studentrcc.sharepoint.com/:f:/s/MilitaryArticulationPlatform/IgDh8urbvLg-QZbE9GUsQdLlAe-90oKBhwbWe26Zn2DAWVM?e=vWAsg5';

function applyFilters() {
    var actVal = document.getElementById('filterActivity').value;
    var visVal = document.getElementById('filterVision').value;
    var goalVal = document.getElementById('filterGoal').value;
    var statusVal = document.getElementById('filterStatus').value;
    var leadVal = document.getElementById('filterLead').value;
    var searchBox = document.getElementById('searchBox');
    var searchVal = searchBox ? searchBox.value.toLowerCase() : '';

    // ── Filter Activity KPI groups ──
    // Extract the activity number from the filter value (e.g. "Activity 1: ..." → "Activity 1")
    var actNum = '';
    if (actVal) {
        var match = actVal.match(/Activity\s*\d+/i);
        if (match) actNum = match[0];
    }

    // Extract goal number from filter (e.g. "Goal 1: ..." → "Goal 1")
    var goalNum = '';
    if (goalVal) {
        var gMatch = goalVal.match(/Goal\s*\d+/i);
        if (gMatch) goalNum = gMatch[0];
    }

    var actGroups = document.querySelectorAll('.activity-group');
    for (var g = 0; g < actGroups.length; g++) {
        var group = actGroups[g];
        var header = group.querySelector('.activity-group-header h3');
        var headerText = header ? header.textContent.trim() : '';
        // Extract "Activity N" from "Activity N: ..."
        var badgeMatch = headerText.match(/^(Activity\s+\d+)/);
        var badgeText = badgeMatch ? badgeMatch[1] : '';

        // Show/hide the entire activity group based on the Activity filter
        if (actNum && badgeText !== actNum) {
            group.style.display = 'none';
        } else {
            group.style.display = '';

            // Filter Goal sub-headers within this activity group
            var goalHeaders = group.querySelectorAll('.goal-subheader');
            for (var gh = 0; gh < goalHeaders.length; gh++) {
                var ghEl = goalHeaders[gh];
                var ghText = ghEl.textContent.trim();
                // Check if this goal header matches the goal filter
                var ghGoalMatch = ghText.match(/Goal\s*\d+/i);
                var ghGoalKey = ghGoalMatch ? ghGoalMatch[0] : '';
                if (goalNum && ghGoalKey !== goalNum) {
                    ghEl.style.display = 'none';
                } else {
                    ghEl.style.display = '';
                }
            }

            // Within a visible group, filter individual KPI cards
            var kpiCards = group.querySelectorAll('.activity-kpi-card');
            for (var k = 0; k < kpiCards.length; k++) {
                var kc = kpiCards[k];
                var kcStatus = kc.querySelector('.akpi-status');
                var kcStatusText = kcStatus ? kcStatus.textContent.trim() : '';
                var kcText = kc.textContent.toLowerCase();

                var showKc = true;
                if (statusVal && kcStatusText !== statusVal) showKc = false;
                if (searchVal && kcText.indexOf(searchVal) === -1) showKc = false;

                // Goal filter: check if card's parent grid is after a matching goal header
                if (goalNum) {
                    var parentGrid = kc.closest('.activity-kpi-grid');
                    if (parentGrid) {
                        var prevSibling = parentGrid.previousElementSibling;
                        if (prevSibling && prevSibling.classList.contains('goal-subheader')) {
                            var prevText = prevSibling.textContent.trim();
                            var prevGoalMatch = prevText.match(/Goal\s*\d+/i);
                            var prevGoalKey = prevGoalMatch ? prevGoalMatch[0] : '';
                            if (prevGoalKey !== goalNum) showKc = false;
                        }
                    }
                }

                kc.style.display = showKc ? '' : 'none';
            }

            // Hide empty activity-kpi-grids (all cards hidden)
            var grids = group.querySelectorAll('.activity-kpi-grid');
            for (var gi = 0; gi < grids.length; gi++) {
                var grid = grids[gi];
                var visibleCards = grid.querySelectorAll('.activity-kpi-card:not([style*="display: none"])');
                // Also hide the preceding goal-subheader if all cards in this grid are hidden
                if (visibleCards.length === 0) {
                    grid.style.display = 'none';
                    var prevH = grid.previousElementSibling;
                    if (prevH && prevH.classList.contains('goal-subheader')) {
                        prevH.style.display = 'none';
                    }
                } else {
                    grid.style.display = '';
                }
            }
        }
    }

    // ── Filter Project cards (grouped under Goal headers) ──
    var cards = document.querySelectorAll('.project-card');
    var visible = 0;
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var activity = card.getAttribute('data-activity') || '';
        var v2030 = card.getAttribute('data-v2030') || '';
        var goal = card.getAttribute('data-goal') || '';
        var status = card.getAttribute('data-status') || '';
        var lead = card.getAttribute('data-lead') || '';
        var text = card.textContent.toLowerCase();

        var show = true;
        if (actVal && activity.indexOf(actVal) === -1) show = false;
        if (visVal && v2030.indexOf(visVal) === -1) show = false;
        if (goalVal && goal.indexOf(goalVal) === -1) show = false;
        if (statusVal && status !== statusVal) show = false;
        if (leadVal && lead.indexOf(leadVal) === -1) show = false;
        if (searchVal && text.indexOf(searchVal) === -1) show = false;

        card.style.display = show ? '' : 'none';
        if (show) visible++;
    }

    // Hide Goal headers that have no visible project cards
    var goalHeaders = document.querySelectorAll('#projectsGrid > .goal-header');
    for (var h = 0; h < goalHeaders.length; h++) {
        var header = goalHeaders[h];
        var nextGrid = header.nextElementSibling;
        if (nextGrid && nextGrid.classList.contains('goal-project-group')) {
            var visCards = nextGrid.querySelectorAll('.project-card:not([style*="display: none"])');
            if (visCards.length === 0) {
                header.style.display = 'none';
                nextGrid.style.display = 'none';
            } else {
                header.style.display = '';
                nextGrid.style.display = '';
            }
        }
    }

    var countEl = document.getElementById('projectCount');
    if (countEl) countEl.textContent = '(' + visible + ')';
}

function resetFilters() {
    var ids = ['filterActivity', 'filterVision', 'filterGoal', 'filterStatus', 'filterLead'];
    for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]);
        if (el) el.value = '';
    }
    var sb = document.getElementById('searchBox');
    if (sb) sb.value = '';
    applyFilters();
}

// Attach event listeners immediately
// (filter elements already exist above this script tag in the HTML)
(function() {
    var selects = ['filterActivity', 'filterVision', 'filterGoal', 'filterStatus', 'filterLead'];
    for (var i = 0; i < selects.length; i++) {
        var el = document.getElementById(selects[i]);
        if (el) el.addEventListener('change', applyFilters);
    }
    var sb = document.getElementById('searchBox');
    if (sb) sb.addEventListener('input', applyFilters);

    // Attach to the Apply/Reset buttons via addEventListener
    var applyBtn = document.getElementById('applyBtn');
    if (applyBtn) applyBtn.addEventListener('click', applyFilters);
    var resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);

    // Inject Master Report + Update buttons next to filter buttons
    var filterBtns = document.querySelector('.filter-buttons');
    if (filterBtns) {
        var reportBtn = document.createElement('a');
        reportBtn.href = 'reports/CPL_Master_Report.docx';
        reportBtn.download = '';
        reportBtn.innerHTML = '&#128196; Master Report';
        reportBtn.style.cssText = "display:inline-flex;align-items:center;gap:0.3rem;background:transparent;color:#0A2240;border:1px solid #ccc;padding:7px 16px;font-weight:600;cursor:pointer;border-radius:4px;font-size:0.85rem;font-family:'Source Sans 3',Arial,sans-serif;line-height:1.2;text-decoration:none;margin-left:0.5rem;transition:background 0.2s;";
        reportBtn.onmouseover = function() { this.style.background = '#f5f5f5'; };
        reportBtn.onmouseout = function() { this.style.background = 'transparent'; };
        filterBtns.appendChild(reportBtn);

        var updateBtn = document.createElement('a');
        updateBtn.href = SHARED_EXCEL_URL || 'CPL_Initiative_Project_List_v3.xlsx';
        if (SHARED_EXCEL_URL) updateBtn.target = '_blank';
        updateBtn.innerHTML = '&#9998; Update Projects';
        updateBtn.style.cssText = "display:inline-flex;align-items:center;gap:0.3rem;background:transparent;color:#0A2240;border:1px solid #ccc;padding:7px 16px;font-weight:600;cursor:pointer;border-radius:4px;font-size:0.85rem;font-family:'Source Sans 3',Arial,sans-serif;line-height:1.2;text-decoration:none;margin-left:0.5rem;transition:background 0.2s;";
        updateBtn.onmouseover = function() { this.style.background = '#f5f5f5'; };
        updateBtn.onmouseout = function() { this.style.background = 'transparent'; };
        updateBtn.title = 'Open Excel to update project data';
        filterBtns.appendChild(updateBtn);

        // Attach Doc button — opens SharePoint attachments folder
        if (ATTACHMENTS_URL) {
            var attachBtn = document.createElement('a');
            attachBtn.href = ATTACHMENTS_URL;
            attachBtn.target = '_blank';
            attachBtn.innerHTML = '&#128206; Attach Doc';
            attachBtn.style.cssText = "display:inline-flex;align-items:center;gap:0.3rem;background:transparent;color:#0A2240;border:1px solid #ccc;padding:7px 16px;font-weight:600;cursor:pointer;border-radius:4px;font-size:0.85rem;font-family:'Source Sans 3',Arial,sans-serif;line-height:1.2;text-decoration:none;margin-left:0.5rem;transition:background 0.2s;";
            attachBtn.onmouseover = function() { this.style.background = '#f5f5f5'; };
            attachBtn.onmouseout = function() { this.style.background = 'transparent'; };
            attachBtn.title = 'Open attachments folder in SharePoint';
            filterBtns.appendChild(attachBtn);
        }

        // Rewrite all card-level Update & Attach buttons to use shared URLs
        function rewriteUpdateBtns() {
            if (!SHARED_EXCEL_URL) return;
            var cardBtns = document.querySelectorAll('a.update-btn');
            for (var i = 0; i < cardBtns.length; i++) {
                cardBtns[i].href = SHARED_EXCEL_URL;
                cardBtns[i].target = '_blank';
            }
        }
        function rewriteAttachBtns() {
            if (!ATTACHMENTS_URL) return;
            var attachBtns = document.querySelectorAll('a.attach-btn');
            for (var i = 0; i < attachBtns.length; i++) {
                attachBtns[i].href = ATTACHMENTS_URL;
                attachBtns[i].target = '_blank';
            }
        }
        rewriteUpdateBtns();
        rewriteAttachBtns();
        // Also rewrite after DOM fully loads (in case buttons render late)
        document.addEventListener('DOMContentLoaded', function() { rewriteUpdateBtns(); rewriteAttachBtns(); });
        setTimeout(function() { rewriteUpdateBtns(); rewriteAttachBtns(); }, 500);
    }

    // Notes history toggle — show/hide full history per card
    document.addEventListener('change', function(e) {
        if (!e.target.classList.contains('notes-history-toggle')) return;
        var pid = e.target.getAttribute('data-pid');
        var historyDiv = document.querySelector('.notes-history[data-pid="' + pid + '"]');
        if (historyDiv) {
            historyDiv.style.display = e.target.checked ? 'block' : 'none';
        }
    });
})();
