/*
 * CPL Dashboard — Custom Report Generator
 * Multi-select activities/projects + audience picker → AI-generated .docx
 * Requires: docx library (loaded from CDN), Cloudflare Worker proxy for Claude API
 *
 * Live wiring (Sam, 2026-07-02): before building the prompt, the generator
 * fetches the SAME live overlays the card faces use — the newest item_updates
 * row per activity/project (the RACI 📝 composer) and the item_raci roster
 * (lead = Responsible → Accountable) — so the report always carries the
 * current updates + leads, not the creation-era snapshot. Falls back to the
 * build-time CPL_DATA.live_updates map, then to the baked fields.
 */

(function () {
    'use strict';

    // ── Configuration ──
    // Set these in the HTML or via window globals before this script loads
    var PROXY_URL = (typeof window !== 'undefined' && window.CPL_REPORT_PROXY_URL) || '';
    // Unversioned alias, NOT a dated snapshot — a pinned claude-*-YYYYMMDD is a
    // latent outage on its retirement date (docs/kb-notes/playbook-edge-function-502-retired-model.md).
    var CLAUDE_MODEL = 'claude-sonnet-4-5';

    // Naming rules appended to every report prompt (Sam, 2026-07-03): the
    // program is the CPL Initiative; MAP is the platform. The generated
    // Legislative Report had twice expanded MAP by its 2017-era name.
    var NAMING_RULE = 'Naming rules (STRICT): The program is the "CPL Initiative" of the '
        + 'California Community Colleges Chancellor\'s Office — never call it the "MAP Initiative". '
        + 'MAP is the platform, expanded as the "Mapping Articulated Pathways (MAP) platform". '
        + 'NEVER expand MAP as "Military Articulation Platform" — that was only the platform\'s '
        + 'original name at its 2017 launch, and it may appear only when explicitly recounting that history.';

    // Public anon key — same one committed in card_updates.js / card_raci.js.
    var SUPABASE_URL = 'https://hvuwhnbuahrtptokpqfh.supabase.co';
    var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM';

    // ── Live overlay helpers (pure — exported for tests) ──
    // Newest item_updates row per `item_type:item_id` (mirrors card_updates.js).
    function latestByKey(rows) {
        var out = {};
        (rows || []).forEach(function (r) {
            if (!r || r.item_type == null || r.item_id == null) return;
            var k = r.item_type + ':' + r.item_id;
            var cur = out[k];
            if (!cur || new Date(r.created_at).getTime() > new Date(cur.created_at).getTime()) out[k] = r;
        });
        return out;
    }
    // item_raci rows → { "project:1.1": {R:[],A:[],C:[],I:[]}, … } (mirrors card_raci.js).
    function raciByKey(rows) {
        var out = {};
        (rows || []).forEach(function (r) {
            if (!r || r.item_type == null || r.item_id == null) return;
            out[r.item_type + ':' + r.item_id] = r.raci || {};
        });
        return out;
    }
    // Card "Lead" = Responsible member(s), falling back to Accountable.
    function leadNames(raci) {
        function names(arr) {
            return (arr || []).map(function (m) { return m && m.name ? m.name : (typeof m === 'string' ? m : ''); }).filter(Boolean);
        }
        if (!raci) return [];
        var r = names(raci.R);
        return r.length ? r : names(raci.A);
    }
    // The update body/date out of either shape: a fetched item_updates row
    // ({body, created_at}) or the build-time CPL_DATA.live_updates entry
    // ({body, date, created_at}).
    function updText(u) { return (u && u.body) || ''; }
    function updDate(u) {
        if (!u) return '';
        return u.date || String(u.created_at || '').slice(0, 10);
    }
    // Overlay live updates + RACI leads onto copies of the selected projects so
    // the prompt reads the same "current" data the cards show.
    function applyLiveOverlay(projects, live) {
        return (projects || []).map(function (p) {
            var q = {};
            for (var k in p) q[k] = p[k];
            var u = live && live.updates && live.updates['project:' + p.id];
            if (updText(u)) { q.update = updText(u); q.update_date = updDate(u) || q.update_date; }
            var ln = leadNames(live && live.raci && live.raci['project:' + p.id]);
            if (ln.length) q.lead = ln.join(', ');
            return q;
        });
    }
    // The activity-level updates (`activity:N`) for the activities the selected
    // projects belong to → [{activity, body, date}].
    function activityUpdatesFor(projects, updates) {
        var seen = {}, out = [];
        (projects || []).forEach(function (p) {
            var m = String(p.activity || '').match(/Activity\s+(\d+)/);
            if (!m || seen[m[1]]) return;
            seen[m[1]] = true;
            var u = updates && updates['activity:' + m[1]];
            if (updText(u)) out.push({ activity: 'Activity ' + m[1], body: updText(u), date: updDate(u) });
        });
        return out;
    }
    // Fetch both overlays (anon read; each soft-fails to []). When item_updates
    // is unreachable, fall back to the build-time CPL_DATA.live_updates export.
    function fetchLiveOverlay() {
        function get(path) {
            return fetch(SUPABASE_URL + '/rest/v1/' + path, { headers: { apikey: SUPABASE_ANON } })
                .then(function (r) { return r.ok ? r.json() : []; })
                .catch(function () { return []; });
        }
        return Promise.all([
            get('item_updates?select=item_type,item_id,body,author,created_at&order=created_at.desc'),
            get('item_raci?select=item_type,item_id,raci'),
        ]).then(function (res) {
            var updates = latestByKey(res[0]);
            if (!Object.keys(updates).length && typeof window !== 'undefined'
                && window.CPL_DATA && window.CPL_DATA.live_updates) {
                updates = window.CPL_DATA.live_updates;
            }
            return { updates: updates, raci: raciByKey(res[1]) };
        });
    }

    // ── Load docx library from CDN ──
    var docxLoaded = false;
    function ensureDocxLib(cb) {
        if (docxLoaded || window.docx) { docxLoaded = true; cb(); return; }
        var s = document.createElement('script');
        s.src = 'docx.min.js';
        s.onload = function () { docxLoaded = true; cb(); };
        s.onerror = function () { alert('Failed to load docx library.'); };
        document.head.appendChild(s);
    }

    // ── Audiences ──
    // `title` is the document title the docx template stamps (and the model is
    // told NOT to repeat) — previously every report read "Legislative Report"
    // regardless of audience because the model invented its own title.
    var AUDIENCES = [
        { id: 'legislators', label: 'State Legislators & Legislative Staff', title: 'Legislative Report', prompt: 'Write for California state legislators and legislative staff. Emphasize ROI, fiscal impact, student outcomes, policy alignment with AB 1071 and Vision 2030, and statewide scale. Use formal but accessible language. Lead with measurable impact.' },
        { id: 'ccc_leaders', label: 'CCC System Leaders (Chancellor\'s Office, Presidents)', title: 'System Leadership Report', prompt: 'Write for California Community College system leaders — the Chancellor\'s Office and college presidents. Emphasize strategic alignment with Vision 2030, institutional adoption metrics, implementation progress, and scalability across all California community colleges. Professional and strategic tone.' },
        { id: 'faculty', label: 'Faculty & Academic Senate', title: 'Faculty & Academic Senate Report', prompt: 'Write for faculty and academic senate members. Emphasize academic rigor, credit recommendation quality, faculty workgroup outcomes, discipline-specific progress, and how CPL maintains academic standards while expanding access. Collegial and evidence-based tone.' },
        { id: 'veterans', label: 'Veterans & Military Partners', title: 'Veterans & Military Partners Report', prompt: 'Write for military service members, veterans, and military education partners. Emphasize JST credit translation, military-specific CPL pathways, Star Colleges network, and how military training translates to college credit. Warm, respectful, action-oriented tone.' },
        { id: 'workforce', label: 'Workforce & Industry Partners', title: 'Workforce & Industry Report', prompt: 'Write for workforce development boards, employers, and industry partners. Emphasize skills-based credentials, apprenticeship pathways, industry-aligned credit recommendations, and how CPL bridges work experience to college credentials. Professional and outcome-focused.' },
        { id: 'general', label: 'General Audience', title: 'CPL Initiative Report', prompt: 'Write for a general audience of education stakeholders. Use clear, accessible language. Explain acronyms on first use. Balance data with narrative. Highlight student impact and real-world outcomes.' },
    ];

    // ── Elevation (Sam, 2026-07-03) ──
    // A 0 → 30,000 ft slider: how much detail vs. high-altitude focus the
    // report carries. Sea level = writing for a CPL newcomer (all the data
    // points, background, defined terms); 30,000 ft = a Board of Governors /
    // agency-head brief (salient outcomes, opportunities, asks — no detail).
    var ELEVATION_BANDS = [
        {
            max: 5000, name: 'Ground level', short: 'full operational detail — written for a CPL newcomer',
            words: '2,500–3,500', maxTokens: 8192,
            guidance: 'The reader is NEW to CPL (a newcomer to the field or community). Provide background and context for the initiative, define every acronym and program term on first use, and include ALL the relevant data points for each selected project — goals, stretch targets, budget, milestones, team — explaining what each metric means and why it matters.',
        },
        {
            max: 12500, name: 'Low altitude', short: 'working detail for someone familiar with the initiative',
            words: '1,800–2,500', maxTokens: 8192,
            guidance: 'The reader knows the initiative. Provide working-level detail: most data points per project with brief context, per-project narratives, and light background only where genuinely needed.',
        },
        {
            max: 20000, name: 'Cruising altitude', short: 'balanced executive report',
            words: '1,200–1,800', maxTokens: 4096,
            guidance: 'A balanced executive report: only the salient metrics per project, concise narratives, minimal background. Assume fluency with CPL terms.',
        },
        {
            max: 27500, name: 'High altitude', short: 'senior-leadership brief — outcomes and opportunities',
            words: '800–1,200', maxTokens: 4096,
            guidance: 'A senior-leadership brief: lead with outcomes, opportunities, and asks. Group projects under their Activity rather than narrating each one, and cite at most one standout metric per point.',
        },
        {
            max: 30000, name: '30,000 ft', short: 'board / agency-head altitude — high points only',
            words: '500–800', maxTokens: 4096,
            guidance: 'Board of Governors / public-agency-leader altitude: ONLY the headline outcomes, the strategic opportunities, and any decisions or support needed. No project-by-project detail — roll everything up to the initiative and Activity level. A reader should absorb the whole report in three minutes.',
        },
    ];
    function elevationBand(ft) {
        var n = Number(ft) || 0;
        for (var i = 0; i < ELEVATION_BANDS.length; i++) {
            if (n <= ELEVATION_BANDS[i].max) return ELEVATION_BANDS[i];
        }
        return ELEVATION_BANDS[ELEVATION_BANDS.length - 1];
    }
    function elevationGuidance(ft) {
        var b = elevationBand(ft);
        return 'Elevation: ' + Number(ft).toLocaleString() + ' ft (' + b.name + '). ' + b.guidance
            + ' Target length: ' + b.words + ' words.';
    }
    function fmtFeet(ft) {
        var n = Number(ft) || 0;
        return (n === 0 ? 'Sea level' : n.toLocaleString() + ' ft') + ' — ' + elevationBand(n).name;
    }

    // ── Build Modal HTML ──
    function buildModal() {
        var data = window.CPL_DATA;
        if (!data || !data.projects) return;

        // Group projects by activity
        var activities = {};
        var activityOrder = [];
        data.projects.forEach(function (p) {
            if (p.id.startsWith('D.')) return; // skip sub-population rows
            var actKey = p.activity || 'Other';
            if (!activities[actKey]) {
                activities[actKey] = [];
                activityOrder.push(actKey);
            }
            activities[actKey].push(p);
        });

        var html = '';
        html += '<div id="reportModal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.5);overflow-y:auto;padding:2rem;">';
        html += '<div style="max-width:700px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.2);overflow:hidden;font-family:\'Source Sans 3\',Arial,sans-serif;">';

        // Header
        html += '<div style="background:linear-gradient(135deg,var(--navy-primary) 0%,var(--navy-secondary) 100%);padding:1.2rem 1.5rem;display:flex;justify-content:space-between;align-items:center;">';
        html += '<h2 style="margin:0;color:#fff;font-size:1.1rem;">Custom Report Generator</h2>';
        html += '<button id="reportModalClose" style="background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;padding:0;line-height:1;">&times;</button>';
        html += '</div>';

        // Body
        html += '<div style="padding:1.5rem;max-height:70vh;overflow-y:auto;">';

        // Report type — the Master Report was consolidated into this modal
        // (Session 97): one button, two outputs.
        html += '<div style="margin-bottom:1.2rem;">';
        html += '<label style="font-weight:700;color:var(--text-strong);font-size:0.9rem;display:block;margin-bottom:0.4rem;">Report Type</label>';
        html += '<div style="display:flex;gap:1.2rem;flex-wrap:wrap;font-size:0.85rem;">';
        html += '<label style="display:flex;align-items:center;gap:0.35rem;cursor:pointer;"><input type="radio" name="reportType" value="custom" checked style="accent-color:var(--accent-link);cursor:pointer;">&#9889; Audience narrative <span style="color:#888;">(AI-written)</span></label>';
        html += '<label style="display:flex;align-items:center;gap:0.35rem;cursor:pointer;"><input type="radio" name="reportType" value="master" style="accent-color:var(--accent-link);cursor:pointer;">&#128203; Master data report <span style="color:#888;">(verbatim workplan, no AI)</span></label>';
        html += '</div></div>';

        // Audience picker (narrative mode only)
        html += '<div id="reportAudienceRow" style="margin-bottom:1.2rem;">';
        html += '<label style="font-weight:700;color:var(--text-strong);font-size:0.9rem;display:block;margin-bottom:0.4rem;">Target Audience</label>';
        html += '<select id="reportAudience" style="width:100%;padding:8px 12px;border:1px solid #ccc;border-radius:4px;font-size:0.85rem;font-family:inherit;">';
        AUDIENCES.forEach(function (a) {
            html += '<option value="' + a.id + '">' + a.label + '</option>';
        });
        html += '</select>';
        html += '</div>';

        // Elevation slider (narrative mode only)
        var savedElev = 15000;
        try { savedElev = parseInt(localStorage.getItem('cplReportElevation.v1'), 10) || 15000; } catch (e) { /* ignore */ }
        html += '<div id="reportElevationRow" style="margin-bottom:1.2rem;">';
        html += '<label style="font-weight:700;color:var(--text-strong);font-size:0.9rem;display:block;margin-bottom:0.2rem;">Elevation &nbsp;<span id="reportElevOut" style="font-weight:600;color:var(--navy-secondary);"></span></label>';
        html += '<input type="range" id="reportElevation" min="0" max="30000" step="2500" value="' + savedElev + '" style="width:100%;accent-color:var(--accent-link);cursor:pointer;">';
        html += '<div style="display:flex;justify-content:space-between;font-size:0.72rem;color:#888;"><span>Sea level — every data point, explained</span><span>30,000 ft — high points only</span></div>';
        html += '<div id="reportElevHint" style="font-size:0.78rem;color:#666;margin-top:0.25rem;"></div>';
        html += '</div>';

        // Select All / None
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;">';
        html += '<label style="font-weight:700;color:var(--text-strong);font-size:0.9rem;">Select Activities & Projects</label>';
        html += '<div style="display:flex;gap:0.5rem;">';
        html += '<button class="rpt-sel-btn" data-action="all" style="font-size:0.75rem;padding:3px 10px;border:1px solid #ccc;border-radius:3px;background:#f5f5f5;cursor:pointer;font-family:inherit;">Select All</button>';
        html += '<button class="rpt-sel-btn" data-action="none" style="font-size:0.75rem;padding:3px 10px;border:1px solid #ccc;border-radius:3px;background:#f5f5f5;cursor:pointer;font-family:inherit;">Clear All</button>';
        html += '</div></div>';

        // Activity/Project checkboxes
        activityOrder.forEach(function (actKey) {
            var projects = activities[actKey];
            var actNum = actKey.match(/Activity\s+(\d+)/);
            var actId = actNum ? actNum[1] : '0';

            html += '<div style="margin-bottom:0.8rem;border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;">';

            // Activity header with checkbox
            html += '<label style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.8rem;background:#f0f4f8;cursor:pointer;font-weight:600;color:var(--text-strong);font-size:0.85rem;">';
            html += '<input type="checkbox" class="rpt-activity-cb" data-activity="' + actId + '" checked style="accent-color:var(--accent-link);cursor:pointer;">';
            html += actKey;
            html += '</label>';

            // Project checkboxes
            html += '<div style="padding:0.3rem 0.8rem 0.5rem 2rem;">';
            projects.forEach(function (p) {
                html += '<label style="display:flex;align-items:flex-start;gap:0.4rem;padding:0.2rem 0;cursor:pointer;font-size:0.82rem;color:#333;">';
                html += '<input type="checkbox" class="rpt-project-cb" data-pid="' + p.id + '" data-activity="' + actId + '" checked style="margin-top:2px;accent-color:var(--accent-link);cursor:pointer;">';
                html += '<span><strong style="color:var(--navy-secondary);">' + p.id + '</strong> ' + p.name + '</span>';
                html += '</label>';
            });
            html += '</div></div>';
        });

        // (API key handled server-side by Cloudflare Worker proxy)

        html += '</div>'; // end body

        // Footer — progress bar + status label + Generate
        html += '<div style="padding:1rem 1.5rem;border-top:1px solid #e8e8e8;display:flex;justify-content:space-between;align-items:center;gap:0.8rem;flex-wrap:wrap;">';
        html += '<div style="flex:1 1 240px;min-width:200px;">';
        html += '<div id="reportProgressWrap" style="display:none;height:8px;background:#e8e8e8;border-radius:4px;overflow:hidden;margin-bottom:5px;">';
        html += '<div id="reportProgressBar" style="height:100%;width:0%;background:var(--cobalt);border-radius:4px;transition:width 0.4s ease;"></div>';
        html += '</div>';
        html += '<div id="reportStatus" style="font-size:0.8rem;color:#666;"></div>';
        html += '</div>';
        html += '<div style="display:flex;gap:0.5rem;">';
        html += '<button id="reportGenBtn" style="padding:8px 20px;background:var(--cobalt);color:#fff;border:none;border-radius:4px;font-weight:600;font-size:0.85rem;cursor:pointer;font-family:inherit;">Generate Report</button>';
        html += '</div></div>';

        html += '</div></div>';

        var container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container.firstChild);

        // ── Wire up events ──
        document.getElementById('reportModalClose').addEventListener('click', closeModal);
        document.getElementById('reportModal').addEventListener('click', function (e) {
            if (e.target === this) closeModal();
        });

        // Activity checkbox toggles child projects
        document.querySelectorAll('.rpt-activity-cb').forEach(function (cb) {
            cb.addEventListener('change', function () {
                var actId = this.getAttribute('data-activity');
                var checked = this.checked;
                document.querySelectorAll('.rpt-project-cb[data-activity="' + actId + '"]').forEach(function (pcb) {
                    pcb.checked = checked;
                });
            });
        });

        // Select All / Clear All
        document.querySelectorAll('.rpt-sel-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var check = this.getAttribute('data-action') === 'all';
                document.querySelectorAll('.rpt-activity-cb, .rpt-project-cb').forEach(function (cb) {
                    cb.checked = check;
                });
            });
        });

        // Generate button
        document.getElementById('reportGenBtn').addEventListener('click', generateReport);

        // Elevation slider — live label + per-browser persistence
        var elevInput = document.getElementById('reportElevation');
        function syncElev() {
            var ft = parseInt(elevInput.value, 10) || 0;
            var out = document.getElementById('reportElevOut');
            var hint = document.getElementById('reportElevHint');
            if (out) out.textContent = fmtFeet(ft);
            if (hint) hint.textContent = elevationBand(ft).short;
            try { localStorage.setItem('cplReportElevation.v1', String(ft)); } catch (e) { /* ignore */ }
        }
        elevInput.addEventListener('input', syncElev);
        syncElev();

        // Report type toggle — Master mode hides the narrative-only controls
        document.querySelectorAll('input[name="reportType"]').forEach(function (r) {
            r.addEventListener('change', syncReportType);
        });
        syncReportType();
    }

    function reportType() {
        var el = document.querySelector('input[name="reportType"]:checked');
        return el ? el.value : 'custom';
    }
    function syncReportType() {
        var master = reportType() === 'master';
        var aud = document.getElementById('reportAudienceRow');
        var elev = document.getElementById('reportElevationRow');
        var btn = document.getElementById('reportGenBtn');
        if (aud) aud.style.display = master ? 'none' : '';
        if (elev) elev.style.display = master ? 'none' : '';
        if (btn) btn.textContent = master ? 'Generate Master Report' : 'Generate Report';
    }

    // ── Progress bar ──
    // Replaces the old "Generating..." button label: a staged bar that creeps
    // toward a cap while the API call is in flight (the call itself is a
    // single POST, so in-between progress is time-based, not byte-based).
    var _progressTimer = null;
    function progressTo(pct, msg, color) {
        var wrap = document.getElementById('reportProgressWrap');
        var bar = document.getElementById('reportProgressBar');
        if (wrap) wrap.style.display = 'block';
        if (bar) { bar.style.width = Math.max(0, Math.min(100, pct)) + '%'; bar.style.background = 'var(--cobalt)'; }
        if (msg != null) setStatus(msg, color || '#4A90D9');
    }
    function progressCreep(cap) {
        progressStopCreep();
        _progressTimer = setInterval(function () {
            var bar = document.getElementById('reportProgressBar');
            if (!bar) return;
            var cur = parseFloat(bar.style.width) || 0;
            if (cur < cap) bar.style.width = (cur + 1) + '%';
        }, 450);
    }
    function progressStopCreep() {
        if (_progressTimer) { clearInterval(_progressTimer); _progressTimer = null; }
    }
    function progressDone(msg) {
        progressStopCreep();
        var bar = document.getElementById('reportProgressBar');
        if (bar) { bar.style.width = '100%'; bar.style.background = '#2A7D4F'; }
        setStatus(msg, '#2A7D4F');
        setTimeout(function () {
            var wrap = document.getElementById('reportProgressWrap');
            if (wrap) wrap.style.display = 'none';
            var b = document.getElementById('reportProgressBar');
            if (b) { b.style.width = '0%'; b.style.background = 'var(--cobalt)'; }
        }, 2500);
    }
    function progressFail(msg) {
        progressStopCreep();
        var bar = document.getElementById('reportProgressBar');
        if (bar) bar.style.background = '#c00';
        setStatus(msg, '#c00');
    }

    function openModal() {
        var m = document.getElementById('reportModal');
        if (!m) { buildModal(); m = document.getElementById('reportModal'); }
        if (m) m.style.display = 'block';
    }

    function closeModal() {
        var m = document.getElementById('reportModal');
        if (m) m.style.display = 'none';
    }

    function setStatus(msg, color) {
        var el = document.getElementById('reportStatus');
        if (el) { el.textContent = msg; el.style.color = color || '#666'; }
    }

    // ── Gather selected data ──
    function getSelectedData() {
        var data = window.CPL_DATA;
        if (!data) return null;

        var selectedPids = [];
        document.querySelectorAll('.rpt-project-cb:checked').forEach(function (cb) {
            selectedPids.push(cb.getAttribute('data-pid'));
        });

        var pidSet = {};
        selectedPids.forEach(function (pid) { pidSet[pid] = true; });

        var projects = data.projects.filter(function (p) { return pidSet[p.id]; });
        var audienceId = document.getElementById('reportAudience').value;
        var audience = AUDIENCES.find(function (a) { return a.id === audienceId; }) || AUDIENCES[AUDIENCES.length - 1];
        var elevEl = document.getElementById('reportElevation');
        var elevation = elevEl ? (parseInt(elevEl.value, 10) || 0) : 15000;

        return {
            projects: projects,
            audience: audience,
            elevation: elevation,
            kpis: data.kpis || {},
            lastUpdated: data.last_updated || 'N/A',
        };
    }

    // ── Build Claude prompt ──
    function buildPrompt(sel) {
        var projectSummaries = sel.projects.map(function (p) {
            return '- **' + p.id + ' ' + p.name + '** (' + p.activity + ')\n'
                + '  Status: ' + p.status + ' | ' + p.pct + '% complete\n'
                + '  Description: ' + p.desc + '\n'
                + '  KPI: ' + (p.kpi_metric || 'N/A') + ' ' + (p.kpi_unit || '') + '\n'
                + '  Goal 25-26: ' + (p.kpi_goal_2526 || 'N/A') + ' | Stretch: ' + (p.kpi_stretch_2526 || 'N/A') + '\n'
                + '  Latest Update: ' + (p.update || 'N/A') + (p.update && p.update_date ? ' (' + p.update_date + ')' : '') + '\n'
                + '  Milestones: ' + (p.milestones || 'N/A') + '\n'
                + '  Workplan Notes: ' + (p.workplan_notes || 'N/A') + '\n'
                + '  Lead: ' + (p.lead || 'N/A') + ' | Team: ' + (p.team || 'N/A') + '\n'
                + '  Budget: ' + (p.budget || 'N/A') + ' (' + (p.budget_source || '') + ')\n'
                + '  Vision 2030: ' + (p.v2030 || 'N/A') + ' | CPL Goal: ' + (p.goal || 'N/A');
        }).join('\n\n');

        var activityUpdates = (sel.activityUpdates || []).map(function (u) {
            return '- **' + u.activity + '**' + (u.date ? ' (' + u.date + ')' : '') + ': ' + u.body;
        }).join('\n');

        var kpiSummary = '';
        for (var key in sel.kpis) {
            var k = sel.kpis[key];
            kpiSummary += '- ' + (k.label || key) + ': ' + (k.value || 'N/A');
            if (k.sub) kpiSummary += ' (' + k.sub + ')';
            if (k.breakdowns && k.breakdowns.length) {
                kpiSummary += '\n  Breakdowns: ' + k.breakdowns.map(function (b) { return b.label + ': ' + b.value; }).join(', ');
            }
            kpiSummary += '\n';
        }

        // Elevation shapes both the level of detail and the structure: at high
        // altitude the per-project section collapses into per-Activity highlights.
        var elevation = (sel.elevation == null) ? 15000 : sel.elevation;
        var band = elevationBand(elevation);
        var highAltitude = elevation > 20000;
        var structure = highAltitude
            ? ('1. **Executive Summary** (1-2 short paragraphs) — the most impactful outcomes for this audience\n'
                + '2. **Key Metrics & Progress** — only the headline numbers that matter to this audience\n'
                + '3. **Highlights by Activity** — one tight paragraph per Activity rolling up its selected projects (no project-by-project narration)\n'
                + '4. **Opportunities & Asks** — the strategic opportunities and any decisions or support needed\n')
            : ('1. **Executive Summary** (2-3 paragraphs) — tailored to the audience, highlighting the most impactful findings\n'
                + '2. **Key Metrics & Progress** — present headline KPIs in context for the audience\n'
                + '3. **Project Highlights** — for each selected project, write a concise but substantive narrative paragraph (not bullet points). Group by Activity.\n'
                + '4. **Looking Ahead** — upcoming milestones, goals, and strategic priorities\n'
                + '5. **Recommendations** — 3-5 actionable recommendations tailored to the audience\n');

        return 'You are writing a professional report about the California Community Colleges Credit for Prior Learning (CPL) Initiative.\n\n'
            + '## Audience\n' + sel.audience.prompt + '\n\n'
            + '## Altitude\n' + elevationGuidance(elevation) + '\n\n'
            + '## Headline KPIs (as of ' + sel.lastUpdated + ')\n' + kpiSummary + '\n\n'
            + '## Selected Projects\n' + projectSummaries + '\n\n'
            + (activityUpdates ? '## Latest Activity-Level Updates (posted by the team)\n' + activityUpdates + '\n\n' : '')
            + '## Instructions\n'
            + 'Write a polished, professional report covering the selected projects. Structure it as:\n'
            + structure + '\n'
            + 'The document template already renders the report title ("' + (sel.audience.title || 'CPL Initiative Report')
            + '") and the audience/date line — do NOT write a document title or an opening heading of your own; '
            + 'begin directly with "## Executive Summary".\n'
            + NAMING_RULE + '\n'
            + 'Use the data provided. Do not invent metrics. Write in prose, not bullet lists. '
            + 'Format section headers with ## markdown. Keep paragraphs concise but substantive.\n'
            + 'Honor the Altitude section above for depth and length (target ' + band.words + ' words).';
    }

    // ── Call Claude API ──
    async function callClaude(prompt, maxTokens) {
        var url = PROXY_URL || 'https://api.anthropic.com/v1/messages';
        var headers = {
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
        };

        var body = JSON.stringify({
            model: CLAUDE_MODEL,
            max_tokens: maxTokens || 4096,
            messages: [{ role: 'user', content: prompt }],
        });

        var resp = await fetch(url, { method: 'POST', headers: headers, body: body });
        if (!resp.ok) {
            var errText = await resp.text();
            throw new Error('API error (' + resp.status + '): ' + errText.substring(0, 200));
        }
        var json = await resp.json();
        if (json.content && json.content[0] && json.content[0].text) {
            return json.content[0].text;
        }
        throw new Error('Unexpected API response format');
    }

    // ── Generate .docx from markdown-ish text ──
    function buildDocx(narrative, audience, lastUpdated) {
        var D = window.docx;
        if (!D) { alert('docx library not loaded'); return; }

        var children = [];

        // Title — dynamic per audience (was a fixed "Custom Report" while the
        // model wrote its own "Legislative Report" heading for every audience)
        children.push(new D.Paragraph({
            children: [new D.TextRun({
                text: 'CPL Initiative — ' + (audience.title || 'Custom Report'),
                bold: true, size: 36, color: '0A2240', font: 'Calibri',
            })],
            spacing: { after: 100 },
        }));

        // Subtitle
        children.push(new D.Paragraph({
            children: [new D.TextRun({
                text: 'Prepared for: ' + audience.label + '  |  Data as of: ' + lastUpdated,
                size: 20, color: '666666', font: 'Calibri', italics: true,
            })],
            spacing: { after: 300 },
        }));

        // Horizontal line
        children.push(new D.Paragraph({
            children: [],
            border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: 'C9A84C' } },
            spacing: { after: 200 },
        }));

        // Parse narrative into paragraphs
        var lines = narrative.split('\n');
        lines.forEach(function (line) {
            var trimmed = line.trim();
            if (!trimmed) {
                children.push(new D.Paragraph({ children: [], spacing: { after: 100 } }));
                return;
            }

            // H2 headers
            if (trimmed.startsWith('## ')) {
                children.push(new D.Paragraph({
                    children: [new D.TextRun({
                        text: trimmed.replace(/^##\s*/, ''),
                        bold: true, size: 26, color: '0A2240', font: 'Calibri',
                    })],
                    spacing: { before: 300, after: 100 },
                }));
                return;
            }

            // H3 headers
            if (trimmed.startsWith('### ')) {
                children.push(new D.Paragraph({
                    children: [new D.TextRun({
                        text: trimmed.replace(/^###\s*/, ''),
                        bold: true, size: 22, color: '163A5F', font: 'Calibri',
                    })],
                    spacing: { before: 200, after: 80 },
                }));
                return;
            }

            // Bold text handling (**text**)
            var parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
            var runs = [];
            parts.forEach(function (part) {
                if (part.startsWith('**') && part.endsWith('**')) {
                    runs.push(new D.TextRun({
                        text: part.slice(2, -2),
                        bold: true, size: 21, font: 'Calibri', color: '0A2240',
                    }));
                } else if (part) {
                    runs.push(new D.TextRun({
                        text: part, size: 21, font: 'Calibri', color: '333333',
                    }));
                }
            });

            if (runs.length) {
                children.push(new D.Paragraph({
                    children: runs,
                    spacing: { after: 120 },
                }));
            }
        });

        // Footer
        children.push(new D.Paragraph({
            children: [],
            border: { bottom: { style: D.BorderStyle.SINGLE, size: 4, color: 'C9A84C' } },
            spacing: { before: 400, after: 100 },
        }));
        children.push(new D.Paragraph({
            children: [new D.TextRun({
                text: 'Generated by CPL Initiative Dashboard  |  ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                size: 16, color: '999999', font: 'Calibri', italics: true,
            })],
        }));

        var doc = new D.Document({
            sections: [{
                properties: {
                    page: {
                        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
                    },
                },
                children: children,
            }],
        });

        return doc;
    }

    // ── Main generate flow ──
    async function generateReport() {
        var sel = getSelectedData();
        if (!sel || !sel.projects.length) {
            setStatus('Please select at least one project.', '#c00');
            return;
        }

        var btn = document.getElementById('reportGenBtn');

        // Master mode — verbatim Workplan-style docx via master_report.js's
        // builder (consolidated from the retired filter-bar button, Session 97).
        if (reportType() === 'master') {
            generateMasterReport(sel, btn);
            return;
        }

        if (!PROXY_URL) {
            setStatus('Report proxy not configured. Contact your administrator.', '#c00');
            return;
        }

        btn.disabled = true;
        progressTo(5, 'Fetching the latest card updates…');

        try {
            // Pull the live overlays (posted updates + RACI leads) so the
            // prompt carries the current card data, not the build-time bake.
            var live = await fetchLiveOverlay();
            sel.projects = applyLiveOverlay(sel.projects, live);
            sel.activityUpdates = activityUpdatesFor(sel.projects, live.updates);

            progressTo(15, 'Building the prompt for ' + sel.projects.length + ' projects…');
            var prompt = buildPrompt(sel);
            progressTo(20, 'Writing the ' + (sel.audience.title || 'report') + ' — usually 15–30 seconds…');
            progressCreep(85);

            var narrative = await callClaude(prompt, elevationBand(sel.elevation).maxTokens);

            progressStopCreep();
            progressTo(90, 'Building the Word document…');

            ensureDocxLib(async function () {
                try {
                    var doc = buildDocx(narrative, sel.audience, sel.lastUpdated);
                    var blob = await window.docx.Packer.toBlob(doc);

                    // Download
                    var a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    var dateStr = new Date().toISOString().slice(0, 10);
                    a.download = 'CPL_' + (sel.audience.title || 'Report').replace(/[^A-Za-z0-9]+/g, '_') + '_' + dateStr + '.docx';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);

                    progressDone('Report downloaded!');
                } catch (docErr) {
                    progressFail('Error building document: ' + docErr.message);
                }
                btn.disabled = false;
                syncReportType();
            });
        } catch (err) {
            progressFail('Error: ' + err.message);
            btn.disabled = false;
            syncReportType();
        }
    }

    // ── Master report flow (no AI — verbatim workplan data) ──
    // Reuses master_report.js's fetchLiveOverlay/buildReportModel/renderDocx
    // with THIS modal's checkbox selection; the script lazy-loads on first use.
    function ensureMasterLib(cb) {
        if (window.CPL_MASTER_REPORT) { cb(); return; }
        var tabs = window.CPL_TABS;
        if (tabs && typeof tabs.loadScript === 'function') {
            tabs.loadScript('master_report.js', 'CPL_MASTER_REPORT', cb);
            return;
        }
        var s = document.createElement('script');
        s.src = 'master_report.js';
        s.onload = function () { cb(); };
        s.onerror = function () { cb(); };
        document.head.appendChild(s);
    }
    function generateMasterReport(sel, btn) {
        btn.disabled = true;
        progressTo(10, 'Loading the report builder…');
        ensureMasterLib(function () {
            var M = window.CPL_MASTER_REPORT;
            if (!M) {
                // Builder unavailable — fall back to the daily pre-built copy.
                progressFail('Builder unavailable — opening the pre-built master report instead.');
                window.location.href = 'reports/CPL_Master_Report.docx';
                btn.disabled = false; syncReportType();
                return;
            }
            progressTo(25, 'Fetching the latest card updates…');
            M.fetchLiveOverlay().then(function (live) {
                var pids = sel.projects.map(function (p) { return p.id; });
                var model = M.buildReportModel(window.CPL_DATA, pids, live);
                progressTo(60, 'Building the Word document…');
                ensureDocxLib(function () {
                    try {
                        var doc = M.renderDocx(model);
                        window.docx.Packer.toBlob(doc).then(function (blob) {
                            var a = document.createElement('a');
                            a.href = URL.createObjectURL(blob);
                            a.download = 'CPL_Master_Report_' + new Date().toISOString().slice(0, 10) + '.docx';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            progressDone('Master report downloaded!');
                            btn.disabled = false; syncReportType();
                        }).catch(function (err) {
                            progressFail('Error building document: ' + err.message);
                            btn.disabled = false; syncReportType();
                        });
                    } catch (err) {
                        progressFail('Error building document: ' + err.message);
                        btn.disabled = false; syncReportType();
                    }
                });
            });
        });
    }

    // ── Add "Custom Report" button to filter bar ──
    function addReportButton() {
        var filterBtns = document.getElementById('filterButtons');
        if (!filterBtns) return;
        // Check if already added
        if (document.getElementById('customReportBtn')) return;

        var btn = document.createElement('button');
        btn.id = 'customReportBtn';
        btn.innerHTML = '&#128202; Custom Report';
        btn.type = 'button';
        btn.style.cssText = "display:inline-flex;align-items:center;gap:0.3rem;background:var(--cobalt);color:#fff;border:none;padding:7px 16px;font-weight:600;cursor:pointer;border-radius:4px;font-size:0.85rem;font-family:'Source Sans 3',Arial,sans-serif;line-height:1.2;margin-left:0.5rem;transition:background 0.2s;";
        btn.onmouseover = function () { this.style.background = '#003B8E'; };
        btn.onmouseout = function () { this.style.background = 'var(--cobalt)'; };
        btn.addEventListener('click', openModal);
        filterBtns.appendChild(btn);
    }

    // Expose openModal globally so College Activity card can call it
    window.openReportModal = openModal;

    // Pure helpers exported for tests (window in the browser, module.exports
    // under the jsdom test runner) — the live-overlay wiring must stay guarded.
    var api = {
        latestByKey: latestByKey,
        raciByKey: raciByKey,
        leadNames: leadNames,
        applyLiveOverlay: applyLiveOverlay,
        activityUpdatesFor: activityUpdatesFor,
        buildPrompt: buildPrompt,
        fetchLiveOverlay: fetchLiveOverlay,
        // Session 97 additions (elevation / audience titles / naming rule)
        AUDIENCES: AUDIENCES,
        ELEVATION_BANDS: ELEVATION_BANDS,
        elevationBand: elevationBand,
        elevationGuidance: elevationGuidance,
        NAMING_RULE: NAMING_RULE,
    };
    if (typeof window !== 'undefined') window.CPL_CUSTOM_REPORT = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;

    // ── Initialize ──
    function init() {
        addReportButton();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    // Also try after a short delay (in case filter buttons are added dynamically)
    setTimeout(init, 600);
})();
