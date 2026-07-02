/*
 * CPL Dashboard — Filter & Search
 * Standalone external JS file (not affected by HTML truncation or sync issues)
 * Filters Activity KPI cards (with Goal sub-headers) and Project cards (grouped by Goal)
 */

// ── (Removed: Shared Excel URL) ──
// The toolbar "Update Projects" button + the per-card "Update" Excel deep-links
// were retired in Excel-retirement P1 (2026-06-01). Project cards are now
// click-to-edit via projects_editor.js, and the card "Update" button triggers
// the inline Latest Update editor instead of opening Excel for the Web.

// ── Attachments Folder URL ──
// Read from window.CPL_ATTACHMENTS_URL (injected by the pipeline from Excel config row 1, cell I1).
// The URL should be a direct SharePoint document library URL with an ?id= parameter.
// Each attach button has a data-folder attribute (e.g., "1.1 MAP Platform Development").
var _rawAttUrl = (window.CPL_ATTACHMENTS_URL || '').trim();

// Parse the SharePoint URL to extract base path, site, and viewid
var ATTACHMENTS_BASE_ID = '';
var ATTACHMENTS_VIEW_ID = '';
var ATTACHMENTS_SITE = '';

(function parseAttUrl() {
    if (!_rawAttUrl) return;
    try {
        var u = new URL(_rawAttUrl);
        ATTACHMENTS_SITE = u.origin;
        // Extract the id parameter (folder path)
        var idParam = u.searchParams.get('id') || '';
        if (idParam) {
            ATTACHMENTS_BASE_ID = decodeURIComponent(idParam);
        }
        // Extract viewid if present
        ATTACHMENTS_VIEW_ID = u.searchParams.get('viewid') || '';
    } catch(e) {
        // Fallback: use the raw URL as-is for the root
        ATTACHMENTS_BASE_ID = '';
    }
})();

