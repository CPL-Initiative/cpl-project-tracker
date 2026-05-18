/*
 * CPL Dashboard — College Custom Report Generator
 *
 * Sibling to report_generator.js, but scoped to the College Activity panel:
 * - User picks any subset of colleges from a tier-grouped checkbox list.
 * - Audience picker reuses the same six audiences as the project report.
 * - Per-college outcomes are compared against tier averages and statewide totals,
 *   both computed client-side from window.COLLEGE_ACTIVITY_DATA.
 * - The CPL Knowledge Base excerpt (window.CPL_KB, injected at pipeline build
 *   time from CPL-Initiative/cpl-knowledge-base) is included in the prompt so
 *   Claude's commentary is grounded in authoritative CPL framing.
 *
 * Requires:
 *   window.CPL_REPORT_PROXY_URL   — Cloudflare Worker proxy for Claude API
 *   window.COLLEGE_ACTIVITY_DATA  — per-college outcomes
 *   window.COLLEGE_DISCIPLINE_DETAIL — per-college discipline breakdown
 *   window.CPL_KB                 — KB excerpt (optional; omitted if missing)
 *   window.docx                   — docx library (lazy-loaded from docx.min.js)
 */

(function () {
    'use strict';

    var PROXY_URL = window.CPL_REPORT_PROXY_URL || '';
    var CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

    // ── Audience prompts (mirrors report_generator.js) ──
    var AUDIENCES = [
        { id: 'legislators',  label: 'State Legislators & Legislative Staff', prompt: 'Write for California state legislators and legislative staff. Emphasize ROI, fiscal impact, student outcomes, policy alignment with AB 1071 and Vision 2030, and statewide scale. Use formal but accessible language. Lead with measurable impact.' },
        { id: 'ccc_leaders',  label: "CCC System Leaders (Chancellor's Office, Presidents)", prompt: "Write for California Community College system leaders — the Chancellor's Office and college presidents. Emphasize strategic alignment with Vision 2030, institutional adoption metrics, implementation progress, and scalability across 116 colleges. Professional and strategic tone." },
        { id: 'faculty',      label: 'Faculty & Academic Senate', prompt: 'Write for faculty and academic senate members. Emphasize academic rigor, credit recommendation quality, faculty workgroup outcomes, discipline-specific progress, and how CPL maintains academic standards while expanding access. Collegial and evidence-based tone.' },
        { id: 'veterans',     label: 'Veterans & Military Partners', prompt: 'Write for military service members, veterans, and military education partners. Emphasize JST credit translation, military-specific CPL pathways, Star Colleges network, and how military training translates to college credit. Warm, respectful, action-oriented tone.' },
        { id: 'workforce',    label: 'Workforce & Industry Partners', prompt: 'Write for workforce development boards, employers, and industry partners. Emphasize skills-based credentials, apprenticeship pathways, industry-aligned credit recommendations, and how CPL bridges work experience to college credentials. Professional and outcome-focused.' },
        { id: 'general',      label: 'General Audience', prompt: 'Write for a general audience of education stakeholders. Use clear, accessible language. Explain acronyms on first use. Balance data with narrative. Highlight student impact and real-world outcomes.' },
    ];

    // ── Lazy-load docx library (shared file from CDN/local) ──
    var docxLoaded = false;
    function ensureDocxLib(cb) {
        if (docxLoaded || window.docx) { docxLoaded = true; cb(); return; }
        var s = document.createElement('script');
        s.src = 'docx.min.js';
        s.onload = function () { docxLoaded = true; cb(); };
        s.onerror = function () { alert('Failed to load docx library.'); };
        document.head.appendChild(s);
    }

    // ── Helpers ──
    function fmtNum(n) { return (n == null || isNaN(n)) ? '—' : Math.round(n).toLocaleString(); }
    function fmtPct(n) { return (n == null || isNaN(n)) ? '—' : (Math.round(n * 10) / 10) + '%'; }
    function fmtDollar(n) {
        if (n == null || isNaN(n)) return '—';
        if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
        if (n >= 1e6) return '$' + Math.round(n / 1e6) + 'M';
        if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
        return '$' + Math.round(n).toLocaleString();
    }

    function getRows() {
        // Prefer the full college list (so benchmarks are statewide); fall back to filtered.
        return (window._caAllData && window._caAllData.length) ? window._caAllData
             : (window.COLLEGE_ACTIVITY_DATA || []);
    }

    // ── Compute tier averages + statewide totals from the full college list ──
    var BENCHMARK_FIELDS = ['students','veterans','working_adults','apprentices',
        'eligible_units','transcribed_units','exhibits','credit_recs','disciplines',
        'savings','year_impact','trans_rate','criteria_met'];

    function computeBenchmarks() {
        var rows = getRows();
        var tiers = {};
        var statewide = { count: rows.length };
        BENCHMARK_FIELDS.forEach(function (f) { statewide[f] = 0; });
        rows.forEach(function (r) {
            var t = r.tier || 'Inactive';
            if (!tiers[t]) {
                tiers[t] = { count: 0 };
                BENCHMARK_FIELDS.forEach(function (f) { tiers[t][f] = 0; });
            }
            tiers[t].count++;
            BENCHMARK_FIELDS.forEach(function (f) {
                var v = +r[f] || 0;
                tiers[t][f] += v;
                statewide[f] += v;
            });
        });
        // Convert sums to averages (keep trans_rate as average, others as average per college).
        Object.keys(tiers).forEach(function (t) {
            var bucket = tiers[t];
            BENCHMARK_FIELDS.forEach(function (f) {
                bucket[f + '_avg'] = bucket.count ? bucket[f] / bucket.count : 0;
            });
        });
        BENCHMARK_FIELDS.forEach(function (f) {
            statewide[f + '_avg'] = statewide.count ? statewide[f] / statewide.count : 0;
        });
        return { tiers: tiers, statewide: statewide };
    }

    // ── Build the modal ──
    function buildModal() {
        var rows = getRows();
        if (!rows.length) return;

        // Group by tier (Leading, Advancing, Inactive)
        var tierOrder = ['Leading', 'Advancing', 'Inactive'];
        var grouped = {};
        tierOrder.forEach(function (t) { grouped[t] = []; });
        rows.forEach(function (r) {
            var t = grouped[r.tier] ? r.tier : 'Inactive';
            grouped[t].push(r);
        });
        // Sort within tier by students desc
        Object.keys(grouped).forEach(function (t) {
            grouped[t].sort(function (a, b) { return (b.students || 0) - (a.students || 0); });
        });

        var html = '';
        html += '<div id="collegeReportModal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.5);overflow-y:auto;padding:2rem;">';
        html += '<div style="max-width:760px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.2);overflow:hidden;font-family:\'Source Sans 3\',Arial,sans-serif;">';

        // Header
        html += '<div style="background:linear-gradient(135deg,#0A2240 0%,#163A5F 100%);padding:1.2rem 1.5rem;display:flex;justify-content:space-between;align-items:center;">';
        html += '<h2 style="margin:0;color:#fff;font-size:1.1rem;">College Custom Report Generator</h2>';
        html += '<button id="collegeReportModalClose" style="background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;padding:0;line-height:1;">&times;</button>';
        html += '</div>';

        html += '<div style="padding:1.5rem;max-height:70vh;overflow-y:auto;">';

        // Audience picker
        html += '<div style="margin-bottom:1.2rem;">';
        html += '<label style="font-weight:700;color:#0A2240;font-size:0.9rem;display:block;margin-bottom:0.4rem;">Target Audience</label>';
        html += '<select id="collegeReportAudience" style="width:100%;padding:8px 12px;border:1px solid #ccc;border-radius:4px;font-size:0.85rem;font-family:inherit;">';
        AUDIENCES.forEach(function (a) {
            html += '<option value="' + a.id + '">' + a.label + '</option>';
        });
        html += '</select></div>';

        // Selection controls
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;flex-wrap:wrap;gap:0.4rem;">';
        html += '<label style="font-weight:700;color:#0A2240;font-size:0.9rem;">Select Colleges</label>';
        html += '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;">';
        html += '<button class="crpt-sel-btn" data-action="all"      style="font-size:0.72rem;padding:3px 8px;border:1px solid #ccc;border-radius:3px;background:#f5f5f5;cursor:pointer;font-family:inherit;">All</button>';
        html += '<button class="crpt-sel-btn" data-action="filtered" style="font-size:0.72rem;padding:3px 8px;border:1px solid #ccc;border-radius:3px;background:#f5f5f5;cursor:pointer;font-family:inherit;">Currently Filtered</button>';
        html += '<button class="crpt-sel-btn" data-action="leading"  style="font-size:0.72rem;padding:3px 8px;border:1px solid #C9A84C;border-radius:3px;background:#fff8e6;cursor:pointer;font-family:inherit;color:#8a6a14;">Leading</button>';
        html += '<button class="crpt-sel-btn" data-action="stars"    style="font-size:0.72rem;padding:3px 8px;border:1px solid #C9A84C;border-radius:3px;background:#fff8e6;cursor:pointer;font-family:inherit;color:#8a6a14;">Star Colleges</button>';
        html += '<button class="crpt-sel-btn" data-action="none"     style="font-size:0.72rem;padding:3px 8px;border:1px solid #ccc;border-radius:3px;background:#f5f5f5;cursor:pointer;font-family:inherit;">Clear</button>';
        html += '</div></div>';

        // College checkbox list, grouped by tier
        tierOrder.forEach(function (tier) {
            var list = grouped[tier];
            if (!list.length) return;
            html += '<div style="margin-bottom:0.8rem;border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;">';
            html += '<div style="padding:0.4rem 0.8rem;background:#f0f4f8;font-weight:700;color:#0A2240;font-size:0.85rem;display:flex;justify-content:space-between;align-items:center;">';
            html += '<span>' + tier + ' <span style="color:#666;font-weight:400;">(' + list.length + ')</span></span>';
            html += '<button type="button" class="crpt-tier-toggle" data-tier="' + tier + '" style="font-size:0.7rem;padding:2px 8px;border:1px solid #aaa;border-radius:3px;background:#fff;cursor:pointer;font-family:inherit;">Toggle</button>';
            html += '</div>';
            html += '<div style="max-height:160px;overflow-y:auto;padding:0.4rem 0.8rem;">';
            list.forEach(function (r) {
                var key = encodeURIComponent(r.college);
                html += '<label style="display:flex;align-items:center;gap:0.5rem;padding:0.15rem 0;font-size:0.8rem;cursor:pointer;color:#333;">';
                html += '<input type="checkbox" class="crpt-college-cb" data-tier="' + tier + '" data-college="' + key + '" style="accent-color:#C9A84C;cursor:pointer;">';
                html += '<span style="flex:1;">' + r.college + '</span>';
                html += '<span style="color:#888;font-size:0.72rem;">' + fmtNum(r.students) + ' students</span>';
                html += '</label>';
            });
            html += '</div></div>';
        });

        // KB indicator
        var kbBytes = (window.CPL_KB || '').length;
        html += '<div style="margin:0.6rem 0;font-size:0.72rem;color:#666;">';
        html += (kbBytes
            ? '&#128218; CPL Knowledge Base attached (' + kbBytes.toLocaleString() + ' chars)'
            : '&#9888;&#65039; CPL Knowledge Base not loaded — commentary will be generic.');
        html += '</div>';

        // Status + Generate button
        html += '<div id="collegeReportStatus" style="font-size:0.82rem;color:#666;margin:0.8rem 0;min-height:1.2em;"></div>';
        html += '<button id="collegeReportGenBtn" style="width:100%;padding:10px;background:linear-gradient(135deg,#C9A84C,#FF9800);color:#000;border:none;border-radius:6px;font-weight:700;font-size:0.95rem;cursor:pointer;font-family:inherit;">Generate Report</button>';

        html += '</div></div></div>';

        var div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div.firstChild);

        wireModal();
    }

    function wireModal() {
        document.getElementById('collegeReportModalClose').onclick = closeModal;
        document.getElementById('collegeReportModal').addEventListener('click', function (e) {
            if (e.target.id === 'collegeReportModal') closeModal();
        });
        document.querySelectorAll('.crpt-sel-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { handleSelectAction(btn.getAttribute('data-action')); });
        });
        document.querySelectorAll('.crpt-tier-toggle').forEach(function (btn) {
            btn.addEventListener('click', function () { toggleTier(btn.getAttribute('data-tier')); });
        });
        document.getElementById('collegeReportGenBtn').addEventListener('click', generateReport);
    }

    function handleSelectAction(action) {
        var cbs = document.querySelectorAll('.crpt-college-cb');
        if (action === 'all') {
            cbs.forEach(function (cb) { cb.checked = true; });
        } else if (action === 'none') {
            cbs.forEach(function (cb) { cb.checked = false; });
        } else if (action === 'leading') {
            cbs.forEach(function (cb) { cb.checked = (cb.getAttribute('data-tier') === 'Leading'); });
        } else if (action === 'stars') {
            var rows = getRows();
            var starSet = {};
            rows.forEach(function (r) { if ((r.criteria_met || 0) >= 1) starSet[r.college] = true; });
            cbs.forEach(function (cb) {
                cb.checked = !!starSet[decodeURIComponent(cb.getAttribute('data-college'))];
            });
        } else if (action === 'filtered') {
            var filtered = window._caFilteredData || [];
            var set = {};
            filtered.forEach(function (r) { set[r.college] = true; });
            cbs.forEach(function (cb) {
                cb.checked = !!set[decodeURIComponent(cb.getAttribute('data-college'))];
            });
        }
    }

    function toggleTier(tier) {
        var cbs = document.querySelectorAll('.crpt-college-cb[data-tier="' + tier + '"]');
        var anyUnchecked = false;
        cbs.forEach(function (cb) { if (!cb.checked) anyUnchecked = true; });
        cbs.forEach(function (cb) { cb.checked = anyUnchecked; });
    }

    function openModal() {
        var m = document.getElementById('collegeReportModal');
        if (!m) { buildModal(); m = document.getElementById('collegeReportModal'); }
        if (m) m.style.display = 'block';
    }

    function closeModal() {
        var m = document.getElementById('collegeReportModal');
        if (m) m.style.display = 'none';
    }

    function setStatus(msg, color) {
        var el = document.getElementById('collegeReportStatus');
        if (el) { el.textContent = msg; el.style.color = color || '#666'; }
    }

    // ── Progress bar (replaces the Generate button while a report is in flight) ──
    var progressTimer = null;

    function ensureProgressUI() {
        if (document.getElementById('crpt-progress-css')) return;
        var css = document.createElement('style');
        css.id = 'crpt-progress-css';
        css.textContent =
            '@keyframes crpt-stripes { from { background-position: 0 0; } to { background-position: 40px 0; } }' +
            '.crpt-progress-track { width:100%;height:40px;background:#eee;border-radius:6px;overflow:hidden;position:relative;font-family:inherit; }' +
            '.crpt-progress-fill { position:absolute;top:0;bottom:0;left:0;width:0%;background-color:#C9A84C;' +
                'background-image:linear-gradient(135deg, rgba(255,255,255,0.28) 25%, transparent 25%, transparent 50%,' +
                ' rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.28) 75%, transparent 75%);' +
                'background-size:40px 40px;animation:crpt-stripes 1s linear infinite;transition:width 0.4s ease; }' +
            '.crpt-progress-label { position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
                'color:#0A2240;font-weight:700;font-size:0.9rem;z-index:1;pointer-events:none; }';
        document.head.appendChild(css);
    }

    function showProgress(label) {
        ensureProgressUI();
        var btn = document.getElementById('collegeReportGenBtn');
        if (!btn) return;
        var bar = document.getElementById('collegeReportGenProgress');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'collegeReportGenProgress';
            bar.className = 'crpt-progress-track';
            bar.innerHTML = '<div class="crpt-progress-fill"></div><div class="crpt-progress-label"></div>';
            btn.parentNode.insertBefore(bar, btn);
        }
        btn.style.display = 'none';
        bar.style.display = 'block';
        setProgress(0, label || 'Starting…');
    }

    function setProgress(pct, label) {
        var bar = document.getElementById('collegeReportGenProgress');
        if (!bar) return;
        var clamped = Math.min(100, Math.max(0, pct));
        var fill = bar.querySelector('.crpt-progress-fill');
        var lbl = bar.querySelector('.crpt-progress-label');
        if (fill) fill.style.width = clamped + '%';
        if (lbl) lbl.textContent = Math.round(clamped) + '%' + (label ? ' — ' + label : '');
    }

    function stopCreep() {
        if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
    }

    // Logarithmic creep from `fromPct` toward `toPct` over ~`tauMs` (asymptotic — never reaches `toPct`).
    function startCreep(fromPct, toPct, tauMs, label) {
        stopCreep();
        var start = Date.now();
        setProgress(fromPct, label);
        progressTimer = setInterval(function () {
            var elapsed = Date.now() - start;
            var eased = 1 - Math.exp(-elapsed / tauMs);
            setProgress(fromPct + (toPct - fromPct) * eased, label);
        }, 250);
    }

    function hideProgress() {
        stopCreep();
        var btn = document.getElementById('collegeReportGenBtn');
        var bar = document.getElementById('collegeReportGenProgress');
        if (bar) bar.style.display = 'none';
        if (btn) btn.style.display = 'block';
    }

    // ── Selection + prompt building ──
    function getSelected() {
        var rows = getRows();
        var byName = {};
        rows.forEach(function (r) { byName[r.college] = r; });
        var picked = [];
        document.querySelectorAll('.crpt-college-cb:checked').forEach(function (cb) {
            var name = decodeURIComponent(cb.getAttribute('data-college'));
            if (byName[name]) picked.push(byName[name]);
        });
        var aud = document.getElementById('collegeReportAudience').value;
        var audience = AUDIENCES.find(function (a) { return a.id === aud; }) || AUDIENCES[AUDIENCES.length - 1];
        return { colleges: picked, audience: audience };
    }

    function disciplinesFor(college) {
        var detail = (window.COLLEGE_DISCIPLINE_DETAIL || {})[college];
        if (!detail) return '';
        var parts = [];
        Object.keys(detail).forEach(function (d) {
            var v = detail[d];
            if (v && (v.credit_recs || v.exhibits)) {
                parts.push(d + ' (' + (v.credit_recs || 0) + ' recs, ' + (v.exhibits || 0) + ' exhibits)');
            }
        });
        return parts.join('; ');
    }

    function buildPrompt(sel, bench) {
        var kb = window.CPL_KB || '';
        var statewide = bench.statewide;
        var tiers = bench.tiers;

        var benchHeader = ''
            + '## Statewide Benchmarks (all ' + statewide.count + ' colleges)\n'
            + '- Students served: ' + fmtNum(statewide.students) + ' (avg ' + fmtNum(statewide.students_avg) + '/college)\n'
            + '- Veterans: ' + fmtNum(statewide.veterans) + ' (avg ' + fmtNum(statewide.veterans_avg) + '/college)\n'
            + '- Eligible units: ' + fmtNum(statewide.eligible_units) + ' (avg ' + fmtNum(statewide.eligible_units_avg) + '/college)\n'
            + '- Transcribed units: ' + fmtNum(statewide.transcribed_units) + ' (avg ' + fmtNum(statewide.transcribed_units_avg) + '/college)\n'
            + '- Credit recs: ' + fmtNum(statewide.credit_recs) + ' (avg ' + fmtNum(statewide.credit_recs_avg) + '/college)\n'
            + '- Savings: ' + fmtDollar(statewide.savings) + ' (avg ' + fmtDollar(statewide.savings_avg) + '/college)\n\n';

        ['Leading', 'Advancing', 'Inactive'].forEach(function (t) {
            var b = tiers[t]; if (!b) return;
            benchHeader += '### ' + t + ' tier (' + b.count + ' colleges, per-college averages)\n'
                + '- Students: ' + fmtNum(b.students_avg) + ' | Veterans: ' + fmtNum(b.veterans_avg)
                + ' | Eligible units: ' + fmtNum(b.eligible_units_avg) + ' | Transcribed: ' + fmtNum(b.transcribed_units_avg)
                + ' | Credit recs: ' + fmtNum(b.credit_recs_avg) + ' | Trans rate: ' + fmtPct(b.trans_rate_avg)
                + ' | Savings: ' + fmtDollar(b.savings_avg) + '\n';
        });

        var collegeBlocks = sel.colleges.map(function (c) {
            var tierBucket = tiers[c.tier] || { students_avg: 0, transcribed_units_avg: 0, credit_recs_avg: 0, savings_avg: 0 };
            var vsTierStudents = tierBucket.students_avg ? (c.students / tierBucket.students_avg) : null;
            var vsTierTrans    = tierBucket.transcribed_units_avg ? (c.transcribed_units / tierBucket.transcribed_units_avg) : null;
            var disc = disciplinesFor(c.college);
            return '### ' + c.college + ' (' + (c.district || '') + ')\n'
                + '- Tier: ' + c.tier + (c.criteria_met ? ' ⭐ (' + c.criteria_met + ' of 5 Star criteria met)' : '') + '\n'
                + '- Students served: ' + fmtNum(c.students)
                    + (vsTierStudents != null ? ' (' + vsTierStudents.toFixed(2) + 'x ' + c.tier + '-tier avg)' : '') + '\n'
                + '- Population mix: ' + fmtNum(c.veterans) + ' veterans, ' + fmtNum(c.working_adults) + ' working adults, ' + fmtNum(c.apprentices) + ' apprentices\n'
                + '- Eligible units: ' + fmtNum(c.eligible_units) + ' | Transcribed: ' + fmtNum(c.transcribed_units)
                    + ' (trans rate ' + fmtPct(c.trans_rate) + ')'
                    + (vsTierTrans != null ? ', ' + vsTierTrans.toFixed(2) + 'x ' + c.tier + '-tier avg transcribed' : '') + '\n'
                + '- MAP Exhibits: ' + fmtNum(c.exhibits) + ' | Credit recs: ' + fmtNum(c.credit_recs) + ' | Disciplines covered: ' + fmtNum(c.disciplines) + '\n'
                + '- Estimated savings: ' + fmtDollar(c.savings) + ' | 20-yr impact: ' + fmtDollar(c.year_impact) + '\n'
                + '- Last activity: ' + (c.last_activity_days != null ? c.last_activity_days + ' days ago' : 'unknown') + '\n'
                + (disc ? '- Discipline detail: ' + disc + '\n' : '');
        }).join('\n');

        var prompt = '';
        if (kb) {
            prompt += '# CPL Knowledge Base (authoritative context)\n\n' + kb + '\n\n---\n\n';
        }
        var isSingle = sel.colleges.length === 1;
        var titleSpec = isSingle
            ? 'The Word document is already titled "' + sel.colleges[0].college + ' CPL Update" — do NOT repeat the title in your output. Start directly with the `## Executive Summary` section.'
            : 'The Word document is already titled "Selected Colleges CPL Update" — do NOT repeat the title in your output. Within the report, use `##` for each per-college subsection titled "[College Name] CPL Update", and start the document with a brief group-level `## Executive Summary`.';

        prompt += '# College-Level CPL Update Brief\n\n'
            + '## Audience\n' + sel.audience.prompt + '\n\n'
            + benchHeader + '\n'
            + '## Selected Colleges (' + sel.colleges.length + ')\n' + collegeBlocks + '\n\n'
            + '## Instructions\n'
            + 'Write a concise, accessible **CPL Update** for the selected college(s). The reader is a busy college CEO, trustee, or board member who is always looking for bragging rights to share with constituents. Celebrate what the college has done, equip them with crisp talking points, and frame any gaps as opportunities waiting to be acted upon.\n\n'
            + '**Tone & framing rules (apply throughout):**\n'
            + '- CPL is a new endeavor for most California Community Colleges. Be grateful for any activity. Never imply that a college is negligent, behind, or failing.\n'
            + '- Reframe weaknesses, inactivity, and gaps as *opportunities* — funding and student impact waiting to be unlocked.\n'
            + '- Because state funding is predicated on specific outcomes, gently equip the reader with awareness of which actions maximize funding and student benefit. Invite, never scold.\n'
            + '- Eliminate redundancies. Do not restate the same metric in multiple sections.\n\n'
            + titleSpec + '\n\n'
            + 'Structure (use `##` for these section headers):\n'
            + '1. **Executive Summary** — Keep this high-level: 1-2 short paragraphs focused on the college\'s headline achievements and the single biggest opportunity ahead. No metric dump, no tier comparisons here — just the story a CEO would tell.\n'
            + '2. **Notable Accomplishments** — A bullet list of 3-6 concrete wins, each citing a real number from the data above (students served, units, savings, disciplines covered, veteran/working-adult reach, etc.). These are the bragging-rights bullets.\n'
            + '3. **Opportunities to Maximize Funding & Student Impact** — Bullets or short paragraphs that turn any gap into an invitation: low transcription rate → "opportunity to convert eligible units into credit on transcripts, unlocking more apportionment"; thin discipline coverage → "room to expand into high-demand disciplines like X"; limited veteran reach → "opportunity to deepen JST/military outreach." Tie each opportunity, where natural, to additional CPL funding or student benefit. Ground recommendations in the KB methodology.\n'
            + '4. **Next Steps** — 2-4 concrete, audience-appropriate suggestions. Short and actionable.\n\n'
            + 'Hard constraints:\n'
            + '- Use only the numbers provided. Do not invent metrics.\n'
            + '- Target **600-1,000 words total** (shorter is welcome for single colleges with limited data). Brevity is a feature.\n'
            + '- Use bullets for the Accomplishments and Opportunities sections. Use short paragraphs elsewhere.\n'
            + '- For multi-college reports, give each college its own `##` "[College Name] CPL Update" subsection but keep the per-college content tight — Executive Summary + Accomplishments + Opportunities only; consolidate Next Steps at the end.';
        return prompt;
    }

    // ── Claude call (mirrors report_generator.js) ──
    async function callClaude(prompt) {
        var url = PROXY_URL || 'https://api.anthropic.com/v1/messages';
        var headers = { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' };
        var body = JSON.stringify({
            model: CLAUDE_MODEL,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
        });
        var resp = await fetch(url, { method: 'POST', headers: headers, body: body });
        if (!resp.ok) {
            var errText = await resp.text();
            throw new Error('API error (' + resp.status + '): ' + errText.substring(0, 200));
        }
        var json = await resp.json();
        if (json.content && json.content[0] && json.content[0].text) return json.content[0].text;
        throw new Error('Unexpected API response format');
    }

    // ── .docx builder (matches the project report styling) ──
    function buildDocx(narrative, audience, colleges) {
        var D = window.docx;
        if (!D) { alert('docx library not loaded'); return null; }
        var children = [];
        var today = new Date().toISOString().slice(0, 10);
        var collegeCount = colleges.length;
        var docTitle = (collegeCount === 1)
            ? colleges[0].college + ' CPL Update'
            : 'Selected Colleges CPL Update';

        children.push(new D.Paragraph({
            children: [new D.TextRun({ text: docTitle, bold: true, size: 36, color: '0A2240', font: 'Calibri' })],
            spacing: { after: 100 },
        }));
        children.push(new D.Paragraph({
            children: [new D.TextRun({
                text: 'Prepared for: ' + audience.label + '  |  Colleges covered: ' + collegeCount + '  |  Generated: ' + today,
                size: 20, color: '666666', font: 'Calibri', italics: true,
            })],
            spacing: { after: 300 },
        }));
        children.push(new D.Paragraph({
            children: [],
            border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: 'C9A84C' } },
            spacing: { after: 200 },
        }));

        function buildInlineRuns(text) {
            var parts = text.split(/(\*\*[^*]+\*\*)/g);
            return parts.map(function (part) {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return new D.TextRun({ text: part.slice(2, -2), bold: true, size: 22, font: 'Calibri' });
                }
                return new D.TextRun({ text: part, size: 22, font: 'Calibri' });
            });
        }

        narrative.split('\n').forEach(function (line) {
            var t = line.trim();
            if (!t) { children.push(new D.Paragraph({ children: [], spacing: { after: 100 } })); return; }
            // Skip any stray top-level `# Title` heading (the doc already has its own title).
            if (/^#\s+/.test(t) && !/^#{2,}\s+/.test(t)) { return; }
            if (t.startsWith('## ')) {
                children.push(new D.Paragraph({
                    children: [new D.TextRun({ text: t.replace(/^##\s*/, ''), bold: true, size: 26, color: '0A2240', font: 'Calibri' })],
                    spacing: { before: 300, after: 100 },
                })); return;
            }
            if (t.startsWith('### ')) {
                children.push(new D.Paragraph({
                    children: [new D.TextRun({ text: t.replace(/^###\s*/, ''), bold: true, size: 22, color: '163A5F', font: 'Calibri' })],
                    spacing: { before: 200, after: 80 },
                })); return;
            }
            var bulletMatch = t.match(/^[-*]\s+(.+)$/);
            if (bulletMatch) {
                children.push(new D.Paragraph({
                    children: buildInlineRuns(bulletMatch[1]),
                    bullet: { level: 0 },
                    spacing: { after: 80 },
                })); return;
            }
            children.push(new D.Paragraph({ children: buildInlineRuns(t), spacing: { after: 120 } }));
        });

        return new D.Document({
            sections: [{ properties: { page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } }, children: children }],
        });
    }

    // ── Main flow ──
    async function generateReport() {
        var sel = getSelected();
        if (!sel.colleges.length) { setStatus('Please select at least one college.', '#c00'); return; }
        if (!PROXY_URL) { setStatus('Report proxy not configured. Contact your administrator.', '#c00'); return; }

        var btn = document.getElementById('collegeReportGenBtn');
        btn.disabled = true;
        showProgress('Computing benchmarks…');
        setStatus('Computing benchmarks across ' + getRows().length + ' colleges...', '#4A90D9');

        try {
            var bench = computeBenchmarks();
            setProgress(8, 'Building prompt…');
            var prompt = buildPrompt(sel, bench);
            setProgress(15, 'Calling Claude (15-60 seconds)…');
            setStatus('Calling Claude — this may take 15-60 seconds for ' + sel.colleges.length + ' colleges...', '#4A90D9');
            // Asymptotic creep from 15% → ~85% during the long Claude call.
            // tau scales with college count: ~25s for 1 college, ~50s for many.
            var tauMs = Math.min(60000, 20000 + sel.colleges.length * 4000);
            startCreep(15, 85, tauMs, 'Calling Claude (15-60 seconds)…');
            var narrative = await callClaude(prompt);
            stopCreep();
            setProgress(88, 'Building Word document…');
            setStatus('Building Word document...', '#4A90D9');
            ensureDocxLib(async function () {
                try {
                    var doc = buildDocx(narrative, sel.audience, sel.colleges);
                    setProgress(95, 'Packaging .docx…');
                    var blob = await window.docx.Packer.toBlob(doc);
                    setProgress(99, 'Downloading…');
                    var a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    var dateStr = new Date().toISOString().slice(0, 10);
                    var slug = (sel.colleges.length === 1)
                        ? sel.colleges[0].college.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '')
                        : 'Selected_Colleges';
                    a.download = slug + '_CPL_Update_' + dateStr + '.docx';
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    setProgress(100, 'Done');
                    setStatus('Report downloaded.', '#2A7D4F');
                    setTimeout(hideProgress, 900);
                } catch (e) {
                    hideProgress();
                    setStatus('Error building document: ' + e.message, '#c00');
                }
                btn.disabled = false;
            });
        } catch (err) {
            hideProgress();
            setStatus('Error: ' + err.message, '#c00');
            btn.disabled = false;
        }
    }

    // Expose for college_activity.js
    window.openCollegeReportModal = openModal;
})();