function buildAttachmentUrl(subfolder) {
    if (!ATTACHMENTS_BASE_ID) return _rawAttUrl || '#';
    var basePath = ATTACHMENTS_BASE_ID;
    if (subfolder) {
        basePath += '/' + subfolder;
    }
    var pathParts = ATTACHMENTS_BASE_ID.split('/');
    // Reconstruct the AllItems.aspx URL from the site path
    // Pattern: /sites/{SiteName}/Shared Documents/Forms/AllItems.aspx
    var sitePath = '';
    for (var i = 0; i < pathParts.length; i++) {
        if (pathParts[i] === 'Shared Documents' || pathParts[i] === 'Shared%20Documents') {
            sitePath = pathParts.slice(0, i).join('/');
            break;
        }
    }
    if (!sitePath) sitePath = pathParts.slice(0, 3).join('/');
    var url = ATTACHMENTS_SITE + sitePath + '/Shared%20Documents/Forms/AllItems.aspx'
        + '?id=' + encodeURIComponent(basePath);
    if (ATTACHMENTS_VIEW_ID) url += '&viewid=' + encodeURIComponent(ATTACHMENTS_VIEW_ID);
    return url;
}
var ATTACHMENTS_URL = buildAttachmentUrl('');

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
        // Tabled/archived projects (project_lifecycle overlay) stay hidden and
        // out of the count — they live in the "Tabled & Archived" section.
        if (card.getAttribute('data-lifecycle')) { card.style.display = 'none'; continue; }
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

    // Quick-start filter_hint consumer. The Dashboard tab is always mounted
    // (it's the default), so we both pull any stashed hint at script-load
    // AND listen for live route events (when the user submits the chat
    // while already on Dashboard, no hashchange fires).
    function applyQuickstartHint(hint) {
        if (!hint || typeof hint !== 'object') return;
        var changed = false;
        function setSelectByContains(id, needle) {
            var sel = document.getElementById(id);
            if (!sel || !needle) return;
            var needleNorm = String(needle).toLowerCase();
            for (var i = 0; i < sel.options.length; i++) {
                if (sel.options[i].value.toLowerCase().indexOf(needleNorm) !== -1) {
                    sel.value = sel.options[i].value;
                    changed = true;
                    return;
                }
            }
        }
        // scroll_to: exact-match navigation to a specific project card by
        // project name (the .project-name text). Bypasses the filter — the
        // user picked a specific project from the typeahead, we know
        // exactly which card they want. Scrolls, flashes, no filter churn.
        if (typeof hint.scroll_to === 'string' && hint.scroll_to.trim()) {
            var target = hint.scroll_to.trim().toLowerCase();
            var cards = document.querySelectorAll('#tab-activities-projects .project-card');
            var hit = null;
            for (var ci = 0; ci < cards.length; ci++) {
                var nm = cards[ci].querySelector('.project-name');
                if (nm && nm.textContent.trim().toLowerCase() === target) { hit = cards[ci]; break; }
            }
            if (hit) {
                // Defer one frame so any pane-switch / layout settles first.
                setTimeout(function () {
                    hit.scrollIntoView({behavior: 'smooth', block: 'center'});
                    hit.classList.remove('qs-flash');
                    void hit.offsetWidth; // force reflow to restart the animation
                    hit.classList.add('qs-flash');
                    setTimeout(function () { hit.classList.remove('qs-flash'); }, 1700);
                }, 80);
                return; // scroll_to is the whole behavior; no filter mutations
            }
            // Card not found — fall through to plain search-filter as a fallback
            // so the user still sees something rather than a silent no-op.
            var sbFall = document.getElementById('searchBox');
            if (sbFall) { sbFall.value = hint.scroll_to.trim(); changed = true; }
        }
        if (typeof hint.search === 'string' && hint.search.trim()) {
            var sbEl = document.getElementById('searchBox');
            if (sbEl) { sbEl.value = hint.search.trim(); changed = true; }
        }
        if (hint.activity) setSelectByContains('filterActivity', hint.activity);
        if (hint.goal)     setSelectByContains('filterGoal',     hint.goal);
        if (hint.status)   setSelectByContains('filterStatus',   hint.status);
        if (hint.lead)     setSelectByContains('filterLead',     hint.lead);
        if (changed) applyFilters();
    }
    // Cold-load path — a hint stashed in sessionStorage from a previous
    // quickstart submit gets consumed once. (The projects grid + filter bar
    // moved to the Activities & Projects tab in PR #206, so the hint is keyed
    // to 'activities-projects', not 'dashboard'.)
    if (window.CPL_QS && typeof window.CPL_QS.consume === 'function') {
        applyQuickstartHint(window.CPL_QS.consume('activities-projects'));
    }
    // Live path — the user submits the chat with Activities & Projects active.
    window.addEventListener('cpl-qs-hint', function (ev) {
        var d = ev && ev.detail;
        if (d && d.tab === 'activities-projects') applyQuickstartHint(d.hint);
    });

    // Inject Master Report button next to filter buttons. Was a bare download
    // link to the daily pre-built reports/CPL_Master_Report.docx; it now opens
    // the master_report.js selection modal (Activities & Projects checkboxes,
    // built client-side from live data — Sam, 2026-07-02). The script is
    // lazy-loaded on first click via CPL_TABS.loadScript; if that helper (or
    // the load) is unavailable, fall back to downloading the pre-built docx so
    // the button never dead-ends.
    var filterBtns = document.querySelector('.filter-buttons');
    if (filterBtns) {
        var reportBtn = document.createElement('button');
        reportBtn.type = 'button';
        reportBtn.id = 'masterReportBtn';
        reportBtn.innerHTML = '&#128196; Master Report';
        reportBtn.style.cssText = "display:inline-flex;align-items:center;gap:0.3rem;background:transparent;color:var(--text-strong);border:1px solid #ccc;padding:7px 16px;font-weight:600;cursor:pointer;border-radius:4px;font-size:0.85rem;font-family:'Source Sans 3',Arial,sans-serif;line-height:1.2;text-decoration:none;margin-left:0.5rem;transition:background 0.2s;";
        reportBtn.onmouseover = function() { this.style.background = '#f5f5f5'; };
        reportBtn.onmouseout = function() { this.style.background = 'transparent'; };
        reportBtn.addEventListener('click', function () {
            if (window.CPL_MASTER_REPORT) { window.CPL_MASTER_REPORT.open(); return; }
            var tabs = window.CPL_TABS;
            if (tabs && typeof tabs.loadScript === 'function') {
                tabs.loadScript('master_report.js', 'CPL_MASTER_REPORT', function () {
                    if (window.CPL_MASTER_REPORT) window.CPL_MASTER_REPORT.open();
                    else window.location.href = 'reports/CPL_Master_Report.docx';
                });
            } else {
                window.location.href = 'reports/CPL_Master_Report.docx';
            }
        });
        filterBtns.appendChild(reportBtn);

        // Attach Doc button — opens SharePoint attachments folder
        if (ATTACHMENTS_URL) {
            var attachBtn = document.createElement('a');
            attachBtn.id = 'attachDocBtn';
            attachBtn.href = ATTACHMENTS_URL;
            attachBtn.target = '_blank';
            attachBtn.innerHTML = '&#128206; Attach Doc';
            attachBtn.style.cssText = "display:inline-flex;align-items:center;gap:0.3rem;background:transparent;color:var(--text-strong);border:1px solid #ccc;padding:7px 16px;font-weight:600;cursor:pointer;border-radius:4px;font-size:0.85rem;font-family:'Source Sans 3',Arial,sans-serif;line-height:1.2;text-decoration:none;margin-left:0.5rem;transition:background 0.2s;";
            attachBtn.onmouseover = function() { this.style.background = '#f5f5f5'; };
            attachBtn.onmouseout = function() { this.style.background = 'transparent'; };
            attachBtn.title = 'Open SharePoint folder — use Upload or drag & drop to add files';
            filterBtns.appendChild(attachBtn);
        }

        // Rewrite all card-level Attach buttons to use the parsed SharePoint URL.
        // (The card "Update" rewrite was removed in P1 — see note above.)
        function rewriteAttachBtns() {
            if (!ATTACHMENTS_BASE_ID) return;
            var attachBtns = document.querySelectorAll('a.attach-btn');
            for (var i = 0; i < attachBtns.length; i++) {
                var folder = attachBtns[i].getAttribute('data-folder') || '';
                attachBtns[i].href = buildAttachmentUrl(folder);
                attachBtns[i].target = '_blank';
            }
        }
        rewriteAttachBtns();
        // Also rewrite after DOM fully loads (in case buttons render late)
        document.addEventListener('DOMContentLoaded', function() { rewriteAttachBtns(); });
        setTimeout(function() { rewriteAttachBtns(); }, 500);
    }

    // ── Attach-flow explainer (Sam, 2026-07-02) ──
    // The 📎 buttons OPEN the project's SharePoint folder — the actual attach
    // is SharePoint's own "＋ Create or upload" INTO that folder (COBI can't
    // push files into SharePoint without Microsoft auth). That handoff wasn't
    // discoverable ("it's taking me to an attachment folder but no way I see
    // to select and attach it"), so a small explainer now precedes the folder
    // open. "Got it" persists per browser (localStorage) and skips straight
    // to the folder on later clicks.
    //
    // MISSING-FOLDER caveat (Sam's 4.1.4 screenshot, same day): the per-project
    // folders were created ONCE (April 8) by the generator running on Sam's
    // OneDrive-synced machine; on the Actions runner that synced path doesn't
    // exist, so folders for projects added since (the 4.1.x sprints, new 5.x)
    // were never created — their deep link hits SharePoint's "Unknown render
    // failure". The explainer therefore also links the PARENT Attachments
    // folder and names the fix (create the folder there, or upload to the
    // parent). The durable fix is the native Supabase-Storage attach flow
    // (decision with Sam — see docs/session_97_handoff.md).
    var ATTACH_HELP_KEY = 'cplAttachHelp.v1';
    function attachHelpDismissed() {
        try { return localStorage.getItem(ATTACH_HELP_KEY) === 'dismissed'; } catch (e) { return false; }
    }
    function showAttachExplainer(href) {
        var old = document.getElementById('attachExplainer');
        if (old) old.parentNode.removeChild(old);
        var ov = document.createElement('div');
        ov.id = 'attachExplainer';
        ov.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:1.5rem;';
        ov.innerHTML =
            '<div style="max-width:460px;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.25);overflow:hidden;font-family:\'Source Sans 3\',Arial,sans-serif;">'
            + '<div style="background:linear-gradient(135deg,var(--navy-primary) 0%,var(--navy-secondary) 100%);padding:0.9rem 1.2rem;display:flex;justify-content:space-between;align-items:center;">'
            + '<h3 style="margin:0;color:#fff;font-size:1rem;">&#128206; Attaching a document</h3>'
            + '<button id="attachExplainerClose" type="button" style="background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer;line-height:1;">&times;</button></div>'
            + '<div style="padding:1.1rem 1.3rem;font-size:0.86rem;color:#333;line-height:1.5;">'
            + '<p style="margin:0 0 0.6rem 0;">Attachments live in the project\'s <strong>SharePoint folder</strong> — COBI links you there, and the upload happens in SharePoint itself:</p>'
            + '<ol style="margin:0 0 0.8rem 1.1rem;padding:0;">'
            + '<li style="margin-bottom:0.35rem;"><strong>Open the folder</strong> with the button below (new tab).</li>'
            + '<li style="margin-bottom:0.35rem;">Click SharePoint\'s <strong>＋ Create or upload</strong> button (top right of the folder view) and pick your file. (Drag-and-drop from File Explorer can work too, but SharePoint is picky about it — the upload button always works.)</li>'
            + '<li>Done — the card\'s &#128206; attachment count picks it up on the next daily dashboard refresh.</li></ol>'
            + '<p style="margin:0 0 0.8rem 0;font-size:0.78rem;color:#777;">If SharePoint says <em>"something went wrong / this item isn\'t available"</em>, this project\'s folder hasn\'t been created yet (newer projects don\'t get one automatically). Open <a id="attachExplainerParent" target="_blank" rel="noopener" style="color:var(--accent-link);">the parent Attachments folder ↗</a> and either upload there or use <strong>＋ Create or upload → Folder</strong> to add it first.</p>'
            + '<label style="display:flex;align-items:center;gap:0.4rem;font-size:0.8rem;color:#555;cursor:pointer;">'
            + '<input type="checkbox" id="attachExplainerSkip" style="accent-color:var(--accent-link);cursor:pointer;">Got it — take me straight to the folder next time</label>'
            + '</div>'
            + '<div style="padding:0.8rem 1.3rem;border-top:1px solid #e8e8e8;display:flex;justify-content:flex-end;gap:0.5rem;">'
            + '<a id="attachExplainerGo" target="_blank" rel="noopener" style="padding:8px 18px;background:var(--cobalt);color:#fff;border-radius:4px;font-weight:600;font-size:0.85rem;text-decoration:none;">Open the project folder &#8599;</a>'
            + '</div></div>';
        document.body.appendChild(ov);
        var go = document.getElementById('attachExplainerGo');
        go.href = href;
        var parentLink = document.getElementById('attachExplainerParent');
        if (parentLink) parentLink.href = buildAttachmentUrl('');
        function done() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
        document.getElementById('attachExplainerClose').addEventListener('click', done);
        ov.addEventListener('click', function (e) { if (e.target === ov) done(); });
        go.addEventListener('click', function () {
            var skip = document.getElementById('attachExplainerSkip');
            if (skip && skip.checked) { try { localStorage.setItem(ATTACH_HELP_KEY, 'dismissed'); } catch (e) {} }
            done();
        });
    }
    document.addEventListener('click', function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a.attach-btn, #attachDocBtn') : null;
        if (!a || attachHelpDismissed()) return; // dismissed → straight to the folder
        e.preventDefault();
        showAttachExplainer(a.href);
    });

    // Notes history toggle — show/hide full history per card
    document.addEventListener('change', function(e) {
        if (!e.target.classList.contains('notes-history-toggle')) return;
        var pid = e.target.getAttribute('data-pid');
        var historyDiv = document.querySelector('.notes-history[data-pid="' + pid + '"]');
        if (historyDiv) {
            historyDiv.style.display = e.target.checked ? 'block' : 'none';
        }
    });

    // ── Mobile: collapsible filter bar ──
    function setupMobileFilters() {
        var filterBar = document.querySelector('.filter-bar');
        if (!filterBar) return;

        // Only activate on narrow screens
        function isMobile() { return window.innerWidth <= 768; }

        // Wrap filter groups in a collapsible div (only once)
        if (filterBar.querySelector('.filter-toggle-btn')) return;

        var filterGroups = filterBar.querySelectorAll('.filter-group');
        var filterBtns = filterBar.querySelector('#filterButtons');

        // Create toggle button
        var toggleBtn = document.createElement('button');
        toggleBtn.className = 'filter-toggle-btn';
        toggleBtn.innerHTML = '<span>Filters & Actions</span><span class="arrow">&#9654;</span>';
        toggleBtn.type = 'button';

        // Create collapsible wrapper
        var collapsible = document.createElement('div');
        collapsible.className = 'filter-collapsible';

        // Move filter groups into collapsible
        for (var i = 0; i < filterGroups.length; i++) {
            collapsible.appendChild(filterGroups[i]);
        }
        if (filterBtns) collapsible.appendChild(filterBtns);

        // Insert toggle + collapsible into filter bar
        filterBar.insertBefore(toggleBtn, filterBar.firstChild);
        filterBar.appendChild(collapsible);

        // Default collapsed on mobile
        filterBar.classList.add('filters-collapsed');

        toggleBtn.addEventListener('click', function() {
            if (filterBar.classList.contains('filters-collapsed')) {
                filterBar.classList.remove('filters-collapsed');
                filterBar.classList.add('filters-expanded');
            } else {
                filterBar.classList.remove('filters-expanded');
                filterBar.classList.add('filters-collapsed');
            }
        });

        // Show/hide toggle based on screen size
        function checkWidth() {
            if (isMobile()) {
                toggleBtn.style.display = 'flex';
                if (!filterBar.classList.contains('filters-expanded')) {
                    collapsible.style.display = 'none';
                    filterBar.classList.add('filters-collapsed');
                }
            } else {
                toggleBtn.style.display = 'none';
                collapsible.style.display = 'flex';
                collapsible.style.flexWrap = 'wrap';
                collapsible.style.gap = '1rem';
                collapsible.style.alignItems = 'center';
                collapsible.style.flexDirection = 'row';
                filterBar.classList.remove('filters-collapsed', 'filters-expanded');
            }
        }
        checkWidth();
        window.addEventListener('resize', checkWidth);
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupMobileFilters);
    } else {
        setupMobileFilters();
    }
})();
